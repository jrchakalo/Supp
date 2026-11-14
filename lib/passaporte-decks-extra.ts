import type { PassaporteDeck } from './passaporte-decks';

/** F9 decks for the next lesson of each class. */
export const EXTRA_DECKS: Record<string, PassaporteDeck> = {
  'm1c1-p1-a6': {
    id: 'm1c1-p1-a6',
    title: "P1 · Aula 6 — Investigar: compartilhar descobertas (Scratch)",
    questions: [
      { id: 'p1a6-01', tier: 1, text: "Qual é a melhor ordem de uma apresentação?", options: ["Conclusão → evidência → ideia","Ideia → evidência → conclusão","Evidência → ideia → conclusão","Só conclusão"], correctIndex: 1, explanation: "Comece pela ideia, mostre a evidência e feche com a conclusão." },
      { id: 'p1a6-02', tier: 1, text: "O que é uma evidência?", options: ["Uma opinião sem fonte","Um dado, fala ou observação da pesquisa","O título do projeto","Uma lista de desejos"], correctIndex: 1, explanation: "Evidência é o que sustenta a ideia." },
      { id: 'p1a6-03', tier: 2, text: "Quantas informações principais cabem em uma apresentação curta?", options: ["Todas","Umas 3","Nenhuma","50"], correctIndex: 1, explanation: "Três informações bem escolhidas são melhores que muitas soltas." },
      { id: 'p1a6-04', tier: 2, text: "No Scratch, qual bloco mostra uma fala?", options: ["mover 10 passos","diga ... por 3 segundos","tocar som","girar 15 graus"], correctIndex: 1, explanation: "O bloco “diga” exibe a fala no balão." },
      { id: 'p1a6-05', tier: 3, text: "Por que testar a apresentação com um colega?", options: ["Para gastar tempo","Para ver se a mensagem é clara","Para copiar a fala","Para mudar o tema"], correctIndex: 1, explanation: "O teste mostra o que precisa ficar mais claro." },
      { id: 'p1a6-06', tier: 3, text: "O que a conclusão deve responder?", options: ["Qual é o preço","Por que isso importa para o projeto","Quem é o culpado","Qual é o próximo jogo"], correctIndex: 1, explanation: "A conclusão conecta a descoberta ao projeto." },
    ],
  },
  'm2c1-p2-a5': {
    id: 'm2c1-p2-a5',
    title: "P2 · Aula 5 — Idealizar: escolher e refinar a ideia (Scratch)",
    questions: [
      { id: 'p2a5-01', tier: 1, text: "Qual critério pergunta “dá para fazer no tempo?”", options: ["Utilidade","Viabilidade","Originalidade","Preço"], correctIndex: 1, explanation: "Viabilidade inclui ferramenta e prazo." },
      { id: 'p2a5-02', tier: 1, text: "Refinar uma ideia é…", options: ["Aumentar tudo","Cortar o excesso mantendo o propósito","Copiar a ideia do colega","Trocar de tema"], correctIndex: 1, explanation: "Refinar é focar no essencial." },
      { id: 'p2a5-03', tier: 2, text: "O que uma boa escolha precisa ter?", options: ["Sorte","Justificativa","Segredo","Dinheiro"], correctIndex: 1, explanation: "A escolha precisa ser explicável para a turma." },
      { id: 'p2a5-04', tier: 2, text: "No roteiro de 3 cenas, a última cena serve para…", options: ["Repetir a primeira","Convidar o jogador a agir","Mostrar os créditos","Esconder o problema"], correctIndex: 1, explanation: "O final conecta a solução a uma ação." },
      { id: 'p2a5-05', tier: 3, text: "Se a ideia não cabe no prazo, o melhor é…", options: ["Desistir","Reduzir o escopo","Fazer tudo correndo","Mudar de turma"], correctIndex: 1, explanation: "Reduzir o escopo mantém a ideia viva." },
      { id: 'p2a5-06', tier: 3, text: "Uma ideia original é aquela que…", options: ["Nunca existiu","Tem o jeito da nossa turma","É a mais cara","Copia um jogo famoso"], correctIndex: 1, explanation: "Originalidade é o toque próprio." },
    ],
  },
  'm5c1-p5-a3': {
    id: 'm5c1-p5-a3',
    title: "P5 · Aula 3 — Investigar: Círculo Dourado e pesquisa (Scratch)",
    questions: [
      { id: 'p5c1a3-01', tier: 1, text: "O Círculo Dourado começa pelo…", options: ["Produto","Propósito","Preço","Nome"], correctIndex: 1, explanation: "O centro é o porquê." },
      { id: 'p5c1a3-02', tier: 1, text: "O “como” representa…", options: ["O processo","O lucro","O produto","A equipe"], correctIndex: 0, explanation: "Como é o jeito de fazer." },
      { id: 'p5c1a3-03', tier: 2, text: "Uma frase de propósito não deve citar…", options: ["A crença","A ferramenta","A comunidade","O problema"], correctIndex: 1, explanation: "A ferramenta é o “o quê”, não o porquê." },
      { id: 'p5c1a3-04', tier: 2, text: "Uma evidência serve para…", options: ["Enfeitar","Sustentar a ideia","Aumentar o texto","Esconder o problema"], correctIndex: 1, explanation: "Evidência dá força ao propósito." },
      { id: 'p5c1a3-05', tier: 3, text: "No Scratch, a fala aparece com o bloco…", options: ["mover","diga","girar","tocar"], correctIndex: 1, explanation: "O bloco “diga” abre o balão." },
      { id: 'p5c1a3-06', tier: 3, text: "Por que começar pelo porquê?", options: ["Para falar mais","Para conectar as pessoas ao projeto","Para copiar um modelo","Para evitar a prática"], correctIndex: 1, explanation: "Propósito conecta e convence." },
    ],
  },
  'm3c2-p3-a1': {
    id: 'm3c2-p3-a1',
    title: "P3 · Aula 1 — Prototipar: o primeiro protótipo (App Inventor)",
    questions: [
      { id: 'p3a1-01', tier: 1, text: "Protótipo é…", options: ["A versão final","A menor coisa que já funciona","Um desenho sem função","Um bug"], correctIndex: 1, explanation: "Protótipo prova a ideia com o mínimo." },
      { id: 'p3a1-02', tier: 1, text: "No App Inventor, a tela é montada no…", options: ["Blocks","Designer","Companion","Play Store"], correctIndex: 1, explanation: "O Designer monta a interface." },
      { id: 'p3a1-03', tier: 2, text: "A primeira ação de um botão aparece em…", options: ["Designer","Blocks","Media","Settings"], correctIndex: 1, explanation: "Blocks liga eventos a ações." },
      { id: 'p3a1-04', tier: 2, text: "O que não é essencial para o primeiro protótipo?", options: ["Título","Uma ação","Muitas animações","Um componente"], correctIndex: 2, explanation: "Animação fica para depois." },
      { id: 'p3a1-05', tier: 3, text: "Testar o protótipo serve para…", options: ["Gastar tempo","Descobrir o que falha","Nota","Enfeitar"], correctIndex: 1, explanation: "Teste revela o próximo passo." },
      { id: 'p3a1-06', tier: 3, text: "Um bom protótipo responde a qual pergunta?", options: ["A ideia funciona?","O app é bonito?","Tem muitas telas?","Ganha dinheiro?"], correctIndex: 0, explanation: "O protótipo valida a ideia." },
    ],
  },
  'm5c2-p5-a1': {
    id: 'm5c2-p5-a1',
    title: "P5 · Aula 1 — O Desafio Começa! (Energia + Roblox)",
    questions: [
      { id: 'p5a1-01', tier: 1, text: "Qual fonte é renovável?", options: ["Petróleo","Carvão","Sol","Gás"], correctIndex: 2, explanation: "O sol se renova continuamente." },
      { id: 'p5a1-02', tier: 1, text: "Energia não renovável…", options: ["Nunca acaba","Pode acabar e polui","É sempre limpa","Vem do vento"], correctIndex: 1, explanation: "Reservas finitas e impacto ambiental." },
      { id: 'p5a1-03', tier: 2, text: "Empatia é…", options: ["Ignorar o outro","Entender o outro para agir melhor","Ganhar o jogo","Copiar"], correctIndex: 1, explanation: "Empatia orienta a solução." },
      { id: 'p5a1-04', tier: 2, text: "No Roblox Studio, onde mudamos a cor de um objeto?", options: ["Toolbox","Properties","Play","Chat"], correctIndex: 1, explanation: "Properties concentra as características." },
      { id: 'p5a1-05', tier: 3, text: "O objetivo do jogo do P5 é…", options: ["Só ganhar pontos","Conscientizar sobre energia","Vender energia","Assustar"], correctIndex: 1, explanation: "O jogo comunica uma causa." },
      { id: 'p5a1-06', tier: 3, text: "Antes de construir, o mais importante é…", options: ["Escolher a cor","Entender o problema","Baixar modelos","Mudar o nome"], correctIndex: 1, explanation: "Sem problema claro, o jogo não comunica." },
    ],
  },
  'm5c2-p5-a6': {
    id: 'm5c2-p5-a6',
    title: "P5 · Aula 6 — Testar e Avaliar: playtest e apresentação (Roblox)",
    questions: [
      { id: 'p5a6-01', tier: 1, text: "No playtest, o observador deve…", options: ["Jogar junto","Explicar tudo","Anotar sem interferir","Corrigir o jogo"], correctIndex: 2, explanation: "O observador coleta evidências." },
      { id: 'p5a6-02', tier: 1, text: "Um feedback útil descreve…", options: ["A pessoa","O que aconteceu","O nota","O preço"], correctIndex: 1, explanation: "Fatos ajudam mais que julgamentos." },
      { id: 'p5a6-03', tier: 2, text: "Bug é…", options: ["Uma sugestão","Um comportamento errado","Uma ideia nova","Um elogio"], correctIndex: 1, explanation: "Bug quebra o esperado." },
      { id: 'p5a6-04', tier: 2, text: "Por que priorizar só 3 ajustes?", options: ["Para não terminar","Para focar no que mais importa","Para ignorar o feedback","Para ganhar tempo"], correctIndex: 1, explanation: "Foco melhora a experiência." },
      { id: 'p5a6-05', tier: 3, text: "Testar de novo depois de corrigir serve para…", options: ["Confirmar a correção","Enfeitar","Copiar","Aumentar o texto"], correctIndex: 0, explanation: "O segundo teste valida o ajuste." },
      { id: 'p5a6-06', tier: 3, text: "O playtest ajuda a descobrir…", options: ["O que o jogador entende e sente","O preço do jogo","O nome da turma","A nota do professor"], correctIndex: 0, explanation: "O jogador revela a experiência real." },
    ],
  },
  'm6c2-p6-a3': {
    id: 'm6c2-p6-a3',
    title: "P6 · Aula 3 — Prototipar: mecânicas avançadas (Roblox)",
    questions: [
      { id: 'p6a3-01', tier: 1, text: "Checkpoint serve para…", options: ["Aumentar o lag","Salvar progresso","Trocar o cenário","Ganhar dinheiro"], correctIndex: 1, explanation: "Ele reduz a frustração." },
      { id: 'p6a3-02', tier: 1, text: "Um obstáculo justo é…", options: ["Impossível","Difícil, mas possível","Invisível","Sem feedback"], correctIndex: 1, explanation: "Desafio justo tem pistas e margem." },
      { id: 'p6a3-03', tier: 2, text: "Respawn devolve o jogador ao…", options: ["Início do jogo","Último checkpoint","Menu","Loja"], correctIndex: 1, explanation: "O checkpoint define o retorno." },
      { id: 'p6a3-04', tier: 2, text: "Ritmo do nível alterna…", options: ["Tudo difícil","Desafio e respiro","Nada e nada","Só cutscenes"], correctIndex: 1, explanation: "Respiro mantém a motivação." },
      { id: 'p6a3-05', tier: 3, text: "Por que testar com outra dupla?", options: ["Para copiar","Para ver onde travam","Para perder tempo","Para mudar a nota"], correctIndex: 1, explanation: "O outro revela o que o autor não vê." },
      { id: 'p6a3-06', tier: 3, text: "Sem meta, o obstáculo vira…", options: ["Diversão","Castigo","Prêmio","História"], correctIndex: 1, explanation: "A meta dá sentido ao desafio." },
    ],
  },
  'pse-a3': {
    id: 'pse-a3',
    title: "PSE Coding · Aula 3 — Pulo, gravidade e plataformas (Scratch)",
    questions: [
      { id: 'psea3-01', tier: 1, text: "Gravidade faz o sprite…", options: ["Subir","Cair","Sumir","Girar"], correctIndex: 1, explanation: "A gravidade puxa para baixo." },
      { id: 'psea3-02', tier: 1, text: "O pulo acontece quando…", options: ["A gravidade aumenta","O impulso vence a gravidade","O sprite para","O cenário muda"], correctIndex: 1, explanation: "O impulso dá velocidade para cima." },
      { id: 'psea3-03', tier: 2, text: "A colisão serve para…", options: ["Atravessar o chão","Parar no chão","Aumentar o lag","Mudar a cor"], correctIndex: 1, explanation: "A colisão impede a queda infinita." },
      { id: 'psea3-04', tier: 2, text: "Pular só no chão evita…", options: ["Pulo duplo infinito","Gravidade","Colisão","Cenário"], correctIndex: 0, explanation: "Sem a checagem, o jogador sobe para sempre." },
      { id: 'psea3-05', tier: 3, text: "Ajustar a gravidade muda…", options: ["A cor","A sensação do pulo","O nome","O som"], correctIndex: 1, explanation: "Gravidade e impulso definem o toque." },
      { id: 'psea3-06', tier: 3, text: "Um bom jogo de plataforma precisa de…", options: ["Só cenário","Chão, pulo e obstáculos justos","Muitos textos","Nenhum teste"], correctIndex: 1, explanation: "A base é a física previsível." },
    ],
  },
  'ib-word-2': {
    id: 'ib-word-2',
    title: "Word II — Formatação, tabelas e imagens",
    questions: [
      { id: 'word2-01', tier: 1, text: "Which tool creates consistent headings?", options: ["Styles","Paint","Clipboard","Zoom"], correctIndex: 0, explanation: "Styles apply heading levels consistently.", textPt: "Qual ferramenta cria títulos consistentes?", optionsPt: ["Estilos (Styles)","Pincel","Área de transferência","Zoom"] },
      { id: 'word2-02', tier: 1, text: "A table is best for…", options: ["Comparing information","Adding sound","Changing the font","Printing"], correctIndex: 0, explanation: "Tables organize comparisons.", textPt: "Uma tabela é melhor para…", optionsPt: ["Comparar informações","Adicionar som","Mudar a fonte","Imprimir"] },
      { id: 'word2-03', tier: 2, text: "“In line with text” controls…", options: ["The image position","The font color","The page size","The spell check"], correctIndex: 0, explanation: "It keeps the image in the text flow.", textPt: "“In line with text” controla…", optionsPt: ["A posição da imagem","A cor da fonte","O tamanho da página","A correção ortográfica"] },
      { id: 'word2-04', tier: 2, text: "Why export to PDF?", options: ["To edit more","To keep the layout","To add macros","To change the font"], correctIndex: 1, explanation: "PDF preserves the layout.", textPt: "Por que exportar para PDF?", optionsPt: ["Para editar mais","Para manter o layout","Para adicionar macros","Para mudar a fonte"] },
      { id: 'word2-05', tier: 3, text: "Good formatting is…", options: ["Random","Consistent","Invisible","Always bold"], correctIndex: 1, explanation: "Consistency helps the reader.", textPt: "Uma boa formatação é…", optionsPt: ["Aleatória","Consistente","Invisível","Sempre negrito"] },
      { id: 'word2-06', tier: 3, text: "An image should…", options: ["Decorate only","Support the message","Replace the text","Be huge"], correctIndex: 1, explanation: "Images support understanding.", textPt: "Uma imagem deve…", optionsPt: ["Só decorar","Apoiar a mensagem","Substituir o texto","Ser enorme"] },
    ],
  },
  'ib-m1-a2': {
    id: 'ib-m1-a2',
    title: "Info Bilíngue I — Lesson 2: Files, folders and the desktop",
    questions: [
      { id: 'ibm1a2-01', tier: 1, text: "A folder is…", options: ["A document","A group of files","A screen","A shortcut"], correctIndex: 1, explanation: "Folders organize files." },
      { id: 'ibm1a2-02', tier: 1, text: "The desktop is…", options: ["The first screen","A file","A printer","A folder"], correctIndex: 0, explanation: "It is the main workspace." },
      { id: 'ibm1a2-03', tier: 2, text: "Ctrl + S does…", options: ["Save","Print","Copy","Close"], correctIndex: 0, explanation: "It saves the current file." },
      { id: 'ibm1a2-04', tier: 2, text: "Save As creates…", options: ["A new copy","A folder","A shortcut","A printer"], correctIndex: 0, explanation: "It asks for a new name/location." },
      { id: 'ibm1a2-05', tier: 3, text: "A shortcut…", options: ["Moves the program","Opens a program quickly","Deletes files","Changes the language"], correctIndex: 1, explanation: "It links to the original." },
      { id: 'ibm1a2-06', tier: 3, text: "A good digital space is…", options: ["Messy","Organized","Empty","Hidden"], correctIndex: 1, explanation: "Organization saves time." },
    ],
  },
};
