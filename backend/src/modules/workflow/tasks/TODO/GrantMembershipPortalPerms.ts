import { Task, TaskResult } from '@modules/workflow/types/Task';

export default class GrantMembershipPortalPerms extends Task {
  label = "Grant permissions to user's acmucsd account in Membership Portal";
  requiresConfirmation = false;

  preview() {
    return Promise.resolve({
      description: 'No Membership Portal changes are implemented yet.',
    });
  }

  run(): Promise<TaskResult> {
    // TODO
    return Promise.resolve(this.TaskSuccess({ feedback: `TODO` }));
  }
}
