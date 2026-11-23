import { baca, tulis, transaksi, pool } from '../koneksi.js';

export const COA_BAWAAN = [
    ['1101', 'Kas Tunai', 'aset'],
    ['1102', 'Bank / Transfer & QRIS', 'aset'],
    ['1103', 'Piutang Pasien & Penjamin', 'aset'],
    ['1104', 'Persediaan Obat & BHP', 'aset'],
    ['2101', 'Hutang Supplier Obat', 'kewajiban'],
    ['4101', 'Pendapatan Layanan Klinik', 'pendapatan'],
    ['4102', 'Pendapatan Farmasi / Obat', 'pendapatan'],
    ['5101', 'Beban Operasional Klinik', 'beban'],
    ['5102', 'Beban Jasa Medis', 'beban'],
];

const akunKasDariMetode = (metode) => (metode === 'tunai' ? '1101' : '1102');

/** Pastikan akun COA standar klinik tersedia untuk fasyankes terkait. */
export async function pastikanCoaBawaan(fasyankes_id, koneksi = pool) {
    for (const [kode, nama, tipe] of COA_BAWAAN) {
        await tulis(
            'INSERT IGNORE INTO `akun_keuangan` (`fasyankes_id`, `kode`, `nama`, `tipe`, `aktif`) VALUES (?, ?, ?, ?, true)',
            [fasyankes_id, kode, nama, tipe],
            koneksi,
        );
    }
}

export async function daftarCoa(fasyankes_id, koneksi = pool) {
    await pastikanCoaBawaan(fasyankes_id, koneksi);
    return baca(
        'SELECT `id`, `kode`, `nama`, `tipe`, `aktif` FROM `akun_keuangan` WHERE `fasyankes_id` = ? ORDER BY `kode` ASC',
        [fasyankes_id],
        koneksi,
    );
}

export async function tambahCoa(fasyankes_id, { kode, nama, tipe }, koneksi = pool) {
    await pastikanCoaBawaan(fasyankes_id, koneksi);
    await tulis(
        'INSERT INTO `akun_keuangan` (`fasyankes_id`, `kode`, `nama`, `tipe`, `aktif`) VALUES (?, ?, ?, ?, true)',
        [fasyankes_id, kode, nama, tipe],
        koneksi,
    );
    const rows = await baca('SELECT `id`, `kode`, `nama`, `tipe`, `aktif` FROM `akun_keuangan` WHERE `fasyankes_id` = ? AND `kode` = ? LIMIT 1', [fasyankes_id, kode], koneksi);
    return rows[0];
}

/** Catat jurnal double-entry; melempar galat bila debit != kredit atau total <= 0. */
export async function catatJurnal(fasyankes_id, { tanggal, sumber, referensi_id = null, keterangan, baris = [], dibuat_oleh = null }, koneksi = pool) {
    const totalDebit = baris.reduce((s, b) => s + Number(b.debit || 0), 0);
    const totalKredit = baris.reduce((s, b) => s + Number(b.kredit || 0), 0);
    if (totalDebit <= 0 || totalDebit !== totalKredit) {
        throw new Error(`Jurnal tidak seimbang (debit=${totalDebit}, kredit=${totalKredit}).`);
    }
    const jalankan = async (c) => {
        await pastikanCoaBawaan(fasyankes_id, c);
        const tgl = tanggal || new Date().toISOString().slice(0, 10);
        const nomor = `JRN-${tgl.replaceAll('-', '')}-${Date.now().toString().slice(-5)}${Math.floor(Math.random() * 90 + 10)}`;
        const res = await tulis(
            'INSERT INTO `jurnal` (`fasyankes_id`, `nomor`, `tanggal`, `sumber`, `referensi_id`, `keterangan`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [fasyankes_id, nomor, tgl, sumber, referensi_id, keterangan, dibuat_oleh],
            c,
        );
        const jurnalId = res.insertId;
        for (const b of baris) {
            await tulis(
                'INSERT INTO `detail_jurnal` (`fasyankes_id`, `jurnal_id`, `akun_kode`, `debit`, `kredit`, `keterangan`) VALUES (?, ?, ?, ?, ?, ?)',
                [fasyankes_id, jurnalId, b.akun_kode, Number(b.debit || 0), Number(b.kredit || 0), b.keterangan ?? null],
                c,
            );
        }
        return { id: jurnalId, nomor, tanggal: tgl, total: totalDebit };
    };
    return koneksi === pool ? transaksi(jalankan) : jalankan(koneksi);
}

