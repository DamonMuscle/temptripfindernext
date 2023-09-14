
(function()
{
	createNamespace("TF.RoutingPalette").FieldTripMapOperation = FieldTripMapOperation;

	console.log("0 TF.RoutingPalette.FieldTripMapOperation");

	//#region Constant

	const BASE_LAYER_ID = 0;
	const FieldTripMap_PathArrowLayerId = "FieldTripMap_PathArrowLayer";
	const FieldTripMap_PathArrowLayer_Index = BASE_LAYER_ID + 1;
	const FieldTripMap_PathLayerId = "FieldTripMap_PathLayer";
	const FieldTripMap_PathLayer_Index = BASE_LAYER_ID + 2;
	const FieldTripMap_SequenceLineArrowLayerId = "FieldTripMap_SequenceLineArrowLayer";
	const FieldTripMap_SequenceLineArrowLayer_Index = BASE_LAYER_ID +3;
	const FieldTripMap_HighlightLayerId = "FieldTripMap_HighlightLayer";
	const FieldTripMap_HighlightLayer_Index = BASE_LAYER_ID + 4;
	const FieldTripMap_SequenceLineLayerId = "FieldTripMap_SequenceLineLayer";
	const FieldTripMap_SequenceLineLayer_Index = BASE_LAYER_ID + 5;
	const FieldTripMap_StopLayerId = "FieldTripMap_StopLayer";
	const FieldTripMap_StopLayer_Index = BASE_LAYER_ID + 6;
	const FieldTripMap_HighlightStopLayerId = "FieldTripMap_HighlightStopLayer";
	const FieldTripMap_HighlightStopLayer_Index = BASE_LAYER_ID + 7;

	const INFO_STOP_COLOR = "#FFFFFF";
	const LAYER_TYPE = {
		PATH: "PathLayer",
		STOP: "StopLayer"
	};

	//#endregion

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
			isMovingStop: false,
			features: {
				addingStop: null,
				movingStop: null
			}
		};
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

	let _pathArrowLayerInstance = null;
	let _pathLayerInstance = null;
	let _sequenceLineArrowLayerInstance = null;
	let _highlightLayerInstance = null;
	let _sequenceLineLayerInstance = null;
	let _stopLayerInstance = null;
	let _highlightStopLayerInstance = null;

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

	const _compareFieldTripNames = (a, b) =>
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

	const _sortFieldTripByName = (fieldTrips) =>
	{
		const fieldTripIdMapping = fieldTrips.map(item =>
		{
			const { DBID, FieldTripId } = _extractFieldTripFeatureFields(item);
			const data = {
				DBID: DBID,
				Name: item.Name,
				id: FieldTripId
			};
			return data;
		});

		const sortedFieldTrips = fieldTripIdMapping.sort(_compareFieldTripNames).map(item => {
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

	const _isNewCopy = (fieldTrip) => fieldTrip.Id === 0;

	const _updateCopyFieldTripAttribute = (fieldTrip) =>
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

	FieldTripMapOperation.prototype.refreshFieldTripPath = async function(fieldTrip, effectSequences, isZoomToLayer = true)
	{
		console.log("21 FieldTripMapOperation.prototype.refreshFieldTripPath");

		this.refresh([fieldTrip], isZoomToLayer);
	}

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

	FieldTripMapOperation.prototype.moveStopLocation = async function(fieldTrip, stop, sketchTool)
	{
		const self = this;
		if (!_stopLayerInstance || !sketchTool)
		{
			return;
		}

		if (self.editing.isMovingStop)
		{
			return;
		}

		const sequence = stop.Sequence, fieldTripId = fieldTrip.id;
		const fieldTripStops = _getStopFeatures();
		const stopGraphic = fieldTripStops.find(item => item.attributes.FieldTripId === fieldTripId && item.attributes.Sequence === sequence);
		if (!stopGraphic)
		{
			return;
		}

		self.editing.isMovingStop = true;
		self.editing.features.movingStop = {
			fieldTrip: fieldTrip,
			stop: stop
		};

		_stopLayerInstance?.moveStop(stopGraphic, sketchTool, function(movedStopData){
			self.onStopLayerMoveStopCompleted(movedStopData);
			self.onStopLayerMoveStopCompleted_UpdateDataModel({graphic: stopGraphic});
		});

		stopGraphic.visible = false;
	}

	FieldTripMapOperation.prototype.onStopLayerMoveStopCompleted = async function(data)
	{
		const self = this,
			{ fieldTrip, stop } = self.editing.features.movingStop,
			{ longitude, latitude, Address, City } = data;

		if (Address !== "")
		{
			stop.Street = Address;
			stop.City = City;
		}
		stop.XCoord = +longitude.toFixed(6);
		stop.YCoord = +latitude.toFixed(6);

		const effectSequences = self._computeEffectSequences(fieldTrip, {moveStop: stop});
		await self.refreshFieldTripPath(fieldTrip, effectSequences);

		self.editing.isMovingStop = false;
		self.editing.features.movingStop = null;
		self.hideLoadingIndicator();
	}

	FieldTripMapOperation.prototype.onStopLayerMoveStopCompleted_UpdateDataModel = function(data)
	{
		const stop = this.editing.features.movingStop.stop,
			graphic = data.graphic,
			attributes = graphic.attributes;
		if (stop.FieldTripId === attributes.FieldTripId && stop.Sequence === attributes.Sequence)
		{
			const data = {
				DBID: attributes.DBID,
				FieldTripId: stop.FieldTripId,
				Sequence: stop.Sequence,
				Name: stop.Street,
				XCoord: stop.XCoord,
				YCoord: stop.YCoord,
			};
			this.mapInstance.fireCustomizedEvent({ eventType: TF.RoutingPalette.FieldTripMapEventEnum.MoveStopLocationCompleted, data });
		}
		else
		{
			console.warn(`updateDataModel: stop does not match!`);
		}
	}

	//#endregion

	//#region Delete Stop

	FieldTripMapOperation.prototype.deleteStopLocation = async function(DBID, fieldTripId, routeStopIds)
	{
		const self = this;
		self.showLoadingIndicator();

		self.stopAddFieldTripStop();

		await _fieldTripMap.deleteRouteStops(DBID, fieldTripId, routeStopIds);

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
				const newStopData = await _fieldTripMap.createNewRouteStop(longitude, latitude);

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


	FieldTripMapOperation.prototype.drawFieldTripPath = async function(fieldTrip, effectSequences)
	{
		console.log("23 FieldTripMapOperation.prototype.drawFieldTripPath");
		const routePath = await this._updateRoutepathAndDirection(fieldTrip, effectSequences);
		
		if (!routePath)
		{
			return;
		}

		_calculatePathAttributesAndDraw(fieldTrip, routePath);
	}

	const _calculatePathAttributesAndDraw = (fieldTrip, routePath) =>
	{
		if (!fieldTrip.routePathAttributes)
		{
			fieldTrip.routePathAttributes = _computePathAttributes(fieldTrip);
		}

		if (_isNewCopy(fieldTrip))
		{
			_updateCopyFieldTripAttribute(fieldTrip);
		}

		const pathAttributes = fieldTrip.routePathAttributes;
		_drawRoutePath(routePath, pathAttributes);

	}

	const _drawRoutePath = async (routePaths, attributes) =>
	{
		const DEFAULT_PATH_VISIBILITY = false
		for (let i = 0; i < routePaths.length; i++)
		{
			const routePath = routePaths[i];
			// hide by default for UX.
			const graphic = TF.RoutingPalette.FieldTripMap.PathGraphicWrapper.CreatePath([routePath], {...attributes}, DEFAULT_PATH_VISIBILITY);
			_pathLayerInstance.addPath(graphic);
		}
	};

	//#region - Path Arrows


	const _getSortedFieldTrips = (fieldTrips) =>
	{
		const fieldTripsClone = [...fieldTrips];
		fieldTripsClone.sort(_compareFieldTripNames);

		return fieldTripsClone;
	};

	FieldTripMapOperation.prototype.updateArrowRenderer = function()
	{
		console.log("25[DONE] FieldTripMapOperation.prototype.updateArrowRenderer");
		const sortedFieldTrips = _getSortedFieldTrips(this.fieldTripsData);

		_fieldTripMap.updateArrowRenderer(sortedFieldTrips);
	}

	//#endregion

	//#region - Computing Methods

	FieldTripMapOperation.prototype._computeEffectSequences = function(fieldTrip, {addStop, moveStop, deleteStop} = {})
	{
		let effectSequences = [];

		if (addStop)
		{
			effectSequences = fieldTrip.FieldTripStops.filter(stop => stop.Sequence == addStop.Sequence - 1 || stop.Sequence == addStop.Sequence || stop.Sequence == addStop.Sequence + 1);
		}
		else if (moveStop)
		{
			effectSequences = fieldTrip.FieldTripStops.filter(stop => stop.Sequence >= moveStop.Sequence - 1 && stop.Sequence <= moveStop.Sequence + 1);
		}
		else if(deleteStop)
		{
			effectSequences = fieldTrip.FieldTripStops.filter(stop => stop.Sequence == deleteStop.Sequence - 1 || stop.Sequence == deleteStop.Sequence);
		}

		return effectSequences.map(stop => stop.Sequence);
	}

	FieldTripMapOperation.prototype._updateRoutepathAndDirection = async function(fieldTrip, effectSequences)
	{
		if (!fieldTrip.routePath)
		{
			let effectedStops = this._getEffectStops(fieldTrip, effectSequences);
			const fieldTripStops = await this.calculateRouteByStops(fieldTrip, effectedStops);
			if (fieldTripStops === null)
			{
				return null;
			}

			const data = { fieldTrip };

			await this.mapInstance.fireCustomizedEvent({ eventType: TF.RoutingPalette.FieldTripMapEventEnum.DirectionUpdated, data });
		}

		const routePath = fieldTrip.FieldTripStops.filter(stop => !!stop.Paths && stop.Paths.length > 0).map(stop => stop.Paths);
		return routePath;
	}
	
	FieldTripMapOperation.prototype._getEffectStops = function(fieldTrip, effectSequences)
	{
		let effectedStops = [];
		if (!effectSequences)
		{
			effectedStops = fieldTrip.FieldTripStops;
		}
		else
		{
			effectedStops = fieldTrip.FieldTripStops.filter(stop => effectSequences.includes(stop.Sequence));
		}

		return effectedStops;
	}

	FieldTripMapOperation.prototype._swapAttributeForStop = function(fieldTripStops, routeResult)
	{
		const stops = routeResult?.stops;

		stops.forEach(stop => {
			const matchedStop = fieldTripStops.find(originalStop => originalStop.Sequence == stop.attributes.Name);

			stop.attributes.OriginalSequence = stop.attributes.Name;

			stop.attributes.Name = matchedStop.Street;
		});
	}

	const _computePathAttributes = (fieldTrip) =>
	{
		const Color = _getFieldTripColor(fieldTrip),
			{ DBID, FieldTripId } = _extractFieldTripFeatureFields(fieldTrip),
			attributes = { DBID, FieldTripId, Color };
		return attributes;
	}

	//#endregion

	//#endregion

	//#region Routing

	FieldTripMapOperation.prototype.calculateRouteByStops = async function(fieldTrip, fieldTripStops)
	{
		const MIN_ROUTING_STOPS = 2;
		if (fieldTripStops.length < MIN_ROUTING_STOPS)
		{
			return null;
		}

		const self = this, networkService = TF.GIS.Analysis.getInstance().networkService;
		const stops = self.createStopObjects(fieldTripStops);
		const stopFeatureSet = await networkService.createStopFeatureSet(stops);
		const params = self.createRouteParams(stopFeatureSet);

		let response = null;
		try
		{
			response = await networkService.solveRoute(params);
		}
		catch(err)
		{
			if (err.details.messages && err.details.messages.length > 0)
			{
				if (err.details.messages[0].indexOf("No solution found.") > -1 || err.details.messages[0].indexOf("Invalid locations detected") > -1)
				{
					return self.refreshTripByStopsSeperately(fieldTrip, fieldTripStops, networkService).then(function(tripStops)
					{
						let errorMessage = tripStops.reduce(({message, findInvalidStop}, stop, index, array) =>
						{
							const isTerminalStop = _.last(array) == stop;
							if (!findInvalidStop)
							{
								if (!stop.Paths && !isTerminalStop)
								{
									message += ` No solution found from Stop ${stop.Sequence}`
									return { message, findInvalidStop: true };
								}
							}
							else if (findInvalidStop && (stop.Paths || isTerminalStop))
							{
								message +=` to Stop ${ stop.Sequence }.`
								return { message, findInvalidStop: false};
							}

							return { message, findInvalidStop };
						}, { message: "Cannot solve path.", findInvalidStop: false});

						tf.promiseBootbox.alert(errorMessage);
						return tripStops;
					});
				}
			}

			tf.promiseBootbox.alert(`Cannot solve path. One or more of your stops is invalid or unreachable.`);
			return null;
		}

		const result = response?.results?.routeResults[0];
		var pathSegments = this._createPathSegments(response?.results);
		fieldTripStops = this._createTripStops(fieldTrip, fieldTripStops, pathSegments);
		this._swapAttributeForStop(fieldTripStops, result);

		return fieldTripStops;
	}

	FieldTripMapOperation.prototype.createStopObjects = function(fieldTripStops)
	{
		const stops = [];

		for (let i = 0; i < fieldTripStops.length; i++)
		{
			const stop = fieldTripStops[i];
			const routeStop = {
				curbApproach: stop.vehicleCurbApproach,
				name: stop.Sequence,
				sequence: stop.Sequence,
				longitude: stop.XCoord,
				latitude: stop.YCoord,
			};
			stops.push(routeStop);
		}

		return stops;
	}

	FieldTripMapOperation.prototype.createRouteParams = function(stopFeatureSet)
	{
		return {
			impedanceAttribute: null,
			preserveFirstStop: true,
			preserveLastStop: true,
			stops: stopFeatureSet
		};
	};

	FieldTripMapOperation.prototype._isLastStop = function(trip, stop, allStops)
	{
		if (!trip)
		{
			return stop.Sequence === allStops.length;
		}
		return trip.FieldTripStops.length === stop.Sequence;
	};

	//if refresh path fail, will solve path one by one for each stop
	FieldTripMapOperation.prototype.refreshTripByStopsSeperately = function(trip, tripStops, networkService)
	{
		var self = this,
			index = 0,
			resolve = null,
			errMessage = null,
			promise = new Promise(function(solve) { resolve = solve; });

		function solveRequest()
		{
			if (index < tripStops.length - 1)
			{
				const tripStop = tripStops[index];
				var stops = self.createStopObjects([tripStop, tripStops[index + 1]]);
				var createStopsPromise = networkService.createStopFeatureSet(stops);
				let beforeStop = tripStops[index - 1] ? tripStops[index - 1] : self._getBeforeStop(trip, tripStop);
				var vertexPromise = self._getVertexesCloseToStopOnPathSeperately(beforeStop, tripStop, networkService);
				return Promise.all([createStopsPromise, vertexPromise]).then(function(res)
				{
					var stopFeatureSet = res[0];
					var vertexFeatureSet = res[1];
					var vertex = null;
					if (vertexFeatureSet  && vertexFeatureSet.features && vertexFeatureSet.features[0])
					{
						vertex = vertexFeatureSet.features[0];
						stopFeatureSet.features.unshift(vertex);
					}
					const params = self.createRouteParams(stopFeatureSet);
					return networkService.solveRoute(params).then(function(res)
					{
						var result = res.results;
						if (!result.routeResults)
						{
							tripStop.Paths = null;
						}
						else
						{
							var pathSegments = self._createPathSegments(result);
							pathSegments = self._updatePathSegments(pathSegments, [vertex, null]);
							tripStops[index] = self._createTripStops(trip, [tripStop], pathSegments)[0];
						}
						index++;
						solveRequest();
						return promise;
					}, function(err)
					{
						errMessage = err;
						tripStop.Paths = null;
						tripStop.Distance = 0;
						tripStop.DrivingDirections = "";
						tripStop.Speed = 0;
						index++;
						solveRequest();
						return promise;
					});
				});
			}
			else
			{
				return resolve(tripStops);
			}
		}
		return solveRequest();
	}

	FieldTripMapOperation.prototype._updatePathSegments = function(pathSegments, vertexes)
	{
		if (vertexes && vertexes[0] && vertexes[0].geometry)
		{
			const pathGeometry = TF.GIS.GeometryHelper.ComputeWebMercatorPolyline(pathSegments[0].paths);
			var firstSegmentGeom = TF.GIS.GeometryHelper.SimplifyGeometry(pathGeometry);
			if (firstSegmentGeom && firstSegmentGeom.paths[0].length > 2 && pathSegments[0] && pathSegments[1])
			{
				firstSegmentGeom.removePoint(0, 0);
				var allPoints = [];
				firstSegmentGeom.paths.forEach(function(path)
				{
					allPoints = allPoints.concat(path);
				});
				pathSegments[1].paths = allPoints.concat(pathSegments[1].paths);
				pathSegments[1].length = pathSegments[0].length + pathSegments[1].length;
				pathSegments[1].time = pathSegments[0].time + pathSegments[1].time;
			}
			pathSegments = pathSegments.slice(1, pathSegments.length);
		}
		if (vertexes && vertexes[1] && vertexes[1].geometry)
		{
			const pathGeometry = TF.GIS.GeometryHelper.ComputeWebMercatorPolyline(pathSegments[pathSegments.length - 1].paths);
			var lastSegmentGeom = TF.GIS.GeometryHelper.SimplifyGeometry(pathGeometry);
			if (lastSegmentGeom && lastSegmentGeom.paths[0].length > 2 && pathSegments[pathSegments.length - 2] && pathSegments[pathSegments.length - 1])
			{
				lastSegmentGeom.removePoint(0, lastSegmentGeom.paths[0].length - 1);
				lastSegmentGeom.paths.forEach(function(path)
				{
					pathSegments[pathSegments.length - 2].paths = pathSegments[pathSegments.length - 2].paths.concat(path);
				});
				pathSegments[pathSegments.length - 2].length = pathSegments[pathSegments.length - 2].length + pathSegments[pathSegments.length - 1].length;
				pathSegments[pathSegments.length - 2].time = pathSegments[pathSegments.length - 2].time + pathSegments[pathSegments.length - 1].time;
			}
			pathSegments = pathSegments.slice(0, pathSegments.length - 1);
		}
		return pathSegments;
	}

	FieldTripMapOperation.prototype._getBeforeStop = function(trip, tripStop)
	{
		var beforeStops = trip.FieldTripStops.filter(s => s.Sequence < tripStop.Sequence);
		return beforeStops[beforeStops.length - 1];
	}

	FieldTripMapOperation.prototype._getVertexesCloseToStopOnPathSeperately = function(beforeStop, afterStop, networkService)
	{
		var self = this, vertex = null;
		vertex = getPrevVertex();
		return Promise.resolve(vertex);

		function getPrevVertex()
		{
			if (beforeStop)
			{
				var prevPaths = beforeStop.Paths;
				if (!prevPaths)
				{
					return null;
				}
				return self._findVertexToStopOnPath(prevPaths, afterStop, networkService);
			}
			return null;
		}
	}

	FieldTripMapOperation.prototype._findVertexToStopOnPath = function(paths, stop, networkService)
	{
		if (!paths || !paths[0]) return;
		var polyline = TF.GIS.GeometryHelper.ComputeWebMercatorPolyline(paths);
		var point = TF.GIS.GeometryHelper.ComputeWebMercatorPoint(stop.XCoord, stop.YCoord);
		var startPoint = polyline.paths[0][0];
		var distance1 = Math.sqrt((startPoint[0] - point.x) * (startPoint[0] - point.x) + (startPoint[1] - point.y) * (startPoint[1] - point.y));
		var endIndex = polyline.paths[0].length - 1;
		var endPoint = polyline.paths[0][endIndex];
		var distance2 = Math.sqrt((endPoint[0] - point.x) * (endPoint[0] - point.x) + (endPoint[1] - point.y) * (endPoint[1] - point.y));
		var locationPoint = TF.GIS.StopHelper.GetPointOnPolylineByDistanceToPoint(polyline, 3, distance1 < distance2);

		const stopObject = {
			curbApproach: stop.vehicleCurbApproach,
			name: stop.Sequence,
			sequence: stop.Sequence,
			longitude: locationPoint.longitude,
			latitude: locationPoint.latitude,
		};
		return networkService.createStopFeatureSet([stopObject]);
	}

	FieldTripMapOperation.prototype._createPathSegments = function(result)
	{
		const pathSegments = [];
		const directions = (result && result.routeResults) ? result.routeResults[0].directions : null;
		if (directions === null)
		{
			pathSegments.push({ paths: [] });
			return pathSegments;
		}

		const directionFeatures = directions.features;
		let stopToStopPaths = [];
		let stopToStopPathDirections = "";
		let stopToStopPathLength = 0;
		let stopToStopPathTime = 0;

		for (let i = 0, count = directionFeatures.length; i < count; i++)
		{
			const feature = directionFeatures[i];
			const attributes = feature.attributes;
			const maneuverType = feature.attributes.maneuverType;
			if (maneuverType === "esriDMTStop")
			{
				pathSegments.push({
					paths: [...stopToStopPaths],
					length: stopToStopPathLength,
					time: stopToStopPathTime,
					direction: stopToStopPathDirections
				});

				stopToStopPaths = [];
				stopToStopPathLength = 0;
				stopToStopPathTime = 0;
				stopToStopPathDirections = "";
			}

			if (maneuverType == "railroadStop")
			{
				stopToStopPathDirections += "WARNING CROSS OVER RAILROAD.\n";
			}
			else if (maneuverType != "esriDMTDepart" && maneuverType != "esriDMTStop")
			{
				stopToStopPathDirections += `${attributes.text} ${attributes.length.toFixed(2)} km. \n`;
			}

			stopToStopPaths = stopToStopPaths.concat(feature.geometry.paths[0]);
			stopToStopPathLength += attributes.length;
			stopToStopPathTime += attributes.time;
		}

		return pathSegments;
	}

	FieldTripMapOperation.prototype._createTripStops = function(fieldTrip, tripStops, pathSegments)
	{
		var self = this;
		tripStops.forEach(function(stop, index)
		{
			const segment = pathSegments[index];
			if (segment && !stop.failedStop)
			{
				stop.DrivingDirections = segment.direction;
				stop.RouteDrivingDirections = stop.DrivingDirections;
				stop.IsCustomDirection = false;
				stop.Speed = (segment.time && segment.time != 0) ? (segment.length / segment.time) * 60 : 0;
				stop.StreetSpeed = stop.Speed;
				stop.Distance = segment.length ? segment.length * 1 : -1;
				stop.Paths = segment.paths;
			}
			else if (stop.failedStop || self._isLastStop(fieldTrip, stop, tripStops))
			{
				stop.path = {};
				stop.Paths = [];
				stop.Distance = 0;
				stop.Speed = 0;
				stop.DrivingDirections = "";
			}
		});
		return tripStops;
	};

	//#endregion

	//#region Private Methods

	const _getStopFeatures = () => _stopLayerInstance.getFeatures();

	const _getFieldTripColor = (fieldTrip) => fieldTrip.color;

	const _sortBySequence = (stops) => stops.sort((a, b) => a.Sequence - b.Sequence);

	const _extractFieldTripFeatureFields = (fieldTrip) =>
	{
		const DBID = fieldTrip.DBID,
			FieldTripId = fieldTrip.oldId || fieldTrip.id;

		return { DBID, FieldTripId };
	};

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