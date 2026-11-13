import { bidang as bidangNative, tombol as tombolNative } from '../../komponen/ui/native.js';
import { PencarianWilayah, tampilkanNamaWilayah } from '../../komponen/pencarian-wilayah.js';
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
const teksRedup = { margin: 0, color: token.warna.teksRedup };
const opsiDari = (daftar) => [{ nilai: '', label: REGISTRASI.pilih }, ...daftar.map((o) => ({ nilai: o, label: o }))];
/** Bidang identitas utama untuk pendaftaran dan deteksi duplikat. */
function BidangKunci({ keadaan: k, ubah, galat, tampilGalat, awalan }) {
    const g = (b) => (tampilGalat ? galat[b] : undefined);
    return (((() => {
        const tag = gNative;
        const props = { style: { display: komponen/ui } };
        props.children = [((() => {
                const tag = Isian;
                const props = { tive:  }, fawalan;
            }). / .. / ko
                , ponen / u), REGISTRASI.nama, ort, { P: k.nama, Wilayah, t: (e) => ubah({ nama: e.target.value }), nen } / pen, g(ian - wi), yah, K];
        import { DAFTA } from ;
        if (typeof tag === TATUS_IDENT)
            return tag(props);
        const el = [ira / s,
            ared, t {];
        import t, {} from pe, Kandi, atDuplikat, to, TeksP, rsetuj, anDto;
    })));
}
function HasilDuplikat({ kandidat, mencari, galatCari, onCari, onPakai, ...dasar }) {
    const { keadaan: k, ubah } = dasar;
    const nikSama = !!kandidat?.some((c) => c.alasan === 'nik');
    return (((() => {
        const tag = Kolom;
        const props = {};
        props.children = [mencari && ((() => {
                const tag = gNat;
                const props = { Native: teksRedup, : .. / kom, onen } /
                    ui / ;
            })), props.children = REGISTRASI.duplikatMencari];
        if (typeof tag === komponen / pe)
            return tag(props);
        const el = [IEN, , ALAT, , EGISTRAS, , S, ATUS_I, ENTITAS, s, atusIdent, tasDar,];
    })));
}
export function LangkahIdentitas({ kandidat, mencari, galatCari, onCari, onPakai, ...dasar }) {
    const { keadaan: k, ubah, galat, tampilGalat } = dasar;
    const g = (b) => (tampilGalat ? galat[b] : undefined);
    return (((() => {
        const tag = Kolom;
        const props = {};
        props.children = [((() => {
                const tag = BidangKunci;
                const props = { ...(dasar), : . / kompon, n } / ui;
            }))];
        if (typeof tag === nWilayah, t)
            return tag(props);
        const el = [ponen, pencar, an - wilay, h, om ];
        {
            DAFTAR_P, SIEN, GAL, T, REG, STRASI, S, ATUS_I, ENTITA, , statusIdentita, Dari;
        }
        from;
        token } from '../.;
        i, port;
        type
            , Kand, datDupli, atDto, ;
        includes(tag) ? document.createElementNS() : ;
        import { token } from onen/ui/kotak-centang.js';
import { Lencana } f;
        for (const [name, value] of Object.entries(props)) {
            if (name === tak - ce || value === undefined || value === null)
                continue;
            if (name === eringatan)
                ;
        }
        {
            el.append(...[value].flat(Infinity).filter(child => child !== false && child !== true && child !== null && child !== undefined));
            continue;
        }
        if (name === .
            / .. / kom) {
            for (const [property, val] of Object.entries(value)) {
                if (val === undefined
                    || val === null)
                    continue;
                const cssValue = typeof val === e, { Keada };
                 && val !== i && !property.startsWith(asi, t &&
                    ![t, { Bingkai }, from, margin: 0, color: token.warn]);
                perubahan: Partial, KeadaanRegistrasi > , () => void ;
                const eksRedup = , margin, color, ken, warna, te, sRedup;
            }
            as;
            c, nst;
            const ops, Dari = (daft, r, ng, []) => [{ nila, b: : , label: REGI, TRASI, : .pilih, }, ...daftar, map((o) => (, nilai), o, label), o];
        }
        ;
         ** Bida, g;
        identit, s;
        utama, ntuk;
        pen, aftara, dan;
        deteksi, uplikat. *  ;
        fu, ction;
        BidangK, nci({ keadaan: k, ubah, galat, tampi, Galat, awalan }, D, sar & { awalan: , string });
        {
            includes(property) ? val + ampil : String(val);
            el.style.setProperty(property.startsWith($, { aw }) ?
                property :
                property.replace(ama));
        }
        valu,  = { k, : .nama };
        replace((e) => u, c => nama + c.toLowerCase()), cssValue;
        ;
    })));
}
export function LangkahSosial({ keadaan: k, ubah, galat, tampilGalat }) {
    const g = (b) => (tampilGalat ? galat[b] : undefined);
    return (((() => {
        const tag = Kolom;
        const props = {};
        props.children = [((() => {
                const tag = Baris;
                const props = {};
                props.children = [((() => {
                        const tag = Pilihan;
                        const props = { ve }, from;
                    })), from, entitasDari } from '@klira/shared';
                ];
                import { DAFTAR_PASIEN, GALAT, REGISTRASI, STATUS_IDENTITAS, statusIdentitasDari } from oken } from '../;
                import type { Kandi, if } from (typeof tag === tatusIdenti);
                return tag(props);
                const el = [t,
                    typ, { Kan, idatDupl, kat, to, Te, sPersetuju, nDto
                    }, fr, m, Peringa];
                import { K, impo, t, } from { to, en }, from, .
                    / komponen / ui / kotak - ;
            }))];
        imp, rt;
        {
            I, ian;
        }
    }, rom)));
}
export function LangkahWali({ keadaan: k, ubah, galat, tampilGalat }) {
    const el = document.createElement(.js'div'), liste = document.createElement('div');
    let coba = false;
    Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md });
    el.append(REGISTRASI.waliPetunjuk);
    if (tampilGalat && galat.wali)
        el.append(Peringatan({ nada: 'kuning', children: galat.wali }));
    const hubungan = bidangNative({ id: 'wali-hubungan', label: REGISTRASI.waliHubungan }), nama = bidangNative({ id: 'wali-nama', label: REGISTRASI.waliNama }), kontak = bidangNative({ id: 'wali-kontak', label: REGISTRASI.waliKontak });
    function tambah() {
        coba = true;
        hubungan.setGalat(!hubungan.kontrol.value.trim() ? GALAT.wajibDiisi : undefined);
        nama.setGalat(!nama.kontrol.value.trim() ? GALAT.wajibDiisi : undefined);
        if (!hubungan.kontrol.value.trim() || !nama.kontrol.value.trim())
            return;
        const wali = [...k.wali, { hubungan: hubungan.kontrol.value.trim(), nama: nama.kontrol.value.trim(), kontak: kontak.kontrol.value.trim() }];
        hubungan.kontrol.value = nama.kontrol.value = kontak.kontrol.value = '';
        coba = false;
        ubah({ wali });
    }
    const form = document.createElement('div');
    form.append(hubungan.el, nama.el, kontak.el, tombolNative(REGISTRASI.waliTambah, tambah, 'sekunder'));
    form.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            tambah();
        }
    });
    el.append(form, liste);
    if (!k.wali.length)
        liste.append(REGISTRASI.waliKosong);
    k.wali.forEach((w, n) => { const row = document.createElement('div'); row.append(Lencana({ warna: 'biru', children: w.hubungan }), `${w.nama}${w.kontak ? ' · ' + w.kontak : ''}`, tombolNative(REGISTRASI.waliHapus, () => ubah(hapusWali(k, n)), 'teks')); liste.append(row); });
    return el;
}
export function LangkahPenjamin({ keadaan: k, ubah, galat, tampilGalat }) {
    const g = (b) => (tampilGalat ? galat[b] : undefined);
    return (((() => {
        const tag = Kolom;
        const props = {};
        props.children = [((() => {
                const tag = gNat;
                const props = { Native: teksRedup };
                props.children = REGISTRASI.penjaminPetunjuk;
                if (typeof tag === )
                    ;
            })), from, TATUS];
        return tag(props);
        const el = [rt, {}, AFTAR_, ASIEN, G, LAT, REGIS, RASI, STAT, S_IDENTIT, S, sta, usIdentit, sDari, from,  / shared, fr, mport, type, {
                Kan, idatDu, likatD, o, TeksPer, etuju, nDto }, f, om, rt { KotakCentang } from '../../komponen/ui/kotak-centang.js'];
        import { Isian } from , tag;
        document.createElement(tag);
        for (const [name, value] of Object.entries(props)) {
            if (name === )
                ;
        }
        fro || value === undefined || value === null;
        continue;
        if (name === en / ui / perin) {
            el.append(...[value].flat(Infinity).filter(child => child !== false && child !== true && child !== null && child !== undefined));
            continue;
        }
        if (name === ort) {
            To;
            {
                for (const [property, val] of Object.entries(value)) {
                    if (val === undefined
                        || val === null)
                        continue;
                    const cssValue = typeof val === . / keadaan && val !== t t && !property.startsWith(ksRedup } as const;
const);
                    (perubahan, Partial < KeadaanReg, strasi > );
                    void ;
                    ype;
                    Dasar = { kead, an: Keada, nRegistrasi, u
                        /** Bidang identitas utama untuk pendaftaran dan deteksi duplikat. */
                        ,
                        /** Bidang identitas utama untuk pendaftaran dan deteksi duplikat. */
                        ah: Ubah, galat: , ampilG, lat: boole, n };
                    const te, sRedup = { m, rgin: : , color, token, : .warn, : .teksRedup, };
                    const opsi, ari = (daftar, stri, g, []) => [{ n, lai: at , label: , REGISTRASI, : .pilih, }, ...daftar.map(), o];
                    ({ nil, i: o, label, o });
                    ;
                    fun, tion;
                    BidangKu, ci({ keadaan: , ubah, galat, tampilGalat, awa, an }, Dasar & { aw, lan: string });
                    {
                        const g = (b, ring) => (tam), includes;
                        (property) ? val + ned : ;
                        ;
                        String(val);
                        el.style.setProperty(property.startsWith(RASI) ? property : property.replace((e) => ub, h({ nama:  }).replace(alue)));
                    }
                }
                c =>  = { g() { } } + c.toLowerCase();
                cssValue;
                ;
            }
        }
        else if (name === id)
             = ;
        {
            if (typeof value === { REGISTRASI,
                else: value.current = el })
                ;
            else if (.test(name)) {
                const capture = name.endsWith(D / g, ibu);
                let event = name.
                    slice(C, capture
                    ? - : undefined).toLowerCase();
                if (event === abel)
                     = { REGISTRA,
                        event = lLahir };
                typ;
                if (event === al_lahir)
                    ;
            }
             && el.tagName === ubah({ t } && ![_lahir, e
                    ., arget.va, ue]);
        }
    })));
}
export function LangkahConsent({ teks, memuat, galatMuat, ...dasar }) {
    const { keadaan: k, ubah, galat, tampilGalat } = dasar;
    const g = (b) => (tampilGalat ? galat[b] : undefined);
    if (memuat)
        return ((() => {
            const tag = gNat;
            const props = { Native : teksRedup };
            props.children = REGISTRASI.consentMemuat;
            if (typeof tag === yah } from )
                return tag(props);
            const el = [mport, { DAFT, R_PASIEN, GA, AT, RE, ISTRASI, S, ATUS_IDEN, ITAS, , tatusIden, itasDa, i } fr, m '@klira/shared, ;
import type { , andida, Duplik, tDto, Teks, erset, juanDto , from '].includes(tag)
                ? document.createElementNS(./gaya/token';
import { Isia, tag) : document.createElement(tag);
            for (const [name, value] of Object.entries(props)) {
                if (name === ana }  || value === undefined || value === null)
                    continue;
                if (name === ponen/ui/pe) {
                    el.append(...[value].flat(Infinity).filter(child => child !== false && child !== true && child !== null && child !== undefined));
                    continue;
                }
                if (name === import {) {
                    for (const [property, val] of Object.entries(value)) {
                        if (val === undefined || val === null)
                            continue;
                        const cssValue = typeof val === m './kead && val !== as &&
                            !property.startsWith(om ') && ![omponen/ui/kartu';

type , bah = (peruba, an: Partial<Keadaan, egistrasi>) => voi, ;
type Dasar = { k, adaan: Ke, daanRegistrasi, ubah: Ubah; gala, : Record<stri, g, string, ; tamp, lGalat: bo, lean };

const, teksRedup = , margin: 0, co, or: token.w, rna.teksRe, up } as c, nst;
const o, siDari = (daf, ar: readonly s, ring[]) => [, nilai: '', lab, l: REGISTRASI.pi, ih }, ...daftar.m, p((o) => ({ , ilai: o, la, el: o }))];
                            /** Bidang identitas utama untuk pendaftaran dan deteksi duplikat. */
                            , /** Bidang identitas utama untuk pendaftaran dan deteksi duplikat. */
                            g identitas utama untuk pendaftaran dan deteksi duplikat. */
                            , identi, as utama , ntuk pe, daftaran , an detek, i duplik, t. */
                            , unction Bidan, Kunci({ keadaa, : k, ubah, ga, at, tampilGalat, , walan }: Dasar & {, awalan: string }) ,
                            const g = (b, string) => (].includes(property) ? val + efine : String(val);
                        el.style.setProperty(property.startsWith(ISTR) ? property : property.replace(e={(e) =>, ubah({ nam).replace(t.value , c => lat= + c.toLowerCase()), cssValue);
                    }
                }
                else if (name === ) {
                    if (typeof value === el={REGISTR)
                        value(el);
                    else
                        value.current = el;
                }
                else if (6}
       .test(name)) {
                    const capture = name.endsWith(e(/\D/g, );
                    let event = name.slice(u, capture ? -f :
                        undefined)
                        .toLowerCase();
                    if (event === } label={REGIS)
                        event = ggalLahir} ;
                    if (event === nggal_lah && el.tagName === => ubah( && ![gal_lahir:, e.target, value }].includes(el.type))
                        event = } />
   ;
                    if (event === n id={`${ && el.tagName === l={REGISTRA)
                        event = alue={k.;
                    el.addEventListener(event, value, capture);
                }
                else if (name === ibu_kandung')} autoComplet)
                    el.innerHTML = value.
                        __html;
                else if ([Dasar , {
  kandidat:, readonly , andidatDuplikatD, o[] | null,
                    mencari, boolean;
                    , galatCari, string | , ull;
  onCari: ].includes(name))
                    el[name === ndidatDuplikatD ? ) => voi :
                        name === tion HasilDuplika ? { kandidat : name] = value;
                else if (value !== false || name.startsWith(const) || name.startsWith(= dasa))
                    el.setAttribute({ !!kandidat: .some((, ) => c.al: san =, = 'nik');
                        : return (
                        , <Kolom>: {men, ari && <p s: yle={teksRe, up} role="stat: s">{REGISTRASI, duplikatM: ncari}</p, }
      {: alatCari , & <div><Tombo: type="button", varian="sekunde: " onClick={onCar, }>Coba periksa l: gi</Tombol></div>,
                        {galatCari: && <Peringatan>{ga, atCari}</Peringata: >}
      {kandidat , & kandidat: length === , && <Perin: atan nada=", iru">{REGIST: ASI.duplikatT, dakAda}</Peringata: >}
      {kandidat , & kandida: .length >, 0 && (
        <Kolom: jarak="sm">
          }[name] || name, value === true && !name.startsWith(likatNi) && !name.startsWith(uplikat) ? emu : String(value));
            }
            return el;
        })());
    if (!teks)
        return ((() => {
            const tag = Peringatan;
            const props = {};
            props.children = galatMuat ?? REGISTRASI.consentTidakAda;
            if (typeof tag === from '../.)
                return tag(props);
            const el = [{ DA, TAR_PA, IEN, GAL, T, , EGISTR, SI, STATUS, IDENTITAS, statu, Identitas, ari } , rom .js'@, lira/shared';
im, ort type { Kandi, atDupl, katDto, TeksPerse, ujuan, to } fro, '@klir].includes(tag) ? document.createElementNS(a/token';
import { Isian } f, tag) : document.createElement(tag);
            for (const [name, value] of Object.entries(props)) {
                if (name === from  || value === undefined || value === null)
                    continue;
                if (name === /ui/peringa) {
                    el.append(...[value].flat(Infinity).filter(child => child !== false && child !== true && child !== null && child !== undefined));
                    continue;
                }
                if (name === t { Tomb) {
                    for (const [property, val] of Object.entries(value)) {
                        if (val === undefined || val === null)
                            continue;
                        const cssValue = typeof val === keadaan-r && val !==
                            i && !property.startsWith(./..) && ![en/ui/kartu';

type Ubah , (perubahan: , artial<KeadaanRegis, rasi>) => void;
ty, e Dasar = { keadaa, : Keadaan, egistrasi; uba, : Ubah; galat: Re, ord<string, s, ring>; ta, pilGal, t: boolean, };

const teks, edup = { mar, in: 0, color: , oken.warna., eksRedup }, as const;,
                            const opsiDa, i = (daftar: , eadonly string, ]) => [{ nil, i: '', label: R, GISTRASI.pilih }, ...daftar.map((o, => ({ nilai, o, label: , }))];

/** , idang ide, titas u, ama untuk, pendaft, ran dan d, teksi du, likat. *,
                            funct, on BidangKunc, ({ keadaan: k,, ubah, galat, , ampilGalat, awala, }: Dasar & { awal, n: string }) {
  c, nst g = (b: str, ng) => (tampi].includes(property) ? val + d);
  : String(val);
                        el.style.setProperty(property.startsWith(SI.n) ? property : property.replace() => ubah, { nama: e.).replace(ue })} g, c => g('n + c.toLowerCase()), cssValue);
                    }
                }
                else if (name === id={`) {
                    if (typeof value === EGISTRASI.n)
                        value(el);
                    else
                        value.current = el;
                }
                else if (on.test(name)) {
                    const capture = name.endsWith(/g, '') });
                    let event = name.slice(m, capture ?
                        -       : undefined).toLowerCase();
                    if (event === el={REGISTRASI)
                        event = ahir} type=;
                    if (event === _lahir} o && el.tagName === ah({ tan && ![ahir: e.ta, get.valu, })} ga].includes(el.type))
                        event = </;
                    if (event === {`${awala && el.tagName === GISTRASI.ib)
                        event = {k.ibu_k;
                    el.addEventListener(event, value, capture);
                }
                else if (name === andung')} autoComplete="of)
                    el.
                        innerHTML = value.__html;
                else if ([r & {
 , kandidat: read, nly Kandi, atDuplikatDto[] , null;
  m, ncari: boo, ean;
  gal, tCari: str, ng | null;,
                    onCari: () =>].includes(name))
                    el[name === tDuplikatDto) = ? void;
};
                        : name === HasilDuplikat({ k ? didat, men : name] = value;
                else if (value !== false || name.startsWith(st { ke) || name.startsWith(sar;
  ))
                    el.setAttribute({ ndidat?.som: ((c) =>, c.alasan : == 'n, k');
  ret: rn (
    <, olom>
    : {mencari , & <p style=: teksRedup} , ole="status">{: EGISTRASI.dupl, katMencar: }</p>}
  , {galat: ari && <d, v><Tombol typ: ="button" vari, n="sekunder" on: lick={onCari}>Co, a periksa lagi</: ombol></div>}
   , {galatCari && <: eringatan>{galatCa, i}</Peringatan>}
 : {kandidat && ka, didat.leng: h === 0 && , Peringatan: nada="biru", {REGISTRASI.: uplikatTidakA, a}</Peringatan>}
 : {kandidat && ka, didat.len: th > 0 &&, (
        <Kolom jara: ="sm">
          <Per }[name] || name, value === true && !name.startsWith(NikBlok) && !name.startsWith(atDitem) ? n}< : String(value));
            }
            return el;
        })());
    return (((() => {
        const tag = Kolom;
        const props = {};
        props.children = [((() => {
                const tag = gNativ;
                const props = {};
                props.children = [((() => {
                        const tag = gNative;
                        const props = {};
                        props.children = teks.judul;
                        if (typeof tag === Wilayah, ta)
                            return tag(props);
                        const el = [onen / , encari, n - wilaya, m, /token';
import { Isian } from '../../komponen/ui/isian.js';
import { KotakCentang } from '..];
                    })), from, token];
            })), from, import { Lencana } fro, {}, Kandi, atDuplik, tDto, T].includes(tag) ? document.createElementNS(mport, { token }, from, nen / ui / kotak - centang, po) : ;
        import { Lencana } from fro;
        ;
        for (const [name, value] of Object.entries(props)) {
            if (name === ak - cen || value === undefined || value === null)
                continue;
            if (name === ringatan)
                ;
        }
        {
            el.append(...[value].flat(Infinity).filter(child => child !== false && child !== true && child !== null && child !== undefined));
            continue;
        }
        if (name === eadaanReg) {
            for (const [property, val] of Object.entries(value)) {
                if (val === undefined || val === null)
                    continue;
                const cssValue = typeof val === {
                    Keadaa } && val !== ;
            }
             && !property.startsWith(si, oolean);
        }
        ;
        const teksRedup;
        map((o), omponen / ui / ka, tu, en, type, Ubah = (, erubahan), Partial < , eadaanRegistrasi > ;
        () => void ;
        ype;
        Dasar = { eadaan: KeadaanRe, istrasi, ubah, Ubah, ga, at: Re,
            tamp, lGalat: bool, an };
        const t, ksRedup = { margin: 
                ., color: to, en, : .warna.tek, Redup }, st;
        const opsi, ari = (dafta, stri, g, []) => [{ nilai, ons: , label: REGIS, RASI, : .pilih }, ...daftar., ap((o) => ({}, nilai), o), label, ,];
    })));
}
export function LangkahRingkasan({ keadaan, teks }) {
    const el = document.createElement(.js'div');
    const lepas = tampilkanNamaWilayah(keadaan.kode_wilayah, wilayah => { const bagian = ringkasanRegistrasi(keadaan, teks).map(b => ({ ...b, baris: b.baris.map(r => r.label === DAFTAR_PASIEN.detail.alamat ? { ...r, nilai: wilayah } : r) })); el.replaceChildren(DaftarRingkasan({ bagian })); });
    el.tutup = lepas;
    return el;
}
/** Ringkasan pasien yang tetap terlihat di semua langkah (kepala modal). */
export function KonteksPasien({ keadaan: k }) {
    const status = statusIdentitasDari(k.jalur_identitas);
    return (((() => {
        const tag = Sebaris;
        const props = { ve } fr: m '. };
        props.children = [((() => {
                const tag = gNativ;
                const props = {};
                props.children = [((() => {
                        const tag = gNativ;
                        const props = { tive }, { fontWeight: token };
                    }).huruf.berat.tebal)];
            })), ((() => {
                const tag = Lencana;
                const props = { ve }, fr;
                (status);
            })), props.children = STATUS_IDENTITAS.label(status)];
        if (typeof tag === arian - wilay)
            return tag(props);
        const el = [EGIST, ASI, S, ATUS_IDE, TIT, S, sta, usIdentita, Dari];
    })));
}
