(function()
{
	createNamespace("TF.DetailView.FieldEditor").NumberFieldEditor = NumberFieldEditor;

	var DEFAULT_DECIMAL_PLACES = 2;

	function NumberFieldEditor(type)
	{
		var self = this;
		TF.DetailView.FieldEditor.TextFieldEditor.call(self, type);

		self.MAX_INTEGER_VALUE = 9999999999;  // decimal(18, 8), the integer part max number is 10 digits.

		self._decimalPlaces = DEFAULT_DECIMAL_PLACES;
		self.onInputValueKeyUp = self.onInputValueKeyUp.bind(self);
		self.onFocusout = self.onFocusout.bind(self);
	};

	NumberFieldEditor.prototype = Object.create(TF.DetailView.FieldEditor.TextFieldEditor.prototype);

	NumberFieldEditor.prototype.constructor = NumberFieldEditor;

	/**
	 * Initialize the number input element.
	 *
	 * @param {Object} options
	 */
	NumberFieldEditor.prototype._initElement = function(options)
	{
		var self = this,
			precision = self._getUDFDecimalPrecision(options),
			isNumberUDF = self.isNumberUDF(options),
			inputHtml,
			$input;

		inputHtml = `<div ${isNumberUDF ? "class='custom-field-input number'" : ""}>
						<!-- ko customInput:{type:'Decimal',
											value:obValue,
											attributes:{
												class:'form-control item-content',
												name:'number',
												retainPrecision:'true',
												maxlength:'${options.maxLength || 19}'
												${options.maxValue > 0 ? ",max:" + options.maxValue : ""}
											},
											events:{keyup:onInputValueKeyUp${isNumberUDF ? ",focusout:onFocusout" : ""}}} -->
						<!-- /ko -->
					</div>`;

		$input = $(inputHtml);

		ko.applyBindings(ko.observable(self), $input[0]);
		self._$element = $input;

		if (isNumberUDF)
		{
			self._decimalPlaces = typeof precision === "number" ? precision : DEFAULT_DECIMAL_PLACES;
		}
	};

	/**
	 * Handler when keyup on number input.
	 *
	 * @param {Object} decimalBox
	 * @param {Event} e
	 * @returns
	 */
	NumberFieldEditor.prototype.onInputValueKeyUp = function(decimalBox, e)
	{
		var self = this,
			inputValue = decimalBox.$input.val(),
			number = parseFloat(inputValue),
			decimalPlaces = self.getCurrentPrecisionValue(),
			index = inputValue.indexOf('.');

		if (inputValue === '' || isNaN(number)) return;

		if (inputValue > self.MAX_INTEGER_VALUE)
		{
			// cut last integer digit.
			var integerValue = Math.floor(number),
				realValue = number - integerValue,
				cutIntegerValue = Math.floor(integerValue / 10);

			number = cutIntegerValue + realValue;
			if (decimalPlaces !== null && index !== -1)
			{
				number = number.toFixed(decimalPlaces);
			}
			decimalBox.$input.val(number);
			self.obValue(number);
		}
		if (decimalPlaces == null || index === -1) return;

		// cut the float with decimal places.
		var count = number.toString().length - index - 1;
		if (count > decimalPlaces)
		{
			var kappa = Math.pow(10, decimalPlaces),
				floorValue = Math.floor(number * kappa) / kappa,
				outputValue = floorValue.toFixed(decimalPlaces);
			decimalBox.$input.val(outputValue);
			self.obValue(outputValue);
		}

		if (inputValue.length - index - 1 > decimalPlaces)
		{
			decimalBox.$input.val(number.toFixed(decimalPlaces));
			self.obValue(number.toFixed(decimalPlaces));
		}
	};

	NumberFieldEditor.prototype.onFocusout = function(decimalBox, e)
	{
		var self = this,
			number = parseFloat(tf.dataFormatHelper.clearNumberFormatter(decimalBox.$input.val())),
			precision = self.getCurrentPrecisionValue(),
			value = number.toFixed(precision);

		decimalBox.$input.val(isNaN(value) ? "None" : value);
		self.obValue(isNaN(value) ? "None" : value);
	};


	/**
	 * Content formatter for Number field.
	 *
	 * @param {number} value
	 * @param {object} options
	 * @returns
	 */
	NumberFieldEditor.prototype._fieldContentFormatter = function(value, options)
	{
		var self = this, precision = self.getCurrentPrecisionValue();
		value = tf.dataFormatHelper.clearNumberFormatter(value);
		value = parseFloat(value).toFixed(precision || 0);

		return isNaN(value) ? "" : value;
	};

	/**
	 * Get number UDF precision. 
	 *
	 * @param {object} options
	 * @returns
	 */
	NumberFieldEditor.prototype._getUDFDecimalPrecision = function(options)
	{
		if (!this.isNumberUDF(options))
		{
			return;
		}

		var numberField = options.recordEntity &&
			options.recordEntity["UserDefinedFields"] &&
			options.recordEntity["UserDefinedFields"].find(function(item)
			{
				return item.Id === options.UDFId;
			}),
			precision = numberField && numberField.NumberPrecision;

		if (typeof precision != "number")
		{
			var definition = tf.UDFDefinition.getUDFById(options.UDFId);
			precision = definition && definition.Precision;
		}

		return precision;
	};

	/**
	 * Check if this is a number UDF.
	 *
	 * @param {object} options
	 * @returns
	 */
	NumberFieldEditor.prototype.isNumberUDF = function(options)
	{
		if (!(options && options.UDFId))
		{
			return false;
		}

		var matchedUDF = tf.UDFDefinition.getUDFById(options.UDFId);
		return (options.recordEntity
			&& options.recordEntity["UserDefinedFields"]
			&& options.recordEntity["UserDefinedFields"].some(function(udf)
			{
				return udf.Id === options.UDFId && udf.Type === "Number";
			}))
			|| (matchedUDF && matchedUDF.type == "number");
	};

	NumberFieldEditor.prototype.getCurrentPrecisionValue = function()
	{
		return typeof (this._decimalPlaces) === "number" ? this._decimalPlaces : DEFAULT_DECIMAL_PLACES;
	};
})();

(function()
{
	createNamespace("TF.DetailView.FieldEditor").MoneyFieldEditor = MoneyFieldEditor;

	function MoneyFieldEditor()
	{
		var self = this;
		TF.DetailView.FieldEditor.NumberFieldEditor.call(self);
	};

	MoneyFieldEditor.prototype = Object.create(TF.DetailView.FieldEditor.NumberFieldEditor.prototype);

	MoneyFieldEditor.prototype._updateParentContent = function()
	{
		var $content = this.getContentElement(),
			value = Number(this.obValue()),
			text = Number.isNaN(value) ? "None" : tf.helpers.detailViewHelper.formatDataContent(value, "Number", "Money");

		$content.text(text);
	};
})();