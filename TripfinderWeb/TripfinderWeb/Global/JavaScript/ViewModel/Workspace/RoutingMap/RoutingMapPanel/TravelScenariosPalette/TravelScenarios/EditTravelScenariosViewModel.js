(function()
{
	createNamespace("TF.RoutingMap.TravelScenariosPalette").EditTravelScenariosViewModel = EditTravelScenariosViewModel;

	function EditTravelScenariosViewModel(editTravelScenariosViewModel, data, eventType)
	{
		this.element = null;
		this.travelScenarioDataModel = new TF.DataModel.TravelScenarioDataModel(data);
		this.dataModel = editTravelScenariosViewModel;
		this.editType = ko.observable(eventType);
		//copy
		this.obCopyTravelScenariosDataModels = ko.observableArray();
		this.obSelectedCopyTravelScenarios = ko.observable();
		this.obCurrentCopyTravelScenariosName = ko.computed(this.currentCopyTravelScenariosNameComputer, this);
		//validation
		this.pageLevelViewModel = new TF.PageLevel.BasePageLevelViewModel();
	}

	EditTravelScenariosViewModel.prototype.init = function(viewModel, e)
	{
		var self = this;
		self.element = $(e);
		self.initCopy().then(function()
		{
			self.initValidation();
		});
	};

	EditTravelScenariosViewModel.prototype.updateErrors = function($field, errorInfo)
	{
		var self = this;
		var errors = [];
		$.each(self.pageLevelViewModel.obValidationErrors(), function(index, item)
		{
			if ($field[0] === item.field[0])
			{
				if (item.rightMessage.indexOf(errorInfo) >= 0)
				{
					return true;
				}
			}
			errors.push(item);
		});
		self.pageLevelViewModel.obValidationErrors(errors);
	}

	EditTravelScenariosViewModel.prototype.initValidation = function()
	{
		var self = this;
		setTimeout(function()
		{
			self.$form = self.element;
			var validatorFields = {},
				isValidating = false;

			validatorFields.tsname = {
				trigger: "blur change",
				validators: {
					notEmpty: {
						message: "required"
					},
					callback: {
						message: "must be unique",
						callback: function(value, validator, $field)
						{
							if (!value)
							{
								self.updateErrors($field, "unique");
								return true;
							}
							else
							{
								self.updateErrors($field, "required");
							}
							var entity = self.travelScenarioDataModel.toData();
							var editTravelSCenario = self.dataModel.getTravelScenariosById(entity.Id);
							var result = true;
							if (editTravelSCenario && entity.Name == editTravelSCenario.Name)
							{
								return result;
							}
							else
							{
								return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase("v2"), "travelscenarios"), {
									paramData: {
										name: entity.Name
									}
								}, { overlay: false }).then(function(data)
								{
									if (data.Items.length > 0 && data.Items[0] != entity.Id)
									{
										result = false;
									}
									return result;
								});
							}

						}
					}
				}
			}
			if (self.$form.data("bootstrapValidator"))
			{
				self.$form.data("bootstrapValidator").destroy();
			}
			self.$form.bootstrapValidator({
				excluded: [':hidden', ':not(:visible)'],
				live: 'enabled',
				message: 'This value is not valid',
				fields: validatorFields
			}).on('success.field.bv', function(e, data)
			{
				if (!isValidating)
				{
					isValidating = true;
					self.pageLevelViewModel.saveValidate(data.element);
					isValidating = false;
				}
			});
			self.pageLevelViewModel.load(self.$form.data("bootstrapValidator"));
		})
	}

	/**
	* copy part
	*/
	EditTravelScenariosViewModel.prototype.initCopy = function()
	{
		var self = this;
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase("v2"), "travelscenarios"))
			.then(function(apiResponse)
			{
				var data = apiResponse.Items;
				self.obCopyTravelScenariosDataModels([new TF.DataModel.TravelScenarioDataModel({ Id: 0, Name: " " })].concat(data.map(function(item)
				{
					return new TF.DataModel.TravelScenarioDataModel(item);
				})));
				if (self.editType() == "copyandnew")
				{
					self.obSelectedCopyTravelScenarios($.extend({}, new TF.DataModel.TravelScenarioDataModel(self.travelScenarioDataModel.toData())));
					self.travelScenarioDataModel.name("");
					self.travelScenarioDataModel.id(0);
					self.travelScenarioDataModel.apiIsNew(true);
					self.travelScenarioDataModel.approve(-1);
				}
			});
	}

	EditTravelScenariosViewModel.prototype.currentCopyTravelScenariosNameComputer = function()
	{
		return this.obSelectedCopyTravelScenarios() ? this.obSelectedCopyTravelScenarios().name() : "";
	}

	/**
	* cancel or apply part
	*/
	EditTravelScenariosViewModel.prototype.cancel = function()
	{
		if (this.editType().indexOf("new") >= 0)
		{
			return tf.promiseBootbox.yesNo("Are you sure you want to cancel?", "Unsaved Changes")
				.then(result =>
				{
					if (result)
					{
						return false;
					}

					return Promise.reject();
				});
		}

		if (this.travelScenarioDataModel.apiIsDirty())
		{
			return tf.promiseBootbox.yesNo("You have unsaved changes.  Would you like to save your changes prior to canceling?", "Unsaved Changes")
				.then(result =>
				{
					if (result)
					{
						return this.apply();
					}

					return result;
				});
		}

		return Promise.resolve(false);
	}

	EditTravelScenariosViewModel.prototype.apply = function()
	{
		return this.pageLevelViewModel.saveValidate().then(result =>
		{
			if (!result)
			{
				return false;
			}

			let request, dataModel = this.travelScenarioDataModel, isNew = dataModel.id() == 0;
			this.travelScenarioDataModel.name(this.travelScenarioDataModel.name());
			if (isNew)
			{
				let data = dataModel.toData();
				if (!this.obSelectedCopyTravelScenarios())
				{
					data.Approve = 1;
				}

				request = tf.promiseAjax.post(pathCombine(tf.api.apiPrefixWithoutDatabase("v2"), "travelscenarios"), {
					data: [data]
				});
			}
			else
			{
				request = tf.promiseAjax.patch(pathCombine(tf.api.apiPrefixWithoutDatabase(), "travelscenarios"), {
					data: [
						{ "op": "replace", "path": "/Name", "value": dataModel.name() },
					],
					paramData: {
						id: dataModel.id()
					}
				});
			}

			return request.then(apiResponse =>
			{
				PubSub.publish("travel-scenario-collection-change" + this.dataModel.viewModel.routeState);
				let newTravelScenario = apiResponse.Items[0], copy = this.obSelectedCopyTravelScenarios();
				if (copy && copy.id())
				{
					let info = { copyFromScenario: this.obSelectedCopyTravelScenarios(), NewScenario: apiResponse.Items[0] };
					Promise.all([
						TF.RoutingMap.TravelScenariosPalette.StreetCurbTurnDataModel.travelScenarioCopy(info),
						TF.RoutingMap.TravelScenariosPalette.TravelRegionsDataModel.newCopyFromTravelScenario(info)
					]).then(results =>
					{
						if (results[0])
						{
							let streetModel = this.dataModel.viewModel._viewModal.mapEditingPaletteViewModel.myStreetsViewModel.dataModel;
							streetModel.changeMessage({
								type: "success",
								content: "Rebuilding Streets...",
								autoClose: false
							});
							streetModel.buildNetworkDataset()
								.then(() =>
								{
									this.dataModel.viewModel.ApproveSelectTravelScenario(newTravelScenario);
								});
						}
						else if (results[1])
						{
							this.dataModel.viewModel.ApproveSelectTravelScenario(newTravelScenario);
							let travelRegionModel = this.dataModel.viewModel._viewModal.travelScenariosPaletteViewModel.travelRegionsViewModel.dataModel;
							travelRegionModel.createMmpk();
						}
						else
						{
							this.dataModel.viewModel.changeScenarioApproveStatus(newTravelScenario.Id);
						}
					});
				}

				this.updateRecords();
				return newTravelScenario;
			});
		});
	};

	EditTravelScenariosViewModel.prototype.updateRecords = function()
	{
		var updatedRecords = [{
			Id: "",
			Type: "TravelScenario",
			Operation: ""
		}];
		return TF.RoutingMap.MapUpdatedRecordsHubHelper.prototype.updateRecords(updatedRecords, "MenuDataUpdatedHub");
	};
})();