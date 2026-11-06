<div align="center">
   <h1>🎲 Supp</h1>
   <p>
      <img src="https://img.shields.io/badge/Next.js-15-black" alt="Next.js" />
      <img src="https://img.shields.io/badge/React-19-61dafb" alt="React" />
      <img src="https://img.shields.io/badge/TypeScript-5-3178c6" alt="TypeScript" />
      <img src="https://img.shields.io/badge/TailwindCSS-4-38bdf8" alt="TailwindCSS" />
   </p>
</div>

## Sobre
Uma aplicação interativa de "Verdadeiro ou Falso" desenvolvida para servir como dinâmica de quebra-gelo em aulas de programação para crianças (7 a 14 anos). A aplicação é integrada com o mundo físico: os alunos rolam um dado de 20 lados (D20) na vida real, e o professor seleciona o número correspondente na tela para revelar uma curiosidade aleatória.

## Modos de jogo
- **Halloween Mode:** perguntas em inglês sobre Halloween, com filmes, cultura pop, jogos e folclore brasileiro. O baralho é dividido em **Easy**, **Medium** e **Hard**, com 60 perguntas por dificuldade, 20 em cada um dos três níveis internos (*Starter*, *Core* e *Challenge*), sempre balanceado em 30 verdadeiras e 30 falsas.
- **Classroom Classic:** o baralho original de temas variados (jogos, tecnologia, anime e curiosidades), em português.

### Competição de Halloween
No modo Halloween, o professor pode escolher entre o **D20 Roll** e a **Competition**:

- Cadastre os alunos pelo nome (é possível colar a lista inteira separada por vírgulas ou quebras de linha).
- Escolha a ordem dos alunos: **em ordem** ou **aleatória** a cada fase.
- Cada fase faz **uma pergunta por aluno**. Quem acerta avança; quem erra é eliminado.
- A competição termina quando resta um campeão. Se 2 ou mais alunos chegarem ao fim das fases, rodadas de **morte súbita** continuam até restar apenas um.
- As configurações ficam salvas no navegador, mas a lista de alunos começa vazia em cada nova sessão.

**Escadas de dificuldade (6 fases cada):**
- **Easy:** Easy Starter → Easy Core → Easy Challenge → Medium Starter → Medium Core → Medium Challenge.
- **Medium:** Medium Starter → Medium Core → Medium Challenge → Hard Starter → Hard Core → Hard Challenge.
- **Hard:** Hard Starter → Hard Core → Hard Challenge → Hard Expert → Hard Final → Hard Championship.
- **Progressive:** 2 ou 3 rodadas em cada dificuldade, começando no Easy e terminando no Hard. Continua com 6 ou 9 fases.

### Halloween Live (sala multiplayer)
No modo Halloween, além de D20 e Competition, o botão **Halloween Live** abre uma sala multiplayer ao vivo (estilo quiz show):

- **/host** (tela do professor): cria uma sala com código de 5 caracteres, mostra um **QR code** para os alunos, projeta a pergunta em tela cheia com timer e revela as respostas com barra por cor e placar ao vivo.
- **/join** (tela do aluno): entrada com código ou QR; responde com 4 botões grandes coloridos (▲ vermelho, ◆ azul, ● amarelo, ■ verde) e vê o feedback em cada revelação.
- **Gama de perguntas novo:** 180 múltipla escolha (60 por dificuldade, 20 por tier), mesmo estilo do baralho Halloween; um único deck por rodada.
- **Pontuação por velocidade:** acerto vale de 100 até 1.000 pontos conforme a velocidade da resposta.
- **Enviro de Realtime:** os eventos trafegam por canais broadcast (sem database). O host é a autoridade: escolhe as perguntas, calcula a pontuação e emite cada evento de jogo.
- Fase `lobby → question → reveal → leaderboard→/gameover`, com rejeição automática de respostas repetidas ou fora de fase.

**Requer configuração:** o modo Live é o único que usa variáveis de ambiente — veja a seção abaixo. Fora de sala de aula com wi-fi compartilhado, o QR code funciona facilmente se os alunos abrirem a URL via rede local na mesma sub-rede do computador-host ou em uma URL pública hospedada.

**Configuração do Halloween Live:**
1. Crie um projeto gratuito em <https://supabase.com>.
2. Copie a **Project URL** e a **anon public key** (Project Settings → API).
3. Preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` em `.env.local` (copy from `.env.example`).
4. Reinicie o servidor (`npm run dev`) e entre no modo Live. Nenhuma tabela ou migration é necessária — só o Realtime precisa estar habilitado (padrão).

O baralho de Halloween foi revisado para crianças e pré-adolescentes brasileiros: as perguntas de ano de lançamento de filmes/livros foram removidas, o contexto foi ajustado e foram incluídas referências ao folclore e à cultura do Brasil, como Saci, Curupira, Iara, Boitatá, Cuca, mula-sem-cabeça, boto e Dia do Saci.

## Funcionalidades
- **Dashboard Interativo:** grid lúdico e responsivo numerado de 1 a 20. Os números podem se repetir, como em uma rolagem real de D20.
- **Dificuldades:** baralhos Easy, Medium e Hard com 60 perguntas cada, balanceados em 30 verdadeiras e 30 falsas, com três níveis internos por baralho.
- **Competição:** modo knockout para a sala, com cadastro de alunos, escadas de dificuldade, ordem sequencial ou aleatória e tela de campeão.
- **Curiosidades:** toda pergunta do modo Halloween mostra uma explicação curta ("Did you know?") depois da resposta.
- **Sistema de Aleatoriedade:** perguntas sorteadas sem repetição até o baralho acabar.
- **Feedback Audiovisual:** efeitos sonoros e visuais (cores e animações) distintos para respostas corretas e incorretas.
- **Tema de Halloween:** fundo animado com lua, morcegos com asas batendo, estrelas, neblina e abóbora.
- **Atalhos de teclado:** `T`/`F` para responder, `Enter` para continuar e `Esc` para fechar.
- **Acessibilidade:** foco visível, suporte a `prefers-reduced-motion` e navegação por teclado.
- **Gerenciamento de Áudio:** música tema de Halloween, efeitos sonoros e controle de volume com mute/unmute. O volume escolhido fica salvo no navegador.
- **UI/UX Infantil:** interface colorida, amigável e com elementos de gamificação.

## Stack
- Next.js 15 (App Router)
- React 19 + TypeScript
- Supabase Realtime (canais broadcast, modo Halloween Live)
- Tailwind CSS 4
- Motion + canvas-confetti

## Requisitos
- Node.js 18+

## Variáveis de ambiente
- **Jogo local (D20 / Competition):** nenhuma variável é necessária — os baralhos ficam em `lib/classic-questions.ts` e `lib/halloween-questions.ts`.
- **Halloween Live (sala multiplayer):** `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` (copie de `.env.example`); instruções completas acima.

## Como rodar localmente
1. Instale as dependências: `npm install` ou `yarn install`
2. Execute o servidor de desenvolvimento: `npm run dev`
3. Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## Scripts
- `npm run dev` - Inicia o servidor de desenvolvimento.
- `npm run build` - Cria a versão de produção.
- `npm run start` - Inicia o servidor de produção.

## Créditos
- Música do modo Halloween: ["Danse Macabre - Busy Strings"](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100556), de Kevin MacLeod (incompetech.com), licenciada sob [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).

## Licença
Este projeto está sob a licença MIT. Veja a [LICENSE](LICENSE).

## Autor
[<img src="https://avatars.githubusercontent.com/jrchakalo?v=4" width=115><br><sub>Júnior Silva</sub>](https://github.com/jrchakalo)
