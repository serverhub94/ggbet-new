# Section Migration Runbook

Порядок выполнения миграции legacy-контентных блоков на staging и production. Минимальная версия проекта зафиксирована как WordPress 6.6 и PHP 8.0 в `style.css` и `readme.txt`.

## 1. Подготовка

1. Зафиксировать commit/deploy revision темы.
2. Выбрать контрольные URL:
   - главная страница;
   - обычная статическая страница;
   - статья;
   - страница с таблицей;
   - страница с FAQ или карточками ссылок.
3. Сделать скриншоты до миграции на ширинах `320`, `768`, `1024`, `1440` px.
4. Экспортировать базу данных:

```bash
wp db export section-migration-before.sql
```

## 2. Предварительные проверки

```bash
wp new-theme sections self-test
wp new-theme sections audit
wp new-theme sections audit --format=json
wp new-theme sections migrate --dry-run
```

`audit` должен показывать использования в базе и отдельно в `templates/`, `parts/`, `patterns/`. До фактической миграции сохраните вывод команды вместе с DB backup.

Если у записи уже есть `_new_theme_sections_backup`, но его содержимое не совпадает с текущим `post_content`, мигратор пропустит запись. Перед повтором нужно вручную проверить историю записи и backup; автоматически перезаписывать исходный backup нельзя.

## 3. Миграция staging

```bash
wp new-theme sections migrate
wp cache flush
wp new-theme sections verify
```

После миграции повторный dry-run должен сообщить `0` записей:

```bash
wp new-theme sections migrate --dry-run
```

## 4. Проверка редактора и frontend

Для каждого контрольного URL проверить:

- порядок секций и вложенных блоков;
- H1/H2/H3 и текст без потери Unicode;
- изображения, media URLs и focal point;
- цветной фон, overlay, ширину и вертикальные отступы;
- складывание и обратный порядок колонок на мобильном;
- строки, столбцы и выделения таблиц;
- раскрытие `core/details` в FAQ;
- ссылки и `data-internal-link="true"` у мигрированных related links;
- отсутствие `unsupported block` и `This block contains unexpected or invalid content`;
- повторное сохранение записи без изменения разметки.

Сравнить скриншоты до/после на `320`, `768`, `1024`, `1440` px. Проверить frontend, Site Editor и обычный Post Editor.

## 5. Откат

Проверить список записей для восстановления:

```bash
wp new-theme sections restore --dry-run
```

Восстановить одну запись:

```bash
wp new-theme sections restore --post_id=123
```

Восстановить все записи из backup meta:

```bash
wp new-theme sections restore
wp cache flush
```

Restore сверяет `_new_theme_sections_backup_sha256` с содержимым backup. При несовпадении запись пропускается до ручной проверки целостности.

Если WordPress недоступен или backup meta недостаточно, восстановить SQL export из шага 1.

## 6. Production и очистка

На production повторить backup, self-test, audit, dry-run и migration. Физическое удаление legacy-каталогов, callbacks, JS и CSS разрешено только после успешного `verify` и визуального подтверждения контрольных страниц.

Сохранить перед очисткой:

- SQL backup;
- вывод `audit` до миграции;
- вывод `verify` после миграции;
- список проверенных URL;
- скриншоты до/после;
- commit/deploy revision темы.
