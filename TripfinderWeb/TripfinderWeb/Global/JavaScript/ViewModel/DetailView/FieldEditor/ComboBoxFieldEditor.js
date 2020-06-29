(function()
{
	createNamespace("TF.DetailView.FieldEditor").ComboBoxFieldEditor = ComboBoxFieldEditor;

	/***
	 * option{
	 * format: ComboBox,
	 * getsource:the obj of result should be {text,value} 
	 * entityKey:the field of record entity
	 * textField:the text field of entity. Required
	 * valueField:the actual value of entity when item selected. Default is textField.
	 * }
	 * 
	*/
	function ComboBoxFieldEditor(type)
	{
		var self = this;
		TF.DetailView.FieldEditor.InputFieldEditor.call(self, type);
		self.comboBox = null;
	}

	ComboBoxFieldEditor.prototype = Object.create(TF.DetailView.FieldEditor.InputFieldEditor.prototype);

	ComboBoxFieldEditor.prototype.constructor = ComboBoxFieldEditor;

	ComboBoxFieldEditor.prototype._initElement = function()
	{
		var self = this,
			$content = self.getContentElement();
		$content.hide();
		var selectedValue = self.options.defaultValue;

		self.initElement($content)
			.then(function()
			{
				self.comboBox.text(selectedValue);
				self.comboBox.bind("change", function(e)
				{
					self.onValueChanged();
				});
				self.comboBox.focus();
				if (self.options.showWidget)
				{
					self.comboBox.open();
				}
				self._$parent.find("div.editor-icon").css({
					'display': 'None'
				});
			});
	};

	ComboBoxFieldEditor.prototype.editStart = function($parent, options)
	{
		var self = this;
		self.options = options;
		TF.DetailView.FieldEditor.InputFieldEditor.prototype.editStart.call(self, $parent, options);
	}

	ComboBoxFieldEditor.prototype.bindEvents = function()
	{
		var self = this;
		$(document).on("click" + self._eventNamespace, function(e)
		{
			if ($(e.target).parents('div#comboBoxInputContainer').length == 0)
			{
				self.editStop();
			}
			/* 			e.stopImmediatePropagation();
						e.stopPropagation(); */
		});

		TF.DetailView.FieldEditor.InputFieldEditor.prototype.bindEvents.call(self);
	}

	ComboBoxFieldEditor.prototype.editStop = function()
	{
		var self = this;
		return self.validate().then(function()
		{
			self.hide();
			self._applyComboBoxValue();
			self.editStopped.notify();
			self.dispose();
		});
	};

	ComboBoxFieldEditor.prototype.hide = function()
	{
		TF.DetailView.FieldEditor.InputFieldEditor.prototype.hide.call(this);
		var self = this;
		self._$parent.find('.comboBoxContainer')
			.css({
				display: 'none'
			});
		self._$parent.find("div.editor-icon").css({
			'display': 'block'
		});
		self.getContentElement().show();
	}

	ComboBoxFieldEditor.prototype.initElement = function($content)
	{
		var self = this, pre_container = self._$parent.find('#comboBoxInputContainer');
		if (pre_container.length === 0)
		{
			var container = $('<div id="comboBoxInputContainer" class="comboBoxContainer"></div>'),
				$input = $('<input id="comboBoxInput" class="comboBoxInput"/>');
			$input.css({
				'height': $content.css('height')
			});

			container.append($input);
			self._$parent.append(container);

			self._$element = container;

			return self.options['getSource']()
				.then(function(res)
				{
					$input.kendoComboBox(
						{
							dataTextField: self.options.textField,
							dataValueField: self.options.valueField,
							dataSource: _sortByAlphaOrderWithTitles(res),
							filter: "startswith",
							autoWidth: false,
							highlightFirst: false,
							template: '<div class="comboBoxItem"> #: ' + self.options.textField + ' #</div>'
						});
					container.find("span.k-dropdown-wrap").addClass("comboBox-dropdown-wrap");
					container.find("span.k-select").addClass("comboBox-select-wrap");
					container.find("span.k-icon.k-i-arrow-s").addClass('comboBox-arrow-warp');

					self.comboBox = $input.data("kendoComboBox");
					self.comboBox.ul.addClass('custom_comboxUl');
					self.comboBox.bind('open', function()
					{
						var container = self._$parent.find('#comboBoxInputContainer');
						var itemOffset = container.offset().top;
						var comboxHeight = container.height();
						var windowHeight = $(window).height();
						var bottomRestHeight = windowHeight - itemOffset - comboxHeight;
						self.comboBox.setOptions({ height: Math.max(bottomRestHeight, itemOffset) });
					});
				});
		}
		else
		{
			pre_container.css({
				display: 'block'
			});
			self.comboBox = pre_container.find('#comboBoxInput').data("kendoComboBox");
			return Promise.resolve();
		}
	}

	ComboBoxFieldEditor.prototype.closeWidget = function()
	{
		if (this.comboBox)
		{
			this.comboBox.close();
		}
	}

	ComboBoxFieldEditor.prototype.validate = function()
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

	ComboBoxFieldEditor.prototype._applyComboBoxValue = function()
	{
		if (this.comboBox == null)
		{
			this.apply(this.options.defaultValue);
		}
		if (this.comboBox.selectedIndex === -1)
		{
			return this.apply(this.comboBox.text());
		} else
		{
			return this.apply(this.comboBox.value(), this.comboBox.text());
		}
	}

	ComboBoxFieldEditor.prototype._updateParentContent = function()
	{
		var $content = this.getContentElement(),
			value = this.comboBox.text();
		$content.text(value);
	}

	ComboBoxFieldEditor.prototype._getAppliedResult = function(data, value, text)
	{
		var self = this,
			result = TF.DetailView.FieldEditor.InputFieldEditor.prototype._getAppliedResult.call(self, data, value, text);

		result.selectedItem = this.comboBox.dataItem();
		return result;
	};

	ComboBoxFieldEditor.prototype.dispose = function()
	{
		var self = this;
		$(self.comboBox).off("change");
		$(document).off(self._eventNamespace);
		self.comboBox.destroy();
		$(self.comboBox).remove();
		TF.DetailView.FieldEditor.InputFieldEditor.prototype.dispose.call(self);
	};

	function _sortByAlphaOrderWithTitles(source)
	{
		var groups = [], currentGroup = [];

		source.forEach(function(item)
		{
			if (item.isTitle)
			{
				if (currentGroup.length > 0)
				{
					groups.push(currentGroup);
				}

				currentGroup = [];
			}

			currentGroup.push(item);
		});

		groups.push(currentGroup);

		if (groups.length > 1)
		{
			var sortedSource = [];
			groups.forEach(function(group)
			{
				sortedSource.push(group[0]);//title item
				sortedSource = sortedSource.concat(Array.sortBy(group.slice(1), "text"));
			});

			return sortedSource;
		}
		else
		{
			return Array.sortBy(source, "text");
		}
	};
})()
