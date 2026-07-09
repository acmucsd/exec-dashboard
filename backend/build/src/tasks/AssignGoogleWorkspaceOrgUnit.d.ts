import { Member } from '../types/Member';
import { Task, TaskResult } from '../types/Task';
type Params = {
    member: Member;
};
type Result = {};
export default class AssignGoogleWorkspaceOrgUnit extends Task<Params, Result> {
    id: string;
    label: string;
    services: ['google'];
    run(params: Params): Promise<TaskResult<Result>>;
}
export {};
