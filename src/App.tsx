import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TenantProvider, useTenant } from './context/TenantContext';
import { BoardProvider } from './context/BoardContext';
import { Header } from './components/Header';
import { BoardView } from './components/BoardView';
import { Sidebar } from './components/Sidebar';
import { CardModal } from './components/CardModal';
import { FilterModal } from './components/FilterModal';
import { NewBoardModal } from './components/NewBoardModal';
import { BackgroundPickerModal } from './components/BackgroundPickerModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { ChatWindow } from './components/ChatWindow';
import { OrganisationAdminPortal } from './components/OrganisationAdminPortal';
import { PlatformAdminPortal } from './components/PlatformAdminPortal';
import { OnboardingModal } from './components/OnboardingModal';
import { PlanUpgradeModal } from './components/PlanUpgradeModal';
import { SuspendedTenantBanner } from './components/SuspendedTenantBanner';
import { SupabaseModal } from './components/SupabaseModal';

// Auth Screen Components
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { ForgotPasswordPage } from './components/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './components/auth/ResetPasswordPage';
import { SelectOrganisationPage } from './components/auth/SelectOrganisationPage';
import { NoOrganisationPage } from './components/auth/NoOrganisationPage';
import { Kanban, RefreshCw } from 'lucide-react';

export const AppContent: React.FC = () => {
  const { isSupabaseModalOpen, setIsSupabaseModalOpen } = useTenant();

  return (
    <div className="app-layout">
      <Header />
      <div className="app-workspace">
        <BoardView />
      </div>

      {/* Tenant Security Lockout Overlay */}
      <SuspendedTenantBanner />

      {/* SaaS Portals & Onboarding Modals */}
      <OrganisationAdminPortal />
      <PlatformAdminPortal />
      <OnboardingModal />
      <PlanUpgradeModal />
      <SupabaseModal isOpen={isSupabaseModalOpen} onClose={() => setIsSupabaseModalOpen(false)} />

      {/* Kanban Modals & Overlays */}
      <Sidebar />
      <CardModal />
      <FilterModal />
      <NewBoardModal />
      <BackgroundPickerModal />
      <ShortcutsModal />
      <ChatWindow />
    </div>
  );
};

export const AuthenticatedAppRouter: React.FC = () => {
  const { authScreen, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-box">
          <div className="brand-logo-icon" style={{ width: '56px', height: '56px', borderRadius: '14px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Kanban size={32} />
          </div>
          <h2 style={{ margin: '1rem 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 700 }}>Stratcrest Flow</h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            <RefreshCw size={15} className="spin-animation" />
            <span>Authenticating with Supabase...</span>
          </div>
        </div>
      </div>
    );
  }

  switch (authScreen) {
    case 'login':
      return <LoginPage />;
    case 'register':
      return <RegisterPage />;
    case 'forgot_password':
      return <ForgotPasswordPage />;
    case 'reset_password':
      return <ResetPasswordPage />;
    case 'select_org':
      return <SelectOrganisationPage />;
    case 'no_org':
      return <NoOrganisationPage />;
    case 'authenticated':
      return (
        <TenantProvider>
          <BoardProvider>
            <AppContent />
          </BoardProvider>
        </TenantProvider>
      );
    default:
      return <LoginPage />;
  }
};

export default function App() {
  return (
    <AuthProvider>
      <AuthenticatedAppRouter />
    </AuthProvider>
  );
}
