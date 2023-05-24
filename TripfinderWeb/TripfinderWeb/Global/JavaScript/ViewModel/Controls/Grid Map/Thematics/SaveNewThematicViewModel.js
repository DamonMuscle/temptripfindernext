(function()
{
	createNamespace("TF.Control").SaveNewThematicViewModel = SaveNewThematicViewModel;

	function SaveNewThematicViewModel(gridType, thematicType, udgridId)
	{
		var self = this;
		self.gridType = gridType;
		self.name = ko.observable("");
		self.thematicType = thematicType;
		self.udgridId = udgridId;

		self.pageLevelViewModel = new TF.PageLevel.BasePageLevelViewModel();
	};

	/**
	 * Initialization
	 * @return {void}
	 */
	SaveNewThematicViewModel.prototype.init = function(model, element)
	{
		var self = this;
		self.element = element;
		self.initValidation();
	};

	/**
	 * Initialize the validation.
	 * @return {void}
	 */
	SaveNewThematicViewModel.prototype.initValidation = function()
	{
		var self = this,
			validatorFields = {}, validatorPersistence = { "name": false },
			isValidating = false;

		validatorFields.name = {
			trigger: "blur change",
			validators:
			{
				notEmpty: {
					message: " required"
				},
				callback: {
					message: " must be unique",
					callback: function(value, validator, $field)
					{
						if (!value)
						{
							return true;
						}
						$field.addClass("delay-show");
						var $callbackElement = $field.parent().find("[data-bv-validator=callback]"),
							className = validatorPersistence.name ? "always-show" : "always-hide",
							borderColor = validatorPersistence.name ? "#e71931" : "";

						$field.css("border-color", borderColor);
						$callbackElement.addClass(className);
						const paramData = tf.dataTypeHelper.getParamDataByThematicType(self.thematicType, self.gridType, value, self.udgridId);
						return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "thematicconfigs"), {
							paramData: paramData
						}, { overlay: false }).then(function(response)
						{
							var isDuplicated = true;
							if (response.Items.length > 0)
							{
								isDuplicated = false;
							}
							$field.css("border-color", "");
							$callbackElement.removeClass(className);
							validatorPersistence.name = !isDuplicated;
							$field.removeClass("delay-show");
							return isDuplicated;
						});
					}
				}
			}
		};

		$(self.element).bootstrapValidator(
			{
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

		self.pageLevelViewModel.load($(self.element).data("bootstrapValidator"));
	};

	/**
	 * Validate the save process.
	 * @return {Promise} 
	 */
	SaveNewThematicViewModel.prototype.validate = function()
	{
		var self = this;
		return self.pageLevelViewModel.saveValidateExtend().then(function(result)
		{
			if (result)
			{
				return Promise.resolve(self.name());
			}
		});
	};

	/**
	 * Dispose
	 * @return {void}
	 */
	SaveNewThematicViewModel.prototype.dispose = function()
	{
		var self = this;
		self.pageLevelViewModel.dispose();
	};
})();