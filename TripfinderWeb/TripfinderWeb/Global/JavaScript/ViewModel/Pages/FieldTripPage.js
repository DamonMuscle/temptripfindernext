(function()
{
	createNamespace("TF.Page").FieldTripPage = FieldTripPage;

	function FieldTripPage()
	{
		var self = this;
		self.type = "fieldtrip";
		self.searchGridInited = ko.observable(false);
		self.options = {};
		self.bulkMenu = null;

		self.requestPauseEvent = new TF.Events.Event();
		self.requestHoldEvent = new TF.Events.Event();
		self.requestResumeEvent = new TF.Events.Event();
		self.releaseHoldEvent = new TF.Events.Event();
		self.enableRefreshEvent = new TF.Events.Event();
		self.obEmail = ko.observable(true);
		self.obNewGrids = ko.observable(true);
		self.obReportLists = ko.observable(false);
		self.obNoRecordsSelected = ko.observable(false);
		self.openSelectedClick = self.openSelectedClick.bind(self);
		self.kendoGridScroll = null;
		self.copyToClipboardClick = this.copyToClipboardClick.bind(self);
		self.saveAsClick = this.saveAsClick.bind(self);
		self.sendEmailClick = self.sendEmailClick.bind(self);
		self.sendToClick = self.sendToClick.bind(self);
	}

	FieldTripPage.prototype.constructor = FieldTripPage;

	FieldTripPage.prototype.init = function(model, element)
	{
		var self = this;
		self.$element = $(element);

		self.options.gridDefinition = tf.fieldTripGridDefinition.gridDefinition();
		self.options.showOmittedCount = false;

		self.updateOptions();
		self.createGrid(self.options);
		self.initSearchGridCompute();
		self.bindButtonEvent();
	};

	FieldTripPage.prototype.updateOptions = function()
	{
		var self = this;
		self.options.url = pathCombine(tf.api.apiPrefix(), "search", "fieldtripforviewfindergrid");
		self.options.gridDefinition = tf.fieldTripGridDefinition.gridDefinition();
		self.options.storageKey = "grid.currentlayout." + self.type;
		self.options.loadUserDefined = false;

		self.options.summaryFilters = [{
			Id: -1,
			Name: "Today",
			IsValid: true
		},
		{
			Id: -2,
			Name: "Vehicle Scheduled",
			IsValid: true
		},
		{
			Id: -3,
			Name: "Pending Approval",
			IsValid: true,
			WhereClause: " FieldTripStageId = 1 or FieldTripStageId = 3 or FieldTripStageId = 5 or FieldTripStageId = 7",
			GridType: self.type
		},
		{
			Id: -4,
			Name: "Declined",
			IsValid: true,
			WhereClause: "FieldTripStageId = 2 or FieldTripStageId = 4 or FieldTripStageId = 6 or FieldTripStageId = 98",
			GridType: self.type
		},
		{
			Id: -5,
			Name: "Total",
			IsValid: true,
			WhereClause: "FieldTripStageId != 100",
			GridType: self.type
		},
		{
			Id: -6,
			Name: "Transportation Approved",
			IsValid: true,
			WhereClause: "FieldTripStageId = 99",
			GridType: self.type
		}
		];
		self.options.summaryFilterFunction = function(selectGridFilterEntityId)
		{
			if (selectGridFilterEntityId == -1 || selectGridFilterEntityId == -2)
			{
				return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "statistics", "fieldtripdepartingtrips")).then(function(response)
				{
					return response.Items[0];
				});
			}
			if (selectGridFilterEntityId == -3 || selectGridFilterEntityId == -4 ||
				selectGridFilterEntityId == -5 || selectGridFilterEntityId == -6)
			{
				return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "statistics", "fieldtrip")).then(function(response)
				{
					switch (selectGridFilterEntityId)
					{
						case -3:
							return response.AwaitingApprovalList;
						case -4:
							return response.RejectedList;
						case -5:
							return response.TotalList;
						case -6:
							return response.TransportationApprovedList;
						default:
							return null;
					}
				});
			}
			return Promise.resolve(null);
		};
	};

	FieldTripPage.prototype.createGrid = function(option)
	{
		var self = this,
			baseOptions = {
				storageKey: "grid.currentlayout." + self.type,
				gridType: self.type,
				showBulkMenu: true,
				showLockedColumn: true,
				showOmittedCount: option.showOmittedCount,
				showSelectedCount: option.showSelectedCount,
				gridTypeInPageInfo: option.gridTypeInPageInfo,
				url: pathCombine(tf.api.apiPrefix(), "search", self.type),
				onDataBound: function(option)
				{
					self.onDataBound.bind(self)(option);
				}
			};

		self.searchGrid = new TF.Grid.KendoGrid(self.$element.find('.kendo-grid-container'), $.extend(baseOptions, option), new TF.Grid.GridState({
			gridFilterId: null,
			filteredIds: option.filteredIds
		}));
		self.searchGrid.filterMenuClick = self.searchGrid.filterMenuClick.bind(self);
		self.searchGrid.onRowsChanged.subscribe(function(e, data)
		{
			self.selectedRecordIds = Enumerable.From(data).Select(function(c)
			{
				return c.Id;
			}).ToArray();
		}.bind(self));

		self._openBulkMenu();
		self.targetID = ko.observable();
		self.searchGridInited(true);
	};

	FieldTripPage.prototype.copyToClipboardClick = function()
	{
	};

	FieldTripPage.prototype.saveAsClick = function()
	{
	};

	FieldTripPage.prototype.sendEmailClick = function()
	{
	};

	FieldTripPage.prototype.sendToClick = function()
	{
	};

	FieldTripPage.prototype.openSelectedClick = function()
	{
	};

	FieldTripPage.prototype._openBulkMenu = function()
	{
		var self = this;
		self.$element.delegate("table.k-selectable tr", "mousedown", function(e, parentE)
		{
			var element = e;
			if (parentE)
			{
				element = parentE;
			}
			if (element.button == 2)
			{
				self.targetID(self.searchGrid.kendoGrid.dataItem(e.currentTarget).Id);
				var $virsualTarget = $("<div></div>").css(
					{
						position: "absolute",
						left: element.clientX,
						top: element.clientY
					});
				$("body").append($virsualTarget);
				self.bulkMenu = new TF.ContextMenu.BulkContextMenu(pathCombine("Workspace/Page/grid", self.type, "bulkmenu"), new TF.Grid.GridMenuViewModel(self, self.searchGrid));
				tf.contextMenuManager.showMenu($virsualTarget, self.bulkMenu);
				return false;
			}
			return true;
		});

		self.$element.delegate(".kendogrid-blank-fullfill .fillItem", "mousedown", function(e)
		{
			var uid = $(e.currentTarget).data("id");
			var items = self.$element.find("table.k-selectable tr").filter(function(a, b)
			{
				return $(b).data("kendoUid") == uid;
			});
			if (items.length > 0)
			{
				$(items[0]).trigger("mousedown", [e]);
			}
		});
	};

	FieldTripPage.prototype.initSearchGridCompute = function()
	{
		var self = this;
		self.obSelectedGridLayoutModified = ko.computed(function()
		{
			return self.searchGridInited() && self.searchGrid.obSelectedGridLayoutModified();
		}, self);

		self.obSelectedGridFilterModifiedMessage = ko.computed(function()
		{
			return self.searchGridInited() && self.searchGrid.obSelectedGridFilterModifiedMessage();
		}, self);

		self.obSelectedGridFilterName = ko.computed(function()
		{
			return self.searchGridInited() && self.searchGrid.obSelectedGridFilterName();
		}, self);
		self.obSelectedGridFilterName.subscribe(function(result)
		{
			setTimeout(function()
			{
				self.updateResizePanel();
			});
		});
		self.obSelectedGridLayoutName = ko.computed(function()
		{
			return self.searchGridInited() && self.searchGrid.obSelectedGridLayoutName();
		}, self);
		self.obSelectedGridLayoutName.subscribe(function(result)
		{
			setTimeout(function()
			{
				self.updateResizePanel();
			});
		});
		self.obSummaryGridVisible = ko.computed(function()
		{
			return self.searchGridInited() && self.searchGrid.obSummaryGridVisible();
		}, self);
		self.noApplyFilterNoModified = ko.computed(function()
		{
			return self.searchGridInited() && self.searchGrid.noApplyFilterNoModified();
		}, self);
	};

	FieldTripPage.prototype.bindEvent = function(buttonSelector, bindEvent)
	{
		var self = this;
		event = TF.isMobileDevice ? "touchstart" : "click";
		self.$element.find(buttonSelector).on(event, function(e)
		{
			//e.stopPropagation();
			//e.preventDefault();
			bindEvent.call(self, self, e);
		});
	};

	FieldTripPage.prototype.bindButtonEvent = function()
	{
		var self = this;
		self.bindEvent(".iconbutton.filter", self.filterMenuClick);
		self.bindEvent(".iconbutton.addremovecolumn", function(model, e)
		{
			self.searchGrid.addRemoveColumnClick(model, e);
		});
		self.bindEvent(".iconbutton.layout", self.layoutIconClick);
		self.bindEvent(".iconbutton.refresh", function(model, e)
		{
			self.searchGrid.refreshClick(model, e);
		});
	};

	FieldTripPage.prototype.layoutIconClick = function(viewModel, e)
	{
		var cacheOperatorBeforeHiddenMenu = TF.menuHelper.needHiddenOpenedMenu(e);
		var cacheOperatorBeforeOpenMenu = TF.menuHelper.needOpenCurrentMenu(e);

		if (cacheOperatorBeforeHiddenMenu)
			TF.menuHelper.hiddenMenu();

		if (cacheOperatorBeforeOpenMenu)
		{
			//tf.pageManager.showContextMenu(e.currentTarget);
			tf.contextMenuManager.showMenu(e.currentTarget, new TF.ContextMenu.TemplateContextMenu("workspace/grid/layoutcontextmenu", new TF.Grid.GridMenuViewModel(this, this.searchGrid), function()
			{
				var iconWrap = $(e.target).closest(".grid-icons").find(".grid-staterow-wrap");
				if (self._gridMap && iconWrap.length > 0)
				{
					iconWrap.css("display", "block");
					self.updateResizePanel();
				}
			}));
		}
	};

	FieldTripPage.prototype.filterMenuClick = function(viewModel, e)
	{
		var self = this,
			cacheOperatorBeforeHiddenMenu = TF.menuHelper.needHiddenOpenedMenu(e),
			cacheOperatorBeforeOpenMenu = TF.menuHelper.needOpenCurrentMenu(e);

		if (cacheOperatorBeforeHiddenMenu)
			TF.menuHelper.hiddenMenu();

		if (cacheOperatorBeforeOpenMenu)
		{
			//tf.pageManager.showContextMenu(e.currentTarge);
			self.searchGrid.filterMenuClick(e, function()
			{
				var iconWrap = $(e.target).closest(".grid-icons").find(".grid-staterow-wrap");
				if (self._gridMap && iconWrap.length > 0)
				{
					iconWrap.css("display", "block");
					self.updateResizePanel();
				}
			});
		}
	};


	FieldTripPage.prototype.onDataBound = function(option)
	{
		var self = this;
		self.selectedRecordIds = [];
		self.autoScrollInit();

		if (option && option.IsCallout)
		{
			delete option.IsCallout;
		}

		self.obGridNoAction = ko.computed(function()
		{
			self.obNoRecordsSelected(false);
			var ids = self.searchGrid.getSelectedIds();
			if (self.searchGrid.kendoGrid && self.searchGrid.kendoGrid.dataSource._total > 0 && self.searchGrid.getSelectedIds().length == 0)
			{
				self.obNoRecordsSelected(true);
				return false;
			}
			if (self.searchGrid.kendoGrid && self.searchGrid.kendoGrid.dataSource._total == 0 && self.searchGrid.getSelectedIds().length == 0)
			{
				return true;
			}
			if (self.targetID() && ids.indexOf(self.targetID()) < 0)
			{
				return true;
			}
			return false;
		}.bind(this));
	};

	FieldTripPage.prototype.autoScrollInit = function()
	{
		var self = this;
		if (!self.kendoGridScroll)
		{
			self.kendoGridScroll = new TF.KendoGrid.AutoScroll(self.searchGrid);
			self.kendoGridScroll.onScrollAtBottom.subscribe(function()
			{
				self.releaseHoldEvent.notify();
				self.startAutoScroll();
			}.bind(self));

			if (tf.fullScreenHelper.obIsFullScreen())
			{
				self.startAutoScroll();
			}
		}
	};

	FieldTripPage.prototype.startAutoScroll = function()
	{
		var self = this;
		if (self.kendoGridScroll != null)
		{
			self.kendoGridScroll.startAutoScroll();
			self.requestHoldEvent.notify();
		}
	};

	FieldTripPage.prototype.dispose = function()
	{
		var self = this;
		if (self.searchGrid)
		{
			self.searchGrid.dispose();
			self.searchGrid = null;
		}

		// release the objects
		for (var i in self)
		{
			self[i] = null;
		}
		self.requestResumeEvent.unsubscribeAll();
		self.requestPauseEvent.unsubscribeAll();
		self.requestHoldEvent.unsubscribeAll();
		self.releaseHoldEvent.unsubscribeAll();
		self.enableRefreshEvent.unsubscribeAll();
	};
})();