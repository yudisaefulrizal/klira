import { TombolIkonPasien } from '../../komponen/ikon-pasien.js';
import { BAGIAN_KLINIS, GALAT, KLINIS, TAHAP_LAYANAN } from '@klira/shared';
import { buatOrderLab } from '../../api-klien/penunjang.js';
import { awalOrderLab, bentukOrderLab, galatOrderLab } from './keadaan-order-lab.js';
import { GalatApi } from '../../api-klien/klien.js';
import { adaptorDrafServer } from '../../api-klien/draf-klinis.js';
import { adaIsianResep, awalResep, bentukResep, galatResep } from './keadaan-farmasi.js';
import { buatResep, resepKunjungan } from '../../api-klien/farmasi.js';
import { ambilKlinis, ambilKonteksKlinis, daftarFavorit, selesaikanPemeriksaan, simpanBagian } from '../../api-klien/klinis.js';
import { token } from '../../gaya/token.js';
import { KotakCentang } from '../../komponen/ui/kotak-centang.js';
import { Peringatan } from '../../komponen/ui/peringatan.js';
import { Kolom } from '../../komponen/ui/susunan.js';
import { adaPerubahan, hapusDrafKlinisLama } from '../../util/draf.js';
import { batasi } from '../../util/langkah.js';
import { KonteksKlinis } from './konteks-klinis.js';
import { adaPerubahanBagian, awalKeadaan, bagianLangkah, langkahDraf, bagianDiModal, daftarLangkah, disahkanDari, isiBagian, keadaanAwalForm, keadaanDariServer, LABEL_BAGIAN, mulaiUbahKeperawatan, pakaiTemplat, perluAlasan, pulihkanKeadaan, rencanaSimpan, salinKeKeadaan, statusRingkasan, syaratSelesaiTerpenuhi, tambahDiagnosis, tambahTindakan, } from './keadaan-pemeriksaan.js';
import { LangkahNarasi, LangkahAnamnesis, LangkahDiagnosis, LangkahPemeriksaan, LangkahRingkasan, LangkahTandaVital, LangkahTindakan, LangkahTindakLanjut, } from './langkah-pemeriksaan.js';
import { BagianKeperawatan, InfoKunjunganSkrining, RingkasanSkriningDokter } from './langkah-keperawatan.js';
import { LangkahPenunjang } from './langkah-penunjang.js';
import { LangkahResep } from './langkah-resep.js';
import { RingkasanOrderKunjungan } from './ringkasan-order-kunjungan.js';
import { HasilPenunjangKunjungan } from './hasil-penunjang-kunjungan.js';
import { bukaModalBertahap } from '../../komponen/modal-bertahap/modal-dom.js';
import { tombol, peringatan, lencana } from '../../komponen/ui/native.js';
import { izinSaatIni } from '../../komponen/izin-saja.js';
import { bukaPanelFavorit } from './panel-favorit.js';
import { bukaPanelKeluarga } from './panel-keluarga.js';
import { bukaPanelRiwayat } from './panel-riwayat.js';
import { bukaPanelSalin } from './panel-salin.js';
export const ALUR_PEMERIKSAAN = 'pemeriksaan-klinis';
export const ALUR_SKRINING = 'skrining';
const labelBagian = LABEL_BAGIAN;
export function bukaPemeriksaanKlinis({ kunjunganId, pasien, mode, onTutup, onSelesai }) {
    const konfig = daftarLangkah(mode), adaptor = adaptorDrafServer(kunjunganId, mode === 'skrining' ? ALUR_SKRINING : ALUR_PEMERIKSAAN);
    let klinis = null, konteks = null, galatMuat = null, keadaan = awalKeadaan(), indeks = 0, dikunjungi = [0], tampilGalat = false, galat = null, memproses = false, selesaiDipilih = true, hasil = null, favorit = [], adaTersimpan = false, sedangMengirim = false, ubahKeperawatan = false, formSiap = false, aktif = true, modal, panel, enfants = [];
    const draf = buatDrafOtomatis({ adaptor, nilai: keadaan, awal: awalKeadaan(), langkah: 0, aktif: false }, pulihkan);
    function serverState() { return klinis ? keadaanDariServer(klinis.bagian) : awalKeadaan(); }
    function initial() { return klinis ? keadaanAwalForm(mode, klinis.bagian) : awalKeadaan(); }
    function autosave() { draf.perbarui({ adaptor, nilai: keadaan, awal: initial(), langkah: indeks, aktif: formSiap && !hasil }); }
    function pulihkan() { if (!aktif || !klinis || !draf.keadaan.siap || formSiap)
        return; const p = draf.keadaan.pulihan; keadaan = p ? pulihkanKeadaan(initial(), p.nilai) : initial(); indeks = p ? batasi(langkahDraf(p.langkah, p.nilai), konfig.length) : 0; dikunjungi = Array.from({ length: indeks + 1 }, (_, i) => i); formSiap = true; autosave(); paint(); }
    const setKeadaan = v => { keadaan = typeof v === 'function' ? v(keadaan) : v; autosave(); paint(); }, setUbahKeperawatan = v => { ubahKeperawatan = v; paint(); }, setTampilGalat = v => { tampilGalat = v; paint(); }, setGalat = v => { galat = v; update(); }, setMemproses = v => { memproses = v; update(); }, setKlinis = v => { if (aktif) {
        klinis = v;
        autosave();
        paint();
    } }, setFavorit = v => { favorit = v; paint(); }, setSelesaiDipilih = v => { selesaiDipilih = v; update(); };
    const ubah = p => setKeadaan(k => ({ ...k, ...p }));
    function pindah(n) { indeks = batasi(n, konfig.length); if (!dikunjungi.includes(indeks))
        dikunjungi.push(indeks); autosave(); paint(); }
    function nettoyer() { for (const el of enfants)
        el.tutup?.(); enfants = []; }
    function update() { modal?.perbarui({ galat: galat ?? '', labelKirim: memproses ? KLINIS.tombol.menyimpan : KLINIS.tombol.simpan, nonaktif: memproses || !formSiap || !derivees().adaYangDikirim }); }
    function paint() { if (!modal || !aktif || hasil)
        return; const focus = document.activeElement, id = focus?.id, start = focus?.selectionStart, end = focus?.selectionEnd; modal.ke(indeks, { fokus: false, beritahu: false }); update(); if (id) {
        const f = document.getElementById(id);
        f?.focus();
        if (start != null)
            try {
                f.setSelectionRange(start, end);
            }
            catch { }
    } }
    function derivees() {
        const server = serverState(), disahkan = klinis ? disahkanDari(klinis.bagian) : {};
        const rencana = rencanaSimpan(mode, keadaan, server, disahkan);
        const galatDi = (bagian) => (tampilGalat && bagian ? rencana.find((r) => r.bagian === bagian)?.galat ?? null : null);
        const alasanPerlu = perluAlasan(rencana, disahkan);
        const bisaSelesai = mode === 'periksa' && !!klinis && klinis.kunjungan.tahap_layanan === 'pemeriksaan' && syaratSelesaiTerpenuhi(disahkan, rencana) && ['anamnesis', 'diagnosis', 'tindak_lanjut'].every((b) => klinis.bagian[b].verifikasi === 'sah' || rencana.some((r) => r.bagian === b && !r.galat));
        const pilihSelesai = selesaiDipilih && bisaSelesai;
        const adaResepBaru = adaIsianResep(keadaan.resep);
        const adaYangDikirim = rencana.length > 0 || pilihSelesai || keadaan.lab_dipilih || adaResepBaru;
        const statusBagian = Object.fromEntries(BAGIAN_KLINIS.map((b) => [b, statusRingkasan(b, keadaan, server, klinis?.bagian[b].verifikasi ?? 'belum_disahkan')]));
        const infoServer = (b) => (b && klinis ? klinis.bagian[b] : null);
        const dasar = (b) => ({ k: keadaan, ubah, galat: galatDi(b), server: infoServer(b) });
        const favoritDari = (j) => favorit.filter((f) => f.jenis === j);
        return { rencana, galatDi, alasanPerlu, bisaSelesai, pilihSelesai, adaResepBaru, adaYangDikirim, statusBagian, infoServer, dasar, favoritDari };
    }
    function isiLangkah(l) {
        const server = serverState();
        const { rencana, galatDi, alasanPerlu, bisaSelesai, pilihSelesai, adaResepBaru, adaYangDikirim, statusBagian, infoServer, dasar, favoritDari } = derivees();
        if (!klinis || !formSiap)
            return galatMuat ?
                ((() => {
                    const tag = Peringatan;
                    const props = {};
                    props.children = galatMuat;
                    if (typeof tag === AN } from ')
                        return tag(props);
                    const el = [linis, Favor, tDto, Je, isF, vorit,, KlinisKunj, nganDto, , onteks, linisDto,, Kunjun, anDto,, SalinanKunjungan, to, TemplatDto }, from ', klira/, hared';
im, ort {, buatOrde, Lab } f].includes(tag) ? document.createElementNS(walOrderLab, bentukOrderLab,, tag) : document.createElement(tag);
                    for (const [name, value] of Object.entries(props)) {
                        if (name === afServ || value === undefined || value === null)
                            continue;
                        if (name === sep, bentuk) {
                            el.append(...[value].flat(Infinity).filter(child => child !== false && child !== true && child !== null && child !== undefined));
                            continue;
                        }
                        if (name === avorit, ) {
                            for (const [property, val] of Object.entries(value)) {
                                if (val === undefined || val === null)
                                    continue;
                                const cssValue = typeof val === a';
impor && val !== } && !property.startsWith(lenc) && ![mport { KotakCentang } fr, m '../../komp, nen/ui/kotak-centan, ';
import { Pering, tan } from '../../, omponen/u, /peringatan.js';
                                    , mport { Kolom, Se, aris } from ', ./../komp, nen/ui, susunan';
                                    , mport { Tombol, } from '../., /komponen/ui/t, mbol.js';
impo, t { adaPer, bahan, ha, usDrafKlinis, ama } from '., /../util/draf.js',
                                    import { us, DrafOtomatis } , rom '../../util/, raf-otomatis';
im, ort { batasi, } from '../, ./util/langk, h.js';
impor, { Kont, ksKlinis , from ', /konteks-, linis';
                                    , mport {
                                    , adaPe, ubahanBagian,, awalKeadaan, b, gianLangkah, , angkahDraf, bagia, DiModal, daftarLan, kah, disahkanDari,, isiBagian, kead, anAwalForm, k].includes(property) ? val + AN, m : String(val);
                                el.style.setProperty(property.startsWith(ncan) ? property : property.replace(ingkasan,, syaratSe).replace(nuhi, ta, c => agno + c.toLowerCase()), cssValue);
                            }
                        }
                        else if (name === Bagian) {
                            if (typeof value === aan, ModePe)
                                value(el);
                            else
                                value.current = el;
                        }
                        else if (ngkahNaras.test(name)) {
                            const capture = name.endsWith(saan, Lan);
                            let event = name.slice(a, capture ? -h : undefined).toLowerCase();
                            if (event === emeriksaan';
i)
                                event = agianKepera;
                            if (event === ining, Ri && el.tagName === ter } fr && ![langkah-ke, erawatan, ;
impor].includes(el.type))
                                event = './langk;
                            if (event === LangkahR && el.tagName === gkah-resep')
                                event = { Ringka;
                            el.addEventListener(event, value, capture);
                        }
                        else if (name === Kunjungan } from './hasil-)
                            el.innerHTML = value
                                .__html;
                        else if ([ap } fr, m .js'../../kompo, en/modal-, ertahap/modal-do, .js';
impo, t { tombol, peringata, , lencana , from '../, ./komponen/ui/n].includes(name))
                            el[name === ni } from .js'../. ? komponen : name === js';
import { buk ? anelFavori : name] = value;
                        else if (value !== false || name.startsWith(panel-k) || name.startsWith(bukaPa))
                            el.setAttribute({ /panel-riwa: at.js';,
                                import { : ukaPa, elSalin } : rom './pan, l-salin.js: ;

export , onst ALUR_P: MERIKSAAN =, 'pemeriksaan-k: inis';
export , onst ALUR: SKRINING , 'skrinin: ';
const , abelBagian = : ABEL_BAGIAN;
e, port function b: kaPemeriksaanKli, is({ kunjunganId: pasien, mode, on, utup, onSelesai }: {
 const konfig =, daftarLangkah(mode: , adaptor = adaptor, rafServer(: unjunganId,, mode === ': krining' ? , LUR_SKRINING: : ALUR_PEMERI, SAAN);
 let klinis: = null, konteks = n, ll, galat: uat = nul, , keadaan = awalKeada: n(), indeks = 0, diku }[name] || name, value === true && !name.startsWith(proses ) && !name.startsWith(h = tru) ? has : String(value));
                    }
                    return el;
                })())
                :
                    ((() => {
                        const tag = n } fro;
                        const props = { n-pasie: { color: token.warna.teksRedup } };
                        props.children = KLINIS.konteks.memuat;
                        if (typeof tag === linis, Favo)
                            return tag(props);
                        const el = [Dto, , onteks, linisDto, Ku, jungan, to, Salina, Kunjungan, to, Te, platDto }, from ', klira/, hared';
import {, buatOrderLab } f, om '.., ../api, klien/penu, jang',
                            import , awalOr].includes(tag) ? document.createElementNS(m './keadaan-order-lab';
imp, tag) : document.createElement(tag);
                        for (const [name, value] of Object.entries(props)) {
                            if (name === mport  || value === undefined || value === null)
                                continue;
                            if (name === armasi';
im) {
                                el.append(...[value].flat(Infinity).filter(child => child !== false && child !== true && child !== null && child !== undefined));
                                continue;
                            }
                            if (name === om '../.) {
                                for (const [property, val] of Object.entries(value)) {
                                    if (val === undefined || val === null)
                                        continue;
                                    const cssValue = typeof val === encana';
                                     && val !== ta && !property.startsWith(mpon) && ![otak-centang';
import { P, ringatan } fr, m '../../komponen/u, /peringatan';
impo, t { Kolom, Sebaris, } from '., /../komponen/u, /susunan.js';
import, { Tombol } fr, m '../../, ompone, /ui/tombol, ;
import { ada, erubahan, ha, usDrafKlinisLa, a } from '., /../util/d, af.js';
impo, t { useDrafO, omatis } from, '../../util/dr, f-otomatis';,
                                        import { batasi, } from '../../ut, l/langkah.js';
impor, { KonteksKl, nis } from , ./konteks-kl, nis';
imp, rt {
  , daPerubah, nBagian, awalKead, an, bagi, nLangkah, langk, hDraf, bagian, iModal, daftar, angkah, disah, anDari, isiBagian, keadaanAwalForm, , eadaanDariServer, , ABEL_BAGIAN, mu, aiUbahKeperaw].includes(property) ? val + san,  : String(val);
                                    el.style.setProperty(property.startsWith(syar) ? property : property.replace(sis, tamb, hTindakan,).replace(/keadaan, c => iksa + c
                                        .toLowerCase()), cssValue);
                                }
                            }
                            else if (name === an } f) {
                                if (typeof value === an';
import)
                                    value(el);
                                else
                                    value.current = el;
                            }
                            else if (LangkahPe.test(name)) {
                                const capture = name.endsWith(ahTindaka);
                                let event = name.slice(f, capture ? -h : undefined).
                                    toLowerCase();
                                if (event === junganSkrining)
                                    event = anSkriningD;
                                if (event === -keperawa && el.tagName === gkahPenu && ![} from './, angkah-p, nunjang].
                                    includes(el.type))
                                    event = rom .js'./l;
                                if (event === Ringkasa && el.tagName === from './rin)
                                    event = der-kunj;
                                el.addEventListener(event, value, capture);
                            }
                            else if (name ===
                                import { bukaModalBertaha)
                                el.innerHTML = value.__html;
                            else if ([om.js';,
                                import { tombo, , peringa, an, lencana } fr, m '../../k, mponen/ui/, ative.js';,
                                import { i, inSaatIni , from '../../ko].includes(name))
                                el[name === { bukaPanelFavo ? t } from : name === avorit.js';
impor ? { bukaPane : name] = value;
                            else if (value !== false || name.startsWith(from '.) || name.startsWith(mport {))
                                el.setAttribute({ om .js'./panel: salin.j, ';

expor: cons, ALUR_PEME: IKSAAN = ', emeriksaan: klinis';
e, port const : LUR_SKRININ, = 'skrining';: const labelBag, an = LABE: _BAGIAN;
                                    , xport fun: tion buka, emeriksaanKli: is({ kunjungan, d, pasien, mode: onTutup, onSele, ai }) {
 const k: nfig = daftarLang, ah(mode), adaptor: = adaptorDrafServe, (kunjunganId, mode: === 'skrining' ? AL, R_SKRINING: : ALUR_PEME, IKSAAN);
 : et klinis =, null, kontek: = null, gala, Muat = null, keada: n = awalKeadaan(), , ndeks = 0: dikunjun, i = [0], tampilGalat : false, galat = null, }[name] || name, value === true && !name.startsWith(ull, fa) && !name.startsWith(an = fa) ? , s : String(value));
                        }
                        return el;
                    })());
        switch (l.id) {
            case 'anamnesis': {
                const keperawatanBerubah = adaPerubahanBagian('keperawatan', keadaan, server);
                return ((() => {
                    const tag = Kolom;
                    const props = {};
                    props.children = [((() => {
                            const tag = RingkasanSkriningDokter;
                            const props = { ...(dasar(KLINIS, GALAT)), LINIS, TAHA: server, N }, from;
                             || keperawatanBerubah, inis, Fav;
                            keperawatanBerubah, t, Klini;
                            () => {
                                setKeadaan(mulaiUbahKeperawatan);
                                setUbahKeperawatan(true);
                            }, platDto;
                        })), fro, () => {
                            setKeadaan((k) => ({ ...k, keperawatan: server.keperawatan }));
                            setUbahKeperawatan(false);
                        }];
                }));
            }
            case 'keperawatan': return ((() => {
                const tag = Kolom;
                const props = {};
                props.children = [((() => {
                        const tag = InfoKunjunganSkrining;
                        const props = { rt }, { BAGI: konteks };
                        if (typeof tag === N)
                            ;
                    })), from, isKu];
                return tag(props);
                const el = [inis, , Favori, Dto, Jen, sFa, orit, , linisKunju, ganDto, K, nteksK, inisDto, , unjung, nDto, , alinanKunjunganD,
                    o, TemplatDto];
            }, rom));
            case 'pemeriksaan': return ((() => {
                const tag = Kolom;
                const props = {};
                props.children = [((() => {
                        const tag = LangkahTandaVital;
                        const props = {
                            ...(dasar(AGIAN_KLINIS))
                        };
                        if (typeof tag === from)
                            nganDto,;
                        return tag(props);
                        const el = [, Fav, ritDto, JenisFa, ori, , Klin, sKunjungan, to, Konte, sKlini, Dto, Kunj, nganDt, , Sali, anKunjunganDto, , emplatDto];
                    })), from, ukOrderLab, galatO, , buat, rderLab, from, -lab';
import { GalatApi } fr, createElementNS(derLab, bentukOrderLab, gala, tag), document.createElement(tag)];
                for (const [name, value] of Object.entries(props)) {
                    if (name === ver)
                        ;
                }
                 || value === undefined || value === null;
                continue;
                if (name === bentukResep) {
                    el.append(...[value].flat(Infinity).filter(child => child !== false && child !== true && child !== null && child !== undefined));
                    continue;
                }
                if (name === t, seles) {
                    for (const [property, val] of Object.entries(value)) {
                        if (val === undefined || val === null)
                            continue;
                        const cssValue = typeof val === mport, { L };
                         && val !== om && !property.startsWith(na, { adaPerubahan, hapusDrafKlinis., ma } from '.. / , i / kotak - centang, po, i, port, { Peringatan, from, .js'../../util/draf-otomatis';
impor: , impor, }, { Kolom, Sebaris, }, from, gkah';
import { KonteksKlinis });
                        impor, { Tombol };
                        fr, m;
                        import {
  adaPerubahanBagian;
                        import { daPerubaha, hapusDr, fKlinisLama, } from dal, daftarLangkah,;
                        imp, rt;
                        {
                            useDraf, tomatis;
                        }
                        from, .. / .. / util / draf - , tomatis;
                        AB;
                        batasi;
                    }
                    fr, m;
                    rawatan, pakaiTemplat,;
                    mport;
                    {
                        K, nteksKl, nis;
                    }
                    fro, eadaan, statusRingkas;
                    impor, {
                        ada, erubah, nBagian, awal, eadaan, bagian, angkah, langk, hDraf, bagianDiMo, al,
                        daftarLangkah, disahkanDari, isiB, gian, keadaanAw, lForm, keadaa, : .includes(property) ? val + ulaiU : String(val), el, : .style.setProperty(property.startsWith(Simp) ? property : property.replace(san, sy, ratSelesai).replace(tambahD, c => is, +c.toLowerCase()), cssValue)
                    };
                }
                else if (name === nSalin) {
                    if (typeof value === ModePemerik)
                        value(el);
                    else
                        value.current = el;
                }
                else if (Narasi, La.test(name)) {
                    const capture = name.endsWith(LangkahR);
                    let event = name.slice(l, capture ? -a : undefined).toLowerCase();
                    if (event === ksaan)
                        od;
                    event = Keperawatan;
                    if (event === , Ringkas && el.tagName === from)
                        port { izinSaatIni } from;
                    im, ort;
                    {
                        L;
                        includes(el.type);
                        event = ngkah - pe;
                        if (event === kahResep && el.tagName === resep)
                            el;
                        imp;
                        event = gkasanOr;
                        el.addEventListener(event, value, capture);
                    }
                    if (name === ngan)
                        ;
                }
                from;
                ERIKSAAN = 'peme;
                el.
                    innerHTML = value.__html;
                if ([from, BEL_BAGIAN;
export function bukaPemeriksaanKlini,])
                    import { ombol, per, ngatan, le, cana } from fro, t konfig = daftarLangkah(mode), adaptor = ad;
                el[name === from];
                mode === 'skrining' ? ALUR_SKRINING : ALUR_PEMERIKSAAN);
 let klinis = null, kont;
                if (value !== false || name.startsWith(-keluar) || name.startsWith(PanelRi))
                    el.setAttribute({ l } - riwayat.j, als, impo, t, { bukaP: nelSa, in:  }, from, , favorit = [], a);
                e: port;
                const ALUR_PEMERI = false, ubahKeperawatan ;
                export const ALUR_SKRI = f = true, mo;
                c: nst;
                label, agian = LABEL;
                BAGIAN;
                ({ kunjunganId, pas: en, mode, onTutup, onSelesai }) => {
                    onst;
                    konfig = daft, rLangkah(mode), ad;
                    ptor = adaptorDrafS, rver(kunju, ganId, mode,  === eadaan(); }
                     ? ALUR_ : , KRINING, AL, R_PEMERIKSAAN);
                    let klinis = nu, l, konteks = null, alatMuat, ke, daan = awalKeadaan(), indeks = a, dikunjung;
                };
                [name] || name, value === true && !name.startsWith(s = fal) && !name.startsWith(rue, ha) ?  =  : String(value);
                ;
            }));
            case 'penunjang': return ((() => {
                const tag = Kolom;
                const props = {};
                props.children = [((() => {
                        const tag = HasilPenunjangKunjungan;
                        const props = {}, { BAGIAN_KLI: kunjunganId };
                        if (typeof tag ===  / shar)
                            return tag(props);
                        const el = [ritDt, , Jeni, Favorit, , Kli, isKunj, nganDto,
                            K, nteksKlin, sDto, , unjunganD, o, Sal, nanKun, unganDto,
                            Templa, Dto];
                    })), from, ab, bentukOrderLab, im, ort, { buat, rderL, b }, from, order-lab';
import { GalatApi } from '../../api-klien/klien.js';
import { adaptorDrafServer } from '../../api-klien/dra];
                for (const [name, value] of Object.entries(props)) {
                    if (name === from)
                        daan-farmasi.js';
import { buatResep, resepKunj;
                    continue;
                    if (name
                        === Resep, gala) {
                        el.append(...[value].flat(Infinity).filter(child => child !== false && child !== true && child
                            !== null && child !== undefined));
                        continue;
                    }
                    if (name === esaikanP) {
                        for (const [property, val] of Object.entries(value)) {
                            if (val === undefined || val === null)
                                continue;
                            const cssValue = typeof val === { Lencana } && val !== onen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol.js';
import { adaPerubahan,;
                            Peringatan;
                        }
                        from, ../../util/draf';
import { useDra;
                        import { Ko, om, Sebaris } from fro, -otomatis';
import { batasi } ;
                        mport;
                        {
                            To, bol;
                        }
                        from;
                        nis } from './konteks-klinis.js';
                        imp, rt;
                        {
                            adaPer, bahan, hap, sDrafKlin, sLama;
                        }
                        from, kah, langkahDraf, b;
                        import { seDrafOtomat, s } from anDari, isiBagian, keadaanAwa;
                        import { bata, i } from LABEL_BAGIAN, mulaiUba;
                        {
                            Konteks, linis;
                        }
                        from;
                        lasan, pulihkanKeadaa;
                        im, ort;
                        {
                            daPeruba, anBagi, n, awalKeadaa, ,
                                bagianLangka, , langkahDraf, bagianDiModal, d, ftarLangkah
                                , disah, anDari, isiBagian, , keadaanAwalForm, keadaanDariS;
                            includes(property) ? val + ahKep : String(val);
                            el.style.setProperty(property.startsWith(sa) ? property : property.replace(syaratSe, esaiTerpen).replace(hDiagnos, c => mbah + c.toLowerCase()), cssValue);
                        }
                    }
                    else if (name === an, Ke) {
                        if (typeof value === meriksaan)
                            ;
                    }
                    value(el);
                    value.current = el;
                }
                if (, LangkahA.test(name)) {
                    const capture = name.endsWith(ahRingkas);
                    let event = name.slice(g, capture ? -L : undefined).toLowerCase();
                    if (event === )
                        ;
                    import { Bag, event, watan, Info, if } from (event === kasanSkri && el.tagName === cana } from '../../kompo);
                    import { Langkah, includes } from (el.type);
                    event = penunjan;
                    if (event === ep)
                        ;
                }
                from && el
                    .tagName === ;
                import { event, OrderKun, el, addEventListener } from (event, value, capture);
            }));
            case .js'kesimpulan': return ((() => {
                const tag = Kolom;
                const props = {};
                props.children = [((() => {
                        const tag = LangkahDiagnosis;
                        const props = {
                            ...(dasar(BAGIAN_KLIN)), GALAT, K: favoritDari(LAYANAN)
                        }, f;
                    }))];
                if (typeof tag === e) {
                    BagianK;
                    return tag(props);
                    const el = [isKun, unganD, o, Konte, sKl, nisDto, Kunjungan, to, Salin, nKunju, ganDto, T, mplatD, o];
                }
                fr, m;
                tukOrderLab, galat;
                import { buatO, derLab, } from , -lab';
import { GalatApi } from;
                impo;
                includes(tag) ? document.createElementNS(erLab) : ;
            }));
            case 'terapi': return ((() => {
                const tag = Kolom;
                const props = {};
                props.children = [((() => {
                        const tag = LangkahTindakan;
                        const props = { ...(dasar(BAGIAN_KL)), S, GALAT };
                        if (typeof tag === type) {
                            Bagi;
                            return tag(props);
                            const el = [linis, unjung, nDto, Ko, tek, Klinis, to, Kunjun, anDto, Sa, inanKu, junganDto, Templ, tDto];
                        }
                    }, from)), Lab, bentukOrderL];
                import { bu, tOrder, ab } from f, om;
                an-order-lab';
import { GalatAp;
                i;
                includes(tag) ? document.createElementNS(OrderLab) : ;
            }));
            case 'tindak_lanjut': return ((() => {
                const tag = LangkahTindakLanjut;
                const props = { ...(dasar(IAN_KLINIS, GAL)) };
                if (typeof tag === '@klira/sh)
                    return tag(props);
                const el = [vorit, to, Je, isFavori, , K, inisKu, junganDto,, KonteksKl, nisDto, Kunjunga, Dto, S, linanK, njunganDto, Temp, atDto } from '@k, ira/sh, red';
                    , mport { bu, tOrde, Lab } fr, m '../.].includes(tag) ? document.createElementNS(ab, bentukOrderLab, galatOrd, tag) : document.createElement(tag);
                for (const [name, value] of Object.entries(props)) {
                    if (name === } from || value === undefined || value === null)
                        continue;
                    if (name === ukResep, ga) {
                        el.append(...[value].flat(Infinity).filter(child => child !== false && child !== true && child !== null && child !== undefined));
                        continue;
                    }
                    if (name === elesaika) {
                        for (const [property, val] of Object.entries(value)) {
                            if (val === undefined ||
                                val === null)
                                continue;
                            const cssValue = typeof val === t { Lenca && val !== .. && !property.startsWith(imp) && ![otakCentang } from '../.., komponen/ui/k, tak-centang.js';
impor, { Peringatan } fr, m '../../komponen/, i/peringa, an';
import { , olom, Sebaris } f, om '../../kom, onen/ui/s, sunan',
                                import { , ombol } from ', ./../kompone, /ui/tombol';
i, port { adaP, rubahan, h, pusDrafKl, nisLama } fr, m '../../util, draf';
import , useDrafOtom, tis } from '../, ./util/draf-otom, tis.js';
import { ba, asi } from ', ./../util/l, ngkah';
impo, t { Konte, sKlinis, } from '., konteks, klinis.js';
                                , mport {
                                , adaPeru, ahanBa, ian, awalKead, an, bagianLang, ah, langkahDr, f, bagianDiModal,, daftarLangkah, dis, hkanDari, isiBagia, , keadaanAwalFo, m, keadaanDar].includes(property) ? val + UbahK : String(val);
                            el.style.setProperty(property.startsWith(an, ) ? property : property.replace(syarat, elesaiTerp).replace(bahDiagn, c => tamb + c.toLowerCase()), cssValue);
                        }
                    }
                    else if (name === inan, ) {
                        if (typeof value === Pemeriksaan)
                            value(el);
                        else
                            value.current = el;
                    }
                    else if (si, Langka.test(name)) {
                        const capture = name.endsWith(gkahRingk);
                        let event = name.slice(a, capture ? -, : undefined).toLowerCase();
                        if (event === n';
import { B)
                            event = rawatan, In;
                        if (event === ngkasanSk && el.tagName === m './lan && ![eperawatan, ;
import, { Langk].includes(el.type))
                            event = h-penunj;
                        if (event === esep } fr && el.tagName === p';
import )
                            event = anOrderK;
                        el.addEventListener(event, value, capture);
                    }
                    else if (name === } from './hasil-penunjang)
                        el.innerHTML = value.__html;
                    else if ([.js'../.., komponen/modal, bertahap/, odal-dom.js';
im, ort { tomb, l, peringa, an, lencan, } from '., /../kompon, n/ui/native.js']
                        .includes(name))
                        el[name === '../../kompone ? izin-saj : name === rt { bukaPanelFav ? it } from  : name] = value;
                    else if (value !== false || name.startsWith(uarga.j) || name.startsWith(lRiwaya))
                        el.setAttribute({ wayat.js';
                            : mport {, bukaPanel: alin , from './p: nel-salin., s.js';

expor: const ALU, _PEMERIKSAA: = 'pemerik, aan-klinis';
e: port const ALU, _SKRINING: = 'skrini, g';
const: labelBagi, n = LABEL_BAG: AN;
export fun, tion bukaPemeri: saanKlinis({ kun, unganId, pasien,: mode, onTutup, on, elesai }) {
 cons: konfig = daftarLa, gkah(mode), adapto: = adaptorDrafServe, (kunjungan: d, mode ===, 'skrining': ? ALUR_SKRI, ING : ALUR_P: MERIKSAAN);
 , et klinis = null, : onteks = null, gala, Muat = nu: l, keadaa, = awalKeadaan(), ind: ks = 0, dikunjungi =  }[name] || name, value === true && !name.startsWith(false, ) && !name.startsWith(hasil ) ? ull : String(value));
                }
                return el;
            })());
            default:
                return (((() => {
                    const tag = LangkahRingkasan;
                    const props = {
                        im: keadaan, GIAN_K: ubah, GALAT, K: rencana, HAP_LAYA: statusBagian, lira/sha: bagianDiModal(mode), agianKlinis, : labelBagian, enisFavorit, : alasanPerlu, anDto, Kontek: bisaSelesai, unjunganDto, Sa: mode === unganDto, , emplatDto: selesaiDipilih, shared';
im: setSelesaiDipilih };
                    props.children = mode === ang';
impo && ((() => {
                        const tag = RingkasanOrderKunjungan;
                        const props = {}, { BAGIAN_KLI: kunjunganId, LIN: keadaan };
                        if (typeof tag === d)
                            fr;
                        return tag(props);
                        const el = [sFavo, it, Kl, nisKunju, gan, to, Ko, teksKlinis, to, Kunju,
                            ganDto, SalinanK, njunga, Dto, T, mplatDto];
                    }));
                    from,  / shared;
                    ';
                        , mport, buatO, derLab;
                })));
        }
    }
    ;
    async function kirim() {
        const { rencana, alasanPerlu, pilihSelesai, adaResepBaru } = derivees();
        const disahkan = klinis ? disahkanDari(klinis.bagian) : {};
        if (sedangMengirim)
            return;
        const galatObat = adaResepBaru ? Object.values(galatResep(keadaan.resep))[0] : undefined;
        if (galatObat) {
            setTampilGalat(true);
            setGalat(galatObat);
            pindah(konfig.findIndex((l) => l.id === 'terapi'));
            return;
        }
        if (keadaan.lab_dipilih && galatOrderLab(keadaan.order_lab)) {
            setTampilGalat(true);
            setGalat(galatOrderLab(keadaan.order_lab));
            pindah(konfig.findIndex((l) => l.id === 'penunjang'));
            return;
        }
        const masalah = rencana.findIndex((r) => r.galat);
        if (masalah >= 0) {
            setTampilGalat(true);
            setGalat(rencana[masalah].galat);
            const n = konfig.findIndex((l) => bagianLangkah(l).includes(rencana[masalah].bagian));
            pindah(n >= 0 ? n : konfig.length - 1);
            return;
        }
        if (alasanPerlu && !keadaan.alasan.trim()) {
            setGalat(KLINIS.galat.alasanPerbaikan);
            return;
        }
        setGalat(null);
        sedangMengirim = true;
        setMemproses(true);
        let labBerjalan = false;
        let resepBerjalan = false;
        let disimpan = 0;
        let pesanTagihan = null;
        let bagianBerjalan = null;
        try {
            for (const r of rencana) {
                bagianBerjalan = r.bagian;
                const h = await simpanBagian(kunjunganId, r.bagian, isiBagian(r.bagian, keadaan), disahkan[r.bagian] ? keadaan.alasan : undefined);
                if (h.tersimpan)
                    disimpan += 1;
                if (h.pesan_tagihan)
                    pesanTagihan = h.pesan_tagihan;
                adaTersimpan = adaTersimpan || h.tersimpan;
            }
            bagianBerjalan = null;
            if (keadaan.lab_dipilih) {
                labBerjalan = true;
                await buatOrderLab(kunjunganId, bentukOrderLab({ ...keadaan.order_lab, prioritas: 'rutin' }));
                labBerjalan = false;
                adaTersimpan = true;
                // Hapus draf order yang berhasil agar kegagalan tahap berikutnya tidak memesannya lagi.
                ubah({ lab_dipilih: false, order_lab: awalOrderLab() });
            }
            if (adaResepBaru) {
                resepBerjalan = true;
                await buatResep(kunjunganId, bentukResep(keadaan.resep));
                resepBerjalan = false;
                adaTersimpan = true;
                // Resep yang sudah dikonfirmasi tidak diajukan lagi bila tahap berikutnya gagal.
                ubah({ resep: awalResep() });
            }
            let kunjungan = (await ambilKlinis(kunjunganId)).kunjungan;
            if (pilihSelesai) {
                // Resep yang belum siap mengirim kunjungan ke farmasi (tahap resep); tanpa itu langsung ke kasir.
                const perluFarmasi = (await resepKunjungan(kunjunganId)).some((r) => r.status === 'diajukan' || r.status === 'ditelaah');
                kunjungan = await selesaikanPemeriksaan(kunjunganId, perluFarmasi ? 'resep' : 'kasir');
                adaTersimpan = true;
            }
            draf.hapus();
            setHasil({ jumlah: disimpan, kunjungan, pesanTagihan });
        }
        catch (e) {
            const pesan = e instanceof GalatApi ? e.message : GALAT.umum;
            setGalat(resepBerjalan ? `Penyimpanan pemeriksaan belum lengkap pada bagian resep. ${pesan}` : labBerjalan ? `Penyimpanan pemeriksaan belum lengkap pada bagian lab. ${pesan}` : bagianBerjalan ? `${KLINIS.gagalSebagian(labelBagian[bagianBerjalan])} ${pesan}` : pesan);
            // sebagian bagian mungkin sudah tersimpan: muat ulang agar keadaan pengesahan tampil benar
            void ambilKlinis(kunjunganId).then(setKlinis).catch(() => undefined);
            setTampilGalat(true);
        }
        finally {
            sedangMengirim = false;
            setMemproses(false);
        }
    }
    const salin = (s, pilih) => {
        const { keadaan: baru, jumlah } = salinKeKeadaan(keadaan, s, pilih, new Date());
        setKeadaan(baru);
        return jumlah;
    };
    const pakaiKode = (jenis, x) => {
        if (jenis === 'diagnosis')
            setKeadaan((k) => ({ ...k, diagnosis: tambahDiagnosis(k.diagnosis, x) }));
        else if (jenis === 'tindakan')
            setKeadaan((k) => ({ ...k, tindakan: tambahTindakan(k.tindakan, x, new Date()) }));
    };
    const pakaiTemplatCatatan = (t) => setKeadaan((k) => pakaiTemplat(k, t));
    function setHasil(h) { if (!aktif)
        return; hasil = h; nettoyer(); const el = document.createElement('div'), p = document.createElement('p'); p.textContent = mode === 'skrining' ? KLINIS.hasil.pesanSkrining : 'Pemeriksaan tersimpan dan disahkan.'; el.append(p, KLINIS.hasil.tahap, lencana(TAHAP_LAYANAN.label(h.kunjungan.tahap_layanan), TAHAP_LAYANAN.warna(h.kunjungan.tahap_layanan))); if (h.pesanTagihan)
        el.append(peringatan(h.pesanTagihan, 'kuning')); modal.hasil({ judul: mode === 'skrining' ? KLINIS.hasil.judul : 'Pemeriksaan tersimpan', isi: el, aksi: [tombol(KLINIS.hasil.tutup, tutup)] }); }
    function tutup() { aktif = false; panel?.tutup(); nettoyer(); draf.tutup(); modal.tutup(); (adaTersimpan || hasil ? onSelesai : onTutup)(); }
    function setPanel(jenis) { panel?.tutup(); panel = undefined; const props = { onTutup() { panel = undefined; } }; if (jenis === 'riwayat')
        panel = bukaPanelRiwayat({ ...props, pasienId: pasien.id, nama: pasien.nama, kecualiKunjunganId: kunjunganId }); if (jenis === 'salin')
        panel = bukaPanelSalin({ ...props, kunjunganId, pasienId: pasien.id, onSalin: salin }); if (jenis === 'keluarga')
        panel = bukaPanelKeluarga({ ...props, pasienId: pasien.id, nama: pasien.nama }); if (jenis === 'favorit' && izinSaatIni()('klinis', 'input'))
        panel = bukaPanelFavorit({ ...props, k: keadaan, favorit, onFavorit: setFavorit, onPakaiKode: pakaiKode, onPakaiTemplat: pakaiTemplatCatatan }); }
    function header() {
        return ((() => {
            const tag = n } fr;
            const props = { on-pasien';: import { BAGIAN_KLINIS, G, LAT, K: INIS, T, HAP_LAYANAN : from '@klira/shar };
            props.children = [((() => {
                    const tag = TombolIkonPasien;
                    const props = {
                        impor: { BAGIAN, KLINIS, KLINIS, : .tombol.riwayat, AYANAN }, from, ared';
import { buatOrderLab } from '../../api-klien/penunjang.js';
impo: , if(, tag) { }
                    } === KonteksKli;
                    return tag(props);
                    const el = [
                        nDto, , Templa, Dto];
                })), fr, m, ../../api-klien/kl, im,
                ort, { bua, OrderL, b }, from, .. / .. / , pi - kli, n / penunjang, li, im, ort, { awalOrderL, b, ben, ukOrde, Lab, galat, rderL, b }, from, from './keadaan-farmasi ? document.createElementNS(). / .. / api - klien / klien : , kl, impor, tag,
                document.createElement(tag)];
            for (const [name, value] of Object.entries(props)) {
                if (name === Resep || value === undefined || value === null)
                    continue;
                if (name === .. / .. / api - k) {
                    el.append(...[value].flat(Infinity).filter(child => child !== false && child !== true && child !== null && child !== undefined));
                    continue;
                }
                if (name === .. / .. / ga) {
                    for (const [property, val] of Object.entries(value)) {
                        if (val === undefined || val === null)
                            continue;
                        const cssValue = typeof val === n / ui / kota && val !== i && !property.startsWith(import { KonteksKlinis } from );
                        imp, rt;
                        {
                            Kolom, S, baris;
                        }
                        from;
                        PerubahanBagian, awalKeadaan, ;
                        import { Tombol, } from f, bagianDiModal, daftarLangk;
                        adaPerubahan, hapusDra, Klinis, ama;
                    }
                    from, ariServer, LABEL_BA;
                    import { useDrafOtomati, } from emplat, perluAlasan, pulihkanK;
                    import { atasi } from , .. / .. / util / lan, kah;
                    ng;
                    {
                        KonteksKlinis, ;
                    }
                    from;
                    tambahDiagnosis, ta;
                    adaPeruba, anBagian, a, alKeadaan, b, gianLangk, h, lang, ahDraf, b, gianDiM, dal, daft, rLangkah, disahka, Dari, , siBagian, kea, aanAwalForm, k, adaanDariServ, r, LABEL_BAGIAN, , ulaiUbahKeperawata, , pakaiTemplat, pe, luAlasan, pulih, anKeadaan, re;
                    includes(property) ? val + stat : String(val);
                    el.style.setProperty(property.startsWith(kan) ? property : property.replace());
                    import t, {} from pe;
                    {
                        Bagia;
                        replace(KeadaanP, c => saan + c.toLowerCase()), cssValue;
                        ;
                    }
                }
                else if (name === hNaras) {
                    if (typeof value === gkahDiagnos)
                        value(el);
                    else
                        value.current
                            = el;
                }
                else if (ital, Lang.test(name)) {
                    const capture = name.endsWith(emeriksaa);
                    let event = name.slice(a, capture ? -u : undefined).toLowerCase();
                    if (event === ngkah - keperawa)
                        event = ort;
                    {
                        Langk;
                        if (event === angkah - pe && el.tagName === Langkah && ![])
                            ;
                    }
                    from;
                    elRiwayat } from .js'./;
                    i;
                    includes(el.type);
                    event = gan;
                }
                fr;
                if (event === unjungan)
                    ERIKSAAN = 'pemeriksaan-klinis';;
                event = rom;
                = 'skr;
                el.addEventListener(event, value, capture);
            }
            if (name === odal - bertahap / modal - dom.js)
                el.innerHTML = value.__html;
            else if ([adaptorDrafServer(kunjunganId, , i, port, { izinSaatI, i }, from, NING : ALUR_PEMERIKSAAN);
 let kl, imp, rt, { bukaP, nelFavorit }, fr].includes(name))
                el[name === rt];
            {
                bukaPanelK ? uarga : ;
            }
            name === el - keluarga.js;
            = ? port : ;
            {
                buk: name;
                value;
                if (value !== false || name.startsWith(from, m = false, ubahKeperawatan = fal, el.setAttribute({ N = , modal, panel, enfants, exp: rt, co, st, ALUR_SK: INING = atis({ adapt, c: nst, labelB, gian = LABE, _BAGIAN, ex, ort, function: b, kaPemeriksaanK, inis({ ku: junganId, pasien, m: de, onTut, p, onSelesai:  }) {
                        const kon, ig = daftarLang, ah;
                        (mode), adapto,  = adaptorDrafSe;
                        ver(kunjunganId, ode === mode, klinis.bagian) : awalKeadaan(); }
 function autosave() { draf.perbarui({ adaptor, nilai: keadaan, awal: initial(), langkah: indeks, aktif: formSiap && !hasil }); }
 function pulihkan() { if (!aktif || !klinis || !draf.keadaan.siap || formSiap) return; const p = draf.keadaan.pulihan; keadaan = p ? pulihkanKeadaan(initial(), p.nilai) : initial(); indeks = p ? batas);
                    }, return: el })()), mode === nfig.lengt && ((() => {
                    const tag = TombolIkonPasien;
                    const props = {
                        import: KLINIS
                            .tombol.salin, AT, KLIN: S, TAH, P_LAYAN: { padding:  }, a
                    } / shared;
                    eadaan) : v; autosave(); paint(); }, setUbahKeperaw;
                    const tag = n;
                })), fr, )
                    const props = { on } - pasi, n, nD, mport;
            }
            {
                AGIA, _KLINIS;
                {
                    width: KLI, height;
                    P_L, flexShrink;
                    rderLab;
                }
                from;
                = v; updat;
                import t, {} from pe;
                {
                    B: gianKl, nis, Fav;
                    ritDto, JenisF, vorit, Klinis;
                    unjun, anDto, KonteksK;
                    inisDto, KunjunganDto, S;
                    linanKu, junganDto, Te;
                    platDt;
                }
                ;
                props.children = [
                    ((() => {
                        const tag = n;
                    })), fro
                ];
                const props = { n } - p, sie;
                t;
                {
                    ;
                    mpo, t;
                    {
                        BAG: AN_K, INIS, GA;
                        AT, , LINI;
                        T;
                    }
                    ;
                    if (typeof tag === ared)
                        at;
                    impo;
                    return tag(props);
                    const el = [enisF, vorit, , KlinisKu, jun, anDto, , KonteksKli, isDto, Ku, jungan, to, Salin, nKunju, ganDto, TemplatDto];
                }
            }
            mode === hu: false  && ((() => {
                const tag = TombolIkonPasien;
                const props = {
                    import: KLINIS.tombol.favorit, KLINIS: TAHAP, LAYANAN: { padding: li }, shared, on: () => setPanel(gianKlini), FavoritDto,
                }((() => {
                    const tag = n;
                })), fr;
                const props = { on } - pasi, n, mport;
            }, { AGIA, _KLINIS: { width: KLI, height: P_L, flexShrink: , Lab }, from, => r.bagian ==: , import: t, }));
            { }
            from;
            pe;
            {
                B: gianKl, nis, Fav;
                ritDto, JenisF, vorit, Klinis;
                unjun, anDto, KonteksKl;
                nisDto, , KunjunganDto, ;
                Salina;
            }
            ;
            props.children = ((() => {
                const tag = n;
            }));
            fro;
            const props = {
                n
            } - p, sien;
            i - ;
            import { BAGIAN_KLINIS, GALAT, KLINIS, TAHAP_LAYANAN } from atOrderL;
            if (typeof tag === ianKlinis, )
                return tag(props);
            const el = [nganD, o, Kon, eksKlini, Dto, Kunju, ganDto, Sa, inanKunju, ganDto, TemplatD, o];
        }));
    }
    modal = bukaModalBertahap({ judul: mode === 'skrining' ? KLINIS.judulSkrining : KLINIS.judul, langkah: konfig.map((l, n) => ({ id: l.id, judul: l.judul, isi: () => { nettoyer(); const node = isiLangkah(l); enfants.push(node); return node; }, selesai: () => { const disahkan = klinis ? disahkanDari(klinis.bagian) : {}, { rencana, galatDi } = derivees(); return bagianLangkah(l).some(b => disahkan[b]) && bagianLangkah(l).every(b => !rencana.some(r => r.bagian === b) && !galatDi(b)) && dikunjungi.includes(n) && indeks !== n; } })), onIndeks(n) { galat = null; indeks = n; if (!dikunjungi.includes(n))
            dikunjungi.push(n); autosave(); update(); }, konteks: () => KonteksKlinis({ konteks, nama: pasien.nama, nomorRm: pasien.nomor_rm }), aksiHeader: header(), onTutup: tutup, lindungiTutup: () => formSiap && adaPerubahan(initial(), keadaan), onLanjut(dari) { const g = derivees().rencana.find(r => bagianLangkah(konfig[dari]).includes(r.bagian) && r.galat)?.galat; if (g) {
            tampilGalat = true;
            galat = g;
            paint();
            return false;
        } galat = null; return true; }, labelKirim: KLINIS.tombol.simpan, onKirim() { if (!memproses)
            void kirim(); } });
    if (!document.querySelector('link[data-klinis-css]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = new URL('./pemeriksaan-klinis.css', import.meta.url).href;
        link.dataset.klinisCss = '';
        document.head.append(link);
    }
    hapusDrafKlinisLama();
    update();
    Promise.all([ambilKlinis(kunjunganId), ambilKonteksKlinis(kunjunganId), daftarFavorit().catch(() => [])]).then(([k, c, f]) => { if (aktif) {
        klinis = k;
        konteks = c;
        favorit = f;
        pulihkan();
        paint();
    } }).catch(e => { if (aktif) {
        galatMuat = e instanceof GalatApi ? e.message : KLINIS.konteks.gagal;
        paint();
    } });
    return { tutup() { aktif = false; panel?.tutup(); nettoyer(); draf.tutup(); modal.tutup(); } };
}
