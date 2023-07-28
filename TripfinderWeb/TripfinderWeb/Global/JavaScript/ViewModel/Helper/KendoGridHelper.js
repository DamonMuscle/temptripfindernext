(function ()
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
	KendoGridHelper.prototype.createSimpleGrid = function ($container, options)
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

	KendoGridHelper.prototype.setGridOnDemandAction = function (kendoGrid, onDemandActions)
	{
		if (!onDemandActions || onDemandActions.length == 0)
		{
			return;
		}
		var kendoGridElement = $(kendoGrid.element);

		kendoGrid.bind("change", function ()
		{
			var $container = kendoGridElement.find(".k-grid-content"),
				$onDemandContainer = $container.find(".on-demand-container"),
				$containerColor = $onDemandContainer.data("tr")?.children("td")?.css("background-color");

			var color = (!$containerColor || $containerColor == "rgba(0, 0, 0, 0)") ? 'white' : $containerColor;

			$onDemandContainer.css({
				background: color //Avoid the background color to be set as transparent rgba(0, 0, 0, 0)
			});
		});

		kendoGrid.bind("dataBound", function ()
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

			kendoGridElement.find(".k-grid-content tbody>tr").each(function (index, item)
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

		kendoGridElement.find(".k-virtual-scrollable-wrap").on("scroll", function ()
		{
			kendoGridElement.find(".on-demand-container").css({
				right: -$(this).scrollLeft()
			});
		});

		kendoGridElement.delegate(".k-grid-content tbody>tr", "mouseenter", function ()
		{
			var $tr = $(this),
				$container = $tr.closest("table").parent(),
				$onDemandContainer = $container.children(".on-demand-container");
			if ($onDemandContainer.length == 0)
			{
				$onDemandContainer = $("<div class='on-demand-container'></div>");
				onDemandActions.forEach(function (action)
				{
					var button = $(action.template);
					button.on("click", function (e)
					{
						var tr;
						$container.find("tr").each(function (index, item)
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

			setButtonDisableStatus($onDemandContainer, onDemandActions, $tr);

			$onDemandContainer.data("tr", $tr).css({
				height: $tr.height() - 1,// border width
				top: $tr.offset().top + $container.scrollTop() - $container.offset().top,
				right: -$container.scrollLeft(),
				background: $tr.children("td").css("background-color") == "rgba(0, 0, 0, 0)" ? 'white' : $tr.children("td").css("background-color")//Avoid the background color to be set as transparent rgba(0, 0, 0, 0)
			}).show();

			var iconHeight = 12;
			$onDemandContainer.find("a").css("margin-top", ($tr.height() - iconHeight) / 2 + "px");
		}).on("mouseleave", function (e)
		{
			hideOnDemandAction(e);
		});

		function setButtonDisableStatus(onDemandContainer, onDemandActions, $tr)
		{
			onDemandActions.forEach(function (action, index)
			{
				var button = onDemandContainer.children().eq(index);
				if ($.isFunction(action.disable) && action.disable(kendoGrid.dataItem($tr)))
				{
					button.hide();
				} else
				{
					button.show();
				}
			});
		}

		function hideOnDemandAction(e)
		{
			// hide action when outside table
			clearTimeout(kendoGrid.timeoutOnDemandAction);
			kendoGrid.timeoutOnDemandAction = setTimeout(function ()
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
	KendoGridHelper.prototype.setGridDataSource = function (kendoGrid, dataSource, options)
	{
		var self = this,
			columns = options.columns,
			sort = options.sort,
			totalCountHidden = options.totalCountHidden,
			afterRenderCallback = options.afterRenderCallback;

		return Promise.resolve(typeof dataSource === 'function' ? dataSource() : dataSource)
			.then(function (result)
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

				self.handleListFromDataColumns(columns, dataItems);
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


	KendoGridHelper.prototype.handleListFromDataColumns = function (columns, dataItems)
	{
		var listFromDataColumns = columns.filter((item) =>
		{
			return item.originalUdfField && item.originalUdfField.questionType && item.originalUdfField.questionType === "ListFromData";
		});
		if (listFromDataColumns.length > 0)
		{
			listFromDataColumns.forEach((listFromDataColumn) =>
			{
				var lfdColumnGuid = listFromDataColumn.field;
				if (dataItems.length > 0)
				{
					dataItems.forEach((item) =>
					{
						if (item[lfdColumnGuid] && item[lfdColumnGuid].length > 0)
						{
							var lfdValues = item[lfdColumnGuid].map((lfd) =>
							{
								return lfd.value;
							});
							item[`${lfdColumnGuid}_originalValue`] = item[lfdColumnGuid];
							item[lfdColumnGuid] = lfdValues.join(', ');
						}
					});
				}
			});
		}
	};

	/**
	 * Get grid definition by data type.
	 *
	 * @param {String} type
	 * @returns
	 */
	KendoGridHelper.prototype.getGridColumnsFromDefinitionByType = function (type)
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
				columns = tf.contactGridDefinition.gridDefinition().Columns;
				break;
			case "contactinformation":
				columns = tf.contactGridDefinition.gridDefinition("contactinformation").Columns;
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
						Width: "100px",
						template: function(dataItem)
						{
							return tf.applicationTerm.getApplicationTermSingularByName(dataItem.Type);
						}
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
						template: "<span>#: ProhibitCross ? 'yes' : 'no' #</span>"
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
						template: "<span>#: ProhibitCross ? 'yes' : 'no' #</span>"
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
					},
					{
						FieldName: "IsException",
						DisplayName: "Exception",
						width: "100px",
						type: "boolean",
					}
				];
				break;
			case "attendancegrids":
				columns = [
					{
						FieldName: "AttendanceDate",
						DisplayName: "Attendance Date",
						width: "160px",
						type: "date",
					},
					{
						FieldName: "TripName",
						DisplayName: "Trip Name",
						width: "150px",
						type: "string"
					},
					{
						FieldName: "StopLocation",
						DisplayName: "Stop Location",
						width: "200px",
						type: "string"
					},
					{
						FieldName: "ActualStopTime",
						DisplayName: "Actual Stop Time",
						width: "150px",
						type: "time",
					},
					{
						FieldName: "Unplanned",
						Width: '150px',
						type: "boolean",
						template: item => !item.Unplanned ? "" : ((item.Unplanned || "false").toLowerCase() === "true" ? "True" : "False")
					},
					{
						FieldName: "CreatedOn",
						DisplayName: "Created On",
						width: "150px",
						type: "datetime",
						hidden: true
					}
				];
				break;
			case "studenttagids":
				columns = [
					{
						FieldName: "TagId",
						DisplayName: "Card ID",
						type: "string",
					},
					{
						FieldName: "StartDate",
						DisplayName: "Start Datetime",
						type: "string",
						template: "<span>#: moment(StartDate).format('MM/DD/YYYY hh:mm A') #</span>"
					},
					{
						FieldName: "EndDate",
						DisplayName: "End Datetime",
						type: "string",
						template: "<span>#: EndDate?moment(EndDate).format('MM/DD/YYYY hh:mm A'):'' #</span>"
					}
				];
				break;
			case "communicationhistory":
				columns = tf.communicationHistoryGridDefinition.gridDefinition().Columns;
				break;
			default:
				break;
		}

		return tf.measurementUnitConverter.handleUnitOfMeasure(columns);
	};

	KendoGridHelper.renderDateRange = function (startDate, endDate)
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

	KendoGridHelper.dataSourceRenderDateRange = function (startDate, endDate)
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
			return "";
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
	KendoGridHelper.prototype.getDefinitionLayoutColumns = function (columns)
	{
		return Enumerable.From(columns).Where(function (c)
		{
			return !c.onlyForFilter;
		}).Select(function (c)
		{
			function updateString(str)
			{
				$.each(tf.APPLICATIONTERMDEFAULTVALUES, function (_, defaultTerm)
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
	KendoGridHelper.prototype.getKendoField = function (columns)
	{
		var fields = {};
		columns.forEach(function (definition)
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

	KendoGridHelper.prototype.updateGridFooter = function ($grid, filterCount, totalCount)
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
	KendoGridHelper.prototype.getKendoColumnsExtend = function (currentColumns)
	{
		var defaultColumnWidth = "80px";
		var columns = currentColumns.map(function (definition)
		{
			var column = definition;
			var widthOfPerChar = 7;
			column.field = definition.FieldName;
			column.title = definition.DisplayName;
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
		return columns;
	};

	KendoGridHelper.prototype.getDateTimeFields = function (gridType)
	{
		let specificGridDefinition = null;
		switch (gridType)
		{
			case "form":
				specificGridDefinition = tf.formGridDefinition;
				break;
			case "forms":
				specificGridDefinition = tf.formsGridDefinition;
				break;
			case "scheduledmergedocument":
				specificGridDefinition = tf.scheduledMergeDocumentGridDefinition;
				break;
			case "session":
				specificGridDefinition = tf.sessionGridDefinition;
				break;
			case "altsite":
				specificGridDefinition = tf.altsiteGridDefinition;
				break;
			case "contact":
				specificGridDefinition = tf.contactGridDefinition;
				break;
			case "contractor":
				specificGridDefinition = tf.contractorGridDefinition;
				break;
			case "district":
				specificGridDefinition = tf.districtGridDefinition;
				break;
			case "document":
				specificGridDefinitionl = tf.documentGridDefinition;
				break;
			case "fieldtrip":
				specificGridDefinition = tf.fieldTripGridDefinition;
				break;
			case "georegion":
				specificGridDefinition = tf.georegionGridDefinition;
				break;
			case "gpsevent":
				specificGridDefinition = tf.gpsEventGridDefinition;
				break;
			case "route":
				specificGridDefinition = tf.routeGridDefinition;
				break;
			case "school":
				specificGridDefinition = tf.schoolGridDefinition;
				break;
			case "staff":
				specificGridDefinition = tf.staffGridDefinition;
				break;
			case "student":
				specificGridDefinition = tf.studentGridDefinition;
				break;
			case "studentattendanceschedule":
				specificGridDefinition = tf.studentScheduleGridDefinition;
				break;
			case "trip":
				specificGridDefinition = tf.tripGridDefinition;
				break;
			case "tripschedule":
				specificGridDefinition = tf.tripScheduleGridDefinition;
				break;
			case "tripstop":
				specificGridDefinition = tf.tripStopGridDefinition;
				break;
			case "tripstopschedule":
				specificGridDefinition = tf.tripStopScheduleGridDefinition;
				break;
			case "vehicle":
				specificGridDefinition = tf.vehicleGridDefinition;
				break;
			case "mergedocument":
				specificGridDefinition = tf.mergeDocumentGridDefinition;
				break;
			case "mergeemailmessage":
				specificGridDefinition = tf.mergeEmailMessageGridDefinition;
				break;
			case "mergeDocumentLibrary":
				specificGridDefinition = tf.mergeDocumentLibraryGridDefinition;
				break;
			case "scheduledmergedocument":
				specificGridDefinition = tf.scheduledMergeDocumentGridDefinition;
				break;
			case "mergeDocumentsSent":
				specificGridDefinition = tf.mergeDocumentsSentGridDefinition;
				break;
			case "report":
				specificGridDefinition = tf.reportGridDefinition;
				break;
			case "reportlibrary":
				specificGridDefinition = tf.ReportLibraryGridDefinition;
				break;
			case "scheduledreport":
				specificGridDefinition = tf.scheduledReportGridDefinition;
				break;
			case "scheduledReportsSent":
				specificGridDefinition = tf.scheduledReportsSentGridDefinition;
				break;
			case "reminder":
				specificGridDefinition = tf.reminderGridDefinition;
				break;
		}

		if (specificGridDefinition)
		{
			return specificGridDefinition.gridDefinition().Columns.filter(x => x.isUTC).map(x => x.FieldName);
		}
		return [];
	}

	/**
	 * Get default sorting columns
	 *
	 * @param {string} gridType
	 * @param {string} defaultField
	 * @returns
	 */
	KendoGridHelper.prototype.getDefaultSortItems = function (gridType, defaultField)
	{
		var sortFields = [defaultField];
		switch (gridType)
		{
			case "altsite":
			case "contractor":
			case "district":
			case "document":
			case "georegion":
			case "school":
			case "trip":
			case "tripstop":
			case "route":
			case "fieldtriplocation":
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
			case "fieldtripinvoice":
				sortFields = ["PublicID"];
				break;
		}

		return sortFields.map(field => ({
			Name: field,
			isAscending: "asc",
			Direction: "Ascending"
		}));
	};

	KendoGridHelper.prototype.isCurrentDBFilter = function (filterDBID)
	{
		return filterDBID == null || filterDBID === tf.datasourceManager.databaseId;
	}

	//#region open in

	const SUPPORTED_OPENIN_PRODUCTS = {
		"Viewfinder": {
			generateUrl: (url) => pathCombine(url, "/#/nw"),
			excludeGridTypes: ['fieldtriplocation']
		},
		"Routefinder Plus": {
			generateUrl: (url) => pathCombine(url, "/en-US/html/#/nw"),
			excludeGridTypes: ['fieldtriplocation']
		},
		"Tripfinder": {
			generateUrl: (url) => pathCombine(location.origin, location.pathname, "/#/nw"),
		}
	};
	const basicGenerateUrl = (url) => pathCombine(url, "/#/nw");

	/**
	 * Get supported products for "Open In".
	 *
	 * @param {Array} products
	 * @param {string} gridType
	 * @param {boolean} requireLicense
	 * @param {boolean} excludeCurrent
	 * @returns
	 */
	KendoGridHelper.getShareableProducts = function (products, gridType, requireLicense, excludeCurrent)
	{
		const authorizedAppNames = tf.helpers.applicationDataHelper.getAuthorizedApplicationData().map(o => o.Name);
		const currentProductName = TF.productName === "routefinder" ? "Routefinder Plus" : TF.productName;

		return products
			.filter(p =>
			{
				// to fix inconsistent plus name in vendor and DB.
				if (p.Name === "RoutefinderPlus")
				{
					p.Name = "Routefinder Plus";
				}

				const supportInfo = SUPPORTED_OPENIN_PRODUCTS[p.Name];

				return supportInfo
					&& !(excludeCurrent && p.Name === currentProductName)
					&& (!requireLicense || authorizedAppNames.includes(p.Name)
						|| tf.authManager.authorizationInfo.authorizationTree.applications.includes(supportInfo.securedAppName))
					&& (!Array.isArray(supportInfo.supportedGridTypes) || supportInfo.supportedGridTypes.includes(gridType))
					&& (!Array.isArray(supportInfo.excludeGridTypes) || !supportInfo.excludeGridTypes.includes(gridType));
			}).sort((a, b) =>
			{
				// ensure current product is on top
				return a.Name === currentProductName ? -1 :
					(b.Name === currentProductName ? 1 :
						(a.Name > b.Name ? 1 : -1));
			});
	};

	KendoGridHelper.createShareURL = function (type, selectedIds, layoutColumns, targetProduct, thematicSetting, addtionalInfo)
	{
		return tf.helpers.gridLinkHelper.createGridLink(tf.datasourceManager.databaseId, type, selectedIds, layoutColumns, thematicSetting, addtionalInfo)
			.then((gridLink) =>
			{
				if (!gridLink) { return; }

				var url;
				var targetProductName = targetProduct.Name;
				const supportInfo = SUPPORTED_OPENIN_PRODUCTS[targetProductName];

				if (supportInfo && typeof supportInfo.generateUrl === 'function')
				{
					url = supportInfo.generateUrl(targetProduct.Uri);
				}
				else
				{
					url = basicGenerateUrl(targetProduct.Uri);
				}

				if (type == "gpsevent")
				{
					var prefix = tf.helpers.applicationDataHelper.FindByName(targetProductName);
					tf.userPreferenceManager.UserPreferenceDataList.forEach(item =>
					{
						if (item.Key.includes("gpsevent.listFilterWithSelectDateTimeRange"))
						{
							tf.userPreferenceManager.save(prefix + item.Key.substr(item.Key.indexOf(".")), item.Value);
						}
					});
				}

				if (url)
				{
					url += "?" + $.param({ GridLinkGuid: gridLink.GUID });
				}

				return url;
			});
	}

	KendoGridHelper.openInGrid = function (type, selectedIds, layoutColumns, targetProduct)
	{
		TF.Helper.KendoGridHelper.createShareURL(type, selectedIds, layoutColumns, targetProduct)

			.then((url) =>
			{
				if (url)
				{
					window.open(url, "_blank", "");
				}
			});
	};

	KendoGridHelper.loadGridLink = function (guid)
	{
		if (!guid) { return Promise.resolve(null); }

		return tf.helpers.gridLinkHelper.getGridLink(guid)
		.then((gridLink) =>
		{
			if (!gridLink)
			{
				tf.promiseBootbox.alert("This GridLink is invalid. Please contact with the sharer to login with correct client id.");
				return;
			}

			if (!gridLink.isAuthorized)
			{
				const noPermissionWarningMsg = "You don't have permissions for this URL link.";
				tf.promiseBootbox.alert(noPermissionWarningMsg);
				return;
			}

			const switchDatasourceConfirmMsg = "The URL leads to a different data source, switching data source would cause opened tabs closed. Are you sure you want to continue?";
			let loadDatasourceTask = gridLink.DBID === tf.datasourceManager.databaseId
				? Promise.resolve(true) :
				tf.promiseBootbox.confirm(
				{
					message: switchDatasourceConfirmMsg,
					title: "Confirmation Message"
				})
				.then((result) =>
				{
					if (!result)
					{
						return false;
					}

					return tf.datasourceManager.findDatabaseById(gridLink.DBID)
					.then(targetDB =>
					{
						if (!targetDB) { return false; }

						return tf.datasourceManager.choose(targetDB, true)
						.then(() => true);
					});
				});

			return loadDatasourceTask.then((shouldProceed) =>
			{
				if (!shouldProceed) { return; }

				const { DataTypeId, Ids, Layout, ThematicSetting, AdditionalInfo } = gridLink;

				let layoutColumns = null;
				const gridType = tf.dataTypeHelper.getKeyById(DataTypeId);
				const gridTerm = tf.dataTypeHelper.getFormalDataTypeName(gridType);
				const gridLabel = tf.applicationTerm.getApplicationTermPluralByName(gridTerm);
				const filterName = `${gridLabel} (Selected Records)`;

				let thematicSetting = null
				if (ThematicSetting)
				{
					const { customDisplaySetting, quickFilters } = JSON.parse(ThematicSetting);
					thematicSetting = {
						CustomDisplaySetting: JSON.stringify(customDisplaySetting),
						QuickFilters: JSON.stringify(quickFilters)
					}
				}

				try
				{
					layoutColumns = JSON.parse(Layout);
				}
				catch (e)
				{
					layoutColumns = null;
				}

				let pageType = null;
				if (AdditionalInfo)
				{
					try
					{
						const additionalInfoObj = JSON.parse(AdditionalInfo);
						pageType = additionalInfoObj?.pageType;
					}
					catch
					{
						// do nothing
					}
				}
				if (!pageType)
				{
					const dataTypes = tf.dataTypeHelper.getAvailableDataTypes();
					const dataType = dataTypes.find(dt => dt.key === gridType);
					pageType = dataType ? dataType.pageType : "fieldtrips";
				}

				tf.storageManager.delete(tf.storageManager.gridCurrentQuickFilter(gridType));
				return {
					filteredIds: Ids.split(','),
					gridType: gridType,
					pageType: pageType,
					filterName: filterName,
					layoutColumns: layoutColumns,
					thematicSetting: thematicSetting,
					additionalInfo: AdditionalInfo
				};
			});
		});
	};
	//#endregion

	KendoGridHelper.getStringOfRecords = function (records, columns)
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

			if ($.isFunction(column.template))
			{
				return column.template(theRecord);
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
					if (!column.format)
					{
						column = setColumnFormat(column);
					}
					return kendo.format(column.format, value);
				}
				else
				{
					return "";
				}
			}

			if (column.questionType === 'Phone' || column.UDFType === 'phone number'
				|| ((!column.questionType && !column.UDFType)
					&& (column.FieldName.endsWith("Phone") || column.FieldName.endsWith("Fax"))))
			{
				return tf.dataFormatHelper.phoneFormatter(value);
			}

			return value;
		}

		function setColumnFormat(column)
		{
			switch (column.type)
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
			return column;
		}
	};

	KendoGridHelper.getListOfRecords = function (records, columns)
	{
		var data = [[]];
		for (var i = 0; i < columns.length; i++)
		{
			data[0].push(columns[i].DisplayName);
		}
		for (i = 0; i < records.length; i++)
		{
			var theRecord = records[i];
			var record = [];
			for (var j = 0; j < columns.length; j++)
			{
				var value = theRecord[columns[j].FieldName];
				if ($.isArray(value))
				{
					value = value.length == 0 ? "" : value.toString();
				}
				record.push(value);
			}
			data.push(record);
		}
		return data;
	};
})();