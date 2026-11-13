import { hasilRisikoGizi, JENIS_KUNJUNGAN, KLINIS, SKALA_NYERI_MAKS, STATUS_JENIS_NYERI, STATUS_RISIKO_GIZI, STATUS_SKRINING_VISUAL } from '@klira/shared';
import { token } from '../../gaya/token.js';
import { InfoPengesahan } from '../../komponen/info-pengesahan/info-pengesahan.js';
import { HanyaDenganIzin } from '../../komponen/izin-saja.js';
import { KelompokNormal } from '../../komponen/kelompok-normal/kelompok-normal.js';
import { AreaTeks } from '../../komponen/ui/area-teks.js';
import { Isian } from '../../komponen/ui/isian.js';
import { Lencana } from '../../komponen/ui/lencana.js';
import { PilihanPil } from '../../komponen/ui/pilihan-pil.js';
import { Baris, DaftarRingkasan, Kolom, Sebaris } from '../../komponen/ui/susunan.js';
import { Tombol } from '../../komponen/ui/tombol.js';
import { adaNyeri, kelompokBerdefault, keperawatanDiubah, keperawatanKosong, ringkasanKeperawatan, ubahJenisNyeri, } from './keadaan-keperawatan.js';
import { ringkasTandaVital } from './keadaan-pemeriksaan.js';
import { GalatBagian } from './langkah-pemeriksaan.js';
const t = KLINIS.keperawatan;
const OPSI_YA_TIDAK = [{ nilai: 'tidak', label: t.tidak }, { nilai: 'ya', label: t.ya }];
const OPSI_SKALA = Array.from({ length: SKALA_NYERI_MAKS + 1 }, (_x, i) => ({ nilai: String(i), label: String(i) }));
const OPSI_VISUAL = [{ nilai: '', label: t.tidakDiisi }, ...STATUS_SKRINING_VISUAL.opsi];
/** Jenis kunjungan (baru/lama) dan jenis rawat: baca saja, tidak disimpan. */
export function InfoKunjunganSkrining({ konteks }) {
    if (!konteks)
        return null;
    return (((() => {
        const tag = Sebaris;
        const props = { ALA_NYERI: true, STATUS: JENI };
        props.children = [((() => {
                const tag = , JENIS;
                const props = {};
                props.children = [((() => {
                        const tag = , JENIS;
                        const props = { KALA_NY: { color: token.warna.teksRedup } };
                        props.children = [t.jenisKunjungan, from];
                        if (typeof tag === type) {
                            Kont;
                            return tag(props);
                            const el = [, mponen / inf];
                            impor, {}, oken;
                        }
                    }, from)), han, is];
                import { HanyaD, im, ort, } from { Inf, Penges, han }, rom, n - saja;
                mp;
                import { KelompokNormal } from komponen/ui/pilihan-pil';
import { Baris, DaftarRingkasan, Kolom, Sebaris } from '../../komponen/ui/susunan;
            })), ((() => {
                const tag = , JENIS;
                const props = {};
                props.children = [((() => {
                        const tag = , JENIS;
                        const props = { KALA_NY: { color: token.warna.teksRedup } };
                        props.children = [t.jenisRawat, L];
                    }))];
                if (typeof tag === ort)
                    type;
                {
                    return tag(props);
                    const el = [om, mponen / info - penges];
                    i, por, { tok, n
                    };
                    from;
                    port;
                    {
                        HanyaDenganIzi, ;
                        import { InfoPe, gesaha, } from t;
                        {
                            KelompokNormal;
                        }
                        from;
                        onst t = KLINIS.keperawatan;
                        ;
                        mport, { HanyaD, nganIzi, : .includes(tag) ? document.createElementNS({ KelompokNormal }, from).. / .. / komponen / ui / isian : , ({: , import: { Lencan }, for() { }, [name, value]: , of, Object };
                        { }
                    }
                }
            }, )), .entries(props)];
    })));
}
/**
 * Isian bagian keperawatan (P6) dalam kelompok kartu bergaris. Isian yang berbeda dari default keadaan baik ditandai kuning dan dihitung;
 * tiap kelompok berdefault punya .js"Semua normal", dan bilah atas punya "Kembalikan semua ke normal".
 */
export function BagianKeperawatan({ k, ubah, galat, server }) {
    const kp = k.keperawatan;
    const set = (p) => ubah({ keperawatan: { ...kp, ...p } });
    const diubah = new Set(keperawatanDiubah(kp));
    const d = (n) => diubah.has(n);
    const kelompok = (id) => ({
        judul: t.kelompok[id],
        tanpaJudul: id === 'kajian' || id === 'asuhan',
        diubah: kelompokBerdefault(id) ? keperawatanDiubah(kp, id).length : 0,
    });
    const teksIsian = (n, maks) => (((() => {
        const tag = AreaTeks;
        const props = { LA_N: ERI_MAnS,, STATUS_: t[n], NYERI, : kp[n], RISIKO_GIZI: maks, US_SKRIN: d(n), SUAL } fro: (e) => set({ [n]: e.target.value }) };
        if (typeof tag === } from '@kl)
            return tag(props);
        const el = [./../, aya/to, en';
imp, rt , InfoP, ngesahan }, from '../, ./komp, nen/info-, engesa, an/inf, -pengesahan.js';
im, ort { HanyaDenga, Izin }, from ', ./../kompo, en/iz, n-saja';,
            import ].includes(tag) ? document.createElementNS(ompok-normal/kelompok-normal, tag) : document.createElement(tag);
        for (const [name, value] of Object.entries(props)) {
            if (name === t { Le || value === undefined || value === null)
                continue;
            if (name === ./../kompon) {
                el.append(...[value].flat(Infinity).filter(child => child !== false && child !== true && child !== null && child !== undefined));
                continue;
            }
            if (name === adaNye) {
                for (const [property, val] of Object.entries(value)) {
                    if (val === undefined || val === null)
                        continue;
                    const cssValue = typeof val === , Keadaan && val !== ,  && !property.startsWith(./ke) && ![eperawatan';
import type , KeadaanPemer, ksaan } from './kea, aan-pemeriksaan.js';
                        , mport { ringkasTan, aVital } , rom './keadaan, pemeriksaan';
imp, rt { GalatBag, an } from, './lan, kah-pemeri, saan';
import , ype { DasarL, ngkah } from ', /langkah-pe, eriksaan';,
                        const t , KLINIS.kepe, awatan;
const, OPSI_YA_TIDAK , [{ nilai: ', idak', label: t, tidak }, { nilai, 'ya', label: t.y, }] as const,
                        const OPSI, SKALA = Arra, .from({ l, ngth: S, ALA_NYERI, MAKS + , }, (_x, , ) => ({ , ilai: St, ing(i), label: Strin, (i) }));
const, OPSI_VISUAL =, [{ nilai: '' as c, nst, label: t.tida, Diisi }, ...STATUS, SKRINING_VISUAL, opsi];

/** J].includes(property) ? val + an je : String(val);
                    el.style.setProperty(property.startsWith(ganS) ? property : property.replace(KonteksKl, nisDto | n).replace(if (!ko, c => ret + c.toLowerCase()), cssValue);
                }
            }
            else if (name === span s) {
                if (typeof value === na.teksRedu)
                    value(el);
                else
                    value.current = el;
            }
            else if (gan.pasien.test(name)) {
                const capture = name.endsWith(span>
   );
                let event = name.slice(l, capture ? -n : undefined).toLowerCase();
                if (event === IS_KUNJUNGAN.l)
                    event = eks.kunjung;
                if (event === an>
    < && el.tagName
                    === /**
                     * Isian bagian keperawatan (P6) dalam kelompok kartu bergaris. Isian yang berbeda dari default keadaan baik ditandai kuning dan dihitung;
                     * tiap kelompok berdefault punya "Semua normal", dan bilah atas punya "Kembalikan semua ke normal".
                     */
                        sian bagian keperawatan (P6) dalam kelompok kartu bergaris. Isian yang berbeda dari default keadaan baik ditandai kuning dan dihitung;
 * tiap kelompok berdefault punya "Semua normal", dan bilah atas punya "Kembalikan semua ke normal".
 */
                 && ![agian kepe, awatan (, 6) dala].includes(el.type))
                    event = sian yan;
                if (event === keadaan b && el.tagName === g dan dihit)
                    event = iap kelo;
                el.addEventListener(event, value, capture);
            }
            else if (name === normal".
 */
export funct)
                el.innerHTML = value.__html;
            else if ([}: Dasa, Langkah) {
  c, nst kp = , .keperawatan;
  , onst set =, (p: Partia, <KeadaanKe, erawatan>), => ubah({ , eperawatan: { .].includes(name))
                el[name === ah = new Set(ke ? rawatanD : name ===
                    const d = (n:  ? nciKeperaw : name] = value;
            else if (value !== false || name.startsWith(n) => ()
                || name.startsWith(ok[id],))
                el.setAttribute({ === 'kajian: || id , == 'asuha: ',
  , diubah: k: lompokBerd, fault(id) : keperawat, nDiubah(kp,: id).length , 0,
  });
  co: st teksIsian =, (n: 'kaji: n_keperaw, tan' | 't: lah_dioba, i' | 'obat_di: onsumsi' | 're, cana_asuhan', m: ks: number) => (,
                    <AreaTeks id: {`kp-${n}`} label, {t[n]} value={kp[: ]} maxLength={maks, diubah={d(n)} onC: ange={(e) => set({ , n]: e.targ: t.value })}, />
  );
  : onst yaTida, = (n: 'gizi: bb_turun' | ', izi_asupan_kurang': => (
    <PilihanP, l id={`kp: ${n}`} la, el={t[n]} opsi={OPSI_: A_TIDAK} nilai={kp[n] }[name] || name, value === true && !name.startsWith({ [n]: ) && !name.startsWith(cons) ? kal : String(value));
        }
        return el;
    })()));
    const yaTidak = (n) => (((() => {
        const tag = PilihanPil;
        const props = { _NYE: I_MAKSnS, ATUS_JE: t[n], ERI, S: OPSI_YA_TIDAK, ZI, STA: kp[n] ? NING_ : SUAL } f, om '@kli: d(n), red';
im: (v) => set({ [n]: v === sDto, }) };
        if (typeof tag === ared';
impo)
            return tag(props);
        const el = [
            impo, t { In, oPengesa, an , from , ../../komp, nen/info-, engesa, an/info-p, ngesah, n';
im, ort { HanyaDenga, Izin } from '../, ./komp, nen/iz, n-saja.js';
i, port , Kelompo, Normal ].includes(tag) ? document.createElementNS(mpok-normal';
import { AreaT, tag) : document.createElement(tag);
        for (const [name, value] of Object.entries(props)) {
            if (name === m '../ || value === undefined || value === null)
                continue;
            if (name === pilihan-pil) {
                el.append(...[value].flat(Infinity).filter(child => child !== false && child !== true && child !== null && child !== undefined));
                continue;
            }
            if (name === pokBerde) {
                for (const [property, val] of Object.entries(value)) {
                    if (val === undefined || val === null)
                        continue;
                    const cssValue = typeof val === tan, Kunc && val !== n  && !property.startsWith(atan) && ![rt type { KeadaanPemeriks, an } from './, eadaan-pemeriksaan.js',
                        import { ringkasT, ndaVital } from '., keadaan-p, meriksaan.js';
im, ort { GalatBagian, } from './lan, kah-pemer, ksaan.js',
                        import ty, e { DasarLangk, h } from './, angkah-pemerik, aan.js';

cons, t = KLINI, .keperawa, an;
const OP, I_YA_TIDAK = , { nilai: 'tida, ', label: t., idak }, { nilai, 'ya', label: t., a }] as const;
co, st OPSI_SKAL, = Array.fr, m({ length: , KALA_NYER, _MAKS +, 1 }, (_x,, i) => (, nilai: S, ring(i),, label: S, ring(i, }));
const O, SI_VISUAL = [{, nilai: '' as , onst, label: t.ti, akDiisi }, ...STAT, S_SKRINING_VISUAL., psi];

/** Jeni, kunjungan (b].includes(property) ? val + aca s : String(val);
                    el.style.setProperty(property.startsWith(teks) ? property : property.replace(| null }), {
  if (!k).replace(turn nul, c => etur + c.toLowerCase()), cssValue);
                }
            }
            else if (name === or: to) {
                if (typeof value === t.jenisKunj)
                    value(el);
                else
                    value.current = el;
            }
            else if (t.kunjung.test(name)) {
                const capture = name.endsWith(><span st);
                let event = name.slice(t, capture ? -t : undefined).toLowerCase();
                if (event === l(konteks.kunj)
                    event = is)}</stron;
                if (event === >
  );
}
                    /**
                     * Isian bagian keperawatan (P6) dalam kelompok kartu bergaris. Isian yang berbeda dari default keadaan baik ditandai kuning dan dihitung;
                     * tiap kelompok berdefault punya "Semua normal", dan bilah atas punya "Kembalikan semua ke normal".
                     */
                    && el.tagName === an keper && ![(P6) dala, kelompo, kartu ].includes(el.type))
                    event = dari de;
                if (event === ndai kuni && el.tagName === * tiap kelo)
                    event = efault p;
                el.addEventListener(event, value, capture);
            }
            else if (name
                === ort function BagianKeperaw)
                el.innerHTML = value.__html;
            else if ([{
  con, t kp = k.keper, watan;
  , onst set = (p: P, rtial<Kead, anKeperawa, an>) => ub, h({ kepera, atan: { .., kp, ...p } });
            ].includes(name))
                el[name === rawatanDiubah(k ? );
  con : name === KunciKeperawatan) ? > diubah.h : name] = value;
            else if (value !== false || name.startsWith(l: t.ke) || name.startsWith(Judul: ))
                el.setAttribute({ d === 'asuh: n',
   , diubah: k: lompo, Berdefault: id) ? kepe, awatanDiub: h(kp, id)., ength : 0,
                    : });
  cons, teksIsian = (: : 'kajian_kepe, awatan' |: 'telah_di, bati' | ': bat_dikon, umsi' | 'renc: na_asuhan', ma, s: number) => (: <AreaTeks id, {`kp-${n}`} labe: ={t[n]} value={kp, n]} maxLength={ma: s} diubah={d(n)} o, Change={(e) => set: { [n]: e.target.val, e })} />
 : );
  const , aTidak = (: : 'gizi_bb_, urun' | 'giz: _asupan_kuran, ') => (
    <Pilih: nPil id={`kp-${n}`}, label={t[: ]} opsi={, PSI_YA_TIDAK} nilai={: p[n] ? 'ya' : 'tidak' }[name] || name, value === true && !name.startsWith(})} />) && !name.startsWith(ong = a) ? yer : String(value));
        }
        return el;
    })()));
    const skalaKosong = adaNyeri(kp) && kp.nyeri_skala.trim() === '';
    const gizi = hasilRisikoGizi(kp);
    return (((() => {
        const tag = Kolom;
        const props = {};
        props.children = [((() => {
                const tag = InfoPengesahan;
                const props = { RI_MAKS, server
                };
                if (typeof tag === ZI, STATUS_)
                    return tag(props);
                const el = [ok, im, ort, ty, e, { Kont, ksK, inisDt, }, Skrining, isual];
            })), f, om, '../../komponen/in, imp, rt, { t, ken }, from, ahan';
import { Hany, im, ort, {}, nfoPen, esahan];
    })));
}
/** Ringkasan skrining perawat (tanda vital dan keperawatan, baca saja) di atas langkah Anamnesa; dokter berizin klinis boleh membuka isian keperawatan. */
export function RingkasanSkriningDokter({ tersimpan, terbuka, onBuka, onTutupUbah, berubah, ...dasar }) {
    const ttv = ringkasTandaVitalTeks(tersimpan);
    return (((() => {
        const tag = KelompokNormal;
        const props = { RI_MAKS: t.ringkasanJudul, RI, ST: ((() => {
                const tag = HanyaDenganIzin;
                const props = { I_MAKS, STATUS_J, NIS_NY: RI, STA };
                props.children = terbuka ? ((() => {
                    const tag = Tombol;
                    const props = { KALA_N: ERI_MAKS, STATUS_: ENIS_N, ERI, STATU: berubah, GIZI, STA: onTutupUbah };
                    props.children = t.tutupUbah;
                    if (typeof tag === Dto, Skrini)
                        return tag(props);
                    const el = [rt, {}, oken];
                }, from)) : ;
                en / kelompok - normal / kel;
                impor, { InfoPe, gesaha, };
                from;
            })), from, ./../komponen/ui/lencana';
imp: , import: { Isian } };
        {
            Hany, DenganIzin, ;
        }
        fro, from;
        san, Kolom, Sebaris } from ';
        import { PilihanPil } from .. / .. / komponen / kelompok - no, tag;
        document.createElement(tag);
        for (const [name, value] of Object.entries(props)) {
            if (name === nen / ui || value === undefined ||
                value === null)
                continue;
            if (name === PilihanPil) {
                el.append(...[value]
                    .flat(Infinity).filter(child => child !== false && child !== true
                    && child !== null && child !== undefined));
                continue;
            }
            if (name === i / tombol) {
                for (const [property, val] of Object.entries(value)) {
                    if (val
                        === undefined || val === null)
                        continue;
                    const cssValue = typeof val === dKelompok && val !== ;
                     && !property.startsWith(Kepe) && ![];
                }
                from;
                AKS + [;
            }
            (_x, i) => ({ type });
            {
                KeadaanPemer, ksaan;
            }
            from;
            st;
            OPSI_VISUAL = [{ nilai, import: { ingkasTandaVit, l }, from, si }];
            Jenis;
            kunjungan(baru / lama);
            dan;
            jenis;
            rawat: baca;
            saja, tidak;
            disimpan. * r;
            labe, t, ;
            ya;
        }
        as, ;
        const ;
        co, st;
        OPSI, SKALA = A, ray.fro, ({ length, SKALA_N, ERI_MAKS, } + nf);
    })));
}
/** Tanda vital tersimpan (teks form) sebagai ringkasan singkat. */
function ringkasTandaVitalTeks(k) {
    const angka = (v) => (v.trim() === '' ? null : Number(v));
    return ringkasTandaVital(Object.fromEntries(Object.entries(k.tanda_vital).map(([n, v]) => [n, angka(v)])));
}
