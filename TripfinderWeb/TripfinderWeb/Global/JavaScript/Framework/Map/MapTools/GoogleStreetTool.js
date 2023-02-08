(function()
{
	createNamespace("TF.Map").GoogleStreetTool = GoogleStreetTool;

	function GoogleStreetTool(map, arcgis, routeState, routingMapTool)
	{
		var self = this;
		self.map = map;
		self.arcgis = arcgis;
		self.routeState = routeState;
		self.routingMapTool = routingMapTool;

		self.isActive = false;
		self.isMouseDown = false;
		self.isMouseDownAndMove = false;
		self.onMeasureEnd = new TF.Events.Event();
		self.measureHelper = null;
	}

	GoogleStreetTool.prototype.activate = function()
	{
		var self = this;
		self.routingMapTool.startSketch("googleStreetTool");
		self.measureHelper = new TF.Map.MapMeasureHelper(self.map, self.arcgis);
		tf.documentEvent.bind("mousedown.measurement", self.routeState, self.onMouseDown.bind(self));
		self.measureHelper.onMeasure.subscribe(self.onHelperMeasuring.bind(self));
		self.measureHelper.onMeasureEnd.subscribe(self.onHelperMeasureEnd.bind(self));
		self.measureHelper.activate("location", "degrees");
		self.measureHelper.setUnit("degrees");
		tf.documentEvent.bind("keydown.measurement", self.routeState, function(e) { if (e.keyCode === 27 || e.keyCode === 13) self.onKeyDown(e); });
		self.isActive = true;
		self.isMouseDown = false;
		self.isMouseDownAndMove = false;
	};

	GoogleStreetTool.prototype.deactivate = function()
	{
		var self = this;
		if (!self.isActive) return;
		this.routingMapTool.stopSketch("googleStreetTool");
		self.measureHelper.deactivate();
		tf.documentEvent.unbind("mousedown.measurement", this.routeState);
		tf.documentEvent.unbind("keydown.measurement", this.routeState);
		self.isActive = false;
		self.isMouseDown = false;
		self.isMouseDownAndMove = false;
		self.onMeasureEnd.notify();
	};

	GoogleStreetTool.prototype.onKeyDown = function(evt)
	{
		var self = this, helper = self.measureHelper;
		if (evt.keyCode != jQuery.ui.keyCode.ESCAPE) return;
		if (helper && helper.hasMeasureGraphic())
		{
			helper.resetDrawStatus();
			TF.Helper.MapHelper.setMapCursor(self.map, "crosshair");
		}
		self.deactivate();
	};

	GoogleStreetTool.prototype.onMouseDown = function(evt)
	{
		var self = this;
		self.isMouseDown = true;
		self.measureHelper.deactivatePinFeature();
	};

	GoogleStreetTool.prototype.onHelperMeasuring = function(evt, data)
	{
		var self = this;
		if (self.isMouseDown) self.isMouseDownAndMove = true;
		self.measureHelper.deactivatePinFeature();
	};

	GoogleStreetTool.prototype.onHelperMeasureEnd = function(evt, data)
	{
		var self = this;
		if (!self.isMouseDownAndMove)
		{
			let lng = data.value[0].toFixed(6);
			let lat = data.value[1].toFixed(6);
			let url = `https://maps.google.com/maps?q=&layer=c&cbll=${lat},${lng}&cbp=11,0,0,0,0`;
			let screenHeight = $(window).height();
			let screenWidth = $(window).width();
			let winZoom = 0.75;
			let winHeight = screenHeight * winZoom;
			let winWidth = screenWidth * winZoom;
			let winTop = (screenHeight - winHeight) / 2 / winZoom;
			let winLeft = (screenWidth - winWidth - 10) / 2;
			let winFeature = `width=${winWidth},height=${winHeight},top=${winTop},left=${winLeft}`;
			this.deactivate();
			data.event.native.ctrlKey ? window.open(url) : window.open(url, '_blank', winFeature);
		}

		self.isMouseDown = false;
		self.isMouseDownAndMove = false;
	};

	GoogleStreetTool.prototype.isMeasurementActive = function() { return this.isActive; };

	GoogleStreetTool.prototype.dispose = function()
	{
		var self = this;
		if (self.measureHelper) self.measureHelper.dispose();
	};
})();