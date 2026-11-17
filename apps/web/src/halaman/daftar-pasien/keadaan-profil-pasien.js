import { BAGIAN_SOAPIE, KASIR, KLINIS, PENUNJANG, PROFIL_PASIEN, STATUS_HASIL_LAB, STATUS_ORDER_PENUNJANG, STATUS_PENGESAHAN, STATUS_RESEP, TAHAP_LAYANAN, TANDA_VITAL } from '@klira/shared';
import { tanggalWaktuPendek } from '../../util/format.js';

/** Tab pendamping di panel kunjungan; yang pertama adalah bawaan. */
export const SUB_TAB = ['pemeriksaan', 'resep', 'tindakan', 'penunjang', 'penutup'];
/**
 * Daftar lencana status untuk baris atas kanan panel kunjungan (`profil-panel-tanda`),
 * selalu diawali tahap layanan lalu diikuti status sesuai tab yang sedang dibuka.
 */
export function tandaKepalaPanel({ sub, klinis, data = {}, kasir = null, resepSerah = [] }) {
    const kj = kasir?.kunjungan ?? klinis?.kunjungan;
    if (!kj)
        return [];
    const lencana = [
        { label: TAHAP_LAYANAN.label(kj.tahap_layanan), warna: TAHAP_LAYANAN.warna(kj.tahap_layanan) },
    ];
    if (sub === 'resep') {
        for (const r of data.resep?.nilai ?? []) {
            lencana.push(
                { label: r.nomor_resep, warna: 'abu' },
                { label: r.status === 'diajukan' ? PROFIL_PASIEN.resep.menungguFarmasi : STATUS_RESEP.label(r.status), warna: STATUS_RESEP.warna(r.status) },
            );
        }
    }
    else if (sub === 'tindakan') {
        const td = klinis?.bagian?.tindakan;
        if (td?.pengesahan && td.verifikasi) {
            const p = td.pengesahan;
            lencana.push(
                { label: STATUS_PENGESAHAN.label(td.verifikasi), warna: STATUS_PENGESAHAN.warna(td.verifikasi), title: KLINIS.status.disahkanOleh(p.pengguna_nama, p.jenis_akun) },
                { label: KLINIS.status.versi(p.versi), warna: 'abu' },
            );
        }
    }
    else if (sub === 'penunjang') {
        const daftar = data.penunjang?.nilai ?? [];
        if (daftar.length === 1) {
            const st = daftar[0].status;
            lencana.push({ label: STATUS_ORDER_PENUNJANG.label(st), warna: STATUS_ORDER_PENUNJANG.warna(st) });
        }
        else if (daftar.length > 1) {
            const valid = daftar.filter((o) => o.status === 'divalidasi').length;
            lencana.push({ label: `${valid}/${daftar.length} ${STATUS_ORDER_PENUNJANG.label('divalidasi').toLowerCase()}`, warna: valid === daftar.length ? 'hijau' : 'kuning' });
        }
    }
    else if (sub === 'penutup') {
        const t = kasir?.tagihan;
        if (t && t.status_tagihan !== 'lengkap')
            lencana.push({ label: KASIR.bayar.tagihanBelumLengkap, warna: 'kuning' });
        if (resepSerah.length) {
            const st = resepSerah.every((r) => r.status === 'diserahkan') ? 'diserahkan' : resepSerah.some((r) => r.status === 'siap') ? 'siap' : resepSerah[0].status;
            lencana.push({ label: st === 'diajukan' ? PROFIL_PASIEN.resep.menungguFarmasi : STATUS_RESEP.label(st), warna: STATUS_RESEP.warna(st) });
        }
        if (kasir?.hasil_lab?.status) {
            const hl = kasir.hasil_lab;
            lencana.push({ label: `${STATUS_HASIL_LAB.label(hl.status)} (${hl.divalidasi}/${hl.total})`, warna: STATUS_HASIL_LAB.warna(hl.status) });
        }
    }
    return lencana;
}
/**
 * Daftar pilihan cetak yang muncul dari tombol ikon printer di kanan atas panel kunjungan.
 * Hanya opsi yang relevan dan boleh dicetak untuk tab/keadaan kunjungan ini yang disertakan.
 */
