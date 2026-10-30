import { useEffect, useState } from 'react';
import { PENUNJANG } from '@klira/shared';
import type { MasterPemeriksaanDto } from '@klira/shared';
import { GalatApi } from '../../api-klien/klien';
import { daftarMasterPemeriksaan } from '../../api-klien/penunjang';
import { token } from '../../gaya/token';
import { useIzin } from '../../komponen/izin-saja';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Kolom } from '../../komponen/ui/susunan';
import { FormOrderLab } from './form-order-lab';
import type { KeadaanOrderLab } from './keadaan-order-lab';

type Props = {
  cara: 'umum' | 'jkn';
  k: KeadaanOrderLab;
  onUbah: (k: KeadaanOrderLab) => void;
  disabled?: boolean;
  galatPilihan?: string | null;
};

/**
 * Pilihan lab di P–Plan; status dan hasil tersimpan dibaca di ringkasan dan bagian Objective.
 * Pilihan dikelola induk sebagai draf dan dikirim lewat Simpan pemeriksaan.
 */
export function LangkahPenunjang({ cara, k, onUbah, disabled, galatPilihan }: Props) {
  const boleh = useIzin();
  const bolehPesan = boleh('klinis', 'input');
  const O = PENUNJANG.order;
  const [master, setMaster] = useState<MasterPemeriksaanDto[] | null>(null);
  const [galat, setGalat] = useState<string | null>(null);

  useEffect(() => {
    let batal = false;
    (bolehPesan ? daftarMasterPemeriksaan({ aktif: true }) : Promise.resolve([] as MasterPemeriksaanDto[]))
      .then((m) => {
        if (batal) return;
        setMaster(m);
      })
      .catch((e) => !batal && setGalat(e instanceof GalatApi ? e.message : O.gagalMuat));
    return () => {
      batal = true;
    };
  }, [bolehPesan, O.gagalMuat]);

  return (
    <Kolom>
      {galat && <Peringatan>{galat}</Peringatan>}
      {bolehPesan && !master && !galat && <span style={{ color: token.warna.teksRedup }}>{PENUNJANG.memuat}</span>}
      {bolehPesan && master && (
        <fieldset disabled={disabled} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }} aria-label={PENUNJANG.aksi.order}>
          <FormOrderLab ringkas awalan="langkah-lab" master={master} k={k} onUbah={onUbah} cara={cara} galat={galatPilihan} />
        </fieldset>
      )}
    </Kolom>
  );
}