export async function daftarJurnal(fasyankes_id, { dari, sampai, batas = 50 } = {}, koneksi = pool) {
    const kondisi = ['j.`fasyankes_id` = ?'];
    const param = [fasyankes_id];
    if (dari) { kondisi.push('j.`tanggal` >= ?'); param.push(dari); }
    if (sampai) { kondisi.push('j.`tanggal` <= ?'); param.push(sampai); }
    const kepala = await baca(
        `SELECT j.\`id\`, j.\`nomor\`, DATE_FORMAT(j.\`tanggal\`, '%Y-%m-%d') AS tanggal, j.\`sumber\`, j.\`referensi_id\`, j.\`keterangan\`, j.\`dibuat_pada\` FROM \`jurnal\` j WHERE ${kondisi.join(' AND ')} ORDER BY j.\`tanggal\` DESC, j.\`id\` DESC LIMIT ?`,
        [...param, Number(batas)],
        koneksi,
    );
    if (!kepala.length) return [];
    const ids = kepala.map((k) => k.id);
    const rincian = await baca(
        `SELECT d.\`jurnal_id\`, d.\`akun_kode\`, a.\`nama\` AS akun_nama, d.\`debit\`, d.\`kredit\`, d.\`keterangan\` FROM \`detail_jurnal\` d LEFT JOIN \`akun_keuangan\` a ON a.\`fasyankes_id\` = d.\`fasyankes_id\` AND a.\`kode\` = d.\`akun_kode\` WHERE d.\`jurnal_id\` IN (${ids.map(() => '?').join(',')}) ORDER BY d.\`id\` ASC`,
        ids,
        koneksi,
    );
    const peta = new Map();
    for (const r of rincian) {
        if (!peta.has(r.jurnal_id)) peta.set(r.jurnal_id, []);
        peta.get(r.jurnal_id).push(r);
    }
    return kepala.map((k) => ({ ...k, detail: peta.get(k.id) ?? [] }));
}

export async function daftarPengeluaran(fasyankes_id, { dari, sampai } = {}, koneksi = pool) {
    const kondisi = ['`fasyankes_id` = ?'];
    const param = [fasyankes_id];
    if (dari) { kondisi.push('`tanggal` >= ?'); param.push(dari); }
    if (sampai) { kondisi.push('`tanggal` <= ?'); param.push(sampai); }
    return baca(
        `SELECT \`id\`, DATE_FORMAT(\`tanggal\`, '%Y-%m-%d') AS tanggal, \`kategori\`, \`metode\`, \`jumlah\`, \`penerima\`, \`keterangan\`, \`dibuat_pada\` FROM \`pengeluaran_operasional\` WHERE ${kondisi.join(' AND ')} ORDER BY \`tanggal\` DESC, \`id\` DESC LIMIT 100`,
        param,
        koneksi,
    );
}

export async function tambahPengeluaran(fasyankes_id, d, pengguna_id) {
    return transaksi(async (c) => {
        const res = await tulis(
            'INSERT INTO `pengeluaran_operasional` (`fasyankes_id`, `tanggal`, `kategori`, `metode`, `jumlah`, `penerima`, `keterangan`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [fasyankes_id, d.tanggal, d.kategori, d.metode, d.jumlah, d.penerima || null, d.keterangan, pengguna_id],
            c,
        );
        await catatJurnal(fasyankes_id, {
            tanggal: d.tanggal,
            sumber: 'pengeluaran',
            referensi_id: res.insertId,
            keterangan: `Pengeluaran (${d.kategori}): ${d.keterangan}`,
            dibuat_oleh: pengguna_id,
            baris: [
                { akun_kode: '5101', debit: d.jumlah, kredit: 0, keterangan: d.keterangan },
                { akun_kode: akunKasDariMetode(d.metode), debit: 0, kredit: d.jumlah, keterangan: `Bayar ${d.metode}` },
            ],
        }, c);
        const rows = await baca('SELECT `id`, DATE_FORMAT(`tanggal`, \'%Y-%m-%d\') AS tanggal, `kategori`, `metode`, `jumlah`, `penerima`, `keterangan`, `dibuat_pada` FROM `pengeluaran_operasional` WHERE `id` = ?', [res.insertId], c);
        return rows[0];
    });
}

