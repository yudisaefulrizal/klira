/**
 * Slot di tengah bilah atas (header): halaman yang butuh tombol di header, mis. tab Daftar pasien, memasukkan elemennya ke slot ini selama halaman terbuka.
 * Bilah atas dibangun ulang saat sesi berubah, jadi halaman memantau slot (`pantauSlotHeader`) dan memindahkan elemennya ke slot yang baru.
 */
let slot = null;
const pemantau = new Set();
/** Dipanggil bilah atas dengan elemen slot barunya; mengembalikan fungsi pencabut. */
export function daftarkanSlotHeader(el) {
    slot = el;
    for (const p of pemantau) p(slot);
    return () => { if (slot === el) { slot = null; for (const p of pemantau) p(null); } };
}
/** `panggil(slot)` segera dengan slot sekarang (bisa null) dan tiap slot berganti; mengembalikan fungsi berhenti. */
export function pantauSlotHeader(panggil) {
    pemantau.add(panggil); panggil(slot);
    return () => pemantau.delete(panggil);
}
