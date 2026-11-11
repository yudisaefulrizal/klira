import type { ReactNode } from 'react';
import { LABEL_NARASI, KLINIS, PEMERIKSAAN_BIDANG, STATUS_PERAN_DIAGNOSIS, STATUS_RINGKASAN_BAGIAN, TANDA_VITAL } from '@klira/shared';
import type { BagianNarasi, BagianKlinis, BagianKlinisDto, FavoritDto } from '@klira/shared';
import { cariTerminologi, cariTindakanKlinik } from '../../api-klien/klinis';
import { token } from '../../gaya/token';
import { InfoPengesahan } from '../../komponen/info-pengesahan/info-pengesahan';
import { PencarianKode } from '../../komponen/pencarian-kode/pencarian-kode';
import type { HasilTambahan } from '../../komponen/pencarian-kode/pencarian-kode';
import { AreaTeks } from '../../komponen/ui/area-teks';
import { Isian } from '../../komponen/ui/isian';
import { KotakCentang } from '../../komponen/ui/kotak-centang';
import { Lencana } from '../../komponen/ui/lencana';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Baris, Daftar, DaftarRingkasan, Kolom, Sebaris, Tumbuh } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { hapusDiagnosis, hapusTindakan, jadikanUtama, kunciItemTindakan, ringkasanIsi, tambahDiagnosis, tambahTindakan, ubahTindakan } from './keadaan-pemeriksaan';
import { rupiahAtau } from './keadaan-order-lab';
import type { KeadaanPemeriksaan, KonfigLangkah, RencanaSimpan } from './keadaan-pemeriksaan';
import { Bingkai } from '../../komponen/ui/kartu';

type Ubah = (perubahan: Partial<KeadaanPemeriksaan>) => void;
export type DasarLangkah = {
  k: KeadaanPemeriksaan;
  ubah: Ubah;
  /** Galat bagian ini (tampil setelah pengguna mencoba lanjut atau menyimpan). */
  galat?: string | null;
  /** Keadaan pengesahan bagian ini dari server. */
  server?: Pick<BagianKlinisDto, 'pengesahan' | 'verifikasi'> | null;
};

const teksRedup = { margin: 0, color: token.warna.teksRedup } as const;
const cariIcd10 = (q: string) => cariTerminologi('icd10', q);
const cariIcd9 = (q: string) => cariTerminologi('icd9cm', q);

function GalatBagian({ galat }: { galat?: string | null }) {
  return galat ? <Peringatan>{galat}</Peringatan> : null;
}

export function LangkahAnamnesis({ k, ubah, galat, server }: DasarLangkah) {
  const a = KLINIS.anamnesis;
  return (
    <Kolom>
      <InfoPengesahan bagian={server} />
      <GalatBagian galat={galat} />
      <AreaTeks id="anamnesis-keluhan" label={a.keluhanUtama} value={k.anamnesis.keluhan_utama} onChange={(e) => ubah({ anamnesis: { ...k.anamnesis, keluhan_utama: e.target.value } })} />
      <AreaTeks id="anamnesis-penyerta" label={a.penyerta} value={k.anamnesis.penyerta} onChange={(e) => ubah({ anamnesis: { ...k.anamnesis, penyerta: e.target.value } })} />
      <Baris>
        <AreaTeks id="anamnesis-pribadi" label={a.riwayatPribadi} value={k.riwayat.riwayat_pribadi} onChange={(e) => ubah({ riwayat: { ...k.riwayat, riwayat_pribadi: e.target.value } })} />
        <AreaTeks id="anamnesis-keluarga" label={a.riwayatKeluarga} value={k.riwayat.riwayat_keluarga} onChange={(e) => ubah({ riwayat: { ...k.riwayat, riwayat_keluarga: e.target.value } })} />
      </Baris>
      <Isian id="anamnesis-alergi" label={a.alergi} value={k.riwayat.alergi} onChange={(e) => ubah({ riwayat: { ...k.riwayat, alergi: e.target.value } })} autoComplete="off" />
      <p style={{ ...teksRedup, fontSize: token.huruf.ukuran.kecil }}>{a.alergiKet}</p>
    </Kolom>
  );
}

