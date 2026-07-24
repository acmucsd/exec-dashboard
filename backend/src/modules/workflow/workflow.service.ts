import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Member } from "@t/Member";
import { Repository } from "typeorm";
import { MemberEntity } from "@modules/domain/member/member.entity";
import { WorkflowDefRegistry, WorkflowId } from "./workflowDefRegistry";

@Injectable()
export class WorkflowService {
    constructor(
        @InjectRepository(MemberEntity)
        private readonly memberRepository: Repository<MemberEntity>,
    ) {}

    async createMember(member: Member): Promise<Member> {
        const workflow = WorkflowDefRegistry.instantiate(WorkflowId.CreateMember);
        return workflow.run(
            member,
            (id) => this.loadMemberForWorkflow(id),
            (m, patch) => this.persistMemberPatch(m, patch),
        );
    }

    async updateMember(member: Member): Promise<Member> {
        const workflow = WorkflowDefRegistry.instantiate(WorkflowId.UpdateMember);
        return workflow.run(
            member,
            (id) => this.loadMemberForWorkflow(id),
            (m, patch) => this.persistMemberPatch(m, patch),
        );
    }

    private async persistMemberPatch(member: Member, patch: Partial<Member>): Promise<void> {
        await this.memberRepository.update(member.id, patch);
    }

    private async loadMemberForWorkflow(id: number): Promise<Member> {
        const member = await this.memberRepository
            .createQueryBuilder('member')
            .addSelect('member.setupPassword')
            .where('member.id = :id', { id })
            .getOne();
        if (!member) {
            throw new Error(`Member with id ${id} not found`);
        }
        return member as Member;
    }
}
