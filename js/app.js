/* FreshWeek — общая логика: шапка, корзина, заказ и страницы */
(function () {
  'use strict';
  var FW = window.FW;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var money = function (n) { return new Intl.NumberFormat('ru-RU').format(n) + ' ₽'; };
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var iso = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  var fmtDate = function (s) {
    var p = s.split('-').map(Number);
    return new Date(p[0], p[1] - 1, p[2]).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  };
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* нет доступа к хранилищу */ } }
  };
  var rationById = function (id) { return FW.RATIONS.filter(function (r) { return r.id === id; })[0]; };
  var allergenLabel = function (id) { return FW.ALLERGENS.filter(function (a) { return a.id === id; })[0].label; };
  var mealsWord = function (n) { return n + ' ' + (n < 5 ? 'приёма' : 'приёмов') + ' пищи'; };

  function tomorrowISO() { var d = new Date(); d.setDate(d.getDate() + 1); return iso(d); }
  function defaultDate() {
    var d = new Date();
    var add = (8 - d.getDay()) % 7;
    if (add === 0) add = 7;
    d.setDate(d.getDate() + add);
    return iso(d);
  }

  var ICON = {
    loss: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7l6 6 4-4 8 8"/><path d="M15 17h6v-6"/></svg>',
    mass: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/></svg>',
    vegan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19c0-8 5-14 15-14 0 9-5 14-13 14"/><path d="M5 19l9-9"/></svg>'
  };

  /* ---------- оболочка: шапка, подвал, корзина, заказ ---------- */
  var page = document.body.getAttribute('data-page');

  function mountShell() {
    document.documentElement.classList.add('js');
    document.body.insertAdjacentHTML('afterbegin',
      '<header class="site-header" id="siteHeader"><div class="container header-inner">' +
      '<a class="logo" href="index.html"><img src="img/logo.svg" alt="" width="32" height="32"><span>FreshWeek</span></a>' +
      '<nav class="nav" id="nav" aria-label="Основная навигация">' +
      '<a href="menu.html"' + (page === 'menu' || page === 'product' ? ' class="active"' : '') + '>Меню</a>' +
      '<a href="index.html#how">Как это работает</a>' +
      '<a href="index.html#delivery">Доставка и оплата</a>' +
      '<a href="index.html#contacts">Контакты</a></nav>' +
      '<button class="cart-btn" id="cartBtn" type="button">Корзина (<span id="cartCount">0</span>)</button>' +
      '<button class="burger" id="burger" type="button" aria-label="Открыть меню" aria-expanded="false"><span></span></button>' +
      '</div></header>');

    document.body.insertAdjacentHTML('beforeend',
      '<footer class="site-footer"><div class="container footer-inner">' +
      '<a class="logo" href="index.html"><img src="img/logo.svg" alt="" width="32" height="32"><span>FreshWeek</span></a>' +
      '<div class="footer-links"><a href="menu.html">Меню</a><a href="index.html#how">Как это работает</a>' +
      '<a href="index.html#delivery">Доставка и оплата</a><a href="index.html#contacts">Контакты</a></div>' +
      '<p class="copy">© ' + new Date().getFullYear() + ' FreshWeek. Все права защищены. Рационы не заменяют консультацию врача.</p>' +
      '</div></footer>' +

      '<div class="overlay" id="overlay"></div>' +
      '<aside class="drawer" id="drawer" aria-label="Корзина" aria-hidden="true">' +
      '<div class="drawer-head"><h2>Корзина</h2><button class="icon-btn" type="button" data-close aria-label="Закрыть">×</button></div>' +
      '<div class="drawer-body" id="cartList"></div><div class="drawer-foot" id="cartFoot"></div></aside>' +

      '<div class="modal" id="checkout" role="dialog" aria-modal="true" aria-labelledby="coTitle"><div class="modal-bg" data-close-modal></div>' +
      '<div class="modal-box"><button class="icon-btn modal-close" type="button" data-close-modal aria-label="Закрыть">×</button>' +
      '<div id="coFormWrap"><h2 id="coTitle">Оформление заказа</h2><div class="co-summary" id="coSummary"></div>' +
      '<form id="coForm" novalidate>' +
      '<div class="field"><label for="coName">Имя</label><input class="input" id="coName" autocomplete="name" placeholder="Как к вам обращаться"><span class="field-error" data-for="coName">Введите имя</span></div>' +
      '<div class="field"><label for="coPhone">Телефон</label><input class="input" id="coPhone" type="tel" autocomplete="tel" placeholder="+7 900 000-00-00"><span class="field-error" data-for="coPhone">Введите телефон полностью</span></div>' +
      '<div class="field"><label for="coAddr">Адрес доставки</label><input class="input" id="coAddr" autocomplete="street-address" placeholder="Город, улица, дом, квартира"><span class="field-error" data-for="coAddr">Укажите адрес</span></div>' +
      '<div class="field"><label for="coTime">Удобное время</label><select class="select" id="coTime"><option>10:00–14:00</option><option>14:00–18:00</option><option selected>18:00–22:00</option></select></div>' +
      '<div class="field"><span class="lbl">Оплата</span><div class="radio-row">' +
      '<label><input type="radio" name="pay" value="Картой онлайн" checked><span>Картой онлайн</span></label>' +
      '<label><input type="radio" name="pay" value="При получении"><span>При получении</span></label></div></div>' +
      '<div class="field"><label for="coNote">Комментарий</label><textarea class="input" id="coNote" placeholder="Домофон, этаж, пожелания курьеру"></textarea></div>' +
      '<button class="btn btn-primary btn-block" type="submit">Подтвердить заказ</button></form></div>' +
      '<div class="done" id="coDone" hidden><div class="big">✓</div><h2>Заказ принят</h2><p id="coDoneText"></p>' +
      '<button class="btn btn-green" type="button" data-close-modal>Отлично</button></div></div></div>' +
      '<div class="toast" id="toast" role="status" aria-live="polite"></div>');

    $('#burger').addEventListener('click', function () {
      var open = $('#nav').classList.toggle('open');
      this.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    $$('#nav a').forEach(function (a) { a.addEventListener('click', function () { $('#nav').classList.remove('open'); }); });
  }

  var toastTimer;
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }

  var lock = function () { document.body.classList.add('no-scroll'); };
  var unlock = function () { document.body.classList.remove('no-scroll'); };

  /* ---------- корзина ---------- */
  var cart = store.get('fw_cart', []).filter(function (c) { return rationById(c.id); });

  function saveCart() { store.set('fw_cart', cart); renderCart(); }

  function addToCart(item) {
    var key = [item.id, item.days, item.date, item.exclude.slice().sort().join(',')].join('|');
    var found = cart.filter(function (c) { return c.key === key; })[0];
    if (found) found.qty += 1;
    else cart.push({ key: key, id: item.id, days: item.days, date: item.date, exclude: item.exclude.slice(), qty: 1 });
    saveCart();
  }

  function cartTotals() {
    var sub = cart.reduce(function (s, c) { return s + FW.priceFor(rationById(c.id), c.days) * c.qty; }, 0);
    var fee = sub === 0 || sub >= FW.FREE_DELIVERY_FROM ? 0 : FW.DELIVERY_FEE;
    return { sub: sub, fee: fee, total: sub + fee };
  }

  function renderCart() {
    $('#cartCount').textContent = cart.reduce(function (s, c) { return s + c.qty; }, 0);
    var list = $('#cartList');
    var foot = $('#cartFoot');
    if (!cart.length) {
      list.innerHTML = '<div class="empty"><p>Корзина пока пуста</p><a class="btn btn-primary btn-sm" href="menu.html">Выбрать рацион</a></div>';
      foot.innerHTML = '';
      return;
    }
    list.innerHTML = cart.map(function (c) {
      var r = rationById(c.id);
      var ex = c.exclude.length ? ' · без: ' + c.exclude.map(function (a) { return allergenLabel(a).toLowerCase(); }).join(', ') : '';
      return '<div class="cart-item" data-key="' + esc(c.key) + '">' +
        '<img src="img/dishes/' + r.cover + '.svg" alt="">' +
        '<div><h4>' + esc(r.name) + ' · ' + r.kcal + ' ккал</h4>' +
        '<p class="muted small">' + c.days + ' дней · с ' + fmtDate(c.date) + esc(ex) + '</p>' +
        '<div class="qty"><button type="button" data-act="dec" aria-label="Меньше">−</button><span>' + c.qty +
        '</span><button type="button" data-act="inc" aria-label="Больше">+</button>' +
        '<button type="button" class="link" data-act="rm">Удалить</button></div></div>' +
        '<div class="cart-price">' + money(FW.priceFor(r, c.days) * c.qty) + '</div></div>';
    }).join('');
    var t = cartTotals();
    foot.innerHTML =
      '<div class="sum-row"><span>Рационы</span><span>' + money(t.sub) + '</span></div>' +
      '<div class="sum-row"><span>Доставка</span><span>' + (t.fee ? money(t.fee) : 'бесплатно') + '</span></div>' +
      (t.fee ? '<p class="muted small">Бесплатная доставка от ' + money(FW.FREE_DELIVERY_FROM) + '</p>' : '') +
      '<div class="sum-row total"><span>Итого</span><span>' + money(t.total) + '</span></div>' +
      '<button class="btn btn-primary btn-block" type="button" id="checkoutBtn">Оформить заказ</button>';
  }

  function openCart() {
    $('#drawer').classList.add('open');
    $('#drawer').setAttribute('aria-hidden', 'false');
    $('#overlay').classList.add('show');
    lock();
  }
  function closeCart() {
    $('#drawer').classList.remove('open');
    $('#drawer').setAttribute('aria-hidden', 'true');
    $('#overlay').classList.remove('show');
    unlock();
  }

  function bindCart() {
    $('#cartBtn').addEventListener('click', openCart);
    $('#overlay').addEventListener('click', closeCart);
    $('#drawer').addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) return closeCart();
      if (e.target.closest('#checkoutBtn')) return openCheckout();
      var btn = e.target.closest('[data-act]');
      if (!btn) return;
      var key = btn.closest('.cart-item').getAttribute('data-key');
      var idx = cart.map(function (c) { return c.key; }).indexOf(key);
      if (idx < 0) return;
      var act = btn.getAttribute('data-act');
      if (act === 'inc') cart[idx].qty += 1;
      if (act === 'dec') cart[idx].qty -= 1;
      if (act === 'rm' || cart[idx].qty <= 0) cart.splice(idx, 1);
      saveCart();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      closeCart();
      closeCheckout();
    });
  }

  /* ---------- оформление заказа (демо: данные сохраняются только в браузере) ---------- */
  function openCheckout() {
    if (!cart.length) return;
    closeCart();
    var t = cartTotals();
    $('#coSummary').innerHTML = '<span>' + cart.reduce(function (s, c) { return s + c.qty; }, 0) + ' шт. в заказе</span><strong>' + money(t.total) + '</strong>';
    $('#coFormWrap').hidden = false;
    $('#coDone').hidden = true;
    $('#checkout').classList.add('open');
    lock();
    setTimeout(function () { $('#coName').focus(); }, 50);
  }
  function closeCheckout() {
    var m = $('#checkout');
    if (!m.classList.contains('open')) return;
    m.classList.remove('open');
    unlock();
  }

  function setInvalid(id, bad) {
    $('#' + id).classList.toggle('invalid', bad);
    $('.field-error[data-for="' + id + '"]').classList.toggle('show', bad);
  }

  function bindCheckout() {
    $$('[data-close-modal]').forEach(function (el) { el.addEventListener('click', closeCheckout); });
    $('#coForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('#coName').value.trim();
      var phone = $('#coPhone').value.replace(/\D/g, '');
      var addr = $('#coAddr').value.trim();
      var badName = name.length < 2;
      var badPhone = phone.length < 10;
      var badAddr = addr.length < 5;
      setInvalid('coName', badName);
      setInvalid('coPhone', badPhone);
      setInvalid('coAddr', badAddr);
      if (badName || badPhone || badAddr) return;
      var t = cartTotals();
      var number = 'FW-' + String(Math.floor(10000 + Math.random() * 90000));
      var orders = store.get('fw_orders', []);
      orders.push({
        number: number, created: new Date().toISOString(), name: name, phone: $('#coPhone').value, address: addr,
        time: $('#coTime').value, pay: $('input[name="pay"]:checked').value, note: $('#coNote').value,
        items: cart, total: t.total
      });
      store.set('fw_orders', orders);
      cart = [];
      saveCart();
      $('#coDoneText').textContent = 'Номер заказа ' + number + '. ' + name + ', мы свяжемся с вами по телефону для подтверждения.';
      $('#coFormWrap').hidden = true;
      $('#coDone').hidden = false;
      $('#coForm').reset();
    });
  }

  /* ---------- карточка рациона для списков ---------- */
  function rationCard(r, days) {
    var m = FW.avg(r);
    return '<article class="card ration" data-id="' + r.id + '">' +
      '<a class="card-img" href="product.html?id=' + r.id + '&days=' + days + '"><img src="img/dishes/' + r.cover + '.svg" alt="' + esc(r.name) + '" loading="lazy">' +
      '<span class="tag tag-' + r.category + '">' + FW.CATEGORIES[r.category].label + '</span></a>' +
      '<div class="card-body"><h3>' + esc(r.name) + '</h3>' +
      '<p class="muted small">' + r.kcal + ' ккал в день · ' + mealsWord(r.meals) + '</p>' +
      '<p class="macros">Б ' + m.p + ' · Ж ' + m.f + ' · У ' + m.c + '</p>' +
      '<div class="card-foot"><div><div class="price">' + money(FW.priceFor(r, days)) + '</div><div class="muted small">за ' + days + ' дней</div></div>' +
      '<div class="card-actions"><button class="round-btn" type="button" data-add="' + r.id + '" aria-label="В корзину">+</button>' +
      '<a class="btn btn-primary btn-sm" href="product.html?id=' + r.id + '&days=' + days + '">Подробнее</a></div></div></div></article>';
  }

  function bindQuickAdd(container, getDays) {
    container.addEventListener('click', function (e) {
      var b = e.target.closest('[data-add]');
      if (!b) return;
      var r = rationById(b.getAttribute('data-add'));
      addToCart({ id: r.id, days: getDays(), date: defaultDate(), exclude: [] });
      toast('«' + r.name + '» добавлен в корзину');
    });
  }

  /* ---------- главная ---------- */
  function initHome() {
    var pop = FW.RATIONS.slice().sort(function (a, b) { return a.popular - b.popular; }).slice(0, 3);
    var box = $('#popular');
    box.innerHTML = pop.map(function (r) { return rationCard(r, 7); }).join('');
    bindQuickAdd(box, function () { return 7; });

    var REVIEWS = [
      { n: 'Анна', t: 'Минус 4 кг за месяц', c: '#2E7D4F', x: 'Раньше постоянно срывалась на перекусах, а теперь всё посчитано и привезено. Порции небольшие, но наедаюсь.' },
      { n: 'Игорь', t: 'Набор массы', c: '#C06A1F', x: 'Тренируюсь четыре раза в неделю, готовить на 2800 ккал сам просто нет времени. Рацион закрыл эту проблему.' },
      { n: 'Мария', t: 'Веганское меню', c: '#4C8A2B', x: 'Боялась, что будет скучно, но блюда разные: чечевица, фалафель, рагу. Люблю тыквенный суп.' },
      { n: 'Денис', t: 'Рацион «Баланс»', c: '#2F5D8C', x: 'Удобно, что можно исключить аллергены и выбрать дату первой доставки. Заказываю уже не первую неделю.' },
      { n: 'Ольга', t: 'Рацион «Лёгкий старт»', c: '#8C3F6B', x: 'Для старта то, что нужно: без стресса и подсчётов. Через две недели стало проще держать режим.' },
      { n: 'Павел', t: 'Рацион «Сушка Плюс»', c: '#B5562B', x: 'Пять приёмов пищи — ем по расписанию и не думаю о том, что приготовить. Белка хватает.' }
    ];
    var rv = $('#reviews');
    rv.innerHTML = REVIEWS.map(function (r) {
      return '<article class="review"><div class="review-head"><div class="avatar" style="background:' + r.c + '">' + r.n[0] + '</div>' +
        '<div><h4>' + r.n + ', ' + r.t.toLowerCase() + '</h4><div class="stars" aria-label="5 из 5">★★★★★</div></div></div><p>' + r.x + '</p></article>';
    }).join('');
    $$('[data-slide]').forEach(function (b) {
      b.addEventListener('click', function () {
        var step = rv.firstElementChild.getBoundingClientRect().width + 40;
        rv.scrollBy({ left: step * Number(b.getAttribute('data-slide')), behavior: 'smooth' });
      });
    });

    initCalc();
    initContactForm();
  }

  /* калькулятор калорий (формула Миффлина — Сан-Жеора) */
  function initCalc() {
    var form = $('#calc');
    var out = $('#calcResult');
    var err = $('#calcError');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var sex = $('#cSex').value;
      var age = Number($('#cAge').value);
      var h = Number($('#cHeight').value);
      var w = Number($('#cWeight').value);
      var act = Number($('#cAct').value);
      var goal = $('#cGoal').value;
      var bad = !(age >= 16 && age <= 90) || !(h >= 120 && h <= 230) || !(w >= 35 && w <= 250);
      err.classList.toggle('show', bad);
      if (bad) {
        err.textContent = 'Проверьте данные: возраст 16–90 лет, рост 120–230 см, вес 35–250 кг.';
        out.classList.remove('show');
        return;
      }
      var bmr = 10 * w + 6.25 * h - 5 * age + (sex === 'm' ? 5 : -161);
      var tdee = Math.round(bmr * act);
      var factor = goal === 'loss' ? 0.85 : goal === 'mass' ? 1.12 : 1;
      var target = Math.round(tdee * factor / 10) * 10;
      var list = FW.RATIONS.filter(function (r) { return r.category === goal; });
      var best = list.reduce(function (a, b) { return Math.abs(b.kcal - target) < Math.abs(a.kcal - target) ? b : a; });
      var goalName = goal === 'loss' ? 'снижения веса' : goal === 'mass' ? 'набора массы' : 'поддержания веса на веганском меню';
      out.innerHTML = '<p class="res-title">Ваша суточная норма — около ' + tdee + ' ккал</p>' +
        '<p class="muted">Для ' + goalName + ' ориентир — примерно ' + target + ' ккал в день. Ближе всего этот рацион:</p>' +
        '<div class="grid-cards">' + rationCard(best, 7) + '</div>' +
        '<p class="note">Расчёт ориентировочный и не заменяет консультацию врача или диетолога.</p>';
      out.classList.add('show');
      bindQuickAdd(out, function () { return 7; });
    });
  }

  function initContactForm() {
    var f = $('#contactForm');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('#ctName').value.trim();
      var phone = $('#ctPhone').value.replace(/\D/g, '');
      setInvalid('ctName', name.length < 2);
      setInvalid('ctPhone', phone.length < 10);
      if (name.length < 2 || phone.length < 10) return;
      var leads = store.get('fw_leads', []);
      leads.push({ name: name, phone: $('#ctPhone').value, created: new Date().toISOString() });
      store.set('fw_leads', leads);
      f.reset();
      toast('Спасибо, ' + name + '! Мы перезвоним в ближайшее время.');
    });
  }

  /* ---------- меню ---------- */
  function initMenu() {
    var p = new URLSearchParams(location.search);
    var st = {
      goal: ['loss', 'mass', 'vegan'].indexOf(p.get('goal')) >= 0 ? p.get('goal') : 'all',
      kcal: Number(p.get('kcal')) || null,
      days: p.get('days') === '5' ? 5 : 7,
      sort: p.get('sort') || 'popular'
    };
    var grid = $('#grid');

    function apply() {
      var list = FW.RATIONS.filter(function (r) {
        return (st.goal === 'all' || r.category === st.goal) && (!st.kcal || r.kcal === st.kcal);
      });
      var sorters = {
        popular: function (a, b) { return a.popular - b.popular; },
        'price-asc': function (a, b) { return a.price - b.price; },
        'price-desc': function (a, b) { return b.price - a.price; },
        'kcal-asc': function (a, b) { return a.kcal - b.kcal; },
        'kcal-desc': function (a, b) { return b.kcal - a.kcal; }
      };
      list.sort(sorters[st.sort] || sorters.popular);
      grid.innerHTML = list.length ? list.map(function (r) { return rationCard(r, st.days); }).join('') :
        '<div class="empty-state"><h3>Ничего не найдено</h3><p class="muted">Для выбранной цели нет рациона с такой калорийностью.</p>' +
        '<button class="btn btn-green btn-sm" type="button" id="resetEmpty">Сбросить фильтры</button></div>';
      $('#count').textContent = list.length ? 'Найдено рационов: ' + list.length : 'Рационов не найдено';
      $$('#goalChips .chip').forEach(function (c) { c.classList.toggle('active', c.getAttribute('data-goal') === st.goal); });
      $$('#kcalChips .chip').forEach(function (c) { c.classList.toggle('active', Number(c.getAttribute('data-kcal')) === st.kcal); });
      $$('#daysSeg button').forEach(function (b) { b.classList.toggle('active', Number(b.getAttribute('data-days')) === st.days); });
      $('#sort').value = st.sort;
      var q = new URLSearchParams();
      if (st.goal !== 'all') q.set('goal', st.goal);
      if (st.kcal) q.set('kcal', st.kcal);
      if (st.days !== 7) q.set('days', st.days);
      if (st.sort !== 'popular') q.set('sort', st.sort);
      try { history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : '')); } catch (e) { /* file:// */ }
    }

    function reset() { st.goal = 'all'; st.kcal = null; st.sort = 'popular'; apply(); }

    $('#goalChips').addEventListener('click', function (e) {
      var b = e.target.closest('[data-goal]');
      if (b) { st.goal = b.getAttribute('data-goal'); apply(); }
    });
    $('#kcalChips').addEventListener('click', function (e) {
      var b = e.target.closest('[data-kcal]');
      if (!b) return;
      var v = Number(b.getAttribute('data-kcal'));
      st.kcal = st.kcal === v ? null : v;
      apply();
    });
    $('#daysSeg').addEventListener('click', function (e) {
      var b = e.target.closest('[data-days]');
      if (b) { st.days = Number(b.getAttribute('data-days')); apply(); }
    });
    $('#sort').addEventListener('change', function () { st.sort = this.value; apply(); });
    $('#reset').addEventListener('click', reset);
    grid.addEventListener('click', function (e) { if (e.target.id === 'resetEmpty') reset(); });
    bindQuickAdd(grid, function () { return st.days; });
    apply();
  }

  /* ---------- карточка рациона ---------- */
  function initProduct() {
    var root = $('#product');
    var p = new URLSearchParams(location.search);
    var r = rationById(p.get('id'));
    if (!r) {
      document.title = 'Рацион не найден — FreshWeek';
      root.innerHTML = '<div class="notfound"><h1>Рацион не найден</h1><p class="muted">Возможно, ссылка устарела.</p><a class="btn btn-primary" style="margin-top:24px" href="menu.html">Перейти в меню</a></div>';
      return;
    }
    document.title = 'Рацион «' + r.name + '» ' + r.kcal + ' ккал — FreshWeek';
    var cat = FW.CATEGORIES[r.category];
    var st = { days: p.get('days') === '5' ? 5 : 7, date: defaultDate(), exclude: [], day: 0, img: r.cover };
    var favs = function () { return store.get('fw_fav', []); };

    var related = FW.RATIONS.filter(function (x) { return x.id !== r.id; })
      .sort(function (a, b) { return (a.category === r.category ? 0 : 1) - (b.category === r.category ? 0 : 1) || a.popular - b.popular; })
      .slice(0, 3);

    root.innerHTML =
      '<p class="crumbs"><a href="index.html">Главная</a> / <a href="menu.html">Меню</a> / ' + esc(r.name) + ' ' + r.kcal + ' ккал</p>' +
      '<div class="p-grid">' +
      '<div class="gallery"><div class="g-main"><img id="gMain" src="img/dishes/' + r.cover + '.svg" alt="' + esc(r.name) + '"></div><div class="g-thumbs" id="gThumbs"></div></div>' +
      '<div class="p-info"><span class="tag tag-inline tag-' + r.category + '" style="background:var(--green-l)">' + cat.label + '</span>' +
      '<h1>Рацион «' + esc(r.name) + '»</h1>' +
      '<p class="p-sub">' + r.kcal + ' ккал в день · ' + mealsWord(r.meals) + '</p>' +
      '<p class="muted">' + esc(r.desc) + '</p>' +
      '<div class="stats" id="stats"></div>' +
      '<div class="opt"><span class="lbl">Количество дней</span><div class="seg" id="daysSeg"><button type="button" data-days="5">5 дней</button><button type="button" data-days="7">7 дней</button></div></div>' +
      '<div class="opt"><label class="lbl" for="dateInput">Дата первой доставки</label><input class="input" type="date" id="dateInput" min="' + tomorrowISO() + '"></div>' +
      '<div class="opt"><span class="lbl">Исключить аллергены</span><div class="chips" id="allergens"></div></div>' +
      '<div><div class="p-price" id="pPrice"></div><div class="muted" id="pPer"></div></div>' +
      '<div class="buy-row"><button class="btn btn-primary btn-lg" type="button" id="orderBtn">Заказать</button>' +
      '<button class="btn btn-outline btn-lg" type="button" id="favBtn" aria-pressed="false">В избранное</button></div>' +
      '<p class="muted small">Доставка 2 раза в неделю · бесплатно от ' + money(FW.FREE_DELIVERY_FROM) + '</p></div></div>' +

      '<section class="week section" id="week"><h2>Состав недели</h2><div class="day-tabs" id="dayTabs"></div>' +
      '<div class="meals" id="meals"></div><div class="day-total" id="dayTotal"></div><p class="swap-note" id="swapNote"></p></section>' +

      '<div class="details-grid"><div class="panel"><h3>Кому подходит</h3><ul class="checks">' +
      cat.forWhom.map(function (t) { return '<li><span class="tick"></span><span>' + t + '</span></li>'; }).join('') +
      '<li><span class="tick"></span><span>Рацион не заменяет консультацию врача</span></li></ul></div>' +
      '<div class="panel"><h3>Отзывы</h3>' +
      '<div class="mini-review"><strong>Анна — <span class="stars">★★★★★</span></strong><p class="muted">Удобно, что всё посчитано. Порции сытные, блюда не надоедают.</p></div>' +
      '<div class="mini-review"><strong>Денис — <span class="stars">★★★★★</span></strong><p class="muted">Заказываю уже несколько недель, доставка приезжает вовремя.</p></div></div></div>' +

      '<section class="section"><div class="section-head"><h2 class="section-title">Другие рационы</h2></div><div class="grid-cards" id="related">' +
      related.map(function (x) { return rationCard(x, st.days); }).join('') + '</div></section>';

    $('#dateInput').value = st.date;
    $('#allergens').innerHTML = FW.ALLERGENS.map(function (a) {
      return '<button type="button" class="chip sm" data-al="' + a.id + '" aria-pressed="false">' + a.label + '</button>';
    }).join('');
    $('#dayTabs').innerHTML = FW.DAYS.map(function (d, i) {
      return '<button type="button" class="chip" data-day="' + i + '">' + d + '</button>';
    }).join('');

    function updateGallery(week) {
      var ids = [r.cover];
      week[0].meals.forEach(function (m) { if (ids.indexOf(m.dish.id) < 0 && ids.length < 4) ids.push(m.dish.id); });
      if (ids.indexOf(st.img) < 0) st.img = r.cover;
      $('#gThumbs').innerHTML = ids.map(function (id) {
        return '<button type="button" class="g-thumb' + (id === st.img ? ' active' : '') + '" data-img="' + id + '" aria-label="Фото блюда"><img src="img/dishes/' + id + '.svg" alt=""></button>';
      }).join('');
      $('#gMain').src = 'img/dishes/' + st.img + '.svg';
    }

    function updateWeek() {
      var week = FW.buildWeek(r, st.exclude);
      var d = week[st.day];
      $$('#dayTabs .chip').forEach(function (c) { c.classList.toggle('active', Number(c.getAttribute('data-day')) === st.day); });
      $('#meals').innerHTML = d.meals.map(function (m) {
        return '<article class="meal"><div class="meal-img"><img src="img/dishes/' + m.dish.id + '.svg" alt="' + esc(m.dish.name) + '" loading="lazy">' +
          (m.swapped ? '<span class="swap">Замена</span>' : '') + '</div>' +
          '<div class="meal-body"><span class="meal-type">' + m.label + '</span><h4>' + esc(m.dish.name) + '</h4>' +
          '<p class="muted small">' + m.kcal + ' ккал · Б ' + m.p + ' · Ж ' + m.f + ' · У ' + m.c + '</p>' +
          '<p class="muted small">≈ ' + m.g + ' г</p></div></article>';
      }).join('');
      $('#dayTotal').textContent = 'Итого за день: ' + d.totals.kcal + ' ккал · Б ' + d.totals.p + ' · Ж ' + d.totals.f + ' · У ' + d.totals.c;
      var swaps = d.meals.filter(function (m) { return m.swapped; }).length;
      $('#swapNote').textContent = st.exclude.length
        ? (swaps ? 'Блюда с исключёнными аллергенами заменены (' + swaps + ' шт. в этот день).' : 'В этот день блюд с исключёнными аллергенами нет.')
        : '';
      var avg = FW.avg(r, st.exclude);
      $('#stats').innerHTML =
        '<div class="stat"><strong>' + r.kcal + '</strong><span>ккал</span></div>' +
        '<div class="stat"><strong>' + avg.p + ' г</strong><span>белки</span></div>' +
        '<div class="stat"><strong>' + avg.f + ' г</strong><span>жиры</span></div>' +
        '<div class="stat"><strong>' + avg.c + ' г</strong><span>углеводы</span></div>';
      updateGallery(week);
    }

    function updatePrice() {
      var price = FW.priceFor(r, st.days);
      $('#pPrice').textContent = money(price);
      $('#pPer').textContent = 'за ' + st.days + ' дней · ' + money(Math.round(price / st.days)) + ' в день';
      $$('#daysSeg button').forEach(function (b) { b.classList.toggle('active', Number(b.getAttribute('data-days')) === st.days); });
    }

    function updateFav() {
      var on = favs().indexOf(r.id) >= 0;
      $('#favBtn').textContent = on ? 'В избранном ♥' : 'В избранное';
      $('#favBtn').setAttribute('aria-pressed', on ? 'true' : 'false');
    }

    $('#daysSeg').addEventListener('click', function (e) {
      var b = e.target.closest('[data-days]');
      if (b) { st.days = Number(b.getAttribute('data-days')); updatePrice(); }
    });
    $('#dateInput').addEventListener('change', function () {
      if (!this.value || this.value < tomorrowISO()) { this.value = defaultDate(); toast('Доставка возможна со следующего дня'); }
      st.date = this.value;
    });
    $('#allergens').addEventListener('click', function (e) {
      var b = e.target.closest('[data-al]');
      if (!b) return;
      var id = b.getAttribute('data-al');
      var i = st.exclude.indexOf(id);
      if (i >= 0) st.exclude.splice(i, 1); else st.exclude.push(id);
      b.classList.toggle('active', i < 0);
      b.setAttribute('aria-pressed', i < 0 ? 'true' : 'false');
      updateWeek();
    });
    $('#dayTabs').addEventListener('click', function (e) {
      var b = e.target.closest('[data-day]');
      if (b) { st.day = Number(b.getAttribute('data-day')); updateWeek(); }
    });
    $('#gThumbs').addEventListener('click', function (e) {
      var b = e.target.closest('[data-img]');
      if (!b) return;
      st.img = b.getAttribute('data-img');
      $('#gMain').src = 'img/dishes/' + st.img + '.svg';
      $$('#gThumbs .g-thumb').forEach(function (t) { t.classList.toggle('active', t === b); });
    });
    $('#orderBtn').addEventListener('click', function () {
      addToCart({ id: r.id, days: st.days, date: st.date, exclude: st.exclude });
      openCart();
    });
    $('#favBtn').addEventListener('click', function () {
      var f = favs();
      var i = f.indexOf(r.id);
      if (i >= 0) f.splice(i, 1); else f.push(r.id);
      store.set('fw_fav', f);
      updateFav();
      toast(i >= 0 ? 'Убрано из избранного' : 'Добавлено в избранное');
    });
    bindQuickAdd($('#related'), function () { return st.days; });

    updatePrice();
    updateWeek();
    updateFav();
  }

  /* ---------- появление блоков при прокрутке ---------- */
  function initReveal() {
    var els = $$('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ---------- запуск ---------- */
  mountShell();
  bindCart();
  bindCheckout();
  renderCart();
  if (page === 'home') initHome();
  if (page === 'menu') initMenu();
  if (page === 'product') initProduct();
  initReveal();
})();
