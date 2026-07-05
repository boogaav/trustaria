(function () {
  var stage = document.getElementById('stage');
  var cv = document.getElementById('cv');
  var ctx = cv.getContext('2d');
  var fnEl = document.getElementById('fn');
  var snEl = document.getElementById('sn');
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var W = 0, H = 0;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var PAPER = '#dcdad5';
  var INK = '27,27,27';
  var IND = '87,94,207';

  var parts = [], pulses = [], locked = [];
  var slotIdx = 0;
  var COLS = 8, ROWS = 6, MAXSLOTS = COLS * ROWS;
  var fraudCount = 0, settled = 0;
  var mouse = { x: -999, y: -999 };
  var running = false, visible = true;

  function size() {
    var r = stage.getBoundingClientRect();
    W = r.width;
    H = r.height;
    cv.width = W * dpr;
    cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, W, H);
  }

  function gateX() { return W * 0.56; }

  function slotPos(i) {
    var c = i % COLS;
    var rw = Math.floor(i / COLS);
    var x0 = gateX() + (W - gateX()) * 0.22;
    var x1 = W - 44;
    var y0 = 70;
    var y1 = H - 80;
    return {
      x: x0 + c * (x1 - x0) / (COLS - 1),
      y: y0 + rw * (y1 - y0) / (ROWS - 1)
    };
  }

  function spawn(x, y, burst) {
    var fraud = burst ? true : Math.random() < 0.8;
    parts.push({
      x: x !== undefined ? x : -6,
      y: y !== undefined ? y : 24 + Math.random() * (H - 84),
      vx: (burst ? 1.6 : 0.7) + Math.random() * 1.1,
      vy: (Math.random() - 0.5) * (burst ? 2 : 0.6),
      fraud: fraud,
      r: fraud ? 1.6 + Math.random() : 2.4,
      state: 'flow',
      a: 1,
      ph: Math.random() * 6.28
    });
  }

  function update() {
    if (parts.length < 240 && Math.random() < 0.6) spawn();
    var gx = gateX();
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      if (p.state === 'flow') {
        p.ph += 0.08;
        p.vy += Math.sin(p.ph) * 0.02 + (Math.random() - 0.5) * 0.05;
        var dx = mouse.x - p.x, dy = mouse.y - p.y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < 150 && d > 4 && mouse.x < gx) {
          p.vx += dx / d * 0.06;
          p.vy += dy / d * 0.06;
        }
        p.vy *= 0.96;
        if (p.vx < 0.4) p.vx = 0.4;
        if (p.vx > 2.6) p.vx = 2.6;
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < 16) p.y = 16;
        if (p.y > H - 44) p.y = H - 44;
        if (p.x >= gx) {
          if (p.fraud) {
            p.state = 'die';
            p.vx = -0.3 + Math.random() * 0.6;
            p.vy = (Math.random() - 0.5) * 1.4;
            fraudCount++;
            fnEl.textContent = fraudCount;
            pulses.push({ x: gx, y: p.y, r: 2, a: 0.35, c: INK });
          } else {
            p.state = 'settle';
            var s = slotPos(slotIdx % MAXSLOTS);
            if (locked.length >= MAXSLOTS) locked.shift();
            p.tx = s.x;
            p.ty = s.y;
            slotIdx++;
            pulses.push({ x: gx, y: p.y, r: 2, a: 0.8, c: IND });
          }
        }
      } else if (p.state === 'die') {
        p.x += p.vx;
        p.y += p.vy;
        p.a -= 0.04;
        p.r *= 0.97;
        if (p.a <= 0) { parts.splice(i, 1); continue; }
      } else if (p.state === 'settle') {
        p.x += (p.tx - p.x) * 0.08;
        p.y += (p.ty - p.y) * 0.08;
        if (Math.abs(p.tx - p.x) < 1 && Math.abs(p.ty - p.y) < 1) {
          locked.push({ x: p.tx, y: p.ty });
          settled += 12 + Math.floor(Math.random() * 74);
          snEl.textContent = '$' + settled.toLocaleString();
          pulses.push({ x: p.tx, y: p.ty, r: 3, a: 0.9, c: IND });
          parts.splice(i, 1);
          continue;
        }
      }
    }
    for (var j = pulses.length - 1; j >= 0; j--) {
      var u = pulses[j];
      u.r += 1.4;
      u.a -= 0.035;
      if (u.a <= 0) pulses.splice(j, 1);
    }
  }

  function draw(full) {
    ctx.fillStyle = full ? PAPER : 'rgba(220,218,213,0.3)';
    ctx.fillRect(0, 0, W, H);
    var gx = gateX();
    ctx.strokeStyle = 'rgba(' + INK + ',0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(gx, 30);
    ctx.lineTo(gx, H - 50);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(' + INK + ',0.5)';
    ctx.beginPath();
    ctx.moveTo(gx - 4, 30); ctx.lineTo(gx + 4, 30);
    ctx.moveTo(gx - 4, H - 50); ctx.lineTo(gx + 4, H - 50);
    ctx.stroke();
    for (var k = 0; k < locked.length; k++) {
      ctx.fillStyle = 'rgba(' + IND + ',0.9)';
      ctx.fillRect(locked[k].x - 2, locked[k].y - 2, 4, 4);
    }
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (p.fraud) {
        ctx.strokeStyle = 'rgba(' + INK + ',' + (0.4 * p.a) + ')';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.29);
        ctx.stroke();
      } else {
        ctx.fillStyle = 'rgba(' + IND + ',' + (0.92 * p.a) + ')';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.29);
        ctx.fill();
      }
    }
    for (var j = 0; j < pulses.length; j++) {
      var u = pulses[j];
      ctx.strokeStyle = 'rgba(' + u.c + ',' + u.a + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(u.x, u.y, u.r, 0, 6.29);
      ctx.stroke();
    }
  }

  function loop() {
    if (!visible) { running = false; return; }
    update();
    draw(false);
    requestAnimationFrame(loop);
  }

  function start() {
    if (!running) {
      running = true;
      requestAnimationFrame(loop);
    }
  }

  size();
  new ResizeObserver(size).observe(stage);

  stage.addEventListener('pointermove', function (e) {
    var r = stage.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
  });

  stage.addEventListener('pointerleave', function () {
    mouse.x = -999;
    mouse.y = -999;
  });

  stage.addEventListener('pointerdown', function (e) {
    var r = stage.getBoundingClientRect();
    var mx = e.clientX - r.left;
    var my = e.clientY - r.top;
    for (var i = 0; i < 26; i++) {
      spawn(mx + (Math.random() - 0.5) * 40, my + (Math.random() - 0.5) * 40, true);
    }
  });

  if (RM) {
    for (var s = 0; s < 700; s++) update();
    draw(true);
    return;
  }

  new IntersectionObserver(function (entries) {
    visible = entries[0].isIntersecting;
    if (visible) start();
  }).observe(stage);

  start();
})();
