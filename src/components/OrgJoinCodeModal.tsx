import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Key,
  Copy,
  Check,
  RefreshCw,
  ArrowRight,
  AlertCircle,
  Building2,
  X,
  Share2,
  Users,
} from 'lucide-react';
import { useTenant } from '../context/TenantContext';
import { useAuth } from '../context/AuthContext';

interface OrgJoinCodeModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const OrgJoinCodeModal: React.FC<OrgJoinCodeModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
}) => {
  const {
    activeOrg,
    orgJoinCode,
    regenerateJoinCode,
    isAdmin,
    refreshTenantState,
    isJoinCodeModalOpen,
    setIsJoinCodeModalOpen,
  } = useTenant();
  const { joinWithCode, refreshMemberships } = useAuth();

  const isOpen = propIsOpen !== undefined ? propIsOpen : isJoinCodeModalOpen;
  const onClose = propOnClose !== undefined ? propOnClose : () => setIsJoinCodeModalOpen(false);

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const currentCode = orgJoinCode || activeOrg?.joinCode || 'ORG-CODE';
  const directLink = typeof window !== 'undefined'
    ? `${window.location.origin}/login?code=${encodeURIComponent(currentCode)}`
    : '';

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(directLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleJoinOtherOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);
    setJoinSuccess(null);
    if (!inputCode.trim()) return;

    setIsJoining(true);
    try {
      const res = await joinWithCode(inputCode.trim());
      if (res.success && res.organisation) {
        setJoinSuccess(`Successfully joined "${res.organisation.name}"!`);
        setInputCode('');
        await refreshMemberships();
        refreshTenantState();
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setJoinError(res.error || 'Failed to join organisation with this code.');
      }
    } catch (err: any) {
      setJoinError(err?.message || 'Error joining organisation.');
    } finally {
      setIsJoining(false);
    }
  };

  return createPortal(
    <div
      className="popup-window-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="popup-window-title"
    >
      <div
        className="popup-window-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Window Title Bar */}
        <div className="popup-window-header">
          <div className="popup-window-title-group">
            <div className="popup-window-icon-badge">
              <Key size={20} />
            </div>
            <div>
              <h2 id="popup-window-title" className="popup-window-title">
                Organisation Joining Code
              </h2>
              <p className="popup-window-subtitle">
                {activeOrg?.name} • Share code or invite link with workers
              </p>
            </div>
          </div>
          <button
            type="button"
            className="popup-window-close-btn"
            onClick={onClose}
            aria-label="Close popup window"
            title="Close window (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        {/* Window Content Body */}
        <div className="popup-window-body">
          {/* Main Hero Code Showcase */}
          <div className="popup-code-showcase-box">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '8px' }}>
              <Users size={14} color="#3b82f6" />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
                Organisation Worker Code
              </span>
            </div>

            <div
              style={{
                margin: '10px 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <span className="popup-code-badge">
                {currentCode}
              </span>

              <button
                type="button"
                className="primary-cta-btn"
                style={{
                  padding: '9px 18px',
                  fontSize: '0.86rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                }}
                onClick={handleCopyCode}
              >
                {copiedCode ? <Check size={16} /> : <Copy size={16} />}
                <span>{copiedCode ? 'Copied Code!' : 'Copy Code'}</span>
              </button>
            </div>

            <p style={{ margin: '8px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Workers enter this code during sign-up to immediately create an account and join <strong>{activeOrg?.name}</strong>.
            </p>
          </div>

          {/* Direct Shareable Link */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Share2 size={13} />
              <span>Direct Registration Link</span>
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                readOnly
                value={directLink}
                className="form-input"
                style={{ fontSize: '0.82rem', fontFamily: 'monospace', cursor: 'text' }}
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                type="button"
                className="secondary-btn"
                style={{ padding: '8px 14px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={handleCopyLink}
              >
                {copiedLink ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
                <span>{copiedLink ? 'Copied Link' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Admin Regenerate Code Action */}
          {isAdmin && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '2px' }}>
              <button
                type="button"
                className="secondary-btn"
                style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', padding: '6px 12px' }}
                onClick={() => {
                  if (confirm(`Regenerate join code for "${activeOrg?.name}"? The previous code will stop working immediately.`)) {
                    regenerateJoinCode();
                  }
                }}
              >
                <RefreshCw size={12} />
                <span>Regenerate Join Code</span>
              </button>
            </div>
          )}

          {/* Section: Join Another Organisation with a Code */}
          <div
            style={{
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '14px',
              marginTop: '4px',
            }}
          >
            <h4
              style={{
                margin: '0 0 6px 0',
                fontSize: '0.88rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--text-primary)',
              }}
            >
              <Building2 size={15} color="#3b82f6" />
              <span>Join Another Organisation with a Code</span>
            </h4>
            <p style={{ margin: '0 0 10px 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Have another organisation join code? Enter it below to join that organisation too.
            </p>

            {joinError && (
              <div className="auth-error-banner" style={{ marginBottom: '10px' }}>
                <AlertCircle size={15} />
                <span>{joinError}</span>
              </div>
            )}
            {joinSuccess && (
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '10px',
                }}
              >
                <Check size={15} />
                <span>{joinSuccess}</span>
              </div>
            )}

            <form onSubmit={handleJoinOtherOrg} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="e.g. ACME-2026"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                className="form-input"
                style={{ textTransform: 'uppercase', fontFamily: 'monospace' }}
              />
              <button
                type="submit"
                className="primary-cta-btn"
                style={{ whiteSpace: 'nowrap', padding: '8px 16px' }}
                disabled={isJoining || !inputCode.trim()}
              >
                {isJoining ? <RefreshCw size={14} className="spin-animation" /> : <ArrowRight size={14} />}
                <span>Join</span>
              </button>
            </form>
          </div>
        </div>

        {/* Window Footer Action Bar */}
        <div className="popup-window-footer">
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            Anyone with this code can join as an active member.
          </span>
          <button
            type="button"
            className="secondary-btn"
            style={{ padding: '6px 16px', fontSize: '0.84rem' }}
            onClick={onClose}
          >
            Close Window
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
