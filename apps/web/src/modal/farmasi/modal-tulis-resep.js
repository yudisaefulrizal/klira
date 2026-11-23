import { FARMASI } from '@klira/shared';
import { resepKunjungan, semuaMasterObatAktif, simpanResep } from '../../api-klien/farmasi.js';
import { bukaModal1 } from '../../komponen/modal-1/modal-1.js';
import { peringatan, tombol } from '../../komponen/ui/primitif.js';
import { awalResep, bentukResep, galatResep, resepDariServer } from './keadaan-farmasi.js';
import { LangkahResep } from './langkah-resep.js';

const R = FARMASI.resep;

/** Modal cepat untuk menulis atau mengubah resep dokter langsung dari kolom Plan Pemeriksaan. */
export function bukaModalTulisResep({ kunjunganId, onSelesai, onBukaTab }) {
    let state = awalResep();
    let lama = null;
    let obat = [];
    let memuat = true;
    let menyimpan = false;
    let tampilGalat = false;
    let galat = '';
    let terkunci = false;
    let anak = null;

    const modal = bukaModal1({
        judul: 'Tulis Resep Obat',
        lebar: 'modalBesar',
        onTutup: () => { anak?.tutup?.(); modal.tutup(); },
    });

    const wadahStatus = document.createElement('div');
    const wadahIsi = document.createElement('div');
    const btnSimpan = tombol(R.ajukan ?? 'Simpan Resep', async () => {
        if (menyimpan || memuat || terkunci) return;
        const g = galatResep(state);
        if (Object.values(g).some(Boolean)) {
            tampilGalat = true;
            lukis();
            return;
        }
        menyimpan = true;
        galat = '';
        btnSimpan.disabled = true;
        btnSimpan.textContent = R.mengajukan ?? 'Menyimpan...';
        try {
            await simpanResep(kunjunganId, bentukResep(state));
            onSelesai?.({ lama: lama ? resepDariServer(lama) : null, baru: state, obat });
            modal.tutup();
        } catch (e) {
            galat = e?.message || R.gagalSimpan || 'Gagal menyimpan resep.';
            lukis();
        } finally {
            menyimpan = false;
            btnSimpan.disabled = memuat || terkunci;
            btnSimpan.textContent = R.ajukan ?? 'Simpan Resep';
        }
    }, 'utama');

    function lukis() {
        wadahStatus.replaceChildren();
        anak?.tutup?.();
        anak = null;
        wadahIsi.replaceChildren();
        if (galat) wadahStatus.append(peringatan(galat));
        if (memuat) {
            const p = document.createElement('p');
            p.textContent = 'Memuat daftar obat dan resep...';
            wadahIsi.append(p);
            btnSimpan.disabled = true;
            return;
        }
        if (terkunci) {
            wadahStatus.append(peringatan('Resep sudah ditelaah atau diproses farmasi sehingga tidak bisa diubah dari sini.', 'biru'));
        }
        btnSimpan.disabled = terkunci || menyimpan;
        const langkah = LangkahResep({
            resep: state,
            obat,
            galat: galatResep(state),
            tampilGalat,
            disabled: terkunci || menyimpan,
            onUbah(patch) {
                state = { ...state, ...patch };
            },
        });
        anak = langkah;
        wadahIsi.append(langkah);
    }

    modal.isi.append(wadahStatus, wadahIsi);
    modal.aksi.append(
        ...(onBukaTab ? [tombol('Buka Tab Resep →', () => { modal.tutup(); onBukaTab(); }, 'sekunder')] : []),
        tombol('Batal', () => modal.tutup(), 'sekunder'),
        btnSimpan,
    );
    lukis();

    Promise.all([resepKunjungan(kunjunganId), semuaMasterObatAktif()])
        .then(([daftarResep, daftarObat]) => {
            obat = daftarObat ?? [];
            lama = daftarResep?.[0] ?? null;
            if (lama) {
                state = resepDariServer(lama);
                terkunci = lama.status !== 'diajukan' || Boolean(lama.telaah);
            }
            memuat = false;
            lukis();
        })
        .catch((e) => {
            galat = e?.message || R.gagalMuat;
            memuat = false;
            lukis();
        });

    return modal;
}
