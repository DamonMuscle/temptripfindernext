(function()
{
	createNamespace("TF.Modal").EditThematicConfigModalViewModel = EditThematicConfigModalViewModel;

	function EditThematicConfigModalViewModel(grid, isNew, thematicsEntity, isDetailView, thematicType)
	{
		var self = this;

		TF.Modal.BaseModalViewModel.call(self);

		if (!thematicsEntity)
		{
			self.focusInFirstElement = false;
		}
		self.thematicsEntity = thematicsEntity;
		self.thematicType = thematicType;
		self.sizeCss = "modal-dialog-lg";
		self.modalClass = "editThematic-modal";
		self.optionType = isNew;
		self.title(self.getTitle(isNew, grid._gridType));
		self.contentTemplate("Modal/Grid Map/Thematics/EditThematicConfig");
		self.buttonTemplate("modal/positivenegativeother");
		self.obPositiveButtonLabel(isNew ? "Save" : "Save Changes");
		self.obNegativeButtonLabel("Close");
		if (!isDetailView && thematicType !== TF.ThematicTypeEnum.GRID)
		{
			self.obOtherButtonLabel("Apply without Saving");
		}
		else
		{
			self.obOtherButtonLabel("");
		}
		self.editThematicConfigViewModel = new TF.Control.EditThematicConfigViewModel(grid, isNew, thematicsEntity, self.shortCutKeyHashMapKeyName, isDetailView, thematicType);
		self.data(self.editThematicConfigViewModel);
	}

	EditThematicConfigModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	EditThematicConfigModalViewModel.prototype.constructor = EditThematicConfigModalViewModel;

	/**
	 * Create a proper title for the modal.
	 * @param {bool} isNew Whether this modal is to create new entity.
	 * @param {string} dataType The data type of the grid where this modal is opened.
	 * @returns {string} The formatted modal title.
	 */
	EditThematicConfigModalViewModel.prototype.getTitle = function(isNew, dataType)
	{
		var self = this;
		if (!isNew && self.thematicsEntity && self.thematicsEntity.Id !== 0)
		{
			return "Edit " + self.thematicsEntity.Name;
		}
		else
		{
			let typeName = "";
			switch (self.thematicType)
			{
				case TF.ThematicTypeEnum.GRID:
					typeName = "Grid";
					break;
				default:
					typeName = tf.dataTypeHelper.getDisplayNameByDataType(dataType);
					typeName = tf.applicationTerm.getApplicationTermSingularByName(typeName);
					break;
			}

			return `New ${typeName} Thematic`;
		}
	};

	/**
	 * The event handler for clicking on the positive button.
	 * @param {object} viewModel The viewModel of this modal.
	 * @param {event} e The click event.
	 * @returns {void}
	 */
	EditThematicConfigModalViewModel.prototype.positiveClick = function(viewModel, e)
	{
		var self = this;
		self.data().apply().then(function(result)
		{
			if (!result)
			{
				return;
			}

			if (self.editThematicConfigViewModel.obApplyOnSave)
			{
				result.applyOnSave = self.editThematicConfigViewModel.obApplyOnSave();
			}

			self.positiveClose(result);
		});
	};

	/**
	 * The event handler for clicking on the negative button.
	 * @param {object} viewModel The viewModel of this modal.
	 * @param {event} e The click event.
	 * @returns {void}
	 */
	EditThematicConfigModalViewModel.prototype.negativeClick = function()
	{
		var self = this;
		self.data().cancel(self.optionType).then(function(result)
		{
			if (result)
			{
				self.positiveClose(result);
			} else if (result === false)
			{
				self.negativeClose(false);
			}
		}.bind(self));
	};

	/**
	 * The event handler for clicking on the third button.
	 * @param {object} viewModel The viewModel of this modal.
	 * @param {event} e The click event.
	 * @returns {void}
	 */
	EditThematicConfigModalViewModel.prototype.otherClick = function()
	{
		this.applyWithoutSaving();
	};

	/**
	 * Apply the thematic without saving it.
	 * @return {void}
	 */
	EditThematicConfigModalViewModel.prototype.applyWithoutSaving = function()
	{
		var self = this;
		tf.shortCutKeys.power(true);
		self.data().getTempEntityData().then(function(result)
		{
			if (result)
			{
				self.positiveClose(result);
				tf.shortCutKeys.power(false);
			}
		});
	};

	/**
	 * Reset the display settings in the grid to default. 
	 * This feature is not currently in use but the code is required to be left. See commnets on JIRA VIEW-1928.
	 * @returns {void}
	 */
	EditThematicConfigModalViewModel.prototype.resetDisplay = function()
	{
		this.editThematicConfigViewModel.thematicGridReset();
	};

	/**
	 * The dispose function.
	 * @returns {void}
	 */
	EditThematicConfigModalViewModel.prototype.dispose = function()
	{
		var self = this;
		self.data().dispose();
		tfdispose(self);
	};

})();