(function ()
{
	createNamespace("TF.Grid").LightKendoGrid = LightKendoGrid;
	var defaults = {
		gridDefinition: { Columns: [] },
		additionGridDefinition: { Columns: [] },
		setRequestOption: null,
		setRequestURL: null,
		kendoGridOption: {
		},
		url: "",
		gridType: "",
		storageKey: "",
		height: "auto",
		onGridStateChange: null,
		showLockedColumn: true,
		showEyeColumn: false,
		eyeColumnVisible: true,
		showBulkMenu: true,
		loadUserDefined: true,//is load user defined label
		loadLayout: true,
		onDataBound: null,
		showOperators: true,
		selectable: "multiple",
		directory: null,
		lockColumnTemplate: null,
		Id: "Id",
		isBigGrid: false,
		loadAllFields: false,
		showOverlay: true,
		isFromRelated: false,
		showSelectedCount: true,
		showOmittedCount: true,
		gridTypeInPageInfo: "",
		routeState: "",
		removeTabIndex: false,
		paramData: {}
	};

	var bigGridTypes = ['staff', 'student', 'trip', 'tripstop', 'vehicle', 'school', 'georegion', 'fieldtrip', 'fieldtripinvoice', 'district', 'contractor', 'altsite', 'document', 'fieldtriptemplate', 'report', "contact", "fieldtriplocation"];
	var udfLazyLoadType = ['roll-up', 'case'];
	var customClickAndTouchEvent;
	var customTouchMoveEvent;
	var customTouchMoveTimeOut = null;
	var customTouchMoveLock = false;

	TF.Grid.KendoGridFilterCellHackHelper.init();

	function LightKendoGrid($container, options, gridState, geoFields)
	{
		this.gridDefinitionHelper = new TF.Helper.GridDefinitionHelper();

		// make click event namespace unique in each instance.
		this.randomKey = (new Date()).getTime();
		customClickAndTouchEvent = `click.LightKendoGrid${this.randomKey} touchend.LightKendoGrid${this.randomKey}`;
		customTouchMoveEvent = `touchmove.LightKendoGrid${this.randomKey}`;

		this.pendingTaskOnNextDataBound = null;
		this.geoFields = geoFields;
		if (geoFields)
		{
			this.geoData = [];
		}
		this.filterClass = '.k-i-filter';
		this.initParameter($container, options, gridState);
		this.loadAndCreateGrid();
		this.lazyloadFields = { general: [], udf: [] };
		this.alreadyLoadId = { general: {}, udf: {} };
		this.isFilterReset = false;
	}

	LightKendoGrid.prototype._excludeOnlyForFilterColumns = function functionName(gridDefintion)
	{
		gridDefintion.Columns = gridDefintion.Columns.filter((column) => !column.onlyForFilter);
		return gridDefintion;
	};

	LightKendoGrid.prototype.initParameter = function ($container, options, gridState)
	{
		var self = this;
		self.listFilters = TF.ListFilterHelper.initListFilters();
		self.$container = $container;

		self.viewPortPageSize = options.viewPortPageSize || 16;
		delete options.viewPortPageSize;

		self.options = $.extend(true, {}, defaults, options);
		self.subscriptions = [];

		if (!gridState)
		{
			gridState = { gridFilterId: null, filteredIds: null, filteredExcludeAnyIds: null, filterClause: null };
		}
		self.obSelectedGridFilterClause = ko.observable("");
		self.obHeaderFilters = ko.observableArray([]);
		self.obHeaderFilterSets = ko.observableArray([]);
		self._filteredIds = gridState.filteredIds;
		self._showBulkMenu = self.options.showBulkMenu === false ? false : true;
		self._gridState = gridState;

		// These two variables are for geo-search or any other outer source to affect grid filter ids.
		self.additionalFilterIds = null;
		self.obClassicFilterSet = ko.observable(null);
		// Because the geo-search is based on the grid content, so the first search should ignore geo-search filter id list.
		self.shouldIncludeAdditionFilterIds = false;

		self.isRowSelectedWhenInit = false;

		self._gridType = self.options.gridType;
		self.pageType = self.options.pageType;

		self.options.gridDefinition = self._excludeOnlyForFilterColumns(self.options.gridDefinition);
		self._gridDefinition = self.options.gridDefinition =
			self.extendAdditionGridDefinition(self.options.gridDefinition, self.options.additionGridDefinition);
		self._filterHeight = 0;

		self.kendoGrid = null;
		self.searchOption = null;
		self._availableColumns = [];
		self._obSelectedColumns = ko.observableArray([]);
		self._obSelectedInvisibleColumns = ko.observableArray([]);

		self.obFilteredExcludeAnyIds = ko.observable(self._gridState.filteredExcludeAnyIds);
		self.obTempOmitExcludeAnyIds = ko.observable([]);
		self.obTempOmitExcludeAnyIds.subscribe(self._omitIdsChange, self);
		self.getSelectedIds = ko.observableArray([]);
		self.getSelectedRecords = ko.observableArray([]);
		self.obSelectedIndex = ko.observable(-1);
		self.getSelectedIds.subscribe(self._selectedIdsChange, self);
		self._obSortedItems = ko.observableArray([]);

		self.onDoubleClick = new TF.Events.Event();
		self.onRowsChangeCheck = new TF.Events.Event();
		self.onRowsChanged = new TF.Events.Event();
		self.onDataBoundEvent = new TF.Events.Event();
		self.onFilterChanged = new TF.Events.Event();
		self.onIdsChanged = new TF.Events.Event();
		self.onClearFilter = new TF.Events.Event();
		// FT-1029 add event to rebind select items after grid read completed
		self.onGridReadCompleted = new TF.Events.Event();
		self.onCtrlIPress = self.onCtrlIPress.bind(self);
		self.onCtrlOPress = self.onCtrlOPress.bind(self);
		self.onCtrlAPress = self.onCtrlAPress.bind(self);
		self.onShiftDown = self.onShiftDown.bind(self);
		self.onShiftUp = self.onShiftUp.bind(self);
		self.refreshClick = self.refreshClick.bind(self);

		if (self.options.showOmittedCount && !self.options.isMiniGrid)
		{
			tf.shortCutKeys.bind("ctrl+o", self.onCtrlOPress, self.options.routeState);
		}

		if (self.options.selectable && self.options.selectable.indexOf("multiple") != -1 && !self.options.isMiniGrid)
		{
			tf.shortCutKeys.bind("ctrl+a", self.onCtrlAPress, self.options.routeState);
			tf.shortCutKeys.bind("ctrl+i", self.onCtrlIPress, self.options.routeState);
		}

		self.onCtrlCPress = new TF.Events.Event();
		tf.shortCutKeys.bind("ctrl+c", function (e, keyCombination) { self.onCtrlCPress.notify(keyCombination, e); }, self.options.routeState);

		self.onCtrlSPress = new TF.Events.Event();
		tf.shortCutKeys.bind("ctrl+s", function (e, keyCombination) { self.onCtrlSPress.notify(keyCombination, e); }, self.options.routeState);

		self.onEnterPress = new TF.Events.Event();
		tf.shortCutKeys.bind("enter", function (e, keyCombination) { self.onEnterPress.notify(keyCombination, e); }, self.options.routeState);

		self.obFilteredRecordCount = ko.observable(0);
		self.obTotalRecordCount = ko.observable(0);
		self.obIsScrollAtBottom = ko.observable(false);
		self.tobeLockedColumns = [];
		self.allIds = [];
		self.obAllIds = ko.observableArray([]);
		self.overlay = true;
		self.obcheckRecords = ko.observableArray([]);
		self.onEyeCheckChanged = new TF.Events.Event();

		self.obShowEyeColumn = ko.observable(self.options.showEyeColumn);
		self.permanentLockCount = ko.computed(function ()
		{
			return self.options.permanendLockCount || self.obShowEyeColumn() ? 2 : 1; //There is always a locked column on the left; "map visible" column can be activated by openning map section.
		});
		self.filterDropDownListTimer;

		self.$alert = $(".gridAlert");
		self.gridAlert = new TF.Grid.GridAlertViewModel(self.$alert);
		self.suspendRefresh = false;
		self.isBigGrid = options.isBigGrid === true || Enumerable.From(bigGridTypes).Contains(self._gridType) && !options.isSmallGrid;
		self.currentDisplayColumns = ko.observableArray();
	};

	LightKendoGrid.prototype.refreshGridColumnDefinition = function ()
	{
		var self = this;

		self.options.gridDefinition = self._excludeOnlyForFilterColumns(self.options.gridDefinition);
		self._gridDefinition = self.options.gridDefinition = self.extendAdditionGridDefinition(self.options.gridDefinition, self.options.additionGridDefinition);
	};

	LightKendoGrid.prototype.loadAndCreateGrid = function ()
	{
		//use setTimeout to fix "You cannot apply bindings multiple times to the same element." error on time box when use lightKendoGrid on init event;
		setTimeout(function ()
		{
			this.createGrid();
		}.bind(this));
	};

	LightKendoGrid.prototype._setGridState = function ()
	{
		if (this.kendoGrid)
		{
			this.rebuildGrid();
		}
		this.getSelectedIds([]);
	};

	LightKendoGrid.prototype.onChange = function (e)
	{
		var self = this,
			ids = self.getSelectedIds(),
			records = $.map(ids, function (item)
			{
				return self.kendoGrid.dataSource.get(item);
			}),
			selectedItems = $.map(self.kendoGrid.select(), function (item)
			{
				var row = $(item).closest("tr");
				var dataItem = self.kendoGrid.dataItem(row);
				if (dataItem &&
					$.isNumeric(dataItem[self.options.Id]) &&
					!Enumerable.From(records).Any(function (x) { return x[self.options.Id] === dataItem[self.options.Id]; })
				)
				{
					return item;
				}
			});

		self.onRowsChangeCheck.notify(selectedItems);
		self.onRowsChanged.notify(records);
		if (self.options.onSelectRowChange)
		{
			self.options.onSelectRowChange(self.kendoGrid.select());
		}
	};

	LightKendoGrid.prototype.bindDoubleClickEvent = function ()
	{
		var self = this;
		this.$container.delegate("table tr", "dblclick", function (e)
		{
			self.onGridDoubleClick(e);
		});
	};

	LightKendoGrid.prototype.onGridDoubleClick = function (e)
	{
		if (e.shiftKey || e.ctrlKey)
		{
			return;
		}
		var records = this.getSelectedRecords();
		this.onDoubleClick.notify(records[records.length - 1]);
	};

	LightKendoGrid.prototype._initLinkTd = function ()
	{
		this.$container.find("table tr td").each(function (i, item)
		{
			var htmlText = $(item).html(),
				validateLink = this._validateLink(htmlText),
				validateMail = this._validateMail(htmlText);
			if (validateLink)
			{
				var content;
				if (TF.isMobileDevice && validateLink)
				{
					content = $('<a>' + htmlText + '</a>').addClass('link').addClass('tf-grid-mobile-inner-link').on('click', function (e)
					{
						window.open(htmlText, '_blank ');

						e.stopPropagation();
					});
				}
				else
				{
					content = $('<div>' + htmlText + '</div>').addClass('link').css('padding', '0 .6em').css('cursor', 'pointer').attr('title', 'Press "Alt" and left click to open link');
				}

				if (this._gridType === 'form')
				{
					content.addClass("form-link");
				}

				$(item).empty().append(content);
				$(item).addClass("has-link");
			}
			if (validateMail)
			{
				var content;
				if (TF.isMobileDevice)
				{
					content = $('<a>' + htmlText + '</a>').addClass('link').addClass('tf-grid-mobile-inner-link').on('click', function(e)
					{
						window.open(htmlText, '_blank ');

						e.stopPropagation();
					});
				}
				else
				{
					content = $('<div><a href=mailto:' + htmlText + '>' + htmlText + '</a></div>').addClass('mail');
				}

				$(item).empty().append(content);
			}
		}.bind(this));
	};

	function onProcessHotLink(e)
	{
		if (e.altKey)
		{
			if ($(e.currentTarget).children('.link').length > 0)
			{
				window.open($(e.currentTarget).children().html());
			}
		}
		else
		{
			if (this.options.directory != null)
			{
				var tr = e.currentTarget.parentElement,
					dataItem = this.kendoGrid.dataItem(tr);
				setTimeout(function ()
				{
					this.options.directory.load(dataItem);
				}.bind(this), 300);
			}
		}
	}

	function onKendoGridTDClickEvent(e)
	{
		onProcessHotLink.call(this, e);
	}

	function onKendoGridTRClickEvent(e, self)
	{
		// click on toggle detail button, avoid select event.
		var $row = $(e.currentTarget);
		if ($(e.target).closest(".k-hierarchy-cell", $row).length === 0
			&& !$row.hasClass("k-detail-row"))
		{
			setTimeout(self._refreshGridBlank.bind(self)); // use setTimeout to redraw the fill color after the cell color is updated

			if (!isHotLink(e))
			{
				const dataItem = self.kendoGrid.dataItem(this);
				self._onGridItemClick(dataItem, e);
			}
		}
	}

	function isHotLink(e)
	{
		return (e.altKey && TF.LightKendoGridHelper.isHotLinkNode($(e.target))) ||
			(TF.isMobileDevice && TF.LightKendoGridHelper.isHotLinkNode($(e.target)))
	}

	LightKendoGrid.prototype.bindAltClickEvent = function ()
	{
		this.$container.delegate("table tr td", "click", onKendoGridTDClickEvent.bind(this));

		this.$container.delegate("table tr td", "touchstart", function (e)
		{
			var self = this;
			var callRevert = self._onTouchStart(e);
			if (callRevert)
				setTimeout(function () { self._revertLinkToText(e); }, 10 * 1000);
		}.bind(this));

		this.$container.delegate("table tr td", "touchend touchmove", function (e)
		{
			this._revertLinkToText(e);
		}.bind(this));
	};

	LightKendoGrid.prototype._onTouchStart = function (e)
	{
		var callRevert = false;
		var htmlText = $(e.currentTarget).children().html();
		return callRevert;
	};

	LightKendoGrid.prototype._revertLinkToText = function (e)
	{
		var $link = $(e.currentTarget).find('.tf-grid-mobile-inner-link');
		if ($link.length === 0)
			return;

		var htmlText = $link.html();
		$(e.currentTarget).children().html(htmlText);
	};

	LightKendoGrid.prototype._validateLink = function (pattern)
	{
		var urlExpression = new RegExp(/http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/);
		return urlExpression.test(pattern);
	};

	LightKendoGrid.prototype._validateMail = function (pattern)
	{
		var mailExpression = new RegExp(/^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/);
		return mailExpression.test(pattern);
	};

	LightKendoGrid.prototype.refreshClick = function ()
	{
		this.obTempOmitExcludeAnyIds([]);
		this.refresh();
	};

	LightKendoGrid.prototype.initStatusBeforeRefresh = function ()
	{
		this.obTempOmitExcludeAnyIds([]);
		this.getSelectedIds([]);
		this.allIds = [];
	};

	LightKendoGrid.prototype.clearDateTimeNumberFilterCellBeforeRefresh = function ()
	{
		var self = this;
		var $dateNumberCells = self.$container.find('input[data-kendo-role="numerictextbox"].k-input.date-number');
		$dateNumberCells.each((index) =>
		{
			let dateNumber = $($dateNumberCells[index]).data('kendoNumericTextBox');
			if (dateNumber && dateNumber.value() !== null)
			{
				dateNumber.value(null);
			}
		});
	};

	LightKendoGrid.prototype.refresh = function ()
	{
		var self = this;
		self.overlayShow = true;
		self.getSelectedIds([]);
		self.allIds = [];
		if (self.options.showOverlay)
		{
			tf.loadingIndicator.showImmediately();
		}

		if (self.kendoGrid && self.kendoGrid.dataSource)
		{
			self.kendoGrid.dataSource.read();
		}
		if (self.options.showOverlay)
		{
			setTimeout(function ()
			{
				self.overlayShow = false;
				tf.loadingIndicator.tryHide();
			}, 1500);
		}
		this.alreadyLoadId = { general: {}, udf: {} };
	};

	LightKendoGrid.prototype.rebuildGrid = function (sortInfo)
	{
		return new Promise(function (resolve)
		{
			tf.loadingIndicator.showImmediately();
			setTimeout(function ()
			{
				resolve();
			}, 0);
		})
			.then(function ()
			{
				if ((!this.kendoGrid || !this.kendoGrid.wrapper || !this.kendoGrid.wrapper.data("kendoReorderable")) && !this.options.isMiniGrid)
				{
					tf.loadingIndicator.tryHide();
					return Promise.resolve(false);
				}
				this.getSelectedIds([]);
				this.alreadyLoadId = { general: {}, udf: {} };
				this.overlayShow = true;
				this.obTempOmitExcludeAnyIds([]);
				var kendoOptions = this.kendoGrid.getOptions();
				if (kendoOptions.height !== 0)
				{
					// Fix UI issues after user change columns;
					// FIx UI issues if a light kendo grid is in tab;
					kendoOptions.height = this.getGridFullHeight();
				}
				kendoOptions.columns = this.getKendoColumn();
				kendoOptions.dataSource.sort = sortInfo || this.getKendoSortColumn();
				if (kendoOptions.columns.length == 1)
				{
					kendoOptions.columns[0].locked = false;
				}
				kendoOptions.sortable.mode = this.sortModel;
				this._removeInvisibleListFilterItems(this.getKendoColumn());
				kendoOptions.autoBind = true;
				if (this.options.needUpdateSchemaOnRebuildGrid)
				{
					if (!kendoOptions.dataSource.schema)
					{
						kendoOptions.dataSource.schema = {};
					}
					if (!kendoOptions.dataSource.schema.model)
					{
						kendoOptions.dataSource.schema.model = {};
					}
					kendoOptions.dataSource.schema.model.fields = this.getKendoField();
				}
				this.kendoGrid.setOptions(kendoOptions);
				this._initFilterDropDownListTimer();
				TF.CustomFilterHelper.initCustomFilterBtn(this.$container);
				TF.ListFilterHelper.initListFilterBtn(this.$container);
				this.addFilterClass();
				this.setColumnCurrentFilterIcon();
				this.setColumnCurrentFilterInput();
				this.setFilterIconByKendoDSFilter();
				this._refillAllListFilterFilterCellInput();
				this.disableFilterCellWhenEmptyOrNotEmptyApplied();
				this.createFilterClearAll();
				if (kendoOptions.columns.length == 1 && this.options.showLockedColumn)
				{
					this.$container.find("div.k-grid-content").children("table.k-selectable").width(30);
				}
				this.autoLoadDataOnScrollBottom();
				this.bindCalendarButton();
				if (this.options.canDragDelete)
				{
					this.createDragDelete();
				}
				setTimeout(function ()
				{
					this.overlayShow = false;
					tf.loadingIndicator.tryHide();
				}.bind(this), 1000);
			}.bind(this), 0);
	};

	LightKendoGrid.prototype._removeInvisibleListFilterItems = function (columns)
	{
		var self = this;

		var listFilterFieldNames = Object.keys(self.listFilters);
		var needDeleteListFilterColumns = listFilterFieldNames.filter(function (listFilterFieldName)
		{
			var result = columns.filter(function (column)
			{
				return listFilterFieldName === column.FieldName;
			});
			return result.length === 0;
		});

		needDeleteListFilterColumns.map(function (fieldName)
		{
			delete self.listFilters[fieldName];
		});
	};

	LightKendoGrid.prototype._setCustomizetimePickerborderradius = function ()
	{
		var CustomizetimePickers = $(".form-control.datepickerinput");
		CustomizetimePickers.map(function (idx, item)
		{
			$(item).css("border-radius", "0");
			$(item).css("float", "right");
			$(item).next().css("border-radius", "0");
		});
	};

	LightKendoGrid.BaseOperator = {
		string: {
			eq: "Equal To",
			neq: "Not Equal To",
			contains: "Contains",
			doesnotcontain: "Does Not Contain",
			startswith: "Starts With",
			endswith: "Ends With",
			isempty: "Empty",
			isnotempty: "Not Empty"
		},
		number: {
			eq: "Equal To",
			neq: "Not Equal To",
			isempty: "Empty",
			isnotempty: "Not Empty",
			lt: "Less Than",
			lte: "Less Than or Equal To",
			gt: "Greater Than",
			gte: "Greater Than or Equal To"
		},
		date: {
			eq: "Equal To",
			neq: "Not Equal To",
			isempty: "Empty",
			isnotempty: "Not Empty",
			lt: "Less Than",
			lte: "Less Than or Equal To",
			gt: "Greater Than",
			gte: "Greater Than or Equal To"
		},
		time: {
			eq: "Equal To",
			neq: "Not Equal To",
			isempty: "Empty",
			isnotempty: "Not Empty",
			lt: "Less Than",
			lte: "Less Than or Equal To",
			gt: "Greater Than",
			gte: "Greater Than or Equal To"
		},
		datetime: {
			eq: "Equal To",
			neq: "Not Equal To",
			isempty: "Empty",
			isnotempty: "Not Empty",
			lt: "Less Than",
			lte: "Less Than or Equal To",
			gt: "Greater Than",
			gte: "Greater Than or Equal To",
		},
		enums: {
			eq: "Equal To",
			neq: "Not Equal To"
		}
	};

	LightKendoGrid.DefaultOperator = {
		string: { custom: 'Custom' },
		number: { custom: 'Custom' },
		date: { custom: 'Custom' },
		datetime: { custom: 'Custom' },
		enums: { custom: 'Custom' }
	};
	LightKendoGrid.DefaultOperator = jQuery.extend(true, {}, LightKendoGrid.BaseOperator, LightKendoGrid.DefaultOperator);

	LightKendoGrid.DefaultDateTimeOperator = {
		eq: "Equal To",
		neq: "Not Equal To",
		isempty: "Empty",
		isnotempty: "Not Empty",
		lt: "Less Than",
		lte: "Less Than or Equal To",
		gt: "Greater Than",
		gte: "Greater Than or Equal To",
		all: 'All',
		lastmonth: 'Last Month',
		lastweek: 'Last Week',
		lastyear: 'Last Year',
		lastxdays: "Last X Days",
		lastxhours: "Last X Hours",
		lastxmonths: 'Last X Months',
		lastxweeks: 'Last X Weeks',
		lastxyears: 'Last X Years',
		nextbusinessday: 'Next Business Day',
		nextmonth: 'Next Month',
		nextweek: 'Next Week',
		nextyear: 'Next Year',
		nextxdays: 'Next X Days',
		nextxhours: 'Next X Hours',
		nextxmonths: 'Next X Months',
		nextxweeks: 'Next X Weeks',
		nextxyears: 'Next X Years',
		olderthanxmonths: 'Older than X Months',
		olderthanxyears: 'Older than X Years',
		onyearx: 'On Year X',
		onx: 'On X',
		onorafterx: 'On or After X',
		onorbeforex: 'On or Before X',
		thismonth: 'This Month',
		thisweek: 'This Week',
		thisyear: 'This Year',
		today: 'Today',
		tomorrow: 'Tomorrow',
		yesterday: 'Yesterday',
		custom: 'Custom'
	};

	LightKendoGrid.OperatorWithDateTime = {
		string: jQuery.extend(true, {}, LightKendoGrid.DefaultDateTimeOperator),
		datetime: jQuery.extend(true, {}, LightKendoGrid.DefaultDateTimeOperator)
	};

	LightKendoGrid.DefaultDateOperator = jQuery.extend(true, {}, LightKendoGrid.DefaultDateTimeOperator);
	delete LightKendoGrid.DefaultDateOperator.lastxhours;
	delete LightKendoGrid.DefaultDateOperator.nextxhours;

	LightKendoGrid.OperatorWithDate = {
		string: jQuery.extend(true, {}, LightKendoGrid.DefaultDateOperator),
		date: jQuery.extend(true, {}, LightKendoGrid.DefaultDateOperator)
	};

	LightKendoGrid.OperatorWithList = {
		string: {
			custom: 'Custom',
			list: 'List'
		},
		number: {
			custom: 'Custom',
			list: 'List'
		},
		date: {
			custom: 'Custom',
			list: 'List'
		},
		enums: {
			custom: 'Custom',
			list: 'List'
		}
	};
	LightKendoGrid.OperatorWithList = jQuery.extend(true, {}, LightKendoGrid.BaseOperator, LightKendoGrid.OperatorWithList);

	LightKendoGrid.DefaultGeneralOperator = {  //user for number/interger/number
		eq: "Equal To",
		neq: "Not Equal To",
		isempty: "Empty",
		isnotempty: "Not Empty",
		lt: "Less Than",
		lte: "Less Than or Equal To",
		gt: "Greater Than",
		gte: "Greater Than or Equal To",
		custom: 'Custom'
	};

	LightKendoGrid.OperatorWithNumber = {
		string: jQuery.extend(true, {}, LightKendoGrid.DefaultGeneralOperator),
		number: jQuery.extend(true, {}, LightKendoGrid.DefaultGeneralOperator)
	};

	LightKendoGrid.OperatorWithTime = {
		// here need set "date" not "time" for time type column
		string: jQuery.extend(true, {}, LightKendoGrid.DefaultGeneralOperator),
		date: jQuery.extend(true, {}, LightKendoGrid.DefaultGeneralOperator)
	};

	LightKendoGrid.Operator2DisplayValue = {
		eq: "Equal To",
		neq: "Not Equal To",
		contains: "Contains",
		doesnotcontain: "Does Not Contain",
		startswith: "Starts With",
		endswith: "Ends With",
		isempty: "Empty",
		isnotempty: "Not Empty",
		lt: "Less Than",
		lte: "Less Than or Equal To",
		gt: "Greater Than",
		gte: "Greater Than or Equal To",
		custom: 'Custom',
		list: 'List',
		wi: 'Is Within',
		lastxdays: "Last X Days",
		lastxhours: "Last X Hours",
		lastxmonths: 'Last X Months',
		lastxweeks: 'Last X Weeks',
		lastxyears: 'Last X Years',
		nextxdays: 'Next X Days',
		nextxhours: 'Next X Hours',
		nextxmonths: 'Next X Months',
		nextxweeks: 'Next X Weeks',
		nextxyears: 'Next X Years',
		olderthanxmonths: 'Older than X Months',
		olderthanxyears: 'Older than X Years',
		onyearx: 'On Year X',
		all: 'All',
		lastmonth: 'Last Month',
		lastweek: 'Last Week',
		lastyear: 'Last Year',
		nextbusinessday: 'Next Business Day',
		nextmonth: 'Next Month',
		nextweek: 'Next Week',
		nextyear: 'Next Year',
		thismonth: 'This Month',
		thisweek: 'This Week',
		thisyear: 'This Year',
		today: 'Today',
		tomorrow: 'Tomorrow',
		yesterday: 'Yesterday',
		onx: 'On X',
		onorafterx: 'On or After X',
		onorbeforex: 'On or Before X'
	};

	LightKendoGrid.prototype.createGrid = function ()
	{
		var self = this;
		var kendoGridOption = {
			dataSource: {
				type: "odata",
				transport: {
					read: function (options)
					{
						function setEmpty()
						{
							options.success({
								d: {
									__count: 0,
									results: []
								}
							});
						}
						if (self.options.withoutData || self.options.miniGridEditMode
							|| (self.options.isMiniGrid && self.options.hasPermission === false))
						{
							setEmpty();
							return;
						}

						//the count of request in the process of change filter
						if (!self.kendoDataSourceTransportReadCount) self.kendoDataSourceTransportReadCount = 0;
						self.kendoDataSourceTransportReadCount = self.kendoDataSourceTransportReadCount + 1;

						if (!self.hasSendRequst)
						{
							self.hasSendRequst = true;

							function initListFilterPromise()
							{
								if (self.getQuickFilter && Object.keys(self.getQuickFilter().data).length !== 0)
								{
									var quickFilterData = self.getQuickFilter().data;
									TF.ListFilterHelper.initListFilterIdsByQuickFilter(quickFilterData, self.listFilters, self._gridDefinition.Columns);
								}
								return Promise.resolve();
							}

							self.beforeSendFirstRequest.bind(self)()
								.then(function (result)
								{
									initListFilterPromise();
									return Promise.resolve(result);
								})
								.then(function (result)
								{
									self.setFilterIconByKendoDSFilter.bind(self)();
									self._readGrid(options);
								});
						}
						else
						{
							self._readGrid(options);
						}
					}
				},
				schema: {
					model: {
						fields: self.getKendoField(),
						id: self.getIdName()
					}
				},
				pageSize: 100,
				serverPaging: true,
				serverFiltering: true,
				serverSorting: true,
			},
			allowCopy: true,
			scrollable: {
				virtual: true
			},
			height: self.getGridFullHeight(),
			filterable:
			{
				extra: true,
				mode: "menu row",
				operators: TF.Grid.LightKendoGrid.DefaultOperator
			},
			sortable: {
				mode: "single",
				allowUnsort: true
			},
			reorderable: self.options.reorderable === false ? false : true,
			resizable: self.options.resizable !== false,
			pageable: {
				refresh: true,
				pageSizes: [25, 50, 100, 500, 1000, 2000],
				buttonCount: 5,
				messages: {
					display: "{1} of {2}"
				}
			},
			columns: self.getKendoColumn(),
			columnResize: self.columnResizeEvent.bind(this),
			columnReorder: self.columnReorderEvent.bind(this),
			selectable: self.options.selectable,
			change: self.onChange.bind(this),
			columnHide: self.columnHideEvent.bind(this),
			columnShow: self.columnShowEvent.bind(this),
			dataBound: self.onDataBound.bind(this),
			dataBinding: function (e)
			{
				// mini grid in DE form, when tab keypress:
				// 1. columns can not focus
				// 2. filter button can not focus
				// 3. grid table can not focus
				// 4. filter input can not focus
				if (self.options.removeTabIndex)
				{
					self.$container.find("a").attr("tabindex", "-1");
					self.$container.find("span[tabindex]").attr("tabindex", "-1");
					self.$container.find("table[tabindex]").attr("tabindex", "-1");
					self.$container.find("input").attr("tabindex", "-1");
				}

				// add following block to cover following case:
				// 1. set filter as equal, add filter value
				// 2. set filter type as custom, the code will set filter operator type as 'eq'
				// 3. after send request, the filter type reset as 'custom' by kendogrid inner code
				// 4. call following code, force to set filter operator as 'custom' again
				if (self.kendoGrid && self.kendoGrid.dataSource)
				{
					var rootFilter = self.kendoGrid.dataSource.filter();
					if (rootFilter)
					{
						var customFilters = rootFilter.filters.filter(function (filter)
						{
							return filter.operator === 'custom';
						});
						customFilters.map(function (customFilter)
						{
							self.setEmptyCustomFilterCommon(customFilter.field);
						});
					}
				}

				if (self.result)
				{
					self.allIds = [];
					setTimeout(function ()
					{
						if ((self._gridType == 'report'))
						{
							var option = {
								data: self.searchOption.data
							}
							_.remove(option.data.filterSet.FilterItems, e => e.FieldName != "DataTypeName")
							tf.ajax["post"](self.getApiRequestURL() + '/id?take=100&skip=0&getCount=true', option).then(res =>
							{
								self.$container.children(".k-pager-wrap").find(".pageInfo").html((self.currentCount || self.result.FilteredRecordCount) + " of " + res.TotalRecordCount);
								self._resetPageInfoSelect();
							})
						}
						else
						{
							self.$container.children(".k-pager-wrap").find(".pageInfo").html((self.currentCount || self.result.FilteredRecordCount) + " of " + (self.currentTotalCount || self.result.TotalRecordCount || self.result.FilteredRecordCount));
							self._resetPageInfoSelect();
						}
					});

					self.obFilteredRecordCount(self.result.FilteredRecordCount);
					self.obTotalRecordCount(self.result.TotalRecordCount);
					self.getDefaultCheckedRecords(self.result.Items);
					if (self.suspendRefresh)
					{
						e.preventDefault();
					}
				}
				else if (this.options.dataSource)
				{
					setTimeout(function ()
					{
						if (self.kendoGrid)
						{
							self.$container.children(".k-pager-wrap").find(".pageInfo").html(self.kendoGrid.dataSource.total() + " of " + self.kendoGrid.dataSource.total());
						}
					});
				}

				if (!self.result && self.kendoGrid && self.kendoGrid.dataSource && self.kendoGrid.dataSource)
				{
					self.obFilteredRecordCount(self.kendoGrid.dataSource.total());
					self.kendoGrid.dataSource.bind("change", function ()
					{
						self.obFilteredRecordCount(self.kendoGrid.dataSource.total());
					});
				}
			},
			filterMenuInit: self.filterMenuInit.bind(self)
		};

		if (this.options.disableQuickFilter)
		{
			kendoGridOption.filterable = false;
		}

		if (this.options.dataSource)
		{
			kendoGridOption.dataSource = {
				type: "odata",
				data: this.options.dataSource,
				schema: {
					model: {
						fields: self.getKendoField(),
						id: self.getIdName()
					}
				}
			};
		}

		if (self.options.disableQuickFilter === true || self.options.filterable === false)
		{
			kendoGridOption.filterable = false;
		}
		else
		{
			kendoGridOption.filterable = {
				extra: true,
				mode: "menu row",
				operators: TF.Grid.LightKendoGrid.DefaultOperator
			};
		}

		kendoGridOption = $.extend(true, kendoGridOption, this.options.kendoGridOption);
		this.filterClearButtonInUnLockedArea = this.options.kendoGridOption.filterClearButtonInUnLockedArea;

		kendoGridOption.dataSource.sort = this.getKendoSortColumn();
		this.$container.data("lightKendoGrid", this);
		this.$container.kendoGrid(kendoGridOption);
		this.kendoGrid = this.$container.data("kendoGrid");
		this.kendoGrid.dataSource.originalFilter = this.kendoGrid.dataSource.filter;
		this.kendoGrid.dataSource.filter = function (val)
		{
			if (val === undefined)
			{
				return this._filter;
			}

			return self.kendoGrid.dataSource.originalFilter.call(this, val);
		};
		this.sortModel = this.kendoGrid.getOptions().sortable.mode;
		this._initFilterDropDownListTimer();

		TF.CustomFilterHelper.initCustomFilterBtn(this.$container);
		TF.ListFilterHelper.initListFilterBtn(this.$container);
		this.addFilterClass();
		this.setColumnCurrentFilterIcon();

		this.createFilterClearAll();
		this.bindDoubleClickEvent();
		this.bindAltClickEvent();
		this.autoLoadDataOnScrollBottom();
		this.blurFilterInputWhenClickGrid();
		this.handleClickClearQuickFilterBtn();
		this.bindCalendarButton();
		this.options.canDragDelete && this.createDragDelete();
		this.options.onCreateGrid && this.options.onCreateGrid();
	};

	LightKendoGrid.prototype._readGrid = function (options)
	{
		const self = this,
			requestOptions = self.getApiRequestOption(options);
		let promise;

		// remove the placeholder of phone realted fields, keep the raw phone number only
		tf.dataFormatHelper.clearPhoneNumberFormat(requestOptions, self);

		if (self.options.getAsyncRequestOption)
		{
			promise = self.options.getAsyncRequestOption(requestOptions);
		}
		else
		{
			promise = Promise.resolve(requestOptions);
		}

		promise.then(response =>
		{
			self.setLazyLoadFields(response.data);
			self.updateLazyloadData = false;
			tf.ajax.post(self.getApiRequestURL(self.options.url), response, { overlay: self.overlay && self.options.showOverlay })
				.then(function ()
				{
					//the count of request callback in the process of change filter
					if (!self.kendoDataSourceTransportRequestBackCount) self.kendoDataSourceTransportRequestBackCount = 0;
					self.kendoDataSourceTransportRequestBackCount = self.kendoDataSourceTransportRequestBackCount + 1;
					//check the filter Whether custom or not
					if (self.$customFilterBtn)
					{
						//when user change the custom filter, show the custom filter menu now
						//check the last request callback, if this back is the last request callback, show the custom filter menu and reset data
						if (self.kendoDataSourceTransportRequestBackCount == self.kendoDataSourceTransportReadCount)
						{
							self.$customFilterBtn.click();
							self.kendoDataSourceTransportRequestBackCount = 0;
							self.kendoDataSourceTransportReadCount = 0;
							self.$customFilterBtn = undefined;
						}
					}
					else
					{
						//reset the request count, request callback count and custom button
						self.kendoDataSourceTransportRequestBackCount = 0;
						self.kendoDataSourceTransportReadCount = 0;
						self.$customFilterBtn = undefined;
					}
				}).fail(function (ex)
				{
					if (self.overlay && self.options.showOverlay)
					{
						tf.loadingIndicator.tryHide();
					}

					self.gridAlert.show({
						alert: "Danger",
						title: "Error",
						message: ex.responseJSON.Message
					});

					if ([400, 412].includes(ex.status))
					{
						self.resetFilterForCurrentInvalidFilter();
					}
				});
		});
	}

	LightKendoGrid.prototype.filterMenuInit = function (e)
	{
		var kendoPopup = e.container.data().kendoPopup;
		kendoPopup.options.position = "top right";
		kendoPopup.options.origin = "bottom right";

		kendoPopup.bind("open", function (e)
		{
			firstValueDropDown.trigger("change");
			secondValueDropDown.trigger("change");
		});
		e.container.find('.k-filter-help-text').remove(); // remove filter text by ent-81

		// add cancel and clear button
		$div = $(e.container.find('button').closest("div"));
		var $submit = $(e.container.find('button')[0]);
		$submit.html('Apply');
		var $clearButton = $(e.container.find('button')[1]);
		$clearButton.remove();
		var $cancelButton = '<a class="k-button cancelButton">Cancel</a>';
		$div.append($cancelButton);
		$(".cancelButton").bind('click', function (e)
		{
			$(e.currentTarget.closest("form")).css("display", "none");
			e.stopPropagation();
		});

		var self = this;

		var logicDropDown = e.container.find("select:eq(1)").data("kendoDropDownList");
		if (!logicDropDown.value())
		{
			logicDropDown.value("and");
			logicDropDown.trigger("change");
		}

		var onDropDownListChange = function (e, $input, $inputNumberCell)
		{
			var isNormalInput = true;
			var kendoGridDomain = this;
			if (e.sender.dataItem().value === 'isempty' || e.sender.dataItem().value === 'isnotempty')
			{
				TF.FilterHelper.disableFilterCellInput($input, isNormalInput);
				TF.FilterHelper.clearFilterCellInput($input);
				if ($inputNumberCell)
				{
					var kendoNumericTextBox = $($inputNumberCell).data('kendoNumericTextBox');
					if (kendoNumericTextBox !== undefined)
						kendoNumericTextBox.enable(false);
				}
			}
			else
			{
				TF.FilterHelper.enableFilterCellInput($input, isNormalInput);
				if ($inputNumberCell)
				{
					var kendoNumericTextBox = $($inputNumberCell).data('kendoNumericTextBox');
					if (kendoNumericTextBox !== undefined)
						kendoNumericTextBox.enable(true);
				}
			}
		};

		var firstValueDropDown = e.container.find("select:eq(0)").data("kendoDropDownList");
		var firstInputCell = e.container.find("input:eq(0)");
		var firstNumberInputCell = e.container.find("input").length == 2 ? null : e.container.find("input:eq(1)");
		TF.CustomFilterHelper.removeSpecialDDLItem(firstValueDropDown);
		firstValueDropDown.bind("change", function (e)
		{
			onDropDownListChange.bind(self)(e, firstInputCell, firstNumberInputCell);
		});

		var secondValueDropDown = e.container.find("select:eq(2)").data("kendoDropDownList");
		var secondInputCell = e.container.find("input").length == 2 ? e.container.find("input:eq(1)") : e.container.find("input:eq(2)");
		var secondNumberInputCell = e.container.find("input").length == 2 ? null : e.container.find("input:eq(3)");
		TF.CustomFilterHelper.removeSpecialDDLItem(secondValueDropDown);
		secondValueDropDown.bind("change", function (e)
		{
			onDropDownListChange.bind(self)(e, secondInputCell, secondNumberInputCell);
		});

		var onCustomFilterPopupOpen = function (e, field)
		{
			var kendoGridDomain = this;

			var filter = kendoGridDomain.kendoGrid.dataSource.filter();
			var clearCustomFilterCell = function (e)
			{
				// filter is null, but the CustomFilter has not been removed in UI
				let customContainer = $(e.sender.element);
				let filterCells = customContainer.find('input.datepickerinput');
				if (filterCells && filterCells[1] && $(filterCells[1]).val() !== '')
				{
					$(filterCells[1]).val('');
				}
			}

			if (!filter)
			{
				clearCustomFilterCell(e);
				return;
			}

			var currentFilter = filter.filters.filter(function (item)
			{
				return item.logic && item.filters[0].field === field;
			});

			if (currentFilter.length)
			{
				var col = kendoGridDomain.kendoGrid.columns.filter(function (col) { return col.FieldName === field; });
				var tmpType = col[0].type;
				var inputCellText = currentFilter[0].filters[0].value;
				inputCellText = TF.FilterHelper.formatFilterCellInputValue(inputCellText, tmpType);
				$(e.sender.element.find('input')[0]).val(inputCellText);
			}
			else
			{
				clearCustomFilterCell(e);
			}
		};

		var field = e.field;
		e.container.data("kendoPopup").bind("open", function (e)
		{
			onCustomFilterPopupOpen.bind(self)(e, field);
		});
		var format;
		var decimals;
		this.kendoGrid.columns.map(function (item)
		{
			if (item.field === e.field)
			{
				format = item.format;
				decimals = item.Precision;
			}
		});
		var numberText1 = $(e.container.find('input:text')[1]).data('kendoNumericTextBox');
		if (numberText1)
		{
			numberText1.options.format = format ? format.substring(3, format.length - 1) : 'n';
			numberText1.options.decimals = decimals ? decimals : null;
		}
		var numberText2 = $(e.container.find('input:text')[3]).data('kendoNumericTextBox');
		if (numberText2)
		{
			numberText2.options.format = format ? format.substring(3, format.length - 1) : 'n';
			numberText2.options.decimals = decimals ? decimals : null;
		}
	};

	LightKendoGrid.prototype.setFilterIconByKendoDSFilter = function ()
	{
		var self = this;
		var currentFilters = self.kendoGrid.dataSource.filter() ? self.kendoGrid.dataSource.filter().filters : [];
		var columns = self.kendoGrid.columns.filter(function (column) { return column.filterable !== false; });

		this.$container.find(".k-filtercell .k-dropdown-wrap .k-input").each(function (i, item)
		{
			var $item = $(item);
			var field = columns[i].field;
			currentFilters.map(function (currentFilter)
			{
				var $filterBtn = $item.parent().find(self.filterClass);
				if (currentFilter.field === field && currentFilter.operator === 'list')
				{
					self.removeFilterBtnIcon($filterBtn);
					$filterBtn.addClass('list');
					self.visibleListFilterBtn2($item, field);
					self.bindListFilterBtnEvent($item, field);
				}
				else if (currentFilter.filters && currentFilter.filters.length > 0 &&
					currentFilter.filters[0].field === field)
				{
					self.removeFilterBtnIcon($filterBtn);
					$filterBtn.addClass('custom');
					self.visibleCustomFilterBtn($item, i);
				}
			});
		});
	};

	LightKendoGrid.prototype.handleClickClearQuickFilterBtn = function ()
	{
		var self = this;
		this.$container.delegate('.k-grid-header button', 'click', function (e)
		{
			var $button = $(this);
			self.clearDateNilFilterCell($button);
			if ($button.children(".k-i-close").length === 0)
				return;

			$button.parent().find('input:text').focus();
		});
	};

	LightKendoGrid.prototype.clearDateNilFilterCell = function (button)
	{
		var cellContainer = button.closest("span.k-filtercell"),
			operator = cellContainer.find("input.k-dropdown-operator").val();
		if ((button.children(".k-i-filter-clear").length === 0) ||
			TF.FilterHelper.dateTimeNilFiltersOperator.indexOf(operator) === -1) return;

		cellContainer.find("input.date-number").val("");
	};

	// Hack Filter Cell Refresh UI for support display filter menu selector on filter cell
	LightKendoGrid.prototype._refreshUIInterceptorFun = function (kendoFilterCellDomain)
	{
		var hackDomain = this;

		if (
			!hackDomain.kendoGrid ||
			(hackDomain.kendoGrid && hackDomain.kendoGrid.dataSource !== kendoFilterCellDomain.dataSource)
		)
			return;

		var isCustomFilter = kendoFilterCellDomain.wrapper.find('input').hasClass('k-filter-custom-input');
		if (!isCustomFilter)
			return;

		var kendoFilterCellDomainField = kendoFilterCellDomain.options.field;
		hackDomain.hackDisplayFilterCells = hackDomain.hackDisplayFilterCells || {};
		hackDomain.hackDisplayFilterCells[kendoFilterCellDomainField] = hackDomain.hackDisplayFilterCells[kendoFilterCellDomainField] || {};
		hackDomain.hackDisplayFilterCells[kendoFilterCellDomainField].originalFilterValue = '';

		var rootFilter = kendoFilterCellDomain.dataSource.filter();
		if (rootFilter)
		{
			var tmp = rootFilter.filters.filter(function (filter)
			{
				return filter.logic !== undefined && filter.filters[0].field === kendoFilterCellDomainField;
			});
			var findResult = tmp[0];

			function convertCustomFilter(rootFilter, kendoFilterCellDomainField)
			{
				var needCovert2CustomFilters = rootFilter.filters.filter(function (filter)
				{
					return filter.field === kendoFilterCellDomainField;
				});

				needCovert2CustomFilters.map(function (needCovert2CustomFilter)
				{
					Array.remove(rootFilter.filters, needCovert2CustomFilter);
				});

				if (!needCovert2CustomFilters.length) // fix issue of select listFilter first, after that select customFilter, throw exception in console
				{
					needCovert2CustomFilters = [{
						field: kendoFilterCellDomainField,
						operator: 'eq',
						value: ''
					}]
				}

				var newCustomFilterSet = {
					filters: [
						{
							field: needCovert2CustomFilters[0].field,
							operator: needCovert2CustomFilters[0].operator,
							value: needCovert2CustomFilters[0].value
						},
						{
							field: needCovert2CustomFilters[0].field,
							operator: needCovert2CustomFilters[1] ? needCovert2CustomFilters[1].operator : 'eq',
							value: needCovert2CustomFilters[1] ? needCovert2CustomFilters[1].value : ''
						}
					],
					logic: rootFilter.logic || 'and'
				};

				rootFilter.filters.push(newCustomFilterSet);
			}

			function setFilterVauleForEmptyNotEmptyType(filterSet)
			{
				if (!filterSet)
					return filterSet;

				filterSet.filters.map(function (item)
				{
					if (item.operator === 'isempty' ||
						item.operator === 'isnotempty')
						item.value = '';
				});

				return filterSet;
			}

			if (!findResult)
			{
				convertCustomFilter(rootFilter, kendoFilterCellDomainField);
				tmp = rootFilter.filters.filter(function (filter)
				{
					return filter.logic !== undefined && filter.filters[0].field === kendoFilterCellDomainField;
				});
				findResult = tmp[0];
			}
			findResult = setFilterVauleForEmptyNotEmptyType(findResult);
		}

		var currentlyColumn = hackDomain.options.gridDefinition.Columns.filter(function (column) { return column.FieldName === kendoFilterCellDomainField; });
		var columnType = currentlyColumn[0].type;

		var displayVal;
		if (findResult)
		{
			var filterLeft = findResult.filters[0];
			hackDomain.hackDisplayFilterCells[kendoFilterCellDomainField].originalFilterValue = filterLeft.value;


			var filterRight = findResult.filters[1];
			var logic = findResult.logic;

			displayVal = hackDomain._buildCustomFilterCellDisplayVal(filterLeft, filterRight, logic, columnType);
		}

		var filterType = 'customFilter';
		hackDomain.setKendoFilterCellInputValue(kendoFilterCellDomain.wrapper, displayVal, filterType, columnType);

		if (findResult)
		{
			if (!isTypeSetDisplayInSequence(columnType))
			{
				filterLeft.value = displayVal;
			}
		}
	};

	function isTypeSetDisplayInSequence(columnType)
	{
		return columnType === 'time' ||
			columnType === 'date' ||
			columnType === 'datetime' ||
			columnType === 'number' ||
			columnType === 'integer';
	}

	// Hack Filter Cell Refresh UI for support display filter menu selector on filter cell
	LightKendoGrid.prototype._refreshUICreateSequenceFun = function (kendoFilterCellDomain)
	{
		var hackDomain = this;

		if (
			!hackDomain.kendoGrid ||
			(hackDomain.kendoGrid && hackDomain.kendoGrid.dataSource !== kendoFilterCellDomain.dataSource)
		)
			return;

		// handle date special filter
		const isDateTimeNonParam = TF.FilterHelper.dateTimeNonParamFiltersOperator.includes(kendoFilterCellDomain.viewModel.operator);
		const isDateTimeDateParam = TF.FilterHelper.dateTimeDateParamFiltersOperator.includes(kendoFilterCellDomain.viewModel.operator);
		if (isDateTimeNonParam || isDateTimeDateParam)
		{
			const kendoFilterCellDomainField = kendoFilterCellDomain.options.field;
			const currentlyColumn = hackDomain.options.gridDefinition.Columns.find(function (column) { return column.FieldName === kendoFilterCellDomainField; });
			const operator = kendoFilterCellDomain.viewModel.operator;
			const operatorName = hackDomain.getOpetatorName(operator);
			const columnType = currentlyColumn.type;

			// This settimeout is desined to make sure that the value is setted to field correctly. So the time is 0. Will be removed if there is better solution.
			setTimeout(() =>
			{
				if (isDateTimeNonParam)
				{
					hackDomain.setKendoDateTimeNonParamFilterCellInputValue(kendoFilterCellDomain.wrapper, operatorName, operator, columnType);
				}
				else
				{
					hackDomain.setKendoDateTimeDateParamFilterCellInputValue(kendoFilterCellDomain.wrapper, operatorName, operator, columnType);
				}
			})
			return;
		}

		var isCustomFilter = kendoFilterCellDomain.wrapper.find('input').hasClass('k-filter-custom-input');

		if (!isCustomFilter)
			return;

		var kendoFilterCellDomainField = kendoFilterCellDomain.options.field;

		var rootFilter = kendoFilterCellDomain.dataSource.filter();
		if (rootFilter)
		{
			var tmp = rootFilter.filters.filter(function (filter)
			{
				return filter.logic !== undefined && filter.filters[0].field === kendoFilterCellDomainField;
			});
			var findResult = tmp[0];
		}

		var currentlyColumn = hackDomain.options.gridDefinition.Columns.filter(function (column) { return column.FieldName === kendoFilterCellDomainField; });
		var columnType = currentlyColumn[0].type;
		if (findResult)
		{
			var filterLeft = findResult.filters[0];
			if (!isTypeSetDisplayInSequence(columnType))
			{
				filterLeft.value = hackDomain.hackDisplayFilterCells[kendoFilterCellDomainField].originalFilterValue;
				if (filterLeft.operator === 'isnotempty' || filterLeft.operator === 'isempty')
				{
					var displayVal = hackDomain._buildCustomFilterCellDisplayVal(findResult.filters[0], findResult.filters[1], findResult.logic, columnType);
					var filterType = 'customFilter';
					setTimeout(function ()
					{
						// force update filter after other ui render
						hackDomain.setKendoFilterCellInputValue(kendoFilterCellDomain.wrapper, displayVal, filterType, columnType);
					}, 500);
				}
			}
			else
			{
				var displayVal = hackDomain._buildCustomFilterCellDisplayVal(findResult.filters[0], findResult.filters[1], findResult.logic, columnType);
				var filterType = 'customFilter';

				setTimeout(function ()
				{
					// force update filter after other ui render
					hackDomain.setKendoFilterCellInputValue(kendoFilterCellDomain.wrapper, displayVal, filterType, columnType);
				}, 500);
			}

			if (
				findResult.filters && (findResult.filters[0].value !== "" || findResult.filters[0].operator.indexOf('empty') >= 0) &&
				kendoFilterCellDomain.wrapper.find('.clear-custom-filter-menu-btn').length === 0)
			{
				var $customInput = $(kendoFilterCellDomain.wrapper.find('.k-filter-custom-input'));
				$customInput.parent().parent().find('button').css('display', 'none');
				var $clearButton = '<button type="button" class="k-button k-button-icon clear-custom-filter-menu-btn" ><span class="k-icon k-i-close"></span></button>';
				kendoFilterCellDomain.wrapper.find('.k-filter-custom-input').closest('span').append($clearButton);

				var $filterCellInner = $customInput.closest(".k-filtercell").find('> span');
				$filterCellInner.addClass("hide-cross-button");

				TF.CustomFilterHelper.addCustomFilterEllipsisClass($customInput);

				$customInput.parent().find('.clear-custom-filter-menu-btn').bind("click", function (e)
				{
					this.setEmptyCustomFilterCommon(kendoFilterCellDomainField);

					var $customInput = $(kendoFilterCellDomain.wrapper.find('.k-filter-custom-input'));
					TF.CustomFilterHelper.removeCustomFilterEllipsisClass($customInput);

					$(e.currentTarget).remove();
				}.bind(this));

				if (kendoFilterCellDomain.wrapper.find('.datepickerinput').length === 0)
				{
					kendoFilterCellDomain.wrapper.find('.clear-custom-filter-menu-btn').addClass("clearButtonPosition");
				}
			}
		}
	};

	LightKendoGrid.prototype.setKendoDateTimeDateParamFilterCellInputValue = function ($filterCell, displayVal, filterType, columnType)
	{
		const inputCell = $filterCell.find('input[type=text]:first');
		const inputCellVale = inputCell.val();
		const preprendStr = displayVal.replace("X", '');

		if (inputCellVale && inputCellVale !== '' && !inputCell.attr("reloadfilter"))
		{
			// add reloadfilter for avoding reloade the data 
			const valueArr = inputCellVale.split(preprendStr);
			if (valueArr.length === 1)
			{
				displayVal = displayVal.replace("X", inputCellVale);
				inputCell.attr('title', displayVal);
				inputCell.val(displayVal);
				inputCell.attr("reloadfilter", "true");
			}
		}
	};

	LightKendoGrid.prototype.setKendoFilterCellInputValue = function ($filterCell, displayVal, filterType, columnType)
	{
		$filterCell.find('input[type=text]').attr('title', displayVal);
		if (filterType === 'listFilter' ||
			filterType === 'customFilter')
			$filterCell.find('input[type=text]').val(displayVal);
	};

	LightKendoGrid.prototype.setKendoDateTimeNonParamFilterCellInputValue = function ($filterCell, displayVal, filterType, columnType)
	{
		let inputCell = $filterCell.find('input[type=text]:first');
		inputCell.attr('title', displayVal);
		inputCell.val(displayVal);
	};

	LightKendoGrid.prototype._buildCustomFilterCellDisplayVal = function (filterLeft, filterRight, logic, columnType)
	{
		var displayFilterCell = '';
		if (isNotEmptyCustomFilterItem(filterLeft))
		{
			displayFilterCell = LightKendoGrid.Operator2DisplayValue[filterLeft.operator] +
				' ' + TF.FilterHelper.formatFilterCellInputValue(filterLeft.value, columnType);
		}

		if (isNotEmptyCustomFilterItem(filterRight))
		{
			displayFilterCell += ' ' + logic.toUpperCase() + ' ';
			displayFilterCell += LightKendoGrid.Operator2DisplayValue[filterRight.operator] +
				' ' + TF.FilterHelper.formatFilterCellInputValue(filterRight.value, columnType);
		}

		return displayFilterCell;
	};

	function isNotEmptyCustomFilterItem(customFilterItem)
	{
		return customFilterItem && (
			customFilterItem.value === 0 || // fix issue of apply filter is number 0;
			customFilterItem.value ||
			customFilterItem.operator === 'isempty' ||
			customFilterItem.operator === 'isnotempty'
		);
	}

	LightKendoGrid.prototype.bindCalendarButton = function ()
	{
		this.$container.find(".k-i-calendar").parent().on("click", function (e)
		{
			var $input = $($(e.currentTarget).prev()[0]);
			var $span = $(e.currentTarget);
			if ($input.attr("aria-activedescendant"))
			{
				var id = $input.attr("aria-activedescendant").split("_")[0];
				var $calendar = $($("#" + id).parents()[1]);
				var leftPlus = $span.offset().left + $span.width() / 2 - $calendar.width() / 2;
				if ((leftPlus + $calendar.width()) <= $(window).width())//VIEW-1296 only change left when in the window
				{
					$calendar.css('left', leftPlus + "px");
				}
			}
		}.bind(this));
		this.$container.find(".k-i-calendar").parent().prev().on("blur", function (e)
		{
			this.isOpen = false;
		}.bind(this));
	};

	LightKendoGrid.prototype.triggerRefreshClick = function ()
	{
		var self = this;
		TF.Grid.LightKendoGrid.prototype.refreshClick.apply(self);
	};

	LightKendoGrid.prototype.getIdsWithCurrentFiltering = function (isCopyRequest)
	{
		if (!this.searchOption || (this.kendoGrid.dataSource.options.serverPaging == false
			|| (this.options.kendoGridOption && this.options.kendoGridOption.dataSource && this.options.kendoGridOption.dataSource.serverPaging == false)))
		{
			var datasource = this.kendoGrid.dataSource;
			if (datasource.options.serverFiltering == false && datasource.sort())
			{
				var data = (new kendo.data.Query(datasource.data()).filter(datasource.filter())).data;
				data = (new kendo.data.Query(data).sort(datasource.sort())).data;
			}
			else
			{
				data = datasource.data();
			}
			var allIds = data.map(function (item) { return item.Id; })
			this.obAllIds(allIds);
			return Promise.resolve(allIds);
		}

		return tf.promiseAjax.post(pathCombine(this.getApiRequestURL(this.options.url), "id"),
			{
				paramData: this.searchOption.paramData,
				data: this.searchOption.data
			},
			{ isCopyRequest: isCopyRequest ? true : false, overlay: false }
		)
			.then(function (apiResponse)
			{
				this.allIds = apiResponse.Items;
				this.obAllIds(this.allIds);
				if (this.options && this.options.onAllIdBounded)
				{
					this.options.onAllIdBounded();
				}
				return this.allIds.slice(0);
			}.bind(this))
			.catch(function ()
			{

			});
	};

	LightKendoGrid.prototype.blurFilterInputWhenClickGrid = function ()
	{
		// this is a bug when use virtual scroll on mobile device , when click filter and then click the grid, the filter will not blur
		// this code relate to kendo.all.js at line 26596 and line 26748
		this.$container.delegate(".k-grid-content,.k-grid-content-locked", "touchstart", function (e)
		{
			var $filterInputs = $(".k-filter-row .k-filtercell input");
			$filterInputs.blur();
		}.bind(this));
	};

	LightKendoGrid.prototype.autoLoadDataOnScrollBottom = function ()
	{
		var self = this,
			pagerWrap = this.$container.children(".k-pager-wrap"),
			$pageInfo = pagerWrap.children(".pageInfo"),
			$pageInfoSelect = pagerWrap.children(".pageInfoSelect");
		pagerWrap.children().hide();
		if ($pageInfo.length === 0)
		{
			$pageInfo = $("<span class='pageInfo' style='float:left'></span>");
			pagerWrap.append($pageInfo);
		}
		$pageInfo.show();
		if ($pageInfoSelect.length === 0)
		{
			$pageInfoSelect = $("<span class='pageInfoSelect' style='float:left'></span>");
			pagerWrap.append($pageInfoSelect);
		}
		$pageInfoSelect.show();
		var $scrollbar = this.$container.find(".k-scrollbar-vertical");

		$scrollbar.unbind("scroll.scrollToBottom").bind("scroll.scrollToBottom", function (e)
		{
			var height = $scrollbar.height(),
				scrollHeight = $scrollbar[0].scrollHeight,
				scrollTop = $scrollbar.scrollTop();
			if (scrollTop >= (scrollHeight - height))
			{
				self.obIsScrollAtBottom(true);
			}
		});
		return;
	};

	LightKendoGrid.prototype.createFilterClearAll = function ()
	{
		var self = this, tr;
		if (self.filterClearButtonInUnLockedArea)
		{
			tr = self.$container.find("div.k-grid-header").find("tr.k-filter-row");
		}
		else
		{
			tr = self.$container.find("div.k-grid-header-locked").find("tr.k-filter-row");
		}
		if (tr !== undefined)
		{
			var td = tr.children("th:first"),
				div = $('<div class="grid-filter-clear-all"></div>');

			td.text("");
			td.append(div);

			div.mousedown(function (e)
			{
				e.stopPropagation();
				var buttons = self.$container.find("tr.k-filter-row").find("button.k-button:visible");
				if (buttons !== undefined)
				{
					buttons.trigger("click");
				}

				function forceClearListFilter()
				{
					self.listFilters = {};
					self.onClearFilter.notify();
					self.obHeaderFilters([]);
					self.getSelectedIds([]);
					self.obTempOmitExcludeAnyIds([]);
					self.clearKendoGridQuickFilter();
					self.rebuildGrid();
				}

				forceClearListFilter();
			});
		}
	};

	LightKendoGrid.prototype.clearKendoGridQuickFilter = function ()
	{
		var self = this;
		self.listFilters = TF.ListFilterHelper.initListFilters();
		TF.CustomFilterHelper.clearCustomFilter();
		self.kendoGrid.dataSource.filter({});
		return Promise.resolve(true);
	};


	LightKendoGrid.prototype._isFilterDropDownListPopup = function ($dropDownList)
	{
		return $dropDownList.parent().attr("aria-expanded") === "true";
	};

	LightKendoGrid.prototype._hideFilterDropDownList = function ($dropDownList, e)
	{
		var kendoDropDownList = $dropDownList.data("kendoDropDownList");
		if (this._isFilterDropDownListPopup($dropDownList))
			kendoDropDownList._wrapperClick(e);
	};

	LightKendoGrid.prototype._clearFilterDropDownListTimer = function ()
	{
		var self = this;
		$("input.k-dropdown-operator").each(function (i, item)
		{
			var $dropDownList = $(item);
			if (self._isFilterDropDownListPopup($dropDownList))
				clearTimeout(self.filterDropDownListTimer);
		});
	};

	LightKendoGrid.prototype._setFilterDropDownListTimer = function (e)
	{
		var self = this;
		$("input.k-dropdown-operator").each(function (i, item)
		{
			var $dropDownList = $(item);
			if (self._isFilterDropDownListPopup($dropDownList))
				self.filterDropDownListTimer = setTimeout(function () { self._hideFilterDropDownList($dropDownList, e); }, 500);
		});
	};

	LightKendoGrid.prototype._initFilterDropDownListTimer = function ()
	{
		var self = this;

		var $filterBtn = $("span.k-widget.k-dropdown.k-header.k-dropdown-operator");
		$filterBtn.on("mouseover", function (e) { self._clearFilterDropDownListTimer(); });
		$filterBtn.on("mouseleave", function (e) { self._clearFilterDropDownListTimer(); self._setFilterDropDownListTimer(e); });

		var $filterListContainer = $(".k-list-container");
		$filterListContainer.on("mouseover", function (e) { self._clearFilterDropDownListTimer(); });
		$filterListContainer.on("mouseleave", function (e) { self._clearFilterDropDownListTimer(); self._setFilterDropDownListTimer(e); });
	};

	LightKendoGrid.prototype._findDDLInput = function (e)
	{
		var parentId = $(e.currentTarget).parent().find("[id]")[0].id,
			$input = $("[aria-activedescendant='" + parentId + "']").prev().find("input"),
			filterType = this.getColumnType(e);;
		if (TF.FilterHelper.isDateOrDateTimeFilterType(filterType)) // datetime include datetimpicker and numberbox 
		{
			$input = $("[aria-activedescendant='" + parentId + "']").prev().prev().find("input");
		}

		return $input;
	}

	LightKendoGrid.prototype._findMenuFilterBtn = function (e)
	{
		var fieldName = this._getSelectedFilterFieldName.bind(this)(e);

		var $headers = this.$container.find('.k-grid-header thead tr:first-child th');
		var $selectedHeaders = $headers.filter(function (idx, header)
		{
			return $(header).data('kendo-field') === fieldName;
		});

		var $menuFilterBtn = $selectedHeaders.find('.k-filter-custom-btn');
		return $menuFilterBtn;
	}

	LightKendoGrid.prototype._findFilterListBtn = function (e)
	{
		var fieldName = this._getSelectedFilterFieldName.bind(this)(e);

		var $headers = this.$container.find('.k-grid-header thead tr:first-child th');
		var $selectedHeaders = $headers.filter(function (idx, header)
		{
			return $(header).data('kendo-field') === fieldName;
		});

		var $menuFilterBtn = $selectedHeaders.find('.k-filter-list-btn');
		return $menuFilterBtn;
	}

	LightKendoGrid.prototype._getSelectedFilterFieldName = function (e)
	{
		var $input = this._findDDLInput(e);
		var fieldName = $input.closest("[data-kendo-field]").attr("data-kendo-field");
		return fieldName;
	};

	LightKendoGrid.prototype.listFilterBtnClick = function (e)
	{
		var self = this;
		self.visibleListFilterBtnByClick(e);
		self.bindListFilterBtnEventByClick(e);
		// add empty listFilter to dataSource
		var fieldName = self._getSelectedFilterFieldName.bind(self)(e);

		self.addListFilterToKendoDataSource([], fieldName);
		self._findFilterListBtn.bind(self)(e).trigger('click');
	};

	LightKendoGrid.prototype.addListFilterToKendoDataSource = function (listFilterItems, fieldName, selectedIds)
	{
		var self = this;

		var kendoFilters = self.kendoGrid.dataSource.filter();
		var filters = [];

		if (kendoFilters)
		{
			for (var i = 0; i < kendoFilters.filters.length; i++)
			{
				if (kendoFilters.filters[i].field !== fieldName)
					filters.push(kendoFilters.filters[i]);
			}
		}

		var listFilter = {
			field: fieldName,
			operator: 'list',
			value: listFilterItems.join(','),
			valueList: listFilterItems,
			selectedIds: selectedIds
		};
		if (listFilterItems && listFilterItems.length > 0)
		{
			filters.push(listFilter);
		}
		self.kendoGrid.dataSource.filter({ logic: 'and', filters: filters });
	};

	LightKendoGrid.prototype.handleDateTimeNilFilterToKendoDataSource = function (value, fieldName, operator)
	{
		var self = this;

		var kendoFilters = self.kendoGrid.dataSource.filter();
		var filters = [],
			filter = { field: fieldName, operator: operator, value: value };

		if (kendoFilters)
		{
			for (var i = 0; i < kendoFilters.filters.length; i++)
			{
				if (kendoFilters.filters[i].field !== fieldName)
				{
					if (kendoFilters.filters[i].filters)
					{
						if (kendoFilters.filters[i].filters.length > 0 &&
							kendoFilters.filters[i].filters[0].field !== fieldName)
							filters.push(kendoFilters.filters[i]);
					}
					else
					{
						filters.push(kendoFilters.filters[i]);
					}
				}
			}
		}

		filters.push(filter);

		//filters.push(nilFilter);
		self.kendoGrid.dataSource.filter({ logic: 'and', filters: filters });
	};

	LightKendoGrid.prototype.bindListFilterBtnEventByClick = function (e)
	{
		var self = this;
		var fieldName = self._getSelectedFilterFieldName.bind(self)(e);
		var $listBtn = self._findFilterListBtn.bind(self)(e);

		self.bindListFilterBtnEventCommon.bind(self)(fieldName, $listBtn);
	};

	LightKendoGrid.prototype.bindListFilterBtnEvent = function (item, fieldName)
	{
		var self = this;
		var $listBtn = $(this.$container.find('.k-filter-list-btn')).closest('[data-kendo-field=' + fieldName + ']').find('.k-filter-list-btn');

		self.bindListFilterBtnEventCommon.bind(self)(fieldName, $listBtn);
	};

	LightKendoGrid.prototype.bindListFilterBtnEventCommon = function (fieldName, $listBtn)
	{
		var self = this;
		var selectedColumns = self._gridDefinition.Columns.filter(function (column) { return column.FieldName === fieldName; });
		if (!selectedColumns ||
			selectedColumns.length === 0 ||
			!selectedColumns[0].ListFilterTemplate)
			return;

		var listFilterTemplate = selectedColumns[0].ListFilterTemplate;
		$listBtn.unbind('click').bind('click', function (e)
		{
			e.stopPropagation();

			self.listFilters[fieldName] = self.listFilters[fieldName] || {};
			switch (listFilterTemplate.listFilterType)
			{
				case 'WithSearchGrid':
					var selectedItems = TF.ListFilterHelper.getSelectedFilterItemsForWithSearchGridType(self.listFilters, listFilterTemplate, fieldName);
					var columnSources = {};

					if (self._gridType === 'staff')
					{
						if (listFilterTemplate.GridType === 'District')
						{
							columnSources = { columnSources: TF.ListFilterDefinition.ColumnSource.StaffGridDistrict };
						}
						else if (listFilterTemplate.GridType === 'StaffTypes')
						{
							columnSources = { columnSources: TF.ListFilterDefinition.ColumnSource.StaffGridStaffTypes };
						}
					}

					if ((self._gridType === 'student' || self._gridType === 'staff')
						&& listFilterTemplate.GridType === 'Genders')
					{
						columnSources = { columnSources: TF.ListFilterDefinition.ColumnSource.Gender };
					}
					
					return tf.modalManager.showModal(
						new TF.Modal.ListMoverForListFilterControlModalViewModel(selectedItems, $.extend(true, {}, listFilterTemplate, { showRemoveColumnButton: false }, columnSources))
					)
						.then(function (selectedFilterItems)
						{
							TF.ListFilterHelper.handleWithSearchGridListFilterResult.bind(self)(self.listFilters, selectedFilterItems, fieldName);
						});
				case 'MapData':
					var url = listFilterTemplate.getUrl(),
						promiseAjaxRequest;
					if (listFilterTemplate.requestMethod && listFilterTemplate.requestMethod == 'post')
					{
						promiseAjaxRequest = tf.promiseAjax.post(listFilterTemplate.getUrl());
					}
					else
					{
						promiseAjaxRequest = tf.promiseAjax.get(listFilterTemplate.getUrl());
					}
					return promiseAjaxRequest.then(function (response)
					{

						function getItem(item)
						{
							if (listFilterTemplate.filterField)
							{
								return item[listFilterTemplate.filterField];
							}
							return $.trim(item);
						}

						var allItems = TF.ListFilterHelper.processMapData(response, listFilterTemplate.modifySource);
						var selectedFilterItems = TF.ListFilterHelper.getSelectedFilterItemsForWithSearchGridType(self.listFilters, listFilterTemplate, fieldName);

						var allItemsData = allItems.map(function (item)
						{
							return getItem(item);
						});
						var selectedFilterItemsData = selectedFilterItems.map(function (item)
						{
							return getItem(item);
						});

						var listFilterOption = TF.ListFilterHelper.getDefaultListFilterOption(listFilterTemplate.DisplayFilterTypeName);
						listFilterOption = $.extend({}, listFilterOption, listFilterTemplate);
						listFilterOption.gridColumnSource = TF.ListFilterDefinition.ColumnSource[listFilterTemplate.GridType];
						var requestOptions = {
							url: url, method: listFilterTemplate.requestMethod, filterField: listFilterTemplate.filterField,
							modifySource: listFilterTemplate.modifySource
						};
						return tf.modalManager.showModal(
							new TF.Modal.KendoListMoverControlModalViewModel(
								allItemsData,
								selectedFilterItemsData,
								listFilterOption,
								requestOptions
							)
						).then(function (selectedFilterItems)
						{
							if (selectedFilterItems !== false)
							{
								selectedFilterItems = allItems.filter(function (item)
								{
									return Array.contain(selectedFilterItems, getItem(item));
								});
							}
							selectedFilterItems = TF.ListMoverForListFilterHelper.processSelectedData(selectedFilterItems, listFilterTemplate.filterField);

							TF.ListFilterHelper.handleWithSearchGridListFilterResult.bind(self)(self.listFilters, selectedFilterItems, fieldName);
						});
					});
				case 'Enum':
					var allItems = listFilterTemplate.AllItems;
					var selectedFilterItems = TF.ListFilterHelper.getSelectedFilterItemsForDefaultType(self.listFilters, listFilterTemplate, fieldName);
					var listFilterOption = TF.ListFilterHelper.getDefaultListFilterOption(listFilterTemplate.DisplayFilterTypeName);
					listFilterOption = $.extend({}, listFilterOption, listFilterTemplate);

					return tf.modalManager.showModal(
						new TF.Modal.KendoListMoverControlModalViewModel(
							allItems,
							selectedFilterItems,
							listFilterOption
						)
					)
						.then(function (selectedFilterItems)
						{
							if (listFilterTemplate.covertSelectedItems)
								selectedFilterItems = listFilterTemplate.covertSelectedItems(selectedFilterItems);

							TF.ListFilterHelper.handleDefaultListFilterResult.bind(self)(self.listFilters, selectedFilterItems, fieldName, listFilterTemplate);
						});
				default:
					return null;
			}
		});
	};

	LightKendoGrid.prototype.afterhandleListFilterResult = function (selectedFilterItems, fieldName, originalSelectedFilterItemsCnt, currentlySelectedFilterItemsCnt, selectedIds)
	{
		var self = this;

		self._setListFilterFilterCellInput(selectedFilterItems, fieldName);

		self.addListFilterToKendoDataSource(selectedFilterItems, fieldName, selectedIds);

		if (currentlySelectedFilterItemsCnt < originalSelectedFilterItemsCnt)
			self._showCannotSupportSelectAllModal();

		self.kendoGrid.dataSource.read(); // Paul: will call search twice, not found soluntion yet
	};

	LightKendoGrid.prototype._setListFilterFilterCellInput = function (selectedFilterItems, fieldName)
	{
		var self = this;
		var displayInputVal = selectedFilterItems.length ? selectedFilterItems.join(',') : '';

		var wrappers = $('.doc.wrapper');
		var $filterCellsAll;
		if (wrappers)
		{
			var visableWrappers = wrappers.filter(function () { return $(this).css('visibility') != 'hidden' && $(this).css('display') != 'none' });
			$filterCellsAll = visableWrappers.find('.k-filtercell');
		}
		else
		{
			$filterCellsAll = $('.k-filtercell');
		}

		var $filterCells = $filterCellsAll.filter(function (idx, filterCell)
		{
			return $(filterCell).data('kendo-field') === fieldName;
		});
		$filterCells.map(function (idx, filterCell)
		{
			self.setKendoFilterCellInputValue($(filterCell), displayInputVal, 'listFilter');
		});
	};

	LightKendoGrid.prototype._refillAllListFilterFilterCellInput = function ()
	{
		var self = this;
		var listFilterFieldNames = Object.keys(self.listFilters);
		listFilterFieldNames.map(function (fieldName)
		{
			var selectedFilterItems = self.listFilters[fieldName].selectedFilterItems;
			self._setListFilterFilterCellInput(selectedFilterItems, fieldName);
		});
	};

	LightKendoGrid.prototype.setListFilterRequestOption = function (options)
	{
		var self = this;

		options = self.removeUnusedListFilterRequestOption(options);

		if (!self.listFilters || self.listFilters.length === 0)
			return options;

		var fieldNames = Object.keys(self.listFilters);
		if (fieldNames.length === 0)
			return options;

		options.data.filterSet = options.data.filterSet || { FilterSets: [], LogicalOperator: "and" };
		options.data.filterSet.FilterItems = options.data.filterSet.FilterItems || [];

		fieldNames.map(function (fieldName)
		{
			if (self.listFilters[fieldName] &&
				self.listFilters[fieldName].selectedFilterItems &&
				self.listFilters[fieldName].selectedFilterItems.length &&
				self.listFilters[fieldName].selectedFilterItems.length > 0)
			{
				self.deleteListFilterItemsByFieldName(options, fieldName);

				if (self.listFilters[fieldName].selectedFilterItems.length > 0 &&
					JSON.stringify(self.listFilters[fieldName].selectedFilterItems) !== '[""]')
				{
					var dsListFilterItem = TF.ListFilterHelper.buildDsListFilterItem(fieldName,
						self.listFilters[fieldName].selectedFilterItems.join(','),
						JSON.stringify(self.listFilters[fieldName].selectedFilterItems),
						self.listFilters[fieldName].ids
					);
					options.data.filterSet.FilterItems.push(dsListFilterItem);
				}
			}
		});

		return options;
	};

	LightKendoGrid.prototype.deleteListFilterItemsByFieldName = function (options, fieldName)
	{
		var deletedItems = options.data.filterSet.FilterItems.filter(function (item)
		{
			return (item.Operator === "In" || item.IsListFilter) && item.FieldName === fieldName;
		});

		if (deletedItems[0])
		{
			var idx = options.data.filterSet.FilterItems.indexOf(deletedItems[0]);
			options.data.filterSet.FilterItems.splice(idx, 1);
		}

		return options;
	};

	LightKendoGrid.prototype.visibleListFilterBtnByClick = function (e)
	{
		var self = this;
		var $listBtn = this._findFilterListBtn.bind(this)(e);
		var $input = this._findDDLInput(e);

		self.visibleListFilterBtnCommon($listBtn, $input);

		this.hideAndClearSpecialFilterBtn.bind(this)(e, 'list');
	};

	LightKendoGrid.prototype.visibleListFilterBtn2 = function ($filterBtn, fieldName)
	{
		var self = this;

		var $listBtn = $(this.$container.find('.k-filter-list-btn')).closest('[data-kendo-field=' + fieldName + ']').find('.k-filter-list-btn');
		var $input = $filterBtn.parent().parent().parent().find('input');

		self.visibleListFilterBtnCommon($listBtn, $input);
	};

	LightKendoGrid.prototype.visibleListFilterBtnCommon = function ($listBtn, $input)
	{
		$listBtn.removeClass('hidden');

		TF.FilterHelper.disableFilterCellInput($input);

		if (!$input.data('islist'))
			TF.FilterHelper.clearFilterCellInput($input);

		$input.addClass('k-filter-list-input');
		$input.data('islist', true);

		setTimeout(function ()
		{
			var $clearBtnBuildByKendo = $input.parent().parent().parent().find('button');
			$clearBtnBuildByKendo.css('display', 'none'); // force clear cross button build by kendoNumber / kendoDateTimePicker
		}, 50);
	};

	LightKendoGrid.prototype.hideAndClearEmptyFilterBtn = function (e)
	{
		var $input = this._findDDLInput(e);
		$input.data('isempty', false);
	};

	LightKendoGrid.prototype.hideAndClearListFilterBtn = function (e)
	{
		var self = this;
		var $menuFilterBtn = this._findFilterListBtn.bind(this)(e);
		$menuFilterBtn.addClass('hidden');

		var $input = this._findDDLInput(e);
		$input.removeClass('k-filter-list-input');
		$input.data('islist', false);

		var fieldName = this._getSelectedFilterFieldName.bind(this)(e);

		self.removeListFilterByFieldName(fieldName);
	};

	LightKendoGrid.prototype.removeListFilterByFieldName = function (fieldName)
	{
		var self = this;
		delete self.listFilters[fieldName];
	};

	LightKendoGrid.prototype.clearQuickFilterAndRefresh = function ()
	{
		this.obTempOmitExcludeAnyIds([]);

		this.overlayShow = true;
		this.getSelectedIds([]);
		this.allIds = [];
		if (this.options.showOverlay)
		{
			tf.loadingIndicator.showImmediately();
		}

		if (this.kendoGrid && this.kendoGrid.dataSource)
		{
			this.kendoGrid.dataSource.filter({});

		}
		if (this.options.showOverlay)
		{
			setTimeout(function ()
			{
				this.overlayShow = false;
				tf.loadingIndicator.tryHide();
			}.bind(this), 1500);
		}
	};

	LightKendoGrid.prototype.customFilterBtnClick = function (e)
	{
		var self = this;
		self.visibleCustomFilterBtnByClick(e);
	};

	LightKendoGrid.prototype.handleDatetimeFilter = function (e)
	{
		var filter = $(e.currentTarget).text(),
			input, cellContainer = $("[aria-activedescendant='" + $(e.currentTarget).parent().find("[id]")[0].id + "']");
		if (TF.FilterHelper.dateTimeNumberFiltersName.indexOf(filter) > -1) // show the number box when select nil filter
		{

			input = cellContainer.prev().prev().find("input");
			input.closest(".k-filtercell").find("span.date-number").show(); // show the input
			input.closest(".input-group.tf-filter").hide();
		} else
		{
			input = cellContainer.prev().find("input");
			var numberFilterCell = input.closest('span.date-number'); //hide the number box when select nil filter
			numberFilterCell.hide();
			numberFilterCell.closest(".k-filtercell").find(".tf-filter").show(); // show the input

			if (TF.FilterHelper.dateTimeNonParamFiltersName.indexOf(filter) > -1) // handle the non param input cell
			{
				var dateInput = numberFilterCell.closest(".k-filtercell").find(".tf-filter>input.datepickerinput");
				TF.FilterHelper.disableFilterCellInput(dateInput);
			}
		}
	};

	LightKendoGrid.prototype.handleDateFilter = function (e)
	{
		var filter = $(e.currentTarget).text(),
			cellContainer = $("[aria-activedescendant='" + $(e.currentTarget).parent().find("[id]")[0].id + "']").parent();
		if (TF.FilterHelper.dateTimeNumberFiltersName.indexOf(filter) > -1) // show the number box when select nil filter
		{
			//input = cellContainer.prev().prev().find("input");
			cellContainer.find("span.date-number").show(); // show the input
			cellContainer.find(".k-datepicker").hide();
		} else
		{
			//input = cellContainer.prev().find("input");
			var numberFilterCell = cellContainer.find('span.date-number'); //hide the number box when select nil filter
			numberFilterCell.hide();
			cellContainer.find(".k-datepicker").show(); // show the input
		}
	};

	LightKendoGrid.prototype.setEmptyCustomFilter = function (e)
	{
		var self = this;
		var fieldName = self._getSelectedFilterFieldName.bind(self)(e);
		self.setEmptyCustomFilterCommon(fieldName);
	};

	LightKendoGrid.prototype.setEmptyCustomFilterCommon = function (fieldName)
	{
		var self = this;
		var currentlyColumn = self.options.gridDefinition.Columns.filter(function (column) { return column.FieldName === fieldName; });
		var columnType = currentlyColumn[0].type;

		var rootFilters = self.kendoGrid.dataSource.filter();
		var filters = [];
		if (rootFilters)
		{
			for (var i = 0; i < rootFilters.filters.length; i++)
			{
				var tmpFilter = rootFilters.filters[i];
				if (
					(!tmpFilter.logic && tmpFilter.field !== fieldName) ||
					(tmpFilter.logic && tmpFilter.filters[0].field !== fieldName)
				)
				{
					filters.push(rootFilters.filters[i]);
				}
			}
		}

		var emptyCustomFilter = {
			filters: [
				{
					field: fieldName,
					operator: 'eq',
					value: ''
				},
				{
					field: fieldName,
					operator: 'eq',
					value: ''
				}
			],
			logic: 'and'
		};

		filters.push(emptyCustomFilter);

		self.kendoGrid.dataSource.filter({ logic: 'and', filters: filters });
		self.obHeaderFilterSets.remove(function (filterSet)
		{
			return filterSet.FilterItems[0].FieldName === fieldName;
		});
	};

	LightKendoGrid.prototype.visibleCustomFilterBtnByClick = function (e)
	{
		var self = this;

		var $menuFilterBtn = this._findMenuFilterBtn.bind(this)(e);
		var $input = this._findDDLInput(e);
		var isMiniGridEditMode = !!(self.options && self.options.miniGridEditMode);
		var checkSetEmptyFilter = $input.data('isempty') || $input.data('islist') || $input.data('dateTimeNonParam');
		self.visibleCustomFilterBtnCommon($menuFilterBtn, $input);

		this.hideAndClearSpecialFilterBtn.bind(this)(e, 'custom');

		if (!$input.data('iscustom'))
		{
			if ($input.val() != '' || checkSetEmptyFilter)
			{
				self.$customFilterBtn = $menuFilterBtn;
				$input.val('');
				self.setEmptyCustomFilter(e, $menuFilterBtn);

				if (isMiniGridEditMode)
				{
					// Mini Grid Edit Mode do not need to fresh the grid. Open the custom menu directly.
					$menuFilterBtn.click();
				}
			}
			else
			{
				$menuFilterBtn.click();
			}
		}
		else
		{
			$menuFilterBtn.click();
		}
		$input.data('iscustom', true);
	};

	LightKendoGrid.prototype.visibleCustomFilterBtn = function ($filterBtn, columnIdx)
	{
		var self = this;
		var $menuFilterBtn = $(self.$container.find('.k-filter-custom-btn')[columnIdx]);
		var $input = $filterBtn.parent().parent().parent().find('input[type=text]');

		self.visibleCustomFilterBtnCommon($menuFilterBtn, $input);

		if (!$input.data('iscustom'))
		{
			$input.val('');
		}
		$input.data('iscustom', true);
	};

	LightKendoGrid.prototype.visibleCustomFilterBtnCommon = function ($menuFilterBtn, $input)
	{
		$menuFilterBtn.removeClass('hidden');
		if ($input.data('kendo-role') === "datepicker")
		{
			$menuFilterBtn.addClass("data-picker-custom-filter");
		}

		let cellWidget = $input.data('kendo-role');
		if (cellWidget === "datetimepicker" || cellWidget === 'datepicker')
		{
			TF.FilterHelper.hideDatetimeNumberCell($input, cellWidget);
		}

		TF.FilterHelper.disableFilterCellInput($input);
		$input.addClass('k-filter-custom-input');

		setTimeout(function ()
		{
			var $clearBtnBuildByKendo = $input.parent().parent().parent().find('button:not(.clear-custom-filter-menu-btn)');
			$clearBtnBuildByKendo.css('display', 'none');
		}, 50);
	};

	LightKendoGrid.prototype.hideAndClearCustomFilterBtn = function (e)
	{
		var self = this;
		var $menuFilterBtn = self._findMenuFilterBtn.bind(self)(e);
		$menuFilterBtn.addClass('hidden');

		var $input = self._findDDLInput(e);
		$input.removeClass('k-filter-custom-input');
		var clearFilterButton = $($input.parent().find(".clear-custom-filter-menu-btn"));
		if (clearFilterButton.length > 0)
		{
			clearFilterButton.remove();
		}
		$input.data('iscustom', false);

		var fieldName = self._getSelectedFilterFieldName.bind(self)(e);

		self.clearCustomFilterByFieldName(fieldName);
	};

	LightKendoGrid.prototype.clearCustomFilterByFieldName = function (fieldName)
	{
		var rootFilter = this.kendoGrid.dataSource.filter();
		if (!rootFilter || rootFilter.length === 0)
			return;

		rootFilter.filters = rootFilter.filters.filter(function (filter)
		{
			if (filter.field === fieldName)
				return false;
			else if (filter.logic && filter.filters[0].field === fieldName)
				return false;
			else
				return true;
		});
	};

	LightKendoGrid.prototype.hideAndClearSpecialFilterBtn = function (e, filterCellType)
	{
		var self = this;
		var $input = this._findDDLInput(e);

		if (filterCellType !== 'list' && $input.data('islist'))
			self.hideAndClearListFilterBtn.bind(self)(e);

		if (filterCellType !== 'custom' && $input.data('iscustom'))
			self.hideAndClearCustomFilterBtn.bind(self)(e);

		if (filterCellType !== 'empty' && $input.data('isempty'))
			self.hideAndClearEmptyFilterBtn.bind(self)(e);

		if (filterCellType !== 'custom' &&
			filterCellType !== 'list' &&
			filterCellType !== 'empty')
		{
			if ($input.data("kendoDatePicker")) // date column
			{
				if ($input.data('kendoDatePicker').value())
				{
					$input.data('kendoDatePicker').value("");
					$input.data('kendoDatePicker').trigger("change");
				}
			}
			else if ($input.parent().data('kendoCustomizedTimePicker')) // time column
			{
				if ($input.parent().data('kendoCustomizedTimePicker').value())
				{
					$input.parent().data('kendoCustomizedTimePicker').value("");
					$input.parent().data('kendoCustomizedTimePicker').trigger("change");
				}
			}
			else if ($input.parent().data('kendoCustomizedDateTimePicker')) // dateTime column
			{
				if ($input.parent().data('kendoCustomizedDateTimePicker').value())
				{
					$input.parent().data('kendoCustomizedDateTimePicker').value("");
					$input.parent().data('kendoCustomizedDateTimePicker').trigger("change");

					setTimeout(function ()
					{
						$input.val('');
						$input.trigger('blur');
					}, 500);
				}
			}
			else
			{
				$input.val('');
				$input.trigger('blur');
			}
			TF.FilterHelper.enableFilterCellInput($input);
		}
	};

	LightKendoGrid.prototype.getColumnType = function (e)
	{
		var self = this,
			input = $("[aria-activedescendant='" + $(e.currentTarget).parent().find("[id]")[0].id + "']").prev().find("input"),
			fieldName = input.closest("[data-kendo-field]").attr("data-kendo-field"),
			field = self._gridDefinition.Columns.filter(function (c) { return c.FieldName === fieldName });

		return field[0] ? field[0].type : '';
	};

	LightKendoGrid.prototype.addFilterClass = function ()
	{
		var self = this, $listContainer;

		if (self.options.disableQuickFilter)
		{
			return;
		}

		$listContainer = $(".k-list-container:not(.not-lightkendogrid):not(.filter-updated)");
		$listContainer = $listContainer.filter(function ()
		{
			return $(this).parents('form.k-filter-menu').length == 0;
		});

		const updatedClassName = "filter-updated";
		const uniqueClassName = self.$container.data("uniqueClassName") ? "filter-container-" + self.$container.data("uniqueClassName") : "";

		$listContainer.each(function (i, item)
		{
			$(item).addClass(updatedClassName);
			uniqueClassName && $(item).addClass(uniqueClassName);
		});

		for (var key in this.filterNames)
		{
			var cssSelectorStr = 'li:contains("' + key + '")';

			$listContainer.find(cssSelectorStr).filter(function () { return $(this).text() === key; })
				.addClass('filter').addClass(this.filterNames[key]);

			switch (key)
			{
				case "Custom":
					var customCssSelectorStr = cssSelectorStr + ':not(".has-custom-filter-btn-click")';
					var $containers = $listContainer.find(customCssSelectorStr).filter(function () { return $(this).text() === key; });

					$containers.off(customClickAndTouchEvent).on(customClickAndTouchEvent, self.customFilterBtnClick.bind(self)).addClass('has-custom-filter-btn-click');
					break;
				case "List":
					var listCssSelectorStr = cssSelectorStr + ':not(".has-list-filter-btn-click")';
					var $containers = $listContainer.find(listCssSelectorStr).filter(function () { return $(this).text() === key; });

					$containers.off(customClickAndTouchEvent).on(customClickAndTouchEvent, self.listFilterBtnClick.bind(self)).addClass('has-list-filter-btn-click');
					break;
				case "Empty":
				case "Not Empty":
					var $listContainers = $listContainer.find(cssSelectorStr).filter(function () { return $(this).text() === key; });
					var $listContainersNeedBindClick = [];
					for (var i = 0; i < $listContainers.length; i++)
					{
						if ($._data($listContainers[i], "events") == undefined || $._data($listContainers[i], "events").click == undefined)
						{
							$listContainersNeedBindClick.push($listContainers[i]);
						}
					}
					$($listContainersNeedBindClick).off(customClickAndTouchEvent).on(customClickAndTouchEvent,
						function (e)
						{
							var input = $("[aria-activedescendant='" + $(e.currentTarget).parent().find("[id]")[0].id + "']").prev().find("input"),
								fieldName = input.closest("[data-kendo-field]").attr("data-kendo-field"),
								operator = $(e.currentTarget).hasClass('isempty') ? 'isempty' : 'isnotempty',
								filter = { field: fieldName, operator: operator, value: '' },
								kendoFilters = self.kendoGrid.dataSource.filter(),
								filters = [];
							if (kendoFilters)
							{
								for (var i = 0; i < kendoFilters.filters.length; i++)
								{
									if (kendoFilters.filters[i].field !== fieldName)
									{
										if (kendoFilters.filters[i].filters)
										{
											if (kendoFilters.filters[i].filters.length > 0 &&
												kendoFilters.filters[i].filters[0].field !== fieldName)
												filters.push(kendoFilters.filters[i]);
										}
										else
										{
											filters.push(kendoFilters.filters[i]);
										}
									}
								}
							}
							filters.push(filter);
							input.data("isempty", true);

							// datetime filter cell dom tree is changed
							var fieldName = input.closest("[data-kendo-field]").attr("data-kendo-field"),
								field = self._gridDefinition.Columns.filter(function (c) { return c.FieldName === fieldName }),
								filterType = field[0] ? field[0].type : '';
							if (TF.FilterHelper.isDateOrDateTimeFilterType(filterType)) // hide the number input cell on datetime filter
							{
								let filterCell = input.closest('span.k-filtercell');
								let rawCellCls = filterType === 'datetime' ? ".tf-filter" : ".k-datepicker";
								let rawCellInputCls = filterType === 'datetime' ? ".datepickerinput" : ".k-datepicker .k-input";
								filterCell.find(rawCellCls).show();
								filterCell.find("span.date-number").hide();
								filterCell.find(rawCellInputCls).data("isempty", true);

							}
							self.hideAndClearSpecialFilterBtn.bind(self)(e, 'empty');
						});
					break;
				default:
					var $filterContainers = $listContainer.find(cssSelectorStr).filter(function () { return $(this).text() === key; });
					var $filterContainersNeedBindClick = [];
					for (var i = 0; i < $filterContainers.length; i++)
					{
						if ($._data($filterContainers[i], "events") == undefined || $._data($filterContainers[i], "events").click == undefined)
						{
							$filterContainersNeedBindClick.push($filterContainers[i]); // for avoid bind the click multiple
						}
					}

					$($filterContainersNeedBindClick).off(customTouchMoveEvent).on(customTouchMoveEvent, function (ev)
					{
						if (customTouchMoveTimeOut)
						{
							clearTimeout(customTouchMoveTimeOut)
							customTouchMoveTimeOut = null;
						}

						// Ignore the touchend event caused by touchmove.
						customTouchMoveTimeOut = setTimeout(() =>
						{
							customTouchMoveLock = true;
						}, 50);
					});

					$($filterContainersNeedBindClick).off(customClickAndTouchEvent).on(customClickAndTouchEvent,
						function (e)
						{
							if (customTouchMoveTimeOut)
							{
								clearTimeout(customTouchMoveTimeOut)
								customTouchMoveTimeOut = null;
							}

							if (customTouchMoveLock === true && TF.isMobileDevice)
							{
								customTouchMoveLock = false;
								return;
							}

							var input = $("[aria-activedescendant='" + $(e.currentTarget).parent().find("[id]")[0].id + "']").prev().find("input"),
								fieldName = input.closest("[data-kendo-field]").attr("data-kendo-field"),
								field = self._gridDefinition.Columns.filter(function (c) { return c.FieldName === fieldName }),
								filterCellType = 'default',
								filterType = field[0] ? field[0].type : '',
								filter = $(e.currentTarget).text();

							var numberFilterCell = $(input.closest("[data-kendo-field]").find("input.date-number")[1]).data("kendoNumericTextBox");

							if (filterType === 'datetime') // handle the datetime filter cell
							{
								let filterDateTimeCell = input.closest('span.k-filtercell');
								let $inputElement = filterDateTimeCell.find(".datepickerinput.k-input");
								numberFilterCell.value(null);
								self.handleDatetimeFilter(e);
								numberFilterCell.setOptions({
									format: "{0:0}"
								});
								if (TF.FilterHelper.dateTimeNumberFiltersName.indexOf(filter) > -1)
								{
									const formatStr = TF.FilterHelper.getNilFiltersFormat(filter);
									numberFilterCell.setOptions({
										format: formatStr.replace("X", "0")
									});
								}
								$inputElement.data("dateTimeNonParam", false);
								if (TF.FilterHelper.dateTimeNonParamFiltersName.indexOf(filter) > -1) // handle the non param input cell
								{
									filterCellType = 'empty';
									$inputElement.data("dateTimeNonParam", true);
								}
							} else if (filterType === 'date') // date has differen cell struct with datetime
							{
								$(input.closest("[data-kendo-field]").find("input.date-number")[1]).data("kendoNumericTextBox").value(null);
								self.handleDateFilter(e);
								let filterDateCell = input.closest('span.k-filtercell');
								let dateTimeNonParamValue = TF.FilterHelper.dateTimeNonParamFiltersName.indexOf(filter) > -1 ||
									TF.FilterHelper.dateTimeNumberFiltersName.indexOf(filter) > -1;
								let filterDateCellInput = filterDateCell.find(".k-datepicker .k-input");
								numberFilterCell.value(null);
								self.handleDateFilter(e);

								numberFilterCell.setOptions({
									format: "{0:0}"
								});

								if (TF.FilterHelper.dateTimeNumberFiltersName.indexOf(filter) > -1)
								{
									const formatStr = TF.FilterHelper.getNilFiltersFormat(filter);
									numberFilterCell.setOptions({
										format: formatStr.replace("X", "0")
									});
								}

								filterDateCellInput.data("dateTimeNonParam", dateTimeNonParamValue);
								if (TF.FilterHelper.dateTimeNonParamFiltersName.indexOf(filter) > -1) // handle the non param input cell
								{
									filterCellType = 'empty';
								}
								else if (TF.FilterHelper.dateTimeDateParamFiltersNames.indexOf(filter) > -1)
								{
									// for avoid the flash the grid
									filterDateCellInput.attr('reloadfilter', true);
								}
							}
							self.hideAndClearSpecialFilterBtn.bind(self)(e, filterCellType);
						});
					break;
			}
		}
		this.$container.find("input.k-dropdown-operator").each(function (i, item)
		{
			var isSpecialFilterType = function (input)
			{
				return input.data('isempty') || input.data('not empty') ||
					input.data('iscustom') || input.data('islist');
			};

			var isNeedHideSpecialFilterType = function (input)
			{
				return input.data('isempty') || input.data('not empty') ||
					input.data('islist');
			};

			var onDropDownListChange = function (e)
			{
				$(item).prev().find(self.filterClass).attr("class", "k-icon k-i-filter " + self.filterNames[this.text()]);
				var $filterCell = $(item).parent().parent().parent();
				var $filterCellInner = $filterCell.find('> span');

				var input = $filterCell.find("input[type=text]");
				let isDateTimeNonParam = TF.FilterHelper.dateTimeNonParamFiltersName.indexOf(this.text()) > -1;
				TF.FilterHelper.clearFilterCellInput(input);
				//remove display css for clear button
				TF.CustomFilterHelper.removeCustomFilterEllipsisClass(input);
				if (isSpecialFilterType(input) || isDateTimeNonParam)  //User should not type in values when "empty" or "not empty" filters are applied
				{
					TF.FilterHelper.disableFilterCellInput(input);
					$filterCellInner.addClass("hide-cross-button");
				}
				else
				{
					TF.FilterHelper.enableFilterCellInput(input);
					$filterCellInner.removeClass("hide-cross-button");

					if (input.val() === "" &&
						$filterCellInner.find(".k-button")[0]) //fix clear button shows briefly then disappears when transitioning from Empty or Is Empty to another operator
					{
						$filterCellInner.find(".k-button")[0].style.display = "none";
					}
				}
			};

			var dropdownlist = $(item).data("kendoDropDownList");
			dropdownlist.bind('change', onDropDownListChange);

			$(item).parent().next().off(customClickAndTouchEvent).on(customClickAndTouchEvent, function (e)
			{
				var input = $(e.currentTarget).parent().find("input");
				if (input.data("isempty"))
				{
					TF.FilterHelper.enableFilterCellInput(input);
					input.data("isempty", false);
				}
			});
		});
	};

	LightKendoGrid.prototype.setColumnCurrentFilterIcon = function ()
	{
		var self = this;
		self.$container.find(".k-filtercell .k-dropdown-wrap .k-input").each(function (idx, item)
		{
			if (!self.kendoGrid)
			{
				return;
			}
			var $item = $(item),
				text = $item.text();
			var filter = self.kendoGrid.dataSource.filter();
			var fieldName = $item.closest('span[data-kendo-field]').attr('data-kendo-field');
			if (filter && filter.filters)
			{
				for (var i = 0; i < filter.filters.length; i++)
				{
					if (filter.filters[i].filters && filter.filters[i].filters.length > 0)
					{
						for (var j = 0; j < filter.filters[i].filters.length; j++)
						{
							if (filter.filters[i].filters[j].FieldName == fieldName)
							{
								text = "Custom";
								$item.text(text);
								break;
							}
						}
					}
					else if (filter.filters[i].FieldName == fieldName)
					{
						for (var key in self.filterNames)
						{
							if (self.filterNames[key] == self.operatorKendoMapFilterNameValue[filter.filters[i].operator])
							{
								text = key;
								$item.text(text);
								break;
							}
						}
						break;
					}
				}
			}
			for (var key in self.filterNames)
			{
				if (text === key)
				{
					if (text === 'List')
					{
						self.visibleListFilterBtn2($item, idx);
						self.bindListFilterBtnEvent($item, idx);
					}
					else if (text === 'Custom')
					{
						self.visibleCustomFilterBtn($item, idx);
					}

					var $filterBtn = $item.next().children(self.filterClass);
					self.removeFilterBtnIcon.bind(self)($filterBtn);
					$filterBtn.addClass(self.filterNames[key]);
				}
			}
		});
	};

	LightKendoGrid.prototype.removeFilterBtnIcon = function ($filterBtn)
	{
		TF.Grid.LightKendoGrid.AllFilterTypes.map(function (filterType)
		{
			if ($filterBtn.hasClass(filterType))
				$filterBtn.removeClass(filterType);
		});
	};

	LightKendoGrid.prototype.setFilterDropDownListSize = function ()
	{
		var that = this;
		var $filterItemDropDownLists = this.$container.find('input[data-kendo-role="dropdownlist"]');
		$filterItemDropDownLists.map(function (idx, filterItemDropDownList)
		{
			var kendoDropDownList = $(filterItemDropDownList).data('kendoDropDownList');
			/*
			 * under most scenario except datetime/date filter, 400px is enough as the height for the popup,
			 * and the KendoDropDownList should shrink to it's fit height if current height less than the height configured from options
			 */
			kendoDropDownList.options.height = 400;
			if (kendoDropDownList)
			{
				//when grid's parent page is closed, self situation happens, like view page dispose.
				kendoDropDownList.bind('open', function ()
				{
					var self = this;
					var fieldName = self.element.parent().parent().parent().data('kendoField');
					var fieldDef = that._gridDefinition.Columns.filter(function (c) { return c.FieldName === fieldName });
					var filterType = fieldDef[0].type;
					function highLightCustomFilterItem()
					{
						var kendoDropDownList = this;
						var field = kendoDropDownList.element.parent().parent().parent().data('kendoField');

						function isCustomFilterByFiledName(field)
						{
							var self = this;
							var rootFilter = self.kendoGrid.dataSource.filter();
							if (!rootFilter || !rootFilter.filters || rootFilter.filters.length === 0)
								return false;

							var result = rootFilter.filters.filter(function (filter)
							{
								return filter.logic && filter.filters[0].field === field;
							});

							return result.length !== 0;
						}
						var isCustomFilter = isCustomFilterByFiledName.bind(that)(field);

						if (!isCustomFilter)
							return;
						var customItemIdx = 0;
						kendoDropDownList.dataItems().map(function (item, idx)
						{
							if (item.value === "custom")
								customItemIdx = idx;
						});
						kendoDropDownList.select(customItemIdx);
					}
					highLightCustomFilterItem.bind(self)();

					if (self.popup.element.hasClass('has-set-filter-ddl-size'))
						return;

					var ddlFilterTypes = self.popup.element.find('.k-item.filter');
					if (ddlFilterTypes.hasClass('islessthanorequalto'))
						self.popup.element.addClass('lg-filter-dropdownlist');

					var $listContainer = self.popup.element,
						$listParent = self.popup.element.find('.k-list').parent();

					$listContainer.css({ "height": "", "display": "block" });
					$listParent.find('.k-list').parent().css({ "height": "" });
					$listContainer.find("div, ul, li").css("box-sizing", "content-box");
					var orgHeight = $listParent[0].scrollHeight;
					setTimeout(function ()
					{
						$listParent.height(orgHeight);
						$listContainer.height(orgHeight);
						$listContainer.find("div, ul, li").css("box-sizing", "");

						// handle datetime 
						if (TF.FilterHelper.isDateOrDateTimeFilterType(filterType))
						{
							$listParent.css("max-height", `${kendoDropDownList.options.height}px`);
							$listContainer.css("max-height", `${kendoDropDownList.options.height}px`);
							$listParent.css("overflow-y", "auto");
						}
					}, 10);

					$listContainer.addClass('has-set-filter-ddl-size');
				});

			}
		});
	};

	LightKendoGrid.prototype.disableFilterCellWhenEmptyOrNotEmptyApplied = function ()    //User should not type in values when "empty" or "not empty" filters are applied
	{
		var self = this;

		self.$container.find(".k-filtercell .k-dropdown-wrap .k-input").each(function (i, item)
		{
			var $item = $(item),
				text = $item.text();
			for (var key in self.filterNames)
			{
				if (text === key)
				{
					let keyType = key;
					if (TF.FilterHelper.dateTimeNonParamFiltersName.indexOf(key) > -1)
					{
						keyType = "Date Non Param";
					}
					switch (keyType)
					{
						case "Date Non Param":
						case "Empty":
						case "Not Empty":
							var input = $item.parent().parent().parent().find('input');
							TF.FilterHelper.disableFilterCellInput(input);
							input.parent().parent().parent().addClass("hide-cross-button");
							input.val("");
							input.data("isempty", true);
							break;
						default:
							break;
					}
				}
			}
		});
	};

	LightKendoGrid.prototype.setColumnCurrentFilterInput = function ()
	{
		var self = this;
		this.disableFilterCellWhenEmptyOrNotEmptyApplied();
		if (!self.kendoGrid)
		{
			return;
		}
		this.$container.find(".k-filtercell .k-dropdown-wrap .k-input").each(function (i, item)
		{
			var $item = $(item),
				text = $item.text();

			var $filterItem = $item.parent().parent().parent().parent();
			var fieldName = $filterItem.data('kendo-field');
			if (!self.kendoGrid.dataSource.filter())
			{
				return;
			}

			self.kendoGrid.dataSource.filter().filters.map(function (filter)
			{
				if (fieldName === filter.FieldName || fieldName === filter.field)
				{
					// FieldName is for filter sticky; field is for change the column index
					self.kendoGrid.columns.map(function (column)
					{
						if (column.FieldName === fieldName)
						{
							switch (column.type)
							{
								case "boolean":
									var kendoDropDwonList = $filterItem.find('input').data("kendoDropDownList");
									kendoDropDwonList.dataItems().map(function (dataItem, idx)
									{
										if (String(dataItem.valueField) === filter.Value)
										{
											kendoDropDwonList.select(idx);
										}
									});
									break;
								case "date":
								case "datetime":
									if (TF.FilterHelper.dateTimeNilFiltersOperator.indexOf(filter.operator) > -1)
									{
										let dateCellClass = column.type === 'date' ? '.k-datepicker' : '.input-group.tf-filter';
										let operatorName = self.getOpetatorName(filter.operator);
										$filterItem.find("span.date-number").show(); // show the input
										let formatStr = TF.FilterHelper.getNilFiltersFormat(operatorName);
										$($filterItem.find("input.date-number")[1]).data("kendoNumericTextBox").setOptions({
											format: formatStr.replace("X", "0")
										});
										$($filterItem.find("input.date-number")[1]).data("kendoNumericTextBox").value(filter.value);
										$filterItem.find(dateCellClass).hide();
										// hide the clear button
										setTimeout(function ()
										{
											if (filter.value === '' || filter.value === null)
											{
												self.hideClearBtn($filterItem);
											}
										}, 200);
									}
									break;
								default:
									break;
							}
						}
					});
				}
			});
		});
	};

	LightKendoGrid.prototype.hideClearBtn = function ($filterItem)
	{
		var clearBtn = $filterItem.find(".k-i-filter-clear").parent();
		if (clearBtn)
		{
			clearBtn.hide();
		}
	};

	LightKendoGrid.prototype.getKendoSortColumn = function ()
	{
		return [];
	};

	LightKendoGrid.prototype.getKendoColumn = function ()
	{
		var currentColumns, columnsdefalultColumnWidth = '150px', self = this;
		if (this._obSelectedColumns() && this._obSelectedColumns().length > 0)
		{
			currentColumns = this._obSelectedColumns();
		} else
		{
			currentColumns = this._gridDefinition.Columns;
		}

		currentColumns = this.handleUDFColumns(currentColumns);

		var columns = this.getKendoColumnsExtend(currentColumns, columnsdefalultColumnWidth);
		if (this.obShowEyeColumn())
		{
			var menuColumns = [
				{
					field: "map_checkbox",
					title: "<div></div>",
					width: '30px',
					sortable: false,
					filterable: false,
					locked: true,
					type: "boolean",
					hidden: !this.options.eyeColumnVisible,
					headerTemplate: "<div class='iconbutton eye-show'></div>",
					template: "<input class='eyecolumn' type='checkbox' #: booleanToCheckboxFormatter(true)# data-Id=#: typeof(Id)=='undefined'?0:Id# />"
				}];
			columns = menuColumns.concat(columns);
		}
		var bulkMenuColumnName = "bulk_menu";
		if (this.options.showLockedColumn)
		{
			var menuColumns = [
				{
					field: bulkMenuColumnName,
					title: "<div></div>",
					width: '30px',
					sortable: false,
					filterable: false,
					locked: true
				}
			];
			if (this.options.lockColumnTemplate)
			{
				menuColumns = this.options.lockColumnTemplate;
			}
			columns = menuColumns.concat(columns);
		}

		if (TF.isMobileDevice && this.options.supportMobileMultipleSelect)
		{
			var first = columns[0] || {};
			if (first.field !== bulkMenuColumnName)
			{
				first = {
					field: "multiSelectableCheckbox",
					title: "<div></div>",
					width: '30px',
					sortable: false,
					filterable: false,
					locked: true
				};
				columns.splice(0, 0, first);
			}

			var grid = this;
			first.template = function (dataItem)
			{
				var checked = dataItem ? grid.getSelectedIds().indexOf(dataItem.Id) > -1 : false;
				return "<input type='checkbox' value='" + dataItem.Id + "' class='multi-selectable'" + (checked ? " checked" : "") + "/>";
			};
			this.getSelectedIds.subscribe(function ()
			{
				var ids = this.getSelectedIds();
				this.$container.find("input.multi-selectable[type='checkbox']").each(function ()
				{
					this.checked = ids.indexOf(+this.value) > -1;
				});
			}, this);
		}

		if (this.options.expandColumns)
		{
			columns = columns.concat(this.options.expandColumns);
		}

		var supportListFilterColumns = this._gridDefinition.Columns.filter(function (column) { return column.ListFilterTemplate; });
		var supportDateTimeFilterColumns = this._gridDefinition.Columns.filter(function (column) { return column.type === 'datetime'; });
		var supportDateFilterColumns = this._gridType === 'gpsevent' ? [] : this._gridDefinition.Columns.filter(function (column) { return column.type === 'date'; });
		var supportNumberFilterColumns = this._gridDefinition.Columns.filter(function (column) { return column.type === 'number' || column.type === 'integer'; });
		var supportTimeFilterColumns = this._gridDefinition.Columns.filter(function (column) { return column.type === 'time' });
		columns.forEach(function (column)
		{
			if (supportDateTimeFilterColumns.some(function (sc)
			{
				return sc.field === column.field || (sc.UDFId != null && sc.UDFId === column.UDFId);
			}))
			{
				column.filterable.operators = TF.Grid.LightKendoGrid.OperatorWithDateTime;
			}
			if (supportDateFilterColumns.some(function (sc)
			{
				return sc.field === column.field || (sc.UDFId != null && sc.UDFId === column.UDFId);
			}))
			{
				column.filterable.operators = TF.Grid.LightKendoGrid.OperatorWithDate;
			}
			if (supportListFilterColumns.some(function (sc)
			{
				return sc.field === column.field || (sc.UDFId != null && sc.UDFId === column.UDFId);
			}))
			{
				column.filterable.operators = TF.Grid.LightKendoGrid.OperatorWithList;
			}

			if (supportNumberFilterColumns.some(function (sc)
			{
				return sc.field === column.field || (sc.UDFId != null && sc.UDFId === column.UDFId);
			}))
			{
				column.filterable.operators = TF.Grid.LightKendoGrid.OperatorWithNumber;
			}

			if (supportTimeFilterColumns.some(function (sc)
			{
				return sc.field === column.field || (sc.UDFId != null && sc.UDFId === column.UDFId);
			}))
			{
				column.filterable.operators = TF.Grid.LightKendoGrid.OperatorWithTime;
			}
		});

		this.currentDisplayColumns(columns);
		return tf.measurementUnitConverter.handleUnitOfMeasure(columns);
	};

	LightKendoGrid.prototype.handleInvisibleUDFColumns = function (columns)
	{
		var self = this,
			needHandleTypes = tf.dataTypeHelper.getAvailableDataTypes()
				.map(function (item) { return item.key; });

		if (columns
			&& columns instanceof Array
			&& needHandleTypes.some(function (type) { return type === self._gridType; }))
		{
			var invisibleUDFs = tf.UDFDefinition.getInvisibleUDFs(self._gridType);

			return _.intersectionBy(columns, invisibleUDFs, function (item) { return item.UDFId; }).map(function (i)
			{
				var result = $.extend(true, {}, i);

				result.FieldName = i.FieldName;
				result.OriginalName = i.OriginalName;
				result.DisplayName = i.DisplayName;
				return result;
			});
		}

		return [];
	};

	LightKendoGrid.prototype.handleUDFColumns = function (columns)
	{
		var self = this,
			needHandleTypes = tf.dataTypeHelper.getAvailableDataTypes().map(function (item)
			{
				return item.key;
			});

		if (columns
			&& columns instanceof Array
			&& needHandleTypes.some(function (type) { return type === self._gridType; }))
		{
			var udfs = tf.UDFDefinition.getAvailableWithCurrentDataSource(self._gridType);
			return columns.map(function (c)
			{
				if (!c.UDFId) return c;

				var matched = udfs.filter(function (u) { return u.UDFId == c.UDFId; });

				if (matched.length == 0)
				{
					return "";
				}
				else
				{
					var result = $.extend(true, {}, c);
					result.FieldName = matched[0].FieldName;
					result.OriginalName = matched[0].OriginalName;
					result.DisplayName = matched[0].DisplayName;
					return result;
				}
			}).filter(function (item)
			{
				return !!item;
			});
		}

		return columns;
	};

	LightKendoGrid.prototype.adjustUtcColumnsForClientFilter = function(columns)
	{
		const self = this;
		if (!self.options.kendoGridOption || self.options.kendoGridOption.serverPaging || !self.options.needAdjustUtcColumnsForClientFilter)
		{
			return;
		}

		columns.forEach(column =>
		{
			if (column.isUTC)
			{
				if (column.template)
				{
					const originalTemplate = column.template;
					column.template = function(item)
					{
						return originalTemplate.call(this, item, true);
					}
				}
			}
		});
	};

	LightKendoGrid.prototype.setColumnFilterableCell = function (column, definition, source)
	{
		const self = this;
		if (!definition || column.filterable === false)
		{
			return;
		}
		switch (definition.type)
		{
			case "string":
			case "select":
				column.filterable = {
					cell: {
						operator: "contains",
						template: function (args)
						{
							var filterOption = {
								dataTextField: column.field,
								filter: "contains",
								minLength: 1,
								valuePrimitive: true,
								dataSource: {
									type: "odata",
									pageSize: 100,
									serverPaging: true,
									serverFiltering: true,
									serverSorting: true,
									transport: {
										read: function (kendoOption)
										{
											var closebutton = args.element.parent().nextAll(".k-button.k-button-icon"),
												loadingElement = args.element.nextAll(".k-loading");
											if (closebutton.css("display") != "none")
											{
												loadingElement.addClass("right-button");
											}
											else
											{
												loadingElement.removeClass("right-button");
											}

											kendoOption.data.sort = [];
											kendoOption.data.isFromAutoComplete = true;
											kendoOption.data.autoCompleteSelectedColumn = column.field;
											var kendoSuccess = kendoOption.success;
											if (Enumerable.From(bigGridTypes).Contains(this._gridType))
											{
												var options = this.getApiRequestOption(kendoOption);
												options.paramData = { FieldName: tf.UDFDefinition.getOriginalName(column.field), AggregateOperator: 'Distinct100' };
												if (tf && tf.pageManager)
												{
													switch (tf.pageManager.oldPageType)
													{
														case "myrequests":
															options.paramData.filterType = "submitted";
															break;
														case "approvals":
															options.paramData.filterType = "permission";
															break;
														default:
															break;
													}
												}

												options.success = function (result)
												{
													result.Items = LightKendoGrid.normalizeResultItem(result.Items, this._gridType, this.options);
													result.Items = Enumerable.From(result.Items).Select(function (item)
													{
														var obj = {};
														obj[column.field] = column.formatType?.toLowerCase() === "phone" ||
															(column.UDFType && column.UDFType === "phone number") ?
															$.trim(tf.dataFormatHelper.phoneFormatter(item)) :
															$.trim(item);
														return obj;
													}).Distinct("$." + column.field).OrderBy("$." + column.field).Take(10).ToArray();

													kendoSuccess({
														d: {
															__count: result.FilteredRecordCount,
															results: result.Items
														}
													});
												};

												var url = pathCombine(tf.api.apiPrefix(), "search", tf.DataTypeHelper.getEndpoint(this._gridType));
												if (this.options.aggregateSearchDataSource)
												{
													url = pathCombine(tf.api.apiPrefixWithoutDatabase(), this.options.aggregateSearchDataSource, "search", tf.DataTypeHelper.getEndpoint(this._gridType));
												}
												else if (this.options.setRequestURL)
												{
													url = this.options.setRequestURL(url);
												}

												tf.dataFormatHelper.clearPhoneNumberFormat(options, self);

												!this.options.disableAutoComplete && this.postRequestData(pathCombine(url, "aggregate"), options);
											}
											else if (this._gridType === "busfinderhistorical")
											{
												// TODO-V2, need to remove
												var url = pathCombine(tf.api.apiPrefix(), "search/gpsevents/getFilterValue");

												var options = this.getApiRequestOption(kendoOption);
												options.data.fields = [column.field];

												this.postRequestData(url, options);
											}
											else if (this._gridType === "Form")
											{
												const url = this.getApiRequestURL(this.options.url);
												const udGridID = this.options.udGridID;
												let options = this.getApiRequestOption(kendoOption);
												const defaultFilter = tf.udgHelper.getUDGridIdFilter(udGridID);
												if (options.data.filterSet)
												{
													options.data.filterSet["FilterItems"].push(...defaultFilter);
												} else
												{
													const filterSet = {};
													filterSet["FilterItems"] = [];
													filterSet["FilterItems"].push(...defaultFilter);
													filterSet["FilterSets"] = [];
													filterSet["LogicalOperator"] = "and";
													options.data.filterSet = filterSet;
												}
												options.data.filterSet.UDGridID = udGridID;
												this.postRequestData(url, options);
											}
											else if (["GPSEventType", "StaffTypes"].includes(this._gridType))
											{
												//front-end simulated aggregation
												const filter = kendoOption && kendoOption.data && kendoOption.data.filter && kendoOption.data.filter.filters && kendoOption.data.filter.filters[0];
												const filterValue = filter && filter.value || "";
												const viewModel = ko.dataFor(args.element.closest(".list-mover-mover")[0]);
												const availableRecords = viewModel.allRecords.filter(x => !viewModel.selectedData.some(y => y.ID === x.ID));

												if (filterValue)
												{
													const filteredRecords = availableRecords.filter(x => (x[filter.field] || "").toLowerCase().includes(filterValue));
													kendoSuccess({
														d: {
															__count: filteredRecords.length,
															results: filteredRecords
														}
													});
												}
												else
												{
													kendoSuccess({
														d: {
															__count: availableRecords.length,
															results: availableRecords
														}
													});
												}
											}
											else
											{
												this.postRequestData(this.getApiRequestURL(this.options.url), this.getApiRequestOption(kendoOption));
											}
										}.bind(this)
									}
								}
							};
							if (this.options.dataSource)
							{
								filterOption.dataSource = args.dataSource;
							}
							args.element.kendoAutoComplete(filterOption);
						}.bind(this)
					}
				};
				break;
			case "number":
				column.format = column.format || (!!column.UDFId ? (_.isNumber(column.Precision) && Number(column.Precision) > 0 ? String.format("{0:n{0}}", column.Precision) : "{0:0}") : "{0:n2}");
				column.filterable = {
					cell: {
						operator: "eq",
						template: function (args)
						{
							args.element.kendoNumericTextBox({
								decimals: definition.Precision || 2,
								format: definition.format || "{0:n2}"
							});
						}
					}
				};
				break;
			case "integer":
				column.format = definition.format || "{0:n0}";
				column.filterable = {
					cell: {
						operator: "eq",
						template: function (args)
						{
							args.element.kendoNumericTextBox({ format: "n0" });
							$(args.element[0]).on("keypress", function (event, e)
							{
								if (event.which == 46)
								{
									args.element[0].value = args.element[0].value.replace('.', '');
									event.preventDefault();
								}
							});
						}
					}
				};
				break;
			case "time":
				column.format = definition.format || "{0:h:mm tt}";
				column.filterable = {
					cell: {
						template: function (args)
						{
							var span = $(args.element[0].parentElement);
							span.empty();
							var $dateTimeBtn = $("<span class='input-group tf-filter' data-kendo-bind='value: value' data-kendo-role='customizedtimepicker'></span>");

							if (source === "listmover")
								$dateTimeBtn.attr('Width', '150px');

							span.append($dateTimeBtn);
						}
					},
					ui: function (element)
					{
						var buildDataTimePickBtn = function ($kendoElement)
						{
							var $dataTimePickBtn = $('<span style="width: 13.2em" class="input-group tf-filter" data-kendo-role="customizedtimepicker"></span>');

							var kendoDataBindStr = $kendoElement.data('kendo-bind');
							$dataTimePickBtn.attr('data-kendo-bind', kendoDataBindStr);

							$kendoElement.replaceWith($dataTimePickBtn);
							$kendoElement.kendoCustomizedTimePicker({});
						}.bind(self);

						var $dataTimePickBtn = buildDataTimePickBtn(element);

					}
				};
				break;
			case "date":
				column.format = "{0:MM/dd/yyyy}";
				column.filterable = {
					cell: {
						operator: "eq",
						template: function (args)
						{
							args.element.kendoDatePicker();
							args.element.on("keypress", function (e)
							{
								if ((e.which < 45 || e.which > 57) && TF.Input.BaseBox.notSpecialKey(e))
								{
									e.preventDefault();
								}
							});
							var datePicker = args.element.data("kendoDatePicker");
							var dateHelper = new TF.DateBoxHelper(datePicker);
							args.element.on("focus", (e) =>
							{
								// for recover the raw date value string
								let datePicker = args.element.data("kendoDatePicker");
								let span = $(args.element[0].parentElement).parent().parent();
								let operator = span.find("input.k-dropdown-operator").val();
								if (TF.FilterHelper.dateTimeDateParamFiltersOperator.includes(operator))
								{
									let oldText = datePicker._oldText;
									if (oldText)
									{
										$(args.element).val(oldText);
									}
								}
							});
							args.element.on("blur", (e) =>
							{
								// for setting the "ON","On or After", "On or Before" label for date filter cell
								let cellValue = $(args.element).val();
								let span = $(args.element[0].parentElement).parent().parent();
								let operator = span.find("input.k-dropdown-operator").val();
								if (TF.FilterHelper.dateTimeDateParamFiltersOperator.includes(operator))
								{
									if (cellValue && cellValue !== '')
									{
										let operatorName = span.find('input.k-dropdown-operator').attr("aria-label");
										if (operatorName)
										{
											operatorName = operatorName.replace("X", "");
										}
										// This settimeout is designed to make sure value is setted correctly. Will be removed if there is better solution.
										setTimeout(() =>
										{
											$(args.element).val(operatorName + cellValue);
										});
									}
								}
							});
							datePicker.dateView.popup.options.origin = "bottom right";
							datePicker.dateView.popup.options.position = "top right";
							dateHelper.trigger = function ()
							{
								this.trigger("change");
							}.bind(datePicker);

							// insert number for integer paramber								
							var span = $(args.element[0].parentElement).parent().parent()
							self.createDateIntegerFilterCell(span, 'date');
						}
					}
				};
				break;

			case "datetime":
				column.format = "{0:MM/dd/yyyy hh:mm tt}";
				column.filterable = {
					cell: {
						operator: "eq",
						template: function (args)
						{
							var span = $(args.element[0].parentElement);
							span.empty();
							span.append($("<span class='input-group tf-filter' data-kendo-bind='value: value' data-kendo-role='customizeddatetimepicker'></span>"));
							// insert number for integer paramber								
							self.createDateIntegerFilterCell(span, 'datetime');
						}
					},
					ui: function (element)
					{
						var buildDataTimePickBtn = function ($kendoElement)
						{
							var $dataTimePickBtn = $('<span style="width: 13.2em" class="input-group tf-filter" data-kendo-role="customizeddatetimepicker"></span>');

							var kendoDataBindStr = $kendoElement.data('kendo-bind');
							$dataTimePickBtn.attr('data-kendo-bind', kendoDataBindStr);

							$kendoElement.replaceWith($dataTimePickBtn);
							$kendoElement.kendoCustomizedDateTimePicker({});
						}.bind(this);

						var $dataTimePickBtn = buildDataTimePickBtn(element);

					}
				};
				break;

			case "boolean":
				// udf filterable definition is in UDFDefinition.js
				if (column.UDFId == null)
				{
					column.filterable = {
						positiveLabel: column.filterablePositiveLabel || "True",
						negativeLabel: column.filterableNegativeLabel || "False",
						cell: {
							template: function(args)
							{
								args.element.kendoDropDownList({
									dataSource: new kendo.data.DataSource({
										data: [
											{ someField: "(not specified)", valueField: "null" },
											{ someField: column.filterable.positiveLabel, valueField: "true" },
											{ someField: column.filterable.negativeLabel, valueField: "false" }
										]
									}),
									dataTextField: "someField",
									dataValueField: "valueField",
									valuePrimitive: true
								});
							},
							showOperators: false
						}
					};
				}
				break;
			case "image":
				column.filterable = {
					cell: {
						template: function (args)
						{
							args.element.kendoDropDownList({
								dataSource: {
									data: this.getImageFilterableDataSource(definition.questionType === "SystemField" ?
										definition.questionFieldOptions?.DefaultText : definition.FieldName)
								},
								dataTextField: "someField",
								dataValueField: "valueField",
								valuePrimitive: true,
								valueTemplate: '<span class="icon-select-item #:data.someField#"></span>',
								template: '<span class="icon-select-item #:data.someField#"></span>'
							});
						}.bind(this),
						showOperators: false
					}
				};
				break;
			case "nofilter":
				break;
		}
	};

	LightKendoGrid.prototype.createDateIntegerFilterCell = function (span, columnType)
	{
		let self = this,
			numberInput = $("<input type='text' class='date-number'>");
		span.append(numberInput);
		numberInput.kendoNumericTextBox({
			format: "{0:0}",
			decimals: 0,
			min: 1,
			change: function (e)
			{
				//this.trigger('change');
				var fieldName = numberInput.closest("[data-kendo-field]").attr("data-kendo-field"),
					value = this.value(),
					operator = span.find("input.k-dropdown-operator").val();

				if (value !== null)
				{
					var validateResult = self.validateDateTimeInteger(operator, value);
					if (validateResult !== null)
					{
						e.preventDefault();
						setTimeout(() =>
						{
							tf.promiseBootbox.alert('The filter value must be range: ' + validateResult + '.').then(function ()
							{
								numberInput.parent().find('.k-formatted-value').focus();
							});
						})
						return false;
					}
				}

				if (value !== null && value !== '')
				{
					self.handleDateTimeNilFilterToKendoDataSource(numberInput.val(), fieldName, operator);
				} else
				{
					let filterCell = span.closest(".k-filtercell").data('kendoFilterCell');
					if (filterCell)
					{
						filterCell.clearFilter();
					}
				}
			}
		});

		numberInput.hide();
	};

	LightKendoGrid.prototype.validateDateTimeInteger = function (operator, value)
	{
		let allowRange = 0;

		if (operator === 'onyearx')
		{
			return value > 2040 || value < 1970 ? '1970 ~ 2040' : null;
		}

		switch (operator)
		{
			case "lastxdays":
			case "nextxdays":
				allowRange = 30 * 12 * 365;
				break;
			case "lastxhours":
			case "nextxhours":
				allowRange = 30 * 12 * 365 * 24;
				break;
			case "lastxmonths":
			case "nextxmonths":
				allowRange = 30 * 12;
				break;
			case "lastxweeks":
			case "nextxweeks":
				allowRange = 30 * 12 * 4;
				break;
			case "nextxyears":
			case "lastxyears":
				allowRange = 30;
				break;
			case "olderthanxmonths":
				allowRange = 30 * 12;
				break;
			case "olderthanxyears":
				allowRange = 30 * 2;
				break;
			case "lastxhours":
				allowRange = 30 * 12 * 365 * 24;
				break;
		}
		return value > allowRange ? '1 ~ ' + allowRange : null;

	}

	LightKendoGrid.prototype.postRequestData = function (url, requestOption)
	{
		let promise;
		if (this.options.getAsyncRequestOption)
		{
			promise = this.options.getAsyncRequestOption(requestOption);
		}
		else
		{
			promise = Promise.resolve(requestOption);
		}
		promise.then(response =>
		{
			tf.ajax["post"](url, response, { overlay: false });
		})
	}

	LightKendoGrid.prototype.getKendoColumnsExtend = function (currentColumns, defalultColumnWidth)
	{
		var self = this;
		var columns = currentColumns.map(function (definition)
		{
			var column = definition;
			column.field = definition.FieldName;
			column.title = definition.DisplayName;
			if (!column.width)
				column.width = definition.Width || defalultColumnWidth;
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
			if (self.tobeLockedColumns.length > 0)
			{
				var lockColumn = self.tobeLockedColumns.filter(function (c)
				{
					return c.field === column.field;
				});
				column.locked = lockColumn && lockColumn.length > 0;
			}
			if (JSON.stringify(column.filterable.cell) === '{}')
			{
				self.setColumnFilterableCell(column, definition, "lightKendoGrid");
			}
			if (definition.AllowFiltering === false)
			{
				column.filterable = false;
			}
			if (definition.AllowSorting === false)
			{
				column.sortable = false;
			}
			if (definition.template !== undefined)
			{
				column.template = definition.template;
			}
			if (!self.options.showOperators)
			{
				if (column.filterable)
				{
					column.filterable.cell.showOperators = false;
				}
			}
			return column;
		});

		return columns;
	}

	LightKendoGrid.prototype.getImageFilterableDataSource = function (fieldName)
	{
		var dataSource = [];
		switch (fieldName)
		{
			case "Ampmschedule":
				dataSource.push({ someField: "", valueField: "" });
				dataSource.push({ someField: tf.studentGridDefinition.gridDefinition().getIconUrl_Ampmschedule("14"), valueField: "14" });
				dataSource.push({ someField: tf.studentGridDefinition.gridDefinition().getIconUrl_Ampmschedule("15"), valueField: "15" });
				dataSource.push({ someField: tf.studentGridDefinition.gridDefinition().getIconUrl_Ampmschedule("16"), valueField: "16" });
				break;
			case "Ampmtransportation":
				dataSource.push({ someField: "", valueField: "" });
				dataSource.push({ someField: tf.studentGridDefinition.gridDefinition().getIconUrl_Ampmtransportation("10"), valueField: "10" });
				dataSource.push({ someField: tf.studentGridDefinition.gridDefinition().getIconUrl_Ampmtransportation("11"), valueField: "11" });
				dataSource.push({ someField: tf.studentGridDefinition.gridDefinition().getIconUrl_Ampmtransportation("12"), valueField: "12" });
				break;
			case "RidershipStatus":
				dataSource.push({ someField: "", valueField: "" });
				dataSource.push({ someField: tf.tripGridDefinition.gridDefinition().getIconUrl_RidershipStatus("37"), valueField: "37" });
				dataSource.push({ someField: tf.tripGridDefinition.gridDefinition().getIconUrl_RidershipStatus("39"), valueField: "39" });
				break;
			case "PolicyDeviation":
				dataSource.push({ someField: "", valueField: "" });
				dataSource.push({ someField: tf.studentGridDefinition.gridDefinition().getIconUrl_PolicyDeviation("37"), valueField: "37" });
				break;
			case "Notes":
				dataSource.push({ someField: "", valueField: "" });
				dataSource.push({ someField: tf.studentGridDefinition.gridDefinition().getIconUrl_Notes("5"), valueField: "5" });
				break;
			case "IsLocked":
				dataSource.push({ someField: "", valueField: "" });
				dataSource.push({ someField: tf.tripGridDefinition.gridDefinition().getIconUrl_IsLocked("6"), valueField: "6" });
				dataSource.push({ someField: tf.tripGridDefinition.gridDefinition().getIconUrl_IsLocked(""), valueField: "neq" });
				break;
		}
		return dataSource;
	}

	LightKendoGrid.prototype.getImageFilterReverseSelection = function (filter)
	{
		switch (filter.field)
		{
			case "IsLocked":
				if (filter.value == "neq")
				{
					filter.operator = filter.value;
					filter.value = "6";
				}
				break;
		}
		return filter;
	}

	LightKendoGrid.prototype.getKendoField = function ()
	{
		var fields = {};
		this._gridDefinition.Columns.forEach(function (definition)
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
					field.parse = function (v)
					{
						if (!v) return "";

						var formatStr = "YYYY/MM/DD HH:mm:ss";
						var format = moment(v).format(formatStr);
						if (format === "Invalid date")
						{
							formatStr = "HH:mm:ss";
							format = moment(v).format(formatStr);
						}
						else
						{
							formatStr = "yyyy/MM/dd HH:mm:ss";
						}

						v = format !== "Invalid date" ? format : v;
						if (typeof v === 'string' && (v.toLocaleLowerCase().indexOf('pm') > 0 || v.toLocaleLowerCase().indexOf('am') > 0))
							return kendo.parseDate(v, formatStr + " t", kendo.getCulture())
						else
							return kendo.parseDate(v, formatStr, kendo.getCulture())
					};
					field.type = "date";
					break;
				case "datetime":
					field.type = "datetime";
					break;
				case "date":
					field.type = "date";
					break;
			}
			field.validation = definition.validation;
			fields[definition.FieldName] = field;
		});
		return fields;
	};

	LightKendoGrid.prototype.getApiRequestURL = function (url)
	{
		if (this.options.setRequestURL)
		{
			url = this.options.setRequestURL(url);
		}
		return url;
	};

	LightKendoGrid.prototype.getIdName = function ()
	{
		if (this._gridType === 'attendance')
		{
			return "AttendanceId";
		}
		return "Id";
	};

	function isPhoneColumn(self, autoCompleteSelectedColumn)
	{

		const _isSystemFieldPhoneNumber = function (column)
		{
			let fieldConfig = tf.systemFieldsConfig[column.questionFieldOptions?.DataTypeId];
			if (fieldConfig)
			{
				let type = fieldConfig[column.questionFieldOptions?.DefaultText]?.type;
				return type === "Phone Number";
			}
			return false;
		}

		let columnField = self.options.gridDefinition.Columns?.find(x => x.FieldName === autoCompleteSelectedColumn);
		return columnField && (columnField.questionType?.toLowerCase() === "phone" ||
			(columnField.questionType?.toLowerCase() === "systemfield" && _isSystemFieldPhoneNumber(columnField)));
	}

	function updateFilterItemsForEmptyType(filterSet)
	{
		if (!filterSet)
			return filterSet;

		filterSet.FilterItems.map(function (item)
		{
			if (["isnull", "isnotnull"].includes(item.Operator.toLowerCase()))
			{
				item.value = '';
			}
		});

		return filterSet;
	}

	LightKendoGrid.prototype.getApiRequestOption = function (kendoOptions)
	{
		let paramData = {
			take: kendoOptions.data.take ? kendoOptions.data.take : 100,
			skip: kendoOptions.data.skip ? kendoOptions.data.skip : 0,
			getCount: this.options.getCount == false ? false : true
		}
		if (Object.keys(this.options.paramData).length > 0)
		{
			Object.assign(paramData, this.options.paramData)
		}
		var self = this,
			includeOnlyIds = self.getIncludeOnlyIds(),
			excludeAnyIds = self.getExcludeAnyIds(),
			sortItems = kendoOptions.data.sort ? kendoOptions.data.sort.map(function (item)
			{
				return {
					Name: tf.UDFDefinition.getOriginalName(item.field),
					isAscending: function ()
					{
						return item.dir === "asc";
					},
					Direction: item.dir === "asc" ? "Ascending" : "Descending"
				};
			}) : [],
			options = {
				paramData: paramData,
				data: {
					sortItems: sortItems,
					idFilter: (includeOnlyIds || excludeAnyIds) ? {
						IncludeOnly: includeOnlyIds,
						ExcludeAny: excludeAnyIds
					} : null,
					filterSet: (self._gridState && self._gridState.filterSet) ? self._gridState.filterSet : null,
					filterClause: ""
				},
				success: function (result)
				{
					if (self.checkFilteredResponse(result))
					{
						return;
					}

					var autoCompleteSelectedColumn = kendoOptions.data.autoCompleteSelectedColumn;
					result.Items = LightKendoGrid.normalizeResultItem(result.Items, self._gridType, self.options);
					if (kendoOptions.data.isFromAutoComplete && autoCompleteSelectedColumn)
					{
						result.Items = Enumerable.From(result.Items).Select(function (item)
						{
							let columnValue = isPhoneColumn(self, autoCompleteSelectedColumn) ?
								tf.dataFormatHelper.phoneFormatter(item[autoCompleteSelectedColumn]) :
								item[autoCompleteSelectedColumn];
							item[autoCompleteSelectedColumn] = $.trim(columnValue);
							return item;
						}).Where(function (item)
						{
							return item[autoCompleteSelectedColumn];
						}).Distinct("x=>x." + autoCompleteSelectedColumn).OrderBy("$." + autoCompleteSelectedColumn).ToArray();
					}

					if (result.Items && result.Items instanceof Array)
					{
						const udfs = self.getUdfs();
						result.Items = result.Items.map(function (item)
						{
							udfs.forEach(function (udf)
							{
								if (udf.UDFType === 'phone number')
								{
									item[udf.FieldName] = tf.dataFormatHelper.phoneFormatter(item[udf.OriginalName]);
								} else
								{
									item[udf.FieldName] = item[udf.OriginalName];
								}
							});

							return item;
						});
					}

					//verify ajax by filter control or real ajax request
					self.result = result;
					kendoOptions.success({
						d: {
							__count: result.FilteredRecordCount,
							results: result.Items
						}
					});
					// self.$container.find(".k-loading-mask").remove();
				},
				error: function (result)
				{
					if (result && result.Message)
					{
						self.gridAlert.show({
							alert: "Danger",
							title: "Error",
							message: result.Message
						});
						kendoOptions.error(result);
					}
				},
				traditional: true
			};

		if (self.obClassicFilterSet())
		{
			options.data.filterSet = self.obClassicFilterSet();
		}
		if (self._gridState && self._gridState.filterClause)
		{
			options.data.filterClause = self._gridState.filterClause;
			if (self.obSelectedGridFilterClause())
			{
				options.data.filterClause += " and " + self.obSelectedGridFilterClause();
			}
		} else
		{
			options.data.filterClause = self.obSelectedGridFilterClause() ? self.obSelectedGridFilterClause() : "";
		}
		if (self.obSelectedGridFilterType && self.obSelectedGridFilterType() !== null && self.obSelectedGridFilterType() !== undefined)
		{
			options.data.isQuickSearch = self.obSelectedGridFilterType();
		}
		if (self.options.kendoGridOption.dataSource && self.options.kendoGridOption.dataSource.serverPaging === false)
		{
			options.paramData = {};
		}
		self.overlay = true;
		var fields = Enumerable.From(self._obSelectedColumns() && self._obSelectedColumns().length > 0 ? self._obSelectedColumns() : self._gridDefinition.Columns).Where(function (c) { return !c.hidden; }).Select(function (c) { return c.FieldName }).ToArray();

		fields = (fields || []).map(function (field)
		{
			return tf.UDFDefinition.getOriginalName(field);
		});

		if (self.isBigGrid && self.options.loadAllFields === false)
		{
			options.data.sortItems = options.data.sortItems.concat(tf.helpers.kendoGridHelper.getDefaultSortItems(self._gridType, self.options.Id));
			if (!Enumerable.From(fields).Contains(self.options.Id))
			{
				fields = fields.concat([self.options.Id]);
			}
			fields = self.bindNeedFileds(self._gridType, fields);
			options.data.fields = fields;
		}

		if (self.options.sort)
		{
			options.data.sortItems = options.data.sortItems.concat([self.options.sort]);
		}

		(options.data.sortItems || []).forEach(function (item)
		{
			item.Name = tf.UDFDefinition.getOriginalName(item.Name);
		});
		if (kendoOptions.data.filter)
		{
			options.data.filterSet = self.convertKendo2RequestFilterSet(options.data.filterSet, kendoOptions.data.filter);
		}
		//verify ajax by filter control or real ajax request
		if (kendoOptions.data.isFromAutoComplete !== true)
		{
			if (JSON.stringify(self._obSortedItems()) != JSON.stringify(sortItems ? sortItems : []))
			{
				self._obSortedItems(sortItems ? sortItems : []);
			}

			//filter
			if (self.obHeaderFilters && self.obHeaderFilters().length > 0 && !(options.data.filterSet && options.data.filterSet.FilterItems && options.data.filterSet.FilterItems.length > 0))
			{
				self.obHeaderFilters.removeAll();
			}
			else if (!(options.data.filterSet && options.data.filterSet.FilterItems && options.data.filterSet.FilterItems.length > 0) && self.obHeaderFilters().length > 0)
			{
				self.obHeaderFilters([]);
			}

			if (self.obHeaderFilterSets && self.obHeaderFilterSets().length > 0)
			{
				self.obHeaderFilterSets([]);
			}

			//verify is scroll paging or not，scroll paging will not clear slect ids and no overlay
			var newFilterString = JSON.stringify(kendoOptions.data.filter),
				newSortString = JSON.stringify(kendoOptions.data.sort),
				newFilterId = self.obSelectedGridFilterClause(),
				newFields = JSON.stringify(fields),
				newIdIncludeOnlyFilter = JSON.stringify(options.data.idFilter.IncludeOnly),
				newIdExcludeAnyFilter = JSON.stringify(options.data.idFilter.ExcludeAny);
			if ((newIdIncludeOnlyFilter !== self._oldIdIncludeOnlyFilter || newFilterId !== self._oldFilterId || newFilterString !== self._oldFilterString || newSortString !== (self._oldSortString ? self._oldSortString : "[]") || newFields !== self._oldFields))
			{
				self.getSelectedIds([]);
				self.allIds = [];
			}
			// else if (newIdExcludeAnyFilter == this._oldIdExcludeAnyFilter && this.overlayShow !== true)  // comment this block for fix issue of apply busfinder/gps events reduce count filter, overlay not display
			// {
			// 	this.overlay = false;
			// }
			self._oldFilterString = newFilterString;
			self._oldSortString = newSortString;
			self._oldFilterId = newFilterId;
			self._oldFields = newFields;
			self._oldIdIncludeOnlyFilter = newIdIncludeOnlyFilter;
			self._oldIdExcludeAnyFilter = newIdExcludeAnyFilter;
		}

		if (kendoOptions.data.filter || self._gridState.filterSet)
		{
			//options.data.filterSet = self.convertKendo2RequestFilterSet.bind(self)(options.data.filterSet, kendoOptions.data.filter);

			if (self.isEmptyFilterSet(options.data.filterSet))
			{
				delete options.data.filterSet;
				// this.obHeaderFilters();
				// this.obHeaderFilterSets();
			}
			else if (kendoOptions.data.isFromAutoComplete !== true)
			{
				var oldInitialFilter = self.initialFilter, change = false;
				self.initialFilter = true;
				if (options.data.filterSet.FilterItems && options.data.filterSet.FilterItems.length > 0)
				{
					self.obHeaderFilters(options.data.filterSet.FilterItems);
					change = true;
				}

				if (options.data.filterSet.FilterSets && options.data.filterSet.FilterSets.length > 0)
				{
					self.obHeaderFilterSets(options.data.filterSet.FilterSets);
					change = true;
				}
				self.initialFilter = oldInitialFilter;
				if (change && self._currentFilterChange)
				{
					self._currentFilterChange();
				}
			}
		}

		var sortColumns = TF.FilterHelper.getSortColumns(self._gridDefinition.Columns);
		options = TF.FilterHelper.setSortItems(options, sortColumns);

		self._removeInvisibleListFilterItems(self.getKendoColumn());
		options = self.setListFilterRequestOption.bind(self)(options);
		removeEmptyFilterItems(options);

		if (self.options.setRequestOption)
			options = self.options.setRequestOption(options);

		if (options.data.filterSet && self.isEmptyFilterSet(options.data.filterSet))
			delete options.data.filterSet;

		if (options.data.filterSet && options.data.filterSet.FilterItems && options.data.filterSet.FilterItems.length > 0)
		{
			updateFilterItemsUDFFilterName(options.data.filterSet);
			updateFilterItemsForEmptyType(options.data.filterSet);
		}

		if (options.data.filterSet && options.data.filterSet.FilterSets && options.data.filterSet.FilterSets.length > 0)
		{
			var filterSets = options.data.filterSet.FilterSets;
			filterSets.forEach(function (filterSet)
			{
				updateFilterItemsUDFFilterName(filterSet);
			});
		}

		if (kendoOptions.data.isFromAutoComplete !== true)
		{
			self.searchOption = options;
		}

		self.onFilterChanged.notify(options);

		return options;

		function updateFilterItemsUDFFilterName(filterSet)
		{
			filterSet.FilterItems = processVehicleExternalName(filterSet.FilterItems);
			filterSet.FilterItems = (filterSet.FilterItems || []).map(function (item)
			{
				item.FieldName = tf.UDFDefinition.getOriginalName(item.FieldName);
				return item;
			});

			self.setBooleanNotSpecifiedFilterItem(filterSet.FilterItems);
		}

		function processVehicleExternalName(filterItems)
		{
			filterItems = filterItems.map(function (item)
			{
				if (item.Operator === 'In' &&
					item.FieldName == 'VehicleExternalName')
				{
					var tmp = JSON.parse(item.ValueList);
					tmp = tmp.map(function (t)
					{
						t = t.trim();
						return t;
					})
					item.ValueList = JSON.stringify(tmp);
				}

				return item;
			});

			return filterItems;
		}
	};

	LightKendoGrid.prototype.getUdfs = function ()
	{
		const currentColumns = [].concat(this._obSelectedColumns()).concat(this.getKendoColumn());
		return _.uniqBy(currentColumns.filter(c => !!c.OriginalName), "UDFId");
	}

	LightKendoGrid.prototype.checkFilteredResponse = function (response)
	{
		if ([400, 412].includes(response.StatusCode) && tf.dataTypeHelper.getNameByType(this.options.gridType))
		{
			this.resetFilterForCurrentInvalidFilter(response.Message);
		}
	};

	LightKendoGrid.prototype.resetFilterForCurrentInvalidFilter = function(errorMessage)
	{
		var self = this;
		if (self._isShowingInvalidFilterAlert || !self.obSelectedGridFilterId)
		{
			return;
		}

		self.isFilterReset = true;
		self._isShowingInvalidFilterAlert = true;
		var filterId = self.obSelectedGridFilterId(),
			filterObj = self.obGridFilterDataModels().find(o => o.id() === filterId),
			filterName = filterObj ? filterObj.name() : "None",
			message = filterId ? `The applied filter "${filterName}" is invalid.` : "The applied quick filter is invalid.";
		var isNonexistentUdf = errorMessage === 'Nonexistent UDF';
		if (isNonexistentUdf)
		{
			message = 'The applied filters contains a nonexistent udf, system will clear applied filters.';
		}

		return tf.promiseBootbox.alert(message).then(function()
		{
			self._isShowingInvalidFilterAlert = false;
			Promise.resolve(isNonexistentUdf ? self.clearGridFilterClick() : self.resetLayoutClick()).then(function()
			{
				if (filterId && errorMessage !== "Invisible UDF" && !isNonexistentUdf)
				{
					// use error message to distinguish deleted udf and invisible udf.
					tf.promiseAjax.patch(pathCombine(tf.api.apiPrefixWithoutDatabase(), "gridfilters", filterId), {
						data: [{ "op": "replace", "path": "/IsValid", "value": false }]
					}).then(function()
					{
						var filters = self.obGridFilterDataModels().filter(function(filter)
						{
							return filter.id() === filterId;
						});

						if (filters && filters.length === 1)
						{
							filters[0].isValid(false);
						}
					})
				}
			})
		});
	};

	LightKendoGrid.prototype.resetFilterForCurrentInvalidFilter = function (response)
	{
		var self = this,
			filterId = self.obSelectedGridFilterId(),
			message = filterId ? String.format("The applied filter \"{0}\" is invalid.", self.obSelectedGridFilterName()) : "The applied quick filter is invalid.";
		return tf.promiseBootbox.alert(message).then(function ()
		{
			self.clearGridFilterClick().then(function ()
			{
				if (filterId && response.Message != "Invisible UDF")
				{
					// use response.Message to distinguish deleted udf and invisible udf.
					tf.promiseAjax.patch(pathCombine(tf.api.apiPrefixWithoutDatabase(), "gridfilters", filterId), {
						data: [{ "op": "replace", "path": "/IsValid", "value": false }]
					}).then(function ()
					{
						var filters = self.obGridFilterDataModels().filter(function (filter)
						{
							return filter.id() == filterId;
						});

						if (filters && filters.length == 1)
						{
							filters[0].isValid(false);
						}
					})
				}
				self.$container.find(".grid-filter-clear-all").trigger('mousedown');
			});
		});
	};

	LightKendoGrid.prototype.setBooleanNotSpecifiedFilterItem = function (filterItems)
	{
		var self = this;
		filterItems.forEach(function (filterItem)
		{
			var filterBooleanColumns = self.kendoGrid.columns.filter(function (col)
			{
				var colFieldName = tf.UDFDefinition.getOriginalName(col.field);
				return col.type === "boolean" && colFieldName === filterItem.FieldName;
			});

			if (filterBooleanColumns.length > 0 && filterItem.Value === "null")
			{
				filterItem.Operator = "IsNull";
				filterItem.Value = "";
			}
		});
	};


	function removeEmptyFilterItems(options)
	{
		if (options && options.data &&
			options.data.filterSet && options.data.filterSet.FilterItems)
			options.data.filterSet.FilterItems = TF.CustomFilterHelper.removeEmptyFilterItems(options.data.filterSet.FilterItems);
	}

	LightKendoGrid.prototype.removeUnusedListFilterRequestOption = function (options)
	{
		if (options.data.filterSet && options.data.filterSet.FilterItems && options.data.filterSet.FilterItems.length > 0)
		{
			options.data.filterSet.FilterItems = options.data.filterSet.FilterItems.filter(function (filterItem)
			{
				return (filterItem.Operator !== 'In') ||
					(filterItem.Operator === 'In' && filterItem.ValueList);
			});
		}
		return options;
	};

	LightKendoGrid.prototype.isEmptyFilterSet = function (filterSet)
	{
		return (
			!filterSet.FilterSets ||
			filterSet.FilterSets.length === 0
		) && (
				!filterSet.FilterItems ||
				filterSet.FilterItems.length === 0 ||
				filterSet.FilterItems[0] === undefined
			);
	};

	LightKendoGrid.prototype.convertKendo2RequestFilterSet = function (optionFilterSet, kendofilter)
	{
		optionFilterSet = optionFilterSet || {};
		var self = this;

		var kendofilterFilters = kendofilter.filters;
		if (!kendofilterFilters || kendofilterFilters.length === 0)
			return optionFilterSet;

		var newFilterSets = [];
		var newFilterItems = [];

		if (self.isOnlyApplyOneMenuFilterAndFillTwoInputType(kendofilterFilters))
		{
			var tmpFilterSet = {};
			tmpFilterSet = self.buildMenuFilterSet.bind(self)(kendofilter);

			if (tmpFilterSet.LogicalOperator) // ignore empty filter set
				newFilterSets.push(tmpFilterSet);
		}
		else
		{
			var fieldNamsApplyiedMenuFilter = self.getFieldNamesAppliedMenuFilter.bind(self)();

			kendofilterFilters.map(function (kendofilterFilter)
			{
				if (kendofilterFilter.filters && kendofilterFilter.filters.length === 2)
					kendofilterFilter.isMenuFilter = true;
				else
				{
					var field = kendofilterFilter.field;
					if (!field && kendofilterFilter.filters && kendofilterFilter.filters.length > 0 && kendofilterFilter.filters[0].field)
						field = kendofilterFilter.filters[0].field;
					kendofilterFilter.isMenuFilter = Array.contain(fieldNamsApplyiedMenuFilter, field);
				}
			});

			var menuFilters = kendofilterFilters.filter(function (kendofilterFilter) { return kendofilterFilter.isMenuFilter; });
			if (menuFilters.length > 0)
			{
				menuFilters.map(function (menuFilter)
				{
					var tmpFilterSet = {};

					if (!menuFilter.filters)
					{
						tmpFilterSet.FilterItems = [];
						tmpFilterSet.FilterItems.push(self.buildFilterItem.bind(self)(menuFilter));
						tmpFilterSet.LogicalOperator = 'and';
						tmpFilterSet.FilterSets = [];
					}
					else
					{
						tmpFilterSet = self.buildMenuFilterSet.bind(self)(menuFilter);
					}

					if (tmpFilterSet.LogicalOperator) // ignore empty filter set
						newFilterSets.push(tmpFilterSet);
				});
			}

			var itemFilters = kendofilterFilters.filter(function (kendofilterFilter) { return !kendofilterFilter.isMenuFilter; });
			if (itemFilters.length)
			{
				itemFilters.forEach(function (itemFilter)
				{
					var tmpItemFilter = self.buildFilterItem.bind(self)(itemFilter);
					newFilterItems.push(tmpItemFilter);
				});
			}
		}

		if (optionFilterSet && optionFilterSet.FilterSets && optionFilterSet.FilterSets.length > 0)
			newFilterItems = newFilterItems.concat(optionFilterSet.FilterSets);

		if (optionFilterSet && optionFilterSet.FilterItems && optionFilterSet.FilterItems.length > 0)
			newFilterItems = newFilterItems.concat(optionFilterSet.FilterItems);

		var logicalOperator = newFilterItems.length ? 'and' : '';
		optionFilterSet = {
			FilterItems: newFilterItems,
			FilterSets: newFilterSets,
			LogicalOperator: 'and'
		};
		return optionFilterSet;
	}

	LightKendoGrid.prototype.getFieldNamesAppliedMenuFilter = function ()
	{
		if (!this.kendoGrid)
			return [];

		var wrapper = this.kendoGrid.wrapper;
		var $filterBtnParents = wrapper.find('.k-filter-custom-btn:not(.hidden)').parent();
		fieldNamsApplyiedMenuFilter = $filterBtnParents.map(function (idx, filterBtnParent)
		{
			return $(filterBtnParent).data('kendo-field');
		});
		return fieldNamsApplyiedMenuFilter.toArray();
	};

	LightKendoGrid.prototype.isOnlyApplyOneMenuFilterAndFillTwoInputType = function (kendofilterFilters)
	{
		return (kendofilterFilters.length === 2 &&
			kendofilterFilters[0].field !== undefined &&
			kendofilterFilters[0].field === kendofilterFilters[1].field);
	};

	LightKendoGrid.prototype.buildMenuFilterSet = function (menuFilter)
	{
		var self = this;
		var filterItems = menuFilter.filters.map(function (item)
		{
			return self.buildFilterItem.bind(self)(item);
		});

		filterItems = TF.CustomFilterHelper.removeEmptyFilterItems(filterItems);
		if (filterItems && filterItems.length)
		{
			customFilterFilterSet = {
				LogicalOperator: menuFilter.logic,
				FilterItems: filterItems,
				FilterSets: []
			};
		}
		else
		{
			customFilterFilterSet = {};
		}

		return customFilterFilterSet;
	};

	LightKendoGrid.prototype.buildFilterItem = function (item)
	{
		var self = this;

		if (item.operator === "empty")
			return;

		item = self.getImageFilterReverseSelection(item);
		var filter = {
			FieldName: item.field,
			Operator: this.operatorKendoMapTF[item.operator],
			Value: item.value
		};

		if (item.ValueList || item.valueList)
		{
			if (self.isJsonFormat(item.ValueList) || self.isJsonFormat(item.valueList))
			{
				filter.ValueList = item.valueList ? item.valueList : item.ValueList;
			}
			else
			{
				filter.ValueList = JSON.stringify(item.valueList ? item.valueList : item.ValueList);
			}
		}

		// todo: build list valuelist here
		//init type hint
		var griddefinition = self._gridDefinition.Columns.filter(function (definition)
		{
			return definition.FieldName === item.field;
		})[0];
		if (griddefinition)
		{
			filter.TypeHint = "String";
			if (griddefinition.type === "number")
			{
				filter.Precision = griddefinition.Precision ? griddefinition.Precision : 2;
			}
			else if (griddefinition.type === "time")
			{
				filter.TypeHint = "Time";
				if (moment(filter.Value).isValid())
				{
					filter.Value = toISOStringWithoutTimeZone(moment(filter.Value));
				}
				else if (moment(kendo.parseDate(filter.Value)).isValid())
				{
					var format1 = 'h:m tt';
					var timeValue = kendo.parseDate(filter.Value, format1) || kendo.parseDate(filter.Value);
					filter.Value = toISOStringWithoutTimeZone(moment(timeValue));
				}
			}
			else if (griddefinition.type === "datetime")
			{
				filter.TypeHint = "DateTime";
				if (TF.FilterHelper.dateTimeNilFiltersOperator.indexOf(item.operator) >= 0)
				{
					filter.Operator = this.operatorKendoMapTF[item.operator];
					if (griddefinition.isUTC)
					{
						filter.ConvertedToUTC = true;
					}

				} else
				{
					if (griddefinition.isUTC)
					{
						filter.Value = toISOStringWithoutTimeZone(clientTimeZoneToUtc(moment(filter.Value).format("YYYY-MM-DDTHH:mm:ss")));
						filter.ConvertedToUTC = true;
					}
					else
					{
						filter.Value = toISOStringWithoutTimeZone(moment(filter.Value));
					}
				}
			}
			else if (griddefinition.type === "date")
			{
				filter.TypeHint = "Date";
				if (griddefinition.isUTC)
				{
					filter.ConvertedToUTC = true;
				}
				if (TF.FilterHelper.dateTimeNilFiltersOperator.indexOf(item.operator) >= 0)
				{
					filter.Operator = this.operatorKendoMapTF[item.operator];
				}
				else if (TF.FilterHelper.dateTimeDateParamFiltersOperator.indexOf(item.operator) > -1)
				{
					filter.Value = toISOStringWithoutTimeZone(moment(filter.Value));
				}
				else
				{
					if (griddefinition.isUTC)
					{
						filter.Value = toISOStringWithoutTimeZone(clientTimeZoneToUtc(moment(filter.Value).format("YYYY-MM-DDTHH:mm:ss")));
						filter.ExactHint = "utc";
					}
					else if (filter.Operator !== "IsWithIn")
					{
						filter.Value = toISOStringWithoutTimeZone(moment(filter.Value));
					}
					else
					{
						// Nothing to do
					}
				}
			}

			if (griddefinition.TypeHint)
			{
				filter.TypeHint = griddefinition.TypeHint;
			}

			if (griddefinition.type === "integer" || griddefinition.TypeHint === "integer")
			{
				if (filter.Value && filter.Value.toFixed)
					filter.Value = filter.Value.toFixed();
			}

			if (griddefinition.filterConvert)
			{
				filter = griddefinition.filterConvert(filter);
			}
		}
		return filter;
	};

	LightKendoGrid.prototype.isJsonFormat = function (obj)
	{
		var isjson = typeof (obj) === "string" && obj.indexOf('[\"') >= 0;
		return isjson;
	};

	LightKendoGrid.prototype.bindNeedFileds = function (type, fields)
	{
		if (this.options && this.options.isCalendarView)
		{
			return fields;
		}

		fields = LightKendoGrid.bindNeedFileds(type, fields);

		if (type === 'tripstop')
		{
			if (this.options && this.options.kendoGridOption && this.options.kendoGridOption.entityId)
			{
				if (this.options.kendoGridOption.entityId == 1 || this.options.kendoGridOption.entityId == 2)
				{
					fields = fields.concat(['Tripstopid']);
				}
			}
		}

		return fields;
	};

	LightKendoGrid.bindNeedFileds = function (type, fields)
	{
		if (type === 'student' || type === 'fieldtrip' || type === 'school')
		{
			if (!Enumerable.From(fields).Contains('School'))
			{
				fields = fields.concat(['School']);
			}
		}
		if (type === 'trip')
		{
			if (!Enumerable.From(fields).Contains('Schools'))
			{
				fields = fields.concat(['Schools']);
			}
			if (!Enumerable.From(fields).Contains('Name'))
			{
				fields = fields.concat(['Name']);
			}
		}
		if (type === 'school')
		{
			if (!Enumerable.From(fields).Contains('School'))
			{
				fields = fields.concat(['School']);
			}
		}
		if (type === 'vehicle')
		{
			if (!Enumerable.From(fields).Contains('BusNum'))
			{
				fields = fields.concat(['BusNum']);
			}
		}
		if (type === 'altsite' || type === 'georegion' || type === 'district' || type === 'contractor' || type === 'fieldtriptemplate')
		{
			if (!Enumerable.From(fields).Contains('Name'))
			{
				fields = fields.concat(['Name']);
			}
		}
		if (type === 'student')
		{
			if (!Enumerable.From(fields).Contains('FirstName'))
			{
				fields = fields.concat(['FirstName']);
			}
			if (!Enumerable.From(fields).Contains('LastName'))
			{
				fields = fields.concat(['LastName']);
			}
			if (!Enumerable.From(fields).Contains('Grade'))
			{
				fields = fields.concat(['Grade']);
			}
		}
		if (type === 'tripstop')
		{
			if (!Enumerable.From(fields).Contains('TripId'))
			{
				fields = fields.concat(['TripId']);
			}
			if (!Enumerable.From(fields).Contains('Street'))
			{
				fields = fields.concat(['Street']);
			}
			if (!Enumerable.From(fields).Contains('Sequence'))
			{
				fields = fields.concat(['Sequence']);
			}
		}
		if (type === 'staff')
		{
			if (!Enumerable.From(fields).Contains('FirstName'))
			{
				fields = fields.concat(['FirstName']);
			}
			if (!Enumerable.From(fields).Contains('LastName'))
			{
				fields = fields.concat(['LastName']);
			}
			if (!Enumerable.From(fields).Contains('StaffTypes'))
			{
				fields = fields.concat(['StaffTypes']);
			}
			if (!Enumerable.From(fields).Contains('ContractorId'))
			{
				fields = fields.concat(['ContractorId']);
			}
			if (!Enumerable.From(fields).Contains('UserID'))
			{
				fields = fields.concat(['UserID']);
			}
			
		}
		if (type === 'fieldtrip')
		{
			if (!Enumerable.From(fields).Contains('Name'))
			{
				fields = fields.concat(['Name']);
			}
			if (!Enumerable.From(fields).Contains('DepartDateTime'))
			{
				fields = fields.concat(['DepartDateTime']);
			}
			if (!Enumerable.From(fields).Contains('FieldTripStageId'))
			{
				fields = fields.concat(['FieldTripStageId']);
			}
		}
		if (type === 'document')
		{
			if (!Enumerable.From(fields).Contains('FileName'))
			{
				fields = fields.concat(['FileName']);
			}
		}
		if (type === 'fieldtripinvoice')
		{
			if (!Enumerable.From(fields).Contains('FieldTripID'))
			{
				fields = fields.concat(['FieldTripID']);
			}
			if (!Enumerable.From(fields).Contains('FieldTripStageID'))
			{
				fields = fields.concat(['FieldTripStageID']);
			}
		}
		return fields;
	};

	LightKendoGrid.prototype._selectedIdsChange = function (data)
	{
		var self = this;
		var idsHash = {};
		if (data && data.length == 0)
		{
			self.isRowSelectedWhenInit = false;
		}

		if (self.kendoGrid)
		{
			var selected = $.map(self.kendoGrid.items(), function (item)
			{
				var row = $(item).closest("tr");
				var dataItem = self.kendoGrid.dataItem(row);
				var selectedId = Enumerable.From(self.getSelectedIds());
				var selectItemEle = self.$container.find('table tr[data-kendo-uid=' + dataItem.uid + ']');
				if (dataItem && $.isNumeric(dataItem[self.options.Id]) && selectedId.Contains(dataItem[self.options.Id]))
				{
					// use setTimeout ensures that other events can't change it again
					setTimeout(function ()
					{
						selectItemEle.addClass('k-state-selected');
					})
					return item;
				} else
				{
					setTimeout(function ()
					{
						selectItemEle.removeClass('k-state-selected');
					})
				}
			});
			if (this.kendoGrid.options.selectable)
			{
				// only dispose grid own menu.
				if (tf.contextMenuManager.isGridMenu)
				{
					tf.contextMenuManager.dispose();
				}
				this.kendoGrid.clearSelection();
				this.kendoGrid.select(selected);
			}
			self._refreshGridBlank();

			var ids = self.getSelectedIds(),
				records = $.map(ids, function (item)
				{
					return self.kendoGrid.dataSource.get(item);
				});

			self.getSelectedRecords(records);

			var allIds = self.obAllIds();
			if (allIds && allIds.length)
			{
				self.obSelectedIndex(allIds.indexOf(ids[0]));
			}
			else
			{
				self.obSelectedIndex(self.kendoGrid.dataSource.indexOf(records[0]));
			}
		}

		self.getSelectedIds().forEach(function (id)
		{
			idsHash[id] = id;
		});

		this.idsHash = idsHash;
		this._resetPageInfoSelect();
	};

	LightKendoGrid.prototype._omitIdsChange = function ()
	{
		this._resetPageInfoSelect();
	};

	LightKendoGrid.prototype._resetPageInfo = function ()
	{
		var pageInfo = this.result.FilteredRecordCount + " of " + this.result.TotalRecordCount;
		this.$container.children(".k-pager-wrap").find('.pageInfo').html(pageInfo);
	};

	LightKendoGrid.prototype._resetPageInfoSelect = function ()
	{
		var self = this, pageInfoList = [], pageInfo = "", omittedRecordsCount = 0;
		if (!self.options.showOmittedCount && !self.options.showSelectedCount && self.options.gridTypeInPageInfo === "") { return; }

		if (self.options.showSelectedCount && self.options.selectable)
		{
			if (!self.isBigGrid && this.kendoGrid && this.kendoGrid.select())
			{
				pageInfoList.push($.grep(this.kendoGrid.select(), function (item, index) { return $(item).closest(".k-grid-content-locked").length === 0 }).length + " selected");
			}
			if (self.isBigGrid && self.getSelectedIds().length > 0)
			{
				pageInfoList.push(self.getSelectedIds().length + " selected");
			}
		}

		if (self.options.showOmittedCount)
		{
			if (self.obFilteredExcludeAnyIds() != null)
			{
				omittedRecordsCount = self.obFilteredExcludeAnyIds().concat(self.obTempOmitExcludeAnyIds()).length;
			}
			else
			{
				omittedRecordsCount = self.obTempOmitExcludeAnyIds().length;
			}
			if (omittedRecordsCount > 0)
			{
				pageInfoList.push((omittedRecordsCount + " omitted"));
			}
		}

		if (self.options.gridTypeInPageInfo)
		{
			pageInfo = "&nbsp;" + self.options.gridTypeInPageInfo;
		}
		if ((self.options.showSelectedCount || self.options.showOmittedCount) && pageInfoList.length > 0)
		{
			pageInfo = pageInfo + "&nbsp;(" + pageInfoList.join(", ") + ")";
		}

		self.$container.children(".k-pager-wrap").find(".pageInfoSelect")
			.html(pageInfo);
	};

	LightKendoGrid.prototype.columnResizeEvent = function (e)
	{
	};

	LightKendoGrid.prototype.columnReorderEvent = function (e)
	{
		if (this.options.columnReorder)
		{
			this.options.columnReorder(e);
		}
	};

	LightKendoGrid.prototype.columnHideEvent = function (e)
	{
	};

	LightKendoGrid.prototype.columnShowEvent = function (e)
	{
	};

	LightKendoGrid.prototype.saveState = function ()
	{
		if (this.obLayoutFilterOperation && this.obLayoutFilterOperation())
		{
			var columns = this.kendoGrid.getOptions().columns.slice(this.permanentLockCount());
			columns = Enumerable.From(columns).Where("$.field!='bulk_menu'").ToArray();
			this._obSelectedColumns(columns);
		}
	};

	LightKendoGrid.prototype.getGridState = function ()
	{
		return new TF.Grid.GridState({ gridFilterId: this.obSelectedGridFilterId(), filteredIds: this._filteredIds, filteredExcludeAnyIds: this.obFilteredExcludeAnyIds() });
	};

	/**
	 * Get the includeOnly filter id list.
	 * @return {Array}
	 */
	LightKendoGrid.prototype.getIncludeOnlyIds = function ()
	{
		var self = this,
			gridFilterIds = (self._gridState && self._gridState.filteredIds) ? self._gridState.filteredIds.slice() : null;

		if (self.additionalFilterIds && self.shouldIncludeAdditionFilterIds)
		{
			gridFilterIds = self.mergeTwoFilterIds(true, gridFilterIds, self.additionalFilterIds);
		}

		return gridFilterIds;
	};

	LightKendoGrid.prototype.getExcludeAnyIds = function ()
	{
		return this.obFilteredExcludeAnyIds() ? this.obFilteredExcludeAnyIds().concat(this.obTempOmitExcludeAnyIds()) : this.obTempOmitExcludeAnyIds();
	};

	/**
	 * Merge two filter id lists.
	 * @param {boolean} isInclude Whether they are includeOnly id lists.
	 * @param {Array} idList1 The first id list.
	 * @param {Array} idList2 The second id list.
	 * @return {Array} The merged id list.
	 */
	LightKendoGrid.prototype.mergeTwoFilterIds = function (isInclude, idList1, idList2)
	{
		// have not considered efficiency, could be optimized if got time.
		if (idList1 && idList2)
		{
			var result = [];
			if (isInclude)
			{
				idList1.map(function (id)
				{
					if (idList2.indexOf(id) !== -1)
					{
						result.push(id);
					}
				});
			}
			else
			{
				var appendUniqueValue = function (id)
				{
					if (result.indexOf(id) === -1)
					{
						result.push(id);
					}
				};
				idList1.map(appendUniqueValue);
				idList2.map(appendUniqueValue);
			}
			return result;
		}
		else
		{
			return idList1 || idList2;
		}
	};

	LightKendoGrid.prototype.getSelectedIdsWithWarning = function ()
	{
		var selectedIds = this.getSelectedIds();
		if (selectedIds.length === 0)
		{
			this.gridAlert.show({
				alert: this.gridAlert.alertOption.danger,
				message: "please select one or more items"
			});
		}
		return selectedIds;
	};

	LightKendoGrid.prototype.invertSelection = function ()
	{
		var self = this;
		this.getIdsWithCurrentFiltering().then(function (data)
		{
			var ids = data;
			var selectedIds = ids.filter(function (id)
			{
				return !self.idsHash[id];
			});
			this.getSelectedIds(selectedIds);
		}.bind(this));
	};

	LightKendoGrid.prototype.omitSelection = function ()
	{
		this.obTempOmitExcludeAnyIds(this.getSelectedIds().concat(this.obTempOmitExcludeAnyIds()));
		this.refresh();
	};

	LightKendoGrid.prototype.allSelection = function ()
	{
		this.getIdsWithCurrentFiltering().then(function (data)
		{
			this.getSelectedIds(data);
		}.bind(this));
	};

	LightKendoGrid.prototype.setSelectedIndex = function (value)
	{
		var length = this.obFilteredRecordCount();
		if (!length) return;

		value = Math.max(Math.min(length - 1, value), 0);

		if (value == -1)
		{
			this.getSelectedIds([]);
			return;
		}

		var allIds = this.obAllIds(), id;
		if (allIds && allIds.length)
		{
			id = allIds[value];
		}
		else
		{
			id = this.kendoGrid.dataSource.at(value)[this.options.Id];
		}

		this.getSelectedIds(id == null ? [] : [id]);
	};

	/**
	 * Run specified task on next data bound.
	 *
	 * @param {Function} task
	 */
	LightKendoGrid.prototype.runOnNextDataBound = function (task)
	{
		if (!!this.pendingTaskOnNextDataBound)
		{
			console.log("Pending task overriden.");
		}
		this.pendingTaskOnNextDataBound = task;
	}

	LightKendoGrid.prototype.scrollToSelection = function ()
	{
		if (!this.kendoGrid)
		{
			return;
		}

		var index = this.obSelectedIndex(),
			itemHeight = this.getItemHeight(),
			newScrollTop = index * itemHeight,
			content = this.kendoGrid.content,
			viewPortHeight = content.find('.k-virtual-scrollable-wrap')[0].clientHeight,
			vScrollbar = content.find(".k-scrollbar-vertical"),
			maxScrollTop = (this.obFilteredRecordCount() * itemHeight - viewPortHeight),
			maxVScrollbarScrollTop = vScrollbar.prop("scrollHeight") - vScrollbar.height(),
			scrollTopRate = maxVScrollbarScrollTop / maxScrollTop,
			currentScrollTop = vScrollbar.scrollTop() / scrollTopRate;

		if (newScrollTop == currentScrollTop ||
			(newScrollTop > currentScrollTop && newScrollTop + itemHeight <= currentScrollTop + viewPortHeight))
		{
			return;
		}

		if (newScrollTop + itemHeight > currentScrollTop + viewPortHeight)
		{
			newScrollTop = newScrollTop - viewPortHeight + itemHeight;
		}

		vScrollbar.scrollTop(newScrollTop * scrollTopRate);
	};

	LightKendoGrid.prototype.onCtrlIPress = function (e, keyCombination)
	{
		e.preventDefault();
		var self = this;
		self.baseKeyPress();
		if (self.disableShortCutKey == true)
		{
			return;
		}
		self.invertSelection();
	};

	LightKendoGrid.prototype.onCtrlOPress = function (e, keyCombination)
	{
		e.stopPropagation();
		e.preventDefault(); // Prevent open new file by chrome
		var self = this;
		self.baseKeyPress();
		if (self.disableShortCutKey == true)
		{
			return;
		}
		setTimeout(function ()
		{
			self.omitSelection();
		}, 0);
		setTimeout(function ()
		{
			e.stopPropagation();
			e.preventDefault(); // Prevent open new file by chrome
		}, 1000);
	};

	LightKendoGrid.prototype.onCtrlAPress = function (e, keyCombination)
	{
		e.preventDefault();
		var self = this;
		self.baseKeyPress();
		if (self.disableShortCutKey == true)
		{
			return;
		}
		self.allSelection();
	};

	/**
	 * Both all key press will be doing some thing on ViewFinder.
	 * @returns {void} 
	 */
	LightKendoGrid.prototype.baseKeyPress = function ()
	{
	};

	LightKendoGrid.prototype._showCannotSupportSelectAllModal = function ()
	{
	};

	LightKendoGrid.prototype.onShiftDown = function (e, keyCombination)
	{
		if (this.kendoGrid.options.sortable.mode != "multiple")
		{
			this.kendoGrid.setOptions({ sortable: { mode: "multiple" } });
		}
	};

	LightKendoGrid.prototype.onShiftUp = function (e, keyCombination)
	{
		this.kendoGrid.setOptions({ sortable: { mode: "single" } });
	};

	LightKendoGrid.prototype.beforeSendFirstRequest = function ()
	{
		var self = this;

		if (this.options.beforeSendFirstRequest)
		{
			return this.options.beforeSendFirstRequest.bind(this)()
				.then(function (hackKendoFilterSet)
				{
					return Promise.resolve(true);
				});
		}

		return Promise.resolve(true);
	};

	LightKendoGrid.prototype._loadIdsWhenOnDataBound = function ()
	{
		var self = this;

		var filterIdUrl = pathCombine(self.getApiRequestURL(self.options.url), "id");
		tf.ajax.ajaxRequests.forEach(function (ajaxRequest)
		{
			if (ajaxRequest &&
				ajaxRequest.requestUrl &&
				ajaxRequest.requestUrl.indexOf(filterIdUrl) >= 0)
			{
				ajaxRequest.abort();
				// ajaxRequest.error(function(){
				// 		arguments[0].status = 200;
				// 		arguments[1] = 200;
				// 		arguments[2] = undefined;
				// 	});
			}

		});
		return self.getIdsWithCurrentFiltering().then(
			function ()
			{
				return true;
			},
			function ()
			{
				// catch exception thrown by reject.
			}
		);
	}

	LightKendoGrid.prototype.onDataBound = function ()
	{
		var self = this, kendoOptions;

		self.kendoGrid = self.$container.data("kendoGrid");
		self.bindScrollXMoveSummayBarEvent();
		var selected = $.map(self.kendoGrid.items(), function (item)
		{
			var row = $(item).closest("tr"),
				dataItem = self.kendoGrid.dataItem(row),
				selectedId = Enumerable.From(self.getSelectedIds());
			if (dataItem && dataItem[self.options.Id] && selectedId.Contains(dataItem[self.options.Id]))
			{
				return item;
			}
		});
		kendoOptions = self.kendoGrid.options
		if (kendoOptions && kendoOptions.selectable)
		{
			self._selectedIdsChange();
		}

		const selector = ".k-grid-content-locked tr, .k-grid-content tr";
		self.$container.off("click", selector).on("click", selector, function (e)
		{
			onKendoGridTRClickEvent.call(this, e, self);
		});


		if (self.options.isDataRowHover)
		{
			switch (self.options.gridType)
			{
				case "student":
					self.$container.find(".k-grid-content tr").Popover(new TF.Popover.StudentPopoverViewModel(self.kendoGrid));
					break;
				case "tripstop":
					self.$container.find(".k-grid-content tr").Popover(new TF.Popover.TripStopPopoverViewModel(self.kendoGrid));
					break;
				case "trip":
					self.$container.find(".k-grid-content tr").Popover(new TF.Popover.TripPopoverViewModel(self.kendoGrid));
					break;
			}
		}

		if (self.options.onDataBound)
		{
			self.options.onDataBound();
		}
		if (self.kendoGrid.options.selectable)
		{
			TF.LightKendoGridHelper._cancelKendoGridSelectedArea.bind(self)(self.kendoGrid);
		}

		self._fullfillGridBlank.bind(self)();

		self._initLinkTd();
		self._setCustomizetimePickerborderradius();
		self.setFilterDropDownListSize();

		if (self.kendoGrid._data.length === 0) //RW-850 Message should display when there are no associated documents
		{
			var $nomatching = self.$container.find(".no-matching-records");
			if ($nomatching.length === 0)
			{
				var $parent = self.$container.find(".k-grid-content .k-virtual-scrollable-wrap");
				if (self.options.isMiniGrid && self.options.hasPermission === false && !self.options.miniGridEditMode)
				{
					$parent.append("<div class='col-md-20 no-matching-records'>You don't have permission to view data.</div>");
				}
				else if (!self.options.withoutData && !self.options.miniGridEditMode)
				{
					$parent.append("<div class='col-md-20 no-matching-records'>There are no matching records.</div>");
				}
				$parent.find("table").css("display", "none");
				$parent.find(".kendogrid-blank-fullfill").css("display", "none");
			}
		}
		else
		{
			var $nomatching = self.$container.find(".no-matching-records");
			if ($nomatching.length > 0)
			{
				$nomatching.remove();
			}
			var $parent = self.$container.find(".k-grid-content .k-virtual-scrollable-wrap");
			$parent.find("table").css("display", "");
			$parent.find(".kendogrid-blank-fullfill").css("display", "");

			self.showLoadingForLazyLoad($parent);
		}

		//VIEW-1299 Grid columns do not move with grid header when tabbing through Quick Filter bar
		var timeoutEvent;
		self.lastGridScrollLeft = 0;
		self.$container.find(".k-grid-header-wrap").unbind('scroll.autoScrollOnFocus').bind('scroll.autoScrollOnFocus', function (e)
		{
			var gridBody = self.$container.find(".k-virtual-scrollable-wrap");
			var $target = $(e.target);
			gridBody.scrollLeft($target.scrollLeft());
			self.lastGridScrollLeft = $target.scrollLeft();
			if (self.$summaryContainer)
			{
				self.$summaryContainer.find(".k-grid-content").scrollLeft($target.scrollLeft());
			}
			clearTimeout(timeoutEvent);
			timeoutEvent = setTimeout(function ()
			{
				gridBody.scrollLeft($target.scrollLeft());
			}, 50);
		});
		//VIEW-1244 Cursor appears outside of inputs
		if (TF.isMobileDevice)
		{
			var header = self.$container.find(".k-grid-header-wrap");
			header.find("input:text").unbind('scroll.autoScrollOnFocus').bind('focus.autoScrollOnFocus', function (e)
			{
				var input = $(e.currentTarget),
					headerOffset = header.offset(),
					inputOffset = input.offset();

				if (headerOffset.left > inputOffset.left)
				{
					var scrollLeft = header.scrollLeft() - (headerOffset.left - inputOffset.left) - 32;
					self.$container.find(".k-virtual-scrollable-wrap").scrollLeft(scrollLeft);
					if (self.$summaryContainer)
					{
						self.$summaryContainer.find(".k-grid-content").scrollLeft(scrollLeft);
					}
				}
			});
		}

		//RW-997 once staff grid and the record without type dirver and bus aide, then no drag.
		if (self._gridType == "staff")
		{
			self._staffGridDraggable();
		}

		var showLoading = (self.geoFields && self.geoFields.length > 0) || self._gridType === "trip";
		if (showLoading && !self.options.isMiniGrid && !this.updateLazyloadData)
		{
			tf.loadingIndicator.showImmediately();
		}
		var oldIds = self.obAllIds().slice(), newIds;
		self._loadIdsWhenOnDataBound()
			.then(function ()
			{
				if (typeof self.pendingTaskOnNextDataBound === "function")
				{
					self.pendingTaskOnNextDataBound();
					self.pendingTaskOnNextDataBound = null;
				}

				newIds = self.obAllIds().slice();
				if (oldIds.sort().join(',') === newIds.sort().join(','))
				{
					if (newIds.length === 0)
					{
						self.onIdsChanged.notify();
					}
					self.onDataBoundEvent.notify();
					tf.loadingIndicator.tryHide();
				}
				else
				{
					if (self._gridType === "trip")
					{
						// // TODO-V2, need to remove
						// tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "trip", "batch", "mini", "?include=tripstop"),
						// 	{
						// 		data: {
						// 			ids: self.allIds,
						// 			now: toISOStringWithoutTimeZone(moment().currentTimeZoneTime()),
						// 			date: toISOStringWithoutTimeZone(moment().currentTimeZoneTime())
						// 		}
						// 	})
						// 	.then(function(response)
						// 	{
						// 		self.geoData = response;
						// 		self.onIdsChanged.notify();
						// 		self.onDataBoundEvent.notify();
						// 		tf.loadingIndicator.tryHide();
						// 	}.bind(this));
						self.onIdsChanged.notify();
						self.onDataBoundEvent.notify();
						tf.loadingIndicator.tryHide();
					}
					else if (self.geoFields && self.geoFields.length > 0)
					{
						tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "search", tf.DataTypeHelper.getEndpoint(self._gridType)),
							{
								data:
								{
									fields: self.geoFields,
									IdFilter:
									{
										IncludeOnly: self.allIds
									}
								}
							})
							.then(function (response)
							{
								self.geoData = response;
								self.onIdsChanged.notify();
								self.onDataBoundEvent.notify();
								tf.loadingIndicator.tryHide();
							});
					}
					else
					{
						self.onIdsChanged.notify();
						self.onDataBoundEvent.notify();
						tf.loadingIndicator.tryHide();
					}
				}

				self.onGridReadCompleted.notify();
			});

		if (self.options.selectable)
		{
			self.shortcutExtender = self.shortcutExtender || new TF.KendoGridNavigator({ grid: self.kendoGrid, tfGrid: self });
		}

		if (this.lazyloadFields.udf.length > 0)
		{
			self.lazyLoadUdf();
		}

		if (this.lazyloadFields.general.length > 0)
		{
			self.lazyLoadGeneral();
		}
	};

	LightKendoGrid.prototype.showLoadingForLazyLoad = function ($o)
	{
		if (this.lazyloadFields.udf.length === 0 && this.lazyloadFields.general.length === 0 || this.kendoGrid.tbody == null)
		{
			return;
		}

		this.kendoGrid.items().each((index, item) =>
		{
			const row = $(item).closest('tr');
			this.lazyloadFields.udf.forEach(f =>
			{
				const $ele = row.find(`[data-kendo-field='${f.FieldName}']`);
				if ($ele.length > 0)
				{
					$ele.html('<span class="k-icon k-i-loading rollup-loading"></span>');
				}
			});

			this.lazyloadFields.general.forEach(f =>
			{
				const $ele = row.find(`[data-kendo-field='${f.FieldName}']`);
				if ($ele.length > 0)
				{
					$ele.html('<span class="k-icon k-i-loading lazy-loading"></span>');
				}
			});
		});
	}

	LightKendoGrid.prototype.horizontalMoveScrollBar = function (isLeft)
	{
		//ENT-482 Scroll faster when using the left and right arrows
		var self = this;
		var gridBody = self.$container.find(".k-virtual-scrollable-wrap");
		var $target = $(gridBody);
		var maxScrollWidth = $target[0].scrollWidth - $target[0].clientWidth;
		var scrollLeft = $target.scrollLeft();
		if (!isLeft)
		{
			scrollLeft = self.lastGridScrollLeft + 40;
			if (scrollLeft > maxScrollWidth)
			{
				scrollLeft = maxScrollWidth;
			}
		}
		else
		{
			if (scrollLeft <= 40)
			{
				scrollLeft = 0;
			}
			else
			{
				scrollLeft = self.lastGridScrollLeft - 40;
			}
		}
		gridBody.scrollLeft(scrollLeft);
		self.lastGridScrollLeft = scrollLeft;
	};

	LightKendoGrid.prototype._readGrid = function(options)
	{
		const self = this,
			requestOptions = self.getApiRequestOption(options);
		let promise;

		tf.dataFormatHelper.clearPhoneNumberFormat(requestOptions, self);

		if (self.options.getAsyncRequestOption)
		{
			promise = self.options.getAsyncRequestOption(requestOptions);
		}
		else
		{
			promise = Promise.resolve(requestOptions);
		}

		promise.then(response =>
		{
			self.setLazyLoadFields(response.data);
			self.updateLazyloadData = false;
			tf.ajax.post(self.getApiRequestURL(self.options.url), response, { overlay: self.overlay && self.options.showOverlay })
			.then(function()
			{
				//the count of request callback in the process of change filter
				if (!self.kendoDataSourceTransportRequestBackCount) self.kendoDataSourceTransportRequestBackCount = 0;
				self.kendoDataSourceTransportRequestBackCount = self.kendoDataSourceTransportRequestBackCount + 1;
				//check the filter Whether custom or not
				if (self.$customFilterBtn)
				{
					//when user change the custom filter, show the custom filter menu now
					//check the last request callback, if this back is the last request callback, show the custom filter menu and reset data
					if (self.kendoDataSourceTransportRequestBackCount == self.kendoDataSourceTransportReadCount)
					{
						self.$customFilterBtn.click();
						self.kendoDataSourceTransportRequestBackCount = 0;
						self.kendoDataSourceTransportReadCount = 0;
						self.$customFilterBtn = undefined;
					}
				}
				else
				{
					//reset the request count, request callback count and custom button
					self.kendoDataSourceTransportRequestBackCount = 0;
					self.kendoDataSourceTransportReadCount = 0;
					self.$customFilterBtn = undefined;
				}
			}).fail(function(ex)
			{
				if (self.overlay && self.options.showOverlay)
				{
					tf.loadingIndicator.tryHide();
				}

				if ([400, 412].includes(ex.status))
				{
					self.resetFilterForCurrentInvalidFilter(ex.Message);
				}
				else if (ex.status === 408) //display Timeout message
				{
					tf.promiseBootbox.alert("Timeout expired, please try again.");
				}

				self.gridAlert.show({
					alert: "Danger",
					title: "Error",
					message: ex.responseJSON.Message
				})
			});
		});
	}

	LightKendoGrid.prototype.setLazyLoadFields = function(data)
	{
		this.lazyloadFields = { general: [], udf: [] };
		this.setLazyLoadGeneralFields(data);
		this.setLazyLoadUdfFields(data);
	}

	LightKendoGrid.prototype.setLazyLoadGeneralFields = function (data)
	{
		const currentColumns = [].concat(this._obSelectedColumns()).concat(this.getKendoColumn());
		let fields = _.uniqBy(currentColumns.filter(c => c.lazyLoad), "FieldName");
		if (!fields.length)
		{
			return false;
		}

		fields = fields.filter(x => data.filterClause.indexOf(x.FieldName) < 0);
		if (!fields.length)
		{
			return false;
		}

		if (data.filterSet)
		{
			fields = fields.filter(x => !data.filterSet.FilterItems.some(y => y.FieldName === x.FieldName));
		}

		if (!fields.length)
		{
			return false;
		}

		if (data.sortItems)
		{
			fields = fields.filter(x => !data.sortItems.some(y => y.Name === x.FieldName));
		}

		if (!fields.length)
		{
			return false;
		}

		this.lazyloadFields.general = fields;
		data.fields = (data.fields || []).filter(x => !fields.some(y => y.field === x));
		return true;
	}

	LightKendoGrid.prototype.setLazyLoadUdfFields = function (data)
	{
		let fields = (this.getUdfs() || []).filter(x => udfLazyLoadType.includes(x.UDFType));
		if (fields.length === 0)
		{
			return false;
		}

		fields = fields.filter(x => data.filterClause.indexOf(x.OriginalName) < 0);
		if (fields.length === 0)
		{
			return false;
		}

		if (data.filterSet)
		{
			fields = fields.filter(x => !data.filterSet.FilterItems.some(y => y.FieldName === x.OriginalName));
		}

		if (fields.length === 0)
		{
			return false;
		}

		if (data.sortItems)
		{
			fields = fields.filter(x => !data.sortItems.some(y => y.Name === x.OriginalName));
		}

		if (fields.length === 0)
		{
			return false;
		}

		this.lazyloadFields.udf = fields;
		if (data.fields)
		{
			data.fields = data.fields.filter(x => !fields.some(y => y.OriginalName === x));
		}
		return true;
	}

	LightKendoGrid.prototype.lazyLoadUdf = async function ()
	{
		let entityIds = this.kendoGrid.dataSource.data().map(x => x.Id);
		const rollupUdfIds = this.lazyloadFields.udf.map(x => x.UDFId);
		let rollupResult, shouldApplyThematic = true;
		if (this.alreadyLoadId && this.alreadyLoadId.udf && Object.keys(this.alreadyLoadId.udf).length > 0)
		{
			entityIds = entityIds.filter(id =>
			{
				if (this.alreadyLoadId.udf[id])
				{
					return rollupUdfIds.some(x => !Object.keys(this.alreadyLoadId.udf[id]).includes(x.toString()));
				}
				return id;

			});
		}

		if (!this.hasRollUpFieldsInThematicConfigs())
		{
			shouldApplyThematic = false;
			this.applyGridThematicConfigs && this.applyGridThematicConfigs();
		}

		if (entityIds.length > 0)
		{
			const res = await tf.promiseAjax.post(pathCombine(tf.api.apiPrefixWithoutDatabase(), "rollupudfs"), {
				data: {
					dataSourceId: tf.datasourceManager.databaseId,
					udfIds: rollupUdfIds,
					entityIds: entityIds
				}
			}, { overlay: false });
			rollupResult = res && res.Items && res.Items[0];
			this.alreadyLoadId.udf = {
				...this.alreadyLoadId.udf,
				...rollupResult
			};
		}
		if ((!this.alreadyLoadId || !Object.keys(this.alreadyLoadId.udf).length) && shouldApplyThematic)
		{
			this.applyGridThematicConfigs && this.applyGridThematicConfigs();
			return;
		}

		this.updateLazyloadData = true;
		this.updateGridForUdfLazyLoad();
		if (shouldApplyThematic)
		{
			this.applyGridThematicConfigs && this.applyGridThematicConfigs();
		}
	}

	LightKendoGrid.prototype.lazyLoadGeneral = async function ()
	{
		if (this.lazyloadFields.general.length === 0)
		{
			return;
		}

		let entityIds = this.kendoGrid.dataSource.data().map(x => x.Id);
		if (this.alreadyLoadId && this.alreadyLoadId.general)
		{
			entityIds = entityIds.filter(id =>
			{
				return !this.alreadyLoadId.general[id];
			});
		}

		if (!entityIds.length)
		{
			this.updateLazyloadData = true;
			this.updateGridForGeneralLazyLoad();
			return;
		}

		const chunkSize = 20;
		for (let i = 0; i < entityIds.length; i += chunkSize)
		{
			const chunk = entityIds.slice(i, i + chunkSize);
			if (chunk.length > 0)
			{
				const res = await tf.promiseAjax.post(pathCombine(this.getApiRequestURL(this.options.url)), {
					data: {
						"idFilter": {
							"IncludeOnly": chunk,
							"ExcludeAny": [],
						},
						"fields": ["Id", ...this.lazyloadFields.general.map(r => r.FieldName)],
					}
				}, { overlay: false });
				let result = res && res.Items;
				result.forEach(r =>
				{
					this.alreadyLoadId.general[r.Id] = r;
				});
			}
			if (!this.alreadyLoadId || !Object.keys(this.alreadyLoadId.general).length)
			{
				return;
			}

			this.updateLazyloadData = true;
			this.updateGridForGeneralLazyLoad();
		}
	}

	LightKendoGrid.prototype.updateGridForUdfLazyLoad = function ()
	{
		if (this.kendoGrid.tbody == null)
		{
			return;
		}
		this.kendoGrid.items().each((index, item) =>
		{
			const row = $(item).closest('tr');
			const dataItem = this.kendoGrid.dataItem(row);
			this.lazyloadFields.udf.forEach((udf) =>
			{
				const value = this.alreadyLoadId.udf[dataItem.Id] && this.alreadyLoadId.udf[dataItem.Id][udf.UDFId];
				const $ele = row.find(`[data-kendo-field='${udf.FieldName}']`);
				if ($ele.length > 0)
				{
					var formattedValue = this.udfFormatValue(udf, value);
					$ele.html(formattedValue);
					dataItem[udf.DisplayName] = formattedValue;
				}
			});
		});
	}

	LightKendoGrid.prototype.updateGridForGeneralLazyLoad = function ()
	{
		if (this.kendoGrid.tbody == null)
		{
			return;
		}
		this.kendoGrid.items().each((index, rowItem) =>
		{
			const row = $(rowItem).closest('tr');
			const dataItem = this.kendoGrid.dataItem(row);
			const item = this.alreadyLoadId.general[dataItem.Id];
			if (!item)
			{
				return;
			}

			this.lazyloadFields.general.forEach((f) =>
			{
				const $ele = row.find(`[data-kendo-field='${f.FieldName}']`);
				const fieldVal = item[f.FieldName];
				if ($ele.length > 0)
				{
					var display = fieldVal;
					if (kendo && f.template)
					{
						display = f.template(item);
					}
					else if (kendo && f.format)
					{
						display = kendo.toString(fieldVal, kendo._extractFormat(f.format));
					}

					$ele.html(display);
				}
			});
		});
	}

	LightKendoGrid.prototype.udfFormatValue = function (udf, value)
	{
		if (value === null || value === undefined)
		{
			return value;
		}

		const _udf = Enumerable.From(this.kendoGrid.columns).FirstOrDefault(null, function (x)
		{
			return x.UDFId === udf.UDFId
		});
		if (_udf && _udf.format)
		{
			switch (udf.type)
			{
				case 'time':
					value = new Date(`${moment(new Date()).format(dataFormat)} ${value}`);
					break;
				case 'datetime':
				case 'date':
					value = new Date(value);
					break;
				default:
					break;
			}
			value = kendo.format(_udf.format, value);
		}
		return value;
	}

	LightKendoGrid.prototype._onGridItemClick = function (dataItem, e)
	{
		var self = this,
			currentId = dataItem ? dataItem[self.options.Id] : null;
		if (!$.isNumeric(currentId))
		{
			self._resetPageInfoSelect();
			return;
		}

		if (TF.isMobileDevice && this.options.supportMobileMultipleSelect)
		{
			var currentElement = $(e.target);
			if (currentElement.attr("type") === "checkbox" && currentElement.hasClass("multi-selectable"))
			{
				var checked = currentElement.prop("checked"),
					existedIndex = self.getSelectedIds.indexOf(currentId);
				if (checked)
				{
					if (existedIndex === -1)
					{
						self.getSelectedIds.push(currentId);
					}
				}
				else
				{
					if (existedIndex > -1)
					{
						self.getSelectedIds.remove(currentId);
					}
				}
				return;
			}
		}

		if (this.options.selectable == "row")
		{
			self.getSelectedIds([currentId]);
			return;
		}

		if (e.ctrlKey && this.kendoGrid.options.selectable != "row")
		{
			if (Array.contain(self.getSelectedIds(), currentId))
			{
				self.getSelectedIds.remove(function (id) { return id === currentId; });
				return;
			}

			self.getSelectedIds.push(currentId);
			return;
		}

		if (e.shiftKey && this.kendoGrid.options.selectable != "row")
		{
			var data = self.obAllIds();
			if (!data || !data.length) return;

			var selectedIndex = self.obSelectedIndex() == -1 ? 0 : self.obSelectedIndex(),
				currentIndex = data.indexOf(currentId),
				newSelectedIds = [data[selectedIndex]];
			if (selectedIndex > currentIndex)
			{
				newSelectedIds = newSelectedIds.concat(data.slice(currentIndex, selectedIndex));
			}
			else
			{
				newSelectedIds = newSelectedIds.concat(data.slice(selectedIndex + 1, currentIndex + 1));
			}

			self.getSelectedIds(newSelectedIds);
			return;
		}

		self.getSelectedIds([currentId]);
	};

	LightKendoGrid.prototype.getItemHeight = function ()
	{
		var $trs = this.$container.find('.k-virtual-scrollable-wrap table tr');
		if (!$trs.length) return 0;
		return this._caculateFillItemHeight($trs);
	};

	LightKendoGrid.prototype._fullfillGridBlank = function ()
	{
		var self = this;
		var $canver = this.$container.find('.k-virtual-scrollable-wrap');
		$canver.find('.kendogrid-blank-fullfill').remove();

		var $blankFiller = $('<div class="kendogrid-blank-fullfill"></div>');
		var $trs = $canver.find('table tr');
		$canver.find('table').css("display", "block");
		$trs.map(function (idx, tr)
		{
			var $tr = $(tr);
			var uid = $tr.data('kendo-uid');
			var fillItemColor = self._getFillItemColor($tr);
			var fillItemHeight = self._caculateFillItemHeight($tr);
			var fillItemClass = (idx % 2 === 0) ? 'l' : 'l-alt';
			$blankFiller.append(
				'<div data-id="' + uid + '" class="fillItem ' + fillItemClass + '"' +
				' style="height:' + fillItemHeight + 'px;background-color:' + fillItemColor + '">' +
				'</div>'
			);
		});

		$blankFiller.find('.fillItem').dblclick(function (e)
		{
			self.onGridDoubleClick(e);
		});

		$blankFiller.find(".fillItem").click(function (e)
		{
			var uid = $(this).data('id');
			var dataItem = self.kendoGrid.dataSource.getByUid(uid);
			self._onGridItemClick(dataItem, e);
		});

		$canver.prepend($blankFiller).find('table').addClass('table-blank-fullfill');
	};

	LightKendoGrid.prototype._refreshGridBlank = function ()
	{
		var self = this;
		var $canver = this.$container.find('.k-virtual-scrollable-wrap');

		var $blankFiller = $canver.find('.kendogrid-blank-fullfill');
		var $trs = $canver.find('table tr');
		var $fillItems = $blankFiller.find('.fillItem');
		$trs.map(function (idx, tr)
		{
			var $fillItem = $($fillItems[idx]);

			var $tr = $(tr),
				fillItemColor = self._getFillItemColor($tr),
				fillItemHeight = self._caculateFillItemHeight($tr);
			$fillItem.outerHeight(fillItemHeight);
			$fillItem.css('background-color', fillItemColor);
			self.updateSelectedStyle($tr, $fillItem);
		});
	};

	LightKendoGrid.prototype.updateSelectedStyle = function ($tr, $fillItem)
	{
		const isSelected = $tr.hasClass("k-state-selected");
		$fillItem.toggleClass("k-state-selected", isSelected);
	}

	LightKendoGrid.prototype._caculateFillItemHeight = function ($tr)
	{
		return $($tr.find('td')[0]).outerHeight();
	};

	LightKendoGrid.prototype._getFillItemColor = function ($tr)
	{
		let color = $tr.attr("custom-bkg-color");
		if (!color)
		{
			const $td = $($tr.find('td')[0]);
			color = $td.css('background-color');
		}

		return color;
	};

	LightKendoGrid.prototype.clearSelection = function ()
	{
		this.getSelectedIds([]);
	};

	LightKendoGrid.prototype.getDefaultCheckedRecords = function (items)
	{
		this.obcheckRecords([]);
		items.forEach(function (item)
		{
			this.obcheckRecords.push(item[this.options.Id]);
		}.bind(this));
	};

	LightKendoGrid.prototype.extendAdditionGridDefinition = function(gridDefinition, additionGridDefinition)
	{
		for (var i = 0; i < gridDefinition.Columns.length; i++)
		{
			var column = gridDefinition.Columns[i],
				additionColumn = Enumerable.From(additionGridDefinition.Columns).
					Where(function(x) { return x.FieldName === column.FieldName }).SingleOrDefault();
			column = $.extend(column, additionColumn);
			if (!this.options.isMiniGrid)
			{
				this.gridDefinitionHelper.updateGridDefinitionWidth(column);
			}

			this.gridDefinitionHelper.updateGridDefinitionDisplayNameFromTerm(column);
		}

		return gridDefinition;
	};


	LightKendoGrid.prototype.updateGridDefinitionWidth = function (column)
	{
		var displayName = column.DisplayName ? column.DisplayName : column.FieldName;
		if (displayName.length + 1 > 20)
		{
			column.Width = (displayName.length * 7 + 7 + 10) + 'px';
		}
		return column;
	};

	LightKendoGrid.prototype.resizeHeightOnWindowResize = function ()
	{
		var self = this, timeout = null;
		self._onWindowResize = function ()
		{
			clearTimeout(timeout);
			timeout = setTimeout(function ()
			{
				self.fitContainer();
			}, 50);
		};

		$(window).on("resize", self._onWindowResize);
	};

	LightKendoGrid.prototype.fitContainer = function ()
	{
		if (!this.kendoGrid)
		{
			return;
		}
		var self = this, height = self.getGridFullHeight(), pagerHeight = 0,
			filterRow = self.$container.find(".k-grid-header").find(".k-filter-row");

		if (filterRow == undefined || filterRow.length == 0)
		{
			self._filterHeight = 38;
		}

		if (self.options.kendoGridOption.pageable == false)
		{//some grid don't have pager, need set pager height in content height either.
			pagerHeight += 32.8;
		}

		var contentHeight = height - 105 + self._filterHeight + pagerHeight;
		self.$container.height(height).find(".k-grid-content-locked,.k-grid-content").height(contentHeight);
		self.$container.next(".kendo-summarygrid-container").find(".k-grid-content-locked,.k-grid-content").height(self.summaryHeight);
		if (self.kendoGrid && self.kendoGrid.virtualScrollable)
		{
			self.kendoGrid._rowHeight = null;
			self.kendoGrid.virtualScrollable.repaintScrollbar();
		}

		self.resetGridContainerHorizontalLayout();
		//self.changeLockedColumnHeight();
		self._refreshGridBlank();
	};

	/** */
	LightKendoGrid.prototype.resetGridContainerHorizontalLayout = function ()
	{
		var self = this,
			$summaryGrid = self.$container.next(),
			warpWidth = self.$container.width(),
			lockHeaderWidth = self.$container.children(".k-grid-header").children('.k-grid-header-locked').width(),
			remainedWidth = warpWidth - lockHeaderWidth,
			paddingRight = parseInt(self.$container.children(".k-grid-content").css("padding-right"));

		self.$container.children(".k-grid-content").css("width", remainedWidth - paddingRight);
		self.$container.children(".k-grid-header").children(".k-auto-scrollable").css("width", remainedWidth - paddingRight);
		$summaryGrid.find(".k-grid-content").css("width", remainedWidth - paddingRight);
		$summaryGrid.find(".k-auto-scrollable").css("width", remainedWidth - paddingRight);
	};

	LightKendoGrid.prototype.getGridFullHeight = function ()
	{
		var height = 0;
		if (this.options.height !== "auto")
		{
			height = this.options.height;
		}
		else
		{
			height = this.$container.parent().height();

			if (this.options.containerHeight !== undefined)
			{//used in view page grids
				height = this.options.containerHeight;
			}
		}

		if (this.obSummaryGridVisible && this.obSummaryGridVisible())
		{
			height = height - this.summaryHeight;
		}
		return height;
	};


	LightKendoGrid.prototype.bindScrollXMoveSummayBarEvent = function ()
	{
		var self = this,
			timeoutEvent,
			focusTimeoutEvent,
			focusInput,
			gridContent = this.$container.find(".k-virtual-scrollable-wrap").length > 0 ? this.$container.find(".k-virtual-scrollable-wrap") : this.$container.find(".k-grid-content");

		if (!isMobileDevice())
		{
			return;
		}

		this.$container.find(".k-grid-content").addClass("overflow-hidden");
		if (self.$summaryContainer)
		{
			self.$summaryContainer.find(".k-grid-content").off("scroll.summarybar");
		}
		gridContent.bind("touchmove", function (e)
		{
			if (self.$summaryContainer)
			{
				var $summaryGrid = self.$summaryContainer.find(".k-grid-content");
				$summaryGrid.scrollLeft(gridContent.scrollLeft());
				clearTimeout(timeoutEvent);
				timeoutEvent = setTimeout(function ()
				{
					$summaryGrid.scrollLeft(gridContent.scrollLeft());
				}, 50);
			}
		});
	};

	LightKendoGrid.prototype.convertRequest2KendoFilterSet = function (filterSet)
	{
		var kendoFilterSet = [];
		if (!filterSet)
			return kendoFilterSet;

		var self = this;

		kendoFilterSet = self._convertToKendoFilterItems(filterSet.FilterItems);
		kendoFilterSet = kendoFilterSet.concat(self._convertToKendoFilterSets(filterSet.FilterSets));

		return kendoFilterSet;
	};

	// Kendogrid's filterSet data struct is different api request's filterSet, need covert here
	LightKendoGrid.prototype._convertToKendoFilterSets = function (filterSets)
	{
		var self = this;
		if (!filterSets || filterSets.length === 0)
			return [];

		return filterSets.map(function (filterSet)
		{
			var tmp = {
				logic: filterSet.LogicalOperator,
				filters: self._convertToKendoFilterItems(filterSet.FilterItems)
			};

			return tmp;
		});
	};

	LightKendoGrid.prototype._convertToKendoFilterItems = function (filterItems)
	{
		if (!filterItems || filterItems.length === 0)
			return [];

		var self = this;
		return filterItems.map(function (filterItem)
		{
			self.kendoGrid.columns.map(function (column)
			{
				if (column.FieldName === filterItem.FieldName)
				{
					switch (column.type)
					{
						case "time":
							filterItem.Value = moment(filterItem.Value).format('h:mm A');
							break;
						default:
							break;
					}
				}
			});

			var kendoFilterItem = {
				operator: self.operatorTFMapKendo[filterItem.Operator],
				field: filterItem.FieldName,
				value: filterItem.Value
			};
			kendoFilterItem = $.extend(kendoFilterItem, filterItem);
			return kendoFilterItem;
		});
	};

	LightKendoGrid.prototype._staffGridDraggable = function ()
	{//RW-997 once staff grid and the record without type dirver and bus aide, then no drag.
		//self.kendoGrid = this.$container.data("kendoGrid");
		//self.bindScrollXMoveSummayBarEvent();
		var self = this;
		tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "stafftypes"))
			.then(function(staffTypes)
			{
				var BusAideId = 0, DriverId = 0;
				staffTypes.Items.forEach(function (staffType)
				{
					if (staffType.StaffTypeName == "Bus Aide")
					{
						BusAideId = staffType.StaffTypeId;
					}

					if (staffType.StaffTypeName == "Driver")
					{
						DriverId = staffType.StaffTypeId;
					}
				});

				if (!self.kendoGrid)
				{
					return;
				}

				$.map(self.kendoGrid.items(), function(item)
				{
					var row = $(item).closest("tr");
					var dataItem = self.kendoGrid.dataItem(row);
					const containsBusOrDriver = dataItem.StaffTypes && $.type(dataItem.StaffTypes) === 'string' && dataItem.StaffTypes.split(",").some(function(staffType)
					{
						return staffType == BusAideId || staffType == DriverId;
					});

					if (containsBusOrDriver)
					{
						row.addClass("draggable");
					}
				});
			});
	};

	LightKendoGrid.prototype.scrollToRowById = function (id)
	{
		var self = this,
			index = self.obAllIds().indexOf(id);

		if (index > -1)
		{
			var $scroll = self.$container.children(".k-grid-content").find(".k-scrollbar.k-scrollbar-vertical"),
				containerHeight = $scroll.height(),
				totalHeight = $scroll.contents().height(),
				unitHeight = self.$container.children(".k-grid-content").find(".k-virtual-scrollable-wrap .fillItem").height(),
				scrollTop = unitHeight * index,
				lastPageTop = totalHeight - containerHeight;

			scrollTop = Math.min(scrollTop, lastPageTop);
			$scroll.scrollTop(scrollTop);
		}
	};

	LightKendoGrid.prototype.createDragDelete = function ()
	{
		var that = this,
			deleteColumn = function (e)
			{
				$(window).off("mouseup");
				$("body").off("mousemove");
				var $dragEle = e.draggable.hint;
				if (!$dragEle.hasClass("dragIn")) return;
				$dragEle.remove();
				var childColumns = that._obSelectedColumns().filter(function (column)
				{
					return column.ParentField;
				});
				if (that._obSelectedColumns().length <= 1 || (that._obSelectedColumns().length === 2 && childColumns && childColumns.length > 0))
				{
					return that.gridAlert.show(
						{
							alert: "Warning",
							title: "Warning",
							message: "There should be at least one non locked column",
							key: that._columnsUnLockedTimesKey
						});
				}

				if (that._removingOnlyOneUnLockColumn && that._removingOnlyOneUnLockColumn(e.draggable.hint.text()))
				{
					return;
				}
				//All visible columns to the left of this column are locked. Removing this column will unlock those columns. Are you sure you want to remove this column?
				return tf.promiseBootbox.confirm(
					{
						message: "Are you sure you want to remove the column?",
						title: "Remove Confirmation"
					})
					.then(function (result)
					{
						if (result)
						{
							var name = e.draggable.hint.text();
							if (that.options.onDragRemoveColumn)
							{
								that.options.onDragRemoveColumn(name);
							} else
							{
								that._removeColumn(name);
								that.rebuildGrid();
							}
						}
					}.bind(that));
			};

		var docRoot = $("body");
		docRoot.kendoDropTarget(
			{
				group: that.kendoGrid._draggableInstance.options.group,
				dragenter: function (e)
				{
					var $fromEle = e.draggable.currentTarget;
					var $dragEle = e.draggable.hint;
					$(window).off(".removecolumn");
					$("body").on(this.isMobileDevice ? "touchmove.removecolumn" : "mousemove.removecolumn", function ()
					{
						var grid = $fromEle.closest(".kendo-grid"), dragOffset = 40,
							fromEleTop = $fromEle.offset().top,
							dragEleTop = $dragEle.offset().top,
							dragEleLeft = $dragEle.offset().left;
						if (grid && (fromEleTop > dragEleTop + dragOffset || fromEleTop < dragEleTop - dragOffset ||
							grid.offset().left - dragOffset > dragEleLeft || grid.offset().left + grid.outerWidth() + dragOffset < dragEleLeft))
						{
							$dragEle.addClass("dragIn");
						}
						else
						{
							$dragEle.removeClass("dragIn");
						}
					});
				}.bind(this),
				dragleave: function (e)
				{
					var $dragEle = e.draggable.hint;
					if (e.pageX < 0 || e.pageX >= $(window).width() || e.pageY < 0 || e.pageY >= $(window).height())
					{
						$(window).off(".removecolumn").on(this.isMobileDevice ? "touchend.removecolumn" : "mouseup.removecolumn", function ()
						{
							$("body").off(".removecolumn");
							$(window).off(".removecolumn");
							deleteColumn(e);
							$dragEle.remove();
						}.bind(this));
						return;
					}
					$("body").off(".removecolumn");
					$dragEle.removeClass("dragIn");
				}.bind(this),
				drop: function (e)
				{
					deleteColumn(e);
					e.draggable.hint.remove();
					$(window).off(".removecolumn");
					$("body").off(".removecolumn");
				}
			});
	};

	LightKendoGrid.prototype._removeColumn = function (columnDisplayName)
	{
		var columns = this.kendoGrid.columns;
		var avaColumns = this._availableColumns;
		for (var idx = 0; idx < columns.length; idx++)
		{
			if (columns[idx].DisplayName === columnDisplayName)
			{
				var subColumn = columns.filter(function (column)
				{
					return column.ParentField === columns[idx].FieldName;
				});
				avaColumns.push(columns[idx]);
				this.clearCustomFilterByFieldName(columns[idx].FieldName);
				columns.splice(idx, 1);
				if (subColumn && subColumn.length > 0)
				{
					avaColumns.push(subColumn[0]);
					this.clearCustomFilterByFieldName(subColumn[0].FieldName);
					subColumn.forEach(function (sColumn)
					{
						columns.splice(columns.indexOf(sColumn), 1);
					});
				}
				break;
			}
		}
		this._availableColumns = avaColumns;
	};

	LightKendoGrid.prototype.getSelectedRecordsFromServer = function ()
	{
		var self = this, options = {
			paramData: { getCount: false, databaseId: tf.datasourceManager.databaseId },
			data: {
				fields: self._obSelectedColumns().map(function (column) { return column.FieldName }),
				filterClause: "",
				filterSet: null,
				idFilter: {
					ExcludeAny: [],
					IncludeOnly: self.getSelectedIds()
				},
				sortItems: self.searchOption.data.sortItems
			}
		};

		if (self.options.setRequestOption)
		{
			self.options.setRequestOption(options);
		}

		return tf.ajax.post(self.getApiRequestURL(self.options.url), options);
	};

	LightKendoGrid.prototype.dispose = function ()
	{
		this.$container.off('click');
		this.onCtrlCPress.unsubscribeAll();
		this.onCtrlSPress.unsubscribeAll();
		this.onEnterPress.unsubscribeAll();
		this.onDoubleClick.unsubscribeAll();
		this.onGridReadCompleted.unsubscribeAll();
		this.onRowsChangeCheck.unsubscribeAll();
		this.onRowsChanged.unsubscribeAll();
		this.onEyeCheckChanged.unsubscribeAll();
		this.onDataBoundEvent.unsubscribeAll();
		this.onFilterChanged.unsubscribeAll();
		this.onClearFilter.unsubscribeAll();
		if (this.onClearGridFilterClickEvent)
		{
			this.onClearGridFilterClickEvent.unsubscribeAll();
		}
		if (this.onFieldTripStageChanged)
		{
			this.onFieldTripStageChanged.unsubscribeAll();
		}

		var routeState = this.options.routeState;
		tf.shortCutKeys.unbind("enter", routeState);
		tf.shortCutKeys.unbind("ctrl+s", routeState);
		tf.shortCutKeys.unbind("ctrl+c", routeState);

		if (this.options.selectable && this.options.selectable.indexOf("multiple") != -1)
		{
			tf.shortCutKeys.unbind("ctrl+a", routeState);
			tf.shortCutKeys.unbind("ctrl+i", routeState);
		}

		if (this.options.showOmittedCount)
		{
			tf.shortCutKeys.unbind("ctrl+o", routeState);
		}

		tf.shortCutKeys.changeHashKey();

		this._onWindowResize = null;
		for (var i in this.subscriptions)
		{
			this.subscriptions[i].dispose();
			this.subscriptions[i] = null;
		}
		this.subscriptions = [];
		this.$container.removeData("lightKendoGrid");
		if (this.kendoGrid)
		{
			this.kendoGrid.destroy();
			this.kendoGrid = null;
		}
		this.$container.find('[data-kendo-role="autocomplete"]').each(function ()
		{
			if ($(this).data("kendoAutoComplete"))
			{
				$(this).data("kendoAutoComplete").destroy();
			}
		});
	};

	LightKendoGrid.AllFilterTypes = ['contains', 'isequalto', 'isnotequalto', 'startswith',
		'doesnotcontain', 'endswith', 'islessthanorequalto', 'isgreaterthanorequalto',
		'isgreaterthan', 'islessthan', 'isempty', 'isnotempty', 'custom', 'list',
		'lastxdays', 'lastxhours', 'lastxmonths', 'lastxweeks', 'lastxyears',
		'nextxdays', 'nextxhours', 'nextxmonths', 'nextxweeks', 'nextxyears',
		'olderthanxmonths', 'olderthanxyears', 'onyearx', 'all', 'lastmonth', 'lastweek', 'lastyear',
		'nextbusinessday', 'nextmonth', 'nextweek', 'nextyear', 'thismonth', 'thisweek', 'thisyear',
		'today', 'tomorrow', 'yesterday', 'onx', 'onorafterx', 'onorbeforex'];

	LightKendoGrid.prototype.filterNames = {
		'Equal To': 'isequalto',
		'Not Equal To': 'isnotequalto',
		'Does Not Contain': 'doesnotcontain',
		'Contains': 'contains',
		'Starts With': 'startswith',
		'Ends With': 'endswith',
		'Greater Than': 'isgreaterthan',
		'Greater Than or Equal To': 'isgreaterthanorequalto',
		'Less Than': 'islessthan',
		'Less Than or Equal To': 'islessthanorequalto',
		'Empty': 'isempty',
		'Not Empty': 'isnotempty',
		'Custom': 'custom',
		'List': 'list',
		'Last X Days': 'lastxdays',
		'Last X Hours': 'lastxhours',
		'Last X Months': 'lastxmonths',
		'Last X Weeks': 'lastxweeks',
		'Last X Years': 'lastxyears',
		'Next X Days': 'nextxdays',
		'Next X Hours': 'nextxhours',
		'Next X Months': 'nextxmonths',
		'Next X Weeks': 'nextxweeks',
		'Next X Years': 'nextxyears',
		'Older than X Months': 'olderthanxmonths',
		'Older than X Years': 'olderthanxyears',
		'On Year X': 'onyearx',
		'All': 'all',
		'Last Month': 'lastmonth',
		'Last Week': 'lastweek',
		'Last Year': 'lastyear',
		'Next Business Day': 'nextbusinessday',
		'Next Month': 'nextmonth',
		'Next Week': 'nextweek',
		'Next Year': 'nextyear',
		'This Month': 'thismonth',
		'This Week': 'thisweek',
		'This Year': 'thisyear',
		'Today': 'today',
		'Tomorrow': 'tomorrow',
		'Yesterday': 'yesterday',
		'On X': 'onx',
		'On or After X': 'onorafterx',
		'On or Before X': 'onorbeforex'
	};

	LightKendoGrid.prototype.operatorKendoMapFilterNameValue = {
		'eq': 'isequalto',
		'neq': 'isnotequalto',
		'doesnotcontain': 'doesnotcontain',
		'contains': 'contains',
		'startswith': 'startswith',
		'endswith': 'endswith',
		'gt': 'isgreaterthan',
		'gte': 'isgreaterthanorequalto',
		'lt': 'islessthan',
		'lte': 'islessthanorequalto',
		'isempty': 'isempty',
		'isnotempty': 'isnotempty',
		'custom': 'custom',
		'list': 'list',
		'lastxdays': 'lastxdays',
		'lastxhours': 'lastxhours',
		'lastxmonths': 'lastxmonths',
		'lastxweeks': 'lastxweeks',
		'lastxyears': 'lastxyears',
		'nextxdays': 'nextxdays',
		'nextxhours': 'nextxhours',
		'nextxmonths': 'nextxmonths',
		'nextxweeks': 'nextxweeks',
		'nextxyears': 'nextxyears',
		'olderthanxmonths': 'olderthanxmonths',
		'olderthanxyears': 'olderthanxyears',
		'onyearx': 'onyearx',
		'all': 'all',
		'lastmonth': 'lastmonth',
		'lastweek': 'lastweek',
		'lastyear': 'lastyear',
		'nextbusinessday': 'nextbusinessday',
		'nextmonth': 'nextmonth',
		'nextweek': 'nextweek',
		'nextyear': 'nextyear',
		'thismonth': 'thismonth',
		'thisweek': 'thisweek',
		'thisyear': 'thisyear',
		'today': 'today',
		'tomorrow': 'tomorrow',
		'yesterday': 'yesterday',
		'onx': 'onx',
		'onorafterx': 'onorafterx',
		'onorbeforex': 'onorbeforex'
	}

	LightKendoGrid.prototype.operatorKendoMapTF = {
		'eq': 'EqualTo',
		'neq': 'NotEqualTo',
		'doesnotcontain': 'DoesNotContain',
		'contains': 'Contains',
		'startswith': 'StartsWith',
		'endswith': 'EndsWith',
		'gt': 'GreaterThan',
		'gte': 'GreaterThanOrEqualTo',
		'lt': 'LessThan',
		'lte': 'LessThanOrEqualTo',
		'isempty': 'IsNull',
		'isnotempty': 'IsNotNull',
		'custom': 'Custom',
		'list': 'In',
		'wi': 'IsWithIn',
		'lastxdays': 'LastXDays',
		'lastxhours': 'LastXHours',
		'lastxmonths': 'LastXMonths',
		'lastxweeks': 'LastXWeeks',
		'lastxyears': 'LastXYears',
		'nextxdays': 'NextXDays',
		'nextxhours': 'NextXHours',
		'nextxmonths': 'NextXMonths',
		'nextxweeks': 'NextXWeeks',
		'nextxyears': 'NextXYears',
		'olderthanxmonths': 'OlderthanXMonths',
		'olderthanxyears': 'OlderthanXYears',
		'onyearx': 'OnYearX',
		'all': 'All',
		'lastmonth': 'LastMonth',
		'lastweek': 'LastWeek',
		'lastyear': 'LastYear',
		'nextbusinessday': 'NextBusinessDay',
		'nextmonth': 'NextMonth',
		'nextweek': 'NextWeek',
		'nextyear': 'NextYear',
		'thismonth': 'ThisMonth',
		'thisweek': 'ThisWeek',
		'thisyear': 'ThisYear',
		'today': 'Today',
		'tomorrow': 'Tomorrow',
		'yesterday': 'Yesterday',
		'onx': 'OnX',
		'onorafterx': 'OnOrAfterX',
		'onorbeforex': 'OnOrBeforeX'
	};

	LightKendoGrid.prototype.operatorTFMapKendo = {
		'EqualTo': 'eq',
		'NotEqualTo': 'neq',
		'DoesNotContain': 'doesnotcontain',
		'Contains': 'contains',
		'StartsWith': 'startswith',
		'EndsWith': 'endswith',
		'GreaterThan': 'gt',
		'GreaterThanOrEqualTo': 'gte',
		'LessThan': 'lt',
		'LessThanOrEqualTo': 'lte',
		'IsNull': 'isempty',
		'IsNotNull': 'isnotempty',
		'Custom': 'custom',
		'In': 'list',
		'IsWithIn': 'wi',
		'LastXDays': 'lastxdays',
		'LastXHours': 'lastxhours',
		'LastXMonths': 'lastxmonths',
		'LastXWeeks': 'lastxweeks',
		'LastXYears': 'lastxyears',
		'NextXDays': 'nextxdays',
		'NextXHours': 'nextxhours',
		'NextXMonths': 'nextxmonths',
		'NextXWeeks': 'nextxweeks',
		'NextXYears': 'nextxyears',
		'OlderthanXMonths': 'olderthanxmonths',
		'OlderthanXYears': 'olderthanxyears',
		'OnYearX': 'onyearx',
		'All': 'all',
		'LastMonth': 'lastmonth',
		'LastWeek': 'lastweek',
		'LastYear': 'lastyear',
		'NextBusinessDay': 'nextbusinessday',
		'NextMonth': 'nextmonth',
		'NextWeek': 'nextweek',
		'NextYear': 'nextyear',
		'ThisMonth': 'thismonth',
		'ThisWeek': 'thisweek',
		'ThisYear': 'thisyear',
		'Today': 'today',
		'Tomorrow': 'tomorrow',
		'Yesterday': 'yesterday',
		'OnX': 'onx',
		'OnOrAfterX': 'onorafterx',
		'OnOrBeforeX': 'onorbeforex'
	};

	LightKendoGrid.prototype.getOpetatorName = function (value)
	{
		let self = this, name = '';
		for (var key in self.filterNames)
		{
			if (value === self.filterNames[key])
			{
				name = key;
				return name;
			}
		}
		return name;
	};

	LightKendoGrid.normalizeResultItem = function (items)
	{
		if (items.length === 1 && $.isArray(items[0]))
		{
			return items[0];
		}
		return items;
	};

	/**
	 * Check is this grid used as dashboard widget.
	 *
	 * @return {*}
	 */
	LightKendoGrid.prototype.isDashboardWidget = function ()
	{
		return this.options.customGridType === "dashboardwidget"
	};

	LightKendoGrid.prototype.hasRollUpFieldsInThematicConfigs = function ()
	{
		var hasRollUpField = false;
		if (!this.selectedGridThematicConfigs)
		{
			return hasRollUpField;
		}

		this.selectedGridThematicConfigs.forEach(configs =>
		{
			if (hasRollUpField) return;

			configs.forEach(config =>
			{
				if (hasRollUpField) return;

				hasRollUpField = config.typeId === TF.DetailView.UserDefinedFieldHelper.DataTypeId.RollUp
					|| config.typeId === TF.DetailView.UserDefinedFieldHelper.DataTypeId.Case;
			});
		});

		return hasRollUpField;
	};
})();

