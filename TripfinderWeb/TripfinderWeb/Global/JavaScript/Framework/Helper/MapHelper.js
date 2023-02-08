(function()
{
	var namespace = createNamespace("TF.Helper");

	const WhiteCanvasMapId = "white-canvas";
	const BASE_MAPS = [
		{
			title: "Dark Grey",
			id: "dark-gray-vector",
			thumbnail: "https://www.arcgis.com/sharing/rest/content/items/25869b8718c0419db87dad07de5b02d8/info/thumbnail/DGCanvasBase.png?f=json"
		},
		{
			title: "Imagery with Labels",
			id: "hybrid",
			thumbnail: "https://www.arcgis.com/sharing/rest/content/items/413fd05bbd7342f5991d5ec96f4f8b18/info/thumbnail/imagery_labels.jpg?f=json",
			getBaseMap: (imageJsonUrlPrefix) => new tf.map.ArcGIS.Basemap({
				baseLayers: [
					new tf.map.ArcGIS.TileLayer({
						url: "//services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer"
					}),
					new tf.map.ArcGIS.VectorTileLayer({
						url: `${imageJsonUrlPrefix ? imageJsonUrlPrefix : './'}Global/JavaScript/Framework/Map/hybrid_english.json`
					})
				],
				id: "hybrid",
				title: "Imagery with Labels"
			})
		},
		{
			title: "Light Grey",
			id: "gray-vector",
			thumbnail: "https://www.arcgis.com/sharing/rest/content/items/8b3b470883a744aeb60e5fff0a319ce7/info/thumbnail/light_gray_canvas.jpg?f=json"
		},
		{
			title: "Open Streets Map",
			id: "osm",
			thumbnail: "https://www.arcgis.com/sharing/rest/content/items/5d2bfa736f8448b3a1708e1f6be23eed/info/thumbnail/temposm.jpg?f=json"
		},
		{
			isDefault: true,
			title: "Streets",
			id: "streets-vector",
			thumbnail: "https://www.arcgis.com/sharing/rest/content/items/d8855ee4d3d74413babfb0f41203b168/info/thumbnail/world_street_map.jpg?f=json",
			getBaseMap: () => new tf.map.ArcGIS.Basemap({
				baseLayers: [new tf.map.ArcGIS.VectorTileLayer({
					url: "https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer"
				})],
				title: "Streets",
				id: "streets-vector"
			})
		},
		{
			title: "White Canvas",
			id: WhiteCanvasMapId,
			thumbnail: 'data:image/svg+xml;charset=UTF-8;base64,' +
				btoa(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg" width="93" height="63">
					<rect width="93" height="63" stroke-width="1" stroke="black" fill="white"></rect>
				</svg>`),
			getBasemap: () => new tf.map.ArcGIS.Basemap({
				baseLayers: [],
				id: WhiteCanvasMapId,
				title: "White Canvas"
			})
		},
		{
			title: "My Maps (Vector Tile)",
			id: "my-maps",
			thumbnail: 'data:image/svg+xml;charset=UTF-8;base64,' +
				btoa(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg" width="93" height="63">
					<rect width="93" height="63" stroke-width="1" stroke="black" fill="white"></rect>
				</svg>`),
		},
	];

	namespace.MapHelper = MapHelper;

	function MapHelper(map)
	{
		var self = this;
		self._map = map;
		self._arcgis = tf.map.ArcGIS;
	}

	MapHelper.prototype.constructor = MapHelper;

	MapHelper.convertPxToDistance = function(map, arcgis, pxValue)
	{
		var self = this,
			p1 = { x: 0, y: 0 },
			p2 = { x: 0, y: pxValue },
			mapP1 = map.mapView.toMap(p1),
			mapP2 = map.mapView.toMap(p2),
			distance = self.getDistance(mapP1, mapP2);
		return distance;
	};

	MapHelper.getDistance = function(point1, point2)
	{
		return Math.sqrt((point2.x - point1.x) * (point2.x - point1.x) + (point2.y - point1.y) * (point2.y - point1.y));
	};

	MapHelper.addLayer = function(map, layer)
	{
		map.layers.add(layer);
	};

	MapHelper.removeLayer = function(map, layer)
	{
		map.layers.remove(layer);
	};

	/**
	* remove all graphics in layer
	*/
	MapHelper.clearLayer = function(layer)
	{
		if (layer.type == "graphics")
		{
			layer.removeAll();
			return Promise.resolve();
		}
		if (layer.type == "feature")
		{
			return layer.queryFeatures().then(function(featureSet)
			{
				if (featureSet.features.length > 0)
				{
					return layer.applyEdits({ deleteFeatures: featureSet.features });
				}
			});
		}
	};


	MapHelper.setMapCursor = function(map, cursorString)
	{
		var cursor = cursorString;
		$(map.mapView.container).removeClass("pin-cursor");
		if (cursorString === "locate")
		{
			cursor = "url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAaCAYAAAC+aNwHAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAP"
				+ "oAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAABZ0lEQVQ4y5WTMUsDQRCFvztSWBhr8Rek0Eqsl"
				+ "Cg6oAYEwdY6tV1AbASxyd+wsRAECwmMYEArsdLCzk5SexZpJBbZC3tzt3fnwBX75r2ZtztzESZE5BA4AnaBOQePgQFwo6q3Pj/yhAvAFXBAedwBx6r6PSsgIvPAC9CiX"
				+ "nwAa6r6EzvgOiD+dZ+NltMQicgecG8II+AUeHTnLeASWDS8/QbQLRCvquqXh32KyAB4NUW6MdA2BXpGDIDDegZux0DTAyZMxxWKgeOk0YwLSJOSArlcDCTeOQI6JQU6e"
				+ "LsDJDEwNKS+iCxZpcP6Bh5GIrINPJjECDjzim8CF+THuJNu4hOwXnLnqCD3rKob6SOeB+4cBcQzjf8zvQHL1It3VV2B6RTS6NUUZ7gZezVdzLpbB3VdZDi5B6pwkele5K"
				+ "DKRS5XOKKAi1z3kIOQi0JnoSWxLgq7lzmwHf+zIxkXiYgkZZxGRY2TqiZ/HZNl0jX5bvAAAAAASUVORK5CYII=\") 8 24, auto";
		} else if (cursorString === "locate-white")
		{
			cursor = "url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAaCAYAAAC+aNwHAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6A"
				+ "AAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAABC0lEQVQ4y5WSMapCQQxFo/xSbAU74a9EEORVrkAQN+Cefq2F4A7c"
				+ "wStcgqBWvkoQj80MDPmTybwLKSZzc3MnGREFYAX8ATfgGeIWciuxAIyBIz6OwFgXj4BLRXHEBRilAieD+A6RwykWLzOXV2ADzEJsQk5jKcAhUzzNzGiaETkI8FDJdWHQa8V9CPB"
				+ "KEh9gUhCYBE7Ea5jjiY1/d0MR6ZLzQESagkATOBGdAHv1rnthiHfF3QswN9a4BX5DbI01zqP62fgsHzW0FOfU3oL+WOg3tj2K29yOmx4C+U1VumjFQqWL0j9xXbTiwXHRuAIFF35"
				+ "3x0Vdd8NFfXfDRb/uiUgHdCXOj6Ox85p8Aa3WhV7ZByO1AAAAAElFTkSuQmCC\") 8 24, auto";
		} else if (cursorString === "pin")
		{
			$(map.mapView.container).addClass("pin-cursor");
		}
		map.mapView.container.style.cursor = cursor;

		if (["default", "locate", "locate-white", "pin"].indexOf(cursorString) >= 0)
		{
			$(map.mapView.container).find(".esri-view-surface[data-interacting='true']").attr("data-interacting", false);
		}
	};

	MapHelper.getLayer = function(map, id)
	{
		return map.findLayerById(id);
	};

	MapHelper.disableDoubleClickZoom = function(map)
	{
		if (map.mapView)
		{
			if (!map._viewDoubleClickEvent)
			{
				map._viewDoubleClickEvent = map.mapView.on("double-click", function(event)
				{
					event.stopPropagation();
				});
			}
		}
		else
		{
			map.disableDoubleClickZoom();
		}
	};

	MapHelper.enableDoubleClickZoom = function(map)
	{
		if (map.mapView)
		{
			if (map._viewDoubleClickEvent)
			{
				map._viewDoubleClickEvent.remove();
				map._viewDoubleClickEvent = null;
			}
		}
		else
		{
			map.enableDoubleClickZoom();
		}
	};
	
	MapHelper.centerAndZoom = function(map, point, zoom)
	{
		map.mapView.center = new tf.map.ArcGIS.Point({ x: point.x, y: point.y, spatialReference: { wkid: point.spatialReference.wkid } });
		map.mapView.zoom = zoom;
	};

	MapHelper.bind = function(map, event, callback)
	{
		if (event.indexOf("zoom") >= 0)
		{
			return map.mapView.watch("zoom", function(newValue, oldValue)
			{
				if (newValue !== oldValue)
				{
					callback();
				}
			});
		}
		var eventName = "";
		switch (event)
		{
			case "mouse-move":
				eventName = "pointer-move";
				break;
			case "mouse-down":
				eventName = "pointer-move";
				break;
			case "mouse-up":
				eventName = "pointer-up";
				break;
			default:
				break;
		}
		return map.mapView.on(eventName, function(evt)
		{
			if (evt.x)
			{
				var point = map.mapView.toMap({ x: evt.x, y: evt.y });
				evt.mapPoint = point;
				evt.clientX = evt.native.clientX;
				evt.clientY = evt.native.clientY;
				evt.which = evt.native.which;
				evt.button = evt.native.button;
			}
			callback(evt);
		});
	};

	MapHelper.SimpleMarkerSymbol = function(options)
	{
		var symbol = new tf.map.ArcGIS.SimpleMarkerSymbol();
		if (options.color)
		{
			symbol.color = options.color;
		}
		if (options.outline)
		{
			symbol.outline = options.outline;
		}
		if (options.size)
		{
			symbol.size = options.size;
		}

		return symbol;
	};

	MapHelper.SimpleLineSymbol = function(options)
	{
		var symbol = new tf.map.ArcGIS.SimpleLineSymbol();
		if (options.width)
		{
			symbol.width = options.width;
		}
		if (options.style)
		{
			symbol.style = options.style;
		}
		if (options.color)
		{
			symbol.color = options.color;
		}

		return symbol;
	};

	MapHelper.SimpleFillSymbol = function(options)
	{
		var symbol = new tf.map.ArcGIS.SimpleFillSymbol();

		if (options.style)
		{
			symbol.style = options.style;
		}
		if (options.color)
		{
			symbol.color = options.color;
		}
		if (options.outline)
		{
			symbol.outline = options.outline;
		}

		return symbol;
	};

	MapHelper.getGraphics = function(layer)
	{
		if (layer.graphics.items)
		{
			return layer.graphics.items;
		}
		return layer.graphics;
	};

	MapHelper.getColorArray = function(color)
	{
		if ($.isArray(color))
		{
			return color;
		}
		var rgbColor = color.toString();
		if (rgbColor.indexOf("#") < 0)
		{
			rgbColor = TF.Color.toHTMLColorFromLongColor(rgbColor);
		}
		return tf.map.ArcGIS.Color.fromString(rgbColor).toRgb();
	};

	MapHelper.getAllBaseMaps = function()
	{
		return BASE_MAPS;
	};

	MapHelper.getBaseMapById = function(baseMapId)
	{
		if (baseMapId === "my-maps")
		{
			baseMapId = WhiteCanvasMapId;
		}

		const baseMap = BASE_MAPS.find(o => o.id === baseMapId) || BASE_MAPS.find(o => o.isDefault);

		return typeof baseMap.getBaseMap === "function" ? baseMap.getBaseMap() : baseMap.id;
	};


	function _getBaseIdFromOptions(options)
	{
		let baseMapId = "";
		if (options.baseMapSaveKey)
		{
			baseMapId = tf.userPreferenceManager.get(options.baseMapSaveKey);
		}
		baseMapId = baseMapId || options.baseMapId;

		return baseMapId;
	}

	MapHelper.createMap = function(element, creator, options)
	{
		options = options || {};
		const baseMapId = _getBaseIdFromOptions(options);

		var mapMinZoom = options.minZoom || MapHelper.MAP_MIN_ZOOM_LEVEL;
		var map = new tf.map.ArcGIS.Map({
			basemap: MapHelper.getBaseMapById(baseMapId)
		});
		var view = new tf.map.ArcGIS.MapView({
			container: element[0],
			map: map,
			spatialReference: {
				wkid: 102100
			},
			zoom: options.zoomLevel,
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
			background: {
				color: [240, 237, 229]
			},
			constraints: {
				rotationEnabled: false,
				lods: tf.map.ArcGIS.TileInfo.create().lods,
				minZoom: mapMinZoom
			}
		});

		if (options.center)
		{
			view.center = options.center;
		}

		if (view.zoom < 0)
		{
			view.scale = 5000;
		}

		map.mapView = view;

		// make sure map cannot drag to out of map region when mapview loaded
		view.when(function()
		{
			MapHelper.restrictPanOutside(view);
		});
		if (creator)
		{
			creator._map = map;
			// map tool box
			creator.RoutingMapTool = new TF.Map.RoutingMapTool(creator, $.extend({
				thematicLayerId: "",
			}, options));

			if (options.expand && options.expand.enable)
			{
				map.expandMapTool = new TF.Map.ExpandMapTool(map, options.expand.container, creator.RoutingMapTool);
			}
		}

		// double right click zoom
		view.on("double-click", function(e)
		{
			var currentCenter = view.center;
			var xoffset = e.mapPoint.latitude - currentCenter.latitude;
			var yoffset = e.mapPoint.longitude - currentCenter.longitude;
			if (e.button === 2)
			{
				view.zoom = view.zoom - 1;
				view.center = [e.mapPoint.longitude - yoffset * 2, e.mapPoint.latitude - xoffset * 2];
			}
		});

		// skip to load default place if location specified
		if (!options.center)
		{
			var extent = TF.createDefaultMapExtent();
			view.when().then(function()
			{
				view.extent = extent;
				if (TF.isMobileDevice)
				{
					view.ui.remove("zoom");
				}
			});
		}

		return map;
	};

	MapHelper.MAP_MIN_ZOOM_LEVEL = 3;

	MapHelper.restrictPanOutside = function(mapView)
	{
		var recenterTimer = null;
		var recenterMap = function(extent)
		{
			if (recenterTimer != null)
			{
				// avoid call mapView.goTo continuously.
				window.clearTimeout(recenterTimer);
			}

			recenterTimer = setTimeout(async function()
			{
				recenterTimer = null;
				await mapView.goTo(extent, { duration: 0, easing: "linear" });
			}, 50);
		}

		var resetMapExtent = async function()
		{
			var MERCATOR_MAX_Y = 19972000, MERCATOR_MIN_Y = -19972000, mapExtent = mapView.extent;

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

		mapView.watch("extent", async function(value)
		{
			resetMapExtent();
		});
	}

	MapHelper.prototype.dispose = function()
	{
		var self = this;
		self._map = null;
		self._arcgis = null;
	};

})();
