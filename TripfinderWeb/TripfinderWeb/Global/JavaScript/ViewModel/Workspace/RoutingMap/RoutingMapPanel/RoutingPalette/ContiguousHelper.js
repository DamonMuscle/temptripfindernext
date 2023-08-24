(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").ContiguousHelper = ContiguousHelper;

	function ContiguousHelper()
	{
		var self = this;
		self._arcgis = tf.map.ArcGIS;
		self._odCostMatrixServiceUrl = arcgisUrls.ODCostMatrixLayer + "/solveODCostMatrix?";

		// promise
		self.resolve = null;
		self.reject = null;
		self.promise = new Promise(function(resolve, reject) { self.resolve = resolve; self.reject = reject; });

		self.uturnDic = {
			"allow-backtrack": "ALLOW_UTURNS",
			"at-dead-ends-only": "ALLOW_DEAD_ENDS_ONLY",
			"at-dead-ends-and-intersections": "ALLOW_DEAD_ENDS_AND_INTERSECTIONS_ONLY",
			"no-backtrack": "NO_UTURNS"
		};
	}

	ContiguousHelper.prototype.getSmartAssignment = function(newTripStops, targetTrip, drawTool)
	{
		this.drawTool = drawTool;
		return this.execute(newTripStops, targetTrip);
	};

	ContiguousHelper.prototype.execute = function(tripStops, targetTrip)
	{
		var self = this;
		//var mapPoints = tripStops;//.map(function(stop) { return stop.geometry; });
		var destinations = self._createDestinations(targetTrip.TripStops.concat(tripStops));
		var origins = self._createDestinations(targetTrip.TripStops.concat(tripStops));
		var uturn = self.uturnDic[self.drawTool._uTurnPolicy];
		var impedaceAttr = self.drawTool._speedType == TF.Enums.RoutingSpeedType.DefaultSpeed ? "Length" : self.drawTool._impedanceAttribute;
		const travelModeParameters = {
			"restrictUTurns": uturn, "impedanceAttribute": impedaceAttr
		};
		return TF.getTravelMode(1, travelModeParameters).then(function(travelModePromise)
		{
			let parameters = {
				"origins": encodeURI(JSON.stringify(origins)),
				"destinations": encodeURI(JSON.stringify(destinations)),
				"travelMode": encodeURI(JSON.stringify(travelModePromise)),
				"directionsLengthUnits": "kilometers",
				"outputType": "esriNAODOutputNoLines",
				"f": "json"
			};
			const parameterURL = Object.keys(parameters).map(key => key + '=' + parameters[key]).join('&');
			return tf.startup.loadArcgisUrls().then(function()
			{
				self._odCostMatrixServiceUrl = arcgisUrls.ODCostMatrixLayer + "/solveODCostMatrix";

				return tf.map.ArcGIS.esriRequest(self._odCostMatrixServiceUrl, { method: 'post', body: parameterURL }).then(function(features)
				{
					return self._getBestSequence(features.data.odLines.features, tripStops, targetTrip.TripStops);
				}).catch(function()
				{
					return tripStops
				});
			})
		});
		return self.promise;
	};

	ContiguousHelper.prototype._createDestinations = function(stops)
	{
		var self = this;
		var featureSet = new self._arcgis.FeatureSet();
		for (var i = 0, count = stops.length; i < count; i++)
		{
			var stop = stops[i];
			if (stop.geometry !== undefined)
			{
				var geometry = self._webMercatorToGeographic(stop.geometry);
				var attributes = {
					"Name": stop.id,
					"CurbApproach": stop.vehicleCurbApproach
				};
				var graphic = new self._arcgis.Graphic(geometry, null, attributes);
				featureSet.features.push(graphic);
			}
		}
		return featureSet;
	};

	ContiguousHelper.prototype._webMercatorToGeographic = function(geometry)
	{
		var self = this;
		if (geometry.spatialReference.wkid !== 4326)
		{
			geometry = self._arcgis.webMercatorUtils.webMercatorToGeographic(geometry);
		}
		return geometry;
	};

	ContiguousHelper.prototype._getBestSequence = function(odCostResults, tripStops, stops)
	{
		var self = this, trip = self.drawTool.dataModel.getFieldTripById(stops[0].TripId);
		var currentStops = stops.slice();
		var groupedStops = self._getStopsGroupsByContiguous(tripStops);
		groupedStops.forEach(function(stopsGroup)
		{
			var newStop = {
				startId: stopsGroup[0].id,
				endId: stopsGroup[stopsGroup.length - 1].id
			};
			var sequence = self._getInsertSequence(newStop, currentStops, odCostResults);
			stopsGroup.forEach(function(stop)
			{
				stop.isContiguous = true;
			});
			if (sequence == 1 && trip.Session == 0)
			{

				stopsGroup[stopsGroup.length - 1].Distance = self._findDistance(odCostResults, stopsGroup[stopsGroup.length - 1].id, currentStops[0].id, stopsGroup[stopsGroup.length - 1]);
				currentStops = stopsGroup.concat(currentStops);
				// } else
				// {
				// 	currentStops[currentStops.length-1].Distance = self._findDistance(odCostResults, currentStops[0].id, stopsGroup[0].id);
				// 	currentStops = currentStops.concat(stopsGroup);
				// }
			} else
			{
				currentStops[sequence - 2].Distance = self._findDistance(odCostResults, currentStops[sequence - 2].id, stopsGroup[0].id, currentStops[sequence - 2]);
				stopsGroup[stopsGroup.length - 1].Distance = self._findDistance(odCostResults, stopsGroup[stopsGroup.length - 1].id, currentStops[sequence - 1].id, stopsGroup[stopsGroup.length - 1]);
				currentStops = currentStops.slice(0, sequence - 1).concat(stopsGroup).concat(currentStops.slice(sequence - 1));

			}

		});
		tripStops.forEach(function(stop)
		{
			for (var i = 0; i < currentStops.length; i++)
			{
				if (currentStops[i].id == stop.id)
				{
					stop.Sequence = i + 1;
					break;
				}
			}

		})
		return tripStops.sort(function(a, b) { return a.Sequence - b.Sequence });
		//var newStopsGroup = self._getContiguousStops(tripStops);
	};

	ContiguousHelper.prototype._getInsertSequence = function(newStop, currentStops, odCostResults)
	{
		var self = this, minDelta = Number.MAX_VALUE, minIndex = 0;
		var session = this.drawTool.dataModel.getFieldTripById(currentStops[0].TripId).Session;
		if (session == 0) { minDelta = self._findDistance(odCostResults, newStop.endId, currentStops[0].id, newStop); minIndex = -1; }
		else { minDelta = self._findDistance(odCostResults, currentStops[currentStops.length - 1].id, newStop.startId, currentStops[currentStops.length - 1]); minIndex = currentStops.length - 1 }
		for (var i = 0; i < currentStops.length - 1; i++)
		{
			if (!currentStops[i].isContiguous || !currentStops[i + 1].isContiguous)
			{
				var prevDistance = self._findDistance(odCostResults, currentStops[i].id, newStop.startId, currentStops[i]);
				var afterDistance = self._findDistance(odCostResults, newStop.endId, currentStops[i + 1].id, newStop);
				var totalNewDistance = prevDistance + afterDistance;
				var oldDistance = self.drawTool._impedanceAttribute == "Length" ? currentStops[i].Distance : (60 * currentStops[i].Distance / currentStops[i].StreetSpeed);
				var deltaDistance = totalNewDistance - oldDistance;
				if (deltaDistance < minDelta)
				{
					minDelta = deltaDistance;
					minIndex = i;
				}
			}
		}
		return minIndex + 2;

	}

	ContiguousHelper.prototype._findDistance = function(results, originId, destinationId, originStop)
	{
		var result = results.filter(function(result)
		{
			return result.attributes.Name == originId + " - " + destinationId
		})[0];
		if (this.drawTool._impedanceAttribute == "Length")
		{
			return result.attributes.Total_Length;
		} else
		{
			if (this.drawTool._speedType == TF.Enums.RoutingSpeedType.DefaultSpeed)
			{
				var speed = originStop.Speed ? originStop.Speed : this.drawTool._avgSpeed;
				return (result.attributes.Total_Distance / speed) * 60;
			} else
			{
				return result.attributes.Total_Time;
			}
		}
	}

	ContiguousHelper.prototype._getStopsGroupsByContiguous = function(tripStops)
	{
		var self = this, stopsByGroup = [];
		var stopsByTrip = self._groupByTrip(tripStops);
		for (var key in stopsByTrip)
		{
			var stopsByContiguous = self._groupByContigous(stopsByTrip[key]);
			stopsByGroup = stopsByGroup.concat(stopsByContiguous);
		}
		return stopsByGroup;

	};

	ContiguousHelper.prototype._groupByTrip = function(tripStops)
	{
		var stopsByTrip = {};
		tripStops.forEach(function(stop)
		{
			if (!stopsByTrip[stop.TripId]) { stopsByTrip[stop.TripId] = [] }
			stopsByTrip[stop.TripId].push(stop);
		});
		for (var key in stopsByTrip)
		{
			stopsByTrip[key] = stopsByTrip[key].sort(function(a, b) { return a.Sequence - b.Sequence });
		}
		return stopsByTrip;
	};

	ContiguousHelper.prototype._groupByContigous = function(tripStops)
	{
		var result = [], temp = [], difference;
		for (var i = 0; i < tripStops.length; i += 1)
		{
			if (difference !== (tripStops[i].Sequence - i))
			{
				if (difference !== undefined)
				{
					result.push(temp);
					temp = [];
				}
				difference = tripStops[i].Sequence - i;
			}
			temp.push(tripStops[i]);
		}

		if (temp.length)
		{
			result.push(temp);
		}
		return result;
	};

	ContiguousHelper.prototype.dispose = function()
	{
		var self = this;
		self._gpTool = null;
		self._odCostMatrixServiceUrl = null;
		self._arcgis = null;
	};
})();