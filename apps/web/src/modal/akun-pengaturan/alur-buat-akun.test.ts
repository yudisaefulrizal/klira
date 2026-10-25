import { GalatApi } from '../../api-klien/klien';
import { kirimAkun } from './alur-buat-akun';
import { awalAkun } from './keadaan-akun';

const k = { ...awalAkun(), nama: 'Dewi', nik: '3201010101010001', username: 'dewi.l', penugasan: { 11: { mulai: '2026-10-01', selesai: '' } } };
const dto = { id: 5, username: 'dewi.l', kata_sandi_awal: 'Abc12345xyzQ', peringatan: [] };

describe('alur kirim pembuatan akun', () => {
  it('berhasil mengembalikan data (kata sandi awal) dan mengirim badan tanpa konfirmasi', async () => {
    const kirim = jest.fn().mockResolvedValue(dto);
    expect(await kirimAkun(k, undefined, kirim)).toEqual({ jenis: 'berhasil', data: dto });
    expect(kirim.mock.calls[0][0]).not.toHaveProperty('konfirmasi_peringatan');
    expect(kirim.mock.calls[0][0]).toMatchObject({ username: 'dewi.l', penugasan: [{ jenis_akun_id: 11 }] });
  });
  it('409 perlu konfirmasi menjadi hasil peringatan; kirim ulang menyertakan alasan', async () => {
    const w = [{ jenis: 'nakes_tanpa_sip', kunci: 'k', pesan: 'Nakes tanpa SIP' }];
    const kirim = jest.fn().mockRejectedValueOnce(new GalatApi(409, 'Ada peringatan', w as never, 'perlu_konfirmasi_peringatan')).mockResolvedValueOnce(dto);
    expect(await kirimAkun(k, undefined, kirim)).toEqual({ jenis: 'peringatan', peringatan: w });
    expect((await kirimAkun(k, { alasan: 'sementara', terima_untuk_akun: false }, kirim)).jenis).toBe('berhasil');
    expect(kirim.mock.calls[1][0]).toMatchObject({ konfirmasi_peringatan: { alasan: 'sementara', terima_untuk_akun: false } });
  });
  it('konflik biasa dan galat jaringan menjadi pesan', async () => {
    expect(await kirimAkun(k, undefined, jest.fn().mockRejectedValue(new GalatApi(409, 'Nama pengguna sudah dipakai.', undefined, 'konflik')))).toEqual({ jenis: 'galat', pesan: 'Nama pengguna sudah dipakai.' });
    expect((await kirimAkun(k, undefined, jest.fn().mockRejectedValue(new Error('x')))).jenis).toBe('galat');
  });
});
