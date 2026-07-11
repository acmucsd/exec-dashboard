import { Task, TaskResult } from '@modules/workflow/types/Task'
import { WorkflowContext } from "../../types/WorkflowContext";

export default class AssignKartanaRoles extends Task {
    label = 'Assign Discord roles through Kartana';

    async run(ctx: WorkflowContext): Promise<TaskResult> {
        // TODO
        return this.TaskSuccess({
            feedback: `TODO`
        })
    }
}
