import React from 'react';
import { Shield, Building2, Users, Mail, Settings, LayoutDashboard, PlusCircle, ArrowLeft, LogOut } from 'lucide-react';
import { Link, useRouter } from '../../router/Router';
import { useAuth } from '../../context/AuthContext';
import { AccessDeniedPage } from '../errors/AccessDeniedPage';

interface PlatformAdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export const PlatformAdminLayout: React.FC<PlatformAdminLayoutProps> = ({
  children,
  title = 'Platform Administration Console',
  subtitle = 'Cross-Tenant Governance, Provisioning, Plan Limits & Operational Telemetry',
}) => {
  const { currentPath } = useRouter();
  const { userProfile, activeOrg, logout, session, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-box">
          <Shield size={32} style={{ color: '#3b82f6', margin: '0 auto' }} />
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Verifying administrative credentials...</p>
        </div>
      </div>
    );
  }

  // Route protection
  if (!session) {
    if (typeof window !== 'undefined') {
      window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
    }
    return null;
  }

  // Verify platform admin privileges
  const isPlatformAdmin = userProfile?.isPlatformAdmin;
  if (!isPlatformAdmin) {
    return (
      <AccessDeniedPage
        message="Platform Administration Console is restricted to designated platform administrators."
        reason="Your account does not have platform-level governance permissions."
      />
    );
  }

  const navItems = [
    { label: 'Dashboard', path: '/platform-admin/dashboard', icon: LayoutDashboard },
    { label: 'Organisations', path: '/platform-admin/organizations', icon: Building2 },
    { label: 'Create Organisation', path: '/platform-admin/organizations/create', icon: PlusCircle },
    { label: 'Users', path: '/platform-admin/users', icon: Users },
    { label: 'Invitations', path: '/platform-admin/invitations', icon: Mail },
    { label: 'Plans & Governance', path: '/platform-admin/settings', icon: Settings },
  ];

  const exitTarget = activeOrg ? `/org/${activeOrg.slug}/dashboard` : '/organizations/select';

  return (
    <div className="app-layout" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-main, #0f172a)' }}>
      {/* Platform Header */}
      <header className="portal-header platform-header-bg" style={{ borderBottom: '1px solid rgba(59, 130, 246, 0.25)' }}>
        <div className="portal-header-left">
          <div className="portal-brand-avatar platform-brand-avatar">
            <Shield size={22} />
          </div>
          <div>
            <div className="portal-title-row">
              <h1 className="portal-title" style={{ fontSize: '1.25rem', margin: 0 }}>
                {title}
              </h1>
              <span className="super-admin-badge">SUPER-ADMIN CONSOLE</span>
            </div>
            <p className="portal-subtitle" style={{ margin: 0 }}>{subtitle}</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link
            to={exitTarget}
            className="btn btn-secondary"
            style={{ fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={15} />
            <span>Exit to Workspace</span>
          </Link>

          <button
            onClick={logout}
            className="btn btn-secondary"
            title="Sign out of administrative session"
            style={{ fontSize: '0.84rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Navigation tabs */}
      <nav className="portal-tabs-nav" style={{ padding: '0 24px', background: 'rgba(15, 23, 42, 0.95)' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path || (item.path !== '/platform-admin/dashboard' && currentPath.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`portal-tab-btn ${isActive ? 'portal-tab-btn-active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                borderBottom: isActive ? '2px solid #3b82f6' : '2px solid transparent',
                color: isActive ? '#60a5fa' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 500,
                textDecoration: 'none',
              }}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '24px 32px', maxWidth: '1440px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {children}
      </main>
    </div>
  );
};
