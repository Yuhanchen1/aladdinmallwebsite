const dialog=document.querySelector('dialog');document.querySelectorAll('[data-open]').forEach(button=>button.addEventListener('click',()=>{const signIn=button.dataset.open==='signin';document.querySelector('#dialog-title').textContent=signIn?'Sign in to Aladdin Mall':'Open your Aladdin store';dialog.querySelector('label').hidden=signIn;dialog.querySelector('[name=business]').required=!signIn;document.querySelector('#feedback').textContent='';dialog.showModal()}));document.querySelector('.close').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});dialog.querySelector('form').onsubmit=e=>{e.preventDefault();document.querySelector('#feedback').textContent='This preview is not connected to an account service. Contact support@aladdinmall.com to continue.'};

// Reveal only when supported; reduced motion keeps every section immediately visible.
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const revealTargets = document.querySelectorAll('.hero > *, .industries > small, .industries > h2, .industries > p, .industry, .price, .split > div, .features > h2, .feature-grid article, .founder > div, .apps > h2, .app-grid article, .cta > h2, .cta > p, .cta > button');
let revealObserver;
function configureReveals() {
  revealObserver?.disconnect();
  if (motionPreference.matches || !('IntersectionObserver' in window)) {
    revealTargets.forEach(el => el.classList.remove('motion-reveal'));
    return;
  }
  revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {threshold: .08, rootMargin: '0px 0px -24px 0px'});
  revealTargets.forEach(el => {
    const siblings = [...el.parentElement.children];
    el.style.setProperty('--reveal-delay', `${Math.min(siblings.indexOf(el), 4) * 75}ms`);
    el.classList.add('motion-reveal');
    revealObserver.observe(el);
  });
}
configureReveals();
const progress = document.createElement('div');
progress.className = 'scroll-progress';
progress.setAttribute('aria-hidden', 'true');
document.body.append(progress);
const parallaxTargets = document.querySelectorAll('.visual .person, .portrait');
let framePending = false;
function updateScrollMotion() {
  const range = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${range > 0 ? Math.min(1, Math.max(0, scrollY / range)) : 0})`;
  document.querySelector('header').classList.toggle('scrolled', scrollY > 24);
  parallaxTargets.forEach(el => {
    const rect = el.parentElement.getBoundingClientRect();
    const offset = !motionPreference.matches && innerWidth > 650 && rect.bottom > 0 && rect.top < innerHeight
      ? Math.max(-18, Math.min(18, (innerHeight / 2 - (rect.top + rect.height / 2)) * .04)) : 0;
    el.style.setProperty('--parallax', `${offset}px`);
  });
  framePending = false;
}
function queueScrollMotion() {
  if (!framePending) { framePending = true; requestAnimationFrame(updateScrollMotion); }
}
addEventListener('scroll', queueScrollMotion, {passive:true});
addEventListener('resize', queueScrollMotion, {passive:true});
motionPreference.addEventListener('change', () => {configureReveals(); queueScrollMotion();});
queueScrollMotion();

// Industry scenes are directly selectable, with a shared active state.
const sectorNames = ['nail salons', 'wellness studios', 'pet groomers', 'auto services', 'barber shops'];
document.querySelectorAll('[data-sector]').forEach(control => {
  control.addEventListener('click', () => {
    const index = Number(control.dataset.sector);
    document.querySelector('#sector-name').textContent = sectorNames[index];
    document.querySelectorAll('.sector-nav button').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.sector) === index)));
    document.querySelectorAll('.scene').forEach(scene => scene.classList.toggle('active', Number(scene.dataset.sector) === index));
  });
});

// Each scene has its own depth, inertia and scroll velocity.
(() => {
  const hero = document.querySelector('.world-hero');
  if (!hero) return;
  const cards = [...hero.querySelectorAll('.scene')];
  const depths = [1, .65, .8, 1.2, .3];
  const states = cards.map(() => ({x:0,y:0}));
  const entranceDirections = [-1, 1, -1, 1, -1];
  let pointer = {x:0,y:0}, frame = 0, last = 0, start = performance.now(), visible = true;
  const fine = matchMedia('(hover:hover) and (pointer:fine)');
  function reset() {
    cancelAnimationFrame(frame); frame = 0;
    cards.forEach(card => ['--scene-x','--scene-y','--scene-rx','--scene-ry','--scene-enter-opacity','--scene-enter-scale'].forEach(key => card.style.removeProperty(key)));
  }
  function tick(now) {
    frame = 0;
    if (motionPreference.matches || document.hidden || !visible) return;
    const dt = Math.min(40, now - (last || now)); last = now;
    const rect = hero.getBoundingClientRect();
    const mobile = innerWidth <= 650;
    const scroll = Math.max(0, -rect.top);
    const elapsed = now - start;
    cards.forEach((card, i) => {
      const depth = depths[i], phase = i * 1.73;
      const progress = Math.max(0, Math.min(1, (elapsed - i * 110) / 1400));
      const remaining = Math.pow(1 - progress, 4);
      const drift = Math.sin(now / (4200 + i * 360) + phase);
      const targetX = pointer.x * 12 * depth + remaining * entranceDirections[i] * (mobile ? 65 : 180);
      // More than 1px per scroll pixel offsets normal document movement,
      // so the cards travel DOWN the viewport as the user scrolls down.
      const targetY = pointer.y * 8 * depth + scroll * (1.18 + depth * .32) - remaining * (mobile ? 50 : 120);
      card.style.setProperty('--scene-enter-opacity', String(progress));
      card.style.setProperty('--scene-enter-scale', String(1 - remaining * .16));
      const blend = 1 - Math.exp(-dt / (150 + i * 35));
      states[i].x += (targetX - states[i].x) * blend;
      states[i].y += (targetY - states[i].y) * blend;
      card.style.setProperty('--scene-x', `${states[i].x}px`);
      card.style.setProperty('--scene-y', `${states[i].y}px`);
      card.style.setProperty('--scene-rx', `${mobile ? 0 : -pointer.y * 6 * depth}deg`);
      card.style.setProperty('--scene-ry', `${mobile ? 0 : pointer.x * 10 * depth + drift * 1.2}deg`);
    });
    const settling = states.some((state, i) => Math.abs(state.y - scroll * (1.18 + depths[i] * .32)) > .2);
    if (!mobile || elapsed < 2200 || settling) frame = requestAnimationFrame(tick);
  }
  function wake() {if (!frame && visible && !motionPreference.matches && !document.hidden) {last = 0; frame = requestAnimationFrame(tick);}}
  hero.addEventListener('pointermove', e => {
    if (!fine.matches || e.pointerType !== 'mouse') return;
    const rect = hero.getBoundingClientRect();
    pointer = {x:(e.clientX - rect.left) / rect.width * 2 - 1,y:(e.clientY - rect.top) / rect.height * 2 - 1}; wake();
  }, {passive:true});
  hero.addEventListener('pointerleave', () => {pointer = {x:0,y:0};wake();});
  addEventListener('scroll', wake, {passive:true});
  addEventListener('resize', wake, {passive:true});
  document.addEventListener('visibilitychange', () => document.hidden ? reset() : wake());
  motionPreference.addEventListener('change', () => motionPreference.matches ? reset() : wake());
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {visible = entries[0].isIntersecting;visible ? wake() : reset();}).observe(hero);
  wake();
})();
