import React, { useEffect } from 'react';
import { OrgLayout } from './OrgLayout';
import { BoardView } from '../BoardView';
import { useBoard } from '../../context/BoardContext';
import { useTenant } from '../../context/TenantContext';
import { useNavigate } from '../../router/Router';
import { AlertCircle, ArrowLeft } from 'lucide-react';

interface OrgBoardDetailPageProps {
  boardId: string;
}

export const OrgBoardDetailPage: React.FC<OrgBoardDetailPageProps> = ({ boardId }) => {
  const navigate = useNavigate();
  const { boards, activeBoardId, setActiveBoardId } = useBoard();
  const { activeOrg } = useTenant();

  const orgSlug = activeOrg.slug || 'acme-corp';

  // Synchronize boardId from URL with BoardContext
  useEffect(() => {
    if (boardId && boardId !== activeBoardId) {
      const match = boards.find((b) => b.id === boardId);
      if (match) {
        setActiveBoardId(boardId);
      }
    }
  }, [boardId, activeBoardId, boards, setActiveBoardId]);

  const targetBoard = boards.find((b) => b.id === boardId);

  // If board does not exist or belongs to another tenant
  if (!targetBoard) {
    return (
      <OrgLayout activeNav="boards">
        <div className="org-error-page">
          <div className="error-card-box">
            <AlertCircle size={44} color="#ef4444" style={{ margin: '0 auto 1rem auto' }} />
            <h2 style={{ margin: '0 0 8px 0', fontSize: '1.4rem' }}>Board Not Found</h2>
            <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              The requested board (<code>{boardId}</code>) could not be found in organisation{' '}
              <strong>{activeOrg.name}</strong>.
            </p>
            <button
              className="primary-cta-btn"
              onClick={() => navigate(`/org/${orgSlug}/boards`)}
            >
              <ArrowLeft size={16} />
              <span>Back to Boards</span>
            </button>
          </div>
        </div>
      </OrgLayout>
    );
  }

  return (
    <OrgLayout activeNav="boards">
      <div className="board-detail-container" style={{ height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column' }}>
        <BoardView />
      </div>
    </OrgLayout>
  );
};
