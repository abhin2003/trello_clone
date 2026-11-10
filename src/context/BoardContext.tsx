import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { Board, Card, FilterOptions, BoardBackground, ChatMessage, Member } from '../types';
import { INITIAL_BOARDS, DEFAULT_LABELS } from '../data/initialData';
import { useTenant } from './TenantContext';
import { useAuth } from './AuthContext';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import { toUUID } from '../services/tenantService';
import confetti from 'canvas-confetti';

const STORAGE_KEY = 'stratcrest_flow_boards_v1';
const THEME_KEY = 'stratcrest_flow_theme';

interface BoardContextType {
  boards: Board[];
  activeBoard: Board;
  activeBoardId: string;
  theme: 'dark' | 'light';
  isSidebarOpen: boolean;
  activeCardId: string | null;
  filter: FilterOptions;
  isFilterOpen: boolean;
  isShortcutsOpen: boolean;
  isNewBoardOpen: boolean;
  isBgPickerOpen: boolean;
  
  // Board operations
  setActiveBoardId: (id: string) => void;
  createBoard: (title: string, background: BoardBackground, description?: string, workspaceId?: string) => string;
  updateBoard: (boardId: string, updates: Partial<Board>) => void;
  renameBoard: (boardId: string, newTitle: string) => void;
  deleteBoard: (boardId: string) => void;
  toggleStarBoard: (boardId: string) => void;
  setBoardBackground: (background: BoardBackground) => void;
  exportBoardJSON: () => void;
  importBoardJSON: (jsonString: string) => boolean;

  // Global Board Action Modals
  boardToRename: Board | null;
  setBoardToRename: (board: Board | null) => void;
  boardToDelete: Board | null;
  setBoardToDelete: (board: Board | null) => void;

  // List operations
  addList: (title: string) => void;
  updateListTitle: (listId: string, title: string) => void;
  deleteList: (listId: string) => void;
  moveList: (sourceIndex: number, destIndex: number) => void;

  // Card operations
  addCard: (listId: string, title: string) => void;
  updateCard: (cardId: string, updates: Partial<Card>) => void;
  deleteCard: (cardId: string) => void;
  moveCard: (cardId: string, sourceListId: string, destListId: string, destIndex: number) => void;
  openCardModal: (cardId: string) => void;
  closeCardModal: () => void;

  // Checklists
  addChecklist: (cardId: string, title: string) => void;
  deleteChecklist: (cardId: string, checklistId: string) => void;
  addChecklistItem: (cardId: string, checklistId: string, text: string) => void;
  toggleChecklistItem: (cardId: string, checklistId: string, itemId: string) => void;
  deleteChecklistItem: (cardId: string, checklistId: string, itemId: string) => void;

  // Comments & Labels & Members
  addComment: (cardId: string, text: string) => void;
  toggleCardLabel: (cardId: string, labelId: string) => void;
  addBoardLabel: (name: string, color: string) => void;
  toggleCardMember: (cardId: string, memberId: string) => void;

  // Filter & Modals
  setFilter: (updates: Partial<FilterOptions>) => void;
  clearFilter: () => void;
  toggleTheme: () => void;
  setIsSidebarOpen: (open: boolean) => void;
  setIsFilterOpen: (open: boolean) => void;
  setIsShortcutsOpen: (open: boolean) => void;
  setIsNewBoardOpen: (open: boolean) => void;
  setIsBgPickerOpen: (open: boolean) => void;

  // Chat features
  activeChatMemberId: string | null;
  openChat: (memberId: string) => void;
  closeChat: () => void;
  chatMessages: Record<string, ChatMessage[]>;
  isTyping: boolean;
  sendChatMessage: (memberId: string, text: string) => void;
  broadcastTyping?: (recipientId: string, isTyping: boolean) => void;
}

const defaultFilter: FilterOptions = {
  searchQuery: '',
  selectedLabelIds: [],
  selectedMemberIds: [],
  dueFilter: 'all',
};

const BoardContext = createContext<BoardContextType | undefined>(undefined);

