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

-- MIGRATION COMMANDS (Run manuali se le tabelle esistono già)
-- alter table transactions add column payment_method text default 'cash' check (payment_method in ('cash', 'card', 'transfer', 'other'));
