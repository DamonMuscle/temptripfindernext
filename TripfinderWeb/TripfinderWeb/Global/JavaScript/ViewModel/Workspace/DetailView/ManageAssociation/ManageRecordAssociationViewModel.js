(function()
{
	createNamespace("TF.DetailView").ManageRecordAssociationViewModel = ManageRecordAssociationViewModel;

	function ManageRecordAssociationViewModel(options)
	{
		var self = this;
		self.associationType = options.associationType;
		self.recordEntity = options.recordEntity;
		self.baseRecordType = options.baseRecordType;
		self.baseRecordEntity = options.baseRecordEntity;
		self.layoutEntity = options.layoutEntity;

		self.pageLevelViewModel = new TF.PageLevel.BasePageLevelViewModel();

		self.$element = null;
		self.TAB_ENUMS = {
			SEARCH_EXISTING: 0,
			QUICK_ADD: 1
		};

		var initTabIndex = self.TAB_ENUMS.SEARCH_EXISTING;
		self.obInitializedTabs = ko.observableArray([initTabIndex]);
		self.obSelectedTabIndex = ko.observable(initTabIndex);

		// Remember tabs that have been initialized
		self.obSelectedTabIndex.subscribe(function(index)
		{
			if (self.obInitializedTabs.indexOf(index) === -1)
			{
				self.obInitializedTabs.push(index);
			}
		});

		// search existing list mover.
		self.searchExistingViewModel = new TF.DetailView.SearchExistingRecordWrapper({
			selectedData: options.selectedData,
			dataType: options.associationType,
			defaultColumns: options.defaultColumns,
			pageLevelViewModel: self.pageLevelViewModel
		});

		// quick add new record.
		var quickAddOptions = {
			dataType: self.associationType,
			baseRecordType: self.baseRecordType,
			baseRecordEntity: self.baseRecordEntity,
			layoutEntity: self.layoutEntity,
			readonlyBlockFields: options.readonlyBlockFields,
			pageLevelViewModel: self.pageLevelViewModel
		};

		self.quickAddViewModel = new TF.DetailView.GridStackQuickAddWrapper(quickAddOptions);
	};

	/**
	 * Save the object.
	 *
	 * @returns {void}
	 */
	ManageRecordAssociationViewModel.prototype.save = function()
	{
		var self = this, quickAddTask = null;

		// Check if quick add tab has been initialized.
		if (self.obInitializedTabs.indexOf(self.TAB_ENUMS.QUICK_ADD) > -1)
		{
			if (!self.quickAddViewModel.isAnyFieldsUpdated())
			{
				quickAddTask = Promise.resolve(null);
			}
			else
			{
				quickAddTask = self.quickAddViewModel.save()
					.then(function(result)
					{
						if (result)
						{
							if (result.success)
							{
								self.pageLevelViewModel.clearError();
								self.pageLevelViewModel.popupSuccessMessage("The record has been successfully created.");
								return result.associated ? result.entity : null;
							}
							else
							{
								result.messages.map(function(msg)
								{
									self.pageLevelViewModel.clearError();
									self.pageLevelViewModel.popupErrorMessage(msg);
								});
								return false;
							}
						}
					});
			}
		}

		return Promise.resolve(quickAddTask)
			.then(function(entity)
			{
				if (entity === false)
				{
					return false;
				}

				/*
				// Get search existing result
								var searchExistingResult = self.searchExistingViewModel.save();
								if (!searchExistingResult.isChanged && !entity)
								{
									return;
								}
				*/

				var selectedIds = self.searchExistingViewModel.obSelectedData(),
					saveResponse = {
						isNewRecordCreated: false,
						selectedIds: selectedIds
					};

				if (entity)
				{
					saveResponse.isNewRecordCreated = true;
					selectedIds.push(entity.Id);
				}

				return saveResponse;
			});
	};

	ManageRecordAssociationViewModel.prototype.switchTab = function(index, data, evt)
	{
		this.obSelectedTabIndex(index);
	};

	/**
	 * Dispose
	 * 
	 * @return {void}
	 */
	ManageRecordAssociationViewModel.prototype.dispose = function()
	{
		var self = this;
		self.quickAddViewModel.dispose();
		self.searchExistingViewModel.dispose();
		self.pageLevelViewModel.dispose();
	};
})();