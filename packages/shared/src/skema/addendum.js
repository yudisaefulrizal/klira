import { z } from 'zod';
/** Entitas yang boleh diberi addendum; CPPT dan resume menambah nilai di sini ketika dikerjakan. */
export const ENTITAS_ADDENDUM = ['hasil_penunjang'];
export const entitasAddendum = z.enum(ENTITAS_ADDENDUM);