export async function daftarFakturSupplier(fasyankes_id, koneksi = pool) {
    return baca(
        'SELECT `id`, `nomor_faktur`, `supplier`, DATE_FORMAT(`tanggal_faktur`, \'%Y-%m-%d\') AS tanggal_faktur, DATE_FORMAT(`jatuh_tempo`, \'%Y-%m-%d\') AS jatuh_tempo, `total`, `terbayar`, `status`, `catatan`, `dibuat_pada` FROM `faktur_supplier` WHERE `fasyankes_id` = ? ORDER BY `tanggal_faktur` DESC, `id\` DESC LIMIT 100',
        [fasyankes_id],
        koneksi,
    );
}

export async function tambahFakturSupplier(fasyankes_id, d, pengguna_id) {
    return transaksi(async (c) => {
        const res = await tulis(
            'INSERT INTO `faktur_supplier` (`fasyankes_id`, `nomor_faktur`, `supplier`, `tanggal_faktur`, `jatuh_tempo`, `total`, `terbayar`, `status`, `catatan`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, 0, \'belum\', ?, ?)',
            [fasyankes_id, d.nomor_faktur, d.supplier, d.tanggal_faktur, d.jatuh_tempo || null, d.total, d.catatan || null, pengguna_id],
            c,
        );
        await catatJurnal(fasyankes_id, {
            tanggal: d.tanggal_faktur,
            sumber: 'hutang_supplier',
            referensi_id: res.insertId,
            keterangan: `Faktur pembelian ${d.nomor_faktur} (${d.supplier})`,
            dibuat_oleh: pengguna_id,
            baris: [
                { akun_kode: '1104', debit: d.total, kredit: 0, keterangan: `Persediaan ${d.nomor_faktur}` },
                { akun_kode: '2101', debit: 0, kredit: d.total, keterangan: `Hutang ${d.supplier}` },
            ],
        }, c);
        const rows = await baca('SELECT `id`, `nomor_faktur`, `supplier`, DATE_FORMAT(`tanggal_faktur`, \'%Y-%m-%d\') AS tanggal_faktur, DATE_FORMAT(`jatuh_tempo`, \'%Y-%m-%d\') AS jatuh_tempo, `total`, `terbayar`, `status`, `catatan` FROM `faktur_supplier` WHERE `id` = ?', [res.insertId], c);
        return rows[0];
    });
}

export async function bayarHutangSupplier(fasyankes_id, faktur_id, d, pengguna_id) {
    return transaksi(async (c) => {
        const rows = await baca('SELECT `id`, `nomor_faktur`, `supplier`, `total`, `terbayar`, `status` FROM `faktur_supplier` WHERE `id` = ? AND `fasyankes_id` = ? LIMIT 1 FOR UPDATE', [faktur_id, fasyankes_id], c);
        const f = rows[0];
        if (!f) return { ok: false, sebab: 'tidak_ada' };
        const sisa = f.total - f.terbayar;
        if (f.status === 'lunas' || sisa <= 0) return { ok: false, sebab: 'sudah_lunas' };
        if (d.jumlah > sisa) return { ok: false, sebab: 'melebihi_sisa', sisa };
        const baruTerbayar = f.terbayar + d.jumlah;
        const statusBaru = baruTerbayar >= f.total ? 'lunas' : 'sebagian';
        const bayarRes = await tulis(
            'INSERT INTO `bayar_hutang_supplier` (`fasyankes_id`, `faktur_id`, `tanggal`, `metode`, `jumlah`, `catatan`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [fasyankes_id, faktur_id, d.tanggal, d.metode, d.jumlah, d.catatan || null, pengguna_id],
            c,
        );
        await tulis('UPDATE `faktur_supplier` SET `terbayar` = ?, `status` = ? WHERE `id` = ?', [baruTerbayar, statusBaru, faktur_id], c);
        await catatJurnal(fasyankes_id, {
            tanggal: d.tanggal,
            sumber: 'hutang_supplier',
            referensi_id: bayarRes.insertId,
            keterangan: `Pelunasan hutang ${f.nomor_faktur} (${f.supplier})`,
            dibuat_oleh: pengguna_id,
            baris: [
                { akun_kode: '2101', debit: d.jumlah, kredit: 0, keterangan: `Bayar hutang ${f.nomor_faktur}` },
                { akun_kode: akunKasDariMetode(d.metode), debit: 0, kredit: d.jumlah, keterangan: `Kas ${d.metode}` },
            ],
        }, c);
        return { ok: true, data: { ...f, terbayar: baruTerbayar, status: statusBaru } };
    });
}

