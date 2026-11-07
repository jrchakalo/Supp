'use client';

import clsx from 'clsx';
import { useState, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import type { CaseOption, Slide } from '@/lib/passaporte-lessons';
import { ANSWER_BUTTONS } from '@/lib/live/room';

type Variant = 'preview' | 'tv';

type SlideViewProps = {
  slide: Slide;
  variant?: Variant;
  className?: string;
  /** Scene image (e.g. the crime scene) sent along with the slide. */
  imageUrl?: string;
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

/**
 * Scene image, rendered below the slide title. A broken link shows a discreet
 * placeholder instead of a broken-image icon on the projector.
 */
function SceneImage({ src, tv }: { src: string; tv: boolean }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={clsx(
          'flex h-full w-full items-center justify-center rounded-2xl border border-dashed border-[var(--line-soft)] bg-[var(--surface-2)] text-[var(--muted)]',
          tv ? 'text-[clamp(0.9rem,1.4vw,1.4rem)]' : 'text-[10px]'
        )}
      >
        Imagem indisponível
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Imagem da cena"
      onError={() => setFailed(true)}
      className="h-full w-full rounded-2xl object-contain shadow-2xl"
    />
  );
}

function SceneImageFrame({ src, tv }: { src: string; tv: boolean }) {
  return (
    <div
      className={clsx(
        'flex min-h-0 flex-1 items-center justify-center overflow-hidden',
        tv ? 'mt-[clamp(0.6rem,1.4vw,1.4rem)]' : 'mt-2'
      )}
    >
      <SceneImage key={src} src={src} tv={tv} />
    </div>
  );
}

function SlideBody({ slide, tv, imageUrl }: { slide: Slide; tv: boolean; imageUrl?: string }) {
  const eyebrowCls = tv
    ? 'text-[clamp(0.85rem,1.2vw,1.3rem)] font-black uppercase tracking-[0.3em] text-[var(--accent)]'
    : 'text-[10px] font-black uppercase tracking-[0.18em] text-[var(--accent)]';
  const titleCls = tv
    ? 'text-[clamp(2rem,4.4vw,4.8rem)] font-black leading-[1.03] text-balance text-[var(--ink)]'
    : 'text-xl font-black leading-tight text-[var(--ink)] sm:text-2xl';
  const subtitleCls = tv
    ? 'text-[clamp(1.05rem,1.9vw,2.1rem)] font-bold text-[var(--muted)]'
    : 'text-xs font-semibold text-[var(--muted)] sm:text-sm';
  const bodyCls = tv
    ? 'text-[clamp(1.3rem,2.5vw,2.8rem)] font-black leading-tight text-[var(--ink)]'
    : 'text-sm font-semibold leading-snug text-[var(--ink)] sm:text-base';
  const smallCls = tv
    ? 'text-[clamp(0.95rem,1.6vw,1.7rem)] font-semibold text-[var(--muted)]'
    : 'text-[11px] font-semibold text-[var(--muted)]';
  const chipCls = tv
    ? 'rounded-full border-2 border-[var(--line)] bg-[var(--surface-2)] px-[clamp(0.8rem,1.5vw,1.4rem)] py-[clamp(0.35rem,0.7vw,0.65rem)] text-[clamp(0.9rem,1.45vw,1.5rem)] font-black text-[var(--ink)]'
    : 'rounded-full border-2 border-[var(--line)] bg-[var(--surface-2)] px-2.5 py-1 text-[10px] font-black text-[var(--ink)]';

  switch (slide.kind) {
    case 'cover':
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
          <p className={eyebrowCls}>Supp · Aula</p>
          <h1
            className={clsx(
              'font-black leading-[1.02] text-balance text-[var(--ink)]',
              tv ? 'text-[clamp(2.7rem,6.4vw,7.2rem)]' : 'text-3xl'
            )}
          >
            {slide.title}
          </h1>
          {slide.subtitle ? <p className={subtitleCls}>{slide.subtitle}</p> : null}
          {slide.chips?.length ? (
            <div className={clsx('mt-5 flex flex-wrap justify-center gap-2', tv && 'gap-3')}>
              {slide.chips.map((chip) => (
                <span key={chip} className={chipCls}>
                  {chip}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      );

    case 'bullets':
      return (
        <div className="flex h-full min-h-0 flex-col">
          <header className="flex shrink-0 flex-col gap-1">
            <p className={eyebrowCls}>Supp · Aula</p>
            <h2 className={titleCls}>{slide.title}</h2>
            {slide.subtitle ? <p className={subtitleCls}>{slide.subtitle}</p> : null}
          </header>
          {imageUrl ? <SceneImageFrame src={imageUrl} tv={tv} /> : null}
          <ul
            className={clsx(
              'flex flex-col',
              imageUrl ? 'min-h-0 shrink-0 overflow-hidden' : 'min-h-0 flex-1 justify-center',
              tv ? 'mt-4 gap-[clamp(0.7rem,1.6vw,1.8rem)]' : 'mt-3 gap-2'
            )}
          >
            {slide.bullets.map((bullet, bulletIndex) => (
              <li key={`${bullet}-${bulletIndex}`} className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="mt-[0.36em] h-[0.6em] w-[0.6em] shrink-0 rounded-[2px] bg-[var(--accent)]"
                />
                <span className={bodyCls}>{bullet}</span>
              </li>
            ))}
          </ul>
          {!tv && slide.note ? (
            <p
              className={clsx(
                'shrink-0 rounded-xl border-l-4 border-[var(--accent)] bg-[var(--surface-2)] px-3 py-2',
                smallCls
              )}
            >
              {slide.note}
            </p>
          ) : null}
        </div>
      );

    case 'case': {
      const correctIndex = caseCorrectIndex(slide);
      /* Preview always shows the answer so the teacher knows it before revealing. */
      const showAnswer = !tv || slide.revealed === true;

      return (
        <div className="flex h-full min-h-0 flex-col">
          <header className="flex shrink-0 flex-col gap-1">
            <h2 className={titleCls}>{slide.title}</h2>
            {slide.subtitle ? <p className={subtitleCls}>{slide.subtitle}</p> : null}
          </header>
          <p
            className={clsx(
              'shrink-0 font-black text-[var(--accent)]',
              tv ? 'mt-[clamp(0.8rem,1.6vw,1.8rem)] text-[clamp(1.4rem,2.7vw,3rem)]' : 'mt-2 text-sm'
            )}
          >
            {slide.prompt}
          </p>
          <ul
            className={clsx(
              'flex flex-col',
              tv ? 'min-h-0 flex-1 justify-center' : 'justify-start',
              tv ? 'mt-4 gap-[clamp(0.5rem,1.2vw,1.2rem)]' : 'mt-2 gap-1.5'
            )}
          >
            {slide.options.map((option, index) => {
              const isCorrect = showAnswer && index === correctIndex;
              return (
                <li
                  key={`${caseOptionText(option)}-${index}`}
                  className={clsx(
                    'flex items-center gap-3 rounded-xl border-2 bg-[var(--surface-2)] px-3 py-2',
                    isCorrect
                      ? 'border-emerald-400 ring-2 ring-emerald-400/40'
                      : 'border-[var(--line-soft)]'
                  )}
                >
                  <span
                    className={clsx(
                      'flex shrink-0 items-center justify-center rounded-lg bg-[var(--surface)] font-black text-[var(--accent)]',
                      tv ? 'h-[clamp(2rem,3vw,3rem)] w-[clamp(2rem,3vw,3rem)] text-[clamp(1rem,1.7vw,1.7rem)]' : 'h-7 w-7 text-xs'
                    )}
                  >
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className={clsx('min-w-0 flex-1', bodyCls)}>{caseOptionText(option)}</span>
                  {isCorrect ? (
                    <span className="shrink-0 rounded-full bg-emerald-400 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#071018]">
                      (raiz)
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
          {showAnswer && slide.note ? (
            <p
              className={clsx(
                'shrink-0 rounded-xl border-l-4 border-emerald-400 bg-[var(--surface-2)] px-3 py-2',
                tv ? 'mt-[clamp(0.6rem,1.2vw,1.2rem)]' : 'mt-2',
                smallCls
              )}
            >
              {slide.note}
            </p>
          ) : null}
        </div>
      );
    }

    case 'code': {
      const lineCount = slide.code.split('\n').length;
      const codeCls = tv
        ? lineCount > 16
          ? 'text-[clamp(0.62rem,1.05vw,0.98rem)]'
          : 'text-[clamp(0.85rem,1.5vw,1.4rem)]'
        : 'text-[10px] sm:text-[11px]';

      return (
        <div className="flex h-full min-h-0 flex-col">
          <header className="flex shrink-0 flex-col gap-1">
            <h2 className={titleCls}>{slide.title}</h2>
            {slide.subtitle ? <p className={subtitleCls}>{slide.subtitle}</p> : null}
          </header>
          <pre
            className={clsx(
              'mt-2 min-h-0 flex-1 overflow-auto rounded-xl border-2 border-[var(--line)] bg-[#080d1a] p-3 font-mono leading-relaxed text-[#e2e8f0] sm:p-4',
              codeCls,
              tv && 'mt-3 rounded-2xl'
            )}
          >
            <code>{highlightLua(slide.code)}</code>
          </pre>
          {slide.rows?.length ? (
            <div
              className={clsx(
                'shrink-0 overflow-auto rounded-xl border-2 border-[var(--line-soft)] bg-[var(--surface-2)]',
                tv ? 'mt-3 max-h-[36%]' : 'mt-2 max-h-32'
              )}
            >
              <ul>
                {slide.rows.map((row) => (
                  <li
                    key={`${row.left}-${row.right}`}
                    className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-2 border-b border-[var(--line-soft)] px-2.5 py-1.5 last:border-b-0"
                  >
                    <code
                      className={clsx(
                        'truncate font-mono font-bold text-[var(--accent-2)]',
                        tv ? 'text-[clamp(0.6rem,1vw,1rem)]' : 'text-[9px]'
                      )}
                    >
                      {row.left}
                    </code>
                    <span
                      className={clsx(
                        'text-[var(--muted)]',
                        tv ? 'text-[clamp(0.6rem,1vw,1rem)]' : 'text-[9px]'
                      )}
                    >
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

    case 'table':
      return (
        <div className="flex h-full min-h-0 flex-col">
          <header className="flex shrink-0 flex-col gap-1">
            <h2 className={titleCls}>{slide.title}</h2>
            {slide.subtitle ? <p className={subtitleCls}>{slide.subtitle}</p> : null}
          </header>
          <div className="mt-3 min-h-0 flex-1 overflow-auto rounded-xl border-2 border-[var(--line)]">
            <table className="w-full border-collapse text-left">
              <thead className="sticky top-0 bg-[var(--surface-2)]">
                <tr>
                  {slide.head.map((cell) => (
                    <th
                      key={cell}
                      className={clsx(
                        'border-b-2 border-[var(--line)] px-3 py-2 font-black uppercase tracking-wide text-[var(--accent)]',
                        tv ? 'text-[clamp(0.7rem,1.1vw,1.1rem)]' : 'text-[9px]'
                      )}
                    >
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slide.rows.map((row, rowIndex) => (
                  <tr
                    key={`row-${rowIndex}`}
                    className="border-b border-[var(--line-soft)] last:border-b-0"
                  >
                    {row.map((cell, cellIndex) => (
                      <td
                        key={`cell-${rowIndex}-${cellIndex}`}
                        className={clsx(
                          'px-3 py-2 align-top',
                          cellIndex === 0
                            ? 'font-black text-[var(--ink)]'
                            : 'font-semibold text-[var(--muted)]',
                          tv ? 'text-[clamp(0.75rem,1.3vw,1.35rem)]' : 'text-[9px]'
                        )}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );

    case 'big':
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
          {slide.subtitle ? <p className={eyebrowCls}>{slide.subtitle}</p> : null}
          <h1
            className={clsx(
              'font-black leading-none text-balance text-[var(--ink)]',
              tv ? 'text-[clamp(3rem,8vw,9rem)]' : 'text-3xl'
            )}
          >
            {slide.title}
          </h1>
          <ul className={clsx('flex flex-col', tv ? 'mt-[clamp(1rem,2.4vw,2.6rem)] gap-2' : 'mt-3 gap-1.5')}>
            {slide.lines.map((line) => (
              <li
                key={line}
                className={clsx(
                  'rounded-xl bg-[var(--surface-2)] px-4 py-2 font-black text-[var(--ink)]',
                  tv ? 'text-[clamp(1.2rem,2.3vw,2.5rem)]' : 'text-sm'
                )}
              >
                {line}
              </li>
            ))}
          </ul>
        </div>
      );

    case 'quiz':
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
          <h1
            className={clsx(
              'font-black leading-none text-balance text-[var(--ink)]',
              tv ? 'text-[clamp(2.8rem,7vw,8rem)]' : 'text-3xl'
            )}
          >
            {slide.title}
          </h1>
          {slide.subtitle ? <p className={subtitleCls}>{slide.subtitle}</p> : null}
          <ul className={clsx('flex flex-col', tv ? 'mt-[clamp(1rem,2.4vw,2.6rem)] gap-2' : 'mt-3 gap-1.5')}>
            {slide.bullets.map((bullet, bulletIndex) => (
              <li
                key={`${bullet}-${bulletIndex}`}
                className={clsx(
                  'rounded-xl border-2 border-[var(--line-soft)] bg-[var(--surface-2)] px-4 py-2 font-black text-[var(--ink)]',
                  tv ? 'text-[clamp(1.2rem,2.2vw,2.4rem)]' : 'text-sm'
                )}
              >
                {bullet}
              </li>
            ))}
          </ul>
          <p className={clsx('mt-2 font-black text-[var(--accent)]', tv ? 'text-[clamp(1.2rem,2vw,2rem)]' : 'text-sm')}>
            supp.lol/join
          </p>
        </div>
      );

    case 'question':
      return (
        <div className="flex h-full min-h-0 flex-col">
          <p className={eyebrowCls}>{slide.title}</p>
          <h2
            className={clsx(
              'font-black leading-tight text-balance text-[var(--ink)]',
              tv ? 'mt-2 text-[clamp(1.9rem,4vw,4.6rem)]' : 'mt-1 text-lg sm:text-xl'
            )}
          >
            {slide.question}
          </h2>
          {slide.subtitle ? <p className={clsx('mt-1', subtitleCls)}>{slide.subtitle}</p> : null}
          <div
            className={clsx(
              'grid min-h-0 flex-1 content-center grid-cols-1 sm:grid-cols-2',
              tv ? 'mt-4 gap-[clamp(0.6rem,1.4vw,1.4rem)]' : 'mt-3 gap-1.5'
            )}
          >
            {slide.options.map((option, index) => {
              const style = ANSWER_BUTTONS[index % ANSWER_BUTTONS.length];
              return (
                <div
                  key={option}
                  className={clsx(
                    'flex items-center gap-3 rounded-2xl text-white shadow-[var(--tile-shadow)]',
                    tv ? 'px-4 py-3' : 'px-2.5 py-2'
                  )}
                  style={{ backgroundColor: style.bg }}
                >
                  <span
                    aria-hidden="true"
                    className={clsx('shrink-0', tv ? 'text-[clamp(1.6rem,2.6vw,2.8rem)]' : 'text-lg')}
                  >
                    {style.shape}
                  </span>
                  <span
                    className={clsx(
                      'min-w-0 flex-1 font-black leading-tight',
                      tv ? 'text-[clamp(1.05rem,2vw,2rem)]' : 'text-xs'
                    )}
                  >
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
          <p className={eyebrowCls}>{slide.title}</p>
          <h2
            className={clsx(
              'font-black leading-tight text-balance text-[var(--ink)]',
              tv ? 'mt-2 text-[clamp(1.5rem,3vw,3.4rem)]' : 'mt-1 text-base sm:text-lg'
            )}
          >
            {slide.question}
          </h2>
          <div
            className={clsx(
              'grid min-h-0 flex-1 content-center grid-cols-1 sm:grid-cols-2',
              tv ? 'mt-4 gap-[clamp(0.6rem,1.4vw,1.4rem)]' : 'mt-3 gap-1.5'
            )}
          >
            {slide.options.map((option, index) => {
              const style = ANSWER_BUTTONS[index % ANSWER_BUTTONS.length];
              const correct = index === slide.correctIndex;
              return (
                <div
                  key={option}
                  className={clsx(
                    'flex items-center gap-3 rounded-2xl text-white shadow-[var(--tile-shadow)]',
                    correct && 'ring-4 ring-[var(--accent-2)] ring-offset-2 ring-offset-[var(--surface)]',
                    tv ? 'px-4 py-3' : 'px-2.5 py-2'
                  )}
                  style={{ backgroundColor: style.bg }}
                >
                  <span
                    aria-hidden="true"
                    className={clsx('shrink-0', tv ? 'text-[clamp(1.6rem,2.6vw,2.8rem)]' : 'text-lg')}
                  >
                    {style.shape}
                  </span>
                  <span
                    className={clsx(
                      'min-w-0 flex-1 font-black leading-tight',
                      tv ? 'text-[clamp(1.05rem,2vw,2rem)]' : 'text-xs'
                    )}
                  >
                    {option}
                  </span>
                  {correct ? (
                    <Check
                      aria-hidden="true"
                      className={clsx('shrink-0', tv ? 'h-[1.4em] w-[1.4em]' : 'h-4 w-4')}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
          {slide.explanation ? (
            <p
              className={clsx(
                'shrink-0 rounded-xl border-l-4 border-[var(--accent)] bg-[var(--surface-2)] px-3 py-2 font-semibold text-[var(--ink)]',
                tv ? 'mt-3 text-[clamp(1rem,1.7vw,1.8rem)]' : 'mt-2 text-[11px]'
              )}
            >
              {slide.explanation}
            </p>
          ) : null}
        </div>
      );

    default:
      return null;
  }
}

export default function SlideView({ slide, variant = 'preview', className, imageUrl }: SlideViewProps) {
  const tv = variant === 'tv';

  return (
    <section
      className={clsx(
        'flex h-full w-full flex-col overflow-hidden bg-[var(--surface)]',
        tv ? 'p-[clamp(1.4rem,3.4vw,3.8rem)]' : 'p-4',
        className
      )}
    >
      <div className={clsx('flex w-full flex-1 flex-col', tv && 'min-h-0')}>
        <SlideBody slide={slide} tv={tv} imageUrl={imageUrl} />
      </div>
    </section>
  );
}
