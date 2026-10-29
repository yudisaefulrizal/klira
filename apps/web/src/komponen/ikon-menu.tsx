const asetMenu: Record<string, string> = {
  '/pasien': 'daftar-pasien',
  '/statistik': 'statistik-pelayanan',
  '/pesan': 'pesan',
  '/rawat-inap': 'rawat-inap',
  '/penunjang': 'penunjang',
  '/farmasi': 'farmasi',
  '/kasir-klaim': 'kasir-klaim',
  '/rekam-medis': 'rekam-medis',
  '/satusehat': 'satusehat',
  '/pelindungan-data': 'pelindungan-data',
  '/pengaturan': 'pengaturan',
  '/beranda': 'beranda-tugas',
};

/** Alpha PNG menjadi mask agar warna ikon mengikuti tema dan penanda menu aktif. */
export function IkonMenu({ path }: { path: string }) {
  const aset = asetMenu[path];
  if (!aset) return null;
  const mask = `url("/asset/icon/${aset}.png") center / contain no-repeat`;
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: 22,
        height: 22,
        flexShrink: 0,
        backgroundColor: 'currentColor',
        mask,
        WebkitMask: mask,
      }}
    />
  );
}
