import React, { useState, useEffect } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Building2,
  Users,
  Key,
  Copy,
  Check,
  CheckCircle2,
  ArrowRight,
  PlusCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AuthLayout } from './AuthLayout';
import { useRouter, useNavigate, Link } from '../../router/Router';
import { isSupabaseAuthEnabled } from '../../lib/supabase';
import { tenantService } from '../../services/tenantService';

type LoginTab = 'owner' | 'worker';
type OwnerMode = 'signin' | 'create_org';
type WorkerMode = 'join_code' | 'signin';

export const LoginPage: React.FC = () => {
  const {
    login,
    registerOwnerAndCreateOrg,
    registerWorkerAndJoin,
    joinWithCode,
    authError,
    setAuthError,
  } = useAuth();
  const { searchParams } = useRouter();
  const navigate = useNavigate();

  // Tab state
  const initialCode = searchParams.get('code') || '';
  const [activeTab, setActiveTab] = useState<LoginTab>(initialCode ? 'worker' : 'owner');
  const [ownerMode, setOwnerMode] = useState<OwnerMode>('signin');
  const [workerMode, setWorkerMode] = useState<WorkerMode>('join_code');

  // Owner fields
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [orgName, setOrgName] = useState('');

  // Worker fields
  const [joinCode, setJoinCode] = useState(initialCode);
  const [workerName, setWorkerName] = useState('');
  const [workerEmail, setWorkerEmail] = useState('');
  const [workerPassword, setWorkerPassword] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [matchedOrgName, setMatchedOrgName] = useState<string | null>(null);

  // Success view for Owner after creating org
  const [createdOrgData, setCreatedOrgData] = useState<{
    orgName: string;
    joinCode: string;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Check join code dynamically
  useEffect(() => {
    if (!joinCode.trim()) {
      setMatchedOrgName(null);
      return;
    }
    const org = tenantService.findOrgByJoinCode(joinCode.trim());
    if (org) {
      setMatchedOrgName(org.name);
    } else {
      setMatchedOrgName(null);
    }
  }, [joinCode]);

  // Handle Owner Sign-in
  const handleOwnerSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const errors: Record<string, string> = {};

    if (!ownerEmail.trim()) errors.ownerEmail = 'Email is required';
    if (!ownerPassword) errors.ownerPassword = 'Password is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(ownerEmail, ownerPassword);
      if (res.success) {
        const codeToClaim = (searchParams.get('code') || '').trim();
        if (codeToClaim) {
          try {
            const joinRes = await joinWithCode(codeToClaim);
            if (joinRes.success && joinRes.organisation) {
              navigate(`/org/${joinRes.organisation.slug}/dashboard`);
              return;
            }
          } catch (e) {
            console.warn('Auto-claim code on owner sign in notice:', e);
          }
        }
        const redirectParam = searchParams.get('redirect');
        navigate(redirectParam || '/organizations/select');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Owner Create Organisation
  const handleOwnerCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const errors: Record<string, string> = {};

    if (!ownerName.trim()) errors.ownerName = 'Your name is required';
    if (!ownerEmail.trim()) errors.ownerEmail = 'Email is required';
    if (!ownerPassword || ownerPassword.length < 6) {
      errors.ownerPassword = 'Password must be at least 6 characters';
    }
    if (!orgName.trim()) errors.orgName = 'Organisation name is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await registerOwnerAndCreateOrg(ownerName, ownerEmail, ownerPassword, orgName);
      if (res.success && res.joinCode) {
        setCreatedOrgData({
          orgName: orgName.trim(),
          joinCode: res.joinCode,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Worker Join With Code
  const handleWorkerJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const errors: Record<string, string> = {};

    if (!joinCode.trim()) errors.joinCode = 'Organisation joining code is required';
    if (!workerName.trim()) errors.workerName = 'Full name is required';
    if (!workerEmail.trim()) errors.workerEmail = 'Email is required';
    if (!workerPassword || workerPassword.length < 6) {
      errors.workerPassword = 'Password must be at least 6 characters';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await registerWorkerAndJoin(
        workerName,
        workerEmail,
        workerPassword,
        joinCode.trim()
      );
      if (res.success && res.organisation) {
        navigate(`/org/${res.organisation.slug}/dashboard`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Worker Sign-in
  const handleWorkerSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const errors: Record<string, string> = {};

    if (!workerEmail.trim()) errors.workerEmail = 'Email is required';
    if (!workerPassword) errors.workerPassword = 'Password is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(workerEmail, workerPassword);
      if (res.success) {
        const codeToClaim = (joinCode || searchParams.get('code') || '').trim();
        if (codeToClaim) {
          try {
            const joinRes = await joinWithCode(codeToClaim);
            if (joinRes.success && joinRes.organisation) {
              navigate(`/org/${joinRes.organisation.slug}/dashboard`);
              return;
            }
          } catch (e) {
            console.warn('Auto-claim code on worker sign in notice:', e);
          }
        }
        const redirectParam = searchParams.get('redirect');
        navigate(redirectParam || '/organizations/select');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy code helper
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // fallback
    }
  };

  // If Owner just created an organisation, show the congratulations & Join Code screen
  if (createdOrgData) {
    return (
      <AuthLayout
        title="Organisation Ready!"
        subtitle={`"${createdOrgData.orgName}" has been successfully created`}
      >
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
            }}
          >
            <CheckCircle2 size={32} />
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 8px 0' }}>
            Here is your Worker Joining Code
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '0 0 20px 0', lineHeight: 1.5 }}>
            Share this code with your organisation members. They can enter it on the login page to immediately create their accounts and join <strong>{createdOrgData.orgName}</strong>.
          </p>

          <div
            style={{
              background: 'var(--bg-secondary, #1e293b)',
              border: '2px dashed rgba(59, 130, 246, 0.4)',
              borderRadius: '12px',
              padding: '18px 24px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
            }}
          >
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '2rem',
                fontWeight: 800,
                letterSpacing: '0.12em',
                color: '#60a5fa',
              }}
            >
              {createdOrgData.joinCode}
            </span>
            <button
              type="button"
              className="primary-cta-btn"
              onClick={() => copyToClipboard(createdOrgData.joinCode)}
              style={{ padding: '8px 16px', fontSize: '0.88rem' }}
            >
              {copiedCode ? <Check size={16} /> : <Copy size={16} />}
              <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>

          <button
            type="button"
            className="primary-cta-btn"
            style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
            onClick={() => navigate('/organizations/select')}
          >
            <span>Proceed to Workspace & Dashboard</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Stratcrest Flow"
      subtitle="Multi-Tenant SaaS • Organisation & Worker Access"
      footerContent={
        <div style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          {activeTab === 'owner' ? (
            <span>
              Are you a worker or employee?{' '}
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => {
                  setAuthError(null);
                  setActiveTab('worker');
                  setWorkerMode('join_code');
                }}
              >
                Join with a Code &rarr;
              </button>
            </span>
          ) : (
            <span>
              Are you an organisation owner?{' '}
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => {
                  setAuthError(null);
                  setActiveTab('owner');
                }}
              >
                Owner Sign In &rarr;
              </button>
            </span>
          )}
        </div>
      }
    >
      {/* Top Level Mode Tabs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.04)',
          padding: '4px',
          borderRadius: '10px',
          marginBottom: '20px',
          border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
        }}
      >
        <button
          type="button"
          onClick={() => {
            setAuthError(null);
            setActiveTab('owner');
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 14px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            background: activeTab === 'owner' ? 'var(--primary-color, #3b82f6)' : 'transparent',
            color: activeTab === 'owner' ? '#fff' : 'var(--text-secondary)',
          }}
        >
          <Building2 size={16} />
          <span>Organisation Owner</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setAuthError(null);
            setActiveTab('worker');
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 14px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            background: activeTab === 'worker' ? 'var(--primary-color, #3b82f6)' : 'transparent',
            color: activeTab === 'worker' ? '#fff' : 'var(--text-secondary)',
          }}
        >
          <Users size={16} />
          <span>Worker / Join Code</span>
        </button>
      </div>

      {/* Global Error Banner */}
      {authError && (
        <div className="auth-error-banner" role="alert" style={{ marginBottom: '16px' }}>
          <AlertCircle size={16} className="error-icon" />
          <span>{authError}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: ORGANISATION OWNER FLOW                                            */}
      {/* ========================================================================= */}
      {activeTab === 'owner' && (
        <div>
          {/* Submode toggle: Sign in vs Create Org */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))', paddingBottom: '10px' }}>
            <button
              type="button"
              onClick={() => {
                setAuthError(null);
                setOwnerMode('signin');
              }}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '0.85rem',
                fontWeight: ownerMode === 'signin' ? 700 : 500,
                color: ownerMode === 'signin' ? 'var(--primary-color, #3b82f6)' : 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '4px 0',
                borderBottom: ownerMode === 'signin' ? '2px solid var(--primary-color, #3b82f6)' : 'none',
              }}
            >
              Sign In as Owner
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthError(null);
                setOwnerMode('create_org');
              }}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '0.85rem',
                fontWeight: ownerMode === 'create_org' ? 700 : 500,
                color: ownerMode === 'create_org' ? 'var(--primary-color, #3b82f6)' : 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '4px 0',
                borderBottom: ownerMode === 'create_org' ? '2px solid var(--primary-color, #3b82f6)' : 'none',
              }}
            >
              + Create New Organisation
            </button>
          </div>

          {/* Quick presets when in local testing mode */}
          {!isSupabaseAuthEnabled() && ownerMode === 'signin' && (
            <div
              style={{
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                borderRadius: '10px',
                padding: '10px 12px',
                marginBottom: '16px',
                fontSize: '0.8rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#60a5fa', marginBottom: '6px' }}>
                <Sparkles size={14} />
                <span>Quick Test Owner Preset</span>
              </div>
              <button
                type="button"
                className="secondary-btn"
                style={{ width: '100%', padding: '6px 10px', fontSize: '0.78rem', justifyContent: 'flex-start', cursor: 'pointer' }}
                onClick={() => {
                  setOwnerEmail('abhinskrishna3@gmail.com');
                  setOwnerPassword('Password@123');
                }}
              >
                👑 <strong>Owner:</strong> abhinskrishna3@gmail.com (Acme Corp • Join Code: ACME-2026)
              </button>
            </div>
          )}

          {ownerMode === 'signin' ? (
            <form onSubmit={handleOwnerSignIn} className="auth-form" noValidate>
              <div className="form-group auth-field-group">
                <label className="form-label" htmlFor="owner-email">
                  Owner Email Address
                </label>
                <div className="input-with-icon">
                  <Mail size={17} className="input-icon" />
                  <input
                    id="owner-email"
                    type="email"
                    className={`form-input ${formErrors.ownerEmail ? 'input-error' : ''}`}
                    placeholder="owner@company.com"
                    value={ownerEmail}
                    onChange={(e) => {
                      setOwnerEmail(e.target.value);
                      if (formErrors.ownerEmail) setFormErrors((prev) => ({ ...prev, ownerEmail: '' }));
                    }}
                    required
                  />
                </div>
                {formErrors.ownerEmail && <span className="field-error-text">{formErrors.ownerEmail}</span>}
              </div>

              <div className="form-group auth-field-group">
                <div className="label-with-action">
                  <label className="form-label" htmlFor="owner-password">
                    Password
                  </label>
                  <Link to="/forgot-password" className="forgot-link-btn">
                    Forgot password?
                  </Link>
                </div>
                <div className="input-with-icon">
                  <Lock size={17} className="input-icon" />
                  <input
                    id="owner-password"
                    type={showPassword ? 'text' : 'password'}
                    className={`form-input ${formErrors.ownerPassword ? 'input-error' : ''}`}
                    placeholder="••••••••••••"
                    value={ownerPassword}
                    onChange={(e) => {
                      setOwnerPassword(e.target.value);
                      if (formErrors.ownerPassword) setFormErrors((prev) => ({ ...prev, ownerPassword: '' }));
                    }}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-password-btn"
                    onClick={() => setShowPassword((prev) => !prev)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {formErrors.ownerPassword && <span className="field-error-text">{formErrors.ownerPassword}</span>}
              </div>

              <button
                type="submit"
                className="primary-cta-btn auth-submit-btn"
                disabled={isSubmitting}
                style={{ marginTop: '8px' }}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={16} className="spin-animation" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={16} />
                    <span>Log In as Owner</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOwnerCreateOrg} className="auth-form" noValidate>
              <div className="form-group auth-field-group">
                <label className="form-label" htmlFor="owner-name-input">
                  Your Full Name
                </label>
                <input
                  id="owner-name-input"
                  type="text"
                  className={`form-input ${formErrors.ownerName ? 'input-error' : ''}`}
                  placeholder="Jane Smith"
                  value={ownerName}
                  onChange={(e) => {
                    setOwnerName(e.target.value);
                    if (formErrors.ownerName) setFormErrors((prev) => ({ ...prev, ownerName: '' }));
                  }}
                  required
                />
                {formErrors.ownerName && <span className="field-error-text">{formErrors.ownerName}</span>}
              </div>

              <div className="form-group auth-field-group">
                <label className="form-label" htmlFor="new-org-name">
                  Organisation Name
                </label>
                <div className="input-with-icon">
                  <Building2 size={17} className="input-icon" />
                  <input
                    id="new-org-name"
                    type="text"
                    className={`form-input ${formErrors.orgName ? 'input-error' : ''}`}
                    placeholder="e.g. Acme Corporation"
                    value={orgName}
                    onChange={(e) => {
                      setOrgName(e.target.value);
                      if (formErrors.orgName) setFormErrors((prev) => ({ ...prev, orgName: '' }));
                    }}
                    required
                  />
                </div>
                {formErrors.orgName && <span className="field-error-text">{formErrors.orgName}</span>}
              </div>

              <div className="form-group auth-field-group">
                <label className="form-label" htmlFor="owner-reg-email">
                  Your Owner Email Address
                </label>
                <div className="input-with-icon">
                  <Mail size={17} className="input-icon" />
                  <input
                    id="owner-reg-email"
                    type="email"
                    className={`form-input ${formErrors.ownerEmail ? 'input-error' : ''}`}
                    placeholder="owner@mycompany.com"
                    value={ownerEmail}
                    onChange={(e) => {
                      setOwnerEmail(e.target.value);
                      if (formErrors.ownerEmail) setFormErrors((prev) => ({ ...prev, ownerEmail: '' }));
                    }}
                    required
                  />
                </div>
                {formErrors.ownerEmail && <span className="field-error-text">{formErrors.ownerEmail}</span>}
              </div>

              <div className="form-group auth-field-group">
                <label className="form-label" htmlFor="owner-reg-password">
                  Password
                </label>
                <div className="input-with-icon">
                  <Lock size={17} className="input-icon" />
                  <input
                    id="owner-reg-password"
                    type={showPassword ? 'text' : 'password'}
                    className={`form-input ${formErrors.ownerPassword ? 'input-error' : ''}`}
                    placeholder="••••••••••••"
                    value={ownerPassword}
                    onChange={(e) => {
                      setOwnerPassword(e.target.value);
                      if (formErrors.ownerPassword) setFormErrors((prev) => ({ ...prev, ownerPassword: '' }));
                    }}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-password-btn"
                    onClick={() => setShowPassword((prev) => !prev)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {formErrors.ownerPassword && <span className="field-error-text">{formErrors.ownerPassword}</span>}
              </div>

              <button
                type="submit"
                className="primary-cta-btn auth-submit-btn"
                disabled={isSubmitting}
                style={{ marginTop: '8px' }}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={16} className="spin-animation" />
                    <span>Creating Organisation...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle size={16} />
                    <span>Create Organisation & Get Join Code</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: WORKER LOGIN / JOIN WITH CODE FLOW                                */}
      {/* ========================================================================= */}
      {activeTab === 'worker' && (
        <div>
          {/* Submode toggle: Join with Code vs Sign in */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))', paddingBottom: '10px' }}>
            <button
              type="button"
              onClick={() => {
                setAuthError(null);
                setWorkerMode('join_code');
              }}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '0.85rem',
                fontWeight: workerMode === 'join_code' ? 700 : 500,
                color: workerMode === 'join_code' ? 'var(--primary-color, #3b82f6)' : 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '4px 0',
                borderBottom: workerMode === 'join_code' ? '2px solid var(--primary-color, #3b82f6)' : 'none',
              }}
            >
              Join with Code (New Worker)
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthError(null);
                setWorkerMode('signin');
              }}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '0.85rem',
                fontWeight: workerMode === 'signin' ? 700 : 500,
                color: workerMode === 'signin' ? 'var(--primary-color, #3b82f6)' : 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '4px 0',
                borderBottom: workerMode === 'signin' ? '2px solid var(--primary-color, #3b82f6)' : 'none',
              }}
            >
              Already a Member? Sign In
            </button>
          </div>

          {workerMode === 'join_code' ? (
            <form onSubmit={handleWorkerJoin} className="auth-form" noValidate>
              {/* Join Code Input */}
              <div className="form-group auth-field-group">
                <label className="form-label" htmlFor="worker-join-code">
                  Organisation Joining Code
                </label>
                <div className="input-with-icon">
                  <Key size={17} className="input-icon" />
                  <input
                    id="worker-join-code"
                    type="text"
                    className={`form-input ${formErrors.joinCode ? 'input-error' : ''}`}
                    placeholder="e.g. ACME-2026"
                    value={joinCode}
                    onChange={(e) => {
                      setJoinCode(e.target.value.toUpperCase());
                      if (formErrors.joinCode) setFormErrors((prev) => ({ ...prev, joinCode: '' }));
                    }}
                    style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 600, letterSpacing: '0.05em' }}
                    required
                  />
                </div>
                {matchedOrgName ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '0.78rem', marginTop: '4px' }}>
                    <Check size={14} />
                    <span>Organisation found: <strong>{matchedOrgName}</strong></span>
                  </div>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                    Tip: Ask your organisation owner for this code (e.g. <code>ACME-2026</code>)
                  </span>
                )}
                {formErrors.joinCode && <span className="field-error-text">{formErrors.joinCode}</span>}
              </div>

              {/* Worker Name */}
              <div className="form-group auth-field-group">
                <label className="form-label" htmlFor="worker-name">
                  Your Full Name
                </label>
                <input
                  id="worker-name"
                  type="text"
                  className={`form-input ${formErrors.workerName ? 'input-error' : ''}`}
                  placeholder="e.g. Alex Rivera"
                  value={workerName}
                  onChange={(e) => {
                    setWorkerName(e.target.value);
                    if (formErrors.workerName) setFormErrors((prev) => ({ ...prev, workerName: '' }));
                  }}
                  required
                />
                {formErrors.workerName && <span className="field-error-text">{formErrors.workerName}</span>}
              </div>

              {/* Worker Email */}
              <div className="form-group auth-field-group">
                <label className="form-label" htmlFor="worker-email">
                  Your Worker Email Address
                </label>
                <div className="input-with-icon">
                  <Mail size={17} className="input-icon" />
                  <input
                    id="worker-email"
                    type="email"
                    className={`form-input ${formErrors.workerEmail ? 'input-error' : ''}`}
                    placeholder="alex@example.com"
                    value={workerEmail}
                    onChange={(e) => {
                      setWorkerEmail(e.target.value);
                      if (formErrors.workerEmail) setFormErrors((prev) => ({ ...prev, workerEmail: '' }));
                    }}
                    required
                  />
                </div>
                {formErrors.workerEmail && <span className="field-error-text">{formErrors.workerEmail}</span>}
              </div>

              {/* Worker Password */}
              <div className="form-group auth-field-group">
                <label className="form-label" htmlFor="worker-password">
                  Create Password
                </label>
                <div className="input-with-icon">
                  <Lock size={17} className="input-icon" />
                  <input
                    id="worker-password"
                    type={showPassword ? 'text' : 'password'}
                    className={`form-input ${formErrors.workerPassword ? 'input-error' : ''}`}
                    placeholder="••••••••••••"
                    value={workerPassword}
                    onChange={(e) => {
                      setWorkerPassword(e.target.value);
                      if (formErrors.workerPassword) setFormErrors((prev) => ({ ...prev, workerPassword: '' }));
                    }}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-password-btn"
                    onClick={() => setShowPassword((prev) => !prev)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {formErrors.workerPassword && <span className="field-error-text">{formErrors.workerPassword}</span>}
              </div>

              <button
                type="submit"
                className="primary-cta-btn auth-submit-btn"
                disabled={isSubmitting}
                style={{ marginTop: '8px' }}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={16} className="spin-animation" />
                    <span>Joining Organisation...</span>
                  </>
                ) : (
                  <>
                    <ArrowRight size={16} />
                    <span>Join Organisation & Enter</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleWorkerSignIn} className="auth-form" noValidate>
              <div className="form-group auth-field-group">
                <label className="form-label" htmlFor="worker-signin-email">
                  Worker Email Address
                </label>
                <div className="input-with-icon">
                  <Mail size={17} className="input-icon" />
                  <input
                    id="worker-signin-email"
                    type="email"
                    className={`form-input ${formErrors.workerEmail ? 'input-error' : ''}`}
                    placeholder="worker@example.com"
                    value={workerEmail}
                    onChange={(e) => {
                      setWorkerEmail(e.target.value);
                      if (formErrors.workerEmail) setFormErrors((prev) => ({ ...prev, workerEmail: '' }));
                    }}
                    required
                  />
                </div>
                {formErrors.workerEmail && <span className="field-error-text">{formErrors.workerEmail}</span>}
              </div>

              <div className="form-group auth-field-group">
                <div className="label-with-action">
                  <label className="form-label" htmlFor="worker-signin-password">
                    Password
                  </label>
                  <Link to="/forgot-password" className="forgot-link-btn">
                    Forgot password?
                  </Link>
                </div>
                <div className="input-with-icon">
                  <Lock size={17} className="input-icon" />
                  <input
                    id="worker-signin-password"
                    type={showPassword ? 'text' : 'password'}
                    className={`form-input ${formErrors.workerPassword ? 'input-error' : ''}`}
                    placeholder="••••••••••••"
                    value={workerPassword}
                    onChange={(e) => {
                      setWorkerPassword(e.target.value);
                      if (formErrors.workerPassword) setFormErrors((prev) => ({ ...prev, workerPassword: '' }));
                    }}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-password-btn"
                    onClick={() => setShowPassword((prev) => !prev)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {formErrors.workerPassword && <span className="field-error-text">{formErrors.workerPassword}</span>}
              </div>

              <button
                type="submit"
                className="primary-cta-btn auth-submit-btn"
                disabled={isSubmitting}
                style={{ marginTop: '8px' }}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={16} className="spin-animation" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={16} />
                    <span>Sign In to Organisation</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}
    </AuthLayout>
  );
};
