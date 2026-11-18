import { KLINIS, RAWAT_INAP, TANDA_VITAL } from '@klira/shared';
import { ambilRekamMedisCetak } from '../../api-klien/klinis.js';
import { ambilRawatInap, daftarCatatanHarian } from '../../api-klien/rawat-inap.js';
import { GalatApi } from '../../api-klien/klien.js';
import { tombol, peringatan } from '../../komponen/ui/primitif.js';
import { bukaTabCetak } from '../../util/cetak-tab.js';
import { tanggalPendek, tanggalWaktuPendek } from '../../util/format.js';

function ringkasVital(tv) {
    if (!tv) return '-';
    const bagian = [];
    if (tv.sistolik != null && tv.diastolik != null) bagian.push(`TD ${tv.sistolik}/${tv.diastolik}`);
    if (tv.nadi != null) bagian.push(`N ${tv.nadi}`);
    if (tv.respirasi != null) bagian.push(`R ${tv.respirasi}`);
    if (tv.suhu != null) bagian.push(`S ${tv.suhu}°C`);
    if (tv.spo2 != null) bagian.push(`SpO2 ${tv.spo2}%`);
    if (tv.gcs != null) bagian.push(`GCS ${tv.gcs}`);
    if (tv.tinggi_badan != null || tv.berat_badan != null) bagian.push(`TB/BB ${tv.tinggi_badan ?? '-'}/${tv.berat_badan ?? '-'}`);
    if (bagian.length) return bagian.join(', ');
    return TANDA_VITAL.filter((t) => tv[t.kunci] != null).map((t) => `${KLINIS.tandaVital[t.kunci]} ${tv[t.kunci]}`).join(', ') || '-';
}

function buatLembarCppt({ rm, inap, cppt }) {
    const f = rm.fasyankes, p = rm.pasien, k = rm.klinis.kunjungan;
    const bedAktif = inap?.penempatan?.find((x) => !x.selesai) ?? inap?.penempatan?.at(-1) ?? null;
    const utama = inap?.dpjp?.find((x) => x.tipe === 'ATND') ?? inap?.dpjp?.[0] ?? null;

    const lembar = document.createElement('article');
    lembar.className = 'crm-lembar';

    const kop = document.createElement('header');
    kop.className = 'crm-kepala';
    Object.assign(kop.style, { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '12px' });

    const judulKop = document.createElement('div');
    const h1 = document.createElement('h1');
    h1.textContent = f?.nama ?? 'Klira';
    const subKop = document.createElement('div');
    subKop.className = 'crm-label';
    subKop.textContent = [f?.alamat, f?.telepon].filter(Boolean).join(' · ');
    judulKop.append(h1, subKop);

    const kananKop = document.createElement('div');
    Object.assign(kananKop.style, { textAlign: 'right' });
    const judulDok = document.createElement('strong');
    judulDok.style.display = 'block';
    judulDok.style.fontSize = '11px';
    judulDok.textContent = 'CATATAN PERKEMBANGAN PASIEN TERINTEGRASI (CPPT)';
    kananKop.append(judulDok);
    if (k?.nomor_dokumen) {
        const no = document.createElement('span');
        no.className = 'crm-label';
        no.textContent = `No. Dokumen: ${k.nomor_dokumen}`;
        kananKop.append(no);
    }
    kop.append(judulKop, kananKop);
    lembar.append(kop);

    const info = document.createElement('section');
    info.className = 'crm-blok';
    info.style.gridTemplateColumns = 'minmax(0, 1fr)';
    const pitaInfo = document.createElement('h2');
    pitaInfo.className = 'crm-pita';
    pitaInfo.textContent = 'Identitas Pasien & Rawat Inap';
    const isiInfo = document.createElement('div');
    isiInfo.className = 'crm-isi';
    const kisi = document.createElement('div');
    kisi.className = 'crm-kisi';
    kisi.style.gridTemplateColumns = 'repeat(3, minmax(0, 1fr))';
    for (const [label, nilai] of [
        ['Nama Pasien', p?.nama ?? '-'],
        ['No. RM', p?.nomor_rm ?? '-'],
        ['Tanggal Lahir', p?.tanggal_lahir ? tanggalPendek(p.tanggal_lahir) : '-'],
        ['Kamar / Bed', bedAktif ? [bedAktif.ruang_nama, bedAktif.bed_nama].filter(Boolean).join(' · ') : 'Menunggu bed'],
        ['DPJP Utama', utama?.nama ?? k?.dpjp_nama ?? '-'],
        ['Masuk Rawat', k?.mulai ? tanggalWaktuPendek(k.mulai) : '-'],
    ]) {
        const sel = document.createElement('div');
        sel.className = 'crm-sel';
        const dt = document.createElement('span');
        dt.className = 'crm-label';
        dt.textContent = label;
        const dd = document.createElement('span');
        dd.className = 'crm-nilai';
        dd.style.fontWeight = '600';
        dd.textContent = nilai;
        sel.append(dt, dd);
        kisi.append(sel);
    }
    isiInfo.append(kisi);
    info.append(pitaInfo, isiInfo);
    lembar.append(info);

    const blokTabel = document.createElement('section');
    blokTabel.className = 'crm-blok';
    blokTabel.style.gridTemplateColumns = 'minmax(0, 1fr)';
    blokTabel.style.breakInside = 'auto';
    const pitaTabel = document.createElement('h2');
    pitaTabel.className = 'crm-pita';
    pitaTabel.textContent = `Riwayat Pemeriksaan / Visite (${cppt.length} entri)`;
    blokTabel.append(pitaTabel);

    if (!cppt.length) {
        const kosong = document.createElement('p');
        kosong.style.padding = '10px 8px';
        kosong.style.margin = '0';
        kosong.textContent = RAWAT_INAP.cppt.kosong;
        blokTabel.append(kosong);
    } else {
        const tbl = document.createElement('table');
        Object.assign(tbl.style, { width: '100%', borderCollapse: 'collapse', fontSize: '9.5px', tableLayout: 'fixed' });
        const buatSel = (tag, teks, extra = {}) => {
            const el = document.createElement(tag);
            el.textContent = teks;
            Object.assign(el.style, {
                borderTop: '1px solid #b9c6c3',
                borderRight: '1px solid #b9c6c3',
                padding: '5px 6px',
                verticalAlign: 'top',
                textAlign: 'left',
                whiteSpace: 'pre-wrap',
                overflowWrap: 'anywhere',
                ...extra,
            });
            return el;
        };
        const thead = document.createElement('thead');
        const trH = document.createElement('tr');
        for (const [h, w] of [
            ['Waktu', '10%'],
            ['Pemeriksa', '11%'],
            ['Tanda Vital', '14%'],
            ['S (Subjektif)', '13%'],
            ['O (Objektif)', '13%'],
            ['A (Asesmen)', '11%'],
            ['P (Plan)', '13%'],
            ['Instruksi', '9%'],
            ['Status', '6%'],
        ]) {
            trH.append(buatSel('th', h, { width: w, background: '#f4f8f7', fontWeight: '600', color: '#17302e', borderTop: '0' }));
        }
        trH.lastChild.style.borderRight = '0';
        thead.append(trH);
        const tbody = document.createElement('tbody');
        for (const c of cppt) {
            const tr = document.createElement('tr');
            tr.append(
                buatSel('td', tanggalWaktuPendek(c.waktu)),
                buatSel('td', c.dibuat_oleh_nama ?? '-'),
                buatSel('td', ringkasVital(c.tanda_vital)),
                buatSel('td', c.subjektif || '-'),
                buatSel('td', c.objektif || '-'),
                buatSel('td', c.asesmen || '-'),
                buatSel('td', c.rencana || '-'),
                buatSel('td', c.instruksi || '-'),
                buatSel('td', c.verifikasi === 'sah' ? RAWAT_INAP.cppt.sah : RAWAT_INAP.cppt.berubah, { borderRight: '0' }),
            );
            tbody.append(tr);
        }
        tbl.append(thead, tbody);
        blokTabel.append(tbl);
    }
    lembar.append(blokTabel);
    return lembar;
}

