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
		events: {
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
		if (self.settings.events.onMapViewDoubleClick)
		{
			self.eventHandler.onMapViewDoubleClick = self.map.mapView.on("double-click", self.settings.events.onMapViewDoubleClick);
		}

		if (self.settings.events.onMapViewUpdating)
		{
			self.eventHandler.onMapViewUpdating = self.map.mapView.watch('updating', self.settings.events.onMapViewUpdating);
		}

		if (self.settings.events.onMapViewCreated)
		{
			self.eventHandler.onMapViewCreatedPromise = self.map.mapView.when(self.settings.events.onMapViewCreated);
		}
	}

	Map.prototype.destroyMapEvents = function()
	{
		const self = this;
		if (self.settings.events.onMapViewDoubleClick && self.eventHandler.onMapViewDoubleClick)
		{
			self.eventHandler.onMapViewDoubleClick.remove();
			self.eventHandler.onMapViewDoubleClick = null;
		}

		if (self.settings.events.onMapViewUpdating && self.eventHandler.onMapViewUpdating)
		{
			self.eventHandler.onMapViewUpdating.remove();
			self.eventHandler.onMapViewUpdating = null;
		}

		if (self.settings.events.onMapViewCreated && self.eventHandler.onMapViewCreatedPromise)
		{
			self.eventHandler.onMapViewCreatedPromise = null;
		}
	}
})();
