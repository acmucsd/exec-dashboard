import { Task, TaskResult } from '@modules/workflow/types/Task'
import { Member } from '@t/Member';

export default class AssignKartanaRoles extends Task {
    label = 'Assign Discord roles through Kartana';

    async run(_member: Member): Promise<TaskResult> {
        // TODO
        return this.TaskSuccess({
            feedback: `TODO`
        })
    }
}
