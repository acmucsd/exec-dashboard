import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'

type Member = {
  id?: number
  firstName: string
  lastName: string
  team: string
  position: string
  yearGraduating: number
  email: string
  acmEmail: string | null
  githubUsername: string
  discordUserId: string
}

type MemberForm = Omit<Member, 'id'>
type Toast = { id: number; kind: 'success' | 'error'; message: string }

const getErrorMessage = async (response: Response, fallback: string) => {
  const body: unknown = await response.json().catch(() => null)
  if (typeof body === 'object' && body !== null && 'message' in body) {
    const message = body.message
    if (typeof message === 'string') return message
    if (Array.isArray(message)) return message.join(', ')
  }
  return fallback
}

const fetchMembers = async (): Promise<Member[]> => {
  const response = await fetch('/api/members')
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Unable to load members'))
  }
  return (await response.json()) as Member[]
}

const emptyForm: MemberForm = {
  firstName: '',
  lastName: '',
  team: 'Projects',
  position: 'Member',
  yearGraduating: new Date().getFullYear() + 1,
  email: '',
  acmEmail: '',
  githubUsername: '',
  discordUserId: '',
}

function App() {
  const [members, setMembers] = useState<Member[]>([])
  const [form, setForm] = useState<MemberForm>(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextToastId = useRef(0)
  const toastTimeouts = useRef(new Map<number, number>())

  useEffect(() => {
    const timeouts = toastTimeouts.current
    return () => {
      timeouts.forEach((timeoutId) => window.clearTimeout(timeoutId))
      timeouts.clear()
    }
  }, [])

  const dismissToast = useCallback((id: number) => {
    const timeoutId = toastTimeouts.current.get(id)
    if (timeoutId !== undefined) window.clearTimeout(timeoutId)
    toastTimeouts.current.delete(id)
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback((message: string, kind: Toast['kind']) => {
    const id = ++nextToastId.current
    setToasts((current) => [...current, { id, message, kind }])
    const timeoutId = window.setTimeout(() => dismissToast(id), 6000)
    toastTimeouts.current.set(id, timeoutId)
  }, [dismissToast])

  const loadMembers = async () => {
    try {
      setMembers(await fetchMembers())
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unexpected error', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void fetchMembers()
      .then(setMembers)
      .catch((err: unknown) => {
        showToast(err instanceof Error ? err.message : 'Unexpected error', 'error')
      })
      .finally(() => setIsLoading(false))
  }, [showToast])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: name === 'yearGraduating' ? Number(value) : value,
    }))
  }

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const payload = {
      ...form,
      acmEmail: form.acmEmail || null,
    }

    try {
      const response = editingId
        ? await fetch(`/api/members/${editingId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/members', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Unable to save member'))
      }

      const savedMember = (await response.json()) as Member
      const wasEditing = editingId !== null
      setMembers((current) =>
        wasEditing
          ? current.map((member) =>
              member.id === savedMember.id ? savedMember : member,
            )
          : [...current, savedMember],
      )
      resetForm()
      showToast(
        wasEditing ? 'Member updated successfully.' : 'Member created successfully.',
        'success',
      )
      void loadMembers()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unexpected error', 'error')
    }
  }

  const handleEdit = (member: Member) => {
    setEditingId(member.id ?? null)
    setForm({
      firstName: member.firstName,
      lastName: member.lastName,
      team: member.team,
      position: member.position,
      yearGraduating: member.yearGraduating,
      email: member.email,
      acmEmail: member.acmEmail ?? '',
      githubUsername: member.githubUsername,
      discordUserId: member.discordUserId,
    })
  }

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/members/${id}`, { method: 'DELETE' })
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Unable to delete member'))
      }
      if (editingId === id) {
        resetForm()
      }
      setMembers((current) => current.filter((member) => member.id !== id))
      showToast('Member deleted successfully.', 'success')
      void loadMembers()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unexpected error', 'error')
    }
  }

  return (
    <div className="app-shell">
      <div className="toast-stack" aria-label="Notifications">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast toast-${toast.kind}`}
            role={toast.kind === 'error' ? 'alert' : 'status'}
          >
            <p>{toast.message}</p>
            <button
              type="button"
              className="toast-dismiss"
              onClick={() => dismissToast(toast.id)}
              aria-label={`Dismiss ${toast.kind} notification`}
            >
              Close
            </button>
          </div>
        ))}
      </div>
      <header className="page-header">
        <div>
          <p className="eyebrow">Exec Dashboard</p>
          <h1>Members</h1>
        </div>
        <p className="helper-text">Create, edit, and remove members from the shared backend.</p>
      </header>

      <section className="panel form-panel">
        <h2>{editingId ? 'Update member' : 'Add a member'}</h2>
        <form onSubmit={handleSubmit} className="member-form">
          <div className="grid two-up">
            <label>
              First name
              <input name="firstName" value={form.firstName} onChange={handleChange} required />
            </label>
            <label>
              Last name
              <input name="lastName" value={form.lastName} onChange={handleChange} required />
            </label>
          </div>

          <div className="grid two-up">
            <label>
              Team
              <select name="team" value={form.team} onChange={handleChange}>
                <option value="AI">AI</option>
                <option value="Cyber">Cyber</option>
                <option value="Development">Development</option>
                <option value="Events">Events</option>
                <option value="External">External</option>
                <option value="Finance">Finance</option>
                <option value="Hack">Hack</option>
                <option value="Hackathon">Hackathon</option>
                <option value="Membership">Membership</option>
                <option value="Outreach">Outreach</option>
                <option value="Projects">Projects</option>
                <option value="None">None</option>
              </select>
            </label>
            <label>
              Position
              <select name="position" value={form.position} onChange={handleChange}>
                <option value="President">President</option>
                <option value="VP">VP</option>
                <option value="Board">Board</option>
                <option value="Staff">Staff</option>
                <option value="Applicant">Applicant</option>
                <option value="Member at Large">Member at Large</option>
                <option value="Member">Member</option>
              </select>
            </label>
          </div>

          <div className="grid two-up">
            <label>
              Graduation year
              <input name="yearGraduating" type="number" value={form.yearGraduating} onChange={handleChange} required />
            </label>
            <label>
              Email
              <input name="email" type="email" value={form.email} onChange={handleChange} required />
            </label>
          </div>

          <div className="grid two-up">
            <label>
              ACM email
              <input name="acmEmail" value={form.acmEmail ?? ''} onChange={handleChange} />
            </label>
            <label>
              GitHub username
              <input name="githubUsername" value={form.githubUsername} onChange={handleChange} required />
            </label>
          </div>

          <label>
            Discord user ID
            <input name="discordUserId" value={form.discordUserId} onChange={handleChange} required />
          </label>

          <div className="button-row">
            <button type="submit">{editingId ? 'Save changes' : 'Create member'}</button>
            {editingId ? <button type="button" className="secondary" onClick={resetForm}>Cancel</button> : null}
          </div>
        </form>
      </section>

      <section className="panel table-panel">
        <div className="table-header">
          <h2>Member directory</h2>
          <button type="button" className="secondary" onClick={() => void loadMembers()}>
            Refresh
          </button>
        </div>

        {isLoading ? (
          <p>Loading members...</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>First name</th>
                  <th>Last name</th>
                  <th>Team</th>
                  <th>Position</th>
                  <th>Graduation</th>
                  <th>Email</th>
                  <th>ACM email</th>
                  <th>GitHub</th>
                  <th>Discord</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id ?? `${member.email}-${member.githubUsername}`}>
                    <td>{member.firstName}</td>
                    <td>{member.lastName}</td>
                    <td>{member.team}</td>
                    <td>{member.position}</td>
                    <td>{member.yearGraduating}</td>
                    <td>{member.email}</td>
                    <td>{member.acmEmail ?? '—'}</td>
                    <td>{member.githubUsername}</td>
                    <td>{member.discordUserId}</td>
                    <td>
                      <div className="action-row">
                        <button type="button" className="secondary" onClick={() => handleEdit(member)}>
                          Edit
                        </button>
                        <button type="button" className="danger" onClick={() => void handleDelete(member.id ?? 0)}>
                          Delete
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
    </div>
  )
}

export default App
