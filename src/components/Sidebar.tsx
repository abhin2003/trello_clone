import React from 'react';
import { useBoard } from '../context/BoardContext';
import { useTenant } from '../context/TenantContext';
import { useNavigate } from '../router/Router';
import {
  X,
  Star,
  Plus,
  Trash2,
  Users,
  LayoutDashboard,
  MessageSquare,
  Building2,
  UserPlus,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const {
    boards,
    activeBoardId,
    setActiveBoardId,
    deleteBoard,
    toggleStarBoard,
    isSidebarOpen,
    setIsSidebarOpen,
    setIsNewBoardOpen,
    openChat,
  } = useBoard();

  const {
    activeOrg,
    workspaces,
    members,
    isAdmin,
    setIsOrgAdminOpen,
  } = useTenant();

  const orgSlug = activeOrg?.slug || 'acme-corp';

  if (!isSidebarOpen) return null;

  const starredBoards = boards.filter((b) => b.isStarred);

  return (
    <div className="sidebar-overlay animate-fade-in" onClick={() => setIsSidebarOpen(false)}>
      <aside className="sidebar-drawer animate-slide-right" onClick={(e) => e.stopPropagation()}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div
              className="brand-logo-icon"
              style={{ backgroundColor: activeOrg.primaryColor || '#3b82f6' }}
            >
              <Building2 size={18} />
            </div>
            <div>
              <h2 className="sidebar-title">{activeOrg.name}</h2>
              <p className="sidebar-subtitle">
                {workspaces.length} Workspaces • {members.length} Members
              </p>
            </div>
          </div>
          <button
            className="icon-button close-btn"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="sidebar-content">
          {/* Starred Boards */}
          {starredBoards.length > 0 && (
            <div className="sidebar-section">
              <div className="section-title">
                <Star size={14} className="star-icon filled" />
                <span>Starred Boards</span>
              </div>
              <div className="boards-list">
                {starredBoards.map((board) => (
                  <div
                    key={`star-${board.id}`}
                    className={`sidebar-board-item ${board.id === activeBoardId ? 'active' : ''}`}
                    onClick={() => {
                      setActiveBoardId(board.id);
                      setIsSidebarOpen(false);
                      navigate(`/org/${orgSlug}/boards/${board.id}`);
                    }}
                  >
                    <div
                      className="board-thumbnail"
                      style={{ background: board.background.value }}
                    />
                    <span className="board-name">{board.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Boards */}
          <div className="sidebar-section">
            <div className="section-title-row">
              <div className="section-title">
                <LayoutDashboard size={14} />
                <span>Your Boards ({boards.length})</span>
              </div>
              <button
                className="section-add-btn"
                onClick={() => {
                  setIsSidebarOpen(false);
                  setIsNewBoardOpen(true);
                }}
                title="Create Board"
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="boards-list">
              {boards.map((board) => (
                <div
                  key={board.id}
                  className={`sidebar-board-item ${board.id === activeBoardId ? 'active' : ''}`}
                  onClick={() => {
                    setActiveBoardId(board.id);
                    setIsSidebarOpen(false);
                    navigate(`/org/${orgSlug}/boards/${board.id}`);
                  }}
                >
                  <div
                    className="board-thumbnail"
                    style={{ background: board.background.value }}
                  />
                  <div className="board-info">
                    <span className="board-name">{board.title}</span>
                    <span className="board-meta">{board.lists.length} lists</span>
                  </div>

                  <div className="board-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      className={`star-subtle ${board.isStarred ? 'starred' : ''}`}
                      onClick={() => toggleStarBoard(board.id)}
                      title="Star board"
                    >
                      <Star size={14} />
                    </button>
                    {boards.length > 1 && (
                      <button
                        className="delete-subtle"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete board "${board.title}"?`)) {
                            deleteBoard(board.id);
                          }
                        }}
                        title="Delete board"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Members */}
          <div className="sidebar-section">
            <div className="section-title-row">
              <div className="section-title">
                <Users size={14} />
                <span>Team Members ({members.length})</span>
              </div>
              {isAdmin && (
                <button
                  className="section-add-btn"
                  onClick={() => {
                    setIsSidebarOpen(false);
                    setIsOrgAdminOpen(true);
                  }}
                  title="Invite or Manage Members"
                >
                  <UserPlus size={15} />
                </button>
              )}
            </div>

            <div className="members-compact-list">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="member-row interactive-member"
                  onClick={() => openChat(member.userId)}
                  title={`Open direct chat with ${member.user.name}`}
                >
                  <div className="member-avatar-wrapper">
                    <div
                      className="member-avatar"
                      style={{ backgroundColor: member.user.avatarColor || '#3b82f6' }}
                    >
                      {member.user.initials || member.user.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="online-indicator" />
                  </div>
                  <div className="member-meta">
                    <span className="member-name">
                      {member.user.name} {member.userId === 'user-abhinav-current' ? '(You)' : ''}
                    </span>
                    <span className="member-role">
                      <span className="badge-role-subtle">{member.role.toUpperCase()}</span>
                      {member.jobTitle ? ` • ${member.jobTitle}` : ''}
                    </span>
                  </div>
                  <div className="member-chat-badge">
                    <MessageSquare size={13} />
                    <span>Chat</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="enterprise-badge">
            <span className="status-dot" />
            <span>Stratcrest Flow v1.0 • Connected</span>
          </div>
        </div>
      </aside>
    </div>
  );
};
