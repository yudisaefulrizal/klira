import { hasilRisikoGizi, JENIS_KUNJUNGAN, KLINIS, SKALA_NYERI_MAKS, STATUS_JENIS_NYERI, STATUS_RISIKO_GIZI, STATUS_SKRINING_VISUAL } from '@klira/shared';
import type { KonteksKlinisDto, SkriningVisual } from '@klira/shared';
import { token } from '../../gaya/token';
import { InfoPengesahan } from '../../komponen/info-pengesahan/info-pengesahan';
import { HanyaDenganIzin } from '../../komponen/izin-saja';
import { KelompokNormal } from '../../komponen/kelompok-normal/kelompok-normal';
import { AreaTeks } from '../../komponen/ui/area-teks';
import { Isian } from '../../komponen/ui/isian';
import { Lencana } from '../../komponen/ui/lencana';
import { PilihanPil } from '../../komponen/ui/pilihan-pil';
import { Baris, DaftarRingkasan, Kolom, Sebaris } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import {
  adaNyeri, kelompokBerdefault, keperawatanDiubah, keperawatanKosong, ringkasanKeperawatan, ubahJenisNyeri,
} from './keadaan-keperawatan';
import type { IdKelompokKeperawatan, KeadaanKeperawatan, KunciKeperawatan } from './keadaan-keperawatan';
import type { KeadaanPemeriksaan } from './keadaan-pemeriksaan';
import { ringkasTandaVital } from './keadaan-pemeriksaan';
import { GalatBagian } from './langkah-pemeriksaan';
import type { DasarLangkah } from './langkah-pemeriksaan';

const t = KLINIS.keperawatan;
const OPSI_YA_TIDAK = [{ nilai: 'tidak', label: t.tidak }, { nilai: 'ya', label: t.ya }] as const;
const OPSI_SKALA = Array.from({ length: SKALA_NYERI_MAKS + 1 }, (_x, i) => ({ nilai: String(i), label: String(i) }));
const OPSI_VISUAL = [{ nilai: '' as const, label: t.tidakDiisi }, ...STATUS_SKRINING_VISUAL.opsi];

/** Jenis kunjungan (baru/lama) dan jenis rawat: baca saja, tidak disimpan. */
export function InfoKunjunganSkrining({ konteks }: { konteks: KonteksKlinisDto | null }) {
  if (!konteks) return null;
  return (
    <Sebaris bungkus jarak="lg">
      <span><span style={{ color: token.warna.teksRedup }}>{t.jenisKunjungan}: </span><strong>{konteks.kunjungan.pasien_baru ? t.kunjunganBaru : t.kunjunganLama}</strong></span>
      <span><span style={{ color: token.warna.teksRedup }}>{t.jenisRawat}: </span><strong>{JENIS_KUNJUNGAN.label(konteks.kunjungan.jenis)}</strong></span>
    </Sebaris>
  );
}

/**
 * Isian bagian keperawatan (P6) dalam kelompok kartu bergaris. Isian yang berbeda dari default keadaan baik ditandai kuning dan dihitung;
 * tiap kelompok berdefault punya "Semua normal", dan bilah atas punya "Kembalikan semua ke normal".
 */
