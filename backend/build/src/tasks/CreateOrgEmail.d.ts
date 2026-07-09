import { Member } from '../types/Member';
import { Task, TaskResult } from '../types/Task';
type Params = {
    member: Member;
};
type Result = {
    acmEmail: string | null;
    tempPassword: string | null;
};
export default class CreateOrgEmail extends Task<Params, Result> {
    id: string;
    label: string;
    services: ['google'];
    run(params: Params): Promise<TaskResult<Result>>;
}
export {};
