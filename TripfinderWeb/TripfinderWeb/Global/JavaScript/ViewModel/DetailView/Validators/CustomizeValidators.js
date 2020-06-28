(function()
{
	createNamespace("TF.DetailView.Validators").CustomizeValidators = CustomizeValidators;

	function CustomizeValidators()
	{
	};

	CustomizeValidators.prototype.constructor = CustomizeValidators;

	TF.DetailView.Validators.CustomizeValidators.applyValidators = function(gridType)
	{
		var generator, datapoints = dataPointsJSON[gridType];
		switch (gridType)
		{
			case "fieldtrip":
				generator = new TF.DetailView.Validators.FieldTripValidatorGenerator();
				break;
			default:
				generator = new TF.DetailView.Validators.BaseValidatorGenerator();
				break;
		}

		generator.generateValidators(gridType)
			.then(function(allValidators)
			{
				if (!allValidators) return;

				var groups = Object.keys(datapoints);
				groups.forEach(function(group)
				{
					datapoints[group].forEach(function(dataPoint)
					{
						var validators = allValidators[dataPoint.field];

						if (!validators) return;
						if (!dataPoint.editType) return;

						if (!dataPoint.editType.validators)
						{
							dataPoint.editType.validators = {};
						}

						dataPoint.editType.validators = $.extend(dataPoint.editType.validators, validators);
					});
				});
			});
	};
})();