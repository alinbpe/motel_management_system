
export enum Role {
  ADMIN = 'ADMIN',
  RECEPTION = 'RECEPTION',
  HOUSEKEEPING = 'HOUSEKEEPING',
  TECHNICAL = 'TECHNICAL',
}

export enum CabinStatus {
  OCCUPIED = 'OCCUPIED', // پر
  EMPTY_DIRTY = 'EMPTY_DIRTY', // خالی - نظافت نشده
  EMPTY_CLEAN = 'EMPTY_CLEAN', // خالی - نظافت شده
  ISSUE_TECH = 'ISSUE_TECH', // مشکل فنی
  ISSUE_CLEAN = 'ISSUE_CLEAN', // مشکل نظافتی
  UNDER_MAINTENANCE = 'UNDER_MAINTENANCE', // در حال بررسی
}

export enum IssueType {
  TECHNICAL = 'TECHNICAL',
  CLEANING = 'CLEANING',
}

export enum IssueStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
}

export interface User {
  id: string;
  username: string;
  password?: string; // Added password field
  role: Role;
  createdAt: string;
  lastLogin: string;
}

export interface Cabin {
  id: string;
  name: string;
  status: CabinStatus;
  icon?: string; // Icon identifier
  currentStayId?: string; // Links to active stay
  activeIssueId?: string; // Links to active issue
  pendingCleaningId?: string; // Links to a submitted but unapproved cleaning checklist
}

export interface Stay {
  id: string;
  cabinId: string;
  guestCount: number;
  nights: number;
  checkInDate: string; // ISO String
  checkOutDate: string; // ISO String
  createdBy: string;
  isActive: boolean;
}

export interface Issue {
  id: string;
  cabinId: string;
  type: IssueType;
  description: string;
  reportedBy: string;
  reportedAt: string;
  status: IssueStatus;
  resolvedAt?: string;
}

export interface Log {
  id: string;
  userId: string;
  username: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: string;
  read: boolean;
}

export interface CleaningChecklist {
    id: string;
    cabinId: string;
    items: Record<string, boolean>;
    filledBy: string; // username
    approvedBy?: string; // username
    status: 'SUBMITTED' | 'APPROVED';
    createdAt: string;
    approvedAt?: string;
}
