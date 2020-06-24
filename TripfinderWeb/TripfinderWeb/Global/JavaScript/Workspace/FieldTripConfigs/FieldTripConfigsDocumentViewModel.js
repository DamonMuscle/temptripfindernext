(function()
{
	createNamespace("TF.Document").FieldTripConfigsDocumentViewModel = FieldTripConfigsDocumentViewModel;

	function FieldTripConfigsDocumentViewModel(documentData, documentManager)
	{
		var self = this,
			routeState = documentData.routeState,
			typeName = documentData.data.type,
			gridDefinitions = tf.FieldTripGridConfigs.gridDefinitions(),
			availableGrids = gridDefinitions.map(function(def, idx)
			{
				return {
					key: def.value,
					label: def.name,
					index: idx
				};
			});

		TF.Document.BaseDocumentViewModel.call(self, routeState, typeName);

		self.DocumentData = documentData;
		self.documentType = documentData.documentType;
		self.documentManager = documentManager;
		self.obtabName(documentData.data.tabName);
		self.gridDefinitions = gridDefinitions;
		self.obNextID = ko.observable();
		self.obRequest = ko.observable();
		self.obStrictAccount = ko.observable();
		self.obStrictDestinations = ko.observable();

		//  Properties
		self.dataHelper = tf.fieldTripConfigsDataHelper;
		self.$element = null;
		self.$gridWrapper = null;
		self.kendoGrid = null;
		self.endpoint = null;

		self.obAvailableGrids = ko.observableArray(availableGrids);
		self.obSelected = ko.observable(availableGrids[0]);
		self.obSelectedDefinition = ko.computed(function()
		{
			var def = self.gridDefinitions[self.obSelected().index];
			self.endpoint = tf.dataTypeHelper.getEndpoint(def.type);
			return def;
		});

		self.onAddBtnClick = self.onAddBtnClick.bind(self);
		self.onEditBtnClick = self.onEditBtnClick.bind(self);
		self.onDeleteBtnClick = self.onDeleteBtnClick.bind(self);
		self.onSaveBtnClick = self.onSaveBtnClick.bind(self);
		self.onNextTripIDChangedCallback = self.onNextTripIDChangedCallback.bind(self);

		self.selectedItemChanged = new TF.Events.Event();
		self.pageLevelViewModel = new TF.PageLevel.BasePageLevelViewModel();
	}

	FieldTripConfigsDocumentViewModel.prototype = Object.create(TF.Document.BaseDocumentViewModel.prototype);

	FieldTripConfigsDocumentViewModel.prototype.constructor = FieldTripConfigsDocumentViewModel;

	FieldTripConfigsDocumentViewModel.prototype.templateName = "workspace/FieldTripConfigs/Panel";

	FieldTripConfigsDocumentViewModel.prototype.getHash = function()
	{
		return "FieldTripConfigs";
	};

	/**
	 * Initialization.
	 *
	 * @param {DOM} el
	 * @param {object} data
	 */
	FieldTripConfigsDocumentViewModel.prototype.initialize = function(el, data)
	{
		var self = this;
		self.$element = $(el);
		self.$generalOptionsWrapper = self.$element.find(".general-options-wrapper:first");
		self.$gridWrapper = self.$element.find(".grid-wrapper");

		self.initGrid();
		self.initGeneralOptions();

		self.$gridWrapper.find(".bottom-caret").on("click", function(e)
		{
			var contextmenu = new TF.ContextMenu.TemplateContextMenu(
				"workspace/switchgridmenu",
				new TF.SwitchGridMenuViewModel({
					availableTypes: self.obAvailableGrids(),
					selectedItem: self.obSelected(),
					selectedItemChanged: self.selectedItemChanged,
					typeClass: "field-trip-configs"
				})
			);
			tf.contextMenuManager.showMenu(e.currentTarget, contextmenu);
		});

		self.selectedItemChanged.subscribe(function(e, value)
		{
			self.obSelected(value);
			self.initGrid();
		});

		self.dataHelper.subscribeNextTripIDChangedEvent(self.onNextTripIDChangedCallback);
	};

	/* 
	 * Initialize general options
	 */
	FieldTripConfigsDocumentViewModel.prototype.initGeneralOptions = function()
	{
		var self = this;
		self.dataHelper.getGeneralSettings().then(function(setting)
		{
			if (setting != null)
			{
				self.fieldTripGeneralSetting = setting;
				self.originalNextTripID = self.fieldTripGeneralSetting.NextTripID;
				self.obNextID(self.fieldTripGeneralSetting.NextTripID);
				self.obRequest(self.fieldTripGeneralSetting.ScheduleDaysInAdvance);
				self.obStrictAccount(self.fieldTripGeneralSetting.StrictAcctCodes);
				self.obStrictDestinations(self.fieldTripGeneralSetting.StrictDest);
			}
		})
	}

	/**
	 * Initialize a field trip config grid.
	 */
	FieldTripConfigsDocumentViewModel.prototype.initGrid = function()
	{
		var self = this,
			$container = self.$gridWrapper,
			def = self.obSelectedDefinition();

		var $grid = $container.find(".kendo-grid"),
			//count = data.length,
			columns = def.definition.Columns.slice();

		if (self.kendoGrid)
		{
			self.kendoGrid.destroy();
			$container.find(".kendo-grid").empty();
			self.kendoGrid = null;
		}

		columns.push({
			command: [{
				name: "edit",
				template: "<a class=\"k-button k-button-icontext k-grid-edit\" title=\"Edit\"><span class=\"k-icon k-edit\"></span>Edit</a>",
				click: self.onEditBtnClick.bind(self)
			},
			{
				name: "delete",
				template: "<a class=\"k-button k-button-icontext k-grid-delete\" title=\"Delete\"><span class=\"k-icon k-delete\"></span>delete</a>",
				click: self.onDeleteBtnClick.bind(self)
			}
			],
			title: "Action",
			width: "80px",
			attributes: {
				"class": "text-center"
			}

		});

		self.kendoGrid = $grid.kendoGrid({
			dataSource: {
				transport: {
					read: function(options)
					{
						self.fetchGridData()
							.then(function(records)
							{
								options.success(records)
							})
							.catch(function(err)
							{
								options.success([]);
							});
					}
				}
			},
			scrollable: true,
			sortable: true,
			selectable: "single",
			columns: columns,
			dataBound: function()
			{
				var count = this.dataSource.data().length,
					$grid = this.element,
					$footer = $grid.find(".k-grid-footer"),
					footerLabel = self._getGridFooterLabel(count);

				if ($footer.length === 0)
				{
					$footer = $("<div/>", {
						class: "k-grid-footer"
					}).appendTo($grid);
				}

				$footer.text(footerLabel);
			}
		}).data("kendoGrid");

		self.kendoGrid.element.off("dblclick").on("dblclick", ".k-grid-content table tr", function(e)
		{
			self.onEditBtnClick(e);
		});

	};

	/**
	 * fetch grid related data.
	 *
	 * @param {string} type
	 * @returns
	 */
	FieldTripConfigsDocumentViewModel.prototype.fetchGridData = function()
	{
		var self = this,
			configTypeKey = self.obSelected().key;

		return self.dataHelper.getAllConfigRecordsByType(configTypeKey);
	};

	/**
	 * Add field trip config button clicked.
	 */
	FieldTripConfigsDocumentViewModel.prototype.onAddBtnClick = function(evt)
	{
		var self = this,
			configType = self.obSelected().key;

		self.showModal(configType, null);
	};


	/**
	 * Edit field trip config button clicked.
	 */
	FieldTripConfigsDocumentViewModel.prototype.onEditBtnClick = function(evt)
	{
		var self = this,
			configType = self.obSelected().key,
			$tr = $(evt.currentTarget).closest("tr"),
			recordEntity = self.kendoGrid.dataItem($tr[0]);

		self.showModal(configType, recordEntity);
	};

	/**
	 * Save general options button clicked.
	 *
	 */
	FieldTripConfigsDocumentViewModel.prototype.onSaveBtnClick = function()
	{
		var self = this,
			oldNextTripID = self.originalNextTripID,
			newNextTripID = self.obNextID(),
			nextTripIDChanged = oldNextTripID !== newNextTripID,
			generalSettingToUpdate = {},
			verifyNextTripIDPromise;

		generalSettingToUpdate.ScheduleDaysInAdvance = self.obRequest();
		generalSettingToUpdate.StrictAcctCodes = self.obStrictAccount();
		generalSettingToUpdate.StrictDest = self.obStrictDestinations();

		if (nextTripIDChanged)
		{
			generalSettingToUpdate.NextTripID = newNextTripID;
		}

		verifyNextTripIDPromise = nextTripIDChanged ? self._verifyNextTripID(newNextTripID) : Promise.resolve(null);
		verifyNextTripIDPromise.then(function(errMsg)
		{
			self.pageLevelViewModel.clearError();

			if (!!errMsg)
			{
				self.pageLevelViewModel.popupErrorMessage(errMsg);
				return;
			}

			self.dataHelper.setGeneralSettings(generalSettingToUpdate).then(function(latestSetting)
			{
				if (!!latestSetting)
				{
					// Update NextTripID with latest setting data from Server
					var latestNextTripID = latestSetting.NextTripID;
					self.originalNextTripID = latestNextTripID;
					self.obNextID(latestNextTripID);

					self.pageLevelViewModel.popupSuccessMessage("Configurations have been saved successfully")
					PubSub.publish("fieldtripconfigchanged");
				}
			});
		});

	};

	FieldTripConfigsDocumentViewModel.prototype.showModal = function(configType, recordEntity)
	{
		var self = this;

		tf.modalManager.showModal(
			new TF.Modal.FieldTripConfigModalViewModel(configType, recordEntity)
		).then(function(response)
		{
			if (response)
			{
				self.refreshGridByType(configType);
			}
		});
	}

	/**
	 * Delete field trip config button clicked.
	 */
	FieldTripConfigsDocumentViewModel.prototype.onDeleteBtnClick = function(evt)
	{
		var self = this,
			configTypeKey = self.obSelected().key,
			configTypeName = self.obSelected().label,
			$tr = $(evt.currentTarget).closest("tr"),
			dataItem = self.kendoGrid.dataItem($tr[0]);

		// If we need to check data constraint and dependency first, we should query for associated records before try deleting
		var alertMessage = String.format("Are you sure you want to delete this {0} setting record?", configTypeName);
		return tf.promiseBootbox.confirm({
			message: alertMessage,
			title: "Confirmation",
			buttons: {
				OK: {
					label: "Yes"
				},
				Cancel: {
					label: "No"
				}
			}
		}).then(function(result)
		{
			if (result)
			{
				self.dataHelper.removeConfigRecordByType(
					configTypeKey,
					dataItem
				).then(function(recordRemoved)
				{
					if (recordRemoved)
					{
						self.refreshGridByType(configTypeKey);
					}
				});
			}
		});;

	};

	/**
	 * Refresh the data grid by data type.
	 *
	 * @param {string} type
	 */
	FieldTripConfigsDocumentViewModel.prototype.refreshGridByType = function(configType)
	{
		var self = this;

		self.kendoGrid.dataSource.read();
	};

	FieldTripConfigsDocumentViewModel.prototype._getGridFooterLabel = function(count)
	{
		var def = this.obSelectedDefinition();

		return count + " " + (count <= 1 ? def.singular : def.plural);
	};

	FieldTripConfigsDocumentViewModel.prototype._verifyNextTripID = function(nextTripID)
	{
		var self = this,
			actionUrl = pathCombine(tf.api.apiPrefix(), "FieldTrips"),
			paramData = {
				"@fields": "PublicId",
				"@sort": "PublicId|desc",
				"@take": 1
			};

		if (nextTripID === null || nextTripID === undefined || isNaN(nextTripID))
		{
			return Promise.resolve("The Next Field Trip ID must be a non-negative number.");
		}

		return tf.promiseAjax.get(
			actionUrl,
			{
				paramData: paramData
			},
			{ overlay: false }
		).then(function(res)
		{
			if (!res || !Array.isArray(res.Items) || !res.Items[0])
			{
				return null;
			}

			var maxPublicId = parseInt(res.Items[0].PublicId);
			if (isNaN(maxPublicId))
			{
				return null;
			}

			if (nextTripID <= maxPublicId)
			{
				return String.format(
					"The Next Field Trip ID entered is not valid as it is less than the minimum required value of {0}.\r\nUse of a smaller id may result in existing field trips being overwritten.",
					maxPublicId + 1
				);
			}

			return null;
		});

	}

	/**
	 * A callback function for subscribing NextTripID changes (due to some FieldTrip record changes in other places)
	 */
	FieldTripConfigsDocumentViewModel.prototype.onNextTripIDChangedCallback = function(evt, latestNextTripID)
	{
		var self = this;

		self.fieldTripGeneralSetting.NextTripID = latestNextTripID;
		self.originalNextTripID = latestNextTripID;
		self.obNextID(latestNextTripID);
	};

	FieldTripConfigsDocumentViewModel.prototype.dispose = function()
	{
		var self = this;

		self.dataHelper.unSubscribeNextTripIDChangedEvent(self.onNextTripIDChangedCallback);
		self.dataHelper = null;
		self.selectedItemChanged.unsubscribeAll();
	};
})();