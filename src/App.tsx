import React, { useEffect } from 'react';
import { RouterProvider, useRouter, matchRoute, useNavigate } from './router/Router';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TenantProvider, useTenant } from './context/TenantContext';
import { BoardProvider } from './context/BoardContext';
import { tenantService } from './services/tenantService';

// Public Pages
import { LandingPage } from './components/public/LandingPage';
import { InviteClaimPage } from './components/public/InviteClaimPage';

// Authentication Pages
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { ForgotPasswordPage } from './components/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './components/auth/ResetPasswordPage';
import { VerifyEmailPage } from './components/auth/VerifyEmailPage';
import { SelectOrganisationPage } from './components/auth/SelectOrganisationPage';
import { NoOrganisationPage } from './components/auth/NoOrganisationPage';

// Organisation Scoped Pages
import { OrgDashboardPage } from './components/org/OrgDashboardPage';
import { OrgWorkspacesPage } from './components/org/OrgWorkspacesPage';
import { OrgBoardsPage } from './components/org/OrgBoardsPage';
import { OrgBoardDetailPage } from './components/org/OrgBoardDetailPage';
import { OrgMembersPage } from './components/org/OrgMembersPage';
import { OrgNotificationsPage } from './components/org/OrgNotificationsPage';
import { OrgSettingsPage } from './components/org/OrgSettingsPage';
import { OrgSuspendedPage } from './components/org/OrgSuspendedPage';

// Platform Admin Pages
import { PlatformAdminDashboardPage } from './components/platform/PlatformAdminDashboardPage';
import { PlatformAdminOrgsPage } from './components/platform/PlatformAdminOrgsPage';
import { PlatformAdminCreateOrgPage } from './components/platform/PlatformAdminCreateOrgPage';
import { PlatformAdminUsersPage } from './components/platform/PlatformAdminUsersPage';
import { PlatformAdminInvitesPage } from './components/platform/PlatformAdminInvitesPage';
import { PlatformAdminSettingsPage } from './components/platform/PlatformAdminSettingsPage';

// Error Pages
import { NotFoundPage } from './components/errors/NotFoundPage';
import { AccessDeniedPage } from './components/errors/AccessDeniedPage';
import { ServerErrorPage } from './components/errors/ServerErrorPage';

import { Kanban, RefreshCw } from 'lucide-react';

