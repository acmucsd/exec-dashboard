import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { MemberService } from './member.service';
import { MemberEntity } from './member.entity';
import { MemberSnapshotService } from './snapshot/memberSnapshot.service';
import {
  createMemberBodyPipe,
  patchMemberBodyPipe,
  type CreateMemberBody,
  type PatchMemberBody,
} from './member.pipes';
import type { MemberSnapshot } from './snapshot/memberSnapshot';
import { memberSnapshotBodyPipe } from './snapshot/memberSnapshot.pipes';

@Controller('members')
export class MemberController {
  constructor(
    private readonly membersService: MemberService,
    private readonly memberSnapshotService: MemberSnapshotService,
  ) {}

  @Get('snapshot')
  exportSnapshot() {
    return this.memberSnapshotService.buildSnapshot();
  }

  @Post('snapshot/preview')
  previewSnapshot(@Body(memberSnapshotBodyPipe) snapshot: MemberSnapshot) {
    return this.memberSnapshotService.preview(snapshot);
  }

  @Post('snapshot/apply')
  applySnapshot(
    @Body(memberSnapshotBodyPipe) snapshot: MemberSnapshot,
    @Headers('x-workflow-confirmation') confirmationId?: string,
  ) {
    return this.memberSnapshotService.apply(snapshot, confirmationId);
  }

  @Get()
  findAll(): Promise<MemberEntity[]> {
    return this.membersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<MemberEntity> {
    return this.membersService.findOne(id);
  }

  @Post('preview')
  previewCreate(
    @Body(createMemberBodyPipe) memberToBeCreated: CreateMemberBody,
  ): Promise<unknown> {
    return this.membersService.previewCreate(memberToBeCreated);
  }

  @Post(':id/preview')
  previewUpdate(
    @Param('id', ParseIntPipe) id: number,
    @Body(patchMemberBodyPipe) updateMemberDto: PatchMemberBody,
  ): Promise<unknown> {
    return this.membersService.previewUpdate(id, updateMemberDto);
  }

  @Post(':id/delete-preview')
  previewRemove(@Param('id', ParseIntPipe) id: number): Promise<unknown> {
    return this.membersService.previewRemove(id);
  }

  @Post()
  create(
    @Body(createMemberBodyPipe) memberToBeCreated: CreateMemberBody,
    @Headers('x-workflow-confirmation') confirmationId?: string,
  ): Promise<MemberEntity> {
    return this.membersService.create(memberToBeCreated, confirmationId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(patchMemberBodyPipe) updateMemberDto: PatchMemberBody,
    @Headers('x-workflow-confirmation') confirmationId?: string,
  ): Promise<MemberEntity> {
    return this.membersService.update(id, updateMemberDto, confirmationId);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-workflow-confirmation') confirmationId?: string,
  ): Promise<void> {
    return this.membersService.remove(id, confirmationId);
  }
}
