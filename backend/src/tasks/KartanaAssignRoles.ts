import { SendMessageCommand } from '@aws-sdk/client-sqs'
import { sqs } from '../clients/sqs'
import { Member } from '../types/Member'
import { Task, TaskResult } from '../types/Task'
import { ACMPosition, ACMTeam } from '../types/ACM'
import { SQSMessageGeneric } from '../types/Transport'

type Params = { 
    member: Member
}
type Result = {}

interface SQSMessage extends SQSMessageGeneric { 
    type: 'assign_roles'; 
    payload: { 
        discordUserId: string; 
        team: ACMTeam; 
        position: ACMPosition 
    } 
};

/*
Returns true if Kartana's subscribe command ran successfully.
Returns false otherwise.
*/
export default class KartanaAssignRoles extends Task<Params, Result> {
    id = 'kartana_assign_roles'
    label = 'Assigns roles to user based on team and position'
    services: ['kartana']

    async run(params: Params): Promise<TaskResult<Result>> {
        const { member } = params;

        const discordUserId = member.discordUserId;
        const team = member.team;
        const position = member.position;
        const fullName = `${member.firstName} ${member.lastName}`;

        if (!discordUserId) {
            return this.TaskFailure({
                error: new Error(`Member ${fullName} has no linked Discord account.`),
                feedback: `Cannot subscribe ${fullName} to meeting pings: no Discord account linked.`,
            });
        }

        try {
            await sqs.send(
                new SendMessageCommand({
                    QueueUrl: process.env.SQS_DISCORD_QUEUE_URL,
                    MessageBody: JSON.stringify({
                        type: 'assign_roles',
                        payload: { discordUserId, team, position },
                    } as SQSMessage),
                    MessageGroupId: 'workflow',
                }),
            );

            // TODO: use a response queue to actually see if it succeeded or not?
            return this.TaskSuccess({
                data: {},
                feedback: `Queued role-applying task for ${fullName}: ${discordUserId}.`,
            });
        } catch (err) {
            return this.TaskFailure({
                error: err,
                feedback: `Failed to apply roles for ${fullName}: ${discordUserId}.`,
            });
        }
    }
}

