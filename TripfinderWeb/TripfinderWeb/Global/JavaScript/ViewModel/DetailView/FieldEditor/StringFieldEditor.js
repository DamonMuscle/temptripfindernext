(function()
{
	createNamespace("TF.DetailView.FieldEditor").StringFieldEditor = StringFieldEditor;

	function StringFieldEditor(type)
	{
		var self = this;
		self.enableRightClickMenu = true;
		TF.DetailView.FieldEditor.TextFieldEditor.call(self, type);
	};

	StringFieldEditor.prototype = Object.create(TF.DetailView.FieldEditor.TextFieldEditor.prototype);

	StringFieldEditor.prototype.constructor = StringFieldEditor;

	StringFieldEditor.prototype._updateParentContent = function()
	{
		var self = this,
			$content = self.getContentElement(),
			value = !self.obValue() ? "None" : self.obValue();

		$content.text(value);
	};

	StringFieldEditor.prototype._initElement = function(options)
	{
		var self = this,
			$stringInput = $("<div class='custom-field-input string'><!-- ko customInput:{type:'String',value:obValue,attributes:{class:'form-control item-content',maxlength:'" +
				(options.maxLength || 50) + "'}} --><!-- /ko --></div>");
		ko.applyBindings(ko.observable(self), $stringInput[0]);

		self._$element = $stringInput;
	};
})();