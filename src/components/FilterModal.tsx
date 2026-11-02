import React from 'react';
import { useBoard } from '../context/BoardContext';
import { X, Filter, CheckCircle2, RotateCcw } from 'lucide-react';

export const FilterModal: React.FC = () => {
  const {
    activeBoard,
    filter,
    setFilter,
    clearFilter,
    isFilterOpen,
    setIsFilterOpen,
  } = useBoard();

  if (!isFilterOpen) return null;

  const handleToggleLabel = (id: string) => {
    const exists = filter.selectedLabelIds.includes(id);
    const updated = exists
      ? filter.selectedLabelIds.filter((lId) => lId !== id)
      : [...filter.selectedLabelIds, id];
    setFilter({ selectedLabelIds: updated });
  };

  const handleToggleMember = (id: string) => {
    const exists = filter.selectedMemberIds.includes(id);
    const updated = exists
      ? filter.selectedMemberIds.filter((mId) => mId !== id)
      : [...filter.selectedMemberIds, id];
    setFilter({ selectedMemberIds: updated });
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={() => setIsFilterOpen(false)}>
      <div className="filter-modal-dialog animate-scale-up" onClick={(e) => e.stopPropagation()}>
        <div className="modal-dialog-header">
          <div className="dialog-title-group">
            <Filter size={18} />
            <h3>Filter Cards</h3>
          </div>
          <button
            className="icon-button close-btn"
            onClick={() => setIsFilterOpen(false)}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="dialog-body">
          {/* Due Date Filter */}
          <div className="filter-section">
            <span className="filter-section-title">Due date</span>
            <div className="filter-radio-grid">
              {[
                { id: 'all', label: 'All cards' },
                { id: 'due-soon', label: 'Due in next 48 hours' },
                { id: 'overdue', label: 'Overdue' },
                { id: 'completed', label: 'Marked complete' },
                { id: 'no-due', label: 'No due date' },
              ].map((opt) => (
                <label key={opt.id} className="filter-radio-label">
                  <input
                    type="radio"
                    name="dueFilter"
                    checked={filter.dueFilter === opt.id}
                    onChange={() => setFilter({ dueFilter: opt.id as any })}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Labels Filter */}
          <div className="filter-section">
            <span className="filter-section-title">Labels</span>
            <div className="filter-chips-grid">
              {activeBoard.labels.map((lbl) => {
                const isSelected = filter.selectedLabelIds.includes(lbl.id);
                return (
                  <div
                    key={lbl.id}
                    className={`filter-chip ${isSelected ? 'selected' : ''}`}
                    style={{ backgroundColor: lbl.color }}
                    onClick={() => handleToggleLabel(lbl.id)}
                  >
                    <span>{lbl.name}</span>
                    {isSelected && <CheckCircle2 size={14} className="check-icon-white" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Members Filter */}
          <div className="filter-section">
            <span className="filter-section-title">Members</span>
            <div className="filter-members-grid">
              {activeBoard.members.map((mem) => {
                const isSelected = filter.selectedMemberIds.includes(mem.id);
                return (
                  <div
                    key={mem.id}
                    className={`filter-member-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleToggleMember(mem.id)}
                  >
                    <div
                      className="member-mini-avatar"
                      style={{ backgroundColor: mem.avatarColor }}
                    >
                      {mem.initials}
                    </div>
                    <span className="member-name">{mem.name}</span>
                    {isSelected && <CheckCircle2 size={15} className="check-icon" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="dialog-footer">
          <button className="secondary-btn" onClick={clearFilter}>
            <RotateCcw size={14} />
            <span>Clear all filters</span>
          </button>
          <button className="primary-btn" onClick={() => setIsFilterOpen(false)}>
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};
