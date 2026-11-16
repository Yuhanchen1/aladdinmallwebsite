// Mobile signup stays available after the first viewport.
const mobileSignup = document.createElement("div");
mobileSignup.className = "mobile-signup";
const mobileSignupButton = document.querySelector('header [data-open="signup"]').cloneNode(true);
mobileSignup.append(mobileSignupButton);
document.body.append(mobileSignup);
function syncMobileSignup() {
  const visible = matchMedia("(max-width: 650px)").matches && scrollY >= innerHeight * 0.85;
  mobileSignup.classList.toggle("is-visible", visible);
  mobileSignup.inert = !visible;
}
addEventListener("scroll", syncMobileSignup, { passive: true });
addEventListener("resize", syncMobileSignup);
syncMobileSignup();

const dialog = document.querySelector("dialog");
document.querySelectorAll("[data-open]").forEach((button) =>
  button.addEventListener("click", () => {
    const signIn = button.dataset.open === "signin";
    document.querySelector("#dialog-title").textContent = signIn
      ? "Sign in to Aladdin Mall"
      : "Open your Aladdin store";
    dialog.querySelector("label").hidden = signIn;
    dialog.querySelector("[name=business]").required = !signIn;
    document.querySelector("#feedback").textContent = "";
    dialog.showModal();
  }),
);
document.querySelector(".close").onclick = () => dialog.close();
dialog.addEventListener("click", (e) => {
  if (e.target === dialog) dialog.close();
});
dialog.querySelector("form").onsubmit = (e) => {
  e.preventDefault();
  document.querySelector("#feedback").textContent =
    "This preview is not connected to an account service. Contact support@aladdinmall.com to continue.";
};

