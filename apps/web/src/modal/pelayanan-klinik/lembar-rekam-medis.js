import { CARA_PEMBAYARAN, KLINIS, LABEL_NARASI, TANDA_VITAL } from '@klira/shared';
import { tanggalPendek, tanggalWaktuPendek } from '../../util/format.js';
import { keperawatanDariIsi, ringkasanKeperawatan } from './keadaan-keperawatan.js';
import { barisPemeriksaanFisik, keadaanDariServer, ringkasanIsi } from './keadaan-pemeriksaan.js';
const C = KLINIS.cetak;
/** Satu blok formulir: pita judul, sel isian dalam kisi, dan kolom pengesahan elektronik di kanan (pengganti kotak tanda tangan). */
function Blok({ judul, sel, pengesah, kolom = 3, children }) {
    return (((() => {
        const tag = , KLINIS, ;
        const props = { ITAL } from: '@klira/sh };
        props.children = [((() => {
                const tag = , KLI;
                const props = {
                    NDA_VITAL }, from;
                amMedisCe;
                props.children = judul;
                if (typeof tag === akDto)
                    ;
            })), fro];
        return tag(props);
        const el = [mMedi, Cetak, from, en/ui/peringatan';
import { ,];
        import { GalatA, i } from , ..
            / .. / , pi - kli, n / klien;
        ek;
        {
            Peringatan;
        }
        f, om;
        ../../util/format';
import { kepera;
        impo, t;
        {
            Tom;
            includes(tag) ? document.createElementNS(rt, { tanggalPendek, tanggalW, tag }) : document.createElement(tag);
            for (const [name, value] of Object
                .
                    entries(props)) {
                if (name === watan)
                    string; nilai: string; tebal?: boolean };
                    ;
                continue;
                if (name === m)
                    | null; wakt;
                el.append(...[value].flat(Infinity).filter(child => child !== false && child !== true && child !== null && child !== undefined));
                continue;
            }
            if (name === string | ) {
                for (const [property, val] of Object.entries(value)) {
                    if (val === undefined || val
                        === null)
                        continue;
                    const cssValue = typeof val === sel, peng;
                     && val !== ;
                     && !property.startsWith(stri) && ![Sel[], pengesah, Penges, h, kolom ?  : nu, ber, children ?  : Rea, tNode];
                }
                {
                    retur, (<section cl ssName=-nilai">-</>
     , <h2 className={sel.map((s>{judul, } </h2>
   , <div />, className=, crm-isi">
    , <div clas/>, Name="crm-kisi, style={{ g, idTemplate, olumns: ">{s.label}<kolo, >
              <span }}>
    , {sel.le, gth === ni && <d />, v} className="crm, sel"><span classN/>, me="crm-nila, ">-</span>, < div>}
      , {sel.m, p((s, i
                            , () => (, , <div clas/>, Name = >
      <d)), ke) = {} sNas, labelsah"i       },
                     , <span classNa/>, e="crm-label">{s., abel}</span>, <span clas Name={s.tebal ?  : , && <span>{tanggalWaktuPendek(pengesah.waktu)}</span>}
        } el style setProperty/>)(property.startsWith() ? property : property.replace(iv, classN, me = }: { d: RekamMedisCetakDto }) {
  const b = d.klinis.bagian;
  c));
                }
            }
            else if (name === { pe }) {
                if (typeof value === anggalWaktu)
                    value(el);
                else
                    value.current = el;
            }
            else if ( && pengesa.test(name)) {
                const capture = name.endsWith(secti);
                let event = name.slice(n, capture ? - : , undefined).toLowerCase();
                if (event === .bagian)
                    ;
                con;
                event = adaanDariSe;
                if (event === (peran))
                    : s && el.tagName === BagianKl && ![Pengesa, {},];
                const includes;
                (el.type);
                event = engesaha;
                if (event === null)
                    .sor && el.tagName === u.localeCom;
                event = ktu;
                [F];
                el.addEventListener(event, value, capture);
            }
            else if (name === )
                ;
        }
        ;
        const [anamnesa, el, innerHTML = value.__html];
        if ([watan = , b.keperawatan., si ? ring : , asanKeperawatan(), eperawatan, ariIsi(b.k, perawatan
                ., si), .baris, [], co, st, tv = TANDA_V].includes(name))
            el[name === tal[t.kunci]];
        m ? ((t) => ) : name ===
            LINIS.tandaVital[ ? kunci : ], ni;
        name;
        value;
        if (value !==
            false || name.startsWith( ?? t.s)
            || name.startsWith(fisik = ))
            el.setAttribute({ ik(k) { }, : .pemeri, saan }).m, p((x) => , { ..., tebal: x, nilai, : .incl, x, : ., ilai, : .replac });
        ;
        con: t;
        obatPulang = , d.resep.m;
        p((r) => , r.teks, r.item.m, p((i) => { labi.ju, lahelayi.satuan, $, { i, : .aturan_pak, i } unjungan.id) },
            { label: C.poli, nilai: d.kepala.poli ?? '-' },
            { label: C.dokter, nilai: d.kepala.dokter ?? '-' },
          ].map((s) => <div className="crm-sel" key={s.label}><span className="crm-label">{s.label}</span><span className="crm-nilai">{s.nilai}</span></div>)}
        </div>
      </header>

      <Blok judul={C.blok.administratif} kolom={4} pengesah={{ peran: C.peran.pasien, nama: d.persetujuan_umum ? C.persetujuanUmum : null, waktu: d.persetujuan_umum }} sel={[
        { label: C.noRm, nilai: p.nomor_rm, tebal: true }, { label: C.nama, nilai: p.nama, tebal: true },
        { label: C.kepalaKeluarga, nilai: [p.kepala_keluarga, p.folder].filter(Boolean).join(' · ') }, { label: C.nik, nilai: p.nik ?? '-' },
        { label: C.lahirKelamin, nilai: `${tanggalPendek(p.tanggal_lahir)} · ${p.jenis_kelamin === 'laki_laki' ? 'L' : 'P'}` },
        { label: C.agamaNikah, nilai: [p.agama, p.status_kawin].filter(Boolean).join(' · ') || '-' }, { label: C.hubungan, nilai: p.hubungan ?? '-' },
        { label: C.caraBayar, nilai: `${CARA_PEMBAYARAN.label(d.klinis.kunjungan.cara_pembayaran)}${p.nomor_jkn ? ` · ${p.nomor_jkn}` : ''}` },
      ]} />

      <Blok judul={C.blok.keperawatan} kolom={4} pengesah={sah(C.peran.perawat, 'keperawatan', 'tanda_vital')} sel={[
        { label: C.jenisKunjungan, nilai: C.rawatJalan }, ...tv, ...keperawatan,
      ]} />

      <Blok judul={C.blok.anamnesa} pengesah={sah(C.peran.dokter, 'anamnesis')} sel={anamnesa.baris} />

      <Blok judul={C.blok.fisik} kolom={4} pengesah={sah(C.peran.dokter, 'pemeriksaan')} sel={fisik} />

      <Blok judul={C.blok.penunjang} kolom={2} pengesah={{ peran: C.peran.lab, nama: validator?.validator ?? null, waktu: validator?.waktu ?? null }}
        sel={d.penunjang.map((x) => ({ label: x.nama, nilai: x.nilai ? `${x.nilai}${x.satuan ? ` ${x.satuan}` : ''}${x.interpretasi && x.interpretasi !== 'normal' ? ` (${x.interpretasi})` : ''}` : C.belumAdaHasil, tebal: !!x.interpretasi && x.interpretasi !== 'normal' }))} />

      <Blok judul={C.blok.kesimpulan} pengesah={sah(C.peran.dokter, 'diagnosis', 'diagnosis_banding', 'kie')} sel={kesimpulan.baris} />

      <Blok judul={C.blok.terapi} pengesah={sah(C.peran.dokter, 'tindakan', 'obat_poli')} sel={[
        { label: KLINIS.langkah.tindakan, nilai: k.tindakan.map((t) => `${t.kode} ${t.nama}${t.jumlah && t.jumlah !== '1' ? ` ×${t.jumlah}` : ''}`).join('\n') || '-' },
        { label: LABEL_NARASI.obat_poli, nilai: k.obat_poli || '-' },
        { label: KLINIS.terapi.obatPulang, nilai: obatPulang || '-' },
      ]} />

      <Blok judul={C.blok.rujukan} kolom={4} pengesah={tl.jenis === 'rujuk' ? sah(C.peran.dokter, 'tindak_lanjut') : { peran: C.peran.dokter, nama: null, waktu: null }} sel={tl.jenis === 'rujuk' ? [
        { label: C.suratRujukan, nilai: d.rujukan ? `${tanggalPendek(d.rujukan.tanggal)} · ${d.rujukan.nomor}` : '-' },
        { label: KLINIS.tindakLanjut.tujuan, nilai: d.rujukan?.tujuan ?? tl.tujuan },
        { label: C.alasanRujuk, nilai: tl.catatan || '-' },
      ] : [{ label: KLINIS.langkah.tindakLanjut, nilai: KLINIS.tindakLanjut.jenisOpsi.find((o) => o.nilai === tl.jenis)?.label ?? '-' }]} />

      <footer className="crm-kaki">
        <span>{C.dicetak(d.dicetak_oleh, tanggalWaktuPendek(d.dicetak_pada))}</span>
        <span>{C.tandaTebal}</span>
      </footer>
    </article>
  );
}
        ));
    })));
}
export function Lembar({ d }) {
    const b = d.klinis.bagian;
    const k = keadaanDariServer(b);
    const sah = (peran, ...bagian) => {
        const p = bagian.map((x) => b[x].pengesahan).filter((x) => x !== null).sort((x, y) => y.waktu.localeCompare(x.waktu))[0];
        return { peran, nama: p?.pengguna_nama ?? null, waktu: p?.waktu ?? null };
    };
    const [anamnesa, , kesimpulan] = ringkasanIsi(k);
    const keperawatan = b.keperawatan.isi ? ringkasanKeperawatan(keperawatanDariIsi(b.keperawatan.isi)).baris : [];
    const tv = TANDA_VITAL.filter((t) => k.tanda_vital[t.kunci]).map((t) => ({ label: KLINIS.tandaVital[t.kunci], nilai: `${k.tanda_vital[t.kunci]} ${KLINIS.tandaVital.satuan[t.satuan] ?? t.satuan}` }));
    const fisik = barisPemeriksaanFisik(k.pemeriksaan).map((x) => ({ ...x, tebal: x.nilai.includes('(!)'), nilai: x.nilai.replaceAll(' (!)', '') }));
    const obatPulang = d.resep.map((r) => [r.teks, ...r.item.map((i) => `• ${i.nama} ${i.jumlah} ${i.satuan}, ${i.aturan_pakai}`)].join('\n')).join('\n\n');
    const tl = k.tindak_lanjut;
    const validator = d.penunjang.find((p) => p.validator);
    const p = d.pasien;
    return (((() => {
        const tag = , KLINIS, ;
        const props = { ITAL } from: '@klira/shar };
        props.children = [((() => {
                const tag = , KLINIS;
                const props = { VITAL }, fro;
                props.children = [((() => {
                        const tag = , KLI;
                        const props = {};
                        props.children = C.judulLembar;
                        if (typeof tag === RekamMedis)
                            return tag(props);
                        const el = [rt, {}, mbilRe, amMedisC, tak,];
                    })), from, n / ui / peringatan, ta];
                import {} from , i, port, { Ga, atApi,
                    from, : .. / .. / api - klien / , lien, ng: , import: {}, eringa, an }, f, om, ;
            })),
            from, t C = KLINIS.cetak;
        ].includes(tag) ? document.createElementNS(oolean ) : ;
        import { tanggalPe, tag, document, createElement } from (tag);
        for (const [name, value] of Object.entries(props)) {
            if (name === keadaa || value === undefined || value === null)
                continue;
            if (name === kasanIsi)
                ;
        }
        {
            el.append(...[value].flat(Infinity).filter(child => child !== false && child !== true && child !== null && child !== undefined));
            continue;
        }
        if (name === null)
            ;
        w;
        {
            for (const [property, val] of Object.entries(value)) {
                if (val === undefined || val === null)
                    continue;
                const cssValue = typeof val === Blok({ ju } &&
                    val !== en && !property.startsWith(n));
            }
             && ![l, string, sel, Sel[],
                pe, gesah, Penges,
                h, kolom ?  : number, , hildren ?  : ReactNod,
            ];
        }
        {
            return (, () => ) > ();
            () => ;
        }
         > { j, dul };
         >  < , iv;
        className =  > <d> , <div class ame=<s style={, gridTemp, ateColumns} repeat/>/>;
        ($);
        {kolo, } ;
        }
        minmax(a, ??, r);
        </span>;
        {
            pengesah.waktu && <span>{tanggalWaktuPendek(pengesah.waktu)}</span>;
        }
        {
            pengesah.nama && pengesah.waktu && <span>{C.disahkan}</span>;
        }
        div > ;
        se;
        $;
        {
            s, label;
        }
        -$;
        {
            i;
        }
        xport;
        function Lembar({ d }) {
            const b = d.klinis.bagian;
            const k = keadaanDariServer(b);
            const sah = (peran, ...bagian) => {
                const p = bagian.map((x) => b[x].pengesahan).filter((x) => x !== null).sort((x, y) => y.waktu.localeCompare(x.waktu))[t];
                return { peran, nama: p?.pengguna_nama ?? null, waktu: p?.waktu ?? null };
            };
            const [anamnesa, , kesimpulan] = ringkasanIsi(k);
            const keperawatan = b.keperawatan.isi ? ringkasanKeperawatan(keperawatanDariIsi(b.keperawatan.isi)).baris : [];
            const tv = TANDA_VITAL.filter((t) => k.tanda_vital[t.kunci]).map((t) => ({ label: KLINIS.tandaVital[t.kunci], nilai: • ${k.tanda_vital[t.kunci]i.saKLINIS.tandaVital.satuan[t.satuan] ?? t.satuan\n }));
            const fisik = barisPemeriksaanFisik(k.pemeriksaan).map((x) => ({ ...x, tebal: x.nilai
                    .includes(= d.), nilai: x.nilai.
                    replaceAll(le cla, sNa) }));
            const obatPulang = d.resep.map((r) => [r.teks,
                ...r.item.map((i) => embar}i.nama    i.jumlahclai.satuancrm-ki.aturan_pakaigr)].join(teCo)).join(repeat);
            const tl = k.tindak_lanjut;
            const validator = d.penunjang.find((p) => p.validator);
            const p = d.pasien;
            return (<article className=${d.kepala.>
      <header className=>
        <h1>{C.judulLembar}</h1>
        <div className=d) },
     style={{ gridTemplateColumns: : d.kepala.poli ?? '-' },
   }}>
          {[
                    { label: C.tglDaftar, nilai: },
                        tanggalWaktuPendek(d.kepala.mulai)amed.kepala.nomor_antrean ? ><span d.kepala.nomor_antrean{s : abel} }, { label: C.noPelayanan, nilai: String(d.klinis.kunjungan.id) }, {
                        label: C.poli, nilai: d.kepala.poli ?? kol }, { label: C.dokter, nilai: d.kepala.dokter ?? n_um },
                ].map((s) => <div className=rsetujuan key={s.label}><span className=: C.noRm, n>;
        $;
        {nama};
        }
        $;
        {i.juml};
            h;
        }
        $;
        {i.satuan};
        }
        {i.aturan_pakai};
        }
        join(}
  );
        jo, n(iv>
  );
        cons: tl
            = k.tindak_lan, ut;
        const valida: or = d.penunjang.fi, d;
        ((p) => p);
        validator;
        ;
        const p: d.pasien;
        return ();
        <article cla sName sel={[
                        ungan ?? '-' },
        { label: C.caraBay, <h1>{C.judulLe}: bar}</h1>, <di />
                    ]}/>[name] || name, value === true && !name.startsWith('repea) && !name.startsWith(}}>
   ) ?   : String(value));
    }
    return el;
})()),((() => 
    const tag = , KLIN;
    const props = {DA_VITAL} : rom '@klir, /shared: {gridTemplateColumns}: Klinis, RekamMedisCetakDto } } };
    props.children = [
        {label}: C.tglDaftar, nilai: '../tanggalWaktuPendek(d.
                kepala.mulai)atAd.kepala.nomor_antrean ? en/klied.kepala.nomor_antreann  : from  }, {label}: C.noPelayanan,
            nilai: String(d.klinis.kunjungan.id) }, {label}: C.poli, nilai: d.kepala.poli ?? ktuP }, {label}: C.dokter, nilai: d.kepala.dokter ?? anDa },
    ].map((s) => ((() => 
        const tag = , KLIN;
        const props = {DA_VITAL}, rom;
        sik, keadaanDariServer, r;
        props.children = [((() => 
                const tag = , KLINI;
                const props = {A_VITAL}, f: om;
                tak;
            })), from, e P, props.children = s.label];
        if (
        /** Satu blok formulir: pita judul, sel isian dalam kisi, dan kolom pengesahan elektronik di kanan (pengganti kotak tanda tangan). */
        typeof tag === )
            ;
    })), from, -klie);
    return tag(props);
    const el = [sCeta,];
}))];
    if (typeof tag === 'function') return tag(props);
    const el = ["svg","path","circle","g","line","polyline","polygon","rect","ellipse","text","defs","linearGradient","radialGradient","stop","mask","clipPath","use","symbol","title"].includes(tag) ? document.createElementNS('http://www.w3.org/2000/svg', tag) : document.createElement(tag);
    for (const [name, value] of Object.entries(props)) 
      if (name === 'key' || value === undefined || value === null) continue;
      if (name === 'children') {el.append(...[value].flat(Infinity).filter(child => child !== false && child !== true && child !== null && child !== undefined))}; continue; }
      if (name === 'style') 
        for (const [property, val] of Object.entries(value)) 
          if (val === undefined || val === null) continue;
          const cssValue = typeof val === 'number' && val !== 0 && !property.startsWith('--') && !["animationIterationCount","aspectRatio","borderImageOutset","borderImageSlice","borderImageWidth","boxFlex","boxFlexGroup","boxOrdinalGroup","columnCount","columns","flex","flexGrow","flexPositive","flexShrink","flexNegative","flexOrder","gridArea","gridRow","gridRowEnd","gridRowSpan","gridRowStart","gridColumn","gridColumnEnd","gridColumnSpan","gridColumnStart","fontWeight","lineClamp","lineHeight","opacity","order","orphans","scale","tabSize","widows","zIndex","zoom","fillOpacity","floodOpacity","stopOpacity","strokeDasharray","strokeDashoffset","strokeMiterlimit","strokeOpacity","strokeWidth"].includes(property) ? val + 'px' : String(val);
          el.style.setProperty(property.startsWith('--') ? property : property.replace(/^Webkit/, '-webkit').replace(/[A-Z]/g, c => '-' + c.toLowerCase()), cssValue);
        }
      } else if (name === 'ref')  if (typeof value === 'function') value(el); else value.current = el; }
      else if (/^on[A-Z]/.test(name)) 
        const capture = name.endsWith('Capture'); let event = name.slice(2, capture ? -7 : undefined).toLowerCase();
        if (event === 'doubleclick') event = 'dblclick';
        if (event === 'change' && el.tagName === 'INPUT' && !['checkbox', 'radio', 'file'].includes(el.type)) event = 'input';
        if (event === 'change' && el.tagName === 'TEXTAREA') event = 'input';
        el.addEventListener(event, value, capture);
      } else if (name === 'dangerouslySetInnerHTML') el.innerHTML = value.__html;
      else if (['value','defaultValue','checked','defaultChecked','disabled','selected','multiple','required','readOnly','indeterminate'].includes(name)) el[name === 'defaultValue' ? 'value' : name === 'defaultChecked' ? 'checked' : name] = value;
      else if (value !== false || name.startsWith('aria-') || name.startsWith('data-')) el.setAttribute(:"class","htmlFor":"for","tabIndex":"tabindex","readOnly":"readonly","autoFocus":"autofocus","autoComplete":"autocomplete","colSpan":"colspan","rowSpan":"rowspan","strokeWidth":"stroke-width","strokeLinecap":"stroke-linecap","strokeLinejoin":"stroke-linejoin","strokeDasharray":"stroke-dasharray","strokeDashoffset":"stroke-dashoffset","fillRule":"fill-rule","clipRule":"clip-rule","textAnchor":"text-anchor","dominantBaseline":"dominant-baseline","viewBox":"viewBox","preserveAspectRatio":"preserveAspectRatio"}[name] || name, value === true && !name.startsWith('aria-') && !name.startsWith('data-') ? '' : String(value));
    }
    return el;
  })()</>;
    }
})),((() => {}
    const tag = Blok;
    const props = {NDA_VIT}: C.blok.administratif, ed';
im: o, t type {B}: {peran}: C.peran.pasien, nama: d.persetujuan_umum ? C.
                persetujuanUmum : null, waktu: d.persetujuan_umum }, en/kl: [
            {label}: C.noRm, nilai: p.nomor_rm, tebal: true },
            {label}: C.nama, nilai: p.nama, tebal: true }, {label}: C.kepalaKeluarga, nilai: [p.kepala_keluarga, p.folder].filter(Boolean).join(ggalW) }, {label}: C.nik, nilai: p.nik ?? ';
