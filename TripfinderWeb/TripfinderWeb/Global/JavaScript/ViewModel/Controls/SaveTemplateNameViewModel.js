﻿(function()
{
	createNamespace("TF.Control").SaveTemplateNameViewModel = SaveTemplateNameViewModel;

	function SaveTemplateNameViewModel(entity)
	{
		var self = this;
		self.entity = entity;
		self.name = ko.observable(self.entity.name());

		self.pageLevelViewModel = new TF.PageLevel.BasePageLevelViewModel();
	};

	/**
	 * Initialization
	 * @return {void}
	 */
	SaveTemplateNameViewModel.prototype.init = function(model, element)
	{
		var self = this;
		self.element = element;
		self.initValidation();
	};

	/**
	 * Initialize the validation.
	 * @return {void}
	 */
	SaveTemplateNameViewModel.prototype.initValidation = function()
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

						return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "detailscreens"), {
							paramData: {
								name: value,
								dataTypeId: tf.DataTypeHelper.getId("fieldtrip")
							}
						}, { overlay: false }).then(function(response)
						{
							var isDuplicated = response.Items;
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
	SaveTemplateNameViewModel.prototype.validate = function()
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
	SaveTemplateNameViewModel.prototype.dispose = function()
	{
		var self = this;
		self.pageLevelViewModel.dispose();
	};
})();