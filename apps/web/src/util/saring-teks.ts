const normal = (t: string) => t.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');

/** Saring daftar menurut kata pencarian (tanpa beda huruf besar/kecil; semua kata harus cocok). */
export function saringTeks<T>(daftar: readonly T[], kata: string, teksDari: (x: T) => string): T[] {
  const kunci = normal(kata).split(/\s+/).filter(Boolean);
  if (!kunci.length) return [...daftar];
  return daftar.filter((x) => {
    const t = normal(teksDari(x));
    return kunci.every((k) => t.includes(k));
  });
}
