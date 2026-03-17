export function sendToPlugin(msg) {
  window.parent.postMessage({ pluginMessage: msg }, '*');
}

export function onPluginMessage(handler) {
  const listener = (e) => {
    if (e.data?.pluginMessage) handler(e.data.pluginMessage);
  };
  window.addEventListener('message', listener);
  return () => window.removeEventListener('message', listener);
}

export function bytesToDataUrl(bytes) {
  const uint8 = new Uint8Array(bytes);
  const CHUNK = 8192;
  let binary = '';
  for (let i = 0; i < uint8.length; i += CHUNK) {
    binary += String.fromCharCode(...uint8.subarray(i, i + CHUNK));
  }
  return `data:image/jpeg;base64,${btoa(binary)}`;
}

export function generateId() {
  return Math.random().toString(36).slice(2, 11);
}
