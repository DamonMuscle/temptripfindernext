(function()
{
	createNamespace("TF.GIS").ArrowLayerHelper = ArrowLayerHelper;

	function ArrowLayerHelper(mapInstance)
	{
		if (!mapInstance)
		{
			console.error("ArrowLayerHelper constructor failed! No valid mapInstance.");
			return;
		}

		this.mapInstance = mapInstance;
		this.symbol = new TF.Map.Symbol();
	}

	ArrowLayerHelper.prototype.defineReadOnlyProperty = function(propertyName, value)
	{
		Object.defineProperty(this, propertyName, {
			get() { return value; },
			enumerable: false,
			configurable: false
		});
	};

	ArrowLayerHelper.prototype.create = function(layerId, layerIndex, renderer)
	{
		const self = this;
		const arrowLayer = self.mapInstance.addLayer({
			id: layerId,
			index: layerIndex,
			geometryType: self.mapInstance.GEOMETRY_TYPE.POINT,
			objectIdField: "oid",
			spatialReference: {
				wkid: self.mapInstance.WKID_WEB_MERCATOR
			},
			minScale: TF.Helper.MapHelper.zoomToScale(self.mapInstance.map, 13),
			fields: [
				{
					name: "oid",
					type: "oid"
				}, {
					name: "angle",
					type: "double"
				}, {
					name: "DBID",
					type: "integer"
				}, {
					name: "Id",
					type: "integer"
				}, {
					name: "Color",
					type: "string"
				}],
			source: [],
			renderer: renderer
		}, self.mapInstance.LAYER_TYPE.FEATURE);

		return arrowLayer;
	}

	ArrowLayerHelper.prototype.createUniqueValueRenderer = function(uniqueValueInfos)
	{
		const renderer = {
			type: "unique-value",
			field: "Color",
			defaultSymbol: this.symbol.arrow([255, 255, 255, 0]),
			visualVariables: [{
				type: "rotation",
				field: "angle",
				rotationType: "geographic"
			}],
			uniqueValueInfos: uniqueValueInfos
		};

		return renderer;
	}

	ArrowLayerHelper.prototype.computeArrowFeatures = function(polylineFeature, arrowOnPath)
	{
		const self = this,
		 	map = self.mapInstance.map,
			helper = TF.RoutingMap.MapEditingPalette.MyStreetsHelper,
			polyline = polylineFeature.geometry,
			paths = polyline.paths,
			unionPolyline = helper.multiPathsToSinglePath(map, paths),
			isInExtent = true;

		let arrows = [];
		for (let j = 0; j < unionPolyline.length; j++)
		{
			const geometry = unionPolyline[j];
			const arrowGraphics = helper.createArrows(map, geometry, true, [255, 0, 0], arrowOnPath, isInExtent);
			arrows = arrows.concat(arrowGraphics);
		}

		return arrows;
	}

	ArrowLayerHelper.prototype.getArrowSymbol = function(arrowOnPath, color)
	{
		return arrowOnPath ? this.symbol.arrow(color) : this.symbol.arrowOnSide(color);
	}

	ArrowLayerHelper.prototype.dispose = function()
	{
		if (this.symbol)
		{
			this.symbol.dispose();
			this.symbol = null;
		}
	}
})();