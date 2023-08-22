(function()
{
	createNamespace("TF.DetailView.FieldEditor").DateTimeFieldEditor = DateTimeFieldEditor;

	function DateTimeFieldEditor(type)
	{
		var self = this;
		TF.DetailView.FieldEditor.InputFieldEditor.call(self, type);
		self.obValue = ko.observable();
		self.editStopOnWheel = true;
	};

	DateTimeFieldEditor.prototype = Object.create(TF.DetailView.FieldEditor.InputFieldEditor.prototype);

	DateTimeFieldEditor.prototype.constructor = DateTimeFieldEditor;

	DateTimeFieldEditor.prototype.type = "DateTime";

	DateTimeFieldEditor.prototype.format = "MM/DD/YYYY hh:mm A";

	DateTimeFieldEditor.prototype._initElement = function()
	{
		var self = this;
		self._$element = $(`<div class="custom-field-input datetime">
								<!-- ko customInput:{type: "${self.type}",value:obValue,attributes:{class:"form-control",placeholder:"${self.format.toLocaleLowerCase()}",format:"${self.format}",disablePosition:1}} -->
								<!-- /ko -->
							</div>`);
		ko.applyBindings(self, self._$element[0]);
	};

	DateTimeFieldEditor.prototype.getFormatedValue = function(value)
	{
		return moment(value).format("YYYY-MM-DDTHH:mm:ss");
	};

	DateTimeFieldEditor.prototype.togglePicker = function()
	{
		var dateTimePicker = this.getPicker();

		dateTimePicker && dateTimePicker.toggle();
	};

	DateTimeFieldEditor.prototype.shouldTriggerEditBlur = function(target)
	{
		return true;
	};

	DateTimeFieldEditor.prototype._bindEvents = function()
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
				self.adjustWidgetPosition(e.target);
				e.stopPropagation();
				return;
			}

			var picker = self.getPicker();
			var $container = picker && picker.dateView && picker.dateView.calendar && picker.dateView.calendar.element.closest(".k-animation-container");
			if ($container && $container.length > 0)
			{
				if ($.contains($container[0], e.target))
				{
					return;
				}
				let $table = $(e.target).closest("table.k-century");
				if (!$table.length)
				{
					$table = $(e.target).closest("table.k-decade");
				}
				if ($table.length && !$table.parent().length)
				{
					return;
				}
			}
			if (!$(e.target).closest("body").length && $(e.target).hasClass("glyphicon-calendar")) return;

			setTimeout(function()
			{
				self.editStop();
			}, 0);
		});

		$editorIcon.on("click" + self._eventNamespace, function(e)
		{
			self._$element.find("input").focus();
			self.togglePicker();
			self.adjustWidgetPosition(e.target);
			e.stopPropagation();
		});

		$editorIcon.on("pointerdown" + self._eventNamespace, function(e)
		{
			// stop propagation to prevent kendo behavior.
			e.stopPropagation();
		});
	};

	DateTimeFieldEditor.prototype._unbindEvents = function()
	{
		var self = this,
			$editorIcon = self._$parent.find(".editor-icon");
		$editorIcon.off(self._eventNamespace);
		$(document).off(self._eventNamespace);
	};

	DateTimeFieldEditor.prototype._getWidget = function(element)
	{
		var kendoDatePicker = $(element).parent().find(".custom-field-input input").data("kendoDateTimePicker");
		return kendoDatePicker && kendoDatePicker.dateView.div.closest(".k-animation-container");
	};

	DateTimeFieldEditor.prototype.adjustWidgetPosition = function(element)
	{
		var self = this,
			widget = self._getWidget(element),
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

		var zindex = Math.max(...Array.from($(element).parents()).map(el => parseInt($(el).css("z-index"))).filter(x => !Number.isNaN(x)));

		widget.css({ top: top, "z-index": zindex + 5 });
	};

	DateTimeFieldEditor.prototype.editStart = function($parent, options)
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

	DateTimeFieldEditor.prototype._updateParentContent = function()
	{
		var self = this,
			$content = self.getContentElement(),
			value = self.obValue(),
			text = (value === '') ? 'None' : self.momentHelper.toString(value, self.format);

		text = (text === 'Invalid date') ? 'None' : text;
		$content.text(text);
	};

	DateTimeFieldEditor.prototype.hide = function()
	{
		var self = this;

		self.closeWidget();

		TF.DetailView.FieldEditor.InputFieldEditor.prototype.hide.call(self);

		self.getContentElement().show();
	};

	DateTimeFieldEditor.prototype.dispose = function()
	{
		var self = this,
			$parent = self._$parent;

		TF.DetailView.FieldEditor.InputFieldEditor.prototype.dispose.call(self);
		$(document).off(self._eventNamespace);
		$parent.find('.editor-icon').off(self._eventNamespace);
	}

	DateTimeFieldEditor.prototype.getContentValue = function(value)
	{
		if (!value) return "";

		if (value.indexOf("&nbsp;") >= 0)
		{
			value = value.split("&nbsp;").join(" ");
		}

		var htmlSpace = String.fromCharCode(160);
		if (value.indexOf(htmlSpace) >= 0)
		{
			value = value.split(htmlSpace).join(" ");
		}

		var self = this,
			mmtObj = moment(value, [self.format], true);

		if (mmtObj.isValid())
		{
			return mmtObj.format(self.format);
		}

		mmtObj = moment(value);
		if (mmtObj.isValid())
		{
			return mmtObj.format(self.format);
		}

		return "";
	};

	DateTimeFieldEditor.prototype.save = function()
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

	DateTimeFieldEditor.prototype.getValue = function()
	{
		return this.obValue();
	};

	DateTimeFieldEditor.prototype._setElementStyle = function()
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

	DateTimeFieldEditor.prototype.editStop = function()
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

	DateTimeFieldEditor.prototype.validate = function()
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

	DateTimeFieldEditor.prototype.closeWidget = function()
	{
		var self = this,
			$input = self._$parent.find(".custom-field-input input");

		if ($input.length)
		{
			var datetimeBox = ko.dataFor($input[0]);
			if (datetimeBox && datetimeBox.dispose)
			{
				datetimeBox.dispose();
			}
		}
	};

	DateTimeFieldEditor.prototype.getPicker = function()
	{
		return this._$element.find("input").data("kendoDateTimePicker");
	};
})();