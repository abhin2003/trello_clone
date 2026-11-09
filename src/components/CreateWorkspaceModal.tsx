import React, { useState } from 'react';
import { Layers, X, Plus, AlertCircle, Globe, Users, Lock, Shield } from 'lucide-react';
import { useTenant } from '../context/TenantContext';
import { useNavigate } from '../router/Router';

export const CreateWorkspaceModal: React.FC = () => {
  const navigate = useNavigate();
  const {
    activeOrg,
    members,
    isOwner,
    createWorkspace,
    isCreateWorkspaceOpen,
    setIsCreateWorkspaceOpen,
    setActiveWorkspaceId,
  } = useTenant();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'organisation' | 'team' | 'private'>('organisation');
  const [isRestricted, setIsRestricted] = useState(false);
  const [allowedMemberIds, setAllowedMemberIds] = useState<string[]>(() => {
    const ownerMem = members.find((m) => m.role === 'owner');
    return ownerMem ? [ownerMem.id] : [];
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isCreateWorkspaceOpen) return null;

  const orgSlug = activeOrg?.slug || activeOrg?.id || 'my-org';

  const toggleMember = (memberId: string, isOwnerMem: boolean) => {
    if (isOwnerMem) return; // Owner always has access
    setAllowedMemberIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const handleSelectAll = () => {
    setAllowedMemberIds(members.map((m) => m.id));
  };

  const handleReset = () => {
    const ownerMem = members.find((m) => m.role === 'owner');
    setAllowedMemberIds(ownerMem ? [ownerMem.id] : []);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Workspace name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const allowed = isRestricted && allowedMemberIds.length > 0 ? allowedMemberIds : undefined;
      const newWs = createWorkspace(name.trim(), description.trim(), visibility, allowed);
      setActiveWorkspaceId(newWs.id);
      setName('');
      setDescription('');
      setVisibility('organisation');
      setIsRestricted(false);
      setIsCreateWorkspaceOpen(false);
      navigate(`/org/${orgSlug}/boards?workspace=${newWs.id}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to create workspace');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={() => setIsCreateWorkspaceOpen(false)}>
      <div
        className="modal-container"
        style={{
          maxWidth: '480px',
          width: '90%',
          backgroundColor: 'var(--bg-modal, #ffffff)',
          background: 'var(--bg-modal, #ffffff)',
          color: 'var(--text-primary)',
          borderRadius: '16px',
          border: '1px solid var(--border-strong)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          zIndex: 1000,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-modal, #ffffff)',
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
              <Layers size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Create Workspace
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {activeOrg?.name}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="icon-button"
            onClick={() => setIsCreateWorkspaceOpen(false)}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div className="auth-error-banner" style={{ margin: 0 }}>
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontWeight: 600 }}>
              Workspace Name *
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Engineering, Marketing, Design System"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontWeight: 600 }}>
              Description (Optional)
            </label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="What will this team or department collaborate on?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontWeight: 600 }}>
              Visibility & Access
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <button
                type="button"
                className={`secondary-btn ${visibility === 'organisation' ? 'active-filter' : ''}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 6px',
                  fontSize: '0.76rem',
                  borderColor: visibility === 'organisation' ? 'var(--accent-blue)' : undefined,
                  background: visibility === 'organisation' ? 'rgba(59, 130, 246, 0.1)' : undefined,
                  color: visibility === 'organisation' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                }}
                onClick={() => setVisibility('organisation')}
              >
                <Globe size={16} />
                <span>Organisation</span>
              </button>

              <button
                type="button"
                className={`secondary-btn ${visibility === 'team' ? 'active-filter' : ''}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 6px',
                  fontSize: '0.76rem',
                  borderColor: visibility === 'team' ? 'var(--accent-blue)' : undefined,
                  background: visibility === 'team' ? 'rgba(59, 130, 246, 0.1)' : undefined,
                  color: visibility === 'team' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                }}
                onClick={() => setVisibility('team')}
              >
                <Users size={16} />
                <span>Team Only</span>
              </button>

              <button
                type="button"
                className={`secondary-btn ${visibility === 'private' ? 'active-filter' : ''}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 6px',
                  fontSize: '0.76rem',
                  borderColor: visibility === 'private' ? 'var(--accent-blue)' : undefined,
                  background: visibility === 'private' ? 'rgba(59, 130, 246, 0.1)' : undefined,
                  color: visibility === 'private' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                }}
                onClick={() => setVisibility('private')}
              >
                <Lock size={16} />
                <span>Private</span>
              </button>
            </div>
          </div>

          {/* Member Access Restriction (Configured by Company Owner) */}
          <div className="form-group" style={{ margin: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                <Shield size={14} color="var(--accent-blue)" />
                <span>Workspace Member Access</span>
              </label>
              {isOwner && (
                <span className="badge-pill badge-primary" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                  Owner Controlled
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
                  padding: '10px 12px',
                  fontSize: '0.78rem',
                  borderColor: !isRestricted ? 'var(--accent-blue)' : undefined,
                  background: !isRestricted ? 'rgba(59, 130, 246, 0.1)' : undefined,
                  color: !isRestricted ? 'var(--accent-blue)' : 'var(--text-secondary)',
                  justifyContent: 'flex-start',
                }}
              >
                <Globe size={16} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 600 }}>All Members</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Accessible to everyone</div>
                </div>
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
                  padding: '10px 12px',
                  fontSize: '0.78rem',
                  borderColor: isRestricted ? 'var(--accent-blue)' : undefined,
                  background: isRestricted ? 'rgba(59, 130, 246, 0.1)' : undefined,
                  color: isRestricted ? 'var(--accent-blue)' : 'var(--text-secondary)',
                  justifyContent: 'flex-start',
                }}
              >
                <Lock size={16} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 600 }}>Specific Members</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Restricted by company owner</div>
                </div>
              </button>
            </div>

            {/* If Restricted: Member Selector Checklist */}
            {isRestricted && (
              <div
                style={{
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  background: 'var(--bg-subtle)',
                  maxHeight: '190px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Allowed Members ({allowedMemberIds.length} of {members.length} selected)
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}
                      onClick={handleSelectAll}
                    >
                      Select All
                    </button>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>•</span>
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}
                      onClick={handleReset}
                    >
                      Reset
                    </button>
                  </div>
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
                        padding: '6px 10px',
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
                          onChange={() => toggleMember(m.id, isOwnerMem)}
                          style={{ cursor: isOwnerMem ? 'default' : 'pointer', accentColor: '#3b82f6' }}
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
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {m.user?.name || 'Member'}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            {m.user?.email}
                          </div>
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
              marginTop: '4px',
            }}
          >
            <button
              type="button"
              className="secondary-btn"
              onClick={() => setIsCreateWorkspaceOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-cta-btn"
              disabled={isSubmitting || !name.trim()}
            >
              <Plus size={16} />
              <span>Create Workspace</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

