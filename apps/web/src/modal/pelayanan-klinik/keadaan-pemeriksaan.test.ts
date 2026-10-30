import type { BagianKlinis, KlinisKunjunganDto, SalinanKunjunganDto } from '@klira/shared';
import { BAGIAN_KLINIS } from '@klira/shared';
import {
  langkahDraf, bagianLangkah, adaPerubahanBagian, awalKeadaan, bagianDapatDisalin, bagianDiModal, bagianKosong, dariInputLokal, daftarAlergi, daftarLangkah, disahkanDari, galatBagian,
  hapusDiagnosis, hapusTindakan, isiBagian, isiTemplatDari, jadikanUtama, keadaanDariServer, keInputLokal, LANGKAH_PEMERIKSAAN, pakaiTemplat, perluAlasan, perluDisimpan,
  pulihkanKeadaan, rencanaSimpan, ringkasanIsi, ringkasTandaVital, salinKeKeadaan, statusRingkasan, syaratSelesaiTerpenuhi, tambahDiagnosis, tambahTindakan,
} from './keadaan-pemeriksaan';

const bagianKosongServer = (): KlinisKunjunganDto['bagian'] =>
  Object.fromEntries(BAGIAN_KLINIS.map((b) => [b, { bagian: b, isi: null, pengesahan: null, verifikasi: 'belum_disahkan' }])) as unknown as KlinisKunjunganDto['bagian'];
const sah = { versi: 1, pengguna_id: 1, pengguna_nama: 'Dr', jenis_akun: 'Dokter', waktu: '2026-10-25T00:00:00Z', hash: 'h' };
const sahkan = (b: KlinisKunjunganDto['bagian'], bagian: BagianKlinis, isi: unknown) => {
  (b as Record<string, unknown>)[bagian] = { bagian, isi, pengesahan: sah, verifikasi: 'sah' };
  return b;
};

describe('langkah dari konfigurasi', () => {
  it('pemeriksaan memuat enam kelompok SOAPIE dan ringkasan', () => {
    expect(LANGKAH_PEMERIKSAAN.map((l) => l.id)).toEqual(['subjective', 'objective', 'assessment', 'plan', 'implementasi', 'evaluasi', 'ringkasan']);
    expect(LANGKAH_PEMERIKSAAN.filter((l) => !l.aktif)).toEqual([]);
  });
  it('skrining hanya tanda vital dan ringkasan; bagian yang disimpan hanya dari langkah aktif', () => {
    expect(daftarLangkah('skrining').map((l) => l.id)).toEqual(['tanda_vital', 'ringkasan']);
    expect(bagianDiModal('skrining')).toEqual(['tanda_vital']);
    expect(bagianDiModal('periksa')).toEqual(['anamnesis', 'tanda_vital', 'pemeriksaan', 'assessment', 'diagnosis', 'plan', 'tindak_lanjut', 'implementasi', 'tindakan', 'evaluasi']);
  });
});

