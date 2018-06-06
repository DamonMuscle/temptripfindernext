(function()
{
	createNamespace('TF.Control').AddTwoFieldsViewModel = AddTwoFieldsViewModel;

	function AddTwoFieldsViewModel(fieldName, id)
	{
		this.fieldName = fieldName;
		this.obName = ko.observable();
		this.obDescriptionVisible = ko.observable(true);
		this.obDescription = ko.observable("Description");//description might be another name either.
		this.obDescriptionRequired = ko.observable(false);
		this.entityDataModel = null;
		switch (fieldName)
		{
			case 'fieldtripclassification':
				this.entityDataModel = TF.DataModel.FieldTripClassificationDataModel;
				this.obName("Code");
				break;
			case 'fieldtripactivity':
				this.entityDataModel = TF.DataModel.FieldTripActivityDataModel;
				this.obName("Code");
				break;
			case 'fieldtripequipment':
				this.entityDataModel = TF.DataModel.FieldTripEquipmentDataModel;
				this.obName(tf.applicationTerm.getApplicationTermSingularByName("Name"));
				break;
			case 'fieldtripdistrictdepartment':
				this.entityDataModel = TF.DataModel.FieldTripDistrictDepartmentDataModel;
				this.obName("Code");
				break;
			case 'documentclassification':
				this.entityDataModel = TF.DataModel.DocumentClassificationDataModel;
				this.obName(tf.applicationTerm.getApplicationTermSingularByName("Name"));
				break;
			case 'vehiclebodytype':
				this.entityDataModel = TF.DataModel.VehicleBodyTypeDataModel;
				this.obName("Name");
				this.obDescriptionVisible(false);
				break;
			case 'vehiclebraketype':
				this.entityDataModel = TF.DataModel.VehicleBrakeTypeDataModel;
				this.obName("Name");
				this.obDescriptionVisible(false);
				break;
			case 'vehiclefueltype':
				this.entityDataModel = TF.DataModel.VehicleFuelTypeDataModel;
				this.obName("Name");
				this.obDescriptionVisible(false);
				break;
			case 'vehiclemake':
				this.entityDataModel = TF.DataModel.VehicleMakeDataModel;
				this.obName("Name");
				this.obDescriptionVisible(false);
				break;
			case 'vehiclemodel':
				this.entityDataModel = TF.DataModel.VehicleModelDataModel;
				this.obName("Name");
				this.obDescriptionVisible(false);
				break;
			case 'vehiclemakeofbody':
				this.entityDataModel = TF.DataModel.VehicleMakeOfBodyDataModel;
				this.obName("Name");
				this.obDescriptionVisible(false);
				break;
			case 'vehiclecategory':
				this.entityDataModel = TF.DataModel.VehicleCategoryDataModel;
				this.obName("Name");
				this.obDescriptionVisible(false);
				break;
			default:
				return;
		}
		this.obEntityDataModel = ko.observable(new this.entityDataModel());
		this.obEntityDataModel().id(id);
		this.obEntityDataModel().apiIsDirty(false);

		this.pageLevelViewModel = new TF.PageLevel.AddTwoFieldsPageViewModel();
	}

	AddTwoFieldsViewModel.prototype.save = function()
	{
		return this.pageLevelViewModel.saveValidate()
		.then(function(result)
		{
			if (result)
			{
				var isNew = this.obEntityDataModel().id() ? false : true;
				return tf.promiseAjax[isNew ? "post" : "put"](pathCombine(tf.api.apiPrefix(), this.fieldName, isNew ? "" : this.obEntityDataModel().id()), { data: this.obEntityDataModel().toData() })
				.then(function(data)
				{
					PubSub.publish(topicCombine(pb.DATA_CHANGE, this.fieldName, pb.EDIT));
					return data.Items[0];
				}.bind(this))
			}
		}.bind(this));
	}

	AddTwoFieldsViewModel.prototype.init = function(viewModel, el)
	{
		var fieldName = this.fieldName;
		this.$form = $(el);
		var validatorFields = {}, isValidating = false, self = this,
			updateErrors = function($field, errorInfo)
			{
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
			};

		validatorFields.name = {
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
							updateErrors($field, "unique");
							return true;
						}
						else
						{
							updateErrors($field, "required");
						}
						return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), fieldName, "unique"), {
							data: new this.entityDataModel(this.getUniqueObject(value, this.obEntityDataModel().id())).toData()
						}, { overlay: false })
							.then(function(apiResponse)
							{
								return apiResponse.Items[0];
							});
					}.bind(this)
				}
			}
		}

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

		this.$form.find("input[name=name]").focus();
		this.load();

		this.LimitInput();
	};

	AddTwoFieldsViewModel.prototype.load = function()
	{
		if (this.obEntityDataModel().id())
		{
			tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), this.fieldName, this.obEntityDataModel().id()))
			.then(function(data)
			{
				this.obEntityDataModel(new this.entityDataModel(data.Items[0]));
			}.bind(this))
		}

		this.pageLevelViewModel.load(this.$form.data("bootstrapValidator"));
	};

	AddTwoFieldsViewModel.prototype.apply = function()
	{
		return this.save()
		.then(function(data)
		{
			return data;
			this.dispose();
		}, function()
		{
		});
	};

	AddTwoFieldsViewModel.prototype.LimitInput = function()
	{
		switch (this.fieldName)
		{
			case 'fieldtripclassification':
				var $name = this.$form.find("input[name=name]");
				$name.attr("maxlength", 50);
				break;
			case 'fieldtripactivity':
				var $name = this.$form.find("input[name=name]");
				$name.attr("maxlength", 50);
				var $description = this.$form.find("input[name=description]");
				$description.attr("maxlength", 32);
				break;
			case 'fieldtripequipment':
				var $name = this.$form.find("input[name=name]");
				$name.attr("maxlength", 100);
				var $description = this.$form.find("input[name=description]");
				$description.attr("maxlength", 250);
				break;
			case 'fieldtripdistrictdepartment':
				var $name = this.$form.find("input[name=name]");
				$name.attr("maxlength", 200);
				break;
			case 'documentclassification':
				var $name = this.$form.find("input[name=name]");
				$name.attr("maxlength", 200);
				break;
			case 'vehiclebodytype':
			case 'vehiclebraketype':
			case 'vehiclefueltype':
			case 'vehiclemake':
			case 'vehiclemodel':
			case 'vehiclemakeofbody':
			case 'vehiclecategory':
				var $name = this.$form.find("input[name=name]");
				$name.attr("maxlength", 180);
				break;
		}
	};
	AddTwoFieldsViewModel.prototype.getUniqueObject = function(value, id)
	{
		switch (this.fieldName)
		{
			case 'fieldtripclassification':
			case 'fieldtripactivity':
			case 'fieldtripdistrictdepartment':
			case 'documentclassification':
			case 'vehiclebodytype':
			case 'vehiclebraketype':
			case 'vehiclefueltype':
			case 'vehiclemake':
			case 'vehiclemodel':
			case 'vehiclemakeofbody':
			case 'vehiclecategory':
				return { Name: value, Id: this.obEntityDataModel().id() };
				break;
			case 'fieldtripequipment':
				return { EquipmentName: value, Id: this.obEntityDataModel().id() };
				break;
		}
		return {};
	}

	AddTwoFieldsViewModel.prototype.dispose = function()
	{
		this.pageLevelViewModel.dispose();
	};

})();

