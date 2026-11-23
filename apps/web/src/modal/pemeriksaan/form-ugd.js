import { ambilUgd, simpanUgd } from '../../api-klien/klinis.js';
import { bukaModal1 } from '../../komponen/modal-1/modal-1.js';
import { bidang, peringatan, tombol } from '../../komponen/ui/primitif.js';
import { token } from '../../gaya/token.js';

export const TRIASE_UGD = [
    { kode: 'merah', label: 'Merah — Resusitasi / Gawat Darurat', zona: 'Ruang Resusitasi', warna: '#b91c1c', latar: '#fee2e2' },
    { kode: 'kuning', label: 'Kuning — Urgent / Darurat', zona: 'Zona Kuning', warna: '#b45309', latar: '#fef3c7' },
    { kode: 'hijau', label: 'Hijau — Non-Urgent', zona: 'Zona Hijau', warna: '#15803d', latar: '#dcfce7' },
    { kode: 'hitam', label: 'Hitam — Meninggal / DOA', zona: 'Kamar Jenazah', warna: '#334155', latar: '#e2e8f0' },
];

const PETA_TRIASE = Object.fromEntries(TRIASE_UGD.map((t) => [t.kode, t]));
const CARA_DATANG = ['', 'Jalan sendiri', 'Kursi roda', 'Brankar', 'Ambulans', 'Polisi', 'Rujukan'];
const JENIS_KASUS = ['', 'Non-Trauma', 'Trauma / Kecelakaan', 'Obstetri', 'Psikiatri'];
const AIRWAY = ['', 'Bebas', 'Sumbatan parsial', 'Sumbatan total'];
const BREATHING = ['', 'Spontan adekuat', 'Sesak / Takipnea', 'Bradipnea / Henti napas'];
const CIRCULATION = ['', 'Nadi kuat (CRT < 2 dtk)', 'Nadi lemah / Takikardi', 'Perdarahan aktif / Syok', 'Henti jantung'];
const DISABILITY = ['', 'Alert', 'Verbal', 'Pain', 'Unresponsive'];

const STATE_KOSONG = {
    triase: 'hijau',
    zona: 'Zona Hijau',
    cara_datang: '',
    jenis_kasus: '',
    airway: '',
    breathing: '',
    circulation: '',
    disability: '',
    temuan_trauma: '',
    catatan: '',
};

/** Susun blok teks ringkas triase & survei primer UGD untuk kolom Objek pemeriksaan. */
export function susunRingkasanUgd(d = {}) {
    const bagian = [];
    if (d.zona) bagian.push(d.zona);
    if (d.cara_datang) bagian.push(d.cara_datang);
    if (d.jenis_kasus) bagian.push(d.jenis_kasus);
    if (d.airway) bagian.push(`Airway ${d.airway}`);
    if (d.breathing) bagian.push(`Breathing ${d.breathing}`);
    if (d.circulation) bagian.push(`Circulation ${d.circulation}`);
    if (d.disability) bagian.push(`Disability ${d.disability}`);
    if (d.jenis_kasus === 'Trauma / Kecelakaan' && d.temuan_trauma?.trim()) {
        bagian.push(`Trauma: ${d.temuan_trauma.trim()}`);
    }
    if (d.catatan?.trim()) bagian.push(d.catatan.trim());
    const kode = (d.triase || 'hijau').toUpperCase();
    return bagian.length ? `[UGD - TRIASE ${kode}] ${bagian.join(' · ')}` : `[UGD - TRIASE ${kode}]`;
}

/** Ganti atau sisipkan baris `[UGD - ...]` di teks Objek tanpa menghapus catatan pemeriksaan lain. */
export function sisipkanBlokUgd(objekSekarang, blokUgd) {
    const teks = (objekSekarang ?? '').trim();
    const tanpaUgd = teks
        .split('\n')
        .filter((baris) => !/^\[UGD - TRIASE (MERAH|KUNING|HIJAU|HITAM)\]/.test(baris.trim()))
        .join('\n')
        .trim();
    if (!blokUgd) return tanpaUgd;
    return tanpaUgd ? `${blokUgd}\n${tanpaUgd}` : blokUgd;
}

