(function()
{
	createNamespace("TF.Helper").MiniGridHelper = MiniGridHelper;
	MiniGridHelper.gridsSupportFilter = ["StudentGrid", "ContactGrid", "DocumentGrid", "StudentScheduleGrid", "AltsiteGrid",
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
	MiniGridHelper.prototype.updateUDGridColumns = function(columns, col, self)
	{
		let specialColumns = [];
		let originFieldMapping = tf.udgHelper.getGuidToNameMappingOfGridFields(self.options, true, true);
		let isXCoordField = TF.DetailView.UserDefinedGridHelper.isXCoordField(col);
		let isYCoordField = TF.DetailView.UserDefinedGridHelper.isYCoordField(col);
		let dateTimeTemplate = function(item)
		{
			let value = item[col];
			let dt = moment(value);
			return dt.isValid() ? dt.format("MM/DD/YYYY hh:mm A") : "";
		};

		if (originFieldMapping[col])
		{
			let udgField = self.options.UDGridFields.find(field => field.Guid == col),
				column = {
					FieldName: col,
					DisplayName: originFieldMapping[col],
					width: 165,
					lockWidth: true,
					type: 'string',
					originalUdfField: udgField
				};

			switch (udgField.FieldOptions.TypeName)
			{
				case "Attachment":
					column.type = "integer";
					break;
				case "Map":
					let xyCoordColumns = TF.DetailView.UserDefinedGridHelper.convertMapColumnToMapXYCoordColumns(column);
					if (isXCoordField)
					{
						specialColumns = [xyCoordColumns[0]];
					}
					else if (isYCoordField)
					{
						specialColumns = [xyCoordColumns[1]];
					}
					else
					{
						specialColumns = xyCoordColumns;
					}
					break;
				case "Signature":
					column.type = "boolean";
					column.udfType = "SignatureBlock";
					column.template = function(item)
					{
						return `<div class='signature-checkbox-container'>
										<input type='checkbox' disabled class='signature-checkbox' ${item[col] === 'true' ? 'checked' : ''}/>
									</div>`;
					};
					column.formatCopyValue = function(value)
					{
						return value == null ? "" : `${value}`;
					};
					break;
				case "Date/Time":
					column.template = dateTimeTemplate;
					column.type = "datetime";
					break;
				case "Date":
					column.template = function(item)
					{
						let value = item[col];
						let date = moment(value);
						return date.isValid() ? moment(value).format("MM/DD/YYYY") : "";
					};
					column.type = "date";
					break;
				case "Time":
					column.template = function(item)
					{
						let value = item[col];
						let time = moment(value);
						if (time.isValid())
						{
							return time.format("hh:mm A");
						}
						time = moment("1900-1-1 " + value);
						return time.isValid() ? time.format("hh:mm A") : "";
					};
					column.type = "time";
					break;
				case "List":
					column.template = function(item)
					{
						let value = item[col];
						if (value instanceof Array)
						{
							return value.join(", ");
						}
						return isNullObj(value) ? "" : value;
					};
					break;
				case "Boolean":
					column.template = function(item)
					{
						let value = item[col];
						if (isNullObj(value)) return '';
						return (value === 'true' || value === true) ? udgField.positiveLabel : udgField.negativeLabel || value;
					};
					column.type = "boolean";
					break;
				case "Number":
				case "Currency":
					const formatStr = 0;
					column.Precision = udgField.FieldOptions.TypeName === 'Currency' ? udgField.FieldOptions.MaxLength : udgField.FieldOptions.NumberPrecision;
					column.format = "{0:" + formatStr.toFixed(parseInt(column.Precision)).toString() + "}";
					column.template = function(item)
					{
						let value = item[col];
						if (value == null || value === "")
						{
							return "";
						}

						const precision = column.Precision;
						if (isNaN(Number(value)))
						{
							value = 0;
						}
						return Number(value).toFixed(_.isNumber(precision) ? precision : 0);

					};
					column.type = "number";
					break;
				case "Phone Number":
					column.template = function(item)
					{
						let value = item[col];
						if (isNullObj(value)) return '';
						value = tf.dataFormatHelper.phoneFormatter(value);
						return value;
					};
					break;
				case "System Field":
					{
						let targetUdfFieldGuid = self.options.UDGridFields.find(x => x.Guid === col).editType.targetField;
						let targetUdf = self.recordEntity.UserDefinedFields.find(x => x.Guid === targetUdfFieldGuid);
						if (targetUdf)
						{
							let udfDatasourceIds = targetUdf.UDFDataSources.map(x => x.DBID);
							if (udfDatasourceIds.indexOf(tf.datasourceManager.databaseId) < 0)
							{
								self._ignoredColumnNames.push(col);
								return;
							}
						} else
						{
							self._ignoredColumnNames.push(col);
							return;
						}
					}
					break;
				case "List From Data":
					const fieldName = udgField.FieldOptions.UDFPickListOptions.field.name;
					if (fieldName === "RidershipStatus")
					{
						column.template = function(resValue)
						{
							return TF.DetailView.UserDefinedGridHelper.getRidershipStatusTemp(resValue, udgField.Guid);
						}
					}
					else if (fieldName === "PolicyDeviation")
					{
						column.template = function(resValue)
						{
							return TF.DetailView.UserDefinedGridHelper.getPolicyDeviationTemp(resValue, udgField.Guid);
						}
					}
					break;
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
				column.headerTemplate = GetQuestionHeaderTemplate(originFieldMapping[col]);
				columns.push(column);
			}

			if (udgField.questionType === "ListFromData" || (udgField.questionType === "List" && udgField.FieldOptions.PickListMultiSelect))
			{
				let fieldName = column.FieldName;
				column.type = "select";
				column.ListFilterTemplate = tf.udgHelper.generateListFilterTemplate(udgField, "");
				column.ListFilterTemplate.filterField = fieldName;
				column.ListFilterTemplate.columnSources = [{ FieldName: fieldName, DisplayName: column.DisplayName, Width: "150px", type: "string", isSortItem: true }];
				// add AllItems
				column.ListFilterTemplate.requestOptions = tf.udgHelper.getRequestOption(udgField);

			}

			if (udgField.questionType === "ListFromData" && udgField.template !== undefined && column.template === undefined)
			{
				column.template = udgField.template;
			}

			if (udgField.questionType === "List" && !udgField.FieldOptions.PickListMultiSelect)
			{
				let pickUpList = [];
				udgField.FieldOptions.UDFPickListOptions.forEach(plo =>
				{
					pickUpList.push(plo.PickList);
				});
				column.ListFilterTemplate = {
					listFilterType: 'Enum',
					sortType: 'byAllItems',
					AllItems: pickUpList,
					leftGridWithSearch: true,
					EnumListFilterColumnName: "Display Name",
					DisplayFilterTypeName: "Options"
				}
			}

			function GetQuestionHeaderTemplate(displayName)
			{
				return `<span title="${displayName}" style="overflow: hidden;text-overflow: ellipsis;">${displayName}</span>`;
			}

			return;
		}
	}
})();