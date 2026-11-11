import { useEffect, useState } from 'react';
import { KUNJUNGAN } from '@klira/shared';
import type { PasienDetailDto } from '@klira/shared';
import { detailPasien } from '../../api-klien/pasien';
import { Peringatan } from '../../komponen/ui/peringatan';
import { DaftarRingkasan } from '../../komponen/ui/susunan';
import { keteranganAsuransi } from './keadaan-kunjungan';

const T = KUNJUNGAN.asuransi;

/**
 * Keterangan baca saja untuk cara bayar Asuransi lain (pendaftaran kunjungan dan admisi): nama asuransi dan nomor polis
 * dari data pasien. Bila belum diisi, tampil peringatan lunak agar dilengkapi di data pasien; tidak memblokir pendaftaran.
 */
export function KeteranganAsuransi({ pasienId }: { pasienId: number }) {
  const [pasien, setPasien] = useState<PasienDetailDto | null>(null);
  const [selesai, setSelesai] = useState(false);
  useEffect(() => {
    let batal = false;
    setPasien(null);
    setSelesai(false);
    detailPasien(pasienId)
      .then((p) => !batal && setPasien(p))
      .catch(() => !batal && setPasien(null))
      .finally(() => !batal && setSelesai(true));
    return () => {
      batal = true;
    };
  }, [pasienId]);
  if (!selesai) return null;
  const ket = keteranganAsuransi(pasien);
  if (!ket) return <Peringatan nada="kuning">{T.belumAda}</Peringatan>;
  return <DaftarRingkasan bagian={[{ judul: T.judul, baris: [{ label: T.nama, nilai: ket.nama ?? '-' }, { label: T.polis, nilai: ket.polis ?? '-' }] }]} />;
}
