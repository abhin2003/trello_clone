import React, { useState, useEffect } from 'react';
import {
  Kanban,
  Star,
  Plus,
  Layers,
  Globe,
  Lock,
  FolderKanban,
  ArrowLeft,
  Trash2,
  Edit3,
} from 'lucide-react';
import { OrgLayout } from './OrgLayout';
import { useBoard } from '../../context/BoardContext';
import { useTenant } from '../../context/TenantContext';
import { useNavigate, useRouter } from '../../router/Router';

export const OrgBoardsPage: React.FC = () => {
  const navigate = useNavigate();
  const { searchParams } = useRouter();
  const {
    boards,
    setActiveBoardId,
    setIsNewBoardOpen,
    toggleStarBoard,
    setBoardToRename,
    setBoardToDelete,
  } = useBoard();
  const { activeOrg, workspaces, activeWorkspaceId, setActiveWorkspaceId } = useTenant();

  const workspaceParam = searchParams.get('workspace');
  const orgSlug = activeOrg.slug || 'acme-corp';

  // Determine initial selected workspace from URL param or active context
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>(() => {
    if (workspaceParam && workspaces.some((w) => w.id === workspaceParam)) {
      return workspaceParam;
    }
    if (activeWorkspaceId && workspaces.some((w) => w.id === activeWorkspaceId)) {
      return activeWorkspaceId;
    }
    return 'all';
  });

  // Keep state in sync with URL changes
  useEffect(() => {
    if (workspaceParam && workspaces.some((w) => w.id === workspaceParam)) {
      setSelectedWorkspace(workspaceParam);
      setActiveWorkspaceId(workspaceParam);
    } else if (workspaceParam === null && selectedWorkspace !== 'all') {
      // If user navigated directly to /boards without workspace query
      // but activeWorkspaceId is set, sync it if desired
    }
  }, [workspaceParam, workspaces, setActiveWorkspaceId]);

  const currentWorkspace = workspaces.find((w) => w.id === selectedWorkspace);

  // Filter boards strictly by active workspace or all
  const filteredBoards = selectedWorkspace === 'all'
    ? boards
    : boards.filter((b) => b.workspaceId === selectedWorkspace);

  const starredBoards = filteredBoards.filter((b) => b.isStarred);
  const regularBoards = filteredBoards.filter((b) => !b.isStarred);

  const handleWorkspaceChange = (val: string) => {
    setSelectedWorkspace(val);
    if (val !== 'all') {
      setActiveWorkspaceId(val);
      navigate(`/org/${orgSlug}/boards?workspace=${val}`);
    } else {
      navigate(`/org/${orgSlug}/boards`);
    }
  };

  const handleOpenNewBoard = () => {
    if (selectedWorkspace !== 'all') {
      setActiveWorkspaceId(selectedWorkspace);
    }
    setIsNewBoardOpen(true);
  };

  return (
    <OrgLayout activeNav="boards">
      <div className="org-page-view">
        <div className="page-header-row">
          <div>
            <h1 className="page-heading">
              {currentWorkspace ? `${currentWorkspace.name} Boards` : 'Kanban Boards'}
            </h1>
            <p className="page-subheading">
              {currentWorkspace
                ? (currentWorkspace.description || `Viewing boards in the ${currentWorkspace.name} workspace.`)
                : `Visual sprint backlogs, project roadmaps, and delivery pipelines in ${activeOrg.name}.`}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              className="form-input"
              style={{ width: 'auto', fontSize: '0.85rem' }}
              value={selectedWorkspace}
              onChange={(e) => handleWorkspaceChange(e.target.value)}
            >
              <option value="all">All Workspaces ({boards.length})</option>
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.name} ({boards.filter((b) => b.workspaceId === ws.id).length})
                </option>
              ))}
            </select>

            <button
              className="primary-cta-btn"
              onClick={handleOpenNewBoard}
            >
              <Plus size={16} />
              <span>New Board</span>
            </button>
          </div>
        </div>

        {/* Workspace Active Header Banner (if a specific workspace is selected) */}
        {currentWorkspace && (
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '14px 18px',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(59, 130, 246, 0.12)',
                  color: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Layers size={18} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{currentWorkspace.name}</span>
                  <span className="badge-pill badge-neutral" style={{ fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    {currentWorkspace.visibility === 'private' ? <Lock size={10} /> : <Globe size={10} />}
                    {currentWorkspace.visibility}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    • {filteredBoards.length} {filteredBoards.length === 1 ? 'board' : 'boards'}
                  </span>
                </div>
                {currentWorkspace.description && (
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {currentWorkspace.description}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              className="secondary-btn"
              style={{ fontSize: '0.78rem', padding: '6px 12px' }}
              onClick={() => handleWorkspaceChange('all')}
            >
              <ArrowLeft size={13} />
              <span>Show All Workspaces</span>
            </button>
          </div>
        )}

        {/* Empty State for a workspace with 0 boards */}
        {filteredBoards.length === 0 ? (
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px dashed var(--border-strong)',
              borderRadius: '16px',
              padding: '48px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              margin: '1.5rem 0',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                background: 'rgba(59, 130, 246, 0.12)',
                color: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FolderKanban size={28} />
            </div>

            <h3 style={{ margin: '4px 0 0 0', fontSize: '1.15rem', fontWeight: 600 }}>
              {currentWorkspace
                ? `No Boards in "${currentWorkspace.name}" Yet`
                : 'No Boards Created Yet'}
            </h3>

            <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)', maxWidth: '440px', lineHeight: 1.5 }}>
              {currentWorkspace
                ? `This workspace has 0 boards. Create a new board to start planning tasks and tracking progress for ${currentWorkspace.name}.`
                : 'Create your first Kanban board to start organizing sprints and collaborating with your team.'}
            </p>

            <button
              type="button"
              className="primary-cta-btn"
              style={{ marginTop: '8px' }}
              onClick={handleOpenNewBoard}
            >
              <Plus size={16} />
              <span>Create Board in {currentWorkspace ? currentWorkspace.name : 'Workspace'}</span>
            </button>
          </div>
        ) : (
          <>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <button
                            type="button"
                            className="board-action-icon-btn"
                            title="Rename Board"
                            onClick={(e) => {
                              e.stopPropagation();
                              setBoardToRename(b);
                            }}
                            style={{
                              background: 'rgba(0, 0, 0, 0.3)',
                              border: 'none',
                              borderRadius: '6px',
                              color: '#fff',
                              padding: '5px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            type="button"
                            className="board-action-icon-btn"
                            title="Delete Board"
                            onClick={(e) => {
                              e.stopPropagation();
                              setBoardToDelete(b);
                            }}
                            style={{
                              background: 'rgba(239, 68, 68, 0.4)',
                              border: 'none',
                              borderRadius: '6px',
                              color: '#fee2e2',
                              padding: '5px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
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
                <span>
                  {currentWorkspace
                    ? `${currentWorkspace.name} Boards (${filteredBoards.length})`
                    : `All Organisation Boards (${filteredBoards.length})`}
                </span>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <button
                          type="button"
                          className="board-action-icon-btn"
                          title="Rename Board"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBoardToRename(b);
                          }}
                          style={{
                            background: 'rgba(0, 0, 0, 0.3)',
                            border: 'none',
                            borderRadius: '6px',
                            color: '#fff',
                            padding: '5px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          type="button"
                          className="board-action-icon-btn"
                          title="Delete Board"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBoardToDelete(b);
                          }}
                          style={{
                            background: 'rgba(239, 68, 68, 0.4)',
                            border: 'none',
                            borderRadius: '6px',
                            color: '#fee2e2',
                            padding: '5px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
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
                    </div>
                    <div className="board-tile-footer">
                      <span>{b.lists?.length || 0} Lists</span>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  className="create-board-tile-btn"
                  onClick={handleOpenNewBoard}
                >
                  <Plus size={22} />
                  <span>Create new board</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </OrgLayout>
  );
};
