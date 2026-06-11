# ТЗ: универсальная секция Gutenberg и удаление узкоспециализированных контентных блоков

## Статус реализации

Первый этап и базовый набор patterns реализованы:

- добавлен `new-theme/section` с `InnerBlocks`;
- добавлены настройки фона, изображения, overlay, ширины, высоты и отступов;
- добавлена безопасная вставка `core/columns` для двухколоночного макета;
- добавлены все 12 обязательных patterns: обычная секция, цветной и фотофон, гибкий Hero, две текстовые колонки, оба варианта контент/изображение, преимущества, информационная сетка, таблица сравнения, карточки ссылок и FAQ;
- Hero сохранён отдельным `new-theme/hero` из-за уникальной геометрии и перекрытия следующей секции; его контент переведён на `InnerBlocks`;
- `templates/front-page.html` и `patterns/page-casino-legal.php` переведены на гибкий `hero`/`section` + core blocks; функциональные `offer-list`, `live-odds` и `news-slider` сохранены;
- заменяемые legacy-блоки скрыты из inserter через `supports.inserter = false`, но остаются зарегистрированными для существующего контента;
- legacy-блоки пока физически не удалялись;
- добавлена WP-CLI миграция `audit/dry-run/migrate/verify` с рекурсивным `parse_blocks()`, backup исходного `post_content` и fixtures;
- `related-links` переносится в core-блоки с runtime-восстановлением `data-location` и `data-internal-link`;
- JS-регистрация Section синхронизирована с `block.json`, опасные структурные блоки исключены из прямых вложений;
- редактор предупреждает о контрасте ниже `4.5:1` для секций с цветным фоном;
- `audit` и `verify` проверяют базу и block markup в `templates/`, `parts/`, `patterns/`;
- мигратор не изменяет запись при несовпадении существующего backup с текущим `post_content`, а restore проверяет SHA-256 backup;
- fixtures проверяют точные счетчики преобразований, повторный запуск и рекурсивную миграцию вложенных legacy-блоков;
- добавлен staging/production runbook с backup, viewport-матрицей и откатом;
- staging-миграция выполнена: self_test (13 fixtures), audit, migrate, verify (0 legacy blocks), rollback (restore + re-migrate) — всё прошло успешно;
- визуальная проверка через Site Editor и физическое удаление legacy-кода еще не выполнялись.

## 1. Цель

Заменить набор узких контентных блоков одним универсальным блоком `new-theme/section`.

Новый блок отвечает только за внешний вид и геометрию секции:

- HTML-обертка `<section>`;
- внутренний контейнер;
- фон, фоновое изображение и overlay;
- ширина контента и вертикальные отступы;
- обычный или двухколоночный стартовый макет;
- адаптивное поведение.

Контент секции собирается из стандартных блоков WordPress: Heading, Paragraph, Image, Gallery, List, Table, Buttons, Columns, Group, Details и других разрешенных core-блоков. Количество и порядок вложенных блоков не ограничиваются шаблоном секции.

После миграции удалить старые блоки, их PHP render callbacks, JS-регистрации, локальные стили и неиспользуемые ассеты. Удаление допускается только после проверки, что соответствующие block names отсутствуют в базе данных и шаблонах.

## 2. Текущее состояние проекта

Контент большинства секций хранится в жестких атрибутах (`title`, `text`, `items[]`) и выводится через PHP SSR. Это ограничивает редактора заранее заданным набором полей.

Кандидаты на замену универсальной секцией и core-блоками:

| Текущий блок | Целевая замена |
|---|---|
| `new-theme/hero` | Отдельный гибкий Hero с `InnerBlocks`, фоновым изображением + произвольными core-блоками |
| `new-theme/content-section` | Section + произвольные core-блоки |
| `new-theme/two-column-text` | Section + Columns |
| `new-theme/about-list` | Section + List/Groups или готовый pattern |
| `new-theme/info-grid` | Section + Columns/Groups |
| `new-theme/data-table` | Section + Heading + core/Table |
| `new-theme/card-grid` и `new-theme/link-card` | Section + Columns/Groups/Image/Buttons |
| `new-theme/faq` и `new-theme/faq-item` | Section + core/Details |
| `new-theme/related-links` | Section + карточки из core-блоков; сохранить нужные tracking-атрибуты отдельным решением |

Специализированные функциональные блоки не следует смешивать с универсальной секцией. На первом этапе оставить:

