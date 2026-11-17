const KUNCI_SUARA = 'klira.notifikasi.suara';
const KANAL_TAB = 'klira-notifikasi-suara';

function bacaPreferensi() {
    try {
        return localStorage.getItem(KUNCI_SUARA) !== 'nonaktif';
    } catch {
        return true;
    }
}

function simpanPreferensi(aktif) {
    try {
        localStorage.setItem(KUNCI_SUARA, aktif ? 'aktif' : 'nonaktif');
    } catch { /* Abaikan bila penyimpanan peramban dibatasi. */ }
}

/**
 * Pemutar suara notifikasi berbasis Web Audio API (tanpa berkas audio eksternal).
 * Menangani kebijakan autoplay peramban dan deduplikasi antar-tab lewat BroadcastChannel.
 */
export function buatSuaraNotifikasi(opsi = {}) {
    const AudioCtx = opsi.AudioContext ?? (typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : undefined);
    const didukung = typeof AudioCtx === 'function';
    const idTab = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const kanal = typeof BroadcastChannel === 'function' ? new BroadcastChannel(KANAL_TAB) : null;

    let aktif = bacaPreferensi();
    let ctx = null;
    let perluInteraksi = false;
    let tutup = false;
    let kunciPutarSampai = 0;

    if (kanal) {
        kanal.onmessage = (e) => {
            if (e.data?.idTab !== idTab && e.data?.tipe === 'putar')
                kunciPutarSampai = Math.max(kunciPutarSampai, Date.now() + 900);
        };
    }

    function siapkanKonteks() {
        if (!didukung || tutup)
            return null;
        if (!ctx)
            ctx = new AudioCtx();
        return ctx;
    }

    function kabarkanStatus() {
        opsi.onStatus?.({ didukung, aktif, perluInteraksi });
    }

    async function bukaKunciAudio() {
        const c = siapkanKonteks();
        if (!c)
            return false;
        if (c.state === 'suspended') {
            try {
                await c.resume();
            } catch {
                return false;
            }
        }
        const terbuka = c.state === 'running';
        if (terbuka && perluInteraksi) {
            perluInteraksi = false;
            kabarkanStatus();
        }
        return terbuka;
    }

    function bunyiNada(c, frekuensi, tundaDetik, durasiDetik, volume = 0.14) {
        const mulai = c.currentTime + tundaDetik;
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(frekuensi, mulai);
        gain.gain.setValueAtTime(0.0001, mulai);
        gain.gain.exponentialRampToValueAtTime(volume, mulai + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, mulai + durasiDetik);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(mulai);
        osc.stop(mulai + durasiDetik + 0.02);
    }

    function mainkanPola(jenis) {
        const c = siapkanKonteks();
        if (!c || c.state !== 'running')
            return false;
        if (jenis === 'segera') {
            bunyiNada(c, 880, 0, 0.14, 0.16);
            bunyiNada(c, 1174.66, 0.14, 0.18, 0.16);
            bunyiNada(c, 880, 0.38, 0.14, 0.16);
            bunyiNada(c, 1174.66, 0.52, 0.22, 0.16);
            return true;
        }
        if (jenis === 'order_lab_baru') {
            bunyiNada(c, 587.33, 0, 0.14, 0.13);
            bunyiNada(c, 880, 0.14, 0.22, 0.13);
            return true;
        }
        // Default: skrining_selesai (nada lembut dua tingkat naik)
        bunyiNada(c, 523.25, 0, 0.15, 0.12);
        bunyiNada(c, 659.25, 0.14, 0.24, 0.12);
        return true;
    }

    async function putar(pesan) {
        if (tutup || !aktif || !didukung)
            return false;
        // Bila tab lain baru saja memutar suara untuk event yang sama, lewati agar tidak bergema.
        if (Date.now() < kunciPutarSampai)
            return false;
        // Jika ada banyak tab, utamakan tab yang sedang terlihat; tab tersembunyi menunda sebentar.
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
            await new Promise((r) => setTimeout(r, 120));
            if (tutup || Date.now() < kunciPutarSampai)
                return false;
        }
        const siap = await bukaKunciAudio();
        if (!siap) {
            perluInteraksi = true;
            kabarkanStatus();
            return false;
        }
        const jenis = pesan?.tipe === 'order_lab_baru' && pesan?.prioritas === 'segera' ? 'segera' : pesan?.tipe;
        const diputar = mainkanPola(jenis);
        if (diputar) {
            kunciPutarSampai = Date.now() + 900;
            kanal?.postMessage({ tipe: 'putar', idTab });
        }
        return diputar;
    }

    async function ubahAktif() {
        aktif = !aktif;
        simpanPreferensi(aktif);
        if (aktif && didukung) {
            const siap = await bukaKunciAudio();
            perluInteraksi = !siap;
            if (siap)
                mainkanPola('skrining_selesai');
        } else {
            perluInteraksi = false;
        }
        kabarkanStatus();
    }

    const tanganiInteraksi = () => {
        if (!aktif || !didukung)
            return;
        void bukaKunciAudio();
    };

    if (typeof document !== 'undefined') {
        document.addEventListener('pointerdown', tanganiInteraksi, { passive: true });
        document.addEventListener('keydown', tanganiInteraksi, { passive: true });
    }

    kabarkanStatus();

    return {
        status: () => ({ didukung, aktif, perluInteraksi }),
        putar,
        ubahAktif,
        tutup() {
            tutup = true;
            if (typeof document !== 'undefined') {
                document.removeEventListener('pointerdown', tanganiInteraksi);
                document.removeEventListener('keydown', tanganiInteraksi);
            }
            kanal?.close();
            if (ctx && typeof ctx.close === 'function')
                void ctx.close().catch(() => { });
            ctx = null;
        },
    };
}