describe('keadaan dari server dan isi kirim', () => {
  it('bolak-balik: keadaan dari catatan tersimpan tidak dianggap berubah', () => {
    const server = sahkan(sahkan(sahkan(sahkan(bagianKosongServer(), 'anamnesis', { keluhan_utama: 'Batuk', penyerta: null, riwayat_pribadi: null, riwayat_keluarga: null, alergi: 'Penisilin' }),
      'tanda_vital', { sistolik: 150, diastolik: 95, nadi: null, suhu: 36.7, respirasi: null, spo2: null, berat_badan: null, tinggi_badan: null }),
      'diagnosis', { item: [{ kode: 'I10', nama: 'Hipertensi', peran: 'utama', snomed: null }] }),
      'tindakan', { item: [{ kode: '89.52', nama: 'EKG', performer_id: 1, mulai: '2026-10-25T01:30:00.000Z', selesai: null }] });
    const k = keadaanDariServer(server);
    expect(k.anamnesis.keluhan_utama).toBe('Batuk');
    expect(k.riwayat.alergi).toBe('Penisilin');
    expect(k.tanda_vital.suhu).toBe('36.7');
    expect(k.tanda_vital.nadi).toBe('');
    for (const b of BAGIAN_KLINIS) expect(adaPerubahanBagian(b, k, keadaanDariServer(server))).toBe(false);
    expect(isiBagian('tanda_vital', k)).toMatchObject({ sistolik: '150', nadi: '' });
    expect(isiBagian('anamnesis', k)).toMatchObject({ keluhan_utama: 'Batuk', alergi: 'Penisilin' });
    expect(disahkanDari(server)).toMatchObject({ anamnesis: true, pemeriksaan: false, diagnosis: true });
  });

  it('waktu lokal: isian datetime-local bolak-balik pada ketelitian menit', () => {
    const d = new Date(2026, 9, 25, 8, 30);
    expect(keInputLokal(d.toISOString())).toBe('2026-10-25T08:30');
    expect(dariInputLokal('2026-10-25T08:30')).toBe(d.toISOString());
    expect(dariInputLokal('')).toBe('');
    expect(dariInputLokal('bukan tanggal')).toBe('');
    expect(keInputLokal(null)).toBe('');
  });
});

describe('perubahan, validasi, dan rencana simpan', () => {
  const server = awalKeadaan();
  it('kosong dan tak berubah tidak disimpan; terisi disimpan; dikosongkan setelah disahkan tetap dikirim', () => {
    const k = awalKeadaan();
    expect(bagianKosong('anamnesis', k)).toBe(true);
    expect(perluDisimpan('anamnesis', k, server, false)).toBe(false);
    k.anamnesis.keluhan_utama = 'Batuk';
    expect(perluDisimpan('anamnesis', k, server, false)).toBe(true);
    expect(perluDisimpan('tindakan', awalKeadaan(), { ...awalKeadaan(), tindakan: [{ kode: '89.52', nama: 'EKG', mulai: '2026-10-25T08:30', selesai: '' }] }, true)).toBe(true);
    expect(perluDisimpan('tindakan', awalKeadaan(), { ...awalKeadaan(), tindakan: [{ kode: '89.52', nama: 'EKG', mulai: '2026-10-25T08:30', selesai: '' }] }, false)).toBe(false);
  });

  it('galat menurut skema bersama: tanda vital di luar rentang, diagnosis tanpa utama, rencana belum dipilih', () => {
    const k = awalKeadaan();
    k.tanda_vital.suhu = '80';
    expect(galatBagian('tanda_vital', k)).toMatch(/antara/);
    k.tanda_vital.suhu = '36,7';
    expect(galatBagian('tanda_vital', k)).toBeNull();
    k.diagnosis = [{ kode: 'I10', nama: 'x', peran: 'penyerta', snomed: '' }];
    expect(galatBagian('diagnosis', k)).toMatch(/utama/);
    expect(galatBagian('tindak_lanjut', k)).toMatch(/Pilih rencana/);
    k.tindak_lanjut.jenis = 'rujuk';
    expect(galatBagian('tindak_lanjut', k)).toMatch(/Tujuan rujukan/);
    k.tindak_lanjut.tujuan = 'RS Umum';
    expect(galatBagian('tindak_lanjut', k)).toBeNull();
    k.anamnesis.keluhan_utama = '  ';
    expect(galatBagian('anamnesis', k)).toMatch(/Wajib/);
  });

  it('rencana simpan mengikuti urutan langkah, alasan hanya bila ada bagian yang sudah disahkan, syarat selesai', () => {
    const k = awalKeadaan();
    k.anamnesis.keluhan_utama = 'Batuk';
    k.tanda_vital.nadi = '82';
    const tak = { assessment: false, plan: false, implementasi: false, evaluasi: false, anamnesis: false, tanda_vital: false, pemeriksaan: false, diagnosis: false, tindakan: false, tindak_lanjut: false };
    const r = rencanaSimpan('periksa', k, server, tak);
    expect(r.map((x) => x.bagian)).toEqual(['anamnesis', 'tanda_vital']);
    expect(perluAlasan(r, tak)).toBe(false);
    expect(perluAlasan(r, { ...tak, tanda_vital: true })).toBe(true);
    expect(syaratSelesaiTerpenuhi(tak, r)).toBe(false);
    expect(syaratSelesaiTerpenuhi({ ...tak, diagnosis: true, tindak_lanjut: true }, r)).toBe(true);
    // skrining hanya menyimpan tanda vital
    expect(rencanaSimpan('skrining', k, server, tak).map((x) => x.bagian)).toEqual(['tanda_vital']);
  });

  it('status ringkasan per bagian', () => {
    const k = awalKeadaan();
    expect(statusRingkasan('pemeriksaan', k, server, 'belum_disahkan')).toBe('belum_diisi');
    k.pemeriksaan.abdomen = 'Supel';
    expect(statusRingkasan('pemeriksaan', k, server, 'belum_disahkan')).toBe('akan_disimpan');
    expect(statusRingkasan('pemeriksaan', server, server, 'sah')).toBe('sudah_sah');
    expect(statusRingkasan('pemeriksaan', server, server, 'berubah')).toBe('berubah');
    expect(statusRingkasan('pemeriksaan', k, server, 'berubah')).toBe('akan_disimpan');
  });
});

