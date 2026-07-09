import { githubClient } from '../clients/github';
import { GITHUB_TEAM } from '../constants/github';
import { ACMPosition } from '../types/ACM';
import { Task } from '../types/Task';
/*
Returns true if member is successfully invited to the GitHub org and apply teams.
Returns false otherwise.
*/
export default class AssignGithubOrgMembership extends Task {
    id = 'assign_github_org_membership';
    label = 'Invite member to GitHub org and assign teams';
    services;
    async run(params) {
        const { member } = params;
        const teamSlug = GITHUB_TEAM[member.team];
        const teamRole = member.position == ACMPosition.VP ? 'maintainer' : 'member';
        const org = process.env.GITHUB_ORG;
        try {
            await githubClient.rest.orgs.setMembershipForUser({
                org,
                username: member.githubUsername,
                role: 'member',
            });
            await githubClient.rest.teams.addOrUpdateMembershipForUserInOrg({
                org,
                team_slug: teamSlug,
                username: member.githubUsername,
                role: teamRole,
            });
            return this.TaskSuccess({
                data: {},
                feedback: `Successfully added ${member.githubUsername} to GitHub org "${org}" and team "${teamSlug}".`
            });
        }
        catch (err) {
            return this.TaskFailure({
                error: err,
                feedback: `Failed to add ${member.githubUsername} to GitHub org "${org}" or team "${teamSlug}".`
            });
        }
    }
}
