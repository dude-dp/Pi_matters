// Pi Matters · Frontend Client Engine
(function () {
  let currentSeekPosition = 0;
  let isAutoStreaming = false;
  let autoStreamTimer = null;
  let searchDebounceTimer = null;

  // DOM Elements
  const elCursor = document.getElementById('val-cursor');
  const elProcessed = document.getElementById('val-processed');
  const elWords = document.getElementById('val-words');
  const elLastRun = document.getElementById('val-last-run');

  const btnMine = document.getElementById('btn-mine-chunk');
  const btnSeek = document.getElementById('btn-seek');
  const btnPrev = document.getElementById('btn-step-prev');
  const btnNext = document.getElementById('btn-step-next');
  const btnAuto = document.getElementById('btn-toggle-auto');
  const inputSeekPos = document.getElementById('input-seek-pos');

  const matrixHex = document.getElementById('matrix-hex');
  const matrixBinary = document.getElementById('matrix-binary');
  const matrixAscii = document.getElementById('matrix-ascii');
  const hexRange = document.getElementById('hex-range');
  const binRange = document.getElementById('bin-range');

  const discoveriesContainer = document.getElementById('discoveries-container');
  const badgeDiscoveryCount = document.getElementById('badge-discovery-count');
  const inputSearch = document.getElementById('input-search');
  const btnClearSearch = document.getElementById('btn-clear-search');

  // Format numbers with commas
  function formatNum(n) {
    return new Intl.NumberFormat().format(n);
  }

  // Fetch Telemetry & Stats
  async function loadStats() {
    try {
      const res = await fetch('/api/stats');
      if (!res.ok) return;
      const data = await res.json();

      elCursor.textContent = formatNum(data.cursor);
      elProcessed.textContent = formatNum(data.totalProcessed);
      elWords.textContent = formatNum(data.totalWords);

      if (data.lastRunAt) {
        const date = new Date(data.lastRunAt);
        elLastRun.textContent = `Last run: ${date.toLocaleTimeString()}`;
      } else {
        elLastRun.textContent = 'Awaiting first cron run';
      }
    } catch (err) {
      console.warn('Failed to load stats:', err);
    }
  }

  // Load and Render Discoveries
  async function loadDiscoveries(query = '') {
    try {
      let url = '/api/discoveries?limit=50';
      if (query) {
        url = `/api/search?q=${encodeURIComponent(query)}`;
      }

      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      const list = query ? data.results : data.discoveries;

      badgeDiscoveryCount.textContent = `${list.length} Discovered`;

      if (list.length === 0) {
        discoveriesContainer.innerHTML = `
          <div class="empty-state">
            <p>${query ? `No occurrences found for "${query}".` : 'No words discovered yet. Click "Mine Chunk Now" to extract digits!'}</p>
          </div>
        `;
        return;
      }

      discoveriesContainer.innerHTML = list.map(item => `
        <div class="discovery-card" data-word="${item.word}">
          <div class="card-top">
            <span class="word-badge">${item.word}</span>
            <span class="offset-pill">Digits [${item.digit_start} &ndash; ${item.digit_end}]</span>
          </div>

          <div class="card-ascii-context">
            Decoded: <strong>${escapeHtml(item.decoded_ascii || item.word)}</strong>
          </div>

          <div class="card-data-row">
            <div class="card-data-label">Hex Sequence (Base-16)</div>
            <div class="card-data-val">${item.hex_snippet}</div>
          </div>

          <div class="card-data-row">
            <div class="card-data-label">Binary Bits</div>
            <div class="card-data-val">${formatBinary(item.binary_snippet)}</div>
          </div>
        </div>
      `).join('');
    } catch (err) {
      console.warn('Failed to load discoveries:', err);
    }
  }

  function formatBinary(bin) {
    if (!bin) return '';
    // Group in 8-bit bytes
    return bin.match(/.{1,8}/g)?.join(' ') || bin;
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Load Inspect Matrix
  async function loadMatrix(pos, count = 64) {
    try {
      hexRange.textContent = `Digits ${pos} &ndash; ${pos + count}`;
      binRange.textContent = `${count * 4} Bits`;

      const res = await fetch(`/api/inspect/${pos}?count=${count}`);
      if (!res.ok) return;
      const data = await res.json();

      // Format Hex with spacing every 2 chars (1 byte)
      const formattedHex = data.hex.match(/.{1,2}/g)?.join(' ') || data.hex;
      matrixHex.textContent = formattedHex;

      // Format Binary with spacing every 8 bits
      const formattedBin = data.binary.match(/.{1,8}/g)?.join(' ') || data.binary;
      matrixBinary.textContent = formattedBin;

      // Render ASCII with highlighted words if any detected
      let asciiHtml = escapeHtml(data.ascii);
      if (data.detectedWords && data.detectedWords.length > 0) {
        for (const w of data.detectedWords) {
          const regex = new RegExp(w.word, 'gi');
          asciiHtml = asciiHtml.replace(regex, `<span class="highlight-word">${w.word}</span>`);
        }
      }
      matrixAscii.innerHTML = asciiHtml;
    } catch (err) {
      console.warn('Failed to load matrix:', err);
    }
  }

  // Event: Mine Chunk Now
  btnMine.addEventListener('click', async () => {
    btnMine.disabled = true;
    btnMine.classList.add('loading');
    const originalText = btnMine.innerHTML;
    btnMine.innerHTML = `<span class="spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;"></span> Mining...`;

    try {
      const res = await fetch('/api/mine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchSize: 120 })
      });
      const data = await res.json();
      
      // Update stats and matrix
      await loadStats();
      await loadDiscoveries();
      
      // Jump view to latest processed chunk
      if (data.cursorBefore !== undefined) {
        currentSeekPosition = data.cursorBefore;
        inputSeekPos.value = currentSeekPosition;
        await loadMatrix(currentSeekPosition, 64);
      }
    } catch (err) {
      console.error('Mine error:', err);
    } finally {
      btnMine.disabled = false;
      btnMine.innerHTML = originalText;
    }
  });

  // Seek Controls
  btnSeek.addEventListener('click', () => {
    currentSeekPosition = Math.max(0, parseInt(inputSeekPos.value, 10) || 0);
    loadMatrix(currentSeekPosition, 64);
  });

  btnPrev.addEventListener('click', () => {
    currentSeekPosition = Math.max(0, currentSeekPosition - 64);
    inputSeekPos.value = currentSeekPosition;
    loadMatrix(currentSeekPosition, 64);
  });

  btnNext.addEventListener('click', () => {
    currentSeekPosition += 64;
    inputSeekPos.value = currentSeekPosition;
    loadMatrix(currentSeekPosition, 64);
  });

  // Auto Stream Toggle
  btnAuto.addEventListener('click', () => {
    isAutoStreaming = !isAutoStreaming;
    if (isAutoStreaming) {
      btnAuto.classList.add('active');
      btnAuto.textContent = 'Pause Stream';
      autoStreamTimer = setInterval(() => {
        currentSeekPosition += 16;
        inputSeekPos.value = currentSeekPosition;
        loadMatrix(currentSeekPosition, 64);
      }, 1200);
    } else {
      btnAuto.classList.remove('active');
      btnAuto.textContent = 'Auto Stream';
      clearInterval(autoStreamTimer);
    }
  });

  // Search input with debouncing
  inputSearch.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    btnClearSearch.style.display = val ? 'block' : 'none';

    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      loadDiscoveries(val);
    }, 250);
  });

  btnClearSearch.addEventListener('click', () => {
    inputSearch.value = '';
    btnClearSearch.style.display = 'none';
    loadDiscoveries();
  });

  // Initial Load
  loadStats();
  loadDiscoveries();
  loadMatrix(0, 64);

  // Periodic poll of telemetry (every 10s)
  setInterval(loadStats, 10000);
})();
