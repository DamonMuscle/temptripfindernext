(function()
{
	// the base class of map
	createNamespace("TF.Map").BaseMap = BaseMap;

	function BaseMap()
	{
		var self = this;
		self.ArcGIS = tf.map ? tf.map.ArcGIS : null;  // the reference of esri api for js
		self.map = null;
		self._status = {
			SUCCESS: "SUCCESS",
			CALCELLED: "CALCELLED"
		};
	}

	/**
	* Loading esri js api.
	*/
	BaseMap.prototype.usingArcGIS = function(extrasLocation)
	{
		var self = this;
		return new Promise(function(resolve, reject)
		{
			require({
				packages: [{
					name: "extras",
					location: extrasLocation
				}]
			}, [
				"esri/Map",
				"esri/Basemap",
				// "esri/views/SceneView",
				"esri/views/MapView",
				// "esri/views/2d/mapViewDeps",
				// "esri/views/2d/layers/VectorTileLayerView2D",
				// "esri/views/2d/layers/GraphicsLayerView2D",
				// "esri/views/2d/layers/FeatureLayerView2D",
				"esri/layers/GraphicsLayer",
				// "esri/layers/MapImageLayer",
				"esri/Graphic",
				// "esri/geometry/SpatialReference",
				// "esri/layers/FeatureLayer",
				// "esri/request",
				// "esri/config",
				"esri/Color",
				// "esri/symbols/Font",
				"esri/symbols/PictureMarkerSymbol",
				"esri/symbols/SimpleFillSymbol",
				"esri/symbols/SimpleLineSymbol",
				"esri/symbols/SimpleMarkerSymbol",
				// "esri/symbols/TextSymbol",
				// "esri/widgets/BasemapGallery",
				// "esri/widgets/Directions",
				// "esri/widgets/Search",
				// "esri/widgets/Search/SearchViewModel",
				"esri/geometry/Extent",
				"esri/geometry/Point",
				"esri/geometry/Polygon",
				"esri/geometry/Circle",
				"esri/geometry/Polyline",
				// "esri/geometry/Multipoint",
				"esri/geometry/support/webMercatorUtils",
				// "esri/views/2d/draw/Draw",
				// "esri/tasks/Geoprocessor",
				// "esri/tasks/support/FeatureSet",
				// "esri/tasks/support/DirectionsFeatureSet",
				// "esri/tasks/ServiceAreaTask",
				// "esri/tasks/support/ServiceAreaParameters",
				// "esri/tasks/support/RelationshipQuery",
				// "esri/tasks/Locator",
				// "esri/tasks/GeometryService",
				// "esri/tasks/support/ProjectParameters",
				// "esri/core/watchUtils",
				"esri/tasks/support/Query",
				// "esri/geometry/Geometry",
				// "esri/geometry/geometryEngine",
				"esri/widgets/Sketch/SketchViewModel",
				// "esri/core/accessorSupport/decorators",
				// "esri/core/Evented",
				// "esri/core/Accessor",
				// "esri/core/lang",
				// "esri/core/maybe",
				// "esri/identity/IdentityManager",
				// "esri/tasks/RouteTask",
				// "esri/tasks/support/RouteParameters",
				"esri/layers/TileLayer",
				// "esri/layers/WMSLayer",
				// "esri/layers/WMTSLayer",
				"esri/layers/VectorTileLayer",
				// "esri/layers/CSVLayer",
				// "esri/layers/KMLLayer",
				// "esri/layers/GeoRSSLayer",
				// "esri/layers/ImageryLayer",
				// "esri/tasks/QueryTask",
				// "esri/tasks/FindTask",
				// "esri/tasks/support/FindParameters",
				// "esri/views/draw/support/GraphicMover",
				// "esri/views/draw/support/drawUtils",
				// "esri/views/draw/support/input/GraphicMoverEvents",
				// "esri/views/draw/PolylineDrawAction",
				// "esri/views/draw/PolygonDrawAction",
				// "esri/widgets/Popup",
				// "esri/PopupTemplate",
				// "esri/views/2d/engine/vectorTiles/VectorTile",
				// "esri/core/workers/RemoteClient",
				"esri/layers/support/TileInfo",
				// "dijit/registry",
				"dojo/_base/Color",
				// "dojo/_base/lang",
				// "dojo/dom-construct",
				// "extras/FlareClusterLayer",
				// "esri/renderers/ClassBreaksRenderer",
				// "esri/symbols/CIMSymbol",
				"esri/views/draw/support/settings"
			], function(
				EsriMap,
				Basemap,
				// SceneView,
				MapView,
				// mapViewDeps,
				// VectorTileLayerView2D,
				// GraphicsLayerView2D,
				// FeatureLayerView2D,
				GraphicsLayer,
				// MapImageLayer,
				Graphic,
				// SpatialReference,
				// FeatureLayer,
				// esriRequest,
				// esriConfig,
				Color,
				// Font,
				PictureMarkerSymbol,
				SimpleFillSymbol,
				SimpleLineSymbol,
				SimpleMarkerSymbol,
				// TextSymbol,
				// BasemapGallery,
				// Directions,
				// Search,
				// SearchViewModel,
				Extent,
				Point,
				Polygon,
				Circle,
				Polyline,
				// Multipoint,
				webMercatorUtils,
				// Draw,
				// Geoprocessor,
				// FeatureSet,
				// DirectionsFeatureSet,
				// ServiceAreaTask,
				// ServiceAreaParameters,
				// RelationshipQuery,
				// Locator,
				// GeometryService,
				// ProjectParameters,
				// watchUtils,
				Query,
				// Geometry,
				// geometryEngine,
				SketchViewModel,
				// decorators,
				// Evented,
				// Accessor,
				// coreLang,
				// maybe,
				// IdentityManager,
				// RouteTask,
				// RouteParameters,
				TileLayer,
				// WMSLayer,
				// WMTSLayer,
				VectorTileLayer,
				// CSVLayer,
				// KMLLayer,
				// GeoRSSLayer,
				// ImageryLayer,
				// QueryTask,
				// FindTask,
				// FindParameters,
				// GraphicMover,
				// drawUtils,
				// GraphicMoverEvents,
				// PolylineDrawAction,
				// PolygonDrawAction,
				// Popup,
				// PopupTemplate,
				// VectorTile,
				// RemoteClient,
				TileInfo,
				// registry,
				color,
				// lang,
				// domConstruct,
				// FlareClusterLayer,
				// ClassBreaksRenderer,
				// CIMSymbol,
				settings
			)
			{
				self.ArcGIS = {
					Color: Color,
					Map: EsriMap,
					Basemap: Basemap,
					MapView: MapView,
					// mapViewDeps: mapViewDeps,
					// VectorTileLayerView2D: VectorTileLayerView2D,
					// GraphicsLayerView2D: GraphicsLayerView2D,
					// FeatureLayerView2D: FeatureLayerView2D,
					// FeatureLayer: FeatureLayer,
					SimpleMarkerSymbol: SimpleMarkerSymbol,
					SimpleLineSymbol: SimpleLineSymbol,
					// BasemapGallery: BasemapGallery,
					// registry: registry,
					GraphicsLayer: GraphicsLayer,
					// MapImageLayer: MapImageLayer,
					// SpatialReference: SpatialReference,
					Graphic: Graphic,
					// Font: Font,
					PictureMarkerSymbol: PictureMarkerSymbol,
					SimpleFillSymbol: SimpleFillSymbol,
					// TextSymbol: TextSymbol,
					// Directions: Directions,
					// Search: Search,
					Extent: Extent,
					Point: Point,
					Polygon: Polygon,
					Circle: Circle,
					Polyline: Polyline,
					// Multipoint: Multipoint,
					webMercatorUtils: webMercatorUtils,
					// Draw: Draw,
					// Geoprocessor: Geoprocessor,
					// FeatureSet: FeatureSet,
					// DirectionsFeatureSet: DirectionsFeatureSet,
					// ServiceAreaTask: ServiceAreaTask,
					// ServiceAreaParameters: ServiceAreaParameters,
					// RelationshipQuery: RelationshipQuery,
					// Locator: Locator,
					// ProjectParameters: ProjectParameters,
					// GeometryService: GeometryService,
					// watchUtils: watchUtils,
					Query: Query,
					// Geometry: Geometry,
					// geometryEngine: geometryEngine,
					SketchViewModel: SketchViewModel,
					// RouteTask: RouteTask,
					// RouteParameters: RouteParameters,
					// esriRequest: esriRequest,
					// esriConfig: esriConfig,
					TileLayer: TileLayer,
					// WMSLayer: WMSLayer,
					// WMTSLayer: WMTSLayer,
					VectorTileLayer: VectorTileLayer,
					// CSVLayer: CSVLayer,
					// KMLLayer: KMLLayer,
					// GeoRSSLayer: GeoRSSLayer,
					// ImageryLayer: ImageryLayer,
					// QueryTask: QueryTask,
					// FindParameters: FindParameters,
					// FindTask: FindTask,
					// IdentityManager: IdentityManager,
					// domConstruct: domConstruct,
					// Popup: Popup,
					// PopupTemplate: PopupTemplate,
					// VectorTile: VectorTile,
					TileInfo: TileInfo,
					// FlareClusterLayer: FlareClusterLayer.FlareClusterLayer,
					// ClassBreaksRenderer: ClassBreaksRenderer,
					// CIMSymbol: CIMSymbol,
					settings: settings,
					dojo: {
						color: color,
						// lang: lang
					}
				};
				this._hackEditingSymbol(settings);
				this._hackSketchSymbol(SketchViewModel);
				this._disableZoomOutHTML();
				resolve();
			}.bind(self));
		});
	};

	/**
	* hack search to fix reverse geocode N\A bug for ES API 4.14
	*/
	BaseMap.prototype._hackSearch = function(Search)
	{
		Search.prototype.search = function(param)
		{
			var b = this;
			this.activeMenu = "none";
			this._cancelSuggest();
			return this.viewModel.search(param).catch(function(ex)
			{
				b.activeMenu = "none";
				return ex
			}).then(function(ret)
			{
				b.activeMenu = ret.numResults ? "none" : "warning";
				return ret
			})
		}
	}

	/**
	* hack sketchviewmodel to customize the symbol when move stop location for tripstop RW-17222
	*/
	BaseMap.prototype._hackSketchSymbol = function(SketchViewModel)
	{
		SketchViewModel.prototype._getSymbolForClone = function(a)
		{
			if (a.symbol == null)
			{
				return null;
			}
			switch (a.symbol.type)
			{
				case "cim":
					return new tf.map.ArcGIS.SimpleMarkerSymbol({
						style: "circle",
						size: 12,
						color: [0, 0, 0, 0],
						outline: {
							color: [255, 127, 0, 1],
							width: 1
						}
					});
				case "picture-marker":
					{
						const { xoffset: b, yoffset: c, height: d, width: g } = a.symbol;
						return new tf.map.ArcGIS.SimpleMarkerSymbol({
							xoffset: b,
							yoffset: c,
							size: d === g ? g : Math.max(d, g),
							style: "square",
							color: [0, 0, 0, 0],
							outline: {
								color: [255, 127, 0, 0],
								width: 1
							}
						})
					}
				case "simple-marker":
					{
						const { xoffset: b, yoffset: c, size: d, style: g } = a.symbol;
						return new tf.map.ArcGIS.SimpleMarkerSymbol({
							xoffset: b,
							yoffset: c,
							style: "circle" === g ? "circle" : "square",
							size: d + 2,
							color: [0, 0, 0, 0],
							outline: {
								color: [255, 127, 0, 1],
								width: 1
							}
						})
					}
				case "simple-fill":
					return new tf.map.ArcGIS.SimpleFillSymbol({
						color: [0, 0, 0, 0],
						outline: {
							style: "dash",
							color: [255, 127, 0, 1],
							width: 1
						}
					});
				case "simple-line":
					return new tf.map.ArcGIS.SimpleLineSymbol({
						color: [255, 127, 0, 1],
						style: "dash",
						width: 1
					});
				case "text":
					{
						const { xoffset: b, yoffset: c } = a.symbol;
						return new tf.map.ArcGIS.SimpleMarkerSymbol({
							xoffset: b,
							yoffset: c,
							size: 12,
							color: [0, 0, 0, 0],
							outline: {
								color: [255, 127, 0, 1],
								width: 1
							}
						})
					}
				default:
					return null
			}
		}
	}
	/**
	* hack JS API settings to customize the symbol when transform and reshape RW-17074
	*/
	BaseMap.prototype._hackEditingSymbol = function(Settings)
	{
		//overwrite js api 4.18 color from orange to blue(same as js api 4.14)
		var blue = { r: 34, g: 205, b: 255, a: 1 },
			darkblue = { r: 0, g: 51, b: 204, a: 1 },
			grey = { r: 200, g: 200, b: 200, a: 1 },
			darkgrey = { r: 93, g: 93, b: 93, a: 1 };
		var reshapeVertex = Settings.settings.reshapeGraphics.vertex,
			reshapeMidPoint = Settings.settings.reshapeGraphics.midpoint,
			transformLine = Settings.settings.transformGraphics.line,
			transformFill = Settings.settings.transformGraphics.fill,
			transformVertex = Settings.settings.transformGraphics.vertex;
		Settings.colors.main = blue;
		Settings.colors.secondary = blue;
		reshapeVertex.color = blue;
		reshapeVertex.outlineColor = darkblue;
		reshapeVertex.hoverColor = blue;
		reshapeVertex.hoverOutlineColor = darkblue;
		reshapeVertex.size = 7;
		reshapeMidPoint.color = grey;
		reshapeMidPoint.outlineColor = darkgrey;
		reshapeMidPoint.hoverColor = blue;
		reshapeMidPoint.size = 7;
		transformFill.hoverOutlineColor = darkblue;
		transformFill.outlineColor = darkblue;
		transformLine.color = darkblue;
		transformLine.hoverColor = darkblue;
		transformVertex.outlineColor = darkblue;
	}

	BaseMap.prototype._disableZoomOutHTML = function()
	{
		document.addEventListener("touchmove", function(event)
		{
			if (event.scale !== 1)
			{
				event.preventDefault();
			}
		}, false);
	}

	/**
	* Release resources.
	*/
	BaseMap.prototype.dispose = function()
	{
		this.map.removeAllLayers();
		this.map.destroy();

		// release the objects
		for (var i in this)
		{
			this[i] = null;
		}
	};

})();
