import * as db from '@klira/db';
import { dekripsiRahasia } from '@klira/db';
import { versiGraph } from './meta.js';
import { kabarkanInstagram } from './kanal.js';
/** Name first, then username. Missing profile data must never replace an existing name with an ID. */
export function namaProfilInstagram(data) {
    const nama = typeof data.name === 'string' ? data.name.trim().replace(/\s+/g, ' ') : '';
    const username = typeof data.username === 'string' ? data.username.trim().replace(/^@/, '') : '';
    const valid = /^[A-Za-z0-9._]{1,30}$/.test(username) ? username : '';
    return (nama ? valid ? `${nama} (@${valid})` : nama : valid ? `@${valid}` : '').slice(0, 200) || null;
}
export function fotoProfilInstagram(value) {
    if (typeof value !== 'string' || value.length > 8000)
        return null;
    try {
        const url = new URL(value);
        return url.protocol === 'https:' && !url.username && !url.password && (!url.port || url.port === '443') && /(^|\.)(cdninstagram\.com|fbcdn\.net)$/.test(url.hostname) ? url.href : null;
    }
    catch {
        return null;
    }
}
export async function ambilProfilInstagram(token, id) {
    if (!/^\d{3,32}$/.test(id))
        return null;
    try {
        const res = await fetch(`https://graph.instagram.com/${versiGraph()}/${encodeURIComponent(id)}?fields=name,username,profile_pic`, {
            headers: { Authorization: `Bearer ${token}` }, redirect: 'error', signal: AbortSignal.timeout(8000),
        });
        if (!res.ok)
            return null;
        const data = await res.json();
        if (!data || typeof data !== 'object' || data.error)
            return null;
        return { nama: namaProfilInstagram(data), foto: fotoProfilInstagram(data.profile_pic) };
    }
    catch {
        return null;
    }
}
export async function ambilNamaInstagram(token, id) {
    return (await ambilProfilInstagram(token, id))?.nama ?? null;
}
const jeda = new Map();
const berjalan = new Map();
/** Best effort: delivery/storage of a DM never waits for the customer's profile API. */
export function perbaruiNamaKontakInstagram(id) {
    const pending = berjalan.get(id);
    if (pending)
        return pending;
    if ((jeda.get(id) ?? 0) > Date.now())
        return Promise.resolve(false);
    const promise = perbarui(id).catch(() => false).finally(() => berjalan.delete(id));
    berjalan.set(id, promise);
    return promise;
}
async function perbarui(id) {
    jeda.set(id, Date.now() + 15 * 60000);
    if (jeda.size > 1000)
        jeda.delete(jeda.keys().next().value);
    const kontak = await db.ambilIgPercakapanUntukPerbarui(id);
    if (!kontak || (kontak.profil_diperbarui_pada && kontak.profil_diperbarui_pada.getTime() > Date.now() - 24 * 60 * 60000))
        return false;
    const koneksi = await db.ambilIgKoneksi(1);
    if (!koneksi?.aktif || koneksi.penyedia !== 'meta' || koneksi.fasyankes_id !== kontak.fasyankes_id || !koneksi.access_token || !koneksi.token_berakhir || koneksi.token_berakhir.getTime() <= Date.now())
        return false;
    const profil = await ambilProfilInstagram(dekripsiRahasia(koneksi.access_token), kontak.jid);
    if (!profil)
        return false;
    const changed = await db.transaksi(async (tx) => {
        await db.kunciIgKoneksi(tx);
        const current = await db.ambilIgKoneksi(1, tx);
        // A slow profile lookup cannot restore deleted contacts or update a disconnected account.
        if (!current?.aktif || current.akun_id !== koneksi.akun_id || current.generasi !== koneksi.generasi)
            return false;
        const result = await db.ubahIgPercakapanUntukPerbarui((profil.nama && kontak.nama === kontak.jid) ? (profil.nama) : (undefined), profil.foto, new Date(), id, kontak.fasyankes_id, kontak.jid, kontak.nama, tx);
        return result.count > 0;
    });
    if (changed)
        kabarkanInstagram({ tipe: 'percakapan', fasyankes_id: kontak.fasyankes_id });
    return changed;
}
