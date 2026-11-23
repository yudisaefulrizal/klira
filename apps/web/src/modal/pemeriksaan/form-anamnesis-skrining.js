import { JENIS_NYERI } from '@klira/shared';
import { simpanBagian } from '../../api-klien/klinis.js';
import { bukaModal1 } from '../../komponen/modal-1/modal-1.js';
import { bidang, peringatan, tombol } from '../../komponen/ui/primitif.js';
import { token } from '../../gaya/token.js';

const LABEL_NYERI = {
    tidak: 'Tidak nyeri',
    akut: 'Nyeri akut',
    kronis: 'Nyeri kronis',
};

export function awalAnamnesisSkrining(anamnesisDb = null, keperawatanSekarang = null) {
    const a = anamnesisDb ?? {};
    const kp = keperawatanSekarang ?? {};
    return {
        keluhan_utama: a.keluhan_utama ?? '',
        penyerta: a.penyerta ?? '',
        riwayat_sekarang: a.riwayat_sekarang ?? '',
        riwayat_pribadi: a.riwayat_pribadi ?? 'Tidak ada',
        riwayat_keluarga: a.riwayat_keluarga ?? 'Tidak ada',
        kajian_sosial: a.kajian_sosial ?? 'Baik / Kooperatif',
        obat_dikonsumsi: kp.obat_dikonsumsi ?? 'Tidak ada',
        nyeri_jenis: kp.nyeri_jenis || 'tidak',
        nyeri_skala: kp.nyeri_skala != null ? String(kp.nyeri_skala) : '0',
        nyeri_lokasi: kp.nyeri_lokasi ?? '',
        nyeri_durasi: kp.nyeri_durasi ?? '',
        gizi_bb_turun: Boolean(kp.gizi_bb_turun),
        gizi_asupan_kurang: Boolean(kp.gizi_asupan_kurang),
    };
}

/** Susun ringkasan `[ANAMNESIS] ...` untuk disisipkan ke kolom Subjek. */
export function susunRingkasanAnamnesis(s) {
    const b = [];
    if (s.keluhan_utama?.trim()) b.push(`Keluhan: ${s.keluhan_utama.trim()}`);
    if (s.penyerta?.trim()) b.push(`Penyerta: ${s.penyerta.trim()}`);
    if (s.riwayat_sekarang?.trim()) b.push(`RPS: ${s.riwayat_sekarang.trim()}`);
    if (s.riwayat_pribadi?.trim()) b.push(`RPD: ${s.riwayat_pribadi.trim()}`);
    if (s.riwayat_keluarga?.trim()) b.push(`RPK: ${s.riwayat_keluarga.trim()}`);
    if (s.obat_dikonsumsi?.trim()) b.push(`RPO: ${s.obat_dikonsumsi.trim()}`);
    if (s.nyeri_jenis && s.nyeri_jenis !== 'tidak') {
        b.push(`Nyeri: ${LABEL_NYERI[s.nyeri_jenis]} (skala ${s.nyeri_skala || 0}${s.nyeri_lokasi ? `, ${s.nyeri_lokasi}` : ''})`);
    }
    if (s.gizi_bb_turun || s.gizi_asupan_kurang) {
        b.push('Risiko gizi: Ya');
    }
    return b.length ? `[ANAMNESIS] ${b.join(' · ')}` : '';
}

/** Sisipkan atau perbarui baris `[ANAMNESIS] ...` pada teks Subjek tanpa menghapus catatan lain. */
export function sisipkanBlokAnamnesis(subjekSekarang, blok) {
    const teks = (subjekSekarang ?? '').trim();
    const tanpaBlok = teks
        .split('\n')
        .filter((baris) => !/^\[ANAMNESIS\]\s*/.test(baris.trim()))
        .join('\n')
        .trim();
    if (!blok) return tanpaBlok;
    return tanpaBlok ? `${blok}\n${tanpaBlok}` : blok;
}

