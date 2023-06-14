(function()
{
    createNamespace("TF.Page").LocationPage = LocationPage;

    function LocationPage(gridOptions)
	{
		var self = this;
		self.type = "fieldtriplocation";
		self.pageType = "fieldtriplocations";
		self.gridOptions = gridOptions;
		TF.Page.BaseGridPage.apply(self, arguments);

        self.changeStatusButton = false;
		self.copyButton = true;
		self.detailButton = true;
		self.schedulerButton = false;
		self.mapviewButton = true;
		self.massUpdateButton = true;
		self.deleteButton = true;
		self.geocodeButton = true;

		self.endpoint = tf.DataTypeHelper.getEndpoint(self.type);
		self.pageLevelViewModel = new TF.PageLevel.BasePageLevelViewModel();

		// self.gridMap = new TF.Grid.GridMap(self);

		this.geocodeTool = new TF.Grid.GeocodeTool(this);
		this.geocodingSelectionClick = this.geocodeTool.geocodingSelectionClick.bind(this.geocodeTool);
		this.ungeocodeSelectionClick = this.ungeocodeSelectionClick.bind(this);
		this.selectedRowChanged.subscribe(this.onSelectRowChanged.bind(this));
		// this.geocodingClick = this.geocodeTool.geocodingClick.bind(this.geocodeTool);

		self.subscription = tf.pageManager.resizablePage.obRightContentType.subscribe(function()
		{
			self.obShowSplitmap(tf.pageManager.resizablePage.obRightContentType() === "splitmap");
		});
	}

    LocationPage.prototype = Object.create(TF.Page.BaseGridPage.prototype);
	LocationPage.prototype.constructor = LocationPage;

    LocationPage.prototype.updateOptions = function()
	{
		var self = this;
		if (self.gridOptions)
		{
			self.options.isTemporaryFilter = self.gridOptions.isTemporaryFilter;	// FT-1231 - Transfer the flag for open specific record (on-demand) from startup options to Trip grid view
			self.options.showRecordDetails = self.gridOptions.showRecordDetails;	// FT-1231 - Transfer the flag for show details (on-demand) from startup options to Trip grid view
			self.options.fromSearch = self.gridOptions.fromSearch;
			self.options.searchFilter = self.gridOptions.searchFilter;
			self.options.filteredIds = self.gridOptions.filteredIds;
		}
		self.options.gridDefinition = tf.fieldtripLocationGridDefinition.gridDefinition();
		self.options.showOmittedCount = true;
		self.options.isGridView = true;
		self.options.url = pathCombine(tf.api.apiPrefix(), "search", self.endpoint);
		self.options.loadUserDefined = false;
		self.options.supportMobileMultipleSelect = true;

	};

	LocationPage.prototype.createGrid = function(option)
	{
		var self = this,
			shouldShowDetails = self.options.showRecordDetails;

		TF.Page.BaseGridPage.prototype.createGrid.call(self, option);

		if (shouldShowDetails)
		{
			self.openContactRecordDetailsOnInitialLoad();
		}
	};

	LocationPage.prototype.openContactRecordDetailsOnInitialLoad = function()
	{
		this.showDetailsClick();
	};

	LocationPage.prototype.updateEditable = function()
	{
		var isEditable = false;
		var isDeletable = false;
		var isAddable = false;
		var isBatchable = false;
		
		if (tf.authManager.authorizationInfo.isAdmin)
		{
			isEditable = true;
			isDeletable = true;
			isAddable = true;
			isBatchable = true;
		}
		else
		{
			isEditable = tf.authManager.isAuthorizedForDataType(this.type, "edit");
			isDeletable = tf.authManager.isAuthorizedForDataType(this.type, "delete");
			isAddable = tf.authManager.isAuthorizedForDataType(this.type, "add");
			isBatchable = tf.authManager.isAuthorizedForDataType(this.type, "batch");
		}

		// update Edit observable variables
		this.selectedItemEditable(isEditable);
		this.selectedItemsEditable(isEditable);

		// update Delete observable variable
		this.obCanDeleteRecord(isDeletable);

		// update Add observable variable
		this.obNewRequest(isAddable);

		// update Batch observable variable
		this.obCanMassUpdate(isBatchable);
	};

	LocationPage.prototype.mapIconClick = function()
	{
		console.log("Map Icon Clicked");

		var self = this, selectedId;
		const isReadOnly = !self.selectedItemEditable();
		const gridType = self.type;

		var selectedIds = self.searchGrid.getSelectedIds();
		if (!selectedIds || selectedIds.length <= 0)
		{
			// return;
		}
		selectedId = selectedIds[0];
		selectedIds.length > 1 && self.searchGrid.getSelectedIds([selectedId]);
		
		if (self.obShowSplitmap())
		{
			tf.pageManager.resizablePage.closeRightPage();
		}
		else
		{
			tf.pageManager.resizablePage.showMapView();
		}
	}

	LocationPage.prototype.globalReplaceClick = function(viewModel, e)
	{
		this._openGlobalReplaceModal();
	}

	LocationPage.prototype.geocodingClick = function(viewModel, e)
	{
		tf.contextMenuManager.showMenu(e.target, new TF.ContextMenu.TemplateContextMenu("workspace/grid/GeoCodingMenu", new TF.Grid.GridMenuViewModel(this, this.searchGrid)));
	}

	LocationPage.prototype.geocodeClick = function(gridMenuViewModel)
	{
		gridMenuViewModel.gridViewModel.geocodingSelectionClick();
	}

	LocationPage.prototype.ungeocodeClick = function(gridMenuViewModel)
	{
		const self = gridMenuViewModel.gridViewModel, selectedRecords = gridMenuViewModel.searchGrid.getSelectedRecords();
		var selected = self.searchGrid.getSelectedIds();
		return tf.modalManager.showModal(new TF.Modal.Grid.GridSelectionSettingModalViewModel(selectedRecords.length, "Ungeocode")).then(function(setting)
		{
			if (!setting)
			{
				return;
			}
			var recordIds = setting.specifyRecords == "selected" ? selected : gridMenuViewModel.searchGrid.allIds;
			return self._ungeocodeConfirm(recordIds).then(function(result)
			{
				if (result)
				{
					self._ungeocode(recordIds);
				}
			});
		});
	}

	LocationPage.prototype.newCopyClick = function()
	{
		TF.Page.BaseGridPage.prototype.newCopyClick.call(this, "Name");
	};

	LocationPage.prototype.bindButtonEvent = function()
	{
		var self = this;
		TF.Page.BaseGridPage.prototype.bindButtonEvent.call(self);
		
		self.unBindEvent(".iconbutton.copy"); // unbind the default copy event from BaseGridPage
		self.bindEvent(".iconbutton.copy", self.newCopyClick.bind(self));
	}

	LocationPage.prototype.updateRecords = function(records, successMessage)
	{
		const self = this;
		return tf.promiseAjax.patch(pathCombine(tf.api.apiPrefix(), self.endpoint),
		{
			data: records,
			paramData: { '@relationships': 'udf' }
		})
		.then(() =>
		{
			self.searchGrid.refresh();
			successMessage && tf.promiseBootbox.alert(successMessage);
		}, function(error)
		{
			return tf.promiseBootbox.alert(error.Message, "Ungeocode failed");
		});
	}

	LocationPage.prototype.ungeocodeSelectionClick = function()
	{
		var self = this;
		var recordIds = self.searchGrid.getSelectedIds();
		self._ungeocodeConfirm(recordIds).then(function(confirm)
		{
			if (confirm)
			{
				self._ungeocode(recordIds);
			}
		});
	}

	LocationPage.prototype._ungeocode = function(recordIds)
	{
		var data = [];

		recordIds.forEach(recordId => {
			data.push({ "Id": recordId, "op": "replace", "path": "/XCoord", "value": null });
			data.push({ "Id": recordId, "op": "replace", "path": "/YCoord", "value": null });				
			data.push({ "Id": recordId, "op": "replace", "path": "/GeocodeScore", "value": null });				
		});

		this.updateRecords(data, "Ungeocode success");
	}

	LocationPage.prototype._ungeocodeConfirm = function(recordIds)
	{
		return tf.promiseBootbox.yesNo(String.format('Are you sure you want to ungeocode {0} {1}?', recordIds.length, recordIds.length == 1 ? 'location' : 'locations'), "Confirmation Message");
	};

	LocationPage.prototype.onSelectRowChanged = function()
	{
		this.obGeocoded(this.searchGrid.getSelectedRecords().filter(function(item)
		{
			return item.Geocoded == 'true'
		}).length > 0);
	};

	LocationPage.prototype.dispose = function()
	{
		const self = this;
		TF.Page.BaseGridPage.prototype.dispose.apply(self);
		self.subscription && self.subscription.dispose();
	};
})();