
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
		self.obStandardDisable = ko.observable(false);
		self.obExtendedsDisable = ko.observable(true);
		self.obReplaceTypeDisable = ko.observable(gridType != "student");
		self.obReplaceType.subscribe(function()
		{
			self.obStandardDisable(self.obReplaceType() == "Extended");
			self.obExtendedsDisable(self.obReplaceType() == "Standard" || self.obReplaceTypeDisable());
		});

		self.obExtendeds = ko.observableArray(["Remove all Additional Requirements"]);
		self.obSelectedExtended = ko.observable("");

		self.obSelectedSpecifyRecords = ko.observable(self.obSpecifyRecords()[0].value);
		self.obSelectedField = ko.observable("");
		self.obSelectedFieldTitle = ko.observable("");
		self.obNewValue = ko.observable("");
		self.obSelectType = ko.observable("Disabled");
		self.lastSelectedField = "";
		self.fieldtripConfigs = {};
		self.obSelectedField.subscribe(function()
		{
			var selectedField = self.obSelectedField();
			if (selectedField && selectedField.field != self.lastSelectedField)
			{
				self.lastSelectedField = selectedField.field;
				self.destroyValidator();
				self.updateNewValue().then(function(result)
				{
					if (selectedField.editType.maxLength)
					{
						self.obMaxLength(selectedField.editType.maxLength.toString());
					}

					if (result.item)
					{
						self.obSelectDataList(result.item);
					}

					if (result.type)
					{
						self.obSelectType(result.type);
					}

					if (result.title)
					{
						self.obTitle(result.title);
					}

					self.updateValidator(result.type, result.format, result.field);
				});
			}
		});
		self.obSelectDataList = ko.observableArray();
		self.obTitle = ko.observable("");
		self.obMaxLength = ko.observable("50");
		self.obFieldSources = ko.observableArray([]);
		self.getCurrentFieldSources().then(function(items)
		{
			self.obFieldSources(items);
		});
		self.obIsValueRequired = ko.observable(false);
		self.$continer = null;
	}

	GlobalReplaceSettingsViewModel.prototype.destroyValidator = function()
	{
		var self = this;
		if (self.$continer && self.$continer.data("bootstrapValidator"))
		{
			self.$continer.data("bootstrapValidator").destroy()
		}
	};

	GlobalReplaceSettingsViewModel.prototype.updateValidator = function(type, format, field)
	{
		var self = this, validatorFields = null;
		if ("String" === type || "DataList" === type || "Phone" === type || "Email" === type || "Date" === type || "Time" === type || "Zip" === type || "Number" === type || "DateTime" === type)
		{
			validatorFields = self.generateValidatorFields(type, format)
			if (field === "DepartDateTime")
			{
				validatorFields.DateTime.validators.callback = {
					callback: function(value, validator)
					{
						if (value != "")
						{
							var message1 = this.checkDeadline(value);
							var m = new moment(value, 'h:m A', true);
							var message2 = this.checkBlockTimes(m);
							if (message1)
							{
								return { message: message2 ? (message1 + "\n" + ("Depart Time " + message2)) : message1, valid: false };
							}
							else
							{
								return message2 ? { message: "Depart Time " + message2, valid: false } : true;
							}
						}
						return true;
					}.bind(this)
				};
			}
			else if (field === "EstimatedReturnDateTime")
			{
				validatorFields.DateTime.validators.callback = {
					callback: function(value, validator)
					{
						if (value != "")
						{
							var m = new moment(value, 'h:m A', true);
							var message = this.checkBlockTimes(m);
							return message ? { message: "Return Time " + message, valid: false } : true;
						}
						return true;
					}.bind(this)
				};
			}

			if (validatorFields)
			{
				if (!self.$continer) self.$continer = $('.mass-update-value');
				self.$continer.bootstrapValidator({
					excluded: [],
					live: 'enabled',
					message: 'This value is not valid',
					fields: validatorFields
				})
			}
		}
	};

	GlobalReplaceSettingsViewModel.prototype.checkBlockTimes = function(time)
	{
		var self = this, settings = self.fieldtripConfigs, blockOutTimes = settings.BlockOutTimes || [],
			timeM = time.year(2000).month(0).date(1), begin, end, message;

		if (blockOutTimes.length === 0)
		{
			return null;
		}

		$.each(blockOutTimes, function(index, blockOutTime)
		{
			begin = moment("2000-1-1 " + blockOutTime.BeginTime);
			end = moment("2000-1-1 " + blockOutTime.EndTime);
			if ((timeM.isSame(begin) || timeM.isAfter(begin)) && (timeM.isSame(end) || timeM.isBefore(end)))
			{
				message = " is invalid because of the blackout period of " + begin.format("hh:mm A") + " and " + end.format("hh:mm A") + ".";
				return false;
			}
		});

		return message;
	};

	GlobalReplaceSettingsViewModel.prototype.isHoliday = function(date)
	{
		var result = false, self = this, settings = self.fieldtripConfigs, holidays = settings.Holidays || [];
		$.each(holidays, function(index, holiday)
		{
			var holidayM = moment(new Date(holiday));
			if (holidayM.diff(date.startOf("day"), "days") === 0 && holidayM.diff(date, "months") === 0 && holidayM.diff(date, "years") === 0)
			{
				result = true;
				return false;
			}
		});
		return result;
	};

	GlobalReplaceSettingsViewModel.prototype.checkDeadline = function(departDate)
	{
		if (!departDate)
		{
			return null;
		}

		var self = this, settings = self.fieldtripConfigs, nonWorkdays = [6, 0],
			deadlineDays = settings.ScheduleDaysInAdvance || 0, departDate = new moment(departDate),
			deadlineDate = new moment(), message;

		while (deadlineDays > 0)
		{
			if (nonWorkdays.indexOf(deadlineDate.day()) < 0 && !self.isHoliday(deadlineDate))
			{
				deadlineDays--;
			}
			deadlineDate = deadlineDate.add(1, 'day');
		}

		if (deadlineDate.diff(departDate, 'days') > 0)
		{
			message = "Depart Date must be on or after " + deadlineDate.format("M/D/YYYY");
		}
		else
		{
			if (self.isHoliday(departDate))
			{
				message = "Depart Date falls on a holiday. " + departDate.format("M/D/YYYY") + ".";
			}
		}

		return message;
	};

	GlobalReplaceSettingsViewModel.prototype.generateValidatorFields = function(type, format)
	{
		var self = this, result = {}, validators;
		switch (type)
		{
			case "String":
				validators = {
					stringLength: {
						max: self.obMaxLength() ? self.obMaxLength() : 200,
						message: 'The input should be less than' + self.obMaxLength() ? self.obMaxLength() : 200 + 'characters'
					}
				};
				break;
			case "Phone":
				validators = {
					phoneinplus: {
						message: 'The input is not a valid phone number',
						country: tfRegion
					}
				};
				break;
			case "Date":
				validators = {
					date: {
						format: 'MM/DD/YYYY',
						message: 'The input is not a valid date(MM/DD/YYYY)'
					}
				};
				break;
			case "DateTime":
				validators = {
					date: {
						format: 'MM/DD/YYYY hh:mm A',
						message: 'The input is not a valid datetime(MM/DD/YYYY hh:mm A)'
					}
				};
				break;
			case "Time":
				validators = {
					callback: {
						message: 'The input is not a time(hh:mm A)',
						callback: function(value, validator)
						{
							if (value === "")
							{
								return true;
							}
							var m = new moment(value, 'h:mm A', true);
							return m.isValid();
						}
					}
				};
				break;
			case "Number":
				validators = {
					numeric: {
						message: 'The input is not a valid number'
					}
				};
				break;
			case "Zip":
				validators = {
					integer: {
						message: 'The input is not a valid zip'
					}
				};
				break;
			case "Email":
				validators = {
					emailAddress: {
						message: 'The input is not a valid email address'
					}
				};
				break;
			case "DataList":
				validators = {};
				break;
			default:
				return null;
		}

		if (self.obIsValueRequired())
		{
			validators["notEmpty"] =
			{
				message: 'required'
			};
		}
		result[type] = { trigger: "blur change", validators: validators };
		return result;
	};

	GlobalReplaceSettingsViewModel.prototype.updateNewValue = function()
	{
		var self = this, selectedField = self.obSelectedField(), editType = selectedField.editType, type = editType.format;
		self.obNewValue("");
		self.obSelectDataList([]);
		self.obSelectType("Disabled");
		self.obIsValueRequired(false);
		if (editType.validators && editType.validators.notEmpty)
		{
			self.obIsValueRequired(true);
		}

		if (type == "BooleanDropDown")
		{
			type = "DataList";
			self.obIsValueRequired(true);
			var dataList = self.getBooleanDataList(selectedField);
			return Promise.resolve({ type: type, item: dataList });
		}

		if (type == "DropDown")
		{
			type = "DataList";
			return editType.getSource().then(function(item)
			{
				if (editType.allowNullValue)
				{
					item.unshift({ text: "(none)", value: "" })
				}
				return Promise.resolve({ type: type, item: item });
			})
		}

		if (type == "Note")
		{
			type = "String";
			return Promise.resolve({ type: type });
		}

		if (type == "Phone")
		{
			self.obMaxLength("14");
			return Promise.resolve({ type: type });
		}

		if (type == "Fax")
		{
			type = "Phone"
			self.obMaxLength("14");
			return Promise.resolve({ type: type });
		}

		if (type == "ListMover")
		{
			return editType.getSource().then(function(item)
			{
				return Promise.resolve({ type: type, item: item, title: self.obSelectedField().title });
			})
		}

		return Promise.resolve({ type: type, format: selectedField.format, field: selectedField.field });
	};

	GlobalReplaceSettingsViewModel.prototype.getBooleanDataList = function(selectedField)
	{
		var booleanDataList = [];
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
		if (this.$continer && this.$continer.data("bootstrapValidator"))
		{
			this.$continer.data("bootstrapValidator").validate();
		}
		var field = this.obSelectedField();
		if (this.obReplaceType() == "Extended" && this.obExtendeds().indexOf(this.obSelectedExtended()) < 0)
		{
			tf.promiseBootbox.alert("You must select an extended global replacement to use.");
			return false;
		}

		if (this.obReplaceType() == "Standard" && (field === "" || field === null))
		{
			tf.promiseBootbox.alert("You must select a field before apply.");
			return false;
		}

		if (this.obReplaceType() == "Standard" && this.$continer && this.$continer.data("bootstrapValidator") && !this.$continer.data("bootstrapValidator").isValid())
		{
			if (this.obIsValueRequired())
			{
				tf.promiseBootbox.alert("This is a required field, You must select or input a new value.");
			}
			else
			{
				tf.promiseBootbox.alert("You must input a valid value.");
			}

			return false;
		}

		var relationshipKey, fieldName = "", newValue = this.getNewValue();
		if (field)
		{
			if (!field.UDFId)
			{
				relationshipKey = field.editType.relationshipKey;
				fieldName = field.editType.entityKey ? field.editType.entityKey : field.field;
			}
			else
			{
				relationshipKey = "UDF";
				fieldName = "UserDefinedFields";
			}
		}

		return {
			field: fieldName,
			newValue: newValue,
			relationshipKey: relationshipKey,
			specifyRecords: this.obSelectedSpecifyRecords(),
			replaceType: this.obReplaceType(),
			extended: this.obExtendeds().indexOf(this.obSelectedExtended()),
		};
	};

	GlobalReplaceSettingsViewModel.prototype.getNewValue = function()
	{
		var self = this, newValue = "", field = self.obSelectedField(), selectPickListOptionIDs;
		if (field.UDFId && field.UDFType == "List")
		{
			newValue = self.obNewValue();
			selectPickListOptionIDs = [];
			newValue.split(",").forEach(function(value)
			{
				var valueItem = self.obSelectDataList().find(function(item)
				{
					return item.text == value;
				});

				if (valueItem)
				{
					selectPickListOptionIDs.push(valueItem.value);
				}
			});
		}
		else if (self.obSelectType() != "DataList")
		{
			if (self.obSelectType() == "Time")
			{
				newValue = moment(self.obNewValue()).format('HH:mm');
			}
			else
			{
				if (self.obSelectType() == "ListMover")
				{
					newValue = self.obSelectDataList().map(function(item)
					{
						var result = null;
						self.obNewValue().split(",").forEach(function(value)
						{
							if (item.text == value.trim()) result = item.value;
						})
						return result;
					}).filter(Boolean).toString()
				}
				else
				{
					newValue = self.obNewValue();
				}
			}
		}
		else
		{
			self.obSelectDataList().forEach(function(data)
			{
				if (data.text == self.obNewValue())
				{
					newValue = data.value;
					return false;
				}
			});
		}

		if (field.UDFId)
		{
			newValue = [{
				TypeId: field.UDFTypeId,
				Id: field.UDFId,
				RecordValue: newValue,
				DataTypeId: tf.dataTypeHelper.getId(self.gridType),
				SelectPickListOptionIDs: selectPickListOptionIDs
			}];
		}

		return newValue;
	};

	GlobalReplaceSettingsViewModel.prototype.hasPermissionForDistrictDepartment = function(id)
	{
		var departmentIdsWithPermission = tf.authManager.authorizationInfo.authorizationTree.districtDepartmentIds;

		if (tf.authManager.authorizationInfo.isAdmin || tf.authManager.authorizationInfo.isFieldTripAdmin)
		{
			return true;
		}

		if (this.currentDistrictDepartmentId && id === this.currentDistrictDepartmentId)
		{
			return true;
		}

		return departmentIdsWithPermission.indexOf(id) >= 0;
	};

	GlobalReplaceSettingsViewModel.prototype.getAllFields = function()
	{
		var self = this;
		return {
			"Main": [
				{
					"field": "SchoolNameWithCode",
					"title": "School",
					"type": "String",
					"editType": {
						"format": "DropDown",
						"getSource": function()
						{
							return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "schools?@fields=SchoolCodeWithName,SchoolCode")).then(function(result)
							{
								var schools = result.Items.map(function(item)
								{
									return {
										'text': item["SchoolCodeWithName"],
										'value': item["SchoolCode"]
									};
								});

								if (tf.authManager.authorizationInfo.isAdmin)
								{
									return schools;
								}
								else
								{
									return Enumerable.From(schools).Where(function(school)
									{
										return tf.authManager.authorizationInfo.authorizationTree.schools.indexOf(school.value) >= 0;
									}).ToArray();
								}
							});
						},
						"allowNullValue": true,
						"entityKey": "School"
					}
				},
				{
					"field": "DistrictDepartmentName",
					"title": "Department",
					"type": "String",
					"editType": {
						"format": "DropDown",
						"getSource": function()
						{
							return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "districtdepartments?@fields=Id,Name")).then(function(result)
							{
								var districtdepartments = result.Items.map(function(item)
								{
									return {
										'text': item["Name"],
										'value': item["Id"]
									};
								});

								return $.grep(districtdepartments, function(item, index)
								{
									var departmentIdsWithPermission = tf.authManager.authorizationInfo.authorizationTree.districtDepartmentIds;
									if (tf.authManager.authorizationInfo.isAdmin || tf.authManager.authorizationInfo.isFieldTripAdmin)
									{
										return true;
									}

									if (this.currentDistrictDepartmentId && item.value === this.currentDistrictDepartmentId)
									{
										return true;
									}
									return departmentIdsWithPermission.indexOf(item.value) >= 0;
								});
							});
						},
						"allowNullValue": true,
						"entityKey": "DistrictDepartmentId"
					}
				},
				{
					"field": "FieldTripActivityName",
					"title": "Activity",
					"type": "String",
					"editType": {
						"format": "DropDown",
						"getSource": function()
						{
							return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "fieldtripactivities?@fields=Id,Name")).then(function(result)
							{
								return result.Items.map(function(item)
								{
									return {
										'text': item["Name"],
										'value': item["Id"]
									};
								});
							});
						},
						"allowNullValue": true,
						"entityKey": "FieldTripActivityId"
					}
				},
				{
					"field": "FieldTripContact",
					"title": "Contact",
					"type": "String",
					"editType": {
						"format": "String",
						"maxLength": 200
					}
				},
				{
					"field": "ContactPhone",
					"title": "Phone",
					"type": "String",
					"editType": {
						"format": "Phone",
						"maxLength": 30
					}
				},
				{
					"field": "ContactPhoneExt",
					"title": "Ext",
					"type": "String",
					"editType": {
						"format": "PhoneExt",
						"maxLength": 5
					}
				},
				{
					"field": "ContactEmail",
					"title": "Email",
					"type": "String",
					"editType": {
						"format": "Email",
						"maxLength": 100
					}
				},
				{
					"field": "NumberOfStudents",
					"title": "#Students",
					"type": "Number",
					"editType": {
						"format": "Integer",
						"maxLength": 8
					}
				},
				{
					"field": "NumberOfAdults",
					"title": "#Adults",
					"type": "Number",
					"editType": {
						"format": "Integer",
						"maxLength": 8
					}
				},
				{
					"field": "NumberOfWheelChairs",
					"title": "#Wheel Chairs",
					"type": "Number",
					"editType": {
						"format": "Integer",
						"maxLength": 8
					}
				},
				{
					"field": "NumberOfVehicles",
					"title": "#Vehicles",
					"type": "Number",
					"editType": {
						"format": "Integer",
						"maxLength": 8
					}
				},
				{
					"field": "EstimatedMiles",
					"title": "Estimated Miles",
					"type": "Number",
					"editType": {
						"format": "Number",
						"maxLength": 8
					}
				},
				{
					"field": "EstimatedHours",
					"title": "Estimated Hours",
					"type": "Number",
					"editType": {
						"format": "Number",
						"maxLength": 8
					}
				},
				{
					"field": "EstimatedCost",
					"title": "Estimated Cost($)",
					"type": "Number",
					"editType": {
						"format": "Number",
						"maxLength": 8
					}
				}
			],
			"Destination": [
				{
					"field": "DepartDateTime",
					"title": "Depart Date/Time",
					"type": "Date/Time",
					"editType": {
						"format": "DateTime"
					}
				},
				{
					"field": "EstimatedReturnDateTime",
					"title": "Return Date/Time",
					"type": "Date/Time",
					"editType": {
						"format": "DateTime"
					}
				},
				{
					"field": "DepartureSchoolNameWithCode",
					"title": "Departure",
					"type": "String",
					"editType": {
						"format": "DropDown",
						"getSource": function()
						{
							return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "schools?@fields=SchoolCodeWithName,SchoolCode")).then(function(result)
							{
								return result.Items.map(function(item)
								{
									return {
										'text': item["SchoolCodeWithName"],
										'value': item["SchoolCode"]
									};
								});
							});
						},
						"allowNullValue": true,
						"entityKey": "DepartFromSchool"
					}
				},
				{
					"field": "DepartureNotes",
					"title": "Departure Notes",
					"type": "String",
					"editType": {
						"format": "Note",
						"maxLength": 2000
					}
				},
				{
					"field": "Destination",
					"title": "Destination",
					"type": "String",
					"editType": {
						"format": self.fieldtripConfigs && self.fieldtripConfigs['StrictDest'] ? "DropDown" : "String",
						"maxLength": 200,
						"getSource": function()
						{
							return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "FieldTripDestinations")).then(function(result)
							{
								return result.Items.map(function(item)
								{
									item['text'] = item['Name'];
									item['value'] = item['Name'];
									return item;
								});
							});
						},
						"textField": "Name",
						"valueField": "Name",
						"entityKey": "Destination",
						"allowInput": function()
						{
							var strictDest = self.fieldtripConfigs && self.fieldtripConfigs['StrictDest'];
							return !strictDest;
						},
					}
				},
				{
					"field": "DestinationStreet",
					"title": "Destination Street",
					"type": "String",
					"editType": {
						"format": "String",
						"maxLength": 200
					}
				},
				{
					"field": "DestinationCity",
					"title": "Destination City",
					"type": "String",
					"editType": {
						"format": "String",
						"maxLength": 100
					}
				},
				{
					"field": "DestinationState",
					"title": "Destination State",
					"type": "String",
					"editType": {
						"format": "String",
						"maxLength": 2
					}
				},
				{
					"field": "DestinationZip",
					"title": "Destination Zip",
					"type": "Zip",
					"editType": {
						"format": "Integer",
						"maxLength": 5
					}
				},
				{
					"field": "DestinationContact",
					"title": "Destination Contact",
					"type": "String",
					"editType": {
						"format": "String",
						"maxLength": 200
					}
				},
				{
					"field": "DestinationContactTitle",
					"title": "Destination Title",
					"type": "String",
					"editType": {
						"format": "String",
						"maxLength": 100
					}
				},
				{
					"field": "DestinationPhoneExt",
					"title": "Destination Ext",
					"type": "String",
					"editType": {
						"format": "PhoneExt",
						"maxLength": 5
					}
				},
				{
					"field": "DestinationContactPhone",
					"title": "Destination Phone",
					"type": "String",
					"editType": {
						"format": "Phone",
						"maxLength": 30
					}
				},
				{
					"field": "DestinationFax",
					"title": "Destination Fax",
					"type": "String",
					"editType": {
						"format": "Fax",
						"maxLength": 30
					}
				},
				{
					"field": "DestinationEmail",
					"title": "Destination Email",
					"type": "String",
					"editType": {
						"format": "Email",
						"maxLength": 100
					}
				},
				{
					"field": "DestinationNotes",
					"title": "Destination Notes",
					"type": "String",
					"editType": {
						"format": "Note",
						"maxLength": 2000
					}
				},
				{
					"field": "DirectionNotes",
					"title": "Directions",
					"type": "String",
					"editType": {
						"format": "Note",
						"maxLength": 2000
					}
				}
			],
			"Billing": [
				{
					"field": "BillingNotes",
					"title": "Billing Notes",
					"type": "String",
					"editType": {
						"format": "Note",
						"maxLength": 200
					}
				}
			],
			"Miscellaneous": [
				{
					"field": "Notes",
					"title": "Notes",
					"type": "String",
					"editType": {
						"format": "Note",
						"maxLength": 2000
					}
				}
			]
		};
	};

	GlobalReplaceSettingsViewModel.prototype.getCurrentFieldSources = function()
	{
		var self = this,
			categories, key,
			dataPointObj = self.getAllFields(),
			fieldSources = [],
			requiredFields,
			filter = function(item)
			{
				if (item.editType)
				{
					var fieldName = item.editType.entityKey || item.field;
					if (requiredFields.indexOf(fieldName) > -1)
					{
						item.editType.validators = item.editType.validators || {};
						item.editType.validators["notEmpty"] = { message: 'required' };
						if (item.editType.allowNullValue !== undefined)
						{
							item.editType.allowNullValue = false;
						}
					}
					else if (item.editType.validators)
					{
						delete item.editType.validators["notEmpty"];
						if (item.editType.allowNullValue !== undefined)
						{
							item.editType.allowNullValue = true;
						}
					}

					return true;
				}

				return false;
			};

		var promises = [tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "RequiredFields")),
		tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "FieldTripConfigs")),
		tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "FieldTripHolidays")),
		tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "FieldTripBlockOuts"))];
		return Promise.all(promises).then(function(result)
		{
			requiredFields = result[0].Items.filter(function(item) { return item.DataTypeID === 4 && (item.SystemRequired || item.Required) }).map(function(item) { return item.FieldName });
			self.fieldtripConfigs = result[1].Items && result[1].Items.length > 0 ? result[1].Items[0] : {};
			self.fieldtripConfigs.Holidays = result[2].Items.map(function(item) { return item.Holiday; });
			self.fieldtripConfigs.BlockOutTimes = result[3].Items.map(function(item)
			{
				return {
					BeginTime: item.From,
					EndTime: item.To
				};
			});

			categories = Object.keys(dataPointObj);
			for (var i = 0, len = categories.length; i < len; i++)
			{
				key = categories[i];
				if (key == "User Defined") continue;
				fieldSources = fieldSources.concat(dataPointObj[key].filter(filter));
			}
			fieldSources = Array.sortBy(fieldSources, "title");
			return fieldSources;
		});
	};
})();