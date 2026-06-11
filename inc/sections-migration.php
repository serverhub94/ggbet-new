<?php
/**
 * WP-CLI migration from legacy content blocks to new-theme/section and core blocks.
 *
 * @package NewTheme
 */

if (!defined("ABSPATH") || !defined("WP_CLI") || !WP_CLI) {
    exit();
}

final class New_Theme_Sections_Migrator
{
    private const BACKUP_META_KEY = "_new_theme_sections_backup";

    private const LEGACY_BLOCKS = [
        "new-theme/hero",
        "new-theme/content-section",
        "new-theme/two-column-text",
        "new-theme/about-list",
        "new-theme/info-grid",
        "new-theme/data-table",
        "new-theme/card-grid",
        "new-theme/link-card",
        "new-theme/faq",
        "new-theme/faq-item",
        "new-theme/related-links",
    ];

    public static function legacy_blocks(): array
    {
        return self::LEGACY_BLOCKS;
    }

    public static function audit_content(string $content): array
    {
        $counts = array_fill_keys(self::LEGACY_BLOCKS, 0);
        self::count_blocks(parse_blocks($content), $counts);
        return array_filter($counts);
    }

    public static function migrate_content(string $content, ?array &$changes = null): string
    {
        $changes = array_fill_keys(self::LEGACY_BLOCKS, 0);
        $blocks = self::transform_blocks(parse_blocks($content), $changes);
        $changes = array_filter($changes);

        return serialize_blocks($blocks);
    }

    public static function backup_meta_key(): string
    {
        return self::BACKUP_META_KEY;
    }

    private static function count_blocks(array $blocks, array &$counts): void
    {
        foreach ($blocks as $block) {
            $name = $block["blockName"] ?? null;
            if (is_string($name) && array_key_exists($name, $counts) && self::is_legacy_block($block)) {
                $counts[$name]++;
            }

            if (!empty($block["innerBlocks"])) {
                self::count_blocks($block["innerBlocks"], $counts);
            }
        }
    }

    private static function transform_blocks(array $blocks, array &$changes): array
    {
        $result = [];

        foreach ($blocks as $block) {
            $name = $block["blockName"] ?? null;
            if (is_string($name) && in_array($name, self::LEGACY_BLOCKS, true) && self::is_legacy_block($block)) {
                $changes[$name]++;
                $result[] = self::transform_legacy_block($block, $changes);
                continue;
            }

            if (!empty($block["innerBlocks"])) {
                $block["innerBlocks"] = self::transform_blocks($block["innerBlocks"], $changes);
            }

            $result[] = $block;
        }

        return $result;
    }

    private static function is_legacy_block(array $block): bool
    {
        $name = $block["blockName"] ?? null;
        if (!is_string($name) || !in_array($name, self::LEGACY_BLOCKS, true)) {
            return false;
        }

        if ("new-theme/hero" !== $name) {
            return true;
        }

        $attributes = is_array($block["attrs"] ?? null) ? $block["attrs"] : [];
        return array_key_exists("title", $attributes) || array_key_exists("text", $attributes);
    }

    private static function transform_legacy_block(array $block, array &$changes): array
    {
        $attributes = is_array($block["attrs"] ?? null) ? $block["attrs"] : [];

        return match ($block["blockName"]) {
            "new-theme/hero" => self::hero($attributes),
            "new-theme/content-section" => self::content_section($attributes),
            "new-theme/two-column-text" => self::two_column_text($attributes),
            "new-theme/about-list" => self::about_list($attributes),
            "new-theme/info-grid" => self::info_grid($attributes),
            "new-theme/data-table" => self::data_table($attributes),
            "new-theme/card-grid" => self::card_grid($attributes, $block["innerBlocks"] ?? [], $changes),
            "new-theme/link-card" => self::section([self::link_card($attributes)]),
            "new-theme/faq" => self::faq($attributes, $block["innerBlocks"] ?? [], $changes),
            "new-theme/faq-item" => self::section([self::faq_item($attributes)]),
            "new-theme/related-links" => self::related_links($attributes),
            default => $block,
        };
    }

