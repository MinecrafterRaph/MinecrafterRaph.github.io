export interface QuickReply {
  shortcut: string;
  title: string;
  text: string;
}

export const QUICK_REPLIES: QuickReply[] = [
  {
    shortcut: '/danke',
    title: 'Dankeschön',
    text: 'Vielen Dank für deine Nachricht!',
  },
  {
    shortcut: '/spaeter',
    title: 'Später antworten',
    text: 'Ich bin gerade beschäftigt und melde mich später bei dir.',
  },
  {
    shortcut: '/ok',
    title: 'Alles klar',
    text: 'Alles klar, machen wir so!',
  },
  {
    shortcut: '/hallo',
    title: 'Freundliche Begrüßung',
    text: 'Hallo! Schön von dir zu hören. Wie kann ich dir weiterhelfen?',
  },
  {
    shortcut: '/adresse',
    title: 'Standortadresse',
    text: 'Unsere Adresse lautet: Musterstraße 12, 10115 Berlin.',
  },
  {
    shortcut: '/anruf',
    title: 'Rückruf-Anfrage',
    text: 'Hast du kurz Zeit für ein schnelles Telefonat?',
  },
  {
    shortcut: '/zeit',
    title: 'Terminvorschlag',
    text: 'Wie sieht es bei dir zeitlich morgen Nachmittag aus?',
  },
  {
    shortcut: '/erledigt',
    title: 'Erledigt',
    text: 'Das habe ich soeben wunschgemäß erledigt.',
  },
];
