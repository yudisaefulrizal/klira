import { useIzin } from './izin-saja';
import { useNavigasi } from '../util/navigasi';
import { KELOMPOK_MASTER, tautanKelolaMaster, type IdKelompokMaster } from '../util/lokasi-master';
import './kelola-master.css';

export function TautanKelolaMaster({ kelompok }: { kelompok: IdKelompokMaster }) {
  const boleh = useIzin();
  const { path, search, pindah } = useNavigasi();
  const tujuan = KELOMPOK_MASTER.find(k => k.id === kelompok)!;
  if (!boleh('master', 'lihat')) return null;
  const href = tautanKelolaMaster(tujuan, `${path}${search}`);
  return <a className="tautan-kelola-master" href={href} onClick={e => {
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    e.preventDefault(); pindah(href);
  }}>{tujuan.judul}</a>;
}
