(() => {
  'use strict';
  const config = window.portfolioAnalyticsConfig || {};
  const debug = new URLSearchParams(location.search).get('analytics-debug') === '1';
  const sections = new Set(['home','services','work','films','vision','approach','about','questions','contact']);
  const state = {enabled: false, debug, sent: 0, queued: 0};
  const queue = [];
  const viewed = new Set();
  const videoFlags = new Set();
  const dwell = new Map();
  const sitePath = location.pathname;
  let lastNav = {id:'', at:0};
  const referrer = (() => {try {const u = new URL(document.referrer);return u.origin + u.pathname;} catch {return '';}})();
  const label = name => 'Portfolio: ' + name.replaceAll('-', ' ');
  function send(payload) {
    if (debug) console.info('[Portfolio analytics preview] ' + JSON.stringify(payload));
    if (!state.enabled || document.visibilityState === 'hidden') return;
    if (window.goatcounter && typeof window.goatcounter.count === 'function') {
      try {window.goatcounter.count(payload);state.sent++;} catch { /* Never interrupt a visitor action. */ }
    } else if (queue.length < 50) {queue.push(payload);state.queued = queue.length;}
  }
  function event(name) {send({path:name,title:label(name),event:true,no_session:true,referrer:''});}
  function navigation(id) {
    if (!sections.has(id)) return;
    const now = Date.now();
    if (lastNav.id === id && now - lastNav.at < 1200) return;
    lastNav = {id,at:now};event('section-click-' + id);
  }
  let endpoint;
  try {endpoint = new URL(config.endpoint);} catch {endpoint = null;}
  const liveHost = location.hostname === 'abdulrahmaniq7.github.io' || location.hostname === 'abdul-rehaman-engineering-portfolio.rockyharp18.chatgpt.site';
  // Account destination must be an explicit GoatCounter HTTPS endpoint, never a placeholder.
  if (config.enabled === true && endpoint && endpoint.protocol === 'https:' && endpoint.hostname.endsWith('.goatcounter.com') && endpoint.pathname === '/count' && !endpoint.username && !endpoint.password && !endpoint.search && !endpoint.hash && liveHost && !debug) {
    state.enabled = true;
    window.goatcounter = {no_onload:true,no_events:true};
    const script = document.createElement('script');script.async = true;script.src = 'https://gc.zgo.at/count.js';
    script.setAttribute('data-goatcounter', endpoint.href);
    script.addEventListener('load', () => {
      if (!window.goatcounter || typeof window.goatcounter.count !== 'function') return;
      const pending = queue.splice(0);state.queued = 0;pending.forEach(send);
    });
    script.addEventListener('error', () => {state.enabled = false;queue.length = 0;state.queued = 0;});
    document.head.append(script);
    const notice = document.getElementById('analytics-notice');if (notice) notice.hidden = false;
  }
  window.portfolioAnalytics = Object.freeze({status:() => ({...state})});
  // Exactly one real page visit; section engagement is recorded as events, not extra pageviews.
  send({path:sitePath,title:document.title,referrer});
  if (!state.enabled && !debug) return;
  document.addEventListener('click', e => {
    const el = e.target.closest('a,button');if (!el) return;
    const href = el.getAttribute('href') || '';
    if (href.startsWith('#')) navigation(href.slice(1));
    if (el.closest('.media-share')) {
      const card = el.closest('.reel-card');const media = card ? card.id.replace('watch-','') : 'presentation';
      const platform = el.tagName === 'BUTTON' ? (el.textContent.includes('Copy')?'copy-link':'native') : (() => {try {const u = new URL(href);return ({'wa.me':'whatsapp','www.facebook.com':'facebook','www.linkedin.com':'linkedin','twitter.com':'x','t.me':'telegram','www.reddit.com':'reddit'})[u.hostname] || (u.protocol==='mailto:'?'email':'other');} catch {return 'other';}})();
      event('share-click-' + media + '-' + platform);return;
    }
    if (href.includes('Abdul_Rehaman_A_Resume.pdf')) event('resume-download-click');
    else if (href.includes('assets/media/') && el.hasAttribute('download')) event('video-download-click-' + href.split('/').pop().replace('.mp4',''));
    else if (el.id === 'request-blueprint' || el.closest('#abdul-answer') && href.startsWith('mailto:')) event('scope-request-click');
    else if (el.id === 'email-project' || href.startsWith('mailto:abdulrahmaniq7')) event('email-enquiry-click');
    else if (el.matches('[data-interest],.nav-contact') || href === '#contact') event('discuss-idea-click');
    else if (href.startsWith('https://wa.me/919741308828')) event('contact-whatsapp-click');
    if (el.id === 'abdul-launch' && el.getAttribute('aria-expanded') === 'true') event('assistant-open');
  });
  document.querySelectorAll('#films video').forEach((video,index) => {
    const id = ['presentation','amenities','access','ai'][index];if (!id) return;
    function once(action) {const key=id+'-'+action;if(videoFlags.has(key))return;videoFlags.add(key);event('video-'+key);}
    video.addEventListener('play',()=>once('play'));
    video.addEventListener('ended',()=>once('complete'));
    video.addEventListener('timeupdate',()=>{if(!Number.isFinite(video.duration)||video.duration<=0)return;for(const n of [25,50,75])if(video.currentTime/video.duration*100>=n)once('progress-'+n);});
  });
  if ('IntersectionObserver' in window) {
    // A narrow viewport band works for both short and very tall single-page sections.
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      const id = entry.target.id;if (!sections.has(id)) return;
      clearTimeout(dwell.get(id));dwell.delete(id);
      if (entry.isIntersecting && !viewed.has(id) && document.visibilityState !== 'hidden') {
        dwell.set(id,setTimeout(()=>{dwell.delete(id);if(document.visibilityState==='hidden'||viewed.has(id))return;viewed.add(id);event('section-view-'+id);},1000));
      }
    }), {rootMargin:'-15% 0px -55% 0px',threshold:0});
    document.querySelectorAll('[data-track]').forEach(section=>observer.observe(section));
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){dwell.forEach(clearTimeout);dwell.clear();}});
  }
})();
