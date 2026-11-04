import { Task, TaskResult } from '@modules/workflow/types/Task';
import { Member } from '@t/Member';

export default class SendBoardAcceptanceEmail extends Task {
  label = 'Send Board acceptance email';
  requiresConfirmation = false;

  async preview(_member: Member) {
    return { description: 'No Board acceptance email will be sent; this task is not implemented yet.' };
  }

  async run(_member: Member): Promise<TaskResult> {
    // TODO
    return this.TaskSuccess({
      feedback: `TODO`,
    });
  }
}
