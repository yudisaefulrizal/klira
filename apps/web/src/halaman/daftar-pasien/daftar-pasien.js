import { izinSaatIni } from '../../komponen/izin/izin-saja.js';
import { MenuAksi } from '../../komponen/menu/menu-aksi.js';
import { bidang,tombol,kartu,tabel,baris,sel,lencana,peringatan,tab } from '../../komponen/ui/primitif.js';
import { KelolaMasterTab } from '../../komponen/master/kelola-master-tab.js';
import { pilihTab } from '../../util/tab/ingatan-tab.js';
import { IkonPasien, TombolIkonPasien } from '../../komponen/klinis/ikon-pasien.js';
import { pasangKesiapan } from '../../komponen/klinis/kesiapan-klinik.js';
import { pesanSaatIni } from '../pesan/whatsapp/konteks-pesan.js';
import { tanggalWib, CARA_PEMBAYARAN, DAFTAR_PASIEN, FITUR_AKSES_PASIEN, JENIS_KUNJUNGAN, STATUS_HASIL_LAB, STATUS_LAYANAN, statusLayananDari, STATUS_IDENTITAS, } from '@klira/shared';
import { aksiAntrean } from '../../api-klien/kunjungan.js';
import { daftarPasien } from '../../api-klien/pasien.js';
import { GalatApi } from '../../api-klien/klien.js';
import { token } from '../../gaya/token.js';
import { penggunaSaatIni } from '../../util/sesi/konteks-pengguna.js';
import { navigasiSaatIni } from '../../util/navigasi/navigasi.js';
import { adalahPintasanCari, aksiBaris, kelompokAksi, keadaanPasienDariQuery, lamaMenunggu, queryPasien, TAHAP_PENYARING, tahapBawaan, ubahKeadaanPasien } from '../../util/penyaring/penyaring-pasien.js';
import { bukaKonfirmasi } from '../../komponen/modal-1/modal-1.js';
import { paginasi } from '../../komponen/ui/primitif.js';
import { bukaEditPasien } from '../../modal/pasien/edit-pasien.js';
import { bukaAmbilSpesimen } from '../../modal/penunjang/ambil-spesimen.js';
import { bukaDetailPasien } from '../../modal/pasien/detail-pasien.js';
import { bukaHasilLab } from '../../modal/penunjang/hasil-lab.js';
import { bukaOrderLab } from '../../modal/penunjang/order-lab.js';
import { bukaPersetujuanTindakan } from '../../modal/pemeriksaan/persetujuan-tindakan.js';
import { bukaPembayaran } from '../../modal/kasir-klaim/pembayaran.js';
import { bukaTelaahResep } from '../../modal/farmasi/telaah-resep.js';
import { bukaTutupKunjungan } from '../../modal/kasir-klaim/tutup-kunjungan.js';
import { bukaSerahHasil } from '../../modal/kasir-klaim/serah-hasil.js';
import { bukaPendaftaranKunjungan } from '../../modal/pasien/pendaftaran-kunjungan.js';
import { bukaPanelKeluarga } from '../../modal/pasien/panel-keluarga.js';
import { bukaPanelRiwayat } from '../../modal/pasien/panel-riwayat.js';
import { bukaPemeriksaanKlinis } from '../../modal/pemeriksaan/pemeriksaan-klinis.js';
import { bukaRegistrasiPasien } from '../../modal/pasien/registrasi-pasien.js';
const UKURAN = 20;
const IKON_AKSI = {
    buka: 'buka', daftarkan: 'kunjungan-baru', skrining: 'skrining', periksa: 'periksa', telaah: 'telaah',
    serah_obat: 'telaah', serah_hasil: 'telaah', bayar: 'bayar', tutup_kunjungan: 'tutup-kunjungan', persetujuan: 'persetujuan', order_lab: 'order-lab',
    spesimen: 'spesimen', hasil_lab: 'hasil-lab', riwayat: 'riwayat', keluarga: 'keluarga',
    panggil: 'panggil', mulai: 'mulai', selesai: 'selesai', batal: 'batal',
};
const ikonAksi = (jenis) => IKON_AKSI[jenis];
const KOLOM = [
    { judul: DAFTAR_PASIEN.kolom.antrean }, { judul: DAFTAR_PASIEN.kolom.pasien }, { judul: DAFTAR_PASIEN.kolom.nomorRm }, { judul: DAFTAR_PASIEN.kolom.poliDpjp },
    { judul: DAFTAR_PASIEN.kolom.pembayaran }, { judul: DAFTAR_PASIEN.kolom.tindakan, rataKanan: true },
];
const labelAksi = (a, status) => a === 'panggil' && status === 'dipanggil' ? DAFTAR_PASIEN.aksi.panggilUlang : DAFTAR_PASIEN.aksi[a === 'batal' ? 'batal' : a];
export function HalamanDaftarPasien() {
    const { pengguna } = penggunaSaatIni(), { search: initialSearch, ganti } = navigasiSaatIni(), boleh = izinSaatIni(), pesan = pesanSaatIni();
    let search = initialSearch, keadaan = keadaanPasienDariQuery(search), cari = keadaan.cari, hasil = null, galat = null, terbuka = null, memprosesAksi = false, sekarang = new Date(), actif = true, version = 0, timer, modal, kesiapanTutup, page;
    const kotakCari = { current: null }, el = document.createElement('div'), nav = document.createElement('div'), contenu = document.createElement('div');
    el.style.display = 'contents';
    el.append(nav, contenu);
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
        else if (value.jenis === 'pemeriksaan')
            modal = bukaPemeriksaanKlinis(props);
        else if (value.jenis === 'persetujuan')
            modal = bukaPersetujuanTindakan(props);
        else if (value.jenis === 'bayar' || value.jenis === 'serah_obat')
            modal = bukaPembayaran({ ...props, kasir: value.jenis === 'bayar' && boleh('kasir', 'input'), farmasi: boleh('farmasi', 'input') });
        else if (value.jenis === 'serah_hasil')
            modal = bukaSerahHasil({ kunjunganId: value.kunjunganId, pasienNama: value.pasien.nama, onTutup: tutup, onSelesai: selesai });
        else if (value.jenis === 'tutup_kunjungan')
            modal = bukaTutupKunjungan(props);
        else if (value.jenis === 'telaah')
            modal = bukaTelaahResep(props);
        else if (value.jenis === 'order_lab')
            modal = bukaOrderLab(props);
        else if (value.jenis === 'spesimen')
            modal = bukaAmbilSpesimen(props);
        else if (value.jenis === 'hasil_lab')
            modal = bukaHasilLab(props);
        else if (value.jenis === 'riwayat')
            modal = bukaPanelRiwayat({ ...props, pasienId: value.pasien.id });
        else if (value.jenis === 'keluarga')
            modal = bukaPanelKeluarga({ ...props, pasienId: value.pasien.id });
        else if (value.jenis === 'edit-pasien')
            modal = bukaEditPasien(props);
        else if (value.jenis === 'detail')
            modal = bukaDetailPasien(props);
        else if (value.jenis === 'batal-antrean' && value.baris.kunjungan?.antrean)
            modal = bukaKonfirmasi({ judul: DAFTAR_PASIEN.batalJudul, pesan: DAFTAR_PASIEN.batalPesan(value.baris.kunjungan.antrean.kode, value.baris.nama), labelYa: DAFTAR_PASIEN.batalYa, onTidak: tutup, onYa() { const b = value.baris; tutup(); void jalankanAksi(b, 'batal'); } });
    };
    function tutup() { modal?.tutup(); modal = undefined; terbuka = null; }
    function selesai() { tutup(); void muat(); }
    function terapkan(p) { ganti(`/pasien${queryPasien(ubahKeadaanPasien(keadaanPasienDariQuery(search), p))}`); }
    function setCari(value) {
        cari = value;
        clearTimeout(timer);
        timer = setTimeout(() => {
            if (actif)
                terapkan({ cari: value.trim() });
        }, 300);
    }
    function setGalat(value) { galat = value; paint(); }
    async function jalankanAksi(b, aksi) {
        const antrean = b.kunjungan?.antrean;
        if (!antrean || memprosesAksi)
            return;
        memprosesAksi = true;
        paint();
        try {
            await aksiAntrean(antrean.id, aksi);
            galat = null;
        }
        catch (e) {
            galat = e instanceof GalatApi ? e.message : DAFTAR_PASIEN.aksiGagal;
        }
        finally {
            memprosesAksi = false;
            if (actif)
                void muat();
        }
    }
    function view() {
        const tanggalAktif = keadaan.tanggal ?? tanggalWib(sekarang), hariIni = tanggalWib(sekarang), kemarin = tanggalWib(new Date(sekarang.getTime() - 86400000));
        const pasienDari = b => ({ id: b.id, nama: b.nama, nomor_rm: b.nomor_rm, jkn_nomor_kartu: b.jkn_nomor_kartu ?? null });
        function klikAksi(b, { jenis }) {
            const k = b.kunjungan, pasien = pasienDari(b);
            if (jenis === 'buka') return setTerbuka({ jenis: 'detail', pasien });
            if (jenis === 'riwayat' || jenis === 'keluarga') return setTerbuka({ jenis, pasien });
            if (jenis === 'daftarkan') return setTerbuka({ jenis: 'kunjungan', pasien });
            if (jenis === 'batal') return setTerbuka({ jenis: 'batal-antrean', baris: b });
            if (!k) return;
            if (jenis === 'skrining' || jenis === 'periksa') return setTerbuka({ jenis: 'pemeriksaan', mode: jenis, kunjunganId: k.id, pasien });
            if (jenis === 'order_lab') return setTerbuka({ jenis, kunjunganId: k.id, pasien, cara: k.cara_pembayaran === 'jkn' ? 'jkn' : 'umum' });
            if (['persetujuan','spesimen','hasil_lab','telaah','bayar','serah_obat','serah_hasil','tutup_kunjungan'].includes(jenis)) return setTerbuka({ jenis, kunjunganId: k.id, pasien });
            void jalankanAksi(b, jenis);
        }
        const texteAksi = (a, status) => a.ubah ? `${DAFTAR_PASIEN.aksi[a.jenis]} (ubah)` : labelAksi(a.jenis, status);
        const section = document.createElement('section'), header = document.createElement('header'), toolbar = document.createElement('div'), actions = document.createElement('div');
        section.className = 'halaman-pasien'; header.className = 'pasien-header'; toolbar.className = 'pasien-toolbar'; actions.className = 'pasien-aksi-utama';
        const searchBox = document.createElement('div'); searchBox.className = 'pasien-pencarian pasien-isian-ikon'; searchBox.title = 'Cari pasien (/)'; kotakCari.current = searchBox;
        const searchField = bidang({ id: 'cari-pasien', label: DAFTAR_PASIEN.cari, jenis: 'search', nilai: cari, autoComplete: 'off', ubah: setCari }); searchField.kontrol.placeholder = DAFTAR_PASIEN.petunjukCari; searchBox.append(IkonPasien({nama:'cari'}),searchField.el);
        const dates = document.createElement('div'); dates.className = 'pasien-tanggal pasien-isian-ikon'; dates.append(IkonPasien({nama:'tanggal'}),bidang({id:'tanggal-pasien',label:'Tanggal kunjungan',jenis:'date',nilai:tanggalAktif,ubah(v){if(v)terapkan({tanggal:v});}}).el);
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
        for(const b of hasil?.data??[]){const k=b.kunjungan,tunggu=k&&k.tahap_layanan!=='ditutup'&&k.antrean?.status!=='batal'?lamaMenunggu(k.mulai,sekarang):null,{utama,lainnya}=kelompokAksi(b,aksiBaris(b,boleh));
            const queue=sel();queue.style.fontWeight=token.huruf.berat.tebal;if(k){const st=statusLayananDari(k);queue.append(k.antrean?k.antrean.kode:DAFTAR_PASIEN.tanpaAntrean,' ',lencana(STATUS_LAYANAN.label(st),STATUS_LAYANAN.warna(st)));if(k.hasil_lab&&['kasir','ditutup'].includes(k.tahap_layanan)){queue.append(' ',lencana(`${DAFTAR_PASIEN.hasilLab}: ${STATUS_HASIL_LAB.label(k.hasil_lab)}`,STATUS_HASIL_LAB.warna(k.hasil_lab)));}const lab=k.lab?.perlu_spesimen?DAFTAR_PASIEN.labSpesimen:k.lab?.perlu_hasil?DAFTAR_PASIEN.labHasil:null;if(lab)queue.append(' ',lencana(lab,'abu'));}else queue.append(DAFTAR_PASIEN.tanpaAntrean);
            // Lama menunggu ditampilkan di sel Antrean, setelah status.
            if(tunggu){const lama=document.createElement('small');Object.assign(lama.style,{color:token.warna.teksRedup,fontWeight:token.huruf.berat.biasa});lama.textContent=` ${tunggu.jam?DAFTAR_PASIEN.jamMenit(tunggu.jam,tunggu.menit):DAFTAR_PASIEN.menit(tunggu.menit)}`;queue.append(lama);}
            const patient=sel(),name=tombol(b.nama,()=>setTerbuka({jenis:'edit-pasien',pasien:pasienDari(b)}),'teks');name.setAttribute('aria-label',`Buka data pasien ${b.nama}`);Object.assign(name.style,{fontWeight:token.huruf.berat.tebal,padding:'0'});const meta=document.createElement('span');Object.assign(meta.style,{fontSize:token.huruf.ukuran.kecil,color:token.warna.teksRedup});meta.textContent=` (${DAFTAR_PASIEN.jenisKelaminSingkat[b.jenis_kelamin]}, ${DAFTAR_PASIEN.umur(b.umur_tahun)})`;if(b.status_identitas==='sementara')meta.append(' ',lencana(STATUS_IDENTITAS.label('sementara'),STATUS_IDENTITAS.warna('sementara')));patient.append(name,meta);
            const poli=sel();if(k){if(k.poli_nama)poli.append(k.poli_nama);else if(k.jenis_poli){const jp=document.createElement('span');jp.textContent=k.jenis_poli;jp.title=DAFTAR_PASIEN.poliSaatDipanggil;jp.style.fontStyle='italic';poli.append(jp);}else poli.append(lencana(JENIS_KUNJUNGAN.label(k.jenis),JENIS_KUNJUNGAN.warna(k.jenis)));const doctor=document.createElement('small');doctor.style.color=token.warna.teksRedup;doctor.textContent=` ${k.dpjp_nama??'-'}`;poli.append(doctor);}else poli.append(DAFTAR_PASIEN.tanpaKunjungan);
            const actionCell=sel(),row=document.createElement('div');Object.assign(row.style,{display:'inline-flex',gap:token.jarak.sm,flexWrap:'wrap',justifyContent:'flex-end',alignItems:'stretch'});actionCell.style.textAlign='right';
            if(boleh('whatsapp','lihat'))row.append(icon({ikon:'whatsapp',label:'WhatsApp',varian:'teks',onClick(){pesan.bukaPasien({id:b.id,nama:b.nama});}}));
            for(const a of utama){const status=k?.antrean?.status??'',repeat=a.jenis==='panggil'&&status==='dipanggil';row.append(icon({ikon:repeat?'panggil-ulang':ikonAksi(a.jenis),label:texteAksi(a,status)+(a.jenis==='panggil'&&k?.poli_sibuk?` · ${k.poli_sibuk.kode?DAFTAR_PASIEN.poliSibuk(k.poli_nama??k.poli_sibuk.jenis_poli,k.poli_sibuk.kode):DAFTAR_PASIEN.jenisSibuk(k.poli_sibuk.jenis_poli)}`:''),varian:a.jenis==='skrining'||a.jenis==='periksa'?'utama':repeat||['buka','riwayat','keluarga'].includes(a.jenis)?'teks':'sekunder',disabled:a.jenis==='panggil'&&(memprosesAksi||!!k?.poli_sibuk),onClick(){klikAksi(b,a);}}));}
            if(lainnya.length){const menu=MenuAksi({label:DAFTAR_PASIEN.aksiLainnya,items:lainnya.map(a=>({kunci:`${a.jenis}${a.ubah?'-ubah':''}`,label:texteAksi(a,k?.antrean?.status??''),ikon:IkonPasien({nama:a.ubah?'edit':ikonAksi(a.jenis)}),disabled:memprosesAksi&&['panggil','batal'].includes(a.jenis),onPilih(){klikAksi(b,a);}}))});disposables.push(menu);row.append(menu);}actionCell.append(row);
            table.tbody.append(baris(queue,patient,sel(b.nomor_rm),poli,sel(k?CARA_PEMBAYARAN.label(k.cara_pembayaran):'-'),actionCell));
        }
        if(hasil&&!hasil.data.length){const empty=document.createElement('div');empty.style.padding=token.jarak.md;empty.style.color=token.warna.teksRedup;empty.textContent=DAFTAR_PASIEN.kosong;box.append(empty);}if(hasil){const p=paginasi(keadaan.halaman,hasil.total,hasil.ukuran,h=>terapkan({halaman:h}));if(p)box.append(p);}section.append(box);section.tutup=()=>{for(const d of disposables)d.tutup?.();};return section;
    }
    function paint() {
        if (!actif)
            return;
        const focus = document.activeElement, id = focus?.id, start = focus?.selectionStart, end = focus?.selectionEnd;
        kesiapanTutup?.();
        const T = DAFTAR_PASIEN.tab, daftar = [...(FITUR_AKSES_PASIEN.some(f => boleh(f, 'lihat')) ? [{ id: 'antrean', label: T.antrean }] : []), ...(boleh('master', 'lihat') ? [{ id: 'poli', label: T.poli }, { id: 'praktisi', label: T.praktisi }, { id: 'jadwal', label: T.jadwal }] : [])], ids = daftar.map(t => t.id), tabAktif = ids.length ? pilihTab(ids, new URLSearchParams(search).get('tab'), null) : 'antrean';
        nav.replaceChildren();
        if (daftar.length > 1)
            nav.append(tab(daftar,tabAktif,DAFTAR_PASIEN.judul,id=>ganti(id==='antrean'?'/pasien':`/pasien?tab=${id}`)).el);
        page?.tutup?.();
        page = tabAktif === 'antrean' ? view() : KelolaMasterTab({ jenis: tabAktif });
        contenu.replaceChildren(page);
        if (tabAktif !== 'antrean')
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
    el.tutup = () => { actif = false; version++; clearTimeout(timer); clearInterval(minute); document.removeEventListener('keydown', tekan); modal?.tutup(); page?.tutup?.(); kesiapanTutup?.(); };
    return el;
}
