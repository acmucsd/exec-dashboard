export type Member = {
  id?: number;
  firstName: string;
  lastName: string;
  team: string;
  position: string;
  yearGraduating: number;
  email: string;
  acmEmail: string | null;
  githubUsername: string;
  discordUserId: string;
};

export type MemberForm = Omit<Member, "id">;
export type Toast = { id: number; kind: "success" | "error"; message: string };
export type WorkflowTaskPreview = {
  taskId: string;
  label: string;
  description: string;
  requiresConfirmation: boolean;
};
export type WorkflowPreview = {
  confirmationId: string;
  summary: string;
  tasks: WorkflowTaskPreview[];
};
export type PendingChange =
  | {
      kind: "create" | "update";
      memberId: number | null;
      payload: MemberForm;
      preview: WorkflowPreview;
    }
  | { kind: "delete"; memberId: number; preview: WorkflowPreview };

export type MemberSnapshot = { members: MemberForm[] };
export type SnapshotFieldDiff = {
  field: keyof MemberForm;
  from: string | number | null;
  to: string | number | null;
};
type SnapshotUpsert = {
  action: "create" | "update";
  email: string;
  fullName: string;
  changes: SnapshotFieldDiff[];
  tasks: WorkflowTaskPreview[];
  retryUnfinishedWorkflow: boolean;
};
type SnapshotDelete = {
  action: "delete";
  email: string;
  fullName: string;
  changes: SnapshotFieldDiff[];
};
type SnapshotUnchanged = {
  action: "unchanged";
  email: string;
  fullName: string;
};
export type SnapshotPreview = {
  confirmationId: string;
  expiresAt: string;
  summary: {
    create: number;
    update: number;
    delete: number;
    unchanged: number;
    total: number;
  };
  creates: SnapshotUpsert[];
  updates: SnapshotUpsert[];
  deletes: SnapshotDelete[];
  unchanged: SnapshotUnchanged[];
};
type SnapshotOutcomeRow = {
  action: "create" | "update" | "delete";
  email: string;
};
export type SnapshotApplyResult = {
  ok: boolean;
  stoppedAt: string | null;
  applied: SnapshotOutcomeRow[];
  failed: (SnapshotOutcomeRow & { error: string })[];
  pending: SnapshotOutcomeRow[];
};
export type SnapshotReview = {
  snapshot: MemberSnapshot;
  preview: SnapshotPreview;
  result: SnapshotApplyResult | null;
  applyError?: string;
};
