(function()
{
	createNamespace('TF.Control').FieldTripResourceViewModel = FieldTripResourceViewModel;

	function FieldTripResourceViewModel(source, id, resourceGroupDate, obFieldTrip)
	{
		this.obEntityDataModel = ko.observable(new TF.DataModel.FieldTripResourceDataModel(source));
		this.obEntityDataModel().fieldTripId(id);
		this.obVehicleSource = ko.observableArray();
		this.obDriverSource = ko.observableArray();
		this.obBusaideSource = ko.observableArray();
		this.obFieldTrip = obFieldTrip && obFieldTrip.toData();
		this.obEditTieldTrip = ko.observable(id == 0 ? false : true);
		this.resourceGroupDate = resourceGroupDate;
		this.source = source;
		this.vehicleIdChanged = false;
		this.driverIdChanged = false;
		this.aideIdChanged = false;

		this.obVehTotal = ko.computed(function()
		{
			var value;
			if (this.obEditTieldTrip())
			{
				value = (Number(this.obEntityDataModel().endingOdometer()) - Number(this.obEntityDataModel().startingOdometer())) * Number(this.obEntityDataModel().fuelConsumptionRate())
					+ Number(this.obEntityDataModel().vehFixedCost()) || 0;
			}
			else
			{
				value = Number(this.obEntityDataModel().vehFixedCost()) || 0;
			}
			return value.toFixed(2);
		}.bind(this));

		this.obDriverTotal = ko.computed(function()
		{
			var value = (Number(this.obEntityDataModel().driverHours()) * Number(this.obEntityDataModel().driverRate())
				+ Number(this.obEntityDataModel().driverOTHours()) * Number(this.obEntityDataModel().driverOTRate())
				+ Number(this.obEntityDataModel().driverFixedCost())
				+ Number(this.obEntityDataModel().driverExpParking())
				+ Number(this.obEntityDataModel().driverExpTolls())
				+ Number(this.obEntityDataModel().driverExpMeals())
				+ Number(this.obEntityDataModel().driverExpMisc())) || 0;
			return value.toFixed(2);
		}.bind(this));

		this.obAideTotal = ko.computed(function()
		{
			var value = (Number(this.obEntityDataModel().aideHours()) * Number(this.obEntityDataModel().aideRate())
				+ Number(this.obEntityDataModel().aideOTHours()) * Number(this.obEntityDataModel().aideOTRate())
				+ Number(this.obEntityDataModel().aideFixedCost())) || 0;
			return value.toFixed(2);
		}.bind(this));

		this.pageLevelViewModel = new TF.PageLevel.BaseDataEntryPageLevelViewModel();

		//drop down list
		this.obSelectedVehicle = ko.observable();
		this.obSelectedVehicle.subscribe(function(e)
		{
			if (!this.vehicleIdChanged && e && source && e.Id !== source.VehicleId)
			{
				this.vehicleIdChanged = true;
			}
			if (e && this.obEntityDataModel().vehicleId() != e.Id)
			{
				if (this.obFieldTrip)
				{
					this.obEntityDataModel().fuelConsumptionRate(this.obFieldTrip.FuelConsumptionRate || e.Cost ? this.obFieldTrip.FuelConsumptionRate || e.Cost : 0);
					this.obEntityDataModel().vehFixedCost(this.obFieldTrip.FixedCost ? this.obFieldTrip.FixedCost : 0);
				}
				else
				{
					this.obEntityDataModel().fuelConsumptionRate(e.Cost ? e.Cost : 0);
				}
			}
		}.bind(this));
		this.obSelectedVehicle.subscribe(TF.Helper.DropDownMenuHelper.setSelectValue(this, "vehicleId", "obSelectedVehicle", function(obj) { return obj ? obj.Id : 0; }), this);
		this.obSelectedVehicleText = ko.observable(source ? source.VehicleName : undefined);
		this.obSelectedDriverVehicleDisable = ko.observable(true);

		this.obSelectedDriver = ko.observable();
		this.obSelectedDriver.subscribe(function(e)
		{
			if (e && this.obEntityDataModel().driverId() != e.Id)
			{
				if (this.obFieldTrip)
				{
					this.obEntityDataModel().driverRate(this.obFieldTrip.DriverRate || e.Rate ? this.obFieldTrip.DriverRate || e.Rate : 0);
					this.obEntityDataModel().driverOTRate(this.obFieldTrip.DriverOtrate || e.Otrate ? this.obFieldTrip.DriverOtrate || e.Otrate : 0);
					this.obEntityDataModel().driverFixedCost(this.obFieldTrip.DriverFixedCost ? this.obFieldTrip.DriverFixedCost : 0);
				}
				else
				{
					this.obEntityDataModel().driverRate(e.Rate ? e.Rate : 0);
					this.obEntityDataModel().driverOTRate(e.Otrate ? e.Otrate : 0);
				}
			}
		}.bind(this));
		this.obSelectedDriver.subscribe(TF.Helper.DropDownMenuHelper.setSelectValue(this, "driverId", "obSelectedDriver", function(obj) { return obj ? obj.Id : 0; }), this);
		this.obSelectedDriverText = ko.observable(source ? source.DriverName : undefined);

		this.obSelectedBusAide = ko.observable();
		this.obSelectedBusAide.subscribe(function(e)
		{
			if (e && this.obEntityDataModel().aideId() != e.Id)
			{
				if (this.obFieldTrip)
				{
					this.obEntityDataModel().aideRate(this.obFieldTrip.AideRate || e.Rate ? this.obFieldTrip.AideRate || e.Rate : 0);
					this.obEntityDataModel().aideOTRate(this.obFieldTrip.AideOtrate || e.Otrate ? this.obFieldTrip.AideOtrate || e.Otrate : 0);
					this.obEntityDataModel().aideFixedCost(this.obFieldTrip.AideFixedCost ? this.obFieldTrip.AideFixedCost : 0);
				}
				else
				{
					this.obEntityDataModel().aideRate(e.Rate ? e.Rate : 0);
					this.obEntityDataModel().aideOTRate(e.Otrate ? e.Otrate : 0);
				}
			}
		}.bind(this));
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
		this.setValidation();
	};


	FieldTripResourceViewModel.prototype.setValidation = function()
	{
		this.$form.find("input[name='fuelConsumptionRate']").on("keypress keyup blur", TF.DecimalBoxHelper.precision20scale2);
		this.$form.find("input[name='startingOdometer']").on("keypress keyup blur", TF.DecimalBoxHelper.precision20scale2);
		this.$form.find("input[name='endingOdometer']").on("keypress keyup blur", TF.DecimalBoxHelper.precision20scale2);
		this.$form.find("input[name='driverRate']").on("keypress keyup blur", TF.DecimalBoxHelper.precision20scale2);
		this.$form.find("input[name='driverOtrate']").on("keypress keyup blur", TF.DecimalBoxHelper.precision20scale2);
		this.$form.find("input[name='aideRate']").on("keypress keyup blur", TF.DecimalBoxHelper.precision20scale2);
		this.$form.find("input[name='aideOtrate']").on("keypress keyup blur", TF.DecimalBoxHelper.precision20scale2);
	}

	FieldTripResourceViewModel.prototype.load = function()
	{
		var p0 = tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), tf.DataTypeHelper.getEndpoint("vehicle")))
			.then(function(data)
			{
				var vehicleItems = (data && Array.isArray(data.Items)) ? data.Items.filter(function(item)
				{
					return !!$.trim(item.BusNum);
				}) : [];
				vehicleItems = sortArray(vehicleItems, "BusNum");
				vehicleItems.forEach(v =>
				{
					v.Cost = tf.measurementUnitConverter.convert({
						value: v.Cost,
						originalUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Metric,
						targetUnit: tf.measurementUnitConverter.getCurrentUnitOfMeasure(),
						isReverse: true,
						keep2Decimal: true,
						precision: 2
					});
				});
				this.obVehicleSource(vehicleItems);
			}.bind(this));

		var p1 = tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "staff?staffTypeId=2"))
			.then(function(data)
			{
				var driverItems = (data && Array.isArray(data.Items)) ? data.Items.filter(function(item)
				{
					return !!$.trim(item.FullName);
				}) : [];
				driverItems = sortArray(driverItems, "FullName");
				this.obDriverSource(driverItems);
			}.bind(this));

		var p2 = tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "staff?staffTypeId=1"))
			.then(function(data)
			{
				var busaideItems = (data && Array.isArray(data.Items)) ? data.Items.filter(function(item)
				{
					return !!$.trim(item.FullName);
				}) : [];
				busaideItems = sortArray(busaideItems, "FullName");
				this.obBusaideSource(busaideItems);
			}.bind(this));

		return Promise.all([p0, p1, p2]);
	};

	FieldTripResourceViewModel.prototype.apply = function()
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

	FieldTripResourceViewModel.prototype.generateFunction = function(fn)
	{
		return fn.bind(this, Array.prototype.slice.call(arguments, 1));
	};

	FieldTripResourceViewModel.prototype.checkIfVehicleAssigned = function()
	{
		if (this.source && !this.vehicleIdChanged)
		{
			return true;
		}

		const vehicleId = this.obSelectedVehicle() ? this.obSelectedVehicle().Id : null;

		if (this.resourceGroupData && this.resourceGroupData.some(item => item.VehicleId === vehicleId))
		{
			return false;
		}
		else
		{
			return true;
		}
	};

	FieldTripResourceViewModel.prototype.IsRequired = function(item)
	{
		return item ? { required: "required" } : {};
	};

	FieldTripResourceViewModel.prototype.dispose = function()
	{
		this.pageLevelViewModel.dispose();
	};

})();

