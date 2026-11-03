import React from 'react';
import {
  LayoutDashboard,
  Layers,
  Kanban,
  Users,
  Bell,
  Settings,
  Shield,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { Link, useNavigate, useRouter } from '../../router/Router';
import { Header } from '../Header';
import { useTenant } from '../../context/TenantContext';
import { SuspendedTenantBanner } from '../SuspendedTenantBanner';
import { OrganisationAdminPortal } from '../OrganisationAdminPortal';
import { PlatformAdminPortal } from '../PlatformAdminPortal';
import { OnboardingModal } from '../OnboardingModal';
import { SupabaseModal } from '../SupabaseModal';
import { CreateWorkspaceModal } from '../CreateWorkspaceModal';
import { OrgJoinCodeModal } from '../OrgJoinCodeModal';
import { Sidebar as BoardsDrawer } from '../Sidebar';
import { CardModal } from '../CardModal';
import { FilterModal } from '../FilterModal';
import { NewBoardModal } from '../NewBoardModal';
import { BackgroundPickerModal } from '../BackgroundPickerModal';
import { ShortcutsModal } from '../ShortcutsModal';
import { ChatWindow } from '../ChatWindow';
import { MobileBottomNav } from '../MobileBottomNav';

interface OrgLayoutProps {
  children: React.ReactNode;
  activeNav?: 'dashboard' | 'workspaces' | 'boards' | 'tasks' | 'members' | 'activity' | 'notifications' | 'settings';
}

export const OrgLayout: React.FC<OrgLayoutProps> = ({ children, activeNav = 'dashboard' }) => {
  const { currentPath, searchParams } = useRouter();
  const navigate = useNavigate();
  const {
    activeOrg,
    isAdmin,
    isPlatformAdmin,
    isSupabaseModalOpen,
    setIsSupabaseModalOpen,
    setIsCreateWorkspaceOpen,
    workspaces,
    activeWorkspaceId,
    setActiveWorkspaceId,
  } = useTenant();

  const orgSlug = activeOrg.slug || 'acme-corp';

  return (
    <div className="org-app-container">
      {/* Top Application Header */}
      <Header />

      <div className="org-app-body">
        {/* Persistent Left Navigation Sidebar */}
        <aside className="org-nav-sidebar">
          <div className="org-sidebar-header">
            <div className="sidebar-org-pill" onClick={() => navigate(`/org/${orgSlug}/settings`)}>
              <div
                className="org-color-dot"
                style={{ backgroundColor: activeOrg.primaryColor || '#3b82f6' }}
              />
              <span className="sidebar-org-name">{activeOrg.name}</span>
            </div>
          </div>

          <nav className="org-sidebar-nav">
            <div className="sidebar-section-label">Organisation</div>

            <Link
              to={`/org/${orgSlug}/dashboard`}
              className={`org-sidebar-link ${currentPath.endsWith('/dashboard') || activeNav === 'dashboard' ? 'active' : ''}`}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Link
                to={`/org/${orgSlug}/workspaces`}
                className={`org-sidebar-link ${currentPath.includes('/workspaces') || activeNav === 'workspaces' ? 'active' : ''}`}
                style={{ flex: 1 }}
              >
                <Layers size={18} />
                <span>Workspaces</span>
              </Link>
              <button
                type="button"
                className="icon-button"
                style={{ width: '28px', height: '28px', marginRight: '6px' }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsCreateWorkspaceOpen(true);
                }}
                title="Create Workspace"
              >
                <Plus size={15} />
              </button>
            </div>

            {/* Workspaces Sub-navigation */}
            {workspaces.length > 0 && (
              <div style={{ paddingLeft: '8px', marginBottom: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {workspaces.map((ws) => {
                  const isWsActive =
                    (searchParams.get('workspace') === ws.id) ||
                    (!searchParams.get('workspace') && currentPath.includes('/boards') && activeWorkspaceId === ws.id);

                  return (
                    <button
                      key={ws.id}
                      type="button"
                      className={`org-sidebar-sublink ${isWsActive ? 'active' : ''}`}
                      onClick={() => {
                        setActiveWorkspaceId(ws.id);
                        navigate(`/org/${orgSlug}/boards?workspace=${ws.id}`);
                      }}
                      title={`Open ${ws.name} workspace boards`}
                    >
                      <span className="sublink-dot" />
                      <span className="sublink-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ws.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <Link
              to={`/org/${orgSlug}/boards`}
              className={`org-sidebar-link ${currentPath.includes('/boards') || activeNav === 'boards' ? 'active' : ''}`}
            >
              <Kanban size={18} />
              <span>Boards</span>
            </Link>

            <Link
              to={`/org/${orgSlug}/members`}
              className={`org-sidebar-link ${currentPath.includes('/members') || activeNav === 'members' ? 'active' : ''}`}
            >
              <Users size={18} />
              <span>Members & Teams</span>
            </Link>

            <Link
              to={`/org/${orgSlug}/notifications`}
              className={`org-sidebar-link ${currentPath.includes('/notifications') || activeNav === 'notifications' ? 'active' : ''}`}
            >
              <Bell size={18} />
              <span>Notifications</span>
            </Link>

            <div className="sidebar-section-label" style={{ marginTop: '1rem' }}>Preferences</div>

            {isAdmin && (
              <Link
                to={`/org/${orgSlug}/settings`}
                className={`org-sidebar-link ${currentPath.includes('/settings') || activeNav === 'settings' ? 'active' : ''}`}
              >
                <Settings size={18} />
                <span>Organisation Settings</span>
              </Link>
            )}

            {isPlatformAdmin && (
              <Link
                to="/platform-admin/dashboard"
                className="org-sidebar-link platform-link"
              >
                <Shield size={18} />
                <span>Platform Super-Admin</span>
                <ExternalLink size={12} style={{ marginLeft: 'auto' }} />
              </Link>
            )}
          </nav>
        </aside>

        {/* Main Routed Content Area */}
        <main className="org-main-content">
          {children}
        </main>
      </div>

      {/* Lockouts & Modals */}
      <SuspendedTenantBanner />
      <OrganisationAdminPortal />
      <PlatformAdminPortal />
      <OnboardingModal />
      <CreateWorkspaceModal />
      <OrgJoinCodeModal />
      <SupabaseModal isOpen={isSupabaseModalOpen} onClose={() => setIsSupabaseModalOpen(false)} />

      {/* Kanban Modals */}
      <BoardsDrawer />
      <CardModal />
      <FilterModal />
      <NewBoardModal />
      <BackgroundPickerModal />
      <ShortcutsModal />
      <ChatWindow />

      {/* Mobile Experience */}
      <MobileBottomNav />
    </div>
  );
};
