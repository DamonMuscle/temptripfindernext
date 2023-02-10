(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette").ManeuverPosCalculator = ManeuverPosCalculator;
	var helper = TF.RoutingMap.MapEditingPalette.MyStreetsHelper;

	var ControlTypes = {
		left: "left",
		right: "right",
		maneuverArrow: "maneuverArrow"
	};
	// rotate
	// x' = x*cosθ-y*sinθ+0 = x*cosθ-y*sinθ
	// y' = x*sinθ+y*cosθ+0 = x*sinθ+y*cosθ
	function ManeuverPosCalculator(arcgis, map, viewModel)
	{
		this.arcgis = arcgis;
		this.map = map;
		this.viewModel = viewModel;
		this.layerName = "tempStreetArrowLayer";
		this.layer = helper.addLayer(this.layerName, viewModel, map);
		this.addEvent();
		this.data = {};
		this.dataModel = this.viewModel.dataModel;
		this.refresh = this.refresh.bind(this);
		this.dataModel.curbTurnDataModel.onControlChangeEvent.subscribe(this.refresh);
		this.viewModel.editModal.onEditModalDataChangeEvent.subscribe((event, newStreetSegment) => { this.refresh(event, newStreetSegment, false); });
	}

	ManeuverPosCalculator.prototype.clear = function()
	{
		this.layer.removeAll();
		this.streetSegment = null;
	};

	ManeuverPosCalculator.prototype.refresh = function(event, newStreetSegment, rebind)
	{
		var self = this;
		if (this.viewModel.showMode().travelScenario)
		{
			if (newStreetSegment)
			{
				this.streetSegment = newStreetSegment;
			}
			clearTimeout(self.refreshTimeout);
			self.refreshTimeout = setTimeout(function()
			{
				self.calculate(self.streetSegment, rebind);
			}, 10);
		}
	};

	ManeuverPosCalculator.prototype.calculate = function(streetSegment, rebind = true)
	{
		let self = this;
		var travelScenario = self.getTravelScenario();
		if (streetSegment)
		{
			rebind = rebind || !streetSegment.maneuverInfo || streetSegment.maneuverInfo.travelScenarioId !== travelScenario.Id;
			if (!streetSegment.maneuverInfo || !streetSegment.maneuverInfo.curbInfo || streetSegment.maneuverInfo.curbInfo.length == 0 || rebind)
			{
				helper.bindCurbToStreet(streetSegment, this.getCurbs());
			}
			if (!streetSegment.maneuverInfo || !streetSegment.maneuverInfo.maneuvers || streetSegment.maneuverInfo.maneuvers.length == 0 || rebind)
			{
				helper.bindTurnToStreet(streetSegment, this.getManeuvers());
			}

			streetSegment.maneuverInfo.travelScenarioId = travelScenario.Id;
		}
		self.drawCurbAndManeuverOnMap(streetSegment);
	};

	ManeuverPosCalculator.prototype.getTravelScenario = function()
	{
		return this.dataModel.curbTurnDataModel.travelScenario;
	};

	ManeuverPosCalculator.prototype.getCurbs = function()
	{
		return this.dataModel.curbTurnDataModel.curbs;
	};

	ManeuverPosCalculator.prototype.getManeuvers = function()
	{
		return this.dataModel.curbTurnDataModel.maneuvers;
	};

	ManeuverPosCalculator.prototype.drawCurbAndManeuverOnMap = function(streetSegment)
	{
		this.layer.removeAll();
		this.streetSegment = streetSegment;
		if (this.streetSegment)
		{
			var layerCount = this.map.allLayers.length;
			this.map.reorder(this.layer, layerCount > 10 ? layerCount : 80);
			var polylinePoints = streetSegment.geometry.paths[0];
			var startPoint = polylinePoints[0];
			var endPoint = polylinePoints[polylinePoints.length - 1];
			var middlePos = this.calculateMiddlePos(polylinePoints);
			if (this.getTravelScenario())
			{
				this.calculateCurbApproach(middlePos);
				this.calculateManeuverArrows(startPoint, true, streetSegment.geometry, streetSegment.FromElevation);
				this.calculateManeuverArrows(endPoint, false, streetSegment.geometry, streetSegment.ToElevation);
			}
		}
	};

	ManeuverPosCalculator.prototype.calculateManeuverArrows = function(point, isStart, currentStreetSegment, elevation)
	{
		var junctionStreets = [], self = this;
		var arcgisPoint = new this.arcgis.Point(point, this.map.mapView.spatialReference);
		this.dataModel.all.forEach(function(streetSeg)
		{
			if (streetSeg)
			{
				var streetElevation = self.getStreetElevation(streetSeg, arcgisPoint);
				streetSeg.streetElevation = streetElevation;
				if (streetElevation != null)
				{
					if (streetSeg.geometry.paths[0][0][0] != currentStreetSegment.paths[0][0][0] ||
						streetSeg.geometry.paths[0][0][1] != currentStreetSegment.paths[0][0][1] ||
						streetSeg.geometry.paths[0][1][0] != currentStreetSegment.paths[0][1][0] ||
						streetSeg.geometry.paths[0][1][1] != currentStreetSegment.paths[0][1][1])
					{
						junctionStreets.push(streetSeg);
					}
				}
			}
		});

		if (junctionStreets.length < 2)
		{
			return;
		}

		junctionStreets = junctionStreets.filter(function(c)
		{
			return c.streetElevation == elevation;
		});

		junctionStreets.forEach(function(street)
		{
			var streetPoints = tf.map.ArcGIS.geometryEngine.simplify(street.geometry).paths[0], nextPoint = null;
			if (helper.isSamePoint(streetPoints[0], point))
			{
				nextPoint = streetPoints[1];
			}
			else if (helper.isSamePoint(streetPoints[streetPoints.length - 1], point))
			{
				nextPoint = streetPoints[streetPoints.length - 2];
			}
			if (nextPoint)
			{
				var calP = [nextPoint[0] - point[0], nextPoint[1] - point[1]];
				var angle = Math.atan(calP[1] / calP[0]);
				if (calP[0] < 0)
				{
					angle += Math.PI;
				}
				var targetP = [20 * helper.getScaleRate(self.map), 0];
				var targetP1 = [(targetP[0] * Math.cos(angle) - targetP[1] * Math.sin(angle)) + point[0],
				(targetP[0] * Math.sin(angle) + targetP[1] * Math.cos(angle)) + point[1]];
				var g = self.createArrowGraphic(targetP1, angle, street, isStart);
				if (!self.isPointAccessible(self.streetSegment, point, "out") || !self.isPointAccessible(street, point, "in"))
				{
					g.symbol.color = helper.colors.red;
					g.disabled = true;
					var emptyStatus = self.createStatus(helper.maneuverArrowStatusNull);
					self.updateMyStreetsManeuvers(emptyStatus, g, isStart);
				}
				self.layer.add(g);
			}
		});
	};

	ManeuverPosCalculator.prototype.isPointAccessible = function(street, point, outIn)
	{
		if (street.Speedleft > 0 && street.Speedright > 0 && street.TraversableByVehicle !== "F")
		{
			return true;
		}
		var isFromPoint = helper.isSamePoint(point, street.geometry.paths[0][0], point);
		if (outIn == "out")
		{
			if (isFromPoint && street.Speedleft > 0 && street.TraversableByVehicle !== "F")
			{
				return true;
			} else if (!isFromPoint && street.Speedright > 0 && street.TraversableByVehicle !== "F")
			{
				return true;
			}
		} else
		{
			if (isFromPoint && street.Speedright > 0 && street.TraversableByVehicle !== "F")
			{
				return true;
			} else if (!isFromPoint && street.Speedleft > 0 && street.TraversableByVehicle !== "F")
			{
				return true;
			}
		}
		return false;
	};

	ManeuverPosCalculator.prototype.getStreetElevation = function(street, point)
	{
		var intersectPoint = tf.map.ArcGIS.geometryEngine.intersect(street.geometry, point);
		var isFrom = false;
		if (intersectPoint && street && street.geometry)
		{
			if (street.geometry.paths[0][0][0] == intersectPoint.x && street.geometry.paths[0][0][1] == intersectPoint.y)
			{
				isFrom = true;
			}
			if (isFrom)
			{
				return street.FromElevation;
			}
			return street.ToElevation;
		}
		return null;
	};

	ManeuverPosCalculator.prototype.createArrowGraphic = function(xy, angle, street, isE1Start)
	{
		var self = this;
		var color = self.getColor(ControlTypes.maneuverArrow, street, isE1Start);
		var graphic = helper.createArrowGraphic(xy, angle, color, this.map);
		graphic.attributes = $.extend({}, { dataModel: street, type: ControlTypes.maneuverArrow, isStart: isE1Start });
		return graphic;
	};

	ManeuverPosCalculator.prototype.calculateMiddlePos = function(polylinePoints)
	{
		var ans = helper.calculateMiddlePos(polylinePoints, this.map);
		var graphic = helper.createMiddleArrowGraphic([ans.middlePos.x, ans.middlePos.y], ans.angle, this.map);
		this.layer.add(graphic);
		return ans;
	};

	/**
	* draw curb approach on left and right side of the street
	*/
	ManeuverPosCalculator.prototype.calculateCurbApproach = function(middlePos)
	{
		var self = this;
		var ans = {};
		function create(type)
		{
			var p = helper.createCurbApproach(middlePos.startPoint, middlePos.endPoint, middlePos.middlePos, type, middlePos.angle, self.getColor(type), self.map);
			p.graphic.attributes = $.extend({}, self.streetSegment, { type: type });
			var speedValue = type == ControlTypes.left ? self.streetSegment.Speedleft : self.streetSegment.Speedright;
			if (speedValue <= 0 || self.streetSegment.TraversableByVehicle === "F")
			{
				p.graphic.symbol.color = helper.colors.red;
				p.graphic.disabled = true;
				var emptyStatus = self.createStatus(helper.curbApproachNull);
				self.updateMyStreetsCurbInfo(type, emptyStatus);
			}

			self.layer.add(p.graphic);
			return p.point;
		}
		ans.pointLeft = create(ControlTypes.left);
		ans.pointRight = create(ControlTypes.right);
		return ans;
	};

	ManeuverPosCalculator.prototype.addEvent = function()
	{
		var self = this;
		var map = this.map;
		var mapView = map.mapView;
		if (!tf.authManager.isAuthorizedFor("mapEdit", ["edit", "add"]))
		{
			return;
		}
		self.streetManeuverClick = self.map.mapView.on("click", function(e)
		{
			var graphics = self.layer.graphics.items.filter(function(c) { return c.attributes && c.attributes.type; });
			if (graphics.length > 0)
			{
				var mapPoint = mapView.toMap(e);
				for (var i = 0; i < graphics.length; i++)
				{
					var graphic = graphics[i];
					var tolerance = graphic.symbol.size / 2;
					var screenPoint = mapView.toScreen(graphic.geometry);
					var screenPoint1 = {
						x: screenPoint.x - tolerance,
						y: screenPoint.y + tolerance
					};

					var screenPoint2 = {
						x: screenPoint.x + tolerance,
						y: screenPoint.y - tolerance
					};

					var point1 = mapView.toMap(screenPoint1);
					var point2 = mapView.toMap(screenPoint2);

					var extent = new tf.map.ArcGIS.Extent(point1.x, point1.y, point2.x, point2.y, mapView.spatialReference);
					if (extent.intersects(mapPoint))
					{
						let type = graphic.attributes.type;
						if (graphic.disabled)
						{
							return;
						}

						if (type == ControlTypes.maneuverArrow)
						{
							var nextStatus = self.getNextStatus(helper.maneuverArrowStatus, graphic.symbol.color);
							var symbol = graphic.symbol.clone();
							symbol.color = nextStatus.color;
							graphic.symbol = symbol;
							self.updateMyStreetsManeuvers(nextStatus, graphic, graphic.attributes.isStart);
						}
						else if (type == ControlTypes.left || type == ControlTypes.right)
						{
							var nextStatus = self.getNextStatus(helper.curbApproachColors, graphic.symbol.color);
							var symbol = graphic.symbol.clone();
							symbol.color = nextStatus.color;
							graphic.symbol = symbol;
							self.updateMyStreetsCurbInfo(type, nextStatus);
						}

						return;
					}
				}
			}
		});

		self.scaleChange = self.map.mapView.watch("scale", function()
		{
			clearTimeout(self.drawCurbAndManeuverOnMapTimeout);
			self.drawCurbAndManeuverOnMapTimeout = setTimeout(function()
			{
				self.drawCurbAndManeuverOnMap(self.streetSegment);
			});
		});

	};

	ManeuverPosCalculator.prototype.getColor = function(type, street, isStart)
	{
		var self = this, i;
		if (self.streetSegment.maneuverInfo)
		{
			if (self.isCurbType(type))
			{
				var sideOfStreet = helper.curbSideOfStreet[type];
				var curb = Enumerable.From(self.streetSegment.maneuverInfo.curbInfo).FirstOrDefault(null, function(c) { return c.SideOfStreet == sideOfStreet; });
				if (curb)
				{
					for (i = 0; i < helper.curbApproachColors.length; i++)
					{
						if (helper.curbApproachColors[i].type == curb.Type)
						{
							return helper.curbApproachColors[i].color;
						}
					}
				}
			}
			else if (street && isStart != null)
			{
				let streetData = self.streetSegment.maneuverInfo.maneuvers.find(c =>
				{
					return isStart === (c.Edge1End == 'N') && c.Edge2FID == (street.OBJECTID || street.id);
				});

				if (streetData)
				{
					for (i = 0; i < helper.maneuverArrowStatus.length; i++)
					{
						if (helper.maneuverArrowStatus[i].status == streetData.status)
						{
							return helper.maneuverArrowStatus[i].color;
						}
					}
				}
			}
		}

		return helper.colors.white;
	};

	ManeuverPosCalculator.prototype.updateMyStreetsCurbInfo = function(type, nextStatus)
	{
		var self = this;
		if (!self.streetSegment.maneuverInfo)
		{
			self.streetSegment.maneuverInfo = {};
		}

		if (!self.streetSegment.maneuverInfo.curbInfo)
		{
			self.streetSegment.maneuverInfo.curbInfo = [];
		}

		var sideOfStreet = helper.curbSideOfStreet[type];
		var curb = Enumerable.From(self.streetSegment.maneuverInfo.curbInfo).FirstOrDefault(null, function(c) { return c.SideOfStreet == sideOfStreet; });
		if (curb)
		{
			curb.Type = nextStatus.type;
		} else if (nextStatus.type != helper.curbApproachNull.type)
		{
			curb = self.viewModel.dataModel.curbTurnDataModel.createCurb(self.streetSegment, nextStatus.type, sideOfStreet);
			self.streetSegment.maneuverInfo.curbInfo.push(curb);
		}
	};

	ManeuverPosCalculator.prototype.updateMyStreetsManeuvers = function(nextStatus, graphic, isStart)
	{
		var self = this;
		if (!self.streetSegment.maneuverInfo)
		{
			self.streetSegment.maneuverInfo = {};
		}

		if (!self.streetSegment.maneuverInfo.maneuvers)
		{
			self.streetSegment.maneuverInfo.maneuvers = [];
		}

		var maneuvers = self.streetSegment.maneuverInfo.maneuvers,
			street = graphic.attributes.dataModel,
			streetData = maneuvers.find(c =>
			{
				return isStart === (c.Edge1End == 'N') && c.Edge2FID == (street.OBJECTID || street.id);
			});

		if (streetData)
		{
			streetData.status = nextStatus.status;
		}
		else if (nextStatus.status != helper.maneuverArrowStatusNull.status)
		{
			streetData = self.viewModel.dataModel.curbTurnDataModel.createTurn(self.streetSegment, street, nextStatus.status, isStart);
			maneuvers.push(streetData);
		}
	};

	ManeuverPosCalculator.prototype.getNextStatus = function(all, currentColor)
	{
		var status = null;
		for (var i = 0; i < all.length; i++)
		{
			if (currentColor.r == all[i].color[0] && currentColor.g == all[i].color[1] && currentColor.b == all[i].color[2])
			{
				if (i == all.length - 1)
				{
					status = all[0];
				} else
				{
					status = all[i + 1];
				}
				break;
			}
		}
		return this.createStatus(status);
	};

	ManeuverPosCalculator.prototype.createStatus = function(status)
	{
		return {
			status: status.status,
			type: status.type,
			color: new tf.map.ArcGIS.Color(status.color)
		};
	};

	ManeuverPosCalculator.prototype.isCurbType = function(type)
	{
		return type == ControlTypes.left || type == ControlTypes.right;
	};

	ManeuverPosCalculator.prototype.dispose = function()
	{
		if (this.scaleChange)
		{
			this.scaleChange.remove();
		}
		if (this.streetManeuverClick)
		{
			this.streetManeuverClick.remove();
		}
	};
})();