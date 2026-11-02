import React from 'react';
import { useTenant } from '../context/TenantContext';
import {
  X,
  Check,
  Crown,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import type { SubscriptionPlanId } from '../types/saas';

export const PlanUpgradeModal: React.FC = () => {
  const {
    activeOrg,
    plans,
    isUpgradeModalOpen,
    setIsUpgradeModalOpen,
    quotaWarning,
    setQuotaWarning,
    upgradePlan,
  } = useTenant();

  if (!isUpgradeModalOpen) return null;

  const handleClose = () => {
    setIsUpgradeModalOpen(false);
    setQuotaWarning(null);
  };

  const getPlanBadge = (id: string) => {
    if (id === 'professional') return 'MOST POPULAR';
    if (id === 'enterprise') return 'ENTERPRISE READY';
    return null;
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={handleClose}>
      <div
        className="plan-upgrade-modal-card animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header-row">
          <div>
            <div className="flex-align">
              <Crown size={22} className="text-amber mr-2" />
              <h2 className="modal-headline">Subscription Plans & Quota Management</h2>
            </div>
            <p className="modal-subtext">
              Scale your team capacity, remove board limits, and unlock advanced security controls.
            </p>
          </div>
          <button className="icon-button" onClick={handleClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {quotaWarning && (
          <div className="quota-alert-banner animate-fade-in">
            <AlertTriangle size={18} className="text-amber shrink-0" />
            <div>
              <strong>Action Required:</strong> {quotaWarning}
            </div>
          </div>
        )}

        <div className="plans-tier-grid">
          {plans.map((plan) => {
            const isCurrent = activeOrg.planId === plan.id;
            const badge = getPlanBadge(plan.id);

            return (
              <div
                key={plan.id}
                className={`plan-tier-card ${isCurrent ? 'current-plan-card' : ''} ${
                  plan.id === 'professional' ? 'popular-plan-card' : ''
                }`}
              >
                {badge && <div className="tier-pill-badge">{badge}</div>}

                <div className="tier-header">
                  <h3 className="tier-name">{plan.name}</h3>
                  <div className="tier-price-row">
                    <span className="tier-price-currency">$</span>
                    <span className="tier-price-val">
                      {(plan.monthlyPriceCents / 100).toFixed(0)}
                    </span>
                    <span className="tier-price-period">/month</span>
                  </div>
                  <p className="tier-description">{plan.description}</p>
                </div>

                <div className="tier-features-list">
                  <div className="feature-item">
                    <Check size={16} className="feature-check" />
                    <span>
                      <strong>
                        {plan.maxMembers > 9999 ? 'Unlimited' : plan.maxMembers}
                      </strong>{' '}
                      Team Members
                    </span>
                  </div>

                  <div className="feature-item">
                    <Check size={16} className="feature-check" />
                    <span>
                      <strong>
                        {plan.maxWorkspaces > 9999 ? 'Unlimited' : plan.maxWorkspaces}
                      </strong>{' '}
                      Workspaces
                    </span>
                  </div>

                  <div className="feature-item">
                    <Check size={16} className="feature-check" />
                    <span>
                      <strong>
                        {plan.maxBoards > 9999 ? 'Unlimited' : plan.maxBoards}
                      </strong>{' '}
                      Kanban Boards
                    </span>
                  </div>

                  <div className="feature-item">
                    <Check size={16} className="feature-check" />
                    <span>
                      <strong>
                        {(plan.storageAllowanceBytes / (1024 * 1024 * 1024)).toFixed(0)} GB
                      </strong>{' '}
                      Cloud Storage
                    </span>
                  </div>

                  <div className="feature-item">
                    <Check size={16} className="feature-check" />
                    <span>
                      {plan.allowGuestAccess ? 'Guest Access Enabled' : 'No Guest Access'}
                    </span>
                  </div>

                  <div className="feature-item">
                    <Check size={16} className="feature-check" />
                    <span>
                      {plan.allowCustomBranding ? 'Custom Branding & Logo' : 'Standard Theme'}
                    </span>
                  </div>

                  <div className="feature-item">
                    <Check size={16} className="feature-check" />
                    <span>
                      {plan.allowAdvancedAuditLogs ? 'Full Audit Logging' : 'Basic Logs'}
                    </span>
                  </div>
                </div>

                <div className="tier-footer">
                  {isCurrent ? (
                    <button className="current-plan-btn" disabled>
                      <span>Active Plan</span>
                    </button>
                  ) : (
                    <button
                      className={`primary-cta-btn w-full ${
                        plan.id === 'professional' ? 'btn-popular' : ''
                      }`}
                      onClick={() => upgradePlan(plan.id as SubscriptionPlanId)}
                    >
                      <Sparkles size={16} />
                      <span>Switch to {plan.name}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
