<?php
/**
 * Seed casino_offer CPT posts from front-page attribute cards data.
 * Run via: docker exec wordpress_app php /var/www/html/wp-content/themes/new-theme/seed-offers.php
 *
 * Idempotent: skips posts that already exist by post_name (slug).
 */

if ( 'cli' !== php_sapi_name() && ! defined( 'WP_CLI' ) ) {
    exit;
}

define( 'ABSPATH_SEED', true );
$_SERVER['HTTP_HOST'] = 'localhost';

require_once '/var/www/html/wp-load.php';

$pm = array(
	'mbway'           => 'assets/img/2021/06/mbway-logo.svg',
	'multibanco'      => 'assets/img/2021/06/multibanco-logo.svg',
	'mastercard'      => 'assets/img/2020/12/pm_mastercard.svg',
	'visa'            => 'assets/img/2020/12/pm_visa.svg',
	'paypal'          => 'assets/img/2021/03/paypal.png',
	'skrill'          => 'assets/img/2020/12/pm_skrill.svg',
	'neteller'        => 'assets/img/2021/02/neteller.png',
	'applepay'        => 'assets/img/2021/03/applepay.png',
	'googlepay'       => 'assets/img/2025/09/google-pay-logo.png',
	'maestro'         => 'assets/img/2021/06/maestro-logo.svg',
	'paysafecard'     => 'assets/img/2021/04/paysafecard.png',
	'transfer'        => 'assets/img/2021/05/icono-transferencia.svg',
	'crypto'          => 'assets/img/2025/06/pay-with-crypto.svg',
	'crypto2'         => 'assets/img/2025/11/tradebp_crypto.png',
);

$p = fn( array $keys ) => implode( "\n", array_map( fn( $k ) => $pm[ $k ], $keys ) );

