// ============================================
// THE ODYSSEY — BOOK FORMAT IMMERSIVE READER
// Two-column parchment with inline illustrations,
// page turning, audio sync, and highlighting
// ============================================

const AUDIO_BASE = '../app/audiobook';

// ---- State ----
let audio = new Audio();
let metadata = null;
let isPlaying = false;
let currentChapter = 1;
let currentParagraphIndex = -1;
let animFrameId = null;
let isSeeking = false;

// Pagination
let currentPage = 0;
let totalPages = 0;

// ---- DOM ----
const readerText = document.getElementById('reader-text');
const readerViewport = document.getElementById('reader-viewport');
const chapterLabel = document.getElementById('chapter-label');
const chapterSubtitle = document.getElementById('chapter-subtitle');
const pageInfo = document.getElementById('page-info');

const pagePrevBtn = document.getElementById('page-prev');
const pageNextBtn = document.getElementById('page-next');

const playPauseBtn = document.getElementById('play-pause');
const prevChapterBtn = document.getElementById('prev-chapter');
const nextChapterBtn = document.getElementById('next-chapter');
const progressInput = document.getElementById('progress-input');
const progressFill = document.getElementById('progress-fill');
const timeCurrent = document.getElementById('time-current');
const timeTotal = document.getElementById('time-total');
const speedSelect = document.getElementById('speed-select');
const chapterSelect = document.getElementById('chapter-select');
const volumeInput = document.getElementById('volume-input');
const volumeIcon = document.getElementById('volume-icon');

// ============================================
// INIT
// ============================================

async function init() {
    let manifest;
    try {
        const resp = await fetch(`${AUDIO_BASE}/manifest.json`);
        manifest = await resp.json();
    } catch (e) {
        readerText.innerHTML = '<p style="color:#c44;">Failed to load audiobook data.</p>';
        return;
    }

    // Populate chapter select
    if (manifest.chapters) {
        manifest.chapters.forEach(ch => {
            const opt = document.createElement('option');
            opt.value = ch.book_num;
            opt.textContent = `${ch.chapter} — ${ch.title || ''}`;
            chapterSelect.appendChild(opt);
        });
    }

    await loadChapter(1);
    bindEvents();
}

// ============================================
// LOAD CHAPTER
// ============================================

async function loadChapter(chapterNum) {
    pause();
    currentChapter = chapterNum;
    currentParagraphIndex = -1;

    const padded = String(chapterNum).padStart(2, '0');
    const audioPath = `${AUDIO_BASE}/chapters/book_${padded}.wav`;
    const metaPath = `${AUDIO_BASE}/chapters/book_${padded}_meta.json`;

    try {
        const resp = await fetch(metaPath);
        metadata = await resp.json();
    } catch (e) {
        metadata = null;
        readerText.innerHTML = '<p style="color:#c44;">Failed to load chapter.</p>';
        return;
    }

    // Update header
    chapterLabel.textContent = metadata.chapter || `BOOK ${chapterNum}`;
    chapterSubtitle.textContent = metadata.title || '';
    chapterSelect.value = chapterNum;

    // Load audio
    audio.src = audioPath;
    audio.load();
    audio.volume = volumeInput.value / 100;
    audio.playbackRate = parseFloat(speedSelect.value);

    // Reset progress
    progressInput.value = 0;
    progressFill.style.width = '0%';
    timeCurrent.textContent = '0:00';

    audio.addEventListener('loadedmetadata', () => {
        timeTotal.textContent = formatTime(audio.duration);
    }, { once: true });

    // Render
    renderChapter();
}

// ============================================
// RENDER — Paragraphs + inline illustrations
// ============================================

