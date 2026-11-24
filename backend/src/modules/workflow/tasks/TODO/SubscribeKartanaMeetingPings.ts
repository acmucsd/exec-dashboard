import { Task, TaskResult } from '@modules/workflow/types/Task';

export default class SubscribeKartanaMeetingPings extends Task {
  label = 'Subscribe user to Kartana meeting pings';
  requiresConfirmation = false;

  async preview() {
    await Promise.resolve();
    return {
      description: 'No meeting-ping subscription changes are implemented yet.',
    };
  }

  async run(): Promise<TaskResult> {
    // TODO
    await Promise.resolve();
    return this.TaskSuccess({ feedback: `TODO` });
  }
}
