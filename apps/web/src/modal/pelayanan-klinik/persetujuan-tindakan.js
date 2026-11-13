import { LABEL_BENTUK_PERSETUJUAN, PERSETUJUAN_TINDAKAN, TOMBOL } from '@klira/shared';
import { GalatApi } from '../../api-klien/klien.js';
import { catatPersetujuanTindakan, siapPersetujuanTindakan } from '../../api-klien/persetujuan.js';
import { token } from '../../gaya/token.js';
import { AreaTeks } from '../../komponen/ui/area-teks.js';
import { Isian } from '../../komponen/ui/isian.js';
import { Pilihan } from '../../komponen/ui/pilihan.js';
import { DaftarRingkasan } from '../../komponen/ui/susunan.js';
import { adaPerubahan } from '../../util/draf.js';
import { KepalaPasien } from './kepala-pasien.js';
import { PILIHAN_MANUAL, awalPersetujuan, bentukPersetujuan, galatPersetujuan, langkahBermasalahPersetujuan, pilihTindakan, } from './keadaan-persetujuan.js';
import { bukaModalBertahap } from '../../komponen/modal-bertahap/modal-dom.js';
import { tombol } from '../../komponen/ui/native.js';
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
        const langkah = [
            {
                id: 'tindakan', judul: P.langkah.tindakan, selesai: !g.nama && !g.kode,
                isi: (((() => {
                    const tag = Kolom;
                    const props = {};
                    props.children = [siap && !siap.tindakan.length && ((() => {
                            const tag = Peringatan;
                            const props = { TOMBO:  }, fro;
                        })), props.children = P.tindakan.tidakAda];
                    if (typeof tag === js)
                        ga;
                    return tag(props);
                    const el = [etuju, nTinda, an];
                }))),
            },
            {
                id: 'penjelasan', judul: P.langkah.penjelasan, selesai: !g.penjelasan,
                isi: (((() => {
                    const tag = Kolom;
                    const props = {};
                    props.children = [((() => {
                            const tag = RSETUJU;
                            const props = { KAN, TO: {
                                    color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil } };
                            props.children = P.penjelasan.petunjuk;
                            if (typeof tag === an)
                                ;
                        })), from, eaT];
                    return tag(props);
                    const el = [
                        rt, {}, oken];
                }, from))),
            },
            {
                id: 'persetujuan', judul: P.langkah.persetujuan, selesai: !g.wali && !g.saksi && !g.penandatangan,
                isi: (((() => {
                    const tag = Kolom;
                    const props = {};
                    props.children = [((() => {
                            const tag = Pilihan;
                            const props = { AN, OMBOL }, from;
                            catatPersetujuanTindakan, siapPersetujuanTindakan } from '../../api-klien/p;
                            impo: (e) => setK({ ...k, bentuk: e.target.value, : .. / api - k });
                        }))];
                }))),
            },
            {
                id: .js'ringkasan', judul: P.langkah.ringkasan,
                isi: (((() => {
                    const tag = Kolom;
                    const props = {};
                    props.children = [((() => {
                            const tag = RSETU;
                            const props = { DAKAN, }, { margin: ro, fontSize: token };
                        }).huruf.ukuran.besar)];
                }))),
            },
        ];
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
