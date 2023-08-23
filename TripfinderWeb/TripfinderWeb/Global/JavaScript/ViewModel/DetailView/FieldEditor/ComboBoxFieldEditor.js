(function()
{
	createNamespace("TF.DetailView.FieldEditor").ComboBoxFieldEditor = ComboBoxFieldEditor;

	const DEFAULT_NULL_AVATAR = "None";
	const DEFAULT_NULL_VALUE = -999; //means DBNull

	/***
	 * option{
	 * format: ComboBox,
	 * getsource:the obj of result should be {text,value} 
	 * entityKey:the field of record entity
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

		return self.initElement($content)
			.then(() =>
			{
				const initialValue = self.getFieldValue();
				if (initialValue > 0)
				{
					var item = self.findItemFromSourceBy((item) => { return item.value === initialValue });
					if (item)
					{
						self.comboBox.select(item[0]);
					}
				}
				else 
				{
					const customValue = self.getCustomFieldText();
					self.comboBox.input.val(customValue);
					var item = self.findItemFromSourceBy((item) => { return item.text === customValue });
					if (item)
					{
						self.comboBox.value(item[1].value);
					}
				}

				self.comboBox.bind("change", (e) =>
				{
					self.onValueChanged();
				});
				self.comboBox.focus();

				if (self.options.showWidget)
				{
					self.comboBox.open();
				}

				self._$parent.find("div.editor-icon").css("display", 'none');
				return Promise.resolve();
			});
	};

	ComboBoxFieldEditor.prototype.findItemFromSourceBy = function(compare)
	{
		const dataItems = this.comboBox.dataSource.data();
		for (let i = 0; i < dataItems.length; i++)
		{
			if (compare(dataItems[i]))
			{
				return [i, dataItems[i]];
			}
		}
	};

	ComboBoxFieldEditor.prototype.render = function(options)
	{
		const self = this;
		self._initElement(options).then(() => self._initValidators(options));
	}

	ComboBoxFieldEditor.prototype.editStart = function($parent, options)
	{
		var self = this;
		self.options = options;
		TF.DetailView.FieldEditor.InputFieldEditor.prototype.editStart.call(self, $parent, options);
		self.onComboBoxInit = comboBox =>
		{
			comboBox.open();
			$(comboBox.input).off("keydown").on(`keydown${self._eventNamespace}`, (e) =>
			{
				const keyCode = e.keyCode || e.which;
				if ($.ui.keyCode.DOWN === keyCode && !comboBox.popup.visible())
				{
					comboBox.open();
					return;
				}
				comboBox._keydown(e);
			})
			if (self._$parent)
			{
				self._$parent.on(`keydown${self._eventNamespace}`, function(e)
				{
					const keyCode = e.keyCode || e.which;
					if ([$.ui.keyCode.ENTER, $.ui.keyCode.UP, $.ui.keyCode.DOWN].some(code => code === keyCode))
					{
						e.preventDefault();
						e.stopPropagation();
					}
				});
			}
		}
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
			// e.stopImmediatePropagation();
			// e.stopPropagation();
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
		self._$parent.find('.comboBoxContainer').css("display", "none");
		self._$parent.find("div.editor-icon").css("display", "");
		self.getContentElement().show();
	}

	ComboBoxFieldEditor.prototype.initElement = function($content)
	{
		var self = this, pre_container = self._$parent.find('#comboBoxInputContainer');
		if (pre_container.length === 0)
		{
			var container = $('<div id="comboBoxInputContainer" class="comboBoxContainer"></div>'),
				$input = $('<input id="comboBoxInput" class="comboBoxInput"/>');

			$input.css("height", $content.css('height'));

			container.append($input);
			self._$parent.append(container);

			self._$element = container;

			const { getSource, allowNullValue, nullAvatar } = self.options;

			return getSource()
				.then((source) =>
				{
					source = _sortByAlphaOrderWithTitles(source);

					if (allowNullValue)
					{
						source.unshift({
							text: nullAvatar || DEFAULT_NULL_AVATAR,
							value: DEFAULT_NULL_VALUE
						});
					}

					$input.kendoComboBox({
						dataTextField: 'text',
						dataValueField: 'value',
						dataSource: source,
						filter: "startswith",
						autoWidth: false,
						highlightFirst: false,
						template: `<div class="comboBoxItem" title="#: text #"> #: text #</div>`,
					});

					container.find("span.k-dropdown-wrap").addClass("comboBox-dropdown-wrap");
					container.find("span.k-select").addClass("comboBox-select-wrap");
					container.find("span.k-icon.k-i-arrow-s").addClass("comboBox-arrow-warp");

					self.comboBox = $input.data("kendoComboBox");
					self.comboBox.ul.addClass("custom_comboxUl");
					self.comboBox.popup.bind("open", () =>
					{
						var $element = self._$parent.find('#comboBoxInputContainer');
						var itemOffset = $element.offset().top;
						var comboxHeight = $element.height();
						var windowHeight = $(window).height();
						var bottomRestHeight = windowHeight - itemOffset - comboxHeight;
						var height = Math.max(bottomRestHeight, self.comboBox.options.height);
						self.comboBox.listView.element.closest(".k-animation-container").height(height + 2);
						self.comboBox.listView.element.closest(".k-list-container").height(height);
						self.comboBox.listView.element.closest(".k-list-scroller").height(height);
					});

					self.onComboBoxInit && self.onComboBoxInit(self.comboBox);
				});
		}
		else
		{
			pre_container.css("display", "block");
			self.comboBox = pre_container.find('#comboBoxInput').data("kendoComboBox");
		}

		return Promise.resolve();
	}

	ComboBoxFieldEditor.prototype.closeWidget = function()
	{
		if (this.comboBox)
		{
			this.comboBox.close();
		}

		if (self._$parent)
		{
			self._$parent.off(`keydown${self._eventNamespace}`);
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
		const self = this;
		if (!self.comboBox)
		{
			self.apply(self.options.defaultValue);
		}
		else if (self.comboBox.selectedIndex === -1)
		{
			const text = self.comboBox.text();
			const dataItems = self.comboBox.dataSource.data();
			const match = dataItems.find(o => o.text === text);

			if (!match)
			{
				self.apply(null, text);
				return;
			}
			else
			{
				self.apply(match.value, match.text);
			}
		}

		const selectedValue = self.comboBox.value();
		if (selectedValue === DEFAULT_NULL_VALUE)
		{
			self.apply(null, "");
		}
		else
		{
			self.apply(selectedValue, self.comboBox.text());
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

		result.selectPickListOptionIDs = (value === null || value === undefined) ? [] : [value];
		result.selectedItem = this.comboBox.dataItem();
		return result;
	};

	ComboBoxFieldEditor.prototype.getFieldValue = function()
	{
		const { recordEntity, editFieldList, entityKey } = this.options;
		let value = null;

		if (editFieldList[entityKey])
		{
			value = editFieldList[entityKey].value;
		}
		else if (recordEntity)
		{
			value = recordEntity[entityKey];
		}

		return +value || DEFAULT_NULL_VALUE;
	};

	ComboBoxFieldEditor.prototype.getCustomFieldText = function()
	{
		const { editFieldList, entityKey } = this.options;
		const defaultValue = this.options.defaultValue ?? "";
		return editFieldList[entityKey] ? editFieldList[entityKey].textValue : defaultValue;
	};

	ComboBoxFieldEditor.prototype.dispose = function()
	{
		var self = this;
		$(document).off(self._eventNamespace);

		if (self._$parent)
		{
			self._$parent.off(`keydown${self._eventNamespace}`);
		}

		if (self.comboBox)
		{
			$(self.comboBox).off("change");
			self.comboBox.destroy();
			$(self.comboBox).remove();
		}

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
