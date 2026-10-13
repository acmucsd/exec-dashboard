import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MemberEntity } from './member.entity';
import { Member } from '@t/Member';
import { WorkflowService } from '@modules/workflow/workflow.service';
import { WorkflowTaskPreview } from '@modules/workflow/types/Task';

type WorkflowAction = 'create' | 'update' | 'delete';
type PendingConfirmation = {
  action: WorkflowAction;
  memberId: number | null;
  payloadKey: string;
  expiresAt: number;
};

@Injectable()
export class MemberService {
  private readonly pendingConfirmations = new Map<string, PendingConfirmation>();

  constructor(
    @InjectRepository(MemberEntity)
    private readonly memberRepository: Repository<MemberEntity>,
    private readonly workflowService: WorkflowService,
  ) {}

  // Methods

  async findAll(): Promise<MemberEntity[]> {
    return this.memberRepository.find();
  }

  async findOne(id: number): Promise<MemberEntity> {
    const member = await this.memberRepository.findOne({ where: { id } });
    if (!member) {
      throw new NotFoundException(`Member with id ${id} not found`);
    }
    return member;
  }

  async previewCreate(memberDraft: Omit<Member, 'id'>) {
    const member = { ...memberDraft, id: 0 } as Member;
    const tasks = await this.workflowService.previewCreateMember(member);
    return this.issueConfirmation('create', null, memberDraft, tasks, `Create ${member.firstName} ${member.lastName}.`);
  }

  async previewUpdate(id: number, memberPatch: Partial<Member>) {
    const member = Object.assign(await this.findOne(id), memberPatch);
    const tasks = await this.workflowService.previewUpdateMember(member as Member);
    return this.issueConfirmation('update', id, memberPatch, tasks, `Update ${member.firstName} ${member.lastName}.`);
  }

  async previewRemove(id: number) {
    const member = await this.findOne(id);
    return this.issueConfirmation(
      'delete',
      id,
      { id },
      [],
      `Delete ${member.firstName} ${member.lastName} from the member directory.`,
    );
  }

  async create(
    memberToBeCreated: Member,
    confirmationId?: string,
  ): Promise<MemberEntity> {
    this.consumeConfirmation('create', null, memberToBeCreated, confirmationId);
    const member = this.memberRepository.create(
      memberToBeCreated as MemberEntity,
    );
    const saved = await this.memberRepository.save(member);
    await this.workflowService.createMember(saved as Member);
    return this.findOne(saved.id);
  }

  async update(
    id: number,
    memberPatch: Partial<Member>,
    confirmationId?: string,
  ): Promise<MemberEntity> {
    this.consumeConfirmation('update', id, memberPatch, confirmationId);
    const member = await this.findOne(id);
    Object.assign(member, memberPatch);
    await this.memberRepository.save(member);
    await this.workflowService.updateMember(member as Member);
    return this.findOne(id);
  }

  async remove(id: number, confirmationId?: string): Promise<void> {
    this.consumeConfirmation('delete', id, { id }, confirmationId);
    const result = await this.memberRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Member with id ${id} not found`);
    }
  }

  private issueConfirmation(
    action: WorkflowAction,
    memberId: number | null,
    payload: object,
    tasks: WorkflowTaskPreview[],
    summary: string,
  ) {
    const now = Date.now();
    for (const [id, confirmation] of this.pendingConfirmations) {
      if (confirmation.expiresAt <= now) this.pendingConfirmations.delete(id);
    }
    const confirmationId = randomUUID();
    this.pendingConfirmations.set(confirmationId, {
      action,
      memberId,
      payloadKey: this.payloadKey(payload),
      expiresAt: now + 15 * 60 * 1000,
    });
    return { confirmationId, summary, tasks };
  }

  private consumeConfirmation(
    action: WorkflowAction,
    memberId: number | null,
    payload: object,
    confirmationId?: string,
  ): void {
    const confirmation = confirmationId
      ? this.pendingConfirmations.get(confirmationId)
      : undefined;
    if (confirmationId) this.pendingConfirmations.delete(confirmationId);

    if (
      !confirmation ||
      confirmation.expiresAt <= Date.now() ||
      confirmation.action !== action ||
      confirmation.memberId !== memberId ||
      confirmation.payloadKey !== this.payloadKey(payload)
    ) {
      throw new ConflictException(
        'A matching workflow preview is required before applying this change.',
      );
    }
  }

  private payloadKey(payload: object): string {
    return JSON.stringify(
      Object.fromEntries(
        Object.entries(payload).sort(([left], [right]) =>
          left.localeCompare(right),
        ),
      ),
    );
  }
}
