export type HolidayScope = 'national' | 'state' | 'municipal' | 'optional';

export type Holiday = {
  /** ISO local date, `YYYY-MM-DD`. */
  date: string;
  name: string;
  scope: HolidayScope;
  /** Official act that confirms the date. */
  source: string;
  /** Ponto facultativo: the school may close, but it is not a legal holiday. */
  optional?: boolean;
};

/**
 * Feriados de 2026 confirmados em fontes oficiais.
 *
 * Nacionais: Portaria MGI nº 11.460/2025 (gov.br/gestao).
 * Pernambuco: Lei Estadual nº 16.241/2017, art. 49 (Data Magna, 06/03) e
 * Calendário Oficial do Estado/TJPE (São João, 24/06).
 * Caruaru: Lei Municipal nº 2.959/1985 (18/05 e 15/09), Lei Municipal nº
 * 7.334/2024 (Corpus Christi, que substituiu São Pedro) e TJPE — Comarca de
 * Caruaru. São Pedro (29/06) deixou de ser feriado municipal em 2024.
 *
 * Carnaval, Cinzas e Corpus Christi são pontos facultativos federais; Corpus
 * Christi é feriado municipal em Caruaru. A agenda trata os facultativos como
 * dias sem aula, com o rótulo correto.
 */
export const HOLIDAYS_2026: Holiday[] = [
  {
    date: '2026-01-01',
    name: 'Confraternização Universal',
    scope: 'national',
    source: 'Portaria MGI nº 11.460/2025',
  },
  {
    date: '2026-02-16',
    name: 'Carnaval (ponto facultativo)',
    scope: 'optional',
    source: 'Portaria MGI nº 11.460/2025',
    optional: true,
  },
  {
    date: '2026-02-17',
    name: 'Carnaval (ponto facultativo)',
    scope: 'optional',
    source: 'Portaria MGI nº 11.460/2025',
    optional: true,
  },
  {
    date: '2026-02-18',
    name: 'Quarta-feira de Cinzas (até 14h)',
    scope: 'optional',
    source: 'Portaria MGI nº 11.460/2025',
    optional: true,
  },
  {
    date: '2026-03-06',
    name: 'Data Magna de Pernambuco',
    scope: 'state',
    source: 'Lei Estadual PE nº 16.241/2017, art. 49',
  },
  {
    date: '2026-04-03',
    name: 'Paixão de Cristo',
    scope: 'national',
    source: 'Portaria MGI nº 11.460/2025',
  },
  {
    date: '2026-04-21',
    name: 'Tiradentes',
    scope: 'national',
    source: 'Portaria MGI nº 11.460/2025',
  },
  {
    date: '2026-05-01',
    name: 'Dia do Trabalhador',
    scope: 'national',
    source: 'Portaria MGI nº 11.460/2025',
  },
  {
    date: '2026-05-18',
    name: 'Aniversário de Caruaru',
    scope: 'municipal',
    source: 'Lei Municipal de Caruaru nº 2.959/1985; TJPE — Comarca de Caruaru',
  },
  {
    date: '2026-06-04',
    name: 'Corpus Christi',
    scope: 'municipal',
    source: 'Lei Municipal de Caruaru nº 7.334/2024; Portaria MGI nº 11.460/2025',
  },
  {
    date: '2026-06-24',
    name: 'São João (PE e Caruaru)',
    scope: 'state',
    source: 'Calendário Oficial de PE/TJPE; Lei Municipal de Caruaru nº 2.959/1985',
  },
  {
    date: '2026-09-07',
    name: 'Independência do Brasil',
    scope: 'national',
    source: 'Portaria MGI nº 11.460/2025',
  },
  {
    date: '2026-09-15',
    name: 'Nossa Senhora das Dores',
    scope: 'municipal',
    source: 'Lei Municipal de Caruaru nº 2.959/1985; TJPE — Comarca de Caruaru',
  },
  {
    date: '2026-10-12',
    name: 'Nossa Senhora Aparecida',
    scope: 'national',
    source: 'Portaria MGI nº 11.460/2025',
  },
  {
    date: '2026-11-02',
    name: 'Finados',
    scope: 'national',
    source: 'Portaria MGI nº 11.460/2025',
  },
  {
    date: '2026-11-15',
    name: 'Proclamação da República',
    scope: 'national',
    source: 'Portaria MGI nº 11.460/2025',
  },
  {
    date: '2026-11-20',
    name: 'Dia Nacional de Zumbi e da Consciência Negra',
    scope: 'national',
    source: 'Lei Federal nº 14.759/2023; Portaria MGI nº 11.460/2025',
  },
  {
    date: '2026-12-25',
    name: 'Natal',
    scope: 'national',
    source: 'Portaria MGI nº 11.460/2025',
  },
];

const BY_DATE = new Map(HOLIDAYS_2026.map((holiday) => [holiday.date, holiday]));

export function holidayFor(iso: string): Holiday | undefined {
  return BY_DATE.get(iso);
}

export function isHoliday(iso: string): boolean {
  return BY_DATE.has(iso);
}

export const HOLIDAY_SOURCES = [
  {
    label: 'Feriados nacionais e pontos facultativos 2026',
    url: 'https://www.gov.br/gestao/pt-br/assuntos/noticias/2025/dezembro/confira-o-calendario-oficial-de-feriados-nacionais-e-pontos-facultativos-em-2026',
  },
  {
    label: 'Lei Estadual PE nº 16.241/2017 (Data Magna)',
    url: 'https://legis.alepe.pe.gov.br/',
  },
  {
    label: 'TJPE — feriados oficiais nas comarcas de Pernambuco',
    url: 'https://portal.tjpe.jus.br/servicos/consulta/feriados/feriados-oficiais-nas-comarca-de-pernambuco',
  },
  {
    label: 'Lei Municipal de Caruaru nº 7.334/2024 (Corpus Christi)',
    url: 'https://caruaru.pe.gov.br/',
  },
];
