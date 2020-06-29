(function()
{
	createNamespace("TF.DetailView.FieldEditor").IntegerFieldEditor = IntegerFieldEditor;

	function IntegerFieldEditor(type)
	{
		var self = this;
		TF.DetailView.FieldEditor.TextFieldEditor.call(self, type);
	};

	IntegerFieldEditor.prototype = Object.create(TF.DetailView.FieldEditor.TextFieldEditor.prototype);

	IntegerFieldEditor.prototype.constructor = IntegerFieldEditor;

	IntegerFieldEditor.prototype._initElement = function(options)
	{
		var self = this,
			html = String.format("<div class='custom-field-input integer'>\
						<!-- ko customInput:{	type:'{0}',\
												value:obValue,\
												attributes:{class:'form-control item-content',name:'integer',maxlength:'{1}'}} -->\
						<!-- /ko -->\
					</div>", options.naturalNumber ? "NaturalNumber" : "Integer", options.maxLength || 50),
			$input = $(html);
		ko.applyBindings(ko.observable(self), $input[0]);

		self._$element = $input;
	};
})();