    private static function hero(array $attributes): array
    {
        $image = trim((string) ($attributes["image"] ?? ""));
        if ("" === $image) {
            $image = "assets/img/2022/01/roleta-casino-online.png";
        }
        $hero_attributes = [
            "image" => new_theme_asset_url($image),
            "overlayColor" => (string) ($attributes["overlayColor"] ?? "#000000"),
            "overlayOpacity" => min(90, max(0, (int) ($attributes["overlayOpacity"] ?? 35))),
            "variant" => ($attributes["variant"] ?? "dark") === "light" ? "light" : "dark",
        ];

        if (!empty($attributes["imageId"])) {
            $hero_attributes["imageId"] = (int) $attributes["imageId"];
        }

        $title = (string) ($attributes["title"] ?? "Legalus internetiniai kazino Lietuvoje");
        $children = [self::heading($title, 1)];
        if (!empty($attributes["text"])) {
            $children = array_merge($children, self::rich_text_blocks((string) $attributes["text"]));
        }

        return self::container("new-theme/hero", $hero_attributes, "", "", $children);
    }

    private static function content_section(array $attributes): array
    {
        $kind = (string) ($attributes["kind"] ?? "text");
        if ("text" === $kind) {
            return self::two_column_text($attributes);
        }

        $children = self::optional_heading($attributes["title"] ?? "");
        $content = self::rich_text_blocks((string) ($attributes["text"] ?? ""));
        $image = self::image((string) ($attributes["image"] ?? ""), (int) ($attributes["imageId"] ?? 0));

        if ($image && $content) {
            $children[] = self::columns([
                self::column([$image]),
                self::column($content),
            ]);
        } elseif ($image) {
            $children[] = $image;
        } else {
            $children = array_merge($children, $content);
        }

        return self::section($children, self::background_attributes($attributes));
    }

    private static function two_column_text(array $attributes): array
    {
        $children = self::optional_heading($attributes["title"] ?? "");

        foreach (self::items($attributes["items"] ?? []) as $item) {
            if (!empty($item["heading"])) {
                $children[] = self::heading((string) $item["heading"], 3);
            }

            $children[] = self::columns([
                self::column(self::rich_text_blocks((string) ($item["left"] ?? ""))),
                self::column(self::rich_text_blocks((string) ($item["right"] ?? ""))),
            ]);
        }

        return self::section($children, self::background_attributes($attributes) + ["layout" => "split"]);
    }

    private static function about_list(array $attributes): array
    {
        $children = self::optional_heading($attributes["title"] ?? "");
        $items = [];

        foreach (self::items($attributes["items"] ?? []) as $item) {
            $item_blocks = [];
            if (!empty($item["title"])) {
                $item_blocks[] = self::heading((string) $item["title"], 3);
            }
            $item_blocks = array_merge($item_blocks, self::rich_text_blocks((string) ($item["description"] ?? "")));
            $items[] = self::group($item_blocks, ["className" => "nt-benefit-item"]);
        }

        if ($items) {
            $children[] = self::group($items, ["className" => "nt-benefits-list"]);
        }

        return self::section($children, self::background_attributes($attributes));
    }

    private static function info_grid(array $attributes): array
    {
        $children = self::optional_heading($attributes["title"] ?? "");
        $columns = [];

        foreach (self::items($attributes["items"] ?? []) as $item) {
            $item_blocks = self::rich_text_blocks((string) ($item["text"] ?? ""));
            if (!empty($item["linkLabel"])) {
                $item_blocks[] = self::buttons([
                    self::button((string) $item["linkLabel"], (string) ($item["linkUrl"] ?? "#")),
                ]);
            }
            $columns[] = self::column([self::group($item_blocks)]);
        }

        if ($columns) {
            $children[] = self::columns($columns);
        }

        return self::section($children, self::background_attributes($attributes));
    }

