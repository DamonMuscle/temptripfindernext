(function()
{
	createNamespace("TF.DetailView.FieldEditor").ZipCodeFieldEditor = ZipCodeFieldEditor;

	function ZipCodeFieldEditor(type)
	{
		TF.DetailView.FieldEditor.NumberFieldEditor.call(this, type);
		this._decimalPlaces = 0;
	};

	ZipCodeFieldEditor.prototype = Object.create(TF.DetailView.FieldEditor.NumberFieldEditor.prototype);

	ZipCodeFieldEditor.prototype.constructor = ZipCodeFieldEditor;

	ZipCodeFieldEditor.prototype._initElement = function(options)
	{
		var self = this,
			$input = $("<div class='custom-field-input number'><!-- ko customInput:{type:'Decimal',value:obValue,attributes:{class:'form-control item-content', name:'number', retainPrecision:'true', maxlength:'5'}} --><!-- /ko --></div>");
		ko.applyBindings(ko.observable(self), $input[0]);

		self._$element = $input;
	};

	ZipCodeFieldEditor.prototype.getSpecialValidators = function(options)
	{
		return {
			zipCode: {
				country: "US",
				message: String.format("{0}{1} is not a valid zip coder", !options.UDFId ? "" : "(User Defined) ", options.title)
			}
		}
	}

})()