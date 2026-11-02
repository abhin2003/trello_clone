import React from 'react';
import {
  ShieldCheck,
  Users,
  Layers,
  ArrowRight,
  Lock,
  BarChart3,
  Moon,
  Sun,
  Layout,
} from 'lucide-react';
import { Link, useNavigate } from '../../router/Router';
import { useBoard } from '../../context/BoardContext';
import { useAuth } from '../../context/AuthContext';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useBoard();
  const { session, userProfile } = useAuth();

  return (
    <div className="landing-page-wrapper">
      {/* Ambient background glow */}
      <div className="auth-ambient-glow" />

      {/* Top Navigation Bar */}
      <header className="landing-nav-header">
        <div className="landing-nav-container">
          <div className="auth-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <img src="/drello-icon.png" alt="Drello" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
            <span className="brand-title">Drello</span>
            <span className="badge-pill badge-active" style={{ fontSize: '0.7rem' }}>
              Multi-Tenant SaaS
            </span>
          </div>

          <nav className="landing-nav-links">
            <a href="#features" className="nav-link-item">Features</a>
            <a href="#architecture" className="nav-link-item">Architecture</a>
          </nav>

          <div className="landing-nav-actions">
            <button
              className="icon-button"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {session ? (
              <button
                className="primary-cta-btn"
                onClick={() => navigate('/organizations/select')}
              >
                <span>Dashboard ({userProfile?.name || 'Workspace'})</span>
                <ArrowRight size={15} />
              </button>
            ) : (
              <>
                <Link to="/login" className="secondary-btn" style={{ padding: '8px 16px' }}>
                  Sign In
                </Link>
                <Link to="/login" className="primary-cta-btn" style={{ padding: '8px 18px' }}>
                  <span>Get Started</span>
                  <ArrowRight size={15} />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <ShieldCheck size={14} style={{ color: '#3ecf8e' }} />
            <span>Shared PostgreSQL • Strict Row-Level Security • Multi-Tenancy</span>
          </div>

          <h1 className="hero-title">
            Enterprise Visual Project Management for <span className="gradient-text">Modern Organisations</span>
          </h1>

          <p className="hero-subtitle">
            A commercial multi-tenant SaaS platform similar to Trello, built for multiple independent companies.
            Features strict tenant isolation, customizable workspaces, granular RBAC permissions, and real-time Supabase cloud persistence.
          </p>

          <div className="hero-cta-group">
            <Link to="/login" className="primary-cta-btn hero-primary-btn">
              <span>Get Started Free</span>
              <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="secondary-btn hero-secondary-btn">
              <span>Sign In to Organisation</span>
            </Link>
          </div>

          {/* Social Proof Metric Counters */}
          <div className="hero-metrics-strip">
            <div className="hero-metric-item">
              <span className="metric-number">100%</span>
              <span className="metric-label">Data Isolation</span>
            </div>
            <div className="hero-metric-divider" />
            <div className="hero-metric-item">
              <span className="metric-number">4 Roles</span>
              <span className="metric-label">Owner • Admin • Member • Guest</span>
            </div>
            <div className="hero-metric-divider" />
            <div className="hero-metric-item">
              <span className="metric-number">&lt; 50ms</span>
              <span className="metric-label">Live Supabase RLS</span>
            </div>
          </div>
        </div>

        {/* Live UI Preview Mockup */}
        <div className="hero-preview-container">
          <div className="hero-preview-browser-frame">
            <div className="browser-header">
              <div className="browser-dots">
                <span className="dot dot-red" />
                <span className="dot dot-yellow" />
                <span className="dot dot-green" />
              </div>
              <div className="browser-url-bar">
                <Lock size={12} color="#3ecf8e" />
                <span>app.drello.com/org/acme-corp/dashboard</span>
              </div>
            </div>
            <div className="browser-content-mock">
              {/* Mini Board Mockup */}
              <div className="mock-board-layout">
                <div className="mock-column">
                  <div className="mock-col-title">In Progress (3)</div>
                  <div className="mock-card">
                    <div className="mock-card-tag" style={{ background: '#3b82f6' }} />
                    <div className="mock-card-title">Supabase RLS Tenant Policy Audit</div>
                    <div className="mock-card-meta">
                      <span className="mock-pill">Security</span>
                      <span className="mock-avatar">AP</span>
                    </div>
                  </div>
                  <div className="mock-card">
                    <div className="mock-card-tag" style={{ background: '#10b981' }} />
                    <div className="mock-card-title">Q4 Enterprise Roadmap Launch</div>
                    <div className="mock-card-meta">
                      <span className="mock-pill">Planning</span>
                      <span className="mock-avatar">ER</span>
                    </div>
                  </div>
                </div>
                <div className="mock-column">
                  <div className="mock-col-title">Review & QA (2)</div>
                  <div className="mock-card">
                    <div className="mock-card-tag" style={{ background: '#8b5cf6' }} />
                    <div className="mock-card-title">Break-Glass Support Protocol</div>
                    <div className="mock-card-meta">
                      <span className="mock-pill">DevOps</span>
                      <span className="mock-avatar">MV</span>
                    </div>
                  </div>
                </div>
                <div className="mock-column">
                  <div className="mock-col-title">Completed (4)</div>
                  <div className="mock-card mock-completed">
                    <div className="mock-card-tag" style={{ background: '#06b6d4' }} />
                    <div className="mock-card-title">Multi-Organisation Switcher Dropdown</div>
                    <div className="mock-card-meta">
                      <span className="mock-pill">Frontend</span>
                      <span className="mock-avatar">PS</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Section */}
      <section id="features" className="landing-features-section">
        <div className="landing-section-header section-header">
          <span className="section-badge">Core Capabilities</span>
          <h2 className="section-title">Engineered for Commercial Multi-Tenancy</h2>
          <p className="section-subtitle">
            Every organisation operates within its own cryptographic security boundary. Users can belong to multiple organisations with distinct roles without managing multiple accounts.
          </p>
        </div>

        <div id="architecture" className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <Building2FeatureIcon />
            </div>
            <h3 className="feature-title">Multi-Organisation Architecture</h3>
            <p className="feature-desc">
              Organisations own their workspaces, boards, members, usage statistics, and custom branding. Switching organisations is instant.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper" style={{ background: 'rgba(62, 207, 142, 0.1)', color: '#3ecf8e' }}>
              <ShieldCheck size={24} />
            </div>
            <h3 className="feature-title">Database Row-Level Security</h3>
            <p className="feature-desc">
              PostgreSQL 15+ policies enforce that query requests cannot cross tenant boundaries. Unauthorized data access is blocked at the database engine.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
              <Users size={24} />
            </div>
            <h3 className="feature-title">Granular Roles & Quota Triggers</h3>
            <p className="feature-desc">
              Support for Owner, Admin, Member, and Guest roles with automated database triggers that enforce subscription board and member limits.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <Lock size={24} />
            </div>
            <h3 className="feature-title">Break-Glass Support Gateway</h3>
            <p className="feature-desc">
              Platform super-administrators cannot view customer Kanban boards without an explicit support ticket reference and customer-granted session.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper" style={{ background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4' }}>
              <Layout size={24} />
            </div>
            <h3 className="feature-title">Fluid Kanban Experience</h3>
            <p className="feature-desc">
              Preserves the rich visual Kanban drag-and-drop, card checklists, due dates, comment threads, attachments, confetti milestones, and search filters.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              <BarChart3 size={24} />
            </div>
            <h3 className="feature-title">Audit Logs & JSON Export</h3>
            <p className="feature-desc">
              Full compliance telemetry with structured audit logging for all board, member, and permission operations plus 1-click JSON data backup.
            </p>
          </div>
        </div>
      </section>

      {/* Ready to Get Started CTA Section */}
      <section className="landing-features-section" style={{ paddingTop: '20px', paddingBottom: '60px' }}>
        <div className="landing-section-header section-header" style={{
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(59, 130, 246, 0.05))',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          borderRadius: '16px',
          padding: '48px 32px',
          maxWidth: '960px',
          margin: '0 auto',
        }}>
          <span className="section-badge">Get Started Today</span>
          <h2 className="section-title" style={{ fontSize: '2rem' }}>Ready to organize your team?</h2>
          <p className="section-subtitle" style={{ marginBottom: '24px' }}>
            Set up your multi-tenant workspace with isolated databases, full role-based access, and modern visual Kanban boards.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/login" className="primary-cta-btn" style={{ padding: '12px 28px', fontSize: '0.95rem' }}>
              <span>Create Your Organisation</span>
              <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="secondary-btn" style={{ padding: '12px 24px', fontSize: '0.95rem' }}>
              <span>Sign In to Organisation</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-container">
          <div className="footer-left">
            <div className="auth-brand">
              <img src="/drello-icon.png" alt="Drello" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
              <span className="brand-title">Drello</span>
            </div>
            <p className="footer-copy">
              Commercial multi-tenant visual project management platform powered by Supabase.
            </p>
          </div>

          <div className="footer-links-grid">
            <div className="footer-col">
              <h4>Platform</h4>
              <Link to="/login">Sign In / Register</Link>
              <Link to="/forgot-password">Reset Password</Link>
            </div>
            <div className="footer-col">
              <h4>Tenancy</h4>
              <Link to="/organizations/select">Switch Organisation</Link>
              <Link to="/onboarding">Onboarding</Link>
            </div>
            <div className="footer-col">
              <h4>Security</h4>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Row-Level Isolation</span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Break-Glass Audit</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom-strip">
          <span>&copy; {new Date().getFullYear()} Drello. All rights reserved.</span>
          <span style={{ color: '#3ecf8e' }}>PostgreSQL 15+ & Supabase Auth</span>
        </div>
      </footer>
    </div>
  );
};

function Building2FeatureIcon() {
  return <Layers size={24} />;
}
