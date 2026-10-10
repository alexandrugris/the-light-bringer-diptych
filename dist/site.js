(function () {
  const data = window.LIGHTBRINGER_CONTENT;
  if (!data) return;
  const mobile = matchMedia('(max-width: 900px)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const noteNumber = note => String(data.notes.indexOf(note) + 1).padStart(2, '0');
  const notesForLine = lineId => data.notes.filter(note => note.lines.includes(lineId));

  function makePoem(poemKey, interactive, start = 0, end) {
    const root = document.createDocumentFragment();
    data.poems[poemKey].stanzas.slice(start, end).forEach((stanza, localIndex) => {
      const group = document.createElement(interactive ? 'div' : 'p');
      group.className = 'poem-stanza';
      stanza.forEach((text, lineIndex) => {
        const id = `${poemKey}-${start + localIndex}-${lineIndex}`;
        const notes = interactive ? notesForLine(id) : [];
        const line = document.createElement(notes.length ? 'button' : 'span');
        line.className = 'poem-line';
        if (notes.length) {
          line.type = 'button';
          line.id = id;
          line.classList.add('verse-trigger');
          line.setAttribute('aria-expanded', 'false');
          line.setAttribute('aria-label', `${text} — read notes ${notes.map(noteNumber).join(', ')}`);
          const words = document.createElement('span');
          words.className = 'verse-text';
          words.textContent = text;
          const marker = document.createElement('span');
          marker.className = 'verse-marker';
          marker.setAttribute('aria-hidden', 'true');
          marker.textContent = notes.map(noteNumber).join('·');
          line.append(words, marker);
          const row = document.createElement('div');
          row.className = 'verse-row';
          row.appendChild(line);
          group.appendChild(row);
        } else {
          line.textContent = text;
          group.appendChild(line);
        }
      });
      root.appendChild(group);
    });
    return root;
  }

  if (document.body.dataset.page === 'poems') {
    document.getElementById('poem-light-before').appendChild(makePoem('light', false, 0, 3));
    document.getElementById('poem-light-after').appendChild(makePoem('light', false, 3));
    document.getElementById('poem-others').appendChild(makePoem('others', false));
    return;
  }
  if (document.body.dataset.page !== 'notes') return;

  const miniPoem = document.getElementById('mini-poem');
  const noteList = document.getElementById('note-list');
  const mobileList = document.getElementById('mobile-note-list');
  const relatedOptions = document.getElementById('related-note-options');
  const desk = document.getElementById('reading-desk');
  const verseScroll = document.getElementById('verse-scroll');
  const svg = document.getElementById('connection-layer');
  const path = document.getElementById('connection-path');
  const dotA = document.getElementById('connection-dot-start');
  const dotB = document.getElementById('connection-dot-end');
  const cards = new Map();
  let currentPoem = 'light';
  let activeNoteId = null;
  let selectedLineId = null;
  let inlinePanel = null;

  function appendNoteContent(container, note) {
    const prose = document.createElement('p');
    prose.className = 'note-prose';
    prose.textContent = note.body;
    container.appendChild(prose);
    if (note.id === 'image') {
      const figure = document.createElement('figure');
      figure.className = 'note-source-image';
      const link = document.createElement('a');
      link.href = './assets/gemini-original.png';
      link.target = '_blank';
      link.rel = 'noopener';
      link.setAttribute('aria-label', 'Open the original Gemini image at full size');
      const img = document.createElement('img');
      img.src = './assets/gemini-original.png';
      img.alt = 'The original Gemini illustration: an optimistic, illustrated triptych of the poem, including its broken generated lettering.';
      img.width = 1408;
      img.height = 768;
      img.loading = 'lazy';
      link.appendChild(img);
      const caption = document.createElement('figcaption');
      caption.textContent = 'Original Gemini image · Open full size ↗';
      figure.append(link, caption);
      container.appendChild(figure);
    }
  }

  data.notes.forEach(note => {
    const card = document.createElement('article');
    card.className = 'note-card';
    card.dataset.note = note.id;
    const heading = document.createElement('button');
    heading.type = 'button';
    heading.className = 'note-heading';
    heading.setAttribute('aria-expanded', 'false');
    heading.setAttribute('aria-controls', `note-panel-${note.id}`);
    const number = document.createElement('span');
    number.className = 'note-kicker';
    number.textContent = `${noteNumber(note)} / AUTHOR’S NOTE`;
    const title = document.createElement('span');
    title.className = 'note-title';
    title.textContent = note.title;
    const icon = document.createElement('span');
    icon.className = 'note-toggle';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '+';
    heading.append(number, title, icon);
    const content = document.createElement('div');
    content.id = `note-panel-${note.id}`;
    content.className = 'note-content';
    content.hidden = true;
    appendNoteContent(content, note);
    if (new Set(note.lines.map(line => line.split('-')[0])).size > 1) {
      const scope = document.createElement('p');
      scope.className = 'note-scope';
      scope.textContent = 'Linked in both poems ↔';
      content.appendChild(scope);
    }
    heading.addEventListener('click', () => {
      if (activeNoteId === note.id) {
        activeNoteId = null;
        selectedLineId = null;
        updateCards();
        updateLines();
        renderRelatedOptions();
        drawConnection();
      } else activateDesktop(note.id, true);
    });
    card.append(heading, content);
    cards.set(note.id, { card, heading, content, icon });
    noteList.appendChild(card);

    const indexButton = document.createElement('button');
    indexButton.type = 'button';
    indexButton.className = 'note-index-button';
    indexButton.textContent = `${noteNumber(note)}  ${note.title}`;
    indexButton.addEventListener('click', () => {
      if (!note.lines.some(id => id.startsWith(currentPoem + '-'))) renderPoem(note.poem);
      const lineId = note.lines.find(id => id.startsWith(currentPoem + '-'));
      openInline(lineId, note.id);
      document.querySelector('.mobile-note-index').open = false;
      document.getElementById(lineId).scrollIntoView({ block: 'start', behavior: reducedMotion ? 'instant' : 'smooth' });
    });
    mobileList.appendChild(indexButton);
  });

  function renderPoem(poemKey) {
    closeInline(false);
    currentPoem = poemKey;
    selectedLineId = null;
    const title = document.createElement('h2');
    title.textContent = data.poems[poemKey].title;
    miniPoem.replaceChildren(title, makePoem(poemKey, true));
    document.querySelectorAll('.poem-switch button').forEach(button => {
      const selected = button.dataset.poem === poemKey;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    miniPoem.querySelectorAll('.verse-trigger').forEach(line => {
      line.addEventListener('click', () => {
        if (mobile.matches) {
          if (inlinePanel && selectedLineId === line.id) closeInline(true);
          else openInline(line.id);
        } else {
          selectedLineId = line.id;
          activateDesktop(notesForLine(line.id)[0].id, false);
          cards.get(activeNoteId).heading.scrollIntoView({ block: 'nearest', behavior: reducedMotion ? 'instant' : 'smooth' });
        }
      });
    });
    updateLines();
    renderRelatedOptions();
    requestAnimationFrame(drawConnection);
  }

  function updateCards() {
    cards.forEach(({ card, heading, content, icon }, id) => {
      const selected = activeNoteId === id;
      card.classList.toggle('is-active', selected);
      heading.setAttribute('aria-expanded', String(selected));
      content.hidden = !selected;
      icon.textContent = selected ? '−' : '+';
    });
  }

  function updateLines() {
    const note = data.notes.find(item => item.id === activeNoteId);
    miniPoem.querySelectorAll('.verse-trigger').forEach(line => {
      line.classList.toggle('is-linked', !!note && note.lines.includes(line.id));
      line.classList.toggle('is-selected', selectedLineId === line.id);
      const expanded = selectedLineId === line.id && !!activeNoteId;
      line.setAttribute('aria-expanded', String(expanded));
      if (expanded) line.setAttribute('aria-controls', mobile.matches ? `inline-${line.id}` : `note-panel-${activeNoteId}`);
      else line.removeAttribute('aria-controls');
    });
  }

  function renderRelatedOptions() {
    relatedOptions.replaceChildren();
    const related = selectedLineId ? notesForLine(selectedLineId) : [];
    relatedOptions.hidden = related.length < 2;
    if (related.length < 2) return;
    const label = document.createElement('span');
    label.textContent = 'Notes for this verse';
    relatedOptions.appendChild(label);
    related.forEach(note => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = noteNumber(note);
      button.title = note.title;
      button.setAttribute('aria-label', `Read note ${noteNumber(note)}: ${note.title}`);
      button.setAttribute('aria-pressed', String(activeNoteId === note.id));
      button.addEventListener('click', () => activateDesktop(note.id, false));
      relatedOptions.appendChild(button);
    });
  }

  function activateDesktop(noteId, fromNote) {
    const note = data.notes.find(item => item.id === noteId);
    if (!note) return;
    activeNoteId = noteId;
    if (fromNote) {
      if (!note.lines.some(id => id.startsWith(currentPoem + '-'))) renderPoem(note.poem);
      selectedLineId = null;
    }
    updateCards();
    updateLines();
    renderRelatedOptions();
    const target = document.getElementById(selectedLineId) || note.lines.map(id => document.getElementById(id)).find(Boolean);
    if (fromNote && target) {
      const desired = verseScroll.scrollTop + target.getBoundingClientRect().top - verseScroll.getBoundingClientRect().top - verseScroll.clientHeight * .3;
      verseScroll.scrollTo({ top: Math.max(0, desired), behavior: 'instant' });
    }
    requestAnimationFrame(drawConnection);
  }

  function openInline(lineId, preferredNoteId) {
    closeInline(false);
    const line = document.getElementById(lineId);
    if (!line) return;
    const notes = notesForLine(lineId);
    selectedLineId = lineId;
    activeNoteId = preferredNoteId || notes[0].id;
    inlinePanel = document.createElement('section');
    inlinePanel.id = `inline-${lineId}`;
    inlinePanel.className = 'inline-notes';
    inlinePanel.setAttribute('aria-label', 'Reading notes for this verse');
    const toolbar = document.createElement('div');
    toolbar.className = 'inline-note-toolbar';
    const label = document.createElement('span');
    label.textContent = 'AUTHOR’S NOTES';
    const close = document.createElement('button');
    close.type = 'button';
    close.textContent = 'Close ×';
    close.setAttribute('aria-label', 'Close notes for this verse');
    close.addEventListener('click', () => closeInline(true));
    toolbar.append(label, close);
    inlinePanel.appendChild(toolbar);
    notes.forEach(note => {
      const details = document.createElement('details');
      details.className = 'inline-note';
      details.open = note.id === activeNoteId;
      const summary = document.createElement('summary');
      summary.textContent = `${noteNumber(note)} / ${note.title}`;
      const body = document.createElement('div');
      body.className = 'inline-note-body';
      appendNoteContent(body, note);
      details.append(summary, body);
      details.addEventListener('toggle', () => {
        if (details.open) {
          activeNoteId = note.id;
          updateLines();
        }
      });
      inlinePanel.appendChild(details);
    });
    line.closest('.verse-row').appendChild(inlinePanel);
    updateCards();
    updateLines();
  }

  function closeInline(restoreFocus) {
    const line = selectedLineId && document.getElementById(selectedLineId);
    if (inlinePanel) inlinePanel.remove();
    inlinePanel = null;
    if (mobile.matches) {
      activeNoteId = null;
      selectedLineId = null;
      updateCards();
      updateLines();
      renderRelatedOptions();
    }
    if (restoreFocus && line) line.focus({ preventScroll: true });
  }

  function drawConnection() {
    if (mobile.matches || !activeNoteId) { svg.style.opacity = '0'; return; }
    const note = data.notes.find(item => item.id === activeNoteId);
    const line = document.getElementById(selectedLineId) || note.lines.map(id => document.getElementById(id)).find(Boolean);
    const target = cards.get(activeNoteId).heading;
    if (!line || !target) { svg.style.opacity = '0'; return; }
    const d = desk.getBoundingClientRect(), a = line.getBoundingClientRect(), b = target.getBoundingClientRect(), panel = verseScroll.getBoundingClientRect();
    const visible = a.bottom > panel.top && a.top < panel.bottom && b.bottom > 0 && b.top < innerHeight;
    svg.style.opacity = visible ? '1' : '0';
    if (!visible) return;
    const x1 = a.right - d.left + 6, y1 = a.top + a.height / 2 - d.top;
    const x2 = b.left - d.left - 8, y2 = b.top + b.height / 2 - d.top;
    const mid = (x1 + x2) / 2;
    svg.setAttribute('viewBox', `0 0 ${desk.clientWidth} ${desk.clientHeight}`);
    path.setAttribute('d', `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`);
    dotA.setAttribute('cx', x1); dotA.setAttribute('cy', y1);
    dotB.setAttribute('cx', x2); dotB.setAttribute('cy', y2);
  }

  document.querySelectorAll('.poem-switch button').forEach(button => button.addEventListener('click', () => {
    const note = data.notes.find(item => item.id === activeNoteId);
    if (!note || !note.lines.some(id => id.startsWith(button.dataset.poem + '-'))) activeNoteId = null;
    renderPoem(button.dataset.poem);
    verseScroll.scrollTop = 0;
    updateCards();
  }));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && inlinePanel) closeInline(true);
  });
  mobile.addEventListener('change', () => {
    const noteId = activeNoteId;
    const lineId = selectedLineId;
    if (mobile.matches && noteId) {
      const note = data.notes.find(item => item.id === noteId);
      const id = lineId || note.lines.find(id => id.startsWith(currentPoem + '-'));
      if (id) openInline(id, noteId);
    } else if (!mobile.matches && inlinePanel) {
      closeInline(false);
      activeNoteId = noteId;
      selectedLineId = lineId;
      updateCards(); updateLines();
    }
    requestAnimationFrame(drawConnection);
  });
  verseScroll.addEventListener('scroll', drawConnection, { passive: true });
  addEventListener('scroll', drawConnection, { passive: true });
  addEventListener('resize', drawConnection);
  if (window.ResizeObserver) new ResizeObserver(drawConnection).observe(desk);
  renderPoem('light');
})();
