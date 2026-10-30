import { useEffect, useState } from 'react';
import { websiteKlinikMasukan } from '@klira/shared';
import type { WebsiteKlinikDto } from '@klira/shared';
import { panggilApi } from '../../api-klien/klien';
import { useIzin } from '../../komponen/izin-saja';
import { Kartu } from '../../komponen/ui/kartu';
import { Kolom, Baris, Sebaris } from '../../komponen/ui/susunan';
import { Isian } from '../../komponen/ui/isian';
import { AreaTeks } from '../../komponen/ui/area-teks';
import { Tombol } from '../../komponen/ui/tombol';
import { Peringatan } from '../../komponen/ui/peringatan';
import { token } from '../../gaya/token';

export function PengaturanWebsiteKlinik({ onSelesai }: { onSelesai: () => void }) {
  const boleh = useIzin(); const bolehUbah = boleh('profil-klinik', 'perbaikan');
  const [form, setForm] = useState<WebsiteKlinikDto | null>(null);
  const [awal, setAwal] = useState<WebsiteKlinikDto | null>(null);
  const [galat, setGalat] = useState(''); const [info, setInfo] = useState(''); const [memproses, setMemproses] = useState(false);
  const [bidang, setBidang] = useState<Record<string, string>>({});
  const [muat, setMuat] = useState(0);
  useEffect(() => {
    let aktif = true;
    panggilApi<WebsiteKlinikDto>('GET', '/fasyankes/website').then(data => { if (aktif) { setForm(data); setAwal(data); setGalat(''); } }).catch(e => { if (aktif) setGalat(e instanceof Error ? e.message : 'Pengaturan website gagal dimuat.'); });
    return () => { aktif = false; };
  }, [muat]);
  const berubah = JSON.stringify(form) !== JSON.stringify(awal);
  useEffect(() => {
    if (!berubah) return;
    const cegah = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', cegah); return () => window.removeEventListener('beforeunload', cegah);
  }, [berubah]);
  const ubah = <K extends keyof WebsiteKlinikDto>(k: K, nilai: WebsiteKlinikDto[K]) => { if (form) setForm({ ...form, [k]: nilai }); setInfo(''); };
  async function simpan(e: React.FormEvent) {
    e.preventDefault(); if (!form || !bolehUbah || memproses) return;
    const masukan = websiteKlinikMasukan.safeParse(form);
    if (!masukan.success) {
      const perBidang: Record<string, string> = {};
      for (const isu of masukan.error.issues) perBidang[String(isu.path[0])] ??= isu.message;
      setBidang(perBidang); setGalat('Periksa kembali isian website.'); return;
    }
    setMemproses(true); setGalat(''); setBidang({});
    try {
      const data = await panggilApi<WebsiteKlinikDto>('PUT', '/fasyankes/website', masukan.data);
      setForm(data); setAwal(data); setInfo('Pengaturan website tersimpan.'); onSelesai();
    } catch (e) { setGalat(e instanceof Error ? e.message : 'Pengaturan belum dapat disimpan.'); }
    finally { setMemproses(false); }
  }
  const isian = (k: keyof WebsiteKlinikDto, label: string, tipe = 'text') => form && <Isian id={`website-${k}`} label={label} type={tipe} value={String(form[k])} onChange={e => ubah(k, e.target.value)} readOnly={!bolehUbah || memproses} disabled={tipe === 'color' && (!bolehUbah || memproses)} galat={bidang[k]} />;
  const area = (k: 'ringkasan' | 'tentang' | 'alamat' | 'jam_operasional', label: string, maxLength: number) => form && <div><AreaTeks id={`website-${k}`} label={label} value={form[k]} onChange={e => ubah(k, e.target.value)} readOnly={!bolehUbah || memproses} maxLength={maxLength} aria-invalid={!!bidang[k]} />{bidang[k] && <p role="alert" style={{ color: token.warna.status.merah.teks }}>{bidang[k]}</p>}</div>;
  const centang = (k: 'aktif' | 'tampilkan_jadwal' | 'tampilkan_nama_praktisi', label: string) => form && <label style={{ display: 'flex', alignItems: 'flex-start', gap: token.jarak.sm }}><input type="checkbox" checked={form[k]} disabled={!bolehUbah || memproses} onChange={e => ubah(k, e.target.checked)} />{label}</label>;
  return <Kartu susun="md" id="website-publik">
    <Sebaris jarak="md" bungkus><div style={{ flexGrow: 1 }}><h2 style={{ margin: 0, fontSize: token.huruf.ukuran.besar }}>Website publik klinik</h2><p style={{ margin: '6px 0 0', color: token.warna.teksRedup }}>Identitas mengikuti nama pada Profil klinik. Layanan dan jadwal mengikuti master klinik.</p></div>{awal?.aktif && <a href={`/klinik/${awal.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: token.warna.utama }}>Lihat website ↗</a>}</Sebaris>
    {galat && <Peringatan>{galat}</Peringatan>}{info && <Peringatan nada="biru">{info}</Peringatan>}
    {!form ? <div>{galat ? <Tombol varian="sekunder" onClick={() => setMuat(v => v + 1)}>Coba lagi</Tombol> : 'Memuat pengaturan website…'}</div> : <Kolom tag="form" jarak="md" onSubmit={simpan} noValidate>
      <fieldset disabled={memproses} style={{ margin: 0, padding: 0, border: 0, minWidth: 0 }}><Kolom jarak="md">
        {centang('aktif', 'Tampilkan website kepada publik')}
        <Baris>{isian('slug', 'Alamat halaman (contoh: bhakti-rahayu)')}{isian('domain', 'Domain khusus (opsional)')}</Baris>
        <p style={{ color: token.warna.teksRedup, margin: 0, fontSize: token.huruf.ukuran.kecil }}>Alamat halaman: /klinik/{form.slug || 'nama-klinik'}. Untuk domain khusus, arahkan DNS dan hosting ke server Klira terlebih dahulu. Root / otomatis memakai satu-satunya website aktif jika belum ada domain khusus.</p>
        <Baris>{isian('judul', 'Judul utama')}{isian('warna_utama', 'Warna utama', 'color')}</Baris>
        {area('ringkasan', 'Pengantar singkat', 500)}{area('tentang', 'Tentang klinik (opsional)', 3000)}
        <Baris>{isian('logo_url', 'Alamat gambar logo (opsional)')}{isian('hero_url', 'Alamat gambar utama')}</Baris>
        <Sebaris jarak="sm" bungkus>{bolehUbah && <><Tombol type="button" varian="sekunder" onClick={() => ubah('hero_url', '/asset/ilustrasi/klinik-dokter-pasien-berhijab-v1.png')}>Ilustrasi dokter dan pasien</Tombol><Tombol type="button" varian="sekunder" onClick={() => ubah('hero_url', '/asset/ilustrasi/klinik-konsultasi-tanpa-wajah-v1.png')}>Ilustrasi ruang konsultasi</Tombol></>}</Sebaris>
        <p style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil, margin: 0 }}>Gunakan ilustrasi bawaan atau alamat HTTPS gambar milik klinik. Kosongkan logo untuk menggunakan lambang bawaan.</p>
        {form.hero_url && <img src={form.hero_url} alt="Pratinjau gambar utama website klinik" style={{ width: '100%', maxWidth: 440, aspectRatio: '3/2', objectFit: 'cover', borderRadius: 10 }} />}
        {area('alamat', 'Alamat klinik', 1000)}<Baris>{isian('whatsapp', 'Nomor WhatsApp (08… atau +62…)')}{isian('telepon', 'Nomor telepon')}{isian('email', 'Email publik', 'email')}</Baris>{area('jam_operasional', 'Jam operasional (opsional)', 500)}
        {centang('tampilkan_jadwal', 'Tampilkan jadwal praktik yang aktif')}{centang('tampilkan_nama_praktisi', 'Tampilkan nama praktisi di website publik')}
      </Kolom></fieldset>
      <Sebaris jarak="md" bungkus>{bolehUbah && <Tombol type="submit" disabled={memproses || !berubah}>{memproses ? 'Menyimpan…' : 'Simpan website'}</Tombol>}{berubah && <span style={{ color: token.warna.teksRedup }}>Perubahan belum disimpan.</span>}</Sebaris>
    </Kolom>}
  </Kartu>;
}
