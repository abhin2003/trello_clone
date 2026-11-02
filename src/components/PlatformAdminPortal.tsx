import React, { useState, useMemo } from 'react';
import { useTenant } from '../context/TenantContext';
import { tenantService } from '../services/tenantService';
import {
  X,
  Shield,
  Building2,
  KeyRound,
  FileText,
  AlertTriangle,
  CheckCircle,
  Plus,
  Play,
  Pause,
  Search,
  Lock,
  Unlock,
  Clock,
  AlertOctagon,
} from 'lucide-react';
import type { SubscriptionPlanId } from '../types/saas';

export const PlatformAdminPortal: React.FC = () => {
  const { isPlatformAdminOpen, setIsPlatformAdminOpen, refreshTenantState } = useTenant();

  const [activeTab, setActiveTab] = useState<'tenants' | 'provision' | 'support' | 'logs'>('tenants');
  const [searchQuery, setSearchQuery] = useState('');

  // Provisioning form state
  const [provName, setProvName] = useState('');
  const [provSlug, setProvSlug] = useState('');
  const [provPlan, setProvPlan] = useState<SubscriptionPlanId>('starter');
  const [provOwnerEmail, setProvOwnerEmail] = useState('');
  const [provOwnerName, setProvOwnerName] = useState('');
  const [provColor, setProvColor] = useState('#3b82f6');
  const [provResult, setProvResult] = useState<{ orgName: string; token: string } | null>(null);

  // Suspend modal state
  const [suspendingOrgId, setSuspendingOrgId] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  // Support break glass state
  const [supportOrgId, setSupportOrgId] = useState('');
  const [supportTicket, setSupportTicket] = useState('');
  const [supportReason, setSupportReason] = useState('');
  const [supportDuration, setSupportDuration] = useState(2);
  const [supportSuccessMsg, setSupportSuccessMsg] = useState<string | null>(null);

  // Reload organisations
  const organisations = useMemo(() => {
    return tenantService.getAllOrganisations();
  }, [isPlatformAdminOpen, activeTab]);

  const supportSessions = useMemo(() => {
    return tenantService.getSupportSessions();
  }, [isPlatformAdminOpen, activeTab]);

  const platformLogs = useMemo(() => {
    return tenantService.getPlatformAuditLogs();
  }, [isPlatformAdminOpen, activeTab]);

  if (!isPlatformAdminOpen) return null;

  const filteredOrgs = organisations.filter(
    (o) =>
      o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.planId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalMembersAllOrgs = organisations.reduce((sum, o) => sum + o.memberCount, 0);
  const totalStorageAllOrgsBytes = organisations.reduce((sum, o) => sum + o.usedStorageBytes, 0);

  const handleProvision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!provName.trim() || !provOwnerEmail.trim()) return;
    const res = tenantService.provisionOrganisation({
      name: provName.trim(),
      slug: provSlug.trim() || provName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      planId: provPlan,
      ownerEmail: provOwnerEmail.trim(),
      ownerName: provOwnerName.trim() || 'Organisation Owner',
      primaryColor: provColor,
    });
    setProvResult({ orgName: res.organisation.name, token: res.inviteToken });
    setProvName('');
    setProvSlug('');
    setProvOwnerEmail('');
    setProvOwnerName('');
    refreshTenantState();
  };

  const handleConfirmSuspend = () => {
    if (!suspendingOrgId || !suspendReason.trim()) return;
    tenantService.suspendOrganisation(suspendingOrgId, suspendReason.trim());
    setSuspendingOrgId(null);
    setSuspendReason('');
    refreshTenantState();
  };

  const handleReactivate = (orgId: string) => {
    tenantService.reactivateOrganisation(orgId);
    refreshTenantState();
  };

  const handleCreateSupportSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportOrgId || !supportTicket.trim() || !supportReason.trim()) return;
    tenantService.requestSupportAccess(supportOrgId, supportTicket.trim(), supportReason.trim(), supportDuration);
    setSupportSuccessMsg(`Break-glass support session granted for ${supportDuration} hours. All audit streams notified.`);
    setSupportTicket('');
    setSupportReason('');
    setTimeout(() => setSupportSuccessMsg(null), 4000);
    refreshTenantState();
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={() => setIsPlatformAdminOpen(false)}>
      <div
        className="admin-portal-modal platform-admin-modal animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="portal-header platform-header-bg">
          <div className="portal-header-left">
            <div className="portal-brand-avatar platform-brand-avatar">
              <Shield size={22} />
            </div>
            <div>
              <div className="portal-title-row">
                <h2 className="portal-title">Stratcrest SaaS Platform Administration</h2>
                <span className="super-admin-badge">SUPER-ADMIN CONSOLE</span>
              </div>
              <p className="portal-subtitle">
                Cross-Tenant Governance, Provisioning, Plan Limits & Operational Telemetry
              </p>
            </div>
          </div>
          <button
            className="icon-button"
            onClick={() => setIsPlatformAdminOpen(false)}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Top Platform KPIs */}
        <div className="platform-kpi-bar">
          <div className="kpi-stat-item">
            <span className="kpi-label">Active Tenants</span>
            <span className="kpi-value">{organisations.filter((o) => o.status !== 'suspended').length}</span>
          </div>
          <div className="kpi-stat-item">
            <span className="kpi-label">Total Registered Users</span>
            <span className="kpi-value">{totalMembersAllOrgs}</span>
          </div>
          <div className="kpi-stat-item">
            <span className="kpi-label">Aggregated Storage</span>
            <span className="kpi-value">
              {(totalStorageAllOrgsBytes / (1024 * 1024)).toFixed(1)} MB
            </span>
          </div>
          <div className="kpi-stat-item">
            <span className="kpi-label">Suspended Tenants</span>
            <span className="kpi-value text-rose">
              {organisations.filter((o) => o.status === 'suspended').length}
            </span>
          </div>
          <div className="kpi-stat-item">
            <span className="kpi-label">Active Support Sessions</span>
            <span className="kpi-value text-amber">
              {supportSessions.filter((s) => s.status === 'active').length}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="portal-tabs-nav">
          <button
            className={`portal-tab-btn ${activeTab === 'tenants' ? 'active' : ''}`}
            onClick={() => setActiveTab('tenants')}
          >
            <Building2 size={16} />
            <span>Organisations Directory ({organisations.length})</span>
          </button>

          <button
            className={`portal-tab-btn ${activeTab === 'provision' ? 'active' : ''}`}
            onClick={() => setActiveTab('provision')}
          >
            <Plus size={16} />
            <span>Provision Organisation</span>
          </button>

          <button
            className={`portal-tab-btn ${activeTab === 'support' ? 'active' : ''}`}
            onClick={() => setActiveTab('support')}
          >
            <KeyRound size={16} />
            <span>Support Break-Glass Protocol</span>
          </button>

          <button
            className={`portal-tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            <FileText size={16} />
            <span>Platform Audit Stream</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="portal-tab-content">
          {/* TAB 1: ALL TENANTS */}
          {activeTab === 'tenants' && (
            <div className="tenants-tab-view animate-fade-in">
              <div className="section-toolbar">
                <div className="search-field-wrapper">
                  <Search size={15} className="search-icon" />
                  <input
                    type="text"
                    className="search-input-clean"
                    placeholder="Search by organisation name, slug, or plan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button className="primary-cta-btn" onClick={() => setActiveTab('provision')}>
                  <Plus size={15} />
                  <span>Provision New Tenant</span>
                </button>
              </div>

              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Organisation</th>
                      <th>Slug</th>
                      <th>Status</th>
                      <th>Plan</th>
                      <th>Members</th>
                      <th>Boards</th>
                      <th>Storage</th>
                      <th className="text-right">Lifecycle Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrgs.map((org) => {
                      const isSuspended = org.status === 'suspended';
                      return (
                        <tr key={org.id} className={isSuspended ? 'row-suspended' : ''}>
                          <td>
                            <div className="user-cell">
                              <div
                                className="member-avatar-sm"
                                style={{ backgroundColor: org.primaryColor || '#3b82f6' }}
                              >
                                {org.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <span className="user-name-bold">{org.name}</span>
                                {org.statusReason && (
                                  <div className="suspension-note">{org.statusReason}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="text-muted">/{org.slug}</td>
                          <td>
                            <span
                              className={`status-pill ${
                                isSuspended ? 'status-suspended' : 'status-active'
                              }`}
                            >
                              {org.status.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <span className="plan-tag-caps">{org.planId.toUpperCase()}</span>
                          </td>
                          <td>{org.memberCount}</td>
                          <td>{org.boardCount}</td>
                          <td className="text-muted">
                            {(org.usedStorageBytes / (1024 * 1024)).toFixed(1)} MB
                          </td>
                          <td className="text-right">
                            {isSuspended ? (
                              <button
                                className="btn-success-sm"
                                onClick={() => handleReactivate(org.id)}
                                title="Reactivate tenant and restore RLS access"
                              >
                                <Play size={13} />
                                <span>Reactivate</span>
                              </button>
                            ) : (
                              <button
                                className="btn-danger-sm"
                                onClick={() => setSuspendingOrgId(org.id)}
                                title="Suspend tenant immediately"
                              >
                                <Pause size={13} />
                                <span>Suspend</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: PROVISION ORGANISATION */}
          {activeTab === 'provision' && (
            <div className="provision-tab-view animate-fade-in">
              <div className="provision-card-box">
                <h3 className="section-heading">Provision New Enterprise Organisation</h3>
                <p className="section-subheading">
                  Initializes a dedicated tenant space, creates an initial workspace, and dispatches an owner invitation token.
                </p>

                {provResult && (
                  <div className="success-banner-box animate-fade-in">
                    <CheckCircle size={20} className="text-emerald" />
                    <div>
                      <div className="success-banner-title">
                        Organisation "{provResult.orgName}" Successfully Provisioned!
                      </div>
                      <div className="token-reveal-row">
                        <span>Owner Invitation Token:</span>
                        <code>{provResult.token}</code>
                      </div>
                      <p className="token-hint">
                        The owner can claim this tenant by visiting <strong>Accept Invitation</strong> in the onboarding menu.
                      </p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleProvision} className="admin-form">
                  <div className="form-grid-2">
                    <div className="form-field">
                      <label className="form-label">Organisation Name</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Globex Corporation"
                        value={provName}
                        onChange={(e) => {
                          setProvName(e.target.value);
                          if (!provSlug) {
                            setProvSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
                          }
                        }}
                        required
                      />
                    </div>

                    <div className="form-field">
                      <label className="form-label">URL Slug</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="globex-corp"
                        value={provSlug}
                        onChange={(e) => setProvSlug(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-field">
                      <label className="form-label">Initial Subscription Plan</label>
                      <select
                        className="form-input"
                        value={provPlan}
                        onChange={(e) => setProvPlan(e.target.value as SubscriptionPlanId)}
                      >
                        <option value="free_trial">Standard / Community</option>
                        <option value="starter">Starter (15 members, 20 boards)</option>
                        <option value="professional">Professional (100 members, unlimited boards)</option>
                        <option value="enterprise">Enterprise (Unlimited, Dedicated SLA)</option>
                      </select>
                    </div>

                    <div className="form-field">
                      <label className="form-label">Primary Brand Accent</label>
                      <input
                        type="color"
                        className="form-input color-box-input"
                        value={provColor}
                        onChange={(e) => setProvColor(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-field">
                      <label className="form-label">Owner Full Name</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Hank Scorpio"
                        value={provOwnerName}
                        onChange={(e) => setProvOwnerName(e.target.value)}
                      />
                    </div>

                    <div className="form-field">
                      <label className="form-label">Owner Email Address</label>
                      <input
                        type="email"
                        className="form-input"
                        placeholder="hank@globex.com"
                        value={provOwnerEmail}
                        onChange={(e) => setProvOwnerEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="portal-footer-actions">
                    <button type="submit" className="primary-cta-btn">
                      Provision Tenant & Generate Invite
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 4: SUPPORT BREAK-GLASS PROTOCOL */}
          {activeTab === 'support' && (
            <div className="support-tab-view animate-fade-in">
              <div className="security-notice-callout">
                <AlertOctagon size={24} className="text-amber" />
                <div>
                  <h4 className="callout-title">Zero-Knowledge Tenant Isolation Protocol</h4>
                  <p className="callout-text">
                    Platform administrators do <strong>not</strong> possess default read/write access to customer boards or task content. In accordance with SOC-2 / ISO-27001 compliance, customer workspace inspection requires an explicitly authorized Support Break-Glass ticket. All access is time-bounded and logged.
                  </p>
                </div>
              </div>

              {supportSuccessMsg && (
                <div className="success-banner-box animate-fade-in">
                  <CheckCircle size={18} className="text-emerald" />
                  <span>{supportSuccessMsg}</span>
                </div>
              )}

              <div className="support-gateway-grid">
                {/* Break Glass Request Form */}
                <div className="gateway-form-box">
                  <h4 className="sub-heading-secondary">Initiate Emergency Support Session</h4>
                  <form onSubmit={handleCreateSupportSession} className="admin-form">
                    <div className="form-field">
                      <label className="form-label">Customer Organisation</label>
                      <select
                        className="form-input"
                        value={supportOrgId}
                        onChange={(e) => setSupportOrgId(e.target.value)}
                        required
                      >
                        <option value="">Select customer organisation...</option>
                        {organisations.map((org) => (
                          <option key={org.id} value={org.id}>
                            {org.name} ({org.slug})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-field">
                      <label className="form-label">Customer Support Ticket Reference #</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. SUP-89212"
                        value={supportTicket}
                        onChange={(e) => setSupportTicket(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-field">
                      <label className="form-label">Technical Reason & Investigation Scope</label>
                      <textarea
                        className="form-textarea"
                        placeholder="e.g. Troubleshooting drag-and-drop state desynchronization for Sprint 14 board."
                        value={supportReason}
                        onChange={(e) => setSupportReason(e.target.value)}
                        rows={3}
                        required
                      />
                    </div>

                    <div className="form-field">
                      <label className="form-label">Access Duration (Hours)</label>
                      <select
                        className="form-input"
                        value={supportDuration}
                        onChange={(e) => setSupportDuration(parseInt(e.target.value))}
                      >
                        <option value={1}>1 Hour (Quick triage)</option>
                        <option value={2}>2 Hours (Standard investigation)</option>
                        <option value={4}>4 Hours (Complex incident recovery)</option>
                      </select>
                    </div>

                    <button type="submit" className="primary-cta-btn">
                      <Unlock size={16} />
                      <span>Activate Break-Glass Session</span>
                    </button>
                  </form>
                </div>

                {/* Active Sessions List */}
                <div className="active-sessions-box">
                  <h4 className="sub-heading-secondary">Active / Historical Support Sessions</h4>
                  {supportSessions.length === 0 ? (
                    <div className="empty-sessions-notice">
                      <Lock size={32} className="text-muted" />
                      <p>No active support sessions. System is fully isolated.</p>
                    </div>
                  ) : (
                    <div className="sessions-list">
                      {supportSessions.map((s) => (
                        <div key={s.id} className="session-item-card">
                          <div className="session-header-row">
                            <span className="session-ticket">{s.ticketReference}</span>
                            <span className={`session-status-tag status-${s.status}`}>
                              {s.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="session-org-name">{s.orgName}</div>
                          <p className="session-reason">{s.reason}</p>
                          <div className="session-footer-row">
                            <span className="session-expiry">
                              <Clock size={12} /> Expires{' '}
                              {new Date(s.expiresAt).toLocaleTimeString()}
                            </span>
                            {s.status === 'active' && (
                              <button
                                className="btn-danger-subtle-sm"
                                onClick={() => {
                                  tenantService.revokeSupportSession(s.id);
                                  refreshTenantState();
                                }}
                              >
                                Revoke Now
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PLATFORM AUDIT STREAM */}
          {activeTab === 'logs' && (
            <div className="platform-logs-tab-view animate-fade-in">
              <div className="section-toolbar">
                <div>
                  <h3 className="section-heading">Platform System Audit Stream</h3>
                  <p className="section-subheading">
                    Global operational log of security, tenant lifecycle, and administrative events.
                  </p>
                </div>
              </div>

              <div className="audit-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Actor</th>
                      <th>Action</th>
                      <th>Target Organisation</th>
                      <th>Details</th>
                      <th>IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {platformLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="text-muted">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td>
                          <strong>{log.actorName || 'Platform Admin'}</strong>
                        </td>
                        <td>
                          <span className="log-action-tag platform-tag">{log.action}</span>
                        </td>
                        <td>{log.organisationId}</td>
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

        {/* Suspend Confirmation Dialog */}
        {suspendingOrgId && (
          <div
            className="sub-modal-backdrop animate-fade-in"
            onClick={() => setSuspendingOrgId(null)}
          >
            <div
              className="sub-modal-dialog animate-scale-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sub-modal-header">
                <div className="text-danger flex-align">
                  <AlertTriangle size={20} className="mr-2" />
                  <h3>Suspend Organisation</h3>
                </div>
                <button
                  className="icon-button-sm"
                  onClick={() => setSuspendingOrgId(null)}
                >
                  <X size={16} />
                </button>
              </div>

              <p className="modal-description-text">
                Suspending this organisation will <strong>immediately revoke access</strong> for all member accounts and trigger PostgreSQL RLS query rejection.
              </p>

              <div className="form-field">
                <label className="form-label">Suspension Reason (Visible to Customer)</label>
                <textarea
                  className="form-textarea"
                  placeholder="e.g. Subscription past due by 45 days / Terms of Service violation."
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  rows={3}
                  required
                  autoFocus
                />
              </div>

              <div className="sub-modal-actions">
                <button
                  type="button"
                  className="secondary-action-btn"
                  onClick={() => setSuspendingOrgId(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-danger-full"
                  disabled={!suspendReason.trim()}
                  onClick={handleConfirmSuspend}
                >
                  Confirm Suspension
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
