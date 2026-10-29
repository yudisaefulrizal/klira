export type Tema = 'terang' | 'gelap' | 'sistem';
export const KUNCI_TEMA = 'klira.tema';

export function bacaTema(nilai: string | null): Tema {
  return nilai === 'terang' || nilai === 'gelap' ? nilai : 'sistem';
}

export function temaEfektif(tema: Tema, sistemGelap: boolean): 'terang' | 'gelap' {
  return tema === 'sistem' ? (sistemGelap ? 'gelap' : 'terang') : tema;
}

export function temaTersimpan(): Tema {
  try { return bacaTema(localStorage.getItem(KUNCI_TEMA)); }
  catch { return 'sistem'; }
}

export function terapkanTema(tema: Tema) {
  document.documentElement.dataset.tema = temaEfektif(tema, window.matchMedia('(prefers-color-scheme: dark)').matches);
}
