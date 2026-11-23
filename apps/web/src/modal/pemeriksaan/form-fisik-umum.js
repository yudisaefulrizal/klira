import { bukaModal1 } from '../../komponen/modal-1/modal-1.js';
import { bidang, tombol } from '../../komponen/ui/primitif.js';
import { token } from '../../gaya/token.js';

export const OPSI_KEADAAN_UMUM = ['Sehat', 'Sakit Ringan', 'Sakit Sedang', 'Sakit Berat'];
export const OPSI_STATUS_FISIK = ['Normal', 'Abnormal', 'Tidak Diperiksa'];

export const BAGIAN_FISIK_KHANZA = [
    { kunci: 'kepala', label: 'Kepala', awal: 'Normal', contoh: 'Mis. normosefal, nyeri tekan (-)' },
    { kunci: 'mata', label: 'Mata', awal: 'Normal', contoh: 'Mis. CA +/+, SI -/-' },
    { kunci: 'tht', label: 'Gigi, Mulut & THT', awal: 'Normal', contoh: 'Mis. faring hiperemis, tonsil T2/T2' },
    { kunci: 'leher', label: 'Leher', awal: 'Normal', contoh: 'Mis. pembesaran KGB servikal' },
    { kunci: 'thoraks', label: 'Thoraks (Paru & Jantung)', awal: 'Normal', contoh: 'Mis. ronki +/+, wheezing -/-' },
    { kunci: 'abdomen', label: 'Abdomen', awal: 'Normal', contoh: 'Mis. nyeri tekan epigastrium' },
    { kunci: 'genital', label: 'Genital & Anus', awal: 'Tidak Diperiksa', contoh: 'Temuan bila diperiksa' },
    { kunci: 'ekstremitas', label: 'Ekstremitas', awal: 'Normal', contoh: 'Mis. edema pretibial +/+' },
    { kunci: 'kulit', label: 'Kulit', awal: 'Normal', contoh: 'Mis. ruam makulopapular' },
];

export function stateFisikDefault() {
    const bagian = {};
    for (const b of BAGIAN_FISIK_KHANZA) {
        bagian[b.kunci] = { status: b.awal, ket: '' };
    }
    return { ku: 'Sehat', bagian, lokalis: '' };
}

/** Susun blok teks `[PF] ...` urut head-to-toe untuk disisipkan ke kolom Objek pemeriksaan. */
export function susunRingkasanFisik(state = stateFisikDefault()) {
    const hasil = [`KU ${state.ku || 'Sehat'}`];
    for (const b of BAGIAN_FISIK_KHANZA) {
        const item = state.bagian?.[b.kunci] ?? { status: b.awal, ket: '' };
        if (item.status === 'Tidak Diperiksa') continue;
        const ket = item.ket?.trim();
        hasil.push(ket ? `${b.label}: ${item.status} (${ket})` : `${b.label}: ${item.status}`);
    }
    if (state.lokalis?.trim()) hasil.push(`Status Lokalis: ${state.lokalis.trim()}`);
    return `[PF] ${hasil.join(' · ')}`;
}

/** Ganti atau sisipkan baris `[PF] ...` pada teks Objek tanpa menghapus catatan dokter lainnya. */
export function sisipkanBlokFisik(objekSekarang, blokPf) {
    const teks = (objekSekarang ?? '').trim();
    const tanpaPf = teks
        .split('\n')
        .filter((baris) => !/^\[PF\]\s*/.test(baris.trim()))
        .join('\n')
        .trim();
    if (!blokPf) return tanpaPf;
    return tanpaPf ? `${blokPf}\n${tanpaPf}` : blokPf;
}

