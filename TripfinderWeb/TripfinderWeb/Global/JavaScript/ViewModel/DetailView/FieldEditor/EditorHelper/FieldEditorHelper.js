(function()
{
	const ITEM_CONTENT_SELECTOR = ".item-content";
	const PARENT_GRID_ATTRIBUTE = "parent-grid";
	const EDITOR_ICON_CLASS_NAME = "editor-icon";
	createNamespace("TF.DetailView.FieldEditor").FieldEditorHelper = FieldEditorHelper;

	var RESPONSE_TEMPLATE = {
		success: false,
		entity: null,
		messages: []
	};
	var FIELD_WITH_WIDGET = ["ListMover", "DropDown", "GroupDropDown", "BooleanDropDown", "ComboBox"];
	var CUSTOM_TAB_INDEX_ATTR = "customized-tabindex";
	var FIELD_ELEMENT_CLASS = {
		REGULAR: {
			CONTAINER: "grid-stack-item",
			CONTENT: "item-content"
		},
		GROUP: {
			CONTAINER: "editable-field-container",
			CONTENT: "editable-field-value"
		}
	};

	function FieldEditorHelper(detailView)
	{
		var self = this;
		self._detailView = detailView;
		self._editor = null;
		self.dataType = detailView.gridType;
		self.editFieldList = {};
		self.eventNameSpace = ".fieldEditor" + Math.random().toString(36).substring(7);
		self.disabled = detailView.obIsReadOnly();
		self.entityModified = false;
		self._init();

		self.UDF_KEY = "UserDefinedFields";
		self.VALIDATE_ERROR_CLASS = "validateError";
	}


	FieldEditorHelper.prototype.constructor = FieldEditorHelper;

	FieldEditorHelper.prototype._init = function()
	{
		this._bindEvents();
	};

	FieldEditorHelper.prototype.deactivate = function()
	{
		this.disabled = true;
	};

	FieldEditorHelper.prototype.activate = function()
	{
		this.disabled = false;
	};

	FieldEditorHelper.prototype._bindEvents = function()
	{
		var self = this;
		self._bindMouseDownEvent();
		self._bindClickEvent();
		self._bindKeyDownEvent();

		if (self._detailView.$scrollBody)
		{
			self._detailView.$scrollBody.on("wheel" + self.eventNameSpace, function()
			{
				var editor = self.getEditingFieldElement().find(".grid-stack-item-content.editable").data("editor");
				if (editor)
				{
					editor.closeWidget();
				}
			});
		}

		if (self._detailView.onResizePage)
		{
			self._detailView.onResizePage.subscribe(function()
			{
				if (self._editor && self._editor.editorType() === "DropDown" && !self._editor.obStopped())
				{
					self._editor.editStop();
				}
			});
		}
	};

	FieldEditorHelper.prototype.getDefaultValue = function(data, recordEntity)
	{
		var self = this;
		return data && data.UDFId ?
			self._getUDFDefaultValue(data, recordEntity) :
			self._getNonUDFDefaultValue(data, recordEntity);
	};

	FieldEditorHelper.prototype.getNewRecordDefaultValue = function($parent, data)
	{
		var self = this,
			userDefinedFields = self._detailView._userDefinedFields,
			editingUserDefinedFields = self.editFieldList[self.UDF_KEY],
			value = null;
		if (data.UDFId)
		{
			var udf = userDefinedFields.filter(function(item)
			{
				return item.field === data.field;
			})[0],
				id = udf.UDFId;
			if (editingUserDefinedFields && editingUserDefinedFields.length > 0)
			{
				var edited = editingUserDefinedFields.filter(function(field)
				{
					return field.Id === id;
				});
				value = (edited.length === 1) ? edited[0].RecordValue : self._getUDFValue(udf);
			}
			else
			{
				value = self._getUDFValue(udf);
			}
		}
		else
		{
			var text = $parent.find(ITEM_CONTENT_SELECTOR).text().trim();
			value = (text === 'None') ? null : text;
		}

		return value;
	};

	/**
	 * @param  {Object} field User defined field
	 * @returns {string} value
	 */
	FieldEditorHelper.prototype._getUDFValue = function(field)
	{
		return (field.UDFType === "List") ? field.value.map(function(item)
		{
			return item.value;
		}) : field.value;
	};

	FieldEditorHelper.prototype._getNonUDFDefaultValue = function(data, recordEntity)
	{
		let self = this,
			editFieldList = self.editFieldList,
			fieldName = data.UDGridField ? data.UDGridField.Guid : (data.editType && data.editType.entityKey || data.field),
			defaultValue = recordEntity[fieldName],
			isModified = Object.keys(editFieldList).some(function(item)
			{
				return item === fieldName;
			});

		if (isModified)
		{
			return editFieldList[fieldName].value;
		}

		const matchedItem = tf.helpers.detailViewHelper.getUnitOfMeasureSupportedFields(self.dataType).find(x => x.field === data.field);

		return !matchedItem ? defaultValue : tf.measurementUnitConverter.convert({
			value: defaultValue,
			originalUnit: matchedItem.UnitInDatabase || tf.measurementUnitConverter.MeasurementUnitEnum.Metric,
			targetUnit: tf.measurementUnitConverter.getCurrentUnitOfMeasure(),
			isReverse: !!matchedItem.UnitOfMeasureReverse,
			unitType: matchedItem.UnitTypeOfMeasureSupported
		});
	};

	FieldEditorHelper.prototype._getUDFDefaultValue = function(data, recordEntity)
	{
		var self = this,
			editFieldList = self.editFieldList,
			fieldName = data.field,
			defaultValue = null,
			match = !Array.isArray(editFieldList.UserDefinedFields) ? null
				: editFieldList.UserDefinedFields
					.filter(function(item) { return item.Name === fieldName; })[0];

		if (!match)
		{
			match = !Array.isArray(recordEntity.UserDefinedFields) ? null
				: recordEntity.UserDefinedFields
					.filter(function(item) { return item.DisplayName === fieldName; })[0];
		}

		if (match)
		{
			if (match.Type === "List")
			{
				defaultValue =
					(Array.isArray(match.SelectPickListOptionIDs) && match.SelectPickListOptionIDs.length > 0) ?
						match.SelectPickListOptionIDs : [];
			}
			else if (match.Type === 'Number')
			{
				var value = parseFloat(match.RecordValue),
					strValue = value.toString(),
					precision = match.NumberPrecision,
					pointIndex = strValue.indexOf(".");

				if (isNaN(value))
				{
					return null;
				}

				if (precision &&
					precision > 0 &&
					pointIndex >= 0)
				{
					var decimalPlaces = strValue.length - pointIndex - 1;
					if (decimalPlaces <= precision)
					{
						defaultValue = strValue;
					}
					else
					{
						defaultValue = value.toFixed(precision);
					}
				}
				else
				{
					defaultValue = value;
				}
			}
			else if (match.Type === 'Memo')
			{
				defaultValue = match.RecordValue || match.DefaultNote;
			}
			else
			{
				defaultValue = match.RecordValue;
			}
		}

		return defaultValue;
	};

	FieldEditorHelper.prototype.markTabIndex = function()
	{
		var self = this,
			$container = self._getFieldEditorContainer();
		$container.find(".grid-stack").each(function(id, grid)
		{
			var tabIndex = 0;
			$(grid).attr('grid-key', id);
			$.map($(grid).find(">.grid-stack-item"), item =>
			{
				var $item = $(item);
				return {
					y: $item.attr("data-gs-y"),
					x: $item.attr("data-gs-x"),
					isEditable: $item.find(">.editable").length === 1,
					$dom: $item
				}
			}).filter(item =>
			{
				return item.isEditable;
			}).sort((a, b) =>
			{
				return a.y - b.y != 0 ? a.y - b.y : (a.x - b.x);
			}).forEach(item =>
			{
				var isInMultiEditableGroup = item.$dom.find(".grid-stack-item-content.multi-editable").length > 0;
				if (isInMultiEditableGroup)
				{
					var $editFields = item.$dom.find(`.editable.${FIELD_ELEMENT_CLASS.GROUP.CONTAINER}`);
					$.each($editFields, (_, field) =>
					{
						$(field).attr(CUSTOM_TAB_INDEX_ATTR, tabIndex);
						$(field).attr(PARENT_GRID_ATTRIBUTE, id);
						tabIndex++;
					});
				}
				else
				{
					item.$dom.attr(CUSTOM_TAB_INDEX_ATTR, tabIndex);
					item.$dom.attr(PARENT_GRID_ATTRIBUTE, id);
					tabIndex++;
				}
			});
		})

	};

	FieldEditorHelper.prototype.getNextEditableBlock = function(currentIndex, parentKey, isForward)
	{
		var self = this,
			nextIndex,
			parentId = parentKey ? Number(parentKey) : 0,
			tabItemSelector = `[${CUSTOM_TAB_INDEX_ATTR}][parent-grid=${parentId}]`,
			$container = self._getFieldEditorContainer(),
			editableBlockCount = $container.find(tabItemSelector).length;

		currentIndex = Number(currentIndex);

		if (editableBlockCount === 0)
		{
			return;
		}

		if (editableBlockCount === 1 && currentIndex === 0)
		{
			return;
		}

		if (self.isNaN(currentIndex))
		{
			nextIndex = isForward ? 0 : editableBlockCount - 1;
		}
		else if (isForward)
		{
			nextIndex = currentIndex === editableBlockCount - 1 ? 0 : currentIndex + 1;
		}
		else
		{
			nextIndex = currentIndex === 0 ? editableBlockCount - 1 : currentIndex - 1;
		}

		//if there is  not a next, back to the top.
		return $container.find(`[${CUSTOM_TAB_INDEX_ATTR}=${nextIndex}][parent-grid=${parentId}]`).length > 0 ?
			$container.find(`[${CUSTOM_TAB_INDEX_ATTR}=${nextIndex}][parent-grid=${parentId}]`) :
			$container.find(`[${CUSTOM_TAB_INDEX_ATTR}=0][parent-grid=${parentId}]`)
	};

	/**
	 * Get the field element that is currently being edited
	 *
	 * @returns
	 */
	FieldEditorHelper.prototype.getEditingFieldElement = function()
	{
		var self = this,
			$container = self._getFieldEditorContainer(),
			$editingField = $container.find(".editing");

		return self.getFieldContainerElement($editingField);
	};

	/**
	 * Get the field container element, to distinguish between regular field and group (inside) field.
	 *
	 * @param {JQuery} $field
	 * @returns
	 */
	FieldEditorHelper.prototype.getFieldContainerElement = function($field)
	{
		return $field.hasClass(FIELD_ELEMENT_CLASS.GROUP.CONTAINER) ?
			$field : $field.closest(`.${FIELD_ELEMENT_CLASS.REGULAR.CONTAINER}`);
	};

	/**
	 * Get the field content element, to distinguish between regular field and group (inside) field.
	 *
	 * @param {JQuery} $field
	 * @returns
	 */
	FieldEditorHelper.prototype.getFieldContentElement = function($field)
	{
		var isGroupField = $field.hasClass(FIELD_ELEMENT_CLASS.GROUP.CONTAINER),
			className = isGroupField ? FIELD_ELEMENT_CLASS.GROUP.CONTENT : FIELD_ELEMENT_CLASS.REGULAR.CONTENT;

		return $field.find(`.${className}`);
	};

	FieldEditorHelper.prototype.isNaN = function(value)
	{
		return typeof value === "number" && isNaN(value);
	};

	FieldEditorHelper.prototype._unbindEvents = function()
	{
		var self = this;
		$(document).off(self.eventNameSpace);
		if (self._detailView)
		{
			$(self._detailView.$element.find(".right-container")).off(self.eventNameSpace);
			if (self._detailView.onResizePage)
			{
				self._detailView.onResizePage.unsubscribeAll();
			}
		}
	};

	FieldEditorHelper.prototype._updateBoolFieldsContent = function($currentElement)
	{
		var text = $currentElement.find(ITEM_CONTENT_SELECTOR).text(),
			value = $currentElement.hasClass("true-item"),
			$item;

		this._detailView.$element.find(".grid-stack-item-content.boolean-stack-item").each(function(_, item)
		{
			if ($currentElement[0] === item)
			{
				return;
			}
			if ($currentElement.parent().data().field !== $(item).parent().data().field)
			{
				return;
			}

			$item = $(item);
			$item.find(ITEM_CONTENT_SELECTOR).text(text);

			value ? $item.removeClass('false-item').addClass('true-item') :
				$item.removeClass('true-item').addClass('false-item');
		});
	};

	FieldEditorHelper.prototype._updateBadgeContent = function(field, $parent)
	{
		var self = this, badgeContent = "",
			rsGroups = (self.editFieldList['FieldTripResourceGroups']
				? self.editFieldList['FieldTripResourceGroups'].value : null)
				|| self.detailView.recordEntity.FieldTripResourceGroups;

		if (!rsGroups)
		{
			badgeContent = "(0)";
		}
		else
		{
			var count = 0;
			//Remove Duplicated V/D/A
			_.each(_.uniqBy(rsGroups, field.badgeFiled), function(rs)
			{
				if (rs[field.badgeFiled])
				{
					count++
				}
			})
			badgeContent = (`(${count})`);
		}
		$($parent).find('span').text(badgeContent);
	};

	FieldEditorHelper.prototype._updateGeneralFieldsContent = function(fieldName, value, additionalParamter)
	{
		var self = this,
			$fields = self._detailView.$element.find(`[data-block-field-name='${fieldName}']`);
		value = (value === '' || value === null) ? 'None' : value;

		if (!(additionalParamter && additionalParamter.updateAll) && $fields.length < 2)
		{
			return;
		}

		$fields.each(function(_, field)
		{
			var $field = $(field),
				datapoint = tf.helpers.detailViewHelper.getDataPointByIdentifierAndGrid(fieldName, self.dataType);

			if (datapoint && datapoint.badgeFiled)
			{
				self._updateBadgeContent(datapoint, field);
			}
			var $parent = self.getFieldContainerElement($field),
				$content = self.getFieldContentElement($field);

			if (value != undefined && value !== null)
			{
				value = value.toString().trim().split(" ").join("&nbsp;")
				$content.html(value);
			}
			$parent.find("small.help-block").hide();

			$field.toggleClass(self.VALIDATE_ERROR_CLASS, !!additionalParamter.existingError);	// clear or add validation errors on other data-blocks of the same field
		});
	};

	FieldEditorHelper.prototype._updateAllFieldsContent = function(fieldName, format, $currentElement, value, text, existingError, updateAll)
	{
		var self = this,
			initParams = {
				existingError: existingError,
				updateAll: updateAll
			};

		switch (format)
		{
			case "BooleanDropDown":
				self._updateBoolFieldsContent($currentElement);
				break;
			case "ComboBox":
			case "DropDown":
			case "GroupDropDown":
				self._updateGeneralFieldsContent(fieldName, text, initParams);
				break;
			case "Date":
				value = (value === null || value === '') ? '' : moment(value).format('MM/DD/YYYY');
				self._updateGeneralFieldsContent(fieldName, value, initParams);
				break;
			case "DateTime":
			case "GroupDateTime":
				value = (value === null || value === '') ? '' : moment(value).format('MM/DD/YYYY hh:mm A');
				self._updateGeneralFieldsContent(fieldName, value, initParams);
				break;
			case "Time":
				value = (value === null || value === '') ? '' : moment("1899-12-30 " + value).format("hh:mm A");
				self._updateGeneralFieldsContent(fieldName, value, initParams);
				break;
			case "Money":
			case "Number":
				var decimalPlaces = self._editor.getCurrentPrecisionValue();
				value = parseFloat(value).toFixed(decimalPlaces);

				value = isNaN(value) ? null : tf.helpers.detailViewHelper.formatDataContent(value, "Number", format);
				initParams.updateAll = true;

				self._updateGeneralFieldsContent(fieldName, value, initParams);
				break;
			case "Fax":
			case "Phone":
				value = tf.helpers.detailViewHelper.formatDataContent(value, "String", "Phone");
				self._updateGeneralFieldsContent(fieldName, value, initParams);
				break;
			case "Note":
				self._updateGeneralFieldsContent(fieldName, text, initParams);
				break;
			default:
				self._updateGeneralFieldsContent(fieldName, value, initParams);
				break;
		}

		self._detailView.fieldContentChangedEvent.notify({
			fieldName: fieldName,
			format: format,
			$element: $currentElement,
			value: value,
			text: text
		});
	};

	FieldEditorHelper.prototype.editStop = function()
	{
		var self = this;
		return !!self._editor ?
			self._editor.editStop().then(function()
			{
				self._editor = null;
			}) : Promise.resolve(false);
	};

	FieldEditorHelper.prototype.editStart = function($target, $element, event, showWidget)
	{
		var self = this, detailView = self._detailView;

		if (!detailView.isReadMode() || self.disabled)
		{
			return;
		}

		var $dataElement = self.getFieldContainerElement($element),
			$content = self.getFieldContentElement($element),
			data = $dataElement.data(),
			options = $.extend({
				recordEntity: detailView.recordEntity,
				recordId: detailView.recordId,
				title: data.title,
				defaultValue: null,
				UDFId: data.UDFId,
				nullAvatar: data.nullAvatar,
				showWidget: showWidget,
				UDGridField: data.UDGridField,
			}, data.editType);


		options.defaultValue = (options.recordEntity == null) ?
			self.getNewRecordDefaultValue($element.parent(), data) : self.getDefaultValue(data, options.recordEntity);

		if (FIELD_WITH_WIDGET.includes(options.format) && event === 'click')
		{
			options.showWidget = true;

			const { allowInput } = options;

			if (options.format === "DropDown"
				&& ((typeof allowInput === "function" && allowInput())
					|| (typeof allowInput === "boolean" && allowInput)))
			{
				options.format = "ComboBox";
				options.showWidget = $target.hasClass(EDITOR_ICON_CLASS_NAME);
			}
		}

		$content.css({ border: 'none', outline: 'none' });

		self._editor = self._createEditor(options.format);
		options.editFieldList = self.editFieldList;
		self._editor.editStart($element, options);
	};

	/**
	 * Create field editor.
	 *
	 * @param {string} format
	 * @param {string} title
	 * @returns
	 */
	FieldEditorHelper.prototype._createEditor = function(format)
	{
		var self = this, editor = new TF.DetailView.FieldEditor[format + "FieldEditor"](format);
		editor.applied.subscribe(self._onEditorApplied.bind(self, format, editor));

		if (editor.editStopped)
		{
			editor.editStopped.subscribe(function()
			{
				if (self._detailView)
				{
					self._detailView.manageLayout();
				}
			});
		}

		editor.valueChanged.subscribe(function()
		{
			if (self._detailView)
			{
				self._detailView.obEditing(true);
			}
		});

		return editor;
	};

	/**
	 * When changes has been applied to the data block.
	 *
	 * @param {string} format
	 * @param {object} editor
	 * @param {Event} e
	 * @param {object} result
	 */
	FieldEditorHelper.prototype._onEditorApplied = function(format, editor, e, result)
	{
		var self = this;

		if (!self._detailView)
		{
			return;
		}

		result.UDFId ? self._onUDFEditorApplied(result) : self._onNonUDFEditorApplied(result);

		self._updateAllFieldsContent(result.blockName, format, editor._$parent, result.recordValue, result.text, !!result.errorMessages);
	};

	FieldEditorHelper.prototype._onUDFEditorApplied = function(result)
	{
		var self = this,
			type = result.type,
			userDefinedFieldsList = self.editFieldList[self.UDF_KEY] || [],
			isNoneValue = (result.recordValue === null || result.recordValue === undefined),
			field = {
				'Id': result.UDFId,
				'Name': result.fieldName,
				'RecordValue': isNoneValue ? '' : result.recordValue.toString(),  // result.recordValue = false, return 'false';
				'errorMessages': result.errorMessages,
				'TypeId': result.TypeId,
				'DataTypeId': result.DataTypeId
			};

		var udfDefinition = self._detailView.recordEntity
			&& self._detailView.recordEntity.UserDefinedFields
			&& self._detailView.recordEntity.UserDefinedFields.find(function(item) { return item.DisplayName === result.fieldName; });

		if (udfDefinition)
		{
			field.Type = udfDefinition.Type;
		}

		if (type === "DropDown" || type === "ListMover")
		{
			field.AlternateKey = "SelectPickListOptionIDs";
			field.SelectPickListOptionIDs = result.selectPickListOptionIDs;
			field.RecordValue = result.text;
		}

		self.editFieldList[self.UDF_KEY] = userDefinedFieldsList.filter(function(item)
		{
			return item.Id !== result.UDFId
		}).concat(field);
	};

	FieldEditorHelper.prototype._onNonUDFEditorApplied = function(result)
	{
		var self = this,
			onChange = self._detailView.onFieldChange,
			type = result.type,
			obj = {
				title: result.title,
				value: result.recordValue,
				errorMessages: result.errorMessages,
			};

		if (!result.errorMessages)
		{
			obj.blockName = result.blockName;
			obj.type = type;
			obj.relationshipKey = result.relationshipKey;
			if (onChange)
			{
				onChange.notify({ result: result });
			}
			switch (type)
			{
				case "ListMover":
					obj.value = result.selectPickListOptionIDs;
					if (result.blockName === "Schools")
					{
						self.editFieldList["Schools"] = {
							value: result.recordValue.split(',')
								.map(s => s && s.trim())
								.filter(s => s)
								.join('!')
						};
					}
					else if (result.blockName === "AllStaffTypes")
					{
						self.editFieldList["AllStaffTypes"] = { value: result.recordValue };
					}
					break;
				case "ComboBox":
				case "DropDown":
				case "GroupDropDown":
					obj.value = result.selectPickListOptionIDs[0];
					obj.textValue = result.text;
					break;
				default:
					if (!self._detailView.isCreateGridNewRecord &&
						self._detailView.recordEntity[result.fieldName] == result.recordValue)
					{
						delete self.editFieldList[result.fieldName];
						return;
					}
					break;
			}
		}

		self.editFieldList[result.fieldName] = obj;
	};

	/**
	 * Close field editor.
	 *
	 * @returns
	 */
	FieldEditorHelper.prototype.closeEditor = function()
	{
		var self = this;
		if (self._editor === null || !self._editor.closeWidget)
		{
			return;
		}
		self._editor.closeWidget();
	};

	FieldEditorHelper.prototype.relayout = function()
	{
		var self = this;
		self._detailView.$element.find(".editable").each(function(_, element)
		{
			var config = $(element).closest(".grid-stack-item").data();
			if (!config || !config.editType)
			{
				return;
			}

			self.renderIcons($(element), config.editType.format);
		});
	};

	/**
	 * Refresh
	 *
	 * @returns
	 */
	FieldEditorHelper.prototype.refresh = function()
	{
		var self = this;
		self.editFieldList = {};
		self.entityModified = false;
		self._editor = null;

		if (self._detailView)
		{
			self.relayout();
			self.markTabIndex();
		}
	};

	/**
	 * Check if any api field is missing.
	 *
	 */
	FieldEditorHelper.prototype.checkApiField = function()
	{
		var ignoreList = ["grid", "file", "map", "schedule", "calendar"],
			gridType = this.dataType,
			dataBlocks = _.flatMap(dataPointsJSON[gridType]),
			allProperties = Object.keys(this._detailView.recordEntity),
			check = function(shouldContainItem, isDropDownKey)
			{
				if (!allProperties.some(function(prop)
				{
					return prop === shouldContainItem;
				}))
				{
					console.log(String.format("detail view entity in {0} grid should have field {1}. {2}", gridType, shouldContainItem, isDropDownKey ? "because of drop down." : ""));
				}
			};

		dataBlocks.forEach(function(block)
		{
			if (typeof block.type === "string" && ignoreList.indexOf(block.type.toLowerCase()) === -1)
			{
				check(block.field);
			}
			if (block.editType && block.editType.entityKey)
			{
				check(block.editType.entityKey, true)
			}
		});
	};

	/**
	 * Validate if modifications are valid.
	 *
	 * @returns
	 */
	FieldEditorHelper.prototype.validateCustomInputs = function()
	{
		var self = this,
			keys = Object.keys(self.editFieldList);

		return keys.reduce(function(acc, key)
		{
			var item = self.editFieldList[key];

			if (key === self.UDF_KEY)
			{
				return acc.concat(item.reduce(function(r, udf)
				{
					return r.concat((udf.errorMessages || []).map(function(message)
					{
						return {
							fieldName: udf.Name,
							message: message === "required" ? udf.Name + " is required." : message
						};
					}));
				}, []));
			}

			return acc.concat((item.errorMessages || []).map(function(message)
			{
				return {
					fieldName: key,
					message: message === "required" ? item.title + " is required." : message
				}
			}));
		}, []);
	};

	/**
	 * Check when try to save a document without file attachment.
	 *
	 * @returns
	 */
	FieldEditorHelper.prototype.checkDocumentSaveWithoutFile = function()
	{
		var self = this;
		if (self.dataType === "document")
		{
			var confirmTitle = "Confirmation Message",
				confirmMessage = "Do you want to save document without file attached?",
				attachedFileLength = self._detailView.getUploaderFiles().length;

			// If this is to create new record
			if (self._detailView.recordEntity == null)
			{
				if (attachedFileLength === 0)
				{
					return tf.promiseBootbox.yesNo(confirmMessage, confirmTitle);
				}
			}
			else if ((self.editFieldList["FileName"] && self.editFieldList["FileName"].value.length === 0) ||
				(self._detailView.recordEntity.FileName.length === 0 && attachedFileLength === 0))
			{
				return tf.promiseBootbox.yesNo(confirmMessage, confirmTitle);
			}
		}

		return Promise.resolve(true);
	};

	/**
	 * Show confirmation messages.
	 *
	 * @returns
	 */
	FieldEditorHelper.prototype.showConfirmationMessages = function()
	{
		var self = this, paramsUrl, key, count = 0,
			endPoint = tf.dataTypeHelper.getEndpoint(self.dataType),
			idParamName = tf.dataTypeHelper.getIdParamName(self.dataType),
			blackList = tf.dataTypeHelper.getEntityUpdateConfirmBlackList(self.dataType),
			modifiedFields = {};

		// API for other data types have not been implemented yet.
		if (self.dataType !== "student")
		{
			return Promise.resolve(true);
		}

		for (key in self.editFieldList)
		{
			if (blackList.indexOf(key) === -1)
			{
				modifiedFields[key] = self.editFieldList[key].value;
				count++;
			}
		}

		paramsUrl = String.format("{0}?{1}={2}", endPoint, idParamName, self._detailView.recordId);

		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), paramsUrl), {
			paramData: {
				confirmData: JSON.stringify(modifiedFields)
			}
		}).then(function(response)
		{
			if (!response || !response.Items || !response.Items[0])
			{
				return false;
			}

			var confirmMsgs = response.Items[0], msgStack = [];
			for (key in confirmMsgs)
			{
				if (!!confirmMsgs[key])
				{
					msgStack.push({
						field: key,
						name: self.editFieldList[key].blockName,
						title: self.editFieldList[key].title,
						message: confirmMsgs[key]
					});
				}
			}

			return msgStack.length === 0 ?
				true : tf.modalManager.showModal(
					new TF.DetailView.DataEditorSaveConfirmationModalViewModel({
						includeAll: msgStack.length >= count,
						messages: msgStack,
						revertFunc: self.revertChange.bind(self)
					})
				);
		});
	};

	/**
	 * Create and save an entity.
	 * @param  {Objects[]} uniqueObjects Fields must be unique.
	 * @returns
	 */
	FieldEditorHelper.prototype.createEntity = function(uniqueObjects)
	{
		var self = this;

		return self.editStop().then(function()
		{
			var prepareTasks = [], dataType = self.dataType,
				saveResponse = self.generateTemplateResponse(),
				recordEntity = tf.dataTypeHelper.getDataModelByGridType(dataType).toData();

			self.fillUserDefinedFieldsToEntity(recordEntity);
			self.applyModificationsToEntity(recordEntity);

			// do validation before start saving
			return self.conductFullValidation(recordEntity, dataType, uniqueObjects, true)
				.then(function(errorMessages)
				{
					if (errorMessages.length > 0)
					{
						saveResponse.success = false;
						saveResponse.messages = errorMessages;

						return saveResponse;
					}

					// special step for saving a document or if other data types require some extra actions.
					if (self.dataType === "document")
					{
						var task, uploadHelper = self._detailView.uploadDocumentHelper;

						if (uploadHelper.getFiles().length > 0)
						{
							var key = "TempFileName";

							self.editFieldList[key] = { value: "" };

							task = uploadHelper.upload().then(function(tempFileName)
							{
								self.editFieldList[key] = { value: tempFileName };
								recordEntity[key] = tempFileName;

								return true;
							});
						}
						else
						{
							task = self.checkDocumentSaveWithoutFile();
						}

						prepareTasks.push(task);
					}

					return Promise.all(prepareTasks).then(function(prepareTaskResults)
					{
						// if any of the prepare tasks returns false, cancel the save.
						if (prepareTaskResults.indexOf(false) > -1)
						{
							return null;
						}
						else
						{
							var errors = prepareTaskResults.filter(function(i)
							{
								return typeof i === "string";
							});
							if (errors.length > 0)
							{
								saveResponse.success = false;
								saveResponse.messages = errors;
								return saveResponse;
							}
						}

						return self._doSave(dataType, recordEntity, saveResponse, true);
					});
				});
		});
	};

	FieldEditorHelper.prototype.verifyRelationship = function()
	{
		var data = this.editFieldList["CalendarEventOperations"];
		if (data)
		{
			return TF.DetailView.DataBlockComponent.CalendarBlock.verify(data.value).then(result =>
			{
				if (result.valid)
				{
					if (result.overrideIds)
					{
						data.paramData = { overrideCalendarEventIds: result.overrideIds };
					}
					else
					{
						delete data.paramData;
					}

					return [];
				}

				if (result.cancel)
				{
					delete this.editFieldList["CalendarEventOperations"];
					return [];
				}

				if (result.messages && result.messages.length)
				{
					return result.messages;
				}

				return [];
			});
		}

		return Promise.resolve([]);
	};

	/**
	 * Conduct a full validation on
	 *
	 * @param {String} gridType
	 * @param {Object} recordEntity
	 * @param {Array} uniqueObjects
	 * @returns
	 */
	FieldEditorHelper.prototype.conductFullValidation = function(recordEntity, dataType, uniqueObjects, isCreateRecord)
	{
		var self = this,
			customInputErrors = self.validateCustomInputs(),
			customErrorFieldMap = customInputErrors.reduce(function(fieldMap, customError)
			{
				fieldMap[customError.fieldName] = true;
				return fieldMap;
			}, {}),
			missingFieldErrors = self._checkRequiredFields(dataType, recordEntity)
				.filter(function(missingError)
				{
					if (isCreateRecord)
					{
						self.toggleValidationErrorToFieldsByName([missingError.fieldName], true);
					}
					return customErrorFieldMap[missingError.fieldName] === undefined;
				}),
			uniqueCheckErrors = self._checkCodeMustBeUnique(recordEntity, uniqueObjects).filter(function(uniqueError)
			{
				return customErrorFieldMap[uniqueError.fieldName] === undefined;
			});

		return self.validateEntityByType(recordEntity, dataType, isCreateRecord)
			.then(function(validationMessages)
			{
				validationMessages = validationMessages || [];
				var groups = _.groupBy([].concat(customInputErrors, missingFieldErrors, uniqueCheckErrors, validationMessages), "fieldName"),
					keys = Object.keys(groups),
					errorMessages = _.uniq(keys.reduce(function(acc, key)
					{
						return acc.concat(groups[key].map(function(item)
						{
							return item.message;
						}));
					}, []));

				// make sure validation error classes have been added;
				self.toggleValidationErrorToFieldsByName(keys, true);

				if (!errorMessages.length && !isCreateRecord)
				{
					return self.verifyRelationship().then(msgs => msgs || []);
				}

				return errorMessages;
			});
	};

	FieldEditorHelper.prototype.toggleValidationErrorToFieldsByName = function(fieldNames, display)
	{
		var self = this;
		fieldNames.forEach(function(name)
		{
			if (self._detailView)
			{
				self._detailView.$element.find(`[data-block-field-name='${name}']`).toggleClass(self.VALIDATE_ERROR_CLASS, display);
			}
		});
	};

	/**
	 * Fill UDF default value to new record.
	 */
	FieldEditorHelper.prototype.fillUserDefinedFieldsToEntity = function(recordEntity)
	{
		var self = this, changedUdfNames, field;
		if (recordEntity.UserDefinedFields == null)
		{
			recordEntity.UserDefinedFields = [];
		}

		changedUdfNames = recordEntity.UserDefinedFields.map(function(udf)
		{
			return udf.Name;
		});

		self._detailView._userDefinedFields.forEach(function(udf)
		{
			if (changedUdfNames.indexOf(udf.field) >= 0)
			{
				return;
			}
			var udfEdited = self.editFieldList.UserDefinedFields && self.editFieldList.UserDefinedFields.some(function(editUdf)
			{
				return editUdf.Id === udf.UDFId;
			});
			if (udf.value == null && !udfEdited)
			{
				return;
			}

			field = {
				Id: udf.UDFId,
				Name: udf.field,
				RecordValue: udf.value,
				errorMessages: null,
				TypeId: udf.editType.TypeId,
				DataTypeId: udf.editType.DataTypeId
			}

			if (udf.UDFType === "List")
			{
				field.AlternateKey = "SelectPickListOptionIDs";
				field.SelectPickListOptionIDs = udf.value.map(function(v)
				{
					return v.value;
				});
				field.RecordValue = udf.value.map(function(v)
				{
					return v.text;
				}).join(", ");
			}

			recordEntity.UserDefinedFields.push(field);
		});
	};

	/**
	 * Save entity.
	 */
	FieldEditorHelper.prototype.saveEntity = function(uniqueObjects)
	{
		var self = this;
		return self.editStop().then(function()
		{
			var prepareTasks = [],
				dataType = self.dataType,
				saveResponse = self.generateTemplateResponse(),
				recordEntity = $.extend(true, {}, self._detailView.recordEntity),
				editFieldNames = Object.keys(self.editFieldList),
				shouldUploadFile = dataType === "document"
					&& self._detailView.getUploaderFiles().length > 0;

			// remove current value from unique values
			for (var key in uniqueObjects)
			{
				uniqueObjects[key].values = uniqueObjects[key].values.filter(function(value)
				{
					return value !== recordEntity[key] && value;
				});
			}

			// validation
			var updatedRecord = $.extend({}, recordEntity);
			self.applyModificationsToEntity(updatedRecord);

			return self.conductFullValidation(updatedRecord, dataType, uniqueObjects, false)
				.then(function(errorMessages)
				{
					if (errorMessages.length > 0)
					{
						saveResponse.success = false;
						saveResponse.messages = errorMessages;

						return saveResponse;
					}
					// check if there is no update
					else if (editFieldNames.length === 0 && !shouldUploadFile)
					{
						self._detailView.obEditing(false);
						return null;
					}

					// Get all confirmation messages for modified data fields.
					return self.showConfirmationMessages()
						.then(function(confirmationMessages)
						{
							editFieldNames = Object.keys(self.editFieldList);
							if (editFieldNames.length === 0 && !shouldUploadFile)
							{
								self._detailView.obEditing(false);

								// after checking confirmations, no update left in edit list.
								return null;
							}

							// Place this after the above logic is because if all changes have been reverted, the save button should return to be grey.
							if (!confirmationMessages)
							{
								saveResponse.success = false;
								return saveResponse;
							}

							if (dataType === "document")
							{
								var task, uploadHelper = self._detailView.uploadDocumentHelper;
								if (self._detailView.uploadDocumentHelper
									&& uploadHelper.getFiles().length > 0)
								{
									task = uploadHelper.upload().then(function(tempFileName)
									{
										var fileKey = "FileName", tempFilekey = "TempFileName";
										recordEntity[tempFilekey] = tempFileName;
										self.editFieldList[tempFilekey] = { value: tempFileName };
										editFieldNames.push(tempFilekey);
										if (self.editFieldList[fileKey] && self.editFieldList[fileKey].value.length === 0)
										{
											delete self.editFieldList[fileKey];
										}
										var fileNameFieldIndex = editFieldNames.indexOf(fileKey);
										if (fileNameFieldIndex >= 0)
										{
											editFieldNames.splice(fileNameFieldIndex, 1);
										}

										return true;
									});
								}
								else
								{
									task = self.checkDocumentSaveWithoutFile();
								}

								prepareTasks.push(task);
							}

							return Promise.all(prepareTasks).then(function(prepareTaskResults)
							{
								if (prepareTaskResults.indexOf(false) > -1)
								{
									return null;
								}
								else
								{
									var errors = prepareTaskResults.filter(function(i)
									{
										return typeof i === "string";
									});
									if (errors.length > 0)
									{
										saveResponse.success = false;
										saveResponse.messages = errors;
										return saveResponse;
									}
								}

								self.applyModificationsToEntity(recordEntity);
								return self._doSave(dataType, recordEntity, saveResponse, false);
							});
						});
				});
		});
	};

	/**
	 * Conduct the save/create operation.
	 *
	 * @param {String} gridType
	 * @param {Object} recordEntity
	 * @param {Boolean} isNew
	 * @returns
	 */
	FieldEditorHelper.prototype._doSave = function(gridType, recordEntity, saveResponse, isNew)
	{
		const self = this, prepareTask = self.prepareEntityBeforeSave(recordEntity, isNew);

		return Promise.resolve(prepareTask)
			.then(result =>
			{
				if (!result)
				{
					saveResponse.entity = recordEntity;
					saveResponse.cancel = true;
					return saveResponse;
				}

				const relationships = self.getEditFieldRelationships();
				let url,
					endpoint = tf.dataTypeHelper.getEndpoint(gridType);

				// Include UDF in relationship if needed.
				if (recordEntity.UserDefinedFields.length > 0 && relationships.indexOf("UDF") === -1)
				{
					relationships.push("UDF");
				}

				// Add relationships in request url.
				if (relationships.length > 0)
				{
					endpoint += String.format("?@relationships={0}", [...relationships].join(","));
				}

				// Generate requests url and parameters.
				url = pathCombine(tf.api.apiPrefix(), endpoint);

				return self.automation(gridType, recordEntity)
					.then(function()
					{
						return self.getDefaultParamData()
							.then(paramData =>
							{
								$.each(self.editFieldList, (k, v) =>
								{
									if (v.paramData)
									{
										paramData = paramData || {};
										$.extend(paramData, v.paramData);
									}
								});

								// Send request
								return tf.promiseAjax[isNew ? "post" : "put"](url, {
									data: [self.handleData(recordEntity)],
									handleData: function(key, value)
									{
										// Shape is geometry, shouldn't pass to server.
										return (key === "Shape") ? null : value;
									},
									paramData: paramData
								}).then(function(response)
								{
									// Confirm with Ted: comment these codes because the logic is incorrect and causes errors, we will touch them later.
									//return self.findSchedule(gridType, recordEntity).then(function()
									//{
									tf.loadingIndicator.tryHide();

									var savedEntity = response.Items[0];

									if (isNew)
									{
										return savedEntity;
									}

									return self.unassignedCrossStudent(gridType, savedEntity).then(function()
									{
										self.entityModified = true;
										self.refresh();

										// Save successfully.
										return savedEntity;
									});
									//});
								})
									.catch(function(response)
									{
										// Save api request failed.
										tf.loadingIndicator.tryHide();
										var error = 'API Error: ' + response.Message;
										if (response.StatusCode === 404)
										{
											error += "\r\nSuggest you refreshing the view to fetch the latest data.";
										}

										return error;
									});
							})

					}).then(function(saveResult)
					{
						if (typeof saveResult === "string")
						{
							saveResponse.success = false;
							saveResponse.messages = [saveResult];
						}
						else
						{
							saveResponse.success = true;
							saveResponse.entity = saveResult;
						}

						return saveResponse;
					});
			});
	};

	FieldEditorHelper.prototype.unassignedCrossStudent = function(gridType, entity)
	{
		function setParameters(student, trip)
		{
			var tripStop = {
				boundary: { geometry: TF.Control.FindScheduleForStudentViewModel.prototype.getBoundaryGeometry(student.StopBoundary.Geometry.WellKnownText) },
				geometry: tf.map.ArcGIS.webMercatorUtils.geographicToWebMercator(tf.map.ArcGIS.Point(student.StopXcoord, student.StopYcoord, tf.map.ArcGIS.SpatialReference({ "wkid": 4326 }))),
				VehicleCurbApproach: student.VehicleCurbApproach, Sequence: student.Sequence, ProhibitCrosser: student.StopProhibitCrosser
			};
			var sequence = student.Sequence - 2;
			if (sequence >= 0)
			{
				var preTripStop = { Path: TF.Control.FindScheduleForStudentViewModel.prototype.getBoundaryGeometry(student.PrevStopPath.Geometry.WellKnownText) };
				trip.TripStops[sequence] = preTripStop;
			}
			student = {
				ProhibitCross: student.ProhibitCross,
				geometry: tf.map.ArcGIS.webMercatorUtils.geographicToWebMercator(
					new tf.map.ArcGIS.Point(student.StudentXcoord,
						student.StudentYcoord, tf.map.ArcGIS.SpatialReference({ "wkid": 4326 }))
				)
			};
			return { tripStop: tripStop, trip: trip, student: student };
		}
		var self = this, promiseList = [], originalEntity;
		if (gridType === 'altsite')
		{
			originalEntity = self._detailView.recordEntity;
			if (entity.Xcoord == originalEntity.Xcoord)
			{
				return Promise.resolve(true);
			}
			if (!self.findScheduleHelper)
			{
				self.findScheduleHelper = new TF.Helper.FindStudentScheduleHelper();
			}
			var stops = [];
			entity.PickUpCrossStudents.forEach(function(s)
			{
				stops.push(setParameters(s).tripStop);
			});
			entity.DropOffCrossStudents.forEach(function(s)
			{
				stops.push(setParameters(s).tripStop);
			});

			return self.findScheduleHelper.getStreet(stops).then(function()
			{
				entity.PickUpCrossStudents.map(function(s)
				{
					var parameters = setParameters(s);
					promiseList.push(self.findScheduleHelper._isStudentRequirementCanAssign(parameters.tripStop, parameters.student, parameters.trip).then(function(res)
					{
						s.type = 'PU';
						s.Dly_Pu_CrossToStop = res.isCross;
						if (!res.isCanAssign)
						{
							s.Dly_Pu_TripStop = 0;
							s.Dly_Pu_TripID = 0;
						}
					}));
				});

				entity.DropOffCrossStudents.map(function(s)
				{
					var parameters = setParameters(s);
					promiseList.push(self.findScheduleHelper._isStudentRequirementCanAssign(parameters.tripStop, parameters.student, parameters.trip).then(function(res)
					{
						s.type = 'DO';
						s.Dly_Do_CrossToStop = res.isCross;
						if (!res.isCanAssign)
						{
							s.Dly_Do_TripStop = 0;
							s.Dly_Do_TripID = 0;
						}
					}));
				});

				return Promise.all(promiseList).then(function()
				{
					return self.updateStudent(entity.PickUpCrossStudents.concat(entity.DropOffCrossStudents));
				});
			});
		}
		else
		{
			return Promise.resolve(true);
		}
	};

	FieldEditorHelper.prototype.updateStudent = function(students)
	{
		var data = [];
		students.map(function(student)
		{
			if (student.type === 'PU')
			{
				data = data.concat([{
					"Id": student.Id, "op": "replace", "path": "/Dly_Pu_CrossToStop", "value": student.Dly_Pu_CrossToStop
				}]);
				if (student.Dly_Pu_TripStop && student.Dly_Pu_TripID)
				{
					data = data.concat([{
						"Id": student.Id, "op": "replace", "path": "/Dly_Pu_TripStop", "value": student.Dly_Pu_TripStop
					}, {
						"Id": student.Id, "op": "replace", "path": "/Dly_Pu_TripID", "value": student.Dly_Pu_TripID
					}]);
				}
			}
			else
			{
				data = data.concat([{
					"Id": student.Id, "op": "replace", "path": "/Dly_Do_CrossToStop", "value": student.Dly_Do_CrossToStop
				}]);
				if (student.Dly_Do_TripStop && student.Dly_Do_TripID)
				{
					data = data.concat([{
						"Id": student.Id, "op": "replace", "path": "/Dly_Do_TripStop", "value": student.Dly_Do_TripStop
					}, {
						"Id": student.Id, "op": "replace", "path": "/Dly_Do_TripID", "value": student.Dly_Do_TripID
					}]);
				}
			}
		});

		return tf.promiseAjax.patch(pathCombine(tf.api.apiPrefix(), "students"), {
			data: data,
		}).then(function(result)
		{
			return result;
		});
	}

	FieldEditorHelper.prototype.automation = function(gridType, recordEntity)
	{
		var self = this;
		if (["altsite", "school", "student", "georegion"].indexOf(gridType) >= 0)
		{
			return TF.AutomationHelper.getSetting().then(function(setting)
			{
				self.automationSetting = setting;
				return TF.AutomationHelper.autoGeoCode(recordEntity, self._detailView.recordEntity, gridType, setting).then(function()
				{
					if (gridType === "student")
					{
						if (!recordEntity.Xcoord || !recordEntity.SchoolCode)
						{
							recordEntity.Mifromschl = 0;
						}
						return TF.AutomationHelper.autoFind(recordEntity, setting);
					}
				});
			});
		}
		return Promise.resolve();
	};

	FieldEditorHelper.prototype.findSchedule = function(gridType, recordEntity)
	{
		var self = this,
			setting = self.automationSetting,
			originalEntity = self._detailView.recordEntity;
		if (gridType === "student" && setting.findScheduleforStudent && recordEntity.Xcoord !== originalEntity.Xcoord)
		{
			return TF.AutomationHelper.findSchedule([recordEntity.Id], setting.useStopPool, setting.selectedStopPoolCategoryId, setting.createDoorToDoor);
		}

		return Promise.resolve();
	};

	/**
	 * Switch to next data field.
	 *
	 * @param {boolean} isForward
	 * @returns
	 */
	FieldEditorHelper.prototype._switchToNextEditableBlock = function(isForward)
	{
		var self = this, promise,
			$currentBlock = self.getEditingFieldElement(),
			customizedTabIndex = $currentBlock.attr(CUSTOM_TAB_INDEX_ATTR),
			parentGrid = $currentBlock.attr(PARENT_GRID_ATTRIBUTE),
			$nextBlock = self.getNextEditableBlock(customizedTabIndex, parentGrid, isForward);

		if (!$nextBlock)
		{
			return;
		}

		self.scrollToNextBlock($nextBlock);

		var editor = self.getBlockEditElement($currentBlock).data("editor");
		if (editor)
		{
			var $element = editor._$element;
			if ($element)
			{
				$element.trigger("focusout");
				// knockout.js sync value to observable object by onchange event.
				(editor.editorType() === "Memo") ? $element.find("textarea").trigger("change") :
					$element.find("input").trigger("change");
			}

			promise = editor.editStop();
		}

		Promise.resolve(promise).then(function()
		{
			var $nextEditElement = self.getBlockEditElement($nextBlock);
			self.editStart(null, $nextEditElement, "tab", false);
		});
	};

	/**
	 * Get edit element in the block.
	 *
	 * @param {$JQuery} $block
	 * @returns
	 */
	FieldEditorHelper.prototype.getBlockEditElement = function($block)
	{
		return $block.hasClass("editable") ? $block : $block.find(".editable");
	};


	/**
	 * Scroll to next data block.
	 *
	 * @param {JQuery} $nextBlock
	 */
	FieldEditorHelper.prototype.scrollToNextBlock = function($nextBlock)
	{
		var self = this, $container = self._detailView.$element.find(".right-container"),
			nextBlockTop = $nextBlock.position().top,
			nextBlockHeight = $nextBlock.height(),
			scrollPosition = $container.scrollTop(),
			containerHeight = $container.height(),
			visibleRange = {
				top: scrollPosition,
				bottom: scrollPosition + containerHeight
			};

		if (nextBlockTop < visibleRange.top)
		{
			$container.scrollTop(scrollPosition + (nextBlockTop - visibleRange.top));
		}
		else if (nextBlockTop + nextBlockHeight > visibleRange.bottom)
		{
			$container.scrollTop(scrollPosition + (nextBlockTop + nextBlockHeight - visibleRange.bottom));
		}
	};

	/**
	 * Render Icons.
	 *
	 * @param {JQuery} $element
	 * @param {String} format
	 */
	FieldEditorHelper.prototype.renderIcons = function($element, format)
	{
		var $editorIcon = $element.find(".editor-icon"), editorClass = null;
		if ($editorIcon.length === 0)
		{
			$editorIcon = $("<div />", { class: EDITOR_ICON_CLASS_NAME }).appendTo($element);
			switch (format)
			{
				case "ListMover":
					editorClass = "list-mover";
					break;
				case "DropDown":
				case "BooleanDropDown":
					editorClass = "drop-down";
					break;
				case "DateTime":
				case "Date":
					editorClass = "date-time";
					break;
				case "Time":
					editorClass = "time";
					break;
				case "Calculate":
					editorClass = "calculator";
					break;
			}
		}

		var iconTop = 0, iconHeight = $editorIcon.outerHeight();
		if (format === "BooleanDropDown")
		{
			iconTop = ($element.outerHeight() - iconHeight) / 2;
		}
		else
		{
			var $content = $element.find(ITEM_CONTENT_SELECTOR), contentHidden = $content.is(":hidden");
			if (!contentHidden)
			{
				iconTop = $content.offset().top - $element.offset().top + 2;
			}
			else
			{
				iconTop = null;
			}
		}

		if (iconTop != null)
		{
			$editorIcon.css("top", Math.floor(iconTop));
		}
		$element.addClass(editorClass);
	};

	/**
	 * Bind mouse down event.
	 *
	 */
	FieldEditorHelper.prototype._bindMouseDownEvent = function()
	{
		var $document = $(document);
		$document.on('mousedown' + this.eventNameSpace, '.grid-stack-item-content.editable', function(e)
		{
			if (e.button !== 0)
			{
				e.preventDefault();
			}
		});
	};

	/**
	 * Bind click event.
	 *
	 */
	FieldEditorHelper.prototype._bindClickEvent = function()
	{
		var self = this,
			eventName = "click" + self.eventNameSpace,
			editableElementSelectors = [
				":not(.multi-editable).grid-stack-item-content.editable",
				`.multi-editable.grid-stack-item-content .${FIELD_ELEMENT_CLASS.GROUP.CONTAINER}.editable`
			],
			selectorStr = editableElementSelectors.join(",");

		$(document).on(eventName, selectorStr,
			e =>
			{
				var fieldElement, contentElement,
					showWidget = false,
					$curTarget = $(e.currentTarget),
					isMulti = $curTarget.hasClass(FIELD_ELEMENT_CLASS.GROUP.CONTAINER);

				if (isMulti)
				{
					fieldElement = $curTarget;
					contentElement = $curTarget;
				}
				else
				{
					fieldElement = $curTarget.closest(".grid-stack-item");
					contentElement = fieldElement.find(".grid-stack-item-content");
					showWidget = fieldElement.find(ITEM_CONTENT_SELECTOR).hasClass(EDITOR_ICON_CLASS_NAME);
				}

				self.initFieldEditor(e.target, fieldElement, contentElement, 'click', showWidget);
			});
	};

	FieldEditorHelper.prototype.initFieldEditor = function(targetElement, fieldElement, contentElement, eventType, showWidget)
	{
		var self = this,
			$target = $(targetElement),
			$field = $(fieldElement),
			$content = $(contentElement),
			activeDetailViewElement = self._detailView.$element[0],
			isOnActivePanel = $.contains(activeDetailViewElement, $field[0]),
			isNotInit = !$content.data("editor");

		// field element is on active detail view and does not have editor initialized.
		if (isOnActivePanel && isNotInit)
		{
			self.editStart($target, $content, eventType, showWidget);

			if (eventType === "validate")
			{
				self.editStop();
			}
		}
	};

	/**
	 * Bind key down event.
	 *
	 */
	FieldEditorHelper.prototype._bindKeyDownEvent = function()
	{
		var self = this;
		$(document).on('keydown' + self.eventNameSpace, function(e)
		{
			var keyCode = e.keyCode || e.which,
				detailView = self._detailView;
			if (!detailView.isReadMode())
			{
				if (keyCode === $.ui.keyCode.TAB)
				{
					e.preventDefault();
				}
				return;
			}

			if (detailView.$element.is(":visible") &&
				detailView.isReadMode() &&
				!self.checkIfDetailViewCoveredByAnotherModal())
			{
				if (keyCode === $.ui.keyCode.TAB)
				{
					e.preventDefault();
					e.stopPropagation();

					//tab -> move forward
					//shift + tab -> move back
					self._switchToNextEditableBlock(!e.shiftKey);
				}
			}
		});
	};

	/**
	 * Check if this detail view is covered by another modal.
	 *
	 */
	FieldEditorHelper.prototype.checkIfDetailViewCoveredByAnotherModal = function()
	{
		var self = this, modalSelector = ".tfmodal.modal.in",
			$openedModals = $(modalSelector);

		if ($openedModals.length > 0)
		{
			if (self._detailView.$element.closest(modalSelector).length > 0)
			{
				var hasHigherModal = false,
					$thisModal = self._detailView.$element.closest(modalSelector),
					thisZIndex = +$thisModal.css("z-index");

				$openedModals.each(function(_, modal)
				{
					if (thisZIndex < +$(modal).css("z-index"))
					{
						hasHigherModal = true;
						return false;
					}

					return true;
				});

				return hasHigherModal;
			}
			else
			{
				return true;
			}
		}

		return false;
	};

	/**
	 * Revert change on data field.
	 */
	FieldEditorHelper.prototype.revertChange = function(fieldName)
	{
		var self = this,
			entity = self._detailView.recordEntity,
			obj = self.editFieldList[fieldName],
			$blocks = self._detailView.$element.find(`[data-block-field-name=${obj.blockName}]`),
			cachedValue = entity[fieldName],
			cachedText = entity[obj.blockName];

		self._updateAllFieldsContent(fieldName, obj.type, $blocks, cachedValue, cachedText, null, true);

		delete self.editFieldList[fieldName];
	};

	/**
	 * Apply field modifications on entity.
	 *
	 * @param {Object} entity
	 */
	FieldEditorHelper.prototype.applyModificationsToEntity = function(entity)
	{
		var self = this, fieldItem;
		Object.keys(self.editFieldList).map(function(key)
		{
			fieldItem = self.editFieldList[key];
			if (key === self.UDF_KEY)
			{
				// update user defined fields by Id.
				fieldItem.forEach(function(item)
				{
					var field = entity[key].filter(function(obj)
					{
						return obj.Id === item.Id
					})[0];

					if (field)
					{
						if (item.AlternateKey)
						{
							field[item.AlternateKey] = item[item.AlternateKey];
						}

						if (field.Type === "Phone Number")
						{
							field['RecordValue'] = item.RecordValue.replace(/\D/g, '');
						}
						else
						{
							field['RecordValue'] = item.RecordValue;
						}
					}
				});
			}
			else
			{
				let rawValue = self.getFieldRawValue(fieldItem);
				entity[key] = self.handleUnitOfMeasurementValue(rawValue, fieldItem);
			}
		});
	};

	FieldEditorHelper.prototype.handleUnitOfMeasurementValue = function(value, fieldItem)
	{
		const self = this,
			unitOfMeasureSupportedFields = tf.helpers.detailViewHelper.getUnitOfMeasureSupportedFields(self.dataType),
			matchedItem = unitOfMeasureSupportedFields.find(x => x.field === fieldItem.blockName);

		if (matchedItem && tf.measurementUnitConverter.isNeedConversion(matchedItem.UnitInDatabase))
		{
			return tf.measurementUnitConverter.convert({
				value: Number(value),
				originalUnit: tf.measurementUnitConverter.getCurrentUnitOfMeasure(),
				targetUnit: matchedItem.UnitInDatabase || tf.measurementUnitConverter.MeasurementUnitEnum.Metric,
				isReverse: !!matchedItem.UnitOfMeasureReverse,
				precision: 4,
				unitType: matchedItem.UnitTypeOfMeasureSupported
			});
		}

		return value;
	}

	/**
	 * Get raw value of data block
	 */
	FieldEditorHelper.prototype.getFieldRawValue = function(editField)
	{
		switch (editField.type)
		{
			case "Phone":
			case "Fax":
				return editField.value ? editField.value.replace(/\D/g, '') : editField.value;
		}

		if (editField.blockName === "Mobile")
		{
			return editField.value.replace(/\D/g, '');
		}
		else
		{
			return editField.value;
		}
	}

	/**
	 * Get relevant "relationships" that have been updated.
	 *
	 * @return {Array}
	 */
	FieldEditorHelper.prototype.getEditFieldRelationships = function()
	{
		var self = this, relationships = [];
		Object.keys(self.editFieldList).map(function(key)
		{
			const relationshipKey = self.editFieldList[key].relationshipKey;
			if (key === self.UDF_KEY)
			{
				relationships.push('UDF');
			}
			else if (!!relationshipKey && !relationships.includes(relationshipKey))
			{
				relationships.push(relationshipKey);
			}
		});

		return relationships;
	};

	FieldEditorHelper.prototype.isEntityValueEmpty = function(recordEntity, fieldName)
	{
		var self = this,
			dataPoint = tf.helpers.detailViewHelper.getDataPointByIdentifierAndGrid(fieldName, self.dataType),
			acceptableValueReg = dataPoint && dataPoint.editType && dataPoint.editType.acceptableValueReg,
			propertyName = dataPoint && dataPoint.editType.entityKey ? dataPoint.editType.entityKey : fieldName,
			value = recordEntity[propertyName];

		return acceptableValueReg ? !acceptableValueReg.test(value) : (value === undefined ||
			value === null ||
			(typeof value === "string" && value.trim().length === 0) ||
			(Array.isArray(value) && value.length === 0) ||
			($.isNumeric(value) && value === 0));
	};

	FieldEditorHelper.prototype.getRequiredFields = function(dataType)
	{
		return tf.helpers.detailViewHelper.getRequiredFields(dataType);
	}

	/**
	 * Check if all fields that cannot be null have been filled with value.
	 *
	 * @param {Object} recordEntity
	 * @returns
	 */
	FieldEditorHelper.prototype._checkRequiredFields = function(dataType, recordEntity)
	{
		var self = this,
			errorMessages = [],
			requiredFields = self.getRequiredFields(dataType);

		if (Array.isArray(requiredFields))
		{
			requiredFields.forEach(function(item)
			{
				// not sure where this key would ever exist in the field
				if (item.key)
				{
					if (tf.helpers.detailViewHelper.checkFieldEditability(dataType, item.key) && self.isEntityValueEmpty(recordEntity, item.key))
					{
						errorMessages.push({ fieldName: item.name, message: item.title + " is required." });
					}
				}
				else if (item.udfId)
				{
					var udfField = recordEntity.UserDefinedFields.filter(function(udf)
					{
						return udf.Id === item.udfId;
					});
					if ((udfField.length > 0 && (udfField[0].RecordValue == null || udfField[0].RecordValue.length === 0))
						|| udfField.length === 0)
					{
						errorMessages.push({ fieldName: item.name, message: item.title + " is required." });
					}
				}
				else if (item.field && item.name && tf.helpers.detailViewHelper.checkFieldEditability(dataType, item.field)
					&& (!self._detailView.allowEdit || self._detailView.allowEdit(item.field))
					&& self.isEntityValueEmpty(recordEntity, item.field))
				{
					errorMessages.push({ fieldName: item.field, message: item.title + " is required." });
				}
			});
		}

		return errorMessages;
	};

	FieldEditorHelper.prototype._checkCodeMustBeUnique = function(recordEntity, uniqueObjects)
	{
		var errorMessages = [],
			uniqueFields = uniqueObjects ? Object.keys(uniqueObjects) : [];

		if (Array.isArray(uniqueFields) && uniqueFields.length > 0)
		{
			uniqueFields.map(function(field)
			{
				var obj = uniqueObjects[field],
					value = recordEntity[field];

				if (value && obj.values.includes(value))
				{
					errorMessages.push({ fieldName: field, message: obj.title + " must be unique." });
				}
			});
		}

		return errorMessages;
	};

	/**
	 * TODO: remove this function
	 */
	FieldEditorHelper.prototype.handleData = function(entity)
	{
		if (this.dataType === "contact")
		{
			return entity;
		}

		var handled = $.extend(true, {}, entity);
		if (this.dataType === "trip")
		{
			handled.StartTime = handled.StartTime == null ? null : this.Time2DateTimeConvertor(handled.StartTime);
			handled.FinishTime = handled.FinishTime == null ? null : this.Time2DateTimeConvertor(handled.FinishTime);
		}
		return handled;
	}

	FieldEditorHelper.prototype.DateTime2TimeConvertor = function(datetime)
	{
		if (!datetime)
		{
			return datetime;
		}

		var time = moment(datetime).format("HH:mm:ss");
		if (time === "Invalid date")
		{
			time = datetime;
		}

		return time;
	}

	FieldEditorHelper.prototype.Time2DateTimeConvertor = function(time)
	{
		var momentHelper = new TF.Document.MomentHelper();
		return moment(momentHelper.toDate(time || "00:00")).format("YYYY-MM-DDTHH:mm:ss");
	};

	FieldEditorHelper.prototype._getFieldEditorContainer = function()
	{
		return this._detailView.$element;
	};

	/**
	 * Generate template response.
	 *
	 * @returns
	 */
	FieldEditorHelper.prototype.generateTemplateResponse = function()
	{
		return $.extend(true, {}, RESPONSE_TEMPLATE);
	};

	/**
	 * Validate entity by its type.
	 *
	 * @param {Object} entity
	 * @param {boolean} isNew
	 * @returns
	 */
	FieldEditorHelper.prototype.validateEntityByType = function(entity, isNew)
	{
		return Promise.resolve([]);
	}

	FieldEditorHelper.prototype.updateFields = function(key, field, text, value)
	{
		var self = this;
		self.editFieldList[key] = {
			value: value,
			blockName: field
		};

		self._updateGeneralFieldsContent(field, value, { updateAll: true });
	}
	FieldEditorHelper.prototype.isFieldValid = function(fieldName)
	{
		return this.editFieldList[fieldName] == null || this.editFieldList[fieldName].errorMessages == null;
	}
	/**
	 * Validate related fields like starttime and endtime.
	*/
	FieldEditorHelper.prototype.validateRelatedFields = function(result, fieldRelatedMap)
	{
		var self = this,
			fieldName = result.fieldName,
			fieldValue = result.recordValue,
			map = fieldRelatedMap[fieldName];

		if (map == null)
		{
			return;
		}

		var relatedDataBlockSetting = tf.helpers.detailViewHelper.getDataPointByIdentifierAndGrid(map.relatedField, self.dataType);
		var value = self.getValueFromRelatedField(relatedDataBlockSetting, map);

		const leftValue = transformToComparable(fieldValue, map.option);
		const rightvalue = transformToComparable(value, map.option);
		var valArray = [leftValue, rightvalue];

		if (!checkValuesValidity(valArray, map.option))
		{
			return;
		}

		var relatedDataBlock = self._detailView.$element.find(`div.grid-stack-item-content[data-block-field-name=${map.relatedField}]`);
		if (relatedDataBlock.length === 0)
		{
			relatedDataBlock = self._detailView.$element.find('div.grid-stack-item-content').find(`[data-block-field-name=${map.relatedField}]`);
		}
		var filedBlock = self._detailView.$element.find(`div.grid-stack-item-content[data-block-field-name=${fieldName}]`);
		if (filedBlock.length === 0)
		{
			filedBlock = self._detailView.$element.find('div.grid-stack-item-content').find(`[data-block-field-name=${fieldName}]`);
		}
		if (!tf.helpers.detailViewHelper.compareTwoValues(valArray, map.comparator))
		{
			relatedDataBlock.addClass(self.VALIDATE_ERROR_CLASS);
			self.editFieldList[fieldName] = {
				errorMessages: [
					map.option.message
				],
				title: result.title,
				errorValue: result.recordValue
			}
			return;
		}
		relatedDataBlock.removeClass(self.VALIDATE_ERROR_CLASS);
		filedBlock.removeClass(self.VALIDATE_ERROR_CLASS);

		if (relatedDataBlock.length === 0)
		{
			return;
		}
		relatedDataBlock.removeClass(self.VALIDATE_ERROR_CLASS);
		filedBlock.removeClass(self.VALIDATE_ERROR_CLASS);
		self.editFieldList[map.relatedField] = {
			blockName: map.relatedField,
			errorMessages: null,
			value: transformToEntity(rightvalue, map.option),
			relationshipKey: relatedDataBlockSetting['editType']['relationshipKey'],
			title: relatedDataBlockSetting.title,
			type: relatedDataBlockSetting.type,
		}
	}
	FieldEditorHelper.prototype.getValueFromRelatedField = function(dataBlockSetting, map)
	{
		var self = this, recordEntity = self._detailView.recordEntity;
		if (!self.isFieldValid(map.relatedField))
		{
			return self.editFieldList[map.relatedField].errorValue;

		}
		else
		{
			if (self._detailView.isCreateGridNewRecord)
			{
				recordEntity = tf.dataTypeHelper.getDataModelByGridType(self.dataType).toData();
			}
			return self.getDefaultValue(dataBlockSetting, recordEntity);
		}
	}

	FieldEditorHelper.prototype.prepareEntityBeforeSave = function(entity, isNew)
	{
		// Override
		return true;
	};

	FieldEditorHelper.prototype.isValueChanged = function(fieldName, format)
	{
		const newValue = this.editFieldList[fieldName];
		if (newValue)
		{
			const entity = this._detailView.recordEntity;
			return entity && !tf.dataFormatHelper.checkIfIdentical(newValue.value, entity[fieldName]);
		}

		return false;
	};

	FieldEditorHelper.prototype.getDefaultParamData = function()
	{
		return Promise.resolve({});
	};

	FieldEditorHelper.prototype.dispose = function()
	{
		var self = this;
		self._unbindEvents();
		self.editStop();
		self._detailView = null;
	};

	function transformToComparable(date, option)
	{
		switch (option.type)
		{
			case 'time':
				return date ? moment(date, 'hh:mm A') : moment.invalid();
			case 'dateTime':
				return date ? moment(date) : moment.invalid();
			default:
				return date;
		}
	}

	function transformToEntity(date, option)
	{
		switch (option.type)
		{
			case 'time':
				return date.format('HH:mm:ss');
			case 'dateTime':
				return date.format('YYYY-MM-DDTHH:mm:ss');
			default:
				return date;
		}
	}

	function checkValuesValidity(values, option)
	{
		switch (option.type)
		{
			case 'dateTime':
			case 'time':
				return values.every(function(item)
				{
					return item.isValid();
				});
			default:
				return values.every(function(item)
				{
					return item != null;
				});
		}
	}
})();
