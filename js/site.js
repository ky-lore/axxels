(function(){
  "use strict";

  /* ---- logo swap: if logo.png loads, use it and hide CSS mark ---- */
  var logo = document.getElementById('brandLogo');
  if(logo){
    logo.addEventListener('load', function(){
      if(logo.naturalWidth > 1){
        logo.style.display = 'block';
        var mark = logo.parentElement.querySelector('.brand-mark');
        var word = logo.parentElement.querySelector('.brand-word');
        if(mark) mark.style.display='none';
        if(word) word.style.display='none';
      }
    });
  }

  /* ---- nav shrink on scroll ---- */
  var nav = document.getElementById('nav');
  var onScroll = function(){ nav.classList.toggle('shrink', window.scrollY > 20); };
  onScroll(); window.addEventListener('scroll', onScroll, {passive:true});

  /* ---- mobile drawer ---- */
  var drawer = document.getElementById('drawer');
  var toggle = document.getElementById('navToggle');
  var openDrawer = function(){ drawer.classList.add('open'); toggle.classList.add('open'); toggle.setAttribute('aria-expanded','true'); document.body.style.overflow='hidden'; };
  var closeDrawer = function(){ drawer.classList.remove('open'); toggle.classList.remove('open'); toggle.setAttribute('aria-expanded','false'); document.body.style.overflow=''; };
  toggle.addEventListener('click', function(){ drawer.classList.contains('open') ? closeDrawer() : openDrawer(); });
  drawer.querySelectorAll('[data-close]').forEach(function(el){ el.addEventListener('click', closeDrawer); });
  document.addEventListener('keydown', function(e){ if(e.key==='Escape') closeDrawer(); });

  /* ---- reveal on scroll ---- */
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  }, {threshold:.14, rootMargin:'0px 0px -40px 0px'});
  document.querySelectorAll('.reveal').forEach(function(el){ io.observe(el); });

  /* ---- animated counters ---- */
  var animateCount = function(el){
    var target = parseFloat(el.getAttribute('data-count'));
    var suf = el.getAttribute('data-suf') || '';
    var isFloat = target % 1 !== 0;
    var dur = 1500, start = null;
    var step = function(ts){
      if(!start) start = ts;
      var p = Math.min((ts - start)/dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = target * eased;
      el.textContent = (isFloat ? val.toFixed(1) : Math.round(val)) + suf;
      if(p < 1) requestAnimationFrame(step);
      else el.textContent = (isFloat ? target.toFixed(1) : target) + suf;
    };
    requestAnimationFrame(step);
  };
  var countIO = new IntersectionObserver(function(entries){
    entries.forEach(function(e){ if(e.isIntersecting){ animateCount(e.target); countIO.unobserve(e.target); } });
  }, {threshold:.6});
  document.querySelectorAll('[data-count]').forEach(function(el){ countIO.observe(el); });

  /* ---- duplicate ticker for seamless loop ---- */
  var ticker = document.getElementById('ticker');
  if(ticker){ ticker.innerHTML += ticker.innerHTML; }

  /* ---- forms (front-end demo handler) ---- */
  // [PH] wire these to a real endpoint / email service (Formspree, Netlify, etc.)
  var wireForm = function(formId, bodyId, successId){
    var form = document.getElementById(formId);
    if(!form) return;
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var name = form.querySelector('[name=name]');
      var phone = form.querySelector('[name=phone]');
      if(!name.value.trim() || !phone.value.trim()){
        (!name.value.trim() ? name : phone).focus();
        return;
      }
      document.getElementById(bodyId).style.display='none';
      document.getElementById(successId).classList.add('on');
      form.scrollIntoView({behavior:'smooth', block:'center'});
    });
  };
  wireForm('bidForm', 'formBody', 'formSuccess');
  wireForm('heroForm', 'hfBody', 'hfSuccess');

  /* ---- scroll parallax (floating 3D van etc.) ---- */
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pxEls = [].slice.call(document.querySelectorAll('[data-parallax]'));
  if(pxEls.length && !reduceMotion){
    var ticking = false;
    var applyParallax = function(){
      pxEls.forEach(function(el){
        var r = el.getBoundingClientRect();
        if(r.bottom < -200 || r.top > window.innerHeight + 200) return;
        var center = (r.top + r.height/2) - window.innerHeight/2;
        var f = parseFloat(el.getAttribute('data-parallax')) || 0.05;
        el.style.transform = 'translate3d(0,' + (center * -f).toFixed(1) + 'px,0)';
      });
      ticking = false;
    };
    var requestParallax = function(){ if(!ticking){ ticking = true; requestAnimationFrame(applyParallax); } };
    window.addEventListener('scroll', requestParallax, {passive:true});
    window.addEventListener('resize', requestParallax, {passive:true});
    applyParallax();
  }

  /* ---- year ---- */
  var y = document.getElementById('year');
  if(y) y.textContent = new Date().getFullYear();

  /* ---- smooth-close drawer on anchor + active nav highlight ---- */
  var sections = [].slice.call(document.querySelectorAll('section[id]'));
  var navlinks = [].slice.call(document.querySelectorAll('.nav-links a'));
  var spy = function(){
    var pos = window.scrollY + 120;
    var current = '';
    sections.forEach(function(s){ if(s.offsetTop <= pos) current = s.id; });
    navlinks.forEach(function(a){ a.style.color = a.getAttribute('href') === '#'+current ? 'var(--ink)' : ''; });
  };
  window.addEventListener('scroll', spy, {passive:true}); spy();

  /* ---- multi-page active nav (mark current page link) ---- */
  var path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.nav-links a, .drawer-panel a.dl').forEach(function(a){
    var href = (a.getAttribute('href') || '').split('#')[0].toLowerCase();
    if(href && href === path){ a.classList.add('active'); a.setAttribute('aria-current','page'); a.style.color='var(--ink)'; }
  });

  /* ---- lazy-play section videos: play only while on screen (saves battery/CPU) ---- */
  var vids = [].slice.call(document.querySelectorAll('video[data-autoplay]'));
  if(vids.length){
    if(reduceMotion){
      // respect reduced-motion: freeze on poster, don't autoplay
      vids.forEach(function(v){ v.removeAttribute('autoplay'); v.pause && v.pause(); });
    } else {
      var vio = new IntersectionObserver(function(entries){
        entries.forEach(function(e){
          var v = e.target;
          if(e.isIntersecting){ var p = v.play(); if(p && p.catch) p.catch(function(){}); }
          else { v.pause(); }
        });
      }, {threshold:.25});
      vids.forEach(function(v){ vio.observe(v); });
    }
  }

  /* ---- hero montage sound toggle (starts muted for autoplay) ---- */
  var heroVid = document.getElementById('heroVid');
  var soundBtn = document.getElementById('heroSound');
  if(heroVid && soundBtn){
    soundBtn.addEventListener('click', function(){
      heroVid.muted = !heroVid.muted;
      soundBtn.querySelector('.lbl').textContent = heroVid.muted ? 'Sound off' : 'Sound on';
      soundBtn.querySelector('use').setAttribute('href', heroVid.muted ? '#i-muted' : '#i-sound');
      if(!heroVid.muted){ var p = heroVid.play(); if(p && p.catch) p.catch(function(){}); }
    });
  }

})();
