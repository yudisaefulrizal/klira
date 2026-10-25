import { eksporAudit } from './audit';

describe('eksporAudit', () => {
  it('mengembalikan isi CSV dan mengirim filter via POST', async () => {
    let dipanggil: { url: string; init?: RequestInit } | null = null;
    const ambil = (async (url: string, init?: RequestInit) => {
      dipanggil = { url, init };
      return new Response('id\r\n1\r\n', { status: 200 });
    }) as unknown as typeof fetch;
    expect(await eksporAudit({ aksi: 'lihat' }, ambil)).toBe('id\r\n1\r\n');
    expect(dipanggil).toMatchObject({ url: '/api/audit/ekspor', init: { method: 'POST', body: '{"aksi":"lihat"}' } });
  });
  it('403 menjadi GalatApi', async () => {
    const ambil = (async () => new Response(JSON.stringify({ galat: { kode: 'tidak_berizin', pesan: 'Tidak boleh' } }), { status: 403 })) as unknown as typeof fetch;
    await expect(eksporAudit({}, ambil)).rejects.toMatchObject({ status: 403, message: 'Tidak boleh' });
  });
});
