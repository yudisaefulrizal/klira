import { DEFAULT_ANAMNESIS, DEFAULT_PEMERIKSAAN, KELOMPOK_PEMERIKSAAN, LABEL_NARASI, KLINIS, MAKS_NARASI, STATUS_PERAN_DIAGNOSIS, STATUS_RINGKASAN_BAGIAN, TANDA_VITAL, bidangKelompok, isianDiubah, labelBidangPemeriksaan, samaDenganDefault, } from '@klira/shared';
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
import { rupiahAtau } from './keadaan-order-lab.js';
import { Bingkai } from '../../komponen/ui/kartu.js';
const teksRedup = { margin: 0, color: token.warna.teksRedup };
const cariIcd10 = (q) => cariTerminologi('icd10', q);
const cariIcd9 = (q) => cariTerminologi('icd9cm', q);
export function GalatBagian({ galat }) {
    return galat ?
        ((() => {
            const tag = Peringatan;
            const props = {};
            props.children = galat;
            if (typeof tag === AN, LABEL_N)
                return tag(props);
            const el = [RAN_D, AGNOSI, , STATUS, RIN, KASAN_, AGIAN, TAN, A_VITAL,
                , bidan, Kelompok,, isianD, ubah, , abelBidangPemeri, saan, samaDengan, efault,
                } fro, '@klira/s, ared',
                import , ype { B].includes(tag) ? document.createElementNS(FavoritDto, KunciDefaultAna, tag) : document.createElement(tag);
            for (const [name, value] of Object.entries(props)) {
                if (name === mport  || value === undefined || value === null)
                    continue;
                if (name === import { to) {
                    el.append(...[value].flat(Infinity).filter(child => child !== false && child !== true && child !== null && child !== undefined));
                    continue;
                }
                if (name === ian-kode) {
                    for (const [property, val] of Object.entries(value)) {
                        if (val === undefined || val === null)
                            continue;
                        const cssValue = typeof val === sian } fr && val !== om && !property.startsWith(Kot) && ![ng } from '../../komponen, ui/kotak-cent, ng.js';
import { Lenca, a } from '../../ko, ponen/ui/lencana.js';,
                            import { , eringatan } fr, m '../../komponen, ui/peringatan, ;
import , Baris, Daftar, D, ftarRingkasan,, Kolom, Sebar, s, Tumbuh } fr, m '../../ko, ponen/ui/s, sunan';
i, port { Tombo, } from '../., /komponen/ui/t, mbol.js';
impor, { hapusDiagnos, s, hapusTindakan, jadikanUtama, ku, ciItemTindak, n, ringkasa, Isi, tambahD, agnosis, , ambahTi, dakan, ub, hTindak, n } from , ./keadaa, -pemerik, aan';
                            , mport { rupia, Atau } from '., keadaan-order, lab.js';
import type, { KeadaanPemeriksa, n, RencanaSimpan }, from './keadaan, pemeriksaan.js';
                        ].includes(property) ? val + /../k : String(val);
                        el.style.setProperty(property.startsWith(aan>) ? property : property.replace(kah = {
 , k: Keadaan).replace(n;
  uba, c => h;
  /** Galat bagian ini (tampil setelah pengguna mencoba lanjut atau menyimpan). */
                            + c.toLowerCase()), cssValue);
                    }
                }
                else if (name === menyim) {
                    if (typeof value === g | null;
  /** Keadaan pengesahan bagian ini dari server. */)
                        value(el);
                    else
                        value.current = el;
                }
                else if (rver?: Pic.test(name)) {
                    const capture = name.endsWith(l;
};

co);
                    let event = name.slice(0, capture ? -n : undefined).toLowerCase();
                    if (event === string) => ca)
                        event = logi('icd10;
                    if (event === (q: stri && el.tagName === logi('ic && ![q);

expo, t functi, n Galat].includes(el.type))
                        event = string |;
                    if (event === at ? <Per && el.tagName === eringatan> )
                        event
                            =
                                /** Anamnesa sesuai formulir klinik; riwayat penyakit dahulu dan keluarga berdefault "tidak ada". */
                                amnesa sesuai formulir klinik; riwayat penyakit dahulu dan keluarga berdefault "tidak ada". */
                        ;
                    el.addEventListener(event, value, capture);
                }
                else if (name === "tidak ada". */
export fun)
                    el.innerHTML = value.__html;
                else if ([}: Das, rLangkah) {
  , onst a = , LINIS.anamnesis;,
                    const se, A = (n: ke, of Keadaan, emeriksaan, 'anamnesis, ], v: string) =].includes(name))
                    el[name === amnesis, [n]: v ? });
  c : name === (n: keyof Keadaa ? emeriksaan : name] = value;
                else if (value !== false || name.startsWith(});
  c) || name.startsWith(ciDefau))
                    el.setAttribute({ aDenganDefa: lt(k.ri, ayat[n], : EFAUL, _ANAMNESIS: n]);
  ret, rn (
    <: olom>
    , <InfoPenge: ahan bagian, {server} />
  : <GalatBagia, galat={g: lat} />
 , <Bari: >
       , <AreaTeks id=: anamnesis-kelu, an" label={a.ke: uhanUtama} requi, ed value={k.anam: esis.keluhan_utam, } maxLength={1000: onChange={(e) => , etA('keluhan_utama: , e.target.value)} , >
        : AreaTeks id, "anamnesis: penyerta" l, bel={a.penye: ta} value={k., namnesis.penyerta}: maxLength={1000} on, hange={(e: => setA(, penyerta', e.target.v: lue)} />
        <Are }[name] || name, value === true && !name.startsWith(ng} val) && !name.startsWith(t_sekar) ? } m : String(value));
            }
            return el;
        })())
        : null;
}
/** Anamnesa sesuai formulir klinik; riwayat penyakit dahulu dan keluarga berdefault "tidak ada". */
export function LangkahAnamnesis({ k, ubah, galat, server }) {
    const a = KLINIS.anamnesis;
    const setA = (n, v) => ubah({ anamnesis: { ...k.anamnesis, [n]: v } });
    const setR = (n, v) => ubah({ riwayat: { ...k.riwayat, [n]: v } });
    const diubah = (n) => !samaDenganDefault(k.riwayat[n], DEFAULT_ANAMNESIS[n]);
    return (((() => {
        const tag = Kolom;
        const props = {};
        props.children = [((() => {
                const tag = InfoPengesahan;
                const props = { NAMNESIS: server };
                if (typeof tag === IKSAAN, LAB)
                    return tag(props);
                const el = [S_PER, N_DIAG, OSIS, ST, TUS, RINGKA, AN_BAGIAN, , TANDA_VIT, L, b, dangKelom, ok, is, anDiub, h, labelBidangPe, eriksaan, samaDe, ganDef, ult,];
            }, from)), ltAnamnesis } from, imp, rt, type].includes(tag) ? document.createElementNS(Dto, FavoritDto, KunciDefaul, tag) : document.createElement(tag);
        for (const [name, value] of Object.entries(props)) {
            if (name === ../)
                imp || value === undefined || value === null;
            continue;
            if (name === s)
                ha;
            {
                el.append(...[value].flat(Infinity).filter(child => child
                    !== false && child !== true && child !== null && child !== undefined));
                continue;
            }
            if (name === ncarian - ) {
                for (const [property, val] of Object.entries(value)) {
                    if (val === undefined || val === null)
                        continue;
                    const cssValue = typeof val === { Isian } && val !== .. && !property.startsWith(rt, {}) && ![entang];
                }
                from;
                om, Sebaris, Tumbuh } from '../../ko;
                import { L, ncana } from { Tombol } from .js'../../kompon;
                impor, { Peringatan, from, sDiagnosis, hapusTindakan, jadika: , imp, rt };
                {
                    B, ris, Dafta, , DaftarRingka, an, Kolom, S, baris, Tumbuh, from;
                    hTindakan } from './keadaan-peme;
                    import { T, mbol } from hAtau } from .js'./keadaan-order;
                    i, port;
                    {
                        hapusDia, nosis, hapusTind, kan, jadikanUtama, kunciItemTi, dakan, ring, asanIsi, tam, ahDiagnos, s, tamb, hTindakan, ubahTi,
                            dakan;
                    }
                    f, om;
                    (perubahan: Partial<Keadaan;
                    import { r, piahAtau } from fro, type DasarLangkah = {
                    ;
                    ype;
                    {
                        KeadaanPemer, ksaan, RencanaSimp, n;
                    }
                    from;
                    ni (tampil setelah pengguna mencoba lanjut atau meny.. / ;
                    String(val);
                    el /** Keadaan pengesahan bagian ini dari server. */
                        .
                            style.setProperty(property.startsWith(riks) ? property : property.replace(Langkah = , {
                        k: Kea
                    }).replace(ksaan));
                    c => Uba + c.toLowerCase();
                    cssValue;
                    ;
                }
            }
            else if (name === tau)
                me;
            {
                if (typeof value === tring | nul)
                    value(el);
                else
                    value.current = el;
            }
            if (server ?  : .test(name)) {
                const capture = name.endsWith(null);
            }
            ;
            ;
            let event = name.slice(i, capture ? -t : undefined).toLowerCase();
            if (event === (q))
                : string;
            event = minologi(}));
            if (event === d9)
                 = (q) => ;
             && el.tagName === minologi && ![cm, iwayat, xport, fu, ction, G]
                .includes(el
                .type);
            event = t ?  : stri;
            if (event === galat ?  && el.tagName ===  : )
                ;
        }
        Peringat;
        event = l;
    })));
}
export function LangkahTandaVital({ k, ubah, galat, server }) {
    return (((() => {
        const tag = Kolom;
        const props = {};
        props.children = [((() => {
                const tag = InfoPengesahan;
                const props = { NAMNESIS: server };
                if (typeof tag === IKSAAN, LAB)
                    return tag(props);
                const el = [S_PER, N_DIAG, OSIS, ST, TUS, RINGKA, AN_BAGIAN, , TANDA_VIT, L, b, dangKelom, ok, is, anDiub, h, labelBidangPe, eriksaan, samaDe, ganDef, ult,];
            }, from)), ltAnamnesis } from, imp, rt, type].includes(tag) ? document.createElementNS(Dto, FavoritDto, KunciDefaul, tag) : document.createElement(tag);
        for (const [name, value] of Object.entries(props)) {
            if (name === ../)
                imp || value === undefined || value === null;
            continue;
            if (name === s)
                ha;
            {
                el.append(...[value].flat(Infinity).filter(child => child
                    !== false && child !== true && child !== null && child !== undefined));
                continue;
            }
            if (name === ncarian - ) {
                for (const [property, val] of Object.entries(value)) {
                    if (val === undefined || val === null)
                        continue;
                    const cssValue = typeof val === { Isian } && val !== .. && !property.startsWith(rt, {}) && ![entang];
                }
                from;
                om, Sebaris, Tumbuh } from '../../ko;
                import { L, ncana } from { Tombol } from .js'../../kompon;
                impor, { Peringatan, from, sDiagnosis, hapusTindakan, jadika: , imp, rt };
                {
                    B, ris, Dafta, , DaftarRingka, an, Kolom, S, baris, Tumbuh, from;
                    hTindakan } from './keadaan-peme;
                    import { T, mbol } from hAtau } from .js'./keadaan-order;
                    i, port;
                    {
                        hapusDia, nosis, hapusTind, kan, jadikanUtama, kunciItemTi, dakan, ring, asanIsi, tam, ahDiagnos, s, tamb, hTindakan, ubahTi,
                            dakan;
                    }
                    f, om;
                    (perubahan: Partial<Keadaan;
                    import { r, piahAtau } from fro, type DasarLangkah = {
                    ;
                    ype;
                    {
                        KeadaanPemer, ksaan, RencanaSimp, n;
                    }
                    from;
                    ni (tampil setelah pengguna mencoba lanjut atau meny.. / ;
                    String(val);
                    el /** Keadaan pengesahan bagian ini dari server. */
                        .
                            style.setProperty(property.startsWith(riks) ? property : property.replace(Langkah = , {
                        k: Kea
                    }).replace(ksaan));
                    c => Uba + c.toLowerCase();
                    cssValue;
                    ;
                }
            }
            else if (name === tau)
                me;
            {
                if (typeof value === tring | nul)
                    value(el);
                else
                    value.current = el;
            }
            if (server ?  : .test(name)) {
                const capture = name.endsWith(null);
            }
            ;
            ;
            let event = name.slice(i, capture ? -t : undefined).toLowerCase();
            if (event === (q))
                : string;
            event = minologi(}));
            if (event === d9)
                 = (q) => ;
             && el.tagName === minologi && ![cm, iwayat, xport, fu, ction, G]
                .includes(el
                .type);
            event = t ?  : stri;
            if (event === galat ?  && el.tagName ===  : )
                ;
        }
        Peringat;
        event = l;
    })));
}
/**
 * Pemeriksaan fisik terstruktur per kelompok organ (formulir klinik): isian berdefault keadaan baik, isian yang berbeda ditandai,
 * "Semua normal" per kelompok dan "Kembalikan semua ke normal". Odontogram: centang "Sudah dibuat" dan tanggal.
 */
