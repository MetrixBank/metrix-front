/** Inputs consistentes nos modais financeiros (contraste no tema escuro). */
export const FINANCIAL_INPUT_CLASS =
  'h-11 rounded-xl border-white/10 bg-black/30 text-foreground placeholder:text-muted-foreground/50 ' +
  'focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary/30 ' +
  'focus-visible:ring-offset-0 transition-shadow';

/** Paletas por fluxo — modais e cards compartilham a mesma linguagem visual. */
export const FINANCIAL_MODAL_VARIANTS = {
  pix: {
    tag: 'Instantâneo',
    gradient:
      'from-emerald-500/[0.18] via-cyan-500/[0.08] to-transparent',
    iconGlow:
      'bg-gradient-to-br from-emerald-400/35 to-emerald-700/30 text-emerald-200 ring-2 ring-emerald-400/25 shadow-[0_0_32px_-4px_rgba(52,211,153,0.45)]',
    topLine: 'from-emerald-400 via-teal-400 to-cyan-400',
    primaryBtn:
      'bg-left bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 bg-[length:200%_100%] hover:bg-right text-white border-0 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/45 transition-[background-position,box-shadow] duration-500',
    cardHover:
      'hover:border-emerald-500/35 hover:shadow-[0_20px_50px_-12px_rgba(16,185,129,0.35)] group-hover:from-emerald-500/15',
  },
  boleto: {
    tag: 'Bancário',
    gradient: 'from-sky-500/[0.2] via-blue-500/[0.08] to-transparent',
    iconGlow:
      'bg-gradient-to-br from-sky-400/35 to-blue-800/40 text-sky-100 ring-2 ring-sky-400/25 shadow-[0_0_32px_-4px_rgba(56,189,248,0.4)]',
    topLine: 'from-sky-400 via-blue-500 to-indigo-500',
    primaryBtn:
      'bg-left bg-gradient-to-r from-sky-600 via-blue-600 to-sky-600 bg-[length:200%_100%] hover:bg-right text-white border-0 shadow-lg shadow-sky-500/30 hover:shadow-sky-500/45 transition-[background-position,box-shadow] duration-500',
    cardHover:
      'hover:border-sky-500/35 hover:shadow-[0_20px_50px_-12px_rgba(14,165,233,0.35)] group-hover:from-sky-500/15',
  },
  link: {
    tag: 'Compartilhável',
    gradient: 'from-fuchsia-500/[0.2] via-violet-500/[0.12] to-transparent',
    iconGlow:
      'bg-gradient-to-br from-fuchsia-400/35 to-violet-800/45 text-fuchsia-100 ring-2 ring-fuchsia-400/30 shadow-[0_0_32px_-4px_rgba(217,70,239,0.4)]',
    topLine: 'from-fuchsia-500 via-violet-500 to-purple-400',
    primaryBtn:
      'bg-left bg-gradient-to-r from-fuchsia-600 via-violet-600 to-fuchsia-600 bg-[length:200%_100%] hover:bg-right text-white border-0 shadow-lg shadow-fuchsia-500/30 hover:shadow-fuchsia-500/45 transition-[background-position,box-shadow] duration-500',
    cardHover:
      'hover:border-fuchsia-500/35 hover:shadow-[0_20px_50px_-12px_rgba(192,38,211,0.35)] group-hover:from-fuchsia-500/15',
  },
};
