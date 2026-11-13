import { h, Fragment } from '../../util/h.js';
import { hasilRisikoGizi, JENIS_KUNJUNGAN, KLINIS, SKALA_NYERI_MAKS, STATUS_JENIS_NYERI, STATUS_RISIKO_GIZI, STATUS_SKRINING_VISUAL } from '@klira/shared';
                                                                      
import { token } from '../../gaya/token.js';
import { InfoPengesahan } from '../../komponen/klinis/info-pengesahan.js';
import { HanyaDenganIzin } from '../../komponen/izin/izin-saja.js';
import { KelompokNormal } from '../../komponen/klinis/kelompok-normal.js';
import { AreaTeks } from '../../komponen/ui/area-teks.js';
import { Isian } from '../../komponen/ui/isian.js';
import { Lencana } from '../../komponen/ui/lencana.js';
import { PilihanPil } from '../../komponen/ui/pilihan-pil.js';
import { Baris, DaftarRingkasan, Kolom, Sebaris } from '../../komponen/ui/susunan.js';
import { Tombol } from '../../komponen/ui/tombol.js';
import { adaNyeri, kelompokBerdefault, keperawatanDiubah, keperawatanKosong, ringkasanKeperawatan, ubahJenisNyeri } from './keadaan-keperawatan.js';
                                                                                                         
                                                                
import { ringkasTandaVital } from './keadaan-pemeriksaan.js';
import { GalatBagian } from './langkah-pemeriksaan.js';
                                                          
const t = KLINIS.keperawatan;
const OPSI_YA_TIDAK = [{
  nilai: 'tidak',
  label: t.tidak
}, {
  nilai: 'ya',
  label: t.ya
}]         ;
const OPSI_SKALA = Array.from({
  length: SKALA_NYERI_MAKS + 1
}, (_x, i) => ({
  nilai: String(i),
  label: String(i)
}));
const OPSI_VISUAL = [{
  nilai: ''         ,
  label: t.tidakDiisi
}, ...STATUS_SKRINING_VISUAL.opsi];

/** Jenis kunjungan (baru/lama) dan jenis rawat: baca saja, tidak disimpan. */
export function InfoKunjunganSkrining({
  konteks
}   
                                   
 ) {
  if (!konteks) return null;
  return h(Sebaris, {
    bungkus: true,
    jarak: "lg"
  }, h("span", null, h("span", {
    style: {
      color: token.warna.teksRedup
    }
  }, t.jenisKunjungan, ": "), h("strong", null, konteks.kunjungan.pasien_baru ? t.kunjunganBaru : t.kunjunganLama)), h("span", null, h("span", {
    style: {
      color: token.warna.teksRedup
    }
  }, t.jenisRawat, ": "), h("strong", null, JENIS_KUNJUNGAN.label(konteks.kunjungan.jenis))));
}

/**
 * Isian bagian keperawatan (P6) dalam kelompok kartu bergaris. Isian yang berbeda dari default keadaan baik ditandai kuning dan dihitung;
 * tiap kelompok berdefault punya "Semua normal", dan bilah atas punya "Kembalikan semua ke normal".
 */
