import { batasAjukanUlang, batasPengajuan, berkasKurang, KLAIM, kodeKlaimBeda, sisaHariBatas, STATUS_KLAIM, statusAwalKlaim, statusKlaimEfektif, TRANSISI_KLAIM, unikPerKode, } from '@klira/shared';
import { gagal } from '../../../umum/hasil.js';
import { GalatKlaim } from '../data-access/repositori.js';
const G = KLAIM.galat;
const tglDb = (t) => new Date(`${t}T00:00:00.000+07:00`);
/**
 * Klaim JKN/BPJS FKTP (4.5, 7): siapkan klaim dari kunjungan JKN yang sudah ditutup (kode disalin dari rekam medis), kelola SEP dan berkas, dan ubah status
 * (ajukan, dikembalikan, ajukan ulang, ditolak, dibayar) dengan pagar batas 6 bulan dan batas ajukan ulang bulan berikutnya. Semua tercatat di audit dan riwayat status.
 */
export function buatLayananKlaim({ repo, rm, baca, audit, keuangan = null, sekarang = () => new Date() }) {
    const catat = (p, aksi, id, keterangan, alamat) => audit.catat({ pengguna_id: p.id, aksi, entitas: 'klaim', entitas_id: id, keterangan, alamat });
    /** Kode rekam medis sekarang: catatan dokter (versi terakhir). */
    async function kodeRm(fas, kunjunganId) {
        const [d, t] = await Promise.all([baca.bacaBagian(fas, kunjunganId, 'diagnosis'), baca.bacaBagian(fas, kunjunganId, 'tindakan')]);
        return { diagnosis: (d?.item ?? []).map((x) => ({ kode: x.kode, nama: x.nama })), tindakan: unikPerKode((t?.item ?? []).map((x) => ({ kode: x.kode, nama: x.nama }))) };
    }
    async function keDto(fas, k, kunj, resume, riwayat, nama) {
        const now = sekarang();
        const dasar = { status: k.status, batas_pengajuan: k.batas_pengajuan, batas_ajukan_ulang: k.batas_ajukan_ulang };
        const kini = await kodeRm(fas, k.kunjungan_id);
        const jenis = kunj?.jenis ?? 'AMB';
        return {
            id: k.id, kunjungan_id: k.kunjungan_id, pasien_nama: kunj?.pasien_nama ?? '-', pasien_nomor_rm: kunj?.pasien_nomor_rm ?? '-', jenis, nomor_sep: k.nomor_sep, status: statusKlaimEfektif(dasar, now), tanggal_selesai: k.tanggal_selesai.toISOString(),
            batas_pengajuan: k.batas_pengajuan.toISOString(), batas_ajukan_ulang: k.batas_ajukan_ulang?.toISOString() ?? null, sisa_hari: sisaHariBatas(dasar, now), diagnosis: k.diagnosis, tindakan: k.tindakan, berkas: k.berkas,
            berkas_kurang: berkasKurang(jenis, k.berkas), catatan: k.catatan, diajukan_pada: k.diajukan_pada?.toISOString() ?? null, dikembalikan_pada: k.dikembalikan_pada?.toISOString() ?? null, berita_acara: k.berita_acara, alasan: k.alasan,
            jumlah_dibayar: k.jumlah_dibayar, dibayar_pada: k.dibayar_pada?.toISOString() ?? null, kode_beda: kodeKlaimBeda(k, kini), resume_ada: resume.has(k.kunjungan_id), spri: kunj?.spri ?? null,
            riwayat: riwayat.filter((r) => r.klaim_id === k.id).map((r) => ({ dari: r.dari, ke: r.ke, alasan: r.alasan, oleh_nama: nama.get(r.oleh) ?? null, waktu: r.waktu.toISOString() })),
        };
    }
    async function muatDto(p, baris) {
        const ids = baris.map((b) => b.kunjungan_id);
        const [kunj, resume, riwayat] = await Promise.all([repo.kunjunganBanyak(ids), rm.resumeAda(ids), repo.riwayat(baris.map((b) => b.id))]);
        const nama = await repo.namaPengguna(riwayat.map((r) => r.oleh));
        return Promise.all(baris.map((b) => keDto(b, kunj.get(b.kunjungan_id), resume, riwayat, nama)));
    }
    async function ambil(p, id) {
        const k = await repo.klaim(id);
        if (!k)
            return gagal('tidak_ditemukan', G.klaimTidakAda);
        return { ok: true, data: (await muatDto(p, [k]))[0] };
    }
    const bentrok = (e) => (e instanceof GalatKlaim ? gagal('konflik', e.kode === 'sudah_ada' ? G.sudahAda : G.bentrok) : null);
    return {
        async kandidat(p) {
            const k = await repo.kandidat();
            const resume = await rm.resumeAda(k.map((x) => x.id));
            const out = [];
            for (const x of k) {
                out.push({ kunjungan_id: x.id, pasien_nama: x.pasien_nama, pasien_nomor_rm: x.pasien_nomor_rm, jenis: x.jenis, waktu_tutup: (x.waktu_tutup ?? new Date(0)).toISOString(), nomor_sep: x.nomor_sep, resume_ada: resume.has(x.id) });
            }
            return out;
        },
        /** Kode klaim yang akan disalin untuk satu kunjungan (pratinjau di modal Penyiapan klaim). */
        async kodeKunjungan(p, kunjunganId) {
            if (!(await repo.kunjungan(kunjunganId)))
                return gagal('tidak_ditemukan', G.kunjunganTidakAda);
            return { ok: true, data: await (kunjunganId) };
        },
        async daftar(p, f) {
            const now = sekarang();
            const [{ total, baris }, ringkasan] = await Promise.all([repo.daftar(f, now), repo.ringkasan(now)]);
            return { data: await muatDto(p, baris), halaman: f.halaman, ukuran: f.ukuran, total, ringkasan };
        },
        detail: async (p, id, alamat) => {
            const h = await ambil(p, id);
            if (h.ok)
                await catat(p, 'lihat', id, 'Membuka klaim', alamat);
            return h;
        },
        async siapkan(p, m, alamat) {
            const k = await repo.kunjungan(m.kunjungan_id);
            if (!k)
                return gagal('tidak_ditemukan', G.kunjunganTidakAda);
            if (k.cara_pembayaran !== 'jkn')
                return gagal('konflik', G.bukanJkn);
            if (k.tahap_layanan !== 'ditutup' || !k.waktu_tutup)
                return gagal('konflik', G.belumDitutup);
            const [kode, resume] = await Promise.all([(k.id), rm.resumeAda([k.id])]);
            const sep = m.nomor_sep ?? k.nomor_sep;
            let id;
            try {
                id = await repo.buat({
                    kunjunganId: k.id, nomorSep: sep, status: statusAwalKlaim({ nomor_sep: sep, berkas: m.berkas, jenis: k.jenis, resume_ada: resume.has(k.id) }), tanggalSelesai: k.waktu_tutup, batas: batasPengajuan(k.waktu_tutup),
                    diagnosis: kode.diagnosis, tindakan: kode.tindakan, berkas: m.berkas, catatan: m.catatan, oleh: p.id,
                });
            }
            catch (e) {
                const g = bentrok(e);
                if (g)
                    return g;
                throw e;
            }
            await catat(p, 'input', id, `Menyiapkan klaim kunjungan ${k.id}`, alamat);
            return ambil(p, id);
        },
        /** Ubah SEP, berkas, dan catatan selama klaim belum diajukan (atau dikembalikan); status awal dihitung ulang untuk klaim yang belum diajukan. */
        async ubahBerkas(p, id, m, alamat) {
            const k = await repo.klaim(id);
            if (!k)
                return gagal('tidak_ditemukan', G.klaimTidakAda);
            const efektif = statusKlaimEfektif(k, sekarang());
            if (efektif === 'lewat_batas_waktu')
                return gagal('konflik', G.lewatBatas);
            if (efektif !== 'menunggu_sep' && efektif !== 'siap_diajukan' && efektif !== 'dikembalikan')
                return gagal('konflik', G.tidakBisaUbah);
            const kunj = await repo.kunjungan(k.kunjungan_id);
            const resume = await rm.resumeAda([k.kunjungan_id]);
            const status = efektif === 'dikembalikan' ? efektif : statusAwalKlaim({ nomor_sep: m.nomor_sep, berkas: m.berkas, jenis: kunj?.jenis ?? 'AMB', resume_ada: resume.has(k.kunjungan_id) });
            try {
                await repo.ubahBerkas(id, k.status, { nomorSep: m.nomor_sep, berkas: m.berkas, catatan: m.catatan, status, oleh: p.id });
            }
            catch (e) {
                const g = bentrok(e);
                if (g)
                    return g;
                throw e;
            }
            await catat(p, 'perbaikan', id, `Mengubah SEP atau berkas klaim ${id}`, alamat);
            return ambil(p, id);
        },
        async ubahStatus(p, id, m, alamat) {
            const k = await repo.klaim(id);
            if (!k)
                return gagal('tidak_ditemukan', G.klaimTidakAda);
            const now = sekarang();
            const efektif = statusKlaimEfektif(k, now);
            if (efektif === 'lewat_batas_waktu')
                return gagal('konflik', G.lewatBatas);
            const t = TRANSISI_KLAIM[m.aksi];
            if (!t.dari.includes(efektif))
                return gagal('konflik', G.aksiTidakSah);
            const d = {};
            if (m.aksi === 'ajukan' || m.aksi === 'ajukan_ulang')
                d.diajukan_pada = now;
            if (m.aksi === 'dikembalikan')
                Object.assign(d, { dikembalikan_pada: now, berita_acara: m.berita_acara, batas_ajukan_ulang: batasAjukanUlang(now) });
            if (m.aksi === 'ditolak')
                d.alasan = m.alasan;
            if (m.aksi === 'dibayar')
                Object.assign(d, { jumlah_dibayar: m.jumlah_dibayar, dibayar_pada: tglDb(m.dibayar_pada) });
            try {
                await repo.ubahStatus(id, k.status, t.ke, d, p.id, m.alasan ?? m.berita_acara ?? null);
                if (m.aksi === 'dibayar' && keuangan?.catatJurnal && Number(m.jumlah_dibayar) > 0) {
                    try {
                        await keuangan.catatJurnal({
                            tanggal: m.dibayar_pada,
                            sumber: 'klaim_jkn',
                            referensi_id: id,
                            keterangan: `Pelunasan klaim JKN #${id} (SEP ${k.nomor_sep ?? '-'})`,
                            dibuat_oleh: p.id,
                            baris: [
                                { akun_kode: '1102', debit: Number(m.jumlah_dibayar), kredit: 0, keterangan: 'Penerimaan transfer klaim BPJS/JKN' },
                                { akun_kode: '4101', debit: 0, kredit: Number(m.jumlah_dibayar), keterangan: `Pendapatan klaim JKN #${id}` },
                            ],
                        });
                    } catch { /* jurnal otomatis tidak menggagalkan pelunasan klaim */ }
                }
            }
            catch (e) {
                const g = bentrok(e);
                if (g)
                    return g;
                throw e;
            }
            await catat(p, 'perbaikan', id, `Klaim ${id}: ${STATUS_KLAIM.label(efektif)} menjadi ${STATUS_KLAIM.label(t.ke)}`, alamat);
            return ambil(p, id);
        },
    };
}
