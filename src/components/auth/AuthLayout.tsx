import React from 'react';
import { Kanban, ShieldCheck, Moon, Sun } from 'lucide-react';
import { useBoard } from '../../context/BoardContext';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footerContent?: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  title,
  subtitle,
  children,
  footerContent,
}) => {
  const { theme, toggleTheme } = useBoard();

  return (
    <div className="auth-page-wrapper">
      {/* Background ambient lighting */}
      <div className="auth-ambient-glow" />

      {/* Top Header with Brand and Theme Switcher */}
      <header className="auth-top-header">
        <div className="auth-brand">
          <div className="brand-logo-icon">
            <Kanban size={20} />
          </div>
          <span className="brand-title">Stratcrest Flow</span>
          <span className="badge-pill badge-active" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
            SaaS Platform
          </span>
        </div>

        <button
          className="icon-button"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      {/* Main Authentication Card */}
      <main className="auth-card-container">
        <div className="auth-card">
          <div className="auth-card-header">
            <h1 className="auth-card-title">{title}</h1>
            <p className="auth-card-subtitle">{subtitle}</p>
          </div>

          <div className="auth-card-body">{children}</div>

          {footerContent && <div className="auth-card-footer">{footerContent}</div>}
        </div>

        {/* Security badge footer */}
        <div className="auth-security-footer">
          <ShieldCheck size={14} className="security-shield-icon" />
          <span>Multi-Tenant Enterprise Security with Supabase Auth & Row-Level Isolation</span>
        </div>
      </main>
    </div>
  );
};
