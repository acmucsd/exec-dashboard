import Modal from "./Modal";
import type { PendingChange } from "../types";

function WorkflowModal({
  pendingChange,
  isApplying,
  onConfirm,
  onCancel,
}: {
  pendingChange: PendingChange;
  isApplying: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      className="workflow-modal"
      eyebrow="Review before applying"
      titleId="workflow-modal-title"
      title="Confirm changes"
      busy={isApplying}
      onEscape={onCancel}
    >
      <p className="workflow-summary">{pendingChange.preview.summary}</p>
      {pendingChange.preview.tasks.length > 0 ? (
        <ul className="workflow-task-list">
          {pendingChange.preview.tasks.map((task) => (
            <li key={task.taskId}>
              <div className="workflow-task-heading">
                <h3>{task.label}</h3>
                <span
                  className={
                    task.requiresConfirmation
                      ? "task-confirmation"
                      : "task-informational"
                  }
                >
                  {task.requiresConfirmation ? "Will change" : "Informational"}
                </span>
              </div>
              <p>{task.description}</p>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="modal-actions">
        <button
          type="button"
          className="secondary"
          onClick={onCancel}
          disabled={isApplying}
        >
          Cancel
        </button>
        <button type="button" onClick={onConfirm} disabled={isApplying}>
          {isApplying ? (
            <>
              <span className="loading-spinner" aria-hidden="true" />
              Applying...
            </>
          ) : (
            "Confirm and apply"
          )}
        </button>
      </div>
    </Modal>
  );
}

export default WorkflowModal;
