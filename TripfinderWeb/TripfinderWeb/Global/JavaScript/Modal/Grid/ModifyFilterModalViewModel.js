(function()
{
	createNamespace("TF.Modal.Grid").ModifyFilterModalViewModel = ModifyFilterModalViewModel;

	function ModifyFilterModalViewModel(gridType, isNew, gridFilterDataModel, headerFilters, gridMetadata, omittedRecordIds, options, searchFilter)
	{
		TF.Modal.BaseModalViewModel.call(this);

		this.description("Enter the filter statement in the area below.  You may use the Field, Operator, Value and Logical fields to help you build your statement.  To add a Field Operator, Value or Logical value to your statement, place your cusor in your statement where you would like the value added.  Then select or enter a value.  The value will be added where your cursor was placed.");

		if (TF.isPhoneDevice)
		{
			this.sizeCss = "modal-fullscreen";
			this.modalClass = "mobile-modal-grid-modal";
			this.contentTemplate("workspace/grid/SaveFilterMobile");
			this.optionType = isNew;
			$("#pageMenu .show-menu-button").css("z-index", "1");
			options = options || {};
			options.title = this._getTitle(isNew, options);
			this.modifyFilterViewModel = new TF.Grid.ModifyFilterViewMobileModel(gridType, isNew, gridFilterDataModel, headerFilters, gridMetadata, omittedRecordIds, options, searchFilter);
			this.data(this.modifyFilterViewModel);
		}
		else
		{
			this.sizeCss = "modal-dialog-lg";
			this.modalClass = 'savefilter-modal';
			this.optionType = isNew;
			this.title(this._getTitle(isNew, options));
			this.contentTemplate('workspace/grid/savefilter');

			if (isNew !== "view")
			{
				this.buttonTemplate('modal/positivenegative');
				this.obPositiveButtonLabel = ko.observable("Save");
			}
			else
			{
				this.buttonTemplate('modal/positive');
				this.obPositiveButtonLabel = ko.observable("Close");
			}

			this.modifyFilterViewModel = new TF.Grid.ModifyFilterViewModel(gridType, isNew, gridFilterDataModel, headerFilters, gridMetadata, omittedRecordIds, options, searchFilter);
			this.data(this.modifyFilterViewModel);
		}
	}

	ModifyFilterModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	ModifyFilterModalViewModel.prototype.constructor = ModifyFilterModalViewModel;

	ModifyFilterModalViewModel.prototype._getTitle = function(isNew, options)
	{
		var title = 'Save Filter';

		if (isNew === "new")
		{
			if (!options || !options.title)
				title = 'Save As New Filter';
			else
				title = options.title;
		}
		else if (isNew === "view")
		{
			title = 'View Filter';
		}
		else if (isNew === "edit")
		{
			title = 'Edit Filter';
		}
		else
		{
			title = 'Save Filter';
		}

		if (TF.isPhoneDevice)
			title = title.toUpperCase();

		return title;
	};

	ModifyFilterModalViewModel.prototype.positiveClick = function(viewModel, e)
	{
		if (this.optionType === 'view')
		{
			this.negativeClick();
			return;
		}
		
		this.modifyFilterViewModel.apply().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this))
			.catch(function(e)
			{
				//do nothing, to prevent Uncaught error message on console.
			})
	};

	ModifyFilterModalViewModel.prototype.negativeClick = function()
	{
		if (this.optionType !== "edit")
		{
			return this.negativeClose(false);
		}
		this.modifyFilterViewModel.cancel().then(function(result)
		{
			if (result)
			{
				this.positiveClick();
			}
			else if (result === false)
			{
				this.negativeClose(false);
			}
		}.bind(this));
	};

	ModifyFilterModalViewModel.prototype.dispose = function()
	{
		this.modifyFilterViewModel.dispose();
	};
})();
