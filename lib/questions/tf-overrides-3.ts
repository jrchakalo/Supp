import type { TfOverride } from './tf-overrides-1';

/** True/false rebalancing — part 3: Brazil, sports and logic. */
export const OVERRIDES_3: Record<string, TfOverride> = {
  // ---------- Brazil ----------
  'classic-brazil-easy-01': {
    pt: 'A capital do Brasil é São Paulo.',
    en: 'The capital of Brazil is São Paulo.',
    explanationPt: 'A capital é Brasília, no Planalto Central.',
    explanationEn: 'The capital is Brasília, on the Central Plateau.',
  },
  'classic-brazil-easy-02': {
    pt: 'O idioma oficial do Brasil é o espanhol.',
    en: 'The official language of Brazil is Spanish.',
    explanationPt: 'O idioma oficial é o português.',
    explanationEn: 'The official language is Portuguese.',
  },
  'classic-brazil-easy-03': {
    pt: 'A maior parte da floresta amazônica está na Argentina.',
    en: 'Most of the Amazon rainforest is in Argentina.',
    explanationPt: 'A maior parte está no Brasil.',
    explanationEn: 'Most of it is in Brazil.',
  },
  'classic-brazil-medium-01': {
    pt: 'O Curupira tem os pés virados para a frente, como uma pessoa comum.',
    en: 'The Curupira has forward-facing feet, like a regular person.',
    explanationPt: 'Os pés do Curupira são virados para trás.',
    explanationEn: 'The Curupira\'s feet face backward.',
  },
  'classic-brazil-medium-02': {
    pt: 'A Iara é um pássaro de fogo do folclore brasileiro.',
    en: 'Iara is a fire bird from Brazilian folklore.',
    explanationPt: 'A Iara é uma sereia que vive nas águas.',
    explanationEn: 'Iara is a mermaid who lives in the waters.',
  },
  'classic-brazil-medium-03': {
    pt: 'A capivara é o menor roedor do mundo.',
    en: 'The capybara is the smallest rodent in the world.',
    explanationPt: 'A capivara é o maior roedor do mundo.',
    explanationEn: 'The capybara is the largest rodent in the world.',
  },
  'classic-brazil-medium-04': {
    pt: 'O Brasil tem 20 estados e o Distrito Federal.',
    en: 'Brazil has 20 states and the Federal District.',
    explanationPt: 'São 26 estados e o Distrito Federal.',
    explanationEn: 'There are 26 states and the Federal District.',
  },
  'classic-brazil-hard-01': {
    pt: 'O Boitatá é um peixe gigante do folclore brasileiro.',
    en: 'Boitatá is a giant fish from Brazilian folklore.',
    explanationPt: 'O Boitatá é uma serpente de fogo.',
    explanationEn: 'Boitatá is a fire serpent.',
  },
  'classic-brazil-hard-02': {
    pt: 'O Bumba-meu-boi é uma tradição típica do Rio Grande do Sul.',
    en: 'Bumba-meu-boi is a tradition typical of Rio Grande do Sul.',
    explanationPt: 'É uma tradição forte no Maranhão.',
    explanationEn: 'It is a strong tradition in Maranhão.',
  },
  'classic-brazil-hard-03': {
    pt: 'O frevo é um ritmo tradicional da Bahia.',
    en: 'Frevo is a traditional rhythm from Bahia.',
    explanationPt: 'O frevo é de Pernambuco.',
    explanationEn: 'Frevo is from Pernambuco.',
  },
  'classic-brazil-hard-04': {
    pt: 'O Pantanal é um deserto seco.',
    en: 'The Pantanal is a dry desert.',
    explanationPt: 'O Pantanal é uma das maiores áreas úmidas do mundo.',
    explanationEn: 'The Pantanal is one of the largest wetlands in the world.',
  },

  // ---------- Sports ----------
  'classic-sports-easy-01': {
    pt: 'No futebol, cada equipe tem 9 jogadores em campo.',
    en: 'In football, each team has 9 players on the field.',
    explanationPt: 'Cada equipe tem 11 jogadores.',
    explanationEn: 'Each team has 11 players.',
  },
  'classic-sports-easy-02': {
    pt: 'No basquete, os jogadores usam os pés para quicar a bola.',
    en: 'In basketball, players use their feet to dribble the ball.',
    explanationPt: 'Eles usam as mãos; chutar é falta.',
    explanationEn: 'They use their hands; kicking is a foul.',
  },
  'classic-sports-easy-03': {
    pt: 'No vôlei, cada equipe tem 5 jogadores em quadra.',
    en: 'In volleyball, each team has 5 players on the court.',
    explanationPt: 'Cada equipe tem 6 jogadores.',
    explanationEn: 'Each team has 6 players.',
  },
  'classic-sports-easy-04': {
    pt: 'Os Jogos Olímpicos acontecem a cada dois anos.',
    en: 'The Olympic Games happen every two years.',
    explanationPt: 'Acontecem a cada quatro anos.',
    explanationEn: 'They happen every four years.',
  },
  'classic-sports-medium-01': {
    pt: 'Pelé ganhou cinco Copas do Mundo como jogador.',
    en: 'Pelé won five World Cups as a player.',
    explanationPt: 'Ele ganhou três: 1958, 1962 e 1970.',
    explanationEn: 'He won three: 1958, 1962 and 1970.',
  },
  'classic-sports-medium-02': {
    pt: 'Michael Jordan é famoso por ser um nadador olímpico.',
    en: 'Michael Jordan is famous for being an Olympic swimmer.',
    explanationPt: 'Ele é uma lenda do basquete.',
    explanationEn: 'He is a basketball legend.',
  },
  'classic-sports-medium-03': {
    pt: 'Usain Bolt é famoso por ser um ciclista.',
    en: 'Usain Bolt is famous for being a cyclist.',
    explanationPt: 'Ele é um velocista do atletismo.',
    explanationEn: 'He is a track-and-field sprinter.',
  },
  'classic-sports-medium-04': {
    pt: 'Uma maratona tem 21 quilômetros.',
    en: 'A marathon is 21 kilometers long.',
    explanationPt: 'Uma maratona tem 42,195 quilômetros.',
    explanationEn: 'A marathon is 42.195 kilometers long.',
  },
  'classic-sports-hard-01': {
    pt: 'No futebol, um jogador nunca está impedido se estiver à frente do último defensor.',
    en: 'In football, a player is never offside when ahead of the last defender.',
    explanationPt: 'Estar à frente do último defensor no momento do passe caracteriza impedimento.',
    explanationEn: 'Being ahead of the last defender when the ball is passed is offside.',
  },
  'classic-sports-hard-02': {
    pt: 'O tênis tem apenas dois torneios de Grand Slam.',
    en: 'Tennis has only two Grand Slam tournaments.',
    explanationPt: 'São quatro: Austrália, França, Wimbledon e EUA.',
    explanationEn: 'There are four: Australia, France, Wimbledon and the USA.',
  },
  'classic-sports-hard-03': {
    pt: 'No vôlei, cada equipe pode tocar na bola no máximo cinco vezes.',
    en: 'In volleyball, each team may touch the ball at most five times.',
    explanationPt: 'O máximo é três toques.',
    explanationEn: 'The maximum is three touches.',
  },
  'classic-sports-hard-04': {
    pt: 'O Tour de France é uma corrida de Fórmula 1.',
    en: 'The Tour de France is a Formula 1 race.',
    explanationPt: 'É uma das corridas de ciclismo mais famosas do mundo.',
    explanationEn: 'It is one of the most famous cycling races in the world.',
  },

  // ---------- Logic ----------
  'classic-logic-easy-01': {
    pt: 'Dois mais dois é igual a cinco.',
    en: 'Two plus two equals five.',
    explanationPt: 'Dois mais dois é igual a quatro.',
    explanationEn: 'Two plus two equals four.',
  },
  'classic-logic-easy-02': {
    pt: 'Um triângulo tem quatro lados.',
    en: 'A triangle has four sides.',
    explanationPt: 'Um triângulo tem três lados.',
    explanationEn: 'A triangle has three sides.',
  },
  'classic-logic-medium-01': {
    pt: 'O número 9 não é um quadrado perfeito.',
    en: 'The number 9 is not a perfect square.',
    explanationPt: '9 = 3 × 3, então é um quadrado perfeito.',
    explanationEn: '9 = 3 × 3, so it is a perfect square.',
  },
  'classic-logic-medium-02': {
    pt: 'Na sequência 1, 2, 4, 8, 16, cada número é o triplo do anterior.',
    en: 'In the sequence 1, 2, 4, 8, 16, each number is triple the previous one.',
    explanationPt: 'Cada número é o dobro do anterior.',
    explanationEn: 'Each number is double the previous one.',
  },
  'classic-logic-hard-01': {
    pt: 'O número 17 não é primo.',
    en: 'The number 17 is not prime.',
    explanationPt: '17 é primo: só é divisível por 1 e por ele mesmo.',
    explanationEn: '17 is prime: it is only divisible by 1 and itself.',
  },
  'classic-logic-hard-02': {
    pt: 'Os números 2, 3, 5, 7 e 11 não são todos primos.',
    en: 'The numbers 2, 3, 5, 7 and 11 are not all prime.',
    explanationPt: 'Todos eles são primos.',
    explanationEn: 'They are all prime.',
  },
  'classic-logic-hard-03': {
    pt: 'Um número primo tem três divisores.',
    en: 'A prime number has three divisors.',
    explanationPt: 'Um número primo tem exatamente dois divisores: 1 e ele mesmo.',
    explanationEn: 'A prime number has exactly two divisors: 1 and itself.',
  },
  'classic-logic-hard-04': {
    pt: 'A fração 1/3 é igual a 0,5.',
    en: 'The fraction 1/3 equals 0.5.',
    explanationPt: '1/3 é igual a 0,333..., uma dízima periódica.',
    explanationEn: '1/3 equals 0.333..., a repeating decimal.',
  },
};
