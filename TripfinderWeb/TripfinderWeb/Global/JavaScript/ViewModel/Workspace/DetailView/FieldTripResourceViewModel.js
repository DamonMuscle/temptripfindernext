(function()
{
	createNamespace("TF.DetailView").FieldTripResourceViewModel = FieldTripResourceViewModel;

	function getFloatOrNull(value)
	{
		if (typeof (value) === "number")
		{
			return value;
		}

		if (typeof (value) === "string")
		{
			if (value.length == 0) return null;

			//suppose string can be parse to float.  if cannot, exception.
			return parseFloat(value);
		}

		return null;
	};

	/**
	 * sum values, if all value is null, return null.
	 *
	 * @param {Array} values
	 * @returns number
	 */
	function nullableFloatSum(values)
	{
		values = values.map(function(v)
		{
			return getFloatOrNull(v);
		});

		if (values.some(function(v) { return v != null; }))
		{
			return values.reduce(function(total, v)
			{
				return total + v;
			}, 0);
		}

		return null;
	};

	/**
	 * float calculation would cause error number, so it need to be fixed by decimal
	 */
	function fixFloat(value, decimal = 2)
	{
		var v = !IsEmptyString(value) ? value.toFixed(decimal) : value;
		return v;
	}

	function FieldTripResourceViewModel(options)
	{
		var self = this;
		self.pageLevelViewModel = new TF.PageLevel.BasePageLevelViewModel();
		self.options = options;
		options.entity = $.extend({EndingOdometer: null, FuelConsumptionRate: null, StartingOdometer: null}, options.entity);
		tf.measurementUnitConverter.convertToDisplay(options.entity, new TF.DataModel.FieldTripResourceDataModel());
		if(options.BillingClassification != null)
		{
			options.BillingClassification = $.extend({}, options.BillingClassification);
			tf.measurementUnitConverter.convertToDisplay(options.BillingClassification, new TF.DataModel.FieldTripBillingClassificationDataModel());
		}
		self.isSelectedVehicleChanged = false;
		self.isSelectedDriverChanged = false;
		self.isSelectedAideChanged = false;
		self.hasAssignedBillingClas = (self.options.BillingClassification != null);
		self._initVehicleFields();
		self._initDriverFields();
		self._initAideFields();

		self.obTotalCost = ko.computed(function()
		{
			var total = nullableFloatSum([self.obVehicleTotal(), self.obDriverTotal(), self.obAideTotal()]);

			if (total == null) return null;

			return tf.dataFormatHelper.currencyFormatter(total);
		});
	}

	FieldTripResourceViewModel.prototype.init = function(viewModel, el)
	{
		var self = this, promises = [], isValidating = false;

		self.element = el;
		tf.loadingIndicator.showImmediately();
		promises.push(tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "Vehicles?Inactive=false"))
			.then(function(result)
			{
				var vehicles = result.Items;
				vehicles.forEach(v =>
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
				self.obVehicles(vehicles);
				if (!self.options.isNew)
				{
					var selectedVehicle = vehicles.filter(function(v) { return v.Id == self.options.entity.VehicleId; })[0];
					self.obSelectedVehicle(selectedVehicle);
					self.obSelectedVehicleText(selectedVehicle != null ? selectedVehicle.BusNum : null);
				}
			}));

		promises.push(tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "staff?ActiveFlag=true"),
			{
				paramData: {
					staffType: "Driver"
				}
			})
			.then(function(result)
			{
				var drivers = result.Items;
				self.obDrivers([{
					FullName: "(none)",
					Id: -1
				}].concat(drivers));
				if (!self.options.isNew)
				{
					var selectedDriver = drivers.filter(function(v) { return v.Id == self.options.entity.DriverId; })[0];
					self.obSelectedDriver(selectedDriver);
					self.obSelectedDriverText(selectedDriver != null ? selectedDriver.FullName : null);
				}
			}));

		promises.push(tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "staff?ActiveFlag=true"),
			{
				paramData: {
					staffType: "Bus Aide"
				}
			})
			.then(function(result)
			{
				var aides = result.Items;
				self.obAides([{
					FullName: "(none)",
					Id: -1
				}].concat(aides));
				if (!self.options.isNew)
				{
					var selectedAide = aides.filter(function(v) { return v.Id == self.options.entity.AideId; })[0];
					self.obSelectedAide(selectedAide);
					self.obSelectedAideText(selectedAide != null ? selectedAide.FullName : null);
				}
			}));

		Promise.all(promises).then(function()
		{
			tf.loadingIndicator.tryHide();
			var validatorFields = {};
			validatorFields["vehicle"] = {
				trigger: "blur change",
				validators:
				{
					notEmpty:
					{
						message: "required"
					}
				}
			};
			$(self.element).bootstrapValidator(
				{
					excluded: [':hidden', ':not(:visible)'],
					live: 'enabled',
					message: 'This value is not valid',
					fields: validatorFields
				})
				.on('success.field.bv', function(e, data)
				{
					var $parent = data.element.closest('.form-group');
					$parent.removeClass('has-success');
					if (!isValidating)
					{
						isValidating = true;
						self.pageLevelViewModel.saveValidate(data.element);
						isValidating = false;
					}
				});

			self.pageLevelViewModel.load($(self.element).data("bootstrapValidator"));

			self.setValidation();
		});
	};

	FieldTripResourceViewModel.prototype.setValidation = function()
	{
		const $o = $(this.element);
		$o.find("input[name='fuelConsumptionRate']").on("keypress keyup blur", TF.DecimalBoxHelper.precision20scale2);
		$o.find("input[name='odometerstart']").on("keypress keyup blur", TF.DecimalBoxHelper.precision20scale2);
		$o.find("input[name='odometerending']").on("keypress keyup blur", TF.DecimalBoxHelper.precision20scale2);
		$o.find("input[name='driverbillingRate']").on("keypress keyup blur", TF.DecimalBoxHelper.precision20scale2);
		$o.find("input[name='driverbillingotRate']").on("keypress keyup blur", TF.DecimalBoxHelper.precision20scale2);
		$o.find("input[name='aidebillingRate']").on("keypress keyup blur", TF.DecimalBoxHelper.precision20scale2);
		$o.find("input[name='aidebillingotRate']").on("keypress keyup blur", TF.DecimalBoxHelper.precision20scale2);

		$o.find("input[name='fixedcost']").on("keypress keyup blur", TF.DecimalBoxHelper.precision20scale2);
		$o.find("input[name='driverbillingfixedcost']").on("keypress keyup blur", TF.DecimalBoxHelper.precision20scale2);
		$o.find("input[name='expensesparking']").on("keypress keyup blur", TF.DecimalBoxHelper.precision20scale2);
		$o.find("input[name='expensestolls']").on("keypress keyup blur", TF.DecimalBoxHelper.precision20scale2);
		$o.find("input[name='expensesmisc']").on("keypress keyup blur", TF.DecimalBoxHelper.precision20scale2);
		$o.find("input[name='expensesmeals']").on("keypress keyup blur", TF.DecimalBoxHelper.precision20scale2);
		$o.find("input[name='aidebillingfixedcost']").on("keypress keyup blur", TF.DecimalBoxHelper.precision20scale2);
	}

	FieldTripResourceViewModel.prototype._initVehicleFields = function()
	{
		var self = this, isNew = self.options.isNew, entity = self.options.entity;

		self.obVehicles = ko.observableArray([]);
		self.obSelectedVehicle = ko.observable(null);
		self.obSelectedVehicleText = ko.observable(null);
		self.obSelectedVehicle.subscribe(function()
		{
			self._populateVehicleFieldValues();
		});
		self.obOdometerStart = ko.observable(isNew ? null : entity.StartingOdometer);
		self.obOdometerEnding = ko.observable(isNew ? null : entity.EndingOdometer);
		self.obOdometerDifference = ko.computed(function()
		{
			var start = getFloatOrNull(self.obOdometerStart()), ending = getFloatOrNull(self.obOdometerEnding());
			if (start == null || ending == null) return null;

			return fixFloat(ending - start);
		});
		self.obFuelConsumptionRate = ko.observable(isNew ? null : fixFloat(entity.FuelConsumptionRate));
		self.obVehicleFixedCost = ko.observable(isNew ? null : fixFloat(entity.VehFixedCost));
		self.obVehicleTotal = ko.computed(function()
		{
			var difference = getFloatOrNull(self.obOdometerDifference()),
				fixedCost = getFloatOrNull(self.obVehicleFixedCost()),
				milerate = getFloatOrNull(self.obFuelConsumptionRate()),
				total = null, mileCost = null;

			if (difference != null && milerate != null)
			{
				mileCost = fixFloat(difference * milerate);
			}

			total = nullableFloatSum([mileCost, fixedCost]);

			if (total != null)
			{
				return tf.dataFormatHelper.currencyFormatter(fixFloat(total));
			}

			return null;
		});
	};

	FieldTripResourceViewModel.prototype._initDriverFields = function()
	{
		var self = this, isNew = self.options.isNew, entity = self.options.entity;

		self.obDrivers = ko.observableArray([]);
		self.obSelectedDriver = ko.observable(null);
		self.obSelectedDriverText = ko.observable(null);
		self.obSelectedDriver.subscribe(function()
		{
			self._populateDriverFieldValues();
		});
		self.obSelectedDriverIsNull = ko.observable(true);
		self.obDriverBillingHours = ko.observable(isNew ? null : entity.DriverHours);
		self.obDriverBillingRate = ko.observable(isNew ? null : fixFloat(entity.DriverRate));
		self.obDriverBillingCost = ko.computed(function()
		{
			var hour = getFloatOrNull(self.obDriverBillingHours()), rate = getFloatOrNull(self.obDriverBillingRate());
			if (hour == null || rate == null) return null;

			return tf.dataFormatHelper.currencyFormatter(fixFloat(hour * rate));
		});
		self.obDriverBillingOTHours = ko.observable(isNew ? null : entity.DriverOTHours);
		self.obDriverBillingOTRate = ko.observable(isNew ? null : fixFloat(entity.DriverOTRate));
		self.obDriverBillingOTCost = ko.computed(function()
		{
			var hour = getFloatOrNull(self.obDriverBillingOTHours()), rate = getFloatOrNull(self.obDriverBillingOTRate());
			if (hour == null || rate == null) return null;

			return tf.dataFormatHelper.currencyFormatter(fixFloat(hour * rate));
		});
		self.obDriverBillingFixedCost = ko.observable(isNew ? null : fixFloat(entity.DriverFixedCost));
		self.obExpensesParking = ko.observable(isNew ? null : fixFloat(entity.DriverExpParking));
		self.obExpensesTolls = ko.observable(isNew ? null : fixFloat(entity.DriverExpTolls));
		self.obExpensesMeals = ko.observable(isNew ? null : fixFloat(entity.DriverExpMeals));
		self.obExpensesMisc = ko.observable(isNew ? null : fixFloat(entity.DriverExpMisc));
		self.obExpensesCost = ko.computed(function()
		{
			var total = nullableFloatSum([self.obExpensesParking(), self.obExpensesTolls(), self.obExpensesMeals(), self.obExpensesMisc()]);

			if (total != null)
			{
				return tf.dataFormatHelper.currencyFormatter(fixFloat(total));
			}

			return null;
		});
		self.obDriverTotal = ko.computed(function()
		{
			var total = nullableFloatSum([self.obDriverBillingFixedCost(), self.obDriverBillingCost(), self.obDriverBillingOTCost(), self.obExpensesCost()]);

			if (total != null)
			{
				return tf.dataFormatHelper.currencyFormatter(fixFloat(total));
			}

			return null;
		});
	};

	FieldTripResourceViewModel.prototype._initAideFields = function()
	{
		var self = this, isNew = self.options.isNew, entity = self.options.entity;

		self.obAides = ko.observableArray([]);
		self.obSelectedAide = ko.observable(null);
		self.obSelectedAideText = ko.observable(null);
		self.obSelectedAide.subscribe(function()
		{
			self._populateAideFieldValues();
		});
		self.obSelectedAideIsNull = ko.observable(false);
		self.obAideBillingHours = ko.observable(isNew ? null : entity.AideHours);
		self.obAideBillingRate = ko.observable(isNew ? null : fixFloat(entity.AideRate));
		self.obAideBillingCost = ko.computed(function()
		{
			var hour = getFloatOrNull(self.obAideBillingHours()), rate = getFloatOrNull(self.obAideBillingRate());
			if (hour == null || rate == null) return null;

			return tf.dataFormatHelper.currencyFormatter(fixFloat(hour * rate));
		});
		self.obAideBillingOTHours = ko.observable(isNew ? null : entity.AideOTHours);
		self.obAideBillingOTRate = ko.observable(isNew ? null : fixFloat(entity.AideOTRate));
		self.obAideBillingOTCost = ko.computed(function()
		{
			var hour = getFloatOrNull(self.obAideBillingOTHours()), rate = getFloatOrNull(self.obAideBillingOTRate());
			if (hour == null || rate == null) return null;

			return tf.dataFormatHelper.currencyFormatter(fixFloat(hour * rate));
		});
		self.obAideBillingFixedCost = ko.observable(isNew ? null : fixFloat(entity.AideFixedCost));
		self.obAideTotal = ko.computed(function()
		{
			var total = nullableFloatSum([self.obAideBillingFixedCost(), self.obAideBillingCost(), self.obAideBillingOTCost()]);

			if (total != null)
			{
				return tf.dataFormatHelper.currencyFormatter(fixFloat(total));
			}

			return null;
		});
		self.obChaperone1 = ko.observable(isNew ? null : entity.Chaperone);
		self.obChaperone2 = ko.observable(isNew ? null : entity.Chaperone2);
		self.obChaperone3 = ko.observable(isNew ? null : entity.Chaperone3);
		self.obChaperone4 = ko.observable(isNew ? null : entity.Chaperone4);
	};

	FieldTripResourceViewModel.prototype._populateVehicleFieldValues = function()
	{
		var self = this, vehicle = self.obSelectedVehicle(), billingClassification = self.options.BillingClassification;

		if (vehicle && vehicle.Id != -1)
		{
			if (!self.isSelectedVehicleChanged && (self.options.entity == null || vehicle.Id != self.options.entity.VehicleId))
			{
				self.isSelectedVehicleChanged = true;
			}

			if (!self.isSelectedVehicleChanged) return;

			if (!billingClassification)
			{
				self.obFuelConsumptionRate(vehicle.Cost);
			}
			else
			{
				self.obFuelConsumptionRate(billingClassification.FuelConsumptionRate);
				self.obVehicleFixedCost(billingClassification.VehFixedCost);
			}
		}
		else
		{
			self.obFuelConsumptionRate(null);
			self.obVehicleFixedCost(null);
		}
	};

	FieldTripResourceViewModel.prototype._calculateBillingHours = function()
	{
		var self = this, fieldtrip = self.options.fieldtrip, hours;

		if (fieldtrip == null) return null;

		if (fieldtrip.EstimatedReturnDateTime != null && fieldtrip.EstimatedReturnDateTime.length > 0 &&
			fieldtrip.DepartDateTime != null && fieldtrip.DepartDateTime.length > 0)
		{
			hours = (new Date(fieldtrip.EstimatedReturnDateTime) - new Date(fieldtrip.DepartDateTime)) / 1000 / 60 / 60;
		}

		return hours;
	};

	FieldTripResourceViewModel.prototype._populateDriverFieldValues = function()
	{
		var self = this, driver = self.obSelectedDriver(), billingClassification = self.options.BillingClassification;

		if (driver && driver.Id != -1)
		{
			self.obSelectedDriverIsNull(false);
			if (!self.isSelectedDriverChanged && (self.options.entity == null || driver.Id != self.options.entity.DriverId))
			{
				self.isSelectedDriverChanged = true;
			}

			if (!self.isSelectedDriverChanged) return;

			self.obDriverBillingHours(self._calculateBillingHours());
			if (!billingClassification)
			{
				self.obDriverBillingRate(driver.Rate);
				self.obDriverBillingOTRate(driver.Otrate);
			}
			else
			{
				self.obDriverBillingRate(billingClassification.DriverRate);
				self.obDriverBillingOTRate(billingClassification.DriverOTRate);
				self.obDriverBillingFixedCost(billingClassification.DriverFixedCost);
			}
		}
		else
		{
			self.obSelectedDriverIsNull(true);
			self.obDriverBillingHours(null);
			self.obDriverBillingRate(null);
			self.obDriverBillingOTHours(null);
			self.obDriverBillingOTRate(null);
			self.obDriverBillingFixedCost(null);
			self.obExpensesParking(null);
			self.obExpensesTolls(null);
			self.obExpensesMeals(null);
			self.obExpensesMisc(null);
		}
	};

	FieldTripResourceViewModel.prototype._populateAideFieldValues = function()
	{
		var self = this, aide = self.obSelectedAide(), billingClassification = self.options.BillingClassification;

		if (aide && aide.Id != -1)
		{
			this.obSelectedAideIsNull(false);
			if (!self.isSelectedAideChanged && (self.options.entity == null || aide.Id != self.options.entity.AideId))
			{
				self.isSelectedAideChanged = true;
			}

			if (!self.isSelectedAideChanged) return;

			self.obAideBillingHours(self._calculateBillingHours());
			if (!billingClassification)
			{
				self.obAideBillingRate(aide.Rate);
				self.obAideBillingOTRate(aide.Otrate);
			}
			else
			{
				self.obAideBillingRate(billingClassification.AideRate);
				self.obAideBillingOTRate(billingClassification.AideOTRate);
				self.obAideBillingFixedCost(billingClassification.AideFixedCost);
			}
		}
		else
		{
			this.obSelectedAideIsNull(true);
			self.obAideBillingHours(null);
			self.obAideBillingRate(null);
			self.obAideBillingOTRate(null);
			self.obAideBillingFixedCost(null);
			self.obAideBillingOTHours(null);
		}
	};

	FieldTripResourceViewModel.prototype.onCurrencyFieldChange = function(data, evt)
	{
		evt.target.value = tf.dataFormatHelper.currencyFormatter(evt.target.value);
	}

	FieldTripResourceViewModel.prototype.apply = function()
	{
		var self = this;
		return self.pageLevelViewModel.saveValidate().then(function(res)
		{
			if (res)
				return self.save();
			else Promise.resolve(null)
		});
	};

	FieldTripResourceViewModel.prototype.getCurrentEntity = function()
	{
		var self = this, fieldtripResourceEntity = {
			VehicleId: self.obSelectedVehicle() == null ? null : self.obSelectedVehicle().Id,
			DriverId: self.obSelectedDriver() == null ? null : self.obSelectedDriver().Id,
			AideId: self.obSelectedAide() == null ? null : self.obSelectedAide().Id,
			VehicleName: self.obSelectedVehicleText(),
			DriverName: self.obSelectedDriverText(),
			AideName: self.obSelectedAideText(),
			Chaperone: self.obChaperone1(),
			Chaperone2: self.obChaperone2(),
			Chaperone3: self.obChaperone3(),
			Chaperone4: self.obChaperone4(),
			StartingOdometer: self.obOdometerStart(),
			EndingOdometer: self.obOdometerEnding(),
			VehFixedCost: self.obVehicleFixedCost(),
			FuelConsumptionRate: self.obFuelConsumptionRate(),
			DriverHours: self.obDriverBillingHours(),
			DriverRate: self.obDriverBillingRate(),
			DriverOTHours: self.obDriverBillingOTHours(),
			DriverOTRate: self.obDriverBillingOTRate(),
			DriverFixedCost: self.obDriverBillingFixedCost(),
			DriverExpParking: self.obExpensesParking(),
			DriverExpTolls: self.obExpensesTolls(),
			DriverExpMeals: self.obExpensesMeals(),
			DriverExpMisc: self.obExpensesMisc(),
			AideRate: self.obAideBillingRate(),
			AideHours: self.obAideBillingHours(),
			AideOTRate: self.obAideBillingOTRate(),
			AideOTHours: self.obAideBillingOTHours(),
			AideFixedCost: self.obAideBillingFixedCost(),
			TotalCost: self.obTotalCost()
		};
		return fieldtripResourceEntity;
	}

	FieldTripResourceViewModel.prototype.apiIsDirty = function()
	{
		let currentEntity = this.getCurrentEntity(),
			entity = this.options.entity,
			isDirty = false;

		if (entity == null)
		{
			for (let key in currentEntity)
			{
				if (!this.isEmpty(currentEntity[key]))
				{
					isDirty = true;
					break;
				}
			}
		}
		else
		{
			for (let key in currentEntity)
			{
				if (currentEntity[key] != entity[key] && (!this.isEmpty(currentEntity[key]) || !this.isEmpty(entity[key])))
				{
					isDirty = true;
					break;
				}
			}

		}
		return isDirty;
	}

	FieldTripResourceViewModel.prototype.isEmpty = function(val)
	{
		return val === 0 || val === '' || val == null;
	}

	FieldTripResourceViewModel.prototype.save = function()
	{
		let self = this, fieldtripResourceEntity = self.getCurrentEntity();
		tf.measurementUnitConverter.convertToSave(fieldtripResourceEntity, new TF.DataModel.FieldTripResourceDataModel());
		if (self.options.newEntityDataSource)
		{
			var fieldtripResourceData = (new TF.DataModel.FieldTripResourceDataModel(fieldtripResourceEntity)).toData();
			fieldtripResourceData.VehicleName = self.obSelectedVehicleText();
			fieldtripResourceData.DriverName = self.obSelectedDriverText();
			fieldtripResourceData.AideName = self.obSelectedAideText();
			if (self.options.isNew)
			{
				self.options.newEntityDataSource.push(fieldtripResourceData);
			}
			else
			{
				var index = self.options.newEntityDataSource.findIndex(function(item)
				{
					return item._guid == self.options.originalData._guid;
				});

				self.options.newEntityDataSource[index] = fieldtripResourceData;
			}

			return Promise.resolve(true);
		}

		if (self.options.isNew)
		{
			fieldtripResourceEntity.FieldTripId = self.options.fieldtrip.Id;
			return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "FieldTripResourceGroups"), {
				data: [fieldtripResourceEntity]
			}).then(function(res)
			{
				return $.extend(res.Items[0], {
					VehicleName: self.obSelectedVehicleText(),
					DriverName: self.obSelectedDriverText(),
					AideName: self.obSelectedAideText(),
				});
			});
		}
		return tf.promiseAjax.put(pathCombine(tf.api.apiPrefix(), "FieldTripResourceGroups"), {
			data: [$.extend(self.options.entity, fieldtripResourceEntity)]
		}).then(function(res)
		{
			return $.extend(res.Items[0], {
				VehicleName: self.obSelectedVehicleText(),
				DriverName: self.obSelectedDriverText(),
				AideName: self.obSelectedAideText(),
			});
		});
	};
	FieldTripResourceViewModel.prototype.dispose = function()
	{
		var self = this;
		self.pageLevelViewModel.dispose();
	}
})();