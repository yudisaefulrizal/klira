import { UJI_ENDPOINT as U, bangunPermintaan, butuhBadan, contohBadan, isiKonteks } from '@klira/shared';

/** Kelompokkan katalog menurut `kelompok`, urutan kemunculan dipertahankan. */
export function kelompokkan(katalog) {
    const peta = new Map();
    for (const x of katalog) {
        if (!peta.has(x.kelompok)) peta.set(x.kelompok, []);
        peta.get(x.kelompok).push(x);
    }
    return [...peta].map(([kelompok, isi]) => ({ kelompok, isi }));
}

/** Isian awal satu endpoint: contoh parameter (konteks klinik terisi) dan contoh badan. */
export function formAwal(endpoint, konteks = {}) {
    const parameter = Object.fromEntries(endpoint.parameter.map((q) => [q.nama, isiKonteks(q.contoh, konteks)]));
    return { parameter, start: '', limit: '', badan: contohBadan(endpoint, parameter, konteks), badanDiubah: false };
}

/** Isian parameter termasuk halaman (bila endpoint berhalaman) untuk validasi dan pengiriman. */
export function isianParameter(endpoint, form) {
    return { ...form.parameter, ...(endpoint.paginasi ? { start: form.start, limit: form.limit } : {}) };
}

/** Ubah satu parameter; contoh badan ikut berubah selama badan belum diedit manual. */
export function ubahParameter(endpoint, form, nama, nilai, konteks = {}) {
    const baru = nama === 'start' || nama === 'limit' ? { ...form, [nama]: nilai } : { ...form, parameter: { ...form.parameter, [nama]: nilai } };
    return form.badanDiubah ? baru : { ...baru, badan: contohBadan(endpoint, baru.parameter, konteks) };
}
export const ubahBadan = (form, teks) => ({ ...form, badan: teks, badanDiubah: true });
export const pulihkanBadan = (endpoint, form, konteks = {}) => ({ ...form, badan: contohBadan(endpoint, form.parameter, konteks), badanDiubah: false });

/** Galat per kolom: parameter (jalur `parameter.nama`) dan badan. Sama dengan aturan server. */
export function galatForm(endpoint, form) {
    const galat = {};
    const h = bangunPermintaan(endpoint, isianParameter(endpoint, form));
    if (!h.ok) for (const [nama, pesan] of Object.entries(h.galat)) galat[`parameter.${nama}`] = pesan;
    if (butuhBadan(endpoint)) {
        if (form.badan.trim() === '') galat.badan = U.galat.badanWajib;
        else {
            try { JSON.parse(form.badan); } catch { galat.badan = U.galat.badanBukanJson; }
        }
    }
    return galat;
}

/** Badan permintaan ke API: isian kosong dihilangkan. */
export function bentukKirim(layanan, endpoint, form) {
    const parameter = Object.fromEntries(Object.entries(isianParameter(endpoint, form)).filter(([, v]) => v.trim() !== ''));
    return { layanan, endpoint_id: endpoint.id, parameter, ...(butuhBadan(endpoint) ? { badan: form.badan } : {}) };
}

export const nadaStatus = (status) => (status >= 200 && status < 300 ? 'hijau' : status >= 500 ? 'merah' : 'kuning');
export const formatJson = (nilai) => (nilai === undefined ? '' : JSON.stringify(nilai, null, 2));

/** Status koneksi aktif untuk spanduk atas halaman. */
export function ringkasKoneksi(k) {
    if (k.boleh_uji) return { nada: 'hijau', teks: U.halaman.koneksiSandbox };
    return { nada: k.aktif ? 'merah' : 'kuning', teks: k.pesan };
}

/** Ringkasan hasil kirim untuk ditampilkan: baris status, catatan, dan teks permintaan/respons. */
export function ringkasHasil(layanan, h) {
    if (h.galat) return { nada: 'merah', status: null, durasi: h.durasi_ms ?? null, catatan: [h.galat], permintaan: tekPermintaan(h.permintaan), respons: '' };
    const r = h.respons, catatan = [];
    if (layanan === 'pcare') {
        if (r.meta_data) catatan.push(U.halaman.statusPcare(r.meta_data.code, r.meta_data.message));
        if (r.gagal_dekripsi) catatan.push(U.halaman.gagalDekripsi);
        if (!r.terbaca) catatan.push(U.halaman.tidakTerbaca);
    }
    const isi = layanan === 'pcare' ? { metaData: r.meta_data, response: r.badan } : r.badan;
    return { nada: nadaStatus(r.status), status: r.status, durasi: r.durasi_ms, catatan, permintaan: tekPermintaan(h.permintaan), respons: formatJson(isi) };
}
function tekPermintaan(p) {
    return [`${p.metode} ${p.url ?? p.jalur}`, ...(p.badan === undefined ? [] : ['', formatJson(p.badan)])].join('\n');
}
