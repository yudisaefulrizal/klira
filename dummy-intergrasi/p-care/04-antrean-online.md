# Antrean online FKTP (Mobile JKN)

Untuk klinik (FKTP), BPJS **tidak** memanggil aplikasi klinik. Klinik yang memanggil BPJS untuk dua hal: mengabarkan antrean, dan menarik pendaftaran dari Mobile JKN. Penanda **[repo]** dan **[dugaan]** mengikuti [README](../README.md).

Dasar kesimpulan (katalog resmi ada di portal TrustMark BPJS dan belum dicocokkan): dua pustaka bridging, [bridging-bpjs](https://github.com/indravscode/bridging-bpjs) dan [ssecd/jkn](https://github.com/ssecd/jkn) (`src/antrean-fktp.ts`), hanya memuat panggilan klinik ke BPJS untuk antrean FKTP. Pola "BPJS memanggil faskes" (token, ambil antrean, sisa antrean, batal) hanya ditemukan di katalog antrean rumah sakit (FKRTL). Panduan pengguna Mobile JKN menyebut antrean FKTP terintegrasi dengan Aplikasi Antrean Faskes dan PCare, dan bisa diambil untuk hari ini atau besok.

## Mengabarkan antrean ke BPJS

Layanan terpisah dari PCare, dengan nama layanan sendiri (`antreanfktp` di dummy, `BPJS_ANTREAN_SERVICE_NAME` di repo) dan user key sendiri. Header sama dengan PCare **[repo]** (kelas `Antrean\*` mewarisi `PcareService`). Amplop respons memakai `metadata` huruf kecil **[dugaan]**: `{ "metadata": { "code": 200, "message": "Ok" }, "response": ... }`. Kode 200 berhasil, 201 gagal **[dugaan]**.

| Metode | Jalur | Keterangan |
|---|---|---|
| GET | `/ref/poli/tanggal/{yyyy-mm-dd}` | Referensi poli **[repo]** |
| GET | `/ref/dokter/kodepoli/{kodepoli}/tanggal/{yyyy-mm-dd}` | Referensi dokter **[repo]** |
| POST | `/antrean/add` | Tambah antrean (pasien daftar di loket) **[repo]** |
| POST | `/antrean/panggil` | Ubah status: `status` 1 hadir, 2 tidak hadir **[repo]** |
| POST | `/antrean/batal` | Batal antrean **[repo]** |

Badan permintaan **[repo]** (contoh README repo):

```json
// antrean/add
{ "nomorkartu": "000012345678", "nik": "3212345678987654", "nohp": "085635228888", "kodepoli": "001", "namapoli": "Umum", "norm": "123345",
  "tanggalperiksa": "2026-11-14", "kodedokter": 12345, "namadokter": "Dr. Hendra", "jampraktek": "08:00-16:00", "nomorantrean": "U-012", "angkaantrean": 12, "keterangan": "" }
// antrean/panggil
{ "tanggalperiksa": "2026-11-14", "kodepoli": "001", "nomorkartu": "0000034563234", "status": 1, "waktu": 1616559330000 }
// antrean/batal
{ "tanggalperiksa": "2026-11-14", "kodepoli": "001", "nomorkartu": "0000045258563", "alasan": "Terjadi perubahan jadwal dokter" }
```

Di klira: dikirim otomatis untuk kunjungan rawat jalan JKN yang pasiennya punya nomor kartu. Menurut komentar di ssecd/jkn, `nomorkartu` boleh kosong untuk pasien non-JKN, jadi tampaknya BPJS mengharapkan semua antrean dikirim; klira belum mengirim pasien non-JKN sampai hal ini dipastikan. `add` saat daftar di loket (antrean dari Mobile JKN tidak ditambahkan lagi), `panggil` saat dipanggil, `batal` saat dibatalkan di klinik. Gagal kirim tidak menggagalkan tindakan; alasannya tercatat di antrean dan tampil sebagai penanda di daftar pasien.

## Menarik pendaftaran Mobile JKN dari PCare

Pendaftaran peserta lewat Mobile JKN tercatat di PCare. Klinik menariknya dengan endpoint pendaftaran PCare biasa:

| Metode | Jalur | Keterangan |
|---|---|---|
| GET | `/pendaftaran/tglDaftar/{dd-MM-yyyy}/{start}/{limit}` | Pendaftaran milik provider pada tanggal itu **[repo]** |

Bahwa pendaftaran Mobile JKN muncul di daftar ini adalah **[dugaan]**; isi respons juga **[dugaan]** (lihat [03-struktur-data.md](03-struktur-data.md)): tiap butir memuat `tglDaftar`, `noUrut`, `peserta` (`noKartu`, `nama`, `sex`, `tglLahir`, `noKTP`, `noHP`), `poli` (`kdPoli`, `nmPoli`), dan `keluhan`.

Di klira (`apps/api/src/modul/antrean-jkn/`):

- Server menarik pendaftaran hari ini tiap 30 detik untuk klinik yang mengaktifkan antrean online; tombol "Tarik pendaftaran Mobile JKN" di layar pengaturan menarik saat itu juga.
- Tiap pendaftaran yang belum punya antrean dijadikan kunjungan rawat jalan JKN. Nomor antreannya memakai penomoran per jenis poli yang sama dengan loket; nomor urut PCare disimpan (`antrean.pcare_no_urut`) dan tampil di lencana "Mobile JKN" di daftar pasien.
- Peserta yang belum punya rekam medis dibuat dari data peserta di PCare, tanpa persetujuan umum; petugas melengkapinya saat pasien datang.
- Peserta yang sudah didaftarkan petugas di loket untuk poli yang sama tidak digandakan; antreannya dikaitkan dengan nomor urut PCare.
- Pendaftaran yang hilang dari PCare (dibatalkan peserta) membatalkan antrean yang masih menunggu. Antrean yang sudah dipanggil dibiarkan.
- Pendaftaran untuk besok baru ditarik pada harinya.
- Kode poli PCare dipetakan ke jenis poli klira di layar pengaturan; pendaftaran ke poli yang belum dipetakan dilewati dan disebut di hasil penarikan.

## Simulator Mobile JKN

`http://localhost:8075/mobile-jkn/` berperan sebagai HP peserta: memilih peserta, poli, dan tanggal (hari ini atau besok), mengambil antrean, dan membatalkan. Simulator menulis pendaftaran langsung ke PCare tiruan, tidak memanggil klira. Halamannya menampilkan pendaftaran di PCare, kapan klinik terakhir menariknya, dan antrean yang dikabarkan klinik, sehingga panggilan di klinik terlihat di "HP".

Menyiapkan klira (sekali):

1. Jalankan `npm run service-dummy` dan klira.
2. Di klira, buka Test endpoint, tab PCare. Pada Koneksi PCare, simpan lingkungan sandbox dengan kredensial dummy dan alamat `http://localhost:8075`, lalu jadikan aktif.
3. Pada Antrean online BPJS: centang aktif, nama layanan `antreanfktp`, lalu isi kode poli (`001` Umum, `002` Gigi) dan kode dokter (`123123`, `123124`, `123125`).
4. Ambil antrean di simulator. Dalam 30 detik (atau setelah menekan tombol tarik) pasien muncul di daftar pasien klira dengan lencana "Mobile JKN".
