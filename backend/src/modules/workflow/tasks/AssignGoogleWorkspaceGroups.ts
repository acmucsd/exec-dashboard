import { GaxiosError } from 'googleapis-common';
import { googleAdminClient } from '../clients/google';
import {
  GW_GROUP_BOARD,
  GW_GROUP_EXEC,
  GW_GROUP_GENERAL,
  GW_GROUP_TEAM,
} from '@modules/workflow/constants/googleWorkspace';
import { getCommunity, isExec, Member } from '@t/Member';
import { Task, TaskResult } from '@modules/workflow/types/Task';
import { ACMCommunity } from '@t/ACM';
import { toError } from '@lib/error';

/*
Returns true if member is successfully assigned to both ACM Board and Team groups.
Returns false otherwise. Can imply partial success.
*/
export default class AssignGoogleWorkspaceGroups extends Task {
  label = 'Assign acmucsd email to Google Workspace groups';
  requiresConfirmation = true;

  private groupEmails(member: Member): string[] {
    const groupEmails = [GW_GROUP_BOARD, GW_GROUP_TEAM[member.team]].filter(
      (email): email is string => Boolean(email),
    );
    if (getCommunity(member) == ACMCommunity.General) {
      groupEmails.push(GW_GROUP_GENERAL);
    }
    if (isExec(member)) {
      // disable this for now until we have proper permissions system
      //groupEmails.push(GW_GROUP_EXEC);
    }
    return [...new Set(groupEmails)];
  }

  async preview(member: Member) {
    if (!member.acmEmail) {
      return { description: 'No Google Workspace groups can be assigned without an ACM email.' };
    }

    const groups = await Promise.all(
      this.groupEmails(member).map(async (groupEmail) => {
        const response = await googleAdminClient.members.list({
          groupKey: groupEmail,
          maxResults: 200,
        });
        const alreadyMember = response.data.members?.some(
          (groupMember) =>
            groupMember.email?.toLowerCase() === member.acmEmail!.toLowerCase(),
        );
        return alreadyMember
          ? `${member.acmEmail} is already in ${groupEmail}.`
          : `Add ${member.acmEmail} to ${groupEmail}.`;
      }),
    );
    return { description: groups.join('\n') };
  }

  async run(member: Member): Promise<TaskResult> {
    const groupEmails = this.groupEmails(member);

    for (const groupEmail of groupEmails) {
      try {
        await googleAdminClient.members.insert({
          groupKey: groupEmail,
          requestBody: {
            email: member.acmEmail,
            role: 'MEMBER',
          },
        });
      } catch (err) {
        if (err instanceof GaxiosError && err.response?.status === 409) {
          continue;
        }
        return this.TaskFailure({
          error: toError(err),
          feedback: `Failed to assign ${member.acmEmail} to group ${groupEmail}.`,
        });
      }
    }

    return this.TaskSuccess({
      feedback: `Successfully assigned ${member.acmEmail} to groups ${groupEmails}.`,
    });
  }
}