(function ()
{
	FilterHelper = function () { };
	createNamespace("TF").FilterHelper = FilterHelper;

	FilterHelper.dateTimeNumberFiltersName = ['Last X Days', 'Last X Hours', 'Last X Months', 'Last X Weeks', 'Last X Years',
		'Next X Days', 'Next X Hours', 'Next X Months', 'Next X Weeks', 'Next X Years',
		'Older than X Months', 'Older than X Years', 'On Year X'];

	FilterHelper.dateTimeNilFiltersOperator = ['lastxdays', 'lastxhours', 'lastxmonths', 'lastxweeks', 'lastxyears',
		'nextxdays', 'nextxhours', 'nextxmonths', 'nextxweeks', 'nextxyears',
		'olderthanxmonths', 'olderthanxyears', 'onyearx'];

	FilterHelper.dateTimeNonParamFiltersName = ['All', 'Last Month', 'Last Week', 'Last Year',
		'Next Business Day', 'Next Month', 'Next Week',
		'Next Year', 'This Month', 'This Week', 'This Year', 'Today', 'Tomorrow', 'Yesterday'];

	FilterHelper.dateTimeNonParamFiltersOperator = ['all', 'lastmonth', 'lastweek', 'lastyear',
		'nextbusinessday', 'nextmonth', 'nextweek',
		'nextyear', 'thismonth', 'thisweek', 'thisyear', 'today', 'tomorrow', 'yesterday'];

	FilterHelper.dateTimeDateParamFiltersOperator = ['onx', 'onorafterx', 'onorbeforex'];

	FilterHelper.dateTimeDateParamFiltersNames = ['On X', 'On or After X', 'On or Before X'];

	FilterHelper.getNilFiltersFormat = function (filter)
	{
		if (filter === 'On Year X') return filter;

		let formatStr = filter.slice(0, -1);
		formatStr = formatStr + '(s)';
		return formatStr;
	}

	FilterHelper.getSortColumns = function (columns)
	{
		return columns.filter(function (column) { return column.isSortItem; });
	}

	FilterHelper.setSortItems = function (requestOptions, sortColumns)
	{
		if (sortColumns.length === 0)
			return requestOptions;

		var sortItems = requestOptions.data.sortItems || [];
		sortColumns.map(function (sortColumn)
		{
			var sortColumnName = sortColumn.FieldName;
			var item = sortItems.filter(function (sortItem)
			{
				if (sortItem.Name === sortColumnName)
					return true;
				return false;
			});

			if (item.length === 0)
				sortItems.push({ Name: sortColumnName, Direction: "Ascending", isAscending: true });
		});

		requestOptions.data.sortItems = sortItems;
		return requestOptions;
	}

	FilterHelper.buildEmptyDSFilterSet = function ()
	{
		return {
			FilterSets: [],
			FilterItems: [],
			LogicalOperator: "and"
		}
	}

	FilterHelper.isDateOrDateTimeFilterType = function (filterType)
	{
		return filterType === 'datetime' || filterType === 'date';
	}

	FilterHelper.disableFilterCellInput = function ($input, isNormalInput)
	{
		var kendoAutoComplete = $($input[0]).data('kendoAutoComplete');
		if (kendoAutoComplete !== undefined)
			kendoAutoComplete.enable(false);

		var kendoNumericTextBox = $($input[1]).data('kendoNumericTextBox');
		if (kendoNumericTextBox !== undefined)
			kendoNumericTextBox.enable(false);

		var kendoDatePicker = $($input[0]).data('kendoDatePicker');
		if (kendoDatePicker !== undefined)
			kendoDatePicker.enable(false);

		var DateTimePicker = $($input[0]).data('DateTimePicker');
		if (DateTimePicker !== undefined)
			DateTimePicker.disable(true);

		var kendoDateTimePicker = $($input[0]).data('kendoDateTimePicker');
		if (kendoDateTimePicker !== undefined)
		{
			kendoDateTimePicker.enable(false);
			kendoDateTimePicker.element.parent().find('.datepickerbutton').addClass('k-state-disabled');
		}

		if (isNormalInput)
			$input.attr('disabled', true).addClass('is-disabled-text-input');
	};

	FilterHelper.hideDatetimeNumberCell = function ($input, cellWidget)
	{
		let dateTimeFilterCell = $input.closest('.k-filtercell'); //hide the number box when select nil filter
		let dateTimeNumberFilterCell = dateTimeFilterCell.find("span.date-number");
		let cellClass = cellWidget === "datetimepicker" ? ".tf-filter" : ".k-datepicker";
		if (dateTimeNumberFilterCell)
		{
			dateTimeNumberFilterCell.hide();
			dateTimeNumberFilterCell.closest(".k-filtercell").find(cellClass).show();
		}
	};

	FilterHelper.enableFilterCellInput = function ($input, isNormalInput)
	{
		var kendoAutoComplete = $($input[0]).data('kendoAutoComplete');
		if (kendoAutoComplete !== undefined)
			kendoAutoComplete.enable(true);

		var kendoNumericTextBox = $($input[1]).data('kendoNumericTextBox');
		if (kendoNumericTextBox !== undefined)
			kendoNumericTextBox.enable(true);

		var kendoDatePicker = $($input[0]).data('kendoDatePicker');
		if (kendoDatePicker !== undefined)
			kendoDatePicker.enable(true);

		var DateTimePicker = $($input[0]).data('DateTimePicker');
		if (DateTimePicker !== undefined)
			DateTimePicker.enable(true);

		var kendoDateTimePicker = $($input[0]).data('kendoDateTimePicker');
		if (kendoDateTimePicker !== undefined)
		{
			kendoDateTimePicker.enable(true);
			kendoDateTimePicker.element.parent().find('.datepickerbutton').removeClass('k-state-disabled');
		}

		if (isNormalInput)
			$input.attr('disabled', false).removeClass('is-disabled-text-input');
	};

	FilterHelper.formatFilterCellInputValue = function (val, columnType)
	{
		if (columnType === 'time')
		{
			var str = moment(val).format('h:mm A');
			return (str === 'Invalid date') ? val : str;
		}
		else if (columnType === 'date')
		{
			var str = moment(val).format('l');
			return (str === 'Invalid date') ? val : str;
		}
		else if (columnType === 'datetime')
		{
			var str = moment(val).format('MM/DD/YYYY hh:mm A');
			return (str === 'Invalid date') ? val : str;
		}

		return val;
	};

	FilterHelper.clearFilterCellInput = function ($input)
	{
		$input.val('');
	};
})();

