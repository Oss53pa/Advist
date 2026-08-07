/**
 * Pages index
 *
 * N'exporter ICI que les pages réellement chargées immédiatement par App.tsx.
 *
 * ⚠️ Ce fichier est importé par App.tsx : toute page ré-exportée ici entre dans
 * le bundle principal, même si App.tsx la déclare aussi en `React.lazy()` — le
 * `lazy()` devient alors purement décoratif. C'est ce qui était arrivé à
 * LandingPage. Pour une page lazy, ne l'exportez pas ici : App.tsx l'importe
 * déjà directement via `lazy(() => import('./pages/…'))`.
 */

// Seule page d'auth rendue sans lazy (bundle réduit, affichage immédiat).
export { LoginPage } from './auth/LoginPage';
