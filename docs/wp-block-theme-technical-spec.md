# ТЗ: миграция текущего статического экспорта в WordPress block theme

## 1. Контекст и цель

В репозитории сейчас лежит статический экспорт страницы:

- `index.html` - одна большая HTML-страница, похожая на экспорт существующего WordPress-сайта.
- `assets/css/styles.css` - общий минифицированный CSS, уже содержит WordPress preset-переменные и стили старых ACF-блоков.
- `assets/js/*.js` - фронтовые скрипты для меню, слайдеров, списков офферов, live odds и прочих интерактивных секций.
- `assets/img/**`, `assets/fonts/**` - локальные изображения, SVG, webp/png и шрифты.

Цель: сделать полноценную WordPress блочную тему, в которой весь основной контент страницы редактируется визуально из админки через Site Editor / Block Editor, а внешний вид на фронте и в админке остается максимально близким к текущему дизайну.

Ожидаемый результат: FSE/block theme с `theme.json`, HTML-шаблонами, template parts, block patterns и набором кастомных Gutenberg-блоков для сложных повторяемых секций.

## 2. Важное ограничение по редактированию 1:1

Почти 1:1 между фронтом и админкой возможно, если:

- одни и те же CSS-переменные, шрифты, размеры контейнеров, цвета и spacing заданы в `theme.json`;
- стили блоков подключаются и на фронт, и в editor iframe через `style`, `editorStyle` или `enqueue_block_assets`;
- каждый сложный UI-блок имеет React-компонент `edit`, который повторяет фронтовую разметку;
- динамические данные не захардкожены в HTML, а хранятся в атрибутах блока, post meta, CPT или опциях темы.

Не нужно пытаться сделать все секции только core-блоками. Для таких элементов, как `offer-list`, `offer-card`, таблицы сравнения, live odds, меню с mega dropdown, лучше использовать кастомные блоки.

## 3. Архитектура темы

Рекомендуемая структура:

```text
portugal-casino-theme/
  style.css
  functions.php
  theme.json
  templates/
    index.html
    page.html
    single.html
    archive.html
    front-page.html
  parts/
    header.html
    footer.html
  patterns/
    page-casino-legal.php
    hero-casino.php
    content-two-column.php
    related-links.php
  blocks/
    page-hero/
    offer-list/
    offer-card/
    two-column-text/
    about-list/
    related-links/
    odds-tips/
    responsive-table/
    info-grid/
    news-slider/
  assets/
    css/
    js/
    img/
    fonts/
```

Базовые требования:

- тема должна иметь поддержку Full Site Editing;
- `templates/*.html` и `parts/*.html` должны быть редактируемы через Appearance -> Editor;
- блоки должны быть зарегистрированы через `block.json`;
- фронтовые скрипты подключать только для страниц, где есть соответствующий блок;
- старый `index.html` использовать как визуальный референс и источник начальной разметки, но не оставлять как главный шаблон темы.

## 4. Глобальные стили

В `theme.json` нужно вынести:

- шрифты: `Roboto`, `Roboto Condensed`;
- цвета: основной зеленый `#12a96a`, желтый рейтинга `#FFC700`, оранжевый бонуса `#FF8F28`, темный текст `#1D2129`, серые фоны `#f2f2f3`, белый;
- ширины контейнеров: mobile fluid, tablet около `750px`, desktop около `1194px`;
- typography scale для `h1`, `h2`, `h3`, paragraph, мелких label;
- spacing scale: `4`, `8`, `12`, `16`, `24`, `32`, `48`, `64`;
- radius, border, shadow tokens для карточек, кнопок, таблиц;
- стили core-блоков: `core/paragraph`, `core/heading`, `core/image`, `core/buttons`, `core/table`, `core/group`, `core/columns`.

Глобальный CSS разделить:

- `assets/css/global.css` - reset, layout, containers, typography, helpers;
- `assets/css/editor.css` - editor-only правки для совпадения вида;
- `assets/css/legacy-reference.css` - временный слой старых классов, если нужен на этапе миграции;
- CSS каждого кастомного блока хранить рядом с блоком.

## 5. Список блоков

### 5.1 Header / Navigation

Источник в текущем HTML: `header.header`, `primary-nav`, `sidebar-nav__list`, `nav-menu__item`, `dropdown-menu`, `header__brand`, badges.

Тип реализации: template part + кастомный блок/расширение для mega menu.

Редактируемые поля:

- логотип desktop/mobile;
- главное меню;
- мобильное меню;
- пункты с badge;
- группы dropdown/mega menu;
- ссылки CTA, если есть;
- disclaimer/age-gating, если требуется.

Функции:

- desktop navigation;
- mobile drawer;
- dropdown и nested submenu;
- active/current state;
- доступность: keyboard navigation, `aria-expanded`, focus state.

### 5.2 Page Hero

Источник: `page-hero` в начале `main`.

Тип реализации: кастомный блок `casino/page-hero`.

Редактируемые поля:

