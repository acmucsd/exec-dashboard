import { googleAdminClient } from '../clients/google';
import { GW_ORG_TEAM } from '../constants/googleWorkspace';
import { toError } from '@lib/error';
import { Member } from '@t/Member';
import { Task, TaskResult } from '@modules/workflow/types/Task';

/*
Returns true if member is successfully moved to organizational unit of their team.
Returns false otherwise.
*/
export default class AssignGoogleWorkspaceOrgUnit extends Task {
  label = 'Move acmucsd email to Google Workspace organizational unit';

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
