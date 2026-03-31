-- Schema for 'experiences' catalog

CREATE TABLE public.experiences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug_id TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    emoji TEXT,
    description TEXT,
    price TEXT,
    price_note TEXT,
    images JSONB DEFAULT '[]'::JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for the public facing tourist services page)
CREATE POLICY "Allow public read access to experiences"
ON public.experiences
FOR SELECT
TO public
USING (is_active = true);

-- Allow authenticated users (admin dashboard) full access
CREATE POLICY "Allow admin full access to experiences"
ON public.experiences
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ==========================================================
-- Insert Initial Data from catalog_data.js
-- ==========================================================

INSERT INTO public.experiences (slug_id, category, title, emoji, description, price, price_note, images, is_active) VALUES
-- Escursioni
('tramonto-capo-milazzo', 'escursioni', 'Tramonto a Capo Milazzo', '🌅', 'Tour di 3 ore al tramonto in Area Marina Protetta. Snorkeling guidato nelle calette più suggestive di Capo Milazzo con cibo e bevande inclusi.', '150€', 'a persona · tutto incluso', '["/catalog/escursioni/escursione-tramonto-a-capo-milazzo/1.jpeg", "/catalog/escursioni/escursione-tramonto-a-capo-milazzo/2.jpeg", "/catalog/escursioni/escursione-tramonto-a-capo-milazzo/3.jpeg"]'::JSONB, true),
('cavallo', 'escursioni', 'Escursione a Cavallo', '🐎', 'Passeggiata sul lungomare fino alla Baia del Tono o trekking in montagna a San Pier Niceto. Assicurazione inclusa.', 'Da 60€', 'a persona · assic. inclusa', '["/catalog/escursioni/escursioni-a-cavallo/1.jpeg", "/catalog/escursioni/escursioni-a-cavallo/2.jpeg", "/catalog/escursioni/escursioni-a-cavallo/3.jpeg"]'::JSONB, true),
('cannistra', 'escursioni', 'Museo a Cielo Aperto Cannistrà', '🎨', '3 ore di percorso a piedi tra murales incredibili e opere d''arte nel borgo di Cannistrà. Guida esperta inclusa.', 'Su Preventivo', 'per gruppo', '["/catalog/escursioni/escursioni-cannistra/1.jpeg", "/catalog/escursioni/escursioni-cannistra/2.jpeg", "/catalog/escursioni/escursioni-cannistra/3.jpeg"]'::JSONB, true),
('castro', 'escursioni', 'Castro: Duomo & Planetario', '🔭', 'Visita al Duomo di Castro, pranzo tipico, passeggiata panoramica e show al Planetario dove vedrete il cielo dalle origini ai giorni nostri. Rinfresco finale incluso.', 'Su Preventivo', 'pranzo e osservatorio inclusi', '["/catalog/escursioni/escursioni-castro/1.jpeg", "/catalog/escursioni/escursioni-castro/2.jpeg", "/catalog/escursioni/escursioni-castro/3.jpeg"]'::JSONB, true),
('cataolo', 'escursioni', 'Cascate del Cataolo', '🏞️', 'Escursione di 2 ore nelle cascate più belle della zona. Natura incontaminata e adrenalina pura. Assicurazione inclusa.', '30€', 'a persona · assic. inclusa', '["/catalog/escursioni/escursioni-cataolo/1.jpeg", "/catalog/escursioni/escursioni-cataolo/2.jpeg", "/catalog/escursioni/escursioni-cataolo/3.jpeg"]'::JSONB, true),
('jalari', 'escursioni', 'Parco Jalari', '🗿', '42 botteghe etnografiche, pietre scolpite da artisti locali e opere di arte rupestre. Guida esperta inclusa.', 'Su Preventivo', 'per gruppo · guida inclusa', '["/catalog/escursioni/escursioni-parco-jalari/1.jpeg", "/catalog/escursioni/escursioni-parco-jalari/2.jpeg", "/catalog/escursioni/escursioni-parco-jalari/3.jpeg"]'::JSONB, true),
('quad-etna', 'escursioni', 'Quad sull''Etna', '🏔️', 'Tour in Quad all''Etna e alle Gole dell''Alcantara. Disponibili tour da 1h, 2h30 e 4-5 ore. Transfer incluso.', 'Da 59€', 'a persona · varie durate', '["/catalog/escursioni/escursioni-quad/1.jpeg", "/catalog/escursioni/escursioni-quad/2.jpeg", "/catalog/escursioni/escursioni-quad/3.jpeg"]'::JSONB, true),
('diving-sub', 'escursioni', 'Diving & Snorkeling AMP', '🤿', 'Immersioni guidate in Area Marina Protetta, snorkeling di 3 ore nelle calette, battesimo del mare per principianti. Attrezzatura e foto digitali incluse.', 'Da 55€', 'a persona · attrezz. inclusa', '["/catalog/escursioni/escursioni-sub/1.jpeg", "/catalog/escursioni/escursioni-sub/2.jpeg", "/catalog/escursioni/escursioni-sub/3.jpeg"]'::JSONB, true),
('tindari', 'escursioni', 'Santuario di Tindari', '⛪', 'Visita al Santuario della Madonna Nera di Tindari, al teatro greco IV secolo a.C. e alle suggestive Laghetti di Marinello.', 'Su Preventivo', 'navetta + guida inclusa', '["/catalog/escursioni/escursioni-tindari/1.jpeg", "/catalog/escursioni/escursioni-tindari/2.jpeg", "/catalog/escursioni/escursioni-tindari/3.jpeg"]'::JSONB, true),
('piscine-venere', 'escursioni', 'Piscine di Venere e Castello', '🏰', 'Trekking panoramico alle Piscine di Venere (5€) e visita al maestoso Castello di Milazzo (7€). Fattibile a piedi, bici o navetta.', 'Su Preventivo', 'guida inclusa', '["/catalog/escursioni/piscine-di-venere-castello/1.jpeg", "/catalog/escursioni/piscine-di-venere-castello/2.jpeg", "/catalog/escursioni/piscine-di-venere-castello/3.jpeg"]'::JSONB, true),
('skycharter-eolie', 'escursioni', 'Escursioni Eolie SkyCharter', '⛵', 'Tour esclusivi ed eleganti tra le Isole Eolie a bordo di imbarcazioni di lusso. Prezzi su richiesta (variano per stagione e carburante).', 'Su Richiesta', 'prezzi variabili per periodo', '["/catalog/escursioni/skycharter-escursionoi/1.jpeg", "/catalog/escursioni/skycharter-escursionoi/2.jpeg", "/catalog/escursioni/skycharter-escursionoi/3.jpeg"]'::JSONB, true),

