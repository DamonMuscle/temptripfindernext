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
		self.fieldTripPaletteSectionVM = new TF.RoutingMap.RoutingPalette.FieldTripPaletteSectionViewModel(self, routeState, trips);
		self.dataModel = self.fieldTripPaletteSectionVM.dataModel;
		self.childViewModels =[self.fieldTripPaletteSectionVM];
		self.mapCanvasPage.onMapLoad.subscribe(this._onMapLoad.bind(this));
		self.layers = [];

		PubSub.subscribe(TF.RoutingPalette.FieldTripMapEventEnum.AddStopFromMap, self.onFieldTripMapAddStopFromMap.bind(self));
		PubSub.subscribe(TF.RoutingPalette.FieldTripMapEventEnum.Change, self.onFieldTripMapChange.bind(self));
		PubSub.subscribe(TF.RoutingPalette.FieldTripMapEventEnum.ZoomToLayers, self.onFieldTripMapZoomToLayers.bind(self));
		PubSub.subscribe(TF.RoutingPalette.FieldTripMapEventEnum.ZoomToStop, self.onFieldTripMapZoomToStop.bind(self));
		PubSub.subscribe(TF.RoutingPalette.FieldTripMapEventEnum.ShowHide, self.onFieldTripMapShowHide.bind(self));
		PubSub.subscribe(TF.RoutingPalette.FieldTripMapEventEnum.UpdateColor, self.onFieldTripMapUpdateColor.bind(self));
		PubSub.subscribe(TF.RoutingPalette.FieldTripMapEventEnum.TripPathTypeChange, self.onFieldTripMapTripPathTypeChange.bind(self));
		PubSub.subscribe(TF.RoutingPalette.FieldTripMapEventEnum.MoveStopLocation, self.onFieldTripMapMoveStopLocation.bind(self));
		PubSub.subscribe(TF.RoutingPalette.FieldTripMapEventEnum.DeleteStopLocation, self.onFieldTripMapDeleteStopLocation.bind(self));
		PubSub.subscribe(TF.RoutingPalette.FieldTripMapEventEnum.HighlightFieldTripStop, self.onFieldTripMapHighlightFieldTripStop.bind(self));
		PubSub.subscribe(TF.RoutingPalette.FieldTripMapEventEnum.ClearHighlightFieldTripStop, self.onFieldTripMapClearHighlightFieldTripStop.bind(self));

		mapCanvasPage.onMapViewCustomizedEvent.subscribe(self.onMapCanvasMapViewCustomizedEventHandler.bind(self));
		PubSub.subscribe("on_MapCanvas_RecalculateTripMove", self.onMapCanvas_RecalculateTripMove.bind(self));
		PubSub.subscribe("on_MapCanvas_RefreshTripByStops", self.onMapCanvas_RefreshPathByStops.bind(self));

		self.dataModel.onTripSequenceChangeEvent.subscribe(self.onTripSequenceChange.bind(this));
		self.dataModel.fieldTripStopDataModel.onFieldTripStopUpdatedEvent.subscribe(self.onFieldTripStopUpdatedEvent.bind(this));
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
		var map = self.mapCanvasPage._map;
		self.mapInstance = self.mapCanvasPage.mapInstance;
		self.map = map;
		self.initLabelSetting();
		(self.obShow() && self.showCount == 0) && self.addShowCount();
		self.childViewModels.forEach(function(childViewModel)
		{
			childViewModel._onMapLoad();
		});

		self.mapInstance.events.onMapViewClickEvent.subscribe(self.onMapViewClickEventHandler.bind(self));
		self.mapInstance.events.onMapViewMouseWheelEvent.subscribe(self.onMapViewMouseWheelHandler.bind(self));
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
				if (self.mapCanvasPage.RoutingMapTool.thematicTool)
				{
					self.mapCanvasPage.RoutingMapTool.thematicTool.layerId = "candidateStudentFeatureLayer";
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

	RoutingPaletteViewModel.prototype.onFieldTripMapAddStopFromMap = function(_)
	{
		this.fieldTripMapOperation?.startAddFieldTripStop();
	}

	RoutingPaletteViewModel.prototype.onFieldTripMapChange = async function(_, data)
	{
		if (!this.fieldTripMapOperation)
		{
			this.fieldTripMapOperation = new TF.RoutingPalette.FieldTripMapOperation(this.mapInstance);
			await this.fieldTripMapOperation.initLayers();
		}

		await this.displayFieldTripPath(data);

		this.checkIfCompletedHandlerExists(data);
	}

	RoutingPaletteViewModel.prototype.displayFieldTripPath = async function(data)
	{
		if (data && (data.delete.length > 0))
		{
			const deleteFieldTrips = data.delete;
			for (let i = 0; i < deleteFieldTrips.length; i++)
			{
				const fieldTrip = deleteFieldTrips[i];
				this.fieldTripMapOperation.removeFieldTrip(fieldTrip);
			}
		}

		const fieldTrips = this.dataModel.fieldTrips,
			fieldTripCount = fieldTrips.length;
		if (fieldTripCount > 0)
		{
			this.fieldTripMapOperation.fieldTripsData = fieldTrips;
			this.fieldTripMapOperation.initArrowLayers();
		}

		if (data && (data.add.length > 0))
		{
			const addFieldTrips = data.add;

			for (let i = addFieldTrips.length - 1; i >= 0; i--)
			{
				const fieldTrip = addFieldTrips[i];
				await this.fieldTripMapOperation.addFieldTrip(fieldTrip);
			}
		}
		
		if (fieldTripCount > 0)
		{
			const self = this;
			(async () => {
				self.fieldTripMapOperation.updateArrowRenderer();
				await self.fieldTripMapOperation.setFieldTripStopVisibility(fieldTrips);
				await self.fieldTripMapOperation.updateFieldTripPathVisibility(fieldTrips);
				await self.fieldTripMapOperation.orderFeatures();
				self.fieldTripMapOperation.zoomToFieldTripLayers(fieldTrips);	
			})();
		}
	}

	RoutingPaletteViewModel.prototype.onFieldTripMapZoomToLayers = function(_, data)
	{
		this.fieldTripMapOperation?.zoomToFieldTripLayers(data);
	}

	RoutingPaletteViewModel.prototype.onFieldTripMapZoomToStop = function(_, data)
	{
		const { tripId, sequence } = data;
		const fieldTrip = this.dataModel.getFieldTripById(tripId);
		const stop = fieldTrip?.FieldTripStops.find(item => item.Sequence === sequence);
		const coordinates = { longitude: stop?.XCoord, latitude: stop?.YCoord };

		this.fieldTripMapOperation?.zoomToFieldTripStop(coordinates);
	}

	RoutingPaletteViewModel.prototype.onFieldTripMapShowHide = function(_, data)
	{
		// make sure the arrows is correct after map extent changes when layer is hide.
		this.fieldTripMapOperation?.updateArrowRenderer();
		this.fieldTripMapOperation?.setFieldTripVisibility(data);
	}

	RoutingPaletteViewModel.prototype.onFieldTripMapUpdateColor = function(_, data)
	{
		this.fieldTripMapOperation?.updateSymbolColor(data);
	}

	RoutingPaletteViewModel.prototype.onFieldTripMapTripPathTypeChange = function(_, isSequenceLine)
	{
		const type = isSequenceLine ? TF.RoutingPalette.FieldTripEnum.PATH_TYPE.SEQUENCE_LINE : TF.RoutingPalette.FieldTripEnum.PATH_TYPE.PATH_LINE;
		if (type === this.fieldTripMapOperation?.pathLineType)
		{
			return;
		}

		this.fieldTripMapOperation?.setPathLineType(type);
		this.fieldTripMapOperation?.switchPathType(this.dataModel.fieldTrips);
	}

	RoutingPaletteViewModel.prototype.onMapCanvas_RecalculateTripMove = function(_, data)
	{
		const { fieldTripId, stopId } = data;
		const fieldTrip = this.dataModel.getFieldTripById(fieldTripId);
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

		const effectSequences = this.fieldTripMapOperation?._computeEffectSequences(fieldTrip, {moveStop: fieldTripStop});
		this.fieldTripMapOperation?.refreshFieldTripPath(fieldTrip, effectSequences);
	};

	RoutingPaletteViewModel.prototype.onMapCanvas_RefreshPathByStops = async function(_, data)
	{
		const { tripStops, callZoomToLayers, onCompleted} = data;
		if (tripStops && tripStops.length > 0)
		{
			const fieldTripId = tripStops[0].FieldTripId;
			const fieldTrip = this.dataModel.getFieldTripById(fieldTripId);
			const effectSequences = tripStops.map(s => s.Sequence);
			await this.fieldTripMapOperation?.refreshFieldTripPath(fieldTrip, effectSequences, callZoomToLayers);
		}

		this.checkIfCompletedHandlerExists(data);
	}

	RoutingPaletteViewModel.prototype.onTripSequenceChange = function(evt, items)
	{
		if (!items || items.length === 0)
		{
			return;
		}

		const fieldTripId = items[0].FieldTripId;
		const fieldTrip = this.dataModel.getFieldTripById(fieldTripId);
		this.fieldTripMapOperation?.updateStopSymbol(fieldTrip, items);
	};

	RoutingPaletteViewModel.prototype.onFieldTripStopUpdatedEvent = function(_, data)
	{
		this.fieldTripMapOperation?.updateStopInfo(data);
	}

	RoutingPaletteViewModel.prototype.onFieldTripMapMoveStopLocation = function(_, data)
	{
		const { fieldTripId, stopId } = data;
		const fieldTrip = this.dataModel.getFieldTripById(fieldTripId);
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

		this.fieldTripMapOperation?.moveStopLocation(fieldTrip, fieldTripStop, this.mapCanvasPage.sketchTool);
	};

	RoutingPaletteViewModel.prototype.onRefreshFieldTripPath = async function({fieldTripId})
	{
		const fieldTrip = this.dataModel.getFieldTripById(fieldTripId);
		await this.fieldTripMapOperation?.refreshFieldTripPath(fieldTrip);
	};

	RoutingPaletteViewModel.prototype.onFieldTripMapMoveStopLocationCompleted = function(data)
	{
		const trip = this.dataModel.getFieldTripById(data.FieldTripId);
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
		const fieldTrip = this.dataModel.getFieldTripById(fieldTripId);
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

		this.fieldTripMapOperation?.deleteStopLocation(fieldTrip, fieldTripStop);
	}

	RoutingPaletteViewModel.prototype.onFieldTripMapDeleteStopLocationCompleted = function(data)
	{
		var self = this;

		var stopId = data.fieldTripStopId;
		var tripStop = self.dataModel.getFieldTripStop(stopId);
		
		tf.loadingIndicator.show();
		
		self.dataModel.fieldTripStopDataModel.delete(tripStop).finally(() => {
			const fieldTrip = this.dataModel.getFieldTripById(tripStop.FieldTripId);

			PubSub.publish("on_FieldTripPalette_DeleteStopLocationCompleted", fieldTrip);

			tf.loadingIndicator.tryHide();
		});
	}

	RoutingPaletteViewModel.prototype.onFieldTripMapDirectionUpdated = function(data)
	{
		const trip = this.dataModel.getFieldTripById(data.fieldTrip.id);

		if(data.fieldTrip.OpenType == 'Edit')
		{
			this.dataModel.update(trip.FieldTripStops, true); // pass true to stop calling onTripStopsChangeEvent
		}

		this.fieldTripPaletteSectionVM.display.resetTripInfo([trip]).then(()=>
		{
			this.checkIfCompletedHandlerExists(data);
		});
	}

	RoutingPaletteViewModel.prototype.checkIfCompletedHandlerExists = function(data)
	{
		if (typeof data.onCompleted === "function")
		{
			const onCompleted = data.onCompleted;
			delete data.onCompleted;
			onCompleted();
		}
	}

	RoutingPaletteViewModel.prototype.onFieldTripMapHighlightFieldTripStop = function(_, data)
	{
		const { FromTripId, ToTripId, StopId, AssignSequence } = data;
		const fromFieldTrip =  this.dataModel.getFieldTripById(FromTripId);
		if (fromFieldTrip === undefined)
		{
			console.warn(`!!Cannot find from field trip id = ${FromTripId}`);
		}

		const toFieldTrip = this.dataModel.getFieldTripById(ToTripId);
		if (toFieldTrip === undefined)
		{
			console.warn(`!!Cannot find to field trip id = ${ToTripId}`);
		}

		const toFieldTripStops = toFieldTrip.FieldTripStops;
		const lastStopIndex = toFieldTripStops.length - 1;
		const INVALID_STOP_INDEX = -1;

		// HighlightParametersClass
		let params, currentStop, previousIndex, nextIndex;
		if (StopId === 0)
		{
			// add new stop
			currentStop = null;
			previousIndex = AssignSequence - 2;
			nextIndex = AssignSequence - 1;
		}
		else
		{
			currentStop = fromFieldTrip.FieldTripStops.find(item => item.id === StopId);
			if (FromTripId === ToTripId)
			{
				if (AssignSequence === currentStop.Sequence)
				{
					previousIndex = AssignSequence - 2;
					nextIndex = AssignSequence;
				}
				else if (AssignSequence < currentStop.Sequence)
				{
					previousIndex = AssignSequence - 2;
					nextIndex = AssignSequence - 1;
				}
				else
				{
					previousIndex = AssignSequence - 1;
					nextIndex = AssignSequence;
				}
			}
			else
			{
				previousIndex = AssignSequence - 2;
				nextIndex = AssignSequence - 1;
			}
		}

		if (previousIndex < 0)
		{
			previousIndex = INVALID_STOP_INDEX;
		}

		if (nextIndex > lastStopIndex)
		{
			nextIndex = INVALID_STOP_INDEX;
		}

		const previousStop = previousIndex === INVALID_STOP_INDEX ? null : toFieldTripStops[previousIndex];
		const nextStop = nextIndex === INVALID_STOP_INDEX ? null : toFieldTripStops[nextIndex];
		params = { fromFieldTrip, toFieldTrip, previousStop, currentStop, nextStop, AssignSequence };

		this.fieldTripMapOperation?.addHighlightFeatures(params);
	}

	RoutingPaletteViewModel.prototype.onFieldTripMapClearHighlightFieldTripStop = function(_, data)
	{
		this.fieldTripMapOperation?.clearHighlightFeatures();
	}

	RoutingPaletteViewModel.prototype.onMapViewClickEventHandler = function(_, data)
	{
		if (this.fieldTripPaletteSectionVM.editFieldTripStopModal.obVisible())
		{
			// on Creating/Editing New Stop, skip map click event.
			return;
		}

		this.fieldTripMapOperation?.onMapClickEvent(data);
	}

	RoutingPaletteViewModel.prototype.onMapViewMouseWheelHandler = function(_, data)
	{
		TF.RoutingMap.ContextMenuBase.prototype.removeContextMenu();
	}

	RoutingPaletteViewModel.prototype.onMapCanvasMapViewCustomizedEventHandler = function(_, customData)
	{
		const  self = this, { eventType, data } = customData;
		switch (eventType)
		{
			case TF.RoutingPalette.FieldTripMapEventEnum.MoveStopLocationCompleted:
				self.onFieldTripMapMoveStopLocationCompleted(data);
				break;
			case TF.RoutingPalette.FieldTripMapEventEnum.DeleteStopLocationCompleted:
				self.onFieldTripMapDeleteStopLocationCompleted(data);
				break;
			case TF.RoutingPalette.FieldTripMapEventEnum.AddStopFromMapCompleted:
				self.onAddStopFromMapCompleted(data);
				break;
			case TF.RoutingPalette.FieldTripMapEventEnum.FieldTripStopClick:
				self.mapCanvasPage.routingMapContextMenu.onFieldTripMapClick_FieldTripStop(data);
				break;
			case TF.RoutingPalette.FieldTripMapEventEnum.DirectionUpdated:
				self.onFieldTripMapDirectionUpdated(data);
				break;
			case TF.RoutingPalette.FieldTripMapEventEnum.ExitAddingStop:
				self.mapCanvasPage.setMode("", "Normal");
				break;
		}
	};

	RoutingPaletteViewModel.prototype.onAddStopFromMapCompleted = function (stop)
	{
		var defaultOptions = {
			student: null,
			isCreateFromStopSearch: false,
			isCreateFromSearch: false,
			boundary: null,
			insertBehindSpecialStop: null,
			streetName: "",
			isCopied: false,
			selectLastSelectedTrip: true,
			tryUseLastSettings: false
		};

		this.fieldTripPaletteSectionVM.editFieldTripStopModal.create({
			Street: stop.Name,
			...stop
		}, defaultOptions);
	}

	RoutingPaletteViewModel.prototype.onQuickAddStops = function(stops)
	{
		if (stops.length === 1)
		{
			const newStop = this.fieldTripMapOperation?.createNewStop(stops[0]);
			this.fieldTripMapOperation?.addHighlightStops(newStop);
		}
		else
		{
			this.fieldTripMapOperation?.highlightQuickAddStops(stops);
		}
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
			if (self.mapCanvasPage.RoutingMapTool.thematicTool)
			{
				if (!self.mapCanvasPage.RoutingMapTool.thematicTool.thematicMenu.obSelectThematicId())
				{
					self.mapCanvasPage.RoutingMapTool.thematicTool.thematicMenu.clearThematicSelection(true);
				}
				self.mapCanvasPage.RoutingMapTool.thematicTool.grid.allData = [];
				self.mapCanvasPage.RoutingMapTool.thematicTool.grid.allIds = [];
				self.mapCanvasPage.RoutingMapTool.thematicTool.grid.highLightedData = [];
			}
			self.mapCanvasPage.RoutingMapTool.$offMapTool.find(".tool-icon.thematics").removeClass("disable");
			return true;
		});
	};

	RoutingPaletteViewModel.prototype.unSaveCheck = function(openingName)
	{
		var viewModels = [this.fieldTripPaletteSectionVM];
		return this._multiViewUnSaveCheck(openingName, viewModels);
	};

	RoutingPaletteViewModel.prototype.dispose = function()
	{
		this.childViewModels.forEach(function(childViewModel)
		{
			childViewModel.dispose();
		});

		if (this.fieldTripMapOperation)
		{
			this.fieldTripMapOperation.dispose();
			this.fieldTripMapOperation = null;
		}

		PubSub.unsubscribe(TF.RoutingPalette.FieldTripMapEventEnum.AddStopFromMap);
		PubSub.unsubscribe(TF.RoutingPalette.FieldTripMapEventEnum.Change);
		PubSub.unsubscribe(TF.RoutingPalette.FieldTripMapEventEnum.ZoomToLayers);
		PubSub.unsubscribe(TF.RoutingPalette.FieldTripMapEventEnum.ZoomToStop);
		PubSub.unsubscribe(TF.RoutingPalette.FieldTripMapEventEnum.ShowHide);
		PubSub.unsubscribe(TF.RoutingPalette.FieldTripMapEventEnum.UpdateColor);
		PubSub.unsubscribe(TF.RoutingPalette.FieldTripMapEventEnum.TripPathTypeChange);
		PubSub.unsubscribe(TF.RoutingPalette.FieldTripMapEventEnum.MoveStopLocation);
		PubSub.unsubscribe(TF.RoutingPalette.FieldTripMapEventEnum.DeleteStopLocation);
		PubSub.unsubscribe(TF.RoutingPalette.FieldTripMapEventEnum.HighlightFieldTripStop);
		PubSub.unsubscribe(TF.RoutingPalette.FieldTripMapEventEnum.ClearHighlightFieldTripStop);
		PubSub.unsubscribe("on_MapCanvas_RecalculateTripMove");
		PubSub.unsubscribe("on_MapCanvas_RefreshTripByStops");

		tfdispose(this);
	};
})();
