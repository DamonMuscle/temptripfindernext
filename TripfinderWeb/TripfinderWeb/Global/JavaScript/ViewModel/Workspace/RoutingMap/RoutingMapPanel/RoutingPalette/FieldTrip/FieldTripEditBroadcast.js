(function()
{
	/**
	* Geo link change broadcast
	* If user change trip stop, other stops with same point or path or boundary will change together
	*/
	createNamespace("TF.RoutingMap.RoutingPalette").FieldTripEditBroadcast = FieldTripEditBroadcast;

	function FieldTripEditBroadcast(dataModel)
	{
		this.broadcastName = "FieldTripEditBroadcast";
		this.dataModel = dataModel;
		this.changeStops = [];
		this.increaseCountTimeout = 1000;
	}

	var changeType = {
		path: "path",
		stop: "stop",
		create: "create",
		delete: "delete",
		move: "move"
	};
	FieldTripEditBroadcast.changeType = changeType;

	FieldTripEditBroadcast.prototype.init = function()
	{
		if (window.BroadcastChannel)
		{
			this.channel = new BroadcastChannel(this.broadcastName);
			this.channel.onmessage = this.receive.bind(this);
		}
		this.key = TF.createId();
	};

	FieldTripEditBroadcast.prototype.send = function(originalData, newData)
	{
		var self = this, newTripStops = [];
		self.changeType = changeType.path;
		for (var i = 0; i < originalData.length; i++)
		{
			var original = originalData[i];
			var newStop = this.copyTripStop(newData[i]);
			newTripStops.push(newStop);

			if (original.boundary && original.boundary.rings && newStop.boundary && newStop.boundary.rings)
			{
				if (JSON.stringify(original.boundary.rings) == JSON.stringify(newStop.boundary.rings) && original.x == newStop.x && original.y == newStop.y)
				{
					original.boundary = null;
					newStop.boundary = null;
					original.x = null;
					original.y = null;
					newStop.x = null;
					newStop.y = null;
				} else
				{
					self.getTripStopPreAndNex(original);
					self.changeType = changeType.stop;
				}
			}

			if (original.path && original.path.paths && newStop.path && newStop.path.paths)
			{
				if (JSON.stringify(original.path.paths) == JSON.stringify(newStop.path.paths) || this.changeType == changeType.stop)
				{
					original.path = null;
					newStop.path = null;
				} else
				{
					// newStop.wayPoints = routeStops.filter(function(c)
					// {
					// 	return c.attributes && c.attributes.LocationType == TF.RoutingMap.Directions.Enum.LocationTypeEnum.WAY_POINT;
					// }).map(function(c) { return [c.geometry.x, c.geometry.y]; });

					this.changeType = changeType.path;
				}
			}
		}

		this.changeSend({ originalData: originalData, newData: newTripStops });
	};

	FieldTripEditBroadcast.prototype.copyTripStop = function(tripStop)
	{
		return {
			x: tripStop.XCoord,
			y: tripStop.YCoord,
			id: tripStop.id,
			tripId: tripStop.FieldTripId,
			Session: this.dataModel.getFieldTripById(tripStop.FieldTripId).Session,
			boundary: tripStop.boundary && tripStop.boundary.geometry ? tripStop.boundary.geometry.toJSON() : null,
			path: tripStop.path && tripStop.path.geometry ? tripStop.path.geometry.toJSON() : null,
			scenarioId: this.findScenarioId(tripStop.id)
		};
	};

	FieldTripEditBroadcast.prototype._copyTripStopGeo = function(tripStop)
	{
		const geometry = TF.xyToGeometry(tripStop.XCoord, tripStop.YCoord);
		return {
			x: geometry.x,
			y: geometry.y,
			id: tripStop.id,
			Street: tripStop.Street,
			StreetSegment: tripStop.StreetSegment,
			City: tripStop.City,
			vehicleCurbApproach: tripStop.vehicleCurbApproach,
			walkoutBuffer: tripStop.walkoutBuffer,
			walkoutDistance: tripStop.walkoutDistance,
			XCoord: tripStop.XCoord,
			YCoord: tripStop.YCoord,
			ProhibitCrosser: tripStop.ProhibitCrosser,
			//geometry: TF.cloneGeometry(tripStop.geometry),
			boundary: tripStop.boundary && tripStop.boundary.geometry && tripStop.boundary.geometry.toJSON(),
			Session: this.dataModel.getFieldTripById(tripStop.FieldTripId).Session
		};
	};

	FieldTripEditBroadcast.prototype.moveTripStop = function(trip, tripStop, newSequence)
	{
		var self = this;
		if (tripStop.Sequence == newSequence)
		{
			return;
		}
		var oldPrevIndex = tripStop.Sequence - 2;
		oldPrevIndex = oldPrevIndex < 0 ? 0 : oldPrevIndex;
		var oldNextIndex = tripStop.Sequence;
		oldNextIndex = oldNextIndex > trip.FieldTripStops.length - 1 ? trip.FieldTripStops.length - 1 : oldNextIndex;
		var newPrevIndex = newSequence - 1;
		var newNextIndex = newSequence;
		if (tripStop.Sequence > newSequence)
		{
			newPrevIndex = newSequence - 2;
			newNextIndex = newSequence - 1;
		}
		newPrevIndex = newPrevIndex < 0 ? 0 : newPrevIndex;
		newNextIndex = newNextIndex > trip.FieldTripStops.length - 1 ? trip.FieldTripStops.length - 1 : newNextIndex;
		var startIndex = Math.min(oldPrevIndex, oldNextIndex, newPrevIndex, newNextIndex);
		var endIndex = Math.max(oldPrevIndex, oldNextIndex, newPrevIndex, newNextIndex);
		var stops = [];
		trip.FieldTripStops.forEach(function(tripStop, index)
		{
			if (index >= startIndex && index <= endIndex)
			{
				stops.push(self._copyTripStopGeo(tripStop));
			}
		});
		this.changeType = changeType.move;
		this.changeSend({ tripId: trip.id, stops: stops, from: tripStop.Sequence - startIndex, to: newSequence - startIndex });
	};

	FieldTripEditBroadcast.prototype.createTripStop = function(tripStop)
	{
		var self = this;
		var data = { prevStop: {}, createStop: {}, nextStop: {}, tripId: tripStop.FieldTripId };
		var trip = this.dataModel.getFieldTripById(tripStop.FieldTripId);

		data.createStop = self._copyTripStopGeo(tripStop);

		trip.FieldTripStops.forEach(function(stop, index)
		{
			if (stop.id == tripStop.id)
			{
				if (index != 0)
				{
					data.prevStop = self._copyTripStopGeo(trip.FieldTripStops[index - 1]);
				}
				if (index < trip.FieldTripStops.length - 1)
				{
					data.nextStop = self._copyTripStopGeo(trip.FieldTripStops[index + 1]);
				}
			}
		});
		this.changeType = changeType.create;
		this.changeSend(data);
	};

	FieldTripEditBroadcast.prototype.getTripStopPreAndNex = function(tripStop)
	{
		var self = this, trip = self.dataModel.getFieldTripById(tripStop.tripId ? tripStop.tripId : tripStop.FieldTripId);
		trip.FieldTripStops.forEach(function(stop, index)
		{
			if (stop.id == tripStop.id)
			{
				if (index != 0)
				{
					tripStop.prevStop = self._copyTripStopGeo(trip.FieldTripStops[index - 1]);
				}
				if (index < trip.FieldTripStops.length - 1)
				{
					tripStop.nextStop = self._copyTripStopGeo(trip.FieldTripStops[index + 1]);
				}
			}
		});
	};



	FieldTripEditBroadcast.prototype.deleteTripStop = function(tripStop)
	{
		if ($.isArray(tripStop))
		{
			if (tripStop.length > 1)
			{
				return;
			}
			tripStop = tripStop[0];
		}

		var self = this;
		var data = { prevStop: {}, deleteStop: {}, nextStop: {}, tripId: tripStop.FieldTripId };
		var trip = this.dataModel.getFieldTripById(tripStop.FieldTripId);

		data.deleteStop = self._copyTripStopGeo(tripStop);

		trip.FieldTripStops.forEach(function(stop)
		{
			if (stop.Sequence == tripStop.Sequence - 1)
			{
				data.prevStop = self._copyTripStopGeo(stop);
			}
			else if (stop.Sequence == tripStop.Sequence)
			{
				data.nextStop = self._copyTripStopGeo(stop);
			}
		});

		this.changeType = changeType.delete;
		this.changeSend(data);
	};

	FieldTripEditBroadcast.prototype.findScenarioId = function(tripStopId)
	{
		var trips = this.dataModel.fieldTrips;
		for (var i = 0; i < trips.length; i++)
		{
			for (var j = 0; j < trips[i].FieldTripStops.length; j++)
			{
				if (trips[i].FieldTripStops[j].id == tripStopId)
				{
					return trips[i].TravelScenarioId;
				}
			}
		}
		return 0;
	};

	FieldTripEditBroadcast.prototype.receive = function(response)
	{
		if (response.data.type == "setEditTripStop")
		{
			this.addTripStops(response.data.tripStops, response.data.key);
		} else if (response.data.type == "change")
		{
			this.getSyncEditTripStopsCount(response.data);
		} else if (response.data.type == "confirmChange")
		{
			this.dataModel.syncEditTripStops(response.data.tripStops);
		} else if (response.data.type == "editWindow")
		{
			if (response.data.key == this.key)
			{
				this.editWindow++;
			}
		}
	};

	FieldTripEditBroadcast.prototype.addNeedEditWindow = function(key)
	{
		this.postMessage({ type: "editWindow", key: key });
	};

	FieldTripEditBroadcast.prototype.setEditTripStop = function(tripStops, key)
	{
		var self = this;
		setTimeout(function()
		{
			self.postMessage({ type: "setEditTripStop", tripStops: tripStops, key: key });
		}, 500);
	};

	FieldTripEditBroadcast.prototype.syncEditTripStops = function(tripStops)
	{
		try
		{
			this.postMessage({ type: "confirmChange", tripStops: tripStops });
		} catch (e)
		{
			// ignore error
		}
	};

	FieldTripEditBroadcast.prototype.changeSend = function(changeData)
	{
		this.editWindow = 0;
		this.changeStops = [];
		this.postMessage($.extend({ type: "change", key: this.key, changeType: this.changeType }, changeData));
	};

	FieldTripEditBroadcast.prototype.postMessage = function(data)
	{
		if (this.channel)
		{
			this.channel.postMessage(data);
		}
		this.receive({ data: data });
	};

	FieldTripEditBroadcast.prototype.getSyncEditTripStopsCount = function(data)
	{
		this.dataModel && this.dataModel.getSyncEditTripStopsCount(data);
	};

	FieldTripEditBroadcast.prototype.addTripStops = function(tripStops, key)
	{
		if (key == this.key)
		{
			var self = this;
			this.editWindow--;
			this.changeStops = this.changeStops.concat(tripStops);
			if (this.editWindow == 0)
			{
				this.changeStops = Enumerable.From(this.changeStops).Distinct(function(c) { return c.id; }).ToArray();
				self.dataModel.confirmSyncEditTripStops(this.changeStops, this.changeType);
			}
		}
	};

	FieldTripEditBroadcast.prototype.dispose = function()
	{
		this.channel && this.channel.close();
	};
})();