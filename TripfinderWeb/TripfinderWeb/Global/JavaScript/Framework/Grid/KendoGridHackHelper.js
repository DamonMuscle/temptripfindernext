(function()
{
	createNamespace("TF.Grid").KendoGridFilterCellHackHelper = {
		init: () =>
		{
			let KendoFilterCellPrototype, KendoSelectablePrototype, KendoKendoPopup, KendoFilterMenu;
			window.kendo.widgets.forEach(widget =>
			{
				if (widget.name === 'kendoFilterCell')
					KendoFilterCellPrototype = widget.widget.prototype;
				else if (widget.name === 'kendoSelectable')
					KendoSelectablePrototype = widget.widget.prototype;
				else if (widget.name === 'kendoPopup')
					KendoKendoPopup = widget.widget.prototype;
				else if (widget.name === 'kendoFilterMenu')
					KendoFilterMenu = widget.widget.prototype;
			});

			KendoFilterCellPrototype._refreshUI = KendoFilterCellPrototype._refreshUI.createInterceptor(function()
			{
				let grid = this.element.closest(".kendo-grid").data("lightKendoGrid");
				if (grid)
				{
					grid._refreshUIInterceptorFun(this);
				}
			});

			KendoFilterCellPrototype._refreshUI = KendoFilterCellPrototype._refreshUI.createSequence(function()
			{
				let grid = this.element.closest(".kendo-grid").data("lightKendoGrid");
				if (grid)
				{
					grid._refreshUICreateSequenceFun(this);
				}
			});

			function removeFiltersForField(expression, field)
			{
				if (expression.filters)
				{
					expression.filters = $.grep(expression.filters, function(filter)
					{
						removeFiltersForField(filter, field);
						if (filter.filters)
						{
							return filter.filters.length;
						}
						else
						{
							return filter.field != field;
						}
					});
				}
			}

			KendoFilterCellPrototype.updateDsFilter = KendoFilterCellPrototype.updateDsFilter.createInterceptor(function(e)
			{
				if (this.viewModel.operator == "isnotempty" || this.viewModel.operator == "isempty" ||
					TF.FilterHelper.dateTimeNonParamFiltersOperator.indexOf(this.viewModel.operator) > -1)
				{
					this.viewModel.value = "";
				}

				// claer the date number input
				if (TF.FilterHelper.dateTimeNilFiltersOperator.indexOf(this.viewModel.operator) > -1 && this.viewModel.value === null)
				{
					var kendoNumber = $(this.element.find("input.date-number")[1]).data('kendoNumericTextBox');
					if (kendoNumber)
					{
						kendoNumber.value(null);
					}
				}
			});

			KendoFilterCellPrototype._merge = function(expression)
			{
				var that = this,
					logic = expression.logic || "and",
					filters = expression.filters,
					filter,
					result = that.dataSource.filter() ||
					{
						filters: [],
						logic: "and"
					},
					idx,
					length,
					nonValueOperators = [
						'isnull',
						'isnotnull',
						'isempty',
						'isnotempty',
						'isnullorempty',
						'isnotnullorempty',
						'all', 'lastmonth', 'lastweek', 'lastyear',
						'nextbusinessday', 'nextmonth', 'nextweek',
						'nextyear', 'thismonth', 'thisweek', 'thisyear',
						'today', 'tomorrow', 'yesterday'
					];

				removeFiltersForField(result, that.options.field);

				for (idx = 0, length = filters.length; idx < length; idx++)
				{
					filter = filters[idx];
					filter.value = that._parse(filter.value);
				}

				function isNonValueFilter(filter)
				{
					var operator = typeof filter === 'string' ? filter : filter.operator;
					return $.inArray(operator, nonValueOperators) > -1;
				}

				filters = $.grep(filters, function(filter)
				{
					return filter.operator === "isnotempty" || filter.operator === "isempty" || (filter.value !== "" && filter.value !== null || isNonValueFilter(filter));
				});

				if (filters.length)
				{
					if (result.filters?.length)
					{
						expression.filters = filters;

						if (result.logic !== "and")
						{
							if (result.filters.length > 1)
							{
								result.filters = [
									{
										logic: result.logic,
										filters: result.filters
									}];
							}
							result.logic = "and";
						}

						if (filters.length > 1)
						{
							result.filters.push(expression);
						}
						else
						{
							result.filters.push(filters[0]);
						}
					}
					else
					{
						result.filters = filters;
						result.logic = logic;
					}
				}

				return result;
			};

			KendoSelectablePrototype._tap = KendoSelectablePrototype._tap.createInterceptor(function(e)
			{
				if (e.target && e.target[0] && e.target[0].nodeName === 'TR')
				{
					if ((e.event.altKey && TF.LightKendoGridHelper.isHotLinkNode($(e.event.target))) ||
						(TF.isMobileDevice && TF.LightKendoGridHelper.isHotLinkNode($(e.event.target))))
					{
					var target = e.event.target;
					e.target = [];
					}

					if (TF.isMobileDevice && e && e.target.length)
					{
						e.event.ctrlKey = true;
					}
				}
			});

			KendoKendoPopup.destroy = KendoKendoPopup.destroy.createInterceptor(function()
			{
				var that = this,
					options = that.options,
					DOCUMENT_ELEMENT = $(document.documentElement),
					WINDOW = $(window),
					SCROLL = "scroll",
					RESIZE_SCROLL = "resize scroll";

				function _scrollableParents()
				{
					return $(that.options.anchor).parentsUntil("body");
				}

				function _toggleResize(toggle)
				{
					var method = toggle ? "on" : "off";

					_scrollableParents()[method](SCROLL, that._resizeProxy);
					WINDOW[method](RESIZE_SCROLL, that._resizeProxy);
				}

				if (!options.modal)
				{
					DOCUMENT_ELEMENT.unbind(that.downEvent, that._mousedownProxy);
					_toggleResize(false);

					options.modal = !options.modal;
				}
			});

			KendoFilterMenu._stripFilters = function(filters)
			{
				return $.grep(filters, function(filter)
				{
					return filter.value !== "" && filter.value != null || (filter.operator === 'isnull' || filter.operator === 'isnotnull' || filter.operator === 'isempty' || filter.operator === 'isnotempty' || filter.operator == 'isnullorempty' || filter.operator == 'isnotnullorempty');
				});
			};
		}

	};
})();