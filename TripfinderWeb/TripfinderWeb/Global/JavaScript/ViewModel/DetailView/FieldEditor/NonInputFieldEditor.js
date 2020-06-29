(function()
{
	createNamespace("TF.DetailView.FieldEditor").NonInputFieldEditor = NonInputFieldEditor;

	function NonInputFieldEditor(type)
	{
		var self = this;
		TF.DetailView.FieldEditor.BaseFieldEditor.call(self, type);
		self.value = '';
	};

	NonInputFieldEditor.prototype = Object.create(TF.DetailView.FieldEditor.BaseFieldEditor.prototype);

	NonInputFieldEditor.prototype.constructor = NonInputFieldEditor;

	NonInputFieldEditor.prototype._initElement = function(options)
	{
		this._$input = $("<input type='text' style='left:-999px;top:-999px;width:0px;height:0px;position:absolute;' />");
		this._$element.append(this._$input);
	};

	NonInputFieldEditor.prototype.setValue = function(value)
	{
		this.value = value;
		this.onValueChanged();
	};

	NonInputFieldEditor.prototype.validate = function(value)
	{
		this._$input.val(value);
		if (this.bootstrapValidator)
		{
			this.bootstrapValidator.validate();
		}
	};

	NonInputFieldEditor.prototype.onValueChanged = function()
	{
		this.validate(this.value);
		TF.DetailView.FieldEditor.BaseFieldEditor.prototype.onValueChanged.call(this);
	};
})();