$casinos = array(
	array(
		'name'           => 'Solverde',
		'slug'           => 'solverde-casino',
		'menu_order'     => 1,
		'rating'         => '4',
		'bonus'          => '€100',
		'features'       => "25 nemokami sukimai\n100% premija iki 100 EUR\n+5000 zaidimu ir JetX",
		'logo'           => 'assets/img/2021/08/SolverdePT_verde-azul-logo.svg',
		'payments'       => $p( [ 'mbway', 'multibanco', 'mastercard', 'visa', 'paypal', 'applepay', 'skrill', 'neteller', 'transfer', 'paysafecard', 'crypto' ] ),
		'offer_url'      => '/ir/solverde-casino/',
		'review_url'     => '/casino-solverde-bonus/',
		'is_legal'       => true,
		'license_status' => 'SRIJ',
		'category'       => 'casino',
	),
	array(
		'name'           => 'Betclic',
		'slug'           => 'betclic-casino',
		'menu_order'     => 2,
		'rating'         => '4',
		'bonus'          => '€40',
		'features'       => "40 EUR premija uz 1-aji depozita\n+2000 automatu ir +15 crash zaidimu\nGreiti ismokejimai",
		'logo'           => 'assets/img/2021/05/betclic-logo.svg',
		'payments'       => $p( [ 'mbway', 'multibanco', 'mastercard', 'visa', 'skrill', 'transfer', 'paysafecard' ] ),
		'offer_url'      => '/ir/betclic-casino/',
		'review_url'     => '/betclic-casino/',
		'is_legal'       => true,
		'license_status' => 'SRIJ',
		'category'       => 'casino',
	),
	array(
		'name'           => 'Bwin',
		'slug'           => 'bwin-casino',
		'menu_order'     => 3,
		'rating'         => '4',
		'bonus'          => '€10',
		'features'       => "100 nemokamu sukimu\n+1600 automatu ir +20 jackpotu\nGreiti ismokejimai",
		'logo'           => 'assets/img/2021/10/bwin-logo.svg',
		'payments'       => $p( [ 'mbway', 'multibanco', 'mastercard', 'visa', 'paypal', 'applepay', 'transfer' ] ),
		'offer_url'      => '/ir/bwin-casino/',
		'review_url'     => '/bwin-portugal/',
		'is_legal'       => true,
		'license_status' => 'SRIJ',
		'category'       => 'casino',
	),
	array(
		'name'           => 'VERSUSbet',
		'slug'           => 'versusbet-casino',
		'menu_order'     => 4,
		'rating'         => '3',
		'bonus'          => '€100',
		'features'       => "100% premija iki 100 EUR\nSavaitines papildymo premijos\nGreiti ismokejimai",
		'logo'           => 'assets/img/2025/10/logo-versusbet-2.png',
		'payments'       => $p( [ 'mbway', 'multibanco', 'mastercard', 'visa', 'paypal', 'transfer' ] ),
		'offer_url'      => '/ir/versusbet-casino/',
		'review_url'     => '/versusbet/',
		'is_legal'       => true,
		'license_status' => 'SRIJ',
		'category'       => 'casino',
	),
	array(
		'name'           => 'ESC Online',
		'slug'           => 'esconline-casino',
		'menu_order'     => 5,
		'rating'         => '5',
		'bonus'          => '€250',
		'features'       => "30 nemokamu sukimu Fakir automate\n100% premija iki 250 EUR\n+1500 zaidimu ir kazino boostai",
		'logo'           => 'assets/img/2021/05/esc-online-logo.svg',
		'payments'       => $p( [ 'mbway', 'multibanco', 'mastercard', 'visa', 'skrill', 'neteller', 'transfer', 'paysafecard' ] ),
		'offer_url'      => '/ir/esconline-casino/',
		'review_url'     => '/esc-online-bonus-apostas/',
		'is_legal'       => true,
		'license_status' => 'SRIJ',
		'category'       => 'casino',
	),
	array(
		'name'           => 'Betano',
		'slug'           => 'betano-casino',
		'menu_order'     => 6,
		'rating'         => '5',
		'bonus'          => '€200',
		'features'       => "100% premija iki 200 EUR\n+3000 automatu ir +20 crash zaidimu\nGreiti ismokejimai",
		'logo'           => 'assets/img/2021/08/betano-logo.svg',
		'payments'       => $p( [ 'mbway', 'multibanco', 'mastercard', 'visa', 'skrill', 'googlepay', 'applepay', 'neteller', 'transfer', 'paysafecard', 'maestro' ] ),
		'offer_url'      => '/ir/betano-casino/',
		'review_url'     => '/betano-casino/',
		'is_legal'       => true,
		'license_status' => 'SRIJ',
		'category'       => 'casino',
	),
	array(
		'name'           => 'Luckia',
		'slug'           => 'luckia-casino',
		'menu_order'     => 7,
		'rating'         => '3',
		'bonus'          => '€500',
		'features'       => "100% premija iki 500 EUR\n+800 kazino zaidimu\nIsmokejimai iki 72 darbo val.",
		'logo'           => 'assets/img/2021/04/luckia-logo.svg.svg',
		'payments'       => $p( [ 'mbway', 'multibanco', 'mastercard', 'visa', 'paypal', 'skrill', 'neteller', 'transfer', 'paysafecard' ] ),
		'offer_url'      => '/ir/luckia-casino/',
		'review_url'     => '/luckia-casino/',
		'is_legal'       => true,
		'license_status' => 'SRIJ',
		'category'       => 'casino',
	),
	array(
		'name'           => '888 Casino',
		'slug'           => '888-casino',
		'menu_order'     => 8,
		'rating'         => '3',
		'bonus'          => '€250',
		'features'       => "88 nemokami sukimai\n100% premija iki 250 EUR\nIsmokejimai iki 72 val.",
		'logo'           => 'assets/img/2021/08/888-casino-logo-transparent.png',
		'payments'       => $p( [ 'mbway', 'multibanco', 'mastercard', 'visa', 'paypal', 'skrill', 'transfer' ] ),
		'offer_url'      => '/ir/888-casino/',
		'review_url'     => '/888-casino-bonus/',
		'is_legal'       => true,
		'license_status' => 'SRIJ',
		'category'       => 'casino',
	),
	array(
		'name'           => 'BacanaPlay',
		'slug'           => 'bacanaplay-casino',
		'menu_order'     => 9,
		'rating'         => '4',
		'bonus'          => '€1200',
		'features'       => "100 nemokamu sukimu\n100% premija iki 1200 EUR\n+2000 prieinamu automatu",
		'logo'           => 'assets/img/2020/11/bacana-play-logo.svg',
		'payments'       => $p( [ 'mbway', 'multibanco', 'mastercard', 'visa', 'paypal', 'transfer', 'paysafecard' ] ),
		'offer_url'      => '/ir/bacanaplay-casino/',
		'review_url'     => '/bacana-play-casino-portugal/',
		'is_legal'       => true,
		'license_status' => 'SRIJ',
		'category'       => 'casino',
	),
	array(
		'name'           => 'Casino Portugal',
		'slug'           => 'casino-portugal',
		'menu_order'     => 10,
		'rating'         => '3',
		'bonus'          => '€100',
		'features'       => "50 nemokamu sukimu\n+1900 automatu ir +10 crash zaidimu\nGreiti ismokejimai",
		'logo'           => 'assets/img/2018/10/casino-portugal-logo.svg',
		'payments'       => $p( [ 'mbway', 'multibanco', 'mastercard', 'visa', 'paypal', 'skrill', 'googlepay', 'applepay', 'transfer', 'paysafecard', 'crypto2' ] ),
		'offer_url'      => '/ir/casinoportugal-casino/',
		'review_url'     => '/casino-portugal-bonus/',
		'is_legal'       => true,
		'license_status' => 'SRIJ',
		'category'       => 'casino',
	),
	array(
		'name'           => 'Nossa Aposta',
		'slug'           => 'nossaaposta-casino',
		'menu_order'     => 11,
		'rating'         => '4',
		'bonus'          => '€2.5',
		'features'       => "25 nemokami sukimai\n+400 kazino zaidimu\nAutomatai, rulete ir blackjackas",
		'logo'           => 'assets/img/2020/05/nossa-aposta-logo-principal.svg',
		'payments'       => $p( [ 'mbway', 'multibanco', 'mastercard', 'visa', 'skrill', 'neteller', 'transfer' ] ),
		'offer_url'      => '/ir/nossaaposta-casino/',
		'review_url'     => '/nossa-aposta-bonus/',
		'is_legal'       => true,
		'license_status' => 'SRIJ',
		'category'       => 'casino',
	),
	array(
		'name'           => 'Placard.pt',
		'slug'           => 'placard-casino',
		'menu_order'     => 12,
		'rating'         => '3',
		'bonus'          => '€100',
		'features'       => "100% premija iki 100 EUR\n+600 automatu ir 3 crash zaidimai\nGreiti ismokejimai",
		'logo'           => 'assets/img/2020/06/placard-pt-logo.svg',
		'payments'       => $p( [ 'mbway', 'multibanco', 'mastercard', 'visa', 'paypal', 'skrill', 'applepay', 'neteller', 'transfer' ] ),
		'offer_url'      => '/ir/placard-casino/',
		'review_url'     => '/placard-casino/',
		'is_legal'       => true,
		'license_status' => 'SRIJ',
		'category'       => 'casino',
	),
	array(
		'name'           => 'Golden Park',
		'slug'           => 'goldenpark-casino',
		'menu_order'     => 13,
		'rating'         => '3',
		'bonus'          => '€300',
		'features'       => "100% premija iki 300 EUR\n+450 automatu ir 34 jackpotai\nIsmokejimai iki 48 darbo val.",
		'logo'           => 'assets/img/2023/07/golden_park_logo.svg',
		'payments'       => $p( [ 'mbway', 'multibanco', 'visa', 'paypal', 'transfer', 'paysafecard' ] ),
		'offer_url'      => '/ir/goldenpark-casino/',
		'review_url'     => '/golden-park/',
		'is_legal'       => true,
		'license_status' => 'SRIJ',
		'category'       => 'casino',
	),
	array(
		'name'           => 'YoBingo',
		'slug'           => 'yobingo-casino',
		'menu_order'     => 14,
		'rating'         => '2',
		'bonus'          => '€100',
		'features'       => "Naujas kazino\nVienintelis su internetiniu bingo\n100% premija iki 100 EUR",
		'logo'           => 'assets/img/2025/11/YoBingo-Logotipo.svg',
		'payments'       => $p( [ 'mbway', 'multibanco', 'mastercard', 'visa', 'paypal', 'googlepay', 'applepay', 'transfer', 'paysafecard' ] ),
		'offer_url'      => '/ir/yobingo-casino/',
		'review_url'     => '/yobingo/',
		'is_legal'       => true,
		'license_status' => 'SRIJ',
		'category'       => 'casino',
	),
);

