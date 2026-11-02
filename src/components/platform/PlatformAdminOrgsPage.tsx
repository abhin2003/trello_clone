import React, { useState, useMemo } from 'react';
import { PlatformAdminLayout } from './PlatformAdminLayout';
import { tenantService } from '../../services/tenantService';
import { Search, Plus, Play, Pause, AlertTriangle } from 'lucide-react';
import { Link } from '../../router/Router';

export const PlatformAdminOrgsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [suspendingOrgId, setSuspendingOrgId] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [version, setVersion] = useState(0);

  const organisations = useMemo(() => {
    // depend on version to force re-render upon mutation
    return tenantService.getAllOrganisations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  const filteredOrgs = organisations.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.slug.toLowerCase().includes(search.toLowerCase()) ||
      o.planId.toLowerCase().includes(search.toLowerCase())
  );

  const handleConfirmSuspend = () => {
    if (!suspendingOrgId || !suspendReason.trim()) return;
    tenantService.suspendOrganisation(suspendingOrgId, suspendReason.trim());
    setSuspendingOrgId(null);
    setSuspendReason('');
    setVersion((v) => v + 1);
  };

  const handleReactivate = (orgId: string) => {
    tenantService.reactivateOrganisation(orgId);
    setVersion((v) => v + 1);
  };

  return (
    <PlatformAdminLayout
      title="Organisation Governance"
      subtitle="Supervise active tenant workloads, plan quotas, compliance enforcement, and suspensions"
    >
      {/* Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search organisations by name, slug or plan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '36px', width: '100%' }}
          />
        </div>

        <Link
          to="/platform-admin/organizations/create"
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={16} />
          <span>Provision Organisation</span>
        </Link>
      </div>

      {/* Organisations Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle, rgba(255,255,255,0.03))', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Organisation</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Slug</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Plan</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Members</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrgs.map((org) => (
                <tr key={org.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          background: org.primaryColor || '#3b82f6',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                        }}
                      >
                        {org.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{org.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: {org.id}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                    /org/{org.slug}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span className="badge-pill badge-primary" style={{ textTransform: 'uppercase', fontSize: '0.74rem' }}>
                      {org.planId}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-primary)', fontWeight: 500 }}>
                    {org.memberCount} users
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span className={`badge-pill ${org.status === 'active' ? 'badge-active' : 'badge-danger'}`} style={{ textTransform: 'capitalize' }}>
                      {org.status}
                    </span>
                    {org.statusReason && (
                      <div style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: '4px', maxWidth: '240px' }}>
                        {org.statusReason}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      {org.status === 'active' ? (
                        <button
                          onClick={() => setSuspendingOrgId(org.id)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '0.8rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="Suspend organisation access"
                        >
                          <Pause size={13} />
                          <span>Suspend</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivate(org.id)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="Reactivate organisation"
                        >
                          <Play size={13} />
                          <span>Reactivate</span>
                        </button>
                      )}

                      <Link
                        to={`/org/${org.slug}/dashboard`}
                        className="btn btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                      >
                        Open Workspace
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Suspension Modal */}
      {suspendingOrgId && (
        <div className="modal-overlay" onClick={() => setSuspendingOrgId(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', color: '#ef4444' }}>
              <AlertTriangle size={24} />
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Suspend Organisation Access</h3>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
              Suspending this organisation will immediately lock out all tenant members and display an access-restricted banner. Provide an administrative audit reason:
            </p>
            <textarea
              className="input-field"
              rows={3}
              placeholder="e.g. Terms of Service violation, payment delinquency, or requested audit lockout..."
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              style={{ width: '100%', marginBottom: '16px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn btn-secondary" onClick={() => setSuspendingOrgId(null)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                style={{ background: '#ef4444', borderColor: '#ef4444' }}
                onClick={handleConfirmSuspend}
                disabled={!suspendReason.trim()}
              >
                Confirm Suspension
              </button>
            </div>
          </div>
        </div>
      )}
    </PlatformAdminLayout>
  );
};
