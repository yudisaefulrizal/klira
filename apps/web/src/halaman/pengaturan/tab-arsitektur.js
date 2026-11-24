import { panggilApi, GalatApi } from '../../api-klien/klien.js';
import { kartu, tombol, lencana, peringatan, tab, tabel, baris, sel } from '../../komponen/ui/primitif.js';
import { token } from '../../gaya/token.js';

const WARNA_METODE = {
    GET: 'biru',
    POST: 'hijau',
    PUT: 'kuning',
    PATCH: 'ungu',
    DELETE: 'merah',
};

function gayaInput(el) {
    Object.assign(el.style, {
        height: token.ukuran.isian,
        padding: `0 ${token.jarak.sm}`,
        borderRadius: token.radius.sedang,
        border: `${token.ukuran.garis} solid ${token.warna.garis}`,
        background: token.warna.permukaan,
        color: token.warna.teks,
        fontFamily: token.huruf.keluarga,
        fontSize: token.huruf.ukuran.dasar,
        minWidth: '220px',
    });
    return el;
}

/** Halaman dinamis Diagram Database (ERD), Alur Data Sistem, dan Peta Endpoint API dari database & router aktif. */
export function TabArsitektur() {
    const el = document.createElement('div');
    Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md });

    const header = document.createElement('div');
    Object.assign(header.style, { display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: token.jarak.sm });
    const kiriH = document.createElement('div');
    const h2 = document.createElement('h2');
    h2.textContent = 'Diagram Database & Alur Data Sistem';
    Object.assign(h2.style, { margin: '0', fontSize: token.huruf.ukuran.judul, fontWeight: token.huruf.berat.tebal });
    const subH = document.createElement('small');
    subH.style.color = token.warna.teksRedup;
    subH.textContent = 'Otomatis membaca skema tabel, relasi, dan endpoint API yang sedang aktif.';
    kiriH.append(h2, subH);

    const kananH = document.createElement('div');
    Object.assign(kananH.style, { display: 'flex', alignItems: 'center', gap: token.jarak.sm, flexWrap: 'wrap' });
    const ringkasBadge = document.createElement('div');
    Object.assign(ringkasBadge.style, { display: 'flex', gap: token.jarak.xs, flexWrap: 'wrap' });
    const btnMuat = tombol('Muat Ulang dari DB', () => void muat(), 'sekunder');
    kananH.append(ringkasBadge, btnMuat);
    header.append(kiriH, kananH);

    let subAktif = 'alur';
    let domainAktif = 'semua';
    let cariTeks = '';
    let tabelTerpilih = null;
    let skala = 1;
    let data = null;
    let aktif = true;

    const subTabs = tab([
        { id: 'alur', label: 'Alur Data Sistem' },
        { id: 'erd', label: 'Diagram Database (ERD)' },
        { id: 'api', label: 'Peta Endpoint API' },
    ], 'alur', 'Tampilan Arsitektur', (id) => {
        subAktif = id;
        subTabs.pilih(id);
        lukis();
    });

    const status = document.createElement('div');
    const isi = document.createElement('div');
    el.append(header, subTabs.el, status, isi);

    const bukaTabelDiErd = (namaTabel) => {
        const t = data?.tabel?.find((x) => x.nama === namaTabel);
        if (!t) return;
        tabelTerpilih = t.nama;
        domainAktif = 'semua';
        cariTeks = '';
        subAktif = 'erd';
        subTabs.pilih('erd');
        lukis();
    };

    function lukisAlur() {
        const petaTabel = new Map((data.tabel || []).map((t) => [t.nama, t]));
        const petaDomain = new Map((data.domain || []).map((d) => [d.id, d]));

        const info = document.createElement('p');
        info.textContent = 'Klik nama tabel pada setiap tahap untuk langsung melihat struktur kolom dan relasinya di Diagram Database (ERD).';
        Object.assign(info.style, { margin: `0 0 ${token.jarak.md}`, color: token.warna.teksRedup, fontSize: token.huruf.ukuran.dasar });

        const grid = document.createElement('div');
        Object.assign(grid.style, {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
            gap: token.jarak.md,
        });

        for (const tahap of data.alur || []) {
            const dom = petaDomain.get(tahap.domain);
            const w = token.warna.status[dom?.warna || 'biru'];
            const k = kartu({ susun: 'sm', style: { borderTop: `4px solid ${w.teks}` } });

            const atas = document.createElement('div');
            Object.assign(atas.style, { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: token.jarak.xs });
            const judul = document.createElement('strong');
            judul.textContent = `${tahap.urutan}. ${tahap.judul}`;
            judul.style.fontSize = token.huruf.ukuran.besar;
            atas.append(judul, lencana(dom?.label || tahap.domain, dom?.warna || 'biru'));

            const desk = document.createElement('div');
            desk.textContent = tahap.ringkas;
            Object.assign(desk.style, { fontSize: token.huruf.ukuran.dasar, color: token.warna.teksRedup, lineHeight: '1.45' });

            const lblT = document.createElement('small');
            lblT.textContent = 'Tabel Terkait:';
            lblT.style.fontWeight = token.huruf.berat.tebal;
            const chips = document.createElement('div');
            Object.assign(chips.style, { display: 'flex', flexWrap: 'wrap', gap: '6px' });
            for (const namaT of tahap.tabel_utama || []) {
                const infoT = petaTabel.get(namaT);
                const btnT = document.createElement('button');
                btnT.type = 'button';
                btnT.textContent = infoT ? `${namaT} (${infoT.estimasi_baris})` : namaT;
                Object.assign(btnT.style, {
                    padding: '4px 9px', borderRadius: token.radius.pil, cursor: 'pointer',
                    border: `${token.ukuran.garis} solid ${token.warna.garis}`,
                    background: token.warna.kepalaTabel, color: token.warna.teks,
                    fontSize: token.huruf.ukuran.kecil, fontWeight: token.huruf.berat.sedang,
                });
                btnT.addEventListener('click', () => bukaTabelDiErd(namaT));
                chips.append(btnT);
            }

            const lblE = document.createElement('small');
            lblE.textContent = 'Endpoint Kunci:';
            lblE.style.fontWeight = token.huruf.berat.tebal;
            const eps = document.createElement('div');
            Object.assign(eps.style, { display: 'flex', flexDirection: 'column', gap: '2px', fontFamily: 'monospace', fontSize: '11.5px', color: token.warna.teksRedup });
            for (const ep of tahap.endpoint_kunci || []) {
                const d = document.createElement('div');
                d.textContent = ep;
                eps.append(d);
            }

            k.append(atas, desk, lblT, chips, lblE, eps);
            grid.append(k);
        }

        isi.replaceChildren(info, grid);
    }

    function lukisErd() {
        const petaDomain = new Map((data.domain || []).map((d) => [d.id, d]));
        const q = cariTeks.trim().toLowerCase();
        const tabelTampil = (data.tabel || []).filter((t) => {
            if (domainAktif !== 'semua' && t.domain !== domainAktif) return false;
            if (!q) return true;
            return t.nama.toLowerCase().includes(q) || t.kolom.some((c) => c.nama.toLowerCase().includes(q));
        });
        const namaSet = new Set(tabelTampil.map((t) => t.nama));
        const relasiTampil = (data.relasi || []).filter((r) => namaSet.has(r.dari_tabel) && namaSet.has(r.ke_tabel));

        if (tabelTerpilih && !namaSet.has(tabelTerpilih)) tabelTerpilih = null;
        if (!tabelTerpilih && tabelTampil.length) tabelTerpilih = tabelTampil[0].nama;

        // Baris kontrol filter domain, cari, zoom
        const bar = document.createElement('div');
        Object.assign(bar.style, { display: 'flex', flexWrap: 'wrap', gap: token.jarak.sm, alignItems: 'center', marginBottom: token.jarak.md });

        const pills = document.createElement('div');
        Object.assign(pills.style, { display: 'flex', flexWrap: 'wrap', gap: '6px', flex: '1 1 auto' });
        for (const d of [{ id: 'semua', label: `Semua (${data.tabel.length})` }, ...(data.domain || [])]) {
            const on = domainAktif === d.id;
            const b = document.createElement('button');
            b.type = 'button';
            b.textContent = d.label;
            Object.assign(b.style, {
                height: '32px', padding: '0 12px', borderRadius: token.radius.pil, cursor: 'pointer',
                border: `${token.ukuran.garis} solid ${on ? token.warna.utama : token.warna.garis}`,
                background: on ? token.warna.utama : token.warna.permukaan,
                color: on ? token.warna.diAtasUtama : token.warna.teks,
                fontSize: token.huruf.ukuran.kecil, fontWeight: token.huruf.berat.tebal,
            });
            b.addEventListener('click', () => { domainAktif = d.id; lukisErd(); });
            pills.append(b);
        }

        const inCari = document.createElement('input');
        inCari.type = 'search';
        inCari.placeholder = 'Cari tabel atau kolom...';
        inCari.value = cariTeks;
        gayaInput(inCari);
        inCari.addEventListener('input', (e) => { cariTeks = e.target.value; lukisErd(); });

        const zoomBar = document.createElement('div');
        Object.assign(zoomBar.style, { display: 'inline-flex', gap: '4px', alignItems: 'center' });
        zoomBar.append(
            tombol('-', () => { skala = Math.max(0.65, +(skala - 0.1).toFixed(2)); lukisErd(); }, 'sekunder'),
            Object.assign(document.createElement('small'), { textContent: `${Math.round(skala * 100)}%`, style: 'min-width:42px;text-align:center;' }),
            tombol('+', () => { skala = Math.min(1.25, +(skala + 0.1).toFixed(2)); lukisErd(); }, 'sekunder'),
        );
        bar.append(pills, inCari, zoomBar);

        // Layout utama: kanvas kiri + inspector kanan
        const layout = document.createElement('div');
        Object.assign(layout.style, {
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 340px',
            gap: token.jarak.md,
            alignItems: 'start',
        });

        const kanvasBox = kartu({ style: { padding: token.jarak.md, overflow: 'auto', maxHeight: '72vh', position: 'relative' } });
        const stage = document.createElement('div');
        Object.assign(stage.style, {
            position: 'relative',
            transform: `scale(${skala})`,
            transformOrigin: 'top left',
            width: `${Math.round(100 / skala)}%`,
        });

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        Object.assign(svg.style, { position: 'absolute', inset: '0', pointerEvents: 'none', zIndex: '0', overflow: 'visible' });

        const gridKartu = document.createElement('div');
        Object.assign(gridKartu.style, {
            position: 'relative',
            zIndex: '1',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: token.jarak.md,
        });

        const terhubungSet = new Set();
        if (tabelTerpilih) {
            terhubungSet.add(tabelTerpilih);
            for (const r of relasiTampil) {
                if (r.dari_tabel === tabelTerpilih) terhubungSet.add(r.ke_tabel);
                if (r.ke_tabel === tabelTerpilih) terhubungSet.add(r.dari_tabel);
            }
        }

        const kartuMap = new Map();
        for (const t of tabelTampil) {
            const dom = petaDomain.get(t.domain);
            const w = token.warna.status[dom?.warna || 'abu'];
            const dipilih = t.nama === tabelTerpilih;
            const terkait = !tabelTerpilih || terhubungSet.has(t.nama);

            const card = document.createElement('button');
            card.type = 'button';
            Object.assign(card.style, {
                textAlign: 'left',
                padding: '10px 12px',
                borderRadius: token.radius.sedang,
                border: `1.5px solid ${dipilih ? token.warna.utama : token.warna.garis}`,
                borderTop: `3px solid ${w.teks}`,
                background: token.warna.permukaan,
                color: token.warna.teks,
                cursor: 'pointer',
                opacity: terkait ? '1' : '0.35',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                boxShadow: dipilih ? `0 0 0 2px ${token.warna.utamaLatar}` : 'none',
            });
            card.addEventListener('click', () => { tabelTerpilih = t.nama; lukisErd(); });

            const kep = document.createElement('div');
            Object.assign(kep.style, { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' });
            const nm = document.createElement('strong');
            nm.textContent = t.nama;
            nm.style.fontSize = '13px';
            const cnt = document.createElement('small');
            cnt.textContent = `${t.kolom.length} kol · ${t.estimasi_baris} brs`;
            cnt.style.color = token.warna.teksRedup;
            cnt.style.fontSize = '11px';
            kep.append(nm, cnt);

            const kolList = document.createElement('div');
            Object.assign(kolList.style, { display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '11.5px', color: token.warna.teksRedup });
            for (const c of t.kolom.slice(0, 5)) {
                const row = document.createElement('div');
                row.style.display = 'flex';
                row.style.justifyContent = 'space-between';
                row.textContent = `${c.kunci === 'PRI' ? '🔑 ' : c.nama.endsWith('_id') ? '🔗 ' : ''}${c.nama}`;
                kolList.append(row);
            }
            if (t.kolom.length > 5) {
                const more = document.createElement('small');
                more.textContent = `+ ${t.kolom.length - 5} kolom lainnya`;
                more.style.color = token.warna.utama;
                kolList.append(more);
            }

            card.append(kep, kolList);
            kartuMap.set(t.nama, card);
            gridKartu.append(card);
        }

        stage.append(svg, gridKartu);
        kanvasBox.append(stage);

        // Gambar garis relasi SVG setelah layout selesai
        requestAnimationFrame(() => {
            if (!stage.isConnected) return;
            const rectStage = gridKartu.getBoundingClientRect();
            svg.setAttribute('width', String(gridKartu.offsetWidth));
            svg.setAttribute('height', String(gridKartu.offsetHeight));
            svg.replaceChildren();
            for (const r of relasiTampil) {
                const a = kartuMap.get(r.dari_tabel);
                const b = kartuMap.get(r.ke_tabel);
                if (!a || !b) continue;
                const aktifGaris = tabelTerpilih && (r.dari_tabel === tabelTerpilih || r.ke_tabel === tabelTerpilih);
                if (tabelTerpilih && !aktifGaris && relasiTampil.length > 40) continue;
                const ra = a.getBoundingClientRect();
                const rb = b.getBoundingClientRect();
                const x1 = (ra.left - rectStage.left + ra.width / 2) / skala;
                const y1 = (ra.top - rectStage.top + ra.height / 2) / skala;
                const x2 = (rb.left - rectStage.left + rb.width / 2) / skala;
                const y2 = (rb.top - rectStage.top + rb.height / 2) / skala;
                const dx = Math.abs(x2 - x1) * 0.4;
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`);
                path.setAttribute('fill', 'none');
                path.setAttribute('stroke', aktifGaris ? 'var(--warna-utama)' : 'var(--warna-garis)');
                path.setAttribute('stroke-width', aktifGaris ? '2.2' : '1');
                path.setAttribute('stroke-dasharray', r.jenis === 'konvensi' ? '4 3' : '');
                path.setAttribute('opacity', aktifGaris ? '0.9' : '0.35');
                svg.append(path);
            }
        });

        // Panel Inspector Detail Tabel di kanan
        const insp = kartu({ susun: 'sm', style: { maxHeight: '72vh', overflowY: 'auto' } });
        const detail = (data.tabel || []).find((t) => t.nama === tabelTerpilih);
        if (!detail) {
            insp.append('Pilih salah satu tabel di sebelah kiri untuk melihat detail kolom dan relasinya.');
        } else {
            const dom = petaDomain.get(detail.domain);
            const hD = document.createElement('h3');
            hD.textContent = detail.nama;
            hD.style.margin = '0';
            insp.append(hD, lencana(dom?.label || detail.domain, dom?.warna || 'abu'));

            const relKeluar = (data.relasi || []).filter((r) => r.dari_tabel === detail.nama);
            const relMasuk = (data.relasi || []).filter((r) => r.ke_tabel === detail.nama);

            if (relKeluar.length) {
                const s1 = document.createElement('strong'); s1.textContent = `Merujuk ke (${relKeluar.length}):`;
                insp.append(s1);
                const list1 = document.createElement('div');
                Object.assign(list1.style, { display: 'flex', flexDirection: 'column', gap: '4px' });
                for (const r of relKeluar) {
                    const btn = tombol(`${r.dari_kolom} → ${r.ke_tabel}.${r.ke_kolom}`, () => bukaTabelDiErd(r.ke_tabel), 'teks');
                    btn.style.cssText = 'justify-content:flex-start;padding:2px 6px;height:auto;font-size:12px;';
                    list1.append(btn);
                }
                insp.append(list1);
            }

            if (relMasuk.length) {
                const s2 = document.createElement('strong'); s2.textContent = `Dirujuk oleh (${relMasuk.length}):`;
                insp.append(s2);
                const list2 = document.createElement('div');
                Object.assign(list2.style, { display: 'flex', flexDirection: 'column', gap: '4px' });
                for (const r of relMasuk) {
                    const btn = tombol(`${r.dari_tabel}.${r.dari_kolom}`, () => bukaTabelDiErd(r.dari_tabel), 'teks');
                    btn.style.cssText = 'justify-content:flex-start;padding:2px 6px;height:auto;font-size:12px;';
                    list2.append(btn);
                }
                insp.append(list2);
            }

            const s3 = document.createElement('strong'); s3.textContent = `Daftar Kolom (${detail.kolom.length}):`;
            insp.append(s3);
            const kolWrap = document.createElement('div');
            Object.assign(kolWrap.style, { display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' });
            for (const c of detail.kolom) {
                const row = document.createElement('div');
                Object.assign(row.style, {
                    display: 'flex', justifyContent: 'space-between', gap: '8px',
                    padding: '4px 6px', borderRadius: '6px', background: token.warna.kepalaTabel,
                });
                const kiriK = document.createElement('span');
                kiriK.textContent = `${c.kunci === 'PRI' ? 'PK ' : ''}${c.nama}`;
                kiriK.style.fontWeight = c.kunci === 'PRI' ? token.huruf.berat.tebal : token.huruf.berat.biasa;
                const kananK = document.createElement('span');
                kananK.textContent = `${c.tipe}${c.nullable ? ' ?' : ''}`;
                kananK.style.color = token.warna.teksRedup;
                row.append(kiriK, kananK);
                kolWrap.append(row);
            }
            insp.append(kolWrap);
        }

        layout.append(kanvasBox, insp);
        isi.replaceChildren(bar, layout);
    }

    function lukisApi() {
        const q = cariTeks.trim().toLowerCase();
        const daftar = (data.endpoint || []).filter((e) => !q || e.jalur.toLowerCase().includes(q) || e.metode.toLowerCase().includes(q));

        const bar = document.createElement('div');
        Object.assign(bar.style, { display: 'flex', gap: token.jarak.sm, alignItems: 'center', marginBottom: token.jarak.md });
        const inCari = document.createElement('input');
        inCari.type = 'search';
        inCari.placeholder = 'Cari endpoint (mis. /keuangan, /pasien, POST)...';
        inCari.value = cariTeks;
        gayaInput(inCari);
        inCari.style.flex = '1';
        inCari.addEventListener('input', (e) => { cariTeks = e.target.value; lukisApi(); });
        const info = document.createElement('small');
        info.textContent = `${daftar.length} dari ${data.endpoint?.length ?? 0} endpoint`;
        info.style.color = token.warna.teksRedup;
        bar.append(inCari, info);

        const box = kartu({ style: { padding: '0', overflow: 'hidden' } });
        const tbl = tabel(['Metode', 'Jalur Endpoint API', 'Modul'], 'Peta Endpoint API');
        for (const r of daftar) {
            const modul = r.jalur.replace(/^\/api\//, '').split('/')[0] || 'umum';
            const jalurEl = document.createElement('code');
            jalurEl.textContent = r.jalur;
            tbl.tbody.append(baris(sel(lencana(r.metode, WARNA_METODE[r.metode] || 'abu')), sel(jalurEl), sel(modul)));
        }
        box.append(tbl.el);
        isi.replaceChildren(bar, box);
    }

    function lukis() {
        if (!data) return;
        ringkasBadge.replaceChildren(
            lencana(`${data.tabel?.length ?? 0} Tabel`, 'biru'),
            lencana(`${data.relasi?.length ?? 0} Relasi`, 'hijau'),
            lencana(`${data.endpoint?.length ?? 0} Endpoint`, 'ungu'),
        );
        if (subAktif === 'alur') lukisAlur();
        else if (subAktif === 'erd') lukisErd();
        else lukisApi();
    }

    async function muat() {
        status.replaceChildren();
        btnMuat.disabled = true;
        try {
            data = await panggilApi('GET', '/arsitektur/skema');
            if (!aktif) return;
            lukis();
        } catch (e) {
            if (aktif) status.replaceChildren(peringatan(e instanceof GalatApi ? e.message : 'Gagal memuat metadata arsitektur sistem.'));
        } finally {
            btnMuat.disabled = false;
        }
    }

    void muat();
    el.tutup = () => { aktif = false; };
    return el;
}
