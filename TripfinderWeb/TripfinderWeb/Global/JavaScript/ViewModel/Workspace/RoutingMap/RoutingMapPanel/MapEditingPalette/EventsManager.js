(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette").EventsManager = EventsManager;
	function EventsManager(mapEditingPaletteViewModel)
	{
		var self = this;
		this.boundarySets = ko.observableArray();
		this.mapEditingPaletteViewModel = mapEditingPaletteViewModel;
		// this.imortDataClickEvent = new TF.Events.Event();
		this.saveClickEvent = new TF.Events.Event();
		this.revertClickEvent = new TF.Events.Event();
		this.infoClickEvent = new TF.Events.Event();

	}
	EventsManager.prototype = Object.create(TF.RoutingMap.EventBase.prototype);
	EventsManager.prototype.constructor = EventsManager;

	EventsManager.prototype.init = function(data, domElement)
	{
		var self = this;
	}

	// EventsManager.prototype.imortDataClick = function(model, e)
	// {
	// 	this.imortDataClickEvent.notify(model, e);
	// }

	EventsManager.prototype.saveClick = function(model, e)
	{
		this.saveClickEvent.notify(model, e);
		// e.stopPropagation();
	}

	EventsManager.prototype.revertClick = function(model, e)
	{
		this.revertClickEvent.notify(model, e);
	}

})();