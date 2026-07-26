import { Task, TaskResult } from '@modules/workflow/types/Task'
import { Member } from '@t/Member';

export default class InviteToVaultwarden extends Task {
    label = 'Invite user to Vaultwarden';

    async run(_member: Member): Promise<TaskResult> {
        // TODO
        return this.TaskSuccess({
            feedback: `TODO`
        })
    }
}
