import React from 'react';
import { useTenant } from '../context/TenantContext';
import { ShieldAlert, AlertTriangle, ArrowRight, Building2, HelpCircle } from 'lucide-react';

export const SuspendedTenantBanner: React.FC = () => {
  const { activeOrg, isSuspended, userOrgs, switchOrganisation } = useTenant();

  if (!isSuspended) return null;

  // Find another active organisation the user belongs to
  const alternativeOrg = userOrgs.find((o) => o.status !== 'suspended');

  return (
    <div className="suspended-lockout-overlay animate-fade-in">
      <div className="suspended-lockout-card animate-scale-up">
        <div className="lockout-icon-box">
          <ShieldAlert size={40} className="text-rose" />
        </div>

        <h2 className="lockout-title">Organisation Suspended</h2>
        <div className="lockout-org-name">{activeOrg.name}</div>

        <div className="lockout-reason-box">
          <div className="reason-label">
            <AlertTriangle size={15} className="text-amber mr-1 shrink-0" />
            <span>Notice of Account Status:</span>
          </div>
          <p className="reason-text">
            {activeOrg.statusReason ||
              'This organisation has been temporarily suspended by a platform administrator. Access to workspaces, boards, and project content is restricted.'}
          </p>
        </div>

        <div className="lockout-info-text">
          Row-Level Security (RLS) has restricted database access for all members of this tenant. If you believe this is in error or need billing resolution, please contact your account owner or platform support.
        </div>

        <div className="lockout-actions-row">
          {alternativeOrg && (
            <button
              className="primary-cta-btn"
              onClick={() => switchOrganisation(alternativeOrg.id)}
            >
              <Building2 size={16} />
              <span>Switch to {alternativeOrg.name}</span>
              <ArrowRight size={16} />
            </button>
          )}

          <a
            href="mailto:support@drello.com"
            className="secondary-action-btn"
            target="_blank"
            rel="noopener noreferrer"
          >
            <HelpCircle size={16} />
            <span>Contact Platform Support</span>
          </a>
        </div>
      </div>
    </div>
  );
};
