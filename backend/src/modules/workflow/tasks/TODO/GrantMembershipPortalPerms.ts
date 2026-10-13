import { Task, TaskResult } from '@modules/workflow/types/Task';
import { Member } from '@t/Member';

export default class GrantMembershipPortalPerms extends Task {
  label = "Grant permissions to user's acmucsd account in Membership Portal";
  requiresConfirmation = false;

  async preview(_member: Member) {
    return { description: 'No Membership Portal changes are implemented yet.' };
  }

  async run(_member: Member): Promise<TaskResult> {
    // TODO
    return this.TaskSuccess({
      feedback: `TODO`,
    });
  }
}
