(function()
{
	var MyStreetsHelper = {};
	createNamespace("TF.RoutingMap.MapEditingPalette").MyStreetsHelper = MyStreetsHelper;

	var colors = {
		green: [49, 255, 40],
		red: [255, 0, 0],
		yellow: [253, 255, 49],
		white: [255, 255, 255]
	};

	var scaleBase = 2256.994353;

	MyStreetsHelper.scaleBase = scaleBase;

	MyStreetsHelper.colors = colors;

	MyStreetsHelper.maneuverArrowStatusNull = {
		status: "null",
		color: colors.white
	};

	MyStreetsHelper.maneuverArrowStatusYellow = {
		status: "yellow",
		color: colors.yellow
	};

	MyStreetsHelper.maneuverArrowStatusRed = {
		status: "red",
		color: colors.red
	};

	var maneuverArrowStatus = [
		MyStreetsHelper.maneuverArrowStatusNull,
		MyStreetsHelper.maneuverArrowStatusYellow,
		MyStreetsHelper.maneuverArrowStatusRed
	];

	MyStreetsHelper.maneuverArrowStatus = maneuverArrowStatus;

	MyStreetsHelper.curbApproachNull = {
		status: "null",
		type: -1,
		color: colors.white,
	};

	MyStreetsHelper.curbApproachPrefer = {
		status: "prefer",
		type: 2,
		color: colors.yellow
	};

	MyStreetsHelper.curbApproachPrevent = {
		status: "prevent",
		type: 0,
		color: colors.red
	};

	var curbApproachColors = [
		MyStreetsHelper.curbApproachNull,
		MyStreetsHelper.curbApproachPrefer,
		MyStreetsHelper.curbApproachPrevent];

	MyStreetsHelper.curbApproachColors = curbApproachColors;

	var curbSideOfStreet = {
		right: 1,
		left: 2
	};

	MyStreetsHelper.curbSideOfStreet = curbSideOfStreet;

	function calculateDistance(p1, p2)
	{
		return Math.sqrt(Math.pow((p2[0] - p1[0]), 2) + Math.pow((p2[1] - p1[1]), 2));
	}

	function calcTotalLength(polylinePoints)
	{
		var totalLength = 0;
		for (var i = 0; i < polylinePoints.length - 1; i++)
		{
			totalLength += calculateDistance(polylinePoints[i], polylinePoints[i + 1]);
		}
		return totalLength;
	}

	function splitPolyline(polylinePoints, splitBuffer, distanceBuffer, map, isInExtent)
	{
		var splitPoints = [];
		polylinePoints = polylinePoints.slice();
		var totalLength = calcTotalLength(polylinePoints);
		var length = 0, calLength, sPoint, ePoint;
		splitBuffer = Math.min(splitBuffer, totalLength / 2);
		var extent = map.mapView.extent;
		for (var i = 0; i < polylinePoints.length - 1; i++)
		{
			var x = polylinePoints[i][0], y = polylinePoints[i][1];

			if (isInExtent && extent && (extent.xmax < x || extent.xmin > x || extent.ymax < y || extent.ymin > y))
			{
				continue;
			}
			var startPoint = polylinePoints[i];
			var endPoint = polylinePoints[i + 1];
			var len = calculateDistance(startPoint, endPoint);
			length += len;
			if (length > splitBuffer)
			{
				sPoint = startPoint;
				ePoint = endPoint;
				calLength = splitBuffer - (length - len);
				var point = MyStreetsHelper.calculatePointByBuffer(calLength, length, sPoint, ePoint, map);
				var calP = [ePoint[0] - sPoint[0], ePoint[1] - sPoint[1]];
				var angle = Math.atan(calP[1] / calP[0]);
				if (calP[0] < 0)
				{
					angle += Math.PI;
				}
				var ep = [-sPoint[1] + point.y + point.x, sPoint[0] - point.x + point.y];
				var buffer = distanceBuffer;
				if (MyStreetsHelper.isSamePoint([point.x, point.y], ep))
				{
					point = new tf.map.ArcGIS.Point({
						x: endPoint[0],
						y: endPoint[1],
						spatialReference: map.mapView.spatialReference
					});
				}
				var p = MyStreetsHelper.calculatePointByBuffer(buffer, null, [point.x, point.y], ep, map);
				splitPoints.push({
					point: point,
					angle: angle,
					pointBuffer: p
				});
				polylinePoints.splice(i + 1, 0, [point.x, point.y]);
				length = 0;
			}
		}

		return splitPoints;
	}

	MyStreetsHelper.getScaleRate = function(map)
	{
		var mapScale = map.mapView.scale;
		var mapScaleRate = mapScale / scaleBase;
		return mapScaleRate;
	};

	MyStreetsHelper.calculatePointByBuffer = function(buffer, length, sp, ep, map)
	{
		length = !length ? calculateDistance(sp, ep) : length;
		var ratio = buffer / length;
		var point = new tf.map.ArcGIS.Point({
			x: (1 - ratio) * sp[0] + ratio * ep[0],
			y: (1 - ratio) * sp[1] + ratio * ep[1],
			spatialReference: map.mapView.spatialReference
		});
		return point;
	};

	MyStreetsHelper.calculateMiddlePos = function(polylinePoints, map)
	{
		var totalLength = calcTotalLength(polylinePoints);
		var halfLen = totalLength / 2, length = 0, sPoint, ePoint, calLength;

		for (var i = 0; i < polylinePoints.length - 1; i++)
		{
			var startPoint = polylinePoints[i];
			var endPoint = polylinePoints[i + 1];
			var len = calculateDistance(startPoint, endPoint);
			length += len;
			if (length > halfLen)
			{
				sPoint = startPoint;
				ePoint = endPoint;
				calLength = halfLen - (length - len);
				length = len;
				break;
			}
		}
		var point = MyStreetsHelper.calculatePointByBuffer(calLength, length, sPoint, ePoint, map);
		var calP = [ePoint[0] - sPoint[0], ePoint[1] - sPoint[1]];
		var angle = Math.atan(calP[1] / calP[0]);
		if (calP[0] < 0) angle += Math.PI;
		return { startPoint: sPoint, endPoint: ePoint, middlePos: point, angle: angle, length: totalLength };
	};

	MyStreetsHelper.createCurbApproach = function(startPoint, endPoint, point, type, angle, color, map)
	{
		var endPointDiff = [endPoint[0] - point.x, endPoint[1] - point.y];
		var startPointDiff = [startPoint[0] - point.x, startPoint[1] - point.y];
		var ep = [];
		if (type == "left")
		{
			if (endPointDiff[0] == 0 && endPointDiff[1] == 0)
			{
				ep[0] = startPointDiff[1] + endPoint[0];
				ep[1] = -startPointDiff[0] + endPoint[1];
			} else
			{
				ep[0] = -endPointDiff[1] + point.x;
				ep[1] = endPointDiff[0] + point.y;
			}
		} else
		{
			if (startPointDiff[0] == 0 && startPointDiff[1] == 0)
			{
				ep[0] = endPointDiff[1] + startPoint[0];
				ep[1] = -endPointDiff[0] + startPoint[1];
			} else
			{
				ep[0] = -startPointDiff[1] + point.x;
				ep[1] = startPointDiff[0] + point.y;
			}
		}
		var buffer = 12 * MyStreetsHelper.getScaleRate(map);
		var p = MyStreetsHelper.calculatePointByBuffer(buffer, null, [point.x, point.y], ep, map);
		var g = MyStreetsHelper.createCurbApproachGraphic([p.x, p.y], (type == "left" ? Math.PI : 0) + angle, color, map);

		return { point: p, graphic: g };
	};

	MyStreetsHelper.createMiddleArrowGraphic = function(xy, angle, map)
	{
		var point = new tf.map.ArcGIS.Point({
			x: xy[0],
			y: xy[1],
			spatialReference: map.mapView.spatialReference
		});
		var symbol = {
			type: "simple-marker",
			size: 16,
			color: [0, 0, 255],
			outline: {
				color: [0, 0, 0],
				width: 1
			},
			angle: 360 - angle * 180 / Math.PI,
			path: "M0 0 L9 9 L0 18 Z"
		};
		return new tf.map.ArcGIS.Graphic({ geometry: point, symbol: symbol });
	};

	MyStreetsHelper.createCurbApproachGraphic = function(xy, angle, color, map)
	{
		var g = MyStreetsHelper.createArrowGraphic(xy, angle, color, map, 24);
		return g;
	};

	MyStreetsHelper.createArrowGraphic = function(xy, angle, color, map, size)
	{
		var point = new tf.map.ArcGIS.Point({
			x: xy[0],
			y: xy[1],
			spatialReference: map.mapView.spatialReference
		});
		var symbol = {
			type: "simple-marker",
			size: size || 32,
			color: color,
			outline: {
				color: [0, 0, 0],
				width: 1
			},
			angle: 360 - angle * 180 / Math.PI,
			path: "M16 2 L16 10 L2 10 L2 22 L16 22 L16 30 L30 16 Z"
		};
		return new tf.map.ArcGIS.Graphic({ geometry: point, symbol: symbol });
	};

	MyStreetsHelper.getCurbType = function(sideOfStreet)
	{
		for (var key in curbSideOfStreet)
		{
			if (curbSideOfStreet[key] == sideOfStreet)
			{
				return key;
			}
		}
	};

	MyStreetsHelper.getCurbColor = function(type)
	{
		for (var i = 0; i < curbApproachColors.length; i++)
		{
			if (curbApproachColors[i].type == type)
			{
				return curbApproachColors[i].color;
			}
		}
	};

	MyStreetsHelper.isSamePoint = function(p1, p2)
	{
		if (p1[0] == p2[0] && p1[1] == p2[1]) return true;
		return false;
	};

	MyStreetsHelper.isSamePointInBuffer = function(p1, p2)
	{
		if (Math.abs(p1[0] - p2[0]) < 0.001 && Math.abs(p1[1] - p2[1]) < 0.001) return true;
		return false;
	};

	MyStreetsHelper.getStartPoint = function(polyline)
	{
		return polyline.paths[0][0];
	};

	MyStreetsHelper.getEndPoint = function(polyline)
	{
		return polyline.paths[0][polyline.paths[0].length - 1];
	};

	MyStreetsHelper.addLayer = function(id, viewModel, map)
	{
		var layer = new tf.map.ArcGIS.GraphicsLayer({ "id": id });
		viewModel.layers.push(id);
		map.add(layer);
		return layer;
	};

	MyStreetsHelper.mapSourceToAll = function(source, all)
	{
		for (var i = 0; i < source.length; i++)
		{
			all[source[i].id] = source[i];
		}
	};

	MyStreetsHelper.setValue = function(source, key, toData)
	{
		if (ko.isObservable(source[key]))
		{
			toData[key] = source[key]();
		} else
		{
			toData[key] = source[key];
		}
	};

	MyStreetsHelper.getManeuverTouchPoint = function(maneuver, allStreet)
	{
		var street1 = allStreet[maneuver.Edge1FID];
		var street2 = allStreet[maneuver.Edge2FID];
		if (!street1 || !street2)
		{
			return false;
		}
		var points1 = [street1.geometry.paths[0][0], street1.geometry.paths[0][street1.geometry.paths[0].length - 1]];
		var points2 = [street2.geometry.paths[0][0], street2.geometry.paths[0][street2.geometry.paths[0].length - 1]];
		for (var i = 0; i < points1.length; i++)
		{
			for (var j = 0; j < points2.length; j++)
			{
				if (MyStreetsHelper.isSamePoint(points1[i], points2[j]))
				{
					return points1[i];
				}
			}
		}
	};

	MyStreetsHelper.getCurbToStreet = function(street, allCurbs)
	{
		var curbInfo = [];
		for (var t = 0; t < allCurbs.length; t++)
		{
			var curb = allCurbs[t];
			if (curb.StreetSegmentID == street.id || curb.StreetSegmentID == street.OBJECTID)
			{
				curbInfo.push($.extend({}, curb));
			}
		}
		return curbInfo;
	};

	MyStreetsHelper.getOffsetStreetCurbPoint = function(curbPoint, isRightSide, street)
	{
		const geometryEngine = tf.map.ArcGIS.geometryEngine, streetPaths = street.geometry.paths[0],
			vertexIndex = streetPaths.findIndex(p => this.isSamePointInBuffer(p, curbPoint));
		let cutStreetGeometry = street.geometry.clone(), newVertexIndex = -1;
		if (vertexIndex == 0) // if vertex very close in a line, geometryEngine.offset will return null
		{
			newVertexIndex = 0;
			cutStreetGeometry.paths[0].splice(1, streetPaths.length - 2);
		}
		else if (vertexIndex == streetPaths.length - 1)
		{
			newVertexIndex = 1;
			cutStreetGeometry.paths[0].splice(1, streetPaths.length - 2);
		}
		else if (vertexIndex > 0 && vertexIndex < streetPaths.length - 1)
		{
			cutStreetGeometry.paths[0].splice(1, vertexIndex - 1);
			cutStreetGeometry.paths[0].splice(2, cutStreetGeometry.paths[0].length - 3);
			const firstPoint = new tf.map.ArcGIS.Point({ x: cutStreetGeometry.paths[0][0][0], y: cutStreetGeometry.paths[0][0][1], spatialReference: cutStreetGeometry.spatialReference });
			const vertexPoint = new tf.map.ArcGIS.Point({ x: cutStreetGeometry.paths[0][1][0], y: cutStreetGeometry.paths[0][1][1], spatialReference: cutStreetGeometry.spatialReference });
			const lastPoint = new tf.map.ArcGIS.Point({ x: cutStreetGeometry.paths[0][2][0], y: cutStreetGeometry.paths[0][2][1], spatialReference: cutStreetGeometry.spatialReference });
			if (geometryEngine.distance(firstPoint, vertexPoint, "meters") >= geometryEngine.distance(lastPoint, vertexPoint, "meters"))
			{
				cutStreetGeometry.paths[0].splice(2, 1);
				newVertexIndex = 1;
			}
			else
			{
				cutStreetGeometry.paths[0].splice(0, 1);
				newVertexIndex = 0;
			}
		}
		if (newVertexIndex > -1)
		{
			const offsetRoute = geometryEngine.offset(cutStreetGeometry, isRightSide ? 0.5 : -0.5, "meters", "round");
			return offsetRoute.paths[0][newVertexIndex];
		}
		return null;
	}

	MyStreetsHelper.getTurnToStreet = function(street, allTurns)
	{
		var maneuvers = [];
		for (var i = 0; i < allTurns.length; i++)
		{
			if (allTurns[i].Edge1FID == (street.OBJECTID || street.id))
			{
				maneuvers.push($.extend({}, allTurns[i]));
			}
		}
		return maneuvers;
	};

	MyStreetsHelper.bindCurbToStreet = function(street, allCurbs)
	{
		if (!street.maneuverInfo)
		{
			street.maneuverInfo = {};
		}
		street.maneuverInfo.curbInfo = MyStreetsHelper.getCurbToStreet(street, allCurbs);
	};

	MyStreetsHelper.bindTurnToStreet = function(street, allTurns)
	{
		if (!street.maneuverInfo)
		{
			street.maneuverInfo = {};
		}
		street.maneuverInfo.maneuvers = MyStreetsHelper.getTurnToStreet(street, allTurns);
	};

	MyStreetsHelper.copyManeuverInfo = function(maneuverInfo, street)
	{
		var newManeuverInfo = {};
		newManeuverInfo.curbInfo = maneuverInfo.curbInfo.map(function(c)
		{
			var result = $.extend({}, c);
			result.OBJECTID = 0;
			result.id = TF.createId();
			result.StreetSegmentID = street.OBJECTID || street.id;
			return result;
		});
		newManeuverInfo.maneuvers = maneuverInfo.maneuvers.map(function(c)
		{
			var result = $.extend({}, c);
			result.OBJECTID = 0;
			result.id = TF.createId();
			result.Edge1FID = street.OBJECTID || street.id;
			return result;
		});
		return newManeuverInfo;
	};

	/**
	* create arrow on path
	* @param {object} map the map object
	* @param {object} geometry street path geometry
	* @param {boolean} isIgnoreBuffer this param is used to avoid arrow and path touch together on corner
	* @param {object} rgbcolor arrow color
	* @param {boolean} isOnLine this arrow is on the path or right side of street
	* @param {boolean} isInExtent only get arrow in map display extent or all these arrows on whole path
	* @returns {Array} all the arrow graphics 
	*/
	MyStreetsHelper.createArrows = function(map, geometry, isIgnoreBuffer, rgbcolor, isOnLine, isInExtent, scaleRate)
	{
		if (!geometry || !geometry.paths)
		{
			return;
		}
		var directionGeometry = geometry;
		var mapScaleRate = scaleRate || MyStreetsHelper.getScaleRate(map);
		var rotation = map.mapView.rotation;
		var splitBuffer = 60 * mapScaleRate;// the distance between arrow
		var distanceBuffer = 10 * mapScaleRate;// the distance aside street
		var touchDistance = 6 * mapScaleRate;
		var points = splitPolyline(directionGeometry.paths[0], splitBuffer, distanceBuffer, map, isInExtent);
		var circleGraphics = [];
		var geometryEngine = tf.map.ArcGIS.geometryEngine;
		var directionGeometryBuffer = null;// buffer to check touch street graphic
		var arrowGraphics = [];
		var symbol, graphic;
		if (!isIgnoreBuffer)
		{
			directionGeometryBuffer = geometryEngine.buffer(directionGeometry, 3 * mapScaleRate, "meters");
		} else
		{
			directionGeometryBuffer = directionGeometry;
		}
		points.forEach(function(point)
		{
			var angle = 360 - point.angle * 180 / Math.PI;
			if (isOnLine)
			{
				symbol = {
					type: "simple-marker",
					size: 17,
					path: "M0 0 L14 12 L0 24 L0 22 L 12 12 L 0 2 Z",
					angle: angle + rotation,
					color: rgbcolor,
					outline: {
						width: 1,
						color: rgbcolor
					}
				};
				graphic = new tf.map.ArcGIS.Graphic(point.point, symbol, { angle: angle });
				arrowGraphics.push(graphic);
			} else
			{
				if (isNaN(point.pointBuffer.x) || isNaN(point.pointBuffer.y))
				{
					return;
				}

				symbol = {
					type: "simple-marker",
					size: 20,
					path: "M45 2 L45 13 L2 13 L2 19 L45 19 L45 30 L75 16 Z",
					color: rgbcolor,
					angle: angle + rotation,
					outline: null
				};
				graphic = new tf.map.ArcGIS.Graphic(point.pointBuffer, symbol, { angle: angle });
				// touch verify, this avoid arrow touch together and make arrow looks not good
				var circle = geometryEngine.buffer(point.pointBuffer, touchDistance, "meters");
				if (directionGeometryBuffer && (geometryEngine.intersects(circle, directionGeometryBuffer) ||
					Enumerable.From(circleGraphics).Any(function(c) { return geometryEngine.intersects(circle, c); })))
				{
					return;
				}
				arrowGraphics.push(graphic);
				circleGraphics.push(circle);
			}
		});
		return arrowGraphics;
	};

	MyStreetsHelper.multiPathsToSinglePath = function(map, paths)
	{
		var results = [];
		paths = paths.filter(x => { return x; });
		for (var i = 0; i < paths.length; i++)
		{
			if (paths[i])
			{
				paths[i].added = false;
			} else
			{
				return [];
			}
		}

		function equal(a, b)
		{
			return Math.abs(a - b) < 1;
		}

		function addToResults(paths)
		{
			var allPath = [];
			var start = [], end = [], i;
			var path;

			for (i = 0; i < paths.length; i++)
			{
				if (paths[i] && paths[i].length > 0)
				{
					path = paths[i];
					start = path[0];
					end = path[path.length - 1];
					allPath = allPath.concat(path);
					path.added = true;
					break;
				}
			}
			var find = true;
			while (find)
			{
				find = false;
				for (i = 0; i < paths.length; i++)
				{
					path = paths[i];
					if (path && path.length > 0 && !path.added)
					{
						var startPoint = path[0], endPoint = path[paths[i].length - 1];
						if (end.length > 0 && equal(startPoint[0], end[0]) && equal(startPoint[1], end[1]))
						{
							end = endPoint;
							find = true;
							allPath = allPath.concat(path);
							path.added = true;
							break;
						}
						else if (start.length > 0 && equal(endPoint[0], start[0]) && equal(endPoint[1], start[1]))
						{
							start = startPoint;
							find = true;
							allPath = path.concat(allPath);
							path.added = true;
							break;
						}
					}
				}
			}

			var unionPath = new tf.map.ArcGIS.Polyline(map.mapView.spatialReference);
			unionPath.addPath(allPath);
			results.push(unionPath);
			var notAddedPaths = paths.filter(function(c) { return c && !c.added && c.length > 0; });
			if (notAddedPaths.length > 0)
			{
				addToResults(notAddedPaths);
			}
		}
		addToResults(paths);
		return results;
	};

	MyStreetsHelper.crossRailwayWarning = function(routerResult)
	{
		var directions = routerResult.routeResults[0].directions;
		var fullLinePercent = 0.99;
		return TF.StreetHelper.getRailroadCrossPoint(directions.mergedGeometry.extent.expand(1.01)).then(function(railroadPoints)
		{
			for (var i = 0; i < railroadPoints.length; i++)
			{
				for (var featureIndex = 0; featureIndex < directions.features.length; featureIndex++)
				{
					var feature = directions.features[featureIndex];
					var pointExtent = getPointExtent(railroadPoints[i].points[0][0], railroadPoints[i].points[0][1]);
					var intersects = tf.map.ArcGIS.geometryEngine.intersects(feature.geometry, pointExtent);
					if (intersects)
					{
						if (tf.map.ArcGIS.geometryEngine.intersects(getPointExtent(feature.geometry.paths[0][0][0], feature.geometry.paths[0][0][1]), pointExtent))
						{
							continue;
						}
						var cutLine = new tf.map.ArcGIS.Polyline({
							paths: [[[pointExtent.xmin, pointExtent.ymin], [pointExtent.xmax, pointExtent.ymax]]],
							spatialReference: railroadPoints[i].spatialReference
						});
						var cuts = tf.map.ArcGIS.geometryEngine.cut(feature.geometry, cutLine);
						var firstIndex = 0,
							secondIndex = 1,
							touchPoint;

						if (cuts.length <= 1)
						{
							continue;
						}

						touchPoint = getTouchPoint(cuts[0], cuts[1]);
						if (cuts[1].paths[0][0][0] != touchPoint[0] && cuts[1].paths[0][0][1] != touchPoint[1])
						{
							firstIndex = 1;
							secondIndex = 0;
						}

						var totalLength = tf.map.ArcGIS.geometryEngine.geodesicLength(feature.geometry, "meters");
						var firstLength = tf.map.ArcGIS.geometryEngine.geodesicLength(cuts[firstIndex], "meters");
						var percent = firstLength / totalLength;

						var railroadPoint = new tf.map.ArcGIS.Graphic({
							geometry: new tf.map.ArcGIS.Polyline({
								paths: [
									[touchPoint, touchPoint]
								],
								spatialReference: { wkid: 102100 }
							}),
							symbol: null,
							attributes: $.extend({}, feature.attributes, {
								maneuverType: "railroadStop",
								length: 0,
								time: 0
							})
						});

						directions.features.splice(featureIndex + 1, 0, railroadPoint);

						var attributes = feature.attributes,
							originLength = attributes.length,
							originTime = attributes.time;

						// split feature
						if (percent < fullLinePercent)
						{
							feature.geometry = cuts[firstIndex];
							attributes.length = originLength * percent;
							attributes.time = originTime * percent;
						}

						featureIndex += 1;

						if (percent < fullLinePercent)
						{
							var splitFeature = feature.clone();
							splitFeature.geometry.paths = cuts[secondIndex].paths;
							splitFeature.attributes.length = originLength * (1 - percent);
							splitFeature.attributes.time = originTime * (1 - percent);
							splitFeature.attributes.text = splitFeature.attributes.text.replace(/[\D\d]*(?=\son\s)/, "Continue");
							directions.features.splice(featureIndex + 1, 0, splitFeature);
							featureIndex += 1;
						}
					}
				}
			}
			return routerResult;
		});

		function getPointExtent(x, y)
		{
			return new tf.map.ArcGIS.Extent({
				xmin: x - 0.1,
				ymin: y - 0.1,
				xmax: x + 0.1,
				ymax: y + 0.1,
				spatialReference: { wkid: 102100 }
			});
		}

		function getTouchPoint(geometry1, geometry2)
		{
			let points2 = [geometry2.paths[0][0], geometry2.paths[0][geometry2.paths[0].length - 1]];
			for (let pathIndex = 0; pathIndex < geometry1.paths.length; pathIndex++)
			{
				let points1 = [geometry1.paths[pathIndex][0], geometry1.paths[pathIndex][geometry1.paths[pathIndex].length - 1]];
				for (let pointsIndex1 = 0; pointsIndex1 < points1.length; pointsIndex1++)
				{
					for (let pointIndex2 = 0; pointIndex2 < points2.length; pointIndex2++)
					{
						if (points1[pointsIndex1][0] == points2[pointIndex2][0] && points1[pointsIndex1][1] == points2[pointIndex2][1])
						{
							return points1[pointsIndex1];
						}
					}
				}
			}
			return null;
		}

	};

})();

