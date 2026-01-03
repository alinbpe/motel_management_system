
import { Cabin, CabinStatus, CleaningChecklist, Issue, Log, Notification, Role, Stay, User } from "../types";
import { CABIN_DEFINITIONS } from "../constants";
import { supabase } from "./supabaseClient";

// --- HELPERS ---
const handleError = (error: any, context: string) => {
    if (error) {
        // Log detailed error
        console.error(`Supabase Error [${context}]:`, error.message || JSON.stringify(error));
        return true;
    }
    return false;
};

// Map DB snake_case to App camelCase
const mapUser = (u: any): User => ({
    id: u.id,
    username: u.username || u.name, 
    password: u.password,
    role: u.role as Role,
    createdAt: u.created_at,
    lastLogin: u.last_login || new Date().toISOString()
});

const mapStay = (s: any, userMap: Map<string, string>): Stay => {
    const today = new Date();
    const checkOut = new Date(s.checkout_date);
    const isActive = checkOut >= today || (s.checkout_date && new Date(s.checkout_date).setHours(0,0,0,0) >= today.setHours(0,0,0,0));

    return {
        id: s.id,
        cabinId: s.cabin_id,
        guestCount: s.guest_count,
        nights: s.nights,
        checkInDate: s.checkin_date,
        checkOutDate: s.checkout_date,
        createdBy: userMap.get(s.created_by) || 'Unknown',
        isActive: true 
    };
};

const mapIssue = (i: any, userMap: Map<string, string>): Issue => ({
    id: i.id,
    cabinId: i.cabin_id,
    type: i.type,
    description: i.description,
    reportedBy: userMap.get(i.created_by) || 'Unknown',
    reportedAt: i.created_at,
    status: i.status,
    resolvedAt: i.resolved_at
});

const mapLog = (l: any, userMap: Map<string, string>): Log => ({
    id: l.id,
    userId: l.user_id,
    username: userMap.get(l.user_id) || 'System',
    action: l.action,
    details: l.details || l.entity || '',
    timestamp: l.created_at
});

const mapNotification = (n: any): Notification => ({
    id: n.id,
    message: n.message || n.title,
    type: 'info', 
    timestamp: n.created_at,
    read: n.read
});

const mapChecklist = (c: any, userMap: Map<string, string>): CleaningChecklist => ({
    id: c.id,
    cabinId: c.cabin_id,
    items: c.items,
    filledBy: userMap.get(c.filled_by) || 'Unknown',
    approvedBy: c.approved_by ? (userMap.get(c.approved_by) || 'Unknown') : undefined,
    status: c.status,
    createdAt: c.created_at,
    approvedAt: c.approved_at
});