- background image;
- overlay color/opacity;
- title с выделенной цветом частью;
- description;
- top spacer/height;
- theme variant: dark/light.

Критерий приемки: hero в редакторе визуально совпадает с фронтом, фон выбирается через Media Library, H1 остается настоящим H1.

### 5.3 Offer List

Источник: `offers offers--full offers--legacy`, `offers__controls`, `offers__sort-btn`, `offers__list`, `offer-card`.

Тип реализации: динамический кастомный блок `casino/offer-list` + вложенный/переиспользуемый компонент `offer-card`.

Рекомендуемая модель данных:

- CPT `casino_offer` или `bookmaker`;
- поля: title, logo, rating, bonus amount/text, legal license status, review URL, go URL, rel sponsored, payment methods, game types, features, date, menu order;
- taxonomy: casino, betting, payment methods, license, country/market.

Редактируемые настройки блока:

- ручной список офферов или query по CPT;
- количество карточек;
- сортировка по recommendation/date/bonus/rating;
- показать/скрыть legal label;
- варианты CTA;
- количество видимых payment icons;
- background variant.

Функции:

- сортировка без перезагрузки или через server render;
- кнопка `Mostrar mais`;
- корректный `rel="sponsored"` для go links;
- fallback если офферов нет;
- одинаковая карточка в editor и frontend.

### 5.4 Two Column Text

Источник: `text-block--two-column`.

Тип реализации: кастомный блок или pattern на core-блоках.

Редактируемые поля:

- heading;
- повторяемые пункты: icon, subheading, rich text left, rich text right;
- background color/image;
- column layout.

Можно начать с pattern, если не нужны сложные настройки.

### 5.5 About / Criteria List

Источник: `about`, `about__list`, `about__list-item`.

Тип реализации: кастомный блок `casino/about-list`.

Редактируемые поля:

- heading с выделением части текста;
- список критериев: icon, title, description, link;
- количество колонок;
- background variant.

### 5.6 Related Links

Источник: `related-links`, `related-links__heading`, `related-links__link`, `related-links__group`.

Тип реализации: кастомный блок.

Редактируемые поля:

- heading;
- intro text;
- список карточек: image/logo, title, text, URL, link label;
- variant: cards/grid/footer group;
- background color.

Этот блок повторяется несколько раз, поэтому его нужно делать одним универсальным компонентом, а не отдельными HTML-паттернами.

### 5.7 Live Odds / Tips Slider

Источник: `odds-tips js-odds-tips`, slick slider, `themeVars.oddsGateway`.

Тип реализации: динамический блок.

Редактируемые поля:

- title;
- source: manual/API;
- количество видимых карточек;
- включить/выключить slider;
- CTA label/link;
- fallback content.

Функции:

- frontend fetch через REST API или server-side render;
- в редакторе показывать preview/fallback, не ломать editor;
- slider инициализировать только на фронте.

### 5.8 Responsive Table

Источник: `table-responsive`, повторяется много раз.

Тип реализации: кастомный блок или улучшенный core/table с wrapper-классом.

Редактируемые поля:

- heading;
- table content;
- highlighted rows/cells;
- background variant;
- mobile behavior: horizontal scroll или stacked cards.

Критерий: редактор позволяет менять таблицу визуально, а мобильная версия не ломает ширину страницы.

### 5.9 Info Grid

Источник: `info info--top-left`.

Тип реализации: кастомный блок.

Редактируемые поля:

- heading;
- список элементов: icon, title, rich text;
- layout variant: top-left, compact, cards;
- background.

### 5.10 News Slider

Источник: `news-slider`, `news-slider-item`.

Тип реализации: dynamic block/query block variation.

Редактируемые поля:

- title;
- post type/category;
- number of posts;
- manual selected posts;
- slider on/off.

Функции:

- на фронте выводить последние материалы;
- в редакторе показывать реальные posts preview;
- не подключать slick на страницах без блока.

### 5.11 Footer

Источник: `site-footer`, footer nav, related link groups, external country links, 18+ partner icon, copyright.

Тип реализации: template part `parts/footer.html` + patterns для link groups.

Редактируемые поля:

- логотип;
- responsible gaming текст;
- информационные link groups;
- external country links;
- 18+ icon;
- footer menu;
- copyright.

## 6. Этапы разработки

### Этап 0. Аудит и подготовка

Задачи:

- разметить текущий `index.html` на секции и сохранить карту блоков;
- извлечь все локальные ассеты из HTML и заменить внешние `https://apostalegal.pt/wp-content/uploads/...` на Media Library/локальные assets;
- определить, какие данные должны быть CPT, какие атрибутами блока, а какие глобальными опциями;
- создать список страниц/шаблонов, которые должна покрывать тема.

Результат: карта секций, список блоков, список ассетов, список data models.

### Этап 1. Каркас block theme

Задачи:

- создать `style.css`, `functions.php`, `theme.json`;
- создать `templates/index.html`, `templates/page.html`, `parts/header.html`, `parts/footer.html`;
- подключить шрифты и базовые CSS;
- настроить `add_theme_support` для editor styles, responsive embeds, post thumbnails, html5;
- подключить editor stylesheet.

