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

export type LoadMember = (id: number, taskId?: TaskId) => Promise<Member>;

export type OnTaskSuccess = (
  member: Member,
  taskId: TaskId,
  patch?: Partial<Member>,
) => Promise<void>;

export class Workflow {
  constructor(private workflowSteps: WorkflowStepDefinition[]) {}

  async run(
    // initial call
    member: Member,
    loadMember: LoadMember,
    onTaskSuccess: OnTaskSuccess,
  ): Promise<Member> {
    await this.executeSteps(
      this.workflowSteps,
      member.id,
      loadMember,
      onTaskSuccess,
    );
    return loadMember(member.id);
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
      requiresConfirmation:
        preview.requiresConfirmation ?? task.requiresConfirmation,
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

  private async executeSteps(
    steps: WorkflowStepDefinition[],
    memberId: number,
    loadMember: LoadMember,
    onTaskSuccess: OnTaskSuccess,
  ): Promise<void> {
    const started = steps.map((step) =>
      this.executeStep(step, memberId, loadMember, onTaskSuccess),
    );
    try {
      await Promise.all(started);
    } catch (error) {
      await Promise.allSettled(started);
      throw error;
    }
  }

  private async executeStep(
    step: WorkflowStepDefinition,
    memberId: number,
    loadMember: LoadMember,
    onTaskSuccess: OnTaskSuccess,
  ): Promise<void> {
    const member = await loadMember(memberId, step.taskId);
    const task = TaskRegistry.getTask(step.taskId);
    const result = await task.run(member);

    if (!result.success) {
      throw new UnprocessableEntityException(
        result.error?.message ?? result.feedback,
      );
    }

    await onTaskSuccess(member, step.taskId, result.memberPatch);
    if (step.next) {
      await this.executeSteps(step.next, memberId, loadMember, onTaskSuccess);
    }
  }
}
