import { lazy, Suspense } from 'react';
import { HalamanKlinikPublik } from './halaman/klinik-publik';
import { PenyediaNavigasi, useNavigasi } from './util/navigasi';
const AppInternal = lazy(() => import('./app-internal').then(m => ({ default: m.AppInternal })));
const LayarPanggilan = lazy(() => import('./halaman/layar-panggilan').then(m => ({ default: m.HalamanLayarPanggilan })));

function RuteAplikasi() {
  const { path, search } = useNavigasi();
  if (path === '/' || /^\/klinik\/[a-z0-9-]+\/?$/.test(path)) return <HalamanKlinikPublik key={path} slug={path === '/' ? undefined : path.split('/')[2]} />;
  return <Suspense fallback={<p role="status" style={{ padding: 24 }}>Memuat halaman…</p>}>
    {/^\/layar-panggilan(?:\/|$)/.test(path) ? <LayarPanggilan key={`${path}${search}`} /> : <AppInternal />}
  </Suspense>;
}
export function App() {
  return <PenyediaNavigasi><RuteAplikasi /></PenyediaNavigasi>;
}
