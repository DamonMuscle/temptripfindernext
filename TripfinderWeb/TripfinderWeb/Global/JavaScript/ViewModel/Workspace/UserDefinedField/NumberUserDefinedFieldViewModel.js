(function()
{
	createNamespace("TF.UserDefinedField").NumberUserDefinedFieldViewModel = NumberUserDefinedFieldViewModel;
	const DEFAULT_DECIMAL_PLACES = 0;

	function NumberUserDefinedFieldViewModel(viewModel)
	{
		var self = this;
		self.parent = viewModel;

		this.isNew = !viewModel || !viewModel.isEdit;
		this.isCopy = viewModel && viewModel.isCopy;
		var defaultDecimalPlaces = this.getInitDecimalPlaces();
		self.obDecimalPlaces = ko.observable(defaultDecimalPlaces);

		self.obFormatString = ko.observable(null);
		self.onDecimalPlacesValueChanged = self.onDecimalPlacesValueChanged.bind(self);
		self.parent.onDefaultValueKeyUp = self.onDefaultValueKeyUp.bind(self);
		self.MAX_VALUE = 9999999999.999999;
		self.MIN_VALUE = -9999999999.999999;
		this.obIsEnable = ko.observable(false);
		this.obFormatChecked = ko.observable();
		this.obFormatChecked.subscribe(this.setFormatValue.bind(this));
		this.obDecimalPlaces.subscribe(this.setFormatValue.bind(this));
		this.obComponentLoaded = ko.observable(false);
	}

	NumberUserDefinedFieldViewModel.prototype.init = function()
	{
		var self = this;
		setTimeout(() => self.obComponentLoaded(true));
	};	

	NumberUserDefinedFieldViewModel.prototype.getInitDecimalPlaces = function()
	{
		return (this.isNew || this.isCopy) ? DEFAULT_DECIMAL_PLACES : null;
	}

	NumberUserDefinedFieldViewModel.prototype.setFormatValue = function()
	{
		var self = this;
		if (self.obFormatChecked())
		{
			let length = self.obDecimalPlaces() || 2;
			let formatStr = "";
			while (length-- > 0)
			{
				formatStr = formatStr.concat('0')
			}
			self.obFormatString(`{0:0.${formatStr}}`);
		}
		else
		{
			self.obFormatString(null);
		}
	}

	NumberUserDefinedFieldViewModel.prototype.getTemplate = function()
	{
		return "modal/userdefinedfield/NumberUserDefinedField";
	};

	NumberUserDefinedFieldViewModel.prototype.getDefaultValueTemplate = function()
	{
		return `<div>
			<!-- ko customInput:{
				type:'Decimal',
				value:obDefaultValue,
				disable:isSystemDefined,
				attributes:{class:'form-control',maxlength:'20',tabindex:'4',retainPrecision:'true', name:'defaultValue'},
				events:{keyup:onDefaultValueKeyUp}
			} -->
			<!-- /ko -->
		</div>`;
	};

	NumberUserDefinedFieldViewModel.prototype.updateDefaultValue = function(entity, defaultValue)
	{
		entity["DefaultNumeric"] = isNaN(defaultValue) ? null : defaultValue;
	};

	NumberUserDefinedFieldViewModel.prototype.getDefaultValue = function(entity)
	{
		return entity["DefaultNumeric"];
	};

	NumberUserDefinedFieldViewModel.prototype.saveSpecialValue = function(entity)
	{
		entity["NumberPrecision"] = this.obDecimalPlaces();
	};

	NumberUserDefinedFieldViewModel.prototype.updateSpecialValue = function(entity)
	{
		if (!entity)
		{
			return;
		}
		var NumberPrecision = (this.isCopy && entity.Type !== 'Number') ? this.getInitDecimalPlaces() : entity.NumberPrecision;
		this.obDecimalPlaces(NumberPrecision);
		this.obFormatString(entity.FormatString);
		this.obFormatChecked(!IsEmptyString(entity.FormatString))
	};

	NumberUserDefinedFieldViewModel.prototype.onDecimalPlacesValueChanged = function()
	{
		var self = this,
			defaultValue = self.parent.obDefaultValue();

		if (defaultValue === null || defaultValue === '')
		{
			return;
		}

		var decimalPlaces = self.obDecimalPlaces() === '' ? 0 : self.obDecimalPlaces(),
			defaultValue = parseFloat(defaultValue);
		self.parent.obDefaultValue(defaultValue.toFixed(decimalPlaces));
	};

	NumberUserDefinedFieldViewModel.prototype.onDefaultValueKeyUp = function(decimalBox, e)
	{
		var self = this,
			value = decimalBox.$input.val(),
			floatValue = parseFloat(value),
			decimalPlaces = self.obDecimalPlaces(),
			index = value.indexOf('.');

		if (isNaN(Number(value)))
		{
			decimalBox.$input.val("");
			return;
		}

		if (decimalPlaces === null)
		{
			return;
		}
		if (value === '' ||
			(index === -1 &&
				floatValue !== self.MAX_VALUE &&
				floatValue !== self.MIN_VALUE))
		{
			return;
		}

		// cut the float with decimal places.
		var count = value.length - index - 1;
		if (count > decimalPlaces)
		{
			var kappa = Math.pow(10, decimalPlaces);
			var floorValue = Math.floor(floatValue * kappa) / kappa
			decimalBox.$input.val(floorValue.toFixed(decimalPlaces));
		}
	};

	NumberUserDefinedFieldViewModel.prototype.extendValidatorFields = function(validatorFields, $container)
	{
		if (!validatorFields || !$container)
		{
			return;
		}

		validatorFields.decimalPlaces = {
			trigger: "none",
			container: $container.find("input[name='decimalPlaces']").closest("div").parents()[1],
			validators: {
				notEmpty: {
					message: 'Decimal places is required'
				},
				integer: {
					message: 'Please enter a valid number'
				}
			}
		};
	};
})();
