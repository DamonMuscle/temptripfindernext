(function()
{
	createNamespace("TF.GridDefinition").UDFDefinition = UDFDefinition;

	function UDFDefinition()
	{
		this.collection = [];
		this.udfHelper = new TF.DetailView.UserDefinedFieldHelper();
	}

	UDFDefinition.prototype.init = function()
	{
		var self = this;
		self.collection = [];
		return self._fetchAll();
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

		return definition.userDefinedFields.filter(function(udf)
		{
			return self.udfHelper.isShowInCurrentDataSource(udf);
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

	UDFDefinition.prototype.getInvisibleUDFs = function(gridType)
	{
		var self = this,
			udfs = self.get(gridType).userDefinedFields;

		return udfs.filter(function(udf)
		{
			return !self.udfHelper.isShowInCurrentDataSource(udf);
		});
	};

	UDFDefinition.prototype._fetchAll = function()
	{
		var self = this,
			tasks = tf.DataTypeHelper.getAvailableDataTypes().filter(x=> x.key === "fieldtrip").map(function(obj)
			{
				return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "userDefinedFields"), {
					paramData: {
						datatypeid: obj.id,
						"@Relationships": "UDFPickListOptions,UDFDataSources,UDFType"
					}
				}).then(function(result)
				{
					var fields = result.Items;

					self.collection.push({
						gridType: obj.key,
						userDefinedFields: fields.map(function(field)
						{
							return self.format(field, obj.key);
						})
					});
				});
			});

		return Promise.all(tasks)
			.then(function()
			{
				return self.collection;
			}).catch(function()
			{
				console.log(arguments);
			});
	};

	UDFDefinition.prototype.updateByType = function(gridType)
	{
		var self = this;

		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "userDefinedFields"), {
			paramData: {
				datatypeid: tf.DataTypeHelper.getId(gridType),
				"@Relationships": "UDFPickListOptions,UDFDataSources,UDFType"
			}
		}).then(function(result)
		{
			self.update(gridType, result.Items);

			return self.collection;
		});
	};

	UDFDefinition.prototype.update = function(gridType, items)
	{
		var self = this;
		self.collection = self.collection.filter(function(item)
		{
			return item.gridType != gridType;
		});

		self.collection.push({
			gridType: gridType,
			userDefinedFields: items.map(function(item)
			{
				return self.format(item, gridType)
			})
		});
	};

	UDFDefinition.prototype.format = function(item, gridType)
	{
		var self = this,
			associatedDBIDs = item.Type === "Group" ? 
			(Array.isArray(item.UDGridDataSource) ? item.UDGridDataSource : []): 
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
				columnDefinition.ListFilterTemplate = self.generateListFilterTemplate(item, gridType);
				columnDefinition.ListFilterTemplate.filterField = fieldName;
				columnDefinition.ListFilterTemplate.columnSources = [{ FieldName: fieldName, DisplayName: item.DisplayName, Width: "150px", type: "string", isSortItem: true }];
				break;
			default:
				break;
		}

		return columnDefinition;
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

	UDFDefinition.prototype.generateListFilterTemplate = function(listUdf, gridType)
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