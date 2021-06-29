(function()
{
	createNamespace("TF.Page").BasePage = BasePage;

	function BasePage()
	{
		var self = this;
		self.obShowDetailPanel = ko.observable(false);
		self.obShowFieldTripDEPanel = ko.observable(false);
		self.obNewRequest = ko.observable(tf.helpers.fieldTripAuthHelper.checkFieldTripAddable());
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
				if(tf.helpers.fieldTripAuthHelper.checkFieldTripAddable())
				{
					self.obShowFieldTripDEPanel(false);
				}
				break;
			default:
				self.detailView = null;
				self.fieldTripDataEntry = null;
				if(tf.helpers.fieldTripAuthHelper.checkFieldTripAddable())
				{
					self.obShowFieldTripDEPanel(false);
				}
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
			selectedIds.length > 1 && self.searchGrid.getSelectedIds([selectedId]);
		}
		if (self.detailView && self.detailView.isReadMode() && self.obShowDetailPanel())
		{
			self.detailView.showDetailViewById(selectedId);
		}
		else
		{
			ga('send', 'event', 'Area', 'Details');
			var isReadOnly = !self.selectedItemEditable();
			self.detailView = new TF.DetailView.DetailViewViewModel(selectedId, self.pageLevelViewModel, isReadOnly, {});
			self.detailView.onCloseDetailEvent.subscribe(
				self.closeDetailClick.bind(self)
			);
			self.detailView.onEditRecordSuccess.subscribe(self.onEditRecordSuccessHandler.bind(self));
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
		var self = this,
			isReadRecordMode = self.detailView.isReadMode(),
			exitEditing = isReadRecordMode
				? self.detailView.exitEditing()
				: self.detailView.checkLayoutChangeAndClose();

		return Promise.resolve(exitEditing)
			.then(function(result)
			{
				if (result)
				{
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
						if (self.isDetailViewEdited)
						{
							self.isDetailViewEdited = false;
							self.searchGrid.refreshClick();
						}
					}
				}
			});
	};

	/**
	 * Handler when a record is successfully modified.
	 *
	 * @param {Event} e
	 * @param {Number} recordId
	 */
	BasePage.prototype.onEditRecordSuccessHandler = function(e, recordEntity)
	{
		var self = this;
		if (TF.isMobileDevice)
		{
			self.isDetailViewEdited = true;
		} else
		{
			self.searchGrid.refreshClick();
		}
		self.detailView.refresh();
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

		selectedIds.length > 1 && self.searchGrid.getSelectedIds([selectedIds[0]]);

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
		msg += selectedRecords.length > 1 ? (selectedRecords.length + " " + tf.applicationTerm.getApplicationTermPluralByName("Trips")) : selectedRecords[0].Name;

		return msg;
	};

	BasePage.prototype.showHideColumns = function(viewModel, e)
	{
		var self = this;
		self.searchGrid.addRemoveColumnClick(viewModel, e);
	};

	BasePage.prototype.copyToClipboardClick = function(viewModel, e)
	{
		var self = this, selectedIds = this.searchGrid.getSelectedIds();

		if (selectedIds.length === 0)
		{
			return Promise.resolve();
		}
		return self.searchGrid.getSelectedRecordsFromServer()
			.then(function(response)
			{
				return tf.promiseBootbox.confirm({
					message: "Data has been retrieved. Would you like to copy this to your clipboard?",
					title: "Confirmation",
					buttons: {
						OK: {
							label: "Yes"
						},
						Cancel: {
							label: "No"
						}
					}
				}).then(function(result)
				{
					if (!result) return;

					var el = document.createElement('textarea');
					el.value = TF.Helper.KendoGridHelper.getStringOfRecords(response.Items, self.searchGrid._obSelectedColumns());
					document.body.appendChild(el);
					el.select();
					document.execCommand('copy');
					document.body.removeChild(el);
				});
			});
	};

	BasePage.prototype.dateCheck = function(fieldtrips, field, newValue)
	{
		var result = $.grep(fieldtrips, function(trip)
		{
			if ("DepartDateTime" === field)
			{
				if (!trip.EstimatedReturnDateTime)
				{
					return true;
				}
				return moment(newValue) <= moment(trip.EstimatedReturnDateTime);
			}
			else if ("EstimatedReturnDateTime" === field)
			{
				if (!trip.DepartDateTime)
				{
					return true;
				}
				return moment(newValue) >= moment(trip.DepartDateTime);
			}
			else
			{
				return true;
			}
		});
		return result.map(function(item) { return item.Id });
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
			// TODO-temp
			Promise.all([
				TF.Grid.FilterHelper.clearQuickFilter(gridType),
				tf.storageManager.save("grid.currentlayout." + gridType + ".id", ''),
				tf.storageManager.save(storageFilterDataKey,
					{
						"filteredIds": selectedIds,
						"filterName": filterName
					})
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
