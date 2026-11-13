import { h, Fragment } from '../../util/h.js';
                                       
import { CARA_PEMBAYARAN, KLINIS, LABEL_NARASI, RAWAT_INAP, TANDA_VITAL } from '@klira/shared';
                                                                      
import { tanggalPendek, tanggalWaktuPendek } from '../../util/format.js';
import { bagianRawatInap } from '../rawat-inap/data-rawat-inap.js';
import { keperawatanDariIsi, ringkasanKeperawatan } from '../pemeriksaan/keadaan-keperawatan.js';
import { barisPemeriksaanFisik, keadaanDariServer, ringkasanIsi } from '../pemeriksaan/keadaan-pemeriksaan.js';
const C = KLINIS.cetak;
            
                
                
                  
  
                 
                
                      
                       
  

/** Satu blok formulir: pita judul, sel isian dalam kisi, dan kolom pengesahan elektronik di kanan (pengganti kotak tanda tangan). */
function Blok({
  judul,
  sel,
  pengesah,
  kolom = 3,
  children
}   
                
             
                     
                 
                       
 ) {
  return h("section", {
    className: "crm-blok"
  }, h("h2", {
    className: "crm-pita"
  }, judul), h("div", {
    className: "crm-isi"
  }, h("div", {
    className: "crm-kisi",
    style: {
      gridTemplateColumns: `repeat(${kolom}, minmax(0, 1fr))`
    }
  }, sel.length === 0 && h("div", {
    className: "crm-sel"
  }, h("span", {
    className: "crm-nilai"
  }, "-")), sel.map((s, i) => h("div", {
    className: "crm-sel",
    key: `${s.label}-${i}`
  }, h("span", {
    className: "crm-label"
  }, s.label), h("span", {
    className: s.tebal ? 'crm-nilai crm-tebal' : 'crm-nilai'
  }, s.nilai || '-')))), children), h("div", {
    className: "crm-sah"
  }, h("strong", null, pengesah.peran), h("span", null, pengesah.nama ?? '-'), pengesah.waktu && h("span", null, tanggalWaktuPendek(pengesah.waktu)), pengesah.nama && pengesah.waktu && h("span", null, C.disahkan)));
}

