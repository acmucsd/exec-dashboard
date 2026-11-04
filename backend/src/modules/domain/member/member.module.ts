import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberController } from './member.controller';
import { MemberService } from './member.service';
import { MemberEntity } from './member.entity';
import { WorkflowModule } from '@modules/workflow/workflow.module';

@Module({
  imports: [TypeOrmModule.forFeature([MemberEntity]), WorkflowModule],
  controllers: [MemberController],
  providers: [MemberService],
})
export class MemberModule {}