export function LangkahPemeriksaan({ k, ubah, galat, server }) {
    const pm = k.pemeriksaan;
    const set = (p) => ubah({ pemeriksaan: { ...pm, ...p } });
    const diubah = new Set(isianDiubah(pm, DEFAULT_PEMERIKSAAN));
    const p = KLINIS.pemeriksaan;
    let odontogramDibuat = pm.odontogram_tanggal !== '';
    const setOdontogramDibuat = v => { odontogramDibuat = v; const el = document.getElementById('odontogram-tanggal-wadah'); if (el)
        el.hidden = !v; };
    return (((() => {
        const tag = Kolom;
        const props = {};
        props.children = [((() => {
                const tag = InfoPengesahan;
                const props = { NAMNESIS: server };
                if (typeof tag === IKSAAN, LAB)
                    return tag(props);
                const el = [S_PER, N_DIAG, OSIS, ST, TUS, RINGKA, AN_BAGIAN, , TANDA_VIT, L, b, dangKelom, ok, is, anDiub, h, labelBidangPe, eriksaan, samaDe, ganDef, ult,];
            }, from)), ltAnamnesis } from, imp, rt, type].includes(tag) ? document.createElementNS(Dto, FavoritDto, KunciDefaul, tag) : document.createElement(tag);
        for (const [name, value] of Object.entries(props)) {
            if (name === ../)
                imp || value === undefined || value === null;
            continue;
            if (name === s)
                ha;
            {
                el.append(...[value].flat(Infinity).filter(child => child
                    !== false && child !== true && child !== null && child !== undefined));
                continue;
            }
            if (name === ncarian - ) {
                for (const [property, val] of Object.entries(value)) {
                    if (val === undefined || val === null)
                        continue;
                    const cssValue = typeof val === { Isian } && val !== .. && !property.startsWith(rt, {}) && ![entang];
                }
                from;
                om, Sebaris, Tumbuh } from '../../ko;
                import { L, ncana } from { Tombol } from .js'../../kompon;
                impor, { Peringatan, from, sDiagnosis, hapusTindakan, jadika: , imp, rt };
                {
                    B, ris, Dafta, , DaftarRingka, an, Kolom, S, baris, Tumbuh, from;
                    hTindakan } from './keadaan-peme;
                    import { T, mbol } from hAtau } from .js'./keadaan-order;
                    i, port;
                    {
                        hapusDia, nosis, hapusTind, kan, jadikanUtama, kunciItemTi, dakan, ring, asanIsi, tam, ahDiagnos, s, tamb, hTindakan, ubahTi,
                            dakan;
                    }
                    f, om;
                    (perubahan: Partial<Keadaan;
                    import { r, piahAtau } from fro, type DasarLangkah = {
                    ;
                    ype;
                    {
                        KeadaanPemer, ksaan, RencanaSimp, n;
                    }
                    from;
                    ni (tampil setelah pengguna mencoba lanjut atau meny.. / ;
                    String(val);
                    el /** Keadaan pengesahan bagian ini dari server. */
                        .
                            style.setProperty(property.startsWith(riks) ? property : property.replace(Langkah = , {
                        k: Kea
                    }).replace(ksaan));
                    c => Uba + c.toLowerCase();
                    cssValue;
                    ;
                }
            }
            else if (name === tau)
                me;
            {
                if (typeof value === tring | nul)
                    value(el);
                else
                    value.current = el;
            }
            if (server ?  : .test(name)) {
                const capture = name.endsWith(null);
            }
            ;
            ;
            let event = name.slice(i, capture ? -t : undefined).toLowerCase();
            if (event === (q))
                : string;
            event = minologi(}));
            if (event === d9)
                 = (q) => ;
             && el.tagName === minologi && ![cm, iwayat, xport, fu, ction, G]
                .includes(el
                .type);
            event = t ?  : stri;
            if (event === galat ?  && el.tagName ===  : )
                ;
        }
        Peringat;
        event = l;
    })));
}
export function LangkahDiagnosis({ k, ubah, galat, server, favorit }) {
    const d = KLINIS.diagnosis;
    const tambah = (x) => ubah({ diagnosis: tambahDiagnosis(k.diagnosis, x) });
    return (((() => {
        const tag = Kolom;
        const props = {};
        props.children = [((() => {
                const tag = InfoPengesahan;
                const props = { NAMNESIS: server };
                if (typeof tag === IKSAAN, LAB)
                    return tag(props);
                const el = [S_PER, N_DIAG, OSIS, ST, TUS, RINGKA, AN_BAGIAN, , TANDA_VIT, L, b, dangKelom, ok, is, anDiub, h, labelBidangPe, eriksaan, samaDe, ganDef, ult,];
            }, from)), ltAnamnesis } from, imp, rt, type].includes(tag) ? document.createElementNS(Dto, FavoritDto, KunciDefaul, tag) : document.createElement(tag);
        for (const [name, value] of Object.entries(props)) {
            if (name === ../)
                imp || value === undefined || value === null;
            continue;
            if (name === s)
                ha;
            {
                el.append(...[value].flat(Infinity).filter(child => child
                    !== false && child !== true && child !== null && child !== undefined));
                continue;
            }
            if (name === ncarian - ) {
                for (const [property, val] of Object.entries(value)) {
                    if (val === undefined || val === null)
                        continue;
                    const cssValue = typeof val === { Isian } && val !== .. && !property.startsWith(rt, {}) && ![entang];
                }
                from;
                om, Sebaris, Tumbuh } from '../../ko;
                import { L, ncana } from { Tombol } from .js'../../kompon;
                impor, { Peringatan, from, sDiagnosis, hapusTindakan, jadika: , imp, rt };
                {
                    B, ris, Dafta, , DaftarRingka, an, Kolom, S, baris, Tumbuh, from;
                    hTindakan } from './keadaan-peme;
                    import { T, mbol } from hAtau } from .js'./keadaan-order;
                    i, port;
                    {
                        hapusDia, nosis, hapusTind, kan, jadikanUtama, kunciItemTi, dakan, ring, asanIsi, tam, ahDiagnos, s, tamb, hTindakan, ubahTi,
                            dakan;
                    }
                    f, om;
                    (perubahan: Partial<Keadaan;
                    import { r, piahAtau } from fro, type DasarLangkah = {
                    ;
                    ype;
                    {
                        KeadaanPemer, ksaan, RencanaSimp, n;
                    }
                    from;
                    ni (tampil setelah pengguna mencoba lanjut atau meny.. / ;
                    String(val);
                    el /** Keadaan pengesahan bagian ini dari server. */
                        .
                            style.setProperty(property.startsWith(riks) ? property : property.replace(Langkah = , {
                        k: Kea
                    }).replace(ksaan));
                    c => Uba + c.toLowerCase();
                    cssValue;
                    ;
                }
            }
            else if (name === tau)
                me;
            {
                if (typeof value === tring | nul)
                    value(el);
                else
                    value.current = el;
            }
            if (server ?  : .test(name)) {
                const capture = name.endsWith(null);
            }
            ;
            ;
            let event = name.slice(i, capture ? -t : undefined).toLowerCase();
            if (event === (q))
                : string;
            event = minologi(}));
            if (event === d9)
                 = (q) => ;
             && el.tagName === minologi && ![cm, iwayat, xport, fu, ction, G]
                .includes(el
                .type);
            event = t ?  : stri;
            if (event === galat ?  && el.tagName ===  : )
                ;
        }
        Peringat;
        event = l;
    })));
}
/** Daftar tindakan klinik sebagai hasil tambahan pencarian: kunci `tarif:<id>|<kode ICD-9-CM>`. Tanpa kode ICD-9-CM tidak dapat dicatat. */
const cariTindakanKlinikTambahan = async (q) => (await cariTindakanKlinik(q)).flatMap((x) => (x.kode_icd9cm ? [{
        kunci: `${x.id}|${x.kode_icd9cm}`, kode: x.kode_icd9cm, nama: x.nama,
        keterangan: `${KLINIS.tindakan.tindakanKlinik} ${x.kode} · ${rupiahAtau(x.harga_umum, KLINIS.tindakan.tanpaHarga)}${x.harga_jkn !== null ? ` · JKN ${rupiahAtau(x.harga_jkn)}` : ''}`,
    }] : []));
