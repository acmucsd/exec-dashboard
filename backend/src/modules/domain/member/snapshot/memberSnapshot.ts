import { z } from 'zod';
import { POSITION_CHOICES, TEAM_CHOICES } from '@t/ACM';
import type { MemberEntity } from '../member.entity';

const EMAIL_PATTERN =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

export function memberStringWithMaxLength(max: number, base = z.string()) {
  return base.refine((value) => [...value].length <= max, {
    message: `Must be at most ${max} characters.`,
    abort: true,
  });
}

function snapshotString(max: number) {
  return memberStringWithMaxLength(
    max,
    z.string().refine((value) => value.trim() !== '', {
      message: 'Must not be blank.',
      abort: true,
    }),
  );
}

const email = snapshotString(256).refine(
  (value) => EMAIL_PATTERN.test(value.trim()),
  'Must be an email.',
);

const nullableFields = {
  acmEmail: email.nullable().default(null),
  githubUsername: snapshotString(128).nullable().default(null),
  discordUserId: snapshotString(128).nullable().default(null),
};

export const memberRequiredFieldSchemas = {
  firstName: snapshotString(128),
  lastName: snapshotString(128),
  team: snapshotString(64).refine(
    (value) => TEAM_CHOICES.some((choice: string) => choice === value),
    'Must be an allowed team.',
  ),
  position: snapshotString(64).refine(
    (value) => POSITION_CHOICES.some((choice: string) => choice === value),
    'Must be an allowed position.',
  ),
  yearGraduating: z.number().refine(Number.isInteger, 'Must be an integer.'),
  email,
};

const memberSchema = z.strictObject({
  ...memberRequiredFieldSchemas,
  ...nullableFields,
});
const snapshotSchema = z.strictObject({ members: z.array(memberSchema) });
const memberFields = memberSchema.keyof().options;

export type MemberSnapshotRecord = z.infer<typeof memberSchema>;
export type MemberSnapshot = z.infer<typeof snapshotSchema>;

export interface MemberSnapshotIssue {
  code: z.core.$ZodIssue['code'];
  path: string;
  message: string;
}

export interface MemberSnapshotValidationResult {
  valid: boolean;
  issues: MemberSnapshotIssue[];
  snapshot: MemberSnapshot | null;
}

export function normalizeEmailKey(email: string): string {
  return email.trim().toLowerCase();
}

export function memberToSnapshotRecord(
  member: MemberEntity,
): MemberSnapshotRecord {
  return Object.fromEntries(
    memberFields.map((field) => {
      const value = member[field];
      return [
        field,
        Object.hasOwn(nullableFields, field) &&
        typeof value === 'string' &&
        value.trim() === ''
          ? null
          : (value ?? null),
      ];
    }),
  ) as MemberSnapshotRecord;
}

export function membersToSnapshot(
  members: readonly MemberEntity[],
): MemberSnapshot {
  return {
    members: members
      .map(memberToSnapshotRecord)
      .sort(
        (left, right) =>
          normalizeEmailKey(left.email).localeCompare(
            normalizeEmailKey(right.email),
          ) || left.firstName.localeCompare(right.firstName),
      ),
  };
}

export function validateMemberSnapshot(
  document: unknown,
): MemberSnapshotValidationResult {
  const issues: MemberSnapshotIssue[] = [];
  const rows: unknown[] =
    isObject(document) && Array.isArray(document.members)
      ? document.members
      : [];

  const parsed = snapshotSchema.safeParse(document);
  if (!parsed.success) {
    for (const { code, path, message, ...issue } of parsed.error.issues) {
      const [field, index, memberField] = path;
      const at =
        typeof index === 'number'
          ? `members[${index}]${memberField === undefined ? '' : `.${String(memberField)}`}`
          : field === undefined
            ? '$'
            : `$.${String(field)}`;

      if ('keys' in issue) {
        for (const key of issue.keys) issues.push(unknownKey(at, key));
      } else {
        issues.push({ code, path: at, message });
      }
    }
  }

  // check duplicate emails
  const seen = new Map<string, number>();
  rows.forEach((row: unknown, index) => {
    // a valid email can be a duplicate even when another field in the row is invalid
    const address = parsed.success
      ? parsed.data.members[index].email
      : isObject(row)
        ? email.safeParse(row.email).data
        : undefined;
    if (address === undefined) return;

    const key = normalizeEmailKey(address);
    const first = seen.get(key);
    if (first === undefined) {
      seen.set(key, index);
    } else {
      issues.push({
        code: 'custom',
        path: `members[${index}].email`,
        message: `Email already appears at members[${first}].`,
      });
    }
  });

  return parsed.success && issues.length === 0
    ? { valid: true, issues: [], snapshot: parsed.data }
    : { valid: false, issues, snapshot: null };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function unknownKey(path: string, key: string): MemberSnapshotIssue {
  return {
    code: 'unrecognized_keys',
    path: `${path}.${key}`,
    message: `Unknown key "${key}".`,
  };
}
