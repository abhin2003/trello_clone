import React, { useState, useEffect, useRef } from 'react';
import { useBoard } from '../context/BoardContext';
import { useTenant } from '../context/TenantContext';
import { useNavigate, useRouter } from '../router/Router';
import { Trash2, Edit3, X, AlertTriangle } from 'lucide-react';

export const BoardActionModals: React.FC = () => {
  const {
    boardToRename,
    setBoardToRename,
    boardToDelete,
    setBoardToDelete,
    renameBoard,
    deleteBoard,
  } = useBoard();
  const { activeOrg } = useTenant();
  const navigate = useNavigate();
  const { currentPath } = useRouter();

  const orgSlug = activeOrg?.slug || activeOrg?.id || 'my-org';

  // Rename State
  const [renameTitle, setRenameTitle] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (boardToRename) {
      setRenameTitle(boardToRename.title);
      setTimeout(() => {
        renameInputRef.current?.focus();
        renameInputRef.current?.select();
      }, 50);
    }
  }, [boardToRename]);

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!boardToRename || !renameTitle.trim()) return;
    renameBoard(boardToRename.id, renameTitle.trim());
    setBoardToRename(null);
  };

  const handleDeleteConfirm = () => {
    if (!boardToDelete) return;
    const deletedId = boardToDelete.id;
    deleteBoard(deletedId);
    setBoardToDelete(null);

    // If currently viewing the deleted board, redirect to boards list
    if (currentPath.includes(`/boards/${deletedId}`)) {
      navigate(`/org/${orgSlug}/boards`);
    }
  };

  return (
    <>
      {/* 1. Rename Board Modal */}
      {boardToRename && (
        <div
          className="modal-backdrop animate-fade-in"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
          onClick={() => setBoardToRename(null)}
        >
          <div
            className="modal-container animate-scale-up"
            style={{
              background: 'var(--bg-card, #1e293b)',
              border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '440px',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(59, 130, 246, 0.15)',
                    color: '#60a5fa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Edit3 size={18} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary, #f8fafc)' }}>
                  Rename Board
                </h3>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setBoardToRename(null)}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRenameSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary, #94a3b8)',
                    marginBottom: '8px',
                  }}
                >
                  Board Title
                </label>
                <input
                  ref={renameInputRef}
                  type="text"
                  className="form-input"
                  value={renameTitle}
                  onChange={(e) => setRenameTitle(e.target.value)}
                  placeholder="Enter board title..."
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '0.95rem',
                    borderRadius: '8px',
                    background: 'var(--bg-app, #0f172a)',
                    border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.15))',
                    color: 'var(--text-primary, #f8fafc)',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setBoardToRename(null)}
                  style={{ padding: '8px 16px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-cta-btn"
                  disabled={!renameTitle.trim()}
                  style={{ padding: '8px 18px' }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Delete Board Confirmation Modal */}
      {boardToDelete && (
        <div
          className="modal-backdrop animate-fade-in"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
          onClick={() => setBoardToDelete(null)}
        >
          <div
            className="modal-container animate-scale-up"
            style={{
              background: 'var(--bg-card, #1e293b)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '440px',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.7)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary, #f8fafc)' }}>
                  Delete Board
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#ef4444', fontWeight: 500 }}>
                  This action cannot be undone
                </p>
              </div>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.5, margin: '0 0 20px 0' }}>
              Are you sure you want to delete <strong style={{ color: '#fff' }}>"{boardToDelete.title}"</strong>? All lists, cards, checklists, and activities on this board will be permanently removed.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setBoardToDelete(null)}
                style={{ padding: '8px 16px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                style={{
                  padding: '8px 18px',
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Trash2 size={15} />
                <span>Delete Board</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

