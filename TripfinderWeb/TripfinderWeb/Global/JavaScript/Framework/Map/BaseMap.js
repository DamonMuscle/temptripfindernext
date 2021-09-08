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
		var promise = new Promise(function(resolve, reject)
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
				Map,
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
					Map: Map,
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
				// self.ArcGIS.esriConfig.request.timeout = 480000;//milliseconds
				// // hackVectorTile(VectorTile);
				// // hackFeatureLayerView2D(FeatureLayerView2D);
				// // hackRemoteClient(RemoteClient);
				//this._hackdeclared(dojo1);
				//this._hackGraphicProcessingQueue(RenderingCore2D);
				// this._hackGraphicMover(GraphicMover, GraphicMoverEvents);
				//this._hackDragHandler(GraphicMover, GraphicMoverEvents, drawUtils, coreLang);
				// this._hackPolylineVertexAddHandler(PolylineDrawAction, maybe);
				// this._hackPolygonVertexAddHandler(PolygonDrawAction, maybe);
				// this._hackSuggest(SearchViewModusingArcGISel);
				// this._hackSearch(Search);
				// hackGeometryEngine(geometryEngine);
				this._hackEditingSymbol(settings);
				this._hackSketchSymbol(SketchViewModel);
				// this._hackFlareClusterLayer(FlareClusterLayer.FlareClusterLayer);
				this._disableZoomOutHTML();
				resolve();
			}.bind(self));
		});
		return promise;
	};

	// function hackRemoteClient(RemoteClient)
	// {
	// 	TF.smartOverride(RemoteClient.prototype, 'invoke', function(base)
	// 	{
	// 		if (!this._port)
	// 		{
	// 			TF.consoleOutput("error", "RemoteClient _port is null");
	// 			return Promise.resolve();
	// 		}

	// 		arguments = Array.from(arguments);
	// 		arguments.splice(0, 1);
	// 		return base.apply(this, arguments);
	// 	});
	// }

	// function hackFeatureLayerView2D(FeatureLayerView2D)
	// {
	// 	FeatureLayerView2D.prototype._renderingConfigHashChanged = function()
	// 	{
	// 		var a = this;
	// 		this.view.timeline.begin(this.layer.title + " (FeatureLayer) Initial Pipeline Config");
	// 		var b = this._onRenderingConfigChange();
	// 		this._updatingPromise = b;
	// 		var c = function()
	// 		{
	// 			b === a._updatingPromise && a._set("_updatingPipelineConfig", !1);
	// 			if (a.view)
	// 			{
	// 				a.view.timeline.end(a.layer.title + " (FeatureLayer) Initial Pipeline Config");
	// 			}
	// 			else
	// 			{
	// 				TF.consoleOutput("error", "FeatureLayerView2D _renderingConfigHashChanged fails: view is null");
	// 			}
	// 		};
	// 		b.then(c).catch(c);
	// 	};
	// }

	// function hackVectorTile(VectorTile)
	// {
	// 	TF.smartOverride(VectorTile.VectorTile.prototype, 'detach', function(base)
	// 	{
	// 		if (this.client && !this.client._port)
	// 		{
	// 			return;
	// 		}

	// 		base.call(this);
	// 	});
	// }

	// BaseMap.prototype._hackdeclared = function(declared)
	// {
	// 	declared.declared = function(d)
	// 	{
	// 		for (var f = [], h = 1; h < arguments.length; h++)
	// 			f[h - 1] = arguments[h];
	// 		h = function()
	// 		{
	// 			if (this.initss)
	// 			{
	// 				this.initss()
	// 			}
	// 			return this || {}
	// 		};
	// 		h.__bases__ = [d].concat(f);
	// 		return h
	// 	}
	// };

	/**
	* hack search to fix reverse geocode N\A bug for ES API 4.14
	*/
	BaseMap.prototype._hackSearch = function(Search)
	{
		Search.prototype.search = function(a)
		{
			var b = this;
			this.activeMenu = "none";
			this._cancelSuggest();
			return this.viewModel.search(a).catch(function(a)
			{
				b.activeMenu = "none";
				return a
			}).then(function(a)
			{
				b.activeMenu = a.numResults ? "none" : "warning";
				return a
			})
		}
	}

	// function hackGeometryEngine(geometryEngine)
	// {
	// 	TF.smartOverride(geometryEngine, 'union', function(base)
	// 	{
	// 		arguments = Array.from(arguments);
	// 		arguments.splice(0, 1);
	// 		if ($.isArray(arguments[0]))
	// 		{
	// 			if (arguments[0].length == 0)
	// 			{
	// 				return null;
	// 			}
	// 		} else
	// 		{
	// 			if (!arguments[0] && !arguments[1])
	// 			{
	// 				return null
	// 			}
	// 		}
	// 		return base.apply(this, arguments);
	// 	});
	// 	TF.smartOverride(geometryEngine, 'intersect', function(base)
	// 	{
	// 		arguments = Array.from(arguments);
	// 		arguments.splice(0, 1);
	// 		if ($.isArray(arguments[0]))
	// 		{
	// 			if (arguments[0].length == 0)
	// 			{
	// 				return [];
	// 			}
	// 		} else
	// 		{
	// 			if (!arguments[0] || !arguments[1])
	// 			{
	// 				return [null]
	// 			}
	// 		}
	// 		return base.apply(this, arguments);
	// 	});
	// 	TF.smartOverride(geometryEngine, 'intersects', function(base)
	// 	{
	// 		arguments = Array.from(arguments);
	// 		arguments.splice(0, 1);
	// 		if (!arguments[0] || !arguments[1])
	// 		{
	// 			return false
	// 		}
	// 		return base.apply(this, arguments);
	// 	});

	// }

	/**
	* hack sketchviewmodel to customize the symbol when move stop location for tripstop RW-17222
	*/
	BaseMap.prototype._hackSketchSymbol = function(SketchViewModel)
	{
		SketchViewModel.prototype._getSymbolForClone = function(a)
		{
			if (a.symbol == null)
				return null;
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
			if (event.scale !== 1) {
				event.preventDefault();
			}
		}, false);
	}

	/**
	* hack flare cluster layer bug for ES API 4.14
	*/
	// BaseMap.prototype._hackFlareClusterLayer = function(FlareClusterLayer)
	// {
	// 	FlareClusterLayer.prototype._viewPointerMove = function(evt) 
	// 	{
	// 		// Hack code, viewfinder don't need these events.
	// 		var _this = this;
	// 		var mousePos = this._getMousePos(evt);
	// 		// if there's an active cluster and the current screen pos is within the bounds of that cluster's group container, don't do anything more. 
	// 		// TODO: would probably be better to check if the point is in the actual circle of the cluster group and it's flares instead of using the rectanglar bounding box.
	// 		if (this._activeCluster && this._activeCluster.clusterGroup)
	// 		{
	// 			var bbox = this._activeCluster.clusterGroup.rawNode.getBoundingClientRect();
	// 			if (bbox)
	// 			{
	// 				if (mousePos.x >= bbox.left && mousePos.x <= bbox.right && mousePos.y >= bbox.top && mousePos.y <= bbox.bottom)
	// 					return;
	// 			}
	// 		}
	// 		if (!this._activeView.ready)
	// 			return;
	// 		var hitTest = this._activeView.hitTest(mousePos);
	// 		if (!hitTest)
	// 			return;
	// 		hitTest.then(function(response)
	// 		{
	// 			var graphics = response.results;
	// 			if (graphics.length === 0)
	// 			{
	// 				_this._deactivateCluster();
	// 				return;
	// 			}
	// 			for (var i = 0, len = graphics.length; i < len; i++)
	// 			{
	// 				var g = graphics[i].graphic;
	// 				// The code 'g.layer.id == _this.id' was added code
	// 				if (g && g.layer && g.layer.id == _this.id && (g.attributes.clusterId != null && !g.attributes.isClusterArea))
	// 				{
	// 					var cluster = _this._clusters[g.attributes.clusterId];
	// 					_this._activateCluster(cluster);
	// 					return;
	// 				}
	// 				else
	// 				{
	// 					_this._deactivateCluster();
	// 				}
	// 			}
	// 		});
	// 	}

	// 	var Cluster = /** @class */ (function()
	// 	{
	// 		function Cluster()
	// 		{
	// 		}
	// 		return Cluster;
	// 	}());

	// 	FlareClusterLayer.prototype._createSingle = function(obj)
	// 	{
	// 		var point = new tf.map.ArcGIS.Point({
	// 			// Hack code, fixed the code bug, the point maybe different spatial reference
	// 			x: obj[this.xPropertyName], y: obj[this.yPropertyName], z: obj[this.zPropertyName], spatialReference: this.spatialReference
	// 		});
	// 		if (!point.spatialReference.isWebMercator)
	// 		{
	// 			point = webMercatorUtils.geographicToWebMercator(point);
	// 		}
	// 		var graphic = new tf.map.ArcGIS.Graphic({
	// 			geometry: point,
	// 			attributes: obj
	// 		});
	// 		graphic.popupTemplate = this.singlePopupTemplate;
	// 		if (this.singleRenderer)
	// 		{
	// 			var symbol = this.singleRenderer.getSymbol(graphic, this._activeView);
	// 			graphic.symbol = symbol;
	// 		}
	// 		else if (this.singleSymbol)
	// 		{
	// 			graphic.symbol = this.singleSymbol;
	// 		}
	// 		else
	// 		{
	// 			// no symbology for singles defined, use the default symbol from the cluster renderer
	// 			graphic.symbol = this.clusterRenderer.defaultSymbol;
	// 		}
	// 		this.add(graphic);
	// 	};

	// 	// Hack code, new cluster symbol logic, merge the text symbol and old cluster symbol to new cluster symbol(CIMSymbol).
	// 	FlareClusterLayer.prototype._createClusterSymbol = function(clusterSymbol, textSymbol, clusterCount)
	// 	{
	// 		let circle = {
	// 			frame: { xmin: 0.0, ymin: 0.0, xmax: 17.0, ymax: 17.0 },
	// 			rings: [
	// 				[
	// 					[8.5, 0.2],
	// 					[7.06, 0.33],
	// 					[5.66, 0.7],
	// 					[4.35, 1.31],
	// 					[3.16, 2.14],
	// 					[2.14, 3.16],
	// 					[1.31, 4.35],
	// 					[0.7, 5.66],
	// 					[0.33, 7.06],
	// 					[0.2, 8.5],
	// 					[0.33, 9.94],
	// 					[0.7, 11.34],
	// 					[1.31, 12.65],
	// 					[2.14, 13.84],
	// 					[3.16, 14.86],
	// 					[4.35, 15.69],
	// 					[5.66, 16.3],
	// 					[7.06, 16.67],
	// 					[8.5, 16.8],
	// 					[9.94, 16.67],
	// 					[11.34, 16.3],
	// 					[12.65, 15.69],
	// 					[13.84, 14.86],
	// 					[14.86, 13.84],
	// 					[15.69, 12.65],
	// 					[16.3, 11.34],
	// 					[16.67, 9.94],
	// 					[16.8, 8.5],
	// 					[16.67, 7.06],
	// 					[16.3, 5.66],
	// 					[15.69, 4.35],
	// 					[14.86, 3.16],
	// 					[13.84, 2.14],
	// 					[12.65, 1.31],
	// 					[11.34, 0.7],
	// 					[9.94, 0.33],
	// 					[8.5, 0.2]
	// 				]
	// 			]
	// 		};
	// 		let color = clusterSymbol.color, outlineColor = clusterSymbol.outline.color, textFont = textSymbol.font, textColor = textSymbol.color;
	// 		return {
	// 			type: "cim",
	// 			data: {
	// 				type: "CIMSymbolReference",
	// 				symbol: {
	// 					type: "CIMPointSymbol",
	// 					symbolLayers: [
	// 						{
	// 							type: "CIMVectorMarker",
	// 							enable: true,
	// 							size: textFont.size,
	// 							frame: { xmin: -5, ymin: -5, xmax: 5, ymax: 5 },
	// 							markerGraphics: [
	// 								{
	// 									type: "CIMMarkerGraphic",
	// 									geometry: { x: 0, y: 0 },
	// 									symbol: {
	// 										type: "CIMTextSymbol",
	// 										fontFamilyName: textFont.family,
	// 										fontStyleName: textFont.weight,
	// 										height: 8,
	// 										horizontalAlignment: "Center",
	// 										offsetX: 0,
	// 										offsetY: 0,
	// 										symbol: {
	// 											type: "CIMPolygonSymbol",
	// 											symbolLayers: [
	// 												{
	// 													type: "CIMSolidFill",
	// 													enable: true,
	// 													color: [textColor.r, textColor.g, textColor.b, textColor.a * 255]
	// 												}
	// 											]
	// 										},
	// 										verticalAlignment: "Center"
	// 									},
	// 									textString: clusterCount
	// 								}
	// 							],
	// 							scaleSymbolsProportionally: true,
	// 							respectFrame: true
	// 						},
	// 						{
	// 							type: "CIMVectorMarker",
	// 							enable: true,
	// 							size: clusterSymbol.size,
	// 							frame: circle.frame,
	// 							markerGraphics: [
	// 								{
	// 									type: "CIMMarkerGraphic",
	// 									geometry: {
	// 										rings: circle.rings
	// 									},
	// 									symbol: {
	// 										type: "CIMPolygonSymbol",
	// 										symbolLayers: [
	// 											{
	// 												type: "CIMSolidFill",
	// 												enable: true,
	// 												width: clusterSymbol.size,
	// 												color: [color.r, color.g, color.b, color.a * 255]
	// 											},
	// 											{
	// 												type: "CIMSolidStroke",
	// 												width: clusterSymbol.outline.width * 1.7,
	// 												color: [outlineColor.r, outlineColor.g, outlineColor.b, outlineColor.a * 255]
	// 											}
	// 										]
	// 									}
	// 								}
	// 							],
	// 							scaleSymbolsProportionally: true,
	// 							respectFrame: true
	// 						}
	// 					]
	// 				}
	// 			}
	// 		};
	// 	};

	// 	FlareClusterLayer.prototype._createCluster = function(gridCluster)
	// 	{
	// 		return __awaiter(this, void 0, void 0, function()
	// 		{
	// 			var cluster, point, attributes, cbi, textSymbol, mp, area, areaAttr, areaPoly, _a;
	// 			var _this = this;
	// 			return __generator(this, function(_b)
	// 			{
	// 				switch (_b.label)
	// 				{
	// 					case 0:
	// 						cluster = new Cluster();
	// 						cluster.gridCluster = gridCluster;
	// 						// Hack code, fixed the code bug, the point maybe different spatial reference
	// 						point = new tf.map.ArcGIS.Point({ x: gridCluster.x, y: gridCluster.y, spatialReference: this.spatialReference });
	// 						if (!point.spatialReference.isWebMercator)
	// 						{
	// 							point = tf.map.ArcGIS.webMercatorUtils.geographicToWebMercator(point);
	// 						}
	// 						attributes = {
	// 							x: gridCluster.x,
	// 							y: gridCluster.y,
	// 							clusterCount: gridCluster.clusterCount,
	// 							isCluster: true,
	// 							clusterObject: gridCluster
	// 						};
	// 						cluster.clusterGraphic = new tf.map.ArcGIS.Graphic({
	// 							attributes: attributes,
	// 							geometry: point
	// 						});
	// 						return [4 /*yield*/, this.clusterRenderer.getClassBreakInfo(cluster.clusterGraphic)];
	// 					case 1:
	// 						cbi = _b.sent();
	// 						// Hack code, merge the text symbol and cluster symbol to CIMSymbol
	// 						cluster.clusterGraphic.symbol = this._createClusterSymbol(cbi.symbol, this.textSymbol, gridCluster.clusterCount.toString());
	// 						if (this._is2d && this._activeView.rotation)
	// 						{
	// 							cluster.clusterGraphic.symbol["angle"] = 360 - this._activeView.rotation;
	// 						}
	// 						else
	// 						{
	// 							cluster.clusterGraphic.symbol["angle"] = 0;
	// 						}
	// 						cluster.clusterId = cluster.clusterGraphic["uid"];
	// 						cluster.clusterGraphic.attributes.clusterId = cluster.clusterId;
	// 						if (!(this.clusterAreaDisplay && gridCluster.points && gridCluster.points.length > 0)) return [3 /*break*/, 3];
	// 						// Hack code, fixed the code bug, the point maybe different spatial reference
	// 						mp = new tf.map.ArcGIS.Multipoint({ spatialReference: this.spatialReference });
	// 						mp.points = gridCluster.points;
	// 						area = tf.map.ArcGIS.geometryEngine.convexHull(mp, true);
	// 						areaAttr = {
	// 							x: gridCluster.x,
	// 							y: gridCluster.y,
	// 							clusterCount: gridCluster.clusterCount,
	// 							clusterId: cluster.clusterId,
	// 							isClusterArea: true
	// 						};
	// 						if (!(area.rings && area.rings.length > 0)) return [3 /*break*/, 3];
	// 						// Hack code, fixed the code bug, the point maybe different spatial reference
	// 						areaPoly = new tf.map.ArcGIS.Polygon({ spatialReference: this.spatialReference });
	// 						areaPoly = areaPoly.addRing(area.rings[0]);
	// 						if (!areaPoly.spatialReference.isWebMercator)
	// 						{
	// 							areaPoly = tf.map.ArcGIS.webMercatorUtils.geographicToWebMercator(areaPoly);
	// 						}
	// 						cluster.areaGraphic = new tf.map.ArcGIS.Graphic({ geometry: areaPoly, attributes: areaAttr });
	// 						_a = cluster.areaGraphic;
	// 						return [4 /*yield*/, this.areaRenderer.getClassBreakInfo(cluster.areaGraphic)];
	// 					case 2:
	// 						_a.symbol = (_b.sent()).symbol;
	// 						_b.label = 3;
	// 					case 3:
	// 						// add the graphics in order        
	// 						if (cluster.areaGraphic && this.clusterAreaDisplay === "always")
	// 						{
	// 							this.add(cluster.areaGraphic);
	// 						}
	// 						this.add(cluster.clusterGraphic);
	// 						// Hack code, remove the textGraphic
	// 						this._clusters[cluster.clusterId] = cluster;
	// 						return [2 /*return*/];
	// 				}
	// 			});
	// 		});
	// 	};

	// 	FlareClusterLayer.prototype._scale = function()
	// 	{
	// 		// Hack code, if the map view zoom is 22 or 23, don't cluster.
	// 		if (this._activeView.zoom === 22 || this._activeView.zoom === 23)
	// 		{
	// 			return undefined;
	// 		}

	// 		return this._activeView ? this._activeView.scale : undefined;
	// 	};

	// 	// Hack code, new calculate cluster logic
	// 	FlareClusterLayer.prototype._calculateCluster = function(point, cluster)
	// 	{
	// 		let distance = (
	// 			Math.sqrt(
	// 				Math.pow((cluster.x - point.x), 2) + Math.pow((cluster.y - point.y), 2)
	// 			) / this._clusterResolution
	// 		);

	// 		return (distance <= this.clusterRatio);
	// 	};

	// 	// Hack code, new calculate cluster logic
	// 	FlareClusterLayer.prototype._isSamePoint = function(point, cluster)
	// 	{
	// 		let clusterX = Math.round(cluster.x * 10000) / 10000, clusterY = Math.round(cluster.y * 10000) / 10000,
	// 			pointX = Math.round(point.x * 10000) / 10000, pointY = Math.round(point.y * 10000) / 10000;

	// 		return clusterX === pointX && clusterY === pointY;
	// 	};

	// 	FlareClusterLayer.prototype.draw = function(activeView, drawData)
	// 	{
	// 		var _this = this;
	// 		if (activeView)
	// 		{
	// 			// if we're swapping views from the currently active one, clear the surface object so it get's recreated fresh after the first draw
	// 			if (this._activeView && activeView !== this._activeView)
	// 			{
	// 				this._activeView.fclSurface = null;
	// 			}
	// 			this._activeView = activeView;
	// 		}
	// 		// Not ready to draw yet so queue one up
	// 		if (!this._readyToDraw)
	// 		{
	// 			this._queuedInitialDraw = true;
	// 			return;
	// 		}

	// 		// Hack code, don't redraw the layer when drag the map
	// 		if (!drawData && (this._PrevViewZoom && this._PrevViewZoom === this._activeView.zoom))
	// 		{
	// 			return;
	// 		}
	// 		else
	// 		{
	// 			this._PrevViewZoom = this._activeView.zoom;
	// 			// Get the map resolution in current zoom
	// 			this._clusterResolution = this._activeView.extent.width / this._activeView.width;
	// 		}

	// 		var currentExtent = this._extent();
	// 		if (!this._activeView || !this._data || !currentExtent)
	// 			return;
	// 		this._is2d = this._activeView.type === "2d";
	// 		// check for required renderer
	// 		if (!this.clusterRenderer)
	// 		{
	// 			console.error("FlareClusterLayer: clusterRenderer must be set.");
	// 		}
	// 		// check to make sure we have an area renderer set if one needs to be
	// 		if (this.clusterAreaDisplay && !this.areaRenderer)
	// 		{
	// 			console.error("FlareClusterLayer: areaRenderer must be set if clusterAreaDisplay is set.");
	// 			return;
	// 		}
	// 		this.clear();

	// 		let dataLength = this._data.length

	// 		// console.time("draw-data-" + this._activeView.type);
	// 		this._isClustered = this.clusterToScale < this._scale() && this.clusterMinCount <= dataLength;

	// 		// Hack code, change the logic for draw cluster graphic and single graphic.
	// 		// Step 1. Check point is near the exsit clusters.
	// 		// Step 2. If yes, add point into exsit cluster, re-calculate the cluster x, y and extent; if no, create a new cluster then add point in it.
	// 		// Step 3. Darw these cluster graphic and single graphic
	// 		// TODO, use feature layer not graphic layer
	// 		let gridClusters = [];
	// 		let web, obj, xVal, yVal;
	// 		for (let i = 0; i < dataLength; i++)
	// 		{
	// 			obj = this._data[i];
	// 			// check if filters are specified and continue if this object doesn't pass
	// 			if (!this._passesFilter(obj))
	// 			{
	// 				continue;
	// 			}

	// 			if (this._isClustered)
	// 			{
	// 				if (this.spatialReference.isWebMercator)
	// 				{
	// 					web = [obj[this.xPropertyName], obj[this.yPropertyName]];
	// 				}
	// 				else
	// 				{
	// 					web = tf.map.ArcGIS.webMercatorUtils.lngLatToXY([obj[this.xPropertyName], obj[this.yPropertyName]]);
	// 				}

	// 				xVal = web[0];
	// 				yVal = web[1];

	// 				let cluster;
	// 				let clusterCount = gridClusters.length;
	// 				for (let j = 0; j < clusterCount; j++)
	// 				{
	// 					cluster = gridClusters[j];
	// 					if (this._calculateCluster({ x: xVal, y: yVal }, cluster))
	// 					{
	// 						break;
	// 					}

	// 					cluster = null;
	// 				}

	// 				if (!cluster)
	// 				{
	// 					cluster = {
	// 						extent: {
	// 							xmin: xVal,
	// 							xmax: xVal,
	// 							ymin: yVal,
	// 							ymax: yVal
	// 						},
	// 						clusterCount: 0,
	// 						subTypeCounts: [],
	// 						singles: [],
	// 						points: [],
	// 						x: xVal,
	// 						y: yVal,
	// 						isSamePoint: true
	// 					};

	// 					gridClusters.push(cluster);
	// 				}
	// 				else
	// 				{
	// 					// recalc the x and y of the cluster by averaging the points again
	// 					cluster.x = (xVal + (cluster.x * cluster.clusterCount)) / (cluster.clusterCount + 1);
	// 					cluster.y = (yVal + (cluster.y * cluster.clusterCount)) / (cluster.clusterCount + 1);
	// 					cluster.extent.xmin = xVal < cluster.extent.xmin ? xVal : cluster.extent.xmin;
	// 					cluster.extent.xmax = xVal > cluster.extent.xmax ? xVal : cluster.extent.xmax;
	// 					cluster.extent.ymin = yVal < cluster.extent.ymin ? yVal : cluster.extent.ymin;
	// 					cluster.extent.ymax = yVal > cluster.extent.ymax ? yVal : cluster.extent.ymax;
	// 					cluster.isSamePoint = cluster.isSamePoint ? this._isSamePoint({ x: xVal, y: yVal }, cluster) : cluster.isSamePoint;
	// 				}

	// 				// push every point into the cluster so we have it for area display if required. This could be omitted if never checking areas, or on demand at least
	// 				if (this.clusterAreaDisplay)
	// 				{
	// 					cluster.points.push([xVal, yVal]);
	// 				}
	// 				cluster.clusterCount++;

	// 				var subTypeExists = false;
	// 				for (var s = 0, sLen = cluster.subTypeCounts.length; s < sLen; s++)
	// 				{
	// 					if (cluster.subTypeCounts[s].name === obj[this.subTypeFlareProperty])
	// 					{
	// 						cluster.subTypeCounts[s].count++;
	// 						subTypeExists = true;
	// 						break;
	// 					}
	// 				}
	// 				if (!subTypeExists)
	// 				{
	// 					cluster.subTypeCounts.push({ name: obj[this.subTypeFlareProperty], count: 1 });
	// 				}

	// 				cluster.singles.push(obj);
	// 			}
	// 			else
	// 			{
	// 				// not clustered so just add every obj
	// 				this._createSingle(obj);
	// 			}
	// 		}

	// 		if (this._isClustered)
	// 		{
	// 			for (let i in gridClusters)
	// 			{
	// 				if (gridClusters[i].clusterCount === 1 || gridClusters[i].isSamePoint)
	// 				{
	// 					this._createSingle(gridClusters[i].singles[0]);
	// 				}
	// 				else if (gridClusters[i].clusterCount > 1)
	// 				{
	// 					this._createCluster(gridClusters[i]);
	// 				}
	// 			}
	// 		}

	// 		// emit an event to signal drawing is complete.
	// 		this.emit("draw-complete", {});
	// 		// console.timeEnd("draw-data-" + this._activeView.type);
	// 		if (!this._activeView.fclSurface)
	// 		{
	// 			setTimeout(function()
	// 			{
	// 				_this._createSurface();
	// 			}, 10);
	// 		}
	// 	};

	// 	FlareClusterLayer.prototype.setData = function(data, drawData)
	// 	{
	// 		if (drawData === void 0) { drawData = true; }
	// 		this._data = data;
	// 		if (drawData)
	// 		{
	// 			this.draw(undefined, true);
	// 		}
	// 	};
	// }


	/**
	* hack suggest to change suggest result
	*/
	// BaseMap.prototype._hackSuggest = function(SearchViewModel)
	// {
	// 	SearchViewModel.prototype._getSuggestionsFromSource = function(a)
	// 	{
	// 		var self = this;
	// 		var geoSearch = new TF.RoutingMap.RoutingPalette.GeoSearch(tf.map.ArcGIS, self.view.map, true);
	// 		var d = this.suggestionsEnabled
	// 			, f = a.trim().length
	// 			, k = this.minSuggestCharacters;
	// 		if (d && f >= k)
	// 		{
	// 			self._timeKey = (new Date()).getTime().toString();
	// 			return (function(timeKey)
	// 			{	//RW - 15914 Geocode: Address Point (if no match)→ Street
	// 				return geoSearch.suggestAddressPoint(a).then(function(suggestions)
	// 				{
	// 					if (suggestions.length < 1)
	// 					{
	// 						return geoSearch.suggest(a).then(function(streetSuggestions)
	// 						{
	// 							if (timeKey == self._timeKey)
	// 							{
	// 								return streetSuggestions.map(function(suggest, i)
	// 								{
	// 									return {
	// 										text: suggest.address,
	// 										key: (new Date()).getTime().toString() + i,
	// 										sourceIndex: 0,
	// 										location: suggest.location,
	// 										extent: suggest.extent
	// 									};
	// 								});
	// 							}
	// 							return [];

	// 						});
	// 					}
	// 					else
	// 					{
	// 						if (timeKey == self._timeKey)
	// 						{
	// 							return suggestions.map(function(suggest, i)
	// 							{
	// 								return {
	// 									text: suggest.address,
	// 									key: (new Date()).getTime().toString() + i,
	// 									sourceIndex: 0,
	// 									location: suggest.location,
	// 									extent: suggest.extent
	// 								};
	// 							});
	// 						}
	// 						return [];
	// 					}
	// 				});
	// 			})(self._timeKey);
	// 		}
	// 		return Promise.resolve();
	// 	};

	// 	var oldGetResultsFromSources = SearchViewModel.prototype._getResultsFromSources;
	// 	SearchViewModel.prototype._getResultsFromSources = function(e)
	// 	{
	// 		if (e.text && e.extent)
	// 		{
	// 			return Promise.resolve([{
	// 				value: [{
	// 					feature: {
	// 						geometry: new tf.map.ArcGIS.Point({ x: e.location.x, y: e.location.y, spatialReference: { wkid: 102100 } })
	// 					},
	// 					extent: e.extent,
	// 					key: e.key,
	// 					name: e.text,
	// 					sourceIndex: e.sourceIndex
	// 				}]
	// 			}]);
	// 		} else if (e.text)
	// 		{
	// 			var geoSearch = new TF.RoutingMap.RoutingPalette.GeoSearch(tf.map.ArcGIS, this.view.map, true);
	// 			geoSearch.initSuggest();
	// 			return geoSearch.suggestResults([{ text: e.text }], e.text).then(function(suggestions)
	// 			{
	// 				return [{
	// 					value: suggestions.map(function(suggest)
	// 					{
	// 						return {
	// 							feature: {
	// 								geometry: new tf.map.ArcGIS.Point({ x: suggest.location.x, y: suggest.location.y, spatialReference: { wkid: 102100 } })
	// 							},
	// 							extent: suggest.extent,
	// 							key: (new Date()).getTime().toString(),
	// 							name: suggest.address,
	// 							sourceIndex: 0
	// 						};
	// 					})
	// 				}];
	// 			});
	// 		} else
	// 		{
	// 			return oldGetResultsFromSources.call(this, e);
	// 		}
	// 	};
	// };

	/**
	* hack this to fix async bug
	* original _pointerDownHandler has a bug of mouse down use hit test as async , this cause when reshape street end point will not start drag event
	*/
	// BaseMap.prototype._hackGraphicMover = function(GraphicMover, GraphicMoverEvents)
	// {
	// 	GraphicMover.prototype._pointerDownHandler = function(a)
	// 	{
	// 		var b = this;
	// 		this._pointerDownEvent = a;

	// 		function hitTest(a)
	// 		{
	// 			var mapPoint = b.view.toMap(a);
	// 			var results = [];
	// 			b.view.allLayerViews.toArray().reverse().forEach(function(layerView)
	// 			{
	// 				if (layerView.graphicsView && layerView.layer.visible)
	// 				{
	// 					var graphics = layerView.graphicsView._graphicStore.hitTest(mapPoint.x, mapPoint.y, 2, layerView.graphicsView.view.state.resolution, layerView.graphicsView.view.state.rotation);
	// 					if (graphics.length > 0)
	// 					{
	// 						for (var i = 0; i < graphics.length; i++)
	// 						{
	// 							if (b.graphics.indexOf(graphics[i]) > -1)
	// 							{
	// 								results.push({
	// 									mapPoint: mapPoint,
	// 									graphic: graphics[i]
	// 								});
	// 							}
	// 						}
	// 					}
	// 				}
	// 			});
	// 			return {
	// 				screenPoint: a,
	// 				results: results
	// 			};
	// 		}

	// 		var c = hitTest(a);
	// 		c = c.results;
	// 		if (c.length && c[0].graphic)
	// 			if (c = c[0].graphic,
	// 				-1 < b.graphics.indexOf(c))
	// 			{
	// 				b._activeGraphic = c;
	// 				var d = a.x
	// 					, h = a.y;
	// 				c = new GraphicMoverEvents.GraphicPointerDownEvent(c, b.graphics.indexOf(c), d, h, a);
	// 				b.emit("graphic-pointer-down", c);
	// 				b.callbacks.onGraphicPointerDown && b.callbacks.onGraphicPointerDown(c)
	// 			} else
	// 			{
	// 				c !== b._activeGraphic && (b._pointerDownEvent = null,
	// 					b._activeGraphic = null);
	// 			}
	// 		else
	// 		{
	// 			b._pointerDownEvent = null;
	// 			b._activeGraphic = null;
	// 		}
	// 	};
	// };

	/**
	* add snap function for reshape
	*/
	// BaseMap.prototype._hackDragHandler = function(GraphicMover, GraphicMoverEvents, drawUtils, lang)
	// {
	// 	GraphicMover.prototype._dragHandler = function(a)
	// 	{
	// 		var b = this;
	// 		if (this._pointerDownEvent && ("start" === a.action || this._dragEvent) && this._activeGraphic && this._activeGraphic.geometry)
	// 		{
	// 			a.stopPropagation();
	// 			var c = a.x
	// 				, d = a.y
	// 				, h = this.graphics.indexOf(this._activeGraphic)
	// 				, f = this._activeGraphic.geometry
	// 				, e = this._dragEvent ? c - this._dragEvent.x : 0
	// 				, g = this._dragEvent ? d - this._dragEvent.y : 0
	// 				, l = c - a.origin.x
	// 				, m = d - a.origin.y;
	// 			// get snap graphic
	// 			var snapPoint = getSnapPoint(this.view.map);
	// 			if (snapPoint && f.type == "point")
	// 			{
	// 				this._activeGraphic.geometry = snapPoint;
	// 			} else
	// 			{
	// 				this._activeGraphic.geometry = this._dragEvent ? this.view.toMap(this._dragEvent) : drawUtils.cloneMove(f, e, g, this.view);
	// 			}
	// 			this.enableMoveAllGraphics && this.graphics.forEach(function(a)
	// 			{
	// 				a !== b._activeGraphic && (a.geometry = drawUtils.cloneMove(a.geometry, e, g, b.view))
	// 			});
	// 			this._dragEvent = a;
	// 			"start" === a.action ? (this._initialDragGeometry = lang.clone(f),
	// 				a = new GraphicMoverEvents.GraphicMoveStartEvent(this._activeGraphic, this.graphics, h, c, d, e, g, l, m, a),
	// 				this.emit("graphic-move-start", a),
	// 				this.callbacks.onGraphicMoveStart && this.callbacks.onGraphicMoveStart(a),
	// 				a.defaultPrevented && this._activeGraphic.set("geometry", f)) : "update" === a.action ? (a = new GraphicMoverEvents.GraphicMoveEvent(this._activeGraphic, this.graphics, h, c, d, e, g, l, m, a),
	// 					this.emit("graphic-move", a),
	// 					this.callbacks.onGraphicMove && this.callbacks.onGraphicMove(a),
	// 					a.defaultPrevented && this._activeGraphic.set("geometry", f)) : (this._dragEvent = null,
	// 						a = new GraphicMoverEvents.GraphicMoveStopEvent(this._activeGraphic, this.graphics, h, c, d, e, g, l, m, a),
	// 						this.emit("graphic-move-stop", a),
	// 						this.callbacks.onGraphicMoveStop && this.callbacks.onGraphicMoveStop(a),
	// 						a.defaultPrevented && this.graphics[h].set("geometry", this._initialDragGeometry),
	// 						this._initialDragGeometry = null)
	// 		}
	// 	};
	// };

	/**
	* hack to enable snap
	*/
	// BaseMap.prototype._hackPolylineVertexAddHandler = function(drawAction, maybe)
	// {
	// 	drawAction.PolylineDrawAction.prototype._vertexAddHandler = function(a)
	// 	{
	// 		// get snap graphic
	// 		var snapPoint = getSnapPoint(this.view.map);
	// 		if (snapPoint)
	// 		{
	// 			this._addVertex([snapPoint.x, snapPoint.y], a.native);
	// 		} else
	// 		{
	// 			if (this._cursorVertexAdded)
	// 				this._addVertex(this.vertices[this.vertices.length - 1], a.native);
	// 			else
	// 			{
	// 				var b = this.getCoordsFromScreenPoint(this._cursorScreenPoint);
	// 				maybe.isSome(b) && this._addVertex(b, a.native)
	// 			}
	// 		}
	// 	};
	// };

	// BaseMap.prototype._hackPolygonVertexAddHandler = function(drawAction, maybe)
	// {
	// 	drawAction.PolygonDrawAction.prototype._vertexAddHandler = function(a)
	// 	{
	// 		// get snap graphic
	// 		var snapPoint = getSnapPoint(this.view.map);
	// 		if (snapPoint)
	// 		{
	// 			this._addVertex([snapPoint.x, snapPoint.y], a.native);
	// 		} else
	// 		{
	// 			if (this._cursorVertexAdded)
	// 				this._addVertex(this.vertices[this.vertices.length - 1], a.native);
	// 			else
	// 			{
	// 				var b = this.getCoordsFromScreenPoint(this._cursorScreenPoint);
	// 				maybe.isSome(b) && this._addVertex(b, a.native)
	// 			}
	// 		}
	// 	};
	// };

	// function getSnapPoint(map)
	// {
	// 	var snapSymbolLayer = map.findLayerById("snapSymbolLayerId");
	// 	if (snapSymbolLayer && snapSymbolLayer.graphics.items.length > 0 && snapSymbolLayer.graphics.items[0].visible && snapSymbolLayer.graphics.items[0].geometry)
	// 	{
	// 		return snapSymbolLayer.graphics.items[0].geometry;
	// 	}
	// }

	// BaseMap.prototype._hackGraphicStore = function(GraphicStore)
	// {
	// 	GraphicStore.prototype.add = function(a, b, c)
	// 	{
	// 		if (a)
	// 			return b = x.default.acquire(a, c, b, this.renderer, this._resolution, this._scale, this._tileInfoView.spatialReference),
	// 				this._itemByGraphic.set(a, b),
	// 				b.zorder = this._graphics.items.length - this._itemByGraphic.size,
	// 				c && this._index.insert(b),
	// 				b.bounds
	// 	}
	// };

	// BaseMap.prototype._hackGraphicProcessingQueue = function(RenderingCore2D)
	// {
	// 	var GraphicProcessingQueue = RenderingCore2D.GraphicProcessingQueue;
	// 	GraphicProcessingQueue.prototype._queueArray = [];

	// 	GraphicProcessingQueue.prototype._next = function()
	// 	{
	// 		if (null == this._scheduledNextHandle || 0 === this._queue.size || this._onGoingGraphic)
	// 			this._scheduledNextHandle = null;
	// 		else
	// 		{
	// 			this._scheduledNextHandle = null;
	// 			var a = this._peek()
	// 				, b = a.graphic
	// 				, c = a.addOrUpdate;
	// 			this._queue.delete(b);
	// 			if (this._queueArray.length > 0) this._queueArray.length = this._queueArray.length - 1;
	// 			this._onGoingGraphic = a;
	// 			this._onGoingPromise = this.process(b, c, this._timestamp);
	// 			this._onGoingPromise.then(this._finalize, this._finalize);
	// 			this.notifyChange("updating")
	// 		}
	// 	}
	// 	GraphicProcessingQueue.prototype._peek = function()
	// 	{
	// 		var c = this._queueArray[this._queueArray.length - 1];
	// 		// if (this._queueArray.length > 0) this._queueArray.length = this._queueArray.length - 1;
	// 		return c;
	// 	}
	// 	GraphicProcessingQueue.prototype.push = function(a, b, c)
	// 	{
	// 		this._queue.has(a) || (this._queue.set(a, {
	// 			graphic: a,
	// 			addOrUpdate: b,
	// 			timestamp: c || this._timestamp
	// 		}), this._queueArray.push({
	// 			graphic: a,
	// 			addOrUpdate: b,
	// 			timestamp: c || this._timestamp
	// 		}),
	// 			this._scheduleNext(),
	// 			this.notifyChange("updating"))
	// 	}
	// 	GraphicProcessingQueue.prototype.initss = function()
	// 	{
	// 		this._queueArray = [];
	// 	}
	// };

	// BaseMap.prototype._hackSVG = function(SVG, h, p)
	// {
	// 	function appendChild(textNode, b)
	// 	{
	// 		var text = b.text;
	// 		var arr = (text + "").split("<br/>");
	// 		if (arr.length == 1)
	// 		{
	// 			var useSvgWeb = "undefined" != typeof window.svgweb;
	// 			var node = useSvgWeb ? p.doc.createTextNode(text, !0) : p.doc.createTextNode(text);
	// 			textNode.appendChild(node);
	// 		}
	// 		else
	// 		{
	// 			var innerHtml = "";
	// 			arr.map(function(txt)
	// 			{
	// 				if (txt.trim() != "")
	// 				{
	// 					innerHtml += "<tspan x='" + b.x + "' dy='1.2em'>" + txt + "</tspan>";
	// 				}
	// 			});
	// 			textNode.innerHTML = innerHtml;
	// 		}
	// 	}
	// 	SVG.Text.prototype.setShape = function(a)
	// 	{
	// 		this.shape = h.makeParameters(this.shape, a);
	// 		this.bbox = null;
	// 		a = this.rawNode;
	// 		var b = this.shape;
	// 		a.setAttribute("x", b.x);
	// 		a.setAttribute("y", b.y);
	// 		a.setAttribute("text-anchor", b.align);
	// 		a.setAttribute("text-decoration", b.decoration);
	// 		a.setAttribute("rotate", b.rotated ? 90 : 0);
	// 		a.setAttribute("kerning", b.kerning ? "auto" : 0);
	// 		a.setAttribute("text-rendering", "auto");
	// 		a.firstChild ? a.firstChild.nodeValue = b.text : appendChild(a, b);
	// 		return this;
	// 	};
	// };

	// BaseMap.prototype._hackQuery = function(Query, jsonUtils, json)
	// {
	// 	Query.prototype.toJson = function(a)
	// 	{
	// 		var y = jsonUtils;
	// 		var q = json;
	// 		var c = {
	// 			text: this.text,
	// 			where: this.where,
	// 			returnGeometry: this.returnGeometry,
	// 			spatialRel: this.spatialRelationship,
	// 			maxAllowableOffset: this.maxAllowableOffset,
	// 			geometryPrecision: this.geometryPrecision ? this.geometryPrecision : 100,
	// 			sqlFormat: this.sqlFormat
	// 		}
	// 			, e = a && a.geometry || this.geometry
	// 			, x = this.objectIds
	// 			, n = this.outFields
	// 			, k = this.outSpatialReference
	// 			, A = this.groupByFieldsForStatistics
	// 			, r = this.orderByFields
	// 			, l = this.outStatistics;
	// 		a = this.distance;
	// 		e && (c.geometry = e,
	// 			c.geometryType = y.getJsonType(e),
	// 			c.inSR = e.spatialReference.wkid || q.toJson(e.spatialReference.toJson()));
	// 		x && (c.objectIds = x.join(","));
	// 		n && (c.outFields = n.join(","));
	// 		this.returnDistinctValues && (c.returnDistinctValues = !0);
	// 		A && (c.groupByFieldsForStatistics = A.join(","));
	// 		r && (c.orderByFields = r.join(","));
	// 		if (l)
	// 		{
	// 			var v = [];
	// 			b.forEach(l, function(a)
	// 			{
	// 				v.push(a.toJson());
	// 			});
	// 			c.outStatistics = q.toJson(v);
	// 		}
	// 		k ? c.outSR = k.wkid || q.toJson(k.toJson()) : e && (c.outSR = e.spatialReference.wkid || q.toJson(e.spatialReference.toJson()));
	// 		e = this.timeExtent;
	// 		c.time = e ? e.toJson().join(",") : null;
	// 		(e = this.relationParam) && this.spatialRelationship === h.SPATIAL_REL_RELATION && (c.relationParam = e);
	// 		a && (c.distance = this.distance,
	// 			this.hasOwnProperty("units") ? c.units = this._units[this.units] || this._units.meters : (console.warn("esri/tasks/query::no distance unit provided, defaulting to meters"),
	// 				c.units = this._units.meters));
	// 		this.hasOwnProperty("start") && (c.resultOffset = this.start,
	// 			c.resultRecordCount = 10,
	// 			"" === c.where && (c.where = "1\x3d1"));
	// 		this.hasOwnProperty("num") && (c.resultRecordCount = this.num);
	// 		c.resultType = this.resultType;
	// 		c.pixelSize = this.pixelSize ? q.toJson(this.pixelSize.toJson()) : null;
	// 		c.multipatchOption = this.multipatchOption;
	// 		this.quantizationParameters && (c.quantizationParameters = q.toJson(this.quantizationParameters));
	// 		c._ts = this._ts;
	// 		return c;
	// 	};
	// };

	// BaseMap.prototype._hackBoxMoveHandlerToEnableCtrlAndShiftScale = function(_Box, matrix)
	// {
	// 	var arcgis = this.ArcGIS;
	// 	// var isKeyEventsBinded = false;
	// 	var isDrawing = false;
	// 	var aa = null;
	// 	var boxEditorInternal = null;
	// 	var keyEvent = null;
	// 	var ctrlKeyActive = false;
	// 	var shiftKeyActive = false;
	// 	$(document).off("keydown.checkctrl").on("keydown.checkctrl", function(e)
	// 	{
	// 		ctrlKeyActive = e.ctrlKey;
	// 		shiftKeyActive = e.shiftKey;
	// 	}).off("keyup.checkctrl").on("keyup.checkctrl", function(e)
	// 	{
	// 		ctrlKeyActive = e.ctrlKey;
	// 		shiftKeyActive = e.shiftKey;
	// 	});
	// 	_Box.prototype._init = function()
	// 	{
	// 		this._draw();
	// 		this.changeRotateHandlerSymbol();
	// 		this.bindScaleEventsToMap();
	// 	};

	// 	_Box.prototype.bindScaleEventsToMap = function()
	// 	{
	// 		var self = this;
	// 		boxEditorInternal = Object.create(self);
	// 		if (self._map.isKeyEventsBinded) return;
	// 		self._map.on("key-down", function(ev)
	// 		{
	// 			if (isDrawing && aa)
	// 			{
	// 				keyEvent = ev;
	// 				boxEditorInternal._moveHandler.call(boxEditorInternal, aa, { dx: 0, dy: 0 });
	// 			}
	// 		});
	// 		self._map.on("key-up", function(ev)
	// 		{
	// 			if (isDrawing && aa)
	// 			{
	// 				keyEvent = null;
	// 				boxEditorInternal._moveHandler.call(boxEditorInternal, aa, { dx: 0, dy: 0 });
	// 			}
	// 		});
	// 		self._toolbar.onScaleStart = self._toolbar.onScaleStart.createInterceptor(function()
	// 		{
	// 			isDrawing = true;
	// 		});
	// 		self._toolbar.onScaleStop = self._toolbar.onScaleStop.createInterceptor(function()
	// 		{
	// 			isDrawing = false;
	// 			aa = null;
	// 		});
	// 		self._map.isKeyEventsBinded = true;
	// 	};

	// _Box.prototype.changeRotateHandlerSymbol = function()
	// {
	// 	if (this._anchors.length > 8)
	// 	{
	// 		var image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAQBJREFUeNqUU4sNgyAQpY0D4AaOwAi4gRvUERxBJ7GdBDfADRxBN7D3KEeotYovuUDuf4/jJn5RkzyUUlpK6RTLsohxHAdnrGtdFIXTt207xIHQ2qZp1mma1i2gg80YE3Tkb0JwnudzbExBnMDGwahGra5aaye4z/P8N0GN1hh938NgSSqf3Jx1YHhmnD5YRtwcJsjANrPadZ07QHzMrtfvAzMycN9xUXBjoacN3FDhNRPnGL+yKSWIcHcvy1LcsSThLT+jVAfJKh6XFyyFRAZ0duOb9IzclYWNgRi/9mmLFK83fH0RcXmV4QNf/3fE5c/kK4fg28Xv/CJ5xs5vAQYAGu+whQTt4G0AAAAASUVORK5CYII=";
	// 		var markerSymbol = new arcgis.PictureMarkerSymbol({ url: image, width: 16, height: 16 });
	// 		this._anchors[8].graphic.setSymbol(markerSymbol);
	// 		this.refresh();
	// 	}
	// };
	// 	_Box.prototype._moveHandler = function(a, b)
	// 	{
	// 		aa = a;
	// 		var xDirection = false, yDirection = false;
	// 		if (ctrlKeyActive && Math.abs(this._xfactor) == 1 && Math.abs(this._yfactor) == 0) xDirection = true;
	// 		else if (ctrlKeyActive && Math.abs(this._yfactor) == 1 && Math.abs(this._xfactor) == 0) yDirection = true;

	// 		var h = matrix;
	// 		var c = a.host._index, e = this._defaultEventArgs, k, n, l, r;
	// 		e.angle = 0;
	// 		e.scaleX = 1;
	// 		e.scaleY = 1;
	// 		if (8 === c)
	// 			k = this._startLine,
	// 				n = this._moveLine,
	// 				l = n[1],
	// 				l.x += b.dx,
	// 				l.y += b.dy,
	// 				l = this._getAngle(k, n),
	// 				this._isTextPoint && (l += this._graphic.symbol.angle),
	// 				n = h.rotategAt(l, k[0]),
	// 				this._graphic.getDojoShape().setTransform(n),
	// 				e.transform = n,
	// 				e.angle = l,
	// 				e.around = k[0];
	// 		else
	// 		{
	// 			k = this._startBox;
	// 			n = this._moveBox;
	// 			n.width += b.dx * this._xfactor;
	// 			n.height += b.dy * this._yfactor;
	// 			if ((ctrlKeyActive && shiftKeyActive) || this._isTextPoint)
	// 			{
	// 				k = n.x + this._xfactor * n.width;
	// 				n = n.y + this._yfactor * n.height;
	// 				k = Math.sqrt((k - this._centerCoord.x) * (k - this._centerCoord.x) + (n - this._centerCoord.y) * (n - this._centerCoord.y));
	// 				this._scaleRatio = l = r = k / this._firstMoverToAnchor;
	// 				k = this._centerCoord;
	// 			}
	// 			else if (ctrlKeyActive)
	// 			{
	// 				var rx = n.x + this._xfactor * n.width - this._centerCoord.x;
	// 				var ry = n.y + this._yfactor * n.height - this._centerCoord.y;

	// 				var sx = k.x + this._xfactor * k.width - this._centerCoord.x;
	// 				var sy = k.y + this._yfactor * k.height - this._centerCoord.y;

	// 				l = rx / sx;
	// 				r = ry / sy;

	// 				k = this._centerCoord;
	// 			}
	// 			else
	// 			{
	// 				var xRatioFactor = 1, yRatioFactor = 1;
	// 				l = n.width / k.width,
	// 					r = n.height / k.height,
	// 					k = {
	// 						x: k.x,
	// 						y: k.y
	// 					};
	// 				if (l < 0) xRatioFactor = -1;
	// 				if (r < 0) yRatioFactor = -1;
	// 				if (shiftKeyActive && Math.abs(this._xfactor) != 0 && Math.abs(this._yfactor) != 0)
	// 				{
	// 					this._scaleRatio = (l > r) ? Math.abs(l) : Math.abs(r);
	// 					l = this._scaleRatio * xRatioFactor;
	// 					r = this._scaleRatio * yRatioFactor;
	// 				}
	// 			}
	// 			if (yDirection || isNaN(l) || Infinity === l || -Infinity === l)
	// 				l = 1;
	// 			if (xDirection || isNaN(r) || Infinity === r || -Infinity === r)
	// 				r = 1;
	// 			n = h.scaleAt(l, r, k);
	// 			if (this._isTextPoint)
	// 			{
	// 				var q = h.rotategAt(this._graphic.symbol.angle, k);
	// 				this._graphic.getDojoShape().setTransform([q, n]);
	// 			} else
	// 				this._graphic.getDojoShape().setTransform(n);
	// 			e.transform = n;
	// 			e.scaleX = l;
	// 			e.scaleY = r;
	// 			e.around = k;
	// 		}
	// 		this._toolbar["on" + (8 === c ? this._rotateEvent : this._scaleEvent)](this._graphic, e);
	// 	};

	// };

	BaseMap.prototype.onLayersAddResult = function(callback, errback)
	{
		this.map.on("layers-add-result", callback, errback);
	};

	// BaseMap.prototype.hackDojoRefresh = function()
	// {
	// 	var self = this;
	// 	if (!self.ArcGIS) { return; }

	// 	self.refreshedLength = 0;
	// 	self._needResize = false;

	// 	self.Dojo.shape.Container.remove = dojoRemove;
	// 	self.ArcGIS.GraphicsLayer.prototype._refresh = dojoRefresh(self, self.ArcGIS.GraphicsLayer.prototype._refresh);
	// 	self.ArcGIS.GraphicsLayer.prototype._draw = dojoDraw(self);

	// 	/**
	// 	* The remove function to overwrite dojo remove function
	// 	*-- the original function in dojo is going to remove the points not in this extent, 
	// 	* and it will be very slow when there are 40000 points, so our solution is keep all points on map.
	// 	*
	// 	* @param {object} a - the graphic
	// 	* @param {bool} c - 
	// 	* @return {graphicLayer}
	// 	*/
	// 	function dojoRemove(a, c)
	// 	{
	// 		// performance tuning for map pan with 30,000 points
	// 		return this;
	// 	};

	// 	/**
	// 	* The refresh function to overwrite dojo refresh function
	// 	*-- once set zoomduration to 0, the zoom performance will be better than before, 
	// 	* but when change the sizepanel's size, the points will be mess, 
	// 	* so force to refresh points(to all graphicLayers) when sizepanel change size.
	// 	*
	// 	* @param {object} a - the graphic
	// 	* @return {none}
	// 	*/
	// 	function dojoRefresh(self, dojoRefresh)
	// 	{
	// 		var self = self;
	// 		return function(flag)
	// 		{
	// 			if (this._map && self._needResize)
	// 			{
	// 				var layerId = this.id,
	// 					isIdMatched = this._map._layers.some(function(layer) { return layer.id == layerId; });

	// 				if (this._resized && isIdMatched)
	// 				{
	// 					this._resized = false;
	// 					self.refreshedLength++;
	// 					if (self.refreshedLength == this._map._layers.length)
	// 					{
	// 						self._needResize = false;
	// 						self.refreshedLength = 0;
	// 					}
	// 				}
	// 			}
	// 			dojoRefresh.call(this, flag);
	// 		};
	// 	};

	// 	/**
	// 	* The draw function to overwrite dojo draw function
	// 	*--1. When zoomin, in original logic, it will remove the points outside current extent.(slow)
	// 	* Now only set the point's position to (-10,-10)
	// 	* 2. When zoomout, in original logic, it will recreate all points,(slow)
	// 	* Now only need to set the point's position back to the right screenpoint.
	// 	* 3. When pan, in original design, it will recreate the points not exist, (slow)
	// 	* now only need to set the point's position back to the right screenpoint.
	// 	*
	// 	* @param {object} a - the graphic
	// 	* @return {none}
	// 	*/
	// 	function dojoDraw(self)
	// 	{
	// 		var self = self;
	// 		return function(a, b)
	// 		{
	// 			// dojoDraw.call(this, a, b);
	// 			if (this._params.drawMode && this._map && !this.suspended && !this._map.__zooming && !this._resized)
	// 			{
	// 				try
	// 				{
	// 					var H = true, R = false;
	// 					var d = a._extent, u, e, z = !H || this.styling, f = H && this.dataAttributes, c = a.getDojoShape(), h;
	// 					if (a.visible && d && (u = this._intersects(this._map, d, a.geometry._originOnly)) && (e = z ? this._getSymbol(a) : this._defaultMarker))
	// 					{
	// 						if (!a._offsets || a._offsets.join(",") !== u.join(",") ? a._offsets = u : h = !0,
	// 							!c || b || !h)
	// 						{
	// 							var m = a.geometry.type
	// 								, d = {
	// 									graphic: a
	// 								}
	// 								, y = a._bgShape
	// 								, E = z && !a.symbol ? this._getRenderer(a) : null
	// 								, K = E && E.backgroundFillSymbol;
	// 							if ("point" === m)
	// 							{
	// 								if (this._isInvalidShape(e, c))
	// 								{
	// 									this._removeShape(a);
	// 								}
	// 								if (a._shape && (e.style == "circle" || e.style == "cross") && self.ArcGIS)
	// 								{
	// 									var h = this._map,
	// 										m = h.__visibleRect,
	// 										y = self.ArcGIS.screenUtils.toScreenPoint(h.extent, h.width, h.height, a.geometry).offset(-m.x + u[0], -m.y),
	// 										z = Math.round, K;

	// 									if (e.style == "circle")
	// 									{
	// 										a.attr("cx", y.x);
	// 										a.attr("cy", y.y);
	// 									} else if (e.style == "cross")
	// 									{
	// 										// calculate path
	// 										m = y.x;
	// 										E = y.y;
	// 										h = e.size;
	// 										e = isNaN(h) ? 16 : h / 2;
	// 										K = this._drawPath(a, a.getDojoShape(), this._smsToPath(self.ArcGIS.SimpleMarkerSymbol, "cross", m, E, z(m - e), z(m + e), z(E - e), z(E + e)));
	// 										K.setTransform(self.Dojo.matrix.multiply([]));
	// 										K._wrapOffsets = u;

	// 										a.attr("d", K.shape.path);
	// 									}
	// 								}
	// 								else
	// 								{
	// 									a._shape = this._drawPoint(this._div, a.geometry, e, a.getDojoShape(), u, E, a),
	// 										z && this._symbolizePoint(a.getDojoShape(), e, E, a);
	// 								}
	// 							}
	// 							else if ("multipoint" === m)
	// 								this._drawMarkers(a, e, u, E),
	// 									z && this._symbolizeMarkers(a, e, E);
	// 							else
	// 							{
	// 								var N, m = e, T, da, limits;
	// 								z && (m = (N = "simplemarkersymbol" === e.type || "picturemarkersymbol" === e.type || "textsymbol" === e.type ? e : null) ? K : e);
	// 								m && m === K && (T = this._bgGroup);
	// 								y && !T && this._removeBgShape(a);
	// 								limits = this._rendererLimits;
	// 								this._rendererLimits = null;
	// 								m && (!T && this._isInvalidShape(m, a._shape) && this._removeShape(a, !1),
	// 									da = this._drawShape(a, u, T || this._div, T ? y : a.getDojoShape()),
	// 									z && this._symbolizeShape(da, m, E, !!K, a),
	// 									a[T ? "_bgShape" : "_shape"] = da);
	// 								this._rendererLimits = limits;
	// 								if (N)
	// 								{
	// 									this._isInvalidShape(N, a._shape) && this._removeShape(a, !1);
	// 									var g = a.geometry.getCentroid();
	// 									(da = g && this._drawPoint(this._div, g, N, a._shape, u, E, a)) && this._symbolizePoint(da, N, E, a);
	// 									a._shape = da
	// 								}
	// 							}
	// 							R || (a._bgShape && this._initNode(a, a._bgShape, a._bgShape !== y, d, f),
	// 								a._shape && this._initNode(a, a._shape, a._shape !== c, d, f));
	// 							d.node = a.getNode();
	// 							this.onGraphicDraw(d)
	// 						}
	// 						else
	// 						{
	// 							// pan
	// 							if (a._shape)
	// 							{
	// 								var h = this._map,
	// 									m = h.__visibleRect,
	// 									y = tf.map.ArcGIS.screenUtils.toScreenPoint(h.extent, h.width, h.height, a.geometry).offset(-m.x + u[0], -m.y),
	// 									z = Math.round;

	// 								if (!y)
	// 								{
	// 									return;
	// 								}

	// 								if (e.style == "circle" && a.getNode().getAttribute("cx") == "-10")
	// 								{
	// 									a.attr("cx", y.x);
	// 									a.attr("cy", y.y);
	// 								} else if (e.style == "cross" && a.getNode().getAttribute("d") == "M 0 0")
	// 								{
	// 									m = y.x;
	// 									E = y.y;
	// 									h = e.size;
	// 									e = isNaN(h) ? 16 : h / 2;
	// 									K = this._drawPath(a, a.getDojoShape(), this._smsToPath(tf.map.ArcGIS.SimpleMarkerSymbol, "cross", m, E, z(m - e), z(m + e), z(E - e), z(E + e)));
	// 									K.setTransform(self.Dojo.matrix.multiply([]));
	// 									K._wrapOffsets = u;

	// 									a.attr("d", K.shape.path);
	// 								}
	// 							}
	// 						}
	// 					} else
	// 					{
	// 						if (c)
	// 						{
	// 							if (a.symbol && a.symbol.style == "circle")
	// 							{
	// 								a.attr("cx", -10);
	// 								a.attr("cy", -10);
	// 							} else if (a.symbol && a.symbol.style == "cross")
	// 							{
	// 								a.attr("d", "M 0 0");
	// 							}
	// 							else
	// 							{
	// 								this._removeShape(a);
	// 							}
	// 						}
	// 					}
	// 				} catch (v)
	// 				{
	// 					//this._errorHandler(v, a)
	// 					console.error(v);
	// 				}
	// 			}
	// 		};
	// 	};
	// };

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