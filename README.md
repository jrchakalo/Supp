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

**Supp** é uma aplicação interativa de perguntas e respostas para dinâmicas de sala de aula. A turma rola um dado de 20 lados (D20) na vida real e o professor toca no número sorteado para revelar uma pergunta. O projeto também tem competição knockout, sala multiplayer ao vivo com QR code e baralhos temáticos de eventos especiais.

O **modo clássico** é o padrão. Os eventos sazonais ficam em uma área separada, acessada pelo botão **Special events** no menu.

## Modos e eventos

### Clássico (padrão)

- **87 perguntas de verdadeiro ou falso** divididas em cinco temas:
  - **Games** — Minecraft, Roblox, Brawl Stars, Valorant, Free Fire, League of Legends.
  - **Anime** — Dragon Ball, Naruto, One Piece, My Hero Academia, Demon Slayer e outros.
  - **Pop culture** — filmes, séries, super-heróis e cultura pop.
  - **Endangered animals** — animais ameaçados, habitats e conservação.
  - **Technology** — hardware, internet, Word, PowerPoint, Excel e curiosidades.
- **Seleção de temas:** o professor pode marcar um ou vários temas antes da rodada.
- **Três dificuldades:** Easy, Medium e Hard, com perguntas e tiers próprios para a competição.
- **Quatro formas de jogar:** D20 Roll, Competition, Live e Join.
- **Baralho Live clássico:** 60 perguntas de múltipla escolha (20 por dificuldade, 4 por tema) para a sala multiplayer.

### Eventos especiais

- **Halloween (disponível):** 180 perguntas de verdadeiro ou falso (60 por dificuldade, 20 por tier) e 180 perguntas de múltipla escolha para o Live, com temas de filmes, jogos, cultura pop e folclore brasileiro.
- **Christmas (em breve)** e **Easter (em breve):** cartões reservados na área de eventos para as próximas temporadas.

## Idiomas

Todas as perguntas, alternativas, explicações e mensagens de jogo podem ser exibidas em **português** ou **inglês**:

- O seletor **PT / EN** aparece no menu, na tela de jogo, na configuração da competição e no host do Live.
- A escolha fica salva no navegador.
- O modo clássico foi escrito originalmente em português e tem tradução para inglês; o Halloween foi escrito em inglês e tem tradução para português.
- Os textos de interface (menus, botões administrativos) permanecem em inglês; o seletor controla o conteúdo das perguntas e as mensagens do jogo.

## Competição

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

## Live (sala multiplayer)

O botão **Live** abre uma sala ao vivo (estilo quiz show) para o modo clássico ou para o Halloween:

- **/host** (tela do professor): escolhe o modo, o baralho, os temas do clássico, o idioma, o número de perguntas e o tempo por pergunta. Cria uma sala com código de 5 caracteres, mostra um **QR code** para os alunos, projeta a pergunta em tela cheia com timer e revela as respostas com barra por cor e placar ao vivo.
- **/join** (tela do aluno): entrada com código ou QR; responde com 4 botões grandes coloridos (▲ vermelho, ◆ azul, ● amarelo, ■ verde) e vê o feedback em cada revelação.
- **Pontuação por velocidade:** acerto vale de 100 até 1.000 pontos conforme a velocidade da resposta.
- **Realtime:** os eventos trafegam por canais broadcast (sem database). O host é a autoridade: escolhe as perguntas, calcula a pontuação e emite cada evento de jogo.
- Fase `lobby → question → reveal → leaderboard → gameover`, com rejeição automática de respostas repetidas ou fora de fase.
- O baralho clássico usa 60 perguntas de múltipla escolha; o Halloween usa 180.

**Requer configuração:** o modo Live é o único que usa variáveis de ambiente — veja a seção abaixo. Fora de sala de aula com wi-fi compartilhado, o QR code funciona facilmente se os alunos abrirem a URL via rede local na mesma sub-rede do computador-host ou em uma URL pública hospedada.