-- Noleggi
('motorini', 'noleggi', 'Noleggio Motorini', '🛵', 'Esplora Milazzo su due ruote in totale libertà. Km illimitati, copertura assicurativa e casco inclusi.', '45€', 'al giorno · km illimitati', '["/catalog/noleggi/motorini/1.jpeg", "/catalog/noleggi/motorini/2.jpeg", "/catalog/noleggi/motorini/3.jpeg"]'::JSONB, true),
('noleggio-auto', 'noleggi', 'Noleggio Auto', '🚗', 'City car moderne (Panda, 500, Golf) per muoverti comodamente. 100km/giorno inclusi, km extra a 0.15€/km. Transfer possibile.', 'Da 35€', 'al giorno · 100km inclusi', '["/catalog/noleggi/noleggio-auto/1.jpeg", "/catalog/noleggi/noleggio-auto/2.jpeg", "/catalog/noleggi/noleggio-auto/3.jpeg"]'::JSONB, true),
('skycharter-noleggio', 'noleggi', 'Noleggio Barca SkyCharter', '🚤', 'Imbarcazioni di qualità con conducente per esplorare le acque cristalline attorno a Milazzo e alle Isole Eolie.', 'Da 210€', 'al giorno · conducente incl.', '["/catalog/noleggi/skycharter/1.jpeg", "/catalog/noleggi/skycharter/2.jpeg", "/catalog/noleggi/skycharter/3.jpeg"]'::JSONB, true),
('spartivento-catamarani', 'noleggi', 'Catamarani & Barche a Vela (Spartivento)', '⛵', 'Imbarcazioni di puro lusso e design per un''esperienza esclusiva al largo delle Isole Eolie. Prezzi su richiesta in base alla stagione.', 'Su Richiesta', 'prezzi su preventivo', '["/catalog/noleggi/spartivento/1.jpeg", "/catalog/noleggi/spartivento/2.jpeg", "/catalog/noleggi/spartivento/3.jpeg"]'::JSONB, true),

