import { toError } from '@lib/error';
import { KartanaAssignResponse } from '@modules/workflow/types/Response';
import { Task, TaskResult } from '@modules/workflow/types/Task'
import { Member } from '@t/Member';

export default class AssignKartanaRoles extends Task {
    label = 'Assign Discord roles through Kartana';

    async run(member: Member): Promise<TaskResult> {
        const username = member.discordUserId;
        const team = member.team;
        const position = member.position;

        try {
            const response = await fetch(`${process.env.KARTANA_INTERNAL_URL}/assign`, {
                method: 'POST',
                body: JSON.stringify({username, team, position}),
                headers: {
                    "Content-Type": "application/json",
                },
            });
           if (!response.ok) {
                const errorBody = await response.text();
                console.error('Kartana error body:', errorBody);
                throw new Error(`Kartana returned ${response.status}: ${errorBody}`);
            }
            const { success }:KartanaAssignResponse = await response.json();

            if(!success){
                throw new Error('Discord roles do not exist for this team or position.')
            }

            return this.TaskSuccess({
                feedback: `Successfully assigned ${member.firstName} ${member.lastName} with discord ID ${member.discordUserId} roles for their team ${member.team} or position ${member.position}`
            })

        } catch (err){

            return this.TaskFailure({
                error: toError(err),
                feedback: `Failed to assign ${member.firstName} ${member.lastName} with discord ID ${member.discordUserId} roles for their team ${member.team} or position ${member.position}`,
            })
        }
    }
}
