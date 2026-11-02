import React from 'react';
import { Download } from 'lucide-react';
import { OrgLayout } from './OrgLayout';
import { useTenant } from '../../context/TenantContext';

export const OrgActivityPage: React.FC = () => {
  const { activeOrg, auditLogs, exportOrgData } = useTenant();

  return (
    <OrgLayout activeNav="activity">
      <div className="org-page-view">
        <div className="page-header-row">
          <div>
            <h1 className="page-heading">Audit & Activity Log</h1>
            <p className="page-subheading">
              Chronological security telemetry and operational audit stream for <strong>{activeOrg.name}</strong>.
            </p>
          </div>

          <button
            className="secondary-btn"
            onClick={exportOrgData}
          >
            <Download size={15} />
            <span>Export Audit Logs (JSON)</span>
          </button>
        </div>

        <div className="members-table-card">
          <div className="members-table-header">
            <h3 style={{ margin: 0, fontSize: '0.95rem' }}>Audit Event Stream ({auditLogs.length})</h3>
          </div>

          <div className="dash-activity-timeline" style={{ padding: '1rem 1.25rem' }}>
            {auditLogs.map((log) => (
              <div key={log.id} className="dash-timeline-item" style={{ paddingBottom: '1.25rem' }}>
                <div className="timeline-dot" style={{ background: 'var(--accent-blue)' }} />
                <div className="timeline-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="timeline-actor">
                      <strong style={{ color: 'var(--text-primary)' }}>{log.actorName}</strong>
                      <span className="badge-pill badge-neutral" style={{ fontFamily: 'monospace', fontSize: '0.72rem', marginLeft: '6px' }}>
                        {log.action}
                      </span>
                    </div>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {JSON.stringify(log.metadata)}
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'right', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <div>{new Date(log.createdAt).toLocaleDateString()}</div>
                    <div>{new Date(log.createdAt).toLocaleTimeString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </OrgLayout>
  );
};
