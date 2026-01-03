
import React, { useState, useEffect } from 'react';
import { CLEANING_ITEMS } from '../../constants';
import { CleaningChecklist, User } from '../../types';
import { Check, ClipboardList, AlertCircle, Loader2 } from 'lucide-react';

interface Props {
  cabinName: string;
  checklist?: CleaningChecklist; // Existing checklist (for viewing/approving)
  onSubmit: (items: Record<string, boolean>) => Promise<void>;
  onApprove?: () => Promise<void>;
  currentUser: User;
  isReadOnly?: boolean;
}

export const CleaningChecklistUI: React.FC<Props> = ({ 
    cabinName, checklist, onSubmit, onApprove, currentUser, isReadOnly = false 
}) => {
  const [items, setItems] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (checklist) {
        setItems(checklist.items);
    } else {
        // Initialize empty
        const initial: Record<string, boolean> = {};
        CLEANING_ITEMS.forEach(item => initial[item] = false);
        setItems(initial);
    }
  }, [checklist]);

  const toggleItem = (item: string) => {
    if (isReadOnly || (checklist && checklist.status === 'APPROVED')) return;
    setItems(prev => ({ ...prev, [item]: !prev[item] }));
  };

  const checkedCount = Object.values(items).filter(Boolean).length;
  const progress = Math.round((checkedCount / CLEANING_ITEMS.length) * 100);
  const isComplete = progress === 100;

  const handleSubmit = async () => {
      if (!isComplete) return;
      setIsSubmitting(true);
      await onSubmit(items);
      setIsSubmitting(false);
  };

  const handleApprove = async () => {
      if (!onApprove) return;
      setIsSubmitting(true);
      await onApprove();
      setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col h-full max-h-[70vh]">
        <div className="mb-4 sticky top-0 bg-white z-10 pb-2 border-b">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-blue-600" />
                    چک‌لیست نظافت {cabinName}
                </h3>
                <span className={`text-sm font-bold ${progress === 100 ? 'text-green-600' : 'text-orange-500'}`}>
                    {progress}%
                </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                    className={`h-2.5 rounded-full transition-all duration-500 ${progress === 100 ? 'bg-green-500' : 'bg-orange-500'}`} 
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-2 pb-4">
            {CLEANING_ITEMS.map((item, idx) => (
                <div 
                    key={idx}
                    onClick={() => toggleItem(item)}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-all 
                        ${items[item] 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }
                        ${!isReadOnly ? 'cursor-pointer active:scale-[0.99]' : ''}
                    `}
                >
                    <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors
                        ${items[item] ? 'bg-green-500 border-green-500' : 'border-gray-300 bg-white'}
                    `}>
                        {items[item] && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span className={`text-sm ${items[item] ? 'text-green-800 font-medium' : 'text-slate-600'}`}>
                        {item}
                    </span>
                </div>
            ))}
        </div>

        <div className="pt-4 mt-2 border-t sticky bottom-0 bg-white z-10">
            {/* Action Buttons based on context */}
            {!checklist && !isReadOnly && (
                <button
                    onClick={handleSubmit}
                    disabled={!isComplete || isSubmitting}
                    className={`w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all
                        ${isComplete 
                            ? 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200' 
                            : 'bg-gray-300 cursor-not-allowed'
                        }
                    `}
                >
                    {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : <Check className="w-5 h-5" />}
                    ثبت نهایی نظافت
                </button>
            )}

            {checklist && onApprove && (
                <div className="space-y-3">
                    <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-700 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <p>توسط {checklist.filledBy} ثبت شده است. با تایید شما، وضعیت کلبه به «آماده» تغییر می‌کند.</p>
                    </div>
                    <button
                        onClick={handleApprove}
                        disabled={isSubmitting}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : <Check className="w-5 h-5" />}
                        تایید کیفیت و تغییر وضعیت
                    </button>
                </div>
            )}
            
            {isReadOnly && checklist?.approvedBy && (
                 <div className="bg-green-50 p-3 rounded-lg text-xs text-green-700 flex items-center gap-2 border border-green-100">
                    <Check className="w-4 h-4 shrink-0" />
                    <p>تایید شده توسط {checklist.approvedBy} در تاریخ {new Date(checklist.approvedAt || '').toLocaleDateString('fa-IR')}</p>
                </div>
            )}
        </div>
    </div>
  );
};
