import { Task, TaskResult } from '@modules/workflow/types/Task'
import { WorkflowContext } from "../../types/WorkflowContext";
import { toError } from '@lib/error';
import { KartanaAssignResponse } from '@modules/workflow/types/Response';

const kartanaBaseUrl = process.env.KARTANA_BASE_URL;

export default class AssignKartanaRoles extends Task {
    label = 'Assign Discord roles through Kartana';

    async run(ctx: WorkflowContext): Promise<TaskResult> {
        //WORK IN PROGRESS
        const { member } = ctx;

        const userId = member.discordUserId;
        const team = member.team;
        const position = member.position;

        try {
            const response = await fetch(`${kartanaBaseUrl}/assign`, {
                method: 'POST',
                body: JSON.stringify({userId, team, position}),
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const { success }:KartanaAssignResponse = await response.json();
            
            if(!success){
                throw new Error('Discord roles do not exist for this team or position.')
            }

            return this.TaskSuccess({
                feedback: `Successfully assigned ${member.firstName} with discord ID ${member.discordUserId} roles for their team ${member.team} or position ${member.position}`
            })

        } catch (err){

            return this.TaskFailure({
                error: toError(err),
                feedback: `Failed to assign ${member.firstName} with discord ID ${member.discordUserId} roles for their team ${member.team} or position ${member.position}`,
            })
        }

        
    
    }
}
