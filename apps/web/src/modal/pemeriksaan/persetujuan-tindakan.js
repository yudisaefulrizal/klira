import { LABEL_BENTUK_PERSETUJUAN, PERSETUJUAN_TINDAKAN, TOMBOL } from '@klira/shared';
import { GalatApi } from '../../api-klien/klien.js';
import { catatPersetujuanTindakan, siapPersetujuanTindakan } from '../../api-klien/persetujuan.js';
import { token } from '../../gaya/token.js';
import { AreaTeks } from '../../komponen/ui/area-teks.js';
import { Isian } from '../../komponen/ui/isian.js';
import { Pilihan } from '../../komponen/ui/pilihan.js';
import { h } from '../../util/h.js';
import { Peringatan } from '../../komponen/ui/peringatan.js';
import { DaftarRingkasan, Kolom } from '../../komponen/ui/susunan.js';
import { adaPerubahan } from '../../util/draf/draf.js';
import { KepalaPasien } from '../pasien/kepala-pasien.js';
import { PILIHAN_MANUAL, awalPersetujuan, bentukPersetujuan, galatPersetujuan, langkahBermasalahPersetujuan, pilihTindakan, } from './keadaan-persetujuan.js';
import { bukaModalBertahap } from '../../komponen/modal-bertahap/modal-bertahap.js';
import { tombol } from '../../komponen/ui/primitif.js';
export function bukaPersetujuanTindakan({ kunjunganId, pasien, onTutup, onSelesai }) {
    const P = PERSETUJUAN_TINDAKAN;
    let siap = null, k = awalPersetujuan(null), awal = awalPersetujuan(null), indeks = 0, dicoba = false, galat = null, memproses = false, tercatat = false, aktif = true, modal;
    function setK(baru) { k = baru; repaint(); }
    function repaint() {
        if (!modal || !aktif)
            return;
        const focus = document.activeElement, id = focus?.id, start = focus?.selectionStart, end = focus?.selectionEnd;
        modal.ke(indeks, { fokus: false, beritahu: false });
        update();
        if (id) {
            const f = document.getElementById(id);
            f?.focus();
            if (start != null)
                try {
                    f.setSelectionRange(start, end);
                }
                catch { }
        }
    }
    function update() { modal?.perbarui({ galat: galat ?? '', labelKirim: memproses ? P.tombol.menyimpan : P.tombol.simpan, nonaktif: memproses || !siap }); }
    function tutup() { aktif = false; modal.tutup(); (tercatat ? onSelesai : onTutup)(); }
    function buatLangkah() {
        const g = galatPersetujuan(k, siap);
        const tampil = (b) => (dicoba ? g[b] : undefined);
        const opsiTindakan = [
            { nilai: '', label: P.tindakan.pilihPlaceholder },
            ...(siap?.tindakan ?? []).map((t) => ({ nilai: t.kode, label: `${t.kode} ${t.nama}` })),
            { nilai: PILIHAN_MANUAL, label: P.tindakan.manual },
        ];
        const opsiBentuk = ['tertulis', 'lisan'].map((b) => ({ nilai: b, label: LABEL_BENTUK_PERSETUJUAN.label(b) }));
        const opsiTtd = [{ nilai: 'pasien', label: pasien.nama }, { nilai: 'wali', label: P.persetujuan.wali }];
  const langkah = [{
    id: 'tindakan',
    judul: P.langkah.tindakan,
    selesai: !g.nama && !g.kode,
    isi: h(Kolom, null, siap && !siap.tindakan.length && h(Peringatan, {
      nada: "biru"
    }, P.tindakan.tidakAda), h(Pilihan, {
      id: "ptd-pilih",
      label: P.tindakan.pilihLabel,
      opsi: opsiTindakan,
      value: k.pilih,
      onChange: e => siap && setK(pilihTindakan(k, siap, e.target.value))
    }), h(Isian, {
      id: "ptd-nama",
      label: P.tindakan.nama,
      value: k.nama,
      onChange: e => setK({
        ...k,
        nama: e.target.value
      }),
      galat: tampil('nama'),
      readOnly: !!k.pilih && k.pilih !== PILIHAN_MANUAL,
      autoComplete: "off"
    }), k.pilih === PILIHAN_MANUAL && h(Isian, {
      id: "ptd-kode",
      label: P.tindakan.kode,
      value: k.kode,
      onChange: e => setK({
        ...k,
        kode: e.target.value
      }),
      galat: tampil('kode'),
      autoComplete: "off"
    }))
  }, {
    id: 'penjelasan',
    judul: P.langkah.penjelasan,
    selesai: !g.penjelasan,
    isi: h(Kolom, null, h("span", {
      style: {
        color: token.warna.teksRedup,
        fontSize: token.huruf.ukuran.kecil
      }
    }, P.penjelasan.petunjuk), h(AreaTeks, {
      id: "ptd-penjelasan",
      label: P.penjelasan.label,
      value: k.penjelasan,
      onChange: e => setK({
        ...k,
        penjelasan: e.target.value
      }),
      "aria-invalid": tampil('penjelasan') ? true : undefined
    }), tampil('penjelasan') && h(Peringatan, null, g.penjelasan), siap?.teks ? h(Kolom, {
      jarak: "xs"
    }, h("strong", null, P.penjelasan.teksTitel), h("span", {
      style: {
        color: token.warna.teksRedup,
        fontSize: token.huruf.ukuran.kecil
      }
    }, P.penjelasan.versi(siap.teks.versi)), h("p", {
      style: {
        margin: 0,
        whiteSpace: 'pre-line'
      }
    }, siap.teks.isi)) : h(Peringatan, null, P.penjelasan.teksTidakAda))
  }, {
    id: 'persetujuan',
    judul: P.langkah.persetujuan,
    selesai: !g.wali && !g.saksi && !g.penandatangan,
    isi: h(Kolom, null, h(Pilihan, {
      id: "ptd-bentuk",
      label: P.persetujuan.bentuk,
      opsi: opsiBentuk,
      value: k.bentuk,
      onChange: e => setK({
        ...k,
        bentuk: e.target.value                                
      })
    }), siap?.pasien.tidak_cakap && h(Peringatan, {
      nada: "biru"
    }, P.persetujuan.tidakCakap), h(Pilihan, {
      id: "ptd-ttd",
      label: P.persetujuan.penandatangan,
      opsi: opsiTtd,
      value: k.penandatangan,
      onChange: e => setK({
        ...k,
        penandatangan: e.target.value                                       
      }),
      galat: tampil('penandatangan')
    }), k.penandatangan === 'wali' && (siap && !siap.wali.length ? h(Peringatan, null, P.persetujuan.tanpaWali) : h(Pilihan, {
      id: "ptd-wali",
      label: P.persetujuan.wali,
      opsi: [{
        nilai: '',
        label: P.persetujuan.pilihWali
      }, ...(siap?.wali ?? []).map(w => ({
        nilai: String(w.id),
        label: `${w.nama} (${w.hubungan})`
      }))],
      value: k.wali,
      onChange: e => setK({
        ...k,
        wali: e.target.value
      }),
      galat: tampil('wali')
    })), h(Pilihan, {
      id: "ptd-saksi",
      label: P.persetujuan.saksi,
      opsi: [{
        nilai: '',
        label: P.persetujuan.pilihSaksi
      }, ...(siap?.saksi ?? []).map(s => ({
        nilai: String(s.id),
        label: s.nama
      }))],
      value: k.saksi,
      onChange: e => setK({
        ...k,
        saksi: e.target.value
      }),
      galat: tampil('saksi')
    }), h("span", {
      style: {
        color: token.warna.teksRedup,
        fontSize: token.huruf.ukuran.kecil
      }
    }, P.persetujuan.saksiKet))
  }, {
    id: 'ringkasan',
    judul: P.langkah.ringkasan,
    isi: h(Kolom, null, h("h3", {
      style: {
        margin: 0,
        fontSize: token.huruf.ukuran.besar
      }
    }, P.ringkasan.judul), h(DaftarRingkasan, {
      bagian: [{
        judul: P.judul,
        baris: [{
          label: P.ringkasan.tindakan,
          nilai: [k.kode, k.nama].filter(Boolean).join(' ') || '-'
        }, {
          label: P.ringkasan.bentuk,
          nilai: LABEL_BENTUK_PERSETUJUAN.label(k.bentuk)
        }, {
          label: P.ringkasan.penandatangan,
          nilai: k.penandatangan === 'wali' ? siap?.wali.find(w => String(w.id) === k.wali)?.nama ?? '-' : pasien.nama
        }, {
          label: P.ringkasan.saksi,
          nilai: siap?.saksi.find(s => String(s.id) === k.saksi)?.nama ?? '-'
        }, {
          label: P.ringkasan.penjelasan,
          nilai: k.penjelasan || '-'
        }, {
          label: P.ringkasan.versi,
          nilai: siap?.teks ? P.penjelasan.versi(siap.teks.versi) : '-'
        }]
      }]
    }), h("span", {
      style: {
        color: token.warna.teksRedup,
        fontSize: token.huruf.ukuran.kecil
      }
    }, P.ringkasan.catat))
  }];
        return langkah;
    }
    modal = bukaModalBertahap({ judul: P.judul, langkah: ['tindakan', 'penjelasan', 'persetujuan', 'ringkasan'].map((id, n) => ({ id, judul: P.langkah[id], isi: () => buatLangkah()[n].isi, selesai: () => !!buatLangkah()[n].selesai })), onIndeks(n) { indeks = n; }, konteks: () => KepalaPasien({ nama: pasien.nama, nomorRm: pasien.nomor_rm }), onTutup: tutup, lindungiTutup: () => adaPerubahan(awal, k), labelKirim: P.tombol.simpan, onKirim: kirim });
    async function kirim() {
        dicoba = true;
        if (!siap || memproses)
            return;
        const masalah = langkahBermasalahPersetujuan(galatPersetujuan(k, siap));
        if (masalah >= 0) {
            indeks = masalah;
            repaint();
            return;
        }
        memproses = true;
        galat = null;
        update();
        try {
            const r = await catatPersetujuanTindakan(kunjunganId, bentukPersetujuan(k, siap));
            if (!aktif)
                return;
            tercatat = true;
            const p = document.createElement('p');
            p.style.margin = '0';
            p.textContent = P.hasil.pesan(r.tindakan_nama ?? k.nama);
            modal.hasil({ judul: P.hasil.judul, isi: p, aksi: [tombol(TOMBOL.tutup, tutup)] });
        }
        catch (e) {
            if (aktif)
                galat = e instanceof GalatApi ? e.message : P.galat.kunjunganTidakAda;
        }
        finally {
            memproses = false;
            if (aktif)
                update();
        }
    }
    update();
    siapPersetujuanTindakan(kunjunganId).then(s => {
        if (aktif) {
            siap = s;
            awal = awalPersetujuan(s);
            k = { ...awal };
            repaint();
        }
    }).catch(e => {
        if (aktif) {
            galat = e instanceof GalatApi ? e.message : P.galat.kunjunganTidakAda;
            update();
        }
    });
    return { tutup() { aktif = false; modal.tutup(); } };
}
