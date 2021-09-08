(function()
{
	createNamespace("TF.Map").EsriMapToolbar = EsriMapToolbar;

	function EsriMapToolbar(element, map, mapView)
	{
		this._el = element;
		this._map = map;
		this._mapView = mapView;
		this._toolbarTop = null;
		this._toolButton = null;
		this._events = {};

		this.initToolbar();
	}

	/**
	* Initialize events for the toolbar.
	*
	* @return {None} 
	*/
	EsriMapToolbar.prototype._initEvents = function()
	{
		for (var key in this._events)
		{
			this._events[key] = new TF.Events.Event();
		}
	};

	/**
	* The method to bind handler for specified event.
	* @return {None} 
	*/
	EsriMapToolbar.prototype.on = function(identifier, fn)
	{
		var handler = this._events[identifier];

		if (handler)
		{
			handler.unsubscribe(fn);
			handler.subscribe(fn);
		}
	};


	/**
	* Initialize the toolbar including elements, events and styles.
	*
	* @return {None} 
	*/
	EsriMapToolbar.prototype.initToolbar = function()
	{
		this._initElements();
		this._initEvents();
		this.updateToolbar();
	};

	/**
	* Initialize the elements for the toolbar.
	*
	* @return {None} 

	*/
	EsriMapToolbar.prototype._initElements = function()
	{
		this._toolbarTop = $("<div></div>", { class: "esri-map-toolbar-top" });
		this._toolButton = $("<div></div>", { class: "tool-button" });

		this._baseMapSwitch = $("<div></div>", { class: "basemap-switch" });

		this._streetMapBtn = $("<div></div>", { class: "toolbar-btn white switch-btn applied", text: "Map" });
		this._satelliteMapBtn = $("<div></div>", { class: "toolbar-btn white switch-btn", text: "Satellite" });

		this._streetMapBtn.bind("click", this._streetMapBtnClick.bind(this));
		this._satelliteMapBtn.bind("click", this._satelliteMapBtnClick.bind(this));

		this._baseMapSwitch.append(this._streetMapBtn, this._satelliteMapBtn);

		this._toolbarTop.append(this._baseMapSwitch, this._toolButton);

		this._el.append(this._toolbarTop);
	};

	/**
	* Update the style for the toolbar, including default Esri zoom buttons.
	*
	* @return {None} 
	*/
	EsriMapToolbar.prototype.updateToolbar = function()
	{
		// If the container's position is static, absolute position will not work.
		var $container = this._toolbarTop.parent(), containerPos = $container.css("position"),
			$zoomBtn = this._el.find(".esriSimpleSlider.esriSimpleSliderVertical.esriSimpleSliderTL"),
			toolbarCss = { curosr: "auto", margin: 0, padding: "10px 20px 10px " + $zoomBtn.css("left") || "20px", zIndex: $zoomBtn.zIndex() || $container.zIndex() + 100 };

		if (!containerPos || containerPos === "static")
		{
			$container.css({ position: "relative", margin: 0, padding: 0 });
		}

		this._toolbarTop.css(toolbarCss);

		// stylize esri default zoom buttons
		if ($zoomBtn)
		{
			$zoomBtn.css({ top: "71px" });
		};
	};

	/**
	* The handler for StreetMap button.
	*
	* @return {None} 
	*/
	EsriMapToolbar.prototype._streetMapBtnClick = function(e)
	{
		if (this._map._basemap !== "streets")
		{
			this._map.setBasemap("streets");
			this._streetMapBtn.addClass("applied");
			this._satelliteMapBtn.removeClass("applied");
		}
	};

	/**
	* The handler for SatelliteMap button.
	*
	* @return {None} 
	*/
	EsriMapToolbar.prototype._satelliteMapBtnClick = function(e)
	{
		if (this._map._basemap !== "satellite")
		{
			this._map.setBasemap("satellite");
			this._satelliteMapBtn.addClass("applied");
			this._streetMapBtn.removeClass("applied");
		}
	};


	/**
	* The method to clear all bound events.
	*
	* @return {None} 
	*/
	EsriMapToolbar.prototype._clearEvents = function()
	{
		for (var key in this._events)
		{
			this._events[key].unsubscribeAll();
			delete this._events[key];
		}
	};


	/**
	* Dispose
	*
	* @return {None} 
	*/
	EsriMapToolbar.prototype.dispose = function()
	{
		this._clearEvents();

		this._el = null;
		this._map = null;
		this._mapView = null;
		this._toolbarTop = null;
		this._events = null;
	};
})();