/** Buka modal Input Triase & Survei Primer UGD, simpan ke DB, lalu terapkan ringkasannya ke kolom Objek. */
export function bukaModalUgd({ kunjunganId, onTerapkan }) {
    let state = { ...STATE_KOSONG };
    let zonaManual = false;
    let memuat = Boolean(kunjunganId);
    let menyimpan = false;
    let pesanGalat = '';

    const modal = bukaModal1({
        judul: 'Input Triase & Survei Primer UGD',
        lebar: 'modalSedang',
        onTutup: () => modal.tutup(),
    });

    const wadahStatus = document.createElement('div');
    const barTriase = document.createElement('div');
    Object.assign(barTriase.style, { display: 'flex', gap: token.jarak.xs, flexWrap: 'wrap' });

    const isiGrid = document.createElement('div');
    Object.assign(isiGrid.style, { display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: token.jarak.sm });

    const wadahKondisional = document.createElement('div');
    Object.assign(wadahKondisional.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.sm });

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
        const blok = susunRingkasanUgd(state);
        if (!kunjunganId) {
            onTerapkan(blok);
            modal.tutup();
            return;
        }
        menyimpan = true;
        pesanGalat = '';
        perbaruiAksi();
        try {
            const { triase, ...data } = state;
            await simpanUgd(kunjunganId, { triase, data });
            onTerapkan(blok);
            modal.tutup();
        } catch (e) {
            pesanGalat = e?.message || 'Gagal menyimpan catatan triase UGD.';
            menyimpan = false;
            perbaruiAksi();
        }
    });

    function perbaruiAksi() {
        wadahStatus.replaceChildren();
        if (memuat) wadahStatus.append(peringatan('Memuat catatan triase UGD...', 'biru'));
        else if (pesanGalat) wadahStatus.append(peringatan(pesanGalat));
        pratinjau.textContent = susunRingkasanUgd(state);
        btnSimpan.disabled = memuat || menyimpan;
        btnSimpan.textContent = menyimpan ? 'Menyimpan...' : 'Simpan & Masukkan ke Objek';
    }

    function lukisTriase() {
        barTriase.replaceChildren();
        for (const t of TRIASE_UGD) {
            const aktif = state.triase === t.kode;
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = t.label;
            btn.setAttribute('aria-pressed', String(aktif));
            Object.assign(btn.style, {
                padding: '6px 10px',
                borderRadius: token.radius.sedang,
                border: aktif ? `2px solid ${t.warna}` : `1px solid ${token.warna.garis}`,
                background: aktif ? t.latar : token.warna.permukaan,
                color: aktif ? t.warna : token.warna.teks,
                fontWeight: aktif ? '700' : '500',
                fontSize: token.huruf.ukuran.dasar,
                cursor: 'pointer',
            });
            btn.addEventListener('click', () => {
                state = {
                    ...state,
                    triase: t.kode,
                    ...(zonaManual ? {} : { zona: t.zona }),
                };
                lukisTriase();
                lukisGrid();
                perbaruiAksi();
            });
            barTriase.append(btn);
        }
    }

    function buatPilih(kunci, label, opsi, lebar) {
        const f = bidang({
            id: `ugd-${kunci}`,
            label,
            nilai: state[kunci],
            opsi: opsi.map((x) => ({ nilai: x, label: x || '— Pilih —' })),
            ubah(v) {
                state = { ...state, [kunci]: v };
                if (kunci === 'jenis_kasus') lukisKondisional();
                perbaruiAksi();
            },
        });
        Object.assign(f.el.style, { flex: `0 1 ${lebar}`, minWidth: lebar });
        return f.el;
    }

    function lukisGrid() {
        isiGrid.replaceChildren();
        const zona = bidang({
            id: 'ugd-zona',
            label: 'Zona / Penempatan',
            nilai: state.zona,
            maxLength: 50,
            autoComplete: 'off',
            ubah(v) {
                zonaManual = Boolean(v.trim());
                state = { ...state, zona: v };
                perbaruiAksi();
            },
        });
        Object.assign(zona.el.style, { flex: '0 1 175px', minWidth: '160px' });

        isiGrid.append(
            zona.el,
            buatPilih('cara_datang', 'Cara Datang', CARA_DATANG, '150px'),
            buatPilih('jenis_kasus', 'Jenis Kasus', JENIS_KASUS, '175px'),
            buatPilih('airway', 'Airway', AIRWAY, '155px'),
            buatPilih('breathing', 'Breathing', BREATHING, '180px'),
            buatPilih('circulation', 'Circulation', CIRCULATION, '190px'),
            buatPilih('disability', 'Disability (AVPU)', DISABILITY, '145px'),
        );
    }

    function lukisKondisional() {
        wadahKondisional.replaceChildren();
        if (state.jenis_kasus === 'Trauma / Kecelakaan') {
            const trauma = bidang({
                id: 'ugd-trauma',
                label: 'Temuan Trauma / Lokalis',
                nilai: state.temuan_trauma,
                maxLength: 250,
                autoComplete: 'off',
                ubah(v) {
                    state = { ...state, temuan_trauma: v };
                    perbaruiAksi();
                },
            });
            trauma.kontrol.placeholder = 'mis. Vulnus laceratum kruris kanan, deformitas (-)';
            wadahKondisional.append(trauma.el);
        }
        const catatan = bidang({
            id: 'ugd-catatan',
            label: 'Catatan Tambahan Triase',
            nilai: state.catatan,
            maxLength: 250,
            autoComplete: 'off',
            ubah(v) {
                state = { ...state, catatan: v };
                perbaruiAksi();
            },
        });
        catatan.kontrol.placeholder = 'mis. Pasien alergi lateks, didampingi keluarga';
        wadahKondisional.append(catatan.el);
    }

    lukisTriase();
    lukisGrid();
    lukisKondisional();
    perbaruiAksi();

    modal.isi.append(wadahStatus, barTriase, isiGrid, wadahKondisional, pratinjau);
    modal.aksi.append(btnBatal, btnSimpan);
    modal.fokus();

    if (kunjunganId) {
        ambilUgd(kunjunganId)
            .then((res) => {
                const u = res?.data;
                if (u) {
                    const triase = u.triase || 'hijau';
                    state = {
                        ...STATE_KOSONG,
                        triase,
                        zona: u.data?.zona || PETA_TRIASE[triase]?.zona || 'Zona Hijau',
                        ...(u.data ?? {}),
                    };
                    zonaManual = Boolean(u.data?.zona && u.data.zona !== PETA_TRIASE[triase]?.zona);
                }
                memuat = false;
                lukisTriase();
                lukisGrid();
                lukisKondisional();
                perbaruiAksi();
            })
            .catch((e) => {
                memuat = false;
                pesanGalat = e?.message || 'Gagal memuat catatan triase UGD.';
                perbaruiAksi();
            });
    }

    return modal;
}