/** Modal Anamnesis & Skrining lengkap (setara Penilaian Awal Medis/Keperawatan Khanza). */
export function bukaModalAnamnesisSkrining({ kunjunganId, anamnesisAwal, keperawatanAwal, onTerapkan }) {
    let state = awalAnamnesisSkrining(anamnesisAwal, keperawatanAwal);
    let galat = '';
    let menyimpan = false;

    const modal = bukaModal1({
        judul: 'Anamnesis & Skrining Lengkap',
        lebar: 'modalSedang',
        onTutup: () => modal.tutup(),
    });

    const wadahStatus = document.createElement('div');
    const grid = document.createElement('div');
    Object.assign(grid.style, {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: token.jarak.sm,
    });

    const lukis = () => {
        wadahStatus.replaceChildren();
        if (galat) wadahStatus.append(peringatan(galat));
        grid.replaceChildren();

        const fKeluhan = bidang({
            id: 'anm-keluhan',
            label: 'Keluhan Utama *',
            nilai: state.keluhan_utama,
            ubah: (v) => { state.keluhan_utama = v; },
        });
        fKeluhan.kontrol.placeholder = 'Mis. Demam tinggi sejak 3 hari lalu';
        fKeluhan.el.style.gridColumn = '1 / -1';

        const fPenyerta = bidang({
            id: 'anm-penyerta',
            label: 'Gejala Penyerta',
            nilai: state.penyerta,
            ubah: (v) => { state.penyerta = v; },
        });
        fPenyerta.kontrol.placeholder = 'Mis. Batuk kering, mual';

        const fRps = bidang({
            id: 'anm-rps',
            label: 'Riwayat Penyakit Sekarang (RPS)',
            nilai: state.riwayat_sekarang,
            ubah: (v) => { state.riwayat_sekarang = v; },
        });
        fRps.kontrol.placeholder = 'Kronologi keluhan & faktor pemicu';

        const fRpd = bidang({
            id: 'anm-rpd',
            label: 'Riwayat Penyakit Dahulu (RPD)',
            nilai: state.riwayat_pribadi,
            ubah: (v) => { state.riwayat_pribadi = v; },
        });

        const fRpk = bidang({
            id: 'anm-rpk',
            label: 'Riwayat Penyakit Keluarga (RPK)',
            nilai: state.riwayat_keluarga,
            ubah: (v) => { state.riwayat_keluarga = v; },
        });

        const fRpo = bidang({
            id: 'anm-rpo',
            label: 'Riwayat Obat / RPO',
            nilai: state.obat_dikonsumsi,
            ubah: (v) => { state.obat_dikonsumsi = v; },
        });

        const fSosial = bidang({
            id: 'anm-sosial',
            label: 'Kajian Psikososial',
            nilai: state.kajian_sosial,
            ubah: (v) => { state.kajian_sosial = v; },
        });

        const fNyeri = bidang({
            id: 'anm-nyeri',
            label: 'Skrining Nyeri',
            nilai: state.nyeri_jenis,
            opsi: JENIS_NYERI.map((j) => ({ nilai: j, label: LABEL_NYERI[j] ?? j })),
            ubah: (v) => { state.nyeri_jenis = v; lukis(); },
        });

        const fGiziBb = bidang({
            id: 'anm-gizi-bb',
            label: 'Penurunan BB Tanpa Rencana?',
            nilai: state.gizi_bb_turun ? 'ya' : 'tidak',
            opsi: [{ nilai: 'tidak', label: 'Tidak' }, { nilai: 'ya', label: 'Ya' }],
            ubah: (v) => { state.gizi_bb_turun = v === 'ya'; },
        });

        const fGiziAsupan = bidang({
            id: 'anm-gizi-asupan',
            label: 'Asupan Makan Berkurang?',
            nilai: state.gizi_asupan_kurang ? 'ya' : 'tidak',
            opsi: [{ nilai: 'tidak', label: 'Tidak' }, { nilai: 'ya', label: 'Ya' }],
            ubah: (v) => { state.gizi_asupan_kurang = v === 'ya'; },
        });

        grid.append(fKeluhan.el, fPenyerta.el, fRps.el, fRpd.el, fRpk.el, fRpo.el, fSosial.el, fNyeri.el);
        if (state.nyeri_jenis !== 'tidak') {
            const fSkala = bidang({
                id: 'anm-skala',
                label: 'Skala Nyeri (0–10)',
                jenis: 'number',
                nilai: state.nyeri_skala,
                ubah: (v) => { state.nyeri_skala = v; },
            });
            fSkala.kontrol.min = '0';
            fSkala.kontrol.max = '10';
            const fLokasi = bidang({
                id: 'anm-lokasi',
                label: 'Lokasi Nyeri',
                nilai: state.nyeri_lokasi,
                ubah: (v) => { state.nyeri_lokasi = v; },
            });
            const fDurasi = bidang({
                id: 'anm-durasi',
                label: 'Durasi Nyeri',
                nilai: state.nyeri_durasi,
                ubah: (v) => { state.nyeri_durasi = v; },
            });
            grid.append(fSkala.el, fLokasi.el, fDurasi.el);
        }
        grid.append(fGiziBb.el, fGiziAsupan.el);
    };

    const simpanBtn = tombol('Simpan & Terapkan ke Subjek', async () => {
        if (menyimpan) return;
        if (!state.keluhan_utama.trim()) {
            galat = 'Keluhan utama wajib diisi.';
            lukis();
            return;
        }
        menyimpan = true;
        galat = '';
        simpanBtn.disabled = true;
        simpanBtn.textContent = 'Menyimpan...';
        try {
            const anamnesisPayload = {
                keluhan_utama: state.keluhan_utama.trim(),
                penyerta: state.penyerta.trim() || null,
                riwayat_sekarang: state.riwayat_sekarang.trim() || null,
                riwayat_pribadi: state.riwayat_pribadi.trim() || null,
                riwayat_keluarga: state.riwayat_keluarga.trim() || null,
                kajian_sosial: state.kajian_sosial.trim() || null,
            };
            const keperawatanPayload = {
                ...(keperawatanAwal ?? {}),
                alergi: keperawatanAwal?.alergi?.trim() || null,
                obat_dikonsumsi: state.obat_dikonsumsi.trim() || null,
                nyeri_jenis: state.nyeri_jenis,
                nyeri_skala: state.nyeri_jenis === 'tidak' ? null : Number(state.nyeri_skala || 0),
                nyeri_lokasi: state.nyeri_jenis === 'tidak' ? null : (state.nyeri_lokasi.trim() || null),
                nyeri_durasi: state.nyeri_jenis === 'tidak' ? null : (state.nyeri_durasi.trim() || null),
                gizi_bb_turun: state.gizi_bb_turun,
                gizi_asupan_kurang: state.gizi_asupan_kurang,
            };
            if (kunjunganId) {
                await Promise.all([
                    simpanBagian(kunjunganId, 'anamnesis', anamnesisPayload),
                    simpanBagian(kunjunganId, 'keperawatan', keperawatanPayload),
                ]);
            }
            onTerapkan?.({
                blok: susunRingkasanAnamnesis(state),
                anamnesis: anamnesisPayload,
                keperawatan: keperawatanPayload,
            });
            modal.tutup();
        } catch (e) {
            galat = e?.message || 'Gagal menyimpan anamnesis & skrining.';
            lukis();
        } finally {
            menyimpan = false;
            simpanBtn.disabled = false;
            simpanBtn.textContent = 'Simpan & Terapkan ke Subjek';
        }
    }, 'utama');

    lukis();
    modal.isi.append(wadahStatus, grid);
    modal.aksi.append(tombol('Batal', () => modal.tutup(), 'sekunder'), simpanBtn);
    return modal;
}
