import type { BagianKlinis, KlinisKunjunganDto, SalinanKunjunganDto } from '@klira/shared';
import { BAGIAN_KLINIS, DEFAULT_ANAMNESIS, DEFAULT_PEMERIKSAAN, KLINIS, SKEMA_BAGIAN } from '@klira/shared';
import {
  barisPemeriksaanFisik, keadaanAwalForm, langkahDraf, bagianLangkah, VERSI_DRAF, adaPerubahanBagian, awalKeadaan, bagianDapatDisalin, bagianDiModal, bagianKosong, dariInputLokal, daftarAlergi, daftarLangkah, disahkanDari, galatBagian,
  hapusDiagnosis, hapusTindakan, isiBagian, isiTemplatDari, jadikanUtama, keadaanDariServer, keInputLokal, LANGKAH_PEMERIKSAAN, pakaiTemplat, perluAlasan, perluDisimpan,
  pulihkanKeadaan, rencanaSimpan, ringkasanIsi, ringkasTandaVital, salinKeKeadaan, statusRingkasan, syaratSelesaiTerpenuhi, tambahDiagnosis, tambahTindakan, kunciItemTindakan, ubahTindakan,
} from './keadaan-pemeriksaan';

const bagianKosongServer = (): KlinisKunjunganDto['bagian'] =>
  Object.fromEntries(BAGIAN_KLINIS.map((b) => [b, { bagian: b, isi: null, pengesahan: null, verifikasi: 'belum_disahkan' }])) as unknown as KlinisKunjunganDto['bagian'];
const sah = { versi: 1, pengguna_id: 1, pengguna_nama: 'Dr', jenis_akun: 'Dokter', waktu: '2026-10-25T00:00:00Z', hash: 'h' };
const sahkan = (b: KlinisKunjunganDto['bagian'], bagian: BagianKlinis, isi: unknown) => {
  (b as Record<string, unknown>)[bagian] = { bagian, isi, pengesahan: sah, verifikasi: 'sah' };
  return b;
};

describe('langkah dari konfigurasi', () => {
  it('pemeriksaan mengikuti urutan formulir klinik', () => {
    expect(LANGKAH_PEMERIKSAAN.map((l) => l.id)).toEqual(['anamnesis', 'pemeriksaan', 'penunjang', 'kesimpulan', 'terapi', 'tindak_lanjut', 'ringkasan']);
  });
  it('skrining: satu langkah keperawatan (tanda vital + keperawatan) dan ringkasan; bagian yang disimpan hanya dari langkah aktif', () => {
    expect(daftarLangkah('skrining').map((l) => l.id)).toEqual(['keperawatan', 'ringkasan']);
    expect(bagianDiModal('skrining')).toEqual(['tanda_vital', 'keperawatan']);
    expect(bagianDiModal('periksa')).toEqual(['keperawatan', 'anamnesis', 'tanda_vital', 'pemeriksaan', 'diagnosis', 'diagnosis_banding', 'kie', 'tindakan', 'obat_poli', 'tindak_lanjut']);
  });
});