describe('ringkasan kepala', () => {
  it('tanda vital singkat dengan koma desimal; alergi dipecah', () => {
    expect(ringkasTandaVital({ sistolik: 150, diastolik: 95, nadi: 82, suhu: 36.7, respirasi: null, spo2: 98, berat_badan: null, tinggi_badan: null })).toBe('TD 150/95 · N 82 · S 36,7 · SpO2 98%');
    expect(ringkasTandaVital(null)).toBe('');
    expect(daftarAlergi('Penisilin, Seafood; debu\n')).toEqual(['Penisilin', 'Seafood', 'debu']);
    expect(daftarAlergi(null)).toEqual([]);
  });
});

describe('diagnosis dan tindakan', () => {
  it('yang pertama utama, kode ganda tidak ditambah, utama dapat dipindah dan dihapus', () => {
    let d = tambahDiagnosis([], { kode: ' i10 ', nama: 'Hipertensi' });
    d = tambahDiagnosis(d, { kode: 'E11.9', nama: 'DM' });
    d = tambahDiagnosis(d, { kode: 'I10', nama: 'ganda' });
    expect(d.map((x) => [x.kode, x.peran])).toEqual([['I10', 'utama'], ['E11.9', 'penyerta']]);
    d = jadikanUtama(d, 'E11.9');
    expect(d.map((x) => x.peran)).toEqual(['penyerta', 'utama']);
    d = hapusDiagnosis(d, 'E11.9');
    expect(d.map((x) => [x.kode, x.peran])).toEqual([['I10', 'utama']]);
    expect(hapusDiagnosis(d, 'I10')).toEqual([]);
  });
  it('tindakan: waktu mulai sekarang, ganda tidak ditambah', () => {
    const t = tambahTindakan([], { kode: '89.52', nama: 'EKG' }, new Date(2026, 9, 25, 9, 5));
    expect(t).toEqual([{ kode: '89.52', nama: 'EKG', mulai: '2026-10-25T09:05', selesai: '' }]);
    expect(tambahTindakan(t, { kode: '89.52', nama: 'EKG' }, new Date())).toHaveLength(1);
    expect(hapusTindakan(t, '89.52')).toEqual([]);
  });
});

