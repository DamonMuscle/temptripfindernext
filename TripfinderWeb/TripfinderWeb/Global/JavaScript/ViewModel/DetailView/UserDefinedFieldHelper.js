(function()
{
	createNamespace("TF.DetailView").UserDefinedFieldHelper = UserDefinedFieldHelper;

	function UserDefinedFieldHelper() { };

	UserDefinedFieldHelper.prototype.get = function(gridType)
	{
		if (tf.dataTypeHelper === undefined) return [];

		var self = this,
			url = pathCombine(tf.api.apiPrefixWithoutDatabase(), "userDefinedFields");
		return tf.promiseAjax.get(url, {
			paramData: {
				datatypeid: tf.dataTypeHelper.getAvailableDataTypes().find(function(x) { return x.key === gridType }).id,
				"@Relationships": "UDFPickListOptions,UDFDataSources,UDFType"
			}
		}).then(function(result)
		{
			return tf.UDFDefinition.init().then(function()
			{
				return self._getUserDefinedFields(result.Items);
			});
		}).catch(function(error)
		{
			console.error(error);
			return [];
		});
	};

	UserDefinedFieldHelper.prototype.getCurrentDBUDFs = function(gridType)
	{
		if (tf.dataTypeHelper === undefined) return [];

		var self = this,
			url = pathCombine(tf.api.apiPrefixWithoutDatabase(), "userDefinedFields");
		return tf.promiseAjax.get(url, {
			paramData: {
				datatypeid: tf.dataTypeHelper.getAvailableDataTypes().find(function(x) { return x.key === gridType }).id,
				"@Relationships": "UDFPickListOptions,UDFDataSources,UDFType"
			}
		}).then(function(result)
		{
			return result.Items.filter(i => i.UDFDataSources.some(d => d.DBID == tf.datasourceManager.databaseId));
		}).catch(function(error)
		{
			console.error(error);
			return [];
		});
	};

	UserDefinedFieldHelper.prototype.isShowInCurrentDataSource = function(udf)
	{
		if (!udf) return false;

		if (udf.SystemDefined)
		{
			return true;
		}

		var dataSources = udf.Type == "Group" ? udf.UDGridDataSources : udf.UDFDataSources;

		return dataSources.map(function(dataSource)
		{
			return dataSource.DBID;
		}).includes(tf.datasourceManager.databaseId);
	};

	UserDefinedFieldHelper.prototype.getCurrentDefaultValue = function(udf)
	{
		if (!udf || !udf.Type) return "";

		var currentValue = "";
		switch (udf.Type)
		{
			case 'Text':
				currentValue = udf.DefaultText;
				break;
			case 'Memo':
				currentValue = udf.DefaultMemo;
				break;
			case 'Number':
				currentValue = udf.DefaultNumeric;
				break;
			case 'Phone Number':
				currentValue = udf.DefaultPhoneNumber;
				break;
			case 'Zip Code':
				currentValue = udf.DefaultZipCode;
				break;
			case 'Date':
				currentValue = udf.DefaultDate;
				break;
			case 'Date/Time':
				currentValue = udf.DefaultDatetime;
				break;
			case 'Time':
				currentValue = udf.DefaultTime;
				break;
			case 'Boolean':
				if (udf.DefaultBoolean === true)
				{
					currentValue = udf.TrueDisplayName || "True";
				}
				else if (udf.DefaultBoolean === false)
				{
					currentValue = udf.FalseDisplayName || "False";
				}
				break;
			case 'List':
				var defaultItems = udf.UDFPickListOptions.filter(function(item)
				{
					return item.IsDefaultItem;
				}).map(function(item)
				{
					return item.PickList;
				});

				if (defaultItems.length > 0)
				{
					currentValue = defaultItems.join(", ");
				}
				break;
			default:
				break;
		}

		return currentValue;
	};

	UserDefinedFieldHelper.prototype.dispose = function() { };

	UserDefinedFieldHelper.prototype._getUserDefinedFields = function(items)
	{
		if (items.length === 0) return [];

		var today = (new Date()).toDateString(), self = this;

		// sort items by DisplayName
		items.sort(function(a, b)
		{
			if (a.DisplayName.toUpperCase() === b.DisplayName.toUpperCase())
			{
				return 0;
			}
			return a.DisplayName.toUpperCase() > b.DisplayName.toUpperCase() ? 1 : -1;
		});

		return items.map(function(item)
		{
			var editType,
				result,
				type = item.Type;

			switch (type)
			{
				case 'Text':
					editType = {
						"format": "String",
						"maxLength": item.MaxLength || 255
					};
					result = {
						"field": item.DisplayName,
						"title": item.DisplayName,
						"type": "String",
						"defaultValue": "User Defined Text",
						"value": item.DefaultText,
						"editType": editType
					};
					break;
				case 'Memo':
					editType = {
						"format": "Note",
						"maxLength": item.MaxLength || 2000
					};
					result = {
						"field": item.DisplayName,
						"title": item.DisplayName,
						"type": "String",
						"defaultValue": "Lorem ipsum dolor sit amet.",
						"value": item.DefaultMemo,
						"editType": editType
					};
					break;
				case 'Number':
					var precision = item.NumberPrecision,
						nullPrecision = (precision === 0 || precision === null);
					editType = {
						"format": "Number",
						"maxLength": 10 + (nullPrecision ? 0 : (1 + precision)),
						"maxValue": 9999999999 + (nullPrecision ? 0 : (1 - (Math.pow(10, -1 * precision))))
					};
					result = {
						"field": item.DisplayName,
						"title": item.DisplayName,
						"type": "Number",
						"defaultValue": "3.14",
						"value": item.DefaultNumeric,
						"editType": editType
					};
					if (precision != null)
					{
						var format = 0;
						format = format.toFixed(parseInt(precision)).toString();
						result["format"] = format;
					}
					break;
				case 'Phone Number':
					editType = {
						"format": "Phone"
					};
					result = {
						"field": item.DisplayName,
						"title": item.DisplayName,
						"type": "String",
						"format": "Phone",
						"defaultValue": "(987) 654-3210",
						"value": item.DefaultPhoneNumber,
						"editType": editType
					};
					break;
				case 'Zip Code':
					editType = {
						"format": "Number",
						"maxLength": 5
					};
					result = {
						"field": item.DisplayName,
						"title": item.DisplayName,
						"type": "Number",
						"defaultValue": "12345",
						"value": item.DefaultZipCode,
						"editType": editType
					};
					break;
				case 'Date':
					editType = {
						"format": "Date"
					};
					result = {
						"field": item.DisplayName,
						"title": item.DisplayName,
						"type": "Date",
						"defaultValue": today,
						"value": item.DefaultDate,
						"editType": editType
					};
					break;
				case 'Date/Time':
					editType = {
						"format": "DateTime"
					};
					result = {
						"field": item.DisplayName,
						"title": item.DisplayName,
						"type": "Date/Time",
						"defaultValue": today,
						"value": item.DefaultDatetime,
						"editType": editType
					};
					break;
				case 'Time':
					editType = {
						"format": "Time"
					};
					result = {
						"field": item.DisplayName,
						"title": item.DisplayName,
						"type": "Time",
						"defaultValue": '12:00',
						"value": item.DefaultTime,
						"editType": editType
					};
					break;
				case 'Boolean':
					editType = {
						"format": "BooleanDropDown"
					};
					result = {
						"field": item.DisplayName,
						"title": item.DisplayName,
						"type": "Boolean",
						"defaultValue": "False",
						"value": item.DefaultBoolean,
						"displayValue": "User Defined Boolean",
						"positiveLabel": item.TrueDisplayName || "True",
						"negativeLabel": item.FalseDisplayName || "False",
						"editType": editType
					};
					break;
				case 'List':
					var defaultItems = item.UDFPickListOptions.filter(function(item)
					{
						return item.IsDefaultItem;
					}).map(function(item)
					{
						return {
							text: item.PickList,
							value: item.ID,
						};
					}),
						getSource = function()
						{
							return tf.UDFDefinition.collection.reduce(function(acc, c)
							{
								return acc.concat(c.userDefinedFields)
							}, []).find(function(x)
							{
								return x.UDFId == item.Id;
							}).UDFPickListOptions.map(function(item)
							{
								return {
									text: item.PickList,
									value: item.ID,
								};
							});
						};

					result = {
						"field": item.DisplayName,
						"title": item.DisplayName,
						"type": "String",
						"defaultValue": "List Item 1, List Item 2, List Item 3",
						"value": defaultItems,
						"editType": item.PickListMultiSelect ?
							{
								"format": "ListMover",
								"getSource": function()
								{
									return Promise.resolve(getSource());
								},
								"allowNullValue": true,
								"entityKey": ""
							} : {
								"format": "DropDown",
								"getSource": function() { return Promise.resolve(getSource()); },
								"allowNullValue": true,
								"entityKey": ""
							}
					};
					break;
				default:
					break;
			}

			if (result)
			{
				result.UDFTypeId = item.TypeId;
				result["UDFType"] = type;
				result.UDFId = item.Id;
				result.editType["TypeId"] = item.TypeId;
				result.editType["DataTypeId"] = item.DataTypeId;
				if (item.Required)
				{
					result.editType.validators = $.extend(result.editType.validators, {
						notEmpty: {
							message: "required"
						}
					});
				}

				if (!self.isShowInCurrentDataSource(item))
				{
					result["unavailable"] = true;
				}
			}

			return result;
		});
	};
})();