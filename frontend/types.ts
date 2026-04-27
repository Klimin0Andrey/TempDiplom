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
  first_name: string;
  last_name?: string;
  role: string;
  status: string;
  created_at: string;
  organization_id: string;
  organization_name?: string;
}

export interface RoomResponse {
  id: string;
  name: string;
  description?: string;
  invite_code: string;
  invite_link: string;
  status: RoomStatus;
  creator_id: string;
  creator_name: string;
  scheduled_start_at?: string;
  scheduled_end_at?: string;
  started_at?: string;
  ended_at?: string;
  duration_seconds?: number;
  is_recording: boolean;
  chat_enabled: boolean;
  participants_count: number;
  max_participants?: number;
  created_at: string;
  updated_at: string;
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
  room_id: string;
  room_name: string;
  title: string;
  summary: string;
  created_at: string;
  pdf_url?: string;
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
  room_id: string;
  title: string;
  content_json?: any;
  summary_json?: {
    summary: string;
    topics: string[];
  };
  decisions_json?: {
    decisions: string[];
  };
  action_items_json?: {
    action_items: ActionItem[];
  };
  topics_json?: {
    topics: string[];
  };
  pdf_url?: string;
  created_at: string;
  updated_at: string;
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
  user_id?: string;
  username?: string;
  message: string;
  message_type: MessageType;
  created_at: string;
  reply_to_id?: string;
  reply_to_message?: string;
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

export interface GenericResponse {
  success: boolean;
  message: string;
}

export interface UserInviteRequest {
  email: string;
  first_name: string;
  role: string;
}

export interface UserUpdateRequest {
  role?: string;
  status?: string;
}
