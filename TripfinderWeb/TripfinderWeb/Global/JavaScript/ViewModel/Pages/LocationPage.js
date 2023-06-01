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
	}

	LocationPage.prototype.globalReplaceClick = function(viewModel, e)
	{
		console.log("Global Replace Clicked", e.target);
	}

	LocationPage.prototype.geocodingClick = function(viewModel, e)
	{
		tf.contextMenuManager.showMenu(e.target, new TF.ContextMenu.TemplateContextMenu("workspace/grid/GeoCodingMenu", new TF.Grid.GridMenuViewModel(this, this.searchGrid)));
	}

	LocationPage.prototype.geocodedClick = function(searchGrid)
	{
		console.log("Geocoded Clicked",searchGrid);
	}

	LocationPage.prototype.ungeocodedClick = function(searchGrid)
	{
		console.log("Ungeocoded Clicked", searchGrid);
	}

	LocationPage.prototype.newCopyClick = function()
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
				var copyItem = $.extend(true, {}, response.Items[0],
					{
						Name: TF.Helper.NewCopyNameHelper.generateNewCopyName(response.Items[0].Name,
							this.searchGrid.kendoGrid.dataSource._data.map(function(d)
							{
								return d.Name;
							})),
						Id: 0
					});
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

	LocationPage.prototype.bindButtonEvent = function()
	{
		var self = this;
		TF.Page.BaseGridPage.prototype.bindButtonEvent.call(self);
		
		self.unBindEvent(".iconbutton.copy"); // unbind the default copy event from BaseGridPage
		self.bindEvent(".iconbutton.copy", self.newCopyClick.bind(self));
	}
})();