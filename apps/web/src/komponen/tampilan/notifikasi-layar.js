import { HALAMAN_AWAL, punyaIzin } from '@klira/shared';
import { token } from '../../gaya/token.js';
import { navigasi } from '../../util/navigasi/navigasi.js';
import { sambungkanNotifikasi } from '../../util/notifikasi/sambungan-notifikasi.js';
import { buatSuaraNotifikasi } from '../../util/notifikasi/suara-notifikasi.js';

const IKON_SUARA_AKTIF = '<path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>';
const IKON_SUARA_MATI = '<path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="m22 9-6 6"/><path d="m16 9 6 6"/>';

function ikonSvg(isi) {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${isi}</svg>`;
}

export function berhakNotifikasi(pengguna) {
    if (!pengguna || pengguna.wajib_ganti_kredensial)
        return false;
    return punyaIzin(pengguna, 'klinis', 'sahkan') || punyaIzin(pengguna, 'penunjang', 'input') || punyaIzin(pengguna, 'kasir', 'input');
}

function isiToast(pesan) {
    if (pesan.tipe === 'skrining_selesai') {
        return {
            judul: 'Pasien selesai skrining',
            keterangan: pesan.nomor_antrean ? `Antrean ${pesan.nomor_antrean} siap diperiksa.` : 'Pasien siap diperiksa.',
            tujuan: HALAMAN_AWAL.daftarPasien,
            labelAksi: 'Lihat antrean',
            segera: false,
            durasi: 8000,
        };
    }
    if (pesan.tipe === 'hasil_lab_selesai') {
        return {
            judul: 'Hasil lab selesai',
            keterangan: 'Hasil pemeriksaan lab sudah divalidasi. Pasien siap dipanggil kembali.',
            tujuan: HALAMAN_AWAL.daftarPasien,
            labelAksi: 'Lihat antrean',
            segera: false,
            durasi: 8000,
        };
    }
    if (pesan.tipe === 'hasil_lab_kasir') {
        return {
            judul: 'Hasil lab siap di kasir',
            keterangan: 'Hasil lab kunjungan penunjang sudah divalidasi dan siap diserahkan.',
            tujuan: '/kasir-klaim',
            labelAksi: 'Buka Kasir',
            segera: false,
            durasi: 8000,
        };
    }
    const segera = pesan.prioritas === 'segera';
    const jumlah = Number.isFinite(pesan.jumlah) && pesan.jumlah > 0 ? pesan.jumlah : 1;
    return {
        judul: segera ? 'Order lab SEGERA' : 'Order lab baru',
        keterangan: `${jumlah} pemeriksaan menunggu diproses.`,
        tujuan: '/penunjang',
        labelAksi: 'Buka Penunjang',
        segera,
        durasi: segera ? 12000 : 8000,
    };
}

/**
 * Memasang tombol kontrol suara notifikasi pada bilah atas dan toast notifikasi mengambang
 * untuk dokter (pasien selesai skrining) dan petugas lab (order lab baru).
 */
export function pasangNotifikasiLayar(wadahTombol, pengguna) {
    if (!berhakNotifikasi(pengguna))
        return { tutup() { } };

    const tombol = document.createElement('button');
    tombol.type = 'button';
    tombol.className = 'status-koneksi-ikon';
    Object.assign(tombol.style, {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        background: 'transparent',
        border: `1px solid ${token.warna.garis}`,
        borderRadius: token.radius.sedang,
        width: '32px',
        height: '32px',
        padding: '0',
        color: token.warna.teks,
    });
    wadahTombol.append(tombol);

    const daftarToast = document.createElement('div');
    daftarToast.setAttribute('aria-live', 'polite');
    Object.assign(daftarToast.style, {
        position: 'fixed',
        top: `calc(${token.ukuran.tinggiTema} + 12px)`,
        right: token.jarak.md,
        zIndex: String(token.lapis.konfirmasi),
        display: 'flex',
        flexDirection: 'column',
        gap: token.jarak.sm,
        maxWidth: '360px',
        width: 'calc(100vw - 32px)',
        pointerEvents: 'none',
    });
    document.body.append(daftarToast);

    const timerToast = new Set();

    function perbaruiTombol(st) {
        if (!st.didukung) {
            tombol.disabled = true;
            tombol.innerHTML = ikonSvg(IKON_SUARA_MATI);
            tombol.dataset.tooltip = 'Suara notifikasi tidak didukung peramban';
            tombol.setAttribute('aria-label', 'Suara notifikasi tidak didukung');
            return;
        }
        const label = !st.aktif
            ? 'Suara notifikasi dimatikan — klik untuk mengaktifkan'
            : st.perluInteraksi
                ? 'Klik sekali untuk mengaktifkan suara notifikasi'
                : 'Suara notifikasi aktif — klik untuk mematikan';
        tombol.innerHTML = ikonSvg(st.aktif ? IKON_SUARA_AKTIF : IKON_SUARA_MATI);
        tombol.setAttribute('aria-pressed', String(st.aktif));
        tombol.setAttribute('aria-label', label);
        tombol.dataset.tooltip = label;
        tombol.style.color = !st.aktif ? token.warna.teksRedup : st.perluInteraksi ? token.warna.status.kuning.teks : token.warna.utamaGelap;
        tombol.style.borderColor = st.perluInteraksi && st.aktif ? token.warna.status.kuning.teks : token.warna.garis;
    }

    function tampilkanToast(pesan) {
        const info = isiToast(pesan);
        const kartu = document.createElement('div');
        kartu.setAttribute('role', 'status');
        Object.assign(kartu.style, {
            pointerEvents: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: token.jarak.xs,
            padding: `${token.jarak.sm} ${token.jarak.md}`,
            borderRadius: token.radius.besar,
            background: token.warna.permukaan,
            color: token.warna.teks,
            border: `1px solid ${info.segera ? token.warna.status.merah.teks : token.warna.utama}`,
            boxShadow: token.bayangan.modal,
            fontFamily: token.huruf.keluarga,
            fontSize: token.huruf.ukuran.dasar,
        });

        const atas = document.createElement('div');
        Object.assign(atas.style, { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: token.jarak.sm });
        const judul = document.createElement('strong');
        judul.textContent = info.judul;
        judul.style.color = info.segera ? token.warna.status.merah.teks : token.warna.utamaGelap;

        const tutupBtn = document.createElement('button');
        tutupBtn.type = 'button';
        tutupBtn.textContent = '×';
        tutupBtn.setAttribute('aria-label', 'Tutup notifikasi');
        Object.assign(tutupBtn.style, {
            background: 'transparent',
            border: 'none',
            color: token.warna.teksRedup,
            fontSize: '18px',
            lineHeight: '1',
            cursor: 'pointer',
            padding: '0 4px',
        });

        atas.append(judul, tutupBtn);

        const ket = document.createElement('div');
        ket.textContent = info.keterangan;
        ket.style.color = token.warna.teksRedup;
        ket.style.fontSize = token.huruf.ukuran.kecil;

        const bawah = document.createElement('div');
        Object.assign(bawah.style, { display: 'flex', justifyContent: 'flex-end', marginTop: token.jarak.xs });
        const aksiBtn = document.createElement('button');
        aksiBtn.type = 'button';
        aksiBtn.textContent = info.labelAksi;
        Object.assign(aksiBtn.style, {
            background: info.segera ? token.warna.status.merah.latar : token.warna.utamaLatar,
            color: info.segera ? token.warna.status.merah.teks : token.warna.utamaGelap,
            border: 'none',
            borderRadius: token.radius.sedang,
            padding: '4px 10px',
            font: 'inherit',
            fontSize: token.huruf.ukuran.kecil,
            fontWeight: String(token.huruf.berat.tebal),
            cursor: 'pointer',
        });

        let timer;
        const hapus = () => {
            clearTimeout(timer);
            timerToast.delete(timer);
            kartu.remove();
        };

        tutupBtn.addEventListener('click', hapus);
        aksiBtn.addEventListener('click', () => {
            hapus();
            navigasi.pindah(info.tujuan);
        });

        bawah.append(aksiBtn);
        kartu.append(atas, ket, bawah);
        daftarToast.prepend(kartu);

        while (daftarToast.children.length > 4)
            daftarToast.lastElementChild?.remove();

        timer = setTimeout(hapus, info.durasi);
        timerToast.add(timer);
    }

    const suara = buatSuaraNotifikasi({ onStatus: perbaruiTombol });
    const klikTombol = () => void suara.ubahAktif();
    tombol.addEventListener('click', klikTombol);

    const sambungan = sambungkanNotifikasi({
        asal: window.location.origin,
        onNotifikasi(pesan) {
            tampilkanToast(pesan);
            void suara.putar(pesan);
        },
    });

    return {
        tutup() {
            tombol.removeEventListener('click', klikTombol);
            sambungan.tutup();
            suara.tutup();
            for (const t of timerToast)
                clearTimeout(t);
            timerToast.clear();
            tombol.remove();
            daftarToast.remove();
        },
    };
}
