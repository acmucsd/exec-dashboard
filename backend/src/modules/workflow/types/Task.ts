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

export abstract class Task {
  abstract readonly label: string;
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
