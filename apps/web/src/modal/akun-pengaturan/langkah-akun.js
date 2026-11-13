import { h, Fragment, lokal } from '../../util/h.js';
import { AKUN_BARU, NAVIGASI } from '@klira/shared';
import { token } from '../../gaya/token.js';
import { Isian } from '../../komponen/ui/isian.js';
import { KotakCentang } from '../../komponen/ui/kotak-centang.js';
import { Lencana } from '../../komponen/ui/lencana.js';
import { Peringatan } from '../../komponen/ui/peringatan.js';
import { Pilihan } from '../../komponen/ui/pilihan.js';
import { Tombol } from '../../komponen/ui/tombol.js';
import { galatBarisIzin, galatData, galatPenugasan, galatProfil, labelIzin, opsiIzin, ringkasanAkun } from './keadaan-akun.js';
import { Baris, Daftar, Kisi, Kolom, PasanganRingkasan, Sebaris, Tumbuh } from '../../komponen/ui/susunan.js';
import { Bingkai } from '../../komponen/ui/kartu.js';
import { Kode } from '../../komponen/ui/penanda.js';
export function LangkahData({
  keadaan: k,
  ubah,
  tampilGalat
}) {
  const g = tampilGalat ? galatData(k) : {};
  return h(Kolom, null, h(Isian, {
    id: "akun-nama",
    label: AKUN_BARU.nama,
    value: k.nama,
    onChange: e => ubah({
      nama: e.target.value
    }),
    galat: g.nama,
    autoComplete: "off"
  }), h(Isian, {
    id: "akun-nik",
    label: AKUN_BARU.nik,
    value: k.nik,
    inputMode: "numeric",
    maxLength: 16,
    onChange: e => ubah({
      nik: e.target.value.replace(/\D/g, '')
    }),
    galat: g.nik,
    autoComplete: "off"
  }), h(Isian, {
    id: "akun-username",
    label: AKUN_BARU.username,
    value: k.username,
    onChange: e => ubah({
      username: e.target.value
    }),
    galat: g.username,
    autoComplete: "off"
  }), h("span", {
    style: {
      color: token.warna.teksRedup,
      fontSize: token.huruf.ukuran.kecil
    }
  }, AKUN_BARU.petunjukUsername));
}
export function LangkahProfil({
  keadaan: k,
  ubah,
  tampilGalat
}) {
  const g = tampilGalat ? galatProfil(k) : {};
  const adaProfil = k.profesi !== '';
  return h(Kolom, null, h(Pilihan, {
    id: "akun-profesi",
    label: AKUN_BARU.profesi,
    value: k.profesi,
    onChange: e => ubah({
      profesi: e.target.value
    }),
    galat: g.profesi,
    opsi: [{
      nilai: '',
      label: AKUN_BARU.tanpaProfil
    }, ...AKUN_BARU.profesiOpsi.map(p => ({
      nilai: p,
      label: p
    }))]
  }), adaProfil && h(Fragment, null, h(Baris, null, h(Isian, {
    id: "akun-sip",
    label: AKUN_BARU.nomorSip,
    value: k.nomor_sip,
    onChange: e => ubah({
      nomor_sip: e.target.value
    }),
    galat: g.nomor_sip,
    autoComplete: "off"
  }), h(Isian, {
    id: "akun-masa-sip",
    label: AKUN_BARU.masaSip,
    type: "date",
    value: k.masa_berlaku_sip,
    onChange: e => ubah({
      masa_berlaku_sip: e.target.value
    }),
    galat: g.masa_berlaku_sip
  })), h(Isian, {
    id: "akun-ihs",
    label: AKUN_BARU.ihs,
    value: k.ihs_practitioner_id,
    onChange: e => ubah({
      ihs_practitioner_id: e.target.value
    }),
    galat: g.ihs_practitioner_id,
    autoComplete: "off"
  }), h(Peringatan, {
    nada: "biru"
  }, AKUN_BARU.petunjukIhs)));
}
export function LangkahJenis({
  keadaan: k,
  ubah,
  tampilGalat,
  jenis,
  hariIni,
  memuat
}) {
  const g = tampilGalat ? galatPenugasan(k) : {};
  const aktif = jenis.filter(j => j.aktif);
  function pilih(id, on) {
    const sisa = {
      ...k.penugasan
    };
    if (on) sisa[id] = {
      mulai: hariIni,
      selesai: ''
    };else delete sisa[id];
    ubah({
      penugasan: sisa
    });
  }
  if (memuat) return h("p", {
    style: {
      margin: 0,
      color: token.warna.teksRedup
    }
  }, NAVIGASI.memuat);
  return h(Kolom, null, h("p", {
    style: {
      margin: 0,
      color: token.warna.teksRedup
    }
  }, AKUN_BARU.jenisPetunjuk), g._ && h(Peringatan, {
    nada: "kuning"
  }, g._), aktif.length === 0 && h(Peringatan, {
    nada: "kuning"
  }, AKUN_BARU.jenisKosong), aktif.map(j => {
    const p = k.penugasan[j.id];
    return h(Bingkai, {
      arah: "kolom",
      padding: "md",
      key: j.id
    }, h(KotakCentang, {
      id: `jenis-${j.id}`,
      label: j.nama,
      keterangan: j.syarat_profesi ? AKUN_BARU.syaratProfesi(j.syarat_profesi) : undefined,
      checked: !!p,
      onChange: e => pilih(j.id, e.target.checked)
    }), p && h(Baris, null, h(Isian, {
      id: `jenis-${j.id}-mulai`,
      label: AKUN_BARU.mulai,
      type: "date",
      value: p.mulai,
      onChange: e => ubah({
        penugasan: {
          ...k.penugasan,
          [j.id]: {
            ...p,
            mulai: e.target.value
          }
        }
      }),
      galat: g[String(j.id)]
    }), h(Isian, {
      id: `jenis-${j.id}-selesai`,
      label: AKUN_BARU.selesai,
      type: "date",
      value: p.selesai,
      onChange: e => ubah({
        penugasan: {
          ...k.penugasan,
          [j.id]: {
            ...p,
            selesai: e.target.value
          }
        }
      })
    })));
  }));
}
export function LangkahIzin({
  keadaan: k,
  ubah,
  jenis,
  katalog,
  hariIni,
  memuat
}) {
  return lokal({
    tipe: 'tambah',
    kata: '',
    izinId: '',
    alasan: '',
    mulai: hariIni,
    selesai: '',
    coba: false
  }, (s, set) => {
    const tipe = s.tipe;
    const setTipe = v => set({
      tipe: typeof v === "function" ? v(s.tipe) : v
    });
    const kata = s.kata;
    const setKata = v => set({
      kata: typeof v === "function" ? v(s.kata) : v
    });
    const izinId = s.izinId;
    const setIzinId = v => set({
      izinId: typeof v === "function" ? v(s.izinId) : v
    });
    const alasan = s.alasan;
    const setAlasan = v => set({
      alasan: typeof v === "function" ? v(s.alasan) : v
    });
    const mulai = s.mulai;
    const setMulai = v => set({
      mulai: typeof v === "function" ? v(s.mulai) : v
    });
    const selesai = s.selesai;
    const setSelesai = v => set({
      selesai: typeof v === "function" ? v(s.selesai) : v
    });
    const coba = s.coba;
    const setCoba = v => set({
      coba: typeof v === "function" ? v(s.coba) : v
    });
    const terpilih = jenis.filter(j => k.penugasan[j.id]);
    const opsi = opsiIzin(tipe, katalog, terpilih, k.izin, kata);
    const calon = {
      izin_id: Number(izinId) || 0,
      tipe,
      alasan,
      mulai,
      selesai
    };
    const g = coba ? galatBarisIzin(calon) : {};
    const nilaiIzin = opsi.some(o => String(o.id) === izinId) ? izinId : '';
    function tambah() {
      setCoba(true);
      if (Object.keys(galatBarisIzin(calon)).length) return;
      ubah({
        izin: [...k.izin, {
          ...calon,
          alasan: alasan.trim()
        }]
      });
      setIzinId('');
      setAlasan('');
      setSelesai('');
      setCoba(false);
    }
    const enterTambah = e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        tambah();
      }
    };
    const nama = id => katalog.find(i => i.id === id);
    if (memuat) return h("p", {
      style: {
        margin: 0,
        color: token.warna.teksRedup
      }
    }, NAVIGASI.memuat);
    return h(Kolom, null, h(Bingkai, {
      arah: "kolom",
      padding: "md",
      onKeyDown: enterTambah
    }, h(Baris, null, h(Pilihan, {
      id: "izin-tipe",
      label: AKUN_BARU.izinTipe,
      value: tipe,
      onChange: e => {
        setTipe(e.target.value);
        setIzinId('');
      },
      opsi: [{
        nilai: 'tambah',
        label: AKUN_BARU.izinTipeOpsi.tambah
      }, {
        nilai: 'kurang',
        label: AKUN_BARU.izinTipeOpsi.kurang
      }]
    }), h(Isian, {
      id: "izin-cari",
      label: AKUN_BARU.izinCari,
      type: "search",
      value: kata,
      onChange: e => setKata(e.target.value)
    })), h(Pilihan, {
      id: "izin-pilih",
      label: AKUN_BARU.izinPilih,
      value: nilaiIzin,
      onChange: e => setIzinId(e.target.value),
      galat: g.izin_id,
      opsi: [{
        nilai: '',
        label: opsi.length ? '-' : AKUN_BARU.izinTidakAda
      }, ...opsi.map(i => ({
        nilai: String(i.id),
        label: labelIzin(i)
      }))]
    }), h(Isian, {
      id: "izin-alasan",
      label: AKUN_BARU.izinAlasan,
      value: alasan,
      onChange: e => setAlasan(e.target.value),
      galat: g.alasan,
      autoComplete: "off"
    }), h(Baris, null, h(Isian, {
      id: "izin-mulai",
      label: AKUN_BARU.mulai,
      type: "date",
      value: mulai,
      onChange: e => setMulai(e.target.value),
      galat: g.mulai
    }), h(Isian, {
      id: "izin-selesai",
      label: AKUN_BARU.selesai,
      type: "date",
      value: selesai,
      onChange: e => setSelesai(e.target.value),
      galat: g.selesai
    })), h("div", null, h(Tombol, {
      type: "button",
      varian: "sekunder",
      onClick: tambah
    }, AKUN_BARU.izinTambahkan))), k.izin.length === 0 && h("p", {
      style: {
        margin: 0,
        color: token.warna.teksRedup
      }
    }, AKUN_BARU.izinKosong), h(Daftar, null, k.izin.map((b, n) => {
      const i = nama(b.izin_id);
      return h(Bingkai, {
        tag: "li",
        halus: true,
        key: `${b.tipe}-${b.izin_id}`
      }, h(Lencana, {
        warna: b.tipe === 'tambah' ? 'hijau' : 'kuning'
      }, b.tipe === 'tambah' ? AKUN_BARU.izinTambahLabel : AKUN_BARU.izinKurangLabel), h(Tumbuh, null, h("strong", null, i ? labelIzin(i) : `#${b.izin_id}`), h("span", {
        style: {
          color: token.warna.teksRedup
        }
      }, " \u2014 ", b.alasan)), h(Tombol, {
        type: "button",
        varian: "teks",
        onClick: () => ubah({
          izin: k.izin.filter((_, x) => x !== n)
        })
      }, AKUN_BARU.izinHapus));
    })));
  });
}
export function LangkahRingkasan({
  keadaan,
  jenis,
  katalog
}) {
  return h(Kolom, null, ringkasanAkun(keadaan, jenis, katalog).map(b => h(Kolom, {
    tag: "section",
    jarak: "xs",
    key: b.judul
  }, h("h4", {
    style: {
      margin: 0,
      fontSize: token.huruf.ukuran.besar,
      fontWeight: token.huruf.berat.tebal
    }
  }, b.judul), h(Kisi, {
    tag: "dl",
    kolom: "max-content 1fr",
    jarakBaris: "xs"
  }, b.baris.map(r => h(PasanganRingkasan, {
    key: r.label,
    label: r.label,
    nilai: r.nilai
  }))))));
}

