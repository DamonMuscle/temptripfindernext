(function()
{
	createNamespace("TF.GIS.ADT").RoutePath = RoutePath;

	function RoutePath(options)
	{
		this._id = options.id || 0;
		this._drivingDirections = options.drivingDirections || null;
		this._routeDrivingDirections = options.routeDrivingDirections || null;
		this._distance = options.distance || -1;
		this._time = options.time || -1;
		this._speed = options.speed || 0;
		this._streetSpeed = options.streetSpeed || 0;
		this._paths = options.paths || null;
		this._isCustomDirection = options.isCustomDirection || false;
	}

	//#region Property

	Object.defineProperty(RoutePath.prototype, "Id", {
		get() { return this._id; },
		set(value) { this._id = value; },
		enumerable: false,
		configurable: false
	});

	Object.defineProperty(RoutePath.prototype, "DrivingDirections", {
		get() { return this._drivingDirections; },
		set(value) { this._drivingDirections = value; },
		enumerable: false,
		configurable: false
	});

	Object.defineProperty(RoutePath.prototype, "RouteDrivingDirections", {
		get() { return this._routeDrivingDirections; },
		set(value) { this._routeDrivingDirections = value; },
		enumerable: false,
		configurable: false
	});

	Object.defineProperty(RoutePath.prototype, "Distance", {
		get() { return this._distance; },
		set(value) { this._distance = value; },
		enumerable: false,
		configurable: false
	});

	Object.defineProperty(RoutePath.prototype, "Time", {
		get() { return this._time; },
		set(value) { this._time = value; },
		enumerable: false,
		configurable: false
	});

	Object.defineProperty(RoutePath.prototype, "Speed", {
		get() { return this._speed; },
		set(value) { this._speed = value; },
		enumerable: false,
		configurable: false
	});

	Object.defineProperty(RoutePath.prototype, "StreetSpeed", {
		get() { return this._streetSpeed; },
		set(value) { this._streetSpeed = value; },
		enumerable: false,
		configurable: false
	});

	Object.defineProperty(RoutePath.prototype, "Paths", {
		get() { return this._paths; },
		set(value) { this._paths = value; },
		enumerable: false,
		configurable: false
	});

	Object.defineProperty(RoutePath.prototype, "IsCustomDirection", {
		get() { return this._isCustomDirection; },
		set(value) { this._isCustomDirection = value; },
		enumerable: false,
		configurable: false
	});

	//#endregion

	RoutePath.prototype.clear = function()
	{
		this._drivingDirections = null;
		this._routeDrivingDirections = null;
		this._distance = 0;
		this._time = -1;
		this._speed = 0;
		this._streetSpeed = 0;
		this._paths = null;
		this._isCustomDirection = false;
	}
})();