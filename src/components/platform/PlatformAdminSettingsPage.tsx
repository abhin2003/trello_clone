import React, { useState } from 'react';
import { PlatformAdminLayout } from './PlatformAdminLayout';
import { tenantService } from '../../services/tenantService';
import type { SubscriptionPlan, SubscriptionPlanId } from '../../types/saas';
import { Sliders, KeyRound, Check, Save, AlertTriangle } from 'lucide-react';

export const PlatformAdminSettingsPage: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>(() => tenantService.getSubscriptionPlans());
  const [editingPlanId, setEditingPlanId] = useState<SubscriptionPlanId | null>(null);
  const [planEdits, setPlanEdits] = useState<Partial<SubscriptionPlan>>({});

  // Support break glass state
  const [supportOrgId, setSupportOrgId] = useState('');
  const [supportTicket, setSupportTicket] = useState('');
  const [supportReason, setSupportReason] = useState('');
  const [supportDuration, setSupportDuration] = useState(2);
  const [supportSuccessMsg, setSupportSuccessMsg] = useState<string | null>(null);

  const organisations = tenantService.getAllOrganisations();

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlanId(plan.id);
    setPlanEdits({
      name: plan.name,
      monthlyPriceCents: plan.monthlyPriceCents,
      maxMembers: plan.maxMembers,
      maxWorkspaces: plan.maxWorkspaces,
      storageAllowanceBytes: plan.storageAllowanceBytes,
    });
  };

  const handleSavePlan = (planId: SubscriptionPlanId) => {
    tenantService.updateSubscriptionPlan(planId, planEdits);
    setPlans(tenantService.getSubscriptionPlans());
    setEditingPlanId(null);
    setPlanEdits({});
  };

  const handleCreateSupportSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportOrgId || !supportTicket.trim() || !supportReason.trim()) return;

    tenantService.requestSupportAccess(supportOrgId, supportTicket.trim(), supportReason.trim(), supportDuration);
    setSupportSuccessMsg(`Elevated support session granted for ${supportDuration} hours. Platform audit log updated.`);
    setSupportTicket('');
    setSupportReason('');
    setTimeout(() => setSupportSuccessMsg(null), 5000);
  };

  return (
    <PlatformAdminLayout
      title="Platform Settings & Governance"
      subtitle="Subscription tier resource allocations, pricing structures, and emergency break-glass protocols"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* Subscription Plan Quotas */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Sliders size={20} style={{ color: '#3b82f6' }} />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
              Subscription Tier Limits & Resource Quotas
            </h2>
          </div>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Adjust seat capacities, workspace quotas, storage ceilings, and pricing for each multi-tenant plan tier.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {plans.map((plan) => {
              const isEditing = editingPlanId === plan.id;
              return (
                <div
                  key={plan.id}
                  style={{
                    padding: '20px',
                    borderRadius: '8px',
                    background: 'var(--bg-subtle, rgba(255,255,255,0.02))',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{plan.name}</span>
                      <span className="badge-pill badge-primary" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                        {plan.id}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', minHeight: '36px', marginBottom: '14px' }}>
                      {plan.description}
                    </p>

                    {isEditing ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                        <div>
                          <label className="input-label" style={{ fontSize: '0.75rem' }}>Monthly Price ($)</label>
                          <input
                            type="number"
                            className="input-field"
                            value={((planEdits.monthlyPriceCents ?? plan.monthlyPriceCents) / 100).toFixed(0)}
                            onChange={(e) =>
                              setPlanEdits({ ...planEdits, monthlyPriceCents: Math.round(Number(e.target.value) * 100) })
                            }
                          />
                        </div>
                        <div>
                          <label className="input-label" style={{ fontSize: '0.75rem' }}>Max Members</label>
                          <input
                            type="number"
                            className="input-field"
                            value={planEdits.maxMembers ?? plan.maxMembers}
                            onChange={(e) => setPlanEdits({ ...planEdits, maxMembers: Number(e.target.value) })}
                          />
                        </div>
                        <div>
                          <label className="input-label" style={{ fontSize: '0.75rem' }}>Max Workspaces</label>
                          <input
                            type="number"
                            className="input-field"
                            value={planEdits.maxWorkspaces ?? plan.maxWorkspaces}
                            onChange={(e) => setPlanEdits({ ...planEdits, maxWorkspaces: Number(e.target.value) })}
                          />
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                        <div>Price: <strong style={{ color: 'var(--text-primary)' }}>${(plan.monthlyPriceCents / 100).toFixed(0)}/mo</strong></div>
                        <div>Max Members: <strong style={{ color: 'var(--text-primary)' }}>{plan.maxMembers > 10000 ? 'Unlimited' : plan.maxMembers}</strong></div>
                        <div>Max Workspaces: <strong style={{ color: 'var(--text-primary)' }}>{plan.maxWorkspaces > 10000 ? 'Unlimited' : plan.maxWorkspaces}</strong></div>
                        <div>Storage: <strong style={{ color: 'var(--text-primary)' }}>{(plan.storageAllowanceBytes / 1073741824).toFixed(0)} GB</strong></div>
                      </div>
                    )}
                  </div>

                  <div>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ flex: 1, padding: '6px' }}
                          onClick={() => setEditingPlanId(null)}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ flex: 1, padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                          onClick={() => handleSavePlan(plan.id)}
                        >
                          <Save size={14} />
                          <span>Save</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ width: '100%', fontSize: '0.82rem' }}
                        onClick={() => handleEditPlan(plan)}
                      >
                        Configure Quotas
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Break-Glass Support Access */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <KeyRound size={20} style={{ color: '#f59e0b' }} />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
              Emergency Break-Glass Support Access
            </h2>
          </div>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Grant temporary, audited cross-tenant administrative access to investigate reported customer incidents. All actions are logged to the immutable platform audit stream.
          </p>

          {supportSuccessMsg && (
            <div className="auth-alert auth-alert-success" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Check size={16} />
              <span>{supportSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreateSupportSession} style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="input-label" htmlFor="support-org">Target Tenant Organisation *</label>
              <select
                id="support-org"
                className="input-field"
                required
                value={supportOrgId}
                onChange={(e) => setSupportOrgId(e.target.value)}
              >
                <option value="">Select organisation...</option>
                {organisations.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} ({o.slug})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
              <div>
                <label className="input-label" htmlFor="support-ticket">Support Ticket / Incident ID *</label>
                <input
                  id="support-ticket"
                  type="text"
                  className="input-field"
                  placeholder="e.g. INC-94821"
                  required
                  value={supportTicket}
                  onChange={(e) => setSupportTicket(e.target.value)}
                />
              </div>

              <div>
                <label className="input-label" htmlFor="support-duration">Duration (Hours)</label>
                <select
                  id="support-duration"
                  className="input-field"
                  value={supportDuration}
                  onChange={(e) => setSupportDuration(Number(e.target.value))}
                >
                  <option value={1}>1 hour</option>
                  <option value={2}>2 hours</option>
                  <option value={4}>4 hours</option>
                  <option value={8}>8 hours</option>
                </select>
              </div>
            </div>

            <div>
              <label className="input-label" htmlFor="support-reason">Detailed Audit Justification *</label>
              <textarea
                id="support-reason"
                className="input-field"
                rows={3}
                placeholder="State the technical reason requiring elevated administrative access..."
                required
                value={supportReason}
                onChange={(e) => setSupportReason(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ background: '#f59e0b', borderColor: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <AlertTriangle size={15} />
                <span>Grant Break-Glass Session</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </PlatformAdminLayout>
  );
};
