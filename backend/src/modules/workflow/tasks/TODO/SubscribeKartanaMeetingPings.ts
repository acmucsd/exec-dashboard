import { Task, TaskResult } from '@modules/workflow/types/Task'
import { WorkflowContext } from "../../types/WorkflowContext";

export default class SubscribeKartanaMeetingPings extends Task {
    label = 'Subscribe user to Kartana meeting pings';

    async run(ctx: WorkflowContext): Promise<TaskResult> {
        // TODO
        return this.TaskSuccess({
            feedback: `TODO`
        })
    }
}
