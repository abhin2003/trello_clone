import React, { useState } from 'react';
import { useTenant } from '../context/TenantContext';
import {
  X,
  Building2,
  Users,
  LayoutGrid,
  FileText,
  Plus,
  Trash2,
  Download,
  CheckCircle2,
  AlertCircle,
  Mail,
  UserPlus,
  Layers,
  Lock,
} from 'lucide-react';
import type { UserRole, WorkspaceVisibility } from '../types/saas';

export const OrganisationAdminPortal: React.FC = () => {
  const {
    activeOrg,
    userRole,
    members,
    invitations,
    workspaces,
    auditLogs,
    isOrgAdminOpen,
    setIsOrgAdminOpen,
    updateOrg,
    inviteMember,
    revokeInvite,
    updateMemberRole,
    removeMember,
    createWorkspace,
    exportOrgData,
  } = useTenant();

  const [activeTab, setActiveTab] = useState<
    'general' | 'members' | 'workspaces' | 'audit'
  >('general');

  // General tab state
  const [name, setName] = useState(activeOrg.name);
  const [slug, setSlug] = useState(activeOrg.slug);
  const [primaryColor, setPrimaryColor] = useState(activeOrg.primaryColor || '#3b82f6');
  const [billingEmail, setBillingEmail] = useState(activeOrg.billingEmail || '');
  const [allowedDomain, setAllowedDomain] = useState(activeOrg.allowedEmailDomain || '');
  const [adminInvitesOnly, setAdminInvitesOnly] = useState(activeOrg.enforceAdminInvitesOnly);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Invite modal state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('member');
  const [inviteJobTitle, setInviteJobTitle] = useState('');
  const [inviteError, setInviteError] = useState<string | null>(null);

  // New workspace state
  const [isNewWsModalOpen, setIsNewWsModalOpen] = useState(false);
  const [wsName, setWsName] = useState('');
  const [wsDesc, setWsDesc] = useState('');
  const [wsVisibility, setWsVisibility] = useState<WorkspaceVisibility>('organisation');
  const [wsError, setWsError] = useState<string | null>(null);

  if (!isOrgAdminOpen) return null;

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrg({
      name: name.trim(),
      slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      primaryColor,
      billingEmail: billingEmail.trim(),
      allowedEmailDomain: allowedDomain.trim(),
      enforceAdminInvitesOnly: adminInvitesOnly,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      setInviteError('Please enter a valid email address.');
      return;
    }
    try {
      inviteMember(inviteEmail.trim(), inviteRole, inviteJobTitle.trim());
      setInviteEmail('');
      setInviteJobTitle('');
      setIsInviteModalOpen(false);
    } catch (err: any) {
      setInviteError(err.message || 'Failed to dispatch invitation');
    }
  };

  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    setWsError(null);
    if (!wsName.trim()) {
      setWsError('Workspace title is required.');
      return;
    }
    try {
      createWorkspace(wsName.trim(), wsDesc.trim(), wsVisibility);
      setWsName('');
      setWsDesc('');
      setIsNewWsModalOpen(false);
    } catch (err: any) {
      setWsError(err.message || 'Failed to create workspace');
    }
  };

  const colorPresets = ['#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#f59e0b', '#06b6d4', '#ec4899'];

  return (
    <div className="modal-overlay animate-fade-in" onClick={() => setIsOrgAdminOpen(false)}>
      <div
        className="admin-portal-modal animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="portal-header">
          <div className="portal-header-left">
            <div
              className="portal-brand-avatar"
              style={{ backgroundColor: activeOrg.primaryColor || '#3b82f6' }}
            >
              <Building2 size={20} />
            </div>
            <div>
              <div className="portal-title-row">
                <h2 className="portal-title">{activeOrg.name}</h2>
                <span className="badge-portal-role">
                  {userRole ? userRole.toUpperCase() : 'ADMIN'}
                </span>
              </div>
              <p className="portal-subtitle">
                Organisation Administration & Settings • Slug: <code>{activeOrg.slug}</code>
              </p>
            </div>
          </div>
          <button
            className="icon-button"
            onClick={() => setIsOrgAdminOpen(false)}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="portal-tabs-nav">
          <button
            className={`portal-tab-btn ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <Building2 size={16} />
            <span>Profile & Branding</span>
          </button>

          <button
            className={`portal-tab-btn ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            <Users size={16} />
            <span>Members & Invites ({members.length})</span>
          </button>

          <button
            className={`portal-tab-btn ${activeTab === 'workspaces' ? 'active' : ''}`}
            onClick={() => setActiveTab('workspaces')}
          >
            <LayoutGrid size={16} />
            <span>Workspaces ({workspaces.length})</span>
          </button>

          <button
            className={`portal-tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            <FileText size={16} />
            <span>Audit Logs</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="portal-tab-content">
          {/* TAB 1: GENERAL & BRANDING */}
          {activeTab === 'general' && (
            <form className="admin-form animate-fade-in" onSubmit={handleSaveGeneral}>
              <div className="form-section-title">Organisation Identity</div>

              <div className="form-grid-2">
                <div className="form-field">
                  <label className="form-label">Organisation Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Workspace URL Slug</label>
                  <div className="slug-input-wrapper">
                    <span className="slug-prefix">drello.io/</span>
                    <input
                      type="text"
                      className="form-input slug-field"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-field">
                <label className="form-label">Primary Brand Accent Color</label>
                <div className="color-picker-row">
                  {colorPresets.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`color-preset-circle ${primaryColor === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setPrimaryColor(color)}
                    />
                  ))}
                  <input
                    type="color"
                    className="color-input-native"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    title="Custom color"
                  />
                  <span className="color-hex-tag">{primaryColor.toUpperCase()}</span>
                </div>
              </div>

              <div className="divider-portal" />

              <div className="form-section-title">Security & Invitations Governance</div>

              <div className="form-grid-2">
                <div className="form-field">
                  <label className="form-label">Restricted Email Domain (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. acme.com (leave blank for any)"
                    value={allowedDomain}
                    onChange={(e) => setAllowedDomain(e.target.value)}
                  />
                  <span className="form-hint">
                    Only emails ending in this domain can accept employee invitations.
                  </span>
                </div>

                <div className="form-field">
                  <label className="form-label">Billing Notification Email</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="finance@yourcompany.com"
                    value={billingEmail}
                    onChange={(e) => setBillingEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-checkbox-row">
                <input
                  type="checkbox"
                  id="adminInvitesOnly"
                  checked={adminInvitesOnly}
                  onChange={(e) => setAdminInvitesOnly(e.target.checked)}
                />
                <label htmlFor="adminInvitesOnly" className="checkbox-label">
                  <strong>Strict Invitation Policy:</strong> Only Owners and Admins may invite new members.
                </label>
              </div>

              <div className="portal-footer-actions">
                {saveSuccess && (
                  <div className="success-badge animate-fade-in">
                    <CheckCircle2 size={16} />
                    <span>Settings saved successfully!</span>
                  </div>
                )}
                <button type="submit" className="primary-cta-btn">
                  Save Changes
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: MEMBERS & INVITATIONS */}
          {activeTab === 'members' && (
            <div className="members-tab-view animate-fade-in">
              <div className="section-toolbar">
                <div>
                  <h3 className="section-heading">Team Directory</h3>
                  <p className="section-subheading">
                    {members.length} team members active
                  </p>
                </div>

                <button
                  className="primary-cta-btn"
                  onClick={() => setIsInviteModalOpen(true)}
                >
                  <UserPlus size={16} />
                  <span>Invite Member</span>
                </button>
              </div>

              {/* Members List */}
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Job Title</th>
                      <th>Role</th>
                      <th>Joined</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => {
                      const isSelf = member.userId === 'user-abhinav-current';
                      const isOwnerRole = member.role === 'owner';
                      return (
                        <tr key={member.id}>
                          <td>
                            <div className="user-cell">
                              <div
                                className="member-avatar-sm"
                                style={{ backgroundColor: member.user.avatarColor || '#3b82f6' }}
                              >
                                {member.user.initials || member.user.name.slice(0, 2).toUpperCase()}
                              </div>
                              <span className="user-name-bold">
                                {member.user.name} {isSelf && '(You)'}
                              </span>
                            </div>
                          </td>
                          <td className="text-muted">{member.user.email}</td>
                          <td>{member.jobTitle || 'Team Member'}</td>
                          <td>
                            <select
                              className="role-selector-sm"
                              value={member.role}
                              disabled={isOwnerRole}
                              onChange={(e) =>
                                updateMemberRole(member.id, e.target.value as UserRole)
                              }
                            >
                              <option value="owner">Owner</option>
                              <option value="admin">Admin</option>
                              <option value="member">Member</option>
                              <option value="guest">Guest</option>
                            </select>
                          </td>
                          <td className="text-muted">
                            {new Date(member.joinedAt).toLocaleDateString()}
                          </td>
                          <td className="text-right">
                            {!isOwnerRole && !isSelf && (
                              <button
                                className="icon-button-sm text-danger"
                                title="Remove member"
                                onClick={() => {
                                  if (
                                    confirm(
                                      `Are you sure you want to revoke access for ${member.user.name}?`
                                    )
                                  ) {
                                    removeMember(member.id);
                                  }
                                }}
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pending Invitations */}
              {invitations.length > 0 && (
                <div className="pending-invitations-section">
                  <h4 className="sub-heading-secondary">
                    Pending Invitations ({invitations.length})
                  </h4>
                  <div className="invitations-cards-grid">
                    {invitations.map((invite) => (
                      <div key={invite.id} className="invite-card">
                        <div className="invite-card-left">
                          <Mail size={16} className="text-blue" />
                          <div>
                            <div className="invite-email">{invite.email}</div>
                            <div className="invite-meta">
                              Role: <strong>{invite.role.toUpperCase()}</strong> • Invited by{' '}
                              {invite.invitedByName || 'Admin'}
                            </div>
                          </div>
                        </div>
                        <div className="invite-card-right">
                          <span className="expiry-tag">
                            Expires {new Date(invite.expiresAt).toLocaleDateString()}
                          </span>
                          <button
                            className="btn-danger-subtle-sm"
                            onClick={() => revokeInvite(invite.id)}
                          >
                            Revoke
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WORKSPACES */}
          {activeTab === 'workspaces' && (
            <div className="workspaces-tab-view animate-fade-in">
              <div className="section-toolbar">
                <div>
                  <h3 className="section-heading">Organisation Workspaces</h3>
                  <p className="section-subheading">
                    {workspaces.length} workspaces created
                  </p>
                </div>
                <button
                  className="primary-cta-btn"
                  onClick={() => setIsNewWsModalOpen(true)}
                >
                  <Plus size={16} />
                  <span>Create Workspace</span>
                </button>
              </div>

              <div className="workspaces-grid">
                {workspaces.map((ws) => (
                  <div key={ws.id} className="workspace-item-card">
                    <div className="ws-card-header">
                      <div className="ws-icon-box">
                        <Layers size={18} />
                      </div>
                      <span className={`ws-visibility-pill ${ws.visibility}`}>
                        {ws.visibility === 'private' ? (
                          <>
                            <Lock size={11} /> Private
                          </>
                        ) : (
                          'Organisation'
                        )}
                      </span>
                    </div>

                    <h4 className="ws-title">{ws.name}</h4>
                    <p className="ws-desc">
                      {ws.description || 'No description provided for this workspace.'}
                    </p>

                    <div className="ws-footer">
                      <span className="ws-slug">/{ws.slug}</span>
                      <span className="ws-date">
                        Created {new Date(ws.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: AUDIT LOGS & DATA EXPORT */}
          {activeTab === 'audit' && (
            <div className="audit-tab-view animate-fade-in">
              <div className="section-toolbar">
                <div>
                  <h3 className="section-heading">Operational Compliance & Audit Trail</h3>
                  <p className="section-subheading">
                    Immutable activity log of administrative mutations within {activeOrg.name}.
                  </p>
                </div>
                <button className="secondary-action-btn" onClick={exportOrgData}>
                  <Download size={16} />
                  <span>Export Organisation JSON</span>
                </button>
              </div>

              <div className="audit-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Actor</th>
                      <th>Action</th>
                      <th>Target</th>
                      <th>Details</th>
                      <th>IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="text-muted">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td>
                          <strong>{log.actorName || 'System'}</strong>
                        </td>
                        <td>
                          <span className="log-action-tag">{log.action}</span>
                        </td>
                        <td>{log.targetType}</td>
                        <td className="log-details-cell">
                          <code>{JSON.stringify(log.metadata || {})}</code>
                        </td>
                        <td className="text-muted">{log.ipAddress || '127.0.0.1'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal: Invite Member Dialog */}
        {isInviteModalOpen && (
          <div
            className="sub-modal-backdrop animate-fade-in"
            onClick={() => setIsInviteModalOpen(false)}
          >
            <div
              className="sub-modal-dialog animate-scale-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sub-modal-header">
                <h3>Invite New Member</h3>
                <button
                  className="icon-button-sm"
                  onClick={() => setIsInviteModalOpen(false)}
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSendInvite}>
                {inviteError && (
                  <div className="error-banner">
                    <AlertCircle size={15} />
                    <span>{inviteError}</span>
                  </div>
                )}

                <div className="form-field">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Role</label>
                  <select
                    className="form-input"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  >
                    <option value="member">Member (Can create & edit boards)</option>
                    <option value="admin">Admin (Can manage members & workspaces)</option>
                    <option value="guest">Guest (Restricted view & board access)</option>
                  </select>
                </div>

                <div className="form-field">
                  <label className="form-label">Job Title / Department (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Senior Frontend Engineer"
                    value={inviteJobTitle}
                    onChange={(e) => setInviteJobTitle(e.target.value)}
                  />
                </div>

                <div className="sub-modal-actions">
                  <button
                    type="button"
                    className="secondary-action-btn"
                    onClick={() => setIsInviteModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="primary-cta-btn">
                    Send Secure Invitation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Create Workspace Dialog */}
        {isNewWsModalOpen && (
          <div
            className="sub-modal-backdrop animate-fade-in"
            onClick={() => setIsNewWsModalOpen(false)}
          >
            <div
              className="sub-modal-dialog animate-scale-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sub-modal-header">
                <h3>Create New Workspace</h3>
                <button
                  className="icon-button-sm"
                  onClick={() => setIsNewWsModalOpen(false)}
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateWorkspace}>
                {wsError && (
                  <div className="error-banner">
                    <AlertCircle size={15} />
                    <span>{wsError}</span>
                  </div>
                )}

                <div className="form-field">
                  <label className="form-label">Workspace Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Mobile Engineering"
                    value={wsName}
                    onChange={(e) => setWsName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Description (Optional)</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Describe what team or goals this workspace encompasses..."
                    value={wsDesc}
                    onChange={(e) => setWsDesc(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Visibility</label>
                  <select
                    className="form-input"
                    value={wsVisibility}
                    onChange={(e) => setWsVisibility(e.target.value as WorkspaceVisibility)}
                  >
                    <option value="organisation">Organisation (All employees can see)</option>
                    <option value="private">Private (Only invited members)</option>
                  </select>
                </div>

                <div className="sub-modal-actions">
                  <button
                    type="button"
                    className="secondary-action-btn"
                    onClick={() => setIsNewWsModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="primary-cta-btn">
                    Create Workspace
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
