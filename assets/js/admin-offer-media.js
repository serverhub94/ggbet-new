( function () {
	const renderPreview = ( field, value ) => {
		const preview = field.querySelector( '.new-theme-media-preview' );
		if ( ! preview ) {
			return;
		}

		const urls = ( value || '' )
			.split( /\r?\n|,/ )
			.map( ( item ) => item.trim() )
			.filter( Boolean );

		preview.innerHTML = '';
		urls.forEach( ( url ) => {
			const image = document.createElement( 'img' );
			image.src = url;
			image.alt = '';
			image.style.width = '72px';
			image.style.height = '48px';
			image.style.objectFit = 'contain';
			image.style.border = '1px solid #dcdcde';
			image.style.borderRadius = '4px';
			image.style.padding = '4px';
			image.style.background = '#fff';
			preview.appendChild( image );
		} );
	};

	document.addEventListener( 'click', ( event ) => {
		const selectButton = event.target.closest( '.js-new-theme-media-select' );
		const removeButton = event.target.closest( '.js-new-theme-media-remove' );
		const button = selectButton || removeButton;

		if ( ! button ) {
			return;
		}

		const field = button.closest( '.new-theme-media-field' );
		const input = field ? document.getElementById( field.dataset.target ) : null;

		if ( ! field || ! input ) {
			return;
		}

		event.preventDefault();

		if ( removeButton ) {
			input.value = '';
			renderPreview( field, '' );
			return;
		}

		const multiple = field.dataset.multiple === '1';
		const frame = wp.media( {
			title: multiple ? 'Select images' : 'Select image',
			button: {
				text: multiple ? 'Use selected images' : 'Use selected image',
			},
			multiple,
			library: {
				type: 'image',
			},
		} );

		frame.on( 'select', () => {
			const selected = frame.state().get( 'selection' ).toJSON();
			const urls = selected
				.map( ( item ) => item && item.url ? item.url : '' )
				.filter( Boolean );

			input.value = multiple ? urls.join( '\n' ) : ( urls[0] || '' );
			renderPreview( field, input.value );
		} );

		frame.open();
	} );
}() );
