(function()
{
	createNamespace("TF.GIS.Layer").PathLayer = PathLayer;

	function PathLayer(options)
	{
		TF.GIS.Layer.call(this, options);
	}

	PathLayer.prototype = Object.create(TF.GIS.Layer.prototype);
	PathLayer.prototype.constructor = PathLayer;

	PathLayer.prototype.create = function()
	{
		TF.GIS.Layer.prototype.create.call(this, this.LAYER_TYPE.GRAPHIC);
	}

	PathLayer.prototype.addPath = function(pathGraphic, afterAdd = null)
	{
		this.add(pathGraphic, afterAdd);
	}

	PathLayer.prototype.deletePath = function(pathGraphic)
	{
		this.remove(pathGraphic);
	}

	PathLayer.prototype.updateColor = function(graphics, color, createPathSymbol)
	{
		if (!createPathSymbol instanceof Function)
		{
			throw new Error("invalid parameter: createPathSymbol");
		}

		for (let i = 0; i < graphics.length; i++)
		{
			const graphic = graphics[i];
			graphic.symbol =  createPathSymbol(color);
			graphic.attributes.Color = color;
		}
	}

	PathLayer.prototype.dispose = function()
	{
	}
})();