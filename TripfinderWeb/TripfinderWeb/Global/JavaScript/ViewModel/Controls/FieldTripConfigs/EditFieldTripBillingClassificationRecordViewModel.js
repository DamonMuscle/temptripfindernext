(function()
{
	createNamespace('TF.Control').EditFieldTripBillingClassificationRecordViewModel = EditFieldTripBillingClassificationRecordViewModel;

	function EditFieldTripBillingClassificationRecordViewModel(configType, recordEntity)
	{
		var self = this;

		TF.Control.EditFieldTripConfigRecordViewModelBase.call(self, configType, recordEntity);

		self.originalClassification = self.isEdit ? recordEntity.Classification : "";
		self.obClassification = ko.observable(self.originalClassification);	// not nullable
		self.obFuelConsumptionRate = ko.observable(self.isEdit ? tf.dataFormatHelper.currencyFormatter(recordEntity.FuelConsumptionRate) : null);
		self.obFixedCost = ko.observable(self.isEdit ? tf.dataFormatHelper.currencyFormatter(recordEntity.FixedCost) : null);
		self.obAideFixedCost = ko.observable(self.isEdit ? tf.dataFormatHelper.currencyFormatter(recordEntity.AideFixedCost) : null);
		self.obDriverFixedCost = ko.observable(self.isEdit ? tf.dataFormatHelper.currencyFormatter(recordEntity.DriverFixedCost) : null);
		self.obVehFixedCost = ko.observable(self.isEdit ? tf.dataFormatHelper.currencyFormatter(recordEntity.VehFixedCost) : null);
		self.obMinimumCost = ko.observable(self.isEdit ? tf.dataFormatHelper.currencyFormatter(recordEntity.MinimumCost) : null);
		self.obDriverRate = ko.observable(self.isEdit ? tf.dataFormatHelper.currencyFormatter(recordEntity.DriverRate) : null);
		self.obDriverOTRate = ko.observable(self.isEdit ? tf.dataFormatHelper.currencyFormatter(recordEntity.DriverOTRate) : null);
		self.obAideRate = ko.observable(self.isEdit ? tf.dataFormatHelper.currencyFormatter(recordEntity.AideRate) : null);
		self.obAideOTRate = ko.observable(self.isEdit ? tf.dataFormatHelper.currencyFormatter(recordEntity.AideOTRate) : null);

		self.onCurrencyFieldChange = self.onCurrencyFieldChange.bind(self);
	}

	EditFieldTripBillingClassificationRecordViewModel.prototype = Object.create(TF.Control.EditFieldTripConfigRecordViewModelBase.prototype);

	EditFieldTripBillingClassificationRecordViewModel.prototype.constructor = EditFieldTripBillingClassificationRecordViewModel;

	EditFieldTripBillingClassificationRecordViewModel.prototype.onCurrencyFieldChange = function(decimalBox, evt)
	{
		evt.target.value = tf.dataFormatHelper.currencyFormatter(evt.target.value);
	};

	EditFieldTripBillingClassificationRecordViewModel.prototype.getRecordEntity = function()
	{
		var self = this;

		return {
			Id: self.obRecordId(),
			Classification: self.obClassification(),
			FuelConsumptionRate: tf.measurementUnitConverter.convert({
				originalUnit: tf.measurementUnitConverter.getCurrentUnitOfMeasure(),
				targetUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Metric,
				value: self.obFuelConsumptionRate(),
				isReverse: true,
				precision: 12,
			}),
			FixedCost: self.obFixedCost(),
			AideFixedCost: self.obAideFixedCost(),
			DriverFixedCost: self.obDriverFixedCost(),
			VehFixedCost: self.obVehFixedCost(),
			MinimumCost: self.obMinimumCost(),
			DriverRate: self.obDriverRate(),
			DriverOTRate: self.obDriverOTRate(),
			AideRate: self.obAideRate(),
			AideOTRate: self.obAideOTRate()
		};
	};

	EditFieldTripBillingClassificationRecordViewModel.prototype.updateValidatorFields = function(validatorFields)
	{
		var self = this,
			numericValidator = {
				trigger: "change",
				validators: {
					numeric: {
						message: " invalid number"
					},
					greaterThan: {
						message: " must be >= 0",
						inclusive: true,
						value: 0
					}
				}
			};

		validatorFields.minimumCost = numericValidator;
		validatorFields.fixedCost = numericValidator;
		validatorFields.fuelConsumptionRate = numericValidator;
		validatorFields.vehFixedCost = numericValidator;
		validatorFields.driverRate = numericValidator;
		validatorFields.driverFixedCost = numericValidator;
		validatorFields.driverOTRate = numericValidator;
		validatorFields.aideRate = numericValidator;
		validatorFields.aideFixedCost = numericValidator;
		validatorFields.aideOTRate = numericValidator;
	};



})();

