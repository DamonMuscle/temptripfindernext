(function()
{
	createNamespace("TF.DataEntry").BaseDataEntryMap = BaseDataEntryMap;

	const mapStatus = {};
	const config = {
		altsite: { hasThematics: true, manuallyPin: true },
		school: { hasThematics: true, manuallyPin: true },
		georegion: { hasThematics: false, manuallyPin: true },
		tripstop: { hasThematics: true, manuallyPin: false },
		student: { hasThematics: false, manuallyPin: true },
		fieldtriplocation: { hasThematics: false, manuallyPin: true },
	};
	const ManuallyPinLayerId = "ManuallyPinLayer";

	function BaseDataEntryMap(options)
	{
		var self = this;
		this._arcgis = tf.map.ArcGIS;
		if (!this.type && options.type)
		{
			this.type = options.type;
		}
		this.studentLayerId = "studentGraphicLayer";
		options = $.extend({
			routeState: "",
			showErrorMessage: null,
			showMessage: null,
			disable: false,
			detailView: null
		}, options);

		this.routeState = options.routeState;
		this.options = options;
		this.data = options.mainData;

		this.templateUrl = "Workspace/DataEntry/Map";
		this.mode = "";
		this.obIsReadOnly = ko.computed(function()
		{
			if (options.detailView)
			{
				return options.detailView.obIsReadOnly();
			}
			return false;
		});
		this.onModeChangeEvent = new TF.Events.Event();
		this.onStopEditingEvent = new TF.Events.Event();
		this.onUpdateRecordsEvent = new TF.Events.Event();
		this.autoPan = null;
		this.palettes = ko.observableArray([]);
		this.RoutingMapTool = null;
		this._mapView = null;
		this.thematicAvailable = false;
		this.mapCanvasUpdatedRecord = this.mapCanvasUpdatedRecord.bind(this);
		this.onMapLoad = new TF.Events.Event();

		this.symbol = new TF.Map.Symbol();
		this.gridMapPopup = new TF.Grid.GridMapPopup(this, {
			isDetailView: true,
			gridType: this.type
		});

		if (!tf.isViewfinder)
		{
			// this.parcelPaletteViewModel = new TF.RoutingMap.ParcelPaletteViewModel(self, false, self.routeState);
			// this.mapLayersPaletteViewModel = new TF.RoutingMap.MapLayersPaletteViewModel(self, false, self.routeState);
		}
	}

	BaseDataEntryMap.prototype.uiInit = function(modal, element)
	{
		var self = this;
		this.element = $(element);
		this.$mapDiv = this.element.find(".map");
		self._hasManuallyPin().then(async function(hasManuallyPin)
		{
			await self.initMap(self.options.mapToolOptions, hasManuallyPin);
			self.autoPan = TF.RoutingMap.AutoPanManager.getAutoPan(self._map);
			self.autoPan.initialize(self.element, 20);
			self.routingMapPanelManager = new TF.RoutingMap.RoutingMapPanelManager(self);
			self.routingMapPanelManager.init();
			self.routingMapPanelManager.outerPalettes = self.palettes;
		});
	};

	BaseDataEntryMap.prototype.initMap = async function(mapToolOptions, hasManuallyPin)
	{
		var self = this;
		const eventHandlers = {
			onMapViewCreated: () => {
				self._mapView.extent = TF.createDefaultMapExtent();
			},
			onMapViewUpdated: self.onMapViewUpdated.bind(self, mapToolOptions, hasManuallyPin)
		};
		self.mapInstance = await TF.Helper.MapHelper.createMapInstance(self.element, eventHandlers);
		self._map = self.mapInstance.map;
		self._mapView = self.mapInstance.map.mapView;

		self.sketchTool = new TF.RoutingMap.SketchTool(self._map, self);
	};

	BaseDataEntryMap.prototype.onMapViewUpdated = function(mapToolOptions, hasManuallyPin)
	{
		this._initMapTool(mapToolOptions, hasManuallyPin);
		this._onMapLoad();
		this.initLayers();
	}

	BaseDataEntryMap.prototype._initMapTool = function(mapToolOptions, hasManuallyPin)
	{
		const self = this;
		var options = {
			thematicLayerId: self.studentLayerId,
			isDetailView: true,
			isLandscape: !TF.isPhoneDevice,
			isReadMode: !self.options.disable,
			zoomAvailable: getValueByAttr(mapToolOptions, "zoomAvailable", !self.options.disable),
			thematicAvailable: getValueByAttr(mapToolOptions, "thematicAvailable", self._hasThematic()),
			baseMapAvailable: getValueByAttr(mapToolOptions, "baseMapAvailable", !self.options.disable),
			measurementAvailable: getValueByAttr(mapToolOptions, "measurementAvailable", !self.options.disable),
			manuallyPinAvailable: getValueByAttr(mapToolOptions, "manuallyPinAvailable", !self.obIsReadOnly() && !self.options.disable && hasManuallyPin),
			drawBoundaryAvailable: getValueByAttr(mapToolOptions, "drawBoundaryAvailable", !self.obIsReadOnly() && !self.options.disable && self._hasDrawBoundary()),
			homeAvailable: getValueByAttr(mapToolOptions, "homeAvailable", false),
			mylocationAvailable: getValueByAttr(mapToolOptions, "locationAvailable", false),
			playbackAvailable: this.type == "trip" || this.type == "route",
			homeToSchoolPathAvailable: this.type == "student",
			obTrips: this.obTrips,
			thematicInfo: self.options.thematicInfo,
			legendStatus: self.options.legendStatus,
			onThematicChanged: self.onThematicChanged.bind(self),
			geoFinderAvailable: getValueByAttr(mapToolOptions, "geoFinderAvailable", !self.options.disable),
			onLegendStatusChanged: self.onLegendStatusChanged.bind(self),
			expand: {
				enable: !self.options.disable,
				container: self.options.detailView.$element.find(".right-container")
			},
			buildPalettes: function()
			{
				return [];

				// if (tf.isViewfinder)
				// {
				// 	return [];
				// }

				// if (!self.mapViewerViewModel)
				// {
				// 	self.mapViewerViewModel = new TF.RoutingMap.DetailView.MapViewerViewModel(self, true, self.routeState);
				// }

				// return [
				// 	TF.Map.RoutingMapTool.buildMenuItem('Map Viewer', 'mapViewer', self.mapViewerViewModel, self.toggleMenu.bind(self))
				// ];
			}
		};

		if (mapToolOptions)
		{
			options.mapToolOptions = $.extend({}, mapToolOptions);
		}

		self.RoutingMapTool = new TF.Map.RoutingMapTool(self, options);
	};

	BaseDataEntryMap.prototype.toggleMenu = function(viewModel)
	{
		var self = this;

		self.viewModelCollection = self.viewModelCollection || [];

		if (!self.viewModelCollection.includes(viewModel))
		{
			self.viewModelCollection.push(viewModel);

			let paletteLength = (self.palettes || []).length + 1;
			let position = null;

			if ((self.type || "").toLowerCase() === "school")
			{
				paletteLength = paletteLength + 1;
			}

			if (paletteLength > 1)
			{
				position = { top: 100, left: 100 * (paletteLength - 1) };
			}

			var panel = new TF.RoutingMap.RoutingMapPanelViewModel([viewModel], paletteLength > 1 ? null : true, "routingmappanel" + paletteLength, true, position, self.routeState, self);
			self.palettes.push(panel);
		}
		else
		{
			viewModel.obShow(!viewModel.obShow());
		}

		if (viewModel.obShow())
		{
			viewModel.show();
		}
		else
		{
			viewModel.close();
		}
	};

	BaseDataEntryMap.prototype.preserveMapViewerStatus = function(data)
	{
		if (tf.isViewfinder)
		{
			return;
		}

		const blockUniqueName = this.getBlockUniqueName();
		mapStatus[this.type] = mapStatus[this.type] || {};
		mapStatus[this.type][blockUniqueName] = {
			data: data,
			isShow: this.mapViewerViewModel.obShow(),
			restored: false
		};
	};

	BaseDataEntryMap.prototype.getPreservedMapViewerStatus = function()
	{
		const blockUniqueName = this.getBlockUniqueName();
		return mapStatus[this.type] && mapStatus[this.type][blockUniqueName];
	};

	BaseDataEntryMap.prototype.getBlockUniqueName = function()
	{
		return this.element.data("uniqueClassName") || TF.DetailView.DetailViewHelper.prototype.getDomUniqueClassName(this.element.closest(".grid-stack-item")) || kendo.guid();
	};

	BaseDataEntryMap.prototype._hasThematic = function()
	{
		var type = this.type;
		if (!type)
		{
			return true;
		}
		return config[type] ? config[type].hasThematics : false;
	};

	BaseDataEntryMap.prototype._hasManuallyPin = function()
	{
		var type = this.type;
		if (!type)
		{
			return Promise.resolve(true);
		}

		return Promise.resolve(config[type] && config[type].manuallyPin);
	};

	BaseDataEntryMap.prototype._hasDrawBoundary = function()
	{
		var type = this.type;
		if (!type)
		{
			return false;
		}
		if (type == "georegion" && this.data && this.data.GeoRegionType && this.data.GeoRegionType.Boundary == "User Defined")
		{
			return true;
		}
		return false;
	};

	BaseDataEntryMap.prototype.onThematicChanged = function(e, thematicInfo)
	{
		var self = this;
		if (self.options.detailView)
		{
			// save thematicInfo on detailView for temporary using, on grid stack item for save layout
			self.options.detailView.thematicInfo = thematicInfo || {};
			var gridStackItem = $(this._map.mapView.container).closest(".grid-stack-item");
			gridStackItem.data("thematicId", thematicInfo ? thematicInfo.id : 0);
			gridStackItem.data("thematicName", thematicInfo ? thematicInfo.name : "");
		}
	};

	BaseDataEntryMap.prototype.onLegendStatusChanged = function(e, legendStatus)
	{
		if (this.options.detailView)
		{
			// save legendStatus on detailView for temporary using, on grid stack item for save layout
			this.options.detailView.legendStatus = legendStatus || {};
			var gridStackItem = $(this._map.mapView.container).closest(".grid-stack-item");
			gridStackItem.data("isLegendOpen", legendStatus ? legendStatus.isLegendOpen : true);
			gridStackItem.data("legendDescriptionChecked", legendStatus ? legendStatus.legendDescriptionChecked : true);
			gridStackItem.data("legendNameChecked", legendStatus ? legendStatus.legendNameChecked : true);
		}
	};

	BaseDataEntryMap.prototype._onMapLoad = function()
	{
		var self = this;
		self.mapLoaded = true;
		self.contextMenu && self.contextMenu.init();
		self.initShortKeyDownEvent();
		self.tryInit();
		self.onMapLoad.notify();
		PubSub.subscribe("MapCanvasUpdatedRecordsHub", self.mapCanvasUpdatedRecord);
		if (self.options.disable)
		{
			self._mapView.ui.components = ["attribution"];
			self._mapView.on("mouse-wheel", stopEvtPropagation);
			self._mapView.on("double-click", stopEvtPropagation);
			self._mapView.on("double-click", ["Control"], stopEvtPropagation);
			self._mapView.on("drag", stopEvtPropagation);
			self._mapView.on("drag", ["Shift"], stopEvtPropagation);
			self._mapView.on("drag", ["Shift", "Control"], stopEvtPropagation);
		}

		if (!tf.isViewfinder)
		{
			if (!this.options.detailView.isLayoutEditing)
			{
				self.restoreMapViewer();
			}
			else
			{
				this.isLayoutEditing = true;
			}
		}

		function stopEvtPropagation(event)
		{
			event.stopPropagation();
		}
	};

	BaseDataEntryMap.prototype.restoreMapViewer = function()
	{
		const preserved = this.getPreservedMapViewerStatus();
		if (preserved && !preserved.restored && preserved.isShow)
		{
			this.toggleMenu(this.mapViewerViewModel);
			this.mapViewerViewModel.restore(preserved.data);
			preserved.restored = true;
		}
	};

	BaseDataEntryMap.prototype.mapCanvasUpdatedRecord = function(name, result)
	{
		if (result.DatabaseId == tf.datasourceManager.databaseId)
		{
			var self = this;
			self.onUpdateRecordsEvent.notify(result);
		}
	};

	BaseDataEntryMap.prototype.tryInit = function()
	{
		this.init()
			.then(() =>
			{
				this._applyThematic();
			}).catch(err => console.log(err));
	};

	BaseDataEntryMap.prototype._applyThematic = function()
	{
		var self = this;
		if (self.RoutingMapTool.thematicTool)
		{
			self.RoutingMapTool.thematicTool.applyThematic().then(function()
			{
				// this function makes sure the thematic data bind to grid div
				if (self.options.thematicInfo && self.options.thematicInfo.id)
				{
					if (self.RoutingMapTool.thematicTool.thematicInfo == null)
					{
						self.onThematicChanged(null, null);
						self.onLegendStatusChanged(null, null);
						if (self.options.detailView.isReadMode())
						{
							self.options.detailView.saveDetail();
						}

					}
					else
					{
						self.onThematicChanged(null, self.options.thematicInfo);
						self.onLegendStatusChanged(null, self.options.legendStatus);
					}
				}
			});
		}
	};

	BaseDataEntryMap.prototype.init = function()
	{
		var self = this;
		self.RoutingMapTool.toolkitBtnClickEventEnable = true;
		self.RoutingMapTool.toolkitBtnClickEvent.subscribe(function(e, callback)
		{
			var $offMapTool = self.RoutingMapTool.$offMapTool;
			if (!$offMapTool.hasClass("active"))
			{
				var $body = $("body"),
					$mapToolBtn = $offMapTool.find(".map-tool-btn"),
					$mapToolLabel = $offMapTool.find(".map-tool-label"),
					activeMapToolHeight = $mapToolBtn.position().top + $mapToolBtn.height() + $mapToolLabel.height();
				if ($body.height() - $offMapTool.offset().top < activeMapToolHeight)
				{
					if (TF.isPhoneDevice)
					{
						var scrollTop = $offMapTool.offset().top - self.$mapDiv.parents(".grid-stack").offset().top;
						self.$mapDiv.parents(".detail-view-panel").animate({ scrollTop: scrollTop }, { complete: callback });
					}
					else
					{
						self.RoutingMapTool.landscape();
						callback();
					}
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


		// Add layers to map
		self.addLayersToMap();

		// Sometimes it needs to request for related data for map renderring.
		return self.loadDataAndAddGraphics();
	};

	BaseDataEntryMap.prototype.addLayersToMap = function()
	{
		return [];
	};

	/**
	 * Load relatd data and add graphics to map layers accordingly.
	 *
	 * @returns Promise
	 */
	BaseDataEntryMap.prototype.loadDataAndAddGraphics = function()
	{
		return Promise.resolve();
	};

	BaseDataEntryMap.prototype.initShortKeyDownEvent = function()
	{
		var self = this;
		function onMapKeyDown(e, palette)
		{
			if (palette.editTool && palette.editTool.isEditing && palette.editTool._onMapKeyDown)
			{
				palette.editTool._onMapKeyDown(e);
			}
			else if (palette.drawTool && palette.drawTool._onMapKeyDown)
			{
				palette.drawTool._onMapKeyDown(e);
			}

			if (e.key == "Escape")
			{
				self.setMode("", "Normal");
				TF.RoutingMap.ContextMenuBase.prototype.removeContextMenu();
			}
		}
		tf.documentEvent.bind("keydown.shortCutKey", self.routeState, function(e)
		{
			if (!self.palettes)
			{
				return;
			}

			self.palettes().forEach(function(palette)
			{
				palette.palettes().forEach(function(palette)
				{
					palette.sections.forEach(function(viewModel)
					{
						onMapKeyDown(e, viewModel);
					});
				});
			});
		});
	};

	BaseDataEntryMap.prototype.setMode = function(type, mode)
	{
		var self = this;
		var newMode = type + "-" + mode;
		if (self.mode == newMode && self.mode.indexOf("Normal") < 0)
		{
			// toggle
			self.mode = type + "-Normal";
		} else
		{
			self.mode = newMode;
		}

		if (self.mode.indexOf("Normal") >= 0)
		{
			self.sketchTool && self.sketchTool.stop();
		}

		this.onModeChangeEvent.notify(self.mode);
	};

	BaseDataEntryMap.prototype.getPointExtent = function(point)
	{
		return TF.Helper.MapHelper.getPointExtent(this._map, point);
	};

	BaseDataEntryMap.prototype.toggleSnap = function()
	{

	};

	BaseDataEntryMap.prototype.getSnappingPoint = function()
	{
		return Promise.resolve();
	};

	BaseDataEntryMap.prototype.addViewModelToPanel = function(viewModel)
	{
		var panel = new TF.RoutingMap.RoutingMapPanelViewModel([viewModel], true, "routingmappanel", true, null, this.routeState, this);
		this.palettes.push(panel);
	};

	BaseDataEntryMap.prototype.showMessage = function(message)
	{
		this.options.showMessage && this.options.showMessage(message);
	};

	BaseDataEntryMap.prototype.showErrorMessage = function(message)
	{
		this.options.showErrorMessage && this.options.showErrorMessage(message);
	};

	BaseDataEntryMap.prototype.restore = function()
	{
		this._map && this._map.expandMapTool && this._map.expandMapTool._restore();
	};

	BaseDataEntryMap.prototype.enableMouseEvent = function()
	{
		this.gridMapPopup.enableMouseEvent(this._map);
	};

	BaseDataEntryMap.prototype.disableMouseEvent = function()
	{
		this.gridMapPopup.disableMouseEvent();
	};

	BaseDataEntryMap.prototype.initLayers = function()
	{
		let self = this,
			drawCoordinateTimer,
			invalidateCoordinate = function()
			{
				if (drawCoordinateTimer != null)
				{
					clearTimeout(drawCoordinateTimer);
				}

				drawCoordinateTimer = setTimeout(function()
				{
					self.drawCoordinate();
					drawCoordinateTimer = null;
				});
			};

		self.manuallyPinLayerInstance = self.mapInstance.addLayer({ id: ManuallyPinLayerId, eventHandlers:{onLayerCreated: function(){ invalidateCoordinate();}}});
	}

	BaseDataEntryMap.prototype.drawCoordinate = function()
	{
		const self = this, data = self.data;
		if (self.manuallyPinLayerInstance && data.XCoord && data.YCoord)
		{
			const markerSymbol = {
				type: "picture-marker",
				url: "./global/img/map/map-pin.png",
				width: "32px",
				height: "32px",
			};
			const longitude = data.XCoord, latitude = data.YCoord;
			const attributes = {
				Id: data.Id,
				Name: data.Name,
				Street: data.Street,
				XCoord: longitude,
				YCoord: latitude,
				Notes: data.Notes,
				City: data.City,
				State: data.State,
				Zip: data.Zip
			};

			self.manuallyPinLayerInstance.addPoint(longitude, latitude, markerSymbol, attributes);
			self.mapInstance.centerAt(longitude, latitude);
		}
	}

	BaseDataEntryMap.prototype.getManuallyPinLayer = function()
	{
		return this.mapInstance.getMapLayer(ManuallyPinLayerId);
	}

	function getValueByAttr(optionObj, attr, defaultValue)
	{
		return optionObj == undefined || optionObj[attr] == undefined ? defaultValue : optionObj[attr];
	}

	BaseDataEntryMap.prototype.dispose = function()
	{
		tf.documentEvent.unbind("keydown.shortCutKey", this.routeState);

		this.obIsReadOnly.dispose();
		this.RoutingMapTool && this.RoutingMapTool.dispose();
		this.restore();
		this.mapLayersPaletteViewModel && this.mapLayersPaletteViewModel.dispose();

		this.parcelPaletteViewModel && this.parcelPaletteViewModel.dispose();
		PubSub.unsubscribe(this.mapCanvasUpdatedRecord);
		(this.sections || []).forEach(function(section)
		{
			section.dispose();
		});

		this.gridMapPopup && this.gridMapPopup.dispose();
		this.contextMenu && this.contextMenu.dispose();
		this.symbol && this.symbol.dispose();

		this.sketchTool && this.sketchTool.dispose();

		if (this._mapView)
		{
			let canvas = this._mapView.container.querySelector('canvas');
			if (canvas)
			{
				let gl = canvas.getContext('webgl');
				gl.getExtension('WEBGL_lose_context').loseContext();
				this._mapView.container = null;
			}

			this._mapView.destroy();
			this._mapView.map = null;

			this._mapView.center && !this._mapView.center.destroyed && this._mapView.center.destroy();
			this._mapView.constraints && !this._mapView.constraints.destroyed && this._mapView.constraints.destroy();
			this._mapView.layerViews && !this._mapView.layerViews.destroyed && this._mapView.layerViews.destroy();
			this._mapView.magnifier && !this._mapView.magnifier.destroyed && this._mapView.magnifier.destroy();
			this._mapView.spatialReference && !this._mapView.spatialReference.destroyed && this._mapView.spatialReference.destroy();
		}

		if (this._map)
		{
			this._map.mapView = null;

			this._map.ground && !this._map.ground.destroyed && this._map.ground.destroy();
			this._map.layers && !this._map.layers.destroyed && this._map.layers.destroy();
			this._map.basemap && !this._map.basemap.destroyed && this._map.basemap.destroy();
			this._map.allLayers && !this._map.allLayers.destroyed && this._map.allLayers.destroy();
			this._map.expandMapTool && this._map.expandMapTool.dispose();
			this._map.destroy();

			this._map.expandMapTool = null;
			this._map.SketchViewModel = null;
		}

		if (this.mapViewerViewModel)
		{
			if (!this.isLayoutEditing && !this.options.detailView.closeClick)
			{
				const data = this.mapViewerViewModel.export();
				this.preserveMapViewerStatus(data);
			}
			this.mapViewerViewModel.dispose();
		}
		if (this.options.detailView.closeClick)
		{
			delete mapStatus[this.type];
			this.options.detailView.closeClick = false;
		}
		if (this.isLayoutEditing)
		{
			this.isLayoutEditing = false;
			this.options.detailView.isLayoutEditing = false;
		}
		this.routingMapPanelManager && this.routingMapPanelManager.dispose();

		(this.palettes() || []).forEach(p => p.dispose());

		tfdispose(this);
	};
})();