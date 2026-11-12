'use client';

import clsx from 'clsx';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import type { CaseOption, Slide } from '@/lib/passaporte-lessons';
import { ANSWER_BUTTONS } from '@/lib/live/room';

/**
 * The slide is authored once, at a fixed 16:9 design size, and laid out with
 * container query units (`cqw`). That means the teacher preview (a 960×540
 * stage scaled with `transform`) and the TV (a fluid aspect-video stage) render
 * the exact same composition — no separate "preview" typography to drift.
 */
export const SLIDE_STAGE_WIDTH = 960;
export const SLIDE_STAGE_HEIGHT = 540;

type SlideVariant = 'tv' | 'preview';

type SlideViewProps = {
  slide: Slide;
  className?: string;
  /** Scene image (e.g. the crime scene) sent along with the slide. */
  imageUrl?: string;
  /**
   * Teacher notes belong to the Colinha, so the teacher preview hides them.
   * The TV (default) still shows the `case` note on reveal.
   */
  showNotes?: boolean;
  /**
   * Where the slide is being rendered. `flash` slides auto-hide on the TV after
   * their `seconds`, while the teacher preview keeps the image visible.
   */
  variant?: SlideVariant;
};

/** Tiny Lua tokenizer: enough color to separate keywords, strings and numbers. */
function highlightLua(code: string): ReactNode[] {
  const pattern =
    /(--[^\n]*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|\b(\d+(?:\.\d+)?)\b|\b(local|function|end|if|then|else|elseif|for|do|while|return|and|or|not|true|false|nil|break|in)\b|((?:part|script|character|otherPart|Humanoid|task|Vector3)\b)/g;

  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(code)) !== null) {
    if (match.index > lastIndex) nodes.push(code.slice(lastIndex, match.index));

    const [token, comment, text, number, keyword, builtin] = match;
    const tone = comment
      ? 'text-slate-500 italic'
      : text
        ? 'text-emerald-300'
        : number
          ? 'text-amber-300'
          : keyword
            ? 'text-sky-300'
            : builtin
              ? 'text-violet-300'
              : '';

    nodes.push(
      <span key={`token-${key}`} className={tone}>
        {token}
      </span>
    );
    key += 1;
    lastIndex = match.index + token.length;
  }

  if (lastIndex < code.length) nodes.push(code.slice(lastIndex));
  return nodes;
}

function caseOptionText(option: CaseOption): string {
  return typeof option === 'string' ? option : option.text;
}

/** Prefers `correct`, falling back to a legacy `option.correct` flag. */
function caseCorrectIndex(slide: { options: CaseOption[]; correct?: number }): number {
  if (typeof slide.correct === 'number') return slide.correct;
  return slide.options.findIndex(
    (option) => typeof option !== 'string' && option.correct === true
  );
}

/* Typography scale, all relative to the slide width. On a 1920px TV one `cqw`
   is 19.2px; on the 960px preview stage it is 9.6px before the scale factor. */
const EYEBROW_CLS =
  'text-[1.15cqw] font-black uppercase tracking-[0.3em] text-[var(--accent)]';
const TITLE_CLS =
  'text-[4.4cqw] font-black leading-[1.03] text-balance break-words text-[var(--ink)]';
const SUBTITLE_CLS = 'text-[1.75cqw] font-bold leading-snug text-[var(--muted)]';
const BODY_CLS = 'text-[2.4cqw] font-black leading-[1.18] text-[var(--ink)]';
const SMALL_CLS =
  'text-[1.4cqw] font-semibold leading-snug text-[var(--muted)]';

function SlideHeader({
  title,
  subtitle,
  eyebrow = 'Supp · Aula',
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
}) {
  return (
    <header className="flex shrink-0 flex-col gap-[0.4cqw]">
      <p className={EYEBROW_CLS}>{eyebrow}</p>
      <h2 className={TITLE_CLS}>{title}</h2>
      {subtitle ? <p className={SUBTITLE_CLS}>{subtitle}</p> : null}
    </header>
  );
}

/**
 * Scene image, rendered between the title and the bullets. A broken link shows
 * a discreet placeholder instead of a broken-image icon on the projector.
 */