export function BagianKeperawatan({
  k,
  ubah,
  galat,
  server
}              ) {
  const kp = k.keperawatan;
  const set = (p                             ) => ubah({
    keperawatan: {
      ...kp,
      ...p
    }
  });
  const diubah = new Set(keperawatanDiubah(kp));
  const d = (n                  ) => diubah.has(n);
  const kelompok = (id                       ) => ({
    judul: t.kelompok[id],
    tanpaJudul: id === 'kajian' || id === 'asuhan',
    diubah: kelompokBerdefault(id) ? keperawatanDiubah(kp, id).length : 0
  });
  const teksIsian = (n                                                                               , maks        ) => h(AreaTeks, {
    id: `kp-${n}`,
    label: t[n],
    value: kp[n],
    maxLength: maks,
    diubah: d(n),
    onChange: e => set({
      [n]: e.target.value
    })
  });
  const yaTidak = (n                                        ) => h(PilihanPil, {
    id: `kp-${n}`,
    label: t[n],
    opsi: OPSI_YA_TIDAK,
    nilai: kp[n] ? 'ya' : 'tidak',
    diubah: d(n),
    onUbah: v => set({
      [n]: v === 'ya'
    })
  });
  const skalaKosong = adaNyeri(kp) && kp.nyeri_skala.trim() === '';
  const gizi = hasilRisikoGizi(kp);
  return h(Kolom, null, h(InfoPengesahan, {
    bagian: server
  }), h(GalatBagian, {
    galat: galat
  }), h(KelompokNormal, {
    ...kelompok('kajian')
  }, teksIsian('kajian_keperawatan', 1000), h(Baris, null, teksIsian('telah_diobati', 1000), teksIsian('obat_dikonsumsi', 1000)), h(Isian, {
    id: "kp-alergi",
    label: t.alergi,
    value: kp.alergi,
    maxLength: 500,
    diubah: d('alergi'),
    petunjuk: t.alergiKet,
    autoComplete: "off",
    onChange: e => set({
      alergi: e.target.value
    })
  })), h(KelompokNormal, {
    ...kelompok('nyeri')
  }, h(PilihanPil, {
    id: "kp-nyeri-jenis",
    label: t.nyeri_jenis,
    opsi: STATUS_JENIS_NYERI.opsi,
    nilai: kp.nyeri_jenis,
    diubah: d('nyeri_jenis'),
    onUbah: v => ubah({
      keperawatan: ubahJenisNyeri(kp, v)
    })
  }), adaNyeri(kp) && h(Fragment, null, h(PilihanPil, {
    id: "kp-nyeri-skala",
    label: t.nyeri_skala,
    opsi: OPSI_SKALA,
    nilai: kp.nyeri_skala,
    diubah: d('nyeri_skala'),
    galat: galat && skalaKosong ? KLINIS.galat.skalaNyeriWajib : null,
    onUbah: v => set({
      nyeri_skala: v
    })
  }), h(Baris, null, (['nyeri_lokasi', 'nyeri_durasi', 'nyeri_frekuensi', 'nyeri_hilang_bila']         ).map(n => h(Isian, {
    key: n,
    id: `kp-${n}`,
    label: t[n],
    value: kp[n],
    maxLength: 200,
    diubah: d(n),
    autoComplete: "off",
    onChange: e => set({
      [n]: e.target.value
    })
  }))))), h(KelompokNormal, {
    ...kelompok('gizi'),
    aksi: h("span", null, t.hasil, ": ", h(Lencana, {
      warna: STATUS_RISIKO_GIZI.warna(gizi)
    }, STATUS_RISIKO_GIZI.label(gizi)))
  }, yaTidak('gizi_bb_turun'), yaTidak('gizi_asupan_kurang')), h(KelompokNormal, {
    ...kelompok('asuhan')
  }, h(Isian, {
    id: "kp-diagnosa_keperawatan",
    label: t.diagnosa_keperawatan,
    value: kp.diagnosa_keperawatan,
    maxLength: 500,
    autoComplete: "off",
    onChange: e => set({
      diagnosa_keperawatan: e.target.value
    })
  }), teksIsian('rencana_asuhan', 1000), h(PilihanPil, {
    id: "kp-skrining-visual",
    label: t.skrining_visual,
    opsi: OPSI_VISUAL,
    nilai: kp.skrining_visual,
    onUbah: v => set({
      skrining_visual: v
    })
  })));
}
                                            
                                                                          
                                
                   
                     
                          
                                                                                       
                   
  

/** Ringkasan skrining perawat (tanda vital dan keperawatan, baca saja) di atas langkah Anamnesa; dokter berizin klinis boleh membuka isian keperawatan. */
export function RingkasanSkriningDokter({
  tersimpan,
  terbuka,
  onBuka,
  onTutupUbah,
  berubah,
  ...dasar
}                      ) {
  const ttv = ringkasTandaVitalTeks(tersimpan);
  return h(KelompokNormal, {
    judul: t.ringkasanJudul,
    aksi: h(HanyaDenganIzin, {
      fitur: "klinis",
      aksi: "input"
    }, terbuka ? h(Tombol, {
      type: "button",
      varian: "teks",
      disabled: berubah,
      onClick: onTutupUbah
    }, t.tutupUbah) : h(Tombol, {
      type: "button",
      varian: "sekunder",
      onClick: onBuka
    }, t.ubah))
  }, h("span", null, h("span", {
    style: {
      color: token.warna.teksRedup
    }
  }, KLINIS.langkah.tandaVital, ": "), h("strong", null, ttv || KLINIS.konteks.tidakAda)), terbuka ? h(BagianKeperawatan, {
    ...dasar
  }) : keperawatanKosong(tersimpan.keperawatan) ? h("span", {
    style: {
      color: token.warna.teksRedup
    }
  }, t.belumDikaji) : h(DaftarRingkasan, {
    bagian: [ringkasanKeperawatan(tersimpan.keperawatan)].map(b => ({
      ...b,
      baris: b.baris.filter(x => x.nilai !== '-')
    }))
  }));
}

/** Tanda vital tersimpan (teks form) sebagai ringkasan singkat. */
function ringkasTandaVitalTeks(k                    )         {
  const angka = (v        ) => v.trim() === '' ? null : Number(v);
  return ringkasTandaVital(Object.fromEntries(Object.entries(k.tanda_vital).map(([n, v]) => [n, angka(v)]))                                           );
}