(function()
{
	createNamespace("TF.GIS").Analysis = Analysis;

	var AnalysisInstance = null;

	const defaultOptions = {
		mode: "online"
	};

	function Analysis(options)
	{
		this.settings = Object.assign({}, defaultOptions, options);
		this._mode = this.settings.mode;
		this.name = `Analysis - ${Date.now()}`;
	}

	Analysis.prototype.constructor = Analysis;

	Object.defineProperty(Analysis.prototype, 'mode', {
		get() { return this._mode; },
		enumerable: false,
		configurable: false
	});

	Object.defineProperty(Analysis.prototype, 'geocodeService', {
		get() { return this._geocodeService; },
		set(value)
		{
			this._geocodeService = value;
		},
		enumerable: false,
		configurable: false
	});

	Object.defineProperty(Analysis.prototype, 'networkService', {
		get() { return this._networkService; },
		set(value)
		{
			this._networkService = value;
		},
		enumerable: false,
		configurable: false
	});

	Object.defineProperty(Analysis.prototype, 'placeService', {
		get() { return this._placeService; },
		set(value)
		{
			this._placeService = value;
		},
		enumerable: false,
		configurable: false
	});

	Analysis.prototype.setMode = function(mode = "online")
	{
		if (!["online", "server"].includes(mode)) {
			mode = "online";
		}

		this.mode = mode;

		this.geocodeService.setMode(mode);
	}

	Analysis.prototype.showDebugInfo = function()
	{
		console.log(`Analysis Information: ${this.mode}, ${this.name}`);

		this.geocodeService.showDebugInfo();
	}

	Analysis.getInstance = function(options)
	{
		if (!AnalysisInstance) {
			AnalysisInstance = new TF.GIS.Analysis(options);
			AnalysisInstance.geocodeService = new TF.GIS.Analysis.GeocodingService(AnalysisInstance.settings);
			AnalysisInstance.networkService = new TF.GIS.Analysis.NetworkService(AnalysisInstance.settings);
			AnalysisInstance.placeService = new TF.GIS.Analysis.PlaceService(AnalysisInstance.settings);
		}

		return AnalysisInstance;
	}
})();
