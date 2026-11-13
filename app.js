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
const sectorNames = ['nail salons', 'wellness studios', 'pet groomers', 'auto services', 'barber shops', 'hair salons', 'massage studios', 'tattoo and piercing studios', 'fitness and recovery studios'];
document.querySelectorAll('[data-sector]').forEach(control => {
  control.addEventListener('click', () => {
    const index = Number(control.dataset.sector);
    const sectorName = document.querySelector('#sector-name');
    if (sectorName) sectorName.textContent = sectorNames[index];
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
  const rawProgress = clamp(((mobile ? 80 : 88) - shell.getBoundingClientRect().top) / Math.max(1,travel));
  // Let visitors read while the scene changes depth before the copy exits.
  const holdEnd = mobile ? .24 : .3;
  const progress = clamp((rawProgress-holdEnd)/(1-holdEnd));
  const depthPhase = Math.sin(Math.PI*clamp(rawProgress/holdEnd));
  const depthRelease = 1-clamp(progress/.3);
  const t = progress * progress * (3 - 2 * progress);
  const width = mobile ? 138 : Math.max(150,Math.min(190,(hero.clientWidth-100)/cards.length-16));
  const height = width * 1.3, gap = mobile ? 14 : 20;
  const rowWidth = cards.length * width + (cards.length-1) * gap;
  const left = Math.max(20,(hero.clientWidth-rowWidth)/2);
  const top = Math.max(100,(hero.clientHeight-height)/2);
  cards.forEach((card,i) => {
   const elapsed = clamp((now-start-i*100)/1300);
   // Five opening scenes; the remaining cards pass through central waypoints.
   const revealStart = .06 + Math.max(0,i-5)*.075;
   const reveal = i < 5 ? 1 : clamp((progress-revealStart)/.16);
   const revealEase = reveal*reveal*(3-2*reveal);
   const entry = reduced.matches ? 0 : Math.pow(1-elapsed,4)*(1-t);
   const ease = v => {v=clamp(v);return v*v*v*(v*(v*6-15)+10);};
   const spread = ease(progress/.5);
   const gather = ease((progress-.58)/.42);
   // Alternating lanes preserve left-to-right order throughout the transition.
   const midWidth = Math.min(mobile ? 70 : 165,hero.clientWidth/6);
   const midHeight = midWidth*1.3;
   const cardWidth = (card._w+(midWidth-card._w)*spread)*(1-gather)+width*gather;
   const cardHeight = (card._h+(midHeight-card._h)*spread)*(1-gather)+height*gather;
   card.style.width = cardWidth+'px';card.style.height=cardHeight+'px';
   const baseX = card.offsetLeft, baseY = card.offsetTop;
   const laneX = hero.clientWidth*(.07+i*.1075)-cardWidth/2;
   const laneY = hero.clientHeight*(i%2===0 ? .29 : .65)-cardHeight/2;
   const midX = baseX+(laneX-baseX)*spread;
   const midY = baseY+(laneY-baseY)*spread;
   const targetX = left+i*(width+gap);
   const moveX = midX+(targetX-midX)*gather-baseX+entry*(i%2 ? 100 : -100);
   const moveY = midY+(top-midY)*gather-baseY-entry*65+(1-revealEase)*60;
   card.style.setProperty('--scene-x',moveX+'px');
   card.style.setProperty('--scene-y',moveY+'px');
   const depths = [95,-110,65,-75,-160,60,-85,75,-55];
   const z = reduced.matches ? 0 : depths[i]*depthPhase*depthRelease;
   card.style.setProperty('--scene-z',z+'px');
   card.style.setProperty('--scene-rx',(reduced.matches ? 0 : -depthPhase*depthRelease*(i%2 ? 3 : -2))+'deg');
   card.style.setProperty('--scene-ry',(reduced.matches ? 0 : depthPhase*depthRelease*(i%2 ? -5 : 4))+'deg');
   card.style.setProperty('--row-turn',String(.7*spread+.3*gather));
   card.style.setProperty('--scene-enter-opacity',String((reduced.matches ? 1 : elapsed)*revealEase));
   card.style.setProperty('--scene-enter-scale','1');
   card.style.visibility = reveal > 0 ? 'visible' : 'hidden';
   card.style.pointerEvents = reveal > .8 ? '' : 'none';
   card.tabIndex = reveal > .8 ? 0 : -1;
  });
  galleryCopy.style.opacity = String(clamp((progress-.7)/.25));
  galleryCopy.style.transform = `translateY(${(1-clamp((progress-.7)/.25))*18}px)`;
  galleryCopy.style.visibility = progress > .7 ? 'visible' : 'hidden';
  const copyExitRaw = clamp((progress-.06)/.64);
  const copyExit = copyExitRaw*copyExitRaw*(3-2*copyExitRaw);
  copy.style.transform = `translateY(${reduced.matches ? 0 : -copyExit * (hero.clientHeight + copy.offsetHeight)}px)`;
  copy.style.opacity = '1';
  const sectorNav = hero.querySelector('.sector-nav');
  sectorNav.style.transform = `translateY(${reduced.matches ? 0 : -copyExit * (hero.clientHeight + 120)}px)`;
  copy.style.visibility = progress >= .7 ? 'hidden' : 'visible';
  hero.querySelector('.sector-nav').style.opacity = '1';
  hero.querySelector('.sector-nav').style.visibility = progress >= .7 ? 'hidden' : 'visible';
  hero.classList.toggle('row-ready',progress>.95);
  hero.style.overflowX = progress>.95 ? 'auto' : 'clip';
  hero.querySelector('.scroll-cue').style.pointerEvents = progress>.95 ? 'none' : '';
  if(now-start<1400+cards.length*100) frame=requestAnimationFrame(draw);
 }
 function measure(){
  cards.forEach(card=>{card.style.width='';card.style.height='';card._w=card.offsetWidth;card._h=card.offsetHeight;});queue();
 }
 function queue(){if(!frame)frame=requestAnimationFrame(draw);}
 addEventListener('scroll',queue,{passive:true});addEventListener('resize',measure,{passive:true});
 reduced.addEventListener('change',queue);measure();
})();
