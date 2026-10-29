import { nomorHpPasien, perbaikanPasienMasukan, registrasiPasienMasukan } from './pasien';

it.each([
  ['0812 3456 7890', '6281234567890'], ['+62 (812) 3456-7890', '6281234567890'],
  ['6281234567890', '6281234567890'], ['+447911123456', '447911123456'],
  ['', null], ['  ', null], [null, null], [undefined, undefined],
])('menormalkan nomor HP opsional %s', (masukan, hasil) => {
  expect(nomorHpPasien.parse(masukan)).toBe(hasil);
});
it.each(['abc', '123', '0812@lid', '0812 ext 123', '081234567890123456789', '<script>'])('menolak nomor tidak valid %s', (nomor) => {
  expect(nomorHpPasien.safeParse(nomor).success).toBe(false);
});
it('nomor pasien dan kontak wali tetap terpisah dalam registrasi dan edit', () => {
  const data = { nama: 'Ayu', nik: '3201010101900001', tanggal_lahir: '1990-05-01', jenis_kelamin: 'perempuan', nomor_hp: '081234567890', wali: [{ nama: 'Budi', hubungan: 'Ayah', kontak: '089999999999' }], persetujuan: { teks_persetujuan_id: 1, bentuk: 'tertulis', penandatangan: 'pasien', setuju: true } };
  for (const schema of [registrasiPasienMasukan, perbaikanPasienMasukan]) {
    const hasil = schema.parse(data);
    expect(hasil.nomor_hp).toBe('6281234567890');
    expect(hasil.wali[0].kontak).toBe('089999999999');
  }
});
