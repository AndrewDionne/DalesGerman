const dataPath = 'data/modules.json';

const state = {
  modules: [],
  activeModuleId: null,
  activeAudioButton: null,
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
    const toggleButton = event.target.closest('.text-toggle-btn');

    if (summaryButton) {
      const row = summaryButton.closest('.qa-row');
      row.classList.toggle('expanded');
      return;
    }

    if (audioButton) {
      playAudio(audioButton);
      return;
    }

    if (toggleButton) {
      toggleLanguage(toggleButton.closest('.qa-row'));
    }
  });

  dom.sharedPlayer.addEventListener('ended', clearPlayingState);
  dom.sharedPlayer.addEventListener('pause', clearPlayingState);

  dom.collapseAllBtn.addEventListener('click', () => {
    document.querySelectorAll('.qa-row.expanded').forEach((row) => row.classList.remove('expanded'));
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
  return `
    <article class="qa-row" data-language="de">
      <button type="button" class="qa-summary" aria-expanded="false">
        <div class="qa-summary-main">
          <span class="qa-label">Question ${index + 1}</span>
          <span class="qa-summary-text">${escapeHtml(item.question_de)}</span>
        </div>
        <span class="chevron">⌄</span>
      </button>

      <div class="qa-detail">
        <div class="audio-controls">
          <button type="button" class="audio-btn" data-audio-src="${escapeAttribute(item.q_audio || '')}">
            Q
            <span>Play German question</span>
          </button>
          <button type="button" class="audio-btn" data-audio-src="${escapeAttribute(item.a_audio || '')}">
            A
            <span>Play German answer</span>
          </button>
        </div>

        <button type="button" class="text-toggle-btn">Show English</button>

        <div class="text-panels">
          <div class="text-panel">
            <span class="text-panel-label">Question</span>
            <span class="text-panel-value" data-role="question-text">${escapeHtml(item.question_de)}</span>
          </div>
          <div class="text-panel">
            <span class="text-panel-label">Answer</span>
            <span class="text-panel-value" data-role="answer-text">${escapeHtml(item.answer_de)}</span>
          </div>
        </div>

        <div class="qa-payload" data-payload="${escapeAttribute(encodeURIComponent(JSON.stringify(item)))}"></div>
      </div>
    </article>
  `;
}

function toggleLanguage(row) {
  const payload = getRowPayload(row);
  const currentLanguage = row.dataset.language === 'en' ? 'en' : 'de';
  const nextLanguage = currentLanguage === 'de' ? 'en' : 'de';

  row.dataset.language = nextLanguage;
  row.querySelector('[data-role="question-text"]').textContent =
    nextLanguage === 'de' ? payload.question_de : payload.question_en || payload.question_de;
  row.querySelector('[data-role="answer-text"]').textContent =
    nextLanguage === 'de' ? payload.answer_de : payload.answer_en || payload.answer_de;
  row.querySelector('.text-toggle-btn').textContent = nextLanguage === 'de' ? 'Show English' : 'Show German';
  row.querySelector('.qa-summary-text').textContent =
    nextLanguage === 'de' ? payload.question_de : payload.question_en || payload.question_de;
}

function getRowPayload(row) {
  const payloadNode = row.querySelector('.qa-payload');
  return JSON.parse(decodeURIComponent(payloadNode.dataset.payload));
}

function playAudio(button) {
  const audioSrc = button.dataset.audioSrc;
  if (!audioSrc) {
    alert('No audio file is linked for this button yet.');
    return;
  }

  if (state.activeAudioButton === button && !dom.sharedPlayer.paused) {
    dom.sharedPlayer.pause();
    clearPlayingState();
    return;
  }

  clearPlayingState();
  state.activeAudioButton = button;
  button.classList.add('playing');
  dom.sharedPlayer.src = audioSrc;
  dom.sharedPlayer.play().catch((error) => {
    console.error(error);
    clearPlayingState();
    alert('Audio could not be played. Check that the MP3 file exists in the repo.');
  });
}

function clearPlayingState() {
  if (state.activeAudioButton) {
    state.activeAudioButton.classList.remove('playing');
    state.activeAudioButton = null;
  }
}

function renderEmptyState() {
  dom.moduleHeader.classList.remove('skeleton');
  dom.moduleHeader.innerHTML = '<h2 class="module-title">No modules yet</h2><p class="module-description">Add content to data/modules.json and reload.</p>';
  dom.groupsContainer.innerHTML = '<div class="empty-state">There are no question modules in the JSON file yet.</div>';
}

function renderErrorState(error) {
  dom.moduleHeader.classList.remove('skeleton');
  dom.moduleHeader.innerHTML = '<h2 class="module-title">Unable to load the app</h2><p class="module-description">Check the JSON path and deploy again.</p>';
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
