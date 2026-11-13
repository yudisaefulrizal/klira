import { h, Fragment, lokal } from '../../util/h.js';
import { ATUR_IZIN, NAVIGASI, STATUS_PERIODE } from '@klira/shared';
import { token } from '../../gaya/token.js';
import { HanyaDenganIzin } from '../../komponen/izin-saja.js';
import { AreaTeks } from '../../komponen/ui/area-teks.js';
import { Isian, PesanGalat } from '../../komponen/ui/isian.js';
import { Lencana } from '../../komponen/ui/lencana.js';
import { Pilihan } from '../../komponen/ui/pilihan.js';
import { BarisTabel, SelTabel, Tabel } from '../../komponen/ui/tabel.js';
import { Tombol } from '../../komponen/ui/tombol.js';
import { labelIzin } from './keadaan-akun.js';
import { galatIzinBaru, galatPenugasanBaru, galatUbahPeriode, periodeTeks, statusPeriode, tanggalSaja } from './keadaan-izin.js';
import { Baris, Kisi, Kolom, Sebaris } from '../../komponen/ui/susunan.js';
import { Bingkai } from '../../komponen/ui/kartu.js';
const judulBagian = {
  margin: 0,
  fontSize: token.huruf.ukuran.besar,
  fontWeight: token.huruf.berat.tebal
};

