# Piano: Sistema di Locandine Dinamiche per i Partner

Questo piano descrive come implementare un sistema automatizzato in cui una locandina "template" caricata dall'admin viene personalizzata con il QR code specifico di ogni partner.

## 1. Funzionalità Lato Admin
- **Pagina di Configurazione**: Creare un'interfaccia in `admin/poster-settings.html` (o simile).
- **Caricamento Template**: Permettere il caricamento dell'immagine base (es. `poster-template.png`).
- **Parametri QR**: Salvare in Supabase (tabella `settings`) le coordinate e la dimensione del QR code.

## 2. Funzionalità Lato Partner
- **Pagina**: `admin/partner-portal.html`.
- **Generazione Dinamica (Canvas API)**:
  - Il browser carica l'immagine template.
  - Genera il QR code del partner (referral link).
  - Utilizza la Canvas API per disegnare il QR sopra la foto nelle coordinate specificate.
  - **Coordinate Suggerite (per risoluzione 1316x764)**:
    - **X**: `483px`
    - **Y**: `207px`
    - **Dimensione**: `350px x 350px`

## 3. Risultato Finale
- Il partner ha un tasto "Scarica la tua locandina".
- Riceve un file PNG/JPG pronto per la stampa con la sua grafica e il suo QR unico.

> [!TIP]
> Questi valori di coordinate sono stimati sulla risoluzione dell'immagine fornita. Potrebbero richiedere un minimo di aggiustamento (fine-tuning) durante l'implementazione pratica.