describe('keadaan dari server dan isi kirim', () => {
  it('bolak-balik: keadaan dari catatan tersimpan tidak dianggap berubah', () => {
    const server = sahkan(sahkan(sahkan(sahkan(bagianKosongServer(), 'anamnesis', { keluhan_utama: 'Batuk', penyerta: null, riwayat_sekarang: null, riwayat_pribadi: null, riwayat_keluarga: null, kajian_sosial: null }),
      'tanda_vital', { sistolik: 150, diastolik: 95, nadi: null, suhu: 36.7, respirasi: null, spo2: null, berat_badan: null, tinggi_badan: null }),
      'diagnosis', { item: [{ kode: 'I10', nama: 'Hipertensi', peran: 'utama', snomed: null }] }),
      'tindakan', { item: [{ kode: '89.52', nama: 'EKG', performer_id: 1, mulai: '2026-10-25T01:30:00.000Z', selesai: null }] });
    const k = keadaanDariServer(server);
    expect(k.anamnesis.keluhan_utama).toBe('Batuk');
    expect(k.tanda_vital.suhu).toBe('36.7');
    expect(k.tanda_vital.nadi).toBe('');
    for (const b of BAGIAN_KLINIS) expect(adaPerubahanBagian(b, k, keadaanDariServer(server))).toBe(false);
    expect(isiBagian('tanda_vital', k)).toMatchObject({ sistolik: '150', nadi: '' });
    expect(isiBagian('anamnesis', k)).toMatchObject({ keluhan_utama: 'Batuk' });
    expect(isiBagian('anamnesis', k)).not.toHaveProperty('alergi');
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
    const tak = { diagnosis_banding: false, kie: false, obat_poli: false, anamnesis: false, tanda_vital: false, keperawatan: false, pemeriksaan: false, diagnosis: false, tindakan: false, tindak_lanjut: false };
    const r = rencanaSimpan('periksa', k, server, tak);
    expect(r.map((x) => x.bagian)).toEqual(['anamnesis', 'tanda_vital']);
    expect(perluAlasan(r, tak)).toBe(false);
    expect(perluAlasan(r, { ...tak, tanda_vital: true })).toBe(true);
    expect(syaratSelesaiTerpenuhi(tak, r)).toBe(false);
    expect(syaratSelesaiTerpenuhi({ ...tak, diagnosis: true, tindak_lanjut: true }, r)).toBe(true);
    // skrining hanya menyimpan tanda vital dan keperawatan
    expect(rencanaSimpan('skrining', k, server, tak).map((x) => x.bagian)).toEqual(['tanda_vital']);
  });

  it('status ringkasan per bagian', () => {
    const k = awalKeadaan();
    expect(statusRingkasan('pemeriksaan', k, server, 'belum_disahkan')).toBe('belum_diisi');
    k.pemeriksaan.abdomen_massa = 'Supel';
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
    expect(hapusTindakan(t, '89.52|')).toEqual([]);
  });
  it('tindakan klinik: dua tarif berkode sama boleh, pasangan kode dan tarif yang sama tidak; jumlah dan tarif dikirim', () => {
    const w = new Date(2026, 9, 25, 9, 5);
    let t = tambahTindakan([], { kode: '86.59', nama: 'Jahit luka <= 5 cm', tarif_layanan_id: 1 }, w);
    t = tambahTindakan(t, { kode: '86.59', nama: 'Jahit luka > 5 cm', tarif_layanan_id: 2 }, w);
    t = tambahTindakan(t, { kode: '86.59', nama: 'ganda', tarif_layanan_id: 2 }, w);
    t = tambahTindakan(t, { kode: '86.59', nama: 'Dari kamus' }, w);
    expect(t.map(kunciItemTindakan)).toEqual(['86.59|1', '86.59|2', '86.59|']);
    t = ubahTindakan(t, '86.59|2', { jumlah: '3' });
    const isi = isiBagian('tindakan', { ...awalKeadaan(), tindakan: t }) as { item: { tarif_layanan_id: number | null; jumlah: string | null }[] };
    expect(isi.item.map((x) => [x.tarif_layanan_id, x.jumlah])).toEqual([[1, null], [2, '3'], [null, null]]);
    expect(SKEMA_BAGIAN.tindakan.safeParse(isi).success).toBe(true);
    expect(hapusTindakan(t, '86.59|1').map(kunciItemTindakan)).toEqual(['86.59|2', '86.59|']);
  });
});

