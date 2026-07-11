
import { Task, TaskResult } from '@modules/workflow/types/Task'
import { WorkflowContext } from "../../types/WorkflowContext";

export default class SendBoardAcceptanceEmail extends Task {
    label = 'Send Board acceptance email';

    async run(ctx: WorkflowContext): Promise<TaskResult> {
        // TODO
        return this.TaskSuccess({
            feedback: `TODO`
        })
    }
}
