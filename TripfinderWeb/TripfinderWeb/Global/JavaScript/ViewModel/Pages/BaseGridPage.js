(function()
{
	createNamespace("TF.Page").BaseGridPage = BaseGridPage;

	function BaseGridPage()
	{
		var self = this;

		self.searchGridInited = ko.observable(false);
		self.options = {};
		self.bulkMenu = null;
		self.requestPauseEvent = new TF.Events.Event();
		self.requestHoldEvent = new TF.Events.Event();
		self.requestResumeEvent = new TF.Events.Event();
		self.releaseHoldEvent = new TF.Events.Event();
		self.enableRefreshEvent = new TF.Events.Event();
		self.obNewGrids = ko.observable(true);
		self.obNoRecordsSelected = ko.observable(false);
		self.openSelectedClick = self.openSelectedClick.bind(self);
		self.kendoGridScroll = null;

		self.approveButton = false;
		self.declineButton = false;
		self.cancelButton = false;
		self.copyToClipboardClick = this.copyToClipboardClick.bind(self);
		self.saveAsClick = this.saveAsClick.bind(self);
		self.obIsSelectRow = ko.observable(false);
		self.isAdmin = tf.authManager.authorizationInfo.isAdmin || tf.authManager.authorizationInfo.isAuthorizedFor("transportationAdministrator", "edit");
		self.pageLevelViewModel = new TF.PageLevel.BasePageLevelViewModel();
	}

	BaseGridPage.prototype.constructor = BaseGridPage;

	BaseGridPage.prototype.init = function(model, element)
	{
		var self = this;
		self.$element = $(element);

		if (self.updateOptions)
		{
			self.updateOptions();
		}
		self.createGrid(self.options);
		self.initSearchGridCompute();
		self.bindButtonEvent();

		self.searchGrid.getSelectedIds.subscribe(function()
		{
			if (self.searchGrid.getSelectedIds().length === 0)
			{
				self.obIsSelectRow(false);
			}
			else
			{
				self.obIsSelectRow(true);
			}
		});
	};

	BaseGridPage.prototype.createGrid = function(option)
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

	BaseGridPage.prototype.logout = function()
	{
		tf.pageManager.logOff();
	};

	BaseGridPage.prototype.copyToClipboardClick = function()
	{
	};

	BaseGridPage.prototype.saveAsClick = function()
	{
	};

	BaseGridPage.prototype.openSelectedClick = function()
	{
	};

	BaseGridPage.prototype._openBulkMenu = function()
	{
		var self = this;
		self.$element.delegate("table.k-selectable tr", "mousedown", function(e, parentE)
		{
			var element = e;
			if (parentE)
			{
				element = parentE;
			}
			if (element.button === 2)
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
				return $(b).data("kendoUid") === uid;
			});
			if (items.length > 0)
			{
				$(items[0]).trigger("mousedown", [e]);
			}
		});
	};

	BaseGridPage.prototype.initSearchGridCompute = function()
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
		self.obSelectedGridLayoutName = ko.computed(function()
		{
			return self.searchGridInited() && self.searchGrid.obSelectedGridLayoutName();
		}, self);
		self.obSummaryGridVisible = ko.computed(function()
		{
			return self.searchGridInited() && self.searchGrid.obSummaryGridVisible();
		}, self);
		self.noApplyFilterNoModified = ko.computed(function()
		{
			return self.searchGridInited() && self.searchGrid.noApplyFilterNoModified();
		}, self);
	};

	BaseGridPage.prototype.bindEvent = function(buttonSelector, bindEvent)
	{
		var self = this;
		self.$element.find(buttonSelector).on("click", function(e)
		{
			bindEvent.call(self, self, e);
		});
	};

	BaseGridPage.prototype.bindButtonEvent = function()
	{
		var self = this;
		self.bindEvent(".iconbutton.summarybar", function(model, e)
		{
			self.searchGrid.summarybarIconClick(model, e);
		});
		self.bindEvent(".iconbutton.filter", self.filterMenuClick);
		self.bindEvent(".iconbutton.addremovecolumn", function(model, e)
		{
			self.searchGrid.addRemoveColumnClick(model, e);
		});
		if (self.approveClick)
		{
			self.bindEvent(".iconbutton.approve", self.approveClick);
		}
		if (self.declineClick)
		{
			self.bindEvent(".iconbutton.decline", self.declineClick);
		}
		if (self.cancelClick)
		{
			self.bindEvent(".iconbutton.cancel", self.cancelClick);
		}
		self.bindEvent(".iconbutton.layout", self.layoutIconClick);
		self.bindEvent(".iconbutton.refresh", function(model, e)
		{
			self.searchGrid.refreshClick(model, e);
		});
	};

	BaseGridPage.prototype.layoutIconClick = function(viewModel, e)
	{
		var cacheOperatorBeforeHiddenMenu = TF.menuHelper.needHiddenOpenedMenu(e);
		var cacheOperatorBeforeOpenMenu = TF.menuHelper.needOpenCurrentMenu(e);

		if (cacheOperatorBeforeHiddenMenu)
			TF.menuHelper.hiddenMenu();

		if (cacheOperatorBeforeOpenMenu)
		{
			tf.pageManager.showContextMenu(e.currentTarget);
			tf.contextMenuManager.showMenu(e.currentTarget, new TF.ContextMenu.TemplateContextMenu("workspace/grid/layoutcontextmenu", new TF.Grid.GridMenuViewModel(this, this.searchGrid), function()
			{
				var iconWrap = $(e.target).closest(".grid-icons").find(".grid-staterow-wrap");
				if (iconWrap.length > 0)
				{
					iconWrap.css("display", "block");
				}
			}));
		}
	};

	BaseGridPage.prototype.filterMenuClick = function(viewModel, e)
	{
		var self = this,
			cacheOperatorBeforeHiddenMenu = TF.menuHelper.needHiddenOpenedMenu(e),
			cacheOperatorBeforeOpenMenu = TF.menuHelper.needOpenCurrentMenu(e);

		if (cacheOperatorBeforeHiddenMenu)
			TF.menuHelper.hiddenMenu();

		if (cacheOperatorBeforeOpenMenu)
		{
			tf.pageManager.showContextMenu(e.currentTarge);
			self.searchGrid.filterMenuClick(e, function()
			{
				var iconWrap = $(e.target).closest(".grid-icons").find(".grid-staterow-wrap");
				if (iconWrap.length > 0)
				{
					iconWrap.css("display", "block");
				}
			});
		}
	};

	BaseGridPage.prototype.openNavigationClick = function()
	{
		var self = this, navigationData,
			$content, $navigationContent = $(".navigation-container").addClass("mobile");
		$content = $("<!-- ko template:{ name:'workspace/navigation/menu',data:$data }--><!-- /ko -->");
		$navigationContent.append($content);

		navigationData = new TF.NavigationMenu();

		ko.applyBindings(ko.observable(navigationData), $content[0]);

	};

	BaseGridPage.prototype.onDataBound = function(option)
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
			if (self.searchGrid.kendoGrid && self.searchGrid.kendoGrid.dataSource._total > 0 && self.searchGrid.getSelectedIds().length === 0)
			{
				self.obNoRecordsSelected(true);
				return false;
			}
			if (self.searchGrid.kendoGrid && self.searchGrid.kendoGrid.dataSource._total === 0 && self.searchGrid.getSelectedIds().length === 0)
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

	BaseGridPage.prototype.autoScrollInit = function()
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

	BaseGridPage.prototype.startAutoScroll = function()
	{
		var self = this;
		if (self.kendoGridScroll !== null)
		{
			self.kendoGridScroll.startAutoScroll();
			self.requestHoldEvent.notify();
		}
	};

	BaseGridPage.prototype.dispose = function()
	{
		var self = this;
		if (self.searchGrid)
		{
			self.searchGrid.dispose();
			self.searchGrid = null;
		}

		self.pageLevelViewModel.dispose();

		self.requestResumeEvent.unsubscribeAll();
		self.requestPauseEvent.unsubscribeAll();
		self.requestHoldEvent.unsubscribeAll();
		self.releaseHoldEvent.unsubscribeAll();
		self.enableRefreshEvent.unsubscribeAll();
		// release the objects
		for (var i in self)
		{
			self[i] = null;
		}
	};
})();
