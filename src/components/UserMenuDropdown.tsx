import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import {
  Building2,
  LogOut,
  Settings,
  Shield,
  Layers,
  ChevronDown,
  Crown,
  UserCheck,
} from 'lucide-react';
import { useNavigate } from '../router/Router';
import type { UserRole } from '../types/saas';

export const UserMenuDropdown: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile, user, logout } = useAuth();
  const {
    activeOrg,
    userRole,
    isAdmin,
    isPlatformAdmin,
  } = useTenant();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const name = userProfile?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const email = userProfile?.email || user?.email || '';
  const initials = userProfile?.initials || name.slice(0, 2).toUpperCase() || 'U';
  const avatarColor = userProfile?.avatarColor || '#3b82f6';

  const renderRoleBadge = (role: UserRole | null) => {
    if (!role) return null;
    switch (role) {
      case 'owner':
        return (
          <span className="badge-pill badge-active" style={{ fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
            <Crown size={11} />
            Owner
          </span>
        );
      case 'admin':
        return (
          <span className="badge-pill badge-neutral" style={{ fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: '3px', borderColor: 'var(--accent-blue)', color: 'var(--accent-blue)' }}>
            <Shield size={11} />
            Admin
          </span>
        );
      default:
        return (
          <span className="badge-pill badge-neutral" style={{ fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
            <UserCheck size={11} />
            Member
          </span>
        );
    }
  };

  return (
    <div className="user-menu-dropdown-wrapper" ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        type="button"
        className="user-avatar-trigger-btn"
        onClick={() => setIsOpen((p) => !p)}
        title={`${name} (${email})`}
        aria-expanded={isOpen}
      >
        <div className="header-user-avatar" style={{ backgroundColor: avatarColor }}>
          {initials}
        </div>
        <ChevronDown size={14} className="avatar-chevron" />
      </button>

      {isOpen && (
        <div
          className="user-profile-menu-popover"
          style={{
            backgroundColor: 'var(--bg-surface, var(--bg-card))',
            opacity: 1,
          }}
        >
          {/* User Bio Header */}
          <div className="user-popover-header">
            <div className="popover-avatar" style={{ backgroundColor: avatarColor }}>
              {initials}
            </div>
            <div className="popover-info">
              <div className="popover-name-row">
                <span className="popover-name">{name}</span>
                {renderRoleBadge(userRole)}
              </div>
              <span className="popover-email">{email}</span>
            </div>
          </div>

          {/* Active Org Context */}
          <div className="popover-org-context">
            <Building2 size={15} className="popover-org-icon" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="popover-org-label">Current Organisation</div>
              <div className="popover-org-name">{activeOrg.name}</div>
            </div>
          </div>

          <div className="popover-divider" />

          {/* Action List */}
          <div className="popover-actions-list">
            <button
              type="button"
              className="popover-menu-item"
              onClick={() => {
                setIsOpen(false);
                navigate('/organizations/select');
              }}
            >
              <Layers size={16} />
              <span>Switch Organisation</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                className="popover-menu-item"
                onClick={() => {
                  setIsOpen(false);
                  navigate(`/org/${activeOrg.slug || 'acme-corp'}/settings`);
                }}
              >
                <Settings size={16} />
                <span>Organisation Settings</span>
              </button>
            )}

            {isPlatformAdmin && (
              <button
                type="button"
                className="popover-menu-item platform-admin-item"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/platform-admin/dashboard');
                }}
              >
                <Shield size={16} />
                <span>Platform Admin Console</span>
              </button>
            )}

            <div className="popover-divider" />

            {/* Log Out */}
            <button
              type="button"
              className="popover-menu-item logout-item"
              onClick={async () => {
                setIsOpen(false);
                await logout();
              }}
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
