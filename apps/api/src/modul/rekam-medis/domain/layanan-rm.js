import { REKAM_MEDIS, SKEMA_BAGIAN } from '@klira/shared';
import { gagal } from '../../../umum/hasil.js';
import { bolehPerbaikiSendiri } from './pengesahan.js';
const G = REKAM_MEDIS.galat;
/**
 * Rekam medis (3.1, 4.2): perbaikan catatan (langsung oleh pembuat dalam 2x24 jam, selebihnya lewat persetujuan orang lain), dan daftar berkas
 * (arsip dengan retensi 25 tahun dibuat saat kunjungan ditutup). Semua tercatat di audit; tidak ada hapus.
 */
export function buatLayananRm({ repo, pengesahanRepo, klinis, baca, audit, sekarang = () => new Date() }) {
    const catat = (p, aksi, entitas, id, keterangan, alamat) => audit.catat({ pengguna_id: p.id, aksi, entitas, entitas_id: id, keterangan, alamat });
    const bacaIsi = () => (kunjunganId, bagian) => baca.bacaBagian(kunjunganId, bagian);
    async function kePermintaanDto(id) {
        const h = await repo.daftarPermintaan({ halaman: 1, ukuran: 100 }, bacaIsi());
        return h.data.find((x) => x.id === id) ?? null;
    }
    return {
        /** Ajukan perbaikan satu bagian: pembuat pengesahan terakhir dalam 2x24 jam langsung diterapkan; selain itu menjadi permintaan yang menunggu persetujuan. */
        async ajukanPerbaikan(p, kunjunganId, m, alamat) {
            if (!(await repo.kunjungan(kunjunganId)))
                return gagal('tidak_ditemukan', G.kunjunganTidakAda);
            const h = SKEMA_BAGIAN[m.bagian].safeParse(m.isi);
            if (!h.success)
                return { ok: false, kode: 'tidak_valid', pesan: G.isiTidakSah, rincian: h.error.issues.map((i) => ({ jalur: ['isi', ...i.path].join('.'), pesan: i.message })) };
            const terakhir = await pengesahanRepo.terakhir(m.bagian, kunjunganId);
            if (!terakhir)
                return gagal('konflik', G.belumDisahkan);
            if (await repo.adaMenunggu(kunjunganId, m.bagian))
                return gagal('konflik', G.sudahMenunggu);
            if (bolehPerbaikiSendiri(terakhir, p.id, sekarang())) {
                const r = await klinis.simpanBagian(p, kunjunganId, m.bagian, h.data, m.alasan, alamat, { perbaikan: true });
                if (!r.ok)
                    return r;
                return { ok: true, data: { jenis: 'diterapkan', permintaan: null } };
            }
            const id = await repo.buatPermintaan({ kunjunganId, bagian: m.bagian, isi: h.data, alasan: m.alasan, pemohonId: p.id });
            await catat(p, 'input', 'permintaan_perbaikan', id, `Permintaan perbaikan ${m.bagian} kunjungan ${kunjunganId}`, alamat);
            return { ok: true, data: { jenis: 'diajukan', permintaan: await kePermintaanDto(id) } };
        },
        daftarPerbaikan: (p, f) => repo.daftarPermintaan(f, bacaIsi()),
        /** Keputusan atas permintaan: penyetuju harus orang lain; setuju menerapkan isi atas nama pemohon dengan penyetuju tercatat di versi lama. */
        async putuskan(p, id, m, alamat) {
            const q = await repo.permintaan(id);
            if (!q)
                return gagal('tidak_ditemukan', G.permintaanTidakAda);
            if (q.status !== 'diajukan')
                return gagal('konflik', G.sudahDiputuskan);
            const catatan = m.catatan?.trim() || null;
            if (m.keputusan === 'tolak') {
                if (!(await repo.putuskan(id, 'ditolak', p.id, catatan)))
                    return gagal('konflik', G.sudahDiputuskan);
                await catat(p, 'perbaikan', 'permintaan_perbaikan', id, `Permintaan perbaikan ${q.bagian} kunjungan ${q.kunjungan_id} ditolak`, alamat);
                return { ok: true, data: (await kePermintaanDto(id)) ?? { id } };
            }
            if (q.pemohon_id === p.id)
                return gagal('konflik', G.penyetujuSama);
            if (!(await repo.putuskan(id, 'disetujui', p.id, catatan)))
                return gagal('konflik', G.sudahDiputuskan);
            const r = await klinis.simpanBagian({ id: q.pemohon_id }, q.kunjungan_id, q.bagian, q.isi_baru, q.alasan, alamat, { perbaikan: true, disetujuiOleh: p.id });
            if (!r.ok) {
                await repo.kembalikan(id);
                return r;
            }
            await catat(p, 'perbaikan', 'permintaan_perbaikan', id, `Permintaan perbaikan ${q.bagian} kunjungan ${q.kunjungan_id} disetujui dan diterapkan`, alamat);
            return { ok: true, data: (await kePermintaanDto(id)) ?? { id } };
        },
        berkas(p, f) {
            return repo.berkas(f, async (ids) => {
                const peta = new Map();
                for (const id of ids) {
                    const d = (await baca.bacaBagian(id, 'diagnosis'));
                    const utama = d?.item?.find((x) => x.peran === 'utama');
                    peta.set(id, utama ? `${utama.kode} ${utama.nama}` : null);
                }
                return peta;
            });
        },
    };
}
