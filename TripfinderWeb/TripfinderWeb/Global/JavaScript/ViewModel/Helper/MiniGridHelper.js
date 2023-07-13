(function()
{
	createNamespace("TF.Helper").MiniGridHelper = MiniGridHelper;
	MiniGridHelper.gridsSupportFilter = ["StudentGrid", "DocumentGrid", "StudentScheduleGrid", "AltsiteGrid",
		"AMTripGrid", "PMTripGrid", "AMTransferTripGrid", "PMTransferTripGrid", "AllTripGrid", "AllTripStopGrid", "AMTripStopGrid", "PMTripStopGrid",
		"AMTransferTripStopGrid", "PMTransferTripStopGrid", "CommunicationHistoryGrid", "AideGrid", "DriverGrid", "VehicleGrid", "StopGrid", "TripGrid"];

	function MiniGridHelper()
	{
		var self = this;
	}

	/**
	 * Check whether the kendo mini grid supports filter bars and summary bars.
	 *
	 * @param {string} gridName
	 * @returns
	 */
	MiniGridHelper.prototype.checkGridSupportFilter = function(gridName)
	{
		return ($.inArray(gridName, MiniGridHelper.gridsSupportFilter) > -1);
	};

	/**
	 * Update the kendo mini grid footer text.
	 *
	 * @param {jQuery} $grid
	 * @param {int} filterCount
	 * @param {int} totalCount
	 * @returns
	 */
	MiniGridHelper.prototype.updateGridFooter = function($grid, filterCount, totalCount)
	{
		let pageFooter = $grid.find(".k-pager-wrap");
		let footerInfo = pageFooter.find(".pageInfoMini");
		let content = filterCount + " of " + totalCount;

		if (footerInfo.length > 0)
		{
			footerInfo.html(content);
		}
		else
		{
			pageFooter.append($("<div class='pageInfoMini'>" + content + "</div>"));
		}
	};

	/**
	 * Get filterable Config for KendoGrid
	 *
	 * @param {jQuery} $grid
	 * @param {object} options
	 * @returns
	 */
	MiniGridHelper.prototype.getFilterableConfig = function($grid, options)
	{
		if (!$grid)
		{
			return false;
		}

		var data = $grid.data();
		var isFilter = data["showQuickFilter"] != undefined ? data["showQuickFilter"] : options.showQuickFilter;
		$grid.data("showQuickFilter", isFilter); // RCM Show Quick Filter functionality need this data
		if (isFilter)
		{
			return {
				extra: true,
				mode: "menu row",
				operators: TF.Grid.LightKendoGrid.DefaultOperator
			}
		}
		else
		{
			return false;
		}
	};

	/**
	 * Get layout(summary bar) Config for KendoGrid
	 *
	 * @param {jQuery} $grid
	 * @param {object} options
	 * @returns
	 */
	MiniGridHelper.prototype.getSummaryBarConfig = function($grid, options)
	{
		if (!$grid)
		{
			return null;
		}

		var data = $grid.data();
		var isSummary = data["showSummary"] != undefined ? data["showSummary"] : options.showSummary;
		$grid.data("showSummary", isSummary); // RCM Show Summary functionality need this data
		if (isSummary)
		{
			var result = [];
			result["ShowSummaryBar"] = !!isSummary;
			return result;
		}
		else
		{
			return null;
		}
	};

	/**
	 * Get Locked Column Config for KendoGrid
	 *
	 * @param {jQuery} $grid
	 * @param {object} options
	 * @returns
	 */
	MiniGridHelper.prototype.getLockedColumnTemplate = function($grid, options)
	{
		if (!$grid)
		{
			return null;
		}

		var data = $grid.data();
		var isSummary = data["showSummary"] != undefined ? data["showSummary"] : options.showSummary;
		var isQuickFilter = data["showQuickFilter"] != undefined ? data["showQuickFilter"] : options.showQuickFilter;

		return [
			{
				field: "bulk_menu",
				title: "<div></div>",
				width: '30px',
				sortable: false,
				filterable: false,
				locked: true,
				hidden: !isSummary && !isQuickFilter, // hide locked column if summary and filter are unselected
				template: ""
			}
		];
	};

	/**
	 * Get filter Config for KendoGrid
	 *
	 * @param {jQuery} $grid
	 * @param {object} options
	 * @returns
	 */
	MiniGridHelper.prototype.getFilterConfig = function($grid, options)
	{
		if (!$grid)
		{
			return null;
		}

		var data = $grid.data();
		var isQuickFilter = data["showQuickFilter"] != undefined ? data["showQuickFilter"] : options.showQuickFilter;
		var filter = data["filter"] != undefined ? data["filter"] : options.filter;
		$grid.find(".kendo-grid-container").data("filter", filter); // RCM functionality need this data

		if (isQuickFilter)
		{
			return filter;
		}
		else
		{
			return null;
		}
	};


	/**
	 * Get kendo grid columns with extension.
	 *
	 * @param {Array} currentColumns
	 * @returns
	 */
	MiniGridHelper.prototype.getKendoColumnsExtend = function(currentColumns)
	{
		var defaultColumnWidth = "80px";
		var columns = currentColumns.map(function(definition)
		{
			var column = definition;
			var widthOfPerChar = 7;
			column.field = definition.FieldName;
			column.title = definition.DisplayName;
			column.minResizableWidth = 80; // Set the min Resizable width to prevent columns collapse.
			column.headerTemplate = `<span class="column-title">${kendo.htmlEncode(definition.DisplayName ?? definition.FieldName ?? "")}</span>`;
			if (!column.width)
				column.width = definition.Width || defaultColumnWidth;
			else
				definition.Width = column.width;

			if (column.lockWidth !== true)
			{
				column.width = `${Math.max(
					(column.title || "").trim().length * widthOfPerChar,
					Number.isNaN(parseInt(column.width)) ? parseInt(defaultColumnWidth) : parseInt(column.width)
				)}px`;
			}
			column.Width = column.width;

			if (definition.filterable == null)
			{
				column.filterable = {
					cell: {}
				};
			}

			column.hidden = false; // Overwrite the value of hidden attribute which setting in api.
			column.locked = false;
			column.sortable = true;
			switch (definition.type)
			{
				case "integer":
					column.format = "{0:n0}";
					break;
				case "time":
					column.format = "{0:h:mm tt}";
					break;
				case "date":
					column.format = "{0:MM/dd/yyyy}";
					break;
				case "datetime":
					column.format = "{0:MM/dd/yyyy hh:mm tt}";
					break;
			}
			if (definition.template !== undefined)
			{
				column.template = definition.template;
			}
			return column;
		});
		return { Columns: columns };
	};

	/**
	 * Update UDGrid columns settings
	 *
	 */
	MiniGridHelper.prototype.updateUDGridColumns = function(columns, colGuid, self)
	{

		const dataTypeId = self.options.DataTypeId;

		let specialColumns = [];
		let originFieldMapping = tf.udgHelper.getGuidToNameMappingOfGridFields(self.options, true, true);

		if (originFieldMapping[colGuid])
		{
			let udgField = self.options.UDGridFields.find(field => field.Guid == colGuid);
			const isIncludeUDGridColumn = TF.DetailView.UserDefinedGridHelper.isIncludeUDGridColumn(udgField);
			if (!isIncludeUDGridColumn) return;

			let	column = {
				FieldName: colGuid,
				DisplayName: originFieldMapping[colGuid],
				width: 165,
				lockWidth: true,
				type: tf.udgHelper.convertUDGFieldType2KendoGridType(udgField),
				originalUdfField: udgField,
				QuestionTypeId: udgField.editType.TypeId,
				questionType: udgField.questionType,
				questionFieldOptions: udgField.FieldOptions,
			};

			const template = tf.udgHelper.getGridColumnTemplate(udgField, dataTypeId);
			if (template)
			{
				column.template = template;
			}

			const columnExtension = tf.udgHelper.getGridColumnExtension(udgField, column, dataTypeId);
			if (columnExtension)
			{
				column = $.extend(column, columnExtension);
			}

			const columnListFilter = tf.udgHelper.getGridColumnListFilter(udgField, column, dataTypeId);
			if (columnListFilter)
			{
				column = $.extend(column, columnListFilter);
			}

			if (udgField.type.toLowerCase() === "map")
			{
				const xyCoordColumns = TF.DetailView.UserDefinedGridHelper.convertMapColumnToMapXYCoordColumns(column);
				specialColumns = xyCoordColumns;
			}
			else if (udgField.type.toLowerCase() === "signature")
			{
				column.udfType = "SignatureBlock";
			}

			if (specialColumns.length)
			{
				specialColumns.forEach(sc =>
				{
					sc.headerTemplate = GetQuestionHeaderTemplate(sc.DisplayName);
				});
				columns = columns.concat(specialColumns);
				specialColumns = [];
			}
			else
			{
				column.headerTemplate = GetQuestionHeaderTemplate(originFieldMapping[colGuid]);
				columns.push(column);
			}

			function GetQuestionHeaderTemplate(displayName)
			{
				return `<span title="${displayName}" style="overflow: hidden;text-overflow: ellipsis;">${displayName}</span>`;
			}

			return;
		}
	}
})();