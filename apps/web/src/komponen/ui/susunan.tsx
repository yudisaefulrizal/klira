import { createElement } from 'react';
import type { HTMLAttributes, ReactNode, Ref } from 'react';
import { token } from '../../gaya/token';

type Jarak = keyof typeof token.jarak;
type Tag = 'div' | 'main' | 'section' | 'form' | 'header' | 'footer' | 'nav' | 'li' | 'fieldset';
type Garis = 'atas' | 'kanan' | 'bawah';

const gayaGaris = (g: Garis | undefined, halus = false) => {
  if (!g) return {};
  const nilai = `${token.ukuran.garis} solid ${halus ? token.warna.garisHalus : token.warna.garis}`;
  return g === 'atas' ? { borderTop: nilai } : g === 'kanan' ? { borderRight: nilai } : { borderBottom: nilai };
};

type PropsTata = { noValidate?: boolean; ref?: Ref<HTMLElement>; tag?: Tag; jarak?: Jarak | 'tanpa'; padding?: Jarak; garis?: Garis; halus?: boolean; /** Mengisi sisa ruang induk flex. */ tumbuh?: boolean };

/** Susunan vertikal dasar: isian bertumpuk dengan jarak token; `garis` memberi garis pemisah pada satu sisi. */
export function Kolom({ tag = 'div', jarak = 'md', padding, garis, halus, tumbuh, style, ...sisa }: HTMLAttributes<HTMLElement> & PropsTata) {
  return createElement(tag, {
    style: { display: 'flex', flexDirection: 'column', gap: jarak === 'tanpa' ? undefined : token.jarak[jarak], padding: padding ? token.jarak[padding] : undefined, flexGrow: tumbuh ? 1 : undefined, ...gayaGaris(garis, halus), ...style },
    ...sisa,
  });
}

type PropsSebaris = HTMLAttributes<HTMLElement> &
  PropsTata & {
    bungkus?: boolean;
    sejajar?: 'tengah' | 'dasar' | 'akhir' | 'awal' | 'regang';
    sebaran?: 'awal' | 'tengah' | 'akhir';
    /** Elemen sebaris (inline-flex) alih-alih blok. */
    sebaris?: boolean;
  };

const SEJAJAR = { tengah: 'center', dasar: 'baseline', akhir: 'flex-end', awal: 'flex-start', regang: 'stretch' } as const;
const SEBARAN = { awal: undefined, tengah: 'center', akhir: 'flex-end' } as const;

/** Susunan horizontal dasar: elemen sejajar dengan jarak token; `bungkus` memperbolehkan turun baris. */
export function Sebaris({ tag = 'div', jarak = 'sm', padding, garis, halus, tumbuh, bungkus = false, sejajar = 'tengah', sebaran = 'awal', sebaris = false, style, ...sisa }: PropsSebaris) {
  return createElement(tag, {
    style: {
      display: sebaris ? 'inline-flex' : 'flex',
      alignItems: SEJAJAR[sejajar],
      justifyContent: SEBARAN[sebaran],
      flexWrap: bungkus ? 'wrap' : undefined,
      gap: jarak === 'tanpa' ? undefined : token.jarak[jarak],
      padding: padding ? token.jarak[padding] : undefined,
      flexGrow: tumbuh ? 1 : undefined,
      ...gayaGaris(garis, halus),
      ...style,
    },
    ...sisa,
  });
}

/** Kisi (grid) dengan templat kolom bebas; `kolom` berisi templat CSS (dari token atau `1fr 1fr`). */
export function Kisi({ tag = 'div', kolom, jarak = 'md', jarakBaris, style, ...sisa }: HTMLAttributes<HTMLElement> & { noValidate?: boolean; tag?: 'div' | 'dl' | 'form'; kolom: string; jarak?: Jarak; jarakBaris?: Jarak }) {
  return createElement(tag, {
    style: { display: 'grid', gridTemplateColumns: kolom, columnGap: token.jarak[jarak], rowGap: token.jarak[jarakBaris ?? jarak], ...(tag === 'dl' ? { margin: 0 } : {}), ...style },
    ...sisa,
  });
}

/** Daftar butir tanpa penanda dan tanpa lekuk, ditumpuk dengan jarak token. */
export function Daftar({ jarak = 'sm', style, ...sisa }: HTMLAttributes<HTMLUListElement> & { jarak?: Jarak }) {
  return <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: token.jarak[jarak], ...style }} {...sisa} />;
}

/** Dua kolom sejajar untuk isian pendek. */
export function Baris({ style, ...sisa }: HTMLAttributes<HTMLDivElement>) {
  return <Kisi kolom={`${token.ukuran.kolomKiri} ${token.ukuran.kolomKanan}`} style={style} {...sisa} />;
}

/** Satu pasangan label dan nilai di dalam `dl` berkisi (membungkus dt dan dd tanpa memengaruhi tata letak). */
export function PasanganRingkasan({ label, nilai }: { label: ReactNode; nilai: ReactNode }) {
  return (
    <div style={{ display: 'contents' }}>
      <dt style={{ color: token.warna.teksRedup }}>{label}</dt>
      <dd style={{ margin: 0, fontWeight: token.huruf.berat.sedang, overflowWrap: 'anywhere' }}>{nilai}</dd>
    </div>
  );
}

export type BagianRingkasan = { judul: string; baris: { label: string; nilai: string }[] };

/** Ringkasan baca-saja: bagian berjudul berisi pasangan label dan nilai (ringkasan modal dan data pasien). */
export function DaftarRingkasan({ bagian }: { bagian: readonly BagianRingkasan[] }) {
  return (
    <Kolom>
      {bagian.map((b) => (
        <section key={b.judul} style={{ display: 'flex', flexDirection: 'column', gap: token.jarak.xs }}>
          <h4 style={{ margin: 0, fontSize: token.huruf.ukuran.besar, fontWeight: token.huruf.berat.tebal }}>{b.judul}</h4>
          <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'max-content 1fr', columnGap: token.jarak.md, rowGap: token.jarak.xs }}>
            {b.baris.map((r) => (
              <PasanganRingkasan key={r.label} label={r.label} nilai={r.nilai} />
            ))}
          </dl>
        </section>
      ))}
    </Kolom>
  );
}

/** Pembungkus isi sebaris yang mengisi sisa ruang di dalam induk flex (pengganti flexGrow inline). */
export function Tumbuh({ tag = 'span', style, ...sisa }: HTMLAttributes<HTMLElement> & { tag?: 'span' | 'div' }) {
  return createElement(tag, { style: { flexGrow: 1, ...style }, ...sisa });
}
