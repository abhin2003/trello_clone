import React from 'react';
import { ServerCrash, RefreshCw, Home } from 'lucide-react';
import { Link } from '../../router/Router';

interface ServerErrorPageProps {
  error?: Error | string | null;
  resetError?: () => void;
}

export const ServerErrorPage: React.FC<ServerErrorPageProps> = ({ error, resetError }) => {
  const errorMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : null;

  return (
    <div className="auth-page-wrapper">
      <div className="auth-ambient-glow" />
      <div className="auth-card-container">
        <div className="auth-card" style={{ maxWidth: '520px', textAlign: 'center' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '20px',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}
          >
            <ServerCrash size={36} />
          </div>

          <div className="badge-pill badge-danger" style={{ display: 'inline-flex', marginBottom: '1rem' }}>
            HTTP 500 • UNEXPECTED ERROR
          </div>

          <h1 className="auth-card-title" style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
            Internal Server Error
          </h1>
          <p className="auth-card-subtitle" style={{ fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            Something went wrong while processing your request. Our team has been notified.
          </p>

          {errorMessage && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                marginBottom: '1.5rem',
                fontSize: '0.82rem',
                color: '#ef4444',
                fontFamily: 'monospace',
                textAlign: 'left',
                overflowX: 'auto',
              }}
            >
              {errorMessage}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                if (resetError) resetError();
                else window.location.reload();
              }}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <RefreshCw size={16} />
              <span>Retry Request</span>
            </button>
            <Link
              to="/"
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Home size={16} />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
