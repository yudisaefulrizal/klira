import { h, Fragment, lokal } from '../../util/h.js';
import { PencarianWilayah, tampilkanNamaWilayah } from '../../komponen/pencarian/pencarian-wilayah.js';
import { DAFTAR_PASIEN, GALAT, REGISTRASI, STATUS_IDENTITAS, statusIdentitasDari } from '@klira/shared';
import { token } from '../../gaya/token.js';
import { Isian } from '../../komponen/ui/isian.js';
import { KotakCentang } from '../../komponen/ui/kotak-centang.js';
import { Lencana } from '../../komponen/ui/lencana.js';
import { Peringatan } from '../../komponen/ui/peringatan.js';
import { Pilihan } from '../../komponen/ui/pilihan.js';
import { Baris, Daftar, DaftarRingkasan, Kolom, Sebaris, Tumbuh } from '../../komponen/ui/susunan.js';
import { Tombol } from '../../komponen/ui/tombol.js';
import { hapusWali, ringkasanRegistrasi, ubahTidakCakap } from './keadaan-registrasi.js';
import { Bingkai } from '../../komponen/ui/kartu.js';
const teksRedup = {
  margin: 0,
  color: token.warna.teksRedup
};
const opsiDari = daftar => [{
  nilai: '',
  label: REGISTRASI.pilih
}, ...daftar.map(o => ({
  nilai: o,
  label: o
}))];

