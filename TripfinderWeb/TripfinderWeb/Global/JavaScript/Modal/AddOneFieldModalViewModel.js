(function()
{
	createNamespace('TF.Modal').AddOneFieldModalViewModel = AddOneFieldModalViewModel;

	function AddOneFieldModalViewModel(title, type, fieldName, data, modelType, callBackFunction)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.contentTemplate('modal/addonefieldcontrol');
		this.buttonTemplate('modal/positivenegative');
		this.fieldName = fieldName;
		this.modelType = modelType;
		this.callBackFunction = callBackFunction;
		this.AddOneFieldViewModel = new TF.Control.AddOneFieldViewModel(type, fieldName, data);
		this.data(this.AddOneFieldViewModel);
		this.sizeCss = "modal-dialog-sm";
		var viewTitle = title;

		///this is going to check if the popup form is add new records or edit an existing record
		if ((data.id && data.id() > 0) || type === "fieldtriptemplate")
		{
			viewTitle = "Save " + viewTitle;
		}
		else
		{
			viewTitle = "Add " + viewTitle;
			this.buttonTemplate('modal/positivenegativeextend');
		}

		this.title(viewTitle);
	}

	AddOneFieldModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);

	AddOneFieldModalViewModel.prototype.constructor = AddOneFieldModalViewModel;

	AddOneFieldModalViewModel.prototype.positiveClick = function()
	{
		this.AddOneFieldViewModel.apply().then(function(result)
		{
			if (result)
			{
				if (this.callBackFunction)
				{
					this.callBackFunction(result);
				}
				this.positiveClose(result);
			}
		}.bind(this));
	};

	AddOneFieldModalViewModel.prototype.negativeClick = function(viewModel, e)
	{
		if (this.AddOneFieldViewModel.obEntityDataModel().toData()[this.fieldName] != this.AddOneFieldViewModel.initFileText)
		{
			return tf.promiseBootbox.yesNo({ message: "You have unsaved changes.  Would you like to save your changes prior to closing?", backdrop: true, title: "Unsaved Changes", closeButton: true })
				.then(function(result)
				{
					if (result == true)
					{
						if (this.callBackFunction)
						{
							this.callBackFunction(result);
						}
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

	AddOneFieldModalViewModel.prototype.saveAndNewClick = function(returnData)
	{
		this.AddOneFieldViewModel.apply().then(function(result)
		{
			if (result)
			{
				this.AddOneFieldViewModel.obEntityDataModel(new this.modelType());
				if (this.callBackFunction)
				{
					this.callBackFunction(result);
				}
			}
		}.bind(this));
	};

	AddOneFieldModalViewModel.prototype.dispose = function()
	{
		this.AddOneFieldViewModel.dispose();
	};

})();
