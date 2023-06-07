(function()
{
	createNamespace("TF.GIS").Map = Map;

	const MAP_MIN_ZOOM_LEVEL = 3;
	const MAP_MAX_ZOOM_LEVEL = 23;
	const WKID_WEB_MERCATOR = 102100;

	const defaultOptions = {
		baseMapId: "streets-vector",
		center: [-73.9412, 42.8123],
		minZoom: MAP_MIN_ZOOM_LEVEL,
		zoom: 12,
		spatialReference: {
			wkid: WKID_WEB_MERCATOR
		},
		background: {
			color: [240, 237, 229]
		},
		eventHandlers: {
			onMapViewCreated: null,
			onMapViewDoubleClick: null,
			onMapViewUpdating: null,
		}
	};

	function Map(options)
	{
		this.settings = Object.assign({}, defaultOptions, options);
		this._map = null;
		this.eventHandler = {
			onMapViewCreatedPromise: null,
			onMapViewDoubleClick: null,
			onMapViewUpdating: null,
		};
		this.name = `Map - ${Date.now()}`;
	}

	Map.prototype.constructor = Map;

	Object.defineProperty(Map.prototype, 'map', {
		get() { return this._map; },
		enumerable: false,
		configurable: false
	});

	Map.prototype.create = async function($mapUiElement)
	{
		const self = this;
		let map = null;

		return new Promise((resolve, reject) =>
		{
			try
			{
				require({}, ["esri/Map", "esri/views/MapView", "esri/geometry/SpatialReference"], (Map, MapView, SpatialReference) =>
				{
					map = new Map({
						basemap: self.settings.baseMapId
					});
	
					const view = new MapView({
						container: $mapUiElement[0],
						map: map,
						spatialReference: self.settings.spatialReference,
						center: self.settings.center,
						zoom: self.options.zoom,
						popup: {
							autoOpenEnabled: false,
							autoCloseEnabled: false,
							collapseEnabled: false,
							dockEnabled: false,
							spinnerEnabled: false,
							actions: [],
							dockOptions: {
								breakpoint: false
							}
						},
						background: self.settings.background,
						constraints: {
							rotationEnabled: false,
							minZoom: self.settings.minZoom
						}
					});
	
					if (view.zoom < 0)
					{
						view.scale = 5000;
					}
	
					map.mapView = view;
					self._map = map;

					self.createMapEvents();
	
					resolve(map);
				});
			}
			catch (ex)
			{
				reject(ex);
			}			
		});
	}

	Map.prototype.createMapEvents = function()
	{
		const self = this;
		if (self.settings.eventHandlers.onMapViewDoubleClick)
		{
			self.eventHandler.onMapViewDoubleClick = self.map.mapView.on("double-click", self.settings.eventHandlers.onMapViewDoubleClick);
		}

		if (self.settings.eventHandlers.onMapViewUpdating)
		{
			self.eventHandler.onMapViewUpdating = self.map.mapView.watch('updating', self.settings.eventHandlers.onMapViewUpdating);
		}

		if (self.settings.eventHandlers.onMapViewCreated)
		{
			self.eventHandler.onMapViewCreatedPromise = self.map.mapView.when(self.settings.eventHandlers.onMapViewCreated);
		}
	}

	Map.prototype.destroyMapEvents = function()
	{
		const self = this;
		if (self.settings.eventHandlers.onMapViewDoubleClick && self.eventHandler.onMapViewDoubleClick)
		{
			self.eventHandler.onMapViewDoubleClick.remove();
			self.eventHandler.onMapViewDoubleClick = null;
		}

		if (self.settings.eventHandlers.onMapViewUpdating && self.eventHandler.onMapViewUpdating)
		{
			self.eventHandler.onMapViewUpdating.remove();
			self.eventHandler.onMapViewUpdating = null;
		}

		if (self.settings.eventHandlers.onMapViewCreated && self.eventHandler.onMapViewCreatedPromise)
		{
			self.eventHandler.onMapViewCreatedPromise = null;
		}
	}

	Map.prototype.setMapCursor = function(cursorType)
	{
		const map = this._map;
		const availableCursorTypes = ["default", "locate", "locate-white", "pin"];

		$(map.mapView.container).removeClass("pin-cursor");

		let cursor = null;
		switch (cursorType)
		{
			case "locate":
				cursor = "url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAaCAYAAAC+aNwHAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAABZ0lEQVQ4y5WTMUsDQRCFvztSWBhr8Rek0EqslCg6oAYEwdY6tV1AbASxyd+wsRAECwmMYEArsdLCzk5SexZpJBbZC3tzt3fnwBX75r2ZtztzESZE5BA4AnaBOQePgQFwo6q3Pj/yhAvAFXBAedwBx6r6PSsgIvPAC9CiXnwAa6r6EzvgOiD+dZ+NltMQicgecG8II+AUeHTnLeASWDS8/QbQLRCvquqXh32KyAB4NUW6MdA2BXpGDIDDegZux0DTAyZMxxWKgeOk0YwLSJOSArlcDCTeOQI6JQU6eLsDJDEwNKS+iCxZpcP6Bh5GIrINPJjECDjzim8CF+THuJNu4hOwXnLnqCD3rKob6SOeB+4cBcQzjf8zvQHL1It3VV2B6RTS6NUUZ7gZezVdzLpbB3VdZDi5B6pwkele5KDKRS5XOKKAi1z3kIOQi0JnoSWxLgq7lzmwHf+zIxkXiYgkZZxGRY2TqiZ/HZNl0jX5bvAAAAAASUVORK5CYII=\") 8 24, auto";
				break;
			case "locate-white":
				cursor = "url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAaCAYAAAC+aNwHAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAABC0lEQVQ4y5WSMapCQQxFo/xSbAU74a9EEORVrkAQN+Cefq2F4A7cwStcgqBWvkoQj80MDPmTybwLKSZzc3MnGREFYAX8ATfgGeIWciuxAIyBIz6OwFgXj4BLRXHEBRilAieD+A6RwykWLzOXV2ADzEJsQk5jKcAhUzzNzGiaETkI8FDJdWHQa8V9CPBKEh9gUhCYBE7Ea5jjiY1/d0MR6ZLzQESagkATOBGdAHv1rnthiHfF3QswN9a4BX5DbI01zqP62fgsHzW0FOfU3oL+WOg3tj2K29yOmx4C+U1VumjFQqWL0j9xXbTiwXHRuAIFF353x0Vdd8NFfXfDRb/uiUgHdCXOj6Ox85p8Aa3WhV7ZByO1AAAAAElFTkSuQmCC\") 8 24, auto";
				break;
			case "pin":
				cursor = "pin";
				$(map.mapView.container).addClass("pin-cursor");
				break;
			default:
				cursor = cursorType;
				break;
		}

		map.mapView.container.style.cursor = cursor;

		if (availableCursorTypes.indexOf(cursorType) >= 0)
		{
			$(map.mapView.container).find(".esri-view-surface[data-interacting='true']").attr("data-interacting", false);
		}
	}


})();
