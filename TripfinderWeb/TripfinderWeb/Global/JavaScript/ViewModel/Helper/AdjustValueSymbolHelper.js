(function()
{
	createNamespace('TF.Helper').AdjustValueSymbolHelper = AdjustValueSymbolHelper;

	function AdjustValueSymbolHelper()
	{
		var self = this;
		self.getSVGSymbolString = self.getSVGSymbolString.bind(self);
	}

	AdjustValueSymbolHelper.prototype.constructor = AdjustValueSymbolHelper;

	AdjustValueSymbolHelper.symbolDefaultSize = 11;

	AdjustValueSymbolHelper.getOriginSVGSymbolString = function(symbolnumber)
	{
		var self = this, symbolString = "", pathString = "", viewBox;
		if (symbolnumber === "-1")
		{
			pathString = thematicSymbolPath[0].pathString;
			symbolString = "<svg version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' xml:space='preserve'" +
				" viewboxstring='" + thematicSymbolPath[0].viewBox + "'>" +
				pathString + "</svg>";
		}
		else
		{
			for (var i = 0; i < thematicSymbolPath.length; i++)
			{
				if (thematicSymbolPath[i].id === Number(symbolnumber))
				{
					pathString = thematicSymbolPath[i].pathString;
					viewBox = thematicSymbolPath[i].viewBox;
				}
			}
			symbolString = "<svg version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' xml:space='preserve'" +
				" viewboxstring='" + viewBox + "'>" +
				pathString + "</svg>";

		}
		return symbolString;
	};

	/**
	 * The getSVGSymbolString function.
	 * @param {string} symbolnumber the number of the symbol.
	 * @param {string} symbolcolor the color of the symbol.
	 * @param {string} symbolsize the size of the symbol.
	 * @param {string} bordercolor the color of the symbol's border.
	 * @param {string} bordersize the size of the symbol's border.
	 * @param {string} maxdisplaySize the max of size to shown on the html.
	 * @returns {string} the string of symbol html
	 */
	AdjustValueSymbolHelper.getSVGSymbolString = function(symbolnumber, symbolcolor, symbolsize, bordercolor, bordersize, maxdisplaySize)
	{
		var self = this, scale,
			symbolString = self.getOriginSVGSymbolString(symbolnumber),
			$symbol = $(symbolString);

		// $symbol.find("path").attr({ "vector-effect": "non-scaling-stroke" });
		if (maxdisplaySize)
		{
			maxdisplaySize = maxdisplaySize - 1;
			var displaySize = Number(symbolsize) + (bordersize ? Number(bordersize) * 2 : 0);
			if (maxdisplaySize < displaySize)
			{
				scale = maxdisplaySize / displaySize;
			}
		}
		symbolcolor = (symbolnumber === "-1") ? "transparent" : symbolcolor;
		self.changeSymbolColor($symbol, symbolcolor);
		self.changeSymbolSize($symbol, symbolsize, bordersize, maxdisplaySize, scale);
		if (bordercolor)
		{
			self.changeSymbolBorderColor($symbol, bordercolor);
		}

		return $('<div>').append($symbol).html();
	}

	/**
	 * change the symbol's stroke color.
	 * @param {object} $symbol the jquery object of symbol.
	 * @param {string} bordercolor the border color of the symbol.
	 * @returns {void}
	 */
	AdjustValueSymbolHelper.changeSymbolBorderColor = function($symbol, bordercolor)
	{
		$symbol.find("path").css({ "stroke": bordercolor });
	};

	/**
	 * change the symbol's stroke size.
	 * @param {object} $symbol the jquery object of symbol.
	 * @param {string} bordersize the border size of the symbol.
	 * @param {number} scale the scale for border size.
	 * @returns {void}
	 */
	AdjustValueSymbolHelper.changeSymbolBorderSize = function($symbol, bordersize, scale, rate)
	{
		var strokeSize = Number(bordersize);
		strokeSize = scale ? strokeSize * scale : strokeSize;
		strokeSize = rate ? strokeSize / rate : strokeSize;
		$symbol.find("path").css({ "stroke-width": strokeSize + "px" });
	};

	/**
	 * change the symbol's color.
	 * @param {object} $symbol the jquery object of symbol.
	 * @param {string} symbolcolor the color of the symbol.
	 * @returns {void}
	 */
	AdjustValueSymbolHelper.changeSymbolColor = function($symbol, symbolcolor)
	{
		$symbol.find("path").css({ "fill": symbolcolor });
	};

	/**
	 * change the symbol's size.
	 * @param {object} $symbol the jquery object of symbol.
	 * @param {string} symbolsize the size of the symbol.
	 * @param {string} bordersize the border size of the symbol.
	 * @param {number} maxdisplaySize the max size of the symbol for display.
	 * @param {number} scale the scale for border size.
	 * @returns {void}
	 */
	AdjustValueSymbolHelper.changeSymbolSize = function($symbol, symbolsize, bordersize, maxdisplaySize, scale)
	{
		bordersize = bordersize || 0;
		var self = this,
			strokeSize = Number(bordersize),
			numberSize = Number(symbolsize),
			viewBox = $symbol[0].getAttribute("viewboxstring").split(" "),
			maxLength = Math.max(Number(viewBox[2]), Number(viewBox[3])),
			rate = (strokeSize + numberSize) / maxLength,
			offset = {
				x: (strokeSize / 2 - viewBox[0] * (strokeSize + numberSize) / maxLength),
				y: (strokeSize / 2 - viewBox[1] * (strokeSize + numberSize) / maxLength)
			};
		if (scale)
		{
			$symbol.css({
				"width": maxdisplaySize + 1,
				"height": maxdisplaySize + 1
			});
		}
		else
		{
			var width = viewBox[2] * rate + strokeSize,
				height = viewBox[3] * rate + strokeSize;
			// $symbol.css({
			// 	"width": width,
			// 	"height": height
			// });
			$symbol.attr({ width: width, height: height });
		}
		if (scale)
		{
			rate *= scale;
			offset.x *= scale;
			offset.y *= scale;
		}

		$symbol.find("path").attr({ "transform": "matrix(" + rate + ",0,0," + rate + "," + offset.x + "," + offset.y + ")" });

		if (bordersize)
		{
			self.changeSymbolBorderSize($symbol, bordersize, scale, rate);
		}
	};

})();