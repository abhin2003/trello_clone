import React from 'react';
import type { Card as CardType } from '../types';
import { useBoard } from '../context/BoardContext';
import {
  AlignLeft,
  CheckSquare,
  Clock,
  MessageSquare,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

interface CardItemProps {
  card: CardType;
  index?: number;
}

export const CardItem: React.FC<CardItemProps> = ({ card }) => {
  const { activeBoard, openCardModal, deleteCard } = useBoard();

  const labels = card.labels
    .map((lId) => activeBoard.labels.find((l) => l.id === lId))
    .filter(Boolean);

  const members = card.members
    .map((mId) => activeBoard.members.find((m) => m.id === mId))
    .filter(Boolean);

  // Checklists summary
  const totalChecklistItems = card.checklists.reduce((acc, chk) => acc + chk.items.length, 0);
  const completedChecklistItems = card.checklists.reduce(
    (acc, chk) => acc + chk.items.filter((it) => it.completed).length,
    0
  );

  // Due date status
  let dueStatus: 'none' | 'overdue' | 'due-soon' | 'completed' = 'none';
  if (card.dueDate) {
    if (card.dueComplete) {
      dueStatus = 'completed';
    } else {
      const now = Date.now();
      const due = new Date(card.dueDate).getTime();
      if (due < now) {
        dueStatus = 'overdue';
      } else if (due - now < 86400000) {
        dueStatus = 'due-soon';
      }
    }
  }

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ cardId: card.id, sourceListId: card.listId }));
    e.dataTransfer.effectAllowed = 'move';
    // Add dragging class
    const target = e.currentTarget as HTMLElement;
    setTimeout(() => {
      target.classList.add('is-dragging');
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.classList.remove('is-dragging');
  };

  return (
    <div
      className="card-tile"
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => openCardModal(card.id)}
      data-card-id={card.id}
    >
      {/* Card Cover */}
      {card.coverGradient && (
        <div
          className="card-cover-banner"
          style={{ background: card.coverGradient }}
        />
      )}

      <div className="card-tile-body">
        {/* Label Chips */}
        {labels.length > 0 && (
          <div className="card-labels-container">
            {labels.map((lbl) => (
              <span
                key={lbl!.id}
                className="card-label-chip"
                style={{ backgroundColor: lbl!.color, color: lbl!.textColor || '#fff' }}
                title={lbl!.name}
              >
                {lbl!.name}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h4 className="card-tile-title">{card.title}</h4>

        {/* Indicators and Members Row */}
        <div className="card-tile-footer">
          <div className="card-badges-group">
            {/* Due date badge */}
            {card.dueDate && (
              <div className={`card-badge due-badge ${dueStatus}`} title={`Due: ${new Date(card.dueDate).toLocaleDateString()}`}>
                {card.dueComplete ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                <span>
                  {new Date(card.dueDate).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            )}

            {/* Checklist progress */}
            {totalChecklistItems > 0 && (
              <div
                className={`card-badge checklist-badge ${completedChecklistItems === totalChecklistItems ? 'complete' : ''}`}
                title="Checklist items"
              >
                <CheckSquare size={13} />
                <span>
                  {completedChecklistItems}/{totalChecklistItems}
                </span>
              </div>
            )}

            {/* Description indicator */}
            {card.description?.trim() && (
              <div className="card-badge" title="This card has a description">
                <AlignLeft size={13} />
              </div>
            )}

            {/* Comments count */}
            {card.comments && card.comments.length > 0 && (
              <div className="card-badge" title={`${card.comments.length} comments`}>
                <MessageSquare size={13} />
                <span>{card.comments.length}</span>
              </div>
            )}
          </div>

          {/* Member Avatars */}
          {members.length > 0 && (
            <div className="card-members-group">
              {members.map((m) => (
                <div
                  key={m!.id}
                  className="member-mini-avatar"
                  style={{ backgroundColor: m!.avatarColor }}
                  title={m!.name}
                >
                  {m!.initials}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick delete button on hover */}
      <button
        className="quick-card-delete-btn"
        onClick={(e) => {
          e.stopPropagation();
          deleteCard(card.id);
        }}
        title="Delete Card"
        aria-label="Delete card"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
};
