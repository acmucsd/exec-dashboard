import { Member } from '../types/Member';
import { Task, TaskResult } from '../types/Task';
type Params = {
    member: Member;
    tempPassword: string;
};
type Result = {};
export default class SendAccountSetupEmail extends Task<Params, Result> {
    id: string;
    label: string;
    services: ['ses'];
    run(params: Params): Promise<TaskResult<Result>>;
}
export {};
