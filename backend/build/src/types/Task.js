export class Task {
    TaskSuccess(params) {
        console.log(`[${this.id}] OK: ${params.feedback}`);
        return {
            success: true,
            feedback: params.feedback,
            data: params.data,
        };
    }
    TaskFailure(params) {
        console.error(`[${this.id}] FAIL: ${params.feedback}`, params.error);
        return {
            success: false,
            feedback: params.feedback,
            error: params.error,
        };
    }
}
