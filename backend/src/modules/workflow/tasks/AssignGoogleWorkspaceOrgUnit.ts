import { googleAdminClient } from '../clients/google';
import { GW_ORG_TEAM } from '../constants/googleWorkspace';
import { toError } from '@lib/error';
import { Member } from '@t/Member';
import { Task, TaskResult } from '@modules/workflow/types/Task';
import { GaxiosError } from 'googleapis-common';

/*
Returns true if member is successfully moved to organizational unit of their team.
Returns false otherwise.
*/
export default class AssignGoogleWorkspaceOrgUnit extends Task {
  label = 'Move acmucsd email to Google Workspace organizational unit';
  requiresConfirmation = true;

  async preview(member: Member) {
    const orgUnit = GW_ORG_TEAM[member.team];
    if (!member.acmEmail) {
      return {
        description: `No ACM email is available to move to ${orgUnit}.`,
        requiresConfirmation: false,
      };
    }

    try {
      const response = await googleAdminClient.users.get({
        userKey: member.acmEmail,
      });
      const currentOrgUnit = response.data.orgUnitPath ?? '/';
      return {
        description:
          currentOrgUnit === orgUnit
            ? `No Google Workspace organizational unit change needed for ${member.acmEmail}.`
            : `Move ${member.acmEmail} from ${currentOrgUnit} to ${orgUnit}.`,
        requiresConfirmation: currentOrgUnit !== orgUnit,
      };
    } catch (err) {
      if (err instanceof GaxiosError && err.response?.status === 404) {
        return {
          description: `Create ${member.acmEmail} in Google Workspace organizational unit ${orgUnit}.`,
        };
      }
      throw err;
    }
  }

  async run(member: Member): Promise<TaskResult> {
    const orgUnit = GW_ORG_TEAM[member.team];

    try {
      await googleAdminClient.users.update({
        userKey: member.acmEmail!,
        requestBody: {
          orgUnitPath: orgUnit,
        },
      });

      return this.TaskSuccess({
        feedback: `Successfully assigned ${member.acmEmail} to organizational unit ${orgUnit}.`,
      });
    } catch (err) {
      return this.TaskFailure({
        error: toError(err),
        feedback: `Failed to assign ${member.acmEmail} to organizational unit ${orgUnit}.`,
      });
    }
  }
}