function renderChapter() {
    if (!metadata || !metadata.paragraphs) {
        readerText.innerHTML = '<p style="color:#9a8a6e;">No content.</p>';
        return;
    }

    const additionalArt = {
        5: "file:///C:/Users/wheel/.gemini/antigravity/brain/0829e660-6298-4afe-b22a-e392f9388373/odyssey_scene_1_olympus_1780298725926.png",
        15: "file:///C:/Users/wheel/.gemini/antigravity/brain/0829e660-6298-4afe-b22a-e392f9388373/odyssey_scene_2_athena_1780298738793.png",
        30: "file:///C:/Users/wheel/.gemini/antigravity/brain/0829e660-6298-4afe-b22a-e392f9388373/odyssey_scene_3_suitors_1780298751425.png",
        45: "file:///C:/Users/wheel/.gemini/antigravity/brain/0829e660-6298-4afe-b22a-e392f9388373/odyssey_scene_5_phemius_1780298775631.png",
        55: "file:///C:/Users/wheel/.gemini/antigravity/brain/0829e660-6298-4afe-b22a-e392f9388373/odyssey_scene_4_telemachus_1780298764836.png"
    };

    let html = '';

    metadata.paragraphs.forEach((para) => {
        const isDialogue = para.speaker && para.speaker !== 'narrator';
        const speakerLabel = isDialogue ? formatSpeaker(para.speaker) : '';

        // Inject new additional generated illustrations BEFORE the paragraph
        if (additionalArt[para.index]) {
            html += `<div class="inline-illustration">`;
            html += `  <img src="${additionalArt[para.index]}" alt="Scene illustration" loading="lazy">`;
            html += `</div>`;
        }

        html += `<p data-idx="${para.index}">`;
        if (speakerLabel) {
            html += `<span class="speaker-tag">${speakerLabel}</span><br>`;
        }
        html += para.text.replace(/\n/g, ' ');
        html += `</p>`;

        // Existing inline illustrations from metadata
        if (para.illustration) {
            const src = `${AUDIO_BASE}/${para.illustration}`;
            html += `<div class="inline-illustration">`;
            html += `  <img src="${src}" alt="Scene illustration" loading="lazy">`;
            html += `</div>`;
        }
    });

    readerText.innerHTML = html;

    // Scroll to top
    readerViewport.scrollTop = 0;
}

