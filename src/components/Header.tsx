import React, { useState, useRef, useEffect } from 'react';
import { useBoard } from '../context/BoardContext';
import { useTenant } from '../context/TenantContext';
import { useRouter, useNavigate } from '../router/Router';
import { OrgSwitcherDropdown } from './OrgSwitcherDropdown';
import { UserMenuDropdown } from './UserMenuDropdown';
import {
  Kanban,
  Star,
  Search,
  Filter,
  Palette,
  Download,
  Upload,
  Keyboard,
  Moon,
  Sun,
  Plus,
  Menu,
  ChevronDown,
  X,
  Settings,
  Shield,
  Key,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    activeBoard,
    boards,
    setActiveBoardId,
    toggleStarBoard,
    theme,
    toggleTheme,
    setIsSidebarOpen,
    filter,
    setFilter,
    setIsFilterOpen,
    setIsShortcutsOpen,
    setIsNewBoardOpen,
    setIsBgPickerOpen,
    exportBoardJSON,
    importBoardJSON,
  } = useBoard();

  const {
    isAdmin,
    isPlatformAdmin,
    setIsOrgAdminOpen,
    setIsPlatformAdminOpen,
    activeOrg,
    orgJoinCode,
    setIsJoinCodeModalOpen,
  } = useTenant();

  const { currentPath } = useRouter();
  const navigate = useNavigate();

  const orgSlug = activeOrg?.slug || 'acme-corp';

  // Check if an individual board is currently open in the route
  const isBoardOpen = Boolean(
    currentPath.includes('/boards/') &&
    !currentPath.endsWith('/boards') &&
    !currentPath.endsWith('/boards/')
  );

  const [isBoardDropdownOpen, setIsBoardDropdownOpen] = useState(false);
  const boardDropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close board dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (boardDropdownRef.current && !boardDropdownRef.current.contains(e.target as Node)) {
        setIsBoardDropdownOpen(false);
      }
    };
    if (isBoardDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isBoardDropdownOpen]);

  const activeFiltersCount =
    (filter.selectedLabelIds.length > 0 ? 1 : 0) +
    (filter.selectedMemberIds.length > 0 ? 1 : 0) +
    (filter.dueFilter !== 'all' ? 1 : 0) +
    (filter.searchQuery.trim().length > 0 ? 1 : 0);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          importBoardJSON(content);
        }
      };
      reader.readAsText(file);
    }
    if (e.target) e.target.value = '';
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          className="icon-button"
          onClick={() => setIsSidebarOpen(true)}
          title="Open Boards Drawer (B)"
          aria-label="Open sidebar"
        >
          <Menu size={20} />
        </button>

        <div className="brand-badge">
          <div className="brand-logo-icon">
            <Kanban size={18} />
          </div>
          <span className="brand-title">Stratcrest Flow</span>
        </div>

        <div className="divider" />

        {/* Organisation Switcher */}
        <OrgSwitcherDropdown />

        {/* Board Switcher Dropdown & Star Button (Visible ONLY when a board is open) */}
        {isBoardOpen && (
          <>
            <div className="divider" />

            <div className="board-selector-wrapper" ref={boardDropdownRef}>
              <button
                className="board-selector-btn"
                onClick={() => setIsBoardDropdownOpen((prev) => !prev)}
                aria-expanded={isBoardDropdownOpen}
                title={`Active Board: ${activeBoard.title}. Click to switch boards.`}
              >
                <span className="board-active-title">{activeBoard.title}</span>
                <ChevronDown size={16} className={`chevron-icon ${isBoardDropdownOpen ? 'open' : ''}`} />
              </button>

              {isBoardDropdownOpen && (
                <div className="dropdown-menu board-dropdown animate-fade-in">
                  <div className="dropdown-header">Switch Board</div>
                  <div className="dropdown-list">
                    {boards.map((b) => (
                      <button
                        key={b.id}
                        className={`dropdown-item ${b.id === activeBoard.id ? 'active' : ''}`}
                        onClick={() => {
                          setActiveBoardId(b.id);
                          setIsBoardDropdownOpen(false);
                          navigate(`/org/${orgSlug}/boards/${b.id}`);
                        }}
                      >
                        <div
                          className="board-mini-thumb"
                          style={{ background: b.background.value }}
                        />
                        <span className="dropdown-item-label">{b.title}</span>
                        {b.isStarred && <Star size={14} className="star-icon filled" />}
                      </button>
                    ))}
                  </div>
                  <div className="dropdown-divider" />
                  <button
                    className="dropdown-item create-action"
                    onClick={() => {
                      setIsBoardDropdownOpen(false);
                      setIsNewBoardOpen(true);
                    }}
                  >
                    <Plus size={16} />
                    <span>Create new board</span>
                  </button>
                </div>
              )}
            </div>

            <button
              className={`star-btn ${activeBoard.isStarred ? 'starred' : ''}`}
              onClick={() => toggleStarBoard(activeBoard.id)}
              title={activeBoard.isStarred ? 'Unstar Board' : 'Star Board'}
              aria-label="Star board"
            >
              <Star size={18} />
            </button>
          </>
        )}
      </div>

      {/* Board Search (Visible ONLY when a board is open) */}
      {isBoardOpen ? (
        <div className="header-center">
          <div className="search-bar-container">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search cards (Press 'F' to filter)..."
              value={filter.searchQuery}
              onChange={(e) => setFilter({ searchQuery: e.target.value })}
            />
            {filter.searchQuery && (
              <button
                className="clear-search-btn"
                onClick={() => setFilter({ searchQuery: '' })}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="header-center" />
      )}

      <div className="header-right">
        {/* Board Tools: Filter, Theme, Import/Export (Visible ONLY when a board is open) */}
        {isBoardOpen && (
          <>
            <button
              className={`action-pill-btn ${activeFiltersCount > 0 ? 'active' : ''}`}
              onClick={() => setIsFilterOpen(true)}
              title="Filter cards"
            >
              <Filter size={16} />
              <span>Filter</span>
              {activeFiltersCount > 0 && <span className="badge">{activeFiltersCount}</span>}
            </button>

            <button
              className="action-pill-btn"
              onClick={() => setIsBgPickerOpen(true)}
              title="Change Board Background"
            >
              <Palette size={16} />
              <span>Theme</span>
            </button>

            <div className="action-group">
              <button
                className="icon-button"
                onClick={exportBoardJSON}
                title="Export Board as JSON"
                aria-label="Export board"
              >
                <Download size={18} />
              </button>

              <button
                className="icon-button"
                onClick={() => fileInputRef.current?.click()}
                title="Import Board from JSON"
                aria-label="Import board"
              >
                <Upload size={18} />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".json"
                onChange={handleFileUpload}
              />
            </div>
          </>
        )}

        <button
          className="icon-button"
          onClick={() => setIsShortcutsOpen(true)}
          title="Keyboard Shortcuts (?)"
          aria-label="Keyboard shortcuts"
        >
          <Keyboard size={18} />
        </button>

        <button
          className="icon-button"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {isAdmin && (
          <button
            className="icon-button"
            onClick={() => setIsOrgAdminOpen(true)}
            title="Organisation Settings & Administration"
            aria-label="Organisation Settings"
          >
            <Settings size={18} />
          </button>
        )}

        {isPlatformAdmin && (
          <button
            className="icon-button platform-admin-badge-btn"
            onClick={() => setIsPlatformAdminOpen(true)}
            title="Platform Super-Administrator Portal"
            aria-label="Platform Super-Admin"
          >
            <Shield size={18} />
          </button>
        )}

        {/* Organisation Join Code Button */}
        <button
          className="action-pill-btn"
          onClick={() => setIsJoinCodeModalOpen(true)}
          title={`Organisation Join Code: ${orgJoinCode || activeOrg?.joinCode || ''}. Click to view or invite workers.`}
          style={{
            background: 'rgba(59, 130, 246, 0.1)',
            borderColor: 'rgba(59, 130, 246, 0.35)',
            color: '#60a5fa',
            fontWeight: 600,
          }}
        >
          <Key size={14} />
          <span>Code: {orgJoinCode || activeOrg?.joinCode || 'ORG'}</span>
        </button>

        <button
          className="primary-cta-btn"
          onClick={() => setIsNewBoardOpen(true)}
        >
          <Plus size={16} />
          <span>New Board</span>
        </button>

        <UserMenuDropdown />
      </div>
    </header>
  );
};
