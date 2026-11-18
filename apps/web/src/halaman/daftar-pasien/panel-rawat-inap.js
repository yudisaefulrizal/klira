import { DISPOSISI_PULANG, INDIKATOR_KELAS, KELAS_RAWAT, KLINIS, RAWAT_INAP, TANDA_VITAL } from '@klira/shared';
import { daftarCatatanHarian, ambilRawatInap } from '../../api-klien/rawat-inap.js';
import { GalatApi } from '../../api-klien/klien.js';
import { token } from '../../gaya/token.js';
import { kartu, lencana, peringatan, tombol } from '../../komponen/ui/primitif.js';
import { bukaPemulanganRawatInap } from '../../modal/rawat-inap/pemulangan-rawat-inap.js';
import { bukaUbahPenempatan } from '../../modal/rawat-inap/ubah-penempatan.js';
import { formatWaktu } from '../../util/tab/penyaring-tab.js';

const pesanGalat = (e, bawaan) => (e instanceof GalatApi ? e.message : bawaan);

function ringkasTandaVital(tv) {
    if (!tv) return '-';
    const bagian = [];
    if (tv.sistolik != null && tv.diastolik != null) bagian.push(`TD ${tv.sistolik}/${tv.diastolik}`);
    if (tv.nadi != null) bagian.push(`N ${tv.nadi}`);
    if (tv.respirasi != null) bagian.push(`R ${tv.respirasi}`);
    if (tv.suhu != null) bagian.push(`S ${tv.suhu}°C`);
    if (tv.spo2 != null) bagian.push(`SpO2 ${tv.spo2}%`);
    if (tv.gcs != null) bagian.push(`GCS ${tv.gcs}`);
    if (tv.tinggi_badan != null || tv.berat_badan != null) bagian.push(`TB/BB ${tv.tinggi_badan ?? '-'}/${tv.berat_badan ?? '-'}`);
    if (bagian.length) return bagian.join(' · ');
    return TANDA_VITAL.filter((t) => tv[t.kunci] != null).map((t) => `${KLINIS.tandaVital[t.kunci]} ${tv[t.kunci]}`).join(' · ') || '-';
}

