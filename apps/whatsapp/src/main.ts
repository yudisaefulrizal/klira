import { buatPembaruanFotoWhatsapp } from './profil.js';
import { jidWhatsappPribadi } from '@klira/shared';
import { buatPemberitahuEngine } from './pembaruan.js';
import { randomUUID } from 'node:crypto';
import {
  prisma,
  enkripsiRahasia,
  dekripsiRahasia,
  kunciPercakapanWhatsapp,
  pangkasPesanWhatsapp,
  rapikanRiwayatWhatsapp,
} from '@klira/db';
import makeWASocket, {
  BufferJSON,
  initAuthCreds,
  proto,
  downloadMediaMessage,
  normalizeMessageContent,
  DisconnectReason,
  generateMessageIDV2,
  type AuthenticationState,
  type SignalDataTypeMap,
  type WAMessage,
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';

const muat = (isi: string) => JSON.parse(dekripsiRahasia(isi), BufferJSON.reviver);
const kemas = (isi: unknown) => enkripsiRahasia(JSON.stringify(isi, BufferJSON.replacer));
const logger = {
  level: 'silent',
  child() {
    return logger;
  },
  trace() {},
  debug() {},
  info() {},
  warn() {},
  error() {},
};
// libsignal dapat menulis objek kunci langsung ke console, di luar logger Baileys.
console.info = () => {};
console.warn = () => {};
console.error = () => console.log('WhatsApp: terjadi galat internal; rincian sensitif disembunyikan.');
const pemberitahu = buatPemberitahuEngine();
const perbaruiFoto = buatPembaruanFotoWhatsapp();
const kabarkan = (fasyankes_id: number, tipe: 'pesan' | 'koneksi', baru = false) =>
  pemberitahu.kabarkan({ tipe, fasyankes_id, baru });
const pemilik = randomUUID();
let retensiSiap = false;
let socket: ReturnType<typeof makeWASocket> | undefined;
let generasi = -1;
let berhenti = false;
let sibuk = false;
let ulangPada = 0;
let pulih = false;
let antrean = Promise.resolve();
const catat = (pekerjaan: () => Promise<void>) => {
  antrean = antrean.then(pekerjaan).catch(() => console.error('WhatsApp: penyimpanan event gagal'));
};
async function tutup() {
  const lama = socket;
  socket = undefined;
  lama?.ev.removeAllListeners('connection.update');
  lama?.ev.removeAllListeners('messages.upsert');
  lama?.ev.removeAllListeners('messages.update');
  lama?.ev.removeAllListeners('creds.update');
  lama?.end(undefined);
}
async function autentikasi(): Promise<{ state: AuthenticationState; save: () => Promise<void> }> {
  const baca = async (id: string) => {
    const row = await prisma.waAuth.findUnique({ where: { id } });
    return row ? muat(row.isi) : null;
  };
  const simpan = async (id: string, nilai: unknown) => {
    if (nilai == null) await prisma.waAuth.deleteMany({ where: { id } });
    else
      await prisma.waAuth.upsert({ where: { id }, create: { id, isi: kemas(nilai) }, update: { isi: kemas(nilai) } });
  };
  const creds = (await baca('creds')) ?? initAuthCreds();
  return {
    state: {
      creds,
      keys: {
        async get<T extends keyof SignalDataTypeMap>(type: T, ids: string[]) {
          const hasil: { [id: string]: SignalDataTypeMap[T] } = {};
          for (const id of ids) {
            let nilai = await baca(`${type}-${id}`);
            if (type === 'app-state-sync-key' && nilai) nilai = proto.Message.AppStateSyncKeyData.fromObject(nilai);
            if (nilai) hasil[id] = nilai;
          }
          return hasil;
        },
        async set(data) {
          for (const [type, values] of Object.entries(data))
            for (const [id, nilai] of Object.entries(values ?? {})) await simpan(`${type}-${id}`, nilai);
        },
      },
    },
    save: () => simpan('creds', creds),
  };
}
async function terima(fasyankes: number, message: WAMessage, wa: ReturnType<typeof makeWASocket>) {
  const jid = message.key.remoteJidAlt?.endsWith('@s.whatsapp.net') ? message.key.remoteJidAlt : message.key.remoteJid;
  if (!jidWhatsappPribadi(message.key.remoteJid) || !jidWhatsappPribadi(jid) || !message.key.id) return;
  const isi = normalizeMessageContent(message.message);
  if (!isi || isi.protocolMessage || isi.senderKeyDistributionMessage) return;
  const waId = message.key.id;
  if (await prisma.waPesan.findUnique({ where: { wa_id: waId } })) return;
  let teks = isi.conversation ?? isi.extendedTextMessage?.text ?? '';
  let jenis = 'text';
  let mediaId: string | null = null;
  for (const [tipe, media] of [
    ['image', isi.imageMessage],
    ['document', isi.documentMessage],
    ['audio', isi.audioMessage],
    ['video', isi.videoMessage],
  ] as const) {
    if (!media) continue;
    jenis = tipe;
    teks = 'caption' in media ? (media.caption ?? '') : '';
    try {
      if (Number(media.fileLength ?? 0) > 8 * 1024 * 1024) throw new Error('ukuran');
      const stream = await downloadMediaMessage(
        message,
        'stream',
        {},
        { logger, reuploadRequest: wa.updateMediaMessage },
      );
      const potongan: Buffer[] = [];
      let ukuran = 0;
      for await (const potong of stream) {
        ukuran += potong.length;
        if (ukuran > 8 * 1024 * 1024) {
          stream.destroy();
          throw new Error('ukuran');
        }
        potongan.push(potong);
      }
      mediaId = randomUUID();
      await prisma.waMedia.create({
        data: {
          id: mediaId,
          fasyankes_id: fasyankes,
          isi: enkripsiRahasia(Buffer.concat(potongan).toString('base64')),
          mime: media.mimetype ?? 'application/octet-stream',
          nama: ('fileName' in media && media.fileName ? media.fileName : `lampiran-${tipe}`).slice(0, 200),
        },
      });
    } catch {
      teks = `${teks}\n[Lampiran tidak tersedia atau melebihi 8 MB]`.trim();
    }
    break;
  }
  if (!teks && !mediaId) teks = '[Jenis pesan ini belum didukung]';
  await prisma.$transaction(async (tx) => {
    const percakapan = await tx.waPercakapan.upsert({
      where: { fasyankes_id_jid: { fasyankes_id: fasyankes, jid } },
      create: {
        fasyankes_id: fasyankes,
        jid,
        nama: (message.key.fromMe ? jid.split('@')[0] : message.pushName || jid.split('@')[0]).slice(0, 200),
      },
      update: {},
    });
    await kunciPercakapanWhatsapp(tx, percakapan.id);
    await tx.waPesan.create({
      data: {
        percakapan_id: percakapan.id,
        wa_id: waId,
        arah: message.key.fromMe ? 'keluar' : 'masuk',
        isi: enkripsiRahasia(teks),
        jenis,
        media_id: mediaId,
        status: message.key.fromMe ? 'terkirim' : 'diterima',
      },
    });
    await tx.waPercakapan.update({
      where: { id: percakapan.id },
      data: {
        diperbarui_pada: new Date(),
      },
    });
    await pangkasPesanWhatsapp(tx, percakapan.id);
  });
  kabarkan(fasyankes, 'pesan', !message.key.fromMe);
}
async function hubungkan(fasyankes: number) {
  await prisma.waKoneksi.update({ where: { id: 1 }, data: { status: 'menghubungkan', qr: null } });
  const auth = await autentikasi();
  const wa = makeWASocket({
    auth: auth.state,
    logger,
    markOnlineOnConnect: false,
    syncFullHistory: false,
    connectTimeoutMs: 20000,
    defaultQueryTimeoutMs: 30000,
  });
  socket = wa;
  wa.ev.on('creds.update', () => catat(auth.save));
  wa.ev.on('connection.update', (event) =>
    catat(async () => {
      if (socket !== wa || berhenti) return;
      if (event.qr)
        await prisma.waKoneksi.update({
          where: { id: 1 },
          data: { status: 'qr', qr: enkripsiRahasia(await QRCode.toDataURL(event.qr)) },
        });
      if (event.connection === 'open')
        await prisma.waKoneksi.update({
          where: { id: 1 },
          data: { status: 'terhubung', qr: null, nomor: wa.user?.id.split(':')[0].split('@')[0] },
        });
      if (event.connection === 'close') {
        socket = undefined;
        const kode = (event.lastDisconnect?.error as { output?: { statusCode?: number } })?.output?.statusCode;
        const logout = kode === DisconnectReason.loggedOut;
        ulangPada = Date.now() + 5000;
        await prisma.waKoneksi.update({
          where: { id: 1 },
          data: {
            status: logout ? 'terputus' : 'menghubungkan',
            qr: null,
            ...(logout ? { aktif: false, nomor: null } : {}),
          },
        });
        if (logout) await prisma.waAuth.deleteMany();
      }
      kabarkan(fasyankes, 'koneksi');
    }),
  );
  wa.ev.on('messages.upsert', (event) => {
    if (event.type === 'notify') for (const pesan of event.messages) catat(() => terima(fasyankes, pesan, wa));
  });
  wa.ev.on('messages.update', (events) =>
    catat(async () => {
      for (const { key, update } of events) {
        if (!key.id || !jidWhatsappPribadi(key.remoteJid) || !update.status) continue;
        const status = update.status >= 4 ? 'dibaca' : update.status >= 3 ? 'diterima' : undefined;
        if (status)
          await prisma.waPesan.updateMany({
            where: {
              wa_id: key.id,
              AND: [
                { status: { notIn: ['antre', 'mengirim'] } },
                ...(status === 'diterima' ? [{ status: { not: 'dibaca' } }] : []),
              ],
            },
            data: { status },
          });
      }
      kabarkan(fasyankes, 'pesan');
    }),
  );
}
async function kirim(fasyankes: number) {
  const wa = socket;
  if (!wa?.user) return;
  const pesan = await prisma.waPesan.findFirst({
    where: { arah: 'keluar', status: 'antre', percakapan: { fasyankes_id: fasyankes } },
    orderBy: { id: 'asc' },
    include: { percakapan: true },
  });
  if (!pesan) return;
  if (!jidWhatsappPribadi(pesan.percakapan.jid)) {
    await prisma.waPesan.update({ where: { id: pesan.id }, data: { status: 'dibatalkan' } });
    return;
  }
  const waId = generateMessageIDV2(wa.user.id);
  const klaim = await prisma.waPesan.updateMany({
    where: { id: pesan.id, status: 'antre' },
    data: { status: 'mengirim', wa_id: waId },
  });
  if (!klaim.count) return;
  try {
    const teks = dekripsiRahasia(pesan.isi);
    let content: Parameters<typeof wa.sendMessage>[1] = { text: teks };
    if (pesan.media_id) {
      const media = await prisma.waMedia.findUniqueOrThrow({ where: { id: pesan.media_id } });
      const buffer = Buffer.from(dekripsiRahasia(media.isi), 'base64');
      content =
        pesan.jenis === 'image'
          ? { image: buffer, caption: teks }
          : pesan.jenis === 'audio'
            ? { audio: buffer, mimetype: media.mime }
            : pesan.jenis === 'video'
              ? { video: buffer, caption: teks }
              : { document: buffer, mimetype: media.mime, fileName: media.nama, caption: teks };
    }
    const hasil = await wa.sendMessage(pesan.percakapan.jid, content, { messageId: waId });
    if (!hasil?.key.id) throw new Error('ID kosong');
    await prisma.$transaction(async (tx) => {
      await kunciPercakapanWhatsapp(tx, pesan.percakapan_id);
      await tx.waPesan.updateMany({ where: { id: pesan.id }, data: { status: 'terkirim' } });
      await pangkasPesanWhatsapp(tx, pesan.percakapan_id);
    });
  } catch {
    await prisma.$transaction(async (tx) => {
      await kunciPercakapanWhatsapp(tx, pesan.percakapan_id);
      await tx.waPesan.updateMany({ where: { id: pesan.id }, data: { status: 'gagal' } });
      await pangkasPesanWhatsapp(tx, pesan.percakapan_id);
    });
  }
  kabarkan(fasyankes, 'pesan');
}
async function detak() {
  if (berhenti) return;
  const now = new Date();
  const klaim = await prisma.waKoneksi.updateMany({
    where: { id: 1, OR: [{ pemilik_engine: pemilik }, { sewa_sampai: null }, { sewa_sampai: { lt: now } }] },
    data: { pemilik_engine: pemilik, sewa_sampai: new Date(Date.now() + 60000), detak: now },
  });
  if (!klaim.count) {
    pulih = false;
    await tutup();
    return;
  }
  if (!pulih) {
    await prisma.waPesan.updateMany({ where: { status: 'mengirim' }, data: { status: 'gagal' } });
    pulih = true;
  }
  if (sibuk) return;
  sibuk = true;
  try {
    if (!retensiSiap) {
      await rapikanRiwayatWhatsapp();
      retensiSiap = true;
    }
    const koneksi = await prisma.waKoneksi.findUniqueOrThrow({ where: { id: 1 } });
    if (!koneksi.aktif || koneksi.generasi !== generasi) {
      if (!koneksi.aktif && socket?.user) {
        try {
          await socket.logout();
        } catch {
          console.error('WhatsApp: logout jarak jauh belum terkonfirmasi');
        }
      }
      await tutup();
      await antrean;
      generasi = koneksi.generasi;
      if (!koneksi.aktif) {
        await prisma.waAuth.deleteMany();
        await prisma.waKoneksi.update({ where: { id: 1 }, data: { status: 'terputus', qr: null, nomor: null } });
        return;
      }
    }
    if (!socket && Date.now() >= ulangPada) {
      ulangPada = Date.now() + 10000;
      await hubungkan(koneksi.fasyankes_id);
    }
    const terbaru = await prisma.waKoneksi.findUniqueOrThrow({ where: { id: 1 } });
    if (terbaru.aktif && terbaru.generasi === generasi && terbaru.status === 'terhubung') {
      await kirim(koneksi.fasyankes_id);
      const wa = socket;
      const generasiFoto = generasi;
      if (wa?.user) void perbaruiFoto({
        fasyankes: koneksi.fasyankes_id, generasi: generasiFoto, pemilik,
        masihAktif: () => socket === wa && generasi === generasiFoto && !berhenti,
        ambil: (jid) => wa.profilePictureUrl(jid, 'image', 8000),
        kabarkan: () => kabarkan(koneksi.fasyankes_id, 'pesan'),
      });
    }
  } finally {
    sibuk = false;
  }
}
const timer = setInterval(() => {
  void detak().catch(() => {
    void tutup();
    console.error('WhatsApp: engine belum siap; periksa database dan migrasi');
  });
}, 1500);
console.log('Engine WhatsApp Klira berjalan (satu nomor).');
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => {
    void (async () => {
      berhenti = true;
      clearInterval(timer);
      pemberitahu.tutup();
      await tutup();
      await antrean;
      await prisma.waKoneksi.updateMany({
        where: { pemilik_engine: pemilik },
        data: { pemilik_engine: null, sewa_sampai: null, detak: null, qr: null, status: 'terputus' },
      });
      await prisma.$disconnect();
    })().finally(() => process.exit());
  });
