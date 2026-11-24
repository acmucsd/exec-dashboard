import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import {
  applyMemberSnapshot,
  createMember,
  deleteMember,
  exportMemberSnapshot,
  listMembers,
  previewCreateMember,
  previewDeleteMember,
  previewMemberSnapshot,
  previewUpdateMember,
  updateMember,
} from "./api/members";
import { HttpError } from "./api/requests";
import MemberFormModal from "./components/MemberFormModal";
import MembersTable from "./components/MembersTable";
import SnapshotModal from "./components/SnapshotModal";
import ToastStack from "./components/ToastStack";
import WorkflowModal from "./components/WorkflowModal";
import type {
  Member,
  MemberForm,
  MemberSnapshot,
  PendingChange,
  SnapshotReview,
  Toast,
} from "./types";

const emptyForm: MemberForm = {
  firstName: "",
  lastName: "",
  team: "Projects",
  position: "Member",
  yearGraduating: new Date().getFullYear() + 1,
  email: "",
  acmEmail: "",
  githubUsername: "",
  discordUserId: "",
};

function App() {
  const [members, setMembers] = useState<Member[]>([]);
  const [form, setForm] = useState<MemberForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isSnapshotPreparing, setIsSnapshotPreparing] = useState(false);
  const [isSnapshotApplying, setIsSnapshotApplying] = useState(false);
  const [snapshotReview, setSnapshotReview] = useState<SnapshotReview | null>(
    null,
  );
  const [snapshotConfirmed, setSnapshotConfirmed] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(
    null,
  );
  const nextToastId = useRef(0);
  const toastTimeouts = useRef(new Map<number, number>());
  const snapshotApplyLock = useRef(false);
  const memberApplyLock = useRef(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const busy =
    isPreparing || isApplying || isSnapshotPreparing || isSnapshotApplying;
  // No focus repair: App swaps this whole dialog for WorkflowModal, which
  // focuses on its own mount.
  const activeDialog = pendingChange
    ? "workflow"
    : snapshotReview
      ? "snapshot"
      : isMemberModalOpen
        ? "member"
        : null;
  const snapshotBodyKey = snapshotReview
    ? snapshotReview.result
      ? `result:${snapshotReview.result.stoppedAt ?? (snapshotReview.result.ok ? "ok" : "partial")}`
      : snapshotReview.applyError
        ? `error:${snapshotReview.applyError}`
        : `preview:${snapshotReview.preview.confirmationId}`
    : undefined;

  useEffect(() => {
    const timeouts = toastTimeouts.current;
    return () => {
      timeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeouts.clear();
    };
  }, []);

  const dismissToast = useCallback((id: number) => {
    const timeoutId = toastTimeouts.current.get(id);
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    toastTimeouts.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, kind: Toast["kind"], { persistent = false } = {}) => {
      const id = ++nextToastId.current;
      setToasts((current) => [...current, { id, message, kind }]);
      if (!persistent) {
        const timeoutId = window.setTimeout(() => dismissToast(id), 6000);
        toastTimeouts.current.set(id, timeoutId);
      }
    },
    [dismissToast],
  );

  const loadMembers = async () => {
    try {
      setMembers(await listMembers());
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Unexpected error",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void listMembers()
      .then(setMembers)
      .catch((err: unknown) => {
        showToast(
          err instanceof Error ? err.message : "Unexpected error",
          "error",
        );
      })
      .finally(() => setIsLoading(false));
  }, [showToast]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: name === "yearGraduating" ? Number(value) : value,
    }));
  };

  const resetForm = useCallback(() => {
    setForm(emptyForm);
    setEditingId(null);
  }, []);

  const openMemberModal = (origin: HTMLElement | null) => {
    lastFocusedRef.current = origin;
    resetForm();
    setIsMemberModalOpen(true);
  };

  const closeMemberModal = useCallback(() => {
    setIsMemberModalOpen(false);
    resetForm();
  }, [resetForm]);

  const cancelActiveDialog = useCallback(() => {
    if (activeDialog === "workflow") {
      setPendingChange(null);
    } else if (activeDialog === "snapshot") {
      setSnapshotReview(null);
      setSnapshotConfirmed(false);
    } else {
      closeMemberModal();
    }
  }, [activeDialog, closeMemberModal]);

  // Final focus restoration only when the last dialog closes, with Add as the
  // fallback if the initiating row disappeared. Dialog-to-dialog transitions
  // keep the origin until the new dialog closes.
  useEffect(() => {
    if (activeDialog === null && lastFocusedRef.current) {
      const origin = lastFocusedRef.current;
      (origin.isConnected ? origin : addButtonRef.current)?.focus();
      lastFocusedRef.current = null;
    }
  }, [activeDialog]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;

    const payload = {
      ...form,
      acmEmail: form.acmEmail || null,
    };

    setIsPreparing(true);
    try {
      const preview = editingId
        ? await previewUpdateMember(editingId, payload)
        : await previewCreateMember(payload);
      // Only switch the form modal to the confirmation step after a successful preview.
      setPendingChange({
        kind: editingId ? "update" : "create",
        memberId: editingId,
        payload,
        preview,
      });
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Unexpected error",
        "error",
      );
    } finally {
      setIsPreparing(false);
    }
  };

  const handleEdit = (member: Member, origin: HTMLElement | null) => {
    lastFocusedRef.current = origin;
    setIsMemberModalOpen(true);
    setEditingId(member.id ?? null);
    setForm({
      firstName: member.firstName,
      lastName: member.lastName,
      team: member.team,
      position: member.position,
      yearGraduating: member.yearGraduating,
      email: member.email,
      acmEmail: member.acmEmail ?? "",
      githubUsername: member.githubUsername,
      discordUserId: member.discordUserId,
    });
  };

  const handleDelete = async (member: Member, origin: HTMLElement) => {
    const id = member.id;
    if (id === undefined) return;
    lastFocusedRef.current = origin;
    setIsPreparing(true);
    try {
      const preview = await previewDeleteMember(id);
      setPendingChange({ kind: "delete", memberId: id, preview });
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Unexpected error",
        "error",
      );
    } finally {
      setIsPreparing(false);
    }
  };

  const handleConfirmChange = async () => {
    if (!pendingChange || memberApplyLock.current) return;
    memberApplyLock.current = true;
    setIsApplying(true);

    try {
      // Narrow the union before reading `payload`: only create/update carry it.
      if (pendingChange.kind === "delete") {
        const { memberId, preview } = pendingChange;
        await deleteMember(memberId, preview.confirmationId);
        setMembers((current) =>
          current.filter((member) => member.id !== memberId),
        );
        if (editingId === memberId) resetForm();
        showToast("Member deleted successfully.", "success");
      } else {
        const { kind, memberId, payload, preview } = pendingChange;
        const savedMember =
          kind === "update"
            ? await updateMember(memberId as number, payload, preview.confirmationId)
            : await createMember(payload, preview.confirmationId);
        setMembers((current) =>
          kind === "update"
            ? current.map((member) =>
                member.id === savedMember.id ? savedMember : member,
              )
            : [...current, savedMember],
        );
        showToast(
          kind === "update"
            ? "Member updated successfully."
            : "Member created successfully.",
          "success",
        );
      }
      setPendingChange(null);
      closeMemberModal();
      void loadMembers();
    } catch (err) {
      setPendingChange(null);
      showToast(
        err instanceof Error ? err.message : "Unexpected error",
        "error",
      );
    } finally {
      memberApplyLock.current = false;
      setIsApplying(false);
    }
  };

  const handleDownloadSnapshot = async () => {
    try {
      const snapshot = await exportMemberSnapshot();
      if (snapshot.members.length === 0) {
        showToast("No members to export.", "error");
        return;
      }
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(snapshot, null, 2)], {
          type: "application/json",
        }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = "members-snapshot.json";
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showToast(`Exported ${snapshot.members.length} members.`, "success");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Unable to export member snapshot",
        "error",
      );
    }
  };

  const handleSnapshotFile = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setIsSnapshotPreparing(true);
    setSnapshotConfirmed(false);
    try {
      const snapshot = JSON.parse(await file.text()) as MemberSnapshot;
      const preview = await previewMemberSnapshot(snapshot);
      setSnapshotReview({ snapshot, preview, result: null });
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Unable to read member snapshot",
        "error",
        { persistent: true },
      );
    } finally {
      setIsSnapshotPreparing(false);
    }
  };

  const handleApplySnapshot = async () => {
    if (
      !snapshotReview ||
      !snapshotConfirmed ||
      snapshotApplyLock.current ||
      snapshotReview.result
    )
      return;
    snapshotApplyLock.current = true;
    setIsSnapshotApplying(true);
    try {
      const result = await applyMemberSnapshot(
        snapshotReview.snapshot,
        snapshotReview.preview.confirmationId,
      );
      setSnapshotReview((current) =>
        current ? { ...current, result } : current,
      );
      showToast(
        result.ok
          ? "Member snapshot applied successfully."
          : "Snapshot apply stopped after a partial failure. Review completed, failed, and pending rows below.",
        result.ok ? "success" : "error",
      );
    } catch (err) {
      // HttpError is a server rejection; any other error means the outcome is
      // unknown. Both stop the dialog and neither retries automatically.
      const message =
        err instanceof HttpError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Unexpected error";
      setSnapshotReview((current) =>
        current ? { ...current, applyError: message } : current,
      );
      showToast(
        err instanceof HttpError
          ? `${message}. The request will not be retried; refresh the directory to verify its state.`
          : `Could not confirm the snapshot result: ${message}. The request will not be retried; refresh the directory to verify its state.`,
        "error",
      );
    } finally {
      snapshotApplyLock.current = false;
      setIsSnapshotApplying(false);
      await loadMembers();
    }
  };

  return (
    <div className="app-shell">
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      {pendingChange ? (
        <WorkflowModal
          pendingChange={pendingChange}
          isApplying={isApplying}
          onConfirm={() => void handleConfirmChange()}
          onCancel={cancelActiveDialog}
        />
      ) : null}
      {snapshotReview && activeDialog === "snapshot" ? (
        <SnapshotModal
          review={snapshotReview}
          confirmed={snapshotConfirmed}
          isApplying={isSnapshotApplying}
          bodyKey={snapshotBodyKey}
          onConfirmedChange={setSnapshotConfirmed}
          onApply={() => void handleApplySnapshot()}
          onCancel={cancelActiveDialog}
        />
      ) : null}
      <header className="page-header" inert={activeDialog !== null}>
        <div>
          <p className="eyebrow">Exec Dashboard</p>
          <h1>Members</h1>
        </div>
        <div className="header-actions">
          <button
            ref={addButtonRef}
            type="button"
            onClick={(event) => openMemberModal(event.currentTarget)}
            disabled={busy}
          >
            Add
          </button>
          <button
            type="button"
            className="secondary"
            onClick={(event) => {
              lastFocusedRef.current = event.currentTarget;
              importInputRef.current?.click();
            }}
            disabled={busy}
          >
            Import
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => void handleDownloadSnapshot()}
            disabled={busy}
          >
            Export
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(event) => void handleSnapshotFile(event)}
            disabled={busy}
          />
        </div>
      </header>

      {activeDialog === "member" ? (
        <MemberFormModal
          form={form}
          editingId={editingId}
          isPreparing={isPreparing}
          onChange={handleChange}
          onSubmit={(event) => void handleSubmit(event)}
          onClose={closeMemberModal}
        />
      ) : null}

      <div inert={activeDialog !== null}>
        <MembersTable
          members={members}
          isLoading={isLoading}
          busy={busy}
          isPreparing={isPreparing}
          onRefresh={() => void loadMembers()}
          onEdit={handleEdit}
          onDelete={(member, origin) => void handleDelete(member, origin)}
        />
      </div>
    </div>
  );
}

export default App;
