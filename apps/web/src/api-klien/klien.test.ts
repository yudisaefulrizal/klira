import { GalatApi, panggilApi } from './klien';

const balas = (status: number, badan: unknown) =>
  (async () => new Response(JSON.stringify(badan), { status })) as unknown as typeof fetch;

describe('panggilApi', () => {
  it('mengembalikan data', async () => {
    expect(await panggilApi('GET', '/saya', undefined, balas(200, { data: { a: 1 } }))).toEqual({ a: 1 });
  });
  it('memetakan galat ke GalatApi dengan pesan server', async () => {
    await expect(panggilApi('POST', '/masuk', {}, balas(401, { galat: { kode: 'x', pesan: 'Salah' } }))).rejects.toMatchObject({
      status: 401, message: 'Salah',
    });
  });
  it('galat jaringan', async () => {
    const gagal = (async () => { throw new Error('x'); }) as unknown as typeof fetch;
    await expect(panggilApi('GET', '/saya', undefined, gagal)).rejects.toBeInstanceOf(GalatApi);
  });
});
