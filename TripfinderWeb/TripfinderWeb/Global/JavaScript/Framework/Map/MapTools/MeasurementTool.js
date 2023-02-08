(function()
{
	createNamespace("TF.Map").MeasurementTool = MeasurementTool;

	function MeasurementTool(map, arcgis, $container, routeState)
	{
		var self = this;
		self.$container = $container;
		self.map = map;
		self.arcgis = arcgis;
		self.routeState = routeState;
		self.tabNameList = ["distance", "area", "location"];
		// Be cautious that the order of these units are specified in VIEW-2160.
		self.supportedUnitList = {
			"distance": [
				{ "type": "feet", "text": "Feet" },
				{ "type": "yards", "text": "Yards" },
				{ "type": "miles", "text": "Miles" },
				{ "type": "nautical-miles", "text": "Nautical Miles" },
				{ "type": "meters", "text": "Meters" },
				{ "type": "kilometers", "text": "Kilometers" },
			],
			"area": [
				{ "type": "square-feet", "text": "Sq. Feet" },
				{ "type": "square-yards", "text": "Sq. Yards" },
				{ "type": "acres", "text": "Acres" },
				{ "type": "square-miles", "text": "Sq. Miles" },
				{ "type": "square-meters", "text": "Sq. Meters" },
				{ "type": "hectares", "text": "Hectares" },
				{ "type": "square-kilometers", "text": "Sq. Km" },
			],
			"location": [
				{ "type": "degrees", "text": "Degrees" },
				{ "type": "dms", "text": "DMS" },
			]
		};
		self.defaultDistanceUnit = { "type": "miles", "text": "Miles" };
		self.defaultAreaUnit = { "type": "square-miles", "text": "Sq. Miles" };
		self.defaultLocationUnit = { "type": "degrees", "text": "Degrees" };
		self.defaultMeasurementType = "distance";
		self.distanceMeasurement = null;
		self.areaMeasurement = null;
		self.pinLocationMeasurement = null;
		self.trackLocationMeasurement = null;

		if (!tf.measurementUnitConverter.isImperial())
		{
			self.defaultDistanceUnit = { "type": "kilometers", "text": "Kilometers" };
			self.defaultAreaUnit = { "type": "square-kilometers", "text": "Sq. Km" };
		}

		self.obDistanceValue = ko.observable(0);
		self.obAreaValue = ko.observable(0);
		self.obPinLocation = ko.observable(null);
		self.obTrackLocation = ko.observable(["---", "---"]);
		self.obSelectedUnit = ko.observable(self.defaultDistanceUnit);
		self.isUnitUserSpecified = false;

		self.isActive = false;
		self.currentMeasurementType = self.defaultMeasurementType;
		self.onMeasureStart = new TF.Events.Event();
		self.onMeasureEnd = new TF.Events.Event();
		self.onMeasureResultCopied = new TF.Events.Event();

		self.elementContentHelper = null;
		self.measureHelper = null;
	}

	MeasurementTool.prototype = Object.create(TF.Map.MeasurementTool.prototype);
	MeasurementTool.prototype.constructor = TF.Map.MeasurementTool;

	/**
	 * Initialize Measurement Tool.
	 * @return {void}
	 */
	MeasurementTool.prototype.init = function()
	{
		var self = this;
		self.elementContentHelper = new TF.Helper.ElementContentHelper();

		self.initMeasureHelper();
		self.initInfoPanel();
	};

	/**
	 * Initialize the measure helper which takes care of measurement on map.
	 * @return {void}
	 */
	MeasurementTool.prototype.initMeasureHelper = function()
	{
		var self = this,
			measureHelper = new TF.Map.MapMeasureHelper(self.map, self.arcgis);

		measureHelper.onMeasure.subscribe(self.onHelperMeasuring.bind(self));
		measureHelper.onMeasureStart.subscribe(self.onHelperMeasureStart.bind(self));
		measureHelper.onMeasureEnd.subscribe(self.onHelperMeasureEnd.bind(self));

		self.measureHelper = measureHelper;
	};

	/**
	 * Initialize the measurement information panel.
	 * @return {void}
	 */
	MeasurementTool.prototype.initInfoPanel = function()
	{
		var self = this,
			$infoPanel = $("<div></div>", { "class": "measurement-info-panel", "id": "measurementInfoPanel", "measureType": self.defaultMeasurementType }),
			$tabContainer = $("<div></div>", { "class": "measurement-tab-container" }),
			$distanceTab = $("<div></div>", { "class": "measurement-tab distance", "text": "Distance" }),
			$areaTab = $("<div></div>", { "class": "measurement-tab area", "text": "Area" }),
			$locationTab = $("<div></div>", { "class": "measurement-tab location", "text": "Location" }),
			$panelContainer = $("<div></div>", { "class": "measurement-panel-container" }),
			$distancePanel = self.createDistancePanel(),
			$areaPanel = self.createAreaPanel(),
			$locationPanel = self.createLocationPanel(),
			$closeBtn = $("<div></div>", { "class": "close-btn btn" });

		$distanceTab.on("click", self.switchTabByName.bind(self, "distance", false));
		$areaTab.on("click", self.switchTabByName.bind(self, "area", false));
		$locationTab.on("click", self.switchTabByName.bind(self, "location", false));
		$closeBtn.on("click", self.deactivate.bind(self));

		$tabContainer.append($distanceTab, $areaTab, $locationTab);
		$panelContainer.append($distancePanel, $areaPanel, $locationPanel);
		$infoPanel.append($tabContainer, $panelContainer, $closeBtn);

		self.$container.append($infoPanel);
		self.$infoPanel = $infoPanel;

		ko.applyBindings(self, $infoPanel[0]);
	};

	/**
	 * The event handler for map measuring.
	 * @param {Event} evt The event object. 
	 * @param {Object} data The measurement data.
	 * @return {void}
	 */
	MeasurementTool.prototype.onHelperMeasuring = function(evt, data)
	{
		var self = this,
			unitType = self.obSelectedUnit().type,
			type = data.type, value = data.value;

		if (type === "location")
		{
			self.trackLocationMeasurement = value;
			self.obTrackLocation(self.lonLatFormatter(value, unitType));
		}
	};

	/**
	 * Notified when a new measurement has started.
	 * @param {Event} evt The event object.
	 * @return {void}
	 */
	MeasurementTool.prototype.onHelperMeasureStart = function(evt)
	{
		var self = this, type = self.currentMeasurementType;
		if (type !== "location")
		{
			self.resetTabStatusByName(type, true);
		}
	};

	/**
	 * The event handler for map measure-end.
	 * @param {Event} evt The event object. 
	 * @param {Object} data The measurement data.
	 * @return {void}
	 */
	MeasurementTool.prototype.onHelperMeasureEnd = function(evt, data)
	{
		var self = this,
			type = data.type,
			value = data.value,
			unitType = self.obSelectedUnit().type;

		if (type === "location")
		{
			self.pinLocationMeasurement = value;
			self.obPinLocation(self.lonLatFormatter(value, unitType));
		}
		else
		{
			if (type === "distance")
			{
				self.distanceMeasurement = value;
				self.obDistanceValue(self.valueFormatter(value));
			}
			else if (type === "area")
			{
				self.areaMeasurement = value;
				self.obAreaValue(self.valueFormatter(value));
			}
			self.adjustMeasurementValueFontSize();
		}
	};

	/**
	 * When the default unit is in use, detect proper unit according to the value.
	 * @param {string} value 
	 * @param {string} unitType 
	 */
	MeasurementTool.prototype.properUnitDetection = function(value, unitType)
	{
		var self = this, unitObj,
			feetPerMile = 5280,
			sqFeetPerSqMile = feetPerMile * feetPerMile;

		// if (unitType === "miles" && value <= 1)
		// {
		// 	self.switchUnit(self.getUnitObject("distance", "feet"));
		// 	value = value * feetPerMile;
		// }
		// else if (unitType === "feet" && value > feetPerMile)
		// {
		// 	self.switchUnit(self.getUnitObject("distance", "miles"));
		// 	value = value / feetPerMile;
		// }
		// else if (unitType === "square-miles" && value < 1)
		// {
		// 	self.switchUnit(self.getUnitObject("area", "square-feet"));
		// 	value = value * sqFeetPerSqMile;
		// }
		// else if (unitType === "square-feet" && value >= sqFeetPerSqMile)
		// {
		// 	self.switchUnit(self.getUnitObject("area", "square-miles"));
		// 	value = value / sqFeetPerSqMile;
		// }
		return value;
	};

	/**
	 * Adjust the measurement value font-size so it could be fully displayed.
	 * @return {void}
	 */
	MeasurementTool.prototype.adjustMeasurementValueFontSize = function()
	{
		var self = this, maxFontSize = 29, minFontSize = 12, maxWidth = 130,
			$value = self.$infoPanel.find("." + self.currentMeasurementType + " .measurement-value");
		self.elementContentHelper.reduceFontSizeUntil($value, maxFontSize, minFontSize, maxWidth);
		$value.css("width", "");
	};

	/**
	 * 
	 * @param {*} measurementType 
	 * @param {*} unitType 
	 */
	MeasurementTool.prototype.getUnitObject = function(measurementType, unitType)
	{
		var self = this,
			unitList = self.supportedUnitList[measurementType],
			count = unitList.length, unitObj;

		while (count-- > 0)
		{
			unitObj = unitList[count];
			if (unitObj.type === unitType)
			{
				return unitObj;
			}
		}
	};

	/**
	 * Format the longitude and latitude data.
	 * @param {Array} lonLat The array that contains longitude and latitude.
	 * @param {string} unitType The type of the unit.
	 * @return {Array} The formatted coordinate data. 
	 */
	MeasurementTool.prototype.lonLatFormatter = function(lonLat, unitType)
	{
		if (!lonLat) { return; }

		var self = this,
			fillDigits = function(value)
			{
				var gap = 2 - String(value).length;
				while (gap-- > 0) { value = "0" + value; }
				return value;
			},
			formatter = function(value)
			{
				if (unitType === "degrees")
				{
					value = value.toFixed(6) + "°";
				}
				else if (unitType === "dms")
				{
					var degree = Math.floor(value),
						decimal = (value - degree) * 60,
						minute = Math.floor(decimal),
						second = Math.floor((decimal - minute) * 60);
					value = degree + "°" + fillDigits(minute) + "'" + fillDigits(second) + "\"";
				}
				return value;
			};

		return lonLat.map(function(item)
		{
			return formatter(item);
		});
	};

	/**
	 * Format the common decimal value to be displayed.
	 * @param {string} value The common decimal value.
	 * @return {string} The formatted value.
	 */
	MeasurementTool.prototype.valueFormatter = function(value)
	{
		return (Math.floor(value * 1000) / 1000).toFixed(3);
	};

	/**
	 * Create the html element for distance panel.
	 * @return {jQuery} The generated element.
	 */
	MeasurementTool.prototype.createDistancePanel = function()
	{
		var self = this,
			$panel = $("<div></div>", { "class": "measurement-panel distance" }),
			$value = $("<div></div>", { "class": "measurement-value", "data-bind": "text: obDistanceValue" }),
			$unitContainer = $("<div></div>", { "class": "measurement-unit" }),
			$unitValue = $("<div></div>", { "class": "unit-value", "data-bind": "text: obSelectedUnit().text" }),
			$downArrow = $("<div></div>", { "class": "down-arrow icon" });

		$unitContainer.append($unitValue, $downArrow);
		$panel.append($value, $unitContainer);

		$value.on("click", self.onMeasureValueClick.bind(self, "distance"));
		$unitContainer.on("click", self.openMeasurementUnitMenu.bind(self, $panel));
		return $panel;
	};

	/**
	 * Create the html element for area panel.
	 * @return {jQuery} The generated element.
	 */
	MeasurementTool.prototype.createAreaPanel = function()
	{
		var self = this,
			$panel = $("<div></div>", { "class": "measurement-panel area" }),
			$value = $("<div></div>", { "class": "measurement-value", "data-bind": "text: obAreaValue" }),
			$unitContainer = $("<div></div>", { "class": "measurement-unit" }),
			$unitValue = $("<div></div>", { "class": "unit-value", "data-bind": "text: obSelectedUnit().text" }),
			$downArrow = $("<div></div>", { "class": "down-arrow icon" });

		$unitContainer.append($unitValue, $downArrow);
		$panel.append($value, $unitContainer);

		$value.on("click", self.onMeasureValueClick.bind(self, "area"));
		$unitContainer.on("click", self.openMeasurementUnitMenu.bind(self, $panel));
		return $panel;
	};

	/**
	 * Create the location panel.
	 * @return {jQuery} The location panel element.
	 */
	MeasurementTool.prototype.createLocationPanel = function()
	{
		var self = this,
			$panel = $("<div></div>", { "class": "measurement-panel location", "data-bind": "css: {\"no-pin-location\": !obPinLocation()}" }),
			$TrackLocation = self.createLatLonElement("location-track", "obTrackLocation"),
			$PinLocation = self.createLatLonElement("location-pin", "obPinLocation", true),
			$unitContainer = $("<div></div>", { "class": "measurement-unit" }),
			$unitValue = $("<div></div>", { "class": "unit-value", "data-bind": "text: obSelectedUnit().text" }),
			$downArrow = $("<div></div>", { "class": "down-arrow icon" });

		$unitContainer.append($unitValue, $downArrow);
		$panel.append($TrackLocation, $PinLocation, $unitContainer);

		$unitContainer.on("click", self.openMeasurementUnitMenu.bind(self, $panel));
		return $panel;
	};

	/**
	 * Create the element to display latitude and longitude.
	 * @param {string} className The class name
	 * @param {string} latLonVariableName The observale variable name with lat/lon data.
	 * @param {boolean} isCopyable Whether this element is copyable
	 * @return {jQuery} The generated element.
	 */
	MeasurementTool.prototype.createLatLonElement = function(className, latLonVariableName, isCopyable)
	{
		var self = this,
			$el = $("<div></div>", { "class": "measurement-latlon " + className, "data-bind": "with: " + latLonVariableName, "value": 0 }),
			$icon = $("<div></div>", { "class": "latlon-icon icon" }),
			$latContainer = $("<div></div>", { "class": "latlon-container" }),
			$lonContainer = $("<div></div>", { "class": "latlon-container" }),
			$latLabel = $("<div></div>", { "class": "latlon-label", "text": "Lat." }),
			$lonLabel = $("<div></div>", { "class": "latlon-label", "text": "Lon." }),
			$latValue = $("<div></div>", { "class": "latlon-value lat", "data-bind": "text: $data[1]" }),
			$lonValue = $("<div></div>", { "class": "latlon-value lon", "data-bind": "text: $data[0]" });

		$latContainer.append($latLabel, $latValue);
		$lonContainer.append($lonLabel, $lonValue);
		$el.append($icon, $latContainer, $lonContainer);

		if (isCopyable)
		{
			$el.on("click", self.onMeasureValueClick.bind(self, "location"));
		}

		return $el;
	};

	/**
	 * The click event handler.
	 * @param {string} type The measurement type
	 * @return {void}
	 */
	MeasurementTool.prototype.onMeasureValueClick = function(type)
	{
		var self = this, value,
			latLonFormatter = function(lonLat)
			{
				if (Array.isArray(lonLat))
				{
					return lonLat[1] + ", " + lonLat[0];
				}
			};

		if (type === "distance")
		{
			value = self.obDistanceValue();
			if (!value)
			{
				return;
			}
			value += " " + self.obSelectedUnit().text;
		}
		else if (type === "area")
		{
			value = self.obAreaValue();
			if (!value)
			{
				return;
			}
			value += " " + self.obSelectedUnit().text;
		}
		else if (type === "location")
		{
			value = latLonFormatter(self.obPinLocation());
		}

		value = self.copyToClipboard(value);
		self.onMeasureResultCopied.notify({ "type": type, "value": value });
	};

	/**
	 * Copy given text to user's clipboard.
	 * @param {string} text The text to be copied.
	 * @return {Any} Return text if successed, return false if failed.
	 */
	MeasurementTool.prototype.copyToClipboard = function(text)
	{
		if (typeof (text) !== "string" && typeof (text) !== "number") { return false; }

		var textArea = document.createElement("textarea");
		textArea.style.position = 'fixed';
		textArea.style.top = 0;
		textArea.style.left = 0;
		textArea.style.width = '2em';
		textArea.style.height = '2em';
		textArea.style.padding = 0;
		textArea.style.border = 'none';
		textArea.style.outline = 'none';
		textArea.style.boxShadow = 'none';
		textArea.style.background = 'transparent';
		textArea.value = text;

		document.body.appendChild(textArea);
		textArea.select();

		try
		{
			document.execCommand('copy');
		} catch (err)
		{
			text = false;
		}
		document.body.removeChild(textArea);

		return text;
	};

	/**
	 * Switch the tab by its name.
	 * @param {string} tabName The name of the tab to be switched to.
	 * @return {void}
	 */
	MeasurementTool.prototype.switchTabByName = function(tabName, isInitial)
	{
		var self = this;
		if (isInitial || self.currentMeasurementType !== tabName)
		{
			// The activate function already includes setTool.
			if (!isInitial)
			{
				self.measureHelper.setTool(tabName);
			}
			self.$infoPanel.find(".measurement-tab:not(." + tabName + ")").removeClass("active");
			self.$infoPanel.find(".measurement-tab." + tabName).addClass("active");
			self.$infoPanel.find(".measurement-panel:not(." + tabName + ")").removeClass("active");
			self.$infoPanel.find(".measurement-panel." + tabName).addClass("active");
			self.resetTabStatusByName(tabName);
			self.currentMeasurementType = tabName;
		}
	};

	/**
	 * Pause measure drawing.
	 * @return {void}
	 */
	MeasurementTool.prototype.pauseMeasureDrawing = function()
	{
		this.measureHelper.pause();
	};

	/**
	 * Resume measure drawing.
	 * @return {void}
	 */
	MeasurementTool.prototype.resumeMeasureDrawing = function()
	{
		this.measureHelper.resume();
	};

	/**
	 * Reset the tab panel status.
	 * @param {string} tabName The name of the tab to be reset.
	 * @param {boolean} keepUnit Whether the unit should be kept.
	 * @return {void}
	 */
	MeasurementTool.prototype.resetTabStatusByName = function(tabName, keepUnit, keepTrackLocation)
	{
		var self = this, defaultUnit;
		tabName = tabName || self.currentMeasurementType;
		if (tabName === "distance")
		{
			defaultUnit = self.defaultDistanceUnit;
			self.obDistanceValue(0);
			self.distanceMeasurement = null;
			self.adjustMeasurementValueFontSize();
		}
		else if (tabName === "area")
		{
			defaultUnit = self.defaultAreaUnit;
			self.obAreaValue(0);
			self.areaMeasurement = null;
			self.adjustMeasurementValueFontSize();
		}
		else if (tabName === "location")
		{
			defaultUnit = self.defaultLocationUnit;
			self.obPinLocation(null);
			self.pinLocationMeasurement = null;

			if (!keepTrackLocation)
			{
				self.obTrackLocation(["---", "---"]);
				self.trackLocationMeasurement = null;
			}
		}
		if (!keepUnit)
		{
			self.switchUnit(defaultUnit);
		}
		// self.isUnitUserSpecified = false;
	};

	/**
	 * Switch the measure unit.
	 * @param {Object} unit 
	 * @param {boolean} isUserSelection Is this switch launched by user.
	 * @return {void} 
	 */
	MeasurementTool.prototype.switchUnit = function(unit)
	{
		var self = this;
		if (self.obSelectedUnit().type !== unit.type)
		{
			self.obSelectedUnit(unit);
			self.measureHelper.setUnit(unit.type);
		}
	};

	/**
	 * Toggle the Measurement Tool activeness status.
	 * @return {void}
	 */
	MeasurementTool.prototype.activate = function()
	{
		var self = this;
		if (!self.$infoPanel)
		{
			self.init();
		}
		self.measureHelper.activate(self.defaultMeasurementType, self.defaultDistanceUnit.type);
		self.showHidePanel(true);
		self.switchTabByName(self.defaultMeasurementType, true);
		self.bindDomEvents();
		self.isActive = true;
		self.onMeasureStart.notify();
	};

	/**
	 * Deactivate the measurement tool.
	 * @return {void}
	 */
	MeasurementTool.prototype.deactivate = function()
	{
		var self = this;
		if (self.isActive)
		{
			self.showHidePanel(false);
			self.measureHelper.deactivate();
			self.unbindDomEvents();
			self.isActive = false;
			self.onMeasureEnd.notify();
		}
	};

	/**
	 * Bind related DOM events.
	 * @return {void}
	 */
	MeasurementTool.prototype.bindDomEvents = function()
	{
		var self = this;
		tf.documentEvent.bind("keydown.measurement", self.routeState, function(e)
		{
			if (e.keyCode === 27 || e.keyCode === 13)
			{
				self.onKeyDown(e);
			}
		});
	};

	/**
	 * Unbind related DOM events.
	 * @return {void}
	 */
	MeasurementTool.prototype.unbindDomEvents = function()
	{
		tf.documentEvent.unbind("keydown.measurement", this.routeState);
	};

	/**
	 * The key-down event handler.
	 * @param {Event} evt The key-down event data object.
	 * @return {void}
	 */
	MeasurementTool.prototype.onKeyDown = function(evt)
	{
		var self = this, helper = self.measureHelper;
		// Currently, there are only short-cut keys supported for "distance" and "area" modes.
		if (evt.keyCode === jQuery.ui.keyCode.ESCAPE)
		{
			self.closeMeasurementUnitMenu();
			if (helper && helper.hasMeasureGraphic())
			{
				helper.resetDrawStatus();
				self.resetTabStatusByName(null, true, true);
				TF.Helper.MapHelper.setMapCursor(self.map, "crosshair");
			}
			else
			{
				self.deactivate();
			}
		}
		else if (evt.keyCode === jQuery.ui.keyCode.ENTER && helper)
		{
			helper.finishDrawing();
		}
	};

	/**
	 * Show/hide the measurement result panel.
	 * @param {boolean} visibility Whether to show or hide.
	 * @return {void}
	 */
	MeasurementTool.prototype.showHidePanel = function(visibility)
	{
		var self = this;
		if (visibility)
		{
			self.$infoPanel.addClass("active");
		}
		else
		{
			self.$infoPanel.removeClass("active");
		}
	};

	/**
	 * Open the measurement unit menu.
	 * @param {jQuery} $panel The location panel element.
	 * @return {void}
	 */
	MeasurementTool.prototype.openMeasurementUnitMenu = function($panel)
	{
		var self = this;

		if (!self.$unitMenu)
		{
			var measurementType = self.currentMeasurementType,
				supportedUnitList = self.supportedUnitList[measurementType],
				$el = self.createUnitMenuElement(supportedUnitList),
				$unitContainer = $panel.find(".measurement-unit"),
				$downArrow = $panel.find(".down-arrow");

			self.$container.append($el);
			self.$unitMenu = $el;

			$unitContainer.addClass("menu-opened");
			self.setUnitMenuPosition($el, $downArrow, self.$container);
			$(document).on("mousedown.unitMenu", function(evt)
			{
				if ($(evt.target).closest(".measurement-unit-menu").length === 0)
				{
					self.closeMeasurementUnitMenu();
				}
			});
		}
	};

	/**
	 * Close the measurement unit menu.
	 * @return {void}
	 */
	MeasurementTool.prototype.closeMeasurementUnitMenu = function()
	{
		var self = this;
		if (!self.$infoPanel) { return; }

		self.$infoPanel.find(".measurement-unit").removeClass("menu-opened");
		if (self.$unitMenu)
		{
			self.$unitMenu.remove();
			self.$unitMenu = null;
			$(document).off("mousedown.unitMenu");
		}
	};

	/**
	 * Create the measurement unit menu element.
	 * @param {Array} unitList The list of supported units.
	 * @return {jQuery} The generated element.
	 */
	MeasurementTool.prototype.createUnitMenuElement = function(unitList)
	{
		var self = this, $li, $span,
			$menu = $("<div></div>", { "class": "measurement-unit-menu" }),
			$ul = $("<ul></ul>", { "class": "unit-menu-list" });

		unitList.map(function(unit)
		{
			$li = $("<li></li>");
			$span = $("<span></span>", { "class": "unit-menu-label", "text": unit.text });

			$li.on("click", self.onMeasurementUnitSelection.bind(self, unit));

			$li.append($span);
			$ul.append($li);
		});

		$menu.append($ul);

		return $menu;
	};

	/**
	 * Set the position of the unit menu.
	 * @param {jQuery} $el The unit menu element.
	 * @param {jQuery} $unitDownArrow The down-arrow icon element.
	 * @param {jQuery} $toolContainer The on-map tool container element.
	 * @return {void}
	 */
	MeasurementTool.prototype.setUnitMenuPosition = function($el, $unitDownArrow, $toolContainer)
	{
		var self = this,
			position = self.$infoPanel.attr("position"),
			containerTop = $toolContainer.offset().top,
			containerLeft = $toolContainer.offset().left,
			left = $unitDownArrow.offset().left - containerLeft - $el.outerWidth(),
			top = $unitDownArrow.offset().top - containerTop;
		if (position === "2" || position === "3")
		{
			top += $unitDownArrow.outerHeight() - $el.outerHeight();
		}

		$el.css({ "top": top, "left": left });
	};

	/**
	 * The event handler when a measuremnet unit option has been clicked.
	 * @param {Object} unit The unit name.
	 * @param {Event} evt The event object.
	 * @return {void}
	 */
	MeasurementTool.prototype.onMeasurementUnitSelection = function(unit, evt)
	{
		var self = this;
		self.switchUnit(unit);
		self.closeMeasurementUnitMenu();
	};

	/**
	 * Get if the measurement is active.
	 * @return {bool} The active status.
	 */
	MeasurementTool.prototype.isMeasurementActive = function()
	{
		return (this.$infoPanel && this.$infoPanel.hasClass("active"));
	};

	/**
	 * Dispose 
	 * @return {void}
	 */
	MeasurementTool.prototype.dispose = function()
	{
		var self = this;
		if (self.$infoPanel)
		{
			self.$infoPanel.remove();
		}
		if (self.measureHelper)
		{
			self.measureHelper.dispose();
		}
	};
})();