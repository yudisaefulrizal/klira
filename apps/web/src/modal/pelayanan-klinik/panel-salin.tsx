import { useEffect, useState } from 'react';
import { KLINIS, NAVIGASI, TOMBOL } from '@klira/shared';
import type { RiwayatKunjunganDto, SalinanKunjunganDto } from '@klira/shared';
import { GalatApi } from '../../api-klien/klien';
import { riwayatKunjungan, salinanKunjungan } from '../../api-klien/klinis';
import { token } from '../../gaya/token';
import { Panel } from '../../komponen/panel/panel';
import { KotakCentang } from '../../komponen/ui/kotak-centang';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Kolom, Tumbuh } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { tanggalPendek } from '../../util/format';
import { bagianDapatDisalin } from './keadaan-pemeriksaan';
import type { BagianSalinan } from './keadaan-pemeriksaan';

type Props = {
  kunjunganId: number;
  pasienId: number;
  /** Menerapkan salinan ke formulir sebagai draf; mengembalikan jumlah bagian yang tersalin. */
  onSalin: (salinan: SalinanKunjunganDto, pilih: readonly BagianSalinan[]) => number;
  onTutup: () => void;
};

/** PANEL Salin dari kunjungan sebelumnya: anamnesis, diagnosis, dan tindakan disalin sebagai draf (belum disahkan sampai disimpan). */
export function PanelSalin({ kunjunganId, pasienId, onSalin, onTutup }: Props) {
  const p = KLINIS.panel;
  const [daftar, setDaftar] = useState<RiwayatKunjunganDto[] | null>(null);
  const [sumber, setSumber] = useState<number | null>(null);
  const [salinan, setSalinan] = useState<SalinanKunjunganDto | null>(null);
  const [pilih, setPilih] = useState<BagianSalinan[]>([]);
  const [galat, setGalat] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [memuat, setMemuat] = useState(false);

  useEffect(() => {
    let batal = false;
    riwayatKunjungan(pasienId, kunjunganId)
      .then((d) => !batal && setDaftar(d))
      .catch((e) => !batal && setGalat(e instanceof GalatApi ? e.message : p.salinGagal));
    return () => {
      batal = true;
    };
  }, [pasienId, kunjunganId, p.salinGagal]);

  async function pilihSumber(id: number) {
    setSumber(id);
    setSalinan(null);
    setInfo(null);
    setGalat(null);
    setMemuat(true);
    try {
      const s = await salinanKunjungan(kunjunganId, id);
      setSalinan(s);
      setPilih(bagianDapatDisalin(s));
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : p.salinGagal);
    } finally {
      setMemuat(false);
    }
  }

  const tersedia = salinan ? bagianDapatDisalin(salinan) : [];
  const alihPilih = (b: BagianSalinan, on: boolean) => setPilih((x) => (on ? [...x.filter((y) => y !== b), b] : x.filter((y) => y !== b)));

  return (
    <Panel judul={p.salinJudul} onTutup={onTutup} aksi={<Tombol type="button" varian="sekunder" onClick={onTutup}>{TOMBOL.tutup}</Tombol>}>
      <p style={{ margin: 0, color: token.warna.teksRedup }}>{p.salinPetunjuk}</p>
      {galat && <Peringatan>{galat}</Peringatan>}
      {info && <Peringatan nada="biru">{info}</Peringatan>}
      {!daftar && !galat && <span style={{ color: token.warna.teksRedup }}>{NAVIGASI.memuat}</span>}
      {daftar?.length === 0 && <p style={{ margin: 0, color: token.warna.teksRedup }}>{p.salinKosong}</p>}
      {daftar && daftar.length > 0 && (
        <Kolom jarak="sm">
          <strong>{p.salinPilih}</strong>
          {daftar.map((r) => (
            <Tombol key={r.id} type="button" varian="langkah" penuh terpilih={sumber === r.id} onClick={() => void pilihSumber(r.id)}>
              <Tumbuh>{tanggalPendek(r.mulai)} · {r.keluhan_utama ?? '-'}</Tumbuh>
            </Tombol>
          ))}
        </Kolom>
      )}
      {memuat && <span style={{ color: token.warna.teksRedup }}>{NAVIGASI.memuat}</span>}
      {salinan && tersedia.length === 0 && <p style={{ margin: 0, color: token.warna.teksRedup }}>{p.salinTidakAda}</p>}
      {salinan && tersedia.length > 0 && (
        <Kolom jarak="sm">
          <strong>{p.salinBagian}</strong>
          {tersedia.map((b) => (
            <KotakCentang key={b} id={`salin-${b}`} label={KLINIS.langkah[b]} checked={pilih.includes(b)} onChange={(e) => alihPilih(b, e.target.checked)} />
          ))}
          <div>
            <Tombol
              type="button" disabled={pilih.length === 0}
              onClick={() => setInfo(p.salinBerhasil(onSalin(salinan, pilih)))}
            >
              {p.salinTombol}
            </Tombol>
          </div>
        </Kolom>
      )}
    </Panel>
  );
}
