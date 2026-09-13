/**
 * ============================================================================
 * Cinematic High-Fidelity Portfolio Engine & Interactive Constellation
 * ============================================================================
 * Portfolio: GANNAMANEEDI GOWTHAM — AI & MERN Stack Developer
 * Features:
 * 1. 300-Frame Scroll-Scrubbed Canvas Engine with High-DPI Resampling & LERP
 * 2. Interactive Skills Constellation Canvas with Dynamic Network Links
 * 3. Technology Domain Filter & Spotlight Engine
 * 4. 3D Perspective Card Tilt on Mouse Move
 * 5. Ambient Cursor Glow Follower
 * 6. Smooth Scroll Reveal Observer
 * 7. Active Navigation State Tracking
 * 8. Real-time Local Time Status Engine
 * ============================================================================
 */

(function () {
  'use strict';

  // --- Configuration ---
  const CONFIG = {
    totalFrames: 300,
    framePathPrefix: 'frames/ezgif-frame-',
    frameExtension: '.jpg',
    framePadLength: 3,
    startFrameIndex: 1,       // Frames ezgif-frame-001.jpg to ezgif-frame-300.jpg
    lerpFactor: 0.12,          // Inertial smoothing coefficient
    cameraPushInFactor: 0.03,  // Subtle cinematic camera push-in
  };

  // --- DOM Elements ---
  const canvas = document.getElementById('portrait-canvas');
  const ctx = canvas ? canvas.getContext('2d', { alpha: false, desynchronized: true }) : null;
  const scrollTrack = document.getElementById('hero-track');
  const preloader = document.getElementById('preloader');
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');
  const frameCounter = document.getElementById('frame-counter');
  const navLinks = document.querySelectorAll('.nav-link');
  const ambientGlow = document.getElementById('ambient-glow');
  const tiltElements = document.querySelectorAll('[data-tilt]');
  const revealElements = document.querySelectorAll('.reveal-on-scroll');
  const skillFilterBtns = document.querySelectorAll('.skill-filter-btn');
  const techBubbles = document.querySelectorAll('.tech-item-bubble');
  const networkCanvas = document.getElementById('skills-network-canvas');
  const localTimeIndicator = document.getElementById('local-time-indicator');
  
  // Hero Text Layer Elements for Scroll-Synchronized Reveal
  const heroMetaStrip = document.querySelector('.hero-meta-strip');
  const heroDisplayName = document.querySelector('.hero-display-name');
  const heroTitleGroup = document.querySelector('.hero-title-group');
  const heroActions = document.querySelector('.hero-actions');
  const heroScrollHint = document.querySelector('.hero-scroll-hint');

  // --- Hero Frame State Variables ---
  const images = new Array(CONFIG.totalFrames);
  let loadedCount = 0;
  let targetFrame = 0;
  let currentFrame = 0;
  let scrollProgress = 0;
  let lastDrawnFrameIndex = -1;
  let isInitialFrameDrawn = false;
  let needsResize = true;

  /**
   * Generates zero-padded frame paths.
   */
  function getFramePath(index) {
    const frameNumber = index + CONFIG.startFrameIndex;
    const padded = String(frameNumber).padStart(CONFIG.framePadLength, '0');
    return `${CONFIG.framePathPrefix}${padded}${CONFIG.frameExtension}`;
  }

  /**
   * Preloads all frames with browser asynchronous decoding.
   */
  function preloadImages() {
    let completed = 0;

    for (let i = 0; i < CONFIG.totalFrames; i++) {
      const img = new Image();
      img.src = getFramePath(i);

      const onDone = () => {
        images[i] = img;
        completed++;
        onFrameLoaded(completed, i);
      };

      if ('decode' in img) {
        img.decode()
          .then(onDone)
          .catch(() => {
            img.onload = onDone;
            img.onerror = onDone;
          });
      } else {
        img.onload = onDone;
        img.onerror = onDone;
      }
    }
  }

  /**
   * Preload callback for UI progress and instant first frame render.
   */
  function onFrameLoaded(completed, frameIndex) {
    loadedCount = completed;
    const percent = Math.min(100, Math.round((completed / CONFIG.totalFrames) * 100));

    if (progressBar) progressBar.style.width = `${percent}%`;
    if (progressText) progressText.textContent = `${percent}%`;

    // Render first frame immediately
    if (frameIndex === 0 && !isInitialFrameDrawn) {
      resizeCanvas();
      drawFrame(0);
      isInitialFrameDrawn = true;
    }

    // Dismiss preloader once complete
    if (completed >= CONFIG.totalFrames) {
      setTimeout(() => {
        if (preloader) {
          preloader.classList.add('hidden');
        }
      }, 150);
    }
  }

  /**
   * Configures canvas buffer resolution based on exact devicePixelRatio.
   */
  function resizeCanvas() {
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;

    const displayWidth = Math.round(window.innerWidth * dpr);
    const displayHeight = Math.round(window.innerHeight * dpr);

    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
      
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      needsResize = true;
    }
  }

  /**
   * Calculates scroll progress through the pinned Hero scroll track.
   */
  function calculateScrollProgress() {
    if (!scrollTrack) return 0;

    const rect = scrollTrack.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const totalScrollableDistance = scrollTrack.offsetHeight - windowHeight;

    if (totalScrollableDistance <= 0) return 0;

    const scrolledAmount = -rect.top;
    const progress = scrolledAmount / totalScrollableDistance;

    return Math.max(0, Math.min(1, progress));
  }

  /**
   * Scroll event handler.
   */
  function onScroll() {
    scrollProgress = calculateScrollProgress();
    targetFrame = scrollProgress * (CONFIG.totalFrames - 1);
    updateActiveNav();
  }

  /**
   * Updates navigation highlight based on current scroll position.
   */
  function updateActiveNav() {
    const sections = ['hero-track', 'about', 'projects', 'skills', 'experience', 'education', 'contact'];
    const scrollPos = window.scrollY + 300;

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const top = el.offsetTop;
      const height = el.offsetHeight;

      if (scrollPos >= top && scrollPos < top + height) {
        navLinks.forEach((link) => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }

  /**
   * Fallback search for closest loaded image buffer.
   */
  function getClosestLoadedImage(index) {
    if (images[index] && images[index].complete && images[index].naturalWidth > 0) {
      return images[index];
    }

    for (let offset = 1; offset < CONFIG.totalFrames; offset++) {
      const prev = index - offset;
      if (prev >= 0 && images[prev] && images[prev].complete && images[prev].naturalWidth > 0) {
        return images[prev];
      }
      const next = index + offset;
      if (next < CONFIG.totalFrames && images[next] && images[next].complete && images[next].naturalWidth > 0) {
        return images[next];
      }
    }
    return null;
  }

  /**
   * Renders single frame with COVER scaling, high-quality bicubic resampling, and clean focal framing.
   */
  function drawFrame(frameIndex) {
    if (!ctx) return;
    const img = getClosestLoadedImage(frameIndex);
    if (!img) return;

    const cWidth = canvas.width;
    const cHeight = canvas.height;

    if (cWidth === 0 || cHeight === 0) return;

    const imgWidth = img.naturalWidth || 1280;
    const imgHeight = img.naturalHeight || 720;
    const imgAspect = imgWidth / imgHeight;
    const canvasAspect = cWidth / cHeight;

    const cameraScale = 1.0 + (scrollProgress * CONFIG.cameraPushInFactor);

    let drawWidth, drawHeight, offsetX, offsetY;
    const dpr = window.devicePixelRatio || 1;
    const isDesktop = (cWidth / dpr) >= 860;

    // High-Precision Object-Fit: COVER
    if (canvasAspect > imgAspect) {
      drawWidth = cWidth * cameraScale;
      drawHeight = (cWidth / imgAspect) * cameraScale;
      offsetX = (cWidth - drawWidth) * 0.5;
      offsetY = (cHeight - drawHeight) * 0.35; // Upper-third face alignment
    } else {
      drawHeight = cHeight * cameraScale;
      drawWidth = (cHeight * imgAspect) * cameraScale;

      const focalPointX = isDesktop ? 0.58 : 0.5;
      offsetX = (cWidth - drawWidth) * focalPointX;
      offsetY = (cHeight - drawHeight) * 0.5;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.clearRect(0, 0, cWidth, cHeight);
    ctx.drawImage(img, Math.round(offsetX), Math.round(offsetY), Math.round(drawWidth), Math.round(drawHeight));

    if (frameCounter) {
      frameCounter.textContent = `FRAME ${frameIndex + 1} / ${CONFIG.totalFrames}`;
    }
  }

  /**
   * Synchronizes Hero typography, titles, meta tags, and buttons to exact scroll progress.
   * Driven by the single normalized progress value (0 -> 1) sharing identical LERP smoothing.
   */
  function updateHeroScrollReveal(p) {
    const clampedP = Math.max(0, Math.min(1, p));

    // 1. Large Display Name ("GANNAMANEEDI GOWTHAM")
    if (heroDisplayName) {
      const nameOpacity = clampedP;
      const nameY = (1 - clampedP) * 20;
      heroDisplayName.style.opacity = nameOpacity.toFixed(3);
      heroDisplayName.style.transform = `translateY(${nameY.toFixed(2)}px)`;
    }

    // 2. Titles & Tagline ("AI & MERN STACK DEVELOPER", "Creative Developer & Visual Technologist")
    if (heroTitleGroup) {
      const titleProgress = Math.max(0, Math.min(1, (clampedP - 0.04) / 0.96));
      const titleOpacity = titleProgress;
      const titleY = (1 - titleProgress) * 18;
      heroTitleGroup.style.opacity = titleOpacity.toFixed(3);
      heroTitleGroup.style.transform = `translateY(${titleY.toFixed(2)}px)`;
    }

    // 3. Top Metadata Strip
    if (heroMetaStrip) {
      const metaProgress = Math.max(0, Math.min(1, (clampedP - 0.02) / 0.98));
      const metaOpacity = metaProgress * 0.9;
      const metaY = (1 - metaProgress) * -10;
      heroMetaStrip.style.opacity = metaOpacity.toFixed(3);
      heroMetaStrip.style.transform = `translateY(${metaY.toFixed(2)}px)`;
    }

    // 4. Action Buttons ("View Selected Works", "About Me") — staggered slightly after name
    if (heroActions) {
      const btnProgress = Math.max(0, Math.min(1, (clampedP - 0.12) / 0.88));
      const btnOpacity = btnProgress;
      const btnY = (1 - btnProgress) * 18;
      heroActions.style.opacity = btnOpacity.toFixed(3);
      heroActions.style.transform = `translateY(${btnY.toFixed(2)}px)`;
      heroActions.style.pointerEvents = btnOpacity > 0.2 ? 'auto' : 'none';
    }

    // 5. Scroll Hint ("SCROLL TO EXPLORE")
    if (heroScrollHint) {
      if (clampedP > 0.85) {
        const hintFade = Math.max(0, 1 - (clampedP - 0.85) / 0.15);
        heroScrollHint.style.opacity = hintFade.toFixed(3);
      } else {
        heroScrollHint.style.opacity = '1';
      }
    }
  }

  /**
   * Render Loop with LERP Inertial Smoothing.
   */
  function renderLoop() {
    const diff = targetFrame - currentFrame;
    
    if (Math.abs(diff) < 0.001) {
      currentFrame = targetFrame;
    } else {
      currentFrame += diff * CONFIG.lerpFactor;
    }

    const frameToDraw = Math.round(currentFrame);
    const normalizedProgress = currentFrame / (CONFIG.totalFrames - 1);

    // Frame-by-frame synchronized text reveal using exact smoothed progress
    updateHeroScrollReveal(normalizedProgress);

    if (frameToDraw !== lastDrawnFrameIndex || needsResize) {
      drawFrame(frameToDraw);
      lastDrawnFrameIndex = frameToDraw;
      needsResize = false;
    }

    requestAnimationFrame(renderLoop);
  }

  /**
   * =========================================================================
   * Interactive Skills Constellation Network Canvas Engine
   * =========================================================================
   */
  function setupSkillsConstellation() {
    if (!networkCanvas) return;
    const nCtx = networkCanvas.getContext('2d');
    if (!nCtx) return;

    let hoveredBubble = null;
    let hoveredCategory = null;

    function resizeNetworkCanvas() {
      const rect = networkCanvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      networkCanvas.width = rect.width * dpr;
      networkCanvas.height = rect.height * dpr;
      nCtx.scale(dpr, dpr);
    }

    window.addEventListener('resize', resizeNetworkCanvas, { passive: true });
    resizeNetworkCanvas();

    // Node Hover Listeners
    techBubbles.forEach((bubble) => {
      bubble.addEventListener('mouseenter', () => {
        hoveredBubble = bubble;
        hoveredCategory = bubble.getAttribute('data-category');
        drawConstellationLines();
      });

      bubble.addEventListener('mouseleave', () => {
        hoveredBubble = null;
        hoveredCategory = null;
        drawConstellationLines();
      });
    });

    // Domain Filter Buttons
    skillFilterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        skillFilterBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.getAttribute('data-filter');
        techBubbles.forEach((bubble) => {
          const cat = bubble.getAttribute('data-category');
          if (filter === 'all' || cat === filter) {
            bubble.classList.remove('dimmed');
          } else {
            bubble.classList.add('dimmed');
          }
        });
      });
    });

    /**
     * Draws luminous connected constellation lines between related active nodes.
     */
    function drawConstellationLines() {
      const rect = networkCanvas.getBoundingClientRect();
      nCtx.clearRect(0, 0, rect.width, rect.height);

      if (!hoveredBubble) return;

      const hoveredRect = hoveredBubble.getBoundingClientRect();
      const hX = (hoveredRect.left + hoveredRect.width / 2) - rect.left;
      const hY = (hoveredRect.top + hoveredRect.height / 2) - rect.top;

      techBubbles.forEach((otherBubble) => {
        if (otherBubble === hoveredBubble) return;
        const otherCat = otherBubble.getAttribute('data-category');

        if (otherCat === hoveredCategory) {
          const oRect = otherBubble.getBoundingClientRect();
          const oX = (oRect.left + oRect.width / 2) - rect.left;
          const oY = (oRect.top + oRect.height / 2) - rect.top;

          // Draw Glowing Luminous Line
          nCtx.beginPath();
          nCtx.moveTo(hX, hY);
          nCtx.lineTo(oX, oY);

          const grad = nCtx.createLinearGradient(hX, hY, oX, oY);
          grad.addColorStop(0, 'rgba(225, 29, 72, 0.6)');
          grad.addColorStop(1, 'rgba(139, 92, 246, 0.2)');

          nCtx.strokeStyle = grad;
          nCtx.lineWidth = 2;
          nCtx.stroke();

          // Node Halo Point
          nCtx.beginPath();
          nCtx.arc(oX, oY, 4, 0, Math.PI * 2);
          nCtx.fillStyle = '#e11d48';
          nCtx.shadowColor = '#e11d48';
          nCtx.shadowBlur = 8;
          nCtx.fill();
        }
      });
    }
  }

  /**
   * =========================================================================
   * Micro-Interactions Setup:
   * 1. Ambient Glow Follower
   * 2. 3D Perspective Card Tilt
   * 3. IntersectionObserver Scroll Reveals
   * 4. Real-time Local Time Indicator
   * =========================================================================
   */
  function setupMicroInteractions() {
    // 1. Ambient Glow Follower
    if (ambientGlow) {
      window.addEventListener('mousemove', (e) => {
        ambientGlow.style.left = `${e.clientX}px`;
        ambientGlow.style.top = `${e.clientY}px`;
      }, { passive: true });
    }

    // 2. 3D Card Tilt
    tiltElements.forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -5;
        const rotateY = ((x - centerX) / centerX) * 5;

        el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
      });
    });

    // 3. Scroll Reveal Observer
    if ('IntersectionObserver' in window) {
      const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
          }
        });
      }, { threshold: 0.12 });

      revealElements.forEach((el) => revealObserver.observe(el));
    } else {
      revealElements.forEach((el) => el.classList.add('is-revealed'));
    }

    // 4. Real-time Local Time Indicator
    function updateLocalTime() {
      if (!localTimeIndicator) return;
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Kolkata',
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      localTimeIndicator.textContent = `HYDERABAD, INDIA • ${timeStr} IST`;
    }

    updateLocalTime();
    setInterval(updateLocalTime, 1000);
  }

  /**
   * System Initialization
   */
  function init() {
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => {
      resizeCanvas();
      needsResize = true;
    }, { passive: true });

    resizeCanvas();
    onScroll();
    updateHeroScrollReveal(0);

    preloadImages();
    setupSkillsConstellation();
    setupMicroInteractions();
    requestAnimationFrame(renderLoop);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
