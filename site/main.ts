import './styles.css';

const demoTitles = [
  ['Planning a calmer research workflow', '“Compare this with the new project brief.”'],
  ['Read: durable browser state', '“Bring one useful note to the team.”'],
  ['Two monitor arms compared', '“Decide before the return window.”'],
  ['Reference: CSS color functions', '“Keep only if the prototype uses it.”'],
];
let demoIndex = 0;

document.querySelectorAll<HTMLButtonElement>('[data-demo-action]').forEach((button) => {
  button.addEventListener('click', () => {
    demoIndex = (demoIndex + 1) % demoTitles.length;
    const title = document.querySelector<HTMLElement>('#demo-title');
    const reason = document.querySelector<HTMLElement>('#demo-reason');
    const status = document.querySelector<HTMLElement>('#demo-status');
    if (title) title.textContent = demoTitles[demoIndex][0];
    if (reason) reason.textContent = demoTitles[demoIndex][1];
    if (status) status.textContent = `${button.dataset.demoAction}: ${demoIndex + 1} of 4`;
  });
});

function updateConnectivity() {
  const status = document.querySelector<HTMLElement>('#connectivity');
  if (status) status.textContent = navigator.onLine ? 'Works offline after first visit' : 'Offline — this page is still available';
}
window.addEventListener('online', updateConnectivity);
window.addEventListener('offline', updateConnectivity);
updateConnectivity();

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => undefined));
}
