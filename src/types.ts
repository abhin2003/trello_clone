export interface Label {
  id: string;
  name: string;
  color: string;
  textColor?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Checklist {
  id: string;
  title: string;
  items: ChecklistItem[];
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  text: string;
  createdAt: string;
  type: 'create' | 'move' | 'edit' | 'comment' | 'checklist';
}

export interface Member {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  email: string;
  userId?: string;
  memberId?: string;
  role?: string;
  jobTitle?: string;
}

export interface Card {
  id: string;
  listId: string;
  title: string;
  description: string;
  coverColor?: string;
  coverGradient?: string;
  labels: string[]; // label IDs
  members: string[]; // member IDs
  dueDate?: string;
  dueComplete?: boolean;
  checklists: Checklist[];
  comments: Comment[];
  activities: Activity[];
  createdAt: string;
}

export interface List {
  id: string;
  boardId: string;
  title: string;
  cardIds: string[];
}

export interface BoardBackground {
  type: 'gradient' | 'color' | 'image';
  value: string;
  preview: string;
}

export interface Board {
  id: string;
  organisationId?: string;
  workspaceId?: string;
  title: string;
  description?: string;
  isStarred: boolean;
  background: BoardBackground;
  lists: List[];
  cards: Record<string, Card>;
  labels: Label[];
  members: Member[];
  createdAt: string;
  updatedAt: string;
}

export interface FilterOptions {
  searchQuery: string;
  selectedLabelIds: string[];
  selectedMemberIds: string[];
  dueFilter: 'all' | 'due-soon' | 'overdue' | 'completed' | 'no-due';
}

export interface ChatMessage {
  id: string;
  senderId: string;
  recipientId?: string;
  senderName?: string;
  senderEmail?: string;
  text: string;
  timestamp: string;
  timestampRaw?: string;
  status: 'sent' | 'delivered' | 'read';
}
