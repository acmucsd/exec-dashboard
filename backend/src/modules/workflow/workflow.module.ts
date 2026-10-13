import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberEntity } from '@modules/domain/member/member.entity';
import { WorkflowService } from './workflow.service';

@Module({
  imports: [TypeOrmModule.forFeature([MemberEntity])],
  controllers: [],
  providers: [WorkflowService],
  exports: [WorkflowService],
})
export class WorkflowModule {}
