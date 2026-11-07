import type { LiveQuestion } from './types';

/**
 * Baralhos do projeto Passaporte (conteúdo de aula).
 *
 * São carregados pelo `/host` via `?deck=<id>` e substituem o baralho padrão
 * do modo clássico/Halloween naquela sala. As perguntas ficam na ordem autoral
 * da aula; `prepareQuestion` continua embaralhando as opções em runtime.
 */
export type PassaporteDeck = {
  id: string;
  title: string;
  questions: LiveQuestion[];
};

export const PASSAPORTE_DECKS: Record<string, PassaporteDeck> = {
  'm5c2-p5-a2': {
    id: 'm5c2-p5-a2',
    title: 'Do Lixo ao Luxo — Aula 2: Raízes do Desperdício',
    questions: [
      {
        id: 'p5a2-01',
        tier: 1,
        text: 'O que é desperdício?',
        options: [
          'Comprar coisas novas',
          'Jogar fora o que ainda serve',
          'Economizar água',
          'Reciclar papel',
        ],
        correctIndex: 1,
        explanation: 'Desperdício é jogar fora algo que ainda poderia ser usado.',
      },
      {
        id: 'p5a2-02',
        tier: 1,
        text: 'Em média, quantos kg de lixo uma pessoa produz por dia?',
        options: ['5 kg', '100 g', 'Pouco mais de 1 kg', '50 kg'],
        correctIndex: 2,
        explanation: 'No Brasil, cerca de 1,3 kg por pessoa por dia.',
      },
      {
        id: 'p5a2-03',
        tier: 2,
        text: 'O que é a causa raiz de um problema?',
        options: [
          'A consequência',
          'A causa mais profunda',
          'O sintoma visível',
          'Quem aparenta culpa',
        ],
        correctIndex: 1,
        explanation: 'É a origem do problema: atacando a raiz, a solução dura.',
      },
      {
        id: 'p5a2-04',
        tier: 2,
        text: 'Qual pergunta ajuda a encontrar a causa raiz?',
        options: [
          'Quem é o culpado?',
          'Por que isso acontece?',
          'Quando começou?',
          'O que os outros acham?',
        ],
        correctIndex: 1,
        explanation: "Perguntar 'por quê?' várias vezes revela as camadas do problema.",
      },
      {
        id: 'p5a2-05',
        tier: 1,
        text: 'O script de hoje faz o quê ao tocar o objeto?',
        options: ['Muda a cor', 'Destrói o objeto', 'Fecha o jogo', 'Ganha pontos'],
        correctIndex: 1,
        explanation: 'part:Destroy() remove o objeto do jogo.',
      },
      {
        id: 'p5a2-06',
        tier: 2,
        text: 'Onde o Script precisa estar para script.Parent funcionar?',
        options: [
          'No Workspace direto',
          'Dentro da Parte',
          'No StarterGui',
          'No Lighting',
        ],
        correctIndex: 1,
        explanation: 'script.Parent é o objeto que contém o script.',
      },
      {
        id: 'p5a2-07',
        tier: 3,
        text: 'Qual linha conecta a função ao toque?',
        options: [
          'part.Touch = onTouch',
          'Connect(part.Touched)',
          'part.Touched:Connect(onTouch)',
          'part.onTouch:Connect()',
        ],
        correctIndex: 2,
        explanation: 'Touched é o evento; Connect liga ele à função.',
      },
      {
        id: 'p5a2-08',
        tier: 2,
        text: "Por que checamos FindFirstChild('Humanoid')?",
        options: [
          'Para dar pontos',
          'Para saber que quem tocou é um personagem',
          'Para mudar a cor',
          'Para reiniciar',
        ],
        correctIndex: 1,
        explanation:
          'O Humanoid existe só em personagens — evita erro quando outra peça toca.',
      },
      {
        id: 'p5a2-09',
        tier: 1,
        text: 'Exemplo de desperdício de alimentos:',
        options: [
          'Congelar comida',
          'Doar frutas maduras',
          'Comprar demais e deixar estragar',
          'Usar sobras',
        ],
        correctIndex: 2,
        explanation: 'Comprar além do consumo é a causa mais comum em casa.',
      },
      {
        id: 'p5a2-10',
        tier: 2,
        text: 'ODS 12 é sobre...',
        options: [
          'Vida na Água',
          'Consumo e Produção Responsáveis',
          'Energia Limpa',
          'Educação de Qualidade',
        ],
        correctIndex: 1,
        explanation: 'ODS 12: produzir e consumir de forma sustentável.',
      },
      {
        id: 'p5a2-11',
        tier: 1,
        text: 'Para enviar o jogo ao professor:',
        options: [
          'Tirar print',
          'Salvar, tornar público e copiar o link',
          'Fechar o Studio',
          'Apagar o projeto',
        ],
        correctIndex: 1,
        explanation: 'Tornar público gera o link que o professor acessa.',
      },
      {
        id: 'p5a2-12',
        tier: 3,
        text: 'Script não funciona — 1º passo?',
        options: [
          'Começar outro jogo',
          'Mudar a cor da parte',
          'Pedir pro colega fazer',
          'Conferir se o Script está na Parte e ler o Output',
        ],
        correctIndex: 3,
        explanation:
          '90% dos erros são script no lugar errado ou erro de digitação — o Output mostra.',
      },
    ],
  },
};
