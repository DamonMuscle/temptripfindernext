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

		self.approveButton = false;
		self.declineButton = false;
		self.cancelButton = false;

		self.isAdmin = tf.authManager.authorizationInfo.isAdmin || tf.authManager.authorizationInfo.isAuthorizedFor("transportationAdministrator", "edit");
		self.pageLevelViewModel = new TF.PageLevel.BasePageLevelViewModel();
	}

	BasePage.prototype.constructor = BasePage;

	BasePage.prototype.init = function(model, element)
	{

	};

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


	BasePage.prototype.closeDetailClick = function(isNotMobile)
	{
		var self = this;
		if (isNotMobile === true)
		{
			tf.pageManager.resizablePage.closeRightPage();
		} else
		{
			tf.pageManager.resizablePage.clearLeftOtherContent();
			self.detailView.dispose();
			self.detailView = null;
			self.obShowDetailPanel(false);
			if ($(".kendoscheduler").length > 0)
			{
				$(".kendoscheduler").getKendoScheduler().refresh();
			}
		}

	};

	BasePage.prototype.editClick = function(viewModel, e)
	{
		var self = this, view, selectedIds, gridVM = viewModel ? viewModel.gridViewModel : this;
		if (viewModel.gridViewModel.isGridPage)
		{
			selectedIds = self.searchGrid.getSelectedIds();
		} else
		{
			selectedIds = viewModel.gridViewModel.fieldTripId;
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
		self.obShowFieldTripDEPanel(true);
	};

	BasePage.prototype.editFieldTripStatus = function(viewModel, isApprove)
	{
		var self = this, selectedIds, selectedRecords;

		if (viewModel.isGridPage)
		{
			selectedIds = self.searchGrid.getSelectedIds();
			selectedRecords = self.searchGrid.getSelectedRecords();
		} else
		{
			if (viewModel.gridViewModel.isGridPage)
			{
				selectedIds = self.searchGrid.getSelectedIds();
				selectedRecords = self.searchGrid.getSelectedRecords();
			} else
			{
				selectedIds = viewModel.gridViewModel.fieldTripId;
				selectedRecords = viewModel.gridViewModel.fieldTripRecord;
			}

		}

		var showEditModal = function(name)
		{
			tf.modalManager.showModal(new TF.Modal.EditFieldTripStatusModalViewModel(selectedRecords, isApprove, name))
				.then(function(data)
				{
					if (data)
					{
						if (viewModel.isGridPage)
						{
							self.searchGrid.refreshClick();
						} else
						{
							if (viewModel.gridViewModel.isGridPage)
							{
								self.searchGrid.refreshClick();
							} else
							{
								if ($(".kendoscheduler").length > 0 && $(".kendoscheduler").getKendoScheduler())
								{
									self.getOriginalDataSource(self.gridType).then(function(data)
									{
										data.Items.forEach(function(item)
										{
											if (!item.EstimatedReturnDateTime)
											{
												var date = new Date(item.DepartDateTime);
												date.setDate(date.getDate() + 1);
												var month = date.getMonth() + 1;
												item.EstimatedReturnDateTime = date.getFullYear() + '-' + month + '-' + date.getDate();
											}
										});
										var dataSource = new kendo.data.SchedulerDataSource(self.getSchedulerDataSources(data));
										self.kendoSchedule.setDataSource(dataSource);
									});
								}
							}

						}
						self.pageLevelViewModel.popupSuccessMessage((isApprove ? "Approved " : "Declined ") + (selectedRecords.length > 1 ? selectedRecords.length : "")
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


	BasePage.prototype.approveClick = function(viewModel, e)
	{
		var self = this;
		self.editFieldTripStatus(viewModel, true);
	};


	BasePage.prototype.declineClick = function(viewModel, e)
	{
		var self = this;
		self.editFieldTripStatus(viewModel, false);
	};

	//TODO right click menu feature
	BasePage.prototype.copyToClipboardClick = function()
	{

	};

	//TODO right click menu feature
	BasePage.prototype.saveAsClick = function()
	{
	};

	//TODO right click menu feature
	BasePage.prototype.openSelectedClick = function()
	{
	};

	BasePage.prototype.dispose = function()
	{
		var self = this;

		self.pageLevelViewModel.dispose();
	};
})();
