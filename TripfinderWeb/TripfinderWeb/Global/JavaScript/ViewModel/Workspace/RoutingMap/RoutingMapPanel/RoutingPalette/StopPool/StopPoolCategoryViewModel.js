(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").StopPoolCategoryViewModel = StopPoolCategoryViewModel;

	function StopPoolCategoryViewModel(data, eventType)
	{
		this.element = null;
		this.stopPoolCategoryDataModel = new TF.DataModel.StopPoolCategoryDataModel(data);
		this.editType = ko.observable(eventType);
		this.obNameEnable = ko.observable(!data || data.Name != "Default");
		// validation
		this.pageLevelViewModel = new TF.PageLevel.BasePageLevelViewModel();
	}

	StopPoolCategoryViewModel.prototype.init = function(viewModel, e)
	{
		var self = this;
		self.element = $(e);
		self.initValidation();
	};

	StopPoolCategoryViewModel.prototype.updateErrors = function($field, errorInfo)
	{
		var self = this;
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

	StopPoolCategoryViewModel.prototype.initValidation = function()
	{
		var self = this;
		setTimeout(function()
		{
			self.$form = self.element;
			var validatorFields = {},
				isValidating = false;

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
								self.updateErrors($field, "unique");
								return true;
							}
							self.updateErrors($field, "required");
							return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "stoppoolcategories"), {
								paramData: {
									dbid: tf.datasourceManager.databaseId,
									name: self.stopPoolCategoryDataModel.name()
								}
							}, { overlay: false }).then(function(data)
							{
								if (data.Items.length > 0 && data.Items[0].Id !== self.stopPoolCategoryDataModel.id())
								{
									return false;
								}

								return true;
							});
						}
					}
				}
			};
			if (self.$form.data("bootstrapValidator"))
			{
				self.$form.data("bootstrapValidator").destroy();
			}
			self.$form.bootstrapValidator({
				excluded: [":hidden", ":not(:visible)"],
				live: "enabled",
				message: "This value is not valid",
				fields: validatorFields
			}).on("success.field.bv", function(e, data)
			{
				if (!isValidating)
				{
					isValidating = true;
					self.pageLevelViewModel.saveValidate(data.element);
					isValidating = false;
				}
			});
			self.pageLevelViewModel.load(self.$form.data("bootstrapValidator"));
		});
	};

	/**
	* cancel or apply part
	*/
	StopPoolCategoryViewModel.prototype.cancel = function()
	{
		var self = this;
		if (this.editType().indexOf("new") >= 0)
		{
			return tf.promiseBootbox.yesNo("Are you sure you want to cancel?", "Unsaved Changes")
				.then(function(result)
				{
					if (result)
					{
						return false;
					}
					return Promise.reject();
				});
		}
		if (this.stopPoolCategoryDataModel.apiIsDirty())
		{
			return tf.promiseBootbox.yesNo("You have unsaved changes.  Would you like to save your changes prior to canceling?", "Unsaved Changes")
				.then(function(result)
				{
					if (result)
					{
						return self.apply();
					}
					return result;
				});
		}
		return Promise.resolve(false);
	};

	StopPoolCategoryViewModel.prototype.apply = function()
	{
		var self = this;
		return self.pageLevelViewModel.saveValidate().then(function(result)
		{
			if (!result)
			{
				return false;
			}
			var data = self.stopPoolCategoryDataModel.toData();
			data.DBID = tf.datasourceManager.databaseId;
			return tf.promiseAjax[data.Id > 0 ? "put" : "post"](pathCombine(tf.api.apiPrefixWithoutDatabase(), "stoppoolcategories"), {
				data: [data]
			}).then(function(apiResponse)
			{
				return apiResponse.Items[0];
			});
		});
	};
})();