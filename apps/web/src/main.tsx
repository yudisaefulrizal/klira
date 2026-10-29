import './gaya/token.css';
import { createRoot } from 'react-dom/client';
import { App } from './app';
import { temaTersimpan, terapkanTema } from './util/tema';

terapkanTema(temaTersimpan());
createRoot(document.getElementById('root')!).render(<App />);
