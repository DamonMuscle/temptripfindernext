(function()
{
	createNamespace('TF.RoutingMap.Directions').DirectionStop = DirectionStop;

	function DirectionStop(options)
	{
		var self = this;
		self.address = options.address === undefined ? null : options.address;
		self.attributes = options.attributes === undefined ? null : options.attributes;
		self.curbApproach = options.curbApproach === undefined ? null : options.curbApproach;
		self.geometry = options.geometry === undefined ? null : options.geometry;
		self.locationType = options.locationType === undefined ? null : options.locationType;
		self.name = options.name === undefined ? null : options.name;
		self.sequence = options.sequence === undefined ? null : options.sequence;
		self.stopType = options.stopType === undefined ? null : options.stopType;
		self.symbol = options.symbol === undefined ? null : options.symbol;
		self.x = options.x === undefined ? null : options.x;
		self.y = options.y === undefined ? null : options.y;
	};

	DirectionStop.prototype.constructor = DirectionStop;

	DirectionStop.prototype.attributes = null;
	DirectionStop.prototype.curbApproach = null;
	DirectionStop.prototype.geometry = null;
	DirectionStop.prototype.locationType = null;
	DirectionStop.prototype.name = null;
	DirectionStop.prototype.sequence = null;
	DirectionStop.prototype.symbol = null;
	DirectionStop.prototype.x = null;
	DirectionStop.prototype.y = null;

	DirectionStop.prototype.getGraphic = function()
	{
		var self = this,
			Graphic = tf.map.ArcGIS.Graphic,
			geometry = self._getGeometry(),
			symbol = self._getSymbol(),
			attributes = self._getAttributes();
		return new Graphic(geometry, symbol, attributes);
	};

	DirectionStop.prototype._getGeometry = function()
	{
		var self = this,
			Point = tf.map.ArcGIS.Point,
			SpatialReference = tf.map.ArcGIS.SpatialReference;
		if (self.geometry !== null)
		{
			return self.geometry;
		}

		if (self.x === null || self.y === null)
		{
			return null;
		}

		return new Point({
			x: self.x,
			y: self.y,
			spatialReference: new SpatialReference({
				'wkid': 3857
			})
		});
	};

	DirectionStop.prototype._getAttributes = function()
	{
		var self = this;

		if (self.attributes !== null)
		{
			return self.attributes;
		}

		return {
			'Address': self.address,
			'CurbApproach': self.curbApproach,
			'LocationType': self.locationType,
			'Name': self.name,
			'Sequence': self.sequence,
			'StopType': self.stopType
		};
	};

	DirectionStop.prototype._getSymbol = function()
	{
		var self = this;
		if (self.symbol !== null)
		{
			return self.symbol;
		}

		return null;
	};
})();


(function()
{
	createNamespace('TF.RoutingMap.Directions.DirectionStop').DestinationStop = DestinationStop;

	function DestinationStop(options)
	{
		var self = this;
		TF.RoutingMap.Directions.DirectionStop.call(self, options);

		self.locationType = TF.RoutingMap.Directions.Enum.LocationTypeEnum.STOP;
		self.curbApproach = TF.RoutingMap.Directions.Enum.CurbApproachEnum.RIGHT_SIDE;
	};

	DestinationStop.prototype = Object.create(TF.RoutingMap.Directions.DirectionStop.prototype);

	DestinationStop.prototype.constructor = DestinationStop;

	DestinationStop.prototype._getSymbol = function()
	{
		var self = this;
		if (self.symbol !== null)
		{
			return self.symbol;
		}

		var symbol = {
			type: "picture-marker",
			url: null,
			width: 21,
			height: 29,
			xoffset: 0,
			yoffset: 10
		};

		if (self.sequence === 1)
		{
			// first stop symbol
			symbol.url = "../../Global/img/Routing Map/destinations/greenPoint.png";
		}
		else if (self.stopType === TF.RoutingMap.Directions.Enum.StopTypeEnum.TERMINAL)
		{
			// last stop symbol
			symbol.url = "../../Global/img/Routing Map/destinations/redPoint.png";
		}
		else
		{
			symbol.url = "../../Global/img/Routing Map/destinations/bluePoint.png";
		}

		return symbol;
	};
})();

(function()
{
	createNamespace('TF.RoutingMap.Directions.DirectionStop').ThroughStop = ThroughStop;

	function ThroughStop(options)
	{
		var self = this;
		TF.RoutingMap.Directions.DirectionStop.call(self, options);

		self.locationType = TF.RoutingMap.Directions.Enum.LocationTypeEnum.WAY_POINT;
		self.name = 'Ghost';
		self.stopType = TF.RoutingMap.Directions.Enum.StopTypeEnum.GHOST_STOP;
	};

	ThroughStop.prototype = Object.create(TF.RoutingMap.Directions.DirectionStop.prototype);

	ThroughStop.prototype.constructor = ThroughStop;

	ThroughStop.prototype._getSymbol = function()
	{
		var self = this;
		if (self.symbol !== null)
		{
			return self.symbol;
		}

		return {
			type: 'simple-marker',
			size: 14,
			color: '#FFFFFF',
			outline: {
				type: "simple-line",
				style: "solid",
				color: '#14597F',
				width: 3
			}
		};
	};
})();


(function()
{
	createNamespace('TF.RoutingMap.Directions.DirectionStop').WayStop = WayStop;

	function WayStop(options)
	{
		var self = this;
		TF.RoutingMap.Directions.DirectionStop.call(self, options);

		self.locationType = TF.RoutingMap.Directions.Enum.LocationTypeEnum.WAY_POINT;
		self.curbApproach = TF.RoutingMap.Directions.Enum.CurbApproachEnum.RIGHT_SIDE;
	};

	WayStop.prototype = Object.create(TF.RoutingMap.Directions.DirectionStop.prototype);

	WayStop.prototype.constructor = WayStop;
})();



(function()
{
	createNamespace('TF.RoutingMap.Directions').Enum = Enum;

	function Enum() { };

	Enum.CurbApproachEnum = {
		'EITHER_SIDE': 0,
		'RIGHT_SIDE': 1,
		'LEFT_SIDE': 2,
		'NO_U_TURN': 3
	};

	Enum.LocationTypeEnum = {
		'STOP': 0,
		'WAY_POINT': 1,
		'BREAK': 2
	};

	Enum.UTurnPolicyEnum = {
		'ALLOWED': 'allow-backtrack',
		'INTERSECTION_AND_DEAD_ENDS_ONLY': 'at-dead-ends-and-intersections',
		'DEAD_ENDS_ONLY': 'at-dead-ends-only',
		'NOT_ALLOWED': 'no-backtrack'
	};

	Enum.StopTypeEnum = {
		'DESTINATION': 1,
		'GHOST_STOP': 2,
		'TERMINAL': 3,
		'VERTEX': 4,
		'WAY_STOP': 5
	};
})();