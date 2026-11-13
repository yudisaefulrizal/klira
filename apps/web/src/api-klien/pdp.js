import { panggilApi } from './klien.js';
const kueri = (o) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(o))
        if (v !== undefined && v !== '')
            q.set(k, String(v));
    return q.toString();
};
const hal = (h, u = 20) => kueri({ halaman: h, ukuran: u });
export const daftarHak = (f) => panggilApi('GET', `/pdp/hak?${kueri({ halaman: f.halaman ?? 1, ukuran: 20, status: f.status, cari: f.cari?.trim() })}`);
export const catatHak = (m) => panggilApi('POST', '/pdp/hak', m);
export const prosesHak = (id, m) => panggilApi('POST', `/pdp/hak/${id}/proses`, m);
export const daftarPemberitahuan = () => panggilApi('GET', '/pdp/pemberitahuan');
export const buatPemberitahuan = (m) => panggilApi('POST', '/pdp/pemberitahuan', m);
export const daftarPersetujuanPdp = (f) => panggilApi('GET', `/pdp/persetujuan?${kueri({ halaman: f.halaman ?? 1, ukuran: 20, status: f.status, cari: f.cari?.trim() })}`);
export const tarikPersetujuan = (m) => panggilApi('POST', '/pdp/persetujuan/tarik', m);
export const daftarRopa = (halaman) => panggilApi('GET', `/pdp/ropa?${hal(halaman)}`);
export const simpanRopa = (id, m) => panggilApi(id ? 'PUT' : 'POST', id ? `/pdp/ropa/${id}` : '/pdp/ropa', m);
export const daftarDpia = (halaman) => panggilApi('GET', `/pdp/dpia?${hal(halaman)}`);
export const simpanDpia = (id, m) => panggilApi(id ? 'PUT' : 'POST', id ? `/pdp/dpia/${id}` : '/pdp/dpia', m);
export const daftarInsiden = (halaman) => panggilApi('GET', `/pdp/insiden?${hal(halaman)}`);
export const simpanInsiden = (id, m) => panggilApi(id ? 'PUT' : 'POST', id ? `/pdp/insiden/${id}` : '/pdp/insiden', m);
export const ambilKebijakan = () => panggilApi('GET', '/pdp/retensi');
export const daftarPemusnahan = (halaman) => panggilApi('GET', `/pdp/pemusnahan?${hal(halaman)}`);
export const rencanaPemusnahan = (m) => panggilApi('POST', '/pdp/pemusnahan', m);
export const prosesPemusnahan = (id, m) => panggilApi('POST', `/pdp/pemusnahan/${id}/proses`, m);
export const daftarProsesor = (halaman) => panggilApi('GET', `/pdp/prosesor?${hal(halaman)}`);
export const opsiProsesor = () => panggilApi('GET', '/pdp/prosesor/opsi');
export const simpanProsesor = (id, m) => panggilApi(id ? 'PUT' : 'POST', id ? `/pdp/prosesor/${id}` : '/pdp/prosesor', m);
