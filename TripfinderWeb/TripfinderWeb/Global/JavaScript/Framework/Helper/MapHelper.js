(function()
{
	var namespace = createNamespace("TF.Helper");

	// const LOD = [{ "level": 0, "resolution": 156543.03392800014, "scale": 591657527.591555 }, { "level": 1, "resolution": 78271.51696399994, "scale": 295828763.795777 }, { "level": 2, "resolution": 39135.75848200009, "scale": 147914381.897889 }, { "level": 3, "resolution": 19567.87924099992, "scale": 73957190.948944 }, { "level": 4, "resolution": 9783.93962049996, "scale": 36978595.474472 }, { "level": 5, "resolution": 4891.96981024998, "scale": 18489297.737236 }, { "level": 6, "resolution": 2445.98490512499, "scale": 9244648.868618 }, { "level": 7, "resolution": 1222.992452562495, "scale": 4622324.434309 }, { "level": 8, "resolution": 611.4962262813797, "scale": 2311162.217155 }, { "level": 9, "resolution": 305.74811314055756, "scale": 1155581.108577 }, { "level": 10, "resolution": 152.87405657041106, "scale": 577790.554289 }, { "level": 11, "resolution": 76.43702828507324, "scale": 288895.277144 }, { "level": 12, "resolution": 38.21851414253662, "scale": 144447.638572 }, { "level": 13, "resolution": 19.10925707126831, "scale": 72223.819286 }, { "level": 14, "resolution": 9.554628535634155, "scale": 36111.909643 }, { "level": 15, "resolution": 4.77731426794937, "scale": 18055.954822 }, { "level": 16, "resolution": 2.388657133974685, "scale": 9027.977411 }, { "level": 17, "resolution": 1.1943285668550503, "scale": 4513.988705 }, { "level": 18, "resolution": 0.5971642835598172, "scale": 2256.994353 }, { "level": 19, "resolution": 0.29858214164761665, "scale": 1128.497176 }, { "level": 20, "resolution": 0.14929107082380833, "scale": 564.248588 }, { "level": 21, "resolution": 0.07464553541190416, "scale": 282.124294 }, { "level": 22, "resolution": 0.03732276770595208, "scale": 141.062147 }, { "level": 23, "resolution": 0.01866138385297604, "scale": 70.5310735 }];
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
			id: "white-canvas",
			thumbnail: 'data:image/svg+xml;charset=UTF-8;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg" width="93" height="63"><rect width="93" height="63" stroke-width="1" stroke="black" fill="white"></rect></svg>'),
			getBasemap: () => new tf.map.ArcGIS.Basemap({
				baseLayers: [],
				id: "white-canvas",
				title: "White Canvas"
			})
		},
		{
			title: "My Maps (Vector Tile)",
			id: "my-maps",
			thumbnail: 'data:image/svg+xml;charset=UTF-8;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg" width="93" height="63"><rect width="93" height="63" stroke-width="1" stroke="black" fill="white"></rect></svg>'),
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

	// /**
	//  * Get specified layer on the map.
	//  * @param  {String} layerId Specified layer id.
	//  */
	// MapHelper.prototype._getMapLayer = function(layerId)
	// {
	// 	var self = this,
	// 		layer = self._map.findLayerById(layerId);
	// 	if (layer === undefined)
	// 	{
	// 		console.error("Could not find layer id " + layerId);
	// 	}
	// 	return layer;
	// };

	// /**
	//  * Return an array of layers in the map.
	//  * @returns {Array} layers
	//  */
	// MapHelper.prototype._getMapLayers = function()
	// {
	// 	var self = this,
	// 		layers = self._map.layers;
	// 	return layers;
	// };

	// /**
	//  * Get the map layer by layer index.
	//  * @param  {Number} layerIndex Map layer index.
	//  * @returns {Layer} layer
	//  */
	// MapHelper.prototype._getMapLayerByLayerIndex = function(layerIndex)
	// {
	// 	var self = this,
	// 		mapLayers = self._getMapLayers();

	// 	if (layerIndex < mapLayers.length)
	// 	{
	// 		return mapLayers.items[index];
	// 	}
	// 	else
	// 	{
	// 		// NOT_FOUND
	// 		return null;
	// 	}
	// };

	// MapHelper.prototype._getMapGraphicsLayerByIndex = function(graphicsLayerIndex)
	// {
	// 	var self = this,
	// 		graphicsLayerIds = self._map.graphicsLayerIds,
	// 		graphicsLayerId = graphicsLayerIds[graphicsLayerIndex],
	// 		graphicsLayer = null;

	// 	if (graphicsLayerId)
	// 	{
	// 		graphicsLayer = self._map.getLayer(graphicsLayerId);
	// 	}

	// 	return graphicsLayer;
	// };

	// /**
	//  * Return layer index in the map
	//  * @param  {String} layerId
	//  * @returns {Number} index of the layer, -1 is not found.
	//  */
	// MapHelper.prototype._getMapLayerIndex = function(layerId)
	// {
	// 	var self = this,
	// 		mapLayers = self._getMapLayers();

	// 	for (var index = 0; index < mapLayers.length; index++)
	// 	{
	// 		var item = mapLayers.items[index];
	// 		if (item.id === layerId)
	// 		{
	// 			return index;
	// 		}
	// 	}
	// 	// NOT_FOUND
	// 	return -1;
	// };

	// /**
	//  * Return an array of layers visible at the current scale.
	//  * @returns {Array} layers
	//  */
	// MapHelper.prototype._getMapLayersVisibleAtScale = function()
	// {
	// 	var self = this,
	// 		layers = self._map.getLayersVisibleAtScale();
	// 	return layers;
	// };

	// /**
	//  * Changes the layer order in the map. Note that the first layer added is always the base layer, even if its order is changed.
	//  * @param  {String} layerId Specified layer id.
	//  * @param  {Number} index Refers to the location for placing the layer. The bottom most layer has an index of 0.
	//  * @returns {None}
	//  */
	// MapHelper.prototype._reorderLayer = function(layerId, index)
	// {
	// 	var self = this,
	// 		layer = self._getMapLayer(layerId);

	// 	if (layer === undefined)
	// 	{
	// 		return;
	// 	}

	// 	self._map.reorderLayer(layer, index);
	// };

	// MapHelper.prototype.getMapGraphicsLayerIndex = function(graphicsLayerId)
	// {
	// 	var self = this,
	// 		graphicsLayerIds = self._map.graphicsLayerIds;
	// 	return $.inArray(graphicsLayerId, graphicsLayerIds);
	// };

	// /**
	//  * Changes the layer's refresh interval to the given value (in minutes).
	//  * @param  {String} layerId Specified layer id.
	//  * @param  {Number} interval Refresh interval of the layer in minutes. 
	//  * 							 Non-zero value indicates automatic layer refresh at the specified interval.
	//  * 							 Value of 0 indicates auto refresh is not enabled.
	//  * @returns {None}
	//  */
	// MapHelper.prototype.updateLayerRefreshInterval = function(layerId, interval)
	// {
	// 	var self = this,
	// 		layer = self._getMapLayer(layerId);
	// 	if (layer === undefined)
	// 	{
	// 		return;
	// 	}

	// 	// if (layer.setRefreshInterval)
	// 	// {
	// 	layer.refreshInterval = interval;
	// 	// }
	// 	// else
	// 	// {
	// 	// 	console.error("Unsupported setRefreshInterval by layer " + layerId);
	// 	// }
	// };

	// /**
	//  * Sets the opacity of the layer. Values range from 0.0 to 1.0, where 0.0 is 100% transparent and 1.0 has no transparency.
	//  * @param  {String} layerId Specified layer id.
	//  * @param  {Double} opacity Opacity value.
	//  * @returns {None}
	//  */
	// MapHelper.prototype.updateLayerOpacity = function(layerId, opacity)
	// {
	// 	var self = this,
	// 		layer = self._getMapLayer(layerId);

	// 	if (layer === undefined)
	// 	{
	// 		return;
	// 	}

	// 	layer.opacity = opacity;
	// };

	// /**
	//  * Show layer on the map.
	//  * @param  {String} layerId Specified layer id.
	//  * @returns {None}
	//  */
	// MapHelper.prototype.showLayer = function(layerId)
	// {
	// 	var self = this,
	// 		layer = self._getMapLayer(layerId);

	// 	if (layer === undefined)
	// 	{
	// 		return;
	// 	}
	// 	layer.visible = true;
	// };

	// /**
	//  * Hide layer on the map.
	//  * @param  {String} layerId Specified layer id.
	//  * @returns {None}
	//  */
	// MapHelper.prototype.hideLayer = function(layerId)
	// {
	// 	var self = this,
	// 		layer = self._getMapLayer(layerId);

	// 	if (layer === undefined)
	// 	{
	// 		return;
	// 	}
	// 	layer.visible = false;
	// };

	// /**
	//  * Zoom to full extent of the layer graphics.
	//  * @param  {String} layerId Specified layer id.
	//  */
	// MapHelper.prototype.zoomToLayer = function(layerId)
	// {
	// 	var self = this,
	// 		layer = self._getMapLayer(layerId);

	// 	if (layer === undefined)
	// 	{
	// 		return;
	// 	}
	// 	var reprojectPromise = Promise.resolve([layer.fullExtent]);
	// 	if (layer.spatialReference.wkid != self._map.mapView.spatialReference.wkid)
	// 	{
	// 		var targetSR = new tf.map.ArcGIS.SpatialReference({ wkid: 102100 });
	// 		if (tf.map.ArcGIS.webMercatorUtils.canProject(layer.fullExtent, targetSR))
	// 		{
	// 			var extent = tf.map.ArcGIS.webMercatorUtils.project(layer.fullExtent, targetSR);
	// 			reprojectPromise = Promise.resolve([extent]);
	// 		} else
	// 		{
	// 			var fullExtents = null;
	// 			if (layer.fullExtent)
	// 			{
	// 				fullExtents = [layer.fullExtent];
	// 			}
	// 			else
	// 			{
	// 				if (layer.fullExtents && layer.fullExtents.length > 0)
	// 				{
	// 					fullExtents = layer.fullExtents;
	// 				}
	// 			}
	// 			if (!fullExtents) return;
	// 			var geometryService = new tf.map.ArcGIS.GeometryService("http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer");
	// 			var params = new tf.map.ArcGIS.ProjectParameters({
	// 				geometries: fullExtents,
	// 				outSpatialReference: targetSR
	// 			});
	// 			reprojectPromise = geometryService.project(params);
	// 		}
	// 	}
	// 	reprojectPromise.then(function(fullExtent)
	// 	{
	// 		if (fullExtent && fullExtent[0])
	// 		{
	// 			self._map.mapView.center = fullExtent[0].center;
	// 			self._map.mapView.zoom = 16;
	// 		}
	// 		else
	// 		{
	// 			var graphics = layer.graphics,
	// 				graphicsUtils = self._arcgis.graphicsUtils;
	// 			if (graphics && graphics.length > 0)
	// 			{
	// 				var extent = graphicsUtils.graphicsExtent(graphics);
	// 				if (extent)
	// 				{
	// 					self._map.mapView.extent = extent;
	// 				}
	// 			}
	// 		}
	// 	})
	// };

	// /**
	//  * Removes the specified layer from the map.
	//  * @param  {String} layerId Specified layer id.
	//  * @returns {None}
	//  */
	// MapHelper.prototype.removeLayer = function(layerId)
	// {
	// 	var self = this,
	// 		layer = self._getMapLayer(layerId);

	// 	if (layer === undefined)
	// 	{
	// 		return;
	// 	}

	// 	self._map.remove(layer);
	// };

	// MapHelper.prototype.updateLayerIndex = function(layerId, updateIndex)
	// {
	// 	var self = this,
	// 		layer = self._getMapLayer(layerId);

	// 	if (layer === undefined)
	// 	{
	// 		return;
	// 	}

	// 	var layerIndex = self.getMapGraphicsLayerIndex(layerId);

	// 	if (layerIndex === updateIndex)
	// 	{
	// 		return;
	// 	}

	// 	self._map.remove(layer);
	// 	self._map.add(layer, updateIndex);
	// };

	// /**
	//  * Update the graphics symbol color.
	//  * @param  {String} layerId Specified layer id.
	//  * @param  {Array} color format: [r, g, b, a1, a2], a1 - fill opacity, a2 - border opacity
	//  * @returns {None}
	//  */
	// MapHelper.prototype.updateLayerSymbolColor = function(layerId, color)
	// {
	// 	if (Array.isArray(color) && color.length !== 5)
	// 	{
	// 		console.error("Invalid format of color [r, g, b, a1, a2].");
	// 		return;
	// 	}

	// 	var self = this,
	// 		layer = self._getMapLayer(layerId);

	// 	if (layer === undefined)
	// 	{
	// 		return;
	// 	}

	// 	if (layer.declaredClass !== "esri.layers.GraphicsLayer")
	// 	{
	// 		console.error("Could not update layer symbol color on " + layer.declaredClass);
	// 		return;
	// 	}

	// 	var graphics = layer.graphics;
	// 	for (var i = 0, count = graphics.length; i < count; i++)
	// 	{
	// 		var graphic = graphics[i];
	// 		var symbol = graphic.symbol;
	// 		var geometryType = graphic.geometry.type;

	// 		if (geometryType !== "point" && geometryType !== "polyline" && geometryType !== "polygon")
	// 		{
	// 			console.warn("Unsupported geometry type: " + geometryType);
	// 			continue;
	// 		}

	// 		if (symbol && symbol.color)
	// 		{
	// 			symbol.color.r = color[0];
	// 			symbol.color.g = color[1];
	// 			symbol.color.b = color[2];
	// 			symbol.color.a = color[3];

	// 			if (geometryType === "polygon" && symbol.outline && symbol.outline.color)
	// 			{
	// 				symbol.outline.color.r = color[0];
	// 				symbol.outline.color.g = color[1];
	// 				symbol.outline.color.b = color[2];
	// 				symbol.outline.color.a = color[4];
	// 			}
	// 		}
	// 	}
	// 	layer.redraw();
	// };

	// MapHelper.prototype._upLayerIndex = function(layerId)
	// {
	// 	var self = this,
	// 		layerIndex = self._getMapLayerIndex(layerId);

	// 	if (layerIndex === 0)
	// 	{
	// 		return;
	// 	}

	// 	self._reorderLayer(layerId, layerIndex - 1);
	// };

	// MapHelper.prototype._downLayerIndex = function(layerId)
	// {
	// 	var self = this,
	// 		layerIndex = self._getMapLayerIndex(layerId),
	// 		nextLayerIndex = layerIndex + 1,
	// 		nextLayer = self._getMapLayerByLayerIndex(nextLayerIndex);

	// 	if (nextLayer !== null)
	// 	{
	// 		self._reorderLayer(nextLayer.id, layerIndex);
	// 	}
	// 	else
	// 	{
	// 		console.error("Can not get next layer (" + nextLayerIndex + ")");
	// 	}
	// };

	// MapHelper.prototype.setLayerScaleRange = function(layerId, visibleRange)
	// {
	// 	var self = this,
	// 		layer = self._map.findLayerById(layerId);
	// 	if (layer)
	// 	{
	// 		if (visibleRange)
	// 		{
	// 			layer.minScale = TF.Helper.MapHelper.zoomToScale(self._map, visibleRange[0]);
	// 			layer.maxScale = TF.Helper.MapHelper.zoomToScale(self._map, visibleRange[1]);
	// 		}
	// 	}
	// 	return layer;
	// };

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

	// MapHelper.getPointExtent = function(map, point, tolerance)
	// {
	// 	var screenPoint = map.toScreen ? map.toScreen(point) : map.mapView.toScreen(point);
	// 	tolerance = tolerance || 10;
	// 	var p1, p2;
	// 	if (screenPoint.offset)
	// 	{
	// 		p1 = map.toMap(screenPoint.offset(-tolerance, tolerance));
	// 		p2 = map.toMap(screenPoint.offset(tolerance, -tolerance));
	// 	} else
	// 	{
	// 		var s1 = {};
	// 		s1.x = screenPoint.x - tolerance;
	// 		s1.y = screenPoint.y + tolerance;
	// 		var s2 = {};
	// 		s2.x = screenPoint.x + tolerance;
	// 		s2.y = screenPoint.y - tolerance;
	// 		p1 = map.mapView.toMap(s1);
	// 		p2 = map.mapView.toMap(s2);
	// 	}
	// 	var extent = new tf.map.ArcGIS.Extent(p1.x, p1.y, p2.x, p2.y, map.spatialReference || map.mapView.spatialReference);
	// 	return extent;
	// };

	// MapHelper.getXY = function(geometry)
	// {
	// 	return tf.map.ArcGIS.webMercatorUtils.webMercatorToGeographic(geometry);
	// };

	// MapHelper.addLayer = function(map, layer)
	// {
	// 	map.layers.add(layer);
	// };

	// MapHelper.removeLayer = function(map, layer)
	// {
	// 	map.layers.remove(layer);
	// };

	// /**
	// * remove all graphics in layer
	// */
	// MapHelper.clearLayer = function(layer)
	// {
	// 	if (layer.type == "graphics")
	// 	{
	// 		layer.removeAll();
	// 		return Promise.resolve();
	// 	}
	// 	if (layer.type == "feature")
	// 	{
	// 		return layer.queryFeatures().then(function(featureSet)
	// 		{
	// 			if (featureSet.features.length > 0)
	// 			{
	// 				return layer.applyEdits({ deleteFeatures: featureSet.features });
	// 			}
	// 		});
	// 	}
	// };

	// MapHelper.getFeatureLayerRender = function(options)
	// {
	// 	if (options.uniqueValueInfos && options.uniqueValueInfos.length > 0)
	// 	{
	// 		options = $.extend({ uniqueValueInfos: [] }, options);
	// 		var valueField = options.field || "id";
	// 		var uniqueValueInfos = options.uniqueValueInfos.map(function(info)
	// 		{
	// 			var symbol;
	// 			if (info.symbol)
	// 			{
	// 				symbol = info.symbol;
	// 			} else
	// 			{
	// 				symbol = $.extend({}, options.symbol);
	// 				if (symbol.color)
	// 				{
	// 					symbol.color = info.color;
	// 				}
	// 			}
	// 			return {
	// 				value: info[valueField],
	// 				symbol: symbol
	// 			};
	// 		});

	// 		return {
	// 			type: "unique-value",
	// 			field: valueField,
	// 			defaultSymbol: options.symbol,
	// 			uniqueValueInfos: uniqueValueInfos
	// 		};
	// 	}
	// 	return {
	// 		type: "simple",
	// 		symbol: options.symbol
	// 	};
	// };

	MapHelper.setMapCursor = function(map, cursorString)
	{
		var cursor = cursorString;
		$(map.mapView.container).removeClass("pin-cursor");
		if (cursorString == "locate")
		{
			cursor = "url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAaCAYAAAC+aNwHAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAABZ0lEQVQ4y5WTMUsDQRCFvztSWBhr8Rek0EqslCg6oAYEwdY6tV1AbASxyd+wsRAECwmMYEArsdLCzk5SexZpJBbZC3tzt3fnwBX75r2ZtztzESZE5BA4AnaBOQePgQFwo6q3Pj/yhAvAFXBAedwBx6r6PSsgIvPAC9CiXnwAa6r6EzvgOiD+dZ+NltMQicgecG8II+AUeHTnLeASWDS8/QbQLRCvquqXh32KyAB4NUW6MdA2BXpGDIDDegZux0DTAyZMxxWKgeOk0YwLSJOSArlcDCTeOQI6JQU6eLsDJDEwNKS+iCxZpcP6Bh5GIrINPJjECDjzim8CF+THuJNu4hOwXnLnqCD3rKob6SOeB+4cBcQzjf8zvQHL1It3VV2B6RTS6NUUZ7gZezVdzLpbB3VdZDi5B6pwkele5KDKRS5XOKKAi1z3kIOQi0JnoSWxLgq7lzmwHf+zIxkXiYgkZZxGRY2TqiZ/HZNl0jX5bvAAAAAASUVORK5CYII=\") 8 24, auto";
		} else if (cursorString == "locate-white")
		{
			cursor = "url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAaCAYAAAC+aNwHAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAABC0lEQVQ4y5WSMapCQQxFo/xSbAU74a9EEORVrkAQN+Cefq2F4A7cwStcgqBWvkoQj80MDPmTybwLKSZzc3MnGREFYAX8ATfgGeIWciuxAIyBIz6OwFgXj4BLRXHEBRilAieD+A6RwykWLzOXV2ADzEJsQk5jKcAhUzzNzGiaETkI8FDJdWHQa8V9CPBKEh9gUhCYBE7Ea5jjiY1/d0MR6ZLzQESagkATOBGdAHv1rnthiHfF3QswN9a4BX5DbI01zqP62fgsHzW0FOfU3oL+WOg3tj2K29yOmx4C+U1VumjFQqWL0j9xXbTiwXHRuAIFF353x0Vdd8NFfXfDRb/uiUgHdCXOj6Ox85p8Aa3WhV7ZByO1AAAAAElFTkSuQmCC\") 8 24, auto";
		} else if (cursorString == "pin")
		{
			$(map.mapView.container).addClass("pin-cursor");
		}
		map.mapView.container.style.cursor = cursor;

		if (["default", "locate", "locate-white", "pin"].indexOf(cursorString) >= 0)
		{
			$(map.mapView.container).find(".esri-view-surface[data-interacting='true']").attr("data-interacting", false);
		}
	};

	// MapHelper.getLayer = function(map, id)
	// {
	// 	return map.findLayerById(id);
	// };

	// MapHelper.disableDoubleClickZoom = function(map)
	// {
	// 	if (map.mapView)
	// 	{
	// 		if (!map._viewDoubleClickEvent)
	// 		{
	// 			map._viewDoubleClickEvent = map.mapView.on("double-click", function(event)
	// 			{
	// 				event.stopPropagation();
	// 			});
	// 		}
	// 	}
	// 	else
	// 	{
	// 		map.disableDoubleClickZoom();
	// 	}
	// };

	// // Each ring is a two-dimensional array, the rings should be a three-dimensional array.
	// MapHelper._generatePolygonByRing = function(rings)
	// {
	// 	return new tf.map.ArcGIS.Polygon({
	// 		rings: rings,
	// 		spatialReference: { wkid: 3857 }
	// 	});
	// };

	// MapHelper.enableDoubleClickZoom = function(map)
	// {
	// 	if (map.mapView)
	// 	{
	// 		if (map._viewDoubleClickEvent)
	// 		{
	// 			map._viewDoubleClickEvent.remove();
	// 			map._viewDoubleClickEvent = null;
	// 		}
	// 	}
	// 	else
	// 	{
	// 		map.enableDoubleClickZoom();
	// 	}
	// };

	// MapHelper.disablePan = function(map)
	// {
	// 	if (map.mapView)
	// 	{
	// 		map._viewDragEvent = map.mapView.on('drag', function(event)
	// 		{
	// 			event.stopPropagation();
	// 		});

	// 		map._viewKeyDownEvent = map.mapView.on('key-down', function(event)
	// 		{
	// 			var keyPressed = event.key;
	// 			if (keyPressed.slice(0, 5) === "Arrow")
	// 			{
	// 				event.stopPropagation();
	// 			}
	// 		});
	// 	}
	// 	else
	// 	{
	// 		map.disablePan();
	// 	}
	// };

	// MapHelper.enablePan = function(map)
	// {
	// 	if (map.mapView)
	// 	{
	// 		if (map._viewDragEvent)
	// 		{
	// 			map._viewDragEvent.remove();
	// 			map._viewDragEvent = null;
	// 		}

	// 		if (map._viewKeyDownEvent)
	// 		{
	// 			map._viewKeyDownEvent.remove();
	// 			map._viewKeyDownEvent = null;
	// 		}
	// 	}
	// 	else
	// 	{
	// 		map.enablePan();
	// 	}
	// };

	MapHelper.centerAndZoom = function(map, point, zoom)
	{
		map.mapView.center = new tf.map.ArcGIS.Point({ x: point.x, y: point.y, spatialReference: { wkid: point.spatialReference.wkid } });
		map.mapView.zoom = zoom;
	};

	// MapHelper.setExtent = function(map, extent)
	// {
	// 	if (extent)
	// 	{
	// 		map.mapView.extent = extent;
	// 	}
	// };

	// MapHelper.getMapGraphicsLayerIds = function(map)
	// {
	// 	var layers = map.layers.toArray(),
	// 		graphicsLayers = layers.filter(function(layer)
	// 		{
	// 			return layer.type === 'graphics';
	// 		});
	// 	return graphicsLayers.map(function(layer)
	// 	{
	// 		return layer.id;
	// 	});
	// };

	// MapHelper.getMapLayerIndex = function(map, layerId)
	// {
	// 	var layers = map.layers.toArray(),
	// 		layerIds = layers.map(function(layer)
	// 		{
	// 			return layer.id;
	// 		});
	// 	return $.inArray(layerId, layerIds);
	// };

	MapHelper.bind = function(map, event, callback)
	{
		if (event.indexOf("zoom") >= 0)
		{
			return map.mapView.watch("zoom", function(newValue, oldValue)
			{
				if (newValue != oldValue)
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

	// MapHelper.getGraphics = function(layer)
	// {
	// 	if (layer.graphics.items)
	// 	{
	// 		return layer.graphics.items;
	// 	}
	// 	return layer.graphics;
	// };

	// MapHelper.setAttributes = function(graphic, attributes)
	// {
	// 	if (graphic.setAttributes)
	// 	{
	// 		graphic.setAttributes(attributes);
	// 	} else
	// 	{
	// 		graphic.attributes = attributes;
	// 	}
	// };

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

	// MapHelper.layerVisible = function(map, layer)
	// {
	// 	var scale = map.mapView.scale;
	// 	return layer.visible && (layer.minScale == 0 || layer.minScale >= scale) && (layer.maxScale == 0 || layer.maxScale <= scale);
	// };

	// MapHelper.zoomToScale = function(map, zoom)
	// {
	// 	var ret = 70.5310735;
	// 	if (!map) return ret;

	// 	var lods = (map.mapView.constraints && map.mapView.constraints.effectiveLODs) || LOD;
	// 	for (var i = 0, l = lods.length; i < l; i++)
	// 	{
	// 		if (lods[i].level == zoom)
	// 		{
	// 			return lods[i].scale;
	// 		}
	// 	}
	// 	return ret;
	// };

	// MapHelper.scaleToZoom = function(map, scale)
	// {
	// 	var lods = (map.mapView.constraints && map.mapView.constraints.effectiveLODs) || LOD;
	// 	for (var i = 0, l = lods.length; i < l; i++)
	// 	{
	// 		if (lods[i].scale == scale)
	// 		{
	// 			return lods[i].level;
	// 		}
	// 	}
	// 	return 23;
	// };

	// MapHelper.getOrder = function(map, layerId)
	// {
	// 	var layers = map.layers.items;
	// 	for (var i = 0; i < layers.length; i++)
	// 	{
	// 		if (layers[i].id == layerId)
	// 		{
	// 			return i;
	// 		}
	// 	}
	// 	return layers.length;
	// };

	MapHelper.getAllBaseMaps = function()
	{
		return BASE_MAPS;
	};

	MapHelper.getBaseMapById = function(baseMapId)
	{
		if (baseMapId === "my-maps")
		{
			baseMapId = "white-canvas";
		}

		const baseMap = BASE_MAPS.find(o => o.id === baseMapId) || BASE_MAPS.find(o => o.isDefault);

		return typeof baseMap.getBaseMap === "function" ? baseMap.getBaseMap() : baseMap.id;
	};

	MapHelper.createMap = function(element, creator, options)
	{
		var baseMapId = options && options.baseMapSaveKey ? tf.userPreferenceManager.get(options.baseMapSaveKey) : "";
		if (baseMapId === "" && options.baseMapId)
		{
			baseMapId = options.baseMapId;
		}
		var mapMinZoom = options && options.minZoom || MapHelper.MAP_MIN_ZOOM_LEVEL;
		var map = new tf.map.ArcGIS.Map({
			basemap: MapHelper.getBaseMapById(baseMapId)
		});
		var view = new tf.map.ArcGIS.MapView({
			container: element[0],
			map: map,
			spatialReference: {
				wkid: 102100
			},
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
			if (e.button == 2)
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
				};
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
				mapHeight = mapExtent.ymax - mapExtent.ymin;
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

		mapView.watch("extent", async function(value) { resetMapExtent(); });
	}

	MapHelper.prototype.dispose = function()
	{
		var self = this;
		self._map = null;
		self._arcgis = null;
	};

})();