/* One GSAP owner per property; existing hero scene and fee counters retain theirs. */
(() => {
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  const mm = gsap.matchMedia();
  mm.add("(prefers-reduced-motion: no-preference)", () => {
    gsap.from(".hero-copy>.primary,.hero-copy>.checks", {
      y: 12,
      opacity: 0,
      duration: 0.85,
      stagger: 0.1,
      delay: 0.35,
      ease: "power3.out",
    });
    document
      .querySelectorAll(".story-copy,.founder>div:first-child,.apps")
      .forEach((block) => {
        const targets = [...block.children].filter((el) =>
          el.matches(".story-number,button"),
        );
        gsap.from(targets, {
          y: 24,
          opacity: 0,
          duration: 0.85,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: { trigger: block, start: "top 85%", once: true },
        });
      });
    if (window.SplitText) {
      gsap.registerPlugin(SplitText);
      const textTargets = document.querySelectorAll(
        ".hero-copy h1,.hero-copy>p,.gallery-copy h2,.gallery-copy>p,.price>h2,.price>p,.story-copy>h2,.story-copy>p,.platform-details h3,.platform-details p,.founder h2,.founder p,.apps>h2,.app-grid h3,.app-grid p,.cta-inline>p",
      );
      textTargets.forEach((el) => {
        SplitText.create(el, {
          type: "lines",
          linesClass: "text-reveal-line",
          autoSplit: true,
          aria: "auto",
          onSplit(self) {
            if (el.closest(".hero-copy")) {
              return gsap.from(self.lines, {
                y: 28,
                opacity: 0,
                duration: 1.05,
                stagger: 0.14,
                ease: "power2.out",
                onComplete: () =>
                  gsap.set(self.lines, { clearProps: "opacity,transform" }),
              });
            }
            if (el.closest(".gallery-copy")) {
              const hero = el.closest(".world-hero");
              const tween = gsap.fromTo(
                self.lines,
                { y: 28, opacity: 0 },
                {
                  y: 0,
                  opacity: 1,
                  duration: 1.05,
                  stagger: 0.14,
                  ease: "power2.out",
                  paused: true,
                  immediateRender: true,
                },
              );
              let shown = false;
              // Start as the gallery becomes visible, not later when cards finish gathering.
              const sync = () => {
                const ready = hero.classList.contains("gallery-visible");
                if (ready && !shown) tween.restart();
                else if (!ready && shown) tween.pause(0);
                shown = ready;
              };
              const observer = new MutationObserver(sync);
              observer.observe(hero, {
                attributes: true,
                attributeFilter: ["class"],
              });
              sync();
              const originalKill = tween.kill.bind(tween);
              tween.kill = () => {
                observer.disconnect();
                return originalKill();
              };
              return tween;
            }
            // Observe the actual text box, including sticky/transformed card positions.
            // Never reset on a ScrollTrigger boundary while the text is still on screen.
            const tween = gsap.fromTo(
              self.lines,
              { y: 28, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 1.05,
                stagger: 0.14,
                ease: "power2.out",
                paused: true,
              },
            );
            let visible = false;
            const observer = new IntersectionObserver(
              (entries) => {
                entries.forEach((entry) => {
                  if (entry.isIntersecting) {
                    if (!visible) tween.restart();
                    visible = true;
                  } else {
                    const rect = el.getBoundingClientRect();
                    if (rect.bottom <= -80 || rect.top >= innerHeight + 80) {
                      visible = false;
                      tween.pause(0);
                    }
                  }
                });
              },
              { threshold: 0, rootMargin: "80px 0px 80px 0px" },
            );
            observer.observe(el);
            const originalKill = tween.kill.bind(tween);
            tween.kill = () => {
              observer.disconnect();
              return originalKill();
            };
            return tween;
          },
        });
      });
    }
    // Each illustration uses the same scroll response with layer-specific travel.
    const illustrationLayers = [
      [
        ".figma-reminder",
        [
          [".fr-settings", 48],
          [".fr-calendar", 68],
          [".fr-delivered", 84],
        ],
      ],
      [
        ".figma-platform",
        [
          [".fp-website", 48],
          [".fp-payment", 68],
          [".fp-booking", 84],
        ],
      ],
      [
        ".figma-support",
        [
          [".fs-help", 48],
          [".fs-setup", 68],
        ],
      ],
    ];
    illustrationLayers.forEach(([selector, layers]) => {
      const art = document.querySelector(selector);
      if (!art) return;
      layers.forEach(([selector, travel]) => {
        gsap.fromTo(
          art.querySelector(selector),
          { y: -travel },
          {
            y: travel,
            ease: "none",
            scrollTrigger: {
              trigger: art,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.65,
            },
          },
        );
      });
    });
    gsap.from(".app-grid>article", {
      y: 28,
      opacity: 0,
      duration: 0.85,
      stagger: 0.16,
      ease: "power3.out",
      scrollTrigger: { trigger: ".app-grid", start: "top 85%", once: true },
    });
  });
  mm.add(
    "(min-width: 901px) and (prefers-reduced-motion: no-preference)",
    () => {
      const faces = [...document.querySelectorAll(".section-card-face")];
      faces.slice(0, -1).forEach((face, i) => {
        gsap.to(face, {
          scale: 0.6,
          transformOrigin: "center top",
          ease: "none",
          scrollTrigger: {
            trigger: faces[i + 1].parentElement,
            start: "top bottom",
            end: "top top",
            scrub: 0.65,
          },
        });
      });
    },
  );
  const refresh = () => ScrollTrigger.refresh();
  document.fonts?.ready.then(refresh);
  document.querySelectorAll("img").forEach((img) => {
    if (!img.complete) img.addEventListener("load", refresh, { once: true });
  });
  addEventListener("load", refresh, { once: true });
  addEventListener("pagehide", () => mm.revert(), { once: true });
})();
