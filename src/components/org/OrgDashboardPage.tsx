import React from 'react';
import {
  Kanban,
  Layers,
  Users,
  Clock,
  Plus,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Activity,
  Calendar,
  Star,
} from 'lucide-react';
import { OrgLayout } from './OrgLayout';
import { useBoard } from '../../context/BoardContext';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from '../../router/Router';

export const OrgDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { boards, setActiveBoardId, setIsNewBoardOpen } = useBoard();
  const { activeOrg, members, workspaces, auditLogs, setIsOrgAdminOpen } = useTenant();
  const { userProfile } = useAuth();

  const orgSlug = activeOrg.slug || 'acme-corp';

  // Extract tasks assigned to current user or with due dates
  const myTasks: { boardId: string; boardTitle: string; cardTitle: string; dueDate?: string; isDone: boolean }[] = [];

  boards.forEach((b) => {
    if (b.cards) {
      Object.values(b.cards).forEach((c) => {
        if (c.dueDate || c.members.includes(userProfile?.id || '')) {
          myTasks.push({
            boardId: b.id,
            boardTitle: b.title,
            cardTitle: c.title,
            dueDate: c.dueDate,
            isDone: Boolean(c.dueComplete),
          });
        }
      });
    }
  });

  return (
    <OrgLayout activeNav="dashboard">
      <div className="org-dashboard-view">
        {/* Welcome Header */}
        <div className="dashboard-welcome-header">
          <div>
            <h1 className="dashboard-title">
              Welcome back, {userProfile?.name || 'Team Member'} 👋
            </h1>
            <p className="dashboard-subtitle">
              Here is what is happening across <strong>{activeOrg.name}</strong> today.
            </p>
          </div>

          <div className="dashboard-quick-actions">
            <button
              className="primary-cta-btn"
              onClick={() => setIsNewBoardOpen(true)}
            >
              <Plus size={16} />
              <span>Create Board</span>
            </button>
            <button
              className="secondary-btn"
              onClick={() => setIsOrgAdminOpen(true)}
            >
              <Users size={16} />
              <span>Invite Team</span>
            </button>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="dashboard-metrics-grid">
          <div className="dash-metric-card" onClick={() => navigate(`/org/${orgSlug}/boards`)}>
            <div className="dash-metric-icon" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
              <Kanban size={20} />
            </div>
            <div>
              <div className="dash-metric-number">{boards.length}</div>
              <div className="dash-metric-label">Active Boards</div>
            </div>
          </div>

          <div className="dash-metric-card" onClick={() => navigate(`/org/${orgSlug}/workspaces`)}>
            <div className="dash-metric-icon" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' }}>
              <Layers size={20} />
            </div>
            <div>
              <div className="dash-metric-number">{workspaces.length}</div>
              <div className="dash-metric-label">Team Workspaces</div>
            </div>
          </div>

          <div className="dash-metric-card" onClick={() => navigate(`/org/${orgSlug}/members`)}>
            <div className="dash-metric-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <Users size={20} />
            </div>
            <div>
              <div className="dash-metric-number">{members.length}</div>
              <div className="dash-metric-label">Organisation Members</div>
            </div>
          </div>

          <div className="dash-metric-card" onClick={() => navigate(`/org/${orgSlug}/settings`)}>
            <div className="dash-metric-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <Clock size={20} />
            </div>
            <div>
              <div className="dash-metric-number" style={{ textTransform: 'capitalize' }}>{activeOrg.planId.replace('_', ' ')}</div>
              <div className="dash-metric-label">Subscription Tier</div>
            </div>
          </div>
        </div>

        {/* Main 2-Column Section */}
        <div className="dashboard-content-grid">
          {/* Left Column: Recent Boards & My Tasks */}
          <div className="dash-left-col">
            {/* Recent Boards */}
            <div className="dash-section-box">
              <div className="dash-section-header">
                <div className="dash-header-title">
                  <Kanban size={18} color="var(--accent-blue)" />
                  <h3>Recent Boards</h3>
                </div>
                <Link to={`/org/${orgSlug}/boards`} className="dash-header-link">
                  <span>View all ({boards.length})</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              <div className="recent-boards-grid">
                {boards.slice(0, 4).map((board) => (
                  <div
                    key={board.id}
                    className="dash-board-card"
                    style={{ background: board.background.value }}
                    onClick={() => {
                      setActiveBoardId(board.id);
                      navigate(`/org/${orgSlug}/boards/${board.id}`);
                    }}
                  >
                    <div className="dash-board-card-inner">
                      <span className="dash-board-title">{board.title}</span>
                      {board.isStarred && <Star size={14} fill="#f59e0b" color="#f59e0b" />}
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  className="dash-create-board-tile"
                  onClick={() => setIsNewBoardOpen(true)}
                >
                  <Plus size={20} />
                  <span>Create new board</span>
                </button>
              </div>
            </div>

            {/* My Tasks with Due Dates */}
            <div className="dash-section-box" style={{ marginTop: '1.5rem' }}>
              <div className="dash-section-header">
                <div className="dash-header-title">
                  <Calendar size={18} color="var(--accent-emerald)" />
                  <h3>My Tasks & Due Dates</h3>
                </div>
              </div>

              {myTasks.length === 0 ? (
                <div className="dash-empty-state">
                  <CheckCircle2 size={32} color="#10b981" />
                  <p>You have no pending deadlines or assigned tasks.</p>
                </div>
              ) : (
                <div className="dash-tasks-list">
                  {myTasks.slice(0, 6).map((task, idx) => (
                    <div
                      key={idx}
                      className="dash-task-row"
                      onClick={() => {
                        setActiveBoardId(task.boardId);
                        navigate(`/org/${orgSlug}/boards/${task.boardId}`);
                      }}
                    >
                      <div className="dash-task-left">
                        {task.isDone ? (
                          <CheckCircle2 size={16} color="#10b981" />
                        ) : (
                          <AlertCircle size={16} color="#f59e0b" />
                        )}
                        <span className="dash-task-name">{task.cardTitle}</span>
                      </div>
                      <div className="dash-task-right">
                        <span className="dash-task-board">{task.boardTitle}</span>
                        {task.dueDate && (
                          <span className="dash-task-due">
                            {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Recent Activity Feed */}
          <div className="dash-right-col">
            <div className="dash-section-box">
              <div className="dash-section-header">
                <div className="dash-header-title">
                  <Activity size={18} color="var(--accent-purple)" />
                  <h3>Recent Organisation Activity</h3>
                </div>
                <Link to={`/org/${orgSlug}/activity`} className="dash-header-link">
                  <span>Audit stream</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              <div className="dash-activity-timeline">
                {auditLogs.slice(0, 6).map((log) => (
                  <div key={log.id} className="dash-timeline-item">
                    <div className="timeline-dot" />
                    <div className="timeline-content">
                      <div className="timeline-actor">
                        <strong>{log.actorName}</strong>
                        <span className="timeline-action">{log.action.replace('.', ' ')}</span>
                      </div>
                      <div className="timeline-time">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </OrgLayout>
  );
};
