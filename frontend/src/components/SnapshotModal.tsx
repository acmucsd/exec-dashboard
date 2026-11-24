import Modal from "./Modal";
import type {
  SnapshotApplyResult,
  SnapshotFieldDiff,
  SnapshotReview,
  WorkflowTaskPreview,
} from "../types";

const snapshotActionLabels = {
  create: "Create",
  update: "Update",
  delete: "Remove",
  unchanged: "Unchanged",
};

const displayValue = (value: string | number | null) =>
  value === null || value === "" ? "—" : String(value);

function SnapshotOutcome({
  title,
  rows,
  errors = false,
}: {
  title: string;
  rows: SnapshotApplyResult["applied" | "failed" | "pending"];
  errors?: boolean;
}) {
  if (rows.length === 0) return null;
  return (
    <section className={`snapshot-outcome${errors ? " has-errors" : ""}`}>
      <h3>
        {title} ({rows.length})
      </h3>
      <ul>
        {rows.map((row, index) => (
          <li key={`${row.action}-${row.email}-${index}`}>
            <strong>{row.action}</strong> · {row.email}
            {"error" in row && typeof row.error === "string" ? (
              <p>{row.error}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

const renderSnapshotChanges = (
  changes: SnapshotFieldDiff[],
  created = false,
) => (
  <ul className="snapshot-diff-list">
    {changes.map((change) => (
      <li key={change.field}>
        <strong>{change.field}</strong>
        {created ? (
          <span>{displayValue(change.to)}</span>
        ) : (
          <span>
            {displayValue(change.from)} <span aria-hidden="true">→</span>{" "}
            {displayValue(change.to)}
          </span>
        )}
      </li>
    ))}
  </ul>
);

const renderSnapshotTasks = (tasks: WorkflowTaskPreview[]) =>
  tasks.length > 0 ? (
    <ul className="snapshot-task-list">
      {tasks.map((task) => (
        <li key={task.taskId}>
          <span
            className={
              task.requiresConfirmation ? "task-confirmation" : "task-informational"
            }
          >
            {task.requiresConfirmation ? "Will change" : "Informational"}
          </span>
          <div>
            <strong>{task.label}</strong>
            <p>{task.description}</p>
          </div>
        </li>
      ))}
    </ul>
  ) : (
    <p className="snapshot-no-tasks">No workflow tasks.</p>
  );

function SnapshotModal({
  review,
  confirmed,
  isApplying,
  bodyKey,
  onConfirmedChange,
  onApply,
  onCancel,
}: {
  review: SnapshotReview;
  confirmed: boolean;
  isApplying: boolean;
  // Changes when the dialog body swaps (preview -> apply result); lets the
  // shell repair focus after the old controls disappear.
  bodyKey?: string;
  onConfirmedChange: (checked: boolean) => void;
  onApply: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      className="workflow-modal snapshot-modal"
      eyebrow="Snapshot import"
      titleId="snapshot-modal-title"
      title={
        review.result || review.applyError
          ? "Snapshot apply result"
          : "Review snapshot changes"
      }
      busy={isApplying}
      bodyKey={bodyKey}
      onEscape={onCancel}
    >
      {review.result || review.applyError ? (
        <>
          {review.result ? (
            <>
              <p
                className={
                  review.result.ok
                    ? "snapshot-result-success"
                    : "snapshot-result-warning"
                }
              >
                {review.result.ok
                  ? "All planned changes completed."
                  : `Partial apply: ${review.result.applied.length} completed, ${review.result.failed.length} failed, ${review.result.pending.length} pending. No automatic retry was made. Import the snapshot again to review what remains before confirming another apply.`}
              </p>
              {review.result.stoppedAt ? (
                <p>
                  <strong>Stopped at:</strong> {review.result.stoppedAt}
                </p>
              ) : null}
              <SnapshotOutcome title="Completed" rows={review.result.applied} />
              <SnapshotOutcome title="Failed" rows={review.result.failed} errors />
              <SnapshotOutcome
                title="Pending (not attempted)"
                rows={review.result.pending}
              />
            </>
          ) : (
            <p className="snapshot-result-warning">
              {review.applyError} The request will not be retried. Refresh the
              directory and verify its state before starting a new import.
            </p>
          )}
          <div className="modal-actions">
            <button
              type="button"
              onClick={onCancel}
              disabled={isApplying}
            >
              Close
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="workflow-summary">
            {review.preview.summary.total} total:{" "}
            {review.preview.summary.create} create,{" "}
            {review.preview.summary.update} update,{" "}
            {review.preview.summary.delete} delete,{" "}
            {review.preview.summary.unchanged} unchanged.
          </p>
          {review.preview.summary.total > 0 ? (
            <div className="snapshot-review-list">
              {[
                ...review.preview.creates,
                ...review.preview.updates,
                ...review.preview.deletes,
                ...review.preview.unchanged,
              ].map((row) => {
                const upsert = row.action === "create" || row.action === "update";
                const retry = upsert && row.retryUnfinishedWorkflow;
                return (
                  <details
                    className="snapshot-member-card"
                    key={`${row.action}-${row.email}`}
                  >
                    <summary className="snapshot-member-summary">
                      <span className="snapshot-member-email">
                        {row.fullName} · {row.email}
                      </span>
                      <span className={`snapshot-action ${row.action}`}>
                        {retry
                          ? "Retry unfinished workflow"
                          : snapshotActionLabels[row.action]}
                      </span>
                    </summary>
                    <div className="snapshot-member-body">
                      {row.action === "delete" ? (
                        <p className="snapshot-delete-warning">
                          Directory-only removal: no workflow runs or external
                          accounts will be deleted.
                        </p>
                      ) : null}
                      {row.action !== "unchanged" && row.changes.length > 0 ? (
                        renderSnapshotChanges(row.changes, row.action === "create")
                      ) : (
                        <p className="snapshot-no-tasks">
                          {retry
                            ? "No directory fields changed."
                            : "No changes needed for this member."}
                        </p>
                      )}
                      {upsert ? (
                        <>
                          <h4>Workflow preview</h4>
                          {renderSnapshotTasks(row.tasks)}
                        </>
                      ) : null}
                    </div>
                  </details>
                );
              })}
            </div>
          ) : (
            <p>No directory changes are needed.</p>
          )}
          <label className="snapshot-confirm-check">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => onConfirmedChange(event.target.checked)}
              disabled={isApplying}
            />
            I reviewed the snapshot changes and authorize this one-time apply.
          </label>
          <p className="snapshot-expiry">
            Confirmation expires{" "}
            {new Date(review.preview.expiresAt).toLocaleString()}.
          </p>
          <div className="modal-actions">
            <button
              type="button"
              className="secondary"
              onClick={onCancel}
              disabled={isApplying}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onApply}
              disabled={
                !confirmed ||
                isApplying ||
                review.preview.summary.total === review.preview.summary.unchanged
              }
            >
              {isApplying ? (
                <>
                  <span className="loading-spinner" aria-hidden="true" />
                  Applying once...
                </>
              ) : (
                "Confirm and apply once"
              )}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}

export default SnapshotModal;