Результат: тема активируется в WP и открывается в Site Editor без ошибок.

### Этап 2. Глобальные стили и parity редактора

Задачи:

- перенести tokens в `theme.json`;
- сделать frontend/editor контейнеры одинаковой ширины;
- нормализовать typography, кнопки, ссылки, списки, таблицы;
- добавить временные helper-классы: `container`, `row`, `layout__row-item-padding`, `text--main-color`.

Результат: core content в редакторе выглядит близко к фронту.

### Этап 3. Header

Задачи:

- перенести логотип и меню в `parts/header.html`;
- реализовать desktop и mobile navigation;
- сохранить внешний вид dropdown/mega menu;
- подключить JS только для header;
- проверить keyboard/focus states.

Результат: header редактируется через Site Editor и выглядит как текущий.

### Этап 4. Hero

Задачи:

- создать блок `casino/page-hero`;
- перенести текущий hero как default example/pattern;
- подключить front/editor styles;
- проверить responsive состояние.

Результат: hero можно редактировать визуально, включая фон и текст.

### Этап 5. Offer List и Offer Card

Задачи:

- создать CPT/поля для офферов;
- создать `casino/offer-list`;
- создать компонент карточки;
- перенести текущие карточки из HTML в seed/demo data или в блок attributes;
- реализовать сортировку, payment icons, features, rating, CTA;
- проверить sponsored links.

Результат: список офферов управляется из админки, карточки совпадают с текущим дизайном.

### Этап 6. Контентные повторяемые блоки

Задачи:

- `two-column-text`;
- `about-list`;
- `related-links`;
- `info-grid`;
- `responsive-table`.

Результат: основная статья собирается из редактируемых блоков, без ручного HTML внутри страницы.

### Этап 7. Динамические блоки

Задачи:

- `odds-tips`;
- `news-slider`;
- REST/API/fallback;
- frontend-only slider initialization;
- preview в редакторе.

Результат: динамические секции не ломают редактор и корректно работают на фронте.

### Этап 8. Footer

Задачи:

- перенести footer в template part;
- сделать link groups редактируемыми;
- вынести меню в WP Navigation/Menu;
- проверить mobile layout.

Результат: footer полностью редактируется через Site Editor.

### Этап 9. Финальная миграция страницы

Задачи:

- создать pattern `page-casino-legal.php`;
- собрать страницу из новых блоков;
- сравнить desktop/tablet/mobile со старым `index.html`;
- удалить неиспользуемый legacy CSS/JS;
- проверить SEO-разметку, schema, breadcrumbs, canonical, meta.

Результат: рабочая блочная WP-страница, визуально близкая к текущему экспорту.

## 7. Критерии приемки

Общие:

- тема активируется без PHP warnings/notices;
- Site Editor открывает header, footer и page templates;
- страница собирается из блоков, а не из одного Custom HTML блока;
- все основные тексты, картинки, ссылки, списки, таблицы и карточки редактируются из админки;
- frontend и editor отличаются только технически неизбежными мелочами;
- mobile layout соответствует текущему дизайну.

Технические:

- нет inline JS в шаблонах;
- скрипты подключаются условно по наличию блока;
- CSS блоков изолирован по block namespace;
- нет внешних `localhost.com` в финальной теме;
- `rel="sponsored"` сохранен для рекламных ссылок;
- изображения идут через Media Library или локальный theme asset helper;
- accessibility для меню, кнопок, slider controls;
- Lighthouse/Performance не ухудшен из-за лишнего legacy CSS/JS.

Редактор:

- каждый кастомный блок имеет понятный sidebar controls;
- блоки имеют preview/example;
- контент можно менять без HTML-режима;
- повторяемые элементы редактируются через список/InnerBlocks;
- editor styles не влияют на админку за пределами iframe.

## 8. Что не делать

- Не переносить весь `index.html` одним шаблоном в `templates/page.html`.
- Не делать весь контент через `core/html`.
- Не хранить офферы только в атрибутах одной страницы, если они будут использоваться на многих страницах.
- Не подключать весь старый JS глобально на каждую страницу.
- Не оставлять внешние ссылки на старый `wp-content/uploads` как основной источник изображений.
- Не смешивать блоки, CPT и глобальные настройки без схемы данных.

## 9. Рекомендуемый порядок первого спринта

1. Создать минимальную block theme структуру.
2. Перенести `theme.json`, шрифты, контейнеры, базовые цвета.
3. Сделать `parts/header.html` без сложного mega menu, но с правильным визуальным каркасом.
4. Сделать `casino/page-hero`.
5. Сделать статический prototype `casino/offer-list` на данных из attributes.
6. После визуальной проверки перевести `offer-list` на CPT/query.

Такой порядок даст быстро видимый результат и снизит риск: сначала будет готова тема и визуальная база, затем самые дорогие блоки можно дорабатывать без переписывания каркаса.

