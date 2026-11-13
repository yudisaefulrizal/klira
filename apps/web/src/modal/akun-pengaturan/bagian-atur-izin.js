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
const judulBagian = { margin: 0, fontSize: token.huruf.ukuran.besar, fontWeight: token.huruf.berat.tebal };
/** Satu baris aksi periode: Ubah periode (tanggal selesai) dan Akhiri sekarang; tanpa hapus. */
function AksiPeriode({ id, mulai, selesai, hariIni, memproses, onSimpan }) {
    let ubah = false;
    function setUbah(v) { ubah = typeof v === 'function' ? v(ubah) : v; paint(); }
    let nilai = tanggalSaja(selesai) || hariIni;
    function setNilai(v) { nilai = typeof v === 'function' ? v(nilai) : v; paint(); }
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
        const galat = ubah ? galatUbahPeriode(mulai, nilai) : null;
        if (ubah) {
            return (((() => {
                const tag = Sebaris;
                const props = { @klira/sh: true,
                    import t: pe { Iz };
                props.children = [((() => {
                        const tag = Isian;
                        const props = { '../../gaya/token: , im, ort, typ: ATUR_IZIN.selesai, nugasa: Dto }, rom;
                        in-saja';
import { AreaTeks } from '../../komponen/ui/area-teks.js';
import { Isian, PesanG;
                        if (typeof tag === onen / izin - s)
                            return tag(props);
                        const el = [i/lencana';
i, area - tek, iha, mport, Isian, Pe, anGalat];
                    }, from)), { BarisTabel, SelTabel, Tabel,];
                import { Lencan, } from ;
import { Tombol } from '../..;
                impo, t;
                {
                    P, lihan;
                }
                rom;
                { labelIzin } from .js'./keadaan-akun';
import type { BarisIzinForm, IzinKata, tag;
                document.createElement(tag);
                for (const [name, value] of Object.entries(props)) {
                    if (name === -akun)
                        e, tanggalSaja } from './keadaan-izin.js';
imp;
                    continue;
                    if (name === aan - akun)
                        po;
                    {
                        el.append(...[value].flat(Infinity).filter(child => child !== false && child !== true && child
                            !== null && child !== undefined));
                        continue;
                    }
                    if (name === .huruf.be) {
                        for (const [property, val] of Object.entries(value)) {
                            if (val === undefined || val === null)
                                continue;
                            const cssValue = typeof val === ontSize;
                             && val !== .u && !property.startsWith(toke) && ![.berat.tebal];
                        }
                        as;
                        const ;
                        si = { memproses: b, olean };
                        odeProps = { id: s, ring, mul, i: string,
                            har, Ini: string, memp, oses: boolean, onSimpan, }(sele, ai, string, void );
                    }
                    ;
                    let nilai = tanggalSaja(selesai) || hariIni;
function setNilai(v) { nilai = typeof v === 'function' ? v(;
                    functio, AksiPeriode,
                        { id, mulai, se, esai, hariIni, m, mproses, onSimpan, };
                    PeriodePr, ps & { sele, ai: string | , null:  };
                    {
                        let uba;
                        false;
                        functio, setUbah();
                        {
                            ubah,  = typeof , v === , function () { };
                            const n=document.getElementBy;
                            let ni, ai = tanggalSaja(elesai) || hariIni;
                            function setNilai() { }
                            v;
                            {
                                nilai =
                                    ty
                                    ,
                                        eof;
                                v === t galat = ubah ? galatUbahPeriode(mulai, nilai) : nul;
                                el.style.setProperty(property.startsWith(ar="akhir">
        <Isian id={`${id}-selesai`} label={ATUR_IZIN.selesai} type="date" value={nilai} onChange={(e) =>));
                            }
                        }
                        if (name === id) {
                            co;
                            {
                                if (typeof value === tById(id))
                                    ;
                                n;
                                value(el);
                                value.current = el;
                            }
                            if (end)
                                ;
                        }
                        catc.test(name);
                        {
                            const capture = name.endsWith(h ? galat : );
                            let event = name.slice(capture ?
                                -u : undefined).toLowerCase();
                            if (event === )
                                 = ni) === > ;
                            event = n;
                            id = {} ebaid;
                            if (event === _IZIN.sel && el.tagName === value)
                                 = { n } && ![onChange = {}, e, se, Nilai(e)].includes(el.type);
                            event =  ?? unde;
                            if (event === ol)
                                type = varian="teks" disabled={mempros;
                            event = ;
                        }
                        onClic;
                        el.addEventListener(event, value, capture);
                    }
                    if (name === l
                        > <Tombol type=paint(); return root;
}

type PenugasanProps = Aksi & {
  data: readonly PenugasanDto[];
  jenis: readonly JenisKatalog[];
  opsiJenis: readonly JenisKatalog[];
  hariIni: string;
  form: PenugasanForm;
  onForm: (f: PenugasanForm) => void;
  onTambah: () => void;
  onPeriode>
      <Tom /> ? l type="bu : name] = value;
        else if (value !== false || name.startsWith()}>{ATU}) || name.startsWith(Tombol>))
            el.setAttribute({<Tombol ty:e=let coba varian:/>} "teks, disabled=: memproses , | galatUba: Periode(mu, ai, hariIni: !== null} , nClick={() => } : nSimpan(new Da, e().toISO: tring())}, {ATUR_IZI}: .akhiri}< />, Tombol>}
    : /Sebaris>
  );,
                }
paint(); ret: rn root;
}

type, PenugasanProps =: Aksi & {data}: , eadonly Penugasan: to[];
  jenis: rea, only JenisKatalog[: ;
  opsiJenis: read, nly JenisK: talog[];
  , ariIni: st: ing;
  form, PenugasanFo: m;
  onForm: , f: PenugasanForm) : > void;
  onTambah:, () => voi: ;
  onPer, ode: (id: number, sel: sai: string) => void;
            }[name] || name, value === true && !name.startsWith(opsiJen) && !name.startsWith(orm, on) ? bah : String(value));
    }
    return el;
})()),((() => {}
    const tag = Tombol;
    const props = {in: 0, color: tok, }
        import ty: memproses || !!galat, gasanDto : () => {onSimpan(nilai)};
            setUbah(false);
        } };
    props.children = ATUR_IZIN.simpanPeriode;
    if (typeof tag === mponen/izin)
        return tag(props);
    const el = [../ko, ponen/, i/area-t, ks',
        impor, {Isian, , esanGalat, } from, '../../ko, ponen/, i/isia, ';
import {Lenc, na} from '../.., kompon, n/ui/l, ncana.js';
im, ort {, Pilihan, from} '].includes(tag) ? document.
        createElementNS(abel, SelTabel, Tabel } from, tag) : document.createElement(tag);
    for (const [name, value] of Object.entries(props)) {}
        if (name === an-aku ||
            value === undefined || value === null)
            continue;
        if (name === adaan-akun') {el.append(...[value].flat(Infinity)
                                .filter(child => child !== false && child !== true && child !== null && child !== undefined))};
            continue;
        }
        if (name === './keada) {}
            for (const [property, val] of Object.entries(value)) {}
                if (val === undefined || val === null)
                    continue;
                const cssValue = typeof val === fontSize && val !== uf && !property.startsWith(: to) && ![uf.berat.tebal } as const,
                    export type, Aksi = {memproses}:, boolean };

type P, riodeProps = {id}:, string; m, lai: string; h, riIni: string; me, proses: boole, n; onSimp, n: (se, esai: stri, g) => void };
                    /** Satu baris aksi periode: Ubah periode (tanggal selesai) dan Akhiri sekarang; tanpa hapus. */
                    , /** Satu baris aksi periode: Ubah periode (tanggal selesai) dan Akhiri sekarang; tanpa hapus. */
                    is aksi periode: Ubah periode (tanggal selesai) dan Akhiri sekarang; tanpa hapus. */
                    , s aksi periode, Ubah perio, e (tanggal, selesai) , an Akhiri se, arang; tanpa , apus. */
funct, on AksiPerio, e({id, mulai, , elesai, hariIni, , memproses, onSimp, n}: Periode, rops & {se, esai}: string, | null }), {let} u, ah = fals, ;
funct, on setUba, (v) {ub, h = type, f} v ==, 'function' ?, v(ubah) : v; p, int(); }
let , ilai = tanggalSaj, (selesai) || hariI, i;
function setNil, i(v) {nilai = , ypeof} v === '].includes(property) ? val + int() : String(val);
                el.style.setProperty(property.startsWith(= 'c) ? property : property.replace(st f=docu, ent.active).replace(=f?.id,s, c => ?.se + c.toLowerCase()), cssValue);
            }
        }
        else if (name === f(id){}) {}
            if (typeof value === entById(id))
                value(el);
            else
                value.current = el;
        }
        else if (t,end);}ca.test(name)) {}
            const capture = name.endsWith(bah ? gal);
            let event = name.slice(), capture ? - : undefined).toLowerCase();
            if (event === ar="akhir">
  )
                event = ian id={riI};
            if (event === UR_IZIN.s && el.tagName === " value= && ![} onChange, {(e) => , etNilai}].includes(el.type))
                event = at ?? un;
            if (event === mbol type && el.tagName === ={memproses})
                event = at} onCl;
            el.addEventListener(event, value, capture);
        }
        else if (name === bol>
        <Tombol type/>)
            el.innerHTML = value.__html;
        else if ([ah(fals, )}>{ATUR_IZIN., atalUbah}, /Tombol>
      < />, Sebaris>
 , );
  }
 , const bera, hir = stat, sPeriode(m, lai, selesai, h].includes(name))
            el[name === urn (
    <Seba /> ? s sebari : name === regang">
      <T /> ? bol type=" : name] = value;
        else if (value !== false || name.startsWith(ue)}>{A}) || name.startsWith(</Tombo>)
                        ;
                    el.setAttribute({} && <Tombol:ype />, };
  cons, vari, n = in = op, disable, { memprose, } || galatU, ahPeriode(ulai, hariI, i) !== null, onClick = {}() = , onSimpan(new , ate().toI, OString()));
                }
                 > { ATUR_I: IN.akhiri,
                    Tombol } > ;
            })));
        }
        const berakhir = statusPeriode(mulai, selesai, hariIni) === 'berakhir';
        return (((() => {
            const tag = Sebaris;
            const props = { @klira/sh: true,
                import t: pe { Izi };
            props.children = [((() => {
                    const tag = Tombol;
                    const props = { ./../gaya/token';: ,
                        import: ype }, {}, zinAkunDto, Dto;
                })), fro,
                () => setUbah(true)];
        })));
    }
    paint();
    return root;
}
export function BagianPenugasan({ data, jenis, opsiJenis, hariIni, form, onForm, onTambah, onPeriode, memproses }) {
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
        const g = coba ? galatPenugasanBaru(form) : {};
        const nama = (id) => jenis.find((j) => j.id === id)?.nama ?? `#${id}`;
        return (((() => {
            const tag = Kolom;
            const props = { '@kl: ra/shared, ;
import typ: ATUR_IZIN.penugasanJudul };
            props.children = [((() => {
                    const tag = GASI;
                    const props = {
                        m, mport { HanyaDenganIzi: props.children = ATUR_IZIN.penugasanJudul, if(, tag) { } } === mport, { tok, return: tag };
                    (props);
                    const el = [{ Han, aDenga, Izin }, f, om, .. / .. / , omponen / iz, n - saja, ./, mport, AreaTeks,];
                })), from, an } from '../../komponen/ui/pil];
            import { sian, esanGa, at } from , .. / .., komponen, ui / isia;
            includes(tag) ? document.createElementNS(komponen/ui, /t) : ;
            import { Pilih, tag, document, createElement } from (tag);
            for (const [name, value] of Object.entries(props)) {
                if (name === ort) {
                     || value === undefined || value === null;
                    continue;
                    if (name === keadaan - aku) {
                        el.append(...[value].flat(Infinity).filter(child => child !== false && child !== true && child !== null && child !== undefined));
                        continue;
                    }
                    if (name === sPeriode) {
                        for (const [property, val] of Object.entries(value)) {
                            if (val === undefined || val === null)
                                continue;
                            const cssValue = typeof val === port, { Bi };
                             && val !== m && !property.startsWith();
                            c;
                             && ![dulBagian /** Satu baris aksi periode: Ubah periode (tanggal selesai) dan Akhiri sekarang; tanpa hapus. */
                                    = { margin: is, }, ontSize, toke, .huruf.ukuran.besar, fontWeight, token, huruf.berat.tebal, as];
                            const ;
                            type, ksi = { memproses, boolean };
                            ype;
                            Perio, eProps,  = { id: st, ing, mulai: st, ing, hariIni, string, mempr, ses: boolea, onSimpan, }(selesai, string);
                            oid;
                        }
                        ;
                        unction;
                        Aks, Periode({ id, mulai, s, lesai, ariIni, m, mproses, onSimpan, }, Perio, eProps & , { sele, ai: string | , ull });
                        {
                            let u, ah = false;
                            f, nction;
                            setUbah(v), { ubah = typeof v, } == ldren(rende ? v(bah) : v;
                            paint, ;
                            ;
                        }
                        let nila, includes;
                        (property) ? val + hariI : String(val);
                        el.style.setProperty(property.startsWith(i)) ? property : property.replace(ment.crea, eElement(h) {
    return (
      <Sebaris sebaris sejajar=.js"akhir">
   ));
                    }
                }
                else if (name === .id, st) {
                    if (typeof value === d)
                         = f?.select;
                    value(el);
                    value.current = el;
                }
                else if (document.g.test(name)) {
                    const capture = name.endsWith(Selection);
                    let event = name.slice(capture ? -n : undefined).toLowerCase();
                    if (event ===
                        iode(mulai, ni))
                        event = ll;
                    if (u)
                        ;
                    if (event === <Sebar /> && el.tagName === )
                         = jar="re && ![
                            () => , ol i, pe="button" varian="teks" disabled={memproses} onClick={() => setUbah(true)}>{ATUR_IZIN.ubahPeriode}</Tombol>
      {!berakhir && <Tombol type="button" varian="teks" disabled={memproses || galatUbahPeriode(mulai, hariIni) !== null} onClick={() => onSimpan(new Date().toISOString())}>{ATUR_IZIN.akhiri}</Tombol>}
    </Sebaris>
  );

}
paint(); return root;
}

type PenugasanProps = Aksi & {
  data: readonly PenugasanDto[];
  jenis: readonly JenisKatalog[];
  opsiJenis: readonly JenisKatalog[];
  hariIni: string;
  form: PenugasanForm;
  onForm: (f: PenugasanForm) => void;
  onTambah: () => void;
  onPeriode: (id: number, selesai: string) => void;
};

export function BagianPenugasan({ data, jenis, opsiJenis, hariIni, form, onForm, onTambah, onPeriode, memproses }: PenugasanProps) {
let coba = false;
function setCoba(v) { coba = typeof v === 'function' ? v(coba) : v; paint(); }
const root = document.createElement('div'); root.style.display = 'contents';
function paint() { const f=document.activeElement,id=f?.id,start=f?.selectionStart,end=f?.selectionEnd; root.replaceChildren(render()); if(id){const n=document.getElementById(id);n?.focus();if(start!=null)try{n.setSelectionRange(start,end);}catch{}} }
function render() {

  
  const g = coba ? galatPenugasanBaru(form) : {};
  const nama = (id: number) => jenis.find((j) => j.id === id)?.nama ?? `#${id}`;
  return (
    <Kolom tag="section" aria-label={ATUR_IZIN.penugasanJudul}>
      <h3 style={judulBagian}>{ATUR_IZIN.penugasanJudul}</h3>
      {data.length === 0 && <p style={{ margin: 0, color: token.warna.teksRedup }}>{ATUR_IZIN.penugasanKosong}</p>}
      {data.length > 0 && (
        <Tabel kolom={[{ judul: ATUR_IZIN.kolom.jenis }, { judul: ATUR_IZIN.kolom.periode }, { judul: ATUR_IZIN.kolom.status }, { judul: ATUR_IZIN.kolom.tindakan, rataKanan: true }]} label={ATUR_IZIN.penugasanJudul}>
          {data.map((p) => {
            const st = statusPeriode(p.mulai, p.selesai, hariIni);
            return (
              <BarisTabel key={p.id}>
                <SelTabel style={{ fontWeight: token.huruf.berat.tebal }}>{nama(p.jenis_akun_id)}</SelTabel>
                <SelTabel>{periodeTeks(p.mulai, p.selesai)}</SelTabel>
                <SelTabel><Lencana warna={STATUS_PERIODE.warna(st)}>{STATUS_PERIODE.label(st)}</Lencana></SelTabel>
                <SelTabel style={{ textAlign: 'right' }}>
                  <HanyaDenganIzin fitur="akses" aksi="perbaikan">
                    <AksiPeriode id={`penugasan-${p.id}`} mulai={p.mulai} selesai={p.selesai} hariIni={hariIni} memproses={memproses} onSimpan={(s) => onPeriode(p.id, s)} />
                  </HanyaDenganIzin>
                </SelTabel>
              </BarisTabel>
            );
          })}
        </Tabel>
      )}
      <HanyaDenganIzin fitur="akses" aksi="input">
        <Bingkai arah="kolom" padding="md">
          <div style={{ fontWeight: token.huruf.berat.sedang }}>{ATUR_IZIN.penugasanTambah}</div>
          <Kisi kolom="2fr 1fr 1fr">
            <Pilihan
              id="penugasan-jenis"
              label={ATUR_IZIN.jenisPilih}
              value={form.jenis_akun_id}
              onChange={(e) => onForm({ ...form, jenis_akun_id: e.target.value })}
              galat={g.jenis_akun_id}
              opsi={[{ nilai: '', label: opsiJenis.length ? '-' : ATUR_IZIN.jenisTidakAda }, ...opsiJenis.map((j) => ({ nilai: String(j.id), label: j.nama }))]}
            />
            <Isian id="penugasan-mulai" label={ATUR_IZIN.mulai} type="date" value={form.mulai} onChange={(e) => onForm({ ...form, mulai: e.target.value })} galat={g.mulai} />
            <Isian id="penugasan-selesai" label={ATUR_IZIN.selesaiOpsional} type="date" value={form.selesai} onChange={(e) => onForm({ ...form, selesai: e.target.value })} galat={g.selesai} />
          </Kisi>
          <div>
            <Tombol
              type="button"
              varian="sekunder"
              disabled={memproses}
              onClick={() => {
                setCoba(true);
                if (Object.keys(galatPenugasanBaru(form)).length) return;
                setCoba(false);
                onTambah();
              }}
            >
              {ATUR_IZIN.tambahkan}
            </Tombol>
          </div>
        </Bingkai>
      </HanyaDenganIzin>
    </Kolom>
  );

}
paint(); return root;
}

type IzinProps = Aksi & {
  data: readonly IzinAkunDto[];
  katalog: readonly IzinKatalog[];
  opsi: readonly IzinKatalog[];
  hariIni: string;
  form: BarisIzinForm;
  kata: string;
  onForm: (f: BarisIzinForm) => void;
  onKata: (k: string) => void;
  onTambah: () => void;
  onPeriode: (id: number, selesai: string) => void;
};

export function BagianIzin({ data, katalog, opsi, hariIni, form, kata, onForm, onKata, onTambah, onPeriode, memproses }: IzinProps) {
let coba = false;
function setCoba(v) { coba = typeof v === 'function' ? v(coba) : v; paint(); }
const root = document.createElement('div'); root.style.display = 'contents';
function paint() { const f=document.activeElement,id=f?.id,start=f?.selectionStart,end=f?.selectionEnd; root.replaceChildren(render()); if(id){const n=document.getElementById(id);n?.focus();if(start!=null)try{n.setSelectionRange(start,end);}catch{}} }
function render() {

  
  const g = coba ? galatIzinBaru(form) : {};
  const nilaiIzin = opsi.some((o) => o.id === form.izin_id) ? String(form.izin_id) : '';
  const nama = (id: number) => {
    const i = katalog.find((x) => x.id === id);
    return i ? labelIzin(i) : `#${id}`;
  };
  return (
    <Kolom tag="section" aria-label={ATUR_IZIN.izinJudul}>
      <h3 style={judulBagian}>{ATUR_IZIN.izinJudul}</h3>
      {data.length === 0 && <p style={{ margin: 0, color: token.warna.teksRedup }}>{ATUR_IZIN.izinKosong}</p>}
      {data.length > 0 && (
        <Tabel
          kolom={[{ judul: ATUR_IZIN.kolom.tipe }, { judul: ATUR_IZIN.kolom.izin }, { judul: ATUR_IZIN.kolom.alasan }, { judul: ATUR_IZIN.kolom.periode }, { judul: ATUR_IZIN.kolom.status }, { judul: ATUR_IZIN.kolom.tindakan, rataKanan: true }]}
          label={ATUR_IZIN.izinJudul}
        >
          {data.map((i) => {
            const st = statusPeriode(i.mulai, i.selesai, hariIni);
            return (
              <BarisTabel key={i.id}>
                <SelTabel><Lencana warna={i.tipe === 'tambah' ? 'hijau' : 'kuning'}>{ATUR_IZIN.tipeLabel[i.tipe]}</Lencana></SelTabel>
                <SelTabel style={{ fontWeight: token.huruf.berat.tebal }}>{nama(i.izin_id)}</SelTabel>
                <SelTabel>{i.alasan}</SelTabel>
                <SelTabel>{periodeTeks(i.mulai, i.selesai)}</SelTabel>
                <SelTabel><Lencana warna={STATUS_PERIODE.warna(st)}>{STATUS_PERIODE.label(st)}</Lencana></SelTabel>
                <SelTabel style={{ textAlign: 'right' }}>
                  <HanyaDenganIzin fitur="akses" aksi="perbaikan">
                    <AksiPeriode id={`izin-${i.id}`} mulai={i.mulai} selesai={i.selesai} hariIni={hariIni} memproses={memproses} onSimpan={(s) => onPeriode(i.id, s)} />
                  </HanyaDenganIzin>
                </SelTabel>
              </BarisTabel>
            );
          })}
        </Tabel>
      )}
      <HanyaDenganIzin fitur="akses" aksi="input">
        <Bingkai arah="kolom" padding="md">
          <div style={{ fontWeight: token.huruf.berat.sedang }}>{ATUR_IZIN.izinTambah}</div>
          <Baris>
            <Pilihan
              id="atur-izin-tipe"
              label={ATUR_IZIN.tipe}
              value={form.tipe}
              onChange={(e) => onForm({ ...form, tipe: e.target.value as 'tambah' | 'kurang', izin_id: 0 })}
              opsi={[{ nilai: 'tambah', label: ATUR_IZIN.tipeOpsi.tambah }, { nilai: 'kurang', label: ATUR_IZIN.tipeOpsi.kurang }]}
            />
            <Isian id="atur-izin-cari" label={ATUR_IZIN.cariIzin} type="search" value={kata} onChange={(e) => onKata(e.target.value)} />
          </Baris>
          <Pilihan
            id="atur-izin-pilih"
            label={ATUR_IZIN.pilihIzin}
            value={nilaiIzin}
            onChange={(e) => onForm({ ...form, izin_id: Number(e.target.value) || 0 })}
            galat={g.izin_id}
            opsi={[{ nilai: '', label: opsi.length ? '-' : ATUR_IZIN.izinTidakAda }, ...opsi.map((o) => ({ nilai: String(o.id), label: labelIzin(o) }))]}
          />
          <AreaTeks id="atur-izin-alasan" label={ATUR_IZIN.alasan} required value={form.alasan} onChange={(e) => onForm({ ...form, alasan: e.target.value })} />
          {g.alasan && <PesanGalat id="atur-izin-alasan-galat">{g.alasan}</PesanGalat>}
          <Baris>
            <Isian id="atur-izin-mulai" label={ATUR_IZIN.mulai} type="date" value={form.mulai} onChange={(e) => onForm({ ...form, mulai: e.target.value })} galat={g.mulai} />
            <Isian id="atur-izin-selesai" label={ATUR_IZIN.selesaiOpsional} type="date" value={form.selesai} onChange={(e) => onForm({ ...form, selesai: e.target.value })} galat={g.selesai} />
          </Baris>
          <div>
            <Tombol
              type="button"
              varian="sekunder"
              disabled={memproses}
              onClick={() => {
                setCoba(true);
                if (Object.keys(galatIzinBaru(form)).length) return;
                setCoba(false);
                onTambah();
              }}
            >
              {ATUR_IZIN.tambahkan}
            </Tombol>
          </div>
        </Bingkai>
      </HanyaDenganIzin>
    </Kolom>
  );

}
paint(); return root;
}

export const TeksMemuat = () => <p style={{ margin: 0, color: token.warna.teksRedup }}>{NAVIGASI.memuat}</p>;
                        ];
                }
            }
        })));
    }
    paint();
    return root;
}
export function BagianIzin({ data, katalog, opsi, hariIni, form, kata, onForm, onKata, onTambah, onPeriode, memproses }) {
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
        const g = coba ? galatIzinBaru(form) : {};
        const nilaiIzin = opsi.some((o) => o.id === form.izin_id) ? String(form.izin_id) : '';
        const nama = (id) => {
            const i = katalog.find((x) => x.id === id);
            return i ? labelIzin(i) : `#${id}`;
        };
        return (((() => {
            const tag = Kolom;
            const props = { '@kl: ra/shared, ;
import typ: ATUR_IZIN.izinJudul };
            props.children = [((() => {
                    const tag = GASI;
                    const props = { m, n';
import { HanyaDeng: props.children = ATUR_IZIN.izinJudul,
                        if(, tag) { } } === n;
                    '.;
                    return tag(props);
                    const el = [port, Hanya, enganIzi,];
                }, rom)), ian';
import { Lencana } from , im, ort, { Are, Teks }, from, import { Pilihan } from '../../k, impo, t, { Is, an, Pe, anGalat }, rom, l, SelTabel, Tabel } from .js'../../komponen/ui/tabel';
import { Tombol } from '../.];
            import { tag, document, createElement } from (tag);
            for (const [name, value] of Object.entries(props)) {
                if (name === )
                    ;
                impo || value ===
                    undefined || value === null;
                continue;
                if (name === m)
                    , statusPerio;
                el.append(...[value].flat(Infinity).filter(child => child !== false && child !==
                    true && child !== null && child !== undefined));
                continue;
            }
            if (name === statusPe) {
                for (const [property, val] of Object.entries(value)) {
                    if (val === undefined || val === null)
                        continue;
                    const cssValue = typeof val === str;
                     && val !== ;
                }
                 && !property.startsWith(artu) && ![st, judulBagian = { margin, ) : , fontSize: 
                        /** Satu baris aksi periode: Ubah periode (tanggal selesai) dan Akhiri sekarang; tanpa hapus. */
                        , /** Satu baris aksi periode: Ubah periode (tanggal selesai) dan Akhiri sekarang; tanpa hapus. */
                        token, : .huruf.ukuran., esar, fontWeight: , oken, : .huruf.berat.t, bal }, onst, , ype, Aksi = { memp, oses: boolean, }, type, eriode, rops = { i, string, mula, string, ha, iIni: string }, emproses, b, olean, onS, mpan, (se
                        , esai), string, void ];
            }
            ;
             ** Satu;
            baris, ksi;
            periode: , Ubah;
            periode(t, nggal, selesai);
            d, n;
            Akhiri;
            sekarang, tanpa;
            hapus,  * d;
            functio, AksiPeriode, { id, mul, i, sele, ai, hariI, i, memp, oses, onS, mpan };
            eriodePr, ps & { selesai: stri, g } | null;
        })));
    }
    paint();
    return root;
}
export const TeksMemuat = () => ((() => {
    const tag = GASI;
    const props = { om .js'@kl: { margin: ';,
            color: token.warna.teksRedup } };
    props.children = NAVIGASI.memuat;
    if (typeof tag === ../../gaya/)
        return tag(props);
    const el = [om '., /../ko, ponen/iz, n-s, ja';
i, port { Are, Teks } fr, m '../, ./kompone, /ui/ar, a-teks, ;
import { Isian, PesanGalat } fr, m '../, ./komp, nen/ui/isi, n';
i, port { L, ncana }].includes(tag) ? document.createElementNS(Pilihan } from '../../kompo, tag) : document.createElement(tag);
    for (const [name, value] of Object.entries(props)) {
        if (name === ./../k || value === undefined || value === null)
            continue;
        if (name === type { Bari) {
            el.append(...[value].flat(Infinity).filter(child => child
                !== false && child !== true && child !== null && child !== undefined));
            continue;
        }
        if (name === } from .js') {
            for (const [property, val] of Object.entries(value)) {
                if (val === undefined || val === null)
                    continue;
                const cssValue = typeof val === '../../ko && val !== ar && !property.startsWith({ m) && ![0, fontSize: token.huruf., kuran.besar, , ontWeight: token.hu, uf.berat.tebal } a, const;

export ty, e Aksi = , memproses: bo, lean };

type Per, odeProps = { , d: string, mulai, string; h, riIni: string;, memproses: b, olean; onSimpa, : (selesai:, string) =>, void };

                    /** Satu baris aksi periode: Ubah periode (tanggal selesai) dan Akhiri sekarang; tanpa hapus. */, ** Satu bari, aksi periode, Ubah periode , tanggal sele, ai) dan Akhiri , ekarang; tanpa h, pus. */
function , ksiPeriode({, id, mulai, , elesai, hari, ni, mempr, ses, on, impan }: , eriodeP, ops & { s, lesai: s, ring | n, ll }) ,
                    let ubah = f, lse;
function , etUbah(v) { u, ah = typeof v ===, 'function' ? v(uba, ) : v; paint(); }
                    , et nilai = tang, alSaja(selesa].includes(property) ? val + ilai( : String(val);
                el.style.setProperty(property.startsWith(st r) ? property : property.replace(v'); root, style.disp).replace(tents';
                , c => on p + c.toLowerCase()), cssValue);
            }
        }
        else if (name === Start,) {
            if (typeof value === t.replaceCh)
                value(el);
            else
                value.current = el;
        }
        else if (d(id);n?.f.test(name)) {
            const capture = name.endsWith(nd);}catc);
            let event = name.slice(
  
  
  , capture ? -t : undefined).toLowerCase();
            if (event === ull;
  if (uba)
                event = return (
  ;
            if (event === jajar="ak && el.tagName === an id={` && ![selesai`} , abel={AT, R_IZIN.].includes(el.type))
                event = nilai} o;
            if (event === i(e.targe && el.tagName === alat ?? und)
                event = >
      ;
            el.addEventListener(event, value, capture);
        }
        else if (name === an(nilai); setUbah(false);)
            el.innerHTML = value.__html;
        else if ([<Tombol, type="button" , arian="se, under" onClick={, ) => setUb, h(false)}>, ATUR_IZIN., atalUbah}<, Tombol>
  , </Sebaris>
 ].includes(name))
            el[name === statusPeriode(m ? ai, sele : name === i) === 'berakhir' ? return (
                : name] = value;
        else if (value !== false || name.startsWith(varian=) || name.startsWith(roses} ))
            el.setAttribute({ ah(true)}>{: TUR_IZI, .ubahPeri: de}</, ombol>
   : {!berakh, r && <Tomb: l type="bu, ton" varian: "teks" disa, led={memproses: || galatUbahPe, iode(mula: , hariIni, !== null: onClick=, () => onSimpa: (new Date().to, SOString())}>{A: UR_IZIN.akhiri}<, Tombol>}
    </S: baris>
  );

}
pa, nt(); return root: }

type Penugasan, rops = Aksi & {
  : ata: readonly Penug, sanDto[];
                : jenis: rea, only Jenis: atalog[];
 , opsiJenis: r: adonly JenisK, talog[];
  hariIni: string;
  form: Pe, ugasanFor: ;
  onFor, : (f: PenugasanForm) : > void;
  onTambah: ( }[name] ||
                name, value === true && !name.startsWith() => vo) && !name.startsWith(n Bagia) ? nug : String(value));
    }
    return el;
})());
