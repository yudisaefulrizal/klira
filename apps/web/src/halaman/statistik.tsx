import { GrafikPenumpukan } from './grafik-penumpukan';
import { useEffect, useState } from 'react';
import { tanggalWib } from '@klira/shared';
import type { StatistikDto } from '@klira/shared';
import { panggilApi } from '../api-klien/klien';
import './statistik.css';
const angka = (n: number | null) => n === null ? '—' : new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(n);
const durasi = (n: number | null) => n === null ? 'Belum tersedia' : `${angka(n)} menit`;
export function HalamanStatistik() {
    const hariIni = tanggalWib(new Date());
    const [dari, setDari] = useState(hariIni), [sampai, setSampai] = useState(hariIni), [poli, setPoli] = useState('');
    const [daftarPoli, setDaftarPoli] = useState<StatistikDto['poli']>([]);
    const [data, setData] = useState<StatistikDto | null>(null), [galat, setGalat] = useState(''), [memuat, setMemuat] = useState(true), [ulang, setUlang] = useState(0), [pilih, setPilih] = useState('');
    useEffect(() => {
        let batal = false;
        let sibuk = false;
        const ambil = async () => { if (sibuk)
            return; sibuk = true; setMemuat(true); try {
            const d = await panggilApi<StatistikDto>('GET', `/statistik/pelayanan?${new URLSearchParams({ dari, sampai, ...(poli ? { lokasi_id: poli } : {}) })}`);
            if (!batal) {
                setData(d);
                setDaftarPoli(d.poli);
                setGalat('');
            }
        }
        catch (e) {
            if (!batal) {
                setData(null);
                setGalat(e instanceof Error ? e.message : 'Gagal memuat statistik.');
            }
        }
        finally {
            sibuk = false;
            if (!batal)
                setMemuat(false);
        } };
        setData(null);
        void ambil();
        const timer = setInterval(() => void ambil(), 60000);
        return () => { batal = true; clearInterval(timer); };
    }, [dari, sampai, poli, ulang]);
    const rentang = (n: number) => { setSampai(hariIni); setDari(tanggalWib(new Date(Date.now() - (n - 1) * 86400000))); };
    const sorot = data?.tahap.filter(t => t.perhatian) ?? [];
    const daftar = data?.terlambat.filter(t => !pilih || data.tahap.find(s => s.kode === pilih)?.nama === t.tahap).slice(0, 20) ?? [];
    return <div className="statistik">
  <header className="stat-kepala"><div><h1>Analisis Alur Pelayanan</h1><p>Temukan hambatan pada setiap tahap pelayanan rawat jalan.</p></div><button onClick={() => setUlang(n => n + 1)} disabled={memuat}>{memuat ? 'Memuat…' : 'Perbarui'}</button></header>
  <section className="stat-filter" aria-label="Filter statistik"><label>Dari<input aria-label="Dari" type="date" value={dari} max={sampai} onChange={e => setDari(e.target.value)}/></label><label>Sampai<input aria-label="Sampai" type="date" value={sampai} min={dari} max={hariIni} onChange={e => setSampai(e.target.value)}/></label><label>Poli<select aria-label="Poli" value={poli} onChange={e => setPoli(e.target.value)}><option value="">Semua poli</option>{daftarPoli.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}</select></label><button onClick={() => rentang(1)}>Hari ini</button><button onClick={() => rentang(7)}>7 hari</button><button onClick={() => rentang(30)}>30 hari</button></section>
  {galat && <div role="alert" className="stat-perhatian">{galat} <button onClick={() => setUlang(n => n + 1)}>Coba lagi</button></div>}
  {!data && memuat && <p role="status">Memuat statistik pelayanan…</p>}
  {data && <>
   <div className="stat-ringkasan"><article><span>Kunjungan dalam periode</span><strong>{angka(data.total)}</strong></article><article><span>Pasien unik dalam periode</span><strong>{angka(data.pasien_unik)}</strong></article><article><span>Pasien dalam proses saat ini</span><strong>{angka(data.tahap.reduce((n, t) => n + t.aktif, 0))}</strong></article><article><span>Tahap perlu perhatian</span><strong>{sorot.length}</strong></article></div>
   <div className={sorot.length ? 'stat-perhatian' : 'stat-info'} role="status">{sorot.length ? <><strong>Perlu perhatian: {sorot.map(t => t.nama).join(', ')}</strong><p>Durasi melebihi target acuan atau pasien masuk lebih banyak daripada selesai dalam 60 menit terakhir.</p></> : <><strong>Belum ada indikasi hambatan dari data yang tercatat.</strong><p>Perhatikan cakupan pencatatan dan jumlah sampel sebelum menyimpulkan kelancaran layanan.</p></>}</div>
   <div className="stat-subjudul"><h2>Alur pasien saat ini</h2><span>Diperbarui {new Date(data.diperbarui).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB · otomatis setiap menit</span></div>
   <div className="stat-chip"><button aria-pressed={!pilih} onClick={() => setPilih('')}>Semua tahap</button>{data.tahap.map(t => <button key={t.kode} aria-pressed={pilih === t.kode} onClick={() => setPilih(t.kode)}>{t.nama} · {t.aktif}</button>)}</div>
   <div className="stat-alur">{data.tahap.map((t, i) => <article className={`stat-kartu ${t.perhatian ? 'stat-hambat' : ''} ${pilih === t.kode ? 'stat-terpilih' : ''}`} key={t.kode}><div className="stat-baris"><h3><small>0{i + 1}</small> {t.nama}</h3><span className={`stat-label ${t.perhatian ? 'waspada' : ''}`}>{t.perhatian ? 'Perlu perhatian' : 'Terpantau'}</span></div><div className="stat-jumlah">{t.aktif} <span>pasien dalam tahap</span></div><dl><div><dt>Median durasi tahap</dt><dd>{durasi(t.median)}</dd></div><div><dt>P90 durasi tahap</dt><dd>{durasi(t.p90)}</dd></div><div><dt>Terlama saat ini</dt><dd>{durasi(t.terlama)}</dd></div></dl><p className="stat-catatan">{t.sampel} tahap selesai dalam periode · target acuan {t.target} menit</p>{t.tanpa_waktu > 0 && <p className="stat-catatan">{t.tanpa_waktu} pasien belum memiliki waktu masuk tahap.</p>}<footer>60 menit terakhir: masuk {t.masuk_jam} · selesai {t.selesai_jam}</footer></article>)}</div>
   <div className="stat-dua"><section className="stat-panel"><h2>Durasi per tahap</h2><p>Median tahap selesai dibanding target acuan, dalam menit</p>{data.tahap.map(t => <div className="stat-bar" key={t.kode}><span>{t.nama}</span><div className="stat-jalur"><i style={{ width: `${Math.min(100, (t.median ?? 0) / Math.max(60, ...data.tahap.map(t => t.median ?? 0)) * 100)}%`, background: t.perhatian ? 'var(--status-kuning-teks)' : undefined }}/><b style={{ left: `${t.target / Math.max(60, ...data.tahap.map(t => t.median ?? 0)) * 100}%` }} title={`Target ${t.target} menit`}/></div><strong>{angka(t.median)}</strong></div>)}<p className="stat-catatan">Garis tegak = target acuan. — = belum ada tahap selesai yang tercatat.</p></section>
   <section className="stat-panel"><h2>Penumpukan per tahap</h2><p>Pasien dalam tahap pada 8 titik waktu terakhir · data tercatat</p><GrafikPenumpukan data={data}/></section></div>
   <section className="stat-panel"><h2>Pasien yang perlu ditindaklanjuti</h2><p>Maksimal 20 durasi tahap terlama yang melewati target acuan, {pilih ? 'pada tahap terpilih' : 'seluruh tahap'}.</p><div className="stat-tabel"><table><thead><tr><th>Antrean</th><th>Poli</th><th>Tahap</th><th>Durasi saat ini</th><th>Target acuan</th><th>Status</th></tr></thead><tbody>{daftar.map(r => <tr key={r.id}><td>{r.nomor}</td><td>{r.poli}</td><td>{r.tahap}</td><td>{r.menit} menit</td><td>{r.target} menit</td><td><span className="stat-label waspada">Melewati target</span></td></tr>)}{!daftar.length && <tr><td colSpan={6}>Belum ada pasien melewati target dari data yang tercatat.</td></tr>}</tbody></table></div></section>
   <div className="stat-dua"><section className="stat-panel"><h2>Tren kunjungan</h2><p>Jumlah kunjungan per tanggal · antrean batal dikecualikan</p><div className="stat-kolom">{data.tren.map(r => <div key={r.tanggal} title={`${r.tanggal}: ${r.jumlah} kunjungan`}><span>{r.jumlah}</span><i style={{ height: `${Math.max(2, r.jumlah / Math.max(1, ...data.tren.map(t => t.jumlah)) * 110)}px` }}/><small>{r.tanggal.slice(8)}</small></div>)}</div></section><section className="stat-panel"><h2>Hari sibuk</h2><p>Rata-rata kunjungan per hari dalam periode terpilih</p>{data.hari.map(r => <div className="stat-bar" key={r.nama}><span>{r.nama}</span><div className="stat-jalur"><i style={{ width: `${r.rata / Math.max(1, ...data.hari.map(h => h.rata)) * 100}%` }}/></div><strong>{angka(r.rata)}</strong></div>)}</section></div>
   <section className="stat-panel"><h2>Pola hari dan jam sibuk</h2><p>Rata-rata kedatangan pada setiap hari dan jam, berdasarkan waktu pendaftaran (WIB).</p><div className="stat-tabel"><table className="stat-heat"><thead><tr><th>Hari / Jam</th>{data.jam.map((_, i) => <th key={i}>{String(i).padStart(2, '0')}</th>)}</tr></thead><tbody>{data.kepadatan.map((row, i) => <tr key={i}><th>{data.hari[i].nama}</th>{row.map((n, j) => <td key={j} title={`${data.hari[i].nama}, ${j}.00: ${angka(n)} pasien`} style={{ background: n ? `color-mix(in srgb, var(--warna-utama) ${Math.round(15 + 65 * n / Math.max(1, ...data.kepadatan.flat()))}%, var(--warna-permukaan))` : undefined }}>{n ? angka(n) : '·'}</td>)}</tr>)}</tbody></table></div></section>
   <p className="stat-catatan">Durasi tahap mencakup waktu menunggu dan pengerjaan; keduanya belum dicatat terpisah. P90 berarti 90% tahap selesai memiliki durasi paling lama sebesar nilai tersebut. Target adalah acuan operasional awal, bukan standar klinis. Riwayat mulai terkumpul sejak fitur diaktifkan; data lama tidak direkayasa. Filter tanggal berlaku untuk ringkasan dan tahap selesai; kondisi saat ini serta 60 menit terakhir selalu menggunakan waktu sekarang.</p>
  </>}
 </div>;
}
