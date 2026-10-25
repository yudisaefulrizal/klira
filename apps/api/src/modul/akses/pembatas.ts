type Catatan = { gagal: number; mulai: number; terkunciSampai: number };

export type OpsiPembatas = {
  batasAkun: number;
  batasAlamat: number;
  jendelaMs: number;
  jedaMs: number;
  /** Batas jumlah catatan per peta; di atasnya catatan kedaluwarsa disapu segera. */
  maksCatatan?: number;
};

export const OPSI_PEMBATAS_BAWAAN: OpsiPembatas = {
  batasAkun: 5,
  batasAlamat: 20,
  jendelaMs: 15 * 60_000,
  jedaMs: 5 * 60_000,
  maksCatatan: 10_000,
};

/** Pembatas percobaan masuk gagal per akun dan per alamat, dalam memori proses. */
export class PembatasPercobaan {
  private akun = new Map<string, Catatan>();
  private alamat = new Map<string, Catatan>();
  private terakhirBersih = 0;

  constructor(
    private opsi: OpsiPembatas = OPSI_PEMBATAS_BAWAAN,
    private sekarang: () => number = Date.now,
  ) {}

  /** Sisa jeda (ms) bila terkunci, 0 bila boleh mencoba. */
  sisaJeda(username: string, alamat: string): number {
    const t = this.sekarang();
    const a = this.akun.get(kunciAkun(username));
    const b = this.alamat.get(alamat);
    return Math.max(0, (a?.terkunciSampai ?? 0) - t, (b?.terkunciSampai ?? 0) - t);
  }

  /** Jumlah catatan yang masih disimpan (untuk uji dan pemantauan). */
  ukuran(): { akun: number; alamat: number } {
    return { akun: this.akun.size, alamat: this.alamat.size };
  }

  /** Buang catatan yang jendelanya lewat dan tidak sedang terkunci. */
  bersihkan(): void {
    const t = this.sekarang();
    this.terakhirBersih = t;
    for (const peta of [this.akun, this.alamat]) {
      for (const [k, c] of peta) if (c.terkunciSampai <= t && t - c.mulai > this.opsi.jendelaMs) peta.delete(k);
    }
  }

  /** `batasAkun` menimpa batas bawaan per akun (kebijakan keamanan fasyankes). */
  catatGagal(username: string, alamat: string, batasAkun: number = this.opsi.batasAkun): void {
    const maks = this.opsi.maksCatatan ?? OPSI_PEMBATAS_BAWAAN.maksCatatan!;
    if (this.sekarang() - this.terakhirBersih >= this.opsi.jendelaMs || this.akun.size >= maks || this.alamat.size >= maks) {
      this.bersihkan();
    }
    this.tambah(this.akun, kunciAkun(username), batasAkun);
    this.tambah(this.alamat, alamat, this.opsi.batasAlamat);
  }

  catatBerhasil(username: string): void {
    this.akun.delete(kunciAkun(username));
  }

  private tambah(peta: Map<string, Catatan>, kunci: string, batas: number): void {
    const t = this.sekarang();
    let c = peta.get(kunci);
    if (!c || (t - c.mulai > this.opsi.jendelaMs && c.terkunciSampai <= t)) {
      c = { gagal: 0, mulai: t, terkunciSampai: 0 };
    }
    c.gagal += 1;
    if (c.gagal >= batas) {
      c.terkunciSampai = t + this.opsi.jedaMs;
      c.gagal = 0;
      c.mulai = t;
    }
    peta.set(kunci, c);
  }
}

function kunciAkun(username: string): string {
  return username.trim().toLowerCase();
}
