import React, { useState } from 'react';
import { PlatformAdminLayout } from './PlatformAdminLayout';
import { tenantService } from '../../services/tenantService';
import type { SubscriptionPlanId } from '../../types/saas';
import { Plus, CheckCircle2, Copy, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from '../../router/Router';

export const PlatformAdminCreateOrgPage: React.FC = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [planId, setPlanId] = useState<SubscriptionPlanId>('starter');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');

  const [result, setResult] = useState<{ orgName: string; slug: string; token: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9-]/g, '-')) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
    }
  };

  const handleProvision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !ownerEmail.trim()) return;

    const res = tenantService.provisionOrganisation({
      name: name.trim(),
      slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      planId,
      ownerEmail: ownerEmail.trim(),
      ownerName: ownerName.trim() || 'Organisation Owner',
      primaryColor,
    });

    setResult({
      orgName: res.organisation.name,
      slug: res.organisation.slug,
      token: res.inviteToken,
    });
  };

  const inviteUrl = result ? `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${result.token}` : '';

  const copyToClipboard = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <PlatformAdminLayout
      title="Provision Tenant Organisation"
      subtitle="Instantly initialize an isolated multi-tenant boundary, allocate resource quotas, and generate owner invitation"
    >
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        <div style={{ marginBottom: '16px' }}>
          <Link
            to="/platform-admin/organizations"
            className="auth-link"
            style={{ fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={14} /> Back to Organisations
          </Link>
        </div>

        {result ? (
          <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
              Organisation Provisioned Successfully!
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '24px' }}>
              <strong>{result.orgName}</strong> is now live with an isolated database boundary under slug <code style={{ color: '#3b82f6' }}>/org/{result.slug}</code>.
            </p>

            <div
              style={{
                background: 'var(--bg-subtle, rgba(255,255,255,0.03))',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '16px',
                textAlign: 'left',
                marginBottom: '24px',
              }}
            >
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                Owner Onboarding & Invitation Link
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  readOnly
                  value={inviteUrl}
                  className="input-field"
                  style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.84rem' }}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={copyToClipboard}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {copied ? <Check size={16} style={{ color: '#10b981' }} /> : <Copy size={16} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                Send this link to <strong>{ownerEmail}</strong>. When opened, they will be registered as the organisation <strong>Owner</strong>.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setResult(null);
                  setName('');
                  setSlug('');
                  setOwnerEmail('');
                  setOwnerName('');
                }}
              >
                Provision Another
              </button>
              <Link
                to={`/org/${result.slug}/dashboard`}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <span>Open Tenant Workspace</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: '28px' }}>
            <form onSubmit={handleProvision} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label className="input-label" htmlFor="org-name">Organisation Name *</label>
                <input
                  id="org-name"
                  type="text"
                  className="input-field"
                  placeholder="e.g. Acme Corporation or Helios Dynamics"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
              </div>

              <div>
                <label className="input-label" htmlFor="org-slug">URL Slug *</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', fontFamily: 'monospace' }}>/org/</span>
                  <input
                    id="org-slug"
                    type="text"
                    className="input-field"
                    placeholder="acme-corp"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    style={{ flex: 1, fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="input-label" htmlFor="plan-id">Subscription Plan Tier</label>
                  <select
                    id="plan-id"
                    className="input-field"
                    value={planId}
                    onChange={(e) => setPlanId(e.target.value as SubscriptionPlanId)}
                  >
                    <option value="free_trial">Free / 14-Day Trial</option>
                    <option value="starter">Starter ($29/mo)</option>
                    <option value="professional">Professional ($79/mo)</option>
                    <option value="enterprise">Enterprise ($249/mo)</option>
                  </select>
                </div>

                <div>
                  <label className="input-label" htmlFor="brand-color">Brand Primary Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      id="brand-color"
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      style={{ width: '42px', height: '38px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: 'transparent' }}
                    />
                    <input
                      type="text"
                      className="input-field"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      style={{ flex: 1, fontFamily: 'monospace' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
                  Designated Organisation Owner
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label className="input-label" htmlFor="owner-name">Owner Full Name</label>
                    <input
                      id="owner-name"
                      type="text"
                      className="input-field"
                      placeholder="e.g. Jane Doe"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="input-label" htmlFor="owner-email">Owner Email Address *</label>
                    <input
                      id="owner-email"
                      type="email"
                      className="input-field"
                      placeholder="jane@company.com"
                      required
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate('/platform-admin/organizations')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Plus size={16} />
                  <span>Provision Organisation</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </PlatformAdminLayout>
  );
};
