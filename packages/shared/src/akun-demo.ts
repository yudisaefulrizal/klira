/** Akun fiktif untuk demo lokal, sesuai dokumen/akun-demo.pdf. */
export const AKUN_DEMO = [
  {
    "kunci": "admin",
    "nama": "Pimpinan",
    "username": "pimpinan",
    "nik": "9999999999990000",
    "jenis": "Pimpinan fasyankes"
  },
  {
    "kunci": "dokter",
    "nama": "dr. Ahmad",
    "username": "dokter",
    "nik": "3273011203850001",
    "jenis": "Dokter/DPJP",
    "profil": {
      "profesi": "Dokter Umum",
      "nomor_sip": "SIP-DU/0123/2025",
      "masa_berlaku_sip": "2030-12-31"
    }
  },
  {
    "kunci": "drg",
    "nama": "drg. Mahmud",
    "username": "dokter-gigi",
    "nik": "3273014507880002",
    "jenis": "Dokter/DPJP",
    "profil": {
      "profesi": "Dokter Gigi",
      "nomor_sip": "SIP-DG/0456/2025",
      "masa_berlaku_sip": "2030-12-31"
    }
  },
  {
    "kunci": "perawat",
    "nama": "Ns. Rina",
    "username": "perawat",
    "nik": "3273016108920003",
    "jenis": "Perawat/Bidan/Nakes lain",
    "profil": {
      "profesi": "Perawat",
      "nomor_sip": "SIPP/0789/2025",
      "masa_berlaku_sip": "2030-12-31"
    }
  },
  {
    "kunci": "bidan",
    "nama": "Bd. Dewi",
    "username": "bidan",
    "nik": "3273015203900004",
    "jenis": "Perawat/Bidan/Nakes lain",
    "profil": {
      "profesi": "Bidan",
      "nomor_sip": "SIPB/0321/2025",
      "masa_berlaku_sip": "2030-12-31"
    }
  },
  {
    "kunci": "daftar",
    "nama": "Budi",
    "username": "pendaftaran",
    "nik": "3273010506950005",
    "jenis": "Petugas pendaftaran"
  },
  {
    "kunci": "rm",
    "nama": "Sari",
    "username": "rekam-medis",
    "nik": "3273016609930006",
    "jenis": "Perekam Medis dan Informasi Kesehatan"
  },
  {
    "kunci": "kasir",
    "nama": "Agus",
    "username": "kasir",
    "nik": "3273011711910007",
    "jenis": "Petugas klaim/kasir"
  },
  {
    "kunci": "apoteker",
    "nama": "apt. Maya",
    "username": "apoteker",
    "nik": "3273014402890008",
    "jenis": "Apoteker/tenaga kefarmasian",
    "profil": {
      "profesi": "Apoteker",
      "nomor_sip": "SIPA/0654/2025",
      "masa_berlaku_sip": "2030-12-31"
    }
  },
  {
    "kunci": "lab",
    "nama": "Fajar",
    "username": "lab",
    "nik": "3273012308940009",
    "jenis": "Analis lab"
  },
  {
    "kunci": "it",
    "nama": "Hendra",
    "username": "admin-it",
    "nik": "3273010902900010",
    "jenis": "Admin IT fasyankes"
  },
  {
    "kunci": "pdp",
    "nama": "Lina",
    "username": "pdp",
    "nik": "3273015811870011",
    "jenis": "Petugas PDP (PPDP)"
  },
  {
    "kunci": "vendor",
    "nama": "Vendor",
    "username": "admin-vendor",
    "nik": "3273010101800013",
    "jenis": "Admin vendor"
  },
  {
    "kunci": "auditor",
    "nama": "Rudi",
    "username": "auditor",
    "nik": "3273012104860012",
    "jenis": "Auditor"
  }
] as const;
