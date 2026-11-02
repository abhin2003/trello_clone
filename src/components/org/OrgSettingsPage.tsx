import React, { useState } from 'react';
import {
  Building2,
  Shield,
  Download,
  Lock,
  Zap,
} from 'lucide-react';
import { OrgLayout } from './OrgLayout';
import { useTenant } from '../../context/TenantContext';
import { useNavigate } from '../../router/Router';

export const OrgSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    activeOrg,
    updateOrg,
    isAdmin,
    plans,
    usageStats,
    exportOrgData,
    setIsUpgradeModalOpen,
  } = useTenant();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'plan'>('profile');
  const [name, setName] = useState(activeOrg.name);
  const [logoUrl, setLogoUrl] = useState(activeOrg.logoUrl || '');
  const [primaryColor, setPrimaryColor] = useState(activeOrg.primaryColor || '#3b82f6');
  const [allowedDomain, setAllowedDomain] = useState(activeOrg.allowedEmailDomain || '');
  const [enforceInvites, setEnforceInvites] = useState(activeOrg.enforceAdminInvitesOnly ?? true);
  const [saveFeedback, setSaveFeedback] = useState(false);

  const currentPlan = plans.find((p) => p.id === activeOrg.planId) || plans[0];
  const orgSlug = activeOrg.slug || 'acme-corp';

  // Access check: only admins can access settings
  if (!isAdmin) {
    return (
      <OrgLayout activeNav="settings">
        <div className="org-error-page">
          <div className="error-card-box">
            <Lock size={44} color="#f59e0b" style={{ margin: '0 auto 1rem auto' }} />
            <h2 style={{ margin: '0 0 8px 0' }}>Access Restricted</h2>
            <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-secondary)' }}>
              Only organisation Owners and Administrators can manage settings for <strong>{activeOrg.name}</strong>.
            </p>
            <button className="primary-cta-btn" onClick={() => navigate(`/org/${orgSlug}/dashboard`)}>
              Return to Dashboard
            </button>
          </div>
        </div>
      </OrgLayout>
    );
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrg({
      name: name.trim(),
      logoUrl: logoUrl.trim() || undefined,
      primaryColor,
      allowedEmailDomain: allowedDomain.trim() || undefined,
      enforceAdminInvitesOnly: enforceInvites,
    });
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2500);
  };

  return (
    <OrgLayout activeNav="settings">
      <div className="org-page-view">
        <div className="page-header-row">
          <div>
            <h1 className="page-heading">Organisation Settings</h1>
            <p className="page-subheading">
              Manage custom branding, security policies, and subscription quotas for <strong>{activeOrg.name}</strong>.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="secondary-btn" onClick={exportOrgData}>
              <Download size={15} />
              <span>Export Organisation JSON</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="saas-admin-tabs" style={{ marginBottom: '1.5rem' }}>
          <button
            className={`admin-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <Building2 size={16} />
            <span>Profile & Branding</span>
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Shield size={16} />
            <span>Security & Isolation</span>
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'plan' ? 'active' : ''}`}
            onClick={() => setActiveTab('plan')}
          >
            <Zap size={16} />
            <span>Plan & Quota Limits</span>
          </button>
        </div>

        {/* Tab 1: Profile & Branding */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="members-table-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Organisation Identity</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Organisation Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Organisation Slug</label>
                <input
                  type="text"
                  className="form-input"
                  value={activeOrg.slug}
                  disabled
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
                <span className="field-hint" style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Immutable tenant routing slug: <code>/org/{activeOrg.slug}</code>
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Brand Theme Accent</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    style={{ width: '40px', height: '36px', padding: 0, borderRadius: '4px', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    style={{ fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Logo Image URL</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://company.com/logo.png"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', gap: '10px', alignItems: 'center' }}>
              {saveFeedback && (
                <span style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 600 }}>
                  Settings saved successfully!
                </span>
              )}
              <button type="submit" className="primary-cta-btn">
                Save Changes
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Security & Isolation */}
        {activeTab === 'security' && (
          <div className="members-table-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Security Policies & Access</h3>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={enforceInvites}
                  onChange={(e) => setEnforceInvites(e.target.checked)}
                />
                <span className="checkbox-label" style={{ fontWeight: 600 }}>
                  Enforce Administrator-Only Invitations
                </span>
              </label>
              <p style={{ margin: '4px 0 0 24px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                When enabled, only Owners and Administrators can dispatch invitations to new employees or guests.
              </p>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Allowed Email Domain Restriction (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="acme.com"
                value={allowedDomain}
                onChange={(e) => setAllowedDomain(e.target.value)}
                style={{ maxWidth: '320px' }}
              />
              <span className="field-hint" style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Restrict invites so users must register with this corporate domain.
              </span>
            </div>

            <div className="callout-card" style={{ background: 'rgba(62, 207, 142, 0.08)', borderColor: 'rgba(62, 207, 142, 0.3)' }}>
              <strong style={{ color: '#3ecf8e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Shield size={16} />
                <span>PostgreSQL 15+ Row-Level Isolation</span>
              </strong>
              <p style={{ fontSize: '0.82rem', margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>
                All boards, tasks, comments, and members are isolated by foreign key <code>organisation_id = '{activeOrg.id}'</code> and validated against active user session in Supabase.
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Plan & Quotas */}
        {activeTab === 'plan' && (
          <div className="members-table-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>Subscription & Quotas</h3>
                <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  Current tier: <strong style={{ textTransform: 'capitalize' }}>{currentPlan.name}</strong>
                </p>
              </div>

              <button
                type="button"
                className="primary-cta-btn"
                onClick={() => setIsUpgradeModalOpen(true)}
              >
                <Zap size={15} />
                <span>Upgrade Plan</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div className="metric-card" style={{ padding: '1rem' }}>
                <div className="metric-label" style={{ fontSize: '0.74rem' }}>Board Quota</div>
                <div className="metric-val" style={{ fontSize: '1.3rem' }}>
                  {usageStats.totalBoards} / {currentPlan.maxBoards === 999999 ? '∞' : currentPlan.maxBoards}
                </div>
                <div className="metric-sub" style={{ fontSize: '0.75rem' }}>Active boards</div>
              </div>

              <div className="metric-card" style={{ padding: '1rem' }}>
                <div className="metric-label" style={{ fontSize: '0.74rem' }}>Member Allowance</div>
                <div className="metric-val" style={{ fontSize: '1.3rem' }}>
                  {usageStats.totalMembers} / {currentPlan.maxMembers === 999999 ? '∞' : currentPlan.maxMembers}
                </div>
                <div className="metric-sub" style={{ fontSize: '0.75rem' }}>Registered members</div>
              </div>

              <div className="metric-card" style={{ padding: '1rem' }}>
                <div className="metric-label" style={{ fontSize: '0.74rem' }}>Workspace Limit</div>
                <div className="metric-val" style={{ fontSize: '1.3rem' }}>
                  {usageStats.totalWorkspaces} / {currentPlan.maxWorkspaces === 999999 ? '∞' : currentPlan.maxWorkspaces}
                </div>
                <div className="metric-sub" style={{ fontSize: '0.75rem' }}>Workspaces created</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </OrgLayout>
  );
};