function SceneImage({ src, alt = 'Imagem da cena' }: { src: string; alt?: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-[1.2cqw] border border-dashed border-[var(--line-soft)] bg-[var(--surface-2)] text-[1.35cqw] font-semibold text-[var(--muted)]">
        Imagem indisponível
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className="h-full w-full rounded-[1.2cqw] object-contain shadow-2xl"
    />
  );
}

function SceneImageFrame({ src }: { src: string }) {
  return (
    <div className="mt-[1.2cqw] flex min-h-0 flex-1 items-center justify-center overflow-hidden">
      <SceneImage key={src} src={src} />
    </div>
  );
}

/** Default time a `flash` image stays on the TV, in seconds. */
export const FLASH_DEFAULT_SECONDS = 3;

/** Clamps the authored `seconds` to a sane range (1–120), defaulting to 3. */
function flashSeconds(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return FLASH_DEFAULT_SECONDS;
  }
  return Math.min(Math.max(Math.round(value), 1), 120);
}

/**
 * `flash` slide: a link-only image that the teacher pastes on the notebook.
 *
 * On the TV the image shows for `seconds` and is then replaced by a neutral
 * "Tempo esgotado" placeholder until the teacher advances — the timer restarts
 * whenever the slide (or its link) changes and is cleared on unmount. The
 * teacher preview keeps the image visible and adds a discreet "Ns na TV"
 * caption, so the teacher always knows what the class is seeing.
 */