export function bukaCetakCppt({ kunjunganId, onTutup }) {
    const C = KLINIS.cetak, el = document.createElement('div'), outils = document.createElement('div'), title = document.createElement('strong'), espace = document.createElement('span'), contenu = document.createElement('div'), avant = document.activeElement;
    const cssHref = new URL('../rekam-medis/cetak-rekam-medis.css', import.meta.url).href;
    let aktif = true;
    const judul = 'Cetak CPPT';
    const tabCetak = bukaTabCetak({ judul, cssHref, onTutup: () => { aktif = false; onTutup?.(); } });
    if (!tabCetak && !document.querySelector('link[data-cetak-rm]')) {
        const css = document.createElement('link');
        css.rel = 'stylesheet'; css.href = cssHref; css.dataset.cetakRm = '';
        document.head.append(css);
    }
    el.className = 'crm-lapis'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', judul);
    outils.className = 'crm-alat'; title.textContent = judul; espace.className = 'crm-tumbuh';
    function detruire() { aktif = false; document.removeEventListener('keydown', clavier); el.remove(); tabCetak?.hancurkan(); if (!tabCetak && avant?.isConnected) avant.focus(); }
    function fermer() { if (tabCetak) { aktif = false; tabCetak.tutup(); return; } detruire(); onTutup?.(); }
    function clavier(e) {
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); fermer(); }
        if (e.key === 'Tab') {
            const nodes = [...el.querySelectorAll('button:not([disabled]),a[href],input:not([disabled])')];
            const premier = nodes[0], dernier = nodes.at(-1);
            if (e.shiftKey && document.activeElement === premier) { e.preventDefault(); dernier?.focus(); }
            else if (!e.shiftKey && document.activeElement === dernier) { e.preventDefault(); premier?.focus(); }
        }
    }
    const close = tombol(C.tutup, fermer, 'sekunder'), print = tombol(C.cetak, () => (tabCetak ? tabCetak.cetak() : window.print()));
    print.disabled = true;
    outils.append(title, espace, close, print);
    const loading = document.createElement('p');
    loading.className = 'crm-memuat'; loading.textContent = C.memuat;
    contenu.append(loading);
    el.append(outils, contenu);
    if (tabCetak) tabCetak.body.append(el);
    else { document.body.append(el); document.addEventListener('keydown', clavier); close.focus(); }

    Promise.all([ambilRekamMedisCetak(kunjunganId), ambilRawatInap(kunjunganId), daftarCatatanHarian(kunjunganId)])
        .then(([rm, inap, cppt]) => {
            if (!aktif) return;
            contenu.replaceChildren(buatLembarCppt({ rm, inap, cppt }));
            print.disabled = false;
        })
        .catch((e) => {
            if (aktif) contenu.replaceChildren(peringatan(e instanceof GalatApi ? e.message : C.gagal));
        });
    return { tutup: detruire };
}
