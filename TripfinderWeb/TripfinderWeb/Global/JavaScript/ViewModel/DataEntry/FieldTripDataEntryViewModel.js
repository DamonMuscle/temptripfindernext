(function()
{
	var namespace = createNamespace("TF.DataEntry");

	namespace.FieldTripDataEntryViewModel = FieldTripDataEntryViewModel;

	function FieldTripDataEntryViewModel(ids, view)
	{
		$.extend(this, new TF.Helper.FieldTripResourcesHelper());

		this.pageLevelViewModel = new TF.PageLevel.FieldTripDataEntryPageLevelViewModel(this);
		namespace.BaseDataEntryViewModel.call(this, ids, view);

		this.initializationFrontdesk = new TF.InitializationFrontdesk(1, this.initialize);
		this.dataModelType = TF.DataModel.FieldTripDataModel;
		this.pageType = "fieldtripde";
		this.obTitle(tf.applicationTerm.getApplicationTermSingularByName("Field Trip"));
		this.obgridTitle("FieldTrip");
		this.dataEntryTemplateName = "workspace/dataentry/fieldtrip/form";
		this.obRequiredFields = ko.observable(new TF.DataModel.FieldTripDataModel());
		this.obEntityDataModel(new TF.DataModel.FieldTripDataModel());
		this.obDepartureAndReturnDateTime = ko.observable();
		this.obDuration = ko.observable();
		this.onAuditType = ko.observable();
		this.obTemplateSource = ko.observableArray();
		this.obSchoolDataModels = ko.observableArray();
		this.obDepartmentDataModels = ko.observableArray();
		this.obActivityDataModels = ko.observableArray();
		this.obClassificationDataModels = ko.observableArray();
		this.obEquipmentDataModels = ko.observableArray();
		this.obDestinationDataModels = ko.observableArray();
		this.obBillingClassificationDataModels = ko.observableArray();
		this.obFieldTripResourceGroupData = ko.observableArray();

		this.obVehicleGridViewModel = ko.observable(null);
		this.obDriversGridViewModel = ko.observable(null);
		this.obBusAideGridViewModel = ko.observable(null);
		this.obVehicleGridSource = ko.observableArray(null);
		this.obDriversGridSource = ko.observableArray(null);
		this.obBusAideGridSource = ko.observableArray(null);
		this.obInvoicingGridViewModel = ko.observable(null);
		this.obResourcesGridViewModel = ko.observable(null);
		this.obInvoiceResourceId = ko.observable(1);
		this.obInvoiceGridDataSource = ko.observableArray();

		this.baseDeletion = new TF.Executor.FieldtripDeletion();
		this.obNeedSaveTemplate(true);
		this.obNeedSaveAndClose(!TF.isPhoneDevice);
		this.obResourceId = ko.observable(0);

		//drop down list
		this.obSelectedTemplateSource = ko.observable();
		this.obTemplateName = ko.observable("None");
		this.obTemplateName.subscribe(this.templateClick, this);

		this.obSelectedSchool = ko.observable();
		this.obSelectedSchool.subscribe(this.setSelectValue("school", "obSelectedSchool", function(obj) { return obj ? obj.SchoolCode : ""; }), this);
		this.obCurrentSchoolName = ko.computed(this.setSelectTextComputer("obSchoolDataModels", "school", function(obj) { return obj.SchoolCode; }, function(obj) { return obj.Name; }), this);

		this.obSelectedDepartment = ko.observable();
		this.obSelectedDepartment.subscribe(this.setSelectValue("districtDepartmentId", "obSelectedDepartment", function(obj) { return obj ? obj.Id : 0; }), this);
		this.obCurrentDepartmentName = ko.computed(this.setSelectTextComputer("obDepartmentDataModels", "districtDepartmentId", function(obj) { return obj.Id; }, function(obj) { return obj.Name; }), this);

		this.obSelectedActivity = ko.observable();
		this.obSelectedActivity.subscribe(this.setSelectValue("fieldTripActivityId", "obSelectedActivity", function(obj) { return obj ? obj.Id : 0; }), this);
		this.obCurrentActivityName = ko.computed(this.setSelectTextComputer("obActivityDataModels", "fieldTripActivityId", function(obj) { return obj.Id; }, function(obj) { return obj.Name; }), this);

		this.obSelectedClassification = ko.observable();
		this.obSelectedClassification.subscribe(this.setSelectValue("fieldTripClassificationId", "obSelectedClassification", function(obj) { return obj ? obj.Id : 0; }), this);
		this.obCurrentClassificationName = ko.computed(this.setSelectTextComputer("obClassificationDataModels", "fieldTripClassificationId", function(obj) { return obj.Id; }, function(obj) { return obj.Name; }), this);

		this.obSelectedEquipment = ko.observable();
		this.obSelectedEquipment.subscribe(this.setSelectValue("fieldTripEquipmentId", "obSelectedEquipment", function(obj) { return obj ? obj.Id : 0; }), this);
		this.obCurrentEquipmentName = ko.computed(this.setSelectTextComputer("obEquipmentDataModels", "fieldTripEquipmentId", function(obj) { return obj.Id; }, function(obj) { return obj.EquipmentName; }), this);

		this.obSelectedDestination = ko.observable();
		this.obSelectedDestination.subscribe(
			this.setSelectValue("destination", "obSelectedDestination", function(obj)
			{
				return obj ? obj.Name : 0;
			}), this);
		this.obCurrentDestinationName = ko.computed(this.setSelectTextComputer("obDestinationDataModels", "destination", function(obj) { return obj.Name; }, function(obj) { return obj.Name; }), this);
		this.obSelectedDestination.subscribe(function()
		{
			this._fieldsUpdateFromModal("destination", this.obSelectedDestination());
		}.bind(this));

		this.obSelectedDepartFromSchool = ko.observable();
		this.obSelectedDepartFromSchool.subscribe(this.setSelectValue("departFromSchool", "obSelectedDepartFromSchool", function(obj) { return obj ? obj.SchoolCode : ""; }), this);
		this.obCurrentDepartFromSchoolName = ko.computed(this.setSelectTextComputer("obSchoolDataModels", "departFromSchool", function(obj) { return obj.SchoolCode; }, function(obj) { return obj.Name; }), this);

		this.obSelectedBillingClassification = ko.observable();
		this.obSelectedBillingClassification.subscribe(this.setSelectValue("billingClassificationId", "obSelectedBillingClassification", function(obj) { return obj ? obj.Id : 0; }), this);
		this.obSelectedBillingClassification.subscribe(function()
		{
			this._fieldsUpdateFromModal("billingClassification", this.obSelectedBillingClassification());
		}, this);
		this.obCurrentBillingClassificationName = ko.computed(this.setSelectTextComputer("obBillingClassificationDataModels", "billingClassificationId", function(obj) { return obj.Id; },
			function(obj) { return obj.Name; }), this);

		this.dataChangeReceive = this.dataChangeReceive.bind(this);
		PubSub.subscribe(topicCombine(pb.DATA_CHANGE, "school"), this.dataChangeReceive);

		this.obMailCityDataModels = ko.observableArray();
		this.obMailZipDataModels = ko.observableArray();

		ko.computed(function()
		{
			this.obEntityDataModel().returnDate(this.obEntityDataModel().departDate());
		}.bind(this));

		this.obDepartTimeDisable = ko.computed(function()
		{
			return !(this.obEntityDataModel().departDate());
		}.bind(this));
		this.obReturnTimeDisable = ko.computed(function()
		{
			return !(this.obEntityDataModel().returnDate());
		}.bind(this));

		this.resetEmpty = function(m, collection, key)
		{
			var inputValue = m.currentTarget.value;
			if (collection.indexOf(inputValue) == -1)
			{
				$(m.currentTarget).val('');
				this.obEntityDataModel()[key]('');
			}
		}.bind(this);

		this.schoolDisable = function() { return this.obCurrentSchoolName() == ''; };

		this.schoolCss = function() { return this.schoolDisable() ? this.opacityCssSource.disable : this.opacityCssSource.enable; };

		this.schoolOnBlur = function(e, m)
		{
			var collection = this.getCollection(this.obSchoolDataModels(), 'Name');
			this.resetEmpty(m, collection, 'school');
		}.bind(this);

		this.departmentDisable = function() { return this.obCurrentDepartmentName() == ''; };

		this.departmentCss = function() { return this.departmentDisable() ? this.opacityCssSource.disable : this.opacityCssSource.enable; };

		this.departmentOnBlur = function(e, m)
		{
			var collection = this.getCollection(this.obDepartmentDataModels(), 'Name');
			this.resetEmpty(m, collection, 'districtDepartmentId');
		}.bind(this);

		this.activityDisable = function() { return this.obCurrentActivityName() == ''; };

		this.activityCss = function() { return this.activityDisable() ? this.opacityCssSource.disable : this.opacityCssSource.enable; };

		this.activityOnBlur = function(e, m)
		{
			var collection = this.getCollection(this.obActivityDataModels(), 'Name');
			this.resetEmpty(m, collection, 'fieldTripActivityId');
		}.bind(this);

		this.classificationDisable = function() { return this.obCurrentClassificationName() == ''; };

		this.classificationCss = function() { return this.classificationDisable() ? this.opacityCssSource.disable : this.opacityCssSource.enable; };

		this.classificationOnBlur = function(e, m)
		{
			var collection = this.getCollection(this.obClassificationDataModels(), 'Name');
			this.resetEmpty(m, collection, 'fieldTripClassificationId');
		}.bind(this);

		this.equipmentDisable = function() { return this.obCurrentEquipmentName() == ''; };

		this.equipmentCss = function() { return this.equipmentDisable() ? this.opacityCssSource.disable : this.opacityCssSource.enable; };

		this.equipmentOnBlur = function(e, m)
		{
			var collection = this.getCollection(this.obEquipmentDataModels(), 'EquipmentName');
			this.resetEmpty(m, collection, 'fieldTripEquipmentId');
		}.bind(this);

		this.destinationDisable = function() { return this.obCurrentDestinationName() == ''; };

		this.destinationCss = function() { return this.destinationDisable() ? this.opacityCssSource.disable : this.opacityCssSource.enable; };

		this.destinationOnBlur = function(e, m)
		{
			var collection = this.getCollection(this.obDestinationDataModels(), 'Name');
			this.resetEmpty(m, collection, 'destination');
		}.bind(this);

		this.cityDisable = function() { return this.obEntityDataModel().destinationCity() == ''; };

		this.cityCss = function() { return this.cityDisable() ? this.opacityCssSource.disable : this.opacityCssSource.enable; };

		this.cityOnBlur = function(e, m)
		{
			var collection = this.getCollection(this.obMailCityDataModels(), 'Item');
			this.resetEmpty(m, collection, 'destinationCity');

		}.bind(this);

		this.zipCodeDisable = function() { return this.obEntityDataModel().destinationZip() == ''; };

		this.zipCodeCss = function() { return this.zipCodeDisable() ? this.opacityCssSource.disable : this.opacityCssSource.enable; };

		this.zipCodeOnBlur = function(e, m)
		{
			var collection = this.getCollection(this.obMailZipDataModels(), 'Item');
			this.resetEmpty(m, collection, 'destinationZip');
		}.bind(this);


		this.billingClassificationDisable = function() { return this.obCurrentBillingClassificationName() == ''; };

		this.billingClassificationCss = function() { return this.billingClassificationDisable() ? this.opacityCssSource.disable : this.opacityCssSource.enable; };

		this.billingClassificationOnBlur = function(e, m)
		{
			var collection = this.getCollection(this.obBillingClassificationDataModels(), 'Name');
			this.resetEmpty(m, collection, 'billingClassificationId');
		}.bind(this);

		this.stageCss = function() { return this.obEntityDataModel().id() ? this.opacityCssSource.enable : this.opacityCssSource.disable; };

	};

	FieldTripDataEntryViewModel.prototype = Object.create(namespace.BaseDataEntryViewModel.prototype);

	FieldTripDataEntryViewModel.prototype.constructor = FieldTripDataEntryViewModel;

	FieldTripDataEntryViewModel.prototype.dataChangeReceive = function(changeName)
	{
		this.loadSupplement();
	};

	FieldTripDataEntryViewModel.prototype.loadSupplement = function()
	{
		var self = this, p0 = p1 = p2 = p3 = p4 = p5 = p6 = p7 = p8 = p9 = p10 = fieldtripData = null;
		tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "fieldtrip", "predata"))
			.then(function(data)
			{
				fieldtripData = data.Items[0];
				p0 = self.getTemplate(fieldtripData.FieldTripTemplate);
				p1 = self.obSchoolDataModels(fieldtripData.School);
				p2 = self.obDepartmentDataModels(fieldtripData.FieldTripDistrictDepartment);
				p3 = self.obActivityDataModels(fieldtripData.FieldTripActivity);
				p4 = self.obClassificationDataModels(fieldtripData.FieldTripClassification);
				p5 = self.obEquipmentDataModels(fieldtripData.FieldTripEquipment);
				p6 = self.obDestinationDataModels(fieldtripData.FieldTripDestination);
				p7 = self.obBillingClassificationDataModels(fieldtripData.FieldTripBillingClassification);
				p8 = self.ConvertToJson(fieldtripData.RequiredField);
				p9 = self.obMailCityDataModels(fieldtripData.MailCity);
				p10 = self.obMailZipDataModels(fieldtripData.MailZip);
			});
		return Promise.all([p0, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10]);
	};

	FieldTripDataEntryViewModel.prototype.getTemplate = function(data)
	{
		var self = this;
		data = data.sort(function(a, b)
		{
			if (a.Name.toUpperCase() === b.Name.toUpperCase())
			{
				return 0;
			}
			return a.Name.toUpperCase() > b.Name.toUpperCase() ? 1 : -1;
		});
		data.unshift({ Name: "None", Id: 0 });
		self.obTemplateSource(data);
	}
	FieldTripDataEntryViewModel.prototype.load = function()
	{
		this.$form.find("input[name='name']").focus();

		if (this.obIds() == null)
		{
			return;
		}

		var id = this._view.id;
		//PubSub.subscribe(topicCombine(pb.DATA_CHANGE, "FieldTrip", "Invoice"), this.loadInvoicing.bind(this));

		return namespace.BaseDataEntryViewModel.prototype.load.call(this)
			.then(function()
			{
				if (this.obMode() === "Edit")
				{
					if (this.obEntityDataModel().departDateTime() == "1900-01-01T00:00:00.000" ||
						this.obEntityDataModel().estimatedReturnDateTime() == "1900-01-01T00:00:00.000" ||
						this.obEntityDataModel().departDateTime() == null ||
						this.obEntityDataModel().estimatedReturnDateTime() == null)
					{
						this.obDepartureAndReturnDateTime("");
						this.obDuration("");
					}
					else if (moment(this.obEntityDataModel().departDateTime()).format("L") === moment(this.obEntityDataModel().estimatedReturnDateTime()).format("L"))
					{
						this.obDepartureAndReturnDateTime(moment(this.obEntityDataModel().departDateTime()).format("L") + " " + moment(this.obEntityDataModel().departDateTime()).format("LT") + "-" + moment(this.obEntityDataModel().estimatedReturnDateTime()).format("LT"));
						this.obDuration(this.calculateDateTimeDiff("day"));
					}
					else
					{
						this.obDepartureAndReturnDateTime(moment(this.obEntityDataModel().departDateTime()).format("L LT") + "-" + moment(this.obEntityDataModel().estimatedReturnDateTime()).format("L LT"));
						this.obDuration(this.calculateDateTimeDiff("day"));
					}

					this.obEntityDataModel().updateClone(this.obEntityDataModel());
					this.obEntityDataModel().updateEntityBackup();
				}
				else
				{
					this.obEntityDataModel().fieldTripStageId(1);
					this.obEntityDataModel().updateClone(this.obEntityDataModel());
					this.obEntityDataModel().updateEntityBackup();
				}
				this.loadInvoicing();
				this.loadResources();

				this.obEntityDataModel().apiIsDirty(false);
				//reset the shortCutKeys golbal used
				tf.shortCutKeys.resetUsingGolbal(5);
				return true;


			}.bind(this)).catch(function(response)
			{//no need to do anything.

			}.bind(this));

	};

	FieldTripDataEntryViewModel.prototype.feedingSchoolNameFormatter = function(schoolDataModel)
	{
		return schoolDataModel.name() + " (" + schoolDataModel.schoolCode() + ")";
	};

	function convertDateTimeStringToTimeString(time)
	{
		if (time)
		{
			return moment(time).format("LT");
		}
		return "";
	}


	FieldTripDataEntryViewModel.prototype.validationInitialize = function()
	{
		namespace.BaseDataEntryViewModel.prototype.validationInitialize.call(this);
	};

	FieldTripDataEntryViewModel.prototype.dispose = function()
	{
		PubSub.unsubscribe(this.dataChangeReceive);
		return namespace.BaseDataEntryViewModel.prototype.dispose.call(this);
	}

	FieldTripDataEntryViewModel.prototype.calculateDateTimeDiff = function(diffType)
	{
		var departDateTime = new Date(moment(this.obEntityDataModel().departDateTime()).format("L LT"));
		var estimatedReturnDateTime = new Date(moment(this.obEntityDataModel().estimatedReturnDateTime()).format("L LT"));
		var divNum = 1;
		var diff = 0;

		var daydivNum = 1000 * 3600 * 24;
		var hourdivNum = 1000 * 3600;
		var minutedivNum = 1000 * 60;

		var total = (estimatedReturnDateTime.getTime() - departDateTime.getTime());

		if (isNaN(total))
		{
			total = 0;
		}

		diff = parseFloat(total / daydivNum);
		var day = Math.floor(diff);

		total = total - day * daydivNum;
		diff = parseFloat(total / hourdivNum);
		var hour = Math.floor(diff);

		total = total - hour * hourdivNum;
		diff = parseFloat(total / minutedivNum);
		var minutes = Math.floor(diff);

		return day + " days, " + hour + " hours, and " + minutes + " mins";
	};

	FieldTripDataEntryViewModel.prototype.templateClick = function()
	{
		if (this.$form)
		{
			this.obTemplateSource().forEach(function(item)
			{
				if (item.Id == this.obSelectedTemplateSource().Id)
				{
					item.FieldTripStageId = 1;
					var dataModel = new TF.DataModel.FieldTripDataModel(item);
					var dirtyModel = new TF.DataModel.FieldTripDataModel();
					var templateDataModel = new TF.DataModel.FieldTripTemplatesDataModel(item);
					var dirtyFields = this.obEntityDataModel().getDirtyFields().concat();
					for (var i in dirtyFields)
					{
						dirtyModel[dirtyFields[i]](this.obEntityDataModel()[dirtyFields[i]]());
					}
					if (item.Id == 0)
					{
						dataModel.name("");
					}
					dataModel.id(0);
					this.obEntityDataModel(dataModel);
					this.obEntityDataModel().name(templateDataModel.fieldTripName());
					this.obEntityDataModel().updateClone(this.obEntityDataModel());
					for (var i in dirtyFields)
					{
						this.obEntityDataModel()[dirtyFields[i]](dirtyModel[dirtyFields[i]]());
					}
					this.$form.data('bootstrapValidator').resetForm();
				}
			}.bind(this));
		}
	}

	FieldTripDataEntryViewModel.prototype.loadResources = function()
	{
		var vehicle = this.obVehicleGridViewModel();
		if (vehicle !== null && vehicle !== undefined)
		{
			vehicle.dispose();
		}

		if (this.obMode() === "Edit")
		{
			var resources = this.obEntityDataModel().fieldTripResourceGroup();
			resources.forEach(function(item)
			{
				if (item.Chaperone == "" && item.Chaperone2 == "" && item.Chaperone3 == "" && item.Chaperone4 == "")
				{
					item.Chaperone = "None";
				}
				this.obResourceId(this.obResourceId() + 1);
				item.resourceId = this.obResourceId();

			}.bind(this));
			this.obFieldTripResourceGroupData(resources);

			this.obVehicleGridSource([]);
			this.obDriversGridSource([]);
			this.obBusAideGridSource([]);
			this.obFieldTripResourceGroupData().forEach(function(item)
			{
				if (item.Chaperone == "" && item.Chaperone2 == "" && item.Chaperone3 == "" && item.Chaperone4 == "")
				{
					item.Chaperone = "None";
				}

				if (item.VehicleId && item.Vehicle)
				{
					item.VehTotal = this.vehicleCostComputer(item);
					item.VehicleName = item.Vehicle.BusNum;
					this.obVehicleGridSource.push(item);
				}

				if (item.DriverId && item.Driver)
				{
					item.driverTotal = this.driverTotalCostComputer(item);
					item.DriverName = item.Driver.FirstName + " " + item.Driver.LastName;
					this.obDriversGridSource.push(item);
				}

				if (item.AideId && item.Aide)
				{
					item.aideTotal = this.busAideCostComputer(item);
					item.AideName = item.Aide.FirstName + " " + item.Aide.LastName;
					this.obBusAideGridSource.push(item);
				}

			}.bind(this));
			this.obResourcesGridViewModel(new TF.Control.GridControlViewModel("fieldtripresourcegroup", [], this.obEntityDataModel().id(), "resource", null, null, null, this.obFieldTripResourceGroupData(), "resource", true));
			this.obVehicleGridViewModel(new TF.Control.GridControlViewModel("fieldtripresourcegroup", [], this.obEntityDataModel().id(), "vehicle", null, null, null, this.obVehicleGridSource(), "vehicle", true));
			this.obDriversGridViewModel(new TF.Control.GridControlViewModel("fieldtripresourcegroup", [], this.obEntityDataModel().id(), "driver", null, null, null, this.obDriversGridSource(), "driver", true));
			this.obBusAideGridViewModel(new TF.Control.GridControlViewModel("fieldtripresourcegroup", [], this.obEntityDataModel().id(), "aide", null, null, null, this.obBusAideGridSource(), "aide", true));
		}
		else
		{
			this.obResourcesGridViewModel(new TF.Control.GridControlViewModel("fieldtripresourcegroup", [], this.obEntityDataModel().id(), "resource", null, null, null, this.obFieldTripResourceGroupData(), "resource", true));
			this.obVehicleGridViewModel(new TF.Control.GridControlViewModel("fieldtripresourcegroup", [], this.obEntityDataModel().id(), "vehicle", null, null, null, this.obVehicleGridSource(), "vehicle", true));
			this.obDriversGridViewModel(new TF.Control.GridControlViewModel("fieldtripresourcegroup", [], this.obEntityDataModel().id(), "driver", null, null, null, this.obDriversGridSource(), "driver", true));
			this.obBusAideGridViewModel(new TF.Control.GridControlViewModel("fieldtripresourcegroup", [], this.obEntityDataModel().id(), "aide", null, null, null, this.obBusAideGridSource(), "aide", true));
		}

	};

	FieldTripDataEntryViewModel.prototype.ReloadResources = function()
	{
		this.obVehicleGridSource([]);
		this.obDriversGridSource([]);
		this.obBusAideGridSource([]);

		this.obFieldTripResourceGroupData().forEach(function(item)
		{
			if (item.Chaperone == "" && item.Chaperone2 == "" && item.Chaperone3 == "" && item.Chaperone4 == "")
			{
				item.Chaperone = "None";
			}

			if (item.VehicleId)
			{
				item.VehTotal = this.vehicleCostComputer(item);
				this.obVehicleGridSource.push(item);
			}

			if (item.DriverId)
			{
				item.driverTotal = this.driverTotalCostComputer(item);
				this.obDriversGridSource.push(item);
			}

			if (item.AideId)
			{
				item.aideTotal = this.busAideCostComputer(item);
				this.obBusAideGridSource.push(item);
			}

		}.bind(this));
		var resourceSort = this.obResourcesGridViewModel().obGridViewModel().searchGrid.kendoGrid.dataSource.sort(),
			resourceSource = new kendo.data.DataSource({
				data: this.obFieldTripResourceGroupData(),
				sort: resourceSort
			});
		this.obResourcesGridViewModel().obGridViewModel().searchGrid.kendoGrid.setDataSource(resourceSource);
		this.obResourcesGridViewModel().obGridViewModel().searchGrid.rebuildGrid(resourceSort);

		var vehicleSort = this.obVehicleGridViewModel().obGridViewModel().searchGrid.kendoGrid.dataSource.sort(),
			vehicleSource = new kendo.data.DataSource({
				data: this.obVehicleGridSource(),
				sort: vehicleSort
			});
		this.obVehicleGridViewModel().obGridViewModel().searchGrid.kendoGrid.setDataSource(vehicleSource);
		this.obVehicleGridViewModel().obGridViewModel().searchGrid.rebuildGrid(vehicleSort);

		var driverSort = this.obVehicleGridViewModel().obGridViewModel().searchGrid.kendoGrid.dataSource.sort(),
			driverSource = new kendo.data.DataSource({
				data: this.obDriversGridSource(),
				sort: driverSort
			});
		this.obDriversGridViewModel().obGridViewModel().searchGrid.kendoGrid.setDataSource(driverSource);
		this.obDriversGridViewModel().obGridViewModel().searchGrid.rebuildGrid(driverSort);

		var aideSort = this.obVehicleGridViewModel().obGridViewModel().searchGrid.kendoGrid.dataSource.sort(),
			aideSource = new kendo.data.DataSource({
				data: this.obBusAideGridSource(),
				sort: aideSort
			});
		this.obBusAideGridViewModel().obGridViewModel().searchGrid.kendoGrid.setDataSource(aideSource);
		this.obBusAideGridViewModel().obGridViewModel().searchGrid.rebuildGrid(aideSort);

		tf.loadingIndicator.showImmediately();
	}

	FieldTripDataEntryViewModel.prototype.loadInvoicing = function()
	{
		var invoicing = this.obInvoicingGridViewModel();
		if (invoicing !== null && invoicing !== undefined)
		{
			invoicing.dispose();
		}
		if (this.obMode() === "Edit")
		{
			var resources = this.obEntityDataModel().fieldTripInvoice();
			resources.forEach(function(item)
			{
				item.resourceId = this.obInvoiceResourceId();
				this.obInvoiceResourceId(item.resourceId + 1);
			}.bind(this));

			this.obInvoiceGridDataSource(resources);

			var invoiceGrid = new TF.Control.GridControlViewModel("fieldtripinvoice", null, this.obEntityDataModel().id(), "fieldtripEntry", null, null, null, this.obInvoiceGridDataSource(), undefined, true);
			this.obInvoicingGridViewModel(invoiceGrid);
		}
		else
		{
			var invoiceGrid = new TF.Control.GridControlViewModel("fieldtripinvoice", null, this.obEntityDataModel().id(), "fieldtripEntry", null, null, null, this.obInvoiceGridDataSource(), undefined, true);
			this.obInvoicingGridViewModel(invoiceGrid);
		}
	}

	FieldTripDataEntryViewModel.prototype.addObjectClick = function(type)
	{
		var mvModel,
			obModelList,
			obProperty,
			inputName;
		switch (type)
		{
			case "department":
				mvModel = new TF.Modal.AddTwoFieldsModalViewModel("fieldtripdistrictdepartment");
				obModelList = this.obDepartmentDataModels;
				obProperty = "districtDepartmentId";
				inputName = "districtDepartment";
				break;
			case "activity":
				mvModel = new TF.Modal.AddTwoFieldsModalViewModel("fieldtripactivity");
				obModelList = this.obActivityDataModels;
				obProperty = "fieldTripActivityId";
				inputName = "fieldTripActivity";
				break;
			case "classification":
				mvModel = new TF.Modal.AddTwoFieldsModalViewModel("fieldtripclassification");
				obModelList = this.obClassificationDataModels;
				obProperty = "fieldTripClassificationId";
				break;
			case "equipment":
				mvModel = new TF.Modal.AddTwoFieldsModalViewModel("fieldtripequipment");
				obModelList = this.obEquipmentDataModels;
				obProperty = "fieldTripEquipmentId";
				break;
			case "destination":
				mvModel = new TF.Modal.FieldTripDestinationModalViewModel("fieldtripdestination", undefined, this.obMailCityDataModels());
				obModelList = this.obDestinationDataModels;
				obProperty = "destination";
				inputName = "destination";
				break;
			case "billingClassification":
				mvModel = new TF.Modal.FieldTripBillingClassificationModalViewModel("fieldtripbillingclassification");
				obModelList = this.obBillingClassificationDataModels;
				obProperty = "billingClassificationId";
				break;
			default:
				return;
		}
		tf.modalManager.showModal(mvModel)
			.then(function(data)
			{
				if (mvModel.newDataList.length > 0)
				{
					for (var i in mvModel.newDataList)
					{
						obModelList.push(mvModel.newDataList[i]);
					}
					this.obEntityDataModel()[obProperty](mvModel.newDataList[i].Id);
				}
				if (!data)
				{
					return;
				}
				obModelList.push(data);
				this.obEntityDataModel()[obProperty](data.Id);
				this._fieldsUpdateFromModal(type, data);
				if (inputName)
				{
					this.$form.find('input[name=' + inputName + ']').change();
				}
			}.bind(this));
	}

	FieldTripDataEntryViewModel.prototype.editObjectClick = function(type, id)
	{
		if (id == null || id == 0)
		{//once select None
			return;
		}
		var mvModel,
			obModelList,
			obProperty;
		switch (type)
		{
			case "department":
				mvModel = new TF.Modal.AddTwoFieldsModalViewModel("fieldtripdistrictdepartment", id);
				obModelList = this.obDepartmentDataModels;
				obProperty = "districtDepartmentId";
				break;
			case "activity":
				mvModel = new TF.Modal.AddTwoFieldsModalViewModel("fieldtripactivity", id);
				obModelList = this.obActivityDataModels;
				obProperty = "fieldTripActivityId";
				break;
			case "classification":
				mvModel = new TF.Modal.AddTwoFieldsModalViewModel("fieldtripclassification", id);
				obModelList = this.obClassificationDataModels;
				obProperty = "fieldTripClassificationId";
				break;
			case "equipment":
				mvModel = new TF.Modal.AddTwoFieldsModalViewModel("fieldtripequipment", id);
				obModelList = this.obEquipmentDataModels;
				obProperty = "fieldTripEquipmentId";
				break;
			case "destination":
				var items = this.obDestinationDataModels(), destinationId;
				for (var i = 0; i < items.length; i++)
				{
					if (items[i].Name === id)
					{
						destinationId = items[i].Id;
					}
				}

				mvModel = new TF.Modal.FieldTripDestinationModalViewModel("fieldtripdestination", destinationId, this.obMailCityDataModels());
				obModelList = this.obDestinationDataModels;
				obProperty = "destination";
				break;
			case "billingClassification":
				mvModel = new TF.Modal.FieldTripBillingClassificationModalViewModel("fieldtripbillingclassification", id);
				obModelList = this.obBillingClassificationDataModels;
				obProperty = "billingClassificationId";
				break;
			default:
				return;
		}
		tf.modalManager.showModal(mvModel)
			.then(function(data)
			{
				if (!data)
				{
					return;
				}

				obModelList(
					obModelList().map(function(item)
					{
						if (type === "destination")
						{
							if (item.Name == id)
							{
								return data;
							}
						}
						else if (item.Id == id)
						{
							return data;
						}
						return item;
					})
				);

				this.obEntityDataModel()[obProperty](type === "destination" ? data.Name : data.Id);
				this._fieldsUpdateFromModal(type, data);
			}.bind(this));
	}

	FieldTripDataEntryViewModel.prototype.addResourceClick = function(type)
	{
		tf.modalManager.showModal(new TF.Modal.FieldTripResourceModalViewModel(this.obEntityDataModel().id()))
			.then(function(data)
			{
				if (data)
				{
					this.obResourceId(this.obResourceId() + 1);
					data.resourceId = this.obResourceId();

					this.obFieldTripResourceGroupData.push(data);
					this.ReloadResources();
				}
			}.bind(this));
	}

	FieldTripDataEntryViewModel.prototype.ConvertToJson = function(items)
	{
		var json = {};
		items.forEach(function(data)
		{
			json[data.FieldName] = { Label: data.Label, Required: data.Required };
		}.bind(this));

		this.obRequiredFields(json);
	}

	FieldTripDataEntryViewModel.prototype.IsRequired = function(item)
	{
		return item ? { required: "required" } : {};
	}

	FieldTripDataEntryViewModel.prototype.initializeResources = function(el)
	{
		this.$form.find('.resources .view-grid-header').text(tf.applicationTerm.getApplicationTermPluralByName("Assigned Resources"));
		this.$form.find('.resources .iconbutton.mapview').hide();
		this.$form.find('.resources .iconbutton.gridview').hide();
		this.$form.find('.resources .iconbutton.view').hide();
		this.$form.find('.resources .iconbutton.copytoclipboard').hide();
		this.$form.find('.resources .iconrow .divider:first').hide();
		this.$form.find('.resources .iconbutton.pencil').hide();

		this.$form.find('.resources .iconbutton.filter').off("click");
		this.$form.find('.resources .iconbutton.refresh').off("click");

		this.$form.find('.resources .iconbutton.new').off("click").on("click", { modal: TF.Modal.FieldTripResourceModalViewModel }, this.addEvent.bind(this));
		this.$form.find('.resources .iconbutton.delete').off("click").on("click", { gridView: this.obResourcesGridViewModel, modal: TF.Modal.FieldTripResourceModalViewModel }, this.deleteEvent.bind(this));
	}

	FieldTripDataEntryViewModel.prototype.initializeVehicle = function(el)
	{
		this.$form.find('.vehicle .view-grid-header').text(tf.applicationTerm.getApplicationTermPluralByName("Vehicle"));
		this.$form.find('.vehicle .iconbutton.mapview').hide();
		this.$form.find('.vehicle .iconbutton.gridview').hide();
		this.$form.find('.vehicle .iconbutton.view').hide();
		this.$form.find('.vehicle .iconbutton.copytoclipboard').hide();
		this.$form.find('.vehicle .iconrow .divider:first').hide();

		this.$form.find('.vehicle .iconbutton.filter').off("click");
		this.$form.find('.vehicle .iconbutton.refresh').off("click");

		this.$form.find('.vehicle .iconbutton.new').off("click").on("click", { modal: TF.Modal.FieldTripResourceVehicleModalViewModel }, this.addEvent.bind(this));
		this.$form.find('.vehicle .iconbutton.pencil').off("click").on("click", { gridView: this.obVehicleGridViewModel, modal: TF.Modal.FieldTripResourceVehicleModalViewModel }, this.editEvent.bind(this));
		this.$form.find('.vehicle .iconbutton.delete').off("click").on("click", { gridView: this.obVehicleGridViewModel, modal: TF.Modal.FieldTripResourceVehicleModalViewModel }, this.deleteEvent.bind(this));
	}

	FieldTripDataEntryViewModel.prototype.initializeDriver = function(el)
	{
		this.$form.find('.drivers .view-grid-header').text(tf.applicationTerm.getApplicationTermPluralByName("Driver"));
		this.$form.find('.drivers .iconbutton.mapview').hide();
		this.$form.find('.drivers .iconbutton.gridview').hide();
		this.$form.find('.drivers .iconbutton.view').hide();
		this.$form.find('.drivers .iconbutton.copytoclipboard').hide();
		this.$form.find('.drivers .iconrow .divider:first').hide();

		this.$form.find('.drivers .iconbutton.filter').off("click");
		this.$form.find('.drivers .iconbutton.refresh').off("click");

		this.$form.find('.drivers .iconbutton.new').off("click").on("click", { modal: TF.Modal.FieldTripResourceDriverModalViewModel }, this.addEvent.bind(this));
		this.$form.find('.drivers .iconbutton.pencil').off("click").on("click", { gridView: this.obDriversGridViewModel, modal: TF.Modal.FieldTripResourceDriverModalViewModel }, this.editEvent.bind(this));
		this.$form.find('.drivers .iconbutton.delete').off("click").on("click", { gridView: this.obDriversGridViewModel, modal: TF.Modal.FieldTripResourceDriverModalViewModel }, this.deleteEvent.bind(this));
	}

	FieldTripDataEntryViewModel.prototype.initializeAide = function(el)
	{
		this.$form.find('.busAides .view-grid-header').text(tf.applicationTerm.getApplicationTermPluralByName("Bus Aide"));
		this.$form.find('.busAides .iconbutton.mapview').hide();
		this.$form.find('.busAides .iconbutton.gridview').hide();
		this.$form.find('.busAides .iconbutton.view').hide();
		this.$form.find('.busAides .iconbutton.copytoclipboard').hide();
		this.$form.find('.busAides .iconrow .divider:first').hide();

		this.$form.find('.busAides .iconbutton.filter').off("click");
		this.$form.find('.busAides .iconbutton.refresh').off("click");

		this.$form.find('.busAides .iconbutton.new').off("click").on("click", { modal: TF.Modal.FieldTripResourceAideModalViewModel }, this.addEvent.bind(this));
		this.$form.find('.busAides .iconbutton.pencil').off("click").on("click", { gridView: this.obBusAideGridViewModel, modal: TF.Modal.FieldTripResourceAideModalViewModel }, this.editEvent.bind(this));
		this.$form.find('.busAides .iconbutton.delete').off("click").on("click", { gridView: this.obBusAideGridViewModel, modal: TF.Modal.FieldTripResourceAideModalViewModel }, this.deleteEvent.bind(this));

	}

	FieldTripDataEntryViewModel.prototype.getSaveData = function(isTemplate)
	{
		if (!this.obEntityDataModel().departDate())
		{
			this.obEntityDataModel().departDateTime(null);
		}
		if (!this.obEntityDataModel().returnDate())
		{
			this.obEntityDataModel().estimatedReturnDateTime(null);
		}
		var entity = this.obEntityDataModel().toData();
		entity.FieldTripResourceGroups = this.obFieldTripResourceGroupData();
		entity.FieldTripInvoice = this.obInvoiceGridDataSource();
		if (isTemplate)
		{
			entity.APIIsNew = true;
		}
		entity.FieldTripResourceGroups.map(function(item)
		{
			item.APIIsDirty = true;
			item.APIIsNew = true;
		});
		entity.FieldTripInvoice.map(function(item)
		{
			item.APIIsDirty = true;
			item.APIIsNew = true;
		});
		return entity;
	}

	FieldTripDataEntryViewModel.prototype.addEvent = function(e)
	{
		tf.modalManager.showModal(new e.data.modal(null, this.obEntityDataModel().id()))
			.then(function(data)
			{
				if (data)
				{
					this.obResourceId(this.obResourceId() + 1);
					data.resourceId = this.obResourceId();

					this.obFieldTripResourceGroupData.push(data);
					this.ReloadResources();
				}
			}.bind(this));
	}

	FieldTripDataEntryViewModel.prototype.editEvent = function(e)
	{
		var row = e.data.gridView().obGridViewModel().searchGrid.kendoGrid.select();
		if (row.length)
		{
			var data = e.data.gridView().obGridViewModel().searchGrid.kendoGrid.dataItem(row);
			tf.modalManager.showModal(new e.data.modal(data, this.obEntityDataModel().id()))
				.then(function(data)
				{
					if (data)
					{
						var source = [];
						this.obFieldTripResourceGroupData().forEach(function(item)
						{
							if (item.resourceId == data.resourceId)
							{
								source.push(data);
								return;
							}
							source.push(item);
						}.bind(this));

						this.obFieldTripResourceGroupData(source);
						this.ReloadResources();
					}
				}.bind(this));
		}
	}

	FieldTripDataEntryViewModel.prototype.deleteEvent = function(e)
	{
		var row = e.data.gridView().obGridViewModel().searchGrid.kendoGrid.select();
		if (row.length)
		{
			var data = e.data.gridView().obGridViewModel().searchGrid.kendoGrid.dataItem(row);

			var source = [];
			this.obFieldTripResourceGroupData().forEach(function(item)
			{
				if (item.resourceId == data.resourceId)
				{
					return;
				}
				source.push(item);
			}.bind(this));

			this.obFieldTripResourceGroupData(source);
			this.ReloadResources();
		}
	}

	FieldTripDataEntryViewModel.prototype.applyBillingClick = function(viewModel, e)
	{
		var curBilling = this.obBillingClassificationDataModels().filter(function(item)
		{
			return item.Id == this.obEntityDataModel().billingClassificationId();
		}.bind(this));

		this.obFieldTripResourceGroupData().forEach(function(item)
		{
			item.VehFixedCost = curBilling[0].VehFixedCost ? curBilling[0].VehFixedCost : 0;
			item.MileageRate = curBilling[0].MileageRate ? curBilling[0].MileageRate : 0;

			item.DriverRate = curBilling[0].DriverRate ? curBilling[0].DriverRate : 0;
			item.DriverFixedCost = curBilling[0].DriverFixedCost ? curBilling[0].DriverFixedCost : 0;
			item.DriverOtrate = curBilling[0].DriverOtrate ? curBilling[0].DriverOtrate : 0;

			item.AideRate = curBilling[0].AideRate ? curBilling[0].AideRate : 0;
			item.AideFixedCost = curBilling[0].AideFixedCost ? curBilling[0].AideFixedCost : 0;
			item.AideOtrate = curBilling[0].AideOtrate ? curBilling[0].AideOtrate : 0;

		}.bind(this));

		this.ReloadResources();
	}
	FieldTripDataEntryViewModel.prototype.applyVehicleClick = function(viewModel, e)
	{
		this.obFieldTripResourceGroupData().forEach(function(item)
		{
			item.VehFixedCost = this.obEntityDataModel().vehFixedCost();
			item.MileageRate = this.obEntityDataModel().mileageRate();

		}.bind(this));

		this.ReloadResources();
	}
	FieldTripDataEntryViewModel.prototype.applyDriverClick = function(viewModel, e)
	{
		this.obFieldTripResourceGroupData().forEach(function(item)
		{
			item.DriverRate = this.obEntityDataModel().driverRate();
			item.DriverFixedCost = this.obEntityDataModel().driverFixedCost();
			item.DriverOtrate = this.obEntityDataModel().driverOtrate();

		}.bind(this));

		this.ReloadResources();
	}
	FieldTripDataEntryViewModel.prototype.applyAideClick = function(viewModel, e)
	{
		this.obFieldTripResourceGroupData().forEach(function(item)
		{
			item.AideRate = this.obEntityDataModel().aideRate();
			item.AideFixedCost = this.obEntityDataModel().aideFixedCost();
			item.AideOtrate = this.obEntityDataModel().aideOtrate();

		}.bind(this));

		this.ReloadResources();
	}

	FieldTripDataEntryViewModel.prototype.viewResourceClick = function(viewModel, e)
	{
		tf.modalManager.showModal(new TF.Modal.FieldTripViewResourceModalViewModel(this.obFieldTripResourceGroupData));
	}

	FieldTripDataEntryViewModel.prototype.initializeInvoice = function(el)
	{
		this.$form.find('.invoice .view-grid-header').text("Invoice Information");
		this.$form.find('.invoice .iconbutton.mapview').hide();
		this.$form.find('.invoice .iconbutton.gridview').hide();
		this.$form.find('.invoice .iconbutton.view').hide();
		this.$form.find('.invoice .iconbutton.copytoclipboard').hide();
		this.$form.find('.invoice .iconrow .divider:first').hide();

		this.$form.find('.invoice .iconbutton.filter').off("click");
		this.$form.find('.invoice .iconbutton.refresh').off("click");

		this.$form.find('.invoice .iconbutton.new').off("click").on("click", { modal: TF.Modal.FieldTripInvoiceModalViewModel }, this.addInvoiceEvent.bind(this));
		this.$form.find('.invoice .iconbutton.pencil').off("click").on("click", { gridView: this.obInvoicingGridViewModel, modal: TF.Modal.FieldTripInvoiceModalViewModel }, this.editInvoiceEvent.bind(this));
		this.$form.find('.invoice .iconbutton.delete').off("click").on("click", { gridView: this.obInvoicingGridViewModel, modal: TF.Modal.FieldTripInvoiceModalViewModel }, this.deleteInvoiceEvent.bind(this));
		this.obInvoicingGridViewModel().obGridViewModel()._viewfromDBClick = this.editInvoiceEvent.bind(this);
	}

	FieldTripDataEntryViewModel.prototype.addInvoiceEvent = function(e)
	{
		var option = { entityId: this.obEntityDataModel().id(), entityType: "fieldtrip" };
		tf.modalManager.showModal(new e.data.modal(option))
			.then(function(data)
			{
				if (data)
				{
					data.resourceId = this.obInvoiceResourceId();
					this.obInvoiceResourceId(data.resourceId + 1);

					this.obInvoiceGridDataSource.push(data);
					var resourceSort = this.obInvoicingGridViewModel().obGridViewModel().searchGrid.kendoGrid.dataSource.sort(),
						resourceSource = new kendo.data.DataSource({
							data: this.obInvoiceGridDataSource(),
							sort: resourceSort
						});
					this.obInvoicingGridViewModel().obGridViewModel().searchGrid.kendoGrid.setDataSource(resourceSource);
					this.obInvoicingGridViewModel().obGridViewModel().searchGrid.rebuildGrid(resourceSort);
				}
			}.bind(this));
	}

	FieldTripDataEntryViewModel.prototype.editInvoiceEvent = function(e)
	{
		var row = this.obInvoicingGridViewModel().obGridViewModel().searchGrid.kendoGrid.select();
		if (row.length)
		{
			var data = this.obInvoicingGridViewModel().obGridViewModel().searchGrid.kendoGrid.dataItem(row);
			if (data.InvoiceDate)
			{
				data.InvoiceDate = moment(data.InvoiceDate).format("YYYY-MM-DD");
			}
			if (data.PaymentDate)
			{
				data.PaymentDate = moment(data.PaymentDate).format("YYYY-MM-DD");
			}
			var option = { entityId: this.obEntityDataModel().id(), entityType: "fieldtrip", data: data };
			tf.modalManager.showModal(new TF.Modal.FieldTripInvoiceModalViewModel(option))
				.then(function(data)
				{
					if (data)
					{
						var source = [];
						this.obInvoiceGridDataSource().forEach(function(item)
						{
							if (item.resourceId == data.resourceId)
							{
								source.push(data);
								return;
							}
							source.push(item);
						}.bind(this));

						var resourceSort = this.obInvoicingGridViewModel().obGridViewModel().searchGrid.kendoGrid.dataSource.sort(),
							resourceSource = new kendo.data.DataSource({
								data: source,
								sort: resourceSort
							});
						this.obInvoiceGridDataSource(source);
						this.obInvoicingGridViewModel().obGridViewModel().searchGrid.kendoGrid.setDataSource(resourceSource);
						this.obInvoicingGridViewModel().obGridViewModel().searchGrid.rebuildGrid(resourceSort);
					}
				}.bind(this));
		}
	}

	FieldTripDataEntryViewModel.prototype.deleteInvoiceEvent = function(e)
	{
		var row = e.data.gridView().obGridViewModel().searchGrid.kendoGrid.select();
		if (row.length)
		{
			var data = e.data.gridView().obGridViewModel().searchGrid.kendoGrid.dataItem(row);

			var source = [];
			this.obInvoiceGridDataSource().forEach(function(item)
			{
				if (item.resourceId == data.resourceId)
				{
					return;
				}
				source.push(item);
			}.bind(this));

			var resourceSort = this.obInvoicingGridViewModel().obGridViewModel().searchGrid.kendoGrid.dataSource.sort(),
				resourceSource = new kendo.data.DataSource({
					data: source,
					sort: resourceSort
				});
			this.obInvoiceGridDataSource(source);
			this.obInvoicingGridViewModel().obGridViewModel().searchGrid.kendoGrid.setDataSource(resourceSource);
			this.obInvoicingGridViewModel().obGridViewModel().searchGrid.rebuildGrid(resourceSort);
		}
	}

	FieldTripDataEntryViewModel.prototype.getSpecialValidatorFields = function(validatorFields)
	{
		validatorFields.name = {
			trigger: "blur change",
			validators: {
				callback:
				{
					message: " must be unique",
					callback: function(value, validator, $field)
					{
						if (value == "" || this.obEntityDataModel().id())
						{
							return true;
						}

						//There is another trip in the database with the same name as this trip.Please change this trip's name before saving it.
						return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "fieldtrip", "uniquenamecheck"), {
							paramData: {
								name: this.obEntityDataModel().name()
							}
						}, {
								overlay: false
							})
							.then(function(apiResponse)
							{
								return apiResponse.Items[0] == false;
							})
					}.bind(this)
				}
			}
		};

		if (this.obRequiredFields().Name && this.obRequiredFields().Name.Required)
		{//may name not required(this don't exist in prod, but need test)
			validatorFields.name.validators.notEmpty = { message: "required" };
		}

		validatorFields.departDate.validators.callback = {
			message: "must be <= Return Date",
			callback: function(value, validator)
			{
				if (value != "")
				{
					var returnDate = new moment(this.obEntityDataModel().returnDate());
					var departDate = new moment(this.obEntityDataModel().departDate());
					if (!departDate.isValid() || !returnDate.isValid())
					{//not valid value, no need to compare
						return true;
					}

					if (returnDate.isSame(departDate, "day"))
					{
						this.clearDateTimeAlerts("date");
						this.$form.find("#returnTime input[name=estimatedReturnTime]").trigger("blur");
						this.$form.find("#departTime input[name=departTime]").trigger("blur");
						return true;
					}
					else if (departDate.isAfter(returnDate))
					{//return time need greate than depart time
						this.clearDateTimeAlerts("time");
						this.pageLevelViewModel.activeLostfouseName = "departDate";
						return { message: 'must be <= return Date', valid: false };
					}
					//validate passed, clear all messages.
					this.clearDateTimeAlerts();
				}
				return true;
			}.bind(this)
		};

		validatorFields.estimatedReturnDate.validators.callback = {
			message: "invalid time",
			callback: function(value, validator)
			{
				if (value != "")
				{
					var returnDate = new moment(this.obEntityDataModel().returnDate());
					var departDate = new moment(this.obEntityDataModel().departDate());
					if (!departDate.isValid() || !returnDate.isValid())
					{//not valid value, no need to compare
						return true;
					}

					if (returnDate.isSame(departDate, "day"))
					{
						this.clearDateTimeAlerts("date");
						this.$form.find("#departTime input[name=departTime]").trigger("blur");
						this.$form.find("#returnTime input[name=estimatedReturnTime]").trigger("blur");
						return true;
					}
					else if (departDate.isAfter(returnDate))
					{//return time need greate than depart time
						this.clearDateTimeAlerts("time");
						this.pageLevelViewModel.activeLostfouseName = "returnDate";
						return { message: 'must be >= Depart Date', valid: false };
					}

					//validate passed, clear all messages.
					this.clearDateTimeAlerts();
				}
				return true;
			}.bind(this)
		};

		if (this.obRequiredFields().DepartDateTime)
		{//no need to check EstimatedReturnTime because it is not required.
			if (this.obRequiredFields().DepartDateTime.Required)
			{
				validatorFields.departDate.validators.notEmpty = { message: "required" };
			}
			else
			{
				delete validatorFields.departTime.validators.notEmpty;
			}
		}
		validatorFields.departTime.validators.callback = {
			message: "invalid time",
			callback: function(value, validator)
			{
				if (value != "")
				{
					var m = new moment(value, 'h:m A', true);

					if (!m.isValid())
					{
						return { message: "invalid time", valid: false };
					}

					if (!this.obEntityDataModel().departDate())
					{//this might never use, because the date is required when input time
						return true;
					}

					var returnDate = new moment(this.obEntityDataModel().returnDate());
					var departDate = new moment(this.obEntityDataModel().departDate());
					if (!departDate.isValid() || !returnDate.isValid())
					{//not valid value, no need to compare
						return true;
					}

					if (returnDate.isSame(departDate, "day"))
					{
						var m = new moment(this.obEntityDataModel().departTime());
						m.year(2010);
						m.dayOfYear(1);

						var end = new moment(this.obEntityDataModel().returnTime());
						end.year(2010);
						end.dayOfYear(1);

						if (m.isValid() && end.isValid() && m.isAfter(end))
						{//return time need greate than depart time
							this.pageLevelViewModel.activeLostfouseName = "departTime";
							return { message: 'must be <= return Time', valid: false };
						}

						//validate passed, clear all messages.
						this.clearDateTimeAlerts();
					}
					else
					{//not same day, to compare the real date
						this.$form.find("#departDate input[name=departDate]").trigger("blur");
					}
				}

				return true;
			}.bind(this)
		};

		if (this.obRequiredFields().EstimatedReturnDateTime)
		{//no need to check EstimatedReturnTime because it is not required.
			if (this.obRequiredFields().EstimatedReturnDateTime.Required)
			{
				validatorFields.estimatedReturnDate.validators.notEmpty = { message: "required" };
			}
			else
			{
				delete validatorFields.estimatedReturnTime.validators.notEmpty;
			}
		}

		validatorFields.estimatedReturnTime.validators.callback = {
			message: "invalid time",
			callback: function(value, validator)
			{
				if (value != "")
				{
					var m = new moment(value, 'h:m A', true);

					if (!m.isValid())
					{
						return { message: "invalid time", valid: false };
					}

					if (!this.obEntityDataModel().returnDate())
					{//this might never use, because the date is required when input time
						return true;
					}

					var returnDate = new moment(this.obEntityDataModel().returnDate());
					var departDate = new moment(this.obEntityDataModel().departDate());
					if (!departDate.isValid() || !returnDate.isValid())
					{//not valid value, no need to compare
						return true;
					}

					if (returnDate.isSame(departDate, "day"))
					{
						var m = new moment(this.obEntityDataModel().departTime());
						m.year(2010);
						m.dayOfYear(1);

						var end = new moment(this.obEntityDataModel().returnTime());
						end.year(2010);
						end.dayOfYear(1);

						if (m.isValid() && end.isValid() && m.isAfter(end))
						{//return time need greate than depart time
							this.pageLevelViewModel.activeLostfouseName = "returnTime";
							return { message: 'must be >= Depart Time', valid: false };
						}

						//validate passed, clear all messages.
						this.clearDateTimeAlerts();
					}
					else
					{//not same day, to compare the real date
						this.$form.find("#returnDate input[name=estimatedReturnDate]").trigger("blur");
					}
				}

				return true;
			}.bind(this)
		};
		return validatorFields;
	}

	FieldTripDataEntryViewModel.prototype.clearDateTimeAlerts = function(type)
	{
		switch (type)
		{
			case "time":
				this.$form.find("#departTime>small[data-bv-validator=callback]").hide();
				this.$form.find("#returnTime>small[data-bv-validator=callback]").hide();
				if (this.pageLevelViewModel.activeLostfouseName.indexOf("Time") !== -1) { this.pageLevelViewModel.activeLostfouseName = ""; }
				break;
			case "date":
				this.$form.find("#departDate>small[data-bv-validator=callback]").hide();
				this.$form.find("#returnDate>small[data-bv-validator=callback]").hide();
				if (this.pageLevelViewModel.activeLostfouseName.indexOf("Date") !== -1) { this.pageLevelViewModel.activeLostfouseName = ""; }
				break;
			default:
				this.$form.find("#departDate>small[data-bv-validator=callback]").hide();
				this.$form.find("#departTime>small[data-bv-validator=callback]").hide();
				this.$form.find("#returnDate>small[data-bv-validator=callback]").hide();
				this.$form.find("#returnTime>small[data-bv-validator=callback]").hide();
				this.pageLevelViewModel.activeLostfouseName = "";
				break;
		}
	};

	FieldTripDataEntryViewModel.prototype.addLinkToDate = function(e)
	{
		$(this.$form.parents()[3]).find(".linktoDepartDate").on("click", function()
		{
			this.$form.find("#departDate input[name=departDate]").focus();
		}.bind(this));

		$(this.$form.parents()[3]).find(".linktoReturnDate").on("click", function()
		{
			this.$form.find("#returnDate input[name=estimatedReturnDate]").focus();
		}.bind(this));

		$(this.$form.parents()[3]).find(".linktoDepartTime").on("click", function()
		{
			this.$form.find("#departTime input[name=departTime]").focus();
		}.bind(this));

		$(this.$form.parents()[3]).find(".linktoReturnTime").on("click", function()
		{
			this.$form.find("#returnTime input[name=estimatedReturnTime]").focus();
		}.bind(this));
	}

	FieldTripDataEntryViewModel.prototype.GetSchoolId = function(school)
	{
		var filters = this.obSchoolDataModels().filter(function(item)
		{
			return item.SchoolCode == school;
		});

		return (filters[0] && filters[0].Id) ? filters[0].Id : null;
	};

	FieldTripDataEntryViewModel.prototype.addDataEntryListItem = function(parameters)
	{
		var modifyDataEntryListItemModalViewModel = new TF.Modal.ModifyDataEntryListItemModalViewModel(parameters[0], "fieldtripdestination");
		tf.modalManager.showModal(modifyDataEntryListItemModalViewModel)
			.then(function(data)
			{
				if (modifyDataEntryListItemModalViewModel.newDataList.length > 0)
				{
					for (var i in modifyDataEntryListItemModalViewModel.newDataList)
					{
						parameters[1].push(modifyDataEntryListItemModalViewModel.newDataList[i]);
					}
					if (parameters[2])
					{
						this.obEntityDataModel()[parameters[2]](modifyDataEntryListItemModalViewModel.newDataList[i].Item);
					}
				}
				if (!data)
				{
					return;
				}
				parameters[1].push(data);
				if (parameters[2])
				{
					this.obEntityDataModel()[parameters[2]](data.Item);
				}
			}.bind(this));
	}

	FieldTripDataEntryViewModel.prototype.EditDataEntryListItem = function(parameters)
	{
		var select = $.grep(parameters[1](), function(d) { return d.Item == parameters[3] });
		if (select.length > 0)
		{
			if (select[0].Id == 0)
			{//once select None
				return;
			}

			tf.modalManager.showModal(new TF.Modal.ModifyDataEntryListItemModalViewModel(parameters[0], "fieldtripdestination", select[0].Id))
				.then(function(data)
				{
					if (!data)
					{
						return;
					}
					var index = parameters[1].indexOf(select[0]);
					parameters[1].splice(index, 1);
					parameters[1].push(data);
					if (parameters[2])
					{
						this.obEntityDataModel()[parameters[2]](data.Item);
					}
				}.bind(this));
		}
	}

	FieldTripDataEntryViewModel.prototype._fieldsUpdateFromModal = function(type, data)
	{
		switch (type)
		{
			case "destination":
				if (data == null)
				{
					this.obEntityDataModel().destinationStreet("");
					this.obEntityDataModel().destinationCity("");
					this.obEntityDataModel().destinationState("");
					this.obEntityDataModel().destinationZip("");
					this.obEntityDataModel().destinationEmail("");
					this.obEntityDataModel().destinationNotes("");
					this.obEntityDataModel().destinationContact("");
					this.obEntityDataModel().destinationContactTitle("");
					this.obEntityDataModel().destinationContactTitle("");
					this.obEntityDataModel().destinationFax("");
					this.obEntityDataModel().destinationContactPhone("");
				}
				else
				{
					this.obEntityDataModel().destinationStreet(data.Street);
					this.obEntityDataModel().destinationCity(data.City);
					this.obEntityDataModel().destinationState(data.State);
					this.obEntityDataModel().destinationZip(data.Zip);
					this.obEntityDataModel().destinationEmail(data.Email);
					this.obEntityDataModel().destinationNotes(data.Notes);
					this.obEntityDataModel().destinationContact(data.Contact);
					this.obEntityDataModel().destinationContactTitle(data.ContactTitle);
					this.obEntityDataModel().destinationContactTitle(data.ContactTitle);
					this.obEntityDataModel().destinationFax(data.Fax);
					this.obEntityDataModel().destinationContactPhone(data.Phone);
				}
				break;
			case "billingClassification":
				if (data == null)
				{
					this.obEntityDataModel().aideFixedCost("");
					this.obEntityDataModel().aideOtrate("");
					this.obEntityDataModel().aideRate("");
					this.obEntityDataModel().driverFixedCost("");
					this.obEntityDataModel().driverOtrate("");
					this.obEntityDataModel().driverRate("");
					this.obEntityDataModel().fixedCost("");
					this.obEntityDataModel().mileageRate("");
					this.obEntityDataModel().minimumCost("");
					this.obEntityDataModel().vehFixedCost("");
				}
				else
				{
					this.obEntityDataModel().aideFixedCost(data.AideFixedCost);
					this.obEntityDataModel().aideOtrate(data.AideOTRate);
					this.obEntityDataModel().aideRate(data.AideRate);
					this.obEntityDataModel().driverFixedCost(data.DriverFixedCost);
					this.obEntityDataModel().driverOtrate(data.DriverOTRate);
					this.obEntityDataModel().driverRate(data.DriverRate);
					this.obEntityDataModel().fixedCost(data.FixedCost);
					this.obEntityDataModel().mileageRate(data.MileageRate);
					this.obEntityDataModel().minimumCost(data.MinimumCost);
					this.obEntityDataModel().vehFixedCost(data.VehFixedCost);
				}
				break;
		}
	}
})();