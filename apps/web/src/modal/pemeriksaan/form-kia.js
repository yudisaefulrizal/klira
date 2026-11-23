import { ambilKia, simpanKia } from '../../api-klien/klinis.js';
import { bidang, peringatan, tombol } from '../../komponen/ui/primitif.js';
import { bukaModal1 } from '../../komponen/modal-1/modal-1.js';
import { token } from '../../gaya/token.js';

export const LAYANAN_KIA = [
    { nilai: 'anc', label: 'ANC (Ibu Hamil)' },
    { nilai: 'kb', label: 'KB' },
    { nilai: 'anak', label: 'Anak / Imunisasi' },
];

const METODE_KB = ['', 'Suntik 1 bulan', 'Suntik 3 bulan', 'Pil KB', 'IUD', 'Implan', 'Kondom'];
const STATUS_KB = ['', 'Baru', 'Ulang', 'Ganti cara'];
const LETAK_JANIN = ['', 'Kepala', 'Sungsang', 'Lintang', 'Belum teraba'];
const STATUS_TT = ['', 'T0', 'T1', 'T2', 'T3', 'T4', 'T5'];

const STATE_KOSONG = {
    layanan: 'anc',
    g: '', p: '', a: '', hpht: '', tfu: '', djj: '', letak: '', lila: '', tt: '',
    metode_kb: '', status_kb: '', kontrol_kb: '',
    lk: '', vaksin: '', dosis_vaksin: '', jadwal_vaksin: '',
};

const adaNilai = (v) => v !== '' && v !== null && v !== undefined && String(v).trim() !== '';

/** Hitung HPL (Naegele +280 hari) dan usia kehamilan dari HPHT (`YYYY-MM-DD`). */
export function hitungHplDanUsia(hphtIso, acuan = new Date()) {
    if (!hphtIso || !/^\d{4}-\d{2}-\d{2}$/.test(hphtIso))
        return { hpl: null, usia: null };
    const tgl = new Date(`${hphtIso}T00:00:00Z`);
    if (Number.isNaN(tgl.getTime()))
        return { hpl: null, usia: null };
    const hplDate = new Date(tgl.getTime() + 280 * 86_400_000);
    const hpl = hplDate.toISOString().slice(0, 10);
    const hariAcuan = Date.UTC(acuan.getUTCFullYear(), acuan.getUTCMonth(), acuan.getUTCDate());
    const selisihHari = Math.floor((hariAcuan - tgl.getTime()) / 86_400_000);
    if (selisihHari < 0 || selisihHari > 310)
        return { hpl, usia: null };
    const minggu = Math.floor(selisihHari / 7);
    const hari = selisihHari % 7;
    return { hpl, usia: `${minggu} mgg ${hari} hr` };
}

/** Susun blok teks ringkas KIA untuk dimasukkan ke kolom Objek pemeriksaan. */
export function susunRingkasanKia(d, acuan = new Date()) {
    const bagian = [];
    if (d.layanan === 'anc') {
        const gpa = [adaNilai(d.g) && `G${d.g}`, adaNilai(d.p) && `P${d.p}`, adaNilai(d.a) && `A${d.a}`].filter(Boolean).join('');
        if (gpa) bagian.push(gpa);
        if (adaNilai(d.hpht)) {
            const { hpl, usia } = hitungHplDanUsia(d.hpht, acuan);
            bagian.push(`HPHT ${d.hpht}`);
            if (usia) bagian.push(`UK ${usia}`);
            if (hpl) bagian.push(`HPL ${hpl}`);
        }
        if (adaNilai(d.tfu)) bagian.push(`TFU ${d.tfu} cm`);
        if (adaNilai(d.djj)) bagian.push(`DJJ ${d.djj} x/mnt`);
        if (adaNilai(d.letak)) bagian.push(`Letak ${d.letak}`);
        if (adaNilai(d.lila)) bagian.push(`LILA ${d.lila} cm`);
        if (adaNilai(d.tt)) bagian.push(`Imunisasi ${d.tt}`);
        return bagian.length ? `[KIA - ANC] ${bagian.join(' · ')}` : '';
    }
    if (d.layanan === 'kb') {
        if (adaNilai(d.metode_kb)) bagian.push(`Metode ${d.metode_kb}`);
        if (adaNilai(d.status_kb)) bagian.push(`Status ${d.status_kb}`);
        if (adaNilai(d.kontrol_kb)) bagian.push(`Kontrol ${d.kontrol_kb}`);
        return bagian.length ? `[KIA - KB] ${bagian.join(' · ')}` : '';
    }
    if (adaNilai(d.lk)) bagian.push(`LK ${d.lk} cm`);
    if (adaNilai(d.vaksin)) bagian.push(`Imunisasi ${d.vaksin}`);
    if (adaNilai(d.dosis_vaksin)) bagian.push(String(d.dosis_vaksin).trim());
    if (adaNilai(d.jadwal_vaksin)) bagian.push(`Jadwal berikutnya ${d.jadwal_vaksin}`);
    return bagian.length ? `[KIA - Anak] ${bagian.join(' · ')}` : '';
}

