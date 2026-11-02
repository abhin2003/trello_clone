import React, { useState, useMemo } from 'react';
import { PlatformAdminLayout } from './PlatformAdminLayout';
import { tenantService } from '../../services/tenantService';
import { Search, Copy, Check, XCircle } from 'lucide-react';

export const PlatformAdminInvitesPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const invitations = useMemo(() => {
    return tenantService.getAllInvitations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  const organisations = useMemo(() => {
    return tenantService.getAllOrganisations();
  }, []);

  const orgMap = useMemo(() => new Map(organisations.map((o) => [o.id, o])), [organisations]);

  const filteredInvites = invitations.filter(
    (inv) =>
      inv.email.toLowerCase().includes(search.toLowerCase()) ||
      inv.token.toLowerCase().includes(search.toLowerCase()) ||
      (orgMap.get(inv.organisationId)?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleCopy = (token: string) => {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const handleRevoke = (inviteId: string) => {
    tenantService.revokeInvitation(inviteId);
    setVersion((v) => v + 1);
  };

  return (
    <PlatformAdminLayout
      title="Platform Invitation Registry"
      subtitle="Monitor onboarding invitations across all organisations, token life-cycles, and revoke access"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search invitations by email, token, or organisation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '36px', width: '100%' }}
          />
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Showing <strong>{filteredInvites.length}</strong> invitation tokens
        </div>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle, rgba(255,255,255,0.03))', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Recipient Email</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Target Organisation</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Role</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Token</th>
                <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvites.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                    No invitations found matching query.
                  </td>
                </tr>
              ) : (
                filteredInvites.map((inv) => {
                  const org = orgMap.get(inv.organisationId);
                  const isPending = inv.status === 'pending';
                  return (
                    <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '14px 20px', fontWeight: 500, color: 'var(--text-primary)' }}>
                        {inv.email}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{org?.name || inv.organisationId}</span>
                        {org && <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginLeft: '6px' }}>({org.slug})</span>}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span className="badge-pill badge-primary" style={{ textTransform: 'capitalize', fontSize: '0.74rem' }}>
                          {inv.role}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span
                          className={`badge-pill ${
                            inv.status === 'accepted'
                              ? 'badge-active'
                              : inv.status === 'pending'
                              ? 'badge-warning'
                              : 'badge-danger'
                          }`}
                          style={{ textTransform: 'capitalize' }}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {inv.token.slice(0, 16)}...
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          {isPending && (
                            <>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => handleCopy(inv.token)}
                                style={{ padding: '6px 10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                title="Copy invitation link"
                              >
                                {copiedToken === inv.token ? <Check size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
                                <span>{copiedToken === inv.token ? 'Copied' : 'Copy Link'}</span>
                              </button>

                              <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => handleRevoke(inv.id)}
                                style={{ padding: '6px 10px', fontSize: '0.8rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}
                                title="Revoke token"
                              >
                                <XCircle size={13} />
                                <span>Revoke</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PlatformAdminLayout>
  );
};
