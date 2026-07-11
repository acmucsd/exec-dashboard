import { Member } from "../../../types/Member";
import { WorkflowContext } from "./WorkflowContext";

export type TaskResult = (
    {
        success: true,
        feedback: string,
        memberPatch?: Partial<Member>,
        secretsPatch?: Record<string, string>, // for storing things like temporary password
    } |
    {
        success: false,
        feedback: string,
        error: Error | null,
    }
)

export abstract class Task {
    abstract readonly label: string;
    abstract run(params: WorkflowContext): Promise<TaskResult>;

    protected TaskSuccess(params: {
        feedback: string,
        memberPatch?: Partial<Member>,
        secretsPatch?: Record<string, string>
    }): TaskResult {
        console.log(`[${this.label}] OK: ${params.feedback}`)
        return {
            success: true,
            feedback: params.feedback,
            memberPatch: params.memberPatch,
            secretsPatch: params.secretsPatch
        }
    }

    protected TaskFailure(params: {
        error: Error,
        feedback: string
    }): TaskResult {
        console.error(`[${this.label}] FAIL: ${params.feedback}`, params.error)
        return {
            success: false,
            feedback: params.feedback,
            error: params.error,
        }
    }
}