/** Rekam medis rawat jalan satu kunjungan (P8) dalam tata letak A4 formulir klinik; dicetak lewat dialog cetak peramban. */
export function Lembar({
  d,
  inap = null
}   
                        
 ) {
  const b = d.klinis.bagian;
  const k = keadaanDariServer(b);
  const sah = (peran        , ...bagian                )           => {
    const p = bagian.map(x => b[x].pengesahan).filter(x => x !== null).sort((x, y) => y.waktu.localeCompare(x.waktu))[0];
    return {
      peran,
      nama: p?.pengguna_nama ?? null,
      waktu: p?.waktu ?? null
    };
  };
  const [anamnesa,, kesimpulan] = ringkasanIsi(k);
  const keperawatan = b.keperawatan.isi ? ringkasanKeperawatan(keperawatanDariIsi(b.keperawatan.isi)).baris : [];
  const tv = TANDA_VITAL.filter(t => k.tanda_vital[t.kunci]).map(t => ({
    label: KLINIS.tandaVital[t.kunci],
    nilai: `${k.tanda_vital[t.kunci]} ${KLINIS.tandaVital.satuan[t.satuan] ?? t.satuan}`
  }));
  const fisik = barisPemeriksaanFisik(k.pemeriksaan).map(x => ({
    ...x,
    tebal: x.nilai.includes('(!)'),
    nilai: x.nilai.replaceAll(' (!)', '')
  }));
  const obatPulang = d.resep.map(r => [r.teks, ...r.item.map(i => `• ${i.nama} ${i.jumlah} ${i.satuan}, ${i.aturan_pakai}`)].join('\n')).join('\n\n');
  const tl = k.tindak_lanjut;
  const validator = d.penunjang.find(p => p.validator);
  const p = d.pasien;
  return h("article", {
    className: "crm-lembar"
  }, h("header", {
    className: "crm-kepala"
  }, h("h1", null, C.judulLembar), h("div", {
    className: "crm-kisi",
    style: {
      gridTemplateColumns: 'repeat(4, minmax(0, 1fr))'
    }
  }, [{
    label: C.tglDaftar,
    nilai: `${tanggalWaktuPendek(d.kepala.mulai)}${d.kepala.nomor_antrean ? ` · ${d.kepala.nomor_antrean}` : ''}`
  }, {
    label: C.noPelayanan,
    nilai: String(d.klinis.kunjungan.id)
  }, {
    label: C.poli,
    nilai: d.kepala.poli ?? '-'
  }, {
    label: C.dokter,
    nilai: d.kepala.dokter ?? '-'
  }].map(s => h("div", {
    className: "crm-sel",
    key: s.label
  }, h("span", {
    className: "crm-label"
  }, s.label), h("span", {
    className: "crm-nilai"
  }, s.nilai))))), h(Blok, {
    judul: C.blok.administratif,
    kolom: 4,
    pengesah: {
      peran: C.peran.pasien,
      nama: d.persetujuan_umum ? C.persetujuanUmum : null,
      waktu: d.persetujuan_umum
    },
    sel: [{
      label: C.noRm,
      nilai: p.nomor_rm,
      tebal: true
    }, {
      label: C.nama,
      nilai: p.nama,
      tebal: true
    }, {
      label: C.kepalaKeluarga,
      nilai: [p.kepala_keluarga, p.folder].filter(Boolean).join(' · ')
    }, {
      label: C.nik,
      nilai: p.nik ?? '-'
    }, {
      label: C.lahirKelamin,
      nilai: `${tanggalPendek(p.tanggal_lahir)} · ${p.jenis_kelamin === 'laki_laki' ? 'L' : 'P'}`
    }, {
      label: C.agamaNikah,
      nilai: [p.agama, p.status_kawin].filter(Boolean).join(' · ') || '-'
    }, {
      label: C.hubungan,
      nilai: p.hubungan ?? '-'
    }, {
      label: C.caraBayar,
      nilai: `${CARA_PEMBAYARAN.label(d.klinis.kunjungan.cara_pembayaran)}${p.nomor_jkn ? ` · ${p.nomor_jkn}` : ''}`
    }]
  }), h(Blok, {
    judul: C.blok.keperawatan,
    kolom: 4,
    pengesah: sah(C.peran.perawat, 'keperawatan', 'tanda_vital'),
    sel: [{
      label: C.jenisKunjungan,
      nilai: inap ? RAWAT_INAP.judul : C.rawatJalan
    }, ...tv, ...keperawatan]
  }), h(Blok, {
    judul: C.blok.anamnesa,
    pengesah: sah(C.peran.dokter, 'anamnesis'),
    sel: anamnesa.baris
  }), h(Blok, {
    judul: C.blok.fisik,
    kolom: 4,
    pengesah: sah(C.peran.dokter, 'pemeriksaan'),
    sel: fisik
  }), h(Blok, {
    judul: C.blok.penunjang,
    kolom: 2,
    pengesah: {
      peran: C.peran.lab,
      nama: validator?.validator ?? null,
      waktu: validator?.waktu ?? null
    },
    sel: d.penunjang.map(x => ({
      label: x.nama,
      nilai: x.nilai ? `${x.nilai}${x.satuan ? ` ${x.satuan}` : ''}${x.interpretasi && x.interpretasi !== 'normal' ? ` (${x.interpretasi})` : ''}` : C.belumAdaHasil,
      tebal: !!x.interpretasi && x.interpretasi !== 'normal'
    }))
  }), h(Blok, {
    judul: C.blok.kesimpulan,
    pengesah: sah(C.peran.dokter, 'diagnosis', 'diagnosis_banding', 'kie'),
    sel: kesimpulan.baris
  }), h(Blok, {
    judul: C.blok.terapi,
    pengesah: sah(C.peran.dokter, 'tindakan', 'obat_poli'),
    sel: [{
      label: KLINIS.langkah.tindakan,
      nilai: k.tindakan.map(t => `${t.kode} ${t.nama}${t.jumlah && t.jumlah !== '1' ? ` ×${t.jumlah}` : ''}`).join('\n') || '-'
    }, {
      label: LABEL_NARASI.obat_poli,
      nilai: k.obat_poli || '-'
    }, {
      label: KLINIS.terapi.obatPulang,
      nilai: obatPulang || '-'
    }]
  }), h(Blok, {
    judul: C.blok.rujukan,
    kolom: 4,
    pengesah: tl.jenis === 'rujuk' ? sah(C.peran.dokter, 'tindak_lanjut') : {
      peran: C.peran.dokter,
      nama: null,
      waktu: null
    },
    sel: tl.jenis === 'rujuk' ? [{
      label: C.suratRujukan,
      nilai: d.rujukan ? `${tanggalPendek(d.rujukan.tanggal)} · ${d.rujukan.nomor}` : '-'
    }, {
      label: KLINIS.tindakLanjut.tujuan,
      nilai: d.rujukan?.tujuan ?? tl.tujuan
    }, {
      label: C.alasanRujuk,
      nilai: tl.catatan || '-'
    }] : [{
      label: KLINIS.langkah.tindakLanjut,
      nilai: KLINIS.tindakLanjut.jenisOpsi.find(o => o.nilai === tl.jenis)?.label ?? '-'
    }]
  }), ...(inap ? blokRawatInap(inap) : []), h("footer", {
    className: "crm-kaki"
  }, h("span", null, C.dicetak(d.dicetak_oleh, tanggalWaktuPendek(d.dicetak_pada))), h("span", null, C.tandaTebal)));
}
/** Blok formulir khusus rawat inap: admisi/penempatan/DPJP, CPPT, dan pemulangan (urut seperti perjalanan pasien). */
function blokRawatInap(inap) {
  const [admisi, cppt, pulang] = bagianRawatInap(inap), m = inap.detail.pemulangan;
  const sel = (b, tebal) => b.baris.map((r) => ({ label: r.label, nilai: r.nilai, tebal }));
  const terakhirCppt = [...inap.cppt].sort((a, b) => b.waktu.localeCompare(a.waktu))[0];
  const dokter = (nama, waktu) => ({ peran: C.peran.dokter, nama: nama ?? null, waktu: waktu ?? null });
  return [
    h(Blok, { judul: admisi.judul, sel: sel(admisi), kolom: 2, pengesah: dokter(inap.detail.dpjp_riwayat?.find((x) => x.tipe === 'ATND')?.nama ?? null, inap.detail.kunjungan.mulai) }),
    h(Blok, { judul: cppt.judul, sel: sel(cppt), kolom: 1, pengesah: dokter(terakhirCppt?.pengesahan?.pengguna_nama ?? terakhirCppt?.dibuat_oleh_nama, terakhirCppt?.waktu) }),
    ...(pulang ? [h(Blok, { judul: pulang.judul, sel: sel(pulang), kolom: 2, pengesah: dokter(m.dibuat_oleh_nama, m.waktu) })] : []),
  ];
}
