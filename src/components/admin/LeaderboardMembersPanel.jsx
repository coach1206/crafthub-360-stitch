/**
 * LeaderboardMembersPanel — Admin UI for managing the Grand Lounge leaderboard roster.
 * Supports add, edit (name/initials/badge), and remove with confirmation.
 */
import { useEffect, useState } from 'react'
import { getLeaderboard, addMemberAdmin, updateMemberAdmin, removeMemberAdmin } from '../../api/rankingApi.js'

const GOLD   = '#C9A84C'
const DARK   = '#0a0603'
const CARD   = 'rgba(18,12,5,0.97)'
const BORDER = 'rgba(201,168,76,0.18)'
const DIM    = 'rgba(201,168,76,0.45)'
const ERR    = '#E05A5A'
const GREEN  = '#4CAF50'

const BADGE_OPTIONS = [
  { value: 'aficionado',       label: 'Aficionado' },
  { value: 'bronze-ring',      label: 'Bronze Ring' },
  { value: 'bronze-medal',     label: 'Bronze Medal' },
  { value: 'silver-medal',     label: 'Silver Medal' },
  { value: 'gold-crown',       label: 'Gold Crown' },
  { value: 'current-user-gold',label: 'Current User Gold' },
]

const FIELD_STYLE = {
  background:    'rgba(255,255,255,0.04)',
  border:        `1px solid ${BORDER}`,
  borderRadius:  '5px',
  color:         DIM,
  fontSize:      '12px',
  padding:       '7px 10px',
  outline:       'none',
  width:         '100%',
  boxSizing:     'border-box',
  fontFamily:    'Georgia, serif',
}

const LABEL_STYLE = {
  color:         '#555',
  fontSize:      '9px',
  letterSpacing: '0.15em',
  marginBottom:  '4px',
  display:       'block',
  textTransform: 'uppercase',
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <span style={LABEL_STYLE}>{label}</span>
      {children}
    </div>
  )
}

function HuePicker({ value, onChange }) {
  const hue = Number(value) || 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <input
        type="range"
        min={0}
        max={359}
        value={hue}
        onChange={e => onChange(Number(e.target.value))}
        style={{ flex: 1, accentColor: `hsl(${hue},60%,55%)`, cursor: 'pointer' }}
      />
      <div style={{
        width:        '24px',
        height:       '24px',
        borderRadius: '50%',
        background:   `hsl(${hue},60%,45%)`,
        border:       `2px solid ${BORDER}`,
        flexShrink:   0,
      }} />
      <span style={{ color: '#555', fontSize: '11px', width: '28px' }}>{hue}°</span>
    </div>
  )
}

function InitialsAvatar({ initials, hue }) {
  return (
    <div style={{
      width:           '34px',
      height:          '34px',
      borderRadius:    '50%',
      background:      `hsl(${hue},50%,28%)`,
      border:          `2px solid hsl(${hue},60%,45%)`,
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      color:           `hsl(${hue},60%,75%)`,
      fontSize:        '11px',
      fontWeight:      600,
      letterSpacing:   '0.06em',
      flexShrink:      0,
    }}>
      {initials || '??'}
    </div>
  )
}

const EMPTY_FORM = { name: '', initials: '', hue: 180, xp: 0, badgeType: 'aficionado' }

