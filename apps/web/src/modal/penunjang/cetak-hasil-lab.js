import { CARA_PEMBAYARAN, PENUNJANG } from '@klira/shared';
import { GalatApi } from '../../api-klien/klien.js';
import { ordersKunjungan } from '../../api-klien/penunjang.js';
import { peringatan, tombol } from '../../komponen/ui/primitif.js';
import { tanggalPendek, tanggalWaktuPendek } from '../../util/format.js';
import { penggunaSaatIni } from '../../util/sesi/konteks-pengguna.js';
import { susunLembarHasilLab } from './keadaan-cetak-lab.js';

const C = PENUNJANG.cetak;
const buat = (tag, kelas, teks) => { const e = document.createElement(tag); if (kelas) e.className = kelas; if (teks !== undefined) e.textContent = teks; return e; };

function bangunLembar(d, oleh) {
    const lembar = buat('article', 'chl-lembar'), kepala = buat('header', 'chl-kepala');
    if (d.klinik) kepala.append(buat('h1', '', d.klinik));
    kepala.append(buat('h2', '', C.judulLembar));

    const lahirKelamin = [
        d.pasien.tanggalLahir ? tanggalPendek(d.pasien.tanggalLahir) : null,
        d.pasien.jenisKelamin === 'laki_laki' ? 'L' : d.pasien.jenisKelamin === 'perempuan' ? 'P' : null,
    ].filter(Boolean).join(' · ') || '-';

    const info = [
        [C.nama, d.pasien.nama, true],
        [C.noRm, d.pasien.nomorRm, true],
        [C.lahirKelamin, lahirKelamin, false],
        [C.noPelayanan, d.kunjunganId ? `#${d.kunjunganId}` : '-', false],
        [C.tglDaftar, d.mulai ? tanggalWaktuPendek(d.mulai) : '-', false],
        [C.poli, d.poli ?? '-', false],
        [C.pengirim, d.pengirim ?? '-', false],
        [C.caraBayar, d.caraPembayaran ? CARA_PEMBAYARAN.label(d.caraPembayaran) : '-', false],
        [C.spesimen, d.spesimenAsal ?? '-', false],
        [C.waktuSpesimen, d.waktuSpesimen ? tanggalWaktuPendek(d.waktuSpesimen) : '-', false],
        [C.waktuValidasi, d.waktuValidasi ? tanggalWaktuPendek(d.waktuValidasi) : '-', false],
        [C.peranLab, d.validator ?? '-', false],
    ];

    const kisi = buat('div', 'chl-kisi');
    for (const [label, nilai, tebal] of info) {
        const sel = buat('div', 'chl-sel');
        sel.append(buat('span', 'chl-label', label), buat('span', tebal ? 'chl-nilai chl-tebal' : 'chl-nilai', nilai));
        kisi.append(sel);
    }

    const tabel = buat('table', 'chl-tabel'), thead = buat('thead'), trHead = buat('tr'), tbody = buat('tbody');
    for (const k of ['pemeriksaan', 'hasil', 'satuan', 'rujukan', 'interpretasi', 'keterangan']) {
        trHead.append(buat('th', '', C.kolom[k]));
    }
    thead.append(trHead);
    for (const b of d.baris) {
        const tr = buat('tr');
        const tdNama = buat('td');
        tdNama.append(buat('strong', '', b.nama));
        if (b.kodeLoinc) tdNama.append(buat('span', 'chl-loinc', `${PENUNJANG.daftar.kodeLoinc} ${b.kodeLoinc}`));
        const kelasNilai = b.tebal ? 'chl-tebal' : '';
        tr.append(
            tdNama,
            buat('td', kelasNilai, b.nilai),
            buat('td', '', b.satuan ?? '-'),
            buat('td', '', b.rujukan ?? '-'),
            buat('td', kelasNilai, b.interpretasi),
            buat('td', '', b.keterangan ?? '-'),
        );
        tbody.append(tr);
    }
    tabel.append(thead, tbody);

    const sah = buat('div', 'chl-pengesahan');
    sah.append(buat('strong', '', C.peranLab), buat('span', '', d.validator ?? '-'));
    if (d.waktuValidasi) sah.append(buat('span', '', tanggalWaktuPendek(d.waktuValidasi)));
    if (d.validator && d.waktuValidasi) sah.append(buat('span', '', C.disahkan));

    const kaki = buat('footer', 'chl-kaki');
    kaki.append(buat('span', '', C.dicetak(oleh, tanggalWaktuPendek(new Date().toISOString()))), buat('span', '', C.tandaTebal));

    lembar.append(kepala, kisi, tabel, sah, kaki);
    return lembar;
}

/** Membuka dialog pratinjau cetak hasil pemeriksaan laboratorium (A4) untuk satu kunjungan. */
export function bukaCetakHasilLab({ kunjunganId, orders: ordersAwal, pasien, kunjungan, onTutup }) {
    const oleh = penggunaSaatIni().pengguna?.nama ?? null, avant = document.activeElement;
    let aktif = true;
    if (!document.querySelector('link[data-cetak-hasil-lab]')) {
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = new URL('./cetak-hasil-lab.css', import.meta.url).href;
        css.dataset.cetakHasilLab = '';
        document.head.append(css);
    }
    const lapis = buat('div', 'chl-lapis'), alat = buat('div', 'chl-alat'), isi = buat('div');
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
    alat.append(buat('strong', '', C.judul), buat('span', 'chl-tumbuh'), btnTutup, btnCetak);
    isi.append(buat('p', 'chl-memuat', C.memuat));
    lapis.append(alat, isi);
    document.body.append(lapis);
    document.addEventListener('keydown', tekan);
    btnTutup.focus();

    function tampilkan(daftar) {
        if (!aktif) return;
        const d = susunLembarHasilLab({ orders: daftar, pasien, kunjungan });
        if (!d.baris.length) {
            isi.replaceChildren(peringatan(C.kosong, 'biru'));
            return;
        }
        isi.replaceChildren(bangunLembar(d, oleh));
        btnCetak.disabled = false;
        btnCetak.focus();
    }

    if (Array.isArray(ordersAwal)) {
        tampilkan(ordersAwal);
    } else {
        ordersKunjungan(kunjunganId)
            .then((daftar) => tampilkan(daftar))
            .catch((e) => { if (aktif) isi.replaceChildren(peringatan(e instanceof GalatApi ? e.message : C.gagal)); });
    }
    return { tutup: hancurkan };
}
