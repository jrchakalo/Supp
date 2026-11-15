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
    title: "P5 · Aula 3 — O porquê do jogo e a primeira cena (Scratch)",
    questions: [
      { id: 'p5c1a3-01', tier: 1, text: "O nosso jogo é sobre…", options: ["Água","Futebol","Foguete","Dinheiro"], correctIndex: 0, explanation: "O projeto do P5 fala da água." },
      { id: 'p5c1a3-02', tier: 1, text: "Qual destes é desperdício de água?", options: ["Torneira aberta à toa","Beber água","Lavar a mão","Regar a planta"], correctIndex: 0, explanation: "Água que escorre sem uso é desperdício." },
      { id: 'p5c1a3-03', tier: 2, text: "No Scratch, o bloco que faz o personagem falar é…", options: ["diga","mover","girar","tocar som"], correctIndex: 0, explanation: "O bloco diga abre o balão de fala." },
      { id: 'p5c1a3-04', tier: 2, text: "O que a nossa cena precisa ter?", options: ["Cenário, personagem e fala","Só o cenário","Só a fala","Nada"], correctIndex: 0, explanation: "Sem os três a cena não acontece." },
      { id: 'p5c1a3-05', tier: 3, text: "Qual destes é um fato sobre a água?", options: ["Uma torneira pingando perde água o dia inteiro","A água do mar serve para beber","Só existe água doce no planeta","Água suja não faz mal"], correctIndex: 0, explanation: "Uma torneira pingando desperdiça litros por dia." },
      { id: 'p5c1a3-06', tier: 3, text: "Por que o nosso jogo existe?", options: ["Para mostrar que a água é importante","Para ganhar dinheiro","Para assustar as pessoas","Para nada"], correctIndex: 0, explanation: "O porquê do jogo é a causa da água." },
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
    title: "P5 · Aula 1 — O Desafio Começa! (Desperdício + Roblox)",
    questions: [
      { id: 'p5a1-01', tier: 1, text: "Desperdício é…", options: ["Jogar fora o que ainda servia","Guardar o que sobra","Comprar pouco","Reaproveitar"], correctIndex: 0, explanation: "Desperdiçar é descartar algo útil." },
      { id: 'p5a1-02', tier: 1, text: "Qual destes é desperdício de água?", options: ["Torneira aberta sem ninguém usando","Lavar a louça","Beber água","Tomar banho"], correctIndex: 0, explanation: "Água que escorre sem uso vai embora." },
      { id: 'p5a1-03', tier: 2, text: "Lixo jogado na rua pode causar…", options: ["Bueiro entupido e enchente","Mais árvores","Ar limpo","Menos chuva"], correctIndex: 0, explanation: "O lixo entope o bueiro e a água não escoa." },
      { id: 'p5a1-04', tier: 2, text: "O Script que move a Part fica…", options: ["Dentro da Part","No Workspace","Na Toolbox","No Chat"], correctIndex: 0, explanation: "O Script usa script.Parent, então mora dentro da peça." },
      { id: 'p5a1-05', tier: 3, text: "O que o while true do faz?", options: ["Repete para sempre","Para o jogo","Apaga a peça","Muda a cor"], correctIndex: 0, explanation: "O laço infinito repete até o jogo parar." },
      { id: 'p5a1-06', tier: 3, text: "O que o task.wait(0.5) faz?", options: ["Espera meio segundo","Sobe a peça","Salva o projeto","Cria uma pasta"], correctIndex: 0, explanation: "O wait define o ritmo entre os passos." },
    ],
  },
  'm5c2-p5-a6': {
    id: 'm5c2-p5-a6',
    title: "P5 · Aula 6 — Testar: pontos, teste e playtest (Roblox)",
    questions: [
      { id: 'p5a6-01', tier: 1, text: "O placar do jogador só aparece se a pasta se chamar…", options: ["leaderstats","points","score","stats"], correctIndex: 0, explanation: "O Roblox lê exatamente leaderstats." },
      { id: 'p5a6-02', tier: 1, text: "O evento Touched roda quando…", options: ["Um objeto encosta no item","O jogador clica","O jogo começa","O item desaparece"], correctIndex: 0, explanation: "Touched dispara no contato." },
      { id: 'p5a6-03', tier: 2, text: "O IntValue serve para…", options: ["Guardar o número de pontos","Guardar o cenário","Criar um jogador","Mudar a cor"], correctIndex: 0, explanation: "IntValue guarda um número inteiro." },
      { id: 'p5a6-04', tier: 2, text: "O debounce serve para…", options: ["Impedir que o mesmo toque conte várias vezes","Deixar o jogo mais lento","Aumentar o mapa","Trocar a iluminação"], correctIndex: 0, explanation: "A trava garante 1 ponto por coleta." },
      { id: 'p5a6-05', tier: 3, text: "Ao testar, quem observa deve…", options: ["Anotar sem interferir","Jogar junto","Corrigir no meio","Explicar tudo"], correctIndex: 0, explanation: "O observador coleta evidências." },
      { id: 'p5a6-06', tier: 3, text: "Bug é…", options: ["Um comportamento errado do jogo","Uma ideia nova","Um elogio","Um preço"], correctIndex: 0, explanation: "Bug quebra o que era esperado." },
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
    title: "Info I — Operating Systems 2",
    questions: [
      { id: 'ibm1a2-01', tier: 1, text: "The Operating System is…", options: ["The software that controls the machine","A piece of hardware","A folder","A printer"], correctIndex: 0, explanation: "The OS controls hardware and software.", textPt: "O sistema operacional é…", optionsPt: ["O software que controla a máquina","Uma peça de hardware","Uma pasta","Uma impressora"] },
      { id: 'ibm1a2-02', tier: 1, text: "Which one is hardware?", options: ["The mouse","Windows","Notepad","A folder"], correctIndex: 0, explanation: "Hardware is what you can touch.", textPt: "Qual destes é hardware?", optionsPt: ["O mouse","O Windows","O Bloco de Notas","Uma pasta"] },
      { id: 'ibm1a2-03', tier: 2, text: "Boot means…", options: ["Starting the computer","Turning off the screen","Saving a file","Opening the browser"], correctIndex: 0, explanation: "Boot is the startup process.", textPt: "Boot significa…", optionsPt: ["Ligar o computador","Desligar a tela","Salvar um arquivo","Abrir o navegador"] },
      { id: 'ibm1a2-04', tier: 2, text: "Ctrl + Shift + Esc opens…", options: ["The Task Manager","Word","The browser","The desktop"], correctIndex: 0, explanation: "It opens the Task Manager directly.", textPt: "Ctrl + Shift + Esc abre…", optionsPt: ["O Gerenciador de Tarefas","O Word","O navegador","A área de trabalho"] },
      { id: 'ibm1a2-05', tier: 3, text: "A program is frozen. The best first step is…", options: ["Open the Task Manager and End Task","Turn off the computer","Wait one hour","Delete the file"], correctIndex: 0, explanation: "End Task closes only the frozen program.", textPt: "Um programa travou. O melhor primeiro passo é…", optionsPt: ["Abrir o Gerenciador de Tarefas e Finalizar Tarefa","Desligar o computador","Esperar uma hora","Apagar o arquivo"] },
      { id: 'ibm1a2-06', tier: 3, text: "Where do you see which program uses the most memory?", options: ["In the Task Manager, Memory column","In Notepad","In the browser","In the Start Menu"], correctIndex: 0, explanation: "The Memory column ranks the programs.", textPt: "Onde você vê qual programa usa mais memória?", optionsPt: ["No Gerenciador de Tarefas, coluna Memória","No Bloco de Notas","No navegador","No Menu Iniciar"] },
    ],
  },
  'ib-m1-a3': {
    id: 'ib-m1-a3',
    title: "Info I — Operating Systems 3",
    questions: [
      { id: 'ibm1a3-01', tier: 1, text: "A folder is…", options: ["A place that keeps files","A document","A screen","A printer"], correctIndex: 0, explanation: "Folders keep files and other folders.", textPt: "Uma pasta é…", optionsPt: ["Um lugar que guarda arquivos","Um documento","Uma tela","Uma impressora"] },
      { id: 'ibm1a3-02', tier: 1, text: "Ctrl + X does…", options: ["Cuts the file","Copies the file","Prints the file","Deletes forever"], correctIndex: 0, explanation: "Cut removes the original so you can paste it elsewhere.", textPt: "Ctrl + X faz…", optionsPt: ["Recorta o arquivo","Copia o arquivo","Imprime o arquivo","Apaga para sempre"] },
      { id: 'ibm1a3-03', tier: 2, text: "F2 is used to…", options: ["Rename","Delete","Copy","Print"], correctIndex: 0, explanation: "F2 renames the selected file.", textPt: "F2 serve para…", optionsPt: ["Renomear","Apagar","Copiar","Imprimir"] },
      { id: 'ibm1a3-04', tier: 2, text: "A deleted file goes to…", options: ["The Recycle Bin","The Desktop","The browser","The cloud"], correctIndex: 0, explanation: "Delete sends the file to the Recycle Bin.", textPt: "Um arquivo apagado vai para…", optionsPt: ["A Lixeira","A área de trabalho","O navegador","A nuvem"] },
      { id: 'ibm1a3-05', tier: 3, text: "Shift + Delete does…", options: ["Deletes forever","Copies the file","Restores the file","Moves to the Desktop"], correctIndex: 0, explanation: "There is no Recycle Bin in this case.", textPt: "Shift + Delete faz…", optionsPt: ["Apaga para sempre","Copia o arquivo","Restaura o arquivo","Move para a área de trabalho"] },
      { id: 'ibm1a3-06', tier: 3, text: "The extension .docx tells you it is…", options: ["A Word document","An image","A song","A folder"], correctIndex: 0, explanation: "The extension names the file type.", textPt: "A extensão .docx diz que é…", optionsPt: ["Um documento do Word","Uma imagem","Uma música","Uma pasta"] },
    ],
  },
};