    private static function data_table(array $attributes): array
    {
        $headers = self::items($attributes["headers"] ?? []);
        $rows = self::items($attributes["rows"] ?? []);
        if (!$headers && !empty($attributes["headersText"])) {
            $headers = array_map("trim", explode("|", (string) $attributes["headersText"]));
        }
        if (!$rows && !empty($attributes["rowsText"])) {
            foreach (preg_split('/\r\n|\r|\n/', (string) $attributes["rowsText"]) ?: [] as $line) {
                if ("" !== trim($line)) {
                    $rows[] = array_map("trim", explode("|", $line));
                }
            }
        }

        $highlighted_rows = array_map("intval", self::items($attributes["highlightedRows"] ?? []));
        $highlighted_cells = array_map("strval", self::items($attributes["highlightedCells"] ?? []));
        $table_class = "stacked" === ($attributes["mobileBehavior"] ?? "scroll") ? "nt-table--stacked" : "nt-table--scroll";
        $table_html = '<figure class="wp-block-table ' . esc_attr($table_class) . '"><table><thead><tr>';
        foreach ($headers as $header) {
            $table_html .= "<th>" . wp_kses_post((string) $header) . "</th>";
        }
        $table_html .= "</tr></thead><tbody>";
        foreach ($rows as $row_index => $row) {
            $table_html .= "<tr>";
            foreach (self::items($row) as $cell_index => $cell) {
                $is_highlighted = in_array($row_index, $highlighted_rows, true) || in_array($row_index . ":" . $cell_index, $highlighted_cells, true);
                $content = wp_kses_post((string) $cell);
                $table_html .= "<td>" . ($is_highlighted ? "<mark>" . $content . "</mark>" : $content) . "</td>";
            }
            $table_html .= "</tr>";
        }
        $table_html .= "</tbody></table></figure>";

        $children = self::optional_heading($attributes["title"] ?? "");
        $children[] = self::leaf("core/table", ["className" => $table_class], $table_html);

        return self::section($children, self::background_attributes($attributes) + ["contentWidth" => "wide"]);
    }

    private static function card_grid(array $attributes, array $inner_blocks, array &$changes): array
    {
        $children = self::optional_heading($attributes["title"] ?? "");
        $columns = [];

        foreach ($inner_blocks as $inner_block) {
            if (($inner_block["blockName"] ?? "") === "new-theme/link-card") {
                $changes["new-theme/link-card"]++;
                $columns[] = self::column([self::link_card((array) ($inner_block["attrs"] ?? []))]);
                continue;
            }
            $transformed = self::transform_blocks([$inner_block], $changes);
            $columns[] = self::column($transformed);
        }

        if ($columns) {
            $children[] = self::columns($columns);
        }

        return self::section($children);
    }

    private static function link_card(array $attributes): array
    {
        $children = [];
        $image = self::image((string) ($attributes["image"] ?? ""), (int) ($attributes["imageId"] ?? 0), (string) ($attributes["title"] ?? ""));
        if ($image) {
            $children[] = $image;
        }
        if (!empty($attributes["title"])) {
            $children[] = self::heading((string) $attributes["title"], 3);
        }
        $children = array_merge($children, self::rich_text_blocks((string) ($attributes["text"] ?? "")));
        $children[] = self::buttons([self::button(__("Открыть", "new-theme"), (string) ($attributes["url"] ?? "#"))]);

        return self::group($children, ["className" => "nt-link-card"]);
    }

    private static function faq(array $attributes, array $inner_blocks, array &$changes): array
    {
        $children = self::optional_heading($attributes["title"] ?? "Dazniausiai uzduodami klausimai");

        foreach ($inner_blocks as $inner_block) {
            if (($inner_block["blockName"] ?? "") === "new-theme/faq-item") {
                $changes["new-theme/faq-item"]++;
                $children[] = self::faq_item((array) ($inner_block["attrs"] ?? []));
                continue;
            }
            $children = array_merge($children, self::transform_blocks([$inner_block], $changes));
        }

        return self::section($children);
    }

