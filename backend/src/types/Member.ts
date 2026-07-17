import { ACMCommunity, ACMPosition, ACMTeam } from "./ACM";

export interface Member {
    id: number,
    firstName: string,
    lastName: string,
    team: ACMTeam,
    position: ACMPosition,
    yearGraduating: number,
    email: string,
    acmEmail: string | null,
    githubUsername: string,
    discordUserId: string,
}

export function getCommunity(member: Member) {
    if (member.team == ACMTeam.AI) return ACMCommunity.AI;
    if (member.team == ACMTeam.Cyber) return ACMCommunity.Cyber;
    if (member.team == ACMTeam.Hack) return ACMCommunity.Hack;
    return ACMCommunity.General;
}
export function isExec(member: Member) {
    if (member.position == ACMPosition.President) return true;
    if (member.position == ACMPosition.VP) return true;
    return false;
}
export function isBoard(member: Member) {
    if (member.position == ACMPosition.President) return true;
    if (member.position == ACMPosition.VP) return true;
    if (member.position == ACMPosition.Board) return true;
    return false;
}
export function isBoardOrStaff(member: Member) {
    if (member.position == ACMPosition.President) return true;
    if (member.position == ACMPosition.VP) return true;
    if (member.position == ACMPosition.Board) return true;
    if (member.position == ACMPosition.Staff) return true;
    return false;
}
export function isOnATeam(member: Member) {
    return (member.team != ACMTeam.None);
}
