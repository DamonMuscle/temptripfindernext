(function()
{
	createNamespace("TF.RoutingMap.DirectionPalette").EventsManager_ESRI = EventsManager;
	function EventsManager(directionPaletteViewModel)
	{
		this.element = null;
		this.directionPaletteViewModel = directionPaletteViewModel;
	};

	EventsManager.prototype = Object.create(TF.RoutingMap.EventBase.prototype);
	EventsManager.prototype.constructor = EventsManager;

	EventsManager.prototype.init = function(data, domElement)
	{
		var self = this;
		self.element = $(domElement);
	};

})();