(function()
{
	createNamespace("TF.RoutingMap.TravelScenariosPalette").TravelScenarioManageViewModel = TravelScenarioManageViewModel;
	function TravelScenarioManageViewModel(modal, scenarioViewModel)
	{
		this.modal = modal;
		this.element = null;
		this.scenarioViewModel = scenarioViewModel;
		this.kendoGrid = null;
		this.travelScenarios = [];
		this.onUpdateRecordsChange = this.onUpdateRecordsChange.bind(this);
		this.scenarioViewModel._viewModal.onUpdateRecordsEvent.subscribe(this.onUpdateRecordsChange);
	}

	var WORK_ID = [1];
	// Approved scenario list
	var APPROVEDSCENARIOS = [];

	TravelScenarioManageViewModel.prototype.init = function(viewModel, el)
	{
		var self = this;
		self.element = $(el);
		var dataSourceGridContainer = $(el).find(".kendo-grid");
		dataSourceGridContainer.kendoGrid({
			dataSource: new kendo.data.DataSource({
				data: []
			}),
			selectable: "row",
			height: 275,
			change: function()
			{
				var selectRow = self.kendoGrid.select();
				if (selectRow.length)
				{
					self.selectRow = self.kendoGrid.dataItem(selectRow);
					self.modal.obDisableControl(false);
				}
			},
			dataBound: function()
			{
				if (!self.kendoGrid)
				{
					return;
				}
				var items = self.kendoGrid.items();
				var findSelectedRow = false;
				for (var i = 0; i < items.length; i++)
				{
					var row = $(items[i]).closest("tr");
					var dataItem = self.kendoGrid.dataItem(row);
					if (self.selectRow && !findSelectedRow && dataItem.Id == self.selectRow.Id)
					{
						self.kendoGrid.select(row);
					}
					if (!Enumerable.From(WORK_ID).Any(function(c) { return c == dataItem.ProhibitedId; })
						&& !Enumerable.From(APPROVEDSCENARIOS).Any(function(c) { return c == dataItem.Id; }))
					{
						row.find(".disable").removeClass("disable");
					}
				}
				if (!findSelectedRow)
				{
					self.modal.obDisableControl(true);
				}
			},
			columns: [
				{
					title: "Name",
					field: "Name",
				},
				{
					command: [
						{
							name: "edit",
							className: "disable",
							click: function(e)
							{
								if ($(e.target).hasClass("disable")) { return; }
								self.eventClick(e, "edit");
							}
						}, {
							className: "k-grid-copyandnew2",
							name: "copyandnew",
							click: function(e)
							{
								self.eventClick(e, "copyandnew");
							}
						}, {
							name: "delete",
							className: "disable",
							click: function(e)
							{
								if ($(e.target).hasClass("disable")) { return; }
								self.eventClick(e, "delete");
							}
						}
					],
					title: "Action",
					width: "105px",
					attributes: {
						"class": "text-center"
					}
				}
			]
		});

		dataSourceGridContainer.kendoTooltip({
			filter: "a",
			position: "top",
			content: function(e)
			{
				var tips = e.target.context.text;
				if (tips === 'copyandnew')
				{
					tips = "copy";
				}
				return tips.replace(tips[0], tips[0].toUpperCase());
			}
		});

		self.kendoGrid = dataSourceGridContainer.data("kendoGrid");

		self.refreshTravelScenario();

		var $gridContent = dataSourceGridContainer.find(".k-grid-content");
		$gridContent.css({
			"overflow-y": "auto"
		});

		$gridContent.delegate("tr", "dblclick", function()
		{
			self.apply().then(function()
			{
				self.modal.positiveClose();
			});
		});
	};

	TravelScenarioManageViewModel.prototype.refreshTravelScenario = function()
	{
		const self = this;
		tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase("v2"), "travelscenarios"))
			.then(function(apiResponse)
			{
				let data = Enumerable.From(apiResponse.Items).OrderBy(function(c) { return c.Name.toLowerCase(); }).ToArray();
				self.travelScenarios = data;
				self.kendoGrid.setDataSource(new kendo.data.DataSource({
					data: data
				}));
				self.fitHeight();
				if (data.length === 0)
				{
					self.modal.obDisableControl(true);
				}

				//refresh update status for selected travel scenario
				//fix bug RW-10988
				let selected = self.scenarioViewModel.obSelectedTravelScenarios();
				if (selected)
				{
					const selectedTravelScenario = data.filter(function(d) { return d.Id == selected.Id })[0];
					selected.Approve = selectedTravelScenario.Approve;
				}
			});
	};

	TravelScenarioManageViewModel.prototype.fitHeight = function()
	{
		var self = this;
		var $gridContent = self.element.find(".k-grid-content");
		setTimeout(function()
		{
			if ($gridContent[0].clientHeight == $gridContent[0].scrollHeight)
			{
				self.element.find(".k-grid-header").css({
					"padding-right": 0
				});
			}
		}, 10);
	};

	TravelScenarioManageViewModel.prototype.newTravelScenarioButtonClick = function(viewModel, e)
	{
		this.eventClick(e, "new");
	};

	/**
	* open scenario
	*/
	TravelScenarioManageViewModel.prototype.apply = function()
	{
		var self = this;
		return new Promise(function(resolve, reject)
		{
			var currentTarget = self.kendoGrid.dataItem(self.kendoGrid.select());
			if (currentTarget == null)
			{
				reject();
			}
			var all = this.scenarioViewModel.dataModel.travelScenarios;
			var scenario = all.filter(function(item)
			{
				return item.Id == currentTarget.Id;
			})[0];
			this.scenarioViewModel.dataModel.openTravelScenario(scenario).then(function(result)
			{
				if (result)
				{
					resolve(scenario);
				}
			});
		}.bind(this));
	};

	TravelScenarioManageViewModel.prototype.eventClick = function(e, eventType)
	{
		e.preventDefault();
		let self = this, data;
		if (eventType != "new")
		{
			data = this.kendoGrid.dataItem($(e.target).closest("tr"));
		}
		if (eventType == "delete")
		{
			if (Enumerable.From(WORK_ID).Any(function(c) { return c == data.ProhibitedId; }))
			{
				return tf.promiseBootbox.alert("Walk out travel scenario can not be deleted.");
			}
			if (this.scenarioViewModel.dataModel.getTravelScenarios().length <= 1)
			{
				return tf.promiseBootbox.alert("At least contain one travel scenario, delete failed.");
			}
			else
			{
				return TF.RoutingMap.TravelScenariosPalette.TravelScenariosDataModel.getUseInfo().then(function(locks)
				{
					if (locks.some(function(c) { return c.Id == data.Id; }))
					{
						return tf.promiseBootbox.alert({ message: "Travel scenario is currently open or being used, delete failed." });
					}

					return tf.promiseBootbox.yesNo({
						message: `Are you sure you want to delete '${data.Name}'?`,
						closeButton: true
					}, "Confirmation").then(function(ans)
					{
						if (ans)
						{
							tf.promiseAjax.delete(pathCombine(tf.api.apiPrefixWithoutDatabase("v2"), "travelscenarios", data.Id)).then(function()
							{
								self.updateRecords();
								self.scenarioViewModel.dataModel.deleteScenarioById(data.Id);
								self.refreshTravelScenario();
								PubSub.publish("travel-scenario-delete" + self.scenarioViewModel.routeState, data);
							}).catch(function(e)
							{
								return tf.promiseBootbox.alert(e.Message);
							});
						}
					});
				});
			}
		}
		else
		{
			self.showEditModal(data, eventType);
		}
	};

	TravelScenarioManageViewModel.prototype.onUpdateRecordsChange = function(e, data)
	{
		var self = this;
		if (Enumerable.From(data.UpdatedRecords).Any(function(c) { return c.Type == "TravelScenario"; }))
		{
			self.refreshTravelScenario();
		}
		if (Enumerable.From(data.UpdatedRecords).Any(function(c) { return c.Type == "UpdateVectorTileService" && c.UserId == tf.authManager.authorizationInfo.authorizationTree.userId; }))
		{
			if (data.UpdatedRecords[0].RouteState == "true")
			{
				self._showToastMessage("Update Vector Tile Basemap succeeded!", true);
				if (self.scenarioViewModel._viewModal._map.basemap.id == "my-maps")
				{
					self.scenarioViewModel._viewModal.mapLayersPaletteViewModel.allDisplaySettings.forEach(function(displaySetting)
					{
						displaySetting.loadStyle();
					});
				}
			}
			else
			{
				self._showToastMessage("Update Vector Tile Basemap failed!", false);
			}
		}
	};

	TravelScenarioManageViewModel.prototype.showEditModal = function(data, eventType)
	{
		var self = this;
		if (self.scenarioViewModel.dataModel.getTravelScenarios().length >= 10 && eventType.indexOf("new") >= 0)
		{
			return tf.promiseBootbox.alert("Total travel scenario count cannot be larger than 10.");
		}
		tf.modalManager.showModal(new TF.RoutingMap.TravelScenariosPalette.TravelScenariosModalViewModel(self.scenarioViewModel.dataModel, data, eventType)).then(function(ans)
		{
			if (ans)
			{
				self.refreshTravelScenario();
			}
		});
	};

	TravelScenarioManageViewModel.prototype._showToastMessage = function(message, success)
	{
		var self = this;
		message = {
			type: success ? "success" : "error",
			content: message,
			autoClose: false
		};
		self.scenarioViewModel._viewModal.obToastMessages.push(message);
	};

	TravelScenarioManageViewModel.prototype.updateRecords = function()
	{
		var updatedRecords = [{
			Id: "",
			Type: "TravelScenario",
			Operation: ""
		}];
		return TF.RoutingMap.MapUpdatedRecordsHubHelper.prototype.updateRecords(updatedRecords, "MenuDataUpdatedHub");
	};
})();