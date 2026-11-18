import { TOMBOL } from '@klira/shared';
import { opsiKunjungan, ubahDpjpKunjungan } from '../../api-klien/kunjungan.js';
import { GalatApi } from '../../api-klien/klien.js';
import { token } from '../../gaya/token.js';
import { bukaModal1 } from '../../komponen/modal-1/modal-1.js';
import { bidang, peringatan, tombol } from '../../komponen/ui/primitif.js';
import { dokterPoli } from './keadaan-kunjungan.js';

/**
 * Modal untuk petugas pendaftaran mengubah dokter tujuan (DPJP) pada kunjungan rawat jalan
 * selama pasien belum diperiksa dokter.
 */
export function bukaUbahDpjp({ pasienNama, kunjungan, onTutup, onSelesai }) {
    let aktif = true;
    let proses = false;
    let dpjpId = kunjungan.dpjp_id ? String(kunjungan.dpjp_id) : '';
    let selesai = false;

    const modal = bukaModal1({
        judul: 'Ubah dokter tujuan',
        lebar: 'modalKecil',
        onTutup() {
            aktif = false;
            (selesai ? onSelesai : onTutup)?.();
        },
    });

    const status = document.createElement('div');
    const info = document.createElement('p');
    info.style.margin = '0';
    info.textContent = `${pasienNama} · ${kunjungan.antrean?.kode ?? '-'} (${kunjungan.poli_nama ?? kunjungan.jenis_poli ?? 'Rawat jalan'})`;

    const wadahForm = document.createElement('div');
    Object.assign(wadahForm.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md });
    wadahForm.append(status, info);

    const tombolSimpan = tombol('Simpan dokter', () => void simpan());
    tombolSimpan.disabled = true;
    modal.aksi.append(tombol(TOMBOL.batal, modal.mintaTutup, 'sekunder'), tombolSimpan);
    modal.isi.replaceChildren(wadahForm);

    let bidangDokter = null;

    async function simpan() {
        if (proses)
            return;
        proses = true;
        tombolSimpan.disabled = true;
        tombolSimpan.textContent = 'Menyimpan…';
        status.replaceChildren();
        try {
            await ubahDpjpKunjungan(kunjungan.id, dpjpId ? Number(dpjpId) : null);
            if (!aktif)
                return;
            selesai = true;
            modal.tutup();
            onSelesai?.();
        } catch (e) {
            if (aktif)
                status.replaceChildren(peringatan(e instanceof GalatApi ? e.message : 'Gagal mengubah dokter tujuan.'));
        } finally {
            if (aktif) {
                proses = false;
                tombolSimpan.disabled = false;
                tombolSimpan.textContent = 'Simpan dokter';
            }
        }
    }

    void opsiKunjungan().then((opsi) => {
        if (!aktif)
            return;
        const daftar = dokterPoli(opsi?.dpjp ?? [], kunjungan.jenis_poli);
        const pilihan = [
            { nilai: '', label: 'Tanpa dokter pilihan (bebas)' },
            ...daftar.map((d) => ({ nilai: String(d.id), label: d.nama })),
        ];
        bidangDokter = bidang({
            id: 'ubah-dpjp-pilih',
            label: 'Dokter tujuan (DPJP)',
            nilai: dpjpId,
            opsi: pilihan,
            ubah(v) {
                dpjpId = v;
            },
        });
        wadahForm.append(bidangDokter.el);
        tombolSimpan.disabled = false;
    }).catch((e) => {
        if (aktif)
            status.replaceChildren(peringatan(e instanceof GalatApi ? e.message : 'Gagal memuat daftar dokter.'));
    });

    return { tutup: modal.tutup };
}
