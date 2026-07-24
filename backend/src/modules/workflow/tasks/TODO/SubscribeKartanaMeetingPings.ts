import { Task, TaskResult } from '@modules/workflow/types/Task'
import { Member } from '@t/Member';

export default class SubscribeKartanaMeetingPings extends Task {
    label = 'Subscribe user to Kartana meeting pings';

    async run(_member: Member): Promise<TaskResult> {
        // TODO
        return this.TaskSuccess({
            feedback: `TODO`
        })
    }
}
