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
  const holdEnd = mobile ? .34 : .4;
  const progress = clamp((rawProgress-holdEnd)/(1-holdEnd));
  const depthPhase = Math.sin(Math.PI*clamp(rawProgress/holdEnd));
  const depthRelease = 1-clamp(progress/.3);
  const t = progress * progress * (3 - 2 * progress);
  const width = mobile ? 180 : Math.min(260,Math.max(220,hero.clientWidth*.15));
  const height = width * 1.3, gap = mobile ? 18 : 24;
  const rowWidth = cards.length * width + (cards.length-1) * gap;
  const left = Math.max(20,(hero.clientWidth-rowWidth)/2);
  // Anchor the final row to its introduction instead of viewport center.
  const galleryGap = mobile ? 48 : 72;
  const groupHeight = galleryCopy.offsetHeight + galleryGap + height;
  const groupTop = Math.max(28,(hero.clientHeight-groupHeight)/2);
  galleryCopy.style.top = groupTop+'px';
  const top = groupTop + galleryCopy.offsetHeight + galleryGap;
  cards.forEach((card,i) => {
   const elapsed = clamp((now-start-i*100)/1300);
   const ease = v => {v=clamp(v);return v*v*v*(v*(v*6-15)+10);};
   const firstOut = ease((rawProgress-.04)/.16);
   const secondIn = ease((rawProgress-.12)/.18);
   const galleryReturn = ease((progress-.08)/.25);
   const visibility = i < 5 ? 1-firstOut+firstOut*galleryReturn : secondIn;
   const batchScale = reduced.matches ? 1 : .65+.35*visibility;
   const batchOpacity = visibility*visibility*(3-2*visibility);
   const spread = ease(progress/.4);
   const gather = ease((progress-.4)/.32);
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
   const moveX = midX+(targetX-midX)*gather-baseX;
   let moveY = midY+(top-midY)*gather-baseY;
   // Reserve a clear rectangle around the exiting CTA and benefit list.
   const exitP = clamp((progress-.06)/.64);
   const exitEase = exitP*exitP*(3-2*exitP);
   const copyBottom = copy.offsetTop+copy.offsetHeight-(reduced.matches ? 0 : exitEase*(hero.clientHeight+copy.offsetHeight));
   const copyLeft = copy.offsetLeft, copyRight = copyLeft+copy.offsetWidth;
   const cardLeft = baseX+moveX, cardRight = cardLeft+cardWidth;
   const horizontalDistance = Math.max(copyLeft-cardRight,cardLeft-copyRight);
   const clearanceWeight = ease((64-horizontalDistance)/64);
   if(copyBottom > 0 && progress < .7) {
    const safeY = copyBottom+28;
    const cardTop = baseY+moveY;
    const cardBottom = cardTop+cardHeight;
    const copyTop = copyBottom-copy.offsetHeight;
    if(cardBottom > copyTop-24) moveY += Math.max(0,safeY-cardTop)*clearanceWeight;
   }
   card.style.setProperty('--scene-x',moveX+'px');
   card.style.setProperty('--scene-y',moveY+'px');
   card.style.filter = 'none';
   card.style.zIndex = i%2 ? '4' : '1';
   card.style.setProperty('--scene-z','0px');
   card.style.setProperty('--scene-rx','0deg');
   card.style.setProperty('--scene-ry','0deg');
   card.style.setProperty('--row-turn',String(.7*spread+.3*gather));
   card.style.setProperty('--batch-opacity',String(batchOpacity));
   card.style.opacity = String(batchOpacity);
   card.style.setProperty('--batch-scale',String(batchScale));
   card.style.visibility = visibility > .005 ? 'visible' : 'hidden';
   card.style.pointerEvents = visibility > .8 ? '' : 'none';
   card.tabIndex = visibility > .8 ? 0 : -1;
  });
  galleryCopy.style.opacity = String(clamp((progress-.58)/.14));
  galleryCopy.style.transform = `translateY(${(1-clamp((progress-.7)/.25))*18}px)`;
  galleryCopy.style.visibility = progress > .58 ? 'visible' : 'hidden';
  const copyExitRaw = clamp((progress-.06)/.64);
  const copyExit = copyExitRaw*copyExitRaw*(3-2*copyExitRaw);
  copy.style.transform = `translateY(${reduced.matches ? 0 : -copyExit * (hero.clientHeight + copy.offsetHeight)}px)`;
  copy.style.opacity = '1';
  const sectorNav = hero.querySelector('.sector-nav');
  sectorNav.style.transform = `translateY(${reduced.matches ? 0 : -copyExit * (hero.clientHeight + 120)}px)`;
  copy.style.visibility = progress >= .7 ? 'hidden' : 'visible';
  hero.querySelector('.sector-nav').style.opacity = '1';
  hero.querySelector('.sector-nav').style.visibility = progress >= .7 ? 'hidden' : 'visible';
  hero.classList.toggle('row-ready',progress>.74);
  hero.style.overflowX = 'clip';
  stage.tabIndex = progress>.74 ? 0 : -1;
  stage.setAttribute('role','region');
  stage.setAttribute('aria-label','Industry cards, scroll horizontally to explore');
  if(progress<=.74) stage.scrollLeft=0;
  hero.querySelector('.scroll-cue').style.pointerEvents = progress>.74 ? 'none' : '';
  if(now-start<1400+cards.length*100) frame=requestAnimationFrame(draw);
 }
 function measure(){
  cards.forEach(card=>{card.style.width='';card.style.height='';card._w=card.offsetWidth;card._h=card.offsetHeight;});queue();
 }
 function queue(){if(!frame)frame=requestAnimationFrame(draw);}
 addEventListener('scroll',queue,{passive:true});addEventListener('resize',measure,{passive:true});
 reduced.addEventListener('change',queue);measure();
})();
