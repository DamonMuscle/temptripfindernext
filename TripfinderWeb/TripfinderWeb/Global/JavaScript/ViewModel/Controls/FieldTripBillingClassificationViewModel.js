(function()
{
	createNamespace('TF.Control').FieldTripBillingClassificationViewModel = FieldTripBillingClassificationViewModel;

	function FieldTripBillingClassificationViewModel(fieldName, id)
	{
		this.fieldName = fieldName;
		this.obEntityDataModel = ko.observable(new TF.DataModel.FieldTripBillingClassificationDataModel());
		this.obEntityDataModel().id(id);
		this.obEntityDataModel().apiIsDirty(false);
		this.obEntityDataModel()._entityBackup = JSON.parse(JSON.stringify(this.obEntityDataModel().toData()));

		this.pageLevelViewModel = new TF.PageLevel.FieldTripBillingClassificationPageLevelViewModel();
	}

	FieldTripBillingClassificationViewModel.prototype.save = function()
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

	FieldTripBillingClassificationViewModel.prototype.init = function(viewModel, el)
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
							data: new TF.DataModel.FieldTripBillingClassificationDataModel({ Name: value, Id: this.obEntityDataModel().id() }).toData()
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

	FieldTripBillingClassificationViewModel.prototype.load = function()
	{
		if (this.obEntityDataModel().id())
		{
			tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), this.fieldName, this.obEntityDataModel().id()))
			.then(function(data)
			{
				this.obEntityDataModel(new TF.DataModel.FieldTripBillingClassificationDataModel(data.Items[0]));
			}.bind(this))
		}

		this.pageLevelViewModel.load(this.$form.data("bootstrapValidator"));
	};

	FieldTripBillingClassificationViewModel.prototype.apply = function()
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

	FieldTripBillingClassificationViewModel.prototype.dispose = function()
	{
		this.pageLevelViewModel.dispose();
	};

})();

