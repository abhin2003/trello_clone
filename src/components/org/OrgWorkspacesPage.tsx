import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Lock,
  Globe,
  ArrowRight,
  FolderKanban,
  AlertCircle,
  Shield,
  Check,
  X,
  Trash2,
  Users,
} from 'lucide-react';
import { OrgLayout } from './OrgLayout';
import { useTenant } from '../../context/TenantContext';
import { useBoard } from '../../context/BoardContext';
import { useNavigate } from '../../router/Router';
import type { Workspace } from '../../types/saas';

export const OrgWorkspacesPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    activeOrg,
    workspaces,
    members,
    isOwner,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    setActiveWorkspaceId,
  } = useTenant();
  const { boards, setIsNewBoardOpen, setActiveBoardId } = useBoard();

  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'team' | 'organisation'>('organisation');
  const [isRestricted, setIsRestricted] = useState(false);
  const [allowedMemberIds, setAllowedMemberIds] = useState<string[]>(() => {
    const ownerMem = members.find((m) => m.role === 'owner');
    return ownerMem ? [ownerMem.id] : [];
  });
  const [error, setError] = useState<string | null>(null);

  // Edit Access Modal state (for owner)
  const [editingAccessWs, setEditingAccessWs] = useState<Workspace | null>(null);
  const [editIsRestricted, setEditIsRestricted] = useState(false);
  const [editAllowedMemberIds, setEditAllowedMemberIds] = useState<string[]>([]);

  const orgSlug = activeOrg.slug || activeOrg.id || 'my-org';

  const handleOpenEditAccess = (ws: Workspace) => {
    setEditingAccessWs(ws);
    const hasRestrictions = Boolean(ws.allowedMemberIds && ws.allowedMemberIds.length > 0);
    setEditIsRestricted(hasRestrictions);
    const ownerMem = members.find((m) => m.role === 'owner');
    const existing = ws.allowedMemberIds || (ownerMem ? [ownerMem.id] : []);
    setEditAllowedMemberIds(existing);
  };

  const handleSaveEditAccess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccessWs) return;

    try {
      const allowed = editIsRestricted && editAllowedMemberIds.length > 0 ? editAllowedMemberIds : undefined;
      updateWorkspace(editingAccessWs.id, {
        allowedMemberIds: allowed,
      });
      setEditingAccessWs(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to update workspace permissions');
    }
  };

  const handleDeleteWorkspace = (ws: Workspace) => {
    if (!window.confirm(`Are you sure you want to delete workspace "${ws.name}"?`)) return;
    try {
      deleteWorkspace(ws.id);
    } catch (err: any) {
      setError(err?.message || 'Failed to delete workspace');
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const allowed = isRestricted && allowedMemberIds.length > 0 ? allowedMemberIds : undefined;
      const newWs = createWorkspace(name.trim(), description.trim(), visibility, allowed);
      setActiveWorkspaceId(newWs.id);
      setName('');
      setDescription('');
      setIsCreating(false);
      setIsRestricted(false);
      setError(null);
      navigate(`/org/${orgSlug}/boards?workspace=${newWs.id}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to create workspace');
    }
  };

  return (
    <OrgLayout activeNav="workspaces">
      <div className="org-page-view">
        <div className="page-header-row">
          <div>
            <h1 className="page-heading">Workspaces</h1>
            <p className="page-subheading">
              Manage functional teams, departments, and project boundaries within <strong>{activeOrg.name}</strong>.
            </p>
          </div>

          <div>
            <button
              className="primary-cta-btn"
              onClick={() => setIsCreating((p) => !p)}
            >
              <Plus size={16} />
              <span>New Workspace</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="auth-error-banner" style={{ marginBottom: '1.25rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Create Workspace Inline Modal / Card */}
        {isCreating && (
          <form onSubmit={handleCreate} className="callout-card" style={{ marginBottom: '1.5rem', background: 'var(--bg-surface)' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem' }}>Create New Workspace</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div className="form-group">
                <label className="form-label">Workspace Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Mobile Engineering or Growth Marketing"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Visibility</label>
                <select
                  className="form-input"
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as any)}
                >
                  <option value="organisation">Organisation (All Members)</option>
                  <option value="team">Team Only</option>
                  <option value="private">Private (Restricted)</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label">Description (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Brief description of this workspace's mission"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Member Restriction Section (Set by Owner) */}
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                  <Shield size={14} color="var(--accent-blue)" />
                  <span>Workspace Member Access & Restrictions</span>
                </label>
                {isOwner && (
                  <span className="badge-pill badge-primary" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                    Owner Controls
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <button
                  type="button"
                  className={`secondary-btn ${!isRestricted ? 'active-filter' : ''}`}
                  onClick={() => setIsRestricted(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    fontSize: '0.78rem',
                    borderColor: !isRestricted ? 'var(--accent-blue)' : undefined,
                    background: !isRestricted ? 'rgba(59, 130, 246, 0.1)' : undefined,
                    color: !isRestricted ? 'var(--accent-blue)' : 'var(--text-secondary)',
                    justifyContent: 'flex-start',
                  }}
                >
                  <Globe size={15} />
                  <span>All Organisation Members</span>
                </button>

                <button
                  type="button"
                  className={`secondary-btn ${isRestricted ? 'active-filter' : ''}`}
                  onClick={() => {
                    setIsRestricted(true);
                    const ownerMem = members.find((m) => m.role === 'owner');
                    if (ownerMem && !allowedMemberIds.includes(ownerMem.id)) {
                      setAllowedMemberIds((prev) => [...prev, ownerMem.id]);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    fontSize: '0.78rem',
                    borderColor: isRestricted ? 'var(--accent-blue)' : undefined,
                    background: isRestricted ? 'rgba(59, 130, 246, 0.1)' : undefined,
                    color: isRestricted ? 'var(--accent-blue)' : 'var(--text-secondary)',
                    justifyContent: 'flex-start',
                  }}
                >
                  <Lock size={15} />
                  <span>Specific Members Only</span>
                </button>
              </div>

              {isRestricted && (
                <div
                  style={{
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '10px',
                    background: 'var(--bg-subtle)',
                    maxHeight: '160px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Allowed Members ({allowedMemberIds.length} of {members.length})
                    </span>
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}
                      onClick={() => setAllowedMemberIds(members.map((m) => m.id))}
                    >
                      Select All
                    </button>
                  </div>

                  {members.map((m) => {
                    const isOwnerMem = m.role === 'owner';
                    const isChecked = isOwnerMem || allowedMemberIds.includes(m.id);

                    return (
                      <label
                        key={m.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '5px 8px',
                          borderRadius: '6px',
                          background: isChecked ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-surface)',
                          border: `1px solid ${isChecked ? 'rgba(59, 130, 246, 0.25)' : 'var(--border-subtle)'}`,
                          cursor: isOwnerMem ? 'default' : 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isOwnerMem}
                            onChange={() => {
                              if (isOwnerMem) return;
                              setAllowedMemberIds((prev) =>
                                prev.includes(m.id) ? prev.filter((id) => id !== m.id) : [...prev, m.id]
                              );
                            }}
                            style={{ accentColor: '#3b82f6', cursor: isOwnerMem ? 'default' : 'pointer' }}
                          />
                          <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{m.user?.name || 'Member'}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({m.user?.email})</span>
                        </div>
                        {isOwnerMem ? (
                          <span className="badge-pill badge-primary" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                            Owner (Required)
                          </span>
                        ) : (
                          <span className="badge-pill badge-neutral" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                            {m.role || 'Member'}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setIsCreating(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="primary-cta-btn"
                disabled={!name.trim()}
              >
                Create Workspace
              </button>
            </div>
          </form>
        )}

        {/* Workspaces Grid */}
        <div className="workspaces-grid">
          {workspaces.map((ws) => {
            const wsBoards = boards.filter((b) => b.workspaceId === ws.id);

            return (
              <div
                key={ws.id}
                className="workspace-card"
                onClick={() => {
                  setActiveWorkspaceId(ws.id);
                  navigate(`/org/${orgSlug}/boards?workspace=${ws.id}`);
                }}
                style={{ cursor: 'pointer' }}
                title={`Open ${ws.name} workspace boards`}
              >
                <div className="workspace-card-header">
                  <div className="ws-avatar-icon">
                    <Layers size={22} color="var(--accent-blue)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h3 className="ws-title">{ws.name}</h3>
                      <span className="badge-pill badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.68rem' }}>
                        {ws.visibility === 'private' ? <Lock size={10} /> : <Globe size={10} />}
                        {ws.visibility}
                      </span>
                      {ws.allowedMemberIds && ws.allowedMemberIds.length > 0 ? (
                        <span className="badge-pill badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.68rem', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
                          <Shield size={10} />
                          Restricted ({ws.allowedMemberIds.length} Allowed)
                        </span>
                      ) : (
                        <span className="badge-pill badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.68rem' }}>
                          <Users size={10} />
                          All Members
                        </span>
                      )}
                    </div>
                    <p className="ws-desc">{ws.description || 'No description provided.'}</p>
                  </div>
                </div>

                {/* Mini Boards Preview inside workspace */}
                <div style={{ padding: '0 16px 12px 16px', minHeight: '44px' }}>
                  {wsBoards.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {wsBoards.slice(0, 3).map((b) => (
                        <span
                          key={b.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveWorkspaceId(ws.id);
                            setActiveBoardId(b.id);
                            navigate(`/org/${orgSlug}/boards/${b.id}`);
                          }}
                          style={{
                            fontSize: '0.74rem',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: 'var(--bg-subtle)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-secondary)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <FolderKanban size={11} color="var(--accent-blue)" />
                          {b.title}
                        </span>
                      ))}
                      {wsBoards.length > 3 && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                          +{wsBoards.length - 3} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      No boards in this workspace yet.
                    </span>
                  )}
                </div>

                <div className="workspace-card-footer">
                  <div className="ws-footer-stats">
                    <span className="ws-stat-item">
                      <FolderKanban size={14} color="var(--text-muted)" />
                      <span>{wsBoards.length} Boards</span>
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {isOwner && (
                      <button
                        type="button"
                        className="secondary-btn"
                        style={{ padding: '5px 8px', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditAccess(ws);
                        }}
                        title="Configure which company members are allowed in this workspace"
                      >
                        <Shield size={12} color="var(--accent-blue)" />
                        <span>Access</span>
                      </button>
                    )}

                    <button
                      type="button"
                      className="secondary-btn"
                      style={{ padding: '5px 10px', fontSize: '0.8rem' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveWorkspaceId(ws.id);
                        setIsNewBoardOpen(true);
                      }}
                      title={`Create new board in ${ws.name}`}
                    >
                      <Plus size={13} />
                      <span>New Board</span>
                    </button>
                    <button
                      type="button"
                      className="primary-cta-btn"
                      style={{ padding: '5px 12px', fontSize: '0.8rem' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveWorkspaceId(ws.id);
                        navigate(`/org/${orgSlug}/boards?workspace=${ws.id}`);
                      }}
                    >
                      <span>Open</span>
                      <ArrowRight size={13} />
                    </button>

                    {isOwner && workspaces.length > 1 && (
                      <button
                        type="button"
                        className="icon-button"
                        style={{ width: '28px', height: '28px', color: '#ef4444' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteWorkspace(ws);
                        }}
                        title="Delete Workspace"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal: Edit Workspace Member Access (Owner feature) */}
        {editingAccessWs && (
          <div className="modal-backdrop animate-fade-in" onClick={() => setEditingAccessWs(null)}>
            <div
              className="modal-container"
              style={{
                maxWidth: '460px',
                width: '90%',
                backgroundColor: 'var(--bg-modal, #ffffff)',
                color: 'var(--text-primary)',
                borderRadius: '16px',
                border: '1px solid var(--border-strong)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
                overflow: 'hidden',
                zIndex: 1000,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'rgba(59, 130, 246, 0.12)',
                      color: '#3b82f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Shield size={18} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                      Manage Workspace Access
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {editingAccessWs.name} • Set by Company Owner
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="icon-button"
                  onClick={() => setEditingAccessWs(null)}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveEditAccess} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, marginBottom: '8px' }}>
                    Who can access this workspace?
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                    <button
                      type="button"
                      className={`secondary-btn ${!editIsRestricted ? 'active-filter' : ''}`}
                      onClick={() => setEditIsRestricted(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px',
                        fontSize: '0.78rem',
                        borderColor: !editIsRestricted ? 'var(--accent-blue)' : undefined,
                        background: !editIsRestricted ? 'rgba(59, 130, 246, 0.1)' : undefined,
                        color: !editIsRestricted ? 'var(--accent-blue)' : 'var(--text-secondary)',
                        justifyContent: 'flex-start',
                      }}
                    >
                      <Globe size={16} />
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 600 }}>All Members</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Open to whole company</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`secondary-btn ${editIsRestricted ? 'active-filter' : ''}`}
                      onClick={() => {
                        setEditIsRestricted(true);
                        const ownerMem = members.find((m) => m.role === 'owner');
                        if (ownerMem && !editAllowedMemberIds.includes(ownerMem.id)) {
                          setEditAllowedMemberIds((prev) => [...prev, ownerMem.id]);
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px',
                        fontSize: '0.78rem',
                        borderColor: editIsRestricted ? 'var(--accent-blue)' : undefined,
                        background: editIsRestricted ? 'rgba(59, 130, 246, 0.1)' : undefined,
                        color: editIsRestricted ? 'var(--accent-blue)' : 'var(--text-secondary)',
                        justifyContent: 'flex-start',
                      }}
                    >
                      <Lock size={16} />
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 600 }}>Specific Members</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Restricted by owner</div>
                      </div>
                    </button>
                  </div>

                  {editIsRestricted && (
                    <div
                      style={{
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        background: 'var(--bg-subtle)',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          Allowed Members ({editAllowedMemberIds.length} of {members.length})
                        </span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}
                            onClick={() => setEditAllowedMemberIds(members.map((m) => m.id))}
                          >
                            Select All
                          </button>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>•</span>
                          <button
                            type="button"
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}
                            onClick={() => {
                              const ownerMem = members.find((m) => m.role === 'owner');
                              setEditAllowedMemberIds(ownerMem ? [ownerMem.id] : []);
                            }}
                          >
                            Reset
                          </button>
                        </div>
                      </div>

                      {members.map((m) => {
                        const isOwnerMem = m.role === 'owner';
                        const isChecked = isOwnerMem || editAllowedMemberIds.includes(m.id);

                        return (
                          <label
                            key={m.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '6px 8px',
                              borderRadius: '6px',
                              background: isChecked ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-surface)',
                              border: `1px solid ${isChecked ? 'rgba(59, 130, 246, 0.25)' : 'var(--border-subtle)'}`,
                              cursor: isOwnerMem ? 'default' : 'pointer',
                            }}
                            onClick={(e) => {
                              if (isOwnerMem) e.preventDefault();
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                disabled={isOwnerMem}
                                onChange={() => {
                                  if (isOwnerMem) return;
                                  setEditAllowedMemberIds((prev) =>
                                    prev.includes(m.id) ? prev.filter((id) => id !== m.id) : [...prev, m.id]
                                  );
                                }}
                                style={{ accentColor: '#3b82f6', cursor: isOwnerMem ? 'default' : 'pointer' }}
                              />
                              <div
                                style={{
                                  width: '22px',
                                  height: '22px',
                                  borderRadius: '50%',
                                  background: m.user?.avatarColor || '#3b82f6',
                                  color: '#fff',
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {m.user?.initials || m.user?.name?.slice(0, 2).toUpperCase() || 'U'}
                              </div>
                              <div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{m.user?.name || 'Member'}</div>
                                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{m.user?.email}</div>
                              </div>
                            </div>

                            {isOwnerMem ? (
                              <span className="badge-pill badge-primary" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                                Owner (Always Allowed)
                              </span>
                            ) : (
                              <span className="badge-pill badge-neutral" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                                {m.role || 'Member'}
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '10px',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--border-subtle)',
                  }}
                >
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => setEditingAccessWs(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="primary-cta-btn"
                  >
                    <Check size={16} />
                    <span>Save Access Permissions</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </OrgLayout>
  );
};