export async function daftarPiutang(fasyankes_id, koneksi = pool) {
    return baca(
        'SELECT p.`id`, p.`kunjungan_id`, k.`id_layanan`, ps.`nama` AS pasien_nama, p.`penjamin`, p.`total`, p.`terbayar`, p.`status`, DATE_FORMAT(p.`jatuh_tempo`, \'%Y-%m-%d\') AS jatuh_tempo, p.`catatan`, p.`dibuat_pada` FROM `piutang_kunjungan` p LEFT JOIN `kunjungan` k ON k.`id` = p.`kunjungan_id` LEFT JOIN `pasien` ps ON ps.`id` = k.`pasien_id` WHERE p.`fasyankes_id` = ? ORDER BY p.`id` DESC LIMIT 100',
        [fasyankes_id],
        koneksi,
    );
}

export async function tambahPiutang(fasyankes_id, d, pengguna_id) {
    return transaksi(async (c) => {
        const k = await baca('SELECT `id` FROM `kunjungan` WHERE `id` = ? AND `fasyankes_id` = ? LIMIT 1', [d.kunjungan_id, fasyankes_id], c);
        if (!k[0]) return { ok: false, sebab: 'kunjungan_tidak_ada' };
        const res = await tulis(
            'INSERT INTO `piutang_kunjungan` (`fasyankes_id`, `kunjungan_id`, `tagihan_id`, `penjamin`, `total`, `terbayar`, `status`, `jatuh_tempo`, `catatan`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, 0, \'belum\', ?, ?, ?) ON DUPLICATE KEY UPDATE `penjamin` = VALUES(`penjamin`), `total` = VALUES(`total`), `jatuh_tempo` = VALUES(`jatuh_tempo`), `catatan` = VALUES(`catatan`)',
            [fasyankes_id, d.kunjungan_id, d.tagihan_id || null, d.penjamin, d.total, d.jatuh_tempo || null, d.catatan || null, pengguna_id],
            c,
        );
        const idPiutang = res.insertId || (await baca('SELECT `id` FROM `piutang_kunjungan` WHERE `fasyankes_id` = ? AND `kunjungan_id` = ? LIMIT 1', [fasyankes_id, d.kunjungan_id], c))[0]?.id;
        await catatJurnal(fasyankes_id, {
            tanggal: new Date().toISOString().slice(0, 10),
            sumber: 'piutang',
            referensi_id: idPiutang,
            keterangan: `Piutang kunjungan #${d.kunjungan_id} (${d.penjamin})`,
            dibuat_oleh: pengguna_id,
            baris: [
                { akun_kode: '1103', debit: d.total, kredit: 0, keterangan: `Piutang ${d.penjamin}` },
                { akun_kode: '4101', debit: 0, kredit: d.total, keterangan: 'Pendapatan layanan' },
            ],
        }, c);
        return { ok: true, id: idPiutang };
    });
}

