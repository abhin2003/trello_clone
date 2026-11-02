import React, { useState, useMemo } from 'react';
import { PlatformAdminLayout } from './PlatformAdminLayout';
import { tenantService } from '../../services/tenantService';
import { Search, Shield, Building2 } from 'lucide-react';
import { Link } from '../../router/Router';

export const PlatformAdminUsersPage: React.FC = () => {
  const [search, setSearch] = useState('');

  const organisations = useMemo(() => tenantService.getAllOrganisations(), []);

  // Aggregate users from tenantService memberships
  const usersWithOrgs = useMemo(() => {
    const memberMap = new Map<string, {
      userId: string;
      email: string;
      name: string;
      initials: string;
      avatarColor: string;
      isPlatformAdmin?: boolean;
      orgs: Array<{ orgId: string; orgName: string; orgSlug: string; role: string }>;
    }>();

    // Iterate through organisations and their members
    organisations.forEach((org) => {
      const members = tenantService.getOrganisationMembers(org.id);
      members.forEach((m) => {
        const email = m.user?.email || m.userId;
        const name = m.user?.name || email;
        const initials = m.user?.initials || name.slice(0, 2).toUpperCase();
        const avatarColor = m.user?.avatarColor || '#3b82f6';
        const isPlatformAdmin = m.user?.isPlatformAdmin || false;

        if (!memberMap.has(email)) {
          memberMap.set(email, {
            userId: m.userId,
            email,
            name,
            initials,
            avatarColor,
            isPlatformAdmin,
            orgs: [],
          });
        }

        const entry = memberMap.get(email)!;
        entry.orgs.push({
          orgId: org.id,
          orgName: org.name,
          orgSlug: org.slug,
          role: m.role,
        });
      });
    });

    return Array.from(memberMap.values());
  }, [organisations]);

  const filteredUsers = usersWithOrgs.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.orgs.some((o) => o.orgName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <PlatformAdminLayout
      title="Platform Users Directory"
      subtitle="Cross-tenant identity registry, multi-organisation memberships, and administrative privilege verification"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search users by name, email or organisation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '36px', width: '100%' }}
          />
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Showing <strong>{filteredUsers.length}</strong> registered identities
        </div>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle, rgba(255,255,255,0.03))', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>User Identity</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Email Address</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Privilege Level</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Associated Organisations & Roles</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.email} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: user.avatarColor || '#3b82f6',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.84rem',
                        }}
                      >
                        {user.initials}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                          ID: {user.userId}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '0.84rem' }}>
                    {user.email}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    {user.isPlatformAdmin ? (
                      <span className="badge-pill badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Shield size={12} />
                        <span>Platform Admin</span>
                      </span>
                    ) : (
                      <span className="badge-pill badge-active">Tenant User</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {user.orgs.map((o) => (
                        <Link
                          key={o.orgId}
                          to={`/org/${o.orgSlug}/dashboard`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: 'var(--bg-subtle, rgba(255,255,255,0.05))',
                            border: '1px solid var(--border-subtle)',
                            fontSize: '0.75rem',
                            textDecoration: 'none',
                            color: 'var(--text-primary)',
                          }}
                        >
                          <Building2 size={12} style={{ color: '#3b82f6' }} />
                          <span>{o.orgName}</span>
                          <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>({o.role})</span>
                        </Link>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PlatformAdminLayout>
  );
};
