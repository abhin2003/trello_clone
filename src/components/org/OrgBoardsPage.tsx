import React, { useState } from 'react';
import {
  Kanban,
  Star,
  Plus,
} from 'lucide-react';
import { OrgLayout } from './OrgLayout';
import { useBoard } from '../../context/BoardContext';
import { useTenant } from '../../context/TenantContext';
import { useNavigate } from '../../router/Router';

export const OrgBoardsPage: React.FC = () => {
  const navigate = useNavigate();
  const { boards, setActiveBoardId, setIsNewBoardOpen, toggleStarBoard } = useBoard();
  const { activeOrg, workspaces } = useTenant();

  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('all');
  const orgSlug = activeOrg.slug || 'acme-corp';

  const filteredBoards = selectedWorkspace === 'all'
    ? boards
    : boards.filter((b) => b.workspaceId === selectedWorkspace);

  const starredBoards = filteredBoards.filter((b) => b.isStarred);
  const regularBoards = filteredBoards.filter((b) => !b.isStarred);

  return (
    <OrgLayout activeNav="boards">
      <div className="org-page-view">
        <div className="page-header-row">
          <div>
            <h1 className="page-heading">Kanban Boards</h1>
            <p className="page-subheading">
              Visual sprint backlogs, project roadmaps, and delivery pipelines in <strong>{activeOrg.name}</strong>.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              className="form-input"
              style={{ width: 'auto', fontSize: '0.85rem' }}
              value={selectedWorkspace}
              onChange={(e) => setSelectedWorkspace(e.target.value)}
            >
              <option value="all">All Workspaces ({boards.length})</option>
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.name}
                </option>
              ))}
            </select>

            <button
              className="primary-cta-btn"
              onClick={() => setIsNewBoardOpen(true)}
            >
              <Plus size={16} />
              <span>New Board</span>
            </button>
          </div>
        </div>

        {/* Starred Boards */}
        {starredBoards.length > 0 && (
          <div className="boards-group-section" style={{ marginBottom: '2rem' }}>
            <div className="boards-group-title">
              <Star size={16} fill="#f59e0b" color="#f59e0b" />
              <span>Starred Boards ({starredBoards.length})</span>
            </div>

            <div className="boards-cards-grid">
              {starredBoards.map((b) => (
                <div
                  key={b.id}
                  className="board-tile"
                  style={{ background: b.background.value }}
                  onClick={() => {
                    setActiveBoardId(b.id);
                    navigate(`/org/${orgSlug}/boards/${b.id}`);
                  }}
                >
                  <div className="board-tile-header">
                    <span className="board-tile-title">{b.title}</span>
                    <button
                      type="button"
                      className="star-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStarBoard(b.id);
                      }}
                    >
                      <Star size={16} fill="#f59e0b" color="#f59e0b" />
                    </button>
                  </div>
                  <div className="board-tile-footer">
                    <span>{b.lists?.length || 0} Lists</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Regular Boards */}
        <div className="boards-group-section">
          <div className="boards-group-title">
            <Kanban size={16} color="var(--accent-blue)" />
            <span>All Organisation Boards ({filteredBoards.length})</span>
          </div>

          <div className="boards-cards-grid">
            {regularBoards.map((b) => (
              <div
                key={b.id}
                className="board-tile"
                style={{ background: b.background.value }}
                onClick={() => {
                  setActiveBoardId(b.id);
                  navigate(`/org/${orgSlug}/boards/${b.id}`);
                }}
              >
                <div className="board-tile-header">
                  <span className="board-tile-title">{b.title}</span>
                  <button
                    type="button"
                    className="star-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStarBoard(b.id);
                    }}
                  >
                    <Star size={16} color="rgba(255,255,255,0.7)" />
                  </button>
                </div>
                <div className="board-tile-footer">
                  <span>{b.lists?.length || 0} Lists</span>
                </div>
              </div>
            ))}

            <button
              type="button"
              className="create-board-tile-btn"
              onClick={() => setIsNewBoardOpen(true)}
            >
              <Plus size={22} />
              <span>Create new board</span>
            </button>
          </div>
        </div>
      </div>
    </OrgLayout>
  );
};
