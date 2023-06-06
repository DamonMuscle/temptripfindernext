(function()
{
	createNamespace("TF.Page").BaseGridPage = BaseGridPage;

	const SHARE_TYPE_ENUM = {
		COPY_LINK: 'Copy Link',
		QR_CODE: 'QR Code'
	}

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
		self.obOpenInProductList = ko.observableArray([]);
		self.obShareLinkProductList = ko.observableArray([]);
		self.openSelectedClick = self.openSelectedClick.bind(self);
		self.deleteSelectionClick = self.deleteSelectionClick.bind(self);
		self.kendoGridScroll = null;
		self.isGridPage = true;

		self.obReportLists = ko.observable(false);
		self.obReports = ko.observable(false);
		self.copyToClipboardClick = this.copyToClipboardClick.bind(self);
		self.saveAsClick = this.saveAsClick.bind(self);
		self.obIsSelectRow = ko.observable(false);
		self.obCanCopyFieldTrip = ko.observable(false);
		self.obCanDeleteRecord = ko.observable(false);
		self.obThematicSupported = ko.observable(tf.dataTypeHelper.checkGridThematicSupport(self.type));
		self.selectedItemEditable = ko.observable(false);
		self.selectedItemsEditable = ko.observable(false);
		self.sendToClick = self.sendToClick.bind(self);
		self.sendEmailClick = self.sendEmailClick.bind(self);
		self.viewReportClick = self.viewReportClick.bind(self);
		self.openInClick = self.openInClick.bind(self);
		self.copyLinkClick = self.copyLinkClick.bind(self);
		self.generateQRCodeClick = self.generateQRCodeClick.bind(self);
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
		self.supportAutoScroll = false;
		self.deleteButton = true;
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

		self.setRelatedFilterData();
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

		if (self.isGridPage && self.searchGrid)
		{
			var canceling = false;

			self.searchGrid.getSelectedIds.subscribe(function()
			{
				self.updateEditable();

				if (canceling)
				{
					return;
				}
				var current = self.searchGrid.getSelectedIds();
				if (!current[0])
				{
					self.obIsSelectRow(false);
					self.obCanCopyFieldTrip(false);
					self.obCanDeleteRecord(false);

					if(self.obShowDetailPanel() || self.obShowFieldTripDEPanel())
					{
						tf.pageManager.resizablePage.closeRightPage();
					}
					return;
				}

				var next = function()
				{
					self.obIsSelectRow(current.length !== 0);
					self.obCanCopyFieldTrip(current.length === 1 && self.obNewRequest());
					self.obCanDeleteRecord(current.length > 0);
					self.selectedRecordIds = current;
					if (self.obShowDetailPanel())
					{
						var isReadOnly = !self.selectedItemEditable();
						self.detailView.showDetailViewById(self.selectedRecordIds[0], null, null, isReadOnly);
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

				var cancelAction = function()
				{
					canceling = true;
					self.searchGrid.getSelectedIds(self.selectedRecordIds);
					canceling = false;
				};

				if (self.obShowFieldTripDEPanel() && self.fieldTripDataEntry && self.fieldTripDataEntry.obApiIsDirty())
				{
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
										tf.pageManager.resizablePage.refreshLeftGridKeepSelectItems();
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
				else if(self.obShowDetailPanel())
				{
					self.detailView.exitEditing().then(function(response)
					{
						if (!response)
						{
							cancelAction();
						}
						else
						{
							next();
						}
					});

					return;
				}

				next();
			});

			self.loadReportLists();
			tf.pageManager.resizablePage.$leftPage.on("focus.shortcutKeys", function()
			{
				tf.shortCutKeys.changeHashKey(self.searchGrid.options.routeState);
			}).on("blur.shortcutKeys", function()
			{
				tf.shortCutKeys.changeHashKey();
			});
		}
	};

	BaseGridPage.prototype.setRelatedFilterData = function()
	{
		var self = this,
			openRelatedData = sessionStorage.getItem("openRelated");
		if (!openRelatedData)
		{
			return;
		}

		sessionStorage.removeItem("openRelated");
		try
		{
			openRelatedData = JSON.parse(openRelatedData);
		}
		catch
		{
			return;
		}

		if (!openRelatedData || openRelatedData.pageType !== self.pageType)
		{
			return;
		}

		self.options.openRelatedData = openRelatedData;
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
			.then(function(result)
			{
				if (result)
				{
					tf.promiseBootbox.alert("An email has been sent successfully.", "Email Sent Successfully");
				}
				return Promise.resolve(result);
			}.bind(this));
	};

	BaseGridPage.prototype.updateEditable = function()
	{
		var records = this.getCurrentFieldTripRecords();
		this.selectedItemEditable(tf.helpers.fieldTripAuthHelper.checkFieldTripEditable(records[0]));
		this.selectedItemsEditable(tf.helpers.fieldTripAuthHelper.checkFieldTripsEditable(records));
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
		this.initOpenInProducts();

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
				url: pathCombine(tf.api.apiPrefix(), "search", tf.DataTypeHelper.getEndpoint(self.type)),
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
		self.searchGrid.thematicMenuClick = self.searchGrid.thematicMenuClick.bind(self);

		if (!TF.isPhoneDevice)
		{
			self.searchGrid.onDoubleClick.subscribe(function(e, data)
			{
				if (self.pageType === "reports")
				{
					return;
				}
				self.showDetailsPreClick();
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
				containerWidth = iconRow.outerWidth();
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
			$(window).on("resize.toolbar", function()
			{
				iconRow = self.$element.find(".grid-icons");
				containerWidth = iconRow.outerWidth();
				statusRow = iconRow.find(".grid-staterow-wrap");
				toolRow = iconRow.find(".iconrow");
				if (toolRow.css("marginLeft") === "0px")
				{
					toolRow.css("marginLeft", "0px");
					statusRow.css("marginLeft", containerWidth + "px");
				}
				else
				{
					toolRow.css("marginLeft", -containerWidth + "px");
					statusRow.css("marginLeft", "0px");
				}
			});
		}

		self._openBulkMenu();
		self.targetID = ko.observable();
		self.searchGridInited(true);

		if (!TF.isPhoneDevice && self.searchGrid && self.type == "fieldtrip" && !self.isSchedulerPage)
		{
			self.searchGrid.onCtrlSPress.subscribe(self.onCtrlSPress.bind(self));
			self.searchGrid.onCtrlCPress.subscribe(self.onCtrlCPress.bind(self));
			self.searchGrid.onEnterPress.subscribe(self.onEnterPress.bind(self));
		}
	};

	BaseGridPage.prototype.onEnterPress = function()
	{
		if (this.obShowDetailPanel() || this.obShowFieldTripDEPanel())
		{
			return;
		}

		this.showDetailsPreClick();
	};

	BaseGridPage.prototype.initOpenInProducts = function()
	{
		return tf.authManager.getPurchasedProducts()
			.then(products =>
			{
				const openInProducts = TF.Helper.KendoGridHelper.getShareableProducts(products, this.type, true, true);
				const shareLinkProducts = TF.Helper.KendoGridHelper.getShareableProducts(products, this.type, false, false);

				this.obOpenInProductList(openInProducts);
				this.obShareLinkProductList(shareLinkProducts);
			});
	};

	BaseGridPage.prototype.openInClick = function(product)
	{
		const selectedIds = this.searchGrid.getSelectedIds();
		const layoutColumns = this.searchGrid.getCurrentGridLayout().layoutColumns();

		TF.Helper.KendoGridHelper.openInGrid(this.type, selectedIds, layoutColumns, product);
	};

	BaseGridPage.prototype.copyLinkClick = function(product)
	{
		this.shareAs(SHARE_TYPE_ENUM.COPY_LINK, product);
	};

	BaseGridPage.prototype.generateQRCodeClick = function(product)
	{
		this.shareAs(SHARE_TYPE_ENUM.QR_CODE, product);
	};

	BaseGridPage.prototype.shareAs = function(shareType, product)
	{
		const self = this;
		const selectedIds = self.searchGrid.getSelectedIds();
		const layoutColumns = self.searchGrid.getCurrentGridLayout().layoutColumns();
		const thematicModel = self.searchGrid.tempGridThematicDataModel || (self.searchGrid.obSelectedGridThematicDataModel && self.searchGrid.obSelectedGridThematicDataModel());
		let thematicSetting = null;

		if (thematicModel)
		{
			thematicSetting = {
				customDisplaySetting: JSON.parse(thematicModel.customDisplaySetting()),
				quickFilters: JSON.parse(thematicModel.quickFilters())
			};
		}

		let additionalInfo = { pageType: self.pageType };
		if (self.type === 'gpsevent')
		{
			additionalInfo = $.extend(additionalInfo, {
				dayOfTheWeek: tf.userPreferenceManager.get(`${tf.storageManager.prefix}dashboard.viewie.gpsevent.listFilterWithSelectDateTimeRange.dayOfTheWeek`),
				startDate: tf.userPreferenceManager.get(`${tf.storageManager.prefix}dashboard.viewie.gpsevent.listFilterWithSelectDateTimeRange.startDate`),
				startTime: tf.userPreferenceManager.get(`${tf.storageManager.prefix}dashboard.viewie.gpsevent.listFilterWithSelectDateTimeRange.startTime`),
				endDate: tf.userPreferenceManager.get(`${tf.storageManager.prefix}dashboard.viewie.gpsevent.listFilterWithSelectDateTimeRange.endDate`),
				endTime: tf.userPreferenceManager.get(`${tf.storageManager.prefix}dashboard.viewie.gpsevent.listFilterWithSelectDateTimeRange.endTime`),
				gpsEventTypeList: tf.userPreferenceManager.get(`${tf.storageManager.prefix}dashboard.viewie.gpsevent.listFilterWithSelectDateTimeRange.gpseventtypelist`),
				vehicleList: tf.userPreferenceManager.get(`${tf.storageManager.prefix}dashboard.viewie.gpsevent.listFilterWithSelectDateTimeRange.vehiclelist`),
			});
		}

		TF.Helper.KendoGridHelper.createShareURL(self.type, selectedIds, layoutColumns, product, thematicSetting, additionalInfo)
			.then(url =>
			{
				if (!url) { return; }

				switch (shareType)
				{
					case SHARE_TYPE_ENUM.COPY_LINK:
						self.copyLink(url);
						break;
					case SHARE_TYPE_ENUM.QR_CODE:
						self.downloadQRCode(url);
						break;
					default:
						break;
				}
			})
	};

	BaseGridPage.prototype.copyLink = function(url)
	{
		try
		{
			this.copyText(url);
		}
		catch (e)
		{
			const copyLinkFailMsg = "Failed to copy Link to clipboard.";
			this.pageLevelViewModel.popupErrorMessage(copyLinkFailMsg);
			return;
		}

		const copyLinkSuccessMsg = "Link copied to clipboard.";
		this.pageLevelViewModel.popupSuccessMessage(copyLinkSuccessMsg);
	};

	// Copy method polyfill
	BaseGridPage.prototype.copyText = function(content)
	{
		if (window.navigator.clipboard)
		{
			window.navigator.clipboard.writeText(content);
		}
		else
		{
			var el = document.createElement('textarea');
			el.value = content;
			document.body.appendChild(el);
			el.select();
			document.execCommand('copy');
			document.body.removeChild(el);
		}
	}

	BaseGridPage.prototype._openBulkMenu = function()
	{
		var self = this;
		if (!TF.isPhoneDevice)
		{
			self.$element.delegate("table.k-selectable tr", "contextmenu", function(e, parentE)
			{
				var element = e;
				if (parentE)
				{
					element = parentE;
				}
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
			});
		}

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
		if (TF.isMobileDevice || !this.searchGrid)
		{
			return;
		}

		var curSelectedIds = this.selectedRecordIds;
		if (curSelectedIds.length === 1 && curSelectedIds[0] === id)
		{
			return;
		}

		if (curSelectedIds.length > 0)
		{
			this.searchGrid.kendoGrid.clearSelection();
		}

		this.searchGrid.getSelectedIds([id]);
		this.searchGrid.isRowSelectedWhenInit = true;
	};

	BaseGridPage.prototype.initSearchGridCompute = function()
	{
		var self = this;
		self.obSelectedGridLayoutModified = ko.computed(function()
		{
			return self.searchGridInited() && self.searchGrid.obSelectedGridLayoutModified();
		}, self);
		self.obCurrentLayoutStatus = ko.computed(() =>
		{
			return self.obSelectedGridLayoutModified() ? "(modified)" : "";
		});
		self.obSelectedGridLayoutName = ko.computed(function()
		{
			return self.searchGridInited() && self.searchGrid.obSelectedGridLayoutName();
		}, self);

		self.obSelectedGridFilterModified = ko.computed(function()
		{
			return self.searchGridInited() && self.searchGrid.obSelectedGridFilterModified();
		}, self);
		self.obSelectedGridFilterModifiedMessage = ko.computed(function()
		{
			return self.obSelectedGridFilterModified() ? "(modified)" : "";
		}, self);
		self.obSelectedGridFilterName = ko.computed(function()
		{
			return self.searchGridInited() && self.searchGrid.obSelectedGridFilterName();
		}, self);

		self.obIsThematicApplied = ko.computed(function()
		{
			return self.searchGridInited() && self.searchGrid.obIsThematicApplied();
		}, self);
		self.noApplyFilterNoModified = ko.computed(function()
		{
			return self.searchGridInited() && self.searchGrid.noApplyFilterNoModified();
		}, self);
		self.obSelectedGridThematicName = ko.computed(function()
		{
			return self.searchGridInited() && self.searchGrid.obSelectedGridThematicName();
		}, self);

		self.obSummaryGridVisible = ko.computed(function()
		{
			return self.searchGridInited() && self.searchGrid.obSummaryGridVisible();
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

	BaseGridPage.prototype.unBindEvent = function(buttonSelector)
	{
		var self = this;
		self.$element.find(buttonSelector).off("click");
	}

	BaseGridPage.prototype.bindButtonEvent = function()
	{
		var self = this;
		self.bindEvent(".iconbutton.summarybar", function(model, e)
		{
			ga('send', 'event', 'Area', 'Summary Bar');
			self.searchGrid.summarybarIconClick(model, e);
		});
		self.bindEvent(".iconbutton.filter", self.filterMenuClick);
		self.bindEvent(".iconbutton.thematic", self.thematicMenuClick);
		self.bindEvent(".iconbutton.addremovecolumn", function(model, e)
		{
			ga('send', 'event', 'Action', 'Grid Columns');
			self.searchGrid.addRemoveColumnClick(model, e);
		});

		self.bindEvent(".iconbutton.details", function(model, e)
		{
			self.showDetailsPreClick();
		});

		if (self.gridViewClick)
		{
			self.bindEvent(".iconbutton.gridview", self.gridViewClick);
		}

		if (self.changeStatusButton)
		{
			self.bindEvent(".iconbutton.approve", self.editFieldTripStatus);
		}

		if (self.copyButton)
		{
			self.bindEvent(".iconbutton.copy", self.copyFieldTrip.bind(self));
		}

		if (self.cancelClick)
		{
			self.bindEvent(".iconbutton.cancel", self.cancelClick);
		}

		self.bindEvent(".iconbutton.layout", self.layoutIconClick);
		self.bindEvent(".iconbutton.refresh", function(model, e)
		{
			self.refreshClick();
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

	BaseGridPage.prototype.thematicMenuClick = function(viewModel, e)
	{
		var self = this,
			cacheOperatorBeforeHiddenMenu = TF.menuHelper.needHiddenOpenedMenu(e),
			cacheOperatorBeforeOpenMenu = TF.menuHelper.needOpenCurrentMenu(e);

		if (cacheOperatorBeforeHiddenMenu)
		{
			TF.menuHelper.hiddenMenu();
		}

		if (cacheOperatorBeforeOpenMenu)
		{
			tf.pageManager.showContextMenu(e.currentTarge);
			self.searchGrid.thematicMenuClick(e, function()
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
		if (self.supportAutoScroll)
		{
			self.autoScrollInit();
		}

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

	BaseGridPage.prototype.editFieldTripStatus = function()
	{
		this.editFieldTripStatusCore();
	};

	BaseGridPage.prototype.copyFieldTrip = function()
	{
		var self = this, selectedId, selectedName,
			selectedIds = self.searchGrid.getSelectedIds(), selectedRecords = self.searchGrid.getSelectedRecords();
		if (!selectedRecords || selectedRecords.length <= 0)
		{
			return;
		}
		if (!selectedIds || selectedIds.length <= 0)
		{
			return;
		}

		return self.validateFieldTrip(selectedRecords[0]).then(function(result)
		{
			if (!result.valid)
			{
				self.pageLevelViewModel.popupErrorMessage(result.message);
				return;
			}

			selectedId = selectedIds[0];
			selectedName = selectedRecords[0].Name;
			return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), tf.DataTypeHelper.getEndpoint("FieldTrip")), {
				paramData: {
					copyFromId: selectedId,
					fieldTripName: TF.Helper.NewCopyNameHelper.generateNewCopyName(selectedName,
						self.searchGrid.kendoGrid.dataSource._data.map(function(d)
						{
							return d.Name;
						}))
				}
			})
			.then(function(response)
			{
				if (response && response.StatusCode === 404)
				{//change the api side to avoid http error, using response status 404 to identify the nonexistence.
					return Promise.reject(response);
				}
				self.pageLevelViewModel.popupSuccessMessage("Field Trip Copied");
				self.searchGrid.refreshClick();
				return true;
			}.bind(self))
			.catch(function(response)
			{
				if (response && response.StatusCode === 412)
				{
					self.pageLevelViewModel.popupErrorMessage(response.Message);
					return Promise.reject(response);
				}

				if (response && response.StatusCode === 404)
				{
					return Promise.reject(response);
				}
			}.bind(self));
		});
	};

	BaseGridPage.prototype.validateFieldTrip = function(record)
	{
		if (tf.helpers.fieldTripAuthHelper.isFieldTripAdmin())
		{
			return Promise.resolve({ valid: true, message: "" });
		}

		return this.checkFieldTripDeadline(record.DepartDateTime);
	};

	BaseGridPage.prototype.checkFieldTripDeadline = function(dateTime)
	{
		if (!dateTime)
		{
			return Promise.resolve({ valid: true, message: "" });
		}

		const mmtObj = moment(dateTime);
		if(!mmtObj.isValid())
		{
			return Promise.resolve({ valid: false, message: "Depart Date is invalid." });
		}

		return this._validateScheduleDaysInAdvance(dateTime);
	};

	BaseGridPage.prototype._validateScheduleDaysInAdvance = function(dateTime)
	{
		const mmtObj = moment(dateTime);
		let daysInAdvance = tf.fieldTripConfigsDataHelper.fieldTripConfigs.ScheduleDaysInAdvance;
		if (!Number.isInteger(daysInAdvance) || daysInAdvance < 0)	// at least 0 day in advance (>= today)
		{
			daysInAdvance = 0;
		}

		return tf.fieldTripConfigsDataHelper.getHolidayMap()
			.then(function(holidayMap)
			{
				const isSchoolDay = function(mmtDay)	// helper function for detect if a given day (moment date) is school day
				{
					var dateStr = mmtDay.format("YYYY-MM-DD"), weekdayIndex = mmtDay.weekday();
					const notWeekend = weekdayIndex > 0 && weekdayIndex < 6,
						notHoliday = !holidayMap[dateStr];
					return  notWeekend && notHoliday;
				};

				if (!isSchoolDay(mmtObj))
				{
					return { valid: false, message: "Must depart on school day." };
				}

				let schoolDays = 0;	// counter for valid school days passed
				const mmtLeftBound = moment().startOf("day");	// start from today

				while (schoolDays < daysInAdvance)
				{
					mmtLeftBound.add(1, "days");
					if (isSchoolDay(mmtLeftBound))
					{
						++schoolDays;
					}
				}

				if (mmtObj.startOf("day") < mmtLeftBound)
				{
					return { valid: false, message: String.format("Depart Date must be on or after {0}", mmtLeftBound.format("M/D/YYYY")) };
				}

				return { valid: true, message: "" };
			});
	};

	BaseGridPage.prototype.editFieldTripStatusCore = function(cancel)
	{
		var selectedRecords = this.getCurrentFieldTripRecords();
		if (!selectedRecords || !selectedRecords.length)
		{
			return;
		}

		tf.modalManager.showModal(new TF.Modal.EditFieldTripStatusModalViewModel(selectedRecords, cancel))
			.then(function(data)
			{
				if (data)
				{
					this.refreshClick();
					var msg = this.getStatusChangedMessage(selectedRecords);
					this.pageLevelViewModel.popupSuccessMessage(msg);
				}
			}.bind(this));
	};

	BaseGridPage.prototype.refreshClick = function()
	{
		tf.pageManager.resizablePage.closeRightPage();
		this.searchGrid.refreshClick();
	};

	BaseGridPage.prototype.cancelClick = function()
	{
		this.editFieldTripStatusCore(true);
	};

	BaseGridPage.prototype.addClick = function(viewModel, e)
	{
		var self = this;

		self.clearSelection();

		if(self.type == "fieldtrip") 
		{
			var view = {
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
			if (!TF.isMobileDevice)
			{
				tf.pageManager.obFieldTripEditPage(self.fieldTripDataEntry);
			}

			self.obShowFieldTripDEPanel(true);
		}
		else
		{
			ga('send', 'event', 'Area', 'Details');
			var isReadOnly = !self.selectedItemEditable() && !self.obNewRequest(); // readonly if both Edit and Add are not allowed

			if(self.detailView && self.obShowDetailPanel())
			{
				self.detailView.showDetailViewById(null, self.type, null, isReadOnly);
			}
			else
			{
				self.detailView = new TF.DetailView.DetailViewViewModel(null, this.pageLevelViewModel, isReadOnly, {}, self.type);	

				self.detailView.onCloseDetailEvent.subscribe(
					self.closeDetailClick.bind(this)
				);
				self.detailView.onCreateNewRecordSuccess.subscribe(
					self.onCreateNewRecordSuccessHandler.bind(self)
				);

				if (TF.isMobileDevice)
				{
					tf.pageManager.resizablePage.setLeftPage("workspace/detailview/detailview", self.detailView);
				}
				else
				{
					tf.pageManager.resizablePage.setRightPage("workspace/detailview/detailview", self.detailView);
				}
			}
			
			self.obShowDetailPanel(true);
		}
	};

	/**
	 * Copy & New function 
	 * @param {*} overrideProperty specify the which field should be overrided with new value
	 * @returns 
	 */
	BaseGridPage.prototype.newCopyClick = function(overrideProperty)
	{
		var self = this;
		var selectedRecords = this.searchGrid.getSelectedRecords();
		if (!selectedRecords || selectedRecords.length === 0)
		{
			return;
		}

		if (selectedRecords.length > 1)
		{
			tf.promiseBootbox.alert("Only allow one record in each operation!", "Confirmation Message");
			return;
		}

		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), self.endpoint), { paramData: { id: selectedRecords[0].Id, '@relationships': 'udf' } })
			.then((response) =>
			{
				if (response.Items.length != 1)
				{ return; }
				// copy
				var overrideFields = {};
				if(typeof overrideProperty === "string")
				{
					var currentValue = response.Items[0][overrideProperty];
					var valueList = self.searchGrid.kendoGrid.dataSource._data.map(function(d)
					{
						return d[overrideProperty];
					});

					overrideFields[overrideProperty] = TF.Helper.NewCopyNameHelper.generateNewCopyName(currentValue, valueList);
				}
				else if (typeof overrideProperty  === "function" ) 
				{
					overrideFields = overrideProperty(response.Items[0]);
				}
				var copyItem = $.extend(true, {}, response.Items[0], overrideFields);
				// save
				return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), self.endpoint),
					{
						data: [copyItem],
						paramData: { '@relationships': 'udf' }
					})
					.then(() =>
					{
						self.pageLevelViewModel.popupSuccessMessage(`${tf.dataTypeHelper.getFormalDataTypeName(self.type)} Copied`);
						self.searchGrid.refreshClick();
					});
			})
			.catch((response) =>
			{
				if (response && response.StatusCode === 404)
				{
					return Promise.reject(response);
				}
			});
	};	

	BaseGridPage.prototype.clearSelection = function()
	{
		var self = this, searchGrid = self.searchGrid;
		if (searchGrid && searchGrid.getSelectedIds().length > 0)
		{
			searchGrid.clearSelection();
		}
	}

	BaseGridPage.prototype.gridViewClick = function(viewModel, e)
	{
		var self = this;
		if (tf.pageManager.obFieldTripEditPage() && tf.pageManager.obFieldTripEditPage().obEntityDataModel() && tf.pageManager.obFieldTripEditPage().tryGoAway)
		{
			tf.pageManager.obFieldTripEditPage().tryGoAway("", "You have unsaved changes. Would you like to save your changes first?").then(function(result)
			{
				if (result)
				{
					tf.pageManager.obFieldTripEditPage(null);
					self.obShowDetailPanel(false);
					tf.pageManager.resizablePage.closeRightPage();
				}
			});
		}
		else
		{
			self.obShowDetailPanel(false);
			tf.pageManager.resizablePage.closeRightPage();
		}
	};

	BaseGridPage.prototype.showDetailsPreClick = function(viewModel, e)
	{
		var self = this;
		if (tf.pageManager.obFieldTripEditPage() && tf.pageManager.obFieldTripEditPage().obEntityDataModel() && tf.pageManager.obFieldTripEditPage().tryGoAway)
		{
			tf.pageManager.obFieldTripEditPage().tryGoAway("", "You have unsaved changes. Would you like to save your changes first?").then(function(result)
			{
				if (result)
				{
					tf.pageManager.obFieldTripEditPage(null);
					self.showDetailsClick(false);
				}
			});
		}
		else
		{
			self.showDetailsClick(false);
		}
	};

	BaseGridPage.prototype.schedulerViewClick = function(viewModel, e)
	{
		var self = this;
		ga('send', 'event', 'Area', 'Field Trip Scheduler');
		tf.pageManager.openNewPage(self.pageType + "Scheduler");
	};

	BaseGridPage.prototype._getIdsFromRelated = function(relatedType, descriptor, relatedIds)
	{
		const self = this;
		const dataType = self.type;

		if (relatedType === "contact")
		{
			return self._getContactsRelatedGridRecords(dataType, relatedIds);
		}
		else if (relatedType === "document")
		{
			return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "documentrelationships"), {
				paramData: {
					"DBID": tf.datasourceManager.databaseId,
					"AttachedToType": tf.dataTypeHelper.getId(dataType),
					"@fields": "DocumentID",
					"@filter": "in(AttachedToID," + relatedIds.join(',') + ")"
				}
			}).then(function(idResponse)
			{
				return idResponse.Items.map(function(item)
				{
					return item.DocumentID;
				});
			});
		}
		else if (dataType === "contact")
		{
			return self._getRelatesToContactGridRecords(relatedType, relatedIds);
		}
		else
		{
			const urlNode = tf.dataTypeHelper.getEndpoint(relatedType);
			const idsParamName = tf.dataTypeHelper.getIdsParamName(dataType);
			const paramData = { "@fields": "Id" };

			paramData[idsParamName] = relatedIds.join(",");

			if (descriptor)
			{
				paramData["type"] = descriptor;
			}

			return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), urlNode),
				{
					paramData: paramData
				})
				.then(res =>
				{
					return Array.isArray(res.Items) && res.Items.length > 0
						? res.Items.map((o) => o.Id) : [-1];
				});
		}
	};

	BaseGridPage.prototype._getRelatesToContactGridRecords = function(type, relatedIds)
	{
		var url = pathCombine(tf.api.apiPrefixWithoutDatabase(), 'RecordContacts'),
			dbQueryString = String.format("eq(DBID,{0})", tf.datasourceManager.databaseId),
			dataTypeQueryString = String.format("&eq(DataTypeID,{0})", tf.dataTypeHelper.getId(type)),
			inQueryTemplate = String.format("&in(ContactID,{0})", tf.urlHelper.TEMPLATE_REPLACE_STRING),
			template = String.format("{0}?@filter={1}{2}{3}&@fields=RecordID", url, dbQueryString, dataTypeQueryString, inQueryTemplate),
			idStringList = tf.urlHelper.splitExceedRequest(template, relatedIds),
			deferred = [],
			contactIDQueryString = paramData = p0 = null;

		idStringList.forEach(function(idString)
		{
			contactIDQueryString = String.format("&in(ContactID,{0})", idString)
			paramData = {
				"@filter": String.format("{0}{1}{2}",
					dbQueryString,
					dataTypeQueryString,
					contactIDQueryString),
				"@fields": "RecordID"
			};

			p0 = tf.promiseAjax.get(url, { paramData: paramData });
			deferred.push(p0);
		});
		return this._getRelatedRecordIds(deferred, "RecordID");
	};

	BaseGridPage.prototype._getContactsRelatedGridRecords = function(type, relatedIds)
	{
		var url = pathCombine(tf.api.apiPrefixWithoutDatabase(), 'RecordContacts'),
			dbQueryString = String.format("eq(DBID,{0})", tf.datasourceManager.databaseId),
			dataTypeQueryString = String.format("&eq(DataTypeID,{0})", tf.dataTypeHelper.getId(type)),
			inQueryTemplate = String.format("&in(RecordID,{0})", tf.urlHelper.TEMPLATE_REPLACE_STRING),
			template = String.format("{0}?@filter={1}{2}{3}&@fields=ContactID", url, dbQueryString, dataTypeQueryString, inQueryTemplate),
			idStringList = tf.urlHelper.splitExceedRequest(template, relatedIds),
			deferred = [],
			recordIDQueryString = paramData = p0 = null;

		idStringList.forEach(function(idString)
		{
			recordIDQueryString = String.format("&in(RecordID,{0})", idString)
			paramData = {
				"@filter": String.format("{0}{1}{2}",
					dbQueryString,
					dataTypeQueryString,
					recordIDQueryString),
				"@fields": "ContactID"
			};

			p0 = tf.promiseAjax.get(url, { paramData: paramData });
			deferred.push(p0);
		});
		return this._getRelatedRecordIds(deferred, "ContactID");
	};

	BaseGridPage.prototype._getRelatedRecordIds = function(deferred, fieldName)
	{
		return Promise.all(deferred).then(function(results)
		{
			var recordIds = [];
			for (var i = 0, count = results.length; i < count; i++)
			{
				var result = results[i]
				if (Array.isArray(result.Items) && result.Items.length > 0)
				{
					recordIds = recordIds.concat(result.Items.map(function(item) { return item[fieldName]; }));
				}
			}

			if (recordIds.length === 0)
			{
				return [-1];
			}

			return Array.unique(recordIds);
		});
	};

	BaseGridPage.prototype._getValidReportIds = async function()
	{
		var self = this;
		return tf.promiseAjax.post(pathCombine(tf.api.apiPrefixWithoutDatabase(), "search/exagoreports", "id"),
			{
				paramData: {
					databaseId: tf.datasourceManager.databaseId,
				},
				data: {
					"fields": ["Id"],
					"filterSet": { "FilterItems": [], "FilterSets": [], "LogicalOperator": "and" }
				}
			}
		).then(function(apiResponse)
		{
			self.allIds = apiResponse.Items;
			return self.allIds.slice(0);
		}).catch(function(ex)
		{
			console.log(ex);
			return [];
		});
	}

	BaseGridPage.prototype.loadReportLists = async function()
	{
		var self = this;
		const validReportIds = await self._getValidReportIds();
		let getReporsPromise = tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "exagoreports"), {
			paramData: {
				dataTypeId: tf.dataTypeHelper.getId(self.type),
				"@filter": "eq(IsDashboard,false)"
			}
		}),
			getReportFavoritePromise = tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "userreportfavorites"), {
				paramData: {
					"@filter": `eq(UserID,${tf.authManager.authorizationInfo.authorizationTree.userId})`
				}
			});

		Promise.all([getReporsPromise, getReportFavoritePromise]).then(([getReportsResponse, getReportFavoriteResponse]) =>
		{
			let favoriteReportIds = getReportFavoriteResponse.Items.map(item => item.ReportID);
			getReportsResponse.Items.forEach(report =>
			{
				report.IsFavorite = favoriteReportIds.includes(report.Id);
			});

			let reportList = Array.sortBy(getReportsResponse.Items.filter(item => item.IsFavorite), "Name").concat(Array.sortBy(getReportsResponse.Items.filter(item => !item.IsFavorite), "Name"));
			reportList = reportList.filter(r => validReportIds.indexOf(r.Id) > -1);
			self.obReportLists(reportList);
		});
	};


	BaseGridPage.prototype.viewReportClick = function(reportViewModel, e)
	{
		var self = this;
		var selectedIds = self.searchGrid.getSelectedIds();
		if (selectedIds.length === 0)
		{
			self.searchGrid.getIdsWithCurrentFiltering()
				.then(function(data)
				{
					selectedIds = data;
					self.openReportConfigure(reportViewModel, selectedIds);
				}.bind(self));
		}
		else
		{
			self.openReportConfigure(reportViewModel, selectedIds);
		}
	};

	BaseGridPage.prototype.openReportConfigure = function(reportViewModel, ids)
	{
		var reportId = reportViewModel.Id;

		tf.exagoReportDataHelper.fetchReportWithMetadata(reportId)
			.then(function(entity)
			{
				if (!entity) return;

				return tf.modalManager.showModal(new TF.Modal.Report.ExagoBIRunReportModalViewModel(
					{
						editOnly: false,
						entity: entity,
						explicitRecordIds: ids
					}
				));
			})
			.then(function(execResult)
			{
				if (execResult && execResult.externalReportViewerUrl)
				{
					window.open(execResult.externalReportViewerUrl, "_blank");
				}
			});
	};

	BaseGridPage.prototype.getSubmitLabel = function() 
	{
		var label = "";
		
		switch(this.type)
		{
			case "contact":
				label = "Add New Contact";
				break;
			case "staff":
				label = "Add New Staff";
				break;
			case "vehicle":
				label = "Add New Vehicle";
				break;
			case "fieldtriplocation":
				label = "Add New Location";
				break;
			default:
				label = "Submit New Request";
		}

		return label;
	}

	BaseGridPage.prototype.isAddVisible = function()
	{
		var self = this;
		var dataTypes = tf.dataTypeHelper.getAvailableDataTypes();
		return dataTypes.some(item => item.key === self.type) && (!self.obShowFieldTripDEPanel() || !self.obShowDetailPanel()) && self.obNewRequest();
	}

	BaseGridPage.prototype._openGlobalReplaceModal = function()
	{
		var self = this, selectedIds = self.searchGrid.getSelectedIds(), gridType = self.searchGrid._gridType;
		return tf.modalManager.showModal(new TF.Modal.Grid.GlobalReplaceSettingsModalViewModel(selectedIds.length, gridType)).then(function(result)
		{
			if (!result)
			{
				return;
			}

			var recordIds = [], field, newValue, relationshipKey;
			if (result.specifyRecords == "selected")
			{
				recordIds = selectedIds;
			}
			else
			{
				recordIds = self.searchGrid.allIds;
			}

			field = result.targetField;
			newValue = result.newValue;
			if (result.replaceType == "Standard")
			{
				return self._globalReplaceConfirm(recordIds).then(function(yesOrNo)
				{
					if (!yesOrNo)
					{
						return;
					}

					if (result.format === 'Phone')
					{
						if (newValue instanceof Array)
						{
							newValue.forEach(x =>
							{
								x.RecordValue = tf.dataFormatHelper.getStandardPhoneNumberValue(x.RecordValue);
							});
						}
						else if (newValue)
						{
							newValue = tf.dataFormatHelper.getStandardPhoneNumberValue(newValue);
						}
					}

					result.newValue = newValue;
					self._globalReplace(recordIds, result);
				});
			}

			var seriesRunFailed, seriesRunError, afterSeriesRunReject = ex =>
			{
				seriesRunFailed = true;
				seriesRunError = ex;
				return false;
			};

			if (result.extended)
			{
				var promise = Promise.resolve(false);
				if (result.extended != "resetAllDefaultRequirements")
				{
					let confirmationMessage;
					switch (result.extended)
					{
						case "removeAllSchedule":
							confirmationMessage = "This change will remove selected students from all their related Trips including any exception Trips. Do you wish to continue?";
							break;
						case "removeAllExceptions":
							confirmationMessage = "This change will remove selected students from all their related exception Trips. Do you wish to continue?";
							break;
						default:
							confirmationMessage = "This change may remove selected students from all their related Trips. Do you wish to continue?";
							break;
					}
					promise = tf.promiseBootbox.yesNo(confirmationMessage, "Confirmation Message").then(function(yesOrNo)
					{
						if (yesOrNo)
						{
							var size = 1000;
							return TF.seriesRun(recordIds, size, function(studentIds)
							{
								if (seriesRunFailed == null)
								{
									seriesRunFailed = false;
								}

								if (result.extended == "removeAllAdditionalRequirements")
								{
									// Remove all additional requirements
									return tf.promiseAjax.delete(pathCombine(tf.api.apiPrefixWithoutDatabase(), "StudentRequirements"), {
										paramData: {
											"@filter": "in(StudentId," + studentIds.join(",") + ")&eq(Type,1)",
											dbid: tf.datasourceManager.databaseId
										}
									}).catch(afterSeriesRunReject);
								}
								else if (result.extended == "removeAllExceptions")
								{
									// Remove all exceptions
									return tf.promiseAjax.delete(pathCombine(tf.api.apiPrefixWithoutDatabase(), "StudentSchedules"), {
										paramData: {
											"@filter": "in(StudentId," + studentIds.join(",") + ")&isnull(StudentRequirementId)",
											dbid: tf.datasourceManager.databaseId
										}
									}).catch(afterSeriesRunReject);
								}
								else if (result.extended == "removeAllSchedule")
								{
									// Remove all Schedule
									return tf.promiseAjax.delete(pathCombine(tf.api.apiPrefixWithoutDatabase(), "StudentSchedules"), {
										paramData: {
											"@filter": "in(StudentId," + studentIds.join(",") + ")",
											dbid: tf.datasourceManager.databaseId
										}
									}).catch(afterSeriesRunReject);
								}
								else if (result.extended == "removeAllDefaultRequirements")
								{
									// Remove all default requirements
									return tf.promiseAjax.delete(pathCombine(tf.api.apiPrefixWithoutDatabase(), "StudentRequirements"), {
										paramData: {
											"@filter": "in(StudentId," + studentIds.join(",") + ")&eq(Type,0)",
											dbid: tf.datasourceManager.databaseId
										}
									}).catch(afterSeriesRunReject);
								}
								else if (result.extended == "Update All Default Requirements to None")
								{
									// Update All Default Requirements to None
									return tf.promiseAjax.post(pathCombine(tf.api.apiPrefixWithoutDatabase(), "StudentRequirements"), {
										paramData: {
											databaseId: tf.datasourceManager.databaseId,
											noTransportationId: result.noTransportationId,
											resetDefaultRequirement: true
										},
										data: studentIds
									}).catch(afterSeriesRunReject);
								}
							}, true, 0);
						}
					});
				}
				else
				{
					// reset default requirements
					promise = tf.promiseAjax.post(pathCombine(tf.api.apiPrefixWithoutDatabase(), "StudentRequirements"), {
						data: recordIds,
						paramData: {
							resetDefaultRequirement: true,
							databaseId: tf.datasourceManager.databaseId
						}
					});
				}

				var fail = function(error)
				{
					error = error || {};
					tf.promiseBootbox.alert(error.Message || "Failed", "Mass Update failed.");
				}, succeed = function()
				{
					self.searchGrid.refresh();
					self.searchGrid.lightKendoGridDetail && self.searchGrid.lightKendoGridDetail.refresh();
					tf.promiseBootbox.alert("Mass Update succeeded.");
					PubSub.publish(topicCombine(pb.DATA_CHANGE, "trip"));
				};
				return promise.then(function(result)
				{
					if (result)
					{
						if (result instanceof Array && result.some(r => r === false))
						{
							fail(seriesRunError);
						}
						else
						{
							succeed();
						}
					}
					else if (result == null)
					{
						if (seriesRunFailed === false)
						{
							succeed();
						}
						else if (seriesRunFailed === true)
						{
							fail(seriesRunError);
						}
					}
				}, fail);
			}
		});
	};

	BaseGridPage.prototype._globalReplaceConfirm = function(recordIds)
	{
		return tf.promiseBootbox.yesNo(String.format('Are you sure you want to mass update {0} {1}? These changes are permanent.', recordIds.length, recordIds.length == 1 ? 'record' : 'records'), "Confirmation Message");
	};

	BaseGridPage.prototype._globalReplace = function(recordIds, settings)
	{
		let self = this,
			data,
			paramData = { "@isMassUpdate": true },
			newValue = settings.newValue,
			relationshipKey = settings.relationshipKey,
			enableNull = settings.editType ? settings.editType.allowNullValue : false;
		if (settings.editType && settings.editType.format == "DropDown")
		{
			enableNull = self.type === 'trip' && settings.targetField === 'DriverId';
		}

		if (relationshipKey)
		{
			paramData["@relationships"] = relationshipKey;
			const specialRelationshipKeys = ['DisabilityCode', 'EthnicCode', 'TripAlias', 'StaffType', 'Grade', 'Gender'];
			newValue = specialRelationshipKeys.indexOf(relationshipKey) >= 0 ? newValue : JSON.stringify(newValue);
		}
		else if (!enableNull && newValue == null && settings.type != "Number")
		{
			newValue = "";
		}

		data = {
			Ids: recordIds,
			TargetField: settings.targetField,
			TargetUdfId: settings.targetUdfId,
			SourceField: settings.sourceField,
			SourceUdfId: settings.sourceUdfId,
			Value: newValue,
			DataType: tf.dataTypeHelper.getId(self.type),
			DBID: tf.datasourceManager.databaseId
		};

		if (settings.needConversion)
		{
			data.NeedConversion = settings.needConversion;
			data.IsMultiply = settings.isMultiply;
			data.ConversionParameter = settings.conversionParameter;
		}

		return tf.promiseAjax.patch(pathCombine(tf.api.apiPrefix(), tf.dataTypeHelper.getEndpoint(self.searchGrid._gridType)), {
			paramData: paramData,
			data: data,
		}).then(function(result)
		{
			if (result && result.Items && result.Items[0])
			{
				self.refreshAfterGlobalReplace();
				tf.modalManager.showModal(new TF.Modal.Grid.GlobalReplaceResultsModalViewModel(result.Items[0], self.searchGrid._gridType));
			}
		});
	};

	BaseGridPage.prototype.refreshAfterGlobalReplace = function()
	{
		this.searchGrid.refresh();
	}	


	BaseGridPage.prototype.dispose = function()
	{
		var self = this;
		self.$element.find(".grid-icons").off(".swipe");
		if (self.searchGrid)
		{
			self.searchGrid.dispose();
			self.searchGrid = null;
		}

		tf.pageManager.resizablePage.$leftPage.off("focus.shortcutKeys").off("blur.shortcutKeys");
		$(window).off(".toolbar");

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
