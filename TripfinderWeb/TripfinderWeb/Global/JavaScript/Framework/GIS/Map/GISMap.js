(function()
{
	createNamespace("TF.GIS").Map = Map;

	const MAP_MIN_ZOOM_LEVEL = 2;
	const MAP_MAX_ZOOM_LEVEL = 23;
	const WKID_WEB_MERCATOR = 102100;
	
	const LAYER_TYPE = {
		FEATURE: "feature",
		GRAPHIC: "graphic"
	};

	const GEOMETRY_TYPE = {
		POINT: "point",
		POLYLINE: "polyline",
		POLYGON: "polygon"
	};

	const CURSOR_TYPE = {
		DEFAULT: "default",
		POINTER: "pointer",
		CROSSHAIR: "crosshair",
		PIN: "pin",
		LOCATE_LIGHT: "locate-white",
		LOCATE_DARK: "locate",
	};

	const defaultOptions = {
		baseMapId: "streets-vector",
		center: [-73.9412, 42.8123],
		minZoom: MAP_MIN_ZOOM_LEVEL,
		zoom: 12,
		spatialReference: {
			wkid: WKID_WEB_MERCATOR
		},
		highlightOptions: null,
		background: {
			color: [240, 237, 229]
		},
		constraints: {
			rotationEnabled: false,
			minZoom: MAP_MIN_ZOOM_LEVEL
		},
		eventHandlers: {
			onMapViewCreated: null,
			onMapViewUpdated: null,
			onMapViewCustomizedEventHandler: null,
		}
	};

	function Map($mapContainer, options)
	{
		this.settings = Object.assign({}, defaultOptions, options);
		this.eventHandler = {
			onMapViewCreatedPromise: null,
			onMapViewClick: null,
			onMapViewDoubleClick: null,
			onMapViewDrag: null,
			onMapViewPointerMove: null,
			onMapViewPointerDown: null,
			onMapViewPointerUp: null,
			onMapViewUpdated: null,
			onMapViewUpdating: null,
			onMapViewExtentChanges: null,
			onMapViewKeyUp: null,
			onMapViewMouseWheel: null,
			onMapViewCustomizedEventHandler: null,
		};

		this.defineReadOnlyProperty('mapLayerInstances', []);
		this.defineReadOnlyProperty('LAYER_TYPE', LAYER_TYPE);
		this.defineReadOnlyProperty('GEOMETRY_TYPE', GEOMETRY_TYPE);
		this.defineReadOnlyProperty('WKID_WEB_MERCATOR', WKID_WEB_MERCATOR);
		this.create($mapContainer);

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
	}

	/**
	 * Load Esri js SDK
	 * @returns 
	 */
	Map.LoadResources = async function()
	{
		Map.resourcesLoadingPromise = Map.resourcesLoadingPromise || new Promise(function(resolve, reject)
		{
			require({}, [
				"esri/Map",
				"esri/Basemap",
				"esri/views/MapView",
				"esri/layers/GraphicsLayer",
				"esri/layers/MapImageLayer",
				"esri/Graphic",
				"esri/geometry/SpatialReference",
				"esri/layers/FeatureLayer",
				"esri/request",
				"esri/config",
				"esri/Color",
				"esri/symbols/Font",
				"esri/symbols/PictureMarkerSymbol",
				"esri/symbols/SimpleFillSymbol",
				"esri/symbols/SimpleLineSymbol",
				"esri/symbols/SimpleMarkerSymbol",
				"esri/symbols/TextSymbol",
				"esri/widgets/BasemapGallery",
				"esri/widgets/Directions",
				"esri/widgets/Search",
				"esri/geometry/Extent",
				"esri/geometry/Point",
				"esri/geometry/Polygon",
				"esri/geometry/Circle",
				"esri/geometry/Polyline",
				"esri/geometry/Multipoint",
				"esri/geometry/support/webMercatorUtils",
				"esri/views/draw/Draw",
				"esri/rest/geoprocessor",
				"esri/rest/support/FeatureSet",
				"esri/rest/support/DirectionsFeatureSet",
				"esri/rest/support/ServiceAreaParameters",
				"esri/rest/locator",
				"esri/rest/support/ProjectParameters",
				"esri/core/reactiveUtils",
				"esri/rest/support/Query",
				"esri/geometry/Geometry",
				"esri/geometry/geometryEngine",
				"esri/widgets/Sketch/SketchViewModel",
				"esri/identity/IdentityManager",
				"esri/rest/support/RouteParameters",
				"esri/layers/TileLayer",
				"esri/layers/VectorTileLayer",
				"esri/widgets/Popup",
				"esri/PopupTemplate",
				"esri/layers/support/TileInfo",
				"esri/views/draw/support/settings",
				"esri/geometry/support/geodesicUtils"
			], function(
				EsriMap,
				Basemap,
				MapView,
				GraphicsLayer,
				MapImageLayer,
				Graphic,
				SpatialReference,
				FeatureLayer,
				esriRequest,
				esriConfig,
				Color,
				Font,
				PictureMarkerSymbol,
				SimpleFillSymbol,
				SimpleLineSymbol,
				SimpleMarkerSymbol,
				TextSymbol,
				BasemapGallery,
				Directions,
				Search,
				Extent,
				Point,
				Polygon,
				Circle,
				Polyline,
				Multipoint,
				webMercatorUtils,
				Draw,
				Geoprocessor,
				FeatureSet,
				DirectionsFeatureSet,
				ServiceAreaParameters,
				Locator,
				ProjectParameters,
				reactiveUtils,
				Query,
				Geometry,
				geometryEngine,
				SketchViewModel,
				IdentityManager,
				RouteParameters,
				TileLayer,
				VectorTileLayer,
				Popup,
				PopupTemplate,
				TileInfo,
				settings,
				geodesicUtils
			)
			{
				createNamespace("TF.GIS").SDK = {
					Color: Color,
					Map: EsriMap,
					Basemap: Basemap,
					MapView: MapView,
					FeatureLayer: FeatureLayer,
					SimpleMarkerSymbol: SimpleMarkerSymbol,
					SimpleLineSymbol: SimpleLineSymbol,
					BasemapGallery: BasemapGallery,
					GraphicsLayer: GraphicsLayer,
					MapImageLayer: MapImageLayer,
					SpatialReference: SpatialReference,
					Graphic: Graphic,
					Font: Font,
					PictureMarkerSymbol: PictureMarkerSymbol,
					SimpleFillSymbol: SimpleFillSymbol,
					TextSymbol: TextSymbol,
					Directions: Directions,
					Search: Search,
					Extent: Extent,
					Point: Point,
					Polygon: Polygon,
					Circle: Circle,
					Polyline: Polyline,
					Multipoint: Multipoint,
					webMercatorUtils: webMercatorUtils,
					Draw: Draw,
					Geoprocessor: Geoprocessor,
					FeatureSet: FeatureSet,
					DirectionsFeatureSet: DirectionsFeatureSet,
					ServiceAreaParameters: ServiceAreaParameters,
					Locator: Locator,
					ProjectParameters: ProjectParameters,
					reactiveUtils: reactiveUtils,
					Query: Query,
					Geometry: Geometry,
					geometryEngine: geometryEngine,
					SketchViewModel: SketchViewModel,
					RouteParameters: RouteParameters,
					esriRequest: esriRequest,
					esriConfig: esriConfig,
					TileLayer: TileLayer,
					VectorTileLayer: VectorTileLayer,
					IdentityManager: IdentityManager,
					Popup: Popup,
					PopupTemplate: PopupTemplate,
					TileInfo: TileInfo,
					settings: settings,
					geodesicUtils: geodesicUtils,
				};
				resolve();
			});
		});

		return Map.resourcesLoadingPromise;
	};

	Map.prototype.constructor = Map;

	Map.prototype.create = function($mapContainer)
	{
		const self = this;
		let map = new TF.GIS.SDK.Map({
			basemap: self.settings.baseMapId
		});

		const view = new TF.GIS.SDK.MapView({
			container: $mapContainer[0],
			map: map,
			spatialReference: self.settings.spatialReference,
			highlightOptions: self.settings.highlightOptions,
			center: self.settings.center,
			zoom: self.settings.zoom,
			popup: {
				autoCloseEnabled: false,
				collapseEnabled: false,
				dockEnabled: false,
				spinnerEnabled: false,
				actions: [],
				dockOptions: {
					breakpoint: false
				}
			},
			popupEnabled: false,
			background: self.settings.background,
			constraints: self.settings.constraints
		});

		if (view.zoom < 0)
		{
			view.scale = 5000;
		}

		map.mapView = view;
		map.id = self.settings.mapId;

		self.defineReadOnlyProperty('map', map);

		self.createMapEvents();
	}

	Map.prototype.defineReadOnlyProperty = function(propertyName, value, configurable = false)
	{
		Object.defineProperty(this, propertyName, {
			get() { return value; },
			enumerable: false,
			configurable: configurable
		});
	};

	Map.prototype.createMapEvents = function()
	{
		const self = this, mapView = self.map.mapView;

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

		self.eventHandler.onMapViewUpdating = mapView.watch('updating', (event) =>
		{
			self.onMapViewUpdatingEvent.notify({ event });
		});

		if (self.settings.eventHandlers.onMapViewUpdated)
		{
			const executeOnce = async () => {
				await TF.GIS.SDK.reactiveUtils.whenOnce(() => !mapView.updating);
				self.settings.eventHandlers.onMapViewUpdated && self.settings.eventHandlers.onMapViewUpdated();
			};
			executeOnce();
		}

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

		if (self.settings.eventHandlers.onMapViewCreated)
		{
			self.eventHandler.onMapViewCreatedPromise = mapView.when(self.settings.eventHandlers.onMapViewCreated);
		}

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

		this.defineReadOnlyProperty("fireCustomizedEvent", function ({ eventType, data = {} })
		{
			if (typeof self.settings.eventHandlers.onMapViewCustomizedEventHandler !== "function")
			{
				console.log("this method is available only when passing onMapViewCustomizedEventHandler");
				return;
			}

			return new Promise(function(resolve)
			{
				data.onCompleted = resolve;
				self.settings.eventHandlers.onMapViewCustomizedEventHandler({ eventType, data });
			});
		}, true);
	}

	Map.prototype.destroyMapEvents = function()
	{
		const self = this;
		for (let name in self.settings.eventHandlers)
		{
			if (self.eventHandler[name])
			{
				if (self.eventHandler[name].remove)
				{
					self.eventHandler[name].remove();
				}

				self.eventHandler[name] = null;
			}
			else if (self.eventHandler[`${name}Promise`])
			{
				self.eventHandler[`${name}Promise`] = null;
			}

			self.settings.eventHandlers[name] = null;
		}

		self.onMapViewClickEvent?.unsubscribeAll();
		self.onMapViewDoubleClickEvent?.unsubscribeAll();
		self.onMapViewDragEvent?.unsubscribeAll();
		self.onMapViewPointerMoveEvent?.unsubscribeAll();
		self.onMapViewPointerDownEvent?.unsubscribeAll();
		self.onMapViewPointerUpEvent?.unsubscribeAll();
		self.onMapViewExtentChangeEvent?.unsubscribeAll();
		self.onMapViewScaleChangeEvent?.unsubscribeAll();
		self.onMapViewKeyUpEvent?.unsubscribeAll();
		self.onMapViewMouseWheelEvent?.unsubscribeAll();
		self.onMapViewUpdatingEvent?.unsubscribeAll();
	}

	Map.prototype.addLayer = function(options, layerType = LAYER_TYPE.GRAPHIC)
	{
		if (this.map === null)
		{
			console.warn(`this.map is null, return.`);
			return null;
		}

		const defaultOptions = {
			id: `layerId_${Date.now()}`,
			index: null,
			eventHandlers: {
				onLayerCreated: null
			}
		};

		const settings = Object.assign({}, defaultOptions, options);

		const layerInstance = new TF.GIS.Layer(options, layerType);
		const layer = layerInstance.layer;

		if (layer === null)
		{
			return null;
		}

		if (settings.eventHandlers.onLayerCreated)
		{
			this.map.mapView.whenLayerView(layer).then((result) => settings.eventHandlers.onLayerCreated.call(result));
		}

		if (layerInstance.index >= 0)
		{
			this.map.add(layer, layerInstance.index);
		}
		else
		{
			this.map.add(layer);
		}

		this.mapLayerInstances.push(layerInstance);

		return layerInstance;
	}

	Map.prototype.addLayerInstance = function(layerInstance, options)
	{
		if (this.map === null)
		{
			console.warn(`this.map is null, return.`);
			return null;
		}

		const defaultOptions = {
			eventHandlers: {
				onLayerCreated: null
			}
		};

		const settings = Object.assign({}, defaultOptions, options);
		const layer = layerInstance.layer;

		if (settings.eventHandlers.onLayerCreated)
		{
			this.map.mapView.whenLayerView(layer).then((result) => settings.eventHandlers.onLayerCreated.call(result));
		}

		if (layerInstance.index && layerInstance.index >= 0)
		{
			this.map.add(layer, layerInstance.index);
		}
		else
		{
			this.map.add(layer);
		}

		this.mapLayerInstances.push(layerInstance);
	}

	Map.prototype.removeLayer = function(layerId)
	{
		const self = this;
		const layer = self.getMapLayer(layerId);

		if (layer == null)
		{
			console.warn(`removeLayer failed, layerId: ${layerId}`);
			return null;
		}

		this.map.remove(layer);
	}

	Map.prototype.removeLayerInstance = function(layerInstance)
	{
		const layerId = layerInstance.layer.id;
		this.removeLayer(layerId);

		const index = this.mapLayerInstances.findIndex(item => item === layerInstance);
		this.mapLayerInstances.splice(index, 1);
	}

	Map.prototype.removeAllLayers = function()
	{
		if (this.map)
		{
			this.map.removeAll();
		}
	}

	Map.prototype.getMapLayer = function(layerId)
	{
		if (this.map === null)
		{
			console.warn(`this.map is null, return.`);
			return null;
		}

		const layer = this.map.findLayerById(layerId);
		if (!layer) {
			console.warn(`Could not find the layer id = ${layerId}`);
			return null;
		}
	
		return layer;
	}

	Map.prototype.getMapLayerInstance = function(layerId)
	{
		if (this.map === null)
		{
			console.warn(`this.map is null, return.`);
			return null;
		}

		let instance = null;
		for (let i = 0; i < this.mapLayerInstances.length; i++)
		{
			if (this.mapLayerInstances[i].layer.id === layerId)
			{
				instance = this.mapLayerInstances[i];
				break;
			}
		}

		if (instance === null)
		{
			console.warn(`Could not find the layer id = ${layerId}`);
		}

		return instance;
	}

	Map.prototype.getMapLayers = function()
	{
		if (this.map)
		{
			return this.map.layers;
		}

		return null;
	}

	Map.prototype.centerAt = function(longitude, latitude)
	{
		const geometry = TF.GIS.GeometryHelper.ComputeWebMercatorPoint(longitude, latitude);
		this.centerAtPoint(geometry);
	}

	Map.prototype.centerAtPoint = function(point)
	{
		this.map.mapView.center = point;
	}

	Map.prototype.zoomToFullVisibleExtent = async function()
	{
		const visibleFeatures = await this.getFullVisibleFeatures();
		if (visibleFeatures.length === 1 &&
			visibleFeatures[0].geometry.type === GEOMETRY_TYPE.POINT)
		{
			const point = visibleFeatures[0].geometry;
			this.centerAndZoom(point.longitude, point.latitude);
			return;
		}

		await this.goTo(visibleFeatures);
	}

	Map.prototype.goTo = async function(target)
	{
		await this.map.mapView.goTo(target, { duration: 0, easing: "linear" });
	}

	Map.prototype.getFullVisibleFeatures = async function()
	{
		const layerInstances = this.mapLayerInstances;
		let visibleFeatures = [];
		for (let i = 0; i < layerInstances.length; i++)
		{
			const layerInstance = layerInstances[i];
			const features = await layerInstance.queryVisibleFeatures();
			visibleFeatures = visibleFeatures.concat(features);
		}

		return visibleFeatures;
	}

	Map.prototype.centerAndZoom = function(longitude, latitude, scale = 5000)
	{
		this.centerAt(longitude, latitude);
		this.setScale(scale);
	}

	Map.prototype.getScale = function()
	{
		return this.map.mapView.scale;
	}

	Map.prototype.setScale = function(scale)
	{
		this.map.mapView.scale = scale;
	}

	Map.prototype.getCenter = function()
	{
		return this.map.mapView.center;
	}

	Map.prototype.getExtent = function()
	{
		return this.map.mapView.extent;
	}

	Map.prototype.setExtent = function(extent)
	{
		this.map.mapView.extent = extent;
	}

	Map.prototype.restrictPanOutside = function()
	{
		const self = this;
		let recenterTimer = null;
		const recenterMap = (extent) =>
		{
			if (recenterTimer != null)
			{
				// avoid call mapView.goTo continuously.
				window.clearTimeout(recenterTimer);
			}

			recenterTimer = setTimeout(async () =>
			{
				recenterTimer = null;
				await self.goTo(extent);
			}, 50);
		}

		this.onMapViewExtentChangeEvent.subscribe(() =>
		{
			const MERCATOR_MAX_Y = 19972000, MERCATOR_MIN_Y = -19972000, mapExtent = this.getExtent();

			if (mapExtent)
			{
				const mapHeight = mapExtent.ymax - mapExtent.ymin;
				if (mapExtent.ymax - MERCATOR_MAX_Y > 1)
				{
					mapExtent.ymax = MERCATOR_MAX_Y;
					mapExtent.ymin = MERCATOR_MAX_Y - mapHeight;
					recenterMap(mapExtent);
				}
				else if (mapExtent.ymin - MERCATOR_MIN_Y < -1)
				{
					mapExtent.ymin = MERCATOR_MIN_Y;
					mapExtent.ymax = MERCATOR_MIN_Y + mapHeight;
					recenterMap(mapExtent);
				}
			}
		});
	}

	Map.prototype.find = async function(queryGeometry, layerInstances = null, searchScaleFactor = 1000)
	{
		if (layerInstances === null) {
			layerInstances = this.mapLayerInstances;
		}

		let spatialQueryGeometry = queryGeometry, findFeatureResults = [];
		if (queryGeometry && queryGeometry.type === GEOMETRY_TYPE.POINT)
		{
			// use event extent to check the clicked graphic
			const queryDistance = this.getScale() / searchScaleFactor;
			spatialQueryGeometry = TF.GIS.GeometryHelper.ComputeGeodesicBuffer(queryGeometry, queryDistance);
		}

		for (let i = 0; i < layerInstances.length; i++)
		{
			const layerInstance = layerInstances[i];
			const features = await layerInstance.queryFeatures(spatialQueryGeometry);
			findFeatureResults = findFeatureResults.concat(features);
		}

		return Promise.resolve(findFeatureResults);
	}

	Map.prototype.findFeaturesByHitTest = async function(event, layerId = null)
	{
		const response = await this.hitTest(event);
		const graphics = response?.results?.map(item => item.graphic) || [];
		if (graphics.length === 0 || layerId === null)
		{
			return graphics;
		}
		
		const layerFeatures = graphics.filter(item => item.layer.id === layerId);
		return layerFeatures;
	}

	Map.prototype.hitTest = async function(event)
	{
		return this.map.mapView && this.map.mapView.hitTest(event) || null;
	}

	Map.prototype.showPopup = async function({content, location})
	{
		await this.map.mapView.openPopup({content, location});
		return this.map.mapView.popup.container;
	}

	Map.prototype.updatePopup = function(content)
	{
		$(this.map.mapView.popup.container).find(".tfweb-esri-popup-container").parent().html(content);
	}

	Map.prototype.closePopup = function()
	{
		this.map.mapView.popup.close();
	}

	Map.prototype.toMapPoint = function(x, y)
	{
		return this.map.mapView.toMap({ x, y});
	}

	Map.prototype.getMapContainer = function()
	{
		return this.map.mapView.container;
	}

	//#region Map Cursor

	Map.prototype.getMapCursor = function()
	{
		return this.map.mapView.container.style.cursor;
	}

	Map.prototype.setDefaultCursor = function()
	{
		this._setMapCursor(CURSOR_TYPE.DEFAULT);
	}

	Map.prototype.setPointerCursor = function()
	{
		this._setMapCursor(CURSOR_TYPE.POINTER);
	}

	Map.prototype.setCrosshairCursor = function()
	{
		this._setMapCursor(CURSOR_TYPE.CROSSHAIR);
	}

	Map.prototype._setMapCursor = function(cursorType)
	{
		if (this.getMapCursor() === cursorType)
		{
			return;
		}

		const availableCursorTypes = [CURSOR_TYPE.DEFAULT, CURSOR_TYPE.LOCATE_DARK, CURSOR_TYPE.LOCATE_LIGHT, CURSOR_TYPE.PIN, CURSOR_TYPE.POINTER, CURSOR_TYPE.CROSSHAIR];

		$(this.map.mapView.container).removeClass("pin-cursor");

		let cursor = null;
		switch (cursorType)
		{
			case CURSOR_TYPE.LOCATE_DARK:
				cursor = "url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAaCAYAAAC+aNwHAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAABZ0lEQVQ4y5WTMUsDQRCFvztSWBhr8Rek0EqslCg6oAYEwdY6tV1AbASxyd+wsRAECwmMYEArsdLCzk5SexZpJBbZC3tzt3fnwBX75r2ZtztzESZE5BA4AnaBOQePgQFwo6q3Pj/yhAvAFXBAedwBx6r6PSsgIvPAC9CiXnwAa6r6EzvgOiD+dZ+NltMQicgecG8II+AUeHTnLeASWDS8/QbQLRCvquqXh32KyAB4NUW6MdA2BXpGDIDDegZux0DTAyZMxxWKgeOk0YwLSJOSArlcDCTeOQI6JQU6eLsDJDEwNKS+iCxZpcP6Bh5GIrINPJjECDjzim8CF+THuJNu4hOwXnLnqCD3rKob6SOeB+4cBcQzjf8zvQHL1It3VV2B6RTS6NUUZ7gZezVdzLpbB3VdZDi5B6pwkele5KDKRS5XOKKAi1z3kIOQi0JnoSWxLgq7lzmwHf+zIxkXiYgkZZxGRY2TqiZ/HZNl0jX5bvAAAAAASUVORK5CYII=\") 8 24, auto";
				break;
			case CURSOR_TYPE.LOCATE_LIGHT:
				cursor = "url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAaCAYAAAC+aNwHAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAABC0lEQVQ4y5WSMapCQQxFo/xSbAU74a9EEORVrkAQN+Cefq2F4A7cwStcgqBWvkoQj80MDPmTybwLKSZzc3MnGREFYAX8ATfgGeIWciuxAIyBIz6OwFgXj4BLRXHEBRilAieD+A6RwykWLzOXV2ADzEJsQk5jKcAhUzzNzGiaETkI8FDJdWHQa8V9CPBKEh9gUhCYBE7Ea5jjiY1/d0MR6ZLzQESagkATOBGdAHv1rnthiHfF3QswN9a4BX5DbI01zqP62fgsHzW0FOfU3oL+WOg3tj2K29yOmx4C+U1VumjFQqWL0j9xXbTiwXHRuAIFF353x0Vdd8NFfXfDRb/uiUgHdCXOj6Ox85p8Aa3WhV7ZByO1AAAAAElFTkSuQmCC\") 8 24, auto";
				break;
			case CURSOR_TYPE.PIN:
				cursor = CURSOR_TYPE.PIN;
				$(this.map.mapView.container).addClass("pin-cursor");
				break;
			case CURSOR_TYPE.POINTER:
			case CURSOR_TYPE.CROSSHAIR:
			default:
				cursor = cursorType;
				break;
		}

		this.map.mapView.container.style.cursor = cursor;

		if (availableCursorTypes.indexOf(cursorType) >= 0)
		{
			$(this.map.mapView.container).find(".esri-view-surface[data-interacting='true']").attr("data-interacting", false);
		}
	}

	//#endregion

	Map.prototype.dispose = function()
	{
		const self = this;
		self.removeAllLayers();
		self.destroyMapEvents();

		if (this.map)
		{
			this.map.mapView && this.map.mapView.destroy();
			this.map.destroy && this.map.destroy();
		}
		delete this.fireCustomizedEvent;
	}
})();
