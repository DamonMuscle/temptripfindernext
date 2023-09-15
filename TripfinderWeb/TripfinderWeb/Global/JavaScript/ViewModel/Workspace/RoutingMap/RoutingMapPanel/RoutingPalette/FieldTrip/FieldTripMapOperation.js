
(function()
{
	createNamespace("TF.RoutingPalette").FieldTripMapOperation = FieldTripMapOperation;

	function FieldTripMapOperation(mapInstance)
	{
		if (!mapInstance)
		{
			console.error("FieldTripMapOperation constructor failed! No valid mapInstance.");
			return;
		}

		this.mapInstance = mapInstance;
		_fieldTripMap = new TF.RoutingPalette.FieldTripMap(mapInstance);

		this._fieldTripsData = null;
		this._editing = {
			isAddingStop: false,
			features: {
				addingStop: null
			}
		};
		this.defineReadOnlyProperty("PATH_LINE_TYPE", PATH_LINE_TYPE);
		mapInstance.events.onMapViewKeyUpEvent.subscribe(this.onMapKeyUpEvent.bind(this));
	}

	//#region Property

	FieldTripMapOperation.prototype.defineReadOnlyProperty = function(propertyName, value)
	{
		Object.defineProperty(this, propertyName, {
			get() { return value; },
			enumerable: false,
			configurable: false
		});
	};

	FieldTripMapOperation.prototype.isPathLineTypeChanged = function(type)
	{
		return type !== _fieldTripMap.PathLineType;
	}

	FieldTripMapOperation.prototype.setPathLineType = function(type)
	{
		_fieldTripMap.PathLineType = type;
	}

	Object.defineProperty(FieldTripMapOperation.prototype, 'fieldTripsData', {
		get() { return this._fieldTripsData; },
		set(value)
		{
			this._fieldTripsData = value;
		},
		enumerable: false,
		configurable: false
	});

	Object.defineProperty(FieldTripMapOperation.prototype, 'editing', {
		get() { return this._editing; },
		enumerable: false,
		configurable: false
	});

	//#endregion

	//#region Private Property

	let _fieldTripMap = null;

	//#endregion

	//#region Initialization

	FieldTripMapOperation.prototype.initLayers = async function()
	{
		await _fieldTripMap.initLayers();
	}

	FieldTripMapOperation.prototype.initArrowLayers = function()
	{
		const self = this;
		const sortedFieldTrips = _getSortedFieldTrips(self.fieldTripsData);
		_fieldTripMap.initArrowLayers(sortedFieldTrips);
	}

	//#endregion

	//#region Interaction

	//#region - Edit / View Field Trips

	FieldTripMapOperation.prototype.addFieldTrip = async function(fieldTrip)
	{
		if (!this.mapInstance)
		{
			return;
		}

		_sortBySequence(fieldTrip.FieldTripStops);
		const { DBID, FieldTripId } = _extractFieldTripFeatureFields(fieldTrip);

		const fieldTripRoute = _fieldTripMap.initRoute(fieldTrip);
		await _fieldTripMap.addRoute(DBID, FieldTripId, fieldTripRoute);

		if (!fieldTripRoute.IsEmpty)
		{
			const data = { fieldTrip };
			await this.mapInstance.fireCustomizedEvent({ eventType: TF.RoutingPalette.FieldTripMapEventEnum.DirectionUpdated, data });
		}
	}

	FieldTripMapOperation.prototype.orderFeatures = async function()
	{
		const self = this,
			fieldTrips = self.fieldTripsData,
			sortedFieldTrips = _sortFieldTripByName(fieldTrips);

		await _fieldTripMap.reorderFeatures(sortedFieldTrips);
	}

	FieldTripMapOperation.prototype._compareFieldTripNames = function(a, b)
	{
		// get the field trip data from palette.
		// sort the result as same as palette.
		const paletteFieldTripsData = tf.pageManager.obPages()[0].data.routingPaletteViewModel.fieldTripPaletteSectionVM.display.treeview.dataSource.data();
		const paletteNameData = paletteFieldTripsData.map(item => item.text);
		const aIndex = paletteNameData.findIndex(item => item === a.Name);
		const bIndex = paletteNameData.findIndex(item => item === b.Name);

		if (aIndex !== bIndex)
		{
			return aIndex - bIndex;
		}

		return a.id - b.id;
	}

	FieldTripMapOperation.prototype._sortFieldTripByName = function(fieldTrips)
	{
		const self = this;
		const fieldTripIdMapping = fieldTrips.map(item =>
		{
			const { DBID, FieldTripId } = self._extractFieldTripFeatureFields(item);
			const data = {
				DBID: DBID,
				Name: item.Name,
				id: FieldTripId
			};
			return data;
		});

		const sortedFieldTrips = fieldTripIdMapping.sort(self._compareFieldTripNames).map(item => {
			const { DBID, id } = item;
			return { DBID, id };
		});

		return sortedFieldTrips;
	}

	//#endregion

	//#region - Show / Hide Layers

	FieldTripMapOperation.prototype.setFieldTripVisibility = async function(fieldTrips)
	{
		this.setFieldTripStopVisibility(fieldTrips);
		_fieldTripMap.updateFieldTripPathVisibility(this.fieldTripsData, fieldTrips);
	}

	FieldTripMapOperation.prototype.setFieldTripStopVisibility = function(fieldTrips)
	{
		_fieldTripMap.setFieldTripStopVisibility(fieldTrips);
	}

	//#endregion

	//#region - Zoom Map to Layers, Center Map

	FieldTripMapOperation.prototype.zoomToFieldTripLayers = function(fieldTrips)
	{
		_fieldTripMap.zoomToLayers(fieldTrips);
	}

	FieldTripMapOperation.prototype.zoomToFieldTripStop = function(fieldTripId, stopSequence)
	{
		_fieldTripMap.zoomToRouteStop(fieldTripId, stopSequence);
	}

	//#endregion

	//#region - Close Layer, Close Map

	FieldTripMapOperation.prototype.removeFieldTrip = async function(fieldTrip)
	{
		const { DBID, FieldTripId } = _extractFieldTripFeatureFields(fieldTrip);
		_fieldTripMap.removeRoute(DBID, FieldTripId);
	}

	//#endregion

	//#region - Update Layer Color

	FieldTripMapOperation.prototype.updateSymbolColor = async function(fieldTrip)
	{
		await _fieldTripMap.updateRouteColor(fieldTrip, this.fieldTripsData);
	}

	//#endregion

	//#region - Switch Field Trip Path Type (Sequence Lines / Path Lines)

	FieldTripMapOperation.prototype.switchPathType = async function(fieldTrips)
	{
		const sortedFieldTrips = _getSortedFieldTrips(this.fieldTripsData);
		await _fieldTripMap.onPathTypeChanged(sortedFieldTrips, fieldTrips);
	}

	FieldTripMapOperation.prototype.updateFieldTripPathVisibility = async function(fieldTrips)
	{
		await _fieldTripMap.redrawArrowLayer(this.fieldTripsData, fieldTrips);
		await _fieldTripMap.updateFieldTripPathVisibility(this.fieldTripsData, fieldTrips);
	}

	//#endregion

	//#region New Copy

	FieldTripMapOperation.prototype.isNewCopy = function(fieldTrip)
	{
		return fieldTrip.Id === 0;
	}

	FieldTripMapOperation.prototype.updateCopyFieldTripAttribute = function(fieldTrip)
	{
		if (fieldTrip.id !== fieldTrip.routePathAttributes.FieldTripId)
		{
			fieldTrip.routePathAttributes.FieldTripId = fieldTrip.id;
			fieldTrip.routePathAttributes.Color = fieldTrip.color;
		}
	}

	//#endregion
	
	//#region Add Field Trip Stop

	FieldTripMapOperation.prototype.startAddFieldTripStop = function()
	{
		if (!this.editing.isAddingStop)
		{
			this.editing.isAddingStop = true;
			this.mapInstance.setCrosshairCursor();
		}
	}

	FieldTripMapOperation.prototype.stopAddFieldTripStop = async function()
	{
		if (this.editing.isAddingStop)
		{
			this.editing.isAddingStop = false;
			this.mapInstance.setDefaultCursor();
		}
	}

	FieldTripMapOperation.prototype.applyAddFieldTripStops = async function(stops, callback = ()=>{})
	{
		if (!stops?.length >= 1)
		{
			console.warn(`No stops for applyAddFieldTripStops. RETURN`);
			return;
		}

		this.showLoadingIndicator();

		await _fieldTripMap.unfocusedRouteStop();
		await _fieldTripMap.addRouteStops(stops);

		this.hideLoadingIndicator();

		callback();
	}

	FieldTripMapOperation.prototype.onQuickAddStops = function(stops)
	{
		_fieldTripMap.quickAddStops(stops);
	}

	//#endregion

	//#region Refresh Field Trip Path

	FieldTripMapOperation.prototype.refresh = async function(fieldTrips, isZoomToLayer = true)
	{
		const self = this;
		self.updateArrowRenderer();
		self.setFieldTripStopVisibility(fieldTrips);
		await self.updateFieldTripPathVisibility(fieldTrips);
		await self.orderFeatures();

		if (isZoomToLayer)
		{
			self.zoomToFieldTripLayers(fieldTrips);
		}
	}

	//#endregion

	//#region RCM on Map

	//#region Field Trip Stop

	//#region Move Stop Location

	FieldTripMapOperation.prototype.moveStopLocation = async function(fieldTripId, stopId, sketchTool)
	{
		if (!sketchTool)
		{
			return;
		}

		await _fieldTripMap.moveRouteStop(fieldTripId, stopId, sketchTool);
	}


	//#endregion

	//#region TODO: Insert Field Trip Stop

	//#endregion

	//#region TODO: Geo Select Field Trip Stop

	//#endregion

	//#region TODO: Optimize Field Trip

	//#endregion

	//#region Delete Stop

	FieldTripMapOperation.prototype.deleteStopLocation = async function(fieldTripId, routeStopIds)
	{
		const self = this;
		self.showLoadingIndicator();

		self.stopAddFieldTripStop();

		await _fieldTripMap.deleteRouteStops(fieldTripId, routeStopIds);

		const data = { fieldTripStopId: routeStopIds[0] };
		self.mapInstance.fireCustomizedEvent({ eventType: TF.RoutingPalette.FieldTripMapEventEnum.DeleteStopLocationCompleted, data });

		self.hideLoadingIndicator();
	};

	//#endregion

	//#region Update Stop
	FieldTripMapOperation.prototype.updateStopSymbol = function(fieldTrip, stops)
	{
		const { DBID, FieldTripId } = _extractFieldTripFeatureFields(fieldTrip);
		_fieldTripMap.updateRouteStopSequence(DBID, FieldTripId, stops);
	};
	//#endregion

	//#region Stop Info

	FieldTripMapOperation.prototype.addHighlightFeatures = async function(data)
	{
		await _fieldTripMap.focusOnRouteStop(data, this.fieldTripsData);
	}

	FieldTripMapOperation.prototype.clearHighlightFeatures = async function()
	{
		await _fieldTripMap.unfocusedRouteStop();
	}

	FieldTripMapOperation.prototype.updateStopInfo = function(data)
	{
		const self = this,
			{ DBID, fieldTripStopId, fromFieldTripId, toFieldTripId, toStopSequence, color } = data,
			fieldTrip = self.fieldTripsData.find(item => item.id === toFieldTripId),
			visible = fieldTrip?.visible;

		_fieldTripMap.updateRouteStopAttribute(DBID, fieldTripStopId, fromFieldTripId, toFieldTripId, toStopSequence, color, visible);
	}

	//#endregion

	//#endregion

	//#endregion

	//#endregion

	//#region Map Events

	FieldTripMapOperation.prototype.onMapClickEvent = async function(data)
	{
		const self = this, event = data.event;

		if (event.button === 0)
		{
			// click on map
			if (this.editing.isAddingStop)
			{
				self.showLoadingIndicator();

				const mapPoint = data.event.mapPoint;
				const { longitude, latitude } = mapPoint;
				const newStopData = await _fieldTripMap.focusOnNewRouteStop(longitude, latitude);

				self.hideLoadingIndicator();

				if (newStopData === null)
				{
					return;
				}

				this.mapInstance.fireCustomizedEvent({ eventType: TF.RoutingPalette.FieldTripMapEventEnum.AddStopFromMapCompleted, data: newStopData });
				self.stopAddFieldTripStop();
			}
		}
		else if (event.button === 2)
		{
			// right click
			const stopGraphics = await _fieldTripMap.hitTestRouteStops(event);
			const pathGraphics = await _fieldTripMap.hitTestRoutePaths(event);
			if (stopGraphics.length > 0 || pathGraphics.length > 0)
			{
				await this.confirmToExitAddingStop(false);
			}

			if (stopGraphics.length > 0)
			{
				const data = stopGraphics.map(stop => {
					const { DBID, FieldTripId, id, Sequence } = stop.attributes;
					return { DBID, FieldTripId, id, Sequence };
				});
				const dataWrapper = { data, event };
				this.mapInstance.fireCustomizedEvent({ eventType: TF.RoutingPalette.FieldTripMapEventEnum.FieldTripStopClick, data: dataWrapper });
			}

			if (pathGraphics.length > 0)
			{
				const data = pathGraphics.map(graphic => {
					const { DBID, FieldTripId, Sequence } = graphic.attributes;
					let geometry = graphic.geometry;
					if (geometry.spatialReference.isWebMercator)
					{
						geometry = TF.GIS.GeometryHelper.ConvertToWGS1984(geometry);
					}
					const { paths } = geometry;
					return { DBID, FieldTripId, Sequence, paths };
				});
				const dataWrapper = { data, event };
				this.mapInstance.fireCustomizedEvent({ eventType: TF.RoutingPalette.FieldTripMapEventEnum.FieldTripPathClick, data: dataWrapper });
			}
		}
	}

	FieldTripMapOperation.prototype.onMapKeyUpEvent = async function(_, data)
	{
		const keyName = data.event.key;
		switch (keyName)
		{
			case "Escape":
				await this.confirmToExitAddingStop();
				break;
			case "Enter":
				console.log("TODO: Press Enter on FieldTripMapOperation");
				break;
			case "Delete":
				console.log("TODO: Press Delete on FieldTripMapOperation");
				break;
			case "m":
			case "M":
				if (data.event.native.ctrlKey)
				{
					console.log("TODO: Press Ctrl + M on FieldTripMapOperation, refresh trip stop path which is NULL");
				}
				break;
			case "z":
			case "Z":
				if (data.event.native.ctrlKey)
				{
					console.log("TODO: Press Ctrl + Z on FieldTripMapOperation, revertMapClick");//see _initRevertOperation in Plus
				}
				break;
			default:
				break;
		}
	}

	FieldTripMapOperation.prototype.confirmToExitAddingStop = async function(needConfirmation = true, doFireEvent = true)
	{
		if (!this.editing.isAddingStop)
		{
			return false;
		}

		const apply = async () =>
		{
			this.stopAddFieldTripStop();
			await _fieldTripMap.unfocusedRouteStop();
			if (doFireEvent)
			{
				this.mapInstance.fireCustomizedEvent({ eventType: TF.RoutingPalette.FieldTripMapEventEnum.ExitAddingStop });
			}
		}

		if (!needConfirmation)
		{
			return await apply();
		}

		const response = await tf.promiseBootbox.yesNo("Are you sure you want to cancel?", "Confirmation Message");
		if (response)
		{
			await apply();
		}
	}

	//#endregion

	//#region Map Visualization

	//#region - Path Arrows


	FieldTripMapOperation.prototype.updateArrowRenderer = function()
	{
		const arrowRenderer = this._getArrowRenderer();
		this.pathArrowLayerInstance.setRenderer(arrowRenderer);
		this.sequenceLineArrowLayerInstance.setRenderer(arrowRenderer);
	}

	FieldTripMapOperation.prototype.hideArrowLayer = function()
	{
		const sortedFieldTrips = _getSortedFieldTrips(this.fieldTripsData);

		_fieldTripMap.updateArrowRenderer(sortedFieldTrips);
	}

	//#endregion


	//#endregion


	//#region Private Methods

	const _sortBySequence = (stops) => stops.sort((a, b) => a.Sequence - b.Sequence);

	const _extractFieldTripFeatureFields = (fieldTrip) =>
	{
		const DBID = fieldTrip.DBID,
			FieldTripId = fieldTrip.oldId || fieldTrip.id;

		return { DBID, FieldTripId };
	}

	FieldTripMapOperation.prototype.showLoadingIndicator = function()
	{
		if (tf.loadingIndicator)
		{
			tf.loadingIndicator.showImmediately();
		}
	}

	FieldTripMapOperation.prototype.hideLoadingIndicator = function()
	{
		if (tf.loadingIndicator)
		{
			tf.loadingIndicator.tryHide();
		}
	}

	//#endregion

	FieldTripMapOperation.prototype.dispose = function()
	{
		if (_fieldTripMap)
		{
			_fieldTripMap.dispose();
			_fieldTripMap = null;
		}
	}
})();