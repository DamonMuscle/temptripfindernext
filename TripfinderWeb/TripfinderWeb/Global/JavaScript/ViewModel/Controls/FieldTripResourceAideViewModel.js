(function()
{
	createNamespace('TF.Control').FieldTripResourceAideViewModel = FieldTripResourceAideViewModel;

	function FieldTripResourceAideViewModel(source, id)
	{
		this.obEntityDataModel = ko.observable(new TF.DataModel.FieldTripResourceDataModel(source));
		this.obEntityDataModel().fieldTripId(id);
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
		this.obSelectedVehicleText = ko.observable(source ? source.VehicleName : undefined);

		this.obSelectedBusAide = ko.observable();
		this.obSelectedBusAide.subscribe(TF.Helper.DropDownMenuHelper.setSelectValue(this, "aideId", "obSelectedBusAide", function(obj) { return obj ? obj.Id : 0; }), this);
		this.obSelectedBusAideText = ko.observable(source ? source.AideName : undefined);
		this.obEntityDataModel().apiIsDirty(false);
	}

	FieldTripResourceAideViewModel.prototype.save = function()
	{
		return this.pageLevelViewModel.saveValidate()
			.then(function(result)
			{
				if (result)
				{
					var entity = this.obEntityDataModel().toData();
					entity.VehicleName = this.obSelectedVehicleText();
					if (entity.AideId != 0)
					{
						entity.AideName = this.obSelectedBusAideText();
					}
					return entity;
				}
			}.bind(this));
	}

	FieldTripResourceAideViewModel.prototype.init = function(viewModel, el)
	{
		this.$form = $(el);
		var validatorFields = {}, isValidating = false, self = this;

		validatorFields.busAideVehicle = {
			trigger: "blur change",
			validators: {
				notEmpty: {
					message: "required"
				}
			}
		};
		validatorFields.aide = {
			trigger: "blur change",
			validators: {
				notEmpty: {
					message: "required"
				}
			}
		};


		setTimeout(function()
		{
			this.$form.bootstrapValidator({
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

	FieldTripResourceAideViewModel.prototype.load = function()
	{
		var p0 = tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "vehicle"))
			.then(function(data)
			{
				this.obVehicleSource(data.Items);

			}.bind(this));

		var p1 = tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "staff"))
			.then(function(data)
			{
				//data.Items.unshift({ FullName: " [None]", Id: "0" })
				this.obDriverSource(data.Items);

			}.bind(this));

		return Promise.all([p0, p1]);
	};

	FieldTripResourceAideViewModel.prototype.apply = function()
	{
		return this.save()
			.then(function(data)
			{
				return data;

			}, function()
			{
			});
	};

	FieldTripResourceAideViewModel.prototype.generateFunction = function(fn)
	{
		return fn.bind(this, Array.prototype.slice.call(arguments, 1));
	}

	FieldTripResourceAideViewModel.prototype.dispose = function()
	{
		this.pageLevelViewModel.dispose();
	};

})();

