(function()
{
	createNamespace("TF").ThematicTypeEnum =
	{
		MAP: 0,
		GRID: 1,
	};
})();

(function()
{
	createNamespace("TF.Grid").KendoGridThematicMenu = KendoGridThematicMenu;

	const THEMATIC_NAME_PLACEHOLDER = "None";
	const THEMATIC_NAME_FROMSHARE = "(Custom)";

	function KendoGridThematicMenu()
	{
		this._storageThematicDataKey = "grid.currentThematic." + this._gridType + ".id";

		this.obSelectedGridThematicId = ko.observable();
		this.obGridThematicDataModels = ko.observableArray();
		this.obSelectedGridThematicName = ko.observable();
		this.obSelectedGridThematicDataModel = ko.computed(this._selectedGridThematicDataModelComputer, this);

		this.createNewThematicClick = this.createNewThematicClick.bind(this);
		this.clearGridThematicClick = this.clearGridThematicClick.bind(this);
		this.manageGridThematicsClick = this.manageGridThematicsClick.bind(this);
		this.saveAsNewThematicClick = this.saveAsNewThematicClick.bind(this);
		this.gridThematicClick = this.gridThematicClick.bind(this);
	}

	KendoGridThematicMenu.prototype.gridThematicClick = function(thematicModel)
	{
		var self = this;
		if (thematicModel.id() !== self.obSelectedGridThematicId())
		{
			self.tempGridThematicDataModel = null;
			self.applyThematicToGrid(thematicModel.id(), true);
		}
	};

	/**
	 * Apply thematic to current grid layout.
	 *
	 * @param {Number} thematicId
	 * @param {Boolean} addToSticky open switching thematic actively would add it to sticky
	 */
	KendoGridThematicMenu.prototype.applyThematicToGrid = function(thematicId, addToSticky)
	{
		var self = this;
		self.obSelectedGridThematicId(thematicId);

		const currentLayout = self._obCurrentGridLayoutExtendedDataModel();
		if (currentLayout && currentLayout.thematicId() !== thematicId)
		{
			currentLayout.thematicId(thematicId);
			if (!thematicId)
			{
				currentLayout.thematicName('');
			}

			self._currentLayoutChange();
		}

		if (addToSticky)
		{
			tf.storageManager.save(self._storageThematicDataKey, thematicId);
		}

		// Only go through below when grid is ready.
		if (self.kendoGrid)
		{
			let newConfig = null;
			let needRefresh = false;

			if (!thematicId)
			{
				self.clearGridThematicConfigs();
				needRefresh = true;
			}
			else
			{
				const prevConfig = self.selectedGridThematicConfigs;
				const prevConfigStr = prevConfig ? JSON.stringify(prevConfig) : "";

				newConfig = self.getSelectedGridThematicConigs();
				const newConfigStr = newConfig ? JSON.stringify(newConfig) : "";

				self.applyGridThematicConfigs(newConfig);
				needRefresh = prevConfigStr !== newConfigStr;
			}

			// Refresh when thematic is changed or cleared, and when it is not during a applying layout process.
			if (needRefresh && !self._applyingLayout)
			{
				self.refresh();
			}

			self.selectedGridThematicConfigs = newConfig;
		}

	}

	KendoGridThematicMenu.prototype.thematicMenuClick = function(e, done)
	{
		tf.contextMenuManager.showMenu(e.target, new TF.ContextMenu.TemplateContextMenu("workspace/grid/thematicContextMenu", new TF.Grid.GridMenuViewModel(this, this.searchGrid), done));
	};

	KendoGridThematicMenu.prototype.createNewThematicClick = function()
	{
		var self = this;

		tf.modalManager.showModal(new TF.Modal.EditThematicConfigModalViewModel(self, true, null, self.isDetailView, TF.ThematicTypeEnum.GRID)).then(
			function(result)
			{
				if (!result)
				{
					return;
				}

				var thematicId;
				if (result.applyOnSave)
				{
					thematicId = result.Id;
				}

				if (result.Id !== 0)
				{
					self.loadGridThematic(thematicId);
				}
			});
	};

	KendoGridThematicMenu.prototype.manageGridThematicsClick = function()
	{
		var self = this;
		const manageModal = new TF.Modal.ManageThematicsModalViewModel({
			kendoGrid: self,
			selectThematic: null,
			isDetailView: false,
			thematicType: TF.ThematicTypeEnum.GRID,
		});
		const manageViewModel = manageModal.data();

		// when thematic is deleted, check current layout and available layout list.
		manageViewModel.onThematicsDeleted.subscribe((evt, thematicId) =>
		{
			const currentLayout = self._obCurrentGridLayoutExtendedDataModel();
			if (currentLayout.thematicId() === thematicId)
			{
				self.clearGridThematic();
			}

			const allLayouts = self.obGridLayoutExtendedDataModels();
			allLayouts.forEach(layout =>
			{
				if (layout.thematicId() === thematicId)
				{
					layout.thematicId(0);
					layout.thematicName("");
				}
			});
		});

		// when thematic is modified, check current layout and available layout list.
		manageViewModel.onThematicsEdited.subscribe((evt, thematicData) =>
		{
			const { Id, Name } = thematicData;
			const currentLayout = self._obCurrentGridLayoutExtendedDataModel();
			if (currentLayout.thematicId() === Id)
			{
				currentLayout.thematicName(Name);
			}

			const allLayouts = self.obGridLayoutExtendedDataModels();
			allLayouts.forEach(layout =>
			{
				if (layout.thematicId() === Id)
				{
					layout.thematicName(Name);
				}
			});

			if (thematicData.applyOnSave || self.obSelectedGridThematicId() === thematicData.Id)
			{
				self.loadGridThematic(thematicData.Id);
			}
		});

		// when new thematic is added, apply it if "Apply thematic changes upon saving" is checked
		manageViewModel.onThematicsAdded.subscribe((evt, thematicData) =>
		{
			if (thematicData && thematicData.applyOnSave && thematicData.Id)
			{
				self.loadGridThematic(thematicData.Id);
			}
		});

		tf.modalManager.showModal(manageModal).then(function(result)
		{
			if (result)
			{
				self.applyThematicToGrid(result.Id, true);
			}
		});
	}

	KendoGridThematicMenu.prototype.clearGridThematicClick = function()
	{
		this.clearGridThematic();
	};

	KendoGridThematicMenu.prototype.saveAsNewThematicClick = function()
	{
		var self = this;
		if (self.obSelectedGridThematicDataModel())
		{
			tf.modalManager.showModal(
				new TF.Modal.EditThematicConfigModalViewModel(self, true, self.obSelectedGridThematicDataModel().toData(), self.isDetailView, TF.ThematicTypeEnum.GRID)
			).then((res) =>
			{
				if (!res)
				{
					return;
				}

				var thematicId;
				if (res.applyOnSave)
				{
					thematicId = res.Id;
				}

				if (res.Id !== 0)
				{
					self.loadGridThematic(thematicId);
				}
			})
		}
		else
		{
			self.createNewThematicClick();
		}
	}

	KendoGridThematicMenu.prototype.loadGridThematic = function(thematicId)
	{
		const self = this;

		return self.getThematicList().then(() =>
		{
			// If grid link has thematic setting , use this setting and return.
			if (self.predefinedGridData && self.predefinedGridData.thematicSetting)
			{
				self.tempGridThematicDataModel = TF.DataModel.BaseDataModel.create(TF.DataModel.ThematicConfigurationDataModel, self.predefinedGridData.thematicSetting);
				self.obSelectedGridThematicName(THEMATIC_NAME_FROMSHARE);
				return;
			}

			// If thematic id is not specified, find if there is sticky thematic id
			// If still not, find if there is one in current layout.
			if (isNullObj(thematicId))
			{
				thematicId = tf.storageManager.get(this._storageThematicDataKey) || self._obCurrentGridLayoutExtendedDataModel().thematicId();
			}

			self.applyThematicToGrid(thematicId);
		});
	};

	KendoGridThematicMenu.prototype.getThematicList = function()
	{
		const self = this;
		const dataType = self.options.gridType.toLowerCase();
		const udgridId = self.options && self.options.gridData && self.options.gridData.value;

		const isDashboardWidget = this.options && this.options.customGridType === "dashboardwidget";
		const option = isDashboardWidget ? { overlay: false } : null;

		return TF.Helper.ThematicHelper.getThematicListByType(TF.ThematicTypeEnum.GRID, dataType, udgridId, option)
			.then(items =>
			{
				items = items.sort((last, now) => last.Name.toLowerCase() > now.Name.toLowerCase() ? 1 : -1);
				items.forEach(item => item.DBID = tf.datasourceManager.databaseId); // Assign dbid to be used in UI
				var gridThematicDataModels = TF.DataModel.BaseDataModel.create(TF.DataModel.ThematicConfigurationDataModel, items);
				self.obGridThematicDataModels(gridThematicDataModels);
			});
	}

	/**
	 * Get selected grid thematic model.
	 *
	 * @returns
	 */
	KendoGridThematicMenu.prototype._selectedGridThematicDataModelComputer = function()
	{
		const selectedId = this.obSelectedGridThematicId();
		const selectedThematic = this.obGridThematicDataModels().find(o => o.id() === selectedId);
		const thematicName = selectedThematic ? selectedThematic.name() : THEMATIC_NAME_PLACEHOLDER;

		this.obSelectedGridThematicName(thematicName);

		return selectedThematic;
	};

	KendoGridThematicMenu.prototype.clearGridThematic = function()
	{
		this.applyThematicToGrid(null, true);
	};

	KendoGridThematicMenu.prototype.clearGridThematicConfigs = function()
	{
		this.thematicFields = [];
		this.selectedGridThematicConfigs = null;
		this.tempGridThematicDataModel = null;
		this.obSelectedGridThematicId(null);
		this.obSelectedGridThematicName(THEMATIC_NAME_PLACEHOLDER);

		this.obIsThematicApplied(false);
	}

})()