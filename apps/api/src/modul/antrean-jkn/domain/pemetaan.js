/** Pemetaan kode BPJS (baris `pemetaan_bpjs`) menjadi pencarian dua arah. Jenis poli dibandingkan tanpa beda huruf besar/kecil. */
export function bacaPemetaan(baris) {
    const poliDariKode = new Map();
    const kodeDariPoli = new Map();
    const dokterDariKode = new Map();
    const kodeDariDokter = new Map();
    for (const b of baris) {
        if (b.jenis === 'poli') {
            poliDariKode.set(b.kode, b.kunci);
            kodeDariPoli.set(b.kunci.trim().toLowerCase(), b.kode);
        }
        else if (b.jenis === 'dokter') {
            dokterDariKode.set(b.kode, Number(b.kunci));
            kodeDariDokter.set(Number(b.kunci), b.kode);
        }
    }
    return {
        jenisPoli: (kode) => poliDariKode.get(String(kode ?? '').trim()) ?? null,
        kodePoli: (jenis) => kodeDariPoli.get(String(jenis ?? '').trim().toLowerCase()) ?? null,
        dokterId: (kode) => dokterDariKode.get(String(kode ?? '').trim()) ?? null,
        kodeDokter: (id) => kodeDariDokter.get(Number(id)) ?? null,
    };
}
