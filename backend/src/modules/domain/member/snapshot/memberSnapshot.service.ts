import {
  ConflictException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowService } from '@modules/workflow/workflow.service';
import { WorkflowTaskPreview } from '@modules/workflow/types/Task';
import { Member } from '@t/Member';
import { MemberEntity } from '../member.entity';
import {
  MemberSnapshot,
  MemberSnapshotRecord,
  memberToSnapshotRecord,
  membersToSnapshot,
  normalizeEmailKey,
} from './memberSnapshot';

export const SNAPSHOT_TOKEN_TTL_MS = 15 * 60 * 1000;

export interface MemberSnapshotFieldDiff {
  field: keyof MemberSnapshotRecord;
  from: string | number | null;
  to: string | number | null;
}

export interface MemberSnapshotPlannedUpsert {
  action: 'create' | 'update';
  index: number;
  emailKey: string;
  email: string;
  fullName: string;
  memberId: number | null;
  retryUnfinishedWorkflow: boolean;
  changes: MemberSnapshotFieldDiff[];
  tasks: WorkflowTaskPreview[];
  after: MemberSnapshotRecord;
}

export interface MemberSnapshotPlannedDelete {
  action: 'delete';
  memberId: number;
  emailKey: string;
  email: string;
  fullName: string;
  changes: MemberSnapshotFieldDiff[];
}

export interface MemberSnapshotPlannedUnchanged {
  action: 'unchanged';
  memberId: number;
  emailKey: string;
  email: string;
  fullName: string;
}

export interface MemberSnapshotPlanSummary {
  create: number;
  update: number;
  delete: number;
  unchanged: number;
  total: number;
}

export interface MemberSnapshotPlan {
  fingerprint: string;
  summary: MemberSnapshotPlanSummary;
  creates: MemberSnapshotPlannedUpsert[];
  updates: MemberSnapshotPlannedUpsert[];
  deletes: MemberSnapshotPlannedDelete[];
  unchanged: MemberSnapshotPlannedUnchanged[];
}

export interface MemberSnapshotPreviewResponse extends MemberSnapshotPlan {
  confirmationId: string;
  expiresAt: string;
}

export interface MemberSnapshotAppliedRow {
  action: 'create' | 'update' | 'delete';
  emailKey: string;
  memberId: number | null;
  email: string;
  status: 'applied' | 'failed';
  error: string | null;
}

export interface MemberSnapshotFailedRow {
  action: 'create' | 'update' | 'delete';
  emailKey: string;
  index: number | null;
  memberId: number | null;
  email: string;
  error: string;
}

export interface MemberSnapshotPendingRow {
  action: 'create' | 'update' | 'delete';
  emailKey: string;
  index: number | null;
  memberId: number | null;
  email: string;
}

export interface MemberSnapshotApplyResult {
  ok: boolean;
  stoppedAt: string | null;
  applied: MemberSnapshotAppliedRow[];
  failed: MemberSnapshotFailedRow[];
  pending: MemberSnapshotPendingRow[];
}

interface PendingSnapshot {
  snapshotKey: string;
  plan: MemberSnapshotPlan;
  expiresAt: number;
}

@Injectable()
export class MemberSnapshotService {
  private readonly pendingSnapshots = new Map<string, PendingSnapshot>();

  constructor(
    @InjectRepository(MemberEntity)
    private readonly memberRepository: Repository<MemberEntity>,
    private readonly workflowService: WorkflowService,
  ) {}

  async buildSnapshot(): Promise<MemberSnapshot> {
    return membersToSnapshot(await this.memberRepository.find());
  }

  async preview(
    snapshot: MemberSnapshot,
  ): Promise<MemberSnapshotPreviewResponse> {
    const rows = await this.rowsWithPendingSnapshotWorkflow()
      .addSelect('member.setupPassword')
      .getMany();
    const plan = await this.planDiff(snapshot, rows);

    return this.issueConfirmation(plan, snapshot);
  }

