(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").RoutingDirectionViewModel = RoutingDirectionViewModel;

	function RoutingDirectionViewModel(modalViewModel, tripStops, trip, showStopsTitle)
	{
		this.modalViewModel = modalViewModel;
		this.stops = tripStops;
		this.tripStops = tripStops.map(tripStop =>
		{
			return $.extend({}, tripStop);
		});
		this.color = trip.color;
		this.showStopsTitle = showStopsTitle;
		this.trip = trip;
		this.routingDirectionDetailViewModel = new TF.RoutingMap.RoutingPalette.RoutingDirectionDetailViewModel(this, trip.OpenType == "View");
		this.tripStops.forEach(tripStop =>
		{
			tripStop.openDrivingDirections = tripStop.RouteDrivingDirections;
		});
	}

	RoutingDirectionViewModel.prototype.init = function(viewModel, e)
	{
		this.buildResult();
	};

	RoutingDirectionViewModel.prototype.buildResult = function()
	{
		if (!this.tripStops)
		{
			console.error("trip stops data is not correct");
			return;
		}

		this.routingDirectionDetailViewModel.onStopChangeEvent.notify({ tripStops: this.tripStops, color: this.color });
		let totalDistance = this.routingDirectionDetailViewModel.getTotalDistance();
		let totalTime = this.routingDirectionDetailViewModel.getTotalTime();
		this.initTitle(totalDistance, totalTime / 60);
	};

	RoutingDirectionViewModel.prototype.initTitle = function(totalLength, totalTime)
	{

		var summaryStr = String.format("distance:{0}, time: {1}", this.routingDirectionDetailViewModel.formatDistanceString(totalLength), this.routingDirectionDetailViewModel.formatTimeString(totalTime));

		if (this.showStopsTitle)
		{
			this.modalViewModel.title(String.format("<div style='display:flex;align-items:center'>{0} Direction: Stop <span class='round-border'>{1}</span> to Stop <span class='round-border'>{2}</span>, {3}</div>",
				this.trip.Name,
				this.tripStops[0].Sequence,
				this.tripStops[this.tripStops.length - 1].Sequence,
				summaryStr));
		} else
		{
			this.modalViewModel.title(String.format("{0} Direction, {1}",
				this.trip.Name,
				summaryStr));
		}
	};

	RoutingDirectionViewModel.prototype.apply = function()
	{
		this.routingDirectionDetailViewModel.applyDirection(this.stops);
		return Promise.resolve(true);
	};

	RoutingDirectionViewModel.prototype.cancel = function()
	{
		return Promise.resolve(true);
	};

	RoutingDirectionViewModel.prototype.generateDirections = function()
	{
		this.tripStops.forEach(tripStop =>
		{
			tripStop.DrivingDirections = tripStop.openDrivingDirections;
			tripStop.IsCustomDirection = false;
		});
		this.routingDirectionDetailViewModel.onStopChangeEvent.notify({ tripStops: this.tripStops, color: this.color });
	};

})();