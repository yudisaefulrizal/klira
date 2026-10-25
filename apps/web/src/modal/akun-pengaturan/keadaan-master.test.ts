import { DEFINISI_MASTER, JENIS_MASTER_UBAH, MASTER } from '@klira/shared';
import { awalMaster, bentukMasukan, bidangTampil, galatMaster, masterBerubah, opsiDenganNilaiSaatIni } from './keadaan-master';

describe('bentuk generik master', () => {
  it('setiap jenis punya bidang dan awal yang sesuai definisi (praktisi menyembunyikan pengguna saat ubah)', () => {
    for (const j of JENIS_MASTER_UBAH) expect(Object.keys(awalMaster(j))).toEqual(bidangTampil(j, false).map((b) => b.kunci));
    expect(bidangTampil('praktisi', false).map((b) => b.kunci)).toContain('pengguna_id');
    expect(bidangTampil('praktisi', true).map((b) => b.kunci)).not.toContain('pengguna_id');
    expect(awalMaster('poli').status_operasional).toBe('O');
  });

  it('awal ubah memakai baris, null menjadi kosong', () => {
    const awal = awalMaster('tarif', { id: 1, aktif: true, kode: 'K', nama: 'N', jenis: 'lab', harga_umum: 1000, harga_jkn: null });
    expect(awal).toEqual({ kode: 'K', nama: 'N', jenis: 'lab', harga_umum: '1000', harga_jkn: '' });
  });

  it('bentuk masukan mengubah tipe: angka, id, hari; kosong opsional tidak dikirim', () => {
    const m = bentukMasukan('jadwal', { pengguna_id: '3', lokasi_id: '4', hari: '2', jam_mulai: '08:00', jam_selesai: '12:00', kuota: '15', berlaku_dari: '2026-01-01', berlaku_sampai: '' }, false);
    expect(m).toEqual({ pengguna_id: 3, lokasi_id: 4, hari: 2, jam_mulai: '08:00', jam_selesai: '12:00', kuota: 15, berlaku_dari: '2026-01-01' });
    expect(bentukMasukan('poli', { nama: ' Umum ', status_operasional: 'O', ihs_location_id: ' ' }, false)).toEqual({ nama: 'Umum', status_operasional: 'O' });
  });

  it('validasi memakai skema bersama dengan pesan Indonesia', () => {
    expect(galatMaster('poli', awalMaster('poli'), false)).toEqual({ nama: MASTER.galat.wajib });
    expect(galatMaster('poli', { ...awalMaster('poli'), nama: 'Umum' }, false)).toEqual({});
    expect(galatMaster('bed', { ...awalMaster('bed'), nama: 'B1' }, false)).toEqual({ induk_id: MASTER.galat.indukBed });
    const jadwal = { pengguna_id: '1', lokasi_id: '1', hari: '1', jam_mulai: '10:00', jam_selesai: '09:00', kuota: '0', berlaku_dari: '', berlaku_sampai: '' };
    const g = galatMaster('jadwal', jadwal, false);
    expect(g.kuota).toBe(MASTER.galat.kuota);
    expect(g.berlaku_dari).toBe(MASTER.galat.wajib);
    expect(galatMaster('jadwal', { ...jadwal, kuota: '5', berlaku_dari: '2026-01-01' }, false).jam_selesai).toBe(MASTER.galat.jamSelesai);
    expect(galatMaster('jadwal', { ...jadwal, kuota: '5', jam_selesai: '11:00', berlaku_dari: '2026-02-01', berlaku_sampai: '2026-01-01' }, false).berlaku_sampai).toBe(MASTER.galat.berlakuSampai);
    expect(galatMaster('tarif', { kode: 'K', nama: 'N', jenis: 'lab', harga_umum: '-5', harga_jkn: '' }, false).harga_umum).toBe(MASTER.galat.angka);
    expect(galatMaster('praktisi', { profesi: 'Dokter', nomor_sip: '', masa_berlaku_sip: '', ihs_practitioner_id: '' }, true)).toEqual({});
    expect(galatMaster('praktisi', { pengguna_id: '', profesi: 'Dokter', nomor_sip: '', masa_berlaku_sip: '', ihs_practitioner_id: '' }, false).pengguna_id).toBe(MASTER.galat.wajib);
  });

  it('perubahan terdeteksi tanpa memperhatikan spasi tepi', () => {
    expect(masterBerubah({ nama: 'A' }, { nama: 'A ' })).toBe(false);
    expect(masterBerubah({ nama: 'A' }, { nama: 'B' })).toBe(true);
  });

  it('opsi rujukan memuat nilai saat ini bila tidak ada di daftar', () => {
    const baris = { id: 1, aktif: true, pengguna_id: 7, pengguna_nama: 'Dr. Lama' };
    expect(opsiDenganNilaiSaatIni([{ nilai: '1', label: 'A' }], 'pengguna_id', baris)).toEqual([{ nilai: '7', label: 'Dr. Lama' }, { nilai: '1', label: 'A' }]);
    expect(opsiDenganNilaiSaatIni([{ nilai: '7', label: 'Dr' }], 'pengguna_id', baris)).toHaveLength(1);
    expect(opsiDenganNilaiSaatIni([], 'induk_id')).toEqual([]);
  });

  it('definisi: wilayah hanya baca (tanpa bidang), jenis lain punya kolom dan bidang', () => {
    expect(DEFINISI_MASTER.wilayah.bidang).toEqual([]);
    for (const j of JENIS_MASTER_UBAH) {
      expect(DEFINISI_MASTER[j].kolom.length).toBeGreaterThan(1);
      expect(DEFINISI_MASTER[j].bidang.length).toBeGreaterThan(2);
    }
  });
});
