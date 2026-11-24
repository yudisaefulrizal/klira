import { gagal } from '../../../umum/hasil.js';

const rp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

/** Layanan Keuangan & Akuntansi (pengeluaran, hutang supplier, piutang, jasa medis, COA & jurnal). */
export function buatLayananKeuangan({ repo, audit }) {
    const catat = (p, aksi, entitas, id, keterangan, alamat) =>
        audit.catat({ pengguna_id: p.id, aksi, entitas, entitas_id: id, keterangan, alamat });

    return {
        async ringkasan(p, filter) {
            const data = await repo.ringkasanKeuangan(filter);
            return { ok: true, data };
        },

        async daftarCoa() {
            return { ok: true, data: await repo.daftarCoa() };
        },

        async tambahCoa(p, masukan, alamat) {
            try {
                const data = await repo.tambahCoa(masukan);
                await catat(p, 'input', 'akun_keuangan', data?.id ?? null, `Menambah akun COA ${masukan.kode} (${masukan.nama})`, alamat);
                return { ok: true, data };
            } catch (e) {
                if (e?.code === 'ER_DUP_ENTRY') {
                    return gagal('duplikat', `Kode akun ${masukan.kode} sudah terdaftar.`);
                }
                throw e;
            }
        },

        async daftarJurnal(filter) {
            return { ok: true, data: await repo.daftarJurnal(filter) };
        },

        async catatJurnalManual(p, masukan, alamat) {
            const totalDebit = masukan.baris.reduce((s, b) => s + Number(b.debit || 0), 0);
            const totalKredit = masukan.baris.reduce((s, b) => s + Number(b.kredit || 0), 0);
            if (totalDebit <= 0 || totalDebit !== totalKredit) {
                return gagal('tidak_seimbang', 'Total debit harus sama dengan total kredit dan lebih dari 0.');
            }
            const data = await repo.catatJurnal({
                tanggal: masukan.tanggal,
                sumber: 'manual',
                keterangan: masukan.keterangan,
                baris: masukan.baris,
                dibuat_oleh: p.id,
            });
            await catat(p, 'input', 'jurnal', data.id, `Jurnal manual ${data.nomor}: ${masukan.keterangan} (${rp(data.total)})`, alamat);
            return { ok: true, data };
        },

        async daftarPengeluaran(filter) {
            return { ok: true, data: await repo.daftarPengeluaran(filter) };
        },

        async tambahPengeluaran(p, masukan, alamat) {
            const data = await repo.tambahPengeluaran(masukan, p.id);
            await catat(p, 'input', 'pengeluaran_operasional', data.id, `Pengeluaran ${masukan.kategori} ${rp(masukan.jumlah)}: ${masukan.keterangan}`, alamat);
            return { ok: true, data };
        },

        async daftarHutang(p) {
            return { ok: true, data: await repo.daftarFakturSupplier() };
        },

        async tambahFakturSupplier(p, masukan, alamat) {
            const data = await repo.tambahFakturSupplier(masukan, p.id);
            await catat(p, 'input', 'faktur_supplier', data.id, `Faktur supplier ${masukan.nomor_faktur} (${masukan.supplier}) ${rp(masukan.total)}`, alamat);
            return { ok: true, data };
        },

        async bayarHutang(p, fakturId, masukan, alamat) {
            const h = await repo.bayarHutangSupplier(fakturId, masukan, p.id);
            if (!h.ok) {
                if (h.sebab === 'tidak_ada') return gagal('tidak_ditemukan', 'Faktur supplier tidak ditemukan.');
                if (h.sebab === 'sudah_lunas') return gagal('konflik', 'Faktur supplier sudah lunas.');
                return gagal('masukan_tidak_valid', `Jumlah bayar melebihi sisa hutang (${rp(h.sisa)}).`);
            }
            await catat(p, 'input', 'bayar_hutang_supplier', fakturId, `Bayar hutang faktur ${h.data.nomor_faktur} sebesar ${rp(masukan.jumlah)}`, alamat);
            return { ok: true, data: h.data };
        },

        async daftarPiutang() {
            return { ok: true, data: await repo.daftarPiutang() };
        },

        async tambahPiutang(p, masukan, alamat) {
            const h = await repo.tambahPiutang(masukan, p.id);
            if (!h.ok) return gagal('tidak_ditemukan', 'Kunjungan tidak ditemukan.');
            await catat(p, 'input', 'piutang_kunjungan', h.id, `Mencatat piutang kunjungan #${masukan.kunjungan_id} (${masukan.penjamin}) ${rp(masukan.total)}`, alamat);
            return { ok: true, data: { id: h.id } };
        },

        async bayarPiutang(p, piutangId, masukan, alamat) {
            const h = await repo.bayarPiutang(piutangId, masukan, p.id);
            if (!h.ok) {
                if (h.sebab === 'tidak_ada') return gagal('tidak_ditemukan', 'Data piutang tidak ditemukan.');
                if (h.sebab === 'sudah_lunas') return gagal('konflik', 'Piutang sudah lunas.');
                return gagal('masukan_tidak_valid', `Jumlah bayar melebihi sisa piutang (${rp(h.sisa)}).`);
            }
            await catat(p, 'input', 'bayar_piutang', piutangId, `Pelunasan piutang kunjungan #${h.data.kunjungan_id} sebesar ${rp(masukan.jumlah)}`, alamat);
            return { ok: true, data: h.data };
        },

        async jasaMedis(p, filter) {
            return { ok: true, data: await repo.rekapJasaMedis(filter) };
        },

        async daftarTarifJasa() {
            return { ok: true, data: await repo.daftarTarifJasa() };
        },

        async simpanTarifJasa(p, tarifId, masukan, alamat) {
            const data = await repo.simpanTarifJasa(tarifId, masukan);
            if (!data) return gagal('tidak_ditemukan', 'Tarif layanan tidak ditemukan.');
            await catat(p, 'ubah', 'tarif_layanan', tarifId, `Mengatur komponen jasa tarif ${data.nama} (klinik=${masukan.jasa_klinik}, dpjp=${masukan.jasa_dpjp}, perawat=${masukan.jasa_perawat})`, alamat);
            return { ok: true, data };
        },
    };
}