/** Tabel histori pemeriksaan Rawat Inap (CPPT) bergaya spreadsheet/Excel di bawah formulir Pemeriksaan. */
export function TabelHistoriCppt({ kunjunganId }) {
    const C = RAWAT_INAP.cppt;
    const el = document.createElement('section');
    Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.sm, marginTop: token.jarak.md });

    const kepala = document.createElement('div');
    Object.assign(kepala.style, { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: token.jarak.sm });
    const judul = document.createElement('strong');
    judul.textContent = 'Histori pemeriksaan rawat inap';
    const jumlah = document.createElement('small');
    jumlah.className = 'profil-redup';
    kepala.append(judul, jumlah);

    const status = document.createElement('div');
    const bungkusTabel = document.createElement('div');
    Object.assign(bungkusTabel.style, { overflowX: 'auto', border: '1px solid var(--garis, rgba(148, 163, 184, 0.35))', borderRadius: '8px' });
    el.append(kepala, status, bungkusTabel);

    let aktif = true, versi = 0;

    function buatSel(tag, teks, styleTambahan = {}) {
        const sel = document.createElement(tag);
        if (teks !== undefined) sel.textContent = teks;
        Object.assign(sel.style, {
            padding: '7px 10px',
            borderBottom: '1px solid var(--garis, rgba(148, 163, 184, 0.25))',
            borderRight: '1px solid var(--garis, rgba(148, 163, 184, 0.25))',
            verticalAlign: 'top',
            fontSize: token.huruf.ukuran.kecil,
            textAlign: 'left',
            ...styleTambahan,
        });
        return sel;
    }

    async function muat() {
        const saat = ++versi;
        try {
            const liste = await daftarCatatanHarian(kunjunganId);
            if (!aktif || saat !== versi) return;
            status.replaceChildren();
            bungkusTabel.replaceChildren();
            jumlah.textContent = `${liste.length} entri`;

            if (!liste.length) {
                const kosong = document.createElement('p');
                kosong.className = 'profil-redup';
                kosong.style.padding = '12px';
                kosong.style.margin = '0';
                kosong.textContent = C.kosong;
                bungkusTabel.append(kosong);
                return;
            }

            const tbl = document.createElement('table');
            Object.assign(tbl.style, { width: '100%', borderCollapse: 'collapse', minWidth: '960px' });

            const thead = document.createElement('thead');
            const trHead = document.createElement('tr');
            for (const [label, minW] of [
                ['Waktu', '115px'],
                ['Pemeriksa', '130px'],
                ['Tanda Vital', '175px'],
                ['S (Subjektif)', '160px'],
                ['O (Objektif)', '160px'],
                ['A (Asesmen)', '150px'],
                ['P (Plan)', '160px'],
                ['Instruksi', '140px'],
                ['Status', '80px'],
            ]) {
                trHead.append(buatSel('th', label, {
                    minWidth: minW,
                    fontWeight: token.huruf.berat.tebal,
                    background: 'var(--permukaan-2, rgba(148, 163, 184, 0.12))',
                    whiteSpace: 'nowrap',
                }));
            }
            thead.append(trHead);

            const tbody = document.createElement('tbody');
            for (const c of liste) {
                const tr = document.createElement('tr');
                tr.append(
                    buatSel('td', formatWaktu(c.waktu), { whiteSpace: 'nowrap' }),
                    buatSel('td', c.dibuat_oleh_nama ?? '-'),
                    buatSel('td', ringkasTandaVital(c.tanda_vital), { whiteSpace: 'pre-wrap' }),
                    buatSel('td', c.subjektif || '-', { whiteSpace: 'pre-wrap' }),
                    buatSel('td', c.objektif || '-', { whiteSpace: 'pre-wrap' }),
                    buatSel('td', c.asesmen || '-', { whiteSpace: 'pre-wrap' }),
                    buatSel('td', c.rencana || '-', { whiteSpace: 'pre-wrap' }),
                    buatSel('td', c.instruksi || '-', { whiteSpace: 'pre-wrap' }),
                );
                const selStatus = buatSel('td', undefined, { whiteSpace: 'nowrap' });
                selStatus.append(lencana(c.verifikasi === 'sah' ? C.sah : C.berubah, c.verifikasi === 'sah' ? 'hijau' : 'merah'));
                tr.append(selStatus);
                tbody.append(tr);
            }

            tbl.append(thead, tbody);
            bungkusTabel.append(tbl);
        } catch (e) {
            if (aktif && saat === versi) status.replaceChildren(peringatan(pesanGalat(e, C.gagal)));
        }
    }

    void muat();
    el.muatUlang = () => { void muat(); };
    el.tutup = () => { aktif = false; versi++; };
    return el;
}

