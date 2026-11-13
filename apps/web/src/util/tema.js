export const KUNCI_TEMA = 'klira.tema';
export function bacaTema(nilai) {
    return nilai === 'terang' || nilai === 'gelap' ? nilai : 'sistem';
}
export function temaEfektif(tema, sistemGelap) {
    return tema === 'sistem' ? (sistemGelap ? 'gelap' : 'terang') : tema;
}
export function temaTersimpan() {
    try {
        return bacaTema(localStorage.getItem(KUNCI_TEMA));
    }
    catch {
        return 'sistem';
    }
}
export function terapkanTema(tema) {
    document.documentElement.dataset.tema = temaEfektif(tema, window.matchMedia('(prefers-color-scheme: dark)').matches);
}
