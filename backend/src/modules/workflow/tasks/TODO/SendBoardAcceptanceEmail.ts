import { Task, TaskResult } from '@modules/workflow/types/Task';
import { Member } from '@t/Member';

export default class SendBoardAcceptanceEmail extends Task {
  label = 'Send Board acceptance email';

  async run(_member: Member): Promise<TaskResult> {
    // TODO
    return this.TaskSuccess({
      feedback: `TODO`,
    });
  }
}
