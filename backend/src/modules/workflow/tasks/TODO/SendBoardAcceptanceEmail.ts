import { Task, TaskResult } from '@modules/workflow/types/Task';

export default class SendBoardAcceptanceEmail extends Task {
  label = 'Send Board acceptance email';
  requiresConfirmation = false;

  async preview() {
    await Promise.resolve();
    return {
      description:
        'No Board acceptance email will be sent; this task is not implemented yet.',
    };
  }

  async run(): Promise<TaskResult> {
    // TODO
    await Promise.resolve();
    return this.TaskSuccess({ feedback: `TODO` });
  }
}
