export function kunciPreferensiSuara(fasilitas) {
    if (!fasilitas || !/^\d+$/.test(fasilitas))
        return null;
    const id = Number(fasilitas);
    return Number.isSafeInteger(id) && id > 0 ? `klira.panggilan.suara.${id}` : null;
}
export function bacaPreferensiSuara(fasilitas, penyimpanan) {
    const kunci = kunciPreferensiSuara(fasilitas);
    if (!kunci)
        return false;
    try {
        return (penyimpanan ?? localStorage).getItem(kunci) === 'aktif';
    }
    catch {
        return false;
    }
}
export function simpanPreferensiSuara(fasilitas, aktif, penyimpanan) {
    const kunci = kunciPreferensiSuara(fasilitas);
    if (!kunci)
        return false;
    try {
        (penyimpanan ?? localStorage).setItem(kunci, aktif ? 'aktif' : 'nonaktif');
        return true;
    }
    catch {
        return false;
    }
}
