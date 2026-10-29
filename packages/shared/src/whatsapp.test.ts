import { jidWhatsappPribadi, bukaPercakapanWa, kirimPesanWa, nomorWhatsapp } from './whatsapp';
describe('WhatsApp', () => {
  test.each([
    ['0812 3456 7890', '6281234567890'],
    ['+62 (812) 3456-7890', '6281234567890'],
    ['447911123456', '447911123456'],
    ['62812@s.whatsapp.net', null],
    ['abc62812', null],
    ['123', null],
    ['', null],
  ])('normalisasi %s', (input, hasil) => expect(nomorWhatsapp(input)).toBe(hasil));
  it('menolak teks kosong tanpa lampiran dan nomor berisi JID', () => {
    expect(kirimPesanWa.safeParse({ teks: '  ' }).success).toBe(false);
    expect(bukaPercakapanWa.safeParse({ nomor: '123@g.us' }).success).toBe(false);
    expect(kirimPesanWa.safeParse({ teks: 'halo' }).success).toBe(true);
  });
  it('membatasi lampiran dan panjang balasan', () => {
    expect(kirimPesanWa.safeParse({ media: { base64: 'YQ==', mime: 'text/html', nama: 'test.html' } }).success).toBe(
      false,
    );
    expect(kirimPesanWa.safeParse({ teks: 'a'.repeat(10001) }).success).toBe(false);
    expect(
      kirimPesanWa.safeParse({ media: { base64: 'YQ==', mime: 'application/pdf', nama: 'test.pdf' } }).success,
    ).toBe(true);
  });
});

describe('hanya chat pribadi WhatsApp', () => {
  test.each(['6281234567890@s.whatsapp.net', '123456789@lid'])('menerima %s', jid => expect(jidWhatsappPribadi(jid)).toBe(true));
  test.each(['123456@g.us', 'status@broadcast', '123@newsletter', '123@broadcast', 'server@c.us', '', null, undefined])('mengabaikan %s', jid => expect(jidWhatsappPribadi(jid)).toBe(false));
});
