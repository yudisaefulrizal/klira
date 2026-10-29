import { useEffect, useState } from 'react';
import { usePengguna } from '../util/konteks-pengguna';
import { pantauStatusKoneksi } from '../util/status-koneksi';
import type { StatusLayar, StatusServer } from '../util/status-koneksi';
import './status-koneksi.css';

type Nada = 'baik' | 'tunggu' | 'gagal' | 'netral';
function Penanda({ nada }: { nada: Nada }) {
  return <svg className="status-koneksi-penanda" viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="5.5" fill="currentColor"/><path d={nada === 'baik' ? 'm3 6 2 2 4-4' : nada === 'gagal' ? 'm4 4 4 4m0-4-4 4' : nada === 'netral' ? 'M3 6h6' : 'M6 3v3m0 2v1'} fill="none" stroke="var(--warna-permukaan)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
export function StatusKoneksi() {
  const { pengguna } = usePengguna();
  const fasilitas = pengguna && !pengguna.wajib_ganti_kredensial ? pengguna.fasyankes_id : undefined;
  const [server, setServer] = useState<StatusServer>('memeriksa');
  const [layar, setLayar] = useState<StatusLayar>({ status: 'memeriksa', jumlah: null });
  useEffect(() => {
    const pantau = pantauStatusKoneksi(fasilitas, { asal: window.location.origin, server: setServer, layar: setLayar });
    const periksa = () => void pantau.periksaServer();
    window.addEventListener('online', periksa); window.addEventListener('offline', periksa);
    return () => { pantau.tutup(); window.removeEventListener('online', periksa); window.removeEventListener('offline', periksa); };
  }, [fasilitas]);
  const labelServer = server === 'terhubung' ? 'Server terhubung' : server === 'terputus' ? 'Server tidak dapat dijangkau' : 'Memeriksa koneksi server';
  const labelLayar = !fasilitas ? 'Layar panggilan: masuk untuk melihat status fasilitas' : server === 'terputus' ? 'Layar panggilan: status tidak diketahui karena server terputus' : layar.status === 'terhubung' ? `Layar panggilan: ${layar.jumlah} layar tersambung` : layar.status === 'tidak-ada' ? 'Layar panggilan: belum ada layar tersambung' : layar.status === 'memeriksa' ? 'Memeriksa koneksi layar panggilan' : 'Koneksi pemantauan layar terputus; mencoba kembali';
  const nadaServer: Nada = server === 'terhubung' ? 'baik' : server === 'terputus' ? 'gagal' : 'tunggu';
  const nadaLayar: Nada = !fasilitas ? 'netral' : server === 'terputus' ? 'gagal' : layar.status === 'terhubung' ? 'baik' : layar.status === 'tidak-ada' ? 'netral' : 'tunggu';
  return <div className="status-koneksi" role="group" aria-label="Status koneksi">
    <span className="status-koneksi-ikon" data-nada={nadaServer} role="img" aria-label={labelServer} data-tooltip={labelServer} tabIndex={0}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="7" rx="2"/><path d="M7 6.5h.01M7 17.5h.01M11 6.5h6M11 17.5h6"/></svg><Penanda nada={nadaServer}/>
    </span>
    <span className="status-koneksi-ikon" data-nada={nadaLayar} role="img" aria-label={labelLayar} data-tooltip={labelLayar} tabIndex={0}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2.5" y="3" width="19" height="14" rx="2"/><path d="M8 21h8m-4-4v4m-5-10h5m-5-4h9"/></svg><Penanda nada={nadaLayar}/>
    </span>
  </div>;
}
