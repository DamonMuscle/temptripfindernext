(function()
{
    createNamespace("TF.Page").ContactPage = ContactPage;

    function ContactPage(gridOptions)
	{
		var self = this;
		self.type = "contact";
		self.pageType = "contacts";
		self.gridOptions = gridOptions;
		TF.Page.BaseGridPage.apply(self, arguments);

        self.changeStatusButton = false;
		self.copyButton = true;
		self.detailButton = true;
		self.schedulerButton = false;
		self.deleteButton = true;
		self.endpoint = tf.DataTypeHelper.getEndpoint(self.type);
		self.pageLevelViewModel = new TF.PageLevel.BasePageLevelViewModel();
	}

    ContactPage.prototype = Object.create(TF.Page.BaseGridPage.prototype);
	ContactPage.prototype.constructor = ContactPage;

    ContactPage.prototype.updateOptions = function()
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
		self.options.gridDefinition = tf.contactGridDefinition.gridDefinition();
		self.options.showOmittedCount = true;
		self.options.isGridView = true;
		self.options.url = pathCombine(tf.api.apiPrefix(), "search", self.endpoint);
		self.options.loadUserDefined = false;
		self.options.supportMobileMultipleSelect = true;

	};

	ContactPage.prototype.createGrid = function(option)
	{
		var self = this,
			shouldShowDetails = self.options.showRecordDetails;

		TF.Page.BaseGridPage.prototype.createGrid.call(self, option);

		if (shouldShowDetails)
		{
			self.openContactRecordDetailsOnInitialLoad();
		}
	};

	ContactPage.prototype.openContactRecordDetailsOnInitialLoad = function()
	{
		this.showDetailsClick();
	};

	ContactPage.prototype.updateEditable = function()
	{
		var isEditable = false;
		var isDeletable = false;
		var isAddable = false;
		
		if (tf.authManager.authorizationInfo.isAdmin)
		{
			isEditable = true;
			isDeletable = true;
			isAddable = true;
		}
		else
		{
			isEditable = tf.authManager.isAuthorizedForDataType(this.type, "edit");
			isDeletable = tf.authManager.isAuthorizedForDataType(this.type, "delete");
			isAddable = tf.authManager.isAuthorizedForDataType(this.type, "add");
		}

		// update Edit observable variables
		this.selectedItemEditable(isEditable);
		this.selectedItemsEditable(isEditable);

		// update Delete observable variable
		this.obCanDeleteRecord(isDeletable);

		// update Add observable variable
		this.obNewRequest(isAddable);
	};

	ContactPage.prototype.bindButtonEvent = function()
	{
		var self = this;
		TF.Page.BaseGridPage.prototype.bindButtonEvent.call(self);
		
		self.unBindEvent(".iconbutton.copy"); // unbind the default copy event from BaseGridPage
		self.bindEvent(".iconbutton.copy", self.newCopyClick.bind(self));
	}	
})();