    private static function faq_item(array $attributes): array
    {
        $summary = esc_html((string) ($attributes["question"] ?? ""));
        $children = self::rich_text_blocks((string) ($attributes["answer"] ?? ""));
        return self::container("core/details", [], '<details class="wp-block-details"><summary>' . $summary . "</summary>", "</details>", $children);
    }

    private static function related_links(array $attributes): array
    {
        $children = self::optional_heading($attributes["title"] ?? "");
        $children = array_merge($children, self::rich_text_blocks((string) ($attributes["introText"] ?? "")));
        $columns = [];

        foreach (self::items($attributes["items"] ?? []) as $item) {
            $card = [];
            $image = self::image((string) ($item["image"] ?? ""), (int) ($item["imageId"] ?? 0), (string) ($item["title"] ?? ""));
            if ($image) {
                $card[] = $image;
            }
            if (!empty($item["title"])) {
                $card[] = self::heading((string) $item["title"], 3);
            }
            $card = array_merge($card, self::rich_text_blocks((string) ($item["text"] ?? "")));
            $link_label = trim((string) ($item["linkLabel"] ?? "")) ?: __("Skaityti daugiau", "new-theme");
            $card[] = self::buttons([
                self::button($link_label, (string) ($item["url"] ?? "#"), ["className" => "nt-internal-link"]),
            ]);
            $columns[] = self::column([self::group($card, ["className" => "nt-related-link-card"])]);
        }

        if ($columns) {
            $children[] = self::columns($columns, ["className" => "nt-related-links--" . sanitize_html_class((string) ($attributes["variant"] ?? "cards"))]);
        }

        return self::section($children, self::background_attributes($attributes) + ["className" => "nt-internal-links"]);
    }

    private static function background_attributes(array $attributes): array
    {
        $background = trim((string) ($attributes["background"] ?? ""));
        return $background ? ["backgroundType" => "color", "backgroundColor" => $background] : [];
    }

    private static function spacing_token(int $pixels): string
    {
        if ($pixels <= 0) {
            return "none";
        }
        if ($pixels <= 16) {
            return "s";
        }
        if ($pixels <= 32) {
            return "m";
        }
        if ($pixels <= 48) {
            return "l";
        }
        return "xl";
    }

    private static function optional_heading(mixed $title, int $level = 2): array
    {
        return "" !== trim((string) $title) ? [self::heading((string) $title, $level)] : [];
    }

