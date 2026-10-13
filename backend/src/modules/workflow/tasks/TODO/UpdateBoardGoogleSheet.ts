import { Task, TaskResult } from '@modules/workflow/types/Task';
import { Member } from '@t/Member';

export default class UpdateBoardGoogleSheet extends Task {
  label = "Updates member's row in Board Google Sheet";

  async run(_member: Member): Promise<TaskResult> {
    // TODO
    return this.TaskSuccess({
      feedback: `TODO`,
    });
  }
}