  private async planDiff(
    snapshot: MemberSnapshot,
    destinationRows: readonly MemberEntity[],
  ): Promise<MemberSnapshotPlan> {
    assertUniqueEmails(destinationRows, 'destination');

    const destinationByEmail = new Map<string, MemberEntity>();
    for (const row of destinationRows) {
      destinationByEmail.set(normalizeEmailKey(row.email), row);
    }
    const snapshotKeys = new Set(
      snapshot.members.map((m) => normalizeEmailKey(m.email)),
    );

    const plan: MemberSnapshotPlan = {
      fingerprint: fingerprintDirectory(destinationRows),
      summary: { create: 0, update: 0, delete: 0, unchanged: 0, total: 0 },
      creates: [],
      updates: [],
      deletes: [],
      unchanged: [],
    };

    for (const [index, desired] of snapshot.members.entries()) {
      const emailKey = normalizeEmailKey(desired.email);
      const existing = destinationByEmail.get(emailKey);

      if (!existing) {
        plan.creates.push({
          action: 'create',
          index,
          emailKey,
          email: desired.email,
          fullName: fullNameOf(desired),
          memberId: null,
          retryUnfinishedWorkflow: false,
          changes: fieldDiff(null, desired),
          tasks: [],
          after: desired,
        });
        continue;
      }

      const before = memberToSnapshotRecord(existing);
      const after =
        desired.acmEmail === null && before.acmEmail !== null
          ? { ...desired, acmEmail: before.acmEmail }
          : desired;
      const changes = fieldDiff(before, after);

      if (changes.length === 0 && !existing.pendingSnapshotWorkflow) {
        plan.unchanged.push({
          action: 'unchanged',
          memberId: existing.id,
          emailKey,
          email: desired.email,
          fullName: fullNameOf(after),
        });
      } else {
        plan.updates.push({
          action: 'update',
          index,
          emailKey,
          email: desired.email,
          fullName: fullNameOf(after),
          memberId: existing.id,
          retryUnfinishedWorkflow: !!existing.pendingSnapshotWorkflow,
          changes,
          tasks: [],
          after,
        });
      }
    }

    for (const row of destinationRows) {
      const emailKey = normalizeEmailKey(row.email);
      if (snapshotKeys.has(emailKey)) continue;
      const record = memberToSnapshotRecord(row);
      plan.deletes.push({
        action: 'delete',
        memberId: row.id,
        emailKey,
        email: row.email,
        fullName: fullNameOf(record),
        changes: (Object.keys(record) as (keyof MemberSnapshotRecord)[]).map(
          (field) => ({ field, from: record[field], to: null }),
        ),
      });
    }

    plan.summary = {
      create: plan.creates.length,
      update: plan.updates.length,
      delete: plan.deletes.length,
      unchanged: plan.unchanged.length,
      total:
        plan.creates.length +
        plan.updates.length +
        plan.deletes.length +
        plan.unchanged.length,
    };

    const failedPreviews: { email: string; error: string }[] = [];
    for (const row of [...plan.creates, ...plan.updates]) {
      const workflowMember = { ...row.after, id: row.memberId ?? 0 } as Member;
      try {
        row.tasks = await this.workflowService.previewSnapshotMember(
          workflowMember,
          destinationByEmail.get(row.emailKey),
        );
      } catch (error) {
        failedPreviews.push({ email: row.email, error: errorMessage(error) });
      }
    }

    if (failedPreviews.length > 0) {
      throw new ServiceUnavailableException({
        message:
          'Workflow previews failed; no snapshot confirmation was issued.',
        failures: failedPreviews,
      });
    }

    return plan;
  }

  async apply(
    snapshot: MemberSnapshot,
    confirmationId?: string,
  ): Promise<MemberSnapshotApplyResult> {
    const plan = this.consumeConfirmation(snapshot, confirmationId);
    const rows = await this.rowsWithPendingSnapshotWorkflow().getMany();
    if (fingerprintDirectory(rows) !== plan.fingerprint) {
      throw new ConflictException(
        'The member directory changed after preview. Preview again before applying.',
      );
    }
    const queue = [...plan.creates, ...plan.updates, ...plan.deletes];
    const applied: MemberSnapshotAppliedRow[] = [];
    const failed: MemberSnapshotFailedRow[] = [];
    const pending: MemberSnapshotPendingRow[] = [];

    for (const [position, row] of queue.entries()) {
      try {
        if (row.action === 'delete') {
          const result = await this.memberRepository.delete(row.memberId);

          if (result.affected === 0) {
            throw new Error(`Member ${row.memberId} no longer exists.`);
          }
        } else {
          const target = row.after;
          const member =
            row.action === 'create'
              ? this.memberRepository.create(target as Partial<MemberEntity>)
              : Object.assign(await this.existingMember(row.memberId), target);

          member.pendingSnapshotWorkflow ??= {
            stage:
              row.action === 'create' && !member.acmEmail
                ? 'provisioning_pending'
                : 'sync_pending',
          };

          const saved = await this.memberRepository.save(member);
          row.memberId = saved.id;

          await this.workflowService.runSnapshotMember(saved, row.action);
        }

        applied.push({
          action: row.action,
          emailKey: row.emailKey,
          memberId: row.memberId,
          email: row.email,
          status: 'applied',
          error: null,
        });
      } catch (error) {
        const message = errorMessage(error);

        failed.push({
          action: row.action,
          emailKey: row.emailKey,
          index: row.action === 'delete' ? null : row.index,
          memberId: row.memberId,
          email: row.email,
          error: message,
        });

        for (const pendingRow of queue.slice(position + 1)) {
          pending.push({
            action: pendingRow.action,
            emailKey: pendingRow.emailKey,
            index: pendingRow.action === 'delete' ? null : pendingRow.index,
            memberId: pendingRow.memberId,
            email: pendingRow.email,
          });
        }

        break;
      }
    }

    return {
      ok: failed.length === 0,
      stoppedAt: failed[0]?.error ?? null,
      applied,
      failed,
      pending,
    };
  }

