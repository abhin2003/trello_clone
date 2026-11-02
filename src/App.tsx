import React from 'react';
import { TenantProvider } from './context/TenantContext';
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
import { useTenant } from './context/TenantContext';

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

export default function App() {
  return (
    <TenantProvider>
      <BoardProvider>
        <AppContent />
      </BoardProvider>
    </TenantProvider>
  );
}