export const MockDB = {
  checkConnection: async () => {
    const tables = ['users', 'cabins', 'issues', 'stays', 'logs', 'notifications', 'cleaning_checklists'];
    
    try {
        // Check all tables parallel
        await Promise.all(tables.map(t => 
            supabase.from(t).select('id').limit(1).then(({ error }) => {
                if (error) throw error;
            })
        ));
    } catch (error: any) {
        // Check for missing table error codes (Postgres 42P01)
        if (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('Could not find the table')) {
            throw new Error('MISSING_TABLES');
        }
        console.error('Connection Check Failed:', error.message || error);
        // Optional: Re-throw if it's a critical connection error that isn't just missing tables
    }
    return true;
  },

  getUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase.from('users').select('*');
    if (handleError(error, 'getUsers')) return [];
    return data?.map(mapUser) || [];
  },

  saveUser: async (user: User) => {
    const payload = {
        id: user.id,
        username: user.username,
        password: user.password,
        role: user.role,
        created_at: user.createdAt
    };
    const { error } = await supabase.from('users').insert(payload);
    handleError(error, 'saveUser');
  },

  updateUser: async (user: User) => {
    const payload = {
        username: user.username,
        password: user.password,
        role: user.role
    };
    const { error } = await supabase.from('users').update(payload).eq('id', user.id);
    handleError(error, 'updateUser');
  },

  deleteUser: async (id: string) => {
    const { error } = await supabase.from('users').delete().eq('id', id);
    handleError(error, 'deleteUser');
  },

  getCabins: async (): Promise<Cabin[]> => {
    const { data: cabinsData, error } = await supabase.from('cabins').select('*').order('name');
    if (handleError(error, 'getCabins')) return [];

    if (!cabinsData || cabinsData.length === 0) return [];

    const todayStr = new Date().toISOString().split('T')[0];
    const { data: activeStays } = await supabase
        .from('stays')
        .select('id, cabin_id')
        .gte('checkout_date', todayStr);

    const { data: activeIssues } = await supabase
        .from('issues')
        .select('id, cabin_id')
        .neq('status', 'RESOLVED');
    
    // Get submitted checklists that are not approved
    const { data: pendingCleanings } = await supabase
        .from('cleaning_checklists')
        .select('id, cabin_id')
        .eq('status', 'SUBMITTED');

    return cabinsData.map((c: any) => {
        const def = CABIN_DEFINITIONS.find(d => d.name === c.name);
        const stay = activeStays?.find((s: any) => s.cabin_id === c.id);
        const issue = activeIssues?.find((i: any) => i.cabin_id === c.id);
        const cleaning = pendingCleanings?.find((cl: any) => cl.cabin_id === c.id);

        return {
            id: c.id,
            name: c.name,
            status: c.status as CabinStatus,
            icon: def?.icon || 'Home',
            currentStayId: stay?.id,
            activeIssueId: issue?.id,
            pendingCleaningId: cleaning?.id
        };
    });
  },

  updateCabin: async (cabin: Cabin) => {
    const { error } = await supabase
        .from('cabins')
        .update({ status: cabin.status })
        .eq('id', cabin.id);
    handleError(error, 'updateCabin');
  },

  getStays: async (): Promise<Stay[]> => {
    const { data, error } = await supabase.from('stays').select('*').order('created_at', { ascending: false });
    if (handleError(error, 'getStays')) return [];
    
    const { data: users } = await supabase.from('users').select('id, username');
    const userMap = new Map(users?.map((u: any) => [u.id, u.username]) || []);

    return data?.map(s => mapStay(s, userMap)) || [];
  },

  addStay: async (stay: Stay) => {
      // Find User ID from username
      const { data: uData } = await supabase.from('users').select('id').eq('username', stay.createdBy).single();
      const userId = uData?.id;

      const payload = {
          id: stay.id,
          cabin_id: stay.cabinId,
          guest_count: stay.guestCount,
          nights: stay.nights,
          checkin_date: stay.checkInDate,
          checkout_date: stay.checkOutDate,
          created_by: userId
      };
      
      const { error } = await supabase.from('stays').insert(payload);
      handleError(error, 'addStay');
  },

  cleanupStays: async () => {
      return false; 
  },

  getIssues: async (): Promise<Issue[]> => {
    const { data, error } = await supabase.from('issues').select('*').order('created_at', { ascending: false });
    if (handleError(error, 'getIssues')) return [];

    const { data: users } = await supabase.from('users').select('id, username');
    const userMap = new Map(users?.map((u: any) => [u.id, u.username]) || []);

    return data?.map(i => mapIssue(i, userMap)) || [];
  },

  saveIssue: async (issue: Issue) => {
     const { data: existing } = await supabase.from('issues').select('id').eq('id', issue.id).single();
     
     const { data: uData } = await supabase.from('users').select('id').eq('username', issue.reportedBy).single();
     const userId = uData?.id;

     const payload = {
         id: issue.id,
         cabin_id: issue.cabinId,
         type: issue.type,
         description: issue.description,
         status: issue.status,
         created_by: userId,
         created_at: issue.reportedAt,
         resolved_at: issue.resolvedAt
     };

     if (existing) {
         const { error } = await supabase.from('issues').update(payload).eq('id', issue.id);
         handleError(error, 'updateIssue');
     } else {
         const { error } = await supabase.from('issues').insert(payload);
         handleError(error, 'saveIssue');
     }
  },

  getLogs: async (): Promise<Log[]> => {
      const { data, error } = await supabase.from('logs').select('*').order('created_at', { ascending: false }).limit(100);
      if (handleError(error, 'getLogs')) return [];

      const { data: users } = await supabase.from('users').select('id, username');
      const userMap = new Map(users?.map((u: any) => [u.id, u.username]) || []);

      return data?.map(l => mapLog(l, userMap)) || [];
  },

  addLog: async (log: Log) => {
      const payload = {
          id: log.id,
          user_id: log.userId,
          action: log.action,
          details: log.details,
          created_at: log.timestamp
      };
      const { error } = await supabase.from('logs').insert(payload);
      handleError(error, 'addLog');
  },

  getNotifications: async (): Promise<Notification[]> => {
      const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50);
      if (handleError(error, 'getNotifications')) return [];
      return data?.map(mapNotification) || [];
  },

  addNotification: async (notif: Notification) => {
      const payload = {
          id: notif.id,
          message: notif.message,
          read: notif.read,
          created_at: notif.timestamp
      };
      const { error } = await supabase.from('notifications').insert(payload);
      handleError(error, 'addNotification');
  },

  // --- CLEANING CHECKLIST METHODS ---
  getChecklist: async (checklistId: string): Promise<CleaningChecklist | null> => {
      const { data, error } = await supabase.from('cleaning_checklists').select('*').eq('id', checklistId).single();
      if (handleError(error, 'getChecklist')) return null;
      if (!data) return null;

      const { data: users } = await supabase.from('users').select('id, username');
      const userMap = new Map(users?.map((u: any) => [u.id, u.username]) || []);
      
      return mapChecklist(data, userMap);
  },

  submitChecklist: async (checklist: CleaningChecklist) => {
    const { data: uData } = await supabase.from('users').select('id').eq('username', checklist.filledBy).single();
    const userId = uData?.id;

    const payload = {
        id: checklist.id,
        cabin_id: checklist.cabinId,
        items: checklist.items,
        filled_by: userId,
        status: 'SUBMITTED',
        created_at: checklist.createdAt
    };
    const { error } = await supabase.from('cleaning_checklists').insert(payload);
    handleError(error, 'submitChecklist');
  },

  approveChecklist: async (checklistId: string, approverUsername: string) => {
      const { data: uData } = await supabase.from('users').select('id').eq('username', approverUsername).single();
      const userId = uData?.id;

      const payload = {
          status: 'APPROVED',
          approved_by: userId,
          approved_at: new Date().toISOString()
      };
      const { error } = await supabase.from('cleaning_checklists').update(payload).eq('id', checklistId);
      handleError(error, 'approveChecklist');
  }
};
