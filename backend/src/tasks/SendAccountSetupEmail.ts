import { SendEmailCommand } from '@aws-sdk/client-ses'
import { accountSetupTemplate } from '../templates/accountSetupEmail'
import { Member } from '../types/Member'
import { Task, TaskResult } from '../types/Task'
import { sesClient } from '../clients/ses'

type Params = {
    member: Member
    tempPassword: string
}
type Result = {}

/*
Returns true if account setup email was sent correctly.
Returns false otherwise.
*/
export default class SendAccountSetupEmail extends Task<Params, Result> {
    id = 'send_account_setup_email'
    label = 'Send account setup email'
    services: ['ses']

    async run(params: Params): Promise<TaskResult<Result>> {
        const { member, tempPassword } = params

        const fullName = `${member.firstName} ${member.lastName}`
        const orgEmail = member.acmEmail
        const toEmail = member.email

        const { subject, body } = accountSetupTemplate({ fullName, orgEmail, tempPassword })

        try {
            await sesClient.send(new SendEmailCommand({
                Source: process.env.SES_SENDER,
                Destination: { ToAddresses: [toEmail] },
                Message: {
                    Subject: { Data: subject },
                    Body: { Text: { Data: body } },
                },
            }))

            return this.TaskSuccess({
                data: {},
                feedback: `Account setup email sent to ${toEmail} successfully.`
            })
        } catch (err) {
            return this.TaskFailure({
                error: err,
                feedback: `Failed to send account setup email to ${toEmail}.`
            })
        }
    }
}