export function opsiCetakPanel({ terbatas, bolehKlinis, bolehPenunjang, bolehKasir, bolehRekamMedis, orders = null, kasir = null }) {
    const daftar = [];
    if (!terbatas && (bolehKlinis || bolehRekamMedis))
        daftar.push({ id: 'rekam-medis', label: PROFIL_PASIEN.soapie.cetak });
    if (bolehPenunjang && Array.isArray(orders) && orders.some((o) => o.status === 'divalidasi' && !!o.hasil))
        daftar.push({ id: 'hasil-lab', label: PENUNJANG.cetak.tombol });
    else if (bolehKasir && kasir?.hasil_lab?.divalidasi > 0)
        daftar.push({ id: 'hasil-lab', label: PENUNJANG.cetak.tombol });
    if (bolehKasir && kasir && kasir.tagihan?.pembayaran?.length > 0)
        daftar.push({ id: 'bayar', label: KASIR.cetakBayar.tombol });
    return daftar;
}
/**
 * Mode panel pemeriksaan untuk satu kunjungan: `ubah` (SOAPIE dapat diisi) dan `ubahVital` (tanda vital dan alergi), atau baca saja beserta alasannya.
 * Selama kunjungan belum ditutup catatan bebas diubah; sesudah ditutup (`tutup`) tetap bisa diubah tetapi setiap perubahan wajib beralasan.
 * Skrining dan pemeriksaan tidak dibedakan: sejak menunggu skrining semuanya bisa diisi (klinik kecil tanpa petugas skrining); catatan pertama
 * yang disimpan memajukan kunjungan ke tahap pemeriksaan. Server tetap memutuskan.
 */
