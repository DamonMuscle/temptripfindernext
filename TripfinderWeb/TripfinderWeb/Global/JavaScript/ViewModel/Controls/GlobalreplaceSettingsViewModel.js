
(function()
{
	createNamespace("TF.Control").GlobalReplaceSettingsViewModel = GlobalReplaceSettingsViewModel;

	function GlobalReplaceSettingsViewModel(selectedCount, gridType)
	{
		var self = this;
		self.gridType = gridType;
		self.obSpecifyRecords = ko.observableArray([
			{ value: 'allInFilter', text: 'All records in filter' },
			{ value: 'selected', disable: selectedCount == 0, text: 'Current ' + selectedCount + ' selected ' + TF.getSingularOrPluralTitle("record", selectedCount) }
		]);

		self.obReplaceType = ko.observable("Standard");
		self.obStandardInputGroupDisable = ko.observable(false);
		self.obExtendedsEnable = ko.observable(false);
		self.obDisplayUpdateRequirement = ko.observable(false);
		self.allNoTransportationTypes = ko.observableArray([]);
		self.obSelectedNoTransportationType = ko.observable();
		self.replaceTypeDisable = gridType != "student";
		self.obReplaceType.subscribe(function()
		{
			self.obStandardInputGroupDisable(self.obReplaceType() == "Extended");
			self.obExtendedsEnable(self.obReplaceType() != "Standard" && !self.replaceTypeDisable);
		});

		self.extendeds = [{ display: "Remove All Additional Requirements", key: "removeAllAdditionalRequirements" },
		{ display: "Remove All Exceptions", key: "removeAllExceptions" },
		{ display: "Remove All Schedule", key: "removeAllSchedule" },
		{ display: "Remove All Default Requirements", key: "removeAllDefaultRequirements" },
		{ display: "Reset All Default Requirements", key: "resetAllDefaultRequirements" },
		{ display: "Update All Default Requirements to None", key: "Update All Default Requirements to None" }];
		self.obSelectedExtended = ko.observable("");

		self.obSelectedExtended.subscribe(function()
		{
			self.obDisplayUpdateRequirement(self.obSelectedExtended() === "Update All Default Requirements to None");
		});

		tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "notransportationtypes"))
			.then(function(result)
			{
				var noTransportationTypes = result.Items;
				Array.sortBy(noTransportationTypes, "Type");
				self.allNoTransportationTypes(noTransportationTypes);
			});

		var selectedSpecifyRecord = selectedCount ? self.obSpecifyRecords()[1] : self.obSpecifyRecords()[0];
		self.obSelectedSpecifyRecords = ko.observable(selectedSpecifyRecord.value);
		self.obNewValue = ko.observable("");
		self.obSelectType = ko.observable("Disabled");
		self.lastSelectedField = "";
		self.gridOption = {};
		self.obSelectDataList = ko.observableArray();
		self.inputEnable = ko.observable(false);
		self.obTitle = ko.observable("");
		self.obMaxLength = ko.observable("50");
		self.allFields = ko.observableArray([]);
		self.targetFieldName = ko.observable();
		self.targetField = ko.computed(() =>
		{
			return self.allFields().find(i => i.field == self.targetFieldName());
		});
		self.generateInputType = ko.computed(() =>
		{
			return self.obSelectType() === "Number" ? "Decimal" : self.obSelectType();
		});
		self.itemTypes = ko.observable();
		self.getFields().then(function(items)
		{
			self.allFields(items);
			self.itemTypes(self.createItemTypes(items));
		});
		self.obIsValueRequired = ko.observable(false);
		self.$container = null;
		self.copyFrom = ko.observable(false);
		self.sourceFieldName = ko.observable();
		var supportZipCity = ['student', 'altsite', 'georegion', 'school'];
		self.sourceFields = ko.computed(() =>
		{
			let currentTarge = self.targetField();
			if (!currentTarge)
			{
				return [];
			}

			if (supportZipCity.indexOf(self.gridType) > -1)
			{
				if (currentTarge.field == 'MailZip')
				{
					return self.allFields().filter(i => i.field == "GeoZip");
				}

				if (currentTarge.field == 'MailCity')
				{
					return self.allFields().filter(i => i.field == "GeoCity");
				}
			}

			let types = self.itemTypes();
			if (!types)
			{
				return [];
			}

			let fields = (currentTarge.type == "String" ? self.allFields() : types[currentTarge.type]) || [];
			if (supportZipCity.indexOf(self.gridType) > -1)
			{
				if (currentTarge.field == 'GeoZip')
				{
					return fields.filter(i => i.field == "MailZip");
				}

				if (currentTarge.field == 'GeoCity')
				{
					return fields.filter(i => i.field == "MailCity");
				}
			}

			return fields.filter(i => self.checkSupportCopy(i));
		});

		self.supportCopyFrom = ko.computed(() => !!self.sourceFields().length);
		self.targetField.subscribe(function()
		{
			var selectedField = self.targetField();
			if (selectedField && selectedField.editType && selectedField.editType.allowInput !== undefined)
			{
				self.inputEnable(typeof selectedField.editType.allowInput == "function" ? selectedField.editType.allowInput() : selectedField.editType.allowInput);
			}

			if (selectedField && selectedField.field != self.lastSelectedField)
			{
				self.lastSelectedField = selectedField.field;
				self.destroyValidator();
				self.updateNewValue().then(function(result)
				{
					const validators = selectedField.editType.validators || {};

					if (selectedField.editType.maxLength)
					{
						self.obMaxLength(selectedField.editType.maxLength.toString());
					}

					if (result.item)
					{
						let data = result.item.slice();
						data.sort((a, b) =>
						{
							if (a.text < b.text) return -1;
							if (a.text > b.text) return 1;
							return 0;
						});
						self.obSelectDataList(data);
					}

					if (result.type)
					{
						self.obSelectType(result.type);

						if (result.type === "Number")
						{
							if (result.format != "Money")
							{
								self.updateNumberformtValidation(result.format);
							}
						}

						if (result.type === "DateTime")
						{
							self.obNewValue(moment().format("MM/DD/YYYY hh:mm A"));
						}
						if (result.type === "Date")
						{
							self.obNewValue(moment().format("MM/DD/YYYY"));
						}
					}

					if (result.title)
					{
						self.obTitle(result.title);
					}

					self.updateValidator(result.type, result.format, validators);
				});
			}

			if (!self.supportCopyFrom())
			{
				self.copyFrom(false);
				self.sourceFieldName(null);
			}
			else
			{
				let sourceField = self.sourceFieldName();
				if (sourceField && !self.sourceFields().some(i => i.field == sourceField))
				{
					self.sourceFieldName(null);
				}
			}
		});

		self.sourceField = ko.computed(() => this.sourceFields().find(i => i.field === this.sourceFieldName()));
	}

	GlobalReplaceSettingsViewModel.prototype.checkSupportCopy = function(from, to)
	{
		to = to || this.targetField();
		if (!to || to.field == from.field)
		{
			return false;
		}

		if (to.type != from.type && to.type != "String")
		{
			return false;
		}

		if (to.editType && (to.editType.format == "DropDown" || to.editType.format == "ListMover"))
		{
			if (to.foreignTable && to.foreignTable == from.foreignTable && to.foreignTableKey == from.foreignTableKey)
			{
				return true;
			}

			return false;
		}

		if (from.editType && (from.editType.format == "DropDown" || from.editType.format == "ListMover") && from.editType.entityKey)
		{
			return false;
		}

		return true;
	};

	GlobalReplaceSettingsViewModel.prototype.createItemTypes = function(items)
	{
		let types = {};
		items.forEach(i =>
		{
			var fieldType = i.type;
			let type = types[fieldType] || [];
			types[fieldType] = type;
			type.push(i);
		});

		return types;
	};

	GlobalReplaceSettingsViewModel.prototype.customInputInit = function(element)
	{
		var self = this;
		self.targetField.subscribe(function(field)
		{
			var inputControl = ko.utils.domData.get(this, "input");
			if (inputControl)
			{
				var maxLength = field && field.editType && field.editType.maxLength ? field.editType.maxLength : "50";
				inputControl.$element.attr("maxLength", maxLength);
			}
		}.bind(element));
	}

	GlobalReplaceSettingsViewModel.prototype.destroyValidator = function()
	{
		var self = this;
		if (self.$container && self.$container.data("bootstrapValidator"))
		{
			self.$container.data("bootstrapValidator").destroy()
		}
		$('.mass-update-value').find(".enableHotkey").off("keyup.numbermass");
	};

	GlobalReplaceSettingsViewModel.prototype.updateValidator = function(type, format, validators) 
	{
		var self = this, validatorFields = null;
		if ("String" == type || "Phone" == type || "Email" == type || "Date" == type || "Time" == type || "Number" == type || "DateTime" == type || "DataList" == type)
		{
			validatorFields = self.generateValidatorFields(type, format, validators);
			if (validatorFields)
			{
				if (!self.$container)
				{
					self.$container = $('.mass-update-value');
				}

				self.$container.bootstrapValidator({
					excluded: [":disabled"],
					live: 'enabled',
					message: 'This value is not valid',
					fields: validatorFields
				});
			}
		}
	};

	GlobalReplaceSettingsViewModel.prototype.generateValidatorFields = function(type, format, defaultValidators)
	{
		const self = this;
		const valueValidators = defaultValidators || {};
		const validator = {
			sourceField: {
				trigger: "blur change",
				validators: { notEmpty: { message: 'required' } }
			},
		};

		if (self.obIsValueRequired())
		{
			valueValidators["notEmpty"] = { message: 'required' }
		}

		if ("String" === type && self.obIsValueRequired())
		{
			valueValidators["stringLength"] = {
				max: self.obMaxLength() ? self.obMaxLength() : 200,
				message: 'The input should be less than' + self.obMaxLength() ? self.obMaxLength() : 200 + 'characters',
				specialInputSupport: true
			};
		}
		else if ("Phone" === type)
		{
			valueValidators["phoneinplus"] = {
				message: 'The input is not a valid phone number',
				country: tfRegion,
				specialInputSupport: true
			};
		}
		else if ("Date" === type)
		{
			valueValidators["date"] = {
				format: 'MM/DD/YYYY',
				message: 'The input is not a valid date(MM/DD/YYYY)',
				specialInputSupport: true
			};
		}
		else if ("DateTime" === type)
		{
			valueValidators["date"] = {
				format: 'MM/DD/YYYY hh:mm A',
				message: 'The input is not a valid datetime(MM/DD/YYYY hh:mm A)',
				specialInputSupport: true
			};
		}
		else if ("Time" === type)
		{
			valueValidators["callback"] = {
				message: 'The input is not a time(hh:mm A)',
				callback: function(value, validator)
				{
					var m = new moment(value, 'h:mm A', true);
					return m.isValid();
				}
			};
		}
		else if ("Number" === type)
		{
			if (format == "Money")
			{
				return null;
			}

			valueValidators["numeric"] = {
				message: 'The input is not a valid number',
				specialInputSupport: true,
			}
		}
		else if ("Email" === type)
		{
			valueValidators["emailAddress"] = {
				message: 'The input is not a valid email address',
				specialInputSupport: true
			}
		}

		if ("DataList" === type && self.obIsValueRequired())
		{
			valueValidators["callback"] = {
				message: 'The input is not a valid value',
				callback: v => v === "" || self.obSelectDataList().some(i => i.text == v)
			}
		}


		// initialize validators for value field
		validator[type] = {
			trigger: "blur change",
			validators: valueValidators,
		};

		return validator;
	};

	GlobalReplaceSettingsViewModel.prototype.updateNewValue = function()
	{
		var self = this, selectedField = self.targetField(),
			editType = selectedField.editType,
			type = editType.format;

		self.obNewValue("");
		self.obSelectDataList([]);
		self.obSelectType("String");
		self.obIsValueRequired(false);
		if (editType.validators && editType.validators.notEmpty)
		{
			self.obIsValueRequired(true);
		}

		if (type === "BooleanDropDown")
		{
			type = "DataList";
			if (!selectedField.UDFType)
			{
				self.obIsValueRequired(true);
			}
			var dataList = self.getBooleanDataList(selectedField);
			return Promise.resolve({ type: type, item: dataList });
		}

		if (type === "DropDown")
		{
			type = "DataList";
			return editType.getSource().then(function(item)
			{
				if (editType.allowNullValue)
				{
					let isGender = (self.gridType === 'student' || self.gridType === 'staff') && editType.entityKey === 'GenderId';
					if (!isGender)
					{
						item = item.filter(x => !!x.text && !!x.value);
					}
					//For Trip.DriverId null and '' has different meanings.
					if (self.gridType === 'trip' && editType.entityKey === 'DriverId' || isGender)
					{
						item.unshift({ text: "(none)", value: null })
					}
					else
					{
						item.unshift({ text: "(none)", value: "" })
					}
				}
				return Promise.resolve({ type: type, item: item });
			})
		}

		if (type === "Note")
		{
			type = "String";
			return Promise.resolve({ type: type });
		}

		if (type === "Phone")
		{
			self.obMaxLength("18");
			return Promise.resolve({ type: type });
		}

		if (type === "Fax")
		{
			type = "Phone"
			self.obMaxLength("18");
			return Promise.resolve({ type: type });
		}

		if (type === "ListMover")
		{
			return editType.getSource().then(function(item)
			{
				return Promise.resolve({ type: type, item: item, title: selectedField.title });
			})
		}

		if (type === "TextGrid")
		{
			return Promise.all([
				editType.getSource(),
				typeof editType.columns === "function" ? editType.columns() : editType.columns
			]).then(function([item, columns])
			{
				self.gridOption = {
					columns,
					getRequiredField: editType && editType.getRequiredField
				};

				return { ...editType, type: "Grid", item: item, title: selectedField.title, columns };
			});
		}

		return Promise.resolve({ type: type, format: selectedField.format });
	};

	GlobalReplaceSettingsViewModel.prototype.updateNumberformtValidation = function(format)
	{
		var self = this, $container = $('.mass-update-value');
		$container.find(".enableHotkey").attr("numberFormat", format);
		$container.find(".enableHotkey").off("keyup.numbermass").on("keyup.numbermass", (e) =>
		{
			const $massValueInput = $(e.currentTarget);
			var value = $massValueInput.val(),
				floatValue = parseFloat(value),
				decimalPlaces = null,
				index = value.indexOf('.');
			if (format)
			{
				const formatArray = format.split('.');
				if (formatArray.length > 1)
				{
					decimalPlaces = formatArray[1].length;
				}
			}

			if (isNaN(Number(value)))
			{
				$massValueInput.val("");
				return;
			}

			if (decimalPlaces == null || index === -1) return;

			// cut the float with decimal places.
			if (index === 0) return;
			var count = value.length - index - 1;
			if (count > decimalPlaces)
			{
				const kappa = Math.pow(10, decimalPlaces);
				floorValue = Math.floor(floatValue * kappa) / kappa
				$massValueInput.val(floorValue.toFixed(decimalPlaces));
				self.obNewValue(floorValue.toFixed(decimalPlaces));
			}
			if (value.length - index - 1 > decimalPlaces)
			{
				$massValueInput.val(floorValue.toFixed(decimalPlaces));
				self.obNewValue(floorValue.toFixed(decimalPlaces));
			}
		});
	};

	GlobalReplaceSettingsViewModel.prototype.getBooleanDataList = function(selectedField)
	{
		var booleanDataList = [];
		booleanDataList.push({ text: " ", value: null });
		if (selectedField.positiveLabel)
		{
			booleanDataList.push({ text: selectedField.positiveLabel, value: true });
		}

		if (selectedField.negativeLabel)
		{
			booleanDataList.push({ text: selectedField.negativeLabel, value: false });
		}

		return booleanDataList;
	};

	GlobalReplaceSettingsViewModel.prototype.apply = function()
	{
		var field = this.targetField();
		if (this.obReplaceType() == "Extended" && !this.obSelectedExtended())
		{
			tf.promiseBootbox.alert("Extended is a required field, please select a valid value.");
			return false;
		}

		if (this.obReplaceType() == "Extended" && this.obSelectedExtended() == "Update All Default Requirements to None" && !this.obSelectedNoTransportationType())
		{
			tf.promiseBootbox.alert("No Transportation Type is a required field, please select a valid value.");
			return false;
		}

		if (this.obReplaceType() == "Standard" && !field)
		{
			tf.promiseBootbox.alert("You must select a field before apply.");
			return false;
		}

		let validator = this.$container && this.$container.data("bootstrapValidator");
		if (this.obReplaceType() == "Standard" && validator)
		{
			validator.validate();
			if (!validator.isValid())
			{
				if (!this.copyFrom() && this.obIsValueRequired())
				{
					tf.promiseBootbox.alert("This is a required field, You must select or input a valid value.");
					return false;
				}

				if (this.copyFrom() && !this.sourceFieldName())
				{
					tf.promiseBootbox.alert("You must select a New Value field.");
					return false;
				}

				tf.promiseBootbox.alert("You must input a valid value.");
				return false;
			}
		}

		var relationshipKey,
			fieldName = "",
			newValue = this.getNewValue(),
			targetUdf,
			sourceUdf,
			sourceField;
		if (field)
		{
			relationshipKey = field.editType.relationshipKey;
			fieldName = field.editType.entityKey ? field.editType.entityKey : field.field;

			if (field.UDFId)
			{
				if (this.copyFrom())
				{
					fieldName = null;
					targetUdf = field.UDFId;
				}
				else
				{
					relationshipKey = "UDF";
					fieldName = "UserDefinedFields";
				}
			}
		}

		if (this.copyFrom())
		{
			let src = this.sourceField();
			if (src.UDFId)
			{
				sourceUdf = src.UDFId;
			} else
			{
				sourceField = src.editType.entityKey ? src.editType.entityKey : src.field;
			}
		}

		return {
			targetField: fieldName,
			targetUdfId: targetUdf,
			sourceField: sourceField,
			sourceUdfId: sourceUdf,
			newValue: newValue,
			editType: field && field.editType,
			format: field ? field.format : null,
			specifyRecords: this.obSelectedSpecifyRecords(),
			replaceType: this.obReplaceType(),
			extended: this.obSelectedExtended(),
			type: field ? field.type : null,
			relationshipKey: relationshipKey,
			noTransportationId: this.obSelectedNoTransportationType(),
		};
	};

	GlobalReplaceSettingsViewModel.prototype.getNewValue = function()
	{
		if (this.copyFrom())
		{
			return null;
		}

		let self = this,
			newValue = self.obNewValue(),
			field = self.targetField(),
			selectPickListOptionIDs;

		if (field && field.UDFId && field.UDFType == "List")
		{
			selectPickListOptionIDs = [];
			newValue.split(",").forEach(function(value)
			{
				if (value != null)
				{
					value = value.trim();
				}

				var valueItem = self.obSelectDataList().find(function(item)
				{
					return item.text == value;
				});

				if (valueItem && valueItem.value)
				{
					selectPickListOptionIDs.push(valueItem.value);
				}
			});
		}
		else
		{
			switch (self.obSelectType())
			{
				case "DataList":
					var found = false;
					self.obSelectDataList().every(function(data)
					{
						if (data.text == self.obNewValue())
						{
							newValue = data.value;
							found = true;
							return false;
						}

						return true;
					});

					if (!self.inputEnable() && !found)
					{
						newValue = null;
					}
					break;
				case "Time":
					newValue = ["", null].includes(self.obNewValue()) ? "" : moment(self.obNewValue()).format('HH:mm');
					break;
				case "ListMover":
					newValue = self.obSelectDataList().map(function(item)
					{
						var result = null;
						self.obNewValue().split(",").forEach(function(value)
						{
							if (item.text == value.trim()) result = item.value;
						})
						return result;
						// allow 0 specifically for generic staff type whose id is 0.
					}).filter(d => Boolean(d) || d === 0).toString();
					break;
				default:
					newValue = self.obNewValue();
					if (field && field.UnitOfMeasureSupported && tf.measurementUnitConverter.isNeedConversion(field.UnitInDatabase))
					{
						newValue = tf.measurementUnitConverter.convert({
							originalUnit: tf.measurementUnitConverter.getCurrentUnitOfMeasure(),
							targetUnit: field.UnitInDatabase || tf.measurementUnitConverter.MeasurementUnitEnum.Metric,
							isReverse: !!field.UnitOfMeasureReverse,
							precision: 5,
							value: newValue,
							unitType: field.UnitTypeOfMeasureSupported
						});
					}
					break;
			}
		}

		if (field && field.UDFId)
		{
			newValue = [{
				TypeId: field.UDFTypeId,
				Id: field.UDFId,
				RecordValue: newValue === "" ? null : newValue,
				DataTypeId: tf.dataTypeHelper.getId(self.gridType),
				SelectPickListOptionIDs: selectPickListOptionIDs
			}];
		}

		return newValue;
	};

	GlobalReplaceSettingsViewModel.prototype.getFields = function()
	{
		let self = this;

		return tf.dataPointHelper.updateDataPointUDF(self.gridType).then(function()
		{
			let categories, key,
				dataPointObj = $.extend({}, dataPointsJSON[self.gridType] || {}),
				fieldSources = [],
				ignoreList = {
					"school": ["schoolcode"],
					"tripstop": ["sequence", "tripname"],
					"district": ["idstring"],
					"trip": ["name", "schools", "triptypename"],
					"fieldtrip": ["DeptActivity", "destination", "billingclassificationname"],
					"vehicle": ["vehiclename"],
					"route": ["name", "names"]
				},
				requiredFields = tf.helpers.detailViewHelper.requiredFields[self.gridType] && tf.helpers.detailViewHelper.requiredFields[self.gridType].map(function(item) { return item.name }),
				filter = function(item)
				{
					if (item.editType && tf.helpers.detailViewHelper.editableThroughEditType(item.editType)
						&& (ignoreList[self.gridType] == null || (ignoreList[self.gridType] && ignoreList[self.gridType].indexOf(item.field.toLowerCase()) === -1)))
					{
						var fieldName = item.editType.entityKey || item.field;
						if (requiredFields && requiredFields.indexOf(fieldName) > -1)
						{
							item.editType.validators = item.editType.validators || {};
							item.editType.validators["notEmpty"] = { message: 'required' };
						}
						else if (item.editType.validators)
						{
							delete item.editType.validators["notEmpty"];
						}

						return true;
					}

					return false;
				};

			categories = Object.keys(dataPointObj);
			for (var i = 0, len = categories.length; i < len; i++)
			{
				key = categories[i];
				if (key == "User Defined") continue;
				fieldSources = fieldSources.concat(dataPointObj[key].filter(filter));
			}

			fieldSources.forEach(i => i.type = i.type == "Note" ? "String" : i.type);

			return tf.UDFDefinition.udfHelper.get(self.gridType).then(function(items)
			{
				var definition = tf.UDFDefinition.get(self.gridType) || {},
					allFields = definition.userDefinedFields || [],
					validFields = allFields.filter(function(f) { return f.UDFDataSources.some(function(d) { return d.DBID === tf.datasourceManager.databaseId }) }).map(function(f) { return f.OriginalName });
				items = (items || []).filter(function(i) { return validFields.indexOf(i.field) > -1 });
				fieldSources = fieldSources.concat(items.filter(filter));
				fieldSources = Array.sortBy(fieldSources, "title");
				return fieldSources;
			});
		})
	};
})(); 
