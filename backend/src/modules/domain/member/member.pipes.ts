import { BadRequestException, type PipeTransform } from '@nestjs/common';
import { z } from 'zod';
import {
  memberRequiredFieldSchemas,
  memberStringWithMaxLength,
} from './snapshot/memberSnapshot';

const accountHandle = memberStringWithMaxLength(128).nullish();
const createMemberBodySchema = z.strictObject({
  ...memberRequiredFieldSchemas,
  acmEmail: z
    .union([
      memberRequiredFieldSchemas.email,
      memberStringWithMaxLength(256).refine((value) => value.trim() === ''),
    ])
    .nullish(),
  githubUsername: accountHandle,
  discordUserId: accountHandle,
});
const patchMemberBodySchema = createMemberBodySchema.partial();

export type CreateMemberBody = z.infer<typeof createMemberBodySchema>;
export type PatchMemberBody = z.infer<typeof patchMemberBodySchema>;

function memberBodyPipe<T>(schema: z.ZodType<T>): PipeTransform<unknown, T> {
  return {
    transform(body) {
      const result = schema.safeParse(body);
      if (result.success) return result.data;
      const { path, message } = result.error.issues[0];
      const at = path.length ? `${path.join('.')}: ` : '';
      throw new BadRequestException(`Member data is invalid: ${at}${message}`);
    },
  };
}

export const createMemberBodyPipe = memberBodyPipe(createMemberBodySchema);
export const patchMemberBodyPipe = memberBodyPipe(patchMemberBodySchema);
