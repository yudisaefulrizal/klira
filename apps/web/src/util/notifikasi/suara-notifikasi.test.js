import { jest } from '@jest/globals';
import { buatSuaraNotifikasi } from './suara-notifikasi.js';

function buatMockAudioContext(stateAwal = 'running', bisaResume = true) {
    const nada = [];
    class MockAudioContext {
        constructor() {
            this.state = stateAwal;
            this.currentTime = 0;
            this.destination = {};
        }
        async resume() {
            if (bisaResume)
                this.state = 'running';
        }
        createOscillator() {
            const osc = { type: 'sine', frequency: { setValueAtTime: (f) => nada.push(f) }, connect() { }, start() { }, stop() { } };
            return osc;
        }
        createGain() {
            return { gain: { setValueAtTime() { }, exponentialRampToValueAtTime() { } }, connect() { } };
        }
        async close() { }
    }
    return { MockAudioContext, nada };
}

test('memutar nada berbeda untuk skrining_selesai dan order_lab_baru segera', async () => {
    const { MockAudioContext, nada } = buatMockAudioContext('running');
    const suara = buatSuaraNotifikasi({ AudioContext: MockAudioContext });

    expect(await suara.putar({ tipe: 'skrining_selesai' })).toBe(true);
    expect(nada).toEqual([523.25, 659.25]);

    // Tunggu jendela deduplikasi 900ms lewat atau uji instan baru
    const { MockAudioContext: Ctx2, nada: nada2 } = buatMockAudioContext('running');
    const suara2 = buatSuaraNotifikasi({ AudioContext: Ctx2 });
    expect(await suara2.putar({ tipe: 'order_lab_baru', prioritas: 'segera' })).toBe(true);
    expect(nada2).toEqual([880, 1174.66, 880, 1174.66]);

    suara.tutup();
    suara2.tutup();
});

test('menandai perluInteraksi bila autoplay diblokir dan berhenti berbunyi saat dimatikan', async () => {
    const { MockAudioContext } = buatMockAudioContext('suspended', false);
    const onStatus = jest.fn();
    const suara = buatSuaraNotifikasi({ AudioContext: MockAudioContext, onStatus });

    expect(await suara.putar({ tipe: 'skrining_selesai' })).toBe(false);
    expect(suara.status()).toMatchObject({ aktif: true, perluInteraksi: true });

    await suara.ubahAktif();
    expect(suara.status()).toMatchObject({ aktif: false, perluInteraksi: false });
    expect(await suara.putar({ tipe: 'skrining_selesai' })).toBe(false);

    suara.tutup();
});
