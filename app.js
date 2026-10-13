(() => {
  'use strict';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const body = document.body;
  const qs = (selector, scope = document) => scope.querySelector(selector);
  const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  // The content remains visible and usable even if this script is unavailable.
  if (!reduceMotion.matches && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('js-motion');
    qsa('.position-cards, .benefits-grid, .media-grid').forEach(group => {
      qsa('.reveal', group).forEach((element, index) => element.style.setProperty('--delay', `${index * 85}ms`));
    });
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        const counter = qs('[data-count]', entry.target);
        if (counter) animateCount(counter);
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: .12, rootMargin: '0px 0px -20px 0px' });
    qsa('.reveal').forEach(element => revealObserver.observe(element));
    reduceMotion.addEventListener('change', event => {
      if (event.matches) {
        document.documentElement.classList.remove('js-motion');
        revealObserver.disconnect();
        qsa('[data-count]').forEach(element => element.textContent = element.dataset.count);
      }
    });
  }
  function animateCount(element) {
    const value = Number(element.dataset.count);
    const start = performance.now();
    const tick = now => {
      if (reduceMotion.matches) { element.textContent = value; return; }
      const progress = Math.min((now - start) / 1050, 1);
      element.textContent = Math.round(value * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  const progressBar = qs('.scroll-progress');
  let scrollPending = false;
  const updateProgress = () => {
    const available = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.transform = `scaleX(${available > 0 ? window.scrollY / available : 0})`;
    scrollPending = false;
  };
  window.addEventListener('scroll', () => {
    if (!scrollPending) { scrollPending = true; requestAnimationFrame(updateProgress); }
  }, { passive: true });
  window.addEventListener('resize', updateProgress);
  updateProgress();

  const menuButton = qs('.menu-toggle');
  const mobileNav = qs('#mobile-nav');
  function closeMenu() {
    mobileNav.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Мәзірді ашу');
  }
  menuButton.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    mobileNav.hidden = isOpen;
    menuButton.setAttribute('aria-expanded', String(!isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'Мәзірді ашу' : 'Мәзірді жабу');
  });
  qsa('a', mobileNav).forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  window.matchMedia('(min-width: 961px)').addEventListener('change', event => { if (event.matches) closeMenu(); });
  if ('IntersectionObserver' in window) {
    const navigationObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        qsa('.desktop-nav a').forEach(link => link.classList.toggle('active', link.hash === `#${entry.target.id}`));
      });
    }, { rootMargin: '-12% 0px -65% 0px', threshold: 0 });
    qsa('#murasy, #asyq, #erezhe, #materialdar').forEach(element => navigationObserver.observe(element));
  }

  const positions = {
    alshy: { name: 'Алшы', description: 'Асық қырынан тұрып, ойықтау қыры жоғары қараған қалып. Алшы ойынында бұл қалыпқа ерекше мән беріледі: ойын кезегін анықтауға қатысады.', color: '#e5ebdf' },
    taike: { name: 'Тәйке', description: 'Алшыға қарама-қарсы қырымен тұрған қалып. Бұл кезде тегістеу қыры жоғары қарайды. Алшы мен тәйкені ажырату үшін асықтың қай қыры жерге тірелгенін салыстыр.', color: '#efdfcf' },
    buk: { name: 'Бүк', description: 'Асықтың дөңес, жұмыр жағы жоғары қарап жатқан қалып. Асықты бүйірінен қарағанда үстіңгі беті сыртқа қарай томпайып көрінеді.', color: '#e5e8ef' },
    shik: { name: 'Шік', description: 'Асықтың ойыс, қуыс жағы жоғары қарап жатқан қалып. Бүк пен шікті ажыратудың қарапайым тәсілі: жоғарыдағы бет дөңес пе, әлде ойыс па?', color: '#e9e3ef' }
  };
  const tabs = qsa('[data-position]');
  const positionPanel = qs('#position-detail');
  function selectPosition(tab, focus = false) {
    const entry = positions[tab.dataset.position];
    tabs.forEach(button => {
      const selected = button === tab;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    positionPanel.setAttribute('aria-labelledby', tab.id);
    qs('.detail-word', positionPanel).textContent = entry.name;
    const description = qs('#position-description');
    description.textContent = entry.description;
    positionPanel.style.backgroundColor = entry.color;
    description.classList.remove('position-description-enter');
    requestAnimationFrame(() => description.classList.add('position-description-enter'));
    if (focus) tab.focus();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectPosition(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); selectPosition(tabs[next], true); }
    });
  });

  const dialogs = { photos: qs('#photos-dialog'), video: qs('#video-dialog'), report: qs('#report-dialog') };
  const video = qs('#project-video');
  let opener = null;
  function openDialog(type, button) {
    const dialog = dialogs[type];
    if (!dialog) return;
    closeMenu();
    opener = button;
    dialog.showModal();
    body.classList.add('modal-open');
    if (type === 'video') video.preload = 'metadata';
    qs('[data-close]', dialog).focus({ preventScroll: true });
  }
  qsa('[data-open]').forEach(button => button.addEventListener('click', () => openDialog(button.dataset.open, button)));
  Object.values(dialogs).forEach(dialog => {
    qs('[data-close]', dialog).addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rectangle = dialog.getBoundingClientRect();
      if (event.clientX < rectangle.left || event.clientX > rectangle.right || event.clientY < rectangle.top || event.clientY > rectangle.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {
      body.classList.remove('modal-open');
      if (dialog === dialogs.video) video.pause();
      opener?.focus({ preventScroll: true });
    });
  });

  const photos = [
    { file: 'assets/research-1.webp', caption: 'Асық ойыны туралы сауалнаманы таныстыру', alt: 'Оқушы сыныпта асық ойыны туралы сауалнама парағын көрсетіп тұр' },
    { file: 'assets/research-2.webp', caption: 'Сыныптастармен жоба туралы пікір алмасу', alt: 'Екі оқушы сыныпта асық ойыны туралы сауалнаманы бірге талқылап жатыр' },
    { file: 'assets/research-3.webp', caption: 'Ұлттық ойынға қызығушылықты зерттеу', alt: 'Оқушы сыныптастарына асық ату туралы сауалнама парағын ұсынып тұр' },
    { file: 'assets/research-4.webp', caption: 'Сауалнама сұрақтарымен танысу', alt: 'Оқушылар парта жанында асық ату туралы сауалнама сұрақтарымен танысып жатыр' }
  ];
  let photoIndex = 0;
  let galleryTimeout;
  const galleryImage = qs('#gallery-image');
  function updatePhoto(index) {
    photoIndex = (index + photos.length) % photos.length;
    const photo = photos[photoIndex];
    clearTimeout(galleryTimeout);
    const apply = () => {
      galleryImage.src = photo.file;
      galleryImage.alt = photo.alt;
      qs('#gallery-caption').textContent = photo.caption;
      qs('#gallery-counter').textContent = `${String(photoIndex + 1).padStart(2, '0')} / 04`;
      qsa('[data-photo]').forEach(button => {
        const active = Number(button.dataset.photo) === photoIndex;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
      });
      galleryImage.classList.remove('changing');
    };
    if (reduceMotion.matches) apply();
    else { galleryImage.classList.add('changing'); galleryTimeout = setTimeout(apply, 140); }
  }
  qsa('[data-gallery]').forEach(button => button.addEventListener('click', () => updatePhoto(photoIndex + (button.dataset.gallery === 'next' ? 1 : -1))));
  qsa('[data-photo]').forEach(button => button.addEventListener('click', () => updatePhoto(Number(button.dataset.photo))));
  dialogs.photos.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      updatePhoto(photoIndex + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  let touchStart = null;
  const galleryStage = qs('.gallery-stage');
  galleryStage.addEventListener('touchstart', event => { touchStart = event.touches[0].clientX; }, { passive: true });
  galleryStage.addEventListener('touchend', event => {
    if (touchStart === null) return;
    const difference = event.changedTouches[0].clientX - touchStart;
    if (Math.abs(difference) > 45) updatePhoto(photoIndex + (difference < 0 ? 1 : -1));
    touchStart = null;
  }, { passive: true });
})();