- `new-theme/offer-list` и `new-theme/offer-card`: CPT/query, сортировка и коммерческая разметка;
- `new-theme/news-slider`: query/manual source и slider JS;
- `new-theme/live-odds`: предметная модель и frontend JS;
- `new-theme/site-header`, `new-theme/site-footer`, `new-theme/age-disclaimer`;
- `new-theme/page-main`: пока он отвечает за page wrapper и schema JSON-LD.

Их можно пересматривать отдельно, но удалять вместе с обычными контентными секциями нельзя.

## 3. Целевая архитектура

Исключение из правила единой контентной секции: `new-theme/hero` остаётся отдельным блоком, поскольку его скошенный нижний край, высота и перекрытие следующего блока являются самостоятельным дизайн-компонентом. При этом Hero не хранит контент в жёстких `title`/`text`: новый контент сохраняется через `InnerBlocks`.

### 3.1 Универсальный блок секции

Имя: `new-theme/section`  
Название в редакторе: `Универсальная секция`  
Категория: `new-theme`

Структура фронтенда:

```html
<section class="nt-content-section ...">
    <div class="nt-content-section__background" aria-hidden="true"></div>
    <div class="nt-content-section__container">
        <!-- InnerBlocks.Content -->
    </div>
</section>
```

Фоновый слой выводится только при необходимости. Контент всегда остается обычными вложенными Gutenberg-блоками, а не строками HTML в атрибутах секции.

### 3.2 Атрибуты секции

| Атрибут | Тип | Значения/назначение |
|---|---|---|
| `backgroundType` | string | `none`, `color`, `image` |
| `backgroundColor` | string | Цвет из палитры темы или custom color |
| `backgroundImageId` | number | Attachment ID |
| `backgroundImageUrl` | string | URL для рендера и обратной совместимости |
| `backgroundPosition` | object | Focal point `{x,y}` |
| `backgroundSize` | string | `cover`, `contain`, `auto` |
| `overlayColor` | string | Цвет overlay |
| `overlayOpacity` | number | `0..100` |
| `contentWidth` | string | `content`, `wide`, `full` |
| `paddingTop` | string | токены `none`, `s`, `m`, `l`, `xl` |
| `paddingBottom` | string | токены `none`, `s`, `m`, `l`, `xl` |
| `minHeight` | string | `auto`, `s`, `m`, `l`, `screen` |
| `verticalAlign` | string | `start`, `center`, `end` |
| `layout` | string | `stack`, `split` |
| `stackOnMobile` | boolean | складывать колонки на мобильном |
| `reverseOnMobile` | boolean | менять порядок колонок на мобильном |

Не добавлять в секцию атрибуты `title`, `text`, `table`, `items` или `imageContent`: это снова создаст жесткую структуру. Заголовки, таблицы и изображения должны быть самостоятельными вложенными блоками.

### 3.3 WordPress supports

В `block.json` включить:

- `anchor`;
- `align`: `wide`, `full`;
- `color.text` и `color.link`;
- `html: false`.

Отступы реализованы собственными токен-атрибутами `paddingTop`/`paddingBottom` (`none`, `s`, `m`, `l`, `xl`) из п.3.2, а не через core-support `spacing`. Core `spacing` не включается, чтобы не плодить второй, неограниченный механизм отступов вне дизайн-системы.

`reusable` оставить по умолчанию (в WordPress он включён и так, отдельно прописывать не требуется).

Произвольный raw HTML для настройки секции не использовать.

### 3.4 Вложенные блоки

Использовать `InnerBlocks` без ограничения количества элементов. Разрешить core-блоки и оставшиеся функциональные блоки темы.

Запрещать только структурные блоки, которые могут сломать страницу или создать бессмысленную вложенность:

- вложенный `new-theme/section` запрещён полностью (принятое решение): это исключает бессмысленную рекурсию обёрток; для составных макетов используются `core/columns`/`core/group` внутри одной секции;
- `new-theme/page-main`, header/footer и template-part внутри секции запретить.

Функция `save` должна сохранять `InnerBlocks.Content`. PHP render callback, если он используется, получает `$content` и добавляет только оболочку секции. Данные вложенных блоков не копируются в атрибуты родителя.

## 4. Двухколоночный режим

Для режима `split` использовать стандартные `core/columns` и `core/column`, а не создавать еще один набор кастомных блоков.

При создании пустой split-секции автоматически вставлять:

```text
Section
└── Columns
    ├── Column: Heading + Paragraph
    └── Column: Image
```

Обе колонки должны принимать любые допустимые блоки. Изображение справа является стартовым шаблоном, а не обязательным полем.

