import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Trash2,
  Mail,
  Copy,
  Check,
  Key,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';
import { OrgLayout } from './OrgLayout';
import { useTenant } from '../../context/TenantContext';
import { useBoard } from '../../context/BoardContext';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types/saas';

export const OrgMembersPage: React.FC = () => {
  const {
    activeOrg,
    orgJoinCode,
    members,
    invitations,
    isAdmin,
    inviteMember,
    updateMemberRole,
    removeMember,
    revokeInvite,
    setIsJoinCodeModalOpen,
    refreshTenantState,
  } = useTenant();
  const { openChat } = useBoard();
  const { userProfile } = useAuth();

  const [isInviting, setIsInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('member');
  const [inviteJob, setInviteJob] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [copiedJoinCode, setCopiedJoinCode] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-refresh members on mount
  useEffect(() => {
    refreshTenantState();
  }, [refreshTenantState]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    refreshTenantState();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    inviteMember(inviteEmail.trim(), inviteRole, inviteJob.trim() || undefined);
    setInviteEmail('');
    setInviteJob('');
    setIsInviting(false);
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <OrgLayout activeNav="members">
      <div className="org-page-view">
        <div className="page-header-row">
          <div>
            <h1 className="page-heading">Members & Collaborators</h1>
            <p className="page-subheading">
              Manage employees, contractors, and guest permissions for <strong>{activeOrg.name}</strong>.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="secondary-btn"
              type="button"
              onClick={handleManualRefresh}
              title="Refresh members list"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                fontSize: '0.85rem',
              }}
            >
              <RefreshCw size={15} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
              <span>Refresh</span>
            </button>
            {isAdmin && (
              <button
                className="primary-cta-btn"
                onClick={() => setIsInviting((p) => !p)}
              >
                <UserPlus size={16} />
                <span>Invite Member</span>
              </button>
            )}
          </div>
        </div>

        {/* Organisation Join Code Banner for Workers */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(37, 99, 235, 0.05))',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(59, 130, 246, 0.2)',
                color: '#60a5fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Key size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                Organisation Worker Joining Code
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    color: '#60a5fa',
                  }}
                >
                  {orgJoinCode || activeOrg.joinCode || 'ACME-2026'}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  (Workers can use this code on the login page to create an account and join)
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              className="secondary-btn"
              style={{ padding: '8px 14px', fontSize: '0.85rem' }}
              onClick={() => setIsJoinCodeModalOpen(true)}
              title="Open worker joining code popup window"
            >
              <span>Share Code Window</span>
            </button>

            <button
              type="button"
              className="primary-cta-btn"
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              onClick={async () => {
                const code = orgJoinCode || activeOrg.joinCode || '';
                await navigator.clipboard.writeText(code);
                setCopiedJoinCode(true);
                setTimeout(() => setCopiedJoinCode(false), 2000);
              }}
            >
              {copiedJoinCode ? <Check size={16} /> : <Copy size={16} />}
              <span>{copiedJoinCode ? 'Copied Code!' : 'Copy Joining Code'}</span>
            </button>
          </div>
        </div>

        {/* Invite Member Inline Form */}
        {isInviting && (
          <form onSubmit={handleInvite} className="callout-card" style={{ marginBottom: '1.5rem', background: 'var(--bg-surface)' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem' }}>Dispatch Invitation</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="teammate@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  className="form-input"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                >
                  <option value="member">Member</option>
                  <option value="admin">Administrator</option>
                  <option value="guest">Guest</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Job Title (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Frontend Engineer"
                  value={inviteJob}
                  onChange={(e) => setInviteJob(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setIsInviting(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="primary-cta-btn"
                disabled={!inviteEmail.trim()}
              >
                Send Invitation
              </button>
            </div>
          </form>
        )}

        {/* Active Members Table */}
        <div className="members-table-card">
          <div className="members-table-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem' }}>Active Members ({members.length})</h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <MessageSquare size={13} color="#3b82f6" />
              <span>Click "Chat" on any team member to start a direct message thread</span>
            </span>
          </div>

          <div className="members-table-list">
            {members.map((m) => {
              const isCurrentUser = Boolean(
                userProfile &&
                (m.userId === userProfile.id || (m.user?.email && m.user.email === userProfile.email))
              );

              return (
                <div key={m.id} className="member-row">
                  <div className="member-row-avatar" style={{ backgroundColor: m.user?.avatarColor || '#3b82f6' }}>
                    {m.user?.initials || 'U'}
                  </div>

                  <div className="member-row-info">
                    <div className="member-row-name">
                      <span>{m.user?.name || 'Team Member'}</span>
                    </div>
                    <div className="member-row-meta">
                      <span>{m.user?.email}</span>
                      {m.jobTitle && <span className="meta-bullet">•</span>}
                      {m.jobTitle && <span>{m.jobTitle}</span>}
                    </div>
                  </div>

                  <div className="member-row-actions">
                    {/* Chat with Team Member Action */}
                    {!isCurrentUser ? (
                      <button
                        type="button"
                        className="secondary-btn"
                        style={{
                          padding: '5px 12px',
                          fontSize: '0.8rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: '#3b82f6',
                          borderColor: 'rgba(59, 130, 246, 0.35)',
                          background: 'rgba(59, 130, 246, 0.08)',
                          fontWeight: 500,
                        }}
                        onClick={() => openChat(m.userId || m.id)}
                        title={`Chat with ${m.user?.name || 'team member'}`}
                      >
                        <MessageSquare size={13} />
                        <span>Chat</span>
                      </button>
                    ) : (
                      <span
                        style={{
                          fontSize: '0.74rem',
                          color: 'var(--text-muted)',
                          padding: '3px 8px',
                          background: 'var(--bg-subtle)',
                          borderRadius: '4px',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        (You)
                      </span>
                    )}

                    {isAdmin && m.role !== 'owner' ? (
                      <select
                        className="role-selector-dropdown"
                        value={m.role}
                        onChange={(e) => updateMemberRole(m.id, e.target.value as UserRole)}
                      >
                        <option value="owner">Owner</option>
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                        <option value="guest">Guest</option>
                      </select>
                    ) : (
                      <span className={`badge-pill ${m.role === 'owner' ? 'badge-active' : 'badge-neutral'}`} style={{ textTransform: 'capitalize' }}>
                        {m.role}
                      </span>
                    )}

                    {isAdmin && m.role !== 'owner' && (
                      <button
                        type="button"
                        className="icon-button delete-member-btn"
                        onClick={() => removeMember(m.id)}
                        title="Remove member"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pending Invitations Section */}
        {invitations.length > 0 && (
          <div className="members-table-card" style={{ marginTop: '2rem' }}>
            <div className="members-table-header">
              <h3 style={{ margin: 0, fontSize: '0.95rem' }}>Pending Invitations ({invitations.length})</h3>
            </div>

            <div className="members-table-list">
              {invitations.map((inv) => (
                <div key={inv.id} className="member-row">
                  <div className="member-row-avatar" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                    <Mail size={16} />
                  </div>

                  <div className="member-row-info">
                    <div className="member-row-name">
                      <span>{inv.email}</span>
                      <span className="badge-pill badge-warning" style={{ fontSize: '0.68rem', textTransform: 'capitalize' }}>
                        {inv.status}
                      </span>
                    </div>
                    <div className="member-row-meta">
                      <span>Invited as {inv.role}</span>
                      <span className="meta-bullet">•</span>
                      <span style={{ fontFamily: 'monospace' }}>{inv.token}</span>
                    </div>
                  </div>

                  <div className="member-row-actions">
                    <button
                      type="button"
                      className="secondary-btn"
                      style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                      onClick={() => copyToken(inv.token)}
                    >
                      {copiedToken === inv.token ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedToken === inv.token ? 'Copied' : 'Copy Token'}</span>
                    </button>

                    {isAdmin && (
                      <button
                        type="button"
                        className="icon-button delete-member-btn"
                        onClick={() => revokeInvite(inv.id)}
                        title="Revoke invitation"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </OrgLayout>
  );
};