    private static function rich_text_blocks(string $html, array $attributes = []): array
    {
        $html = trim($html);
        if ("" === $html) {
            return [];
        }
        if (str_contains($html, "<!-- wp:")) {
            return parse_blocks($html);
        }
        if (!class_exists("DOMDocument")) {
            return [self::leaf("core/html", [], wp_kses_post($html))];
        }

        $document = new DOMDocument("1.0", "UTF-8");
        $previous = libxml_use_internal_errors(true);
        $loaded = $document->loadHTML('<?xml encoding="utf-8" ?><div id="nt-migration-root">' . $html . "</div>", LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        libxml_clear_errors();
        libxml_use_internal_errors($previous);
        $root = $document->getElementById("nt-migration-root");
        if (!$loaded || !$root) {
            return [self::leaf("core/html", [], wp_kses_post($html))];
        }

        $blocks = [];
        foreach (iterator_to_array($root->childNodes) as $node) {
            if (XML_TEXT_NODE === $node->nodeType) {
                if ("" !== trim((string) $node->textContent)) {
                    $blocks[] = self::paragraph(esc_html((string) $node->textContent), $attributes);
                }
                continue;
            }
            if (XML_ELEMENT_NODE !== $node->nodeType) {
                continue;
            }

            $tag = strtolower($node->nodeName);
            $inner = self::dom_inner_html($document, $node);
            if ("p" === $tag) {
                $blocks[] = self::paragraph($inner, $attributes);
            } elseif (preg_match('/^h([1-6])$/', $tag, $matches)) {
                $blocks[] = self::heading($inner, (int) $matches[1], $attributes);
            } elseif (in_array($tag, ["ul", "ol"], true)) {
                $list_attributes = "ol" === $tag ? ["ordered" => true] : [];
                $blocks[] = self::leaf("core/list", $list_attributes, "<" . $tag . ' class="wp-block-list">' . $inner . "</" . $tag . ">");
            } else {
                $blocks[] = self::leaf("core/html", [], (string) $document->saveHTML($node));
            }
        }

        return $blocks ?: [self::leaf("core/html", [], wp_kses_post($html))];
    }

    private static function dom_inner_html(DOMDocument $document, DOMNode $node): string
    {
        $html = "";
        foreach ($node->childNodes as $child) {
            $html .= $document->saveHTML($child);
        }
        return $html;
    }

    private static function section(array $children, array $attributes = []): array
    {
        return self::container("new-theme/section", $attributes, "", "", $children);
    }

    private static function heading(string $content, int $level = 2, array $attributes = []): array
    {
        $level = min(6, max(1, $level));
        if (2 !== $level) {
            $attributes["level"] = $level;
        }
        $class = "wp-block-heading" . self::color_class($attributes);
        return self::leaf("core/heading", $attributes, "<h" . $level . ' class="' . esc_attr($class) . '">' . wp_kses_post($content) . "</h" . $level . ">");
    }

    private static function paragraph(string $content, array $attributes = []): array
    {
        $class = trim(self::color_class($attributes));
        $class_attribute = $class ? ' class="' . esc_attr($class) . '"' : "";
        return self::leaf("core/paragraph", $attributes, "<p" . $class_attribute . ">" . wp_kses_post($content) . "</p>");
    }

    private static function color_class(array $attributes): string
    {
        return !empty($attributes["textColor"]) ? " has-" . sanitize_html_class((string) $attributes["textColor"]) . "-color has-text-color" : "";
    }

    private static function image(string $source, int $attachment_id = 0, string $alt = ""): ?array
    {
        $source = trim($source);
        if ("" === $source) {
            return null;
        }

        $attributes = [];
        $image_class = "";
        if ($attachment_id > 0) {
            $attributes["id"] = $attachment_id;
            $image_class = ' class="wp-image-' . $attachment_id . '"';
        }
        $html = '<figure class="wp-block-image"><img src="' . esc_url(new_theme_asset_url($source)) . '" alt="' . esc_attr(wp_strip_all_tags($alt)) . '"' . $image_class . "/></figure>";
        return self::leaf("core/image", $attributes, $html);
    }

    private static function columns(array $columns, array $attributes = []): array
    {
        $class = "wp-block-columns" . (!empty($attributes["className"]) ? " " . $attributes["className"] : "");
        return self::container("core/columns", $attributes, '<div class="' . esc_attr($class) . '">', "</div>", $columns);
    }

    private static function column(array $children): array
    {
        return self::container("core/column", [], '<div class="wp-block-column">', "</div>", $children);
    }

    private static function group(array $children, array $attributes = []): array
    {
        $class = "wp-block-group" . (!empty($attributes["className"]) ? " " . $attributes["className"] : "");
        return self::container("core/group", $attributes, '<div class="' . esc_attr($class) . '">', "</div>", $children);
    }

    private static function buttons(array $children): array
    {
        return self::container("core/buttons", [], '<div class="wp-block-buttons">', "</div>", $children);
    }

    private static function button(string $label, string $url, array $attributes = []): array
    {
        $class = "wp-block-button" . (!empty($attributes["className"]) ? " " . $attributes["className"] : "");
        $html = '<div class="' . esc_attr($class) . '"><a class="wp-block-button__link wp-element-button" href="' . esc_url(new_theme_normalize_url($url)) . '">' . esc_html($label) . "</a></div>";
        return self::leaf("core/button", $attributes, $html);
    }

    private static function leaf(string $name, array $attributes, string $html): array
    {
        return [
            "blockName" => $name,
            "attrs" => $attributes,
            "innerBlocks" => [],
            "innerHTML" => $html,
            "innerContent" => [$html],
        ];
    }

    private static function container(string $name, array $attributes, string $opening, string $closing, array $children): array
    {
        return [
            "blockName" => $name,
            "attrs" => $attributes,
            "innerBlocks" => $children,
            "innerHTML" => $opening . $closing,
            "innerContent" => array_merge([$opening], array_fill(0, count($children), null), [$closing]),
        ];
    }

    private static function items(mixed $items): array
    {
        return is_array($items) ? array_values($items) : [];
    }
}

final class New_Theme_Sections_CLI_Command extends WP_CLI_Command
{
    /**
     * Lists legacy block usage by block name and post IDs.
     *
     * ## OPTIONS
     *
     * [--format=<format>]
     * : table, csv, json, yaml, count, or ids. Default: table.
     */
    public function audit(array $args, array $assoc_args): void
    {
        $database_audit = $this->audit_database();
        $file_audit = $this->audit_theme_files();
        $rows = [];
        foreach (New_Theme_Sections_Migrator::legacy_blocks() as $block_name) {
            $database_record = $database_audit[$block_name];
            $file_record = $file_audit[$block_name];
            $rows[] = [
                "block" => $block_name,
                "count" => $database_record["count"] + $file_record["count"],
                "database_count" => $database_record["count"],
                "post_ids" => implode(",", array_keys($database_record["posts"])),
                "file_count" => $file_record["count"],
                "files" => implode(",", array_keys($file_record["files"])),
            ];
        }

        WP_CLI\Utils\format_items(
            $assoc_args["format"] ?? "table",
            $rows,
            ["block", "count", "database_count", "post_ids", "file_count", "files"],
        );
    }