  private rowsWithPendingSnapshotWorkflow() {
    return this.memberRepository
      .createQueryBuilder('member')
      .addSelect('member.pendingSnapshotWorkflow');
  }

  private async existingMember(memberId: number | null): Promise<MemberEntity> {
    const existing = await this.rowsWithPendingSnapshotWorkflow()
      .where('member.id = :id', { id: memberId })
      .getOne();
    if (!existing) throw new Error(`Member ${memberId} no longer exists.`);
    return existing;
  }

  private issueConfirmation(
    plan: MemberSnapshotPlan,
    snapshot: MemberSnapshot,
  ): MemberSnapshotPreviewResponse {
    const now = Date.now();
    for (const [id, pending] of this.pendingSnapshots) {
      if (pending.expiresAt <= now) this.pendingSnapshots.delete(id);
    }
    const confirmationId = randomUUID();

    this.pendingSnapshots.set(confirmationId, {
      snapshotKey: canonicalKey(snapshot),
      plan,
      expiresAt: now + SNAPSHOT_TOKEN_TTL_MS,
    });

    return {
      ...plan,
      confirmationId,
      expiresAt: new Date(now + SNAPSHOT_TOKEN_TTL_MS).toISOString(),
    };
  }

  private consumeConfirmation(
    snapshot: MemberSnapshot,
    confirmationId?: string,
  ): MemberSnapshotPlan {
    const pending = confirmationId
      ? this.pendingSnapshots.get(confirmationId)
      : undefined;
    if (confirmationId) this.pendingSnapshots.delete(confirmationId);
    if (!pending)
      throw new ConflictException(
        'A valid X-Workflow-Confirmation from a matching snapshot preview is required.',
      );
    if (pending.expiresAt <= Date.now())
      throw new ConflictException('Snapshot preview expired; preview again.');
    if (pending.snapshotKey !== canonicalKey(snapshot))
      throw new ConflictException(
        'Snapshot differs from preview; preview again.',
      );

    return pending.plan;
  }
}

function fullNameOf(record: { firstName: string; lastName: string }): string {
  return `${record.firstName} ${record.lastName}`;
}

function fieldDiff(
  before: MemberSnapshotRecord | null,
  after: MemberSnapshotRecord,
): MemberSnapshotFieldDiff[] {
  return (Object.keys(after) as (keyof MemberSnapshotRecord)[])
    .filter((field) => !before || before[field] !== after[field])
    .map((field) => ({
      field,
      from: before ? before[field] : null,
      to: after[field],
    }));
}

function assertUniqueEmails(
  rows: readonly { email: string }[],
  side: string,
): void {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const row of rows) {
    const key = normalizeEmailKey(row.email);

    if (seen.has(key)) {
      duplicates.add(key);
    }

    seen.add(key);
  }

  if (duplicates.size) {
    throw new ConflictException(
      `Duplicate normalized email in ${side}: ${[...duplicates].join(', ')}`,
    );
  }
}

function canonicalKey(snapshot: MemberSnapshot): string {
  const sorted = [...snapshot.members].sort(
    (a, b) =>
      normalizeEmailKey(a.email).localeCompare(normalizeEmailKey(b.email)) ||
      a.email.localeCompare(b.email),
  );
  return JSON.stringify(sorted);
}

function fingerprintDirectory(rows: readonly MemberEntity[]): string {
  const canonical = rows
    .map((row) => {
      const record = memberToSnapshotRecord(row);
      return {
        id: row.id,
        ...record,
        pendingSnapshotWorkflow: row.pendingSnapshotWorkflow,
      };
    })
    .sort(
      (a, b) =>
        normalizeEmailKey(a.email).localeCompare(normalizeEmailKey(b.email)) ||
        a.id - b.id,
    );
  return createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
