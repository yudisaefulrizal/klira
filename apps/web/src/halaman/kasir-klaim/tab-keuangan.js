import {
    ringkasanKeuangan, daftarCoa, tambahCoa, daftarJurnal, catatJurnalManual,
    daftarPengeluaran, tambahPengeluaran, daftarHutang, tambahFakturSupplier, bayarHutang,
    daftarPiutang, tambahPiutang, bayarPiutang, rekapJasaMedis, daftarTarifJasa, simpanTarifJasa,
} from '../../api-klien/keuangan.js';
import { pesanGalat } from '../../api-klien/klien.js';
import { izinSaatIni } from '../../komponen/izin/izin-saja.js';
import { kartu, tombol, tabel, baris, sel, lencana, peringatan, tab } from '../../komponen/ui/primitif.js';
import { token } from '../../gaya/token.js';
import { rupiah } from '../../modal/penunjang/keadaan-order-lab.js';
import { barisFleks, judulTebal, kolomFleks, teksRedupKecil } from '../../gaya/tata-letak.js';

const hariIni = () => new Date().toISOString().slice(0, 10);

const WARNA_TIPE_COA = {
    aset: ['Aset', 'biru'],
    kewajiban: ['Kewajiban', 'ungu'],
    ekuitas: ['Ekuitas', 'abu'],
    pendapatan: ['Pendapatan', 'hijau'],
    beban: ['Beban', 'merah'],
};

const WARNA_STATUS_BAYAR = {
    lunas: ['Lunas', 'hijau'],
    sebagian: ['Sebagian', 'kuning'],
    belum: ['Belum lunas', 'merah'],
};

const WARNA_SUMBER_JURNAL = {
    kasir: ['Kasir', 'hijau'],
    klaim_jkn: ['Klaim JKN', 'biru'],
    pengeluaran: ['Pengeluaran', 'merah'],
    hutang_supplier: ['Hutang Supplier', 'ungu'],
    piutang: ['Piutang', 'kuning'],
    manual: ['Manual', 'abu'],
};

function gayaKontrol(el) {
    Object.assign(el.style, {
        height: token.ukuran.isian,
        padding: `0 ${token.jarak.sm}`,
        borderRadius: token.radius.sedang,
        border: `${token.ukuran.garis} solid ${token.warna.garis}`,
        background: token.warna.permukaan,
        color: token.warna.teks,
        fontFamily: token.huruf.keluarga,
        fontSize: token.huruf.ukuran.dasar,
        minWidth: '0',
        boxSizing: 'border-box',
    });
    return el;
}

function inputStd(type = 'text', value = '', placeholder = '') {
    const i = document.createElement('input');
    i.type = type;
    i.value = value;
    if (placeholder) i.placeholder = placeholder;
    return gayaKontrol(i);
}

function selectStd(opsi = []) {
    const s = document.createElement('select');
    for (const [val, label] of opsi) {
        const o = document.createElement('option');
        o.value = val;
        o.textContent = label;
        s.append(o);
    }
    return gayaKontrol(s);
}

function bidangInline(labelTeks, kontrol, minWidth = '150px') {
    const wrap = document.createElement('div');
    Object.assign(wrap.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.xs, flex: `1 1 ${minWidth}`, minWidth });
    const lbl = document.createElement('label');
    lbl.textContent = labelTeks;
    Object.assign(lbl.style, { fontSize: token.huruf.ukuran.kecil, color: token.warna.teksRedup, fontWeight: token.huruf.berat.sedang });
    kontrol.style.width = '100%';
    wrap.append(lbl, kontrol);
    return wrap;
}

function selAngka(teks, tebal = false) {
    const s = sel(teks);
    Object.assign(s.style, { textAlign: 'right', fontVariantNumeric: 'tabular-nums', ...(tebal ? { fontWeight: token.huruf.berat.tebal } : {}) });
    return s;
}