    /**
     * Migrates legacy blocks and stores the original post_content in post meta.
     *
     * ## OPTIONS
     *
     * [--dry-run]
     * : Report changes without writing to the database.
     */
    public function migrate(array $args, array $assoc_args): void
    {
        $dry_run = WP_CLI\Utils\get_flag_value($assoc_args, "dry-run", false);
        $rows = [];
        $updated = 0;

        foreach ($this->candidate_posts() as $post) {
            $original_content = (string) $post->post_content;
            $changes = [];
            $migrated = New_Theme_Sections_Migrator::migrate_content($original_content, $changes);
            if (!$changes || $migrated === $original_content) {
                continue;
            }

            $rows[] = [
                "ID" => (int) $post->ID,
                "type" => $post->post_type,
                "status" => $post->post_status,
                "blocks" => $this->format_counts($changes),
            ];

            if ($dry_run) {
                continue;
            }

            $backup_created = add_post_meta((int) $post->ID, New_Theme_Sections_Migrator::backup_meta_key(), $original_content, true);
            if ($backup_created) {
                update_post_meta((int) $post->ID, "_new_theme_sections_backup_sha256", hash("sha256", $original_content));
            } else {
                $existing_backup = get_post_meta((int) $post->ID, New_Theme_Sections_Migrator::backup_meta_key(), true);
                if (!is_string($existing_backup) || !hash_equals(hash("sha256", $original_content), hash("sha256", $existing_backup))) {
                    WP_CLI::warning("Post {$post->ID}: existing migration backup does not match current post_content; record skipped.");
                    continue;
                }
                update_post_meta((int) $post->ID, "_new_theme_sections_backup_sha256", hash("sha256", $existing_backup));
            }
            $result = wp_update_post([
                "ID" => (int) $post->ID,
                "post_content" => wp_slash($migrated),
            ], true);

            if (is_wp_error($result)) {
                WP_CLI::warning("Post {$post->ID}: " . $result->get_error_message());
                continue;
            }
            update_post_meta((int) $post->ID, "_new_theme_sections_migrated_at", gmdate("c"));
            $updated++;
        }

        if ($rows) {
            WP_CLI\Utils\format_items("table", $rows, ["ID", "type", "status", "blocks"]);
        }

        if ($dry_run) {
            WP_CLI::success(sprintf("Dry run complete. %d records would be migrated.", count($rows)));
            return;
        }
        WP_CLI::success(sprintf("Migration complete. %d records updated.", $updated));
    }

