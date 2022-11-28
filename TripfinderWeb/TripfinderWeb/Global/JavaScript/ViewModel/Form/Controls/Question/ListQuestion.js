(function ()
{
	createNamespace("TF.Control.Form").ListQuestion = ListQuestion;

	function ListQuestion()
	{
		const self = this;
		TF.Control.Form.BaseQuestion.apply(this, arguments);
		if (TF.isMobileDevice)
		{
			$(window).on("orientationchange.lfdq", function()
			{
				setTimeout(function()
				{
					if (self.multiSelect)
					{
						self.multiSelect.close();
					}
					else if (self.comboBox)
					{
						self.comboBox.close();
					}
				});
			});
		}
	}

	ListQuestion.prototype = Object.create(TF.Control.Form.BaseQuestion.prototype);
	ListQuestion.prototype.constructor = ListQuestion;

	Object.defineProperty(ListQuestion.prototype, 'dirty', {
		get()
		{
			// multi-select
			if (Array.isArray(this.value))
			{
				const oldValue = this.convertToSavedValue(this.initialValue, true)
				const valueArr = this.value.sort();
				const valueIntial = oldValue.sort();
				return valueArr.join(',') !== valueIntial.join(',')
			}
			// single select
			const oldValue = this.convertToSavedValue(this.initialValue, false);
			return oldValue !== (this.value || '');
		}
	});

	ListQuestion.prototype.hasValue = function ()
	{
		return !(this.value == null || this.value == '' || (Array.isArray(this.value) && this.value.length == 0));
	}

	ListQuestion.prototype.initQuestionContent = function()
	{
		const isDropDown = this.field.FieldOptions.PickListIsDropdown;
		return !isDropDown
			? this.buildNormalListQuestionContent()
			: this.buildDropDownListQuestionContent();
	}

	ListQuestion.prototype.buildNormalListQuestionContent = function()
	{
		let field = this.field,
			defVal = field.DefaultValue,
			filedOptions = field.FieldOptions,
			isMultiple = filedOptions.PickListMultiSelect,
			isAddOtherOption = filedOptions.PickListAddOtherOption,
			guid = field.Guid;

		let htmlStr = '<div class="list-question question">';
		if (filedOptions.UDFPickListOptions && filedOptions.UDFPickListOptions.length > 0)
		{
			filedOptions.UDFPickListOptions.forEach((option, idx) =>
			{
				htmlStr += this.generateOption(isMultiple, idx, option, guid);
			});

			if (isAddOtherOption)
			{
				htmlStr += this.generateOtherOption(isMultiple, filedOptions.UDFPickListOptions.length, guid);
			}
		}
		htmlStr += '</div>';
		let options = $(htmlStr);

		if (isMultiple)
		{
			this._value = [];
		}
		else
		{
			this._value = '';
		}

		options.find('.list-question-option input').on('change', ev =>
		{
			let checkedOptions = options.find(".list-question-option input:checked");
			let val = '';
			if (isMultiple)
			{
				val = [];
			}
			else 
			{
				val = '';
			}

			// show other option
			if ($(ev.target).attr("data-other") === '1')
			{
				$(ev.target).closest('.list-question').find('textarea').prop('disabled', !ev.target.checked)
			}
			else if (ev.target.type === "radio")
			{
				$(ev.target).closest('.list-question').next(".list-question-option").find('textarea').prop('disabled', true)
			}

			$.each(checkedOptions, (idx, option) =>
			{
				let v = $(option).val();

				if (isMultiple)
				{
					if (v)
					{
						val.push(v);
					}
				}
				else
				{
					val = v;
				}
			});
			this.value = val;
		});

		options.find("textarea").on('change', ev =>
		{
			$(ev.target).parents("div.list-question-option").find('input[type="radio"],input[type="checkbox"]').val(ev.target.value);
			options.find('.list-question-option input').trigger("change");
		}).keypress(ev => 
		{
			if (ev.keyCode === 13)
			{
				ev.preventDefault();
			}
		}).keyup(ev => 
		{
			if (TF.isMobileDevice || isIpad())
			{
				ev.target.style.height = 'auto';
				ev.target.style.height = ev.target.scrollHeight + 'px';
			}
		}).on('input', ev =>
		{
			$(ev.target).next('small').html(`${ev.target.value.length}/50`);
			$(ev.target).trigger('change');
		}).focus(ev =>
		{
			$(ev.target).next('small').show();
		}).blur(ev =>
		{
			const originalValue = $(ev.target).val();
			const trimmedValue = originalValue.trim();
			if (originalValue && (trimmedValue !== originalValue))
			{
				$(ev.target).val(trimmedValue);
				$(ev.target).trigger('change');
			}
			$(ev.target).next('small').hide();
		});


		if (this.field.value)
		{
			if (!Array.isArray(this.field.value) || this.field.value.length > 0)
			{
				this.value = this.field.value;
			}

			//this.datePicker.value(this.field.value)  PickListAddOtherOption
			if (!!this.field.FieldOptions.PickListMultiSelect) 
			{
				const bindValue = _v =>
				{
					const $item = options.find(`input[type=checkbox][value="${_v}"]`);
					if ($item.length > 0) 
					{
						$item.prop("checked", true);
					}
					else 
					{
						options.find("input[type=checkbox][data-other=1]").prop("checked", true);
						options.find("textarea").removeAttr("disabled").val(_v);
					}
				};
				if (Array.isArray(this.field.value))
				{
					this.field.value.forEach(_v =>
					{
						bindValue(_v);
					});
				}
				else 
				{
					bindValue(this.field.value);
				}
			}
			else
			{
				const normalItem = options.find(`input[type=radio][value="${this.field.value}"]`);
				//cannot found means need fill into other textbox.
				if (normalItem.length == 0)
				{
					options.find("textarea").removeAttr("disabled").val(this.field.value);
					options.find("input[type=radio][data-other]").prop("checked", true);
				}
				else
				{
					normalItem.prop("checked", true);
				}
			}
		}

		if (this.field.readonly) 
		{
			options.find("input").attr("disabled", "disabled");
			options.find("textarea").attr("disabled", "disabled");
		}


		return options;
	}

	const ignoreCarriageReturn = function(e)
	{
		if (e.keyCode === 13) // 13:carriage return key code
		{
			e.stopPropagation();
		}
	};

	const extraScrollbarWidth = 12;

	ListQuestion.prototype.buildDropDownListQuestionContent = function()
	{
		const field = this.field,
			fieldOptions = field.FieldOptions,
			isMultiple = fieldOptions.PickListMultiSelect,
			isAddOtherOption = fieldOptions.PickListAddOtherOption,
			listDataOptions = fieldOptions.UDFPickListOptions,
			self = this,
			guid = field.Guid;

		const controlId = guid,
			controlName = guid;

		self._value = self.convertToSavedValue(self.field.value, isMultiple);

		return isMultiple
			? self.buildMultiSelectListQuestionContent(controlId, controlName, field, listDataOptions, isAddOtherOption)
			: self.buildComboBoxListQuestionContent(controlId, controlName, field, listDataOptions, isAddOtherOption);
	};

	ListQuestion.prototype.convertToSavedValue = function(value, isMultiple)
	{
		// default value
		if (!value || !value.length)
		{
			return isMultiple ? [] : '';
		}

		if (!isMultiple) // single select
		{
			value = `${value}`; // convert to string
		}
		else if (!$.isArray(value)) // multiple select + string value
		{
			value = [`${value}`]; // convert to array
		}

		return value;
	}

	ListQuestion.prototype.buildComboBoxListQuestionContent = function(controlId, controlName, field, listDataOptions, isAddOtherOption)
	{
		const self = this;
		const htmlStr = `<div class="list-from-data-question question"><input id="${controlId}" name="${controlName}"></div>`;
		const $options = $(htmlStr);
		const $selectControl = $options.find(`#${controlId}`);
		const controlInitConfig = {
			enable: !field.readonly,
			dataTextField: "label",
		 	dataValueField: "value",
			filter: "contains",
			syncValueAndText: false,
			placeholder: "Select item...",
			change: function(e)
			{
				const widget = e.sender;
				if (widget.text() && widget.select() === -1)
				{
					// custom has been selected
					if (isAddOtherOption)
					{
						widget.value(widget.text().trim());
					}
					else
					{
						widget.value(""); //reset widget
					}
				}

				const value = widget.value();
				self.value = value;
				widget.input.toggleClass("nil", !value);

				// include the custom item into the datasource
				if (isAddOtherOption)
				{
					const dataSource = self.getComboBoxDataSource(listDataOptions, isAddOtherOption);
					widget.setDataSource(dataSource);
					widget.value(value); // reset the value to break the relations between selected custom item with temp custom item
				}
			},
			open: function(e)
			{
				const widget = e.sender;
				widget.list.width(widget.input.width());
				widget.ul.width("auto");
				setTimeout(() => {
					const scrollWidth = widget.list.find("div.k-list-scroller")[0].scrollWidth;
					widget.ul.find(">li").width(scrollWidth - extraScrollbarWidth);
				});
			}
		};

		$selectControl.kendoComboBox(controlInitConfig);
		const comboBox = $selectControl.data("kendoComboBox");
		self.comboBox = comboBox;

		const dataSource = this.getComboBoxDataSource(listDataOptions, isAddOtherOption);
		comboBox.setDataSource(dataSource);
		comboBox.value(self.value);
		if(!isAddOtherOption && comboBox.value() && comboBox.select() === -1)
		{
			comboBox.value(""); // clear custom
		}

		comboBox.list.addClass("list-form-data");
		comboBox.input.css({display: "inline-block", "text-overflow": "ellipsis"});
		comboBox.input.toggleClass("nil", !comboBox.value());
		comboBox.input.bind("keydown", ignoreCarriageReturn);
		if(isAddOtherOption)
		{
			comboBox.input.bind("input", () => {
				self.updateComboBoxCustomItem(comboBox); // update temp custom item
				comboBox.open();
			});
		}

		return $options;
	};
	
	ListQuestion.prototype.buildMultiSelectListQuestionContent = function(controlId, controlName, field, listDataOptions, isAddOtherOption)
	{
		const self = this;
		const htmlStr = `<div class="list-from-data-question question"><select id="${controlId}" 
					name="${controlName}" multiple="multiple" data-placeholder="Select items..." 
					style="width:100%"></div>`;
		const $options = $(htmlStr);
		const $selectControl = $options.find(`#${controlId}`);
		const narrowLongSelectedItem = function(multiSelect)
		{
			const maxWidth = multiSelect.input.parent().width() - 36;
			multiSelect.input.parent().find("li.k-button>span[unselectable='on']").css({ "max-width": maxWidth });
		};
		const controlInitConfig = {
			enable: !field.readonly,
			dataTextField: "label",
		 	dataValueField: "value",
			filter: "contains",
			autoClose: false,
			change: function(e)
			{
				const widget = e.sender;
				const value = widget.value();
				self.value = value;

				// include the custom item into the datasource
				if (isAddOtherOption)
				{
					const dataSource = self.getMultiSelectDataSource(listDataOptions, isAddOtherOption);
					widget.setDataSource(dataSource);
					widget.value(value); // reset the value to break the relations between selected custom item with temp custom item
					self.updateMultiSelectCustomItem(widget);
				}
			},
			open: function(e)
			{
				const widget = e.sender;
				widget.list.width(widget.input.width());
				widget.ul.width("auto");
				setTimeout(() => {
					const scrollWidth = widget.list.find("div.k-list-scroller")[0].scrollWidth;
					widget.ul.find(">li").width(scrollWidth - extraScrollbarWidth);
				});
				
				if (isAddOtherOption)
				{
					self.removeMultiSelectCustomItem(widget);
				}
			},
			close: function(e)
			{
				const widget = e.sender;
				narrowLongSelectedItem(widget);
			}
		};

		$selectControl.kendoMultiSelect(controlInitConfig);
		const multiSelect = $selectControl.data("kendoMultiSelect");
		self.multiSelect = multiSelect;

		const dataSource = this.getMultiSelectDataSource(listDataOptions, isAddOtherOption);
		multiSelect.setDataSource(dataSource);
		multiSelect.value(self.value);
		
		multiSelect.list.addClass("list-form-data");
		multiSelect.input.parent().append(`<span unselectable="on" class="k-select" aria-label="select" role="button"><span class="k-icon k-i-arrow-60-down"></span></span>`);
		narrowLongSelectedItem(multiSelect);

		multiSelect.input.bind("keydown", ignoreCarriageReturn);
		if(isAddOtherOption)
		{
			multiSelect.input.bind("input", () => {
				self.updateMultiSelectCustomItem(multiSelect); // update temp custom item
			});
		}

		return $options;
	};

	ListQuestion.prototype.removeMultiSelectCustomItem = function(widget)
	{
		const ds = widget.dataSource;
		let customItem = ds.get(-1); // temp custom item
		if(customItem)
		{
			ds.remove(customItem);
		}
	}

	ListQuestion.prototype.updateMultiSelectCustomItem = function(widget)
	{
		const ds = widget.dataSource;
		let customItem = ds.get(-1); // temp custom item
		const text = widget.input.val(),
			val = text.trim(),
			valLowerCase = val.toLowerCase();

		// remove temp custom item if input nothing
		if (!val)
		{
			if(customItem)
			{
				ds.remove(customItem);
			}
			return;
		}
		
		var len = ds.data().length;
		var found = false;
		for(let i = 0; i < len; i++)
		{
			var item = ds.at(i);
			if(item && item.id !== -1 && item.get("value").toLowerCase() === valLowerCase)
			{
				found = true;
				break;
			}
		}

		// remove temp custom item if the input match existing items
		if(found)
		{
			if(customItem)
			{
				ds.remove(customItem);
			}
			return;
		}

		// add temp custom item the input does not match existing items
		if (!customItem)
		{
			ds.add({ label: "", value: "", id: -1 });
			customItem = ds.get(-1);
		}
		
		// upate temp custom item
		customItem.set("label", `(+) ${text}`);
		customItem.set("value", val);
	};

	ListQuestion.prototype.updateComboBoxCustomItem = function(widget)
	{
		const ds = widget.dataSource;
		let customItem = ds.get(-1); // temp custom item
		let customItem2 = ds.get(-2); // custom item
		const text = widget.input.val(),
			val = text.trim(),
			valLowerCase = val.toLowerCase();

		// remove temp custom item if input nothing
		if (!val)
		{
			if(customItem)
			{
				ds.remove(customItem);
			}

			if(customItem2)
			{
				ds.remove(customItem2);
			}
			return;
		}
		
		var len = ds.data().length;
		var found = false;
		for(let i = 0; i < len; i++)
		{
			var item = ds.at(i);
			if(item && item.id != -1 && item.get("value").toLowerCase() === valLowerCase)
			{
				found = true;
				break;
			}
		}

		// remove temp custom item if the input match existing items
		if(found)
		{
			if(customItem)
			{
				ds.remove(customItem);
			}
			return;
		}

		if(customItem2)
		{
			ds.remove(customItem2);
		}

		// add temp custom item the input does not match existing items
		if (!customItem)
		{
			ds.add({ label: "", value: "", id: -1 });
			customItem = ds.get(-1);
			widget.text(text); // add a custom item will update the text with selected value, need restore the input text
		}

		// upate temp custom item
		customItem.set("label", `(+) ${text}`);
		customItem.set("value", val);
	}

	ListQuestion.prototype.getComboBoxDataSource = function(listDataOptions, isAddOtherOption)
	{
		const self = this;
		let dataValues = listDataOptions.map((opt) => opt.PickList);
		
		let dataItems = dataValues.map((val, idx) => {
			return {
				label: val,
				value: val,
				id: idx
			};
		});
		
		if (isAddOtherOption && self.value && dataValues.indexOf(self.value) === -1)
		{
			dataItems.push(
			{
				label: self.value,
				value: self.value,
				id: -2
			});
		}
		
		return new kendo.data.DataSource({
			data: dataItems
		});
	};

	ListQuestion.prototype.getMultiSelectDataSource = function(listDataOptions, isAddOtherOption)
	{
		const self = this;
		let dataValues = listDataOptions.map((opt) => opt.PickList);

		// add other items
		if(isAddOtherOption && self.value)
		{
			const otherItems = self.value.filter((v) => dataValues.indexOf(v) === -1);
			dataValues.push(...otherItems);
		}

		let dataItems = dataValues.map((val, idx) => {
			return {
				label: val,
				value: val,
				id: idx
			};
		});

		return new kendo.data.DataSource({
			data: dataItems
		});
	};

	ListQuestion.prototype.getValidateResult = function ()
	{
		let result = '';
		if (this.field.Required && (!this.value || (Array.isArray(this.value) && this.value.length === 0)))
		{
			result = 'Answer is required.';
		}
		return result;
	}

	ListQuestion.prototype.dispose = function()
	{
		if (TF.isMobileDevice)
		{
			$(window).off("orientationchange.lfdq");
		}

		if (this.multiSelect)
		{
			this.multiSelect.popup.wrapper.remove();
		}
		else if (this.comboBox)
		{
			this.comboBox.popup.wrapper.remove();
		}
	}

	ListQuestion.prototype.generateOption = function (isMultiple, idx, option, guid)
	{
		let type = isMultiple ? 'checkbox' : 'radio';

		return `
			<div class="list-question-option">
				<label for="${guid}_${idx}">
					<input type="${type}" id="${guid}_${idx}" name="${guid}" value="${option.PickList}"}/>
					${option.PickList}
				</label>
			</div>`;
	}

	ListQuestion.prototype.generateOtherOption = function (isMultiple, idx, guid)
	{
		let type = isMultiple ? 'checkbox' : 'radio';

		return `
			<div class="list-question-option">
				<label for="${guid}_${idx}">
					<input type="${type}" id="${guid}_${idx}" name="${guid}" value="" data-other="1"/>
					Other
				</label>
				<div style="position:relative;padding-left: 16px;"><textarea class="text-question question" maxlength="50" rows="1" for="${guid}_${idx}" class="disabled" disabled></textarea><small style="position: absolute;top: -17px;right: 0px;display:none">0/50</small></div>
			</div>`;
	}

})();
