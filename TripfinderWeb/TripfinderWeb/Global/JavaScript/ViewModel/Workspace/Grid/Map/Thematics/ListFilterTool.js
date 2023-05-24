(function()
{
	createNamespace("TF.Map.Thematics").ListFilterTool = ListFilterTool;

	function ListFilterTool(gridType, filtersInfo, fields)
	{
		var self = this;
		self.gridType = gridType;
		self.filtersInfo = filtersInfo;
		self.fields = fields;
		self.cachedListFilters = {};
		self.fieldHelper = new TF.Map.Thematics.DataFieldHelper();

		self.init();
	};

	/**
	 * Initialization
	 * @return {void}
	 */
	ListFilterTool.prototype.init = function()
	{
		var self = this;

		self.initSelectedItems(self.filtersInfo);
	};

	/**
	 * Initialize selected items with filter info.
	 * @param {Object} filtersInfo The filter info.
	 * @return {void}
	 */
	ListFilterTool.prototype.initSelectedItems = function(filtersInfo)
	{
		if (!filtersInfo) { return; }

		var self = this,
			filterValue, fieldName, selectedIds, valueList;
		const fieldsDic = _.keyBy(self.fieldHelper.getColumnsByType(self.gridType), 'FieldName');
		$.each(filtersInfo, function(index, item)
		{
			if (item.filterType !== "list" || !item.filterValue) { return true; }

			filterValue = JSON.parse(item.filterValue);
			fieldName = filterValue.FieldName ? filterValue.FieldName : filterValue.FilterItems[0].FieldName;
			selectedIds = filterValue.ListFilterIds || [];
			valueList = JSON.parse(self.convertFilterValueList(fieldName, filterValue));
			field = fieldsDic[filterValue.FieldName];

			if (filterValue.ListFilterType === "WithSearchGrid")
			{
				const requestURL = field.ListFilterTemplate.getUrl();

				if (((self.gridType === 'student' || self.gridType === 'staff')
					&& field.ListFilterTemplate.GridType === 'Genders') || field.ListFilterTemplate.GridType === 'GPSEventType')
				{
					const useGPSDatabase = field.ListFilterTemplate.GridType === 'GPSEventType' && !TF.Helper.VehicleEventHelper.isGpsConnectPlusEnabled;
					const requestType = useGPSDatabase ? "post" : "get";

					tf.promiseAjax[requestType](
						requestURL,
						{
							paramData: {
								"@filter": `in(ID,${selectedIds.join(",")})`
							}
						}).then(function(response)
						{
							if (useGPSDatabase)
							{
								response.Items = response.Items.filter(x => selectedIds.includes(x.Id));
							}

							self.cachedListFilters[this.fieldName] = self.createCachedFilterObject(selectedIds, response.Items, valueList);
						}.bind({ fieldName: fieldName }));
				}
				else
				{
					const requestOption = {
						data: {
							FilterClause: "",
							IdFilter: { IncludeOnly: selectedIds }
						}
					}

					tf.promiseAjax.post(requestURL, requestOption)
						.then(function(response)
						{
							self.cachedListFilters[this.fieldName] = self.createCachedFilterObject(selectedIds, response.Items, valueList);
						}.bind({ fieldName: fieldName }));
				}
			}
			else
			{
				// For "MapData" and "Enum"
				self.cachedListFilters[fieldName] = self.createCachedFilterObject(null, valueList, valueList);
			}
		});
	};

	ListFilterTool.prototype.convertFilterValueList = function(fieldName, filterValue)
	{
		var self = this;
		if (self.fields)
		{
			var fields = self.fields.filter(function(field) { return field.selectField().FieldName == fieldName }),
				listFilterTemplate = fields && fields.length > 0 ? fields[0].selectField().ListFilterTemplate : null;
			if (listFilterTemplate && listFilterTemplate.ConvertFilterValueList)
			{
				return listFilterTemplate.ConvertFilterValueList(filterValue);
			}
		}


		return filterValue.ValueList;;
	}

	/**
	 * Open the list filter modal.
	 * @param {string} fieldName The name of the field.
	 * @param {object} filterTemplate The filter template object.
	 * @return {Promise} For tracking the filtering result.
	 */
	ListFilterTool.prototype.open = function(fieldName, filterTemplate, isNew)
	{
		var self = this, filterData;

		if (isNew)
		{
			self.cachedListFilters[fieldName] = null;
		}

		filterData = self.cachedListFilters[fieldName]

		switch (filterTemplate.listFilterType)
		{
			case "WithSearchGrid":
				return self.withSearchGridListFilter(fieldName, filterData, filterTemplate);
			case "MapData":
				return self.mapDataListFilter(fieldName, filterData, filterTemplate);
			case "Enum":
				return self.enumListFilter(fieldName, filterData, filterTemplate);
			default:
				break;
		}
	};

	/**
	 * Conduct list filtering for "withSearchGrid" type.
	 * @param {string} fieldName The name of the field.
	 * @param {Array} cachedItem The items that are in the cache.
	 * @param {object} filterTemplate The filter template object.
	 * @return {Promise}
	 */
	ListFilterTool.prototype.withSearchGridListFilter = function(fieldName, filterData, filterTemplate)
	{
		var self = this,
			cachedItems = filterData ? filterData.selectedItems : [];

		return tf.modalManager.showModal(
			new TF.Modal.ListMoverForListFilterControlModalViewModel(cachedItems, filterTemplate)
		).then(function(selectedItems)
		{
			var filterObj, result, displayValue, selectedFilterItems = [], ids = [];

			if (!selectedItems) { return; }

			selectedItems.map(function(item)
			{
				selectedFilterItems.push(item[filterTemplate.filterField]);
				ids.push(item.Id);
			});
			displayValue = selectedFilterItems.join(",");

			self.cachedListFilters[fieldName] = self.createCachedFilterObject(ids, selectedItems, selectedFilterItems);
			result = self.createFilterSetObject(fieldName, ids, displayValue, selectedFilterItems, "WithSearchGrid");
			return Promise.resolve(result)
		});

	};

	/**
	 * Conduct list filtering for "mapData" type. Borrowed from LightKendoGrid.
	 * @param {string} fieldName The name of the field.
	 * @param {Array} cachedItem The items that are in the cache.
	 * @param {object} filterTemplate The filter template object.
	 * @return {Promise}
	 */
	ListFilterTool.prototype.mapDataListFilter = function(fieldName, filterData, filterTemplate)
	{
		var self = this,
			selectedFilterItems = filterData ? filterData.selectedItems : [],
			url = filterTemplate.getUrl(),
			requestMethod = filterTemplate.requestMethod,
			filterField = filterTemplate.filterField,
			modifySource = filterTemplate.modifySource;

		return tf.promiseAjax[(requestMethod && requestMethod === "post") ? "post" : "get"](url).then(function(response)
		{
			function getItem(item) { return filterField ? item[filterField] : $.trim(item); }

			var allItems = self.processMapData(response, modifySource),
				allItemsData = allItems.map(getItem),
				selectedFilterItemsData = selectedFilterItems.map(getItem),
				listFilterOption = self.getDefaultListFilterOption(filterTemplate.DisplayFilterTypeName),
				requestOptions = {
					url: url,
					method: requestMethod,
					filterField: filterField,
					modifySource: modifySource
				};;

			listFilterOption = $.extend({}, listFilterOption, filterTemplate);
			listFilterOption.gridColumnSource = TF.ListFilterDefinition.ColumnSource[filterTemplate.GridType];

			return tf.modalManager.showModal(
				new TF.Modal.KendoListMoverControlModalViewModel(allItemsData, selectedFilterItemsData, listFilterOption, requestOptions)
			).then(function(selectedFilterItems)
			{
				var result, displayValue;

				if (!selectedFilterItems) { return; }

				selectedFilterItems = allItems.filter(function(item) { return Array.contain(selectedFilterItems, getItem(item)); });
				selectedFilterItems = TF.ListMoverForListFilterHelper.processSelectedData(selectedFilterItems, filterTemplate.filterField);
				displayValue = selectedFilterItems.join(",");

				self.cachedListFilters[fieldName] = self.createCachedFilterObject(null, selectedFilterItems, selectedFilterItems);
				result = self.createFilterSetObject(fieldName, null, displayValue, selectedFilterItems, "MapData");

				return Promise.resolve(result);
			});
		});
	};

	/**
	 * Conduct list filtering for "enum" type.
	 * @param {string} fieldName The name of the field.
	 * @param {Array} cachedItem The items that are in the cache.
	 * @param {object} filterTemplate The filter template object.
	 * @return {Promise}
	 */
	ListFilterTool.prototype.enumListFilter = function(fieldName, filterData, filterTemplate)
	{
		var self = this,
			allItems = filterTemplate.AllItems,
			selectedFilterItems = self.getSelectedFilterItemsForDefaultType(filterData, filterTemplate, fieldName),
			listFilterOption = self.getDefaultListFilterOption(filterTemplate.DisplayFilterTypeName);

		listFilterOption = $.extend({}, listFilterOption, filterTemplate);

		return tf.modalManager.showModal(
			new TF.Modal.KendoListMoverControlModalViewModel(allItems, selectedFilterItems, listFilterOption)
		).then(function(selectedFilterItems)
		{
			var result, displayValues;

			if (!selectedFilterItems) { return; }

			if (filterTemplate.covertSelectedItems)
			{
				selectedFilterItems = filterTemplate.covertSelectedItems(selectedFilterItems);
			}
			displayValue = selectedFilterItems.join(",");

			self.cachedListFilters[fieldName] = self.createCachedFilterObject(null, selectedFilterItems, selectedFilterItems);
			result = self.createFilterSetObject(fieldName, null, displayValue, selectedFilterItems, "Enum");

			return Promise.resolve(result);
		});
	};

	/**
	 * Create a filter data object for cache.
	 * @param {Array} ids The array of entity ids.
	 * @param {Array} selectedItems The array of selected item entities.
	 * @param {Array} selectedFilterItems The array of selected filter items.
	 * @return {Object} The constructed data object.
	 */
	ListFilterTool.prototype.createCachedFilterObject = function(ids, selectedItems, selectedFilterItems)
	{
		return {
			"ids": ids || [],
			"selectedItems": selectedItems || [],
			"selectedFilterItems": selectedFilterItems || []
		};
	};

	/**
	 * Create a filterSet object.
	 * @param {string} fieldName The name of the field.
	 * @param {Array} listFilterIds The array of filter ids.
	 * @param {string} value The display value.
	 * @param {Array} valueList The array of filter values.
	 * @return {object} The constructed filterSet object.
	 */
	ListFilterTool.prototype.createFilterSetObject = function(fieldName, listFilterIds, value, valueList, listFilterType)
	{
		return {
			FieldName: fieldName,
			IsListFilter: true,
			ListFilterIds: listFilterIds || [],
			Operator: "In",
			Value: value,
			ValueList: Array.isArray(valueList) ? JSON.stringify(valueList) : [],
			ListFilterType: listFilterType
		};
	};

	/**
	 * Get selected filter items for default type.
	 * @param {Array} cachedListFilters Cached list filters.
	 * @param {Object} listFilterTemplate The list filter template.
	 * @param {string} fieldName The field name.
	 * @return {Array} The array of processed filter items.
	 */
	ListFilterTool.prototype.getSelectedFilterItemsForDefaultType = function(cachedFilterData, listFilterTemplate, fieldName)
	{
		if (cachedFilterData && cachedFilterData.selectedFilterItems)
		{
			return cachedFilterData.selectedFilterItems;
		}

		var allItems = listFilterTemplate.AllItems,
			selectedIds = (cachedFilterData && cachedFilterData.ids) ? cachedFilterData.ids : [],
			selectedFilterItems = allItems.filter(function(item, idx) { return selectedIds.indexOf(idx) >= 0; });

		return selectedFilterItems;
	}

	/**
	 * Get default list filter option.
	 * @param {string} displayFilterTypeName The display name of the column.
	 * @return {object} The constructed object.
	 */
	ListFilterTool.prototype.getDefaultListFilterOption = function(displayFilterTypeName)
	{
		return {
			title: 'Filter ' + displayFilterTypeName,
			description: 'Select the ' + displayFilterTypeName + ' that you would like to view.'
		}
	};

	/**
	 * Process the map data.
	 * @param {object} response The response.
	 * @param {function} modifySource The function to process the data.
	 * @return {Array} The processed data.
	 */
	ListFilterTool.prototype.processMapData = function(response, modifySource)
	{
		var allItems = $.isArray(response.Items[0]) ? response.Items[0] : response.Items;
		if (modifySource)
		{
			allItems = modifySource(allItems);
		}
		return allItems;
	}

	/**
	 * The dispose function.
	 * @return {void}
	 */
	ListFilterTool.prototype.dispose = function()
	{

	};
})();