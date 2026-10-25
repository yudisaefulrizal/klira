import type { InsidenDto } from '@klira/shared';
import {
  alihButir, awalDpia, awalHak, awalInsiden, awalPemberitahuan, awalProsesHak, awalProsesMusnah, awalProsesor, awalRencanaMusnah, awalRopa, buangPasienTerdampak, galatDpia, galatHak, galatInsiden, galatPemberitahuan, galatProsesHak,
  galatProsesMusnah, galatProsesor, galatRencanaMusnah, galatRopa, galatTarik, indeksTahapHak, indeksTahapMusnah, keIsianWaktu, langkahBermasalahHak, langkahBermasalahInsiden, langkahBermasalahRopa, tambahPasienTerdampak,
} from './keadaan-pdp';

describe('permintaan hak', () => {
  it('butuh pasien, pemohon, verifikasi, dan jenis; langkah bermasalah mengikuti bidang', () => {
    const g = galatHak(awalHak());
    expect(Object.keys(g)).toEqual(expect.arrayContaining(['pasien_id', 'pemohon_nama', 'verifikasi', 'jenis']));
    expect(langkahBermasalahHak(g)).toBe(0);
    expect(langkahBermasalahHak({ jenis: 'x' })).toBe(1);
    expect(galatHak({ ...awalHak(), pasien_id: 1, pemohon_nama: 'A', verifikasi: 'KTP', jenis: 'akses' })).toEqual({});
  });
  it('proses menurut tahap: tolak butuh alasan, pelaksanaan butuh uraian, notifikasi bebas', () => {
    const k = awalProsesHak();
    expect(galatProsesHak('keputusan', k).keputusan).toBeDefined();
    expect(galatProsesHak('keputusan', { ...k, keputusan: 'tolak' }).alasan).toBeDefined();
    expect(galatProsesHak('keputusan', { ...k, keputusan: 'tolak', alasan: 'retensi' })).toEqual({});
    expect(galatProsesHak('keputusan', { ...k, keputusan: 'setujui' })).toEqual({});
    expect(galatProsesHak('pelaksanaan', k).pelaksanaan).toBeDefined();
    expect(galatProsesHak('notifikasi', k)).toEqual({});
    expect([null, 'keputusan', 'pelaksanaan', 'notifikasi'].map((t) => indeksTahapHak(t as never))).toEqual([0, 1, 2, 3]);
  });
});

describe('pemberitahuan, tarik, ROPA, DPIA', () => {
  it('pemberitahuan dan tarik butuh isian wajib', () => {
    expect(Object.keys(galatPemberitahuan(awalPemberitahuan()))).toEqual(expect.arrayContaining(['judul', 'tujuan', 'isi']));
    expect(galatPemberitahuan(awalPemberitahuan({ judul: 'a', tujuan: 'b', isi: 'c' }))).toEqual({});
    expect(galatTarik(1, '').alasan).toBeDefined();
    expect(galatTarik(1, 'tidak mau')).toEqual({});
  });
  it('ROPA: 12 butir wajib (PPDP opsional), transfer terisi bawaan, langkah bermasalah', () => {
    const k = awalRopa();
    expect(k.transfer).toContain('Tidak ada');
    const g = galatRopa(k);
    expect(Object.keys(g)).toEqual(expect.arrayContaining(['nama_kegiatan', 'dasar', 'tujuan', 'pihak_akses', 'masa_retensi']));
    expect(g.ppdp_nama).toBeUndefined();
    expect(langkahBermasalahRopa(g)).toBe(0);
    expect(langkahBermasalahRopa({ pengamanan: 'x' })).toBe(3);
    const lengkap = { ...k, nama_kegiatan: 'a', sumber_tujuan: 'b', dasar: 'persetujuan', tujuan: 'c', jenis_data: 'd', kategori_subjek: 'e', pihak_akses: 'f', pemenuhan_hak: 'g', aliran: 'h', masa_retensi: 'i', pengamanan: 'j' };
    expect(galatRopa(lengkap)).toEqual({});
  });
  it('DPIA butuh pemrosesan, risiko, mitigasi, dan tanggal tinjau ulang berbentuk TTTT-BB-HH', () => {
    expect(Object.keys(galatDpia(awalDpia()))).toEqual(expect.arrayContaining(['pemrosesan', 'risiko', 'mitigasi', 'tinjau_ulang_pada']));
    const k = { ...awalDpia(), pemrosesan: 'p', risiko: 'r', mitigasi: 'm', tinjau_ulang_pada: '2027-01-01' };
    expect(galatDpia(k)).toEqual({});
    expect(galatDpia({ ...k, tinjau_ulang_pada: '1/1/2027' }).tinjau_ulang_pada).toBeDefined();
  });
});

