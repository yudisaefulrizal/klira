import { h, Fragment, lokal } from '../../util/h.js';
import { DEFAULT_ANAMNESIS, DEFAULT_PEMERIKSAAN, KELOMPOK_PEMERIKSAAN, LABEL_NARASI, KLINIS, MAKS_NARASI, STATUS_PERAN_DIAGNOSIS, STATUS_RINGKASAN_BAGIAN, TANDA_VITAL, bidangKelompok, isianDiubah, labelBidangPemeriksaan, samaDenganDefault } from '@klira/shared';
import { KelompokNormal } from '../../komponen/kelompok-normal/kelompok-normal.js';
import { cariTerminologi, cariTindakanKlinik } from '../../api-klien/klinis.js';
import { token } from '../../gaya/token.js';
import { InfoPengesahan } from '../../komponen/info-pengesahan/info-pengesahan.js';
import { PencarianKode } from '../../komponen/pencarian-kode/pencarian-kode.js';
import { AreaTeks } from '../../komponen/ui/area-teks.js';
import { Isian } from '../../komponen/ui/isian.js';
import { KotakCentang } from '../../komponen/ui/kotak-centang.js';
import { Lencana } from '../../komponen/ui/lencana.js';
import { Peringatan } from '../../komponen/ui/peringatan.js';
import { Baris, Daftar, DaftarRingkasan, Kolom, Sebaris, Tumbuh } from '../../komponen/ui/susunan.js';
import { Tombol } from '../../komponen/ui/tombol.js';
import { hapusDiagnosis, hapusTindakan, jadikanUtama, kunciItemTindakan, ringkasanIsi, tambahDiagnosis, tambahTindakan, ubahTindakan } from './keadaan-pemeriksaan.js';
import { rupiahAtau } from '../penunjang/keadaan-order-lab.js';
import { Bingkai } from '../../komponen/ui/kartu.js';
const teksRedup = {
  margin: 0,
  color: token.warna.teksRedup
};
const cariIcd10 = q => cariTerminologi('icd10', q);
const cariIcd9 = q => cariTerminologi('icd9cm', q);
export function GalatBagian({
  galat
}) {
  return galat ? h(Peringatan, null, galat) : null;
}

/** Anamnesa sesuai formulir klinik; riwayat penyakit dahulu dan keluarga berdefault "tidak ada". */
export function LangkahAnamnesis({
  k,
  ubah,
  galat,
  server
}) {
  const a = KLINIS.anamnesis;
  const setA = (n, v) => ubah({
    anamnesis: {
      ...k.anamnesis,
      [n]: v
    }
  });
  const setR = (n, v) => ubah({
    riwayat: {
      ...k.riwayat,
      [n]: v
    }
  });
  const diubah = n => !samaDenganDefault(k.riwayat[n], DEFAULT_ANAMNESIS[n]);
  return h(Kolom, null, h(InfoPengesahan, {
    bagian: server
  }), h(GalatBagian, {
    galat: galat
  }), h(Baris, null, h(AreaTeks, {
    id: "anamnesis-keluhan",
    label: a.keluhanUtama,
    required: true,
    value: k.anamnesis.keluhan_utama,
    maxLength: 1000,
    onChange: e => setA('keluhan_utama', e.target.value)
  }), h(AreaTeks, {
    id: "anamnesis-penyerta",
    label: a.penyerta,
    value: k.anamnesis.penyerta,
    maxLength: 1000,
    onChange: e => setA('penyerta', e.target.value)
  }), h(AreaTeks, {
    id: "anamnesis-sekarang",
    label: a.riwayatSekarang,
    value: k.anamnesis.riwayat_sekarang,
    maxLength: 1000,
    onChange: e => setA('riwayat_sekarang', e.target.value)
  }), h(AreaTeks, {
    id: "anamnesis-dahulu",
    label: a.riwayatPribadi,
    value: k.riwayat.riwayat_pribadi,
    maxLength: 1000,
    diubah: diubah('riwayat_pribadi'),
    onChange: e => setR('riwayat_pribadi', e.target.value)
  }), h(AreaTeks, {
    id: "anamnesis-keluarga",
    label: a.riwayatKeluarga,
    value: k.riwayat.riwayat_keluarga,
    maxLength: 1000,
    diubah: diubah('riwayat_keluarga'),
    onChange: e => setR('riwayat_keluarga', e.target.value)
  }), h(AreaTeks, {
    id: "anamnesis-sosial",
    label: a.kajianSosial,
    value: k.riwayat.kajian_sosial,
    maxLength: 1000,
    onChange: e => setR('kajian_sosial', e.target.value)
  })));
}
export function LangkahTandaVital({
  k,
  ubah,
  galat,
  server
}) {
  return h(Kolom, null, h(InfoPengesahan, {
    bagian: server
  }), h(GalatBagian, {
    galat: galat
  }), h(Baris, null, TANDA_VITAL.map(t => h(Isian, {
    key: t.kunci,
    id: `tv-${t.kunci}`,
    label: `${KLINIS.tandaVital[t.kunci]} (${KLINIS.tandaVital.satuan[t.satuan] ?? t.satuan})`,
    inputMode: "decimal",
    autoComplete: "off",
    value: k.tanda_vital[t.kunci],
    onChange: e => ubah({
      tanda_vital: {
        ...k.tanda_vital,
        [t.kunci]: e.target.value
      }
    })
  }))));
}

