import { punyaIzin } from '@klira/shared';
import { HalamanPesanWhatsapp } from './pesan-whatsapp';
import { HalamanPesanInstagram } from './pesan-instagram';
import { usePengguna } from '../util/konteks-pengguna';
import { useNavigasi } from '../util/navigasi';
import { Tab } from '../komponen/ui/tab';
export function HalamanPesan() {
  const { pengguna } = usePengguna();
  const { search, ganti } = useNavigasi();
  const daftar = [
    { id: 'whatsapp', label: 'WhatsApp' },
    { id: 'instagram', label: 'Instagram' },
  ].filter((v) => pengguna && punyaIzin(pengguna, v.id, 'lihat'));
  const kanal = new URLSearchParams(search).get('kanal');
  const aktif = daftar.find((v) => v.id === kanal)?.id ?? daftar[0]?.id;
  if (!aktif) return null;
  return <>
    <Tab daftar={daftar} aktif={aktif} label="Kanal pesan" onPilih={(id) => ganti(`/pesan?kanal=${id}`)} />
    <div id={`panel-${aktif}`} role="tabpanel" aria-labelledby={`tab-${aktif}`} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {aktif === 'instagram' ? <HalamanPesanInstagram /> : <HalamanPesanWhatsapp />}
    </div>
  </>;
}
