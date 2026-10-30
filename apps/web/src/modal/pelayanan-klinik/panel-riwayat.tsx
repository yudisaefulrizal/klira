import { useEffect, useState } from 'react';
import { JENIS_KUNJUNGAN, KLINIS, NAVIGASI, STATUS_PERAN_DIAGNOSIS, TOMBOL } from '@klira/shared';
import type { RiwayatKunjunganDto } from '@klira/shared';
import { GalatApi } from '../../api-klien/klien';
import { riwayatKunjungan } from '../../api-klien/klinis';
import { token } from '../../gaya/token';
import { Panel } from '../../komponen/panel/panel';
import { Kartu } from '../../komponen/ui/kartu';
import { Lencana } from '../../komponen/ui/lencana';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Kolom, Sebaris } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { DetailSoapie } from './detail-soapie';
import { tanggalPendek } from '../../util/format';

type Props = { pasienId: number; nama: string; kecualiKunjunganId?: number; onTutup: () => void };

/** PANEL Riwayat: kunjungan sebelumnya pasien secara ringkas (keluhan, diagnosis, tindak lanjut); pembukaannya tercatat di audit. */
export function PanelRiwayat({ pasienId, nama, kecualiKunjunganId, onTutup }: Props) {
  const [terbuka, setTerbuka] = useState<number | null>(null);
  const [data, setData] = useState<RiwayatKunjunganDto[] | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  useEffect(() => {
    let batal = false;
    riwayatKunjungan(pasienId, kecualiKunjunganId)
      .then((d) => !batal && setData(d))
      .catch((e) => !batal && setGalat(e instanceof GalatApi ? e.message : KLINIS.panel.riwayatGagal));
    return () => {
      batal = true;
    };
  }, [pasienId, kecualiKunjunganId]);
  const p = KLINIS.panel;
  const jenisLanjut = (j: string) => KLINIS.tindakLanjut.jenisOpsi.find((o) => o.nilai === j)?.label ?? j;

  return (
    <Panel judul={`${p.riwayatJudul}: ${nama}`} onTutup={onTutup} aksi={<Tombol type="button" varian="sekunder" onClick={onTutup}>{TOMBOL.tutup}</Tombol>}>
      <Peringatan nada="biru">{p.riwayatTercatat}</Peringatan>
      {galat && <Peringatan>{galat}</Peringatan>}
      {!data && !galat && <span style={{ color: token.warna.teksRedup }}>{NAVIGASI.memuat}</span>}
      {data?.length === 0 && <p style={{ margin: 0, color: token.warna.teksRedup }}>{p.riwayatKosong}</p>}
      {data?.map((r) => (
        <Kartu key={r.id}>
          <Kolom jarak="sm">
            <Sebaris>
              <strong style={{ flexGrow: 1 }}>{tanggalPendek(r.mulai)}</strong>
              <span style={{ color: token.warna.teksRedup }}>{r.poli_nama ?? ''}</span>
              <Lencana warna={JENIS_KUNJUNGAN.warna(r.jenis)}>{JENIS_KUNJUNGAN.label(r.jenis)}</Lencana>
            </Sebaris>
            <div><span style={{ color: token.warna.teksRedup }}>{p.keluhan}: </span>{r.keluhan_utama ?? '-'}</div>
            <div>
              <span style={{ color: token.warna.teksRedup }}>{p.diagnosis}: </span>
              {r.diagnosis.length === 0 ? p.tanpaDiagnosis : r.diagnosis.map((d) => `${d.kode} ${d.nama}${d.peran === 'utama' ? '' : ` (${STATUS_PERAN_DIAGNOSIS.label(d.peran)})`}`).join('; ')}
            </div>
            {r.tindak_lanjut && <div><span style={{ color: token.warna.teksRedup }}>{p.tindakLanjut}: </span>{jenisLanjut(r.tindak_lanjut)}</div>}
            <Tombol type="button" varian="teks" onClick={() => setTerbuka(terbuka === r.id ? null : r.id)}>{terbuka === r.id ? 'Tutup catatan SOAPIE' : 'Lihat catatan SOAPIE'}</Tombol>
            {terbuka === r.id && <DetailSoapie kunjunganId={r.id} />}
          </Kolom>
        </Kartu>
      ))}
    </Panel>
  );
}