/**
 * Pemeriksaan fisik terstruktur per kelompok organ (formulir klinik): isian berdefault keadaan baik, isian yang berbeda ditandai,
 * "Semua normal" per kelompok dan "Kembalikan semua ke normal". Odontogram: centang "Sudah dibuat" dan tanggal.
 */
export function LangkahPemeriksaan({
  k,
  ubah,
  galat,
  server
}) {
  const pm = k.pemeriksaan;
  const set = p => ubah({
    pemeriksaan: {
      ...pm,
      ...p
    }
  });
  const diubah = new Set(isianDiubah(pm, DEFAULT_PEMERIKSAAN));
  const p = KLINIS.pemeriksaan;
  return lokal({
    odontogramDibuat: pm.odontogram_tanggal !== ''
  }, (s, set) => {
    const odontogramDibuat = s.odontogramDibuat;
    const setOdontogramDibuat = v => set({
      odontogramDibuat: typeof v === "function" ? v(s.odontogramDibuat) : v
    });
    return h(Kolom, null, h(InfoPengesahan, {
      bagian: server
    }), h(GalatBagian, {
      galat: galat
    }), KELOMPOK_PEMERIKSAAN.filter(g => g.kunci !== 'odontogram').map(g => {
      const bidang = bidangKelompok(g.kunci);
      return h(KelompokNormal, {
        key: g.kunci,
        judul: g.label,
        diubah: bidang.filter(b => diubah.has(b)).length
      }, h(Baris, null, bidang.map(b => h(Isian, {
        key: b,
        id: `pemeriksaan-${b}`,
        label: labelBidangPemeriksaan(b),
        value: pm[b],
        maxLength: 300,
        autoComplete: "off",
        diubah: diubah.has(b),
        onChange: e => set({
          [b]: e.target.value
        })
      }))));
    }), h(KelompokNormal, {
      judul: KELOMPOK_PEMERIKSAAN.find(g => g.kunci === 'odontogram')?.label ?? ''
    }, h(Baris, null, h(KotakCentang, {
      id: "odontogram-dibuat",
      label: p.odontogramDibuat,
      checked: odontogramDibuat,
      onChange: e => {
        setOdontogramDibuat(e.target.checked);
        if (!e.target.checked) set({
          odontogram_tanggal: ''
        });
      }
    }), odontogramDibuat && h(Isian, {
      id: "odontogram-tanggal",
      type: "date",
      label: p.odontogramTanggal,
      required: true,
      value: pm.odontogram_tanggal,
      galat: pm.odontogram_tanggal ? undefined : KLINIS.galat.odontogramWajib,
      onChange: e => set({
        odontogram_tanggal: e.target.value
      })
    }))));
  });
}
export function LangkahDiagnosis({
  k,
  ubah,
  galat,
  server,
  favorit
}) {
  const d = KLINIS.diagnosis;
  const tambah = x => ubah({
    diagnosis: tambahDiagnosis(k.diagnosis, x)
  });
  return h(Kolom, null, h(InfoPengesahan, {
    bagian: server
  }), h(GalatBagian, {
    galat: galat
  }), h(PencarianKode, {
    kamus: {
      judul: 'Kamus ICD-10',
      sistem: 'icd10'
    },
    id: "diagnosis-cari",
    label: d.cari,
    petunjuk: d.petunjukCari,
    cari: cariIcd10,
    onPilih: tambah,
    manual: true,
    teksManual: {
      kode: d.kode,
      nama: d.nama
    }
  }), favorit.length > 0 && h(Sebaris, {
    bungkus: true
  }, h("span", {
    style: {
      color: token.warna.teksRedup
    }
  }, d.favoritSaya), favorit.map(f => h(Tombol, {
    key: f.id,
    type: "button",
    varian: "sekunder",
    onClick: () => tambah(f)
  }, f.kode, " ", f.nama))), h(Kolom, {
    jarak: "sm"
  }, h("strong", null, d.kunjunganIni), k.diagnosis.length === 0 ? h("p", {
    style: teksRedup
  }, d.kosong) : h(Daftar, null, k.diagnosis.map(x => h(Bingkai, {
    tag: "li",
    jarak: "md",
    key: x.kode
  }, h("strong", {
    style: {
      minWidth: token.ukuran.kolomKode
    }
  }, x.kode), h(Tumbuh, null, x.nama), h(Lencana, {
    warna: STATUS_PERAN_DIAGNOSIS.warna(x.peran)
  }, x.peran === 'utama' ? KLINIS.kesimpulan.diagnosaMedis : KLINIS.kesimpulan.diagnosaTambahan), x.peran !== 'utama' && h(Tombol, {
    type: "button",
    varian: "teks",
    onClick: () => ubah({
      diagnosis: jadikanUtama(k.diagnosis, x.kode)
    })
  }, d.jadikanUtama), h(Tombol, {
    type: "button",
    varian: "teks",
    onClick: () => ubah({
      diagnosis: hapusDiagnosis(k.diagnosis, x.kode)
    })
  }, d.hapus))))));
}

