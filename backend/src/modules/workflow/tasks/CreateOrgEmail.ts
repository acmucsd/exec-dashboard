import { googleAdminClient } from '../clients/google'
import { toError } from '@lib/error'
import { Member } from '@t/Member'
import { Task, TaskResult } from '@modules/workflow/types/Task'

/*
Returns true if the email already exists for the user, or is successfully created.
Returns false otherwise.
*/
export default class CreateOrgEmail extends Task {
    label = 'Create ACM email';

    async run(member: Member): Promise<TaskResult> {

        const firstName = member.firstName;
        const lastName = member.lastName;
        const fullName = `${firstName} ${lastName}`;

        if (member.acmEmail) {
            return this.TaskSuccess({
                memberPatch: { 
                    acmEmail: member.acmEmail, 
                },
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

            await this.pollUserUntilComplete(acmEmail);

            return this.TaskSuccess({
                memberPatch: { acmEmail, setupPassword: tempPassword },
                feedback: `Email successfully created for ${fullName}: ${acmEmail}.`
            })
        } catch (err) {
            return this.TaskFailure({
                error: toError(err),
                feedback: `Failed to create email for ${fullName}.`
            })
        }
    }

    async pollUserUntilComplete(acmEmail: string) {
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
                        error: toError(err),
                        feedback: `Email created but timed out waiting for provisioning to complete.`
                    });
                }
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
    }
}