Важно: переключение уже заполненной секции из `stack` в `split` не должно автоматически перемещать или удалять контент. Для непустой секции редактор получает действие `Добавить двухколоночный макет`, которое вставляет Columns в текущую позицию. Автоматическое преобразование разрешено только для пустой секции.

## 5. Patterns вместо новых узких блоков

Повторяемые дизайны оформить block patterns. Pattern создает стартовую композицию, после вставки все элементы остаются обычными редактируемыми блоками.

Обязательные patterns:

1. `Обычная секция`.
2. `Секция с цветным фоном`.
3. `Секция с фоновым изображением`.
4. `Hero`.
5. `Текст в две колонки`.
6. `Контент + изображение`.
7. `Изображение + контент`.
8. `Список преимуществ`.
9. `Информационная сетка`.
10. `Таблица сравнения`.
11. `Карточки ссылок`.
12. `FAQ` на core/Details.

Patterns должны воспроизводить текущий визуальный стиль, но не блокировать добавление, удаление или перестановку внутренних блоков.

## 6. Стили

Новые стили строить от `.wp-block-new-theme-section`/`.nt-content-section`, а не от старых классов `.about`, `.info`, `.text-block--two-column`.

Требования:

- использовать palette, spacing и typography tokens из `theme.json`;
- исключить inline CSS, кроме вычисляемых background image/focal point значений;
- desktop и editor preview должны совпадать по ширине, фону и отступам;
- при ширине мобильного экрана split-секция становится одной колонкой;
- фоновое изображение не должно быть контентным `<img>` и должно иметь `aria-hidden`;
- контраст текста на цветном/фотофоне остается ответственностью выбранного style/pattern; editor автоматически вычисляет и показывает предупреждение при контрасте ниже `4.5:1` для секций с фоном-цветом (с учётом overlay). Для фонового изображения контраст автоматически не считается — здесь корректность остаётся на стороне выбранного pattern/overlay;
- не задавать глобальные стили для всех `h2`, `p`, `table` вне блока секции.

Старые CSS-селекторы удаляются только после завершения миграции и проверки их использования оставшимися специализированными блоками.

## 7. Миграция существующего контента

### 7.1 Обязательный аудит до изменений

Проверить не только файлы темы, но и `post_content` в базе:

- posts/pages;
- `wp_template`;
- `wp_template_part`;
- reusable blocks/synced patterns;
- пользовательские post types.

Аудит должен вывести количество использований каждого `new-theme/*` блока и IDs записей. Поиск строкой недостаточен: использовать `parse_blocks()` рекурсивно.

### 7.2 Конвертер

Сделать WP-CLI команду или одноразовый migration script с режимами:

```text
wp new-theme sections audit
wp new-theme sections migrate --dry-run
wp new-theme sections migrate
wp new-theme sections verify
```

Конвертер работает через `parse_blocks()` и `serialize_blocks()`, сохраняет порядок блоков и создает backup исходного `post_content` в post meta или экспортном файле.

Правила преобразования:

- legacy `hero` с атрибутами `title`/`text` -> новый `hero` с `InnerBlocks` + core/heading level 1 + core/paragraph;
- `two-column-text` -> section + headings + core/columns;
- `content-section` -> вариант по `kind`, без потери title/text/image/items;
- `about-list` -> section + heading + list/groups;
- `info-grid` -> section + heading + columns/groups;
- `data-table` -> section + heading + core/table с сохранением строк и выделений, где возможно;
- `card-grid/link-card` -> section + columns/groups/image/heading/paragraph/button;
- `faq/faq-item` -> section + core/details;
- `related-links` -> section + карточки; tracking behavior переносится до удаления старого JS.

Миграция должна быть идемпотентной: повторный запуск не меняет уже преобразованные записи.

Важно про валидность разметки: конвертер собирает HTML ядровых блоков (`core/list`, `core/table`, `core/heading`, `core/details` и др.) вручную. Этот HTML обязан совпадать с тем, что генерирует `save()` соответствующего ядрового блока в целевой версии Gutenberg, иначе редактор покажет `This block contains unexpected or invalid content` (нарушение критерия приёмки №11). `self_test`/fixtures проверяют только идемпотентность и наличие подстрок, но **не** валидируют разметку против реального `save()` ядровых блоков. Поэтому зелёный `self_test` не гарантирует отсутствие invalid-content — обязательна ручная проверка на staging: открыть мигрированную запись в редакторе и пересохранить без ошибок (особое внимание `core/list` и модели `core/list-item`, `core/table`, `core/details` на минимальной поддерживаемой версии WP).

