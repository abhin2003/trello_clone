import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  ExternalLink,
  ShieldCheck,
  Key,
  Globe,
  Radio,
  Server,
} from 'lucide-react';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  testSupabaseConnection,
} from '../lib/supabase';
import { supabaseDataService, type SchemaInspection } from '../services/supabaseDataService';
import { useTenant } from '../context/TenantContext';
import { useBoard } from '../context/BoardContext';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({ isOpen, onClose }) => {
  const { allOrganisations, workspaces } = useTenant();
  const { boards } = useBoard();

  const [activeTab, setActiveTab] = useState<'config' | 'migration' | 'sync'>('config');

  // Credentials State
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [configSource, setConfigSource] = useState<'env' | 'custom' | 'none'>('none');

  // Connection testing state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
  } | null>(null);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [schemaInspection, setSchemaInspection] = useState<SchemaInspection | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);

  // Migration copy state
  const [copiedMigration, setCopiedMigration] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const cfg = getSupabaseConfig();
      setUrl(cfg.url);
      setAnonKey(cfg.anonKey);
      setConfigSource(cfg.source);
      setTestResult(null);
      setSyncFeedback(null);
      if (cfg.isConfigured) {
        checkSchema();
      }
    }
  }, [isOpen]);

  const checkSchema = async () => {
    setIsInspecting(true);
    try {
      const inspection = await supabaseDataService.inspectSchema();
      setSchemaInspection(inspection);
    } finally {
      setIsInspecting(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection(url, anonKey);
      setTestResult({
        success: res.success,
        message: res.message,
        latencyMs: res.latencyMs,
      });
      if (res.success) {
        checkSchema();
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveAndConnect = async () => {
    if (!url.trim() || !anonKey.trim()) {
      setTestResult({
        success: false,
        message: 'Please provide both Supabase Project URL and Anon Public Key.',
      });
      return;
    }

    saveSupabaseConfig(url, anonKey);
    setConfigSource('custom');
    await handleTestConnection();
  };

  const handleDisconnect = () => {
    clearSupabaseConfig();
    const cfg = getSupabaseConfig();
    setUrl(cfg.url);
    setAnonKey(cfg.anonKey);
    setConfigSource(cfg.source);
    setTestResult({
      success: false,
      message: 'Disconnected from custom Supabase. Application returned to Local Offline Demo mode.',
    });
    setSchemaInspection(null);
  };

  const handleCopyMigration = async () => {
    try {
      // Fetch migration file or use known path
      const migrationRes = await fetch('/supabase/migrations/20261101_init_multi_tenant_saas.sql');
      let sql = '';
      if (migrationRes.ok) {
        sql = await migrationRes.text();
      } else {
        sql = `-- Multi-tenant SaaS Migration\n-- File located at: supabase/migrations/20261101_init_multi_tenant_saas.sql in the project root.`;
      }
      await navigator.clipboard.writeText(sql);
      setCopiedMigration(true);
      setTimeout(() => setCopiedMigration(false), 2500);
    } catch {
      // Fallback message
      navigator.clipboard.writeText(
        `-- Please view and copy the full SQL script from: supabase/migrations/20261101_init_multi_tenant_saas.sql`
      );
      setCopiedMigration(true);
      setTimeout(() => setCopiedMigration(false), 2500);
    }
  };

  const handlePushDemoData = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const report = await supabaseDataService.pushDemoData(allOrganisations, workspaces, boards);
      setSyncFeedback(report.message);
      checkSchema();
    } catch (err: any) {
      setSyncFeedback(err?.message || 'Failed to sync demo data.');
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isOpen) return null;

  const isConfigured = Boolean(url && anonKey && url.startsWith('https://') && anonKey.length > 20);

  return (
    <div className="modal-overlay saas-modal-overlay" onClick={onClose}>
      <div
        className="modal-container saas-modal-container supabase-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '780px' }}
      >
        {/* Modal Header */}
        <div className="modal-header supabase-modal-header">
          <div className="modal-title-with-icon">
            <div className="supabase-brand-icon-wrapper">
              <Database size={22} className="supabase-brand-icon" />
            </div>
            <div>
              <div className="title-row">
                <h2>Supabase Cloud & Local Integration</h2>
                {isConfigured ? (
                  <span className="badge-pill badge-active" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Radio size={12} className="live-pulse" />
                    Live Supabase
                  </span>
                ) : (
                  <span className="badge-pill badge-neutral">Offline Demo Mode</span>
                )}
              </div>
              <p className="modal-subtitle">
                Shared PostgreSQL infrastructure with strict multi-tenant Row-Level Security (RLS)
              </p>
            </div>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="saas-admin-tabs" style={{ padding: '0 1.5rem', marginTop: '0.75rem' }}>
          <button
            className={`admin-tab-btn ${activeTab === 'config' ? 'active' : ''}`}
            onClick={() => setActiveTab('config')}
          >
            <Server size={16} />
            <span>Connection & Keys</span>
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'migration' ? 'active' : ''}`}
            onClick={() => setActiveTab('migration')}
          >
            <ShieldCheck size={16} />
            <span>SQL Migration & RLS</span>
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'sync' ? 'active' : ''}`}
            onClick={() => setActiveTab('sync')}
          >
            <UploadCloud size={16} />
            <span>Data Sync & Seeding</span>
          </button>
        </div>

        <div className="modal-body" style={{ padding: '1.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
          {/* TAB 1: CONNECTION & KEYS */}
          {activeTab === 'config' && (
            <div className="supabase-tab-content">
              <div className="callout-card" style={{ marginBottom: '1.25rem', background: 'rgba(62, 207, 142, 0.08)', borderColor: 'rgba(62, 207, 142, 0.3)' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Database size={20} style={{ color: '#3ecf8e', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ color: '#3ecf8e' }}>Dual-Mode Multi-Tenant Architecture</strong>
                    <p style={{ fontSize: '0.875rem', marginTop: '4px', color: 'var(--text-secondary)' }}>
                      Connect directly to your Supabase project by entering your credentials below or by configuring <code style={{ color: '#3ecf8e' }}>.env</code>. You can switch between live Supabase cloud and local offline demo mode at any time.
                    </p>
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Globe size={15} />
                  <span>Supabase Project URL</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="https://your-project-id.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
                />
                <span className="field-hint" style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  Found in your Supabase Dashboard under <strong>Project Settings → API → Project URL</strong>
                </span>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Key size={15} />
                  <span>Supabase Anon Public API Key (anon / public)</span>
                </label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                />
                <span className="field-hint" style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  Found in your Supabase Dashboard under <strong>Project Settings → API → Project API keys (anon public)</strong>
                </span>
              </div>

              {/* Source & Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Config Source:{' '}
                  <strong>
                    {configSource === 'custom'
                      ? 'Browser Storage (Active)'
                      : configSource === 'env'
                      ? '.env File'
                      : 'None (Local In-Memory)'}
                  </strong>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {configSource === 'custom' && (
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={handleDisconnect}
                      style={{ color: '#ef4444' }}
                    >
                      Disconnect
                    </button>
                  )}
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={handleTestConnection}
                    disabled={isTesting || !url || !anonKey}
                  >
                    {isTesting ? <RefreshCw size={15} className="spin-animation" /> : <RefreshCw size={15} />}
                    <span>Test Connection</span>
                  </button>
                  <button
                    type="button"
                    className="primary-cta-btn"
                    onClick={handleSaveAndConnect}
                    disabled={isTesting || !url || !anonKey}
                    style={{ background: '#3ecf8e', borderColor: '#3ecf8e', color: '#091510' }}
                  >
                    <Check size={16} />
                    <span>Save & Connect</span>
                  </button>
                </div>
              </div>

              {/* Test Result Feedback */}
              {testResult && (
                <div
                  className="callout-card"
                  style={{
                    marginTop: '1.25rem',
                    background: testResult.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    borderColor: testResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    {testResult.success ? (
                      <CheckCircle2 size={18} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                    ) : (
                      <AlertCircle size={18} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
                    )}
                    <div>
                      <strong style={{ color: testResult.success ? '#10b981' : '#ef4444' }}>
                        {testResult.success ? 'Connection Successful' : 'Connection Failed'}
                        {testResult.latencyMs ? ` (${testResult.latencyMs} ms)` : ''}
                      </strong>
                      <p style={{ fontSize: '0.85rem', marginTop: '4px', color: 'var(--text-secondary)' }}>
                        {testResult.message}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SQL MIGRATION & RLS */}
          {activeTab === 'migration' && (
            <div className="supabase-tab-content">
              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem' }}>Multi-Tenant Database Migration</h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Our production-ready migration script sets up all 19 database tables, PostgreSQL enums, triggers for quota enforcement, and complete Row-Level Security (RLS) policies.
                </p>
              </div>

              <div className="migration-steps-box" style={{ background: 'var(--surface-color)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
                <h5 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  How to Apply the Migration in Supabase:
                </h5>
                <ol style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <li>
                    Open your Supabase Project Dashboard:{' '}
                    <a
                      href="https://supabase.com/dashboard"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#3ecf8e', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      supabase.com/dashboard <ExternalLink size={12} />
                    </a>
                  </li>
                  <li>In the left sidebar, click on <strong>SQL Editor</strong>.</li>
                  <li>Click <strong>+ New Query</strong> in the top menu.</li>
                  <li>Copy the migration script below and paste it into the editor.</li>
                  <li>Click <strong>Run</strong> (or press Cmd/Ctrl + Enter) to execute.</li>
                </ol>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  File: <code style={{ color: '#3ecf8e' }}>supabase/migrations/20261101_init_multi_tenant_saas.sql</code>
                </span>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={handleCopyMigration}
                  style={{ background: copiedMigration ? '#10b981' : undefined, color: copiedMigration ? '#ffffff' : undefined }}
                >
                  {copiedMigration ? <Check size={15} /> : <Copy size={15} />}
                  <span>{copiedMigration ? 'Copied to Clipboard!' : 'Copy Migration SQL'}</span>
                </button>
              </div>

              {/* Schema Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginTop: '1rem' }}>
                <div className="metric-card" style={{ padding: '0.75rem' }}>
                  <div className="metric-label" style={{ fontSize: '0.75rem' }}>Tables & Schemas</div>
                  <div className="metric-val" style={{ fontSize: '1.2rem', color: '#3ecf8e' }}>19 Tables</div>
                  <div className="metric-sub" style={{ fontSize: '0.75rem' }}>Orgs, Workspaces, Boards, Cards</div>
                </div>
                <div className="metric-card" style={{ padding: '0.75rem' }}>
                  <div className="metric-label" style={{ fontSize: '0.75rem' }}>Security Policies</div>
                  <div className="metric-val" style={{ fontSize: '1.2rem', color: '#3b82f6' }}>14 RLS Policies</div>
                  <div className="metric-sub" style={{ fontSize: '0.75rem' }}>Strict Tenant & Role Isolation</div>
                </div>
                <div className="metric-card" style={{ padding: '0.75rem' }}>
                  <div className="metric-label" style={{ fontSize: '0.75rem' }}>Backend Automations</div>
                  <div className="metric-val" style={{ fontSize: '1.2rem', color: '#8b5cf6' }}>2 Quota Triggers</div>
                  <div className="metric-sub" style={{ fontSize: '0.75rem' }}>Board & Member Limit Enforcement</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SYNC & DATA SEEDING */}
          {activeTab === 'sync' && (
            <div className="supabase-tab-content">
              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem' }}>Seed & Synchronize Tenant Data</h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Easily push the default multi-tenant organizations, workspaces, and demo Kanban boards directly into your Supabase database so you can start testing immediately.
                </p>
              </div>

              {/* Schema Readiness Status */}
              <div className="callout-card" style={{ marginBottom: '1.25rem', background: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '0.9rem' }}>Supabase Table Readiness</strong>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={checkSchema}
                    title="Refresh Table Check"
                    disabled={isInspecting}
                  >
                    <RefreshCw size={14} className={isInspecting ? 'spin-animation' : ''} />
                  </button>
                </div>

                {schemaInspection ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {schemaInspection.hasSubscriptionPlans ? (
                        <CheckCircle2 size={14} color="#10b981" />
                      ) : (
                        <AlertCircle size={14} color="#f59e0b" />
                      )}
                      <span>subscription_plans</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {schemaInspection.hasOrganisations ? (
                        <CheckCircle2 size={14} color="#10b981" />
                      ) : (
                        <AlertCircle size={14} color="#f59e0b" />
                      )}
                      <span>organisations</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {schemaInspection.hasWorkspaces ? (
                        <CheckCircle2 size={14} color="#10b981" />
                      ) : (
                        <AlertCircle size={14} color="#f59e0b" />
                      )}
                      <span>workspaces</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {schemaInspection.hasBoards ? (
                        <CheckCircle2 size={14} color="#10b981" />
                      ) : (
                        <AlertCircle size={14} color="#f59e0b" />
                      )}
                      <span>boards</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {schemaInspection.hasLists ? (
                        <CheckCircle2 size={14} color="#10b981" />
                      ) : (
                        <AlertCircle size={14} color="#f59e0b" />
                      )}
                      <span>lists</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {schemaInspection.hasCards ? (
                        <CheckCircle2 size={14} color="#10b981" />
                      ) : (
                        <AlertCircle size={14} color="#f59e0b" />
                      )}
                      <span>cards</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
                    Connect to Supabase in the "Connection & Keys" tab to inspect table status.
                  </div>
                )}
              </div>

              {/* Action Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="setting-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--surface-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div>
                    <h5 style={{ margin: '0 0 4px 0', fontSize: '0.95rem' }}>Push Demo Tenants & Boards to Supabase</h5>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Seeds Acme Corp, TechNova Solutions, Drello Labs, plus active boards, lists, and cards into your Supabase database.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="primary-cta-btn"
                    onClick={handlePushDemoData}
                    disabled={isSyncing || !isConfigured}
                    style={{ background: '#3ecf8e', borderColor: '#3ecf8e', color: '#091510', flexShrink: 0 }}
                  >
                    {isSyncing ? <RefreshCw size={15} className="spin-animation" /> : <UploadCloud size={15} />}
                    <span>{isSyncing ? 'Pushing...' : 'Push to Supabase'}</span>
                  </button>
                </div>

                <div className="setting-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--surface-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div>
                    <h5 style={{ margin: '0 0 4px 0', fontSize: '0.95rem' }}>Pull Data from Supabase</h5>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Fetches live organisations and boards stored in your Supabase database into the current session.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={async () => {
                      setIsSyncing(true);
                      setSyncFeedback(null);
                      try {
                        const res = await supabaseDataService.pullDataFromSupabase();
                        setSyncFeedback(res.message);
                      } finally {
                        setIsSyncing(false);
                      }
                    }}
                    disabled={isSyncing || !isConfigured}
                    style={{ flexShrink: 0 }}
                  >
                    <DownloadCloud size={15} />
                    <span>Pull from Supabase</span>
                  </button>
                </div>
              </div>

              {/* Sync Feedback Message */}
              {syncFeedback && (
                <div
                  className="callout-card"
                  style={{
                    marginTop: '1.25rem',
                    background: 'rgba(62, 207, 142, 0.1)',
                    borderColor: 'rgba(62, 207, 142, 0.3)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                  }}
                >
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <CheckCircle2 size={16} color="#3ecf8e" />
                    <span>{syncFeedback}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
            <Database size={14} color="#3ecf8e" />
            <span>PostgreSQL 15+ & Row-Level Security</span>
          </div>
          <button type="button" className="secondary-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
