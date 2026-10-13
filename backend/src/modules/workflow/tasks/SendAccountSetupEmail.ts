import { SendEmailCommand } from '@aws-sdk/client-ses';
import { accountSetupTemplate } from '../templates/accountSetupEmail';
import { Member } from '@t/Member';
import { Task, TaskResult } from '@modules/workflow/types/Task';
import { sesClient } from '../clients/ses';
import { toError } from '@lib/error';

/*
Returns true if account setup email was sent correctly.
Returns false otherwise.
*/
export default class SendAccountSetupEmail extends Task {
  label = 'Send account setup email';
  requiresConfirmation = true;

  async preview(member: Member) {
    const orgEmail = member.acmEmail;
    if (!orgEmail) {
      return {
        description: `No setup email can be sent to ${member.email} until an ACM email is available.`,
      };
    }
    return {
      description: `Send account setup instructions for ${orgEmail} to ${member.email}.`,
    };
  }

  async run(member: Member): Promise<TaskResult> {
    const tempPassword = member.setupPassword;

    const fullName = `${member.firstName} ${member.lastName}`;
    const orgEmail = member.acmEmail!;
    const toEmail = member.email;

    if (!tempPassword) {
      return this.TaskFailure({
        error: Error(`${toEmail} has no temporary password.`),
        feedback: `${toEmail} has no temporary password.`,
      });
    }

    const { subject, body } = accountSetupTemplate({
      fullName,
      orgEmail,
      tempPassword,
    });

    try {
      await sesClient.send(
        new SendEmailCommand({
          Source: process.env.SES_SENDER,
          Destination: { ToAddresses: [toEmail] },
          Message: {
            Subject: { Data: subject },
            Body: { Text: { Data: body } },
          },
        }),
      );

      return this.TaskSuccess({
        feedback: `Account setup email sent to ${toEmail} successfully.`,
      });
    } catch (err) {
      return this.TaskFailure({
        error: toError(err),
        feedback: `Failed to send account setup email to ${toEmail}.`,
      });
    }
  }
}