/** Tab Rawat inap untuk kunjungan Rawat Inap (IMP): status bed, pindah bed / ubah DPJP, riwayat bed, pemulangan pasien, dan histori pemeriksaan CPPT. */
export function PanelBangsal({ kunjunganId, pasien, bolehInput = false, onBerubah }) {
    const P = RAWAT_INAP.penempatan, PM = RAWAT_INAP.pulang, PB = RAWAT_INAP.papan;
    const el = document.createElement('div'), status = document.createElement('div'), isi = document.createElement('div'), riwayatBed = document.createElement('div');
    const histori = TabelHistoriCppt({ kunjunganId });
    Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md });
    Object.assign(isi.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md });
    Object.assign(riwayatBed.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md });
    el.append(status, isi, histori, riwayatBed);

    let aktif = true, versi = 0, modal;
    const tutupModal = () => { modal?.tutup(); modal = undefined; };

    function kecil(teks) {
        const node = document.createElement('span');
        node.textContent = teks;
        Object.assign(node.style, { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil });
        return node;
    }

    async function muat() {
        const saat = ++versi;
        try {
            const d = await ambilRawatInap(kunjunganId);
            if (!aktif || saat !== versi) return;
            status.replaceChildren();
            isi.replaceChildren();
            riwayatBed.replaceChildren();

            const kj = d.kunjungan;
            const bedAktif = d.penempatan.find((x) => !x.selesai) ?? null;
            const sudahPulang = !!d.pemulangan || kj.status === 'finished' || kj.tahap_layanan !== 'pemeriksaan';

            const ringkasKartu = kartu({ susun: 'sm' });
            const atas = document.createElement('div');
            Object.assign(atas.style, { display: 'flex', gap: token.jarak.sm, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' });
            const judul = document.createElement('strong');
            judul.textContent = bedAktif
                ? `${[bedAktif.ruang_nama, bedAktif.bed_nama].filter(Boolean).join(' · ')} · ${KELAS_RAWAT.label(bedAktif.kelas)}`
                : P.belumAda;
            atas.append(judul, lencana(sudahPulang ? 'Selesai dirawat' : bedAktif ? 'Dirawat' : 'Menunggu bed', sudahPulang ? 'hijau' : bedAktif ? 'biru' : 'kuning'));
            ringkasKartu.append(atas);

            if (bedAktif) {
                ringkasKartu.append(kecil(`${INDIKATOR_KELAS.label(bedAktif.indikator)} · ${PB.sejak(formatWaktu(bedAktif.mulai))}`));
            }
            const utama = d.dpjp?.find((x) => x.tipe === 'ATND') ?? d.dpjp?.[0] ?? null;
            const rekan = (d.dpjp ?? []).filter((x) => x !== utama);
            const dpjpUtama = utama ? PB.dpjp(utama.nama) : 'DPJP belum ditetapkan';
            const dpjpBersama = rekan.length ? ` · Bersama: ${rekan.map((x) => x.nama).join(', ')}` : '';
            ringkasKartu.append(kecil(`${dpjpUtama}${dpjpBersama}`));

            if (!sudahPulang && bolehInput) {
                const aksi = document.createElement('div');
                Object.assign(aksi.style, { display: 'flex', gap: token.jarak.sm, flexWrap: 'wrap', marginTop: token.jarak.xs });
                const onSelesai = () => { tutupModal(); void muat(); onBerubah?.(); };
                aksi.append(
                    tombol(bedAktif ? PB.penempatan : PB.tempatkan, () => {
                        tutupModal();
                        modal = bukaUbahPenempatan({ kunjunganId, onTutup: tutupModal, onSelesai });
                    }, 'sekunder'),
                    tombol(PB.pemulangan, () => {
                        tutupModal();
                        modal = bukaPemulanganRawatInap({ kunjunganId, pasien: { nama: pasien.nama, nomor_rm: pasien.nomor_rm }, onTutup: tutupModal, onSelesai });
                    }),
                );
                ringkasKartu.append(aksi);
            }
            isi.append(ringkasKartu);

            if (d.pemulangan) {
                const pulangKartu = kartu({ susun: 'xs' });
                const jPulang = document.createElement('strong');
                jPulang.textContent = PM.judul;
                pulangKartu.append(
                    jPulang,
                    kecil(`${d.pemulangan.disposisi ? DISPOSISI_PULANG.label(d.pemulangan.disposisi) : (d.pemulangan.kondisi_pulang ?? '-')}${d.pemulangan.waktu ? ` · ${formatWaktu(d.pemulangan.waktu)}` : ''}`),
                    ...(d.pemulangan.catatan ? [kecil(d.pemulangan.catatan)] : []),
                );
                isi.append(pulangKartu);
            }

            if (d.penempatan.length) {
                const riwayatKartu = kartu({ susun: 'xs' });
                const jRiwayat = document.createElement('strong');
                jRiwayat.textContent = P.riwayat;
                riwayatKartu.append(jRiwayat);
                for (const x of [...d.penempatan].reverse()) {
                    riwayatKartu.append(kecil(`${[x.ruang_nama, x.bed_nama].filter(Boolean).join(' · ')} · ${KELAS_RAWAT.label(x.kelas)} · ${INDIKATOR_KELAS.label(x.indikator)} · ${formatWaktu(x.mulai)}${x.selesai ? ` - ${formatWaktu(x.selesai)}` : ' (aktif)'}`));
                }
                riwayatBed.append(riwayatKartu);
            }
        } catch (e) {
            if (aktif && saat === versi) status.replaceChildren(peringatan(pesanGalat(e, RAWAT_INAP.gagalMuat)));
        }
    }

    void muat();
    el.muatUlangHistori = () => histori.muatUlang();
    el.tutup = () => { aktif = false; versi++; tutupModal(); histori.tutup(); };
    return el;
}
