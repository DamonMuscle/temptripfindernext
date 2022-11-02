(function()
{
	createNamespace("TF.Control.Form").RatingScaleMatrix = RatingScaleMatrix;

	function RatingScaleMatrix(options)
	{
		this.options = options;
		this._applyDefaultOptions();
		this._elem = null;
		this.matrixItems = options.fieldOptions.UDFPickListOptions ?
				options.fieldOptions.UDFPickListOptions.map(item => { return item.PickList}) : [],
		this._value = this.getValue(this.options.value);
		this._ratingItems = [];
		this._init();
	}
	RatingScaleMatrix.prototype = Object.create(TF.Control.Form.RatingScaleMatrix.prototype);
	RatingScaleMatrix.prototype.constructor = RatingScaleMatrix;

	Object.defineProperty(RatingScaleMatrix.prototype, 'element', {
		get() { return this._elem; },
		enumerable: false,
		configurable: false
	});

	Object.defineProperty(RatingScaleMatrix.prototype, 'value', {
		get() { return this._value; },
		set(val)
		{
			this._value = val;
		},
		enumerable: false,
		configurable: false
	});

	RatingScaleMatrix.prototype._applyDefaultOptions = function()
	{
		let opts = this.options;

		opts.min = opts.min || 1;
		opts.max = opts.max || 5;
		opts.step = opts.step || 1;
		if(opts.value != null && opts.value < opts.min)
		{
			opts.min = opts.value;
		}
		if(opts.max < opts.min)
		{
			opts.max = opts.min;
		}
	}

	RatingScaleMatrix.prototype._init = function()
	{
		this._initElement();
		this._bindEvents();
		setTimeout(() =>
		{
			this.updateMatrixWidth();
		}, 0);
	}

	RatingScaleMatrix.prototype._initElement = function()
	{
		let opts = this.options,
			guid = this.guid(),
			step = opts.step,
			matrixItems = this.matrixItems,
			iptsCount = Math.ceil((opts.max - opts.min + 1) / step);
			//val = this._value;
			
		this._elem = document.createElement('div');
		$(this._elem).addClass('tf-rating tf-ratingmatrix');

		if(opts.leftLabel || opts.rightLabel)
		{
			let ratingLabelContainer = document.createElement('div');
			$(ratingLabelContainer).addClass('tf-rating-label-container');

			let leftLabel = document.createElement('div');
			$(leftLabel).addClass('tf-rating-label tf-rating-left-label');
			$(leftLabel).html(opts.leftLabel || '');
			ratingLabelContainer.appendChild(leftLabel);
			let rightLabel = document.createElement('div');
			$(rightLabel).html(opts.rightLabel || '');
			$(rightLabel).addClass('tf-rating-label tf-rating-right-label');
			ratingLabelContainer.appendChild(rightLabel);

			this._elem.appendChild(ratingLabelContainer);
		}

		this._guid = guid; 
		matrixItems.forEach(item =>
		{
			let ratingContainer = document.createElement('div');
			$(ratingContainer).addClass('tf-rating-container');
			let matrixLabel = document.createElement('div');
			let $matrixLabel = $(matrixLabel);
			
			$matrixLabel.attr('title', item);
			$matrixLabel.addClass('tf-matrix-label');
			let itemTexts;
			if (TF.isPhoneDevice)
			{
				$matrixLabel.addClass('tf-matrix-label-mobile');
				itemTexts = item.match(/.{1,17}/g);	 // 17 characters in one line
				this.createMultiLines(itemTexts, matrixLabel);
				if (item.length > 17) // three line
				{
					$matrixLabel.addClass(item.length > 34 ?'three-mobile-lines' : 'two-mobile-lines');
				}
			} else
			{
				itemTexts = item.match(/.{1,25}/g); // 25 characters in one line			 		
				this.createMultiLines(itemTexts, matrixLabel);
				if (item.length > 25)
				{
					$matrixLabel.addClass('two-lines');					
				} 
			}

			ratingContainer.appendChild(matrixLabel);
			this._elem.appendChild(ratingContainer);
			this.createSingleRating(item, iptsCount, ratingContainer);
		});		
	}

	RatingScaleMatrix.prototype.createMultiLines = function (itemTexts, matrixLabel)
	{
		itemTexts.forEach(text =>
		{
			const p1 = document.createElement('p');
			$(p1).html(text);
			matrixLabel.appendChild(p1);
		});
	}

	RatingScaleMatrix.prototype.createSingleRating = function (item, iptsCount, ratingContainer)
	{
		const self = this, opts = self.options, guid = this._guid, val = self._value;
		for(let i = 0; i < iptsCount; i++)
		{
			let itemValue = Math.min(opts.max, opts.min + i * opts.step),
				ratingItem = document.createElement('div'),
				ratingValue = document.createElement('input'),
				ratingLabel = document.createElement('label'),
				id = item + "_" + guid + "_" + itemValue;

			$(ratingItem).addClass('tf-rating-item');
			$(ratingValue).addClass('tf-rating-value');
			$(ratingValue).attr({
				id: id,
				name: guid,
				type: "radio",
				value: itemValue
			});
			if(itemValue === val[item])
			{
				ratingValue.checked = true;
				$(ratingItem).addClass('tf-rating-item-selected');
			}

			$(ratingLabel).addClass('tf-rating-label');
			ratingLabel.htmlFor = id;
			$(ratingLabel).html(itemValue);

			ratingItem.appendChild(ratingValue);
			ratingItem.appendChild(ratingLabel);
			this._ratingItems.push(ratingItem);

			ratingContainer.appendChild(ratingItem);
		}
	}

	RatingScaleMatrix.prototype._bindEvents = function()
	{
		let opts = this.options;

		this._elem.addEventListener('change', (e) => {
			let target = e.target;			
			let matrixRatingContainer = $(target).closest(".tf-rating-container");
			let selectedItem = matrixRatingContainer[0].querySelector('.tf-rating-item-selected');

			if(selectedItem != null)
			{
				selectedItem.classList.remove('tf-rating-item-selected');
			}
			target.parentNode.classList.add('tf-rating-item-selected');
			let changedMatrix = target.id.split('_')[0];
			this._value[changedMatrix] = Number(target.value);
			if(opts.change)
			{
				opts.change();
			}
		});
	}

	RatingScaleMatrix.prototype.updateMatrixWidth = function ()
	{
		const matrixLabels = $(this._elem).find(".tf-matrix-label");
		const widths = matrixLabels.map(function()
		{
			return $(this).width();
		}).get();
		let width = Math.max(...widths);
		if (width === 0)
		{
			return;
		}
		matrixLabels.width(width + 5);
		$(this._elem).find(".tf-rating-left-label").css('left', width + 6);
	}

	RatingScaleMatrix.prototype.getValue = function(values) // TODO: maybe need to change value format
	{
		let value = {};
		if (!values) return value;
		values.forEach((item) => {
			// using matrix config to match saved value
			this.matrixItems.forEach((mi =>
			{
				let itemPair = item.split(mi + ": ");
				if (itemPair.length === 2 && itemPair[0] === '')
				{
					value[mi] = parseInt(itemPair[1]);
				}
			}));
			
		});
		return value;
	};
	
	RatingScaleMatrix.prototype.guid = function()
	{
		var s4 = function()
		{
			return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
		}
		return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
	};

})();
