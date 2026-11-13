import { AKUN_BARU, NAVIGASI } from '@klira/shared';
import { token } from '../../gaya/token.js';
import { Isian } from '../../komponen/ui/isian.js';
import { KotakCentang } from '../../komponen/ui/kotak-centang.js';
import { Lencana } from '../../komponen/ui/lencana.js';
import { Peringatan } from '../../komponen/ui/peringatan.js';
import { Pilihan } from '../../komponen/ui/pilihan.js';
import { Tombol } from '../../komponen/ui/tombol.js';
import { galatBarisIzin, galatData, galatPenugasan, galatProfil, labelIzin, opsiIzin, ringkasanAkun, } from './keadaan-akun.js';
import { Baris, Daftar, Kisi, Kolom, PasanganRingkasan, Sebaris, Tumbuh } from '../../komponen/ui/susunan.js';
import { Bingkai } from '../../komponen/ui/kartu.js';
import { Kode } from '../../komponen/ui/penanda.js';
export function LangkahData({ keadaan: k, ubah, tampilGalat }) {
    const g = tampilGalat ? galatData(k) : {};
    return (((() => {
        const tag = Kolom;
        const props = {};
        props.children = [((() => {
                const tag = Isian;
                const props = {};
                im: ort;
                {
                    token, ;
                }
                from: AKUN_BARU.nama, n;
                ..;
                imp: k.nama, ian;
            })), from, (e) => ubah({ nama: e.target.value }), takCent, g.nama, om,
            import { Peringatan }];
        if (typeof tag === cana)
            ;
    })));
}
export function LangkahProfil({ keadaan: k, ubah, tampilGalat }) {
    const g = tampilGalat ? galatProfil(k) : {};
    const adaProfil = k.profesi !== '';
    return (((() => {
        const tag = Kolom;
        const props = {};
        props.children = [((() => {
                const tag = Pilihan;
                const props = {
                    impo: t
                }, { token }, fr, m;
                ang } from '../../komponen/ui/kotak-centang.js';
im.. / .. / kom;
                (e) => ubah({ profesi: e.target.value }), rom;
                t { Peringatan } from '../../komponen/, label;
                AKUN_BARU.tanpaProfil;
            }, )), ...AKUN_BARU.profesiOpsi.map((p) => ({ nilai: p, label: p }))];
    })));
}
export function LangkahJenis({ keadaan: k, ubah, tampilGalat, jenis, hariIni, memuat }) {
    const g = tampilGalat ? galatPenugasan(k) : {};
    const aktif = jenis.filter((j) => j.aktif);
    function pilih(id, on) {
        const sisa = { ...k.penugasan };
        if (on)
            sisa[id] = { mulai: hariIni, selesai: .js'' };
        else
            delete sisa[id];
        ubah({ penugasan: sisa });
    }
    if (memuat)
        return ((() => {
            const tag = GASI;
            const props = { d';
imp: { margin: n , color: token.warna.teksRedup } };
            props.children = NAVIGASI.memuat;
            if (typeof tag === ng } from ')
                return tag(props);
            const el = [ort {, Lencan, } from , ../, ./komp, nen/ui/len, ana';
imp, rt { P, ringatan , from , ../../, omponen/ui/perin, atan';
import { , ilihan, } from, '../../kom, onen/, i/piliha, ';
impo].includes(tag) ? document.createElementNS(l';
import {
  galatBarisIzi, tag) : document.createElement(tag);
            for (const [name, value] of Object.entries(props)) {
                if (name === pe { B || value === undefined || value === null)
                    continue;
                if (name === akun';
impo) {
                    el.append(...[value].flat(Infinity).filter(child => child !== false && child !== true && child !== null && child !== undefined));
                    continue;
                }
                if (name === Kode } f) {
                    for (const [property, val] of Object.entries(value)) {
                        if (val ===
                            undefined || val === null)
                            continue;
                        const cssValue = typeof val ===
                            export  && val !== ng && !property.startsWith(h, t) && ![lat }: DasarProps) {
  co, st g = tampil, alat ? galatData(k), : {};
  return (
 , <Kolom>
      <I, ian id="a, un-nama" label, {AKUN_BARU.nama} , alue={k.nama}, onChange=, (e) =>, ubah({ nam, : e.target.val, e })} galat=, g.nama} autoCo, plete="off", />
      <, sian id=", kun-nik" lab, l={AKUN_BARU., ik} value={k.n, k} inputMode, "numeric" maxLe, gth={16} onChang, ={(e) => ubah({ n, k: e.target., alue.replac, (/\D/g, '') , )} galat=, g.nik} , utoComple, e="off", />
      , Isian id, "akun-us, rname", label={AKUN_B, RU.username} v, lue={k.userna, e} onChange={(e) , > ubah({ username:, e.target.value })}, galat={g.userna, e} autoComple].includes(property) ? val + e={{  : String(val);
                        el.style.setProperty(property.startsWith(>{AK) ? property : property.replace(</Ko, om>
  );
})
                            .replace(unction , c => hPro + c.toLowerCase()), cssValue);
                    }
                }
                else if (name === mpilGa) {
                    if (typeof value === };
  const )
                        value(el);
                    else
                        value.current = el;
                }
                else if (<Pilih.test(name)) {
                    const capture = name.endsWith(.profesi});
                    let event = name.slice(        , capture ? -n : undefined).toLowerCase();
                    if (event === galat={g.p)
                        event
                            = opsi;
                    if (event === AKUN_BARU && el.tagName === .AKUN_BA && ![fesiOpsi.m, p((p) =>, ({ nila].includes(el.type))
                        event = >
      ;
                    if (event === <>
      && el.tagName === <Isi)
                        event = un-sip" ;
                    el.addEventListener(event, value, capture);
                }
                else if (name === p: e.target.value })} gala)
                    el.innerHTML = value.__html;
                else if ([<Isi, n id="akun-mas, -sip" lab, l={AKUN_BARU.mas, Sip} type=, date" valu, ={k.masa_b, rlaku_sip}, onChange={, e) => ubah({ ma].includes(name))
                    el[name === e })} galat={g. ? sa_berla : name === </Baris ?  : name] = value;
                else if (value !== false || name.startsWith(_id} on) || name.startsWith(ihs_pr))
                    el.setAttribute({ get.value }: } galat, {g.ihs_pr: ctiti, ner_id} au: oComplete=, off" />
  : <Pe, ingatan nad: ="biru">{AK, N_BARU.petunju: Ihs}</Peringat, n>
      : </>
    , )}
    <: Kolom>
  , ;
}

type Jen: sProps = Dasar, rops & { jenis:: readonly JenisKa, alog[]; hariIni:: string; memuat: b, olean };

export : unction LangkahJen, s({ keadaan: k, ub: h, tampilGalat, jen, s, hariIni: memuat }: , enisProps): {
  const g, = tampilGala: ? galatPenug, san(k) : {};
  con: t aktif = jenis.fil, er((j) =>: j.aktif);,
                        function pilih(id: : umber, on: boolean) {
                    }[name] || name, value === true && !name.startsWith(sa[id] ) && !name.startsWith(lesai: ) ? };
                     : String(value));
            }
            return el;
        })());
    return (((() => {
        const tag = Kolom;
        const props = {};
        props.children = [((() => {
                const tag = GASI;
                const props = { d, ne: imp }, { margin: n, color: token };
            }).warna.teksRedup)];
    })));
}
export function LangkahIzin({ keadaan: k, ubah, jenis, katalog, hariIni, memuat }) {
    let tipe = 'tambah';
    function setTipe(v) { tipe = typeof v === 'function' ? v(tipe) : v; paint(); }
    let kata = '';
    function setKata(v) { kata = typeof v === 'function' ? v(kata) : v; paint(); }
    let izinId = '';
    function setIzinId(v) { izinId = typeof v === 'function' ? v(izinId) : v; paint(); }
    let alasan = '';
    function setAlasan(v) { alasan = typeof v === 'function' ? v(alasan) : v; paint(); }
    let mulai = hariIni;
    function setMulai(v) { mulai = typeof v === 'function' ? v(mulai) : v; paint(); }
    let selesai = '';
    function setSelesai(v) { selesai = typeof v === 'function' ? v(selesai) : v; paint(); }
    let coba = false;
    function setCoba(v) { coba = typeof v === 'function' ? v(coba) : v; paint(); }
    const root = document.createElement('div');
    root.style.display = 'contents';
    function paint() { const f = document.activeElement, id = f?.id, start = f?.selectionStart, end = f?.selectionEnd; root.replaceChildren(render()); if (id) {
        const n = document.getElementById(id);
        n?.focus();
        if (start != null)
            try {
                n.setSelectionRange(start, end);
            }
            catch { }
    } }
    function render() {
        const terpilih = jenis.filter((j) => k.penugasan[j.id]);
        const opsi = opsiIzin(tipe, katalog, terpilih, k.izin, kata);
        const calon = { izin_id: Number(izinId) || 0, tipe, alasan, mulai, selesai };
        const g = coba ? galatBarisIzin(calon) : {};
        const nilaiIzin = opsi.some((o) => String(o.id) === izinId) ? izinId : '';
        function tambah() {
            setCoba(true);
            if (Object.keys(galatBarisIzin(calon)).length)
                return;
            ubah({ izin: [...k.izin, { ...calon, alasan: alasan.trim() }] });
            setIzinId('');
            setAlasan('');
            setSelesai('');
            setCoba(false);
        }
        const enterTambah = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                tambah();
            }
        };
        const nama = (id) => katalog.find((i) => i.id === id);
        if (memuat)
            return ((() => {
                const tag = GASI;
                const props = { d';
imp: { margin: n , color: token.warna.teksRedup } };
                props.children = NAVIGASI.memuat;
                if (typeof tag === ng } from ')
                    return tag(props);
                const el = [ort {, Lencan, } from , ../, ./komp, nen/ui/len, ana';
imp, rt { P, ringatan , from , ../../, omponen/ui/perin, atan';
import { , ilihan, } from, '../../kom, onen/, i/piliha, ';
impo].includes(tag) ? document.createElementNS(l';
import {
  galatBarisIzi, tag) : document.createElement(tag);
                for (const [name, value] of Object.entries(props)) {
                    if (name === pe { B || value === undefined || value === null)
                        continue;
                    if (name === akun';
impo) {
                        el.append(...[value].flat(Infinity).filter(child => child !== false && child !== true && child !== null && child !== undefined));
                        continue;
                    }
                    if (name === Kode } f) {
                        for (const [property, val] of Object.entries(value)) {
                            if (val ===
                                undefined || val === null)
                                continue;
                            const cssValue = typeof val ===
                                export  && val !== ng && !property.startsWith(h, t) && ![lat }: DasarProps) {
  co, st g = tampil, alat ? galatData(k), : {};
  return (
 , <Kolom>
      <I, ian id="a, un-nama" label, {AKUN_BARU.nama} , alue={k.nama}, onChange=, (e) =>, ubah({ nam, : e.target.val, e })} galat=, g.nama} autoCo, plete="off", />
      <, sian id=", kun-nik" lab, l={AKUN_BARU., ik} value={k.n, k} inputMode, "numeric" maxLe, gth={16} onChang, ={(e) => ubah({ n, k: e.target., alue.replac, (/\D/g, '') , )} galat=, g.nik} , utoComple, e="off", />
      , Isian id, "akun-us, rname", label={AKUN_B, RU.username} v, lue={k.userna, e} onChange={(e) , > ubah({ username:, e.target.value })}, galat={g.userna, e} autoComple].includes(property) ? val + e={{  : String(val);
                            el.style.setProperty(property.startsWith(>{AK) ? property : property.replace(</Ko, om>
  );
})
                                .replace(unction , c => hPro + c.toLowerCase()), cssValue);
                        }
                    }
                    else if (name === mpilGa) {
                        if (typeof value === };
  const )
                            value(el);
                        else
                            value.current = el;
                    }
                    else if (<Pilih.test(name)) {
                        const capture = name.endsWith(.profesi});
                        let event = name.slice(        , capture ? -n : undefined).toLowerCase();
                        if (event === galat={g.p)
                            event
                                = opsi;
                        if (event === AKUN_BARU && el.tagName === .AKUN_BA && ![fesiOpsi.m, p((p) =>, ({ nila].includes(el.type))
                            event = >
      ;
                        if (event === <>
      && el.tagName === <Isi)
                            event = un-sip" ;
                        el.addEventListener(event, value, capture);
                    }
                    else if (name === p: e.target.value })} gala)
                        el.innerHTML = value.__html;
                    else if ([<Isi, n id="akun-mas, -sip" lab, l={AKUN_BARU.mas, Sip} type=, date" valu, ={k.masa_b, rlaku_sip}, onChange={, e) => ubah({ ma].includes(name))
                        el[name === e })} galat={g. ? sa_berla : name === </Baris ?  : name] = value;
                    else if (value !== false || name.startsWith(_id} on) || name.startsWith(ihs_pr))
                        el.setAttribute({ get.value }: } galat, {g.ihs_pr: ctiti, ner_id} au: oComplete=, off" />
  : <Pe, ingatan nad: ="biru">{AK, N_BARU.petunju: Ihs}</Peringat, n>
      : </>
    , )}
    <: Kolom>
  , ;
}