function formatSpeaker(speaker) {
    return speaker.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ============================================
// PAGINATION REMOVED IN FAVOR OF VERTICAL SCROLL
// ============================================

function autoPageTurn(element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ============================================
// PLAYBACK
// ============================================

function play() {
    if (!audio.src) return;
    audio.play().catch(() => {});
    isPlaying = true;
    playPauseBtn.textContent = '⏸';
    playPauseBtn.classList.add('playing');
    startAnimLoop();
}

function pause() {
    audio.pause();
    isPlaying = false;
    playPauseBtn.textContent = '▶';
    playPauseBtn.classList.remove('playing');
    stopAnimLoop();
}

function toggle() { isPlaying ? pause() : play(); }

// ============================================
// ANIMATION LOOP
// ============================================

function startAnimLoop() {
    const loop = () => {
        onTimeUpdate();
        animFrameId = requestAnimationFrame(loop);
    };
    animFrameId = requestAnimationFrame(loop);
}

function stopAnimLoop() {
    if (animFrameId) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
    }
}

function onTimeUpdate() {
    const ct = audio.currentTime;
    const dur = audio.duration || 0;

    // Progress bar
    if (!isSeeking && dur > 0) {
        const pct = (ct / dur) * 10000;
        progressInput.value = pct;
        progressFill.style.width = `${(ct / dur) * 100}%`;
    }

    timeCurrent.textContent = formatTime(ct);
    if (dur > 0) timeTotal.textContent = formatTime(dur);

    // Find active paragraph
    if (!metadata || !metadata.paragraphs) return;

    let newIndex = -1;
    for (let i = metadata.paragraphs.length - 1; i >= 0; i--) {
        if (ct >= metadata.paragraphs[i].start_time) {
            newIndex = metadata.paragraphs[i].index;
            break;
        }
    }

    if (newIndex !== currentParagraphIndex && newIndex >= 0) {
        const prev = currentParagraphIndex;
        currentParagraphIndex = newIndex;
        highlightParagraph(newIndex, prev);
    }
}

// ============================================
// HIGHLIGHTING + AUTO PAGE TURN
// ============================================

function highlightParagraph(index, prevIndex) {
    // Remove old
    if (prevIndex >= 0) {
        const prevEl = readerText.querySelector(`p[data-idx="${prevIndex}"]`);
        if (prevEl) prevEl.classList.remove('active');
    }

    // Add new
    const el = readerText.querySelector(`p[data-idx="${index}"]`);
    if (!el) return;
    el.classList.add('active');

    // Auto page turn
    if (isPlaying) {
        autoPageTurn(el);
    }
}

// ============================================
// SEEK
// ============================================

function seekTo(value) {
    const dur = audio.duration || 0;
    if (dur > 0) {
        const t = (value / 10000) * dur;
        audio.currentTime = t;
        progressFill.style.width = `${(t / dur) * 100}%`;
        onTimeUpdate();
    }
}

function seekToParagraph(index) {
    if (!metadata || !metadata.paragraphs) return;
    const para = metadata.paragraphs.find(p => p.index === index);
    if (para) {
        audio.currentTime = para.start_time;
        if (!isPlaying) play();
    }
}

// ============================================
// UTILS
// ============================================

function formatTime(s) {
    if (isNaN(s) || !isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
}

// ============================================
// EVENT BINDINGS
// ============================================

function bindEvents() {
    // Play/Pause
    playPauseBtn.addEventListener('click', toggle);

    // Page navigation removed

    // Progress seek
    progressInput.addEventListener('input', (e) => {
        isSeeking = true;
        const val = parseInt(e.target.value);
        const dur = audio.duration || 0;
        if (dur > 0) {
            progressFill.style.width = `${(val / 10000) * 100}%`;
            timeCurrent.textContent = formatTime((val / 10000) * dur);
        }
    });

    progressInput.addEventListener('change', (e) => {
        seekTo(parseInt(e.target.value));
        isSeeking = false;
    });

    progressInput.addEventListener('mouseup', () => {
        if (isSeeking) {
            seekTo(parseInt(progressInput.value));
            isSeeking = false;
        }
    });

    // Speed
    speedSelect.addEventListener('change', (e) => {
        audio.playbackRate = parseFloat(e.target.value);
    });

    // Volume
    volumeInput.addEventListener('input', (e) => {
        audio.volume = e.target.value / 100;
        volumeIcon.textContent = e.target.value == 0 ? '🔇' : e.target.value < 50 ? '🔉' : '🔊';
    });

    // Chapter select
    chapterSelect.addEventListener('change', (e) => {
        loadChapter(parseInt(e.target.value));
    });

    // Prev/Next chapter
    prevChapterBtn.addEventListener('click', () => {
        if (currentChapter > 1) loadChapter(currentChapter - 1);
    });
    nextChapterBtn.addEventListener('click', () => {
        // Future: next chapters
    });

    // Audio ended
    audio.addEventListener('ended', () => pause());

    // Click paragraph to seek
    readerText.addEventListener('click', (e) => {
        const p = e.target.closest('p[data-idx]');
        if (!p) return;
        const idx = parseInt(p.dataset.idx);
        if (!isNaN(idx)) seekToParagraph(idx);
    });

    // Keyboard
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

        switch (e.code) {
            case 'Space':
                e.preventDefault();
                toggle();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                if (e.ctrlKey) {
                    turnPage('prev');
                } else {
                    audio.currentTime = Math.max(0, audio.currentTime - (e.shiftKey ? 30 : 10));
                }
                break;
            case 'ArrowRight':
                e.preventDefault();
                if (e.ctrlKey) {
                    turnPage('next');
                } else {
                    audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + (e.shiftKey ? 30 : 10));
                }
                break;
        }
    });

    // Resize logic removed since vertical scroll adapts natively
}

// ============================================
// BOOT
// ============================================

init();
