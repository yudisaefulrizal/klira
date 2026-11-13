import * as uji from '@klira/db/uji';
/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */

const urlUji = (process.env.KLIRA_UJI_DB === '1' ? process.env.DATABASE_URL : undefined);
const d = urlUji ? describe : describe.skip;

d('RepositoriAksesMysql (database pengujian)', () => {
  let repo: any;
  let KonflikUsername: new () => Error;

  let fasA = 0;
  let fasB = 0;
  let idA = 0;
  let idB = 0;
  let idC = 0;
  const kode = `UJI-REPO-${Date.now()}`;

  async function buatPengguna(fas: number, username: string, nik: string) {
    return uji.transaksi(async koneksiBaru => { const _hasil = await uji.tambahPenggunaUntukBuatPengguna2(fas, 'U', nik, username, 'h', koneksiBaru); return uji.tambahPenggunaUntukBuatPenggunaHasil(_hasil.id, koneksiBaru); });
  }

  beforeAll(async () => {
    const modul = require('../data-access/repositori');
    repo = new modul.RepositoriAksesMysql();
    KonflikUsername = modul.KonflikUsername;
    const a = await uji.transaksi(async koneksiBaru => { const _hasil = await uji.tambahFasyankesUntukAksesIzinIntegrasiTest(-1, 'A', 'klinik_pratama_rawat_jalan', `${kode}-A`, koneksiBaru); return uji.tambahFasyankesUntukAksesIzinIntegrasiTestHasil(_hasil.id, koneksiBaru); });
    const b = await uji.transaksi(async koneksiBaru => { const _hasil = await uji.tambahFasyankesUntukAksesIzinIntegrasiTest(-2, 'B', 'klinik_pratama_rawat_jalan', `${kode}-B`, koneksiBaru); return uji.tambahFasyankesUntukAksesIzinIntegrasiTestHasil(_hasil.id, koneksiBaru); });
    fasA = a.id; fasB = b.id;
    await uji.ubahFasyankesUntukAksesIzinIntegrasiTest(fasA);
    await uji.ubahFasyankesUntukAksesIzinIntegrasiTest(fasB);
    idA = (await buatPengguna(fasA, 'Budi', '9900000000000001')).id;
    idB = (await buatPengguna(fasA, 'siti', '9900000000000002')).id;
    idC = (await buatPengguna(fasB, 'joko', '9900000000000003')).id;
  });
  afterAll(async () => {
    await uji.hapusSesiUntukAksesIzinIntegrasiTest([idA, idB, idC]);
    await uji.hapusPenggunaUntukAksesRepositoriIntegrasiTest([idA, idB, idC]);
    await uji.hapusFasyankesUntukAksesRepositoriIntegrasiTest([fasA, fasB]);
    await uji.tutupPool();
    await uji.tutupPool();
  });

  it('usernameDipakai: beda huruf besar/kecil, lintas fasyankes, dan mengecualikan diri sendiri', async () => {
    expect(await repo.usernameDipakai('BUDI', idB)).toBe(true);
    expect(await repo.usernameDipakai('joko', idA)).toBe(true);
    expect(await repo.usernameDipakai('budi', idA)).toBe(false);
    expect(await repo.usernameDipakai('tidakada', idA)).toBe(false);
  });

  it('gantiKredensial atomik: ubah akun, cabut semua sesi lama, buat sesi baru', async () => {
    const akun = { id: idA, fasyankes_id: fasA, nama: 'U', username: 'Budi', kata_sandi_hash: 'h', aktif: true, wajib_ganti_kredensial: true };
    const kedaluwarsa = new Date(Date.now() + 3_600_000);
    await repo.buatSesi({ idHash: `${kode}-s1`, akun, kedaluwarsa });
    await repo.buatSesi({ idHash: `${kode}-s2`, akun, kedaluwarsa });
    await repo.gantiKredensial({ akun, username: 'budi.baru', kataSandiHash: 'hash-baru', sesiBaru: { idHash: `${kode}-s3`, alamat: 'x', kedaluwarsa } });
    const p = await uji.tambahPenggunaUntukBuatPenggunaHasil(idA);
    expect([p.username, p.kata_sandi_hash, p.wajib_ganti_kredensial]).toEqual(['budi.baru', 'hash-baru', false]);
    const sesi = await uji.daftarSesiUntukAksesRepositoriIntegrasiTest(idA);
    expect(sesi.map((s) => s.id_hash)).toEqual([`${kode}-s3`]);
    expect(await repo.cariSesi(`${kode}-s3`, new Date())).not.toBeNull();
    expect(await repo.cariSesi(`${kode}-s1`, new Date())).toBeNull();
  });

  it('gantiKredensial: username bentrok dalam fasyankes sama melempar KonflikUsername dan tidak mengubah sesi', async () => {
    const akun = { id: idA, fasyankes_id: fasA, nama: 'U', username: 'budi.baru', kata_sandi_hash: 'hash-baru', aktif: true, wajib_ganti_kredensial: false };
    const kedaluwarsa = new Date(Date.now() + 3_600_000);
    await expect(
      repo.gantiKredensial({ akun, username: 'siti', kataSandiHash: 'z', sesiBaru: { idHash: `${kode}-s4`, kedaluwarsa } }),
    ).rejects.toBeInstanceOf(KonflikUsername);
    const p = await uji.tambahPenggunaUntukBuatPenggunaHasil(idA);
    expect([p.username, p.kata_sandi_hash]).toEqual(['budi.baru', 'hash-baru']);
    expect((await uji.daftarSesiUntukAksesRepositoriIntegrasiTest(idA)).map((s) => s.id_hash)).toEqual([`${kode}-s3`]);
  });
});
