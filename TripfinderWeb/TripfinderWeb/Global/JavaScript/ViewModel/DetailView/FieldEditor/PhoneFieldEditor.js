(function()
{
	createNamespace("TF.DetailView.FieldEditor").PhoneFieldEditor = PhoneFieldEditor;

	function PhoneFieldEditor(type)
	{
		var self = this;
		TF.DetailView.FieldEditor.TextFieldEditor.call(self, type);
	};

	PhoneFieldEditor.prototype = Object.create(TF.DetailView.FieldEditor.TextFieldEditor.prototype);

	PhoneFieldEditor.prototype.constructor = PhoneFieldEditor;

	PhoneFieldEditor.prototype._initElement = function()
	{
		var self = this,
			$input = $("<div class='custom-field-input phone'><!-- ko customInput:{type:'Phone',value:obValue,attributes:{class:'form-control',maxlength:'18'}} --><!-- /ko --></div>");
		ko.applyBindings(ko.observable(self), $input[0]);

		self._$element = $input;
	};

	PhoneFieldEditor.prototype._getAppliedResult = function(data, value, text)
	{
		var result = TF.DetailView.FieldEditor.BaseFieldEditor.prototype._getAppliedResult.call(this, data, value, text);

		if (!!value)
		{
			value = value.replace(/\D+/ig, "");
			result.recordValue = tf.helpers.detailViewHelper.formatDataContent(value, "String", "Phone");
		}

		return result;
	};

	PhoneFieldEditor.prototype.getSpecialValidators = function(options)
	{
		return {
			phoneinplus: {
				country: "US",
				message: String.format("{0}{1} is not a valid phone number", !options.UDFId ? "" : "(User Defined) ", options.title)
			}
		}
	};
})();

(function()
{
	createNamespace("TF.DetailView.FieldEditor").FaxFieldEditor = FaxFieldEditor;

	function FaxFieldEditor()
	{
		var self = this;
		TF.DetailView.FieldEditor.PhoneFieldEditor.apply(self, arguments);
	};

	FaxFieldEditor.prototype = Object.create(TF.DetailView.FieldEditor.PhoneFieldEditor.prototype);

	FaxFieldEditor.prototype.getSpecialValidators = function(options)
	{
		return {
			phoneinplus: {
				country: "US",
				message: String.format("{0}{1} is not a valid fax number", !options.UDFId ? "" : "(User Defined) ", options.title)
			}
		}
	};
})();