/** Urai baris `[KIA - ...]` dari teks Objek agar form tetap terisi saat render ulang atau dibuka kembali. */
export function uraiBlokKia(objek) {
    const baris = (objek ?? '').split('\n').map((b) => b.trim()).find((b) => /^\[KIA - (ANC|KB|Anak)\]/.test(b));
    if (!baris) return { ...STATE_KOSONG };
    const hasil = { ...STATE_KOSONG };
    const isi = baris.replace(/^\[KIA - (ANC|KB|Anak)\]\s*/, '');
    const potongan = isi.split('·').map((p) => p.trim()).filter(Boolean);
    if (baris.startsWith('[KIA - ANC]')) {
        hasil.layanan = 'anc';
        for (const p of potongan) {
            const gpa = p.match(/^(?:G(\d+))?(?:P(\d+))?(?:A(\d+))?$/);
            if (gpa && (gpa[1] || gpa[2] || gpa[3])) {
                if (gpa[1]) hasil.g = gpa[1];
                if (gpa[2]) hasil.p = gpa[2];
                if (gpa[3]) hasil.a = gpa[3];
            } else if (p.startsWith('HPHT ')) hasil.hpht = p.slice(5).trim();
            else if (p.startsWith('TFU ')) hasil.tfu = p.slice(4).replace(/\s*cm$/, '').trim();
            else if (p.startsWith('DJJ ')) hasil.djj = p.slice(4).replace(/\s*x\/mnt$/, '').trim();
            else if (p.startsWith('Letak ')) hasil.letak = p.slice(6).trim();
            else if (p.startsWith('LILA ')) hasil.lila = p.slice(5).replace(/\s*cm$/, '').trim();
            else if (p.startsWith('Imunisasi ')) hasil.tt = p.slice(10).trim();
        }
    } else if (baris.startsWith('[KIA - KB]')) {
        hasil.layanan = 'kb';
        for (const p of potongan) {
            if (p.startsWith('Metode ')) hasil.metode_kb = p.slice(7).trim();
            else if (p.startsWith('Status ')) hasil.status_kb = p.slice(7).trim();
            else if (p.startsWith('Kontrol ')) hasil.kontrol_kb = p.slice(8).trim();
        }
    } else {
        hasil.layanan = 'anak';
        for (const p of potongan) {
            if (p.startsWith('LK ')) hasil.lk = p.slice(3).replace(/\s*cm$/, '').trim();
            else if (p.startsWith('Imunisasi ')) hasil.vaksin = p.slice(10).trim();
            else if (p.startsWith('Jadwal berikutnya ')) hasil.jadwal_vaksin = p.slice(18).trim();
            else if (!hasil.dosis_vaksin) hasil.dosis_vaksin = p;
        }
    }
    return hasil;
}

