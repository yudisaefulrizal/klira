import { jest } from '@jest/globals';
import { dengarAntreanBerubah, PERISTIWA_ANTREAN_BERUBAH } from './peristiwa-antrean.js';
const target = new EventTarget();
beforeEach(() => { jest.useFakeTimers(); globalThis.window = target; globalThis.CustomEvent = globalThis.CustomEvent ?? class extends Event { };});
afterEach(() => { jest.useRealTimers(); delete globalThis.window; });
test('sinyal beruntun digabung menjadi satu pemanggilan dan pelepas menghentikannya', () => {
    const panggil = jest.fn();
    const lepas = dengarAntreanBerubah(panggil, 300);
    for (let i = 0; i < 3; i++) target.dispatchEvent(new Event(PERISTIWA_ANTREAN_BERUBAH));
    jest.advanceTimersByTime(299);
    expect(panggil).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(panggil).toHaveBeenCalledTimes(1);
    lepas();
    target.dispatchEvent(new Event(PERISTIWA_ANTREAN_BERUBAH));
    jest.advanceTimersByTime(1000);
    expect(panggil).toHaveBeenCalledTimes(1);
});
