import React from 'react';
import { CheckCircle2, Info, ShieldCheck } from 'lucide-react';
import { OrgLayout } from './OrgLayout';
import { useTenant } from '../../context/TenantContext';

export const OrgNotificationsPage: React.FC = () => {
  const { activeOrg } = useTenant();

  const mockNotifications = [
    {
      id: 'notif-1',
      title: 'Welcome to Stratcrest Flow',
      message: `Your organisation workspace "${activeOrg.name}" is fully provisioned with Row-Level Security.`,
      time: 'Just now',
      type: 'info',
    },
    {
      id: 'notif-2',
      title: 'Supabase Cloud Persistence Connected',
      message: 'Multi-tenant database triggers are actively enforcing board and member quotas.',
      time: '1 hour ago',
      type: 'success',
    },
    {
      id: 'notif-3',
      title: 'Subscription Plan Verified',
      message: `Current plan is ${activeOrg.planId.toUpperCase()} with full tenant isolation.`,
      time: '1 day ago',
      type: 'security',
    },
  ];

  return (
    <OrgLayout activeNav="notifications">
      <div className="org-page-view">
        <div className="page-header-row">
          <div>
            <h1 className="page-heading">Notifications</h1>
            <p className="page-subheading">
              System alerts, mentions, and subscription updates for <strong>{activeOrg.name}</strong>.
            </p>
          </div>
        </div>

        <div className="members-table-card">
          <div className="members-table-header">
            <h3 style={{ margin: 0, fontSize: '0.95rem' }}>Recent Notifications ({mockNotifications.length})</h3>
          </div>

          <div style={{ padding: '0.5rem 0' }}>
            {mockNotifications.map((n) => (
              <div key={n.id} className="notification-row" style={{ display: 'flex', gap: '14px', padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', alignItems: 'flex-start' }}>
                <div style={{ marginTop: '2px' }}>
                  {n.type === 'success' ? (
                    <CheckCircle2 size={18} color="#10b981" />
                  ) : n.type === 'security' ? (
                    <ShieldCheck size={18} color="#3ecf8e" />
                  ) : (
                    <Info size={18} color="var(--accent-blue)" />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{n.title}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{n.time}</span>
                  </div>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                    {n.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </OrgLayout>
  );
};
