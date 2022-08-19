(function()
{
	createNamespace("TF.Grid").KendoGridSummaryGrid = KendoGridSummaryGrid;
	const CLASS_NAME_KGRID_CONTENT = ".k-grid-content";
	const CSS_WDITH30 = "width:30px";

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
		var self = this, scrollLeft = 0;
		self.summaryKendoGrid = self.$summaryContainer.data("kendoGrid");
		if (self.summaryKendoGrid)
		{
			scrollLeft = self.$summaryContainer.find(CLASS_NAME_KGRID_CONTENT).scrollLeft();
			self.summaryKendoGrid.destroy();
			self.$summaryContainer.empty();
		}


		var data = {};
		self.kendoGrid.getOptions().columns.forEach(function(item)
		{
			data[item.field] = "";
		});

		self.$summaryContainer.kendoGrid({
			dataSource: {
				data: [data],
				schema: {
					model: {
						fields: self.getSummaryField()
					}
				}
			},
			height: 40,
			filterable: {
				extra: false,
				mode: "row"
			},
			columns: self.getSummaryColumns(),
			dataBound: function()
			{
				self.resetGridContainerHorizontalLayout();
			}
		});
		self.summaryKendoGrid = self.$summaryContainer.data("kendoGrid");
		self.initSummaryGridDataSource();
		self.reRenderSummaryGrid();
		self.$summaryContainer.find(CLASS_NAME_KGRID_CONTENT).scrollLeft(scrollLeft);
	};

	KendoGridSummaryGrid.prototype.createSummaryFilterClearAll = function()
	{
		var tr = this.$summaryContainer.find("div.k-grid-header-locked").find("tr.k-filter-row");
		if (tr !== undefined)
		{
			var td = tr.children("th:first");
			td.text("");
			var div = $('<div class="summary-filter-clear-all"></div>');
			td.append(div);

			var that = this;
			div.click(function()
			{
				var buttons = that.$summaryContainer.find("tr.k-filter-row").find("button.k-button");
				if (buttons !== undefined)
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
		this.$summaryContainer.find(CLASS_NAME_KGRID_CONTENT).off("scroll.summarybar").on("scroll.summarybar", function(e)
		{
			var $target = $(e.target),
				grid = self.$container.find(".k-virtual-scrollable-wrap").length > 0 ? self.$container.find(".k-virtual-scrollable-wrap") : self.$container.find(CLASS_NAME_KGRID_CONTENT);
			grid.scrollLeft($target.scrollLeft());
			clearTimeout(timeoutEvent);
			timeoutEvent = setTimeout(function()
			{
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
			var scrollLeft = this.$summaryContainer.find(CLASS_NAME_KGRID_CONTENT).scrollLeft();
			var kendoOptions = this.summaryKendoGrid.getOptions();
			kendoOptions.columns = this.getSummaryColumns();
			this.summaryKendoGrid.setOptions(kendoOptions);
			this.reRenderSummaryGrid();
			this.$summaryContainer.find(CLASS_NAME_KGRID_CONTENT).scrollLeft(scrollLeft);
			this.lockSummaryFirstColumn();
		}
	};

	KendoGridSummaryGrid.prototype.lockSummaryFirstColumn = function() //lock the first column
	{
		var theadTable = this.kendoGrid.lockedHeader.find("table");
		if (this.isColumnLocked && theadTable.children("thead").children("tr").filter(":first").find("th").eq(this.resizeIdx).data("kendoField") === "bulk_menu")
		{
			var summaryHeaderTable = this.summaryKendoGrid.lockedHeader.find("table");
			var summaryBodyTable = this.summaryKendoGrid.lockedTable;
			if (summaryHeaderTable.parent().find("col").length === 1)
			{
				summaryHeaderTable.attr("style", CSS_WDITH30);
				summaryBodyTable.attr("style", CSS_WDITH30);
			}
			else//if the lock area has more than one column,keep the width of lock area donnot change
			{
				var width = 0;
				for (var i = 0; i < summaryHeaderTable.parent().find("col").length; i++)
				{
					var colItem = summaryHeaderTable.parent().find("col")[i];
					width += parseInt(colItem.style.width.substring(0, colItem.style.width.length - 2));
				}
				summaryHeaderTable.attr("style", `width:${width}px`);
				summaryBodyTable.attr("style", `width:${width}px`);
			}
			summaryHeaderTable.parent().find("col").eq(this.resizeIdx).attr("style", CSS_WDITH30);
			summaryBodyTable.parent().find("col").eq(this.resizeIdx).attr("style", CSS_WDITH30);
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
			fields[definition.FieldName] = { type: "string" };
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
		console.log(`SearchParameters intialized success! ${!!searchData}`);
		return tf.promiseAjax.post(pathCombine(this.options.url, "aggregate"), {
			paramData: $.extend(true, { FieldName: tf.UDFDefinition.getOriginalName(fildName), AggregateOperator: operator }, this.options.paramData || {}),
			data: this.searchOption.data,
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
				ans = ans === " - " ? "" : ans;
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
		if (!column || !column.format)
		{
			return value;
		}

		if (operator === 'Count' || operator === 'DistinctCount')
		{
			return value;
		}
		if (column.type === "date" || column.type === "time" || column.type === "datetime")
		{
			let formartedValue = "";
			if (column.type === "time")
			{
				value = `${moment().format("YYYY-MM-DD")} ${value}`;
			}
			var momentValue = moment(value);
			if (momentValue.isValid() === true)
			{
				value = momentValue.toDate();
				formartedValue = kendo.format(column.format, value);
			}
			return formartedValue
		}
		if (operator === 'Average' || ((operator === 'Sum' || operator === 'Min' || operator === 'Max') && column.type === 'number'))
		{
			if (tf.measurementUnitConverter.isNeedConversion(column.UnitInDatabase) && column.UnitOfMeasureSupported)
			{
				value = tf.measurementUnitConverter.convert({
					originalUnit: column.UnitInDatabase || tf.measurementUnitConverter.MeasurementUnitEnum.Metric,
					targetUnit: tf.measurementUnitConverter.getCurrentUnitOfMeasure(),
					isReverse: !!column.UnitOfMeasureReverse,
					value
				});
			}
			return kendo.format("{0:n2}", value);
		}

		return kendo.format(column.format, value);
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