    /**
     * Restores post_content from the migration backup meta.
     *
     * ## OPTIONS
     *
     * [--post_id=<id>]
     * : Restore only one record.
     *
     * [--dry-run]
     * : Report records without writing to the database.
     */
    public function restore(array $args, array $assoc_args): void
    {
        $dry_run = WP_CLI\Utils\get_flag_value($assoc_args, "dry-run", false);
        $post_id = isset($assoc_args["post_id"]) ? absint($assoc_args["post_id"]) : 0;
        $rows = [];
        $restored = 0;

        foreach ($this->backup_posts($post_id) as $post) {
            $backup = get_post_meta((int) $post->ID, New_Theme_Sections_Migrator::backup_meta_key(), true);
            if (!is_string($backup) || "" === $backup || $backup === (string) $post->post_content) {
                continue;
            }

            $backup_hash = hash("sha256", $backup);
            $stored_hash = get_post_meta((int) $post->ID, "_new_theme_sections_backup_sha256", true);
            if (is_string($stored_hash) && "" !== $stored_hash && !hash_equals($stored_hash, $backup_hash)) {
                WP_CLI::warning("Post {$post->ID}: migration backup checksum mismatch; record skipped.");
                continue;
            }

            $rows[] = [
                "ID" => (int) $post->ID,
                "type" => $post->post_type,
                "status" => $post->post_status,
                "backup_sha256" => $backup_hash,
            ];
            if ($dry_run) {
                continue;
            }

            $result = wp_update_post([
                "ID" => (int) $post->ID,
                "post_content" => wp_slash($backup),
            ], true);
            if (is_wp_error($result)) {
                WP_CLI::warning("Post {$post->ID}: " . $result->get_error_message());
                continue;
            }

            delete_post_meta((int) $post->ID, "_new_theme_sections_migrated_at");
            $restored++;
        }

        if ($rows) {
            WP_CLI\Utils\format_items("table", $rows, ["ID", "type", "status", "backup_sha256"]);
        }
        if ($dry_run) {
            WP_CLI::success(sprintf("Restore dry run complete. %d records would be restored.", count($rows)));
            return;
        }
        WP_CLI::success(sprintf("Restore complete. %d records restored.", $restored));
    }

    /**
     * Fails when active content still contains legacy blocks.
     */
    public function verify(array $args, array $assoc_args): void
    {
        $database_audit = $this->audit_database();
        $file_audit = $this->audit_theme_files();
        $remaining = array_sum(array_column($database_audit, "count")) + array_sum(array_column($file_audit, "count"));
        if ($remaining > 0) {
            foreach ($database_audit as $block_name => $record) {
                if ($record["count"] > 0) {
                    WP_CLI::warning($block_name . ": " . $record["count"] . " in posts " . implode(",", array_keys($record["posts"])));
                }
            }
            foreach ($file_audit as $block_name => $record) {
                if ($record["count"] > 0) {
                    WP_CLI::warning($block_name . ": " . $record["count"] . " in theme files " . implode(",", array_keys($record["files"])));
                }
            }
            WP_CLI::error(sprintf("Verification failed: %d legacy block instances remain.", $remaining));
        }

        WP_CLI::success("Verification passed: no legacy section blocks remain in active content or theme content files.");
    }

    /**
     * Runs converter fixtures without touching the database.
     */
    public function self_test(array $args, array $assoc_args): void
    {
        $fixtures = require get_template_directory() . "/tests/fixtures/sections-migration.php";
        foreach ($fixtures as $name => $fixture) {
            $content = $fixture["content"];
            $changes = [];
            $migrated = New_Theme_Sections_Migrator::migrate_content($content, $changes);
            $remaining = New_Theme_Sections_Migrator::audit_content($migrated);
            $second_changes = [];
            $second_pass = New_Theme_Sections_Migrator::migrate_content($migrated, $second_changes);
            $expected_changes = $fixture["changes"] ?? [];
            ksort($changes);
            ksort($expected_changes);
            if (!$changes || $remaining || $migrated !== $second_pass || $second_changes || $changes !== $expected_changes) {
                WP_CLI::error("Fixture failed: " . $name);
            }
            foreach ($fixture["contains"] as $expected) {
                if (!str_contains($migrated, $expected)) {
                    WP_CLI::error("Fixture lost expected content ({$expected}): " . $name);
                }
            }
        }

        WP_CLI::success(sprintf("%d migration fixtures passed.", count($fixtures)));
    }

