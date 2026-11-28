(function () {
  const MIN_LANDSCAPE_WIDTH = 760;

  const launcherView = document.getElementById('launcher-view');
  const stageView = document.getElementById('stage-view');
  const launchForm = document.getElementById('launch-form');
  const urlInput = document.getElementById('url-input');
  const errorBox = document.getElementById('error-box');
  const errorText = document.getElementById('error-text');
  const exitBtn = document.getElementById('exit-btn');
  const reloadBtn = document.getElementById('reload-btn');
  const stageLoader = document.getElementById('stage-loader');
  const iframe = document.getElementById('landscape-frame');

  let currentUrl = '';
  let wasFullscreenOnLaunch = false;

  function normalizeUserUrl(rawInput) {
    const trimmed = String(rawInput || '').trim();
    if (!trimmed) return null;

    const candidate = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)
      ? trimmed
      : 'https://' + trimmed;

    try {
      const parsed = new URL(candidate);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return null;
      }
      if (!parsed.hostname || parsed.hostname.indexOf('.') === -1) {
        return null;
      }
      return parsed.toString();
    } catch (_) {
      return null;
    }
  }

  function showError(message) {
    if (!message) {
      errorBox.hidden = true;
      errorText.textContent = '';
      return;
    }
    errorText.textContent = message;
    errorBox.hidden = false;
  }

  function updateFrameGeometry() {
    if (stageView.hidden) return;
    const vw = Math.max(320, window.innerWidth || 390);
    const vh = Math.max(320, window.innerHeight || 844);

    const logicalWidth = Math.max(vh, MIN_LANDSCAPE_WIDTH);
    const scale = vh / logicalWidth;
    const logicalHeight = vw / scale;

    iframe.style.width = logicalWidth + 'px';
    iframe.style.height = logicalHeight + 'px';
    iframe.style.transform =
      'translate(-50%, -50%) rotate(90deg) scale(' + scale + ')';
  }

  async function enterFullscreenSafely() {
    wasFullscreenOnLaunch = false;
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        wasFullscreenOnLaunch = Boolean(document.fullscreenElement);
      }
    } catch (_) {
      wasFullscreenOnLaunch = false;
    }
  }

  function openStage(url) {
    currentUrl = url;
    launcherView.hidden = true;
    stageView.hidden = false;
    stageLoader.hidden = false;
    updateFrameGeometry();
    iframe.src = url;
  }

  function closeStage() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(function () {});
    }
    wasFullscreenOnLaunch = false;
    stageView.hidden = true;
    launcherView.hidden = false;
    stageLoader.hidden = true;
    iframe.removeAttribute('src');
    currentUrl = '';
    urlInput.focus();
  }

  urlInput.addEventListener('input', function () {
    if (!errorBox.hidden) {
      showError('');
    }
  });

  launchForm.addEventListener('submit', function (event) {
    event.preventDefault();
    const normalized = normalizeUserUrl(urlInput.value);
    if (!normalized) {
      showError('Bitte gib eine gültige Webadresse ein (z. B. https://bloxd.io).');
      return;
    }
    showError('');
    void enterFullscreenSafely();
    openStage(normalized);
  });

  iframe.addEventListener('load', function () {
    stageLoader.hidden = true;
  });

  exitBtn.addEventListener('click', closeStage);

  reloadBtn.addEventListener('click', function () {
    if (!currentUrl) return;
    stageLoader.hidden = false;
    iframe.src = currentUrl;
  });

  window.addEventListener('resize', updateFrameGeometry);
  window.addEventListener('orientationchange', updateFrameGeometry);

  document.addEventListener('fullscreenchange', function () {
    if (wasFullscreenOnLaunch && !document.fullscreenElement && !stageView.hidden) {
      closeStage();
    }
  });

  window.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && !stageView.hidden) {
      closeStage();
    }
  });
})();