describe('penyalinan dari kunjungan sebelumnya', () => {
  const salinan: SalinanKunjunganDto = {
    sumber: { id: 3, mulai: '2026-10-01T00:00:00Z' },
    anamnesis: { keluhan_utama: 'Batuk lama', penyerta: null, riwayat_sekarang: null, riwayat_pribadi: 'Asma', riwayat_keluarga: null, kajian_sosial: null },
    diagnosis: { item: [{ kode: 'J06.9', nama: 'ISPA', peran: 'utama', snomed: null }] },
    tindakan: null,
  };
  it('hanya bagian berisi yang dapat disalin', () => {
    expect(bagianDapatDisalin(salinan)).toEqual(['anamnesis', 'diagnosis']);
  });
  it('menyalin bagian terpilih sebagai draf tanpa menyentuh bagian lain', () => {
    const k = awalKeadaan();
    k.pemeriksaan.abdomen_massa = 'Supel';
    k.tindakan = [{ kode: '89.52', nama: 'EKG', mulai: '2026-10-25T08:30', selesai: '' }];
    const { keadaan, jumlah } = salinKeKeadaan(k, salinan, ['anamnesis', 'diagnosis', 'tindakan'], new Date(2026, 9, 25, 9, 0));
    expect(jumlah).toBe(2);
    expect(keadaan.anamnesis.keluhan_utama).toBe('Batuk lama');
    expect(keadaan.riwayat).toEqual({ riwayat_pribadi: 'Asma', riwayat_keluarga: '', kajian_sosial: '' });
    expect(keadaan.diagnosis).toEqual([{ kode: 'J06.9', nama: 'ISPA', peran: 'utama', snomed: '' }]);
    expect(keadaan.tindakan).toHaveLength(1);
    expect(keadaan.pemeriksaan.abdomen_massa).toBe('Supel');
    expect(salinKeKeadaan(k, salinan, ['diagnosis'], new Date()).keadaan.anamnesis.keluhan_utama).toBe('');
    // hasil salinan berstatus perubahan (belum disahkan) terhadap yang tersimpan
    expect(adaPerubahanBagian('diagnosis', keadaan, awalKeadaan())).toBe(true);
  });
});

describe('templat', () => {
  it('templat anamnesis dan pemeriksaan hanya mengganti bidang terisi; isi templat dari keadaan', () => {
    const k = awalKeadaan();
    k.anamnesis.keluhan_utama = 'lama';
    k.riwayat.riwayat_pribadi = 'Asma';
    const t = pakaiTemplat(k, { bagian: 'anamnesis', isi: { keluhan_utama: 'Batuk dan pilek', penyerta: 'Demam' } });
    expect(t.anamnesis).toEqual({ keluhan_utama: 'Batuk dan pilek', penyerta: 'Demam', riwayat_sekarang: '' });
    expect(t.riwayat).toEqual({ riwayat_pribadi: 'Asma', riwayat_keluarga: '', kajian_sosial: '' });
    const p = pakaiTemplat(k, { bagian: 'pemeriksaan', isi: { paru_wheezing: 'ada, minimal' } });
    expect(p.pemeriksaan.paru_wheezing).toBe('ada, minimal');
    expect(p.pemeriksaan.abdomen_massa).toBe('');
    expect(isiTemplatDari('anamnesis', k)).toEqual({ keluhan_utama: 'lama', penyerta: null, riwayat_sekarang: null, riwayat_pribadi: 'Asma', riwayat_keluarga: null, kajian_sosial: null });
  });
});

describe('pemulihan draf server', () => {
  it('semua bidang draf (termasuk riwayat dan hasil pemeriksaan) menimpa dasar', () => {
    const dasar = awalKeadaan();
    dasar.anamnesis.keluhan_utama = 'dari server';
    const draf = awalKeadaan();
    draf.anamnesis.keluhan_utama = 'dari draf';
    draf.riwayat.riwayat_pribadi = 'Asma';
    draf.keperawatan.alergi = 'Debu';
    draf.keperawatan.nyeri_jenis = 'akut';
    draf.keperawatan.jatuh_menopang = true;
    draf.pemeriksaan.paru_bunyi = 'vesikuler';
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
    expect(pulihkanKeadaan(dasar, { versi_draf: 2, alasan: 'x' })).toBe(dasar);
    const h = pulihkanKeadaan(dasar, { versi_draf: VERSI_DRAF, anamnesis: 'bukan objek', diagnosis: [1, null, { kode: 'I10', nama: 'x', peran: 'utama', snomed: '' }], tanda_vital: { suhu: 5, nadi: '80' }, alasan: 7 });
    expect(h.anamnesis).toEqual(dasar.anamnesis);
    expect(h.diagnosis).toHaveLength(1);
    expect(h.tanda_vital.suhu).toBe('');
    expect(h.tanda_vital.nadi).toBe('80');
    expect(h.alasan).toBe('');
  });
});

