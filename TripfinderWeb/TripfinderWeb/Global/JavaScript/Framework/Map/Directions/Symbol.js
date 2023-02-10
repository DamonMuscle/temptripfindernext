(function()
{
	Tool = TF.RoutingMap.Directions.Tool;

	Tool.prototype._initSymbol = function()
	{
		var self = this;
		self._tripColor = new self._arcgis.Color([20, 89, 127, 0.75]);
		self._tripWidth = 10;
		self._highlightTripColor = new self._arcgis.Color([255, 255, 255, 0.85]);
		self._highlightTripWidth = 6;
		self._ghostPointFill = '#FFFFFF';
		self._ghostPointBorderColor = '#14597F';
		self._ghostPointBorderWidth = 3;
		self._ghostPointSize = 14;

		self._throughPointFill = '#D4E5FF';
		self._throughPointBorderColor = '#1E6389';
		self._throughPointBorderWidth = 1;
		self._throughPointSize = 9;  // in pixels

		self._firstDestinationPointFill = '#009900';
		self._destinationPointFill = '#4A77EC';
		self._lastDestinationPointFill = '#CC0000';
		self._destinationPointSize = 20;

		self._firstStopImgUrl = "../../Global/img/Routing Map/destinations/greenPoint.png";
		self._firstStopMoveImgUrl = "../../Global/img/Routing Map/destinations/greenPointMove.png";
		self._stopImgUrl = "../../Global/img/Routing Map/destinations/bluePoint.png";
		self._stopMoveImgUrl = "../../Global/img/Routing Map/destinations/bluePointMove.png";
		self._lastStopImgUrl = "../../Global/img/Routing Map/destinations/redPoint.png";
		self._lastStopMoveImgUrl = "../../Global/img/Routing Map/destinations/redPointMove.png";
		self._stopImgWidth = 21;
		self._stopImgHight = 29;
		self._stopImgXOffset = 0;
		self._stopImgYOffset = 10;

		self.roundTripStopPointUrl = '../../Global/img/direction-setting-panel/Directions-Bullseye.png';
		self.roundTripStopPointWidth = 20;
		self.roundTripStopPointHeight = 20;

		self._notReachedPointFill = '#7F7F7F';

		self._vertexPointFill = '#E5E5E5';
		self._vertexPointBorderColor = '#1E6389';
		self._vertexPointBorderWidth = 2;
		self._vertexPointSize = 7;

		self._sequenceNumberFontFamily = 'Arial';
		self._sequenceNumberFontSize = '12';
		self._sequenceNumberFontWeight = "normal";
		self._sequenceNumberFontColor = '#FFFFFF';
		self._sequenceNumberXOffset = -1;
		self._sequenceNumberYOffset = 8;

		self._currentLocationPointSize = 16;
		self._currentLocationPointPath = 'M79 497 c-50 -34 -79 -82 -79 -133 0 -35 17 -77 77 -199 43 -85 80 -155 83 -155 3 0 40 70 83 155 60 122 77 164 77 199 0 118 -144 198 -241 133z m115 -68 c58 -27 55 -115 -5 -139 -63 -26 -125 36 -100 99 19 44 60 60 105 40z';
		self._currentLocationPointXOffset = 0;
		self._currentLocationPointYOffset = 10;
		self._currentLocationPointDarkFill = '#4B4B4B';
		self._currentLocationPointDarkBorder = '#797979';
		self._currentLocationPointLightFill = '#FFFFFF';
		self._currentLocationPointLightBorder = '#333333';

		self._connectionLineColor = '#3485F0';
		self._connectionLineWidth = 1;

		self._colorThematic = ko.observable();
		self._updateColorThematic();
	};

	Tool.prototype._disposeSymbol = function()
	{
		var self = this;
		self._tripColor = null;
		self._tripWidth = null;
		self._highlightTripColor = null;
		self._highlightTripWidth = null;

		self._throughPointFill = null;
		self._throughPointBorderColor = null;
		self._throughPointBorderWidth = null;
		self._throughPointSize = null;

		self._firstDestinationPointFill = null;
		self._destinationPointFill = null;
		self._lastDestinationPointFill = null;
		self._destinationPointSize = null;

		self._firstStopImgUrl = null;
		self._firstStopMoveImgUrl = null;
		self._stopImgUrl = null;
		self._stopMoveImgUrl = null;
		self._lastStopImgUrl = null;
		self._lastStopMoveImgUrl = null;
		self._stopImgWidth = null;
		self._stopImgHight = null;
		self._stopImgXOffset = null;
		self._stopImgYOffset = null;

		self._vertexPointFill = null;
		self._vertexPointBorderColor = null;
		self._vertexPointBorderWidth = null;
		self._vertexPointSize = null;

		self._sequenceNumberFontFamily = null;
		self._sequenceNumberFontSize = null;
		self._sequenceNumberFontWeight = null;
		self._sequenceNumberFontColor = null;
		self._sequenceNumberXOffset = null;
		self._sequenceNumberYOffset = null;

		self._currentLocationPointSize = null;
		self._currentLocationPointPath = null;
		self._currentLocationPointXOffset = null;
		self._currentLocationPointYOffset = null;
		self._currentLocationPointDarkFill = null;
		self._currentLocationPointDarkBorder = null;
		self._currentLocationPointLightFill = null;
		self._currentLocationPointLightBorder = null;

		self._connectionLineColor = null;
		self._connectionLineWidth = null;

		self._colorThematic = null;
	};

	Tool.prototype._tripSymbol = function()
	{
		var self = this;
		return {
			type: "simple-line",
			color: self._tripColor,
			width: self._tripWidth + "px",
			style: "solid",
			cap: "round",
			join: "round",
		};
	};

	Tool.prototype._highlightTripSymbol = function()
	{
		var self = this;
		return {
			type: "simple-line",
			color: self._highlightTripColor,
			width: self._highlightTripWidth + "px",
			style: "solid",
			cap: "round",
			join: "round",
		};
	};

	// Tool.prototype._directionTripSymbol = function(color, width, style, alpha)
	// {
	// 	var _color = color ? this._arcgis.Color.fromHex(color) : new this._arcgis.Color(this._thematicColor),
	// 		_alpha = alpha ? alpha : 1,
	// 		_colorObj = { r: _color.r, g: _color.g, b: _color.b, a: _alpha },
	// 		_style = style ? style : 'solid',
	// 		_width = width ? width : 6,
	// 		_options = {
	// 			'sytle': _style,
	// 			'color': _colorObj,
	// 			'width': _width,
	// 			'directionSymbol': 'arrow2',
	// 			'directionPixelBuffer': 25,
	// 			'directionColor': _colorObj,
	// 			'directionSize': 16
	// 		};

	// 	return new this._arcgis.DirectionalLineSymbol(_options);
	// };

	Tool.prototype._stopSequenceSymbol = function(sequence)
	{
		var self = this;
		return {
			type: "text",
			color: self._sequenceNumberFontColor,
			text: sequence,
			font: {
				family: self._sequenceNumberFontFamily,
				size: self._sequenceNumberFontSize,
				weight: self._sequenceNumberFontWeight,
			},
			xoffset: self._sequenceNumberXOffset,
			yoffset: self._sequenceNumberYOffset
		};
	};

	Tool.prototype._stopSequenceNotReachedSymbol = function(sequence)
	{
		var self = this;
		return {
			type: "text",
			color: self._sequenceNumberFontColor,
			text: sequence,
			font: {
				family: self._sequenceNumberFontFamily,
				size: self._sequenceNumberFontSize,
				weight: self._sequenceNumberFontWeight,
			},
			xoffset: 0,
			yoffset: -5
		};
	};

	Tool.prototype._stopSymbol = function()
	{
		var self = this;
		return {
			type: "picture-marker",
			url: self._stopImgUrl,
			width: self._stopImgWidth,
			height: self._stopImgHight,
			xoffset: self._stopImgXOffset,
			yoffset: self._stopImgYOffset
		};
	};

	Tool.prototype._stopMoveSymbol = function()
	{
		var self = this;
		return {
			type: "picture-marker",
			url: self._stopMoveImgUrl,
			width: self._stopImgWidth,
			height: self._stopImgHight,
			xoffset: self._stopImgXOffset,
			yoffset: self._stopImgYOffset
		};
	};

	Tool.prototype._stopNotReachedSymbol = function()
	{
		var self = this;
		return {
			type: "simple-marker",
			size: self._destinationPointSize,
			color: self._notReachedPointFill,
			outline: null
		};
	};

	Tool.prototype._firstStopSymbol = function()
	{
		var self = this;
		return {
			type: "picture-marker",
			url: self._firstStopImgUrl,
			width: self._stopImgWidth,
			height: self._stopImgHight,
			xoffset: self._stopImgXOffset,
			yoffset: self._stopImgYOffset
		};
	};

	Tool.prototype._firstStopMoveSymbol = function()
	{
		var self = this;
		return {
			type: "picture-marker",
			url: self._firstStopMoveImgUrl,
			width: self._stopImgWidth,
			height: self._stopImgHight,
			xoffset: self._stopImgXOffset,
			yoffset: self._stopImgYOffset
		};
	};

	Tool.prototype._lastStopSymbol = function()
	{
		var self = this;
		return {
			type: "picture-marker",
			url: self._lastStopImgUrl,
			width: self._stopImgWidth,
			height: self._stopImgHight,
			xoffset: self._stopImgXOffset,
			yoffset: self._stopImgYOffset
		};
	};

	Tool.prototype._lastStopMoveSymbol = function()
	{
		var self = this;
		return {
			type: "picture-marker",
			url: self._lastStopMoveImgUrl,
			width: self._stopImgWidth,
			height: self._stopImgHight,
			xoffset: self._stopImgXOffset,
			yoffset: self._stopImgYOffset
		};
	};

	Tool.prototype._roundTripStopSymbol = function()
	{
		var self = this;
		return {
			type: "picture-marker",
			url: self.roundTripStopPointUrl,
			width: self.roundTripStopPointWidth,
			height: self.roundTripStopPointHeight
		};
	};

	Tool.prototype._currentLocationSymbol = function()
	{
		var self = this,
			isDark = self._isDarkMapTheme();
		return {
			type: "simple-marker",
			path: self._currentLocationPointPath,
			angle: 180,
			size: self._currentLocationPointSize,
			xoffset: self._currentLocationPointXOffset,
			yoffset: self._currentLocationPointYOffset,
			color: isDark ? self._currentLocationPointLightFill : self._currentLocationPointDarkFill
		};
	};

	Tool.prototype._throughStopSymbol = function()
	{
		var self = this;
		return {
			type: "simple-marker",
			size: self._throughPointSize,
			color: self._throughPointFill,
			outline: {
				type: "simple-line",
				width: self._throughPointBorderWidth,
				color: self._throughPointBorderColor
			}
		};
	};

	Tool.prototype._vertexSymbol = function()
	{
		var self = this;
		return {
			type: "simple-marker",
			size: self._vertexPointSize,
			color: self._vertexPointFill,
			outline: {
				type: "simple-line",
				width: self._vertexPointBorderWidth,
				color: self._vertexPointBorderColor
			}
		};
	};

	/**
	 * The cursor symbol over route
	 * @returns {SimpleMarkerSymbol}
	 */
	Tool.prototype._ghostSymbol = function()
	{
		var self = this;
		return {
			type: 'simple-marker',
			size: self._ghostPointSize,
			color: self._ghostPointFill,
			outline: {
				type: "simple-line",
				style: "solid",
				color: self._ghostPointBorderColor,
				width: self._ghostPointBorderWidth
			}
		};
	};

	Tool.prototype._destinationConnectionLineSymbol = function()
	{
		var self = this;
		return {
			type: "simple-line",
			style: "solid",
			color: self._connectionLineColor,
			width: self._connectionLineWidth
		}
	};

	Tool.prototype._refreshDirectionsStyle = function()
	{
		// triggered when map thematic color is changed.
		this._switchCurrentLocationStyle();
		this._switchPopupMenuStyle();
	};

	Tool.prototype._switchCurrentLocationStyle = function()
	{
		var self = this,
			cursorGraphics = self._cursorLayer.graphics;
		if (cursorGraphics.length > 0)
		{
			var graphic = cursorGraphics[0],
				symbol = self._currentLocationSymbol();

			graphic.setSymbol(symbol);
		}
	};

	Tool.prototype._switchPopupMenuStyle = function()
	{
		var $popup = $('.direction-popup-menu'),
			$btnRight = null,
			$btnLeft = null,
			$labelRight = null,
			$labelLeft = null,
			theme = null,
			reverseTheme = null;

		if ($popup.length > 0)
		{
			theme = this._colorThematic();
			reverseTheme = this._getReverseThematic();

			for (var i = 0, length = $popup.length; i < length; i++)
			{
				$btnLeft = $($popup[i].firstChild);
				$btnRight = $($popup[i].lastChild);

				if ($btnLeft[0].className.endsWith(theme))
				{
					$btnLeft.removeClass(theme).addClass(reverseTheme);
					$btnRight.removeClass(theme).addClass(reverseTheme);
				}

				$labelLeft = $($btnLeft[0].firstChild);
				$labelRight = $($btnRight[0].firstChild);

				if ($labelLeft[0].className.endsWith(reverseTheme))
				{
					$labelLeft.removeClass(reverseTheme).addClass(theme);
					$labelRight.removeClass(reverseTheme).addClass(theme);
				}
			}
		}
	};

	Tool.prototype._getReverseThematic = function()
	{
		return this._isLightMapTheme() ? 'dark' : 'light';
	};

	Tool.prototype._isDarkMapTheme = function()
	{
		return this._colorThematic() === 'dark'
	};

	Tool.prototype._isLightMapTheme = function()
	{
		return this._colorThematic() === 'light';
	};

	Tool.prototype._getDirectionStopSymbol = function(sequence, movable)
	{
		var self = this,
			symbol = lastDestination = null;
		if (self._noReachedRoute)
		{
			symbol = self._stopNotReachedSymbol();
		}
		else
		{
			lastDestination = self._destinations[self._destinations.length - 1];
			if (sequence === 1)
			{
				symbol = self.isRoundTrip ? self._roundTripStopSymbol() :
					(movable ? self._firstStopMoveSymbol() : self._firstStopSymbol());
			}
			else if (lastDestination && sequence === lastDestination.attributes.Sequence)
			{
				symbol = self.isRoundTrip ? (movable ? self._stopMoveSymbol() : self._stopSymbol()) :
					(movable ? self._lastStopMoveSymbol() : self._lastStopSymbol());
			}
			else
			{
				symbol = movable ? self._stopMoveSymbol() : self._stopSymbol();
			}
		}

		return symbol;
	};

	Tool.prototype._getMovingDirectionStopSymbol = function(sequence)
	{
		var self = this;
		return self._getDirectionStopSymbol(sequence, true);
	};

	Tool.prototype._refreshDestinationsSymbol = function()
	{
		var self = this,
			destinations = self._destinations,
			stopLayer = self._stopLayer,
			stopSequenceLayer = self._stopSequenceLayer,
			stopType = self.StopTypeEnum.DESTINATION,
			destination = attributes = graphic = sequence = null;

		stopSequenceLayer.removeAll();

		for (var i = 0, length = destinations.length; i < length; i++)
		{
			destination = destinations[i];
			attributes = destination.attributes;
			sequence = attributes.Sequence;

			stopLayer.remove(destination);

			// update destination location type.
			if (i > 0 && i === length - 1 && self.isRoundTrip === false)
			{
				stopType = self.StopTypeEnum.TERMINAL;
			}

			attributes.LocationType = self.LocationTypeEnum.STOP;
			attributes.StopType = stopType;
			destination.symbol = self._getDirectionStopSymbol(sequence);
			stopLayer.add(destination);

			// stop sequence graphic
			var graphic = new self._arcgis.Graphic({
				'geometry': destination.geometry,
				'symbol': self._stopSequenceSymbol(sequence),
				'attributes': {
					'StopType': stopType,
					'Label': sequence,
					'Sequence': sequence
				}
			});
			stopSequenceLayer.add(graphic);
		}
	};
})();