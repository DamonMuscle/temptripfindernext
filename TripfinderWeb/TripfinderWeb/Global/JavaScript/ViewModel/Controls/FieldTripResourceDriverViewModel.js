(function()
{
	createNamespace('TF.Control').FieldTripResourceDriverViewModel = FieldTripResourceDriverViewModel;

	function FieldTripResourceDriverViewModel(source, id, resourceGroupDate)
	{
		this.obEntityDataModel = ko.observable(new TF.DataModel.FieldTripResourceDataModel(source));
		this.obEntityDataModel().fieldTripId(id);
		this.obVehicleSource = ko.observableArray();
		this.obDriverSource = ko.observableArray();
		this.resourceGroupDate = resourceGroupDate;
		this.source = source;
		this.vehicleIdChanged = false;

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
		this.obSelectedVehicle.subscribe(function(e)
		{
			if (!this.vehicleIdChanged && e && source && e.Id !== source.VehicleId)
			{
				this.vehicleIdChanged = true;
			}
		}.bind(this));
		this.obSelectedVehicleText = ko.observable(source ? source.VehicleName : undefined);

		this.obSelectedDriver = ko.observable();
		this.obSelectedDriver.subscribe(TF.Helper.DropDownMenuHelper.setSelectValue(this, "driverId", "obSelectedDriver", function(obj) { return obj ? obj.Id : 0; }), this);
		this.obSelectedDriverText = ko.observable(source ? source.DriverName : undefined);
		this.obEntityDataModel().apiIsDirty(false);
	}

	FieldTripResourceDriverViewModel.prototype.save = function()
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
					return entity;
				}
			}.bind(this));
	}

	FieldTripResourceDriverViewModel.prototype.init = function(viewModel, el)
	{
		this.$form = $(el);
		var validatorFields = {}, isValidating = false, self = this;

		validatorFields.driverVehicle = {
			trigger: "blur change",
			validators: {
				notEmpty: {
					message: "required"
				}
			}
		}

		validatorFields.driver = {
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

	FieldTripResourceDriverViewModel.prototype.load = function()
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

		return Promise.all([p0, p1]);
	};

	FieldTripResourceDriverViewModel.prototype.apply = function()
	{
		if (!this.checkIfVehicleAssigned())
		{
			return tf.promiseBootbox.yesNo({ message: "This Vehicle is already scheduled for this Field Trip. Are you sure you want to assign this resource to this Field Trip?", backdrop: true, title: "Alert", closeButton: true })
				.then(function(result)
				{
					if (result === true)
					{
						return this.save()
							.then(function(data)
							{
								return data;
							}, function()
							{
							});
					}
					if (result === false)
					{
						return false;
					}
				}.bind(this))
		}
		else
		{
			return this.save()
				.then(function(data)
				{
					return data;
				}, function()
				{
				});
		}
	};

	FieldTripResourceDriverViewModel.prototype.generateFunction = function(fn)
	{
		return fn.bind(this, Array.prototype.slice.call(arguments, 1));
	}

	FieldTripResourceDriverViewModel.prototype.checkIfVehicleAssigned = function()
	{
		if (this.source && !this.vehicleIdChanged)
		{
			return true;
		}

		if (this.resourceGroupDate.filter(function(item){return item.VehicleId == this.obSelectedVehicle().Id}.bind(this)).length > 0)
		{
			return false;
		}
		else
		{
			return true;
		}
	}

	FieldTripResourceDriverViewModel.prototype.dispose = function()
	{
		this.pageLevelViewModel.dispose();
	};

})();

