
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Cabin, CabinStatus, CleaningChecklist, IssueType, Role } from '../types';
import { STATUS_COLORS, STATUS_LABELS } from '../constants';
import { Modal } from '../components/ui/Modal';
import { CabinIcon } from '../components/ui/CabinIcon';
import { AlertTriangle, CheckCircle, Wrench, LogOut, ClipboardCheck, Loader2 } from 'lucide-react';
import { CleaningChecklistUI } from '../components/ui/CleaningChecklist';

const Cabins: React.FC = () => {
  const { 
      cabins, updateCabinStatus, checkIn, reportIssue, resolveIssue,
      getCleaningChecklist, submitCleaningChecklist, approveCleaningChecklist
  } = useData();
  const { currentUser, hasRole } = useAuth();
  
  const [selectedCabin, setSelectedCabin] = useState<Cabin | null>(null);
  
  // Checklist State
  const [showChecklist, setShowChecklist] = useState(false);
  const [currentChecklist, setCurrentChecklist] = useState<CleaningChecklist | undefined>(undefined);
  const [loadingChecklist, setLoadingChecklist] = useState(false);

  // Form States
  const [guests, setGuests] = useState(2);
  const [nights, setNights] = useState(1);
  const [issueDesc, setIssueDesc] = useState('');

  if (!currentUser) return null;

  const handleCabinClick = async (cabin: Cabin) => {
    setSelectedCabin(cabin);
    setGuests(2);
    setNights(1);
    setIssueDesc('');
    setShowChecklist(false);
    setCurrentChecklist(undefined);

    // If cabin has a pending cleaning, pre-fetch it
    if (cabin.pendingCleaningId && (hasRole([Role.ADMIN, Role.RECEPTION]))) {
        setLoadingChecklist(true);
        const cl = await getCleaningChecklist(cabin.pendingCleaningId);
        if (cl) setCurrentChecklist(cl);
        setLoadingChecklist(false);
    }
  };

  const handleClose = () => {
    setSelectedCabin(null);
    setShowChecklist(false);
  };

  const handleOpenChecklist = () => {
      setShowChecklist(true);
  };

  const ActionButton = ({ onClick, color, icon: Icon, label, disabled = false, badge = null }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
        disabled 
            ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200' 
            : `bg-white hover:bg-gray-50 border-gray-100 hover:border-${color}-200 shadow-sm hover:shadow-md`
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-${color}-100 text-${color}-600`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="font-medium text-slate-700">{label}</span>
      </div>
      {badge && <div className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-bold">{badge}</div>}
    </button>
  );

  const renderActions = () => {
    if (!selectedCabin) return null;

    if (showChecklist) {
        return (
            <CleaningChecklistUI 
                cabinName={selectedCabin.name}
                checklist={currentChecklist}
                currentUser={currentUser}
                onSubmit={async (items) => {
                    await submitCleaningChecklist(selectedCabin.id, items, currentUser);
                    handleClose();
                }}
                onApprove={async () => {
                    if (currentChecklist) {
                        await approveCleaningChecklist(currentChecklist.id, currentUser);
                        handleClose();
                    }
                }}
            />
        );
    }

    const isAdmin = hasRole([Role.ADMIN]);
    const isReception = hasRole([Role.RECEPTION]);
    const isHousekeeping = hasRole([Role.HOUSEKEEPING]);
    const isTech = hasRole([Role.TECHNICAL]);

    const status = selectedCabin.status;

    return (
      <div className="space-y-3">
        {/* RECEPTION ACTIONS */}
        {(isAdmin || isReception) && status === CabinStatus.EMPTY_CLEAN && (
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
            <h4 className="font-bold text-blue-800 mb-3">ثبت اقامت جدید</h4>
            <div className="flex gap-4 mb-3">
              <div className="flex-1">
                <label className="text-xs text-blue-600 block mb-1">تعداد مهمان</label>
                <input 
                    type="number" 
                    value={guests} 
                    onChange={e => setGuests(Number(e.target.value))}
                    className="w-full p-2 rounded border border-blue-200 text-center" 
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-blue-600 block mb-1">تعداد شب</label>
                <input 
                    type="number" 
                    value={nights} 
                    onChange={e => setNights(Number(e.target.value))}
                    className="w-full p-2 rounded border border-blue-200 text-center" 
                />
              </div>
            </div>
            <button 
                onClick={() => {
                    checkIn(selectedCabin.id, guests, nights, currentUser);
                    handleClose();
                }}
                className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
                ثبت ورود (Check-In)
            </button>
          </div>
        )}

        {(isAdmin || isReception) && status === CabinStatus.OCCUPIED && (
          <ActionButton
            color="orange"
            icon={LogOut}
            label="تخلیه مسافر (ثبت خروج)"
            onClick={() => {
              if(window.confirm('آیا از تخلیه این کلبه اطمینان دارید؟ وضعیت به «خالی کثیف» تغییر می‌کند.')) {
                updateCabinStatus(selectedCabin.id, CabinStatus.EMPTY_DIRTY, currentUser, 'تخلیه مسافر');
                handleClose();
              }
            }}
          />
        )}

        {/* HOUSEKEEPING: FILL CHECKLIST */}
        {(isAdmin || isHousekeeping) && status === CabinStatus.EMPTY_DIRTY && !selectedCabin.pendingCleaningId && (
           <ActionButton
             color="emerald"
             icon={ClipboardCheck}
             label="شروع نظافت (چک‌لیست)"
             onClick={handleOpenChecklist}
           />
        )}

        {/* HOUSEKEEPING: ALREADY SUBMITTED */}
        {isHousekeeping && selectedCabin.pendingCleaningId && (
            <div className="bg-orange-50 p-4 rounded-xl text-center border border-orange-100">
                <p className="text-orange-700 font-bold text-sm">چک‌لیست نظافت ارسال شده است.</p>
                <p className="text-orange-600 text-xs mt-1">منتظر تایید پذیرش باشید.</p>
            </div>
        )}

        {/* RECEPTION: APPROVE CHECKLIST */}
        {(isAdmin || isReception) && selectedCabin.pendingCleaningId && (
             <ActionButton
             color="purple"
             icon={loadingChecklist ? Loader2 : ClipboardCheck}
             label={loadingChecklist ? 'در حال بارگذاری...' : 'بررسی و تایید نظافت'}
             onClick={() => {
                 if (!loadingChecklist) handleOpenChecklist();
             }}
             badge="نیاز به تایید"
           />
        )}

        {/* RECEPTION: Direct Clean (Fallback/Legacy) is REMOVED to force checklist usage, 
            but kept for ADMIN as override below 
        */}

        {/* TECHNICAL / ISSUE RESOLUTION */}
        {(isAdmin || isTech) && selectedCabin.activeIssueId && status === CabinStatus.ISSUE_TECH && (
             <ActionButton
             color="green"
             icon={Wrench}
             label="تایید رفع مشکل فنی"
             onClick={() => {
                if(selectedCabin.activeIssueId) resolveIssue(selectedCabin.activeIssueId, currentUser);
                updateCabinStatus(selectedCabin.id, CabinStatus.EMPTY_DIRTY, currentUser, 'مشکل فنی رفع شد');
                handleClose();
             }}
           />
        )}
        
        {/* Issue Reporting (Available to most roles) */}
        {!selectedCabin.activeIssueId && !showChecklist && (
            <div className="mt-6 border-t pt-4">
                <h4 className="font-bold text-gray-700 mb-3 text-sm">گزارش خرابی / مشکل</h4>
                <textarea 
                    className="w-full border rounded-lg p-2 text-sm mb-2"
                    placeholder="توضیح مشکل..."
                    value={issueDesc}
                    onChange={e => setIssueDesc(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-2">
                    <button 
                        disabled={!issueDesc}
                        onClick={() => {
                            reportIssue(selectedCabin.id, IssueType.TECHNICAL, issueDesc, currentUser);
                            handleClose();
                        }}
                        className="bg-slate-100 text-slate-700 p-2 rounded text-xs font-bold hover:bg-slate-200 disabled:opacity-50"
                    >
                        مشکل فنی
                    </button>
                    <button 
                        disabled={!issueDesc}
                        onClick={() => {
                            reportIssue(selectedCabin.id, IssueType.CLEANING, issueDesc, currentUser);
                            handleClose();
                        }}
                        className="bg-yellow-50 text-yellow-700 p-2 rounded text-xs font-bold hover:bg-yellow-100 disabled:opacity-50"
                    >
                        مشکل نظافت
                    </button>
                </div>
            </div>
        )}

        {/* ADMIN OVERRIDE */}
        {isAdmin && !showChecklist && (
            <div className="mt-8 pt-4 border-t border-red-100">
                <p className="text-xs text-red-400 mb-2 text-center">پنل اضطراری مدیر</p>
                <div className="grid grid-cols-3 gap-2">
                    {[CabinStatus.EMPTY_CLEAN, CabinStatus.EMPTY_DIRTY, CabinStatus.OCCUPIED].map(s => (
                        <button
                            key={s}
                            onClick={() => {
                                updateCabinStatus(selectedCabin.id, s, currentUser, 'تغییر دستی مدیر');
                                handleClose();
                            }}
                            className="text-[10px] bg-red-50 text-red-600 p-1 rounded hover:bg-red-100"
                        >
                            {STATUS_LABELS[s]}
                        </button>
                    ))}
                </div>
            </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-800 mb-6">وضعیت کلبه‌ها</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cabins.map((cabin) => {
           const colorClass = STATUS_COLORS[cabin.status];
           const hasIssue = cabin.status === CabinStatus.ISSUE_TECH || cabin.status === CabinStatus.ISSUE_CLEAN;
           const needsApproval = cabin.pendingCleaningId;
           
           return (
            <div
              key={cabin.id}
              onClick={() => handleCabinClick(cabin)}
              className={`relative overflow-hidden rounded-2xl border-2 p-4 transition-all active:scale-95 cursor-pointer shadow-sm ${colorClass}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="bg-white/50 p-3 rounded-xl backdrop-blur-sm shadow-sm">
                  <CabinIcon iconName={cabin.icon} className="w-8 h-8 opacity-80 text-slate-700" />
                </div>
                {hasIssue && (
                    <div className="animate-pulse bg-red-500 text-white p-1 rounded-full">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                )}
                {needsApproval && (
                     <div className="animate-pulse bg-blue-500 text-white p-1 px-2 rounded-full text-[10px] font-bold">
                        تایید نظافت
                    </div>
                )}
              </div>
              
              <h3 className="text-2xl font-bold mb-1">{cabin.name}</h3>
              <p className="text-sm font-medium opacity-80">{STATUS_LABELS[cabin.status]}</p>
              
              {/* Active Stay Info Mini Badge */}
              {cabin.status === CabinStatus.OCCUPIED && (
                  <div className="mt-3 text-xs bg-white/40 p-2 rounded-lg inline-block">
                     مهمان دارد
                  </div>
              )}
            </div>
          );
        })}
      </div>

      <Modal
        isOpen={!!selectedCabin}
        onClose={handleClose}
        title={
            selectedCabin ? (
                <div className="flex items-center gap-2">
                    <CabinIcon iconName={selectedCabin.icon} className="w-6 h-6 text-slate-500" />
                    <span>{showChecklist ? 'چک‌لیست نظافت' : `مدیریت کلبه ${selectedCabin.name}`}</span>
                </div>
            ) : ''
        }
      >
         {renderActions()}
      </Modal>
    </div>
  );
};

export default Cabins;