export function LangkahTandaVital({ k, ubah, galat, server }: DasarLangkah) {
  return (
    <Kolom>
      <InfoPengesahan bagian={server} />
      <p style={teksRedup}>{KLINIS.tandaVital.petunjuk}</p>
      <GalatBagian galat={galat} />
      <Baris>
        {TANDA_VITAL.map((t) => (
          <Isian
            key={t.kunci} id={`tv-${t.kunci}`} label={`${KLINIS.tandaVital[t.kunci]} (${KLINIS.tandaVital.satuan[t.satuan] ?? t.satuan})`} inputMode="decimal" autoComplete="off"
            value={k.tanda_vital[t.kunci]} onChange={(e) => ubah({ tanda_vital: { ...k.tanda_vital, [t.kunci]: e.target.value } })}
          />
        ))}
      </Baris>
    </Kolom>
  );
}

export function LangkahPemeriksaan({ k, ubah, galat, server }: DasarLangkah) {
  return (
    <Kolom>
      <InfoPengesahan bagian={server} />
      <GalatBagian galat={galat} />
      {PEMERIKSAAN_BIDANG.map((b) => (
        <AreaTeks key={b} id={`pemeriksaan-${b}`} label={KLINIS.pemeriksaan[b]} value={k.pemeriksaan[b]} onChange={(e) => ubah({ pemeriksaan: { ...k.pemeriksaan, [b]: e.target.value } })} />
      ))}
    </Kolom>
  );
}

export function LangkahDiagnosis({ k, ubah, galat, server, favorit }: DasarLangkah & { favorit: readonly FavoritDto[] }) {
  const d = KLINIS.diagnosis;
  const tambah = (x: { kode: string; nama: string }) => ubah({ diagnosis: tambahDiagnosis(k.diagnosis, x) });
  return (
    <Kolom>
      <InfoPengesahan bagian={server} />
      <GalatBagian galat={galat} />
      <PencarianKode kamus={{ judul: 'Kamus ICD-10', sistem: 'icd10' }} id="diagnosis-cari" label={d.cari} petunjuk={d.petunjukCari} cari={cariIcd10} onPilih={tambah} manual teksManual={{ kode: d.kode, nama: d.nama }} />
      {favorit.length > 0 && (
        <Sebaris bungkus>
          <span style={{ color: token.warna.teksRedup }}>{d.favoritSaya}</span>
          {favorit.map((f) => (
            <Tombol key={f.id} type="button" varian="sekunder" onClick={() => tambah(f)}>{f.kode} {f.nama}</Tombol>
          ))}
        </Sebaris>
      )}
      <Kolom jarak="sm">
        <strong>{d.kunjunganIni}</strong>
        {k.diagnosis.length === 0 ? (
          <p style={teksRedup}>{d.kosong}</p>
        ) : (
          <Daftar>
            {k.diagnosis.map((x) => (
              <Bingkai tag="li" jarak="md" key={x.kode}>
                <strong style={{ minWidth: token.ukuran.kolomKode }}>{x.kode}</strong>
                <Tumbuh>{x.nama}</Tumbuh>
                <Lencana warna={STATUS_PERAN_DIAGNOSIS.warna(x.peran)}>{STATUS_PERAN_DIAGNOSIS.label(x.peran)}</Lencana>
                {x.peran !== 'utama' && <Tombol type="button" varian="teks" onClick={() => ubah({ diagnosis: jadikanUtama(k.diagnosis, x.kode) })}>{d.jadikanUtama}</Tombol>}
                <Tombol type="button" varian="teks" onClick={() => ubah({ diagnosis: hapusDiagnosis(k.diagnosis, x.kode) })}>{d.hapus}</Tombol>
              </Bingkai>
            ))}
          </Daftar>
        )}
      </Kolom>
    </Kolom>
  );
}

/** Daftar tindakan klinik sebagai hasil tambahan pencarian: kunci `tarif:<id>|<kode ICD-9-CM>`. Tanpa kode ICD-9-CM tidak dapat dicatat. */
const cariTindakanKlinikTambahan = async (q: string): Promise<HasilTambahan[]> =>
  (await cariTindakanKlinik(q)).flatMap((x) => (x.kode_icd9cm ? [{
    kunci: `${x.id}|${x.kode_icd9cm}`, kode: x.kode_icd9cm, nama: x.nama,
    keterangan: `${KLINIS.tindakan.tindakanKlinik} ${x.kode} · ${rupiahAtau(x.harga_umum, KLINIS.tindakan.tanpaHarga)}${x.harga_jkn !== null ? ` · JKN ${rupiahAtau(x.harga_jkn)}` : ''}`,
  }] : []));
const tarifDariKunci = (kunci: string): number => Number(kunci.split('|')[0]);