describe('isi ringkasan', () => {
  it('urut blok formulir; SPRI hanya untuk rawat inap', () => {
    const k = awalKeadaan();
    k.tindak_lanjut = { jenis: 'rawat_inap', tujuan: 'Bangsal A', spri: 'SPRI-123', catatan: '' };
    const r = ringkasanIsi(k);
    expect(r.map((b) => b.judul)).toEqual([KLINIS.langkah.anamnesis, KLINIS.langkah.pemeriksaan, KLINIS.langkah.kesimpulan, KLINIS.langkah.terapi, KLINIS.langkah.tindakLanjut]);
    expect(r[4].baris).toEqual(expect.arrayContaining([expect.objectContaining({ nilai: 'SPRI-123' })]));
    k.tindak_lanjut.jenis = 'pulang';
    expect(ringkasanIsi(k)[4].baris).not.toEqual(expect.arrayContaining([expect.objectContaining({ nilai: 'SPRI-123' })]));
  });

  it('memuat keluhan, diagnosa medis/tambahan, diagnosa banding, KIE, dan obat di poli', () => {
    const k = awalKeadaan();
    k.anamnesis.keluhan_utama = 'Batuk';
    k.diagnosis = tambahDiagnosis(tambahDiagnosis([], { kode: 'J03.9', nama: 'Tonsilitis akut' }), { kode: 'J45.9', nama: 'Asma' });
    k.diagnosis_banding = 'Faringitis akut';
    k.kie = 'Istirahat cukup';
    k.obat_poli = 'Salbutamol nebul';
    const r = ringkasanIsi(k);
    expect(r[0].baris).toEqual(expect.arrayContaining([{ label: KLINIS.anamnesis.keluhanUtama, nilai: 'Batuk' }]));
    expect(r[2].baris).toEqual(expect.arrayContaining([
      { label: 'J03.9', nilai: `Tonsilitis akut (${KLINIS.kesimpulan.diagnosaMedis})` }, { label: 'J45.9', nilai: `Asma (${KLINIS.kesimpulan.diagnosaTambahan})` },
      { label: 'Diagnosa banding', nilai: 'Faringitis akut' }, { label: 'Komunikasi, informasi, dan edukasi', nilai: 'Istirahat cukup' },
    ]));
    expect(r[3].baris).toEqual(expect.arrayContaining([{ label: 'Obat yang diberikan di poli', nilai: 'Salbutamol nebul' }]));
  });

  it('pemeriksaan fisik: kelompok normal satu kalimat, kelompok berubah per bidang bertanda', () => {
    const pm = { ...DEFAULT_PEMERIKSAAN, odontogram_tanggal: '' };
    const normal = barisPemeriksaanFisik(pm);
    expect(normal.find((b) => b.label === 'Mata')?.nilai).toBe('Konjungtiva tidak anemis, sklera tidak ikterik, lain-lain tidak ada');
    expect(normal.find((b) => b.label === 'Odontogram')?.nilai).toBe(KLINIS.pemeriksaan.odontogramBelum);
    const ubah = barisPemeriksaanFisik({ ...pm, tht_faring: 'hiperemis', odontogram_tanggal: '2026-11-12' });
    expect(ubah.find((b) => b.label === 'THT')?.nilai).toContain('Faring hiperemis (!)');
    expect(ubah.find((b) => b.label === 'Odontogram')?.nilai).toContain('2026-11-12');
  });
});

