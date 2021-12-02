(function()
{
	createNamespace("TF.GridDefinition").UDFDefinition = UDFDefinition;

	function UDFDefinition()
	{
		this.collection = [];
		this.udfHelper = new TF.DetailView.UserDefinedFieldHelper();
	}

	UDFDefinition.prototype.getAll = function()
	{
		return this._collection;
	}

	UDFDefinition.prototype.loadAll = function()
	{
		let self = this;
		self._collection = [];
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "userDefinedFields"), {
			paramData: {
				"@Relationships": "UDFPickListOptions,UDFDataSources,UDFType"
			}
		}).then(function(result)
		{
			if (result && result.Items)
			{
				var groupUdf = _.groupBy(result.Items, 'DataTypeId');
				for (var typeId in groupUdf)
				{
					var type = tf.dataTypeHelper.getAvailableDataTypes().find(r => r.id == typeId);
					if (type && type.key)
					{
						self._collection.push({
							gridType: type.key,
							userDefinedFields: groupUdf[typeId].map(function(field)
							{
								return self._format(field, type.key);
							})
						});
					}
				}
			}
			return true;
		}).catch(ex =>
		{
			console.warn(ex);
			return true;
		})
	}

	UDFDefinition.prototype.load = function(type)
	{
		let self = this;
		let hasUDF = tf.dataTypeHelper.getAvailableDataTypes().find(r => r.key === type);
		if (!hasUDF)
		{
			return Promise.resolve(false);
		}

		let exsit = self._collection.find(r => r.gridType == type);
		if (exsit)
		{
			return Promise.resolve(false);
		}

		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "userDefinedFields"), {
			paramData: {
				datatypeid: tf.dataTypeHelper.getId(type),
				"@Relationships": "UDFPickListOptions,UDFDataSources,UDFType"
			}
		}).then(function(result)
		{
			self._collection.push({
				gridType: type,
				userDefinedFields: result.Items.map((field) => self._format(field, type))
			});

			PubSub.publish(pb.REQUIRED_UDF_FIELDS_CHANGED, type);

			return true;
		});
	}

	UDFDefinition.prototype.get = function(gridType)
	{
		return this._collection.find(item => item.gridType === gridType);
	};

	UDFDefinition.prototype.get = function(gridType)
	{
		var self = this;
		return self.collection.filter(function(item) { return item.gridType === gridType; })[0];
	};

	UDFDefinition.prototype.getAvailableWithCurrentDataSource = function(gridType)
	{
		var self = this,
			definition = self.get(gridType);

		if (!definition)
		{
			return [];
		}

		return definition.userDefinedFields.filter(function(udf)
		{
			return self.udfHelper.isShowInCurrentDataSource(udf);
		});
	};

	UDFDefinition.prototype.getAvailableByIdWithCurrentDataSource = function (id) {
		let self = this,
			definition = self.get(gridType);

		if (!definition) {
			return [];
		}

		return definition.userDefinedFields.filter(udf => {
			return self.udfHelper.isShowInCurrentDataSource(udf);
		});
	};

	UDFDefinition.prototype.getInvisibleUDFs = function(gridType)
	{
		let self = this,
			definition = self.get(gridType);

		if (!definition)
		{
			return [];
		}

		return definition.userDefinedFields.filter(udf =>
		{
			return !self.udfHelper.isShowInCurrentDataSource(udf);
		});
	};

	UDFDefinition.prototype.Patch = function(data)
	{
		let self = this;
		return tf.promiseAjax.patch(pathCombine(tf.api.apiPrefixWithoutDatabase(), "UserDefinedFields"),
			{
				data: data
			}).then(result => 
			{
				if (result && result.Items && result.Items[0])
				{
					return self.RetrieveByType(tf.dataTypeHelper.getKeyById(result.Items[0].DataTypeId))
				}

				return Promise.resolve();
			})
	};

	UDFDefinition.prototype.RetrieveByType = function(gridType)
	{
		let self = this;
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "userDefinedFields"), {
			paramData: {
				datatypeid: tf.dataTypeHelper.getId(gridType),
				"@Relationships": "UDFPickListOptions,UDFDataSources,UDFType"
			}
		}).then(function(result)
		{
			self._update(gridType, result.Items);

			return result;
		});
	};

	UDFDefinition.prototype.RetrieveUDFGroup = function(gridType)
	{
		let self = this;
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "udgrids"), {
			paramData: {
				datatypeid: tf.dataTypeHelper.getId(gridType),
				"@Relationships": "UDGridFields,UDGridDataSources"
			}
		}).then(function(result)
		{
			self._update(gridType, result.Items.map(function(m){m.Id = m.ID; m.Type = "Group"; m.DisplayName = m.Name; return m}));

			return result;
		});
	};

	UDFDefinition.prototype.getOriginalName = function(filedName)
	{
		// the value of fieldName is UDFGuid.
		var self = this,
			matched = self.getUDFByGuid(filedName);

		return matched ? matched.OriginalName : filedName;
	};

	UDFDefinition.prototype.isUDF = function(fieldName)
	{
		var self = this,
			matched = self.getUDFByGuid(fieldName);

		return !!matched;
	};

	UDFDefinition.prototype.getUDFById = function(udfId)
	{
		return _.flatMap(this.collection, function(i) { return i.userDefinedFields; }).find(function(i)
		{
			return i.UDFId == udfId;
		});
	};

	UDFDefinition.prototype.getUDFByGuid = function(guid)
	{
		return _.flatMap(this.collection, function(i) { return i.userDefinedFields; }).find(function(i)
		{
			return i.UDFGuid == guid;
		});
	};

	UDFDefinition.prototype.getFieldNameById = function(udfId)
	{
		var matched = this.getUDFById(udfId);
		return matched ? matched.FieldName : "";
	};

	UDFDefinition.prototype._update = function(gridType, items)
	{
		let self = this;
		self._collection = self._collection.filter(item => item.gridType != gridType);
		self._collection.push({
			gridType: gridType,
			userDefinedFields: items.map(item => self._format(item, gridType))
		});
	};

	UDFDefinition.prototype._format = function(item, gridType)
	{
		var self = this,
			associatedDBIDs = item.Type === "Group" ?
				(Array.isArray(item.UDGridDataSource) ? item.UDGridDataSource : []) :
				(Array.isArray(item.UDFDataSources) ? item.UDFDataSources : []),
			fieldName = item.Guid,
			columnDefinition = {
				UDFDataSources: associatedDBIDs,
				FieldName: fieldName,
				UDFId: item.Id,
				UDFGuid: item.Guid,
				OriginalName: item.DisplayName,
				DisplayName: item.DisplayName,
				Width: "150px",
				UDFType: item.Type.toLowerCase(),
				Required: item.Required,
				SystemDefined: item.SystemDefined,
				AttributeFlag: item.AttributeFlag,
				format: item.FormatString,
				type: item.Type.replace(/date\/time/i, "datetime")
					.replace(/list/i, "select")
					.replace(/memo/i, "string")
					.replace(/text/i, "string")
					.replace(/Phone Number/i, "string").toLowerCase()
			};

		switch (item.Type)
		{
			case "Boolean":
				var trueDisplay = item.TrueDisplayName != null && item.TrueDisplayName.length !== 0 ? item.TrueDisplayName : "true",
					falseDisplay = item.FalseDisplayName != null && item.FalseDisplayName.length !== 0 ? item.FalseDisplayName : "false";

				columnDefinition["template"] = function(dataItem)
				{
					var value = dataItem[columnDefinition.OriginalName];
					if (value == null) return "";

					return value ? trueDisplay : falseDisplay;
				};

				columnDefinition["TrueDisplayName"] = item.TrueDisplayName;
				columnDefinition["FalseDisplayName"] = item.FalseDisplayName;

				columnDefinition["filterable"] = {
					cell: {
						template: function(args)
						{
							args.element.kendoDropDownList({
								dataSource: new kendo.data.DataSource({
									data: [
										{ someField: "(not specified)", valueField: "null" },
										{ someField: trueDisplay, valueField: "true" },
										{ someField: falseDisplay, valueField: "false" }
									]
								}),
								dataTextField: "someField",
								dataValueField: "valueField",
								valuePrimitive: true
							});
						},
						showOperators: false
					}
				};
				break;
			case "Number":
				if (_.isNumber(item.NumberPrecision))
				{
					// Both NumberPrecision and Precision properties will be used in different places
					columnDefinition.NumberPrecision = item.NumberPrecision;
					columnDefinition.Precision = item.NumberPrecision;
				}
				break;
			case "List":
				columnDefinition.UDFPickListOptions = item.UDFPickListOptions || [];
				columnDefinition.ListFilterTemplate = self._generateListFilterTemplate(item, gridType);
				columnDefinition.ListFilterTemplate.filterField = fieldName;
				columnDefinition.ListFilterTemplate.columnSources = [{ FieldName: fieldName, DisplayName: item.DisplayName, Width: "150px", type: "string", isSortItem: true }];
				break;
			case "Phone Number":
				columnDefinition["template"] = function(dataItem)
				{
					return tf.dataFormatHelper.phoneFormatter(dataItem[columnDefinition.OriginalName]) || '';
				};
				break;
			case "Date/Time":
				columnDefinition["template"] = function(dataItem)
				{
					return dataItem[columnDefinition.OriginalName] ? moment(dataItem[columnDefinition.OriginalName]).format("MM/DD/YYYY hh:mm A") : '';
				};
				break;
			default:
				break;
		}

		return columnDefinition;
	};

	UDFDefinition.prototype._generateListFilterTemplate = function(listUdf, gridType)
	{
		var template = {
			UDFId: listUdf.Id,
			listFilterType: listUdf.PickListMultiSelect ? "WithSearchGrid" : "Enum",
			DisplayFilterTypeName: tf.DataTypeHelper.getNamebyLowerCaseName(gridType),
			GridType: tf.DataTypeHelper.getNamebyLowerCaseName(gridType),
			_gridType: gridType,
			OriginalName: listUdf.DisplayName,
			getUrl: function()
			{
				return pathCombine(tf.api.apiPrefix(), "search", tf.DataTypeHelper.getEndpoint(gridType));
			}
		};

		if (!listUdf.PickListMultiSelect)
		{
			template.AllItems = listUdf.UDFPickListOptions.map(function(option) { return option.PickList; }) || [];
		}

		return template;
	};
})();