export const AppRouter: React.FC = () => {
  const { currentPath, searchParams } = useRouter();
  const navigate = useNavigate();
  const { session, userProfile, memberships, loading, joinWithCode, refreshMemberships } = useAuth();
  const { refreshTenantState } = useTenant();

  // Helper: compute destination after authentication
  const getAuthenticatedDefaultDestination = (): string => {
    if (userProfile?.isPlatformAdmin) {
      return '/platform-admin/dashboard';
    }
    if (memberships.length === 0) {
      return '/onboarding';
    }
    if (memberships.length === 1) {
      return `/org/${memberships[0].organisation.slug}/dashboard`;
    }
    return '/organizations/select';
  };

  // Redirect away from login/register if already authenticated & handle direct invite codes
  useEffect(() => {
    if (!loading && session) {
      const codeParam = searchParams.get('code');
      if (codeParam && (currentPath === '/login' || currentPath === '/register' || currentPath === '/')) {
        // Authenticated user opened an invite link with ?code=
        joinWithCode(codeParam)
          .then((res) => {
            if (res.success && res.organisation) {
              refreshTenantState();
              navigate(`/org/${res.organisation.slug}/dashboard`, { replace: true });
            } else {
              navigate(getAuthenticatedDefaultDestination(), { replace: true });
            }
          })
          .catch(() => {
            navigate(getAuthenticatedDefaultDestination(), { replace: true });
          });
        return;
      }

      if (currentPath === '/login' || currentPath === '/register') {
        const redirectParam = searchParams.get('redirect');
        if (redirectParam && redirectParam !== '/login' && redirectParam !== '/register') {
          navigate(redirectParam, { replace: true });
        } else {
          navigate(getAuthenticatedDefaultDestination(), { replace: true });
        }
      }
    }
  }, [loading, session, currentPath, searchParams, navigate, memberships, userProfile]);

  if (loading) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-box">
          <div
            className="brand-logo-icon"
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Kanban size={32} />
          </div>
          <h2 style={{ margin: '1rem 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 700 }}>Stratcrest Flow</h2>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              color: 'var(--text-secondary)',
              fontSize: '0.88rem',
            }}
          >
            <RefreshCw size={15} className="spin-animation" />
            <span>Verifying session with Supabase...</span>
          </div>
        </div>
      </div>
    );
  }

  // 1. PUBLIC LANDING PAGE
  if (currentPath === '/' || currentPath === '') {
    return <LandingPage />;
  }

  // 2. AUTHENTICATION PAGES
  if (currentPath === '/login') {
    return <LoginPage />;
  }
  if (currentPath === '/register') {
    return <RegisterPage />;
  }
  if (currentPath === '/forgot-password') {
    return <ForgotPasswordPage />;
  }
  if (currentPath === '/reset-password') {
    return <ResetPasswordPage />;
  }
  if (currentPath === '/verify-email') {
    return <VerifyEmailPage />;
  }

  // 3. INVITATION ACCEPTANCE LINK: /invite/:token
  const inviteMatch = matchRoute('/invite/:token', currentPath);
  if (inviteMatch.matches) {
    return <InviteClaimPage token={inviteMatch.params.token} />;
  }

  // 4. ONBOARDING & ORG SELECTION
  if (currentPath === '/onboarding') {
    if (!session) {
      navigate(`/login?redirect=/onboarding`, { replace: true });
      return null;
    }
    return <NoOrganisationPage />;
  }

  if (currentPath === '/organizations/select' || currentPath === '/organizations') {
    if (!session) {
      navigate(`/login?redirect=/organizations/select`, { replace: true });
      return null;
    }
    return <SelectOrganisationPage />;
  }

  // 5. PLATFORM ADMIN ROUTES (/platform-admin/...)
  if (currentPath.startsWith('/platform-admin')) {
    if (!session) {
      navigate(`/login?redirect=${encodeURIComponent(currentPath)}`, { replace: true });
      return null;
    }

    if (!userProfile?.isPlatformAdmin) {
      return (
        <AccessDeniedPage
          message="Platform Administration Console is restricted to designated platform administrators."
          reason="Your account does not have platform-level governance permissions."
        />
      );
    }

    if (currentPath === '/platform-admin' || currentPath === '/platform-admin/dashboard') {
      return <PlatformAdminDashboardPage />;
    }
    if (currentPath === '/platform-admin/organizations') {
      return <PlatformAdminOrgsPage />;
    }
    if (currentPath === '/platform-admin/organizations/create') {
      return <PlatformAdminCreateOrgPage />;
    }
    if (currentPath === '/platform-admin/users') {
      return <PlatformAdminUsersPage />;
    }
    if (currentPath === '/platform-admin/invitations') {
      return <PlatformAdminInvitesPage />;
    }
    if (currentPath === '/platform-admin/settings') {
      return <PlatformAdminSettingsPage />;
    }

    return <NotFoundPage />;
  }

  // 6. ORGANISATION ROUTES (/org/:orgSlug/...)
  if (currentPath.startsWith('/org/')) {
    if (!session) {
      navigate(`/login?redirect=${encodeURIComponent(currentPath)}`, { replace: true });
      return null;
    }

    // Extract orgSlug: /org/:orgSlug/...
    const segments = currentPath.split('/').filter(Boolean); // ['org', ':orgSlug', ...]
    const orgSlug = segments[1];

    if (!orgSlug) {
      navigate('/organizations/select', { replace: true });
      return null;
    }

    // Resolve organisation from tenant service or user memberships
    const allKnownOrgs = tenantService.getAllOrganisations();
    const matchedOrg = allKnownOrgs.find((o) => o.slug === orgSlug) ||
      memberships.find((m) => m.organisation.slug === orgSlug)?.organisation;

    if (!matchedOrg) {
      return <NotFoundPage />;
    }

    // Access control: User must belong to this org OR be a platform admin
    const isMemberInTenant = Boolean(tenantService.getCurrentUserRole(matchedOrg.id));
    let userHasMembership = memberships.some(
      (m) => m.organisation.id === matchedOrg.id || m.organisation.slug === orgSlug
    ) || isMemberInTenant;
    const isPlatformAdmin = Boolean(userProfile?.isPlatformAdmin);

    // If not a member yet, check if a valid join code was provided in URL (?code=...)
    const codeParam = searchParams.get('code');
    if (!userHasMembership && codeParam) {
      const cleanParam = codeParam.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      const orgCode = (matchedOrg.joinCode || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (cleanParam && cleanParam === orgCode) {
        tenantService.joinWithCode(codeParam);
        refreshMemberships();
        refreshTenantState();
        userHasMembership = true;
      }
    }

    if (!userHasMembership && !isPlatformAdmin) {
      return (
        <AccessDeniedPage
          orgSlug={orgSlug}
          orgName={matchedOrg.name}
          message={`You do not have access to organisation "${matchedOrg.name}".`}
          reason="Your authenticated account is not registered as an active member of this tenant."
        />
      );
    }

    // Set active organisation in tenantService
    if (tenantService.getActiveOrgId() !== matchedOrg.id) {
      tenantService.setActiveOrgId(matchedOrg.id, matchedOrg);
      refreshTenantState();
    }

    // Check suspended state
    const subRoute = segments[2] || 'dashboard';
    if (matchedOrg.status === 'suspended' && subRoute !== 'suspended') {
      return <OrgSuspendedPage />;
    }

    // Match organisation sub-routes
    if (subRoute === 'dashboard') {
      return <OrgDashboardPage />;
    }
    if (subRoute === 'workspaces') {
      return <OrgWorkspacesPage />;
    }
    if (subRoute === 'boards') {
      // Check if board detail: /org/:orgSlug/boards/:boardId
      const boardId = segments[3];
      if (boardId) {
        return <OrgBoardDetailPage boardId={boardId} />;
      }
      return <OrgBoardsPage />;
    }
    if (subRoute === 'members') {
      return <OrgMembersPage />;
    }
    if (subRoute === 'activity') {
      // Audit page removed; navigate to dashboard
      navigate(`/org/${orgSlug}/dashboard`, { replace: true });
      return null;
    }
    if (subRoute === 'notifications') {
      return <OrgNotificationsPage />;
    }
    if (subRoute === 'settings') {
      // Permission check: only owners/admins or platform admins
      const roleInOrg = memberships.find((m) => m.organisation.id === matchedOrg.id)?.role;
      const canManage = roleInOrg === 'owner' || roleInOrg === 'admin' || isPlatformAdmin;
      if (!canManage) {
        return (
          <AccessDeniedPage
            message="Restricted Settings Access"
            reason="Only organisation Owners and Admins are authorized to view and modify organisation settings."
          />
        );
      }
      return <OrgSettingsPage />;
    }
    if (subRoute === 'suspended') {
      return <OrgSuspendedPage />;
    }

    return <NotFoundPage />;
  }

  // 7. DEDICATED ERROR ROUTES
  if (currentPath === '/404') {
    return <NotFoundPage />;
  }
  if (currentPath === '/403') {
    return <AccessDeniedPage />;
  }
  if (currentPath === '/500') {
    return <ServerErrorPage />;
  }

  // 8. DEFAULT FALLBACK
  return <NotFoundPage />;
};

export default function App() {
  return (
    <RouterProvider>
      <AuthProvider>
        <TenantProvider>
          <BoardProvider>
            <AppRouter />
          </BoardProvider>
        </TenantProvider>
      </AuthProvider>
    </RouterProvider>
  );
}
