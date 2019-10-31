(function()
{
	createNamespace("TF.Page").BasePage = BasePage;

	function BasePage()
	{
		var self = this;
		self.obShowDetailPanel = ko.observable(false);
		self.obShowFieldTripDEPanel = ko.observable(false);
		self.detailView = null;
		self.fieldTripDataEntry = null;

		self.changeStatusButton = false;
		self.cancelButton = false;
		self.copyButton = false;

		self.isAdmin = tf.authManager.authorizationInfo.isAdmin || tf.authManager.authorizationInfo.isAuthorizedFor("transportationAdministrator", "edit");
		self.pageLevelViewModel = new TF.PageLevel.BasePageLevelViewModel();
		self.openSelectedClick = self.openSelectedClick.bind(self);
	}

	BasePage.prototype.constructor = BasePage;

	BasePage.prototype.init = function(model, element)
	{
	};

	BasePage.prototype.onCtrlSPress = function(e, keyCombination)
	{
		e.preventDefault();
		this.hideBlukMenu();
		if (this.disableShortCutKey == true)
		{
			return;
		}
		this.saveAsClick();
	};

	BasePage.prototype.onCtrlCPress = function(e, keyCombination)
	{
		e.preventDefault();
		this.hideBlukMenu();
		if (this.disableShortCutKey == true)
		{
			return;
		}
		this.copyToClipboardClick();
	};

	/**
	 * Hide bluk menu when the hot key was triggered.
	 * @returns {void} 
	 */
	BasePage.prototype.hideBlukMenu = function()
	{
		if (this.bulkMenu && !this.bulkMenu.disposed)
		{
			this.bulkMenu.$container.trigger("contextMenuClose");
		}
	}

	BasePage.prototype.clearRelatedRightPage = function(type)
	{
		var self = this;

		switch (type)
		{
			case "detailview":
				self.detailView = null;
				self.obShowDetailPanel(false);
				break;
			case "fieldtripde":
				self.fieldTripDataEntry = null;
				self.obShowFieldTripDEPanel(false);
				break;
			default:
				self.detailView = null;
				self.fieldTripDataEntry = null;
				self.obShowFieldTripDEPanel(false);
				self.obShowDetailPanel(false);
				break;
		}
	};

	BasePage.prototype.showDetails = function()
	{
		this.showDetailsClick();
	};

	BasePage.prototype.showDetailsClick = function(rowSelectedId)
	{
		var self = this, selectedId;
		if (rowSelectedId)
		{
			selectedId = rowSelectedId;
		}
		else
		{
			var selectedIds = self.searchGrid.getSelectedIds();
			if (!selectedIds || selectedIds.length <= 0)
			{
				return;
			}
			selectedId = selectedIds[0];
		}
		if (self.detailView && self.detailView.isReadMode() && self.obShowDetailPanel())
		{
			self.detailView.showDetailViewById(selectedId);
		}
		else
		{
			ga('send', 'event', 'Area', 'Details');
			self.detailView = new TF.DetailView.DetailViewViewModel(selectedId);
			self.detailView.onCloseDetailEvent.subscribe(
				self.closeDetailClick.bind(self)
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
	};

	BasePage.prototype.closeDetailClick = function(filter)
	{
		var self = this;
		if (filter === true || !TF.isMobileDevice)
		{
			tf.pageManager.resizablePage.closeRightPage();
		}
		else
		{
			self.obShowDetailPanel(false);
			tf.pageManager.resizablePage.clearLeftOtherContent();
			self.detailView.dispose();
			self.detailView = null;
			if ($(".kendoscheduler").length > 0)
			{
				$(".kendoscheduler").getKendoScheduler().refresh();
			}
		}
	};

	BasePage.prototype.editClick = function(viewModel, e)
	{
		var self = this, view, selectedIds, gridVM = viewModel ? viewModel.gridViewModel : self;
		if (gridVM.isGridPage)
		{
			selectedIds = self.searchGrid.getSelectedIds();
		} else
		{
			selectedIds = gridVM.fieldTripId;
		}

		if (selectedIds.length === 0)
		{
			return;
		}

		view = {
			id: selectedIds[0],
			documentType: "DataEntry",
			type: "fieldtrip",
		};
		self.fieldTripDataEntry = new TF.DataEntry.FieldTripDataEntryViewModel(selectedIds, view);
		tf.pageManager.resizablePage.setRightPage("workspace/dataentry/base", self.fieldTripDataEntry);
		tf.pageManager.obFieldTripEditPage(self.fieldTripDataEntry);
		self.obShowFieldTripDEPanel(true);
	};

	BasePage.prototype.getStatusChangedMessage = function(selectedRecords)
	{
		var msg = "",
			stageId = selectedRecords[0].FieldTripStageId;
		switch (stageId)
		{
			case TF.FieldTripStageEnum.level1RequestSubmitted:
				msg += "Submitted ";
				break;
			case TF.FieldTripStageEnum.level2RequestDeclined:
			case TF.FieldTripStageEnum.level3RequestDeclined:
			case TF.FieldTripStageEnum.level4RequestDeclined:
			case TF.FieldTripStageEnum.DeclinedByTransportation:
				msg += "Declined ";
				break;
			case TF.FieldTripStageEnum.level2RequestApproved:
			case TF.FieldTripStageEnum.level3RequestApproved:
			case TF.FieldTripStageEnum.level4RequestApproved:
			case TF.FieldTripStageEnum.TransportationApproved:
				msg += "Approved ";
				break;
			case TF.FieldTripStageEnum.RequestCanceled:
				msg += "Canceled ";
				break;
			case TF.FieldTripStageEnum.RequestCompleted:
				msg += "Completed ";
				break;
		}
		msg += selectedRecords.length > 1 ? (selectedRecords.length + " " + tf.applicationTerm.getApplicationTermPluralByName("Trip")) : selectedRecords[0].Name;

		return msg;
	};

	BasePage.prototype.showHideColumns = function(viewModel, e)
	{
		var self = this;
		self.searchGrid.addRemoveColumnClick(viewModel, e);
	};

	BasePage.prototype._copySelectedRecords = function(e, selectedIds)
	{
		var self = this;
		var kendoGrid = self.searchGrid;
		return kendoGrid.getIdsWithCurrentFiltering(true)
			.then(function(ids)
			{
				var gridLayoutExtendedEntity = kendoGrid._obCurrentGridLayoutExtendedDataModel().toData();
				gridLayoutExtendedEntity.LayoutColumns = kendoGrid._obSelectedColumns();

				var url = pathCombine(tf.api.apiPrefix(), "search", kendoGrid.options.gridType, "export", "copy");
				var options = {
					data:
					{
						gridLayoutExtendedEntity: gridLayoutExtendedEntity,
						selectedIds: selectedIds.length > 0 ? selectedIds : ids,
						sortItems: kendoGrid.searchOption.data.sortItems
					}
				};
				if (kendoGrid.options.gridType === "busfinderhistorical")
					self.setRequestOption(options);

				var queryPromise = tf.promiseAjax["post"](url, options);
				return queryPromise
					.then(function(data)
					{
						tf.modalManager.showModal(
							new TF.Modal.CopyDataModalViewModel(data, function()
							{
								$(".tfmodal-container").css('visibility', 'visible');
								tf.loadingIndicator.tryHide();
								$("#loadingindicator .subtitle-text").text('Loading');
							})
						)
							.then(function()
							{

							}.bind(this));

						$(".tfmodal-container").css('visibility', 'hidden');
						return Promise.resolve(true);
					}, function(data)
					{
						tf.loadingIndicator.tryHide();
						if (self.copyRetryCount >= 3)
						{
							tf.promiseBootbox.alert("Data cannot be copied.", "Alert")
								.then(function(result)
								{

								});
							return;
						}
						tf.promiseBootbox.yesNo("Data cannot be retrieved. Would you like to retry?", "Confirmation Message")
							.then(function(result)
							{
								if (result)
								{
									self.copyRetryCount = self.copyRetryCount + 1;
									self._copySelectedRecords(e, selectedIds);
								}
							});
					});
			});
	};

	BasePage.prototype.copyToClipboardClick = function(viewModel, e)
	{
		var self = this;
		self.copyRetryCount = 0;
		var selectedIds = self.searchGrid.getSelectedIds();
		if (selectedIds.length > 2000)
		{
			return self.showConfirmMessage(e, selectedIds);
		}
		else if (selectedIds.length === 0)
		{
			self.searchGrid.getIdsWithCurrentFiltering().then(function(ids)
			{
				if (ids.length > 2000)
				{
					return self.showConfirmMessage(e, selectedIds);
				}
				else if (ids.length > 0)
				{
					self._copySelectedRecords(e, selectedIds);
				}
			});
		}
		else
		{
			self._copySelectedRecords(e, selectedIds);
		}
	};

	BasePage.prototype.showConfirmMessage = function(e, selectedIds)
	{
		var self = this;
		return tf.promiseBootbox.yesNo(
			{
				message: "You have requested to Copy " + ((self.searchGrid.allIds.length === selectedIds.length || selectedIds.length === 0) ? "All" : selectedIds.length) + " records. This may take a long time to complete. To reduce the amount of time this takes, we recommend reducing the number of grid columns that you have displayed and/or the number of records that you have selected.\n\nAre you sure you would like to copy these records?",
				backdrop: true,
				title: "Confirmation Message",
				closeButton: true
			})
			.then(function(result)
			{
				if (result == true)
				{
					self._copySelectedRecords(e, selectedIds);
				}
			});
	};

	BasePage.prototype.saveAsClick = function()
	{
		var self = this, selectedIds = self.searchGrid.getSelectedIds();

		if (selectedIds.length === 0 && this.searchGrid.kendoGrid.dataSource._total > 0)
		{
			TF.Grid.LightKendoGrid.prototype.getIdsWithCurrentFiltering.call(this.searchGrid).then(function(data)
			{
				selectedIds = data;
				self.searchGrid.exportCurrentGrid(selectedIds);
			});
		}
		else
		{
			self.searchGrid.exportCurrentGrid(selectedIds);
		}
	};

	BasePage.prototype.openSelectedClick = function(viewModel, e)
	{
		var redirectWindow = window.open('', '_blank');
		redirectWindow.blur();
		this._openSelected(this.pageType, e, redirectWindow);
	};

	BasePage.prototype._openSelected = function(gridType, e, redirectWindow)
	{
		var selectedIds = this.searchGrid.getSelectedIds();
		//the filter will sticky once open a new grid, so save the sticky information in DB
		var storageFilterDataKey = "grid.currentfilter." + gridType + ".id";
		var filterName = $(e.currentTarget).find(".menu-label").text().trim() + ' (Selected Records)';
		if (selectedIds.length > 0)
		{
			Promise.all([
				TF.Grid.FilterHelper.clearQuickFilter(gridType),
				tf.storageManager.save("grid.currentlayout." + gridType + ".id", ''),
				tf.storageManager.save(storageFilterDataKey,
					{
						"filteredIds": selectedIds,
						"filterName": filterName
					}, true)
			]).then(function()
			{
				redirectWindow.location = "#/?pagetype=" + this.pageType, redirectWindow.name = "new-pageWindow_" + $.now();

			}.bind(this));
		}
		else
		{
			this.searchGrid.gridAlert.show(
				{
					message: "no data selected!"
				});
		}
	};

	BasePage.prototype.dispose = function()
	{
		var self = this;

		self.pageLevelViewModel.dispose();
	};
})();
