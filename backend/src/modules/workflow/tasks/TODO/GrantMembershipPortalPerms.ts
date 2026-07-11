import { Task, TaskResult } from '@modules/workflow/types/Task'
import { WorkflowContext } from "../../types/WorkflowContext";

export default class GrantMembershipPortalPerms extends Task {
    label = 'Grant permissions to user\'s acmucsd account in Membership Portal';

    async run(ctx: WorkflowContext): Promise<TaskResult> {
        // TODO
        return this.TaskSuccess({
            feedback: `TODO`
        })
    }
}
