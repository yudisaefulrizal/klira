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

const KARTU_L = 216;
const KARTU_T = 132;
const JARAK_X = 46;
const JARAK_Y = 24;
const ZONA_PAD_X = 24;
const ZONA_PAD_ATAS = 48;
const ZONA_PAD_BAWAH = 24;
const ZONA_GAP = 56;
const URUTAN_DOMAIN_PETA = [
    ['pasien', 'klinis', 'farmasi'],
    ['penunjang', 'keuangan', 'integrasi'],
    ['akses'],
];

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
        minWidth: '210px',
    });
    return el;
}

/**
 * Hitung tata letak peta otomatis (auto-layout):
 * - Mengelompokkan tabel ke dalam zona wilayah domain.
 * - Di dalam tiap zona, tabel disusun topologis dari Induk (kiri) -> Anak (kanan).
 * - Zona disusun menjadi grid peta tanpa tumpang-tindih.
 */
function hitungTataLetakPeta(tabelList, relasiList, domainList) {
    const petaDomain = new Map((domainList || []).map((d) => [d.id, d]));
    const perDomain = new Map();
    for (const t of tabelList) {
        if (!perDomain.has(t.domain)) perDomain.set(t.domain, []);
        perDomain.get(t.domain).push(t);
    }

    // Hitung derajat total untuk pengurutan simpul hub di tiap level
    const derajatTotal = new Map();
    for (const r of relasiList) {
        derajatTotal.set(r.dari_tabel, (derajatTotal.get(r.dari_tabel) ?? 0) + 1);
        derajatTotal.set(r.ke_tabel, (derajatTotal.get(r.ke_tabel) ?? 0) + 1);
    }

    const zonaMap = new Map();

    for (const [domId, daftar] of perDomain.entries()) {
        const namaSet = new Set(daftar.map((t) => t.nama));
        // Relasi internal dalam domain: dari_tabel (anak) -> ke_tabel (induk)
        const indukDari = new Map();
        for (const t of daftar) indukDari.set(t.nama, new Set());
        for (const r of relasiList) {
            if (namaSet.has(r.dari_tabel) && namaSet.has(r.ke_tabel) && r.dari_tabel !== r.ke_tabel) {
                indukDari.get(r.dari_tabel).add(r.ke_tabel);
            }
        }

        // Hitung level topologis (0 = tabel induk tanpa ketergantungan internal; anak mendapat max(induk) + 1)
        const levelMap = new Map();
        const sedang = new Set();
        const hitungLevel = (nama) => {
            if (levelMap.has(nama)) return levelMap.get(nama);
            if (sedang.has(nama)) return 0; // cegah siklus
            sedang.add(nama);
            let maks = 0;
            for (const induk of indukDari.get(nama) || []) {
                maks = Math.max(maks, hitungLevel(induk) + 1);
            }
            sedang.delete(nama);
            const lvl = Math.min(maks, 4);
            levelMap.set(nama, lvl);
            return lvl;
        };
        for (const t of daftar) hitungLevel(t.nama);

        // Kelompokkan per level, pecah kolom panjang agar zona tetap proporsional (maks 4 kartu per sub-kolom)
        const perLevel = new Map();
        for (const t of daftar) {
            const lvl = levelMap.get(t.nama) ?? 0;
            if (!perLevel.has(lvl)) perLevel.set(lvl, []);
            perLevel.get(lvl).push(t);
        }

        const kolomList = [];
        const levelUrut = [...perLevel.keys()].sort((a, b) => a - b);
        for (const lvl of levelUrut) {
            const grup = perLevel.get(lvl).slice().sort((a, b) => {
                const dB = derajatTotal.get(b.nama) ?? 0;
                const dA = derajatTotal.get(a.nama) ?? 0;
                if (dB !== dA) return dB - dA;
                return a.nama.localeCompare(b.nama);
            });
            const maksBaris = daftar.length > 16 ? 5 : 4;
            for (let i = 0; i < grup.length; i += maksBaris) {
                kolomList.push(grup.slice(i, i + maksBaris));
            }
        }

        const jmlKol = Math.max(1, kolomList.length);
        const maksBaris = Math.max(1, ...kolomList.map((k) => k.length));
        const lebar = ZONA_PAD_X * 2 + jmlKol * KARTU_L + (jmlKol - 1) * JARAK_X;
        const tinggi = ZONA_PAD_ATAS + ZONA_PAD_BAWAH + maksBaris * KARTU_T + (maksBaris - 1) * JARAK_Y;

        const posisiLokal = [];
        kolomList.forEach((kol, ki) => {
            kol.forEach((t, bi) => {
                posisiLokal.push({
                    tabel: t,
                    lx: ZONA_PAD_X + ki * (KARTU_L + JARAK_X),
                    ly: ZONA_PAD_ATAS + bi * (KARTU_T + JARAK_Y),
                });
            });
        });

        const infoDom = petaDomain.get(domId) || { id: domId, label: domId, warna: 'abu' };
        zonaMap.set(domId, {
            id: domId,
            label: infoDom.label,
            warna: infoDom.warna,
            jumlah: daftar.length,
            lebar,
            tinggi,
            posisiLokal,
        });
    }

    // Susun zona ke dalam baris peta sesuai URUTAN_DOMAIN_PETA (plus domain baru jika ada)
    const sudahMasuk = new Set();
    const barisZona = [];
    for (const barisIds of URUTAN_DOMAIN_PETA) {
        const ada = barisIds.filter((id) => zonaMap.has(id));
        if (ada.length) {
            ada.forEach((id) => sudahMasuk.add(id));
            barisZona.push(ada);
        }
    }
    const sisa = [...zonaMap.keys()].filter((id) => !sudahMasuk.has(id));
    if (sisa.length) barisZona.push(sisa);

    const zonaHasil = [];
    const posisiTabel = new Map();
    let curY = ZONA_GAP;
    let maxLebar = 800;

    for (const barisIds of barisZona) {
        let curX = ZONA_GAP;
        let tinggiBaris = 0;
        for (const id of barisIds) {
            const z = zonaMap.get(id);
            z.x = curX;
            z.y = curY;
            zonaHasil.push(z);
            for (const p of z.posisiLokal) {
                posisiTabel.set(p.tabel.nama, {
                    tabel: p.tabel,
                    x: curX + p.lx,
                    y: curY + p.ly,
                    w: KARTU_L,
                    h: KARTU_T,
                });
            }
            curX += z.lebar + ZONA_GAP;
            tinggiBaris = Math.max(tinggiBaris, z.tinggi);
        }
        maxLebar = Math.max(maxLebar, curX);
        curY += tinggiBaris + ZONA_GAP;
    }

    return {
        zona: zonaHasil,
        posisiTabel,
        lebarKanvas: maxLebar,
        tinggiKanvas: Math.max(520, curY),
    };
}

