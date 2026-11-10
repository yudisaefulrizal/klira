import { useCallback, useEffect, useState } from 'react';
import { KEAMANAN } from '@klira/shared';
import { GalatApi } from '../../api-klien/klien';
import { ambilPengaturanKeamanan, simpanPengaturanKeamanan } from '../../api-klien/keamanan';
import { HanyaDenganIzin, useIzin } from '../../komponen/izin-saja';
import { Isian } from '../../komponen/ui/isian';
import { Kartu } from '../../komponen/ui/kartu';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Tombol } from '../../komponen/ui/tombol';
import { token } from '../../gaya/token';
import { BATAS_FORM, formDariPengaturan, bentukKeamanan, galatKeamanan, keamananBerubah } from './keadaan-keamanan';
import type { FormKeamanan } from './keadaan-keamanan';
import { Kolom, Sebaris } from '../../komponen/ui/susunan';

/** Tab Keamanan (3.1, 3.3, 4.9): kebijakan akses diisi langsung di halaman (bukan modal),  */
export function TabKeamanan() {
  const boleh = useIzin();
  const bolehUbah = boleh('akses', 'perbaikan');
  const [awal, setAwal] = useState<FormKeamanan | null>(null);
  const [form, setForm] = useState<FormKeamanan | null>(null);
  const [bawaan, setBawaan] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [memproses, setMemproses] = useState(false);
  const [dicoba, setDicoba] = useState(false);
  const terapkanDto = useCallback((p: Parameters<typeof formDariPengaturan>[0] & { bawaan: boolean }) => {
    const f = formDariPengaturan(p);
    setAwal(f);
    setForm(f);
    setBawaan(p.bawaan);
  }, []);

  useEffect(() => {
    let batal = false;
    ambilPengaturanKeamanan()
      .then((p) => !batal && terapkanDto(p))
      .catch((e) => !batal && setGalat(e instanceof GalatApi ? e.message : KEAMANAN.gagalMuat));
    return () => {
      batal = true;
    };
  }, [terapkanDto]);

  const galatBidang = form ? galatKeamanan(form) : {};
  const berubah = !!awal && !!form && keamananBerubah(awal, form);
  const tampil = (k: keyof FormKeamanan) => (dicoba ? galatBidang[k] : undefined);

  async function simpan() {
    setDicoba(true);
    if (!form || Object.keys(galatBidang).length) return;
    setMemproses(true);
    setGalat(null);
    setInfo(null);
    try {
      terapkanDto(await simpanPengaturanKeamanan(bentukKeamanan(form)));
      setDicoba(false);
      setInfo(KEAMANAN.tersimpan);
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : KEAMANAN.gagalSimpan);
    } finally {
      setMemproses(false);
    }
  }

  const ubah = (k: keyof FormKeamanan, nilai: string) => form && setForm({ ...form, [k]: nilai });
  const bidang = (k: keyof FormKeamanan, label: string, batas: { min: number; maks: number }, petunjuk: string) =>
    form && (
      <Kolom jarak="xs" key={k}>
        <Isian
          id={`keamanan-${k}`} label={label} type="number" inputMode="numeric" min={batas.min} max={batas.maks} step={1}
          value={form[k]} readOnly={!bolehUbah} onChange={(e) => ubah(k, e.target.value)} galat={tampil(k)}
          style={{ maxWidth: token.ukuran.kolomFilter }}
        />
        <span style={{ fontSize: token.huruf.ukuran.kecil, color: token.warna.teksRedup }}>{petunjuk}</span>
      </Kolom>
    );

  return (
    <Kolom tag="section" jarak="md" id="panel-keamanan" role="tabpanel" aria-labelledby="tab-keamanan">
      <Kartu susun="md">
        <div style={{ fontSize: token.huruf.ukuran.besar, fontWeight: token.huruf.berat.tebal }}>{KEAMANAN.kebijakanJudul}</div>
        <span style={{ color: token.warna.teksRedup }}>{KEAMANAN.kebijakanPetunjuk}</span>
        {bawaan && <Peringatan nada="biru">{KEAMANAN.bawaan}</Peringatan>}
        {galat && <Peringatan>{galat}</Peringatan>}
        {info && <Peringatan nada="biru">{info}</Peringatan>}
        {form && (
          <Kolom tag="form" jarak="md"
            onSubmit={(e) => {
              e.preventDefault();
              void simpan();
            }}
          >
            <Sebaris jarak="lg" bungkus sejajar="regang">
              {bidang('masa_sesi_jam', KEAMANAN.masaSesi, BATAS_FORM.masaSesiJam, KEAMANAN.petunjukMasaSesi(BATAS_FORM.masaSesiJam.min, BATAS_FORM.masaSesiJam.maks))}
              {bidang('batas_percobaan_masuk', KEAMANAN.batasPercobaan, BATAS_FORM.batasPercobaanMasuk, KEAMANAN.petunjukBatas(BATAS_FORM.batasPercobaanMasuk.min, BATAS_FORM.batasPercobaanMasuk.maks))}
              {bidang('panjang_minimum_kata_sandi', KEAMANAN.panjangKataSandi, BATAS_FORM.panjangMinimumKataSandi, KEAMANAN.petunjukPanjang(BATAS_FORM.panjangMinimumKataSandi.min, BATAS_FORM.panjangMinimumKataSandi.maks))}
            </Sebaris>
            <HanyaDenganIzin fitur="akses" aksi="perbaikan">
              <div>
                <Tombol type="submit" disabled={memproses || !berubah}>{memproses ? KEAMANAN.menyimpan : KEAMANAN.simpan}</Tombol>
              </div>
            </HanyaDenganIzin>
          </Kolom>
        )}
      </Kartu>
    </Kolom>
  );
}
