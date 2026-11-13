import type { IzinAwal } from '@klira/shared';
import { evaluasiPeringatan, hitungAksesEfektif, peringatanBaru, relevanUntukTindakan } from './mesin-izin';
import type { SnapIzinAkun, SnapPenugasan, SnapProfil, SnapshotAkses } from './mesin-izin';

const T = new Date('2026-10-25T00:00:00Z');
const hari = (n: number) => new Date(T.getTime() + n * 86_400_000);
const iz = (fitur: string, aksi: IzinAwal['aksi'] = 'lihat', cakupan: IzinAwal['cakupan'] = 'unit'): IzinAwal => ({ fitur, aksi, cakupan });

let idSeq = 1;
const tugas = (nama: string, izin: IzinAwal[], o: Partial<SnapPenugasan> = {}): SnapPenugasan => ({
  id: idSeq++, jenis_akun_id: idSeq + 100, jenis_nama: nama, syarat_profesi: null, jenis_aktif: true, mulai: hari(-30), selesai: null, izin, ...o,
});
const izinAkun = (tipe: 'tambah' | 'kurang', izin: IzinAwal, o: Partial<SnapIzinAkun> = {}): SnapIzinAkun => ({
  id: idSeq++, tipe, izin, mulai: hari(-1), selesai: null, ...o,
});
const snap = (o: Partial<SnapshotAkses> = {}): SnapshotAkses => ({ pengguna_id: 7, aktif: true, profil: [], penugasan: [], izin_akun: [], ...o });
const dokter: SnapProfil = { profesi: 'Dokter umum', nomor_sip: 'SIP-1', masa_berlaku_sip: hari(365) };

describe('hitungAksesEfektif', () => {
  it('gabungan beberapa jenis akun yang merangkap', () => {
    const a = hitungAksesEfektif(snap({ penugasan: [tugas('A', [iz('akses')]), tugas('B', [iz('klinis', 'input'), iz('akses')])] }), T);
    expect(a.jenis_akun).toEqual(['A', 'B']);
    expect(a.fitur.sort()).toEqual(['akses', 'klinis']);
    expect(a.izin).toHaveLength(2);
  });
  it('periode: belum mulai dan sudah selesai tidak berlaku; selesai eksklusif', () => {
    const a = hitungAksesEfektif(
      snap({ penugasan: [tugas('Depan', [iz('kasir')], { mulai: hari(1) }), tugas('Lalu', [iz('klaim')], { selesai: hari(-1) }), tugas('Batas', [iz('farmasi')], { selesai: T }), tugas('Kini', [iz('akses')], { selesai: hari(1) })] }),
      T,
    );
    expect(a.fitur).toEqual(['akses']);
  });
  it('jenis akun nonaktif diabaikan', () => {
    const a = hitungAksesEfektif(snap({ penugasan: [tugas('Mati', [iz('akses')], { jenis_aktif: false })] }), T);
    expect(a).toMatchObject({ jenis_akun: [], izin: [], fitur: [] });
  });
  it('izin tambahan menambah, hanya selama periodenya', () => {
    const s = snap({ penugasan: [tugas('A', [iz('akses')])], izin_akun: [izinAkun('tambah', iz('audit')), izinAkun('tambah', iz('pdp'), { selesai: hari(-0.5) })] });
    expect(hitungAksesEfektif(s, T).fitur.sort()).toEqual(['akses', 'audit']);
    expect(hitungAksesEfektif(s, hari(5)).fitur.sort()).toEqual(['akses', 'audit']);
  });
  it('pengurangan mencabut bagian paket dan menang atas tambahan; fitur hilang bila semua izinnya dicabut', () => {
    const s = snap({
      penugasan: [tugas('A', [iz('akses', 'lihat'), iz('akses', 'input'), iz('klinis')])],
      izin_akun: [izinAkun('kurang', iz('akses', 'input')), izinAkun('kurang', iz('klinis')), izinAkun('tambah', iz('klinis'))],
    });
    const a = hitungAksesEfektif(s, T);
    expect(a.izin).toEqual([iz('akses', 'lihat')]);
    expect(a.fitur).toEqual(['akses']);
  });
  it('pengurangan berperiode: setelah selesai paket kembali', () => {
    const s = snap({ penugasan: [tugas('A', [iz('klinis')])], izin_akun: [izinAkun('kurang', iz('klinis'), { selesai: hari(2) })] });
    expect(hitungAksesEfektif(s, T).fitur).toEqual([]);
    expect(hitungAksesEfektif(s, hari(3)).fitur).toEqual(['klinis']);
  });
  it('pengguna nonaktif tidak punya akses', () => {
    expect(hitungAksesEfektif(snap({ aktif: false, penugasan: [tugas('A', [iz('akses')])] }), T).izin).toEqual([]);
  });
});

