(function (root) {
  'use strict';
  var DAY = 86400000;

  var CATS = [
    { id: 'treats', name: 'Treats', icon: 'Treats', color: '#D6336C', tint: '#FFEAF1' },
    { id: 'food', name: 'Food at home', icon: 'Food at home', color: '#E8590C', tint: '#FFF1E5' },
    { id: 'transport', name: 'Transport', icon: 'Transport', color: '#1C64F2', tint: '#E8F1FF' },
    { id: 'fuel', name: 'Fuel', icon: 'Fuel', color: '#B7791F', tint: '#FFF6D6' },
    { id: 'data', name: 'Data & phone', icon: 'Data & phone', color: '#6741D9', tint: '#F0EBFF' },
    { id: 'subs', name: 'Subscriptions', icon: 'Subscriptions', color: '#C026D3', tint: '#FAE8FF' },
    { id: 'household', name: 'Household', icon: 'Household', color: '#0C8599', tint: '#E3F7F5' },
    { id: 'bills', name: 'Bills', icon: 'Bills', color: '#475467', tint: '#EEF1F5' },
    { id: 'partner', name: 'Partner', icon: 'Partner', color: '#E03131', tint: '#FFE8E8' },
    { id: 'pets', name: 'Pets', icon: 'Pets', color: '#9C6644', tint: '#F5EEE6' },
    { id: 'other', name: 'Other', icon: 'Other', color: '#667085', tint: '#F0F1F2' }
  ];
  var WORK = { id: 'work', name: 'Work costs', icon: 'Work', color: '#3B4CCA', tint: '#EAEDFF' };
  var SPLIT = { food: 0.24, treats: 0.18, transport: 0.14, fuel: 0.10, data: 0.08, subs: 0.06, household: 0.10, other: 0.10 };
  var PALETTE = [['#D6336C', '#FFEAF1'], ['#E8590C', '#FFF1E5'], ['#B7791F', '#FFF6D6'], ['#2F9E44', '#E6F6E9'], ['#0C8599', '#E3F7F5'],
    ['#1C64F2', '#E8F1FF'], ['#6741D9', '#F0EBFF'], ['#C026D3', '#FAE8FF'], ['#9C6644', '#F5EEE6'], ['#475467', '#EEF1F5']];
  // Pots people add themselves, and new names for the built-in ones. Set from state on every render.
  var CUSTOM = [], NAMES = {};
  function setCustom(list, names) { CUSTOM = list || []; NAMES = names || {}; }
  function named(c) { return NAMES[c.id] ? Object.assign({}, c, { name: NAMES[c.id] }) : c; }
  function allCats() { return CATS.slice(0, -1).concat(CUSTOM).concat([CATS[CATS.length - 1]]).map(named); }
  var SOURCES = ['Salary', 'Client work', 'Side gig', 'Gift', 'Refund', 'Other'];
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var WDF = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  function cat(id) {
    if (id === 'work') return WORK;
    var list = CATS.concat(CUSTOM);
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return named(list[i]);
    return named(CATS[CATS.length - 1]);
  }

  // ---------- dates (local time, day keys YYYY-MM-DD) ----------
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function dkey(t) { var d = new Date(t); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseKey(k) { var p = k.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function addDays(k, n) { var d = parseKey(k); d.setDate(d.getDate() + n); return dkey(d); }
  function diffDays(a, b) { return Math.round((parseKey(b) - parseKey(a)) / DAY); }
  function weekStart(k) { var d = parseKey(k); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return dkey(d); }
  function monthStart(k) { return k.slice(0, 8) + '01'; }
  function daysInMonth(k) { var d = parseKey(k); return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); }
  function periodStart(rhythm, k) { return rhythm === 'month' ? monthStart(k) : weekStart(k); }
  function periodEnd(rhythm, start) { return rhythm === 'month' ? addDays(start, daysInMonth(start) - 1) : addDays(start, 6); }
  function shiftPeriod(unit, start, n) {
    if (unit === 'month') { var d = parseKey(start); d.setDate(1); d.setMonth(d.getMonth() + n); return dkey(d); }
    return addDays(start, 7 * n);
  }
  function rangeLabel(start, end, unit) {
    var a = parseKey(start), b = parseKey(end);
    if (unit === 'month') return MONTHS[a.getMonth()] + ' ' + a.getFullYear();
    if (a.getMonth() === b.getMonth()) return a.getDate() + '–' + b.getDate() + ' ' + MON[b.getMonth()];
    return a.getDate() + ' ' + MON[a.getMonth()] + ' – ' + b.getDate() + ' ' + MON[b.getMonth()];
  }
  function dayLabel(k, today) {
    if (k === today) return 'Today';
    if (k === addDays(today, -1)) return 'Yesterday';
    var d = parseKey(k);
    return WD[d.getDay()] + ' ' + d.getDate() + ' ' + MON[d.getMonth()];
  }
  function shortDate(k) { var d = parseKey(k); return WD[d.getDay()] + ' ' + d.getDate() + ' ' + MON[d.getMonth()]; }
  function weekdayName(k) { return WDF[parseKey(k).getDay()]; }
  function timeLabel(t) {
    var d = new Date(t), h = d.getHours(), m = d.getMinutes();
    var ap = h >= 12 ? 'pm' : 'am'; h = h % 12; if (h === 0) h = 12;
    return h + ':' + pad(m) + ' ' + ap;
  }
  function hhmm(t) { var d = new Date(t); return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function time12(s) { var p = s.split(':'); var d = new Date(2000, 0, 1, +p[0], +p[1]); return timeLabel(d.getTime()); }

  // ---------- money ----------
  function naira(n) {
    var neg = n < 0; n = Math.round(Math.abs(n));
    return (neg ? '−' : '') + '₦' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  function short(n) {
    if (n >= 1000000) return '₦' + (Math.round(n / 100000) / 10) + 'm';
    if (n >= 1000) return '₦' + (Math.round(n / 100) / 10) + 'k';
    return '₦' + Math.round(n);
  }
  function roundTo(n, step) { return Math.round(n / step) * step; }
  function down50(n) { return Math.floor(n / 50) * 50; }
  function up50(n) { return Math.ceil(n / 50) * 50; }

  // ---------- state ----------
  // v2: many budgets. Spending entries carry a budget id (bid); money in belongs to the person, not a budget.
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function blankState() {
    return {
      v: 2, name: '', treatWarn: true, reminder: { on: true, time: '20:00' }, reminderAsked: false,
      entries: [], checkins: [], savings: 0, budgets: [], lastBid: null, mainBid: null, customCats: [], catNames: {}, balance: null, nudgeOff: null, offset: 0, sample: false, updatedAt: 0
    };
  }
  function newBudget(o, now) {
    var today = dkey(now);
    var b = {
      id: uid(), name: o.name || 'Budget', kind: o.kind === 'once' ? 'once' : 'repeat', rhythm: o.rhythm === 'month' ? 'month' : 'week',
      cats: o.cats || {}, start: o.start || today, end: o.end || null, history: [], periodStart: null, closed: false,
      bannerSeen: null, reviewSeen: null, done: {}, createdAt: now
    };
    if (b.kind === 'repeat') { b.periodStart = periodStart(b.rhythm, today); b.start = null; b.end = null; }
    return b;
  }
  function findBudget(state, id) {
    for (var i = 0; i < state.budgets.length; i++) if (state.budgets[i].id === id) return state.budgets[i];
    return null;
  }
  function unitOf(b) { return b.kind === 'once' ? 'once' : b.rhythm; }
  function totalBudget(c) { var s = 0; for (var k in (c || {})) s += (+c[k] || 0); return s; }
  function autoSplit(total) {
    var step = total >= 20000 ? 500 : 100, c = {}, s = 0;
    Object.keys(SPLIT).forEach(function (id) { c[id] = Math.floor(total * SPLIT[id] / step) * step; s += c[id]; });
    c.other += total - s;
    allCats().forEach(function (x) { if (!(x.id in c)) c[x.id] = 0; });
    return c;
  }
  function convertBudgets(c, to, todayKey) {
    var f = to === 'month' ? daysInMonth(todayKey) / 7 : 7 / daysInMonth(todayKey);
    var out = {};
    allCats().forEach(function (x) { var v = (+c[x.id] || 0) * f; out[x.id] = v ? Math.max(100, roundTo(v, v >= 5000 ? 500 : 100)) : 0; });
    return out;
  }
  function migrate(s) {
    if (!s) return null;
    if (s.v === 2) {
      if (!s.customCats) s.customCats = [];
      if (!s.catNames) s.catNames = {};
      if (s.balance === undefined) s.balance = null;
      if (!s.mainBid && s.budgets.length) s.mainBid = (s.budgets.filter(function (b) { return b.kind === 'repeat'; })[0] || s.budgets[0]).id;
      return s;
    }
    var n = blankState();
    n.name = s.name || ''; n.treatWarn = s.treatWarn !== false; n.reminder = s.reminder || n.reminder; n.reminderAsked = !!s.setupDone;
    n.checkins = s.checkins || []; n.savings = s.savings || 0; n.offset = s.offset || 0; n.sample = !!s.sample; n.updatedAt = s.updatedAt || 0;
    n.entries = (s.entries || []).map(function (e) { return Object.assign({}, e); });
    if (s.setupDone) {
      var b = {
        id: uid(), name: 'Everyday', kind: 'repeat', rhythm: s.rhythm || 'week', cats: s.budgets || {}, start: null, end: null,
        history: s.history || [], periodStart: s.periodStart, closed: false, bannerSeen: s.bannerSeen || null,
        reviewSeen: s.reviewSeen || null, done: s.done || {}, createdAt: Date.now()
      };
      n.budgets = [b]; n.lastBid = b.id; n.mainBid = b.id;
      n.entries.forEach(function (e) { if (e.type === 'out') e.bid = b.id; });
    }
    return n;
  }

  // ---------- entries ----------
  function entryDay(e) { return dkey(e.ts); }
  function inRange(e, a, b) { var k = entryDay(e); return k >= a && k <= b; }
  function personalOut(e) { return e.type === 'out' && !e.work; }
  function sum(list) { var s = 0; for (var i = 0; i < list.length; i++) s += list[i].amount; return s; }
  function catTotals(list) { var o = {}; list.forEach(function (e) { o[e.cat] = (o[e.cat] || 0) + e.amount; }); return o; }
  function byNewest(a, b) { return b.ts - a.ts; }
  function ofBudget(state, b) { return state.entries.filter(function (e) { return e.bid === b.id; }); }

  function activeDays(state) {
    var s = {};
    (state.checkins || []).forEach(function (k) { s[k] = 1; });
    state.entries.forEach(function (e) { s[entryDay(e)] = 1; });
    return s;
  }
  function streak(state, now) {
    var s = activeDays(state), k = dkey(now), n = 0;
    if (!s[k]) k = addDays(k, -1);
    while (s[k]) { n++; k = addDays(k, -1); }
    return n;
  }
  function loggedOn(state, k) { return !!activeDays(state)[k]; }
  function bestStreak(state) {
    var days = Object.keys(activeDays(state)).sort(), best = 0, run = 0, prev = null;
    days.forEach(function (k) { run = prev && addDays(prev, 1) === k ? run + 1 : 1; best = Math.max(best, run); prev = k; });
    return best;
  }
  // Badges: small rewards for good habits. Nothing here ever points at overspending.
  function badges(state, now) {
    var b = mainBudget(state), u = b && b.rhythm === 'month' ? 'month' : 'week';
    var hist = b ? b.history.filter(function (h) { return h.active; }) : [];
    var cur = streak(state, now), best = Math.max(bestStreak(state), cur), saved = state.savings || 0;
    return [
      { id: 'first', icon: 'calendar', name: 'First ' + u + ' done', text: 'Finish your first budget ' + u, got: hist.length > 0 },
      { id: 'streak7', icon: 'fire', name: '7-day streak', text: 'Log 7 days in a row', got: best >= 7, prog: Math.min(cur, 7) / 7 },
      { id: 'under', icon: 'target', name: 'Under budget', text: 'Finish a ' + u + ' with money left', got: hist.some(function (h) { return h.spent <= h.budget; }) },
      { id: 'save10k', icon: 'piggy', name: '\u20a610k left over', text: 'Have \u20a610,000 left over in total', got: saved >= 10000, prog: Math.min(saved, 10000) / 10000 },
      { id: 'nospend', icon: 'star', name: 'No-spend day', text: 'Have a day you spend nothing', got: (state.checkins || []).length > 0 },
      { id: 'cover', icon: 'coins', name: 'Covered an allocation', text: 'Move money to cover an allocation', got: !!state.covered }
    ];
  }

  function treatInfo(state, b, spent) {
    var limit = +b.cats.treats || 0;
    var r = { limit: limit, spent: spent, left: limit - spent, ratio: limit ? spent / limit : 0, state: 'none' };
    if (!limit) return r;
    if (spent > limit) r.state = 'over';
    else if (state.treatWarn !== false && spent >= 0.8 * limit) r.state = 'near';
    else r.state = 'ok';
    return r;
  }

  function currentRange(b, today) {
    if (b.kind === 'once') return { start: b.start, end: b.end };
    var s = periodStart(b.rhythm, today);
    return { start: s, end: periodEnd(b.rhythm, s) };
  }
  function phaseOf(b, today) {
    if (b.kind !== 'once') return 'live';
    return today < b.start ? 'upcoming' : today > b.end ? 'ended' : 'live';
  }

  // Pot sizes for one period: the budget's plan plus any "cover" moves made for that period only.
  function potCats(b, start) {
    var c = Object.assign({}, b.cats);
    if (b.adj && b.adj.start === start) for (var k in b.adj.d) c[k] = (+c[k] || 0) + b.adj.d[k];
    return c;
  }
  function coverPot(b, start, from, to, amt) {
    if (!b.adj || b.adj.start !== start) b.adj = { start: start, d: {} };
    b.adj.d[from] = (b.adj.d[from] || 0) - amt;
    b.adj.d[to] = (b.adj.d[to] || 0) + amt;
  }
  // Take money a pot won't need this period and put it in savings straight away.
  function saveFromPot(state, b, start, id, amt) {
    if (!b.adj || b.adj.start !== start) b.adj = { start: start, d: {} };
    b.adj.d[id] = (b.adj.d[id] || 0) - amt;
    state.savings = (state.savings || 0) + amt;
  }
  function potsOf(state, cats, byCat) {
    var out = [];
    allCats().forEach(function (c) {
      var bud = +cats[c.id] || 0, sp = byCat[c.id] || 0;
      if (!bud && !sp) return;
      var st = !bud ? 'none' : sp > bud ? 'over' : (state.treatWarn !== false && sp >= 0.8 * bud) ? 'near' : 'ok';
      out.push({ id: c.id, budget: bud, spent: sp, left: bud - sp, ratio: bud ? sp / bud : 0, state: st });
    });
    return out;
  }

  // Live numbers for a budget's current period (or its whole span, for a one-off).
  function status(state, b, now) {
    var today = dkey(now), r = currentRange(b, today), phase = phaseOf(b, today);
    var cats = potCats(b, r.start), budget = totalBudget(cats);
    var ents = ofBudget(state, b).filter(function (e) { return inRange(e, r.start, r.end); });
    var pers = ents.filter(personalOut);
    var spentToday = 0, spentOther = 0;
    pers.forEach(function (e) { if (phase === 'live' && entryDay(e) === today) spentToday += e.amount; else spentOther += e.amount; });
    var spent = spentToday + spentOther, left = budget - spent;
    var daysLeft = phase === 'live' ? diffDays(today, r.end) + 1 : phase === 'upcoming' ? diffDays(r.start, r.end) + 1 : 0;
    var share = daysLeft ? Math.max(0, budget - spentOther) / daysLeft : 0;
    var safeToday = phase === 'live' ? share - spentToday : 0;
    var mode = phase !== 'live' ? phase : left < 0 ? 'over' : (budget && left < 0.2 * budget) ? 'low' : 'ok';
    var byCat = catTotals(pers), pots = potsOf(state, cats, byCat);
    var pace = phase === 'live' && left > 0 ? down50(left / daysLeft) : 0;
    return {
      today: today, start: r.start, end: r.end, unit: unitOf(b), phase: phase, budget: budget, spent: spent, left: left,
      spentToday: spentToday, daysLeft: daysLeft, share: share, safeToday: safeToday,
      safeShown: mode === 'ok' ? down50(safeToday) : 0, overToday: safeToday < 0 ? up50(-safeToday) : 0, perDay: down50(share),
      mode: mode, byCat: byCat, cats: cats, pots: pots, pace: pace,
      work: sum(ents.filter(function (e) { return e.type === 'out' && e.work; })),
      todayEntries: ents.filter(function (e) { return entryDay(e) === today; }).sort(byNewest),
      nextStart: b.kind === 'once' ? null : addDays(r.end, 1)
    };
  }

  // Person-wide numbers for the dashboard: this calendar month across every budget.
  function monthSummary(state, now) {
    var today = dkey(now), ms = monthStart(today), me = addDays(ms, daysInMonth(ms) - 1);
    var ents = state.entries.filter(function (e) { return inRange(e, ms, me); });
    return {
      start: ms, end: me, label: MONTHS[parseKey(ms).getMonth()],
      moneyIn: sum(ents.filter(function (e) { return e.type === 'in'; })),
      spent: sum(ents.filter(function (e) { return e.type === 'out'; })),
      incomeEntries: ents.filter(function (e) { return e.type === 'in'; }).sort(byNewest),
      todayEntries: state.entries.filter(function (e) { return entryDay(e) === today; }).sort(byNewest)
    };
  }

  // ---------- money you have, runway, months ----------
  // One budget per person for now: the main repeating budget (older one-off budgets stay stored but unused).
  function mainBudget(state) {
    var m = findBudget(state, state.mainBid);
    return m && m.kind === 'repeat' ? m : state.budgets.filter(function (b) { return b.kind === 'repeat'; })[0] || null;
  }
  function balanceNow(state, now) {
    if (!state.balance) return null;
    var v = state.balance.amount, t = state.balance.ts;
    state.entries.forEach(function (e) { if (e.ts > t && e.ts <= now) v += e.type === 'in' ? e.amount : -e.amount; });
    return v;
  }
  // How long the money you have lasts at your repeating budgets, after setting aside what one-offs still need.
  function runway(state, now) {
    var bal = balanceNow(state, now), today = dkey(now), weekly = 0, held = 0;
    state.budgets.forEach(function (b) {
      if (b.kind === 'repeat') weekly += b.rhythm === 'month' ? totalBudget(b.cats) * 7 / 30.44 : totalBudget(b.cats);
      else if (phaseOf(b, today) !== 'ended') held += Math.max(0, status(state, b, now).left);
    });
    if (bal == null) return { balance: null };
    var free = bal - held;
    return { balance: bal, held: held, weekly: weekly, weeks: weekly ? Math.max(0, free) / weekly : null };
  }
  function monthView(state, now, offset) {
    var ms = shiftPeriod('month', monthStart(dkey(now)), offset || 0), me = addDays(ms, daysInMonth(ms) - 1);
    var ents = state.entries.filter(function (e) { return inRange(e, ms, me); });
    var ins = ents.filter(function (e) { return e.type === 'in'; }), outs = ents.filter(function (e) { return e.type === 'out'; });
    var byBudget = state.budgets.map(function (b) {
      return { id: b.id, name: b.name, spent: sum(outs.filter(function (e) { return e.bid === b.id && !e.work; })) };
    }).filter(function (x) { return x.spent > 0; }).sort(function (a, b) { return b.spent - a.spent; });
    var sources = {};
    ins.forEach(function (e) { var k = e.source || 'Other'; sources[k] = (sources[k] || 0) + e.amount; });
    var moneyIn = sum(ins), spent = sum(outs);
    return {
      start: ms, end: me, label: MONTHS[parseKey(ms).getMonth()] + ' ' + parseKey(ms).getFullYear(), short: MONTHS[parseKey(ms).getMonth()],
      moneyIn: moneyIn, spent: spent, kept: moneyIn - spent, work: sum(outs.filter(function (e) { return e.work; })),
      byBudget: byBudget, sources: Object.keys(sources).map(function (k) { return { name: k, amount: sources[k] }; }).sort(function (a, b) { return b.amount - a.amount; }),
      incomeEntries: ins.sort(byNewest)
    };
  }

  // ---------- periods, rollover, savings ----------
  function summarize(state, b, ps, pe) {
    var cats = potCats(b, ps), budget = totalBudget(cats);
    var ents = ofBudget(state, b).filter(function (e) { return inRange(e, ps, pe); });
    var pers = ents.filter(personalOut), spent = sum(pers);
    var active = ents.length > 0 || (b.kind === 'repeat' && (state.checkins || []).some(function (k) { return k >= ps && k <= pe; }));
    var leftover = budget - spent;
    return {
      start: ps, end: pe, rhythm: unitOf(b), budget: budget, budgets: cats, spent: spent, byCat: catTotals(pers),
      work: sum(ents.filter(function (e) { return e.type === 'out' && e.work; })),
      active: active, saved: active && leftover > 0 ? leftover : 0, over: leftover < 0 ? -leftover : 0
    };
  }
  function needsRollover(state, b, now) {
    var today = dkey(now);
    if (b.kind === 'once') return !b.closed && today > b.end;
    return !!b.periodStart && b.periodStart < periodStart(b.rhythm, today);
  }
  function anyRollover(state, now) {
    return state.budgets.some(function (b) { return needsRollover(state, b, now); });
  }
  // Closes finished periods: leftovers move to savings. Mutates state and budget.
  function rollover(state, b, now) {
    var today = dkey(now), closed = [];
    if (b.kind === 'once') {
      if (!b.closed && today > b.end) {
        var s1 = summarize(state, b, b.start, b.end);
        s1.active = true; s1.saved = Math.max(0, s1.budget - s1.spent);
        b.history.push(s1); b.closed = true;
        if (s1.saved > 0) state.savings = (state.savings || 0) + s1.saved;
        closed.push(s1);
      }
      return closed;
    }
    var cur = periodStart(b.rhythm, today), guard = 0;
    if (!b.periodStart) { b.periodStart = cur; return closed; }
    while (b.periodStart < cur && guard++ < 200) {
      var ps = b.periodStart, pe = periodEnd(b.rhythm, ps);
      var s = summarize(state, b, ps, pe);
      b.history.push(s);
      if (s.saved > 0) state.savings = (state.savings || 0) + s.saved;
      closed.push(s);
      b.periodStart = addDays(pe, 1);
    }
    if (b.periodStart > cur) b.periodStart = cur;
    return closed;
  }
  function rolloverAll(state, now) {
    var out = [];
    state.budgets.forEach(function (b) { out = out.concat(rollover(state, b, now)); });
    return out;
  }

  // Any week or month of a repeating budget (or the whole span of a one-off), for the Spending tab.
  function rangeView(state, b, unit, offset, now) {
    var today = dkey(now), start, end, base, f = 1;
    if (b.kind === 'once') { start = b.start; end = b.end; base = potCats(b, b.start); unit = 'once'; offset = 0; }
    else {
      start = shiftPeriod(unit, unit === 'month' ? monthStart(today) : weekStart(today), offset);
      end = unit === 'month' ? addDays(start, daysInMonth(start) - 1) : addDays(start, 6);
      var hist = null;
      b.history.forEach(function (h) { if (h.start === start && h.rhythm === unit) hist = h; });
      base = hist ? hist.budgets : potCats(b, start);
      var rDays = b.rhythm === 'month' ? daysInMonth(start) : 7;
      f = (diffDays(start, end) + 1) / rDays;
    }
    var cats = {};
    allCats().forEach(function (c) { var v = +base[c.id] || 0; cats[c.id] = f === 1 ? v : roundTo(v * f, 50); });
    var ents = ofBudget(state, b).filter(function (e) { return inRange(e, start, end); }).sort(byNewest);
    var pers = ents.filter(personalOut), spent = sum(pers);
    return {
      start: start, end: end, unit: unit, offset: offset, label: rangeLabel(start, end, unit === 'once' ? 'week' : unit),
      budget: totalBudget(cats), budgets: cats, spent: spent, left: totalBudget(cats) - spent,
      byCat: catTotals(pers), entries: ents, work: sum(ents.filter(function (e) { return e.type === 'out' && e.work; })),
      isCurrent: start <= today && today <= end, scaled: f !== 1
    };
  }

  // ---------- insights ----------
  var BUCKETS = [
    { id: 'morning', from: 5, to: 11, word: 'mornings' },
    { id: 'lunch', from: 11, to: 15, word: 'lunches' },
    { id: 'afternoon', from: 15, to: 17, word: 'afternoons' },
    { id: 'evening', from: 17, to: 21, word: 'evenings' },
    { id: 'night', from: 21, to: 29, word: 'late nights' }
  ];
  function bucketOf(t) {
    var h = new Date(t).getHours(); if (h < 5) h += 24;
    for (var i = 0; i < BUCKETS.length; i++) if (h >= BUCKETS[i].from && h < BUCKETS[i].to) return BUCKETS[i];
    return BUCKETS[0];
  }
  function pattern(ents, unit) {
    var total = sum(ents); if (!total) return '';
    var wk = 0, bk = {};
    ents.forEach(function (e) {
      var d = new Date(e.ts).getDay(); if (d !== 0 && d !== 6) wk += e.amount;
      var b = bucketOf(e.ts); bk[b.id] = (bk[b.id] || 0) + e.amount;
    });
    var dayType = wk / total >= 0.7 ? 'weekday' : (total - wk) / total >= 0.6 ? 'weekend' : '';
    var top = null;
    BUCKETS.forEach(function (b) { if ((bk[b.id] || 0) / total >= 0.5) top = b; });
    if (ents.length < 2) top = null;
    if (dayType && top) return 'mostly ' + dayType + ' ' + top.word;
    if (top) return 'mostly ' + top.word;
    if (dayType) return 'mostly on ' + dayType + 's';
    return 'spread across the ' + (unit === 'once' ? 'budget' : unit);
  }

  function review(state, b, p, label) {
    var unit = p.rhythm || unitOf(b), tu = unit === 'month' ? 'month' : 'week';
    var pers = ofBudget(state, b).filter(function (e) { return inRange(e, p.start, p.end) && personalOut(e); });
    var total = sum(pers);
    if (!total) return { empty: true };
    var byCat = catTotals(pers);
    var ids = Object.keys(byCat).sort(function (x, y) { return byCat[y] - byCat[x]; });
    var topId = ids[0], topAmt = byCat[topId], topEnts = pers.filter(function (e) { return e.cat === topId; });
    var bars = [0, 0, 0, 0, 0, 0, 0];
    topEnts.forEach(function (e) { bars[(new Date(e.ts).getDay() + 6) % 7] += e.amount; });
    var share = topAmt / total;
    var r = {
      empty: false, total: total, topId: topId, topAmt: topAmt, share: share,
      headline: Math.round(share * 100) + '% went on ' + cat(topId).name.toLowerCase(),
      sub: naira(topAmt) + ', ' + pattern(topEnts, unit), bars: bars, suggestions: [], tips: []
    };
    var treatSpent = byCat.treats || 0, limit = +b.cats.treats || 0;
    if (b.kind === 'repeat') {
      // 1: treats over 30% of spending, and the limit isn't working -> a lower treat limit
      if (treatSpent > 0 && treatSpent / total > 0.3) {
        var x = Math.max(1000, roundTo(treatSpent * 0.55, 1000));
        if (b.done['treat-' + p.start] || !limit || (treatSpent > limit && limit > x)) {
          r.suggestions.push({
            key: 'treat-' + p.start, kind: 'treat', amount: x,
            title: limit ? 'Make your Treats allocation ' + naira(x) + '?' : 'Give treats a ' + naira(x) + ' allocation?',
            detail: 'You’d have had ' + naira(treatSpent - x) + ' more left ' + label
          });
        }
      }
      // 2: a category more than 10% over -> move money from the category with the most left
      var cats = p.budgets || b.cats, overs = [];
      allCats().forEach(function (c) {
        var v = +cats[c.id] || 0, sp = byCat[c.id] || 0;
        if (c.id !== 'treats' && v > 0 && sp > v * 1.1) overs.push({ c: c, by: sp - v });
      });
      overs.sort(function (m, n) { return n.by - m.by; });
      if (overs.length) {
        var o = overs[0], donors = [];
        allCats().forEach(function (c) {
          var v = +cats[c.id] || 0, spare = v - (byCat[c.id] || 0);
          if (c.id !== o.c.id && v > 0 && spare >= 500) donors.push({ c: c, spare: spare });
        });
        donors.sort(function (m, n) { return n.spare - m.spare; });
        if (donors.length) {
          var d = donors[0], amt = Math.min(Math.ceil(o.by / 500) * 500, Math.floor(d.spare / 500) * 500);
          r.suggestions.push({
            key: 'move-' + o.c.id + '-' + p.start, kind: 'move', from: d.c.id, to: o.c.id, amount: amt,
            title: 'Move ' + naira(amt) + ' from ' + d.c.name.toLowerCase() + ' to ' + o.c.name.toLowerCase() + '?',
            detail: o.c.name + ' went ' + naira(o.by) + ' over. ' + d.c.name + ' had ' + naira(d.spare) + ' left.'
          });
        }
      }
    }
    var tEnts = pers.filter(function (e) { return e.cat === 'treats'; });
    var avg = tEnts.length ? treatSpent / tEnts.length : 0;
    var lunchy = tEnts.filter(function (e) { return bucketOf(e.ts).id === 'lunch'; }).length >= tEnts.length / 2;
    if (treatSpent / total > 0.3 && avg) {
      var each = Math.max(500, roundTo(avg, 500));
      r.tips.push(lunchy
        ? 'Take lunch from home two days a ' + tu + '. At about ' + naira(each) + ' a lunch, that’s ' + naira(each * 2) + ' back each ' + tu + '.'
        : 'Pick two treat-free days a ' + tu + '. Your average treat costs about ' + naira(each) + '.');
    }
    if (b.kind === 'once') r.tips.push('Pay for the big items first, then spread what’s left across the remaining days.');
    if (p.over > 0 || total > p.budget) r.tips.push('Check what’s left in the allocation before you pay. If it’s empty, cover it from another allocation instead of dipping into the total.');
    var inMoney = state.entries.some(function (e) { return e.type === 'in' && inRange(e, p.start, p.end); });
    if (inMoney) r.tips.push('When money comes in, set aside next ' + tu + '’s budget first. Treat the rest as savings, not spending money.');
    if ((byCat.transport || 0) + (byCat.fuel || 0) > total * 0.3) r.tips.push('Group errands into one trip, and compare ride prices before you book.');
    r.tips.push('Log each purchase right after you pay. It takes a few seconds and keeps today’s number right.');
    r.tips.push('Keep savings in a separate account so leftover money doesn’t drift back into spending.');
    return r;
  }

  function applySuggestion(b, s) {
    if (s.kind === 'treat') b.cats.treats = s.amount;
    if (s.kind === 'move') {
      var amt = Math.min(s.amount, +b.cats[s.from] || 0);
      b.cats[s.from] = (+b.cats[s.from] || 0) - amt;
      b.cats[s.to] = (+b.cats[s.to] || 0) + amt;
    }
    b.done[s.key] = 'applied';
  }

  // ---------- sample data ----------
  function sampleState(now) {
    var today = dkey(now), w0 = weekStart(today), w1 = addDays(w0, -7), w2 = addDays(w0, -14);
    var s = blankState();
    s.sample = true; s.reminderAsked = true;
    var ev = newBudget({ name: 'Everyday', kind: 'repeat', rhythm: 'week',
      cats: { food: 12000, treats: 15000, transport: 7000, fuel: 5000, data: 4000, household: 3000, other: 4000, bills: 0, partner: 0, pets: 0 } }, now);
    var mv = newBudget({ name: 'Moving house', kind: 'once', start: addDays(today, -14), end: addDays(today, 18),
      cats: { household: 200000, transport: 50000, other: 100000, food: 0, treats: 0, fuel: 0, data: 0, bills: 0, partner: 0, pets: 0 } }, now);
    var E = [], nowD = new Date(now), nowMin = nowD.getHours() * 60 + nowD.getMinutes();
    function add(bud, day, time, c, amount, note, extra) {
      var p = time.split(':'), d = parseKey(day);
      if (day > today || (day === today && (+p[0]) * 60 + (+p[1]) > nowMin)) return;
      d.setHours(+p[0], +p[1], 0, 0);
      var e = { id: uid(), type: 'out', bid: bud ? bud.id : null, cat: c, amount: amount, note: note, work: false, ts: d.getTime() };
      if (extra) for (var k in extra) e[k] = extra[k];
      E.push(e);
    }
    // Everyday, two weeks ago: went over
    add(ev, w2, '13:00', 'treats', 3000, 'Shawarma'); add(ev, w2, '08:20', 'transport', 2000, 'Bolt to work');
    add(ev, addDays(w2, 1), '08:15', 'transport', 2000, 'Bolt to work'); add(ev, addDays(w2, 1), '09:30', 'fuel', 5000, 'Fuel');
    add(ev, addDays(w2, 2), '13:30', 'treats', 4000, 'Pizza slice');
    add(ev, addDays(w2, 3), '08:10', 'transport', 2000, 'Bolt to work'); add(ev, addDays(w2, 3), '10:00', 'data', 4000, 'MTN data');
    add(ev, addDays(w2, 4), '20:00', 'treats', 5000, 'Suya and drinks'); add(ev, addDays(w2, 4), '08:30', 'transport', 2000, 'Bolt to work');
    add(ev, addDays(w2, 5), '11:00', 'food', 14000, 'Market run'); add(ev, addDays(w2, 5), '15:00', 'other', 6000, 'Barber and laundry');
    add(ev, addDays(w2, 6), '12:00', 'household', 3300, 'Cleaning supplies');
    // Everyday, last week: treat-heavy weekday lunches, small leftover
    add(ev, w1, '13:10', 'treats', 4000, 'Shawarma'); add(ev, w1, '08:15', 'transport', 1500, 'Bolt to work');
    add(ev, addDays(w1, 1), '12:45', 'treats', 3500, 'Jollof and chicken'); add(ev, addDays(w1, 1), '18:30', 'transport', 1200, 'Keke home');
    add(ev, addDays(w1, 2), '13:20', 'treats', 4500, 'Amala spot'); add(ev, addDays(w1, 2), '19:10', 'food', 2200, 'Bread and eggs'); add(ev, addDays(w1, 2), '09:00', 'fuel', 3000, 'Fuel');
    add(ev, addDays(w1, 3), '12:30', 'treats', 2500, 'Small chops'); add(ev, addDays(w1, 3), '10:00', 'data', 4000, 'MTN data'); add(ev, addDays(w1, 3), '08:10', 'transport', 1500, 'Bolt to work');
    add(ev, addDays(w1, 4), '13:05', 'treats', 3000, 'Burger'); add(ev, addDays(w1, 4), '11:00', 'data', 24000, 'Figma', { work: true });
    add(null, addDays(w1, 4), '15:00', 'in', 250000, 'Website project', { type: 'in', source: 'Client work', work: false });
    add(ev, addDays(w1, 5), '16:00', 'treats', 1000, 'Ice cream'); add(ev, addDays(w1, 5), '10:30', 'food', 11300, 'Market run'); add(ev, addDays(w1, 5), '12:00', 'household', 1500, 'Detergent and soap');
    add(ev, addDays(w1, 6), '17:00', 'other', 2000, 'Haircut'); add(ev, addDays(w1, 6), '14:00', 'transport', 2000, 'Bolt to Lekki');
    // Everyday, this week up to now
    add(ev, w0, '08:05', 'food', 3765, 'Bread and milk'); add(ev, w0, '13:12', 'treats', 4000, 'Shawarma');
    add(ev, addDays(w0, 1), '08:30', 'transport', 1500, 'Bolt to work'); add(ev, addDays(w0, 1), '12:40', 'treats', 2500, 'Small chops');
    add(ev, addDays(w0, 2), '13:00', 'treats', 3000, 'Rice and plantain'); add(ev, addDays(w0, 2), '18:00', 'transport', 1200, 'Keke home');
    add(ev, addDays(w0, 3), '10:00', 'data', 4000, 'MTN data'); add(ev, addDays(w0, 3), '12:50', 'treats', 1500, 'Puff-puff');
    add(ev, addDays(w0, 4), '08:20', 'transport', 1500, 'Bolt to work'); add(ev, addDays(w0, 4), '19:30', 'treats', 3500, 'Suya with friends');
    add(ev, addDays(w0, 5), '10:30', 'food', 6500, 'Market run');
    add(ev, addDays(w0, 6), '16:00', 'other', 1500, 'Laundry');
    // Moving house: one-off, mid-way
    add(mv, addDays(today, -13), '09:00', 'transport', 35000, 'Van hire');
    add(mv, addDays(today, -12), '15:30', 'household', 95000, 'Mattress');
    add(mv, addDays(today, -10), '11:00', 'other', 60000, 'Agent fee');
    add(mv, addDays(today, -6), '14:00', 'household', 28000, 'Curtains');
    add(mv, addDays(today, -2), '10:15', 'household', 18500, 'Paint and brushes');
    s.entries = E;
    ev.periodStart = w2; ev.createdAt = parseKey(w2).getTime();
    s.entries = s.entries.filter(function (e) { return e.bid !== mv.id && e.type === 'out' && !e.work; });
    s.budgets = [ev]; s.lastBid = ev.id; s.mainBid = ev.id;
    rolloverAll(s, now);
    return s;
  }

  var L = {
    PALETTE: PALETTE, setCustom: setCustom, allCats: allCats, mainBudget: mainBudget, balanceNow: balanceNow, runway: runway, monthView: monthView,
    DAY: DAY, CATS: CATS, WORK: WORK, SPLIT: SPLIT, SOURCES: SOURCES, MONTHS: MONTHS, cat: cat,
    dkey: dkey, parseKey: parseKey, addDays: addDays, diffDays: diffDays, weekStart: weekStart, monthStart: monthStart,
    daysInMonth: daysInMonth, periodStart: periodStart, periodEnd: periodEnd, shiftPeriod: shiftPeriod,
    rangeLabel: rangeLabel, dayLabel: dayLabel, shortDate: shortDate, weekdayName: weekdayName, timeLabel: timeLabel, hhmm: hhmm, time12: time12,
    naira: naira, short: short, roundTo: roundTo, uid: uid, blankState: blankState, newBudget: newBudget, findBudget: findBudget,
    unitOf: unitOf, phaseOf: phaseOf, totalBudget: totalBudget, autoSplit: autoSplit, convertBudgets: convertBudgets, migrate: migrate,
    entryDay: entryDay, personalOut: personalOut, catTotals: catTotals, ofBudget: ofBudget, streak: streak, loggedOn: loggedOn, bestStreak: bestStreak, badges: badges,
    status: status, monthSummary: monthSummary, summarize: summarize, needsRollover: needsRollover, anyRollover: anyRollover,
    rollover: rollover, rolloverAll: rolloverAll, rangeView: rangeView, pattern: pattern, review: review,
    applySuggestion: applySuggestion, potCats: potCats, coverPot: coverPot, saveFromPot: saveFromPot, potsOf: potsOf, sampleState: sampleState, byNewest: byNewest
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = L; else root.BudgeLogic = L;
})(this);

(function () {
  'use strict';
  var P = window.htmPreact, L = window.BudgeLogic;
  var html = P.html, render = P.render, useState = P.useState, useEffect = P.useEffect, useRef = P.useRef;
  var ICONS = {"ui":{"house":"<path d=\"M219.31,108.68l-80-80a16,16,0,0,0-22.62,0l-80,80A15.87,15.87,0,0,0,32,120v96a8,8,0,0,0,8,8h64a8,8,0,0,0,8-8V160h32v56a8,8,0,0,0,8,8h64a8,8,0,0,0,8-8V120A15.87,15.87,0,0,0,219.31,108.68ZM208,208H160V152a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8v56H48V120l80-80,80,80Z\"/>","house-f":"<path d=\"M224,120v96a8,8,0,0,1-8,8H160a8,8,0,0,1-8-8V164a4,4,0,0,0-4-4H108a4,4,0,0,0-4,4v52a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V120a16,16,0,0,1,4.69-11.31l80-80a16,16,0,0,1,22.62,0l80,80A16,16,0,0,1,224,120Z\"/>","pie":"<path d=\"M100,116.43a8,8,0,0,0,4-6.93v-72A8,8,0,0,0,93.34,30,104.06,104.06,0,0,0,25.73,147a8,8,0,0,0,4.52,5.81,7.86,7.86,0,0,0,3.35.74,8,8,0,0,0,4-1.07ZM88,49.62v55.26L40.12,132.51C40,131,40,129.48,40,128A88.12,88.12,0,0,1,88,49.62ZM128,24a8,8,0,0,0-8,8v91.82L41.19,169.73a8,8,0,0,0-2.87,11A104,104,0,1,0,128,24Zm0,192a88.47,88.47,0,0,1-71.49-36.68l75.52-44a8,8,0,0,0,4-6.92V40.36A88,88,0,0,1,128,216Z\"/>","pie-f":"<path d=\"M100,116.43a8,8,0,0,0,4-6.93v-72A8,8,0,0,0,93.34,30,104.06,104.06,0,0,0,25.73,147a8,8,0,0,0,4.52,5.81,7.86,7.86,0,0,0,3.35.74,8,8,0,0,0,4-1.07ZM88,49.62v55.26L40.12,132.51C40,131,40,129.48,40,128A88.12,88.12,0,0,1,88,49.62ZM232,128A104,104,0,0,1,38.32,180.7a8,8,0,0,1,2.87-11L120,123.83V32a8,8,0,0,1,8-8,104.05,104.05,0,0,1,89.74,51.48c.11.16.21.32.31.49s.2.37.29.55A103.34,103.34,0,0,1,232,128Z\"/>","bulb":"<path d=\"M176,232a8,8,0,0,1-8,8H88a8,8,0,0,1,0-16h80A8,8,0,0,1,176,232Zm40-128a87.55,87.55,0,0,1-33.64,69.21A16.24,16.24,0,0,0,176,186v6a16,16,0,0,1-16,16H96a16,16,0,0,1-16-16v-6a16,16,0,0,0-6.23-12.66A87.59,87.59,0,0,1,40,104.49C39.74,56.83,78.26,17.14,125.88,16A88,88,0,0,1,216,104Zm-16,0a72,72,0,0,0-73.74-72c-39,.92-70.47,33.39-70.26,72.39a71.65,71.65,0,0,0,27.64,56.3A32,32,0,0,1,96,186v6h64v-6a32.15,32.15,0,0,1,12.47-25.35A71.65,71.65,0,0,0,200,104Zm-16.11-9.34a57.6,57.6,0,0,0-46.56-46.55,8,8,0,0,0-2.66,15.78c16.57,2.79,30.63,16.85,33.44,33.45A8,8,0,0,0,176,104a9,9,0,0,0,1.35-.11A8,8,0,0,0,183.89,94.66Z\"/>","bulb-f":"<path d=\"M176,232a8,8,0,0,1-8,8H88a8,8,0,0,1,0-16h80A8,8,0,0,1,176,232Zm40-128a87.55,87.55,0,0,1-33.64,69.21A16.24,16.24,0,0,0,176,186v6a16,16,0,0,1-16,16H96a16,16,0,0,1-16-16v-6a16,16,0,0,0-6.23-12.66A87.59,87.59,0,0,1,40,104.49C39.74,56.83,78.26,17.14,125.88,16A88,88,0,0,1,216,104Zm-32.11-9.34a57.6,57.6,0,0,0-46.56-46.55,8,8,0,0,0-2.66,15.78c16.57,2.79,30.63,16.85,33.44,33.45A8,8,0,0,0,176,104a9,9,0,0,0,1.35-.11A8,8,0,0,0,183.89,94.66Z\"/>","gear":"<path d=\"M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Zm88-29.84q.06-2.16,0-4.32l14.92-18.64a8,8,0,0,0,1.48-7.06,107.21,107.21,0,0,0-10.88-26.25,8,8,0,0,0-6-3.93l-23.72-2.64q-1.48-1.56-3-3L186,40.54a8,8,0,0,0-3.94-6,107.71,107.71,0,0,0-26.25-10.87,8,8,0,0,0-7.06,1.49L130.16,40Q128,40,125.84,40L107.2,25.11a8,8,0,0,0-7.06-1.48A107.6,107.6,0,0,0,73.89,34.51a8,8,0,0,0-3.93,6L67.32,64.27q-1.56,1.49-3,3L40.54,70a8,8,0,0,0-6,3.94,107.71,107.71,0,0,0-10.87,26.25,8,8,0,0,0,1.49,7.06L40,125.84Q40,128,40,130.16L25.11,148.8a8,8,0,0,0-1.48,7.06,107.21,107.21,0,0,0,10.88,26.25,8,8,0,0,0,6,3.93l23.72,2.64q1.49,1.56,3,3L70,215.46a8,8,0,0,0,3.94,6,107.71,107.71,0,0,0,26.25,10.87,8,8,0,0,0,7.06-1.49L125.84,216q2.16.06,4.32,0l18.64,14.92a8,8,0,0,0,7.06,1.48,107.21,107.21,0,0,0,26.25-10.88,8,8,0,0,0,3.93-6l2.64-23.72q1.56-1.48,3-3L215.46,186a8,8,0,0,0,6-3.94,107.71,107.71,0,0,0,10.87-26.25,8,8,0,0,0-1.49-7.06Zm-16.1-6.5a73.93,73.93,0,0,1,0,8.68,8,8,0,0,0,1.74,5.48l14.19,17.73a91.57,91.57,0,0,1-6.23,15L187,173.11a8,8,0,0,0-5.1,2.64,74.11,74.11,0,0,1-6.14,6.14,8,8,0,0,0-2.64,5.1l-2.51,22.58a91.32,91.32,0,0,1-15,6.23l-17.74-14.19a8,8,0,0,0-5-1.75h-.48a73.93,73.93,0,0,1-8.68,0,8,8,0,0,0-5.48,1.74L100.45,215.8a91.57,91.57,0,0,1-15-6.23L82.89,187a8,8,0,0,0-2.64-5.1,74.11,74.11,0,0,1-6.14-6.14,8,8,0,0,0-5.1-2.64L46.43,170.6a91.32,91.32,0,0,1-6.23-15l14.19-17.74a8,8,0,0,0,1.74-5.48,73.93,73.93,0,0,1,0-8.68,8,8,0,0,0-1.74-5.48L40.2,100.45a91.57,91.57,0,0,1,6.23-15L69,82.89a8,8,0,0,0,5.1-2.64,74.11,74.11,0,0,1,6.14-6.14A8,8,0,0,0,82.89,69L85.4,46.43a91.32,91.32,0,0,1,15-6.23l17.74,14.19a8,8,0,0,0,5.48,1.74,73.93,73.93,0,0,1,8.68,0,8,8,0,0,0,5.48-1.74L155.55,40.2a91.57,91.57,0,0,1,15,6.23L173.11,69a8,8,0,0,0,2.64,5.1,74.11,74.11,0,0,1,6.14,6.14,8,8,0,0,0,5.1,2.64l22.58,2.51a91.32,91.32,0,0,1,6.23,15l-14.19,17.74A8,8,0,0,0,199.87,123.66Z\"/>","gear-f":"<path d=\"M216,130.16q.06-2.16,0-4.32l14.92-18.64a8,8,0,0,0,1.48-7.06,107.6,107.6,0,0,0-10.88-26.25,8,8,0,0,0-6-3.93l-23.72-2.64q-1.48-1.56-3-3L186,40.54a8,8,0,0,0-3.94-6,107.29,107.29,0,0,0-26.25-10.86,8,8,0,0,0-7.06,1.48L130.16,40Q128,40,125.84,40L107.2,25.11a8,8,0,0,0-7.06-1.48A107.6,107.6,0,0,0,73.89,34.51a8,8,0,0,0-3.93,6L67.32,64.27q-1.56,1.49-3,3L40.54,70a8,8,0,0,0-6,3.94,107.71,107.71,0,0,0-10.87,26.25,8,8,0,0,0,1.49,7.06L40,125.84Q40,128,40,130.16L25.11,148.8a8,8,0,0,0-1.48,7.06,107.6,107.6,0,0,0,10.88,26.25,8,8,0,0,0,6,3.93l23.72,2.64q1.49,1.56,3,3L70,215.46a8,8,0,0,0,3.94,6,107.71,107.71,0,0,0,26.25,10.87,8,8,0,0,0,7.06-1.49L125.84,216q2.16.06,4.32,0l18.64,14.92a8,8,0,0,0,7.06,1.48,107.21,107.21,0,0,0,26.25-10.88,8,8,0,0,0,3.93-6l2.64-23.72q1.56-1.48,3-3L215.46,186a8,8,0,0,0,6-3.94,107.71,107.71,0,0,0,10.87-26.25,8,8,0,0,0-1.49-7.06ZM128,168a40,40,0,1,1,40-40A40,40,0,0,1,128,168Z\"/>","plus":"<path d=\"M228,128a12,12,0,0,1-12,12H140v76a12,12,0,0,1-24,0V140H40a12,12,0,0,1,0-24h76V40a12,12,0,0,1,24,0v76h76A12,12,0,0,1,228,128Z\"/>","back":"<path d=\"M228,128a12,12,0,0,1-12,12H69l51.52,51.51a12,12,0,0,1-17,17l-72-72a12,12,0,0,1,0-17l72-72a12,12,0,0,1,17,17L69,116H216A12,12,0,0,1,228,128Z\"/>","check":"<path d=\"M232.49,80.49l-128,128a12,12,0,0,1-17,0l-56-56a12,12,0,1,1,17-17L96,183,215.51,63.51a12,12,0,0,1,17,17Z\"/>","fire":"<path d=\"M143.38,17.85a8,8,0,0,0-12.63,3.41l-22,60.41L84.59,58.26a8,8,0,0,0-11.93.89C51,87.53,40,116.08,40,144a88,88,0,0,0,176,0C216,84.55,165.21,36,143.38,17.85Zm40.51,135.49a57.6,57.6,0,0,1-46.56,46.55A7.65,7.65,0,0,1,136,200a8,8,0,0,1-1.32-15.89c16.57-2.79,30.63-16.85,33.44-33.45a8,8,0,0,1,15.78,2.68Z\"/>","x":"<path d=\"M208.49,191.51a12,12,0,0,1-17,17L128,145,64.49,208.49a12,12,0,0,1-17-17L111,128,47.51,64.49a12,12,0,0,1,17-17L128,111l63.51-63.52a12,12,0,0,1,17,17L145,128Z\"/>","del":"<path d=\"M216,40H68.53a16.08,16.08,0,0,0-13.72,7.77L9.14,123.88a8,8,0,0,0,0,8.24l45.67,76.11A16.08,16.08,0,0,0,68.53,216H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM61.67,204.12,68.53,200h0ZM216,200H68.53l-43.2-72,43.2-72H216ZM106.34,146.34,124.69,128l-18.35-18.34a8,8,0,0,1,11.32-11.32L136,116.69l18.34-18.35a8,8,0,0,1,11.32,11.32L147.31,128l18.35,18.34a8,8,0,0,1-11.32,11.32L136,139.31l-18.34,18.35a8,8,0,0,1-11.32-11.32Z\"/>","right":"<path d=\"M184.49,136.49l-80,80a12,12,0,0,1-17-17L159,128,87.51,56.49a12,12,0,1,1,17-17l80,80A12,12,0,0,1,184.49,136.49Z\"/>","left":"<path d=\"M168.49,199.51a12,12,0,0,1-17,17l-80-80a12,12,0,0,1,0-17l80-80a12,12,0,0,1,17,17L97,128Z\"/>","sparkle":"<path d=\"M208,144a15.78,15.78,0,0,1-10.42,14.94L146,178l-19,51.62a15.92,15.92,0,0,1-29.88,0L78,178l-51.62-19a15.92,15.92,0,0,1,0-29.88L78,110l19-51.62a15.92,15.92,0,0,1,29.88,0L146,110l51.62,19A15.78,15.78,0,0,1,208,144ZM152,48h16V64a8,8,0,0,0,16,0V48h16a8,8,0,0,0,0-16H184V16a8,8,0,0,0-16,0V32H152a8,8,0,0,0,0,16Zm88,32h-8V72a8,8,0,0,0-16,0v8h-8a8,8,0,0,0,0,16h8v8a8,8,0,0,0,16,0V96h8a8,8,0,0,0,0-16Z\"/>","bag":"<path d=\"M216,56H176V48a24,24,0,0,0-24-24H104A24,24,0,0,0,80,48v8H40A16,16,0,0,0,24,72V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V72A16,16,0,0,0,216,56ZM96,48a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96ZM216,72v41.61A184,184,0,0,1,128,136a184.07,184.07,0,0,1-88-22.38V72Zm0,128H40V131.64A200.19,200.19,0,0,0,128,152a200.25,200.25,0,0,0,88-20.37V200ZM104,112a8,8,0,0,1,8-8h32a8,8,0,0,1,0,16H112A8,8,0,0,1,104,112Z\"/>","bell":"<path d=\"M221.8,175.94C216.25,166.38,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06ZM128,216a24,24,0,0,1-22.62-16h45.24A24,24,0,0,1,128,216Z\"/>","pencil":"<path d=\"M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z\"/>","trash":"<path d=\"M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z\"/>","piggy":"<path d=\"M240,112v32a16,16,0,0,1-16,16h-8l-18.1,50.69a8,8,0,0,1-7.54,5.31H177.64a8,8,0,0,1-7.54-5.31L166.29,200H97.71L93.9,210.69A8,8,0,0,1,86.36,216H73.64a8,8,0,0,1-7.54-5.31L53,174a79.7,79.7,0,0,1-21-54h0a80,80,0,0,1,80-80h32a80,80,0,0,1,73.44,48.22,82.22,82.22,0,0,1,2.9,7.78H224A16,16,0,0,1,240,112Z\" opacity=\"0.2\"/><path d=\"M192,116a12,12,0,1,1-12-12A12,12,0,0,1,192,116ZM152,64H112a8,8,0,0,0,0,16h40a8,8,0,0,0,0-16Zm96,48v32a24,24,0,0,1-24,24h-2.36l-16.21,45.38A16,16,0,0,1,190.36,224H177.64a16,16,0,0,1-15.07-10.62L160.65,208h-57.3l-1.92,5.38A16,16,0,0,1,86.36,224H73.64a16,16,0,0,1-15.07-10.62L46,178.22a87.69,87.69,0,0,1-21.44-48.38A16,16,0,0,0,16,144a8,8,0,0,1-16,0,32,32,0,0,1,24.28-31A88.12,88.12,0,0,1,112,32H216a8,8,0,0,1,0,16H194.61a87.93,87.93,0,0,1,30.17,37c.43,1,.85,2,1.25,3A24,24,0,0,1,248,112Zm-16,0a8,8,0,0,0-8-8h-3.66a8,8,0,0,1-7.64-5.6A71.9,71.9,0,0,0,144,48H112A72,72,0,0,0,58.91,168.64a8,8,0,0,1,1.64,2.71L73.64,208H86.36l3.82-10.69A8,8,0,0,1,97.71,192h68.58a8,8,0,0,1,7.53,5.31L177.64,208h12.72l18.11-50.69A8,8,0,0,1,216,152h8a8,8,0,0,0,8-8Z\"/>","in":"<path d=\"M200.49,72.48,93,180h75a12,12,0,0,1,0,24H64a12,12,0,0,1-12-12V88a12,12,0,0,1,24,0v75L183.51,55.51a12,12,0,0,1,17,17Z\"/>","user":"<path d=\"M230.93,220a8,8,0,0,1-6.93,4H32a8,8,0,0,1-6.92-12c15.23-26.33,38.7-45.21,66.09-54.16a72,72,0,1,1,73.66,0c27.39,8.95,50.86,27.83,66.09,54.16A8,8,0,0,1,230.93,220Z\"/>","warn":"<path d=\"M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm-8,56a8,8,0,0,1,16,0v56a8,8,0,0,1-16,0Zm8,104a12,12,0,1,1,12-12A12,12,0,0,1,128,184Z\"/>","list":"<path d=\"M76,64A12,12,0,0,1,88,52H216a12,12,0,0,1,0,24H88A12,12,0,0,1,76,64Zm140,52H88a12,12,0,0,0,0,24H216a12,12,0,0,0,0-24Zm0,64H88a12,12,0,0,0,0,24H216a12,12,0,0,0,0-24ZM44,112a16,16,0,1,0,16,16A16,16,0,0,0,44,112Zm0-64A16,16,0,1,0,60,64,16,16,0,0,0,44,48Zm0,128a16,16,0,1,0,16,16A16,16,0,0,0,44,176Z\"/>","clock":"<path d=\"M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm64-88a8,8,0,0,1-8,8H128a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v48h48A8,8,0,0,1,192,128Z\"/>","bolt":"<path d=\"M213.85,125.46l-112,120a8,8,0,0,1-13.69-7l14.66-73.33L45.19,143.49a8,8,0,0,1-3-13l112-120a8,8,0,0,1,13.69,7L153.18,90.9l57.63,21.61a8,8,0,0,1,3,12.95Z\"/>","calendar":"<path d=\"M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Z\"/>","coins":"<path d=\"M16,152H48v56H16a8,8,0,0,1-8-8V160A8,8,0,0,1,16,152ZM204,56a28,28,0,0,0-12,2.71h0A28,28,0,1,0,176,85.29h0A28,28,0,1,0,204,56Z\" opacity=\"0.2\"/><path d=\"M230.33,141.06a24.43,24.43,0,0,0-21.24-4.23l-41.84,9.62A28,28,0,0,0,140,112H89.94a31.82,31.82,0,0,0-22.63,9.37L44.69,144H16A16,16,0,0,0,0,160v40a16,16,0,0,0,16,16H120a7.93,7.93,0,0,0,1.94-.24l64-16a6.94,6.94,0,0,0,1.19-.4L226,182.82l.44-.2a24.6,24.6,0,0,0,3.93-41.56ZM16,160H40v40H16Zm203.43,8.21-38,16.18L119,200H56V155.31l22.63-22.62A15.86,15.86,0,0,1,89.94,128H140a12,12,0,0,1,0,24H112a8,8,0,0,0,0,16h32a8.32,8.32,0,0,0,1.79-.2l67-15.41.31-.08a8.6,8.6,0,0,1,6.3,15.9ZM164,96a36,36,0,0,0,5.9-.48,36,36,0,1,0,28.22-47A36,36,0,1,0,164,96Zm60-12a20,20,0,1,1-20-20A20,20,0,0,1,224,84ZM164,40a20,20,0,0,1,19.25,14.61,36,36,0,0,0-15,24.93A20.42,20.42,0,0,1,164,80a20,20,0,0,1,0-40Z\"/>","eye":"<path d=\"M247.31,124.76c-.35-.79-8.82-19.58-27.65-38.41C194.57,61.26,162.88,48,128,48S61.43,61.26,36.34,86.35C17.51,105.18,9,124,8.69,124.76a8,8,0,0,0,0,6.5c.35.79,8.82,19.57,27.65,38.4C61.43,194.74,93.12,208,128,208s66.57-13.26,91.66-38.34c18.83-18.83,27.3-37.61,27.65-38.4A8,8,0,0,0,247.31,124.76ZM128,192c-30.78,0-57.67-11.19-79.93-33.25A133.47,133.47,0,0,1,25,128,133.33,133.33,0,0,1,48.07,97.25C70.33,75.19,97.22,64,128,64s57.67,11.19,79.93,33.25A133.46,133.46,0,0,1,231.05,128C223.84,141.46,192.43,192,128,192Zm0-112a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Z\"/>","target":"<path d=\"M176,128a48,48,0,1,1-48-48A48,48,0,0,1,176,128Z\" opacity=\"0.2\"/><path d=\"M221.87,83.16A104.1,104.1,0,1,1,195.67,49l22.67-22.68a8,8,0,0,1,11.32,11.32l-96,96a8,8,0,0,1-11.32-11.32l27.72-27.72a40,40,0,1,0,17.87,31.09,8,8,0,1,1,16-.9,56,56,0,1,1-22.38-41.65L184.3,60.39a87.88,87.88,0,1,0,23.13,29.67,8,8,0,0,1,14.44-6.9Z\"/>","tip":"<path d=\"M208,104a79.86,79.86,0,0,1-30.59,62.92A24.29,24.29,0,0,0,168,186v6a8,8,0,0,1-8,8H96a8,8,0,0,1-8-8v-6a24.11,24.11,0,0,0-9.3-19A79.87,79.87,0,0,1,48,104.45C47.76,61.09,82.72,25,126.07,24A80,80,0,0,1,208,104Z\" opacity=\"0.2\"/><path d=\"M176,232a8,8,0,0,1-8,8H88a8,8,0,0,1,0-16h80A8,8,0,0,1,176,232Zm40-128a87.55,87.55,0,0,1-33.64,69.21A16.24,16.24,0,0,0,176,186v6a16,16,0,0,1-16,16H96a16,16,0,0,1-16-16v-6a16,16,0,0,0-6.23-12.66A87.59,87.59,0,0,1,40,104.5C39.74,56.83,78.26,17.15,125.88,16A88,88,0,0,1,216,104Zm-16,0a72,72,0,0,0-73.74-72c-39,.92-70.47,33.39-70.26,72.39a71.64,71.64,0,0,0,27.64,56.3h0A32,32,0,0,1,96,186v6h24V147.31L90.34,117.66a8,8,0,0,1,11.32-11.32L128,132.69l26.34-26.35a8,8,0,0,1,11.32,11.32L136,147.31V192h24v-6a32.12,32.12,0,0,1,12.47-25.35A71.65,71.65,0,0,0,200,104Z\"/>","star-f":"<path d=\"M234.29,114.85l-45,38.83L203,211.75a16.4,16.4,0,0,1-24.5,17.82L128,198.49,77.47,229.57A16.4,16.4,0,0,1,53,211.75l13.76-58.07-45-38.83A16.46,16.46,0,0,1,31.08,86l59-4.76,22.76-55.08a16.36,16.36,0,0,1,30.27,0l22.75,55.08,59,4.76a16.46,16.46,0,0,1,9.37,28.86Z\"/>","star":"<path d=\"M239.18,97.26A16.38,16.38,0,0,0,224.92,86l-59-4.76L143.14,26.15a16.36,16.36,0,0,0-30.27,0L90.11,81.23,31.08,86a16.46,16.46,0,0,0-9.37,28.86l45,38.83L53,211.75a16.38,16.38,0,0,0,24.5,17.82L128,198.49l50.53,31.08A16.4,16.4,0,0,0,203,211.75l-13.76-58.07,45-38.83A16.43,16.43,0,0,0,239.18,97.26Zm-15.34,5.47-48.7,42a8,8,0,0,0-2.56,7.91l14.88,62.8a.37.37,0,0,1-.17.48c-.18.14-.23.11-.38,0l-54.72-33.65a8,8,0,0,0-8.38,0L69.09,215.94c-.15.09-.19.12-.38,0a.37.37,0,0,1-.17-.48l14.88-62.8a8,8,0,0,0-2.56-7.91l-48.7-42c-.12-.1-.23-.19-.13-.5s.18-.27.33-.29l63.92-5.16A8,8,0,0,0,103,91.86l24.62-59.61c.08-.17.11-.25.35-.25s.27.08.35.25L153,91.86a8,8,0,0,0,6.75,4.92l63.92,5.16c.15,0,.24,0,.33.29S224,102.63,223.84,102.73Z\"/>","trend":"<path d=\"M240,56v64a8,8,0,0,1-16,0V75.31l-82.34,82.35a8,8,0,0,1-11.32,0L96,123.31,29.66,189.66a8,8,0,0,1-11.32-11.32l72-72a8,8,0,0,1,11.32,0L136,140.69,212.69,64H168a8,8,0,0,1,0-16h64A8,8,0,0,1,240,56Z\"/>","wallet":"<path d=\"M224,80V192a8,8,0,0,1-8,8H56a16,16,0,0,1-16-16V56A16,16,0,0,0,56,72H216A8,8,0,0,1,224,80Z\" opacity=\"0.2\"/><path d=\"M216,64H56a8,8,0,0,1,0-16H192a8,8,0,0,0,0-16H56A24,24,0,0,0,32,56V184a24,24,0,0,0,24,24H216a16,16,0,0,0,16-16V80A16,16,0,0,0,216,64Zm0,128H56a8,8,0,0,1-8-8V78.63A23.84,23.84,0,0,0,56,80H216Zm-48-60a12,12,0,1,1,12,12A12,12,0,0,1,168,132Z\"/>"},"cat":{"Food at home":"<path d=\"M224,64l-12.16,66.86A16,16,0,0,1,196.1,144H70.55L56,64Z\" opacity=\"0.2\"/><path d=\"M230.14,58.87A8,8,0,0,0,224,56H62.68L56.6,22.57A8,8,0,0,0,48.73,16H24a8,8,0,0,0,0,16h18L67.56,172.29a24,24,0,0,0,5.33,11.27,28,28,0,1,0,44.4,8.44h45.42A27.75,27.75,0,0,0,160,204a28,28,0,1,0,28-28H91.17a8,8,0,0,1-7.87-6.57L80.13,152h116a24,24,0,0,0,23.61-19.71l12.16-66.86A8,8,0,0,0,230.14,58.87ZM104,204a12,12,0,1,1-12-12A12,12,0,0,1,104,204Zm96,0a12,12,0,1,1-12-12A12,12,0,0,1,200,204Zm4-74.57A8,8,0,0,1,196.1,136H77.22L65.59,72H214.41Z\"/>","Treats":"<path d=\"M188,176l20-7.27V184a32,32,0,0,1-32,32H80a32,32,0,0,1-32-32V167.27L68,160l40,16,40-16Zm27.82-89.72C209.32,55.55,172.48,32,128,32S46.68,55.55,40.18,86.28A8,8,0,0,0,48.07,96H207.93A8,8,0,0,0,215.82,86.28Z\" opacity=\"0.2\"/><path d=\"M48.07,104H207.93a16,16,0,0,0,15.72-19.38C216.22,49.5,176,24,128,24S39.78,49.5,32.35,84.62A16,16,0,0,0,48.07,104ZM128,40c39.82,0,74.21,20.61,79.93,48H48.07L48,87.93C53.79,60.61,88.18,40,128,40ZM229.26,152.48l-41.13,15L151,152.57a8,8,0,0,0-5.94,0l-37,14.81L71,152.57a8,8,0,0,0-5.7-.09l-44,16a8,8,0,0,0,5.47,15L40,178.69V184a40,40,0,0,0,40,40h96a40,40,0,0,0,40-40v-9.67l18.73-6.81a8,8,0,1,0-5.47-15ZM200,184a24,24,0,0,1-24,24H80a24,24,0,0,1-24-24V172.88l11.87-4.32L105,183.43a8,8,0,0,0,5.94,0l37-14.81,37,14.81a8,8,0,0,0,5.7.09l9.27-3.37ZM16,128a8,8,0,0,1,8-8H232a8,8,0,0,1,0,16H24A8,8,0,0,1,16,128Z\"/>","Transport":"<path d=\"M48,184H88v24a8,8,0,0,1-8,8H56a8,8,0,0,1-8-8Zm120,24a8,8,0,0,0,8,8h24a8,8,0,0,0,8-8V184H168ZM48,72v40H208V72Z\" opacity=\"0.2\"/><path d=\"M184,32H72A32,32,0,0,0,40,64V208a16,16,0,0,0,16,16H80a16,16,0,0,0,16-16V192h64v16a16,16,0,0,0,16,16h24a16,16,0,0,0,16-16V64A32,32,0,0,0,184,32ZM56,176V120H200v56Zm0-96H200v24H56ZM72,48H184a16,16,0,0,1,16,16H56A16,16,0,0,1,72,48Zm8,160H56V192H80Zm96,0V192h24v16Zm-72-60a12,12,0,1,1-12-12A12,12,0,0,1,104,148Zm72,0a12,12,0,1,1-12-12A12,12,0,0,1,176,148Zm72-68v24a8,8,0,0,1-16,0V80a8,8,0,0,1,16,0ZM24,80v24a8,8,0,0,1-16,0V80a8,8,0,0,1,16,0Z\"/>","Fuel":"<path d=\"M168,56V216H56V56A16,16,0,0,1,72,40h80A16,16,0,0,1,168,56Z\" opacity=\"0.2\"/><path d=\"M241,69.66,221.66,50.34a8,8,0,0,0-11.32,11.32L229.66,81A8,8,0,0,1,232,86.63V168a8,8,0,0,1-16,0V128a24,24,0,0,0-24-24H176V56a24,24,0,0,0-24-24H72A24,24,0,0,0,48,56V208H32a8,8,0,0,0,0,16H192a8,8,0,0,0,0-16H176V120h16a8,8,0,0,1,8,8v40a24,24,0,0,0,48,0V86.63A23.85,23.85,0,0,0,241,69.66ZM64,208V56a8,8,0,0,1,8-8h80a8,8,0,0,1,8,8V208Zm80-96a8,8,0,0,1-8,8H88a8,8,0,0,1,0-16h48A8,8,0,0,1,144,112Z\"/>","Data & phone":"<path d=\"M192,56V200H64V56Z\" opacity=\"0.2\"/><path d=\"M176,16H80A24,24,0,0,0,56,40V216a24,24,0,0,0,24,24h96a24,24,0,0,0,24-24V40A24,24,0,0,0,176,16ZM72,64H184V192H72Zm8-32h96a8,8,0,0,1,8,8v8H72V40A8,8,0,0,1,80,32Zm96,192H80a8,8,0,0,1-8-8v-8H184v8A8,8,0,0,1,176,224Z\"/>","Household":"<path d=\"M216,120v96H152V152H104v64H40V120a8,8,0,0,1,2.34-5.66l80-80a8,8,0,0,1,11.32,0l80,80A8,8,0,0,1,216,120Z\" opacity=\"0.2\"/><path d=\"M219.31,108.68l-80-80a16,16,0,0,0-22.62,0l-80,80A15.87,15.87,0,0,0,32,120v96a8,8,0,0,0,8,8h64a8,8,0,0,0,8-8V160h32v56a8,8,0,0,0,8,8h64a8,8,0,0,0,8-8V120A15.87,15.87,0,0,0,219.31,108.68ZM208,208H160V152a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8v56H48V120l80-80,80,80Z\"/>","Bills":"<path d=\"M224,56V208l-32-16-32,16-32-16L96,208,64,192,32,208V56a8,8,0,0,1,8-8H216A8,8,0,0,1,224,56Z\" opacity=\"0.2\"/><path d=\"M72,104a8,8,0,0,1,8-8h96a8,8,0,0,1,0,16H80A8,8,0,0,1,72,104Zm8,40h96a8,8,0,0,0,0-16H80a8,8,0,0,0,0,16ZM232,56V208a8,8,0,0,1-11.58,7.15L192,200.94l-28.42,14.21a8,8,0,0,1-7.16,0L128,200.94,99.58,215.15a8,8,0,0,1-7.16,0L64,200.94,35.58,215.15A8,8,0,0,1,24,208V56A16,16,0,0,1,40,40H216A16,16,0,0,1,232,56Zm-16,0H40V195.06l20.42-10.22a8,8,0,0,1,7.16,0L96,199.06l28.42-14.22a8,8,0,0,1,7.16,0L160,199.06l28.42-14.22a8,8,0,0,1,7.16,0L216,195.06Z\"/>","Partner":"<path d=\"M232,102c0,66-104,122-104,122S24,168,24,102A54,54,0,0,1,78,48c22.59,0,41.94,12.31,50,32,8.06-19.69,27.41-32,50-32A54,54,0,0,1,232,102Z\" opacity=\"0.2\"/><path d=\"M178,40c-20.65,0-38.73,8.88-50,23.89C116.73,48.88,98.65,40,78,40a62.07,62.07,0,0,0-62,62c0,70,103.79,126.66,108.21,129a8,8,0,0,0,7.58,0C136.21,228.66,240,172,240,102A62.07,62.07,0,0,0,178,40ZM128,214.8C109.74,204.16,32,155.69,32,102A46.06,46.06,0,0,1,78,56c19.45,0,35.78,10.36,42.6,27a8,8,0,0,0,14.8,0c6.82-16.67,23.15-27,42.6-27a46.06,46.06,0,0,1,46,46C224,155.61,146.24,204.15,128,214.8Z\"/>","Pets":"<path d=\"M232,108a20,20,0,1,1-20-20A20,20,0,0,1,232,108ZM64,108a20,20,0,1,0-20,20A20,20,0,0,0,64,108ZM92,80A20,20,0,1,0,72,60,20,20,0,0,0,92,80Zm72,0a20,20,0,1,0-20-20A20,20,0,0,0,164,80Zm19.24,75.85A43.46,43.46,0,0,1,162.57,130a36,36,0,0,0-69.14,0,43.49,43.49,0,0,1-20.67,25.9,32,32,0,0,0,27.73,57.62,72.49,72.49,0,0,1,55,0,32,32,0,0,0,27.73-57.62Z\" opacity=\"0.2\"/><path d=\"M212,80a28,28,0,1,0,28,28A28,28,0,0,0,212,80Zm0,40a12,12,0,1,1,12-12A12,12,0,0,1,212,120ZM72,108a28,28,0,1,0-28,28A28,28,0,0,0,72,108ZM44,120a12,12,0,1,1,12-12A12,12,0,0,1,44,120ZM92,88A28,28,0,1,0,64,60,28,28,0,0,0,92,88Zm0-40A12,12,0,1,1,80,60,12,12,0,0,1,92,48Zm72,40a28,28,0,1,0-28-28A28,28,0,0,0,164,88Zm0-40a12,12,0,1,1-12,12A12,12,0,0,1,164,48Zm23.12,100.86a35.3,35.3,0,0,1-16.87-21.14,44,44,0,0,0-84.5,0A35.25,35.25,0,0,1,69,148.82,40,40,0,0,0,88,224a39.48,39.48,0,0,0,15.52-3.13,64.09,64.09,0,0,1,48.87,0,40,40,0,0,0,34.73-72ZM168,208a24,24,0,0,1-9.45-1.93,80.14,80.14,0,0,0-61.19,0,24,24,0,0,1-20.71-43.26,51.22,51.22,0,0,0,24.46-30.67,28,28,0,0,1,53.78,0,51.27,51.27,0,0,0,24.53,30.71A24,24,0,0,1,168,208Z\"/>","Other":"<path d=\"M240,96v64a16,16,0,0,1-16,16H32a16,16,0,0,1-16-16V96A16,16,0,0,1,32,80H224A16,16,0,0,1,240,96Z\" opacity=\"0.2\"/><path d=\"M140,128a12,12,0,1,1-12-12A12,12,0,0,1,140,128Zm56-12a12,12,0,1,0,12,12A12,12,0,0,0,196,116ZM60,116a12,12,0,1,0,12,12A12,12,0,0,0,60,116Z\"/>","Work":"<path d=\"M224,118.31V200a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V118.31h0A191.14,191.14,0,0,0,128,144,191.08,191.08,0,0,0,224,118.31Z\" opacity=\"0.2\"/><path d=\"M104,112a8,8,0,0,1,8-8h32a8,8,0,0,1,0,16H112A8,8,0,0,1,104,112ZM232,72V200a16,16,0,0,1-16,16H40a16,16,0,0,1-16-16V72A16,16,0,0,1,40,56H80V48a24,24,0,0,1,24-24h48a24,24,0,0,1,24,24v8h40A16,16,0,0,1,232,72ZM96,56h64V48a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8ZM40,72v41.62A184.07,184.07,0,0,0,128,136a184,184,0,0,0,88-22.39V72ZM216,200V131.63A200.25,200.25,0,0,1,128,152a200.19,200.19,0,0,1-88-20.36V200H216Z\"/>","Subscriptions":"<path d=\"M224,80V200a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V80a8,8,0,0,1,8-8H216A8,8,0,0,1,224,80Z\" opacity=\"0.2\"/><path d=\"M216,64H147.31l34.35-34.34a8,8,0,1,0-11.32-11.32L128,60.69,85.66,18.34A8,8,0,0,0,74.34,29.66L108.69,64H40A16,16,0,0,0,24,80V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V80A16,16,0,0,0,216,64Zm0,136H40V80H216V200Z\"/>"},"pick":{"television-simple":"<path d=\"M224,80V200a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V80a8,8,0,0,1,8-8H216A8,8,0,0,1,224,80Z\" opacity=\"0.2\"/><path d=\"M216,64H147.31l34.35-34.34a8,8,0,1,0-11.32-11.32L128,60.69,85.66,18.34A8,8,0,0,0,74.34,29.66L108.69,64H40A16,16,0,0,0,24,80V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V80A16,16,0,0,0,216,64Zm0,136H40V80H216V200Z\"/>","coffee":"<path d=\"M208,88v48a88,88,0,0,1-51.3,80H83.3A88,88,0,0,1,32,136V88Z\" opacity=\"0.2\"/><path d=\"M80,56V24a8,8,0,0,1,16,0V56a8,8,0,0,1-16,0Zm40,8a8,8,0,0,0,8-8V24a8,8,0,0,0-16,0V56A8,8,0,0,0,120,64Zm32,0a8,8,0,0,0,8-8V24a8,8,0,0,0-16,0V56A8,8,0,0,0,152,64Zm96,56v8a40,40,0,0,1-37.51,39.91,96.59,96.59,0,0,1-27,40.09H208a8,8,0,0,1,0,16H32a8,8,0,0,1,0-16H56.54A96.3,96.3,0,0,1,24,136V88a8,8,0,0,1,8-8H208A40,40,0,0,1,248,120ZM200,96H40v40a80.27,80.27,0,0,0,45.12,72h69.76A80.27,80.27,0,0,0,200,136Zm32,24a24,24,0,0,0-16-22.62V136a95.78,95.78,0,0,1-1.2,15A24,24,0,0,0,232,128Z\"/>","pizza":"<path d=\"M218,91.76,187.13,142.4A32,32,0,1,0,154,196.78l-19.13,31.38a8,8,0,0,1-13.7,0L84.3,167.71a32,32,0,1,0-30.48-50L38,91.76a159.77,159.77,0,0,1,180,0Z\" opacity=\"0.2\"/><path d=\"M239.54,63a15.91,15.91,0,0,0-7.25-9.9,201.49,201.49,0,0,0-208.58,0,16,16,0,0,0-5.37,22l96,157.27a16,16,0,0,0,27.36,0L194,146.53v0l43.61-71.45A15.82,15.82,0,0,0,239.54,63ZM63.59,118.5a24,24,0,1,1,24.47,40.09Zm87.92,66.95A24,24,0,0,1,176,145.37Zm32.93-53.93a40,40,0,0,0-41.38,67.77L128,224,96.5,172.43a40,40,0,1,0-41.35-67.76L48.8,94.26a152,152,0,0,1,158.39,0Zm31.1-50.93a168.12,168.12,0,0,0-175.08,0L32,66.77a185.6,185.6,0,0,1,192,0Z\"/>","hamburger":"<path d=\"M188,176l20-7.27V184a32,32,0,0,1-32,32H80a32,32,0,0,1-32-32V167.27L68,160l40,16,40-16Zm27.82-89.72C209.32,55.55,172.48,32,128,32S46.68,55.55,40.18,86.28A8,8,0,0,0,48.07,96H207.93A8,8,0,0,0,215.82,86.28Z\" opacity=\"0.2\"/><path d=\"M48.07,104H207.93a16,16,0,0,0,15.72-19.38C216.22,49.5,176,24,128,24S39.78,49.5,32.35,84.62A16,16,0,0,0,48.07,104ZM128,40c39.82,0,74.21,20.61,79.93,48H48.07L48,87.93C53.79,60.61,88.18,40,128,40ZM229.26,152.48l-41.13,15L151,152.57a8,8,0,0,0-5.94,0l-37,14.81L71,152.57a8,8,0,0,0-5.7-.09l-44,16a8,8,0,0,0,5.47,15L40,178.69V184a40,40,0,0,0,40,40h96a40,40,0,0,0,40-40v-9.67l18.73-6.81a8,8,0,1,0-5.47-15ZM200,184a24,24,0,0,1-24,24H80a24,24,0,0,1-24-24V172.88l11.87-4.32L105,183.43a8,8,0,0,0,5.94,0l37-14.81,37,14.81a8,8,0,0,0,5.7.09l9.27-3.37ZM16,128a8,8,0,0,1,8-8H232a8,8,0,0,1,0,16H24A8,8,0,0,1,16,128Z\"/>","beer-bottle":"<path d=\"M160,160l-56,56L40,152,96,96Z\" opacity=\"0.2\"/><path d=\"M245.66,42.34l-32-32a8,8,0,0,0-11.32,11.32l1.48,1.47L148.65,64.51l-38.22,7.65a8.05,8.05,0,0,0-4.09,2.18L23,157.66a24,24,0,0,0,0,33.94L64.4,233a24,24,0,0,0,33.94,0l83.32-83.31a8,8,0,0,0,2.18-4.09l7.65-38.22,41.38-55.17,1.47,1.48a8,8,0,0,0,11.32-11.32ZM104,204.69,51.31,152,96,107.31,148.69,160ZM81.37,224a7.94,7.94,0,0,1-5.65-2.34L34.34,180.28a8,8,0,0,1,0-11.31L40,163.31,92.69,216,87,221.66A8,8,0,0,1,81.37,224ZM177.6,99.2a7.92,7.92,0,0,0-1.44,3.23l-7.53,37.63L160,148.69,107.31,96l8.63-8.63,37.63-7.53a7.92,7.92,0,0,0,3.23-1.44l58.45-43.84,6.19,6.19Z\"/>","wine":"<path d=\"M182.48,162.5a79.77,79.77,0,0,1-109,0A55.86,55.86,0,0,1,58.3,105.93l1.57-5.31h0C72.49,95.21,95.2,91.4,128,108c35.86,18.16,59.67,11.89,71.42,5.84h0A55.72,55.72,0,0,1,182.48,162.5Z\" opacity=\"0.2\"/><path d=\"M205.33,103.67,183.56,29.74A8,8,0,0,0,175.89,24H80.11a8,8,0,0,0-7.67,5.74L50.67,103.67a63.46,63.46,0,0,0,17.42,64.67A87.41,87.41,0,0,0,120,191.63V232H88a8,8,0,1,0,0,16h80a8,8,0,1,0,0-16H136V191.63a87.39,87.39,0,0,0,51.91-23.29A63.48,63.48,0,0,0,205.33,103.67ZM86.09,40h83.82L190,108.19c.09.3.17.6.25.9-21.42,7.68-45.54-1.6-58.63-8.23C106.43,88.11,86.43,86.49,71.68,88.93ZM177,156.65a71.69,71.69,0,0,1-98,0,47.55,47.55,0,0,1-13-48.46l.45-1.52c12-4.06,31.07-5.14,57.93,8.47,11.15,5.65,29.16,12.85,48.43,12.85a68.64,68.64,0,0,0,19.05-2.6A47.2,47.2,0,0,1,177,156.65Z\"/>","cake":"<path d=\"M104,48c0-24,24-40,24-40s24,16,24,40a24,24,0,0,1-48,0ZM208,96H48a16,16,0,0,0-16,16v23.33c0,17.44,13.67,32.18,31.1,32.66A32,32,0,0,0,96,136a32,32,0,0,0,64,0,32,32,0,0,0,32.9,32c17.43-.48,31.1-15.22,31.1-32.66V112A16,16,0,0,0,208,96Z\" opacity=\"0.2\"/><path d=\"M232,112a24,24,0,0,0-24-24H136V79a32.06,32.06,0,0,0,24-31c0-28-26.44-45.91-27.56-46.66a8,8,0,0,0-8.88,0C122.44,2.09,96,20,96,48a32.06,32.06,0,0,0,24,31v9H48a24,24,0,0,0-24,24v23.33a40.84,40.84,0,0,0,8,24.24V200a24,24,0,0,0,24,24H200a24,24,0,0,0,24-24V159.57a40.84,40.84,0,0,0,8-24.24ZM112,48c0-13.57,10-24.46,16-29.79,6,5.33,16,16.22,16,29.79a16,16,0,0,1-32,0ZM40,112a8,8,0,0,1,8-8H208a8,8,0,0,1,8,8v23.33c0,13.25-10.46,24.31-23.32,24.66A24,24,0,0,1,168,136a8,8,0,0,0-16,0,24,24,0,0,1-48,0,8,8,0,0,0-16,0,24,24,0,0,1-24.68,24C50.46,159.64,40,148.58,40,135.33Zm160,96H56a8,8,0,0,1-8-8V172.56A38.77,38.77,0,0,0,62.88,176a39.69,39.69,0,0,0,29-11.31A40.36,40.36,0,0,0,96,160a40,40,0,0,0,64,0,40.36,40.36,0,0,0,4.13,4.67A39.67,39.67,0,0,0,192,176c.38,0,.76,0,1.14,0A38.77,38.77,0,0,0,208,172.56V200A8,8,0,0,1,200,208Z\"/>","t-shirt":"<path d=\"M247.11,78.77l-19.27,36.81a8.44,8.44,0,0,1-7.5,4.42H192V40l51.78,28.25A7.81,7.81,0,0,1,247.11,78.77Zm-238.22,0,19.27,36.81a8.44,8.44,0,0,0,7.5,4.42H64V40L12.22,68.25A7.81,7.81,0,0,0,8.89,78.77Z\" opacity=\"0.2\"/><path d=\"M247.59,61.22,195.83,33A8,8,0,0,0,192,32H160a8,8,0,0,0-8,8,24,24,0,0,1-48,0,8,8,0,0,0-8-8H64a8,8,0,0,0-3.84,1L8.41,61.22A15.76,15.76,0,0,0,1.82,82.48l19.27,36.81A16.37,16.37,0,0,0,35.67,128H56v80a16,16,0,0,0,16,16H184a16,16,0,0,0,16-16V128h20.34a16.37,16.37,0,0,0,14.58-8.71l19.27-36.81A15.76,15.76,0,0,0,247.59,61.22ZM35.67,112a.62.62,0,0,1-.41-.13L16.09,75.26,56,53.48V112ZM184,208H72V48h16.8a40,40,0,0,0,78.38,0H184Zm36.75-96.14a.55.55,0,0,1-.41.14H200V53.48l39.92,21.78Z\"/>","sneaker":"<path d=\"M248,167.06V168H32V75.54A8,8,0,0,1,37.27,68L113,40.48a8,8,0,0,1,10,4.27L146.27,99.1a32,32,0,0,0,19.12,17.36l60.73,20.25A32,32,0,0,1,248,167.06Z\" opacity=\"0.2\"/><path d=\"M228.65,129.11l-60.73-20.24a24,24,0,0,1-14.32-13L130.39,41.6s0-.07,0-.1A16,16,0,0,0,110.25,33L34.53,60.49A16.05,16.05,0,0,0,24,75.53V192a16,16,0,0,0,16,16H240a16,16,0,0,0,16-16V167.06A40,40,0,0,0,228.65,129.11ZM40,75.53,115.72,48l7.11,16.63-21.56,7.85A8,8,0,0,0,104,88a7.91,7.91,0,0,0,2.73-.49l22.4-8.14,4.74,11.07-16.6,6A8,8,0,0,0,120,112a7.91,7.91,0,0,0,2.73-.49l17.6-6.4a40.06,40.06,0,0,0,7.68,10l-14.74,5.36A8,8,0,0,0,136,136a8.14,8.14,0,0,0,2.73-.48l28-10.18,56.87,18.95A24,24,0,0,1,238.93,160H40ZM240,192H40V176H240Z\"/>","scissors":"<path d=\"M40.2,95.8a28,28,0,1,1,39.6,0A28,28,0,0,1,40.2,95.8Zm0,64.4a28,28,0,1,0,39.6,0A28,28,0,0,0,40.2,160.2Z\" opacity=\"0.2\"/><path d=\"M157.73,113.13A8,8,0,0,1,159.82,102L227.48,55.7a8,8,0,0,1,9,13.21l-67.67,46.3a7.92,7.92,0,0,1-4.51,1.4A8,8,0,0,1,157.73,113.13Zm80.87,85.09a8,8,0,0,1-11.12,2.08L136,137.7,93.49,166.78a36,36,0,1,1-9-13.19L121.83,128,84.44,102.41a35.86,35.86,0,1,1,9-13.19l143,97.87A8,8,0,0,1,238.6,198.22ZM80,180a20,20,0,1,0-5.86,14.14A19.85,19.85,0,0,0,80,180ZM74.14,90.13a20,20,0,1,0-28.28,0A19.85,19.85,0,0,0,74.14,90.13Z\"/>","barbell":"<path d=\"M96,64V192a8,8,0,0,1-8,8H64a8,8,0,0,1-8-8V64a8,8,0,0,1,8-8H88A8,8,0,0,1,96,64Zm96-8H168a8,8,0,0,0-8,8V192a8,8,0,0,0,8,8h24a8,8,0,0,0,8-8V64A8,8,0,0,0,192,56Z\" opacity=\"0.2\"/><path d=\"M248,120h-8V88a16,16,0,0,0-16-16H208V64a16,16,0,0,0-16-16H168a16,16,0,0,0-16,16v56H104V64A16,16,0,0,0,88,48H64A16,16,0,0,0,48,64v8H32A16,16,0,0,0,16,88v32H8a8,8,0,0,0,0,16h8v32a16,16,0,0,0,16,16H48v8a16,16,0,0,0,16,16H88a16,16,0,0,0,16-16V136h48v56a16,16,0,0,0,16,16h24a16,16,0,0,0,16-16v-8h16a16,16,0,0,0,16-16V136h8a8,8,0,0,0,0-16ZM32,168V88H48v80Zm56,24H64V64H88V192Zm104,0H168V64h24V175.83c0,.06,0,.11,0,.17s0,.12,0,.17V192Zm32-24H208V88h16Z\"/>","heartbeat":"<path d=\"M232,102c0,66-104,122-104,122S24,168,24,102A54,54,0,0,1,78,48c22.59,0,41.94,12.31,50,32,8.06-19.69,27.41-32,50-32A54,54,0,0,1,232,102Z\" opacity=\"0.2\"/><path d=\"M72,144H32a8,8,0,0,1,0-16H67.72l13.62-20.44a8,8,0,0,1,13.32,0l25.34,38,9.34-14A8,8,0,0,1,136,128h24a8,8,0,0,1,0,16H140.28l-13.62,20.44a8,8,0,0,1-13.32,0L88,126.42l-9.34,14A8,8,0,0,1,72,144ZM178,40c-20.65,0-38.73,8.88-50,23.89C116.73,48.88,98.65,40,78,40a62.07,62.07,0,0,0-62,62c0,.75,0,1.5,0,2.25a8,8,0,1,0,16-.5c0-.58,0-1.17,0-1.75A46.06,46.06,0,0,1,78,56c19.45,0,35.78,10.36,42.6,27a8,8,0,0,0,14.8,0c6.82-16.67,23.15-27,42.6-27a46.06,46.06,0,0,1,46,46c0,53.61-77.76,102.15-96,112.8-10.83-6.31-42.63-26-66.68-52.21a8,8,0,1,0-11.8,10.82c31.17,34,72.93,56.68,74.69,57.63a8,8,0,0,0,7.58,0C136.21,228.66,240,172,240,102A62.07,62.07,0,0,0,178,40Z\"/>","pill":"<path d=\"M160,160l-50.75,50.75a45.26,45.26,0,0,1-64,0h0a45.26,45.26,0,0,1,0-64L96,96Z\" opacity=\"0.2\"/><path d=\"M216.43,39.6a53.27,53.27,0,0,0-75.33,0L39.6,141.09a53.26,53.26,0,0,0,75.32,75.31L216.43,114.91A53.32,53.32,0,0,0,216.43,39.6ZM103.61,205.09h0a37.26,37.26,0,0,1-52.7-52.69L96,107.31,148.7,160ZM205.11,103.6,160,148.69,107.32,96l45.1-45.09a37.26,37.26,0,0,1,52.69,52.69ZM189.68,82.34a8,8,0,0,1,0,11.32l-24,24a8,8,0,1,1-11.31-11.32l24-24A8,8,0,0,1,189.68,82.34Z\"/>","first-aid":"<path d=\"M224,104v48a8,8,0,0,1-8,8H160v56a8,8,0,0,1-8,8H104a8,8,0,0,1-8-8V160H40a8,8,0,0,1-8-8V104a8,8,0,0,1,8-8H96V40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8V96h56A8,8,0,0,1,224,104Z\" opacity=\"0.2\"/><path d=\"M216,88H168V40a16,16,0,0,0-16-16H104A16,16,0,0,0,88,40V88H40a16,16,0,0,0-16,16v48a16,16,0,0,0,16,16H88v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V168h48a16,16,0,0,0,16-16V104A16,16,0,0,0,216,88Zm0,64H160a8,8,0,0,0-8,8v56H104V160a8,8,0,0,0-8-8H40V104H96a8,8,0,0,0,8-8V40h48V96a8,8,0,0,0,8,8h56Z\"/>","graduation-cap":"<path d=\"M216,113.07v53.22a8,8,0,0,1-2,5.31c-11.3,12.59-38.9,36.4-86,36.4s-74.68-23.81-86-36.4a8,8,0,0,1-2-5.31V113.07L128,160Z\" opacity=\"0.2\"/><path d=\"M251.76,88.94l-120-64a8,8,0,0,0-7.52,0l-120,64a8,8,0,0,0,0,14.12L32,117.87v48.42a15.91,15.91,0,0,0,4.06,10.65C49.16,191.53,78.51,216,128,216a130,130,0,0,0,48-8.76V240a8,8,0,0,0,16,0V199.51a115.63,115.63,0,0,0,27.94-22.57A15.91,15.91,0,0,0,224,166.29V117.87l27.76-14.81a8,8,0,0,0,0-14.12ZM128,200c-43.27,0-68.72-21.14-80-33.71V126.4l76.24,40.66a8,8,0,0,0,7.52,0L176,143.47v46.34C163.4,195.69,147.52,200,128,200Zm80-33.75a97.83,97.83,0,0,1-16,14.25V134.93l16-8.53ZM188,118.94l-.22-.13-56-29.87a8,8,0,0,0-7.52,14.12L171,128l-43,22.93L25,96,128,41.07,231,96Z\"/>","book-open":"<path d=\"M232,56V200H160a32,32,0,0,0-32,32,32,32,0,0,0-32-32H24V56H96a32,32,0,0,1,32,32,32,32,0,0,1,32-32Z\" opacity=\"0.2\"/><path d=\"M232,48H160a40,40,0,0,0-32,16A40,40,0,0,0,96,48H24a8,8,0,0,0-8,8V200a8,8,0,0,0,8,8H96a24,24,0,0,1,24,24,8,8,0,0,0,16,0,24,24,0,0,1,24-24h72a8,8,0,0,0,8-8V56A8,8,0,0,0,232,48ZM96,192H32V64H96a24,24,0,0,1,24,24V200A39.81,39.81,0,0,0,96,192Zm128,0H160a39.81,39.81,0,0,0-24,8V88a24,24,0,0,1,24-24h64Z\"/>","baby":"<path d=\"M224,128a96,96,0,1,1-96-96A96,96,0,0,1,224,128Z\" opacity=\"0.2\"/><path d=\"M92,140a12,12,0,1,1,12-12A12,12,0,0,1,92,140Zm72-24a12,12,0,1,0,12,12A12,12,0,0,0,164,116Zm-12.27,45.23a45,45,0,0,1-47.46,0,8,8,0,0,0-8.54,13.54,61,61,0,0,0,64.54,0,8,8,0,0,0-8.54-13.54ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88.11,88.11,0,0,0-84.09-87.91C120.32,56.38,120,71.88,120,72a8,8,0,0,0,16,0,8,8,0,0,1,16,0,24,24,0,0,1-48,0c0-.73.13-14.3,8.46-30.63A88,88,0,1,0,216,128Z\"/>","dog":"<path d=\"M208,120.38V184a32,32,0,0,1-32,32H80a32,32,0,0,1-32-32V120.38L104,48h48Z\" opacity=\"0.2\"/><path d=\"M239.71,125l-16.42-88a16,16,0,0,0-19.61-12.58l-.31.09L150.85,40h-45.7L52.63,24.56l-.31-.09A16,16,0,0,0,32.71,37.05L16.29,125a15.77,15.77,0,0,0,9.12,17.52A16.26,16.26,0,0,0,32.12,144,15.48,15.48,0,0,0,40,141.84V184a40,40,0,0,0,40,40h96a40,40,0,0,0,40-40V141.85a15.5,15.5,0,0,0,7.87,2.16,16.31,16.31,0,0,0,6.72-1.47A15.77,15.77,0,0,0,239.71,125ZM32,128h0L48.43,40,90.5,52.37Zm144,80H136V195.31l13.66-13.65a8,8,0,0,0-11.32-11.32L128,180.69l-10.34-10.35a8,8,0,0,0-11.32,11.32L120,195.31V208H80a24,24,0,0,1-24-24V123.11L107.93,56h40.14L200,123.11V184A24,24,0,0,1,176,208Zm48-80L165.5,52.37,207.57,40,224,128ZM104,140a12,12,0,1,1-12-12A12,12,0,0,1,104,140Zm72,0a12,12,0,1,1-12-12A12,12,0,0,1,176,140Z\"/>","cat":"<path d=\"M224,48v88c0,48.6-43,88-96,88s-96-39.4-96-88V48a8,8,0,0,1,13.66-5.66L67.6,67.6h0a102.87,102.87,0,0,1,120.8,0h0l21.94-25.24A8,8,0,0,1,224,48Z\" opacity=\"0.2\"/><path d=\"M96,140a12,12,0,1,1-12-12A12,12,0,0,1,96,140Zm76-12a12,12,0,1,0,12,12A12,12,0,0,0,172,128Zm60-80v88c0,52.93-46.65,96-104,96S24,188.93,24,136V48A16,16,0,0,1,51.31,36.69c.14.14.26.27.38.41L69,57a111.22,111.22,0,0,1,118.1,0L204.31,37.1c.12-.14.24-.27.38-.41A16,16,0,0,1,232,48Zm-16,0-21.56,24.8A8,8,0,0,1,183.63,74,88.86,88.86,0,0,0,168,64.75V88a8,8,0,1,1-16,0V59.05a97.43,97.43,0,0,0-16-2.72V88a8,8,0,1,1-16,0V56.33a97.43,97.43,0,0,0-16,2.72V88a8,8,0,1,1-16,0V64.75A88.86,88.86,0,0,0,72.37,74a8,8,0,0,1-10.81-1.17L40,48v88c0,41.66,35.21,76,80,79.67V195.31l-13.66-13.66a8,8,0,0,1,11.32-11.31L128,180.68l10.34-10.34a8,8,0,0,1,11.32,11.31L136,195.31v20.36c44.79-3.69,80-38,80-79.67Z\"/>","car":"<path d=\"M184,176h40v24a8,8,0,0,1-8,8H192a8,8,0,0,1-8-8ZM32,200a8,8,0,0,0,8,8H64a8,8,0,0,0,8-8V176H32ZM194.11,44.75A8,8,0,0,0,186.8,40H69.2a8,8,0,0,0-7.31,4.75L32,112H224Z\" opacity=\"0.2\"/><path d=\"M240,104H229.2L201.42,41.5A16,16,0,0,0,186.8,32H69.2a16,16,0,0,0-14.62,9.5L26.8,104H16a8,8,0,0,0,0,16h8v80a16,16,0,0,0,16,16H64a16,16,0,0,0,16-16V184h96v16a16,16,0,0,0,16,16h24a16,16,0,0,0,16-16V120h8a8,8,0,0,0,0-16ZM69.2,48H186.8l24.89,56H44.31ZM64,200H40V184H64Zm128,0V184h24v16Zm24-32H40V120H216ZM56,144a8,8,0,0,1,8-8H80a8,8,0,0,1,0,16H64A8,8,0,0,1,56,144Zm112,0a8,8,0,0,1,8-8h16a8,8,0,0,1,0,16H176A8,8,0,0,1,168,144Z\"/>","motorcycle":"<path d=\"M248,160a32,32,0,1,1-32-32A32,32,0,0,1,248,160ZM40,128a32,32,0,1,0,32,32A32,32,0,0,0,40,128Z\" opacity=\"0.2\"/><path d=\"M216,120a41,41,0,0,0-6.6.55l-5.82-15.14A55.64,55.64,0,0,1,216,104a8,8,0,0,0,0-16H196.88L183.47,53.13A8,8,0,0,0,176,48H144a8,8,0,0,0,0,16h26.51l9.23,24H152c-18.5,0-33.5,4.31-43.37,12.46a16,16,0,0,1-16.76,2.07C81.29,97.72,31.13,77.33,26.71,75.6L21,73.36A17.74,17.74,0,0,0,16,72a8,8,0,0,0-2.87,15.46h0c.46.18,47.19,18.3,72.13,29.63a32.15,32.15,0,0,0,33.56-4.29c4.86-4,14.57-8.8,33.19-8.8h18.82a71.74,71.74,0,0,0-24.17,36.59A15.86,15.86,0,0,1,131.32,152H79.2a40,40,0,1,0,0,16h52.12a31.91,31.91,0,0,0,30.74-23.1,56,56,0,0,1,26.59-33.72l5.82,15.13A40,40,0,1,0,216,120ZM40,168H62.62a24,24,0,1,1,0-16H40a8,8,0,0,0,0,16Zm176,16a24,24,0,0,1-15.58-42.23l8.11,21.1a8,8,0,1,0,14.94-5.74L215.35,136l.65,0a24,24,0,0,1,0,48Z\"/>","bus":"<path d=\"M48,184H88v24a8,8,0,0,1-8,8H56a8,8,0,0,1-8-8Zm120,24a8,8,0,0,0,8,8h24a8,8,0,0,0,8-8V184H168ZM48,72v40H208V72Z\" opacity=\"0.2\"/><path d=\"M184,32H72A32,32,0,0,0,40,64V208a16,16,0,0,0,16,16H80a16,16,0,0,0,16-16V192h64v16a16,16,0,0,0,16,16h24a16,16,0,0,0,16-16V64A32,32,0,0,0,184,32ZM56,176V120H200v56Zm0-96H200v24H56ZM72,48H184a16,16,0,0,1,16,16H56A16,16,0,0,1,72,48Zm8,160H56V192H80Zm96,0V192h24v16Zm-72-60a12,12,0,1,1-12-12A12,12,0,0,1,104,148Zm72,0a12,12,0,1,1-12-12A12,12,0,0,1,176,148Zm72-68v24a8,8,0,0,1-16,0V80a8,8,0,0,1,16,0ZM24,80v24a8,8,0,0,1-16,0V80a8,8,0,0,1,16,0Z\"/>","airplane":"<path d=\"M152,152v32l16,16v32l-40-16L88,232V200l16-16V152L24,168V136l80-40V48a24,24,0,0,1,48,0V96l80,40v32Z\" opacity=\"0.2\"/><path d=\"M235.58,128.84,160,91.06V48a32,32,0,0,0-64,0V91.06L20.42,128.84A8,8,0,0,0,16,136v32a8,8,0,0,0,9.57,7.84L96,161.76v18.93L82.34,194.34A8,8,0,0,0,80,200v32a8,8,0,0,0,11,7.43l37-14.81,37,14.81A8,8,0,0,0,176,232V200a8,8,0,0,0-2.34-5.66L160,180.69V161.76l70.43,14.08A8,8,0,0,0,240,168V136A8,8,0,0,0,235.58,128.84ZM224,158.24l-70.43-14.08A8,8,0,0,0,144,152v32a8,8,0,0,0,2.34,5.66L160,203.31v16.87l-29-11.61a8,8,0,0,0-5.94,0L96,220.18V203.31l13.66-13.65A8,8,0,0,0,112,184V152a8,8,0,0,0-9.57-7.84L32,158.24v-17.3l75.58-37.78A8,8,0,0,0,112,96V48a16,16,0,0,1,32,0V96a8,8,0,0,0,4.42,7.16L224,140.94Z\"/>","train":"<path d=\"M208,72v56H48V72Z\" opacity=\"0.2\"/><path d=\"M184,24H72A32,32,0,0,0,40,56V184a32,32,0,0,0,32,32h8L65.6,235.2a8,8,0,1,0,12.8,9.6L100,216h56l21.6,28.8a8,8,0,1,0,12.8-9.6L176,216h8a32,32,0,0,0,32-32V56A32,32,0,0,0,184,24ZM56,120V80h64v40Zm80-40h64v40H136ZM72,40H184a16,16,0,0,1,16,16v8H56V56A16,16,0,0,1,72,40ZM184,200H72a16,16,0,0,1-16-16V136H200v48A16,16,0,0,1,184,200ZM96,172a12,12,0,1,1-12-12A12,12,0,0,1,96,172Zm88,0a12,12,0,1,1-12-12A12,12,0,0,1,184,172Z\"/>","lightning":"<path d=\"M96,240l16-80L48,136,160,16,144,96l64,24Z\" opacity=\"0.2\"/><path d=\"M215.79,118.17a8,8,0,0,0-5-5.66L153.18,90.9l14.66-73.33a8,8,0,0,0-13.69-7l-112,120a8,8,0,0,0,3,13l57.63,21.61L88.16,238.43a8,8,0,0,0,13.69,7l112-120A8,8,0,0,0,215.79,118.17ZM109.37,214l10.47-52.38a8,8,0,0,0-5-9.06L62,132.71l84.62-90.66L136.16,94.43a8,8,0,0,0,5,9.06l52.8,19.8Z\"/>","drop":"<path d=\"M208,144a80,80,0,0,1-160,0c0-72,80-128,80-128S208,72,208,144Z\" opacity=\"0.2\"/><path d=\"M174,47.75a254.19,254.19,0,0,0-41.45-38.3,8,8,0,0,0-9.18,0A254.19,254.19,0,0,0,82,47.75C54.51,79.32,40,112.6,40,144a88,88,0,0,0,176,0C216,112.6,201.49,79.32,174,47.75ZM128,216a72.08,72.08,0,0,1-72-72c0-57.23,55.47-105,72-118,16.53,13,72,60.75,72,118A72.08,72.08,0,0,1,128,216Zm55.89-62.66a57.6,57.6,0,0,1-46.56,46.55A8.75,8.75,0,0,1,136,200a8,8,0,0,1-1.32-15.89c16.57-2.79,30.63-16.85,33.44-33.45a8,8,0,0,1,15.78,2.68Z\"/>","wifi-high":"<path d=\"M238.2,87.69l-104,125.43a8,8,0,0,1-12.3,0L17.8,87.69a7.79,7.79,0,0,1,1.31-11.21,180.75,180.75,0,0,1,217.78,0A7.79,7.79,0,0,1,238.2,87.69Z\" opacity=\"0.2\"/><path d=\"M247.89,80.91a15.93,15.93,0,0,0-6.17-10.81A186.67,186.67,0,0,0,128,32,186.67,186.67,0,0,0,14.28,70.1,15.93,15.93,0,0,0,8.11,80.91,15.65,15.65,0,0,0,11.65,92.8l104,125.43A15.93,15.93,0,0,0,128,224h0a15.93,15.93,0,0,0,12.31-5.77l104-125.43A15.65,15.65,0,0,0,247.89,80.91ZM128,208,24.09,82.74A170.76,170.76,0,0,1,128,48,170.76,170.76,0,0,1,231.91,82.74Z\"/>","phone":"<path d=\"M223.94,174.08A48.33,48.33,0,0,1,176,216,136,136,0,0,1,40,80,48.33,48.33,0,0,1,81.92,32.06a8,8,0,0,1,8.3,4.8l21.13,47.2a8,8,0,0,1-.66,7.53L89.32,117a7.93,7.93,0,0,0-.54,7.81c8.27,16.93,25.77,34.22,42.75,42.41a7.92,7.92,0,0,0,7.83-.59l25-21.3a8,8,0,0,1,7.59-.69l47.16,21.13A8,8,0,0,1,223.94,174.08Z\" opacity=\"0.2\"/><path d=\"M222.37,158.46l-47.11-21.11-.13-.06a16,16,0,0,0-15.17,1.4,8.12,8.12,0,0,0-.75.56L134.87,160c-15.42-7.49-31.34-23.29-38.83-38.51l20.78-24.71c.2-.25.39-.5.57-.77a16,16,0,0,0,1.32-15.06l0-.12L97.54,33.64a16,16,0,0,0-16.62-9.52A56.26,56.26,0,0,0,32,80c0,79.4,64.6,144,144,144a56.26,56.26,0,0,0,55.88-48.92A16,16,0,0,0,222.37,158.46ZM176,208A128.14,128.14,0,0,1,48,80,40.2,40.2,0,0,1,82.87,40a.61.61,0,0,0,0,.12l21,47L83.2,111.86a6.13,6.13,0,0,0-.57.77,16,16,0,0,0-1,15.7c9.06,18.53,27.73,37.06,46.46,46.11a16,16,0,0,0,15.75-1.14,8.44,8.44,0,0,0,.74-.56L168.89,152l47,21.05h0s.08,0,.11,0A40.21,40.21,0,0,1,176,208Z\"/>","game-controller":"<path d=\"M216.86,207.57a28,28,0,0,1-24.66-7.77L150.09,152H172a51.94,51.94,0,0,0,51.2-61h0l16.36,84.17A28,28,0,0,1,216.86,207.57Z\" opacity=\"0.2\"/><path d=\"M176,112H152a8,8,0,0,1,0-16h24a8,8,0,0,1,0,16ZM104,96H96V88a8,8,0,0,0-16,0v8H72a8,8,0,0,0,0,16h8v8a8,8,0,0,0,16,0v-8h8a8,8,0,0,0,0-16ZM241.48,200.65a36,36,0,0,1-54.94,4.81c-.12-.12-.24-.24-.35-.37L146.48,160h-37L69.81,205.09l-.35.37A36.08,36.08,0,0,1,44,216,36,36,0,0,1,8.56,173.75a.68.68,0,0,1,0-.14L24.93,89.52A59.88,59.88,0,0,1,83.89,40H172a60.08,60.08,0,0,1,59,49.25c0,.06,0,.12,0,.18l16.37,84.17a.68.68,0,0,1,0,.14A35.74,35.74,0,0,1,241.48,200.65ZM172,144a44,44,0,0,0,0-88H83.89A43.9,43.9,0,0,0,40.68,92.37l0,.13L24.3,176.59A20,20,0,0,0,58,194.3l41.92-47.59a8,8,0,0,1,6-2.71Zm59.7,32.59-8.74-45A60,60,0,0,1,172,160h-4.2L198,194.31a20.09,20.09,0,0,0,17.46,5.39,20,20,0,0,0,16.23-23.11Z\"/>","music-notes":"<path d=\"M208,164a28,28,0,1,1-28-28A28,28,0,0,1,208,164ZM52,168a28,28,0,1,0,28,28A28,28,0,0,0,52,168Z\" opacity=\"0.2\"/><path d=\"M212.92,17.69a8,8,0,0,0-6.86-1.45l-128,32A8,8,0,0,0,72,56V166.08A36,36,0,1,0,88,196V110.25l112-28v51.83A36,36,0,1,0,216,164V24A8,8,0,0,0,212.92,17.69ZM52,216a20,20,0,1,1,20-20A20,20,0,0,1,52,216ZM88,93.75V62.25l112-28v31.5ZM180,184a20,20,0,1,1,20-20A20,20,0,0,1,180,184Z\"/>","film-slate":"<path d=\"M67.71,64.59l47.79,27.6L40.43,112,32.27,82a7.76,7.76,0,0,1,5.58-9.52ZM199.84,37.76a7.9,7.9,0,0,0-9.66-5.49L126.61,49.05,174.4,76.64,208,67.77Z\" opacity=\"0.2\"/><path d=\"M216,104H102.09L210,75.51a8,8,0,0,0,5.68-9.84l-8.16-30a15.93,15.93,0,0,0-19.42-11.13L35.81,64.74a15.75,15.75,0,0,0-9.7,7.4,15.51,15.51,0,0,0-1.55,12L32,111.56c0,.14,0,.29,0,.44v88a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V112A8,8,0,0,0,216,104ZM192.16,40l6,22.07-22.62,6L147.42,51.83Zm-66.69,17.6,28.12,16.24-36.94,9.75L88.53,67.37Zm-79.4,44.62-6-22.08,26.5-7L94.69,89.4ZM208,200H48V120H208v80Z\"/>","gift":"<path d=\"M208,128v72a8,8,0,0,1-8,8H56a8,8,0,0,1-8-8V128Z\" opacity=\"0.2\"/><path d=\"M216,72H180.92c.39-.33.79-.65,1.17-1A29.53,29.53,0,0,0,192,49.57,32.62,32.62,0,0,0,158.44,16,29.53,29.53,0,0,0,137,25.91a54.94,54.94,0,0,0-9,14.48,54.94,54.94,0,0,0-9-14.48A29.53,29.53,0,0,0,97.56,16,32.62,32.62,0,0,0,64,49.57,29.53,29.53,0,0,0,73.91,71c.38.33.78.65,1.17,1H40A16,16,0,0,0,24,88v32a16,16,0,0,0,16,16v64a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V136a16,16,0,0,0,16-16V88A16,16,0,0,0,216,72ZM149,36.51a13.69,13.69,0,0,1,10-4.5h.49A16.62,16.62,0,0,1,176,49.08a13.69,13.69,0,0,1-4.5,10c-9.49,8.4-25.24,11.36-35,12.4C137.7,60.89,141,45.5,149,36.51Zm-64.09.36A16.63,16.63,0,0,1,96.59,32h.49a13.69,13.69,0,0,1,10,4.5c8.39,9.48,11.35,25.2,12.39,34.92-9.72-1-25.44-4-34.92-12.39a13.69,13.69,0,0,1-4.5-10A16.6,16.6,0,0,1,84.87,36.87ZM40,88h80v32H40Zm16,48h64v64H56Zm144,64H136V136h64Zm16-80H136V88h80v32Z\"/>","hand-heart":"<path d=\"M16,152H48v56H16a8,8,0,0,1-8-8V160A8,8,0,0,1,16,152ZM192.54,40A39.12,39.12,0,0,0,156,64a39.12,39.12,0,0,0-36.54-24C97.67,40,80,58.31,80,80c0,14.56,7,27.71,16.73,40H140a20,20,0,0,1,0,40h4l37.78-8.68C203.82,135.07,232,109.23,232,80,232,58.31,214.33,40,192.54,40Z\" opacity=\"0.2\"/><path d=\"M230.33,141.06a24.34,24.34,0,0,0-18.61-4.77C230.5,117.33,240,98.48,240,80c0-26.47-21.29-48-47.46-48A47.58,47.58,0,0,0,156,48.75,47.58,47.58,0,0,0,119.46,32C93.29,32,72,53.53,72,80c0,11,3.24,21.69,10.06,33a31.87,31.87,0,0,0-14.75,8.4L44.69,144H16A16,16,0,0,0,0,160v40a16,16,0,0,0,16,16H120a7.93,7.93,0,0,0,1.94-.24l64-16a6.94,6.94,0,0,0,1.19-.4L226,182.82l.44-.2a24.6,24.6,0,0,0,3.93-41.56ZM119.46,48A31.15,31.15,0,0,1,148.6,67a8,8,0,0,0,14.8,0,31.15,31.15,0,0,1,29.14-19C209.59,48,224,62.65,224,80c0,19.51-15.79,41.58-45.66,63.9l-11.09,2.55A28,28,0,0,0,140,112H100.68C92.05,100.36,88,90.12,88,80,88,62.65,102.41,48,119.46,48ZM16,160H40v40H16Zm203.43,8.21-38,16.18L119,200H56V155.31l22.63-22.62A15.86,15.86,0,0,1,89.94,128H140a12,12,0,0,1,0,24H112a8,8,0,0,0,0,16h32a8.32,8.32,0,0,0,1.79-.2l67-15.41.31-.08a8.6,8.6,0,0,1,6.3,15.9Z\"/>","piggy-bank":"<path d=\"M240,112v32a16,16,0,0,1-16,16h-8l-18.1,50.69a8,8,0,0,1-7.54,5.31H177.64a8,8,0,0,1-7.54-5.31L166.29,200H97.71L93.9,210.69A8,8,0,0,1,86.36,216H73.64a8,8,0,0,1-7.54-5.31L53,174a79.7,79.7,0,0,1-21-54h0a80,80,0,0,1,80-80h32a80,80,0,0,1,73.44,48.22,82.22,82.22,0,0,1,2.9,7.78H224A16,16,0,0,1,240,112Z\" opacity=\"0.2\"/><path d=\"M192,116a12,12,0,1,1-12-12A12,12,0,0,1,192,116ZM152,64H112a8,8,0,0,0,0,16h40a8,8,0,0,0,0-16Zm96,48v32a24,24,0,0,1-24,24h-2.36l-16.21,45.38A16,16,0,0,1,190.36,224H177.64a16,16,0,0,1-15.07-10.62L160.65,208h-57.3l-1.92,5.38A16,16,0,0,1,86.36,224H73.64a16,16,0,0,1-15.07-10.62L46,178.22a87.69,87.69,0,0,1-21.44-48.38A16,16,0,0,0,16,144a8,8,0,0,1-16,0,32,32,0,0,1,24.28-31A88.12,88.12,0,0,1,112,32H216a8,8,0,0,1,0,16H194.61a87.93,87.93,0,0,1,30.17,37c.43,1,.85,2,1.25,3A24,24,0,0,1,248,112Zm-16,0a8,8,0,0,0-8-8h-3.66a8,8,0,0,1-7.64-5.6A71.9,71.9,0,0,0,144,48H112A72,72,0,0,0,58.91,168.64a8,8,0,0,1,1.64,2.71L73.64,208H86.36l3.82-10.69A8,8,0,0,1,97.71,192h68.58a8,8,0,0,1,7.53,5.31L177.64,208h12.72l18.11-50.69A8,8,0,0,1,216,152h8a8,8,0,0,0,8-8Z\"/>","bank":"<path d=\"M232,96H24L128,32Z\" opacity=\"0.2\"/><path d=\"M24,104H48v64H32a8,8,0,0,0,0,16H224a8,8,0,0,0,0-16H208V104h24a8,8,0,0,0,4.19-14.81l-104-64a8,8,0,0,0-8.38,0l-104,64A8,8,0,0,0,24,104Zm40,0H96v64H64Zm80,0v64H112V104Zm48,64H160V104h32ZM128,41.39,203.74,88H52.26ZM248,208a8,8,0,0,1-8,8H16a8,8,0,0,1,0-16H240A8,8,0,0,1,248,208Z\"/>","wrench":"<path d=\"M224,96a64,64,0,0,1-94.94,56L73,217A24,24,0,0,1,39,183L104,126.94a64,64,0,0,1,80-90.29L144,80l5.66,26.34L176,112l43.35-40A63.8,63.8,0,0,1,224,96Z\" opacity=\"0.2\"/><path d=\"M226.76,69a8,8,0,0,0-12.84-2.88l-40.3,37.19-17.23-3.7-3.7-17.23,37.19-40.3A8,8,0,0,0,187,29.24,72,72,0,0,0,88,96,72.34,72.34,0,0,0,94,124.94L33.79,177c-.15.12-.29.26-.43.39a32,32,0,0,0,45.26,45.26c.13-.13.27-.28.39-.42L131.06,162A72,72,0,0,0,232,96,71.56,71.56,0,0,0,226.76,69ZM160,152a56.14,56.14,0,0,1-27.07-7,8,8,0,0,0-9.92,1.77L67.11,211.51a16,16,0,0,1-22.62-22.62L109.18,133a8,8,0,0,0,1.77-9.93,56,56,0,0,1,58.36-82.31l-31.2,33.81a8,8,0,0,0-1.94,7.1L141.83,108a8,8,0,0,0,6.14,6.14l26.35,5.66a8,8,0,0,0,7.1-1.94l33.81-31.2A56.06,56.06,0,0,1,160,152Z\"/>","paint-brush":"<path d=\"M224,32c0,32.81-31.64,67.43-58.64,91.05A84.39,84.39,0,0,0,133,90.64C156.57,63.64,191.19,32,224,32Z\" opacity=\"0.2\"/><path d=\"M232,32a8,8,0,0,0-8-8c-44.08,0-89.31,49.71-114.43,82.63A60,60,0,0,0,32,164c0,30.88-19.54,44.73-20.47,45.37A8,8,0,0,0,16,224H92a60,60,0,0,0,57.37-77.57C182.3,121.31,232,76.08,232,32ZM92,208H34.63C41.38,198.41,48,183.92,48,164a44,44,0,1,1,44,44Zm32.42-94.45q5.14-6.66,10.09-12.55A76.23,76.23,0,0,1,155,121.49q-5.9,4.94-12.55,10.09A60.54,60.54,0,0,0,124.42,113.55Zm42.7-2.68a92.57,92.57,0,0,0-22-22c31.78-34.53,55.75-45,69.9-47.91C212.17,55.12,201.65,79.09,167.12,110.87Z\"/>","plant":"<path d=\"M138.54,149.46C106.62,96.25,149.18,43.05,239.63,48.37,245,138.82,191.75,181.39,138.54,149.46ZM16.26,88.26c-3.8,64.61,34.21,95,72.21,72.21C111.27,122.47,80.87,84.46,16.26,88.26Z\" opacity=\"0.2\"/><path d=\"M247.63,47.89a8,8,0,0,0-7.52-7.52c-51.76-3-93.32,12.74-111.18,42.22-11.8,19.48-11.78,43.16-.16,65.74a71.37,71.37,0,0,0-14.17,26.95L98.33,159c7.82-16.33,7.52-33.36-1-47.49C84.09,89.73,53.62,78,15.79,80.27a8,8,0,0,0-7.52,7.52c-2.23,37.83,9.46,68.3,31.25,81.5A45.82,45.82,0,0,0,63.44,176,54.58,54.58,0,0,0,87,170.33l25,25V224a8,8,0,0,0,16,0V194.51a55.61,55.61,0,0,1,12.27-35,73.91,73.91,0,0,0,33.31,8.4,60.9,60.9,0,0,0,31.83-8.86C234.89,141.21,250.67,99.65,247.63,47.89ZM86.06,146.74l-24.41-24.4a8,8,0,0,0-11.31,11.31l24.41,24.41c-9.61,3.18-18.93,2.39-26.94-2.46C32.47,146.31,23.79,124.32,24,96c28.31-.25,50.31,8.47,59.6,23.81C88.45,127.82,89.24,137.14,86.06,146.74Zm111.06-1.36c-13.4,8.11-29.15,8.73-45.15,2l53.69-53.7a8,8,0,0,0-11.31-11.32L140.65,136c-6.76-16-6.15-31.76,2-45.15,13.94-23,47-35.8,89.33-34.83C232.94,98.34,220.14,131.44,197.12,145.38Z\"/>","shopping-bag":"<path d=\"M224,56V200a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V56a8,8,0,0,1,8-8H216A8,8,0,0,1,224,56Z\" opacity=\"0.2\"/><path d=\"M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,160H40V56H216V200ZM176,88a48,48,0,0,1-96,0,8,8,0,0,1,16,0,32,32,0,0,0,64,0,8,8,0,0,1,16,0Z\"/>","shopping-cart":"<path d=\"M224,64l-12.16,66.86A16,16,0,0,1,196.1,144H70.55L56,64Z\" opacity=\"0.2\"/><path d=\"M230.14,58.87A8,8,0,0,0,224,56H62.68L56.6,22.57A8,8,0,0,0,48.73,16H24a8,8,0,0,0,0,16h18L67.56,172.29a24,24,0,0,0,5.33,11.27,28,28,0,1,0,44.4,8.44h45.42A27.75,27.75,0,0,0,160,204a28,28,0,1,0,28-28H91.17a8,8,0,0,1-7.87-6.57L80.13,152h116a24,24,0,0,0,23.61-19.71l12.16-66.86A8,8,0,0,0,230.14,58.87ZM104,204a12,12,0,1,1-12-12A12,12,0,0,1,104,204Zm96,0a12,12,0,1,1-12-12A12,12,0,0,1,200,204Zm4-74.57A8,8,0,0,1,196.1,136H77.22L65.59,72H214.41Z\"/>","house":"<path d=\"M216,120v96H152V152H104v64H40V120a8,8,0,0,1,2.34-5.66l80-80a8,8,0,0,1,11.32,0l80,80A8,8,0,0,1,216,120Z\" opacity=\"0.2\"/><path d=\"M219.31,108.68l-80-80a16,16,0,0,0-22.62,0l-80,80A15.87,15.87,0,0,0,32,120v96a8,8,0,0,0,8,8h64a8,8,0,0,0,8-8V160h32v56a8,8,0,0,0,8,8h64a8,8,0,0,0,8-8V120A15.87,15.87,0,0,0,219.31,108.68ZM208,208H160V152a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8v56H48V120l80-80,80,80Z\"/>","globe":"<path d=\"M224,128a96,96,0,1,1-96-96A96,96,0,0,1,224,128Z\" opacity=\"0.2\"/><path d=\"M128,24h0A104,104,0,1,0,232,128,104.12,104.12,0,0,0,128,24Zm88,104a87.61,87.61,0,0,1-3.33,24H174.16a157.44,157.44,0,0,0,0-48h38.51A87.61,87.61,0,0,1,216,128ZM102,168H154a115.11,115.11,0,0,1-26,45A115.27,115.27,0,0,1,102,168Zm-3.9-16a140.84,140.84,0,0,1,0-48h59.88a140.84,140.84,0,0,1,0,48ZM40,128a87.61,87.61,0,0,1,3.33-24H81.84a157.44,157.44,0,0,0,0,48H43.33A87.61,87.61,0,0,1,40,128ZM154,88H102a115.11,115.11,0,0,1,26-45A115.27,115.27,0,0,1,154,88Zm52.33,0H170.71a135.28,135.28,0,0,0-22.3-45.6A88.29,88.29,0,0,1,206.37,88ZM107.59,42.4A135.28,135.28,0,0,0,85.29,88H49.63A88.29,88.29,0,0,1,107.59,42.4ZM49.63,168H85.29a135.28,135.28,0,0,0,22.3,45.6A88.29,88.29,0,0,1,49.63,168Zm98.78,45.6a135.28,135.28,0,0,0,22.3-45.6h35.66A88.29,88.29,0,0,1,148.41,213.6Z\"/>","star":"<path d=\"M229.06,108.79l-48.7,42,14.88,62.79a8.4,8.4,0,0,1-12.52,9.17L128,189.09,73.28,222.74a8.4,8.4,0,0,1-12.52-9.17l14.88-62.79-48.7-42A8.46,8.46,0,0,1,31.73,94L95.64,88.8l24.62-59.6a8.36,8.36,0,0,1,15.48,0l24.62,59.6L224.27,94A8.46,8.46,0,0,1,229.06,108.79Z\" opacity=\"0.2\"/><path d=\"M239.18,97.26A16.38,16.38,0,0,0,224.92,86l-59-4.76L143.14,26.15a16.36,16.36,0,0,0-30.27,0L90.11,81.23,31.08,86a16.46,16.46,0,0,0-9.37,28.86l45,38.83L53,211.75a16.38,16.38,0,0,0,24.5,17.82L128,198.49l50.53,31.08A16.4,16.4,0,0,0,203,211.75l-13.76-58.07,45-38.83A16.43,16.43,0,0,0,239.18,97.26Zm-15.34,5.47-48.7,42a8,8,0,0,0-2.56,7.91l14.88,62.8a.37.37,0,0,1-.17.48c-.18.14-.23.11-.38,0l-54.72-33.65a8,8,0,0,0-8.38,0L69.09,215.94c-.15.09-.19.12-.38,0a.37.37,0,0,1-.17-.48l14.88-62.8a8,8,0,0,0-2.56-7.91l-48.7-42c-.12-.1-.23-.19-.13-.5s.18-.27.33-.29l63.92-5.16A8,8,0,0,0,103,91.86l24.62-59.61c.08-.17.11-.25.35-.25s.27.08.35.25L153,91.86a8,8,0,0,0,6.75,4.92l63.92,5.16c.15,0,.24,0,.33.29S224,102.63,223.84,102.73Z\"/>","wallet":"<path d=\"M224,80V192a8,8,0,0,1-8,8H56a16,16,0,0,1-16-16V56A16,16,0,0,0,56,72H216A8,8,0,0,1,224,80Z\" opacity=\"0.2\"/><path d=\"M216,64H56a8,8,0,0,1,0-16H192a8,8,0,0,0,0-16H56A24,24,0,0,0,32,56V184a24,24,0,0,0,24,24H216a16,16,0,0,0,16-16V80A16,16,0,0,0,216,64Zm0,128H56a8,8,0,0,1-8-8V78.63A23.84,23.84,0,0,0,56,80H216Zm-48-60a12,12,0,1,1,12,12A12,12,0,0,1,168,132Z\"/>","calendar-check":"<path d=\"M216,48V88H40V48a8,8,0,0,1,8-8H208A8,8,0,0,1,216,48Z\" opacity=\"0.2\"/><path d=\"M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Zm-38.34-85.66a8,8,0,0,1,0,11.32l-48,48a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L116,164.69l42.34-42.35A8,8,0,0,1,169.66,122.34Z\"/>"}};
  var N = L.naira, DAY = L.DAY, KEY = 'budge-proto-v1', PWA = !!window.BUDGE_PWA, CFG = window.BUDGE_CONFIG || {};
  // Usage stats (GoatCounter: no cookies, no amounts, nothing personal). Only in the published app.
  // Real reminders: the phone signs up with the Budge reminders server, which sends the nudge at your time.
  var Push = {
    on: function () { return !!(PWA && CFG.push && 'PushManager' in window && 'serviceWorker' in navigator); },
    id: function () {
      try { var v = localStorage.getItem('budge-device'); if (!v) { v = L.uid() + L.uid(); localStorage.setItem('budge-device', v); } return v; } catch (e) { return null; }
    },
    joined: function () { try { return localStorage.getItem('budge-push') === '1'; } catch (e) { return false; } },
    info: function (st) {
      var days = Object.keys(st.entries.reduce(function (a, e) { a[L.entryDay(e)] = 1; return a; }, {})).concat(st.checkins || []).sort();
      var tz = 'Africa/Lagos'; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || tz; } catch (e) { }
      return { time: st.reminder.time, on: !!st.reminder.on, tz: tz, lastLogged: days[days.length - 1] || null, streak: L.streak(st, Date.now()) };
    },
    post: function (path, body) {
      return fetch(CFG.push.replace(/\/$/, '') + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || r.status); return j; }); });
    },
    join: function (st) {
      if (!Push.on()) return Promise.reject(new Error('unsupported'));
      return Promise.all([navigator.serviceWorker.ready, fetch(CFG.push.replace(/\/$/, '') + '/key').then(function (r) { return r.json(); })]).then(function (r) {
        var reg = r[0], key = r[1].publicKey;
        return reg.pushManager.getSubscription().then(function (s) { return s || reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key }); });
      }).then(function (sub) {
        return Push.post('/subscribe', Object.assign({ id: Push.id(), subscription: sub.toJSON() }, Push.info(st)));
      }).then(function () { try { localStorage.setItem('budge-push', '1'); } catch (e) { } });
    },
    sync: function (st) { if (Push.on() && Push.joined()) Push.post('/update', Object.assign({ id: Push.id() }, Push.info(st))).catch(function () { }); },
    test: function () { return Push.post('/test', { id: Push.id() }); }
  };
  function stat(name, ev) {
    if (!PWA) return;
    try { var gc = window.goatcounter; if (gc && gc.count) gc.count({ path: ev ? name : '/' + name, title: ev ? name : 'Budge · ' + name, event: !!ev }); } catch (e) { }
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function cx() { return Array.prototype.filter.call(arguments, Boolean).join(' '); }
  function digits(s) { return String(s || '').replace(/\D/g, ''); }

  // ================= persistence: account store (db) with a device copy =================
  var Persist = {
    mode: 'local', ref: null, busy: false, queued: null, timer: null, onMode: null,
    loadLocal: function () { try { var t = localStorage.getItem(KEY); return t ? L.migrate(JSON.parse(t)) : null; } catch (e) { return null; } },
    saveLocal: function (s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { } },
    schedule: function (s) {
      var self = this; this.saveLocal(s); this.queued = s;
      clearTimeout(this.timer); this.timer = setTimeout(function () { self.flush(); }, 450);
    },
    flush: function () {
      var self = this;
      if (this.mode !== 'db' || !this.ref || this.busy || !this.queued) return;
      var s = this.queued; this.queued = null; this.busy = true;
      this.ref.set({ state: s, updatedAt: s.updatedAt || Date.now() }).catch(function (e) {
        var code = e && e.code;
        if (code === 'unavailable' || code === 'resource_exhausted') {
          if (!self.queued) self.queued = s;
          setTimeout(function () { self.flush(); }, 1500 + Math.random() * 1500);
        } else { self.mode = 'local'; if (self.onMode) self.onMode('local'); }
      }).then(function () { self.busy = false; if (self.queued) self.flush(); });
    },
    init: function (apply) {
      var self = this;
      if (!window.claude || typeof window.claude.use !== 'function') return Promise.resolve();
      return Promise.all([window.claude.use('db'), window.claude.use('user')]).then(function (r) {
        var db = r[0], user = r[1];
        if (!db || !user) return;
        return user.id().then(function (id) {
          if (!id) return;
          var ref = db.collection('data/users/' + id).doc('state');
          return ref.get().then(function (snap) {
            self.ref = ref; self.mode = 'db'; if (self.onMode) self.onMode('db');
            var d = snap.exists ? snap.data() : null;
            apply(d && d.state ? L.migrate(clone(d.state)) : null);
          });
        });
      }).catch(function () { });
    }
  };

  // ================= sound + haptics: soft, warm, marimba-like tones made in code =================
  var SFX = {
    ctx: null, enabled: true, last: {},
    unlock: function () {
      if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
      try { var AC = window.AudioContext || window.webkitAudioContext; if (AC) this.ctx = new AC(); } catch (e) { this.ctx = null; }
    },
    // One mallet hit: a sine body plus a faint 4th-harmonic "wood" overtone, quick attack, natural decay.
    note: function (freq, at, dur, vol) {
      var c = this.ctx, t = c.currentTime + (at || 0), d = dur || 0.45, v = vol || 0.08;
      var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400; lp.connect(c.destination);
      [[1, 1, d], [4, 0.12, d * 0.35]].forEach(function (h) {
        var o = c.createOscillator(), g = c.createGain();
        o.type = 'sine'; o.frequency.value = freq * h[0];
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v * h[1], t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + h[2]);
        o.connect(g); g.connect(lp); o.start(t); o.stop(t + h[2] + 0.02);
      });
    },
    // A soft "plop": a sine that drops in pitch, like a coin settling into water.
    drop: function (at, from, to, vol) {
      var c = this.ctx, t = c.currentTime + (at || 0), o = c.createOscillator(), g = c.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(from, t); o.frequency.exponentialRampToValueAtTime(to, t + 0.16);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.07, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 0.25);
    },
    // Android: the Vibration API. iPhone (iOS 18+ Safari): no vibration API, but toggling a native
    // <input type="checkbox" switch> through its label plays the system haptic tick, so we flip a hidden one.
    iosSwitch: null,
    tick: function () {
      try {
        if (!this.iosSwitch) {
          var lb = document.createElement('label'), cb = document.createElement('input');
          cb.type = 'checkbox'; cb.setAttribute('switch', ''); cb.tabIndex = -1; cb.setAttribute('aria-hidden', 'true');
          lb.setAttribute('aria-hidden', 'true'); lb.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0;pointer-events:none;';
          lb.appendChild(cb); document.body.appendChild(lb); this.iosSwitch = lb;
        }
        this.iosSwitch.click();
      } catch (e) { }
    },
    buzz: function (pattern) {
      try {
        if (navigator.vibrate) { navigator.vibrate(pattern); return; }
        var self = this, steps = Array.isArray(pattern) ? pattern.filter(function (x, i) { return i % 2 === 0; }).length : 1;
        self.tick();
        for (var i = 1; i < Math.min(steps, 3); i++) setTimeout(function () { self.tick(); }, i * 90);
      } catch (e) { }
    },
    play: function (name) {
      if (!this.enabled) return;
      var now = Date.now(); if (this.last[name] && now - this.last[name] < 45) return; this.last[name] = now;
      this.unlock(); var c = this.ctx;
      var hap = { key: 6, tap: 5, pour: [10, 40, 14], warn: [18, 60, 18], over: [30, 70, 30], chime: [12, 50, 12, 50, 20], check: 14 }[name];
      if (hap) this.buzz(hap);
      if (!c) return;
      var self = this, C5 = 523.25, D5 = 587.33, E5 = 659.25, G5 = 783.99, A5 = 880, C6 = 1046.5, E4 = 329.63, C4 = 261.63, A4 = 440, F4 = 349.23;
      if (name === 'key') this.note(G5 + Math.random() * 30, 0, 0.12, 0.035);
      else if (name === 'tap') this.note(A5, 0, 0.08, 0.025);
      else if (name === 'pour') { this.note(G5, 0, 0.3, 0.06); this.note(E5, 0.07, 0.3, 0.055); this.note(C5, 0.14, 0.5, 0.06); this.drop(0.2, 520, 190, 0.05); }
      else if (name === 'warn') { this.note(A4, 0, 0.4, 0.07); this.note(F4, 0.16, 0.55, 0.07); }
      else if (name === 'over') { this.note(E4, 0, 0.45, 0.08); this.note(C4, 0.2, 0.7, 0.08); }
      else if (name === 'chime') [C5, E5, G5, C6].forEach(function (f, i) { self.note(f, i * 0.08, 0.7, 0.055); });
      else if (name === 'check') { this.note(D5, 0, 0.3, 0.05); this.note(A5, 0.09, 0.5, 0.05); }
    }
  };
  document.addEventListener('pointerdown', function () { if (SFX.enabled) SFX.unlock(); }, { passive: true });

  // ================= small pieces =================
  function Icon(p) {
    var s = p.size || 24;
    return html`<svg class=${p.cls || ''} width=${s} height=${s} viewBox="0 0 256 256" fill=${p.color || 'currentColor'} aria-hidden="true" focusable="false" dangerouslySetInnerHTML=${{ __html: ICONS.ui[p.n] || '' }}></svg>`;
  }
  // Pot icons are always grey on a white circle: colour is kept for status (amber, red) and the brand green.
  function CatIcon(p) {
    var c = L.cat(p.id), s = p.size || 44;
    return html`<span class="cat cat-neutral" style=${{ width: s + 'px', height: s + 'px' }}>
      <svg width=${Math.round(s * 0.5)} height=${Math.round(s * 0.5)} viewBox="0 0 256 256" fill="var(--ink-2)" aria-hidden="true" dangerouslySetInnerHTML=${{ __html: ICONS.cat[c.icon] || ICONS.pick[c.icon] || ICONS.cat.Other }}></svg></span>`;
  }
  function InIcon(p) {
    var s = p.size || 44;
    return html`<span class="cat cat-neutral" style=${{ width: s + 'px', height: s + 'px', color: 'var(--ink-2)' }}><${Icon} n="in" size=${Math.round(s * 0.45)} /></span>`;
  }
  function Logo(p) {
    var s = p.size || 48;
    return html`<svg width=${s} height=${s} viewBox="0 0 48 48" aria-label="Budge" role="img">
      <defs><linearGradient id="logo-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#12B76A" /><stop offset="1" stop-color="#0B8A4F" /></linearGradient>
        <clipPath id="logo-c"><rect width="48" height="48" rx="11" /></clipPath></defs>
      <g clip-path="url(#logo-c)"><rect width="48" height="48" fill="#E3F7EC" />
        <path d="M0 24.4 C 8.6 21.1 17.3 27.7 26.4 24.4 S 40.8 21.1 48 24.4 V 48 H 0 Z" fill="url(#logo-g)" /></g>
    </svg>`;
  }
  function Seg(p) {
    return html`<div class=${cx('seg', p.full && 'full')} role="tablist">
      ${p.options.map(function (o) {
        return html`<button role="tab" aria-selected=${p.value === o.v} class=${p.value === o.v ? 'on' : ''} onClick=${function () { p.onChange(o.v); }}>${o.label}</button>`;
      })}</div>`;
  }
  function Bar(p) {
    return html`<div class="bar"><i style=${{ width: Math.max(0, Math.min(1, p.ratio)) * 100 + '%', background: p.color }}></i></div>`;
  }
  function Toggle(p) {
    return html`<button class=${cx('toggle', p.on && 'on')} role="switch" aria-checked=${!!p.on} aria-label=${p.label} onClick=${function () { SFX.play('tap'); p.onChange(!p.on); }}></button>`;
  }
  function Keypad(p) {
    var keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'del'];
    return html`<div class="keypad">${keys.map(function (k) {
      return html`<button class=${cx('key', k === 'del' && 'key-del')} aria-label=${k === 'del' ? 'Delete' : k} onClick=${function () { SFX.play('key'); p.onKey(k); }}>
        ${k === 'del' ? html`<${Icon} n="del" size=${30} />` : k}</button>`;
    })}</div>`;
  }
  function applyKey(str, k) {
    if (k === 'del') return str.slice(0, -1);
    var s = (str + k).replace(/^0+/, '');
    return s.length > 9 ? str : s;
  }
  function useKeys(onKey, onEnter, active) {
    useEffect(function () {
      if (!active) return;
      function h(e) {
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
        if (/^[0-9]$/.test(e.key)) { onKey(e.key); e.preventDefault(); }
        else if (e.key === 'Backspace') { onKey('del'); e.preventDefault(); }
        else if (e.key === 'Enter' && onEnter) { onEnter(); e.preventDefault(); }
      }
      window.addEventListener('keydown', h);
      return function () { window.removeEventListener('keydown', h); };
    });
  }
  function BigAmount(p) {
    var v = +p.value || 0, txt = (p.prefix || '') + N(v), len = txt.length;
    return html`<div class=${cx('amount d-xl num', len > 10 && 'shrink', len > 12 && 'shrink2', !v && 'faint')}>${txt}</div>`;
  }
  function Back(p) {
    return html`<button class="icon-btn" aria-label=${p.label || 'Back'} onClick=${p.onClick}><${Icon} n=${p.icon || 'back'} size=${22} /></button>`;
  }
  function Empty(p) {
    return html`<div class="empty">
      ${p.icon && html`<span class="b-ic" style=${{ width: '48px', height: '48px', marginBottom: '6px' }}><${Icon} n=${p.icon} size=${24} color="var(--muted)" /></span>`}
      <div class="t-label">${p.title}</div>
      ${p.text && html`<div class="t-s muted">${p.text}</div>`}
      ${p.children}
    </div>`;
  }
  function EntryRow(p) {
    var e = p.e, isIn = e.type === 'in';
    var name = e.note || (isIn ? 'Money in' : L.cat(e.cat).name);
    var meta = isIn ? (e.source || 'Money in') + ' · ' + L.timeLabel(e.ts)
      : (p.budgetName ? p.budgetName + ' · ' : p.showCat && e.note ? L.cat(e.cat).name + ' · ' : '') + L.timeLabel(e.ts);
    return html`<button class="row" onClick=${p.onClick}>
      ${isIn ? html`<${InIcon} size=${40} />` : html`<${CatIcon} id=${e.cat} size=${40} />`}
      <div class="grow"><div class="name">${name}</div><div class="meta">${meta}</div></div>
      <div class=${cx('amt num', isIn && 'pos')}>${isIn ? '+' : ''}${N(e.amount)}</div>
    </button>`;
  }
  function groupByDay(list) {
    var out = [], map = {};
    list.forEach(function (e) {
      var k = L.entryDay(e);
      if (!map[k]) { map[k] = { day: k, items: [] }; out.push(map[k]); }
      map[k].items.push(e);
    });
    return out;
  }
  function unitWord(u) { return u === 'month' ? 'month' : u === 'once' ? 'budget' : 'week'; }
  function perUnit(u) { return u === 'month' ? 'a month' : u === 'once' ? 'in total' : 'a week'; }
  function budgetLabel(b) { return b.kind === 'once' ? 'Total budget' : b.rhythm === 'month' ? 'Monthly budget' : 'Weekly budget'; }
  function kindLabel(b) { return b.kind === 'once' ? 'One-off' : b.rhythm === 'month' ? 'Monthly' : 'Weekly'; }
  function dayCount(a, b) { return L.diffDays(a, b) + 1; }
  function lastReview(b) {
    for (var i = b.history.length - 1; i >= 0; i--) if (b.history[i].active) return b.history[i];
    return null;
  }
  function reviewUnseen(b) { var l = lastReview(b); return !!(l && b.reviewSeen !== l.start); }

  // ================= gauges =================
  // One description of a budget's state, shared by the big gauge and the dashboard cards.
  // ================= dashboard =================
  // First-run demo: a purchase drops into the Treats pot and the week's number ticks down, on a loop.
  // First run: the tank pours out a purchase and the number counts down, on a loop.
  function DemoTank(p) {
    var BUD = 50000, FROM = 32000, TO = 29500;
    var ph = useState(0), phase = ph[0], setPhase = ph[1];
    var vv = useState(FROM), val = vv[0], setVal = vv[1];
    var still = false;
    try { still = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { }
    useEffect(function () {
      if (still) { setVal(TO); setPhase(1); return; }
      var t1, t2, raf, live = true;
      function cycle() {
        setPhase(0); setVal(FROM);
        t1 = setTimeout(function () {
          if (!live) return;
          setPhase(1);
          var s0 = performance.now();
          (function step(t) { var k = Math.min(1, (t - s0) / 900); setVal(Math.round(FROM - (FROM - TO) * (1 - Math.pow(1 - k, 3)))); if (k < 1 && live) raf = requestAnimationFrame(step); })(s0);
          t2 = setTimeout(function () { if (live) cycle(); }, 3200);
        }, 1500);
      }
      cycle();
      return function () { live = false; clearTimeout(t1); clearTimeout(t2); cancelAnimationFrame(raf); };
    }, []);
    var chip = html`<div class=${cx('demo-chip', phase >= 1 && 'in')} aria-hidden="true"><${CatIcon} id="treats" size=${28} /><span>Shawarma</span><b class="num">−₦2,500</b></div>`;
    return html`<${TankView} height=${p.height || 320} ratio=${val / BUD} label="Left this week" big=${N(val)} footL="5 days left · ₦50,000 budget" footR=${Math.round(val / BUD * 100) + '% left'} chip=${chip} />`;
  }
  function Onboarding(p) {
    var A = p.A, desk = useDesk();
    // The tank fills whatever height is left on the screen (fixed size on desktop).
    var heroRef = useRef(null), hs = useState(320), heroH = desk ? 440 : hs[0];
    useEffect(function () {
      var el = heroRef.current; if (!el || desk) return;
      function measure() { var h = Math.round(el.clientHeight); if (h > 0) hs[1](Math.max(240, h)); }
      measure();
      var ro = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
      if (ro) ro.observe(el); else window.addEventListener('resize', measure);
      return function () { if (ro) ro.disconnect(); else window.removeEventListener('resize', measure); };
    }, [desk]);
    return html`<div class="onboard pad">
      <div class="onboard-brand"><${Logo} size=${32} /><span>Budge</span></div>
      <div class="onboard-copy">
        <h1 class="onboard-title">See what’s left<br />as you spend</h1>
        <p>Set a weekly budget, split it into allocations and log what you buy in two taps.</p>
      </div>
      <div class="onboard-hero" ref=${heroRef}><${DemoTank} height=${heroH} /></div>
      <div class="onboard-actions">
        <button class="btn btn-primary" onClick=${function () { A.create(); }}>Set up my budget</button>
      </div>
    </div>`;
  }
  function FeedbackLayer(p) {
    var A = p.A, st = p.st, on = typeof navigator.onLine === 'boolean' ? navigator.onLine : true;
    var q = 'hideTitle=1&transparentBackground=1&alignLeft=1&platform=' + encodeURIComponent(isIOS() ? 'ios' : /android/i.test(navigator.userAgent) ? 'android' : 'other')
      + '&installed=' + (isStandalone() ? 'yes' : 'no') + '&rhythm=' + encodeURIComponent((L.mainBudget(st) || {}).rhythm || 'none') + '&version=' + encodeURIComponent(CFG.version || '');
    return html`<div class="layer">
      <div class="lh pad"><${Back} onClick=${A.back} /><div class="lh-title">Send feedback</div></div>
      ${on ? html`<iframe class="feedback-frame" title="Feedback form" src=${'https://tally.so/embed/' + CFG.tally + '?' + q}></iframe>`
        : html`<div class="pad"><${Empty} icon="warn" title="You’re offline" text="Connect to the internet to send feedback." /></div>`}
    </div>`;
  }
  function BudgetBar() { return null; }
  function PotRow(p) {
    var pt = p.pot, c = L.cat(pt.id);
    function M(n) { return Math.abs(n) >= 10000000 ? L.short(n) : N(n); }
    var color = pt.state === 'over' ? 'var(--critical)' : pt.state === 'near' ? 'var(--warning)' : 'var(--ink-2)';
    var right = pt.state === 'none' ? html`<div class="amt num">${M(pt.spent)} spent<small>Nothing allocated</small></div>`
      : pt.state === 'over' ? html`<div class="amt num neg">${M(-pt.left)} over<small>of ${M(pt.budget)}</small></div>`
      : html`<div class="amt num">${M(pt.left)} left<small class=${pt.state === 'near' ? 'warn' : ''}>${pt.state === 'near' ? 'Nearly empty' : 'of ' + M(pt.budget)}</small></div>`;
    return html`<button class="row" onClick=${p.onClick}>
      <${CatIcon} id=${pt.id} size=${40} />
      <div class="grow"><div class="name">${c.name}</div>
        <div style=${{ marginTop: '8px' }}><${Bar} ratio=${pt.state === 'none' ? 0 : pt.ratio} color=${color} /></div></div>
      ${right}
    </button>`;
  }
  // The week's money as a tank: the level drains as you spend, and turns amber, then empties red.
  // The tank itself: a level that drains, a slow wave on top, the number above it and two facts at the bottom.
  function TankView(p) {
    var H = p.height || 300, head = 124, area = H - head, ratio = Math.max(0, Math.min(1, p.ratio));
    var level = ratio > 0 ? Math.round(18 + (area - 18) * ratio) : 0, light = level >= 64;
    return html`<div class=${cx('tank', 'tank-' + (p.tone || 'ok'))} style=${{ height: H + 'px' }} role="img" aria-label=${p.label + ' ' + p.big + '. ' + p.footL + '. ' + p.footR}>
      <div class="tank-liquid" style=${{ height: level + 'px' }}>
        <svg class="tank-wave" viewBox="0 0 800 24" preserveAspectRatio="none" aria-hidden="true"><path d="M0 12 C 100 0, 100 0, 200 12 S 300 24, 400 12 S 500 0, 600 12 S 700 24, 800 12 V24 H0 Z" /></svg>
      </div>
      ${p.chip}
      <div class="tank-top">
        <div class=${cx('t-s', p.tone === 'over' ? 'neg' : 'ink-2')}>${p.label}</div>
        <div class=${cx('d-xl num fit', p.tone === 'over' && 'neg')}>${p.big}</div>
      </div>
      <div class=${cx('tank-foot', light && 'light')}><span>${p.footL}</span><span>${p.footR}</span></div>
    </div>`;
  }
  function TankCard(p) {
    var s = p.s, u = unitWord(s.unit);
    var ratio = s.budget ? Math.max(0, s.left) / s.budget : 0;
    var tone = s.mode === 'over' ? 'over' : s.mode === 'low' ? 'low' : 'ok';
    return html`<${TankView} ratio=${ratio} tone=${tone}
      label=${s.mode === 'over' ? 'Over budget' : 'Left this ' + u}
      big=${s.mode === 'over' ? N(-s.left) : N(Math.max(0, s.left))}
      footL=${s.mode === 'over' ? 'New ' + u + ' starts ' + p.next : (s.daysLeft === 1 ? 'Last day' : s.daysLeft + ' days left') + ' · ' + N(s.budget) + ' budget'}
      footR=${s.mode === 'over' ? 'Empty' : Math.round(ratio * 100) + '% left'} />`;
  }
  // One suggestion under the tank: cover an overspent pot, warn about a nearly empty one, or save money a pot won't need.
  function nudgeFor(st, b, s) {
    if (s.phase !== 'live' || b.nudgeOff === s.today) return null;
    var over = s.pots.filter(function (x) { return x.state === 'over' && x.budget > 0; })[0];
    if (over) return { kind: 'cover', id: over.id, btn: 'Move money', text: L.cat(over.id).name + ' is ' + N(-over.left) + ' over. Move money from another allocation?' };
    var near = s.pots.filter(function (x) { return x.state === 'near' && x.left > 0; })[0];
    if (near && s.daysLeft > 1) return { kind: 'view', id: near.id, btn: 'View', text: L.cat(near.id).name + ' is almost empty: ' + N(near.left) + ' left for ' + s.daysLeft + ' days.' };
    if (b.kind !== 'repeat') return null;
    var days = L.diffDays(s.start, s.end) + 1, gone = 1 - s.daysLeft / days;
    if (gone < 0.4) return null;
    var under = s.pots.filter(function (x) { return x.budget > 0 && x.left >= 1000 && x.spent / x.budget < gone * 0.5; }).sort(function (x, y) { return y.left - x.left; })[0];
    if (!under) return null;
    var amt = Math.max(500, Math.floor(under.left * 0.4 / 500) * 500);
    return { kind: 'save', id: under.id, amt: amt, btn: 'Set aside', text: L.cat(under.id).name + ' has ' + N(under.left) + ' left. Set ' + N(amt) + ' aside so it doesn’t get spent?' };
  }
  // ================= desktop =================
  var QR = {"n": 29, "d": "M0 0h1v1h-1zM1 0h1v1h-1zM2 0h1v1h-1zM3 0h1v1h-1zM4 0h1v1h-1zM5 0h1v1h-1zM6 0h1v1h-1zM10 0h1v1h-1zM12 0h1v1h-1zM13 0h1v1h-1zM14 0h1v1h-1zM15 0h1v1h-1zM16 0h1v1h-1zM18 0h1v1h-1zM22 0h1v1h-1zM23 0h1v1h-1zM24 0h1v1h-1zM25 0h1v1h-1zM26 0h1v1h-1zM27 0h1v1h-1zM28 0h1v1h-1zM0 1h1v1h-1zM6 1h1v1h-1zM8 1h1v1h-1zM10 1h1v1h-1zM12 1h1v1h-1zM14 1h1v1h-1zM15 1h1v1h-1zM16 1h1v1h-1zM17 1h1v1h-1zM19 1h1v1h-1zM22 1h1v1h-1zM28 1h1v1h-1zM0 2h1v1h-1zM2 2h1v1h-1zM3 2h1v1h-1zM4 2h1v1h-1zM6 2h1v1h-1zM12 2h1v1h-1zM13 2h1v1h-1zM14 2h1v1h-1zM15 2h1v1h-1zM16 2h1v1h-1zM18 2h1v1h-1zM19 2h1v1h-1zM20 2h1v1h-1zM22 2h1v1h-1zM24 2h1v1h-1zM25 2h1v1h-1zM26 2h1v1h-1zM28 2h1v1h-1zM0 3h1v1h-1zM2 3h1v1h-1zM3 3h1v1h-1zM4 3h1v1h-1zM6 3h1v1h-1zM8 3h1v1h-1zM9 3h1v1h-1zM12 3h1v1h-1zM13 3h1v1h-1zM14 3h1v1h-1zM15 3h1v1h-1zM17 3h1v1h-1zM18 3h1v1h-1zM20 3h1v1h-1zM22 3h1v1h-1zM24 3h1v1h-1zM25 3h1v1h-1zM26 3h1v1h-1zM28 3h1v1h-1zM0 4h1v1h-1zM2 4h1v1h-1zM3 4h1v1h-1zM4 4h1v1h-1zM6 4h1v1h-1zM8 4h1v1h-1zM9 4h1v1h-1zM10 4h1v1h-1zM11 4h1v1h-1zM15 4h1v1h-1zM17 4h1v1h-1zM19 4h1v1h-1zM22 4h1v1h-1zM24 4h1v1h-1zM25 4h1v1h-1zM26 4h1v1h-1zM28 4h1v1h-1zM0 5h1v1h-1zM6 5h1v1h-1zM9 5h1v1h-1zM11 5h1v1h-1zM12 5h1v1h-1zM16 5h1v1h-1zM17 5h1v1h-1zM22 5h1v1h-1zM28 5h1v1h-1zM0 6h1v1h-1zM1 6h1v1h-1zM2 6h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1zM5 6h1v1h-1zM6 6h1v1h-1zM8 6h1v1h-1zM10 6h1v1h-1zM12 6h1v1h-1zM14 6h1v1h-1zM16 6h1v1h-1zM18 6h1v1h-1zM20 6h1v1h-1zM22 6h1v1h-1zM23 6h1v1h-1zM24 6h1v1h-1zM25 6h1v1h-1zM26 6h1v1h-1zM27 6h1v1h-1zM28 6h1v1h-1zM8 7h1v1h-1zM9 7h1v1h-1zM10 7h1v1h-1zM11 7h1v1h-1zM13 7h1v1h-1zM18 7h1v1h-1zM1 8h1v1h-1zM3 8h1v1h-1zM4 8h1v1h-1zM5 8h1v1h-1zM6 8h1v1h-1zM8 8h1v1h-1zM12 8h1v1h-1zM13 8h1v1h-1zM17 8h1v1h-1zM19 8h1v1h-1zM20 8h1v1h-1zM21 8h1v1h-1zM22 8h1v1h-1zM24 8h1v1h-1zM25 8h1v1h-1zM27 8h1v1h-1zM1 9h1v1h-1zM2 9h1v1h-1zM5 9h1v1h-1zM8 9h1v1h-1zM9 9h1v1h-1zM12 9h1v1h-1zM13 9h1v1h-1zM14 9h1v1h-1zM15 9h1v1h-1zM18 9h1v1h-1zM19 9h1v1h-1zM23 9h1v1h-1zM24 9h1v1h-1zM25 9h1v1h-1zM26 9h1v1h-1zM27 9h1v1h-1zM1 10h1v1h-1zM3 10h1v1h-1zM6 10h1v1h-1zM7 10h1v1h-1zM9 10h1v1h-1zM13 10h1v1h-1zM14 10h1v1h-1zM15 10h1v1h-1zM16 10h1v1h-1zM17 10h1v1h-1zM18 10h1v1h-1zM20 10h1v1h-1zM21 10h1v1h-1zM22 10h1v1h-1zM23 10h1v1h-1zM26 10h1v1h-1zM2 11h1v1h-1zM3 11h1v1h-1zM4 11h1v1h-1zM5 11h1v1h-1zM7 11h1v1h-1zM12 11h1v1h-1zM14 11h1v1h-1zM17 11h1v1h-1zM18 11h1v1h-1zM19 11h1v1h-1zM25 11h1v1h-1zM28 11h1v1h-1zM3 12h1v1h-1zM4 12h1v1h-1zM5 12h1v1h-1zM6 12h1v1h-1zM8 12h1v1h-1zM9 12h1v1h-1zM10 12h1v1h-1zM14 12h1v1h-1zM18 12h1v1h-1zM19 12h1v1h-1zM21 12h1v1h-1zM22 12h1v1h-1zM25 12h1v1h-1zM27 12h1v1h-1zM2 13h1v1h-1zM3 13h1v1h-1zM10 13h1v1h-1zM12 13h1v1h-1zM15 13h1v1h-1zM22 13h1v1h-1zM24 13h1v1h-1zM26 13h1v1h-1zM27 13h1v1h-1zM28 13h1v1h-1zM0 14h1v1h-1zM2 14h1v1h-1zM4 14h1v1h-1zM5 14h1v1h-1zM6 14h1v1h-1zM7 14h1v1h-1zM10 14h1v1h-1zM12 14h1v1h-1zM15 14h1v1h-1zM16 14h1v1h-1zM17 14h1v1h-1zM19 14h1v1h-1zM21 14h1v1h-1zM23 14h1v1h-1zM25 14h1v1h-1zM28 14h1v1h-1zM0 15h1v1h-1zM4 15h1v1h-1zM7 15h1v1h-1zM9 15h1v1h-1zM15 15h1v1h-1zM21 15h1v1h-1zM22 15h1v1h-1zM24 15h1v1h-1zM25 15h1v1h-1zM26 15h1v1h-1zM27 15h1v1h-1zM28 15h1v1h-1zM2 16h1v1h-1zM5 16h1v1h-1zM6 16h1v1h-1zM9 16h1v1h-1zM13 16h1v1h-1zM14 16h1v1h-1zM20 16h1v1h-1zM23 16h1v1h-1zM25 16h1v1h-1zM27 16h1v1h-1zM28 16h1v1h-1zM0 17h1v1h-1zM4 17h1v1h-1zM5 17h1v1h-1zM9 17h1v1h-1zM10 17h1v1h-1zM13 17h1v1h-1zM14 17h1v1h-1zM16 17h1v1h-1zM17 17h1v1h-1zM18 17h1v1h-1zM19 17h1v1h-1zM20 17h1v1h-1zM23 17h1v1h-1zM24 17h1v1h-1zM26 17h1v1h-1zM0 18h1v1h-1zM1 18h1v1h-1zM3 18h1v1h-1zM5 18h1v1h-1zM6 18h1v1h-1zM7 18h1v1h-1zM8 18h1v1h-1zM9 18h1v1h-1zM10 18h1v1h-1zM14 18h1v1h-1zM15 18h1v1h-1zM16 18h1v1h-1zM17 18h1v1h-1zM18 18h1v1h-1zM19 18h1v1h-1zM23 18h1v1h-1zM25 18h1v1h-1zM26 18h1v1h-1zM28 18h1v1h-1zM0 19h1v1h-1zM1 19h1v1h-1zM3 19h1v1h-1zM8 19h1v1h-1zM9 19h1v1h-1zM10 19h1v1h-1zM11 19h1v1h-1zM12 19h1v1h-1zM21 19h1v1h-1zM22 19h1v1h-1zM24 19h1v1h-1zM26 19h1v1h-1zM27 19h1v1h-1zM28 19h1v1h-1zM0 20h1v1h-1zM1 20h1v1h-1zM2 20h1v1h-1zM5 20h1v1h-1zM6 20h1v1h-1zM7 20h1v1h-1zM8 20h1v1h-1zM9 20h1v1h-1zM10 20h1v1h-1zM11 20h1v1h-1zM14 20h1v1h-1zM15 20h1v1h-1zM16 20h1v1h-1zM17 20h1v1h-1zM18 20h1v1h-1zM20 20h1v1h-1zM21 20h1v1h-1zM22 20h1v1h-1zM23 20h1v1h-1zM24 20h1v1h-1zM26 20h1v1h-1zM8 21h1v1h-1zM10 21h1v1h-1zM12 21h1v1h-1zM13 21h1v1h-1zM15 21h1v1h-1zM20 21h1v1h-1zM24 21h1v1h-1zM25 21h1v1h-1zM26 21h1v1h-1zM0 22h1v1h-1zM1 22h1v1h-1zM2 22h1v1h-1zM3 22h1v1h-1zM4 22h1v1h-1zM5 22h1v1h-1zM6 22h1v1h-1zM9 22h1v1h-1zM11 22h1v1h-1zM13 22h1v1h-1zM14 22h1v1h-1zM15 22h1v1h-1zM17 22h1v1h-1zM19 22h1v1h-1zM20 22h1v1h-1zM22 22h1v1h-1zM24 22h1v1h-1zM26 22h1v1h-1zM0 23h1v1h-1zM6 23h1v1h-1zM8 23h1v1h-1zM14 23h1v1h-1zM15 23h1v1h-1zM17 23h1v1h-1zM19 23h1v1h-1zM20 23h1v1h-1zM24 23h1v1h-1zM25 23h1v1h-1zM27 23h1v1h-1zM0 24h1v1h-1zM2 24h1v1h-1zM3 24h1v1h-1zM4 24h1v1h-1zM6 24h1v1h-1zM8 24h1v1h-1zM14 24h1v1h-1zM16 24h1v1h-1zM18 24h1v1h-1zM19 24h1v1h-1zM20 24h1v1h-1zM21 24h1v1h-1zM22 24h1v1h-1zM23 24h1v1h-1zM24 24h1v1h-1zM28 24h1v1h-1zM0 25h1v1h-1zM2 25h1v1h-1zM3 25h1v1h-1zM4 25h1v1h-1zM6 25h1v1h-1zM8 25h1v1h-1zM9 25h1v1h-1zM10 25h1v1h-1zM11 25h1v1h-1zM12 25h1v1h-1zM13 25h1v1h-1zM17 25h1v1h-1zM18 25h1v1h-1zM23 25h1v1h-1zM26 25h1v1h-1zM27 25h1v1h-1zM0 26h1v1h-1zM2 26h1v1h-1zM3 26h1v1h-1zM4 26h1v1h-1zM6 26h1v1h-1zM9 26h1v1h-1zM13 26h1v1h-1zM14 26h1v1h-1zM15 26h1v1h-1zM18 26h1v1h-1zM20 26h1v1h-1zM21 26h1v1h-1zM23 26h1v1h-1zM24 26h1v1h-1zM27 26h1v1h-1zM28 26h1v1h-1zM0 27h1v1h-1zM6 27h1v1h-1zM8 27h1v1h-1zM10 27h1v1h-1zM13 27h1v1h-1zM14 27h1v1h-1zM15 27h1v1h-1zM21 27h1v1h-1zM24 27h1v1h-1zM25 27h1v1h-1zM26 27h1v1h-1zM28 27h1v1h-1zM0 28h1v1h-1zM1 28h1v1h-1zM2 28h1v1h-1zM3 28h1v1h-1zM4 28h1v1h-1zM5 28h1v1h-1zM6 28h1v1h-1zM9 28h1v1h-1zM12 28h1v1h-1zM14 28h1v1h-1zM18 28h1v1h-1zM20 28h1v1h-1zM22 28h1v1h-1zM23 28h1v1h-1zM24 28h1v1h-1z"}, LIVE_URL = 'https://dvn019.github.io/budge/';
  function useDesk() {
    var mq = typeof window.matchMedia === 'function' ? window.matchMedia('(min-width: 1024px)') : null;
    var s = useState(mq ? mq.matches : false);
    useEffect(function () {
      if (!mq) return;
      function h() { s[1](mq.matches); }
      if (mq.addEventListener) mq.addEventListener('change', h); else mq.addListener(h);
      return function () { if (mq.removeEventListener) mq.removeEventListener('change', h); else mq.removeListener(h); };
    }, []);
    return s[0];
  }
  function SideNav(p) {
    var t = p.tab, A = p.A, st = p.st, now = p.now, n = L.streak(st, now);
    var items = [['home', 'house', 'Home'], ['history', 'list', 'History'], ['insights', 'bulb', 'Insights'], ['settings', 'gear', 'Settings']];
    return html`<aside class="side" aria-label="Budge">
      <div class="side-brand"><${Logo} size=${32} /><span>Budge</span></div>
      ${p.live && html`<button class="btn btn-primary side-add" onClick=${function () { A.add(); }}><${Icon} n="plus" size=${20} />Log a purchase<kbd>N</kbd></button>`}
      <nav class="side-nav">${items.map(function (x) {
        var on = t === x[0];
        return html`<button class=${cx('side-item', on && 'on')} aria-current=${on ? 'page' : null} onClick=${function () { A.tab(x[0]); }}>
          <${Icon} n=${x[1] + (on && ICONS.ui[x[1] + '-f'] ? '-f' : '')} size=${22} /><span>${x[2]}</span>${x[0] === 'insights' && p.unseen && !on ? html`<span class="dot"></span>` : null}</button>`;
      })}</nav>
      <div class="side-foot">
        <div class="t-cap muted">Your data stays on this device.</div>
      </div>
    </aside>`;
  }
  function QrCard() {
    var k = 'budge-qr-off', s = useState(function () { try { return localStorage.getItem(k) === '1'; } catch (e) { return false; } }), off = s[0];
    if (off) return null;
    return html`<div class="qr-card" role="complementary" aria-label="Open on your phone">
      <svg class="qr" viewBox=${'-2 -2 ' + (QR.n + 4) + ' ' + (QR.n + 4)} shape-rendering="crispEdges" aria-label=${'QR code for ' + LIVE_URL} role="img"><rect x="-2" y="-2" width=${QR.n + 4} height=${QR.n + 4} fill="#fff" /><path d=${QR.d} fill="#0B0F0D" /></svg>
      <div class="qr-text"><div class="t-label">Best on your phone</div>
        <div class="t-s muted">Scan to open Budge, then add it to your home screen.</div></div>
      <button class="icon-btn qr-x" aria-label="Hide" onClick=${function () { try { localStorage.setItem(k, '1'); } catch (e) { } s[1](true); }}><${Icon} n="x" size=${16} color="var(--muted)" /></button>
    </div>`;
  }
  function BudgetHome(p) {
    var st = p.st, b = p.b, A = p.A, s = L.status(st, b, p.now), u = unitWord(s.unit);
    var last = b.history[b.history.length - 1];
    var showReview = last && last.active && b.bannerSeen !== last.start;
    var next = s.nextStart ? (b.rhythm === 'month' ? L.shortDate(s.nextStart).replace(/^\w+ /, '') : L.weekdayName(s.nextStart)) : '';
    var once = b.kind === 'once', lw = once ? 'This budget' : 'Last ' + u;
    var title = !showReview ? '' : last.over > 0 ? lw + (once ? ' went ' : ' you went ') + N(last.over) + ' over'
      : last.saved > 0 ? (once ? 'This budget left ' : lw + ' you had ') + N(last.saved) + (once ? '' : ' left over') : lw + ' you spent it all';
    var nudge = nudgeFor(st, b, s);
    function act() {
      if (nudge.kind === 'cover') A.cover(b.id, nudge.id);
      else if (nudge.kind === 'view') A.open({ type: 'cat', id: nudge.id, unit: s.unit, offset: 0 });
      else { A.commit(function (x) { var bb = L.findBudget(x, b.id); L.saveFromPot(x, bb, s.start, nudge.id, nudge.amt); }); A.sfx('chime'); A.say(N(nudge.amt) + ' set aside'); }
    }
    return html`<div class="pad tabpad">
      <div class="home-top">
        <div><div class="h2">This ${u}</div><div class="t-s muted">${L.rangeLabel(s.start, s.end, b.rhythm)}</div></div>
        <div class="top-right">
          ${st.offset ? html`<span class="pill pill-date"><${Icon} n="calendar" size=${15} />${L.shortDate(s.today)}</span>` : null}
          ${L.streak(st, p.now) > 0 && html`<span class="pill pill-streak"><${Icon} n="fire" size=${15} color="var(--warning)" />${L.streak(st, p.now)}-day streak</span>`}
        </div>
      </div>
      <div class="home-grid"><div class="home-a">
      ${showReview && html`<div class=${cx('banner', last.over > 0 ? 'bad' : 'good')}>
        <span class="b-ic"><${Icon} n=${last.over > 0 ? 'warn' : 'piggy'} size=${20} color=${last.over > 0 ? 'var(--critical)' : 'var(--emerald-deep)'} /></span>
        <div class="b-text">
          <div class="t-label">${title}</div>
          <div class="t-s muted">${last.saved > 0 ? 'It’s added to your total left over.' : once ? 'This budget has ended.' : 'This ' + u + ' starts fresh.'}</div>
          <div class="b-actions"><button class="btn btn-dark btn-sm" onClick=${function () { A.tab('insights'); }}>See review</button></div>
        </div>
        <button class="icon-btn" aria-label="Dismiss" style=${{ width: '32px', height: '32px' }} onClick=${function () { A.commitB(b.id, function (x) { x.bannerSeen = last.start; }); }}><${Icon} n="x" size=${16} /></button>
      </div>`}
      ${!showReview && html`<${InstallTip} st=${st} A=${A} />`}
      <${TankCard} s=${s} b=${b} next=${next} />
      ${nudge && html`<div class="nudge">
        <${Icon} n="sparkle" size=${20} color="#4ADE80" />
        <div class="nudge-text">${nudge.text}</div>
        <button class="nudge-btn" onClick=${act}>${nudge.btn}</button>
        <button class="nudge-x" aria-label="Hide for today" onClick=${function () { A.commitB(b.id, function (x) { x.nudgeOff = s.today; }); }}><${Icon} n="x" size=${14} /></button>
      </div>`}
      </div>
      <div class="pots-card">
        <div class="pots-head"><div class="t-title">This ${u}’s allocations</div><button class="pots-edit" onClick=${function () { A.open({ type: 'split' }); }}>Edit</button></div>
        ${s.pots.map(function (pt) { return html`<${PotRow} key=${pt.id} pot=${pt} onClick=${function () { A.open({ type: 'cat', id: pt.id, unit: s.unit, offset: 0 }); }} />`; })}
      </div>
      ${s.phase === 'live' && html`<div class="home-today">
        <div class="sec-head"><div class="t-title">Today</div>
          <button class="link" onClick=${function () { A.tab('history'); }}>History</button>
        </div>
        ${s.todayEntries.length ? html`<div class="list" style=${{ marginTop: '4px' }}>
          ${s.todayEntries.map(function (e) { return html`<${EntryRow} key=${e.id} e=${e} onClick=${function () { A.open({ type: 'edit', id: e.id }); }} />`; })}
        </div>` : html`<div style=${{ marginTop: '10px' }}><${Empty} title=${st.checkins && st.checkins.indexOf(L.dkey(p.now)) >= 0 ? 'No-spend day' : 'Nothing logged today'} text=${st.checkins && st.checkins.indexOf(L.dkey(p.now)) >= 0 ? 'Nice. Tap + if you do buy something.' : 'Tap + when you pay for something.'}>
          ${!(st.checkins && st.checkins.indexOf(L.dkey(p.now)) >= 0) && html`<button class="btn btn-outline btn-sm" style=${{ width: 'auto', marginTop: '12px', paddingInline: '18px' }} onClick=${function () { var k = L.dkey(p.now); A.commit(function (x) { x.checkins = (x.checkins || []).concat([k]); }); A.sfx('check'); A.say('Marked as a no-spend day'); stat('no-spend-day', true); }}>I spent nothing today</button>`}
        </${Empty}></div>`}
      </div>`}
      ${s.phase === 'upcoming' && html`<${Empty} icon="calendar" title=${'Starts ' + L.shortDate(b.start)} text="You can log purchases once it starts." />`}
      </div>
    </div>`;
  }
  function History(p) {
    var st = p.st, b = p.b, A = p.A, view = p.view, once = b.kind === 'once';
    var unit = once ? 'once' : (view.unit || b.rhythm);
    var v = L.rangeView(st, b, unit, view.offset, p.now);
    var ids = Object.keys(v.byCat).filter(function (k) { return v.byCat[k] > 0; }).sort(function (x, y) { return v.byCat[y] - v.byCat[x]; });
    var scale = Math.max(v.budget, v.spent) || 1, u = unitWord(unit), today = L.dkey(p.now);
    var list = v.entries.filter(L.personalOut);
    function go(d) { p.setView({ unit: unit, offset: view.offset + d }); }
    return html`<div class="pad tabpad">
      <${BudgetBar} b=${b} A=${A} />
      <div class="sec-head" style=${{ alignItems: 'center' }}>
        <h1 class="h1">History</h1>
        ${!once && html`<${Seg} value=${unit} onChange=${function (x) { p.setView({ unit: x, offset: 0 }); }} options=${[{ v: 'week', label: 'Week' }, { v: 'month', label: 'Month' }]} />`}
      </div>
      ${once ? html`<div class="t-label" style=${{ marginTop: '-8px' }}>${v.label}<span class="muted" style=${{ fontWeight: 500 }}> · ${dayCount(v.start, v.end)} days</span></div>`
        : html`<div style=${{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '-6px -8px 0' }}>
        <button class="icon-btn" aria-label=${'Previous ' + u} onClick=${function () { go(-1); }}><${Icon} n="left" size=${18} /></button>
        <div class="t-label">${view.offset === 0 ? 'This ' + u : view.offset === -1 ? 'Last ' + u : v.label}<span class="muted" style=${{ fontWeight: 500 }}>${view.offset >= -1 ? ' · ' + v.label : ''}</span></div>
        <button class="icon-btn" aria-label=${'Next ' + u} disabled=${view.offset >= 0} style=${{ opacity: view.offset >= 0 ? 0.25 : 1 }} onClick=${function () { if (view.offset < 0) go(1); }}><${Icon} n="right" size=${18} /></button>
      </div>`}
      <div>
        <div style=${{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
          <span class="d-l num fit">${N(v.spent)}</span><span class="t-s muted num">spent of ${N(v.budget)}</span>
        </div>
        <div style=${{ marginTop: '14px' }}><${Bar} ratio=${v.budget ? v.spent / v.budget : 0} color=${v.left < 0 ? 'var(--critical)' : 'var(--ink-2)'} /></div>
      </div>
      ${ids.length > 0 && html`<div class="list">
        ${ids.map(function (id) {
          var bud = v.budgets[id] || 0, sp = v.byCat[id], over = bud && sp > bud;
          return html`<button class="row" key=${id} style=${{ padding: '6px 0' }} onClick=${function () { A.open({ type: 'cat', id: id, unit: unit, offset: view.offset }); }}>
            <${CatIcon} id=${id} size=${32} />
            <div class="grow"><div class="name" style=${{ fontWeight: 500 }}>${L.cat(id).name}</div></div>
            <div class="amt num">${N(sp)}<small class=${over ? 'neg' : ''}>${!bud ? 'not allocated' : over ? N(sp - bud) + ' over' : 'of ' + N(bud)}</small></div>
          </button>`;
        })}
      </div>`}
      <div>
        <div class="sec-head" style=${{ alignItems: 'center', marginBottom: '8px' }}><div class="t-title">Purchases</div>
        </div>
        ${list.length ? groupByDay(list).map(function (g) {
          var tot = g.items.filter(L.personalOut).reduce(function (a, e) { return a + e.amount; }, 0);
          return html`<div key=${g.day}>
            <div class="sec-head" style=${{ marginTop: '8px' }}><span class="t-cap muted" style=${{ fontWeight: 600 }}>${L.dayLabel(g.day, today)}</span>${tot ? html`<span class="t-cap muted num">${N(tot)}</span>` : null}</div>
            ${g.items.map(function (e) { return html`<${EntryRow} key=${e.id} e=${e} showCat=${true} onClick=${function () { A.open({ type: 'edit', id: e.id }); }} />`; })}
          </div>`;
        }) : html`<${Empty} icon="list" title="Nothing logged" text=${view.offset === 0 ? 'Tap + after you pay for something.' : 'No records for this ' + u + '.'} />`}
      </div>
    </div>`;
  }
  function Chart(p) {
    var max = Math.max.apply(null, p.bars.concat([1])), days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    return html`<div class="chart" role="img" aria-label=${'Spending by day: ' + p.bars.map(function (x, i) { return days[i] + ' ' + N(x); }).join(', ')}>
      ${p.bars.map(function (x, i) {
        return html`<div class="col" title=${N(x)}><div class="b" style=${{ height: x ? Math.max(6, x / max * 100) + '%' : '4px', background: x ? p.color : 'var(--track)' }}></div><div class="d">${days[i]}</div></div>`;
      })}
    </div>`;
  }
  // "Where it went": every allocation's share of spending for a day, week or month you choose.
  function WhereItWent(p) {
    var st = p.st, b = p.b, now = p.now, today = L.dkey(now);
    var su = useState('week'), unit = su[0], setUnit = su[1], so = useState(0), off = so[0], setOff = so[1];
    var start, end, label;
    if (unit === 'day') { start = end = L.addDays(today, off); label = off === 0 ? 'Today' : off === -1 ? 'Yesterday' : L.shortDate(start); }
    else {
      start = L.shiftPeriod(unit, unit === 'month' ? L.monthStart(today) : L.weekStart(today), off);
      end = unit === 'month' ? L.addDays(start, L.daysInMonth(start) - 1) : L.addDays(start, 6);
      label = (off === 0 ? 'This ' + unit : off === -1 ? 'Last ' + unit : '') + (off >= -1 ? ' · ' : '') + L.rangeLabel(start, end, unit);
    }
    var ents = st.entries.filter(function (e) { var k = L.entryDay(e); return L.personalOut(e) && k >= start && k <= end; });
    var total = ents.reduce(function (a, e) { return a + e.amount; }, 0), by = {};
    ents.forEach(function (e) { by[e.cat] = (by[e.cat] || 0) + e.amount; });
    var rows = Object.keys(by).sort(function (x, y) { return by[y] - by[x]; });
    var cols = [];
    if (unit !== 'day') {
      var n = L.diffDays(start, end) + 1;
      for (var k = 0; k < n; k++) cols.push({ day: L.addDays(start, k), v: 0 });
      ents.forEach(function (e) { var i = L.diffDays(start, L.entryDay(e)); if (cols[i]) cols[i].v += e.amount; });
    }
    function pick(v) { setUnit(v); setOff(0); }
    var canNext = off < 0;
    return html`<div class="card wiw">
      <${Seg} full=${true} value=${unit} onChange=${pick} options=${[{ v: 'day', label: 'Day' }, { v: 'week', label: 'Week' }, { v: 'month', label: 'Month' }]} />
      <div class="wiw-nav">
        <button class="icon-btn" aria-label=${'Previous ' + unit} onClick=${function () { setOff(off - 1); }}><${Icon} n="left" size=${18} /></button>
        <div class="wiw-label t-s">${label}</div>
        <button class="icon-btn" aria-label=${'Next ' + unit} disabled=${!canNext} style=${{ opacity: canNext ? 1 : .25 }} onClick=${function () { if (canNext) setOff(off + 1); }}><${Icon} n="right" size=${18} /></button>
      </div>
      <div><div class="t-cap muted">Spent</div><div class="d-l num fit">${N(total)}</div></div>
      ${rows.length ? html`<div class="wiw-rows">${rows.map(function (id) {
        var pct = total ? by[id] / total : 0;
        return html`<div class="wiw-row" key=${id}>
          <${CatIcon} id=${id} size=${36} />
          <div class="grow"><div class="wiw-top"><span class="wiw-name">${L.cat(id).name}</span><span class="num wiw-amt">${N(by[id])}</span></div>
            <div class="wiw-bot"><div class="wiw-bar"><i style=${{ width: Math.max(2, pct * 100) + '%' }}></i></div><span class="num wiw-pct">${Math.round(pct * 100)}%</span></div></div>
        </div>`;
      })}</div>` : html`<div class="t-s muted wiw-empty">Nothing logged ${unit === 'day' ? (off === 0 ? 'today' : 'that day') : (off === 0 ? 'this ' + unit + ' yet' : 'that ' + unit)}.</div>`}
      ${unit !== 'day' && total > 0 && html`<${DayBars} cols=${cols} unit=${unit} today=${today} />`}
    </div>`;
  }
  function DayBars(p) {
    var max = Math.max.apply(null, p.cols.map(function (c) { return c.v; }).concat([1])), wk = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    return html`<div class=${cx('chart', p.unit === 'month' && 'chart-month')} style=${{ gridTemplateColumns: 'repeat(' + p.cols.length + ', 1fr)' }} role="img"
      aria-label=${'Spending by day: ' + p.cols.filter(function (c) { return c.v; }).map(function (c) { return L.shortDate(c.day) + ' ' + N(c.v); }).join(', ')}>
      ${p.cols.map(function (c, i) {
        var lab = p.unit === 'week' ? wk[i] : (i % 7 === 0 ? String(+c.day.slice(8)) : '');
        return html`<div class="col" title=${L.shortDate(c.day) + ': ' + N(c.v)}><div class="b" style=${{ height: c.v ? Math.max(6, c.v / max * 100) + '%' : '4px', background: c.v ? 'var(--ink-2)' : 'var(--track)' }}></div><div class="d">${lab}</div></div>`;
      })}
    </div>`;
  }
  function Insights(p) {
    var st = p.st, b = p.b, A = p.A, now = p.now, s = L.status(st, b, now), u = unitWord(s.unit), once = b.kind === 'once';
    var hist = b.history.filter(function (h) { return h.active; });
    var p0, r, label, isCurrent = false, idx = null;
    if (!hist.length) {
      isCurrent = true;
      p0 = { start: s.start, end: s.end, rhythm: s.unit, budget: s.budget, budgets: b.cats, spent: s.spent, over: 0 };
      r = L.review(st, b, p0, once ? 'so far' : 'this ' + u);
      label = (once ? 'So far' : 'This ' + u + ' so far') + ' · ' + L.rangeLabel(s.start, s.end, once ? 'week' : b.rhythm);
    } else {
      idx = p.idx == null || p.idx >= hist.length ? hist.length - 1 : p.idx;
      p0 = hist[idx];
      var isLast = once || p0.end === L.addDays(s.start, -1);
      r = L.review(st, b, p0, isLast ? 'last ' + u : 'that ' + u);
      label = (once ? 'Final review' : isLast ? 'Last ' + u : 'Past ' + u) + ' · ' + L.rangeLabel(p0.start, p0.end, once ? 'week' : p0.rhythm);
    }
    function act(sg, how) {
      A.commitB(b.id, function (x) { if (how === 'apply') L.applySuggestion(x, sg); else x.done[sg.key] = 'skipped'; });
      if (how === 'apply') A.say(sg.kind === 'treat' ? 'Treats allocation is now ' + N(sg.amount) : 'Moved ' + N(sg.amount));
    }
    var savedHere = b.history.reduce(function (a, h) { return a + (h.saved || 0); }, 0);
    var past = once ? [] : b.history.slice().reverse();
    return html`<div class="pad tabpad">
      <${BudgetBar} b=${b} A=${A} />
      <h1 class="h1">Insights</h1>
      <${WhereItWent} st=${st} b=${b} now=${now} />
      ${isCurrent && !once && html`<div class="banner plain">
        <span class="b-ic"><${Icon} n="calendar" size=${20} /></span>
        <div class="b-text"><div class="t-label">Your first review arrives ${b.rhythm === 'month' ? 'on the 1st' : 'on Monday'}</div>
        <div class="t-s muted">Budge will show how the ${u} went and what to change.</div></div>
      </div>`}
      ${!isCurrent && html`<div>
        <div class="sec-head" style=${{ alignItems: 'center' }}>
          <div><div class="t-title">Review</div><div class="t-s muted">${label}</div></div>
          ${hist.length > 1 && html`<div style=${{ display: 'flex', margin: '0 -8px 0 0' }}>
            <button class="icon-btn" aria-label="Older review" disabled=${idx === 0} style=${{ opacity: idx === 0 ? .25 : 1 }} onClick=${function () { if (idx > 0) p.setIdx(idx - 1); }}><${Icon} n="left" size=${18} /></button>
            <button class="icon-btn" aria-label="Newer review" disabled=${idx === hist.length - 1} style=${{ opacity: idx === hist.length - 1 ? .25 : 1 }} onClick=${function () { if (idx < hist.length - 1) p.setIdx(idx + 1); }}><${Icon} n="right" size=${18} /></button>
          </div>`}
        </div>
        <div style=${{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '10px', flexWrap: 'wrap' }}>
          <span class="t-s num">Spent <b>${N(p0.spent)}</b> of ${N(p0.budget)}</span>
          ${p0.over > 0 ? html`<span class="tag tag-bad">${N(p0.over)} over</span>` : p0.saved > 0 ? html`<span class="tag tag-good">${N(p0.saved)} left over</span>` : html`<span class="tag tag-none">On budget</span>`}
        </div>
      </div>`}
      ${!isCurrent && !r.empty && r.suggestions.map(function (sg) {
        var state = b.done[sg.key];
        if (state === 'skipped') return null;
        if (state === 'applied') {
          return html`<div class="sugg done" key=${sg.key}><span class="b-ic"><${Icon} n="check" size=${18} color="var(--emerald-deep)" /></span>
            <div class="t-s" style=${{ flex: 1 }}>${sg.kind === 'treat' ? 'Treats allocation is now ' + N(b.cats.treats) : 'Moved ' + N(sg.amount) + ' to ' + L.cat(sg.to).name.toLowerCase()}</div></div>`;
        }
        return html`<div class="sugg" key=${sg.key}>
          <${Icon} n="sparkle" size=${18} color="var(--emerald-deep)" />
          <div class="t-title">${sg.title}</div>
          <div class="t-s muted">${sg.detail}</div>
          <div class="btn-row">
            <button class="btn btn-primary" onClick=${function () { A.sfx('chime'); act(sg, 'apply'); }}>Apply</button>
            <button class="btn btn-white" onClick=${function () { act(sg, 'skip'); }}>Skip</button>
          </div>
        </div>`;
      })}
      ${(st.savings || 0) > 0 && html`<div class="card" style=${{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span class="b-ic" style=${{ background: 'var(--emerald-soft)' }}><${Icon} n="piggy" size=${20} color="var(--emerald-deep)" /></span>
        <div style=${{ flex: 1 }}><div class="t-label">Total left over</div><div class="t-cap muted">Money you didn’t spend, plus what you set aside</div></div>
        <div class="t-title num">${N(st.savings || 0)}</div>
      </div>`}
      ${past.length > 0 && html`<div>
        <div class="t-title" style=${{ marginBottom: '4px' }}>Past ${u}s</div>
        <div class="list">${past.map(function (h) {
          var i = hist.indexOf(h);
          return html`<button class="row" key=${h.start} disabled=${!h.active} onClick=${function () { if (h.active) { p.setIdx(i); var sc = document.querySelector('.screen'); if (sc) sc.scrollTop = 0; } }}>
            <div class="grow"><div class="name">${L.rangeLabel(h.start, h.end, h.rhythm)}</div>
              <div class="meta num">${h.active ? N(h.spent) + ' of ' + N(h.budget) : 'No records'}</div></div>
            ${!h.active ? html`<span class="tag tag-none">Skipped</span>` : h.over > 0 ? html`<span class="tag tag-bad">${N(h.over)} over</span>` : h.saved > 0 ? html`<span class="tag tag-good">${N(h.saved)} left over</span>` : html`<span class="tag tag-none">On budget</span>`}
            ${h.active && html`<${Icon} n="right" size=${16} color="var(--faint)" />`}
          </button>`;
        })}</div>
      </div>`}
      <${BadgeGrid} st=${st} now=${now} />
    </div>`;
  }
  function BadgeGrid(p) {
    var list = L.badges(p.st, p.now), got = list.filter(function (x) { return x.got; }).length;
    return html`<div>
      <div class="sec-head"><div class="t-title">Badges</div><span class="t-s muted">${got} of ${list.length}</span></div>
      <div class="badges">${list.map(function (x) {
        return html`<div class=${cx('badge', x.got && 'got')} key=${x.id}>
          <span class="badge-ic"><${Icon} n=${x.icon} size=${22} color=${x.got ? 'var(--emerald-deep)' : 'var(--faint)'} /></span>
          <div class="badge-name">${x.name}</div>
          ${x.got ? html`<div class="badge-text">Earned</div>` : x.prog > 0 ? html`<div class="badge-bar"><i style=${{ width: x.prog * 100 + '%' }}></i></div>` : html`<div class="badge-text">${x.text}</div>`}
        </div>`;
      })}</div>
    </div>`;
  }

  function Confirm(p) {
    var o = useState(false), open = o[0], setOpen = o[1];
    if (!open) {
      return html`<button class="row" onClick=${function () { setOpen(true); }}>
        <div class="grow"><div class=${cx('name', p.danger && 'neg')}>${p.label}</div>${p.meta && html`<div class="meta">${p.meta}</div>`}</div>
        <${Icon} n="right" size=${16} color="var(--faint)" /></button>`;
    }
    return html`<div class="confirm"><div class="t-s">${p.question}</div>
      <div class="btn-row"><button class="btn btn-secondary btn-sm" style=${{ background: 'var(--surface)' }} onClick=${function () { setOpen(false); }}>Cancel</button>
      <button class=${cx('btn btn-sm', p.danger ? 'btn-danger' : 'btn-dark')} onClick=${function () { setOpen(false); p.onYes(); }}>${p.yes}</button></div></div>`;
  }
  function PwaSettings(p) {
    var st = p.st, A = p.A, perm = usePerm(), canNotify = 'Notification' in window && 'serviceWorker' in navigator;
    var fileRef = useRef(null);
    function allow() {
      Notification.requestPermission().then(function (r) {
        perm.set(r); stat('notifications-' + r, true);
        if (r !== 'granted') return;
        if (!Push.on()) { A.say('Notifications are on'); return; }
        Push.join(st).then(function () { A.say('Reminders are on'); }, function () { A.say('Couldn’t turn on reminders. Try again later'); });
      });
    }
    function test() {
      if (Push.on()) {
        (Push.joined() ? Promise.resolve() : Push.join(st)).then(function () { return Push.test(); })
          .then(function (r) { if (r.result !== 'sent') throw 0; A.say('Sent. Check your notifications'); stat('test-push', true); })
          .catch(function () { A.say('Couldn’t reach the reminder server'); });
        return;
      }
      navigator.serviceWorker.ready.then(function (reg) {
        var n = L.streak(st, Date.now());
        return reg.showNotification('Anything to log today?', {
          body: n > 0 ? 'Tap to add it and keep your ' + n + '-day streak.' : 'Tap to add what you spent.',
          icon: 'icons/icon-192.png', badge: 'icons/badge-96.png', tag: 'daily', data: { url: './?add=1' }
        });
      }).then(function () { A.say('Sent. Check your notifications'); stat('test-notification', true); }, function () { A.say('Couldn’t send a notification'); });
    }
    function exportData() {
      var blob = new Blob([JSON.stringify(st, null, 2)], { type: 'application/json' });
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'budge-backup-' + L.dkey(Date.now()) + '.json';
      document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    }
    function importData(e) {
      var f = e.target.files && e.target.files[0]; if (!f) return;
      f.text().then(function (t) { var s = L.migrate(JSON.parse(t)); if (!s || !s.budgets) throw 0; A.replace(s); A.home(); A.say('Backup restored'); })
        .catch(function () { A.say('That file isn’t a Budge backup'); });
      e.target.value = '';
    }
    var standalone = isStandalone(), ios = isIOS();
    return html`
      <div><div class="group-title">Notifications</div><div class="group">
        ${!canNotify || (ios && !standalone) ? html`<div class="row"><div class="grow"><div class="name">Notifications</div>
            <div class="meta">${ios ? 'Add Budge to your home screen first: tap Share, then Add to Home Screen.' : 'This browser can’t show notifications.'}</div></div></div>`
        : perm.v === 'granted' ? html`<button class="row" onClick=${test}><div class="grow"><div class="name">Send a test notification</div><div class="meta">${Push.on() ? 'Sent from the reminder server, like the real one' : 'See how the daily reminder looks'}</div></div><${Icon} n="bell" size=${18} color="var(--muted)" /></button>`
        : perm.v === 'denied' ? html`<div class="row"><div class="grow"><div class="name">Notifications are blocked</div><div class="meta">Turn them on for Budge in your phone’s settings.</div></div></div>`
        : html`<button class="row" onClick=${allow}><div class="grow"><div class="name">Allow notifications</div><div class="meta">For the daily reminder</div></div><${Icon} n="right" size=${16} color="var(--faint)" /></button>`}
      </div></div>
      ${CFG.tally && html`<div><div class="group-title">Help make Budge better</div><div class="group">
        <button class="row" onClick=${function () { A.open({ type: 'feedback' }); stat('feedback-open', true); }}><div class="grow"><div class="name">Send feedback</div><div class="meta">Ideas, bugs, anything. Takes a minute.</div></div><${Icon} n="right" size=${16} color="var(--faint)" /></button>
      </div></div>`}
      <div><div class="group-title">Your data</div><div class="group">
        <button class="row" onClick=${exportData}><div class="grow"><div class="name">Save a backup</div><div class="meta">Download a file with everything</div></div><${Icon} n="right" size=${16} color="var(--faint)" /></button>
        <button class="row" onClick=${function () { fileRef.current.click(); }}><div class="grow"><div class="name">Restore a backup</div><div class="meta">Replaces what’s on this phone</div></div><${Icon} n="right" size=${16} color="var(--faint)" /></button>
        <input ref=${fileRef} type="file" accept="application/json,.json" style=${{ display: 'none' }} onChange=${importData} />
        <${Confirm} label="Start over" danger=${true} meta="Delete your budget and every record" question="Delete everything and start again?" yes="Delete all" onYes=${A.startOver} />
      </div></div>
    `;
  }
  function usePerm() {
    var s = useState(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');
    return { v: s[0], set: s[1] };
  }
  function isStandalone() { try { return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch (e) { return false; } }
  function isIOS() { return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); }
  function InstallTip(p) {
    var st = p.st, A = p.A;
    var ev = useState(window.__installEvt || null), evt = ev[0], setEvt = ev[1];
    useEffect(function () { function h() { setEvt(window.__installEvt); } window.addEventListener('budge-installable', h); return function () { window.removeEventListener('budge-installable', h); }; }, []);
    if (!PWA || st.installTipOff || isStandalone()) return null;
    var ios = isIOS();
    if (!ios && !evt) return null;
    function close() { A.commit(function (x) { x.installTipOff = true; }); }
    function install() { evt.prompt(); evt.userChoice.then(function (c) { stat('install-' + (c && c.outcome), true); window.__installEvt = null; setEvt(null); close(); }); }
    return html`<div class="card install-tip">
      <${Logo} size=${40} />
      <div style=${{ flex: 1, minWidth: 0 }}><div class="t-label">Add Budge to your home screen</div>
        <div class="t-s muted">${ios ? html`Tap <b>Share</b>, then <b>Add to Home Screen</b>. It opens like an app and works offline.` : 'It opens like an app and works offline.'}</div>
        ${!ios && html`<button class="btn btn-primary btn-sm" style=${{ width: 'auto', marginTop: '10px', paddingInline: '18px' }} onClick=${install}>Install</button>`}</div>
      <button class="icon-btn" aria-label="Close" onClick=${close}><${Icon} n="x" size=${18} color="var(--muted)" /></button>
    </div>`;
  }
  function BudgetSettings(p) {
    var st = p.st, b = p.b, A = p.A, now = p.now, total = L.totalBudget(b.cats);
    var pots = L.allCats().filter(function (c) { return b.cats[c.id] > 0; }).length;
    function setRhythm(r) {
      if (r === b.rhythm) return;
      var today = L.dkey(now), nb = L.convertBudgets(b.cats, r, today);
      A.commitB(b.id, function (x) { x.rhythm = r; x.cats = nb; x.periodStart = L.periodStart(r, today); });
      A.say('Your budget is now ' + N(L.totalBudget(nb)) + ' ' + perUnit(r));
    }
    return html`<div class="pad tabpad">
      <h1 class="h1">Settings</h1>
      <div><div class="group-title">Budget</div><div class="group">
        <div class="row"><div class="grow name">Budget every</div>
          <${Seg} value=${b.rhythm} onChange=${setRhythm} options=${[{ v: 'week', label: 'Week' }, { v: 'month', label: 'Month' }]} /></div>
        <button class="row" onClick=${function () { A.open({ type: 'split' }); }}>
          <div class="grow"><div class="name">Allocations</div><div class="meta">${pots} allocation${pots === 1 ? '' : 's'}</div></div>
          <div class="amt num">${N(total)}</div><${Icon} n="right" size=${16} color="var(--faint)" /></button>
      </div></div>
      <div><div class="group-title">Reminders</div><div class="group">
        <div class="row"><div class="grow"><div class="name">Daily reminder</div><div class="meta">Only on days you haven’t logged anything</div></div>
          <${Toggle} label="Daily reminder" on=${st.reminder.on} onChange=${function (v) { A.commit(function (x) { x.reminder.on = v; }); }} /></div>
        ${st.reminder.on && html`<label class="row" for="set-time"><div class="grow name">Time</div>
          <input id="set-time" type="time" class="time-in" value=${st.reminder.time} onChange=${function (e) { var v = e.target.value; if (v) A.commit(function (x) { x.reminder.time = v; }); }} /></label>`}
        <div class="row"><div class="grow"><div class="name">Nearly used up warning</div><div class="meta">When an allocation is 80% spent</div></div>
          <${Toggle} label="Nearly used up warning" on=${st.treatWarn !== false} onChange=${function (v) { A.commit(function (x) { x.treatWarn = v; }); }} /></div>
        <div class="row"><div class="grow"><div class="name">Sounds and vibration</div><div class="meta">When you log and save</div></div>
          <${Toggle} label="Sounds and vibration" on=${st.sound !== false} onChange=${function (v) { A.commit(function (x) { x.sound = v; }); if (v) setTimeout(function () { SFX.enabled = true; SFX.play('check'); }, 30); }} /></div>
      </div></div>
      ${PWA && html`<${PwaSettings} st=${st} A=${A} />`}
      ${!PWA && html`<div><div class="group-title">Try the prototype</div><div class="group">
        <div class="row"><div class="grow"><div class="name">App date</div><div class="meta">${st.offset ? 'Moved ' + st.offset + ' day' + (st.offset > 1 ? 's' : '') + ' ahead' : 'Today'}</div></div><div class="amt">${L.shortDate(L.dkey(now))}</div></div>
        <button class="row" onClick=${A.notify}><div class="grow name">Show the daily reminder</div><${Icon} n="bell" size=${18} color="var(--muted)" /></button>
        <button class="row" onClick=${function () { A.jump(1); }}><div class="grow name">Jump ahead 1 day</div><${Icon} n="right" size=${16} color="var(--faint)" /></button>
        <button class="row" onClick=${A.nextWeek}><div class="grow"><div class="name">Jump to next week</div><div class="meta">What’s left is added to your total left over</div></div><${Icon} n="right" size=${16} color="var(--faint)" /></button>
        <${Confirm} label="Load the sample week" question="This replaces your data with a sample week." yes="Load sample" onYes=${A.loadSample} />
        <${Confirm} label="Start over" danger=${true} meta="Delete your budget and every record" question="Delete everything and start again?" yes="Delete all" onYes=${A.startOver} />
      </div></div>`}
      <div class="t-cap muted" style=${{ textAlign: 'center' }}>${PWA ? 'Budge ' + (CFG.release || '') + (CFG.released ? ' · Updated ' + CFG.released : '') : 'Budge prototype ' + (window.BUDGE_RELEASE || '') + ' · ' + (p.mode === 'db' ? 'Saved to your account' : 'Saved on this device')}<br />${PWA ? 'Your data stays on this phone' : ''}</div>
    </div>`;
  }
  // ================= layers =================
  function NewPot(p) {
    var n = useState(''), name = n[0], setName = n[1];
    var ic = useState('star'), icon = ic[0], setIcon = ic[1];
    var co = useState(0), color = co[0], setColor = co[1];
    var pal = L.PALETTE[color];
    function add() {
      var c = { id: 'c_' + L.uid(), name: name.trim(), icon: icon, color: pal[0], tint: pal[1] };
      p.A.commit(function (x) { x.customCats = (x.customCats || []).concat([c]); });
      L.setCustom((p.st.customCats || []).concat([c]), p.st.catNames);
      p.onAdd(c.id);
    }
    return html`<div class="card newpot">
      <div class="sec-head"><span class="t-label">New allocation</span><button class="link" style=${{ padding: 0 }} onClick=${p.onCancel}>Cancel</button></div>
      <div style=${{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <span class="cat" style=${{ width: '48px', height: '48px', background: 'var(--surface)' }}><svg width="24" height="24" viewBox="0 0 256 256" fill="var(--ink-2)" dangerouslySetInnerHTML=${{ __html: ICONS.pick[icon] }}></svg></span>
        <input id="newpot-name" class="field" style=${{ background: 'var(--surface)' }} placeholder="Name, e.g. Gym" maxlength="24" value=${name} onInput=${function (e) { setName(e.target.value); }} />
      </div>
      <div class="t-cap muted" style=${{ fontWeight: 600 }}>Icon</div>
      <div class="icon-grid" role="radiogroup" aria-label="Icon">${Object.keys(ICONS.pick).map(function (k) {
        return html`<button class=${cx('icon-opt', icon === k && 'on')} role="radio" aria-checked=${icon === k} aria-label=${k.replace(/-/g, ' ')} onClick=${function () { setIcon(k); }}>
          <svg width="22" height="22" viewBox="0 0 256 256" fill=${icon === k ? 'var(--ink)' : 'var(--muted)'} dangerouslySetInnerHTML=${{ __html: ICONS.pick[k] }}></svg></button>`;
      })}</div>
      <button class="btn btn-dark" disabled=${!name.trim()} onClick=${add}>Add allocation</button>
    </div>`;
  }
  // A row you can swipe left to reveal "Remove".
  function SwipeRow(p) {
    var sd = useState(0), dx = sd[0], setDx = sd[1], drag = useRef(null), W = 96;
    function down(e) { if (p.locked) return; drag.current = { x: e.clientX, y: e.clientY, base: dx, on: false, id: e.pointerId }; }
    function move(e) {
      var g = drag.current; if (!g) return;
      var mx = e.clientX - g.x, my = e.clientY - g.y;
      if (!g.on) { if (Math.abs(mx) > 8 && Math.abs(mx) > Math.abs(my)) { g.on = true; try { e.currentTarget.setPointerCapture(g.id); } catch (er) { } } else if (Math.abs(my) > 8) { drag.current = null; return; } else return; }
      setDx(Math.max(-W - 16, Math.min(0, g.base + mx)));
    }
    function up() { var g = drag.current; drag.current = null; if (!g || !g.on) return; setDx(dx < -W / 2 ? -W : 0); }
    return html`<div class="swipe">
      <button class="swipe-back" style=${{ visibility: dx ? 'visible' : 'hidden' }} tabindex=${dx ? 0 : -1} onClick=${function () { setDx(0); p.onRemove(); }}>Remove</button>
      <div class=${cx('swipe-front', drag.current && drag.current.on && 'dragging')} style=${{ transform: 'translateX(' + dx + 'px)' }}
        onPointerDown=${down} onPointerMove=${move} onPointerUp=${up} onPointerCancel=${up}>${p.children}</div>
    </div>`;
  }
  function SplitEditor(p) {
    var c = p.cats;
    var op = useState(function () { return L.allCats().filter(function (x) { return c[x.id] > 0; }).map(function (x) { return x.id; }); });
    var open = op[0], setOpen = op[1];
    var np = useState(false), adding = np[0], setAdding = np[1];
    var total = L.totalBudget(c);
    function setV(id, v) { var n = Object.assign({}, c); n[id] = Math.min(+digits(v) || 0, 99999999); p.onChange(n); }
    function focus(id) { setTimeout(function () { var el = document.getElementById('sp-' + id); if (el) el.focus(); }, 40); }
    function remove(id) {
      var prevC = c, prevOpen = open, n = Object.assign({}, c), sp = p.spent && p.spent[id];
      n[id] = 0; p.onChange(n); setOpen(open.filter(function (x) { return x !== id; }));
      if (p.A) p.A.say(L.cat(id).name + ' removed' + (sp ? '. ' + N(sp) + ' spent still counts' : ''), function () { p.onChange(prevC); setOpen(prevOpen); });
    }
    var rest = L.allCats().filter(function (x) { return open.indexOf(x.id) < 0; });
    return html`<div style=${{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div class="card total-card"><span class="t-s muted">Total</span>
        <span><span class="t-title num" style=${{ fontWeight: 600, fontSize: '22px' }}>${N(total)}</span><span class="t-s muted"> ${perUnit(p.unit)}</span></span></div>
      ${open.length > 1 && html`<div class="t-cap muted swipe-hint"><${Icon} n="left" size=${14} />Swipe left on an allocation to remove it</div>`}
      <div class="list">
        ${open.map(function (id) {
          var cc = L.cat(id);
          return html`<${SwipeRow} key=${id} locked=${open.length <= 1} onRemove=${function () { remove(id); }}><div class="split-row">
            <${CatIcon} id=${id} size=${40} />
            <label class="grow" for=${'sp-' + id}><div class="t-label">${cc.name}</div>${id === 'treats' && html`<div class="t-cap muted">Eating out, snacks, small buys</div>`}${id === 'subs' && html`<div class="t-cap muted">Netflix, Spotify, apps</div>`}</label>
            <input id=${'sp-' + id} class="money-in" inputmode="numeric" aria-label=${cc.name + ' allocation'} value=${c[id] ? N(c[id]) : ''} placeholder="₦0"
              onInput=${function (e) { setV(id, e.target.value); }} />
          </div></${SwipeRow}>`;
        })}
      </div>
      ${adding ? html`<${NewPot} st=${p.st} A=${p.A} onCancel=${function () { setAdding(false); }} onAdd=${function (id) { setAdding(false); setOpen(open.concat([id])); focus(id); }} />`
        : html`<div><div class="t-cap muted" style=${{ marginBottom: '8px', fontWeight: 600 }}>Add an allocation</div>
        <div class="chips">
          ${rest.map(function (x) {
            return html`<button class="chip" key=${x.id} onClick=${function () { setOpen(open.concat([x.id])); focus(x.id); }}><${Icon} n="plus" size=${14} />${x.name}</button>`;
          })}
          ${p.A && html`<button class="chip chip-new" onClick=${function () { setAdding(true); }}><${Icon} n="pencil" size=${14} />Make your own</button>`}
        </div></div>`}
    </div>`;
  }
  function SplitLayer(p) {
    var b = p.b, A = p.A;
    var cs = useState(function () { return clone(b.cats); }), cats = cs[0], setCats = cs[1];
    var t = useState(''), total = t[0], setTotal = t[1];
    var tn = +digits(total) || 0;
    var kk = useState(0), k = kk[0], setK = kk[1];
    function resplit() {
      if (tn < 1000) return;
      var cur = L.totalBudget(cats), next = {};
      if (!cur) next = L.autoSplit(tn);
      else {
        var acc = 0, lastId = null;
        L.allCats().forEach(function (c) { var v = +cats[c.id] || 0; next[c.id] = v ? Math.floor(v / cur * tn / 100) * 100 : 0; acc += next[c.id]; if (v) lastId = c.id; });
        next[lastId] += tn - acc;
      }
      setCats(next); setTotal(''); setK(k + 1);
    }
    return html`<div class="layer">
      <div class="lh pad"><${Back} onClick=${A.close} /><div class="lh-title">Allocations</div></div>
      <div class="lb pad">
        <div>
          <label class="t-s muted" for="new-total">New total</label>
          <div class="field-row" style=${{ marginTop: '8px', flexWrap: 'nowrap' }}>
            <input id="new-total" class="field num" inputmode="numeric" placeholder=${N(L.totalBudget(cats))} value=${total}
              onInput=${function (e) { var d = +digits(e.target.value) || 0; setTotal(d ? N(d) : ''); }} />
            <button class="btn btn-dark btn-sm" style=${{ height: '52px' }} disabled=${tn < 1000} onClick=${resplit}>Split</button>
          </div>
          <div class="t-cap muted" style=${{ marginTop: '6px' }}>Keeps the same proportions. Or change single allocations below.</div>
        </div>
        <${SplitEditor} key=${k} cats=${cats} unit=${L.unitOf(b)} onChange=${setCats} st=${p.st} A=${A} spent=${L.status(p.st, b, Date.now()).byCat} />
      </div>
      <div class="lf pad"><button class="btn btn-primary" disabled=${L.totalBudget(cats) < 1000} onClick=${function () {
        A.commitB(b.id, function (x) { x.cats = cats; }); A.say('Budget updated'); A.close();
      }}>Save budget</button></div>
    </div>`;
  }

  // ================= create a budget =================
  function CreateBudget(p) {
    var st = p.st, A = p.A, now = p.now, first = !st.reminderAsked;
    var sStep = useState(0), step = sStep[0], setStep = sStep[1];
    var sKind = useState('week'), kind = sKind[0], setKind = sKind[1];
    var sTotal = useState(''), total = sTotal[0], setTotal = sTotal[1];
    var sCats = useState(null), cats = sCats[0], setCats = sCats[1];
    var sSeed = useState(0), seededFrom = sSeed[0], setSeeded = sSeed[1];
    var sRem = useState({ on: st.reminder.on, time: st.reminder.time }), reminder = sRem[0], setReminder = sRem[1];
    var n = +total || 0, u = unitWord(kind);
    var steps = ['type', 'amount', 'split'].concat(first ? ['reminder'] : []);
    var cur = steps[Math.min(step, steps.length - 1)], isLast = step >= steps.length - 1;
    function onKey(k) { setTotal(applyKey(total, k)); }
    useKeys(onKey, function () { if (n >= 1000) toSplit(); }, cur === 'amount');
    function next() { setStep(step + 1); }
    function toSplit() { if (!cats || seededFrom !== n) { setCats(L.autoSplit(n)); setSeeded(n); } next(); }
    function finish() {
      var b = L.newBudget({ name: 'My budget', kind: 'repeat', rhythm: kind, cats: cats }, now);
      A.commit(function (x) { x.budgets = [b]; x.mainBid = b.id; x.lastBid = b.id; x.reminder = reminder; x.reminderAsked = true; x.sample = false; });
      A.sfx('chime'); A.say('Your budget is ready'); stat('budget-created-' + kind, true); A.home();
    }
    var cta = html`<button class="btn btn-primary" disabled=${!cats || L.totalBudget(cats) < 1000} onClick=${finish}>Start budgeting</button>`;
    var head = html`<div class="lh pad">
      <${Back} icon=${step === 0 ? 'x' : 'back'} label=${step === 0 ? 'Close' : 'Back'} onClick=${function () { if (step === 0) A.close(); else setStep(step - 1); }} />
      <div class="steps" aria-label=${'Step ' + (step + 1) + ' of ' + steps.length}>${steps.map(function (x, i) { return html`<i class=${i <= step ? 'on' : ''}></i>`; })}</div>
      <span style=${{ width: '40px' }}></span>
    </div>`;
    var body, foot;
    if (cur === 'type') {
      var opts = [
        { v: 'week', t: 'Every week', d: 'Best if your income changes from month to month.', rec: true },
        { v: 'month', t: 'Every month', d: 'Best if you’re paid on a set date.' }
      ];
      body = html`<div class="lb pad"><div><h1 class="h1">How often do you want to budget?</h1><p class="t-s muted" style=${{ margin: '8px 0 0' }}>Your budget starts again each time. You can change this later.</p></div>
        ${opts.map(function (o) {
          return html`<button class=${cx('opt', kind === o.v && 'on')} role="radio" aria-checked=${kind === o.v} onClick=${function () { if (kind !== o.v) { setKind(o.v); setTotal(''); setCats(null); } }}>
            <span class="radio"></span><span style=${{ flex: 1 }}><span class="t-label" style=${{ display: 'flex', gap: '8px', alignItems: 'center' }}>${o.t}${o.rec && html`<span class="tag tag-good">Recommended</span>`}</span>
            <span class="t-s muted" style=${{ display: 'block', marginTop: '4px' }}>${o.d}</span></span></button>`;
        })}</div>`;
      foot = html`<button class="btn btn-primary" onClick=${next}>Continue</button>`;
    } else if (cur === 'amount') {
      var quick = kind === 'month' ? [150000, 200000, 300000, 500000] : [30000, 50000, 80000, 100000];
      body = html`<div class="lb lb-amount">
        <div class="pad"><h1 class="h1">How much can you spend each ${u}?</h1>
          <p class="t-s muted" style=${{ margin: '8px 0 0' }}>Leave out rent and money you’re putting away. You can change it any time.</p></div>
        <div class="amount-wrap pad"><${BigAmount} value=${total} />
          <div class="quick">${quick.map(function (q) { return html`<button class=${cx('chip', n === q && 'on')} onClick=${function () { setTotal(String(q)); }}>${L.short(q)}</button>`; })}</div>
        </div>
        <div class="pad"><${Keypad} onKey=${onKey} /></div>
      </div>`;
      foot = html`<button class="btn btn-primary" disabled=${n < 1000} onClick=${toSplit}>Continue</button>`;
    } else if (cur === 'split') {
      body = html`<div class="lb pad"><div><h1 class="h1">Split it into allocations</h1><p class="t-s muted" style=${{ margin: '8px 0 0' }}>An allocation is what you can spend on one thing each ${u}. We’ve made a start. Change any amount.</p></div>
        <${SplitEditor} cats=${cats} unit=${kind} onChange=${setCats} st=${st} A=${A} /></div>`;
      foot = isLast ? cta : html`<button class="btn btn-primary" disabled=${L.totalBudget(cats) < 1000} onClick=${next}>Continue</button>`;
    } else {
      body = html`<div class="lb pad">
        <span class="b-ic" style=${{ width: '56px', height: '56px', background: 'var(--emerald-soft)' }}><${Icon} n="bell" size=${26} color="var(--emerald-deep)" /></span>
        <div><h1 class="h1">Want a daily reminder?</h1><p class="t-s muted" style=${{ margin: '8px 0 0' }}>We’ll only nudge you on days you haven’t logged anything.</p></div>
        <div class="group">
          <div class="row"><div class="grow name">Daily reminder</div><${Toggle} label="Daily reminder" on=${reminder.on} onChange=${function (v) { setReminder({ on: v, time: reminder.time }); }} /></div>
          ${reminder.on && html`<label class="row" for="setup-time"><div class="grow name">Time</div>
            <input id="setup-time" type="time" class="time-in" style=${{ background: 'var(--surface)' }} value=${reminder.time} onChange=${function (e) { if (e.target.value) setReminder({ on: true, time: e.target.value }); }} /></label>`}
        </div>
        <p class="t-cap muted" style=${{ margin: 0 }}>${PWA ? 'You can turn on notifications in Settings.' : 'In this prototype, reminders show inside the app.'}</p>
      </div>`;
      foot = cta;
    }
    return html`<div class="layer up">${head}${body}<div class="lf pad">${foot}</div></div>`;
  }
  // ================= add flow =================
  function DateChips(p) {
    var today = p.today, y = L.addDays(today, -1), v = p.value;
    var other = v !== today && v !== y;
    return html`<div class="field-row" role="radiogroup" aria-label="Date">
      <button class=${cx('chip', v === today && 'on')} onClick=${function () { p.onChange(today); }}>Today</button>
      <button class=${cx('chip', v === y && 'on')} onClick=${function () { p.onChange(y); }}>Yesterday</button>
      <label class=${cx('chip date-chip', other && 'on')}><${Icon} n="calendar" size=${16} />${other ? L.shortDate(v) : 'Pick a date'}
        <input type="date" aria-label="Pick a date" max=${today} value=${v} onChange=${function (e) { if (e.target.value && e.target.value <= today) p.onChange(e.target.value); }} /></label>
    </div>`;
  }
  function tsFor(day, today, now) {
    if (day === today) return now;
    var d = L.parseKey(day), n = new Date(now);
    d.setHours(n.getHours(), n.getMinutes(), 0, 0);
    return d.getTime();
  }
  function liveBudgets(st, today) { var m = L.mainBudget(st); return m && L.phaseOf(m, today) === 'live' ? [m] : []; }

  // Logging a purchase: one question per screen. Amount → allocation → check and save.
  function AllocPick(p) {
    var pots = {}; (p.pots || []).forEach(function (x) { pots[x.id] = x; });
    var cats = L.allCats(), set = cats.filter(function (c) { return pots[c.id] && pots[c.id].budget > 0; }), rest = cats.filter(function (c) { return !(pots[c.id] && pots[c.id].budget > 0); });
    function tile(c) {
      var pt = pots[c.id], line;
      if (pt && pt.budget > 0) line = pt.left < 0 ? html`<span class="ap-left neg num">${N(-pt.left)} over</span>` : html`<span class=${cx('ap-left num', pt.state === 'near' && 'warn')}>${N(pt.left)} left</span>`;
      else line = html`<span class="ap-left muted">Not allocated</span>`;
      return html`<button class=${cx('ap-tile', p.value === c.id && 'on')} role="radio" aria-checked=${p.value === c.id} key=${c.id} onClick=${function () { p.onChange(c.id); }}>
        <${CatIcon} id=${c.id} size=${40} /><span class="ap-name">${c.name}</span>${line}</button>`;
    }
    return html`<div role="radiogroup" aria-label="Allocation">
      <div class="ap-grid">${set.map(tile)}</div>
      ${rest.length > 0 && html`<div class="t-cap muted ap-sub">Not in your budget</div><div class="ap-grid">${rest.map(tile)}</div>`}
    </div>`;
  }
  function AddFlow(p) {
    var st = p.st, A = p.A, now = p.now, today = L.dkey(now), pre = p.preset || {};
    var b = L.mainBudget(st), s = b ? L.status(st, b, now) : null;
    var sStep = useState('amount'), step = sStep[0], setStep = sStep[1];
    var sAmt = useState(pre.amount ? String(pre.amount) : ''), amt = sAmt[0], setAmt = sAmt[1];
    var sCat = useState(pre.cat || null), catId = sCat[0], setCat = sCat[1];
    var sNote = useState(''), note = sNote[0], setNote = sNote[1];
    var sDay = useState(today), day = sDay[0], setDay = sDay[1];
    var sSaved = useState(null), saved = sSaved[0], setSaved = sSaved[1];
    var n = +amt || 0, u = s ? unitWord(s.unit) : 'week', per = ' this ' + u;
    var order = pre.cat ? ['amount', 'check'] : ['amount', 'cat', 'check'], at = order.indexOf(step);
    function onKey(k) { setAmt(applyKey(amt, k)); }
    function afterAmount() { if (n > 0) setStep(pre.cat ? 'check' : 'cat'); }
    useKeys(onKey, afterAmount, step === 'amount');
    function back() { if (at <= 0) A.close(); else setStep(order[at - 1]); }
    function reset() { setStep('amount'); setAmt(''); setCat(pre.cat || null); setNote(''); setDay(today); setSaved(null); }
    function save() {
      var e = { id: L.uid(), type: 'out', amount: n, note: note.trim(), ts: tsFor(day, today, now), cat: catId || 'other', work: false, bid: b.id };
      A.commit(function (x) { x.entries.push(e); x.lastBid = b.id; }); stat('log-purchase', true);
      var x2 = clone(st); x2.entries.push(e); var s2 = L.status(x2, L.findBudget(x2, b.id), now);
      var p2 = s2.pots.filter(function (q) { return q.id === e.cat; })[0];
      A.sfx(p2 && p2.state === 'over' ? 'over' : p2 && p2.state === 'near' ? 'warn' : 'pour');
      setSaved(e); setStep('saved');
    }
    var head = html`<div class="lh pad">
      <${Back} icon=${at <= 0 ? 'x' : 'back'} label=${at <= 0 ? 'Close' : 'Back'} onClick=${back} />
      <div class="steps" aria-label=${'Step ' + (at + 1) + ' of ' + order.length}>${order.map(function (x, i) { return html`<i class=${i <= at ? 'on' : ''}></i>`; })}</div>
      <span style=${{ width: '40px' }}></span></div>`;

    if (step === 'saved' && saved) {
      var e = saved, streak = L.streak(st, now), inPeriod = s && L.entryDay(e) >= s.start && L.entryDay(e) <= s.end;
      var pt = s.pots.filter(function (x) { return x.id === e.cat; })[0] || { id: e.cat, budget: 0, spent: 0, left: 0, ratio: 0, state: 'none' };
      var cname = L.cat(e.cat).name, body, extra = null;
      if (!inPeriod) body = html`<div class="d-xl num fit">${N(e.amount)}</div><div class="t-s muted">Logged for ${L.shortDate(L.entryDay(e))}</div>`;
      else if (!pt.budget) body = html`<div class="d-xl num fit">${N(Math.max(0, s.left))}</div><div class="t-s muted">left${per}</div>
        <div class="t-cap muted" style=${{ marginTop: '6px' }}>${cname} isn’t in your budget, so it came out of your total.</div>`;
      else {
        var over = pt.state === 'over', color = over ? 'var(--critical)' : pt.state === 'near' ? 'var(--warning)' : 'var(--ink-2)';
        body = html`<div class=${cx('d-xl num fit', over && 'neg')}>${N(Math.abs(pt.left))}</div>
          <div class="t-s muted">${over ? 'over in ' + cname : 'left in ' + cname}</div>
          <div class="saved-pot"><${Bar} ratio=${pt.ratio} color=${color} /><div class="t-cap muted num">${N(pt.spent)} of ${N(pt.budget)}${per}</div></div>`;
        if (over) extra = html`<button class="btn btn-secondary" style=${{ marginTop: '18px' }} onClick=${function () { A.cover(b.id, pt.id); }}>Move money from another allocation</button>`;
      }
      if (inPeriod) extra = html`${extra}<div class="card saved-total"><span class="t-s muted">${s.left < 0 ? 'Over budget' : 'Left' + per}</span>
        <span class=${cx('t-label num', s.left < 0 && 'neg')}>${N(Math.abs(s.left))}</span></div>`;
      return html`<div class="layer up">
        <div class="lh pad"><span style=${{ flex: 1 }}></span><${Back} icon="x" label="Close" onClick=${A.close} /></div>
        <div class="saved pad">
          <span class="check-big"><${Icon} n="check" size=${34} /></span>
          <div class="t-label" style=${{ marginBottom: '4px' }}>Logged</div>
          ${body}${extra}
          ${streak > 0 && html`<div class="t-s streak-line"><${Icon} n="fire" size=${16} color="var(--warning)" />${streak}-day streak</div>`}
        </div>
        <div class="lf pad"><button class="btn btn-primary" onClick=${A.close}>Done</button><button class="btn btn-text" onClick=${reset}>Log another</button></div>
      </div>`;
    }

    if (step === 'cat') {
      return html`<div class="layer up" style=${{ animation: 'none' }}>${head}
        <div class="lb pad step-in" key="cat">
          <div><h1 class="h1">What was it for?</h1><p class="t-s muted step-sub num">${N(n)}</p></div>
          <${AllocPick} value=${catId} pots=${s ? s.pots : []} onChange=${function (id) { setCat(id); A.sfx('tap'); setTimeout(function () { setStep('check'); }, 140); }} />
        </div>
      </div>`;
    }

    if (step === 'check') {
      var cid = catId || 'other', c = L.cat(cid), q = s.pots.filter(function (x) { return x.id === cid; })[0];
      var inNow = day >= s.start && day <= s.end, has = q && q.budget > 0;
      var before = has ? q.left : s.left, after = before - (inNow ? n : 0), label = has ? 'Left in ' + c.name.toLowerCase() : 'Left this ' + u;
      return html`<div class="layer up" style=${{ animation: 'none' }}>${head}
        <div class="lb pad step-in" key="check">
          <h1 class="h1">Check and save</h1>
          <div class="sum-card">
            <div class="sum-top"><${CatIcon} id=${cid} size=${44} />
              <div class="grow"><div class="t-label">${c.name}</div><div class="t-cap muted">${has ? 'Allocation' : 'Not in your budget'}</div></div>
              <div class="sum-amt num">${N(n)}</div></div>
            ${inNow && html`<div class="sum-change">
              <span class="t-s muted">${label}</span>
              <span class="num sum-from">${before < 0 ? N(-before) + ' over' : N(before)}</span>
              <${Icon} n="right" size=${14} color="var(--faint)" />
              <span class=${cx('num sum-to', after < 0 && 'neg')}>${after < 0 ? N(-after) + ' over' : N(after)}</span></div>`}
          </div>
          <label class="fld"><span class="t-label">What was it? <span class="muted fw-r">Optional</span></span>
            <input id="add-note" class="field" placeholder=${'e.g. ' + (cid === 'treats' ? 'Shawarma' : cid === 'transport' ? 'Bolt to work' : cid === 'food' ? 'Rice and plantain' : 'Something')} maxlength="40" value=${note} onInput=${function (ev) { setNote(ev.target.value); }} /></label>
          <div class="fld"><span class="t-label">When?</span><${DateChips} today=${today} value=${day} onChange=${setDay} /></div>
        </div>
        <div class="lf pad"><button class="btn btn-primary" onClick=${save}>Save</button></div>
      </div>`;
    }

    var hint = !s ? html`<span class="hint muted">No budget is running today</span>`
      : s.mode === 'over' ? html`<span class="hint"><span class="dot" style=${{ background: 'var(--critical)' }}></span>${N(-s.left)} over${per}</span>`
      : html`<span class="hint"><span class="dot" style=${{ background: s.mode === 'low' ? 'var(--warning)' : 'var(--emerald)' }}></span>${N(s.left)} left${per}</span>`;
    return html`<div class="layer up">${head}
      <div class="lb lb-amount">
        <div class="pad"><h1 class="h1">How much did you spend?</h1></div>
        <div class="amount-wrap pad"><${BigAmount} value=${amt} />${hint}</div>
        <div class="pad"><${Keypad} onKey=${onKey} /></div>
      </div>
      <div class="lf pad"><button class="btn btn-primary" disabled=${!n || !b} onClick=${afterAmount}>Continue</button></div>
    </div>`;
  }
  // ================= category detail, lists, edit =================
  function CategoryDetail(p) {
    var st = p.st, A = p.A, b = p.b, id = p.id, unit = p.unit || L.unitOf(b);
    var v = L.rangeView(st, b, unit, p.offset || 0, p.now), c = L.cat(id), isWork = id === 'work';
    var ents = v.entries.filter(function (e) { return isWork ? (e.type === 'out' && e.work) : (L.personalOut(e) && e.cat === id); });
    var spent = isWork ? v.work : (v.byCat[id] || 0), bud = isWork ? 0 : (v.budgets[id] || 0), left = bud - spent;
    var ed = useState(false), editing = ed[0], setEditing = ed[1];
    var val = useState(''), draft = val[0], setDraft = val[1];
    var rb = +b.cats[id] || 0, u = unitWord(v.unit), once = b.kind === 'once';
    var near = bud && spent >= 0.8 * bud && st.treatWarn !== false;
    var color = bud && spent > bud ? 'var(--critical)' : near ? 'var(--warning)' : 'var(--ink-2)';
    var current = v.isCurrent && !v.scaled;
    var potLabel = once ? 'Allocation' : (L.unitOf(b) === 'month' ? 'Monthly allocation' : 'Weekly allocation');
    var pn = useState(c.name), pname = pn[0], setPname = pn[1];
    function renamePot() {
      var v = pname.trim();
      if (!v || v === c.name) { setPname(c.name); return; }
      A.commit(function (x) {
        var cu = (x.customCats || []).filter(function (k) { return k.id === id; })[0];
        if (cu) cu.name = v; else { x.catNames = x.catNames || {}; x.catNames[id] = v; }
      });
      A.say('Renamed to ' + v);
    }
    function saveBudget() {
      var x = Math.min(+digits(draft) || 0, 99999999);
      A.commitB(b.id, function (bb) { bb.cats[id] = x; });
      setEditing(false); A.say(x ? c.name + ' allocation is now ' + N(x) : c.name + ' allocation removed');
    }
    var when = v.unit === 'once' ? v.label : (v.offset === 0 ? 'This ' + u : v.offset === -1 ? 'Last ' + u : v.label) + ' · ' + v.label;
    return html`<div class="layer">
      <div class="lh pad"><${Back} onClick=${A.back} /><span class="t-s muted">${b.name}</span></div>
      <div class="lb pad">
        <div style=${{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <${CatIcon} id=${id} size=${56} />
          <div><h1 class="h1">${c.name}</h1><div class="t-s muted" style=${{ marginTop: '4px' }}>${when}</div></div>
        </div>
        <div>
          ${current && bud ? html`<div style=${{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
              <span class=${cx('d-l num fit', left < 0 && 'neg')}>${N(Math.abs(left))}</span><span class=${cx('t-s num', left < 0 ? 'neg' : 'muted')}>${left < 0 ? 'over' : 'left'} of ${N(bud)}</span></div>`
            : html`<div style=${{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}><span class="d-l num fit">${N(spent)}</span><span class="t-s muted num">${bud ? 'spent of ' + N(bud) : 'spent'}</span></div>`}
          ${bud ? html`<div style=${{ marginTop: '14px' }}><${Bar} ratio=${spent / bud} color=${color} /></div>` : null}
          <div class=${cx('t-s num', 'muted')} style=${{ marginTop: '10px' }}>
            ${isWork ? 'Not counted in your budget' : !bud ? 'Nothing allocated. Spending here comes out of your total.' : current ? N(spent) + ' spent' + (near && left >= 0 ? ' · almost empty' : '') : left < 0 ? N(-left) + ' over' : N(left) + ' not spent'}</div>
        </div>
        ${current && bud > 0 && left < 0 && html`<div class="banner bad">
          <span class="b-ic"><${Icon} n="warn" size=${20} color="var(--critical)" /></span>
          <div class="b-text"><div class="t-label">${N(-left)} over</div><div class="t-s muted">Move money in from an allocation that has some left.</div>
            <div class="b-actions"><button class="btn btn-dark btn-sm" onClick=${function () { A.cover(b.id, id, true); }}>Move money</button></div></div></div>`}
        ${!isWork && html`<div class="group">
          ${editing ? html`<div class="confirm">
            <label class="t-s muted" for="cat-budget">${potLabel}</label>
            <input id="cat-budget" class="field num" style=${{ background: 'var(--surface)' }} inputmode="numeric" placeholder="₦0" value=${draft}
              onInput=${function (e) { var d = +digits(e.target.value) || 0; setDraft(d ? N(d) : ''); }} />
            <div class="btn-row"><button class="btn btn-secondary btn-sm" style=${{ background: 'var(--surface)' }} onClick=${function () { setEditing(false); }}>Cancel</button>
              <button class="btn btn-dark btn-sm" onClick=${saveBudget}>Save</button></div>
          </div>` : html`<button class="row" onClick=${function () { setDraft(rb ? N(rb) : ''); setEditing(true); }}>
            <div class="grow"><div class="name">${potLabel}</div>${v.scaled ? html`<div class="meta">Shown above scaled to ${perUnit(v.unit)}</div>` : bud !== rb && current ? html`<div class="meta">${N(bud)} this ${u} after moves</div>` : null}</div>
            <div class="amt num">${rb ? N(rb) : 'Not set'}</div><${Icon} n="pencil" size=${18} color="var(--muted)" /></button>`}
          <label class="row" for="pot-name"><div class="grow name">Name</div>
            <input id="pot-name" class="name-in" maxlength="24" value=${pname} onInput=${function (e) { setPname(e.target.value); }} onBlur=${renamePot} /></label>
        </div>`}
        <div>
          <div class="t-title" style=${{ marginBottom: '4px' }}>${ents.length ? ents.length + ' purchase' + (ents.length > 1 ? 's' : '') : 'Purchases'}</div>
          ${ents.length ? groupByDay(ents).map(function (g) {
            return html`<div key=${g.day}><div class="t-cap muted" style=${{ fontWeight: 600, marginTop: '10px' }}>${L.dayLabel(g.day, L.dkey(p.now))}</div>
              ${g.items.map(function (e) { return html`<${EntryRow} key=${e.id} e=${e} showCat=${isWork} onClick=${function () { A.open({ type: 'edit', id: e.id }); }} />`; })}</div>`;
          }) : html`<div class="t-s muted" style=${{ marginTop: '6px' }}>Nothing yet.</div>`}
        </div>
      </div>
    </div>`;
  }
  function CoverLayer(p) {
    var st = p.st, A = p.A, b = p.b, s = L.status(st, b, p.now);
    var target = s.pots.filter(function (x) { return x.id === p.id; })[0];
    var need = target && target.left < 0 ? -target.left : 0;
    var donors = s.pots.filter(function (x) { return x.id !== p.id && x.budget > 0 && x.left > 0; }).sort(function (x, y) { return y.left - x.left; });
    var name = L.cat(p.id).name, once = b.kind === 'once';
    function move(d) {
      var amt = Math.min(need, d.left);
      A.commitB(b.id, function (x, st0) { L.coverPot(x, s.start, d.id, p.id, amt); st0.covered = true; });
      A.sfx('chime'); A.say('Moved ' + N(amt) + ' from ' + L.cat(d.id).name.toLowerCase()); A.back();
    }
    return html`<div class="layer">
      <div class="lh pad"><${Back} onClick=${A.back} /><div class="lh-title">Move money to ${name.toLowerCase()}</div></div>
      <div class="lb pad">
        ${!need ? html`<${Empty} icon="check" title=${name + ' isn’t over'} text="Nothing to move." />` : html`
          <div style=${{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <${CatIcon} id=${p.id} size=${48} />
            <div><div class="d-l num neg" style=${{ fontSize: '32px' }}>${N(need)} over</div><div class="t-s muted">${once ? 'Moves last for this budget.' : 'Moves only change this ' + unitWord(s.unit) + '. Next ' + unitWord(s.unit) + ' your allocations reset.'}</div></div>
          </div>
          <div>
            <div class="t-title" style=${{ marginBottom: '4px' }}>Take it from</div>
            ${donors.length ? html`<div class="list">${donors.map(function (d) {
              var amt = Math.min(need, d.left);
              return html`<button class="row" key=${d.id} onClick=${function () { move(d); }}>
                <${CatIcon} id=${d.id} size=${40} />
                <div class="grow"><div class="name">${L.cat(d.id).name}</div><div class="meta num">${N(d.left)} left</div></div>
                <span class="chip" style=${{ height: '32px' }}>Move ${N(amt)}</span>
              </button>`;
            })}</div>` : html`<${Empty} title="No allocation has money left" text="The overspend comes out of your total." />`}
          </div>`}
      </div>
    </div>`;
  }
  function PurchaseList(p) {
    var st = p.st, A = p.A, b = p.b, today = L.dkey(p.now);
    var v = L.rangeView(st, b, p.unit || L.unitOf(b), p.offset || 0, p.now);
    var list = v.entries.filter(L.personalOut);
    return html`<div class="layer">
      <div class="lh pad"><${Back} onClick=${A.back} /><div class="lh-title">All purchases</div><span class="t-s muted">${v.label}</span></div>
      <div class="lb pad">
        ${list.length ? groupByDay(list).map(function (g) {
          var tot = g.items.reduce(function (a, e) { return a + e.amount; }, 0);
          return html`<div key=${g.day}>
            <div class="sec-head"><span class="t-cap muted day-label">${L.dayLabel(g.day, today)}</span><span class="t-cap muted num">${N(tot)}</span></div>
            ${g.items.map(function (e) { return html`<${EntryRow} key=${e.id} e=${e} showCat=${true} onClick=${function () { A.open({ type: 'edit', id: e.id }); }} />`; })}
          </div>`;
        }) : html`<${Empty} icon="list" title="Nothing here yet" text="No purchases for this period." />`}
      </div>
    </div>`;
  }

  function EditEntry(p) {
    var st = p.st, A = p.A, today = L.dkey(p.now);
    var orig = st.entries.filter(function (e) { return e.id === p.id; })[0];
    var sAmt = useState(orig ? N(orig.amount) : ''), amt = sAmt[0], setAmt = sAmt[1];
    var sCat = useState(orig ? orig.cat : null), catId = sCat[0], setCat = sCat[1];
    var sBid = useState(orig ? orig.bid : null), bid = sBid[0], setBid = sBid[1];
    var sNote = useState(orig ? orig.note || '' : ''), note = sNote[0], setNote = sNote[1];
    var sDay = useState(orig ? L.entryDay(orig) : today), day = sDay[0], setDay = sDay[1];
    var cf = useState(false), confirming = cf[0], setConfirming = cf[1];
    if (!orig) return html`<div class="layer"><div class="lh pad"><${Back} onClick=${A.back} /></div><div class="lb pad"><${Empty} title="This record was deleted" /></div></div>`;
    var n = +digits(amt) || 0, isIn = orig.type === 'in', b = L.mainBudget(st), sp = b ? L.status(st, b, p.now).pots : [];
    function save() {
      A.commit(function (x) {
        x.entries.forEach(function (e) {
          if (e.id !== orig.id) return;
          e.amount = n; e.note = note.trim();
          if (!isIn) { e.cat = catId; e.work = false; e.bid = bid || (b && b.id); }
          if (day !== L.entryDay(orig)) { var d = L.parseKey(day), t = new Date(orig.ts); d.setHours(t.getHours(), t.getMinutes(), 0, 0); e.ts = d.getTime(); }
        });
      });
      A.say('Changes saved'); A.back();
    }
    function del() { A.commit(function (x) { x.entries = x.entries.filter(function (e) { return e.id !== orig.id; }); }); A.say('Deleted'); A.back(); }
    return html`<div class="layer">
      <div class="lh pad"><${Back} onClick=${A.back} /><div class="lh-title">${isIn ? 'Edit record' : 'Edit purchase'}</div></div>
      <div class="lb pad">
        <label class="fld"><span class="t-label">Amount</span>
          <input id="edit-amt" class="field field-big num" inputmode="numeric" value=${amt}
            onInput=${function (e) { var d = +digits(e.target.value) || 0; setAmt(d ? N(d) : ''); }} /></label>
        ${!isIn && html`<div class="fld"><span class="t-label">Allocation</span><${AllocPick} value=${catId} pots=${sp} onChange=${setCat} /></div>`}
        <label class="fld"><span class="t-label">What was it? <span class="muted fw-r">Optional</span></span>
          <input id="edit-note" class="field" maxlength="40" value=${note} onInput=${function (e) { setNote(e.target.value); }} /></label>
        <div class="fld"><span class="t-label">When?</span><${DateChips} today=${today} value=${day} onChange=${setDay} /></div>
      </div>
      <div class="lf pad">
        ${confirming ? html`<div class="card" style=${{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div class="t-s">Delete this ${isIn ? 'record' : 'purchase'}?</div>
          <div class="btn-row"><button class="btn btn-secondary btn-sm" style=${{ background: 'var(--surface)' }} onClick=${function () { setConfirming(false); }}>Cancel</button>
            <button class="btn btn-danger btn-sm" onClick=${del}>Delete</button></div></div>`
          : html`<button class="btn btn-primary" disabled=${!n} onClick=${save}>Save changes</button>
            <button class="btn btn-text neg" onClick=${function () { setConfirming(true); }}><${Icon} n="trash" size=${18} />Delete</button>`}
      </div>
    </div>`;
  }

  // ================= guide (wide screens) =================
  function Guide(p) {
    var st = p.st, A = p.A, now = p.now, today = L.dkey(now), has = st.budgets.length > 0;
    var sure = useState(false), confirmFresh = sure[0], setConfirm = sure[1];
    var live = liveBudgets(st, today);
    var treatB = live.filter(function (b) { return b.cats.treats > 0; });
    treatB = treatB.filter(function (b) { return b.id === st.lastBid; })[0] || treatB[0];
    var reviewB = st.budgets.filter(function (b) { return lastReview(b); })[0];
    var main = L.mainBudget(st);
    var items = [
      { t: 'Set up from scratch', d: 'How often, how much, then your allocations.', b: confirmFresh ? 'Yes, delete all' : (has ? 'Start fresh' : 'Set up'), danger: confirmFresh,
        go: function () { if (!has) A.create(); else if (confirmFresh) { setConfirm(false); A.startOver(); } else setConfirm(true); } },
      { t: 'Look around', d: 'A sample week with last week’s review.', b: 'Load sample', go: A.loadSample },
      { t: 'Log a purchase', d: 'Amount, then allocation. Watch the tank drop.', b: 'Log one', off: !live.length, go: function () { A.add(); } },
      { t: 'Overspend an allocation', d: 'See it go red, then move money from another allocation.', b: 'Try it', off: !treatB,
        go: function () { var s = L.status(st, treatB, now), pt = s.pots.filter(function (x) { return x.id === 'treats'; })[0]; A.add({ kind: 'out', amount: Math.max(500, Math.ceil(((pt && pt.left) || 0) / 500) * 500 + 500), cat: 'treats', step: 'details' }); } },
      { t: 'Get the daily reminder', d: 'Only shows on days you haven’t logged.', b: 'Show it', off: !has, go: A.notify },
      { t: 'Start a new week', d: 'What’s left is added to your total left over and a review appears.', b: 'Jump ahead', off: !has, go: A.nextWeek },
      { t: 'Act on an insight', d: 'Apply or skip a suggestion.', b: 'Open', off: !reviewB, go: function () { A.tab('insights'); } }
    ];

    return html`<aside class="guide" aria-label="Things to try">
      <div style=${{ display: 'flex', alignItems: 'center', gap: '10px' }}><${Logo} size=${32} /><h1>Budge prototype</h1></div>
      <p class="t-s muted">A working first version. Everything you do is ${p.mode === 'db' ? 'saved to your account' : 'saved on this device'}.</p>
      <div class="g-list">${items.map(function (it) {
        return html`<div class="g-item"><div class="g-text"><b>${it.t}</b><span>${it.d}</span></div>
          <button class=${cx('g-btn', it.danger && 'danger')} disabled=${!!it.off} onClick=${it.go}>${it.b}</button></div>`;
      })}</div>
      <div class="g-date"><${Icon} n="calendar" size=${16} />App date: ${L.shortDate(today)}${st.offset ? ' (moved ' + st.offset + ' day' + (st.offset > 1 ? 's' : '') + ' ahead)' : ''}</div>
    </aside>`;
  }

  // ================= app =================
  function App() {
    var boot = useRef(null);
    if (!boot.current) { var loc = Persist.loadLocal(); boot.current = { state: loc || L.blankState(), had: !!loc }; }
    var sSt = useState(boot.current.state), st = sSt[0], setSt = sSt[1];
    var ref = useRef(st);
    var sReady = useState(boot.current.had), ready = sReady[0], setReady = sReady[1];
    var sMode = useState('local'), mode = sMode[0], setMode = sMode[1];
    var sNav = useState({ tab: 'home' }), nav = sNav[0], setNav = sNav[1];
    var sLayer = useState(null), layer = sLayer[0], setLayer = sLayer[1];
    var sToast = useState(null), toast = sToast[0], setToast = sToast[1];
    var sNotif = useState(false), notif = sNotif[0], setNotif = sNotif[1];
    var sTick = useState(0), setTick = sTick[1];
    var sView = useState({ unit: null, offset: 0 }), view = sView[0], setView = sView[1];
    var sIdx = useState(null), rIdx = sIdx[0], setIdx = sIdx[1];
    var now = Date.now() + (st.offset || 0) * DAY;
    L.setCustom(st.customCats, st.catNames);
    SFX.enabled = st.sound !== false;
    var budget = L.mainBudget(st);
    var desk = useDesk();

    function commit(fn) { var s = clone(ref.current); fn(s); s.updatedAt = Date.now(); ref.current = s; setSt(s); Persist.schedule(s); }
    function replace(s) { s.updatedAt = Date.now(); ref.current = s; setSt(s); Persist.schedule(s); }
    function scrollTop() { var sc = document.querySelector('.screen'); if (sc) sc.scrollTop = 0; }

    useEffect(function () {
      Persist.onMode = setMode;
      var t = setTimeout(function () { setReady(true); }, 1800);
      Persist.init(function (remote) {
        if (remote && (remote.updatedAt || 0) > (ref.current.updatedAt || 0)) { ref.current = remote; setSt(remote); Persist.saveLocal(remote); }
        else if (ref.current.updatedAt) Persist.schedule(ref.current);
      }).then(function () { setReady(true); });
      var iv = setInterval(function () { setTick(function (x) { return x + 1; }); }, 30000);
      return function () { clearTimeout(t); clearInterval(iv); };
    }, []);
    // Badges: celebrate new ones (quietly record them for sample data and first run).
    useEffect(function () {
      if (!ready || !budget) return;
      var earned = st.earned || {}, fresh = L.badges(st, now).filter(function (x) { return x.got && !earned[x.id]; });
      if (!fresh.length) return;
      var quiet = !st.earned || st.sample;
      commit(function (x) { x.earned = Object.assign({}, x.earned || {}); fresh.forEach(function (f) { x.earned[f.id] = L.dkey(now); }); });
      if (!quiet) { setTimeout(function () { SFX.play('chime'); A.say('New badge: ' + fresh[0].name); }, 700); fresh.forEach(function (f) { stat('badge-' + f.id, true); }); }
    });
    // The number on the app icon: 1 when nothing is logged today (installed app only).
    useEffect(function () {
      if (!PWA || !('setAppBadge' in navigator)) return;
      var due = budget && st.reminder && st.reminder.on && !L.loggedOn(st, L.dkey(now));
      try { (due ? navigator.setAppBadge(1) : navigator.clearAppBadge()).catch(function () { }); } catch (e) { }
    });
    // Opened from a notification or the home-screen shortcut: go straight to logging.
    useEffect(function () {
      if (!ready || !budget || !/[?&]add=1/.test(location.search)) return;
      try { history.replaceState(null, '', location.pathname); } catch (e) { }
      A.add();
    }, [ready]);
    // Tell the reminder server about the reminder time, on/off, and the last day something was logged.
    var pushKey = Push.on() ? [st.reminder.on, st.reminder.time, st.entries.length, (st.checkins || []).length, L.dkey(now)].join('|') : '';
    useEffect(function () {
      if (!ready || !Push.on()) return;
      if (!Push.joined() && typeof Notification !== 'undefined' && Notification.permission === 'granted') { Push.join(ref.current).catch(function () { }); return; }
      var t = setTimeout(function () { Push.sync(ref.current); }, 1500);
      return function () { clearTimeout(t); };
    }, [pushKey, ready]);
    // Keyboard (desktop): N logs a purchase, Esc closes what's open.
    useEffect(function () {
      function k(e) {
        var tag = (e.target && e.target.tagName) || '';
        if (e.key === 'Escape' && layer) { e.preventDefault(); A.close(); return; }
        if (/INPUT|TEXTAREA|SELECT/.test(tag) || e.metaKey || e.ctrlKey || e.altKey) return;
        if ((e.key === 'n' || e.key === 'N') && !layer && budget && L.phaseOf(budget, L.dkey(now)) === 'live') { e.preventDefault(); A.add(); }
      }
      window.addEventListener('keydown', k);
      return function () { window.removeEventListener('keydown', k); };
    });
    // A new version was installed in the background: fetch its notes and ask to refresh.
    var sUpd = useState(null), upd = sUpd[0], setUpd = sUpd[1];
    useEffect(function () {
      function h() {
        fetch('version.json?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.json(); })
          .then(function (v) { setUpd(v && v.version ? v : { notes: [] }); }, function () { setUpd({ notes: [] }); });
      }
      window.addEventListener('budge-update', h); return function () { window.removeEventListener('budge-update', h); };
    }, []);
    useEffect(function () { if (L.anyRollover(st, now)) { var gained = 0; commit(function (x) { L.rolloverAll(x, now).forEach(function (h) { gained += h.saved || 0; }); }); if (gained > 0) SFX.play('chime'); } });
    // Big numbers shrink to fit their box (very large budgets would otherwise run into the gauge).
    useEffect(function () {
      function fitAll() {
        document.querySelectorAll('.fit').forEach(function (el) {
          el.style.fontSize = '';
          var size = parseFloat(getComputedStyle(el).fontSize), guard = 0;
          while (el.scrollWidth > el.clientWidth + 1 && size > 14 && guard++ < 40) { size -= 1; el.style.fontSize = size + 'px'; }
        });
      }
      fitAll();
      var t = setTimeout(fitAll, 120);
      try { if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll); } catch (e) { }
      window.addEventListener('resize', fitAll);
      return function () { clearTimeout(t); window.removeEventListener('resize', fitAll); };
    });
    useEffect(function () { if (!toast) return; var t = setTimeout(function () { setToast(null); }, toast.undo ? 5000 : 2200); return function () { clearTimeout(t); }; }, [toast]);
    useEffect(function () { if (!notif) return; var t = setTimeout(function () { setNotif(false); }, 7000); return function () { clearTimeout(t); }; }, [notif]);

    function markReview(bid) {
      var b = L.findBudget(ref.current, bid), l = b && lastReview(b);
      if (l && (b.reviewSeen !== l.start || b.bannerSeen !== l.start)) commit(function (x) { var bb = L.findBudget(x, bid); bb.reviewSeen = l.start; bb.bannerSeen = l.start; });
    }
    var A = {
      commit: commit, replace: replace,
      commitB: function (bid, fn) { commit(function (x) { var b = L.findBudget(x, bid); if (b) fn(b, x); }); },
      say: function (m, undo) { setToast({ m: m, k: Date.now(), undo: undo }); },
      sfx: function (n) { SFX.play(n); },
      home: function () { setLayer(null); setNav({ tab: 'home' }); setView({ unit: null, offset: 0 }); setIdx(null); scrollTop(); },
      tab: function (t) {
        SFX.play('tap'); setLayer(null); setNav({ tab: t }); stat(t);
        if (t === 'insights' && budget) { setIdx(null); markReview(budget.id); }
        if (t === 'history') setView({ unit: null, offset: 0 });
        scrollTop();
      },
      open: function (l) { setLayer(Object.assign({ prev: layer }, l)); },
      close: function () { setLayer(null); },
      back: function () { setLayer(layer && layer.prev ? layer.prev : null); },
      cover: function (bid, id, keep) { setLayer({ type: 'cover', bid: bid, id: id, prev: keep ? layer : null }); },
      add: function (preset) { setNotif(false); setLayer({ type: 'add', preset: Object.assign({ bid: budget ? budget.id : undefined }, preset || {}), k: Date.now() }); },
      create: function () { setNotif(false); setLayer({ type: 'create', k: Date.now() }); },
      notify: function () { setLayer(null); setNotif(true); },
      jump: function (d) { commit(function (x) { x.offset = (x.offset || 0) + d; }); A.say('Moved ahead ' + d + ' day'); },
      nextWeek: function () {
        var today = L.dkey(now), d = L.diffDays(today, L.addDays(L.weekStart(today), 7));
        commit(function (x) { x.offset = (x.offset || 0) + d; }); setLayer(null);
        A.say('It’s ' + L.shortDate(L.addDays(today, d)) + ' now');
      },
      loadSample: function () { replace(L.sampleState(Date.now())); A.home(); A.say('Sample week loaded'); stat('sample-loaded', true); },
      startOver: function () { replace(L.blankState()); A.home(); }
    };

    var body;
    if (!ready) body = html`<div class="splash"><${Logo} size=${64} /></div>`;
    else {
      var screen, tabbar = null;
      if (!budget) screen = html`<${Onboarding} A=${A} />`;
      else {
        var t = nav.tab;
        screen = t === 'home' ? html`<${BudgetHome} st=${st} b=${budget} now=${now} A=${A} />`
          : t === 'history' ? html`<${History} st=${st} b=${budget} now=${now} A=${A} view=${view} setView=${setView} />`
          : t === 'insights' ? html`<${Insights} st=${st} b=${budget} now=${now} A=${A} idx=${rIdx} setIdx=${setIdx} />`
          : html`<${BudgetSettings} key=${budget.id} st=${st} b=${budget} now=${now} A=${A} mode=${mode} />`;
        var live = L.phaseOf(budget, L.dkey(now)) === 'live', unseen = reviewUnseen(budget);
        var tabs = [['home', 'house', 'Home'], ['history', 'list', 'History'], ['insights', 'bulb', 'Insights'], ['settings', 'gear', 'Settings'], ['add']];
        tabbar = html`<nav class="tabbar" aria-label=${budget.name}>
          ${tabs.map(function (x) {
            if (x[0] === 'add') return live ? html`<button class="tab-add" aria-label="Add spending" onClick=${function () { A.add(); }}><${Icon} n="plus" size=${22} /></button>` : null;
            var on = t === x[0];
            return html`<button class=${cx('tab', on && 'on')} aria-label=${x[2]} aria-current=${on ? 'page' : null} onClick=${function () { A.tab(x[0]); }}>
              <${Icon} n=${x[1] + (on && ICONS.ui[x[1] + '-f'] ? '-f' : '')} size=${22} />${x[0] === 'insights' && unseen && !on ? html`<span class="dot"></span>` : null}</button>`;
          })}
        </nav>`;
      }
      var lay = null;
      if (layer) {
        var lb = layer.bid ? L.findBudget(st, layer.bid) : budget;
        if (layer.type === 'add') lay = html`<${AddFlow} key=${layer.k} st=${st} now=${now} A=${A} preset=${layer.preset} />`;
        else if (layer.type === 'create') lay = html`<${CreateBudget} key=${layer.k} st=${st} now=${now} A=${A} preset=${layer.preset} />`;
        else if (layer.type === 'feedback') lay = html`<${FeedbackLayer} st=${st} A=${A} />`;
        else if (layer.type === 'edit') lay = html`<${EditEntry} key=${layer.id} st=${st} now=${now} A=${A} id=${layer.id} />`;
        else if (lb && layer.type === 'cat') lay = html`<${CategoryDetail} key=${layer.id} st=${st} b=${lb} now=${now} A=${A} id=${layer.id} unit=${layer.unit} offset=${layer.offset} />`;
        else if (lb && layer.type === 'list') lay = html`<${PurchaseList} st=${st} b=${lb} now=${now} A=${A} unit=${layer.unit} offset=${layer.offset} />`;
        else if (lb && layer.type === 'cover') lay = html`<${CoverLayer} key=${layer.id} st=${st} b=${lb} now=${now} A=${A} id=${layer.id} />`;
        else if (lb && layer.type === 'split') lay = html`<${SplitLayer} st=${st} b=${lb} A=${A} />`;
      }
      var side = desk && budget ? html`<${SideNav} tab=${nav.tab} A=${A} st=${st} now=${now} live=${live} unseen=${unseen} />` : null;
      body = html`${side}<main class=${cx('screen', !budget && 'screen-onboard', 'tab-' + (budget ? nav.tab : 'onboard'))} key=${budget ? nav.tab : 'onboard'}>${screen}</main>
        ${desk ? null : tabbar}
        ${lay && (desk ? html`<div class="modal-wrap"><div class="scrim" onClick=${A.close}></div>${lay}</div>` : lay)}`;
    }
    var streakN = L.streak(st, now);
    return html`<div class=${cx('stage', desk && 'desk')}>
      <div class="app">
        ${body}
        ${notif && st.budgets.length > 0 && html`<button class="notif" onClick=${function () { A.add(); }}>
          <${Logo} size=${38} />
          <div style=${{ flex: 1, minWidth: 0 }}><div class="n-top"><span>Budge</span><span>now</span></div>
            <b>Anything to log today?</b><span>${streakN > 0 ? 'Tap to add it and keep your ' + streakN + '-day streak.' : 'Tap to add what you spent.'}</span></div>
        </button>`}
        ${toast && html`<div class=${cx('toast', toast.undo && 'toast-undo')} key=${toast.k} role="status"><span>${toast.m}</span>
          ${toast.undo && html`<button class="toast-act" onClick=${function () { toast.undo(); setToast(null); }}>Undo</button>`}</div>`}
        ${upd && html`<div class="update-card" role="dialog" aria-label="Update available">
          <div class="update-top"><${Logo} size=${36} /><div class="grow"><div class="t-label">Budge has been updated</div>
            ${upd.version && html`<div class="t-cap muted">Version ${upd.version}</div>`}</div></div>
          ${upd.notes && upd.notes.length > 0 && html`<ul class="update-notes">${upd.notes.slice(0, 3).map(function (n) { return html`<li>${n}</li>`; })}</ul>`}
          <div class="btn-row"><button class="btn btn-outline btn-sm" onClick=${function () { setUpd(null); }}>Later</button>
            <button class="btn btn-primary btn-sm" onClick=${function () { location.reload(); }}>Refresh</button></div>
        </div>`}
      </div>
      ${!PWA && !desk && html`<${Guide} st=${st} now=${now} A=${A} mode=${mode} />`}
      ${desk && html`<${QrCard} />`}
    </div>`;
  }

  render(html`<${App} />`, document.getElementById('root'));
})();
