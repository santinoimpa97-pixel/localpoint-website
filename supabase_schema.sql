-- Abilita l'estensione UUID se non è già attiva
create extension if not exists "uuid-ossp";

-- 1. Tabella Deposito Bagagli (Luggage Tickets)
create table luggage_tickets (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  customer_name text not null,
  customer_email text,
  customer_phone text,
  bag_count int not null,
  price decimal(10,2) not null,
  status text default 'stored' check (status in ('stored', 'returned')),
  checkout_at timestamp with time zone,
  payment_method text default 'cash' check (payment_method in ('cash', 'card', 'transfer', 'other'))
);

-- 2. Tabella Contabilità (Transactions)
create table transactions (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  type text not null check (type in ('income', 'expense')),
  category text not null, -- es. 'luggage', 'tour', 'bar', 'salary', 'other'
  amount decimal(10,2) not null,
  description text,
  date date default CURRENT_DATE,
  status text default 'active', -- 'active', 'deleted'
  -- NEW: Metodo di pagamento per tracciare cassa vs banca
  payment_method text default 'cash' check (payment_method in ('cash', 'card', 'transfer', 'other'))
);

-- 3. Tabella Prenotazioni (Reservations)
create table reservations (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  customer_name text not null,
  customer_phone text,
  customer_email text,
  service_type text not null,
  reservation_date timestamp with time zone not null,
  end_date timestamp with time zone,
  people_count int default 1,
  deposit decimal(10,2) default 0,
  total_price decimal(10,2) not null,
  supplier_name text,
  notes text,
  status text default 'confirmed' check (status in ('confirmed', 'pending', 'cancelled', 'completed')),
  payment_method text default 'cash' check (payment_method in ('cash', 'card', 'transfer', 'other'))
);

-- 4. Sicurezza (Row Level Security)
-- Abilita RLS su tutte le tabelle
alter table luggage_tickets enable row level security;
alter table transactions enable row level security;
alter table reservations enable row level security;

-- Crea una policy che permette TUTTO (select, insert, update, delete) 
-- SOLO agli utenti loggati (authenticated)
create policy "Admin access luggage" on luggage_tickets
  for all using (auth.role() = 'authenticated');

create policy "Admin access transactions" on transactions
  for all using (auth.role() = 'authenticated');

create policy "Admin access reservations" on reservations
  for all using (auth.role() = 'authenticated');

-- 5. Tabella Spedizioni (Shipments)
create table shipments (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  customer_name text not null,
  customer_email text,
  customer_phone text,
  tracking_number text not null,
  courier text not null check (courier in ('POSTE', 'SDA/POSTE', 'UPS', 'BRT')),
  amount decimal(10,2) default 0,
  payment_method text default 'cash',
  status text default 'pending' check (status in ('pending', 'shipped', 'delivered')),
  notes text
);

alter table shipments enable row level security;

create policy "Admin access shipments" on shipments
  for all using (auth.role() = 'authenticated');


-- 6. Tabella Fornitori (Suppliers)
create table suppliers (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  category text default 'altro' check (category in ('cibo', 'materiali', 'trasporti', 'servizi', 'tecnologia', 'altro')),
  contact_name text,
  phone text,
  email text,
  website text,
  address text,
  notes text,
  active boolean default true
);

alter table suppliers enable row level security;

create policy "Admin access suppliers" on suppliers
  for all using (auth.role() = 'authenticated');

-- 7. Pagamenti ai Partner
create table if not exists partner_payments (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  affiliate_id uuid references affiliates(id) on delete cascade not null,
  amount decimal(10,2) not null,
  payment_date date not null,
  method text default 'transfer' check (method in ('transfer', 'cash', 'other')),
  notes text
);

alter table partner_payments enable row level security;

create policy "Admin access partner_payments" on partner_payments
  for all using (auth.role() = 'authenticated');

-- MIGRATION COMMANDS (Run manuali se le tabelle esistono già)
-- Commissioni per-partner per categoria:
-- alter table affiliates add column if not exists commission_rate_luggage decimal(5,2) default 10;
-- alter table affiliates add column if not exists commission_rate_other decimal(5,2) default 7.5;
-- Dati anagrafici estesi:
-- alter table affiliates add column if not exists vat_number text;
-- alter table affiliates add column if not exists address text;
-- alter table affiliates add column if not exists website text;
-- alter table affiliates add column if not exists notes text;
-- Collegamento ticket bagagli → partner + stato transazione:
-- alter table luggage_tickets add column if not exists affiliate_id uuid references affiliates(id);
-- alter table luggage_tickets add column if not exists partner_status text default 'active' check (partner_status in ('active','noshow','excluded'));
-- alter table reservations add column if not exists partner_status text default 'active' check (partner_status in ('active','noshow','excluded'));


-- alter table transactions add column payment_method text default 'cash' check (payment_method in ('cash', 'card', 'transfer', 'other'));

-- MIGRATION: Add 'pending' to partner_status + add exclusion note columns
-- Run these on Supabase SQL Editor:
--
-- Step 1: Drop old check constraints (they don't allow 'pending')
-- ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_partner_status_check;
-- ALTER TABLE luggage_tickets DROP CONSTRAINT IF EXISTS luggage_tickets_partner_status_check;
-- Step 2: Re-add with 'pending' included
-- ALTER TABLE reservations ADD CONSTRAINT reservations_partner_status_check CHECK (partner_status IN ('active','pending','noshow','excluded'));
-- ALTER TABLE luggage_tickets ADD CONSTRAINT luggage_tickets_partner_status_check CHECK (partner_status IN ('active','pending','noshow','excluded'));
-- Step 3: Add exclusion note columns
-- ALTER TABLE reservations ADD COLUMN IF NOT EXISTS partner_status_note text;
-- ALTER TABLE luggage_tickets ADD COLUMN IF NOT EXISTS partner_status_note text;
