import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PwaInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already in standalone / installed mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed recently
    const dismissedTime = localStorage.getItem('drello_pwa_dismissed');
    if (dismissedTime && Date.now() - Number(dismissedTime) < 3 * 24 * 60 * 60 * 1000) {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setIsVisible(false);
      setDeferredPrompt(null);
      setIsInstalled(true);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsVisible(false);
      }
    } catch (err) {
      console.warn('PWA prompt failed:', err);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('drello_pwa_dismissed', String(Date.now()));
  };

  if (!isVisible || isInstalled) return null;

  return (
    <div
      className="pwa-install-banner animate-slide-up"
      style={{
        position: 'fixed',
        bottom: '84px',
        right: '20px',
        zIndex: 9999,
        maxWidth: '380px',
        width: 'calc(100% - 40px)',
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))',
        border: '1px solid rgba(59, 130, 246, 0.35)',
        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(59, 130, 246, 0.2)',
        borderRadius: '16px',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        backdropFilter: 'blur(12px)',
      }}
    >
      <img
        src="/drello-icon.png"
        alt="Drello"
        style={{ width: '42px', height: '42px', borderRadius: '10px', flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#f8fafc', fontWeight: 600 }}>
          Install Drello App
        </h4>
        <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
          Fast offline access & native mobile experience
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        <button
          type="button"
          onClick={handleInstallClick}
          style={{
            background: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '7px 12px',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <Download size={14} />
          <span>Install</span>
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          style={{
            background: 'transparent',
            color: '#94a3b8',
            border: 'none',
            borderRadius: '6px',
            padding: '4px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

