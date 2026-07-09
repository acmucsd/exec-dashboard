import { Member } from '../types/Member';
import { Task, TaskResult } from '../types/Task';
type Params = {
    member: Member;
};
type Result = {};
export default class AssignGithubOrgMembership extends Task<Params, Result> {
    id: string;
    label: string;
    services: ['github'];
    run(params: Params): Promise<TaskResult<Result>>;
}
export {};
