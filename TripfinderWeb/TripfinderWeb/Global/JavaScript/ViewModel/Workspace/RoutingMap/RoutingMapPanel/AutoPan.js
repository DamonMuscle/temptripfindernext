(function()
{
	var mapAutoPanScale = 10;
	function getCursorPosition(screenPoint, mapRegionExtent)
	{
		var cursorX = screenPoint.x,
			cursorY = screenPoint.y;

		for (var directionDomain in mapRegionExtent)
		{
			//check own property to excluse undefined
			if (mapRegionExtent.hasOwnProperty(directionDomain))
			{
				if ((mapRegionExtent[directionDomain]).some(function(subDomain)
				{
					return (cursorX >= subDomain.minX && cursorX <= subDomain.maxX
						&& cursorY >= subDomain.minY && cursorY <= subDomain.maxY);
				}))
				{
					return directionDomain;
				}
			}
		}

		return null;
	};

	function autoPanMap(screenPoint, cursorPosition, map)
	{
		if (!cursorPosition) return;

		map.__panStart(screenPoint.x, screenPoint.y);
		switch (cursorPosition)
		{
			case 'North':
				map.__pan(0, mapAutoPanScale);
				map.__panEnd(0, mapAutoPanScale);
				break;
			case 'NorthEast':
				map.__pan(-mapAutoPanScale, mapAutoPanScale);
				map.__panEnd(-mapAutoPanScale, mapAutoPanScale);
				break;
			case 'East':
				map.__pan(-mapAutoPanScale, 0);
				map.__panEnd(-mapAutoPanScale, 0);
				break;
			case 'SouthEast':
				map.__pan(-mapAutoPanScale, -mapAutoPanScale);
				map.__panEnd(-mapAutoPanScale, -mapAutoPanScale);
				break;
			case 'South':
				map.__pan(0, -mapAutoPanScale);
				map.__panEnd(0, -mapAutoPanScale);
				break;
			case 'SouthWest':
				map.__pan(mapAutoPanScale, -mapAutoPanScale);
				map.__panEnd(mapAutoPanScale, -mapAutoPanScale);
				break;
			case 'West':
				map.__pan(mapAutoPanScale, 0);
				map.__panEnd(mapAutoPanScale, 0);
				break;
			case 'NorthWest':
				map.__pan(mapAutoPanScale, mapAutoPanScale);
				map.__panEnd(mapAutoPanScale, mapAutoPanScale);
			default:
		}
	};


	var AutoPanManager = (function()
	{
		// var mapDic = {};
		return {
			getAutoPan: function(map)
			{
				// if (mapDic[map.id]) return mapDic[map.id];
				// var ap = new AutoPan(map);
				// mapDic[map.id] = ap;
				// return ap;

				return new AutoPan(map);
			}
		}
	})();

	function AutoPan(map)
	{
		this.map = map;
		this.mapRegionExtent = { NorthWest: [], NorthEast: [], SouthWest: [], SouthEast: [], North: [], South: [], West: [], East: [] };
	}

	AutoPan.prototype.initialize = function(mapContainer, tolerance)
	{
		this.tolerance = tolerance;
		this.mapDivId = this.map.id;
		this.panStatus = null;
		this.mapContainer = $(mapContainer);

	}

	AutoPan.prototype.resetAutoPanZone = function(listContainer)
	{
		var self = this;
		self.mapRegionExtent = { NorthWest: [], NorthEast: [], SouthWest: [], SouthEast: [], North: [], South: [], West: [], East: [] };
		listContainer = listContainer || ".list-container";
		self.mapWidth = self.map.width;
		self.mapHeight = self.map.height;
		this.mapContainer.find(".routingmap_panel").each(function(index, panelContainer)
		{
			var panelWidth = $(panelContainer).outerWidth(),
				panelHeight = $(panelContainer).outerHeight(),
				isPanelDockRight = $(this).hasClass("dock-right"),
				isPanelDockLeft = $(this).hasClass('dock-left'),
				marginTop = parseInt($(panelContainer).css('top')),
				isHiddenRight = parseInt($(panelContainer).css('right')) + panelWidth <= 10 ? true : false,
				isHiddenLeft = parseInt($(panelContainer).css('left')) + panelWidth <= 10 ? true : false;

			if (panelWidth > 0)
			{
				if (isPanelDockRight && !isHiddenRight)
				{
					self.mapRegionExtent.North.push.apply(self.mapRegionExtent.North, [{
						'minX': self.tolerance,
						'minY': 0,
						'maxX': self.mapWidth - self.tolerance,
						'maxY': self.tolerance
					},
						// {
						// 	'minX': self.mapWidth - panelWidth,
						// 	'minY': panelHeight + marginTop,
						// 	'maxX': self.mapWidth - self.tolerance,
						// 	'maxY': panelHeight + self.tolerance + marginTop
						// }
					]);

					self.mapRegionExtent.NorthEast.push.apply(self.mapRegionExtent.NorthEast, [{
						'minX': self.mapWidth - self.tolerance,
						'minY': 0,
						'maxX': self.mapWidth,
						'maxY': self.tolerance
					},
						// {
						// 	'minX': self.mapWidth - panelWidth - self.tolerance,
						// 	'minY': marginTop + panelHeight,
						// 	'maxX': self.mapWidth - panelWidth,
						// 	'maxY': marginTop + panelHeight + self.tolerance
						// },
						// {
						// 	'minX': self.mapWidth - self.tolerance,
						// 	'minY': panelHeight + marginTop,
						// 	'maxX': self.mapWidth,
						// 	'maxY': panelHeight + marginTop + self.tolerance
						// }
					]);

					self.mapRegionExtent.East.push.apply(self.mapRegionExtent.East, [{
						'minX': self.mapWidth - self.tolerance,
						'minY': self.tolerance,
						'maxX': self.mapWidth,
						'maxY': marginTop - self.tolerance
					},
					// {
					// 	'minX': self.mapWidth - panelWidth - self.tolerance,
					// 	'minY': marginTop,
					// 	'maxX': self.mapWidth - panelWidth,
					// 	'maxY': panelHeight + marginTop
					// },
					{
						'minX': self.mapWidth - self.tolerance,
						'minY': panelHeight + marginTop + self.tolerance,
						'maxX': self.mapWidth,
						'maxY': self.mapHeight - self.tolerance
					}
					]);

					self.mapRegionExtent.SouthEast.push.apply(self.mapRegionExtent.SouthEast, [{
						'minX': self.mapWidth - self.tolerance,
						'minY': self.mapHeight - self.tolerance,
						'maxX': self.mapWidth,
						'maxY': self.mapHeight
					},
						// {
						// 	'minX': self.mapWidth - panelWidth - self.tolerance,
						// 	'minY': marginTop - self.tolerance,
						// 	'maxX': self.mapWidth - panelWidth,
						// 	'maxY': marginTop
						// },
						// {
						// 	'minX': self.mapWidth - self.tolerance,
						// 	'minY': marginTop - self.tolerance,
						// 	'maxX': self.mapWidth,
						// 	'maxY': marginTop
						// }
					]);

					self.mapRegionExtent.South.push.apply(self.mapRegionExtent.South, [{
						'minX': self.tolerance,
						'minY': self.mapHeight - self.tolerance,
						'maxX': self.mapWidth - self.tolerance,
						'maxY': self.mapHeight
					},
						// {
						// 	'minX': self.mapWidth - panelWidth,
						// 	'minY': marginTop - self.tolerance,
						// 	'maxX': self.mapWidth - self.tolerance,
						// 	'maxY': marginTop
						// }]);

						// self.mapRegionExtent.SouthWest.push.apply(self.mapRegionExtent.SouthWest, [{
						// 	'minX': 0,
						// 	'minY': self.mapHeight - self.tolerance,
						// 	'maxX': self.tolerance,
						// 	'maxY': self.mapHeight
						// }
					]);

					self.mapRegionExtent.West.push.apply(self.mapRegionExtent.West, [{
						'minX': 0,
						'minY': self.tolerance,
						'maxX': self.tolerance,
						'maxY': self.mapHeight - self.tolerance
					}]);

					self.mapRegionExtent.NorthWest.push.apply(self.mapRegionExtent.NorthWest, [{
						'minX': 0,
						'minY': 0,
						'maxX': self.tolerance,
						'maxY': self.tolerance
					}]);
				}
				else if (isPanelDockLeft && !isHiddenLeft)
				{
					self.mapRegionExtent.North.push.apply(self.mapRegionExtent.North, [
						// 	{
						// 	'minX': self.tolerance,
						// 	'minY': panelHeight + marginTop,
						// 	'maxX': panelWidth,
						// 	'maxY': panelHeight + marginTop + self.tolerance
						// },
						{
							'minX': self.tolerance,
							'minY': 0,
							'maxX': self.mapWidth - self.tolerance,
							'maxY': self.tolerance
						}]);

					self.mapRegionExtent.NorthEast.push.apply(self.mapRegionExtent.NorthEast, [{
						'minX': self.mapWidth - self.tolerance,
						'minY': 0,
						'maxX': self.mapWidth,
						'maxY': self.tolerance
					}]);

					self.mapRegionExtent.East.push.apply(self.mapRegionExtent.East, [{
						'minX': self.mapWidth - self.tolerance,
						'minY': self.tolerance,
						'maxX': self.mapWidth,
						'maxY': self.mapHeight - self.tolerance
					}]);

					self.mapRegionExtent.SouthEast.push.apply(self.mapRegionExtent.SouthEast, [{
						'minX': self.mapWidth - self.tolerance,
						'minY': self.mapHeight - self.tolerance,
						'maxX': self.mapWidth,
						'maxY': self.mapHeight
					}]);

					self.mapRegionExtent.South.push.apply(self.mapRegionExtent.South, [{
						'minX': self.tolerance,
						'minY': self.mapHeight - self.tolerance,
						'maxX': self.mapWidth - self.tolerance,
						'maxY': self.mapHeight
					},
						// {
						// 	'minX': self.tolerance,
						// 	'minY': marginTop - self.tolerance,
						// 	'maxX': panelWidth,
						// 	'maxY': marginTop
						// }
					]);

					self.mapRegionExtent.SouthWest.push.apply(self.mapRegionExtent.SouthWest, [{
						'minX': 0,
						'minY': self.mapHeight - self.tolerance,
						'maxX': self.tolerance,
						'maxY': self.mapHeight
					},
						// {
						// 	'minX': panelWidth,
						// 	'minY': marginTop - self.tolerance,
						// 	'maxX': panelWidth + self.tolerance,
						// 	'maxY': marginTop
						// },
						// {
						// 	'minX': 0,
						// 	'minY': marginTop - self.tolerance,
						// 	'maxX': self.tolerance,
						// 	'maxY': marginTop
						// }
					]);

					self.mapRegionExtent.West.push.apply(self.mapRegionExtent.West, [{
						'minX': 0,
						'minY': self.tolerance,
						'maxX': self.tolerance,
						'maxY': marginTop - self.tolerance
					},
					// {
					// 	'minX': panelWidth,
					// 	'minY': marginTop,
					// 	'maxX': panelWidth + self.tolerance,
					// 	'maxY': marginTop + panelHeight
					// },
					{
						'minX': 0,
						'minY': marginTop + panelHeight + self.tolerance,
						'maxX': self.tolerance,
						'maxY': self.mapHeight - self.tolerance
					}]);

					self.mapRegionExtent.NorthWest.push.apply(self.mapRegionExtent.NorthWest, [{
						'minX': 0,
						'minY': 0,
						'maxX': self.tolerance,
						'maxY': self.tolerance
					},
						// {
						// 	'minX': 0,
						// 	'minY': panelHeight + marginTop,
						// 	'maxX': self.tolerance,
						// 	'maxY': panelHeight + marginTop + self.tolerance
						// },
						// {
						// 	'minX': panelWidth,
						// 	'minY': panelHeight + marginTop,
						// 	'maxX': panelWidth + self.tolerance,
						// 	'maxY': panelHeight + marginTop + self.tolerance
						// }
					]);
				} else
				{
					self.mapRegionExtent.North.push.apply(self.mapRegionExtent.North, [{
						'minX': self.tolerance,
						'minY': 0,
						'maxX': self.mapWidth - self.tolerance,
						'maxY': self.tolerance
					}]);

					self.mapRegionExtent.NorthEast.push.apply(self.mapRegionExtent.NorthEast, [{
						'minX': self.mapWidth - self.tolerance,
						'minY': 0,
						'maxX': self.mapWidth,
						'maxY': self.tolerance
					}]);

					self.mapRegionExtent.East.push.apply(self.mapRegionExtent.East, [{
						'minX': self.mapWidth - self.tolerance,
						'minY': self.tolerance,
						'maxX': self.mapWidth,
						'maxY': self.mapHeight - self.tolerance
					}]);

					self.mapRegionExtent.SouthEast.push.apply(self.mapRegionExtent.SouthEast, [{
						'minX': self.mapWidth - self.tolerance,
						'minY': self.mapHeight - self.tolerance,
						'maxX': self.mapWidth,
						'maxY': self.mapHeight
					}]);

					self.mapRegionExtent.South.push.apply(self.mapRegionExtent.South, [{
						'minX': self.tolerance,
						'minY': self.mapHeight - self.tolerance,
						'maxX': self.mapWidth - self.tolerance,
						'maxY': self.mapHeight
					}]);

					self.mapRegionExtent.SouthWest.push.apply(self.mapRegionExtent.SouthWest, [{
						'minX': 0,
						'minY': self.mapHeight - self.tolerance,
						'maxX': self.tolerance,
						'maxY': self.mapHeight
					}]);

					self.mapRegionExtent.West.push.apply(self.mapRegionExtent.West, [{
						'minX': 0,
						'minY': self.tolerance,
						'maxX': self.tolerance,
						'maxY': self.mapHeight - self.tolerance
					}]);

					self.mapRegionExtent.NorthWest.push.apply(self.mapRegionExtent.NorthWest, [{
						'minX': 0,
						'minY': 0,
						'maxX': self.tolerance,
						'maxY': self.tolerance
					}]);
				}
			}

		})
	}

	AutoPan.prototype.startPan = function(screenPoint, scope)
	{
		var self = this;
		var cursorPosition = getCursorPosition(screenPoint, this.mapRegionExtent);
		clearInterval(self.autoPanInterval);
		clearInterval(self.panCheckInterval);
		autoPanMap(screenPoint, cursorPosition, self.map);
		if (!cursorPosition && this.lastCursorPosition)
		{
			self.onAutoPanEnd(scope);
		}
		else if (cursorPosition && !this.lastCursorPosition)
		{
			self.onAutoPanStart();
		}
		this.lastCursorPosition = cursorPosition ? JSON.parse(JSON.stringify(cursorPosition)) : null;
		if (cursorPosition)
		{
			self.autoPanInterval = setInterval(autoPanMap, 10, screenPoint, cursorPosition, self.map);
			self.panCheckInterval = setInterval(self.treatPanStatus.bind(self), 10);
		}
	}

	AutoPan.prototype.stopPan = function()
	{
		var self = this;
		clearInterval(self.autoPanInterval);
		clearInterval(self.panCheckInterval);
	}

	AutoPan.prototype.treatPanStatus = function()
	{
		var self = this,
			hoverMapDiv = $(this.map.container).is(":hover");
		if (hoverMapDiv)
		{
			clearInterval(self.autoPanInterval);
			clearInterval(self.panCheckInterval);
		}
	};

	AutoPan.prototype.onAutoPanEnd = function(scope)
	{
		this.panStatus = "end";
	};

	AutoPan.prototype.onAutoPanStart = function() { this.panStatus = "start"; }
	AutoPan.prototype.onAutoPanning = function() { }
	createNamespace('TF.RoutingMap').AutoPanManager = AutoPanManager;
})();