import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MemberEntity } from './member.entity';
import { Member } from '@t/Member';
import { WorkflowService } from '@modules/workflow/workflow.service';

@Injectable()
export class MemberService {
	constructor(
		@InjectRepository(MemberEntity)
		private readonly memberRepository: Repository<MemberEntity>,
		private readonly workflowService: WorkflowService,
	) {}

    // Methods

	async findAll(): Promise<MemberEntity[]> {
		return this.memberRepository.find();
	}

	async findOne(id: number): Promise<MemberEntity> {
		const member = await this.memberRepository.findOne({ where: { id } });
		if (!member) {
			throw new NotFoundException(`Member with id ${id} not found`);
		}
		return member;
	}

	async create(memberToBeCreated: Member): Promise<MemberEntity> {
		const member = this.memberRepository.create(memberToBeCreated as MemberEntity);
		await this.workflowService.createMember(member as Member);
		return this.memberRepository.save(member);
	}

	async update(id: number, memberPatch: Partial<Member>): Promise<MemberEntity> {
		const member = await this.findOne(id);
		Object.assign(member, memberPatch);
		await this.workflowService.updateMember(member as Member);
		return this.memberRepository.save(member);
	}

	async remove(id: number): Promise<void> {
		const result = await this.memberRepository.delete(id);
		if (result.affected === 0) {
			throw new NotFoundException(`Member with id ${id} not found`);
		}
	}
}