/** Daftar tindakan klinik sebagai hasil tambahan pencarian: kunci `tarif:<id>|<kode ICD-9-CM>`. Tanpa kode ICD-9-CM tidak dapat dicatat. */
const cariTindakanKlinikTambahan = async q => (await cariTindakanKlinik(q)).flatMap(x => x.kode_icd9cm ? [{
  kunci: `${x.id}|${x.kode_icd9cm}`,
  kode: x.kode_icd9cm,
  nama: x.nama,
  keterangan: `${KLINIS.tindakan.tindakanKlinik} ${x.kode} · ${rupiahAtau(x.harga_umum, KLINIS.tindakan.tanpaHarga)}${x.harga_jkn !== null ? ` · JKN ${rupiahAtau(x.harga_jkn)}` : ''}`
}] : []);
const tarifDariKunci = kunci => Number(kunci.split('|')[0]);
export function LangkahTindakan({
  k,
  ubah,
  galat,
  server,
  favorit
}) {
  const t = KLINIS.tindakan;
  const tambah = x => ubah({
    tindakan: tambahTindakan(k.tindakan, x, new Date())
  });
  const ubahItem = (kunci, p) => ubah({
    tindakan: ubahTindakan(k.tindakan, kunci, p)
  });
  return h(Kolom, null, h(InfoPengesahan, {
    bagian: server
  }), h(GalatBagian, {
    galat: galat
  }), h(PencarianKode, {
    kamus: {
      judul: t.kamus,
      sistem: 'icd9cm'
    },
    id: "tindakan-cari",
    label: t.cari,
    petunjuk: t.petunjukCari,
    cari: cariIcd9,
    onPilih: tambah,
    manual: true,
    teksManual: {
      kode: t.kode,
      nama: t.nama
    },
    tambahan: {
      judul: t.daftarKlinik,
      judulKamus: t.kamus,
      cari: cariTindakanKlinikTambahan,
      onPilih: h => tambah({
        kode: h.kode,
        nama: h.nama,
        tarif_layanan_id: tarifDariKunci(h.kunci)
      })
    }
  }), favorit.length > 0 && h(Sebaris, {
    bungkus: true
  }, h("span", {
    style: {
      color: token.warna.teksRedup
    }
  }, KLINIS.diagnosis.favoritSaya), favorit.map(f => h(Tombol, {
    key: f.id,
    type: "button",
    varian: "sekunder",
    onClick: () => tambah(f)
  }, f.kode, " ", f.nama))), h(Kolom, {
    jarak: "sm"
  }, h("strong", null, t.kunjunganIni), k.tindakan.length === 0 && h("p", {
    style: teksRedup
  }, t.kosong), k.tindakan.map(x => {
    const kunci = kunciItemTindakan(x);
    const idBaris = kunci.replace(/[^\w-]/g, '-');
    return h(Bingkai, {
      arah: "kolom",
      key: kunci
    }, h(Sebaris, {
      jarak: "md"
    }, h("strong", {
      style: {
        minWidth: token.ukuran.kolomKode
      }
    }, x.kode), h(Tumbuh, null, x.nama), x.tarif_layanan_id ? h(Lencana, {
      warna: "biru"
    }, t.tindakanKlinik) : null, h("span", {
      style: {
        color: token.warna.teksRedup
      }
    }, t.performer, ": ", t.saya), h(Tombol, {
      type: "button",
      varian: "teks",
      onClick: () => ubah({
        tindakan: hapusTindakan(k.tindakan, kunci)
      })
    }, t.hapus)), h(Baris, null, h(Isian, {
      id: `tindakan-jumlah-${idBaris}`,
      label: t.jumlah,
      inputMode: "numeric",
      value: x.jumlah ?? '1',
      onChange: e => ubahItem(kunci, {
        jumlah: e.target.value
      }),
      autoComplete: "off"
    }), h(Isian, {
      id: `tindakan-mulai-${idBaris}`,
      label: t.mulai,
      type: "datetime-local",
      value: x.mulai,
      onChange: e => ubahItem(kunci, {
        mulai: e.target.value
      })
    }), h(Isian, {
      id: `tindakan-selesai-${idBaris}`,
      label: t.selesai,
      type: "datetime-local",
      value: x.selesai,
      onChange: e => ubahItem(kunci, {
        selesai: e.target.value
      })
    })));
  })));
}
export function LangkahTindakLanjut({
  k,
  ubah,
  galat,
  server,
  ringkas = false
}) {
  const t = KLINIS.tindakLanjut;
  const tl = k.tindak_lanjut;
  const set = p => ubah({
    tindak_lanjut: {
      ...tl,
      ...p
    }
  });
  return h(Kolom, null, h(InfoPengesahan, {
    bagian: server
  }), !ringkas && h("p", {
    style: teksRedup
  }, t.keterangan), h(GalatBagian, {
    galat: galat
  }), h("fieldset", {
    style: {
      margin: 0,
      padding: 0,
      border: 0,
      minWidth: 0
    }
  }, h("legend", {
    style: {
      padding: 0,
      marginBottom: token.jarak.sm,
      fontWeight: token.huruf.berat.sedang
    }
  }, "Tindak lanjut"), h(Sebaris, {
    bungkus: true,
    jarak: "md"
  }, t.jenisOpsi.map(o => h("label", {
    key: o.nilai,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: token.jarak.xs,
      minHeight: 44,
      cursor: 'pointer'
    }
  }, h("input", {
    type: "radio",
    name: "tl-jenis",
    value: o.nilai,
    checked: tl.jenis === o.nilai,
    onChange: () => set({
      jenis: o.nilai
    }),
    style: {
      accentColor: token.warna.utama
    }
  }), o.label)))), tl.jenis === 'rujuk' && h(Isian, {
    id: "tl-tujuan",
    label: t.tujuan,
    value: tl.tujuan,
    onChange: e => set({
      tujuan: e.target.value
    }),
    autoComplete: "off"
  }), tl.jenis === 'rawat_inap' && h(Isian, {
    id: "tl-spri",
    label: t.spri,
    value: tl.spri,
    onChange: e => set({
      spri: e.target.value
    }),
    autoComplete: "off"
  }), (!ringkas || tl.catatan) && h(AreaTeks, {
    id: "tl-catatan",
    label: ringkas ? 'Catatan tindak lanjut tersimpan' : t.catatan,
    value: tl.catatan,
    onChange: e => set({
      catatan: e.target.value
    })
  }));
}
export function LangkahRingkasan({
  k,
  ubah,
  rencana,
  status,
  bagian,
  labelBagian,
  perluAlasan,
  bisaSelesai,
  tampilSelesai,
  selesai,
  onSelesai,
  children
}) {
  const r = KLINIS.ringkasan;
  return h(Kolom, null, h("p", {
    style: teksRedup
  }, r.judul), !tampilSelesai && h(Daftar, {
    jarak: "xs"
  }, bagian.map(b => h(Sebaris, {
    tag: "li",
    jarak: "md",
    key: b
  }, h(Tumbuh, null, labelBagian[b]), h(Lencana, {
    warna: STATUS_RINGKASAN_BAGIAN.warna(status[b])
  }, STATUS_RINGKASAN_BAGIAN.label(status[b]))))), tampilSelesai && h(DaftarRingkasan, {
    bagian: ringkasanIsi(k).map(b => ({
      ...b,
      baris: b.baris.filter(x => x.nilai !== '-')
    }))
  }), children, rencana.map(x => x.galat && h(Peringatan, {
    key: x.bagian
  }, `${labelBagian[x.bagian]}: ${x.galat}`)), perluAlasan && h(AreaTeks, {
    id: "ringkasan-alasan",
    label: r.alasan,
    value: k.alasan,
    onChange: e => ubah({
      alasan: e.target.value
    })
  }), perluAlasan && h("p", {
    style: {
      ...teksRedup,
      fontSize: token.huruf.ukuran.kecil
    }
  }, r.alasanKet), tampilSelesai && h(KotakCentang, {
    id: "ringkasan-selesai",
    label: r.tahapKasir,
    keterangan: bisaSelesai ? r.selesaiOtomatis : r.syaratSelesai,
    checked: selesai && bisaSelesai,
    disabled: !bisaSelesai,
    onChange: e => onSelesai(e.target.checked)
  }), h(Peringatan, {
    nada: "biru"
  }, r.penjelasanSimpan));
}

/** Isian teks bebas formulir (diagnosa banding, KIE, obat yang diberikan di poli). */
export function LangkahNarasi({
  bagian,
  k,
  ubah,
  galat,
  server,
  keterangan
}) {
  return h(Kolom, {
    jarak: "sm"
  }, h(InfoPengesahan, {
    bagian: server
  }), h(GalatBagian, {
    galat: galat
  }), h(AreaTeks, {
    id: `narasi-${bagian}`,
    label: LABEL_NARASI[bagian],
    value: k[bagian],
    maxLength: MAKS_NARASI[bagian],
    onChange: e => ubah({
      [bagian]: e.target.value
    })
  }), keterangan && h("p", {
    style: {
      ...teksRedup,
      fontSize: token.huruf.ukuran.kecil
    }
  }, keterangan));
}