function FlashSlide({
  slide,
  imageUrl,
  variant,
}: {
  slide: Extract<Slide, { kind: 'flash' }>;
  imageUrl?: string;
  variant: SlideVariant;
}) {
  const seconds = flashSeconds(slide.seconds);
  const src = (imageUrl || slide.imageUrl || '').trim();
  const isTv = variant === 'tv';
  /* Stores the link whose countdown already finished; a new link is a new
     countdown automatically, with no `setState` inside the effect body. */
  const [expiredSrc, setExpiredSrc] = useState<string | null>(null);
  const expired = src !== '' && expiredSrc === src;

  useEffect(() => {
    if (!isTv || !src) return;

    const timer = window.setTimeout(() => setExpiredSrc(src), seconds * 1000);
    return () => window.clearTimeout(timer);
  }, [isTv, seconds, src]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {slide.title ? (
        <SlideHeader title={slide.title} subtitle={slide.subtitle} />
      ) : slide.subtitle ? (
        <p className={clsx('shrink-0', SUBTITLE_CLS)}>{slide.subtitle}</p>
      ) : null}

      <div className="mt-[1.2cqw] flex min-h-0 flex-1 items-center justify-center overflow-hidden">
        {!src ? (
          <div className="flex h-full w-full items-center justify-center rounded-[1.2cqw] border-2 border-dashed border-[var(--line-soft)] bg-[var(--surface-2)] px-[2cqw] text-center text-[1.5cqw] font-semibold text-[var(--muted)]">
            Cole o link da imagem no notebook
          </div>
        ) : isTv && expired ? (
          <div
            role="status"
            className="flex h-full w-full flex-col items-center justify-center gap-[0.6cqw] rounded-[1.2cqw] border-2 border-dashed border-[var(--line-soft)] bg-[var(--surface-2)] text-center"
          >
            <span aria-hidden="true" className="text-[3.4cqw] leading-none">
              ⏱
            </span>
            <p className="text-[1.8cqw] font-black uppercase tracking-[0.2em] text-[var(--muted)]">
              Tempo esgotado
            </p>
          </div>
        ) : (
          <div className="relative flex h-full w-full items-center justify-center">
            <SceneImage key={src} src={src} alt={slide.title ? `Imagem: ${slide.title}` : 'Imagem do slide'} />
            {isTv ? null : (
              <span className="absolute bottom-[0.8cqw] right-[0.8cqw] rounded-full bg-black/70 px-[1cqw] py-[0.35cqw] text-[1.05cqw] font-black uppercase tracking-[0.16em] text-white">
                {seconds}s na TV
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Font size that keeps a long bullet list inside the 16:9 stage. */
function bulletTextClass(count: number): string {
  if (count > 12) return 'text-[1.55cqw]';
  if (count > 10) return 'text-[1.75cqw]';
  if (count > 8) return 'text-[1.95cqw]';
  if (count > 6) return 'text-[2.15cqw]';
  return 'text-[2.45cqw]';
}

/** Font size that keeps a table readable but inside the stage. */
function tableTextClass(rowCount: number): string {
  if (rowCount > 12) return 'text-[1.05cqw]';
  if (rowCount > 9) return 'text-[1.2cqw]';
  if (rowCount > 6) return 'text-[1.4cqw]';
  return 'text-[1.6cqw]';
}

function SlideBody({
  slide,
  imageUrl,
  showNotes,
  variant,
}: {
  slide: Slide;
  imageUrl?: string;
  showNotes: boolean;
  variant: SlideVariant;
}) {
  switch (slide.kind) {
    case 'cover':
      return (
        <div className="flex h-full min-h-0 flex-col items-center justify-center gap-[1.4cqw] overflow-hidden text-center">
          <p className={EYEBROW_CLS}>Supp · Aula</p>
          <h1 className="text-[6.4cqw] font-black leading-[1.02] text-balance break-words text-[var(--ink)]">
            {slide.title}
          </h1>
          {slide.subtitle ? <p className={SUBTITLE_CLS}>{slide.subtitle}</p> : null}
          {slide.chips?.length ? (
            <div className="mt-[1.4cqw] flex flex-wrap justify-center gap-[0.8cqw]">
              {slide.chips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border-2 border-[var(--line)] bg-[var(--surface-2)] px-[1.5cqw] py-[0.65cqw] text-[1.4cqw] font-black text-[var(--ink)]"
                >
                  {chip}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      );

    case 'bullets': {
      const count = slide.bullets.length;
      /* More than six bullets automatically flow into two columns. */
      const twoColumns = count > 6;
      const bulletCls = bulletTextClass(count);

      return (
        <div className="flex h-full min-h-0 flex-col">
          <SlideHeader title={slide.title} subtitle={slide.subtitle} />
          {imageUrl ? <SceneImageFrame src={imageUrl} /> : null}
          <ul
            className={clsx(
              'grid min-h-0',
              twoColumns
                ? 'grid-cols-2 gap-x-[3cqw]'
                : 'grid-cols-1',
              count > 8 ? 'gap-y-[0.7cqw]' : 'gap-y-[1.1cqw]',
              imageUrl
                ? 'mt-[1.2cqw] max-h-[42%] shrink-0 overflow-hidden content-start'
                : 'mt-[1.6cqw] flex-1 content-center'
            )}
          >
            {slide.bullets.map((bullet, bulletIndex) => (
              <li
                key={`${bullet}-${bulletIndex}`}
                className="flex min-w-0 items-start gap-[1cqw]"
              >
                <span
                  aria-hidden="true"
                  className="mt-[0.42em] h-[0.55em] w-[0.55em] shrink-0 rounded-[0.12em] bg-[var(--accent)]"
                />
                <span className={clsx('min-w-0 break-words', BODY_CLS, bulletCls)}>
                  {bullet}
                </span>
              </li>
            ))}
          </ul>
        </div>
      );
    }

    case 'case': {
      const correctIndex = caseCorrectIndex(slide);
      /* The TV only reveals the answer (and the note) when requested. */
      const showAnswer = slide.revealed === true;
      const compact = slide.options.length > 4;
      const optionTextCls = compact ? 'text-[1.8cqw]' : 'text-[2.05cqw]';

      return (
        <div className="flex h-full min-h-0 flex-col">
          <SlideHeader title={slide.title} subtitle={slide.subtitle} />
          <p className="mt-[1.2cqw] shrink-0 text-[2.2cqw] font-black leading-tight text-[var(--accent)]">
            {slide.prompt}
          </p>
          <ul className="mt-[1.2cqw] flex min-h-0 flex-1 flex-col justify-center gap-[0.9cqw] overflow-hidden">
            {slide.options.map((option, index) => {
              const isCorrect = showAnswer && index === correctIndex;
              return (
                <li
                  key={`${caseOptionText(option)}-${index}`}
                  className={clsx(
                    'flex min-w-0 items-center gap-[1.2cqw] rounded-[1cqw] border-2 bg-[var(--surface-2)] px-[1.3cqw] py-[0.9cqw]',
                    isCorrect
                      ? 'border-emerald-400 ring-2 ring-emerald-400/40'
                      : 'border-[var(--line-soft)]'
                  )}
                >
                  <span className="flex h-[2.8cqw] w-[2.8cqw] shrink-0 items-center justify-center rounded-[0.7cqw] bg-[var(--surface)] text-[1.4cqw] font-black text-[var(--accent)]">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span
                    className={clsx(
                      'min-w-0 flex-1 break-words font-black leading-[1.2] text-[var(--ink)]',
                      optionTextCls
                    )}
                  >
                    {caseOptionText(option)}
                  </span>
                  {isCorrect ? (
                    <span className="shrink-0 rounded-full bg-emerald-400 px-[0.9cqw] py-[0.2cqw] text-[1.05cqw] font-black uppercase tracking-wide text-[#071018]">
                      (raiz)
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
          {showNotes && showAnswer && slide.note ? (
            <p className="mt-[1cqw] shrink-0 break-words rounded-[0.9cqw] border-l-4 border-emerald-400 bg-[var(--surface-2)] px-[1.2cqw] py-[0.75cqw] text-[1.35cqw] font-semibold leading-snug text-[var(--ink)]">
              {slide.note}
            </p>
          ) : null}
        </div>
      );
    }

    case 'code': {
      const lineCount = slide.code.split('\n').length;
      const codeCls =
        lineCount > 16 ? 'text-[1.05cqw]' : 'text-[1.5cqw]';

      return (
        <div className="flex h-full min-h-0 flex-col">
          <SlideHeader title={slide.title} subtitle={slide.subtitle} />
          <pre
            className={clsx(
              'mt-[1.2cqw] min-h-0 flex-1 overflow-auto rounded-[1.2cqw] border-2 border-[var(--line)] bg-[#080d1a] p-[1.4cqw] font-mono leading-relaxed text-[#e2e8f0]',
              codeCls
            )}
          >
            <code>{highlightLua(slide.code)}</code>
          </pre>
          {slide.rows?.length ? (
            <div className="mt-[1cqw] max-h-[34%] shrink-0 overflow-auto rounded-[1cqw] border-2 border-[var(--line-soft)] bg-[var(--surface-2)]">
              <ul>
                {slide.rows.map((row) => (
                  <li
                    key={`${row.left}-${row.right}`}
                    className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-[1cqw] border-b border-[var(--line-soft)] px-[1.1cqw] py-[0.55cqw] last:border-b-0"
                  >
                    <code className="truncate font-mono text-[1.05cqw] font-bold text-[var(--accent-2)]">
                      {row.left}
                    </code>
                    <span className="break-words text-[1.05cqw] text-[var(--muted)]">
                      {row.right}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      );
    }

    case 'table': {
      const rowCount = slide.rows.length;
      const cellCls = tableTextClass(rowCount);
      const headCls =
        rowCount > 9 ? 'text-[1.05cqw]' : rowCount > 6 ? 'text-[1.2cqw]' : 'text-[1.35cqw]';
      const columnCount = slide.head.length;
      /* The table is a CSS grid: every line is a real flex/grid child, so no
         browser can collapse or hide a row (the old <table> layout could). */
      const gridTemplateColumns =
        columnCount > 1
          ? `28% repeat(${columnCount - 1}, minmax(0, 1fr))`
          : 'minmax(0, 1fr)';

      return (
        <div className="flex h-full min-h-0 flex-col">
          <SlideHeader title={slide.title} subtitle={slide.subtitle} />
          <div className="mt-[1.4cqw] min-h-0 flex-1 overflow-auto">
            {/* The bordered box hugs the content: it ends on the last row and
                never stretches to the bottom of the slide. */}
            <div
              role="table"
              className="overflow-hidden rounded-[1.2cqw] border-2 border-[var(--line)]"
            >
              <div
                role="row"
                className="grid bg-[var(--surface-2)]"
                style={{ gridTemplateColumns }}
              >
                {slide.head.map((cell, index) => (
                  <div
                    role="columnheader"
                    key={`${cell}-${index}`}
                    className={clsx(
                      'border-b-2 border-[var(--line)] px-[1.2cqw] py-[0.8cqw] font-black uppercase tracking-wide text-[var(--accent)]',
                      headCls
                    )}
                  >
                    {cell}
                  </div>
                ))}
              </div>
              {slide.rows.map((row, rowIndex) => (
                <div
                  role="row"
                  key={`row-${rowIndex}`}
                  className={clsx(
                    'grid',
                    rowIndex > 0 && 'border-t border-[var(--line-soft)]'
                  )}
                  style={{ gridTemplateColumns }}
                >
                  {row.map((cell, cellIndex) => (
                    <div
                      role="cell"
                      key={`cell-${rowIndex}-${cellIndex}`}
                      className={clsx(
                        'flex min-h-[3.2cqw] min-w-0 items-center break-words px-[1.2cqw] py-[0.6cqw]',
                        cellIndex === 0
                          ? 'font-black text-[var(--ink)]'
                          : 'font-semibold text-[var(--muted)]',
                        cellCls
                      )}
                    >
                      {cell}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    case 'flash':
      return <FlashSlide slide={slide} imageUrl={imageUrl} variant={variant} />;

    case 'big':
      return (
        <div className="flex h-full min-h-0 flex-col items-center justify-center gap-[1.2cqw] overflow-hidden text-center">
          {slide.subtitle ? <p className={EYEBROW_CLS}>{slide.subtitle}</p> : null}
          <h1 className="text-[7.5cqw] font-black leading-none text-balance break-words text-[var(--ink)]">
            {slide.title}
          </h1>
          <ul className="mt-[1.2cqw] flex w-full flex-col items-center gap-[0.8cqw]">
            {slide.lines.map((line) => (
              <li
                key={line}
                className="max-w-full rounded-[1cqw] bg-[var(--surface-2)] px-[1.6cqw] py-[0.75cqw] text-[2.2cqw] font-black leading-tight text-[var(--ink)]"
              >
                {line}
              </li>
            ))}
          </ul>
        </div>
      );

    case 'quiz':
      return (
        <div className="flex h-full min-h-0 flex-col items-center justify-center gap-[1cqw] overflow-hidden text-center">
          <h1 className="text-[7cqw] font-black leading-none text-balance break-words text-[var(--ink)]">
            {slide.title}
          </h1>
          {slide.subtitle ? <p className={SUBTITLE_CLS}>{slide.subtitle}</p> : null}
          <ul className="mt-[1.2cqw] flex w-full flex-col items-center gap-[0.7cqw]">
            {slide.bullets.map((bullet, bulletIndex) => (
              <li
                key={`${bullet}-${bulletIndex}`}
                className="max-w-full rounded-[1cqw] border-2 border-[var(--line-soft)] bg-[var(--surface-2)] px-[1.6cqw] py-[0.7cqw] text-[2.1cqw] font-black leading-tight text-[var(--ink)]"
              >
                {bullet}
              </li>
            ))}
          </ul>
          <p className="mt-[0.8cqw] text-[1.9cqw] font-black text-[var(--accent)]">supp.lol/join</p>
        </div>
      );

    case 'question':
      return (
        <div className="flex h-full min-h-0 flex-col">
          <p className={EYEBROW_CLS}>{slide.title}</p>
          <h2 className="mt-[0.6cqw] text-[4cqw] font-black leading-tight text-balance break-words text-[var(--ink)]">
            {slide.question}
          </h2>
          {slide.subtitle ? (
            <p className={clsx('mt-[0.5cqw]', SUBTITLE_CLS)}>{slide.subtitle}</p>
          ) : null}
          <div className="mt-[1.4cqw] grid min-h-0 flex-1 grid-cols-2 content-center gap-[1.2cqw]">
            {slide.options.map((option, index) => {
              const style = ANSWER_BUTTONS[index % ANSWER_BUTTONS.length];
              return (
                <div
                  key={option}
                  className="flex min-w-0 items-center gap-[1.2cqw] rounded-[1.2cqw] px-[1.4cqw] py-[1.1cqw] text-white shadow-[var(--tile-shadow)]"
                  style={{ backgroundColor: style.bg }}
                >
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-[2.6cqw] leading-none"
                  >
                    {style.shape}
                  </span>
                  <span className="min-w-0 flex-1 break-words text-[2cqw] font-black leading-tight">
                    {option}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );

    case 'answer':
      return (
        <div className="flex h-full min-h-0 flex-col">
          <p className={EYEBROW_CLS}>{slide.title}</p>
          <h2 className="mt-[0.6cqw] text-[3.2cqw] font-black leading-tight text-balance break-words text-[var(--ink)]">
            {slide.question}
          </h2>
          <div className="mt-[1.4cqw] grid min-h-0 flex-1 grid-cols-2 content-center gap-[1.2cqw]">
            {slide.options.map((option, index) => {
              const style = ANSWER_BUTTONS[index % ANSWER_BUTTONS.length];
              const correct = index === slide.correctIndex;
              return (
                <div
                  key={option}
                  className={clsx(
                    'flex min-w-0 items-center gap-[1.2cqw] rounded-[1.2cqw] px-[1.4cqw] py-[1.1cqw] text-white shadow-[var(--tile-shadow)]',
                    correct &&
                      'ring-4 ring-[var(--accent-2)] ring-offset-2 ring-offset-[var(--surface)]'
                  )}
                  style={{ backgroundColor: style.bg }}
                >
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-[2.6cqw] leading-none"
                  >
                    {style.shape}
                  </span>
                  <span className="min-w-0 flex-1 break-words text-[2cqw] font-black leading-tight">
                    {option}
                  </span>
                  {correct ? (
                    <Check aria-hidden="true" className="h-[1.4em] w-[1.4em] shrink-0" />
                  ) : null}
                </div>
              );
            })}
          </div>
          {slide.explanation ? (
            <p className="mt-[1.2cqw] shrink-0 break-words rounded-[0.9cqw] border-l-4 border-[var(--accent)] bg-[var(--surface-2)] px-[1.2cqw] py-[0.75cqw] text-[1.35cqw] font-semibold leading-snug text-[var(--ink)]">
              {slide.explanation}
            </p>
          ) : null}
        </div>
      );

    default:
      return null;
  }
}

/**
 * The one and only slide renderer. Its outer element is a size container, so
 * every `cqw` below is relative to the slide width: the TV and the teacher
 * preview share the exact same layout at any size.
 */
export default function SlideView({
  slide,
  className,
  imageUrl,
  showNotes = true,
  variant = 'tv',
}: SlideViewProps) {
  return (
    <section
      className={clsx(
        'slide-stage relative h-full w-full overflow-hidden bg-[var(--surface)]',
        className
      )}
    >
      <div className="flex h-full w-full min-h-0 flex-col p-[4.2cqw]">
        <div className="flex min-h-0 w-full flex-1 flex-col">
          <SlideBody
            slide={slide}
            imageUrl={imageUrl}
            showNotes={showNotes}
            variant={variant}
          />
        </div>
      </div>
    </section>
  );
}

/**
 * Teacher preview: renders the real TV slide on a fixed 960×540 stage and
 * scales it with `transform` to fit the available width. Because the stage is
 * always 16:9 and the slide uses container units, what the teacher sees is
 * pixel-for-pixel the same composition the TV renders.
 */
export function SlideStage({
  slide,
  imageUrl,
  className,
}: {
  slide: Slide;
  imageUrl?: string;
  className?: string;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const measure = () => {
      const width = frame.clientWidth;
      setScale(width > 0 ? width / SLIDE_STAGE_WIDTH : 0);
    };

    measure();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }

    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={frameRef}
      className={clsx('relative w-full overflow-hidden', className)}
      style={{ aspectRatio: `${SLIDE_STAGE_WIDTH} / ${SLIDE_STAGE_HEIGHT}` }}
    >
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{
          width: `${SLIDE_STAGE_WIDTH}px`,
          height: `${SLIDE_STAGE_HEIGHT}px`,
          transform: `scale(${scale})`,
          visibility: scale > 0 ? 'visible' : 'hidden',
        }}
      >
        <SlideView slide={slide} imageUrl={imageUrl} showNotes={false} variant="preview" />
      </div>
    </div>
  );
}
