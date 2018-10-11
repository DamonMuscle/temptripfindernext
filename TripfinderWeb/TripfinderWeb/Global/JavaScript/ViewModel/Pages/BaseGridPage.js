(function()
{
	createNamespace("TF.Page").BaseGridPage = BaseGridPage;

	function BaseGridPage()
	{
		var self = this;
		TF.Page.BasePage.apply(self, arguments);

		self.searchGridInited = ko.observable(false);
		self.isGridPage = true;
		self.options = {};
		self.bulkMenu = null;
		self.selectedRecordIds = [];
		self.requestPauseEvent = new TF.Events.Event();
		self.requestHoldEvent = new TF.Events.Event();
		self.requestResumeEvent = new TF.Events.Event();
		self.releaseHoldEvent = new TF.Events.Event();
		self.enableRefreshEvent = new TF.Events.Event();
		self.obNewGrids = ko.observable(true);
		self.obNoRecordsSelected = ko.observable(false);
		self.openSelectedClick = self.openSelectedClick.bind(self);
		self.kendoGridScroll = null;
		self.isGridPage = true;

		self.obReportLists = ko.observable(false);
		self.obReports = ko.observable(false);
		self.copyToClipboardClick = this.copyToClipboardClick.bind(self);
		self.saveAsClick = this.saveAsClick.bind(self);
		self.obIsSelectRow = ko.observable(false);
		self.selectedItemEditable = ko.observable(false);
		self.selectedItemsEditable = ko.observable(false);
		self.sendToClick = self.sendToClick.bind(self);
		self.sendEmailClick = self.sendEmailClick.bind(self);
		self.obEmail = ko.computed(function()
		{
			if (self.searchGridInited())
			{
				var columns = self.searchGrid.currentDisplayColumns();
				for (var i = 0; i < columns.length; i++)
				{
					if (columns[i].field && columns[i].field.toLowerCase().indexOf('email') >= 0)
					{
						return true;
					}
				}
			}
			return false;
		}, self);
	}

	BaseGridPage.prototype = Object.create(TF.Page.BasePage.prototype);

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
		tf.pageManager.resizablePage.onSizeChanged.subscribe(function()
		{
			if (self.detailView)
			{
				if (self.obShowDetailPanel())
				{
					self.detailView.manageLayout();
					self.detailView.updateNameContainer();
				}
				else
				{
					self.detailView.updateNameContainer();
				}
				self.detailView.resizeDetailView();
				self.detailView.updateDetailViewPanelHeader();
			}
		});

		if (self.isGridPage)
		{
			var canceling = false;
			self.searchGrid.getSelectedIds.subscribe(function()
			{
				if (canceling)
				{
					return;
				}
				var current = self.searchGrid.getSelectedIds();
				if (!current[0])
				{
					self.obIsSelectRow(false);
					return;
				}

				var next = function()
				{
					self.obIsSelectRow(current.length !== 0);
					self.selectedRecordIds = current;
					if (self.obShowDetailPanel())
					{
						self.detailView.showDetailViewById(self.selectedRecordIds[0]);
					}
					else if (self.obShowFieldTripDEPanel())
					{
						if (self.fieldTripDataEntry)
						{
							self.fieldTripDataEntry._view.id = self.selectedRecordIds[0];
							self.fieldTripDataEntry.obMode("Edit");
							self.fieldTripDataEntry.loadSupplement()
								.then(self.fieldTripDataEntry.loadRecord);
						}
						else
						{
							self.editClick();
						}
					}
				}

				if (self.obShowFieldTripDEPanel() && self.fieldTripDataEntry && self.fieldTripDataEntry.obApiIsDirty())
				{
					var cancelAction = function()
					{
						canceling = true;
						self.searchGrid.getSelectedIds(self.selectedRecordIds);
						canceling = false;
					};
					tf.promiseBootbox.yesNo({ message: "You have unsaved changes.  Would you like to save your changes first?", backdrop: true, title: "Unsaved Changes", closeButton: true })
						.then(function(result)
						{
							if (result === false)
							{
								next();
							}
							else if (result === true)
							{
								self.fieldTripDataEntry.trySave().then(function(valid)
								{
									if (valid)
									{
										next();
										tf.pageManager.resizablePage.refreshLeftGrid();
										return;
									}
									cancelAction();
								});
							}
							else
							{
								cancelAction();
							}
						});

					return;
				}

				next();
			});

			self.searchGrid.getSelectedIds.subscribe(function()
			{
				self.updateEditable();
			});

			self.loadReportLists();
		}
	};

	BaseGridPage.prototype.sendEmailClick = function(viewModel, e)
	{
		var option = { clickType: 'Email' };
		//total 2 attachments, but will be added by manual
		//the excel file could use: this.searchGrid.exportCurrentGrid();
		//the kml file should get from google earch: TFExportGoogle SendToGoogle of frm_DataGrid
		return tf.promiseBootbox.yesNo(
			{
				message: "We recommend you send this message as a blind copy (Bcc) email to avoid disclosing email addresses publicly. Send this message as a Bcc?",
				title: "Confirmation",
				closeButton: true
			}).then(function(data)
			{
				if (data)
				{
					option.placeEmailTo = 'Bcc';
					if (this.searchGrid.obSelectedGridFilterName() == 'None')
					{ //no filter
						return this.setEmailSubject(this.searchGrid.obTotalRecordCount(), option);
					}
					else
					{ //with filter
						this.searchGrid.getBasicFilterCount().then(function(result)
						{
							return this.setEmailSubject(result, option);
						}.bind(this));
					}
				}
				else if (data == false)
				{
					option.placeEmailTo = 'To';
					if (this.searchGrid.obSelectedGridFilterName() == 'None')
					{ //no filter
						return this.setEmailSubject(this.searchGrid.obTotalRecordCount(), option);
					}
					else
					{ //with filter
						this.searchGrid.getBasicFilterCount().then(function(result)
						{
							return this.setEmailSubject(result, option);
						}.bind(this));
					}
				}
			}.bind(this));
	};

	BaseGridPage.prototype.sendToClick = function(viewModel, e)
	{
		var option = { clickType: 'SendTo' };
		if (this.searchGrid.obSelectedGridFilterName() == 'None')
		{ //no filter
			return this.setEmailSubject(this.searchGrid.obTotalRecordCount(), option);
		}
		else
		{ //with filter
			return this.searchGrid.getBasicFilterCount().then(function(result)
			{
				return this.setEmailSubject(result, option);
			}.bind(this));
		}
	};

	BaseGridPage.prototype.setEmailSubject = function(compareCount, option)
	{
		var self = this, selectedIds = self.searchGrid.getSelectedIds(),
			subject = tf.applicationTerm.getApplicationTermPluralByName(tf.pageManager.typeToTerm(self.type)),
			filterStr = self.searchGrid.obSelectedGridFilterName() != "None" ? ", Filter: " + self.searchGrid.obSelectedGridFilterName() : "",
			nowStr = moment().format("MM/DD/YYYY hh:mm A"),
			recordsStr = "";

		if (selectedIds.length === 0)
		{
			if (compareCount == self.searchGrid.obFilteredRecordCount())
			{
				recordsStr = "Records: All";
			}
			else
			{
				recordsStr = "Records: Selected";
			}

			return TF.Grid.LightKendoGrid.prototype.getIdsWithCurrentFiltering.call(self.searchGrid).then(function(data)
			{
				selectedIds = data;
				subject += " (" + recordsStr + filterStr + ") " + nowStr;
				return self._popupSendEmailOfGridModalViewModel.bind(self)(selectedIds, subject, option);
			});
		}
		else
		{
			if (compareCount == selectedIds.length)
			{
				recordsStr = "Records: All";
			}
			else
			{
				recordsStr = "Records: Selected";
			}

			subject += " (" + recordsStr + filterStr + ") " + nowStr;
			return self._popupSendEmailOfGridModalViewModel.bind(self)(selectedIds, subject, option);
		}
	};

	BaseGridPage.prototype._popupSendEmailOfGridModalViewModel = function(selectedIds, subject, option)
	{
		var self = this;
		var gridLayoutExtendedEntity = self.searchGrid._obCurrentGridLayoutExtendedDataModel().toData();
		var emailColumns = [];
		if (option.clickType === 'Email')
		{
			for (var i = 0; i < self.searchGrid.currentDisplayColumns().length; i++)
			{
				emailColumns.push(self.searchGrid.currentDisplayColumns()[i].field);
			}
		}
		gridLayoutExtendedEntity.LayoutColumns = self.searchGrid._obSelectedColumns();
		return tf.modalManager.showModal(
			new TF.Modal.SendEmailOfGridModalViewModel(
				{
					subject: subject,
					term: tf.pageManager.typeToTerm(self.type),
					type: self.type,
					layout: gridLayoutExtendedEntity,
					selectedIds: selectedIds,
					sortItems: self.searchGrid.searchOption.data.sortItems,
					modelType: option.clickType,
					placeEmailTo: option.placeEmailTo,
					emailColumns: emailColumns,
					setRequestOption: self.setRequestOption ? self.setRequestOption.bind(self) : undefined,
				})
		)
			.then(function()
			{
				return Promise.resolve(true);
			}.bind(this));
	};

	BaseGridPage.prototype.updateEditable = function()
	{
		var records = this.getCurrentFieldTripRecords();
		this.selectedItemEditable(TF.FieldTripAuthHelper.checkFieldTripEditable(records[0]));
		this.selectedItemsEditable(TF.FieldTripAuthHelper.checkFieldTripsEditable(records));
	};

	BaseGridPage.prototype.getCurrentFieldTripRecords = function()
	{
		return this.searchGrid.getSelectedRecords();
	};

	BaseGridPage.prototype.getCurrentFieldTripIds = function()
	{
		return this.searchGrid.getSelectedIds();
	};

	BaseGridPage.prototype.createGrid = function(option)
	{
		var self = this, iconRow, statusRow, toolRow, containerWidth,
			baseOptions = {
				storageKey: "grid.currentlayout." + self.pageType,
				pageType: self.pageType,
				gridType: self.type,
				showBulkMenu: true,
				showLockedColumn: true,
				showOmittedCount: option ? option.showOmittedCount : false,
				showSelectedCount: option ? option.showSelectedCount : false,
				gridTypeInPageInfo: option ? option.gridTypeInPageInfo : false,
				url: pathCombine(tf.api.apiPrefix(), "search", self.type),
				onDataBound: self.isGridPage ? function(option)
				{
					self.onDataBound.bind(self)(option);
				} : null
			};

		self.searchGrid = new TF.Grid.KendoGrid(self.$element.find('.kendo-grid-container'), $.extend(baseOptions, option), new TF.Grid.GridState({
			gridFilterId: null,
			filteredIds: option ? option.filteredIds : null
		}));
		self.searchGrid.filterMenuClick = self.searchGrid.filterMenuClick.bind(self);

		if (!TF.isPhoneDevice)
		{
			self.searchGrid.onDoubleClick.subscribe(function(e, data)
			{
				if (self.pageType === "reports")
				{
					return;
				}
				self.showDetailsClick();
			});
		}
		else if (TF.isPhoneDevice)
		{
			iconRow = self.$element.find(".grid-icons");
			containerWidth = iconRow.outerWidth();
			statusRow = iconRow.find(".grid-staterow-wrap");
			toolRow = iconRow.find(".iconrow");
			statusRow.width("auto");
			toolRow.width("auto");
			statusRow.css("marginLeft", "0px");
			toolRow.css("marginLeft", "0px");
			statusRow.addClass("pull-right");
			statusRow.css("marginLeft", containerWidth + "px");
			statusRow.width("100%");
			toolRow.width("100%");
			statusRow.removeClass("pull-right");
			detectswipe(self.$element.find(".grid-icons"), function(el, d)
			{
				if (d === "l" && toolRow.css("marginLeft") === "0px")
				{
					toolRow.animate({ marginLeft: -containerWidth }, 200);
					statusRow.animate({ marginLeft: 0 }, 200);
				}
				else if (d === "r" && statusRow.css("marginLeft") === "0px")
				{
					toolRow.animate({ marginLeft: 0 }, 200);
					statusRow.animate({ marginLeft: containerWidth }, 200);
				}
			});
		}

		self._openBulkMenu();
		self.targetID = ko.observable();
		self.searchGridInited(true);
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

		self.searchGrid.baseKeyPress = self.searchGrid.baseKeyPress.createInterceptor(function()
		{
			self.hideBlukMenu();
		});
	};

	/**
	 * Hide bluk menu when the hot key was triggered.
	 * @returns {void} 
	 */
	BaseGridPage.prototype.hideBlukMenu = function()
	{
		var self = this;
		if (self.bulkMenu && !self.bulkMenu.disposed)
		{
			self.bulkMenu.$container.trigger("contextMenuClose");
		}
	}

	BaseGridPage.prototype.selectRowInGridById = function(id)
	{
		if (TF.isMobileDevice)
		{
			return;
		}
		var self = this, curSelectedIds = self.selectedRecordIds;

		if (curSelectedIds.length === 1 && curSelectedIds[0] === id)
		{
			return;
		}
		else if (curSelectedIds.length > 0)
		{
			self.searchGrid.kendoGrid.clearSelection();
		}

		self.searchGrid.getSelectedIds([id]);
		self.searchGrid.isRowSelectedWhenInit = true;
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
			ga('send', 'event', 'Area', 'Summary Bar');
			self.searchGrid.summarybarIconClick(model, e);
		});
		self.bindEvent(".iconbutton.filter", self.filterMenuClick);
		self.bindEvent(".iconbutton.addremovecolumn", function(model, e)
		{
			ga('send', 'event', 'Action', 'Grid Columns');
			self.searchGrid.addRemoveColumnClick(model, e);
		});

		self.bindEvent(".iconbutton.details", function(model, e)
		{
			self.showDetailsClick();
		});

		if (self.gridViewClick)
		{
			self.bindEvent(".iconbutton.gridview", self.gridViewClick);
		}

		if (self.changeStatusButton)
		{
			self.bindEvent(".iconbutton.approve", self.editFieldTripStatus);
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

		if (self.obReports)
		{
			self.obReports(tf.authManager.isAuthorizedFor("reports", "read"));
		}
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

	BaseGridPage.prototype.openReportUserInformationModel = function(viewModel, e)
	{
	};

	BaseGridPage.prototype.openManageYouReportsModel = function(viewModel, e)
	{
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

		tf.pageManager.getMessageSettings().then(function(result)
		{
			if (!result.Items || !result.Items.length || result.Items.length <= 0 || (!result.Items[0].EnglishMessage && !result.Items[0].SpanishMessage))
			{
				navigationData.obShowMessageCenter(false);
			}
			else
			{
				navigationData.obShowMessageCenter(true);
			}

			ko.applyBindings(ko.observable(navigationData), $content[0]);
		});
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

	BaseGridPage.prototype.cancelClick = function(viewModel, e)
	{
		var self = this, selectedIds = self.getCurrentFieldTripIds(), selectedRecords = self.getCurrentFieldTripRecords(), showEditModal = function(name)
		{
			tf.modalManager.showModal(new TF.Modal.EditFieldTripStatusModalViewModel(selectedRecords, name, true))
				.then(function(data)
				{
					if (data)
					{
						self.searchGrid.refreshClick();
						tf.pageManager.resizablePage.closeRightPage();
						self.pageLevelViewModel.popupSuccessMessage("Canceled " + (selectedRecords.length > 1 ? selectedRecords.length : "")
							+ " Trip" + (selectedRecords.length > 1 ? "s" : "") + (selectedRecords.length === 1 ? " [" + name + "]" : ""));
					}
				});
		};

		if (selectedIds.length === 0)
		{
			return;
		}

		if (selectedIds.length === 1)
		{
			tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "fieldtrip", "getEntityNames"), { data: selectedIds })
				.then(function(response)
				{
					showEditModal(response.Items[0]);
				});
		}
		else
		{
			showEditModal();
		}
	};

	BaseGridPage.prototype.addClick = function(viewModel, e)
	{
		var self = this,
			view = {
				id: undefined,
				documentType: "DataEntry",
				type: "fieldtrip",
			};
		ga('send', 'event', 'Area', 'Submit New Request');
		self.fieldTripDataEntry = new TF.DataEntry.FieldTripDataEntryViewModel([], view);
		if (TF.isMobileDevice)
		{
			tf.pageManager.resizablePage.setLeftPage("workspace/dataentry/base", self.fieldTripDataEntry);
		}
		else
		{
			tf.pageManager.resizablePage.setRightPage("workspace/dataentry/base", self.fieldTripDataEntry);
		}
		self.obShowFieldTripDEPanel(true);
	};

	BaseGridPage.prototype.gridViewClick = function(viewModel, e)
	{
		var self = this;
		self.obShowDetailPanel(false);
		tf.pageManager.resizablePage.closeRightPage();
	};

	BaseGridPage.prototype.schedulerViewClick = function(viewModel, e)
	{
		var self = this;
		ga('send', 'event', 'Area', 'Field Trip Scheduler');
		tf.pageManager.openNewPage(self.pageType + "Scheduler");
	};

	BaseGridPage.prototype.loadReportLists = function()
	{
		var self = this;

		if (!self.obReportLists)
		{
			return;
		}

		tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "search", "reports", "fieldtrip"))
			.then(function(data)
			{
				if (data && data.Items && data.Items.length)
				{
					this.obReportLists(data.Items);
				}
			}.bind(this));
	};

	BaseGridPage.prototype.viewReportClick = function(viewModel, e)
	{
		var self = this;
		if (!self.obReportLists || !self.obReportLists())
		{
			return;
		}

		var selectedIds = this.searchGrid.getSelectedIds();

		tf.modalManager.showModal(new TF.Modal.GenerateReportModalViewModel(viewModel, 'view', {
			selectedRecordId: selectedIds,
			type: self.type
		}));
	};
	BaseGridPage.prototype.dispose = function()
	{
		var self = this;

		self.$element.find(".grid-icons").off(".swipe");
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
