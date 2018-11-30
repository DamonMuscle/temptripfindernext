(function()
{
	createNamespace('TF.Modal').AddTwoFieldsModalViewModel = AddTwoFieldsModalViewModel;

	function AddTwoFieldsModalViewModel(fieldName, id)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.contentTemplate('modal/addtwofieldscontrol');
		this.buttonTemplate('modal/positivenegative');
		this.AddTwoFieldsViewModel = new TF.Control.AddTwoFieldsViewModel(fieldName, id);
		this.data(this.AddTwoFieldsViewModel);
		this.sizeCss = "modal-dialog-sm";
		var viewTitle;
		switch (fieldName)
		{
			case 'documentclassification':
				viewTitle = " Document " + tf.applicationTerm.getApplicationTermSingularByName("Classification");
				if (!id)
					this.buttonTemplate('modal/positivenegativeextend');
				break;
			default:
				viewTitle = " Two Fields";
				break;
		}

		///this is going to check if the popup form is add new records or edit an existing record
		if (id)
		{
			viewTitle = "Edit" + viewTitle;
		}
		else
		{
			viewTitle = "Add" + viewTitle;
		}

		this.title(viewTitle);
	}

	AddTwoFieldsModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);

	AddTwoFieldsModalViewModel.prototype.constructor = AddTwoFieldsModalViewModel;

	AddTwoFieldsModalViewModel.prototype.positiveClick = function()
	{
		this.AddTwoFieldsViewModel.apply().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};

	AddTwoFieldsModalViewModel.prototype.negativeClose = function(returnData)
	{
		if (this.AddTwoFieldsViewModel.obEntityDataModel().apiIsDirty())
		{
			return tf.promiseBootbox.yesNo({ message: "You have unsaved changes.  Would you like to save your changes prior to closing?", backdrop: true, title: "Unsaved Changes", closeButton: true })
				.then(function(result)
				{
					if (result == true)
					{
						return this.positiveClick();
					}
					if (result == false)
					{
						return TF.Modal.BaseModalViewModel.prototype.negativeClose.call(this, returnData);
					}
				}.bind(this));
		}
		else
		{
			TF.Modal.BaseModalViewModel.prototype.negativeClose.call(this, returnData);
		}
	};

	AddTwoFieldsModalViewModel.prototype.saveAndNewClick = function()
	{
		this.AddTwoFieldsViewModel.apply().then(function(result)
		{
			if (result)
			{
				this.AddTwoFieldsViewModel.obEntityDataModel(new this.AddTwoFieldsViewModel.entityDataModel());
				this.newDataList.push(result);
			}
		}.bind(this));
	};

	AddTwoFieldsModalViewModel.prototype.dispose = function()
	{
		this.AddTwoFieldsViewModel.dispose();
	};

})();
