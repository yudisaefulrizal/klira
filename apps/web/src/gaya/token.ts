export const warna = {
  utama: '#0B6B64',
  teks: '#17302E',
  latar: '#F4F6F5',
  permukaan: '#FFFFFF',
  garis: '#D9E0DE',
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
  ukuran: { kecil: '12px', dasar: '14px', besar: '16px', judul: '20px', tajuk: '40px' },
  berat: { biasa: 400, sedang: 500, tebal: 600 },
} as const;

export const jarak = { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px' } as const;

export const radius = { kecil: '4px', sedang: '8px', besar: '12px' } as const;

export const bayangan = {
  kartu: '0 1px 2px rgba(23, 48, 46, 0.08)',
  modal: '0 8px 24px rgba(23, 48, 46, 0.16)',
} as const;

export const ukuran = { kartu: '400px', isian: '40px', tombol: '40px', kolomKiri: '1fr', kolomKanan: '1fr' } as const;

export const token = { warna, huruf, jarak, radius, bayangan, ukuran } as const;
