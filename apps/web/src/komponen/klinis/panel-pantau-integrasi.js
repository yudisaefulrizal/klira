import { CARA_PEMBAYARAN } from '@klira/shared';
import { pesanGalat } from '../../api-klien/klien.js';
import { kirimKunjunganPcare } from '../../api-klien/pcare.js';
import { cariUlangIhsPasien, kirimKunjunganSatusehat, pantauIntegrasi } from '../../api-klien/satusehat.js';
import { barisFleks, teksRedupKecil } from '../../gaya/tata-letak.js';
import { token } from '../../gaya/token.js';
import { navigasiSaatIni } from '../../util/navigasi/navigasi.js';
import { formatWaktu } from '../../util/tab/penyaring-tab.js';
import { baris, bidang, kartu, lencana, peringatan, sel, tabel, tombol } from '../ui/primitif.js';
import { bukaCetakRekamMedis } from '../../modal/rekam-medis/cetak-rekam-medis.js';
import { cetakKuitansiKlaim, cetakRekapJkn, cetakSppJkn, cetakSptjmJkn } from './cetak-berkas-jkn.js';

const potongId = (id) => (id && id.length > 14 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id);

const SVG_NS = 'http://www.w3.org/2000/svg';
const PATH_IKON = {
    ok: 'M5 13l4 4L19 7',
    sinkron: 'M4 4v5h5M20 20v-5h-5M5.6 9A8 8 0 0 1 18 6.7L19 9M18.4 15A8 8 0 0 1 6 17.3L5 15',
    gagal: 'M18 6L6 18M6 6l12 12',
    peringatan: 'M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
    belum: 'M12 8v4l2.5 2.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
    kosong: 'M5 12h14',
};

function buatIkonSvg(jenis) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '15');
    svg.setAttribute('height', '15');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2.2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', PATH_IKON[jenis] ?? PATH_IKON.kosong);
    svg.append(path);
    return svg;
}

/**
 * Kartu pemantauan sinkronisasi PCare BPJS & SATUSEHAT (kolom terpisah per identitas, tahap PCare, dan resource SATUSEHAT).
 * Dipakai bersama di halaman Kasir dan klaim (tab Sinkronisasi) serta halaman SATUSEHAT.
 */
