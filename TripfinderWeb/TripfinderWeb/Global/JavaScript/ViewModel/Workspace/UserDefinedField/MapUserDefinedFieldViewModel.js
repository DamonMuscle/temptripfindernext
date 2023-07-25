(function()
{
	createNamespace("TF.UserDefinedField").MapUserDefinedFieldViewModel = MapUserDefinedFieldViewModel;

	function MapUserDefinedFieldViewModel()
	{
		let self = this;
		self.obIsEnable = ko.observable(true);
		self.symbolName = "";
		const defaultPinSymbol = $.extend({}, TF.Control.Form.MapQuestion.defaultPinSymbol);
		self.pinColor = defaultPinSymbol.symbolColor;
		self.pinSymbol = defaultPinSymbol.symbolNumber;
		self.selectedSize = defaultPinSymbol.symbolSize;
		self.borderColor = defaultPinSymbol.borderColor;
		self.borderSize = defaultPinSymbol.borderSize;
		self.borderishow = defaultPinSymbol.borderishow;


		self.locationMarkers = ["Pin"];
		self.homeLocation = {};
		self.obPinChecked = ko.observable(true);

		self.obPinChecked.subscribe(self.locationMarkerChanged.bind(self));
		self.$form = null;
		self.element = null;
		self.map = null;
		self.mapView = null;
		tf.isFormQuestionMap = true;
		self.obComponentLoaded = ko.observable(false);
	};

	MapUserDefinedFieldViewModel.prototype.constructor = MapUserDefinedFieldViewModel;

	MapUserDefinedFieldViewModel.prototype.getTemplate = function()
	{
		return "modal/userdefinedfield/MapUserDefinedField";
	};

	MapUserDefinedFieldViewModel.prototype.init = function(model, e)
	{
		var self = this, content, shapesCheckbox;
		if (!self.locationMarkers)
		{
			self.locationMarkers = [];
		}
		self.$form = $(e);	
		// location marker
		self.obPinChecked(self.locationMarkers.indexOf("Pin") >= 0);
		shapesCheckbox = self.$form.find('.drawing-option input[type=checkbox]');
		if (!self.obPinChecked()) {
			shapesCheckbox.prop("disabled", false);
			shapesCheckbox.each(function (item) {
				if (self.locationMarkers.indexOf(this.value) >= 0) {
					$(this).prop("checked", "checked");
				}
			});
		} else {
			shapesCheckbox.prop("disabled", true);
		}

		// pin option
		let borderColor = null, borderSize = null;
		if (self.borderishow) {
			borderColor = self.borderColor || "#000000";
			borderSize = "1";
		}
		content = TF.Helper.AdjustValueSymbolHelper.getSVGSymbolString(self.pinSymbol, self.pinColor, "15", borderColor, borderSize);
		self.$form.find(".currentSymbol").html(content);
		if (self.obPinChecked())
		{
			self.$form.find('.currentSymbol').removeClass("pin-icon-disabled");
		} else
		{
			self.$form.find('.currentSymbol').addClass("pin-icon-disabled");
		}

		// pin selector
		self.$form.find("#symbol-selector .symbol-container").on("click", self.openSymbolsPanel.bind(self));
		if ($("body").find(".symbols-panel.pin-icon-selector").length <= 0)
		{
			$("body").append("<div class='symbols-panel pin-icon-selector'/>");
		}
		$("body").on("mousedown.mapModal", function(e)
		{
			if ($(e.target).closest(".symbols-panel").length <= 0)
			{
				$("body").find(".symbols-panel.pin-icon-selector").hide();
			}
		});

		self._arcgis = tf.map.ArcGIS;

		self.initMap();
		self.obComponentLoaded(true);
	};

	MapUserDefinedFieldViewModel.prototype.getDefaultValueTemplate = function()
	{
		return null;
	};

	MapUserDefinedFieldViewModel.prototype.openSymbolsPanel = function () {
		var self = this;
		var displayDetail = {
			symbol: self.pinSymbol,
			size: self.selectedSize,
			color: self.pinColor,
			name: "Pin",
			borderishow: self.borderishow,
			bordersize: self.borderSize,
			bordercolor: self.borderColor
		};

		if (!self.obPinChecked()) {
			return;
		}

		tf.modalManager.showModal(new TF.Modal.AdjustValueDisplayModalViewModel(displayDetail)).then(function (result) {
			if (result) {
				if (result.changed) {
					self.pinSymbol = result.symbol;
					self.selectedSize = result.size;
					self.pinColor = result.color;
					self.borderishow = result.borderishow;
					self.borderSize = result.bordersize;
					self.borderColor = result.bordercolor;

					let borderColor = null, borderSize= null;
					if (self.borderishow) {
						borderColor = self.borderColor || "#000000";
						borderSize = "1";
					}
					// update pin icon display
					let content = TF.Helper.AdjustValueSymbolHelper.getSVGSymbolString(self.pinSymbol, self.pinColor, "15", borderColor, borderSize);
					self.$form.find(".currentSymbol").html(content);
				}
			}
		});
	};

	MapUserDefinedFieldViewModel.prototype.getDefaultValue = function(entity)
	{
	};

	MapUserDefinedFieldViewModel.prototype.updateDefaultValue = function(entity, defaultValue)
	{
	};

	MapUserDefinedFieldViewModel.prototype.saveSpecialValue = function(entity)
	{
		let self = this;
		//location marker
		self.locationMarkers = [];

		if (self.obPinChecked()) {
			self.locationMarkers.push("Pin");
		} else {
			self.$form.find(".drawing-option input:checked").each(function (item) {
				self.locationMarkers.push(this.value);
			});
		}
		entity["LocationMarkers"] = self.locationMarkers;
		entity["PinOption"] = { Icon: this.pinSymbol, Color: this.pinColor, Size: this.selectedSize, ShowBorder: this.borderishow, BorderSize: this.borderSize, BorderColor: this.borderColor};

		// home location
		self.homeLocation["BaseMap"] = self.map.basemap.id;
		self.homeLocation["Longitude"] = self.mapView.center.longitude;
		self.homeLocation["Latitude"] = self.mapView.center.latitude;
		self.homeLocation["ZoomLevel"] = self.mapView.zoom;
		entity["HomeLocation"] = self.homeLocation;
	};

	MapUserDefinedFieldViewModel.prototype.updateSpecialValue = function(entity)
	{
		if (!entity) return;
		let self = this, pinOption = entity.PinOption, locationMarkers = entity.LocationMarkers, homeLocation = entity.HomeLocation;

		self.locationMarkers = locationMarkers;

		if (pinOption)
		{
			self.pinSymbol = pinOption.Icon;
			self.pinColor = pinOption.Color;
			self.selectedSize = pinOption.Size;
			self.borderishow = pinOption.ShowBorder;
			self.borderSize = pinOption.BorderSize;
			self.borderColor = pinOption.BorderColor;
		}

		self.homeLocation = homeLocation;
	};

	MapUserDefinedFieldViewModel.prototype.locationMarkerChanged = function()
	{
		let self = this, pinIcon = self.$form.find(".currentSymbol"),
			shapesCheckbox = self.$form.find('input[type=checkbox]');
		if (self.obPinChecked())
		{
			pinIcon.removeClass("pin-icon-disabled");
			shapesCheckbox.prop("disabled", true);
			shapesCheckbox.prop("checked", false);
		} else
		{
			pinIcon.addClass("pin-icon-disabled");
			shapesCheckbox.prop("disabled", false);
		}
	};

	MapUserDefinedFieldViewModel.prototype.initMap = function()
	{
		let self = this;
		let element = self.$form.find(".map-container");
		if (!self.homeLocation)
		{
			self.homeLocation = {};
		}
		let options = {
			baseMapId: self.homeLocation["BaseMap"] || "",
			center: self.homeLocation["Longitude"] ? [self.homeLocation["Longitude"], self.homeLocation["Latitude"]]: null, 
			zoomLevel: self.homeLocation["ZoomLevel"] || -1,
			isDetailView: false,
			isLandscape: true,
			isReadMode: false,
			zoomAvailable: false,
			homeLocationPinAvailable: false,
			thematicAvailable: false,
			baseMapAvailable: true,
			trafficMapAvailable: false,
			measurementAvailable: false,
			manuallyPinAvailable: false,
			drawBoundaryAvailable: false,
			thematicInfo: false,
			legendStatus: false,
			GoogleStreet: false,
			geoFinderAvailable: false
		};
		self.element = element;
		let map = TF.Helper.MapHelper.createMap(element, self, options);
		self.map = map;
		self.mapView = map.mapView;
		self.routingMapToolsetting();
	};

	MapUserDefinedFieldViewModel.prototype.routingMapToolsetting = function()
	{
		var self = this;
		self.RoutingMapTool.toolkitBtnClickEventEnable = true;
		self.RoutingMapTool.toolkitBtnClickEvent.subscribe(function(e, callback)
		{
			callback();
		});
		return Promise.resolve();
	};

	MapUserDefinedFieldViewModel.prototype.dispose = function()
	{
		let self = this;
		$(".pin-icon-selector").remove();
		$("body").off("mousedown.mapModal");
		tf.isFormQuestionMap = false;

		if (self.mapView)
		{
			self.mapClickEvent = null;
			self.mapView.destroy();
			self.mapView.map = null;
		}

		if (self.map)
		{
			self.map.mapView = null;

			self.map.ground && !self.map.ground.destroyed && self.map.ground.destroy();
			self.map.layers && !self.map.layers.destroyed && self.map.layers.destroy();
			self.map.basemap && !self.map.basemap.destroyed && self.map.basemap.destroy();
			self.map.allLayers && !self.map.allLayers.destroyed && self.map.allLayers.destroy();
			self.map.expandMapTool && self.map.expandMapTool.dispose();
			self.map.destroy();

			self.map.expandMapTool = null;
			self.map.SketchViewModel = null;
		}
	};
})();