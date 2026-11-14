// Page behaviour. Everything here is progressive enhancement: the page reads
// fine with JavaScript off, it just does not move.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Navigation ---------- */

const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('is-stuck', window.scrollY > 24);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- Copy buttons ---------- */

async function copy(text, done) {
  try {
    await navigator.clipboard.writeText(text);
    done(true);
  } catch {
    done(false);
  }
}

for (const button of document.querySelectorAll('[data-copy]')) {
  const hint = button.querySelector('.command-hint');
  button.addEventListener('click', () =>
    copy(button.dataset.copy, (ok) => {
      button.classList.toggle('is-copied', ok);
      hint.textContent = ok ? 'Copied' : 'Select and copy';
      setTimeout(() => {
        button.classList.remove('is-copied');
        hint.textContent = 'Copy';
      }, 2000);
    }),
  );
}

for (const button of document.querySelectorAll('[data-copy-from]')) {
  button.addEventListener('click', () =>
    copy(document.querySelector(button.dataset.copyFrom).textContent, (ok) => {
      button.textContent = ok ? 'Copied' : 'Blocked';
      setTimeout(() => (button.textContent = 'Copy'), 2000);
    }),
  );
}

/* ---------- Scroll reveal ---------- */

const revealer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-visible');
      revealer.unobserve(entry.target);
    }
  },
  { rootMargin: '0px 0px -8% 0px' },
);
document.querySelectorAll('.reveal').forEach((element, i) => {
  // Siblings arrive one after another instead of all at once.
  element.style.transitionDelay = `${(i % 4) * 70}ms`;
  revealer.observe(element);
});

/* ---------- Counters ---------- */

const format = new Intl.NumberFormat('en-US');
const counters = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    counters.unobserve(entry.target);
    const element = entry.target;
    const target = Number(element.dataset.count);
    const prefix = element.dataset.prefix ?? '';
    if (reducedMotion) continue;
    const started = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - started) / 1100);
      const eased = 1 - Math.pow(1 - t, 3);
      element.textContent = prefix + format.format(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
});
document.querySelectorAll('[data-count]').forEach((element) => counters.observe(element));

/* ---------- Time travel scrubber (real screenshots) ---------- */

const travel = document.getElementById('travel');
const travelRange = document.getElementById('travel-range');
if (travel && travelRange) {
  const frames = [...travel.querySelectorAll('img')];
  const render = () => {
    // 0..200 maps onto the two gaps between three frames; neighbours crossfade.
    const position = (Number(travelRange.value) / 200) * (frames.length - 1);
    frames.forEach((frame, i) => {
      frame.style.opacity = String(Math.max(0, 1 - Math.abs(position - i)));
    });
  };
  travelRange.addEventListener('input', render);
  render();

  // Nudge the slider once when it scrolls into view, to show it is draggable.
  if (!reducedMotion) {
    const hint = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        hint.disconnect();
        const started = performance.now();
        const sweep = (now) => {
          if (travelRange.matches(':active')) return;
          const t = Math.min(1, (now - started) / 2600);
          travelRange.value = String(Math.round(200 * (1 - Math.pow(1 - t, 3))));
          render();
          if (t < 1) requestAnimationFrame(sweep);
        };
        requestAnimationFrame(sweep);
      },
      { threshold: 0.6 },
    );
    hint.observe(travel);
  }
}

/* ---------- Colour lenses ---------- */

const LENS_NOTES = {
  heat: 'Where the work and the bugs are right now.',
  complexity: 'Where the branching logic lives, whatever its age.',
  language: 'What the repository is made of.',
};
const lensTabs = [...document.querySelectorAll('.tabs [data-lens]')];
const lensImages = [...document.querySelectorAll('#lens [data-lens]')];
const lensNote = document.getElementById('lens-note');
for (const tab of lensTabs) {
  tab.addEventListener('click', () => {
    const lens = tab.dataset.lens;
    lensTabs.forEach((other) => other.setAttribute('aria-selected', String(other === tab)));
    lensImages.forEach((image) => image.classList.toggle('is-on', image.dataset.lens === lens));
    lensNote.textContent = LENS_NOTES[lens];
  });
}

/* ---------- Hero city ---------- */

const canvas = document.getElementById('hero-canvas');
const heroRange = document.getElementById('hero-range');
const heroPlay = document.getElementById('hero-play');
const heroIcon = document.getElementById('hero-play-icon');
const PAUSE = 'M3 2h3.5v12H3zM9.5 2H13v12H9.5z';
const PLAY = 'M4 2.5v11a.5.5 0 0 0 .76.43l9-5.5a.5.5 0 0 0 0-.86l-9-5.5A.5.5 0 0 0 4 2.5Z';

// three.js is only fetched when WebGL exists; otherwise the hero is just dark.
import('./hero.js')
  .then(({ mountHero }) => {
    const hero = mountHero(canvas, { reducedMotion });
    const sync = () => {
      const playing = hero.isPlaying();
      heroIcon.setAttribute('d', playing ? PAUSE : PLAY);
      heroPlay.setAttribute('aria-label', playing ? 'Pause the demo' : 'Play the demo');
    };
    hero.onTime = (time) => (heroRange.value = String(Math.round(time * 1000)));
    heroRange.addEventListener('input', () => {
      hero.setPlaying(false);
      hero.setTime(Number(heroRange.value) / 1000);
      sync();
    });
    heroPlay.addEventListener('click', () => {
      hero.setPlaying(!hero.isPlaying());
      sync();
    });
    if (reducedMotion) heroRange.value = '1000';
    sync();
  })
  .catch(() => {
    document.querySelector('.hero-timeline').hidden = true;
  });
