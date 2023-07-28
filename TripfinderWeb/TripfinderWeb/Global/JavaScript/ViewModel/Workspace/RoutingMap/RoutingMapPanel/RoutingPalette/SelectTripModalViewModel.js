/**
 * when user want to save changes, revert changes, close field trips, optimize sequence, optimize trip,
 * user will have a changce to select field trips to apply these operations by this dialog
 */
(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").SelectTripModalViewModel = SelectTripModalViewModel;

	function SelectTripModalViewModel(trips, options, dataModel)
	{
		TF.Modal.BaseModalViewModel.call(this);
		var defaults = { multiple: true, title: "Close Field Trips", description: "" };
		options = $.extend(defaults, options);
		this.title(options.title);
		this.description = ko.observable(options.description);
		this.sizeCss = "modal-dialog-sm";
		this.contentTemplate("workspace/RoutingMap/RoutingMapPanel/RoutingPalette/SelectTripModal");
		this.buttonTemplate(options.otherButtonName ? "modal/positivenegativeother" : "modal/PositiveNegative");
		this.obPositiveButtonLabel("Apply");
		this.obNegativeButtonLabel("Cancel");
		if (options.otherButtonName)
		{
			this.obOtherButtonLabel(options.otherButtonName);
		}
		if (options.isVrpClick && !this.isAllTripsVrpAllowed(trips))
		{
			this.obOtherButtonVisible(false);
		}
		this.obDisableControl(true);
		this.viewModel = new TF.RoutingMap.RoutingPalette.SelectTripViewModel(trips, options, dataModel, this.obDisableControl);
		this.data(this.viewModel);
	}

	SelectTripModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	SelectTripModalViewModel.prototype.constructor = SelectTripModalViewModel;

	SelectTripModalViewModel.prototype.positiveClick = function()
	{
		this.viewModel.apply().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};

	SelectTripModalViewModel.prototype.otherClick = function(viewModel, e)
	{
		this.viewModel.applyToAllClick().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};

	SelectTripModalViewModel.prototype.negativeClick = function()
	{
		var self = this;
		this.viewModel.cancel().then(function(result)
		{
			if (result)
			{
				self.hide();
				self.resolve();
			}
		});
	};

	SelectTripModalViewModel.prototype.isAllTripsVrpAllowed = function(trips)
	{
		var fisrtStop = trips[0].TripStops[0], lastStop = trips[0].TripStops[trips[0].TripStops.length - 1];
		var firstDepotGeom = fisrtStop.geometry;
		var lastDepotGeom = lastStop.geometry;
		for (var i = 1; i < trips.length; i++)
		{
			var currentFistStop = trips[i].TripStops[0], currentLastStop = trips[i].TripStops[trips[i].TripStops.length - 1];

			if (currentFistStop.geometry.x.toFixed(4) !== firstDepotGeom.x.toFixed(4) ||
				currentFistStop.geometry.y.toFixed(4) != firstDepotGeom.y.toFixed(4))
			{
				if (fisrtStop.SchoolCode && fisrtStop.SchoolCode.length > 0)
				{
					if (!currentFistStop.SchoolCode || currentFistStop.SchoolCode.length == 0 || currentFistStop.SchoolCode != fisrtStop.SchoolCode)
					{
						return false;
					}
				} else
				{
					return false;
				}

			}
			if (currentLastStop.geometry.x.toFixed(4) != lastDepotGeom.x.toFixed(4) ||
				currentLastStop.geometry.y.toFixed(4) != lastDepotGeom.y.toFixed(4))
			{
				if (lastStop.SchoolCode && lastStop.SchoolCode.length > 0)
				{
					if (!currentLastStop.SchoolCode || currentLastStop.SchoolCode.length == 0 || currentLastStop.SchoolCode != lastStop.SchoolCode)
					{
						return false;
					}
				} else
				{
					return false;
				}
			}
		}
		return true;
	}

})();