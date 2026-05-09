const dataPath = 'data/modules.json';

const state = {
  modules: [],
  activeModuleId: null,
  activeAudioButton: null,
  activeUtterance: null,
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
        <span class="group-count">${group.items.length} pytań</span>
      </div>
      <div class="question-list">
        ${group.items.map((item, index) => renderQuestionRow(item, index)).join('')}
      </div>
    </section>
  `;
}

function renderQuestionRow(item, index) {
  const questionPl = getQuestionPrimary(item);
  const answerPl = getAnswerPrimary(item);
  return `
    <article class="qa-row" data-language="pl">
      <button type="button" class="qa-summary" aria-expanded="false">
        <div class="qa-summary-main">
          <span class="qa-label">Pytanie ${index + 1}</span>
          <span class="qa-summary-text">${escapeHtml(questionPl)}</span>
        </div>
        <span class="chevron">⌄</span>
      </button>

      <div class="qa-detail">
        <div class="audio-controls">
          <button type="button" class="audio-btn" data-audio-src="${escapeAttribute(item.q_audio || '')}" data-audio-kind="question">
            Q
            <span>Odtwórz polskie pytanie</span>
          </button>
          <button type="button" class="audio-btn" data-audio-src="${escapeAttribute(item.a_audio || '')}" data-audio-kind="answer">
            A
            <span>Odtwórz polską odpowiedź</span>
          </button>
        </div>

        <button type="button" class="text-toggle-btn">Pokaż angielski</button>

        <div class="text-panels">
          <div class="text-panel">
            <span class="text-panel-label">Pytanie</span>
            <span class="text-panel-value" data-role="question-text">${escapeHtml(questionPl)}</span>
          </div>
          <div class="text-panel">
            <span class="text-panel-label">Odpowiedź</span>
            <span class="text-panel-value" data-role="answer-text">${escapeHtml(answerPl)}</span>
          </div>
        </div>

        <div class="qa-payload" data-payload="${escapeAttribute(encodeURIComponent(JSON.stringify(item)))}"></div>
      </div>
    </article>
  `;
}

function getQuestionPrimary(item) {
  return item.question_pl || item.question_de || item.question || '';
}

function getAnswerPrimary(item) {
  return item.answer_pl || item.answer_de || item.answer || '';
}

function getQuestionEnglish(item) {
  return item.question_en || getQuestionPrimary(item);
}

function getAnswerEnglish(item) {
  return item.answer_en || getAnswerPrimary(item);
}

function toggleLanguage(row) {
  const payload = getRowPayload(row);
  const currentLanguage = row.dataset.language === 'en' ? 'en' : 'pl';
  const nextLanguage = currentLanguage === 'pl' ? 'en' : 'pl';

  row.dataset.language = nextLanguage;
  row.querySelector('[data-role="question-text"]').textContent =
    nextLanguage === 'pl' ? getQuestionPrimary(payload) : getQuestionEnglish(payload);
  row.querySelector('[data-role="answer-text"]').textContent =
    nextLanguage === 'pl' ? getAnswerPrimary(payload) : getAnswerEnglish(payload);
  row.querySelector('.text-toggle-btn').textContent = nextLanguage === 'pl' ? 'Pokaż angielski' : 'Pokaż polski';
  row.querySelector('.qa-summary-text').textContent =
    nextLanguage === 'pl' ? getQuestionPrimary(payload) : getQuestionEnglish(payload);
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
    dom.sharedPlayer.play().catch((error) => {
      console.error(error);
      speakFallback(button, payload);
    });
    return;
  }

  speakFallback(button, payload);
}

function speakFallback(button, payload) {
  const utteranceText = button.dataset.audioKind === 'answer' ? getAnswerPrimary(payload) : getQuestionPrimary(payload);

  if (!('speechSynthesis' in window) || !utteranceText) {
    clearPlayingState();
    alert('No audio file is linked for this button yet. Generate MP3 files in tools/ or use a browser with speech support.');
    return;
  }

  const utterance = new SpeechSynthesisUtterance(utteranceText);
  utterance.lang = 'pl-PL';
  utterance.rate = 0.95;
  utterance.onend = clearPlayingState;
  utterance.onerror = clearPlayingState;
  state.activeUtterance = utterance;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
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
  dom.moduleHeader.innerHTML = '<h2 class="module-title">Brak modułów</h2><p class="module-description">Dodaj treść do pliku data/modules.json i odśwież stronę.</p>';
  dom.groupsContainer.innerHTML = '<div class="empty-state">W pliku JSON nie ma jeszcze modułów z pytaniami.</div>';
}

function renderErrorState(error) {
  dom.moduleHeader.classList.remove('skeleton');
  dom.moduleHeader.innerHTML = '<h2 class="module-title">Nie udało się wczytać aplikacji</h2><p class="module-description">Sprawdź ścieżkę JSON i wdroż stronę ponownie.</p>';
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
