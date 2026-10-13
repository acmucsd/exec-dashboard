import { Member } from '../../../types/Member';

export type TaskResult =
  | {
      success: true;
      feedback: string;
      memberPatch?: Partial<Member>;
    }
  | {
      success: false;
      feedback: string;
      error: Error | null;
    };

export type TaskPreview = {
  description: string;
  requiresConfirmation?: boolean;
  memberPatch?: Partial<Member>;
};

export type WorkflowTaskPreview = TaskPreview & {
  taskId: string;
  label: string;
  requiresConfirmation: boolean;
};

export abstract class Task {
  abstract readonly label: string;
  abstract readonly requiresConfirmation: boolean;
  abstract preview(member: Member): Promise<TaskPreview>;
  abstract run(member: Member): Promise<TaskResult>;

  protected TaskSuccess(params: {
    feedback: string;
    memberPatch?: Partial<Member>;
  }): TaskResult {
    console.log(`[${this.label}] OK: ${params.feedback}`);
    return {
      success: true,
      feedback: params.feedback,
      memberPatch: params.memberPatch,
    };
  }

  protected TaskFailure(params: {
    error: Error;
    feedback: string;
  }): TaskResult {
    console.error(`[${this.label}] FAIL: ${params.feedback}`, params.error);
    return {
      success: false,
      feedback: params.feedback,
      error: params.error,
    };
  }
}
