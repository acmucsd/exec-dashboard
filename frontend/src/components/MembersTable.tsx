import type { Member } from "../types";

function MembersTable({
  members,
  isLoading,
  busy,
  isPreparing,
  onRefresh,
  onEdit,
  onDelete,
}: {
  members: Member[];
  isLoading: boolean;
  busy: boolean;
  isPreparing: boolean;
  onRefresh: () => void;
  onEdit: (member: Member, origin: HTMLElement | null) => void;
  onDelete: (member: Member, origin: HTMLElement) => void;
}) {
  return (
    <section className="panel table-panel">
      <div className="table-header">
        <h2 id="member-directory-title">Member directory</h2>
        <button
          type="button"
          className="secondary"
          onClick={onRefresh}
          disabled={busy}
        >
          Refresh
        </button>
      </div>

      {isLoading ? (
        <p>Loading members...</p>
      ) : (
        <div
          className="table-wrap"
          role="region"
          aria-labelledby="member-directory-title"
          tabIndex={0}
        >
          <table>
            <thead>
              <tr>
                <th scope="col">Member</th>
                <th scope="col">Role</th>
                <th scope="col">Contact</th>
                <th scope="col">Graduation</th>
                <th scope="col">GitHub</th>
                <th scope="col">Discord</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr
                  key={
                    member.id ?? `${member.email}-${member.githubUsername}`
                  }
                >
                  <th scope="row">{member.firstName} {member.lastName}</th>
                  <td className="table-role">
                    {member.team}
                    <div className="table-secondary">{member.position}</div>
                  </td>
                  <td className="table-contact">
                    <div>
                      <span className="table-label">Personal:</span> {member.email}
                    </div>
                    <div className="table-secondary">
                      <span className="table-label">ACM:</span> {member.acmEmail ?? "—"}
                    </div>
                  </td>
                  <td>{member.yearGraduating}</td>
                  <td className="table-github">{member.githubUsername}</td>
                  <td className="table-discord">{member.discordUserId}</td>
                  <td>
                    <div className="action-row">
                      <button
                        type="button"
                        className="secondary"
                        aria-label={`Edit ${member.firstName} ${member.lastName}`}
                        onClick={(event) => onEdit(member, event.currentTarget)}
                        disabled={busy}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="danger"
                        aria-label={`Delete ${member.firstName} ${member.lastName}`}
                        onClick={(event) =>
                          void onDelete(member, event.currentTarget)
                        }
                        disabled={busy}
                      >
                        {isPreparing ? (
                          <>
                            <span
                              className="loading-spinner"
                              aria-hidden="true"
                            />
                            Preparing...
                          </>
                        ) : (
                          "Delete"
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default MembersTable;