export function modeCatatan(kunjungan, boleh) {
    if (kunjungan.jenis === 'LAB')
        return { ubah: false, ubahVital: false, tutup: false, alasan: 'lab' };
    if (!boleh('klinis', 'input'))
        return { ubah: false, ubahVital: false, tutup: false, alasan: 'tanpaIzin' };
    return { ubah: true, ubahVital: true, tutup: kunjungan.tahap_layanan === 'ditutup', alasan: null };
}
const POLA_TENSI = /^\s*(\d{2,3})\s*(?:\/\s*(\d{2,3})?\s*)?$/;
/** Tensi ditulis satu isian "sistole/diastole" (mis. 120/80); kosong sah. Nilai angka dipecah ke dua tanda vital. */
export function parseTensi(teks) {
    if (!teks.trim())
        return { sistolik: '', diastolik: '', sah: true };
    const m = POLA_TENSI.exec(teks);
    return m ? { sistolik: m[1], diastolik: m[2] ?? '', sah: true } : { sistolik: '', diastolik: '', sah: false };
}
/** Teks tensi dari sistole dan diastole tersimpan. */
export const teksTensi = (tv) => (tv.sistolik ? `${tv.sistolik}${tv.diastolik ? `/${tv.diastolik}` : ''}` : '');
/** Pelaksana catatan: pengesah terakhir dari bagian-bagian ini ({ nama, jenis_akun, waktu }), atau null bila belum ada yang disahkan. */
export function pelaksana(bagian, daftar) {
    const p = daftar.flatMap((b) => (bagian[b]?.pengesahan ? [bagian[b].pengesahan] : [])).sort((x, y) => y.waktu.localeCompare(x.waktu))[0];
    return p ? { nama: p.pengguna_nama, jenis_akun: p.jenis_akun, waktu: p.waktu } : null;
}
const idPositif = (v) => { const n = Number(v); return Number.isInteger(n) && n > 0 ? n : null; };
/** Keadaan halaman Pasien dari alamat: pasien dan kunjungan terpilih serta tab pendamping. */
export function keadaanAlamat(search) {
    const q = new URLSearchParams(search);
    return { pasien: idPositif(q.get('pasien')), kunjungan: idPositif(q.get('kunjungan')), sub: SUB_TAB.includes(q.get('bagian')) ? q.get('bagian') : SUB_TAB[0] };
}
/** Alamat halaman untuk keadaan itu; nilai bawaan tidak ditulis. */
export function alamatProfil(k) {
    const q = new URLSearchParams({ tab: 'pasien' });
    if (k.pasien) {
        q.set('pasien', String(k.pasien));
        if (k.kunjungan)
            q.set('kunjungan', String(k.kunjungan));
        if (k.sub && k.sub !== SUB_TAB[0])
            q.set('bagian', k.sub);
    }
    return `/pasien?${q}`;
}
/** Penelusuran riwayat: semua kata harus ada pada tanggal, poli, dokter, keluhan, atau diagnosis kunjungan itu. */
export function saringRiwayat(daftar, cari) {
    const kata = cari.toLowerCase().split(/\s+/).filter(Boolean);
    if (!kata.length)
        return daftar;
    return daftar.filter((r) => {
        const teks = [tanggalWaktuPendek(r.mulai), r.mulai.slice(0, 10), r.poli_nama, r.dpjp_nama, r.keluhan_utama, ...r.diagnosis.flatMap((d) => [d.kode, d.nama])].filter(Boolean).join(' ').toLowerCase();
        return kata.every((w) => teks.includes(w));
    });
}
/** Kepesertaan pasien dari data jaminan: BPJS (nomor kartu JKN), asuransi lain, atau umum. */
export function kepesertaan(p) {
    const T = PROFIL_PASIEN.kepesertaan;
    if (p.jkn_nomor_kartu)
        return { label: T.jkn, rincian: p.jkn_nomor_kartu, warna: 'hijau' };
    if (p.asuransi_nama)
        return { label: T.asuransi, rincian: p.asuransi_nama, warna: 'biru' };
    return { label: T.umum, rincian: null, warna: 'abu' };
}
/** Umur dalam tahun penuh dari tanggal lahir YYYY-MM-DD; null bila tidak sah. */
export function umurTahun(tanggalLahir, sekarang = new Date()) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(tanggalLahir ?? '');
    if (!m)
        return null;
    const [t, b, h] = [Number(m[1]), Number(m[2]), Number(m[3])];
    const lewat = sekarang.getMonth() + 1 > b || (sekarang.getMonth() + 1 === b && sekarang.getDate() >= h);
    return Math.max(0, sekarang.getFullYear() - t - (lewat ? 0 : 1));
}
/** Versi format draf catatan; draf berformat lain diabaikan. */
export const VERSI_DRAF_CATATAN = 1;
const KUNCI_VITAL = [...TANDA_VITAL.map((t) => t.kunci), 'kesadaran'];
/** Isian yang dapat diubah di panel (tanda vital, alergi, enam teks SOAPIE, dan diagnosis) sebagai draf yang disimpan di server. */
export function bentukDraf(k, tensiTeks) {
    return {
        versi_draf: VERSI_DRAF_CATATAN,
        ...Object.fromEntries(BAGIAN_SOAPIE.map((b) => [b, k[b]])),
        tanda_vital: Object.fromEntries(KUNCI_VITAL.map((x) => [x, k.tanda_vital[x]])),
        alergi: k.keperawatan.alergi, tensi: tensiTeks,
        diagnosis: k.diagnosis.map((x) => ({ kode: x.kode, nama: x.nama, peran: x.peran, snomed: x.snomed ?? '' })),
    };
}
/** Draf diterapkan ke keadaan formulir; hanya isian bertipe teks yang diambil. Null bila draf tidak berlaku (bentuk lain atau sama dengan keadaan sekarang). */
export function terapkanDraf(k, tensiTeks, draf) {
    if (!draf || typeof draf !== 'object' || draf.versi_draf !== VERSI_DRAF_CATATAN)
        return null;
    const teks = (v, bawaan) => (typeof v === 'string' ? v : bawaan);
    const baru = {
        ...k,
        ...Object.fromEntries(BAGIAN_SOAPIE.map((b) => [b, teks(draf[b], k[b])])),
        tanda_vital: Object.fromEntries(KUNCI_VITAL.map((x) => [x, teks(draf.tanda_vital?.[x], k.tanda_vital[x])])),
        keperawatan: { ...k.keperawatan, alergi: teks(draf.alergi, k.keperawatan.alergi) },
        diagnosis: Array.isArray(draf.diagnosis)
            ? draf.diagnosis.filter((x) => x && typeof x.kode === 'string' && typeof x.nama === 'string' && ['utama', 'penyerta'].includes(x.peran)).map((x) => ({ kode: x.kode, nama: x.nama, peran: x.peran, snomed: typeof x.snomed === 'string' ? x.snomed : '' }))
            : k.diagnosis,
    };
    const tensi = teks(draf.tensi, tensiTeks);
    return JSON.stringify(bentukDraf(baru, tensi)) === JSON.stringify(bentukDraf(k, tensiTeks)) ? null : { k: baru, tensi };
}
