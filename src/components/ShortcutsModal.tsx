import React from 'react';
import { useBoard } from '../context/BoardContext';
import { X, Keyboard } from 'lucide-react';

export const ShortcutsModal: React.FC = () => {
  const { isShortcutsOpen, setIsShortcutsOpen } = useBoard();

  if (!isShortcutsOpen) return null;

  const SHORTCUTS = [
    { key: 'B', desc: 'Toggle boards drawer' },
    { key: 'F', desc: 'Open card search & filter modal' },
    { key: '?', desc: 'Toggle keyboard shortcuts guide' },
    { key: 'Esc', desc: 'Close open dialogs or card modal' },
    { key: 'Enter', desc: 'Submit and save item in inline composers' },
  ];

  return (
    <div className="modal-backdrop animate-fade-in" onClick={() => setIsShortcutsOpen(false)}>
      <div className="shortcuts-dialog animate-scale-up" onClick={(e) => e.stopPropagation()}>
        <div className="modal-dialog-header">
          <div className="dialog-title-group">
            <Keyboard size={18} />
            <h3>Keyboard Shortcuts</h3>
          </div>
          <button
            className="icon-button close-btn"
            onClick={() => setIsShortcutsOpen(false)}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="dialog-body">
          <div className="shortcuts-table">
            {SHORTCUTS.map((s, idx) => (
              <div key={idx} className="shortcut-row">
                <span className="shortcut-desc">{s.desc}</span>
                <kbd className="shortcut-key">{s.key}</kbd>
              </div>
            ))}
          </div>
        </div>

        <div className="dialog-footer">
          <button className="primary-btn full-width" onClick={() => setIsShortcutsOpen(false)}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
