import AssignGitHubMembership from "./tasks/AssignGitHubMembership";
import AssignGoogleWorkspaceGroups from "./tasks/AssignGoogleWorkspaceGroups";
import AssignGoogleWorkspaceOrgUnit from "./tasks/AssignGoogleWorkspaceOrgUnit";
import CreateOrgEmail from "./tasks/CreateOrgEmail";
import SendAccountSetupEmail from "./tasks/SendAccountSetupEmail";
import AssignKartanaRoles from "./tasks/AssignKartanaRoles";
import SubscribeKartanaMeetingPings from "./tasks/TODO/SubscribeKartanaMeetingPings";
import GrantMembershipPortalPerms from "./tasks/TODO/GrantMembershipPortalPerms";
import InviteToVaultwarden from "./tasks/TODO/InviteToVaultwarden";
import SendBoardAcceptanceEmail from "./tasks/TODO/SendBoardAcceptanceEmail";
import UpdateBoardGoogleSheet from "./tasks/TODO/UpdateBoardGoogleSheet";
import { Task } from "./types/Task";

export enum TaskId {
    CreateOrgEmail = 'create_org_email', 
    SendAccountSetupEmail = 'send_account_setup_email',
    AssignGoogleWorkspaceGroups = 'assign_gw_groups',
    AssignGoogleWorkspaceOrgUnit = 'assign_gw_org_unit',
    AssignGitHubMembership = 'assign_github_membership',
    AssignKartanaRoles = 'assign_kartana_roles',
    SubscribeKartanaMeetingPings = 'subscribe_kartana_pings',
    GrantMembershipPortalPerms = 'grant_portal_perms',
    InviteToVaultwarden = 'invite_to_vaultwarden',
    SendBoardAcceptanceEmail = 'send_acceptance_email',
    UpdateBoardGoogleSheet = 'update_google_sheet',
}

const tasks = {
    [TaskId.CreateOrgEmail]: new CreateOrgEmail(),
    [TaskId.SendAccountSetupEmail]: new SendAccountSetupEmail(),
    [TaskId.AssignGoogleWorkspaceGroups]: new AssignGoogleWorkspaceGroups(),
    [TaskId.AssignGoogleWorkspaceOrgUnit]: new AssignGoogleWorkspaceOrgUnit(),
    [TaskId.AssignGitHubMembership]: new AssignGitHubMembership(),
    [TaskId.AssignKartanaRoles]: new AssignKartanaRoles(),
    [TaskId.SubscribeKartanaMeetingPings]: new SubscribeKartanaMeetingPings(),
    [TaskId.GrantMembershipPortalPerms]: new GrantMembershipPortalPerms(),
    [TaskId.InviteToVaultwarden]: new InviteToVaultwarden(),
    [TaskId.SendBoardAcceptanceEmail]: new SendBoardAcceptanceEmail(),
    [TaskId.UpdateBoardGoogleSheet]: new UpdateBoardGoogleSheet(),
};

export const TaskRegistry = {
    getTask(taskId: TaskId): Task {
        const task = tasks[taskId];
        if (!task) {
            throw new Error(`Unknown task id: ${taskId}`);
        }
        return task;
    },
    listTasks(): Task[] { return Object.values(tasks); },
    hasTask(taskId: TaskId): boolean {return !!tasks[taskId];}
};
