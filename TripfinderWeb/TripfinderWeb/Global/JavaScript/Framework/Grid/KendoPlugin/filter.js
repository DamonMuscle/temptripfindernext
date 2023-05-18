(function()
{
	createNamespace("TF.Grid").FilterHelper = FilterHelper;

	function FilterHelper ()
	{ }

	FilterHelper.isFilterMenuOpen = function($element)
	{
		return $element.closest('.tf-contextmenu-wrap').hasClass('filtermenu-wrap');
	};

	FilterHelper.getFilterById = function(filterId, option)
	{
		// filter no need to validate if it is none or it is special filter build for dashboard
		if (!filterId || filterId <= 0)
			return Promise.resolve(
				{});

		const overlay = option && option.hasOwnProperty("overlay") ? { overlay: option.overlay } : null;
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), 'gridfilters'),
			{
				paramData: { id: filterId }
			}, overlay)
			.then(function(apiResponse)
			{
				if (apiResponse && apiResponse.Items && apiResponse.Items.length === 1)
					return Promise.resolve(apiResponse.Items[0]);
				else
					return Promise.resolve(null);
			});
	};

	FilterHelper.validFilterId = function(filterId)
	{
		return FilterHelper.getFilterById(filterId).then(function(response)
		{
			if (!response)
			{
				return Promise.resolve(false);
			}
			return Promise.resolve(true);
		});
	};

	FilterHelper.isDrillDownFillter = function(filterId)
	{
		return (typeof filterId === 'number' && filterId < 0);
	};

	FilterHelper.saveQuickFilter = function(gridType, quickFilters)
	{
		//it's better used only in KendoGridFilterMenu
		return tf.storageManager.save(tf.storageManager.gridCurrentQuickFilter(gridType), quickFilters, undefined, undefined, false);
	};

	FilterHelper.clearQuickFilter = function(gridType)
	{
		//it's better used only in KendoGridFilterMenu
		return tf.storageManager.delete(tf.storageManager.gridCurrentQuickFilter(gridType));
	};

	FilterHelper.compareFilterWhereClause = function(leftFilterWhereClause, rightFilterWhereClause)
	{
		return leftFilterWhereClause === rightFilterWhereClause;
	};

	FilterHelper.getGridDefinitionByType = function (gridType)
	{
		switch ((gridType || '').toLowerCase())
		{
			case 'altsite':
			case 'alternatesite':
				return tf.altsiteGridDefinition.gridDefinition();
			case 'contractor':
				return tf.contractorGridDefinition.gridDefinition();
			case 'district':
				return tf.districtGridDefinition.gridDefinition();
			case 'fieldtrip':
				return tf.fieldTripGridDefinition.gridDefinition();
			case 'vehicle':
				return tf.vehicleGridDefinition.gridDefinition();
			case 'school':
				return tf.schoolGridDefinition.gridDefinition();
			case 'trip':
				return tf.tripGridDefinition.gridDefinition();
			case 'route':
				return tf.routeGridDefinition.gridDefinition();
			case 'georegion':
				return tf.georegionGridDefinition.gridDefinition();
			case 'student':
				return tf.studentGridDefinition.gridDefinition();
			case 'staff':
			case 'driver':
				return tf.staffGridDefinition.gridDefinition();
			case 'tripstop':
				return tf.tripStopGridDefinition.gridDefinition();
			case 'equipment':
				return tf.equipmentGridDefinition.gridDefinition();
			case 'stopstudent':
				return tf.studentGridDefinition.gridDefinition();
			case 'ethnic_codes':
				return tf.ethnicGridDefinition.gridDefinition();
			case 'disability_codes':
				return tf.disabilityGridDefinition.gridDefinition();
			case 'busfinderhistorical':
				return tf.busfinderHistoricalGridDifinition.gridDefinition();
			case 'recordcontact':
				return tf.recordContactGridDefinition.gridDefinition();
			case 'contact':
				return tf.contactGridDefinition.gridDefinition();
			case 'specialequipment':
				return tf.specialEquipmentGridDefinition.gridDefinition();
		}

		return '';
	};

	FilterHelper.mergeOnlyForFilterColumns = function(gridType, columns)
	{
		var needMergeGridDefinition = TF.Grid.FilterHelper.getGridDefinitionByType(gridType);
		if (!needMergeGridDefinition)
			return columns;

		var onlyForFilterColumns = [];
		needMergeGridDefinition.Columns.forEach(function(column)
		{
			if (column.onlyForFilter)
			{
				column = $.extend(
					{}, column, TF.Grid.GridHelper.convertToOldGridDefinition(column));
				onlyForFilterColumns.push(column);
			}
		});

		columns = columns.concat(onlyForFilterColumns);

		// Remove onlyForGrid columns
		var toBeRemoved = {};
		needMergeGridDefinition.Columns.forEach(function(column)
		{
			toBeRemoved[column.FieldName] = column.onlyForGrid ? true : false;
		});

		columns = columns.filter(function(column)
		{
			return !toBeRemoved[column.FieldName];
		});

		return columns;
	};
})();