/** Ganti atau sisipkan baris `[KIA - ...]` di teks Objek tanpa menghapus catatan pemeriksaan lain. */
export function sisipkanBlokKia(objekSekarang, blokKia) {
    const teks = (objekSekarang ?? '').trim();
    const tanpaKia = teks
        .split('\n')
        .filter((baris) => !/^\[KIA - (ANC|KB|Anak)\]/.test(baris.trim()))
        .join('\n')
        .trim();
    if (!blokKia)
        return tanpaKia;
    return tanpaKia ? `${blokKia}\n${tanpaKia}` : blokKia;
}

/** Buka modal Input KIA (ANC, KB, Anak/Imunisasi), simpan terstruktur ke DB, lalu terapkan ringkasannya ke kolom Objek. */
export function bukaModalKia({ kunjunganId, nilaiAwal = '', onTerapkan }) {
    let state = uraiBlokKia(nilaiAwal);
    let menyimpan = false;
    let pesanGalat = '';

    const modal = bukaModal1({
        judul: 'Input KIA / Kebidanan',
        lebar: 'modalSedang',
        onTutup: () => modal.tutup(),
    });

    const wadahStatus = document.createElement('div');
    const atasBar = document.createElement('div');
    Object.assign(atasBar.style, { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: token.jarak.sm, flexWrap: 'wrap' });

    const pilihLayanan = bidang({
        id: 'kia-layanan',
        label: 'Layanan KIA',
        nilai: state.layanan,
        opsi: LAYANAN_KIA,
        ubah(v) {
            state = { ...state, layanan: v };
            lukisBidang();
        },
    });
    Object.assign(pilihLayanan.el.style, { minWidth: '180px' });

    const infoAuto = document.createElement('small');
    infoAuto.style.color = token.warna.teksRedup;
    atasBar.append(pilihLayanan.el, infoAuto);

    const isiGrid = document.createElement('div');
    Object.assign(isiGrid.style, { display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: token.jarak.sm });

    const pratinjau = document.createElement('small');
    Object.assign(pratinjau.style, {
        color: token.warna.teksRedup,
        padding: token.jarak.sm,
        borderRadius: token.radius.sedang,
        background: token.warna.kepalaTabel,
    });

    const btnBatal = tombol('Batal', () => modal.tutup(), 'sekunder');
    const btnTerapkan = tombol('Simpan & Masukkan ke Objek', async () => {
        const blok = susunRingkasanKia(state);
        if (!blok || menyimpan) return;
        if (!kunjunganId) {
            onTerapkan(blok);
            modal.tutup();
            return;
        }
        menyimpan = true;
        pesanGalat = '';
        perbaruiRingkasan();
        try {
            const { layanan, ...data } = state;
            await simpanKia(kunjunganId, { layanan, data });
            onTerapkan(blok);
            modal.tutup();
        } catch (e) {
            pesanGalat = e?.message || 'Gagal menyimpan catatan KIA.';
            menyimpan = false;
            perbaruiRingkasan();
        }
    });

    function perbaruiRingkasan() {
        wadahStatus.replaceChildren();
        if (pesanGalat) wadahStatus.append(peringatan(pesanGalat));
        if (state.layanan === 'anc' && state.hpht) {
            const { hpl, usia } = hitungHplDanUsia(state.hpht);
            infoAuto.textContent = [usia && `UK: ${usia}`, hpl && `HPL: ${hpl}`].filter(Boolean).join(' · ');
        } else {
            infoAuto.textContent = '';
        }
        const blok = susunRingkasanKia(state);
        pratinjau.textContent = blok || 'Isi bidang di atas lalu klik Simpan & Masukkan ke Objek.';
        btnTerapkan.disabled = menyimpan || !blok;
        btnTerapkan.textContent = menyimpan ? 'Menyimpan...' : 'Simpan & Masukkan ke Objek';
    }

    function buatInput(kunci, label, { tipe = 'text', opsi, placeholder, min, max, step, lebar } = {}) {
        const f = bidang({
            id: `kia-${kunci}`,
            label,
            jenis: tipe,
            nilai: state[kunci],
            opsi: opsi ? opsi.map((x) => ({ nilai: x, label: x || '— Pilih —' })) : undefined,
            autoComplete: 'off',
            ubah(v) {
                state = { ...state, [kunci]: v };
                perbaruiRingkasan();
            },
        });
        if (placeholder) f.kontrol.placeholder = placeholder;
        if (min !== undefined) f.kontrol.min = String(min);
        if (max !== undefined) f.kontrol.max = String(max);
        if (step !== undefined) f.kontrol.step = String(step);
        if (lebar) Object.assign(f.el.style, { flex: `0 1 ${lebar}`, minWidth: lebar });
        else Object.assign(f.el.style, { flex: '1 1 170px', maxWidth: '240px' });
        return f.el;
    }

    function lukisBidang() {
        isiGrid.replaceChildren();
        if (state.layanan === 'anc') {
            isiGrid.append(
                buatInput('g', 'Gravida (G)', { tipe: 'number', min: 0, max: 20, step: 1, placeholder: '2', lebar: '86px' }),
                buatInput('p', 'Para (P)', { tipe: 'number', min: 0, max: 20, step: 1, placeholder: '1', lebar: '76px' }),
                buatInput('a', 'Abortus (A)', { tipe: 'number', min: 0, max: 20, step: 1, placeholder: '0', lebar: '88px' }),
                buatInput('hpht', 'HPHT', { tipe: 'date', lebar: '230px' }),
                buatInput('tfu', 'TFU (cm)', { tipe: 'number', min: 0, max: 60, step: '0.5', placeholder: '28', lebar: '92px' }),
                buatInput('djj', 'DJJ (x/mnt)', { tipe: 'number', min: 0, max: 250, step: 1, placeholder: '142', lebar: '100px' }),
                buatInput('letak', 'Letak Janin', { opsi: LETAK_JANIN, lebar: '132px' }),
                buatInput('lila', 'LILA (cm)', { tipe: 'number', min: 0, max: 60, step: '0.1', placeholder: '24.5', lebar: '94px' }),
                buatInput('tt', 'Imunisasi TT', { opsi: STATUS_TT, lebar: '108px' }),
            );
        } else if (state.layanan === 'kb') {
            isiGrid.append(
                buatInput('metode_kb', 'Metode KB', { opsi: METODE_KB, lebar: '160px' }),
                buatInput('status_kb', 'Status Peserta', { opsi: STATUS_KB, lebar: '130px' }),
                buatInput('kontrol_kb', 'Jadwal Kontrol', { tipe: 'date', lebar: '230px' }),
            );
        } else {
            isiGrid.append(
                buatInput('lk', 'Lingkar Kepala (cm)', { tipe: 'number', min: 0, max: 80, step: '0.1', placeholder: '42', lebar: '132px' }),
                buatInput('vaksin', 'Jenis Imunisasi', { placeholder: 'mis. DPT-HB-Hib 1', lebar: '190px' }),
                buatInput('dosis_vaksin', 'Dosis / Keterangan', { placeholder: 'mis. 0.5 ml IM', lebar: '170px' }),
                buatInput('jadwal_vaksin', 'Jadwal Berikutnya', { tipe: 'date', lebar: '230px' }),
            );
        }
        perbaruiRingkasan();
    }

    lukisBidang();
    modal.isi.append(wadahStatus, atasBar, isiGrid, pratinjau);
    modal.aksi.append(btnBatal, btnTerapkan);
    modal.fokus();

    if (kunjunganId) {
        ambilKia(kunjunganId)
            .then((res) => {
                const kia = res?.data;
                if (!kia || (kia.sumber === 'kosong')) return;
                // Jika sudah ada catatan kunjungan di DB, gunakan; jika belum ada di Objek, muat acuan dari riwayat.
                if (kia.sumber === 'kunjungan' || !/^\[KIA - (ANC|KB|Anak)\]/m.test(nilaiAwal ?? '')) {
                    state = { ...STATE_KOSONG, layanan: kia.layanan ?? 'anc', ...(kia.data ?? {}) };
                    pilihLayanan.kontrol.value = state.layanan;
                    lukisBidang();
                }
            })
            .catch(() => { });
    }
    return modal;
}
