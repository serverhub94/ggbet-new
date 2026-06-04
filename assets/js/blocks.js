( function ( blocks, blockEditor, components, element, i18n ) {
	const { registerBlockType } = blocks;
	const { InnerBlocks, InspectorControls, MediaUpload, MediaUploadCheck, RichText, useBlockProps } = blockEditor;
	const { Button, PanelBody, RangeControl, SelectControl, TextControl, TextareaControl, ToggleControl } = components;
	const { createElement: el, Fragment } = element;
	const { __ } = i18n;
	const ServerSideRender = wp.serverSideRender;

	const themeUrl = ( window.newThemeEditor && window.newThemeEditor.themeUrl ) || '';
	const homeUrl  = ( window.newThemeEditor && window.newThemeEditor.homeUrl ) || '/';

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

	// ── hero ──────────────────────────────────────────────────────────────────

	registerBlockType( 'new-theme/hero', {
		title: __( 'Hero казино', 'new-theme' ),
		icon: 'cover-image',
		category: 'new-theme',
		attributes: {
			title: { type: 'string', default: 'Legalus internetiniai kazino Lietuvoje' },
			text: { type: 'string', default: 'Atrask geriausius legalius internetinius kazino Lietuvoje 2026 m. ir naujausius pasirinkimus.' },
			image: { type: 'string', default: 'assets/img/2022/01/roleta-casino-online.png' },
			imageId: { type: 'number' },
			overlayColor: { type: 'string', default: '#000000' },
			overlayOpacity: { type: 'number', default: 0 },
			topSpacer: { type: 'number', default: 48 },
			variant: { type: 'string', default: 'dark' },
		},
		edit: ( { attributes, setAttributes } ) => {
			const heroImage = attributes.image || 'assets/img/2022/01/roleta-casino-online.png';
			const overlayOpacity = Math.max( 0, Math.min( 90, parseInt( attributes.overlayOpacity || 0, 10 ) ) );
			const overlayAlpha = overlayOpacity / 100;
			const topSpacer = Math.max( 0, Math.min( 160, parseInt( attributes.topSpacer ?? 48, 10 ) || 0 ) );
			const variant = attributes.variant === 'light' ? 'light' : 'dark';

			return el(
				'div',
				useBlockProps(),
				el(
					InspectorControls,
					{},
					el(
						PanelBody,
						{ title: __( 'Настройки hero', 'new-theme' ) },
						el(
							MediaUploadCheck,
							{},
							el( MediaUpload, {
								allowedTypes: [ 'image' ],
								value: attributes.imageId || 0,
								onSelect: ( media ) => setAttributes( {
									image: media && media.url ? media.url : '',
									imageId: media && media.id ? media.id : 0,
								} ),
								render: ( { open } ) =>
									el(
										Fragment,
										{},
										attributes.image ? el( 'img', {
											src: normalizePreviewHtml( attributes.image ),
											alt: '',
											style: { display: 'block', width: '100%', height: 'auto', marginBottom: 12, borderRadius: 4 },
										} ) : null,
										el(
											Button,
											{ variant: 'secondary', onClick: open },
											attributes.image ? __( 'Заменить фоновое изображение', 'new-theme' ) : __( 'Выбрать фоновое изображение', 'new-theme' )
										),
										attributes.image ? el(
											Button,
											{
												variant: 'link',
												isDestructive: true,
												onClick: () => setAttributes( { image: '', imageId: 0 } ),
												style: { marginLeft: 8 },
											},
											__( 'Удалить', 'new-theme' )
										) : null
									),
							} )
						),
						el( SelectControl, {
							label: 'Вариант',
							value: variant,
							options: [
								{ label: 'Темный', value: 'dark' },
								{ label: 'Светлый', value: 'light' },
							],
							onChange: ( nextVariant ) => setAttributes( { variant: nextVariant } ),
						} ),
						text( 'Цвет оверлея', attributes.overlayColor, ( v ) => setAttributes( { overlayColor: v } ), 'HEX-цвет, например #000000.' ),
						el( RangeControl, {
							label: 'Прозрачность оверлея',
							value: overlayOpacity,
							min: 0,
							max: 90,
							onChange: ( value ) => setAttributes( { overlayOpacity: value } ),
						} ),
						el( TextControl, {
							label: 'Верхний отступ',
							type: 'number',
							min: 0,
							max: 160,
							value: topSpacer,
							onChange: ( value ) => setAttributes( { topSpacer: parseInt( value, 10 ) || 0 } ),
							help: 'Высота в пикселях над текстом hero.',
						} )
					)
				),
				el(
					'header',
					{ className: 'page-hero page-hero--' + variant },
					el( 'div', {
						className: 'overlay',
						style: {
							background: 'url(' + normalizePreviewHtml( heroImage ) + ') no-repeat top center',
							backgroundSize: 'cover',
							boxShadow: overlayAlpha > 0 ? 'inset 0 0 0 9999px ' + hexToRgba( attributes.overlayColor, overlayAlpha ) : undefined,
						},
					} ),
					el(
						'div',
						{ className: 'container' },
						el( 'div', { style: { height: topSpacer } }, '\u00a0' ),
						el(
							'div',
							{ className: 'row' },
							el(
								'div',
								{ className: 'page-hero__title layout__row-item-padding' },
								el( RichText, {
									tagName: 'h1',
									value: attributes.title || '',
									onChange: ( title ) => setAttributes( { title } ),
									placeholder: __( 'Заголовок hero', 'new-theme' ),
								} )
							),
							el(
								'div',
								{ className: 'page-hero__text layout__row-item-padding' },
								el( RichText, {
									tagName: 'p',
									value: attributes.text || '',
									onChange: ( value ) => setAttributes( { text: value } ),
									placeholder: __( 'Текст hero', 'new-theme' ),
								} )
							)
						)
					)
				)
			);
		},
		save: () => null,
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

	// ── content-section ───────────────────────────────────────────────────────

	registerBlockType( 'new-theme/content-section', {
		title: __( 'Редактируемая секция контента', 'new-theme' ),
		icon: 'text-page',
		category: 'new-theme',
		attributes: {
			kind: { type: 'string', default: 'text' },
			title: { type: 'string', default: '' },
			text: { type: 'string', default: '' },
			image: { type: 'string', default: '' },
			imageId: { type: 'number' },
			background: { type: 'string', default: '' },
			items: { type: 'array', default: [] },
		},
		edit: ( { attributes, setAttributes } ) => {
			const kind = attributes.kind || 'text';
			const items = attributes.items || [];
			const sectionClasses = {
				text: 'text-block--two-column',
				about: 'about',
				info: 'info info--top-left',
			};
			const sectionClass = sectionClasses[ kind ] || sectionClasses.text;
			const blockProps = useBlockProps();
			const sectionProps = {
				className: sectionClass,
				style: attributes.background ? { backgroundColor: attributes.background } : undefined,
			};
			const updateItem = ( index, patch ) => {
				const next = clone( items );
				next[ index ] = { ...( next[ index ] || {} ), ...patch };
				setAttributes( { items: next } );
			};

			const inspector = el(
				InspectorControls,
				{},
				el(
					PanelBody,
					{ title: 'Настройки секции' },
					el( SelectControl, {
						label: 'Тип',
						value: kind,
						options: [
							{ label: 'Текст в две колонки', value: 'text' },
							{ label: 'О блоке', value: 'about' },
							{ label: 'Информация', value: 'info' },
						],
						onChange: ( nextKind ) => setAttributes( { kind: nextKind } ),
					} ),
					mediaImageControl( __( 'Изображение', 'new-theme' ), attributes.image, attributes.imageId, ( image, imageId ) => setAttributes( { image, imageId } ) ),
					text( 'Фон', attributes.background, ( v ) => setAttributes( { background: v } ) )
				),
				simpleRepeater(
					'Текстовые группы',
					items,
					( nextItems ) => setAttributes( { items: nextItems } ),
					{ heading: 'Заголовок', left: '<p>Левая колонка</p>', right: '<p>Правая колонка</p>' },
					( item, index, update ) =>
						el(
							'div',
							{},
							text( 'Заголовок', item.heading, ( v ) => update( { heading: v } ) ),
							textarea( 'Левая колонка', item.left, ( v ) => update( { left: v } ) ),
							textarea( 'Правая колонка', item.right, ( v ) => update( { right: v } ) )
						)
				)
			);

			const title = el(
				'div',
				{ className: 'layout__row-item-padding' },
				el( RichText, {
					tagName: 'h2',
					value: attributes.title || '',
					onChange: ( value ) => setAttributes( { title: value } ),
					placeholder: __( 'Заголовок секции', 'new-theme' ),
				} )
			);

			if ( kind === 'about' || kind === 'info' ) {
				return el(
					'div',
					blockProps,
					inspector,
					el(
						'section',
						sectionProps,
						el(
							'div',
							el(
								{ className: 'container' },
								el(
									'div',
									{ className: 'row' },
									title,
									attributes.image ? el(
										'div',
										{ className: kind + '__image layout__row-item-padding' },
										el( 'img', { src: normalizePreviewHtml( attributes.image ), alt: '' } )
									) : null,
									el(
										RichText,
										{
											tagName: 'div',
											className: kind + '__content layout__row-item-padding',
											value: attributes.text || '',
											onChange: ( value ) => setAttributes( { text: value } ),
											placeholder: __( 'Текст секции', 'new-theme' ),
											multiline: 'p',
										}
									)
								)
							)
						)
					)
				);
			}

			return el(
				'div',
				blockProps,
				inspector,
				el(
					'section',
					sectionProps,
					el(
						'div',
						{ className: 'container' },
						el(
							'div',
							{ className: 'row' },
							title,
							items.map( ( item, index ) =>
								el(
									Fragment,
									{ key: index },
									el(
										'h3',
										{ className: 'layout__row-item-padding' },
										el( 'img', {
											decoding: 'async',
											src: normalizePreviewHtml( 'assets/img/theme/green-check.svg' ),
											className: 'mr-2',
											width: 16,
											height: 16,
											alt: 'Check',
										} ),
										el( RichText, {
											tagName: 'span',
											value: item.heading || '',
											onChange: ( value ) => updateItem( index, { heading: value } ),
											placeholder: __( 'Заголовок группы', 'new-theme' ),
										} )
									),
									el( RichText, {
										tagName: 'div',
										className: 'text-block layout__row-item-padding',
										value: item.left || '',
										onChange: ( value ) => updateItem( index, { left: value } ),
										placeholder: __( 'Левая колонка', 'new-theme' ),
										multiline: 'p',
									} ),
									el( RichText, {
										tagName: 'div',
										className: 'text-block layout__row-item-padding',
										value: item.right || '',
										onChange: ( value ) => updateItem( index, { right: value } ),
										placeholder: __( 'Правая колонка', 'new-theme' ),
										multiline: 'p',
									} )
								)
							)
						)
					)
				)
			);
		},
		save: () => null,
	} );

	// ── two-column-text ───────────────────────────────────────────────────────

	registerBlockType( 'new-theme/two-column-text', {
		title: __( 'Текст в две колонки', 'new-theme' ),
		icon: 'columns',
		category: 'new-theme',
		attributes: {
			title:      { type: 'string', default: '' },
			background: { type: 'string', default: '' },
			items:      { type: 'array', default: [] },
		},
		edit: ( { attributes, setAttributes } ) => {
			const items = attributes.items || [];
			const blockProps = useBlockProps();

			const inspector = el(
				InspectorControls,
				{},
				el( PanelBody, { title: 'Настройки секции' },
					text( 'Фон', attributes.background, ( v ) => setAttributes( { background: v } ) )
				),
				simpleRepeater(
					'Текстовые группы',
					items,
					( next ) => setAttributes( { items: next } ),
					{ heading: 'Заголовок', left: '<p>Левая колонка</p>', right: '<p>Правая колонка</p>' },
					( item, _i, update ) =>
						el(
							'div',
							{},
							text( 'Заголовок', item.heading, ( v ) => update( { heading: v } ) ),
							textarea( 'Левая колонка', item.left, ( v ) => update( { left: v } ) ),
							textarea( 'Правая колонка', item.right, ( v ) => update( { right: v } ) )
						)
				)
			);

			return el(
				'div',
				blockProps,
				inspector,
				el(
					'section',
					{ className: 'text-block--two-column', style: attributes.background ? { backgroundColor: attributes.background } : undefined },
					el( 'div', { className: 'container' },
						el( 'div', { className: 'row' },
							el( 'div', { className: 'layout__row-item-padding' },
								el( RichText, {
									tagName: 'h2',
									value: attributes.title || '',
									onChange: ( v ) => setAttributes( { title: v } ),
									placeholder: __( 'Заголовок секции', 'new-theme' ),
								} )
							),
							items.map( ( item, index ) =>
								el(
									Fragment,
									{ key: index },
									el( 'h3', { className: 'layout__row-item-padding' },
										el( RichText, {
											tagName: 'span',
											value: item.heading || '',
											onChange: ( v ) => {
												const next = clone( items );
												next[ index ] = { ...next[ index ], heading: v };
												setAttributes( { items: next } );
											},
											placeholder: __( 'Заголовок группы', 'new-theme' ),
										} )
									),
									el( RichText, {
										tagName: 'div',
										className: 'text-block layout__row-item-padding',
										value: item.left || '',
										onChange: ( v ) => {
											const next = clone( items );
											next[ index ] = { ...next[ index ], left: v };
											setAttributes( { items: next } );
										},
										placeholder: __( 'Левая колонка', 'new-theme' ),
										multiline: 'p',
									} ),
									el( RichText, {
										tagName: 'div',
										className: 'text-block layout__row-item-padding',
										value: item.right || '',
										onChange: ( v ) => {
											const next = clone( items );
											next[ index ] = { ...next[ index ], right: v };
											setAttributes( { items: next } );
										},
										placeholder: __( 'Правая колонка', 'new-theme' ),
										multiline: 'p',
									} )
								)
							)
						)
					)
				)
			);
		},
		save: () => null,
	} );

	// ── about-list ────────────────────────────────────────────────────────────

	registerBlockType( 'new-theme/about-list', {
		title: __( 'О блоке List', 'new-theme' ),
		icon: 'list-view',
		category: 'new-theme',
		attributes: {
			title:      { type: 'string', default: '' },
			background: { type: 'string', default: '' },
			items:      { type: 'array', default: [] },
		},
		edit: ( { attributes, setAttributes } ) => {
			const items = attributes.items || [];
			const blockProps = useBlockProps();

			const inspector = el(
				InspectorControls,
				{},
				el( PanelBody, { title: 'Настройки секции' },
					text( 'Фон', attributes.background, ( v ) => setAttributes( { background: v } ) )
				),
				simpleRepeater(
					'Items',
					items,
					( next ) => setAttributes( { items: next } ),
					{ title: 'Item title', description: '' },
					( item, _i, update ) =>
						el(
							'div',
							{},
							text( 'Заголовок', item.title, ( v ) => update( { title: v } ) ),
							textarea( 'Description', item.description, ( v ) => update( { description: v } ) )
						)
				)
			);

			return el(
				'div',
				blockProps,
				inspector,
				el(
					'section',
					{ className: 'about', style: attributes.background ? { backgroundColor: attributes.background } : undefined },
					el( 'div', { className: 'container' },
						el( 'div', { className: 'row' },
							el( 'div', { className: 'about__heading layout__row-item-padding' },
								el( RichText, {
									tagName: 'h2',
									value: attributes.title || '',
									onChange: ( v ) => setAttributes( { title: v } ),
									placeholder: __( 'Заголовок секции', 'new-theme' ),
								} )
							),
							el( 'div', { className: 'about__list layout__row-item-padding' },
								el( 'div', {},
									items.map( ( item, index ) =>
										el(
											'div',
											{ key: index, className: 'about__list-item' },
											el( 'span', { style: { display: 'inline-block', width: 16, height: 16, borderRadius: '50%', background: '#15A96A', marginRight: 6, flexShrink: 0 } } ),
											el( 'strong', {}, item.title || '' ),
											item.description ? el( 'p', { style: { color: '#f8faff', marginTop: 4 } }, item.description ) : null
										)
									)
								)
							)
						)
					)
				)
			);
		},
		save: () => null,
	} );

	// ── info-grid ─────────────────────────────────────────────────────────────

	registerBlockType( 'new-theme/info-grid', {
		title: __( 'Информация Grid', 'new-theme' ),
		icon: 'grid-view',
		category: 'new-theme',
		attributes: {
			title:      { type: 'string', default: '' },
			background: { type: 'string', default: '' },
			items:      { type: 'array', default: [] },
		},
		edit: ( { attributes, setAttributes } ) => {
			const items = attributes.items || [];
			const blockProps = useBlockProps();

			const inspector = el(
				InspectorControls,
				{},
				el( PanelBody, { title: 'Настройки секции' },
					text( 'Фон', attributes.background, ( v ) => setAttributes( { background: v } ) )
				),
				simpleRepeater(
					'Items',
					items,
					( next ) => setAttributes( { items: next } ),
					{ text: '', linkLabel: '', linkUrl: '' },
					( item, _i, update ) =>
						el(
							'div',
							{},
							textarea( 'Текст', item.text, ( v ) => update( { text: v } ) ),
							text( 'Текст ссылки', item.linkLabel, ( v ) => update( { linkLabel: v } ) ),
							text( 'URL ссылки', item.linkUrl, ( v ) => update( { linkUrl: v } ) )
						)
				)
			);

			return el(
				'div',
				blockProps,
				inspector,
				el(
					'section',
					{ className: 'info info--top-left', style: attributes.background ? { backgroundColor: attributes.background } : undefined },
					el( 'div', { className: 'container' },
						el( 'div', { className: 'row' },
							el( 'div', { className: 'info__heading layout__row-item-padding' },
								el( RichText, {
									tagName: 'h2',
									value: attributes.title || '',
									onChange: ( v ) => setAttributes( { title: v } ),
									placeholder: __( 'Заголовок секции', 'new-theme' ),
								} )
							),
							el( 'div', { className: 'info__list layout__row-item-padding' },
								items.map( ( item, index ) =>
									el(
										'div',
										{ key: index, className: 'info__block' },
										el( 'p', {}, item.text || '' ),
										item.linkLabel
											? el( 'p', {},
												el( 'a', { style: { fontWeight: 'bold', color: '#15a96a' } }, item.linkLabel )
											)
											: null
									)
								)
							)
						)
					)
				)
			);
		},
		save: () => null,
	} );

	// ── related-links ─────────────────────────────────────────────────────────

	registerBlockType( 'new-theme/related-links', {
		title: __( 'Редактируемые связанные ссылки', 'new-theme' ),
		icon: 'admin-links',
		category: 'new-theme',
		attributes: {
			title: { type: 'string', default: '' },
			introText: { type: 'string', default: '' },
			variant: { type: 'string', default: 'cards' },
			background: { type: 'string', default: '' },
			items: { type: 'array', default: [] },
		},
		edit: ( { attributes, setAttributes } ) => {
			const items = attributes.items || [];
			const variant = attributes.variant || 'cards';
			const stopLink = ( event ) => event.preventDefault();
			const updateItem = ( index, patch ) => {
				const next = clone( items );
				next[ index ] = { ...( next[ index ] || {} ), ...patch };
				setAttributes( { items: next } );
			};
			const sectionClass = variant === 'cards' ? 'related-links' : 'related-links related-links--' + variant;

			return el(
				'div',
				useBlockProps(),
				el(
					InspectorControls,
					{},
					el(
						PanelBody,
						{ title: 'Настройки' },
						el( SelectControl, {
							label: __( 'Вариант', 'new-theme' ),
							value: variant,
							options: [
								{ label: 'Cards', value: 'cards' },
								{ label: 'Grid', value: 'grid' },
								{ label: 'Footer Group', value: 'footer' },
							],
							onChange: ( v ) => setAttributes( { variant: v } ),
						} ),
						text( 'Фон', attributes.background, ( v ) => setAttributes( { background: v } ) )
					),
					simpleRepeater(
						'Links',
						items,
						( nextItems ) => setAttributes( { items: nextItems } ),
						{ title: 'Заголовок', text: '', image: '', url: '#', linkLabel: '' },
						( item, index, update ) =>
							el(
								'div',
								{},
								mediaImageControl( __( 'Изображение', 'new-theme' ), item.image, item.imageId, ( image, imageId ) => update( { image, imageId } ) ),
								text( 'URL', item.url, ( v ) => update( { url: v } ) ),
								text( __( 'Текст ссылки (по умолчанию: Skaityti daugiau)', 'new-theme' ), item.linkLabel, ( v ) => update( { linkLabel: v } ) )
							)
					)
				),
				el(
					'section',
					{
						className: sectionClass,
						style: attributes.background ? { backgroundColor: attributes.background } : undefined,
						'data-location': 'internal-links',
					},
					el(
						'div',
						{ className: 'container' },
						el(
							'div',
							{ className: 'row' },
							el(
								'div',
								{ className: 'related-links__heading layout__row-item-padding' },
								el( RichText, {
									tagName: 'h2',
									value: attributes.title || '',
									onChange: ( title ) => setAttributes( { title } ),
									placeholder: __( 'Заголовок связанных ссылок', 'new-theme' ),
								} ),
								el( RichText, {
									tagName: 'p',
									className: 'related-links__intro',
									value: attributes.introText || '',
									onChange: ( introText ) => setAttributes( { introText } ),
									placeholder: __( 'Вступительный текст (optional)', 'new-theme' ),
								} )
							),
							items.map( ( item, index ) =>
								el(
									'div',
									{ key: index, className: 'related-links__link layout__row-item-padding' },
									item.image ? el( 'img', {
										decoding: 'async',
										width: 60,
										height: 60,
										src: normalizePreviewHtml( item.image ),
										alt: item.title || '',
									} ) : null,
									el( RichText, {
										tagName: 'h3',
										value: item.title || '',
										onChange: ( title ) => updateItem( index, { title } ),
										placeholder: __( 'Заголовок ссылки', 'new-theme' ),
									} ),
									el( RichText, {
										tagName: 'p',
										value: item.text || '',
										onChange: ( value ) => updateItem( index, { text: value } ),
										placeholder: __( 'Текст ссылки', 'new-theme' ),
									} ),
									el( 'a', { href: item.url || '#', className: 'related-links__url', 'data-internal-link': 'true', onClick: stopLink }, item.linkLabel || 'Skaityti daugiau' )
								)
							)
						)
					)
				)
			);
		},
		save: () => null,
	} );

	// ── data-table ────────────────────────────────────────────────────────────

	registerBlockType( 'new-theme/data-table', {
		title: __( 'Редактируемая таблица данных', 'new-theme' ),
		icon: 'editor-table',
		category: 'new-theme',
		attributes: {
			title: { type: 'string', default: '' },
			background: { type: 'string', default: '' },
			mobileBehavior: { type: 'string', default: 'scroll' },
			highlightedRows: { type: 'array', default: [] },
			highlightedCells: { type: 'array', default: [] },
			headersText: { type: 'string', default: '' },
			rowsText: { type: 'string', default: '' },
			headers: { type: 'array', default: [] },
			rows: { type: 'array', default: [] },
		},
		edit: ( { attributes, setAttributes } ) => {
			const headers         = attributes.headers || [];
			const rows            = attributes.rows || [];
			const highlightedRows = attributes.highlightedRows || [];
			const highlightedCells = attributes.highlightedCells || [];

			const syncRowsText = ( nextRows ) => nextRows.map( ( row ) => ( row || [] ).join( ' | ' ) ).join( '\n' );

			const setHeaders = ( headersText ) => setAttributes( {
				headersText,
				headers: headersText.split( '|' ).map( ( v ) => v.trim() ).filter( Boolean ),
			} );
			const setRows = ( rowsText ) => setAttributes( {
				rowsText,
				rows: rowsText.split( /\r?\n/ ).filter( Boolean ).map( ( row ) => row.split( '|' ).map( ( cell ) => cell.trim() ) ),
			} );
			const updateHeader = ( index, value ) => {
				const nextHeaders = [ ...headers ];
				nextHeaders[ index ] = value;
				setAttributes( { headers: nextHeaders, headersText: nextHeaders.join( ' | ' ) } );
			};
			const updateCell = ( rowIndex, cellIndex, value ) => {
				const nextRows = rows.map( ( row ) => [ ...( row || [] ) ] );
				nextRows[ rowIndex ][ cellIndex ] = value;
				setAttributes( { rows: nextRows, rowsText: syncRowsText( nextRows ) } );
			};
			const addRow = () => {
				const nextRows = [ ...rows, new Array( headers.length ).fill( '' ) ];
				setAttributes( { rows: nextRows, rowsText: syncRowsText( nextRows ) } );
			};
			const removeRow = ( index ) => {
				const nextRows = rows.filter( ( _, i ) => i !== index );
				const nextHL   = highlightedRows.filter( ( r ) => r !== index ).map( ( r ) => r > index ? r - 1 : r );
				const nextHC   = highlightedCells.filter( ( k ) => parseInt( k ) !== index ).map( ( k ) => {
					const [ r, c ] = k.split( ':' ).map( Number );
					return r > index ? ( r - 1 ) + ':' + c : k;
				} );
				setAttributes( { rows: nextRows, rowsText: syncRowsText( nextRows ), highlightedRows: nextHL, highlightedCells: nextHC } );
			};
			const toggleRowHighlight = ( index ) => {
				const next = highlightedRows.includes( index )
					? highlightedRows.filter( ( r ) => r !== index )
					: [ ...highlightedRows, index ];
				setAttributes( { highlightedRows: next } );
			};
			const toggleCellHighlight = ( rowIndex, cellIndex ) => {
				const key  = rowIndex + ':' + cellIndex;
				const next = highlightedCells.includes( key )
					? highlightedCells.filter( ( k ) => k !== key )
					: [ ...highlightedCells, key ];
				setAttributes( { highlightedCells: next } );
			};

			const sectionClass = 'table-responsive' + ( attributes.mobileBehavior === 'stacked' ? ' table-responsive--stacked' : '' );

			return el(
				'div',
				useBlockProps(),
				el(
					InspectorControls,
					{},
					el(
						PanelBody,
						{ title: __( 'Настройки', 'new-theme' ) },
						el( SelectControl, {
							label: __( 'Поведение на мобильных', 'new-theme' ),
							value: attributes.mobileBehavior || 'scroll',
							options: [
								{ label: __( 'Горизонтальная прокрутка', 'new-theme' ), value: 'scroll' },
								{ label: __( 'Карточки столбцом', 'new-theme' ), value: 'stacked' },
							],
							onChange: ( v ) => setAttributes( { mobileBehavior: v } ),
						} ),
						text( __( 'Фон', 'new-theme' ), attributes.background, ( v ) => setAttributes( { background: v } ) )
					),
					el(
						PanelBody,
						{ title: __( 'Массовый импорт', 'new-theme' ), initialOpen: false },
						textarea( __( 'Заголовки столбцов', 'new-theme' ), attributes.headersText, setHeaders, __( 'Разделяйте колонки символом |', 'new-theme' ) ),
						textarea( __( 'Строки', 'new-theme' ), attributes.rowsText, setRows, __( 'Одна строка на линию, ячейки разделяются символом |', 'new-theme' ) )
					)
				),
				el(
					'section',
					{
						className: sectionClass,
						style: attributes.background ? { backgroundColor: attributes.background } : undefined,
						'data-location': 'table-responsive',
					},
					el(
						'div',
						{ className: 'container' },
						el(
							'div',
							{ className: 'table-responsive__heading' },
							el( RichText, {
								tagName: 'h2',
								value: attributes.title || '',
								onChange: ( title ) => setAttributes( { title } ),
								placeholder: __( 'Заголовок таблицы', 'new-theme' ),
							} )
						),
						el(
							'div',
							{ className: 'table-responsive__wrapper' },
							el(
								'table',
								{},
								el(
									'thead',
									{},
									el(
										'tr',
										{},
										headers.map( ( header, index ) =>
											el( 'th', { key: index },
												el( RichText, {
													tagName: 'span',
													value: header || '',
													onChange: ( value ) => updateHeader( index, value ),
													placeholder: __( 'Заголовок', 'new-theme' ),
												} )
											)
										)
									)
								),
								el(
									'tbody',
									{},
									rows.map( ( row, rowIndex ) => {
										const isRowHL = highlightedRows.includes( rowIndex );
										return el(
											'tr',
											{ key: rowIndex, className: isRowHL ? 'is-highlighted' : '' },
											el(
												'td',
												{ style: { width: 56, whiteSpace: 'nowrap', padding: '2px 4px' } },
												el( Button, {
													isSmall: true,
													variant: isRowHL ? 'primary' : 'secondary',
													title: __( 'Переключить выделение строки', 'new-theme' ),
													onClick: () => toggleRowHighlight( rowIndex ),
												}, '★' ),
												el( Button, {
													isSmall: true,
													isDestructive: true,
													variant: 'link',
													title: __( 'Удалить row', 'new-theme' ),
													onClick: () => removeRow( rowIndex ),
													style: { marginLeft: 4 },
												}, '✕' )
											),
											( row || [] ).map( ( cell, cellIndex ) => {
												const cellKey  = rowIndex + ':' + cellIndex;
												const isCellHL = highlightedCells.includes( cellKey );
												return el(
													'td',
													{
														key: cellIndex,
														className: isCellHL ? 'is-highlighted' : '',
														style: { position: 'relative' },
													},
													el( RichText, {
														tagName: 'span',
														value: cell || '',
														onChange: ( value ) => updateCell( rowIndex, cellIndex, value ),
														placeholder: __( 'Ячейка', 'new-theme' ),
													} ),
													el( Button, {
														isSmall: true,
														variant: 'link',
														title: __( 'Переключить выделение ячейки', 'new-theme' ),
														onClick: () => toggleCellHighlight( rowIndex, cellIndex ),
														style: { position: 'absolute', top: 2, right: 2, fontSize: 10, lineHeight: 1 },
													}, isCellHL ? '★' : '☆' )
												);
											} )
										);
									} )
								)
							)
						),
						el( Button, {
							variant: 'secondary',
							isSmall: true,
							onClick: addRow,
							style: { marginTop: 8 },
						}, __( '+ Добавить строку', 'new-theme' ) )
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

	// ── card-grid ─────────────────────────────────────────────────────────────

	registerBlockType( 'new-theme/card-grid', {
		title: __( 'Сетка карточек', 'new-theme' ),
		icon: 'grid-view',
		category: 'new-theme',
		attributes: {
			title: { type: 'string', default: '' },
		},
		edit: ( { attributes, setAttributes } ) =>
			el(
				'section',
				useBlockProps( { className: 'nt-section' } ),
				el(
					'div',
					{ className: 'nt-section__inner' },
					el( RichText, { tagName: 'h2', value: attributes.title, onChange: ( v ) => setAttributes( { title: v } ), placeholder: 'Заголовок секции' } ),
					el( 'div', { className: 'nt-card-grid' }, el( InnerBlocks, { allowedBlocks: [ 'new-theme/link-card' ], orientation: 'horizontal' } ) )
				)
			),
		save: () => el( InnerBlocks.Content ),
	} );

	// ── link-card ─────────────────────────────────────────────────────────────

	registerBlockType( 'new-theme/link-card', {
		title: __( 'Карточка-ссылка', 'new-theme' ),
		icon: 'admin-links',
		category: 'new-theme',
		parent: [ 'new-theme/card-grid' ],
		attributes: {
			title: { type: 'string', default: 'Заголовок карточки' },
			text: { type: 'string', default: '' },
			image: { type: 'string', default: '' },
			imageId: { type: 'number' },
			url: { type: 'string', default: '#' },
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
						{ title: __( 'Настройки карточки', 'new-theme' ) },
						mediaImageControl( __( 'Изображение', 'new-theme' ), attributes.image, attributes.imageId, ( image, imageId ) => setAttributes( { image, imageId } ) ),
						text( 'URL', attributes.url, ( v ) => setAttributes( { url: v } ) )
					)
				),
				el(
					'a',
					{ className: 'nt-link-card', href: attributes.url || '#', onClick: ( event ) => event.preventDefault() },
					attributes.image ? el( 'img', { className: 'nt-link-card__image', src: normalizePreviewHtml( attributes.image ), alt: attributes.title || '' } ) : el( 'span', { className: 'nt-link-card__image' } ),
					el(
						'span',
						{ className: 'nt-link-card__body' },
						el( RichText, {
							tagName: 'h3',
							value: attributes.title || '',
							onChange: ( title ) => setAttributes( { title } ),
							placeholder: __( 'Заголовок карточки', 'new-theme' ),
						} ),
						el( RichText, {
							tagName: 'p',
							value: attributes.text || '',
							onChange: ( value ) => setAttributes( { text: value } ),
							placeholder: __( 'Текст карточки', 'new-theme' ),
						} )
					)
				)
			),
		save: () => null,
	} );

	// ── faq ───────────────────────────────────────────────────────────────────

	registerBlockType( 'new-theme/faq', {
		title: __( 'FAQ', 'new-theme' ),
		icon: 'editor-help',
		category: 'new-theme',
		attributes: {
			title: { type: 'string', default: 'Dazniausiai uzduodami klausimai' },
		},
		edit: ( { attributes, setAttributes } ) =>
			el(
				'section',
				useBlockProps( { className: 'nt-section' } ),
				el(
					'div',
					{ className: 'nt-section__inner' },
					el( RichText, { tagName: 'h2', value: attributes.title, onChange: ( v ) => setAttributes( { title: v } ) } ),
					el( 'div', { className: 'nt-faq' }, el( InnerBlocks, { allowedBlocks: [ 'new-theme/faq-item' ], orientation: 'vertical' } ) )
				)
			),
		save: () => el( InnerBlocks.Content ),
	} );

	// ── faq-item ──────────────────────────────────────────────────────────────

	registerBlockType( 'new-theme/faq-item', {
		title: __( 'Элемент FAQ', 'new-theme' ),
		icon: 'editor-help',
		category: 'new-theme',
		parent: [ 'new-theme/faq' ],
		attributes: {
			question: { type: 'string', default: 'Вопрос' },
			answer: { type: 'string', default: 'Ответ' },
		},
		edit: ( { attributes, setAttributes } ) =>
			el(
				'div',
				useBlockProps(),
				el(
					'article',
					{ className: 'nt-faq-item' },
					el( RichText, {
						tagName: 'h3',
						value: attributes.question || '',
						onChange: ( question ) => setAttributes( { question } ),
						placeholder: __( 'Вопрос', 'new-theme' ),
					} ),
					el( RichText, {
						tagName: 'p',
						value: attributes.answer || '',
						onChange: ( answer ) => setAttributes( { answer } ),
						placeholder: __( 'Ответ', 'new-theme' ),
					} )
				)
			),
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
