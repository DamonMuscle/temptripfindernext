(function()
{
	createNamespace('TF.Modal').FieldTripConfigModalViewModel = FieldTripConfigModalViewModel;

	function FieldTripConfigModalViewModel(configType, recordEntity)
	{
		var self = this;

		TF.Modal.BaseModalViewModel.call(self);
		self.applyTemplate(configType, recordEntity);
	}

	FieldTripConfigModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);

	FieldTripConfigModalViewModel.prototype.constructor = FieldTripConfigModalViewModel;

	FieldTripConfigModalViewModel.prototype.applyTemplate = function(configType, recordEntity)
	{
		var self = this,
			isEdit = recordEntity !== null,
			cfgMetadata = tf.FieldTripGridConfigs.getConfigMetadataBykey(configType),
			contentTemplate = cfgMetadata.editorContentTemplate,
			viewModelControlType = TF.Control[cfgMetadata.editorViewModelType],
			viewTitle, viewModel;

		// init Modal UI by config type
		self.sizeCss = cfgMetadata.sizeCss || "modal-dialog-lg";
		viewTitle = String.format("{0} {1}", isEdit ? "Edit" : "Add", cfgMetadata.singular);
		self.title(viewTitle);
		self.buttonTemplate("modal/positivenegative");

		// init Modal viewModel by config type
		viewModel = new viewModelControlType(configType, recordEntity);

		self.contentTemplate(contentTemplate);
		self.viewModel = viewModel;
		self.data(self.viewModel);
	}

	FieldTripConfigModalViewModel.prototype.positiveClick = function()
	{
		var self = this;

		self.viewModel.apply().then(function(result)
		{
			if (result)
			{
				self.positiveClose(result);
			}
		});
	};

	FieldTripConfigModalViewModel.prototype.negativeClick = function(returnData)
	{
		var self = this;

		self.negativeClose();
	};

	// FieldTripConfigModalViewModel.prototype.saveAndNewClick = function()
	// {
	// 	this.viewModel.apply().then(function(result)
	// 	{
	// 		if (result)
	// 		{
	// 			this.viewModel.obEntityDataModel(new TF.DataModel.FieldTripAccountDataModel());
	// 			this.newDataList.push(result);
	// 		}
	// 	}.bind(this));
	// };

	FieldTripConfigModalViewModel.prototype.dispose = function()
	{
		this.viewModel.dispose();
		this.viewModel = null;
	};

})();
