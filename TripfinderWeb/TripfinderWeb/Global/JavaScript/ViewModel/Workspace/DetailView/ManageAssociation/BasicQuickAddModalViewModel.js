(function ()
{
	createNamespace("TF.DetailView").BasicQuickAddModalViewModel = BasicQuickAddModalViewModel;

	function BasicQuickAddModalViewModel(options)
	{
		const self = this,
			dataType = options.dataType,
			typeName = tf.dataTypeHelper.getFormalDataTypeName(dataType),
			editModelName = options.isReadOnly ? "" : "Edit";
		let modeName = !options.recordId ? "Add" : editModelName,
			title = String.format("{0} {1}", modeName, typeName);
		self.isUDFGroup = options.isUDFGroup;
		self.isReadOnly = options.isReadOnly;
		if (options.isUDFGroup)
		{
			modeName = !options.recordEntity ? "Add" : editModelName;
			title = String.format("{0} {1} Entry", modeName, options.udGrid.Name);
			self.obFormExpiredAfterOpen = ko.observable(null);
			self.formId = options.udGrid.UDGridId;
			options.obFormExpiredAfterOpen = self.obFormExpiredAfterOpen;
			self.obFormExpiredAfterOpen.subscribe(function (expired)
			{
				self.initButtonTemplate(options.isReadOnly, expired);
			});
		}
		options.negativeClick = self.negativeClick.bind(self);
		options.negativeClose = self.negativeClose.bind(self);
		options.positiveClick = self.positiveClick.bind(self);
		const viewModel = new TF.DetailView.BasicQuickAddViewModel(options);
		TF.Modal.BaseModalViewModel.call(self);
		self.sizeCss = "modal-dialog-xl";
		self.modalClass = 'quick-add enable-tab';
		self.data(viewModel);
		self.title(title);
		self.contentTemplate("Workspace/detailview/ManageAssociation/BasicQuickAdd");
		self.initButtonTemplate(options.isReadOnly);
	}

	BasicQuickAddModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	BasicQuickAddModalViewModel.prototype.constructor = BasicQuickAddModalViewModel;
	BasicQuickAddModalViewModel.prototype.initButtonTemplate = function (readonly, formExpiredAfterOpen)
	{
		const self = this;
		if (readonly)
		{
			self.buttonTemplate("modal/positive");
			self.obPositiveButtonLabel("OK");
			if (self.isUDFGroup)
			{
				self.obPositiveButtonLabel("Close");
			}
		}
		else
		{
			self.buttonTemplate("modal/positivenegative");
			if (self.isUDFGroup)
			{
				self.obPositiveButtonLabel("Submit");
				if (formExpiredAfterOpen)
				{
					self.obDisableControl(true);
				}
			}
			else
			{
				self.obPositiveButtonLabel("Save & Close");
			}
		}
	}

	/**
	 * React when the positive button is clicked.
	 * @return {void}
	 */
	BasicQuickAddModalViewModel.prototype.positiveClick = function ()
	{
		var self = this;
		if (self.isReadOnly)
		{
			self.negativeClose();
		}
		else
		{
			self.data().save().then(function (result)
			{
				if (result)
				{
					self.positiveClose(result);
				}
				else if (result !== false)
				{
					self.negativeClose();
				}
			});
		}
	};

	/**
	 * React when the negative button is clicked.
	 * @return {void}
	 */
	BasicQuickAddModalViewModel.prototype.negativeClick = function ()
	{
		var self = this;
		if (self.data().cancel && self.data().quickAddViewModel && self.data().quickAddViewModel.cancel)
		{
			self.data().cancel().then(preventCancel =>
			{
				!preventCancel && self.negativeClose();
			});
		}
		else
		{
			this.negativeClose();
		}
	};

	/**
	 * Dispose
	 * @return {void}
	 */
	BasicQuickAddModalViewModel.prototype.dispose = function ()
	{
		this.data().dispose();
	};
})();