/** Modal Pemeriksaan Fisik terstruktur (head-to-toe, default Normal). */
export function bukaModalFisikUmum({ onTerapkan }) {
    let state = stateFisikDefault();
    const modal = bukaModal1({
        judul: 'Pemeriksaan Fisik (Head-to-Toe)',
        lebar: 'modalSedang',
        onTutup: () => modal.tutup(),
    });

    const info = document.createElement('small');
    info.textContent = 'Urutan head-to-toe standar (default Normal). Ubah ke Abnormal bila ada kelainan lalu isi keterangan singkatnya.';
    info.style.color = token.warna.teksRedup;

    const wadah = document.createElement('div');
    Object.assign(wadah.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.xs });

    const pratinjau = document.createElement('small');
    Object.assign(pratinjau.style, {
        color: token.warna.teksRedup,
        background: token.warna.kepalaTabel,
        padding: token.jarak.sm,
        borderRadius: token.radius.sedang,
        border: `${token.ukuran.garis} solid ${token.warna.garisHalus}`,
        lineHeight: '1.5',
    });

    const perbaruiPratinjau = () => {
        pratinjau.textContent = susunRingkasanFisik(state);
    };

    const buatInputKet = (b, item) => {
        const i = document.createElement('input');
        i.type = 'text';
        i.value = item.ket;
        i.placeholder = b.contoh;
        Object.assign(i.style, {
            height: token.ukuran.isian,
            padding: `0 ${token.jarak.sm}`,
            border: `${token.ukuran.garis} solid ${token.warna.garis}`,
            borderRadius: token.radius.sedang,
            background: token.warna.permukaan,
            color: token.warna.teks,
            fontFamily: token.huruf.keluarga,
            fontSize: token.huruf.ukuran.dasar,
            width: '100%',
            boxSizing: 'border-box',
        });
        i.addEventListener('input', (e) => {
            state.bagian[b.kunci] = { ...state.bagian[b.kunci], ket: e.target.value };
            perbaruiPratinjau();
        });
        return i;
    };

    const lukisIsi = () => {
        wadah.replaceChildren();
        const fKu = bidang({
            id: 'pf-ku',
            label: 'Keadaan Umum',
            nilai: state.ku,
            opsi: OPSI_KEADAAN_UMUM.map((o) => ({ nilai: o, label: o })),
            ubah: (v) => { state.ku = v; perbaruiPratinjau(); },
        });
        wadah.append(fKu.el);

        for (const b of BAGIAN_FISIK_KHANZA) {
            const item = state.bagian[b.kunci];
            const baris = document.createElement('div');
            Object.assign(baris.style, {
                display: 'grid',
                gridTemplateColumns: '170px 150px minmax(0, 1fr)',
                gap: token.jarak.sm,
                alignItems: 'center',
            });
            const lbl = document.createElement('label');
            lbl.htmlFor = `pf-${b.kunci}`;
            lbl.textContent = b.label;
            Object.assign(lbl.style, { fontSize: token.huruf.ukuran.dasar, fontWeight: token.huruf.berat.sedang });

            const sel = document.createElement('select');
            sel.id = `pf-${b.kunci}`;
            for (const o of OPSI_STATUS_FISIK) {
                const opt = document.createElement('option');
                opt.value = o;
                opt.textContent = o;
                sel.append(opt);
            }
            sel.value = item.status;
            Object.assign(sel.style, {
                height: token.ukuran.isian,
                padding: `0 ${token.jarak.sm}`,
                border: `${token.ukuran.garis} solid ${token.warna.garis}`,
                borderRadius: token.radius.sedang,
                background: token.warna.permukaan,
                color: token.warna.teks,
                fontFamily: token.huruf.keluarga,
                fontSize: token.huruf.ukuran.dasar,
            });
            const ketInput = buatInputKet(b, item);
            sel.addEventListener('change', (e) => {
                state.bagian[b.kunci] = { ...state.bagian[b.kunci], status: e.target.value };
                sel.style.borderColor = e.target.value === 'Abnormal' ? token.warna.status.merah.teks : token.warna.garis;
                perbaruiPratinjau();
            });
            baris.append(lbl, sel, ketInput);
            wadah.append(baris);
        }

        const fLokalis = bidang({
            id: 'pf-lokalis',
            label: 'Status Lokalis (opsional)',
            nilai: state.lokalis,
            ubah: (v) => { state.lokalis = v; perbaruiPratinjau(); },
        });
        fLokalis.kontrol.placeholder = 'Mis. luka lecet 2 cm di lengan kiri';
        wadah.append(fLokalis.el);
        perbaruiPratinjau();
    };

    lukisIsi();
    modal.isi.append(info, wadah, pratinjau);
    modal.aksi.append(
        tombol('Set Semua Normal', () => { state = stateFisikDefault(); lukisIsi(); }, 'sekunder'),
        tombol('Batal', () => modal.tutup(), 'sekunder'),
        tombol('Terapkan ke Objek', () => {
            onTerapkan?.(susunRingkasanFisik(state));
            modal.tutup();
        }, 'utama'),
    );
    return modal;
}