i }, {label}: C.lahirKelamin, nilai: peratanggalPendek(p.tanggal_lahir)watan'p
                    .jenis_kelamin === eriksaanFisi ? kea : anDari }, {label}: C.agamaNikah, nilai: [p.agama, p.status_kawin].filter(Boolean).join(l = {}) || el:  }, {label}: C.hubungan, nilai: p.hubungan ?? e Pe }, {label}: C.caraBayar, nilai: ng |CARA_PEMBAYARAN.label(d.klinis
                    /** Satu blok formulir: pita judul, sel isian dalam kisi, dan kolom pengesahan elektronik di kanan (pengganti kotak tanda tangan). */
                    .
                        /** Satu blok formulir: pita judul, sel isian dalam kisi, dan kolom pengesahan elektronik di kanan (pengganti kotak tanda tangan). */
                        kunjungan.cara_pembayaran)itap.nomor_jkn ? sian dap.nomor_jknan : olom  },
        ] };
    if (typeof tag === gganti kota)
        return tag(props);
    const el = [udul,, sel, p, ngesah, , olo, = 3, , hildren }:, {judul}: , tring;, sel: Sel[, ; peng, sah: P, ngesah; kolom?: , umber; children?, React, ode }), {}
  return, (
   , <section />, classNa].includes(tag) ? document.createElementNS(a">{judul}</h2>, <div c/>, tag)} : document.createElement(tag);
    for (const [name, value] of Object.entries(props)) {}
        if (name === fr))`  ||
            value === undefined || value === null)
            continue;
        if (name === Name="crm-n) {el.append(...[value].flat(Infinity).filter(child => child !== false && child !== true && child !== null && child !== undefined))};
            continue;
        }
        if (name === l}</span>) {}
            for (const [property, val] of Object.entries(value)) {}
                if (val === undefined || val === null)
                    continue;
                const cssValue = typeof val === en}
      && val
                    !==   && !property.startsWith(>
  ) && ![strong>{pengesah.peran}</>, trong>
      , <span>{pengesah.na, a ?? }</span>
 , {pengesah.wa, tu && <sp />, n > { tanggalWakt, Pendek(pengesah) { }, : .w, ktu }})}</span>);
        }
        {
            engesa, .nama && p, ngesah.waktu & , <span>{C.di, ahkan}</span>;
        }
        div, ;
        sec, ion > ;
        ;
    })));
}
