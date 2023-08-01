(function()
{
	createNamespace("TF.Control.Form").ListFromDataQuestion = ListFromDataQuestion;

	function ListFromDataQuestion()
	{
		TF.Control.Form.BaseQuestion.apply(this, arguments);
	}

	ListFromDataQuestion.prototype = Object.create(TF.Control.Form.BaseQuestion.prototype);
	ListFromDataQuestion.prototype.constructor = ListFromDataQuestion;

	const iconFieldConfiguration = {
		onMultiSelectOpenPlaceholder: function()
		{
			this.input.attr("placeholder", "");
		},
		onMultiSelectChangePlaceholder: function()
		{
			if (this.value().length === 0)
			{
				this.input.attr("placeholder", "Select items...");
			}
			else
			{
				this.input.attr("placeholder", "");
			}
		},
		bindComboBoxChange: function(comboBox, ListFromDataQuestion, listDataOptions)
		{
			comboBox.bind("change", function()
			{
				const controlValue = this.value();
				let entryItemClass = "";
				if (ListFromDataQuestion.handlePictureTemplate[listDataOptions.dataType]
					&& ListFromDataQuestion.handlePictureTemplate[listDataOptions.dataType][listDataOptions.field.name]
					&& ListFromDataQuestion.handlePictureTemplate[listDataOptions.dataType][listDataOptions.field.name].getItemClass)
				{
					entryItemClass = ListFromDataQuestion.handlePictureTemplate[listDataOptions.dataType][listDataOptions.field.name].getItemClass(controlValue);
				}

				comboBox.iconSelectItem.removeClass();
				comboBox.iconSelectItem.addClass('icon-select-item ' + entryItemClass);
				if (controlValue.length > 0)
				{
					comboBox.input.hide();
				}
				else
				{
					comboBox.input.show();
				}
			});
		},
		updateIconStyles: function(comboBox, self, loadedValues, ControlValue)
		{
			const $iconSelectItemWrap = $(`<div style="height:100%"><span class="icon-select-item" style="display:inline-block;width:26px;height:100%;"></span><div>`);
			comboBox.input.parent().prepend($iconSelectItemWrap);
			comboBox.input.prependTo($iconSelectItemWrap);
			if (loadedValues.length > 0)
			{
				comboBox.input.hide();
			}
			else
			{
				comboBox.input.show();
			}
			comboBox.iconSelectItem = $iconSelectItemWrap.find(".icon-select-item");
			if (ControlValue)
			{
				const entryItemClass = this.getItemClass(ControlValue);
				comboBox.iconSelectItem.addClass(entryItemClass);
			}
		},
		updateOpenStylesOfIcon: function(comboBox)
		{
			comboBox.ul.find("li>div.grid-icon").css({ "padding-top": "8px" });
		},
		updateInputStyles: function(comboBox)
		{
			comboBox.input.css({ "height": "80%", position: "relative", bottom: "6px" });
		},
		setMultiSelectPlaceholder: function(loadedValues, multiSelect)
		{
			if (loadedValues.length === 0)
			{
				multiSelect.input.attr("placeholder", "Select items...");
			}
			else
			{
				multiSelect.input.attr("placeholder", "");
			}
		}
	}

	ListFromDataQuestion.handlePictureTemplate = {
		trip: {
			PolicyDeviation: {
				init: function(controlInitConfig, self)
				{
					controlInitConfig.template = `<div class="#: ItemClass #"></div>`;
				},
				getItemClass: function(itemSelectedValue)
				{
					const itemValue = itemSelectedValue.substring(itemSelectedValue.indexOf(",") + 1);
					return tf.tripGridDefinition.gridDefinition().getIconUrl_PolicyDeviation(parseInt(itemValue));
				},
				initMulti: function(controlInitConfig, self)
				{
					controlInitConfig.tagTemplate = controlInitConfig.template = `<div class="#: ItemClass #"></div>`;
				},
				updateIconStyles: iconFieldConfiguration.updateIconStyles,
				setItemsClass: function(dataItems)
				{
					for (const entry of dataItems)
					{
						entry.ItemClass = tf.tripGridDefinition.gridDefinition().getIconUrl_PolicyDeviation(parseInt(entry.ItemName));
					}
				},
				updateOpenStylesOfIcon: iconFieldConfiguration.updateOpenStylesOfIcon,
				updateInputStyles: iconFieldConfiguration.updateInputStyles,
				setMultiSelectPlaceholder: iconFieldConfiguration.setMultiSelectPlaceholder,
				bindComboBoxChange: iconFieldConfiguration.bindComboBoxChange,
				onMultiSelectOpenPlaceholder: iconFieldConfiguration.onMultiSelectOpenPlaceholder,
				onMultiSelectChangePlaceholder: iconFieldConfiguration.onMultiSelectChangePlaceholder
			},
			RidershipStatus: {
				init: function(controlInitConfig, self)
				{
					controlInitConfig.template = `<div class="#: ItemClass #"></div>`;
				},
				getItemClass: function(itemSelectedValue)
				{
					const itemValue = itemSelectedValue.substring(itemSelectedValue.indexOf(",") + 1);
					return tf.tripGridDefinition.gridDefinition().getIconUrl_RidershipStatus(parseInt(itemValue));
				},
				initMulti: function(controlInitConfig, self)
				{
					controlInitConfig.tagTemplate = controlInitConfig.template = `<div class="#: ItemClass #"></div>`;
				},
				updateIconStyles: iconFieldConfiguration.updateIconStyles,
				setItemsClass: function(dataItems)
				{
					for (const entry of dataItems)
					{
						entry.ItemClass = tf.tripGridDefinition.gridDefinition().getIconUrl_RidershipStatus(parseInt(entry.ItemName));
					}
				},
				updateOpenStylesOfIcon: iconFieldConfiguration.updateOpenStylesOfIcon,
				updateInputStyles: iconFieldConfiguration.updateInputStyles,
				setMultiSelectPlaceholder: iconFieldConfiguration.setMultiSelectPlaceholder,
				bindComboBoxChange: iconFieldConfiguration.bindComboBoxChange,
				onMultiSelectOpenPlaceholder: iconFieldConfiguration.onMultiSelectOpenPlaceholder,
				onMultiSelectChangePlaceholder: iconFieldConfiguration.onMultiSelectChangePlaceholder
			},
		}
	};

	Object.defineProperty(ListFromDataQuestion.prototype, 'dirty', {
		get()
		{
			// multi-select
			if (Array.isArray(this.value))
			{
				return this.value.sort().join(',') !== (this.initialValue || []).sort().join(',')
			}
			// single select
			return (this.initialValue || '') !== (this.value || '');
		}
	});

	ListFromDataQuestion.prototype.hasValue = function()
	{
		return !(this.value == null || this.value === '' || (Array.isArray(this.value) && this.value.length === 0));
	}

	ListFromDataQuestion.prototype.getDataItems = function(listDataOptions)
	{
		const isPublicForm = this.field.isPublicForm;
		const listDataType = listDataOptions.dataType;

		const formatValue = (col, value) =>
		{
			if (!col)
			{
				col = {};
			}
			if (col.UnitOfMeasureSupported)
			{
				value = tf.measurementUnitConverter.handleColumnUnitOfMeasure(value, col);
			}
			if (col.listItemConverter)
			{
				return col.listItemConverter(value);
			}
			let type = col.UDFType || col.type;
			if (col.UDFType === 'roll-up')
			{
				type = col.type;
			}
			switch (type)
			{
				case "string":
					value = value.replace(/[\r\n]/g, '');
					return value;
				case "datetime":
				case "date/time":
					{
						if (value === "")
						{
							return "";
						}
						const dt = moment(value);
						return dt.isValid() ? dt.format("MM/DD/YYYY hh:mm A") : "";
					}
				case "date":
					{
						if (value === "")
						{
							return "";
						}
						const date = moment(value);
						return date.isValid() ? moment(value).format("MM/DD/YYYY") : "";
					}
				case "time":
					{
						if (value === "")
						{
							return "";
						}
						let time = moment(value);
						if (time.isValid())
						{
							return time.format("hh:mm A");
						}
						time = moment("1900-1-1 " + value);
						return time.isValid() ? time.format("hh:mm A") : "";
					}
				case "list":
					{
						if (value instanceof Array)
						{
							return value.join(", ");
						}
						return isNullObj(value) ? "" : value;
					}
				case "boolean":
					{
						if (col.gridColumn && col.FieldName === "Geo")
						{
							if (value === "4")
							{
								return "True";
							}
							else
							{
								return "False";
							}
						}
						else
						{
							if (isNullObj(value))
							{
								return '';
							}
							return (value ? (col.TrueDisplayName || "True") : (col.FalseDisplayName || "False"));
						}
					}
				case "number":
					{
						if (value == null || value === "")
						{
							return "";
						}

						if (col.format)
						{
							return kendo.format(col.format, value);
						}

						const precision = col.NumberPrecision || col.Precision;
						if (isNaN(Number(value)))
						{
							value = 0;
						}

						let fixedDigits = 0;
						if (_.isNumber(precision))
						{
							fixedDigits = precision;
						}
						else if (col.gridColumn)
						{
							fixedDigits = 2;
						}

						return Number(value).toFixed(fixedDigits);
					}
				case "phone number":
				case "phone":
					{
						if (isNullObj(value))
						{
							return '';
						}
						value = tf.dataFormatHelper.phoneFormatter(value);
						return value;
					}
				default:
					return value + "";
			}
		};

		const getItems = function(whereClause)
		{
			if (!isPublicForm && !tf.authManager.isAuthorizedForDataType(listDataType, 'read'))
			{
				return Promise.resolve([]);
			}

			const requestUrl = pathCombine(tf.api.apiPrefix(), "search", tf.dataTypeHelper.getEndpoint(listDataType));
			const requestOption = {
				data: { fields: ["Id", listDataOptions.field.name], filterClause: whereClause, sortItems: [{ Name: listDataOptions.field.name, isAscending: 'asc', Direction: 'Ascending' }] }
			};
			return tf.promiseAjax.post(requestUrl, requestOption)
				.then(function(response)
				{
					let col = null;
					if (listDataOptions.field.guid)
					{
						col = tf.UDFDefinition.getUDFByGuid(listDataOptions.field.guid);
					}

					if (col === null)
					{
						const gridColumns = TF.Grid.FilterHelper.getGridDefinitionByType(listDataType);
						col = gridColumns.Columns.find(x => x.FieldName === listDataOptions.field.name);
						if (col)
						{
							col.gridColumn = true;
							const schoolListProcess = function(value)
							{
								return value.replace(/!$/, "").replaceAll("!", ",");
							};
							const specialConvertFunctions =
							{
								trip: {
									Schools: schoolListProcess
								},
								student: {
									School: schoolListProcess
								},
								fieldTrip: {
									School: schoolListProcess
								},
								school: {
									School: schoolListProcess
								}
							};
							const listItemConverter = specialConvertFunctions[listDataType] && specialConvertFunctions[listDataType][listDataOptions.field.name];
							if (listItemConverter)
							{
								col.listItemConverter = listItemConverter;
							}
							if (["Geo"].some(n => n === listDataOptions.field.name))
							{
								col.ValueType = "geo";
							}
						}
					}
					return response.Items
						.filter(x => (x[listDataOptions.field.name] !== null))
						.map(x => ({ ItemName: formatValue(col, x[listDataOptions.field.name]), Id: x.Id }))
						.filter(x => x.ItemName)
						.map(x => ({ Id: x.Id, ItemName: x.ItemName.trim() }))
						.filter(x => x.ItemName);
				}.bind(this));
		}

		if (listDataOptions.filter.id)
		{
			return TF.Grid.FilterHelper.getFilterById(listDataOptions.filter.id)
				.then(function(filterItem)
				{
					if (filterItem)
					{
						return filterItem.WhereClause;
					}
					else
					{
						return null;
					}
				})
				.then(function(whereClause)
				{
					return getItems(whereClause);
				});
		}
		else
		{
			return getItems(null);
		}
	}

	ListFromDataQuestion.prototype.initQuestionContent = function()
	{
		const field = this.field,
			defVal = field.DefaultValue,
			filedOptions = field.FieldOptions,
			isMultiple = filedOptions.PickListMultiSelect,
			isAddOtherOption = filedOptions.PickListAddOtherOption,
			listDataOptions = filedOptions.UDFPickListOptions,
			isUniqueValue = listDataOptions.isUniqueValues,
			self = this,
			guid = field.Guid,
			extraScrollbarWidth = 12;
		let storedDataItems = field.value;

		if (!storedDataItems)
		{
			storedDataItems = [];
		}

		if (!$.isArray(storedDataItems))
		{
			storedDataItems = [storedDataItems];
		}

		const ignoreCarriageReturn = function(e)
		{
			if (e.keyCode === 13)//13:carriage return key code
			{
				e.stopPropagation();
			}
		};

		const getUniqueItems = function(dataItems, keyField)
		{
			const dataFrom = dataItems;
			const keys = [];
			const dataTo = [];
			dataFrom.forEach(x =>
			{
				if (!keys.includes(x[keyField]))
				{
					keys.push(x[keyField]);
					dataTo.push(x);
				}
			});

			return dataTo;
		}

		if (isUniqueValue)
		{
			storedDataItems = getUniqueItems(storedDataItems, "key");
		}

		const controlId = guid;
		const controlName = guid;
		let loadedValues = storedDataItems || defVal;
		self.loadedIdValues = loadedValues;
		loadedValues = loadedValues.map(x => `${x.key},${x.value}`);

		const convertToSaveValue = function(controlValue)
		{
			if ($.isArray(controlValue))
			{
				return controlValue.map(x => ({ key: parseInt(x.substring(0, x.indexOf(","))), value: x.substring(x.indexOf(",") + 1) }));
			}
			else
			{
				return [{ key: parseInt(controlValue.substring(0, controlValue.indexOf(","))), value: controlValue.substring(controlValue.indexOf(",") + 1) }];
			}
		};

		self._value = convertToSaveValue(loadedValues);


		if (!isMultiple)
		{
			const htmlStr = `<div class="list-from-data-question question"><input id="${controlId}" name="${controlName}"></div>`;
			const options = $(htmlStr);
			const $selectControl = options.find(`#${controlId}`);
			const controlInitConfig = {
				dataTextField: "ItemName",
				dataValueField: "ItemValue",
				filter: "contains",
				enable: !field.readonly,
				placeholder: "Select item...",
				change: function(e)
				{
					const widget = e.sender;

					if (widget.value() && widget.select() === -1)
					{
						//custom has been selected
						widget.value(""); //reset widget
					}

					if (!this.value())
					{
						self.value = [];
					}
					else
					{
						self.value = convertToSaveValue(this.value());
					}
					if (widget.value())
					{
						widget.input.removeClass("nil");
					}
					else
					{
						widget.input.addClass("nil");
					}
				}
			};

			if (ListFromDataQuestion.handlePictureTemplate[listDataOptions.dataType]
				&& ListFromDataQuestion.handlePictureTemplate[listDataOptions.dataType][listDataOptions.field.name]
				&& ListFromDataQuestion.handlePictureTemplate[listDataOptions.dataType][listDataOptions.field.name].init)
			{
				ListFromDataQuestion.handlePictureTemplate[listDataOptions.dataType][listDataOptions.field.name].init(controlInitConfig, self);
			}

			$selectControl.kendoComboBox(controlInitConfig);

			const comboBox = $selectControl.data("kendoComboBox");

			comboBox.bind("open", function(e)
			{
				comboBox.list.width(comboBox.input.width());
				comboBox.ul.width("auto");
				setTimeout(() =>
				{
					const scrollWidth = comboBox.list.find("div.k-list-scroller")[0].scrollWidth;
					comboBox.ul.find(">li").width(scrollWidth - extraScrollbarWidth);

					if (ListFromDataQuestion.handlePictureTemplate[listDataOptions.dataType]
						&& ListFromDataQuestion.handlePictureTemplate[listDataOptions.dataType][listDataOptions.field.name]
						&& ListFromDataQuestion.handlePictureTemplate[listDataOptions.dataType][listDataOptions.field.name].updateOpenStylesOfIcon)
					{
						ListFromDataQuestion.handlePictureTemplate[listDataOptions.dataType][listDataOptions.field.name].updateOpenStylesOfIcon(comboBox);
					}
				});
				comboBox.setDataSource(self.updatedDataSource);
			});

			comboBox.input.bind("keydown", ignoreCarriageReturn);

			if (ListFromDataQuestion.handlePictureTemplate[listDataOptions.dataType]
				&& ListFromDataQuestion.handlePictureTemplate[listDataOptions.dataType][listDataOptions.field.name]
				&& ListFromDataQuestion.handlePictureTemplate[listDataOptions.dataType][listDataOptions.field.name].bindComboBoxChange)
			{
				ListFromDataQuestion.handlePictureTemplate[listDataOptions.dataType][listDataOptions.field.name].bindComboBoxChange(comboBox, ListFromDataQuestion, listDataOptions);
			}

			this.getDataSource.bind(self)(listDataOptions, isUniqueValue, isAddOtherOption, getUniqueItems).then(function(dataSource)
			{
				self.comboBox = comboBox;
				comboBox.setDataSource(dataSource);
				const controlValue = ((loadedValues.length > 0) ? loadedValues[0] : "");
				comboBox.value(controlValue);
				comboBox.input.css({ display: "inline-block", "text-overflow": "ellipsis" });

				if (ListFromDataQuestion.handlePictureTemplate[listDataOptions.dataType]
					&& ListFromDataQuestion.handlePictureTemplate[listDataOptions.dataType][listDataOptions.field.name]
					&& ListFromDataQuestion.handlePictureTemplate[listDataOptions.dataType][listDataOptions.field.name].updateInputStyles)
				{
					ListFromDataQuestion.handlePictureTemplate[listDataOptions.dataType][listDataOptions.field.name].updateInputStyles(comboBox);
				}

				if (ListFromDataQuestion.handlePictureTemplate[listDataOptions.dataType]
					&& ListFromDataQuestion.handlePictureTemplate[listDataOptions.dataType][listDataOptions.field.name]
					&& ListFromDataQuestion.handlePictureTemplate[listDataOptions.dataType][listDataOptions.field.name].updateIconStyles)
				{
					ListFromDataQuestion.handlePictureTemplate[listDataOptions.dataType][listDataOptions.field.name].updateIconStyles(comboBox, self, loadedValues, controlValue, listDataOptions);
				}

				if (comboBox.value())
				{
					comboBox.input.removeClass("nil");
				}
				else
				{
					comboBox.input.addClass("nil");
				}
			});

			return options;
		}
		else
		{
			const htmlStr =
				`<div class="list-from-data-question question"><select id="${controlId}" 
					name="${controlName}" multiple="multiple" data-placeholder="Select items..." 
					style="width:100%"></div>`;
			const options = $(htmlStr);
			const $selectControl = options.find(`#${controlId}`);
			const narrowLongSelectedItem = function(multiSelect)
			{
				const maxWidth = multiSelect.input.parent().width() - 36;
				multiSelect.input.parent().find("li.k-button>span[unselectable='on']").css({ "max-width": maxWidth });
			}
			const controlInitConfig = {
				dataTextField: "ItemName",
				dataValueField: "ItemValue",
				filter: "contains",
				enable: !field.readonly,
				autoClose: false,
				change: function()
				{
					self.value = convertToSaveValue(this.value());

					if (ListFromDataQuestion.handlePictureTemplate[listDataOptions.dataType]
						&& ListFromDataQuestion.handlePictureTemplate[listDataOptions.dataType][listDataOptions.field.name]
						&& ListFromDataQuestion.handlePictureTemplate[listDataOptions.dataType][listDataOptions.field.name].onMultiSelectChangePlaceholder)
					{
						ListFromDataQuestion.handlePictureTemplate[listDataOptions.dataType][listDataOptions.field.name].onMultiSelectChangePlaceholder.bind(this)();
					}
				},
				open: function()
				{
					if (ListFromDataQuestion.handlePictureTemplate[listDataOptions.dataType]
						&& ListFromDataQuestion.handlePictureTemplate[listDataOptions.dataType][listDataOptions.field.name]
						&& ListFromDataQuestion.handlePictureTemplate[listDataOptions.dataType][listDataOptions.field.name].onMultiSelectOpenPlaceholder)
					{
						ListFromDataQuestion.handlePictureTemplate[listDataOptions.dataType][listDataOptions.field.name].onMultiSelectOpenPlaceholder.bind(this)();
					}

					this.list.width(this.input.width());
					this.ul.width("auto");
					setTimeout(() =>
					{
						const scrollWidth = this.list.find("div.k-list-scroller")[0].scrollWidth;
						this.ul.find(">li").width(scrollWidth - extraScrollbarWidth);

						if (ListFromDataQuestion.handlePictureTemplate[listDataOptions.dataType]
							&& ListFromDataQuestion.handlePictureTemplate[listDataOptions.dataType][listDataOptions.field.name]
							&& ListFromDataQuestion.handlePictureTemplate[listDataOptions.dataType][listDataOptions.field.name].updateOpenStylesOfIcon)
						{
							ListFromDataQuestion.handlePictureTemplate[listDataOptions.dataType][listDataOptions.field.name].updateOpenStylesOfIcon(this);
						}
					});
					this.setDataSource(self.updatedDataSource);
				},
				close: function()
				{
					narrowLongSelectedItem(this);
				}
			};

			if (ListFromDataQuestion.handlePictureTemplate[listDataOptions.dataType]
				&& ListFromDataQuestion.handlePictureTemplate[listDataOptions.dataType][listDataOptions.field.name]
				&& ListFromDataQuestion.handlePictureTemplate[listDataOptions.dataType][listDataOptions.field.name].initMulti)
			{
				ListFromDataQuestion.handlePictureTemplate[listDataOptions.dataType][listDataOptions.field.name].initMulti(controlInitConfig, self);
			}

			$selectControl.kendoMultiSelect(controlInitConfig);

			this.getDataSource.bind(self)(listDataOptions, isUniqueValue, isAddOtherOption, getUniqueItems).then(function(dataSource)
			{
				const multiSelect = $selectControl.data("kendoMultiSelect");
				multiSelect.input.bind("keydown", ignoreCarriageReturn);
				self.multiSelect = multiSelect;
				multiSelect.setDataSource(dataSource);
				const controlValue = loadedValues;
				if (ListFromDataQuestion.handlePictureTemplate[listDataOptions.dataType]
					&& ListFromDataQuestion.handlePictureTemplate[listDataOptions.dataType][listDataOptions.field.name]
					&& ListFromDataQuestion.handlePictureTemplate[listDataOptions.dataType][listDataOptions.field.name].setMultiSelectPlaceholder)
				{
					ListFromDataQuestion.handlePictureTemplate[listDataOptions.dataType][listDataOptions.field.name].setMultiSelectPlaceholder(loadedValues, multiSelect);
				}
				multiSelect.value(controlValue);
				multiSelect.input.parent().append(`<span unselectable="on" class="k-select" aria-label="select" role="button"><span class="k-icon k-i-arrow-60-down"></span></span>`);
				narrowLongSelectedItem(multiSelect);
			});

			return options;
		}
	}

	ListFromDataQuestion.prototype.getDataSource = function(listDataOptions, isUniqueValue, isAddOtherOption, getUniqueItems)
	{
		const self = this;
		return this.getDataItems.bind(this)(listDataOptions).then(function(items)
		{
			let dataItems = items;

			if (isUniqueValue)
			{
				dataItems = getUniqueItems(dataItems, "ItemName");
			}

			if (isAddOtherOption)
			{
				dataItems.push({ ItemName: "Other" });
			}

			dataItems = dataItems.map(x => ({ ItemName: x.ItemName, ItemValue: `${x.Id},${x.ItemName}` }));

			if (ListFromDataQuestion.handlePictureTemplate[listDataOptions.dataType]
				&& ListFromDataQuestion.handlePictureTemplate[listDataOptions.dataType][listDataOptions.field.name]
				&& ListFromDataQuestion.handlePictureTemplate[listDataOptions.dataType][listDataOptions.field.name].setItemsClass)
			{
				ListFromDataQuestion.handlePictureTemplate[listDataOptions.dataType][listDataOptions.field.name].setItemsClass(dataItems);
			}

			self.updatedDataSource = new kendo.data.DataSource({
				data: dataItems
			});

			const dataItemsCopy = JSON.parse(JSON.stringify(dataItems));
			for (const idValue of self.loadedIdValues)
			{
				for (const item of dataItemsCopy)
				{
					if (item.ItemValue)
					{
						if (item.ItemValue.startsWith(idValue.key + ","))
						{
							item.ItemValue = `${idValue.key},${idValue.value}`;
							item.ItemName = idValue.value;
							break;
						}
					}
				}
			}

			return new kendo.data.DataSource({
				data: dataItemsCopy
			});
		});
	}

	ListFromDataQuestion.prototype.getValidateResult = function()
	{
		let result = '';
		if (this.field.Required && (!this.value || (Array.isArray(this.value) && this.value.length === 0)))
		{
			result = 'Answer is required.';
		}
		return result;
	}

	ListFromDataQuestion.prototype.dispose = function()
	{
		if (this.multiSelect)
		{
			this.multiSelect.popup.wrapper.remove();
		}
		else if (this.comboBox)
		{
			this.comboBox.popup.wrapper.remove();
		}
	}
})();
