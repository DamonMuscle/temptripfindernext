(function()
{
	Tool = TF.RoutingMap.Directions.Tool;

	Tool.prototype._initStops = function()
	{
		var self = this;
		self._stops ? self._stops.length = 0 : self._stops = [];
		self._destinations ? self._destinations.length = 0 : self._destinations = [];
		self._throughPoints ? self._throughPoints.length = 0 : self._throughPoints = [];
		self._wayPoints ? self._wayPoints.length = 0 : self._wayPoints = [];
		self._tripVertices ? self._tripVertices.length = 0 : self._tripVertices = [];
	};

	Tool.prototype._disposeStops = function()
	{
		var self = this;
		self._stops ? self._stops.length = 0 : self._stops = null;
		self._destinations ? self._destinations.length = 0 : self._destinations = null;
		self._throughPoints ? self._throughPoints.length = 0 : self._throughPoints = null;
		self._wayPoints ? self._wayPoints.length = 0 : self._wayPoints = null;
		self._tripVertices ? self._tripVertices.length = 0 : self._tripVertices = null;
	};

	/**
	* Output the direction stops
	*
	* @return {Object []} 
	*/
	Tool.prototype.getStops = function()
	{
		var self = this;
		self._mergeDestinationAndThroughPoints();
		if (self._wayPoints === undefined)
		{
			return [];
		}

		if (self._wayPoints.length > 0)
		{
			self._mergeStopsAndWayPoints(self._stops, self._wayPoints);
		}
		return self._stops;
	};

	Tool.prototype.getStopsClone = function()
	{
		var self = this,
			stops = [], stop, attributes, geometry, symbol, graphic;
		self._mergeDestinationAndThroughPoints();
		if (self._stops === undefined ||
			self._wayPoints === undefined)
		{
			return [];
		}

		if (self._stops.length === 0 &&
			self._wayPoints.length === 0)
		{
			return [];
		}

		if (self._wayPoints.length > 0)
		{
			self._mergeStopsAndWayPoints(self._stops, self._wayPoints);
		}

		if (self._stops)
		{
			for (var i = 0, length = self._stops.length; i < length; i++)
			{
				stop = self._stops[i];
				attributes = stop.attributes;
				geometry = stop.geometry;
				symbol = stop.symbol;

				graphic = new self._arcgis.Graphic(
					new self._arcgis.Point(geometry.x, geometry.y, self._webMercator),
					symbol,
					{
						'Address': attributes.Address,
						'CurbApproach': attributes.CurbApproach,
						'LocationType': attributes.LocationType,
						'Name': attributes.Name,
						'Sequence': attributes.Sequence,
						'StopType': attributes.StopType
					});
				stops.push(graphic);
			}
		}
		return stops;
	};

	Tool.prototype._attachClosestStreetToStop = function(points)
	{
		var self = this, stops = [];
		points.forEach(function(point)
		{
			if (point.attributes.LocationType == 0)
			{
				stops.push({ geometry: self._geographicToWebMercator(point.geometry) });
			}
		});
		if (self.isTomTomNAChecked) return Promise.resolve(points);
		return self.stopTool.attachClosetStreetToStop(stops, "sde").then(function()
		{
			var index = 0;
			points.forEach(function(point)
			{
				if (point.attributes.LocationType == 0 && stops[index].StreetSegment)
				{
					point.attributes.SideOfEdge = self.stopTool._isPointOnRightOfLine(stops[index].StreetSegment.geometry, self._geographicToWebMercator(point.geometry)) ? 1 : 2;
					point.attributes.SourceOID = stops[index].StreetSegment.OBJECTID;
					point.attributes.SourceID = self.SourceID;
					point.attributes.PosAlong = self.stopTool.getPosAlong(self._geographicToWebMercator(point.geometry), stops[index].StreetSegment.geometry);
					index++;
				}
			});
			return Promise.resolve(points)
		})
	}

	Tool.prototype._addDestination = function(mapPoint)
	{
		var self = this;
		return self._createDestinationGraphic(mapPoint).then(function(graphic)
		{
			var sequence = graphic.attributes.Sequence;
			self._stopLayer.add(graphic);
			self._updatePreviousStopSymbol(sequence);

			// create destination label
			var label = self._createStopLabelGraphic(mapPoint, sequence, self.StopTypeEnum.TERMINAL);
			if (!(sequence === 1 && self.isRoundTrip))
			{
				self._stopSequenceLayer.add(label);
			}
			self._updatePreviousStopLabel(sequence);
			self._destinations.push(graphic);

			return self._destinations.length;
		});
	};

	Tool.prototype._updatePreviousStopSymbol = function(sequence)
	{
		if (sequence < 2)
		{
			return;
		}

		var self = this,
			stopGraphics = self._stopLayer.graphics.toArray(),
			graphic = attributes = stopSequence = null;
		for (var i = stopGraphics.length - 1; i >= 0; --i)
		{
			graphic = stopGraphics[i];
			attributes = graphic.attributes;

			if (attributes.StopType === self.StopTypeEnum.TERMINAL)
			{
				stopSequence = attributes.Sequence;

				if (stopSequence < sequence)
				{
					graphic.symbol = stopSequence > 1 ? self._stopSymbol() : (self.isRoundTrip ? self._roundTripStopSymbol() : self._firstStopSymbol());

					attributes.StopType = self.StopTypeEnum.DESTINATION;

					graphic = null;
					break;  // Only need to update the first previous stop.
				}
			}

			graphic = null;
		}
	};

	Tool.prototype._updatePreviousStopLabel = function(sequence)
	{
		if (sequence < 2)
		{
			return;
		}

		var self = this,
			labelGraphics = self._stopSequenceLayer.graphics.toArray(),
			graphic = attributes = stopSequence = null;

		for (var i = labelGraphics.length - 1; i >= 0; --i)
		{
			graphic = labelGraphics[i];
			attributes = graphic.attributes;

			if (attributes.LocationType === self.StopTypeEnum.TERMINAL)
			{
				stopSequence = attributes.Sequence;

				if (stopSequence < sequence)
				{
					attributes.StopType = self.StopTypeEnum.DESTINATION;

					graphic = null;
					break;
				}
			}
		}
	};

	Tool.prototype._createDestinationGraphic = function(mapPoint)
	{
		var self = this;
		return self._getStopAddress(mapPoint).then(function(address)
		{
			var sequence = self._getNextStopSequence(),
				symbol = (sequence === 1) ? (self.isRoundTrip ? self._roundTripStopSymbol() : self._firstStopSymbol())
					: (self.isRoundTrip ? self._stopSymbol() : self._lastStopSymbol()),
				stopType = (sequence === 1) ? self.StopTypeEnum.DESTINATION :
					(self.isRoundTrip ? self.StopTypeEnum.DESTINATION : self.StopTypeEnum.TERMINAL),
				options = {
					'address': address,
					'geometry': mapPoint,
					'name': address,
					'sequence': sequence,
					'stopType': stopType,
					'symbol': symbol
				},
				destinationStop = new TF.RoutingMap.Directions.DirectionStop.DestinationStop(options);

			return destinationStop.getGraphic();
		});
	};

	Tool.prototype._addThroughPoint = function(mapPoint)
	{
		var self = this;
		return self._createThroughPointGraphic(mapPoint).then(function(graphic)
		{
			self._stopLayer.add(graphic);
			self._throughPoints.push(graphic);
			return;
		});
	};

	Tool.prototype._createThroughPointGraphic = function(mapPoint)
	{
		var self = this;
		return self._getStopAddress(mapPoint).then(function(address)
		{
			var sequence = self._getNextStopSequence(),
				attribute = {
					'Address': address,
					'CurbApproach': self.defaultCurbApproach,
					'LocationType': self.LocationTypeEnum.WAY_POINT,
					'Name': address,
					'Sequence': sequence,
					'StopType': self.StopTypeEnum.WAY_STOP
				},
				symbol = self._throughStopSymbol(),
				graphic = new self._arcgis.Graphic(mapPoint, symbol, attribute);

			return graphic;
		});
	};

	/**
	 * Clear all through points.
	 */
	Tool.prototype._clearAllThroughPoints = function()
	{
		var self = this,
			throughStopGraphic = null;
		if (!self._throughPoints || self._throughPoints.length === 0)
		{
			return;
		}

		for (var i = self._throughPoints.length - 1; i >= 0; --i)
		{
			throughStopGraphic = self._throughPoints[i];
			self._stopLayer.remove(throughStopGraphic);
		}

		self._throughPoints.length = 0;
	};

	Tool.prototype._clearAllWayPoints = function()
	{
		var self = this,
			wayPointGraphic = null;
		if (!self._wayPoints || self._wayPoints.length === 0)
		{
			return;
		}

		for (var i = self._wayPoints.length - 1; i >= 0; --i)
		{
			wayPointGraphic = self._wayPoints[i];
			self._stopLayer.remove(wayPointGraphic);
		}
		self._wayPoints.length = 0;
	};

	/**
	 * Clear through points of the last destination.
	 * @return {Boolean} True - The through points collection has been modified. For round trip, the through points will never be the last stops.
	 * 					 False - The through points collection has not been modified.
	 */
	Tool.prototype._clearLastThroughPoints = function()
	{
		var self = this;
		if (!self._destinations)
		{
			return;
		}
		if ((!self.isRoundTrip && self._destinations.length < 1) ||
			self._destinations.length === 0)
		{
			if (self._throughPoints.length > 0) 
			{
				self._clearAllThroughPoints();
				return true;
			}
			else
			{
				return false;
			}
		}

		var lastStopSequence = self._destinations[self._destinations.length - 1].attributes.Sequence,
			throughStopGraphic = null,
			attributes = null,
			modified = false;

		for (var i = self._throughPoints.length - 1; i >= 0; --i)
		{
			throughStopGraphic = self._throughPoints[i];
			attributes = throughStopGraphic.attributes;

			if (attributes.Sequence > lastStopSequence)
			{
				self._throughPoints.pop();

				self._stopLayer.remove(throughStopGraphic);

				modified = true;
			}
			else
			{
				throughStopGraphic = null;
				break;
			}

			throughStopGraphic = null;
		}

		return modified;
	};

	/**
	 * Clear way points of the last destination.
	 * @return {void}
	 */
	Tool.prototype._clearLastWayPoints = function()
	{
		var self = this;
		if ((!self.isRoundTrip && self._destinations.length < 1) ||
			(self._destinations && self._destinations.length === 0))
		{
			if (self._wayPoints.length > 0) 
			{
				self._clearAllWayPoints();
				return;
			}
			else
			{
				return;
			}
		}

		if (self.isRoundTrip)
		{
			return;
		}

		var lastStopSequence = self._destinations[self._destinations.length - 1].attributes.Sequence,
			wayPointGraphic = attributes = null;

		for (var i = self._wayPoints.length - 1; i >= 0; --i)
		{
			wayPointGraphic = self._wayPoints[i];
			attributes = wayPointGraphic.attributes;

			if (attributes.Sequence > lastStopSequence)
			{
				self._wayPoints.pop();
				self._stopLayer.remove(wayPointGraphic);
			}
			else
			{
				wayPointGraphic = null;
				break;
			}
			wayPointGraphic = null;
		}
	};

	/**
	 * Add destination.
	 * @param  {Point} mapPoint point based on map coordinates
	 * @returns {Deferred}
	 */
	Tool.prototype._addTerminalDestination = function(mapPoint)
	{
		var self = this;
		return self._createTerminalDestinationGraphic(mapPoint).then(function(graphic)
		{
			var sequence = graphic.attributes.Sequence,
				stopType = graphic.StopType,
				label = self._createStopLabelGraphic(mapPoint, sequence, stopType);

			self._stopLayer.add(graphic);
			self._updatePreviousStopSymbol(sequence);
			if (!(sequence === 1 && this.isRoundTrip))
			{
				self._stopSequenceLayer.add(label);
			}
			self._updatePreviousStopLabel(sequence);

			self._destinations.push(graphic);

			return Promise.resolve();
		});
	};

	/**
	 * Add destination graphic on the map.
	 * @param  {Point} mapPoint point based on map coordinates
	 * @returns {Deferred}
	 */
	Tool.prototype._createTerminalDestinationGraphic = function(mapPoint)
	{
		var self = this;
		return self._getStopAddress(mapPoint).then(function(address)
		{
			var symbol = self.isRoundTrip ? self._stopSymbol() : self._lastStopSymbol(),
				sequence = self._getNextStopSequence(),
				attribute = {
					'Address': address,
					'CurbApproach': self.defaultCurbApproach,
					'LocationType': self.LocationTypeEnum.STOP,
					'Name': address,
					'Sequence': sequence,
					'StopType': self.isRoundTrip ? self.StopTypeEnum.DESTINATION : self.StopTypeEnum.TERMINAL
				},
				graphic = new self._arcgis.Graphic(mapPoint, symbol, attribute);

			return Promise.resolve(graphic);
		});
	};

	Tool.prototype._createStopLabelGraphic = function(mapPoint, sequence, stopType)
	{
		var destinationSequence = this._getNextDestinationSequence(),
			attributes = {
				'StopType': stopType,
				'Label': destinationSequence,
				'Sequence': sequence
			},
			symbol = this._stopSequenceSymbol(destinationSequence),
			graphic = new this._arcgis.Graphic(mapPoint, symbol, attributes);

		return graphic;
	};

	Tool.prototype._mergeDestinationAndThroughPoints = function()
	{
		var self = this;
		if (self._destinations === undefined ||
			self._throughPoints === undefined)
		{
			return;
		}

		var destinationCount = self._destinations.length,
			throughPointCount = self._throughPoints.length,
			destinationIndex = throughPointIndex = 0,
			destinationGraphic = throughPointGraphic = destinationSequence = throughPointSequence = null;
		self._stops.length = 0;

		if (destinationCount === 0 && throughPointCount === 0)
		{
			return;
		}

		while (destinationIndex < destinationCount && throughPointIndex < throughPointCount)
		{
			destinationGraphic = self._destinations[destinationIndex];
			throughPointGraphic = self._throughPoints[throughPointIndex];

			destinationSequence = destinationGraphic.attributes.Sequence;
			throughPointSequence = throughPointGraphic.attributes.Sequence;

			if (destinationSequence < throughPointSequence)
			{
				self._stops.push(destinationGraphic);
				destinationIndex++;
			}
			else
			{
				self._stops.push(throughPointGraphic);
				throughPointIndex++;
			}
		}

		if (destinationIndex < destinationCount)
		{
			self._stops = self._stops.concat(self._destinations.slice(destinationIndex, destinationCount));
		}

		if (throughPointIndex < throughPointCount)
		{
			// clear all the throughPoint, self will be triggered when press Esc.
			self._stops = self._stops.concat(self._throughPoints.slice(throughPointIndex, throughPointCount));
		}
	};

	Tool.prototype._getNextStopSequence = function()
	{
		var self = this,
			destinationCount = self._destinations.length,
			throughPointCount = self._throughPoints.length,
			wayPointCount = self._wayPoints.length;
		return destinationCount + throughPointCount + wayPointCount + 1;
	};

	Tool.prototype._getNextDestinationSequence = function()
	{
		return this._destinations.length + 1;
	};

	Tool.prototype._getNextThroughPointSequence = function()
	{
		return this._throughPoints.length + 1;
	};

	Tool.prototype._getStopAddress = function(mapPoint)
	{
		// Reverse GeoCoding (Longitude, Latitude) > Address
		// RW-15914 Reverse Geocode: Address Point (if no match)→ Street (if no match)→ Closet Street
		var self = this;
		return self._getAddress(mapPoint).then(function(response)
		{
			var address = '';
			if (response && response.Match_addr)
			{
				if (response.Address)
				{
					response.Match_addr = response.Address + ", " + response.Match_addr.replace(/^[^,]+, */, '');
				}
				address = response.Match_addr;
				if (!address.split(",")[3])
				{
					address += "," + TF.RoutingMap.GeocodeHelper.getZipCodeText(mapPoint);
				}
			} else
			{
				address = "N/A";
				var stop = { geometry: mapPoint }
				return self.stopTool.attachClosetStreetToStop([stop], "sde").then(function()
				{
					if (stop.StreetSegment && stop.streetDistance <= TF.geocodeTolerance)
					{
						var address = stop.StreetSegment.Street;
						if (stop.StreetSegment.City && stop.StreetSegment.City.length > 0) address += "," + stop.StreetSegment.City;
						if (stop.StreetSegment.State && stop.StreetSegment.State.length > 0) address += "," + stop.StreetSegment.State;
						if ((stop.StreetSegment.LeftPostalCode && stop.StreetSegment.LeftPostalCode.length > 0)
							|| (stop.StreetSegment.RightPostalCode && stop.StreetSegment.RightPostalCode.length > 0))
						{
							address += "," + (stop.StreetSegment.LeftPostalCode || stop.StreetSegment.RightPostalCode);
						}
						return Promise.resolve(address)
					} else
					{
						return Promise.resolve("N/A")
					}

				})
			}
			return Promise.resolve(address);
		}, function(error)
		{
			console.log(error);
			return Promise.resolve('');
		});
	};

	Tool.prototype._getStopName = function(stopAddress)
	{
		if (stopAddress.indexOf(',') === -1)
		{
			return stopAddress;
		}

		return stopAddress.split(',')[0];
	};

	Tool.prototype._getLastStop = function()
	{
		var self = this,
			stops = self.getStopsClone(),
			length = stops.length,
			lastStop = length > 0 ? stops[length - 1] : null;

		return lastStop;
	};

	/**
	 * Convert stop locationType from through point to destination.
	 * @param  {number} sequence The sequence of convert stop
	 * @returns {void}
	 */
	Tool.prototype._throughPointToDestination = function(sequence)
	{
		var self = this,
			stop = self._stops.slice(sequence - 1, sequence),
			throughPointIndex = destinationIndex = null;

		if (stop.length === 1)
		{
			throughPointIndex = self._throughPoints.indexOf(stop[0]);
			destinationIndex = self._destinations.findIndex(function(element) { return element.attributes.Sequence > sequence; });

			stop[0].attributes.LocationType = self.LocationTypeEnum.STOP;
			stop[0].attributes.StopType = self.StopTypeEnum.DESTINATION;
			stop[0].symbol = self._noReachedRoute ? self._stopNotReachedSymbol() : self._stopSymbol();

			self._throughPoints.splice(throughPointIndex, 1);
			if (destinationIndex !== -1)
			{
				self._destinations.splice(destinationIndex, 0, stop[0]);
			}
			else
			{
				self._destinations.push(stop[0]);
			}
			self.notifyStopChanged();

			if (self._noReachedRoute)
			{
				self.notifyDirectionChanged(null);
			}
			else
			{
				self._calculateTrip().then(function()
				{
					self._updateDestinationsLabelWithoutOverlap();
				}, function(error) { });
			}
		}
		else
		{
			console.error('through point to destination parameters error!');
		}
	};

	/**
	 * Convert stop locationType from destination to through point.
	 * @param  {number} sequence The sequence of convert stop
	 * @returns {void}
	 */
	Tool.prototype._destinationToThroughPoint = function(sequence)
	{
		var self = this,
			stop = self._stops.slice(sequence - 1, sequence),
			throughPointIndex = destinationIndex = null;

		if (stop.length === 1)
		{
			destinationIndex = self._destinations.indexOf(stop[0]);
			throughPointIndex = self._throughPoints.findIndex(function(element) { return element.attributes.Sequence > sequence; });

			if (throughPointIndex === -1)
			{
				throughPointIndex = self._throughPoints.length;
			}

			stop[0].attributes.LocationType = self.LocationTypeEnum.WAY_POINT;
			stop[0].attributes.StopType = self.StopTypeEnum.WAY_STOP;
			stop[0].symbol = self._throughStopSymbol();

			self._destinations.splice(destinationIndex, 1);
			self._throughPoints.splice(throughPointIndex, 0, stop[0]);
			self.notifyStopChanged();

			if (self._noReachedRoute)
			{
				self.notifyDirectionChanged(null);
				self._updateDestinationsLabelWithoutOverlap();
			}
			else
			{
				self._calculateTrip().then(function()
				{
					self._updateDestinationsLabelWithoutOverlap();
				}, function(error) { });
			}
		}
	};

	/**
	 * Convert vertex to destination / through point
	 * @param  {number} stopSequence The sequence of the destination / through point.
	 * @param  {object} vertex The convert vertex.
	 * @param  {string} stopType StopTypeEnum.DESTINATION | StopTypeEnum.WAY_STOP
	 * @returns {void}
	 */
	Tool.prototype._vertexToStop = function(stopSequence, vertex, stopType)
	{
		if (!vertex) { return; }

		var stopIndex = null,
			self = this;

		self._tripVertexLayer.remove(vertex);
		self._getStopAddress(vertex.geometry).then(function(address)
		{
			vertex.attributes.LocationType = (stopType === self.StopTypeEnum.WAY_STOP) ? self.LocationTypeEnum.WAY_POINT : self.LocationTypeEnum.STOP;
			vertex.attributes.StopType = stopType;
			vertex.attributes.Sequence = stopSequence;
			vertex.attributes.Address = address;
			vertex.attributes.Name = address;
			vertex.attributes.CurbApproach = 4;  // unknown curb approach.

			vertex.symbol = (stopType === self.StopTypeEnum.WAY_STOP) ? self._throughStopSymbol() : self._stopSymbol();

			// update destination sequence
			for (var i = self._destinations.length - 1; i >= 0; --i)
			{
				if (self._destinations[i].attributes.Sequence >= stopSequence)
				{
					self._destinations[i].attributes.Sequence += 1;
				}
			}

			// update through point sequence
			for (var i = self._throughPoints.length - 1; i >= 0; --i)
			{
				if (self._throughPoints[i].attributes.Sequence >= stopSequence)
				{
					self._throughPoints[i].attributes.Sequence += 1;
				}
			}

			if (stopType === self.StopTypeEnum.DESTINATION ||
				stopType === self.StopTypeEnum.TERMINAL)
			{
				stopIndex = self._destinations.findIndex(function(element) { return element.attributes.Sequence > stopSequence; });
				if (stopIndex !== -1)
				{
					self._destinations.splice(stopIndex, 0, vertex);
				}
				else
				{
					self._destinations.push(vertex);
				}
			}
			else if (stopType === self.StopTypeEnum.WAY_STOP)
			{
				stopIndex = self._throughPoints.findIndex(function(element) { return element.attributes.Sequence > stopSequence; });
				if (stopIndex !== -1)
				{
					self._throughPoints.splice(stopIndex, 0, vertex);
				}
				else
				{
					self._throughPoints.push(vertex);
				}
			}

			self.notifyStopChanged();

			self._stopLayer.add(vertex);

			self._calculateTrip().then(function()
			{
				self._updateDestinationsLabelWithoutOverlap();
			}, function(error) { });
		});
	};

	/**
	 * Remove the stop on the directions and map.
	 * @param  {number} sequence Specify the sequence number of remove stop in the direction palette.
	 * @returns {void}
	 */
	Tool.prototype.RemoveStop = function(sequence)
	{
		var self = this;
		self._removeStop(sequence);

		if (self.getStops().length > 1)
		{
			self._calculateTrip().then(function(result)
			{
				if (result)
				{
					self._updateDestinationsLabelWithoutOverlap();
					self._draggingRouteGeometry = result.directions.mergedGeometry;
				}
			}, function(error)
			{
				console.log(error);
				self._updateDestinationsLabelWithoutOverlap();
			});
		}
		else if (self._tripLayer)
		{
			self._tripLayer.removeAll();
			self._arrowLayer.removeAll();
			self._tripVertexLayer.removeAll();
			self._updateDestinationsLabelWithoutOverlap(true);
			self._routeGeometry = null;
			self._draggingRouteGeometry = null;

		}
		self.notifyStopChanged();
	};

	Tool.prototype._removeStop = function(sequence)
	{
		var self = this;
		if (!self._stops || !self._wayPoints)
		{
			return;
		}

		var wayPoints = self._wayPoints,
			wayPointsCount = wayPoints ? wayPoints.length : 0,
			withWayPoints = wayPointsCount !== 0,
			stopsWithoutWayPoints = removeStop = null;

		if (withWayPoints)
		{
			stopsWithoutWayPoints = $.grep(self._stops, function(item)
			{
				return item.attributes.StopType !== self.StopTypeEnum.GHOST_STOP;
			});
			removeStop = stopsWithoutWayPoints[sequence - 1];
		}
		else
		{
			removeStop = $.grep(self._stops, function(item)
			{
				return item.attributes.Sequence === sequence;
			})[0];
		}

		if (!removeStop)
		{
			return;
		}

		switch (removeStop.attributes.LocationType)
		{
			case self.LocationTypeEnum.STOP:
				self._removeDestination(removeStop, withWayPoints);
				break;
			case self.LocationTypeEnum.WAY_POINT: // through point
				self._removeThroughPoints(removeStop, withWayPoints);
				break;
		}
	};

	Tool.prototype._removeDestination = function(destination, withWayPoints)
	{
		var self = this,
			sequence = destination.attributes.Sequence,
			stopType = destination.attributes.StopType,
			destinations = self._destinations,
			index = $.inArray(destination, destinations),
			previousDestinationSequence = followingDestinationSequence = wayPointBetweenRemoveStops = null,
			wayPointBetweenRemoveStopCount = wayPointAfterRemoveStopCount = throughPointIndex = removeThroughStops = i = null,
			throughPointsCount = 0,
			throughPointIndex;
		if (withWayPoints)
		{
			previousDestinationSequence = destinations[index - 1] ? destinations[index - 1].attributes.Sequence : -1;
			followingDestinationSequence = destinations[index + 1] ? destinations[index + 1].attributes.Sequence
				: destinations[destinations.length - 1].attributes.Sequence;
			var wayPointBetweenRemoveStops = self._wayPoints.filter(function(item)
			{
				return item.attributes.Sequence > previousDestinationSequence
					&& item.attributes.Sequence < followingDestinationSequence;
			});
			wayPointBetweenRemoveStopCount = wayPointBetweenRemoveStops.length;
			var wayPointAfterRemoveStopCount = self._wayPoints.filter(function(item)
			{
				return item.attributes.Sequence > sequence
					&& item.attributes.Sequence < followingDestinationSequence;
			}).length;

			self._removeWayPoints(wayPointBetweenRemoveStops);

			throughPointsCount = followingDestinationSequence - sequence - wayPointAfterRemoveStopCount - 1;
			if (throughPointsCount > 0)
			{
				// TODO:
				// remove through points with the destination
			}

			// update sequence
			for (i = destinations.length - 1; i >= 0; --i)
			{
				if (destinations[i].attributes.Sequence >= followingDestinationSequence)
				{
					destinations[i].attributes.Sequence -= (wayPointBetweenRemoveStopCount + 1);
				}
			}
			destinations[index] = null;
			self._destinations = $.grep(destinations, function(item)
			{
				return item !== null;
			});

			for (i = self._throughPoints.length - 1; i >= 0; --i)
			{
				if (self._throughPoints[i].attributes.Sequence >= followingDestinationSequence)
				{
					self._throughPoints[i].attributes.Sequence -= (wayPointBetweenRemoveStopCount + 1);
				}
			}
		}
		else
		{
			if (index < destinations.length - 1)
			{
				var followingDestinationSequence = destinations[index + 1].attributes.Sequence;
				throughPointsCount = followingDestinationSequence - sequence - 1;
				if (throughPointsCount > 0)
				{
					for (i = 0, length = self._throughPoints.length; i < length; i++)
					{
						if (self._throughPoints[i].attributes.Sequence === sequence + 1)
						{
							throughPointIndex = i;
							break;
						}
					}
					var removeThroughStops = self._throughPoints.splice(throughPointIndex, throughPointsCount);
					removeThroughStops.forEach(function(element)
					{
						self._stopLayer.remove(element);
					});
				}
			}
			else
			{
				if (self.isRoundTrip)
				{
					// clear the through points whose sequence is larger than remove stop sequence
					for (i = 0; i < self._throughPoints.length; i++)
					{
						if (self._throughPoints[i].attributes.Sequence > sequence)
						{
							self._stopLayer.remove(self._throughPoints[i]);
							self._throughPoints.splice(i, 1);
							i--;
						}
					}
				}
			}

			self._destinations.splice(index, 1);

			// update sequence
			for (var i = 0, length = self._destinations.length; i < length; i++)
			{
				if (self._destinations[i].attributes.Sequence > sequence)
				{
					self._destinations[i].attributes.Sequence -= (1 + throughPointsCount);
				}
			}

			for (var j = 0, length = self._throughPoints.length; j < length; j++)
			{
				if (self._throughPoints[j].attributes.Sequence > sequence)
				{
					self._throughPoints[j].attributes.Sequence -= 1;
				}
			}
		}

		// update stop symbol
		if (self._destinations.length === 1  // only one destination exists.
			|| (self._destinations.length > 0 && sequence === 1))  // remove the first stop
		{
			// Update first stop symbol
			self._destinations[0].symbol = (self.isRoundTrip ? self._roundTripStopSymbol() : self._firstStopSymbol());
		}
		else if (stopType === self.StopTypeEnum.TERMINAL && self._destinations.length > 0)
		{
			// Update last stop symbol
			var lastStop = self._destinations[self._destinations.length - 1];
			lastStop.symbol = self._lastStopSymbol();
			lastStop.attributes.StopType = self.StopTypeEnum.TERMINAL;
		}

		self._stopLayer.remove(destination);

		self._clearLastThroughPoints();
	};

	Tool.prototype._removeThroughPoints = function(throughPoint, withWayPoints)
	{
		var self = this,
			sequence = throughPoint.attributes.Sequence,
			i = null;
		if (withWayPoints)
		{
			// TODO:
			// Remove through points with wayPoints.
		}
		else
		{
			self._throughPoints = $.grep(self._throughPoints, function(item, index) { return item.attributes.Sequence !== sequence; });
			// update sequence
			for (i = self._throughPoints.length - 1; i >= 0; --i)
			{
				if (self._throughPoints[i].attributes.Sequence > sequence)
				{
					self._throughPoints[i].attributes.Sequence -= 1;
				}
			}

			for (i = self._destinations.length - 1; i >= 0; --i)
			{
				if (self._destinations[i].attributes.Sequence > sequence)
				{
					self._destinations[i].attributes.Sequence -= 1;
				}
			}
		}

		self._stopLayer.remove(throughPoint);
	};

	Tool.prototype._removeWayPoints = function(wayPoints)
	{
		var self = this,
			index = i = null;
		for (i = wayPoints.length - 1; i >= 0; --i)
		{
			index = $.inArray(wayPoints[i], self._wayPoints);
			if (index != -1)
			{
				self._stopLayer.remove(self._wayPoints[index]);
				self._wayPoints[index] = null;
			}
		}

		self._wayPoints = $.grep(self._wayPoints, function(item) { return item !== null; });
	};

	/**
	 * Identify the given stop is the terminal or not.
	 * @param  {number} sequence Stop sequence number.
	 * @returns {boolean}
	 */
	Tool.prototype._isLastStop = function(sequence)
	{
		return sequence === this._stops.length;
	};

	/**
	 * Update stop sequence. When stops are overlap, display the last sequence of the stops.
	 */
	Tool.prototype._updateDestinationsLabelWithoutOverlap = function(normalSequence)
	{
		var self = this,
			stopGraphic = geometry = stopSequence = attributes = symbol = graphic = null;

		self._stopSequenceLayer.removeAll();

		for (var i = self._destinations.length - 1; i >= 0; --i)
		{
			stopGraphic = self._destinations[i];

			if (geometry)
			{
				if (geometry.x === stopGraphic.geometry.x
					&& geometry.y === stopGraphic.geometry.y)
				{
					continue;
				}
			}
			geometry = stopGraphic.geometry;
			stopSequence = i + 1;
			attributes = {
				'StopType': (stopSequence === self._destinations.length) ? self.StopTypeEnum.TERMINAL : self.StopTypeEnum.DESTINATION,
				'Label': stopSequence,
				'Sequence': stopGraphic.attributes.Sequence
			};
			symbol = self._noReachedRoute && !normalSequence ? self._stopSequenceNotReachedSymbol(stopSequence) : self._stopSequenceSymbol(stopSequence);

			graphic = new this._arcgis.Graphic(geometry, symbol, attributes);
			if (!(stopSequence === 1 && this.isRoundTrip))
			{
				self._stopSequenceLayer.add(graphic);
			}
			graphic = null;
		}
	};

	Tool.prototype._calculateStopPosition = function(tripGeometry)
	{
		var self = this,
			stops = self._stops,
			stopCount = stops.length,
			geometry = nearestObject = nearestPoint = nearX = nearY = position = loopLength = null;

		if (stopCount < 2)
		{
			return;
		}
		else
		{
			tripGeometry = self._geographicToWebMercator(tripGeometry);

			stops[0].attributes['beforeNodeIndex'] = 0;
			stops[0].attributes['distance'] = 0;

			// round trip
			if (!self.isRoundTrip)
			{
				stops[stopCount - 1].attributes['beforeNodeIndex'] = tripGeometry.paths[0].length;
				stops[stopCount - 1].attributes['distance'] = 0;
				loopLength = stopCount - 2
			}
			else
			{
				loopLength = stopCount - 1;
			}
		}

		for (var i = 1; i <= loopLength; i++)
		{
			geometry = self._geographicToWebMercator(stops[i].geometry);

			nearestObject = self._arcgis.geometryEngine.nearestCoordinate(tripGeometry, geometry);
			if (!nearestObject.isEmpty)
			{
				nearestPoint = nearestObject.coordinate;

				nearX = nearestPoint.x;
				nearY = nearestPoint.y;
				position = self._getStopPosition(nearX, nearY);

				stops[i].attributes['beforeNodeIndex'] = position.beforeNodeIndex;
				stops[i].attributes['distance'] = position.distance;

				nearestPoint = nearX = nearY = null;
			}

			nearestObject = null;
		}
	};

	Tool.prototype._getStopPosition = function(pX, pY)
	{
		var tripVerticesCount = this._tripVertices.length,
			xyTolerance = 0.01,
			position = {
				beforeNodeIndex: -1,
				distance: 0
			},
			inside = false,
			collinear = false,
			i, fromNode, toNode, fromX, fromY, toX, toY, minX, minY, maxX, maxY;

		for (i = 0; i < tripVerticesCount - 1; i++)
		{
			fromNode = this._tripVertices[i];
			toNode = this._tripVertices[i + 1];

			fromX = fromNode.x;
			fromY = fromNode.y;
			toX = toNode.x;
			toY = toNode.y;

			if ((pX === fromX && pY === fromY) || (pX === toX && pY === toY)
				|| (Math.abs(fromX - pX) < xyTolerance && Math.abs(fromY - pY) < xyTolerance))
			{
				position = {
					beforeNodeIndex: i,
					distance: 0
				}
				break;
			}

			if (fromX < toX)
			{
				minX = fromX;
				maxX = toX;
			}
			else
			{
				maxX = fromX;
				minX = toX;
			}

			if (fromY < toY)
			{
				minY = fromY;
				maxY = toY;
			}
			else
			{
				maxY = fromY;
				minY = toY
			}

			inside = pX < maxX && pX > minX && pY < maxY && pY > minY;
			if (inside)
			{
				collinear = Math.abs((toY - fromY) * (pX - fromX) - (pY - fromY) * (toX - fromX)) < 1;
				if (collinear)
				{
					position = {
						beforeNodeIndex: i,
						distance: Math.sqrt(Math.pow(pX - fromX, 2) + Math.pow(pY - fromY, 2))
					};
					break;
				}
				else
				{
					position = {
						beforeNodeIndex: i,
						distance: 0  // calculate distance
					}
				}
			}
		}
		return position;
	};

	Tool.prototype._calculateVertexSequence = function(vertexPosition)
	{
		var self = this,
			stop = attributes = stopSequence = sequence = null;
		for (var i = 0, length = self._stops.length; i < length; i++)
		{
			stop = self._stops[i];
			attributes = stop.attributes;
			stopSequence = attributes.Sequence;

			if (vertexPosition.beforeNodeIndex < attributes.beforeNodeIndex)
			{
				sequence = stopSequence;
				break;
			}
			else if (vertexPosition.beforeNodeIndex === attributes.beforeNodeIndex)
			{
				if (vertexPosition.distance < attributes.distance)
				{
					sequence = stopSequence;
					break;
				}
			}
		}

		if (sequence === null && self.isRoundTrip)
		{
			// the vertex is after last stop (round trip)
			sequence = stop.attributes.Sequence + 1;
		}
		return sequence;
	};

	/**
	 * Re-calculate directions after directions panel updated.
	 * Remove the through points after last destination.
	 * @param  {array} destinations Directions object set.
	 * @param  {array} throughPoints Through points object set.
	 * @returns {void}
	 */
	Tool.prototype.AddDestinationFromDirectionsPanel = function(destinations, throughPoints)
	{
		var self = this,
			locationType = stopType = destination = geometry = attributes = symbol = graphic = destinationSequence = throughPoint = null;

		for (var i = destinations.length - 1; i >= 0; --i)
		{
			destination = destinations[i];
			if (destination.XCoord === undefined || destination.YCoord === undefined)
			{
				return;
			}
		}

		if (self._destinations === undefined
			|| self._throughPoints === undefined)
		{
			if (destinations.length === 0 && throughPoints.length === 0)
			{
				// click check box (Round Trip | Show Details)
				return;
			}
			else
			{
				self._beginDropMode();
			}
		}

		// remove popups on the map if click Clear-All.
		self._removeStopPopup();

		// remove destinations on the map.
		for (var i = self._destinations.length - 1; i >= 0; --i)
		{
			self._stopLayer.remove(self._destinations[i]);
		}
		self._destinations.length = 0;

		// remove all sequence on the map.
		self._stopSequenceLayer.removeAll();

		// remove through points on the map.
		for (var i = self._throughPoints.length - 1; i >= 0; --i)
		{
			self._stopLayer.remove(self._throughPoints[i]);
		}
		self._throughPoints.length = 0;

		// add destinations
		locationType = self.LocationTypeEnum.STOP;
		stopType = self.StopTypeEnum.DESTINATION;
		for (var i = 0, length = destinations.length; i < length; i++)
		{
			destination = destinations[i];
			geometry = new self._arcgis.Point(destination.XCoord, destination.YCoord, self._webMercator);
			if (i > 0 && i === length - 1 && !self.isRoundTrip)
			{
				stopType = self.StopTypeEnum.TERMINAL;
			}

			attributes = {
				'Address': destination.Address,
				'CurbApproach': destination.CurbApproach,
				'LocationType': locationType,
				'Name': destination.Address,
				'Sequence': destination.Seq,
				'StopType': stopType
			};
			symbol = (i === 0) ? (self.isRoundTrip ? self._roundTripStopSymbol() : self._firstStopSymbol())
				: ((stopType === self.StopTypeEnum.TERMINAL && self.isRoundTrip === false) ? self._lastStopSymbol() : self._stopSymbol());
			graphic = new self._arcgis.Graphic(geometry, symbol, attributes);

			self._stopLayer.add(graphic);
			self._destinations.push(graphic);
		}

		// add labels
		stopType = self.StopTypeEnum.DESTINATION;
		for (var i = 0, length = destinations.length; i < length; i++)
		{
			destination = destinations[i];
			destinationSequence = i + 1;
			geometry = new self._arcgis.Point(destination.XCoord, destination.YCoord, self._webMercator);
			if (i > 0 && i === length - 1 && !self.isRoundTrip)
			{
				stopType = self.StopTypeEnum.TERMINAL;
			}

			attributes = {
				'Label': destinationSequence,
				'Sequence': destination.Seq,
				'StopType': stopType,
			};
			symbol = self._stopSequenceSymbol(destinationSequence);
			graphic = new self._arcgis.Graphic(geometry, symbol, attributes);
			if (!(destinationSequence === 1 && self.isRoundTrip))
			{
				self._stopSequenceLayer.add(graphic);
			}
		}

		// add through points (sequence before last destination only)
		if (self._destinations.length > 0)
		{
			destination = self._destinations[self._destinations.length - 1];
			destinationSequence = destination.attributes.Sequence;  // last destination sequence
			locationType = self.LocationTypeEnum.WAY_POINT;
			for (var i = 0, length = throughPoints.length; i < length; i++)
			{
				throughPoint = throughPoints[i];
				if (throughPoint.Seq < destinationSequence
					|| self.isRoundTrip
					|| self._onDropMode)
				{
					geometry = new self._arcgis.Point(throughPoint.XCoord, throughPoint.YCoord, self._webMercator);
					attributes = {
						'Address': throughPoint.Address,
						'CurbApproach': destination.CurbApproach,
						'LocationType': locationType,
						'Name': throughPoint.Address,
						'Sequence': throughPoint.Seq,
						'StopType': self.StopTypeEnum.WAY_STOP
					};
					symbol = self._throughStopSymbol();
					graphic = new self._arcgis.Graphic(geometry, symbol, attributes);

					self._stopLayer.add(graphic);
					self._throughPoints.push(graphic);
				}
			}
		}

		self._clearWayPoints();

		if (self._destinations.length >= 2)
		{
			self.notifyStopChanged();
			self._calculateTrip().then(function(result)
			{
				self._updateDestinationsLabelWithoutOverlap();

				if (self._onDragging === undefined || self._onDragging === null)
				{
					// initialize dragging after input destinations in the palette.
					self.startDraggingMode(result.directions.mergedGeometry);
				}

				self._draggingRouteGeometry = result.directions.mergedGeometry;
			}, function(error)
			{
				console.log(error);
				self._updateDestinationsLabelWithoutOverlap();
			});
		}
		else
		{
			self._tripLayer.removeAll();
			self._tripVertexLayer.removeAll();
			self._arrowLayer.removeAll();

			self._clearThroughPoints();
			self._mergeDestinationAndThroughPoints();
			self.notifyStopChanged();
		}
	};

	Tool.prototype._clearThroughPoints = function()
	{
		var self = this,
			throughPoints = self._throughPoints;
		if (throughPoints.length > 0)
		{
			for (var i = throughPoints.length - 1; i >= 0; --i)
			{
				self._stopLayer.remove(throughPoints[i]);
			}
			self._throughPoints.length = 0;
		}
	};

	Tool.prototype._clearWayPoints = function()
	{
		var self = this,
			wayPoints = self._wayPoints;
		if (wayPoints.length > 0)
		{
			// Clear all of the way points on the map.
			for (var i = wayPoints.length - 1; i >= 0; --i)
			{
				self._stopLayer.remove(wayPoints[i]);
			}
			self._wayPoints.length = 0;
		}
	};

	Tool.prototype.setDirectionStops = function(destinations, throughPoints)
	{
		var self = this;
		self._createDirectionDestinations(destinations);
		self._createDirectionThroughPoints(throughPoints);
		self._calculateTrip().then(function()
		{
			self._updateDestinationsLabelWithoutOverlap();
		}, function(error) { });
	};

	Tool.prototype._createDirectionDestinations = function(destinations)
	{
		var self = this,
			destination = geometry = attributes = sequence = symbol = graphic = null;

		self._destinations.length = 0;

		for (var i = 0, length = destinations.length; i < length; i++)
		{
			destination = destinations[i];
			geometry = new self._arcgis.Point(destination.XCoord, destination.YCoord, self._webMercator);
			sequence = destination.Seq;
			attributes = {
				'Address': destination.Address,
				'CurbApproach': destination.CurbApproach,
				'LocationType': self.LocationTypeEnum.STOP,
				'Name': destination.Address,
				'Sequence': sequence,
				'StopType': (i === length - 1) ? self.StopTypeEnum.TERMINAL : self.StopTypeEnum.DESTINATION
			};
			symbol = (sequence === 1) ? (self.isRoundTrip ? self._roundTripStopSymbol() : self._firstStopSymbol()) : ((sequence === length - 1) ? self._lastStopSymbol() : self._stopSymbol());

			// create destination graphic
			graphic = new self._arcgis.Graphic(geometry, symbol, attributes);
			self._destinations.push(graphic);
		};
	};

	Tool.prototype._createDirectionThroughPoints = function(throughPoints)
	{
		var self = this,
			throughPoint = geometry = attributes = sequence = symbol = graphic = null;

		self._throughPoints.length = 0;
		for (var i = 0, length = throughPoints.length; i < length; i++)
		{
			throughPoint = throughPoints[i];
			geometry = new self._arcgis.Point(throughPoint.XCoord, throughPoint.YCoord, self._webMercator);
			sequence = throughPoint.Seq;
			attributes = {
				'Address': throughPoint.Address,
				'CurbApproach': destination.CurbApproach,
				'LocationType': self.LocationTypeEnum.WAY_POINT,
				'Name': throughPoint.Address,
				'Sequence': sequence,
				'StopType': self.StopTypeEnum.WAY_STOP
			};
			symbol = self._throughStopSymbol();

			// create through point graphic
			graphic = new self._arcgis.Graphic(geometry, symbol, attributes);
			self._throughPoints.push(graphic);
		}
	};

	/**
	 * Notify when the stops are updated.
	 * @returns {void}
	 */
	Tool.prototype.notifyStopChanged = function(result)
	{
		this._onStopChanged.notify(this.getStopsClone(result));
	};

	/**
	 * Notify when the direction details are updated.
	 * @param {result} result The direction result.
	 * @returns {void}
	 */
	Tool.prototype.notifyDirectionChanged = function(result)
	{
		if (this.isDirectionDetailsRequired)
		{
			this._onRoutingResultChanged.notify(result);
		}
	};

	Tool.prototype._setStopsNotReached = function()
	{
		var self = this,
			stops = self._stopLayer.graphics.toArray(),
			stop = attributes = null;

		for (var i = stops.length - 1; i >= 0; --i)
		{
			stop = stops[i];
			attributes = stop.attributes;
			if (attributes.StopType === self.StopTypeEnum.DESTINATION
				|| attributes.StopType === self.StopTypeEnum.TERMINAL)
			{
				stop.symbol = self._stopNotReachedSymbol();
			}
		}
	};

	Tool.prototype._setStopSequenceNotReached = function()
	{
		var self = this,
			stopSequenceGraphics = self._stopSequenceLayer.graphics.toArray(),
			graphic = attributes = null;
		for (var i = stopSequenceGraphics.length - 1; i >= 0; --i)
		{
			graphic = stopSequenceGraphics[i];
			attributes = graphic.attributes;
			graphic.symbol = self._stopSequenceNotReachedSymbol(attributes.Label);
		}
	};

	Tool.prototype._showLastSequenceOnOverlap = function()
	{
		var self = this,
			stopSequenceGraphics = self._stopSequenceLayer.graphics.toArray(),
			graphic = null;
		for (var i = stopSequenceGraphics.length - 2; i >= 0; --i)
		{
			graphic = stopSequenceGraphics[i];
			self._stopSequenceLayer.remove(graphic);
			graphic = null;
		}
	};

	Tool.prototype._refreshStopSymbol = function()
	{
		var self = this,
			stops = self._stops,
			stop = null;
		for (var i = stops.length - 1; i >= 0; --i)
		{
			stop = stops[i];
			switch (stop.attributes.StopType)
			{
				case self.StopTypeEnum.WAY_STOP:
					stop.symbol = self._throughStopSymbol();
					break;
				case self.StopTypeEnum.DESTINATION:
					stop.symbol = self._getDirectionStopSymbol(stop.attributes.Sequence);
					break;
				case self.StopTypeEnum.TERMINAL:
					stop.symbol = self._lastStopSymbol();
					break;
				default:
					break;
			}
		}
	};

	Tool.prototype._refreshStopSequenceSymbol = function()
	{
		var self = this,
			item = sequence = null,
			graphics = self._stopSequenceLayer.graphics;
		for (var i = graphics.length - 1; i >= 0; --i)
		{
			item = graphics.items[i];
			sequence = item.attributes.Sequence;
			item.symbol = self._stopSequenceSymbol(sequence);
		}
	};

	Tool.prototype.refreshStopCurbApproach = function()
	{
		var self = this;
		//updateCurbApproach(self._destinations);
		//updateCurbApproach(self._throughPoints);
		updateCurbApproach(self._wayPoints);
		function updateCurbApproach(points)
		{
			if (points && points.length > 0)
			{
				points.forEach(function(point) { point.attributes.CurbApproach = self._getCurbApproach(); })
			}
		}
	}
})();