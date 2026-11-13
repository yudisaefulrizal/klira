import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { ReferensiKfaDto } from '@klira/shared';

/** Baris tambahan/ubahan klinik (tabel `kfa_lokal`); menimpa produk katalog dengan kode yang sama. */
export type KfaLokal = { kode: string; nama: string; bentuk_sediaan: string | null; satuan: string | null; status: string };

type Entri = { dto: ReferensiKfaDto; nama: string; kode: string };

const normal = (s: string) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('id').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const keEntri = (dto: ReferensiKfaDto): Entri => ({ dto, nama: normal(dto.nama), kode: dto.kode.toLowerCase() });

let katalog: Entri[] | undefined;
let perKode: Map<string, Entri> | undefined;
/** Katalog KFA resmi (tingkat 93) dari apps/api/data/kfa.json; dimuat sekali. Bukan tabel database. */
function muat(): Entri[] {
  if (!katalog) {
    const isi = JSON.parse(readFileSync(path.resolve(__dirname, '../../../../data/kfa.json'), 'utf8')) as { produk: Omit<ReferensiKfaDto, 'lokal'>[] };
    katalog = isi.produk.map((p) => keEntri({ ...p, lokal: false }));
    perKode = new Map(katalog.map((e) => [e.dto.kode, e]));
  }
  return katalog;
}

const dariLokal = (l: KfaLokal): Entri => keEntri({ kode: l.kode, nama: l.nama, bentuk_sediaan: l.bentuk_sediaan, satuan: l.satuan, status: l.status, lokal: true });

/** Cari per kata (semua kata harus ada di nama atau kode), urut: nama persis, diawali kueri, lalu abjad. Dibatasi `batas`. */
export function cariKatalogKfa(cari: string, batas: number, lokal: readonly KfaLokal[] = []): ReferensiKfaDto[] {
  const kueri = normal(cari);
  if (kueri.length < 2) return [];
  const kata = kueri.split(' ');
  const ditimpa = new Set(lokal.map((l) => l.kode));
  const kandidat = [...muat().filter((e) => !ditimpa.has(e.dto.kode)), ...lokal.map(dariLokal)];
  const cocok = kandidat.filter((e) => kata.every((k) => e.nama.includes(k) || e.kode.includes(k)));
  const peringkat = (nama: string) => (nama === kueri ? 0 : nama.startsWith(kueri) ? 1 : 2);
  cocok.sort((a, b) => peringkat(a.nama) - peringkat(b.nama) || a.dto.nama.localeCompare(b.dto.nama, 'id'));
  return cocok.slice(0, batas).map((e) => e.dto);
}

/** Satu produk menurut kode (tambahan klinik didahulukan), atau null bila tidak ada. */
export function ambilKatalogKfa(kode: string, lokal: readonly KfaLokal[] = []): ReferensiKfaDto | null {
  muat();
  const l = lokal.find((x) => x.kode === kode);
  return l ? dariLokal(l).dto : perKode?.get(kode)?.dto ?? null;
}
