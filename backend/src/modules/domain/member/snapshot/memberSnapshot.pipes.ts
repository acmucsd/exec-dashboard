import { BadRequestException, type PipeTransform } from '@nestjs/common';
import { validateMemberSnapshot, type MemberSnapshot } from './memberSnapshot';

export const memberSnapshotBodyPipe: PipeTransform<unknown, MemberSnapshot> = {
  transform(body) {
    const result = validateMemberSnapshot(body);
    if (result.valid && result.snapshot) {
      return result.snapshot;
    }

    const first = result.issues[0];
    const summary = `Snapshot is invalid (${result.issues.length} problem${result.issues.length === 1 ? '' : 's'}): ${first?.path ?? '$'}: ${first?.message ?? 'unknown'}`;

    throw new BadRequestException({ message: summary, issues: result.issues });
  },
};
