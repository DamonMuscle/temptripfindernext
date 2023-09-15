(function()
{
	createNamespace("TF.GIS.ADT").RouteStop = RouteStop;

	const DEFAULT_LONGITUDE = 0;
	const DEFAULT_LATITUDE = 0;
	const DEFAULT_STOP_ID = 0;
	const UNNAMED_ADDRESS = "Unnamed";

	const geocodeService = TF.GIS.Analysis.getInstance().geocodeService;

	function RouteStop(options)
	{
		this._id = options.id || DEFAULT_STOP_ID;
		this._curbApproach = options.curbApproach || TF.GIS.NetworkEnum.CURB_APPROACH.EITHER_SIDE;
		this._locationType = options.locationType || TF.GIS.NetworkEnum.LOCATION_TYPE.STOP;
		this._name = options.name || options.sequence;
		this._sequence = options.sequence;
		this._street = options.street || UNNAMED_ADDRESS;
		this._longitude = options.longitude || DEFAULT_LONGITUDE;
		this._latitude = options.latitude || DEFAULT_LATITUDE;
	}

	//#region Property

	Object.defineProperty(RouteStop.prototype, "Id", {
		get() { return this._id; },
		enumerable: false,
		configurable: false
	});

	Object.defineProperty(RouteStop.prototype, "CurbApproach", {
		get() { return this._curbApproach; },
		set(value) { this._curbApproach = value; },
		enumerable: false,
		configurable: false
	});

	Object.defineProperty(RouteStop.prototype, "LocationType", {
		get() { return this._locationType; },
		set(value) { this._locationType = value; },
		enumerable: false,
		configurable: false
	});

	Object.defineProperty(RouteStop.prototype, "Name", {
		get() { return this._name; },
		set(value) { this._name = value; },
		enumerable: false,
		configurable: false
	});

	Object.defineProperty(RouteStop.prototype, "Sequence", {
		get() { return this._sequence; },
		set(value) { this._sequence = value; },
		enumerable: false,
		configurable: false
	});

	Object.defineProperty(RouteStop.prototype, "Street", {
		get() { return this._street; },
		set(value) { this._street = value; },
		enumerable: false,
		configurable: false
	});

	Object.defineProperty(RouteStop.prototype, "Longitude", {
		get() { return this._longitude; },
		set(value) { this._longitude = value; },
		enumerable: false,
		configurable: false
	});

	Object.defineProperty(RouteStop.prototype, "Latitude", {
		get() { return this._latitude; },
		set(value) { this._latitude = value; },
		enumerable: false,
		configurable: false
	});

	//#endregion

	RouteStop.prototype.geocoding = async function(longitude, latitude)
	{
		const geocodeResult = await geocodeService.locationToAddress({x: longitude, y: latitude});

		if (geocodeResult?.errorMessage)
		{
			console.error(geocodeResult.errorMessage);
			return null;
		}

		const { Address, City, RegionAbbr, CountryCode } = geocodeResult?.attributes;
		if (!geocodeService.isAvailableCountry(CountryCode))
		{
			tf.promiseBootbox.alert({
				message: "Please add a stop in USA or Canada.",
				title: "Alert"
			});
			return null;
		}

		return { Address, City, RegionAbbr, CountryCode };
	};

	RouteStop.prototype.moveTo = function(longitude, latitude)
	{

	};

	RouteStop.prototype.toGraphic = function()
	{
		if (this._longitude === DEFAULT_LONGITUDE && this._latitude === DEFAULT_LATITUDE)
		{
			return null;
		}

		const geometry = TF.GIS.GeometryHelper.ComputeWebMercatorPoint(this._longitude, this._latitude);
		const attributes = {
			CurbApproach: this._curbApproach,
			Name: this._name,
			LocationType: this._locationType,
			Sequence: this._sequence
		};

		return new TF.GIS.SDK.Graphic(geometry, null, attributes);
	}
})();