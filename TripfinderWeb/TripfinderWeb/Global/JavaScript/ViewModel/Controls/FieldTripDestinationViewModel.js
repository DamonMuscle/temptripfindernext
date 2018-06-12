(function()
{
	createNamespace('TF.Control').FieldTripDestinationViewModel = FieldTripDestinationViewModel;

	function FieldTripDestinationViewModel(fieldName, id)
	{
		this.fieldName = fieldName;
		this.obEntityDataModel = ko.observable(new TF.DataModel.FieldTripDestinationDataModel());
		this.obEntityDataModel().id(id);
		this.obEntityDataModel().apiIsDirty(false);
		this.obEntityDataModel()._entityBackup = JSON.parse(JSON.stringify(this.obEntityDataModel().toData()));
		this.obMailCityDataModels = ko.observableArray();

		this.pageLevelViewModel = new TF.PageLevel.FieldTripDestinationPageLevelViewModel();
	}

	FieldTripDestinationViewModel.prototype.save = function()
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

	FieldTripDestinationViewModel.prototype.init = function(viewModel, el)
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
							data: new TF.DataModel.FieldTripDestinationDataModel({ Name: value, Id: this.obEntityDataModel().id() }).toData()
						}, { overlay: false })
						.then(function(apiResponse)
						{
							return apiResponse.Items[0];
						})
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
	};

	FieldTripDestinationViewModel.prototype.load = function()
	{
		tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "dataentry", "list", this.fieldName, "mail_city"))
		.then(function(data)
		{
			this.obMailCityDataModels(data.Items);
		}.bind(this));

		if (this.obEntityDataModel().id())
		{
			tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), this.fieldName, this.obEntityDataModel().id()))
			.then(function(data)
			{
				this.obEntityDataModel(new TF.DataModel.FieldTripDestinationDataModel(data.Items[0]));
			}.bind(this))
		}

		this.pageLevelViewModel.load(this.$form.data("bootstrapValidator"));
	};

	FieldTripDestinationViewModel.prototype.apply = function()
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

	FieldTripDestinationViewModel.prototype.generateFunction = function(fn)
	{
		return fn.bind(this, Array.prototype.slice.call(arguments, 1));
	}

	FieldTripDestinationViewModel.prototype.addDataEntryListItem = function(parameters)
	{
		var modifyDataEntryListItemModalViewModel = new TF.Modal.ModifyDataEntryListItemModalViewModel(parameters[0], this.fieldName, this.localization);
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

	FieldTripDestinationViewModel.prototype.dispose = function()
	{
		this.pageLevelViewModel.dispose();
	};
})();

