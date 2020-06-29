(function()
{
	createNamespace("TF.DetailView.FieldEditor").GroupStringFieldEditor = GroupStringFieldEditor;

	function GroupStringFieldEditor(type)
	{
		TF.DetailView.FieldEditor.StringFieldEditor.call(this, type);
	};

	GroupStringFieldEditor.prototype = Object.create(TF.DetailView.FieldEditor.StringFieldEditor.prototype);

	GroupStringFieldEditor.prototype.constructor = GroupStringFieldEditor;

	GroupStringFieldEditor.prototype.getContentElement = function()
	{
		return this._$parent.find("div.editable-field-value");
	};

	GroupStringFieldEditor.prototype.getContainerElement = function()
	{
		return this._$parent;
	};

	GroupStringFieldEditor.prototype.editStart = function($parent, options)
	{
		var self = this;

		TF.DetailView.FieldEditor.StringFieldEditor.prototype.editStart.call(self, $parent, options);

		var $stackItem = self.getGridStackItemContentElement();
		$stackItem.addClass(self.innderFieldEditingCss);
	};

	GroupStringFieldEditor.prototype.hide = function()
	{
		var self = this;

		TF.DetailView.FieldEditor.StringFieldEditor.prototype.hide.call(self);

		var $stackItem = self.getGridStackItemContentElement();
		$stackItem.removeClass(self.innderFieldEditingCss);
	};

	GroupStringFieldEditor.prototype.validate = function()
	{
		var self = this,
			validator = self.bootstrapValidator;

		if (validator)
		{
			return validator.validate().then(function(valid)
			{
				if (valid) return;

				var $container = self.getContainerElement();

				self._errorMessages = validator.getMessages(validator.getInvalidFields());
				$container.find("small.help-block").css("top", $container.outerHeight());
			});
		}

		return Promise.resolve();
	};
})();