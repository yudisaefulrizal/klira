import { dengarAntreanBerubah } from '../../util/panggilan/peristiwa-antrean.js';
import { bukaUbahDpjp } from '../../modal/pasien/ubah-dpjp.js';
import { izinSaatIni } from '../../komponen/izin/izin-saja.js';
import { bidang,tombol,kartu,tabel,baris,sel,lencana,peringatan,tab } from '../../komponen/ui/primitif.js';
import { TabJadwal } from '../../komponen/master/tab-jadwal.js';
import { TabShift } from '../../komponen/master/tab-shift.js';
import { KelolaMasterTab } from '../../komponen/master/kelola-master-tab.js';
import { pilihTab } from '../../util/tab/ingatan-tab.js';
import { IkonPasien, TombolIkonPasien } from '../../komponen/klinis/ikon-pasien.js';
import { pasangKesiapan } from '../../komponen/klinis/kesiapan-klinik.js';
import { pesanSaatIni } from '../pesan/whatsapp/konteks-pesan.js';
import { tanggalWib, ANTREAN_JKN, CARA_PEMBAYARAN, DAFTAR_PASIEN, FITUR_AKSES_PASIEN, JENIS_KUNJUNGAN, RAWAT_INAP, STATUS_HASIL_LAB, STATUS_LAYANAN, statusLayananDari, STATUS_IDENTITAS, } from '@klira/shared';
import { HalamanRawatInap } from '../rawat-inap/rawat-inap.js';
import { daftarPasien } from '../../api-klien/pasien.js';
import { GalatApi } from '../../api-klien/klien.js';
import { token } from '../../gaya/token.js';
import { penggunaSaatIni } from '../../util/sesi/konteks-pengguna.js';
import { navigasiSaatIni } from '../../util/navigasi/navigasi.js';
import { adalahPintasanCari, keadaanPasienDariQuery, lamaMenunggu, queryPasien, TAHAP_PENYARING, tahapBawaan, ubahKeadaanPasien } from '../../util/penyaring/penyaring-pasien.js';
import { paginasi } from '../../komponen/ui/primitif.js';
import { bukaPendaftaranKunjungan } from '../../modal/pasien/pendaftaran-kunjungan.js';
import { alamatProfil } from './keadaan-profil-pasien.js';
import { bukaRegistrasiPasien } from '../../modal/pasien/registrasi-pasien.js';
import { tanggalLengkapSah } from '../../util/tanggal-tiga.js';
import { TabPasien } from './tab-pasien.js';
const UKURAN = 20;
const KOLOM = [
    { judul: DAFTAR_PASIEN.kolom.antrean }, { judul: DAFTAR_PASIEN.kolom.pasien }, { judul: DAFTAR_PASIEN.kolom.nomorRm }, { judul: DAFTAR_PASIEN.kolom.poliDpjp },
    { judul: DAFTAR_PASIEN.kolom.pembayaran }, { judul: DAFTAR_PASIEN.kolom.tindakan, rataKanan: true },
];
export function HalamanDaftarPasien() {
    const { pengguna } = penggunaSaatIni(), { search: initialSearch, ganti, pindah } = navigasiSaatIni(), boleh = izinSaatIni(), pesan = pesanSaatIni();
    let search = initialSearch, keadaan = keadaanPasienDariQuery(search), cari = keadaan.cari, hasil = null, galat = null, terbuka = null, sekarang = new Date(), actif = true, tabTerlukis = null, version = 0, timer, modal, kesiapanTutup, page;
    const kotakCari = { current: null }, el = document.createElement('div'), contenu = document.createElement('div');
    el.style.display = 'contents';
    el.append(contenu);
    const setTerbuka = value => {
        modal?.tutup();
        modal = undefined;
        terbuka = value;
        if (!value)
            return;
        const props = { ...value, ...value.pasien, pasien: value.pasien, onTutup: tutup, onSelesai: selesai };
        if (value.jenis === 'registrasi')
            modal = bukaRegistrasiPasien({ ...props, onDaftarkanKunjungan(pasien) { setTerbuka({ jenis: 'kunjungan', pasien }); } });
        else if (value.jenis === 'kunjungan')
            modal = bukaPendaftaranKunjungan(props);
    };
    function tutup() { modal?.tutup(); modal = undefined; terbuka = null; }
    function selesai() { tutup(); void muat(); }
    function terapkan(p) { ganti(`/pasien${queryPasien(ubahKeadaanPasien(keadaanPasienDariQuery(search), p))}`); }
    function setCari(value) {
        cari = value;
        clearTimeout(timer);
        timer = setTimeout(() => {
            if (actif && value.trim().length !== 1)
                terapkan({ cari: value.trim() });
        }, 300);
    }
    function view() {
        const tanggalAktif = keadaan.tanggal ?? tanggalWib(sekarang), hariIni = tanggalWib(sekarang), kemarin = tanggalWib(new Date(sekarang.getTime() - 86400000));
        const section = document.createElement('section'), header = document.createElement('header'), toolbar = document.createElement('div'), actions = document.createElement('div');
        section.className = 'halaman-pasien'; header.className = 'pasien-header'; toolbar.className = 'pasien-toolbar'; actions.className = 'pasien-aksi-utama';
        const searchBox = document.createElement('div'); searchBox.className = 'pasien-pencarian pasien-isian-ikon'; searchBox.title = 'Cari pasien (/)'; kotakCari.current = searchBox;
        const searchField = bidang({ id: 'cari-pasien', label: DAFTAR_PASIEN.cari, jenis: 'search', nilai: cari, autoComplete: 'off', ubah: setCari }); searchField.kontrol.placeholder = DAFTAR_PASIEN.petunjukCari; searchBox.append(IkonPasien({nama:'cari'}),searchField.el);
        // Diterapkan saat pengetikan selesai (tahun empat digit, Enter, atau fokus keluar), bukan tiap kali tanggalnya kebetulan sah.
        const tanggalFilter = bidang({id:'tanggal-pasien',label:'Tanggal kunjungan',jenis:'date',nilai:tanggalAktif}); tanggalFilter.kontrol.addEventListener('tanggal-selesai',()=>{const v=tanggalFilter.kontrol.value;if(tanggalLengkapSah(v)&&v!==(keadaan.tanggal??tanggalWib(sekarang)))terapkan({tanggal:v});});
        const dates = document.createElement('div'); dates.className = 'pasien-tanggal pasien-isian-ikon'; dates.append(IkonPasien({nama:'tanggal'}),tanggalFilter.el);
        const disposables = [];
        function icon(props) { const b = TombolIkonPasien(props); disposables.push(b); return b; }
        toolbar.append(searchBox,dates,icon({ikon:'hari-ini',label:'Hari ini',varian:tanggalAktif===hariIni?'sekunder':'teks','aria-pressed':tanggalAktif===hariIni,onClick(){const q=new URLSearchParams(queryPasien({...keadaan,halaman:1}));q.delete('tanggal');ganti(`/pasien?${q}`);}}),icon({ikon:'tanggal',label:'Kemarin',varian:tanggalAktif===kemarin?'sekunder':'teks','aria-pressed':tanggalAktif===kemarin,onClick(){terapkan({tanggal:kemarin});}}));
        if(boleh('kunjungan','input'))actions.append(icon({ikon:'kunjungan-baru',label:DAFTAR_PASIEN.daftarkanKunjungan,varian:'sekunder',onClick(){setTerbuka({jenis:'kunjungan'});}}));
        if(boleh('pasien','input'))actions.append(icon({ikon:'pasien-baru',label:DAFTAR_PASIEN.registrasi,onClick(){setTerbuka({jenis:'registrasi'});}}));
        header.append(toolbar,actions);section.append(header);
        // Penyaring tahap: tombol dengan jumlah; bawaan menurut peran, pilihan tetap di alamat halaman.
        const tahapAktif=keadaan.tahap??tahapBawaan(boleh),jumlahTahap=hasil?.jumlah_tahap,penyaring=document.createElement('div');penyaring.className='pasien-penyaring';penyaring.setAttribute('role','group');penyaring.setAttribute('aria-label',DAFTAR_PASIEN.penyaringTahap);
        for(const t of TAHAP_PENYARING){const n=jumlahTahap?(t==='semua'?Object.values(jumlahTahap).reduce((a,b)=>a+b,0):jumlahTahap[t]??0):null,b=tombol(`${DAFTAR_PASIEN.tahap[t]}${n===null?'':` ${n}`}`,()=>terapkan({tahap:t}),t===tahapAktif?'utama':'sekunder');b.setAttribute('aria-pressed',String(t===tahapAktif));penyaring.append(b);}
        section.append(penyaring);if(galat)section.append(peringatan(galat));
        const readiness=document.createElement('div');readiness.style.display='contents';section.append(readiness);kesiapanTutup=pasangKesiapan(readiness,pengguna,'spanduk',ganti);
        const box=kartu({style:{padding:'0',overflow:'hidden'}});box.classList.add('pasien-tabel');const title=document.createElement('div'),h=document.createElement('h2'),count=document.createElement('span');title.className='pasien-tabel-judul';h.textContent=DAFTAR_PASIEN.judul;count.setAttribute('role','status');count.textContent=hasil?`${hasil.total} pasien`:'Memuat pasien…';title.append(h,count);box.append(title);
        const table=tabel(KOLOM,DAFTAR_PASIEN.judul);box.append(table.el);
        for(const b of hasil?.data??[]){const k=b.kunjungan,tunggu=k&&k.tahap_layanan!=='ditutup'&&k.antrean?.status!=='batal'?lamaMenunggu(k.mulai,sekarang):null;
            const queue=sel();queue.style.fontWeight=token.huruf.berat.tebal;if(k){const st=statusLayananDari(k);queue.append(k.antrean?k.antrean.kode:DAFTAR_PASIEN.tanpaAntrean,' ',lencana(STATUS_LAYANAN.label(st),STATUS_LAYANAN.warna(st)));if(k.hasil_lab&&['kasir','ditutup'].includes(k.tahap_layanan)){queue.append(' ',lencana(`${DAFTAR_PASIEN.hasilLab}: ${STATUS_HASIL_LAB.label(k.hasil_lab)}`,STATUS_HASIL_LAB.warna(k.hasil_lab)));}const lab=k.lab?.perlu_spesimen?DAFTAR_PASIEN.labSpesimen:k.lab?.perlu_hasil?DAFTAR_PASIEN.labHasil:null;if(lab)queue.append(' ',lencana(lab,'abu'));if(k.antrean?.sumber==='mobile_jkn'){const jkn=lencana(ANTREAN_JKN.lencanaSumber(k.antrean.pcare_no_urut),'biru');if(k.antrean.pcare_no_urut)jkn.title=ANTREAN_JKN.lencanaPetunjuk(k.antrean.pcare_no_urut);queue.append(' ',jkn);}if(k.antrean?.bpjs_status==='gagal'){const gagalBpjs=lencana(ANTREAN_JKN.sinkron.lencanaGagal,'merah');gagalBpjs.title=ANTREAN_JKN.sinkron.gagal(k.antrean.bpjs_pesan??'');queue.append(' ',gagalBpjs);}}else queue.append(DAFTAR_PASIEN.tanpaAntrean);
            // Lama menunggu ditampilkan di sel Antrean, setelah status.
            if(tunggu){const lama=document.createElement('small');Object.assign(lama.style,{color:token.warna.teksRedup,fontWeight:token.huruf.berat.biasa});lama.textContent=` ${tunggu.jam?DAFTAR_PASIEN.jamMenit(tunggu.jam,tunggu.menit):DAFTAR_PASIEN.menit(tunggu.menit)}`;queue.append(lama);}
            const patient=sel(),name=tombol(b.nama,()=>pindah(alamatProfil({pasien:b.id,kunjungan:k?.id??null})),'teks');name.setAttribute('aria-label',`Buka halaman pasien ${b.nama}`);Object.assign(name.style,{fontWeight:token.huruf.berat.tebal,padding:'0'});const meta=document.createElement('span');Object.assign(meta.style,{fontSize:token.huruf.ukuran.kecil,color:token.warna.teksRedup});meta.textContent=` (${DAFTAR_PASIEN.jenisKelaminSingkat[b.jenis_kelamin]}, ${DAFTAR_PASIEN.umur(b.umur_tahun)})`;if(b.status_identitas==='sementara')meta.append(' ',lencana(STATUS_IDENTITAS.label('sementara'),STATUS_IDENTITAS.warna('sementara')));patient.append(name,meta);
            const poli=sel();if(k){if(k.poli_nama)poli.append(k.poli_nama);else if(k.jenis_poli){const jp=document.createElement('span');jp.textContent=k.jenis_poli;jp.title=DAFTAR_PASIEN.poliSaatDipanggil;jp.style.fontStyle='italic';poli.append(jp);}else poli.append(lencana(JENIS_KUNJUNGAN.label(k.jenis),JENIS_KUNJUNGAN.warna(k.jenis)));const doctor=document.createElement('small');doctor.style.color=token.warna.teksRedup;doctor.textContent=` ${k.dpjp_nama??'-'}`;poli.append(doctor);}else poli.append(DAFTAR_PASIEN.tanpaKunjungan);
            const actionCell=sel(),row=document.createElement('div');Object.assign(row.style,{display:'inline-flex',gap:token.jarak.sm,flexWrap:'wrap',justifyContent:'flex-end',alignItems:'stretch'});actionCell.style.textAlign='right';
            const bisaUbahDpjp = boleh('kunjungan', 'input') && k && k.jenis === 'AMB' && ['menunggu_skrining', 'pemeriksaan'].includes(k.tahap_layanan) && !['dilayani', 'selesai', 'batal'].includes(k.antrean?.status);
            if (bisaUbahDpjp) row.append(tombol('Ubah dokter', () => bukaUbahDpjp({ pasienNama: b.nama, kunjungan: k, onSelesai: () => void muat() }), 'sekunder'));
            if(boleh('whatsapp','lihat'))row.append(icon({ikon:'whatsapp',label:'WhatsApp',varian:'teks',onClick(){pesan.bukaPasien({id:b.id,nama:b.nama});}}));
            row.append(icon({ikon:'buka',label:DAFTAR_PASIEN.aksi.bukaPasien,varian:'utama',onClick(){pindah(alamatProfil({pasien:b.id,kunjungan:k?.id??null}));}}));actionCell.append(row);
            table.tbody.append(baris(queue,patient,sel(b.nomor_rm),poli,sel(k?CARA_PEMBAYARAN.label(k.cara_pembayaran):'-'),actionCell));
        }
        if(hasil&&!hasil.data.length){const empty=document.createElement('div');empty.style.padding=token.jarak.md;empty.style.color=token.warna.teksRedup;empty.textContent=DAFTAR_PASIEN.kosong;box.append(empty);}if(hasil){const p=paginasi(keadaan.halaman,hasil.total,hasil.ukuran,h=>terapkan({halaman:h}));if(p)box.append(p);}section.append(box);section.tutup=()=>{for(const d of disposables)d.tutup?.();};return section;
    }
    function paint() {
        if (!actif)
            return;
        const focus = document.activeElement, id = focus?.id, start = focus?.selectionStart, end = focus?.selectionEnd;
        kesiapanTutup?.();
        const T = DAFTAR_PASIEN.tab, bolehPasien = boleh('pasien', 'lihat') || boleh('rekam-medis', 'lihat'), params = new URLSearchParams(search);
        const daftar = [
            ...(FITUR_AKSES_PASIEN.some(f => boleh(f, 'lihat')) ? [{ id: 'antrean', label: T.antrean }] : []),
            ...(bolehPasien ? [{ id: 'pasien', label: T.pasien }] : []),
            ...(boleh('master', 'lihat') ? [{ id: 'poli', label: T.poli }, { id: 'praktisi', label: T.praktisi }, { id: 'shift', label: T.shift }, { id: 'jadwal', label: T.jadwal }] : []),
            ...(boleh('klinis', 'lihat') || boleh('master', 'lihat') ? [{ id: 'rawat-inap', label: RAWAT_INAP.judul }] : []),
        ], ids = daftar.map(t => t.id);
        const tabAktif = ids.length ? pilihTab(ids, params.get('tab'), null) : 'antrean';
        // Tab Pasien menyimpan isian formulir: tidak dibangun ulang saat halaman dilukis ulang, cukup diberi alamat terbaru.
        if (tabAktif === 'pasien' && page?.jenisTab === 'pasien') {
            page.perbaruiAlamat(search);
            return;
        }
        // Tab master (Poli, Praktisi, Jadwal) juga tidak dibangun ulang pada tab yang sama: pelukisan berkala menutup modal yang sedang terbuka.
        if (tabAktif !== 'antrean' && tabAktif !== 'pasien' && tabTerlukis === tabAktif && page) {
            page.perbaruiAlamat?.(search);
            return;
        }
        tabTerlukis = tabAktif;
        page?.tutup?.();
        page = tabAktif === 'pasien' ? TabPasien({ search, pindah, ganti }) : tabAktif === 'antrean' ? view() : tabAktif === 'rawat-inap' ? HalamanRawatInap({ dasar: '/pasien?tab=rawat-inap', paramTab: 'sub' }) : tabAktif === 'jadwal' ? TabJadwal() : tabAktif === 'shift' ? TabShift() : KelolaMasterTab({ jenis: tabAktif });
        contenu.replaceChildren(page);
        if (tabAktif !== 'antrean' && tabAktif !== 'pasien')
            page.perbaruiAlamat?.(search);
        if (id) {
            const f = document.getElementById(id);
            f?.focus();
            if (start != null)
                try {
                    f.setSelectionRange(start, end);
                }
                catch { }
        }
    }
    async function muat() {
        // Antrean hanya dimuat saat tabnya terbuka (tab Pasien memuat datanya sendiri).
        if (page?.jenisTab === 'pasien' || (tabTerlukis && tabTerlukis !== 'antrean'))
            return;
        const saat = ++version;
        try {
            const h = await daftarPasien({ tanggal: keadaan.tanggal ?? tanggalWib(sekarang), cari: keadaan.cari, tahap: keadaan.tahap ?? tahapBawaan(boleh), halaman: keadaan.halaman, ukuran: 20 });
            if (actif && saat === version) {
                hasil = h;
                galat = null;
                paint();
            }
        }
        catch (e) {
            if (actif && saat === version) {
                galat = e instanceof GalatApi ? e.message : DAFTAR_PASIEN.gagalMuat;
                paint();
            }
        }
    }
    function tekan(e) {
        if (adalahPintasanCari(e) && !terbuka) {
            e.preventDefault();
            kotakCari.current?.querySelector('input')?.focus();
        }
    }
    el.perbaruiAlamat = alamat => { search = alamat; keadaan = keadaanPasienDariQuery(search); cari = keadaan.cari; paint(); void muat(); };
    document.addEventListener('keydown', tekan);
    const minute = setInterval(() => { sekarang = new Date(); paint(); }, 60000);
    // Antrean dari Mobile JKN masuk tanpa tindakan petugas (server menariknya dari PCare): daftar dimuat ulang berkala selama tidak ada modal terbuka.
    // Sinyal WebSocket dari server membuat antrean baru muncul seketika; pemuatan berkala tinggal jaring pengaman bila sambungan putus.
    const segarkan = setInterval(() => { if (!terbuka && !document.hidden) void muat(); }, 60000);
    const lepasSinyal = dengarAntreanBerubah(() => { if (!terbuka && !document.hidden) void muat(); });
    if (!document.querySelector('link[data-pasien-css]')) {
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = new URL('./daftar-pasien.css', import.meta.url).href;
        css.dataset.pasienCss = '';
        document.head.append(css);
    }
    paint();
    void muat();
    if (new URLSearchParams(search).has('tahap') && !keadaan.tahap)
        ganti(`/pasien${queryPasien(keadaan)}`);
    el.tutup = () => { actif = false; version++; clearTimeout(timer); clearInterval(minute); clearInterval(segarkan); lepasSinyal(); document.removeEventListener('keydown', tekan); modal?.tutup(); page?.tutup?.(); kesiapanTutup?.(); };
    return el;
}
