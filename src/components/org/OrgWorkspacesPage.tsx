import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Lock,
  Globe,
  ArrowRight,
  FolderKanban,
  AlertCircle,
} from 'lucide-react';
import { OrgLayout } from './OrgLayout';
import { useTenant } from '../../context/TenantContext';
import { useBoard } from '../../context/BoardContext';
import { useNavigate } from '../../router/Router';

export const OrgWorkspacesPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeOrg, workspaces, createWorkspace, setActiveWorkspaceId } = useTenant();
  const { boards, setIsNewBoardOpen, setActiveBoardId } = useBoard();

  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'team' | 'organisation'>('organisation');
  const [error, setError] = useState<string | null>(null);

  const orgSlug = activeOrg.slug || 'acme-corp';

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const newWs = createWorkspace(name.trim(), description.trim(), visibility);
      setActiveWorkspaceId(newWs.id);
      setName('');
      setDescription('');
      setIsCreating(false);
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

                  <div style={{ display: 'flex', gap: '6px' }}>
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
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </OrgLayout>
  );
};