export async function bayarPiutang(fasyankes_id, piutang_id, d, pengguna_id) {
    return transaksi(async (c) => {
        const rows = await baca('SELECT `id`, `kunjungan_id`, `penjamin`, `total`, `terbayar`, `status` FROM `piutang_kunjungan` WHERE `id` = ? AND `fasyankes_id` = ? LIMIT 1 FOR UPDATE', [piutang_id, fasyankes_id], c);
        const p = rows[0];
        if (!p) return { ok: false, sebab: 'tidak_ada' };
        const sisa = p.total - p.terbayar;
        if (p.status === 'lunas' || sisa <= 0) return { ok: false, sebab: 'sudah_lunas' };
        if (d.jumlah > sisa) return { ok: false, sebab: 'melebihi_sisa', sisa };
        const baruTerbayar = p.terbayar + d.jumlah;
        const statusBaru = baruTerbayar >= p.total ? 'lunas' : 'sebagian';
        const bayarRes = await tulis(
            'INSERT INTO `bayar_piutang` (`fasyankes_id`, `piutang_id`, `tanggal`, `metode`, `jumlah`, `catatan`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [fasyankes_id, piutang_id, d.tanggal, d.metode, d.jumlah, d.catatan || null, pengguna_id],
            c,
        );
        await tulis('UPDATE `piutang_kunjungan` SET `terbayar` = ?, `status` = ? WHERE `id` = ?', [baruTerbayar, statusBaru, piutang_id], c);
        await catatJurnal(fasyankes_id, {
            tanggal: d.tanggal,
            sumber: 'piutang',
            referensi_id: bayarRes.insertId,
            keterangan: `Pelunasan piutang #${p.kunjungan_id} (${p.penjamin})`,
            dibuat_oleh: pengguna_id,
            baris: [
                { akun_kode: akunKasDariMetode(d.metode), debit: d.jumlah, kredit: 0, keterangan: `Terima ${d.metode}` },
                { akun_kode: '1103', debit: 0, kredit: d.jumlah, keterangan: `Pelunasan piutang ${p.penjamin}` },
            ],
        }, c);
        return { ok: true, data: { ...p, terbayar: baruTerbayar, status: statusBaru } };
    });
}

export async function rekapJasaMedis(fasyankes_id, { dari, sampai } = {}, koneksi = pool) {
    const kondisi = ['i.`fasyankes_id` = ?', 'k.`fasyankes_id` = ?', '(tl.`jasa_dpjp` > 0 OR tl.`jasa_perawat` > 0 OR tl.`jasa_klinik` > 0)'];
    const param = [fasyankes_id, fasyankes_id, fasyankes_id];
    if (dari) { kondisi.push('DATE(i.`dibuat_pada`) >= ?'); param.push(dari); }
    if (sampai) { kondisi.push('DATE(i.`dibuat_pada`) <= ?'); param.push(sampai); }
    return baca(
        `SELECT COALESCE(u.\`nama\`, 'Belum ditentukan') AS praktisi_nama, COALESCE(dp.\`dpjp_id\`, i.\`dibuat_oleh\`) AS dpjp_id, COUNT(i.\`id\`) AS jumlah_item, SUM(i.\`jumlah\` * tl.\`jasa_dpjp\`) AS total_jasa_dpjp, SUM(i.\`jumlah\` * tl.\`jasa_perawat\`) AS total_jasa_perawat, SUM(i.\`jumlah\` * tl.\`jasa_klinik\`) AS total_jasa_klinik FROM \`item_tagihan\` i JOIN \`tagihan\` t ON t.\`id\` = i.\`tagihan_id\` JOIN \`kunjungan\` k ON k.\`id\` = t.\`kunjungan_id\` JOIN \`tarif_layanan\` tl ON tl.\`id\` = i.\`tarif_layanan_id\` LEFT JOIN (SELECT \`kunjungan_id\`, MIN(\`pengguna_id\`) AS dpjp_id FROM \`peserta_kunjungan\` WHERE \`fasyankes_id\` = ? AND \`tipe\` = 'ATND' GROUP BY \`kunjungan_id\`) dp ON dp.\`kunjungan_id\` = k.\`id\` LEFT JOIN \`pengguna\` u ON u.\`id\` = COALESCE(dp.\`dpjp_id\`, i.\`dibuat_oleh\`) WHERE ${kondisi.join(' AND ')} GROUP BY COALESCE(dp.\`dpjp_id\`, i.\`dibuat_oleh\`), u.\`nama\` ORDER BY total_jasa_dpjp DESC`,
        param,
        koneksi,
    );
}

export async function daftarTarifJasa(fasyankes_id, koneksi = pool) {
    return baca(
        'SELECT `id`, `kode`, `nama`, `jenis`, `harga_umum`, `jasa_klinik`, `jasa_dpjp`, `jasa_perawat` FROM `tarif_layanan` WHERE `fasyankes_id` = ? AND `aktif` = true ORDER BY `nama` ASC LIMIT 200',
        [fasyankes_id],
        koneksi,
    );
}

