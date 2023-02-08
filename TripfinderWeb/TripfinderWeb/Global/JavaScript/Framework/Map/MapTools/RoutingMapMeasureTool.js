(function()
{
	createNamespace("TF.Map").RoutingMapMeasureTool = RoutingMapMeasureTool;

	function RoutingMapMeasureTool(map, arcgis, $container, routeState, routingMapTool)
	{
		var self = this;

		TF.Map.MeasurementTool.apply(self, arguments);
		self.resize = function()
		{
			var unitMenu = self.$container.find(".measurement-unit-menu");
			var unitDownArrow = self.$container.find(".measurement-panel-container .down-arrow");
			if (unitMenu.length > 0 && unitDownArrow.length > 0)
			{
				self.setUnitMenuPosition(unitMenu, unitDownArrow, $container);
			}
		};
		$(window).bind('resize', self.resize);
		this.routingMapTool = routingMapTool;
	}

	RoutingMapMeasureTool.prototype = Object.create(TF.Map.MeasurementTool.prototype);
	RoutingMapMeasureTool.prototype.constructor = TF.Map.RoutingMapMeasureTool;

	/**
	 * Set the position of the unit menu.
	 * @param {jQuery} $el The unit menu element.
	 * @param {jQuery} $unitDownArrow The down-arrow icon element.
	 * @param {jQuery} $toolContainer The on-map tool container element.
	 * @return {void}
	 */
	RoutingMapMeasureTool.prototype.setUnitMenuPosition = function($el, $unitDownArrow, $toolContainer)
	{
		var containerTop = $toolContainer.offset().top,
			containerLeft = $toolContainer.offset().left,
			left = $unitDownArrow.offset().left - containerLeft,
			top = $unitDownArrow.offset().top - containerTop;

		top += $unitDownArrow.outerHeight() - $el.outerHeight();

		left = left - $el.outerWidth();

		$el.css({ "top": top, "left": left });
	};

	RoutingMapMeasureTool.prototype.dispose = function()
	{
		$(window).unbind('resize', this.resize);
	};

	RoutingMapMeasureTool.prototype.activate = function()
	{
		this.routingMapTool.startSketch("measurementTool");
		TF.Map.MeasurementTool.prototype.activate.call(this);
	};

	RoutingMapMeasureTool.prototype.deactivate = function()
	{
		this.routingMapTool.stopSketch("measurementTool");
		TF.Map.MeasurementTool.prototype.deactivate.call(this);
	};

})();