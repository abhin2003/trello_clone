import React from 'react';
import {
  LayoutDashboard,
  Layers,
  Kanban,
  Users,
  MessageSquare,
  Settings,
} from 'lucide-react';
import { useRouter, useNavigate } from '../router/Router';
import { useTenant } from '../context/TenantContext';
import { useBoard } from '../context/BoardContext';

export const MobileBottomNav: React.FC = () => {
  const { currentPath } = useRouter();
  const navigate = useNavigate();
  const { activeOrg, members, isAdmin } = useTenant();
  const { openChat, closeChat, activeChatMemberId } = useBoard();

  const orgSlug = activeOrg?.slug || 'acme-corp';

  const isDashboard = currentPath.endsWith('/dashboard');
  const isWorkspaces = currentPath.includes('/workspaces');
  const isBoards = currentPath.includes('/boards');
  const isMembers = currentPath.includes('/members');
  const isSettings = currentPath.includes('/settings');
  const isChatActive = Boolean(activeChatMemberId);

  const handleChatClick = () => {
    if (activeChatMemberId) {
      closeChat();
    } else {
      const firstTeammate = members[0]?.userId || members[0]?.id;
      if (firstTeammate) {
        openChat(firstTeammate);
      } else {
        navigate(`/org/${orgSlug}/members`);
      }
    }
  };

  return (
    <nav className="mobile-bottom-nav">
      <button
        type="button"
        className={`mobile-nav-item ${isDashboard ? 'active' : ''}`}
        onClick={() => navigate(`/org/${orgSlug}/dashboard`)}
      >
        <LayoutDashboard size={20} />
        <span>Home</span>
      </button>

      <button
        type="button"
        className={`mobile-nav-item ${isWorkspaces ? 'active' : ''}`}
        onClick={() => navigate(`/org/${orgSlug}/workspaces`)}
      >
        <Layers size={20} />
        <span>Spaces</span>
      </button>

      <button
        type="button"
        className={`mobile-nav-item ${isBoards ? 'active' : ''}`}
        onClick={() => navigate(`/org/${orgSlug}/boards`)}
      >
        <Kanban size={20} />
        <span>Boards</span>
      </button>

      <button
        type="button"
        className={`mobile-nav-item ${isMembers ? 'active' : ''}`}
        onClick={() => navigate(`/org/${orgSlug}/members`)}
      >
        <Users size={20} />
        <span>Team</span>
      </button>

      <button
        type="button"
        className={`mobile-nav-item ${isChatActive ? 'active' : ''}`}
        onClick={handleChatClick}
      >
        <MessageSquare size={20} />
        <span>Chat</span>
      </button>

      {isAdmin && (
        <button
          type="button"
          className={`mobile-nav-item ${isSettings ? 'active' : ''}`}
          onClick={() => navigate(`/org/${orgSlug}/settings`)}
        >
          <Settings size={20} />
          <span>Settings</span>
        </button>
      )}
    </nav>
  );
};
