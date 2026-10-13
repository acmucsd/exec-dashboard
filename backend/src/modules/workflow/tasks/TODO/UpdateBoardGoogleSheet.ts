import { Task, TaskResult } from '@modules/workflow/types/Task';
import { Member } from '@t/Member';

export default class UpdateBoardGoogleSheet extends Task {
  label = "Updates member's row in Board Google Sheet";
  requiresConfirmation = false;

  async preview(_member: Member) {
    return { description: 'No Board Google Sheet changes are implemented yet.' };
  }

  async run(_member: Member): Promise<TaskResult> {
    // TODO
    return this.TaskSuccess({
      feedback: `TODO`,
    });
  }
}