describe('insiden', () => {
  it('waktu dan uraian wajib, waktu kejadian tidak sesudah diketahui, pasien terdampak ditambah dan dibuang', () => {
    const g = galatInsiden(awalInsiden());
    expect(Object.keys(g)).toEqual(expect.arrayContaining(['waktu_diketahui', 'uraian', 'data_terungkap']));
    expect(langkahBermasalahInsiden(g)).toBe(0);
    let k = { ...awalInsiden(), waktu_diketahui: '2026-10-25T10:00', uraian: 'u', data_terungkap: 'd' };
    expect(galatInsiden(k)).toEqual({});
    expect(galatInsiden({ ...k, waktu_kejadian: '2026-10-26T10:00' }).waktu_kejadian).toBeDefined();
    k = tambahPasienTerdampak(k, { id: 1, nama: 'A', nomor_rm: 'RM1' });
    k = tambahPasienTerdampak(k, { id: 1, nama: 'A', nomor_rm: 'RM1' });
    expect(k.pasien).toHaveLength(1);
    expect(buangPasienTerdampak(k, 1).pasien).toHaveLength(0);
    expect(langkahBermasalahInsiden({ notifikasi_lembaga_pada: 'x' })).toBe(3);
  });
  it('waktu ISO diubah ke isian WIB dan sebaliknya konsisten', () => {
    expect(keIsianWaktu('2026-10-25T03:00:00.000Z')).toBe('2026-10-25T10:00');
    expect(keIsianWaktu(null)).toBe('');
    const i = { waktu_kejadian: null, waktu_diketahui: '2026-10-25T03:00:00.000Z', siber: false, uraian: 'u', data_terungkap: 'd', penanganan: null, pemulihan: null, kontak_ppdp: null, notifikasi_pasien_pada: null, notifikasi_lembaga_pada: null, pasien: [] } as unknown as InsidenDto;
    expect(awalInsiden(i).waktu_diketahui).toBe('2026-10-25T10:00');
  });
});

describe('pemusnahan dan prosesor', () => {
  it('rencana butuh cakupan dan jadwal; pelaksanaan menuntut cadangan; tahap menentukan langkah', () => {
    expect(Object.keys(galatRencanaMusnah(awalRencanaMusnah()))).toEqual(expect.arrayContaining(['cakupan', 'jadwal']));
    expect(galatRencanaMusnah({ ...awalRencanaMusnah(), cakupan: 'x', jadwal: '2026-11-01' })).toEqual({});
    const k = awalProsesMusnah();
    expect(galatProsesMusnah('perintah', k, 'wajib').prosesor_id).toBeDefined();
    expect(galatProsesMusnah('perintah', { ...k, prosesor_id: '3', nomor_perintah: 'P1' }, 'wajib')).toEqual({});
    expect(galatProsesMusnah('pelaksanaan', { ...k, pelaksana: 'a', metode: 'b' }, 'wajib').mencakup_cadangan).toBe('wajib');
    expect(galatProsesMusnah('pelaksanaan', { ...k, pelaksana: 'a', metode: 'b', mencakup_cadangan: true }, 'wajib')).toEqual({});
    expect(galatProsesMusnah('berita_acara', k, 'wajib').berita_acara).toBeDefined();
    expect([null, 'perintah', 'pelaksanaan', 'berita_acara'].map((t) => indeksTahapMusnah(t as never))).toEqual([0, 1, 2, 3]);
  });
  it('prosesor: SLA 1 sampai 72, sub-prosesor butuh tanggal persetujuan, butir diurut katalog', () => {
    const k = { ...awalProsesor(), nama: 'H', layanan: 'L', lokasi_data: 'Jakarta' };
    expect(galatProsesor(k)).toEqual({});
    expect(galatProsesor({ ...k, sla: '100' }).sla_lapor_jam).toBeDefined();
    expect(galatProsesor({ ...k, sla: '24' })).toEqual({});
    expect(Object.keys(galatProsesor({ ...k, sub: [{ nama: 'C', layanan: 'S', persetujuan_pada: '' }] })).some((x) => x.startsWith('sub_prosesor'))).toBe(true);
    let a = alihButir(k, 'kerahasiaan', true);
    a = alihButir(a, 'objek_jangka', true);
    expect(a.butir).toEqual(['objek_jangka', 'kerahasiaan']);
    expect(alihButir(a, 'kerahasiaan', false).butir).toEqual(['objek_jangka']);
  });
});
