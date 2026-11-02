import React, { useState } from 'react';
import { PlatformAdminLayout } from './PlatformAdminLayout';
import { tenantService } from '../../services/tenantService';
import { Sliders, KeyRound, Check, AlertTriangle } from 'lucide-react';

export const PlatformAdminSettingsPage: React.FC = () => {
  // Support break glass state
  const [supportOrgId, setSupportOrgId] = useState('');
  const [supportTicket, setSupportTicket] = useState('');
  const [supportReason, setSupportReason] = useState('');
  const [supportDuration, setSupportDuration] = useState(2);
  const [supportSuccessMsg, setSupportSuccessMsg] = useState<string | null>(null);

  const organisations = tenantService.getAllOrganisations();

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
      subtitle="Security protocols, emergency break-glass sessions, and platform administration"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* Unlimited Mode Banner */}
        <div className="card" style={{ padding: '20px 24px', background: 'rgba(59, 130, 246, 0.05)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sliders size={20} style={{ color: '#3b82f6' }} />
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
                Unlimited Platform Mode Active
              </h2>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
                All organisations have unlimited boards, members, workspaces, and full feature access with no subscription constraints or quota limits.
              </p>
            </div>
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