export const BoardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load boards from local storage or seed
  const [boards, setBoards] = useState<Board[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse saved boards', e);
    }
    return INITIAL_BOARDS;
  });

  const [activeBoardId, setActiveBoardId] = useState<string>(() => boards[0]?.id || 'board-stratcrest-q4');

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === 'light' ? 'light' : 'dark';
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [filter, setFilterState] = useState<FilterOptions>(defaultFilter);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isNewBoardOpen, setIsNewBoardOpen] = useState(false);
  const [isBgPickerOpen, setIsBgPickerOpen] = useState(false);

  // Global Rename & Delete Board State
  const [boardToRename, setBoardToRename] = useState<Board | null>(null);
  const [boardToDelete, setBoardToDelete] = useState<Board | null>(null);

  // Chat state
  const CHAT_STORAGE_KEY = 'stratcrest_flow_chat_messages_v1';
  const { userProfile } = useAuth();
  const { activeOrg, members: orgMembers } = useTenant();
  const [activeChatMemberId, setActiveChatMemberId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const DUMMY_STRINGS = [
    'Hello strivecad! Glad to have you on the Crest team.',
    'Thanks Akash! Ready to work.',
    'Test live message from Akash to Strivecad',
    'Testing FK constraint',
    'Hello from anon client',
  ];

  const filterOutDummies = (msgs: ChatMessage[]): ChatMessage[] => {
    return (msgs || []).filter((m) => !DUMMY_STRINGS.some((d) => m.text.includes(d)));
  };

  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const cleaned: Record<string, ChatMessage[]> = {};
        for (const [k, v] of Object.entries(parsed)) {
          if (Array.isArray(v)) {
            cleaned[k] = filterOutDummies(v);
          }
        }
        return cleaned;
      }
    } catch (e) {
      console.warn('Failed to parse chat messages', e);
    }
    return {};
  });

  // Helper to compute unified conversation key between two users
  const getConversationKey = useCallback((userAId: string, userBId: string) => {
    const normA = (userAId || '').toLowerCase().trim();
    const normB = (userBId || '').toLowerCase().trim();
    return [normA, normB].sort().join('__');
  }, []);

  // Sync chat messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chatMessages));
    } catch (e) {
      console.error('Chat storage write error', e);
    }
  }, [chatMessages]);

  // Helper to fetch messages from Supabase chat_messages table
  const fetchChatMessages = useCallback(async (targetMemberId: string) => {
    if (!isSupabaseConfigured() || !targetMemberId) return;
    try {
      const client = getSupabaseClient();
      const myId = userProfile?.id || 'usr-owner';
      const myEmail = (userProfile?.email || '').toLowerCase().trim();

      const targetMember = orgMembers.find(
        (m) =>
          m.userId === targetMemberId ||
          m.id === targetMemberId ||
          m.user?.email === targetMemberId ||
          (m.user?.email && m.user.email.toLowerCase() === targetMemberId.toLowerCase())
      );
      const targetEmail = (targetMember?.user?.email || (targetMemberId.includes('@') ? targetMemberId : '')).toLowerCase().trim();

      const convKey = getConversationKey(myId, targetMemberId);
      const emailConvKey = myEmail && targetEmail ? [myEmail, targetEmail].sort().join('__') : '';

      const myUuid = toUUID(myId);
      const targetUuid = toUUID(targetMemberId);

      const filterParts: string[] = [`conversation_key.eq.${convKey}`];
      if (emailConvKey && emailConvKey !== convKey) {
        filterParts.push(`conversation_key.eq.${emailConvKey}`);
      }
      if (myUuid && targetUuid) {
        filterParts.push(`and(sender_id.eq.${myUuid},recipient_id.eq.${targetUuid})`);
        filterParts.push(`and(sender_id.eq.${targetUuid},recipient_id.eq.${myUuid})`);
      }
      if (myEmail && targetEmail) {
        filterParts.push(`and(sender_email.eq.${myEmail},recipient_email.eq.${targetEmail})`);
        filterParts.push(`and(sender_email.eq.${targetEmail},recipient_email.eq.${myEmail})`);
      }

      const { data, error } = await client
        .from('chat_messages')
        .select('*')
        .or(filterParts.join(','))
        .order('created_at', { ascending: true });

      if (!error && data && Array.isArray(data)) {
        const candidateKeys = Array.from(new Set([
          convKey,
          emailConvKey,
          targetMemberId,
          targetEmail,
          targetMember?.userId,
          targetMember?.id,
        ].filter((k): k is string => Boolean(k))));

        if (data.length === 0) {
          // If server has 0 rows (e.g. database was cleaned), purge dummy messages from local state
          setChatMessages((prev) => {
            let changed = false;
            const updated = { ...prev };
            for (const k of candidateKeys) {
              if (Array.isArray(updated[k])) {
                const cleaned = filterOutDummies(updated[k]);
                if (cleaned.length !== updated[k].length) {
                  updated[k] = cleaned;
                  changed = true;
                }
              }
            }
            if (changed) {
              try {
                localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(updated));
              } catch {}
            }
            return changed ? updated : prev;
          });
          return;
        }

        const loaded: ChatMessage[] = filterOutDummies(
          data.map((d: any) => ({
            id: d.id,
            senderId: d.sender_id,
            senderName: d.sender_name || (d.sender_email ? d.sender_email.split('@')[0] : 'User'),
            senderEmail: d.sender_email,
            recipientId: d.recipient_id,
            text: d.text,
            timestamp: new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestampRaw: d.created_at,
            status: (d.status as any) || 'delivered',
          }))
        );

        setChatMessages((prev) => {
          const map = new Map<string, ChatMessage>();
          // Preserve any existing local unsynced messages (excluding dummies)
          for (const k of candidateKeys) {
            if (Array.isArray(prev[k])) {
              for (const m of filterOutDummies(prev[k])) {
                map.set(m.id, m);
              }
            }
          }
          // Merge remote messages
          for (const m of loaded) {
            map.set(m.id, m);
          }

          const merged = Array.from(map.values()).sort((a, b) => {
            const tA = a.timestampRaw || a.timestamp || '';
            const tB = b.timestampRaw || b.timestamp || '';
            return tA.localeCompare(tB) || a.id.localeCompare(b.id);
          });

          const updated = { ...prev };
          for (const k of candidateKeys) {
            updated[k] = merged;
          }
          try {
            localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }
    } catch (e) {
      console.warn('[Chat] Fetch error:', e);
    }
  }, [userProfile, orgMembers, getConversationKey]);

  // Initial fetch and poll when active chat is open
  useEffect(() => {
    if (!activeChatMemberId) return;
    fetchChatMessages(activeChatMemberId);

    const interval = setInterval(() => {
      fetchChatMessages(activeChatMemberId);
    }, 1200);

    return () => clearInterval(interval);
  }, [activeChatMemberId, fetchChatMessages]);

  // Supabase Real-time pub/sub across devices & windows
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const client = getSupabaseClient();
    const myEmail = (userProfile?.email || '').toLowerCase().trim();
    const myId = userProfile?.id || 'usr-owner';
    const myUuid = toUUID(myId);

    const channelId = `chat_realtime_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    let channel: any = null;

    try {
      channel = client
        .channel(channelId)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
          },
          (payload) => {
            const row = payload.new;
            if (!row) return;

            const senderEmail = (row.sender_email || '').toLowerCase().trim();
            const recipientEmail = (row.recipient_email || '').toLowerCase().trim();
            const senderId = row.sender_id;
            const recipientId = row.recipient_id;
            const convKey = row.conversation_key || '';

            const isForMe =
              !myEmail ||
              recipientEmail === myEmail ||
              senderEmail === myEmail ||
              convKey.includes(myEmail) ||
              recipientId === myUuid ||
              senderId === myUuid;

            if (isForMe) {
              const incomingMsg: ChatMessage = {
                id: row.id,
                senderId: row.sender_id,
                senderName: row.sender_name || (senderEmail ? senderEmail.split('@')[0] : 'User'),
                senderEmail: row.sender_email,
                recipientId: row.recipient_id,
                text: row.text,
                timestamp: new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                timestampRaw: row.created_at,
                status: 'delivered',
              };

              setChatMessages((prev) => {
                let otherEmail = senderEmail === myEmail ? recipientEmail : senderEmail;
                if (!otherEmail && convKey.includes('__') && myEmail) {
                  otherEmail = convKey.split('__').find((e: string) => e.toLowerCase() !== myEmail) || '';
                }
                const otherId = senderId === myUuid ? recipientId : senderId;

                const targetKeys = Array.from(new Set([
                  convKey,
                  otherEmail,
                  otherId,
                  senderEmail,
                  recipientEmail,
                  senderId,
                  recipientId,
                ].filter((k): k is string => Boolean(k))));

                // Check if already in state
                let alreadyExists = false;
                for (const k of targetKeys) {
                  if (prev[k]?.some((m) => m.id === incomingMsg.id || (m.text === incomingMsg.text && m.timestamp === incomingMsg.timestamp))) {
                    alreadyExists = true;
                    break;
                  }
                }
                if (alreadyExists) return prev;

                // Find largest existing array among target keys
                let baseList: ChatMessage[] = [];
                for (const k of targetKeys) {
                  if (Array.isArray(prev[k]) && prev[k].length > baseList.length) {
                    baseList = prev[k];
                  }
                }

                const updatedList = [...baseList, incomingMsg].sort((a, b) => {
                  const tA = a.timestampRaw || a.timestamp || '';
                  const tB = b.timestampRaw || b.timestamp || '';
                  return tA.localeCompare(tB) || a.id.localeCompare(b.id);
                });

                const updated = { ...prev };
                for (const k of targetKeys) {
                  updated[k] = updatedList;
                }

                try {
                  localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(updated));
                } catch {}
                return updated;
              });
            }
          }
        )
        .subscribe();
    } catch (e) {
      console.warn('[Chat] Supabase realtime subscription notice:', e);
    }

    return () => {
      if (channel) {
        try {
          client.removeChannel(channel);
        } catch {}
      }
    };
  }, [userProfile?.id, userProfile?.email]);

  // Same-device BroadcastChannel & Storage Event sync
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('stratcrest_flow_chat_v1');
        bc.onmessage = (event) => {
          const data = event.data;
          if (!data) return;

          const myId = userProfile?.id || 'usr-owner';
          const myEmail = userProfile?.email?.toLowerCase().trim();

          if (data.type === 'NEW_MESSAGE' && data.message) {
            const isForMe =
              data.recipientId === myId ||
              (myEmail && data.message.recipientEmail?.toLowerCase().trim() === myEmail) ||
              data.conversationKey.includes(myId.toLowerCase());

            if (isForMe || data.senderId !== myId) {
              setChatMessages((prev) => {
                const convKey = data.conversationKey;
                const existing = prev[convKey] || [];
                if (existing.some((m) => m.id === data.message.id)) return prev;

                const incomingMsg: ChatMessage = {
                  ...data.message,
                  status: 'delivered',
                };
                const updated: Record<string, ChatMessage[]> = {
                  ...prev,
                  [convKey]: [...existing, incomingMsg],
                };
                if (data.emailConversationKey) {
                  updated[data.emailConversationKey] = updated[convKey];
                }
                if (data.senderId) {
                  updated[data.senderId as string] = updated[convKey];
                }
                return updated;
              });

              if (activeChatMemberId === data.senderId) {
                try {
                  const ackBc = new BroadcastChannel('stratcrest_flow_chat_v1');
                  ackBc.postMessage({
                    type: 'MESSAGE_READ',
                    conversationKey: data.conversationKey,
                    readerId: myId,
                  });
                  ackBc.close();
                } catch {}
              }
            }
          } else if (data.type === 'MESSAGE_READ' && data.conversationKey) {
            setChatMessages((prev) => {
              const convKey = data.conversationKey;
              const existing = prev[convKey] || [];
              return {
                ...prev,
                [convKey]: existing.map((m) => ({ ...m, status: 'read' })),
              };
            });
          } else if (data.type === 'TYPING_INDICATOR' && data.conversationKey) {
            if (data.senderId !== myId && (activeChatMemberId === data.senderId || data.recipientId === myId)) {
              setIsTyping(Boolean(data.isTyping));
            }
          }
        };
      }
    } catch (e) {
      console.warn('Real-time chat broadcast channel initialization notice:', e);
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CHAT_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setChatMessages(parsed);
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      bc?.close();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [userProfile, activeChatMemberId]);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(boards));
    } catch (e) {
      console.error('Storage write error', e);
    }
  }, [boards]);

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if inside input/textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur();
        }
        return;
      }

      if (e.key === 'Escape') {
        if (activeCardId) closeCardModal();
        else if (isFilterOpen) setIsFilterOpen(false);
        else if (isShortcutsOpen) setIsShortcutsOpen(false);
        else if (isNewBoardOpen) setIsNewBoardOpen(false);
        else if (isBgPickerOpen) setIsBgPickerOpen(false);
        else if (isSidebarOpen) setIsSidebarOpen(false);
      } else if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        setIsShortcutsOpen((prev) => !prev);
      } else if (e.key === 'b' || e.key === 'B') {
        setIsSidebarOpen((prev) => !prev);
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        setIsFilterOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeCardId, isFilterOpen, isShortcutsOpen, isNewBoardOpen, isBgPickerOpen, isSidebarOpen]);

  // Organisation's real members mapped to Member interface
  const currentOrgMembers = useMemo<Member[]>(() => {
    if (orgMembers && orgMembers.length > 0) {
      return orgMembers.map((m) => {
        const fullName = m.user?.name || m.user?.email?.split('@')[0] || 'Team Member';
        const initials =
          m.user?.initials ||
          (fullName.trim()
            ? fullName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()
            : 'U');
        return {
          id: m.userId || m.id,
          userId: m.userId,
          memberId: m.id,
          name: fullName,
          initials: initials || 'U',
          avatarColor: m.user?.avatarColor || '#3b82f6',
          email: m.user?.email || '',
          role: m.role,
          jobTitle: m.jobTitle,
        };
      });
    }
    return [];
  }, [orgMembers]);

  // Filter boards to ONLY those belonging to the active organisation
  const tenantBoards = useMemo(() => {
    return boards
      .filter((b) => b.organisationId === activeOrg.id)
      .map((b) => ({
        ...b,
        members: currentOrgMembers.length > 0 ? currentOrgMembers : (b.members || []),
      }));
  }, [boards, activeOrg.id, currentOrgMembers]);

  // Auto-initialize clean production board for active organization if none exists
  useEffect(() => {
    if (activeOrg?.id) {
      const existing = boards.filter((b) => b.organisationId === activeOrg.id);
      if (existing.length === 0) {
        const newId = `board-${activeOrg.id}-main`;
        const cleanBoard: Board = {
          id: newId,
          organisationId: activeOrg.id,
          workspaceId: undefined,
          title: 'Main Board',
          description: `Main delivery and workflow board for ${activeOrg.name}`,
          isStarred: true,
          background: {
            type: 'gradient',
            value: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #0284c7 100%)',
            preview: '#1e3a8a',
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lists: [
            { id: `list-${Date.now()}-1`, boardId: newId, title: 'To Do', cardIds: [] },
            { id: `list-${Date.now()}-2`, boardId: newId, title: 'In Progress', cardIds: [] },
            { id: `list-${Date.now()}-3`, boardId: newId, title: 'Done', cardIds: [] },
          ],
          cards: {} as Record<string, Card>,
          labels: DEFAULT_LABELS,
          members: currentOrgMembers,
        };

        setBoards((prev) => {
          // If this is a real user organisation, purge old demo boards
          const cleaned = activeOrg.id !== 'org-acme'
            ? prev.filter((b) => b.organisationId !== 'org-acme' && b.organisationId !== 'org-stratcrest')
            : prev;
          return [...cleaned, cleanBoard];
        });
        setActiveBoardId(newId);
      }
    }
  }, [activeOrg?.id, activeOrg?.name, boards, currentOrgMembers]);

  // Ensure active board is within this tenant
  useEffect(() => {
    if (tenantBoards.length > 0) {
      if (!tenantBoards.some((b) => b.id === activeBoardId)) {
        setActiveBoardId(tenantBoards[0].id);
      }
    }
  }, [tenantBoards, activeBoardId]);

  const activeBoard = useMemo(() => {
    const found = tenantBoards.find((b) => b.id === activeBoardId);
    const board = found || tenantBoards[0];
    if (board) {
      return {
        ...board,
        members: currentOrgMembers.length > 0 ? currentOrgMembers : (board.members || []),
      };
    }

    // Safe clean board fallback for active organisation (NEVER demo board!)
    return {
      id: `board-${activeOrg.id}-default`,
      organisationId: activeOrg.id,
      title: 'Main Board',
      description: `Workspace board for ${activeOrg.name}`,
      isStarred: false,
      background: {
        type: 'gradient' as const,
        value: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #0284c7 100%)',
        preview: '#1e3a8a',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lists: [
        { id: `list-1`, boardId: `board-${activeOrg.id}-default`, title: 'To Do', cardIds: [] },
        { id: `list-2`, boardId: `board-${activeOrg.id}-default`, title: 'In Progress', cardIds: [] },
        { id: `list-3`, boardId: `board-${activeOrg.id}-default`, title: 'Done', cardIds: [] },
      ],
      cards: {} as Record<string, Card>,
      labels: DEFAULT_LABELS,
      members: currentOrgMembers,
    };
  }, [tenantBoards, activeBoardId, currentOrgMembers, activeOrg.id, activeOrg.name]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const createBoard = (title: string, background: BoardBackground, description?: string, workspaceId?: string): string => {
    const newBoardId = `board-${Date.now()}`;
    const newBoard: Board = {
      id: newBoardId,
      organisationId: activeOrg.id,
      workspaceId: workspaceId || undefined,
      title: title.trim(),
      description: description?.trim() || '',
      isStarred: false,
      background,
      labels: DEFAULT_LABELS,
      members: currentOrgMembers.length > 0 ? currentOrgMembers : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lists: [
        { id: `list-${Date.now()}-1`, boardId: newBoardId, title: 'To Do', cardIds: [] },
        { id: `list-${Date.now()}-2`, boardId: newBoardId, title: 'Doing', cardIds: [] },
        { id: `list-${Date.now()}-3`, boardId: newBoardId, title: 'Done', cardIds: [] },
      ],
      cards: {},
    };

    setBoards((prev) => [newBoard, ...prev]);
    setActiveBoardId(newBoardId);
    return newBoardId;
  };

  const updateBoard = (boardId: string, updates: Partial<Board>) => {
    setBoards((prev) =>
      prev.map((b) => (b.id === boardId ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b))
    );
  };

  const renameBoard = (boardId: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    updateBoard(boardId, { title: trimmed });
  };

  const deleteBoard = (boardId: string) => {
    const remaining = boards.filter((b) => b.id !== boardId);
    if (remaining.length === 0) {
      const newId = `board-${Date.now()}`;
      const fallbackBoard: Board = {
        id: newId,
        title: 'Main Board',
        description: 'Default collaborative board',
        isStarred: false,
        background: { type: 'color', value: '#1e293b', preview: '#1e293b' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lists: [],
        cards: {},
        labels: DEFAULT_LABELS,
        members: [],
      };
      setBoards([fallbackBoard]);
      setActiveBoardId(newId);
    } else {
      setBoards(remaining);
      if (activeBoardId === boardId) {
        setActiveBoardId(remaining[0].id);
      }
    }
  };

  const toggleStarBoard = (boardId: string) => {
    setBoards((prev) =>
      prev.map((b) => (b.id === boardId ? { ...b, isStarred: !b.isStarred } : b))
    );
  };

  const setBoardBackground = (background: BoardBackground) => {
    updateBoard(activeBoard.id, { background });
  };

  const exportBoardJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activeBoard, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${activeBoard.title.replace(/\s+/g, '_')}_drello_export.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importBoardJSON = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.title || !parsed.lists) {
        alert('Invalid board JSON format: missing required fields.');
        return false;
      }
      const newBoardId = `board-imported-${Date.now()}`;
      const importedBoard: Board = {
        ...parsed,
        id: newBoardId,
        title: `${parsed.title} (Imported)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setBoards((prev) => [importedBoard, ...prev]);
      setActiveBoardId(newBoardId);
      return true;
    } catch (e) {
      alert('Error parsing JSON file. Please ensure it is a valid board export.');
      return false;
    }
  };

  // --- List operations ---
  const addList = (title: string) => {
    if (!title.trim()) return;
    const newListId = `list-${Date.now()}`;
    const newList = {
      id: newListId,
      boardId: activeBoard.id,
      title: title.trim(),
      cardIds: [],
    };
    updateBoard(activeBoard.id, {
      lists: [...activeBoard.lists, newList],
    });
  };

  const updateListTitle = (listId: string, title: string) => {
    if (!title.trim()) return;
    updateBoard(activeBoard.id, {
      lists: activeBoard.lists.map((l) => (l.id === listId ? { ...l, title: title.trim() } : l)),
    });
  };

  const deleteList = (listId: string) => {
    const targetList = activeBoard.lists.find((l) => l.id === listId);
    if (!targetList) return;

    // Clean up cards in target list
    const updatedCards = { ...activeBoard.cards };
    targetList.cardIds.forEach((cId) => {
      delete updatedCards[cId];
    });

    updateBoard(activeBoard.id, {
      lists: activeBoard.lists.filter((l) => l.id !== listId),
      cards: updatedCards,
    });
  };

  const moveList = (sourceIndex: number, destIndex: number) => {
    if (sourceIndex === destIndex) return;
    const newLists = Array.from(activeBoard.lists);
    const [moved] = newLists.splice(sourceIndex, 1);
    newLists.splice(destIndex, 0, moved);
    updateBoard(activeBoard.id, { lists: newLists });
  };

  // --- Card operations ---
  const addCard = (listId: string, title: string) => {
    if (!title.trim()) return;
    const newCardId = `card-${Date.now()}`;
    const newCard: Card = {
      id: newCardId,
      listId,
      title: title.trim(),
      description: '',
      labels: [],
      members: [],
      checklists: [],
      comments: [],
      activities: [
        {
          id: `act-${Date.now()}`,
          text: `Card created in list "${activeBoard.lists.find((l) => l.id === listId)?.title}"`,
          createdAt: new Date().toISOString(),
          type: 'create',
        },
      ],
      createdAt: new Date().toISOString(),
    };

    const updatedLists = activeBoard.lists.map((l) =>
      l.id === listId ? { ...l, cardIds: [...l.cardIds, newCardId] } : l
    );

    updateBoard(activeBoard.id, {
      lists: updatedLists,
      cards: { ...activeBoard.cards, [newCardId]: newCard },
    });
  };

  const updateCard = (cardId: string, updates: Partial<Card>) => {
    const currentCard = activeBoard.cards[cardId];
    if (!currentCard) return;

    updateBoard(activeBoard.id, {
      cards: {
        ...activeBoard.cards,
        [cardId]: {
          ...currentCard,
          ...updates,
        },
      },
    });
  };

  const deleteCard = (cardId: string) => {
    const card = activeBoard.cards[cardId];
    if (!card) return;

    const updatedLists = activeBoard.lists.map((l) =>
      l.id === card.listId ? { ...l, cardIds: l.cardIds.filter((id) => id !== cardId) } : l
    );

    const updatedCards = { ...activeBoard.cards };
    delete updatedCards[cardId];

    updateBoard(activeBoard.id, {
      lists: updatedLists,
      cards: updatedCards,
    });

    if (activeCardId === cardId) {
      setActiveCardId(null);
    }
  };

  const moveCard = (cardId: string, sourceListId: string, destListId: string, destIndex: number) => {
    const sourceList = activeBoard.lists.find((l) => l.id === sourceListId);
    const destList = activeBoard.lists.find((l) => l.id === destListId);
    if (!sourceList || !destList) return;

    // Create copies
    const newSourceCards = Array.from(sourceList.cardIds.filter((id) => id !== cardId));
    const newDestCards = sourceListId === destListId ? newSourceCards : Array.from(destList.cardIds);

    // Insert at destIndex
    newDestCards.splice(destIndex, 0, cardId);

    const updatedLists = activeBoard.lists.map((l) => {
      if (l.id === sourceListId && sourceListId === destListId) {
        return { ...l, cardIds: newDestCards };
      }
      if (l.id === sourceListId) {
        return { ...l, cardIds: newSourceCards };
      }
      if (l.id === destListId) {
        return { ...l, cardIds: newDestCards };
      }
      return l;
    });

    const card = activeBoard.cards[cardId];
    const newActivity =
      sourceListId !== destListId
        ? {
            id: `act-${Date.now()}`,
            text: `Moved to ${destList.title}`,
            createdAt: new Date().toISOString(),
            type: 'move' as const,
          }
        : null;

    updateBoard(activeBoard.id, {
      lists: updatedLists,
      cards: {
        ...activeBoard.cards,
        [cardId]: {
          ...card,
          listId: destListId,
          activities: newActivity ? [newActivity, ...(card.activities || [])] : card.activities,
        },
      },
    });
  };

  const openCardModal = (cardId: string) => {
    setActiveCardId(cardId);
  };

  const closeCardModal = () => {
    setActiveCardId(null);
  };

  // --- Checklists ---
  const addChecklist = (cardId: string, title: string) => {
    const card = activeBoard.cards[cardId];
    if (!card) return;
    const newChecklist = {
      id: `chk-${Date.now()}`,
      title: title.trim() || 'Checklist',
      items: [],
    };
    updateCard(cardId, {
      checklists: [...(card.checklists || []), newChecklist],
    });
  };

  const deleteChecklist = (cardId: string, checklistId: string) => {
    const card = activeBoard.cards[cardId];
    if (!card) return;
    updateCard(cardId, {
      checklists: card.checklists.filter((c) => c.id !== checklistId),
    });
  };

  const addChecklistItem = (cardId: string, checklistId: string, text: string) => {
    if (!text.trim()) return;
    const card = activeBoard.cards[cardId];
    if (!card) return;

    const newItem = {
      id: `item-${Date.now()}`,
      text: text.trim(),
      completed: false,
    };

    updateCard(cardId, {
      checklists: card.checklists.map((c) =>
        c.id === checklistId ? { ...c, items: [...c.items, newItem] } : c
      ),
    });
  };

  const toggleChecklistItem = (cardId: string, checklistId: string, itemId: string) => {
    const card = activeBoard.cards[cardId];
    if (!card) return;

    let allCompleted = false;

    const updatedChecklists = card.checklists.map((c) => {
      if (c.id !== checklistId) return c;
      const updatedItems = c.items.map((it) => (it.id === itemId ? { ...it, completed: !it.completed } : it));
      if (updatedItems.length > 0 && updatedItems.every((it) => it.completed)) {
        allCompleted = true;
      }
      return { ...c, items: updatedItems };
    });

    if (allCompleted) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899'],
        });
      } catch (e) {
        // Safe fallback
      }
    }

    updateCard(cardId, { checklists: updatedChecklists });
  };

  const deleteChecklistItem = (cardId: string, checklistId: string, itemId: string) => {
    const card = activeBoard.cards[cardId];
    if (!card) return;

    updateCard(cardId, {
      checklists: card.checklists.map((c) =>
        c.id === checklistId ? { ...c, items: c.items.filter((it) => it.id !== itemId) } : c
      ),
    });
  };

  // --- Comments & Labels ---
  const addComment = (cardId: string, text: string) => {
    if (!text.trim()) return;
    const card = activeBoard.cards[cardId];
    if (!card) return;

    const newComment = {
      id: `comm-${Date.now()}`,
      authorId: 'mem-1',
      authorName: 'Abhinav Patel',
      authorAvatar: '#3b82f6',
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };

    const newActivity = {
      id: `act-${Date.now()}`,
      text: `Added comment: "${text.trim().substring(0, 40)}..."`,
      createdAt: new Date().toISOString(),
      type: 'comment' as const,
    };

    updateCard(cardId, {
      comments: [newComment, ...(card.comments || [])],
      activities: [newActivity, ...(card.activities || [])],
    });
  };

  const toggleCardLabel = (cardId: string, labelId: string) => {
    const card = activeBoard.cards[cardId];
    if (!card) return;
    const exists = card.labels.includes(labelId);
    const newLabels = exists ? card.labels.filter((id) => id !== labelId) : [...card.labels, labelId];
    updateCard(cardId, { labels: newLabels });
  };

  const addBoardLabel = (name: string, color: string) => {
    if (!name.trim()) return;
    const newLabel = {
      id: `lbl-${Date.now()}`,
      name: name.trim(),
      color,
      textColor: '#ffffff',
    };
    updateBoard(activeBoard.id, {
      labels: [...activeBoard.labels, newLabel],
    });
  };

  const toggleCardMember = (cardId: string, memberId: string) => {
    const card = activeBoard.cards[cardId];
    if (!card) return;
    const targetMem = activeBoard.members.find(
      (m) => m.id === memberId || m.userId === memberId || m.memberId === memberId
    );
    const matchIds = targetMem
      ? [targetMem.id, targetMem.userId, targetMem.memberId].filter((id): id is string => Boolean(id))
      : [memberId];
    const exists = card.members.some((id) => matchIds.includes(id));
    const newMembers = exists
      ? card.members.filter((id) => !matchIds.includes(id))
      : [...card.members, memberId];
    updateCard(cardId, { members: newMembers });
  };

  const setFilter = (updates: Partial<FilterOptions>) => {
    setFilterState((prev) => ({ ...prev, ...updates }));
  };

  const clearFilter = () => {
    setFilterState(defaultFilter);
  };

  // Chat handlers
  const openChat = (memberId: string) => {
    setActiveChatMemberId(memberId);
  };

  const closeChat = () => {
    setActiveChatMemberId(null);
    setIsTyping(false);
  };

  const sendChatMessage = (memberId: string, text: string) => {
    if (!text.trim()) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msgId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const myId = userProfile?.id || 'usr-owner';
    const myName = userProfile?.name || 'User';
    const myEmail = (userProfile?.email || '').toLowerCase().trim();

    const recipientMem = orgMembers.find(
      (m) =>
        m.userId === memberId ||
        m.id === memberId ||
        m.user?.email === memberId ||
        (m.user?.email && m.user.email.toLowerCase() === memberId.toLowerCase())
    );
    const recipientEmail = (recipientMem?.user?.email || (memberId.includes('@') ? memberId : '')).toLowerCase().trim();
    const actualRecipientId = recipientMem?.userId || recipientMem?.id || memberId;

    const convKey = getConversationKey(myId, memberId);
    const emailConvKey = myEmail && recipientEmail
      ? [myEmail, recipientEmail].sort().join('__')
      : convKey;

    const newMsg: ChatMessage = {
      id: msgId,
      senderId: myId,
      senderName: myName,
      senderEmail: myEmail,
      recipientId: actualRecipientId,
      text: text.trim(),
      timestamp: timeStr,
      timestampRaw: now.toISOString(),
      status: 'sent',
    };

    const targetKeys = Array.from(new Set([
      convKey,
      emailConvKey,
      memberId,
      recipientEmail,
      actualRecipientId,
      recipientMem?.userId,
      recipientMem?.id,
    ].filter((k): k is string => Boolean(k))));

    setChatMessages((prev) => {
      let existingConv: ChatMessage[] = [];
      for (const k of targetKeys) {
        if (Array.isArray(prev[k]) && prev[k].length > existingConv.length) {
          existingConv = prev[k];
        }
      }

      const updatedList = [...existingConv, newMsg];
      const updated = { ...prev };
      for (const k of targetKeys) {
        updated[k] = updatedList;
      }
      try {
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Chat storage write error', e);
      }
      return updated;
    });

    // Real-time broadcast to all open tabs and windows on same device
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('stratcrest_flow_chat_v1');
        bc.postMessage({
          type: 'NEW_MESSAGE',
          conversationKey: convKey,
          emailConversationKey: emailConvKey,
          recipientId: actualRecipientId,
          recipientEmail,
          senderId: myId,
          senderEmail: myEmail,
          message: newMsg,
        });
        bc.close();
      }
    } catch (e) {
      console.warn('Broadcast error', e);
    }

    // Persist to Supabase chat_messages table for cross-device real-time sync
    if (isSupabaseConfigured()) {
      try {
        const client = getSupabaseClient();
        const orgUuid = activeOrg?.id ? toUUID(activeOrg.id) : null;
        const senderUuid = toUUID(myId);
        const recipientUuid = toUUID(actualRecipientId);

        client
          .from('chat_messages')
          .insert({
            id: toUUID(msgId),
            organisation_id: orgUuid,
            conversation_key: emailConvKey || convKey,
            sender_id: senderUuid,
            sender_name: myName,
            sender_email: myEmail || null,
            recipient_id: recipientUuid,
            recipient_email: recipientEmail || null,
            text: text.trim(),
            status: 'sent',
          })
          .select()
          .then(({ data, error }) => {
            if (error) {
              console.warn('[Chat] Supabase insert error:', error.message);
            } else if (data && data[0]) {
              // Update status to delivered once recorded in Supabase
              setChatMessages((prev) => {
                const updated = { ...prev };
                for (const k of targetKeys) {
                  if (Array.isArray(updated[k])) {
                    updated[k] = updated[k].map((m) =>
                      m.id === msgId ? { ...m, status: 'delivered' as const } : m
                    );
                  }
                }
                return updated;
              });
            }
          });
      } catch (err) {
        console.warn('[Chat] Supabase error:', err);
      }
    }
  };

  const broadcastTyping = useCallback((recipientId: string, typing: boolean) => {
    const myId = userProfile?.id || 'usr-owner';
    const convKey = getConversationKey(myId, recipientId);
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('stratcrest_flow_chat_v1');
        bc.postMessage({
          type: 'TYPING_INDICATOR',
          conversationKey: convKey,
          senderId: myId,
          recipientId,
          isTyping: typing,
        });
        bc.close();
      }
    } catch {}
  }, [userProfile, getConversationKey]);

  return (
    <BoardContext.Provider
      value={{
        boards: tenantBoards,
        activeBoard,
        activeBoardId,
        theme,
        isSidebarOpen,
        activeCardId,
        filter,
        isFilterOpen,
        isShortcutsOpen,
        isNewBoardOpen,
        isBgPickerOpen,
        setActiveBoardId,
        createBoard,
        updateBoard,
        renameBoard,
        deleteBoard,
        boardToRename,
        setBoardToRename,
        boardToDelete,
        setBoardToDelete,
        toggleStarBoard,
        setBoardBackground,
        exportBoardJSON,
        importBoardJSON,
        addList,
        updateListTitle,
        deleteList,
        moveList,
        addCard,
        updateCard,
        deleteCard,
        moveCard,
        openCardModal,
        closeCardModal,
        addChecklist,
        deleteChecklist,
        addChecklistItem,
        toggleChecklistItem,
        deleteChecklistItem,
        addComment,
        toggleCardLabel,
        addBoardLabel,
        toggleCardMember,
        setFilter,
        clearFilter,
        toggleTheme,
        setIsSidebarOpen,
        setIsFilterOpen,
        setIsShortcutsOpen,
        setIsNewBoardOpen,
        setIsBgPickerOpen,
        activeChatMemberId,
        openChat,
        closeChat,
        chatMessages,
        isTyping,
        sendChatMessage,
        broadcastTyping,
      }}
    >
      {children}
    </BoardContext.Provider>
  );
};

export const useBoard = () => {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error('useBoard must be used within a BoardProvider');
  }
  return context;
};
