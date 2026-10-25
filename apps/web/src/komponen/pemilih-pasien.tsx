import { useEffect, useState } from 'react';
import { REKAM_MEDIS } from '@klira/shared';
import type { PasienBarisDto } from '@klira/shared';
import { daftarPasien } from '../api-klien/pasien';
import { useNilaiTertunda } from '../util/tunda';
import { Isian } from './ui/isian';
import { Pilihan } from './ui/pilihan';
import { Kolom } from './ui/susunan';

type Props = { id: string; pasienId: number | null; onPilih: (id: number | null) => void; galat?: string };
const D = REKAM_MEDIS.dok;

/** Pemilih pasien: cari nama atau nomor RM (saran otomatis), lalu pilih dari hasil. */
export function PemilihPasien({ id, pasienId, onPilih, galat }: Props) {
  const [q, setQ] = useState('');
  const tertunda = useNilaiTertunda(q.trim(), 250);
  const [hasil, setHasil] = useState<PasienBarisDto[]>([]);

  useEffect(() => {
    if (!tertunda) return setHasil([]);
    let batal = false;
    daftarPasien({ cari: tertunda, halaman: 1, ukuran: 10 }).then((h) => !batal && setHasil(h.data)).catch(() => !batal && setHasil([]));
    return () => {
      batal = true;
    };
  }, [tertunda]);

  return (
    <Kolom jarak="sm">
      <Isian id={`${id}-cari`} label={D.pasienCari} type="search" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
      <Pilihan
        id={id} label={D.pasienLabel} galat={galat} value={pasienId === null ? '' : String(pasienId)} onChange={(e) => onPilih(e.target.value ? Number(e.target.value) : null)}
        opsi={[{ nilai: '', label: tertunda && !hasil.length ? D.pasienKosong : D.pasienPilih }, ...hasil.map((p) => ({ nilai: String(p.id), label: `${p.nama} (${p.nomor_rm})` }))]}
      />
    </Kolom>
  );
}