export function LangkahTindakan({ k, ubah, galat, server, favorit }: DasarLangkah & { favorit: readonly FavoritDto[] }) {
  const t = KLINIS.tindakan;
  const tambah = (x: { kode: string; nama: string; tarif_layanan_id?: number | null }) => ubah({ tindakan: tambahTindakan(k.tindakan, x, new Date()) });
  const ubahItem = (kunci: string, p: Partial<(typeof k.tindakan)[number]>) => ubah({ tindakan: ubahTindakan(k.tindakan, kunci, p) });
  return (
    <Kolom>
      <InfoPengesahan bagian={server} />
      <GalatBagian galat={galat} />
      <PencarianKode kamus={{ judul: t.kamus, sistem: 'icd9cm' }} id="tindakan-cari" label={t.cari} petunjuk={t.petunjukCari} cari={cariIcd9} onPilih={tambah} manual teksManual={{ kode: t.kode, nama: t.nama }}
        tambahan={{ judul: t.daftarKlinik, judulKamus: t.kamus, cari: cariTindakanKlinikTambahan, onPilih: (h) => tambah({ kode: h.kode, nama: h.nama, tarif_layanan_id: tarifDariKunci(h.kunci) }) }} />
      {favorit.length > 0 && (
        <Sebaris bungkus>
          <span style={{ color: token.warna.teksRedup }}>{KLINIS.diagnosis.favoritSaya}</span>
          {favorit.map((f) => (
            <Tombol key={f.id} type="button" varian="sekunder" onClick={() => tambah(f)}>{f.kode} {f.nama}</Tombol>
          ))}
        </Sebaris>
      )}
      <Kolom jarak="sm">
        <strong>{t.kunjunganIni}</strong>
        {k.tindakan.length === 0 && <p style={teksRedup}>{t.kosong}</p>}
        {k.tindakan.map((x) => {
          const kunci = kunciItemTindakan(x);
          const idBaris = kunci.replace(/[^\w-]/g, '-');
          return (
            <Bingkai arah="kolom" key={kunci}>
              <Sebaris jarak="md">
                <strong style={{ minWidth: token.ukuran.kolomKode }}>{x.kode}</strong>
                <Tumbuh>{x.nama}</Tumbuh>
                {x.tarif_layanan_id ? <Lencana warna="biru">{t.tindakanKlinik}</Lencana> : null}
                <span style={{ color: token.warna.teksRedup }}>{t.performer}: {t.saya}</span>
                <Tombol type="button" varian="teks" onClick={() => ubah({ tindakan: hapusTindakan(k.tindakan, kunci) })}>{t.hapus}</Tombol>
              </Sebaris>
              <Baris>
                <Isian id={`tindakan-jumlah-${idBaris}`} label={t.jumlah} inputMode="numeric" value={x.jumlah ?? '1'} onChange={(e) => ubahItem(kunci, { jumlah: e.target.value })} autoComplete="off" />
                <Isian id={`tindakan-mulai-${idBaris}`} label={t.mulai} type="datetime-local" value={x.mulai} onChange={(e) => ubahItem(kunci, { mulai: e.target.value })} />
                <Isian id={`tindakan-selesai-${idBaris}`} label={t.selesai} type="datetime-local" value={x.selesai} onChange={(e) => ubahItem(kunci, { selesai: e.target.value })} />
              </Baris>
            </Bingkai>
          );
        })}
      </Kolom>
    </Kolom>
  );
}

/** Langkah yang belum tersedia (Resep, Order penunjang): penjelasan singkat dan dapat dilewati. */
export function LangkahMenyusul({ langkah, onLewati }: { langkah: KonfigLangkah; onLewati: () => void }) {
  return (
    <Kolom>
      <Peringatan nada="biru">{langkah.menyusul ? KLINIS.belumTersedia[langkah.menyusul] : ''}</Peringatan>
      <div><Tombol type="button" varian="sekunder" onClick={onLewati}>{KLINIS.lewati}</Tombol></div>
    </Kolom>
  );
}