describe('default keadaan baik dan draf', () => {
  it('pemeriksaan dan riwayat anamnesa baru terisi default di mode periksa; yang tersimpan tidak ditimpa', () => {
    const kosong = bagianKosongServer();
    const k = keadaanAwalForm('periksa', kosong);
    expect(k.pemeriksaan.mata_konjungtiva).toBe(DEFAULT_PEMERIKSAAN.mata_konjungtiva);
    expect(k.pemeriksaan.odontogram_tanggal).toBe('');
    expect(k.riwayat.riwayat_pribadi).toBe(DEFAULT_ANAMNESIS.riwayat_pribadi);
    expect(k.anamnesis.keluhan_utama).toBe('');
    expect(keadaanAwalForm('skrining', kosong).pemeriksaan.mata_konjungtiva).toBe('');
    const tersimpan = sahkan(bagianKosongServer(), 'pemeriksaan', { mata_konjungtiva: 'anemis' });
    expect(keadaanAwalForm('periksa', tersimpan).pemeriksaan.mata_sklera).toBe('');
    // form default saja tidak disimpan; begitu dokter mengisi, pemeriksaan default ikut tersimpan sebagai keadaan baik
    const server = keadaanDariServer(kosong);
    expect(rencanaSimpan('periksa', k, server, disahkanDari(kosong))).toEqual([]);
    const diisi = { ...k, anamnesis: { ...k.anamnesis, keluhan_utama: 'Demam' } };
    expect(rencanaSimpan('periksa', diisi, server, disahkanDari(kosong))).toEqual([{ bagian: 'anamnesis', galat: null }, { bagian: 'pemeriksaan', galat: null }]);
  });

  it('draf format lama mulai dari langkah pertama; draf versi sekarang dipertahankan', () => {
    expect(langkahDraf(4, {})).toBe(0);
    expect(langkahDraf(4, { versi_draf: 2 })).toBe(0);
    expect(langkahDraf(4, { versi_draf: VERSI_DRAF })).toBe(4);
    expect(bagianLangkah(LANGKAH_PEMERIKSAAN[1])).toEqual(['tanda_vital', 'pemeriksaan']);
  });

  it('narasi: tersimpan dipulihkan, pengosongan setelah disahkan tetap dikirim dengan alasan', () => {
    const b = sahkan(bagianKosongServer(), 'kie', { isi: 'Minum air hangat' });
    const awal = keadaanDariServer(b);
    expect(awal.kie).toBe('Minum air hangat');
    const k = { ...awal, kie: '', obat_poli: 'Salbutamol nebul' };
    const r = rencanaSimpan('periksa', k, awal, disahkanDari(b));
    expect(r.map((x) => x.bagian)).toEqual(['kie', 'obat_poli']);
    expect(perluAlasan(r, disahkanDari(b))).toBe(true);
    expect(galatBagian('diagnosis_banding', { ...k, diagnosis_banding: 'x'.repeat(1001) })).not.toBeNull();
    expect(syaratSelesaiTerpenuhi({ ...disahkanDari(b), anamnesis: true, diagnosis: true, tindak_lanjut: true }, [])).toBe(true);
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
  it('pilihan rusak dipulihkan dengan aman', () => {
    const k = pulihkanKeadaan(awalKeadaan(), { versi_draf: VERSI_DRAF, lab_dipilih: 'ya', order_lab: { pemeriksaan: [1, 1, -1, '2', null, 3.5], prioritas: 'rusak', catatan: 12 } });
    expect(k.lab_dipilih).toBe(false);
    expect(k.order_lab).toEqual({ pemeriksaan: [1], prioritas: 'rutin', catatan: '' });
  });
});


test('draf teks resep dipulihkan; bentuk tidak sesuai diabaikan', () => {
  const awal = awalKeadaan();
  const draf = { ...awal, resep: 'R/ Parasetamol 500 mg tab ½, CTM 4 mg tab ½, m.f. pulv. dtd No. X, s 3 dd pulv I' };
  expect(pulihkanKeadaan(awal, JSON.parse(JSON.stringify(draf)))).toEqual(draf);
  expect(pulihkanKeadaan(awal, { versi_draf: VERSI_DRAF, resep: [{ master_obat_id: '7', jumlah: '10', aturan_pakai: '2 x 1' }] }).resep).toBe('');
});