export async function simpanTarifJasa(fasyankes_id, tarif_id, { jasa_klinik, jasa_dpjp, jasa_perawat }, koneksi = pool) {
    const res = await tulis(
        'UPDATE `tarif_layanan` SET `jasa_klinik` = ?, `jasa_dpjp` = ?, `jasa_perawat` = ? WHERE `id` = ? AND `fasyankes_id` = ?',
        [jasa_klinik, jasa_dpjp, jasa_perawat, tarif_id, fasyankes_id],
        koneksi,
    );
    if (!res.affectedRows) return null;
    const rows = await baca('SELECT `id`, `kode`, `nama`, `jenis`, `harga_umum`, `jasa_klinik`, `jasa_dpjp`, `jasa_perawat` FROM `tarif_layanan` WHERE `id` = ? LIMIT 1', [tarif_id], koneksi);
    return rows[0] ?? null;
}

export async function ringkasanKeuangan(fasyankes_id, { dari, sampai } = {}, koneksi = pool) {
    await pastikanCoaBawaan(fasyankes_id, koneksi);
    const kondisiJ = ['j.`fasyankes_id` = ?'];
    const paramJ = [fasyankes_id];
    if (dari) { kondisiJ.push('j.`tanggal` >= ?'); paramJ.push(dari); }
    if (sampai) { kondisiJ.push('j.`tanggal` <= ?'); paramJ.push(sampai); }

    const perAkun = await baca(
        `SELECT a.\`kode\`, a.\`nama\`, a.\`tipe\`, COALESCE(SUM(d.\`debit\`), 0) AS total_debit, COALESCE(SUM(d.\`kredit\`), 0) AS total_kredit FROM \`akun_keuangan\` a LEFT JOIN \`detail_jurnal\` d ON d.\`fasyankes_id\` = a.\`fasyankes_id\` AND d.\`akun_kode\` = a.\`kode\` LEFT JOIN \`jurnal\` j ON j.\`id\` = d.\`jurnal_id\` AND ${kondisiJ.join(' AND ')} WHERE a.\`fasyankes_id\` = ? GROUP BY a.\`id\`, a.\`kode\`, a.\`nama\`, a.\`tipe\` ORDER BY a.\`kode\` ASC`,
        [...paramJ, fasyankes_id],
        koneksi,
    );

    const pendapatan = perAkun.filter((a) => a.tipe === 'pendapatan').reduce((s, a) => s + (Number(a.total_kredit) - Number(a.total_debit)), 0);
    const beban = perAkun.filter((a) => a.tipe === 'beban').reduce((s, a) => s + (Number(a.total_debit) - Number(a.total_kredit)), 0);
    const kasMasuk = perAkun.filter((a) => a.kode === '1101' || a.kode === '1102').reduce((s, a) => s + Number(a.total_debit), 0);
    const kasKeluar = perAkun.filter((a) => a.kode === '1101' || a.kode === '1102').reduce((s, a) => s + Number(a.total_kredit), 0);

    const [piutangRow, hutangRow] = await Promise.all([
        baca('SELECT COALESCE(SUM(`total` - `terbayar`), 0) AS sisa FROM `piutang_kunjungan` WHERE `fasyankes_id` = ? AND `status` != \'lunas\'', [fasyankes_id], koneksi),
        baca('SELECT COALESCE(SUM(`total` - `terbayar`), 0) AS sisa FROM `faktur_supplier` WHERE `fasyankes_id` = ? AND `status` != \'lunas\'', [fasyankes_id], koneksi),
    ]);

    return {
        laba_rugi: { pendapatan, beban, laba_bersih: pendapatan - beban },
        arus_kas: { masuk: kasMasuk, keluar: kasKeluar, bersih: kasMasuk - kasKeluar },
        total_piutang: Number(piutangRow[0]?.sisa ?? 0),
        total_hutang: Number(hutangRow[0]?.sisa ?? 0),
        per_akun: perAkun.map((a) => ({ ...a, total_debit: Number(a.total_debit), total_kredit: Number(a.total_kredit) })),
    };
}
