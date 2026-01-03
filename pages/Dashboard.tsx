import React from 'react';
import { useData } from '../context/DataContext';
import { getTomorrow, isSameDay, formatDate } from '../utils/dateUtils';
import { Users, LogOut, Home, AlertTriangle } from 'lucide-react';
import { CabinStatus } from '../types';
import { CabinIcon } from '../components/ui/CabinIcon';

const Dashboard: React.FC = () => {
  const { cabins, stays, issues } = useData();
  const tomorrow = getTomorrow();

  // Calculate checkouts for tomorrow
  const checkoutsTomorrow = stays.filter(stay => 
    stay.isActive && isSameDay(new Date(stay.checkOutDate), tomorrow)
  );
  
  const totalLeavingGuests = checkoutsTomorrow.reduce((sum, stay) => sum + stay.guestCount, 0);

  // Status counts
  const occupiedCount = cabins.filter(c => c.status === CabinStatus.OCCUPIED).length;
  const readyCount = cabins.filter(c => c.status === CabinStatus.EMPTY_CLEAN).length;
  const issueCount = issues.filter(i => i.status !== 'RESOLVED').length;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-800">داشبورد وضعیت</h2>

      {/* Alert Banner */}
      {checkoutsTomorrow.length > 0 ? (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-4 shadow-sm">
          <div className="bg-orange-100 p-2 rounded-lg">
            <LogOut className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h3 className="font-bold text-orange-800 mb-1">گزارش تخلیه فردا</h3>
            <p className="text-sm text-orange-700">
              فردا ({formatDate(tomorrow.toISOString())})، تعداد 
              <span className="font-bold mx-1 text-lg">{totalLeavingGuests}</span>
              نفر از 
              <span className="font-bold mx-1 text-lg">{checkoutsTomorrow.length}</span>
              کلبه تخلیه می‌کنند.
            </p>
          </div>
        </div>
      ) : (
         <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
             <div className="bg-green-100 p-2 rounded-lg">
                 <LogOut className="w-6 h-6 text-green-600" />
             </div>
             <p className="text-green-800 font-medium">هیچ تخلیه‌ای برای فردا ثبت نشده است.</p>
         </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start mb-2">
            <span className="text-gray-500 text-sm">کلبه‌های پر</span>
            <Home className="w-5 h-5 text-blue-500" />
          </div>
          <span className="text-2xl font-bold text-slate-800">{occupiedCount}</span>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start mb-2">
            <span className="text-gray-500 text-sm">آماده تحویل</span>
            <Home className="w-5 h-5 text-emerald-500" />
          </div>
          <span className="text-2xl font-bold text-slate-800">{readyCount}</span>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start mb-2">
            <span className="text-gray-500 text-sm">مشکلات فعال</span>
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <span className="text-2xl font-bold text-slate-800">{issueCount}</span>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-2">
            <span className="text-gray-500 text-sm">تخلیه فردا</span>
            <Users className="w-5 h-5 text-orange-500" />
            </div>
            <span className="text-2xl font-bold text-slate-800">{checkoutsTomorrow.length}</span>
        </div>
      </div>

      {/* Detailed Checkout List */}
      {checkoutsTomorrow.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-bold text-slate-700">لیست تخلیه فردا</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="p-3">کلبه</th>
                  <th className="p-3">تعداد مهمان</th>
                  <th className="p-3">تاریخ ورود</th>
                  <th className="p-3">تاریخ خروج</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {checkoutsTomorrow.map(stay => {
                    const cabin = cabins.find(c => c.id === stay.cabinId);
                    const cabinName = cabin?.name || 'نامشخص';
                    return (
                        <tr key={stay.id}>
                            <td className="p-3 font-medium text-slate-800 flex items-center gap-2">
                                <CabinIcon iconName={cabin?.icon} className="w-5 h-5 text-slate-400" />
                                {cabinName}
                            </td>
                            <td className="p-3">{stay.guestCount} نفر</td>
                            <td className="p-3">{formatDate(stay.checkInDate)}</td>
                            <td className="p-3 text-red-600 font-bold">{formatDate(stay.checkOutDate)}</td>
                        </tr>
                    )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;