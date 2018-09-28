﻿(function()
{
	createNamespace('TF.Control').FieldTripResourceViewModel = FieldTripResourceViewModel;

	function FieldTripResourceViewModel(source, id)
	{
		this.obEntityDataModel = ko.observable(new TF.DataModel.FieldTripResourceDataModel(source));
		this.obEntityDataModel().fieldTripId(id);
		this.obVehicleSource = ko.observableArray();
		this.obDriverSource = ko.observableArray();
		this.obBusaideSource = ko.observableArray();
		this.obEditTieldTrip = ko.observable(id == 0 ? false : true);

		this.obVehTotal = ko.computed(function()
		{
			if (this.obEditTieldTrip())
			{
				return (Number(this.obEntityDataModel().endingodometer()) - Number(this.obEntityDataModel().startingodometer())) * Number(this.obEntityDataModel().mileageRate())
					+ Number(this.obEntityDataModel().vehFixedCost());
			}
			else { return Number(this.obEntityDataModel().vehFixedCost()) }
		}.bind(this));

		this.obDriverTotal = ko.computed(function()
		{
			return Number(this.obEntityDataModel().driverHours()) * Number(this.obEntityDataModel().driverRate())
				+ Number(this.obEntityDataModel().driverOthours()) * Number(this.obEntityDataModel().driverOtrate())
				+ Number(this.obEntityDataModel().driverFixedCost())
				+ Number(this.obEntityDataModel().driverExpParking())
				+ Number(this.obEntityDataModel().driverExpTolls())
				+ Number(this.obEntityDataModel().driverExpMeals())
				+ Number(this.obEntityDataModel().driverExpMisc());
		}.bind(this));

		this.obAideTotal = ko.computed(function()
		{
			return Number(this.obEntityDataModel().aideHours()) * Number(this.obEntityDataModel().aideRate())
				+ Number(this.obEntityDataModel().aideOthours()) * Number(this.obEntityDataModel().aideOtrate())
				+ Number(this.obEntityDataModel().aideFixedCost());
		}.bind(this));

		this.pageLevelViewModel = new TF.PageLevel.BaseDataEntryPageLevelViewModel();

		//drop down list
		this.obSelectedVehicle = ko.observable();
		this.obSelectedVehicle.subscribe(TF.Helper.DropDownMenuHelper.setSelectValue(this, "vehicleId", "obSelectedVehicle", function(obj) { return obj ? obj.Id : 0; }), this);
		this.obSelectedVehicleText = ko.observable(source ? source.VehicleName : undefined);
		this.obSelectedDriverVehicleDisable = ko.observable(true);

		this.obSelectedDriver = ko.observable();
		this.obSelectedDriver.subscribe(TF.Helper.DropDownMenuHelper.setSelectValue(this, "driverId", "obSelectedDriver", function(obj) { return obj ? obj.Id : 0; }), this);
		this.obSelectedDriverText = ko.observable(source ? source.DriverName : undefined);

		this.obSelectedBusAide = ko.observable();
		this.obSelectedBusAide.subscribe(TF.Helper.DropDownMenuHelper.setSelectValue(this, "aideId", "obSelectedBusAide", function(obj) { return obj ? obj.Id : 0; }), this);
		this.obSelectedBusAideText = ko.observable(source ? source.AideName : undefined);
		this.obEntityDataModel().apiIsDirty(false);
		this.obEntityDataModel()._entityBackup = JSON.parse(JSON.stringify(this.obEntityDataModel().toData()));
	}

	FieldTripResourceViewModel.prototype.save = function()
	{
		return this.pageLevelViewModel.saveValidate()
			.then(function(result)
			{
				if (result)
				{
					var entity = this.obEntityDataModel().toData();
					entity.VehicleName = this.obSelectedVehicleText();
					if (entity.DriverId != 0)
					{
						entity.DriverName = this.obSelectedDriverText();
					}
					if (entity.AideId != 0)
					{
						entity.AideName = this.obSelectedBusAideText();
					}
					return entity;
				}
			}.bind(this));
	}

	FieldTripResourceViewModel.prototype.init = function(viewModel, el)
	{
		this.$form = $(el);

		var validatorFields = {}, isValidating = false, self = this;

		validatorFields.vehicle = {
			trigger: "blur change",
			validators: {
				notEmpty: {
					message: "required"
				}
			}
		}

		setTimeout(function()
		{
			$(el).bootstrapValidator({
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
			this.pageLevelViewModel.load(this.$form.data("bootstrapValidator"));
		}.bind(this));

		this.$form.find("select[name=vehicle]").focus();
		this.load();
	};

	FieldTripResourceViewModel.prototype.load = function()
	{
		var p0 = tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "vehicle"))
			.then(function(data)
			{
				data.Items = sortArray(data.Items, "BusNum");
				this.obVehicleSource(data.Items);
			}.bind(this));

		var p1 = tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "staff", "allstaff", 2))
			.then(function(data)
			{
				data.Items = sortArray(data.Items, "FullName");
				this.obDriverSource(data.Items);
			}.bind(this));

		var p1 = tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "staff", "allstaff", 1))
			.then(function(data)
			{
				data.Items = sortArray(data.Items, "FullName");
				this.obBusaideSource(data.Items);
			}.bind(this));

		return Promise.all([p0, p1]);
	};

	FieldTripResourceViewModel.prototype.apply = function()
	{
		return this.save()
			.then(function(data)
			{
				return data;

			}, function()
			{
			});
	};

	FieldTripResourceViewModel.prototype.generateFunction = function(fn)
	{
		return fn.bind(this, Array.prototype.slice.call(arguments, 1));
	}

	FieldTripResourceViewModel.prototype.dispose = function()
	{
		this.pageLevelViewModel.dispose();
	};

})();

