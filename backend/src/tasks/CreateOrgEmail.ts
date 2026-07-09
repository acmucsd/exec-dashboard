import { googleAdminClient } from '../clients/google'
import { Member } from '../types/Member'
import { Task, TaskResult } from '../types/Task'

type Params = { 
    member: Member
}
type Result = {
    acmEmail: string | null,
    tempPassword: string | null,
}

/*
Returns true if the email already exists for the user, or is successfully created.
Returns false otherwise.
*/
export default class CreateOrgEmail extends Task<Params, Result> {
    id = 'create_org_email'
    label = 'Create ACM email'
    services: ['google']

    async run(params: Params): Promise<TaskResult<Result>> {
        const { member } = params;

        const firstName = member.firstName;
        const lastName = member.lastName;
        const fullName = `${firstName} ${lastName}`;

        if (member.acmEmail) {
            return this.TaskSuccess({
                data: { acmEmail: member.acmEmail, tempPassword: null },
                feedback: `Email account already exists for ${fullName}: ${member.acmEmail}`
            })
        }

        try {
            const existingRes = await googleAdminClient.users.list({
                domain: process.env.GOOGLE_DOMAIN,
                maxResults: 500,
                projection: 'basic',
            });
            const existingUsernames = new Set(
                (existingRes.data.users ?? []).map(u => u.primaryEmail!.split('@')[0].toLowerCase())
            );

            const username = !existingUsernames.has(firstName.toLowerCase())
                ? firstName.toLowerCase()
                : `${firstName}${lastName}`.toLowerCase();

            if (existingUsernames.has(username)) {
                return this.TaskFailure({
                    error: Error(`No available email username for ${fullName}. Account not created.`),
                    feedback: `No available email username for ${fullName}. Account not created.`
                })
            }

            const acmEmail = `${username}@${process.env.GOOGLE_DOMAIN}`;
            const tempPassword = crypto.randomUUID();
            
            await googleAdminClient.users.insert({
                requestBody: {
                    primaryEmail: acmEmail,
                    name: {
                        fullName,
                        givenName: firstName,
                        familyName: lastName,
                    },
                    password: tempPassword,
                    changePasswordAtNextLogin: true,
                },
            })

            await pollUserUntilComplete(acmEmail);

            return this.TaskSuccess({
                data: { acmEmail, tempPassword },
                feedback: `Email successfully created for ${fullName}: ${acmEmail}.`
            })
        } catch (err) {
            return this.TaskFailure({
                error: err,
                feedback: `Failed to create email for ${fullName}.`
            })
        }
    }
}

async function pollUserUntilComplete(acmEmail: string) {
    // Poll until user is fully provisioned
    const maxAttempts = 10;
    const delayMs = 2000;
    for (let i = 0; i < maxAttempts; i++) {
        try {
            await googleAdminClient.users.update({
                userKey: acmEmail,
                requestBody: {},
            });
            break; // user is ready
        } catch (err) {
            if (i === maxAttempts - 1) {
                return this.TaskFailure({
                    error: err,
                    feedback: `Email created but timed out waiting for provisioning to complete.`
                });
            }
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }
}