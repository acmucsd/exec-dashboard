import { githubClient } from '../clients/github'
import { GITHUB_TEAM } from '../constants/github'
import { toError } from '@lib/error'
import { ACMPosition } from '@t/ACM'
import { Member } from '@t/Member'
import { Task, TaskResult } from '@modules/workflow/types/Task'

/*
Returns true if member is successfully invited to the GitHub org and apply teams.
Returns false otherwise.
*/
export default class AssignGitHubMembership extends Task {
    label = 'Invite member to GitHub org and assign teams';

    // UNTESTED
    // IDK IF THIS WORKS YET
    async run(member: Member): Promise<TaskResult> {
        const teamSlug = GITHUB_TEAM[member.team];
        const teamRole = member.position == ACMPosition.VP ? 'maintainer' : 'member';
        const org = process.env.GITHUB_ORG!;

        if (!teamSlug) {
            return this.TaskSuccess({
                feedback: `No github org to add for ${member.githubUsername}.`
            })
        }

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
                feedback: `Successfully added ${member.githubUsername} to GitHub org "${org}" and team "${teamSlug}".`
            })
        } catch (err) {
            return this.TaskFailure({
                error: toError(err),
                feedback: `Failed to add ${member.githubUsername} to GitHub org "${org}" or team "${teamSlug}".`
            })
        }
    }
}