// Reveal only when supported; reduced motion keeps every section immediately visible.
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const revealTargets = document.querySelectorAll(
  ".hero > *, .price, .split > div, .apps > h2, .app-grid article, .cta > h2, .cta > p, .cta > button",
);
let revealObserver;
function configureReveals() {
  revealObserver?.disconnect();
  if (
    window.gsap ||
    motionPreference.matches ||
    !("IntersectionObserver" in window)
  ) {
    revealTargets.forEach((el) => el.classList.remove("motion-reveal"));
    return;
  }
  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -24px 0px" },
  );
  revealTargets.forEach((el) => {
    const siblings = [...el.parentElement.children];
    el.style.setProperty(
      "--reveal-delay",
      `${Math.min(siblings.indexOf(el), 4) * 75}ms`,
    );
    el.classList.add("motion-reveal");
    revealObserver.observe(el);
  });
}
configureReveals();
const progress = document.createElement("div");
progress.className = "scroll-progress";
progress.setAttribute("aria-hidden", "true");
document.body.append(progress);
let framePending = false;
function updateScrollMotion() {
  const range = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${range > 0 ? Math.min(1, Math.max(0, scrollY / range)) : 0})`;
  document.querySelector("header").classList.toggle("scrolled", scrollY > 24);
  framePending = false;
}
function queueScrollMotion() {
  if (!framePending) {
    framePending = true;
    requestAnimationFrame(updateScrollMotion);
  }
}
addEventListener("scroll", queueScrollMotion, { passive: true });
addEventListener("resize", queueScrollMotion, { passive: true });
motionPreference.addEventListener("change", () => {
  configureReveals();
  queueScrollMotion();
});
queueScrollMotion();

// Industry scenes are directly selectable, with a shared active state.
document.querySelectorAll("[data-sector]").forEach((control) => {
  control.addEventListener("click", () => {
    const index = Number(control.dataset.sector);
    document
      .querySelectorAll(".sector-nav button")
      .forEach((button) =>
        button.setAttribute(
          "aria-pressed",
          String(Number(button.dataset.sector) === index),
        ),
      );
    document
      .querySelectorAll(".scene")
      .forEach((scene) =>
        scene.classList.toggle(
          "active",
          Number(scene.dataset.sector) === index,
        ),
      );
  });
});

// Scroll choreography: scattered scenes converge into a usable preview row.
(() => {
  const hero = document.querySelector(".world-hero");
  if (!hero) return;
  const shell = hero.parentElement,
    stage = hero.querySelector(".scene-stage");
  const cards = [...hero.querySelectorAll(".scene")];
  const copy = hero.querySelector(".hero-copy");
  const galleryCopy = hero.querySelector(".gallery-copy");
  // Mobile uses a separate, directly scrollable gallery instead of a pinned assembly.
  const mobileGallery = document.createElement("section");
  mobileGallery.className = "mobile-industry-gallery";
  mobileGallery.setAttribute("aria-label", "Industries we serve");
  const mobileCopy = galleryCopy.cloneNode(true);
  mobileCopy.className = "mobile-industry-copy";
  const mobileTrack = document.createElement("div");
  mobileTrack.className = "mobile-industry-track";
  mobileTrack.tabIndex = 0;
  mobileTrack.setAttribute("role", "region");
  mobileTrack.setAttribute("aria-label", "Industry cards, swipe to explore");
  cards.forEach((card) => {
    const item = document.createElement("div");
    item.className = "mobile-industry-card";
    item.append(card.querySelector("img").cloneNode(true), card.querySelector("span").cloneNode(true));
    mobileTrack.append(item);
  });
  mobileGallery.append(mobileCopy, mobileTrack);
  shell.after(mobileGallery);
  const reduced = motionPreference;
  let frame = 0,
    start = performance.now(),
    previousFrame = 0;
  const verticalPositions = new Map();
  const clamp = (v) => Math.max(0, Math.min(1, v));
  function draw(now) {
    frame = 0;
    const dt = Math.min(40, Math.max(1, now - (previousFrame || now - 16)));
    previousFrame = now;
    let settling = false;
    const mobile = innerWidth <= 1100;
    const travel =
      Number(shell.dataset.assemblyTravel) ||
      shell.offsetHeight - hero.offsetHeight;
    const scrollDistance =
      (mobile ? 80 : 70) - shell.getBoundingClientRect().top;
    const rawProgress = mobile ? 0 : clamp(scrollDistance / Math.max(1, travel));
    const progress = clamp((rawProgress - 0.02) / 0.68);
    const width = mobile
      ? 180
      : Math.min(260, Math.max(220, hero.clientWidth * 0.15));
    const height = width * 1.3,
      gap = mobile ? 18 : 24;
    const rowWidth = cards.length * width + (cards.length - 1) * gap;
    const frameP = clamp(progress / 0.65);
    const frameEase = frameP * frameP * (3 - 2 * frameP);
    const stageWidth =
      hero.clientWidth +
      (Math.min(hero.clientWidth, 1440) - hero.clientWidth) * frameEase;
    stage.style.width = stageWidth + "px";
    stage.style.setProperty(
      "--gallery-edge-fade",
      (mobile ? 28 : 56) * frameEase + "px",
    );
    stage.style.left = (hero.clientWidth - stageWidth) / 2 + "px";
    const left = Math.max(20, (stageWidth - rowWidth) / 2);
    // Anchor the final row to its introduction instead of viewport center.
    const galleryGap = mobile ? 48 : 72;
    const groupHeight = galleryCopy.offsetHeight + galleryGap + height;
    const groupTop = Math.max(28, (hero.clientHeight - groupHeight) / 2);
    galleryCopy.style.top = groupTop + "px";
    const top = groupTop + galleryCopy.offsetHeight + galleryGap;
    shell.style.setProperty(
      "--gallery-bottom-space",
      Math.max(0, hero.clientHeight - top - height) + "px",
    );
    document.querySelector(".price")?.style.setProperty(
      "--gallery-bottom-space",
      Math.max(0, hero.clientHeight - top - height) + "px",
    );
    cards.forEach((card, i) => {
      const elapsed = clamp((now - start - i * 100) / 1300);
      const ease = (v) => {
        v = clamp(v);
        return v * v * v * (v * (v * 6 - 15) + 10);
      };
      const visibility = i < (mobile ? 4 : 5) ? 1 : ease(progress / 0.3);
      const batchScale = reduced.matches ? 1 : 0.65 + 0.35 * visibility;
      const entranceOpacity = reduced.matches
        ? 1
        : clamp(elapsed * 3 + rawProgress / 0.06);
      const batchOpacity =
        visibility * visibility * (3 - 2 * visibility) * entranceOpacity;
      const gather = ease(progress / 0.65);
      // Fit the opening cards into the side lanes instead of pushing them below copy.
      const sideSpace = Math.max(44, (hero.clientWidth - copy.offsetWidth) / 2);
      const openingFit =
        mobile || i === 4
          ? 1
          : Math.min(
              1,
              Math.max(
                0.32,
                (sideSpace - hero.clientWidth * (i === 2 ? 0.06 : 0.02) - 28) /
                  card._w,
              ),
            );
      const openingWidth = mobile && i < 4
          ? [110, 100, 140, 148][i]
          : card._w * openingFit,
        openingHeight = mobile && i < 4
          ? openingWidth * 1.3
          : card._h * openingFit;
      const cardWidth = openingWidth + (width - openingWidth) * gather;
      const cardHeight = openingHeight + (height - openingHeight) * gather;
      card.style.width = cardWidth + "px";
      card.style.height = cardHeight + "px";
      const label = card.querySelector("span"),
        initial = card._label;
      if (label && initial) {
        const mix = (a, b) => a + (b - a) * gather;
        Object.assign(label.style, {
          left: mix(initial.left, 8) + "px",
          right: "auto",
          bottom: mix(initial.bottom, mobile ? 12 : 15) + "px",
          width: mix(initial.width, width - 16) + "px",
          height: mix(initial.height, 38) + "px",
          minHeight: "0",
          fontSize: mix(initial.font, mobile ? 14 : 16) + "px",
          padding: mix(initial.py, 6) + "px " + mix(initial.px, 10) + "px",
          opacity: mobile ? String(clamp((progress - 0.35) / 0.25)) : "1",
          whiteSpace: "nowrap",
          boxSizing: "border-box",
        });
      }
      const baseX = card.offsetLeft,
        baseY = card.offsetTop;
      const midX = mobile && i < 4
        ? [16, hero.clientWidth - 116, 16, hero.clientWidth - 164][i]
        : baseX;
      // Bring the next portraits in below the departing copy, then assemble the row.
      const entryY = i >= 5 ? Math.max(baseY, hero.clientHeight * 0.78) : baseY;
      const midY = mobile && i < 4
        ? [24, 32, copy.offsetTop + copy.offsetHeight + 44,
            copy.offsetTop + copy.offsetHeight + 72][i]
        : entryY;
      const targetX = left + i * (width + gap);
      const moveX = midX + (targetX - midX) * gather - baseX;
      let moveY = midY + (top - midY) * gather - baseY;
      if (rawProgress > 0.005 && progress < 0.65 && (!mobile || i >= 2)) {
        const exit = clamp(rawProgress / 0.3),
          exitEase = exit * exit * (3 - 2 * exit);
        const textBottom =
          copy.offsetTop +
          copy.offsetHeight -
          exitEase * (hero.clientHeight + copy.offsetHeight);
        const cardLeft = baseX + moveX,
          cardRight = cardLeft + cardWidth;
        if (
          cardRight > copy.offsetLeft - 24 &&
          cardLeft < copy.offsetLeft + copy.offsetWidth + 24
        ) {
          moveY = Math.max(moveY, textBottom + 24 - baseY);
        }
      }
      const currentY = verticalPositions.get(card) ?? moveY;
      const nextY = reduced.matches
        ? moveY
        : currentY + (moveY - currentY) * (1 - Math.exp(-dt / 110));
      if (Math.abs(nextY - moveY) > 0.15) settling = true;
      verticalPositions.set(card, nextY);
      moveY = nextY;
      // Initial entrance shares the scroll transform owner to avoid competing tweens.
      // Follow the radial direction from the hero center back toward each screen edge.
      const entrance = mobile || reduced.matches ? 1 : 1 - Math.pow(1 - elapsed, 4);
      const entranceWeight = (1 - entrance) * (1 - clamp(rawProgress / 0.12));
      const centerX = baseX + cardWidth / 2 - hero.clientWidth / 2;
      const centerY = baseY + cardHeight / 2 - hero.clientHeight / 2;
      const radius = Math.max(1, Math.hypot(centerX, centerY));
      const entranceDistance = mobile ? 160 : 320;
      const entranceX = (centerX / radius) * entranceDistance * entranceWeight;
      const entranceY = (centerY / radius) * entranceDistance * entranceWeight;
      card.style.setProperty("--scene-x", moveX + entranceX + "px");
      card.style.setProperty("--scene-y", moveY + entranceY + "px");
      card.style.filter = "none";
      card.style.zIndex = i % 2 ? "4" : "1";
      card.style.setProperty("--scene-rx", "0deg");
      card.style.setProperty("--scene-ry", "0deg");
      card.style.setProperty("--row-turn", String(gather));
      card.style.setProperty("--batch-opacity", String(batchOpacity));
      card.style.opacity = String(batchOpacity);
      card.style.setProperty("--batch-scale", String(batchScale));
      card.style.visibility = visibility > 0.005 ? "visible" : "hidden";
      card.style.pointerEvents = visibility > 0.8 ? "" : "none";
      card.tabIndex = visibility > 0.8 ? 0 : -1;
    });
    galleryCopy.style.opacity = String(clamp((progress - 0.2) / 0.2));
    galleryCopy.style.transform = `translateY(${(1 - clamp((progress - 0.7) / 0.25)) * 18}px)`;
    galleryCopy.style.visibility = progress > 0.2 ? "visible" : "hidden";
    hero.classList.toggle("gallery-visible", progress > 0.2);
    const copyExitRaw = clamp(rawProgress / 0.3);
    const copyExit = copyExitRaw * copyExitRaw * (3 - 2 * copyExitRaw);
    copy.style.transform = `translateY(${reduced.matches ? 0 : -copyExit * (hero.clientHeight + copy.offsetHeight)}px)`;
    copy.style.opacity = "1";
    const sectorNav = hero.querySelector(".sector-nav");
    sectorNav.style.transform = `translateY(${reduced.matches ? 0 : -copyExit * (hero.clientHeight + 120)}px)`;
    copy.style.visibility = rawProgress >= 0.3 ? "hidden" : "visible";
    hero.querySelector(".sector-nav").style.opacity = "1";
    hero.querySelector(".sector-nav").style.visibility =
      rawProgress >= 0.3 ? "hidden" : "visible";
    hero.classList.toggle("row-ready", progress > 0.74);
    document
      .querySelector("header")
      .classList.toggle("second-screen", progress > 0.74);
    hero.style.overflowX = "clip";
    stage.tabIndex = progress > 0.74 ? 0 : -1;
    stage.setAttribute("role", "region");
    stage.setAttribute(
      "aria-label",
      "Industry cards, scroll horizontally to explore",
    );
    if (mobile) {
      stage.scrollLeft = 0;
    } else if (!reduced.matches) {
      const horizontalTravel = Math.max(
        0,
        stage.scrollWidth - stage.clientWidth,
      );
      stage.scrollLeft =
        clamp((scrollDistance - travel) / Math.max(1, horizontalTravel)) *
        horizontalTravel;
    } else if (progress <= 0.74) stage.scrollLeft = 0;
    hero.querySelector(".scroll-cue").style.pointerEvents =
      progress > 0.74 ? "none" : "";
    if (now - start < 1400 + cards.length * 100 || settling)
      frame = requestAnimationFrame(draw);
  }
  function measure() {
    shell.style.height = "";
    const baseHeight = shell.offsetHeight;
    const mobile = innerWidth <= 1100;
    const cardWidth = mobile
      ? 180
      : Math.min(260, Math.max(220, hero.clientWidth * 0.15));
    const rowWidth =
      cards.length * cardWidth + (cards.length - 1) * (mobile ? 18 : 24) + 40;
    shell.dataset.assemblyTravel = String(
      Math.max(1, baseHeight - hero.offsetHeight),
    );
    if (!reduced.matches && !mobile)
      shell.style.height =
        baseHeight +
        Math.max(0, rowWidth - Math.min(hero.clientWidth, 1440)) +
        "px";
    const wasReady = hero.classList.contains("row-ready");
    hero.classList.remove("row-ready");
    cards.forEach((card) => {
      const label = card.querySelector("span");
      if (label) {
        label.removeAttribute("style");
        const css = getComputedStyle(label);
        card._label = {
          left: parseFloat(css.left),
          bottom: parseFloat(css.bottom),
          width: label.offsetWidth,
          height: label.offsetHeight,
          font: parseFloat(css.fontSize),
          px: parseFloat(css.paddingLeft),
          py: parseFloat(css.paddingTop),
        };
      }
    });
    hero.classList.toggle("row-ready", wasReady);
    cards.forEach((card) => {
      card.style.width = "";
      card.style.height = "";
      const sizeFactor = mobile ? 1 : 0.85 * (innerWidth >= 1440 ? 1.15 : 1);
      card._w = card.offsetWidth * sizeFactor;
      card._h = card.offsetHeight * sizeFactor;
    });
    queue();
  }
  function queue() {
    if (!frame) frame = requestAnimationFrame(draw);
  }
  addEventListener("scroll", queue, { passive: true });
  addEventListener("resize", measure, { passive: true });
  reduced.addEventListener("change", measure);
  measure();
})();

/* Diffuse atmospheric field: a moving contour, following the opening scroll. */
(() => {
  const hero = document.querySelector(".hero-scroll-shell .world-hero");
  const shell = document.querySelector(".hero-scroll-shell");
  if (!hero || !shell) return;
  const canvas = document.createElement("canvas");
  canvas.className = "lavender-atmosphere";
  canvas.width = 96;
  canvas.height = 60;
  canvas.setAttribute("aria-hidden", "true");
  hero.prepend(canvas);
  const grid = document.createElement("div");
  grid.className = "hero-grid-texture";
  grid.setAttribute("aria-hidden", "true");
  hero.prepend(grid);
  const galleryTexture = document.createElement("div");
  galleryTexture.className = "gallery-grid-texture";
  galleryTexture.setAttribute("aria-hidden", "true");
  hero.prepend(galleryTexture);
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) {
    canvas.remove();
    return;
  }
  const nav = document.querySelector("header");
  const navCanvas = canvas.cloneNode();
  navCanvas.className = "nav-atmosphere";
  nav?.prepend(navCanvas);
  const navCtx = navCanvas.getContext("2d", { alpha: false });
  const pixels = ctx.createImageData(96, 60);
  const clamp = (x) => Math.max(0, Math.min(1, x));
  const smooth = (x) => {
    x = clamp(x);
    return x * x * (3 - 2 * x);
  };
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let last = 0,
    previous = 0,
    current = [-0.3, 0.3, 0.22],
    started = performance.now();
  let frame = 0,
    progress = 0;
  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    previous = 0;
    canvas.dataset.animationActive = "false";
  }
  function updateVisibility() {
    const bounds = shell.getBoundingClientRect();
    const raw = innerWidth <= 1100 ? 0 : clamp(
      (70 - bounds.top) /
        Math.max(
          1,
          Number(shell.dataset.assemblyTravel) ||
            shell.offsetHeight - hero.offsetHeight,
        ),
    );
    const hold = innerWidth <= 1100 ? 0.34 : 0.4;
    progress = clamp((raw - hold) / (1 - hold));
    const opacity = 1 - smooth((progress - 0.42) / 0.3);
    canvas.style.opacity = String(opacity);
    grid.style.opacity = canvas.style.opacity;
    const inView = bounds.bottom > 0 && bounds.top < innerHeight;
    const navWhite = innerWidth <= 1100 ? smooth(scrollY / 180) : 0;
    nav?.style.setProperty("--nav-white", String(navWhite));
    navCanvas.style.opacity = inView ? String(opacity * (1 - navWhite)) : "0";
    if (document.hidden || !inView || opacity === 0) {
      stop();
    } else if (!frame) {
      last = 0;
      canvas.dataset.animationActive = "true";
      frame = requestAnimationFrame(draw);
    }
  }
  function draw(now) {
    frame = requestAnimationFrame(draw);
    if (now - last < 50) return;
    const dt = previous ? Math.min(now - previous, 100) : 50;
    previous = now;
    last = now;
    const p = smooth(progress),
      target = [0.38 + 0.35 * p, 0.36 + 0.18 * p, 0.22 - 0.04 * p];
    const intro = reduced.matches ? 1 : smooth((now - started) / 1800);
    const follow = 1 - Math.exp(-dt / 450);
    current = current.map((v, i) =>
      intro < 1
        ? [-0.3, 0.3, 0.22][i] + (target[i] - [-0.3, 0.3, 0.22][i]) * intro
        : v + (target[i] - v) * follow,
    );
    const tip =
      current[0] +
      (reduced.matches ? 0 : Math.sin(now * 0.00033 + 1.3) * 0.035);
    const half =
      current[1] + (reduced.matches ? 0 : Math.sin(now * 0.0005) * 0.025);
    const soft = current[2],
      aspect = hero.clientWidth / hero.clientHeight;
    const points = Array.from({ length: 32 }, (_, i) => {
      const y = -0.3 + ((tip + 0.3) * i) / 31;
      return [half * aspect * Math.pow(Math.max(0, 1 - y / tip), 0.72), y];
    });
    for (let y = 0; y < 60; y++)
      for (let x = 0; x < 96; x++) {
        const px = Math.abs(x / 96 - 0.5) * aspect,
          py = y / 60;
        let d = 100;
        for (let i = 1; i < points.length; i++) {
          const [ax, ay] = points[i - 1],
            [bx, by] = points[i],
            dx = bx - ax,
            dy = by - ay;
          const t = clamp(
            ((px - ax) * dx + (py - ay) * dy) /
              Math.max(0.000001, dx * dx + dy * dy),
          );
          d = Math.min(d, Math.hypot(px - ax - t * dx, py - ay - t * dy));
        }
        if (py < tip && px < half * aspect * Math.pow(1 - py / tip, 0.72))
          d = -d;
        const g = 1 - smooth((d - 0.25 + soft) / (2 * soft));
        // A broad white bridge keeps lavender and yellow from mixing into beige.
        const horizontal = x / 96;
        const tint = innerWidth <= 650
          ? (horizontal < 0.5
              ? mix([240, 229, 248], [250, 242, 241], smooth(horizontal * 2))
              : mix([250, 242, 241], [255, 248, 224], smooth((horizontal - 0.5) * 2)))
          : horizontal < 0.5
            ? mix(
                [229, 209, 241],
                [255, 255, 255],
                smooth((horizontal - 0.12) / 0.38),
              )
            : mix(
                [255, 255, 255],
                [255, 248, 211],
                smooth((horizontal - 0.5) / 0.38),
              );
        const base =
          g < 0.38
            ? mix([255, 255, 255], [252, 246, 251], smooth(g / 0.38))
            : mix([252, 246, 251], tint, smooth((g - 0.38) / 0.62));
        const light =
          Math.exp(-((x / 96 - 0.43) ** 2 / 0.065 + (py - 0.1) ** 2 / 0.055)) *
          0.68 *
          g;
        const col = mix(base, [253, 248, 253], light);
        const idx = (y * 96 + x) * 4;
        pixels.data[idx] = col[0];
        pixels.data[idx + 1] = col[1];
        pixels.data[idx + 2] = col[2];
        pixels.data[idx + 3] = 255;
      }
    ctx.putImageData(pixels, 0, 0);
    navCtx?.putImageData(pixels, 0, 0);
  }
  const visibilityObserver = new IntersectionObserver(updateVisibility);
  visibilityObserver.observe(shell);
  const sizeObserver = new ResizeObserver(updateVisibility);
  sizeObserver.observe(shell);
  sizeObserver.observe(hero);
  addEventListener("scroll", updateVisibility, { passive: true });
  addEventListener("resize", updateVisibility);
  document.addEventListener("visibilitychange", updateVisibility);
  addEventListener("pagehide", stop);
  addEventListener("pageshow", updateVisibility);
  updateVisibility();
})();

// Whole-section stacked cards, matching the Reshoot scroll transition.
(() => {
  const cards = [
    ...document.querySelectorAll(".reminder, .features, .support"),
  ];
  const stack = document.createElement("div");
  stack.className = "section-card-stack";
  cards[0].before(stack);
  cards.forEach((card, i) => {
    const stage = document.createElement("div");
    stage.className = "section-card-stage";
    const face = document.createElement("div");
    face.className = "section-card-face";
    stage.style.zIndex = i + 1;
    card.before(stage);
    face.append(card);
    stage.append(face);
    stack.append(stage);
  });
  if (window.gsap) return;
  let pending = false;
  function draw() {
    pending = false;
    const enabled = innerWidth > 900 && !motionPreference.matches;
    stack.classList.toggle("stack-enabled", enabled);
    cards.forEach((card, i) => {
      const face = card.parentElement;
      const next = cards[i + 1]?.parentElement.parentElement;
      const t =
        enabled && next
          ? Math.max(
              0,
              Math.min(
                1,
                (innerHeight - next.getBoundingClientRect().top) / innerHeight,
              ),
            )
          : 0;
      face.style.transform = `perspective(1600px) rotateX(${40 * t * t}deg) rotateZ(${-3 * t * t}deg) scale(${1 - 0.3 * t * t})`;
      face.style.opacity = String(1 - Math.max(0, (t - 0.8) / 0.2));
    });
  }
  function queue() {
    if (!pending) {
      pending = true;
      requestAnimationFrame(draw);
    }
  }
  addEventListener("scroll", queue, { passive: true });
  addEventListener("resize", queue);
  motionPreference.addEventListener("change", queue);
  draw();
})();

// Replay fee cards and counters on each entry; reset only fully offscreen.
(() => {
  const section = document.querySelector("#pricing");
  const amounts = [...section.querySelectorAll("aside strong")];
  const starts = [49, 5, 199];
  const priceCards = [...section.querySelectorAll("aside>div")];
  amounts.forEach((el, i) =>
    el.setAttribute(
      "aria-label",
      i === 1 ? "0 percent sales commission" : "0 dollars",
    ),
  );
  if (motionPreference.matches || !("IntersectionObserver" in window)) return;
  let playing = false;
  const timers = new Set();
  const later = (fn, delay) => {
    const id = setTimeout(() => {
      timers.delete(id);
      fn();
    }, delay);
    timers.add(id);
  };
  const reset = () => {
    timers.forEach(clearTimeout);
    timers.clear();
    priceCards.forEach((card) => {
      card
        .getAnimations({ subtree: true })
        .forEach((animation) => animation.cancel());
      card.style.opacity = "0";
      card.style.transform = "translateY(-80px)";
    });
    amounts.forEach((el, i) => {
      el.textContent = i === 1 ? "0%" : "$0";
    });
    playing = false;
  };
  reset();
  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[entries.length - 1];
      if (!entry.isIntersecting) {
        const rect = entry.target.getBoundingClientRect();
        if (rect.bottom <= 0 || rect.top >= innerHeight) reset();
        return;
      }
      if (playing || entry.intersectionRatio < 0.5) return;
      playing = true;
      priceCards.forEach((card, i) => {
        card.animate(
          [
            { opacity: 0, transform: "translateY(-80px)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
          {
            duration: 1000,
            delay: i * 200,
            easing: "cubic-bezier(.22,1,.36,1)",
            fill: "both",
          },
        ).onfinish = () => {
          card.style.opacity = "1";
          card.style.transform = "none";
        };
      });
      amounts.forEach((el, i) => {
        const prefix = i === 1 ? "" : "$",
          suffix = i === 1 ? "%" : "";
        el.textContent = "";
        el.setAttribute(
          "title",
          "Illustrative fee animation; Aladdin Mall is free.",
        );
        const visual = document.createElement("span");
        visual.className = "fee-number";
        visual.setAttribute("aria-hidden", "true");
        el.append(visual);
        visual.append(prefix);
        const digits = String(starts[i])
          .split("")
          .map((n) => {
            const slot = document.createElement("span");
            slot.className = "fee-digit";
            const reel = document.createElement("span");
            reel.className = "fee-reel";
            for (let d = Number(n) + 10; d >= 0; d--) {
              const cell = document.createElement("span");
              cell.textContent = d % 10;
              reel.append(cell);
            }
            slot.append(reel);
            visual.append(slot);
            return { slot, reel, n: Number(n) + 10 };
          });
        visual.append(suffix);
        later(
          () => {
            if (motionPreference.matches) {
              el.textContent = i === 1 ? "0%" : "$0";
              return;
            }
            digits.forEach(({ slot, reel, n }, j) => {
              const animation = reel.animate(
                [
                  { transform: "translateY(0)" },
                  { transform: `translateY(-${n * 1.2}em)` },
                ],
                {
                  duration: 1800 + j * 130,
                  easing: "cubic-bezier(.22,.7,.2,1)",
                  fill: "forwards",
                },
              );
              animation.onfinish = () => {
                if (j < digits.length - 1) {
                  slot.style.transition =
                    "width 450ms ease, opacity 350ms ease";
                  slot.style.width = "0";
                  slot.style.opacity = "0";
                }
                if (j === digits.length - 1) {
                  later(() => {
                    if (motionPreference.matches) return;
                    visual.style.transformOrigin = "left center";
                    visual.animate(
                      [
                        { transform: "scale(1)", offset: 0 },
                        { transform: "scale(1.12)", offset: 0.2 },
                        { transform: "scale(1)", offset: 0.42 },
                        { transform: "scale(1.12)", offset: 0.65 },
                        { transform: "scale(1)", offset: 1 },
                      ],
                      { duration: 1000, easing: "ease-in-out" },
                    );
                  }, 450);
                }
              };
            });
          },
          700 + (i + 1) * 200,
        );
      });
    },
    { threshold: [0, 0.5] },
  );
  observer.observe(section.querySelector("aside"));
})();

// Keep Figma's illustration geometry intact across responsive story columns.
(() => {
  const art = document.querySelector(".figma-reminder");
  if (!art) return;
  const fit = () => art.style.setProperty("--fr-scale", art.clientWidth / 973);
  new ResizeObserver(fit).observe(art);
  fit();
})();

// Pause decorative motion outside the viewport.
(() => {
  const sections = document.querySelectorAll(
    "section.reminder,section.support",
  );
  const observer = new IntersectionObserver((entries) =>
    entries.forEach((entry) =>
      entry.target.classList.toggle("gradient-in-view", entry.isIntersecting),
    ),
  );
  sections.forEach((section) => observer.observe(section));
})();

(() => {
  const art = document.querySelector(".figma-platform");
  if (!art) return;
  const fit = () => art.style.setProperty("--fp-scale", art.clientWidth / 1024);
  new ResizeObserver(fit).observe(art);
  fit();
})();

(() => {
  const section = document.querySelector("section.features");
  if (!section) return;
  new IntersectionObserver((entries) =>
    entries.forEach((entry) =>
      entry.target.classList.toggle("gradient-in-view", entry.isIntersecting),
    ),
  ).observe(section);
})();

(() => {
  const art = document.querySelector(".figma-founder");
  if (!art) return;
  const fit = () =>
    art.style.setProperty(
      "--ff-scale",
      Math.max(art.clientWidth / 1706, art.clientHeight / 1279),
    );
  new ResizeObserver(fit).observe(art);
  fit();
})();

(() => {
  const art = document.querySelector(".figma-support");
  if (!art) return;
  const fit = () => art.style.setProperty("--fs-scale", art.clientWidth / 1141);
  new ResizeObserver(fit).observe(art);
  fit();
})();

// Include the last full-screen story's lower whitespace in the next section gap.
(() => {
  const section = document.querySelector("section.support"),
    founder = document.querySelector("section.founder");
  if (!section || !founder) return;
  const art = section.querySelector(".figma-support"),
    copy = section.querySelector(".story-copy");
  const fit = () => {
    const bounds = section.getBoundingClientRect();
    const artBounds = art.getBoundingClientRect();
    const copyBounds = copy.getBoundingClientRect();
    const contentBottom = Math.max(
      copyBounds.bottom,
      artBounds.top + (828 * art.clientWidth) / 1141,
    );
    founder.style.setProperty(
      "--story-bottom-space",
      Math.max(0, bounds.bottom - contentBottom) + "px",
    );
  };
  const observer = new ResizeObserver(fit);
  [section, art, copy].forEach((el) => observer.observe(el));
  document.fonts.ready.then(fit);
  addEventListener("resize", fit, { passive: true });
  fit();
})();

// Native touch scrolling with repeated cards and seamless arc wrapping.
(() => {
  const track = document.querySelector('.mobile-industry-track');
  if (!track) return;
  const originals = [...track.children];
  if (!originals.length) return;
  const makeCopies = () => originals.map(card => {
    const copy = card.cloneNode(true);
    copy.classList.add('arc-copy');
    copy.setAttribute('aria-hidden', 'true');
    return copy;
  });
  track.prepend(...makeCopies());
  track.append(...makeCopies());
  const cards = [...track.children];
  let frame = 0, initialized = false;
  let layout = [], viewport = 0, cycle = 0, origin = 0, phone = false;
  let settleTimer, touching = false;
  function measure() {
    phone = matchMedia('(max-width:650px)').matches;
    viewport = track.clientWidth;
    layout = cards.map(card => ({ card, left:card.offsetLeft, width:card.offsetWidth }));
    const first = layout[originals.length];
    cycle = layout[originals.length * 2].left - first.left;
    origin = first.left + first.width / 2 - viewport / 2;
    if (phone && !initialized && cycle > 0) {
      track.scrollTo({left:origin, behavior:'instant'});
      initialized = true;
    } else if (!phone && initialized) {
      initialized = false;
      track.scrollTo({left:0, behavior:'instant'});
    }
    schedule();
  }
  function settle() {
    if (!phone || !cycle || touching) return;
    const current = track.scrollLeft;
    // Rebase only once native momentum and optional centering have finished.
    const wrapped = origin + ((((current - origin) % cycle) + cycle) % cycle);
    if (Math.abs(wrapped - current) > 1) track.scrollTo({left:wrapped, behavior:'instant'});
    const step = cycle / originals.length;
    const target = origin + Math.round((wrapped - origin) / step) * step;
    if (Math.abs(target - wrapped) > 1) {
      track.scrollTo({left:target, behavior:motionPreference.matches ? 'instant' : 'smooth'});
    }
    schedule();
  }
  function renderArc() {
    frame = 0;
    const center = track.scrollLeft + viewport / 2;
    // All geometry reads happen in measure(); this loop only writes transforms.
    layout.forEach(({card, left, width}) => {
      if (!phone) { card.style.transform = ''; card.style.visibility = ''; return; }
      const dx = left + width / 2 - center;
      const visible = Math.abs(dx) < viewport / 2 + width * 1.5;
      card.style.visibility = visible ? 'visible' : 'hidden';
      if (!visible) return;
      const radius = width * 4;
      const angle = Math.max(-1.2, Math.min(1.2, dx / radius));
      card.style.transform = `translate3d(${radius * Math.sin(angle) - dx}px, ${radius * (1 - Math.cos(angle))}px, 0) rotate(${angle * 180 / Math.PI}deg)`;
    });
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(renderArc); }
  track.addEventListener('scroll', () => {
    schedule();
    clearTimeout(settleTimer);
    settleTimer = setTimeout(settle, 180);
  }, { passive:true });
  track.addEventListener('touchstart', () => {
    touching = true;
    clearTimeout(settleTimer);
  }, {passive:true});
  const release = () => {
    touching = false;
    clearTimeout(settleTimer);
    settleTimer = setTimeout(settle, 180);
  };
  track.addEventListener('touchend', release, {passive:true});
  track.addEventListener('touchcancel', release, {passive:true});
  const resizeObserver = new ResizeObserver(measure);
  resizeObserver.observe(track);
  measure();
})();
