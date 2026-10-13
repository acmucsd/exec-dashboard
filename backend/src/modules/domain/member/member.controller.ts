import {
  Body,
  Controller,
  Delete,
  Get,
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

  @Post()
  create(@Body() memberToBeCreated: Member): Promise<MemberEntity> {
    return this.membersService.create(memberToBeCreated);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMemberDto: Partial<Member>,
  ): Promise<MemberEntity> {
    return this.membersService.update(id, updateMemberDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.membersService.remove(id);
  }
}