function kartuMetrik(judul, nilai, statusWarna = 'biru', subTeks = '') {
    const w = token.warna.status[statusWarna] ?? token.warna.status.biru;
    const k = kartu({ style: { padding: token.jarak.md, borderLeft: `4px solid ${w.teks}` } });
    const l = document.createElement('div');
    l.textContent = judul;
    Object.assign(l.style, { fontSize: token.huruf.ukuran.kecil, color: token.warna.teksRedup, marginBottom: token.jarak.xs, fontWeight: token.huruf.berat.sedang });
    const v = document.createElement('div');
    v.textContent = rupiah(nilai || 0);
    Object.assign(v.style, { fontSize: token.huruf.ukuran.judul, fontWeight: token.huruf.berat.tebal, color: w.teks, fontVariantNumeric: 'tabular-nums' });
    k.append(l, v);
    if (subTeks) {
        const sub = document.createElement('div');
        sub.textContent = subTeks;
        Object.assign(sub.style, { fontSize: token.huruf.ukuran.kecil, color: token.warna.teksRedup, marginTop: token.jarak.xs });
        k.append(sub);
    }
    return k;
}

function bungkusTabel(judul, tbl, jumlahBaris, pesanKosong = 'Belum ada data pada periode ini.') {
    const box = kartu({ style: { padding: '0', overflow: 'hidden' } });
    const kep = document.createElement('div');
    Object.assign(kep.style, {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: `${token.jarak.sm} ${token.jarak.md}`, borderBottom: `${token.ukuran.garis} solid ${token.warna.garisHalus}`,
    });
    const h = document.createElement('h3');
    h.textContent = judul;
    judulTebal(h, 'besar');
    const cnt = document.createElement('span');
    cnt.textContent = `${jumlahBaris} data`;
    teksRedupKecil(cnt);
    kep.append(h, cnt);
    box.append(kep);
    if (!jumlahBaris) {
        const p = document.createElement('p');
        p.textContent = pesanKosong;
        Object.assign(p.style, { margin: '0', padding: token.jarak.lg, color: token.warna.teksRedup, textAlign: 'center' });
        box.append(p);
    } else {
        box.append(tbl.el);
    }
    return box;
}

