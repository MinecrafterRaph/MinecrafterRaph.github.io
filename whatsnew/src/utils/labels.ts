export interface ChatLabelDef {
  id: 'wichtig' | 'arbeit' | 'familie' | 'freunde' | 'projekt';
  name: string;
  badgeClass: string;
  dotClass: string;
  filterClass: string;
}

export const CHAT_LABELS: Record<string, ChatLabelDef> = {
  wichtig: {
    id: 'wichtig',
    name: 'Wichtig',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
    dotClass: 'bg-rose-500',
    filterClass: 'text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100',
  },
  arbeit: {
    id: 'arbeit',
    name: 'Arbeit',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    dotClass: 'bg-blue-500',
    filterClass: 'text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100',
  },
  familie: {
    id: 'familie',
    name: 'Familie',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    dotClass: 'bg-emerald-500',
    filterClass: 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
  },
  freunde: {
    id: 'freunde',
    name: 'Freunde',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
    dotClass: 'bg-purple-500',
    filterClass: 'text-purple-700 bg-purple-50 border-purple-200 hover:bg-purple-100',
  },
  projekt: {
    id: 'projekt',
    name: 'Projekt',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    dotClass: 'bg-amber-500',
    filterClass: 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100',
  },
};
