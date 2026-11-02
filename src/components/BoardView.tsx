import React, { useState, useRef } from 'react';
import { useBoard } from '../context/BoardContext';
import { ListColumn } from './ListColumn';
import { Plus, X } from 'lucide-react';

interface BoardViewProps {
  boardId?: string;
}

export const BoardView: React.FC<BoardViewProps> = ({ boardId }) => {
  const { activeBoard, boards, addList } = useBoard();
  const currentBoard = (boardId ? boards.find((b) => b.id === boardId) : null) || activeBoard;
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;
    addList(newListTitle);
    setNewListTitle('');
    setIsAddingList(false);
  };

  return (
    <main
      className="board-view-container"
      style={{
        background: currentBoard?.background?.value || '#1e293b',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="board-lists-scrollable">
        {(currentBoard?.lists || []).map((list, index) => (
          <ListColumn key={list.id} list={list} index={index} />
        ))}

        {/* Add Another List Composer */}
        <div className="add-list-column">
          {isAddingList ? (
            <form className="add-list-form animate-fade-in" onSubmit={handleCreateList}>
              <input
                ref={inputRef}
                type="text"
                className="add-list-input"
                placeholder="Enter list title..."
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                autoFocus
              />
              <div className="add-list-actions">
                <button type="submit" className="primary-btn-sm">
                  Add List
                </button>
                <button
                  type="button"
                  className="icon-button-sm"
                  onClick={() => {
                    setIsAddingList(false);
                    setNewListTitle('');
                  }}
                  title="Cancel"
                >
                  <X size={16} />
                </button>
              </div>
            </form>
          ) : (
            <button
              className="add-list-trigger-btn"
              onClick={() => {
                setIsAddingList(true);
                setTimeout(() => inputRef.current?.focus(), 50);
              }}
            >
              <Plus size={18} />
              <span>Add another list</span>
            </button>
          )}
        </div>
      </div>
    </main>
  );
};
