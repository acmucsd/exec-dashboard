import { ACMCommunity, ACMPosition, ACMTeam } from "./ACM.js";
export interface Member {
    id?: number;
    firstName: string;
    lastName: string;
    team: ACMTeam;
    position: ACMPosition;
    yearGraduating: number;
    email: string;
    acmEmail: string | null;
    githubUsername: string;
    discordUserId: string;
}
export declare function getCommunity(member: Member): ACMCommunity;
export declare function isExec(member: Member): boolean;
export declare function isBoard(member: Member): boolean;
export declare function isBoardOrStaff(member: Member): boolean;
export declare function isOnATeam(member: Member): boolean;