$created = 0;
$skipped = 0;

foreach ( $casinos as $casino ) {
	$existing = get_posts( array(
		'name'           => $casino['slug'],
		'post_type'      => 'casino_offer',
		'post_status'    => 'publish',
		'posts_per_page' => 1,
	) );

	if ( ! empty( $existing ) ) {
		echo "SKIP: {$casino['name']} (already exists)\n";
		$skipped++;
		continue;
	}

	$post_id = wp_insert_post( array(
		'post_title'     => $casino['name'],
		'post_name'      => $casino['slug'],
		'post_type'      => 'casino_offer',
		'post_status'    => 'publish',
		'menu_order'     => $casino['menu_order'],
	), true );

	if ( is_wp_error( $post_id ) ) {
		echo "ERROR: {$casino['name']}: " . $post_id->get_error_message() . "\n";
		continue;
	}

	update_post_meta( $post_id, 'logo',           $casino['logo'] );
	update_post_meta( $post_id, 'rating',         $casino['rating'] );
	update_post_meta( $post_id, 'bonus',          $casino['bonus'] );
	update_post_meta( $post_id, 'features',       $casino['features'] );
	update_post_meta( $post_id, 'payments',       $casino['payments'] );
	update_post_meta( $post_id, 'offer_url',      $casino['offer_url'] );
	update_post_meta( $post_id, 'review_url',     $casino['review_url'] );
	update_post_meta( $post_id, 'is_legal',       $casino['is_legal'] );
	update_post_meta( $post_id, 'license_status', $casino['license_status'] );

	wp_set_object_terms( $post_id, $casino['category'], 'offer_category' );
	wp_set_object_terms( $post_id, 'portugal', 'country_market' );

	echo "CREATED: {$casino['name']} (ID: {$post_id}, order: {$casino['menu_order']})\n";
	$created++;
}

echo "\nDone. Created: {$created}, Skipped: {$skipped}\n";
