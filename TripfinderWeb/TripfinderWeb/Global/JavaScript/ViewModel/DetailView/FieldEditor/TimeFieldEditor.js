(function()
{
	createNamespace("TF.DetailView.FieldEditor").TimeFieldEditor = TimeFieldEditor;

	function TimeFieldEditor(type)
	{
		var self = this;
		TF.DetailView.FieldEditor.InputFieldEditor.call(self, type);
		self.obValue = ko.observable();
	};

	TimeFieldEditor.prototype = Object.create(TF.DetailView.FieldEditor.InputFieldEditor.prototype);

	TimeFieldEditor.prototype.constructor = TimeFieldEditor;

	TimeFieldEditor.prototype.validator = {};

	TimeFieldEditor.prototype.type = "Time";

	TimeFieldEditor.prototype.format = "hh:mm A";

	TimeFieldEditor.prototype._initElement = function(options)
	{
		var self = this;
		self._$element = $("<div class='custom-field-input datetime'><!-- ko customInput:{type:\"" + self.type + "\",value:obValue,attributes:{class:\"form-control\",format:'" + self.format + "'}} --><!-- /ko --></div>");
		ko.applyBindings(self, self._$element[0]);
	};

	TimeFieldEditor.prototype.togglePicker = function()
	{
		var dateTimePicker = this.getPicker();
		if (dateTimePicker)
		{
			dateTimePicker.toggle();
		}
	};

	TimeFieldEditor.prototype.shouldTriggerEditBlur = function(target)
	{
		return true;
	};

	TimeFieldEditor.prototype._bindEvents = function()
	{
		var self = this,
			$editorIcon = self._$parent.find(".editor-icon");

		$(document).on("click" + self._eventNamespace, function(e)
		{
			if (e.target === self._$element.find("input")[0]) return;
			if (e.target === $editorIcon[0]) return;
			if (!self.shouldTriggerEditBlur(e.target)) return;
			if (e.target === self._$element[0])
			{
				self.togglePicker();
				self.adjustWidgetPosition();
				e.stopPropagation();
				return;
			}

			setTimeout(function()
			{
				self.editStop();
			}, 0);
		});

		$editorIcon.on("click" + self._eventNamespace, function(e)
		{
			self._$element.find("input").focus();
			self.togglePicker();
			self.adjustWidgetPosition();
			e.stopPropagation();
		});

		$editorIcon.on("pointerdown" + self._eventNamespace, function(e)
		{
			// stop propagation to prevent kendo behavior.
			e.stopPropagation();
		});
	};

	TimeFieldEditor.prototype._unbindEvents = function()
	{
		var self = this,
			$editorIcon = self._$parent.find(".editor-icon");
		$editorIcon.off(self._eventNamespace);
		$(document).off(self._eventNamespace);
	};

	TimeFieldEditor.prototype._getWidget = function()
	{
		return $("body>.bootstrap-datetimepicker-overlay>.bootstrap-datetimepicker-widget:last");
	};

	TimeFieldEditor.prototype.adjustWidgetPosition = function()
	{
		var self = this,
			widget = self._getWidget(),
			widgetWidth = widget.width(),
			bodyWidth = $("body").width(),
			bodyHeight = $("body").height(),
			$editorIcon = self._$parent.find(".editor-icon");

		widget.css('left', $editorIcon.offset().left - widget.outerWidth() / 2 + $editorIcon.outerWidth() / 2);
		if (widget.offset().left > bodyWidth - widgetWidth)
		{
			widget.css('left', bodyWidth - widgetWidth - 10);
		}
		else if (widget.offset().left < 5)
		{
			widget.css('left', 10);
		}

		var top = $editorIcon.offset().top + $editorIcon.outerHeight();
		if (top + widget.outerHeight() >= bodyHeight)
		{
			top = $editorIcon.offset().top - widget.outerHeight();
		}

		widget.css('top', top);
	};

	TimeFieldEditor.prototype.editStart = function($parent, options)
	{
		var self = this;
		TF.DetailView.FieldEditor.InputFieldEditor.prototype.editStart.call(self, $parent, options);

		var $content = $parent.find("div.item-content");

		if (!$content) return;

		if ($content.css("display") !== "none")
		{
			$content.hide();
			$parent.append(self._$element);
			var valueInContent = $content.text(), // restore value from last editing (stored in FieldEditorHelper.editFieldList), if not available (due to failed validation), use value from $content 
				originalValue = self.getContentValue(options.defaultValue !== undefined ? options.defaultValue : valueInContent);
			self.obValue(originalValue);

			self.obValue.subscribe(function(newValue)
			{
				if (self.getContentValue(newValue) === originalValue)
				{
					return;
				}

				self.onValueChanged();
				self.save();
			});

			self._setElementStyle();
		}

		var $input = self._$element.find("input");
		$input.focus();
		$input.off("focusout.kendoDatePicker");// kill kendo default behavior.
		self._bindEvents();

		if (options.showWidget)
		{
			self._$parent.find(".editor-icon").click();
		}
	};

	TimeFieldEditor.prototype._updateParentContent = function()
	{
		var self = this,
			$content = self.getContentElement(),
			value = self.obValue(),
			text = (value === '') ? 'None' : self.momentHelper.toString(value, self.format);

		text = (text === 'Invalid date') ? 'None' : text;
		$content.text(text);
	};

	TimeFieldEditor.prototype.hide = function()
	{
		var self = this;

		self.closeWidget();

		TF.DetailView.FieldEditor.InputFieldEditor.prototype.hide.call(self);

		self.getContentElement().show();
	};

	TimeFieldEditor.prototype.dispose = function()
	{
		var self = this,
			$parent = self._$parent;

		TF.DetailView.FieldEditor.InputFieldEditor.prototype.dispose.call(self);
		$(document).off(self._eventNamespace);
		$parent.find('.editor-icon').off(self._eventNamespace);
	}

	TimeFieldEditor.prototype.save = function()
	{
		var self = this;

		return self.validate().then(function()
		{
			var value = self.getValue();
			value = (value === '') ? null : self.getFormatedValue(value);
			value = (value === 'Invalid date') ? null : value;
			self.apply(value);
		});
	};

	TimeFieldEditor.prototype._setElementStyle = function()
	{
		var self = this,
			$input = self._$element.find("input"),
			$target = self.getContentElement(),
			$datePickerButton = self._$element.find(".datepickerbutton"),
			heightValue = $target.height(),
			cssOptions = {
				'height': heightValue === 0 ? self.DEFAULT_TEXT_HEIGHT : heightValue + 'px'
			};

		$input.css({
			"font-size": $target.css("font-size"),
			"height": cssOptions.height,
			"border": 'none',
		});

		$datePickerButton.css("display", "none");
	};

	TimeFieldEditor.prototype.editStop = function()
	{
		var self = this;
		self._unbindEvents();
		return self.save().then(function()
		{
			self.hide();
			self.editStopped.notify();
			self.dispose();
		});
	};

	TimeFieldEditor.prototype.validate = function()
	{
		var self = this,
			validator = self._$element.data("bootstrapValidator");

		if (validator)
		{
			return validator.validate().then(function(valid)
			{
				if (valid) return;

				self._errorMessages = validator.getMessages(validator.getInvalidFields());
				self._$parent.closest(".grid-stack-item").find("small.help-block").css("top", self._$parent.outerHeight());
			});
		}

		return Promise.resolve();
	};

	TimeFieldEditor.prototype.getPicker = function()
	{
		return this._$element.find("input").data("DateTimePicker");
	};

	TimeFieldEditor.prototype.getValue = function()
	{
		return this.getContentValue(this.obValue());
	};

	TimeFieldEditor.prototype.getFormatedValue = function(value)
	{
		if (value.indexOf('T') === -1)
		{
			value = "1899/12/30 " + value;
		}
		return moment(value).format("HH:mm:ss");
	};

	TimeFieldEditor.prototype.getContentValue = function(value)
	{
		if (!value) return "";

		if (value.indexOf('T') === -1)
		{
			return moment(value, [this.format, "HH:mm:ss"]).format(this.format);
		}
		else
		{
			return moment(value).format(this.format);
		}
	};

	TimeFieldEditor.prototype.closeWidget = function()
	{
		var dateTimePicker = this._$element.find("input").data("DateTimePicker");
		if (dateTimePicker)
		{
			dateTimePicker.destroy();
		}
	};
})();