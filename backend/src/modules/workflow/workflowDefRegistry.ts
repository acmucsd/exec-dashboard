import { TaskId } from './taskRegistry';
import { Workflow, WorkflowDefinition } from './types/Workflow';

export enum WorkflowId {
  CreateMember = 'create_member',
  UpdateMember = 'sync_member',
}

const syncSteps = [
  { taskId: TaskId.AssignGitHubMembership },
  { taskId: TaskId.AssignGoogleWorkspaceGroups },
  { taskId: TaskId.AssignGoogleWorkspaceOrgUnit },
  { taskId: TaskId.SubscribeKartanaMeetingPings },
  { taskId: TaskId.AssignKartanaRoles },
];

const workflowDefs = {
  [WorkflowId.CreateMember]: new WorkflowDefinition([
    {
      taskId: TaskId.CreateOrgEmail,
      next: [
        { taskId: TaskId.SendAccountSetupEmail },
        { taskId: TaskId.AssignGoogleWorkspaceGroups },
        { taskId: TaskId.AssignGoogleWorkspaceOrgUnit },
        { taskId: TaskId.SubscribeKartanaMeetingPings },
      ],
    },
    { taskId: TaskId.AssignGitHubMembership },
    { taskId: TaskId.AssignKartanaRoles },
  ]),
  [WorkflowId.UpdateMember]: new WorkflowDefinition(syncSteps),
};

export const WorkflowDefRegistry = {
  instantiate(id: WorkflowId, { includeSetupEmail = false } = {}) {
    const definition = workflowDefs[id];
    if (!definition) {
      throw new Error(`Unknown workflow definition: ${id}`);
    }
    if (id === WorkflowId.UpdateMember && includeSetupEmail) {
      return new Workflow([
        { taskId: TaskId.SendAccountSetupEmail },
        ...definition.steps,
      ]);
    }
    return definition.instantiate();
  },
  getDefinition(id: WorkflowId) {
    return workflowDefs[id];
  },
};
