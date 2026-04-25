-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  fcm_token text,
  google_access_token text,
  google_refresh_token text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Categories table
create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  color text not null default '#6B7280',
  created_at timestamptz default now() not null
);

-- Tasks table
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  memo text,
  due_date date,
  due_time time,
  category_id uuid references public.categories(id) on delete set null,
  priority text not null default 'medium' check (priority in ('high', 'medium', 'low')),
  is_completed boolean not null default false,
  google_calendar_event_id text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Subtasks table
create table public.subtasks (
  id uuid default uuid_generate_v4() primary key,
  task_id uuid references public.tasks(id) on delete cascade not null,
  title text not null,
  is_completed boolean not null default false,
  created_at timestamptz default now() not null
);

-- Reminders table
create table public.reminders (
  id uuid default uuid_generate_v4() primary key,
  task_id uuid references public.tasks(id) on delete cascade not null,
  remind_at timestamptz not null,
  is_sent boolean not null default false,
  created_at timestamptz default now() not null
);

-- Enable Row Level Security
alter table public.users enable row level security;
alter table public.categories enable row level security;
alter table public.tasks enable row level security;
alter table public.subtasks enable row level security;
alter table public.reminders enable row level security;

-- RLS Policies for users
create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- RLS Policies for categories
create policy "Users can view own categories"
  on public.categories for select
  using (auth.uid() = user_id);

create policy "Users can create own categories"
  on public.categories for insert
  with check (auth.uid() = user_id);

create policy "Users can update own categories"
  on public.categories for update
  using (auth.uid() = user_id);

create policy "Users can delete own categories"
  on public.categories for delete
  using (auth.uid() = user_id);

-- RLS Policies for tasks
create policy "Users can view own tasks"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "Users can create own tasks"
  on public.tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own tasks"
  on public.tasks for update
  using (auth.uid() = user_id);

create policy "Users can delete own tasks"
  on public.tasks for delete
  using (auth.uid() = user_id);

-- RLS Policies for subtasks
create policy "Users can view own subtasks"
  on public.subtasks for select
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = subtasks.task_id
      and tasks.user_id = auth.uid()
    )
  );

create policy "Users can create subtasks for own tasks"
  on public.subtasks for insert
  with check (
    exists (
      select 1 from public.tasks
      where tasks.id = subtasks.task_id
      and tasks.user_id = auth.uid()
    )
  );

create policy "Users can update own subtasks"
  on public.subtasks for update
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = subtasks.task_id
      and tasks.user_id = auth.uid()
    )
  );

create policy "Users can delete own subtasks"
  on public.subtasks for delete
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = subtasks.task_id
      and tasks.user_id = auth.uid()
    )
  );

-- RLS Policies for reminders
create policy "Users can view own reminders"
  on public.reminders for select
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = reminders.task_id
      and tasks.user_id = auth.uid()
    )
  );

create policy "Users can create reminders for own tasks"
  on public.reminders for insert
  with check (
    exists (
      select 1 from public.tasks
      where tasks.id = reminders.task_id
      and tasks.user_id = auth.uid()
    )
  );

create policy "Users can delete own reminders"
  on public.reminders for delete
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = reminders.task_id
      and tasks.user_id = auth.uid()
    )
  );

-- Function to auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);

  -- Insert default categories
  insert into public.categories (user_id, name, color) values
    (new.id, '仕事', '#3B82F6'),
    (new.id, '個人', '#10B981'),
    (new.id, '健康', '#F59E0B');

  return new;
end;
$$ language plpgsql security definer;

-- Trigger: create profile on auth.users insert
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_tasks_updated_at
  before update on public.tasks
  for each row execute procedure public.update_updated_at();

create trigger update_users_updated_at
  before update on public.users
  for each row execute procedure public.update_updated_at();
