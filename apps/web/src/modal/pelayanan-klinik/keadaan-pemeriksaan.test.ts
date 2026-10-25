import type { BagianKlinis, KlinisKunjunganDto, SalinanKunjunganDto } from '@klira/shared';
import { BAGIAN_KLINIS } from '@klira/shared';
import {
  adaPerubahanBagian, awalKeadaan, bagianDapatDisalin, bagianDiModal, bagianKosong, BIDANG_SENSITIF_PEMERIKSAAN, dariInputLokal, daftarAlergi, daftarLangkah, disahkanDari, galatBagian,
  hapusDiagnosis, hapusTindakan, isiBagian, isiTemplatDari, jadikanUtama, keadaanDariServer, keInputLokal, LANGKAH_PEMERIKSAAN, pakaiTemplat, perluAlasan, perluDisimpan,
  rencanaSimpan, ringkasanIsi, ringkasTandaVital, salinKeKeadaan, statusRingkasan, syaratSelesaiTerpenuhi, tambahDiagnosis, tambahTindakan,
} from './keadaan-pemeriksaan';

const bagianKosongServer = (): KlinisKunjunganDto['bagian'] =>
  Object.fromEntries(BAGIAN_KLINIS.map((b) => [b, { bagian: b, isi: null, pengesahan: null, verifikasi: 'belum_disahkan' }])) as unknown as KlinisKunjunganDto['bagian'];
const sah = { versi: 1, pengguna_id: 1, pengguna_nama: 'Dr', jenis_akun: 'Dokter', waktu: '2026-10-25T00:00:00Z', hash: 'h' };
const sahkan = (b: KlinisKunjunganDto['bagian'], bagian: BagianKlinis, isi: unknown) => {
  (b as Record<string, unknown>)[bagian] = { bagian, isi, pengesahan: sah, verifikasi: 'sah' };
  return b;
};

describe('langkah dari konfigurasi', () => {
  it('pemeriksaan memuat sembilan langkah berurutan; resep dan penunjang belum aktif (menyusul)', () => {
    expect(LANGKAH_PEMERIKSAAN.map((l) => l.id)).toEqual(['anamnesis', 'tanda_vital', 'pemeriksaan', 'diagnosis', 'tindakan', 'resep', 'penunjang', 'tindak_lanjut', 'ringkasan']);
    expect(LANGKAH_PEMERIKSAAN.filter((l) => !l.aktif).map((l) => l.menyusul)).toEqual(['resep', 'penunjang']);
  });
  it('skrining hanya tanda vital dan ringkasan; bagian yang disimpan hanya dari langkah aktif', () => {
    expect(daftarLangkah('skrining').map((l) => l.id)).toEqual(['tanda_vital', 'ringkasan']);
    expect(bagianDiModal('skrining')).toEqual(['tanda_vital']);
    expect(bagianDiModal('periksa')).toEqual(['anamnesis', 'tanda_vital', 'pemeriksaan', 'diagnosis', 'tindakan', 'tindak_lanjut']);
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
    const tak = { anamnesis: false, tanda_vital: false, pemeriksaan: false, diagnosis: false, tindakan: false, tindak_lanjut: false };
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
    expect(statusRingkasan('pemeriksaan', k, server, false)).toBe('belum_diisi');
    k.pemeriksaan.abdomen = 'Supel';
    expect(statusRingkasan('pemeriksaan', k, server, false)).toBe('akan_disimpan');
    expect(statusRingkasan('pemeriksaan', server, server, true)).toBe('sudah_sah');
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

describe('draf', () => {
  it('bidang sensitif (riwayat, hasil pemeriksaan, alasan) dikecualikan dari draf', () => {
    expect([...BIDANG_SENSITIF_PEMERIKSAAN].sort()).toEqual(['alasan', 'pemeriksaan', 'riwayat']);
    const k = awalKeadaan();
    for (const b of BIDANG_SENSITIF_PEMERIKSAAN) expect(k).toHaveProperty(b);
  });
});

describe('isi ringkasan', () => {
  it('memuat keluhan, alergi, diagnosis beserta peran, tindakan, dan rencana', () => {
    const k = awalKeadaan();
    k.anamnesis.keluhan_utama = 'Batuk';
    k.diagnosis = tambahDiagnosis([], { kode: 'I10', nama: 'Hipertensi' });
    k.tindak_lanjut = { jenis: 'rujuk', tujuan: 'RS Umum', spri: '', catatan: '' };
    const r = ringkasanIsi(k);
    expect(r[0].baris).toEqual([{ label: 'Keluhan utama', nilai: 'Batuk' }, { label: 'Alergi', nilai: '-' }]);
    expect(r[1].baris).toEqual([{ label: 'I10', nilai: 'Hipertensi (Utama)' }]);
    expect(r[3].baris).toEqual([{ label: 'Rencana', nilai: 'Rujuk keluar' }, { label: 'Tujuan rujukan', nilai: 'RS Umum' }]);
  });
});
