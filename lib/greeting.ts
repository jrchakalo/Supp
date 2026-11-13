export type GreetingPeriod = 'madrugada' | 'manha' | 'tarde' | 'noite' | 'aula';

/**
 * Greetings are intentionally conversational: the cockpit is opened many times
 * a day, and a fixed "Bom dia" gets old fast. Each period has a pool of
 * variations; the component picks one and keeps it until the period changes.
 */
export const GREETINGS: Record<GreetingPeriod, string[]> = {
  madrugada: [
    'Ainda acordado, Júnior? Vai dormir que amanhã tem aula.',
    'Planejando a aula de amanhã? Capricha, mas depois descansa.',
    'A essa hora, até o telão já foi dormir.',
    'Madrugada produtiva ou só insônia? Cuidado com o café.',
    'O sol ainda nem pensou em nascer. Bora dormir?',
    'Se isso é amor à educação, tá explicado.',
    'Última revisada no slide? Então fecha o notebook.',
    'A criatividade de madrugada é ótima; o cansaço de manhã, nem tanto.',
    'Tá tudo pronto? Então descansa, Júnior.',
    'Nem o Scratch está online a essa hora.',
    'Madrugada silenciosa, ideias barulhentas.',
    'Se for para criar, cria. Se for para dormir, vai.',
    'Bora encerrar o dia (que já virou outro dia).',
    'O café de amanhã te agradece se você dormir agora.',
    'Júnior, a aula de amanhã também precisa de um professor descansado.',
    'A noite já foi longe. Deixa o resto para depois.',
  ],
  manha: [
    'Bom dia, Júnior! Café na mão e aula na cabeça.',
    'Bom dia! Hoje tem cara de aula boa.',
    'Acordou antes do telão. Bom sinal.',
    'Bom dia! Vamos fazer a turma acordar também.',
    'Café, plano de aula e boa energia.',
    'Bom dia! O dia começa melhor com tudo pronto.',
    'Manhã de segunda? Respira e vai.',
    'Bom dia! Que hoje renda.',
    'A turma chega daqui a pouco. Bora?',
    'Bom dia! Slide no ponto, café do lado.',
    'Começando o dia com o pé direito.',
    'Bom dia! Se a aula é hoje, o café é obrigatório.',
    'Manhã tranquila é manhã planejada.',
    'Bom dia! Hoje é dia de fazer acontecer.',
    'Acordou, Júnior? Então já ganhou.',
    'Bom dia! A melhor aula é a que começa no horário.',
  ],
  tarde: [
    'Boa tarde! Metade do dia, energia renovada.',
    'Boa tarde! Ainda dá tempo de fazer uma aula épica.',
    'Boa tarde! Café de depois do almoço é lei.',
    'Tarde de aula? Bora que o telão tá esperando.',
    'Boa tarde! Respira, organiza e arrasa.',
    'Boa tarde! A turma merece.',
    'Boa tarde! O dia ainda tem muita página.',
    'Boa tarde! Se a energia cair, o plano B é café.',
    'Boa tarde! Hora de deixar a aula redonda.',
    'Boa tarde! Menos improviso, mais ideia boa.',
    'Boa tarde! O que faltou de manhã, a tarde resolve.',
    'Boa tarde! Bora revisar aquele slide?',
    'Tarde produtiva começa com um bom café.',
    'Boa tarde! Que a aula flua.',
    'Boa tarde! O telão já está no clima.',
    'Boa tarde, Júnior! A próxima turma não espera.',
  ],
  noite: [
    'Boa noite! Aula dada, consciência tranquila.',
    'Boa noite! Hora de desligar o professor e ligar o descanso.',
    'Boa noite! Se a aula foi boa, o mérito é seu.',
    'Boa noite! Amanhã tem mais.',
    'Boa noite! Fecha o notebook, Júnior.',
    'Boa noite! O telão já foi dormir.',
    'Boa noite! Planejar a próxima pode esperar até amanhã.',
    'Boa noite! Que o café de amanhã seja forte.',
    'Boa noite! Aula revisada é aula dormida em paz.',
    'Boa noite! Descansa que a turma cobra energia.',
    'Boa noite! O dia foi longo, mas valeu.',
    'Boa noite! Última olhada no plano e pronto.',
    'Boa noite! Deixa o resto para amanhã.',
    'Boa noite! Se ainda tem slide aberto, fecha.',
    'Boa noite! A criatividade agradece o descanso.',
    'Boa noite, Júnior! Amanhã o Supp te espera.',
  ],
  aula: [
    'Boa aula, Júnior! A turma é sua.',
    'Boa aula! O telão já está conectado.',
    'Boa aula! Respira e começa.',
    'Boa aula! Que a turma embarque.',
    'Boa aula! Você preparou, agora é só conduzir.',
    'Boa aula! O café pode esperar.',
    'Boa aula! Bora fazer valer.',
    'Boa aula! O plano está pronto; confia.',
  ],
};

export function greetingPeriod(date: Date, classNow: boolean): GreetingPeriod {
  if (classNow) return 'aula';
  const hour = date.getHours();
  if (hour < 5) return 'madrugada';
  if (hour < 12) return 'manha';
  if (hour < 18) return 'tarde';
  return 'noite';
}

/** Uniformly picks one greeting; injectable random for tests. */
export function pickGreeting(period: GreetingPeriod, random = Math.random): string {
  const pool = GREETINGS[period];
  const index = Math.floor(random() * pool.length) % pool.length;
  return pool[index];
}
