import { createServer } from 'node:http';
import WebSocket from 'ws';
import { kabarkanNotifikasi } from '../domain/kanal.js';
import { pasangWebsocketNotifikasi } from './websocket.js';

let server, url;
const sockets = [];
let sesiAktif = new Map();

const akses = {
    saya: async (sesi) => sesiAktif.get(sesi) ?? null,
};

beforeEach(async () => {
    sesiAktif = new Map([
        ['dokter1', { id: 10, wajib_ganti_kredensial: false, izin: [{ fitur: 'klinis', aksi: 'lihat' }, { fitur: 'klinis', aksi: 'input' }, { fitur: 'klinis', aksi: 'sahkan' }, { fitur: 'penunjang', aksi: 'lihat' }] }],
        ['dokter2', { id: 11, wajib_ganti_kredensial: false, izin: [{ fitur: 'klinis', aksi: 'lihat' }, { fitur: 'klinis', aksi: 'input' }, { fitur: 'klinis', aksi: 'sahkan' }, { fitur: 'penunjang', aksi: 'lihat' }] }],
        ['lab1', { id: 20, wajib_ganti_kredensial: false, izin: [{ fitur: 'penunjang', aksi: 'lihat' }, { fitur: 'penunjang', aksi: 'input' }, { fitur: 'penunjang', aksi: 'sahkan' }] }],
        ['kasir1', { id: 25, wajib_ganti_kredensial: false, izin: [{ fitur: 'kasir', aksi: 'lihat' }, { fitur: 'kasir', aksi: 'input' }] }],
        ['perawat1', { id: 30, wajib_ganti_kredensial: false, izin: [{ fitur: 'klinis', aksi: 'lihat' }, { fitur: 'klinis', aksi: 'input' }] }],
        ['dokter_lain', { id: 40, wajib_ganti_kredensial: false, izin: [{ fitur: 'klinis', aksi: 'lihat' }, { fitur: 'klinis', aksi: 'sahkan' }] }],
        ['ganti', { id: 50, wajib_ganti_kredensial: true, izin: [{ fitur: 'penunjang', aksi: 'input' }] }],
    ]);
    server = createServer((_req, res) => res.end());
    pasangWebsocketNotifikasi(server, akses, 'http://klira.test', 100);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
    url = `ws://127.0.0.1:${server.address().port}/api/notifikasi/ws`;
});

afterEach(async () => {
    for (const ws of sockets.splice(0))
        ws.terminate();
    await new Promise((resolve) => server.close(() => resolve()));
});

async function buka(sesi) {
    const ws = new WebSocket(url, { origin: 'http://klira.test', headers: { cookie: `klira_sesi=${sesi}` } });
    sockets.push(ws);
    const antrean = [];
    ws.on('message', (data) => antrean.push(JSON.parse(String(data))));
    await new Promise((resolve, reject) => {
        ws.once('message', () => resolve());
        ws.once('error', reject);
    });
    // Buang pesan 'siap' awal.
    antrean.shift();
    return {
        ws,
        pesan: () => antrean.filter((m) => m.tipe !== 'hidup'),
    };
}

function ditolak(origin = 'http://klira.test', sesi) {
    const ws = new WebSocket(url, { origin, headers: sesi ? { cookie: `klira_sesi=${sesi}` } : {} });
    sockets.push(ws);
    ws.on('error', () => { });
    return new Promise((resolve) => ws.on('unexpected-response', (_req, res) => {
        res.resume();
        ws.terminate();
        resolve(res.statusCode);
    }));
}

const tunggu = (ms = 30) => new Promise((r) => setTimeout(r, ms));

test('menolak tanpa sesi, sesi wajib ganti kredensial, dan origin asing', async () => {
    expect(await ditolak('http://klira.test')).toBe(401);
    expect(await ditolak('http://klira.test', 'tidak-ada')).toBe(401);
    expect(await ditolak('http://klira.test', 'ganti')).toBe(401);
    expect(await ditolak('http://asing.test', 'dokter1')).toBe(403);
});

