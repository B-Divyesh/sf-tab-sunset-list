import './styles.css';

function updateConnectivity() {
  const status = document.querySelector<HTMLElement>('#connectivity');
  if (status) status.textContent = navigator.onLine
    ? 'Site files are available offline after one visit.'
    : 'Offline. This page is still available.';
}

window.addEventListener('online', updateConnectivity);
window.addEventListener('offline', updateConnectivity);
updateConnectivity();

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => undefined));
}
