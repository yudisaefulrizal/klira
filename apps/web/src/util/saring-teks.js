const normal = (t) => t.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
/** Saring daftar menurut kata pencarian (tanpa beda huruf besar/kecil; semua kata harus cocok). */
export function saringTeks(daftar, kata, teksDari) {
    const kunci = normal(kata).split(/\s+/).filter(Boolean);
    if (!kunci.length)
        return [...daftar];
    return daftar.filter((x) => {
        const t = normal(teksDari(x));
        return kunci.every((k) => t.includes(k));
    });
}