    private function audit_database(): array
    {
        $audit = [];
        foreach (New_Theme_Sections_Migrator::legacy_blocks() as $block_name) {
            $audit[$block_name] = ["count" => 0, "posts" => []];
        }

        foreach ($this->candidate_posts() as $post) {
            foreach (New_Theme_Sections_Migrator::audit_content((string) $post->post_content) as $block_name => $count) {
                $audit[$block_name]["count"] += $count;
                $audit[$block_name]["posts"][(int) $post->ID] = $count;
            }
        }

        return $audit;
    }

    private function audit_theme_files(): array
    {
        $audit = [];
        foreach (New_Theme_Sections_Migrator::legacy_blocks() as $block_name) {
            $audit[$block_name] = ["count" => 0, "files" => []];
        }

        foreach ($this->candidate_theme_files() as $relative_path => $absolute_path) {
            $content = file_get_contents($absolute_path);
            if (!is_string($content) || !str_contains($content, "<!-- wp:new-theme/")) {
                continue;
            }

            foreach (New_Theme_Sections_Migrator::audit_content($content) as $block_name => $count) {
                $audit[$block_name]["count"] += $count;
                $audit[$block_name]["files"][$relative_path] = $count;
            }
        }

        return $audit;
    }

    private function candidate_theme_files(): array
    {
        $theme_directory = wp_normalize_path(get_template_directory());
        $files = [];

        foreach (["templates", "parts", "patterns"] as $directory_name) {
            $directory = $theme_directory . "/" . $directory_name;
            if (!is_dir($directory)) {
                continue;
            }

            $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($directory, FilesystemIterator::SKIP_DOTS));
            foreach ($iterator as $file) {
                if (!$file->isFile() || !in_array(strtolower($file->getExtension()), ["html", "php"], true)) {
                    continue;
                }

                $absolute_path = wp_normalize_path($file->getPathname());
                $relative_path = ltrim(substr($absolute_path, strlen($theme_directory)), "/");
                $files[$relative_path] = $absolute_path;
            }
        }

        ksort($files);
        return $files;
    }

    private function candidate_posts(): array
    {
        global $wpdb;

        return $wpdb->get_results(
            "SELECT ID, post_type, post_status, post_title, post_content
             FROM {$wpdb->posts}
             WHERE post_type NOT IN ('revision', 'attachment')
               AND post_status NOT IN ('auto-draft', 'trash')
               AND post_content LIKE '%<!-- wp:new-theme/%'
             ORDER BY ID ASC",
        );
    }

    private function backup_posts(int $post_id = 0): array
    {
        global $wpdb;

        $sql = $wpdb->prepare(
            "SELECT DISTINCT p.ID, p.post_type, p.post_status, p.post_title, p.post_content
             FROM {$wpdb->posts} p
             INNER JOIN {$wpdb->postmeta} pm ON pm.post_id = p.ID
             WHERE pm.meta_key = %s
               AND p.post_type NOT IN ('revision', 'attachment')
               AND p.post_status NOT IN ('auto-draft', 'trash')",
            New_Theme_Sections_Migrator::backup_meta_key(),
        );
        if ($post_id > 0) {
            $sql .= $wpdb->prepare(" AND p.ID = %d", $post_id);
        }
        $sql .= " ORDER BY p.ID ASC";

        return $wpdb->get_results($sql);
    }

    private function format_counts(array $counts): string
    {
        $parts = [];
        foreach ($counts as $block_name => $count) {
            $parts[] = str_replace("new-theme/", "", $block_name) . ":" . $count;
        }
        return implode(", ", $parts);
    }
}

WP_CLI::add_command("new-theme sections", "New_Theme_Sections_CLI_Command");
