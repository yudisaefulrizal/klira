import { ambilOdontogram, simpanOdontogram } from '../../api-klien/klinis.js';
import { bukaModal1 } from '../../komponen/modal-1/modal-1.js';
import { bidang, peringatan, tombol } from '../../komponen/ui/primitif.js';
import { token } from '../../gaya/token.js';
import { barisFleks } from '../../gaya/tata-letak.js';

export const KONDISI_GIGI = [
    { kode: 'sou', label: 'Normal / Sehat', singkat: '' },
    { kode: 'car', label: 'Karies (car)', singkat: 'car', warna: '#b91c1c', latar: '#fee2e2' },
    { kode: 'cof', label: 'Tambalan Komposit/GIC (cof)', singkat: 'cof', warna: '#1d4ed8', latar: '#dbeafe' },
    { kode: 'amf', label: 'Tambalan Amalgam (amf)', singkat: 'amf', warna: '#334155', latar: '#e2e8f0' },
    { kode: 'rrx', label: 'Sisa Akar (rrx)', singkat: 'rrx', warna: '#9a3412', latar: '#ffedd5' },
    { kode: 'mis', label: 'Hilang / Missing (mis)', singkat: 'mis', warna: '#475569', latar: '#f1f5f9' },
    { kode: 'non', label: 'Belum Erupsi (non)', singkat: 'non', warna: '#6b21a8', latar: '#f3e8ff' },
    { kode: 'imx', label: 'Impaksi (imx)', singkat: 'imx', warna: '#9333ea', latar: '#faf5ff' },
    { kode: 'poc', label: 'Mahkota / Crown (poc)', singkat: 'poc', warna: '#0f766e', latar: '#ccfbf1' },
    { kode: 'prd', label: 'Gigi Tiruan (prd)', singkat: 'prd', warna: '#0369a1', latar: '#e0f2fe' },
    { kode: 'goyang', label: 'Goyang', singkat: 'gyg', warna: '#b45309', latar: '#fef3c7' },
];

const PETA_KONDISI = Object.fromEntries(KONDISI_GIGI.map((k) => [k.kode, k]));

export const KUADRAN_PERMANEN = {
    atasKanan: ['18', '17', '16', '15', '14', '13', '12', '11'],
    atasKiri: ['21', '22', '23', '24', '25', '26', '27', '28'],
    bawahKanan: ['48', '47', '46', '45', '44', '43', '42', '41'],
    bawahKiri: ['31', '32', '33', '34', '35', '36', '37', '38'],
};

export const KUADRAN_SULUNG = {
    atasKanan: ['55', '54', '53', '52', '51'],
    atasKiri: ['61', '62', '63', '64', '65'],
    bawahKanan: ['85', '84', '83', '82', '81'],
    bawahKiri: ['71', '72', '73', '74', '75'],
};

const BIDANG_INTRAORAL = [
    { kunci: 'oklusi', label: 'Oklusi', opsi: ['', 'Normal', 'Crossbite', 'Openbite', 'Steep bite'] },
    { kunci: 'torus_palatinus', label: 'Torus Palatinus', opsi: ['', 'Tidak ada', 'Kecil', 'Sedang', 'Besar', 'Multiple'] },
    { kunci: 'torus_mandibularis', label: 'Torus Mandibularis', opsi: ['', 'Tidak ada', 'Sisi kiri', 'Sisi kanan', 'Kedua sisi'] },
    { kunci: 'palatum', label: 'Palatum', opsi: ['', 'Dalam', 'Sedang', 'Rendah'] },
    { kunci: 'diastema', label: 'Diastema', opsi: ['', 'Tidak ada', 'Ada'] },
    { kunci: 'anomali', label: 'Gigi Anomali', opsi: ['', 'Tidak ada', 'Ada'] },
    { kunci: 'gingiva', label: 'Gingiva', opsi: ['', 'Normal', 'Hiperemis', 'Berdarah', 'Resesi'] },
    { kunci: 'kalkulus', label: 'Kalkulus', opsi: ['', 'Tidak ada', 'Sedikit', 'Sedang', 'Banyak'] },
];