/** Bidang identitas utama untuk pendaftaran dan deteksi duplikat. */
function BidangKunci({
  keadaan: k,
  ubah,
  galat,
  tampilGalat,
  awalan
}) {
  const g = b => tampilGalat ? galat[b] : undefined;
  return h(Fragment, null, h(Isian, {
    id: `${awalan}-nama`,
    label: REGISTRASI.nama,
    value: k.nama,
    onChange: e => ubah({
      nama: e.target.value
    }),
    galat: g('nama'),
    autoComplete: "off"
  }), h(Baris, null, h(Isian, {
    id: `${awalan}-nik`,
    label: REGISTRASI.nik,
    value: k.nik,
    inputMode: "numeric",
    maxLength: 16,
    onChange: e => ubah({
      nik: e.target.value.replace(/\D/g, '')
    }),
    galat: g('nik'),
    autoComplete: "off"
  }), h(Isian, {
    id: `${awalan}-lahir`,
    label: REGISTRASI.tanggalLahir,
    type: "date",
    value: k.tanggal_lahir,
    onChange: e => ubah({
      tanggal_lahir: e.target.value
    }),
    galat: g('tanggal_lahir')
  })), h(Isian, {
    id: `${awalan}-ibu`,
    label: REGISTRASI.ibu,
    value: k.ibu_kandung,
    onChange: e => ubah({
      ibu_kandung: e.target.value
    }),
    galat: g('ibu_kandung'),
    autoComplete: "off"
  }));
}
function HasilDuplikat({
  kandidat,
  mencari,
  galatCari,
  onCari,
  onPakai,
  ...dasar
}) {
  const {
    keadaan: k,
    ubah
  } = dasar;
  const nikSama = !!kandidat?.some(c => c.alasan === 'nik');
  return h(Kolom, null, mencari && h("p", {
    style: teksRedup,
    role: "status"
  }, REGISTRASI.duplikatMencari), galatCari && h("div", null, h(Tombol, {
    type: "button",
    varian: "sekunder",
    onClick: onCari
  }, "Coba periksa lagi")), galatCari && h(Peringatan, null, galatCari), kandidat && kandidat.length === 0 && h(Peringatan, {
    nada: "biru"
  }, REGISTRASI.duplikatTidakAda), kandidat && kandidat.length > 0 && h(Kolom, {
    jarak: "sm"
  }, h(Peringatan, {
    nada: "kuning"
  }, nikSama ? REGISTRASI.duplikatNikBlokir : REGISTRASI.duplikatDitemukan), h(Daftar, null, kandidat.map(c => h(Bingkai, {
    tag: "li",
    jarak: "md",
    key: c.id
  }, h(Tumbuh, null, h("strong", null, c.nama), h("span", {
    style: {
      color: token.warna.teksRedup
    }
  }, " \xB7 ", c.nomor_rm, " \xB7 ", c.tanggal_lahir)), h(Lencana, {
    warna: c.alasan === 'nik' ? 'merah' : 'kuning'
  }, REGISTRASI.duplikatAlasan[c.alasan]), h(Tombol, {
    type: "button",
    varian: "sekunder",
    onClick: () => onPakai(c)
  }, REGISTRASI.duplikatPakai)))), !nikSama && h(KotakCentang, {
    id: "reg-lanjut-duplikat",
    label: REGISTRASI.duplikatLanjut,
    checked: k.konfirmasi_duplikat,
    onChange: e => ubah({
      konfirmasi_duplikat: e.target.checked
    })
  })));
}
export function LangkahIdentitas({
  kandidat,
  mencari,
  galatCari,
  onCari,
  onPakai,
  ...dasar
}) {
  const {
    keadaan: k,
    ubah,
    galat,
    tampilGalat
  } = dasar;
  const g = b => tampilGalat ? galat[b] : undefined;
  return h(Kolom, null, h(BidangKunci, {
    ...dasar,
    awalan: "id"
  }), h(HasilDuplikat, {
    ...dasar,
    kandidat: kandidat,
    mencari: mencari,
    galatCari: galatCari,
    onCari: onCari,
    onPakai: onPakai
  }), h(Isian, {
    id: "reg-nomor-hp",
    label: "Nomor HP pasien",
    type: "tel",
    value: k.nomor_hp,
    maxLength: 40,
    onChange: e => ubah({
      nomor_hp: e.target.value
    }),
    galat: g('nomor_hp'),
    autoComplete: "off"
  }), h(Baris, null, h(Isian, {
    id: "reg-tempat",
    label: REGISTRASI.tempatLahir,
    value: k.tempat_lahir,
    onChange: e => ubah({
      tempat_lahir: e.target.value
    }),
    galat: g('tempat_lahir'),
    autoComplete: "off"
  }), h(Pilihan, {
    id: "reg-jk",
    label: REGISTRASI.jenisKelamin,
    value: k.jenis_kelamin,
    onChange: e => ubah({
      jenis_kelamin: e.target.value
    }),
    opsi: REGISTRASI.jenisKelaminOpsi,
    galat: g('jenis_kelamin')
  })), h(PencarianWilayah, {
    id: "reg-wilayah",
    value: k.kode_wilayah,
    onChange: kode => ubah({
      kode_wilayah: kode
    }),
    galat: g('kode_wilayah')
  }), h(KotakCentang, {
    id: "reg-tidak-cakap",
    label: REGISTRASI.tidakCakap,
    keterangan: REGISTRASI.tidakCakapKet,
    checked: k.tidak_cakap,
    onChange: e => ubah(ubahTidakCakap(k, e.target.checked))
  }));
}
export function LangkahSosial({
  keadaan: k,
  ubah,
  galat,
  tampilGalat
}) {
  const g = b => tampilGalat ? galat[b] : undefined;
  return h(Kolom, null, h(Baris, null, h(Pilihan, {
    id: "reg-agama",
    label: REGISTRASI.agama,
    value: k.agama,
    onChange: e => ubah({
      agama: e.target.value
    }),
    opsi: opsiDari(REGISTRASI.agamaOpsi),
    galat: g('agama')
  }), h(Isian, {
    id: "reg-suku",
    label: REGISTRASI.suku,
    value: k.suku,
    onChange: e => ubah({
      suku: e.target.value
    }),
    galat: g('suku'),
    autoComplete: "off"
  })), h(Baris, null, h(Isian, {
    id: "reg-bahasa",
    label: REGISTRASI.bahasa,
    value: k.bahasa,
    onChange: e => ubah({
      bahasa: e.target.value
    }),
    galat: g('bahasa'),
    autoComplete: "off"
  }), h(Isian, {
    id: "reg-pekerjaan",
    label: REGISTRASI.pekerjaan,
    value: k.pekerjaan,
    onChange: e => ubah({
      pekerjaan: e.target.value
    }),
    galat: g('pekerjaan'),
    autoComplete: "off"
  })), h(Baris, null, h(Pilihan, {
    id: "reg-pendidikan",
    label: REGISTRASI.pendidikan,
    value: k.pendidikan,
    onChange: e => ubah({
      pendidikan: e.target.value
    }),
    opsi: opsiDari(REGISTRASI.pendidikanOpsi),
    galat: g('pendidikan')
  }), h(Pilihan, {
    id: "reg-kawin",
    label: REGISTRASI.statusKawin,
    value: k.status_kawin,
    onChange: e => ubah({
      status_kawin: e.target.value
    }),
    opsi: opsiDari(REGISTRASI.statusKawinOpsi),
    galat: g('status_kawin')
  })));
}
export function LangkahWali({
  keadaan: k,
  ubah,
  galat,
  tampilGalat
}) {
  return lokal({
    hubungan: '',
    nama: '',
    kontak: '',
    coba: false
  }, (s, set) => {
    const hubungan = s.hubungan;
    const setHubungan = v => set({
      hubungan: typeof v === "function" ? v(s.hubungan) : v
    });
    const nama = s.nama;
    const setNama = v => set({
      nama: typeof v === "function" ? v(s.nama) : v
    });
    const kontak = s.kontak;
    const setKontak = v => set({
      kontak: typeof v === "function" ? v(s.kontak) : v
    });
    const coba = s.coba;
    const setCoba = v => set({
      coba: typeof v === "function" ? v(s.coba) : v
    });
    const siap = hubungan.trim() !== '' && nama.trim() !== '';
    function tambah() {
      setCoba(true);
      if (!siap) return;
      ubah({
        wali: [...k.wali, {
          hubungan: hubungan.trim(),
          nama: nama.trim(),
          kontak: kontak.trim()
        }]
      });
      setHubungan('');
      setNama('');
      setKontak('');
      setCoba(false);
    }
    const enterTambah = e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        tambah();
      }
    };
    return h(Kolom, null, h("p", {
      style: teksRedup
    }, REGISTRASI.waliPetunjuk), tampilGalat && galat.wali && h(Peringatan, {
      nada: "kuning"
    }, galat.wali), h(Bingkai, {
      arah: "kolom",
      padding: "md",
      onKeyDown: enterTambah
    }, h(Baris, null, h(Isian, {
      id: "wali-hubungan",
      label: REGISTRASI.waliHubungan,
      value: hubungan,
      onChange: e => setHubungan(e.target.value),
      galat: coba && !hubungan.trim() ? GALAT.wajibDiisi : undefined,
      autoComplete: "off"
    }), h(Isian, {
      id: "wali-nama",
      label: REGISTRASI.waliNama,
      value: nama,
      onChange: e => setNama(e.target.value),
      galat: coba && !nama.trim() ? GALAT.wajibDiisi : undefined,
      autoComplete: "off"
    })), h(Isian, {
      id: "wali-kontak",
      label: REGISTRASI.waliKontak,
      value: kontak,
      onChange: e => setKontak(e.target.value),
      autoComplete: "off"
    }), h("div", null, h(Tombol, {
      type: "button",
      varian: "sekunder",
      onClick: tambah
    }, REGISTRASI.waliTambah))), k.wali.length === 0 && h("p", {
      style: teksRedup
    }, REGISTRASI.waliKosong), h(Daftar, null, k.wali.map((w, n) => h(Bingkai, {
      tag: "li",
      halus: true,
      key: `${w.nama}-${n}`
    }, h(Lencana, {
      warna: "biru"
    }, w.hubungan), h(Tumbuh, null, h("strong", null, w.nama), w.kontak && h("span", {
      style: {
        color: token.warna.teksRedup
      }
    }, " \xB7 ", w.kontak)), h(Tombol, {
      type: "button",
      varian: "teks",
      onClick: () => ubah(hapusWali(k, n))
    }, REGISTRASI.waliHapus)))));
  });
}
export function LangkahPenjamin({
  keadaan: k,
  ubah,
  galat,
  tampilGalat
}) {
  const g = b => tampilGalat ? galat[b] : undefined;
  return h(Kolom, null, h("p", {
    style: teksRedup
  }, REGISTRASI.penjaminPetunjuk), h(Isian, {
    id: "reg-jkn-kartu",
    label: REGISTRASI.jknKartu,
    value: k.jkn_nomor_kartu,
    inputMode: "numeric",
    onChange: e => ubah({
      jkn_nomor_kartu: e.target.value
    }),
    galat: g('jkn_nomor_kartu'),
    autoComplete: "off"
  }), h(Baris, null, h(Isian, {
    id: "reg-asuransi-nama",
    label: REGISTRASI.asuransiNama,
    value: k.asuransi_nama,
    maxLength: 100,
    onChange: e => ubah({
      asuransi_nama: e.target.value
    }),
    galat: g('asuransi_nama'),
    autoComplete: "off"
  }), h(Isian, {
    id: "reg-asuransi-polis",
    label: REGISTRASI.asuransiPolis,
    value: k.asuransi_nomor_polis,
    maxLength: 50,
    onChange: e => ubah({
      asuransi_nomor_polis: e.target.value
    }),
    galat: g('asuransi_nomor_polis'),
    autoComplete: "off"
  })));
}
export function LangkahConsent({
  teks,
  memuat,
  galatMuat,
  ...dasar
}) {
  const {
    keadaan: k,
    ubah,
    galat,
    tampilGalat
  } = dasar;
  const g = b => tampilGalat ? galat[b] : undefined;
  if (memuat) return h("p", {
    style: teksRedup
  }, REGISTRASI.consentMemuat);
  if (!teks) return h(Peringatan, null, galatMuat ?? REGISTRASI.consentTidakAda);
  return h(Kolom, null, h("div", null, h("strong", null, teks.judul), h("span", {
    style: {
      color: token.warna.teksRedup
    }
  }, " \xB7 ", REGISTRASI.consentVersi(teks.versi))), h(Bingkai, {
    arah: "kolom",
    padding: "md",
    style: {
      display: 'block',
      whiteSpace: 'pre-line',
      background: token.warna.kepalaTabel,
      maxHeight: token.ukuran.tinggiDaftar,
      overflowY: 'auto'
    }
  }, teks.isi), h(Baris, null, h(Pilihan, {
    id: "reg-bentuk",
    label: REGISTRASI.consentBentuk,
    value: k.bentuk,
    onChange: e => ubah({
      bentuk: e.target.value
    }),
    opsi: REGISTRASI.consentBentukOpsi
  }), h(Pilihan, {
    id: "reg-tanda",
    label: REGISTRASI.consentPenandatangan,
    value: k.penandatangan,
    disabled: k.tidak_cakap,
    onChange: e => ubah({
      penandatangan: e.target.value,
      ...(e.target.value === 'pasien' ? {
        wali_ke: ''
      } : {})
    }),
    opsi: REGISTRASI.consentPenandatanganOpsi,
    galat: g('persetujuan.penandatangan')
  })), k.penandatangan === 'wali' && h(Pilihan, {
    id: "reg-wali-ke",
    label: REGISTRASI.consentWali,
    value: k.wali_ke,
    onChange: e => ubah({
      wali_ke: e.target.value
    }),
    galat: g('persetujuan.wali_ke'),
    opsi: [{
      nilai: '',
      label: REGISTRASI.pilih
    }, ...k.wali.map((w, n) => ({
      nilai: String(n),
      label: `${w.nama} (${w.hubungan})`
    }))]
  }), h(KotakCentang, {
    id: "reg-setuju",
    label: REGISTRASI.consentSetuju,
    checked: k.setuju,
    onChange: e => ubah({
      setuju: e.target.checked
    })
  }), g('persetujuan.setuju') && h(Peringatan, {
    nada: "kuning"
  }, g('persetujuan.setuju')));
}
export function LangkahRingkasan({
  keadaan,
  teks
}) {
  const el = lokal({ wilayah: '-' }, (s) => {
    const bagian = ringkasanRegistrasi(keadaan, teks).map(b => ({
      ...b,
      baris: b.baris.map(r => r.label === DAFTAR_PASIEN.detail.alamat ? { ...r, nilai: s.wilayah } : r)
    }));
    return h(DaftarRingkasan, { bagian });
  });
  tampilkanNamaWilayah(keadaan.kode_wilayah, (n) => el.set({ wilayah: n }));
  return el;
}

/** Ringkasan pasien yang tetap terlihat di semua langkah (kepala modal). */
export function KonteksPasien({
  keadaan: k
}) {
  const status = statusIdentitasDari(k.jalur_identitas);
  return h(Sebaris, {
    jarak: "md"
  }, h("div", null, h("div", {
    style: {
      fontWeight: token.huruf.berat.tebal
    }
  }, k.nama.trim() || REGISTRASI.kosongStrip), h("div", {
    style: {
      fontSize: token.huruf.ukuran.kecil,
      color: token.warna.teksRedup
    }
  }, k.tanggal_lahir || REGISTRASI.kosongStrip)), h(Lencana, {
    warna: STATUS_IDENTITAS.warna(status)
  }, STATUS_IDENTITAS.label(status)));
}