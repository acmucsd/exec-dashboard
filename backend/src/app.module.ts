import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database/database.module';
import { MemberModule } from '@domain/member/member.module';
import { WorkflowModule } from './modules/workflow/workflow.module';

@Module({
  imports: [DatabaseModule, MemberModule, WorkflowModule],
})
export class AppModule {}
