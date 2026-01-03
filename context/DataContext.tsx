
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Cabin, CabinStatus, CleaningChecklist, Issue, IssueStatus, Log, Notification, Stay, User, Role } from '../types';
import { MockDB } from '../services/mockDb';
import { v4 as uuidv4 } from 'uuid'; 
import { addDays } from '../utils/dateUtils';

const generateId = () => uuidv4();

interface DataContextType {
  cabins: Cabin[];
  users: User[];
  logs: Log[];
  issues: Issue[];
  stays: Stay[];
  notifications: Notification[];
  loading: boolean;
  dbError: string | null;
  refreshData: () => Promise<void>;
  
  // Actions
  addUser: (username: string, password: string, role: Role, operator: User) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>, operator: User) => Promise<void>;
  deleteUser: (id: string, operator: User) => Promise<void>;
  updateCabinStatus: (cabinId: string, status: CabinStatus, operator: User, details?: string) => Promise<void>;
  checkIn: (cabinId: string, guestCount: number, nights: number, operator: User) => Promise<void>;
  reportIssue: (cabinId: string, type: any, description: string, operator: User) => Promise<void>;
  resolveIssue: (issueId: string, operator: User) => Promise<void>;
  
  // Checklist Actions
  getCleaningChecklist: (id: string) => Promise<CleaningChecklist | null>;
  submitCleaningChecklist: (cabinId: string, items: Record<string, boolean>, operator: User) => Promise<void>;
  approveCleaningChecklist: (checklistId: string, operator: User) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cabins, setCabins] = useState<Cabin[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [stays, setStays] = useState<Stay[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  const refreshData = async () => {
    setDbError(null);
    try {
        await MockDB.checkConnection();
        
        const [c, u, l, i, s, n] = await Promise.all([
            MockDB.getCabins(),
            MockDB.getUsers(),
            MockDB.getLogs(),
            MockDB.getIssues(),
            MockDB.getStays(),
            MockDB.getNotifications(),
        ]);
        setCabins(c);
        setUsers(u);
        setLogs(l);
        setIssues(i);
        setStays(s);
        setNotifications(n);
        
        // Check for cleanup
        await MockDB.cleanupStays();

    } catch (e: any) {
        if (e.message === 'MISSING_TABLES') {
            setDbError('MISSING_TABLES');
        } else {
            console.error('Data Load Error:', e);
        }
    }
  };

  useEffect(() => {
    refreshData().finally(() => setLoading(false));
  }, []);

  const logAction = async (operator: User, action: string, details: string) => {
    if (dbError) return;
    const log: Log = {
      id: generateId(),
      userId: operator.id,
      username: operator.username,
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    await MockDB.addLog(log);
    
    const notif: Notification = {
      id: generateId(),
      message: `${operator.username}: ${action} - ${details}`,
      type: 'info',
      timestamp: new Date().toISOString(),
      read: false
    };
    await MockDB.addNotification(notif);
    
    setLogs(prev => [log, ...prev]);
    setNotifications(prev => [notif, ...prev]);
  };

  const updateCabinStatus = async (cabinId: string, status: CabinStatus, operator: User, details: string = '') => {
    const cabin = cabins.find(c => c.id === cabinId);
    if (!cabin) return;

    const updatedCabin = { ...cabin, status };
    
    if (![CabinStatus.ISSUE_CLEAN, CabinStatus.ISSUE_TECH, CabinStatus.UNDER_MAINTENANCE].includes(status)) {
        updatedCabin.activeIssueId = undefined;
    }

    if (cabin.status === CabinStatus.OCCUPIED && status === CabinStatus.EMPTY_DIRTY && cabin.currentStayId) {
         updatedCabin.currentStayId = undefined;
    }

    await MockDB.updateCabin(updatedCabin);
    await logAction(operator, 'CHANGE_STATUS', `${cabin.name} به ${status} تغییر یافت. ${details}`);
    await refreshData();
  };

  const checkIn = async (cabinId: string, guestCount: number, nights: number, operator: User) => {
    const cabin = cabins.find(c => c.id === cabinId);
    if (!cabin) return;

    const stay: Stay = {
      id: generateId(),
      cabinId,
      guestCount,
      nights,
      checkInDate: new Date().toISOString(),
      checkOutDate: addDays(new Date(), nights).toISOString(),
      createdBy: operator.username,
      isActive: true,
    };

    await MockDB.addStay(stay);
    
    const updatedCabin = { ...cabin, status: CabinStatus.OCCUPIED, currentStayId: stay.id };
    await MockDB.updateCabin(updatedCabin);
    
    await logAction(operator, 'CHECK_IN', `پذیرش در ${cabin.name} برای ${nights} شب`);
    await refreshData();
  };

  const reportIssue = async (cabinId: string, type: any, description: string, operator: User) => {
    const cabin = cabins.find(c => c.id === cabinId);
    if (!cabin) return;

    const issue: Issue = {
        id: generateId(),
        cabinId,
        type,
        description,
        reportedBy: operator.username,
        reportedAt: new Date().toISOString(),
        status: IssueStatus.OPEN
    };

    await MockDB.saveIssue(issue);

    const statusMap = {
        'TECHNICAL': CabinStatus.ISSUE_TECH,
        'CLEANING': CabinStatus.ISSUE_CLEAN
    };

    // @ts-ignore
    const newStatus = statusMap[type] || CabinStatus.UNDER_MAINTENANCE;
    const updatedCabin = { ...cabin, status: newStatus, activeIssueId: issue.id };
    await MockDB.updateCabin(updatedCabin);

    await logAction(operator, 'REPORT_ISSUE', `مشکل ${type} در ${cabin.name}: ${description}`);
    await refreshData();
  };

  const resolveIssue = async (issueId: string, operator: User) => {
      const issue = issues.find(i => i.id === issueId);
      if(!issue) return;

      const updatedIssue = { ...issue, status: IssueStatus.RESOLVED, resolvedAt: new Date().toISOString() };
      await MockDB.saveIssue(updatedIssue);
      
      await logAction(operator, 'RESOLVE_ISSUE', `مشکل ${issue.type} حل شد`);
      await refreshData();
  };

  const addUser = async (username: string, password: string, role: Role, operator: User) => {
    const newUser: User = {
        id: generateId(),
        username,
        password,
        role,
        createdAt: new Date().toISOString(),
        lastLogin: ''
    };
    await MockDB.saveUser(newUser);
    await logAction(operator, 'ADD_USER', `کاربر ${username} (${role}) ایجاد شد`);
    await refreshData();
  };

  const updateUser = async (id: string, updates: Partial<User>, operator: User) => {
    const user = users.find(u => u.id === id);
    if (!user) return;

    const updatedUser = { ...user, ...updates };
    await MockDB.updateUser(updatedUser);
    await logAction(operator, 'UPDATE_USER', `اطلاعات کاربر ${user.username} ویرایش شد`);
    await refreshData();
  };

  const deleteUser = async (id: string, operator: User) => {
    await MockDB.deleteUser(id);
    await logAction(operator, 'DELETE_USER', `کاربر با شناسه ${id} حذف شد`);
    await refreshData();
  };

  // --- Checklist Implementation ---

  const getCleaningChecklist = async (id: string) => {
      return await MockDB.getChecklist(id);
  };

  const submitCleaningChecklist = async (cabinId: string, items: Record<string, boolean>, operator: User) => {
      const cabin = cabins.find(c => c.id === cabinId);
      if (!cabin) return;

      const checklist: CleaningChecklist = {
          id: generateId(),
          cabinId: cabinId,
          items: items,
          filledBy: operator.username,
          status: 'SUBMITTED',
          createdAt: new Date().toISOString()
      };

      await MockDB.submitChecklist(checklist);
      await logAction(operator, 'SUBMIT_CLEANING', `چک‌لیست نظافت برای ${cabin.name} ثبت شد`);
      await refreshData();
  };

  const approveCleaningChecklist = async (checklistId: string, operator: User) => {
      const checklist = await MockDB.getChecklist(checklistId);
      if (!checklist) return;

      const cabin = cabins.find(c => c.id === checklist.cabinId);
      if (!cabin) return;

      // 1. Mark checklist as Approved
      await MockDB.approveChecklist(checklistId, operator.username);
      
      // 2. Change Cabin Status to EMPTY_CLEAN
      const updatedCabin = { ...cabin, status: CabinStatus.EMPTY_CLEAN };
      await MockDB.updateCabin(updatedCabin);

      await logAction(operator, 'APPROVE_CLEANING', `نظافت ${cabin.name} تایید شد`);
      await refreshData();
  };

  return (
    <DataContext.Provider value={{
      cabins, users, logs, issues, stays, notifications, loading, dbError, refreshData,
      addUser, updateUser, deleteUser, updateCabinStatus, checkIn, reportIssue, resolveIssue,
      getCleaningChecklist, submitCleaningChecklist, approveCleaningChecklist
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
};
