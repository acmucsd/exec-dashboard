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

  async run(member: Member): Promise<TaskResult> {
    const groupEmails = [GW_GROUP_BOARD, GW_GROUP_TEAM[member.team]];
    if (getCommunity(member) == ACMCommunity.General) {
      groupEmails.push(GW_GROUP_GENERAL);
    }
    if (isExec(member)) {
      // disable this for now until we have proper permissions system
      //groupEmails.push(GW_GROUP_EXEC);
    }

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
