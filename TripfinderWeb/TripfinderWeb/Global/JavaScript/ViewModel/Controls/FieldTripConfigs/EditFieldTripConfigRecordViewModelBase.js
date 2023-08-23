(function()
{
	createNamespace('TF.Control').EditFieldTripConfigRecordViewModelBase = EditFieldTripConfigRecordViewModelBase;

	function EditFieldTripConfigRecordViewModelBase(configType, recordEntity)
	{
		var self = this,
			cfgMetadata = tf.FieldTripGridConfigs.getConfigMetadataBykey(configType);

		self.isEdit = recordEntity ? true : false;
		self.configType = configType;
		self.obRecordId = ko.observable(self.isEdit ? (recordEntity.ID || recordEntity.Id) : -1);
		self.init = self.init.bind(self);
		self.pageLevelViewModel = new TF.PageLevel.BasePageLevelViewModel();
		self.dataModel = new TF.DataModel.FieldTripConfigsDataModel(cfgMetadata.definition.Columns, recordEntity);
		self.obEntityDataModel = ko.observable(self.dataModel);
	}

	EditFieldTripConfigRecordViewModelBase.prototype.constructor = EditFieldTripConfigRecordViewModelBase;

	EditFieldTripConfigRecordViewModelBase.prototype.save = function()
	{
		var self = this;

		return self.pageLevelViewModel.saveValidate()
			.then(function(result)
			{
				var configType = self.configType,
					isNew = self.obRecordId() === -1,
					recordEntity = self.getRecordEntity();

				if (result && recordEntity)
				{
					var saveActionPromise = (isNew ? tf.fieldTripConfigsDataHelper.addNewConfigRecordByType(configType, recordEntity) : tf.fieldTripConfigsDataHelper.updateConfigRecordByType(configType, recordEntity));
					return saveActionPromise;
				}

				return null;;
			});
	}

	EditFieldTripConfigRecordViewModelBase.prototype.getRecordEntity = function()
	{
		return null;
	}

	EditFieldTripConfigRecordViewModelBase.prototype.init = function(viewModel, el)
	{
		var self = this;

		self.$element = $(el);

		setTimeout(function()	// defer the validator loading (in pageLevelViewModel in separate tick)
		{
			self.initValidation();
			self.pageLevelViewModel.load(self.$element.data("bootstrapValidator"));
		}, 500);
	};

	EditFieldTripConfigRecordViewModelBase.prototype.initValidation = function()
	{
		var self = this,
			isValidating = false,
			validatorFields = {},
			dataModel = self.obEntityDataModel(),
			uniqueField = dataModel.uniqueField,
			fieldKey = uniqueField && uniqueField.field,
			$form = self.$element;

		if (uniqueField != null)
		{
			validatorFields[fieldKey] = {
				trigger: "change",
				validators: {
					notEmpty: {
						message: "required"
					},
					callback: {
						message: "unique",
						callback: function(value, validator, $field)
						{
							var originalValue = dataModel._entityBackup[fieldKey];
							if (uniqueField.type === "date")
							{
								if (!value && $field.data("bv.result.notEmpty") === validator.STATUS_INVALID)
								{
									return { valid: true }; // already validated failed by the notEmpty validator
								}
								else
								{
									value = self.normalizeDateString(value);
									if (value === null)
									{
										return { valid: false, message: " must be valid date" };
									}
								}
								originalValue = self.normalizeDateString(originalValue);
							}
							
							value = value || "";
							//if unique value is not changed, no need to check existing record.
							if ((originalValue && originalValue.trim().toLowerCase()) === value.trim().toLowerCase())
							{
								return { valid: true };
							}

							var recordEntity = {};
							recordEntity[fieldKey] = value.trim();

							return tf.fieldTripConfigsDataHelper.isRecordExistingByType(self.configType, recordEntity).then(function(existed)
							{
								return { valid: !existed, message: "already exists" };
							});
						}
					}
				}
			};
		}

		self.updateValidatorFields(validatorFields);

		$form.bootstrapValidator({
			excluded: [':hidden', ':not(:visible)'],
			live: 'enabled',
			message: 'This value is not valid',
			fields: validatorFields
		}).on('success.field.bv', function(e, data)
		{
			if (!isValidating)
			{
				isValidating = true;
				self.pageLevelViewModel.saveValidate(data.element).then(function()
				{
					isValidating = false;
				});
			}
		});

		self.formValidator = $form.data("bootstrapValidator");
	};

	EditFieldTripConfigRecordViewModelBase.prototype.normalizeDateString = function(dateStr, fmt)
	{
		var mmtObj = moment(dateStr),
			timeStr = "T00:00:00.000";

		if (!mmtObj || !mmtObj.isValid()) return null;
		if (mmtObj.year() >= 10000) return null;

		if (fmt)
		{
			return mmtObj.format(fmt);
		} else
		{
			return mmtObj.format("YYYY-MM-DD") + timeStr;
		}
	}

	EditFieldTripConfigRecordViewModelBase.prototype.updateValidatorFields = function(validatorFields)
	{

	}

	EditFieldTripConfigRecordViewModelBase.prototype.apply = function()
	{
		var self = this;

		return self.save()
			.then(function(savedRecord)
			{
				return savedRecord;
			})
			.catch(function(err)
			{
				return null;
			});
	};

	EditFieldTripConfigRecordViewModelBase.prototype.dispose = function()
	{
		var self = this;

		self.pageLevelViewModel.dispose();
		self.pageLevelViewModel = null;
	};

})();

