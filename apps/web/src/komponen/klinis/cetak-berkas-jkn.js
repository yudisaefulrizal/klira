import { formatWaktu } from '../../util/tab/penyaring-tab.js';
import { panggilApi } from '../../api-klien/klien.js';
import { penggunaSaatIni } from '../../util/sesi/konteks-pengguna.js';
import { bukaTabCetak } from '../../util/cetak-tab.js';
import { tombol } from '../ui/primitif.js';

function bukaLembarCetak(judul, isiEl, { ekstraTombol = [] } = {}) {
    const cssHref = new URL('../../modal/rekam-medis/cetak-rekam-medis.css', import.meta.url).href;
    const tab = bukaTabCetak({ judul, cssHref });
    const el = document.createElement('div');
    el.className = 'crm-lapis';
    const alat = document.createElement('div');
    alat.className = 'crm-alat';
    const judulEl = document.createElement('strong');
    judulEl.textContent = judul;
    const ruang = document.createElement('span');
    ruang.className = 'crm-tumbuh';
    const btnTutup = tombol('Tutup', () => (tab ? tab.tutup() : el.remove()), 'sekunder');
    const btnCetak = tombol('Cetak', () => (tab ? tab.cetak() : window.print()));
    alat.append(judulEl, ruang, ...ekstraTombol, btnTutup, btnCetak);

    const lembar = document.createElement('div');
    Object.assign(lembar.style, {
        maxWidth: '820px',
        margin: '16px auto',
        padding: '28px 32px',
        background: '#ffffff',
        color: '#111827',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '13px',
        lineHeight: '1.5',
    });
    lembar.append(isiEl);
    el.append(alat, lembar);
    if (tab) {
        tab.body.append(el);
    } else {
        document.body.append(el);
    }
}

function buatJudulDokumen(judul, subjudul) {
    const wrap = document.createElement('div');
    Object.assign(wrap.style, { textAlign: 'center', borderBottom: '2px solid #111827', paddingBottom: '10px', marginBottom: '16px' });
    const h = document.createElement('h1');
    h.textContent = judul;
    Object.assign(h.style, { margin: 0, fontSize: '16px', fontWeight: '700', letterSpacing: '0.02em' });
    wrap.append(h);
    if (subjudul) {
        const p = document.createElement('div');
        p.textContent = subjudul;
        Object.assign(p.style, { fontSize: '12px', color: '#4b5563', marginTop: '4px' });
        wrap.append(p);
    }
    return wrap;
}

