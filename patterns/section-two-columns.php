<?php
/**
 * Title: Текст в две колонки
 * Slug: new-theme/section-two-columns
 * Categories: new-theme
 * Description: Заголовок и две независимые колонки для текстового контента.
 * Inserter: true
 *
 * @package NewTheme
 */
?>

<!-- wp:new-theme/section {"layout":"split","paddingTop":"l","paddingBottom":"l"} -->
<!-- wp:heading {"level":2} -->
<h2 class="wp-block-heading">Текст в две колонки</h2>
<!-- /wp:heading -->

<!-- wp:columns -->
<div class="wp-block-columns"><!-- wp:column -->
<div class="wp-block-column"><!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Первая тема</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Добавьте основной текст, список, цитату или другие блоки в левую колонку.</p>
<!-- /wp:paragraph --></div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column"><!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Вторая тема</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Правая колонка редактируется независимо и может содержать контент любого типа.</p>
<!-- /wp:paragraph --></div>
<!-- /wp:column --></div>
<!-- /wp:columns -->
<!-- /wp:new-theme/section -->
