(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").CopyTripStopViewModel = CopyTripStopViewModel;

	function CopyTripStopViewModel(tripStop)
	{
		this.tripStop = tripStop;
		this.obName = ko.observable(tripStop.Street + ' Copy');
	}

	CopyTripStopViewModel.prototype.init = function(model, ele)
	{
		$(ele).bootstrapValidator({
			excluded: [':hidden', ':not(:visible)'],
			live: 'enabled',
			message: 'This value is not valid',
			fields: {
				Name: {
					trigger: "blur change",
					validators: {
						notEmpty: {
							message: "required"
						}
					}
				}
			}
		});

		this.validator = $(ele).data("bootstrapValidator");
	};

	CopyTripStopViewModel.prototype.apply = function()
	{
		var self = this;
		return this.validator.validate()
			.then(function(result)
			{
				if (result)
				{
					return self.obName();
				}
				return false;
			});
	};

	CopyTripStopViewModel.prototype.cancel = function()
	{
		return Promise.resolve(true);
	};
})();
