import React, { useState, useEffect, useRef } from 'react';
import { useBoard } from '../context/BoardContext';
import { useTenant } from '../context/TenantContext';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Send,
  Smile,
  Paperclip,
  Check,
  CheckCheck,
  Minus,
} from 'lucide-react';

export const ChatWindow: React.FC = () => {
  const {
    activeChatMemberId,
    closeChat,
    chatMessages,
    sendChatMessage,
    broadcastTyping,
    isTyping,
    activeBoard,
  } = useBoard();
  const { members: orgMembers } = useTenant();
  const { userProfile } = useAuth();

  const [inputVal, setInputVal] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<any>(null);

  // Resolve member from organisation members, board members, or fallback
  const orgMember = orgMembers.find(
    (m) => m.userId === activeChatMemberId || m.id === activeChatMemberId
  );
  const boardMember = activeBoard?.members?.find((m) => m.id === activeChatMemberId);

  const member = orgMember
    ? {
        id: orgMember.userId || orgMember.id,
        name: orgMember.user?.name || orgMember.user?.email?.split('@')[0] || 'Team Member',
        avatarColor: orgMember.user?.avatarColor || '#3b82f6',
        initials: orgMember.user?.initials || (orgMember.user?.name ? orgMember.user.name.slice(0, 2).toUpperCase() : 'TM'),
        email: orgMember.user?.email,
        jobTitle: orgMember.jobTitle,
      }
    : boardMember
    ? {
        id: boardMember.id,
        name: boardMember.name,
        avatarColor: boardMember.avatarColor,
        initials: boardMember.initials,
        email: undefined,
        jobTitle: undefined,
      }
    : activeChatMemberId
    ? {
        id: activeChatMemberId,
        name: 'Team Member',
        avatarColor: '#3b82f6',
        initials: 'TM',
        email: undefined,
        jobTitle: undefined,
      }
    : null;

  const myId = userProfile?.id || 'usr-owner';
  const myEmail = (userProfile?.email || '').toLowerCase().trim();
  const targetId = member?.id || activeChatMemberId || '';
  const targetEmail = (member?.email || '').toLowerCase().trim();
  const convKey = [myId.toLowerCase(), targetId.toLowerCase()].sort().join('__');
  const emailConvKey = myEmail && targetEmail ? [myEmail, targetEmail].sort().join('__') : '';

  const messages = activeChatMemberId
    ? chatMessages[convKey] || (emailConvKey ? chatMessages[emailConvKey] : undefined) || chatMessages[targetId] || chatMessages[activeChatMemberId] || []
    : [];

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeChatMemberId && !isMinimized) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [messages, activeChatMemberId, isTyping, isMinimized]);

  if (!activeChatMemberId || !member) return null;

  const isSelf = member.id === userProfile?.id || (member.email && member.email === userProfile?.email);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputVal(e.target.value);
    if (activeChatMemberId) {
      broadcastTyping?.(activeChatMemberId, true);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        broadcastTyping?.(activeChatMemberId, false);
      }, 1400);
    }
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputVal.trim()) return;
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    broadcastTyping?.(activeChatMemberId, false);
    sendChatMessage(activeChatMemberId, inputVal);
    setInputVal('');
    setShowEmojiPicker(false);
  };

  const handleEmojiClick = (emoji: string) => {
    setInputVal((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const EMOJIS = ['😀', '🚀', '👍', '🔥', '✨', '💯', '👏', '🎉', '💼', '✅'];

  return (
    <div className={`whatsapp-chat-container ${isMinimized ? 'minimized' : ''} animate-scale-up`}>
      {/* WhatsApp Header */}
      <div className="wa-header" onClick={() => isMinimized && setIsMinimized(false)}>
        <div className="wa-header-left">
          <div className="wa-avatar-wrapper">
            <div className="wa-avatar" style={{ backgroundColor: member.avatarColor }}>
              {member.initials}
            </div>
            <span className="wa-online-dot" />
          </div>

          <div className="wa-user-info">
            <h4 className="wa-user-name">
              {member.name} {isSelf ? '(You)' : ''}
            </h4>
            <span className="wa-status-text">
              {isTyping ? (
                <span className="typing-green">typing...</span>
              ) : (
                member.jobTitle ? `${member.jobTitle} • online` : 'online'
              )}
            </span>
          </div>
        </div>

        <div className="wa-header-actions" onClick={(e) => e.stopPropagation()}>
          <button
            className="wa-action-icon"
            onClick={() => setIsMinimized((prev) => !prev)}
            title={isMinimized ? 'Expand chat' : 'Minimize'}
          >
            <Minus size={17} />
          </button>
          <button
            className="wa-action-icon close"
            onClick={closeChat}
            title="Close chat"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Body & Input (Hidden when minimized) */}
      {!isMinimized && (
        <>
          {/* Chat Messages Body */}
          <div className="wa-body">
            <div className="wa-date-pill">
              <span>TODAY</span>
            </div>

            <div className="wa-encryption-notice">
              <span>🔒 Messages are end-to-end encrypted for Drello workspace members.</span>
            </div>

            <div className="wa-messages-list">
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-secondary)' }}>
                  <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>💬</div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    Direct Chat with {member.name}
                  </div>
                  <p style={{ fontSize: '0.8rem', marginTop: '6px', lineHeight: 1.4 }}>
                    Say hello to start the conversation! Messages are delivered directly between team members in real time.
                  </p>
                </div>
              )}

              {messages.map((msg) => {
                const isMe =
                  msg.senderId === myId ||
                  msg.senderId === 'user' ||
                  Boolean(msg.senderEmail && myEmail && msg.senderEmail.toLowerCase().trim() === myEmail);
                return (
                  <div key={msg.id} className={`wa-bubble-row ${isMe ? 'outgoing' : 'incoming'}`}>
                    <div className={`wa-bubble ${isMe ? 'outgoing' : 'incoming'}`}>
                      <p className="wa-bubble-text">{msg.text}</p>
                      <div className="wa-bubble-meta">
                        <span className="wa-time">{msg.timestamp}</span>
                        {isMe && (
                          <span className={`wa-ticks ${msg.status === 'read' ? 'read' : ''}`}>
                            {msg.status === 'sent' ? (
                              <Check size={14} />
                            ) : (
                              <CheckCheck size={14} />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator bubble */}
              {isTyping && (
                <div className="wa-bubble-row incoming">
                  <div className="wa-bubble incoming wa-typing-bubble">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Emoji Picker Bar */}
            {showEmojiPicker && (
              <div className="wa-quick-emojis animate-fade-in">
                {EMOJIS.map((em) => (
                  <button
                    key={em}
                    type="button"
                    className="emoji-btn"
                    onClick={() => handleEmojiClick(em)}
                  >
                    {em}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer Input */}
          <form className="wa-footer" onSubmit={handleSend}>
            <button
              type="button"
              className={`wa-tool-btn ${showEmojiPicker ? 'active' : ''}`}
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              title="Add Emoji"
            >
              <Smile size={20} />
            </button>

            <button
              type="button"
              className="wa-tool-btn"
              onClick={() => alert('Attachments: Drag & drop files or images directly into cards.')}
              title="Attach File"
            >
              <Paperclip size={19} />
            </button>

            <input
              ref={inputRef}
              type="text"
              className="wa-input"
              placeholder="Type a message..."
              value={inputVal}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />

            <button
              type="submit"
              className={`wa-send-btn ${inputVal.trim() ? 'active' : ''}`}
              title="Send"
            >
              <Send size={16} />
            </button>
          </form>
        </>
      )}
    </div>
  );
};
