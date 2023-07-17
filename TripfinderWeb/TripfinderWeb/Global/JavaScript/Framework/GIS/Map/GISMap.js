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
			onMapViewClick: null,
			onMapViewDoubleClick: null,
			onMapViewPointerMove: null,
			onMapViewUpdated: null,
			onMapViewUpdating: null,
			onMapViewExtentChanges: null,
		}
	};

	function Map($mapContainer, options)
	{
		this.settings = Object.assign({}, defaultOptions, options);
		this.eventHandler = {
			onMapViewCreatedPromise: null,
			onMapViewClick: null,
			onMapViewDoubleClick: null,
			onMapViewPointerMove: null,
			onMapViewUpdated: null,
			onMapViewUpdating: null,
			onMapViewExtentChanges: null,
		};

		this.defineReadOnlyProperty('mapLayerInstances', []);
		this.defineReadOnlyProperty('LAYER_TYPE', LAYER_TYPE);
		this.defineReadOnlyProperty('GEOMETRY_TYPE', GEOMETRY_TYPE);
		this.defineReadOnlyProperty('WKID_WEB_MERCATOR', WKID_WEB_MERCATOR);
		this.create($mapContainer);
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
				// "esri/views/SceneView",
				"esri/views/MapView",
				"esri/views/2d/mapViewDeps",
				"esri/views/2d/layers/VectorTileLayerView2D",
				"esri/views/2d/layers/GraphicsLayerView2D",
				"esri/views/2d/layers/FeatureLayerView2D",
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
				"esri/widgets/Search/SearchViewModel",
				"esri/geometry/Extent",
				"esri/geometry/Point",
				"esri/geometry/Polygon",
				"esri/geometry/Circle",
				"esri/geometry/Polyline",
				"esri/geometry/Multipoint",
				"esri/geometry/support/webMercatorUtils",
				"esri/views/2d/draw/Draw",
				"esri/tasks/Geoprocessor",
				"esri/tasks/support/FeatureSet",
				"esri/tasks/support/DirectionsFeatureSet",
				"esri/tasks/ServiceAreaTask",
				"esri/tasks/support/ServiceAreaParameters",
				"esri/tasks/support/RelationshipQuery",
				"esri/tasks/Locator",
				"esri/tasks/GeometryService",
				"esri/tasks/support/ProjectParameters",
				"esri/core/watchUtils",
				"esri/tasks/support/Query",
				"esri/geometry/Geometry",
				"esri/geometry/geometryEngine",
				"esri/widgets/Sketch/SketchViewModel",
				"esri/core/accessorSupport/decorators",
				"esri/core/Evented",
				"esri/core/Accessor",
				"esri/core/lang",
				"esri/core/maybe",
				"esri/identity/IdentityManager",
				"esri/tasks/RouteTask",
				"esri/tasks/support/RouteParameters",
				"esri/layers/TileLayer",
				"esri/layers/WMSLayer",
				"esri/layers/WMTSLayer",
				"esri/layers/VectorTileLayer",
				"esri/layers/CSVLayer",
				"esri/layers/KMLLayer",
				"esri/layers/GeoRSSLayer",
				"esri/layers/ImageryLayer",
				"esri/tasks/QueryTask",
				"esri/tasks/FindTask",
				"esri/tasks/support/FindParameters",
				"esri/views/draw/support/GraphicMover",
				"esri/views/draw/support/drawUtils",
				"esri/views/draw/support/input/GraphicMoverEvents",
				"esri/views/draw/PolylineDrawAction",
				"esri/views/draw/PolygonDrawAction",
				"esri/widgets/Popup",
				"esri/PopupTemplate",
				"esri/views/2d/engine/vectorTiles/VectorTile",
				"esri/core/workers/RemoteClient",
				"esri/layers/support/TileInfo",
				// "dijit/registry",
				"dojo/_base/Color",
				"dojo/_base/lang",
				"dojo/dom-construct",
				// "extras/FlareClusterLayer",
				"esri/renderers/ClassBreaksRenderer",
				"esri/symbols/CIMSymbol",
				"esri/views/draw/support/settings",
				"esri/geometry/support/geodesicUtils"
			], function(
				EsriMap,
				Basemap,
				// SceneView,
				MapView,
				mapViewDeps,
				VectorTileLayerView2D,
				GraphicsLayerView2D,
				FeatureLayerView2D,
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
				SearchViewModel,
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
				ServiceAreaTask,
				ServiceAreaParameters,
				RelationshipQuery,
				Locator,
				GeometryService,
				ProjectParameters,
				watchUtils,
				Query,
				Geometry,
				geometryEngine,
				SketchViewModel,
				decorators,
				Evented,
				Accessor,
				coreLang,
				maybe,
				IdentityManager,
				RouteTask,
				RouteParameters,
				TileLayer,
				WMSLayer,
				WMTSLayer,
				VectorTileLayer,
				CSVLayer,
				KMLLayer,
				GeoRSSLayer,
				ImageryLayer,
				QueryTask,
				FindTask,
				FindParameters,
				GraphicMover,
				drawUtils,
				GraphicMoverEvents,
				PolylineDrawAction,
				PolygonDrawAction,
				Popup,
				PopupTemplate,
				VectorTile,
				RemoteClient,
				TileInfo,
				// registry,
				color,
				lang,
				domConstruct,
				// FlareClusterLayer,
				ClassBreaksRenderer,
				CIMSymbol,
				settings,
				geodesicUtils
			)
			{
				createNamespace("TF.GIS").SDK = {
					Color: Color,
					Map: EsriMap,
					Basemap: Basemap,
					MapView: MapView,
					mapViewDeps: mapViewDeps,
					VectorTileLayerView2D: VectorTileLayerView2D,
					GraphicsLayerView2D: GraphicsLayerView2D,
					FeatureLayerView2D: FeatureLayerView2D,
					FeatureLayer: FeatureLayer,
					SimpleMarkerSymbol: SimpleMarkerSymbol,
					SimpleLineSymbol: SimpleLineSymbol,
					BasemapGallery: BasemapGallery,
					// registry: registry,
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
					ServiceAreaTask: ServiceAreaTask,
					ServiceAreaParameters: ServiceAreaParameters,
					RelationshipQuery: RelationshipQuery,
					Locator: Locator,
					ProjectParameters: ProjectParameters,
					GeometryService: GeometryService,
					watchUtils: watchUtils,
					Query: Query,
					Geometry: Geometry,
					geometryEngine: geometryEngine,
					SketchViewModel: SketchViewModel,
					RouteTask: RouteTask,
					RouteParameters: RouteParameters,
					esriRequest: esriRequest,
					esriConfig: esriConfig,
					TileLayer: TileLayer,
					WMSLayer: WMSLayer,
					WMTSLayer: WMTSLayer,
					VectorTileLayer: VectorTileLayer,
					CSVLayer: CSVLayer,
					KMLLayer: KMLLayer,
					GeoRSSLayer: GeoRSSLayer,
					ImageryLayer: ImageryLayer,
					QueryTask: QueryTask,
					FindParameters: FindParameters,
					FindTask: FindTask,
					IdentityManager: IdentityManager,
					domConstruct: domConstruct,
					Popup: Popup,
					PopupTemplate: PopupTemplate,
					VectorTile: VectorTile,
					TileInfo: TileInfo,
					// FlareClusterLayer: FlareClusterLayer.FlareClusterLayer,
					ClassBreaksRenderer: ClassBreaksRenderer,
					CIMSymbol: CIMSymbol,
					settings: settings,
					geodesicUtils: geodesicUtils,
					dojo: {
						color: color,
						lang: lang
					}
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

	Map.prototype.defineReadOnlyProperty = function(propertyName, value)
	{
		Object.defineProperty(this, propertyName, {
			get() { return value; },
			enumerable: false,
			configurable: false
		});
	};

	Map.prototype.createMapEvents = function()
	{
		const self = this, mapView = self.map.mapView;
		if (self.settings.eventHandlers.onMapViewClick)
		{
			self.eventHandler.onMapViewClick = mapView.on("click", self.settings.eventHandlers.onMapViewClick);
		}

		if (self.settings.eventHandlers.onMapViewDoubleClick)
		{
			self.eventHandler.onMapViewDoubleClick = mapView.on("double-click", self.settings.eventHandlers.onMapViewDoubleClick);
		}

		if (self.settings.eventHandlers.onMapViewUpdating)
		{
			self.eventHandler.onMapViewUpdating = mapView.watch('updating', self.settings.eventHandlers.onMapViewUpdating);
		}

		if (self.settings.eventHandlers.onMapViewUpdated)
		{
			self.eventHandler.onMapViewUpdated = TF.GIS.SDK.watchUtils.whenFalseOnce(mapView, "updating", self.settings.eventHandlers.onMapViewUpdated);
		}

		if (self.settings.eventHandlers.onMapViewPointerMove)
		{
			self.eventHandler.onMapViewPointerMove = mapView.on('pointer-move', self.settings.eventHandlers.onMapViewPointerMove);
		}

		if (self.settings.eventHandlers.onMapViewCreated)
		{
			self.eventHandler.onMapViewCreatedPromise = mapView.when(self.settings.eventHandlers.onMapViewCreated);
		}

		if (self.settings.eventHandlers.onMapViewExtentChanges)
		{
			self.eventHandler.onMapViewExtentChanges = mapView.watch('extent', self.settings.eventHandlers.onMapViewExtentChanges);
		}
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
	}

	Map.prototype.setMapCursor = function(cursorType)
	{
		const availableCursorTypes = ["default", "locate", "locate-white", "pin", "pointer"];

		$(this.map.mapView.container).removeClass("pin-cursor");

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
				$(this.map.mapView.container).addClass("pin-cursor");
				break;
			case "pointer":
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
		const point = TF.GIS.SDK.webMercatorUtils.geographicToWebMercator(new TF.GIS.SDK.Point({ x: longitude, y: latitude }));
		this.centerAtPoint(point);
	}

	Map.prototype.centerAtPoint = function(point)
	{
		this.map.mapView.center = point;
	}

	Map.prototype.setExtent = async function(target)
	{
		await this.map.mapView.goTo(target, { duration: 0, easing: "linear" });
	}

	Map.prototype.centerAndZoom = function(longitude, latitude, scale)
	{
		const point = TF.GIS.SDK.webMercatorUtils.geographicToWebMercator(new TF.GIS.SDK.Point({ x: longitude, y: latitude }));
		this.centerAtPoint(point);

		this.map.mapView.scale = scale;
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
				await self.setExtent(extent);
			}, 50);
		}

		const resetMapExtent = async () =>
		{
			const MERCATOR_MAX_Y = 19972000, MERCATOR_MIN_Y = -19972000, mapExtent = this.map.mapView.extent;

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
		}

		this.map.mapView.watch("extent", async function(value)
		{
			resetMapExtent();
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
			const queryDistance = this.map.mapView.scale / searchScaleFactor;
			spatialQueryGeometry = TF.GIS.SDK.geometryEngine.geodesicBuffer(queryGeometry, queryDistance, "meters");
		}

		for (let i = 0; i < layerInstances.length; i++)
		{
			const layerInstance = layerInstances[i];
			const features = await layerInstance.queryFeatures(spatialQueryGeometry);
			findFeatureResults = findFeatureResults.concat(features);
		}

		return Promise.resolve(findFeatureResults);
	}

	Map.prototype.hitTest = async function(event)
	{
		return this.map.mapView && this.map.mapView.hitTest(event) || null;
	}

	Map.prototype.showPopup = function({content, location})
	{
		this.map.mapView.popup.open({content, location});
		return this.map.mapView.popup.container;
	}

	Map.prototype.updatePopup = function(content)
	{
		$(this.map.mapView.popup.container).find("article>div").html(content);
	}

	Map.prototype.closePopup = function()
	{
		this.map.mapView.popup.close();
	}

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
	}
})();