export default function LeaderboardMembersPanel() {
  const [members,     setMembers]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [msg,         setMsg]         = useState('')

  const [showAdd,     setShowAdd]     = useState(false)
  const [addForm,     setAddForm]     = useState(EMPTY_FORM)
  const [addBusy,     setAddBusy]     = useState(false)

  const [editId,      setEditId]      = useState(null)
  const [editForm,    setEditForm]    = useState({})
  const [editBusy,    setEditBusy]    = useState(false)

  const [removeId,    setRemoveId]    = useState(null)
  const [removeBusy,  setRemoveBusy]  = useState(false)

  async function fetchMembers() {
    setLoading(true)
    try {
      const board = await getLeaderboard()
      setMembers(board)
    } catch {
      setMsg('✗ Failed to load members.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMembers() }, [])

  function clearMsg() { setMsg('') }

  async function handleAdd(e) {
    e.preventDefault()
    if (!addForm.name.trim() || !addForm.initials.trim()) {
      setMsg('✗ Name and initials are required.')
      return
    }
    setAddBusy(true)
    clearMsg()
    try {
      await addMemberAdmin({
        name:      addForm.name.trim(),
        initials:  addForm.initials.trim().toUpperCase().slice(0, 3),
        hue:       Number(addForm.hue),
        xp:        Number(addForm.xp) || 0,
        badgeType: addForm.badgeType,
      })
      setMsg(`✓ ${addForm.name.trim()} added to the roster.`)
      setShowAdd(false)
      setAddForm(EMPTY_FORM)
      fetchMembers()
    } catch (err) {
      setMsg(`✗ ${err.message || 'Failed to add member.'}`)
    } finally {
      setAddBusy(false)
    }
  }

  function openEdit(member) {
    setEditId(member.id)
    setEditForm({ name: member.name, initials: member.initials, badgeType: member.badgeType || 'aficionado' })
    clearMsg()
  }

  async function handleEdit(e) {
    e.preventDefault()
    if (!editForm.name.trim() || !editForm.initials.trim()) {
      setMsg('✗ Name and initials are required.')
      return
    }
    setEditBusy(true)
    clearMsg()
    try {
      await updateMemberAdmin(editId, {
        name:      editForm.name.trim(),
        initials:  editForm.initials.trim().toUpperCase().slice(0, 3),
        badgeType: editForm.badgeType,
      })
      setMsg('✓ Member updated.')
      setEditId(null)
      fetchMembers()
    } catch (err) {
      setMsg(`✗ ${err.message || 'Failed to update member.'}`)
    } finally {
      setEditBusy(false)
    }
  }

  async function handleRemove() {
    if (!removeId) return
    setRemoveBusy(true)
    clearMsg()
    const target = members.find(m => m.id === removeId)
    try {
      await removeMemberAdmin(removeId)
      setMsg(`✓ ${target?.name || 'Member'} removed from the roster.`)
      setRemoveId(null)
      fetchMembers()
    } catch (err) {
      setMsg(`✗ ${err.message || 'Failed to remove member.'}`)
    } finally {
      setRemoveBusy(false)
    }
  }

  const btnBase = {
    borderRadius:  '5px',
    padding:       '6px 14px',
    cursor:        'pointer',
    fontSize:      '11px',
    letterSpacing: '0.08em',
    display:       'inline-flex',
    alignItems:    'center',
    gap:           '5px',
  }
  const btnGold = {
    ...btnBase,
    background: 'rgba(201,168,76,0.10)',
    border:     `1px solid ${GOLD}44`,
    color:      GOLD,
  }
  const btnDanger = {
    ...btnBase,
    background: 'rgba(224,90,90,0.10)',
    border:     `1px solid ${ERR}44`,
    color:      ERR,
  }
  const btnGhost = {
    ...btnBase,
    background: 'rgba(255,255,255,0.04)',
    border:     `1px solid ${BORDER}`,
    color:      '#555',
  }

  return (
    <div>
      {/* ── Status message ───────────────────────────────────── */}
      {msg && (
        <div style={{
          color:         msg.startsWith('✓') ? GREEN : ERR,
          fontSize:      '11px',
          marginBottom:  '1rem',
          letterSpacing: '0.04em',
        }}>
          {msg}
        </div>
      )}

      {/* ── Add member form / toggle ──────────────────────────── */}
      {!showAdd ? (
        <button
          style={btnGold}
          onClick={() => { setShowAdd(true); setEditId(null); clearMsg() }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>add</span>
          Add Member
        </button>
      ) : (
        <form
          onSubmit={handleAdd}
          style={{
            background:    'rgba(255,255,255,0.02)',
            border:        `1px solid ${BORDER}`,
            borderRadius:  '7px',
            padding:       '1rem',
            marginBottom:  '1.25rem',
          }}
        >
          <div style={{ color: DIM, fontSize: '10px', letterSpacing: '0.15em', marginBottom: '1rem', textTransform: 'uppercase' }}>
            New Member
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <Field label="Name">
              <input
                style={FIELD_STYLE}
                placeholder="Full name"
                value={addForm.name}
                onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                autoFocus
              />
            </Field>
            <Field label="Initials">
              <input
                style={{ ...FIELD_STYLE, maxWidth: '80px' }}
                placeholder="AB"
                maxLength={3}
                value={addForm.initials}
                onChange={e => setAddForm(f => ({ ...f, initials: e.target.value.toUpperCase() }))}
              />
            </Field>
            <Field label="Starting XP">
              <input
                type="number"
                min={0}
                style={{ ...FIELD_STYLE, maxWidth: '100px' }}
                value={addForm.xp}
                onChange={e => setAddForm(f => ({ ...f, xp: e.target.value }))}
              />
            </Field>
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <Field label="Badge Type">
              <select
                style={{ ...FIELD_STYLE, cursor: 'pointer' }}
                value={addForm.badgeType}
                onChange={e => setAddForm(f => ({ ...f, badgeType: e.target.value }))}
              >
                {BADGE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <Field label={`Avatar Hue — ${addForm.hue}°`}>
              <HuePicker value={addForm.hue} onChange={v => setAddForm(f => ({ ...f, hue: v }))} />
            </Field>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" disabled={addBusy} style={{ ...btnGold, opacity: addBusy ? 0.6 : 1 }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                {addBusy ? 'hourglass_empty' : 'check'}
              </span>
              {addBusy ? 'Adding…' : 'Add Member'}
            </button>
            <button type="button" style={btnGhost} onClick={() => { setShowAdd(false); setAddForm(EMPTY_FORM) }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ── Member list ───────────────────────────────────────── */}
      {loading ? (
        <div style={{ color: '#444', fontSize: '12px', marginTop: '1rem' }}>Loading members…</div>
      ) : members.length === 0 ? (
        <div style={{ color: '#333', fontSize: '12px', marginTop: '1rem' }}>No members on the roster yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
          {members.map(member => (
            <div key={member.id}>
              {/* ── Edit inline form ──────────────────────────── */}
              {editId === member.id ? (
                <form
                  onSubmit={handleEdit}
                  style={{
                    background:    'rgba(201,168,76,0.04)',
                    border:        `1px solid ${GOLD}33`,
                    borderRadius:  '7px',
                    padding:       '0.85rem',
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem', alignItems: 'flex-start' }}>
                    <InitialsAvatar initials={editForm.initials || member.initials} hue={member.hue} />
                    <Field label="Name">
                      <input
                        style={FIELD_STYLE}
                        value={editForm.name}
                        onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                        autoFocus
                      />
                    </Field>
                    <Field label="Initials">
                      <input
                        style={{ ...FIELD_STYLE, maxWidth: '80px' }}
                        maxLength={3}
                        value={editForm.initials}
                        onChange={e => setEditForm(f => ({ ...f, initials: e.target.value.toUpperCase() }))}
                      />
                    </Field>
                    <Field label="Badge Type">
                      <select
                        style={{ ...FIELD_STYLE, cursor: 'pointer' }}
                        value={editForm.badgeType}
                        onChange={e => setEditForm(f => ({ ...f, badgeType: e.target.value }))}
                      >
                        {BADGE_OPTIONS.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="submit" disabled={editBusy} style={{ ...btnGold, opacity: editBusy ? 0.6 : 1 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                        {editBusy ? 'hourglass_empty' : 'check'}
                      </span>
                      {editBusy ? 'Saving…' : 'Save'}
                    </button>
                    <button type="button" style={btnGhost} onClick={() => setEditId(null)}>Cancel</button>
                  </div>
                </form>
              ) : (
                /* ── Member row ──────────────────────────────── */
                <div style={{
                  background:     'rgba(255,255,255,0.02)',
                  border:         `1px solid ${BORDER}`,
                  borderRadius:   '6px',
                  padding:        '10px 12px',
                  display:        'flex',
                  alignItems:     'center',
                  gap:            '12px',
                }}>
                  <span style={{
                    color:         '#444',
                    fontSize:      '10px',
                    width:         '18px',
                    textAlign:     'right',
                    flexShrink:    0,
                  }}>
                    #{member.rank}
                  </span>

                  <InitialsAvatar initials={member.initials} hue={member.hue} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ color: DIM, fontSize: '13px' }}>{member.name}</span>
                      <span style={{
                        background:    `${member.tierColor || GOLD}18`,
                        border:        `1px solid ${member.tierColor || GOLD}33`,
                        borderRadius:  '3px',
                        color:         member.tierColor || GOLD,
                        fontSize:      '9px',
                        letterSpacing: '0.1em',
                        padding:       '2px 6px',
                        textTransform: 'uppercase',
                      }}>
                        {member.tier}
                      </span>
                    </div>
                    <div style={{ color: '#444', fontSize: '10px', marginTop: '2px', letterSpacing: '0.04em' }}>
                      {member.xp.toLocaleString()} XP · {member.initials} · {member.badgeType}
                    </div>
                  </div>

                  {/* ── Remove confirm ─────────────────────────── */}
                  {removeId === member.id ? (
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button
                        onClick={handleRemove}
                        disabled={removeBusy}
                        style={{ ...btnDanger, opacity: removeBusy ? 0.6 : 1 }}
                      >
                        {removeBusy ? 'Removing…' : 'Confirm'}
                      </button>
                      <button style={btnGhost} onClick={() => setRemoveId(null)}>Cancel</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button
                        style={btnGold}
                        onClick={() => openEdit(member)}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>edit</span>
                        Edit
                      </button>
                      <button
                        style={btnDanger}
                        onClick={() => { setRemoveId(member.id); clearMsg() }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>delete</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