/** Halaman dinamis Diagram Database (ERD) bergaya peta auto-layout, Alur Data Sistem, dan Peta Endpoint API. */
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
    let skala = 0.72;
    let panX = 16;
    let panY = 16;
    let butuhFit = true;
    let butuhFokus = false;
    let data = null;
    let aktif = true;

    const subTabs = tab([
        { id: 'alur', label: 'Alur Data Sistem' },
        { id: 'erd', label: 'Diagram Database (ERD)' },
        { id: 'api', label: 'Peta Endpoint API' },
    ], 'alur', 'Tampilan Arsitektur', (id) => {
        subAktif = id;
        subTabs.pilih(id);
        if (id === 'erd') butuhFit = true;
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
        butuhFit = false;
        butuhFokus = true;
        subTabs.pilih('erd');
        lukis();
    };

    function lukisAlur() {
        const petaTabel = new Map((data.tabel || []).map((t) => [t.nama, t]));
        const petaDomain = new Map((data.domain || []).map((d) => [d.id, d]));

        const info = document.createElement('p');
        info.textContent = 'Klik nama tabel pada setiap tahap untuk langsung menyorot posisi, kolom, dan relasinya di Peta Database (ERD).';
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
        if (!tabelTerpilih && tabelTampil.length) {
            const favorit = tabelTampil.find((t) => t.nama === 'kunjungan') || tabelTampil[0];
            tabelTerpilih = favorit.nama;
        }

        const peta = hitungTataLetakPeta(tabelTampil, relasiTampil, data.domain);

        // Baris kontrol filter domain, cari, zoom & fit
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
            b.addEventListener('click', () => { domainAktif = d.id; butuhFit = true; lukisErd(); });
            pills.append(b);
        }

        const inCari = document.createElement('input');
        inCari.type = 'search';
        inCari.placeholder = 'Cari tabel atau kolom...';
        inCari.value = cariTeks;
        gayaInput(inCari);
        inCari.addEventListener('input', (e) => { cariTeks = e.target.value; butuhFit = true; lukisErd(); });

        const lblZoom = document.createElement('small');
        Object.assign(lblZoom, { textContent: `${Math.round(skala * 100)}%`, style: 'min-width:42px;text-align:center;' });

        const zoomBar = document.createElement('div');
        Object.assign(zoomBar.style, { display: 'inline-flex', gap: '4px', alignItems: 'center' });

        // Layout utama: peta interaktif kiri + inspector kanan
        const layout = document.createElement('div');
        Object.assign(layout.style, {
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 340px',
            gap: token.jarak.md,
            alignItems: 'start',
        });

        const kanvasBox = kartu({
            style: {
                padding: '0',
                overflow: 'hidden',
                height: '74vh',
                minHeight: '520px',
                position: 'relative',
                cursor: 'grab',
                userSelect: 'none',
                backgroundImage: `radial-gradient(${token.warna.garis} 1px, transparent 1px)`,
                backgroundSize: '20px 20px',
            },
        });

        const stage = document.createElement('div');
        Object.assign(stage.style, {
            position: 'absolute',
            left: '0',
            top: '0',
            width: `${peta.lebarKanvas}px`,
            height: `${peta.tinggiKanvas}px`,
            transformOrigin: '0 0',
            willChange: 'transform',
        });

        const terhubungSet = new Set();
        if (tabelTerpilih) {
            terhubungSet.add(tabelTerpilih);
            for (const r of relasiTampil) {
                if (r.dari_tabel === tabelTerpilih) terhubungSet.add(r.ke_tabel);
                if (r.ke_tabel === tabelTerpilih) terhubungSet.add(r.dari_tabel);
            }
        }

        // 1. Render Zona Wilayah Domain
        for (const z of peta.zona) {
            const w = token.warna.status[z.warna || 'abu'];
            const zBox = document.createElement('div');
            Object.assign(zBox.style, {
                position: 'absolute',
                left: `${z.x}px`,
                top: `${z.y}px`,
                width: `${z.lebar}px`,
                height: `${z.tinggi}px`,
                borderRadius: '14px',
                border: `1.5px dashed ${w.teks}`,
                background: w.latar,
                opacity: '0.78',
                pointerEvents: 'none',
            });
            const zHdr = document.createElement('div');
            Object.assign(zHdr.style, {
                position: 'absolute',
                left: '14px',
                top: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: w.teks,
                fontWeight: token.huruf.berat.tebal,
                fontSize: '13px',
            });
            zHdr.textContent = `${z.label} (${z.jumlah})`;
            zBox.append(zHdr);
            stage.append(zBox);
        }

        // 2. Render SVG Garis Relasi + Panah
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', String(peta.lebarKanvas));
        svg.setAttribute('height', String(peta.tinggiKanvas));
        Object.assign(svg.style, { position: 'absolute', left: '0', top: '0', pointerEvents: 'none', zIndex: '1' });

        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const buatMarker = (id, warna) => {
            const mk = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
            mk.setAttribute('id', id);
            mk.setAttribute('viewBox', '0 0 10 10');
            mk.setAttribute('refX', '8');
            mk.setAttribute('refY', '5');
            mk.setAttribute('markerWidth', '6');
            mk.setAttribute('markerHeight', '6');
            mk.setAttribute('orient', 'auto-start-reverse');
            const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            p.setAttribute('d', 'M 0 1.5 L 9 5 L 0 8.5 z');
            p.setAttribute('fill', warna);
            mk.append(p);
            return mk;
        };
        defs.append(
            buatMarker('panah-keluar', 'var(--warna-utama)'),
            buatMarker('panah-masuk', '#10b981'),
            buatMarker('panah-redup', 'var(--warna-garis)'),
        );
        svg.append(defs);

        for (const r of relasiTampil) {
            const a = peta.posisiTabel.get(r.dari_tabel);
            const b = peta.posisiTabel.get(r.ke_tabel);
            if (!a || !b) continue;
            const keluar = tabelTerpilih && r.dari_tabel === tabelTerpilih;
            const masuk = tabelTerpilih && r.ke_tabel === tabelTerpilih;
            const aktifGaris = keluar || masuk;
            if (tabelTerpilih && !aktifGaris && relasiTampil.length > 45) continue;

            // Titik sambung sisi kartu paling dekat
            const cxA = a.x + a.w / 2;
            const cyA = a.y + a.h / 2;
            const cxB = b.x + b.w / 2;
            const cyB = b.y + b.h / 2;
            let x1 = cxA;
            let y1 = cyA;
            let x2 = cxB;
            let y2 = cyB;
            if (Math.abs(cxB - cxA) >= Math.abs(cyB - cyA)) {
                x1 = cxB >= cxA ? a.x + a.w : a.x;
                x2 = cxB >= cxA ? b.x : b.x + b.w;
            } else {
                y1 = cyB >= cyA ? a.y + a.h : a.y;
                y2 = cyB >= cyA ? b.y : b.y + b.h;
            }
            const dx = Math.max(36, Math.abs(x2 - x1) * 0.45);
            const c1x = cxB >= cxA ? x1 + dx : x1 - dx;
            const c2x = cxB >= cxA ? x2 - dx : x2 + dx;

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', `M ${x1} ${y1} C ${c1x} ${y1}, ${c2x} ${y2}, ${x2} ${y2}`);
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', keluar ? 'var(--warna-utama)' : masuk ? '#10b981' : 'var(--warna-garis)');
            path.setAttribute('stroke-width', aktifGaris ? '2.4' : '1.1');
            path.setAttribute('stroke-dasharray', r.jenis === 'konvensi' ? '5 4' : '');
            path.setAttribute('opacity', aktifGaris ? '0.95' : '0.32');
            path.setAttribute('marker-end', `url(#${keluar ? 'panah-keluar' : masuk ? 'panah-masuk' : 'panah-redup'})`);
            svg.append(path);
        }
        stage.append(svg);

        // 3. Render Kartu Tabel pada Posisi Peta
        for (const pos of peta.posisiTabel.values()) {
            const t = pos.tabel;
            const dom = petaDomain.get(t.domain);
            const w = token.warna.status[dom?.warna || 'abu'];
            const dipilih = t.nama === tabelTerpilih;
            const terkait = !tabelTerpilih || terhubungSet.has(t.nama);

            const card = document.createElement('button');
            card.type = 'button';
            Object.assign(card.style, {
                position: 'absolute',
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                width: `${pos.w}px`,
                height: `${pos.h}px`,
                textAlign: 'left',
                padding: '9px 11px',
                borderRadius: token.radius.sedang,
                border: `1.5px solid ${dipilih ? token.warna.utama : token.warna.garis}`,
                borderTop: `3.5px solid ${w.teks}`,
                background: token.warna.permukaan,
                color: token.warna.teks,
                cursor: 'pointer',
                opacity: terkait ? '1' : '0.28',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                overflow: 'hidden',
                zIndex: dipilih ? '3' : '2',
                boxShadow: dipilih ? `0 0 0 3px ${token.warna.utamaLatar}` : '0 2px 6px rgba(0,0,0,0.12)',
            });
            card.addEventListener('click', (e) => {
                e.stopPropagation();
                tabelTerpilih = t.nama;
                butuhFit = false;
                butuhFokus = false;
                lukisErd();
            });

            const kep = document.createElement('div');
            Object.assign(kep.style, { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px' });
            const nm = document.createElement('strong');
            nm.textContent = t.nama;
            Object.assign(nm.style, { fontSize: '12.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' });
            const cnt = document.createElement('small');
            cnt.textContent = `${t.kolom.length}k · ${t.estimasi_baris}b`;
            Object.assign(cnt.style, { color: token.warna.teksRedup, fontSize: '10.5px', flexShrink: '0' });
            kep.append(nm, cnt);

            const kolList = document.createElement('div');
            Object.assign(kolList.style, { display: 'flex', flexDirection: 'column', gap: '1.5px', fontSize: '11px', color: token.warna.teksRedup });
            for (const c of t.kolom.slice(0, 4)) {
                const row = document.createElement('div');
                Object.assign(row.style, { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' });
                row.textContent = `${c.kunci === 'PRI' ? '🔑 ' : c.nama.endsWith('_id') ? '🔗 ' : ''}${c.nama}`;
                kolList.append(row);
            }
            if (t.kolom.length > 4) {
                const more = document.createElement('small');
                more.textContent = `+ ${t.kolom.length - 4} kolom lainnya`;
                more.style.color = token.warna.utama;
                kolList.append(more);
            }

            card.append(kep, kolList);
            stage.append(card);
        }

        // 4. Minimap & Legenda di pojok kanvas
        const miniW = 168;
        const miniSkala = miniW / peta.lebarKanvas;
        const miniH = Math.max(76, Math.round(peta.tinggiKanvas * miniSkala));
        const minimap = document.createElement('div');
        Object.assign(minimap.style, {
            position: 'absolute',
            right: '12px',
            bottom: '12px',
            width: `${miniW}px`,
            height: `${miniH}px`,
            borderRadius: '8px',
            border: `1px solid ${token.warna.garis}`,
            background: token.warna.permukaan,
            opacity: '0.92',
            zIndex: '10',
            overflow: 'hidden',
            cursor: 'crosshair',
            boxShadow: '0 4px 12px rgba(0,0,0,0.28)',
        });
        for (const z of peta.zona) {
            const w = token.warna.status[z.warna || 'abu'];
            const mz = document.createElement('div');
            Object.assign(mz.style, {
                position: 'absolute',
                left: `${z.x * miniSkala}px`,
                top: `${z.y * miniSkala}px`,
                width: `${Math.max(4, z.lebar * miniSkala)}px`,
                height: `${Math.max(4, z.tinggi * miniSkala)}px`,
                background: w.latar,
                border: `1px solid ${w.teks}`,
                borderRadius: '2px',
            });
            minimap.append(mz);
        }
        if (tabelTerpilih && peta.posisiTabel.has(tabelTerpilih)) {
            const tp = peta.posisiTabel.get(tabelTerpilih);
            const dot = document.createElement('div');
            Object.assign(dot.style, {
                position: 'absolute',
                left: `${(tp.x + tp.w / 2) * miniSkala - 3}px`,
                top: `${(tp.y + tp.h / 2) * miniSkala - 3}px`,
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: token.warna.utama,
            });
            minimap.append(dot);
        }
        const miniViewport = document.createElement('div');
        Object.assign(miniViewport.style, {
            position: 'absolute',
            border: `1.5px solid ${token.warna.utama}`,
            background: 'rgba(14,165,233,0.12)',
            pointerEvents: 'none',
        });
        minimap.append(miniViewport);

        const legenda = document.createElement('div');
        Object.assign(legenda.style, {
            position: 'absolute',
            left: '12px',
            bottom: '12px',
            padding: '6px 10px',
            borderRadius: '8px',
            border: `1px solid ${token.warna.garis}`,
            background: token.warna.permukaan,
            opacity: '0.92',
            zIndex: '10',
            display: 'flex',
            gap: '10px',
            fontSize: '11px',
            color: token.warna.teksRedup,
            pointerEvents: 'none',
        });
        legenda.innerHTML = '<span>🖱️ Geser peta &amp; Scroll zoom</span><span style="color:var(--warna-utama)">● Merujuk ke</span><span style="color:#10b981">● Dirujuk oleh</span>';

        const terapkanTransform = () => {
            stage.style.transform = `translate(${panX}px, ${panY}px) scale(${skala})`;
            lblZoom.textContent = `${Math.round(skala * 100)}%`;
            const vw = kanvasBox.clientWidth || 800;
            const vh = kanvasBox.clientHeight || 520;
            miniViewport.style.left = `${(-panX / skala) * miniSkala}px`;
            miniViewport.style.top = `${(-panY / skala) * miniSkala}px`;
            miniViewport.style.width = `${(vw / skala) * miniSkala}px`;
            miniViewport.style.height = `${(vh / skala) * miniSkala}px`;
        };

        const sesuaikanLayar = () => {
            const vw = (kanvasBox.clientWidth || 900) - 24;
            const vh = (kanvasBox.clientHeight || 540) - 24;
            skala = Math.max(0.24, Math.min(1.05, Math.min(vw / peta.lebarKanvas, vh / peta.tinggiKanvas)));
            panX = Math.round((kanvasBox.clientWidth - peta.lebarKanvas * skala) / 2);
            panY = Math.round(Math.max(12, (kanvasBox.clientHeight - peta.tinggiKanvas * skala) / 2));
            terapkanTransform();
        };

        const fokusKeTabel = (nama) => {
            const p = peta.posisiTabel.get(nama);
            if (!p) return;
            skala = Math.max(skala, 0.85);
            const vw = kanvasBox.clientWidth || 800;
            const vh = kanvasBox.clientHeight || 520;
            panX = Math.round(vw / 2 - (p.x + p.w / 2) * skala);
            panY = Math.round(vh / 2 - (p.y + p.h / 2) * skala);
            terapkanTransform();
        };

        zoomBar.append(
            tombol('-', () => { skala = Math.max(0.24, +(skala - 0.12).toFixed(2)); terapkanTransform(); }, 'sekunder'),
            lblZoom,
            tombol('+', () => { skala = Math.min(1.4, +(skala + 0.12).toFixed(2)); terapkanTransform(); }, 'sekunder'),
            tombol('Sesuaikan', () => sesuaikanLayar(), 'sekunder'),
            tombol('Fokus', () => { if (tabelTerpilih) fokusKeTabel(tabelTerpilih); }, 'sekunder'),
        );
        bar.append(pills, inCari, zoomBar);

        // Interaksi drag/pan & wheel zoom pada kanvas
        let menyeret = false;
        let awalX = 0;
        let awalY = 0;
        kanvasBox.addEventListener('pointerdown', (e) => {
            if (e.target.closest('button') || e.target.closest('[data-minimap]')) return;
            menyeret = true;
            awalX = e.clientX - panX;
            awalY = e.clientY - panY;
            kanvasBox.style.cursor = 'grabbing';
            kanvasBox.setPointerCapture(e.pointerId);
        });
        kanvasBox.addEventListener('pointermove', (e) => {
            if (!menyeret) return;
            panX = e.clientX - awalX;
            panY = e.clientY - awalY;
            terapkanTransform();
        });
        const lepasSeret = () => {
            menyeret = false;
            kanvasBox.style.cursor = 'grab';
        };
        kanvasBox.addEventListener('pointerup', lepasSeret);
        kanvasBox.addEventListener('pointercancel', lepasSeret);
        kanvasBox.addEventListener('wheel', (e) => {
            e.preventDefault();
            const rect = kanvasBox.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            const faktor = e.deltaY < 0 ? 1.1 : 0.9;
            const baru = Math.max(0.24, Math.min(1.4, +(skala * faktor).toFixed(3)));
            panX = mx - ((mx - panX) * baru) / skala;
            panY = my - ((my - panY) * baru) / skala;
            skala = baru;
            terapkanTransform();
        }, { passive: false });

        minimap.dataset.minimap = '1';
        minimap.addEventListener('click', (e) => {
            e.stopPropagation();
            const rect = minimap.getBoundingClientRect();
            const mapX = (e.clientX - rect.left) / miniSkala;
            const mapY = (e.clientY - rect.top) / miniSkala;
            panX = Math.round((kanvasBox.clientWidth || 800) / 2 - mapX * skala);
            panY = Math.round((kanvasBox.clientHeight || 520) / 2 - mapY * skala);
            terapkanTransform();
        });

        kanvasBox.append(stage, minimap, legenda);

        // Panel Inspector Detail Tabel di kanan
        const insp = kartu({ susun: 'sm', style: { maxHeight: '74vh', overflowY: 'auto' } });
        const detail = (data.tabel || []).find((t) => t.nama === tabelTerpilih);
        if (!detail) {
            insp.append('Pilih salah satu tabel di peta untuk melihat detail kolom dan relasinya.');
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

        requestAnimationFrame(() => {
            if (!kanvasBox.isConnected) return;
            if (butuhFokus && tabelTerpilih) {
                butuhFokus = false;
                fokusKeTabel(tabelTerpilih);
            } else if (butuhFit) {
                butuhFit = false;
                sesuaikanLayar();
            } else {
                terapkanTransform();
            }
        });
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
