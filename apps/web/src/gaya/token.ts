export const warna = {
  utama: '#0B6B64',
  teks: '#17302E',
  latar: '#F4F6F5',
  permukaan: '#FFFFFF',
  garis: '#D9E0DE',
  garisHalus: '#E6ECEA',
  utamaLatar: '#E3F1EF',
  utamaGelap: '#08504B',
  teksRedup: '#4B605E',
  teksMenu: '#3F5755',
  garisIsian: '#B9C6C3',
  kepalaTabel: '#F4F8F7',
  tirai: 'rgba(44, 59, 57, 0.72)',
  status: {
    hijau: { latar: '#E1F3E3', teks: '#1D5E2B' },
    kuning: { latar: '#FCF0D6', teks: '#7A4A00' },
    merah: { latar: '#F7DADA', teks: '#8A1F1F' },
    biru: { latar: '#E3ECF8', teks: '#1E4A85' },
    ungu: { latar: '#EEE8F8', teks: '#4F2D86' },
    abu: { latar: '#E8ECEB', teks: '#44514F' },
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
  kartu: '0 1px 2px rgba(23, 48, 46, 0.08)',
  modal: '0 8px 24px rgba(23, 48, 46, 0.16)',
} as const;

export const ukuran = { kartu: '400px', isian: '40px', tombol: '40px', kolomKiri: '1fr', kolomKanan: '1fr', tinggiLayar: '100vh', garis: '1px', menuSamping: '232px', tab: '38px', tabelMin: '900px', logo: '30px', isiMin: '640px', modalKecil: '440px', modalSedang: '640px', modalBesar: '1100px', tinggiModal: '720px', maksLayar: '92vh', panelSamping: '440px', navLangkah: '232px', penandaLangkah: '22px', areaTeks: '88px' } as const;

/** Urutan tumpukan lapisan (dialog di atas halaman, konfirmasi di atas dialog). */
export const lapis = { dialog: 1000, konfirmasi: 1100 } as const;

export const token = { warna, huruf, jarak, radius, bayangan, ukuran, lapis } as const;