export function BagianKeperawatan({ k, ubah, galat, server }: DasarLangkah) {
  const kp = k.keperawatan;
  const set = (p: Partial<KeadaanKeperawatan>) => ubah({ keperawatan: { ...kp, ...p } });
  const diubah = new Set(keperawatanDiubah(kp));
  const d = (n: KunciKeperawatan) => diubah.has(n);
  const kelompok = (id: IdKelompokKeperawatan) => ({
    judul: t.kelompok[id],
    tanpaJudul: id === 'kajian' || id === 'asuhan',
    diubah: kelompokBerdefault(id) ? keperawatanDiubah(kp, id).length : 0,
  });
  const teksIsian = (n: 'kajian_keperawatan' | 'telah_diobati' | 'obat_dikonsumsi' | 'rencana_asuhan', maks: number) => (
    <AreaTeks id={`kp-${n}`} label={t[n]} value={kp[n]} maxLength={maks} diubah={d(n)} onChange={(e) => set({ [n]: e.target.value })} />
  );
  const yaTidak = (n: 'gizi_bb_turun' | 'gizi_asupan_kurang') => (
    <PilihanPil id={`kp-${n}`} label={t[n]} opsi={OPSI_YA_TIDAK} nilai={kp[n] ? 'ya' : 'tidak'} diubah={d(n)} onUbah={(v) => set({ [n]: v === 'ya' })} />
  );
  const skalaKosong = adaNyeri(kp) && kp.nyeri_skala.trim() === '';
  const gizi = hasilRisikoGizi(kp);
  return (
    <Kolom>
      <InfoPengesahan bagian={server} />
      <GalatBagian galat={galat} />
      <KelompokNormal {...kelompok('kajian')}>
        {teksIsian('kajian_keperawatan', 1000)}
        <Baris>
          {teksIsian('telah_diobati', 1000)}
          {teksIsian('obat_dikonsumsi', 1000)}
        </Baris>
        <Isian id="kp-alergi" label={t.alergi} value={kp.alergi} maxLength={500} diubah={d('alergi')} petunjuk={t.alergiKet} autoComplete="off" onChange={(e) => set({ alergi: e.target.value })} />
      </KelompokNormal>
      <KelompokNormal {...kelompok('nyeri')}>
        <PilihanPil id="kp-nyeri-jenis" label={t.nyeri_jenis} opsi={STATUS_JENIS_NYERI.opsi} nilai={kp.nyeri_jenis} diubah={d('nyeri_jenis')} onUbah={(v) => ubah({ keperawatan: ubahJenisNyeri(kp, v) })} />
        {adaNyeri(kp) && <>
          <PilihanPil id="kp-nyeri-skala" label={t.nyeri_skala} opsi={OPSI_SKALA} nilai={kp.nyeri_skala} diubah={d('nyeri_skala')} galat={galat && skalaKosong ? KLINIS.galat.skalaNyeriWajib : null}
            onUbah={(v) => set({ nyeri_skala: v })} />
          <Baris>
            {(['nyeri_lokasi', 'nyeri_durasi', 'nyeri_frekuensi', 'nyeri_hilang_bila'] as const).map((n) => (
              <Isian key={n} id={`kp-${n}`} label={t[n]} value={kp[n]} maxLength={200} diubah={d(n)} autoComplete="off" onChange={(e) => set({ [n]: e.target.value })} />
            ))}
          </Baris>
        </>}
      </KelompokNormal>
      <KelompokNormal {...kelompok('gizi')} aksi={<span>{t.hasil}: <Lencana warna={STATUS_RISIKO_GIZI.warna(gizi)}>{STATUS_RISIKO_GIZI.label(gizi)}</Lencana></span>}>
        {yaTidak('gizi_bb_turun')}
        {yaTidak('gizi_asupan_kurang')}
      </KelompokNormal>
      <KelompokNormal {...kelompok('asuhan')}>
        <Isian id="kp-diagnosa_keperawatan" label={t.diagnosa_keperawatan} value={kp.diagnosa_keperawatan} maxLength={500} autoComplete="off" onChange={(e) => set({ diagnosa_keperawatan: e.target.value })} />
        {teksIsian('rencana_asuhan', 1000)}
        <PilihanPil<SkriningVisual | ''> id="kp-skrining-visual" label={t.skrining_visual} opsi={OPSI_VISUAL} nilai={kp.skrining_visual} onUbah={(v) => set({ skrining_visual: v })} />
      </KelompokNormal>
    </Kolom>
  );
}

type PropsRingkasanDokter = DasarLangkah & {
  /** Isian tersimpan (baca saja), bukan isian form yang sedang diubah. */
  tersimpan: KeadaanPemeriksaan;
  terbuka: boolean;
  onBuka: () => void;
  onTutupUbah: () => void;
  /** Isian keperawatan sedang diubah (tidak bisa ditutup tanpa membuang perubahan). */
  berubah: boolean;
};

/** Ringkasan skrining perawat (tanda vital dan keperawatan, baca saja) di atas langkah Anamnesa; dokter berizin klinis boleh membuka isian keperawatan. */
export function RingkasanSkriningDokter({ tersimpan, terbuka, onBuka, onTutupUbah, berubah, ...dasar }: PropsRingkasanDokter) {
  const ttv = ringkasTandaVitalTeks(tersimpan);
  return (
    <KelompokNormal
      judul={t.ringkasanJudul}
      aksi={
        <HanyaDenganIzin fitur="klinis" aksi="input">
          {terbuka
            ? <Tombol type="button" varian="teks" disabled={berubah} onClick={onTutupUbah}>{t.tutupUbah}</Tombol>
            : <Tombol type="button" varian="sekunder" onClick={onBuka}>{t.ubah}</Tombol>}
        </HanyaDenganIzin>
      }
    >
      <span><span style={{ color: token.warna.teksRedup }}>{KLINIS.langkah.tandaVital}: </span><strong>{ttv || KLINIS.konteks.tidakAda}</strong></span>
      {terbuka
        ? <BagianKeperawatan {...dasar} />
        : keperawatanKosong(tersimpan.keperawatan)
          ? <span style={{ color: token.warna.teksRedup }}>{t.belumDikaji}</span>
          : <DaftarRingkasan bagian={[ringkasanKeperawatan(tersimpan.keperawatan)].map((b) => ({ ...b, baris: b.baris.filter((x) => x.nilai !== '-') }))} />}
    </KelompokNormal>
  );
}

/** Tanda vital tersimpan (teks form) sebagai ringkasan singkat. */
function ringkasTandaVitalTeks(k: KeadaanPemeriksaan): string {
  const angka = (v: string) => (v.trim() === '' ? null : Number(v));
  return ringkasTandaVital(Object.fromEntries(Object.entries(k.tanda_vital).map(([n, v]) => [n, angka(v)])) as Parameters<typeof ringkasTandaVital>[0]);
}
