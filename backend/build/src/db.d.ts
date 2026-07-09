import type { Member } from "./types/Member.js";
type MemberInput = Omit<Member, "id">;
export declare class MemberStore {
    private pool;
    private memoryMembers;
    private nextId;
    constructor(databaseUrl?: string);
    init(): Promise<void>;
    list(): Promise<Member[]>;
    get(id: number): Promise<Member | null>;
    create(member: MemberInput): Promise<Member>;
    update(id: number, updates: Partial<MemberInput>): Promise<Member | null>;
    delete(id: number): Promise<boolean>;
}
export declare const memberStore: MemberStore;
export {};