const LABEL_INTRAORAL = Object.fromEntries(BIDANG_INTRAORAL.map((b) => [b.kunci, b.label]));

/** Susun blok teks ringkas odontogram + intraoral untuk kolom Objek pemeriksaan. */
export function susunRingkasanGigi({ gigi = {}, intraoral = {} } = {}) {
    const daftarGigi = Object.entries(gigi)
        .filter(([, item]) => item?.kondisi && item.kondisi !== 'sou')
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([nomor, item]) => {
            const info = PETA_KONDISI[item.kondisi];
            const nama = info ? info.label.replace(/\s*\([^)]*\)$/, '') : item.kondisi;
            const cat = item.catatan?.trim();
            return cat ? `${nomor}: ${nama} (${cat})` : `${nomor}: ${nama}`;
        });

    const daftarIntraoral = Object.entries(intraoral)
        .filter(([, nilai]) => Boolean(nilai))
        .map(([kunci, nilai]) => `${LABEL_INTRAORAL[kunci] ?? kunci} ${nilai}`);

    const bagian = [];
    if (daftarGigi.length) bagian.push(daftarGigi.join('; '));
    if (daftarIntraoral.length) bagian.push(daftarIntraoral.join(' · '));
    return bagian.length ? `[GIGI] ${bagian.join(' · ')}` : '';
}

/** Ganti atau sisipkan baris `[GIGI]` di teks Objek tanpa menghapus catatan pemeriksaan lain. */
export function sisipkanBlokGigi(objekSekarang, blokGigi) {
    const teks = (objekSekarang ?? '').trim();
    const tanpaGigi = teks
        .split('\n')
        .filter((baris) => !/^\[GIGI\]/.test(baris.trim()))
        .join('\n')
        .trim();
    if (!blokGigi) return tanpaGigi;
    return tanpaGigi ? `${blokGigi}\n${tanpaGigi}` : blokGigi;
}

