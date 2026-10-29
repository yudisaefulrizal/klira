import { useEffect, useState } from 'react';
import type { LayarPanggilanDto } from '@klira/shared';
import './layar-panggilan.css';
import { useSuaraPanggilan } from '../util/use-suara-panggilan';
import { sambungkanLayarPanggilan } from '../util/sambungan-layar-panggilan';
import type { ModeSambunganLayar } from '../util/sambungan-layar-panggilan';

const zona = 'Asia/Jakarta';
export function HalamanLayarPanggilan() {
  const [data, setData] = useState<LayarPanggilanDto | null>(null);
  const [galat, setGalat] = useState('');
  const [mode, setMode] = useState<ModeSambunganLayar>('menghubungkan');
  const [sekarang, setSekarang] = useState(new Date());
  const id = window.location.pathname.split('/')[2] ?? new URLSearchParams(window.location.search).get('fasyankes');
  const sah = !!id && /^\d+$/.test(id) && Number.isSafeInteger(Number(id)) && Number(id) > 0;
  useEffect(() => {
    const judul = document.title;
    document.title = 'Layar Panggilan · Klira';
    const jam = window.setInterval(() => setSekarang(new Date()), 1000);
    return () => { clearInterval(jam); document.title = judul; };
  }, []);
  useEffect(() => {
    if (!sah || !id) return;
    return sambungkanLayarPanggilan(id, {
      asal: window.location.origin,
      mode: setMode, galat: setGalat,
      data: baru => setData(lama => ({ ...baru, event_panggilan: [
        ...(lama?.tanggal === baru.tanggal ? lama.event_panggilan : []), ...baru.event_panggilan,
      ] })),
    });
  }, [id, sah]);
  const hariIni = new Intl.DateTimeFormat('en-CA', { timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit' }).format(sekarang);
  const suara = useSuaraPanggilan(data, hariIni);
  const tampilan = data?.tanggal === hariIni ? data : null;
  const panggilan = tampilan?.panggilan;
  return <main className="layar-panggilan">
    <header className="lp-kepala">
      <a className="lp-merek" href="/" aria-label="Klira">klira</a>
      <div className="lp-judul"><h1>Layar Panggilan</h1><p>{data?.fasyankes_nama ?? 'Antrean pelayanan'}</p></div>
      <div className="lp-waktu"><span>{sekarang.toLocaleDateString('id-ID', { timeZone: zona, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span><time>{sekarang.toLocaleTimeString('id-ID', { timeZone: zona, hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':')}</time></div>
    </header>
    {!sah ? <section className="lp-petunjuk"><h2>Pilih fasilitas untuk menampilkan antrean</h2><p>Buka alamat layar panggilan dengan ID fasilitas Anda: <code>/layar-panggilan/ID-fasilitas</code></p></section> : <div className="lp-isi">
      <section className="lp-utama">
        <div className="lp-panggilan" aria-live="polite" aria-atomic="true">
          <div className="lp-label"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M11 4 5 9H2v6h3l6 5V4Z" fill="currentColor"/><path d="M15 8c3 2 3 6 0 8m3-11c5 4 5 10 0 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg><span>NOMOR ANTREAN DIPANGGIL</span></div>
          <strong className="lp-nomor">{panggilan?.kode ?? '—'}</strong>
          <div className="lp-tujuan"><p>{panggilan ? 'Silakan menuju' : !data && !galat ? 'Memuat antrean…' : 'Silakan menunggu'}</p><h2>{panggilan?.poli_nama ?? 'Belum ada panggilan'}</h2><span className="lp-status">{galat ? 'Data belum diperbarui' : panggilan ? 'Panggilan berlangsung' : 'Antrean akan tampil di sini'}</span></div>
        </div>
        <div className="lp-dokumen"><span aria-hidden="true">▤</span> Siapkan kartu berobat dan dokumen Anda</div>
      </section>
      <section className="lp-layanan"><h2>Pelayanan saat ini</h2>
        <div className="lp-daftar">{tampilan?.poli.length ? tampilan.poli.map(p => <div className="lp-poli" key={p.id}><span className={`lp-titik ${p.sekarang ? '' : 'lp-diam'}`} /><div><h3>{p.nama}</h3><p>{p.sekarang?.status === 'dipanggil' ? 'Sedang dipanggil' : p.sekarang ? 'Sedang dilayani' : 'Menunggu panggilan'}</p></div><strong>{p.sekarang?.kode ?? '—'}</strong></div>) : <p className="lp-kosong">{!data && !galat ? 'Memuat pelayanan…' : 'Belum ada pelayanan aktif.'}</p>}</div>
        <div className="lp-berikut"><h2>Antrean berikutnya</h2><div className="lp-ubin">{tampilan?.poli.map(p => <div key={p.id}><strong>{p.berikutnya ?? '—'}</strong><span>{p.nama}</span></div>)}</div></div>
      </section>
    </div>}
    <footer className="lp-kaki">{sah && <button type="button" className="lp-tombol-suara" onClick={suara.ubahSuara} disabled={!suara.didukung} aria-pressed={suara.aktif}>{!suara.didukung ? 'Suara tidak didukung' : suara.aktif ? 'Suara aktif · Nonaktifkan' : 'Aktifkan suara'}</button>}<p><span className="lp-info" aria-hidden="true">i</span>Mohon menunggu hingga nomor antrean Anda dipanggil.</p><span className={`lp-koneksi ${galat || !sah ? 'lp-gagal' : ''}`} role="status"><i />{!sah ? 'Fasilitas belum dipilih' : galat ? 'Menghubungkan kembali' : data ? mode === 'websocket' ? 'Terhubung langsung' : mode === 'polling' ? 'Terhubung · Mode cadangan' : 'Menghubungkan langsung…' : 'Menghubungkan…'}</span></footer>
    {suara.galatSuara && <div className="lp-galat" role="alert">{suara.galatSuara}</div>}
    {galat && <div className="lp-galat" role="alert">{galat} {data ? 'Informasi yang ditampilkan adalah data terakhir.' : ''}</div>}
  </main>;
}