test('skrining_selesai dengan dpjpId hanya dikirim ke dokter yang bersangkutan di fasilitas yang sama', async () => {
    const d1 = await buka('dokter1');
    const d2 = await buka('dokter2');
    const lab = await buka('lab1');
    const lain = await buka('dokter_lain');

    kabarkanNotifikasi({
        tipe: 'skrining_selesai',
        pelakuId: 30,
        dpjpId: 10,
        kunjunganId: 99,
        nomorAntrean: 'A-005',
    });

    await tunggu();
    expect(d1.pesan()).toEqual([{ tipe: 'skrining_selesai', kunjungan_id: 99, nomor_antrean: 'A-005' }]);
    expect(d2.pesan()).toEqual([]);
    expect(lab.pesan()).toEqual([]);
    expect(lain.pesan()).toEqual([]);
});

test('skrining_selesai tanpa dpjpId dikirim ke pengguna berizin klinis:sahkan dan tidak ke pelaku', async () => {
    const d1 = await buka('dokter1');
    const d2 = await buka('dokter2');
    const perawat = await buka('perawat1');

    kabarkanNotifikasi({
        tipe: 'skrining_selesai',
        pelakuId: 10, // mis. dokter1 sendiri yang memicu
        dpjpId: null,
        kunjunganId: 100,
        nomorAntrean: 'A-006',
    });

    await tunggu();
    expect(d1.pesan()).toEqual([]);
    expect(d2.pesan()).toEqual([{ tipe: 'skrining_selesai', kunjungan_id: 100, nomor_antrean: 'A-006' }]);
    expect(perawat.pesan()).toEqual([]);
});

test('order_lab_baru hanya dikirim ke petugas lab berizin penunjang:input, bukan dokter yang hanya lihat', async () => {
    const d1 = await buka('dokter1');
    const lab = await buka('lab1');
    const perawat = await buka('perawat1');

    kabarkanNotifikasi({
        tipe: 'order_lab_baru',
        pelakuId: 10,
        kunjunganId: 101,
        jumlah: 2,
        prioritas: 'segera',
    });

    await tunggu();
    expect(lab.pesan()).toEqual([{ tipe: 'order_lab_baru', kunjungan_id: 101, jumlah: 2, prioritas: 'segera' }]);
    expect(d1.pesan()).toEqual([]);
    expect(perawat.pesan()).toEqual([]);
});

test('hasil_lab_selesai dikirim ke DPJP dan hasil_lab_kasir dikirim ke petugas kasir', async () => {
    const d1 = await buka('dokter1');
    const d2 = await buka('dokter2');
    const kasir = await buka('kasir1');

    kabarkanNotifikasi({ tipe: 'hasil_lab_selesai', pelakuId: 20, dpjpId: 10, kunjunganId: 102 });
    kabarkanNotifikasi({ tipe: 'hasil_lab_kasir', pelakuId: 20, kunjunganId: 103 });

    await tunggu();
    expect(d1.pesan()).toEqual([{ tipe: 'hasil_lab_selesai', kunjungan_id: 102 }]);
    expect(d2.pesan()).toEqual([]);
    expect(kasir.pesan()).toEqual([{ tipe: 'hasil_lab_kasir', kunjungan_id: 103 }]);
});

test('menolak pesan dari klien dan menutup koneksi saat sesi berakhir', async () => {
    const d1 = await buka('dokter1');
    const kodePesan = new Promise((resolve) => d1.ws.once('close', resolve));
    d1.ws.send('halo');
    expect(await kodePesan).toBe(1008);

    const d2 = await buka('dokter2');
    const kodeSesi = new Promise((resolve) => d2.ws.once('close', resolve));
    sesiAktif.delete('dokter2');
    expect(await kodeSesi).toBe(1008);
});
