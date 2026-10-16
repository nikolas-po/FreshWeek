/* FreshWeek — данные: блюда, рационы, сборка недели */
(function () {
  'use strict';
  var FW = (window.FW = {});

  FW.ALLERGENS = [
    { id: 'nuts', label: 'Орехи' },
    { id: 'milk', label: 'Молочное' },
    { id: 'gluten', label: 'Глютен' },
    { id: 'seafood', label: 'Рыба и морепродукты' },
    { id: 'eggs', label: 'Яйца' },
    { id: 'soy', label: 'Соя' }
  ];

  FW.CATEGORIES = {
    loss: {
      label: 'Похудение',
      forWhom: [
        'Тем, кто снижает вес на 0,5 кг в неделю',
        'Тем, кто не хочет считать калории сам',
        'Занятым людям без времени на готовку'
      ]
    },
    mass: {
      label: 'Набор массы',
      forWhom: [
        'Тем, кто тренируется 3–5 раз в неделю',
        'Тем, кому сложно набрать вес из-за нехватки калорий',
        'Тем, кто хочет есть больше белка без лишних хлопот'
      ]
    },
    vegan: {
      label: 'Веган',
      forWhom: [
        'Веганам и тем, кто сокращает продукты животного происхождения',
        'Тем, кто хочет попробовать растительное питание',
        'Тем, кто устал придумывать, чем заменить мясо'
      ]
    }
  };

  // type: breakfast | lunch | snack | dinner; g — масса порции в граммах при базовой калорийности
  FW.DISHES = [
    { id: 'oatmeal', name: 'Овсянка с ягодами', type: 'breakfast', kcal: 380, p: 12, f: 9, c: 62, g: 300, allergens: ['gluten'], vegan: true },
    { id: 'eggs', name: 'Омлет с овощами', type: 'breakfast', kcal: 420, p: 28, f: 30, c: 8, g: 260, allergens: ['eggs'], vegan: false },
    { id: 'chia', name: 'Чиа-пудинг с манго', type: 'breakfast', kcal: 340, p: 9, f: 16, c: 42, g: 250, allergens: [], vegan: true },
    { id: 'tofu-scramble', name: 'Тофу-скрэмбл с овощами', type: 'breakfast', kcal: 360, p: 24, f: 20, c: 18, g: 280, allergens: ['soy'], vegan: true },
    { id: 'cottage', name: 'Творог с ягодами', type: 'breakfast', kcal: 320, p: 30, f: 9, c: 28, g: 280, allergens: ['milk'], vegan: false },

    { id: 'chicken', name: 'Курица с булгуром', type: 'lunch', kcal: 520, p: 42, f: 14, c: 55, g: 380, allergens: ['gluten'], vegan: false },
    { id: 'beef-bowl', name: 'Говядина с рисом и брокколи', type: 'lunch', kcal: 580, p: 40, f: 18, c: 62, g: 400, allergens: [], vegan: false },
    { id: 'turkey', name: 'Индейка с гречкой', type: 'lunch', kcal: 500, p: 40, f: 12, c: 52, g: 380, allergens: [], vegan: false },
    { id: 'lentil', name: 'Чечевичный боул с овощами', type: 'lunch', kcal: 480, p: 26, f: 12, c: 68, g: 400, allergens: [], vegan: true },
    { id: 'falafel', name: 'Фалафель с хумусом', type: 'lunch', kcal: 540, p: 22, f: 24, c: 58, g: 360, allergens: [], vegan: true },

    { id: 'yogurt', name: 'Йогурт с яблоком', type: 'snack', kcal: 180, p: 12, f: 4, c: 24, g: 200, allergens: ['milk'], vegan: false },
    { id: 'nuts', name: 'Орехи и сухофрукты', type: 'snack', kcal: 220, p: 6, f: 13, c: 22, g: 60, allergens: ['nuts'], vegan: true },
    { id: 'smoothie', name: 'Смузи шпинат-банан', type: 'snack', kcal: 170, p: 5, f: 3, c: 32, g: 300, allergens: [], vegan: true },
    { id: 'fruit', name: 'Фруктовая тарелка', type: 'snack', kcal: 160, p: 2, f: 1, c: 38, g: 250, allergens: [], vegan: true },
    { id: 'hummus', name: 'Хумус с овощными палочками', type: 'snack', kcal: 210, p: 8, f: 12, c: 18, g: 180, allergens: [], vegan: true },

    { id: 'salmon', name: 'Лосось с овощами', type: 'dinner', kcal: 420, p: 29, f: 18, c: 31, g: 340, allergens: ['seafood'], vegan: false },
    { id: 'cod', name: 'Треска с брокколи', type: 'dinner', kcal: 330, p: 34, f: 6, c: 28, g: 350, allergens: ['seafood'], vegan: false },
    { id: 'chicken-salad', name: 'Салат с курицей и авокадо', type: 'dinner', kcal: 380, p: 33, f: 20, c: 16, g: 320, allergens: [], vegan: false },
    { id: 'tofu-stirfry', name: 'Тофу с овощами и рисом', type: 'dinner', kcal: 440, p: 24, f: 16, c: 50, g: 380, allergens: ['soy'], vegan: true },
    { id: 'veg-soup', name: 'Крем-суп из тыквы', type: 'dinner', kcal: 290, p: 7, f: 10, c: 42, g: 350, allergens: [], vegan: true },
    { id: 'stew', name: 'Овощное рагу с нутом', type: 'dinner', kcal: 380, p: 15, f: 11, c: 54, g: 380, allergens: [], vegan: true }
  ];

  FW.RATIONS = [
    { id: 'light-start', name: 'Лёгкий старт', category: 'loss', kcal: 1200, meals: 4, price: 5490, cover: 'chicken-salad', popular: 4, seed: 0,
      desc: 'Мягкий дефицит калорий: небольшие порции, много овощей и белка. Подойдёт, чтобы спокойно начать.' },
    { id: 'balance', name: 'Баланс', category: 'loss', kcal: 1500, meals: 4, price: 6290, cover: 'chicken', popular: 1, seed: 1,
      desc: 'Самый популярный рацион для снижения веса: сбалансированное соотношение белков, жиров и углеводов.' },
    { id: 'cut-plus', name: 'Сушка Плюс', category: 'loss', kcal: 1800, meals: 5, price: 7190, cover: 'salmon', popular: 5, seed: 2,
      desc: 'Больше белка и пять приёмов пищи в день: для тех, кто тренируется и хочет снижать вес без потери сил.' },
    { id: 'mass-start', name: 'Масса Старт', category: 'mass', kcal: 2200, meals: 5, price: 8490, cover: 'beef-bowl', popular: 3, seed: 3,
      desc: 'Профицит калорий и повышенное количество белка для постепенного набора мышечной массы.' },
    { id: 'mass-pro', name: 'Масса Про', category: 'mass', kcal: 2800, meals: 6, price: 9790, cover: 'turkey', popular: 6, seed: 4,
      desc: 'Максимальная калорийность и шесть приёмов пищи для тех, кто тренируется регулярно и тяжело.' },
    { id: 'vegan-light', name: 'Зелёный старт', category: 'vegan', kcal: 1500, meals: 4, price: 6490, cover: 'chia', popular: 7, seed: 5,
      desc: 'Лёгкое веганское меню без продуктов животного происхождения: злаки, бобовые, овощи и фрукты.' },
    { id: 'green-day', name: 'Зелёный день', category: 'vegan', kcal: 1800, meals: 4, price: 6990, cover: 'lentil', popular: 2, seed: 6,
      desc: 'Сытное веганское меню с растительным белком: чечевица, нут, тофу и сезонные овощи.' },
    { id: 'vegan-power', name: 'Веган Сила', category: 'vegan', kcal: 2200, meals: 5, price: 8290, cover: 'falafel', popular: 8, seed: 7,
      desc: 'Веганский рацион повышенной калорийности для активных людей и тренирующихся.' }
  ];

  FW.SLOTS = {
    4: [
      { type: 'breakfast', label: 'Завтрак' },
      { type: 'lunch', label: 'Обед' },
      { type: 'snack', label: 'Полдник' },
      { type: 'dinner', label: 'Ужин' }
    ],
    5: [
      { type: 'breakfast', label: 'Завтрак' },
      { type: 'snack', label: 'Второй завтрак' },
      { type: 'lunch', label: 'Обед' },
      { type: 'snack', label: 'Полдник' },
      { type: 'dinner', label: 'Ужин' }
    ],
    6: [
      { type: 'breakfast', label: 'Завтрак' },
      { type: 'snack', label: 'Второй завтрак' },
      { type: 'lunch', label: 'Обед' },
      { type: 'snack', label: 'Полдник' },
      { type: 'dinner', label: 'Ужин' },
      { type: 'snack', label: 'Поздний перекус' }
    ]
  };

  FW.DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  FW.FREE_DELIVERY_FROM = 5000;
  FW.DELIVERY_FEE = 390;

  FW.priceFor = function (r, days) {
    return days === 7 ? r.price : Math.round((r.price * 5 / 7 * 1.05) / 10) * 10;
  };

  function pick(list, offset, used) {
    for (var k = 0; k < list.length; k++) {
      var cand = list[(offset + k) % list.length];
      if (!used[cand.id]) return cand;
    }
    return list[offset % list.length];
  }

  // Меню на 7 дней. exclude — список id аллергенов, которые нужно исключить.
  FW.buildWeek = function (r, exclude) {
    exclude = exclude || [];
    var vegan = r.category === 'vegan';
    var slots = FW.SLOTS[r.meals];
    var week = [];
    for (var d = 0; d < 7; d++) {
      var used = {};
      var meals = [];
      slots.forEach(function (slot, i) {
        var pool = FW.DISHES.filter(function (x) { return x.type === slot.type && (!vegan || x.vegan); });
        var safe = pool.filter(function (x) {
          return !x.allergens.some(function (a) { return exclude.indexOf(a) !== -1; });
        });
        // запас: если в типе нет безопасных блюд, берём из любых безопасных веганских
        if (!safe.length) {
          safe = FW.DISHES.filter(function (x) {
            return x.vegan && !x.allergens.some(function (a) { return exclude.indexOf(a) !== -1; });
          });
        }
        var offset = d + i * 2 + r.seed;
        var original = pick(pool, offset, used);
        var dish = pick(safe.length ? safe : pool, offset, used);
        var swapped = original.allergens.some(function (a) { return exclude.indexOf(a) !== -1; });
        used[dish.id] = true;
        meals.push({ label: slot.label, type: slot.type, dish: dish, swapped: swapped });
      });
      var base = meals.reduce(function (s, m) { return s + m.dish.kcal; }, 0);
      var k = r.kcal / base;
      meals.forEach(function (m) {
        m.kcal = Math.round(m.dish.kcal * k);
        m.p = Math.round(m.dish.p * k);
        m.f = Math.round(m.dish.f * k);
        m.c = Math.round(m.dish.c * k);
        m.g = Math.round(m.dish.g * k / 10) * 10;
      });
      var sum = meals.reduce(function (s, m) { return s + m.kcal; }, 0);
      var big = meals.reduce(function (a, b) { return b.kcal > a.kcal ? b : a; }, meals[0]);
      big.kcal += r.kcal - sum;
      week.push({
        meals: meals,
        totals: {
          kcal: meals.reduce(function (s, m) { return s + m.kcal; }, 0),
          p: meals.reduce(function (s, m) { return s + m.p; }, 0),
          f: meals.reduce(function (s, m) { return s + m.f; }, 0),
          c: meals.reduce(function (s, m) { return s + m.c; }, 0)
        }
      });
    }
    return week;
  };

  var avgCache = {};
  FW.avg = function (r, exclude) {
    var key = r.id + '|' + (exclude || []).join(',');
    if (avgCache[key]) return avgCache[key];
    var week = FW.buildWeek(r, exclude);
    var out = { kcal: r.kcal, p: 0, f: 0, c: 0 };
    week.forEach(function (d) { out.p += d.totals.p; out.f += d.totals.f; out.c += d.totals.c; });
    out.p = Math.round(out.p / 7);
    out.f = Math.round(out.f / 7);
    out.c = Math.round(out.c / 7);
    avgCache[key] = out;
    return out;
  };
})();
