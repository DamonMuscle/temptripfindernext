(function()
{
	createNamespace("TF.Grid").FilterHelper = FilterHelper;

	function FilterHelper()
	{ }

	FilterHelper.isFilterMenuOpen = function($element)
	{
		return $element.closest('.tf-contextmenu-wrap').hasClass('filtermenu-wrap');
	};

	FilterHelper.getFilterById = function(filterId)
	{
		// filter no need to validate if it is none or it is special filter build for dashboard
		if (!filterId || filterId <= 0)
			return Promise.resolve(
				{});

		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), 'gridFilter/id', filterId))
			.then(function(apiResponse)
			{
				var selectedFilterEntity = apiResponse;
				if (selectedFilterEntity)
					return Promise.resolve(selectedFilterEntity);
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
		return TF.Grid.FilterHelper.saveQuickFilter(gridType, new TF.SearchParameters(null, null, null, null, null, null, null));
	};

	FilterHelper.compareFilterWhereClause = function(leftFilterWhereClause, rightFilterWhereClause)
	{
		return leftFilterWhereClause === rightFilterWhereClause;
	};

	FilterHelper.getGridDefinitionByType = function functionName(gridType)
	{
		var result = null;
		switch (gridType)
		{
			case 'altsite':
			case 'alternatesite':
				result = tf.altsiteGridDefinition.gridDefinition();
				break;
			case 'contractor':
				result = tf.contractorGridDefinition.gridDefinition();
				break;
			case 'district':
				result = tf.districtGridDefinition.gridDefinition();
				break;
			case 'fieldtrip':
				result = tf.fieldTripGridDefinition.gridDefinition();
				break;
			case 'vehicle':
			case 'Vehicle':
				result = tf.vehicleGridDefinition.gridDefinition();
				break;
			case 'school':
				result = tf.schoolGridDefinition.gridDefinition();
				break;
			case 'trip':
				result = tf.tripGridDefinition.gridDefinition();
				break;
			case 'georegion':
				result = tf.georegionGridDefinition.gridDefinition();
				break;
			case 'student':
				result = tf.studentGridDefinition.gridDefinition();
				break;
			case 'staff':
			case 'Driver':
				result = tf.staffGridDefinition.gridDefinition();
				break;
			case 'tripstop':
			case 'TripStop':
				result = tf.tripStopGridDefinition.gridDefinition();
				break;
			case 'equipment':
				result = tf.equipmentGridDefinition.gridDefinition();
				break;
			case 'stopStudent':
				result = tf.studentGridDefinition.gridDefinition();
				break;
			case 'ethnic_codes':
				result = tf.ethnicGridDefinition.gridDefinition();
				break;
			case 'disability_codes':
				result = tf.disabilityGridDefinition.gridDefinition();
				break;
			case 'busfinderhistorical':
				result = tf.busfinderHistoricalGridDifinition.gridDefinition();
				break;
			default:
		}
		return result;
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
