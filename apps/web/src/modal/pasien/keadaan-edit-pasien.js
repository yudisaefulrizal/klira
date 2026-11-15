/** Wali yang harus dibuka bila isian salah ada pada data wali/keluarga (daftar wali tampil satu per satu); selain itu tidak ada yang perlu dibuka. */
export function lokasiGalatEditPasien(jalur) {
    if (jalur === 'tidak_cakap' || jalur === 'wali' || jalur.startsWith('wali.')) {
        const indeks = Number(jalur.split('.')[1]);
        return Number.isInteger(indeks) && indeks >= 0 ? { wali: indeks } : {};
    }
    return {};
}
