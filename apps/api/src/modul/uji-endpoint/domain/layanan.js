import { UJI_ENDPOINT as U, bangunPermintaan, butuhBadan, cariEndpoint, katalogUntuk } from '@klira/shared';
import { gagal } from '../../../umum/hasil.js';

const BATAS_RESPONS = 500_000;
const BATAS_WAKTU_MS = 15000;

/** Batasi ukuran respons yang dikirim ke layar. */
function potong(nilai) {
    const teks = JSON.stringify(nilai ?? null);
    return teks.length > BATAS_RESPONS ? { _dipotong: U.dipotong, awal: teks.slice(0, 2000) } : nilai;
}

/**
 * Alat uji endpoint: mengirim permintaan dari katalog melalui klien lingkungan aktif. Hanya sandbox/server tiruan.
 * Tiap pengiriman dicatat di audit (id endpoint dan lingkungan, tanpa isian atau badan agar data pasien tidak masuk log)
 * sebelum permintaan dikirim; bila audit gagal, permintaan tidak dikirim.
 */
export function buatLayananUjiEndpoint({ layananSatusehat, layananPcare, audit, tick = () => Date.now() }) {
    const klienDari = (layanan, f) => (layanan === 'satusehat' ? layananSatusehat : layananPcare).klienAktif(f, { batasWaktuMs: BATAS_WAKTU_MS });
    return {
        /** Katalog layanan, konteks klinik untuk contoh isian, dan status koneksi aktif. */
        async katalog(p, layanan) {
            const [ss, pc] = await Promise.all([layananSatusehat.ambil(p), layananPcare.ambil(p)]);
            const aktif = layanan === 'satusehat' ? ss.aktif : pc.aktif;
            return {
                katalog: katalogUntuk(layanan),
                konteks: { organization_id: ss.organization_id ?? '' },
                koneksi: { aktif, boleh_uji: aktif === 'sandbox', pesan: aktif === null ? U.galat.belumAktif : aktif === 'sandbox' ? null : U.galat.hanyaSandbox(aktif) },
            };
        },
        async kirim(p, m, alamat) {
            const endpoint = cariEndpoint(m.layanan, m.endpoint_id);
            if (!endpoint)
                return gagal('tidak_ditemukan', U.galat.endpointTidakAda, 'endpoint_id');
            const bangun = bangunPermintaan(endpoint, m.parameter);
            if (!bangun.ok) {
                const [nama, pesan] = Object.entries(bangun.galat)[0];
                return { ...gagal('tidak_valid', pesan, nama), rincian: Object.entries(bangun.galat).map(([jalur, isi]) => ({ jalur: `parameter.${jalur}`, pesan: isi })) };
            }
            let badan;
            if (butuhBadan(endpoint)) {
                if (!m.badan || m.badan.trim() === '')
                    return gagal('tidak_valid', U.galat.badanWajib, 'badan');
                try {
                    badan = JSON.parse(m.badan);
                }
                catch {
                    return gagal('tidak_valid', U.galat.badanBukanJson, 'badan');
                }
            }
            const aktif = await klienDari(m.layanan);
            if (!aktif)
                return gagal('belum_lengkap', U.galat.belumAktif);
            if (aktif.environment !== 'sandbox')
                return gagal('dilarang', U.galat.hanyaSandbox(aktif.environment));
            await audit.catat({
                pengguna_id: p.id, aksi: 'input', entitas: 'test_endpoint',
                keterangan: `${m.layanan} ${endpoint.id} ${endpoint.metode} (${aktif.environment})`, alamat,
            });
            const mulai = tick();
            const permintaan = { metode: endpoint.metode, jalur: bangun.jalur, ...(badan === undefined ? {} : { badan }), environment: aktif.environment };
            try {
                const kirim = { metode: endpoint.metode, jalur: bangun.jalur, badan, ...(m.layanan === 'satusehat' ? { dasar: endpoint.dasar } : {}) };
                const h = await aktif.klien.kirimMentah(kirim);
                const respons = m.layanan === 'satusehat'
                    ? { status: h.status, badan: potong(h.badan) }
                    : { status: h.status, terbaca: h.terbaca, gagal_dekripsi: Boolean(h.gagalDekripsi), meta_data: h.metaData, badan: potong(h.response) };
                return { ok: true, data: { permintaan: { ...permintaan, url: h.url }, respons: { ...respons, durasi_ms: tick() - mulai }, galat: null } };
            }
            catch (galat) {
                const pesan = galat?.name === 'GalatIntegrasi' ? galat.message : U.galat.takTerduga;
                return { ok: true, data: { permintaan, respons: null, galat: pesan, durasi_ms: tick() - mulai } };
            }
        },
    };
}
