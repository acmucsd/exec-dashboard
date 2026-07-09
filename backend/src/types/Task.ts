export type Service = 
    "kartana" | 
    "portal" | 
    "google" | 
    "notion" | 
    "github" | 
    "vaultwarden" |
    "ses"

export type TaskResult<Result> = (
    {
        success: true,
        feedback: string,
        data: Result,
    } | 
    {
        success: false,
        feedback: string,
        error: Error | null,
    }
)

export abstract class Task<Params = {}, Result = {}> {
    abstract id: string;
    abstract label: string;
    abstract services: Service[];
    abstract run(params: Params): Promise<TaskResult<Result>>;

    protected TaskSuccess(params: {
        data: Result,
        feedback: string
    }): TaskResult<Result> {
        console.log(`[${this.id}] OK: ${params.feedback}`)
        return {
            success: true,
            feedback: params.feedback,
            data: params.data,
        }
    }

    protected TaskFailure(params: {
        error: Error | null,
        feedback: string
    }): TaskResult<Result> {
        console.error(`[${this.id}] FAIL: ${params.feedback}`, params.error)
        return {
            success: false,
            feedback: params.feedback,
            error: params.error,
        }
    }
}