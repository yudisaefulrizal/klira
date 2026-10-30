import './modal-bertahap.css';
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { MODAL, TOMBOL } from '@klira/shared';
import { token } from '../../gaya/token';
import { adalahPertama, adalahTerakhir, batasi, langkahBerikut, langkahSebelum, posisiLangkah, statusLangkah } from '../../util/langkah';
import { useLapisanRiwayat } from '../../util/navigasi';
import { useTutupTerlindungi } from '../konfirmasi/tutup-terlindungi';
import { Dialog, KepalaDialog } from '../ui/dialog';
import { Peringatan } from '../ui/peringatan';
import { Tombol } from '../ui/tombol';
import { Kolom, Sebaris } from '../ui/susunan';
import { Penanda } from '../ui/penanda';

export type LangkahModal = {
  id: string;
  judul: string;
  isi: ReactNode;
  /** Langkah sudah terisi sah (penanda centang di daftar langkah). */
  selesai?: boolean;
};

type Props = {
  judul: string;
  langkah: readonly LangkahModal[];
  indeks: number;
  onIndeks: (i: number) => void;
  /** Ringkasan pasien atau konteks yang tetap terlihat di semua langkah. */
  konteks?: ReactNode;
  /** Tombol pendamping pada header, terpisah dari ringkasan pasien. */
  aksiHeader?: ReactNode;
  /** Info di atas isi langkah (mis. draf dipulihkan). */
  catatan?: ReactNode;
  galat?: string | null;
  onTutup: () => void;
  /** Ada isian belum selesai: penutupan tak sengaja dilindungi Konfirmasi. */
  lindungiTutup?: boolean;
  /** Dipanggil sebelum pindah ke langkah berikutnya lewat Lanjut; false menahan. */
  onLanjut?: (dariIndeks: number) => boolean;
  /** Aksi di langkah terakhir (mis. Simpan atau Buat akun); Enter di langkah terakhir juga memicunya. */
  labelKirim: string;
  onKirim: () => void;
  kirimNonaktif?: boolean;
  /** Tahap setelah berhasil: menggantikan langkah dan tidak lagi dilindungi. */
  hasil?: { judul: string; isi: ReactNode; aksi: ReactNode };
};

/**
 * MODAL-BERTAHAP (3.2, 5.1d): posisi langkah "n dari m", daftar langkah yang bisa diklik (tidak wajib berurutan),
 * Kembali/Lanjut, ringkasan konteks tetap terlihat, ringkasan di langkah terakhir, perlindungan tutup tak sengaja,
 * dan tombol kembali peramban menutup modal. Draf otomatis dipasang pemanggil lewat useDrafOtomatis.
 */
