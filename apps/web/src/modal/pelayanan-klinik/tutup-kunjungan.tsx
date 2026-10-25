import { useEffect, useState } from 'react';
import { KASIR, TOMBOL } from '@klira/shared';
import type { KasirKunjunganDto } from '@klira/shared';
import { kasirKunjungan, tutupKunjungan } from '../../api-klien/kasir';
import { GalatApi } from '../../api-klien/klien';
import { token } from '../../gaya/token';
import { Modal1 } from '../../komponen/modal-1/modal-1';
import { AreaTeks } from '../../komponen/ui/area-teks';
import { Lencana } from '../../komponen/ui/lencana';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Kolom, Sebaris, Tumbuh } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { bisaTutup, daftarSyarat } from './keadaan-kasir';
import { KepalaPasien } from './kepala-pasien';
import { rupiah } from './keadaan-order-lab';

type Props = { kunjunganId: number; onTutup: () => void; onSelesai: () => void };
const T = KASIR.tutup;
const LABEL = { tahap: KASIR.bayar.syarat.tahap, tagihan: KASIR.bayar.syarat.tagihan, resep: KASIR.bayar.syarat.resep, lunas: KASIR.bayar.syarat.lunas } as const;

/** Modal Tutup kunjungan (3.3, MODAL-1): memeriksa syarat (tahap kasir, tagihan lengkap, resep diserahkan); belum lunas hanya ditutup dengan alasan yang tercatat di audit. */
export function TutupKunjungan({ kunjunganId, onTutup, onSelesai }: Props) {
  const [g, setG] = useState<KasirKunjunganDto | null>(null);
  const [alasan, setAlasan] = useState('');
  const [galat, setGalat] = useState<string | null>(null);
  const [memproses, setMemproses] = useState(false);
  const [selesai, setSelesai] = useState(false);

  useEffect(() => {
    let batal = false;
    kasirKunjungan(kunjunganId)
      .then((h) => !batal && setG(h))
      .catch((e) => !batal && setGalat(e instanceof GalatApi ? e.message : KASIR.bayar.gagal));
    return () => {
      batal = true;
    };
  }, [kunjunganId]);

  async function tutup() {
    if (!g || memproses || !bisaTutup(g, alasan)) return;
    setMemproses(true);
    setGalat(null);
    try {
      setG(await tutupKunjungan(kunjunganId, g.syarat.lunas ? {} : { alasan }));
      setSelesai(true);
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : KASIR.bayar.gagal);
    } finally {
      setMemproses(false);
    }
  }

  const kepala = g ? <KepalaPasien nama={g.kunjungan.pasien_nama} nomorRm={g.kunjungan.pasien_nomor_rm} /> : undefined;

  if (selesai) {
    return (
      <Modal1 judul={T.judul} lebar="modalKecil" konteks={kepala} onTutup={onSelesai} aksi={<Tombol type="button" onClick={onSelesai}>{TOMBOL.tutup}</Tombol>}>
        <Peringatan nada="biru"><strong>{T.berhasil}</strong> {T.berhasilPesan}</Peringatan>
      </Modal1>
    );
  }

  return (
    <Modal1
      judul={T.judul}
      konteks={kepala}
      lindungiTutup={alasan.trim().length > 0}
      onTutup={onTutup}
      aksi={
        <>
          <Tombol type="button" varian="sekunder" onClick={onTutup}>{TOMBOL.batal}</Tombol>
          <Tombol type="button" disabled={!g || memproses || !bisaTutup(g, alasan)} onClick={() => void tutup()}>{memproses ? T.menutup : T.simpan}</Tombol>
        </>
      }
    >
      {galat && <Peringatan>{galat}</Peringatan>}
      {!g && !galat && <span style={{ color: token.warna.teksRedup }}>{KASIR.memuat}</span>}
      {g && (
        <Kolom>
          <strong>{T.syaratJudul}</strong>
          {daftarSyarat(g).map((s) => (
            <Sebaris key={s.kunci} jarak="sm" bungkus>
              <Tumbuh tag="span">{LABEL[s.kunci]}</Tumbuh>
              <Lencana warna={s.ok ? 'hijau' : s.wajib ? 'merah' : 'kuning'}>{s.ok ? T.ok : T.belum}</Lencana>
            </Sebaris>
          ))}
          {!g.syarat.lunas && g.tagihan.sisa > 0 && (
            <>
              <Peringatan>{T.alasanPetunjuk} Sisa tagihan {rupiah(g.tagihan.sisa)}.</Peringatan>
              <AreaTeks id="tutup-alasan" label={T.alasan} value={alasan} maxLength={300} onChange={(e) => setAlasan(e.target.value)} />
            </>
          )}
          {!daftarSyarat(g).every((s) => s.ok || !s.wajib) && <span style={{ color: token.warna.teksRedup }}>{T.kembaliKasir}</span>}
        </Kolom>
      )}
    </Modal1>
  );
}
