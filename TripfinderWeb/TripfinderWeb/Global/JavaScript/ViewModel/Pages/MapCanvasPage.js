(function()
{
	createNamespace("TF.Page").MapCanvasPage = MapCanvasPage;

	function MapCanvasPage(mapObjects, routeState)
	{
		var self = this;
		self.documentType = TF.Document.DocumentData.RoutingMap;
		self._type = "Map Canvas";
		self.obtabName = ko.observable("Map Canvas");
		TF.Document.BaseDocumentViewModel.call(self, routeState, self._type);
		self.DocumentData.data = mapObjects;
		self._arcgis = null;
		self._map = null;
		self.obAreaUnit = ko.observable();
		self.obDistanceUnit = ko.observable();
		self._currentMeasureOption = null;
		self.element = null; // the route element of the template html
		self.obCopyPolygonObject = ko.observable(null);
		self.obCopyLineObject = ko.observable(null);
		self.obCopyPointObject = ko.observable(null);
		self.obCopyStopObject = ko.observable(null);
		self.editModals = ko.observableArray([]);

		self.onMapLoad = new TF.Events.Event();
		self.onModeChangeEvent = new TF.Events.Event();
		self.onUpdateRecordsEvent = new TF.Events.Event();
		self.menuDataUpdateEvent = new TF.Events.Event();
		self.onStopEditingEvent = new TF.Events.Event();

		self.onMapViewCustomizedEvent = new TF.Events.Event();

		// arrange the panels and palettes.

		self.palettes = ko.observableArray([]);
		self.initViewModels();
		this.isEnableTrace = false;
		this.changeHighlight = this.changeHighlight.bind(this);
		this.autoPan = null;
		this.revertMode = "";
		this.revertData = null;
		this.prevent = false;
		self.togglePalettePanel = self.togglePalettePanel.bind(self);

		self.routingMapContextMenu = new TF.RoutingMap.RoutingMapPanel.RoutingMapContextMenu(self);
	}

	MapCanvasPage.prototype = Object.create(TF.Document.BaseDocumentViewModel.prototype);
	MapCanvasPage.prototype.constructor = MapCanvasPage;

	MapCanvasPage.prototype.templateName = "workspace/page/RoutingMap/mapcanvaspage";

	MapCanvasPage.prototype.initViewModels = function()
	{
		const self = this,
			routeState = self.routeState;

		self.travelScenariosPaletteViewModel = new TF.RoutingMap.TravelScenariosPaletteViewModel(self, true, routeState);
		self.directionPaletteViewModel = new TF.RoutingMap.DirectionPaletteViewModel(self, true, routeState);
		self.boundaryPaletteViewModel = {obShow: ko.observable(false)}; // new TF.RoutingMap.BoundaryPaletteViewModel(self, true, routeState);
		self.mapLayersPaletteViewModel = {obShow: ko.observable(false)}; // new TF.RoutingMap.MapLayersPaletteViewModel(self, true, routeState);
		self.routingPaletteViewModel = new TF.RoutingMap.RoutingPaletteViewModel(self, true, routeState);  // {obShow: ko.observable(false)}; // 
		self.customMapPaletteViewModel = {obShow: ko.observable(false)}; // new TF.RoutingMap.CustomMapPaletteViewModel(self, true, routeState);
		self.gpsPaletteViewModel = {obShow: ko.observable(false)}; // new TF.RoutingMap.GPSPaletteViewModel(self, true, routeState);
		self.geoSearchPaletteViewModel = {obShow: ko.observable(false)}; // new TF.RoutingMap.GeoSearchPaletteViewModel(self, true, routeState);
		self.routingMapPanelManager = new TF.RoutingMap.RoutingMapPanelManager(self);
		self.traceManager = {obShow: ko.observable(false)}; // new TF.RoutingMap.TracingManager();
		self.routingSnapManager = new TF.Document.RoutingSnapManger(self);
		// self.routingSnapManager.snapToggleEvent.subscribe(self.snapToggleEvent.bind(self));
		// self.routingPaletteViewModel.fieldTripPaletteSectionVM.eventsManager.requireDetailsEvent.subscribe((e, data) =>
		// {
		// });
	};

	MapCanvasPage.prototype.init = async function(model, element)
	{
		var self = this;
		self.element = $(element);
		self.$mapDiv = this.element.find(".map");
		// tf.loadingIndicator.showImmediately();
		self.obAreaUnit("Sq Miles");
		self.obDistanceUnit("Miles");
		// init
		self._arcgis = tf.map.ArcGIS;
		await self._initMap();
	};

	MapCanvasPage.prototype.onMapViewUpdated = function()
	{
		const self = this;
		if (!self.mapInstance)
		{
			return;
		}

		try
		{
			if (self.mapInstance.eventHandler.onMapViewUpdated)
			{
				self.mapInstance.eventHandler.onMapViewUpdated.remove();
			}
			// self._map.mapView.on("drag", () =>
			// {
			// 	self._dragging = true;
			// 	clearTimeout(self._draggingTimeout);
			// 	self._draggingTimeout = setTimeout(() => { self._dragging = false; });
			// }, 50);
			self._map.mapView.on("click", self.onRightClickMenu.bind(self));
			self.autoPan = TF.RoutingMap.AutoPanManager.getAutoPan(self._map);
			self.autoPan.initialize(self.element, 20);
			self.directionPaletteViewModel.onOpenDestinationDropModeClicked.subscribe(self._clickOpenDestinationDropMode.bind(self));
			self.directionPaletteViewModel.onRerunClicked.subscribe(self._rerun.bind(self));

			self._initDirectionTool();

			self._initMapTool();
			self.routingMapPanelManager.init();
			// tf.loadingIndicator.tryHide();
			PubSub.subscribe("clear_ContextMenu_Operation", self.routingMapContextMenu.clearOperation.bind(self.routingMapContextMenu));

			self._onMapLoad();

			// // the trips that need to be auto open
			// if (self.DocumentData.data && self.DocumentData.data.trips)
			// {
			// 	self.togglePalettePanel(self.routingPaletteViewModel, $("<div></div>"));
			// }
		}
		catch (e)
		{
			console.error(e);
		}
	}

	MapCanvasPage.prototype.onMapViewCustomizedEventHandler = function(event)
	{
		this.onMapViewCustomizedEvent.notify(event);
	}

	MapCanvasPage.prototype.getHash = function()
	{
		return "MapCanvas";
	};

	MapCanvasPage.prototype.switchLocatedStatus = function(flag)
	{
		var $navigateBtnIcon = this.$navigation;

		if (flag)
		{
			$navigateBtnIcon.addClass("located");
		} else
		{
			$navigateBtnIcon.removeClass("located");
		}
	};

	MapCanvasPage.prototype._initDirectionTool = function()
	{
		const self = this;

		self._createDirectionsTool();
		self._directionsTool.subscribe("onStopChanged", self.stopChanged.bind(self));
		self._directionsTool.subscribe("onDirectionsChanged", self.directionResultChanged.bind(self));
		self._directionsTool.subscribe("onDropDestinationsChanged", self.directionPaletteViewModel.setDropDownMode.bind(self.directionPaletteViewModel));

		self.directionPaletteViewModel.onDataChanged.subscribe(function(e, ret)
		{
			var inputData = directionPanelDataDirectionToolAdapter(ret.data);
			self._directionsTool.isRoundTrip = ret.roundTripChecked;
			self._directionsTool.isDirectionDetailsRequired = ret.detailsRequired;
			self._directionsTool.isTomTomNAChecked = ret.tomTomNAChecked;
			self._directionsTool.isChangeRouteChecked = ret.changeRouteChecked;
			self._directionsTool.isMapDetailsChecked = ret.mapDetailsChecked;
			self._directionsTool.isShowArrowsChecked = ret.showArrowsChecked;

			if (!ret.skipReload)
			{
				clearTimeout(self.rebindDataToMapTimeout);
				self.rebindDataToMapTimeout = setTimeout(function()
				{
					destinationValidation(self, inputData.destinationPoints).then(function(destinations)
					{
						if (inputData.destinationPoints.length === 0 &&
							inputData.throughPoints.length === 0)
						{
							// clear all
							self._directionsTool.clear();
						}
						else
						{
							if (ret.reloadTrip)
							{
								self._directionsTool.refreshTrip();
							}
							else
							{
								self._directionsTool.AddDestinationFromDirectionsPanel(inputData.destinationPoints, inputData.throughPoints);
							}
						}
					});
				}, 500);
			}
		});

		self.directionPaletteViewModel.onUTurnPolicyChanged.subscribe(function(eventData, settings)
		{
			if (settings.Allowed)
			{
				self._directionsTool.uTurnPolicy = TF.RoutingMap.Directions.Enum.UTurnPolicyEnum.ALLOWED;
			}
			else if (settings.Allowed_Only_at_Dead_Ends)
			{
				self._directionsTool.uTurnPolicy = TF.RoutingMap.Directions.Enum.UTurnPolicyEnum.DEAD_ENDS_ONLY;
			}
			else if (settings.Allowed_Only_at_Intersections_and_Dead_Ends)
			{
				self._directionsTool.uTurnPolicy = TF.RoutingMap.Directions.Enum.UTurnPolicyEnum.INTERSECTION_AND_DEAD_ENDS_ONLY;
			}
			else if (settings.Not_Allowed)
			{
				self._directionsTool.uTurnPolicy = TF.RoutingMap.Directions.Enum.UTurnPolicyEnum.NOT_ALLOWED;
			}
			self._directionsTool.refreshStopCurbApproach();
			self._directionsTool.refreshTrip();
		});

		self.directionPaletteViewModel.onRemovePointClicked.subscribe(function(e, seq)
		{
			self._directionsTool._removeStopPopup();
			self._directionsTool.RemoveStop(seq);
		});

		self.directionPaletteViewModel.onSetAsThroughPointClicked.subscribe(function(e, seq)
		{
			self._directionsTool._removeStopPopup();
			self._directionsTool._destinationToThroughPoint(seq);
		});

		self.directionPaletteViewModel.onSetAsDestinationClicked.subscribe(function(e, seq)
		{
			self._directionsTool._removeStopPopup();
			self._directionsTool._throughPointToDestination(seq);
		});

		self.directionPaletteViewModel.onZoomToLayersClicked.subscribe(function(e, seq)
		{
			var dockerOptions = getDockerOptions();
			if (dockerOptions)
				self._directionsTool.zoomToLayer(dockerOptions);
		});

		self.directionPaletteViewModel.onDetailsMouseEntered.subscribe(function(e, data)
		{
			self._directionsTool._addHighlightTrip(data);
		});

		self.directionPaletteViewModel.onDetailsMouseLeaved.subscribe(function(e, seq)
		{
			self._directionsTool._removeHighlightTrip();
		});

		var destinationValidation = function(self, destinations)
		{
			var destination = null,
				address = null,
				reSearchList = [],
				deferred = [];
			for (var i = destinations.length - 1; i >= 0; --i)
			{
				destination = destinations[i];
				if (destination.XCoord === undefined || destination.YCoord === undefined)
				{
					address = destination.Address;
					reSearchList.push({
						"Address": address,
						"Index": i
					});
				}
			}

			reSearchList.forEach(function(element)
			{
				deferred.push(self._directionsTool._searchTool.search(element.Address));
			});

			return Promise.all(deferred).then(function(responses)
			{
				var response = null,
					index = null,
					geometry = null;
				for (var i = responses.length - 1; i >= 0; --i)
				{
					response = responses[i];
					index = reSearchList[i].Index;
					if (response.results[0].results[0])
					{
						geometry = response.results[0].results[0].feature.geometry;
						destinations[index].XCoord = geometry.x;
						destinations[index].YCoord = geometry.y;
					}
				}

				return destinations;
			});
		};

		var getDockerOptions = function()
		{
			var options = [];
			var $rightDockers = self.element.find(".routingmap_panel.dock-right:not(.in)");
			var $leftDockers = self.element.find(".routingmap_panel.dock-left:not(.in)");

			var rightOpt = {};
			var maxWidth = 0;
			$rightDockers.map(function(idx, rightDocker)
			{
				var $rightDocker = $(rightDocker);
				if ($rightDocker.parent().css("display") === "none")
					return;

				var currentlyWidth = $rightDocker.outerWidth();
				if (currentlyWidth > maxWidth)
				{
					rightOpt = {
						width: currentlyWidth,
						height: $rightDocker.outerHeight(),
						dockerPosition: "right",
					};
					maxWidth = currentlyWidth;
				}
			});
			if (rightOpt.dockerPosition)
				options.push(rightOpt);

			var leftOpt = {};
			maxWidth = 0;
			$leftDockers.map(function(idx, leftDockers)
			{
				var $leftDockers = $(leftDockers);
				if ($leftDockers.parent().css("display") === "none")
					return;

				var currentlyWidth = $leftDockers.outerWidth();
				if (currentlyWidth > maxWidth)
				{
					leftOpt = {
						width: currentlyWidth,
						height: $leftDockers.outerHeight(),
						dockerPosition: "left",
					};
					maxWidth = currentlyWidth;
				}
			});
			if (leftOpt.dockerPosition)
				options.push(leftOpt);

			return options;
		};

		var directionPanelDataDirectionToolAdapter = function(data)
		{
			var seq = 1;
			var destPts = [];
			var throughPts = [];

			if (data.length === 0)
				return {
					destinationPoints: destPts,
					throughPoints: throughPts
				};

			data.forEach(function(destItem, idx)
			{
				var destPt = destItem.toData();
				if (destPt.Address === null ||
					destPt.Address === undefined ||
					destPt.Address === "")
					return true;

				destPt.Seq = seq;

				destPts.push(destPt);
				seq++;

				destItem.throughPoints().forEach(function(throughItem)
				{
					var throughPt = throughItem.toData();
					throughPt.Seq = seq;
					throughPts.push(throughPt);
					seq++;
				}, this);
			}, this);

			return {
				destinationPoints: destPts,
				throughPoints: throughPts
			};
		};
	};

	MapCanvasPage.prototype.updatePanelsStatus = function(viewModel)
	{
		var panel;
		var paletteLength = this.palettes().length;
		if (viewModel.panel)
		{
			panel = viewModel.panel;
		}
		else
		{
			var position = null, isLeft = null;
			if (paletteLength > 0)
			{
				position = { top: 100 * paletteLength, left: 100 * paletteLength };
				if (position.top > document.body.offsetHeight / 2)
				{
					position.top = 100;
				}
			} else
			{
				isLeft = true;
			}
			panel = new TF.RoutingMap.RoutingMapPanelViewModel([viewModel], isLeft, "routingmappanel" + (paletteLength + 1), true, position, this.routeState, this);
			this.palettes.push(panel);
		}
		viewModel.panel = panel;
	};

	MapCanvasPage.prototype.togglePalettePanel = async function(data, icon)
	{
		var self = this;
		var show = data.obShow();
		var promise = show ? data.unSaveCheck() : Promise.resolve(true);

		// var _handleDirectionsResearch = async () =>
		// {
		// 	// close opening direction palette.
		// 	var _data = null;
	
		// 	if (self.directionPaletteViewModel.obShow())
		// 	{
		// 		_data = self.directionPaletteViewModel;
		// 	}
	
		// 	if (_data !== null)
		// 	{
		// 		_data.unSaveCheck();
		// 		await _closeDirectionPalette(null, _data);
		// 	}

		// 	_closeDirectionPalette = async (_, _data) =>
		// 	{
		// 		_data.close();
		// 		_data.obShow(false);
		// 		self.updatePanelsStatus(_data);
	
		// 		self.toggleTravelScenarioLock();
		// 		return Promise.resolve(true);
		// 	};

		// 	if (data instanceof TF.RoutingMap.DirectionPaletteViewModel)
		// 	{
		// 		if (self.directionPaletteViewModel != null) {
		// 			self.directionPaletteViewModel.dispose();
		// 			self.directionPaletteViewModel = null;
		// 		}

		// 		self.directionPaletteViewModel = data;
		// 		if (self.directionPaletteViewModel)
		// 		{
		// 			self.directionPaletteViewModel.onOpenDestinationDropModeClicked.subscribe(self._clickOpenDestinationDropMode.bind(self));
		// 			self.directionPaletteViewModel.onRerunClicked.subscribe(self._rerun.bind(self));
		// 		}
	
		// 		self._initDirectionTool();
		// 	}
		// }
		// await _handleDirectionsResearch();


		if (!self.checkRoutingAndBoundaryCannotOpenTogether(data))
		{
			return;
		}

		return promise.then(function(ans)
		{
			if (ans != null)
			{
				var isShow = !show;
				if (isShow)
				{
					if (icon)
					{
						icon.removeClass("disable");
					}
					setTimeout(function()
					{
						data.show();
					}, 100);
				} else
				{
					if (icon)
					{
						icon.addClass("disable");
					}
					data.close && data.close();
				}
				data.obShow(isShow);
				self.updatePanelsStatus(data);
			} else
			{
				var menuItem = null;
				self.RoutingMapTool.rootMenuItem.enum(self.RoutingMapTool.rootMenuItem, function(item)
				{
					if (item.header && item.header == data.title)
					{
						menuItem = item;
					}
				});
				if (menuItem)
				{
					TF.Map.RoutingMapTool.prototype.clickFirstSubMenu(menuItem);
				}
			}
			return Promise.resolve(true);
		});
	};

	MapCanvasPage.prototype.toggleTravelScenarioLock = function()
	{
		var shows = [this.mapEditingPaletteViewModel.obShow(), this.routingPaletteViewModel.obShow(), this.travelScenariosPaletteViewModel.obShow()];
		var selectedTravelScenario = this.travelScenariosPaletteViewModel.travelScenariosViewModel.obSelectedTravelScenarios();
		if (selectedTravelScenario)
		{
			if (shows.indexOf(true) >= 0)
			{
				if (!this.isTravelScenarioLock)
				{
					this.isTravelScenarioLock = true;
					TF.RoutingMap.TravelScenariosPalette.TravelScenariosDataModel.useTravelScenario(selectedTravelScenario.Id, this.routeState);
				}
			} else if (this.isTravelScenarioLock)
			{
				this.isTravelScenarioLock = false;
				TF.RoutingMap.TravelScenariosPalette.TravelScenariosDataModel.unUseTravelScenario(selectedTravelScenario.Id, this.routeState);
			}
		}
	};

	MapCanvasPage.prototype.checkRoutingAndBoundaryCannotOpenTogether = function(data)
	{
		var self = this;
		var show = data.obShow();
		var canOpen = true;

		if (data.type == "boundary" && !show)
		{
			if (self.routingPaletteViewModel.obShow())
			{
				canOpen = false;
				tf.promiseBootbox.alert("Boundary Planning and Routing can't open together. Please close Routing.");
			}
		}
		if (data.type == "routing" && !show)
		{
			if (self.boundaryPaletteViewModel.obShow())
			{
				canOpen = false;
				tf.promiseBootbox.alert("Boundary Planning and Routing can't open together. Please close Boundary Planning.");
			}
		}

		return canOpen;
	};

	MapCanvasPage.prototype._initMapTool = function()
	{
		const self = this;
		self.RoutingMapTool = new TF.Map.RoutingMapTool(self, {
			printAvailable: true,
			trafficMapAvailable: true,
			thematicAvailable: false,
			geoFinderAvailable: false,
			geoSearchAvailable: false,
			buildPalettes: function()
			{
				const palettes = [
					// TF.Map.RoutingMapTool.buildMenuItem('Boundary Planning', 'boundary', self.boundaryPaletteViewModel, self.togglePalettePanel),
					TF.Map.RoutingMapTool.buildMenuItem('Map Viewer', 'custommap', self.customMapPaletteViewModel, self.togglePalettePanel, 4),
					TF.Map.RoutingMapTool.buildMenuItem('Directions', 'direction', self.directionPaletteViewModel, self.togglePalettePanel, 0),
					TF.Map.RoutingMapTool.buildMenuItem('Geo Search', 'geoSearch', self.geoSearchPaletteViewModel, self.togglePalettePanel, 3),
					// TF.Map.RoutingMapTool.buildMenuItem('My Base Map Layers', 'maplayers', self.mapLayersPaletteViewModel, self.togglePalettePanel)
				];

				if (tf.authManager.hasGPS())
				{
					palettes.push(TF.Map.RoutingMapTool.buildMenuItem('GPS', 'gps', self.gpsPaletteViewModel, self.togglePalettePanel, 1));
				}

				if (tf.authManager.isAuthorizedFor("mapEdit", "read"))
				{
					// palettes.push(TF.Map.RoutingMapTool.buildMenuItem('Map Editing', 'mapedit', self.mapEditingPaletteViewModel, self.togglePalettePanel));
					palettes.push(TF.Map.RoutingMapTool.buildMenuItem('Travel Scenarios', 'travelScenarios', self.travelScenariosPaletteViewModel, self.togglePalettePanel, 6));
				}
				if (tf.authManager.isAuthorizedFor("routingMap", 'read'))
				{
					const fieldTripsMenuItem = TF.Map.RoutingMapTool.buildMenuItem('Field Trips', 'fieldTrips', self.routingPaletteViewModel, self.togglePalettePanel, 2);
					fieldTripsMenuItem.headerAlias = "Routing";
					palettes.push(fieldTripsMenuItem);
				}

				// if (tf.authManager.hasWayfinder())
				// {
				// 	self.wayfinderPaletteViewModel = new TF.RoutingMap.WayfinderPaletteViewModel(self, true, self.routeState);
				// 	palettes.push(TF.Map.RoutingMapTool.buildMenuItem('Wayfinder', 'wayfinder', self.wayfinderPaletteViewModel, self.togglePalettePanel));
				// }

				return palettes;
			}
		});

		self.palettes().forEach(function(palette)
		{
			palette.routingMapTool = self.RoutingMapTool;
		});

		TF.RoutingMap.GeocodeHelper.initialize();//used in directions palette/routing palette
	};

	MapCanvasPage.prototype._initMap = async function()
	{
		const self = this,
			eventHandlers = {
				onMapViewCreated: () =>
				{
					self.mapInstance.setExtent(TF.createDefaultMapExtent());
				},
				onMapViewUpdated: self.onMapViewUpdated.bind(self),
				onMapViewCustomizedEventHandler: self.onMapViewCustomizedEventHandler.bind(self),
			};

		self.mapInstance = await TF.Helper.MapHelper.createMapInstance(self.$mapDiv, eventHandlers);;
		self._map = self.mapInstance.map;
	}

	MapCanvasPage.prototype._onMapLoad = function()
	{
		var self = this;
		tf.loadingIndicator.tryHide();
		self.routingSnapManager.init(this._map);
		// self._initToggleTrace();
		self._initSketchTool();
		self.initShortKeyDownEvent();
		self.onMapLoad.notify();

		self.mapCanvasUpdatedRecord = self.mapCanvasUpdatedRecord.bind(self);
		PubSub.subscribe("MapCanvasUpdatedRecordsHub", this.mapCanvasUpdatedRecord);
		self.menuDataUpdatd = self.menuDataUpdatd.bind(self);
		PubSub.subscribe("MenuDataUpdatedHub", this.menuDataUpdatd);
	};

	MapCanvasPage.prototype.initShortKeyDownEvent = function()
	{
		const self = this;
		tf.documentEvent.bind("keydown.shortCutKey", self.routeState, function(e)
		{
			if (e.key == "Escape")
			{
				self.routingPaletteViewModel?.fieldTripMapOperation?.confirmToExitAddingStop();
			}
		});
	};

	MapCanvasPage.prototype._clickOpenDestinationDropMode = function()
	{
		var self = this;
		self.setMode("Direction", "CreateDirection");
		// not allowed to start drop mode when using measurement tool.
		if (self._currentMeasureOption !== null) return;

		if (!self._directionsTool)
		{
			self._createDirectionsTool();
		}
		self._directionsTool.toggleDropMode();
	};

	MapCanvasPage.prototype._rerun = function()
	{
		var self = this;
		self._directionsTool.refreshTrip();
	};

	MapCanvasPage.prototype._createDirectionsTool = function()
	{
		var self = this;
		self._directionsTool = new TF.RoutingMap.Directions.Tool(self._map, self._arcgis, self);
	};

	MapCanvasPage.prototype.directionResultChanged = function(e, results)
	{
		this.directionPaletteViewModel.updateDirectionDetails(e, results);
	};

	MapCanvasPage.prototype.stopChanged = function(e, stops)
	{
		this.directionPaletteViewModel.updateStopDetails(e, stops);
	};

	MapCanvasPage.prototype.saveClick = function(e)
	{
		var self = this;
		e.preventDefault();
		self.palettes().map(function(palette)
		{
			palette.palettes().map(function(p)
			{
				if (p.type === "parcel" || p.type === "boundary")
				{
					if (p.obShow())
					{
						p.fileEvent.saveClick(e);
					}
				}
			});
		});
	};

	MapCanvasPage.prototype.revertClick = function(e)
	{
		var self = this;
		e.preventDefault();
		self.palettes().map(function(palette)
		{
			palette.palettes().map(function(p)
			{
				if (p.type === "parcel" || p.type === "boundary")
				{
					if (p.obShow())
					{
						p.fileEvent.revertClick(e);
					}
				}
			});
		});
	};

	/***
	 * this method is aimed at toggling palette section level icons' status
	 * (with the help of mapModeStyleButton.js)
	 */
	MapCanvasPage.prototype.setMode = function(type, mode)
	{
		var self = this,
			newMode = `${type}-${mode}`;
		if (self.mode == newMode && self.mode.indexOf("Normal") < 0)
		{
			// toggle
			self.mode = `${type}-Normal`;
		}
		else
		{
			self.mode = newMode;
		}
		if (self.mode.indexOf("Normal") >= 0)
		{
			self.sketchTool?.stop();
		}
		self.onModeChangeEvent.notify(self.mode);
	};

	/**
	 * init sketchViewModel of ESRI API 4.10 for draw and edit
	 * @returns {void} 
	 */
	MapCanvasPage.prototype._initSketchTool = function()
	{
		var self = this;
		self.sketchTool = new TF.RoutingMap.SketchTool(self._map, self);
	};

	MapCanvasPage.prototype.restartDraw = function()
	{
		var self = this;
		switch (self.sketchTool.currentDrawStatus)
		{
			case "create":
				self.sketchTool.currentDrawTool.create(self.sketchTool.currentDrawType);
				break;
			case "addRegion":
				self.sketchTool.addRegion(self.sketchTool.currentDrawType, function(graphic)
				{
					self.sketchTool.currentDrawTool.addRegionCallback(graphic);
				}, self.sketchTool.currentDrawTool);
				break;
			case "removeRegion":
				self.sketchTool.removeRegion(self.sketchTool.currentDrawType, function(graphic)
				{
					self.sketchTool.currentDrawTool.removeRegionCallback(graphic);
				}, self.sketchTool.currentDrawTool);
				break;
			case "redrawRegion":
				self.sketchTool.redrawRegion(self.sketchTool.currentDrawType, function(graphic)
				{
					self.sketchTool.currentDrawTool.redrawRegionCallback(graphic);
				}, self.sketchTool.currentDrawTool);
				break;
			case "geofinder-polygon":
			case "geofinder-point":
				self.sketchTool.currentDrawTool.create(self.sketchTool.currentDrawStatus.split("-")[1]);
				break;
		}
	}

	/**
	 * when click T key, enable the trace function. it only enable when snap is active
	 * @returns {void} 
	 */
	MapCanvasPage.prototype._initToggleTrace = function()
	{
		var self = this;
		tf.documentEvent.bind("keydown.mapTrace", this.routeState, function(e)
		{
			var $target = $(e.target);
			// 84 is the T key, avoid s key when on typing in input
			if (e.keyCode == 84 && !e.ctrlKey && !($target.is("input") && !$target.hasClass("number")) && !$target.is("textarea"))
			{
				if (!self.isEnableTrace && self.routingSnapManager.isEnableSnapping)
				{
					self.traceManager.enableTracing(true);
					self.isEnableTrace = true;
				} else
				{
					self.traceManager.enableTracing(false);
					self.isEnableTrace = false;
				}
			}
		});
	};

	/**
	 * when add new layers onto map, re-activate the snappingManager to include the layer(s)
	 * @returns {void} 
	 */
	MapCanvasPage.prototype.toggleSnap = function()
	{
		this.routingSnapManager.toggleSnap();
	};

	/**
	 * get snapping point
	 */
	MapCanvasPage.prototype.getSnappingPoint = function()
	{
		return this.routingSnapManager.getSnappingPoint();
	};

	MapCanvasPage.prototype.getJunctionStreetOnPoint = function(point)
	{
		return this.routingSnapManager.getJunctionStreetOnPoint(point);
	};

	MapCanvasPage.prototype.getNearestJunctionPointInBuffer = function(point, distanceBuffer)
	{
		return this.routingSnapManager.getNearestJunctionPointInBuffer(point, distanceBuffer);
	};

	MapCanvasPage.prototype.getJunctionPointsInBuffer = function(point, distanceBuffer)
	{
		return this.routingSnapManager.getJunctionPointsInBuffer(point, distanceBuffer);
	}

	MapCanvasPage.prototype.findJunctionInGeometry = function(geometry)
	{
		return this.routingSnapManager.findJunctionInGeometry(geometry);
	};

	MapCanvasPage.prototype.snapToggleEvent = function(e, enabled)
	{
		if (!enabled)
		{
			this.traceManager.enableTracing(false);
			this.isEnableTrace = false;
		}
	};

	MapCanvasPage.prototype.getPointExtent = function(point)
	{
		return TF.Helper.MapHelper.getPointExtent(this._map, point);
	};

	MapCanvasPage.prototype.mapCanvasUpdatedRecord = function(name, result)
	{
		var self = this;
		self.onUpdateRecordsEvent.notify(result);
	};

	MapCanvasPage.prototype.menuDataUpdatd = function(name, result)
	{
		var self = this;
		self.menuDataUpdateEvent.notify(result);
	};

	MapCanvasPage.prototype.onRightClickMenu = function(e)
	{
		var self = this;
		if (self.directionPaletteViewModel.obIsDropModeOpen())
		{
			return;
		}

		if (e.button == 0)
		{
			PubSub.publish("clear_ContextMenu_Operation");
		}
	};

	/**
	 * Copy from Selection 
	 * trigger this function when highlight change, this will log last available geometry and use this to copy from selection
	 * @param {Object} highlightData 
	 * @param {String} type 
	 * @param {Function} getData 
	 */
	MapCanvasPage.prototype.changeHighlight = function(highlightData, type, getData, typeKey)
	{
		var self = this;
		typeKey = typeKey || "type";
		if (!this.allHighlightData)
		{
			this.allHighlightData = [];
		}
		this.allHighlightData = this.allHighlightData.filter(function(item)
		{
			return item[typeKey] != type;
		});
		(highlightData || []).forEach(function(item)
		{
			if (item.geometry.type == "polygon" || item.geometry.type == "polyline" || item.geometry.type == "point")
			{
				item._getData = getData;
				self.allHighlightData.push(item);
			}
		});
		if (this.allHighlightData.length == 1)
		{
			var data = this.allHighlightData[0];
			data.getData = function()
			{
				var item = data._getData(data.id);
				if (item && item.geometry)
				{
					item.geometry = TF.cloneGeometry(item.geometry);
				}
				item = $.extend({}, item);
				delete item.type;
				return item;
			};

			if (data.geometry.type == "polygon")
			{
				this.obCopyPolygonObject(data);
			}
			if (data.geometry.type == "polyline")
			{
				this.obCopyLineObject(data);
			}
			if (data.geometry.type == "point")
			{
				this.obCopyPointObject(data);
			}
		} else
		{
			this.obCopyPolygonObject(null);
			this.obCopyLineObject(null);
			this.obCopyPointObject(null);
		}
	};

	MapCanvasPage.prototype.canClose = function()
	{
		var self = this,
			editViewModes = [self.boundaryPaletteViewModel,
			self.mapEditingPaletteViewModel,
			self.routingPaletteViewModel];

		var promises = editViewModes.map(function(viewModel)
		{
			return viewModel.obShow() ? viewModel.unSaveCheck() : Promise.resolve(true);
		});
		return Promise.all(promises).then(function(results)
		{
			if (results && results.filter(function(c) { return c != true; }).length == 0)
			{
				return tf.promiseBootbox.yesNo({ message: "Do you want to leave this page?", title: "Confirm Message", closeButton: true });
			}
		});
	};

	MapCanvasPage.prototype.getMapInstance = function()
	{
		return this.mapInstance;
	}

	MapCanvasPage.prototype.dispose = function()
	{
		TF.Document.BaseDocumentViewModel.prototype.dispose.call(this);

		// Add optional chaining(?.) operator, in case the referenced object has been disposed already.
		this.onMapLoad?.unsubscribeAll();
		this.onModeChangeEvent?.unsubscribeAll();
		this.onUpdateRecordsEvent?.unsubscribeAll();
		this.menuDataUpdateEvent?.unsubscribeAll();
		this.onStopEditingEvent?.unsubscribeAll();
		this.onMapViewCustomizedEvent?.unsubscribeAll();

		// this.routingSnapManager.dispose();

		this.directionPaletteViewModel?.dispose();
		// this.boundaryPaletteViewModel.dispose();
		// this.mapEditingPaletteViewModel.dispose();
		this.travelScenariosPaletteViewModel?.dispose();
		// this.mapLayersPaletteViewModel.dispose();
		this.routingPaletteViewModel?.dispose();
		// this.customMapPaletteViewModel.dispose();
		// this.gpsPaletteViewModel.dispose();
		// this.geoSearchPaletteViewModel.dispose();
		// this.routingMapPanelManager.dispose();
		// this.wayfinderPaletteViewModel && this.wayfinderPaletteViewModel.dispose();

		// this._directionsTool && this._directionsTool.dispose();
		// this.RoutingMapTool && this.RoutingMapTool.dispose();
		// tf.documentEvent.unbindAllByRouteState(this.routeState);
		PubSub.unsubscribe(this.mapCanvasUpdatedRecord);
		PubSub.unsubscribe(this.menuDataUpdatd);

		if (this.isTravelScenarioLock && this.travelScenariosPaletteViewModel.travelScenariosViewModel.obSelectedTravelScenarios())
		{
			this.isTravelScenarioLock = false;
			TF.RoutingMap.TravelScenariosPalette.TravelScenariosDataModel.unUseTravelScenario(this.travelScenariosPaletteViewModel.travelScenariosViewModel.obSelectedTravelScenarios().Id, this.routeState);
		}

		if (this.mapInstance)
		{
			TF.GIS.MapFactory.destroyMapInstance(this.mapInstance);
			this.mapInstance = null;
		}

		this.routingMapContextMenu?.dispose();

		// TF.RoutingMap.MapEditSaveHelper.complete().then(() => tfdispose(this));
		// TODO: Use the method above if MapEditPalette is added in the future.
		tfdispose(this);
	};
})();