import React, { useState, useRef, useEffect } from 'react';
import { useTenant } from '../context/TenantContext';
import {
  ChevronDown,
  Plus,
  Shield,
  Settings,
  Check,
  AlertTriangle,
  Crown,
} from 'lucide-react';

export const OrgSwitcherDropdown: React.FC = () => {
  const {
    activeOrg,
    userOrgs,
    userRole,
    isPlatformAdmin,
    isSuspended,
    switchOrganisation,
    setIsOrgAdminOpen,
    setIsPlatformAdminOpen,
    setIsOnboardingOpen,
    setIsUpgradeModalOpen,
  } = useTenant();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const getPlanBadgeClass = (planId: string) => {
    switch (planId) {
      case 'enterprise':
        return 'plan-badge-enterprise';
      case 'professional':
        return 'plan-badge-pro';
      case 'starter':
        return 'plan-badge-starter';
      default:
        return 'plan-badge-free';
    }
  };

  const getRoleBadgeClass = (role?: string) => {
    switch (role) {
      case 'owner':
        return 'role-badge-owner';
      case 'admin':
        return 'role-badge-admin';
      case 'guest':
        return 'role-badge-guest';
      default:
        return 'role-badge-member';
    }
  };

  return (
    <div className="org-switcher-wrapper" ref={dropdownRef}>
      <button
        className={`org-switcher-trigger ${isSuspended ? 'org-suspended-trigger' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        title="Switch Organisation"
      >
        <div
          className="org-avatar-badge"
          style={{ backgroundColor: activeOrg.primaryColor || '#3b82f6' }}
        >
          {activeOrg.logoUrl ? (
            <img src={activeOrg.logoUrl} alt={activeOrg.name} className="org-logo-img" />
          ) : (
            <span>{activeOrg.name.slice(0, 2).toUpperCase()}</span>
          )}
        </div>

        <div className="org-meta-info">
          <div className="org-name-row">
            <span className="org-display-name">{activeOrg.name}</span>
            {isSuspended && (
              <span title="Suspended">
                <AlertTriangle size={13} className="text-rose inline-icon" />
              </span>
            )}
          </div>
          <div className="org-sub-row">
            <span className={`plan-pill ${getPlanBadgeClass(activeOrg.planId)}`}>
              {activeOrg.planId.toUpperCase().replace('_', ' ')}
            </span>
            {userRole && (
              <span className={`role-pill ${getRoleBadgeClass(userRole)}`}>
                {userRole.toUpperCase()}
              </span>
            )}
          </div>
        </div>

        <ChevronDown size={14} className={`chevron-indicator ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <div className="dropdown-menu org-dropdown-menu animate-fade-in">
          <div className="dropdown-header">
            <span>Your Organisations</span>
            <span className="org-count-tag">{userOrgs.length}</span>
          </div>

          <div className="dropdown-list org-list">
            {userOrgs.map((org) => {
              const isActive = org.id === activeOrg.id;
              const isOrgSuspended = org.status === 'suspended';
              return (
                <button
                  key={org.id}
                  className={`dropdown-item org-item ${isActive ? 'active' : ''} ${
                    isOrgSuspended ? 'suspended-item' : ''
                  }`}
                  onClick={() => {
                    switchOrganisation(org.id);
                    setIsOpen(false);
                  }}
                >
                  <div
                    className="org-avatar-mini"
                    style={{ backgroundColor: org.primaryColor || '#3b82f6' }}
                  >
                    {org.name.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="org-item-content">
                    <div className="org-item-name">
                      <span>{org.name}</span>
                      {isOrgSuspended && (
                        <span className="badge-suspended-mini">Suspended</span>
                      )}
                    </div>
                    <div className="org-item-tags">
                      <span className={`plan-mini-tag ${getPlanBadgeClass(org.planId)}`}>
                        {org.planId.toUpperCase()}
                      </span>
                      <span className={`role-mini-tag ${getRoleBadgeClass(org.userRole)}`}>
                        {org.userRole}
                      </span>
                    </div>
                  </div>

                  {isActive && <Check size={16} className="active-check-icon" />}
                </button>
              );
            })}
          </div>

          <div className="dropdown-divider" />

          {/* Quick Management Actions */}
          <div className="org-actions-section">
            {(userRole === 'owner' || userRole === 'admin') && (
              <button
                className="dropdown-item"
                onClick={() => {
                  setIsOpen(false);
                  setIsOrgAdminOpen(true);
                }}
              >
                <Settings size={15} />
                <span>Organisation Settings</span>
              </button>
            )}

            <button
              className="dropdown-item"
              onClick={() => {
                setIsOpen(false);
                setIsUpgradeModalOpen(true);
              }}
            >
              <Crown size={15} className="text-amber" />
              <span>Subscription & Plans</span>
            </button>

            {isPlatformAdmin && (
              <button
                className="dropdown-item platform-admin-highlight"
                onClick={() => {
                  setIsOpen(false);
                  setIsPlatformAdminOpen(true);
                }}
              >
                <Shield size={15} className="text-blue" />
                <span>Platform Admin Portal</span>
                <span className="super-admin-tag">Super</span>
              </button>
            )}

            <div className="dropdown-divider" />

            <button
              className="dropdown-item create-action"
              onClick={() => {
                setIsOpen(false);
                setIsOnboardingOpen(true);
              }}
            >
              <Plus size={15} />
              <span>Create / Join Organisation</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
