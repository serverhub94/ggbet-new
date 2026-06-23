( function ( blocks, blockEditor, components, element, i18n ) {
	const { createBlock, getBlockTypes, registerBlockType } = blocks;
	const { InnerBlocks, InspectorControls, MediaUpload, MediaUploadCheck, RichText, useBlockProps } = blockEditor;
	const { Button, ColorPalette, FocalPointPicker, Notice, PanelBody, RangeControl, SelectControl, TextControl, TextareaControl, ToggleControl } = components;
	const { createElement: el, Fragment } = element;
	const { __ } = i18n;
	const { useDispatch, useSelect } = wp.data;
	const ServerSideRender = wp.serverSideRender;

	const themeUrl = ( window.newThemeEditor && window.newThemeEditor.themeUrl ) || '';
	const homeUrl  = ( window.newThemeEditor && window.newThemeEditor.homeUrl ) || '/';
	const sectionPalette = [
		{ name: 'Aposta Green', color: '#12a96a' },
		{ name: 'Rating Yellow', color: '#ffc700' },
		{ name: 'Bonus Orange', color: '#ff8f28' },
		{ name: 'Ink', color: '#1d2129' },
		{ name: 'Soft Gray', color: '#f2f2f3' },
		{ name: 'White', color: '#ffffff' },
	];
	const sectionGradients = [
		{
			label: __( 'Темный teal', 'new-theme' ),
			value: 'dark-teal',
			gradient: 'linear-gradient(180deg, #1d2129 0%, #012325 103.08%)',
		},
		{
			label: __( 'Зеленый и темный', 'new-theme' ),
			value: 'green-ink',
			gradient: 'linear-gradient(135deg, #12a96a 0%, #1d2129 100%)',
		},
		{
			label: __( 'Casino glow', 'new-theme' ),
			value: 'casino-glow',
			gradient: 'linear-gradient(135deg, #11151c 0%, #12a96a 52%, #ffc700 100%)',
		},
		{
			label: __( 'Светлый', 'new-theme' ),
			value: 'soft-light',
			gradient: 'linear-gradient(180deg, #ffffff 0%, #f2f2f3 100%)',
		},
	];
	const sectionPaletteBySlug = {
		'aposta-green': '#12a96a',
		'rating-yellow': '#ffc700',
		'bonus-orange': '#ff8f28',
		ink: '#1d2129',
		'soft-gray': '#f2f2f3',
		white: '#ffffff',
	};
	const forbiddenSectionBlocks = [
		'new-theme/section',
		'new-theme/hero',
		'new-theme/page-main',
		'new-theme/site-header',
		'new-theme/site-footer',
		'new-theme/age-disclaimer',
		'core/template-part',
	];

	const text = ( label, value, onChange, help ) =>
		el( TextControl, { label, value: value || '', onChange, help } );

	const textarea = ( label, value, onChange, help ) =>
		el( TextareaControl, { label, value: value || '', onChange, help, rows: 5 } );

	const splitLines = ( value ) =>
		( value || '' )
			.split( /\r?\n|,/ )
			.map( ( item ) => item.trim() )
			.filter( Boolean );

	const clone = ( value ) => JSON.parse( JSON.stringify( value || [] ) );

	const simpleRepeater = ( label, items, onChange, defaults, renderItem ) =>
		el(
			PanelBody,
			{ title: label, initialOpen: false },
			( items || [] ).map( ( item, index ) =>
				el(
					'div',
					{ key: index, style: { borderTop: '1px solid #ddd', paddingTop: 12, marginTop: 12 } },
					renderItem( item || {}, index, ( patch ) => {
						const next = clone( items );
						next[ index ] = { ...( next[ index ] || {} ), ...patch };
						onChange( next );
					} ),
					el(
						Button,
						{
							isDestructive: true,
							variant: 'link',
							onClick: () => {
								const next = clone( items );
								next.splice( index, 1 );
								onChange( next );
							},
						},
						'Удалить'
					)
				)
			),
			el(
				Button,
				{
					variant: 'secondary',
					onClick: () => onChange( [ ...( items || [] ), { ...defaults } ] ),
				},
				'Добавить элемент'
			)
		);

	const normalizePreviewHtml = ( html ) =>
		html
			.replace( /\bassets\//g, themeUrl + '/assets/' )
			.replace( /localhost\.com\//g, homeUrl )
			.replace( /localhost\.com/g, homeUrl );

	const hexToRgba = ( value, opacity ) => {
		const hex = ( value || '#000000' ).replace( '#', '' );
		const normalized = hex.length === 3 ? hex.split( '' ).map( ( char ) => char + char ).join( '' ) : hex;
		const bigint = parseInt( normalized, 16 );

		if ( Number.isNaN( bigint ) ) {
			return 'rgba(0, 0, 0, ' + opacity + ')';
		}

		return 'rgba(' + [ ( bigint >> 16 ) & 255, ( bigint >> 8 ) & 255, bigint & 255 ].join( ', ' ) + ', ' + opacity + ')';
	};

	const parseHexColor = ( value ) => {
		const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec( value || '' );
		if ( ! match ) {
			return null;
		}

		const normalized = match[ 1 ].length === 3
			? match[ 1 ].split( '' ).map( ( character ) => character + character ).join( '' )
			: match[ 1 ];

		return [
			parseInt( normalized.slice( 0, 2 ), 16 ),
			parseInt( normalized.slice( 2, 4 ), 16 ),
			parseInt( normalized.slice( 4, 6 ), 16 ),
		];
	};

	const resolveSectionColor = ( value, slug, fallback ) => {
		if ( slug && sectionPaletteBySlug[ slug ] ) {
			return sectionPaletteBySlug[ slug ];
		}
		if ( value && value.indexOf( 'var:preset|color|' ) === 0 ) {
			return sectionPaletteBySlug[ value.split( '|' ).pop() ] || fallback;
		}
		return parseHexColor( value ) ? value : fallback;
	};

	const blendColors = ( background, overlay, opacity ) =>
		background.map( ( channel, index ) => Math.round( channel * ( 1 - opacity ) + overlay[ index ] * opacity ) );

	const relativeLuminance = ( color ) => {
		const channels = color.map( ( channel ) => {
			const value = channel / 255;
			return value <= 0.03928 ? value / 12.92 : Math.pow( ( value + 0.055 ) / 1.055, 2.4 );
		} );
		return channels[ 0 ] * 0.2126 + channels[ 1 ] * 0.7152 + channels[ 2 ] * 0.0722;
	};

	const contrastRatio = ( first, second ) => {
		const firstLuminance = relativeLuminance( first );
		const secondLuminance = relativeLuminance( second );
		const lighter = Math.max( firstLuminance, secondLuminance );
		const darker = Math.min( firstLuminance, secondLuminance );
		return ( lighter + 0.05 ) / ( darker + 0.05 );
	};

	const mediaImageControl = ( label, value, imageId, onChange ) =>
		el(
			'div',
			{ style: { marginBottom: 16 } },
			el( 'p', { style: { marginBottom: 8, fontWeight: 500 } }, label ),
			value ? el( 'img', {
				src: normalizePreviewHtml( value ),
				alt: '',
				style: { display: 'block', maxWidth: '100%', height: 'auto', marginBottom: 12, borderRadius: 4 },
			} ) : null,
			el(
				MediaUploadCheck,
				{},
				el( MediaUpload, {
					allowedTypes: [ 'image' ],
					value: imageId || 0,
					onSelect: ( media ) => onChange( media && media.url ? media.url : '', media && media.id ? media.id : 0 ),
					render: ( { open } ) =>
						el(
							Fragment,
							{},
							el(
								Button,
								{ variant: 'secondary', onClick: open },
								value ? __( 'Заменить изображение', 'new-theme' ) : __( 'Выбрать изображение', 'new-theme' )
							),
							value ? el(
								Button,
								{
									variant: 'link',
									isDestructive: true,
									onClick: () => onChange( '', 0 ),
									style: { marginLeft: 8 },
								},
								__( 'Удалить', 'new-theme' )
							) : null
						),
				} )
			)
		);

	const mediaImagesControl = ( label, value, onChange ) => {
		const images = splitLines( value );

		return el(
			'div',
			{ style: { marginBottom: 16 } },
			el( 'p', { style: { marginBottom: 8, fontWeight: 500 } }, label ),
			images.length ? el(
				'div',
				{ style: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 } },
				images.map( ( image, index ) =>
					el( 'img', {
						key: index,
						src: normalizePreviewHtml( image ),
						alt: '',
						style: { width: '100%', height: 36, objectFit: 'contain', border: '1px solid #ddd', borderRadius: 4, padding: 4 },
					} )
				)
			) : null,
			el(
				MediaUploadCheck,
				{},
				el( MediaUpload, {
					allowedTypes: [ 'image' ],
					multiple: true,
					gallery: true,
					value: [],
					onSelect: ( media ) => {
						const selected = Array.isArray( media ) ? media : [ media ];
						onChange(
							selected
								.map( ( item ) => item && item.url ? item.url : '' )
								.filter( Boolean )
								.join( '\n' )
						);
					},
					render: ( { open } ) =>
						el(
							Fragment,
							{},
							el(
								Button,
								{ variant: 'secondary', onClick: open },
								images.length ? __( 'Заменить изображения', 'new-theme' ) : __( 'Выбрать изображения', 'new-theme' )
							),
							images.length ? el(
								Button,
								{
									variant: 'link',
									isDestructive: true,
									onClick: () => onChange( '' ),
									style: { marginLeft: 8 },
								},
								__( 'Удалить', 'new-theme' )
							) : null
						),
				} )
			)
		);
	};

	// ── age-disclaimer ────────────────────────────────────────────────────────

	registerBlockType( 'new-theme/age-disclaimer', {
		title: __( 'Возрастное предупреждение', 'new-theme' ),
		icon: 'warning',
		category: 'new-theme',
		attributes: {
			text: { type: 'string', default: 'ZAISKITE ATSAKINGAI' },
			linkText: { type: 'string', default: 'YRA KOMERCINIO TURINIO' },
			linkUrl: { type: 'string', default: '/sobre-nos/' },
		},
		edit: ( { attributes, setAttributes } ) =>
			el(
				'div',
				useBlockProps(),
				el(
					InspectorControls,
					{},
					el(
						PanelBody,
						{ title: __( 'Контент', 'new-theme' ) },
						text( 'Текст', attributes.text, ( v ) => setAttributes( { text: v } ) ),
						text( 'Текст ссылки', attributes.linkText, ( v ) => setAttributes( { linkText: v } ) ),
						text( 'URL ссылки', attributes.linkUrl, ( v ) => setAttributes( { linkUrl: v } ) )
					)
				),
				el( ServerSideRender, { block: 'new-theme/age-disclaimer', attributes } )
			),
		save: () => null,
	} );

	// ── site-header ───────────────────────────────────────────────────────────

	const navItemDefaults = ( depth ) => ( {
		label: '',
		url: '/',
		icon: '',
		iconWebp: '',
		iconSrcset: '',
		iconSizes: '',
		iconWidth: 24,
		iconHeight: 24,
		...( depth === 0 ? { badge: '', badgeBg: '#12a96a', badgeColor: '#FFF', isNew: false, isMega: false, isMobileSecondLevel: false } : { isFooter: false, isMobileSecondLevel: false } ),
		children: [],
	} );

	const navItemFields = ( item, depth, onPatch ) => {
		const fields = [
			text( __( 'Метка', 'new-theme' ), item.label, ( v ) => onPatch( { label: v } ) ),
			text( __( 'URL', 'new-theme' ), item.url, ( v ) => onPatch( { url: v } ) ),
			text( __( 'Иконка (путь к файлу)', 'new-theme' ), item.icon || '', ( v ) => onPatch( { icon: v } ) ),
		];
		if ( depth === 0 ) {
			fields.push(
				text( __( 'Текст бейджа', 'new-theme' ), item.badge || '', ( v ) => onPatch( { badge: v } ) ),
				text( __( 'Фон бейджа', 'new-theme' ), item.badgeBg || '#12a96a', ( v ) => onPatch( { badgeBg: v } ) ),
				text( __( 'Цвет текста бейджа', 'new-theme' ), item.badgeColor || '#FFF', ( v ) => onPatch( { badgeColor: v } ) ),
				el( ToggleControl, { label: __( 'Бейдж «новое»', 'new-theme' ), checked: !! item.isNew, onChange: ( v ) => onPatch( { isNew: v } ) } ),
				el( ToggleControl, { label: __( 'Мегаменю', 'new-theme' ), checked: !! item.isMega, onChange: ( v ) => onPatch( { isMega: v } ) } ),
				el( ToggleControl, { label: __( 'Второй уровень на мобильных', 'new-theme' ), checked: !! item.isMobileSecondLevel, onChange: ( v ) => onPatch( { isMobileSecondLevel: v } ) } )
			);
		} else {
			fields.push(
				el( ToggleControl, { label: __( 'Ссылка футера', 'new-theme' ), checked: !! item.isFooter, onChange: ( v ) => onPatch( { isFooter: v } ) } ),
				el( ToggleControl, { label: __( 'Второй уровень на мобильных', 'new-theme' ), checked: !! item.isMobileSecondLevel, onChange: ( v ) => onPatch( { isMobileSecondLevel: v } ) } )
			);
		}
		return fields;
	};

	const navItemsEditor = ( items, onChange, depth ) => {
		const safeItems = items || [];
		const depthLabel = depth === 0 ? 'item' : depth === 1 ? 'sub-item' : 'sub-sub-item';
		return el(
			Fragment,
			{},
			...safeItems.map( ( item, index ) => {
				const onPatch = ( patch ) => {
					const next = clone( safeItems );
					next[ index ] = { ...next[ index ], ...patch };
					onChange( next );
				};
				const onChildChange = ( kids ) => {
					const next = clone( safeItems );
					next[ index ] = { ...next[ index ], children: kids };
					onChange( next );
				};
				const itemLabel = item.label || `(${ depthLabel } ${ index + 1 })`;
				return el(
					PanelBody,
					{ title: itemLabel, initialOpen: false, key: index },
					...navItemFields( item, depth, onPatch ),
					el(
						Button,
						{ isDestructive: true, variant: 'link', style: { marginBottom: 8 }, onClick: () => { const n = clone( safeItems ); n.splice( index, 1 ); onChange( n ); } },
						`Удалить ${ depthLabel }`
					),
					depth < 2 && el(
						PanelBody,
						{ title: `Children (${ ( item.children || [] ).length })`, initialOpen: false },
						navItemsEditor( item.children || [], onChildChange, depth + 1 ),
						el(
							Button,
							{ variant: 'secondary', onClick: () => onChildChange( [ ...( item.children || [] ), navItemDefaults( depth + 1 ) ] ) },
							`Add ${ depth === 0 ? 'sub-item' : 'sub-sub-item' }`
						)
					)
				);
			} ),
			el(
				Button,
				{ variant: 'secondary', style: { marginTop: 8 }, onClick: () => onChange( [ ...safeItems, navItemDefaults( depth ) ] ) },
				`Add ${ depthLabel }`
			)
		);
	};

	registerBlockType( 'new-theme/site-header', {
		title: __( 'Шапка сайта', 'new-theme' ),
		icon: 'menu',
		category: 'new-theme',
		attributes: {
			logo:        { type: 'string', default: 'assets/img/2021/06/logo-aposta-legal.svg' },
			logoId:      { type: 'number' },
			logoLight:   { type: 'string', default: 'assets/img/2021/06/logo-aposta-legal-alternativo.svg' },
			logoLightId: { type: 'number' },
			logoAlt:     { type: 'string', default: 'Aposta Legal' },
			menuItems:   { type: 'array', default: [] },
		},
		edit: ( { attributes, setAttributes } ) => {
			const set = ( key ) => ( val ) => setAttributes( { [ key ]: val } );

			return el(
				'div',
				useBlockProps(),
				el(
					InspectorControls,
					{},
					el(
						PanelBody,
						{ title: __( 'Логотип', 'new-theme' ) },
						mediaImageControl( __( 'Темный логотип', 'new-theme' ), attributes.logo, attributes.logoId, ( logo, logoId ) => setAttributes( { logo, logoId } ) ),
						mediaImageControl( __( 'Светлый логотип', 'new-theme' ), attributes.logoLight, attributes.logoLightId, ( logoLight, logoLightId ) => setAttributes( { logoLight, logoLightId } ) ),
						text( 'Alt-текст', attributes.logoAlt, set( 'logoAlt' ) )
					),
					el(
						PanelBody,
						{ title: __( 'Навигационное меню', 'new-theme' ), initialOpen: false },
						el( 'p', { style: { color: '#666', fontSize: 12, margin: '0 0 8px' } }, __( 'У каждого пункта верхнего уровня могут быть подпункты и вложенные подпункты.', 'new-theme' ) ),
						navItemsEditor( attributes.menuItems, set( 'menuItems' ), 0 )
					)
				),
			el(
					'div',
					{ style: { background: '#1D2129', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12 } },
					attributes.logo && el( 'img', {
						src: themeUrl + '/' + attributes.logo,
						alt: attributes.logoAlt || 'Логотип',
						style: { height: 25, width: 'auto' },
					} ),
					el( 'span', { style: { color: '#9ba8b5', fontSize: 13 } },
						__( 'Шапка сайта — edit Логотип and Navigation in the block sidebar.', 'new-theme' )
					)
				)
			);
		},
		save: () => null,
	} );

	// ── page-main ─────────────────────────────────────────────────────────────

	registerBlockType( 'new-theme/page-main', {
		title: __( 'Основной контейнер страницы', 'new-theme' ),
		icon: 'welcome-widgets-menus',
		category: 'new-theme',
		attributes: {
			schema: { type: 'string', default: '' },
		},
		edit: ( { attributes, setAttributes } ) =>
			el(
				'main',
				useBlockProps( { className: 'page__content' } ),
				el(
					InspectorControls,
					{},
					el( PanelBody, { title: 'Schema' }, textarea( 'JSON-LD schema', attributes.schema, ( v ) => setAttributes( { schema: v } ) ) )
				),
				el( 'div', { className: 'page__overlay' } ),
				el(
					'div',
					{ className: 'page__content-area' },
					el(
						'section',
						{ className: 'page__main header--dark', role: 'main' },
						el( InnerBlocks, { orientation: 'vertical' } )
					)
				)
			),
		save: () => el( InnerBlocks.Content ),
	} );

	// ── section ────────────────────────────────────────────────────────────────

	registerBlockType( 'new-theme/section', {
		title: __( 'Универсальная секция', 'new-theme' ),
		description: __( 'Фон, контейнер и произвольные вложенные блоки Gutenberg.', 'new-theme' ),
		icon: 'layout',
		category: 'new-theme',
		supports: {
			align: [ 'wide', 'full' ],
			anchor: true,
			color: { text: true, link: true },
			html: false,
			reusable: true,
		},
		attributes: {
			backgroundType: { type: 'string', default: 'none' },
			backgroundColor: { type: 'string', default: '' },
			backgroundGradient: { type: 'string', default: 'dark-teal' },
			backgroundImageId: { type: 'number' },
			backgroundImageUrl: { type: 'string', default: '' },
			backgroundPosition: { type: 'object', default: { x: 0.5, y: 0.5 } },
			backgroundSize: { type: 'string', default: 'cover' },
			overlayColor: { type: 'string', default: '#000000' },
			overlayOpacity: { type: 'number', default: 0 },
			contentWidth: { type: 'string', default: 'content' },
			paddingTop: { type: 'string', default: 'l' },
			paddingBottom: { type: 'string', default: 'l' },
			minHeight: { type: 'string', default: 'auto' },
			verticalAlign: { type: 'string', default: 'start' },
			layout: { type: 'string', default: 'stack' },
			stackOnMobile: { type: 'boolean', default: true },
			reverseOnMobile: { type: 'boolean', default: false },
		},
		edit: ( { attributes, clientId, setAttributes } ) => {
			const blockCount = useSelect(
				( select ) => select( 'core/block-editor' ).getBlockCount( clientId ),
				[ clientId ]
			);
			const { insertBlocks } = useDispatch( 'core/block-editor' );
			const allowedSectionBlocks = getBlockTypes()
				.map( ( blockType ) => blockType.name )
				.filter( ( blockName ) => ! forbiddenSectionBlocks.includes( blockName ) );
			const spacing = { none: '0px', s: '16px', m: '32px', l: '48px', xl: '64px' };
			const minHeights = { auto: 'auto', s: '240px', m: '360px', l: '520px', screen: '100vh' };
			const backgroundPosition = attributes.backgroundPosition || { x: 0.5, y: 0.5 };
			const selectedGradient = sectionGradients.find( ( gradient ) => gradient.value === attributes.backgroundGradient ) || sectionGradients[ 0 ];
			const sectionClasses = [
				'nt-content-section',
				'nt-content-section--width-' + ( attributes.contentWidth || 'content' ),
				'nt-content-section--align-' + ( attributes.verticalAlign || 'start' ),
				'nt-content-section--layout-' + ( attributes.layout || 'stack' ),
			];

			if ( attributes.stackOnMobile !== false ) {
				sectionClasses.push( 'nt-content-section--stack-mobile' );
			}
			if ( attributes.reverseOnMobile ) {
				sectionClasses.push( 'nt-content-section--reverse-mobile' );
			}

			const sectionStyle = {
				'--nt-section-padding-top': spacing[ attributes.paddingTop ] || spacing.l,
				'--nt-section-padding-bottom': spacing[ attributes.paddingBottom ] || spacing.l,
				'--nt-section-min-height': minHeights[ attributes.minHeight ] || minHeights.auto,
			};
			if ( attributes.backgroundType === 'color' && attributes.backgroundColor ) {
				sectionStyle[ '--nt-section-background-color' ] = attributes.backgroundColor;
			}

			let contrastWarning = null;
			if ( attributes.backgroundType === 'color' ) {
				const backgroundColor = parseHexColor( attributes.backgroundColor );
				const textColorValue = attributes.style && attributes.style.color ? attributes.style.color.text : '';
				const textColor = parseHexColor( resolveSectionColor( textColorValue, attributes.textColor, '#1d2129' ) );
				const overlayColor = parseHexColor( attributes.overlayColor || '#000000' );
				let effectiveBackground = backgroundColor;

				if ( effectiveBackground && overlayColor && attributes.overlayOpacity > 0 ) {
					effectiveBackground = blendColors( effectiveBackground, overlayColor, Math.min( 100, attributes.overlayOpacity ) / 100 );
				}

				if ( effectiveBackground && textColor ) {
					const ratio = contrastRatio( effectiveBackground, textColor );
					if ( ratio < 4.5 ) {
						contrastWarning = __( 'Контраст текста и фона ниже рекомендуемого уровня.', 'new-theme' ) + ' ' + ratio.toFixed( 1 ) + ':1. ' +
							__( 'Выберите более светлый или тёмный цвет текста либо измените затемнение.', 'new-theme' );
					}
				}
			}

			const insertSplitLayout = () => {
				const columns = createBlock( 'core/columns', {}, [
					createBlock( 'core/column', {}, [
						createBlock( 'core/heading', { level: 2, placeholder: __( 'Заголовок', 'new-theme' ) } ),
						createBlock( 'core/paragraph', { placeholder: __( 'Добавьте текст или другие блоки', 'new-theme' ) } ),
					] ),
					createBlock( 'core/column', {}, [ createBlock( 'core/image' ) ] ),
				] );

				insertBlocks( columns, blockCount, clientId );
			};

			const setLayout = ( layout ) => {
				setAttributes( { layout } );
				if ( layout === 'split' && blockCount === 0 ) {
					insertSplitLayout();
				}
			};

			const inspector = el(
				InspectorControls,
				{},
				contrastWarning ? el(
					Notice,
					{ status: 'warning', isDismissible: false },
					contrastWarning
				) : null,
				el(
					PanelBody,
					{ title: __( 'Макет', 'new-theme' ), initialOpen: true },
					el( SelectControl, {
						label: __( 'Тип макета', 'new-theme' ),
						value: attributes.layout || 'stack',
						options: [
							{ label: __( 'Обычный', 'new-theme' ), value: 'stack' },
							{ label: __( 'Две колонки', 'new-theme' ), value: 'split' },
						],
						onChange: setLayout,
					} ),
					attributes.layout === 'split' && blockCount > 0 ? el(
						Button,
						{ variant: 'secondary', onClick: insertSplitLayout },
						__( 'Добавить двухколоночный макет', 'new-theme' )
					) : null,
					el( SelectControl, {
						label: __( 'Ширина контента', 'new-theme' ),
						value: attributes.contentWidth || 'content',
						options: [
							{ label: __( 'Контентная', 'new-theme' ), value: 'content' },
							{ label: __( 'Широкая', 'new-theme' ), value: 'wide' },
							{ label: __( 'На всю ширину', 'new-theme' ), value: 'full' },
						],
						onChange: ( value ) => setAttributes( { contentWidth: value } ),
					} ),
					el( SelectControl, {
						label: __( 'Вертикальное выравнивание', 'new-theme' ),
						value: attributes.verticalAlign || 'start',
						options: [
							{ label: __( 'Сверху', 'new-theme' ), value: 'start' },
							{ label: __( 'По центру', 'new-theme' ), value: 'center' },
							{ label: __( 'Снизу', 'new-theme' ), value: 'end' },
						],
						onChange: ( value ) => setAttributes( { verticalAlign: value } ),
					} ),
					el( ToggleControl, {
						label: __( 'Складывать колонки на мобильном', 'new-theme' ),
						checked: attributes.stackOnMobile !== false,
						onChange: ( value ) => setAttributes( { stackOnMobile: value } ),
					} ),
					el( ToggleControl, {
						label: __( 'Менять порядок колонок на мобильном', 'new-theme' ),
						checked: !! attributes.reverseOnMobile,
						onChange: ( value ) => setAttributes( { reverseOnMobile: value } ),
					} )
				),
				el(
					PanelBody,
					{ title: __( 'Фон', 'new-theme' ), initialOpen: false },
					el( SelectControl, {
						label: __( 'Тип фона', 'new-theme' ),
						value: attributes.backgroundType || 'none',
						options: [
							{ label: __( 'Без фона', 'new-theme' ), value: 'none' },
							{ label: __( 'Цвет', 'new-theme' ), value: 'color' },
							{ label: __( 'Изображение', 'new-theme' ), value: 'image' },
							{ label: __( 'Градиент', 'new-theme' ), value: 'gradient' },
						],
						onChange: ( value ) => setAttributes( { backgroundType: value } ),
					} ),
					attributes.backgroundType === 'color' ? el( ColorPalette, {
						colors: sectionPalette,
						value: attributes.backgroundColor || '',
						onChange: ( value ) => setAttributes( { backgroundColor: value || '' } ),
						clearable: true,
					} ) : null,
					attributes.backgroundType === 'gradient' ? el( SelectControl, {
						label: __( 'Градиент', 'new-theme' ),
						value: selectedGradient.value,
						options: sectionGradients.map( ( gradient ) => ( {
							label: gradient.label,
							value: gradient.value,
						} ) ),
						onChange: ( value ) => setAttributes( { backgroundGradient: value } ),
					} ) : null,
					attributes.backgroundType === 'image' ? el(
						Fragment,
						{},
						mediaImageControl(
							__( 'Фоновое изображение', 'new-theme' ),
							attributes.backgroundImageUrl,
							attributes.backgroundImageId,
							( backgroundImageUrl, backgroundImageId ) => setAttributes( { backgroundImageUrl, backgroundImageId } )
						),
						attributes.backgroundImageUrl ? el( FocalPointPicker, {
							label: __( 'Точка фокуса', 'new-theme' ),
							url: normalizePreviewHtml( attributes.backgroundImageUrl ),
							value: backgroundPosition,
							onChange: ( value ) => setAttributes( { backgroundPosition: value } ),
						} ) : null,
						el( SelectControl, {
							label: __( 'Размер изображения', 'new-theme' ),
							value: attributes.backgroundSize || 'cover',
							options: [
								{ label: 'Cover', value: 'cover' },
								{ label: 'Contain', value: 'contain' },
								{ label: 'Auto', value: 'auto' },
							],
							onChange: ( value ) => setAttributes( { backgroundSize: value } ),
						} )
					) : null,
					attributes.backgroundType !== 'none' ? el(
						Fragment,
						{},
						el( 'p', {}, __( 'Цвет затемнения', 'new-theme' ) ),
						el( ColorPalette, {
							colors: sectionPalette,
							value: attributes.overlayColor || '#000000',
							onChange: ( value ) => setAttributes( { overlayColor: value || '#000000' } ),
							clearable: false,
						} ),
						el( RangeControl, {
							label: __( 'Прозрачность затемнения', 'new-theme' ),
							value: attributes.overlayOpacity || 0,
							min: 0,
							max: 100,
							onChange: ( value ) => setAttributes( { overlayOpacity: value } ),
						} )
					) : null
				),
				el(
					PanelBody,
					{ title: __( 'Размеры и отступы', 'new-theme' ), initialOpen: false },
					el( SelectControl, {
						label: __( 'Отступ сверху', 'new-theme' ),
						value: attributes.paddingTop || 'l',
						options: [
							{ label: '0', value: 'none' }, { label: 'S', value: 's' }, { label: 'M', value: 'm' },
							{ label: 'L', value: 'l' }, { label: 'XL', value: 'xl' },
						],
						onChange: ( value ) => setAttributes( { paddingTop: value } ),
					} ),
					el( SelectControl, {
						label: __( 'Отступ снизу', 'new-theme' ),
						value: attributes.paddingBottom || 'l',
						options: [
							{ label: '0', value: 'none' }, { label: 'S', value: 's' }, { label: 'M', value: 'm' },
							{ label: 'L', value: 'l' }, { label: 'XL', value: 'xl' },
						],
						onChange: ( value ) => setAttributes( { paddingBottom: value } ),
					} ),
					el( SelectControl, {
						label: __( 'Минимальная высота', 'new-theme' ),
						value: attributes.minHeight || 'auto',
						options: [
							{ label: 'Auto', value: 'auto' }, { label: 'S', value: 's' }, { label: 'M', value: 'm' },
							{ label: 'L', value: 'l' }, { label: '100vh', value: 'screen' },
						],
						onChange: ( value ) => setAttributes( { minHeight: value } ),
					} )
				)
			);

			let backgroundStyle;
			if ( attributes.backgroundType === 'image' && attributes.backgroundImageUrl ) {
				backgroundStyle = {
					backgroundImage: 'url("' + normalizePreviewHtml( attributes.backgroundImageUrl ) + '")',
					backgroundPosition: ( backgroundPosition.x * 100 ) + '% ' + ( backgroundPosition.y * 100 ) + '%',
					backgroundSize: attributes.backgroundSize || 'cover',
				};
			} else if ( attributes.backgroundType === 'gradient' ) {
				backgroundStyle = {
					backgroundImage: selectedGradient.gradient,
				};
			}
			const overlayStyle = attributes.backgroundType !== 'none' && attributes.overlayOpacity > 0 ? {
				backgroundColor: hexToRgba( attributes.overlayColor || '#000000', attributes.overlayOpacity / 100 ),
			} : undefined;

			return el(
				'section',
				useBlockProps( { className: sectionClasses.join( ' ' ), style: sectionStyle } ),
				inspector,
				backgroundStyle ? el( 'div', { className: 'nt-content-section__background', 'aria-hidden': true, style: backgroundStyle } ) : null,
				overlayStyle ? el( 'div', { className: 'nt-content-section__overlay', 'aria-hidden': true, style: overlayStyle } ) : null,
				el(
					'div',
					{ className: 'nt-content-section__container' },
					el( InnerBlocks, {
						allowedBlocks: allowedSectionBlocks,
						orientation: 'vertical',
						renderAppender: InnerBlocks.ButtonBlockAppender,
					} )
				)
			);
		},
		save: () => el( InnerBlocks.Content ),
	} );

	// ── decorative info blocks ────────────────────────────────────────────────

	const allowedCoreContentBlocks = () =>
		getBlockTypes()
			.map( ( blockType ) => blockType.name )
			.filter( ( blockName ) =>
				blockName.indexOf( 'core/' ) === 0 &&
				! [ 'core/template-part', 'core/navigation' ].includes( blockName )
			);
	const iconCardDefaults = [
		{
			icon: 'gift',
			tone: 'orange',
			title: 'Platesni bonusai',
			text: 'Lietuvišką licenciją turinčios svetainės negali laisvai siūlyti didelių pasveikinimo premijų ar nemokamų sukimų. Bonusas turi vertę tik tada, kai jo sąlygos aiškios.',
			note: '',
		},
		{
			icon: 'dice',
			tone: 'violet',
			title: 'Daugiau žaidimų',
			text: 'Tarptautinėse svetainėse galima rasti tūkstančius automatų, gyvo kazino stalų, crash žaidimų ir sporto lažybų rinkų.',
			note: '',
		},
		{
			icon: 'card',
			tone: 'blue',
			title: 'Įvairūs mokėjimo būdai',
			text: 'Elektroninės piniginės, kriptovaliutos ir kelios valiutos. Kiekvienas operatorius turi savo limitus ir tikrinimo tvarką.',
			note: '',
		},
	];
	const iconCardIconOptions = [
		{ label: __( 'Подарок', 'new-theme' ), value: 'gift' },
		{ label: __( 'Кости', 'new-theme' ), value: 'dice' },
		{ label: __( 'Карта', 'new-theme' ), value: 'card' },
		{ label: __( 'Щит', 'new-theme' ), value: 'shield' },
		{ label: __( 'Внешняя ссылка', 'new-theme' ), value: 'external' },
		{ label: __( 'Замок', 'new-theme' ), value: 'lock' },
		{ label: __( 'Звезда', 'new-theme' ), value: 'star' },
	];
	const iconCardToneOptions = [
		{ label: __( 'Оранжевый', 'new-theme' ), value: 'orange' },
		{ label: __( 'Фиолетовый', 'new-theme' ), value: 'violet' },
		{ label: __( 'Голубой', 'new-theme' ), value: 'blue' },
		{ label: __( 'Розовый', 'new-theme' ), value: 'pink' },
		{ label: __( 'Зеленый', 'new-theme' ), value: 'green' },
	];
	const iconCardShapes = {
		gift: [
			[ 'path', { d: 'M20 12v10H4V12' } ],
			[ 'path', { d: 'M2 7h20v5H2z' } ],
			[ 'path', { d: 'M12 22V7' } ],
			[ 'path', { d: 'M12 7H7.5a2.5 2.5 0 1 1 2.1-3.85C10.8 4.7 12 7 12 7Z' } ],
			[ 'path', { d: 'M12 7h4.5a2.5 2.5 0 1 0-2.1-3.85C13.2 4.7 12 7 12 7Z' } ],
		],
		dice: [
			[ 'rect', { x: '4', y: '4', width: '16', height: '16', rx: '3' } ],
			[ 'circle', { cx: '8.5', cy: '8.5', r: '1' } ],
			[ 'circle', { cx: '15.5', cy: '8.5', r: '1' } ],
			[ 'circle', { cx: '12', cy: '12', r: '1' } ],
			[ 'circle', { cx: '8.5', cy: '15.5', r: '1' } ],
			[ 'circle', { cx: '15.5', cy: '15.5', r: '1' } ],
		],
		card: [
			[ 'rect', { x: '3', y: '5', width: '18', height: '14', rx: '2' } ],
			[ 'path', { d: 'M3 10h18' } ],
			[ 'path', { d: 'M7 15h4' } ],
		],
		shield: [
			[ 'path', { d: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z' } ],
			[ 'path', { d: 'm9 12 2 2 4-4' } ],
		],
		external: [
			[ 'path', { d: 'M14 3h7v7' } ],
			[ 'path', { d: 'm10 14 11-11' } ],
			[ 'path', { d: 'M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5' } ],
		],
		lock: [
			[ 'rect', { x: '4', y: '11', width: '16', height: '10', rx: '2' } ],
			[ 'path', { d: 'M8 11V7a4 4 0 0 1 8 0v4' } ],
		],
		star: [
			[ 'path', { d: 'm12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.3L5.8 21 7 14.2 2 9.3l6.9-1L12 2Z' } ],
		],
		alert: [
			[ 'path', { d: 'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z' } ],
			[ 'path', { d: 'M12 9v4' } ],
			[ 'path', { d: 'M12 17h.01' } ],
		],
	};
	const renderIconCardIcon = ( icon ) =>
		el(
			'svg',
			{
				viewBox: '0 0 24 24',
				fill: 'none',
				stroke: 'currentColor',
				strokeWidth: '1.9',
				strokeLinecap: 'round',
				strokeLinejoin: 'round',
				'aria-hidden': true,
				focusable: false,
			},
			( iconCardShapes[ icon ] || iconCardShapes.star ).map( ( shape, index ) =>
				el( shape[ 0 ], { key: index, ...shape[ 1 ] } )
			)
		);

	registerBlockType( 'new-theme/info-wrapper', {
		title: __( 'Инфо-блок с оберткой', 'new-theme' ),
		description: __( 'Декоративный контейнер с темной шапкой и произвольными стандартными блоками.', 'new-theme' ),
		icon: 'feedback',
		category: 'new-theme',
		keywords: [ 'info', 'wrapper', 'uagb' ],
		supports: {
			align: [ 'wide', 'full' ],
			anchor: true,
			html: false,
			reusable: true,
		},
		attributes: {
			title: { type: 'string', default: 'Nemokami sukimai naujiems žaidėjams' },
		},
		edit: ( { attributes, setAttributes } ) =>
			el(
				'section',
				useBlockProps( { className: 'nt-info-wrapper' } ),
				el(
					'div',
					{ className: 'nt-info-wrapper__header' },
					el( RichText, {
						tagName: 'h2',
						className: 'nt-info-wrapper__title',
						value: attributes.title || '',
						placeholder: __( 'Заголовок блока', 'new-theme' ),
						allowedFormats: [],
						onChange: ( title ) => setAttributes( { title } ),
					} )
				),
				el(
					'div',
					{ className: 'nt-info-wrapper__body' },
					el( InnerBlocks, {
						allowedBlocks: allowedCoreContentBlocks(),
						orientation: 'vertical',
						template: [
							[ 'core/paragraph', { content: 'Kaip jau minėjome, iš kazino galite gauti kelių skirtingų tipų Free Spins premijas. Trumpai apžvelgsime, kaip kiekvienas tipas skiriasi.' } ],
						],
						renderAppender: InnerBlocks.ButtonBlockAppender,
					} )
				)
			),
		save: () => el( InnerBlocks.Content ),
	} );

	registerBlockType( 'new-theme/infobox', {
		title: __( 'Infobox', 'new-theme' ),
		description: __( 'Светлый декоративный infobox с большой кавычкой и произвольными стандартными блоками.', 'new-theme' ),
		icon: 'editor-quote',
		category: 'new-theme',
		keywords: [ 'info', 'quote', 'kt-info-box' ],
		supports: {
			align: [ 'wide', 'full' ],
			anchor: true,
			html: false,
			reusable: true,
		},
		edit: () =>
			el(
				'aside',
				useBlockProps( { className: 'nt-infobox' } ),
				el( 'div', { className: 'nt-infobox__mark', 'aria-hidden': true }, '\u201d' ),
				el(
					'div',
					{ className: 'nt-infobox__content' },
					el( InnerBlocks, {
						allowedBlocks: allowedCoreContentBlocks(),
						orientation: 'vertical',
						template: [
							[ 'core/paragraph', { content: 'Gaunate 50 € premiją ir 100 Free Spins. Jiems taikomas 30× Bonus + laimėjimų WR. Tarkime, kad laimite 10 € iš sukimų. Tai reiškia, kad turėsite atlikti statymų už 1,800 € prieš galėdami išsiimti realius pinigus.' } ],
						],
						renderAppender: InnerBlocks.ButtonBlockAppender,
					} )
				)
			),
		save: () => el( InnerBlocks.Content ),
	} );

	registerBlockType( 'new-theme/icon-cards', {
		title: __( 'Карточки с иконками', 'new-theme' ),
		description: __( 'Список карточек с вертикальным или горизонтальным макетом и стандартными иконками.', 'new-theme' ),
		icon: 'grid-view',
		category: 'new-theme',
		keywords: [ 'cards', 'icons', 'benefits' ],
		supports: {
			align: [ 'wide', 'full' ],
			anchor: true,
			html: false,
			reusable: true,
		},
		attributes: {
			title: { type: 'string', default: 'Kodėl verta rinkti Užsienio Kazino?' },
			orientation: { type: 'string', default: 'vertical' },
			items: { type: 'array', default: iconCardDefaults },
		},
		edit: ( { attributes, setAttributes } ) => {
			const orientation = attributes.orientation === 'horizontal' ? 'horizontal' : 'vertical';
			const items = Array.isArray( attributes.items ) ? attributes.items : iconCardDefaults;
			const itemDefaults = { icon: 'star', tone: 'orange', title: '', text: '', note: '' };
			const set = ( key ) => ( value ) => setAttributes( { [ key ]: value } );
			const inspector = el(
				InspectorControls,
				{},
				el(
					PanelBody,
					{ title: __( 'Настройки', 'new-theme' ), initialOpen: true },
					el( SelectControl, {
						label: __( 'Макет', 'new-theme' ),
						value: orientation,
						options: [
							{ label: __( 'Вертикально', 'new-theme' ), value: 'vertical' },
							{ label: __( 'Горизонтально', 'new-theme' ), value: 'horizontal' },
						],
						onChange: set( 'orientation' ),
					} )
				),
				simpleRepeater(
					__( 'Элементы', 'new-theme' ),
					items,
					set( 'items' ),
					itemDefaults,
					( item, _index, update ) =>
						el(
							Fragment,
							{},
							el( SelectControl, {
								label: __( 'Иконка', 'new-theme' ),
								value: item.icon || 'star',
								options: iconCardIconOptions,
								onChange: ( icon ) => update( { icon } ),
							} ),
							el( SelectControl, {
								label: __( 'Цвет иконки', 'new-theme' ),
								value: item.tone || 'orange',
								options: iconCardToneOptions,
								onChange: ( tone ) => update( { tone } ),
							} ),
							text( __( 'Заголовок', 'new-theme' ), item.title, ( title ) => update( { title } ) ),
							textarea( __( 'Текст', 'new-theme' ), item.text, ( value ) => update( { text: value } ) ),
							textarea( __( 'Заметка', 'new-theme' ), item.note, ( note ) => update( { note } ), __( 'Опционально. Выводится в желтом блоке внутри карточки.', 'new-theme' ) )
						)
				)
			);

			return el(
				'section',
				useBlockProps( { className: 'nt-icon-cards nt-icon-cards--' + orientation } ),
				inspector,
				el( RichText, {
					tagName: 'h2',
					className: 'nt-icon-cards__title',
					value: attributes.title || '',
					placeholder: __( 'Заголовок блока', 'new-theme' ),
					allowedFormats: [],
					onChange: set( 'title' ),
				} ),
				el(
					'div',
					{ className: 'nt-icon-cards__list' },
					items.map( ( item, index ) =>
						el(
							'article',
							{
								key: index,
								className: 'nt-icon-card nt-icon-card--tone-' + ( item.tone || 'orange' ),
							},
							el( 'div', { className: 'nt-icon-card__icon' }, renderIconCardIcon( item.icon || 'star' ) ),
							el(
								'div',
								{ className: 'nt-icon-card__body' },
								item.title ? el( 'h3', { className: 'nt-icon-card__title' }, item.title ) : null,
								item.text ? el( 'p', { className: 'nt-icon-card__text' }, item.text ) : null,
								item.note ? el(
									'div',
									{ className: 'nt-icon-card__note' },
									renderIconCardIcon( 'alert' ),
									el( 'span', {}, item.note )
								) : null
							)
						)
					)
				)
			);
		},
		save: () => null,
	} );

	// ── hero ──────────────────────────────────────────────────────────────────

	registerBlockType( 'new-theme/hero', {
		title: __( 'Hero-секция', 'new-theme' ),
		description: __( 'Уникальная hero-секция с произвольными вложенными блоками Gutenberg.', 'new-theme' ),
		icon: 'cover-image',
		category: 'new-theme',
		keywords: [ 'hero', __( 'баннер', 'new-theme' ), __( 'обложка', 'new-theme' ) ],
		attributes: {
			image: { type: 'string', default: 'assets/img/2022/01/roleta-casino-online.png' },
			imageId: { type: 'number' },
			backgroundPosition: { type: 'object', default: { x: 0.5, y: 0 } },
			overlayColor: { type: 'string', default: '#09101f' },
			overlayOpacity: { type: 'number', default: 35 },
			variant: { type: 'string', default: 'dark' },
			title: { type: 'string' },
			text: { type: 'string' },
		},
		supports: {
			align: [ 'wide', 'full' ],
			anchor: true,
			color: { text: true, link: true },
			html: false,
			reusable: true,
		},
		edit: ( { attributes, setAttributes } ) => {
			const backgroundPosition = attributes.backgroundPosition || { x: 0.5, y: 0 };
			const allowedHeroBlocks = getBlockTypes()
				.map( ( blockType ) => blockType.name )
				.filter( ( blockName ) => ! forbiddenSectionBlocks.includes( blockName ) );
			const template = [
				[ 'core/heading', { level: 1, content: attributes.title || __( 'Заголовок страницы', 'new-theme' ) } ],
				[ 'core/paragraph', { content: attributes.text || __( 'Добавьте описание и любые дополнительные блоки.', 'new-theme' ), fontSize: 'lead' } ],
			];
			const backgroundStyle = attributes.image ? {
				backgroundImage: 'url("' + normalizePreviewHtml( attributes.image ) + '")',
				backgroundPosition: ( backgroundPosition.x * 100 ) + '% ' + ( backgroundPosition.y * 100 ) + '%',
			} : undefined;
			const overlayStyle = {
				backgroundColor: hexToRgba( attributes.overlayColor || '#09101f', ( attributes.overlayOpacity ?? 35 ) / 100 ),
			};

			return el(
				'header',
				useBlockProps( { className: 'page-hero page-hero--' + ( attributes.variant === 'light' ? 'light' : 'dark' ) } ),
				el(
					InspectorControls,
					{},
					el(
						PanelBody,
						{ title: __( 'Настройки Hero', 'new-theme' ), initialOpen: true },
						mediaImageControl( __( 'Фоновое изображение', 'new-theme' ), attributes.image, attributes.imageId,
							( image, imageId ) => setAttributes( { image, imageId } ) ),
						attributes.image ? el( FocalPointPicker, {
							label: __( 'Точка фокуса', 'new-theme' ),
							url: normalizePreviewHtml( attributes.image ),
							value: backgroundPosition,
							onChange: ( value ) => setAttributes( { backgroundPosition: value } ),
						} ) : null,
						el( SelectControl, {
							label: __( 'Цвет текста', 'new-theme' ),
							value: attributes.variant || 'dark',
							options: [
								{ label: __( 'Светлый', 'new-theme' ), value: 'dark' },
								{ label: __( 'Тёмный', 'new-theme' ), value: 'light' },
							],
							onChange: ( variant ) => setAttributes( { variant } ),
						} ),
						el( 'p', {}, __( 'Цвет затемнения', 'new-theme' ) ),
						el( ColorPalette, {
							colors: sectionPalette,
							value: attributes.overlayColor || '#09101f',
							onChange: ( overlayColor ) => setAttributes( { overlayColor: overlayColor || '#09101f' } ),
							clearable: false,
						} ),
						el( RangeControl, {
							label: __( 'Прозрачность затемнения', 'new-theme' ),
							value: attributes.overlayOpacity ?? 35,
							min: 0,
							max: 90,
							onChange: ( overlayOpacity ) => setAttributes( { overlayOpacity } ),
						} )
					)
				),
				backgroundStyle ? el( 'div', { className: 'page-hero__background', 'aria-hidden': true, style: backgroundStyle } ) : null,
				el( 'div', { className: 'page-hero__overlay', 'aria-hidden': true, style: overlayStyle } ),
				el(
					'div',
					{ className: 'container' },
					el(
						'div',
						{ className: 'page-hero__content' },
						el( InnerBlocks, {
							allowedBlocks: allowedHeroBlocks,
							template,
							templateLock: false,
							renderAppender: InnerBlocks.ButtonBlockAppender,
						} )
					)
				)
			);
		},
		save: () => el( InnerBlocks.Content ),
	} );

	// ── offer-list ────────────────────────────────────────────────────────────

	registerBlockType( 'new-theme/offer-list', {
		title: __( 'Список казино-офферов', 'new-theme' ),
		icon: 'list-view',
		category: 'new-theme',
		attributes: {
			title: { type: 'string', default: 'Geriausi legalus internetiniai kazino Lietuvoje' },
			intro: { type: 'string', default: '' },
			source: { type: 'string', default: 'attributes' },
			limit: { type: 'number', default: 15 },
			orderBy: { type: 'string', default: 'menu_order' },
			order: { type: 'string', default: 'ASC' },
			showLegalLabel: { type: 'boolean', default: true },
			cards: { type: 'array', default: [] },
		},
		edit: ( { attributes, setAttributes } ) => {
			const source = attributes.source || 'attributes';
			const setLimit = ( value ) => {
				const limit = parseInt( value, 10 );
				setAttributes( { limit: Number.isFinite( limit ) && limit > 0 ? limit : 15 } );
			};
			const dataSourceControls = el(
				PanelBody,
				{ title: __( 'Источник данных', 'new-theme' ) },
				text( 'Заголовок', attributes.title, ( v ) => setAttributes( { title: v } ) ),
				textarea( 'Вступление', attributes.intro, ( v ) => setAttributes( { intro: v } ) ),
				el( SelectControl, {
					label: 'Источник',
					value: source,
					options: [
						{ label: 'Карточки из атрибутов', value: 'attributes' },
						{ label: 'Запрос казино-офферов', value: 'query' },
					],
					onChange: ( nextSource ) => setAttributes( { source: nextSource } ),
				} ),
				source === 'query' ? el( TextControl, {
					label: 'Лимит',
					type: 'number',
					min: 1,
					max: 50,
					value: attributes.limit || 15,
					onChange: setLimit,
				} ) : null,
				source === 'query' ? el( SelectControl, {
					label: 'Сортировать по',
					value: attributes.orderBy || 'menu_order',
					options: [
						{ label: 'Ручной порядок', value: 'menu_order' },
						{ label: 'Дата', value: 'date' },
						{ label: 'Заголовок', value: 'title' },
						{ label: 'Рейтинг', value: 'rating' },
						{ label: 'Бонус', value: 'bonus' },
					],
					onChange: ( orderBy ) => setAttributes( { orderBy } ),
				} ) : null,
				source === 'query' ? el( SelectControl, {
					label: 'Порядок',
					value: attributes.order || 'ASC',
					options: [
						{ label: 'По возрастанию', value: 'ASC' },
						{ label: 'По убыванию', value: 'DESC' },
					],
					onChange: ( order ) => setAttributes( { order } ),
				} ) : null,
				source === 'query' ? el( ToggleControl, {
					label: 'Показывать метку легальности',
					checked: attributes.showLegalLabel !== false,
					onChange: ( showLegalLabel ) => setAttributes( { showLegalLabel } ),
				} ) : null
			);

			if ( source === 'query' ) {
				return el(
					'div',
					useBlockProps(),
					el( InspectorControls, {}, dataSourceControls ),
					el( ServerSideRender, { block: 'new-theme/offer-list', attributes } )
				);
			}

			return el(
				'div',
				useBlockProps(),
				el(
					InspectorControls,
					{},
					dataSourceControls,
					simpleRepeater(
						'Карточки казино (атрибуты)',
						attributes.cards || [],
						( cards ) => setAttributes( { cards } ),
						{ name: 'Casino', logo: '', rating: '4', bonus: '', features: '', payments: '', offerUrl: '#', reviewUrl: '#' },
						( card, index, update ) =>
							el(
								'div',
								{},
								text( 'Название', card.name, ( v ) => update( { name: v } ) ),
								mediaImageControl( __( 'Логотип', 'new-theme' ), card.logo, card.logoId, ( logo, logoId ) => update( { logo, logoId } ) ),
								text( 'Рейтинг', card.rating, ( v ) => update( { rating: v } ) ),
								text( 'Бонус', card.bonus, ( v ) => update( { bonus: v } ) ),
								textarea( 'Особенности', card.features, ( v ) => update( { features: v } ) ),
								mediaImagesControl( __( 'Иконки платежей', 'new-theme' ), card.payments, ( payments ) => update( { payments } ) ),
								text( 'URL оффера', card.offerUrl, ( v ) => update( { offerUrl: v } ) ),
								text( 'URL обзора', card.reviewUrl, ( v ) => update( { reviewUrl: v } ) )
							)
					)
				),
				el(
					'section',
					{ className: 'offers offers--full offers--legacy', 'data-location': 'offer-list', 'data-old-style': 'true' },
					el(
						'div',
						{ className: 'container' },
						el(
							'div',
							{ className: 'offers__controls offers--show-illegal' },
							el(
								RichText,
								{
									tagName: 'div',
									className: 'offers__legal-label',
									value: attributes.title || '',
									onChange: ( title ) => setAttributes( { title } ),
									placeholder: __( 'Заголовок списка офферов', 'new-theme' ),
								}
							)
						),
						el( RichText, {
							tagName: 'p',
							value: attributes.intro || '',
							onChange: ( intro ) => setAttributes( { intro } ),
							placeholder: __( 'Вступительный текст', 'new-theme' ),
						} ),
						el(
							'div',
							{ className: 'offers__list' },
							el( InnerBlocks, { allowedBlocks: [ 'new-theme/offer-card' ], orientation: 'vertical' } )
						)
					)
				)
			);
		},
		save: () => el( InnerBlocks.Content ),
	} );

	// ── offer-card ────────────────────────────────────────────────────────────

	registerBlockType( 'new-theme/offer-card', {
		title: __( 'Карточка казино-оффера', 'new-theme' ),
		icon: 'tickets-alt',
		category: 'new-theme',
		parent: [ 'new-theme/offer-list' ],
		attributes: {
			name: { type: 'string', default: 'Casino' },
			logo: { type: 'string', default: '' },
			logoId: { type: 'number' },
			rating: { type: 'string', default: '4.5' },
			bonus: { type: 'string', default: 'Premija' },
			features: { type: 'string', default: 'Licencijuota Lietuvoje\nGreiti mokejimai\nMobiliosios programeles' },
			payments: { type: 'string', default: 'assets/img/2021/06/mbway-logo.svg\nassets/img/2021/06/multibanco-logo.svg\nassets/img/2020/12/pm_mastercard.svg\nassets/img/2020/12/pm_visa.svg' },
			offerUrl: { type: 'string', default: '#' },
			reviewUrl: { type: 'string', default: '#' },
		},
		edit: ( { attributes, setAttributes } ) => {
			const features = splitLines( attributes.features );
			const payments = splitLines( attributes.payments );
			const rating = attributes.rating || '4.5';
			const updateFeature = ( index, value ) => {
				const next = [ ...features ];
				next[ index ] = value;
				setAttributes( { features: next.join( '\n' ) } );
			};
			const stopLink = ( event ) => event.preventDefault();

			return el(
				'div',
				useBlockProps(),
				el(
					InspectorControls,
					{},
					el(
						PanelBody,
						{ title: __( 'Настройки казино', 'new-theme' ) },
						mediaImageControl( __( 'Логотип', 'new-theme' ), attributes.logo, attributes.logoId, ( logo, logoId ) => setAttributes( { logo, logoId } ) ),
						text( 'Рейтинг', rating, ( v ) => setAttributes( { rating: v } ) ),
						textarea( 'Особенности', attributes.features, ( v ) => setAttributes( { features: v } ), 'Одна особенность на строку.' ),
						mediaImagesControl( __( 'Иконки платежей', 'new-theme' ), attributes.payments, ( payments ) => setAttributes( { payments } ) ),
						text( 'URL оффера', attributes.offerUrl, ( v ) => setAttributes( { offerUrl: v } ) ),
						text( 'URL обзора', attributes.reviewUrl, ( v ) => setAttributes( { reviewUrl: v } ) )
					)
				),
				el(
					'div',
					{ className: 'offer-card', 'data-bonus': ( attributes.bonus || '' ).replace( /[^0-9.]/g, '' ), 'data-rating': rating },
					el(
						'div',
						{ className: 'offer-card__top' },
						el(
							'a',
							{ className: 'offer-card__thumb', title: attributes.name || '', href: attributes.offerUrl || '#', target: '_blank', rel: 'sponsored', onClick: stopLink },
							attributes.logo ? el( 'img', {
								decoding: 'async',
								width: 115,
								height: 30,
								src: normalizePreviewHtml( attributes.logo ),
								alt: attributes.name || '',
							} ) : el( RichText, {
								tagName: 'span',
								value: attributes.name || '',
								onChange: ( name ) => setAttributes( { name } ),
								placeholder: __( 'Название казино', 'new-theme' ),
							} )
						),
						el(
							'div',
							{ className: 'offer-card__title-wrapper' },
							el(
								'a',
								{ title: attributes.name || '', href: attributes.offerUrl || '#', target: '_blank', rel: 'sponsored', onClick: stopLink },
								el( RichText, {
									tagName: 'h2',
									value: attributes.name || '',
									onChange: ( name ) => setAttributes( { name } ),
									placeholder: __( 'Название казино', 'new-theme' ),
								} )
							),
							el( 'div', { className: 'rating' }, el( 'span', {}, el( 'span', {}, rating ), '/5' ) )
						),
						el(
							'ul',
							{ className: 'offer-card__features is-style-checked-list' },
							features.map( ( feature, index ) =>
								el(
									'li',
									{ key: index },
									el( RichText, {
										tagName: 'span',
										value: feature || '',
										onChange: ( value ) => updateFeature( index, value ),
										placeholder: __( 'Особенность', 'new-theme' ),
									} )
								)
							)
						),
						el(
							'div',
							{ className: 'offer-card__payment' },
							el( 'div', { className: 'offer-card__label' }, 'Mokejimo budai' ),
							el(
								'div',
								{ className: 'payment-list' },
								el(
									'div',
									{ className: 'payment-list__group' },
									payments.map( ( payment, index ) =>
										el(
											'div',
											{ key: index, className: 'payment-list__img-wrapper' },
											el( 'img', { decoding: 'async', src: normalizePreviewHtml( payment ), alt: '' } )
										)
									)
								)
							)
						)
					),
					el(
						'div',
						{ className: 'offer-card__bottom' },
						el(
							'div',
							{ className: 'offer-card__bonus-wrapper' },
							el(
								'a',
								{ href: attributes.offerUrl || '#', target: '_blank', rel: 'sponsored', onClick: stopLink },
								el(
									'span',
									{ className: 'offer-card__bonus-value' },
									el( RichText, {
										tagName: 'span',
										className: 'bonus',
										value: attributes.bonus || '',
										onChange: ( bonus ) => setAttributes( { bonus } ),
										placeholder: __( 'Бонус', 'new-theme' ),
									} )
								),
								el( 'span', { className: 'button__label' }, 'Premija' )
							)
						),
						el(
							'div',
							{ className: 'offer-card__links' },
							el( 'div', { className: 'offer-card__button-wrapper' }, el( 'a', { className: 'button button--primary', href: attributes.offerUrl || '#', target: '_blank', rel: 'sponsored', onClick: stopLink }, el( 'span', {}, 'Zaisti' ) ) ),
							el( 'div', { className: 'offer-card__button-wrapper' }, el( 'a', { className: 'button button--secondary', href: attributes.reviewUrl || '#', onClick: stopLink }, el( 'span', {}, 'Apzvalga' ) ) )
						)
					)
				)
			);
		},
		save: () => null,
	} );

	// ── news-slider ───────────────────────────────────────────────────────────

	registerBlockType( 'new-theme/news-slider', {
		title: __( 'Редактируемый слайдер новостей', 'new-theme' ),
		icon: 'slides',
		category: 'new-theme',
		attributes: {
			title:         { type: 'string', default: 'Naujausi straipsniai' },
			source:        { type: 'string', default: 'query' },
			postType:      { type: 'string', default: 'post' },
			categorySlug:  { type: 'string', default: '' },
			numberOfPosts: { type: 'number', default: 6 },
			enableSlider:  { type: 'boolean', default: true },
			items:         { type: 'array', default: [] },
		},
		edit: ( { attributes, setAttributes } ) => {
			const { source, items } = attributes;
			const set = ( key ) => ( v ) => setAttributes( { [ key ]: v } );

			const sourceControls = el(
				PanelBody,
				{ title: __( 'Источник', 'new-theme' ), initialOpen: true },
				el( SelectControl, {
					label: __( 'Контент source', 'new-theme' ),
					value: source,
					options: [
						{ label: __( 'Запрос записей', 'new-theme' ),  value: 'query' },
						{ label: __( 'Ручные элементы', 'new-theme' ), value: 'manual' },
					],
					onChange: set( 'source' ),
				} ),
				el( ToggleControl, {
					label: __( 'Включить слайдер', 'new-theme' ),
					checked: attributes.enableSlider !== false,
					onChange: set( 'enableSlider' ),
				} ),
				text( __( 'Заголовок блока', 'new-theme' ), attributes.title, set( 'title' ) )
			);

			const queryControls = source === 'query' ? el(
				PanelBody,
				{ title: __( 'Настройки запроса', 'new-theme' ), initialOpen: true },
				text( __( 'Тип записи', 'new-theme' ), attributes.postType, set( 'postType' ),
					__( 'например post, page или slug произвольного типа записи', 'new-theme' ) ),
				text( __( 'Slug категории', 'new-theme' ), attributes.categorySlug, set( 'categorySlug' ),
					__( 'Оставьте пустым для всех категорий', 'new-theme' ) ),
				el( RangeControl, {
					label: __( 'Количество записей', 'new-theme' ),
					value: attributes.numberOfPosts || 6,
					onChange: set( 'numberOfPosts' ),
					min: 1,
					max: 20,
				} )
			) : null;

			const manualControls = source === 'manual' ? simpleRepeater(
				__( 'Элементы новостей', 'new-theme' ),
				items,
				( nextItems ) => setAttributes( { items: nextItems } ),
				{ title: '', category: '', date: '', image: '', imageId: 0, url: '#' },
				( item, index, update ) =>
					el(
						'div',
						{},
						mediaImageControl( __( 'Изображение', 'new-theme' ), item.image, item.imageId,
							( image, imageId ) => update( { image, imageId } ) ),
						text( 'Category', item.category, ( v ) => update( { category: v } ) ),
						text( 'Дата', item.date, ( v ) => update( { date: v } ) ),
						text( 'Заголовок', item.title, ( v ) => update( { title: v } ) ),
						text( 'URL', item.url, ( v ) => update( { url: v } ) )
					)
			) : null;

			return el(
				'div',
				useBlockProps(),
				el( InspectorControls, {}, sourceControls, queryControls, manualControls ),
				el( ServerSideRender, { block: 'new-theme/news-slider', attributes } )
			);
		},
		save: () => null,
	} );

	// ── live-odds ─────────────────────────────────────────────────────────────

	registerBlockType( 'new-theme/live-odds', {
		title: __( 'Виджет live odds', 'new-theme' ),
		icon: 'chart-line',
		category: 'new-theme',
		attributes: {
			title:           { type: 'string',  default: 'Isskirtiniai sporto statymai' },
			source:          { type: 'string',  default: 'manual' },
			enableSlider:    { type: 'boolean', default: true },
			providerLogoSrc: { type: 'string',  default: 'assets/img/2021/08/betano-logo.svg' },
			providerLogoAlt: { type: 'string',  default: 'Betano' },
			defaultCtaUrl:   { type: 'string',  default: '' },
			ctaLabel:        { type: 'string',  default: '' },
			ctaUrl:          { type: 'string',  default: '' },
			items:           { type: 'array',   default: [] },
		},
		edit: ( { attributes, setAttributes } ) => {
			const set = ( key ) => ( val ) => setAttributes( { [ key ]: val } );
			const { title, enableSlider, providerLogoSrc, providerLogoAlt, defaultCtaUrl, ctaLabel, ctaUrl, items } = attributes;
			const itemCount = ( items || [] ).length;
			const itemDefaults = { teamA: '', teamB: '', league: '', eventDate: '', market: '', odd: '', ctaUrl: '', isLiveUpdates: false };

			return el(
				'div',
				useBlockProps( { style: { padding: '16px', background: '#f0f4f8', border: '1px solid #c8d4e0', borderRadius: '4px' } } ),
				el(
					InspectorControls, {},
					el(
						PanelBody, { title: __( 'Настройки', 'new-theme' ), initialOpen: true },
						text( __( 'Заголовок секции', 'new-theme' ), title, set( 'title' ) ),
						el( ToggleControl, { label: __( 'Включить слайдер', 'new-theme' ), checked: !! enableSlider, onChange: set( 'enableSlider' ) } ),
						text( __( 'Путь к логотипу провайдера', 'new-theme' ), providerLogoSrc, set( 'providerLogoSrc' ), 'Относительный путь темы или абсолютный URL' ),
						text( __( 'Alt логотипа провайдера', 'new-theme' ), providerLogoAlt, set( 'providerLogoAlt' ) ),
						text( __( 'URL CTA по умолчанию', 'new-theme' ), defaultCtaUrl, set( 'defaultCtaUrl' ), 'Применяется ко всем прогнозам, если не переопределено в элементе' ),
					),
					el(
						PanelBody, { title: __( 'CTA-кнопка секции', 'new-theme' ), initialOpen: false },
						text( __( 'Текст кнопки', 'new-theme' ), ctaLabel, set( 'ctaLabel' ) ),
						text( __( 'URL кнопки', 'new-theme' ), ctaUrl, set( 'ctaUrl' ) ),
					),
					simpleRepeater(
						__( 'Прогнозы', 'new-theme' ),
						items,
						set( 'items' ),
						itemDefaults,
						( item, _i, patch ) => el(
							Fragment, {},
							text( __( 'Команда A', 'new-theme' ), item.teamA, ( v ) => patch( { teamA: v } ) ),
							text( __( 'Команда B', 'new-theme' ), item.teamB, ( v ) => patch( { teamB: v } ) ),
							text( __( 'Лига', 'new-theme' ), item.league, ( v ) => patch( { league: v } ) ),
							text( __( 'Дата события (ISO UTC)', 'new-theme' ), item.eventDate, ( v ) => patch( { eventDate: v } ), 'например 2026-06-10T19:00:00Z' ),
							text( __( 'Маркет', 'new-theme' ), item.market, ( v ) => patch( { market: v } ) ),
							text( __( 'Коэффициент', 'new-theme' ), item.odd, ( v ) => patch( { odd: v } ) ),
							text( __( 'URL CTA (переопределяет значение по умолчанию)', 'new-theme' ), item.ctaUrl, ( v ) => patch( { ctaUrl: v } ) ),
							el( ToggleControl, { label: __( 'Live-обновления', 'new-theme' ), checked: !! item.isLiveUpdates, onChange: ( v ) => patch( { isLiveUpdates: v } ) } ),
						)
					)
				),
				el( 'strong', {}, '⚡ ' + __( 'Виджет live odds', 'new-theme' ) ),
				el( 'p', { style: { margin: '4px 0 0', color: '#555', fontSize: '13px' } }, title ),
				el(
					'p',
					{ style: { margin: '4px 0 0', color: '#999', fontSize: '12px' } },
					itemCount
						? itemCount + ' ' + __( 'прогнозов настроено: слайдер выводится на фронтенде', 'new-theme' )
						: __( 'Прогнозы не настроены. Добавьте элементы в боковой панели.', 'new-theme' )
				)
			);
		},
		save: () => null,
	} );

	// ── site-footer ───────────────────────────────────────────────────────────

	registerBlockType( 'new-theme/site-footer', {
		title: __( 'Футер сайта', 'new-theme' ),
		icon: 'align-wide',
		category: 'new-theme',
		attributes: {
			logo:           { type: 'string', default: 'assets/img/2021/06/logo-aposta-legal.svg' },
			logoId:         { type: 'number' },
			logoAlt:        { type: 'string', default: 'Aposta Legal' },
			disclaimerText: { type: 'string', default: 'Kad patirtis butu kuo geresne, svarbu zaisti atsakingai. Rekomenduojame naudotis atsakingo zaidimo irankiais, nusistatyti limitus ir kreiptis pagalbos, jei pajustumete, kad prarandate zaidimo iprociu kontrole. Legalios lazybu bendroves turi siuos irankius, todel raginame rinktis tik musu rekomenduojamas licencijuotas svetaines.' },
			infoLinks:      { type: 'array', default: [ { label: 'Atsakingas zaidimas', url: '/jogo-responsavel/' }, { label: 'Musu kriterijai', url: '/como-avaliamos-as-casas/' } ] },
			moreLinks:      { type: 'array', default: [ { label: 'Kontaktai', url: '/contactos/' }, { label: 'Apie mus', url: '/sobre-nos/' } ] },
			externalLinks:  { type: 'array', default: [] },
			footerLinks:    { type: 'array', default: [ { label: 'Privatumo ir slapuku politika', url: '/politica-privacidade/' }, { label: 'Taisykles ir salygos', url: '/termos-e-condicoes/' } ] },
			copyright:      { type: 'string', default: '© 2026 - Aposta Legal. Visos teises saugomos.' },
		},
		edit: ( { attributes, setAttributes } ) => {
			const set = ( key ) => ( val ) => setAttributes( { [ key ]: val } );

			return el(
				'div',
				useBlockProps(),
				el(
					InspectorControls,
					{},
					el( PanelBody, { title: __( 'Логотип', 'new-theme' ) },
						mediaImageControl( __( 'Логотип', 'new-theme' ), attributes.logo, attributes.logoId, ( logo, logoId ) => setAttributes( { logo, logoId } ) ),
						text( 'Alt-текст', attributes.logoAlt, set( 'logoAlt' ) )
					),
					el( PanelBody, { title: __( 'Текст дисклеймера', 'new-theme' ), initialOpen: false },
						textarea( 'Текст', attributes.disclaimerText, set( 'disclaimerText' ) )
					),
					simpleRepeater( __( 'Ссылки «Информация»', 'new-theme' ), attributes.infoLinks, set( 'infoLinks' ),
						{ label: '', url: '' },
						( item, _i, setItem ) => el( 'div', {},
							text( 'Метка', item.label, ( v ) => setItem( { label: v } ) ),
							text( 'URL',   item.url,   ( v ) => setItem( { url:   v } ) )
						)
					),
					simpleRepeater( __( 'Ссылки «Подробнее»', 'new-theme' ), attributes.moreLinks, set( 'moreLinks' ),
						{ label: '', url: '' },
						( item, _i, setItem ) => el( 'div', {},
							text( 'Метка', item.label, ( v ) => setItem( { label: v } ) ),
							text( 'URL',   item.url,   ( v ) => setItem( { url:   v } ) )
						)
					),
					simpleRepeater( __( 'Внешние ссылки', 'new-theme' ), attributes.externalLinks, set( 'externalLinks' ),
						{ label: '', url: '', image: '' },
						( item, _i, setItem ) => el( 'div', {},
							text( 'Метка',      item.label, ( v ) => setItem( { label: v } ) ),
							text( 'URL',        item.url,   ( v ) => setItem( { url:   v } ) ),
							mediaImageControl( __( 'Изображение флага', 'new-theme' ), item.image, item.imageId, ( image, imageId ) => setItem( { image, imageId } ) )
						)
					),
					simpleRepeater( __( 'Навигационные ссылки футера', 'new-theme' ), attributes.footerLinks, set( 'footerLinks' ),
						{ label: '', url: '' },
						( item, _i, setItem ) => el( 'div', {},
							text( 'Метка', item.label, ( v ) => setItem( { label: v } ) ),
							text( 'URL',   item.url,   ( v ) => setItem( { url:   v } ) )
						)
					),
					el( PanelBody, { title: __( 'Копирайт', 'new-theme' ), initialOpen: false },
						text( 'Текст', attributes.copyright, set( 'copyright' ) )
					)
				),
				el( ServerSideRender, { block: 'new-theme/site-footer', attributes } )
			);
		},
		save: () => null,
	} );

} )( window.wp.blocks, window.wp.blockEditor, window.wp.components, window.wp.element, window.wp.i18n );
