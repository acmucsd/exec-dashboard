import { Task, TaskResult } from '@modules/workflow/types/Task'
import { WorkflowContext } from "../../types/WorkflowContext";

export default class InviteToVaultwarden extends Task {
    label = 'Invite user to Vaultwarden';

    async run(ctx: WorkflowContext): Promise<TaskResult> {
        // TODO
        return this.TaskSuccess({
            feedback: `TODO`
        })
    }
}
