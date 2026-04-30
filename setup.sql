-- יצירת הטבלה
create table transactions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  description text not null,
  amount numeric not null,
  type text check (type in ('income', 'expense')) not null
);

-- ביטול הגנות כדי שתוכל לעבוד בלי מערכת התחברות
alter table transactions enable row level security;
create policy "Allow all access" on transactions for all using (true) with check (true);