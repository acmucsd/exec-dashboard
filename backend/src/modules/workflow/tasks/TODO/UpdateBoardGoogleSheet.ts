import { Task, TaskResult } from '@modules/workflow/types/Task';

export default class UpdateBoardGoogleSheet extends Task {
  label = "Updates member's row in Board Google Sheet";
  requiresConfirmation = false;

  async preview() {
    await Promise.resolve();
    return {
      description: 'No Board Google Sheet changes are implemented yet.',
    };
  }

  async run(): Promise<TaskResult> {
    // TODO
    await Promise.resolve();
    return this.TaskSuccess({ feedback: `TODO` });
  }
}
