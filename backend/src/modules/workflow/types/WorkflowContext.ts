import { Member } from "@t/Member";

export enum SecretKey {TempPassword}

export interface WorkflowContext {
    member: Member;
    secrets: Partial<Record<SecretKey, string>>;
}