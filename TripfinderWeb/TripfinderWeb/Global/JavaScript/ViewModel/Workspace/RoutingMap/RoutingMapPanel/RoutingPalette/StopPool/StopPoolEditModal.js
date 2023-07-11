(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").StopPoolEditModal = StopPoolEditModal;
	var TripStopHelper = TF.Helper.TripStopHelper;
	function StopPoolEditModal(viewModel)
	{
		TF.RoutingMap.RoutingPalette.BaseFieldTripStopEditModal.call(this, viewModel, "workspace/RoutingMap/RoutingMapPanel/RoutingPalette/EditStopPool");
		this.obDataModel = this.createObservableDataModel(TF.RoutingMap.RoutingPalette.StopPoolFeatureData.StopPoolData.getDataModel());
		this.isCopied = ko.observable(false);
		this.dataModel.highlightChangedEvent.subscribe(this.onHighLightChangedEvent.bind(this));
		this.disabled = ko.computed(function() { return this.showWalkout() == false && this.obSelectedStopType() != "Walkout"; }, this);
		this.bindTag = false;
		this.isDoorToDoor = ko.observable(false);
		this.obTotalStopTimeShow = ko.observable("00:00");
		this.obTotalStopTimeShow.subscribe(this.obTotalStopTimeShowChange, this);
		this.obDataModel.TotalStopTime.subscribe(this.totalStopTimeChange, this);

	}

	StopPoolEditModal.prototype = Object.create(TF.RoutingMap.RoutingPalette.BaseFieldTripStopEditModal.prototype);
	StopPoolEditModal.prototype.constructor = StopPoolEditModal;

	StopPoolEditModal.prototype.getWalkoutBufferVisible = function()
	{
		return this.obSelectedStopType() == 'Walkout' && this.mode() == 'new' && this.walkoutType() == 0 && this.obSelectedStopType() == 'Walkout';
	};

	StopPoolEditModal.prototype.init = function(options)
	{
		var self = this;
		self.initWalkoutData();
		if (!self.bindTag)
		{
			self._bindParamsChange("#stopPoolWalkoutCheckbox", "ShowWalkout");
			self._bindParamsChange("#stopPoolDistance", "Distance");
			self._bindParamsChange("#stopPoolDistanceUnit", "DistanceUnit");
			self._bindParamsChange("input[type=radio][name=stopPoolWalkoutType]", "WalkoutType");
			self._bindParamsChange(".stopPoolCurbApproachRadio", "vehicleCurbApproach");
			self.bindTag = true;
		}
		return TF.RoutingMap.RoutingPalette.BaseFieldTripStopEditModal.prototype.init.call(this, options);
	};

	StopPoolEditModal.prototype.initWalkoutData = function()
	{
		var self = this;
		var d = self.getWalkoutData();
		if (d.walkoutBuffer) self.walkoutBuffer(d.walkoutBuffer);
		if (d.walkoutDistance) self.walkoutDistance(d.walkoutDistance);
		if (d.distanceUnit) self.obSelectedDistanceUnit(d.distanceUnit);
		if (d.bufferUnit) self.obSelectedBufferUnit(d.bufferUnit);
	}

	StopPoolEditModal.prototype.getDataModel = function()
	{
		return TF.RoutingMap.RoutingPalette.StopPoolFeatureData.StopPoolData.getDataModel();
	};

	StopPoolEditModal.prototype.getAllHighlight = function()
	{
		return this.dataModel.lockData.filterUnLockItems(this.dataModel.highlighted);
	};

	StopPoolEditModal.prototype.getWalkoutData = function()
	{
		var data = {};
		data.walkoutBuffer = tf.storageManager.get("stoppool-walkoutBuffer");
		data.walkoutDistance = tf.storageManager.get("stoppool-walkoutDistance");
		data.distanceUnit = tf.storageManager.get("stoppool-distanceUnit");
		data.bufferUnit = tf.storageManager.get("stoppool-bufferUnit");
		return data;
	}

	StopPoolEditModal.prototype.saveWalkoutData = function(data)
	{
		tf.storageManager.save("stoppool-walkoutBuffer", data.walkoutBuffer);
		tf.storageManager.save("stoppool-walkoutDistance", data.walkoutDistance);
		tf.storageManager.save("stoppool-distanceUnit", data.distanceUnit);
		tf.storageManager.save("stoppool-bufferUnit", data.bufferUnit);
	}

	StopPoolEditModal.prototype.closeEditModal = function()
	{
		var self = this;
		self.hide();
		self.resolve();
	};

	StopPoolEditModal.prototype.initTitle = function(isNew)
	{
		var stopPoolCategoryName = this.viewModel.display.obStopPoolName() != '' ? this.viewModel.display.obStopPoolName() : 'Stop Pool';
		TF.RoutingMap.BaseEditModal.prototype.initTitle.call(this, isNew, stopPoolCategoryName);
	};

	StopPoolEditModal.prototype._update = function(data)
	{
		this.dataModel.update(data);
	};

	StopPoolEditModal.prototype.create = function(data, createTripBoundary, options)
	{
		var self = this;

		return self.beforeChangeData().then(() =>
		{
			return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "districtTripPolicies"), { paramData: { dbid: tf.datasourceManager.databaseId } }).then(function(res)
			{
				data.TotalStopTime = (res.Items[0] || {}).VehicleStopTime;
			});
		}).then(() =>
		{
			self.createTripBoundary = createTripBoundary;
			if (self.isCreateUseLastSetting(options.isCopied, options.isDoorToDoor))
			{
				return self.createUseLastSetting(data);
			}
			self.initing = true;
			var dataModel = $.extend(self.getDataModel(), data);
			if (options.isDoorToDoor)
			{
				dataModel.isFromDTD = true;
				if (self.dataModel.schoolLocationDictionary && self.dataModel.schoolLocationDictionary[options.student.SchoolCode])
				{
					dataModel.doorToDoorSchoolId = options.student.SchoolId;
				}
			}

			if (options.selectLastSelectedTrip)
			{
				if (self.lastCreateData && self.lastCreateData.TripId)
				{
					dataModel.TripId = self.lastCreateData.TripId;
				}
			}
			self.addOverlayToPanels();
			self.normalizeData(dataModel);
			self.initTitle(true);
			self.init(options).then(function()
			{
				self._setTripsByOption(options);
				self.afterCreateInit(options.isDoorToDoor);
				self.studentSelectionCreate(options.isContainsPoints);
				self.insertBehindSpecialStop = options.insertBehindSpecialStop;
				if (options.insertBehindSpecialStop)
				{
					self.obIsInsertToSpecialStop(true);
					self.obTrips(self.obTrips().filter(function(trip)
					{
						return trip.id == options.insertBehindSpecialStop.TripId;
					}));
					self.obSelectedTrip(self.obTrips()[0]);
				}
				else
				{
					self.obIsInsertToSpecialStop(false);
				}
				self.showCurrentData();
				self.initing = false;
				self.show();
				setTimeout(function()
				{
					self.initValidation();
				}, 50);
			});
			return self.promise;
		});
	};

	StopPoolEditModal.prototype._create = function()
	{
		var self = this;
		var allPromises = [];
		self.data.forEach(function(stop)
		{
			var currentTravelSCenario = self.dataModel._viewModal.travelScenariosPaletteViewModel.travelScenariosViewModel.obSelectedTravelScenarios();
			allPromises.push(self.createTripBoundary(self.obSelectedStopType(), stop, currentTravelSCenario)
				.then(function(tripBoundary)
				{
					if (tripBoundary)
					{
						var data = self.trimStringSpace(stop);
						data.boundary = tripBoundary;
					}
					return data;
				}));
		});
		return Promise.all(allPromises).then(function(data)
		{
			// stop create boundary
			if (data.filter(function(c) { return !c; }).length > 0)
			{
				self.resolve(false);
				return;
			}

			let promise = Promise.resolve(data);
			if (self.dataModel.getRemoveOverlappingSetting())
			{
				promise = self.dataModel.viewModel.drawTool.removeOverlapBoundaries(data);
			}
			promise.then(function(data)
			{
				var boundaries = [];
				if (data)
				{
					data.forEach(function(d)
					{
						self.dataModel.create(d);
						boundaries.push(d.boundary)
					});
				}
				self.resolve(boundaries);
			});
		}, function()
		{
			self.resolve(false);
		});
	};

	StopPoolEditModal.prototype.addTotalStopTimeClick = function()
	{
		this.changeTotalStopTime(1);
	};

	StopPoolEditModal.prototype.minusTotalStopTimeClick = function()
	{
		this.changeTotalStopTime(-1);
	};

	StopPoolEditModal.prototype.changeTotalStopTime = function(changeNumber)
	{
		var totalStopTime = TripStopHelper.convertToSeconds(this.obDataModel.TotalStopTime());
		totalStopTime = totalStopTime + changeNumber;
		if (totalStopTime < 0)
		{
			totalStopTime = 0;
		}
		this.obDataModel.TotalStopTime(TripStopHelper.convertToMinuteSecond(totalStopTime || 0, "HH:mm:ss"));
	};


	StopPoolEditModal.prototype.calculateTotalStopTimeClick = function()
	{
		var stop = this.data[this.obCurrentPage()];
		this.obDataModel.TotalStopTime(stop.totalStopTimeCalc);
	};

	StopPoolEditModal.prototype.obTotalStopTimeShowChange = function()
	{
		var minutesSecond = this.obTotalStopTimeShow();
		if (/^[0-5]\d:[0-5]\d$/g.exec(minutesSecond))
		{
			this.obDataModel.TotalStopTime("00:" + minutesSecond);
		} else
		{
			this.obTotalStopTimeShow(formatTotalStopTimeDisplay(this.obDataModel.TotalStopTime()));
		}
	};


	StopPoolEditModal.prototype.totalStopTimeChange = function()
	{
		var stop = this.data[this.obCurrentPage()];
		//this.obRedAlertTotalStopTimeControl(stop.totalStopTimeCalc !== this.obDataModel.TotalStopTime());
		//this.obDataModel.TotalStopTimeManualChanged(this.obRedAlertTotalStopTimeControl());
		this.obTotalStopTimeShow(formatTotalStopTimeDisplay(this.obDataModel.TotalStopTime()));
	};


	function formatTotalStopTimeDisplay(stopTime)
	{
		var totalStopTime = TripStopHelper.convertToSeconds(stopTime);
		return TripStopHelper.convertToMinuteSecond(totalStopTime || 0, "mm:ss");
	}

})();