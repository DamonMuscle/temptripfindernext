(function()
{
	createNamespace("TF.DetailView.FieldEditor").PhoneExtFieldEditor = PhoneExtFieldEditor;

	function PhoneExtFieldEditor(type)
	{
		var self = this;
		TF.DetailView.FieldEditor.TextFieldEditor.call(self, type);

	};

	PhoneExtFieldEditor.prototype = Object.create(TF.DetailView.FieldEditor.TextFieldEditor.prototype);

	PhoneExtFieldEditor.prototype.constructor = PhoneExtFieldEditor;

	PhoneExtFieldEditor.prototype._initElement = function(options)
	{
		var self = this,
			$input = $(String.format("<div class='custom-field-input phoneext'><!-- ko customInput:{type:'PhoneExt',value:obValue,attributes:{class:'form-control',maxlength:'{0}'}} --><!-- /ko --></div>", options.maxLength));
		ko.applyBindings(ko.observable(self), $input[0]);

		self._$element = $input;
	};
})();