(function()
{
	createNamespace("TF.Modal").ManageThematicsModalViewModel = ManageThematicsModalViewModel;

	function ManageThematicsModalViewModel(options)
	{
		var self = this;
		TF.Modal.BaseModalViewModel.call(self);

		const { thematicType } = options;

		self.sizeCss = "modal-dialog-lg manageThematic";
		self.modalClass = "manageThematics-modal";
		self.title("Manage Thematics");
		self.contentTemplate("Modal/Grid Map/Thematics/ManageThematics");

		if (thematicType === TF.ThematicTypeEnum.GRID)
		{
			self.buttonTemplate("modal/negative");
		}
		else
		{
			self.buttonTemplate("modal/positivenegative");
		}

		self.obPositiveButtonLabel("Apply");
		self.obNegativeButtonLabel("Close");
		self.thematicType = thematicType;
		self.showApplyThematic = thematicType === TF.ThematicTypeEnum.GRID;
		self.obApplyOnSave = ko.observable(false);

		self.manageThematicViewModel = new TF.Control.ManageThematicsViewModel(
			{
				...options,
				positiveClick: self.positiveClick
			}
		);
		self.data(self.manageThematicViewModel);

		self.manageThematicViewModel.onApplyThematicsToMap.subscribe(self.applyThematicsToMap.bind(self));
	};

	ManageThematicsModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	ManageThematicsModalViewModel.prototype.constructor = ManageThematicsModalViewModel;

	/**
	 * Handler when user clicks the positive button.
	 * @return {Promise}
	 */
	ManageThematicsModalViewModel.prototype.positiveClick = function()
	{
		var self = this;
		self.positiveClose(self.manageThematicViewModel.apply());
	};

	/**
	 * Apply thematic to map.
	 * @param {Object} thematic The thematics entity.
	 * @return {void}
	 * @param {number} id The thematics id.
	 * @param {string} name The thematics name.
	 * @return {void}
	 */
	ManageThematicsModalViewModel.prototype.applyThematicsToMap = function(e, thematic)
	{
		var self = this;
		self.positiveClose(thematic);
	};

	/**
	 * The dispose function.
	 * @returns {void}
	 */
	ManageThematicsModalViewModel.prototype.dispose = function()
	{
		var self = this;
		self.manageThematicViewModel.dispose();
	};
})();
