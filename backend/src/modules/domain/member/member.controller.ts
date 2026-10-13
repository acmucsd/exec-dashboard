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
import { type Member } from '@t/Member';

@Controller('members')
export class MemberController {
  constructor(private readonly membersService: MemberService) {}

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
    @Body() memberToBeCreated: Omit<Member, 'id'>,
  ): Promise<unknown> {
    return this.membersService.previewCreate(memberToBeCreated);
  }

  @Post(':id/preview')
  previewUpdate(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMemberDto: Partial<Member>,
  ): Promise<unknown> {
    return this.membersService.previewUpdate(id, updateMemberDto);
  }

  @Post(':id/delete-preview')
  previewRemove(@Param('id', ParseIntPipe) id: number): Promise<unknown> {
    return this.membersService.previewRemove(id);
  }

  @Post()
  create(
    @Body() memberToBeCreated: Member,
    @Headers('x-workflow-confirmation') confirmationId?: string,
  ): Promise<MemberEntity> {
    return this.membersService.create(memberToBeCreated, confirmationId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMemberDto: Partial<Member>,
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
