import { Pool } from "pg";
import { ACMPosition, ACMTeam } from "./types/ACM.js";
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS members (
    id SERIAL PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    team TEXT NOT NULL,
    position TEXT NOT NULL,
    year_graduating INTEGER NOT NULL,
    email TEXT NOT NULL,
    acm_email TEXT,
    github_username TEXT NOT NULL,
    discord_user_id TEXT NOT NULL
  )
`;
const sampleMembers = [
    {
        firstName: "Ava",
        lastName: "Nguyen",
        team: ACMTeam.Projects,
        position: ACMPosition.President,
        yearGraduating: 2027,
        email: "ava@acm.edu",
        acmEmail: "ava@acm.org",
        githubUsername: "avan",
        discordUserId: "ava#1234",
    },
    {
        firstName: "Mason",
        lastName: "Chen",
        team: ACMTeam.Events,
        position: ACMPosition.Board,
        yearGraduating: 2026,
        email: "mason@acm.edu",
        acmEmail: null,
        githubUsername: "masonc",
        discordUserId: "mason#5678",
    },
];
function normalizeMember(member) {
    return {
        ...member,
        acmEmail: member.acmEmail ?? null,
    };
}
function toMember(row) {
    return {
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        team: row.team,
        position: row.position,
        yearGraduating: row.year_graduating,
        email: row.email,
        acmEmail: row.acm_email ?? null,
        githubUsername: row.github_username,
        discordUserId: row.discord_user_id,
    };
}
function toRow(member) {
    return {
        first_name: member.firstName,
        last_name: member.lastName,
        team: member.team,
        position: member.position,
        year_graduating: member.yearGraduating,
        email: member.email,
        acm_email: member.acmEmail ?? null,
        github_username: member.githubUsername,
        discord_user_id: member.discordUserId,
    };
}
export class MemberStore {
    pool;
    memoryMembers;
    nextId;
    constructor(databaseUrl) {
        this.pool = databaseUrl ? new Pool({ connectionString: databaseUrl }) : null;
        this.memoryMembers = [];
        this.nextId = 1;
    }
    async init() {
        if (!this.pool) {
            this.memoryMembers = sampleMembers.map((member, index) => ({
                id: index + 1,
                ...member,
            }));
            this.nextId = this.memoryMembers.length + 1;
            return;
        }
        try {
            await this.pool.query("SELECT 1");
            await this.pool.query(createTableQuery);
            const countResult = await this.pool.query("SELECT COUNT(*)::int AS count FROM members");
            if (countResult.rows[0].count === 0) {
                for (const member of sampleMembers) {
                    const row = toRow(member);
                    await this.pool.query(`INSERT INTO members (first_name, last_name, team, position, year_graduating, email, acm_email, github_username, discord_user_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, [
                        row.first_name,
                        row.last_name,
                        row.team,
                        row.position,
                        row.year_graduating,
                        row.email,
                        row.acm_email,
                        row.github_username,
                        row.discord_user_id,
                    ]);
                }
            }
        }
        catch (error) {
            console.warn("PostgreSQL is not available, using in-memory storage for members.", error);
            this.pool = null;
            this.memoryMembers = sampleMembers.map((member, index) => ({
                id: index + 1,
                ...member,
            }));
            this.nextId = this.memoryMembers.length + 1;
        }
    }
    async list() {
        if (!this.pool) {
            return [...this.memoryMembers];
        }
        const result = await this.pool.query("SELECT id, first_name, last_name, team, position, year_graduating, email, acm_email, github_username, discord_user_id FROM members ORDER BY id ASC");
        return result.rows.map(toMember);
    }
    async get(id) {
        if (!this.pool) {
            return this.memoryMembers.find((member) => member.id === id) ?? null;
        }
        const result = await this.pool.query("SELECT id, first_name, last_name, team, position, year_graduating, email, acm_email, github_username, discord_user_id FROM members WHERE id = $1", [id]);
        return result.rows[0] ? toMember(result.rows[0]) : null;
    }
    async create(member) {
        const normalized = normalizeMember(member);
        if (!this.pool) {
            const created = {
                id: this.nextId++,
                ...normalized,
            };
            this.memoryMembers.push(created);
            return created;
        }
        const row = toRow(normalized);
        const result = await this.pool.query(`INSERT INTO members (first_name, last_name, team, position, year_graduating, email, acm_email, github_username, discord_user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, first_name, last_name, team, position, year_graduating, email, acm_email, github_username, discord_user_id`, [
            row.first_name,
            row.last_name,
            row.team,
            row.position,
            row.year_graduating,
            row.email,
            row.acm_email,
            row.github_username,
            row.discord_user_id,
        ]);
        return toMember(result.rows[0]);
    }
    async update(id, updates) {
        const current = await this.get(id);
        if (!current) {
            return null;
        }
        const merged = {
            firstName: updates.firstName ?? current.firstName,
            lastName: updates.lastName ?? current.lastName,
            team: updates.team ?? current.team,
            position: updates.position ?? current.position,
            yearGraduating: updates.yearGraduating ?? current.yearGraduating,
            email: updates.email ?? current.email,
            acmEmail: updates.acmEmail ?? current.acmEmail ?? null,
            githubUsername: updates.githubUsername ?? current.githubUsername,
            discordUserId: updates.discordUserId ?? current.discordUserId,
        };
        if (!this.pool) {
            const index = this.memoryMembers.findIndex((member) => member.id === id);
            if (index < 0) {
                return null;
            }
            this.memoryMembers[index] = {
                ...this.memoryMembers[index],
                ...merged,
            };
            return this.memoryMembers[index];
        }
        const row = toRow(normalizeMember(merged));
        const result = await this.pool.query(`UPDATE members
       SET first_name = $1,
           last_name = $2,
           team = $3,
           position = $4,
           year_graduating = $5,
           email = $6,
           acm_email = $7,
           github_username = $8,
           discord_user_id = $9
       WHERE id = $10
       RETURNING id, first_name, last_name, team, position, year_graduating, email, acm_email, github_username, discord_user_id`, [
            row.first_name,
            row.last_name,
            row.team,
            row.position,
            row.year_graduating,
            row.email,
            row.acm_email,
            row.github_username,
            row.discord_user_id,
            id,
        ]);
        return result.rows[0] ? toMember(result.rows[0]) : null;
    }
    async delete(id) {
        if (!this.pool) {
            const initialLength = this.memoryMembers.length;
            this.memoryMembers = this.memoryMembers.filter((member) => member.id !== id);
            return this.memoryMembers.length !== initialLength;
        }
        const result = await this.pool.query("DELETE FROM members WHERE id = $1", [id]);
        return (result.rowCount ?? 0) > 0;
    }
}
export const memberStore = new MemberStore(process.env.DATABASE_URL);
