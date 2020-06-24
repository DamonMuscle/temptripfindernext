(function()
{
	createNamespace("TF.DetailView.Validators").BaseValidatorGenerator = BaseValidatorGenerator;

	function BaseValidatorGenerator()
	{
	};

	BaseValidatorGenerator.prototype.constructor = BaseValidatorGenerator;

	BaseValidatorGenerator.prototype.generateValidators = function(gridType)
	{
		return Promise.resolve([]);
		// return this.generateRequiredFieldValidators(gridType);
	};

	BaseValidatorGenerator.prototype.generateRequiredFieldValidators = function(gridType)
	{
		var requiredFields = tf.helpers.detailViewHelper.getRequiredFields(gridType), fieldValidators = {};

		requiredFields.forEach(function(item)
		{
			fieldValidators[item.name] = {
				notEmpty: {
					message: "required"
				}
			}
		});

		return Promise.resolve(fieldValidators);
	};
})();