(function ()
{
	CustomFilterHelper = function () { };
	createNamespace("TF").CustomFilterHelper = CustomFilterHelper;

	CustomFilterHelper.removeEmptyFilterItems = function (filterItems)
	{
		if (!filterItems || !filterItems.length)
			return filterItems;

		for (var i = filterItems.length - 1; i >= 0; i--)
		{
			var filterItem = filterItems[i];
			if (TF.CustomFilterHelper.isEmptyFilterItemOfTimeTypeColumn(filterItem) ||
				TF.CustomFilterHelper.isEmptyFilterItemOfDateTypeColumn(filterItem) ||
				TF.CustomFilterHelper.isEmptyFilterItemOfDateTimeTypeColumn(filterItem) ||
				TF.CustomFilterHelper.isEmptyFilterItemOfOtherTypeColumn(filterItem))
			{
				filterItems.pop();
			}
		}
		return filterItems;
	}

	CustomFilterHelper.isEmptyFilterItemOfTimeTypeColumn = function (filterItem)
	{
		return (filterItem.TypeHint === 'Time'
			&& filterItem.Operator !== 'Empty'
			&& filterItem.Operator !== 'IsNotNull' && filterItem.Operator !== 'IsNull'
			&& (filterItem.Value === '' || filterItem.Value === "Invalid date"));
	}

	CustomFilterHelper.isEmptyFilterItemOfDateTypeColumn = function (filterItem)
	{
		return (filterItem.TypeHint === 'Date'
			&& filterItem.Operator !== 'Empty'
			&& filterItem.Operator !== 'IsNotNull' && filterItem.Operator !== 'IsNull'
			&& TF.FilterHelper.dateTimeNonParamFiltersOperator.indexOf(filterItem.Operator.toLowerCase()) === -1
			&& (filterItem.Value === '' || filterItem.Value === "Invalid date"));
	}

	CustomFilterHelper.isEmptyFilterItemOfDateTimeTypeColumn = function (filterItem)
	{
		return (filterItem.TypeHint === 'DateTime'
			&& filterItem.Operator !== 'Empty'
			&& filterItem.Operator !== 'IsNotNull' && filterItem.Operator !== 'IsNull'
			&& TF.FilterHelper.dateTimeNonParamFiltersOperator.indexOf(filterItem.Operator.toLowerCase()) === -1
			&& (filterItem.Value === '' || filterItem.Value === "Invalid date"));
	}

	CustomFilterHelper.isEmptyFilterItemOfOtherTypeColumn = function (filterItem)
	{
		return (
			filterItem.TypeHint !== 'Date' &&
			filterItem.TypeHint !== 'Time' &&
			filterItem.TypeHint !== 'DateTime' &&
			filterItem.TypeHint !== 'BoolToChar' && //used for georegion geo column
			filterItem.Operator !== 'Empty' && filterItem.Operator !== 'IsNotNull' && filterItem.Operator !== 'IsNull' &&
			(filterItem.Value === '' || filterItem.Value === "Invalid date")
		);
	}


	CustomFilterHelper.removeSpecialDDLItem = function (dropdownList)
	{
		var specialItems = dropdownList.dataItems().filter(function (item)
		{
			return item.value === 'custom' || item.value === 'list' ||
				TF.FilterHelper.dateTimeNilFiltersOperator.indexOf(item.value) > -1 ||
				TF.FilterHelper.dateTimeNonParamFiltersOperator.indexOf(item.value) > -1 |
				TF.FilterHelper.dateTimeDateParamFiltersOperator.indexOf(item.value) > -1;
		});
		specialItems.map(function (specialItem)
		{
			dropdownList.dataSource.remove(specialItem);
		});
	};

	CustomFilterHelper.addCustomFilterEllipsisClass = function (input)
	{
		input.addClass('text-ellipsis');
	}

	CustomFilterHelper.removeCustomFilterEllipsisClass = function (input)
	{
		input.removeClass('text-ellipsis');
	}

	CustomFilterHelper.initCustomFilterBtn = function ($gridContainer)
	{
		$gridContainer.find('.k-grid-header thead tr:first-child').css('height', 33); // reset header height changed by filter menu
		$gridContainer.find('.k-grid-filter').addClass('k-filter-custom-btn').addClass('hidden');
	};

	CustomFilterHelper.clearCustomFilter = function ()
	{
		var $customInput = $(".clear-custom-filter-menu-btn").parent().find('input');
		TF.CustomFilterHelper.removeCustomFilterEllipsisClass($customInput);
		$(".clear-custom-filter-menu-btn").remove(); //remove custom filter close button
	};
})();

