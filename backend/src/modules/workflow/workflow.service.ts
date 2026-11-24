import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Member } from '@t/Member';
import { Repository } from 'typeorm';
import {
  MemberEntity,
  PendingSnapshotWorkflow,
} from '@modules/domain/member/member.entity';
import { WorkflowDefRegistry, WorkflowId } from './workflowDefRegistry';
import { WorkflowTaskPreview } from './types/Task';
import { TaskId } from './taskRegistry';
import { redactError } from '@lib/error';

@Injectable()
export class WorkflowService {
  constructor(
    @InjectRepository(MemberEntity)
    private readonly memberRepository: Repository<MemberEntity>,
  ) {}

  async createMember(member: Member): Promise<Member> {
    return this.runWorkflow(member, this.workflowIdForCreate(member));
  }

  async previewCreateMember(member: Member): Promise<WorkflowTaskPreview[]> {
    return WorkflowDefRegistry.instantiate(
      this.workflowIdForCreate(member),
    ).preview(member);
  }

  async updateMember(member: Member): Promise<Member> {
    return this.runWorkflow(member, WorkflowId.UpdateMember);
  }

  async previewUpdateMember(member: Member): Promise<WorkflowTaskPreview[]> {
    return WorkflowDefRegistry.instantiate(WorkflowId.UpdateMember).preview(
      member,
    );
  }

  async previewSnapshotMember(
    member: Member,
    existing?: MemberEntity,
  ): Promise<WorkflowTaskPreview[]> {
    if (!existing) return this.previewCreateMember(member);
    if (!existing.pendingSnapshotWorkflow)
      return this.previewUpdateMember(member);

    // has pending workflow
    const { workflowId, includeSetupEmail } = this.snapshotWorkflow(
      existing.pendingSnapshotWorkflow,
      false,
    );

    if (includeSetupEmail) {
      this.assertSetupCredentials(existing, member);
    }

    const tasks = await WorkflowDefRegistry.instantiate(workflowId, {
      includeSetupEmail,
    }).preview(member);
    return tasks.map((task) =>
      task.taskId === TaskId.SendAccountSetupEmail
        ? {
            ...task,
            description: `${task.description} The previous send was not confirmed; this may resend an email.`,
          }
        : task,
    );
  }

  async runSnapshotMember(
    member: MemberEntity,
    action: 'create' | 'update',
  ): Promise<void> {
    const { workflowId, includeSetupEmail } = this.snapshotWorkflow(
      member.pendingSnapshotWorkflow,
      action === 'create',
    );

    await this.runWorkflow(member as Member, workflowId, {
      snapshot: true,
      includeSetupEmail,
    });
    await this.memberRepository.update(member.id, {
      pendingSnapshotWorkflow: null,
    });
  }

  private snapshotWorkflow(
    checkpoint: PendingSnapshotWorkflow | null,
    allowInitialProvisioning: boolean,
  ): { workflowId: WorkflowId; includeSetupEmail: boolean } {
    switch (checkpoint?.stage) {
      case 'sync_pending':
      case 'setup_email_pending':
        return {
          workflowId: WorkflowId.UpdateMember,
          includeSetupEmail: checkpoint.stage === 'setup_email_pending',
        };
      case 'provisioning_pending':
        if (allowInitialProvisioning) {
          return {
            workflowId: WorkflowId.CreateMember,
            includeSetupEmail: false,
          };
        }
        throw new Error(
          'ACM account provisioning may have succeeded without a saved address. Reconcile the account manually before retrying.',
        );
      default:
        throw new Error('Snapshot recovery checkpoint is missing or invalid.');
    }
  }

  private assertSetupCredentials(
    member: MemberEntity,
    target: Pick<Member, 'acmEmail' | 'email'> = member,
  ): void {
    const checkpoint = member.pendingSnapshotWorkflow;
    if (
      checkpoint?.stage !== 'setup_email_pending' ||
      checkpoint.acmEmail !== member.acmEmail ||
      checkpoint.acmEmail !== target.acmEmail ||
      !checkpoint.recipientEmail ||
      checkpoint.recipientEmail !== member.email ||
      checkpoint.recipientEmail !== target.email ||
      !member.setupPassword
    ) {
      throw new Error(
        'Saved setup credentials do not match the ACM address and personal email. Reconcile the account manually before retrying.',
      );
    }
  }

  private runWorkflow(
    member: Member,
    workflowId: WorkflowId,
    { snapshot = false, includeSetupEmail = false } = {},
  ): Promise<Member> {
    return WorkflowDefRegistry.instantiate(workflowId, {
      includeSetupEmail,
    }).run(
      member,
      (id, taskId) => this.loadMemberForWorkflow(id, taskId, snapshot),
      (m, taskId, patch) => this.persistTaskSuccess(m, taskId, patch, snapshot),
    );
  }

  private workflowIdForCreate(member: Member): WorkflowId {
    return member.acmEmail ? WorkflowId.UpdateMember : WorkflowId.CreateMember;
  }

  private async persistTaskSuccess(
    member: Member,
    taskId: TaskId,
    patch: Partial<Member> | undefined,
    snapshot: boolean,
  ): Promise<void> {
    let update: Partial<MemberEntity> | undefined = patch;
    if (snapshot && taskId === TaskId.CreateOrgEmail) {
      if (!patch?.acmEmail || !patch.setupPassword) {
        throw new Error(
          'Provisioning did not return setup credentials. Reconcile the account manually before retrying.',
        );
      }
      update = {
        ...patch,
        pendingSnapshotWorkflow: {
          stage: 'setup_email_pending',
          acmEmail: patch.acmEmail,
          recipientEmail: member.email,
        },
      };
    } else if (snapshot && taskId === TaskId.SendAccountSetupEmail) {
      update = { pendingSnapshotWorkflow: { stage: 'sync_pending' } };
    }

    if (!update) return;

    try {
      await this.memberRepository.update(member.id, update);
    } catch (error) {
      throw update.setupPassword
        ? redactError(error, update.setupPassword)
        : error;
    }
  }

  private async loadMemberForWorkflow(
    id: number,
    taskId: TaskId | undefined,
    snapshot: boolean,
  ): Promise<Member> {
    const query = this.memberRepository
      .createQueryBuilder('member')
      .where('member.id = :id', { id });

    const isSetup = taskId === TaskId.SendAccountSetupEmail;

    if (isSetup) {
      query.addSelect('member.setupPassword');

      if (snapshot) {
        query.addSelect('member.pendingSnapshotWorkflow');
      }
    }

    const member = await query.getOne();
    if (!member) {
      throw new Error(`Member with id ${id} not found`);
    }

    if (isSetup && snapshot) {
      this.assertSetupCredentials(member);
    }

    return member as Member;
  }
}
