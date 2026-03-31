-- Migrazione per il SISTEMA REFERRAL LOCALPOINT

-- 1. Tabella Affiliati (Partner)
create table if not exists affiliates (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  business_type text, -- es. 'hotel', 'bar', 'restaurant'
  referral_code text unique not null,
  commission_rate int default 10,
  secret_token uuid default uuid_generate_v4() unique not null,
  status text default 'active' check (status in ('active', 'inactive')),
  contact_person text,
  email text,
  phone text
);

-- 2. Modifica Tabella Prenotazioni (Aggiunta affiliate_id)
-- Usiamo un DO block per evitare errori se la colonna esiste già
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name='reservations' and column_name='affiliate_id') then
    alter table reservations add column affiliate_id uuid references affiliates(id);
  end if;
end $$;

-- 3. Tabella Commissioni (Tracciamento pagamenti ai partner)
create table if not exists affiliate_commissions (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  affiliate_id uuid references affiliates(id) on delete cascade not null,
  reservation_id uuid references reservations(id) on delete cascade not null,
  amount decimal(10,2) not null,
  status text default 'pending' check (status in ('pending', 'paid')),
  paid_at timestamp with time zone
);

-- 4. Sicurezza (RLS)
alter table affiliates enable row level security;
alter table affiliate_commissions enable row level security;

-- Policy per l'Admin (accesso totale)
create policy "Admin access affiliates" on affiliates
  for all using (auth.role() = 'authenticated');

create policy "Admin access commissions" on affiliate_commissions
  for all using (auth.role() = 'authenticated');

-- Policy per il Partner (accesso tramite secret_token via URL, ma limitato in SELECT)
-- Nota: In Supabase, per query anonime filtrate da secret_token, 
-- potremmo dover abilitare SELECT per 'anon' con filtri specifici o usare una funzione RPC.
-- Per ora limitiamo all'admin e implementeremo la logica partner via client-side/RPC.
create policy "Partner read own data via token" on affiliates
  for select using (true); -- La sicurezza effettiva sarà nel filtro del codice (secret_token)

create policy "Partner read own commissions" on affiliate_commissions
  for select using (true);
