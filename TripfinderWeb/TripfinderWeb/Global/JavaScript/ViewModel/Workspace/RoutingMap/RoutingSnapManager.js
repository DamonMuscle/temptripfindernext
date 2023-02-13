(function()
{
	createNamespace("TF.Document").RoutingSnapManger = RoutingSnapManger;

	var SNAP_TOLERANCE_METERS = 30;
	var SNAP_TOLERANCE_PIXEL = 10;
	function RoutingSnapManger(mapDocumentViewModel)
	{
		this.routeState = mapDocumentViewModel.routeState;
		this.isEnableSnapping = false;
		this.showSnapSymbolTimeout = null;
		this.streetFeatureLayerId = "streetFeatureLayer";
		this.snapSymbolLayerId = "snapSymbolLayerId";
		this.snapSymbolGraphic = null;
		this.pointerMoveEvent = null;
		this.pointerLeaveEvent = null;
		this.allStreetsInExtent = [];
		this.allJunctionPointsInExtent = [];
		this.allOthersInExtent = [];
		this.allOthersDataModelsInExtent = [];
		this.snappingPoint = null;
		this.mapDocumentViewModel = mapDocumentViewModel;
		// when snap is turn on or turn off, will fire this event
		this.snapToggleEvent = new TF.Events.Event();
	}

	var imageCrossJunction = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADMAAAAzCAYAAAA6oTAqAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAAAyElEQVRo3u2Z0QrDIAxFrRSy///a+bLuYQhSZJsuyTJ3DvggtCa3oUkkKTlwEbl52Nk8hVxLyR6i3AQBwGvIZhN4pUrzj+YpxgXERAUxExzfFqoGvRkshGZl/uQnV/FjqdS8ax8oIm8/W0pRtb1UZBATlT2lR4XuXZyeVW7Li9ao3ep/ri+eD2j2W2eZtSijdlv/c1V6Vtzsj84yi8yo3dZ/9aI5mZopmoj5FWg0AcAWpgATMAWICmKigpgJmAIA/Cv0ZlHxiswdOJVd3JVjXOcAAAAASUVORK5CYII=";
	var imageCrossVertex = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADMAAAAzCAYAAAA6oTAqAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAABrklEQVRo3u2ZQU7DMBBF50/ihhP0AO0B2CAhbsARUqSerqtuewmE1A0XYAdIEQegdeNh0YKiNpA4dd1UzJOySDLxzI+l8bdMFIGrLHMx8iCmkM/VimOIiiZIUZRmtJt1IFarPPlPiykmCiqmr6iYDsi5hQZDvZmiNMJENAGwYOYiSRJh5gLAgogmdEFddARgaYyRLMsOLmOMAFgS0Sh04tCeacTMj8aYYVOgtbZwzt0R0Uuo5CGnmwHM2wghIjLGDAHMQ9YQUkyepumNzwe7+Lx3YgBMmf2GY2YCMA1VQ0q0XaHrNk5/rdz78QC8ZqUi6Losy855q/Xjt51g5Xldk5D9+CRJJE1TbzGbzYbKsvzJ4Zu3Wj9/v9hXXLmXmusgXkQ+vJVseT8mb7X+tC6gZuBGRGRJRPe+Spxzz8fkrcYHawAiMnPOzxw750hEZqFqCLloMoCnwWDQuhGs1+uliNwSUZAtQsh1xolIbq0t2gRbawsRyUMJORXjlt5sfO5C21J1za871/y2c80PdEGuWVHOgZ4CdEBPAfqKiukrKqYDegqgKP8V9WZ9JdbMfAEPFc39UA6fRwAAAABJRU5ErkJggg==";

	/**
	* when map is loaded, please call this function to initialize 
	*/
	RoutingSnapManger.prototype.init = function(map)
	{
		TF.snapTolerance = this._getTolerance();
		this._arcgis = tf.map.ArcGIS;
		this._map = map;
		this._initToggleSnap();
		this._initSnapCursorImage();
		this._addSnapSymbolLayer();
		PubSub.subscribe("StreetChange", this.streetChange);
	};

	RoutingSnapManger.prototype.streetChange = function()
	{
		if (this.isEnableSnapping && this._isStreetOpen())
		{
			this._initGeometryInExtent();
		}
	};

	/**
	 * get snapping point
	 */
	RoutingSnapManger.prototype.getSnappingPoint = function()
	{
		return Promise.resolve(this.snappingPoint);
	};

	/**
	* get street on junction point
	*/
	RoutingSnapManger.prototype.getJunctionStreetOnPoint = function(point, streets)
	{
		var self = this;
		var intersectsStreet = [];

		if (!point || !point.x)
		{
			return Promise.resolve([]);
		}
		return (streets ? Promise.resolve(streets) : TF.StreetHelper.getStreetInExtent(point, "file")).then(function(streets)
		{
			streets.forEach(function(street)
			{
				if (street)
				{
					var points = [street.geometry.paths[0][0], street.geometry.paths[0][street.geometry.paths[0].length - 1]];
					if ((points[0][0].toFixed(1) == point.x.toFixed(1) && points[0][1].toFixed(1) == point.y.toFixed(1)) ||
						(points[1][0].toFixed(1) == point.x.toFixed(1) && points[1][1].toFixed(1) == point.y.toFixed(1)))
					{
						intersectsStreet.push(street);
					}
				}
			});
			var isJunctionPoint = self._isJunctionPointOnStreet(intersectsStreet, point);
			if (isJunctionPoint)
			{
				return intersectsStreet.map(function(street)
				{
					street.id = street.OBJECTID;
					return { attributes: { dataModel: street }, geometry: street.geometry };
				});
			}
		});
	};

	RoutingSnapManger.prototype.getJunctionPointsInBuffer = function(point, distanceBuffer)
	{
		var self = this;
		var distance = distanceBuffer || 5;// unit meter
		var extent = tf.map.ArcGIS.geometryEngine.geodesicBuffer(point, distance, 'meters').extent;
		return TF.StreetHelper.getStreetInExtent(extent, "file").then(function(streets)
		{
			var streetInExtent = [];
			streets.forEach(function(street)
			{
				if (street && extent.intersects(street.geometry))
				{
					streetInExtent.push(street);
				}
			});
			var pointAndStreets = self._findStreetSnapPoint(streetInExtent);
			if (pointAndStreets.length == 0)
			{
				return;
			}
			var points = [];
			pointAndStreets.forEach(function(p)
			{
				var intersectsStreet = p.streets;
				var isJunctionPoint = self._isJunctionPointOnStreet(intersectsStreet, p.point);
				if (isJunctionPoint)
				{
					var tempLine = new tf.map.ArcGIS.Polyline({ paths: [[p.point.x, p.point.y], [point.x, point.y]], spatialReference: point.spatialReference });
					p.distance = tf.map.ArcGIS.geometryEngine.geodesicLength(tempLine, "meters");//tf.map.ArcGIS.geometryEngine.distance(p.point, point);
					points.push(p);
				}
			});
			if (points.length == 0)
			{
				return;
			}

			var junctionPoint = Enumerable.From(points).OrderBy("$.distance").First();
			junctionPoint.streets = junctionPoint.streets.map(function(street)
			{
				connectStreet(streets, street, junctionPoint.streets);
				street.id = street.OBJECTID;
				return { attributes: { dataModel: street }, geometry: street.geometry };
			});

			return [junctionPoint];
		});
	};

	function connectStreet(streetSource, street, junctionStreets)
	{
		var connects = [], searchCount = 2;
		var usedStreetKeys = _.keyBy(junctionStreets, function(c) { return c.OBJECTID; });
		for (var connectCount = 0; connectCount < searchCount; connectCount++)
		{
			for (var i = 0; i < streetSource.length; i++)
			{
				var connectStreet = streetSource[i];
				if (!usedStreetKeys[connectStreet.OBJECTID])
				{
					var isStartConnect = street.geometry.paths[0][street.geometry.paths[0].length - 1][0] == connectStreet.geometry.paths[0][0][0]
						&& street.geometry.paths[0][street.geometry.paths[0].length - 1][1] == connectStreet.geometry.paths[0][0][1];
					var isEndConnect = connectStreet.geometry.paths[0][connectStreet.geometry.paths[0].length - 1][0] == street.geometry.paths[0][0][0]
						&& connectStreet.geometry.paths[0][connectStreet.geometry.paths[0].length - 1][1] == street.geometry.paths[0][0][1];
					if (isStartConnect || isEndConnect)
					{
						connectStreet.isStartConnect = isStartConnect;
						usedStreetKeys[connectStreet.OBJECTID] = true;
						connects.push(connectStreet);
					}
				}
			}

			if (connects.length == 1)
			{
				if (connects[0].isStartConnect)
				{
					street.geometry.paths[0] = street.geometry.paths[0].concat(connects[0].geometry.paths[0]);
				} else
				{
					street.geometry.paths[0] = connects[0].geometry.paths[0].concat(street.geometry.paths[0]);
				}
				street.geometry = tf.map.ArcGIS.geometryEngine.simplify(street.geometry);
			} else
			{
				break;
			}
		}
	}

	/**
	* get nearest junction point and relate street in special buffer
	* @param {point} point.
	* @param {number} distanceBuffer unit meter.
	* @returns {object} 
	*/
	RoutingSnapManger.prototype.getNearestJunctionPointInBuffer = function(point, distanceBuffer)
	{
		var self = this;
		var distance = distanceBuffer || 5;// unit meter
		var extent = tf.map.ArcGIS.geometryEngine.geodesicBuffer(point, distance, 'meters').extent;
		return TF.StreetHelper.getStreetInExtent(point, "file").then(function(streets)
		{
			var streetInExtent = [];
			streets.forEach(function(street)
			{
				if (street && extent.intersects(street.geometry))
				{
					streetInExtent.push(street);
				}
			});
			var pointAndStreets = self._findStreetSnapPoint(streetInExtent);
			if (pointAndStreets.length == 0)
			{
				return;
			}
			var points = [];
			pointAndStreets.forEach(function(p)
			{
				var intersectsStreet = p.streets;
				var isJunctionPoint = self._isJunctionPointOnStreet(intersectsStreet, p.point);
				if (isJunctionPoint)
				{
					var tempLine = new tf.map.ArcGIS.Polyline({ paths: [[p.point.x, p.point.y], [point.x, point.y]], spatialReference: point.spatialReference });
					p.distance = tf.map.ArcGIS.geometryEngine.geodesicLength(tempLine, "meters");//tf.map.ArcGIS.geometryEngine.distance(p.point, point);
					points.push(p);
				}
			});
			if (points.length == 0)
			{
				return;
			}
			var junctionPoint = Enumerable.From(points).OrderBy(function(c) { return c.distance; }).First();
			junctionPoint.streets = junctionPoint.streets.map(function(street)
			{
				street.id = street.OBJECTID;
				return { attributes: { dataModel: street }, geometry: street.geometry };
			});
			return junctionPoint;
		});
	};

	RoutingSnapManger.prototype.findJunctionInGeometry = function(geometry)
	{
		var self = this;
		return TF.StreetHelper.getStreetInExtent(geometry, "file").then(function(streets)
		{
			var streetInExtent = [];
			streets.forEach(function(street)
			{
				if (street && tf.map.ArcGIS.geometryEngine.intersects(geometry, street.geometry))
				{
					streetInExtent.push(street);
				}
			});
			var pointAndStreets = self._findStreetSnapPoint(streetInExtent);
			if (pointAndStreets.length == 0)
			{
				return;
			}
			var points = [];
			pointAndStreets.forEach(function(p)
			{
				var intersectsStreet = p.streets;
				var isJunctionPoint = self._isJunctionPointOnStreet(intersectsStreet, p.point);
				if (isJunctionPoint)
				{
					points.push(p);
				}
			});
			if (points.length == 0)
			{
				return;
			}
			return points.map(function(c)
			{
				return c.point;
			});
		});
	};

	/**
	 * when click s key, enable the create parcel snap to street , if click s key again, disable it
	 * @returns {void} 
	 */
	RoutingSnapManger.prototype._initToggleSnap = function()
	{
		var self = this;
		// a black cross symbol, use image data to avoid image path can not find when combine javascript file to one file
		tf.documentEvent.bind("keydown.mapSnap", this.routeState, function(e)
		{
			var $target = $(e.target);
			var sKey = 83;
			// 83 is the s key, avoid s key when on typing in input
			var isSKeyClicked = e.keyCode == sKey && !e.ctrlKey && !($target.is("input") && !$target.hasClass("number")) && !$target.is("textarea");
			if (isSKeyClicked)
			{
				if (!self.isEnableSnapping)
				{
					self._enableSnapping();
					self.isEnableSnapping = true;
				} else
				{
					self._disableSnapping();
					self.isEnableSnapping = false;
				}
				self.snapToggleEvent.notify(self.isEnableSnapping);
			}
		});
	};

	RoutingSnapManger.prototype._initSnapCursorImage = function()
	{
		this.imageCrossJunctionSymbol = new this._arcgis.PictureMarkerSymbol({ url: imageCrossJunction, width: 45, height: 45 });
		this.imageCrossVertexSymbol = new this._arcgis.PictureMarkerSymbol({ url: imageCrossVertex, width: 45, height: 45 });
	};

	RoutingSnapManger.prototype._addSnapSymbolLayer = function()
	{
		this._map.add(new tf.map.ArcGIS.GraphicsLayer({ id: this.snapSymbolLayerId }), 0);
		this.snapSymbolGraphic = new tf.map.ArcGIS.Graphic({
			geometry: {
				type: "point",
				longitude: 0,
				latitude: 0
			},
			visible: false
		});
		this._map.findLayerById(this.snapSymbolLayerId).add(this.snapSymbolGraphic);
	};

	/**
	 * enable snapping
	 * @returns {void} 
	 */
	RoutingSnapManger.prototype._enableSnapping = function()
	{
		var self = this;
		var mapView = self._map.mapView;
		this.pointerMoveEvent = mapView.on("pointer-move", function(e)
		{
			if (self._mouseMoveSnapTimeout)
			{
				clearTimeout(self._mouseMoveSnapTimeout);
			}

			self._mouseMoveSnapTimeout = setTimeout(function()
			{
				self._pointerMoveEvent(e);
			}, 50);

		});

		this.pointerLeaveEvent = mapView.on("pointer-leave", function()
		{
			self._removeSnapPoint();
		});

		this.extentChangeEvent = mapView.watch("extent", function()
		{
			self._initGeometryInExtent();
		});

		this.watchSketchView = tf.map.ArcGIS.watchUtils.watch(self._map.SketchViewModel, "state", function(newValue)
		{
			if (newValue == "ready")
			{
				self._initGeometryInExtent();
			}
		});

		self._initGeometryInExtent();
	};

	/**
	 * disable snapping
	 * @returns {void} 
	 */
	RoutingSnapManger.prototype._disableSnapping = function()
	{
		var self = this;
		self._hidePointCursorTitle();
		clearTimeout(self.extentChangeTimeout);
		if (self.snapSymbolGraphic)
		{
			self.snapSymbolGraphic.geometry = null;
		}
		self.snappingPoint = null;
		self.pointerMoveEvent && self.pointerMoveEvent.remove();
		self.extentChangeEvent && self.extentChangeEvent.remove();
		self.pointerLeaveEvent && self.pointerLeaveEvent.remove();
		this.watchSketchView && this.watchSketchView.remove();
	};

	RoutingSnapManger.prototype._pointerMoveEvent = async function(evt)
	{
		var self = this;
		var extent = this._getScreenPointExtent(evt);
		var point = await this._findIntersectPoint(extent, evt);
		if (point)
		{
			self._displayPointCursorTitle(point.geometry, point.type);
			self.snapSymbolGraphic.visible = true;
			self.snapSymbolGraphic.geometry = point.geometry;
			self.snapSymbolGraphic.symbol = point.type == Types.Junction ? self.imageCrossJunctionSymbol : self.imageCrossVertexSymbol;
			self.snappingPoint = point.geometry;
		} else
		{
			self._removeSnapPoint();
		}
	};

	RoutingSnapManger.prototype._removeSnapPoint = function()
	{
		this._hidePointCursorTitle();
		this.snapSymbolGraphic.visible = false;
		this.snapSymbolGraphic.geometry = null;
		this.snappingPoint = null;
	};

	/**
	* calculate the tolerance extent
	*/
	RoutingSnapManger.prototype._getScreenPointExtent = function(evt)
	{
		var mapView = this._map.mapView;

		if (this._map.SketchViewModel && this._map.SketchViewModel.state == "active" && this._map.SketchViewModel.activeTool != "point")
		{
			var tolerance = SNAP_TOLERANCE_PIXEL;
			var screenPoint1 = {
				x: evt.x - tolerance,
				y: evt.y + tolerance
			};

			var screenPoint2 = {
				x: evt.x + tolerance,
				y: evt.y - tolerance
			};

			var point1 = mapView.toMap(screenPoint1);
			var point2 = mapView.toMap(screenPoint2);

			var extent = new tf.map.ArcGIS.Extent(point1.x, point1.y, point2.x, point2.y, mapView.spatialReference);
			return extent;
		}

		return tf.map.ArcGIS.geometryEngine.buffer(mapView.toMap({ x: evt.x, y: evt.y }), SNAP_TOLERANCE_METERS, "meters").extent;
	};

	/**
	* use the tolerance to get the intersect point
	*/
	RoutingSnapManger.prototype._findIntersectPoint = async function(extent, evt)
	{
		var points = [];
		var point = this._isStreetOpen() ? await this._findJunctionInExtent(extent) : await this._findJunctionPoint(evt);
		if (point)
		{
			point.pointType = Types.Junction;
			points.push(point);
		}

		point = this._findOtherInExtent(extent);
		if (point)
		{
			point.pointType = Types.Vertex;
			points.push(point);
		}

		if (points.length > 0)
		{
			point = this._getClosestPoint(points, extent);
			if (point.pointType == Types.Vertex)
			{
				var junctionPoints = points.filter((p) => { return p.pointType == Types.Junction && Math.abs(p.distance - point.distance) < 0.05; });
				if (junctionPoints.length > 0)
				{
					point = junctionPoints[0];
				}
			}
			return { geometry: point, type: point.pointType };
		}
	};

	RoutingSnapManger.prototype._findJunctionInExtent = function(extent)
	{
		var self = this;
		var points = [];
		if (self.allJunctionPointsInExtent.length > 0)
		{
			for (let i = 0; i < self.allJunctionPointsInExtent.length; i++)
			{
				if (extent.intersects(self.allJunctionPointsInExtent[i].geometry))
				{
					points.push(self.allJunctionPointsInExtent[i].geometry);
				}
			}
		} else
		{
			var streetInExtent = [];
			for (let i = 0; i < this.allStreetsInExtent.length; i++)
			{
				if (extent.intersects(this.allStreetsInExtent[i].geometry))
				{
					streetInExtent.push(this.allStreetsInExtent[i]);
				}
			}

			var pointAndStreets = self._findStreetSnapPoint(streetInExtent);
			if (pointAndStreets.length == 0)
			{
				return Promise.resolve(false);
			}

			pointAndStreets.forEach(function(pointAndStreet)
			{
				var point = pointAndStreet.point;
				var intersectsStreet = pointAndStreet.streets;

				var isJunctionPoint = self._isJunctionPointOnStreet(intersectsStreet, point);
				if (isJunctionPoint)
				{
					points.push(point);
				}
			});
		}

		if (points.length > 0)
		{
			return Promise.resolve(self._getClosestPoint(points, extent));
		}
	};

	RoutingSnapManger.prototype._findJunctionPoint = function(evt)
	{
		var self = this;
		var mapView = self._map.mapView;

		var screenPoint = {
			x: evt.x,
			y: evt.y
		};
		var point = mapView.toMap(screenPoint);

		var reverseGeocodeUrl = arcgisUrls.StreetGeocodeServiceFile + "/reverseGeocode"
		var query = {
			"f": "json",
			"location": point,
			"Distance": SNAP_TOLERANCE_METERS,
			"returnIntersection": true
		};
		return tf.map.ArcGIS.esriRequest(reverseGeocodeUrl, {
			responseType: "json",
			query: query
		}).then(function(res)
		{
			if (res && res.data.address.Addr_type == "StreetInt")
			{
				var line = new tf.map.ArcGIS.Polyline({
					paths: [[point.x, point.y], [res.data.location.x, res.data.location.y]],
					spatialReference: { wkid: 102100 }
				})
				if (tf.map.ArcGIS.geometryEngine.geodesicLength(line, "meters") <= SNAP_TOLERANCE_METERS)
				{
					return new tf.map.ArcGIS.Point(res.data.location);
				}
			}
		})
	};

	RoutingSnapManger.prototype._getClosestPoint = function(points, extent)
	{
		if (points.length > 0)
		{
			points.forEach(function(point)
			{
				point.distance = tf.map.ArcGIS.geometryEngine.distance(extent.center, point, "meters");
			});
			return Enumerable.From(points).OrderBy(function(c) { return c.distance; }).First();
		}
	};

	RoutingSnapManger.prototype._isJunctionPointOnStreet = function(intersectsStreet, point)
	{
		var self = this;
		if (intersectsStreet.length < 3)
		{
			return false;
		}
		var sameElevationCount = 0;
		for (var i = 0; i < intersectsStreet.length; i++)
		{
			for (var j = i + 1; j < intersectsStreet.length; j++)
			{
				var point1Elevation = self._getStreetJunctionElevation(intersectsStreet[i], point);
				var point2Elevation = self._getStreetJunctionElevation(intersectsStreet[j], point);
				var isJunctionPoint = point1Elevation != null && point2Elevation != null && point1Elevation == point2Elevation;
				if (isJunctionPoint)
				{
					sameElevationCount++;
				}
			}
		}
		if (sameElevationCount > 1)
		{
			return true;
		}
		return false;
	};

	RoutingSnapManger.prototype._findStreetSnapPoint = function(streetInExtent)
	{
		var self = this;
		var pointAndStreets = [];
		var streetDictionary = {};// this dictionary help to avoid duplicate point
		for (var i = 0; i < streetInExtent.length; i++)
		{
			var street = streetInExtent[i];
			var points = [street.geometry.paths[0][0], street.geometry.paths[0][street.geometry.paths[0].length - 1]];
			for (var pIndex = 0; pIndex < points.length; pIndex++)
			{
				var intersectStreets = [street];
				var point = points[pIndex];
				for (var j = i + 1; j < streetInExtent.length; j++)
				{
					var otherStreet = streetInExtent[j];
					var start = otherStreet.geometry.paths[0][0],
						end = otherStreet.geometry.paths[0][otherStreet.geometry.paths[0].length - 1];

					if ((point[0] == start[0] && point[1] == start[1]) ||
						(point[0] == end[0] && point[1] == end[1]))
					{
						intersectStreets.push(otherStreet);
					}
				}
				var key = point[0] + "-" + point[1];
				if (intersectStreets.length >= 3 && !streetDictionary[key])
				{
					streetDictionary[key] = true;

					pointAndStreets.push({
						point: new tf.map.ArcGIS.Point({
							x: point[0],
							y: point[1],
							spatialReference: self._map.mapView.spatialReference
						}),
						streets: intersectStreets
					});
				}
			}
		}
		return pointAndStreets;
	};

	RoutingSnapManger.prototype._getStreetJunctionElevation = function(street, point)
	{
		var isFrom = false;
		if (street.geometry.paths[0][0][0] == point.x && street.geometry.paths[0][0][1] == point.y)
		{
			isFrom = true;
		}
		if (isFrom)
		{
			if (street.attributes)
			{
				return street.attributes.dataModel.FromElevation;
			}
			return street.FromElevation;
		}
		if (street.attributes)
		{
			return street.attributes.dataModel.ToElevation;
		}
		return street.ToElevation;
	};

	/**
	* find one point in a small extent as a vertex
	*/
	RoutingSnapManger.prototype._findOtherInExtent = function(extent)
	{
		var self = this;
		var allOtherGeometry = this.allOthersInExtent, j, k, x, y, type;
		var allPoints = [];
		for (var i = 0; i < allOtherGeometry.length; i++)
		{
			var geometry = allOtherGeometry[i];
			try
			{
				if (extent.intersects(geometry))
				{
					if (geometry.type == "point")
					{
						return geometry;
					}
					if (geometry.type == "polyline")
					{
						type = "paths";
					}
					if (geometry.type == "polygon")
					{
						type = "rings";
					}
					for (j = 0; j < geometry[type].length; j++)
					{
						for (k = 0; k < geometry[type][j].length; k++)
						{
							x = geometry[type][j][k][0];
							y = geometry[type][j][k][1];
							if (extent.xmax >= x && extent.xmin <= x && extent.ymax >= y && extent.ymin <= y)
							{
								allPoints.push(new tf.map.ArcGIS.Point({ x: x, y: y, spatialReference: self._map.mapView.spatialReference }));
							}
						}
					}
				}
			} catch (e)
			{
			}
		}

		return self._getClosestPoint(allPoints, extent);
	};

	/**
	* find one point in a small extent as a vertex
	*/
	RoutingSnapManger.prototype._findOtherItemInExtent = function(extent)
	{
		var self = this;
		var allOtherGeometry = this.allOthersInExtent, j, k, x, y, type;
		for (var i = 0; i < allOtherGeometry.length; i++)
		{
			var geometry = allOtherGeometry[i];
			if (extent.intersects(geometry))
			{
				if (geometry.type == "point")
				{
					return geometry;
				}
				if (geometry.type == "polyline")
				{
					type = "paths";
				}
				if (geometry.type == "polygon")
				{
					type = "rings";
				}
				for (j = 0; j < geometry[type].length; j++)
				{
					for (k = 0; k < geometry[type][j].length; k++)
					{
						x = geometry[type][j][k][0];
						y = geometry[type][j][k][1];
						if (extent.xmax >= x && extent.xmin <= x && extent.ymax >= y && extent.ymin <= y)
						{
							return {
								point: new tf.map.ArcGIS.Point({ x: x, y: y, spatialReference: self._map.mapView.spatialReference }),
								item: this.allOthersDataModelsInExtent[i]
							};
						}
					}
				}
			}
		}
	};

	/**
	* when extent change, calculate the points in current map view extent
	*/
	RoutingSnapManger.prototype._initGeometryInExtent = function()
	{
		var self = this;
		clearTimeout(self.extentChangeTimeout);
		self.extentChangeTimeout = setTimeout(function()
		{
			var extent = self._map.mapView.extent;
			// init street in map view extent
			var allStreetsInExtent = [];

			self._getStreet(extent).then(function(streets)
			{
				if (streets.length > 0)
				{
					if (streets[0].geometry.type == "polyline")
					{
						streets.forEach(function(street)
						{
							if (extent.intersects(street.geometry))
							{
								allStreetsInExtent.push(street);
							}
						});
						self.allStreetsInExtent = allStreetsInExtent;
					}
					else
					{
						self.allJunctionPointsInExtent = streets;
					}
				}
			});

			// init all other geometry in map view extent and also include street vertex
			var allOthersInExtent = [];
			var allOthersDataModelsInExtent = [];
			var query = new tf.map.ArcGIS.Query();
			query.outFields = ["id"];
			query.where = "1=1";
			query.geometry = self._map.mapView.extent;
			query.returnGeometry = true;

			self._map.mapView.allLayerViews.forEach(function(layerView)
			{
				var isTempDrawLayer = (/\w+-layer-\d*/g).test(layerView.layer.id);
				if (layerView.layer.id == self.snapSymbolLayerId ||
					!TF.Helper.MapHelper.layerVisible(self._map, layerView.layer) ||
					isTempDrawLayer)
				{
					return;
				}
				if (layerView.layer.graphics)
				{
					layerView.layer.graphics.items.forEach(function(graphic)
					{
						if (graphic.geometry.type != "point" && graphic.visible && extent.intersects(graphic.geometry) && graphic.attributes)
						{
							allOthersInExtent.push(graphic.geometry);
							allOthersDataModelsInExtent.push(graphic);
						}
					});
				} else if (layerView.layer.type == "feature" && layerView.layer.fields.some(function(c) { return c.name == "id"; }))
				{
					layerView.layer.queryFeatures(query).then(function(featureSet)
					{
						featureSet.features.map(function(graphic)
						{
							if (graphic.geometry.type != "point" && graphic.visible && extent.intersects(graphic.geometry) && graphic.attributes)
							{
								self.allOthersInExtent.push(graphic.geometry);
								allOthersDataModelsInExtent.push(graphic);
							}
						});
					});
				}
			});

			self.allOthersInExtent = allOthersInExtent;
			self.allOthersDataModelsInExtent = allOthersDataModelsInExtent;
		}, 100);
	};

	RoutingSnapManger.prototype._displayPointCursorTitle = function(point, type)
	{
		var self = this;
		var pointCursorTitle = $("#pointCursorTitle");
		var screenPoint = self._map.mapView.toScreen(point);
		if (pointCursorTitle.length == 0)
		{
			pointCursorTitle = $("<div id='pointCursorTitle'></div>").css({
				position: "absolute",
				"z-index": 100
			});
			$("body").append(pointCursorTitle);
		}
		var offset = $(self._map.mapView.container).offset();
		pointCursorTitle.show().css({
			top: screenPoint.y + offset.top + 15,
			left: screenPoint.x + offset.left - 60
		}).text(type);
	};

	RoutingSnapManger.prototype._hidePointCursorTitle = function()
	{
		$("#pointCursorTitle").hide();
	};

	RoutingSnapManger.prototype._getTolerance = function()
	{
		if (!this._isStreetOpen())
		{
			return SNAP_TOLERANCE_METERS;
		}
		return parseInt(tf.storageManager.get("mapSnapTolerance")) || TF.snapTolerance;
	};

	RoutingSnapManger.prototype._isStreetOpen = function()
	{
		if (this._map)
		{
			return this.mapDocumentViewModel.mapEditingPaletteViewModel.obShow();
		}
		return false;
	};

	RoutingSnapManger.prototype._getStreet = function()
	{
		if (this._isStreetOpen())
		{
			return Promise.resolve(this.mapDocumentViewModel.mapEditingPaletteViewModel.myStreetsViewModel.dataModel.all);
		}
		return Promise.resolve([]);
	};

	RoutingSnapManger.prototype.dispose = function()
	{
		this._disableSnapping();
		this.snapToggleEvent.unsubscribeAll();
		PubSub.unsubscribe(this.streetChange);
	};

	var Types = {
		Junction: "Junction",
		Vertex: "Vertex"
	};
})();