# Globale Kommentare mit Supabase

## 1) Projekt anlegen
- Erstelle ein neues Supabase-Projekt.
- Notiere dir `Project URL` und den `anon public key`.

## 2) Tabelle erstellen
Fuehre in Supabase SQL Editor aus:
- Wichtig: Im SQL-Editor **nur SQL einfuegen**, also **ohne** die Markdown-Markierungen ```` ```sql ```` und ```` ``` ````.

```sql
create table if not exists public.comments (
  id bigint generated always as identity primary key,
  article_id text not null,
  author_name text not null,
  text text not null,
  created_at timestamptz not null default now()
);

alter table public.comments enable row level security;

create policy "public can read comments"
on public.comments
for select
to anon
using (true);

create policy "public can insert comments"
on public.comments
for insert
to anon
with check (char_length(text) > 0 and char_length(author_name) > 0);
```

## 2b) Realtime aktivieren
- In Supabase: `Database` -> `Replication`
- Tabelle `public.comments` fuer Realtime aktivieren
- Danach werden neue Kommentare live per Realtime Channel aktualisiert.

## 3) Frontend-Konfiguration
In `assets/js/config/backend.js` eintragen:
- `supabaseUrl`
- `supabaseAnonKey`

Danach ist die globale Kommentar-Synchronisierung aktiv.

## 4) Verhalten
- Ohne Konfiguration: lokale/public JSON-Fallback-Kommentare.
- Mit Supabase: Kommentare werden global gespeichert und auf der Kommentarseite automatisch alle 5 Sekunden aktualisiert.

## Workflow-Rollen (neu)
- Neuer Login fuer Designer:
  - E-Mail: `designer@schule.example`
  - Passwort: `designer123`
- Ablauf:
  1. Leser sendet Anzeige/Beitrag im Mitmach-Menue.
  2. Admin uebernimmt Einsendung in den Workflow und weist Redaktion zu.
  3. Redaktion gestaltet im `workflow-editor.html` und sendet an Designer.
  4. Designer importiert per Klick als neuen Artikel-Entwurf.