**Configuração do Live:**
1. Crie um projeto gratuito em <https://supabase.com>.
2. Copie a **Project URL** e a **anon public key** (Project Settings → API).
3. Preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` em `.env.local` (copie de `.env.example`).
4. Reinicie o servidor (`npm run dev`) e abra o Live. Nenhuma tabela ou migration é necessária — só o Realtime precisa estar habilitado (padrão).

## Funcionalidades

- **Dashboard interativo:** grid lúdico e responsivo numerado de 1 a 20. Os números podem se repetir, como em uma rolagem real de D20.
- **Dificuldades:** baralhos Easy, Medium e Hard com perguntas e tiers próprios.
- **Temas:** multi-seleção de assuntos no modo clássico, aplicada também à competição e ao Live.
- **Competição:** modo knockout para a sala, com cadastro de alunos, escadas de dificuldade, ordem sequencial ou aleatória e tela de campeão.
- **Bilíngue:** seletor PT/EN em todos os modos, incluindo Halloween e Live.
- **Curiosidades:** perguntas com explicação curta depois da resposta quando o baralho oferece o campo `explanation`.
- **Sistema de aleatoriedade:** perguntas sorteadas sem repetição até o baralho acabar.
- **Feedback audiovisual:** efeitos sonoros e visuais distintos para respostas corretas e incorretas.
- **Tema de Halloween:** fundo animado com lua, morcegos, estrelas, neblina e abóbora, usado apenas na área de eventos.
- **Atalhos de teclado:** `T`/`F` (ou `V`/`F` em português) para responder, `Enter` para continuar e `Esc` para fechar.
- **Acessibilidade:** foco visível, suporte a `prefers-reduced-motion` e navegação por teclado.
- **Gerenciamento de áudio:** música tema, efeitos sonoros e controle de volume com mute/unmute. O volume escolhido fica salvo no navegador.
- **Persistência local:** volume, idioma, configurações de competição e sessão do host usam `localStorage` com migração automática das chaves antigas.

## Stack

- Next.js 15 (App Router)
- React 19 + TypeScript
- Supabase Realtime (canais broadcast, modo Live)
- Tailwind CSS 4
- Motion + canvas-confetti

## Requisitos

- Node.js 18+

## Variáveis de ambiente

- **Jogo local (D20 / Competition):** nenhuma variável é necessária — os baralhos ficam em `lib/`.
- **Live (sala multiplayer):** `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` (copie de `.env.example`); instruções completas acima.

## Como rodar localmente

1. Instale as dependências: `npm install`
2. Execute o servidor de desenvolvimento: `npm run dev`
3. Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## Scripts

- `npm run dev` — inicia o servidor de desenvolvimento.
- `npm run build` — cria a versão de produção.
- `npm run start` — inicia o servidor de produção.
- `npm run lint` — roda o ESLint.

## Estrutura do projeto

```
app/
  page.tsx                 Menu clássico, área de eventos, D20 e competição
  host/page.tsx            Sala Live — tela do professor
  join/page.tsx            Sala Live — tela do aluno
components/
  CompetitionSetup.tsx     Cadastro de alunos, temas e escada
  CompetitionGame.tsx      Partida knockout
  QuestionModal.tsx        Pergunta, resposta e feedback bilíngue
  LanguageToggle.tsx       Seletor PT/EN
  HalloweenBackdrop.tsx    Cenário animado do evento
  VolumeControl.tsx        Controle de áudio
lib/
  classic-questions.ts     Baralho clássico T/F, temas, dificuldades e tiers
  classic-live-questions.ts Baralho clássico de múltipla escolha (Live)
  halloween-questions.ts   Baralho Halloween T/F
  live-questions.ts        Baralho Halloween de múltipla escolha (Live)
  i18n/                    Traduções PT/EN e helpers de localização
  competition.ts           Fases, sorteio e regras da competição
  live/                    Protocolo, sala e helpers do Supabase Realtime
  storage.ts               localStorage com migração das chaves antigas
  game.ts                  Baralhos, dificuldades e utilitários
```

## Créditos

- Música do modo Halloween: ["Danse Macabre - Busy Strings"](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100556), de Kevin MacLeod (incompetech.com), licenciada sob [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).

## Licença

Este projeto está sob a licença MIT. Veja a [LICENSE](LICENSE).

## Autor

[<img src="https://avatars.githubusercontent.com/jrchakalo?v=4" width=115><br><sub>Júnior Silva</sub>](https://github.com/jrchakalo)
