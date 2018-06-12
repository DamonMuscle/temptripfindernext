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
			case 'fieldtripclassification':
				viewTitle = " " + tf.applicationTerm.getApplicationTermSingularByName("Classification");
				if (!id)
					this.buttonTemplate('modal/positivenegativeextend');
				break;
			case 'fieldtripactivity':
				viewTitle = " " + tf.applicationTerm.getApplicationTermSingularByName("Activity");
				if (!id)
					this.buttonTemplate('modal/positivenegativeextend');
				break;
			case 'fieldtripequipment':
				viewTitle = " " + tf.applicationTerm.getApplicationTermSingularByName("Equipment");
				if (!id)
					this.buttonTemplate('modal/positivenegativeextend');
				break;
			case 'fieldtripdistrictdepartment':
				viewTitle = " " + tf.applicationTerm.getApplicationTermSingularByName("District Department");
				if (!id)
					this.buttonTemplate('modal/positivenegativeextend');
				break;
			case 'documentclassification':
				viewTitle = " Document " + tf.applicationTerm.getApplicationTermSingularByName("Classification");
				if (!id)
					this.buttonTemplate('modal/positivenegativeextend');
				break;
			case 'vehiclebodytype':
				viewTitle = " " + tf.applicationTerm.getApplicationTermSingularByName("Vehicle") + " Body Type";
				if (!id)
					this.buttonTemplate('modal/positivenegativeextend');
				break;
			case 'vehiclebraketype':
				viewTitle = " " + tf.applicationTerm.getApplicationTermSingularByName("Vehicle") + " Brake Type";
				if (!id)
					this.buttonTemplate('modal/positivenegativeextend');
				break;
			case 'vehiclefueltype':
				viewTitle = " " + tf.applicationTerm.getApplicationTermSingularByName("Vehicle") + " Fuel Type";
				if (!id)
					this.buttonTemplate('modal/positivenegativeextend');
				break;
			case 'vehiclemake':
				viewTitle = " " + tf.applicationTerm.getApplicationTermSingularByName("Vehicle") + " Make";
				if (!id)
					this.buttonTemplate('modal/positivenegativeextend');
				break;
			case 'vehiclemodel':
				viewTitle = " " + tf.applicationTerm.getApplicationTermSingularByName("Vehicle") + " Model";
				if (!id)
					this.buttonTemplate('modal/positivenegativeextend');
				break;
			case 'vehiclemakeofbody':
				viewTitle = " " + tf.applicationTerm.getApplicationTermSingularByName("Vehicle") + " Make of Body";
				if (!id)
					this.buttonTemplate('modal/positivenegativeextend');
				break;
			case 'vehiclecategory':
				viewTitle = " " + tf.applicationTerm.getApplicationTermSingularByName("Vehicle") + " Category";
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