function buatTandaTangan(kiri, kanan) {
    const grid = document.createElement('div');
    Object.assign(grid.style, { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginTop: '28px', textAlign: 'center' });
    for (const pihak of [kiri, kanan]) {
        const col = document.createElement('div');
        const peran = document.createElement('div');
        peran.textContent = pihak.peran;
        const spasi = document.createElement('div');
        spasi.style.height = '64px';
        if (pihak.materai) {
            spasi.textContent = '(Materai)';
            Object.assign(spasi.style, { display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#6b7280' });
        }
        const nama = document.createElement('div');
        nama.textContent = pihak.nama;
        nama.style.fontWeight = '600';
        col.append(peran, spasi, nama);
        if (pihak.qrTeks) {
            const ket = document.createElement('div');
            Object.assign(ket.style, { fontSize: '9px', color: '#4b5563', marginTop: '2px' });
            ket.textContent = 'Ditandatangani secara elektronik';
            col.append(ket);
            void panggilApi('POST', '/integrasi/tte-qr', { teks: pihak.qrTeks }).then((d) => {
                if (!d?.qr || !spasi.isConnected) return;
                const img = document.createElement('img');
                img.src = d.qr;
                img.alt = 'QR Tanda Tangan Elektronik';
                Object.assign(img.style, { width: '64px', height: '64px', display: 'block', margin: '0 auto' });
                spasi.replaceChildren(img);
            }).catch(() => {});
        }
        grid.append(col);
    }
    return grid;
}

function buatTabelData(kolom, barisData) {
    const table = document.createElement('table');
    Object.assign(table.style, { width: '100%', borderCollapse: 'collapse', fontSize: '12px' });
    const thead = document.createElement('thead');
    const trH = document.createElement('tr');
    for (const k of kolom) {
        const th = document.createElement('th');
        th.textContent = k;
        Object.assign(th.style, { border: '1px solid #d1d5db', padding: '6px 8px', background: '#f3f4f6', textAlign: 'left' });
        trH.append(th);
    }
    thead.append(trH);
    const tbody = document.createElement('tbody');
    for (const r of barisData) {
        const tr = document.createElement('tr');
        for (const selTeks of r) {
            const td = document.createElement('td');
            td.textContent = selTeks;
            Object.assign(td.style, { border: '1px solid #d1d5db', padding: '6px 8px' });
            tr.append(td);
        }
        tbody.append(tr);
    }
    table.append(thead, tbody);
    return table;
}

const statusPcareLabel = (b) => (b.pcare_status === 'terkirim' ? 'Terkirim' : b.pcare_status === 'gagal' ? 'Gagal' : 'Belum');

function unduhCsv(namaFile, kolom, barisData) {
    const lolos = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`;
    const csv = ['\uFEFF' + kolom.map(lolos).join(','), ...barisData.map((r) => r.map(lolos).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = namaFile;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** Cetak Rekapitulasi Pelayanan JKN gaya SIMKES Khanza (dengan NIK, Status PCare, QR TTE, dan Ekspor CSV). */
export function cetakRekapJkn({ baris, tanggal }) {
    const jkn = baris.filter((b) => b.cara_pembayaran === 'jkn');
    const { pengguna } = penggunaSaatIni();
    const namaPetugas = pengguna?.nama || 'Petugas Klaim';
    const kolom = ['No', 'Tanggal', 'Pasien', 'NIK', 'No. RM', 'No. Kartu JKN', 'Poli / DPJP', 'No. Kunjungan PCare', 'Status PCare'];
    const barisData = jkn.map((b, i) => [
        String(i + 1),
        formatWaktu(b.waktu_tutup ?? b.mulai),
        b.pasien_nama,
        b.pasien_nik || '-',
        b.pasien_nomor_rm,
        b.jkn_nomor_kartu || '-',
        `${b.poli_nama || '-'} / ${b.dpjp_nama || '-'}`,
        b.pcare_no_kunjungan || '-',
        statusPcareLabel(b),
    ]);
    const isi = document.createElement('div');
    isi.append(buatJudulDokumen(
        'REKAPITULASI PELAYANAN PESERTA JKN / BPJS',
        `Periode: ${tanggal || 'Semua tanggal terfilter'} · Total: ${jkn.length} kunjungan`,
    ));
    if (!jkn.length) {
        const kosong = document.createElement('p');
        kosong.textContent = 'Tidak ada kunjungan JKN pada penyaring saat ini.';
        isi.append(kosong);
    } else {
        isi.append(buatTabelData(kolom, barisData));
    }
    isi.append(buatTandaTangan(
        {
            peran: 'Petugas Administrasi / Klaim',
            nama: `(${namaPetugas})`,
            qrTeks: `Rekap JKN Klira\nPetugas: ${namaPetugas}\nPeriode: ${tanggal || 'Semua'}\nTotal: ${jkn.length} kunjungan`,
        },
        {
            peran: 'Mengetahui, Pimpinan Fasyankes',
            nama: '( ................................. )',
        },
    ));
    const btnCsv = tombol('Ekspor CSV', () => unduhCsv(`rekap-jkn-${tanggal || 'semua'}.csv`, kolom, barisData), 'sekunder');
    bukaLembarCetak('Rekapitulasi Pelayanan JKN', isi, { ekstraTombol: [btnCsv] });
}

/** Cetak Surat Pernyataan Tanggung Jawab Mutlak (SPTJM) pengajuan klaim JKN. */
export function cetakSptjmJkn({ baris, tanggal }) {
    const jkn = baris.filter((b) => b.cara_pembayaran === 'jkn');
    const isi = document.createElement('div');
    isi.append(buatJudulDokumen('SURAT PERNYATAAN TANGGUNG JAWAB MUTLAK (SPTJM)', 'Pengajuan Klaim Pelayanan Kesehatan FKTP — BPJS Kesehatan'));

    const p1 = document.createElement('p');
    p1.textContent = 'Yang bertanda tangan di bawah ini, Pimpinan Fasilitas Kesehatan Tingkat Pertama (FKTP), menyatakan dengan sesungguhnya bahwa:';
    const ul = document.createElement('ol');
    for (const butir of [
        `Seluruh data pelayanan peserta JKN/BPJS Kesehatan sebanyak ${jkn.length} kunjungan (${tanggal || 'sesuai rekapitulasi terlampir'}) yang diajukan adalah benar telah dilaksanakan sesuai standar pelayanan medis.`,
        'Seluruh berkas pendukung klaim (FPK, FKPP, SPP, Resume Medis, serta dokumen penunjang lainnya) adalah sah dan dapat dipertanggungjawabkan.',
        'Apabila di kemudian hari ditemukan ketidaksesuaian atau kelebihan pembayaran atas klaim tersebut, kami bersedia mengembalikan sesuai ketentuan yang berlaku.',
    ]) {
        const li = document.createElement('li');
        li.textContent = butir;
        li.style.marginBottom = '6px';
        ul.append(li);
    }
    const p2 = document.createElement('p');
    p2.textContent = 'Demikian surat pernyataan ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.';
    isi.append(p1, ul, p2, buatTandaTangan(
        { peran: 'Mengetahui, Penanggung Jawab Klaim', nama: '( ................................. )' },
        { peran: 'Pimpinan Fasyankes', nama: '( ................................. )', materai: true },
    ));
    bukaLembarCetak('SPTJM Klaim JKN', isi);
}

/** Cetak Surat Pernyataan Pelayanan (SPP) sesuai format standar FKTP BPJS Kesehatan. */
export function cetakSppJkn(b) {
    const isi = document.createElement('div');
    isi.append(buatJudulDokumen('SURAT PERNYATAAN PELAYANAN (SPP) DI FKTP', `No. Layanan: ${b.id_layanan || `#${b.id}`}`));

    const tabelInfo = buatTabelData(
        ['Keterangan', 'Data Peserta & Pelayanan'],
        [
            ['Nomor Rekam Medis', b.pasien_nomor_rm],
            ['Nomor Kartu JKN / BPJS', b.jkn_nomor_kartu || '-'],
            ['NIK', b.pasien_nik || '-'],
            ['Nama Lengkap', b.pasien_nama],
            ['Tanggal Pelayanan', formatWaktu(b.waktu_tutup ?? b.mulai)],
            ['Jenis Pelayanan', b.jenis === 'IMP' ? 'RITP (Rawat Inap Tingkat Pertama)' : 'RJTP (Rawat Jalan Tingkat Pertama)'],
            ['Poli / Unit', b.poli_nama || '-'],
            ['Dokter / DPJP', b.dpjp_nama || '-'],
            ['No. Kunjungan PCare', b.pcare_no_kunjungan || '-'],
        ],
    );

    const pernyataan = document.createElement('p');
    pernyataan.style.marginTop = '14px';
    pernyataan.textContent = 'Pasien / Keluarga menyatakan bahwa benar pasien telah mendapatkan pelayanan kesehatan di FKTP tanpa dikenakan iur biaya, serta memberikan persetujuan kepada BPJS Kesehatan untuk menggunakan informasi medis yang tertera pada status kesehatan pasien sebagai kelengkapan pengajuan klaim Program Jaminan Kesehatan Nasional (JKN).';

    isi.append(tabelInfo, pernyataan, buatTandaTangan(
        { peran: 'Pasien / Keluarga / Penanggung Jawab', nama: `(${b.pasien_nama})` },
        {
            peran: 'Mengetahui, Dokter / Petugas FKTP',
            nama: `(${b.dpjp_nama || '.................................'})`,
            qrTeks: `SPP FKTP Klira\nPetugas/DPJP: ${b.dpjp_nama || '-'}\nPasien: ${b.pasien_nama} (${b.pasien_nomor_rm})\nPCare: ${b.pcare_no_kunjungan || '-'}`,
        },
    ));
    bukaLembarCetak(`SPP - ${b.pasien_nama}`, isi);
}

/** Cetak Kuitansi Klaim Kolektif Non-Kapitasi untuk diajukan ke BPJS Kesehatan. */
export function cetakKuitansiKlaim({ baris, tanggal }) {
    const jkn = baris.filter((b) => b.cara_pembayaran === 'jkn');
    const isi = document.createElement('div');
    isi.append(buatJudulDokumen('KUITANSI KLAIM PELAYANAN NON-KAPITASI JKN', `Periode: ${tanggal || 'Sesuai Rekapitulasi Terlampir'}`));

    isi.append(buatTabelData(
        ['Keterangan', 'Rincian'],
        [
            ['Nomor Kuitansi', '........ / KWT-JKN / ........ / 2026'],
            ['Sudah Terima Dari', 'BPJS Kesehatan'],
            ['Jumlah Kunjungan / Kasus', `${jkn.length} kunjungan JKN (${jkn.filter((b) => b.jenis === 'IMP').length} Rawat Inap, ${jkn.filter((b) => b.jenis !== 'IMP').length} Rawat Jalan)`],
            ['Untuk Pembayaran', 'Pengajuan Klaim Pelayanan Kesehatan Non-Kapitasi FKTP sesuai FPK & Rekapitulasi terlampir'],
            ['Jumlah (Rp)', 'Rp ................................................ (sesuai FPK PCare)'],
            ['Terbilang', '....................................................................................'],
        ],
    ));

    isi.append(buatTandaTangan(
        { peran: 'Bendahara / Petugas Klaim', nama: '( ................................. )' },
        { peran: 'Pimpinan Fasyankes', nama: '( ................................. )', materai: true },
    ));
    bukaLembarCetak('Kuitansi Klaim JKN', isi);
}