export function PanelPantauIntegrasi({ bolehKirim = false, maxWidth = '100%' } = {}) {
    const { pindah } = navigasiSaatIni();
    let hidup = true;
    let draf = { tanggal: '', cari: '', layanan: '', status: '' };
    let barisTerakhir = [];
    const box = kartu({ susun: 'md', style: { maxWidth } });
    const judul = document.createElement('h2');
    judul.textContent = 'Pemantauan Sinkronisasi (PCare & SATUSEHAT)';
    Object.assign(judul.style, { margin: 0, fontSize: token.huruf.ukuran.dasar, fontWeight: token.huruf.berat.tebal });
    const ringkas = document.createElement('div');
    barisFleks(ringkas, 'sm', { bungkus: true });

    const filterForm = document.createElement('form');
    barisFleks(filterForm, 'sm', { bungkus: true, rata: 'flex-end' });
    const fTanggal = bidang({ id: 'pantau-tanggal', label: 'Tanggal', jenis: 'date', ubah(v) { draf.tanggal = v; void muat(); } });
    const fCari = bidang({ id: 'pantau-cari', label: 'Cari Pasien / RM / No. Kunjungan', jenis: 'search', autoComplete: 'off', ubah(v) { draf.cari = v; } });
    const fLayanan = bidang({
        id: 'pantau-layanan', label: 'Layanan',
        opsi: [{ nilai: '', label: 'Semua' }, { nilai: 'pcare', label: 'PCare BPJS' }, { nilai: 'satusehat', label: 'SATUSEHAT' }],
        ubah(v) { draf.layanan = v; void muat(); },
    });
    const fStatus = bidang({
        id: 'pantau-status', label: 'Status',
        opsi: [{ nilai: '', label: 'Semua' }, { nilai: 'gagal', label: 'Gagal' }, { nilai: 'belum', label: 'Belum terkirim' }, { nilai: 'terkirim', label: 'Terkirim' }],
        ubah(v) { draf.status = v; void muat(); },
    });
    const btnCari = tombol('Terapkan');
    btnCari.type = 'submit';
    const btnReset = tombol('Atur ulang', () => {
        draf = { tanggal: '', cari: '', layanan: '', status: '' };
        fTanggal.kontrol.value = fCari.kontrol.value = fLayanan.kontrol.value = fStatus.kontrol.value = '';
        void muat();
    }, 'sekunder');
    const btnRekap = tombol('Cetak Rekap JKN', () => cetakRekapJkn({ baris: barisTerakhir, tanggal: draf.tanggal }), 'sekunder');
    const btnSptjm = tombol('Cetak SPTJM', () => cetakSptjmJkn({ baris: barisTerakhir, tanggal: draf.tanggal }), 'sekunder');
    const btnKuitansi = tombol('Cetak Kuitansi', () => cetakKuitansiKlaim({ baris: barisTerakhir, tanggal: draf.tanggal }), 'sekunder');
    filterForm.addEventListener('submit', (e) => { e.preventDefault(); void muat(); });
    filterForm.append(fTanggal.el, fCari.el, fLayanan.el, fStatus.el, btnCari, btnReset, btnRekap, btnSptjm, btnKuitansi);

    const pesan = document.createElement('div');
    const subKolom = [
        { grup: 'Pra-Syarat Identitas', kolom: ['Pasien', 'Dokter', 'Poli', 'No. JKN'] },
        { grup: 'PCare BPJS', kolom: ['Pendaftaran', 'Kunjungan', 'Tindakan', 'Obat'] },
        { grup: 'SATUSEHAT', kolom: ['Encounter', 'Diagnosa', 'Tindakan', 'Obat', 'Penunjang'] },
    ];
    const semuaSub = subKolom.flatMap((g) => g.kolom);
    const tbl = tabel([{ judul: 'Kunjungan & Pasien' }, ...semuaSub.map((k) => ({ judul: k })), { judul: 'Cetak' }], 'Pemantauan sinkronisasi');
    const thead = tbl.el.querySelector('thead');
    if (thead) {
        const gayaTh = (th, { tengah = false, garisKiri = false, kecil = false } = {}) => {
            Object.assign(th.style, {
                padding: `${token.jarak.xs} ${token.jarak.sm}`,
                borderBottom: `${token.ukuran.garis} solid ${token.warna.garis}`,
                ...(garisKiri ? { borderLeft: `${token.ukuran.garis} solid ${token.warna.garis}` } : {}),
                textAlign: tengah ? 'center' : 'left',
                fontSize: kecil ? token.huruf.ukuran.kecil : token.huruf.ukuran.dasar,
                fontWeight: token.huruf.berat.tebal,
                color: kecil ? token.warna.redup : token.warna.teks,
                whiteSpace: 'nowrap',
            });
            return th;
        };
        const trGrup = document.createElement('tr');
        const thPasien = gayaTh(document.createElement('th'));
        thPasien.rowSpan = 2;
        thPasien.scope = 'col';
        thPasien.style.verticalAlign = 'bottom';
        thPasien.textContent = 'Kunjungan & Pasien';
        trGrup.append(thPasien);
        for (const g of subKolom) {
            const th = gayaTh(document.createElement('th'), { tengah: true, garisKiri: true });
            th.colSpan = g.kolom.length;
            th.scope = 'colgroup';
            th.textContent = g.grup;
            trGrup.append(th);
        }
        const thCetak = gayaTh(document.createElement('th'), { tengah: true, garisKiri: true });
        thCetak.rowSpan = 2;
        thCetak.scope = 'col';
        thCetak.style.verticalAlign = 'bottom';
        thCetak.textContent = 'Cetak';
        trGrup.append(thCetak);
        const trSub = document.createElement('tr');
        for (const g of subKolom) {
            g.kolom.forEach((judulSub, idx) => {
                const th = gayaTh(document.createElement('th'), { tengah: true, garisKiri: idx === 0, kecil: true });
                th.scope = 'col';
                th.textContent = judulSub;
                trSub.append(th);
            });
        }
        thead.replaceChildren(trGrup, trSub);
    }
    box.append(judul, ringkas, filterForm, pesan, tbl.el);

    function selKunjunganPasien(b) {
        const s = sel();
        const atas = document.createElement('div');
        barisFleks(atas, 'xs', { rata: 'center', bungkus: true });
        const nama = document.createElement('strong');
        nama.textContent = b.pasien_nama;
        atas.append(nama, tombol('Buka', () => pindah(`/pasien?pasien=${b.pasien_id}&kunjungan=${b.id}`), 'teks'));
        const sub = document.createElement('div');
        teksRedupKecil(sub);
        sub.textContent = `${b.id_layanan || `#${b.id}`} · ${b.jenis === 'IMP' ? 'RI' : 'RJ'} · ${b.pasien_nomor_rm} · ${CARA_PEMBAYARAN.label(b.cara_pembayaran)}`;
        const poli = document.createElement('div');
        teksRedupKecil(poli);
        poli.textContent = `${b.poli_nama || '-'} · ${b.dpjp_nama || '-'} · ${formatWaktu(b.waktu_tutup ?? b.mulai)}`;
        s.append(atas, sub, poli);
        return s;
    }

    function selCetak(b) {
        const wadah = document.createElement('div');
        barisFleks(wadah, 'xs', { rata: 'center', bungkus: true });
        wadah.style.justifyContent = 'center';
        if (b.cara_pembayaran === 'jkn')
            wadah.append(tombol('SPP', () => cetakSppJkn(b), 'teks'));
        wadah.append(tombol('Resume', () => bukaCetakRekamMedis({ kunjunganId: b.id }), 'teks'));
        const td = sel(wadah);
        td.style.borderLeft = `${token.ukuran.garis} solid ${token.warna.garis}`;
        return td;
    }

    function selIkon({ status, label, onKlik, pesanGalatDefault }) {
        const warnaMap = {
            ok: token.warna.status.hijau,
            siap: token.warna.status.biru,
            gagal: token.warna.status.merah,
            peringatan: token.warna.status.kuning,
            belum: token.warna.status.abu,
            kosong: token.warna.status.abu,
        };
        const w = warnaMap[status] ?? token.warna.status.abu;
        const el = document.createElement(onKlik ? 'button' : 'span');
        if (onKlik)
            el.type = 'button';
        el.title = label;
        el.setAttribute('aria-label', label);
        Object.assign(el.style, {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: token.radius.pil,
            background: status === 'kosong' ? 'transparent' : w.latar,
            color: status === 'kosong' ? token.warna.redup : w.teks,
            border: onKlik ? `1px solid ${w.teks}` : 'none',
            padding: 0,
            cursor: onKlik ? 'pointer' : 'default',
        });
        const ikonJenis = status === 'siap' ? 'sinkron' : status;
        el.append(buatIkonSvg(ikonJenis));
        if (onKlik) {
            el.addEventListener('click', async () => {
                el.disabled = true;
                el.style.opacity = '0.6';
                el.style.cursor = 'wait';
                try { await onKlik(); }
                catch (e) { pesan.replaceChildren(peringatan(pesanGalat(e, pesanGalatDefault ?? 'Gagal memproses sinkronisasi'))); }
                void muat();
            });
        }
        const td = sel(el);
        td.style.textAlign = 'center';
        return td;
    }

    function selIhsPasien(b) {
        if (b.pasien_ihs)
            return selIkon({ status: 'ok', label: `IHS Pasien: ${b.pasien_ihs}` });
        if (!b.pasien_nik)
            return selIkon({ status: 'peringatan', label: 'NIK pasien kosong' });
        if (bolehKirim) {
            return selIkon({
                status: 'siap',
                label: 'IHS Pasien belum ada — klik untuk cek IHS',
                onKlik: () => cariUlangIhsPasien(b.pasien_id),
                pesanGalatDefault: 'Gagal cek IHS pasien',
            });
        }
        return selIkon({ status: 'belum', label: 'IHS Pasien belum tersedia' });
    }

    function selStatusBiner(ada, labelAda, labelBelum) {
        return selIkon({ status: ada ? 'ok' : 'belum', label: ada ? labelAda : labelBelum });
    }

    function selNoJkn(b) {
        if (b.cara_pembayaran !== 'jkn')
            return selIkon({ status: 'kosong', label: 'Pasien Non-JKN' });
        return b.jkn_nomor_kartu
            ? selIkon({ status: 'ok', label: `No. JKN: ${b.jkn_nomor_kartu}` })
            : selIkon({ status: 'peringatan', label: 'No. JKN pasien kosong' });
    }

    function selPcareDaftar(b) {
        if (b.cara_pembayaran !== 'jkn')
            return selIkon({ status: 'kosong', label: 'Non-JKN' });
        if (b.pcare_no_urut)
            return selIkon({ status: 'ok', label: `Terdaftar PCare (No. Urut ${b.pcare_no_urut})` });
        if (bolehKirim) {
            return selIkon({
                status: 'siap',
                label: 'Belum daftar PCare — klik untuk kirim Pendaftaran',
                onKlik: () => kirimKunjunganPcare(b.id, { tahap: 'pendaftaran' }),
                pesanGalatDefault: 'Gagal kirim pendaftaran PCare',
            });
        }
        return selIkon({ status: 'belum', label: 'Pendaftaran PCare belum dikirim' });
    }

    function selPcareKunjungan(b) {
        if (b.cara_pembayaran !== 'jkn')
            return selIkon({ status: 'kosong', label: 'Non-JKN' });
        if (b.pcare_status === 'terkirim') {
            const rincian = [b.pcare_no_kunjungan, b.pcare_dikirim_pada ? formatWaktu(b.pcare_dikirim_pada) : ''].filter(Boolean).join(' · ');
            return selIkon({ status: 'ok', label: `Kunjungan PCare terkirim${rincian ? ` (${rincian})` : ''}` });
        }
        if (b.pcare_status === 'gagal') {
            const err = b.pcare_pesan || 'Pengiriman gagal';
            return selIkon({
                status: 'gagal',
                label: bolehKirim ? `Gagal: ${err} — klik untuk kirim ulang` : `Gagal: ${err}`,
                onKlik: bolehKirim ? () => kirimKunjunganPcare(b.id, { tahap: 'kunjungan' }) : null,
                pesanGalatDefault: 'Gagal kirim kunjungan PCare',
            });
        }
        if (bolehKirim) {
            return selIkon({
                status: 'siap',
                label: 'Kunjungan PCare belum dikirim — klik untuk kirim',
                onKlik: () => kirimKunjunganPcare(b.id, { tahap: 'kunjungan' }),
                pesanGalatDefault: 'Gagal kirim kunjungan PCare',
            });
        }
        return selIkon({ status: 'belum', label: 'Kunjungan PCare belum dikirim' });
    }

    function selPcareItemTahap(b, { tahap, total, totalKlinis, terkirim, namaItem, pesanGalatDefault }) {
        if (b.cara_pembayaran !== 'jkn')
            return selIkon({ status: 'kosong', label: 'Non-JKN' });
        if (total === 0) {
            return selIkon({
                status: 'kosong',
                label: totalKlinis > 0 ? `${namaItem} tidak dipetakan ke BPJS (tidak perlu dikirim)` : `Tanpa ${namaItem}`,
            });
        }
        if (terkirim >= total)
            return selIkon({ status: 'ok', label: `${namaItem} PCare terkirim (${terkirim}/${total})` });
        if (!b.pcare_no_kunjungan)
            return selIkon({ status: 'peringatan', label: `${namaItem} (${terkirim}/${total}) — kirim Kunjungan PCare dulu` });
        if (bolehKirim) {
            return selIkon({
                status: 'siap',
                label: `${namaItem} PCare (${terkirim}/${total}) — klik untuk kirim`,
                onKlik: () => kirimKunjunganPcare(b.id, { tahap }),
                pesanGalatDefault,
            });
        }
        return selIkon({ status: 'belum', label: `${namaItem} PCare belum terkirim (${terkirim}/${total})` });
    }

    function selPcareTindakan(b) {
        return selPcareItemTahap(b, {
            tahap: 'tindakan',
            total: Number(b.jml_tindakan_bpjs ?? 0),
            totalKlinis: Number(b.jml_tindakan) || 0,
            terkirim: Object.keys(b.pcare_item_terkirim?.tindakan ?? {}).length,
            namaItem: 'Tindakan',
            pesanGalatDefault: 'Gagal kirim tindakan PCare',
        });
    }

    function selPcareObat(b) {
        return selPcareItemTahap(b, {
            tahap: 'obat',
            total: Number(b.jml_resep_bpjs ?? 0),
            totalKlinis: Number(b.jml_resep) || 0,
            terkirim: Object.keys(b.pcare_item_terkirim?.obat ?? {}).length,
            namaItem: 'Obat',
            pesanGalatDefault: 'Gagal kirim obat PCare',
        });
    }

    function selSatusehat(b) {
        if (b.encounter_id)
            return selIkon({ status: 'ok', label: `Encounter SATUSEHAT terkirim (${potongId(b.encounter_id)})` });
        if (bolehKirim) {
            return selIkon({
                status: 'siap',
                label: 'Bundle SATUSEHAT belum dikirim — klik untuk kirim',
                onKlik: () => kirimKunjunganSatusehat(b.id),
                pesanGalatDefault: 'Gagal kirim SATUSEHAT',
            });
        }
        return selIkon({ status: 'belum', label: 'Bundle SATUSEHAT belum dikirim' });
    }

    function selSatusehatItem(b, jumlah, namaItem) {
        const n = Number(jumlah) || 0;
        if (n === 0)
            return selIkon({ status: 'kosong', label: `Tanpa ${namaItem}` });
        if (b.encounter_id)
            return selIkon({ status: 'ok', label: `${namaItem} terkirim dalam Bundle (${n})` });
        return selIkon({ status: 'belum', label: `${namaItem} siap dikirim bersama Bundle (${n})` });
    }

    async function muat() {
        try {
            const h = await pantauIntegrasi({
                tanggal: draf.tanggal || undefined,
                cari: draf.cari || undefined,
                layanan: draf.layanan || undefined,
                status: draf.status || undefined,
            });
            if (!hidup)
                return;
            barisTerakhir = h.baris;
            pesan.replaceChildren();
            const r = h.ringkasan;
            ringkas.replaceChildren(
                lencana(`Total ditutup: ${r.total}`, 'abu'),
                lencana(`PCare Terkirim: ${r.pcare_terkirim}`, 'hijau'),
                lencana(`PCare Belum: ${r.pcare_belum}`, 'abu'),
                ...(r.pcare_gagal > 0 ? [lencana(`PCare Gagal: ${r.pcare_gagal}`, 'merah')] : []),
                lencana(`SATUSEHAT Terkirim: ${r.ss_terkirim}`, 'hijau'),
                lencana(`SATUSEHAT Belum: ${r.ss_belum}`, 'abu'),
            );
            tbl.tbody.replaceChildren();
            for (const b of h.baris) {
                const selPasien = selIhsPasien(b);
                const selDaftar = selPcareDaftar(b);
                const selEncounter = selSatusehat(b);
                selPasien.style.borderLeft = `${token.ukuran.garis} solid ${token.warna.garis}`;
                selDaftar.style.borderLeft = `${token.ukuran.garis} solid ${token.warna.garis}`;
                selEncounter.style.borderLeft = `${token.ukuran.garis} solid ${token.warna.garis}`;
                tbl.tbody.append(baris(
                    selKunjunganPasien(b),
                    selPasien,
                    selStatusBiner(b.ihs_practitioner_id, `IHS Dokter: ${b.ihs_practitioner_id}`, 'IHS Dokter belum tersedia'),
                    selStatusBiner(b.ihs_location_id, `IHS Poli: ${b.ihs_location_id}`, 'IHS Poli belum tersedia'),
                    selNoJkn(b),
                    selDaftar,
                    selPcareKunjungan(b),
                    selPcareTindakan(b),
                    selPcareObat(b),
                    selEncounter,
                    selSatusehatItem(b, b.jml_diag, 'Diagnosa'),
                    selSatusehatItem(b, b.jml_tindakan, 'Tindakan'),
                    selSatusehatItem(b, b.jml_resep, 'Obat'),
                    selSatusehatItem(b, b.jml_penunjang, 'Penunjang'),
                    selCetak(b),
                ));
            }
            if (!h.baris.length)
                pesan.replaceChildren(peringatan('Tidak ada kunjungan yang cocok dengan penyaring.', 'biru'));
        }
        catch (e) {
            if (hidup)
                pesan.replaceChildren(peringatan(pesanGalat(e, 'Gagal memuat pemantauan sinkronisasi.')));
        }
    }

    void muat();
    box.tutup = () => { hidup = false; };
    return box;
}
