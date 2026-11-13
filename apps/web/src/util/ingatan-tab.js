const kunci = (halaman) => `klira.tab.${halaman}`;
/** Tab terakhir yang dibuka di halaman ini (5.1h); null bila belum ada atau tidak lagi valid. */
export function bacaTabTerakhir(halaman, valid, simpanan) {
    try {
        const nilai = simpanan?.getItem(kunci(halaman));
        return valid.find((v) => v === nilai) ?? null;
    }
    catch {
        return null;
    }
}
export function simpanTabTerakhir(halaman, tab, simpanan) {
    try {
        simpanan?.setItem(kunci(halaman), tab);
    }
    catch {
        /* penyimpanan penuh atau ditolak: tab tidak diingat */
    }
}
/** Tab yang dipakai: dari alamat bila valid, kalau tidak yang terakhir diingat, kalau tidak yang pertama. */
export function pilihTab(daftar, dariAlamat, terakhir) {
    return daftar.find((t) => t === dariAlamat) ?? terakhir ?? daftar[0];
}
