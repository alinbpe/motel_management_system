
import React from 'react';
import { Database, Copy, Check } from 'lucide-react';

const SETUP_SQL = `-- 1. ایجاد جداول اصلی
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password text,
  role text not null check (role in ('ADMIN','RECEPTION','HOUSEKEEPING','TECHNICAL')),
  created_at timestamp with time zone default now(),
  last_login timestamp with time zone
);

create table if not exists public.cabins (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  status text not null,
  created_at timestamp with time zone default now()
);

create table if not exists public.issues (
  id uuid primary key default gen_random_uuid(),
  cabin_id uuid references public.cabins(id),
  type text,
  status text,
  description text,
  created_by uuid references public.users(id),
  created_at timestamp with time zone default now(),
  resolved_at timestamp with time zone
);

create table if not exists public.stays (
  id uuid primary key default gen_random_uuid(),
  cabin_id uuid references public.cabins(id),
  guest_count int,
  nights int,
  checkin_date date,
  checkout_date date,
  created_by uuid references public.users(id),
  created_at timestamp with time zone default now()
);

create table if not exists public.logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  action text,
  details text,
  created_at timestamp with time zone default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  message text,
  read boolean default false,
  created_at timestamp with time zone default now()
);

create table if not exists public.cleaning_checklists (
  id uuid primary key default gen_random_uuid(),
  cabin_id uuid references public.cabins(id),
  items jsonb not null,
  filled_by uuid references public.users(id),
  approved_by uuid references public.users(id),
  status text check (status in ('SUBMITTED','APPROVED')),
  created_at timestamp with time zone default now(),
  approved_at timestamp with time zone
);

-- 2. فعال‌سازی RLS
alter table public.users enable row level security;
alter table public.cabins enable row level security;
alter table public.issues enable row level security;
alter table public.stays enable row level security;
alter table public.logs enable row level security;
alter table public.notifications enable row level security;
alter table public.cleaning_checklists enable row level security;

-- 3. ایجاد سیاست‌های دسترسی (Public برای سادگی فعلی)
create policy "Public access" on public.users for all using (true);
create policy "Public access" on public.cabins for all using (true);
create policy "Public access" on public.issues for all using (true);
create policy "Public access" on public.stays for all using (true);
create policy "Public access" on public.logs for all using (true);
create policy "Public access" on public.notifications for all using (true);
create policy "Public access" on public.cleaning_checklists for all using (true);

-- 4. داده‌های اولیه کلبه‌ها
insert into public.cabins (name, status) values
('شوکا', 'EMPTY_CLEAN'),
('میچکا', 'EMPTY_CLEAN'),
('پاپلی', 'EMPTY_CLEAN'),
('اوپاچ', 'EMPTY_CLEAN'),
('زیک', 'EMPTY_CLEAN'),
('سرخدار', 'EMPTY_CLEAN'),
('شمشاد', 'EMPTY_CLEAN'),
('مرال', 'EMPTY_CLEAN'),
('نمازین', 'EMPTY_CLEAN')
on conflict (name) do nothing;

-- 5. ایجاد کاربر مدیر پیش‌فرض
insert into public.users (username, password, role) 
values ('admin', '123', 'ADMIN')
on conflict (username) do nothing;
`;

export const DbSetup: React.FC = () => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(SETUP_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white max-w-4xl w-full rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 bg-red-50 border-b border-red-100 flex items-center gap-4">
          <div className="bg-red-100 p-3 rounded-full">
            <Database className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-red-800">پایگاه داده یافت نشد</h1>
            <p className="text-red-600 text-sm mt-1">
              جداول مورد نیاز در Supabase پیدا نشدند. لطفاً اسکریپت زیر را در بخش SQL Editor پروژه خود اجرا کنید.
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="p-4 bg-slate-800 text-white flex justify-between items-center">
            <span className="text-sm font-mono text-slate-400">setup_schema.sql</span>
            <button 
              onClick={handleCopy}
              className="flex items-center gap-2 text-sm bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'کپی شد!' : 'کپی اسکریپت'}
            </button>
          </div>
          <div className="flex-1 overflow-auto bg-slate-900 p-4 text-left dir-ltr">
            <pre className="text-sm font-mono text-green-400 whitespace-pre-wrap leading-relaxed">
              {SETUP_SQL}
            </pre>
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50 text-center">
            <p className="text-sm text-gray-600">
                پس از اجرای کد بالا در Supabase، این صفحه را رفرش کنید.
            </p>
            <button 
                onClick={() => window.location.reload()}
                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
                رفرش صفحه
            </button>
        </div>
      </div>
    </div>
  );
};
