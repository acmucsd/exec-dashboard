import { TaskId } from "./taskRegistry";
import { WorkflowDefinition } from "./types/Workflow";

export enum WorkflowId {
    CreateMember = 'create_member', 
    UpdateMember = 'sync_member'
}

const workflowDefs = {
    [WorkflowId.CreateMember]: new WorkflowDefinition([
        { taskId: TaskId.CreateOrgEmail, next: [
            { taskId: TaskId.SendAccountSetupEmail },
            { taskId: TaskId.AssignGoogleWorkspaceGroups },
            { taskId: TaskId.AssignGoogleWorkspaceOrgUnit },
            { taskId: TaskId.SubscribeKartanaMeetingPings },
        ]},
        { taskId: TaskId.AssignGitHubMembership },
        { taskId: TaskId.AssignKartanaRoles },
    ]),
    [WorkflowId.UpdateMember]: new WorkflowDefinition([
        { taskId: TaskId.AssignGitHubMembership },
        { taskId: TaskId.AssignGoogleWorkspaceGroups },
        { taskId: TaskId.AssignGoogleWorkspaceOrgUnit },
        { taskId: TaskId.SubscribeKartanaMeetingPings },
        { taskId: TaskId.AssignKartanaRoles },
    ])
}

export const WorkflowDefRegistry = {
    instantiate(id: WorkflowId) {
        const definition = workflowDefs[id];
        if (!definition) {
            throw new Error(`Unknown workflow definition: ${id}`);
        }
        return definition.instantiate();
    },
    getDefinition(id: WorkflowId) {return workflowDefs[id];},
};
