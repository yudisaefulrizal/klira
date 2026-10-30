import { LogoKlira } from '../komponen/logo-klira';
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { tautanWhatsappPublik, WEBSITE_KLINIK_BAWAAN } from '@klira/shared';
import type { KlinikPublikDto } from '@klira/shared';
import './klinik-publik.css';

declare global { interface Window { __KLINIK_PUBLIK__?: KlinikPublikDto } }
const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const hariJakarta = () => new Date(Date.now() + 7 * 3600000).getUTCDay() || 7;
function Ikon({ jenis, ...props }: { jenis: 'klinik' | 'pesan' | 'pin' | 'kalender' | 'gigi' | 'umum' | 'keluarga' | 'panah' | 'menu' } & React.SVGProps<SVGSVGElement>) {
  const bentuk: Record<string, ReactNode> = {
    klinik: <><path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6Z" fill="currentColor" stroke="none"/></>,
    pesan: <><path d="m4 20 1-4a8 8 0 1 1 3 3Z"/><path d="M8 8c0 4 4 7 7 7l1-2-3-1-1 1-2-2 1-1-1-3Z"/></>,
    pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    kalender: <><rect x="4" y="5" width="16" height="16" rx="3"/><path d="M8 3v5m8-5v5M4 11h16m-11 4h2m3 0h2"/></>,
    gigi: <path d="M12 5C4-1 2 8 6 13c1 2 0 8 3 8 2 0 1-7 3-7s1 7 3 7c3 0 2-6 3-8 4-5 2-14-6-8Z"/>,
    umum: <><path d="M5 3v6a5 5 0 0 0 10 0V3M4 3h3m6 0h3m-6 11v3a4 4 0 0 0 8 0v-3"/><circle cx="18" cy="11" r="3"/></>,
    keluarga: <><circle cx="10" cy="6" r="3"/><circle cx="16" cy="13" r="2.5"/><path d="M13 10a6 6 0 0 0-9 5v5h6m3-2c-3-4 7-5 7 0v3h-7Z"/></>,
    panah: <path d="M4 12h16m-6-6 6 6-6 6"/>, menu: <path d="M4 6h16M4 12h16M4 18h16"/>,
  };
  return <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{bentuk[jenis]}</svg>;
}
function warnaTulisan(warna: string) {
  const rgb = [1, 3, 5].map(i => parseInt(warna.slice(i, i + 2), 16) / 255).map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4);
  return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2] > .18 ? '#000000' : '#ffffff';
}
export function HalamanKlinikPublik({ slug }: { slug?: string }) {
  const [data, setData] = useState<KlinikPublikDto | null>(() => !slug || window.__KLINIK_PUBLIK__?.slug === slug ? window.__KLINIK_PUBLIK__ ?? null : null);
  const [galat, setGalat] = useState('');
  const [ulang, setUlang] = useState(0);
  const [menu, setMenu] = useState(false);
  const [hari, setHari] = useState(hariJakarta);
  const [poli, setPoli] = useState('');
  const [semua, setSemua] = useState(false);
  const [logoRusak, setLogoRusak] = useState(false);
  useEffect(() => {
    const controller = new AbortController(); let aktif = true;
    const timer = setTimeout(() => controller.abort(), 10000);
    fetch(`/api/publik/klinik${slug ? `/${encodeURIComponent(slug)}` : ''}`, { signal: controller.signal, credentials: 'omit', cache: 'no-store' }).then(async res => {
      const isi = await res.json();
      if (res.status === 404 && aktif) setData(null);
      if (!res.ok) throw new Error(res.status === 404 ? 'Halaman klinik belum tersedia.' : 'Halaman belum dapat dimuat. Silakan coba kembali.');
      if (aktif) { setData(isi.data); setGalat(''); }
    }).catch(e => { if (aktif) setGalat(e instanceof Error && e.name !== 'AbortError' ? e.message : 'Koneksi belum tersedia. Silakan coba kembali.'); }).finally(() => clearTimeout(timer));
    return () => { aktif = false; controller.abort(); clearTimeout(timer); };
  }, [slug, ulang]);
  useEffect(() => {
    if (!data) return;
    const lama = document.title; document.title = `${data.nama} — Layanan dan jadwal praktik`;
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]'); const dibuat = !meta;
    if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.append(meta); }
    const isiLama = meta.content; meta.content = data.ringkasan;
    return () => { document.title = lama; if (dibuat) meta?.remove(); else if (meta) meta.content = isiLama; };
  }, [data]);
  useEffect(() => {
    if (!menu) return;
    const tutup = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(false); };
    window.addEventListener('keydown', tutup); return () => window.removeEventListener('keydown', tutup);
  }, [menu]);
  if (!data) return <main className="halaman-publik publik-status"><Ikon jenis="klinik" width="48" height="48"/><h1>{galat || 'Memuat halaman klinik…'}</h1>{galat && <button className="publik-tombol" onClick={() => { setGalat(''); setUlang(v => v + 1); }}>Coba lagi</button>}<a href="/masuk">Masuk petugas</a></main>;
  const wa = tautanWhatsappPublik(data.whatsapp, data.nama);
  const kontak = wa ?? (data.telepon ? `tel:${data.telepon.replace(/[^+\d]/g, '')}` : data.email ? `mailto:${data.email}` : null);
  const adaJadwal = data.jadwal.length > 0;
  const adaKontak = !!(kontak || data.alamat || data.jam_operasional);
  const peta = data.alamat ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${data.nama}, ${data.alamat}`)}` : null;
  const jadwal = data.jadwal.filter(j => j.hari === hari && (!poli || String(j.poli_id) === poli));
  const logo = <span className="publik-identitas">{data.logo_url && !logoRusak ? <img src={data.logo_url} alt="" width="64" height="64" onError={() => setLogoRusak(true)}/> : <span className="publik-lambang"><Ikon jenis="klinik" width="38" height="38"/></span>}<span>{data.nama}</span></span>;
  const nav = <>{data.tentang && <a href="#tentang" onClick={() => setMenu(false)}>Tentang</a>}{data.layanan.length > 0 && <a href="#layanan" onClick={() => setMenu(false)}>Layanan</a>}{adaJadwal && <a href="#jadwal" onClick={() => setMenu(false)}>Jadwal</a>}{data.alamat && <a href="#lokasi" onClick={() => setMenu(false)}>Lokasi</a>}</>;
  return <div className="halaman-publik" style={{ '--publik-utama': data.warna_utama, '--publik-di-utama': warnaTulisan(data.warna_utama) } as CSSProperties}>
    <a className="publik-lewati" href="#konten-publik">Lewati navigasi</a>
    <header className="publik-header"><div className="publik-batas publik-nav"><a className="publik-logo" href={slug ? `/klinik/${data.slug}` : '/'} aria-label={`Beranda ${data.nama}`}>{logo}</a><nav aria-label="Navigasi utama" className="publik-nav-desktop">{nav}</nav>{kontak && <a className="publik-tombol publik-outline publik-kontak-header" href={kontak}>Hubungi kami</a>}<a className="publik-login" href="/masuk" aria-label="Masuk petugas"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 4h5v16h-5M3 12h12m-4-4 4 4-4 4"/></svg><span className="publik-login-desktop">Masuk petugas</span><span className="publik-login-mobile">Masuk</span></a><button className="publik-menu" aria-label={menu ? 'Tutup menu' : 'Buka menu'} aria-expanded={menu} aria-controls="publik-nav-mobile" onClick={() => setMenu(v => !v)}><Ikon jenis="menu"/></button></div>{menu && <nav id="publik-nav-mobile" className="publik-batas publik-nav-mobile" aria-label="Navigasi seluler">{nav}{kontak && <a href={kontak}>Hubungi kami</a>}<a href="/masuk">Masuk petugas</a></nav>}</header>
    <main id="konten-publik" tabIndex={-1}>
      {galat && <div className="publik-batas publik-peringatan" role="status">Informasi terakhir ditampilkan. <button onClick={() => setUlang(v => v + 1)}>Perbarui halaman</button></div>}
      <section className="publik-hero"><div className="publik-batas publik-hero-grid"><div className="publik-hero-isi"><p className="publik-eyebrow">{data.nama}</p><h1>{data.judul}</h1>{data.ringkasan && <p className="publik-ringkasan">{data.ringkasan}</p>}<div className="publik-aksi">{kontak ? <a className="publik-tombol" href={kontak}><Ikon jenis="pesan"/>Hubungi klinik</a> : data.layanan.length > 0 ? <a className="publik-tombol" href="#layanan">Lihat layanan <Ikon jenis="panah"/></a> : null}{adaJadwal && <a className="publik-tombol publik-outline" href="#jadwal">Lihat jadwal</a>}</div></div><div className="publik-hero-gambar"><img src={data.hero_url || WEBSITE_KLINIK_BAWAAN.hero_url} alt={data.hero_url === WEBSITE_KLINIK_BAWAAN.hero_url ? 'Ilustrasi dokter dan pasien berhijab tanpa detail wajah dalam suasana konsultasi yang hangat' : `Gambaran layanan ${data.nama}`} width="1536" height="1024" fetchPriority="high" onError={e => { if (!e.currentTarget.dataset.fallback) { e.currentTarget.dataset.fallback = '1'; e.currentTarget.src = WEBSITE_KLINIK_BAWAAN.hero_url; } }}/><span className="publik-label-gambar">Melayani dengan perhatian</span></div></div></section>
      {(data.alamat || adaJadwal || kontak) && <div className="publik-batas publik-informasi">{data.alamat && <a href="#lokasi"><span className="publik-ikon-bulat"><Ikon jenis="pin"/></span><span><strong>Kunjungi klinik</strong><small>{data.alamat}</small></span></a>}{adaJadwal && <a href="#jadwal"><span className="publik-ikon-bulat"><Ikon jenis="kalender"/></span><span><strong>Rencanakan kunjungan</strong><small>Lihat jadwal praktik</small></span></a>}{kontak && <a href={kontak}><span className="publik-ikon-bulat"><Ikon jenis="pesan"/></span><span><strong>Ada pertanyaan?</strong><small>{wa ? 'Hubungi melalui WhatsApp' : 'Hubungi klinik'}</small></span></a>}</div>}
      {data.tentang && <section id="tentang" className="publik-batas publik-tentang publik-bagian"><p className="publik-eyebrow">Mengenal klinik</p><h2>{data.nama}</h2><p>{data.tentang}</p></section>}
      {data.layanan.length > 0 && <section id="layanan" className="publik-batas publik-bagian"><div className="publik-judul-bagian"><div><p className="publik-eyebrow">Layanan kami</p><h2>Temukan layanan yang Anda butuhkan</h2></div>{data.layanan.length > 6 && <button className="publik-tautan" onClick={() => setSemua(v => !v)}>{semua ? 'Tampilkan lebih sedikit' : 'Lihat semua layanan'} <Ikon jenis="panah"/></button>}</div><div className="publik-layanan" data-jumlah={Math.min(data.layanan.length, 3)}>{(semua ? data.layanan : data.layanan.slice(0, 6)).map(l => {
        const jenis = /gigi|mulut/i.test(l.nama) ? 'gigi' : /ibu|anak|kia|kb/i.test(l.nama) ? 'keluarga' : 'umum';
        const punyaJadwal = data.jadwal.some(j => j.poli_id === l.id);
        return <article className="publik-kartu-layanan" key={l.id}><span className="publik-ikon-bulat"><Ikon jenis={jenis}/></span><h3>{l.nama}</h3><p>Informasi layanan dan kunjungan {l.nama.toLowerCase()} di {data.nama}.</p>{punyaJadwal ? <a href="#jadwal" onClick={() => { setPoli(String(l.id)); setHari(data.jadwal.find(j => j.poli_id === l.id)!.hari); }}>Lihat jadwal <Ikon jenis="panah" width="18" height="18"/></a> : wa ? <a href={tautanWhatsappPublik(data.whatsapp, data.nama, l.nama)!}>Tanyakan layanan <Ikon jenis="panah" width="18" height="18"/></a> : null}</article>;
      })}</div></section>}
      {adaJadwal && <section id="jadwal" className="publik-jadwal"><div className="publik-batas publik-jadwal-grid"><div><p className="publik-eyebrow">Jadwal layanan</p><h2>Atur waktu kunjungan Anda.</h2><p>Lihat jadwal praktik sesuai layanan yang Anda pilih.</p>{wa && <a className="publik-tautan" href={wa}>Tanyakan jadwal melalui WhatsApp <Ikon jenis="panah" width="18" height="18"/></a>}</div><div className="publik-panel-jadwal"><div className="publik-jadwal-kepala"><h3>Jadwal praktik</h3><label><span className="publik-sr">Pilih layanan</span><select value={poli} onChange={e => setPoli(e.target.value)}><option value="">Semua layanan</option>{data.layanan.filter(l => data.jadwal.some(j => j.poli_id === l.id)).map(l => <option value={l.id} key={l.id}>{l.nama}</option>)}</select></label></div><div className="publik-hari" role="group" aria-label="Hari praktik">{HARI.map((h, i) => <button key={h} aria-label={h} aria-pressed={hari === i + 1} onClick={() => setHari(i + 1)}>{h.slice(0, 3)}</button>)}</div><div className="publik-daftar-jadwal" aria-live="polite">{jadwal.length ? jadwal.map((j, i) => <div className="publik-baris-jadwal" key={`${j.poli_id}-${i}`}><span className="publik-ikon-bulat"><Ikon jenis="umum"/></span><div><strong>{j.praktisi ?? j.poli_nama}</strong>{j.praktisi && <small>{j.poli_nama}</small>}</div><span className="publik-jam">{j.jam_mulai}–{j.jam_selesai}<small>WIB</small></span></div>) : <p className="publik-jadwal-kosong">Belum ada jadwal untuk pilihan ini. Silakan pilih hari atau layanan lain.</p>}</div><p className="publik-catatan">Konfirmasi jadwal sebelum berkunjung.</p></div></div></section>}
      {adaKontak && <section id="lokasi" className="publik-batas publik-bagian"><p className="publik-eyebrow">{data.alamat ? 'Lokasi kami' : 'Informasi kunjungan'}</p><h2>{data.alamat ? 'Kami dekat dengan Anda.' : 'Hubungi klinik untuk kunjungan Anda.'}</h2><div className={`publik-lokasi ${!data.alamat ? 'publik-tanpa-peta' : ''}`}>{data.alamat && <iframe title={`Peta lokasi ${data.nama}`} src={`https://maps.google.com/maps?q=${encodeURIComponent(`${data.nama} ${data.alamat}`)}&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade"/>}<div className="publik-kontak"><h3>{data.nama}</h3>{data.alamat && <address>{data.alamat}</address>}{data.jam_operasional && <div className="publik-jam-operasional"><strong>Jam operasional</strong><p>{data.jam_operasional}</p></div>}{data.telepon && <a href={`tel:${data.telepon.replace(/[^+\d]/g, '')}`}>{data.telepon}</a>}{data.email && <a href={`mailto:${data.email}`}>{data.email}</a>}<div className="publik-aksi">{peta && <a className="publik-tombol" href={peta} target="_blank" rel="noopener noreferrer"><Ikon jenis="pin"/>Petunjuk arah</a>}{kontak && <a className="publik-tombol publik-outline" href={kontak}><Ikon jenis="pesan"/>Hubungi klinik</a>}</div><p className="publik-catatan">Konfirmasi jadwal sebelum berkunjung.</p></div></div></section>}
    </main>
    <footer className="publik-footer"><div className="publik-batas"><div className="publik-footer-atas"><div>{logo}<p>{data.ringkasan}</p></div><div><strong>Informasi</strong>{nav}</div><div><strong>Tautan</strong><a href="/kebijakan-privasi/">Kebijakan privasi</a><a href="/ketentuan-layanan/">Ketentuan layanan</a><a href="/masuk">Masuk petugas</a></div></div><div className="publik-footer-bawah"><small>© {new Date().getFullYear()} {data.nama}. Semua hak dilindungi.</small><span className="publik-brand-platform">Didukung oleh <LogoKlira lebar={132} monokrom /></span></div></div></footer>
  </div>;
}
