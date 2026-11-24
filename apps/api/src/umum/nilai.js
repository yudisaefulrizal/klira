/** Pembantu nilai dan tanggal bersama untuk lapisan data dan domain. Tiap pembantu persis sama dengan salinan lokal yang digantikannya. */
/** 'YYYY-MM-DD' dari Date (UTC). */
export const tglIso = (d) => d.toISOString().slice(0, 10);
/** ISO lengkap dari Date. */
export const iso = (d) => d.toISOString();
/** 'YYYY-MM-DD' menjadi Date tengah malam UTC (kolom DATE). */
export const tglDb = (t) => new Date(`${t}T00:00:00.000Z`);
/** 'YYYY-MM-DD' menjadi Date awal hari WIB. */
export const awalHariWib = (t) => new Date(`${t}T00:00:00.000+07:00`);
/** Teks kosong atau null menjadi null; selain itu dipangkas. */
export const kosongJadiNull = (v) => (v == null || v.trim() === '' ? null : v.trim());