### 7.3 Переходный период

1. Добавить новый блок и patterns.
2. Скрыть legacy-контентные блоки из inserter, но оставить регистрацию и render callbacks.
3. Обновить файловые templates и patterns темы.
4. Выполнить dry-run и миграцию на staging.
5. Сравнить frontend до/после на desktop и mobile.
6. Выполнить миграцию production с backup.
7. Запустить verify: количество legacy-блоков должно быть `0`.
8. Только после этого физически удалить legacy-код.

Нельзя сначала удалить регистрацию блоков: WordPress покажет опубликованный контент как unsupported/missing blocks.

## 8. Удаление лишнего кода

После успешного `verify` удалить для замененных блоков:

- каталоги `blocks/<legacy-block>/`;
- записи из массива `$blocks` в `functions.php`;
- функции `new_theme_render_*`;
- `registerBlockType(...)` и editor helpers, которые больше нигде не используются;
- block-local CSS;
- связанные секции в `assets/js/blocks.js`;
- старые примеры из `templates/`, `patterns/` и документации;
- frontend JS только если он не используется оставшимися блоками;
- изображения/иконки только после поиска ссылок в теме и базе данных.

После удаления выполнить поиск по каждому старому block name, PHP callback и CSS-классу. Допустимы только упоминания в migration changelog, если он сохраняется как история.

## 9. Этапы реализации

### Этап 1. Инвентаризация

- получить список использований блоков из файлов и БД;
- зафиксировать страницы для визуального сравнения;
- сделать backup БД;
- определить минимальную поддерживаемую версию WordPress, особенно для `core/details`.

### Этап 2. Универсальная секция

- создать `blocks/section/block.json`, editor code и стили;
- добавить настройки фона, overlay, ширины и spacing;
- реализовать `InnerBlocks`;
- реализовать пустой split template;
- проверить editor/frontend parity.

### Этап 3. Patterns

- перенести текущие дизайны в patterns;
- не использовать template lock;
- обновить `front-page.html` и `page-casino-legal.php`.

### Этап 4. Автоматическая миграция

- реализовать audit/dry-run/migrate/verify;
- добавить unit/integration fixtures для каждого legacy-блока;
- проверить сохранение Unicode, ссылок, таблиц и media URLs.

### Этап 5. Переход и визуальная проверка

- скрыть legacy blocks из inserter;
- мигрировать staging;
- проверить главную, обычную страницу и статью;
- проверить 320, 768, 1024 и 1440 px;
- проверить editor, frontend, кеш и повторное сохранение записи.

### Этап 6. Финальная очистка

- подтвердить нулевое использование legacy block names;
- удалить legacy PHP/JS/CSS/block.json;
- удалить неиспользуемые helpers и assets;
- обновить `ARCHITECTURE.md`, editor guide и changelog;
- повторно выполнить PHP syntax check, JS syntax check и smoke test.

## 10. Критерии приемки

1. Редактор может добавить в Section любое количество разрешенных стандартных блоков и менять их порядок.
2. Section поддерживает отсутствие фона, цвет и фоновое изображение с overlay.
3. Можно собрать одну колонку, две произвольные колонки и вариант текст + изображение.
4. На мобильном колонки корректно складываются и при необходимости меняют порядок.
5. Текущие основные дизайны доступны как patterns, а не как отдельные жесткие блоки.
6. После миграции визуальный результат согласован с текущим дизайном на контрольных страницах.
7. `audit/verify` не находит замененные block names в активном контенте.
8. Удаленные блоки отсутствуют в inserter, PHP registry, JS и каталогах `blocks/`.
9. В проекте нет неиспользуемых callback-функций, CSS-файлов и editor helpers от удаленных блоков.
10. Оставшиеся специализированные блоки продолжают работать без регрессий.
11. Нет ошибок `This block contains unexpected or invalid content` и `unsupported block`.
12. Миграция имеет backup и проверенный способ отката до удаления legacy-кода.

## 11. Решение для этого проекта

Рекомендуемый итоговый набор собственных блоков:

```text
section
hero
page-main
age-disclaimer
site-header
site-footer
offer-list
offer-card
news-slider
live-odds
```

Все остальные текущие контентные блоки должны быть либо преобразованы в compositions из `section + core blocks`, либо отдельно обоснованы реальной функциональностью, которой нет у стандартных Gutenberg-блоков.
