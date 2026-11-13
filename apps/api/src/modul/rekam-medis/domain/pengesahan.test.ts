import { bolehPerbaikiSendiri, hashIsi, isiKanonik, pilihJenisAkun } from './pengesahan';

describe('isi kanonik dan hash', () => {
  it('urutan kunci tidak berpengaruh, undefined dibuang, tanggal menjadi ISO, urutan larik dipertahankan', () => {
    const a = { b: 1, a: { y: [1, 2], x: undefined, t: new Date('2026-10-25T01:00:00Z') } };
    const b = { a: { t: '2026-10-25T01:00:00.000Z', y: [1, 2] }, b: 1 };
    expect(isiKanonik(a)).toBe(isiKanonik(b));
    expect(isiKanonik({ l: [1, 2] })).not.toBe(isiKanonik({ l: [2, 1] }));
  });
  it('hash SHA-256 heksadesimal 64 karakter, stabil, dan berubah bila isi berubah', () => {
    const h = hashIsi({ keluhan: 'Batuk' });
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(hashIsi({ keluhan: 'Batuk' })).toBe(h);
    expect(hashIsi({ keluhan: 'Batuk ' })).not.toBe(h);
    expect(hashIsi(null)).toMatch(/^[0-9a-f]{64}$/);
    // vektor tetap agar format kanonik tidak berubah diam-diam
    expect(hashIsi({ a: null })).toBe('d091f9c83c091f79652fe8786375b3fe4ce0861a56f5bfbafedbe431877ff0e8');
  });
});

describe('jenis akun pengesah dan batas perbaikan', () => {
  it('memilih satu jenis akun (berid terkecil) walau akun merangkap; kosong bila tidak ada', () => {
    expect(pilihJenisAkun([{ id: 9, nama: 'B' }, { id: 4, nama: 'A' }])).toEqual({ id: 4, nama: 'A' });
    expect(pilihJenisAkun([])).toBeNull();
  });
  it('pembuat boleh memperbaiki dalam 2x24 jam, bukan sesudahnya atau oleh orang lain', () => {
    const waktu = new Date('2026-10-25T00:00:00Z');
    expect(bolehPerbaikiSendiri({ pengguna_id: 1, waktu }, 1, new Date('2026-10-26T23:59:00Z'))).toBe(true);
    expect(bolehPerbaikiSendiri({ pengguna_id: 1, waktu }, 1, new Date('2026-10-27T00:01:00Z'))).toBe(false);
    expect(bolehPerbaikiSendiri({ pengguna_id: 1, waktu }, 2, new Date('2026-10-25T01:00:00Z'))).toBe(false);
  });
});