/** Hasil: kata sandi awal ditampilkan sekali. */
export function IsiHasilAkun({
  username,
  kataSandi,
  jumlahPeringatan
}) {
  return lokal({
    tersalin: false
  }, (s, set) => {
    const tersalin = s.tersalin;
    const setTersalin = v => set({
      tersalin: typeof v === "function" ? v(s.tersalin) : v
    });
    async function salin() {
      try {
        await navigator.clipboard.writeText(kataSandi);
        setTersalin(true);
      } catch {
        setTersalin(false);
      }
    }
    return h(Fragment, null, h(Peringatan, {
      nada: "kuning"
    }, AKUN_BARU.kataSandiPeringatan), h(Kolom, {
      jarak: "xs"
    }, h("span", {
      style: {
        color: token.warna.teksRedup
      }
    }, AKUN_BARU.username), h("strong", null, username)), h(Kolom, {
      jarak: "xs"
    }, h("span", {
      style: {
        color: token.warna.teksRedup
      }
    }, AKUN_BARU.kataSandiAwal), h(Sebaris, {
      jarak: "md"
    }, h(Kode, {
      "data-testid": "kata-sandi-awal"
    }, kataSandi), h(Tombol, {
      type: "button",
      varian: "sekunder",
      onClick: () => void salin()
    }, tersalin ? AKUN_BARU.tersalin : AKUN_BARU.salin))), jumlahPeringatan > 0 && h(Peringatan, {
      nada: "biru"
    }, AKUN_BARU.peringatanTercatat(jumlahPeringatan)));
  });
}