(function()
{
	createNamespace("TF.RoutingMap").RoutingPaletteViewModel = RoutingPaletteViewModel;

	function RoutingPaletteViewModel(mapCanvasPage, isOpen, routeState, trips)
	{
		TF.RoutingMap.BasePaletteViewModel.call(this, mapCanvasPage, isOpen, routeState);
		var self = this;
		self.obShow(false);
		self.routeState = routeState;
		self.isEyeVisible(true);
		self.isShowMode(true);
		self.type = "routing";
		self.title = "Routing";
		self.isOpen = !!isOpen;
		self.templateName = "workspace/RoutingMap/RoutingMapPanel/RoutingPalette/RoutingPalette";
		self.$element = null;
		self._viewModal = mapCanvasPage;
		self.fieldTripPaletteSection = new TF.RoutingMap.RoutingPalette.FieldTripPaletteSectionViewModel(self, routeState, trips);
		self.dataModel = self.fieldTripPaletteSection.dataModel;
		self.stopPoolViewModel = new TF.RoutingMap.RoutingPalette.StopPoolViewModel(self);
		self.trialStopViewModel = new TF.RoutingMap.RoutingPalette.TrialStopViewModel(self);
		self.childViewModels =[self.fieldTripPaletteSection];
		self._viewModal.onMapLoad.subscribe(this._onMapLoad.bind(this));
		self.layers = [];

		PubSub.subscribe(TF.RoutingPalette.FieldTripMapEventEnum.Change, self.onFieldTripMapChange.bind(self));
		PubSub.subscribe(TF.RoutingPalette.FieldTripMapEventEnum.ZoomToLayers, self.onFieldTripMapZoomToLayers.bind(self));
		PubSub.subscribe(TF.RoutingPalette.FieldTripMapEventEnum.ZoomToStop, self.onFieldTripMapZoomToStop.bind(self));
		PubSub.subscribe(TF.RoutingPalette.FieldTripMapEventEnum.ShowHide, self.onFieldTripMapShowHide.bind(self));
		PubSub.subscribe(TF.RoutingPalette.FieldTripMapEventEnum.UpdateColor, self.onFieldTripMapUpdateColor.bind(self));
		PubSub.subscribe(TF.RoutingPalette.FieldTripMapEventEnum.TripPathTypeChange, self.onFieldTripMapTripPathTypeChange.bind(self));
		PubSub.subscribe(TF.RoutingPalette.FieldTripMapEventEnum.MoveStopLocation, self.onFieldTripMapMoveStopLocation.bind(self));
		PubSub.subscribe(TF.RoutingPalette.FieldTripMapEventEnum.MoveStopLocationCompleted, self.onFieldTripMapMoveStopLocationCompleted.bind(self));
		PubSub.subscribe(TF.RoutingPalette.FieldTripMapEventEnum.DeleteStopLocation, self.onFieldTripMapDeleteStopLocation.bind(self));
		PubSub.subscribe(TF.RoutingPalette.FieldTripMapEventEnum.DeleteStopLocationCompleted, self.onFieldTripMapDeleteStopLocationCompleted.bind(self));
		PubSub.subscribe(TF.RoutingPalette.FieldTripMapEventEnum.DirectionUpdated, self.onFieldTripMapDirectionUpdated.bind(self));
		PubSub.subscribe(TF.RoutingPalette.FieldTripMapEventEnum.HighlightFieldTripStop, self.onFieldTripMapHighlightFieldTripStop.bind(self));
		PubSub.subscribe(TF.RoutingPalette.FieldTripMapEventEnum.ClearHighlightFieldTripStop, self.onFieldTripMapClearHighlightFieldTripStop.bind(self));
		PubSub.subscribe("on_MapCanvas_MapExtentChange", self.onMapCanvasMapExtentChange.bind(self));
		PubSub.subscribe("on_MapCanvas_MapViewClick", self.onMapCanvasMapViewClick.bind(self));
		PubSub.subscribe("on_MapCanvas_RecalculateTripMove", self.onMapCanvas_RecalculateTripMove.bind(self));
		PubSub.subscribe("on_MapCanvas_RefreshTripByStops", self.onMapCanvas_RefreshPathByStops.bind(self));

		self.dataModel.onTripSequenceChangeEvent.subscribe(self.onTripSequenceChange.bind(this));
	}

	RoutingPaletteViewModel.prototype = Object.create(TF.RoutingMap.BasePaletteViewModel.prototype);
	RoutingPaletteViewModel.prototype.constructor = RoutingPaletteViewModel;

	RoutingPaletteViewModel.prototype.init = function(viewModal, e)
	{
		this.$element = $(e);
	};

	RoutingPaletteViewModel.prototype._onMapLoad = function()
	{
		var self = this;
		var map = self._viewModal._map;
		self.mapInstance = self._viewModal.mapInstance;
		self.map = map;
		self.initLabelSetting();
		(self.obShow() && self.showCount == 0) && self.addShowCount();
		self.childViewModels.forEach(function(childViewModel)
		{
			childViewModel._onMapLoad();
		});
	};

	RoutingPaletteViewModel.prototype.initLabelSetting = function()
	{
		var self = this;
		self.dataModel.getSetting().then(function(setting)
		{
			self.tripStopLabelSetting = new TF.RoutingMap.RoutingPalette.TripLabelSetting(self, self.routeState, 'Stop', self.map, setting.showLabel, 'routing', 'routingTripStopLayer');
		});
	};

	RoutingPaletteViewModel.prototype.show = function()
	{
		var self = this;
		if (self.showCount == 0)
		{
			// tf.gaHelper.send('Area', 'Routing');
			self.childViewModels.forEach(function(childViewModel)
			{
				childViewModel.show();
			});
			setTimeout(function()
			{
				// use timeout to make sure RoutingMapTool is ready
				if (self._viewModal.RoutingMapTool.thematicTool)
				{
					self._viewModal.RoutingMapTool.thematicTool.layerId = "candidateStudentFeatureLayer";
				}
			}, 2000);
		}
		this.addShowCount();
		return Promise.resolve(true);
	};

	RoutingPaletteViewModel.prototype.toggleShow = function(data, event)
	{
		event.stopPropagation();
		var self = this;
		var isShowMode = !self.isShowMode();
		self.isShowMode(isShowMode);
		self.childViewModels.forEach(function(childViewModel)
		{
			childViewModel.isShowMode(isShowMode);
		});
	};

	RoutingPaletteViewModel.prototype.childViewShowChange = function()
	{
		var self = this;
		var isShow = false;
		self.childViewModels.forEach(function(childViewModel)
		{
			isShow |= childViewModel.isShowMode();
		});
		self.isShowMode(!!isShow);
	};

	RoutingPaletteViewModel.prototype.getLayers = function()
	{
		var layers = [];
		this.childViewModels.forEach(function(childViewModel)
		{
			layers = layers.concat(childViewModel.getLayers());
		});
		return layers;
	};

	RoutingPaletteViewModel.prototype.onFieldTripMapChange = async function(_, data)
	{
		if (!this.fieldTripMap)
		{
			this.fieldTripMap = new TF.RoutingPalette.FieldTripMap(this.mapInstance, this.drawTool);
			await this.fieldTripMap.initLayers();
		}
		const onCompleted = data.onCompleted;
		delete data.onCompleted;
		await this.displayFieldTripPath(data);

		if (typeof onCompleted === "function")
		{
			onCompleted();
		}
	}

	RoutingPaletteViewModel.prototype.displayFieldTripPath = async function(data)
	{
		if (data && (data.delete.length > 0))
		{
			const deleteFieldTrips = data.delete;
			for (let i = 0; i < deleteFieldTrips.length; i++)
			{
				const fieldTrip = deleteFieldTrips[i];
				this.fieldTripMap.removeFieldTrip(fieldTrip);
			}
		}

		const fieldTrips = this.dataModel.trips,
			fieldTripCount = fieldTrips.length;
		if (fieldTripCount > 0)
		{
			this.fieldTripMap.initArrowLayers(fieldTrips);
		}

		if (data && (data.add.length > 0))
		{
			const addFieldTrips = data.add;

			for (let i = addFieldTrips.length - 1; i >= 0; i--)
			{
				const fieldTrip = addFieldTrips[i];
				await this.fieldTripMap.addFieldTrip(fieldTrip);
			}
		}
		
		if (fieldTripCount > 0)
		{
			this.fieldTripMap.updateArrowRenderer(fieldTrips);
			await this.fieldTripMap.updateFieldTripPathVisibility(fieldTrips);
			await this.fieldTripMap.orderFeatures(fieldTrips);
			this.fieldTripMap.zoomToFieldTripLayers(fieldTrips);
		}
	}

	RoutingPaletteViewModel.prototype.onFieldTripMapZoomToLayers = function(_, data)
	{
		this.fieldTripMap?.zoomToFieldTripLayers(data);
	}

	RoutingPaletteViewModel.prototype.onFieldTripMapZoomToStop = function(_, data)
	{
		const { tripId, sequence } = data;
		const fieldTrip = this.dataModel.trips.find(item => item.id === tripId);
		const stop = fieldTrip?.FieldTripStops.find(item => item.Sequence === sequence);
		const coordinates = { longitude: stop?.XCoord, latitude: stop?.YCoord };

		this.fieldTripMap?.zoomToFieldTripStop(coordinates);
	}

	RoutingPaletteViewModel.prototype.onFieldTripMapShowHide = function(_, data)
	{
		this.fieldTripMap?.setFieldTripVisibility(data);
	}

	RoutingPaletteViewModel.prototype.onFieldTripMapUpdateColor = function(_, data)
	{
		this.fieldTripMap?.updateSymbolColor(data);
	}

	RoutingPaletteViewModel.prototype.onFieldTripMapTripPathTypeChange = function(_, isSequenceLine)
	{
		this.fieldTripMap?.setPathLineType(isSequenceLine);
		this.fieldTripMap?.switchPathType(this.dataModel.trips);
	}

	RoutingPaletteViewModel.prototype.onMapCanvas_RecalculateTripMove = function(_, data)
	{
		const { fieldTripId, stopId } = data;
		const fieldTrips = this.dataModel.trips;
		const fieldTrip = fieldTrips.find(item => item.id === fieldTripId);
		if (!fieldTrip)
		{
			console.warn(`Cannot find field trip id=${fieldTripId}`);
			return;
		}

		const fieldTripStop = fieldTrip.FieldTripStops.find(item=>item.id === stopId);
		if (!fieldTripStop)
		{
			console.warn(`Cannot find field trip stop id=${stopId} in field trip id=${fieldTripId}`);
			return;
		}

		const effectSequences = this.fieldTripMap?._computeEffectSequences(fieldTrip, {moveStop: fieldTripStop});
		this.fieldTripMap?.refreshFieldTripPath(fieldTrip, effectSequences);
	};

	RoutingPaletteViewModel.prototype.onMapCanvas_RefreshPathByStops = function(_, data)
	{
		const { tripStops, deleteStops, isBestSequence } = data;
		if (deleteStops && deleteStops.length == 1)
		{
			console.log("todo: refresh trip path by delete one stop")
		}

		if (tripStops && tripStops.length > 0)
		{
			const fieldTripId = tripStops[0].FieldTripId;
			const fieldTrip = this.dataModel.trips.find(item => item.id === fieldTripId);
			const effectSuquences = tripStops.map(s => s.Sequence);
			this.fieldTripMap?.refreshFieldTripPath(fieldTrip, effectSuquences);
		}
	}

	RoutingPaletteViewModel.prototype.onTripSequenceChange = function(evt, items)
	{
		if (!items || items.length === 0)
		{
			return;
		}

		const fieldTripId = items[0].FieldTripId;
		const fieldTrip = this.dataModel.trips.find(item => item.id === fieldTripId);
		this.fieldTripMap?.updateStopSymbol(fieldTrip, items);
	};

	RoutingPaletteViewModel.prototype.onFieldTripMapMoveStopLocation = function(_, data)
	{
		const { fieldTripId, stopId } = data;
		const fieldTrips = this.dataModel.trips;
		const fieldTrip = fieldTrips.find(item => item.id === fieldTripId);
		if (!fieldTrip)
		{
			console.warn(`Cannot find field trip id=${fieldTripId}`);
			return;
		}

		const fieldTripStop = fieldTrip.FieldTripStops.find(item=>item.id === stopId);
		if (!fieldTripStop)
		{
			console.warn(`Cannot find field trip stop id=${stopId} in field trip id=${fieldTripId}`);
			return;
		}

		
		this.fieldTripMap?.moveStopLocation(fieldTrip, fieldTripStop, this._viewModal.sketchTool);
	};

	RoutingPaletteViewModel.prototype.onRefreshFieldTripPath = async function({fieldTripId})
	{
		const fieldTrip = this.dataModel.trips.find(item => item.id === fieldTripId);
		await this.fieldTripMap?.refreshFieldTripPath(fieldTrip);
	};

	RoutingPaletteViewModel.prototype.onFieldTripMapMoveStopLocationCompleted = function(_, data)
	{
		const trip = this.dataModel.getTripById(data.FieldTripId);
		const stop = this.dataModel.getFieldTripStopBySequence(trip, data.Sequence);

		let updateStop = {...stop};

		updateStop.Street = data.Name;
		updateStop.XCoord = data.XCoord;
		updateStop.YCoord = data.YCoord;
		
		this.dataModel.update([updateStop], true); // pass true to stop calling onTripStopsChangeEvent
	}

	RoutingPaletteViewModel.prototype.onFieldTripMapDeleteStopLocation = function(_, data)
	{
		const { fieldTripId, fieldTripStopId } = data;
		const fieldTrips = this.dataModel.trips;
		const fieldTrip = fieldTrips.find(item => item.id === fieldTripId);
		if (!fieldTrip)
		{
			console.warn(`Cannot find field trip id=${fieldTripId}`);
			return;
		}

		const fieldTripStop = fieldTrip.FieldTripStops.find(item=>item.id === fieldTripStopId);
		if (!fieldTripStop)
		{
			console.warn(`Cannot find field trip stop id=${fieldTripStopId} in field trip id=${fieldTripId}`);
			return;
		}

		this.fieldTripMap?.deleteStopLocation(fieldTrip, fieldTripStop);
	}

	RoutingPaletteViewModel.prototype.onFieldTripMapDeleteStopLocationCompleted = function(_, data)
	{
		var self = this;

		var stopId = data.fieldTripStopId;
		var tripStop = self.dataModel.getFieldTripStop(stopId);
		
		tf.loadingIndicator.show();
		
		self.dataModel.fieldTripStopDataModel.delete(tripStop).finally(() => {
			var fieldTrip = Enumerable.From(self.dataModel.trips).FirstOrDefault(function(c) { return c.id == tripStop.FieldTripId; })

			PubSub.publish("on_FieldTripPalette_DeleteStopLocationCompleted", fieldTrip);

			tf.loadingIndicator.tryHide();
		});
	}

	RoutingPaletteViewModel.prototype.onFieldTripMapDirectionUpdated = function(_, data)
	{
		const trip = this.dataModel.getTripById(data.fieldTrip.id);

		this.dataModel.update(trip.FieldTripStops, true); // pass true to stop calling onTripStopsChangeEvent
		this.fieldTripPaletteSection.display.resetTripInfo([trip]);
	}

	RoutingPaletteViewModel.prototype.onFieldTripMapHighlightFieldTripStop = function(_, data)
	{
		const { tripId, stopId, stopSequence } = data;
		const fieldTrips = this.dataModel.trips;
		const fieldTrip = fieldTrips.find(item => item.id === tripId);
		let fieldTripStops = fieldTrip.FieldTripStops;
		const currentStop = fieldTripStops.find(item => item.id === stopId);
		fieldTripStops = fieldTripStops.filter(x => x.id !== stopId);
		let beforeStop = null, afterStop = null;
		if (stopSequence > 1)
		{
			beforeStop = fieldTripStops[stopSequence - 2];
		}

		if (stopSequence <= fieldTripStops.length)
		{
			afterStop = fieldTripStops[stopSequence - 1];
		}

		const DBID = fieldTrip.DBID,
			FieldTripId = tripId,
			Color = fieldTrip.color,
			params = { DBID, FieldTripId, Color, beforeStop, currentStop, afterStop, stopSequence };

		this.fieldTripMap?.addHighlightFeatures(params);
		this.fieldTripMap?.setFieldTripHighlightLayerVisibility(fieldTrips);
	}

	RoutingPaletteViewModel.prototype.onFieldTripMapClearHighlightFieldTripStop = function(_, data)
	{
		this.fieldTripMap?.clearHighlightFeatures();
	}

	RoutingPaletteViewModel.prototype.onMapCanvasMapExtentChange = function(_, data)
	{
		const fieldTrips = this.dataModel.trips;
		this.fieldTripMap?.onMapCanvasMapExtentChangeEvent(fieldTrips);
	}

	RoutingPaletteViewModel.prototype.onMapCanvasMapViewClick = function(_, event)
	{
		this.fieldTripMap?.onMapClickEvent(event);
	}

	RoutingPaletteViewModel.prototype.close = function()
	{
		var self = this;
		self.minusShowCount();
		var promises = [];
		self.childViewModels.forEach(function(childViewModel)
		{
			promises.push(childViewModel.close());
		});
		return Promise.all(promises).then(function()
		{
			if (self._viewModal.RoutingMapTool.thematicTool)
			{
				if (!self._viewModal.RoutingMapTool.thematicTool.thematicMenu.obSelectThematicId())
				{
					self._viewModal.RoutingMapTool.thematicTool.thematicMenu.clearThematicSelection(true);
				}
				self._viewModal.RoutingMapTool.thematicTool.grid.allData = [];
				self._viewModal.RoutingMapTool.thematicTool.grid.allIds = [];
				self._viewModal.RoutingMapTool.thematicTool.grid.highLightedData = [];
			}
			self._viewModal.RoutingMapTool.$offMapTool.find(".tool-icon.thematics").removeClass("disable");
			return true;
		});
	};

	RoutingPaletteViewModel.prototype.unSaveCheck = function(openingName)
	{
		var viewModels = [this.fieldTripPaletteSection, this.stopPoolViewModel];
		return this._multiViewUnSaveCheck(openingName, viewModels);
	};

	RoutingPaletteViewModel.prototype.dispose = function()
	{
		this.childViewModels.forEach(function(childViewModel)
		{
			childViewModel.dispose();
		});

		if (this.fieldTripMap)
		{
			this.fieldTripMap.dispose();
			this.fieldTripMap = null;
		}

		PubSub.unsubscribe(TF.RoutingPalette.FieldTripMapEventEnum.Change);
		PubSub.unsubscribe(TF.RoutingPalette.FieldTripMapEventEnum.ZoomToLayers);
		PubSub.unsubscribe(TF.RoutingPalette.FieldTripMapEventEnum.ZoomToStop);
		PubSub.unsubscribe(TF.RoutingPalette.FieldTripMapEventEnum.ShowHide);
		PubSub.unsubscribe(TF.RoutingPalette.FieldTripMapEventEnum.UpdateColor);
		PubSub.unsubscribe(TF.RoutingPalette.FieldTripMapEventEnum.TripPathTypeChange);
		PubSub.unsubscribe(TF.RoutingPalette.FieldTripMapEventEnum.MoveStopLocation);
		PubSub.unsubscribe(TF.RoutingPalette.FieldTripMapEventEnum.MoveStopLocationCompleted);
		PubSub.unsubscribe(TF.RoutingPalette.FieldTripMapEventEnum.DeleteStopLocation);
		PubSub.unsubscribe(TF.RoutingPalette.FieldTripMapEventEnum.DeleteStopLocationCompleted);
		PubSub.unsubscribe(TF.RoutingPalette.FieldTripMapEventEnum.DirectionUpdated);
		PubSub.unsubscribe(TF.RoutingPalette.FieldTripMapEventEnum.HighlightFieldTripStop);
		PubSub.unsubscribe(TF.RoutingPalette.FieldTripMapEventEnum.ClearHighlightFieldTripStop);
		PubSub.unsubscribe("on_MapCanvas_MapExtentChange");
		PubSub.unsubscribe("on_MapCanvas_MapViewClick");

		tfdispose(this);
	};
})();
