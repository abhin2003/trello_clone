import React, { useState, useEffect } from 'react';
import { useBoard } from '../context/BoardContext';
import { useTenant } from '../context/TenantContext';
import { useNavigate } from '../router/Router';
import { BACKGROUND_PRESETS } from '../data/initialData';
import { X, Plus, Check, Layers } from 'lucide-react';

export const NewBoardModal: React.FC = () => {
  const navigate = useNavigate();
  const { isNewBoardOpen, setIsNewBoardOpen, createBoard } = useBoard();
  const { workspaces, activeWorkspaceId, setActiveWorkspaceId, activeOrg } = useTenant();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedBg, setSelectedBg] = useState(BACKGROUND_PRESETS[0]);
  const [selectedWsId, setSelectedWsId] = useState<string>(
    activeWorkspaceId || workspaces[0]?.id || ''
  );

  useEffect(() => {
    if (isNewBoardOpen) {
      if (activeWorkspaceId && workspaces.some((w) => w.id === activeWorkspaceId)) {
        setSelectedWsId(activeWorkspaceId);
      } else if (workspaces[0]?.id) {
        setSelectedWsId(workspaces[0].id);
      }
    }
  }, [isNewBoardOpen, activeWorkspaceId, workspaces]);

  if (!isNewBoardOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const newBoardId = createBoard(title, selectedBg, description, selectedWsId);
      if (selectedWsId) {
        setActiveWorkspaceId(selectedWsId);
      }
      setTitle('');
      setDescription('');
      setIsNewBoardOpen(false);
      const orgSlug = activeOrg?.slug || activeOrg?.id || 'my-org';
      navigate(`/org/${orgSlug}/boards/${newBoardId}`);
    } catch {
      // Quota warning handled by context
    }
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={() => setIsNewBoardOpen(false)}>
      <div className="new-board-dialog animate-scale-up" onClick={(e) => e.stopPropagation()}>
        <div className="modal-dialog-header">
          <h3>Create Board</h3>
          <button
            className="icon-button close-btn"
            onClick={() => setIsNewBoardOpen(false)}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="dialog-body">
          {/* Live Preview Card */}
          <div
            className="board-create-preview"
            style={{ background: selectedBg.value }}
          >
            <div className="preview-mini-columns">
              <div className="preview-mini-col" />
              <div className="preview-mini-col" />
              <div className="preview-mini-col" />
            </div>
            <span className="preview-title-text">{title || 'Board Title Preview'}</span>
          </div>

          {/* Background selector */}
          <div className="form-group">
            <label className="form-label">Background Theme</label>
            <div className="bg-presets-grid">
              {BACKGROUND_PRESETS.map((preset, idx) => (
                <div
                  key={idx}
                  className={`bg-preset-box ${selectedBg.name === preset.name ? 'selected' : ''}`}
                  style={{ background: preset.value }}
                  onClick={() => setSelectedBg(preset)}
                  title={preset.name}
                >
                  {selectedBg.name === preset.name && (
                    <Check size={16} className="bg-check-icon" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Workspace Selector */}
          <div className="form-group">
            <label className="form-label">
              <span className="flex-align">
                <Layers size={14} className="mr-1 text-blue" />
                Target Workspace ({activeOrg.name})
              </span>
            </label>
            <select
              className="form-input"
              value={selectedWsId}
              onChange={(e) => setSelectedWsId(e.target.value)}
            >
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.name} ({ws.visibility})
                </option>
              ))}
            </select>
          </div>

          {/* Board Title Input */}
          <div className="form-group">
            <label className="form-label">Board Title *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., Q1 Product Strategy, Client Delivery..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Description Input */}
          <div className="form-group">
            <label className="form-label">Description (Optional)</label>
            <textarea
              className="form-textarea"
              placeholder="Summarize the goals and workflows of this board..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="dialog-footer">
            <button
              type="button"
              className="secondary-btn"
              onClick={() => setIsNewBoardOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="primary-btn" disabled={!title.trim()}>
              <Plus size={16} />
              <span>Create Board</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
