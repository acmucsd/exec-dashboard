import { UnprocessableEntityException } from '@nestjs/common';
import { Member } from '../../../types/Member';
import { TaskPreview, WorkflowTaskPreview } from './Task';
import { TaskId, TaskRegistry } from '../taskRegistry';

export interface WorkflowStepDefinition {
  taskId: TaskId;
  next?: WorkflowStepDefinition[];
}

export class WorkflowDefinition {
  constructor(public readonly steps: WorkflowStepDefinition[]) {}

  instantiate(): Workflow {
    return new Workflow(this.steps);
  }
}

export type LoadMember = (id: number) => Promise<Member>;

export type PersistMemberPatch = (
  member: Member,
  patch: Partial<Member>,
) => Promise<void>;

export class Workflow {
  constructor(private workflowSteps: WorkflowStepDefinition[]) {}

  async run(
    // initial call
    member: Member,
    loadMember: LoadMember,
    persistMemberPatch: PersistMemberPatch,
  ): Promise<Member> {
    const memberId = member.id;
    await Promise.all(
      this.workflowSteps.map((step) =>
        this.executeStep(step, memberId, loadMember, persistMemberPatch),
      ),
    );
    return loadMember(memberId);
  }

  async preview(member: Member): Promise<WorkflowTaskPreview[]> {
    const previews = await Promise.all(
      this.workflowSteps.map((step) => this.previewStep(step, member)),
    );
    return previews.flat();
  }

  private async previewStep(
    step: WorkflowStepDefinition,
    member: Member,
  ): Promise<WorkflowTaskPreview[]> {
    const task = TaskRegistry.getTask(step.taskId);
    let preview: TaskPreview;
    try {
      preview = await task.preview(member);
    } catch (err) {
      throw new UnprocessableEntityException(
        err instanceof Error ? err.message : String(err),
      );
    }
    const taskPreview: WorkflowTaskPreview = {
      taskId: step.taskId,
      label: task.label,
      requiresConfirmation: task.requiresConfirmation,
      ...preview,
    };
    const nextPreviews = step.next
      ? await Promise.all(
          step.next.map((next) =>
            this.previewStep(next, { ...member, ...preview.memberPatch }),
          ),
        )
      : [];

    return [taskPreview, ...nextPreviews.flat()];
  }

  private async executeStep(
    // each step, recursive
    step: WorkflowStepDefinition,
    memberId: number,
    loadMember: LoadMember,
    persistMemberPatch: PersistMemberPatch,
  ): Promise<void> {
    const member = await loadMember(memberId);
    const task = TaskRegistry.getTask(step.taskId);
    const result = await task.run(member);

    if (!result.success) {
      throw new UnprocessableEntityException(
        result.error?.message ?? result.feedback,
      );
    }

    if (result.memberPatch) {
      await persistMemberPatch(member, result.memberPatch);
    }

    if (step.next) {
      await Promise.all(
        step.next.map((next) =>
          this.executeStep(next, memberId, loadMember, persistMemberPatch),
        ),
      );
    }
  }
}
