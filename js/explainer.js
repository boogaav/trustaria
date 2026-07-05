(function () {
  var st = document.getElementById('st');
  var msgs = document.getElementById('msgs');
  var stt = document.getElementById('stt');
  var title = document.getElementById('app-title');
  var nodes = [].slice.call(document.querySelectorAll('.nd'));
  var chips = [].slice.call(document.querySelectorAll('.chip'));
  var tabs = [].slice.call(document.querySelectorAll('.app-tab'));
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var run = 0;
  var hover = false;
  var mode = 'chat';
  var cur = 0;

  var TITLES = { chat: 'agent chat', shopper: 'shopper agent', voice: 'voice assistant' };

  var PLACE = {
    chat: 'native placement — no pixels, no impressions',
    shopper: 'native placement — inside the checkout loop',
    voice: 'native placement — spoken, not shown'
  };

  var SC = [
    {
      user: "What's the best espresso grinder under $300?",
      goal: 'Order the best espresso grinder under $300.',
      kws: ['espresso grinder', 'under $300'],
      node: 2, brand: 'Kaffa Labs',
      reply: 'For that budget, a flat-burr grinder wins on consistency. One solid pick:',
      vreply: 'Best fit is the Kaffa S1 flat-burr grinder at $249. Want me to order it?',
      prod: 'Kaffa S1 flat-burr grinder', price: '$249', pay: '$12.40'
    },
    {
      user: 'I need trail shoes that can handle a rainy season.',
      goal: 'Buy trail shoes that can handle a rainy season.',
      kws: ['trail shoes', 'rainy'],
      node: 4, brand: 'Northpeak Gear',
      reply: "You'll want an aggressive outsole plus a waterproof membrane:",
      vreply: 'Go with the Northpeak Ridge GTX at $158 — waterproof, aggressive tread. Order it?',
      prod: 'Northpeak Ridge GTX', price: '$158', pay: '$7.90'
    },
    {
      user: 'Recommend a gentle retinol for sensitive skin.',
      goal: 'Restock a gentle retinol for sensitive skin.',
      kws: ['retinol', 'sensitive skin'],
      node: 3, brand: 'Lumen Skin',
      reply: 'Encapsulated retinol is the gentlest route in. A well-reviewed option:',
      vreply: 'The Lumen 0.2% encapsulated retinol at $42 is the gentlest pick. Shall I order?',
      prod: 'Lumen 0.2% encapsulated retinol', price: '$42', pay: '$3.60'
    }
  ];

  function wait(ms) {
    return new Promise(function (r) { setTimeout(r, RM ? 0 : ms); });
  }

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  }

  function mark(text, kws) {
    var h = esc(text);
    kws.forEach(function (k) {
      h = h.replace(esc(k), '<span class="kw">' + esc(k) + '</span>');
    });
    return h;
  }

  function type(el, txt, r) {
    return new Promise(function (res) {
      if (RM) { el.textContent = txt; res(); return; }
      var i = 0;
      (function step() {
        if (r !== run) { res(); return; }
        el.textContent = txt.slice(0, ++i);
        if (i < txt.length) setTimeout(step, 16); else res();
      })();
    });
  }

  function fly(from, to) {
    if (RM || !from || !to) return Promise.resolve();
    var s = st.getBoundingClientRect();
    var f = from.getBoundingClientRect();
    var t = to.getBoundingClientRect();
    var d = document.createElement('div');
    d.className = 'fdot';
    d.style.left = (f.left - s.left + f.width / 2 - 4) + 'px';
    d.style.top = (f.top - s.top + f.height / 2 - 4) + 'px';
    st.appendChild(d);
    d.getBoundingClientRect();
    d.style.left = (t.left - s.left + t.width / 2 - 4) + 'px';
    d.style.top = (t.top - s.top + t.height / 2 - 4) + 'px';
    return wait(880).then(function () { d.remove(); });
  }

  function makeCard(sc, btnText) {
    var c = document.createElement('div');
    c.className = 'card';
    c.innerHTML = '<div class="card-name">' + sc.prod + ' — ' + sc.price + '</div>'
      + '<div class="card-badge">via aria · settles on purchase</div>'
      + '<button class="buy">' + btnText + '</button>';
    return c;
  }

  function showCard(c, host) {
    host.appendChild(c);
    c.getBoundingClientRect();
    c.classList.add('show');
  }

  function extractAndMatch(r, sc, holder) {
    stt.textContent = 'context extracted — zero-party, no cookies';
    var kw = holder.querySelectorAll('.kw');
    fly(kw[0], nodes[sc.node]);
    return wait(280).then(function () {
      return fly(kw[1] || kw[0], nodes[sc.node]);
    }).then(function () {
      if (r !== run) return;
      stt.textContent = 'matching against network…';
      var p = Promise.resolve();
      nodes.forEach(function (n) {
        p = p.then(function () {
          if (r !== run) return;
          n.classList.add('scan');
          return wait(120).then(function () { n.classList.remove('scan'); });
        });
      });
      return p;
    }).then(function () {
      if (r !== run) return;
      nodes[sc.node].classList.add('hit');
      stt.textContent = 'matched: ' + sc.brand;
      return wait(600);
    });
  }

  function settle(r, sc, btn, btnDone) {
    if (r !== run) return;
    btn.classList.add('ok');
    btn.textContent = btnDone;
    stt.textContent = 'settled on purchase · ' + sc.brand + ' pays ' + sc.pay;
  }

  function advance(i) {
    if (run !== i.r) return;
    if (hover) {
      setTimeout(function () { advance(i); }, 600);
      return;
    }
    play(i.next);
  }

  function finish(r, i) {
    if (r !== run || RM) return;
    return wait(3600).then(function () {
      advance({ r: r, next: (i + 1) % SC.length });
    });
  }

  function addStep(text, cls) {
    var s = document.createElement('div');
    s.className = 'step' + (cls ? ' ' + cls : '');
    s.textContent = text;
    msgs.appendChild(s);
    s.getBoundingClientRect();
    s.classList.add('show');
    return s;
  }

  function playChat(r, sc, i) {
    var u = document.createElement('div');
    u.className = 'bub u';
    msgs.appendChild(u);
    return type(u, sc.user, r).then(function () {
      if (r !== run) return;
      u.innerHTML = mark(sc.user, sc.kws);
      return extractAndMatch(r, sc, u);
    }).then(function () {
      if (r !== run) return;
      var a = document.createElement('div');
      a.className = 'bub a';
      a.innerHTML = '<span class="td"><span></span><span></span><span></span></span>';
      msgs.appendChild(a);
      return fly(nodes[sc.node], a).then(function () {
        return wait(350);
      }).then(function () {
        if (r !== run) return;
        a.innerHTML = '';
        var txt = document.createElement('div');
        a.appendChild(txt);
        return type(txt, sc.reply, r).then(function () { return a; });
      });
    }).then(function (a) {
      if (r !== run || !a) return;
      var c = makeCard(sc, 'Buy now');
      showCard(c, a);
      stt.textContent = PLACE.chat;
      return wait(1900).then(function () {
        settle(r, sc, c.querySelector('.buy'), '✓ purchase settled');
      });
    }).then(function () { return finish(r, i); });
  }

  function playShopper(r, sc, i) {
    var g = document.createElement('div');
    g.className = 'goal';
    g.innerHTML = '<span class="goal-k">task</span><span class="goal-t"></span>';
    msgs.appendChild(g);
    var gt = g.querySelector('.goal-t');
    return type(gt, sc.goal, r).then(function () {
      if (r !== run) return;
      gt.innerHTML = mark(sc.goal, sc.kws);
      addStep('✓ goal parsed');
      return extractAndMatch(r, sc, gt);
    }).then(function () {
      if (r !== run) return;
      addStep('✓ matched via aria — ' + sc.brand);
      return fly(nodes[sc.node], msgs).then(function () { return wait(300); });
    }).then(function () {
      if (r !== run) return;
      var c = makeCard(sc, 'checking out…');
      showCard(c, msgs);
      stt.textContent = PLACE.shopper;
      return wait(1000).then(function () {
        if (r !== run) return;
        addStep('→ checkout session opened');
        return wait(1200).then(function () {
          if (r !== run) return;
          addStep('✓ purchase settled — ' + sc.brand + ' pays ' + sc.pay, 'good');
          settle(r, sc, c.querySelector('.buy'), '✓ purchase settled');
        });
      });
    }).then(function () { return finish(r, i); });
  }

  function playVoice(r, sc, i) {
    var w = document.createElement('div');
    w.className = 'wave';
    for (var b = 0; b < 16; b++) {
      var bar = document.createElement('span');
      bar.style.animationDelay = (b * 0.07) + 's';
      w.appendChild(bar);
    }
    msgs.appendChild(w);
    w.classList.add('live');
    var u = document.createElement('div');
    u.className = 'vline';
    u.innerHTML = '<span class="vwho">user</span><span class="vtxt"></span>';
    msgs.appendChild(u);
    var ut = u.querySelector('.vtxt');
    return type(ut, '“' + sc.user + '”', r).then(function () {
      if (r !== run) return;
      w.classList.remove('live');
      ut.innerHTML = mark('“' + sc.user + '”', sc.kws);
      return extractAndMatch(r, sc, ut);
    }).then(function () {
      if (r !== run) return;
      var a = document.createElement('div');
      a.className = 'vline';
      a.innerHTML = '<span class="vwho">agent</span><span class="vtxt"></span>';
      msgs.appendChild(a);
      return fly(nodes[sc.node], a).then(function () {
        if (r !== run) return;
        w.classList.add('live');
        return type(a.querySelector('.vtxt'), sc.vreply, r);
      });
    }).then(function () {
      if (r !== run) return;
      w.classList.remove('live');
      var c = makeCard(sc, 'Confirm order');
      showCard(c, msgs);
      stt.textContent = PLACE.voice;
      return wait(1900).then(function () {
        settle(r, sc, c.querySelector('.buy'), '✓ ordered · settled');
      });
    }).then(function () { return finish(r, i); });
  }

  function play(i) {
    var r = ++run;
    cur = i;
    var sc = SC[i];
    chips.forEach(function (c, j) { c.classList.toggle('on', j === i); });
    msgs.innerHTML = '';
    nodes.forEach(function (n) { n.className = 'nd'; });
    stt.textContent = 'listening for intent';
    wait(500).then(function () {
      if (r !== run) return;
      if (mode === 'shopper') return playShopper(r, sc, i);
      if (mode === 'voice') return playVoice(r, sc, i);
      return playChat(r, sc, i);
    });
  }

  st.addEventListener('pointerenter', function () { hover = true; });
  st.addEventListener('pointerleave', function () { hover = false; });

  chips.forEach(function (c) {
    c.addEventListener('click', function () { play(+c.dataset.i); });
  });

  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      if (mode === t.dataset.m) return;
      mode = t.dataset.m;
      tabs.forEach(function (x) { x.classList.toggle('on', x === t); });
      title.textContent = TITLES[mode];
      play(cur);
    });
  });

  play(0);
})();
