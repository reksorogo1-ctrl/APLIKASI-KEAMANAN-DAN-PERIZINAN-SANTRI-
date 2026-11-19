import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './services/firebase';
import { initAutoUpdateAndSync } from './services/autoUpdateService';

initAutoUpdateAndSync();

createRoot(document.getElementById('root')!).render(<App />);