describe('penyalinan dari kunjungan sebelumnya', () => {
  const salinan: SalinanKunjunganDto = {
    sumber: { id: 3, mulai: '2026-10-01T00:00:00Z' },
    anamnesis: { keluhan_utama: 'Batuk lama', penyerta: null, riwayat_pribadi: 'Asma', riwayat_keluarga: null, alergi: 'Debu' },
    diagnosis: { item: [{ kode: 'J06.9', nama: 'ISPA', peran: 'utama', snomed: null }] },
    tindakan: null,
  };
  it('hanya bagian berisi yang dapat disalin', () => {
    expect(bagianDapatDisalin(salinan)).toEqual(['anamnesis', 'diagnosis']);
  });
  it('menyalin bagian terpilih sebagai draf tanpa menyentuh bagian lain', () => {
    const k = awalKeadaan();
    k.pemeriksaan.abdomen = 'Supel';
    k.tindakan = [{ kode: '89.52', nama: 'EKG', mulai: '2026-10-25T08:30', selesai: '' }];
    const { keadaan, jumlah } = salinKeKeadaan(k, salinan, ['anamnesis', 'diagnosis', 'tindakan'], new Date(2026, 9, 25, 9, 0));
    expect(jumlah).toBe(2);
    expect(keadaan.anamnesis.keluhan_utama).toBe('Batuk lama');
    expect(keadaan.riwayat).toEqual({ riwayat_pribadi: 'Asma', riwayat_keluarga: '', alergi: 'Debu' });
    expect(keadaan.diagnosis).toEqual([{ kode: 'J06.9', nama: 'ISPA', peran: 'utama', snomed: '' }]);
    expect(keadaan.tindakan).toHaveLength(1);
    expect(keadaan.pemeriksaan.abdomen).toBe('Supel');
    expect(salinKeKeadaan(k, salinan, ['diagnosis'], new Date()).keadaan.anamnesis.keluhan_utama).toBe('');
    // hasil salinan berstatus perubahan (belum disahkan) terhadap yang tersimpan
    expect(adaPerubahanBagian('diagnosis', keadaan, awalKeadaan())).toBe(true);
  });
});

describe('templat', () => {
  it('templat anamnesis dan pemeriksaan hanya mengganti bidang terisi; isi templat dari keadaan', () => {
    const k = awalKeadaan();
    k.anamnesis.keluhan_utama = 'lama';
    k.riwayat.alergi = 'Debu';
    const t = pakaiTemplat(k, { bagian: 'anamnesis', isi: { keluhan_utama: 'Batuk dan pilek', penyerta: 'Demam', alergi: null } });
    expect(t.anamnesis).toEqual({ keluhan_utama: 'Batuk dan pilek', penyerta: 'Demam' });
    expect(t.riwayat.alergi).toBe('Debu');
    const p = pakaiTemplat(k, { bagian: 'pemeriksaan', isi: { keadaan_umum: 'Baik' } });
    expect(p.pemeriksaan.keadaan_umum).toBe('Baik');
    expect(p.pemeriksaan.abdomen).toBe('');
    expect(isiTemplatDari('anamnesis', k)).toMatchObject({ keluhan_utama: 'lama', penyerta: null, alergi: 'Debu' });
  });
});

describe('pemulihan draf server', () => {
  it('semua bidang draf (termasuk riwayat dan hasil pemeriksaan) menimpa dasar', () => {
    const dasar = awalKeadaan();
    dasar.anamnesis.keluhan_utama = 'dari server';
    const draf = awalKeadaan();
    draf.anamnesis.keluhan_utama = 'dari draf';
    draf.riwayat.alergi = 'Debu';
    draf.pemeriksaan.catatan = 'Paru bersih';
    draf.tanda_vital.suhu = '37,2';
    draf.diagnosis = tambahDiagnosis([], { kode: 'I10', nama: 'Hipertensi' });
    draf.alasan = 'Koreksi';
    const hasil = pulihkanKeadaan(dasar, JSON.parse(JSON.stringify(draf)));
    expect(hasil).toEqual(draf);
  });
  it('draf rusak atau bentuk tidak sesuai tidak merusak dasar', () => {
    const dasar = awalKeadaan();
    expect(pulihkanKeadaan(dasar, null)).toBe(dasar);
    expect(pulihkanKeadaan(dasar, 'x')).toBe(dasar);
    expect(pulihkanKeadaan(dasar, [])).toBe(dasar);
    const h = pulihkanKeadaan(dasar, { anamnesis: 'bukan objek', diagnosis: [1, null, { kode: 'I10', nama: 'x', peran: 'utama', snomed: '' }], tanda_vital: { suhu: 5, nadi: '80' }, alasan: 7 });
    expect(h.anamnesis).toEqual(dasar.anamnesis);
    expect(h.diagnosis).toHaveLength(1);
    expect(h.tanda_vital.suhu).toBe('');
    expect(h.tanda_vital.nadi).toBe('80');
    expect(h.alasan).toBe('');
  });
});

