(function()
{
	createNamespace("TF.Map").HomeLocationPinTool = HomeLocationPinTool;

	function HomeLocationPinTool(routingMapTool)
	{
		var self = this;
		self.symbol = new TF.Map.Symbol();
		self.routingMapTool = routingMapTool;
		self.map = self.routingMapTool.routingMapDocumentViewModel._map;
		self.routeState = self.routingMapTool.routingMapDocumentViewModel.routeState;
		self.layer = self.routingMapTool.routingMapDocumentViewModel.layer;
		self.graphic = self.routingMapTool.routingMapDocumentViewModel.graphic;
		self.stopTool = new TF.RoutingMap.RoutingPalette.StopTool(null, self.map, null);
	}

	HomeLocationPinTool.prototype.startPin = function()
	{
		this.routingMapTool.$container.find(".home").addClass("on");
		this.routingMapTool.startSketch("homePinTool");//manuallyPinTool
		this.cursorToPin();
		this.bindClickEvent();
		this.bindEscEvent();
	};

	HomeLocationPinTool.prototype.stopPin = function()
	{
		this.routingMapTool.$container.find(".home").removeClass("on");
		this.routingMapTool.stopSketch("homePinTool");//manuallyPinTool
		this.cursorToDefault();
		tf.documentEvent.unbind("keydown.homepin", this.routeState);
		this.mapClickEvent && this.mapClickEvent.remove();
		this.mapClickEvent = null;
	};

	HomeLocationPinTool.prototype.modifyRecordToNewLocation = function(geometry)
	{
		var self = this;
		this.reverseKey = TF.createId();
		var geoGraphic = tf.map.ArcGIS.webMercatorUtils.webMercatorToGeographic(geometry);
		update(geoGraphic.x, geoGraphic.y);
		function update(x, y)
		{
			const homeLocation = self.routingMapTool.routingMapDocumentViewModel.homeLocation;
			homeLocation["Longitude"] = x;
			homeLocation["Latitude"] = y;
		}
	};

	HomeLocationPinTool.prototype.bindClickEvent = function()
	{
		var self = this;
		self.mapClickEvent && self.mapClickEvent.remove();
		self.mapClickEvent = self.map.mapView.on("click", (event) =>
		{
			self.proceedPinEvent(event);
		});
	};

	HomeLocationPinTool.prototype.proceedPinEvent = function(event)
	{
		var self = this;
		self.modifyGraphicOnMap(event.mapPoint);
		self.modifyRecordToNewLocation(event.mapPoint);
	};

	HomeLocationPinTool.prototype.bindEscEvent = function()
	{
		var self = this;
		tf.documentEvent.bind("keydown.homepin", self.routeState, function(e)
		{
			if (e.key === "Escape")
			{
				self.stopPin();
			}
		});
	};

	HomeLocationPinTool.prototype.modifyGraphicOnMap = function(geometry)
	{
		var self = this;
		if (self.graphic)
		{
			self.graphic.geometry = geometry;
		}
	};

	HomeLocationPinTool.prototype.cursorToPin = function()
	{
		TF.Helper.MapHelper.setMapCursor(this.map, "pin");
		this.map.mapView.pining = true;
	};

	HomeLocationPinTool.prototype.cursorToDefault = function()
	{
		TF.Helper.MapHelper.setMapCursor(this.map, "default");
		this.map.mapView.pining = false;
	};

	HomeLocationPinTool.prototype.dispose = function()
	{
		this.stopPin();
		this.routingMapTool = null;
		this.map = null;
		this.routeState = null;
		this.layer = null;
	};
})();
