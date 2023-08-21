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
				if (!self.obValue() && self.obValue() !== 0)
				{
					// to trigger bootstrap validator
					self._$element.find("input").blur();
				}

				if (self.obValue() || self.obValue() === 0)
				{
					self._$parent?.removeClass('validateError');
				}
				self.cancel(); // to hide input text box
				self.dispose(); // to unbind related events
			}
		});

		$editingElement.on("input", function()
		{
			self.onValueChanged();
		});

		TF.DetailView.FieldEditor.BaseFieldEditor.prototype.bindEvents.call(self);
	}
})();