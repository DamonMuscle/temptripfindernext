(function()
{
	createNamespace("TF.GIS.Layer").PathLayer = PathLayer;

	function PathLayer(options)
	{
		const self = this;
		TF.GIS.Layer.call(self, options);
		
		self.symbolHelper = new TF.Map.Symbol();
	}

	PathLayer.prototype = Object.create(TF.GIS.Layer.prototype);
	PathLayer.prototype.constructor = PathLayer;

	PathLayer.prototype.create = function()
	{
		TF.GIS.Layer.prototype.create.call(this, this.LAYER_TYPE.GRAPHIC);
	}

	PathLayer.prototype.createPath = function(paths, attributes)
	{
		const DEFAULT_STOP_COLOR = "#FFFFFF"
		const Color = attributes.Color || DEFAULT_STOP_COLOR;
		const symbol = this.symbolHelper.tripPath(Color);
		const graphic = this.createPolylineGraphic(paths, symbol, attributes);
		return graphic;
	}

	PathLayer.prototype.createHighlightPath = function(paths, attributes)
	{
		const Color = [253, 245, 53, 0.7];
		const symbol = this.symbolHelper.tripPath(Color);
		symbol.width = symbol.width + 4;
		const graphic = this.createPolylineGraphic(paths, symbol, attributes);
		return graphic;
	}

	PathLayer.prototype.addPath = function(pathGraphic, afterAdd = null)
	{
		this.add(pathGraphic, afterAdd);
	}

	PathLayer.prototype.deletePath = function(pathGraphic)
	{
		this.remove(pathGraphic);
	}

	PathLayer.prototype.updateColor = function(graphics, color)
	{
		for (let i = 0; i < graphics.length; i++)
		{
			const graphic = graphics[i];
			graphic.symbol =  this.symbolHelper.tripPath(color);
			graphic.attributes.Color = color;
		}
	}

	PathLayer.prototype.dispose = function()
	{
		if (this.symbolHelper)
		{
			this.symbolHelper.dispose();
			this.symbolHelper = null;
		}
	}
})();