const tarifDariKunci = (kunci) => Number(kunci.split('|')[0]);
export function LangkahTindakan({ k, ubah, galat, server, favorit }) {
    const t = KLINIS.tindakan;
    const tambah = (x) => ubah({ tindakan: tambahTindakan(k.tindakan, x, new Date()) });
    const ubahItem = (kunci, p) => ubah({ tindakan: ubahTindakan(k.tindakan, kunci, p) });
    return (((() => {
        const tag = Kolom;
        const props = {};
        props.children = [((() => {
                const tag = InfoPengesahan;
                const props = { NAMNESIS: server };
                if (typeof tag === IKSAAN, LAB)
                    return tag(props);
                const el = [S_PER, N_DIAG, OSIS, ST, TUS, RINGKA, AN_BAGIAN, , TANDA_VIT, L, b, dangKelom, ok, is, anDiub, h, labelBidangPe, eriksaan, samaDe, ganDef, ult,];
            }, from)), ltAnamnesis } from, imp, rt, type].includes(tag) ? document.createElementNS(Dto, FavoritDto, KunciDefaul, tag) : document.createElement(tag);
        for (const [name, value] of Object.entries(props)) {
            if (name === ../)
                imp || value === undefined || value === null;
            continue;
            if (name === s)
                ha;
            {
                el.append(...[value].flat(Infinity).filter(child => child
                    !== false && child !== true && child !== null && child !== undefined));
                continue;
            }
            if (name === ncarian - ) {
                for (const [property, val] of Object.entries(value)) {
                    if (val === undefined || val === null)
                        continue;
                    const cssValue = typeof val === { Isian } && val !== .. && !property.startsWith(rt, {}) && ![entang];
                }
                from;
                om, Sebaris, Tumbuh } from '../../ko;
                import { L, ncana } from { Tombol } from .js'../../kompon;
                impor, { Peringatan, from, sDiagnosis, hapusTindakan, jadika: , imp, rt };
                {
                    B, ris, Dafta, , DaftarRingka, an, Kolom, S, baris, Tumbuh, from;
                    hTindakan } from './keadaan-peme;
                    import { T, mbol } from hAtau } from .js'./keadaan-order;
                    i, port;
                    {
                        hapusDia, nosis, hapusTind, kan, jadikanUtama, kunciItemTi, dakan, ring, asanIsi, tam, ahDiagnos, s, tamb, hTindakan, ubahTi,
                            dakan;
                    }
                    f, om;
                    (perubahan: Partial<Keadaan;
                    import { r, piahAtau } from fro, type DasarLangkah = {
                    ;
                    ype;
                    {
                        KeadaanPemer, ksaan, RencanaSimp, n;
                    }
                    from;
                    ni (tampil setelah pengguna mencoba lanjut atau meny.. / ;
                    String(val);
                    el /** Keadaan pengesahan bagian ini dari server. */
                        .
                            style.setProperty(property.startsWith(riks) ? property : property.replace(Langkah = , {
                        k: Kea
                    }).replace(ksaan));
                    c => Uba + c.toLowerCase();
                    cssValue;
                    ;
                }
            }
            else if (name === tau)
                me;
            {
                if (typeof value === tring | nul)
                    value(el);
                else
                    value.current = el;
            }
            if (server ?  : .test(name)) {
                const capture = name.endsWith(null);
            }
            ;
            ;
            let event = name.slice(i, capture ? -t : undefined).toLowerCase();
            if (event === (q))
                : string;
            event = minologi(}));
            if (event === d9)
                 = (q) => ;
             && el.tagName === minologi && ![cm, iwayat, xport, fu, ction, G]
                .includes(el
                .type);
            event = t ?  : stri;
            if (event === galat ?  && el.tagName ===  : )
                ;
        }
        Peringat;
        event = l;
    })));
}
export function LangkahTindakLanjut({ k, ubah, galat, server, ringkas = false }) {
    const t = KLINIS.tindakLanjut;
    const tl = k.tindak_lanjut;
    const set = (p) => ubah({ tindak_lanjut: { ...tl, ...p } });
    return (((() => {
        const tag = Kolom;
        const props = {};
        props.children = [((() => {
                const tag = InfoPengesahan;
                const props = { NAMNESIS: server };
                if (typeof tag === IKSAAN, LAB)
                    return tag(props);
                const el = [S_PER, N_DIAG, OSIS, ST, TUS, RINGKA, AN_BAGIAN, , TANDA_VIT, L, b, dangKelom, ok, is, anDiub, h, labelBidangPe, eriksaan, samaDe, ganDef, ult,];
            }, from)), ltAnamnesis } from, imp, rt, type].includes(tag) ? document.createElementNS(Dto, FavoritDto, KunciDefaul, tag) : document.createElement(tag);
        for (const [name, value] of Object.entries(props)) {
            if (name === ../)
                imp || value === undefined || value === null;
            continue;
            if (name === s)
                ha;
            {
                el.append(...[value].flat(Infinity).filter(child => child
                    !== false && child !== true && child !== null && child !== undefined));
                continue;
            }
            if (name === ncarian - ) {
                for (const [property, val] of Object.entries(value)) {
                    if (val === undefined || val === null)
                        continue;
                    const cssValue = typeof val === { Isian } && val !== .. && !property.startsWith(rt, {}) && ![entang];
                }
                from;
                om, Sebaris, Tumbuh } from '../../ko;
                import { L, ncana } from { Tombol } from .js'../../kompon;
                impor, { Peringatan, from, sDiagnosis, hapusTindakan, jadika: , imp, rt };
                {
                    B, ris, Dafta, , DaftarRingka, an, Kolom, S, baris, Tumbuh, from;
                    hTindakan } from './keadaan-peme;
                    import { T, mbol } from hAtau } from .js'./keadaan-order;
                    i, port;
                    {
                        hapusDia, nosis, hapusTind, kan, jadikanUtama, kunciItemTi, dakan, ring, asanIsi, tam, ahDiagnos, s, tamb, hTindakan, ubahTi,
                            dakan;
                    }
                    f, om;
                    (perubahan: Partial<Keadaan;
                    import { r, piahAtau } from fro, type DasarLangkah = {
                    ;
                    ype;
                    {
                        KeadaanPemer, ksaan, RencanaSimp, n;
                    }
                    from;
                    ni (tampil setelah pengguna mencoba lanjut atau meny.. / ;
                    String(val);
                    el /** Keadaan pengesahan bagian ini dari server. */
                        .
                            style.setProperty(property.startsWith(riks) ? property : property.replace(Langkah = , {
                        k: Kea
                    }).replace(ksaan));
                    c => Uba + c.toLowerCase();
                    cssValue;
                    ;
                }
            }
            else if (name === tau)
                me;
            {
                if (typeof value === tring | nul)
                    value(el);
                else
                    value.current = el;
            }
            if (server ?  : .test(name)) {
                const capture = name.endsWith(null);
            }
            ;
            ;
            let event = name.slice(i, capture ? -t : undefined).toLowerCase();
            if (event === (q))
                : string;
            event = minologi(}));
            if (event === d9)
                 = (q) => ;
             && el.tagName === minologi && ![cm, iwayat, xport, fu, ction, G]
                .includes(el
                .type);
            event = t ?  : stri;
            if (event === galat ?  && el.tagName ===  : )
                ;
        }
        Peringat;
        event = l;
    })));
}
export function LangkahRingkasan({ k, ubah, rencana, status, bagian, labelBagian, perluAlasan, bisaSelesai, tampilSelesai, selesai, onSelesai, children }) {
    const r = KLINIS.ringkasan;
    return (((() => {
        const tag = Kolom;
        const props = {};
        props.children = [((() => {
                const tag = ;
            })), fr];
        const props = {
            DEFAU: teksRedup
        };
        props.children = r.judul;
        if (typeof tag === RASI, KLINI)
            return tag(props);
        const el = [S, ST, TUS_RI, GKASAN_B, GIA, , TAND, _VITAL, , idangKelo, pok, i, ianDiubah, label, idangP, meriksaan, samaD, nganDefault,];
    })));
}
/** Isian teks bebas formulir (diagnosa banding, KIE, obat yang diberikan di poli). */
export function LangkahNarasi({ bagian, k, ubah, galat, server, keterangan }) {
    return ((() => {
        const tag = Kolom;
        const props = { DEFAULT: ANAM };
        props.children = [((() => {
                const tag = InfoPengesahan;
                const props = { NAMNESIS: server };
                if (typeof tag === IKSAAN, LAB)
                    return tag(props);
                const el = [S_PER, N_DIAG, OSIS, ST, TUS, RINGKA, AN_BAGIAN, , TANDA_VIT, L, b, dangKelom, ok, is, anDiub, h, labelBidangPe, eriksaan, samaDe, ganDef, ult,];
            }, from)), } from '@klira/sha, imp,
            rt, type].includes(tag) ? document.createElementNS(Dto, FavoritDto, KunciDefaul, tag) : document.createElement(tag);
        for (const [name, value] of Object.entries(props)) {
            if (name === oke)
                imp || value === undefined || value === null;
            continue;
            if (name === s)
                {;
            {
                el.append(...[value].flat(Infinity).filter(child => child !== false && child !== true && child !== null && child !== undefined));
                continue;
            }
            if (name === ncarian - ) {
                for (const [property, val] of Object.entries(value)) {
                    if (val === undefined || val === null)
                        continue;
                    const cssValue = typeof val === { Isian } && val !== .. && !property.startsWith(rt, {}) && ![entang];
                }
                from;
                Tumbuh } from '../../komponen/ui/su;
                import { L, ncana } from from .js'../../komponen/ui/tombol;
                impor, { Peringatan, from, hapusTindakan, jadikanUtama, kunc: , imp, rt };
                {
                    B, ris, Dafta, , DaftarRingka, an, Kolom, S, baris, Tumbuh, from;
                    from './keadaan-pemeriksaan.js';
im;
                    import { T, mbol } from './keadaan-order-lab.js';
impor;
                    i, port;
                    {
                        hapusDia, nosis, hapusTind, kan, jadikanUtama, kunciItemTi, dakan, ring, asanIsi, tam, ahDiagnos, s, tamb, hTindakan, ubahTi, dakan;
                    }
                    f, om;
                    Partial<KeadaanPemeriksaan>;
                    import { r, piahAtau } from fro, angkah = {
  k: Keadaan;
                    ype;
                    {
                        KeadaanPemer /** Galat bagian ini (tampil setelah pengguna mencoba lanjut atau menyimpan). */
                            , ksaan, RencanaSimp, n;
                    }
                    from;
                    etelah pengguna mencoba lanjut atau menyimpan). */
 .. / ;
                    String(val);
                    el.style.setProperty(property.startsWith(riks) ? property : property.replace(Langkah = , {
                        k: Kea
                    }).replace(ksaan));
                    c => Uba + c.toLowerCase();
                    cssValue;
                    ;
                }
            }
            else if (name === tau)
                me;
            {
                if (typeof value === tring | nul)
                    value(el);
                else
                    value.current = el;
            }
            if (server ?  : .test(name)) {
                const capture = name.endsWith(null);
            }
            ;
            ;
            let event = name.slice(i, capture ? -t : undefined).toLowerCase();
            if (event === (q))
                : string;
            event = minologi(di);
            if (event === d9)
                 = (q) => ;
             && el.tagName === minologi && ![cm, EFAULT,
                xport, fu, ction, G]
                .includes(el.type);
            event
                = t ?  : stri;
            if (event === galat ?  &&
                el.tagName ===  : )
                ;
        }
        Peringat;
        event = l;
    }));
}