describe('isi ringkasan', () => {
  it('menampilkan SPRI rawat inap dan waktu tindakan tanpa mengubah waktu lokal', () => {
    const k = awalKeadaan();
    k.tindak_lanjut = { jenis: 'rawat_inap', tujuan: 'Bangsal A', spri: 'SPRI-123', catatan: '' };
    k.tindakan = [{ kode: '89.52', nama: 'EKG', mulai: '2026-10-30T09:00', selesai: '2026-10-30T09:15' }];
    const r = ringkasanIsi(k);
    expect(r[3].baris).toEqual(expect.arrayContaining([expect.objectContaining({ nilai: 'SPRI-123' })]));
    expect(r[4].baris).toEqual(expect.arrayContaining([
      expect.objectContaining({ nilai: '2026-10-30 09:00' }),
      expect.objectContaining({ nilai: '2026-10-30 09:15' }),
    ]));
    k.tindak_lanjut.jenis = 'pulang';
    expect(ringkasanIsi(k)[3].baris).not.toEqual(expect.arrayContaining([expect.objectContaining({ nilai: 'SPRI-123' })]));
  });

  it('memuat keluhan, alergi, diagnosis beserta peran, tindakan, dan rencana', () => {
    const k = awalKeadaan();
    k.anamnesis.keluhan_utama = 'Batuk';
    k.diagnosis = tambahDiagnosis([], { kode: 'I10', nama: 'Hipertensi' });
    k.tindak_lanjut = { jenis: 'rujuk', tujuan: 'RS Umum', spri: '', catatan: '' };
    const r = ringkasanIsi(k);
    expect(r[0].baris).toEqual(expect.arrayContaining([{ label: 'Keluhan utama', nilai: 'Batuk' }, { label: 'Alergi', nilai: '-' }]));
    expect(r[2].baris).toEqual(expect.arrayContaining([{ label: 'I10', nilai: 'Hipertensi (Utama)' }]));
    expect(r[3].baris).toEqual(expect.arrayContaining([{ label: 'Tindak lanjut', nilai: 'Rujuk keluar' }, { label: 'Tujuan rujukan', nilai: 'RS Umum' }]));
  });
});

describe('SOAPIE: kompatibilitas dan narasi', () => {
  it('memetakan draf lama ke kelompok baru dan mempertahankan draf versi baru', () => {
    expect(langkahDraf('periksa', 4, {})).toBe(4);
    expect(langkahDraf('periksa', 5, {})).toBe(3);
    expect(langkahDraf('periksa', 8, {})).toBe(6);
    expect(langkahDraf('periksa', 5, { versi_draf: 2 })).toBe(5);
    expect(langkahDraf('skrining', 1, {})).toBe(1);
    expect(bagianLangkah(LANGKAH_PEMERIKSAAN[1])).toEqual(['tanda_vital', 'pemeriksaan']);
  });

  it('memulihkan narasi, menyimpan perubahan dan pengosongan sebagai koreksi', () => {
    const b = sahkan(bagianKosongServer(), 'implementasi', { isi: 'Luka dibersihkan' });
    const awal = keadaanDariServer(b);
    expect(awal.implementasi).toBe('Luka dibersihkan');
    expect(awal.evaluasi).toBe('');
    const k = pulihkanKeadaan(awal, { evaluasi: 'Nyeri berkurang' });
    expect(isiBagian('evaluasi', k)).toEqual({ isi: 'Nyeri berkurang' });
    expect(rencanaSimpan('periksa', k, awal, disahkanDari(b)).map((r) => r.bagian)).toEqual(['evaluasi']);
    k.implementasi = '';
    const r = rencanaSimpan('periksa', k, awal, disahkanDari(b));
    expect(r.find((x) => x.bagian === 'implementasi')).toEqual({ bagian: 'implementasi', galat: null });
    expect(perluAlasan(r, disahkanDari(b))).toBe(true);
    expect(galatBagian('evaluasi', { ...k, evaluasi: 'x'.repeat(10001) })).not.toBeNull();
  });

  it('I/E kosong tidak membuat rencana simpan dan tidak menghalangi syarat selesai lama', () => {
    const k = awalKeadaan();
    const disahkan = disahkanDari(bagianKosongServer());
    expect(rencanaSimpan('periksa', k, awalKeadaan(), disahkan)).toEqual([]);
    expect(syaratSelesaiTerpenuhi({ ...disahkan, anamnesis: true, diagnosis: true, tindak_lanjut: true }, [])).toBe(true);
    expect(ringkasanIsi(k).map((r) => r.judul)).toEqual(['S — Subjective', 'O — Objective', 'A — Assessment', 'P — Plan', 'I — Implementation', 'E — Evaluation']);
  });
});


