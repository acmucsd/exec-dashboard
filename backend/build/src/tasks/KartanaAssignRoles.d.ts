import { Member } from '../types/Member';
import { Task, TaskResult } from '../types/Task';
type Params = {
    member: Member;
};
type Result = {};
export default class KartanaAssignRoles extends Task<Params, Result> {
    id: string;
    label: string;
    services: ['kartana'];
    run(params: Params): Promise<TaskResult<Result>>;
}
export {};
