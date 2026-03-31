# Plan: Attivazione Prenotazione Deposito Bagagli

Attivare il form di prenotazione deposito bagagli già esistente in `tourist-services.html`, aggiungendo: policy Supabase per utenti pubblici, notifiche email (EmailJS), e collegamento al referral dei partner.

## Prerequisiti (da fare PRIMA di modificare codice)

- [ ] Creare **2 template EmailJS** nel pannello EmailJS (https://dashboard.emailjs.com):
  1. **Template "admin_luggage_notification"** — notifica a localpointmilazzo@gmail.com con variabili: `{{customer_name}}`, `{{customer_email}}`, `{{customer_phone}}`, `{{bag_count}}`, `{{checkin}}`, `{{checkout}}`, `{{total_price}}`, `{{booking_id}}`, `{{affiliate_name}}`
  2. **Template "customer_luggage_confirmation"** — conferma al cliente con le stesse variabili
- [ ] Annotare i tuoi ID EmailJS: **Service ID** e i due **Template ID**

## Modifiche al Database (Supabase)

### Esegui questo SQL nel Supabase SQL Editor:

```sql
-- Aggiunge colonne mancanti alla tabella luggage_tickets
alter table luggage_tickets 
  add column if not exists notes text,
  add column if not exists expected_end timestamp with time zone,
  add column if not exists affiliate_id uuid references affiliates(id);

-- Permette agli utenti NON autenticati di fare INSERT (solo insert, non lettura)
create policy "Public can book luggage" on luggage_tickets
  for insert with check (true);
```

## Modifiche al Codice

### [MODIFY] tourist-services.html

File: `C:\Users\projo\.gemini\antigravity\scratch\localpoint\tourist-services.html`

**1. Aggiungere import EmailJS** in `<head>` (dopo gli altri script):
```html
<script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"></script>
```

**2. Aggiungere costanti EmailJS** all'inizio del blocco `<script>` principale:
```js
const EMAILJS_PUBLIC_KEY  = 'TUO_PUBLIC_KEY';
const EMAILJS_SERVICE_ID  = 'TUO_SERVICE_ID';
const EMAILJS_ADMIN_TPL   = 'admin_luggage_notification';
const EMAILJS_CLIENT_TPL  = 'customer_luggage_confirmation';
emailjs.init(EMAILJS_PUBLIC_KEY);
```

**3. Modificare il submit handler del form luggage** (dopo `const { data, error } = await supabase...`):

- Aggiungere `affiliate_id: affData?.id || null` al payload (già definita `affData` a riga 856).
- Dopo inserimento riuscito, inviare le due email con EmailJS:

```js
// Email al admin
await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_ADMIN_TPL, {
  customer_name:  payload.customer_name,
  customer_email: payload.customer_email,
  customer_phone: payload.customer_phone,
  bag_count:      payload.bag_count,
  checkin:        document.getElementById('lug-checkin').value,
  checkout:       document.getElementById('lug-checkout').value,
  total_price:    `€ ${total.toFixed(2)}`,
  booking_id:     `#${shortId}`,
  affiliate_name: affData?.name || 'Prenotazione diretta'
});

// Email di conferma al cliente (solo se ha fornito email)
if (payload.customer_email) {
  await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_CLIENT_TPL, {
    customer_name:  payload.customer_name,
    bag_count:      payload.bag_count,
    checkin:        document.getElementById('lug-checkin').value,
    checkout:       document.getElementById('lug-checkout').value,
    total_price:    `€ ${total.toFixed(2)}`,
    booking_id:     `#${shortId}`
  });
}
```

## Comportamento Finale

- Cliente apre la pagina Servizi Turistici → categoria "Deposito Bagagli" → "Prenota Ora"
- Compila il form (nome, email, telefono, date, n° bagagli)
- Al submit: record inserito in `luggage_tickets` con `status: 'pending'` e `affiliate_id` del partner se presente
- **Tu ricevi email** con tutti i dettagli della prenotazione
- **Il cliente riceve email** di conferma con il codice prenotazione
- Nel **admin dashboard** la prenotazione appare nella sezione Deposito Bagagli con stato "In attesa"

## Verifica

1. Aprire `http://localhost:3000/tourist-services.html?ref=CODICE_PARTNER`
2. Aprire categoria Deposito Bagagli → Prenota Ora
3. Verificare che il referral banner sia visibile
4. Completare prenotazione e verificare ricezione 2 email
5. Verificare record in Supabase con `affiliate_id` valorizzato
