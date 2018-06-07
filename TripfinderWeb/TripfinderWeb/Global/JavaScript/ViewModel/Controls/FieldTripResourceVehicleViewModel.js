(function()
{
	createNamespace('TF.Control').FieldTripResourceVehicleViewModel = FieldTripResourceVehicleViewModel;

	function FieldTripResourceVehicleViewModel(source, id)
	{
		this.id = id;
		this.source = source;
		this.obEntityDataModel = ko.observable(new TF.DataModel.FieldTripResourceDataModel(source));
		this.obEntityDataModel().fieldTripId(this.id);
		this.obVehicleSource = ko.observableArray();
		this.obDriverSource = ko.observableArray();

		this.obVehTotal = ko.computed(function()
		{
			return (Number(this.obEntityDataModel().endingodometer()) - Number(this.obEntityDataModel().startingodometer())) * Number(this.obEntityDataModel().mileageRate())
				+ Number(this.obEntityDataModel().vehFixedCost());
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
		this.obSelectedVehicleText = ko.observable();
	}

	FieldTripResourceVehicleViewModel.prototype.save = function()
	{
		return this.pageLevelViewModel.saveValidate()
		.then(function(result)
		{
			if (result)
			{
				var entity = this.obEntityDataModel().toData();
				entity.VehicleName = this.obSelectedVehicleText();
				return entity;
			}
		}.bind(this));
	}

	FieldTripResourceVehicleViewModel.prototype.init = function(viewModel, el)
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

	FieldTripResourceVehicleViewModel.prototype.load = function()
	{
		var p0 = tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "vehicle"))
		.then(function(data)
		{
			this.obVehicleSource(data.Items);

			if (this.source)
			{
				this.obEntityDataModel().vehicleId(this.source.VehicleId);
			}

		}.bind(this));
	};

	FieldTripResourceVehicleViewModel.prototype.apply = function()
	{
		return this.save()
		.then(function(data)
		{
			return data;

		}, function()
		{
		});
	};

	FieldTripResourceVehicleViewModel.prototype.generateFunction = function(fn)
	{
		return fn.bind(this, Array.prototype.slice.call(arguments, 1));
	}

	FieldTripResourceVehicleViewModel.prototype.dispose = function()
	{
		this.pageLevelViewModel.dispose();
	};

})();

