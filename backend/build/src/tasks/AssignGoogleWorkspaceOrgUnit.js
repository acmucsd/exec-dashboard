import { googleAdminClient } from '../clients/google';
import { GW_ORG_TEAM } from '../constants/googleWorkspace';
import { Task } from '../types/Task';
/*
Returns true if member is successfully moved to organizational unit of their team.
Returns false otherwise.
*/
export default class AssignGoogleWorkspaceOrgUnit extends Task {
    id = 'assign_gw_org_unit';
    label = 'Move acmucsd email to Google Workspace organizational unit';
    services;
    async run(params) {
        const { member } = params;
        const orgUnit = GW_ORG_TEAM[member.team];
        try {
            await googleAdminClient.users.update({
                userKey: member.acmEmail,
                requestBody: {
                    orgUnitPath: orgUnit,
                },
            });
            return this.TaskSuccess({
                data: {},
                feedback: `Successfully assigned ${member.acmEmail} to organizational unit ${orgUnit}.`
            });
        }
        catch (err) {
            return this.TaskFailure({
                error: err,
                feedback: `Failed to assign ${member.acmEmail} to organizational unit ${orgUnit}.`
            });
        }
    }
}