/** Buka modal Odontogram kumulatif pasien (FDI + Intraoral Kemenkes), simpan ke DB, lalu masukkan ringkasan ke Objek. */
export function bukaModalGigi({ pasienId, kunjunganId, onTerapkan }) {
    let gigi = {};
    let intraoral = {};
    let aktifGigi = '16';
    let tampilSulung = false;
    let memuat = true;
    let menyimpan = false;
    let pesanGalat = '';

    const modal = bukaModal1({
        judul: 'Input Odontogram & Pemeriksaan Gigi',
        lebar: 'modalBesar',
        onTutup: () => modal.tutup(),
    });

    const wadahStatus = document.createElement('div');
    const barMode = document.createElement('div');
    barisFleks(barMode, 'sm', { rata: 'center', bungkus: true, sebar: true });
    const judulPeta = document.createElement('strong');
    judulPeta.textContent = 'Peta Gigi (FDI)';
    const btnSulung = tombol('Tampilkan Gigi Sulung', () => {
        tampilSulung = !tampilSulung;
        btnSulung.textContent = tampilSulung ? 'Sembunyikan Gigi Sulung' : 'Tampilkan Gigi Sulung';
        lukisPeta();
    }, 'sekunder');
    barMode.append(judulPeta, btnSulung);

    const wadahPeta = document.createElement('div');
    Object.assign(wadahPeta.style, {
        display: 'flex',
        flexDirection: 'column',
        gap: token.jarak.xs,
        padding: token.jarak.sm,
        border: `1px solid ${token.warna.garis}`,
        borderRadius: token.radius.sedang,
        background: token.warna.kepalaTabel,
    });

    const editorGigi = document.createElement('div');
    Object.assign(editorGigi.style, {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-end',
        gap: token.jarak.sm,
        padding: token.jarak.sm,
        border: `1px solid ${token.warna.garis}`,
        borderRadius: token.radius.sedang,
    });

    const judulIntraoral = document.createElement('strong');
    judulIntraoral.textContent = 'Pemeriksaan Intraoral';
    const gridIntraoral = document.createElement('div');
    barisFleks(gridIntraoral, 'sm', { rata: 'flex-end', bungkus: true });

    const pratinjau = document.createElement('small');
    Object.assign(pratinjau.style, {
        color: token.warna.teksRedup,
        padding: token.jarak.sm,
        borderRadius: token.radius.sedang,
        background: token.warna.kepalaTabel,
    });

    const btnBatal = tombol('Batal', () => modal.tutup(), 'sekunder');
    const btnSimpan = tombol('Simpan & Masukkan ke Objek', async () => {
        if (menyimpan || memuat) return;
        menyimpan = true;
        pesanGalat = '';
        perbaruiAksi();
        try {
            await simpanOdontogram(pasienId, { kunjungan_id: kunjunganId ?? null, gigi, intraoral });
            const blok = susunRingkasanGigi({ gigi, intraoral });
            onTerapkan(blok);
            modal.tutup();
        } catch (e) {
            pesanGalat = e?.message || 'Gagal menyimpan odontogram.';
            menyimpan = false;
            perbaruiAksi();
        }
    });

    function perbaruiAksi() {
        wadahStatus.replaceChildren();
        if (memuat) wadahStatus.append(peringatan('Memuat odontogram terakhir pasien...', 'biru'));
        else if (pesanGalat) wadahStatus.append(peringatan(pesanGalat));
        const blok = susunRingkasanGigi({ gigi, intraoral });
        pratinjau.textContent = blok || 'Klik nomor gigi di peta atau pilih temuan intraoral.';
        btnSimpan.disabled = memuat || menyimpan;
        btnSimpan.textContent = menyimpan ? 'Menyimpan...' : 'Simpan & Masukkan ke Objek';
    }

    function buatBarisKuadran(kiri, kanan) {
        const barisEl = document.createElement('div');
        Object.assign(barisEl.style, { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: token.jarak.xs, flexWrap: 'wrap' });

        const renderSisi = (daftar) => {
            const grup = document.createElement('div');
            Object.assign(grup.style, { display: 'flex', gap: '4px', flexWrap: 'wrap' });
            for (const no of daftar) {
                const entri = gigi[no];
                const info = entri?.kondisi ? PETA_KONDISI[entri.kondisi] : null;
                const dipilih = aktifGigi === no;
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.setAttribute('aria-label', `Gigi ${no}${info?.singkat ? ` (${info.singkat})` : ''}`);
                Object.assign(btn.style, {
                    minWidth: '38px',
                    height: '40px',
                    padding: '2px 4px',
                    borderRadius: token.radius.sedang,
                    border: dipilih ? `2px solid ${token.warna.teks}` : `1px solid ${token.warna.garis}`,
                    background: info?.latar || token.warna.permukaan,
                    color: info?.warna || token.warna.teks,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: dipilih || info ? '700' : '500',
                    lineHeight: '1.1',
                });
                const lbl = document.createElement('span');
                lbl.textContent = no;
                const badge = document.createElement('small');
                badge.textContent = info?.singkat || '·';
                badge.style.fontSize = '10px';
                btn.append(lbl, badge);
                btn.addEventListener('click', () => {
                    aktifGigi = no;
                    lukisPeta();
                    lukisEditorGigi();
                });
                grup.append(btn);
            }
            return grup;
        };

        const pemisah = document.createElement('span');
        pemisah.textContent = '|';
        pemisah.style.color = token.warna.teksRedup;
        barisEl.append(renderSisi(kiri), pemisah, renderSisi(kanan));
        return barisEl;
    }

    function lukisPeta() {
        wadahPeta.replaceChildren(
            buatBarisKuadran(KUADRAN_PERMANEN.atasKanan, KUADRAN_PERMANEN.atasKiri),
            buatBarisKuadran(KUADRAN_PERMANEN.bawahKanan, KUADRAN_PERMANEN.bawahKiri),
        );
        if (tampilSulung) {
            const pemisah = document.createElement('hr');
            Object.assign(pemisah.style, { border: 'none', borderTop: `1px dashed ${token.warna.garis}`, margin: '4px 0' });
            wadahPeta.append(
                pemisah,
                buatBarisKuadran(KUADRAN_SULUNG.atasKanan, KUADRAN_SULUNG.atasKiri),
                buatBarisKuadran(KUADRAN_SULUNG.bawahKanan, KUADRAN_SULUNG.bawahKiri),
            );
        }
    }

    function lukisEditorGigi() {
        editorGigi.replaceChildren();
        const saatIni = gigi[aktifGigi] ?? { kondisi: 'sou', catatan: '' };

        const pilihKondisi = bidang({
            id: 'gigi-kondisi',
            label: `Gigi ${aktifGigi} — Kondisi`,
            nilai: saatIni.kondisi,
            opsi: KONDISI_GIGI.map((k) => ({ nilai: k.kode, label: k.label })),
            ubah(v) {
                if (v === 'sou') {
                    const salinan = { ...gigi };
                    delete salinan[aktifGigi];
                    gigi = salinan;
                } else {
                    gigi = { ...gigi, [aktifGigi]: { kondisi: v, catatan: saatIni.catatan ?? '' } };
                }
                lukisPeta();
                lukisEditorGigi();
                perbaruiAksi();
            },
        });
        Object.assign(pilihKondisi.el.style, { flex: '1 1 210px', maxWidth: '280px' });

        const catatan = bidang({
            id: 'gigi-catatan',
            label: 'Permukaan / Catatan',
            nilai: saatIni.catatan ?? '',
            maxLength: 100,
            autoComplete: 'off',
            ubah(v) {
                const kondisi = gigi[aktifGigi]?.kondisi ?? 'sou';
                if (kondisi === 'sou') return;
                gigi = { ...gigi, [aktifGigi]: { kondisi, catatan: v } };
                perbaruiAksi();
            },
        });
        catatan.kontrol.placeholder = 'mis. MO, ngilu';
        catatan.kontrol.disabled = !gigi[aktifGigi];
        Object.assign(catatan.el.style, { flex: '1 1 180px', maxWidth: '260px' });

        editorGigi.append(pilihKondisi.el, catatan.el);
    }

    function lukisIntraoral() {
        gridIntraoral.replaceChildren();
        for (const b of BIDANG_INTRAORAL) {
            const f = bidang({
                id: `intraoral-${b.kunci}`,
                label: b.label,
                nilai: intraoral[b.kunci] ?? '',
                opsi: b.opsi.map((o) => ({ nilai: o, label: o || '— Pilih —' })),
                ubah(v) {
                    intraoral = { ...intraoral, [b.kunci]: v };
                    perbaruiAksi();
                },
            });
            Object.assign(f.el.style, { flex: '0 1 150px', minWidth: '140px' });
            gridIntraoral.append(f.el);
        }
    }

    lukisPeta();
    lukisEditorGigi();
    lukisIntraoral();
    perbaruiAksi();

    modal.isi.append(wadahStatus, barMode, wadahPeta, editorGigi, judulIntraoral, gridIntraoral, pratinjau);
    modal.aksi.append(btnBatal, btnSimpan);
    modal.fokus();

    ambilOdontogram(pasienId)
        .then((res) => {
            gigi = res?.data?.gigi ?? {};
            intraoral = res?.data?.intraoral ?? {};
            memuat = false;
            lukisPeta();
            lukisEditorGigi();
            lukisIntraoral();
            perbaruiAksi();
        })
        .catch((e) => {
            memuat = false;
            pesanGalat = e?.message || 'Gagal memuat odontogram pasien.';
            perbaruiAksi();
        });

    return modal;
}
