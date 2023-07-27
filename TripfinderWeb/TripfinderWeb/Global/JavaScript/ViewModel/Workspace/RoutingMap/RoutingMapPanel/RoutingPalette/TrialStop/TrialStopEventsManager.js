(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").TrialStopEventsManager = TrialStopEventsManager;

	function TrialStopEventsManager(viewModel)
	{
		var self = this;
		TF.RoutingMap.RoutingPalette.BaseRoutingEventsManager.call(this, viewModel, viewModel.viewModel._viewModal);
		self.viewModel = viewModel;
		self.dataModel = viewModel.dataModel;
		self._viewModal = viewModel.viewModel._viewModal;
		//self._viewModal.onModeChangeEvent.subscribe(this.onModeChange.bind(this));
		self.dataModel.highlightChangedEvent.subscribe(this.onHighlightChanged.bind(this));
		self.obHighlighted = ko.observable(false);
		self.selectionChange = this.selectionChange.bind(this);
		self.obMode = ko.observable();
		self.obDisableCreateTripStop = ko.observable(true);
		self.obDisableCreatePoolStop = ko.observable(true);
		self.routingTripDataModel = viewModel.viewModel.fieldTripPaletteSection.dataModel;
		self.routingTripDataModel.onTripsChangeEvent.subscribe(self.onTripsChangeEvent.bind(self));

	}

	TrialStopEventsManager.prototype = Object.create(TF.RoutingMap.RoutingPalette.BaseRoutingEventsManager.prototype);
	TrialStopEventsManager.prototype.constructor = TrialStopEventsManager;

	TrialStopEventsManager.prototype.onHighlightChanged = function()
	{
		this.obHighlighted(this.dataModel.highlighted.length > 0);
		this.obDisableCreateTripStop(this.dataModel.highlighted.length == 0 || this.routingTripDataModel.trips.filter(function(trip) { return trip.OpenType == "Edit" }).length == 0);
		this.obDisableCreatePoolStop(this.dataModel.highlighted.length == 0);
	};
	TrialStopEventsManager.prototype.onTripsChangeEvent = function()
	{
		this.obDisableCreateTripStop(this.dataModel.highlighted.length == 0 || this.routingTripDataModel.trips.filter(function(trip) { return trip.OpenType == "Edit" }).length == 0);

	}

	TrialStopEventsManager.prototype.startDrawToCreate = function()
	{
		// this.viewModel.drawTool.start("point", "createPoint");
		this.viewModel.drawTool.create("point");
	};

	TrialStopEventsManager.prototype.infoClick = function(item)
	{
		PubSub.publish("clear_ContextMenu_Operation");
		var self = this;
		var trialStop = self.dataModel.findById(item.id);
		self.viewModel.editModal.showEditModal([trialStop]).then(function()
		{
			//self._viewModal.setMode("TrialStop", "Normal");
			self.viewModel.drawTool.changeSymbolToEditing(trialStop.id);
			function closeEvent()
			{
				self.viewModel.drawTool.changeSymbolToNotEditing();
				self.viewModel.editModal.onCloseEditModalEvent.unsubscribe(closeEvent);
			}
			self.viewModel.editModal.onCloseEditModalEvent.subscribe(closeEvent);
		}).catch(function() { });
	};

	TrialStopEventsManager.prototype.createPoolStop = function(trialStop)
	{
		var self = this;
		return self.viewModel.stopPoolViewModel.drawTool.copyToStopPool(trialStop);
	};

	TrialStopEventsManager.prototype.createTripStop = function(trialStop)
	{
		var self = this;
		return self.viewModel.fieldTripPaletteSection.drawTool.copyToTripStop(trialStop);
	};

	TrialStopEventsManager.prototype.editTrialStopClick = function(trialStop)
	{
		var self = this;
		return self.viewModel.drawTool.movePoint(trialStop.id);
	};

	TrialStopEventsManager.prototype.createTrialStopClick = function(model, e)
	{
		this.viewModel.drawTool.create("point");
	};

	TrialStopEventsManager.prototype.createTrialStopFromSelectionClick = function(model, e)
	{
		var self = this;
		self._viewModal.setMode("TrialStop", "CreateFromSelection");
	};

	TrialStopEventsManager.prototype.settingsClick = function()
	{
		tf.modalManager.showModal(new TF.RoutingMap.RoutingPalette.TrialStopSettingsModalViewModel(this.dataModel));
	};

	TrialStopEventsManager.prototype.selectAreaOptionClick = function(type, data, e)
	{
		//this.viewModel.viewModel._viewModal.setMode("TrialStop", "SelectMapArea-" + type);
		this.viewModel.drawTool.select(type);
		PubSub.publish("clear_ContextMenu_Operation");
	};

	TrialStopEventsManager.prototype.selectJunctionAreaOptionClick = function(type, data, e)
	{
		var self = this;
		this.viewModel.drawTool.sketchTool.select(type, null, function(graphics)
		{
			if (graphics && graphics.length > 0)
			{
				self.viewModel.drawTool.selectAndCreateJunctionOnMap(graphics[0]);
				self._viewModal.setMode("", "Normal");
			}
		});
		PubSub.publish("clear_ContextMenu_Operation");
	};

	TrialStopEventsManager.prototype.selectStudentJunctionAreaOptionClick = function(type, data, e)
	{
		var self = this;
		self.viewModel.drawTool.sketchTool.select(type, [self.viewModel.drawTool._map.findLayerById("candidateStudentFeatureLayer")], function(graphics)
		{
			self.viewModel.drawTool.selectStudentAndCreateJunctionOnMap(graphics);
		});
		PubSub.publish("clear_ContextMenu_Operation");
	};

	TrialStopEventsManager.prototype.selectionChange = function(e, selectedIds)
	{
		this.dataModel.setSelected(selectedIds);
		this.dataModel.setHighlighted(selectedIds);
	};

	TrialStopEventsManager.prototype.centerMapClick = function(modal, e)
	{
		e.stopPropagation();
		var items = [];
		var map = this.viewModel.viewModel._viewModal._map;
		if (modal && modal.geometry)
		{
			items = [modal];
		} else
		{
			items = this.dataModel.highlighted;
			if (items.length == 0)
			{
				items = this.dataModel.all;
			}
		}

		items = items.map(function(item)
		{
			if (item.boundary)
			{
				return item.boundary;
			}
			return item;
		});

		if (items.length == 1)
		{
			TF.RoutingMap.EsriTool.centerSingleItem(map, items[0]);
		} else if (items.length > 1)
		{
			TF.RoutingMap.EsriTool.centerMultipleItem(map, items);
		}
	};

	TrialStopEventsManager.prototype.selectAllClick = function()
	{
		this.dataModel.setHighlighted(this.dataModel.all);
	};

	TrialStopEventsManager.prototype.deselectAllClick = function()
	{
		this.dataModel.setHighlighted([]);
	};

	TrialStopEventsManager.prototype.menuInfoClick = function()
	{
		this.viewModel.editModal.showEditModal();
	};

	TrialStopEventsManager.prototype.deleteClick = function(modal, e)
	{
		e.stopPropagation();
		var self = this;
		var highlightedData = this.dataModel.highlighted;
		if (modal && modal.id)
		{
			highlightedData = [self.dataModel.findById(modal.id)];
		}
		if (highlightedData.length == 0)
		{
			return;
		}
		tf.promiseBootbox.yesNo(
			{
				message: "Are you sure you want to delete " + (highlightedData.length === 1 ? "this Trial Stop" : "these Trial Stops") + "? ",
				closeButton: true
			}, "Confirmation").then(function(result)
			{
				if (!result)
				{
					return;
				}
				self.dataModel.delete(highlightedData);
				PubSub.publish("clear_ContextMenu_Operation");
			});
	};

	TrialStopEventsManager.prototype.createFromSelectionClick = function()
	{
		var copyObject = this.copyFromObject();
		this.viewModel.editModal.create(copyObject, this.viewModel.drawTool.stopTool.generateWalkoutZone);
	};

	TrialStopEventsManager.prototype.createTripStopFromSelectionClick = function()
	{
		var self = this;
		var drawTool = this.viewModel.viewModel.fieldTripPaletteSection.drawTool;
		var currentStops = drawTool._pointLayer.graphics.items.map(function(graphic) { return graphic.attributes.dataModel; });
		drawTool.copyToTripStops(this.dataModel.highlighted).then(function(tripStops)
		{
			var stops = [];
			tripStops.forEach(function(stop)
			{
				stops.push(self.copyTripStop(stop));
			});

			if (drawTool._allowOverlap) return self.createFromMultiple(stops);
			var nonOverlapedStops = [];
			var notContainTrips = new Set();
			stops.forEach(function(stop)
			{
				var trips = drawTool.getNotContainTrips(stop);
				if (trips.length > 0)
				{
					trips.forEach(t => { notContainTrips.add(t); });
					nonOverlapedStops.push(stop);
				}
			});

			if (nonOverlapedStops.length == 0)
			{
				return tf.promiseBootbox.alert("Remove Overlapping Boundaries is set as true! Since " + (stops.length == 1 ? "stop is" : "stops are") + " falling in current trip stop boundaries, no trip stops will be created", "Warning");
			}
			if (nonOverlapedStops.length < stops.length)
			{
				tf.promiseBootbox.alert("Remove Overlapping Boundaries is set as true! Some " + (stops.length - nonOverlapedStops.length == 1 ? "stop is" : "stops are") + " falling in current trip stop boundaries", "Warning").then(function()
				{
					createTripStops(nonOverlapedStops, currentStops);
				});
			}
			else if (nonOverlapedStops.length == stops.length)
			{
				createTripStops(stops, currentStops);
			}
			function createTripStops(stops)
			{
				self.createFromMultiple(stops, { Trips: Array.from(notContainTrips) });
			}

		});
	};

	TrialStopEventsManager.prototype.createFromMultiple = function(pointArray, options = {})
	{
		var self = this,
			points = [],
			promises = [];
		self.viewModel.drawTool._mode = "createPoint";

		pointArray.forEach(function(point)
		{
			var geometry = point.geometry || TF.xyToGeometry(point.x, point.y);
			geometry = new tf.map.ArcGIS.Point(geometry.x, geometry.y, self._viewModal._map.mapView.spatialReference);
			promises.push(self.offsetInsetPoint(point, geometry, point.type).then(function(geometry)
			{
				if (geometry)
				{
					if (point.type == "student")
					{
						var stopGeometry = self.viewModel.drawTool.stopTool.getDoorToDoorLocationForStudent({ geometry: point.geometry, address: point.address });
						points.push($.extend(point, { geometry: stopGeometry, unassignStudent: point.geometry }));
					} else
					{
						points.push($.extend(point, { geometry: geometry, boundary: point.boundary }));
					}

				}
			}));
		});

		return Promise.all(promises).then(function()
		{

			self.viewModel.fieldTripPaletteSection.drawTool.drawTempTripStopsOnMap(points.map(function(c) { return c.geometry; }));
			self.viewModel.fieldTripPaletteSection.drawTool.stopTool.addMultipleStopAddressAndBoundary(points, {
				isCreateFromUnassignStudent: false,
				isCreateFromSelection: false,
				isCreateFromStopSearch: true,
				isCreateFromSearch: true,
				isCreateFromTrialStop: true,
				insertBehindSpecialStop: null,
				isCopied: true,
				Trips: options.Trips
			});
		});
	};

	TrialStopEventsManager.prototype.createPoolStopFromSelectionClick = function()
	{
		var self = this, stops = [], drawTool = self.viewModel.viewModel.stopPoolViewModel.drawTool;
		var currentStops = drawTool._pointLayer.graphics.items.map(function(graphic) { return graphic.attributes.dataModel; });
		this.dataModel.highlighted.forEach(function(stop)
		{
			stops.push(self.copyStopPool(stop));
		});

		if (drawTool._allowOverlap) return drawTool.copyToStopPools(stops);
		var nonOverlapedStops = [];
		stops.forEach(function(stop)
		{
			if (!drawTool._isContainedByCurrentPolygons(stop))
			{
				nonOverlapedStops.push(stop);
			}
		});
		if (nonOverlapedStops.length == 0)
		{
			return tf.promiseBootbox.alert("Remove Overlapping Boundaries is set as true! Since " + (stops.length == 1 ? "stop is" : "stops are") + " falling in current stop boundaries, no stops will be created", "Warning");
		}
		if (nonOverlapedStops.length < stops.length)
		{
			tf.promiseBootbox.alert("Remove Overlapping Boundaries is set as true! Some " + (stops.length - nonOverlapedStops.length == 1 ? "stop is" : "stops are") + " falling in current stop boundaries", "Warning").then(function()
			{
				createTripStops(nonOverlapedStops, currentStops);
			})
		}
		else if (nonOverlapedStops.length == stops.length)
		{
			createTripStops(stops, currentStops);
		}
		function createTripStops(stops, currentStops)
		{
			tf.loadingIndicator.showImmediately();
			drawTool.stopTool.removeOverlapBoundariesByThiessen(stops, currentStops).then(function(results)
			{
				tf.loadingIndicator.tryHide();
				drawTool.copyToStopPools(results);
			});
		}
	};

	TrialStopEventsManager.prototype.copyTripStop = function(stop)
	{
		var self = this;
		var s = self.dataModel.getTrialStopDataModel();
		for (var key in s)
		{
			s[key] = stop[key];
		}
		s.address = stop.address;
		s.boundary = { geometry: TF.cloneGeometry(stop.boundary.geometry) };
		s.geometry = TF.cloneGeometry(stop.geometry);
		s.walkoutGuide = stop.walkoutGuide ? { geometry: TF.cloneGeometry(stop.walkoutGuide.geometry) } : stop.walkoutGuide;
		return s;
	};

	TrialStopEventsManager.prototype.copyStopPool = function(stop)
	{
		var s = TF.RoutingMap.RoutingPalette.StopPoolFeatureData.StopPoolData.getDataModel();
		for (var key in s)
		{
			s[key] = stop[key];
		}
		s.address = stop.address;
		s.boundary = { geometry: TF.cloneGeometry(stop.boundary.geometry) };
		s.geometry = TF.cloneGeometry(stop.geometry);
		return s;
	};
})();