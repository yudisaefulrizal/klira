import { INTERPRETASI_HASIL } from '@klira/shared';

/** Apakah ada minimal satu order lab pada kunjungan ini yang sudah divalidasi dan siap dicetak. */
export const bisaCetakHasilLab = (orders) => Array.isArray(orders) && orders.some((o) => o.status === 'divalidasi' && !!o.hasil);

/** Menyusun data lembar cetak hasil laboratorium dari daftar order, identitas pasien, dan ringkasan kunjungan (fungsi murni, tanpa DOM). */
export function susunLembarHasilLab({ orders = [], pasien = {}, kunjungan = {}, klinik = '' }) {
    const valid = orders.filter((o) => o.status === 'divalidasi' && !!o.hasil);
    const spesimen = valid.map((o) => o.spesimen).filter(Boolean).sort((a, b) => (a.waktu_ambil ?? '').localeCompare(b.waktu_ambil ?? ''))[0] ?? null;
    const hasilValid = valid.map((o) => o.hasil).filter((h) => h?.divalidasi_pada || h?.validator_nama).sort((a, b) => (b.divalidasi_pada ?? '').localeCompare(a.divalidasi_pada ?? ''))[0] ?? null;
    const asalUnik = [...new Set(valid.map((o) => o.spesimen?.asal).filter(Boolean))];
    return {
        klinik: klinik || kunjungan.fasyankes_nama || '',
        kunjunganId: kunjungan.id ?? null,
        mulai: kunjungan.mulai ?? null,
        poli: kunjungan.poli_nama ?? (kunjungan.jenis === 'LAB' ? 'Laboratorium' : null),
        pengirim: kunjungan.dpjp_nama ?? kunjungan.perujuk ?? null,
        caraPembayaran: kunjungan.cara_pembayaran ?? null,
        pasien: {
            nama: pasien.nama ?? kunjungan.pasien_nama ?? '-',
            nomorRm: pasien.nomor_rm ?? kunjungan.pasien_nomor_rm ?? '-',
            nik: pasien.nik ?? null,
            tanggalLahir: pasien.tanggal_lahir ?? null,
            jenisKelamin: pasien.jenis_kelamin ?? null,
        },
        spesimenAsal: asalUnik.join(', ') || null,
        waktuSpesimen: spesimen?.waktu_ambil ?? null,
        validator: hasilValid?.validator_nama ?? null,
        waktuValidasi: hasilValid?.divalidasi_pada ?? null,
        baris: valid.map((o) => {
            const interp = o.hasil.interpretasi ?? null;
            const tidakNormal = !!interp && interp !== 'normal';
            return {
                id: o.id,
                nama: o.nama,
                kodeLoinc: o.kode_loinc ?? null,
                nilai: o.hasil.nilai,
                satuan: o.hasil.satuan ?? o.satuan ?? null,
                rujukan: o.hasil.rujukan_teks ?? o.rujukan_teks ?? null,
                interpretasi: interp ? INTERPRETASI_HASIL.label(interp) : '-',
                keterangan: o.hasil.catatan ?? null,
                tebal: tidakNormal,
            };
        }),
    };
}