describe('evaluasiPeringatan', () => {
  const jenis = (s: SnapshotAkses, k = {}) => evaluasiPeringatan(s, T, k).map((w) => w.jenis);

  it('tanpa risiko tidak ada peringatan', () => {
    expect(jenis(snap({ profil: [dokter], penugasan: [tugas('Dokter', [iz('resep', 'input'), iz('klinis', 'input')], { syarat_profesi: 'dokter', selesai: hari(100) })] }))).toEqual([]);
  });
  it('1: izin resep ke bukan dokter ber-SIP, dan pengeluaran obat ke bukan tenaga kefarmasian', () => {
    const s = snap({ profil: [{ profesi: 'Perawat', nomor_sip: 'S', masa_berlaku_sip: null }], penugasan: [tugas('X', [iz('resep', 'input'), iz('farmasi', 'input')])] });
    const w = evaluasiPeringatan(s, T).filter((x) => x.jenis === 'izin_klinis_non_dokter');
    expect(w.map((x) => x.fitur_terkait)).toEqual([['resep'], ['farmasi']]);
    expect(jenis(snap({ profil: [{ profesi: 'Apoteker', nomor_sip: 'S', masa_berlaku_sip: null }], penugasan: [tugas('F', [iz('farmasi', 'input')])] }))).not.toContain('izin_klinis_non_dokter');
    // dokter tanpa nomor SIP dihitung bukan dokter ber-SIP
    expect(jenis(snap({ profil: [{ profesi: 'Dokter', nomor_sip: null, masa_berlaku_sip: null }], penugasan: [tugas('D', [iz('resep', 'perbaikan')])] }))).toContain('izin_klinis_non_dokter');
  });
  it('2: pembuat dan penyetuju perbaikan sama (hanya lewat konteks tindakan)', () => {
    const s = snap();
    expect(jenis(s)).toEqual([]);
    expect(jenis(s, { pembuat_id: 7, penyetuju_id: 7 })).toEqual(['perbaikan_pembuat_penyetuju_sama']);
    expect(jenis(s, { pembuat_id: 7, penyetuju_id: 8 })).toEqual([]);
  });
  it('3: izin lihat rekam medis tak dibatasi unit (cakupan layanan)', () => {
    expect(jenis(snap({ penugasan: [tugas('P', [iz('rekam-medis', 'lihat', 'layanan')])] }))).toEqual(['lihat_tak_dibatasi']);
    expect(jenis(snap({ penugasan: [tugas('P', [iz('rekam-medis', 'lihat', 'unit')])] }))).toEqual([]);
  });
  it('4: admin IT atau admin vendor diberi izin lihat rekam medis', () => {
    expect(jenis(snap({ penugasan: [tugas('Admin IT fasyankes', [iz('rekam-medis', 'lihat')])] }))).toEqual(['admin_lihat_rekam_medis']);
    expect(jenis(snap({ penugasan: [tugas('Admin vendor', [iz('satusehat')])] }))).toEqual([]);
    expect(jenis(snap({ penugasan: [tugas('Admin vendor', [iz('rekam-medis', 'lihat')])] }))).toContain('admin_lihat_rekam_medis');
  });
  it('4: izin tambahan lihat rekam medis ke admin IT juga terdeteksi', () => {
    const s = snap({ penugasan: [tugas('Admin IT fasyankes', [iz('satusehat')])], izin_akun: [izinAkun('tambah', iz('rekam-medis', 'lihat'))] });
    expect(jenis(s)).toContain('admin_lihat_rekam_medis');
  });
  it('5: nakes tanpa SIP aktif diberi izin klinis', () => {
    const tanpa = snap({ profil: [{ profesi: 'Perawat', nomor_sip: null, masa_berlaku_sip: null }], penugasan: [tugas('Perawat', [iz('klinis', 'input')])] });
    expect(jenis(tanpa)).toEqual(['nakes_tanpa_sip']);
    const lewat = snap({ profil: [{ profesi: 'Perawat', nomor_sip: 'S', masa_berlaku_sip: hari(-3) }], penugasan: [tugas('Perawat', [iz('klinis', 'input')])] });
    expect(jenis(lewat)).toEqual(['nakes_tanpa_sip']);
    const aktif = snap({ profil: [{ profesi: 'Perawat', nomor_sip: 'S', masa_berlaku_sip: hari(10) }], penugasan: [tugas('Perawat', [iz('klinis', 'input')])] });
    expect(jenis(aktif)).toEqual([]);
  });
  it('6: penugasan melewati masa berlaku SIP (selesai kosong atau lewat masa)', () => {
    const profil = [{ profesi: 'Dokter', nomor_sip: 'S', masa_berlaku_sip: hari(30) }];
    const tanpaAkhir = snap({ profil, penugasan: [tugas('Dokter', [iz('klinis', 'input')], { syarat_profesi: 'dokter' })] });
    expect(evaluasiPeringatan(tanpaAkhir, T).map((w) => w.jenis)).toEqual(['penugasan_lewat_sip']);
    const melewati = snap({ profil, penugasan: [tugas('Dokter', [iz('klinis', 'input')], { syarat_profesi: 'dokter', selesai: hari(60) })] });
    expect(jenis(melewati)).toEqual(['penugasan_lewat_sip']);
    const dalam = snap({ profil, penugasan: [tugas('Dokter', [iz('klinis', 'input')], { syarat_profesi: 'dokter', selesai: hari(20) })] });
    expect(jenis(dalam)).toEqual([]);
    // jenis tanpa syarat profesi tidak terkait SIP
    expect(jenis(snap({ profil, penugasan: [tugas('Umum', [iz('klinis', 'input')])] }))).not.toContain('penugasan_lewat_sip');
  });
  it('peringatanBaru hanya memuat yang timbul akibat perubahan', () => {
    const sebelum = snap({ profil: [{ profesi: 'Perawat', nomor_sip: 'S', masa_berlaku_sip: null }], penugasan: [tugas('P', [iz('klinis', 'input')])] });
    const sesudah = { ...sebelum, penugasan: [...sebelum.penugasan, tugas('Dok', [iz('resep', 'input')])] };
    expect(peringatanBaru(sebelum, sesudah, T).map((w) => w.jenis)).toEqual(['izin_klinis_non_dokter']);
    expect(peringatanBaru(sesudah, sesudah, T)).toEqual([]);
  });
  it('relevanUntukTindakan menyaring menurut fitur', () => {
    const s = snap({ profil: [{ profesi: 'Perawat', nomor_sip: 'S', masa_berlaku_sip: null }], penugasan: [tugas('X', [iz('resep', 'input'), iz('farmasi', 'input')])] });
    const w = relevanUntukTindakan(evaluasiPeringatan(s, T), 'farmasi');
    expect(w.map((x) => x.kunci)).toEqual(['izin_klinis_non_dokter|farmasi']);
  });
});
