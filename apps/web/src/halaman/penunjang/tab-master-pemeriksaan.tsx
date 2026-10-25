import { useCallback, useEffect, useState } from 'react';
import { PENUNJANG } from '@klira/shared';
import type { MasterPemeriksaanDto } from '@klira/shared';
import { daftarMasterPemeriksaan, ubahMasterPemeriksaan } from '../../api-klien/penunjang';
import { GalatApi } from '../../api-klien/klien';
import { HanyaDenganIzin, useIzin } from '../../komponen/izin-saja';
import { Isian } from '../../komponen/ui/isian';
import { Kartu } from '../../komponen/ui/kartu';
import { Lencana } from '../../komponen/ui/lencana';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Sebaris } from '../../komponen/ui/susunan';
import { BarisTabel, SelTabel, Tabel } from '../../komponen/ui/tabel';
import { Tombol } from '../../komponen/ui/tombol';
import { token } from '../../gaya/token';
import { MasterPemeriksaan } from '../../modal/pelayanan-klinik/master-pemeriksaan';
import { rupiah } from '../../modal/pelayanan-klinik/keadaan-order-lab';

const M = PENUNJANG.master;
const KOLOM = [
  { judul: M.kolom.kode }, { judul: M.kolom.nama }, { judul: M.kolom.loinc }, { judul: M.kolom.satuan }, { judul: M.kolom.rujukan },
  { judul: M.kolom.tarif }, { judul: M.kolom.status }, { judul: M.kolom.tindakan, rataKanan: true },
];

const teksRujukan = (m: MasterPemeriksaanDto): string =>
  m.rujukan_teks ?? (m.rujukan_min !== null || m.rujukan_maks !== null ? `${m.rujukan_min ?? ''} - ${m.rujukan_maks ?? ''}` : '-');

/** Tab Master pemeriksaan (3.1): daftar, cari, tambah, ubah, aktif/nonaktif; harga datang dari Tarif layanan. */
export function TabMasterPemeriksaan() {
  const boleh = useIzin();
  const [cari, setCari] = useState('');
  const [data, setData] = useState<MasterPemeriksaanDto[] | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [muat, setMuat] = useState(0);
  const [modal, setModal] = useState<{ master?: MasterPemeriksaanDto } | null>(null);

  const selesai = useCallback(() => {
    setModal(null);
    setMuat((n) => n + 1);
  }, []);

  useEffect(() => {
    let batal = false;
    const t = setTimeout(() => {
      daftarMasterPemeriksaan({ cari })
        .then((d) => {
          if (batal) return;
          setData(d);
          setGalat(null);
        })
        .catch((e) => !batal && setGalat(e instanceof GalatApi ? e.message : M.gagalMuat));
    }, 250);
    return () => {
      batal = true;
      clearTimeout(t);
    };
  }, [cari, muat]);

  async function gantiAktif(m: MasterPemeriksaanDto) {
    try {
      await ubahMasterPemeriksaan(m.id, { aktif: !m.aktif });
      setMuat((n) => n + 1);
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : M.gagalMuat);
    }
  }

  return (
    <>
      <Sebaris jarak="md" bungkus sejajar="akhir">
        <Isian id="cari-master" label={M.cari} type="search" value={cari} onChange={(e) => setCari(e.target.value)} autoComplete="off" />
        <HanyaDenganIzin fitur="penunjang" aksi="input">
          <Tombol type="button" onClick={() => setModal({})}>{M.tambah}</Tombol>
        </HanyaDenganIzin>
      </Sebaris>
      {galat && <Peringatan>{galat}</Peringatan>}
      <Kartu style={{ padding: 0, overflow: 'hidden' }}>
        <Tabel kolom={KOLOM} label={M.judul}>
          {data?.map((m) => (
            <BarisTabel key={m.id}>
              <SelTabel style={{ fontWeight: token.huruf.berat.tebal }}>{m.kode}</SelTabel>
              <SelTabel>{m.nama}</SelTabel>
              <SelTabel>{m.kode_loinc ?? '-'}{m.loinc_contoh && <> <Lencana warna="kuning">{M.contoh}</Lencana></>}</SelTabel>
              <SelTabel>{m.satuan ?? '-'}</SelTabel>
              <SelTabel>{teksRujukan(m)}</SelTabel>
              <SelTabel>{m.tarif ? rupiah(m.tarif.harga_umum) : M.tanpaTarif}</SelTabel>
              <SelTabel><Lencana warna={m.aktif ? 'hijau' : 'abu'}>{m.aktif ? M.aktif : M.nonaktif}</Lencana></SelTabel>
              <SelTabel style={{ textAlign: 'right' }}>
                {boleh('penunjang', 'perbaikan') && (
                  <Sebaris sebaris jarak="sm" sebaran="akhir">
                    <Tombol type="button" varian="teks" onClick={() => setModal({ master: m })}>{M.ubah}</Tombol>
                    <Tombol type="button" varian="teks" onClick={() => void gantiAktif(m)}>{m.aktif ? M.nonaktifkan : M.aktifkan}</Tombol>
                  </Sebaris>
                )}
              </SelTabel>
            </BarisTabel>
          ))}
        </Tabel>
        {data && data.length === 0 && <div style={{ padding: token.jarak.md, color: token.warna.teksRedup }}>{M.kosong}</div>}
      </Kartu>
      {modal && <MasterPemeriksaan master={modal.master} onTutup={() => setModal(null)} onSelesai={selesai} />}
    </>
  );
}
