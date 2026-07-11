import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'members' })
export class MemberEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: 'varchar', length: 128 })
	firstName: string;

	@Column({ type: 'varchar', length: 128 })
	lastName: string;

	@Column({ type: 'varchar', length: 64 })
	team: string;

	@Column({ type: 'varchar', length: 64 })
	position: string;

	@Column({ type: 'integer' })
	yearGraduating: number;

	@Column({ type: 'varchar', length: 256 })
	email: string;

	@Column({ type: 'varchar', length: 256, nullable: true })
	acmEmail: string | null;

	@Column({ type: 'varchar', length: 128, nullable: true })
	githubUsername: string;

	@Column({ type: 'varchar', length: 128, nullable: true })
	discordUserId: string;
}