export function LangkahTindakLanjut({ k, ubah, galat, server, ringkas = false }: DasarLangkah & { ringkas?: boolean }) {
  const t = KLINIS.tindakLanjut;
  const tl = k.tindak_lanjut;
  const set = (p: Partial<typeof tl>) => ubah({ tindak_lanjut: { ...tl, ...p } });
  return (
    <Kolom>
      <InfoPengesahan bagian={server} />
      {!ringkas && <p style={teksRedup}>{t.keterangan}</p>}
      <GalatBagian galat={galat} />
      <fieldset style={{ margin: 0, padding: 0, border: 0, minWidth: 0 }}>
        <legend style={{ padding: 0, marginBottom: token.jarak.sm, fontWeight: token.huruf.berat.sedang }}>Tindak lanjut</legend>
        <Sebaris bungkus jarak="md">
          {t.jenisOpsi.map((o) => <label key={o.nilai} style={{ display: 'inline-flex', alignItems: 'center', gap: token.jarak.xs, minHeight: 44, cursor: 'pointer' }}>
            <input type="radio" name="tl-jenis" value={o.nilai} checked={tl.jenis === o.nilai}
              onChange={() => set({ jenis: o.nilai as typeof tl.jenis })} style={{ accentColor: token.warna.utama }} />
            {o.label}
          </label>)}
        </Sebaris>
      </fieldset>
      {tl.jenis === 'rujuk' && <Isian id="tl-tujuan" label={t.tujuan} value={tl.tujuan} onChange={(e) => set({ tujuan: e.target.value })} autoComplete="off" />}
      {tl.jenis === 'rawat_inap' && <Isian id="tl-spri" label={t.spri} value={tl.spri} onChange={(e) => set({ spri: e.target.value })} autoComplete="off" />}
      {(!ringkas || tl.catatan) && <AreaTeks id="tl-catatan" label={ringkas ? 'Catatan tindak lanjut tersimpan' : t.catatan} value={tl.catatan} onChange={(e) => set({ catatan: e.target.value })} />}
    </Kolom>
  );
}

type PropsRingkasan = {
  k: KeadaanPemeriksaan;
  ubah: Ubah;
  rencana: RencanaSimpan;
  status: Record<BagianKlinis, keyof typeof STATUS_RINGKASAN_BAGIAN.peta>;
  /** Bagian yang tampil di ringkasan (menurut mode modal). */
  bagian: readonly BagianKlinis[];
  labelBagian: Record<BagianKlinis, string>;
  perluAlasan: boolean;
  bisaSelesai: boolean;
  tampilSelesai: boolean;
  selesai: boolean;
  onSelesai: (v: boolean) => void;
  children?: ReactNode;
};

export function LangkahRingkasan({ k, ubah, rencana, status, bagian, labelBagian, perluAlasan, bisaSelesai, tampilSelesai, selesai, onSelesai, children }: PropsRingkasan) {
  const r = KLINIS.ringkasan;
  return (
    <Kolom>
      <p style={teksRedup}>{r.judul}</p>
      {!tampilSelesai && <Daftar jarak="xs">
        {bagian.map((b) => (
          <Sebaris tag="li" jarak="md" key={b}>
            <Tumbuh>{labelBagian[b]}</Tumbuh>
            <Lencana warna={STATUS_RINGKASAN_BAGIAN.warna(status[b])}>{STATUS_RINGKASAN_BAGIAN.label(status[b])}</Lencana>
          </Sebaris>
        ))}
      </Daftar>}
      {tampilSelesai && <DaftarRingkasan bagian={ringkasanIsi(k).map((b) => ({ ...b, baris: b.baris.filter((x) => x.nilai !== '-') }))} />}
      {children}
      {rencana.map((x) => x.galat && <Peringatan key={x.bagian}>{`${labelBagian[x.bagian]}: ${x.galat}`}</Peringatan>)}
      {perluAlasan && <AreaTeks id="ringkasan-alasan" label={r.alasan} value={k.alasan} onChange={(e) => ubah({ alasan: e.target.value })} />}
      {perluAlasan && <p style={{ ...teksRedup, fontSize: token.huruf.ukuran.kecil }}>{r.alasanKet}</p>}
      {tampilSelesai && (
        <KotakCentang id="ringkasan-selesai" label={r.tahapKasir} keterangan={bisaSelesai ? r.selesaiOtomatis : r.syaratSelesai} checked={selesai && bisaSelesai} disabled={!bisaSelesai} onChange={(e) => onSelesai(e.target.checked)} />
      )}
      <Peringatan nada="biru">{r.penjelasanSimpan}</Peringatan>
    </Kolom>
  );
}


export function LangkahNarasi({ bagian, k, ubah, galat, server }: DasarLangkah & { bagian: BagianNarasi }) {
  return <Kolom>
    <InfoPengesahan bagian={server} />
    <GalatBagian galat={galat} />
    <AreaTeks id={`narasi-${bagian}`} label={LABEL_NARASI[bagian]} value={k[bagian]} maxLength={10000} onChange={(e) => ubah({ [bagian]: e.target.value })} />
  </Kolom>;
}
