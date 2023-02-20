(function()
{
	Tool = TF.RoutingMap.Directions.Tool;

	Tool.prototype._initRouting = function()
	{
		var self = this;
		self._localRouteFileUrl = arcgisUrls.LocalRouteFile;
		self._routeParameters = new self._arcgis.RouteParameters();

		self._routeParameters.outSpatialReference = self._webMercator;
		self._routeParameters.outputLines = "true-shape"; // the start point of route geometry is difference in round trip mode, use TRUE_SHAPE instead.
		self._routeParameters.restrictUTurns = self.uTurnPolicy;
		self._routeParameters.returnRoutes = false;
		self._routeParameters.returnStops = true;
		self._routeParameters.returnDirections = true;
		self._routeParameters.returnPolygonBarriers = false;
		self._routeParameters.impedanceAttribute = tf.storageManager.get("impedanceAttrRouting") || 'Time';
		self._routeParameters.restrictionAttributes = ["Oneway", "vehicletraverse"];
		self._routeParameters.directionsLengthUnits = "kilometers";

		self._prevRouteResult = null;
		self._noReachedRoute = false;
		self._routeGeometry = null;
		self._routeBuffer = null;
		self._routeBufferDistance = 35;
		self._routeDirections = null;

		self.isRoundTrip = self.isRoundTrip || false;
		self.isDirectionDetailsRequired = self.isDirectionDetailsRequired || true;
		self.isChangeRouteChecked = self.isChangeRouteChecked || true;
		self.isMapDetailsChecked = self.isMapDetailsChecked || true;
		self.isShowArrowsChecked = self.isShowArrowsChecked || true;

		self.SourceID = tf.streetSourceOid;
	};

	Tool.prototype._disposeRouting = function()
	{
		var self = this;
		self._routeParameters = null;
		self._prevRouteResult = null;
		self._noReachedRoute = null;
		self._routeGeometry = null;
		self._routeBuffer = null;
		self._routeBufferDistance = null;
		self._routeDirections = null;

		self.isRoundTrip = null;
		self.isDirectionDetailsRequired = null;
	};

	/**
	 * Calculate route analysis result.
	 * @param  {boolean} showLoadingIndicator (Optional) Default is true.
	 */
	Tool.prototype._calculateTrip = function()
	{
		let self = this,
			features = self.getStopsClone(),
			stops = new self._arcgis.FeatureSet();

		if(self._viewModel.directionPaletteViewModel.obMapServiceType() == 1)
		{
			return self._calculateTripByOSM();
		}

		if (features.length == 0)
		{
			return Promise.resolve();
		}

		let barriersPromise = self._getSelectedBarriers();
		stops.features = self._featuresToNAStops(features);
		return Promise.all([barriersPromise]).then(function(res)
		{
			return self._solve(stops, null, null, res[0]).then(function(results)
			{
				if (results.routeResults && results.routeResults.length == 1)
				{
					var result = results.routeResults[0],
						routeGeometry = result.directions.mergedGeometry;

					if (self._noReachedRoute)
					{
						self._noReachedRoute = false;
					}
					self._refreshStopSymbol();
					self._refreshStopSequenceSymbol();

					return self.crossRailwayWarning(results).then(function()
					{
						if (self._stops.length == 0)
						{
							return;
						}
						self.addArrow(result.directions?.mergedGeometry);
						self.racalculateDirectionTimeWithBarriers(results, res[0]);
						self._routeDirections = result.directions;
						self._prevRouteResult = results;

						self._tripLayer.removeAll();

						if (routeGeometry && routeGeometry.paths.length > 0)
						{
							self._routeGeometry = routeGeometry;
							// The snap buffer generation is slow, cancel it.
							// self._updateRouteSnapBuffer(routeGeometry);
							self._refreshRoutingResult(self._routeDirections, routeGeometry);
						}
						else
						{
							self._routeGeometry = null;
							self._routeDirections = null;
							self._tripVertices.length = 0;
							self._tripVertexLayer.removeAll();
						}

						self.notifyDirectionChanged(result);
						return result;
					});
				}
				return Promise.resolve(result);
			}, function(error)
			{
				self._routeGeometry = null;
				self._routeDirections = null;
				self._noReachedRoute = true;
				self._draggingRouteGeometry = null;
				self._setStopsNotReached();
				self._setStopSequenceNotReached();
				self._tripLayer.removeAll();
				self._arrowLayer.removeAll();
				self._tripVertexLayer.removeAll();
				self._clearWayPoints();
				self.notifyDirectionChanged();
				console.error(error)
				return Promise.reject(error);
			})
		})
	};
	
	const baseSpeed = 0.1,
		baseTime = 1 / baseSpeed;

	Tool.prototype._calculateTripByOSM = function()
	{
		let self = this,
			features = self.getStopsClone();
		let points = (features || []).map(({geometry})=>{
			if (geometry && geometry.spatialReference && !geometry.spatialReference.isWGS84)
			{
				return self._arcgis.webMercatorUtils.webMercatorToGeographic(geometry);
			}
			return geometry;
		}).map(({x,y})=>[x,y]);

		if (self.isRoundTrip)
		{
			points.push(points[0]);
		}

		console.log(points);
		if(points.length<2) {
			return Promise.resolve();
		}

		return self.buildOSMTravelRegionParamters().then(function(customInfo){
			const parameters = {
				points,
				elevation:true,
				locale: "en_US",
				profile: "car",
				snap_preventions: ["ferry"],
				details:  ["road_class", "road_environment", "surface", "max_speed", "average_speed", "toll", "track_type", "country"],
				instructions: true,
				points_encoded: false,
				optimize: "false",
			};

			const conversionRequired = !!customInfo;

			if(conversionRequired)
			{
				parameters["ch.disable"] = true;
				parameters.custom_model = customInfo;
			}
	
			return fetch("https://graphhopper.com/api/1/route?key=aaa190b8-70ca-468b-8aa6-0fa2897e1651",{
				method:"post",
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json"
				},
				body:JSON.stringify(parameters), 
				mode:"cors"}).then(function(res){
					return res.json();
				}).then(function(res){
					res = decodeResult(res, parameters.elevation);
					console.log(res);
					const routeGeometry = new tf.map.ArcGIS.Polyline({ spatialReference: new tf.map.ArcGIS.SpatialReference({ wkid: 4326 }), paths: [res[0].points.coordinates] });

					self._tripLayer.removeAll();
					self._arrowLayer.removeAll();
					self._tripVertexLayer.removeAll();

					self._viewModel.directionPaletteViewModel.obTotalTime(Math.round(res[0].time/(conversionRequired ? baseTime : 1)/60/1000));
					self._viewModel.directionPaletteViewModel.obTotalDistance(Math.round(res[0].distance/1000));

					const directionFeatures = [];
					const directionDetails = [];

					const instructions = res[0].instructions;
					const startPoint = instructions[0].points[0];
					const startAddress = features[0].attributes["Address"] || "N/A";
					const startText = `Start at ${startAddress}`;
					const startInstruction = {
						text: startText,
						distance: 0,
						time: 0,
						points: [startPoint, startPoint]
					};
					instructions.unshift(startInstruction);

					res[0].instructions.forEach((i, index, array) => {
						let type = "";
						if(index === 0)
						{
							type = "esriDMTDepart";
						}

						if(index === array.length -1)
						{
							type = "esriDMTStop";
						}

						const text = i.text;
						const distance = self._viewModel.directionPaletteViewModel.formatDistanceString(Math.floor( i.distance/1000));
						const time = self._viewModel.directionPaletteViewModel.formatTimeString(Math.floor(i.time/(conversionRequired ? baseTime : 1)/60/1000));
						let geometry = new tf.map.ArcGIS.Polyline({ spatialReference: new tf.map.ArcGIS.SpatialReference({ wkid: 4326 }), paths: i.points });
						geometry = self._geographicToWebMercator(geometry);

						const detail = new TF.DataModel.DirectionDetailDataModel({
							Instruction: text,
							Text: text,
							Sequence: index + 1,
							Type: type,
							Distance: distance,
							Time: time,
							Geometry: geometry,
							Index: index
						});
						directionDetails.push(detail);

						const feature = {
							geometry: geometry,
							attributes: {
								length: distance,
								text: text,
								maneuverType: type,
								time: time
							}
						};
						directionFeatures.push(feature);
					});

					const directions = {
						features: directionFeatures,
						geometryType: "esriGeometryPolyline"
					};

					self._routeDirections = directions;

					if (routeGeometry && routeGeometry.paths.length > 0)
					{
						self._routeGeometry = routeGeometry;
						self._refreshRoutingResult(self._routeDirections, routeGeometry);
						self.addArrow(self._geographicToWebMercator(routeGeometry));
					}
					else
					{
						self._routeGeometry = null;
						self._routeDirections = null;
						self._tripVertices.length = 0;
						self._tripVertexLayer.removeAll();
					}

					self._viewModel.directionPaletteViewModel.obDirectionDetails(directionDetails);
				});
		});

		function decodeResult(e, t){
			return e.paths.map((e=>({
				...e,
				points: decodePoints(e, t),
				snapped_waypoints: decodeWaypoints(e, t)
			}))).map((e=>({
				...e,
				instructions: setPointsOnInstructions(e)
			})));
		}

		function decodePoints(e, t) {
			return e.points_encoded ? {
				type: "LineString",
				coordinates: decodePath(e.points, t)
			} : e.points
		}

		function decodeWaypoints(e, t) {
			return e.points_encoded ? {
				type: "LineString",
				coordinates: decodePath(e.snapped_waypoints, t)
			} : e.snapped_waypoints
		}

		function setPointsOnInstructions(e) {
			return e.instructions ? e.instructions.map((t=>({
				...t,
				points: e.points.coordinates.slice(t.interval[0], t.interval[1] + 1)
			}))) : e.instructions
		}

		function decodePath(e, t) {
			const n = e.length;
			let r = 0;
			const i = [];
			let o = 0
				, s = 0
				, a = 0;
			for (; r < n; ) {
				let n, l = 0, u = 0;
				do {
					n = e.charCodeAt(r++) - 63,
					u |= (31 & n) << l,
					l += 5
				} while (n >= 32);
				o += 1 & u ? ~(u >> 1) : u >> 1,
				l = 0,
				u = 0;
				do {
					n = e.charCodeAt(r++) - 63,
					u |= (31 & n) << l,
					l += 5
				} while (n >= 32);
				if (s += 1 & u ? ~(u >> 1) : u >> 1,
				t) {
					l = 0,
					u = 0;
					do {
						n = e.charCodeAt(r++) - 63,
						u |= (31 & n) << l,
						l += 5
					} while (n >= 32);
					a += 1 & u ? ~(u >> 1) : u >> 1,
					i.push([1e-5 * s, 1e-5 * o, a / 100])
				} else
					i.push([1e-5 * s, 1e-5 * o])
			}
			return i
		}
	}

	Tool.prototype.buildOSMTravelRegionParamters = function()
	{
		const self = this,
			travelscenario = self._viewModel.directionPaletteViewModel.travelScenario,
			travelScenarioId = self.travelScenarioId || travelscenario.Id;
		
		return tf.startup.loadArcgisUrls().then(function()
		{
			return TF.queryTravelSCenarios(travelScenarioId);
		}).then(function([, travelRegions])
		{
			if(travelRegions.length === 0)
			{
				return null;
			}

			const p = travelRegions.reduce(function(acc, region)
			{
				const areaName = (region.attributes.Name || "").replace(/\W/gi,"")+ Date.now();
	
				let g = region.geometry;
				
				if (g && g.spatialReference && !g.spatialReference.isWGS84)
				{
					g = self._arcgis.webMercatorUtils.webMercatorToGeographic(g);
				}
	
				acc.areas = Object.assign(acc.areas, {
					[areaName]:{
						type: "Feature",
						id: areaName,
						properties: {},
						geometry:{
							type: "Polygon",
							coordinates: g.toJSON().rings
						}
					}
				});
	
				let weight = region.attributes.Weight || 1;
				switch(region.attributes.Type)
				{
					case 0:// preferred
					case 1:// restricted
					acc.speed.push({
							if: `in_${areaName}`,
							multiply_by: Math.min(1, baseSpeed*(1/weight))
						});
					break;
					case 2://prohibited
						acc.speed.push({
							if: `in_${areaName}`,
							multiply_by: 0
						});
					break;
				}
	
				return acc;
			}, {
				speed: [],
				areas: {}
			});

			p.speed.push({
				"else": "",
				"multiply_by": baseSpeed
			});

			return p;
		});
	}

	/**
	 * recalculate the actual routing result time without barriers affected.
	 * @param  {object} results (Optional) extra route parameters.
	 * @returns {void}
	 */
	Tool.prototype.racalculateDirectionTimeWithBarriers = function(results, barriers)
	{
		var self = this;
		var direction = results.routeResults[0].directions;
		var totalAddedTime = 0;
		direction.features.forEach(function(feature)
		{
			if (feature.attributes && feature.attributes.length != 0)
			{
				var geometry = feature.geometry;
				var addedtime = 0;
				barriers[2].features.forEach(function(tr)
				{
					if (tr.attributes.BarrierType == 1 && !tr.attributes.isChangeTime)
					{
						var travelRegionGeom = tr.geometry;
						if (tr.geometry.spatialReference.wkid != 102100)
						{
							travelRegionGeom = self._arcgis.webMercatorUtils.geographicToWebMercator(travelRegionGeom);
						}
						var affectedroute = self._arcgis.geometryEngine.intersect(travelRegionGeom, geometry);
						if (affectedroute)
						{
							var attrTimeKey = "Attr_Time";
							var affectedFactor = tr.attributes[attrTimeKey];
							var affectedSegLength = self._arcgis.geometryEngine.geodesicLength(affectedroute, "miles");
							var normalSegLength = feature.attributes.length - affectedSegLength;
							var actualspped = (normalSegLength + affectedSegLength * affectedFactor) / feature.attributes.time;
							var actualtime = (affectedSegLength / actualspped);
							addedtime = addedtime + actualtime * (1 - tr.attributes[attrTimeKey]);
						}
					}
				})
				feature.attributes.time = feature.attributes.time + addedtime;
				totalAddedTime = totalAddedTime + addedtime;
			}
		})
		if (direction.summary)
		{
			direction.summary.totalTime = direction.summary.totalTime + totalAddedTime;
		}
		direction.totalTime = direction.totalTime + totalAddedTime;
	}

	Tool.prototype.addArrow = function(routeGeometry)
	{
		var self = this,
			arrowLayer = self._arrowLayer;

		if (arrowLayer)
		{
			arrowLayer.removeAll();
		}

		if (!self.isShowArrowsChecked)
		{
			return;
		}

		if (routeGeometry)
		{
			var helper = TF.RoutingMap.MapEditingPalette.MyStreetsHelper;
			var arrowGraphics = helper.createArrows(self._map, routeGeometry, true, [83, 126, 147], false, true);
			arrowGraphics.forEach(function(arrowGraphic)
			{
				arrowLayer.add(arrowGraphic);
			});
		}
	};

	Tool.prototype.crossRailwayWarning = function(result)
	{
		return TF.RoutingMap.MapEditingPalette.MyStreetsHelper.crossRailwayWarning(result);
	};

	Tool.prototype._featuresToNAStops = function(features)
	{
		let travelscenario = this._viewModel.directionPaletteViewModel.travelScenario;
		let isWalker = travelscenario && travelscenario.ProhibitedId == 1 && travelscenario.RestrictedId == 13;

		var self = this, stopCount = features.length,
			stops = features.map(function(feature)
			{
				var geometry = feature.geometry,
					attributes = feature.attributes || {};
				geometry = self._arcgis.webMercatorUtils.webMercatorToGeographic(geometry);
				// curbApproach policy:
				// 1) destinations / through points - default setting: 1 (default is vehicle mode)
				// 2) vertex stop - 4
				// 3) last vertex stop - 0
				attributes.CurbApproach = isWalker ? self.CurbApproachEnum.EITHER_SIDE : (attributes.CurbApproach === undefined) ? self.CurbApproachEnum.RIGHT_SIDE :
					(attributes.CurbApproach === 4 &&
						(attributes.Sequence === stopCount && !self.isRoundTrip) ? self.CurbApproachEnum.EITHER_SIDE : attributes.CurbApproach);
				if (attributes.Address !== undefined)
				{
					delete attributes.Address;
				}
				if (attributes.beforeNodeIndex !== undefined)
				{
					delete attributes.beforeNodeIndex;
				}
				if (attributes.distance !== undefined)
				{
					delete attributes.distance;
				}
				if (attributes.StopType !== undefined)
				{
					delete attributes.StopType;
				}
				return new self._arcgis.Graphic(geometry, null, attributes);
			});
		if (self.isRoundTrip)
		{
			var firstStop = features[0],
				attributes = null,
				geometry = null,
				lastStop = null;

			geometry = new self._arcgis.Point({
				x: firstStop.geometry.x,
				y: firstStop.geometry.y,
				spatialReference: self._webMercator
			});
			geometry = self._arcgis.webMercatorUtils.webMercatorToGeographic(geometry);
			attributes = {
				'Sequence': features.length + 1,
				'Name': firstStop.attributes.Name,
				'CurbApproach': firstStop.attributes.CurbApproach
			};
			lastStop = new self._arcgis.Graphic({
				geometry: geometry,
				attributes: attributes
			});
			stops.push(lastStop);
		}
		return stops;
	};

	Tool.prototype._getSelectedBarriers = function()
	{
		var self = this;

		var pointbarriers = new self._arcgis.FeatureSet();
		var linebarriers = new self._arcgis.FeatureSet();
		var polygonbarriers = new self._arcgis.FeatureSet();

		var allBarriers = [pointbarriers, linebarriers, polygonbarriers];
		var travelscenario = self._viewModel.directionPaletteViewModel.travelScenario;
		var travelScenarioId = self.travelScenarioId || travelscenario.Id;
		var isFile = self.useFileService || travelscenario.isFile;
		var queryPromise = tf.startup.loadArcgisUrls().then(function()
		{
			return TF.queryTravelSCenarios(travelScenarioId, !!isFile);
		});
		return queryPromise.then(function(res)
		{
			var curbs = res[0];
			var travelRegions = res[1];

			curbs.forEach(function(curb)
			{
				var barrier = new self._arcgis.Graphic({ symbol: { type: "simple-marker" } });
				var fullEdge = curb.attributes.Type == 0 ? true : false;
				barrier.attributes = {
					"FullEdge": fullEdge,
					"BarrierType": curb.attributes.Type,
					"Attr_Time": 0.1,
					"SideOfEdge": curb.attributes.SideOfStreet,
					"SourceOID": curb.attributes.StreetSegmentID,
					"SourceID": self.SourceID,
					"PosAlong": 0.474451,
					"CurbApproach": 1
				};
				pointbarriers.features.push(barrier);
			}, this);

			travelRegions.forEach(function(graphic)
			{
				var barrier = new self._arcgis.Graphic();
				var geometry = graphic.geometry;
				if (geometry && geometry.spatialReference && geometry.spatialReference.wkid === 102100)
				{
					geometry = self._arcgis.webMercatorUtils.webMercatorToGeographic(geometry);
				}
				barrier.geometry = geometry;
				var type = graphic.attributes.Type == 2 ? 0 : 1;
				var weight = graphic.attributes.Weight;
				var attrTimeKey = "Attr_Time";
				barrier.attributes = {
					"BarrierType": type,
					"isChangeTime": graphic.attributes.IsChangeTime
				};
				barrier.attributes[attrTimeKey] = weight;
				polygonbarriers.features.push(barrier);
			}, this);
			return Promise.resolve(allBarriers);
		});
	};

	Tool.prototype.getRouteUrl = function()
	{
		var self = this;
		return tf.startup.loadArcgisUrls().then(function()
		{
			if (self._viewModel)
			{
				if (self._viewModel.directionPaletteViewModel.obMapServiceType() == 2) {
					return "http://devmulti18.transfinder.com/arcgis/rest/services/NorthAmerica/NAServer/Route";
				} else if (self._viewModel.directionPaletteViewModel.obMapServiceType() == 0) {
					self._arcgis.esriConfig.apiKey = "AAPK831e30fbca2e488eb45497c69f753bc6ufPNUlFdFwgUJODDnT0wC1wWks-xJN2dLidH1m9x3bB-Mov6i1RbGoVAVwLgjn8P";
					return "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World";
				}
			}

			return arcgisUrls.LocalRouteFile;
		})
	}

	/**
	 * Solve Route Analysis with ArcGIS Server NA Services.
	 * @param  {array} stops route stops.
	 * @param  {string} travelModeName (Optional) name of travel mode.
	 * @param  {object} parameters (Optional) extra route parameters.
	 * @param  {array} barriers (Optional) routing barriers.
	 * @param  {boolean} showLoadingIndicator (Optional) Default is true.
	 * @returns {void}
	 */
	Tool.prototype._solve = function(stops, travelModeName, parameters, barriers)
	{
		var self = this;

		travelModeName = travelModeName || 'Converted from Pro';
		self._routeParameters.startTime = new Date();
		self._routeParameters.restrictUTurns = self.uTurnPolicy;
		self._routeParameters.directionsLengthUnits = "kilometers";
		self._routeParameters = $.extend(self._routeParameters, parameters);
		if (barriers === undefined)
		{
			barriers = null;
			self._routeParameters.returnPolygonBarriers = false
		}
		else
		{
			self._routeParameters.returnPolygonBarriers = true
		}
		self._routeParameters.pointBarriers = barriers === null ? [] : barriers[0];
		self._routeParameters.polylineBarriers = barriers === null ? [] : barriers[1];
		self._routeParameters.polygonBarriers = barriers === null ? [] : {
			features: barriers[2].features.map(function(f)
			{
				var b = new self._arcgis.Graphic();
				b.geometry = f.geometry;
				b.attributes = {
					"BarrierType": f.attributes.BarrierType,
					"Attr_Time": parseFloat(f.attributes.Attr_Time) + 0.000001,
				};
				return b
			})
		};

		self._routeParameters.stops = stops;
		var travelscenario = self._viewModel.directionPaletteViewModel.travelScenario;
		self._routeParameters.impedanceAttribute = tf.storageManager.get("impedanceAttrRouting") || "Time";
		self._routeParameters.directionsTimeAttribute = "Time";
		if (travelscenario)
		{
			self._routeParameters.restrictionAttributes = ["Oneway", "vehicletraverse", "redturn_" + travelscenario.ProhibitedId, "yellowturn_" + travelscenario.RestrictedId];
			if ((travelscenario.ProhibitedId == 1) && (travelscenario.RestrictedId == 13))
			{
				travelModeName = "Walker";
				self._routeParameters.impedanceAttribute = "Length"
				self._routeParameters.restrictionAttributes = ["walktraverse", "redturn_" + travelscenario.ProhibitedId, "yellowturn_" + travelscenario.RestrictedId];
				self._routeParameters.directionsTimeAttribute = "walktime";
			}
		}


		return self.getServicePrams().then(function(res)
		{
			var results = res[0];
			var url = res[1];
			var travelMode = results.supportedTravelModes.filter(function(item) { return item.name === travelModeName })[0];
			var isLocalDataset = travelMode !== undefined;
			if (isLocalDataset)
			{
				travelMode.uturnAtJunctions = TF.uturnDic[self.uTurnPolicy];
				self._routeParameters.travelMode = travelMode;
	
				self._routeParameters.travelMode.restrictionAttributeNames = self._routeParameters.restrictionAttributes;
				self._routeParameters.travelMode.impedanceAttributeName = travelModeName === "Walker" ? "Length" : tf.storageManager.get("impedanceAttrRouting") || "Time";
			}
			else
			{
				// TomTomNA server
				travelMode = results.supportedTravelModes[0];
				travelMode.uturnAtJunctions = TF.uturnDic[self.uTurnPolicy];
				self._routeParameters.travelMode = travelMode;

				self._routeParameters.impedanceAttribute = "TravelTime";
				self._routeParameters.directionsTimeAttribute = "TravelTime";
				self._routeParameters.travelMode.impedanceAttributeName = "TravelTime";
				self._routeParameters.pointBarriers = [];
				self._routeParameters.polylineBarriers = [];

				// self._routeParameters.polygonBarriers = [];
				var polygonFeatures = self._routeParameters.polygonBarriers.features;
				if (polygonFeatures)
				{
					polygonFeatures.forEach(feature =>
					{
						if (feature.attributes)
						{
							feature.attributes["Attr_TravelTime"] = feature.attributes["Attr_Time"];
						}
					})
				}
			}

			var task = new tf.map.ArcGIS.RouteTask(url);
			return task.solve(self._routeParameters).then((results) => 
			{
				// self._arcgis.esriConfig.apiKey = null;
				return self.crossRailwayWarning(results);
			}, function(err)
			{
				console.warn(err.details);
				return Promise.reject(err);
			});
		})
	}

	/*routeTask.getServiceDescription has been remove from ESRI API 4.14*/
	Tool.prototype.getServicePrams = function()
	{
		var self = this;
		var _url = "";
		return self.getRouteUrl().then(function(url)
		{
			_url = url;
			return Promise.resolve(url)
		}).then(function(url)
		{
			return tf.map.ArcGIS.esriRequest(url + "/retrieveTravelModes?f=pjson")
		}).then(function(response)
		{
			return Promise.resolve([response.data, _url]);
		})

	}

	Tool.prototype._addTrip = function(geometry)
	{
		var self = this,
			symbol = self._tripSymbol(),
			graphic = new self._arcgis.Graphic({
				geometry: geometry,
				symbol: symbol
			});

		self._tripLayer.add(graphic);
		self._routeGeometry = geometry;
	};

	Tool.prototype._addHighlightTrip = function(data)
	{
		if (this._onDragging === null)
		{
			return;
		}
		var self = this,
			geometry = data.geometry(),
			startPoint = geometry.paths[0][0],
			vertexGeometry = new self._arcgis.Point({
				x: startPoint[0],
				y: startPoint[1],
				spatialReference: self._webMercator
			}),
			vertexGraphic = self._getVertexGraphicByIndex(data.index());

		if (vertexGraphic)
		{
			self._showGhostGraphic(vertexGeometry);
			self._highlightSegmentIndex = vertexGraphic.attributes.featureIndex;
			self._highlightSegment(self._highlightSegmentIndex);
		}
	};

	Tool.prototype._removeHighlightTrip = function(geometry)
	{
		var self = this;
		if (self._draggingGhostGraphic)
		{
			self._draggingGhostLayer.remove(self._draggingGhostGraphic);
		}
		self._unhighlightSegment();
		self._highlightSegmentIndex = null;
	};

	Tool.prototype._addTripVertexGraphic = function(vertexGeometry, attributes)
	{
		var self = this,
			Graphic = self._arcgis.Graphic,
			graphic = new Graphic({
				geometry: vertexGeometry,
				symbol: self._vertexSymbol(),
				attributes: attributes
			});
		self._tripVertexLayer.add(graphic);
	};

	Tool.prototype._addTripFeatureVertex = function(directions)
	{
		if (!this.isDirectionDetailsRequired)
		{
			this._addTripFeatureVertexWithTripGeometry(this._routeGeometry);
			return;
		}

		if (directions == null)
		{
			return;
		}

		var self = this,
			sr = directions.features[0].geometry.spatialReference,
			point, vertex, attributes, graphic,
			featureIndex = 1,
			featureCount = directions.features.length,
			polyline = null;
		self._tripVertexLayer.removeAll();
		for (; featureIndex < featureCount; featureIndex++)
		{
			polyline = directions.features[featureIndex].geometry;
			point = polyline.paths[0][0];
			vertex = new self._arcgis.Point({
				x: point[0],
				y: point[1],
				spatialReference: sr
			});
			attributes = {
				'featureIndex': featureIndex,
				'beforeNodeIndex': featureIndex - 1,
				'distance': directions.features[featureIndex].attributes.length,
				'text': directions.features[featureIndex].attributes.text,
				'maneuverType': directions.features[featureIndex].attributes.maneuverType,
				'time': directions.features[featureIndex].attributes.time,
				'directionLine': polyline,
				'isEndPoint': true
			};
			self._addTripVertexGraphic(vertex, attributes);
		}
	};

	Tool.prototype._updateTripVertices = function(tripGeometry)
	{
		var self = this,
			sr = tripGeometry.spatialReference,
			point, vertex;
		self._tripVertices.length = 0;
		tripGeometry = self._geographicToWebMercator(tripGeometry);

		for (var pathIndex = 0, pathCount = tripGeometry.paths.length; pathIndex < pathCount; pathIndex++)
		{
			for (var vertexIndex = 0, vertexCount = tripGeometry.paths[pathIndex].length; vertexIndex < vertexCount; vertexIndex++)
			{
				point = tripGeometry.paths[pathIndex][vertexIndex];
				vertex = new self._arcgis.Point({
					x: point[0],
					y: point[1],
					spatialReference: sr
				});
				self._tripVertices.push(vertex);
			}
		}
	};

	Tool.prototype._addTripFeatureVertexWithTripGeometry = function(geometry)
	{
		var self = this,
			Point = self._arcgis.Point,
			sr = geometry.spatialReference,
			cosA = 0,
			point, vertex, attributes, graphic,
			p, p1, p2, pp1, pp2, s1, s2;
		self._tripVertexLayer.removeAll();

		for (var pathIndex = 0, pathCount = geometry.paths.length; pathIndex < pathCount; pathIndex++)
		{
			// start point
			point = geometry.paths[pathIndex][0];
			vertex = new Point({
				x: point[0],
				y: point[1],
				spatialReference: sr
			});
			attributes = {
				'pathIndex': pathIndex,
				'beforeNodeIndex': 0,
				'distance': 0,
				'isEndPoint': true
			};
			self._addTripVertexGraphic(vertex, attributes);

			for (var vertexIndex = 1, vertexCount = geometry.paths[pathIndex].length; vertexIndex < vertexCount - 1; vertexIndex++)
			{
				p = geometry.paths[pathIndex][vertexIndex];
				p1 = geometry.paths[pathIndex][vertexIndex - 1];
				p2 = geometry.paths[pathIndex][vertexIndex + 1];

				pp1 = [p1[0] - p[0], p1[1] - p[1]];
				pp2 = [p[0] - p2[0], p[1] - p2[1]];

				s1 = Math.sqrt(Math.pow(pp1[0], 2) + Math.pow(pp1[1], 2));
				s2 = Math.sqrt(Math.pow(pp2[0], 2) + Math.pow(pp2[1], 2));

				cosA = (pp1[0] * pp2[0] + pp1[1] * pp2[1]) / (s1 * s2);

				if (Math.abs(cosA) < Math.SQRT2 / 2)
				{
					// add feature point
					vertex = new Point({
						x: p[0],
						y: p[1],
						spatialReference: sr
					});
					attributes = {
						'pathIndex': pathIndex,
						'beforeNodeIndex': vertexIndex - 1,
						'distance': s1,
						'isEndPoint': false
					};
					self._addTripVertexGraphic(vertex, attributes);
				}
			}
			// end point
			point = geometry.paths[pathIndex][vertexCount - 1];
			vertex = new Point({
				x: point[0],
				y: point[1],
				spatialReference: sr
			});
			attributes = {
				'pathIndex': pathIndex,
				'beforeNodeIndex': vertexCount - 1,
				'distance': 0,
				'isEndPoint': true
			};
			self._addTripVertexGraphic(vertex, attributes);
		}
	};
})();