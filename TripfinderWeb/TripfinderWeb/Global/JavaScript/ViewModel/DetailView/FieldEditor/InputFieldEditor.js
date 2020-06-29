(function()
{
	createNamespace("TF.DetailView.FieldEditor").InputFieldEditor = InputFieldEditor;

	function InputFieldEditor(type)
	{
		var self = this;
		TF.DetailView.FieldEditor.BaseFieldEditor.call(self, type);
	};

	InputFieldEditor.prototype = Object.create(TF.DetailView.FieldEditor.BaseFieldEditor.prototype);

	InputFieldEditor.prototype.constructor = InputFieldEditor;

	InputFieldEditor.prototype.bindEvents = function()
	{
		var self = this,
			$editingElement = self._getEditingElement();

		if (!self._$element) return;

		$editingElement.keyup(function(event)
		{
			var keyCode = event.keyCode || event.which;
			if (keyCode === $.ui.keyCode.ENTER)
			{
				$editingElement.trigger('change');
				self.save();
			}
			else if (keyCode === $.ui.keyCode.ESCAPE)
			{
				self.cancel();
			}
		});

		$editingElement.on("input", function()
		{
			self.onValueChanged();
		});

		TF.DetailView.FieldEditor.BaseFieldEditor.prototype.bindEvents.call(self);
	}
})();