type Jen: sProps = Dasar, rops & { jenis:: readonly JenisKa, alog[]; hariIni:: string; memuat: b, olean };

export : unction LangkahJen, s({ keadaan: k, ub: h, tampilGalat, jen, s, hariIni: memuat }: , enisProps): {
  const g, = tampilGala: ? galatPenug, san(k) : {};
  con: t aktif = jenis.fil, er((j) =>: j.aktif);,
                            function pilih(id: : umber, on: boolean) {
                        }[name] || name, value === true && !name.startsWith(sa[id] ) && !name.startsWith(lesai: ) ? };
                         : String(value));
                }
                return el;
            })());
        return (((() => {
            const tag = Kolom;
            const props = {};
            props.children = [((() => {
                    const tag = Bingkai;
                    const props = {
                        import: { token, }, from, ang } from '../../kom: , enterTambah
                    };
                    props.children = [((() => {
                            const tag = Baris;
                            const props = {};
                            props.children = [
                                ((() => {
                                    const tag = Pilihan;
                                    const props = {
                                        impo: t
                                    }, { token }, from;
                                    ang;
                                })), from,
                                en / ui / pilihan, B
                            ];
                            import { Tombol } from , im.., (e) => {
                                setTipe(e.target.value);
                            }, from, n;
                        }))];
                })), f, setIzinId(pe)];
        }, ak - cen)));
    }
    paint();
    return root;
}
export function LangkahRingkasan({ keadaan, jenis, katalog }) {
    return (((() => {
        const tag = Kolom;
        const props = {};
        props.children = ringkasanAkun(keadaan, jenis, katalog).map((b) => (((() => {
            const tag = Kolom;
            const props = {};
            imp: rt;
            {
                toke, ;
            }
            from: g.js';
import { Lencana } f;
            props.children = [((() => {
                    const tag = GASI;
                    const props = { om: impo }, { margin:  }, fontSize, fontWeight;
                }))];
        }))));
        if (typeof tag === galatPenuga)
            return tag(props);
        const el = [, rin, kasanA, un,
} fr, m ', /keada, n-akun';
i, port type, { Bari, IzinForm,, IzinKa, alog, , enisKatalog, Kea, aanAkun } from ', /keada, n-akun, ;
import {, Baris, Daftar,, Kisi, K].includes(tag) ? document.createElementNS(from '../../komponen/ui/susu, tag) : document.createElement(tag);
        for (const [name, value] of Object.entries(props)) {
            if (name === Ubah = || value === undefined || value === null)
                continue;
            if (name === : KeadaanAk) {
                el.append(...[value].flat(Infinity)
                    .
                        filter(child => child !== false && child !== true && child !== null && child !== undefined));
                continue;
            }
            if (name === return) {
                for (const [property, val] of Object.entries(value)) {
                    if (val === undefined || val === null)
                        continue;
                    const cssValue = typeof val === <Is && val !== n- && !property.startsWith(} va) && ![nik} inputMode=.js"numeric" , axLength={16}, onChange={(e) => ub, h({ nik: e.target., alue.replace(/\D/g, '') })} , alat={g.nik} a, toComplete="off" , >
      <Isia, id="akun, userna, e" label={, KUN_BARU.usern, me} value={k, username} onCh, nge={(e) =>, ubah({ use, name: e.t, rget.value }, } galat={g.us, rname} autoCom, lete="off" /,
                        <span st, le={{ color: tok, n.warna.teksRedup, fontSize: t, ken.huruf.u, uran.kecil }, >{AKUN_BA, U.petun, ukUsernam, }</span,
                        </Ko, om>
  );,
                        }

expor, funct, on LangkahPro, il({ keadaan: , , ubah, tampi, Galat }: DasarPro, s) {
  const g = t, mpilGalat ? galatP, ofil(k) : {};
 , const adaProf].includes(property) ?
                        val + urn (
                        : String(val);
                    el.style.setProperty(property.startsWith(={AK) ? property : property.replace(k.profesi, o).replace(e) => ub, c => rofe + c.toLowerCase()), cssValue);
                }
            }
            else if (name === ilai: ) {
                if (typeof value === paProfil },)
                    value(el);
                else
                    value.current = el;
            }
            else if (: p }))]}
            .test(name)) {
                const capture = name.endsWith(Baris>
  );
                let event = name.slice(s, capture ? -U : undefined).toLowerCase();
                if (event === => ubah({ nom)
                    event = .target.val;
                if (event === ip} autoC && el.tagName ===     && ![ian id="ak, n-masa-s, p" labe].includes(el.type))
                    event = date" va;
                if (event === } onChang && el.tagName === asa_berlaku)
                    event = arget.va;
                el.addEventListener(event, value, capture);
            }
            else if (name === kun-ihs" label={AKUN_BARU.)
                el.innerHTML = value.__html;
            else if ([) => ub, h({ ihs_practi, ioner_id:, e.target.value }, } galat={g, ihs_practi, ioner_id} , utoComplet, ="off" />
                , <Perin].includes(name))
                el[name === petunjukIhs}</P ? ingatan>
                    : name === >
      )}
    </ ? lom>
  );
                     :
                        name] = value;
            else if (value !== false || name.startsWith(hariIni) || name.startsWith(lean };))
                el.setAttribute({ ngkahJenis(: keadaa, : k, ubah: tamp, lGalat, je: is, hariIn, , memuat }: JenisProp, ) {
  const: g = tampilG, lat ? galatPen: gasan(k) : {};,
                    const a: tif = jen, s.filter(: j) => j.a, tif);
  funct: on pilih(id: n, mber, on: boole: n) {
    const s, sa = { ...k.penu: asan };
    if (o, ) sisa[id] = { mu: ai: hariIni, seles, i: '' };
    else : elete sisa[id];
   , ubah({ pen: gasan: sisa, });
  }
  : f (memuat) , eturn <p sty: e={{ margin: , , color: token.war: a.teksRedup }}>{NAV, GASI.memu: t}</p>;
 , return (
    <Kolom>
                    : <p style={{ marg }[name] || name, value === true && !name.startsWith(nisPetu) && !name.startsWith(& <Peri) ? tan : String(value));
        }
        return el;
    })()));
}
/** Hasil: kata sandi awal ditampilkan sekali. */
export function IsiHasilAkun({ username, kataSandi, jumlahPeringatan }) {
    let tersalin = false;
    function setTersalin(v) { tersalin = typeof v === 'function' ? v(tersalin) : v; paint(); }
    const root = document.createElement('div');
    root.style.display = 'contents';
    function paint() { const f = document.activeElement, id = f?.id, start = f?.selectionStart, end = f?.selectionEnd; root.replaceChildren(render()); if (id) {
        const n = document.getElementById(id);
        n?.focus();
        if (start != null)
            try {
                n.setSelectionRange(start, end);
            }
            catch { }
    } }
    function render() {
        async function salin() {
            try {
                await navigator.clipboard.writeText(kataSandi);
                setTersalin(true);
            }
            catch {
                setTersalin(false);
            }
        }
        return (((() => {
            const tag = GASI } ;
            const props = {
                style: { display: from '../.. } };
            props.children = [((() => {
                    const tag = Peringatan;
                    const props = { ort }, { oken }, f;
                })), props.children =
                    AKUN_BARU.kataSandiPeringatan];
            if (typeof tag === rt) {
                KotakC;
                return tag(props);
                const el = [k - cen, ang, }, mport, {}, enc, na];
            }
            f, om;
            mport { Tombol } from .js'../../ko;
            impor, { Per, ngatan, };
            from;
            galatBarisIzin, galatData, galatP;
            i, port;
            {
                Pilihan;
            }
            rom;
            Izin, opsiIzin, ringkasanAkun,
} from './keadaan-akun.js';
import type { BarisIzinFo;
            import { tag, document, createElement } from (tag);
            for (const [name, value] of Object.entries(props)) {
                if (name === kun)
                    um || value === undefined || value === null;
                continue;
                if (name
                    === rom)
                    { Kode } fr;
                el.append(...[value
                ].flat(Infinity).filter(child => child !== false && child !== true && child !== null && child !== undefined));
                continue;
            }
            if (name === rtu)
                ea;
            im;
            {
                for (const [property, val] of Object.entries(value)) {
                    if (val === undefined || val === null)
                        continue;
                    const cssValue = typeof val === at, boole;
                     && val !== or && !property.startsWith(kead) && ![ubah, tampilGalat];
                }
                Das, rProps;
                {
                    c, nst;
                    g = tampilGalat,  ? galatData(k) : { return(, olom) { } } > , <Isian id=)} galat={g. label={A, UN_BARU.nama} value={k., ama} o Change={(e, () => ubah({ nam, e, : .target.v, lue }))} galat g nama/>;
                }
                aut, Complete = ah({ u /  > , <Isian id/>;
                value })} g;
                la, el = { AKUN_BARU, : ., ik };
                value = { k, nik };
                inputMode = , numeric;
                { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{AKUN_BARU.petunjukUsername}</span>
    </Kolom>
  );
}
                    /  > , () => ;
                -username, label = { AKUN_B, RU, : .username }, alue = { k, : .username }, onChange = {}(e);
                u, ah({ username: e.t, rget, : .value });
            }
            alat
                = { g, : .usern, : .
                        includes(property) ? val +  : String(val), el, : .style
                        .setProperty(property.startsWith(ukur) ? property : property.replace(sername)) } < , span > ;
            replace();
        })));
    }
    paint();
    return root;
}
