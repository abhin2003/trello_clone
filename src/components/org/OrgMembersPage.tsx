import React, { useState } from 'react';
import {
  UserPlus,
  Trash2,
  Mail,
  Copy,
  Check,
} from 'lucide-react';
import { OrgLayout } from './OrgLayout';
import { useTenant } from '../../context/TenantContext';
import type { UserRole } from '../../types/saas';

export const OrgMembersPage: React.FC = () => {
  const {
    activeOrg,
    members,
    invitations,
    isAdmin,
    inviteMember,
    updateMemberRole,
    removeMember,
    revokeInvite,
  } = useTenant();

  const [isInviting, setIsInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('member');
  const [inviteJob, setInviteJob] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

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
          <div className="members-table-header">
            <h3 style={{ margin: 0, fontSize: '0.95rem' }}>Active Members ({members.length})</h3>
          </div>

          <div className="members-table-list">
            {members.map((m) => {
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
