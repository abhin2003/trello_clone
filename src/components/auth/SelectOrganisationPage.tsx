import React, { useState } from 'react';
import {
  Building2,
  ArrowRight,
  Shield,
  Crown,
  UserCheck,
  Plus,
  KeyRound,
  LogOut,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AuthLayout } from './AuthLayout';
import type { UserRole } from '../../types/saas';

export const SelectOrganisationPage: React.FC = () => {
  const {
    userProfile,
    memberships,
    selectOrganisation,
    createOrganisation,
    claimInvitation,
    logout,
  } = useAuth();

  const [isCreating, setIsCreating] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);
  const [inviteToken, setInviteToken] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    setActionLoading(true);
    setActionError(null);
    try {
      const res = await createOrganisation(newOrgName.trim());
      if (!res.success) {
        setActionError(res.error || 'Failed to create organisation');
      } else {
        setIsCreating(false);
        setNewOrgName('');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleClaimInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteToken.trim()) return;

    setActionLoading(true);
    setActionError(null);
    try {
      const res = await claimInvitation(inviteToken.trim());
      if (!res.success) {
        setActionError(res.error || 'Invalid or expired invitation token');
      } else {
        setIsClaiming(false);
        setInviteToken('');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const renderRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return (
          <span className="badge-pill badge-active" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Crown size={12} />
            Owner
          </span>
        );
      case 'admin':
        return (
          <span className="badge-pill badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', borderColor: 'var(--accent-blue)', color: 'var(--accent-blue)' }}>
            <Shield size={12} />
            Admin
          </span>
        );
      case 'member':
        return (
          <span className="badge-pill badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <UserCheck size={12} />
            Member
          </span>
        );
      case 'guest':
        return (
          <span className="badge-pill badge-warning" style={{ fontSize: '0.72rem' }}>
            Guest
          </span>
        );
    }
  };

  return (
    <AuthLayout
      title="Select Your Organisation"
      subtitle={`Welcome back, ${userProfile?.name || 'User'}. Choose which organisation workspace to open.`}
      footerContent={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <button
            type="button"
            className="auth-link-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}
            onClick={logout}
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="auth-link-btn"
              onClick={() => {
                setIsClaiming((p) => !p);
                setIsCreating(false);
                setActionError(null);
              }}
            >
              Have an invitation code?
            </button>
            <button
              type="button"
              className="auth-link-btn"
              onClick={() => {
                setIsCreating((p) => !p);
                setIsClaiming(false);
                setActionError(null);
              }}
            >
              + Create new organisation
            </button>
          </div>
        </div>
      }
    >
      <div className="select-org-content">
        {actionError && (
          <div className="auth-error-banner" style={{ marginBottom: '1rem' }}>
            <AlertCircle size={16} />
            <span>{actionError}</span>
          </div>
        )}

        {/* Claim Invitation Accordion Form */}
        {isClaiming && (
          <form onSubmit={handleClaimInvite} className="callout-card" style={{ marginBottom: '1.25rem' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <KeyRound size={16} color="var(--accent-blue)" />
              <span>Claim Company Invitation</span>
            </h4>
            <p style={{ margin: '0 0 10px 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Paste the cryptographic invitation token you received via email:
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="tok-acme-XXXX-XXXX"
                value={inviteToken}
                onChange={(e) => setInviteToken(e.target.value)}
                style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                required
              />
              <button
                type="submit"
                className="primary-cta-btn"
                disabled={actionLoading || !inviteToken.trim()}
              >
                {actionLoading ? <RefreshCw size={15} className="spin-animation" /> : 'Claim'}
              </button>
            </div>
          </form>
        )}

        {/* Create Organisation Accordion Form */}
        {isCreating && (
          <form onSubmit={handleCreateOrg} className="callout-card" style={{ marginBottom: '1.25rem' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} color="var(--accent-emerald)" />
              <span>Register New Organisation</span>
            </h4>
            <p style={{ margin: '0 0 10px 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Enter the name of your company or department. You will be set as the Owner.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Nexus Innovations"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                required
              />
              <button
                type="submit"
                className="primary-cta-btn"
                disabled={actionLoading || !newOrgName.trim()}
              >
                {actionLoading ? <RefreshCw size={15} className="spin-animation" /> : 'Create'}
              </button>
            </div>
          </form>
        )}

        {/* Organisations List Grid */}
        <div className="org-cards-list">
          {memberships.map((m) => {
            const org = m.organisation;
            const isSuspended = org.status === 'suspended';

            return (
              <div
                key={org.id}
                className={`org-selection-card ${isSuspended ? 'card-suspended' : ''}`}
                onClick={() => selectOrganisation(org.id)}
              >
                <div className="org-card-left">
                  <div
                    className="org-avatar-box"
                    style={{ backgroundColor: org.primaryColor || '#3b82f6' }}
                  >
                    <Building2 size={20} color="#ffffff" />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span className="org-card-name">{org.name}</span>
                      <span className="badge-pill badge-neutral" style={{ textTransform: 'capitalize' }}>
                        {org.planId.replace('_', ' ')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      {renderRoleBadge(m.role)}
                      {m.jobTitle && <span className="org-card-job">{m.jobTitle}</span>}
                    </div>
                  </div>
                </div>

                <div className="org-card-right">
                  <button
                    type="button"
                    className="org-enter-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      selectOrganisation(org.id);
                    }}
                  >
                    <span>Enter</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AuthLayout>
  );
};
