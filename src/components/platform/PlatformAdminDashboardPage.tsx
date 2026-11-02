import React, { useMemo } from 'react';
import { PlatformAdminLayout } from './PlatformAdminLayout';
import { tenantService } from '../../services/tenantService';
import { Building2, Users, HardDrive, AlertOctagon, Plus, ArrowRight, Activity } from 'lucide-react';
import { Link } from '../../router/Router';

export const PlatformAdminDashboardPage: React.FC = () => {
  const organisations = useMemo(() => tenantService.getAllOrganisations(), []);
  const platformLogs = useMemo(() => tenantService.getPlatformAuditLogs(), []);
  const supportSessions = useMemo(() => tenantService.getSupportSessions(), []);

  const totalMembers = organisations.reduce((sum, o) => sum + o.memberCount, 0);
  const totalStorageBytes = organisations.reduce((sum, o) => sum + o.usedStorageBytes, 0);
  const activeOrgs = organisations.filter((o) => o.status === 'active');
  const suspendedOrgs = organisations.filter((o) => o.status === 'suspended');

  const formatBytes = (bytes: number) => {
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
    return (bytes / 1024).toFixed(0) + ' KB';
  };

  return (
    <PlatformAdminLayout
      title="Platform Operations Dashboard"
      subtitle="Real-time multi-tenant health, provisioning metrics, and platform telemetry"
    >
      {/* Top Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Tenants</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>{organisations.length}</div>
            <div style={{ fontSize: '0.78rem', color: '#10b981' }}>{activeOrgs.length} active • {suspendedOrgs.length} suspended</div>
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Platform Users</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>{totalMembers}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Across all organisations</div>
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HardDrive size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Storage Footprint</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>{formatBytes(totalStorageBytes)}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Database & attachments</div>
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertOctagon size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Support Sessions</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>{supportSessions.length}</div>
            <div style={{ fontSize: '0.78rem', color: supportSessions.length > 0 ? '#f59e0b' : '#10b981' }}>
              {supportSessions.length > 0 ? 'Break-glass active' : 'Zero elevated sessions'}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Banner */}
      <div
        className="card"
        style={{
          padding: '20px 24px',
          marginBottom: '28px',
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(15, 23, 42, 0.6))',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
            Provision a New Organisation Tenant
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            Instantly spin up an isolated enterprise or starter organisation with customized billing quotas.
          </p>
        </div>
        <Link
          to="/platform-admin/organizations/create"
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={16} />
          <span>Provision Tenant</span>
        </Link>
      </div>

      {/* Grid: Tenant Status Summary & Audit Stream */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
        {/* Recent Organisations Table */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={18} style={{ color: '#3b82f6' }} />
              <span>Organisations Overview</span>
            </h3>
            <Link to="/platform-admin/organizations" className="auth-link" style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>View All</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {organisations.slice(0, 5).map((org) => (
              <div
                key={org.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: 'var(--bg-subtle, rgba(255,255,255,0.03))',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: org.primaryColor || '#3b82f6',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                    }}
                  >
                    {org.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{org.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>slug: {org.slug} • {org.memberCount} members</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    className={`badge-pill ${org.status === 'active' ? 'badge-active' : 'badge-danger'}`}
                    style={{ fontSize: '0.72rem', textTransform: 'capitalize' }}
                  >
                    {org.status}
                  </span>
                  <span className="badge-pill badge-primary" style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>
                    {org.planId}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Audit Stream */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} style={{ color: '#10b981' }} />
              <span>Platform Audit Stream</span>
            </h3>
            <span className="badge-pill badge-active" style={{ fontSize: '0.72rem' }}>Live Stream</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '380px', overflowY: 'auto' }}>
            {platformLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                No platform audit records yet.
              </div>
            ) : (
              platformLogs.slice(0, 8).map((log) => (
                <div
                  key={log.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '6px',
                    background: 'var(--bg-subtle, rgba(255,255,255,0.02))',
                    borderLeft: '3px solid #3b82f6',
                    fontSize: '0.84rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{log.action}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                    {log.metadata ? JSON.stringify(log.metadata).slice(0, 80) : 'System event logged.'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </PlatformAdminLayout>
  );
};
