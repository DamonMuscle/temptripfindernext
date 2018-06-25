(function()
{
	createNamespace('TF.Modal').ModifyDataEntryListItemModalViewModel = ModifyDataEntryListItemModalViewModel;

	function ModifyDataEntryListItemModalViewModel(fieldName, modelType, id)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.contentTemplate('modal/ModifyDataEntryListItemControl');
		this.buttonTemplate('modal/positivenegative');
		this.sizeCss = "modal-dialog-sm";

		var viewTitle = id ? "Edit " : "Add ", changeName;

		switch (fieldName)
		{
			case 'mailzip':
				viewTitle += tf.localization.Postal;
				if (!id)
					this.buttonTemplate('modal/positivenegativeextend');
				break;
			case 'mailcity':
				viewTitle += tf.applicationTerm.getApplicationTermSingularByName("City");
				if (!id)
					this.buttonTemplate('modal/positivenegativeextend');
				break;
			case 'makebody':
				viewTitle += "Make of Body";
				changeName = "vehiclemakeofbody";
				if (!id)
					this.buttonTemplate('modal/positivenegativeextend');
				break;
			case 'makechassis':
				viewTitle += "Make";
				changeName = "vehiclemake";
				if (!id)
					this.buttonTemplate('modal/positivenegativeextend');
				break;
			case 'model':
				viewTitle += "Model";
				changeName = "vehiclemodel";
				if (!id)
					this.buttonTemplate('modal/positivenegativeextend');
				break;
			case 'bodytype':
				viewTitle += "Body Type";
				changeName = "vehiclebodytype";
				if (!id)
					this.buttonTemplate('modal/positivenegativeextend');
				break;
			case 'braketype':
				viewTitle += "Brake Type";
				changeName = "vehiclebraketype";
				if (!id)
					this.buttonTemplate('modal/positivenegativeextend');
				break;
			case 'fueltype':
				viewTitle += "Fuel Type";
				changeName = "vehiclefueltype";
				if (!id)
					this.buttonTemplate('modal/positivenegativeextend');
				break;
			case 'category':
				viewTitle += "Category";
				changeName = "vehiclecategory";
				if (!id)
					this.buttonTemplate('modal/positivenegativeextend');
				break;
			case 'tripalias':
				viewTitle += tf.applicationTerm.getApplicationTermSingularByName("Trip Alias");
				break;
			case 'city':
				viewTitle += "Cities";
				break;
			case 'zipcode':
				viewTitle += tf.applicationTerm.getApplicationTermSingularByName("Zip") + " Codes";
				break;
			case 'fieldtriptemplate':
				viewTitle = "Save " + tf.applicationTerm.getApplicationTermSingularByName("Field Trip") + " Template";
				break;
			default:
				viewTitle += id ? "Item" : "New Item";
				break;
		}
		this.title(viewTitle);

		this._fieldName = fieldName;

		this.modifyDataEntryListItemViewModel = new TF.Control.ModifyDataEntryListItemViewModel(fieldName, modelType, id, changeName);
		this.data(this.modifyDataEntryListItemViewModel);
	}
	ModifyDataEntryListItemModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	ModifyDataEntryListItemModalViewModel.prototype.constructor = ModifyDataEntryListItemModalViewModel;

	ModifyDataEntryListItemModalViewModel.prototype.positiveClick = function()
	{
		this.modifyDataEntryListItemViewModel.apply().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};

	ModifyDataEntryListItemModalViewModel.prototype.negativeClick = function(viewModel, e)
	{
		if (this.modifyDataEntryListItemViewModel.fileText() != this.modifyDataEntryListItemViewModel.initFileText)
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
						return this.negativeClose();
					}
				}.bind(this));
		}
		this.negativeClose();
	};

	ModifyDataEntryListItemModalViewModel.prototype.saveAndNewClick = function(returnData)
	{
		this.modifyDataEntryListItemViewModel.apply().then(function(result)
		{
			if (result)
			{
				this.modifyDataEntryListItemViewModel.fileText("");
				this.newDataList.push(result);
			}
		}.bind(this));
	};

	ModifyDataEntryListItemModalViewModel.prototype.dispose = function()
	{
		this.modifyDataEntryListItemViewModel.dispose();
	};

})();


