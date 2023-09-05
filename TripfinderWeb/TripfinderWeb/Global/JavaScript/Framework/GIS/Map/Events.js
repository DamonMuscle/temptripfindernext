(function()
{
	createNamespace("TF.GIS.Map").Events = Events;

	function Events()
	{
		this.eventHandler = {
			onMapViewCreatedPromise: null,
			onMapViewClick: null,
			onMapViewDoubleClick: null,
			onMapViewDrag: null,
			onMapViewPointerMove: null,
			onMapViewPointerDown: null,
			onMapViewPointerUp: null,
			onMapViewExtentChanges: null,
			onMapViewScaleChanges: null,
			onMapViewKeyUp: null,
			onMapViewMouseWheel: null,
			onMapViewUpdating: null,
		};

		this.onMapViewCreatedEvent = new TF.Events.Event();
		this.onMapViewClickEvent = new TF.Events.Event();
		this.onMapViewDoubleClickEvent = new TF.Events.Event();
		this.onMapViewDragEvent = new TF.Events.Event();
		this.onMapViewPointerMoveEvent = new TF.Events.Event();
		this.onMapViewPointerDownEvent = new TF.Events.Event();
		this.onMapViewPointerUpEvent = new TF.Events.Event();
		this.onMapViewExtentChangeEvent = new TF.Events.Event();
		this.onMapViewScaleChangeEvent = new TF.Events.Event();
		this.onMapViewKeyUpEvent = new TF.Events.Event();
		this.onMapViewMouseWheelEvent = new TF.Events.Event();
		this.onMapViewUpdatingEvent = new TF.Events.Event();
		this.onMapViewUpdatedEvent = new TF.Events.Event();
	}

	Events.prototype.init = function(mapView)
	{
		const self = this;

		self.eventHandler.onMapViewCreatedPromise = mapView.when(() =>
		{
			self.onMapViewCreatedEvent.notify();
		});

		self.eventHandler.onMapViewClick = mapView.on("click", (event) =>
		{
			self.onMapViewClickEvent.notify({event});
		});

		self.eventHandler.onMapViewDoubleClick = mapView.on("double-click", (event) =>
		{
			self.onMapViewDoubleClickEvent.notify({ event });
		});

		self.eventHandler.onMapViewDrag = mapView.on("drag", (event) =>
		{
			self.onMapViewDragEvent.notify({ event });
		});

		self.eventHandler.onMapViewPointerMove = mapView.on('pointer-move', (event) =>
		{
			self.onMapViewPointerMoveEvent.notify({ event });
		});

		self.eventHandler.onMapViewPointerDown = mapView.on('pointer-down', (event) =>
		{
			self.onMapViewPointerDownEvent.notify({ event });
		});

		self.eventHandler.onMapViewPointerUp = mapView.on('pointer-up', (event) =>
		{
			self.onMapViewPointerUpEvent.notify({ event });
		});

		self.eventHandler.onMapViewExtentChanges = mapView.watch('extent', (previous, extent, _) =>
		{
			self.onMapViewExtentChangeEvent.notify({ previous, extent });
		});

		self.eventHandler.onMapViewScaleChanges = mapView.watch('scale', (previous, scale, _) =>
		{
			self.onMapViewScaleChangeEvent.notify({ previous, scale });
		});

		self.eventHandler.onMapViewKeyUp = mapView.on('key-up', (event) =>
		{
			self.onMapViewKeyUpEvent.notify({ event });
		});

		self.eventHandler.onMapViewMouseWheel = mapView.on('mouse-wheel', (event) =>
		{
			self.onMapViewMouseWheelEvent.notify({ event });
		});

		self.eventHandler.onMapViewUpdating = mapView.watch('updating', (event) =>
		{
			self.onMapViewUpdatingEvent.notify({ event });
		});

		const executeOnce = async () => {
			await TF.GIS.SDK.reactiveUtils.whenOnce(() => !mapView.updating);
			self.onMapViewUpdatedEvent.notify();
		};
		executeOnce();
	}

	Events.prototype.dispose = function()
	{
		const self = this;

		for (let name in self.eventHandler)
		{
			if (typeof self.eventHandler[name]?.remove === "function")
			{
				self.eventHandler[name].remove();
			}

			self.eventHandler[name] = null;
		}

		self.onMapViewCreatedEvent.unsubscribeAll();
		self.onMapViewClickEvent.unsubscribeAll();
		self.onMapViewDoubleClickEvent.unsubscribeAll();
		self.onMapViewDragEvent.unsubscribeAll();
		self.onMapViewPointerMoveEvent.unsubscribeAll();
		self.onMapViewPointerDownEvent.unsubscribeAll();
		self.onMapViewPointerUpEvent.unsubscribeAll();
		self.onMapViewExtentChangeEvent.unsubscribeAll();
		self.onMapViewScaleChangeEvent.unsubscribeAll();
		self.onMapViewKeyUpEvent.unsubscribeAll();
		self.onMapViewMouseWheelEvent.unsubscribeAll();
		self.onMapViewUpdatingEvent.unsubscribeAll();
		self.onMapViewUpdatedEvent.unsubscribeAll();
	}
})();