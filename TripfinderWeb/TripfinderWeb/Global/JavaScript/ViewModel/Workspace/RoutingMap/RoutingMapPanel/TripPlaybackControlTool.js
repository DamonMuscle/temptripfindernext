(function()
{
	createNamespace("TF.RoutingMap").TripPlaybackControlTool = TripPlaybackControlTool;

	function TripPlaybackControlTool(obMap, obTrips)
	{
		this.process = this.process.bind(this);
		this.tickTool = new TF.RoutingMap.PlayBackTickTool({ onProcess: this.process, obMap: obMap });
		this.visibleBufferSecond = 20;
		this.visible = ko.observable(false);
		this.obMap = obMap;
		this._arcgis = tf.map.ArcGIS;
		this.obTrips = obTrips;
		this.changeSpeed = this.changeSpeed.bind(this);
		this.playButtonClick = this.playButtonClick.bind(this);
		this.obIsCenterLocked = ko.observable(false);
		this.onProcessEvent = new TF.Events.Event();
		this.updateTimeRange = true;
	}

	TripPlaybackControlTool.prototype.open = function()
	{
		this.visible(true);
		this.initLayer();
		this.init();
	};

	TripPlaybackControlTool.prototype.close = function()
	{
		this.visible(false);
		this.tickTool.close();
		this.vehicleLayer && this.vehicleLayer.removeAll();
		this.tickTool.dispose();
	};

	TripPlaybackControlTool.prototype.process = function(targetTimeAsSecond)
	{
		this.onProcessEvent.notify(targetTimeAsSecond);
		var trips = this.obTrips();
		if (trips.length == 0)
		{
			return;
		}
		for (var i = 0; i < trips.length; i++)
		{
			var currentTrip = trips[i],
				tripStopAndPortion,
				isTripIsInProgress;
			if (currentTrip.visible == false || !currentTrip.TripStops)
			{
				this.clearVehicleOnMap(currentTrip.id || currentTrip.Id);
				continue;
			}
			tripStopAndPortion = this.getTripStopAndPortion(currentTrip.TripStops, targetTimeAsSecond);
			isTripIsInProgress = this.isTripIsInProgress(currentTrip.StartTime, currentTrip.FinishTime, targetTimeAsSecond);
			if (isTripIsInProgress)
			{
				if (!tripStopAndPortion.tripStop) continue;
				this.drawVehicleOnMap(tripStopAndPortion.tripStop, tripStopAndPortion.portion, currentTrip.color);
			} else
			{
				this.clearVehicleOnMap(currentTrip.id || currentTrip.Id);
			}
		}
		this.clearClosedTrips();
	};

	/**
	* delete closed trip on map
	*/
	TripPlaybackControlTool.prototype.clearClosedTrips = function()
	{
		var self = this;
		var allVehicleGraphics = this.vehicleLayer.graphics;
		var tripIds = this.obTrips().map(c => { return c.Id; });
		allVehicleGraphics.forEach(function(graphic)
		{
			if (tripIds.indexOf(graphic.attributes.id) < 0)
			{
				self.vehicleLayer.remove(graphic);
			}
		});
	};

	TripPlaybackControlTool.prototype.playButtonClick = function()
	{
		var self = this;
		if (this.obTrips().length == 0)
		{
			return;
		}
		if (checkTripStopTimeValid())
		{
			this.tickTool.togglePlay();
		}

		function checkTripStopTimeValid()
		{
			var inValidTrips = {};
			self.obTrips().forEach(function(trip)
			{
				if (trip.TripStops)
				{
					var stops = trip.TripStops.sort(function(a, b) { return a.Sequence > b.Sequence ? 1 : -1; });
					for (var i = 0; i < stops.length - 1; i++)
					{
						var stopTime = self.getTimeAsSecondFromISOString(stops[i].StopTime);
						var nextStopTime = self.getTimeAsSecondFromISOString(stops[i + 1].StopTime);
						if (stopTime > nextStopTime)
						{
							inValidTrips[trip.id || trip.Id] = trip;
						}
					}
				}
			});
			if (Object.values(inValidTrips).length == self.obTrips().length)
			{
				tf.promiseBootbox.alert("Wrong trip stop time ordering.");
				return false;
			}
			return true;
		}
	};

	TripPlaybackControlTool.prototype.changeSpeed = function(speed)
	{
		this.tickTool.changeSpeed(speed);
	};

	TripPlaybackControlTool.prototype.closeClick = function()
	{
		this.close();
	};

	TripPlaybackControlTool.prototype.centerLockedClick = function()
	{
		this.obIsCenterLocked(!this.obIsCenterLocked());
		this._centerVehicle();
	};

	TripPlaybackControlTool.prototype._centerVehicle = function()
	{
		if (this.obIsCenterLocked())
		{
			var graphics = this.vehicleLayer.graphics;
			if (graphics.items.length === 1)
			{
				this.obMap().mapView.center = graphics.items[0].geometry;
			}

			if (graphics.items.length > 1)
			{
				var extent = TF.RoutingMap.EsriTool.getCenterExtentMultipleItem(this.obMap(), graphics.items);
				this.obMap().mapView.center = extent.center;
			}

		}
	};

	TripPlaybackControlTool.prototype.init = function()
	{
		if (this.obTrips().length > 0 && this.visible)
		{
			this.initTripData();
			this.tickTool.init();
		}
	};

	TripPlaybackControlTool.prototype.initLayer = function()
	{
		var layerId = "routingTripVehicleLayer",
			map = this.obMap();

		if (map.findLayerById(layerId))
		{
			return;
		}

		this.vehicleLayer = new tf.map.ArcGIS.GraphicsLayer({
			"id": layerId
		});
		map.add(this.vehicleLayer);
	};

	TripPlaybackControlTool.prototype.initTripData = function()
	{
		if (!this.visible())
		{
			return;
		}
		var trips = this.obTrips();
		if (trips.length == 0)
		{
			return;
		}

		if (this.updateTimeRange)
		{
			this.setTimeSliderRange(trips);
		}
		this.tickTool.update();
	};

	TripPlaybackControlTool.prototype.setTimeSliderRange = function(trips)
	{
		var self = this;
		var minStartTime = 0;
		var maxFinishTime = 0;
		var allTimes = [];
		if (trips.length > 0)
		{
			trips.forEach(function(trip)
			{
				(trip.TripStops || []).forEach(function(stop)
				{
					allTimes.push(self.getTimeAsSecondFromISOString(stop.StopTime));
				});
			});
			minStartTime = Enumerable.From(allTimes).Min();
			maxFinishTime = Enumerable.From(allTimes).Max();
		}
		this.tickTool.setTimeSliderRange(minStartTime, maxFinishTime);
	};

	TripPlaybackControlTool.prototype.drawVehicleOnMap = function(tripStop, portion, color)
	{
		const geometry = tripStop
			&& tripStop.path
			&& tripStop.path.geometry
			&& tripStop.path.geometry.paths.length > 0
			&& tripStop.path.geometry.paths[0].length > 0 ?
			tripStop.path.geometry : null;
		var point = geometry ? TF.Helper.TripHelper.getPointAt(geometry, portion) : tripStop.geometry;
		var gisColor = new tf.map.ArcGIS.Color(color);
		gisColor.a = 0.5;
		var symbol = {
			type: "simple-marker",
			color: gisColor,
			size: 25,
			outline: {
				color: [0, 0, 0, 255],
				width: 2
			}
		};

		var graphic = TF.Helper.MapHelper.getGraphicsById(this.vehicleLayer, tripStop.TripId);
		if (graphic)
		{
			graphic.geometry = point;
			graphic.symbol = symbol;
		} else
		{
			graphic = new tf.map.ArcGIS.Graphic(point, symbol, { id: tripStop.TripId });
			this.vehicleLayer.add(graphic);
		}
		graphic.attributes.sequence = tripStop.Sequence;
		graphic.attributes.portion = portion;
		this._centerVehicle();
	};

	TripPlaybackControlTool.prototype.clearVehicleOnMap = function(tripId)
	{
		var graphic = TF.Helper.MapHelper.getGraphicsById(this.vehicleLayer, tripId);
		this.vehicleLayer.remove(graphic);
	};

	/**
	 * get which trip stop is running
	 * @param {*} tripStops 
	 * @param {*} targetTimeAsSecond 
	 */
	TripPlaybackControlTool.prototype.getTripStopAndPortion = function(tripStops, targetTimeAsSecond)
	{
		var self = this, nextTripStop, nextStopTimeAsSecond, portion;

		if (tripStops.length === 0)
		{
			return {
				tripStop: [],
				portion: 0
			};
		}

		var i = self.getTripStopIndex(tripStops, targetTimeAsSecond);
		var currentTripStop = tripStops[i];
		var currentStopTimeAsSecond = this.getTimeAsSecondFromISOString(currentTripStop.StopTime);

		if (currentStopTimeAsSecond > targetTimeAsSecond)
		{
			return {
				tripStop: tripStops[0],
				portion: 0
			};
		}

		if (i == tripStops.length - 1)
		{
			return {
				tripStop: tripStops[i - 1],
				portion: 1
			};
		}

		if (!currentTripStop.path || !currentTripStop.path.geometry)
		{
			return {
				tripStop: currentTripStop,
				portion: 0
			};
		}

		nextTripStop = tripStops[i + 1];
		nextStopTimeAsSecond = null;
		if (nextTripStop)
		{
			nextStopTimeAsSecond = this.getTimeAsSecondFromISOString(nextTripStop.StopTime);
		}
		var totalStopTime = this.getTripStopTotalStopTimeSecond(currentTripStop);
		if (nextStopTimeAsSecond == currentStopTimeAsSecond)
		{
			portion = 1;
		} else
		{
			portion = (Math.max(targetTimeAsSecond - totalStopTime - currentStopTimeAsSecond, 0)) / (nextStopTimeAsSecond - currentStopTimeAsSecond - totalStopTime);
		}
		return {
			tripStop: currentTripStop,
			portion: portion
		};
	};

	/**
	* check trip is in running time with 5 minutes buffer
	*/
	TripPlaybackControlTool.prototype.isTripIsInProgress = function(startTime, finishTime, timeAsSecond)
	{
		return this.getTimeAsSecondFromISOString(startTime) < timeAsSecond + this.visibleBufferSecond && this.getTimeAsSecondFromISOString(finishTime) > timeAsSecond - this.visibleBufferSecond;
	};

	TripPlaybackControlTool.prototype.getTripStopIndex = function(tripStops, targetTimeAsSecond)
	{
		var stopTimeAsSecond;
		for (var i = tripStops.length; i > 0; i--)
		{
			var prevStopIndex = i - 1;
			var prevStop = tripStops[prevStopIndex];
			stopTimeAsSecond = this.getTimeAsSecondFromISOString(prevStop.StopTime);
			if (stopTimeAsSecond <= targetTimeAsSecond)
			{
				return prevStopIndex;
			}
		}
		return 0;
	};

	TripPlaybackControlTool.prototype.getTripStopTotalStopTimeSecond = function(tripStop)
	{
		if (tripStop.TotalStopTime)
		{
			return TF.stopTimeToSecond(tripStop.TotalStopTime);
		}
		return 0;
	};

	TripPlaybackControlTool.prototype.getTimeAsSecondFromISOString = function(isoTimeString)
	{
		var stopTime = convertToMoment(isoTimeString);
		return this.tickTool.timeToSecond(stopTime);
	};

})();