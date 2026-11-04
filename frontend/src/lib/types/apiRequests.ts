import type { Member } from './apiResponses';

export type MemberPayload = Omit<Member, 'id'>;

export type MemberPatches = Partial<MemberPayload>;
