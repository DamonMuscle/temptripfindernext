(function()
{
	createNamespace("TF.Helper").KendoGridHelper = KendoGridHelper;
	KendoGridHelper.studentRequirementItemsUrl = "studentrequirementitems";
	KendoGridHelper.studentAdditionalRequirementUrl = "studentadditionalrequirement";

	function KendoGridHelper()
	{
		var self = this;
		self.defaultGridOptions = {
			scrollable: {
				virtual: true
			},
			pageable: {
				numeric: false,
				previousNext: false,
				message: {
					display: " "
				}
			},
			selectable: true,
			sortable: true
		};
	}

	/**
	 * Crearte a simple kendo grid in the container with specified options.
	 *
	 * @param {JQuery} $container
	 * @param {Object} gridOptions
	 * @returns
	 */
	KendoGridHelper.prototype.createSimpleGrid = function($container, options)
	{
		// dataSource itself or its response should have 'dataItems' and 'totalCount'. 
		var self = this, kendoGrid,
			$grid = $container.find(".kendo-grid"),
			gridOptions = $.extend({}, self.defaultGridOptions, options.gridOptions),
			dataSource = options.dataSource;

		if ($grid.length === 0)
		{
			$grid = $("<div />", { class: "kendo-grid" }).appendTo($container);
		}

		gridOptions.columns = self.getKendoColumnsExtend(options.columns);

		kendoGrid = $grid.kendoGrid(gridOptions).data("kendoGrid");
		self.setGridOnDemandAction(kendoGrid, options.onDemandActions);
		self.setGridDataSource(kendoGrid, dataSource, options);
		return kendoGrid;
	};

	KendoGridHelper.prototype.setGridOnDemandAction = function(kendoGrid, onDemandActions)
	{
		if (!onDemandActions || onDemandActions.length == 0)
		{
			return;
		}
		var kendoGridElement = $(kendoGrid.element);

		kendoGrid.bind("change", function()
		{
			// refresh background color
			var $container = kendoGridElement.find(".k-grid-content"),
				$onDemandContainer = $container.find(".on-demand-container");
			if ($onDemandContainer.length)
			{
				$onDemandContainer.css({
					background: $onDemandContainer.data("tr").children("td").css("background-color")
				});
			}
		});

		kendoGrid.bind("dataBound", function()
		{
			// remove when not focus on row
			var isFocus = false,
				$onDemandContainer = kendoGridElement.find("div.on-demand-container");
			var x = 0, y = 0;
			if ($onDemandContainer.length > 0)
			{
				var offset = $onDemandContainer.offset();
				x = offset.top + 2;
				y = offset.left + 2;
			}

			kendoGridElement.find(".k-grid-content tbody>tr").each(function(index, item)
			{
				if (!isFocus)
				{
					var rect = item.getBoundingClientRect();
					if (x < rect.right && x > rect.left && y > rect.top && y < rect.bottom)
					{
						isFocus = true;
					}
				}
			});

			if (!isFocus)
			{
				kendoGridElement.find("div.on-demand-container").hide();
			}
		});

		kendoGridElement.find(".k-virtual-scrollable-wrap").on("scroll", function()
		{
			kendoGridElement.find(".on-demand-container").css({
				right: -$(this).scrollLeft()
			});
		});

		kendoGridElement.delegate(".k-grid-content tbody>tr", "mouseover", function()
		{
			var $tr = $(this),
				$container = $tr.closest("table").parent(),
				$onDemandContainer = $container.children(".on-demand-container");
			if ($onDemandContainer.length == 0)
			{
				$onDemandContainer = $("<div class='on-demand-container'></div>");
				onDemandActions.forEach(function(action)
				{
					var button = $(action.template);
					button.on("click", function(e)
					{
						var tr;
						$container.find("tr").each(function(index, item)
						{
							var rect = item.getBoundingClientRect();
							if (e.clientX < rect.right && e.clientX > rect.left && e.clientY > rect.top && e.clientY < rect.bottom)
							{
								tr = $(item);
							}
						});
						$onDemandContainer.data("tr", tr);
						action.click.call(kendoGrid, { target: tr });
					});
					$onDemandContainer.append(button);
				});
				$onDemandContainer.css({
					position: "absolute",
					top: 0,
					right: 0,
					padding: "0 12px",
					"box-sizing": "border-box",
					background: 'white'
				});
				$container.append($onDemandContainer);
			}
			$onDemandContainer.data("tr", $tr).css({
				height: $tr.height(),
				top: $tr.offset().top + $container.scrollTop() - $container.offset().top,
				right: -$container.scrollLeft(),
				background: $tr.children("td").css("background-color")
			}).show();

			var iconHeight = 12;
			$onDemandContainer.find("a").css("margin-top", ($tr.height() - iconHeight) / 2 + "px");
		}).on("mouseout", function(e)
		{
			hideOnDemandAction(e);
		}).on("mousemove", function(e)
		{
			hideOnDemandAction(e);
		});

		function hideOnDemandAction(e)
		{
			// hide action when outside table
			clearTimeout(kendoGrid.timeoutOnDemandAction);
			kendoGrid.timeoutOnDemandAction = setTimeout(function()
			{
				var table = kendoGridElement.find(".k-grid-content table");
				var rect = table[0].getBoundingClientRect();
				var rectContent = kendoGridElement.find(".k-grid-content")[0].getBoundingClientRect();
				if (e.clientX > rect.right || e.clientX < rect.left || e.clientY < rectContent.top || e.clientY > Math.min(rect.bottom, rectContent.bottom))
				{
					var $container = table.parent(),
						$onDemandContainer = $container.children(".on-demand-container");
					$onDemandContainer.hide();
				}
			}, 10);
		}
	};

	/**
	 * Set data source for the grid.
	 *
	 * @param {Object} kendoGrid
	 */
	KendoGridHelper.prototype.setGridDataSource = function(kendoGrid, dataSource, options)
	{
		var self = this,
			columns = options.columns,
			sort = options.sort,
			totalCountHidden = options.totalCountHidden,
			afterRenderCallback = options.afterRenderCallback;

		return Promise.resolve(typeof dataSource === 'function' ? dataSource() : dataSource)
			.then(function(result)
			{
				if (kendoGrid == null || kendoGrid.element == null)
				{
					return;
				}
				// data means that this is a grid template with no information.
				var dataItems = [], totalCount = 0;
				if (result)
				{
					dataItems = result.dataItems;
					totalCount = result.totalCount;
				}

				kendoGrid.setDataSource(new kendo.data.DataSource({
					schema: {
						model: {
							fields: self.getKendoField(columns)
						}
					},
					data: dataItems,
					sort: sort,
					pageSize: 50
				}));

				self.updateGridFooter(kendoGrid.element, dataItems.length, totalCountHidden ? null : totalCount);

				// customized callback after render is done
				if (afterRenderCallback && typeof afterRenderCallback === 'function')
				{
					afterRenderCallback(kendoGrid, dataItems);
				}
			});
	};

	/**
	 * Get grid definition by data type.
	 *
	 * @param {String} type
	 * @returns
	 */
	KendoGridHelper.prototype.getGridColumnsFromDefinitionByType = function(type)
	{
		var self = this, columns = [];
		switch (type.toLowerCase())
		{
			case "aide":
			case "driver":
			case "staff":
				columns = tf.staffGridDefinition.gridDefinition().Columns;
				break;
			case "altsite":
				columns = tf.altsiteGridDefinition.gridDefinition().Columns;
				break;
			case "contractor":
				columns = tf.contractorGridDefinition.gridDefinition().Columns;
				break;
			case "document":
				columns = tf.documentGridDefinition.gridDefinition().Columns;
				break;
			case "district":
				columns = tf.districtGridDefinition.gridDefinition().Columns;
				break;
			case "fieldtrip":
				columns = tf.fieldTripGridDefinition.gridDefinition().Columns;
				break;
			case "fieldtripresource":
				columns = tf.fieldTripGridDefinition.getRelatedGridDefinition("resource").Columns;
				break;
			case "fieldtripvehicle":
				columns = tf.fieldTripGridDefinition.getRelatedGridDefinition("vehicle").Columns;
				break;
			case "fieldtripdriver":
				columns = tf.fieldTripGridDefinition.getRelatedGridDefinition("driver").Columns;
				break;
			case "fieldtripaide":
				columns = tf.fieldTripGridDefinition.getRelatedGridDefinition("aide").Columns;
				break;
			case "fieldtriphistory":
				columns = tf.fieldTripGridDefinition.getRelatedGridDefinition("history").Columns;
				break;
			case "fieldtripinvoice":
				columns = tf.FieldTripInvoiceGridDefinition.gridDefinition().Columns;
				break;
			case "georegion":
				columns = tf.georegionGridDefinition.gridDefinition().Columns;
				break;
			case "school":
				columns = tf.schoolGridDefinition.gridDefinition().Columns;
				break;
			case "tripstop":
				columns = tf.tripStopGridDefinition.gridDefinition().Columns;
				break;
			case "student":
				columns = tf.studentGridDefinition.gridDefinition().Columns;
				break;
			case "trip":
				columns = tf.tripGridDefinition.gridDefinition().Columns;
				break;
			case "vehicle":
				columns = tf.vehicleGridDefinition.gridDefinition().Columns;
				break;
			case "contact":
				columns = tf.contactGridDefinition.gridDefinition(self.gridType).Columns;
				break;
			case "triphistory":
				columns = tf.TripHistoryGridDefinition.gridDefinition().Columns;
				break;
			case "contactrelationships":
				columns = [
					{
						FieldName: "Id",
						DisplayName: "Id",
						hidden: true,
						onlyForFilter: true
					},
					{
						FieldName: "Name",
						DisplayName: "Name"
					},
					{
						FieldName: "Type",
						DisplayName: "Type",
						Width: "100px"
					}
				];
				break;
			case "file":
				columns = [{
					FieldName: "FileName",
					DisplayName: "File Name",
					title: "File Name",
					width: "150px",
					type: "string"
				}, {
					FieldName: "FileSizeKB",
					DisplayName: "Size(KB)",
					title: "Size(KB)",
					width: "150px",
					type: "string"
				}];
				break;
			case "documentrelationships":
				columns = [
					{
						FieldName: "Id",
						DisplayName: "Id",
						hidden: true,
						onlyForFilter: true
					},
					{
						FieldName: "Name",
						DisplayName: "Name"
					},
					{
						FieldName: "Type",
						DisplayName: "Type",
						Width: "100px"
					}
				];
				break;
			case KendoGridHelper.studentRequirementItemsUrl:
				columns = [
					{
						FieldName: "Session",
						DisplayName: "Type"
					},
					{
						FieldName: "PuLocation",
						DisplayName: "PU Location",
						width: "150px",
					},
					{
						FieldName: "DoLocation",
						DisplayName: "DO Location",
						width: "150px",
					},
					{
						FieldName: "ProhibitCross",
						DisplayName: "Prohibit Cross Street",
						width: "150px",
					}
				];
				break;
			case KendoGridHelper.studentAdditionalRequirementUrl:
				columns = [
					{
						FieldName: "Session",
						DisplayName: "Type"
					},
					{
						FieldName: "PuLocation",
						DisplayName: "PU Location",
						width: "150px",
						template: "<span>#: PuLocation ? PuLocation : 'N/A' #</span>"
					},
					{
						FieldName: "DoLocation",
						DisplayName: "DO Location",
						width: "150px",
						template: "<span>#: DoLocation ? DoLocation : 'N/A' #</span>"
					},
					{
						FieldName: "ProhibitCross",
						DisplayName: "Prohibit Cross Street",
						width: "150px",
						template: "<span>#: ProhibitCross ? ProhibitCross.toString().toUpperCase() : 'FALSE' #</span>"
					},
					{
						FieldName: "Days",
						DisplayName: "Days",
						width: "130px",
					},
					{
						FieldName: "StartDate",
						DisplayName: "Date Range",
						width: "180px",
						template: "<span>#:TF.Helper.KendoGridHelper.renderDateRange(StartDate,EndDate)#</span>"
					}
				];
				break;
			case "studentschedule":
				columns = [
					{
						FieldName: "Type",
						DisplayName: "Type",
						width: "150px",
						type: "string"
					},
					{
						FieldName: "TripName",
						DisplayName: "Trip",
						width: "150px",
						type: "string"
					},
					{
						FieldName: "PuStopName",
						DisplayName: "Pick Up Stop",
						width: "150px",
						type: "string"
					},
					{
						FieldName: "PuStopTime",
						DisplayName: "Pick Up Stop Time",
						width: "150px",
						type: "time",
					},
					{
						FieldName: "DoStopName",
						DisplayName: "Drop Off Stop",
						width: "150px",
						type: "string"
					},
					{
						FieldName: "DoStopTime",
						DisplayName: "Drop Off Stop Time",
						width: "150px",
						type: "time"
					},
					{
						FieldName: "WalkToStopDistance",
						DisplayName: "Walk To Stop",
						width: "100px",
						type: "number"
					},
					{
						FieldName: "CrossStatus",
						DisplayName: "Street Crossing",
						width: "100px",
						type: "boolean",
					},
					{
						FieldName: "Bus",
						DisplayName: "Bus",
						width: "80px",
						type: "string"
					},
					{
						FieldName: "RideTime",
						DisplayName: "Ride Time",
						width: "100px",
						type: "integer"
					},
					{
						FieldName: "Days",
						DisplayName: "Days",
						width: "130px",
						type: "string",
						encoded: false
					},
					{
						FieldName: "DateRange",
						DisplayName: "Date Range",
						width: "180px",
						type: "string",
						encoded: false,
					}
				];
				break;
			default:
				break;
		}

		return columns;
	};

	KendoGridHelper.renderDateRange = function(startDate, endDate)
	{
		if (startDate && typeof startDate === "string")
		{
			var start = moment(startDate);
			if (start.year() === 1 && start.month() === 0 && start.date() === 1)
			{
				startDate = null;
			}
		}

		if (endDate && typeof endDate === "string")
		{
			var end = moment(endDate);
			if (end.year() === 9999 && end.month() === 11 && end.date() === 31)
			{
				endDate = null;
			}
		}

		if (startDate && endDate)
		{
			return moment(startDate).format("L") + " - " + moment(endDate).format("L");
		}

		if (!startDate && !endDate)
		{
			return "Always";
		}

		if (!startDate)
		{
			return "Until " + moment(endDate).format("L");
		}

		return "Starting " + moment(startDate).format("L");
	};

	/**
	 * Format kendo grid columns from definition columns.
	 *
	 * @param {Array} columns
	 * @returns
	 */
	KendoGridHelper.prototype.getDefinitionLayoutColumns = function(columns)
	{
		return Enumerable.From(columns).Where(function(c)
		{
			return !c.onlyForFilter;
		}).Select(function(c)
		{
			function updateString(str)
			{
				$.each(tf.APPLICATIONTERMDEFAULTVALUES, function(_, defaultTerm)
				{
					if (tf.applicationTerm[defaultTerm.Term])
					{
						if (str.indexOf(defaultTerm.Singular) > -1)
						{
							str = str.replace(new RegExp('\\b' + defaultTerm.Singular + '\\b', 'ig'), tf.applicationTerm[defaultTerm.Term].Singular);
						}
						if (str.indexOf(defaultTerm.Plural) > -1)
						{
							str = str.replace(new RegExp('\\b' + defaultTerm.Plural + '\\b', 'ig'), tf.applicationTerm[defaultTerm.Term].Plural);
						}
						if (str.indexOf(defaultTerm.Abbreviation) > -1)
						{
							str = str.replace(new RegExp('\\b' + defaultTerm.Abbreviation + '\\b', 'ig'), tf.applicationTerm[defaultTerm.Term].Abbreviation);
						}
					}
				});

				return str;
			}

			c.DisplayName = updateString(c.DisplayName || c.FieldName);

			return $.extend({}, c);
		}).ToArray();
	};

	/**
	 * Get kendo fields.
	 *
	 * @param {Array} columns
	 * @returns
	 */
	KendoGridHelper.prototype.getKendoField = function(columns)
	{
		var fields = {};
		columns.forEach(function(definition)
		{
			var field = {};
			switch (definition.type)
			{
				case "string":
				case "boolean":
					field.type = "string";
					break;
				case "integer":
				case "number":
					field.type = "number";
					break;
				case "time":
				case "datetime":
				case "date":
					field.type = "date";
					break;
			}
			field.validation = definition.validation;
			fields[definition.FieldName] = field;
		});
		return fields;
	};

	KendoGridHelper.prototype.updateGridFooter = function($grid, filterCount, totalCount)
	{
		var pageFooter = $grid.find(".k-pager-wrap"),
			footerInfo = pageFooter.find(".count-info"),
			totalCountHidden = totalCount == null;

		if (footerInfo.length > 0 && !totalCountHidden)
		{
			if (typeof totalCount !== "number")
			{
				totalCount = footerInfo.html().split(" ")[2];
			}

			totalCount = Math.max(totalCount, filterCount);
		}

		var content = filterCount + (totalCountHidden ? " item" + (filterCount > 1 ? "s" : "") : (" of " + totalCount));
		if (footerInfo.length > 0)
		{
			footerInfo.html(content);
		}
		else
		{
			pageFooter.append($("<div class='count-info'>" + content + "</div>"));
		}
	};

	/**
	 * Get kendo grid columns with extension.
	 *
	 * @param {Array} currentColumns
	 * @returns
	 */
	KendoGridHelper.prototype.getKendoColumnsExtend = function(currentColumns)
	{
		var defaultColumnWidth = "80px";
		var columns = currentColumns.map(function(definition)
		{
			var column = definition;
			column.field = definition.FieldName;
			column.title = definition.DisplayName;
			if (!column.width)
				column.width = definition.Width || defaultColumnWidth;
			else
				definition.Width = column.width;
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
		return columns;
	};

	/**
	 * Get default sorting columns
	 *
	 * @param {string} gridType
	 * @param {string} defaultField
	 * @returns
	 */
	KendoGridHelper.prototype.getDefaultSortItems = function(gridType, defaultField)
	{
		var sortFields = [defaultField];
		switch (gridType)
		{
			case "altsite":
			case "contractor":
			case "district":
			case "document":
			case "report":
			case "georegion":
			case "school":
			case "trip":
			case "report":
			case "tripstop":
				sortFields = ["Name"];
				break;
			case "contact":
			case "staff":
			case "student":
				sortFields = ["LastName", "FirstName"];
				break;
			case "fieldtrip":
				sortFields = ["PublicId"];
				break;
			case "vehicle":
				sortFields = ["BusNum"];
				break;
		}

		return sortFields.map(field => ({
			Name: field,
			isAscending: "asc",
			Direction: "Ascending"
		}));
	};

	KendoGridHelper.getStringOfRecords = function(records, columns)
	{
		var strRecords = "", strRecord = "";
		for (var i = 0; i < columns.length; i++)
		{
			strRecord += columns[i].DisplayName + "\t";
		}
		strRecords += strRecord + "\n";
		for (i = 0; i < records.length; i++)
		{
			strRecord = "";
			var theRecord = records[i];
			for (var j = 0; j < columns.length; j++)
			{

				let column = columns[j];
				var columnValue = theRecord[column.FieldName];
				// For UDF
				if (columnValue == null)
				{
					columnValue = theRecord[column.DisplayName];
				}
				columnValue = formatData(column, columnValue);
				strRecord += (columnValue == null ? "" : columnValue) + "\t";
			}
			strRecords += strRecord + "\n";
		}
		return strRecords;

		function formatData(column, value)
		{
			if (column.formatCopyValue)
			{
				return column.formatCopyValue(value);
			}

			if (column.type === "date" || column.type === "time" || column.type === "datetime")
			{
				var momentValue = moment(value);
				var validDateValue = value;
				if (column.type === "time")
				{
					validDateValue = moment().format("YYYY-MM-DD") + " " + value;
					momentValue = moment(validDateValue);
				}

				if (new Date(validDateValue) != 'Invalid Date' && momentValue.isValid() === true && validDateValue !== 0)
				{
					value = momentValue.toDate();
					return kendo.format(column.format, value);
				}
				else
				{
					return "";
				}
			}

			return value;
		}
    };
    KendoGridHelper.getListOfRecords = function (records, columns) {
        var data = [[]];
        for (var i = 0; i < columns.length; i++) {
            data[0].push(columns[i].DisplayName);
        }
        for (i = 0; i < records.length; i++) {
            var theRecord = records[i];
            var record = [];
            for (var j = 0; j < columns.length; j++) {
                var value = theRecord[columns[j].FieldName];
                if ($.isArray(value)) {
                    value = value.length == 0 ? "" : value.toString();
                }
                record.push(value);
            }
            data.push(record);
        }
        return data;
    };

})();