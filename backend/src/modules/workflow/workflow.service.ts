import { Injectable } from "@nestjs/common";
import { Member } from "@t/Member";
import { WorkflowDefRegistry, WorkflowId } from "./workflowDefRegistry";

@Injectable()
export class WorkflowService {
    async createMember(member: Member): Promise<Member> {
        await WorkflowDefRegistry.instantiate(WorkflowId.CreateMember).run(member);
        return member;
    }

    async updateMember(member: Member): Promise<Member> {
        await WorkflowDefRegistry.instantiate(WorkflowId.UpdateMember).run(member);
        return member;
    }
}