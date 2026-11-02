import React, { useState, useRef } from 'react';
import type { List as ListType, Card as CardType } from '../types';
import { useBoard } from '../context/BoardContext';
import { CardItem } from './CardItem';
import {
  MoreHorizontal,
  Plus,
  X,
  Trash2,
  ArrowRightLeft,
} from 'lucide-react';

interface ListColumnProps {
  list: ListType;
  index?: number;
}

export const ListColumn: React.FC<ListColumnProps> = ({ list }) => {
  const {
    activeBoard,
    updateListTitle,
    deleteList,
    addCard,
    moveCard,
    filter,
  } = useBoard();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(list.title);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const newCardInputRef = useRef<HTMLTextAreaElement>(null);

  // Filter cards according to search & filter criteria
  const cards = list.cardIds
    .map((cId) => activeBoard.cards[cId])
    .filter(Boolean)
    .filter((card: CardType) => {
      // 1. Search Query
      if (filter.searchQuery.trim()) {
        const query = filter.searchQuery.toLowerCase();
        const matchesTitle = card.title.toLowerCase().includes(query);
        const matchesDesc = (card.description || '').toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc) return false;
      }

      // 2. Selected Labels
      if (filter.selectedLabelIds.length > 0) {
        const hasLabel = filter.selectedLabelIds.some((lId) => card.labels.includes(lId));
        if (!hasLabel) return false;
      }

      // 3. Selected Members
      if (filter.selectedMemberIds.length > 0) {
        const hasMember = filter.selectedMemberIds.some((selectedId) => {
          const targetMem = activeBoard.members.find(
            (m) => m.id === selectedId || m.userId === selectedId || (m as any).memberId === selectedId
          );
          const matchIds = targetMem
            ? [targetMem.id, targetMem.userId, (targetMem as any).memberId].filter((id): id is string => Boolean(id))
            : [selectedId];
          return card.members.some((cmId) => matchIds.includes(cmId));
        });
        if (!hasMember) return false;
      }

      // 4. Due Date Filter
      if (filter.dueFilter !== 'all') {
        if (filter.dueFilter === 'no-due' && card.dueDate) return false;
        if (filter.dueFilter === 'completed' && !card.dueComplete) return false;
        if (filter.dueFilter === 'overdue') {
          if (!card.dueDate || card.dueComplete) return false;
          if (new Date(card.dueDate).getTime() >= Date.now()) return false;
        }
        if (filter.dueFilter === 'due-soon') {
          if (!card.dueDate || card.dueComplete) return false;
          const diff = new Date(card.dueDate).getTime() - Date.now();
          if (diff < 0 || diff > 86400000 * 2) return false; // next 48h
        }
      }

      return true;
    });

  const handleTitleSubmit = () => {
    if (titleValue.trim()) {
      updateListTitle(list.id, titleValue);
    } else {
      setTitleValue(list.title);
    }
    setIsEditingTitle(false);
  };

  const handleCreateCard = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newCardTitle.trim()) return;
    addCard(list.id, newCardTitle);
    setNewCardTitle('');
    // Keep focus in composer for fast continuous entry
    newCardInputRef.current?.focus();
  };

  const handleKeyDownComposer = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCreateCard();
    } else if (e.key === 'Escape') {
      setIsAddingCard(false);
      setNewCardTitle('');
    }
  };

  // --- HTML5 Drag & Drop handlers for Card Reordering & List Transfer ---
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const rawData = e.dataTransfer.getData('text/plain');
    if (!rawData) return;

    try {
      const data = JSON.parse(rawData);
      if (data.cardId) {
        // Calculate target drop index based on clientY
        const cardElements = Array.from(e.currentTarget.querySelectorAll('.card-tile'));
        let targetIndex = list.cardIds.length;

        for (let i = 0; i < cardElements.length; i++) {
          const rect = cardElements[i].getBoundingClientRect();
          const midY = rect.top + rect.height / 2;
          if (e.clientY < midY) {
            targetIndex = i;
            break;
          }
        }

        moveCard(data.cardId, data.sourceListId, list.id, targetIndex);
      }
    } catch (err) {
      console.error('Failed to parse drag drop data', err);
    }
  };

  return (
    <div
      className={`list-column ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* List Header */}
      <div className="list-header">
        {isEditingTitle ? (
          <input
            type="text"
            className="list-title-input"
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTitleSubmit();
              if (e.key === 'Escape') {
                setTitleValue(list.title);
                setIsEditingTitle(false);
              }
            }}
            autoFocus
          />
        ) : (
          <div
            className="list-title-display"
            onClick={() => setIsEditingTitle(true)}
            title="Click to edit list title"
          >
            <h3 className="list-title">{list.title}</h3>
            <span className="list-count-badge">{list.cardIds.length}</span>
          </div>
        )}

        <div className="list-header-actions">
          <button
            className="icon-button-sm"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            title="List actions"
            aria-label="List options"
          >
            <MoreHorizontal size={16} />
          </button>

          {isMenuOpen && (
            <div className="dropdown-menu list-dropdown animate-fade-in">
              <div className="dropdown-header">List Actions</div>
              <button
                className="dropdown-item"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsAddingCard(true);
                  setTimeout(() => newCardInputRef.current?.focus(), 50);
                }}
              >
                <Plus size={15} />
                <span>Add card...</span>
              </button>
              <button
                className="dropdown-item"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsEditingTitle(true);
                }}
              >
                <ArrowRightLeft size={15} />
                <span>Rename list</span>
              </button>
              <div className="dropdown-divider" />
              <button
                className="dropdown-item danger-item"
                onClick={() => {
                  setIsMenuOpen(false);
                  if (confirm(`Delete list "${list.title}" and its ${list.cardIds.length} cards?`)) {
                    deleteList(list.id);
                  }
                }}
              >
                <Trash2 size={15} />
                <span>Delete list</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Card Items Stack */}
      <div className="list-cards-stack">
        {cards.map((card, cardIndex) => (
          <CardItem key={card.id} card={card} index={cardIndex} />
        ))}

        {cards.length === 0 && !isAddingCard && (
          <div className="empty-list-placeholder">
            <span>No cards in this list</span>
          </div>
        )}
      </div>

      {/* List Footer / Add Card Composer */}
      <div className="list-footer">
        {isAddingCard ? (
          <form className="card-composer" onSubmit={handleCreateCard}>
            <textarea
              ref={newCardInputRef}
              className="card-composer-textarea"
              placeholder="Enter a title for this card..."
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={handleKeyDownComposer}
              rows={3}
              autoFocus
            />
            <div className="composer-actions">
              <button type="submit" className="primary-btn-sm">
                Add Card
              </button>
              <button
                type="button"
                className="icon-button-sm"
                onClick={() => {
                  setIsAddingCard(false);
                  setNewCardTitle('');
                }}
                title="Cancel"
              >
                <X size={16} />
              </button>
            </div>
          </form>
        ) : (
          <button
            className="add-card-btn"
            onClick={() => {
              setIsAddingCard(true);
              setTimeout(() => newCardInputRef.current?.focus(), 50);
            }}
          >
            <Plus size={16} />
            <span>Add a card</span>
          </button>
        )}
      </div>
    </div>
  );
};
