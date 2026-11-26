import { baca, pool } from '../koneksi.js';

const ATURAN_DOMAIN = [
    { id: 'keuangan', label: 'Kasir, Klaim & Keuangan', warna: 'hijau', pola: /^(tagihan|item_tagihan|pembayaran|shift_kasir|klaim|riwayat_klaim|akun_keuangan|jurnal|detail_jurnal|pengeluaran_operasional|faktur_supplier|bayar_hutang_supplier|piutang_kunjungan|bayar_piutang)$/ },
    { id: 'farmasi', label: 'Farmasi & Obat', warna: 'ungu', pola: /^(master_obat|stok_obat|mutasi_stok|resep|item_resep|telaah_resep|pengeluaran_obat|kfa_lokal)$/ },
    { id: 'klinis', label: 'Klinis & Rekam Medis', warna: 'biru', pola: /^(pemeriksaan|diagnosis|narasi_klinis|observasi|odontogram_pasien|kia_kunjungan|ugd_kunjungan|resume_medis|addendum|surat|pengesahan_catatan|tindak_lanjut|riwayat_tahap_layanan|draf|favorit_dokter|templat_catatan)$/ },
    { id: 'penunjang', label: 'Lab & Rawat Inap', warna: 'kuning', pola: /^(master_pemeriksaan|order_penunjang|spesimen|hasil_penunjang|penyerahan_hasil|penempatan|pemulangan|tarif_layanan|ruang|bed)$/ },
    { id: 'pasien', label: 'Pasien & Antrean', warna: 'biru', pola: /^(pasien|keluarga_pasien|kunjungan|peserta_kunjungan|antrean|sesi|sesi_antrean|lokasi|jadwal_praktik|pengaturan_antrean_jkn|antrean_sementara_jkn)$/ },
    { id: 'integrasi', label: 'Integrasi & Eksternal', warna: 'abu', pola: /^(kredensial_pcare|pemetaan_bpjs|ig_|event_panggilan|kode_terminologi|wilayah)/ },
];

function tebakDomain(namaTabel) {
    for (const d of ATURAN_DOMAIN) {
        if (d.pola.test(namaTabel)) return d.id;
    }
    return 'akses';
}

const PETA_KOLOM_IMPLICIT = {
    pasien_id: 'pasien',
    kunjungan_id: 'kunjungan',
    kunjungan_asal_id: 'kunjungan',
    lokasi_id: 'lokasi',
    ruang_id: 'lokasi',
    antrean_id: 'antrean',
    sesi_id: 'sesi_antrean',
    tagihan_id: 'tagihan',
    tarif_layanan_id: 'tarif_layanan',
    resep_id: 'resep',
    item_resep_id: 'item_resep',
    master_obat_id: 'master_obat',
    obat_id: 'master_obat',
    order_penunjang_id: 'order_penunjang',
    master_pemeriksaan_id: 'master_pemeriksaan',
    klaim_id: 'klaim',
    faktur_id: 'faktur_supplier',
    piutang_id: 'piutang_kunjungan',
    jurnal_id: 'jurnal',
    jenis_akun_id: 'jenis_akun',
    izin_id: 'izin',
    pengguna_id: 'pengguna',
    dpjp_id: 'pengguna',
    dokter_id: 'pengguna',
    pelaksana_id: 'pengguna',
    kasir_id: 'pengguna',
    dibuat_oleh: 'pengguna',
};

/** Membaca struktur tabel, kolom, jumlah baris, dan relasi langsung dari MySQL information_schema. */
export async function bacaSkemaDatabase(koneksi = pool) {
    const [tabelRows, kolomRows, fkRows] = await Promise.all([
        baca(
            "SELECT `TABLE_NAME` AS nama, `TABLE_ROWS` AS estimasi_baris, `TABLE_COMMENT` AS komentar FROM `information_schema`.`TABLES` WHERE `TABLE_SCHEMA` = DATABASE() AND `TABLE_NAME` != '_migrasi' ORDER BY `TABLE_NAME` ASC",
            [],
            koneksi,
        ),
        baca(
            "SELECT `TABLE_NAME` AS tabel, `COLUMN_NAME` AS kolom, `COLUMN_TYPE` AS tipe, `IS_NULLABLE` AS nullable, `COLUMN_KEY` AS kunci FROM `information_schema`.`COLUMNS` WHERE `TABLE_SCHEMA` = DATABASE() AND `TABLE_NAME` != '_migrasi' ORDER BY `TABLE_NAME` ASC, `ORDINAL_POSITION` ASC",
            [],
            koneksi,
        ),
        baca(
            "SELECT `TABLE_NAME` AS dari_tabel, `COLUMN_NAME` AS dari_kolom, `REFERENCED_TABLE_NAME` AS ke_tabel, `REFERENCED_COLUMN_NAME` AS ke_kolom FROM `information_schema`.`KEY_COLUMN_USAGE` WHERE `TABLE_SCHEMA` = DATABASE() AND `REFERENCED_TABLE_NAME` IS NOT NULL",
            [],
            koneksi,
        ),
    ]);

    const namaSet = new Set(tabelRows.map((t) => t.nama));
    const kolomPerTabel = new Map();
    for (const c of kolomRows) {
        if (!kolomPerTabel.has(c.tabel)) kolomPerTabel.set(c.tabel, []);
        kolomPerTabel.get(c.tabel).push({
            nama: c.kolom,
            tipe: c.tipe,
            nullable: c.nullable === 'YES',
            kunci: c.kunci || '',
        });
    }

    const relasiMap = new Map();
    for (const fk of fkRows) {
        const key = `${fk.dari_tabel}.${fk.dari_kolom}->${fk.ke_tabel}.${fk.ke_kolom}`;
        relasiMap.set(key, { ...fk, jenis: 'fk' });
    }
    for (const c of kolomRows) {
        if (c.tabel === '_migrasi') continue;
        const target = PETA_KOLOM_IMPLICIT[c.kolom] || (c.kolom.endsWith('_id') ? c.kolom.slice(0, -3) : null);
        if (target && target !== c.tabel && namaSet.has(target)) {
            const key = `${c.tabel}.${c.kolom}->${target}.id`;
            if (!relasiMap.has(key)) {
                relasiMap.set(key, {
                    dari_tabel: c.tabel,
                    dari_kolom: c.kolom,
                    ke_tabel: target,
                    ke_kolom: 'id',
                    jenis: 'konvensi',
                });
            }
        }
    }

    const tabel = tabelRows.map((t) => ({
        nama: t.nama,
        domain: tebakDomain(t.nama),
        estimasi_baris: Number(t.estimasi_baris ?? 0),
        kolom: kolomPerTabel.get(t.nama) ?? [],
    }));

    const domain = [
        ...ATURAN_DOMAIN.map(({ id, label, warna }) => ({ id, label, warna })),
        { id: 'akses', label: 'Akses, PDP & Audit', warna: 'merah' },
    ];

    return {
        domain,
        tabel,
        relasi: [...relasiMap.values()],
    };
}
