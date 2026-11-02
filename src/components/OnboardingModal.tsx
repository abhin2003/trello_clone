import React, { useState } from 'react';
import { useTenant } from '../context/TenantContext';
import { tenantService } from '../services/tenantService';
import {
  X,
  Sparkles,
  Building2,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import type { SubscriptionPlanId } from '../types/saas';

export const OnboardingModal: React.FC = () => {
  const { isOnboardingOpen, setIsOnboardingOpen, refreshTenantState } = useTenant();

  const [activeTab, setActiveTab] = useState<'create' | 'accept'>('create');

  // Self-Serve Create state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const planId: SubscriptionPlanId = 'enterprise';
  const [workspaceName, setWorkspaceName] = useState('Product Engineering');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Accept token state
  const [token, setToken] = useState('');
  const [acceptSuccess, setAcceptSuccess] = useState<string | null>(null);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  if (!isOnboardingOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!name.trim()) {
      setErrorMsg('Organisation name is required.');
      return;
    }

    try {
      tenantService.createOrganisationSelfServe({
        name: name.trim(),
        slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        planId,
        firstWorkspaceName: workspaceName.trim() || 'General Workspace',
      });

      refreshTenantState();
      setIsOnboardingOpen(false);
      setName('');
      setSlug('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create organisation');
    }
  };

  const handleAccept = (e: React.FormEvent) => {
    e.preventDefault();
    setAcceptError(null);
    setAcceptSuccess(null);
    if (!token.trim()) {
      setAcceptError('Please enter an invitation token.');
      return;
    }

    try {
      tenantService.acceptInvitation(token.trim());
      setAcceptSuccess('Invitation successfully accepted! Switching context...');
      refreshTenantState();
      setTimeout(() => {
        setIsOnboardingOpen(false);
        setToken('');
        setAcceptSuccess(null);
      }, 1500);
    } catch (err: any) {
      setAcceptError(err.message || 'Invalid or expired invitation token');
    }
  };

  const sampleTokens = [
    { label: 'Jordan Bell (Acme Corp - Member)', token: 'tok-acme-jordan-72819' },
    { label: 'Contractor Dev (TechNova - Guest)', token: 'tok-tech-contractor-91823' },
  ];

  return (
    <div className="modal-overlay animate-fade-in" onClick={() => setIsOnboardingOpen(false)}>
      <div
        className="onboarding-modal-card animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="icon-button modal-close-top"
          onClick={() => setIsOnboardingOpen(false)}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="onboarding-header">
          <div className="brand-badge-center">
            <Sparkles size={20} className="text-blue" />
          </div>
          <h2 className="onboarding-title">Welcome to Drello</h2>
          <p className="onboarding-desc">
            Scale cross-team project execution across independent multi-tenant environments.
          </p>
        </div>

        {/* Tab switch */}
        <div className="segmented-tab-row">
          <button
            className={`segmented-tab-btn ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            <Building2 size={15} />
            <span>Create Organisation</span>
          </button>
          <button
            className={`segmented-tab-btn ${activeTab === 'accept' ? 'active' : ''}`}
            onClick={() => setActiveTab('accept')}
          >
            <KeyRound size={15} />
            <span>Accept Invitation</span>
          </button>
        </div>

        <div className="onboarding-body">
          {activeTab === 'create' ? (
            <form onSubmit={handleCreate} className="onboarding-form animate-fade-in">
              {errorMsg && (
                <div className="error-banner">
                  <AlertCircle size={15} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="form-field">
                <label className="form-label">Company / Organisation Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Acme Corporation"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slug) {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
                    }
                  }}
                  required
                  autoFocus
                />
              </div>

              <div className="form-field">
                <label className="form-label">Workspace URL Slug</label>
                <div className="slug-input-wrapper">
                  <span className="slug-prefix">drello.io/</span>
                  <input
                    type="text"
                    className="form-input slug-field"
                    placeholder="acme-corp"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-field">
                <label className="form-label">Initial Workspace Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                />
              </div>

              <div className="onboarding-footer-cta">
                <button type="submit" className="primary-cta-btn w-full">
                  <span>Create Organisation</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAccept} className="onboarding-form animate-fade-in">
              {acceptSuccess && (
                <div className="success-banner-box">
                  <CheckCircle2 size={18} className="text-emerald" />
                  <span>{acceptSuccess}</span>
                </div>
              )}

              {acceptError && (
                <div className="error-banner">
                  <AlertCircle size={15} />
                  <span>{acceptError}</span>
                </div>
              )}

              <div className="form-field">
                <label className="form-label">Enter Cryptographic Invitation Token</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Paste your 64-char invitation token..."
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="demo-tokens-box">
                <span className="demo-tokens-title">Test Demo Invitation Tokens:</span>
                <div className="token-chips">
                  {sampleTokens.map((st) => (
                    <button
                      key={st.token}
                      type="button"
                      className="token-chip-btn"
                      onClick={() => setToken(st.token)}
                    >
                      <span>{st.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="onboarding-footer-cta">
                <button type="submit" className="primary-cta-btn w-full">
                  <span>Accept Invitation & Join Team</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
