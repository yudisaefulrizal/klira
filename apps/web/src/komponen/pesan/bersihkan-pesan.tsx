import { useRef, useState } from 'react';
import { panggilApi } from '../../api-klien/klien';
import { Konfirmasi } from '../konfirmasi/konfirmasi';
import { Peringatan } from '../ui/peringatan';
import { Kolom } from '../ui/susunan';
import { Tombol } from '../ui/tombol';

type Props = { kanal: 'whatsapp' | 'instagram'; onSelesai: () => void };
export function BersihkanPesan({ kanal, onSelesai }: Props) {
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState('');
  const [hasil, setHasil] = useState('');
  const berjalan = useRef(false);
  const nama = kanal === 'whatsapp' ? 'WhatsApp' : 'Instagram';
  async function bersihkan() {
    if (berjalan.current) return;
    berjalan.current = true;
    setSibuk(true);
    setGalat('');
    setHasil('');
    try {
      const data = await panggilApi<{ percakapan: number; pesan: number }>('DELETE', `/${kanal}/percakapan`, { konfirmasi: kanal });
      onSelesai();
      setKonfirmasi(false);
      setHasil(`${data.percakapan} percakapan dan ${data.pesan} pesan ${nama} dibersihkan.`);
    } catch (e) {
      setGalat(e instanceof Error ? e.message : 'Pesan gagal dibersihkan.');
      setKonfirmasi(false);
    } finally {
      berjalan.current = false;
      setSibuk(false);
    }
  }
  return <Kolom jarak="sm">
    <div><Tombol type="button" varian="sekunder" disabled={sibuk} onClick={() => { setGalat(''); setHasil(''); setKonfirmasi(true); }}>{sibuk ? 'Membersihkan…' : 'Bersihkan pesan'}</Tombol></div>
    {galat && <Peringatan nada="merah">{galat}</Peringatan>}
    {hasil && <span role="status">{hasil}</span>}
    {konfirmasi && <Konfirmasi judul={`Bersihkan semua pesan ${nama}?`}
      pesan={`Seluruh percakapan dan lampiran ${nama} di Klira akan dihapus dan tidak dapat dikembalikan. Pesan di aplikasi ${nama} dan koneksi akun tetap ada.`}
      labelYa="Bersihkan semua" memproses={sibuk} onYa={() => void bersihkan()} onTidak={() => { if (!berjalan.current) setKonfirmasi(false); }} />}
  </Kolom>;
}