(function ()
{
	ListFilterHelper = function () { };
	createNamespace("TF").ListFilterHelper = ListFilterHelper;

	ListFilterHelper.initListFilters = function ()
	{
		return {}
	};

	ListFilterHelper.getDefaultListFilterOption = function (displayFilterTypeName)
	{
		return {
			title: 'Filter ' + displayFilterTypeName,
			description: 'Select the ' + displayFilterTypeName + ' that you would like to view.'
		}
	};

	ListFilterHelper.initListFilterBtn = function ($gridContainer)
	{
		var filterListBtn = '<div class="k-filter-list-btn hidden btn btn-default btn-sharp">' +
			'<span class="glyphicon glyphicon-option-horizontal"></span>' +
			'</div>';
		$gridContainer.find('.k-grid-header thead tr:first-child th').append(filterListBtn);
	};

	ListFilterHelper.addSelectedIdsIntoFilterItems = function (filterItems, cachedListFilters)
	{
		if (!cachedListFilters || !Object.keys(cachedListFilters))
			return filterItems;

		filterItems.map(function (filterItem)
		{
			var fieldName = filterItem.FieldName;
			if (filterItem.Operator === 'In' &&
				cachedListFilters[fieldName] // removed blank list filter from quick filter
			)
			{
				var selectedIds = cachedListFilters[fieldName].ids || [];
				filterItem.ListFilterIds = JSON.stringify(selectedIds);
			}
		});
		return filterItems;
	};

	ListFilterHelper.buildDsListFilterItem = function (fieldName, value, valueList, listfilterIds)
	{
		return {
			Operator: 'In',
			IsListFilter: true,
			FieldName: fieldName,
			Value: value || '',
			ValueList: valueList || [],
			ListFilterIds: listfilterIds || []
		}
	}

	ListFilterHelper.buildListFilterItemBySelectedData = function (option)
	{
		var fieldName = option.fieldName;
		var filterField = option.filterField;
		var selectedData = option.selectedData;

		var selectedItems = selectedData.map(function (item) { return item[filterField]; });
		var selectedIds = selectedData.map(function (item) { return item.Id; });
		return ListFilterHelper.buildDsListFilterItem(
			fieldName,
			selectedItems.join(','),
			JSON.stringify(selectedItems),
			selectedIds
		);
	}

	ListFilterHelper.initListFilterIdsByQuickFilter = function (quickFilterData, cachedListFilters, columns)
	{
		if (!quickFilterData ||
			!quickFilterData.filterSet ||
			!quickFilterData.filterSet.FilterItems.length)
			return cachedListFilters;

		quickFilterData.filterSet.FilterItems.map(function (filterItem)
		{
			if (filterItem.Operator === 'In')
			{
				var field = filterItem.FieldName;
				var column = columns.filter(function (column) { return column.FieldName === field; });
				TF.ListFilterHelper.initListFilterItem(cachedListFilters, column[0].ListFilterTemplate, filterItem, field);
			}
		});

		return cachedListFilters;
	};

	ListFilterHelper.initListFilterItem = function (cachedListFilters, listFilterTemplate, dsFilterItem, field)
	{
		cachedListFilters[field] = cachedListFilters[field] || {};
		var rawListFilterIds = dsFilterItem.ListFilterIds || '[]';
		var selectedIds = JSON.parse(rawListFilterIds);
		cachedListFilters[field].ids = selectedIds;
		cachedListFilters[field].selectedFilterItems = [];

		if (listFilterTemplate.isDistinctListTemplate) // it will be removed when get filter data from list data table but not from grid column
		{
			if (dsFilterItem.Value)
			{
				cachedListFilters[field].selectedFilterItems = dsFilterItem.Value.split(',');
				cachedListFilters[field].selectedItems = dsFilterItem.Value.split(',');
			}
		}
		else if (listFilterTemplate.listFilterType === 'Enum')
		{
			if (dsFilterItem.Value)
				cachedListFilters[field].selectedFilterItems = dsFilterItem.Value.split(',');
		}
		else if (listFilterTemplate.listFilterType === 'WithSearchGrid' && selectedIds.length > 0)
		{
			var requestUrl = listFilterTemplate.getUrl();
			var requestOption = {
				data: {
					FilterClause: "",
					IdFilter: { IncludeOnly: selectedIds }
				}
			}

			if (listFilterTemplate.GridType === "BusfinderHistoricalTrip" && listFilterTemplate.DisplayFilterTypeName === "Trips")
			{
				requestOption.paramData = requestOption.paramData || {};
				requestOption.paramData.time = toISOStringWithoutTimeZone(moment().currentTimeZoneTime());
			}
			else if (listFilterTemplate.setLeftGridRequestOption)
				requestOption = listFilterTemplate.setLeftGridRequestOption(requestOption);

			function processFilterWithField(selectedItems, listFilterTemplate, cachedListFilters, field)
			{
				selectedItems = TF.ListMoverForListFilterHelper.processSelectedData(selectedItems, listFilterTemplate.filterField);
				selectedItems.sort(function(a, b) { return a.FilterItem.localeCompare(b.FilterItem); });
				cachedListFilters[field].selectedItems = selectedItems;
				var tmp = TF.ListMoverForListFilterHelper.processSelectedData(selectedItems, listFilterTemplate.filterField);
				cachedListFilters[field].selectedFilterItems = tmp.map(function(item) { return item.FilterItem; });
			}

			function getData(requestUrl, idField)
			{
				tf.promiseAjax.get(requestUrl)
					.then(function(response)
					{
						var selectedItems = response.Items.filter(x => selectedIds.some(y => y === x[idField]));
						selectedItems.forEach(x => x.Id = x[idField]);
						processFilterWithField(selectedItems, listFilterTemplate, cachedListFilters, field);
					});
			}

			if (listFilterTemplate.GridType === 'StaffTypes')
			{
				getData(requestUrl, "StaffTypeId");
			}
			if (listFilterTemplate.GridType === 'GPSEventType'
				|| listFilterTemplate.GridType === 'Genders')
			{
				getData(requestUrl, "ID");
			}
			else
			{
				tf.promiseAjax.post(requestUrl, requestOption)
				.then(function(response)
				{
					var selectedItems = response.Items || [];
					selectedItems = TF.ListMoverForListFilterHelper.processSelectedData(selectedItems, listFilterTemplate.filterField);
					selectedItems.sort(function (a, b) { return a.FilterItem.localeCompare(b.FilterItem); });
					cachedListFilters[field].selectedItems = selectedItems;
					var tmp = TF.ListMoverForListFilterHelper.processSelectedData(selectedItems, listFilterTemplate.filterField)
					cachedListFilters[field].selectedFilterItems = tmp.map(function (item) { return item.FilterItem; });;
				});
			}
		}
		else if (listFilterTemplate.listFilterType === 'MapData' && selectedIds.length > 0)
		{
			var requestUrl = listFilterTemplate.getUrl();
			var requestMethod = listFilterTemplate.requestMethod ? listFilterTemplate.requestMethod : 'get';
			tf.promiseAjax[requestMethod](requestUrl)
				.then(function (response)
				{
					var allItems = TF.ListFilterHelper.processMapData(response, listFilterTemplate.modifySource);
					var selectedItems = [];
					if (cachedListFilters[field].ids)
					{
						selectedItems = allItems.filter(function (item)
						{
							return Array.contain(cachedListFilters[field].ids, item.Id);
						});
					}
					cachedListFilters[field].selectedItems = selectedItems;
					var tmp = TF.ListMoverForListFilterHelper.processSelectedData(selectedItems, listFilterTemplate.filterField)
					cachedListFilters[field].selectedFilterItems = tmp.map(function (item) { return item.FilterItem; });;
				});
		}
	};

	ListFilterHelper.processMapData = function (response, modifySource)
	{
		var data = $.isArray(response.Items[0]) ? response.Items[0] : response.Items;
		var allItems = data;
		if (modifySource)
			allItems = modifySource(allItems);

		return allItems;
	}

	ListFilterHelper.getSelectedFilterItemsForWithSearchGridType = function (cachedListFilters, listFilterTemplate, fieldName)
	{
		var selectedItems = cachedListFilters[fieldName].selectedItems || [];
		return selectedItems;
	}

	ListFilterHelper.getSelectedFilterItemsForDefaultType = function (cachedListFilters, listFilterTemplate, fieldName)
	{
		var allItems = listFilterTemplate.AllItems;
		if (cachedListFilters[fieldName] && cachedListFilters[fieldName].selectedFilterItems)
		{
			return cachedListFilters[fieldName].selectedFilterItems;
		}

		var selectedIds = cachedListFilters[fieldName].ids || [];

		var selectedFilterItems = listFilterTemplate.AllItems.filter(function (item, idx) { return selectedIds.indexOf(idx) >= 0; });
		return selectedFilterItems;
	}

	ListFilterHelper.handleWithSearchGridListFilterResult = function (cachedListFilters, selectedItems, fieldName)
	{
		var caller = this;

		cachedListFilters[fieldName].selectedFilterItems = cachedListFilters[fieldName].selectedFilterItems || [];
		var originalSelectedFilterItemsCnt = cachedListFilters[fieldName].selectedFilterItems.length;
		cachedListFilters[fieldName].selectedItems = cachedListFilters[fieldName].selectedItems || [];

		var selectedFilterItems = [];
		if (selectedItems === false)
		{
			selectedFilterItems = cachedListFilters[fieldName].selectedFilterItems;
		}
		else if (selectedItems.length > 0)
		{
			selectedFilterItems = selectedItems.map(function (item) { return item.FilterItem || item; });
			cachedListFilters[fieldName].selectedFilterItems = selectedFilterItems;
			cachedListFilters[fieldName].selectedItems = selectedItems;
			cachedListFilters[fieldName].ids = selectedItems.map(function (item) { return item.Id });
		}
		else if (selectedItems.length === 0)
		{
			delete cachedListFilters[fieldName];
		}

		var currentlySelectedFilterItemsCnt = selectedFilterItems.length;

		caller.afterhandleListFilterResult(selectedFilterItems, fieldName, originalSelectedFilterItemsCnt, currentlySelectedFilterItemsCnt);
	};

	ListFilterHelper.handleDefaultListFilterResult = function (cachedListFilters, selectedFilterItems, fieldName, listFilterTemplate)
	{
		var caller = this;

		var allItems = listFilterTemplate.AllItems;
		cachedListFilters[fieldName].selectedFilterItems = cachedListFilters[fieldName].selectedFilterItems || [];
		var originalSelectedFilterItemsCnt = cachedListFilters[fieldName].selectedFilterItems.length;

		if (selectedFilterItems !== false)
		{
			cachedListFilters[fieldName].selectedFilterItems = selectedFilterItems;

			var ids = [];
			allItems.map(function (item, idx)
			{
				selectedFilterItems.map(function (selectedFilterItem)
				{
					if (selectedFilterItem === item)
						ids.push(idx);
				});
			});
			cachedListFilters[fieldName].ids = ids;
		}

		selectedFilterItems = cachedListFilters[fieldName].selectedFilterItems;
		selectedIds = cachedListFilters[fieldName].ids;

		var currentlySelectedFilterItemsCnt = selectedFilterItems.length;

		caller.afterhandleListFilterResult(selectedFilterItems, fieldName, originalSelectedFilterItemsCnt, currentlySelectedFilterItemsCnt, selectedIds);
	};
})();

(function ()
{
	LightKendoGridHelper = function () { };
	createNamespace("TF").LightKendoGridHelper = LightKendoGridHelper;

	LightKendoGridHelper._cancelKendoGridSelectedArea = function (kendoGrid)
	{
		kendoGrid.selectable.userEvents.unbind("start");
		kendoGrid.selectable.userEvents.unbind("move");
		kendoGrid.selectable.userEvents.unbind("end");
	};

	LightKendoGridHelper.isHotLinkNode = function ($node)
	{
		if (!$node)
			return false;

		return $node.closest('td').hasClass('has-link');
	}
})()
