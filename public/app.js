// Pi Matters · Enhanced Frontend Client Engine
(function () {
  let currentSeekPosition = 0;
  let isAutoStreaming = false;
  let autoStreamTimer = null;
  let searchDebounceTimer = null;
  let currentFilter = 'all';

  // DOM Elements
  const elCursor = document.getElementById('val-cursor');
  const elProcessed = document.getElementById('val-processed');
  const elWords = document.getElementById('val-words');
  const elPhrases = document.getElementById('val-phrases');
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
  const filterChips = document.querySelectorAll('.chip');

  // Format numbers with commas
  function formatNum(n) {
    return new Intl.NumberFormat().format(n || 0);
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
      if (elPhrases) {
        elPhrases.textContent = formatNum(data.totalPhrases);
      }

      if (data.lastRunAt) {
        const date = new Date(data.lastRunAt);
        elLastRun.textContent = `Last run: ${date.toLocaleTimeString()}`;
      } else {
        elLastRun.textContent = 'Awaiting next cron run';
      }
    } catch (err) {
      console.warn('Failed to load stats:', err);
    }
  }

  // Load and Render Discoveries on Timeline
  async function loadDiscoveries(query = '') {
    try {
      let url = `/api/discoveries?limit=60&filter=${encodeURIComponent(currentFilter)}`;
      if (query) {
        url = `/api/search?q=${encodeURIComponent(query)}`;
      }

      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      const list = query ? data.results : data.discoveries;

      badgeDiscoveryCount.textContent = `${list.length} Discoveries`;

      if (list.length === 0) {
        discoveriesContainer.innerHTML = `
          <div class="empty-state">
            <p>${query ? `No occurrences found for "${escapeHtml(query)}".` : 'No discoveries in this category yet. Click "Mine Chunk Now" to unearth text!'}</p>
          </div>
        `;
        return;
      }

      discoveriesContainer.innerHTML = list.map(item => {
        const rarity = (item.rarity_tier || 'COMMON').toLowerCase();
        const rarityClass = `rarity-${rarity}`;
        const pillClass = `pill-${rarity}`;

        return `
          <div class="timeline-node">
            <div class="timeline-marker"></div>
            <div class="discovery-card ${rarityClass}" data-word="${escapeHtml(item.word)}">
              <div class="card-top">
                <div class="word-badge-wrap">
                  <span class="word-badge">${escapeHtml(item.word)}</span>
                  <span class="rarity-pill ${pillClass}">${item.rarity_tier || 'COMMON'}</span>
                  ${item.phrase_label && item.phrase_label !== 'Single Word' ? `<span class="syntax-badge">${escapeHtml(item.phrase_label)}</span>` : ''}
                </div>
                <span class="offset-pill">Digits [${item.digit_start} &ndash; ${item.digit_end}]</span>
              </div>

              <div class="card-ascii-context">
                Decoded Context: <strong>${escapeHtml(item.decoded_ascii || item.word)}</strong>
              </div>

              <div class="card-data-row">
                <div class="card-data-label">Hex Sequence (Base-16)</div>
                <div class="card-data-val">${escapeHtml(item.hex_snippet || '')}</div>
              </div>

              <div class="card-data-row">
                <div class="card-data-label">Binary Bits (4-bit per hex)</div>
                <div class="card-data-val">${formatBinary(item.binary_snippet)}</div>
              </div>

              <div class="card-actions">
                <button class="btn-dict" data-word="${escapeHtml(item.word)}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                  </svg>
                  Wiktionary Definition
                </button>
              </div>

              <div class="definition-drawer" id="def-${escapeHtml(item.word).replace(/\s+/g, '_')}"></div>
            </div>
          </div>
        `;
      }).join('');
    } catch (err) {
      console.warn('Failed to load discoveries:', err);
    }
  }

  // Delegate clicks on Wiktionary Definition button
  discoveriesContainer.addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn-dict');
    if (!btn) {
      const audioBtn = e.target.closest('.btn-audio');
      if (audioBtn) {
        const audioUrl = audioBtn.getAttribute('data-audio');
        if (audioUrl) {
          const snd = new Audio(audioUrl);
          snd.play().catch(err => console.warn('Audio play error:', err));
        }
      }
      return;
    }

    const word = btn.getAttribute('data-word');
    if (!word) return;

    const drawerId = `def-${escapeHtml(word).replace(/\s+/g, '_')}`;
    const drawer = document.getElementById(drawerId);
    if (!drawer) return;

    if (drawer.classList.contains('open')) {
      drawer.classList.remove('open');
      btn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
        </svg>
        Wiktionary Definition
      `;
      return;
    }

    drawer.classList.add('open');
    if (!drawer.innerHTML) {
      drawer.innerHTML = `<span class="spinner" style="width:14px;height:14px;border-width:2px;display:inline-block;"></span> Querying Wiktionary...`;
      try {
        const res = await fetch(`/api/define/${encodeURIComponent(word)}`);
        const def = await res.json();

        drawer.innerHTML = `
          <div class="def-top">
            <div style="display:flex;align-items:center;gap:0.5rem;">
              ${def.partOfSpeech ? `<span class="def-pos-tag">${escapeHtml(def.partOfSpeech)}</span>` : ''}
              ${def.phonetic ? `<span class="def-phonetic">${escapeHtml(def.phonetic)}</span>` : ''}
            </div>
            ${def.audioUrl ? `
              <button class="btn-audio" data-audio="${escapeHtml(def.audioUrl)}" title="Listen to pronunciation">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>
              </button>
            ` : ''}
          </div>
          <div class="def-body">${escapeHtml(def.definition || 'No definition found in Wiktionary.')}</div>
          ${def.example ? `<div class="def-example">&ldquo;${escapeHtml(def.example)}&rdquo;</div>` : ''}
        `;
      } catch (err) {
        drawer.innerHTML = `<div class="def-body" style="color:var(--text-muted);">Failed to retrieve definition.</div>`;
      }
    }
    btn.textContent = 'Hide Definition';
  });

  function formatBinary(bin) {
    if (!bin) return '';
    return bin.match(/.{1,8}/g)?.join(' ') || bin;
  }

  function escapeHtml(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Load Inspect Matrix
  async function loadMatrix(pos, count = 64) {
    try {
      hexRange.textContent = `Digits ${pos} &ndash; ${pos + count}`;
      binRange.textContent = `${count * 4} Bits`;

      const res = await fetch(`/api/inspect/${pos}?count=${count}`);
      if (!res.ok) return;
      const data = await res.json();

      const formattedHex = data.hex.match(/.{1,2}/g)?.join(' ') || data.hex;
      matrixHex.textContent = formattedHex;

      const formattedBin = data.binary.match(/.{1,8}/g)?.join(' ') || data.binary;
      matrixBinary.textContent = formattedBin;

      let asciiHtml = escapeHtml(data.ascii);
      if (data.detectedWords && data.detectedWords.length > 0) {
        for (const w of data.detectedWords) {
          const regex = new RegExp(`(${w.word})`, 'gi');
          asciiHtml = asciiHtml.replace(regex, `<span class="highlight-word">$1</span>`);
        }
      }
      matrixAscii.innerHTML = asciiHtml;
    } catch (err) {
      console.warn('Failed to load matrix:', err);
    }
  }

  // Filter Chips Listener
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilter = chip.getAttribute('data-filter') || 'all';
      loadDiscoveries(inputSearch.value.trim());
    });
  });

  // Event: Mine Chunk Now
  btnMine.addEventListener('click', async () => {
    btnMine.disabled = true;
    const originalText = btnMine.innerHTML;
    btnMine.innerHTML = `<span class="spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;"></span> Mining...`;

    try {
      const res = await fetch('/api/mine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchSize: 180 })
      });
      const data = await res.json();

      await loadStats();
      await loadDiscoveries();

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
