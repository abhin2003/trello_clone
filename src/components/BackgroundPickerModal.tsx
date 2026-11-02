import React from 'react';
import { useBoard } from '../context/BoardContext';
import { BACKGROUND_PRESETS } from '../data/initialData';
import { X, Palette, Check } from 'lucide-react';

export const BackgroundPickerModal: React.FC = () => {
  const { isBgPickerOpen, setIsBgPickerOpen, activeBoard, setBoardBackground } = useBoard();

  if (!isBgPickerOpen) return null;

  return (
    <div className="modal-backdrop animate-fade-in" onClick={() => setIsBgPickerOpen(false)}>
      <div className="bg-picker-dialog animate-scale-up" onClick={(e) => e.stopPropagation()}>
        <div className="modal-dialog-header">
          <div className="dialog-title-group">
            <Palette size={18} />
            <h3>Change Board Theme</h3>
          </div>
          <button
            className="icon-button close-btn"
            onClick={() => setIsBgPickerOpen(false)}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="dialog-body">
          <span className="popover-subhead">Curated Gradients & Themes</span>
          <div className="bg-presets-detailed-grid">
            {BACKGROUND_PRESETS.map((preset, idx) => {
              const isCurrent = activeBoard.background.value === preset.value;
              return (
                <div
                  key={idx}
                  className={`bg-preset-card ${isCurrent ? 'active' : ''}`}
                  onClick={() => {
                    setBoardBackground(preset);
                  }}
                >
                  <div
                    className="bg-card-preview"
                    style={{ background: preset.value }}
                  >
                    {isCurrent && <Check size={18} className="bg-card-check" />}
                  </div>
                  <span className="bg-card-name">{preset.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="dialog-footer">
          <button className="primary-btn full-width" onClick={() => setIsBgPickerOpen(false)}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
