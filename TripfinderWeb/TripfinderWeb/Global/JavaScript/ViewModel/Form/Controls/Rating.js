(function()
{
	createNamespace("TF.Control.Form").Rating = Rating;

	function Rating(options)
	{
		this.options = options;
		this._applyDefaultOptions();
		this._elem = null;
		this._value = this.options.value;
		this._ratingItems = [];
		this._init();
	}
	Rating.prototype = Object.create(TF.Control.Form.Rating.prototype);
	Rating.prototype.constructor = Rating;

	Object.defineProperty(Rating.prototype, 'element', {
		get() { return this._elem; },
		enumerable: false,
		configurable: false
	});

	Object.defineProperty(Rating.prototype, 'value', {
		get() { return this._value; },
		set(val)
		{
			this._value = val;
		},
		enumerable: false,
		configurable: false
	});

	Rating.prototype._applyDefaultOptions = function()
	{
		let opts = this.options;

		opts.min = opts.min || 1;
		opts.max = opts.max || 5;
		opts.step = opts.step || 1;
		if (opts.value != null && opts.value < opts.min)
		{
			opts.min = opts.value;
		}
		if (opts.max < opts.min)
		{
			opts.max = opts.min;
		}
	}

	Rating.prototype._init = function()
	{
		this._initElement();
		this._bindEvents();
	}

	Rating.prototype._initElement = function()
	{
		let opts = this.options,
			guid = this.guid(),
			step = opts.step,
			iptsCount = Math.ceil((opts.max - opts.min + 1) / step),
			val = opts.value;

		this._elem = document.createElement('div');
		this._elem.classList.add('tf-rating');

		if (opts.leftLabel || opts.rightLabel)
		{
			let ratingLabelContainer = document.createElement('div');
			ratingLabelContainer.classList.add('tf-rating-label-container');

			let leftLabel = document.createElement('div');
			leftLabel.classList.add('tf-rating-label');
			leftLabel.classList.add('tf-rating-left-label');
			leftLabel.innerHTML = opts.leftLabel || '';
			ratingLabelContainer.appendChild(leftLabel);
			let rightLabel = document.createElement('div');
			rightLabel.classList.add('tf-rating-label');
			rightLabel.classList.add('tf-rating-right-label');
			rightLabel.innerHTML = opts.rightLabel || '';
			ratingLabelContainer.appendChild(rightLabel);

			this._elem.appendChild(ratingLabelContainer);
		}

		let ratingContainer = document.createElement('div');
		ratingContainer.classList.add('tf-rating-container');
		this._elem.appendChild(ratingContainer);
		this._guid = guid;

		for (let i = 0; i < iptsCount; i++)
		{
			let itemValue = Math.min(opts.max, opts.min + i * step),
				ratingItem = document.createElement('div'),
				ratingValue = document.createElement('input'),
				ratingLabel = document.createElement('label'),
				id = guid + "_" + itemValue;

			ratingItem.classList.add('tf-rating-item');

			ratingValue.classList.add('tf-rating-value');
			ratingValue.id = id;
			ratingValue.name = guid;
			ratingValue.type = "radio";
			ratingValue.value = itemValue;
			if (itemValue === val)
			{
				ratingValue.checked = true;
				ratingItem.classList.add('tf-rating-item-selected');
			}

			ratingLabel.classList.add('tf-rating-label');
			ratingLabel.htmlFor = id;
			ratingLabel.innerHTML = itemValue;

			ratingItem.appendChild(ratingValue);
			ratingItem.appendChild(ratingLabel);
			this._ratingItems.push(ratingItem);

			ratingContainer.appendChild(ratingItem);
		}
	}

	Rating.prototype._bindEvents = function()
	{
		let opts = this.options;

		this._elem.addEventListener('change', (e) =>
		{
			let target = e.target;

			let selectedItem = this._elem.querySelector('.tf-rating-item-selected');

			if (selectedItem != null)
			{
				selectedItem.classList.remove('tf-rating-item-selected');
			}
			target.parentNode.classList.add('tf-rating-item-selected');
			this._value = Number(target.value);
			if (opts.change)
			{
				opts.change();
			}
		});
	}

	Rating.prototype.guid = function()
	{
		var s4 = function()
		{
			return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
		}
		return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
	};

})();
