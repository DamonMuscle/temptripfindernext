(function()
{
	createNamespace("TF.Grid").KendoGridSummaryGrid = KendoGridSummaryGrid;

	function KendoGridSummaryGrid()
	{
		this.obSummaryGridVisible = ko.observable(false);
		this.summaryHeight = 83;
		if (TF.isMobileDevice)
		{
			this.summaryHeight = 65;
		}
		this.obSummaryGridVisible.subscribe(this.fitContainer, this);
		this.obSummaryGridVisible.subscribe(this._updateCurrentLayout, this);
		this.obSummaryGridVisible.subscribe(this.hiddenScrollX, this);
		this.$summaryContainer = this.$container.next(".kendo-summarygrid-container");
		this.summaryKendoGrid = null;
		this.obAggregationMap = ko.observable({});
		this.obAggregationMap.subscribe(this._updateCurrentLayout, this);
		this.bindOnClearFilterEvent();
	}

	KendoGridSummaryGrid.prototype.createSummaryGrid = function()
	{
		// var scrollLeft = 0;
		// this.summaryKendoGrid = this.$summaryContainer.data("kendoGrid"),
		// 	this.summaryKendoGrid && (scrollLeft = this.$summaryContainer.find(".k-grid-content").scrollLeft(),
		// 		this.summaryKendoGrid.destroy(),
		// 		this.$summaryContainer.empty());
		// var data = {};
		// this.kendoGrid.getOptions().columns.forEach(function(scrollLeft)
		// {
		// 	data[scrollLeft.field] = ""
		// });

		var scrollLeft = 0;
		this.summaryKendoGrid = this.$summaryContainer.data("kendoGrid");
		if (this.summaryKendoGrid)
		{
			scrollLeft = this.$summaryContainer.find(".k-grid-content").scrollLeft();
			this.summaryKendoGrid.destroy();
			this.$summaryContainer.empty();
		}


		var data = {};
		this.kendoGrid.getOptions().columns.forEach(function(item)
		{
			data[item.field] = "";
		});

		this.$summaryContainer.kendoGrid({
			dataSource: {
				data: [data],
				schema: {
					model: {
						fields: this.getSummaryField()
					}
				}
			},
			height: 40,
			filterable: {
				extra: !1,
				mode: "row"
			},
			columns: this.getSummaryColumns()
		});
		this.summaryKendoGrid = this.$summaryContainer.data("kendoGrid");
		this.initSummaryGridDataSource();
		this.reRenderSummaryGrid();
		this.$summaryContainer.find(".k-grid-content").scrollLeft(scrollLeft);
		this.resetWidth();
	};

	KendoGridSummaryGrid.prototype.resetWidth = function()
	{
		var currentPanelWidth = this.$container.parent().width();
		var lockedHeaderWidth = this.$container.find('.k-grid-header-locked').width();
		//var paddingRight = parseInt(this.$container.find(".k-grid-content").css("padding-right"));

		//this.$summaryContainer.find(".k-grid-content").width(currentPanelWidth - lockedHeaderWidth - paddingRight - 2);
		this.$summaryContainer.find(".k-auto-scrollable, .k-grid-content").width(currentPanelWidth - lockedHeaderWidth - 2);
	}

	KendoGridSummaryGrid.prototype.createSummaryFilterClearAll = function()
	{
		var tr = this.$summaryContainer.find("div.k-grid-header-locked").find("tr.k-filter-row");
		if (tr != undefined)
		{
			var td = tr.children("th:first");
			td.text("");
			var div = $('<div class="summary-filter-clear-all"></div>');
			td.append(div);

			var that = this;
			div.click(function()
			{
				var buttons = that.$summaryContainer.find("tr.k-filter-row").find("button.k-button");
				if (buttons != undefined)
				{
					buttons.trigger("click");
				}
			});
		}
	};

	KendoGridSummaryGrid.prototype.initSummaryGridDataSource = function()
	{
		var aggregations = this.obAggregationMap(), filter = [];
		for (var key in aggregations)
		{
			if (aggregations[key])
			{
				this.onSummaryDropDownChange(aggregations[key], key);
				filter.push({ field: key, operator: "eq", value: aggregations[key] });
			}
		}
		this.summaryKendoGrid.dataSource.filter(filter);
	};

	KendoGridSummaryGrid.prototype.bindScrollXEvent = function()
	{
		var self = this;
		var timeoutEvent = null;
		this.$summaryContainer.find(".k-grid-content").off("scroll.summarybar").on("scroll.summarybar", function(e)
		{
			var $target = $(e.target),
				grid = self.$container.find(".k-virtual-scrollable-wrap").length > 0 ? self.$container.find(".k-virtual-scrollable-wrap") : self.$container.find(".k-grid-content");
			grid.scrollLeft($target.scrollLeft());
			clearTimeout(timeoutEvent);
			timeoutEvent = setTimeout(function()
			{
				var $target = $(e.target);
				grid.scrollLeft($target.scrollLeft());
			}, 50);
		});

	};

	KendoGridSummaryGrid.prototype.hiddenScrollX = function()
	{
		if (this.obSummaryGridVisible && this.obSummaryGridVisible())
		{
			this.$container.find(".k-grid-content,.k-virtual-scrollable-wrap").scrollLeft(0);
			this.$container.addClass("summarybar-showing");
		} else
		{
			this.$container.removeClass("summarybar-showing");
		}
	};

	KendoGridSummaryGrid.prototype.updateSummaryGridColumns = function()
	{
		if (this.summaryKendoGrid)
		{
			var scrollLeft = this.$summaryContainer.find(".k-grid-content").scrollLeft();
			var kendoOptions = this.summaryKendoGrid.getOptions();
			kendoOptions.columns = this.getSummaryColumns();
			this.summaryKendoGrid.setOptions(kendoOptions);
			this.reRenderSummaryGrid();
			this.$summaryContainer.find(".k-grid-content").scrollLeft(scrollLeft);
			this.lockSummaryFirstColumn();
			this.resetWidth();
		}
	};

	KendoGridSummaryGrid.prototype.lockSummaryFirstColumn = function() //lock the first column
	{
		var theadTable = this.kendoGrid.lockedHeader.find("table");
		if (this.isColumnLocked && theadTable.children("thead").children("tr").filter(":first").find("th").eq(this.resizeIdx).data("kendoField") == "bulk_menu")
		{
			var summaryHeaderTable = this.summaryKendoGrid.lockedHeader.find("table");
			var summaryBodyTable = this.summaryKendoGrid.lockedTable;
			if (summaryHeaderTable.parent().find("col").length === 1)
			{
				summaryHeaderTable.attr("style", "width:40px");
				summaryBodyTable.attr("style", "width:40px");
			}
			else//if the lock area has more than one column,keep the width of lock area donnot change
			{
				var width = 0;
				for (var i = 0; i < summaryHeaderTable.parent().find("col").length; i++)
				{
					var colItem = summaryHeaderTable.parent().find("col")[i];
					width += parseInt(colItem.style.width.substring(0, colItem.style.width.length - 2));
				}
				summaryHeaderTable.attr("style", "width:" + width + "px");
				summaryBodyTable.attr("style", "width:" + width + "px");
			}
			summaryHeaderTable.parent().find("col").eq(this.resizeIdx).attr("style", "width:40px");
			summaryBodyTable.parent().find("col").eq(this.resizeIdx).attr("style", "width:40px");
		}
	};

	KendoGridSummaryGrid.prototype.reRenderSummaryGrid = function()
	{
		this.bindScrollXEvent();
		this.createSummaryFilterClearAll();
		this.fitSummaryGrid();
	};

	KendoGridSummaryGrid.prototype.getSummaryColumns = function()
	{
		var self = this,
			columns = this.kendoGrid.getOptions().columns;
		return columns.map(function(col)
		{
			var item = $.extend({}, col);
			item.dataType = item.type;
			item.type = "string";
			if (item.field === "bulk_menu")
			{
				item.title = "";
				item.headerTemplate = null;
				item.template = null;
				item.filterable = false;
				return item;
			}
			item.filterable = self.getSummaryHeader(item);

			item.template = function(dataItem)
			{
				var value = dataItem[item.field + "_SummaryValue"];
				if (typeof (value) !== "undefined" && value)
				{
					return value;
				}
				return "";
			};
			return item;
		});
	};

	KendoGridSummaryGrid.prototype.getSummaryField = function()
	{
		var fields = {};
		this._gridDefinition.Columns.forEach(function(definition)
		{
			var field = {};
			field.type = "string";
			fields[definition.FieldName] = field;
		});
		return fields;
	};

	KendoGridSummaryGrid.prototype.getSummaryHeader = function(column)
	{
		var self = this;
		var defaultOptions = [{ text: "Count", value: "Count" }, { text: "Distinct count", value: "DistinctCount" }],
			dateTimeOptions = [{ text: "Max", value: "Max" }, { text: "Min", value: "Min" }, { text: "Range", value: "Range" }],
			numberOptions = [{ text: "Average", value: "Average" }, { text: "Sum", value: "Sum" }],
			options;
		switch (column.dataType)
		{
			case 'datetime':
			case 'date':
			case "time":
				options = dateTimeOptions.concat(defaultOptions);
				break;
			case 'integer':
			case 'number':
				options = numberOptions.concat(dateTimeOptions).concat(defaultOptions);
				break;
			default:
				options = defaultOptions;
				break;
		}
		return {
			cell: {
				showOperators: false,
				template: function(args)
				{
					args.element.kendoDropDownList({
						dataTextField: "text",
						dataValueField: "value",
						valuePrimitive: true,
						dataSource: options,
						optionLabel: {
							text: "",
							value: ""
						},
						popup: {
							position: "bottom left",
							origin: "top left"
						},
						animation: {
							open: {
								effects: "slideIn:up"
							}
						},
						change: function(e)
						{
							var dropdown = this;
							$.proxy(self.onSummaryDropDownChange(dropdown.value(), column.FieldName), self);
							self.setObAggregationMap(column.FieldName, dropdown.value());
						}
					});
				}
			}
		};
	};

	KendoGridSummaryGrid.prototype.loadSummary = function(fildName, operator)
	{
		var includeIds = this._gridState.filteredIds;
		var excludeIds = this.getExcludeAnyIds();
		var searchData = new TF.SearchParameters(null, null, null, this.findCurrentHeaderFilters(), this.obSelectedGridFilterClause(), includeIds, excludeIds);
		return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "search", this.options.gridType == "vehicle" ? "fleet" : this.options.gridType, "aggregate"), {
			paramData: { FieldName: fildName, AggregateOperator: operator },
			data: searchData.data,
			traditional: true
		}, { overlay: true });
	};

	KendoGridSummaryGrid.prototype.onSummaryDropDownChange = function(operator, fieldName)
	{
		if (!operator)
		{
			this.setDataSource(fieldName, operator, "");
			return;
		}
		var column = this.kendoGrid.getOptions().columns.filter(function(definition)
		{
			return definition.field === fieldName;
		})[0];

		tf.loadingIndicator.showImmediately();
		this.loadSummary(fieldName, operator).then(function(apiResponse)
		{
			tf.loadingIndicator.tryHide();
			var ans = apiResponse.Items[0];
			if ($.isArray(ans))
			{
				ans = ans.map(function(item)
				{
					return this.getFormatedValue(column, item, operator);
				}.bind(this));
				ans = ans.join(' - ');
			} else
			{
				ans = this.getFormatedValue(column, ans, operator);
			}
			this.setDataSource(fieldName, operator, String(ans));
		}.bind(this));
	};

	KendoGridSummaryGrid.prototype.getFormatedValue = function(column, item, operator)
	{
		var value = $.isArray(item) ? item[0] : item;
		if (column && column.format)
		{
			if (operator == 'Count' || operator == 'DistinctCount')
			{
				return value;
			}
			if ((column.type === "date" || column.type === "time") && new Date(value) != 'Invalid Date')
			{
				value = moment(value).toDate();
				return kendo.format(column.format, value);
			}
			if (operator == 'Average' || ((operator == 'Sum' || operator == 'Min' || operator == 'Max') && column.type == 'number'))
			{
				return kendo.format("{0:n2}", value);
			}
			return kendo.format(column.format, value);
		}
		return value;
	};


	KendoGridSummaryGrid.prototype.setDataSource = function(fieldName, operator, value)
	{
		var data = this.summaryKendoGrid.dataSource.data();
		if (!data || (data.length === 0 && !data[0]))
		{
			data = [{}];
		}
		data[0][fieldName] = operator;
		data[0][fieldName + "_SummaryValue"] = value;
		this.summaryKendoGrid.dataSource.data(data);
		this.fitSummaryGrid();
	};

	KendoGridSummaryGrid.prototype.bindOnClearFilterEvent = function()
	{
		this.$summaryContainer.delegate(".k-filter-row button", "click", function(e)
		{
			var field = $(e.target).closest("[data-kendo-field]").attr("data-kendo-field");
			this.onSummaryDropDownChange("", field);
			this.setObAggregationMap(field, "");
		}.bind(this));
	};

	KendoGridSummaryGrid.prototype.setObAggregationMap = function(field, operator)
	{
		this.obAggregationMap()[field] = operator;
		this.obAggregationMap(this.obAggregationMap());
	};

	KendoGridSummaryGrid.prototype.fitSummaryGrid = function()
	{
		this.$summaryContainer.find('.k-grid-content,.k-grid-content-locked').height(this.summaryHeight);
	};

})();
