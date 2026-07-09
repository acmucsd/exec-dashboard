import { ACMCommunity, ACMPosition, ACMTeam } from "./ACM.js";
export function getCommunity(member) {
    if (member.team == ACMTeam.AI)
        return ACMCommunity.AI;
    if (member.team == ACMTeam.Cyber)
        return ACMCommunity.Cyber;
    if (member.team == ACMTeam.Hack)
        return ACMCommunity.Hack;
    return ACMCommunity.General;
}
export function isExec(member) {
    if (member.position == ACMPosition.President)
        return true;
    if (member.position == ACMPosition.VP)
        return true;
    return false;
}
export function isBoard(member) {
    if (member.position == ACMPosition.President)
        return true;
    if (member.position == ACMPosition.VP)
        return true;
    if (member.position == ACMPosition.Board)
        return true;
    return false;
}
export function isBoardOrStaff(member) {
    if (member.position == ACMPosition.President)
        return true;
    if (member.position == ACMPosition.VP)
        return true;
    if (member.position == ACMPosition.Board)
        return true;
    if (member.position == ACMPosition.Staff)
        return true;
    return false;
}
export function isOnATeam(member) {
    return (member.team != ACMTeam.None);
}
