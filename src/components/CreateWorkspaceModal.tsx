import React, { useState } from 'react';
import { Layers, X, Plus, AlertCircle, Globe, Users, Lock } from 'lucide-react';
import { useTenant } from '../context/TenantContext';
import { useNavigate } from '../router/Router';

export const CreateWorkspaceModal: React.FC = () => {
  const navigate = useNavigate();
  const {
    activeOrg,
    createWorkspace,
    isCreateWorkspaceOpen,
    setIsCreateWorkspaceOpen,
    setActiveWorkspaceId,
  } = useTenant();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'organisation' | 'team' | 'private'>('organisation');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isCreateWorkspaceOpen) return null;

  const orgSlug = activeOrg?.slug || 'acme-corp';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Workspace name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const newWs = createWorkspace(name.trim(), description.trim(), visibility);
      setActiveWorkspaceId(newWs.id);
      setName('');
      setDescription('');
      setVisibility('organisation');
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