-- Parcheggio
('auto-scoperto', 'parcheggio', 'Auto - Scoperto', '🅿️', 'Parcheggio scoperto sicuro, videosorvegliato e a due passi dal porto. Ideale per chi parte per le Isole.', '10€', 'al giorno', '["/catalog/parcheggio-minion-aprking/general/1.jpeg", "/catalog/parcheggio-minion-aprking/general/2.jpeg"]'::JSONB, true),
('auto-coperto', 'parcheggio', 'Auto - Coperto', '🏗️', 'Parcheggio al coperto per proteggere la tua auto da sole, pioggia e intemperie mentre sei alle Eolie.', '15€', 'al giorno', '["/catalog/parcheggio-minion-aprking/general/3.jpeg", "/catalog/parcheggio-minion-aprking/general/4.jpeg"]'::JSONB, true),
('settimanale', 'parcheggio', 'Pacchetto Settimanale', '📅', 'Parte tranquillo per una settimana intera alle Isole Eolie. Risparmio garantito rispetto alla tariffa giornaliera.', '50€', '7 giorni · scoperto', '["/catalog/parcheggio-minion-aprking/general/1.jpeg", "/catalog/parcheggio-minion-aprking/general/2.jpeg"]'::JSONB, true),
('furgoni', 'parcheggio', 'Furgoni & Pulmini 9 Posti', '🚐', 'Ampio spazio scoperto dedicato a furgoni commerciali, pulmini fino a 9 posti e veicoli di grandi dimensioni.', '15€', 'al giorno · scoperto', '["/catalog/parcheggio-minion-aprking/general/1.jpeg", "/catalog/parcheggio-minion-aprking/general/2.jpeg"]'::JSONB, true),
('autobus', 'parcheggio', 'Autobus Turistici / Pullman', '🚌', 'Vastissima area di sosta scoperta progettata per autobus e pullman di grandi dimensioni. Accesso facilitato.', '30€', 'al giorno', '["/catalog/parcheggio-minion-aprking/general/1.jpeg", "/catalog/parcheggio-minion-aprking/general/2.jpeg"]'::JSONB, true),

-- Transfer
('limousine', 'transfer', 'Transfer Limousine VIP', '🚘', 'Viaggio in limousine extralusso con 9 posti, autista professionista e benzina inclusi. Ideale per aeroporto di Catania o eventi esclusivi.', 'Da 600€', 'a tratta · 9 posti · conducente incl.', '["/catalog/transfer-e-ncc/limousine-ncc/1.jpeg", "/catalog/transfer-e-ncc/limousine-ncc/2.jpeg", "/catalog/transfer-e-ncc/limousine-ncc/3.jpeg"]'::JSONB, true),
('ncc-auto', 'transfer', 'Transfer N.C.C. Auto', '🚖', 'Noleggio con conducente professionale per trasferimenti da/per Catania, Palermo, Tindari e altre destinazioni regionali.', 'Su Preventivo', 'es. Tindari A/R ~60€', '["/catalog/transfer-e-ncc/ncc-maimone/1.jpeg", "/catalog/transfer-e-ncc/ncc-maimone/2.jpeg"]'::JSONB, true),

-- Bagagli
('deposito-singolo', 'bagagli', 'Deposito Bagagli in Sede', '🎒', 'Affida i tuoi bagagli al nostro staff in ufficio. Custodia sicura 24h a due passi dagli imbarchi per le Isole Eolie.', '4€', 'a bagaglio / giorno', '["https://i.postimg.cc/cLX7xwgf/immagine.png"]'::JSONB, true)
;
