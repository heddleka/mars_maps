import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const checkForDeploymentUpdate = async () => {
  if (import.meta.env.DEV || document.visibilityState === 'hidden') return;

  try {
    const response = await fetch(`/?_version_check=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Version check failed (${response.status}).`);

    const latestHtml = await response.text();
    const latestDocument = new DOMParser().parseFromString(latestHtml, 'text/html');
    const getAssets = (htmlDocument) => Array.from(
      htmlDocument.querySelectorAll('script[type="module"][src], link[rel="stylesheet"][href]')
    )
      .map((asset) => asset.getAttribute('src') || asset.getAttribute('href'))
      .filter(Boolean)
      .map((asset) => new URL(asset, window.location.origin).pathname)
      .sort();
    const latestAssets = getAssets(latestDocument);
    const currentAssets = getAssets(document);

    if (latestAssets.length && JSON.stringify(latestAssets) !== JSON.stringify(currentAssets)) {
      window.location.reload();
    }
  } catch (error) {
    console.warn('Could not check for a new app version:', error);
  }
};

if (!import.meta.env.DEV) {
  let checking = false;
  const checkIfIdle = async () => {
    if (checking || document.visibilityState === 'hidden') return;
    checking = true;
    try {
      await checkForDeploymentUpdate();
    } finally {
      checking = false;
    }
  };

  window.setInterval(checkIfIdle, 60_000);
  document.addEventListener('visibilitychange', checkIfIdle);
  void checkIfIdle();
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