describe('draf order lab bersama pemeriksaan', () => {
  it('pilihan awal kosong dan draf menyimpan pilihan, prioritas, dan catatan lab', () => {
    const awal = awalKeadaan();
    expect(awal.lab_dipilih).toBe(false);
    expect(awal.order_lab.pemeriksaan).toEqual([]);
    const draf = { ...awal, lab_dipilih: true, order_lab: { pemeriksaan: [7, 9], prioritas: 'segera' as const, catatan: 'Puasa' } };
    expect(pulihkanKeadaan(awal, JSON.parse(JSON.stringify(draf)))).toEqual(draf);
  });
  it('draf lama dan pilihan rusak dipulihkan dengan aman', () => {
    expect(pulihkanKeadaan(awalKeadaan(), { plan: 'Kontrol' }).order_lab.pemeriksaan).toEqual([]);
    const k = pulihkanKeadaan(awalKeadaan(), { lab_dipilih: 'ya', order_lab: { pemeriksaan: [1, 1, -1, '2', null, 3.5], prioritas: 'rusak', catatan: 12 } });
    expect(k.lab_dipilih).toBe(false);
    expect(k.order_lab).toEqual({ pemeriksaan: [1], prioritas: 'rutin', catatan: '' });
  });
});


test('draf resep dipulihkan termasuk jumlah dan aturan pakai, draf lama tetap tanpa resep', () => {
  const awal = awalKeadaan();
  const draf = { ...awal, resep: [{ master_obat_id: '7', jumlah: '10', aturan_pakai: '2 x 1', bentuk: 'tablet', rute: 'oral' }] };
  expect(pulihkanKeadaan(awal, JSON.parse(JSON.stringify(draf)))).toEqual(draf);
  expect(pulihkanKeadaan(awal, { plan: 'Kontrol' }).resep).toEqual(awal.resep);
  expect(pulihkanKeadaan(awal, { resep: [null, 1, { master_obat_id: '7', jumlah: 12 }] }).resep).toEqual([{ ...awal.resep[0], master_obat_id: '7' }]);
});


test('ringkasan Plan mengikuti urutan formulir dan menyembunyikan rincian rujukan yang tidak berlaku', () => {
  const k = awalKeadaan();
  k.plan = 'Kontrol ulang';
  k.tindak_lanjut = { jenis: 'pulang', tujuan: 'Tujuan lama', spri: 'SPRI-lama', catatan: '' };
  const p = ringkasanIsi(k)[3];
  expect(p.baris[0]).toEqual({ label: 'Tindak lanjut', nilai: 'Pulang' });
  expect(p.baris[1]).toEqual({ label: 'Rencana pelayanan', nilai: 'Kontrol ulang' });
  expect(p.baris).not.toEqual(expect.arrayContaining([expect.objectContaining({ nilai: 'Tujuan lama' }), expect.objectContaining({ nilai: 'SPRI-lama' })]));
});
