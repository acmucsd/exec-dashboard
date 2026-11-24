import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type PendingSnapshotWorkflow =
  | { stage: 'sync_pending' }
  | { stage: 'provisioning_pending' }
  | { stage: 'setup_email_pending'; acmEmail: string; recipientEmail: string };

export const INTERNAL_MEMBER_FIELDS = [
  'setupPassword',
  'pendingSnapshotWorkflow',
  'snapshotRecovery',
] as const;

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

  @Column({ type: 'varchar', length: 128, nullable: true, select: false })
  setupPassword: string | null;

  @Column({ type: 'jsonb', nullable: true, select: false })
  pendingSnapshotWorkflow: PendingSnapshotWorkflow | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  githubUsername: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  discordUserId: string;
}
