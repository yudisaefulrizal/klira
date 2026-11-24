import { REKAM_MEDIS } from '@klira/shared';
import { ambilDokumen } from '../../api-klien/dokumen-rm.js';
import { pesanGalat } from '../../api-klien/klien.js';
import { peringatan, tombol } from '../../komponen/ui/primitif.js';
import { tanggalWaktuPendek } from '../../util/format.js';
import { penggunaSaatIni } from '../../util/sesi/konteks-pengguna.js';
import { bisaCetakDokumen, susunLembarDokumen } from './keadaan-dokumen.js';

const R = REKAM_MEDIS.dok.resume, C = R.cetak;
const buat = (tag, kelas, teks) => { const e = document.createElement(tag); if (kelas) e.className = kelas; if (teks !== undefined) e.textContent = teks; return e; };

function blokCetak({ judul, baris, dokter, waktu, sah }) {
    const blok = buat('section', 'crm-blok'), isi = buat('div', 'crm-isi'), kisi = buat('div', 'crm-kisi'), kolomSah = buat('div', 'crm-sah');
    kisi.style.gridTemplateColumns = 'minmax(0, 1fr)';
    for (const b of baris) {
        const sel = buat('div', 'crm-sel');
        sel.append(buat('span', 'crm-label', b.label), buat('span', 'crm-nilai', b.nilai));
        kisi.append(sel);
    }
    isi.append(kisi);
    kolomSah.append(buat('strong', '', C.dokter), buat('span', '', dokter ?? '-'));
    if (waktu) kolomSah.append(buat('span', '', tanggalWaktuPendek(waktu)));
    if (sah) kolomSah.append(buat('span', '', C.disahkan));
    blok.append(buat('h2', 'crm-pita', judul), isi, kolomSah);
    return blok;
}

function bangunLembar(d, oleh) {
    const lembar = buat('article', 'crm-lembar'), kepala = buat('header', 'crm-kepala'), kisiKepala = buat('div', 'crm-kisi');
    kisiKepala.style.gridTemplateColumns = 'repeat(4, minmax(0, 1fr))';
    for (const [label, nilai] of [
        [C.nama, d.pasien.nama],
        [C.noRm, d.pasien.nomorRm],
        [C.noPelayanan, d.kunjunganId ? `#${d.kunjunganId}` : '-'],
        [C.poli, [d.poli, d.dokter].filter(Boolean).join(' · ') || '-'],
    ]) {
        const sel = buat('div', 'crm-sel');
        sel.append(buat('span', 'crm-label', label), buat('span', 'crm-nilai', nilai));
        kisiKepala.append(sel);
    }
    kepala.append(buat('h1', '', C.judulLembar), kisiKepala);
    lembar.append(kepala);

    if (d.resume) {
        lembar.append(blokCetak({
            judul: `${C.judulResume} (${R.versi(d.resume.versi)})`,
            baris: d.resume.baris,
            dokter: d.resume.dokter,
            waktu: d.resume.waktu,
            sah: d.resume.verifikasi === 'sah',
        }));
    }
    for (const s of d.surat) {
        const baris = [
            ...(s.tujuan ? [{ label: R.suratTujuan, nilai: s.tujuan }] : []),
            { label: R.suratIsi, nilai: s.isi },
        ];
        lembar.append(blokCetak({
            judul: `${s.jenisLabel} · ${s.nomor}`,
            baris,
            dokter: s.dokter,
            waktu: s.waktu,
            sah: Boolean(s.dokter && s.waktu),
        }));
    }

    const kaki = buat('footer', 'crm-kaki');
    kaki.append(buat('span', '', C.dicetak(oleh, tanggalWaktuPendek(new Date().toISOString()))));
    lembar.append(kaki);
    return lembar;
}

/** Membuka dialog pratinjau cetak resume medis dan surat keterangan (A4) untuk satu kunjungan. */
export function bukaCetakDokumen({ kunjunganId, dok: dokAwal, pasien, kunjungan, onTutup }) {
    const oleh = penggunaSaatIni().pengguna?.nama ?? null, avant = document.activeElement;
    let aktif = true;
    if (!document.querySelector('link[data-cetak-rm]')) {
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = new URL('./cetak-rekam-medis.css', import.meta.url).href;
        css.dataset.cetakRm = '';
        document.head.append(css);
    }
    const lapis = buat('div', 'crm-lapis'), alat = buat('div', 'crm-alat'), isi = buat('div');
    lapis.setAttribute('role', 'dialog');
    lapis.setAttribute('aria-modal', 'true');
    lapis.setAttribute('aria-label', C.judul);

    function hancurkan() {
        aktif = false;
        document.removeEventListener('keydown', tekan);
        lapis.remove();
        if (avant?.isConnected) avant.focus();
    }
    function tutup() { hancurkan(); onTutup?.(); }
    function tekan(e) {
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); tutup(); }
        if (e.key === 'Tab') {
            const nodes = [...lapis.querySelectorAll('button:not([disabled]),a[href],input:not([disabled])')];
            const pertama = nodes[0], terakhir = nodes.at(-1);
            if (e.shiftKey && document.activeElement === pertama) { e.preventDefault(); terakhir?.focus(); }
            else if (!e.shiftKey && document.activeElement === terakhir) { e.preventDefault(); pertama?.focus(); }
        }
    }

    const btnTutup = tombol(C.tutup, tutup, 'sekunder'), btnCetak = tombol(C.cetak, () => window.print());
    btnCetak.disabled = true;
    alat.append(buat('strong', '', C.judul), buat('span', 'crm-tumbuh'), btnTutup, btnCetak);
    isi.append(buat('p', 'crm-memuat', C.memuat));
    lapis.append(alat, isi);
    document.body.append(lapis);
    document.addEventListener('keydown', tekan);
    btnTutup.focus();

    function tampilkan(dok) {
        if (!aktif) return;
        if (!bisaCetakDokumen(dok)) {
            isi.replaceChildren(peringatan(C.kosong, 'biru'));
            return;
        }
        isi.replaceChildren(bangunLembar(susunLembarDokumen({ dok, pasien, kunjungan }), oleh));
        btnCetak.disabled = false;
        btnCetak.focus();
    }

    if (dokAwal) {
        tampilkan(dokAwal);
    } else {
        ambilDokumen(kunjunganId)
            .then((dok) => tampilkan(dok))
            .catch((e) => { if (aktif) isi.replaceChildren(peringatan(pesanGalat(e, C.gagal))); });
    }
    return { tutup: hancurkan };
}
