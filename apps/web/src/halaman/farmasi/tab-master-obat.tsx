import { useCallback, useEffect, useState } from 'react';
import { FARMASI, STATUS_STOK } from '@klira/shared';
import type { HalamanMasterObatDto, MasterObatDto } from '@klira/shared';
import { daftarMasterObat, ubahMasterObat } from '../../api-klien/farmasi';
import { GalatApi } from '../../api-klien/klien';
import { HanyaDenganIzin, useIzin } from '../../komponen/izin-saja';
import { Paginasi } from '../../komponen/paginasi';
import { Isian } from '../../komponen/ui/isian';
import { Kartu } from '../../komponen/ui/kartu';
import { Lencana } from '../../komponen/ui/lencana';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Sebaris, Tumbuh } from '../../komponen/ui/susunan';
import { BarisTabel, SelTabel, Tabel } from '../../komponen/ui/tabel';
import { Tombol } from '../../komponen/ui/tombol';
import { token } from '../../gaya/token';
import { MasterObat } from '../../modal/pelayanan-klinik/master-obat';
import { MutasiStok } from '../../modal/pelayanan-klinik/mutasi-stok';
import { rupiah } from '../../modal/pelayanan-klinik/keadaan-order-lab';

const M = FARMASI.master;
const UKURAN = 20;
const KOLOM = [
  { judul: M.kolom.nama }, { judul: M.kolom.kfa }, { judul: M.kolom.satuan }, { judul: M.kolom.harga }, { judul: M.kolom.stok },
  { judul: M.kolom.kedaluwarsa }, { judul: M.kolom.status }, { judul: M.kolom.tindakan, rataKanan: true },
];
type Modal = { jenis: 'obat'; obat?: MasterObatDto } | { jenis: 'mutasi'; obat: MasterObatDto } | null;

/** Tab Master obat dan stok (3.1): daftar obat tertaut KFA dengan stok dan penanda menipis atau kedaluwarsa dekat; tambah, ubah, aktif/nonaktif, mutasi stok. */
export function TabMasterObat() {
  const boleh = useIzin();
  const [cari, setCari] = useState('');
  const [halaman, setHalaman] = useState(1);
  const [hasil, setHasil] = useState<HalamanMasterObatDto | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [muat, setMuat] = useState(0);
  const [modal, setModal] = useState<Modal>(null);

  const selesai = useCallback(() => {
    setModal(null);
    setMuat((n) => n + 1);
  }, []);

  useEffect(() => {
    let batal = false;
    const t = setTimeout(() => {
      daftarMasterObat({ cari, halaman, ukuran: UKURAN })
        .then((h) => {
          if (batal) return;
          setHasil(h);
          setGalat(null);
        })
        .catch((e) => !batal && setGalat(e instanceof GalatApi ? e.message : M.gagalMuat));
    }, 250);
    return () => {
      batal = true;
      clearTimeout(t);
    };
  }, [cari, halaman, muat]);

  async function gantiAktif(o: MasterObatDto) {
    try {
      await ubahMasterObat(o.id, { aktif: !o.aktif });
      setMuat((n) => n + 1);
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : M.gagalMuat);
    }
  }

  return (
    <>
      <Sebaris jarak="md" bungkus sejajar="akhir">
        <Tumbuh>
          <Isian id="cari-obat" label={M.cari} type="search" value={cari} onChange={(e) => { setCari(e.target.value); setHalaman(1); }} autoComplete="off" />
        </Tumbuh>
        <HanyaDenganIzin fitur="farmasi" aksi="input">
          <Tombol type="button" onClick={() => setModal({ jenis: 'obat' })}>{M.tambah}</Tombol>
        </HanyaDenganIzin>
      </Sebaris>
      {galat && <Peringatan>{galat}</Peringatan>}
      <Kartu style={{ padding: 0, overflow: 'hidden' }}>
        <Tabel kolom={KOLOM} label={FARMASI.tab.master}>
          {hasil?.data.map((o) => (
            <BarisTabel key={o.id}>
              <SelTabel style={{ fontWeight: token.huruf.berat.tebal }}>{o.nama_tampil}</SelTabel>
              <SelTabel>{o.kfa_kode}{o.kfa_contoh && <> <Lencana warna="kuning">{M.contoh}</Lencana></>}</SelTabel>
              <SelTabel>{o.satuan}</SelTabel>
              <SelTabel>{rupiah(o.harga)}</SelTabel>
              <SelTabel style={{ fontWeight: token.huruf.berat.tebal }}>{o.stok_total}</SelTabel>
              <SelTabel>{o.kedaluwarsa_terdekat ?? '-'}</SelTabel>
              <SelTabel>
                <Lencana warna={STATUS_STOK.warna(o.status_stok)}>{STATUS_STOK.label(o.status_stok)}</Lencana>
                {!o.aktif && <> <Lencana warna="abu">{M.nonaktif}</Lencana></>}
              </SelTabel>
              <SelTabel style={{ textAlign: 'right' }}>
                <Sebaris sebaris jarak="sm" bungkus sebaran="akhir">
                  {boleh('farmasi', 'input') && <Tombol type="button" varian="teks" onClick={() => setModal({ jenis: 'mutasi', obat: o })}>{M.mutasi}</Tombol>}
                  {boleh('farmasi', 'perbaikan') && <Tombol type="button" varian="teks" onClick={() => setModal({ jenis: 'obat', obat: o })}>{M.ubah}</Tombol>}
                  {boleh('farmasi', 'perbaikan') && <Tombol type="button" varian="teks" onClick={() => void gantiAktif(o)}>{o.aktif ? M.nonaktifkan : M.aktifkan}</Tombol>}
                </Sebaris>
              </SelTabel>
            </BarisTabel>
          ))}
        </Tabel>
        {hasil && hasil.data.length === 0 && <div style={{ padding: token.jarak.md, color: token.warna.teksRedup }}>{M.kosong}</div>}
        {hasil && <Paginasi halaman={halaman} total={hasil.total} ukuran={hasil.ukuran} onPindah={setHalaman} />}
      </Kartu>
      <p style={{ margin: 0, color: token.warna.teksRedup }}>{M.catatan}</p>
      {modal?.jenis === 'obat' && <MasterObat obat={modal.obat} onTutup={() => setModal(null)} onSelesai={selesai} />}
      {modal?.jenis === 'mutasi' && <MutasiStok obat={modal.obat} onTutup={() => setModal(null)} onSelesai={selesai} />}
    </>
  );
}
