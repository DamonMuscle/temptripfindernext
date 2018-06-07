(function()
{
	createNamespace('TF.Control').AddOneFieldViewModel = AddOneFieldViewModel;

	function AddOneFieldViewModel(type, fieldName, data)
	{
		this.obFieldName = ko.observable(fieldName);
		this.fieldName = fieldName.toLowerCase();
		this.obFieldValue = ko.observable();
		this.obEntityDataModel = ko.observable(data);
		this.initFileText = this.obEntityDataModel()[this.fieldName]();
		this.type = type;
		this.pageLevelViewModel = new TF.PageLevel.BasePageLevelViewModel();
	}

	AddOneFieldViewModel.prototype.save = function()
	{
		return this.pageLevelViewModel.saveValidate()
			.then(function(result)
			{
				if (result)
				{
					if (this.type === "fieldtriptemplate")
					{// no need to save data in DB, so direct return the value.
						return Promise.resolve(this.obEntityDataModel()[this.fieldName]());
					}
					var isNew = this.obEntityDataModel().id() ? false : true;
					return tf.promiseAjax.put(pathCombine(tf.api.apiPrefix(), this.type), { data: this.obEntityDataModel().toData() })
						.then(function(data)
						{
							PubSub.publish(topicCombine(pb.DATA_CHANGE, this.type, pb.EDIT));
							return data.Items[0];
						}.bind(this))
				}
			}.bind(this));
	}

	AddOneFieldViewModel.prototype.init = function(viewModel, el)
	{
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
		if (this.type === "fieldtriptemplate")
		{
			validatorFields.fieldName = {
				trigger: "blur change",
				validators: {
					notEmpty: {
						message: ' required'
					},
					callback: {
						message: ' must be unique',
						callback: function(value, validator, $field)
						{
							if (value == "" || this.obEntityDataModel()[this.fieldName]() == "")
							{
								return true;
							}

							return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "fieldtriptemplate", "uniquenamecheck"),
								{
									paramData: {
										name: this.obEntityDataModel()[this.fieldName]()
									}
								},
								{ overlay: false })
								.then(function(data)
								{
									return !data.Items.some(function(item)
									{
										return item;
									}.bind(this));
								}.bind(this));
						}.bind(this)
					}
				}
			};
		}
		else
		{
			validatorFields.fieldName = {
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
							var data = { Id: this.obEntityDataModel().id() };
							data[this.obFieldName()] = value;
							return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), this.type, "unique"), {
								data: data
							}, { overlay: false })
								.then(function(apiResponse)
								{
									return apiResponse.Items[0];
								});
						}.bind(this)
					}
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

		this.load();
	};

	AddOneFieldViewModel.prototype.load = function()
	{
		this.pageLevelViewModel.load(this.$form.data("bootstrapValidator"));
	};

	AddOneFieldViewModel.prototype.apply = function()
	{
		return this.save()
			.then(function(data)
			{
				return data;
				this.dispose();
			});
	};

	AddOneFieldViewModel.prototype.dispose = function()
	{
		this.pageLevelViewModel.dispose();
	};

})();

