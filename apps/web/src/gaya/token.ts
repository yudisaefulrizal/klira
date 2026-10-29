export const warna = {
  utama: 'var(--warna-utama)',
  diAtasUtama: 'var(--warna-di-atas-utama)',
  teks: 'var(--warna-teks)',
  latar: 'var(--warna-latar)',
  permukaan: 'var(--warna-permukaan)',
  garis: 'var(--warna-garis)',
  garisHalus: 'var(--warna-garis-halus)',
  utamaLatar: 'var(--warna-utama-latar)',
  utamaGelap: 'var(--warna-utama-gelap)',
  teksRedup: 'var(--warna-teks-redup)',
  teksMenu: 'var(--warna-teks-menu)',
  garisIsian: 'var(--warna-garis-isian)',
  kepalaTabel: 'var(--warna-kepala-tabel)',
  tirai: 'var(--warna-tirai)',
  status: {
    hijau: { latar: 'var(--status-hijau-latar)', teks: 'var(--status-hijau-teks)' },
    kuning: { latar: 'var(--status-kuning-latar)', teks: 'var(--status-kuning-teks)' },
    merah: { latar: 'var(--status-merah-latar)', teks: 'var(--status-merah-teks)' },
    biru: { latar: 'var(--status-biru-latar)', teks: 'var(--status-biru-teks)' },
    ungu: { latar: 'var(--status-ungu-latar)', teks: 'var(--status-ungu-teks)' },
    abu: { latar: 'var(--status-abu-latar)', teks: 'var(--status-abu-teks)' },
  },
} as const;

export const huruf = {
  keluarga: "'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', sans-serif",
  ukuran: { kecil: '12px', dasar: '14px', besar: '16px', judul: '20px', halaman: '24px', tajuk: '40px' },
  berat: { biasa: 400, sedang: 500, tebal: 600 },
  jarakHuruf: { kode: '0.05em' },
} as const;

export const jarak = { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px' } as const;

export const radius = { kecil: '4px', sedang: '8px', besar: '12px', pil: '999px' } as const;

export const bayangan = {
  kartu: 'var(--bayangan-kartu)',
  modal: 'var(--bayangan-modal)',
} as const;

export const ukuran = { daftarPesan: '320px', infoKontakPesan: '264px', tinggiMediaPesanPenuh: '180px', lebarMediaPesanPenuh: '320px', tinggiTema: '56px', ikonPesan: '20px', lebarChat: '460px', tinggiMediaPesan: '240px', tinggiBalasanPesan: '112px', tombolPesan: '56px', tinggiJendelaPesan: '760px', tinggiPesan: '75vh', qrWhatsapp: '280px', kartu: '400px', isian: '40px', tombol: '40px', kolomKiri: '1fr', kolomKanan: '1fr', tinggiLayar: '100vh', garis: '1px', menuSamping: '232px', tab: '38px', tabelMin: '900px', logo: '30px', isiMin: '640px', modalKecil: '440px', modalSedang: '640px', modalBesar: '1100px', tinggiModal: '720px', maksLayar: '92vh', panelSamping: '440px', navLangkah: '232px', penandaLangkah: '22px', areaTeks: '88px', kolomKelompok: '240px', kolomFilter: '180px', tinggiDaftar: '40vh', kolomKode: '72px', kartuBed: '260px' } as const;

/** Urutan tumpukan lapisan (dialog di atas halaman, konfirmasi di atas dialog). */
export const lapis = { pesan: 900, dialog: 1000, konfirmasi: 1100 } as const;

export const token = { warna, huruf, jarak, radius, bayangan, ukuran, lapis } as const;
