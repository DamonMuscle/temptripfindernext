(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").GeoSearch = GeoSearch;

	function GeoSearch(arcgis, map, isDirectionPalette, sr)
	{
		var self = this;
		self.arcgis = arcgis;
		self.map = map;
		self.isDirectionPalette = isDirectionPalette;
		self.spatialReference = sr ? sr : { wkid: 102100 };
		self.streetUrl = arcgisUrls.MapEditingOneService + "/43";
		self.addressPointUrl = arcgisUrls.MapEditingOneService + "/45";
		self.insetDistance = 15;
		self.offsetDistance = 10;
		//self.spatialReference = self.map ? self.map.mapView.spatialReference : { wkid: 102100 };
		self.init();
	}

	var maxSuggestions = 50;

	GeoSearch.prototype.init = function()
	{
		var self = this;
		self.RoutingSnapManger = new TF.Document.RoutingSnapManger({ routeState: "" });
	};

	GeoSearch.prototype.initSuggest = function()
	{
		var self = this;
		self.findAddressUrl = arcgisUrls.StreetGeocodeServiceFile + "/findAddressCandidates";
		self.suggestUrl = arcgisUrls.StreetGeocodeServiceFile + "/suggest";
	};

	GeoSearch.prototype.suggestAddressPoint = function(searchText)
	{
		var self = this;
		return tf.startup.loadArcgisUrls().then(function()
		{
			self.findAddressUrl = arcgisUrls.AddressPointGeocodeService + "/findAddressCandidates";
			self.suggestUrl = arcgisUrls.AddressPointGeocodeService + "/suggest";
			return Promise.resolve(self._suggest(searchText, true));
		})
	};

	GeoSearch.prototype.suggest = function(searchText)
	{
		var self = this;
		return tf.startup.loadArcgisUrls().then(function()
		{
			self.initSuggest();
			return Promise.resolve(self._suggest(searchText));
		})
	};

	GeoSearch.prototype._suggest = function(searchText, isAddressPoint)
	{
		var self = this;
		var query = {
			"f": "json",
			"text": searchText,
			"maxSuggestions": maxSuggestions
		};
		if (self.map) { query.location = JSON.stringify(self.map.mapView.extent ? self.map.mapView.extent.center : self.map.mapView.center); }
		var suggestPromise = tf.map.ArcGIS.esriRequest(self.suggestUrl, {
			responseType: "json",
			query: query
		});

		var splitAddress = searchText.split(",");
		var houseNumber = splitAddress[0].split(" ")[0];
		const digAndAlphaRegex = /^[0-9a-zA-Z]+$/;// RW-37432. With the changes in RW-16206 and RW-14543, the requirement for house number needs to allow digits or alphabets.

		// quick search on address point with streetname only
		if (isAddressPoint && !digAndAlphaRegex.test(houseNumber))
		{
			var escapedText = searchText.replaceAll('\'', '\'\'');
			var where = "Address like '%" + escapedText + "%'";
			var queryTask = new self.arcgis.QueryTask(self.addressPointUrl);
			var query = new self.arcgis.Query();
			query.where = where;
			query.returnGeometry = true;
			query.outFields = ["Address", "XCoord", "YCoord", "City", "State", "PostalCode"];
			querypromise = queryTask.execute(query);
			return suggestPromise.then((responses) =>
			{
				var suggestions = responses.data.suggestions;
				return Promise.all([querypromise, self.suggestResults(suggestions, searchText, isAddressPoint)]).then((results) =>
				{
					if (results && results.length == 2 && results[0].features.length > 0)
					{
						var array = results[0].features.slice(0, maxSuggestions);
						var addresArr = array.map(item =>
						{
							return {
								'address': item.attributes["Address"] + ", " + item.attributes["City"] + ", " + item.attributes["State"] + ", " + item.attributes["PostalCode"],
								'location': {
									x: item.attributes["XCoord"],
									y: item.attributes["YCoord"]
								}
							}
						});

						return addresArr.concat(results[1])
					} else
					{
						return Promise.resolve([]);
					}
				});
			});

		} else
		{
			return suggestPromise.then(function(responses)
			{
				var suggestions = responses.data.suggestions;
				return self.suggestResults(suggestions, searchText, isAddressPoint);
			});
		}
	};

	GeoSearch.prototype.suggestResults = function(suggestions, searchText, isAddressPoint)
	{
		var self = this;
		if (suggestions.length > 0)
		{
			return self._getSuggestions(suggestions, searchText, isAddressPoint);
		}
		return Promise.resolve([]);
	};

	GeoSearch.prototype._getSuggestions = function(suggestions, searchText, isAddressPoint)
	{
		var self = this;
		return new Promise(function(resolve, reject)
		{
			var returnSuggestions = [], index = suggestions.length, returned = false, requestList = [];
			for (var i in suggestions)
			{
				var queryParams = {
					"f": "json",
					"Address": suggestions[i].text,
					"outFields": "Addr_type, User_fld",
					"outSR": 102100
				};
				if (isAddressPoint)
				{
					queryParams = {
						"f": "json",
						"SingleLine": suggestions[i].text,
						"Location": suggestions[i].location,
						"outFields": "Addr_type, User_fld",
						"outSR": 102100
					}
				}
				var findAddressRequest = tf.map.ArcGIS.esriRequest(self.findAddressUrl, {
					responseType: "json",
					query: queryParams
				});
				findAddressRequest.then(function(response)
				{
					if (response.data.candidates.length > 0)
					{
						var suggestion = response.data.candidates[0], reg = /^[0-9a-zA-Z]+\.?$/, firstInput = searchText.split(',')[0].trim().split(' ')[0];
						// if (!(searchText.indexOf(" & ") >= 0 || searchText.indexOf(" && ") >= 0 || searchText.indexOf(" and ") >= 0) &&
						// 	(!isAddressPoint && suggestion.attributes.Addr_type == "POI"))
						// {
						// 	index = index - 1;
						// 	return;
						// }
						if (firstInput.trim() != "0" &&
							(reg.test(firstInput) || suggestion.attributes.Addr_type !== "StreetName"))
						{
							if (!suggestion.address.split(",")[3])
							{
								var location = new tf.map.ArcGIS.Point({ x: suggestion.location.x, y: suggestion.location.y, spatialReference: { wkid: 102100 } });
								suggestion.address += "," + TF.RoutingMap.GeocodeHelper.getZipCodeText(location);
							}
							returnSuggestions.push(suggestion);
						}
					}
					index = index - 1;
					if ((index === 0 || returnSuggestions.length === 5) && !returned)
					{
						returned = true;
						// requestList.forEach(function(request)
						// {
						// 	if (!request.isResolved())
						// 	{
						// 		request.cancel();
						// 	}
						// });
						return resolve(Enumerable.From(returnSuggestions).Distinct(function(d) { return d.address; }).ToArray());
					}
				});
				requestList.push(findAddressRequest);
			}
		});

	};
	GeoSearch.prototype.offsetInsetPoints = function(points, isGeocode, isSkip)
	{
		var self = this;
		if (isSkip) return Promise.resolve(points);
		tf.loadingIndicator.show();

		points = points.filter(function(p)
		{
			return p;
		});

		var pointGeoms = points.map(function(p)
		{
			var pGeom = new self.arcgis.Point({ x: p.location.x, y: p.location.y, spatialReference: { wkid: 102100 } });
			if (isGeocode)
			{
				pGeom = new self.arcgis.Point({ x: p.location.x, y: p.location.y, spatialReference: { wkid: 4326 } });
				pGeom = tf.map.ArcGIS.webMercatorUtils.geographicToWebMercator(pGeom);
			}
			return {
				Addr_type: p.attributes.Addr_type,
				address: p.address,
				geometry: pGeom
			};
		});

		return TF.StreetHelper.getStreetInExtent(pointGeoms.map(function(p) { return p.geometry; }), "file").then(function(streets)
		{
			var promises = [];
			pointGeoms.forEach(function(point)
			{
				promises.push(self.offsetInsetPoint(point, streets));
			});

			return Promise.all(promises).then(function(res)
			{
				tf.loadingIndicator.tryHide();
				points.forEach(function(point, i)
				{
					if (point && res[i])
					{
						if (isGeocode) res[i] = tf.map.ArcGIS.webMercatorUtils.webMercatorToGeographic(res[i]);
						point.location.x = res[i].x;
						point.location.y = res[i].y;
						point.Xcoord = point.location.x;
						point.Ycoord = point.location.y;
					}
				});
				return points;
			});
		});
	};

	GeoSearch.prototype.offsetInsetPoint = function(point, streets)
	{
		var self = this;
		var geometry = point.geometry;
		if (point.Addr_type == "POI" || point.Addr_type == "StreetInt")
		{
			return Promise.resolve(geometry);
		}
		return self.findClosestLocationOnStreet(geometry, streets).then(function(street)
		{
			if (!street) return Promise.resolve(geometry);
			var closestStreet = street.geometry;
			var closestPointOnStreet = self.arcgis.geometryEngine.nearestCoordinate(closestStreet, geometry).coordinate;
			var offsetLine = new self.arcgis.Polyline({ paths: [[geometry.x, geometry.y], [closestPointOnStreet.x, closestPointOnStreet.y]], spatialReference: { wkid: 102100 } });
			var offsetLineDistance = self.arcgis.geometryEngine.geodesicLength(offsetLine, "meters");

			var startPoint = new self.arcgis.Point({ x: closestStreet.paths[0][0][0], y: closestStreet.paths[0][0][1], spatialReference: self.spatialReference });
			var pointsCount = closestStreet.paths[0].length;
			var endPoint = new self.arcgis.Point({ x: closestStreet.paths[0][pointsCount - 1][0], y: closestStreet.paths[0][pointsCount - 1][1], spatialReference: self.spatialReference });
			var toStartGeom = new self.arcgis.Polyline({ paths: [[startPoint.x, startPoint.y], [closestPointOnStreet.x, closestPointOnStreet.y]], spatialReference: { wkid: 102100 } });
			var toEndGeom = new self.arcgis.Polyline({ paths: [[endPoint.x, endPoint.y], [closestPointOnStreet.x, closestPointOnStreet.y]], spatialReference: { wkid: 102100 } });
			var toStartPDistance = self.arcgis.geometryEngine.geodesicLength(toStartGeom, "meters");
			var toEndPDistance = self.arcgis.geometryEngine.geodesicLength(toEndGeom, "meters");
			if (offsetLineDistance >= 10 && toStartPDistance >= 15 && toEndPDistance >= 15) return Promise.resolve(geometry);

			if ((toStartPDistance < 15 && toEndPDistance >= 15))
			{
				return self.RoutingSnapManger.getJunctionStreetOnPoint(startPoint, streets).then(function(startJunctions)
				{
					if (startJunctions && startJunctions.length > 1)
					{
						return getInOffPoint(closestStreet, startPoint, offsetLineDistance, toStartPDistance);
					}
					return Promise.resolve(geometry);
				});
			}
			else if ((toEndPDistance < 15 && toStartPDistance >= 15))
			{
				return self.RoutingSnapManger.getJunctionStreetOnPoint(endPoint, streets).then(function(endJunctions)
				{
					if (endJunctions && endJunctions.length > 1)
					{
						return getInOffPoint(closestStreet, endPoint, offsetLineDistance, toEndPDistance);
					}
					return Promise.resolve(geometry);
				});
			}
			else if (toEndPDistance < 15 && toStartPDistance < 15)
			{
				return Promise.all([
					self.RoutingSnapManger.getJunctionStreetOnPoint(startPoint, streets),
					self.RoutingSnapManger.getJunctionStreetOnPoint(endPoint, streets)
				]).then(function(data)
				{
					var startJunctions = data[0];
					var endJunctions = data[1];
					if (startJunctions && endJunctions && startJunctions.length > 1 && endJunctions.length > 1)
					{
						return Promise.resolve(false);
					} else
					{
						return Promise.resolve(geometry)
					}
				});
			}
			else if (offsetLineDistance < 10)
			{
				var p = toStartPDistance < toEndPDistance ? startPoint : endPoint;
				var d = toStartPDistance < toEndPDistance ? toStartPDistance : toEndPDistance;
				return self.RoutingSnapManger.getJunctionStreetOnPoint(p, streets).then(function(endJunctions)
				{
					if (endJunctions && endJunctions.length > 1)
					{
						return getInOffPoint(closestStreet, p, offsetLineDistance, d);
					}
					return Promise.resolve(geometry);
				});
			}
			function getInOffPoint(streetGeom, junctionPoint, offsetLineDistance, insetDistance)
			{
				var _insetDistance = insetDistance > 15 ? insetDistance : 15;
				var _offsetDistance = offsetLineDistance > 10 ? offsetLineDistance : 10;
				var insetPoint = self._getInsetPointOnLine(junctionPoint, streetGeom, _insetDistance ? _insetDistance : 15);
				var buffer = self.arcgis.geometryEngine.geodesicBuffer(insetPoint, _offsetDistance, "meters");
				var segment = new self.arcgis.Polyline({
					type: "polyline",
					spatialReference: self.spatialReference,
					paths: [[[junctionPoint.x, junctionPoint.y], [insetPoint.x, insetPoint.y]]]
				});
				var anotherPoint = self._findPointOnLineByDistance(segment, self.arcgis.geometryEngine.geodesicLength(segment, "meters") + _offsetDistance + 2);
				segment = new self.arcgis.Polyline({
					type: "polyline",
					spatialReference: self.spatialReference,
					paths: [[[anotherPoint.x, anotherPoint.y], [insetPoint.x, insetPoint.y]]]
				});
				var rotateSegment = self._isPointOnRightOfLine(segment, geometry) ? self.arcgis.geometryEngine.rotate(segment, 90, insetPoint) : self.arcgis.geometryEngine.rotate(segment, -90, insetPoint);
				var segmentIntersection = self.arcgis.geometryEngine.intersect(buffer, rotateSegment);
				var p = null;
				if (segmentIntersection.paths[0][0][0] == insetPoint.x && segmentIntersection.paths[0][0][1] == insetPoint.y)
				{
					p = new self.arcgis.Point({ x: segmentIntersection.paths[0][1][0], y: segmentIntersection.paths[0][1][1], spatialReference: self.spatialReference });
				} else
				{
					p = new self.arcgis.Point({ x: segmentIntersection.paths[0][0][0], y: segmentIntersection.paths[0][0][1], spatialReference: self.spatialReference });
				}
				return Promise.resolve(p);

			}
			return Promise.resolve(geometry)

		});
	};

	GeoSearch.prototype.findClosestLocationOnStreet = function(geometry, streets)
	{
		var self = this;
		return self.attachClosetStreetToStop(geometry, streets).then(function(street)
		{
			return Promise.resolve(street);
		});
	};

	GeoSearch.prototype.attachClosetStreetToStop = function(point, streets)
	{

		var self = this;
		var extent = self.arcgis.geometryEngine.buffer(point, 30, "meters");
		var streetsPromise = streets ? Promise.resolve(streets) : TF.StreetHelper.getStreetInExtent(extent, "file");
		return streetsPromise.then(function(streets)
		{
			var streetsInExtent = getStreetsInExtent(streets, extent);

			return setNearestStreet(point, streetsInExtent);

		});

		function setNearestStreet(stops, streets)
		{
			var nearStreet = null;
			if (streets.length > 0)
			{
				var distance = 100000;
				for (var i = 0; i < streets.length; i++)
				{
					var d = self.arcgis.geometryEngine.distance(streets[i].geometry, point, "meters");
					if (d < distance)
					{
						nearStreet = streets[i];
						distance = d;
					}
				}
			}
			return nearStreet;
		}


		function getStreetsInExtent(streets, extent)
		{
			var streetsInExtent = [];
			streets.forEach(function(street)
			{
				if (self.arcgis.geometryEngine.intersects(street.geometry, extent))
				{
					streetsInExtent.push(street);
				}
			});
			return streetsInExtent;
		}

	};

	GeoSearch.prototype._findStreetByAddress = function(address)
	{
		var self = this;
		var splitAddress = address.split(",");
		var houseNumber = splitAddress[0].split(" ")[0];
		var streetName = splitAddress[0].substr(address.split(",")[0].indexOf(" ") + 1);
		var city = splitAddress.length > 1 ? splitAddress[1].substr(address.split(",")[1].indexOf(" ") + 1) : "";
		var where = "Street = '" + streetName + "'" + " AND " + "(" +
			"(FromLeft >= " + houseNumber + " AND ToLeft <= " + houseNumber + ")" + " OR " +
			"(FromRight >= " + houseNumber + " AND ToRight <= " + houseNumber + ")" + " OR " +
			"(FromLeft <= " + houseNumber + " AND ToLeft >= " + houseNumber + ")" + " OR " +
			"(FromRight <= " + houseNumber + " AND ToRight >= " + houseNumber + ")" + ")";
		if (city)
		{
			where += " AND " + "City = '" + city + "'";
		}
		var queryTask = new self.arcgis.QueryTask(self.streetUrl);
		var query = new self.arcgis.Query();
		query.where = where;
		query.returnGeometry = true;
		query.outFields = ["*"];
		return queryTask.execute(query);
	};

	GeoSearch.prototype._getInsetPointOnLine = function(junctionPoint, streetGeom, insetDistance)
	{
		var self = this;
		var segmentDistance = self.arcgis.geometryEngine.geodesicLength(streetGeom, "meters");
		if (self.insetDistance >= segmentDistance) return false;
		var fromStartToEnd = false;
		if (junctionPoint.x == streetGeom.paths[0][0][0] && junctionPoint.y == streetGeom.paths[0][0][1])
		{
			fromStartToEnd = true;
		}
		return self._getPointOnPolylineByDistanceToPoint(streetGeom, insetDistance, fromStartToEnd);
	}

	GeoSearch.prototype._getPointOnPolylineByDistanceToPoint = function(polyline, distance, fromStartToEnd)
	{
		var self = this;
		var segmentLength = 0,
			currentDifferenceLength = 0;
		polyline = polyline.clone();
		if (!fromStartToEnd) { polyline.paths[0] = polyline.paths[0].reverse(); }
		if (self.arcgis.geometryEngine.geodesicLength(polyline, "meters") <= distance)
		{
			return new self.arcgis.Point({
				type: "point",
				x: polyline.paths[0][0][0],
				y: polyline.paths[0][0][1],
				spatialReference: self.spatialReference
			});
		}
		for (var i = 0; i < polyline.paths[0].length - 1; i++)
		{
			var segment = new self.arcgis.Polyline({
				type: "polyline",
				spatialReference: self.spatialReference,
				paths: [[polyline.paths[0][i], polyline.paths[0][i + 1]]]
			});
			// segment.addPath([polyline.paths[0][i], polyline.paths[0][i + 1]]);
			segmentLength = segmentLength + self.arcgis.geometryEngine.geodesicLength(segment, "meters");
			if (segmentLength > distance)
			{
				currentDifferenceLength = distance - (segmentLength - self.arcgis.geometryEngine.geodesicLength(segment, "meters"));
				return self._findPointOnLineByDistance(segment, currentDifferenceLength);
			}
		}
	};

	GeoSearch.prototype._findPointOnLineByDistance = function(line, distance)
	{
		var self = this;
		var fromPoint = new self.arcgis.Point({ type: "point", x: line.paths[0][0][0], y: line.paths[0][0][1], spatialReference: self.spatialReference });
		var toPoint = new self.arcgis.Point({ type: "point", x: line.paths[0][1][0], y: line.paths[0][1][1], spatialReference: self.spatialReference });
		var ratio = distance / self.arcgis.geometryEngine.geodesicLength(line, "meters");
		var point = new self.arcgis.Point({
			type: "point",
			x: (1 - ratio) * fromPoint.x + ratio * toPoint.x,
			y: (1 - ratio) * fromPoint.y + ratio * toPoint.y,
			spatialReference: self.spatialReference
		});
		return point;
	};

	GeoSearch.prototype._isPointOnRightOfLine = function(line, point)
	{
		if (!line)
		{
			return false;
		}
		var self = this;
		var mindistance = null, minSeg = null;
		for (var i = 0; i < line.paths[0].length - 1; i++)
		{
			var polyline = new self.arcgis.Polyline({
				spatialReference: self.spatialReference,
				paths: [[line.paths[0][i], line.paths[0][i + 1]]]
			});
			var distance = self.arcgis.geometryEngine.distance(polyline, point, "meters");
			if (!mindistance || mindistance > distance)
			{
				mindistance = distance;
				minSeg = polyline;
			}
		}

		var x = point.x, y = point.y,
			x1 = minSeg.paths[0][0][0], y1 = minSeg.paths[0][0][1],
			x2 = minSeg.paths[0][1][0], y2 = minSeg.paths[0][1][1];
		var d = (x - x1) * (y2 - y1) - (y - y1) * (x2 - x1);
		if (d > 0) return true;
		return false;
	};



})();