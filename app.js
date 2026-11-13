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

// Scroll choreography: scattered scenes converge into a usable preview row.
(() => {
 const hero = document.querySelector('.world-hero');
 if (!hero) return;
 const shell = hero.parentElement, stage = hero.querySelector('.scene-stage');
 const cards = [...hero.querySelectorAll('.scene')];
 const copy = hero.querySelector('.hero-copy');
 const galleryCopy = hero.querySelector('.gallery-copy');
 const reduced = motionPreference;
 let frame = 0, start = performance.now();
 const clamp = v => Math.max(0,Math.min(1,v));
 function draw(now) {
  frame = 0;
  const mobile = innerWidth <= 650;
  const travel = shell.offsetHeight - hero.offsetHeight;
  const progress = clamp((88 - shell.getBoundingClientRect().top) / Math.max(1,travel));
  const t = progress * progress * (3 - 2 * progress);
  const width = mobile ? 138 : Math.min(210,(hero.clientWidth-120)/5-20);
  const height = width * 1.3, gap = mobile ? 14 : 20;
  const rowWidth = 5 * width + 4 * gap;
  const left = mobile ? 20 : (hero.clientWidth-rowWidth)/2;
  const top = Math.max(100,(hero.clientHeight-height)/2);
  cards.forEach((card,i) => {
   const elapsed = clamp((now-start-i*100)/1300);
   const entry = reduced.matches ? 0 : Math.pow(1-elapsed,4)*(1-t);
   const x = left+i*(width+gap)-card.offsetLeft;
   const y = top-card.offsetTop;
   card.style.setProperty('--scene-x',`${x*t + entry*(i%2 ? 130 : -130)}px`);
   card.style.setProperty('--scene-y',`${y*t-entry*80}px`);
   card.style.setProperty('--scene-rx','0deg');card.style.setProperty('--scene-ry',`${(1-t)*entry*15}deg`);
   card.style.setProperty('--row-turn',`${t}`);
   card.style.setProperty('--scene-enter-opacity',String(reduced.matches ? 1 : elapsed));
   card.style.setProperty('--scene-enter-scale','1');
   card.style.width = `${card._w+(width-card._w)*t}px`;
   card.style.height = `${card._h+(height-card._h)*t}px`;
  });
  galleryCopy.style.opacity = String(clamp((progress-.45)/.35));
  galleryCopy.style.transform = `translateY(${(1-clamp((progress-.45)/.35))*18}px)`;
  galleryCopy.style.visibility = progress > .45 ? 'visible' : 'hidden';
  copy.style.opacity = String(1-clamp(progress*2.5));
  copy.style.visibility = progress > .45 ? 'hidden' : 'visible';
  hero.querySelector('.sector-nav').style.opacity = String(1-t);
  hero.querySelector('.sector-nav').style.visibility = progress > .8 ? 'hidden' : 'visible';
  hero.classList.toggle('row-ready',progress>.95);
  stage.style.overflowX = mobile && progress>.95 ? 'auto' : 'visible';
  if(now-start<1900) frame=requestAnimationFrame(draw);
 }
 function measure(){
  cards.forEach(card=>{card.style.width='';card.style.height='';card._w=card.offsetWidth;card._h=card.offsetHeight;});queue();
 }
 function queue(){if(!frame)frame=requestAnimationFrame(draw);}
 addEventListener('scroll',queue,{passive:true});addEventListener('resize',measure,{passive:true});
 reduced.addEventListener('change',queue);measure();
})();