export function ModalBertahap({
  judul, langkah, indeks, onIndeks, konteks, aksiHeader, catatan, galat, onTutup, lindungiTutup = false, onLanjut, labelKirim, onKirim, kirimNonaktif, hasil,
}: Props) {
  const jumlah = langkah.length;
  const i = batasi(indeks, jumlah);
  const { mintaTutup, konfirmasi } = useTutupTerlindungi(lindungiTutup && !hasil, onTutup);
  useLapisanRiwayat(true, mintaTutup);
  const isiRef = useRef<HTMLDivElement>(null);
  const aktif = langkah[i];

  // Kursor langsung di isian pertama tiap langkah (5.1l).
  useEffect(() => {
    isiRef.current?.querySelector<HTMLElement>('input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])')?.focus();
  }, [i, hasil]);

  const terakhir = adalahTerakhir(i, jumlah);
  const pos = posisiLangkah(i, jumlah);
  const status = statusLangkah(i, jumlah, langkah.map((l) => !!l.selesai));

  function kirimForm() {
    if (terakhir) onKirim();
    else if (!onLanjut || onLanjut(i)) onIndeks(langkahBerikut(i, jumlah));
  }

  if (hasil) {
    return (
      <Dialog judul={judul} onEsc={onTutup} lebar="modalSedang">
        <KepalaDialog judul={hasil.judul} onTutup={onTutup} />
        <Kolom jarak="md" padding="lg" style={{ overflowY: 'auto' }}>{hasil.isi}</Kolom>
        <Sebaris tag="footer" jarak="sm" padding="md" sejajar="regang" sebaran="akhir" garis="atas">{hasil.aksi}</Sebaris>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog judul={judul} onEsc={() => void mintaTutup()} lebar="modalBesar" tinggi="tinggiModal">
        <KepalaDialog className={aksiHeader ? 'modal-header-dengan-aksi' : undefined} judul={judul} onTutup={() => void mintaTutup()}>{aksiHeader ?? konteks}</KepalaDialog>
        {aksiHeader && konteks && <div className="modal-konteks-header" style={{ padding: `${token.jarak.sm} ${token.jarak.lg}`, borderBottom: `1px solid ${token.warna.garis}` }}>{konteks}</div>}
        <Sebaris className="modal-langkah-layout" jarak="tanpa" sejajar="regang" style={{ flexGrow: 1, minHeight: 0 }}>
          <Kolom
            tag="nav"
            className="modal-langkah-nav"
            aria-label={MODAL.daftarLangkah}
            jarak="xs"
            garis="kanan"
            style={{ flex: `0 0 ${token.ukuran.navLangkah}`, boxSizing: 'border-box', padding: `${token.jarak.lg} ${token.jarak.md}`, overflowY: 'auto' }}
          >
            <div style={{ fontSize: token.huruf.ukuran.kecil, fontWeight: token.huruf.berat.tebal, color: token.warna.teksMenu, padding: `0 ${token.jarak.sm} ${token.jarak.sm}`, textTransform: 'uppercase' }}>
              {MODAL.langkahLabel(pos.nomor, pos.dari)}
            </div>
            {langkah.map((l, n) => {
              const s = status[n];
              return (
                <Tombol
                  key={l.id}
                  type="button"
                  varian="langkah"
                  terpilih={s === 'aktif'}
                  aria-current={s === 'aktif' ? 'step' : undefined}
                  onClick={() => onIndeks(n)}
                >
                  <Penanda ukuran="penandaLangkah" isi={s === 'selesai' ? 'penuh' : s === 'aktif' ? 'garisUtama' : 'garis'} aria-hidden="true">
                    {s === 'selesai' ? '✓' : n + 1}
                  </Penanda>
                  {l.judul}
                </Tombol>
              );
            })}
          </Kolom>
          <Kolom
            tag="form"
            className="modal-langkah-form"
            jarak="tanpa"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              kirimForm();
            }}
            style={{ flex: '1 1 0', minWidth: 0 }}
          >
            <Kolom tag="section" className="modal-langkah-isi" jarak="md" style={{ padding: `${token.jarak.lg} ${token.jarak.xl}`, flexGrow: 1, minHeight: 0, overflowY: 'auto' }} ref={isiRef} aria-labelledby="judul-langkah">
              <h3 id="judul-langkah" style={{ margin: 0, fontSize: token.huruf.ukuran.judul, fontWeight: token.huruf.berat.tebal }}>{aktif.judul}</h3>
              {catatan}
              {galat && <Peringatan>{galat}</Peringatan>}
              {aktif.isi}
            </Kolom>
            <Sebaris tag="footer" jarak="md" padding="md" garis="atas">
              <Tombol type="button" varian="sekunder" disabled={adalahPertama(i)} onClick={() => onIndeks(langkahSebelum(i, jumlah))}>{TOMBOL.kembali}</Tombol>
              <span style={{ flexGrow: 1, textAlign: 'center', color: token.warna.teksRedup }}>{MODAL.langkah(pos.nomor, pos.dari)}</span>
              <Tombol type="submit" disabled={terakhir && kirimNonaktif}>{terakhir ? labelKirim : TOMBOL.lanjut}</Tombol>
            </Sebaris>
          </Kolom>
        </Sebaris>
      </Dialog>
      {konfirmasi}
    </>
  );
}
