import React from 'react';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import { Link } from '../../router/Router';

export const NotFoundPage: React.FC = () => {

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
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}
          >
            <FileQuestion size={36} />
          </div>

          <div className="badge-pill badge-danger" style={{ display: 'inline-flex', marginBottom: '1rem' }}>
            HTTP 404
          </div>

          <h1 className="auth-card-title" style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
            Page Not Found
          </h1>
          <p className="auth-card-subtitle" style={{ fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            The page or resource you are looking for doesn't exist, has been removed, or is temporarily unavailable.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => window.history.back()}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <ArrowLeft size={16} />
              <span>Go Back</span>
            </button>
            <Link
              to="/"
              className="btn btn-primary"
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
