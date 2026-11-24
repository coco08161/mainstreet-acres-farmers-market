/* The Farmers Market at Mainstreet Acres — interactions and motion (v2)
   Motion: GSAP + ScrollTrigger. Effects modeled on Skiper UI (words
   preloader, text-roll nav, expand-on-hover seed packets, card stack,
   text scroll reveal) and Componentry (scroll-velocity marquee, magnetic
   buttons, animated WebGL gradient). Content always shows without JS. */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var gsap = window.gsap;
  var ST = window.ScrollTrigger;
  var hasGsap = !!(gsap && ST);
  if (!hasGsap || reduce) root.classList.remove("anim");

  /* ---------- Header: solid on scroll, hides on scroll down ---------- */
  var chrome = document.querySelector(".chrome");
  var lastY = window.scrollY;
  function onScroll() {
    var y = window.scrollY;
    if (chrome) {
      chrome.classList.toggle("scrolled", y > 40);
      chrome.classList.toggle("hide", y > 320 && y > lastY && !document.body.classList.contains("menu-open"));
    }
    lastY = y;
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var toggle = document.querySelector(".menu-toggle");
  var mm = document.querySelector(".mobile-menu");
  function setMenu(open) {
    document.body.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.querySelector("b").textContent = open ? "Close" : "Menu";
    if (mm) mm.setAttribute("aria-hidden", String(!open));
    if (open && hasGsap && !reduce) gsap.fromTo(".mobile-menu nav a", { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .8, stagger: .07, ease: "power3.out", delay: .15 });
  }
  if (toggle) {
    toggle.addEventListener("click", function () { setMenu(!document.body.classList.contains("menu-open")); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && document.body.classList.contains("menu-open")) { setMenu(false); toggle.focus(); } });
    if (mm) mm.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
  }

  /* ---------- Spotlight origin for cards ---------- */
  document.querySelectorAll(".benefit, .value").forEach(function (card) {
    card.addEventListener("pointerenter", function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", (e.clientX - r.left) + "px");
      card.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  });

  /* ---------- FAQ: one open at a time ---------- */
  var faqs = document.querySelectorAll(".faq details");
  faqs.forEach(function (d) {
    d.addEventListener("toggle", function () {
      if (!d.open) return;
      faqs.forEach(function (o) { if (o !== d) o.open = false; });
      var ans = d.querySelector(".answer");
      if (ans && hasGsap && !reduce) gsap.fromTo(ans, { height: 0, opacity: 0 }, { height: "auto", opacity: 1, duration: .5, ease: "power3.out" });
    });
  });

  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Vendor application form ----------
     Safety: no double sends, loading state, 12 s timeout, error fallback that
     keeps what the vendor typed, honeypot, blank-only answers rejected. */
  var form = document.getElementById("vendor-form");
  if (form) {
    var category = document.getElementById("f-category");
    var foodBlock = document.getElementById("food-block");
    var errorEl = document.getElementById("form-error");
    var success = document.getElementById("form-success");
    var btn = form.querySelector('button[type="submit"]');
    var btnLabel = btn.querySelector(".label");
    var sending = false;

    var syncFood = function () {
      var opt = category.selectedOptions[0];
      foodBlock.classList.toggle("show", !!(opt && opt.hasAttribute("data-food")));
    };
    category.addEventListener("change", syncFood);
    syncFood();

    // Preselect the market day from Register links (apply.html?day=Saturday)
    var day = new URLSearchParams(location.search).get("day");
    if (day && window.CSS && CSS.escape) {
      var box = form.querySelector('input[name="Days"][value="' + CSS.escape(day) + '"]');
      if (box) box.checked = true;
    }

    var isFilled = function (el) {
      return el.checkValidity() && (el.type === "checkbox" || el.tagName === "SELECT" || el.value.trim() !== "");
    };
    form.addEventListener("input", function (e) { if (e.target.classList.contains("is-invalid") && isFilled(e.target)) e.target.classList.remove("is-invalid"); });
    form.addEventListener("change", function (e) { if (e.target.classList.contains("is-invalid") && isFilled(e.target)) e.target.classList.remove("is-invalid"); });

    var showSuccess = function () {
      form.style.display = "none";
      success.classList.add("show");
      success.focus({ preventScroll: true });
      success.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (sending) return;
      errorEl.textContent = "";
      var required = Array.prototype.slice.call(form.querySelectorAll("[required]"));
      var firstInvalid = null;
      required.forEach(function (el) { var ok = isFilled(el); el.classList.toggle("is-invalid", !ok); if (!ok && !firstInvalid) firstInvalid = el; });
      if (firstInvalid) {
        errorEl.textContent = firstInvalid.type === "checkbox" ? "Please check the box to confirm." : "Please fill in the highlighted field.";
        firstInvalid.focus();
        return;
      }
      if (form.querySelector('[name="_honey"]').value) { showSuccess(); return; } // bots: pretend, send nothing

      var payload = {};
      new FormData(form).forEach(function (raw, key) {
        var value = typeof raw === "string" ? raw.trim() : raw;
        payload[key] = payload[key] ? payload[key] + ", " + value : value;
      });

      sending = true; btn.disabled = true; btnLabel.textContent = "Sending…";
      var ctrl = new AbortController();
      var timer = setTimeout(function () { ctrl.abort(); }, 12000);
      fetch(form.action.replace("formsubmit.co/", "formsubmit.co/ajax/"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
        signal: ctrl.signal
      }).then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json().catch(function () { return {}; });
      }).then(function (json) {
        if (json.success === false || json.success === "false") throw new Error(json.message || "Not sent");
        showSuccess();
      }).catch(function () {
        errorEl.innerHTML = 'Something went wrong sending your application. Please try again, or email us at <a href="mailto:stephanie@cmgproducts.net">stephanie@cmgproducts.net</a>.';
        sending = false; btn.disabled = false; btnLabel.textContent = "Try again";
      }).then(function () { clearTimeout(timer); });
    });
  }

  /* ---------- Animated WebGL gradient (hay / honey / leaf) ---------- */
  document.querySelectorAll("canvas.gradient").forEach(function (canvas) {
    var gl = canvas.getContext("webgl", { antialias: false });
    if (!gl) { canvas.remove(); return; }
    var fs = [
      "precision mediump float;uniform vec2 r;uniform float t;uniform vec2 m;",
      "vec3 c1=vec3(.945,.843,.588);vec3 c2=vec3(.890,.718,.361);vec3 c3=vec3(.722,.412,.122);vec3 c4=vec3(.357,.541,.235);",
      "float n(vec2 p){return sin(p.x)*sin(p.y);}",
      "void main(){vec2 uv=gl_FragCoord.xy/r;vec2 q=uv*vec2(r.x/r.y,1.)*1.6;",
      "float a=n(q*1.3+vec2(t*.16,t*.1))+.5*n(q*2.7-vec2(t*.12,-t*.18))+.25*n(q*5.1+t*.06);",
      "a-=.36*length(uv-m);float b=n(q.yx*1.7+vec2(-t*.11,t*.14)+a);",
      "vec3 col=mix(c1,c2,smoothstep(-.9,.9,a));col=mix(col,c3,smoothstep(.45,1.25,b)*.45);col=mix(col,c4,smoothstep(.75,1.4,-b)*.35);",
      "float g=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);col+=(g-.5)*.04;",
      "gl_FragColor=vec4(col,1.);}"
    ].join("");
    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
    var prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}"));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.remove(); return; }
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var uR = gl.getUniformLocation(prog, "r"), uT = gl.getUniformLocation(prog, "t"), uM = gl.getUniformLocation(prog, "m");
    var mouse = [.5, .5], target = [.5, .5], visible = true, start = performance.now();
    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      canvas.width = Math.round(canvas.clientWidth * dpr * .6);
      canvas.height = Math.round(canvas.clientHeight * dpr * .6);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    function frame(now) {
      if (!visible) return;
      mouse[0] += (target[0] - mouse[0]) * .05; mouse[1] += (target[1] - mouse[1]) * .05;
      gl.uniform2f(uR, canvas.width, canvas.height);
      gl.uniform1f(uT, reduce ? 4 : (now - start) / 1000);
      gl.uniform2f(uM, mouse[0], mouse[1]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (!reduce) requestAnimationFrame(frame);
    }
    size();
    window.addEventListener("resize", function () { size(); if (reduce) frame(performance.now()); });
    canvas.parentNode.addEventListener("pointermove", function (e) {
      var r = canvas.getBoundingClientRect();
      target = [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height];
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { var was = visible; visible = en[0].isIntersecting; if (visible && !was) requestAnimationFrame(frame); }).observe(canvas);
    }
    requestAnimationFrame(frame);
  });

  /* ---------- Everything below needs GSAP ---------- */
  function endPreload() { root.classList.remove("preload"); try { sessionStorage.setItem("msa-intro", "1"); } catch (e) {} }
  if (!hasGsap || reduce) { endPreload(); return; }
  gsap.registerPlugin(ST);

  var bar = document.querySelector(".progress");
  if (bar) gsap.to(bar, { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: .3 } });

  function heroIn() {
    var tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    var bg = document.querySelector(".hero-bg");
    if (bg) tl.fromTo(bg, { scale: 1.15 }, { scale: 1, duration: 2.2 }, 0);
    var lines = document.querySelectorAll(".hero h1 .line > span");
    if (lines.length) tl.to(lines, { y: 0, duration: 1.4, stagger: .12 }, .2);
    var bits = document.querySelectorAll(".hero [data-reveal]");
    if (bits.length) tl.fromTo(bits, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, stagger: .1 }, .55);
  }

  if (root.classList.contains("preload")) {
    var pre = document.querySelector(".preloader");
    var word = pre && pre.querySelector(".word span");
    if (!pre || !word) { endPreload(); heroIn(); }
    else {
      var ptl = gsap.timeline({ onComplete: endPreload });
      ["Fresh.", "Local.", "Every weekend."].forEach(function (w) {
        ptl.call(function () { word.textContent = w; });
        ptl.fromTo(pre.querySelector(".word"), { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .45, ease: "power3.out" });
        ptl.to(pre.querySelector(".word"), { yPercent: -40, opacity: 0, duration: .35, ease: "power3.in" }, "+=.25");
      });
      ptl.to(pre, { clipPath: "inset(0 0 100% 0)", duration: 1, ease: "expo.inOut" });
      ptl.add(heroIn, "-=.6");
      setTimeout(function () { if (root.classList.contains("preload")) ptl.progress(1); }, 6000);
    }
  } else {
    heroIn();
  }

  var rest = gsap.utils.toArray("[data-reveal]").filter(function (el) { return !el.closest(".hero"); });
  gsap.set(rest, { y: 50, opacity: 0 });
  ST.batch(rest, { start: "top 88%", once: true, onEnter: function (b) { gsap.to(b, { y: 0, opacity: 1, duration: 1.1, ease: "power3.out", stagger: .1, overwrite: true }); } });

  gsap.utils.toArray("[data-clip]").forEach(function (el) {
    var img = el.querySelector("img") || el;
    gsap.timeline({ scrollTrigger: { trigger: el, start: "top 82%", once: true } })
      .to(el, { clipPath: "inset(0% 0 0 0)", duration: 1.4, ease: "expo.inOut" })
      .from(img, { scale: 1.3, duration: 1.8, ease: "expo.out" }, "<.1");
  });

  document.querySelectorAll(".statement").forEach(function (el) {
    (function split(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var s = document.createElement("span"); s.className = "w"; s.textContent = part; frag.appendChild(s);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) split(child);
      });
    })(el);
    gsap.to(el.querySelectorAll(".w"), { opacity: 1, stagger: .08, ease: "none", scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: .6 } });
  });

  document.querySelectorAll(".marquee-track").forEach(function (track) {
    var x = 0, dir = -1, base = .6, boost = 0, half = track.scrollWidth / 2;
    window.addEventListener("resize", function () { half = track.scrollWidth / 2; });
    ST.create({ trigger: track, start: "top bottom", end: "bottom top", onUpdate: function (s) { var v = s.getVelocity(); dir = v < 0 ? 1 : -1; boost = Math.min(Math.abs(v) / 120, 14); } });
    gsap.ticker.add(function () {
      boost *= .94; x += dir * (base + boost);
      if (x <= -half) x += half; if (x > 0) x -= half;
      track.style.transform = "translate3d(" + x + "px,0,0)";
    });
  });

  var cards = gsap.utils.toArray(".s-card");
  if (cards.length && window.matchMedia("(min-width: 901px)").matches) {
    cards.forEach(function (card, i) {
      if (i === cards.length - 1) return;
      gsap.to(card, { scale: .93, filter: "brightness(.88)", ease: "none", scrollTrigger: { trigger: cards[i + 1], start: "top bottom", end: "top 130px", scrub: true } });
    });
  }

  gsap.utils.toArray("[data-drift]").forEach(function (el) {
    gsap.fromTo(el, { xPercent: parseFloat(el.dataset.drift) }, { xPercent: 0, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "center 40%", scrub: .8 } });
  });

  var fw = document.querySelector(".footer-word");
  if (fw) gsap.fromTo(fw, { xPercent: 6 }, { xPercent: -6, ease: "none", scrollTrigger: { trigger: fw, start: "top bottom", end: "bottom top", scrub: true } });

  if (window.matchMedia("(hover: hover)").matches) {
    document.querySelectorAll("[data-magnetic]").forEach(function (el) {
      var xTo = gsap.quickTo(el, "x", { duration: .7, ease: "elastic.out(1, .4)" });
      var yTo = gsap.quickTo(el, "y", { duration: .7, ease: "elastic.out(1, .4)" });
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * .35); yTo((e.clientY - r.top - r.height / 2) * .45);
      });
      el.addEventListener("pointerleave", function () { xTo(0); yTo(0); });
    });
  }

  window.addEventListener("load", function () { ST.refresh(); });
})();
