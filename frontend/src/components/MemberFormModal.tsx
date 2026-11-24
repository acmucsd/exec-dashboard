import Modal from "./Modal";
import type { MemberForm } from "../types";

const TEAM_OPTIONS = [
  "AI",
  "Cyber",
  "Development",
  "Events",
  "External",
  "Finance",
  "Hack",
  "Hackathon",
  "Membership",
  "Outreach",
  "Projects",
  "None",
];

const POSITION_OPTIONS = [
  "President",
  "VP",
  "Board",
  "Staff",
  "Applicant",
  "Member at Large",
  "Member",
];

function MemberFormModal({
  form,
  editingId,
  isPreparing,
  onChange,
  onSubmit,
  onClose,
}: {
  form: MemberForm;
  editingId: number | null;
  isPreparing: boolean;
  onChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  onSubmit: (event: React.FormEvent) => void;
  onClose: () => void;
}) {
  return (
    <Modal
      className="workflow-modal member-modal"
      eyebrow={editingId ? "Edit existing member" : "New member"}
      titleId="member-modal-title"
      title={editingId ? "Update member" : "Add a member"}
      busy={isPreparing}
      onEscape={onClose}
    >
      <form onSubmit={onSubmit}>
        <fieldset className="member-form" disabled={isPreparing}>
          <div className="grid two-up">
            <label>
              First name
              <input name="firstName" value={form.firstName} onChange={onChange} required />
            </label>
            <label>
              Last name
              <input name="lastName" value={form.lastName} onChange={onChange} required />
            </label>
          </div>

          <div className="grid two-up">
            <label>
              Team
              <select name="team" value={form.team} onChange={onChange}>
                {TEAM_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Position
              <select name="position" value={form.position} onChange={onChange}>
                {POSITION_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid two-up">
            <label>
              Graduation year
              <input
                name="yearGraduating"
                type="number"
                value={form.yearGraduating}
                onChange={onChange}
                required
              />
            </label>
            <label>
              Email
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                required
              />
            </label>
          </div>

          <div className="grid two-up">
            <label>
              ACM email
              <input name="acmEmail" value={form.acmEmail ?? ""} onChange={onChange} />
            </label>
            <label>
              GitHub username
              <input
                name="githubUsername"
                value={form.githubUsername}
                onChange={onChange}
                required
              />
            </label>
          </div>

          <label>
            Discord user ID
            <input
              name="discordUserId"
              value={form.discordUserId}
              onChange={onChange}
              required
            />
          </label>

          <div className="modal-actions">
            <button
              type="button"
              className="secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit">
              {isPreparing ? (
                <>
                  <span className="loading-spinner" aria-hidden="true" />
                  Preparing preview...
                </>
              ) : editingId ? (
                "Review changes"
              ) : (
                "Review new member"
              )}
            </button>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}

export default MemberFormModal;