/** Tab Keuangan & Akuntansi di halaman Kasir & Klaim. */
export function TabKeuangan() {
    const boleh = izinSaatIni();
    const bolehInput = boleh('kasir', 'input') || boleh('klaim', 'input');
    const el = document.createElement('div');
    kolomFleks(el, 'md');

    const header = document.createElement('div');
    barisFleks(header, 'sm', { rata: 'center', bungkus: true, sebar: true });
    const h2 = document.createElement('h2');
    h2.textContent = 'Keuangan & Akuntansi Klinik';
    judulTebal(h2, 'judul');

    const filterBox = document.createElement('div');
    barisFleks(filterBox, 'sm', { rata: 'center', bungkus: true });
    const lblPeriode = document.createElement('span');
    lblPeriode.textContent = 'Periode';
    Object.assign(lblPeriode.style, { fontSize: token.huruf.ukuran.dasar, color: token.warna.teksRedup });
    const inDari = inputStd('date', hariIni().slice(0, 8) + '01');
    const lblSd = document.createElement('span');
    lblSd.textContent = 's/d';
    Object.assign(lblSd.style, { fontSize: token.huruf.ukuran.dasar, color: token.warna.teksRedup });
    const inSampai = inputStd('date', hariIni());
    const btnFilter = tombol('Terapkan Periode', () => void muat(), 'sekunder');
    filterBox.append(lblPeriode, inDari, lblSd, inSampai, btnFilter);
    header.append(h2, filterBox);

    const status = document.createElement('div');
    const isi = document.createElement('div');
    let subAktif = 'ringkasan';
    let aktif = true;
    let versi = 0;

    const subTabs = tab([
        { id: 'ringkasan', label: 'Ringkasan & Laba Rugi' },
        { id: 'pengeluaran', label: 'Pengeluaran' },
        { id: 'piutang', label: 'Piutang' },
        { id: 'hutang', label: 'Hutang Supplier' },
        { id: 'jasa', label: 'Jasa Medis' },
        { id: 'jurnal', label: 'Jurnal & COA' },
    ], 'ringkasan', 'Sub-menu Keuangan', (id) => {
        subAktif = id;
        subTabs.pilih(id);
        void muat();
    });

    el.append(header, subTabs.el, status, isi);

    const tampilGalat = (e) => status.replaceChildren(peringatan(pesanGalat(e, (e?.message || 'Gagal memuat data keuangan.'))));
    const periode = () => ({ dari: inDari.value || undefined, sampai: inSampai.value || undefined });

    async function muatRingkasan() {
        const d = await ringkasanKeuangan(periode());
        const grid = document.createElement('div');
        Object.assign(grid.style, { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: token.jarak.md, marginBottom: token.jarak.md });
        grid.append(
            kartuMetrik('Total Pendapatan', d.laba_rugi.pendapatan, 'hijau'),
            kartuMetrik('Total Beban', d.laba_rugi.beban, 'merah'),
            kartuMetrik('Laba / Rugi Bersih', d.laba_rugi.laba_bersih, d.laba_rugi.laba_bersih >= 0 ? 'hijau' : 'merah'),
            kartuMetrik('Arus Kas Bersih', d.arus_kas.bersih, d.arus_kas.bersih >= 0 ? 'biru' : 'merah', `Masuk ${rupiah(d.arus_kas.masuk)} · Keluar ${rupiah(d.arus_kas.keluar)}`),
            kartuMetrik('Sisa Piutang', d.total_piutang, 'kuning'),
            kartuMetrik('Sisa Hutang Supplier', d.total_hutang, 'ungu'),
        );
        const akun = d.per_akun || [];
        const tbl = tabel(['Kode', 'Nama Akun', 'Tipe', 'Debit', 'Kredit'].map((j, i) => ({ judul: j, rataKanan: i >= 3 })), 'Neraca Saldo Akun');
        let totD = 0;
        let totK = 0;
        for (const a of akun) {
            totD += Number(a.total_debit || 0);
            totK += Number(a.total_kredit || 0);
            const [lblTipe, wrnTipe] = WARNA_TIPE_COA[a.tipe] ?? [a.tipe, 'abu'];
            tbl.tbody.append(baris(
                sel(a.kode), sel(a.nama), sel(lencana(lblTipe, wrnTipe)),
                selAngka(rupiah(a.total_debit)),
                selAngka(rupiah(a.total_kredit)),
            ));
        }
        if (akun.length) {
            const totalRow = baris(
                sel(), sel(Object.assign(document.createElement('strong'), { textContent: 'Total Neraca Saldo' })), sel(),
                selAngka(rupiah(totD), true),
                selAngka(rupiah(totK), true),
            );
            totalRow.style.background = token.warna.kepalaTabel;
            tbl.tbody.append(totalRow);
        }
        isi.replaceChildren(grid, bungkusTabel('Neraca Saldo Akun', tbl, akun.length));
    }

    async function muatPengeluaran() {
        const daftar = await daftarPengeluaran(periode());
        const wrap = document.createElement('div');
        kolomFleks(wrap, 'md');
        if (bolehInput) {
            const form = kartu({ susun: 'sm' });
            const judulF = document.createElement('h3');
            judulF.textContent = 'Catat Pengeluaran Operasional';
            judulTebal(judulF, 'besar');
            const fRow = document.createElement('form');
            barisFleks(fRow, 'sm', { rata: 'flex-end', bungkus: true });
            const tgl = inputStd('date', hariIni());
            const kat = selectStd([['gaji', 'Gaji'], ['listrik_air', 'Listrik & Air'], ['atk', 'ATK'], ['pemeliharaan', 'Pemeliharaan'], ['rumah_tangga', 'Rumah Tangga'], ['lainnya', 'Lainnya']]);
            const met = selectStd([['tunai', 'Kas Tunai'], ['transfer', 'Transfer Bank']]);
            const jml = inputStd('number', '', '50000'); jml.min = '1';
            const pen = inputStd('text', '', 'Nama penerima / vendor');
            const ket = inputStd('text', '', 'Uraian pengeluaran');
            const btn = tombol('Catat Pengeluaran', null, 'utama'); btn.type = 'submit';
            fRow.onsubmit = async (ev) => {
                ev.preventDefault();
                status.replaceChildren();
                try {
                    await tambahPengeluaran({ tanggal: tgl.value, kategori: kat.value, metode: met.value, jumlah: Number(jml.value), penerima: pen.value, keterangan: ket.value });
                    await muat();
                } catch (e) { tampilGalat(e); }
            };
            fRow.append(
                bidangInline('Tanggal', tgl, '140px'),
                bidangInline('Kategori', kat, '150px'),
                bidangInline('Metode Bayar', met, '140px'),
                bidangInline('Jumlah (Rp)', jml, '140px'),
                bidangInline('Penerima', pen, '160px'),
                bidangInline('Keterangan', ket, '220px'),
                btn,
            );
            form.append(judulF, fRow);
            wrap.append(form);
        }
        const tbl = tabel(['Tanggal', 'Kategori', 'Metode', 'Penerima', 'Keterangan', 'Jumlah'].map((j, i) => ({ judul: j, rataKanan: i === 5 })), 'Daftar Pengeluaran');
        for (const r of daftar) {
            tbl.tbody.append(baris(sel(r.tanggal), sel(lencana(r.kategori, 'abu')), sel(r.metode), sel(r.penerima || '-'), sel(r.keterangan), selAngka(rupiah(r.jumlah), true)));
        }
        wrap.append(bungkusTabel('Riwayat Pengeluaran Operasional', tbl, daftar.length, 'Belum ada pengeluaran operasional pada periode ini.'));
        isi.replaceChildren(wrap);
    }

    async function muatHutang() {
        const daftar = await daftarHutang();
        const wrap = document.createElement('div');
        kolomFleks(wrap, 'md');
        if (bolehInput) {
            const form = kartu({ susun: 'sm' });
            const judulF = document.createElement('h3');
            judulF.textContent = 'Catat Faktur Pembelian Supplier';
            judulTebal(judulF, 'besar');
            const fRow = document.createElement('form');
            barisFleks(fRow, 'sm', { rata: 'flex-end', bungkus: true });
            const noF = inputStd('text', '', 'PBF-2026-001');
            const sup = inputStd('text', '', 'Nama PBF / Supplier');
            const tgl = inputStd('date', hariIni());
            const jt = inputStd('date', '');
            const tot = inputStd('number', '', '250000'); tot.min = '1';
            const btn = tombol('Simpan Faktur', null, 'utama'); btn.type = 'submit';
            fRow.onsubmit = async (ev) => {
                ev.preventDefault();
                status.replaceChildren();
                try {
                    await tambahFakturSupplier({ nomor_faktur: noF.value, supplier: sup.value, tanggal_faktur: tgl.value, jatuh_tempo: jt.value || null, total: Number(tot.value) });
                    await muat();
                } catch (e) { tampilGalat(e); }
            };
            fRow.append(
                bidangInline('Nomor Faktur', noF, '150px'),
                bidangInline('Supplier / PBF', sup, '200px'),
                bidangInline('Tanggal Faktur', tgl, '140px'),
                bidangInline('Jatuh Tempo', jt, '140px'),
                bidangInline('Total (Rp)', tot, '150px'),
                btn,
            );
            form.append(judulF, fRow);
            wrap.append(form);
        }
        const tbl = tabel(['No. Faktur', 'Supplier', 'Tanggal', 'Total', 'Terbayar', 'Status', 'Aksi'].map((j, i) => ({ judul: j, rataKanan: i === 3 || i === 4 || i === 6 })), 'Hutang Supplier');
        for (const r of daftar) {
            const sisa = Number(r.total) - Number(r.terbayar);
            const [lblS, wrnS] = WARNA_STATUS_BAYAR[r.status] ?? [r.status, 'abu'];
            const aSel = sel(); aSel.style.textAlign = 'right';
            if (bolehInput && r.status !== 'lunas' && sisa > 0) {
                aSel.append(tombol('Lunasi', async () => {
                    status.replaceChildren();
                    try {
                        await bayarHutang(r.id, { tanggal: hariIni(), metode: 'transfer', jumlah: sisa, catatan: `Pelunasan ${r.nomor_faktur}` });
                        await muat();
                    } catch (e) { tampilGalat(e); }
                }, 'sekunder'));
            }
            tbl.tbody.append(baris(sel(r.nomor_faktur), sel(r.supplier), sel(r.tanggal_faktur), selAngka(rupiah(r.total)), selAngka(rupiah(r.terbayar)), sel(lencana(lblS, wrnS)), aSel));
        }
        wrap.append(bungkusTabel('Daftar Hutang Supplier', tbl, daftar.length, 'Belum ada faktur pembelian supplier.'));
        isi.replaceChildren(wrap);
    }

    async function muatPiutang() {
        const daftar = await daftarPiutang();
        const wrap = document.createElement('div');
        kolomFleks(wrap, 'md');
        if (bolehInput) {
            const form = kartu({ susun: 'sm' });
            const judulF = document.createElement('h3');
            judulF.textContent = 'Catat Piutang Pasien / Penjamin';
            judulTebal(judulF, 'besar');
            const fRow = document.createElement('form');
            barisFleks(fRow, 'sm', { rata: 'flex-end', bungkus: true });
            const kid = inputStd('number', '', 'ID kunjungan'); kid.min = '1';
            const pen = inputStd('text', '', 'Nama asuransi / pasien');
            const tot = inputStd('number', '', '150000'); tot.min = '1';
            const jt = inputStd('date', '');
            const btn = tombol('Catat Piutang', null, 'utama'); btn.type = 'submit';
            fRow.onsubmit = async (ev) => {
                ev.preventDefault();
                status.replaceChildren();
                try {
                    await tambahPiutang({ kunjungan_id: Number(kid.value), penjamin: pen.value, total: Number(tot.value), jatuh_tempo: jt.value || null });
                    await muat();
                } catch (e) { tampilGalat(e); }
            };
            fRow.append(
                bidangInline('ID Kunjungan', kid, '130px'),
                bidangInline('Penjamin / Pasien', pen, '200px'),
                bidangInline('Total Piutang (Rp)', tot, '150px'),
                bidangInline('Jatuh Tempo', jt, '140px'),
                btn,
            );
            form.append(judulF, fRow);
            wrap.append(form);
        }
        const tbl = tabel(['Kunjungan', 'Pasien', 'Penjamin', 'Total', 'Terbayar', 'Status', 'Aksi'].map((j, i) => ({ judul: j, rataKanan: i === 3 || i === 4 || i === 6 })), 'Daftar Piutang');
        for (const r of daftar) {
            const sisa = Number(r.total) - Number(r.terbayar);
            const [lblS, wrnS] = WARNA_STATUS_BAYAR[r.status] ?? [r.status, 'abu'];
            const aSel = sel(); aSel.style.textAlign = 'right';
            if (bolehInput && r.status !== 'lunas' && sisa > 0) {
                aSel.append(tombol('Terima Bayar', async () => {
                    status.replaceChildren();
                    try {
                        await bayarPiutang(r.id, { tanggal: hariIni(), metode: 'transfer', jumlah: sisa, catatan: 'Pelunasan piutang' });
                        await muat();
                    } catch (e) { tampilGalat(e); }
                }, 'sekunder'));
            }
            tbl.tbody.append(baris(sel(r.id_layanan || `#${r.kunjungan_id}`), sel(r.pasien_nama || '-'), sel(r.penjamin), selAngka(rupiah(r.total)), selAngka(rupiah(r.terbayar)), sel(lencana(lblS, wrnS)), aSel));
        }
        wrap.append(bungkusTabel('Daftar Piutang Pasien & Penjamin', tbl, daftar.length, 'Belum ada catatan piutang.'));
        isi.replaceChildren(wrap);
    }

    async function muatJasaMedis() {
        const [daftar, tarif] = await Promise.all([rekapJasaMedis(periode()), daftarTarifJasa()]);
        const wrap = document.createElement('div');
        kolomFleks(wrap, 'md');

        const tbl = tabel(['Praktisi / DPJP', 'Item Layanan', 'Jasa DPJP', 'Jasa Perawat', 'Jasa Klinik'].map((j, i) => ({ judul: j, rataKanan: i >= 1 })), 'Rekap Jasa Medis');
        for (const r of daftar) {
            tbl.tbody.append(baris(
                sel(r.praktisi_nama),
                selAngka(String(r.jumlah_item)),
                selAngka(rupiah(r.total_jasa_dpjp), true),
                selAngka(rupiah(r.total_jasa_perawat)),
                selAngka(rupiah(r.total_jasa_klinik)),
            ));
        }
        wrap.append(bungkusTabel('Rekap Jasa Medis per Praktisi', tbl, daftar.length, 'Belum ada transaksi tagihan dengan komponen jasa medis pada periode ini.'));

        const tblT = tabel(['Tarif Layanan', 'Harga Umum', 'Jasa Klinik', 'Jasa DPJP', 'Jasa Perawat', 'Aksi'].map((j, i) => ({ judul: j, rataKanan: i === 1 || i === 5 })), 'Komponen Jasa Tarif');
        const listT = tarif.slice(0, 30);
        for (const t of listT) {
            const inK = inputStd('number', String(t.jasa_klinik || 0)); inK.min = '0'; inK.style.width = '110px';
            const inD = inputStd('number', String(t.jasa_dpjp || 0)); inD.min = '0'; inD.style.width = '110px';
            const inP = inputStd('number', String(t.jasa_perawat || 0)); inP.min = '0'; inP.style.width = '110px';
            const aSel = sel(); aSel.style.textAlign = 'right';
            if (bolehInput) {
                aSel.append(tombol('Simpan', async () => {
                    status.replaceChildren();
                    try {
                        await simpanTarifJasa(t.id, { jasa_klinik: Number(inK.value), jasa_dpjp: Number(inD.value), jasa_perawat: Number(inP.value) });
                        await muat();
                    } catch (e) { tampilGalat(e); }
                }, 'sekunder'));
            }
            tblT.tbody.append(baris(sel(`${t.kode || '-'} · ${t.nama}`), selAngka(t.harga_umum != null ? rupiah(t.harga_umum) : '-'), sel(inK), sel(inD), sel(inP), aSel));
        }
        wrap.append(bungkusTabel('Pengaturan Komponen Jasa Tarif', tblT, listT.length, 'Belum ada tarif layanan aktif.'));
        isi.replaceChildren(wrap);
    }

    async function muatJurnalCoa() {
        const [coa, jurnal] = await Promise.all([daftarCoa(), daftarJurnal(periode())]);
        const wrap = document.createElement('div');
        kolomFleks(wrap, 'md');
        if (bolehInput && coa.length >= 2) {
            const form = kartu({ susun: 'md' });
            const judulJ = document.createElement('h3');
            judulJ.textContent = 'Posting Jurnal Manual (Double-Entry)';
            judulTebal(judulJ, 'besar');
            const fRow = document.createElement('form');
            barisFleks(fRow, 'sm', { rata: 'flex-end', bungkus: true });
            const tgl = inputStd('date', hariIni());
            const opsiCoa = coa.map((c) => [c.kode, `${c.kode} - ${c.nama}`]);
            const deb = selectStd(opsiCoa);
            const kre = selectStd(opsiCoa);
            if (opsiCoa.length > 1) kre.selectedIndex = 1;
            const nom = inputStd('number', '', '100000'); nom.min = '1';
            const ket = inputStd('text', '', 'Keterangan transaksi jurnal');
            const btn = tombol('Posting Jurnal', null, 'utama'); btn.type = 'submit';
            fRow.onsubmit = async (ev) => {
                ev.preventDefault();
                status.replaceChildren();
                try {
                    const n = Number(nom.value);
                    await catatJurnalManual({
                        tanggal: tgl.value,
                        keterangan: ket.value,
                        baris: [
                            { akun_kode: deb.value, debit: n, kredit: 0, keterangan: ket.value },
                            { akun_kode: kre.value, debit: 0, kredit: n, keterangan: ket.value },
                        ],
                    });
                    await muat();
                } catch (e) { tampilGalat(e); }
            };
            fRow.append(
                bidangInline('Tanggal', tgl, '140px'),
                bidangInline('Akun Debit', deb, '200px'),
                bidangInline('Akun Kredit', kre, '200px'),
                bidangInline('Nominal (Rp)', nom, '140px'),
                bidangInline('Keterangan', ket, '220px'),
                btn,
            );

            const pembatas = document.createElement('hr');
            Object.assign(pembatas.style, { border: 'none', borderTop: `${token.ukuran.garis} solid ${token.warna.garisHalus}`, margin: '0' });

            const judulC = document.createElement('h3');
            judulC.textContent = 'Tambah Akun Perkiraan (COA)';
            Object.assign(judulC.style, { margin: '0', fontSize: token.huruf.ukuran.dasar, fontWeight: token.huruf.berat.tebal, color: token.warna.teksRedup });
            const fCoa = document.createElement('form');
            barisFleks(fCoa, 'sm', { rata: 'flex-end', bungkus: true });
            const kd = inputStd('text', '', 'mis. 5103');
            const nm = inputStd('text', '', 'Nama akun baru');
            const tp = selectStd([['aset', 'Aset'], ['kewajiban', 'Kewajiban'], ['ekuitas', 'Ekuitas'], ['pendapatan', 'Pendapatan'], ['beban', 'Beban']]);
            const btnC = tombol('Tambah COA', null, 'sekunder'); btnC.type = 'submit';
            fCoa.onsubmit = async (ev) => {
                ev.preventDefault();
                status.replaceChildren();
                try {
                    await tambahCoa({ kode: kd.value, nama: nm.value, tipe: tp.value });
                    await muat();
                } catch (e) { tampilGalat(e); }
            };
            fCoa.append(
                bidangInline('Kode Akun', kd, '140px'),
                bidangInline('Nama Akun', nm, '240px'),
                bidangInline('Tipe Akun', tp, '160px'),
                btnC,
            );
            form.append(judulJ, fRow, pembatas, judulC, fCoa);
            wrap.append(form);
        }
        const tbl = tabel(['Nomor', 'Tanggal', 'Sumber', 'Keterangan', 'Rincian Debit / Kredit'], 'Jurnal Umum');
        for (const j of jurnal) {
            const [lblS, wrnS] = WARNA_SUMBER_JURNAL[j.sumber] ?? [j.sumber, 'abu'];
            const rincianEl = document.createElement('div');
            Object.assign(rincianEl.style, { display: 'flex', flexDirection: 'column', gap: '2px', fontSize: token.huruf.ukuran.kecil, fontVariantNumeric: 'tabular-nums' });
            for (const d of j.detail || []) {
                const line = document.createElement('div');
                line.textContent = `${d.akun_kode} ${d.akun_nama || ''} · ${d.debit > 0 ? `Debit ${rupiah(d.debit)}` : `Kredit ${rupiah(d.kredit)}`}`;
                line.style.color = d.debit > 0 ? token.warna.status.hijau.teks : token.warna.status.biru.teks;
                rincianEl.append(line);
            }
            tbl.tbody.append(baris(sel(j.nomor), sel(j.tanggal), sel(lencana(lblS, wrnS)), sel(j.keterangan), sel(rincianEl)));
        }
        wrap.append(bungkusTabel('Jurnal Umum', tbl, jurnal.length, 'Belum ada entri jurnal pada periode ini.'));
        isi.replaceChildren(wrap);
    }

    async function muat() {
        const saat = ++versi;
        status.replaceChildren();
        try {
            if (subAktif === 'ringkasan') await muatRingkasan();
            else if (subAktif === 'pengeluaran') await muatPengeluaran();
            else if (subAktif === 'piutang') await muatPiutang();
            else if (subAktif === 'hutang') await muatHutang();
            else if (subAktif === 'jasa') await muatJasaMedis();
            else await muatJurnalCoa();
            if (!aktif || saat !== versi) return;
        } catch (e) {
            if (aktif && saat === versi) tampilGalat(e);
        }
    }

    void muat();
    el.tutup = () => { aktif = false; versi++; };
    return el;
}
