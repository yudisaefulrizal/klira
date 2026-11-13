const asetMenu = {
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
  '/log-audit': 'rekam-medis',
  '/akses': 'pelindungan-data',
  '/pengaturan-klinik': 'pengaturan',
  '/beranda': 'beranda-tugas',
};

export function buatIkonMenu(path) {
  const aset = asetMenu[path]; if (!aset) return null;
  const el = document.createElement('span'), mask = `url("/asset/icon/${aset}.png") center / contain no-repeat`;
  el.setAttribute('aria-hidden', 'true');
  Object.assign(el.style, { display: 'inline-block', width: '22px', height: '22px', flexShrink: '0', backgroundColor: 'currentColor', mask });
  el.style.setProperty('-webkit-mask', mask); return el;
}
