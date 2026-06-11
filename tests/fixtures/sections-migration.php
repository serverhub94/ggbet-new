<?php
/**
 * Fixtures for `wp new-theme sections self-test`.
 */

return [
    "hero-unicode-media" => [
        "content" => '<!-- wp:new-theme/hero {"title":"Kazino Lietuvoje – 2026","text":"<p>Turinys su lietuviškomis raidėmis.</p>","image":"assets/img/2025/01/casinos-com-10-gratis-de-bonus.jpg","imageId":101,"overlayOpacity":35} /-->',
        "changes" => ["new-theme/hero" => 1],
        "contains" => ["wp:new-theme/hero", "Kazino Lietuvoje – 2026", "lietuviškomis", "casinos-com-10-gratis-de-bonus.jpg", '"imageId":101'],
    ],
    "content-text" => [
        "content" => '<!-- wp:new-theme/content-section {"kind":"text","title":"Tekstas","items":[{"heading":"Grupė","left":"<p>Kairė</p>","right":"<p>Dešinė</p>"}]} /-->',
        "changes" => ["new-theme/content-section" => 1],
        "contains" => ["Tekstas", "Grupė", "Kairė", "Dešinė", "wp:columns"],
    ],
    "content-about" => [
        "content" => '<!-- wp:new-theme/content-section {"kind":"about","title":"Apie","text":"<p>Aprašymas</p>","image":"https://example.com/media.jpg","imageId":42} /-->',
        "changes" => ["new-theme/content-section" => 1],
        "contains" => ["Apie", "Aprašymas", "https://example.com/media.jpg", '"id":42'],
    ],
    "two-column" => [
        "content" => '<!-- wp:new-theme/two-column-text {"title":"Du stulpeliai","items":[{"left":"<p>A</p>","right":"<p>B</p>"}]} /-->',
        "changes" => ["new-theme/two-column-text" => 1],
        "contains" => ["Du stulpeliai", "wp:columns", "<p>A</p>", "<p>B</p>"],
    ],
    "about-list" => [
        "content" => '<!-- wp:new-theme/about-list {"title":"Privalumai","items":[{"title":"Greita","description":"<p>Aprašymas</p>"}]} /-->',
        "changes" => ["new-theme/about-list" => 1],
        "contains" => ["Privalumai", "Greita", "Aprašymas", "nt-benefits-list"],
    ],
    "info-grid-links" => [
        "content" => '<!-- wp:new-theme/info-grid {"title":"Informacija","items":[{"text":"<p>Sąlygos</p>","linkLabel":"Plačiau","linkUrl":"/salygos/"}]} /-->',
        "changes" => ["new-theme/info-grid" => 1],
        "contains" => ["Informacija", "Sąlygos", "Plačiau", "/salygos/"],
    ],
    "data-table-highlights" => [
        "content" => '<!-- wp:new-theme/data-table {"title":"Palyginimas","headers":["Kazino","Premija"],"rows":[["A","€100"],["B","€200"]],"highlightedRows":[1],"highlightedCells":["0:1"]} /-->',
        "changes" => ["new-theme/data-table" => 1],
        "contains" => ["Palyginimas", "Kazino", "€200", "<mark>€100</mark>", "<mark>B</mark>"],
    ],
    "card-grid-children" => [
        "content" => '<!-- wp:new-theme/card-grid {"title":"Kortelės"} --><!-- wp:new-theme/link-card {"title":"Gidas","text":"Tekstas","image":"https://example.com/card.jpg","url":"/gidas/"} /--><!-- /wp:new-theme/card-grid -->',
        "changes" => ["new-theme/card-grid" => 1, "new-theme/link-card" => 1],
        "contains" => ["Kortelės", "Gidas", "https://example.com/card.jpg", "/gidas/", "wp:columns"],
    ],
    "standalone-link-card" => [
        "content" => '<!-- wp:new-theme/link-card {"title":"Nuoroda","url":"https://example.com/"} /-->',
        "changes" => ["new-theme/link-card" => 1],
        "contains" => ["wp:new-theme/section", "Nuoroda", "https://example.com/"],
    ],
    "faq-children" => [
        "content" => '<!-- wp:new-theme/faq {"title":"DUK"} --><!-- wp:new-theme/faq-item {"question":"Klausimas?","answer":"<p>Atsakymas.</p>"} /--><!-- /wp:new-theme/faq -->',
        "changes" => ["new-theme/faq" => 1, "new-theme/faq-item" => 1],
        "contains" => ["DUK", "wp:details", "Klausimas?", "Atsakymas."],
    ],
    "standalone-faq-item" => [
        "content" => '<!-- wp:new-theme/faq-item {"question":"Vienas?","answer":"Atsakymas"} /-->',
        "changes" => ["new-theme/faq-item" => 1],
        "contains" => ["wp:new-theme/section", "wp:details", "Vienas?", "Atsakymas"],
    ],
    "related-links-tracking" => [
        "content" => '<!-- wp:new-theme/related-links {"title":"Susiję","introText":"<p>Rinkitės temą.</p>","variant":"grid","items":[{"title":"Gidas","text":"Aprašymas","url":"/gidas/","linkLabel":"Skaityti","image":"https://example.com/link.jpg"}]} /-->',
        "changes" => ["new-theme/related-links" => 1],
        "contains" => ["Susiję", "Rinkitės", "/gidas/", "nt-internal-links", "nt-internal-link"],
    ],
    "recursive-group" => [
        "content" => '<!-- wp:group --><div class="wp-block-group"><!-- wp:new-theme/about-list {"title":"Vidinis","items":[{"title":"Punktas","description":"Tekstas"}]} /--></div><!-- /wp:group -->',
        "changes" => ["new-theme/about-list" => 1],
        "contains" => ["wp:group", "wp:new-theme/section", "Vidinis", "Punktas", "Tekstas"],
    ],
];
