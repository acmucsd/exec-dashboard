import { SendMessageCommand } from '@aws-sdk/client-sqs'
import { sqs } from '../clients/sqs'
import { Member } from '../types/Member'
import { Task, TaskResult } from '../types/Task'
import { SQSMessageGeneric } from '../types/Transport'

type Params = { 
    member: Member
}
type Result = {}

interface SQSMessage extends SQSMessageGeneric { 
    type: 'subscribe'; 
    payload: { 
        discordUserId: string;
        email: string; 
    }
}


/*
Returns true if Kartana's subscribe command ran successfully.
Returns false otherwise.
*/
export default class KartanaSubscribeUser extends Task<Params, Result> {
    id = 'kartana_subscribe_user'
    label = 'Subscribe user to Kartana meeting pings'
    services: ['kartana']

    async run(params: Params): Promise<TaskResult<Result>> {
        const { member } = params;

        const discordUserId = member.discordUserId;
        const email = member.acmEmail;
        const fullName = `${member.firstName} ${member.lastName}`;

        if (!discordUserId) {
            return this.TaskFailure({
                error: new Error(`Member ${fullName} has no linked Discord account.`),
                feedback: `Cannot subscribe ${fullName} to meeting pings: no Discord account linked.`,
            });
        }

        if (!email) {
            return this.TaskFailure({
                error: new Error(`Member ${fullName} has no ACM email on file.`),
                feedback: `Cannot subscribe ${fullName} to meeting pings: no ACM email on file.`,
            });
        }

        try {
            await sqs.send(
                new SendMessageCommand({
                    QueueUrl: process.env.SQS_DISCORD_QUEUE_URL,
                    MessageBody: JSON.stringify({
                        type: 'subscribe',
                        payload: { email, discordUserId },
                    } as SQSMessage),
                    MessageGroupId: 'workflow',
                    
                }),
            );

            // TODO: use a response queue to actually see if it succeeded or not
            return this.TaskSuccess({
                data: {},
                feedback: `Queued meeting ping subscription for ${fullName}: ${email}.`,
            });
        } catch (err) {
            return this.TaskFailure({
                error: err,
                feedback: `Failed to queue meeting ping subscription for ${fullName}.`,
            });
        }
    }
}
