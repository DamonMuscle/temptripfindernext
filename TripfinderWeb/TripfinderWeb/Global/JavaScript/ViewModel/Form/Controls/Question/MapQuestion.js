!function()
{
	createNamespace("TF.Control.Form").MapQuestion = MapQuestion;

	function MapQuestion(field, dataTypeId, onFormElementInitEvent)
	{
		TF.Control.Form.BaseQuestion.apply(this, [field]);
		onFormElementInitEvent.subscribe(this.createMap.bind(this, this.elem.find(".map-item")));
	}

	MapQuestion.defaultPinSymbol = {
		symbolNumber: "18",
		symbolColor: "#ff0606",
		symbolSize: "15",
		borderColor: "#000000",
		borderSize: "1",
		borderishow: true
	}

	MapQuestion.prototype = Object.create(TF.Control.Form.BaseQuestion.prototype);
	MapQuestion.prototype.constructor = MapQuestion;

	Object.defineProperty(MapQuestion.prototype, 'value', {
		get() { return this._value || []; },
		set(val)
		{
			if (this.locationMarkerLayer)
			{
				this._value = this.locationMarkerLayer.graphics.toJSON();
				if (this.locationMarkerLayer.graphics.length > 0 &&
					this.locationMarkerLayer.graphics.items[0].geometry.type === "point")
				{
					let geometryPoint = null;
					geometryPoint = tf.map.ArcGIS.webMercatorUtils.webMercatorToGeographic(this.locationMarkerLayer.graphics.items[0].geometry);
					geometryPoint && this.element.find("div.cordinate").html(`X Coord:${geometryPoint.x.toFixed(6)}, Y Coord:${geometryPoint.y.toFixed(6)}`);
				}
				else
				{
					this.element.find("div.cordinate").empty();
				}
			}
			else
			{
				this._value = [];
			}
			this.validateInternal();
			this.valueChanged();
		},
		enumerable: false,
		configurable: false
	});

	Object.defineProperty(MapQuestion.prototype, 'dirty', {
		get() { return JSON.stringify(this.initialValue || []) !== JSON.stringify((this.value || [])) }
	});

	MapQuestion.prototype.initQuestionContent = function()
	{
		let self = this;
		let $el = $(`<div class='map-question question'>
					<div class='map-item map-page doc'>
						<div class='map' style='max-height: 2000px; height: 100%; width: 100%; background: #e1e1e1'>
						</div>
					</div>
				</div>
				<div class="cordinate" style="text-align:left;color:#8e7878;"></div>`);
		//ko.applyBindings({ mapManager: mapManager }, $elem[0]);
		return $el;
	}

	MapQuestion.prototype.initEvents = function()
	{
		// Keep empty
	}

	MapQuestion.prototype.getValidateResult = function()
	{
		let result = '';
		if (this.isRequired && (this.value.length == 0))
		{
			result = 'Answer is required.';
		}
		return result;
	}

	MapQuestion.prototype.createMap = function($el)
	{

		var self = this;
		var options = {
			thematicLayerId: self.studentLayerId,
			isDetailView: true,
			isLandscape: false,
			notStickyBaseMap: true,
			isReadMode: true, //specify whether page is on design mode(false to disable map tool, otherwise enable map tool)
			zoomAvailable: true,
			homeAvailable: false,
			myLocationAvailable: false,
			trashAvailable: !self.field.readonly,
			locationMarkerAvailable: !self.field.readonly,
			locationMarkerList: self.field.FieldOptions.LocationMarkers,
			thematicAvailable: false,
			baseMapAvailable: true,
			measurementAvailable: false,
			manuallyPinAvailable: false,
			drawBoundaryAvailable: false,
			geoFinderAvailable: false,
			GoogleStreet: false,
			center: [self.field.FieldOptions.HomeLocation.Longitude, self.field.FieldOptions.HomeLocation.Latitude],
			zoomLevel: self.field.FieldOptions.HomeLocation.ZoomLevel,
			baseMapId: self.field.FieldOptions.HomeLocation.BaseMap,
			expand: {
				enable: true,
				container: $(document.body)
			}
		};

		//Pin default if not specified.
		if (options.locationMarkerList.length === 0)
		{
			if (TF.isMobileDevice)
			{
				options.locationMarkerList.push("Draw");
			}
			else
			{
				options.locationMarkerList.push("Polygon");
			}
		}
		else
		{
			if (TF.isMobileDevice)
			{
				let mobileLocationMarkerList = [];
				let removed = false;
				for (let marker of options.locationMarkerList)
				{
					if (["Polygon", "Rectangle", "Draw", "Circle"].includes(marker))
					{
						if (!removed)
						{
							removed = true;
						}
					}
					else
					{
						mobileLocationMarkerList.push(marker);
					}
				}
				if (removed)
				{
					mobileLocationMarkerList.push("Draw");
				}
				options.locationMarkerList = mobileLocationMarkerList;
			}
		}

		let borderColor = null, borderSize = null, pinOption = self.field.FieldOptions.PinOption;
		if (self.field.FieldOptions.PinOption.ShowBorder)
		{
			borderColor = pinOption.BorderColor || "#000000";
			borderSize = pinOption.BorderSize || "1";
		}
		const pinIconOption = $.extend(
			{},
			TF.Control.Form.MapQuestion.defaultPinSymbol,
			{
				symbolNumber: pinOption.Icon,
				symbolColor: pinOption.Color,
				symbolSize: pinOption.Size,
				borderColor: borderColor,
				borderSize: borderSize
			}
		);

		let routeState = Math.random().toString(36).substring(7);

		self.mapViewModel = {
			element: self.elem.find(".map-item.map-page"),
			homeCoordinates: [self.field.FieldOptions.HomeLocation.Longitude, self.field.FieldOptions.HomeLocation.Latitude],
			pinIconOption: pinIconOption,
			routeState: routeState,
			isForm: true,
			shapeDrawn: () => self.value = true
		};

		options.disableTrashBtn = true;
		TF.getLocation().then(coord =>
		{
			if (!coord.latitude && !coord.longitude)
			{
				options.disableMyLocationBtn = true;
			}
			var map = TF.Helper.MapHelper.createMap($el, self.mapViewModel, options);
			self._map = map;
			self._mapView = map.mapView;
			let $zoomCover = $(`<div class="map-question-zoom-cover" style="display:none;z-index: 13000; position: absolute; height: 100%; width: 100%; padding: 0px; border-width: 0px; margin: 0px; left: 0px; top: 0px; opacity: 1;"><p class="map-question-zoom-cover-tip">Use ctrl + scroll to zoom the map</p></div>`);
			$zoomCover.on("keydown mousewheel", function(evt)
			{
				if (evt && evt.ctrlKey && self._map.expandMapTool.status)
				{
					evt.preventDefault();
					evt.stopPropagation();
					$zoomCover.hide();
					if (!self.canvas)
					{
						self.canvas = $(map.mapView.root).find("canvas")[0];
					}
					let originalEvent = evt.originalEvent;
					let newEvt = new originalEvent.constructor(originalEvent.type, originalEvent);
					self.canvas.dispatchEvent(newEvt);
				}
			});
			$(self._mapView.root).after($zoomCover);
			self._mapView.on("mouse-wheel", function(evt)
			{
				if (evt && evt.native && !evt.native.ctrlKey && self._map.expandMapTool.status)
				{
					evt.preventDefault();
					evt.stopPropagation();
					$zoomCover.fadeIn(500).fadeOut(2000);
				}
			});
			//location marker layer: create graphics on layer when click triggered on map
			self.locationMarkerLayer = new tf.map.ArcGIS.GraphicsLayer({ id: "locationMarker" });
			map.add(self.locationMarkerLayer);
			// to enable map tools on map view
			self.mapViewModel.RoutingMapTool.toolkitBtnClickEventEnable = true;
			// Adjust map tool whether adopt with landscape(not enough height to show tools by vertical)
			self.mapViewModel.RoutingMapTool.toolkitBtnClickEvent.subscribe(function(e, callback)
			{
				var $offMapTool = self.mapViewModel.RoutingMapTool.$offMapTool;
				if (!$offMapTool.hasClass("active"))
				{
					var $mapMaskElement = $("body"),
						$mapToolBtn = $offMapTool.find(".map-tool-btn"),
						$mapToolLabel = $offMapTool.find(".map-tool-label"),
						activeMapToolHeight = $mapToolBtn.position().top + $mapToolBtn.height() + $mapToolLabel.height();
					if ($mapMaskElement.height() - $offMapTool.offset().top < activeMapToolHeight)
					{
						self.mapViewModel.RoutingMapTool.isLandscape = true;
						self.mapViewModel.RoutingMapTool.landscape();
						callback();
					}
					else
					{
						callback();
					}
				}
				else
				{
					callback();
				}
			});
		})
	}

	MapQuestion.prototype.restoreShape = function(shapeData)
	{
		if (this.locationMarkerLayer && shapeData)
		{
			shapeData.forEach(shape =>
			{
				const graphic = tf.map.ArcGIS.Graphic.fromJSON(shape);
				this.locationMarkerLayer.add(graphic)
				this.value = true; //triger value calculate
			});

			// currently, we only have one graphic on mape in same time, make the graphic in center of map
			if (this.locationMarkerLayer.graphics.length > 0 && this._mapView)
			{
				const geometry = this.locationMarkerLayer.graphics.items[0].geometry;
				this._mapView.goTo(geometry);
			}
		}
		this.initialValue = this.locationMarkerLayer.graphics.toJSON();

		if (!this.field.readonly && Array.isArray(shapeData) && shapeData.length &&
			this.mapViewModel && this.mapViewModel.RoutingMapTool && this.mapViewModel.RoutingMapTool.$mapToolContainer)
		{
			this.mapViewModel.RoutingMapTool.$mapToolBar.find('.trash').removeClass('disable');
		}
	}

	MapQuestion.prototype.dispose = function()
	{
		let self = this;
		self._map = null;
		self._mapView = null;
		self.mapViewModel && self.mapViewModel.RoutingMapTool && self.mapViewModel.RoutingMapTool.dispose();
		self.mapViewModel = null;
	}
}()