(function()
{
	createNamespace("TF.GIS").Map = Map;

	const MAP_MIN_ZOOM_LEVEL = 3;
	const MAP_MAX_ZOOM_LEVEL = 23;
	const WKID_WEB_MERCATOR = 102100;
	
	const LAYER_TYPE = {
		FEATURE: "feature",
		GRAPHIC: "graphic"
	};

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

	let _map;

	function Map($mapContainer, options)
	{
		this.settings = Object.assign({}, defaultOptions, options);
		this.eventHandler = {
			onMapViewCreatedPromise: null,
			onMapViewDoubleClick: null,
			onMapViewUpdating: null,
		};

		this.create($mapContainer);
	}

	/**
	 * Load Esri js SDK
	 * @returns 
	 */
	Map.LoadResouces = async function()
	{
		Map.resourcesLoadingPromise = Map.resourcesLoadingPromise || new Promise(function(resolve, reject)
		{
			require({}, [
				"esri/Map",
				"esri/Basemap",
				"esri/views/SceneView",
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
				"dijit/registry",
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
				SceneView,
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
				registry,
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
					registry: registry,
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

	Object.defineProperty(Map.prototype, 'map', {
		get() { return _map; },
		enumerable: false,
		configurable: false
	});

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

		_map = map;

		self.createMapEvents();
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
		const map = _map;
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

	Map.prototype.addLayer = function(options, layerType = LAYER_TYPE.GRAPHIC)
	{
		if (_map === null)
		{
			console.warn(`_map is null, return.`);
			return null;
		}

		const defaultOptions = {
			id: options.id || `layerId_${Date.now()}`,
			index: options.index || -1,
			eventHandlers: {
				onLayerCreated: null
			}
		};

		const settings = Object.assign({}, defaultOptions, options);
		let layer = null;
		switch (layerType)
		{
			case LAYER_TYPE.GRAPHIC:
				layer = new TF.GIS.SDK.GraphicsLayer({ id: settings.id });
				break;
			case LAYER_TYPE.FEATURE:
				layer = new TF.GIS.SDK.FeatureLayer({ ...settings });
				break;
			default:
				console.warn(`Undefined layerType: ${layerType}, create layer failed.`);
				break;
		}

		if (layer === null)
		{
			return null;
		}

		if (settings.eventHandlers.onLayerCreated)
		{
			_map.mapView.whenLayerView(layer).then((result) => settings.eventHandlers.onLayerCreated.call(result));
		}

		if (settings.index >= 0)
		{
			_map.add(layer, settings.index);
		}
		else
		{
			_map.add(layer);
		}

		return layer;
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

		_map.remove(layer);
	}

	Map.prototype.removeAllLayers = function()
	{
		if (_map)
		{
			_map.removeAll();
		}
	}

	Map.prototype.getMapLayer = function(layerId)
	{
		if (_map === null)
		{
			console.warn(`_map is null, return.`);
			return null;
		}

		const layer = _map.findLayerById(layerId);
		if (!layer) {
			console.warn(`Could not find the layer id = ${layerId}`);
			return null;
		}
	
		return layer;
	}

	Map.prototype.getMapLayers = function()
	{
		if (_map)
		{
			return _map.layers;
		}

		return null;
	}

	Map.prototype.dispose = function()
	{
		const self = this;
		self.removeAllLayers();

		if (_map && _map.mapView)
		{
			_map.mapView.destroy();
		}

		_map = null;
	}
})();
