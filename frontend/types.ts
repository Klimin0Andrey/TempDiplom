export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MANAGER = 'manager',
  MEMBER = 'member',
  GUEST = 'guest'
}

export enum UserStatus {
  ACTIVE = 'active',
  INVITED = 'invited',
  SUSPENDED = 'suspended',
  DEACTIVATED = 'deactivated'
}

export enum RoomStatus {
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  RECORDING = 'recording',
  PAUSED = 'paused',
  ENDED = 'ended',
  ARCHIVED = 'archived'
}

export enum ActionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export type MessageType = 'text' | 'system' | 'notification' | 'direct';
export type PresenceStatus = 'speaking' | 'typing' | 'hand_raised' | 'idle';

export interface UserResponse {
  id: string;
  email: string;
  username?: string;
  firstName: string;
  lastName?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export interface RoomResponse {
  id: string;
  name: string;
  description?: string;
  inviteCode: string;
  inviteLink: string;
  status: RoomStatus;
  creatorId: string;
  creatorName: string;
  scheduledStartAt?: string;
  scheduledEndAt?: string;
  startedAt?: string;
  endedAt?: string;
  durationSeconds?: number;
  isRecording: boolean;
  chatEnabled: boolean;
  participantsCount: number;
  maxParticipants?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ParticipantResponse {
  id: string;
  userId: string;
  name: string;
  email: string;
  roleInRoom: 'organizer' | 'participant';
  isMuted: boolean;
  handRaised: boolean;
  joinedAt: string;
  leftAt?: string;
}

export interface ActionItem {
  id: string;
  task: string;
  assignee: string;
  deadline: string;
  status: string;  // Разрешаем любые строки, совместимые с enum
}

export interface ProtocolShortResponse {
  id: string;
  roomId: string;
  roomName: string;
  title: string;
  summary: string;
  createdAt: string;
  pdfUrl?: string;
}

// Добавить в types.ts перед или после ProtocolResponse:
export interface Protocol {
  id: string;
  roomId: string;
  title: string;
  createdAt: string;
  summaryJson?: {
    summary: string;
    topics: string[];
  };
  decisionsJson?: {
    decisions: string[];
  };
  actionItemsJson?: {
    action_items: ActionItem[];
  };
  topicsJson?: {
    topics: string[];
  };
  pdfUrl?: string;
  updatedAt?: string;
}

export interface ProtocolResponse {
  id: string;
  roomId: string;
  title: string;
  contentJson?: any;
  summaryJson?: {
    summary: string;
    topics: string[];
  };
  decisionsJson?: {
    decisions: string[];
  };
  actionItemsJson?: {
    action_items: ActionItem[];
  };
  topicsJson?: {
    topics: string[];
  };
  pdfUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Participant {
  id: string;
  userId: string;
  username: string;
  roleInRoom: 'organizer' | 'participant';
  isMuted: boolean;
  handRaised: boolean;
  presenceStatus: PresenceStatus;
}

export interface ChatMessage {
  id: string;
  userId?: string;
  username?: string;
  message: string;
  messageType: MessageType;
  createdAt: string;
  replyToId?: string;
  replyToMessage?: string;
  mentions?: string[];
  isEdited?: boolean;
  isDeleted?: boolean;
}
// ============================================
// API Response Types (добавить в types.ts)
// ============================================

export interface LoginResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
}

export interface RegisterResponse {
  success: boolean;
  user: UserResponse;
  message: string;
}

export interface RoomsListResponse {
  success: boolean;
  rooms: RoomResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface RoomDetailResponse {
  success: boolean;
  room: RoomResponse;
  participants: ParticipantResponse[];
  protocols: ProtocolShortResponse[];
}

export interface ProtocolsListResponse {
  success: boolean;
  protocols: ProtocolShortResponse[];
  total: number;
}