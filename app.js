const dataPath = 'data/modules.json';

const state = {
  modules: [],
  activeModuleId: null,
  activeAudioButton: null,
  activeUtterance: null,
  audioRate: 1.0,
};

const dom = {
  moduleHeader: document.getElementById('module-header'),
  groupsContainer: document.getElementById('groups-container'),
  moduleNav: document.getElementById('module-nav'),
  sharedPlayer: document.getElementById('shared-player'),
  collapseAllBtn: document.getElementById('collapse-all-btn'),
};

async function init() {
  try {
    const response = await fetch(dataPath, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to load data: ${response.status}`);
    }

    const payload = await response.json();
    state.modules = payload.modules || [];

    if (!state.modules.length) {
      renderEmptyState();
      return;
    }

    state.activeModuleId = state.modules[0].id;
    renderModuleTabs();
    renderActiveModule();
    wireGlobalEvents();
  } catch (error) {
    console.error(error);
    renderErrorState(error);
  }
}

function wireGlobalEvents() {
  dom.moduleNav.addEventListener('click', (event) => {
    const button = event.target.closest('[data-module-id]');
    if (!button) return;
    state.activeModuleId = button.dataset.moduleId;
    renderModuleTabs();
    renderActiveModule();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  dom.groupsContainer.addEventListener('click', (event) => {
    const summaryButton = event.target.closest('.qa-summary');
    const audioButton = event.target.closest('.audio-btn');
    const speedButton = event.target.closest('.speed-btn');

    if (speedButton) {
      toggleAudioSpeed();
      return;
    }

    if (summaryButton) {
      const row = summaryButton.closest('.qa-row');
      const willExpand = !row.classList.contains('expanded');
      row.classList.toggle('expanded');
      summaryButton.setAttribute('aria-expanded', willExpand ? 'true' : 'false');
      return;
    }

    if (audioButton) {
      playAudio(audioButton);
    }
  });

  dom.sharedPlayer.addEventListener('ended', clearPlayingState);
  dom.sharedPlayer.addEventListener('pause', clearPlayingState);

  dom.collapseAllBtn.addEventListener('click', () => {
    document.querySelectorAll('.qa-row.expanded').forEach((row) => {
      row.classList.remove('expanded');
      const summary = row.querySelector('.qa-summary');
      if (summary) {
        summary.setAttribute('aria-expanded', 'false');
      }
    });
  });
}

function renderModuleTabs() {
  dom.moduleNav.innerHTML = state.modules
    .map(
      (module) => `
        <button
          type="button"
          class="module-tab ${module.id === state.activeModuleId ? 'active' : ''}"
          data-module-id="${escapeHtml(module.id)}"
        >
          ${escapeHtml(module.title)}
        </button>
      `,
    )
    .join('');
}

function renderActiveModule() {
  const activeModule = state.modules.find((module) => module.id === state.activeModuleId);
  if (!activeModule) return;

  dom.moduleHeader.classList.remove('skeleton');
  dom.moduleHeader.innerHTML = `
    <h2 class="module-title">${escapeHtml(activeModule.title)}</h2>
    <p class="module-description">${escapeHtml(activeModule.description || '')}</p>
  `;

  dom.groupsContainer.innerHTML = activeModule.groups
    .map((group) => renderGroup(group))
    .join('');
}

function renderGroup(group) {
  return `
    <section class="group-card">
      <div class="group-header">
        <h3 class="group-title">${escapeHtml(group.title)}</h3>
        <span class="group-count">${group.items.length} questions</span>
      </div>
      <div class="question-list">
        ${group.items.map((item, index) => renderQuestionRow(item, index)).join('')}
      </div>
    </section>
  `;
}

function renderQuestionRow(item, index) {
  const questionPl = getQuestionPolish(item);
  const answerPl = getAnswerPolish(item);
  const questionEn = getQuestionEnglish(item);
  const answerEn = getAnswerEnglish(item);

  return `
    <article class="qa-row">
      <button type="button" class="qa-summary" aria-expanded="false">
        <div class="qa-summary-main">
          <span class="qa-label">Question ${index + 1}</span>
          <span class="qa-summary-text">${escapeHtml(questionEn)}</span>
          <span class="qa-summary-subtext">${escapeHtml(questionPl)}</span>
        </div>
        <span class="chevron">⌄</span>
      </button>

      <div class="qa-detail">
        <div class="language-section english-section">
          <div class="language-section-header">English</div>
          <div class="text-panels two-up">
            <div class="text-panel">
              <span class="text-panel-label">Question in English</span>
              <span class="text-panel-value">${escapeHtml(questionEn)}</span>
            </div>
            <div class="text-panel">
              <span class="text-panel-label">Answer in English</span>
              <span class="text-panel-value">${escapeHtml(answerEn)}</span>
            </div>
          </div>
        </div>

        <div class="language-section polish-section">
          <div class="language-section-header">Polish</div>
          <div class="text-panels two-up">
            <div class="text-panel">
              <span class="text-panel-label">Question in Polish</span>
              <span class="text-panel-value">${escapeHtml(questionPl)}</span>
            </div>
            <div class="text-panel">
              <span class="text-panel-label">Answer in Polish</span>
              <span class="text-panel-value">${escapeHtml(answerPl)}</span>
            </div>
          </div>
        </div>

        <div class="audio-controls">
          <button type="button" class="audio-btn" data-audio-src="${escapeAttribute(item.q_audio || '')}" data-audio-kind="question">
            Q
            <span>Play Polish question</span>
          </button>
          <button type="button" class="audio-btn" data-audio-src="${escapeAttribute(item.a_audio || '')}" data-audio-kind="answer">
            A
            <span>Play Polish answer</span>
          </button>
          <button type="button" class="speed-btn" aria-pressed="false">
            Speed
            <span>Normal · tap for 0.8x</span>
          </button>
        </div>

        <div class="qa-payload" data-payload="${escapeAttribute(encodeURIComponent(JSON.stringify(item)))}"></div>
      </div>
    </article>
  `;
}

function getQuestionPolish(item) {
  return item.question_pl || item.question_de || item.question || '';
}

function getAnswerPolish(item) {
  return item.answer_pl || item.answer_de || item.answer || '';
}

function getQuestionEnglish(item) {
  return item.question_en || getQuestionPolish(item);
}

function getAnswerEnglish(item) {
  return item.answer_en || getAnswerPolish(item);
}

function getRowPayload(row) {
  const payloadNode = row.querySelector('.qa-payload');
  return JSON.parse(decodeURIComponent(payloadNode.dataset.payload));
}

function playAudio(button) {
  const row = button.closest('.qa-row');
  const payload = getRowPayload(row);
  const audioSrc = button.dataset.audioSrc;

  if (state.activeAudioButton === button) {
    stopPlayback();
    return;
  }

  stopPlayback();
  state.activeAudioButton = button;
  button.classList.add('playing');

  if (audioSrc) {
    dom.sharedPlayer.src = audioSrc;
    dom.sharedPlayer.playbackRate = state.audioRate;
    dom.sharedPlayer.play().catch((error) => {
      console.error(error);
      speakFallback(button, payload);
    });
    return;
  }

  speakFallback(button, payload);
}

function speakFallback(button, payload) {
  const utteranceText = button.dataset.audioKind === 'answer' ? getAnswerPolish(payload) : getQuestionPolish(payload);

  if (!('speechSynthesis' in window) || !utteranceText) {
    clearPlayingState();
    alert('No audio file is linked for this button yet. Generate MP3 files in tools/ or use a browser with speech support.');
    return;
  }

  const utterance = new SpeechSynthesisUtterance(utteranceText);
  utterance.lang = 'pl-PL';
  utterance.rate = state.audioRate;
  utterance.onend = clearPlayingState;
  utterance.onerror = clearPlayingState;
  state.activeUtterance = utterance;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}


function toggleAudioSpeed() {
  state.audioRate = state.audioRate === 1.0 ? 0.8 : 1.0;
  dom.sharedPlayer.playbackRate = state.audioRate;
  updateSpeedButtons();
}

function updateSpeedButtons() {
  document.querySelectorAll('.speed-btn').forEach((button) => {
    const isSlow = state.audioRate === 0.8;
    button.classList.toggle('active', isSlow);
    button.setAttribute('aria-pressed', isSlow ? 'true' : 'false');
    button.innerHTML = isSlow
      ? 'Speed<span>0.8x · tap for normal</span>'
      : 'Speed<span>Normal · tap for 0.8x</span>';
  });
}

function stopPlayback() {
  dom.sharedPlayer.pause();
  dom.sharedPlayer.currentTime = 0;
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  clearPlayingState();
}

function clearPlayingState() {
  if (state.activeAudioButton) {
    state.activeAudioButton.classList.remove('playing');
    state.activeAudioButton = null;
  }
  state.activeUtterance = null;
}

function renderEmptyState() {
  dom.moduleHeader.classList.remove('skeleton');
  dom.moduleHeader.innerHTML = '<h2 class="module-title">No modules yet</h2><p class="module-description">Add content to data/modules.json and refresh the page.</p>';
  dom.groupsContainer.innerHTML = '<div class="empty-state">There are no question modules in the JSON file yet.</div>';
}

function renderErrorState(error) {
  dom.moduleHeader.classList.remove('skeleton');
  dom.moduleHeader.innerHTML = '<h2 class="module-title">The app could not load</h2><p class="module-description">Check the JSON path and deploy the site again.</p>';
  dom.groupsContainer.innerHTML = `<div class="error-state">${escapeHtml(error.message)}</div>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll('`', '&#96;');
}

init();