/** Satu baris aksi periode: Ubah periode (tanggal selesai) dan Akhiri sekarang; tanpa hapus. */
function AksiPeriode({
  id,
  mulai,
  selesai,
  hariIni,
  memproses,
  onSimpan
}) {
  return lokal({
    ubah: false,
    nilai: tanggalSaja(selesai) || hariIni
  }, (s, set) => {
    const ubah = s.ubah;
    const setUbah = v => set({
      ubah: typeof v === "function" ? v(s.ubah) : v
    });
    const nilai = s.nilai;
    const setNilai = v => set({
      nilai: typeof v === "function" ? v(s.nilai) : v
    });
    const galat = ubah ? galatUbahPeriode(mulai, nilai) : null;
    if (ubah) {
      return h(Sebaris, {
        sebaris: true,
        sejajar: "akhir"
      }, h(Isian, {
        id: `${id}-selesai`,
        label: ATUR_IZIN.selesai,
        type: "date",
        value: nilai,
        onChange: e => setNilai(e.target.value),
        galat: galat ?? undefined
      }), h(Tombol, {
        type: "button",
        disabled: memproses || !!galat,
        onClick: () => {
          onSimpan(nilai);
          setUbah(false);
        }
      }, ATUR_IZIN.simpanPeriode), h(Tombol, {
        type: "button",
        varian: "sekunder",
        onClick: () => setUbah(false)
      }, ATUR_IZIN.batalUbah));
    }
    const berakhir = statusPeriode(mulai, selesai, hariIni) === 'berakhir';
    return h(Sebaris, {
      sebaris: true,
      sejajar: "regang"
    }, h(Tombol, {
      type: "button",
      varian: "teks",
      disabled: memproses,
      onClick: () => setUbah(true)
    }, ATUR_IZIN.ubahPeriode), !berakhir && h(Tombol, {
      type: "button",
      varian: "teks",
      disabled: memproses || galatUbahPeriode(mulai, hariIni) !== null,
      onClick: () => onSimpan(new Date().toISOString())
    }, ATUR_IZIN.akhiri));
  });
}
export function BagianPenugasan({
  data,
  jenis,
  opsiJenis,
  hariIni,
  form,
  onForm,
  onTambah,
  onPeriode,
  memproses
}) {
  return lokal({
    coba: false
  }, (s, set) => {
    const coba = s.coba;
    const setCoba = v => set({
      coba: typeof v === "function" ? v(s.coba) : v
    });
    const g = coba ? galatPenugasanBaru(form) : {};
    const nama = id => jenis.find(j => j.id === id)?.nama ?? `#${id}`;
    return h(Kolom, {
      tag: "section",
      "aria-label": ATUR_IZIN.penugasanJudul
    }, h("h3", {
      style: judulBagian
    }, ATUR_IZIN.penugasanJudul), data.length === 0 && h("p", {
      style: {
        margin: 0,
        color: token.warna.teksRedup
      }
    }, ATUR_IZIN.penugasanKosong), data.length > 0 && h(Tabel, {
      kolom: [{
        judul: ATUR_IZIN.kolom.jenis
      }, {
        judul: ATUR_IZIN.kolom.periode
      }, {
        judul: ATUR_IZIN.kolom.status
      }, {
        judul: ATUR_IZIN.kolom.tindakan,
        rataKanan: true
      }],
      label: ATUR_IZIN.penugasanJudul
    }, data.map(p => {
      const st = statusPeriode(p.mulai, p.selesai, hariIni);
      return h(BarisTabel, {
        key: p.id
      }, h(SelTabel, {
        style: {
          fontWeight: token.huruf.berat.tebal
        }
      }, nama(p.jenis_akun_id)), h(SelTabel, null, periodeTeks(p.mulai, p.selesai)), h(SelTabel, null, h(Lencana, {
        warna: STATUS_PERIODE.warna(st)
      }, STATUS_PERIODE.label(st))), h(SelTabel, {
        style: {
          textAlign: 'right'
        }
      }, h(HanyaDenganIzin, {
        fitur: "akses",
        aksi: "perbaikan"
      }, h(AksiPeriode, {
        id: `penugasan-${p.id}`,
        mulai: p.mulai,
        selesai: p.selesai,
        hariIni: hariIni,
        memproses: memproses,
        onSimpan: s => onPeriode(p.id, s)
      }))));
    })), h(HanyaDenganIzin, {
      fitur: "akses",
      aksi: "input"
    }, h(Bingkai, {
      arah: "kolom",
      padding: "md"
    }, h("div", {
      style: {
        fontWeight: token.huruf.berat.sedang
      }
    }, ATUR_IZIN.penugasanTambah), h(Kisi, {
      kolom: "2fr 1fr 1fr"
    }, h(Pilihan, {
      id: "penugasan-jenis",
      label: ATUR_IZIN.jenisPilih,
      value: form.jenis_akun_id,
      onChange: e => onForm({
        ...form,
        jenis_akun_id: e.target.value
      }),
      galat: g.jenis_akun_id,
      opsi: [{
        nilai: '',
        label: opsiJenis.length ? '-' : ATUR_IZIN.jenisTidakAda
      }, ...opsiJenis.map(j => ({
        nilai: String(j.id),
        label: j.nama
      }))]
    }), h(Isian, {
      id: "penugasan-mulai",
      label: ATUR_IZIN.mulai,
      type: "date",
      value: form.mulai,
      onChange: e => onForm({
        ...form,
        mulai: e.target.value
      }),
      galat: g.mulai
    }), h(Isian, {
      id: "penugasan-selesai",
      label: ATUR_IZIN.selesaiOpsional,
      type: "date",
      value: form.selesai,
      onChange: e => onForm({
        ...form,
        selesai: e.target.value
      }),
      galat: g.selesai
    })), h("div", null, h(Tombol, {
      type: "button",
      varian: "sekunder",
      disabled: memproses,
      onClick: () => {
        setCoba(true);
        if (Object.keys(galatPenugasanBaru(form)).length) return;
        setCoba(false);
        onTambah();
      }
    }, ATUR_IZIN.tambahkan)))));
  });
}
export function BagianIzin({
  data,
  katalog,
  opsi,
  hariIni,
  form,
  kata,
  onForm,
  onKata,
  onTambah,
  onPeriode,
  memproses
}) {
  return lokal({
    coba: false
  }, (s, set) => {
    const coba = s.coba;
    const setCoba = v => set({
      coba: typeof v === "function" ? v(s.coba) : v
    });
    const g = coba ? galatIzinBaru(form) : {};
    const nilaiIzin = opsi.some(o => o.id === form.izin_id) ? String(form.izin_id) : '';
    const nama = id => {
      const i = katalog.find(x => x.id === id);
      return i ? labelIzin(i) : `#${id}`;
    };
    return h(Kolom, {
      tag: "section",
      "aria-label": ATUR_IZIN.izinJudul
    }, h("h3", {
      style: judulBagian
    }, ATUR_IZIN.izinJudul), data.length === 0 && h("p", {
      style: {
        margin: 0,
        color: token.warna.teksRedup
      }
    }, ATUR_IZIN.izinKosong), data.length > 0 && h(Tabel, {
      kolom: [{
        judul: ATUR_IZIN.kolom.tipe
      }, {
        judul: ATUR_IZIN.kolom.izin
      }, {
        judul: ATUR_IZIN.kolom.alasan
      }, {
        judul: ATUR_IZIN.kolom.periode
      }, {
        judul: ATUR_IZIN.kolom.status
      }, {
        judul: ATUR_IZIN.kolom.tindakan,
        rataKanan: true
      }],
      label: ATUR_IZIN.izinJudul
    }, data.map(i => {
      const st = statusPeriode(i.mulai, i.selesai, hariIni);
      return h(BarisTabel, {
        key: i.id
      }, h(SelTabel, null, h(Lencana, {
        warna: i.tipe === 'tambah' ? 'hijau' : 'kuning'
      }, ATUR_IZIN.tipeLabel[i.tipe])), h(SelTabel, {
        style: {
          fontWeight: token.huruf.berat.tebal
        }
      }, nama(i.izin_id)), h(SelTabel, null, i.alasan), h(SelTabel, null, periodeTeks(i.mulai, i.selesai)), h(SelTabel, null, h(Lencana, {
        warna: STATUS_PERIODE.warna(st)
      }, STATUS_PERIODE.label(st))), h(SelTabel, {
        style: {
          textAlign: 'right'
        }
      }, h(HanyaDenganIzin, {
        fitur: "akses",
        aksi: "perbaikan"
      }, h(AksiPeriode, {
        id: `izin-${i.id}`,
        mulai: i.mulai,
        selesai: i.selesai,
        hariIni: hariIni,
        memproses: memproses,
        onSimpan: s => onPeriode(i.id, s)
      }))));
    })), h(HanyaDenganIzin, {
      fitur: "akses",
      aksi: "input"
    }, h(Bingkai, {
      arah: "kolom",
      padding: "md"
    }, h("div", {
      style: {
        fontWeight: token.huruf.berat.sedang
      }
    }, ATUR_IZIN.izinTambah), h(Baris, null, h(Pilihan, {
      id: "atur-izin-tipe",
      label: ATUR_IZIN.tipe,
      value: form.tipe,
      onChange: e => onForm({
        ...form,
        tipe: e.target.value,
        izin_id: 0
      }),
      opsi: [{
        nilai: 'tambah',
        label: ATUR_IZIN.tipeOpsi.tambah
      }, {
        nilai: 'kurang',
        label: ATUR_IZIN.tipeOpsi.kurang
      }]
    }), h(Isian, {
      id: "atur-izin-cari",
      label: ATUR_IZIN.cariIzin,
      type: "search",
      value: kata,
      onChange: e => onKata(e.target.value)
    })), h(Pilihan, {
      id: "atur-izin-pilih",
      label: ATUR_IZIN.pilihIzin,
      value: nilaiIzin,
      onChange: e => onForm({
        ...form,
        izin_id: Number(e.target.value) || 0
      }),
      galat: g.izin_id,
      opsi: [{
        nilai: '',
        label: opsi.length ? '-' : ATUR_IZIN.izinTidakAda
      }, ...opsi.map(o => ({
        nilai: String(o.id),
        label: labelIzin(o)
      }))]
    }), h(AreaTeks, {
      id: "atur-izin-alasan",
      label: ATUR_IZIN.alasan,
      required: true,
      value: form.alasan,
      onChange: e => onForm({
        ...form,
        alasan: e.target.value
      })
    }), g.alasan && h(PesanGalat, {
      id: "atur-izin-alasan-galat"
    }, g.alasan), h(Baris, null, h(Isian, {
      id: "atur-izin-mulai",
      label: ATUR_IZIN.mulai,
      type: "date",
      value: form.mulai,
      onChange: e => onForm({
        ...form,
        mulai: e.target.value
      }),
      galat: g.mulai
    }), h(Isian, {
      id: "atur-izin-selesai",
      label: ATUR_IZIN.selesaiOpsional,
      type: "date",
      value: form.selesai,
      onChange: e => onForm({
        ...form,
        selesai: e.target.value
      }),
      galat: g.selesai
    })), h("div", null, h(Tombol, {
      type: "button",
      varian: "sekunder",
      disabled: memproses,
      onClick: () => {
        setCoba(true);
        if (Object.keys(galatIzinBaru(form)).length) return;
        setCoba(false);
        onTambah();
      }
    }, ATUR_IZIN.tambahkan)))));
  });
}
export const TeksMemuat = () => h("p", {
  style: {
    margin: 0,
    color: token.warna.teksRedup
  }
}, NAVIGASI.memuat);