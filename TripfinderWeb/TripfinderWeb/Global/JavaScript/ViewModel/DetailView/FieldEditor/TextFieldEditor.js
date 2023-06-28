(function()
{
	createNamespace("TF.DetailView.FieldEditor").TextFieldEditor = TextFieldEditor;

	function TextFieldEditor(type)
	{
		var self = this;
		TF.DetailView.FieldEditor.InputFieldEditor.call(self, type);

		self.obValue = ko.observable();
	};

	TextFieldEditor.prototype = Object.create(TF.DetailView.FieldEditor.InputFieldEditor.prototype);

	TextFieldEditor.prototype.constructor = TextFieldEditor;

	TextFieldEditor.prototype.bindEvents = function()
	{
		TF.DetailView.FieldEditor.InputFieldEditor.prototype.bindEvents.call(this);

		var self = this,
			$input = self._$element;

		$input.focusout(function()
		{
			$input.off('focusout');
			self.editStop();
		});
	};

	TextFieldEditor.prototype.editStart = function($parent, options)
	{
		TF.DetailView.FieldEditor.InputFieldEditor.prototype.editStart.call(this, $parent, options);

		var self = this,
			$content = self.getContentElement(),
			cssOptions = {
				'fontSize': $content.css("font-size"),
				'fontFamily': $content.css('font-family'),
				'fontWeight': $content.css('font-weight'),
				'height': $content.css('height')
			},
			$input = self._getEditingElement();

		if (!$content) return;

		if ($content.css('display') !== 'none')
		{
			$content.hide();

			$parent.append(self._$element);
			$input.focus();

			var initialValue = self._fieldContentFormatter(options.defaultValue, options);

			self.obValue(initialValue);

			self._setElementStyle(cssOptions);
		}
	};

	TextFieldEditor.prototype._fieldContentFormatter = function(value, options)
	{
		return value;
	};

	TextFieldEditor.prototype._updateParentContent = function()
	{
		var $content = this.getContentElement(),
			value = this.obValue(),
			text = (value === '' ||
				value === null ||
				value === undefined ||
				(typeof (value) === 'object' && $.isEmptyObject(value))) ? "None" : value;

		$content.text(text);
	};

	TextFieldEditor.prototype.hide = function()
	{
		TF.DetailView.FieldEditor.InputFieldEditor.prototype.hide.call(this);

		this.getContentElement().show();
		this._$parent.removeClass("form-group");
	};

	TextFieldEditor.prototype._initElement = function()
	{
		var self = this;

		self._$parent.addClass("form-group");
	};

	TextFieldEditor.prototype._setElementStyle = function(cssOptions)
	{
		var self = this,
			$element = self._getEditingElement(),
			heightValue = cssOptions.height === '0px' ? self.DEFAULT_TEXT_HEIGHT : cssOptions.height;

		$element.css({
			'border': 'none',
			'outline': 'none',
			'background': 'transparent',
			'font-size': cssOptions.fontSize,
			'font-family': cssOptions.fontFamily,
			'font-weight': cssOptions.fontWeight,
			'height': heightValue
		});
	};

	TextFieldEditor.prototype.save = function()
	{
		var self = this;
		return self.validate().then(function()
		{
			self.apply(self.obValue());
		});
	};

	TextFieldEditor.prototype.editStop = function()
	{
		var self = this;
		if (self.enableRightClickMenu)
		{
			self.obValue(self._$element.find("input,textarea").val());
		}

		return self.save()
			.then(function()
			{
				self.hide();
				self.editStopped.notify();
				self.dispose();
			});
	};

	TextFieldEditor.prototype.validate = function()
	{
		var self = this,
			validator = self.bootstrapValidator;

		if (validator)
		{
			return validator.validate().then(function(valid)
			{
				if (valid) return;

				this._errorMessages = validator.getMessages(validator.getInvalidFields());
				this._$parent.closest(".grid-stack-item").find("small.help-block").css("top", this._$parent.outerHeight());
			}.bind(this));
		}

		return Promise.resolve();
	};

	TextFieldEditor.prototype._convertValueToHtmlFormat = function(value)
	{
		// this is used for Memo text.
		return value;
	};
})();