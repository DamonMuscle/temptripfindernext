(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").TripPlayBackControl = TripPlayBackControl;

	function TripPlayBackControl(viewModel)
	{
		this.viewModel = viewModel;
		this.dataModel = viewModel.dataModel;
		this.tripPlaybackControlTool = new TF.RoutingMap.TripPlaybackControlTool(() => { return this.viewModel._viewModal._map; }, () => { return this.dataModel.fieldTrips; });
		this.obPlayBackControlVisible = ko.observable(false);
		this.onTripsChangeEvent = this.onTripsChangeEvent.bind(this);
		this.subScribeEvents = [
			"onTripsChangeEvent",
			"onTripStopsChangeEvent",
			"onTripColorChangeEvent",
			"onChangeTripVisibilityEvent",
			"onTripStopTimeChangeEvent"];
	}

	TripPlayBackControl.prototype.open = function()
	{
		this.obPlayBackControlVisible(true);
		this.tripPlaybackControlTool.open();
		this.subscribeEvent();

	};

	TripPlayBackControl.prototype.close = function()
	{
		this.obPlayBackControlVisible(false);
		this.tripPlaybackControlTool.close();
		this.unsubscribeEvent();
	};

	TripPlayBackControl.prototype.subscribeEvent = function()
	{
		this._toggleSubscribeEvent(true);
	};

	TripPlayBackControl.prototype.unsubscribeEvent = function()
	{
		this._toggleSubscribeEvent(false);
	};

	TripPlayBackControl.prototype._toggleSubscribeEvent = function(isSubscribe)
	{
		var self = this;
		this.subScribeEvents.forEach(function(eventName)
		{
			self.dataModel[eventName][isSubscribe ? "subscribe" : "unsubscribe"](self.onTripsChangeEvent);
		});
	};

	TripPlayBackControl.prototype.onTripsChangeEvent = function()
	{
		if (this.obPlayBackControlVisible())
		{
			this.lazyRun("initTripData", () =>
			{
				this.tripPlaybackControlTool.initTripData();
				if (this.dataModel.fieldTrips.length == 0)
				{
					this.close();
					return;
				}
			});
		}
	};

	TripPlayBackControl.prototype.lazyRun = function(key, func)
	{
		var self = this;
		var theKey = key + "Timeout";
		clearTimeout(this[theKey]);
		this[theKey] = setTimeout(function()
		{
			func.call(self);
		}, 20);
	};

	TripPlayBackControl.prototype.toggleShow = function()
	{
		if (this.tripPlaybackControlTool.visible())
		{
			this.close();
		} else
		{
			this.open();
		}
	};

	TripPlayBackControl.prototype.dispose = function()
	{
		this.close();
		this.tripPlaybackControlTool.tickTool.dispose();
	};
})();