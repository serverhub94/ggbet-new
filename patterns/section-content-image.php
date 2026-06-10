<?php
/**
 * Title: Контент и изображение
 * Slug: new-theme/section-content-image
 * Categories: new-theme
 * Description: Две свободно редактируемые колонки: контент слева, изображение справа.
 * Inserter: true
 *
 * @package NewTheme
 */
?>

<!-- wp:new-theme/section {"layout":"split","paddingTop":"l","paddingBottom":"l"} -->
<!-- wp:columns {"verticalAlignment":"center"} -->
<div class="wp-block-columns are-vertically-aligned-center"><!-- wp:column {"verticalAlignment":"center"} -->
<div class="wp-block-column is-vertically-aligned-center"><!-- wp:heading {"level":2} -->
<h2 class="wp-block-heading">Заголовок секции</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>В этой колонке можно добавлять и переставлять любые разрешенные блоки.</p>
<!-- /wp:paragraph -->

<!-- wp:buttons -->
<div class="wp-block-buttons"><!-- wp:button -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button">Подробнее</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></div>
<!-- /wp:column -->

<!-- wp:column {"verticalAlignment":"center"} -->
<div class="wp-block-column is-vertically-aligned-center"><!-- wp:image /--></div>
<!-- /wp:column --></div>
<!-- /wp:columns -->
<!-- /wp:new-theme/section -->
