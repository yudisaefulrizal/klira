import { HISTORI_RAWAT_JALAN } from '@klira/shared';
import { historiRawatJalan } from '../../api-klien/klinis.js';
import { GalatApi } from '../../api-klien/klien.js';
import { token } from '../../gaya/token.js';
import { peringatan } from '../../komponen/ui/primitif.js';
import { formatWaktu } from '../../util/tab/penyaring-tab.js';
import { barisHistori } from './keadaan-histori-rawat-jalan.js';

/** Tabel histori pemeriksaan rawat jalan pasien (hanya baca, gaya sama dengan histori CPPT); dipasang di kartu tersendiri di bawah panel kunjungan. */
export function TabelHistoriRawatJalan({ pasienId, kunjunganId }) {
    const H = HISTORI_RAWAT_JALAN;
    const el = document.createElement('section');
    Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.sm });
    const kepala = document.createElement('div');
    Object.assign(kepala.style, { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: token.jarak.sm });
    const judul = document.createElement('strong'); judul.textContent = H.judul;
    const jumlah = document.createElement('small'); jumlah.className = 'profil-redup';
    kepala.append(judul, jumlah);
    const status = document.createElement('div');
    const bungkusTabel = document.createElement('div');
    Object.assign(bungkusTabel.style, { overflowX: 'auto', border: '1px solid var(--garis, rgba(148, 163, 184, 0.35))', borderRadius: '8px' });
    el.append(kepala, status, bungkusTabel);
    let aktif = true, versi = 0;

    function sel(tag, isi, tambahan = {}) {
        const s = document.createElement(tag);
        if (isi !== undefined) s.textContent = isi;
        Object.assign(s.style, {
            padding: '7px 10px', borderBottom: '1px solid var(--garis, rgba(148, 163, 184, 0.25))', borderRight: '1px solid var(--garis, rgba(148, 163, 184, 0.25))',
            verticalAlign: 'top', fontSize: token.huruf.ukuran.kecil, textAlign: 'left', ...tambahan,
        });
        return s;
    }

    async function muat() {
        const saat = ++versi;
        status.replaceChildren(); bungkusTabel.replaceChildren(); jumlah.textContent = H.memuat;
        try {
            const daftar = (await historiRawatJalan(pasienId, kunjunganId)).map(barisHistori);
            if (!aktif || saat !== versi) return;
            jumlah.textContent = H.entri(daftar.length);
            if (!daftar.length) {
                const kosong = document.createElement('p');
                kosong.className = 'profil-redup'; kosong.style.padding = '12px'; kosong.style.margin = '0'; kosong.textContent = H.kosong;
                bungkusTabel.append(kosong);
                return;
            }
            const tbl = document.createElement('table');
            Object.assign(tbl.style, { width: '100%', borderCollapse: 'collapse', minWidth: '1040px' });
            const trHead = document.createElement('tr');
            for (const [label, minW] of [[H.kolom.waktu, '115px'], [H.kolom.pemeriksa, '140px'], [H.kolom.tandaVital, '175px'], [H.kolom.subjektif, '160px'], [H.kolom.objektif, '160px'], [H.kolom.asesmen, '140px'], [H.kolom.plan, '150px'], [H.kolom.diagnosis, '170px'], [H.kolom.tindakLanjut, '100px']])
                trHead.append(sel('th', label, { minWidth: minW, fontWeight: token.huruf.berat.tebal, background: 'var(--permukaan-2, rgba(148, 163, 184, 0.12))', whiteSpace: 'nowrap' }));
            const thead = document.createElement('thead'); thead.append(trHead);
            const tbody = document.createElement('tbody');
            for (const b of daftar) {
                const tr = document.createElement('tr');
                tr.append(
                    sel('td', formatWaktu(b.mulai), { whiteSpace: 'nowrap' }), sel('td', b.pemeriksa), sel('td', b.tandaVital, { whiteSpace: 'pre-wrap' }),
                    sel('td', b.subjektif, { whiteSpace: 'pre-wrap' }), sel('td', b.objektif, { whiteSpace: 'pre-wrap' }), sel('td', b.asesmen, { whiteSpace: 'pre-wrap' }),
                    sel('td', b.plan, { whiteSpace: 'pre-wrap' }), sel('td', b.diagnosis, { whiteSpace: 'pre-wrap' }), sel('td', b.tindakLanjut, { whiteSpace: 'nowrap' }),
                );
                tbody.append(tr);
            }
            tbl.append(thead, tbody); bungkusTabel.append(tbl);
        } catch (e) {
            if (!aktif || saat !== versi) return;
            jumlah.textContent = '';
            status.replaceChildren(peringatan(e instanceof GalatApi ? e.message : H.gagal));
        }
    }

    void muat();
    el.muatUlang = () => { void muat(); };
    el.tutup = () => { aktif = false; versi++; };
    return el;
}
