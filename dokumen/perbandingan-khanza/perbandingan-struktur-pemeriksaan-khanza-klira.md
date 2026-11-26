# Perbandingan Struktur Pemeriksaan: SIMRS Khanza vs Klira (Versi 1 Tabel)

Tabel berikut membandingkan kolom pemeriksaan & CPPT pada **SIMRS Khanza** (dengan penanda kolom yang berada di tabel terpisah) dan rancangan **1 tabel `pemeriksaan`** pada **Klira**.

| No | Kolom di SIMRS Khanza | Kolom di Klira (1 Tabel `pemeriksaan`) |
| :--- | :--- | :--- |
| 1 | *(tidak ada)* | `id` |
| 2 | *(tidak ada)* | `fasyankes_id` |
| 3 | `no_rawat` | `kunjungan_id` |
| 4 | `status` (`Ralan`/`Ranap`) | `jenis` (`ralan`/`cppt`) |
| 5 | *(tidak ada)* | `versi` |
| 6 | `tgl_perawatan` | `dibuat_pada` *(tanggal & jam)* |
| 7 | `jam_rawat` | *(tergabung di `dibuat_pada`)* |
| 8 | `suhu_tubuh` | `suhu` |
| 9 | `tensi` | `tensi_sistol` |
| 10 | *(tergabung di `tensi`)* | `tensi_diastol` |
| 11 | `nadi` | `nadi` |
| 12 | `respirasi` | `respirasi` |
| 13 | `tinggi` | `tinggi` |
| 14 | `berat` | `berat` |
| 15 | `spo2` | `spo2` |
| 16 | `gcs` | `gcs` |
| 17 | `kesadaran` | `kesadaran` |
| 18 | `lingkar_perut` | `lingkar_perut` |
| 19 | `alergi` | `alergi` |
| 20 | `keluhan` | `subjek` |
| 21 | `pemeriksaan` | `objek` |
| 22 | `penilaian` | `asesmen` |
| 23 | `rtl` | `plan` |
| 24 | `instruksi` | `instruksi` |
| 25 | `evaluasi` | `evaluasi` |
| 26 | `keluhan_utama` **[beda tabel: `penilaian_medis_*` / `penilaian_awal_keperawatan_*`]** | `keluhan_utama` |
| 27 | *(tidak ada)* | `penyerta` |
| 28 | `rps` **[beda tabel: `penilaian_medis_*`]** | `riwayat_sekarang` |
| 29 | `rpd` **[beda tabel: `penilaian_medis_*` / `penilaian_awal_keperawatan_*`]** | `riwayat_pribadi` |
| 30 | `rpk` **[beda tabel: `penilaian_medis_*` / `penilaian_awal_keperawatan_*`]** | `riwayat_keluarga` |
| 31 | `status_psiko`, `ekonomi`, `budaya`, `tinggal_dengan`, `hub_keluarga` **[beda tabel: `penilaian_awal_keperawatan_*`]** | `kajian_sosial` |
| 32 | *(tidak ada)* | `telah_diobati` |
| 33 | `rpo` **[beda tabel: `penilaian_medis_*` / `penilaian_awal_keperawatan_*`]** | `obat_dikonsumsi` |
| 34 | *(tersebar di `penilaian_awal_keperawatan_*`)* | `kajian_keperawatan` |
| 35 | `kode_masalah` **[beda tabel: `penilaian_awal_keperawatan_*_masalah`]** | `diagnosa_keperawatan` |
| 36 | `rencana` / `kode_rencana` **[beda tabel: `penilaian_awal_keperawatan_*` / `*_rencana`]** | `rencana_asuhan` |
| 37 | `nyeri`, `provokes`, `quality` **[beda tabel: `penilaian_awal_keperawatan_*`]** | `nyeri_jenis` |
| 38 | `skala_nyeri` **[beda tabel: `penilaian_awal_keperawatan_*`]** | `nyeri_skala` |
| 39 | `lokasi` **[beda tabel: `penilaian_awal_keperawatan_*`]** | `nyeri_lokasi` |
| 40 | `durasi` **[beda tabel: `penilaian_awal_keperawatan_*`]** | `nyeri_durasi` |
| 41 | *(tergabung di `ket_nyeri`)* **[beda tabel: `penilaian_awal_keperawatan_*`]** | `nyeri_frekuensi` |
| 42 | `nyeri_hilang`, `ket_nyeri` **[beda tabel: `penilaian_awal_keperawatan_*`]** | `nyeri_hilang_bila` |
| 43 | `sg1`, `nilai1` **[beda tabel: `penilaian_awal_keperawatan_*`]** | `gizi_bb_turun` |
| 44 | `sg2`, `nilai2` **[beda tabel: `penilaian_awal_keperawatan_*`]** | `gizi_asupan_kurang` |
| 45 | `nip` | `dibuat_oleh` |

## Ekstensi Terstruktur per Layanan (`kategori_poli`)

Selain 1 tabel inti `pemeriksaan`, Klira menyimpan data khusus unit dalam 3 tabel ekstensi JSON agar tidak menduplikasi TTV/SOAP dan tetap siap untuk integrasi SATUSEHAT:

- **Poli Gigi** (`odontogram_pasien`): status kumulatif gigi FDI (`11–48`, `51–85`), kode kondisi standar Kemenkes, dan pemeriksaan intraoral.
- **Poli KIA** (`kia_kunjungan`): catatan terstruktur `anc`, `kb`, dan `anak` (termasuk `vaksin_kfa` & `batch_vaksin` untuk `Immunization`).
- **UGD** (`ugd_kunjungan`): triase warna (`merah`/`kuning`/`hijau`/`hitam`), `waktu_triase`, cara datang, jenis kasus, ABCDE, dan temuan trauma kondisional.
