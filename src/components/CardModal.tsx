import React, { useState } from 'react';
import { useBoard } from '../context/BoardContext';
import {
  X,
  CreditCard,
  AlignLeft,
  CheckSquare,
  Clock,
  Tag,
  User,
  MessageSquare,
  Trash2,
  CheckCircle2,
  Palette,
  Plus,
  Send,
} from 'lucide-react';

export const CardModal: React.FC = () => {
  const {
    activeBoard,
    activeCardId,
    closeCardModal,
    updateCard,
    deleteCard,
    moveCard,
    addChecklist,
    deleteChecklist,
    addChecklistItem,
    toggleChecklistItem,
    deleteChecklistItem,
    addComment,
    toggleCardLabel,
    addBoardLabel,
    toggleCardMember,
  } = useBoard();

  if (!activeCardId) return null;
  const card = activeBoard.cards[activeCardId];
  if (!card) return null;

  const list = activeBoard.lists.find((l) => l.id === card.listId);

  // Local state for editing
  const [title, setTitle] = useState(card.title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [description, setDescription] = useState(card.description || '');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  
  // Popover controls
  const [activePopover, setActivePopover] = useState<
    'none' | 'labels' | 'members' | 'dates' | 'cover' | 'checklist'
  >('none');
  const [newChecklistTitle, setNewChecklistTitle] = useState('Checklist');
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#3b82f6');
  const [activeChecklistInput, setActiveChecklistInput] = useState<string | null>(null);
  const [checklistItemText, setChecklistItemText] = useState('');

  const handleTitleBlur = () => {
    if (title.trim()) {
      updateCard(card.id, { title: title.trim() });
    } else {
      setTitle(card.title);
    }
    setIsEditingTitle(false);
  };

  const handleSaveDescription = () => {
    updateCard(card.id, { description: description.trim() });
    setIsEditingDesc(false);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    addComment(card.id, newCommentText);
    setNewCommentText('');
  };

  const handleCreateChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    addChecklist(card.id, newChecklistTitle || 'Checklist');
    setNewChecklistTitle('Checklist');
    setActivePopover('none');
  };

  const handleAddChecklistItem = (chkId: string) => {
    if (!checklistItemText.trim()) return;
    addChecklistItem(card.id, chkId, checklistItemText);
    setChecklistItemText('');
  };

  const handleCreateCustomLabel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabelName.trim()) return;
    addBoardLabel(newLabelName, newLabelColor);
    setNewLabelName('');
  };

  const COVER_PRESETS = [
    'linear-gradient(135deg, #1e3a8a, #3b82f6)',
    'linear-gradient(135deg, #064e3b, #10b981)',
    'linear-gradient(135deg, #831843, #f43f5e)',
    'linear-gradient(135deg, #7c2d12, #ea580c)',
    'linear-gradient(135deg, #312e81, #6366f1)',
    'linear-gradient(135deg, #18181b, #3f3f46)',
  ];

  return (
    <div className="modal-backdrop animate-fade-in" onClick={closeCardModal}>
      <div
        className="card-modal-container animate-scale-up"
        onClick={(e) => {
          e.stopPropagation();
          // Close popover if clicked outside popover
          if ((e.target as HTMLElement).closest('.popover-menu') === null &&
              (e.target as HTMLElement).closest('.sidebar-action-btn') === null) {
            setActivePopover('none');
          }
        }}
      >
        {/* Card Cover Banner if set */}
        {card.coverGradient && (
          <div
            className="modal-cover-banner"
            style={{ background: card.coverGradient }}
          >
            <button
              className="remove-cover-btn"
              onClick={() => updateCard(card.id, { coverGradient: undefined })}
              title="Remove Cover"
            >
              <Palette size={14} />
              <span>Remove Cover</span>
            </button>
          </div>
        )}

        <button
          className="modal-close-icon-btn"
          onClick={closeCardModal}
          title="Close modal (Esc)"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="card-modal-header">
          <div className="modal-header-icon">
            <CreditCard size={22} />
          </div>
          <div className="modal-header-info">
            {isEditingTitle ? (
              <input
                type="text"
                className="modal-title-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleBlur();
                  if (e.key === 'Escape') {
                    setTitle(card.title);
                    setIsEditingTitle(false);
                  }
                }}
                autoFocus
              />
            ) : (
              <h2
                className="modal-title"
                onClick={() => setIsEditingTitle(true)}
                title="Click to edit title"
              >
                {card.title}
              </h2>
            )}
            <p className="modal-subtitle">
              in list <span className="list-name-badge">{list?.title || 'Unknown List'}</span>
            </p>
          </div>
        </div>

        {/* Modal Main Grid */}
        <div className="card-modal-body">
          {/* Left Column: Details */}
          <div className="card-modal-main">
            {/* Badges Strip (Members, Labels, Due Date) */}
            <div className="modal-badges-strip">
              {/* Assigned Members */}
              {card.members.length > 0 && (
                <div className="badge-group">
                  <span className="badge-group-title">Members</span>
                  <div className="members-pills">
                    {card.members.map((mId) => {
                      const m = activeBoard.members.find((mem) => mem.id === mId);
                      if (!m) return null;
                      return (
                        <div
                          key={m.id}
                          className="member-avatar-chip"
                          style={{ backgroundColor: m.avatarColor }}
                          title={m.name}
                        >
                          {m.initials}
                        </div>
                      );
                    })}
                    <button
                      className="add-subtle-circle"
                      onClick={() => setActivePopover('members')}
                      title="Add member"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Labels */}
              {card.labels.length > 0 && (
                <div className="badge-group">
                  <span className="badge-group-title">Labels</span>
                  <div className="labels-pills">
                    {card.labels.map((lId) => {
                      const l = activeBoard.labels.find((lbl) => lbl.id === lId);
                      if (!l) return null;
                      return (
                        <span
                          key={l.id}
                          className="card-label-chip interactive"
                          style={{ backgroundColor: l.color, color: l.textColor || '#fff' }}
                          onClick={() => toggleCardLabel(card.id, l.id)}
                          title="Click to remove"
                        >
                          {l.name}
                        </span>
                      );
                    })}
                    <button
                      className="add-subtle-circle"
                      onClick={() => setActivePopover('labels')}
                      title="Add label"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Due Date */}
              {card.dueDate && (
                <div className="badge-group">
                  <span className="badge-group-title">Due date</span>
                  <div
                    className={`modal-due-pill ${card.dueComplete ? 'complete' : ''}`}
                    onClick={() => updateCard(card.id, { dueComplete: !card.dueComplete })}
                  >
                    <input
                      type="checkbox"
                      checked={!!card.dueComplete}
                      onChange={() => updateCard(card.id, { dueComplete: !card.dueComplete })}
                    />
                    <span>
                      {new Date(card.dueDate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {card.dueComplete && <span className="status-badge-complete">Completed</span>}
                  </div>
                </div>
              )}
            </div>

            {/* Description Section */}
            <div className="modal-section">
              <div className="section-header">
                <AlignLeft size={20} />
                <h3>Description</h3>
                {!isEditingDesc && card.description && (
                  <button
                    className="secondary-btn-sm"
                    onClick={() => setIsEditingDesc(true)}
                  >
                    Edit
                  </button>
                )}
              </div>

              {isEditingDesc || !card.description ? (
                <div className="description-editor">
                  <textarea
                    className="description-textarea"
                    placeholder="Add a more detailed description (Markdown supported)..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    autoFocus={isEditingDesc}
                  />
                  <div className="editor-controls">
                    <button className="primary-btn-sm" onClick={handleSaveDescription}>
                      Save
                    </button>
                    <button
                      className="secondary-btn-sm"
                      onClick={() => {
                        setDescription(card.description || '');
                        setIsEditingDesc(false);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="description-rendered"
                  onClick={() => setIsEditingDesc(true)}
                  title="Click to edit description"
                >
                  <p>{card.description}</p>
                </div>
              )}
            </div>

            {/* Checklists Section */}
            {card.checklists.map((chk) => {
              const total = chk.items.length;
              const completed = chk.items.filter((it) => it.completed).length;
              const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

              return (
                <div key={chk.id} className="modal-section checklist-section">
                  <div className="section-header">
                    <CheckSquare size={20} />
                    <div className="checklist-title-row">
                      <h3>{chk.title}</h3>
                      <button
                        className="delete-subtle-btn"
                        onClick={() => deleteChecklist(card.id, chk.id)}
                        title="Delete checklist"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="checklist-progress-container">
                    <span className="progress-percent-label">{percent}%</span>
                    <div className="progress-bar-track">
                      <div
                        className={`progress-bar-fill ${percent === 100 ? 'done' : ''}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Checklist Items list */}
                  <div className="checklist-items-list">
                    {chk.items.map((item) => (
                      <div key={item.id} className="checklist-item-row">
                        <input
                          type="checkbox"
                          className="checklist-checkbox"
                          checked={item.completed}
                          onChange={() => toggleChecklistItem(card.id, chk.id, item.id)}
                        />
                        <span className={`checklist-item-text ${item.completed ? 'completed' : ''}`}>
                          {item.text}
                        </span>
                        <button
                          className="item-delete-btn"
                          onClick={() => deleteChecklistItem(card.id, chk.id, item.id)}
                          title="Delete item"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add item to checklist */}
                  {activeChecklistInput === chk.id ? (
                    <div className="add-checklist-item-composer">
                      <input
                        type="text"
                        className="item-input"
                        placeholder="Add an item..."
                        value={checklistItemText}
                        onChange={(e) => setChecklistItemText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddChecklistItem(chk.id);
                          if (e.key === 'Escape') setActiveChecklistInput(null);
                        }}
                        autoFocus
                      />
                      <div className="composer-actions">
                        <button
                          className="primary-btn-sm"
                          onClick={() => handleAddChecklistItem(chk.id)}
                        >
                          Add
                        </button>
                        <button
                          className="icon-button-sm"
                          onClick={() => setActiveChecklistInput(null)}
                        >
                          <X size={15} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="add-item-trigger-btn"
                      onClick={() => {
                        setActiveChecklistInput(chk.id);
                        setChecklistItemText('');
                      }}
                    >
                      <Plus size={15} />
                      <span>Add an item</span>
                    </button>
                  )}
                </div>
              );
            })}

            {/* Comments & Activity Section */}
            <div className="modal-section activity-section">
              <div className="section-header">
                <MessageSquare size={20} />
                <h3>Activity & Comments</h3>
              </div>

              {/* Add Comment */}
              <form className="comment-composer" onSubmit={handleAddComment}>
                <div className="comment-user-avatar" style={{ backgroundColor: '#3b82f6' }}>
                  AS
                </div>
                <div className="comment-input-wrapper">
                  <textarea
                    className="comment-textarea"
                    placeholder="Write a comment..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    rows={2}
                  />
                  {newCommentText.trim() && (
                    <button type="submit" className="primary-btn-sm send-comment-btn">
                      <Send size={13} />
                      <span>Comment</span>
                    </button>
                  )}
                </div>
              </form>

              {/* Chronological Stream */}
              <div className="activity-stream">
                {card.comments?.map((comment) => (
                  <div key={comment.id} className="activity-entry comment-entry">
                    <div
                      className="activity-avatar"
                      style={{ backgroundColor: comment.authorAvatar || '#3b82f6' }}
                    >
                      {comment.authorName[0]}
                    </div>
                    <div className="activity-content">
                      <div className="activity-meta">
                        <span className="author-name">{comment.authorName}</span>
                        <span className="timestamp">
                          {new Date(comment.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="comment-bubble">
                        <p>{comment.text}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {card.activities?.map((act) => (
                  <div key={act.id} className="activity-entry log-entry">
                    <div className="log-dot" />
                    <div className="log-text">
                      <span>{act.text}</span>
                      <span className="timestamp">
                        {new Date(act.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Actions Sidebar */}
          <div className="card-modal-sidebar">
            <div className="sidebar-group">
              <span className="sidebar-group-title">Add to card</span>

              {/* Members Button & Popover */}
              <div className="sidebar-action-wrapper">
                <button
                  className={`sidebar-action-btn ${activePopover === 'members' ? 'active' : ''}`}
                  onClick={() => setActivePopover(activePopover === 'members' ? 'none' : 'members')}
                >
                  <User size={15} />
                  <span>Members</span>
                </button>

                {activePopover === 'members' && (
                  <div className="popover-menu animate-fade-in">
                    <div className="popover-header">
                      <span>Members</span>
                      <button onClick={() => setActivePopover('none')}>
                        <X size={14} />
                      </button>
                    </div>
                    <div className="popover-list">
                      {activeBoard.members.map((mem) => {
                        const isAssigned = card.members.includes(mem.id);
                        return (
                          <div
                            key={mem.id}
                            className={`popover-item ${isAssigned ? 'selected' : ''}`}
                            onClick={() => toggleCardMember(card.id, mem.id)}
                          >
                            <div
                              className="member-mini-avatar"
                              style={{ backgroundColor: mem.avatarColor }}
                            >
                              {mem.initials}
                            </div>
                            <span className="popover-label">{mem.name}</span>
                            {isAssigned && <CheckCircle2 size={15} className="check-icon" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Labels Button & Popover */}
              <div className="sidebar-action-wrapper">
                <button
                  className={`sidebar-action-btn ${activePopover === 'labels' ? 'active' : ''}`}
                  onClick={() => setActivePopover(activePopover === 'labels' ? 'none' : 'labels')}
                >
                  <Tag size={15} />
                  <span>Labels</span>
                </button>

                {activePopover === 'labels' && (
                  <div className="popover-menu animate-fade-in">
                    <div className="popover-header">
                      <span>Labels</span>
                      <button onClick={() => setActivePopover('none')}>
                        <X size={14} />
                      </button>
                    </div>
                    <div className="popover-list">
                      {activeBoard.labels.map((lbl) => {
                        const isSelected = card.labels.includes(lbl.id);
                        return (
                          <div
                            key={lbl.id}
                            className={`popover-label-item ${isSelected ? 'selected' : ''}`}
                            style={{ backgroundColor: lbl.color }}
                            onClick={() => toggleCardLabel(card.id, lbl.id)}
                          >
                            <span>{lbl.name}</span>
                            {isSelected && <CheckCircle2 size={15} className="check-icon-white" />}
                          </div>
                        );
                      })}
                    </div>

                    <div className="popover-divider" />
                    <form className="create-label-form" onSubmit={handleCreateCustomLabel}>
                      <span className="popover-subhead">Create custom label</span>
                      <input
                        type="text"
                        placeholder="Label title..."
                        className="create-label-input"
                        value={newLabelName}
                        onChange={(e) => setNewLabelName(e.target.value)}
                      />
                      <div className="color-presets-row">
                        {['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'].map((c) => (
                          <div
                            key={c}
                            className={`color-preset-dot ${newLabelColor === c ? 'active' : ''}`}
                            style={{ backgroundColor: c }}
                            onClick={() => setNewLabelColor(c)}
                          />
                        ))}
                      </div>
                      <button type="submit" className="primary-btn-sm full-width">
                        Create
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* Checklist Button & Popover */}
              <div className="sidebar-action-wrapper">
                <button
                  className={`sidebar-action-btn ${activePopover === 'checklist' ? 'active' : ''}`}
                  onClick={() => setActivePopover(activePopover === 'checklist' ? 'none' : 'checklist')}
                >
                  <CheckSquare size={15} />
                  <span>Checklist</span>
                </button>

                {activePopover === 'checklist' && (
                  <form className="popover-menu animate-fade-in" onSubmit={handleCreateChecklist}>
                    <div className="popover-header">
                      <span>Add Checklist</span>
                      <button type="button" onClick={() => setActivePopover('none')}>
                        <X size={14} />
                      </button>
                    </div>
                    <input
                      type="text"
                      className="popover-input"
                      value={newChecklistTitle}
                      onChange={(e) => setNewChecklistTitle(e.target.value)}
                      placeholder="Checklist title"
                      autoFocus
                    />
                    <button type="submit" className="primary-btn-sm full-width">
                      Add
                    </button>
                  </form>
                )}
              </div>

              {/* Dates Button & Popover */}
              <div className="sidebar-action-wrapper">
                <button
                  className={`sidebar-action-btn ${activePopover === 'dates' ? 'active' : ''}`}
                  onClick={() => setActivePopover(activePopover === 'dates' ? 'none' : 'dates')}
                >
                  <Clock size={15} />
                  <span>Dates</span>
                </button>

                {activePopover === 'dates' && (
                  <div className="popover-menu animate-fade-in">
                    <div className="popover-header">
                      <span>Dates</span>
                      <button onClick={() => setActivePopover('none')}>
                        <X size={14} />
                      </button>
                    </div>
                    <label className="popover-field-label">Due Date</label>
                    <input
                      type="datetime-local"
                      className="popover-input"
                      value={card.dueDate ? card.dueDate.substring(0, 16) : ''}
                      onChange={(e) => {
                        const dateStr = e.target.value ? new Date(e.target.value).toISOString() : undefined;
                        updateCard(card.id, { dueDate: dateStr });
                      }}
                    />
                    {card.dueDate && (
                      <button
                        className="secondary-btn-sm full-width mt-2"
                        onClick={() => updateCard(card.id, { dueDate: undefined, dueComplete: false })}
                      >
                        Remove Date
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Cover Button & Popover */}
              <div className="sidebar-action-wrapper">
                <button
                  className={`sidebar-action-btn ${activePopover === 'cover' ? 'active' : ''}`}
                  onClick={() => setActivePopover(activePopover === 'cover' ? 'none' : 'cover')}
                >
                  <Palette size={15} />
                  <span>Cover</span>
                </button>

                {activePopover === 'cover' && (
                  <div className="popover-menu animate-fade-in">
                    <div className="popover-header">
                      <span>Cover Gradient</span>
                      <button onClick={() => setActivePopover('none')}>
                        <X size={14} />
                      </button>
                    </div>
                    <div className="cover-presets-grid">
                      {COVER_PRESETS.map((gradient, i) => (
                        <div
                          key={i}
                          className={`cover-preset-card ${card.coverGradient === gradient ? 'active' : ''}`}
                          style={{ background: gradient }}
                          onClick={() => updateCard(card.id, { coverGradient: gradient })}
                        />
                      ))}
                    </div>
                    {card.coverGradient && (
                      <button
                        className="secondary-btn-sm full-width mt-2"
                        onClick={() => updateCard(card.id, { coverGradient: undefined })}
                      >
                        Remove Cover
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Actions Section */}
            <div className="sidebar-group">
              <span className="sidebar-group-title">Actions</span>

              {/* Move to another list dropdown */}
              <div className="sidebar-select-wrapper">
                <label className="sidebar-subhead">Move to list:</label>
                <select
                  className="sidebar-select"
                  value={card.listId}
                  onChange={(e) => {
                    moveCard(card.id, card.listId, e.target.value, 0);
                  }}
                >
                  {activeBoard.lists.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Delete Card */}
              <button
                className="sidebar-action-btn danger"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this card?')) {
                    deleteCard(card.id);
                  }
                }}
              >
                <Trash2 size={15} />
                <span>Delete Card</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
