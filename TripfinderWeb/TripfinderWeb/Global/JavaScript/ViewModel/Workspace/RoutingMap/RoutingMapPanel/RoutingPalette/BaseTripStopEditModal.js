(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").BaseTripStopEditModal = BaseTripStopEditModal;

	function BaseTripStopEditModal(viewModel, template)
	{
		var self = this;
		TF.RoutingMap.BaseEditModal.call(this, {
			routingMapDocumentViewModel: viewModel._viewModal,
			template: template
		});
		this.viewModel = viewModel;
		this.dataModel = viewModel.dataModel;
		this.obIsMultipleCreate = ko.observable(false);
		this.lastCreateData = null;
		this.createTripBoundary = null;
		this.isReadOnly = ko.observable(false);
		this.obIsSelectionCreate = ko.observable(false);
		this.obIsSearchCreate = ko.observable(false);
		this.obIsCreateFromTrialStop = ko.observable(false);
		this.obIsStopSearchCreate = ko.observable(false);
		this.obIsInsertToSpecialStop = ko.observable(false);
		this.insertBehindSpecialStop = null;
		this.isNewStop = ko.observable(false);
		// stop type selector
		this.singleTypes = ["Polygon", "Rectangle", "Draw", "Circle", "Door-to-Door", "Walkout"];
		this.multipleTypes = ["Door-to-Door", "Walkout"];
		this.copyBoundariesText = "Copy Boundaries for Selected Stop(s)";
		this.obStopTypes = ko.computed(this.computeObStopTypes.bind(this));
		this.obSelectedStopType = ko.observable(self.obStopTypes()[0]);
		this.obSelectedStopTypeText = ko.computed(function()
		{
			return this.obSelectedStopType();
		}, this);

		this.showWalkout = ko.observable(true);
		this.walkoutType = ko.observable(0);
		this.walkoutDistance = ko.observable(1000);
		this.walkoutBuffer = ko.observable(200);

		// units
		this.obUnits = ko.observableArray(["meters", "feet", "kilometers", "miles", "yards"]);
		this.obSelectedDistanceUnit = ko.observable(this.obUnits()[1]);
		this.obSelectedBufferUnit = ko.observable(this.obUnits()[1]);

		this.obSelectedBufferUnit.subscribe(function() { self._setValidation(); });
		this.obSelectedDistanceUnit.subscribe(function() { self._setValidation(); });

		this.obSelectedDistanceUnitText = ko.computed(function()
		{
			return this.obSelectedDistanceUnit();
		}, this);
		this.obSelectedBufferUnitText = ko.computed(function()
		{
			return this.obSelectedBufferUnit();
		}, this);

		this.checkImplement();

		this.createFromUnassignStudent = ko.observable(false);

		this.walkoutDistanceDisable = ko.computed(function()
		{
			return !(this.showWalkout() || self.obSelectedStopType() == "Walkout");
		}, this);

		this.copyStopBoundarySelectionCreate = ko.computed(function()
		{
			return this.obSelectedStopType() == this.copyBoundariesText;
		}, this);
		this.studentSelectionCreate = ko.observable(false);

		this.isNoWalkoutType = ko.computed(function()
		{
			return this.isShowWalkoutGuideType(this.obSelectedStopType());
		}, this);

		this.obShowStopLocationMap = ko.observable(false);
		this.obShowStopLocationMap.subscribe(newValue =>
		{
			if (newValue != this.isJunction() && this.mode() == 'new')
			{
				this.isJunction(newValue);
			}
		});
		this.isCopied = ko.observable(false);
		this.obIsAllCreateFromPoints = ko.observable(false);
		this.walkoutBufferVisible = ko.pureComputed(function()
		{
			return this.getWalkoutBufferVisible();
		}, this);
		this.isJunction = ko.observable(false);
		this.isJunction.subscribe(e =>
		{
			if (e && this.obDataModel.vehicleCurbApproach)
			{
				this.obDataModel.vehicleCurbApproach(0);
			}
		});
	}

	BaseTripStopEditModal.prototype = Object.create(TF.RoutingMap.BaseEditModal.prototype);
	BaseTripStopEditModal.prototype.constructor = BaseTripStopEditModal;

	BaseTripStopEditModal.prototype.isShowWalkoutGuideType = function(stopType)
	{
		return stopType != "Door-to-Door" && stopType != "None" && stopType != this.copyBoundariesText;
	};

	//buildKey
	BaseTripStopEditModal.prototype.buildUserPreferenceKey = function()
	{
		return {
			userPreferenceDefaultStopBoundaryType: tf.storageManager.prefix + 'mapcanvas.defaultStopBoundaryType'
		};
	};

	//set key to Modal
	BaseTripStopEditModal.prototype.initUserPreferenceKey = function()
	{
		var self = this;
		var userPreferenceKeys = self.buildUserPreferenceKey();
		self.userPreferenceDefaultStopBoundaryType = ko.observable(userPreferenceKeys.userPreferenceDefaultStopBoundaryType);
	};

	//get All UserPreference
	BaseTripStopEditModal.prototype.getUserPreferenceData = function()
	{
		var self = this;
		var userPreferenceKeys = {
			userPreferenceDefaultStopBoundaryType: self.userPreferenceDefaultStopBoundaryType(),
		};
		return self.getUserPreferenceDataCommon(userPreferenceKeys);
	};

	//get UserPreference by keys
	BaseTripStopEditModal.prototype.getUserPreferenceDataCommon = function(userPreferenceKeys)
	{
		var defaultStopBoundaryType = tf.userPreferenceManager.get(userPreferenceKeys.userPreferenceDefaultStopBoundaryType)
		return { defaultStopBoundaryType };
	};

	BaseTripStopEditModal.prototype.getWalkoutBufferVisible = function()
	{
		return true;
	};

	BaseTripStopEditModal.prototype.init = function(options)
	{
		var self = this;
		options = $.extend({
			isCreateFromUnassignStudent: false,
			isCreateFromTrialStop: false,
			isCreateFromSelection: false,
			isCreateFromSearch: false,
			isCreateFromStopSearch: false,
			isCopied: false
		}, options);
		this.obCurrentPage(0);
		this.obRecordsCount(this.data.length);
		this.isCopied(options.isCopied);
		this.obIsMultipleCreate(this.data.length > 1 && this.mode() == "new");
		this.createFromUnassignStudent(options.isCreateFromUnassignStudent);
		if (options.isCreateFromUnassignStudent)
		{
			this.obSelectedStopType(this.obStopTypes().filter(function(type) { return type == "Door-to-Door" })[0]);
		} else
		{
			this.obSelectedStopType(this.obStopTypes()[0]);
		}
		this.obIsSelectionCreate(options.isCreateFromSelection);
		this.obIsStopSearchCreate(options.isCreateFromStopSearch);
		this.obIsSearchCreate(options.isCreateFromSearch);
		this.obIsCreateFromTrialStop(options.isCreateFromTrialStop);
		this.promise = new Promise(function(resolve, reject) { self.resolve = resolve; self.reject = reject; });
		for (var key in this.obDataModel)
		{
			if (ko.isObservable(this.obDataModel[key]))
			{
				this.obDataModel[key]("");
			}
		}
		this._enableKeyEnterApply();
		this.obShowStopLocationMap(false);
		this.isJunction(false);

		if (self.data.length == 1 && !this.createFromUnassignStudent())
		{
			var stop = self.data[0];
			self.initMap(stop);
		}
		return Promise.resolve();
	};

	BaseTripStopEditModal.prototype.initMap = function(stop)
	{
		var self = this;
		var stopTool = self.dataModel.viewModel.drawTool.stopTool;
		if (!self.map)
		{
			var basemap = new tf.map.ArcGIS.Basemap({
				baseLayers: [],
				id: "whiteBaseMap",
				title: "White Canvas"
			});

			self.map = new tf.map.ArcGIS.Map({
				basemap: basemap
			});
			var view = new tf.map.ArcGIS.MapView({
				container: self.element.find(".stopLocationMap")[0],
				center: stop.geometry,
				map: self.map,
				zoom: 18,
				spatialReference: {
					wkid: 102100
				},
				constraints: { rotationEnabled: false },
			});
			self._disableMapNavagation(view);
			view.on("pointer-move", function(e)
			{
				stopTool.mouseMoveEventOnJunctionMap(e, self.map);
			});
			self.map.mapView = view;
		}
		stopTool.initStopInfoControlOnJunction(stop, self.map);
	};
	BaseTripStopEditModal.prototype._disableMapNavagation = function(view)
	{
		view.ui.components = [];
		view.on("drag", stopEvtPropagation);
		view.on("double-click", stopEvtPropagation);
		view.on("double-click", ["Control"], stopEvtPropagation);
		view.on("key-down", stopEvtPropagation);
		view.on("mouse-wheel", stopEvtPropagation);
		function stopEvtPropagation(event)
		{
			event.stopPropagation();
		}
	};

	BaseTripStopEditModal.prototype.checkImplement = function()
	{
		if (!this.getDataModel)
		{
			throw "getDataModel is not Implement";
		}
	};

	BaseTripStopEditModal.prototype.changeLocation = function(geometry, address)
	{
		if (this.obVisible())
		{
			this.obDataModel.Street(address);
			this.data.forEach(function(d)
			{
				d.geometry = geometry;
			});
		}
	};

	BaseTripStopEditModal.prototype.create = function(data, createTripBoundary, options)
	{
		var self = this;

		return self.beforeChangeData().then(function()
		{
			self.createTripBoundary = createTripBoundary;
			if (self.isCreateUseLastSetting(options.isCopied, options.isDoorToDoor, options.tryUseLastSettings))
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

	BaseTripStopEditModal.prototype._setTripsByOption = function(options)
	{
		if (options.Trips && options.Trips.length > 0 && this.obTrips)
		{
			this.obTrips(options.Trips);
			this.obSelectedTrip(this.obTrips()[0]);
		}
	};

	BaseTripStopEditModal.prototype.createMultiple = function(data, createTripBoundary, options)
	{
		var self = this;
		return self.beforeChangeData().then(function()
		{
			self.initing = true;
			var stopsModel = [];
			data.map(function(stop)
			{
				var dataModel = $.extend(self.getDataModel(), {
					Street: stop.address,
					XCoord: stop.x,
					YCoord: stop.y,
					geometry: stop.geometry,
					City: stop.city || stop.City,
					unassignStudent: stop.unassignStudent,
					ProhibitCrosser: stop.ProhibitCrosser,
					Comment: stop.Comment || stop.Comments,
					vehicleCurbApproach: stop.vehicleCurbApproach,
					boundary: stop.boundary ? stop.boundary : {},
					TotalStopTime: stop.TotalStopTime
				});

				if (stop.type == "student" && options.isCreateFromUnassignStudent)
				{
					//add this tag for easy calculate cross street status when create multiple dtd stops from unassigned.
					//will delete this tag when calculate cross done. 
					dataModel.isFromDTD = true;
				}

				stopsModel.push(dataModel);
			});
			self.obOverlayVisible(true);
			self.normalizeData(stopsModel);
			self.createTripBoundary = createTripBoundary;
			self.initTitle(true);
			self.init(options).then(function()
			{
				self._setTripsByOption(options);
				self.obIsAllCreateFromPoints(options.isAllCreateFromPoints);
				self.studentSelectionCreate(options.isContainsPoints)
				if (data.length == 1)
				{
					self.isCopied(true);
				}
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
				self.show();
				self.obShowPaging(false);
				self.initing = false;
			});
			return self.promise;
		});
	};

	BaseTripStopEditModal.prototype.afterCreateInit = function(isDoorToDoor)
	{
		if (isDoorToDoor)
		{
			this.isDoorToDoor(true);
			this.obSelectedStopType(this.obStopTypes().filter(function(c) { return c.indexOf("Door") >= 0; })[0]);
		} else if (this.obStopTypes().indexOf(this.copyBoundariesText) >= 0)
		{
			this.obSelectedStopType(this.copyBoundariesText);
		} else
		{
			this.setLastStopBoundaryType();
		}
	};

	BaseTripStopEditModal.prototype.addOverlayToPanels = function()
	{
		var panels = this.element.closest(".map-page").find(".routingmap_panel");
		panels.each(function(index, panel)
		{
			var overlay = $("<div class='overlay'></div>");
			overlay.css({ "position": "absolute", "z-index": 100, "top": 0, "left": 0, "right": 0, "bottom": 0, "cursor": "default" });
			$(panel).append(overlay);
		});
	};

	BaseTripStopEditModal.prototype.removeOverlayToPanels = function()
	{
		// this.element.closest(".map-page").find(".routingmap_panel>.overlay").remove();
	};

	BaseTripStopEditModal.prototype.computeObStopTypes = function()
	{
		var types = this.singleTypes;
		if (this.obIsMultipleCreate())
		{
			types = this.multipleTypes;
		}
		if ((this.obIsSelectionCreate() || this.obIsStopSearchCreate()) && !this.obIsAllCreateFromPoints())
		{
			var doorToDoorIndex = types.indexOf("Door-to-Door");
			types = types.slice(0, doorToDoorIndex).concat([this.copyBoundariesText]).concat(types.slice(doorToDoorIndex, types.length));
		}
		if (this.isNewStop())
		{
			types = types.concat(['None']);
		}
		return types;
	};

	BaseTripStopEditModal.prototype.isCreateUseLastSetting = function(isCopied, isDoorToDoor, tryUseLastSettings)
	{
		if (isCopied || isDoorToDoor || !this.lastCreateData)
		{
			return false;
		}

		return !!tryUseLastSettings;
	};

	BaseTripStopEditModal.prototype.createUseLastSetting = function(data)
	{
		var self = this;
		var dataModel = $.extend(self.getDataModel(), this.lastCreateData, data);
		self.normalizeData(dataModel);
		self._create().then(function()
		{
			self.dataModel.viewModel.drawTool._previewLayer.removeAll();
		});
		self.promise = new Promise(function(resolve, reject) { self.resolve = resolve; self.reject = reject; });
		return self.promise;
	};

	/**
	* this is the enter to open edit boundary modal
	*/
	BaseTripStopEditModal.prototype.showEditModal = function(editData)
	{
		var self = this;

		return self.beforeChangeData().then(function()
		{
			self.obOverlayVisible(false);
			self.removeOverlayToPanels();
			var dataPromise;
			if (editData)
			{
				dataPromise = Promise.resolve(editData);
			} else
			{
				dataPromise = self.getAllHighlight();
			}
			dataPromise.then(function(data)
			{
				if (!data || data.length === 0)
				{
					return Promise.resolve();
				}
				self.initing = true;
				self.normalizeData(data);
				self.initTitle(false, data[0].OpenType);
				self.init().then(function()
				{
					self.show();
					self.showCurrentData();
					self.initing = false;
				});
			});
		});
	};

	BaseTripStopEditModal.prototype.initValidation = function()
	{
		var self = this;
		setTimeout(function()
		{
			self._setValidation();
		});
	};

	BaseTripStopEditModal.prototype._setValidation = function()
	{
		var self = this;
		self.$form = $(self.element);
		var validatorFields = {},
			isValidating = false;

		if (self.$form.data("bootstrapValidator"))
		{
			self.$form.data("bootstrapValidator").destroy();
		}
		validatorFields.street = {
			trigger: "blur change",
			validators: {
				notEmpty: {
					message: "required"
				}
			}
		};
		validatorFields.walkoutDistance = {
			trigger: "blur change",
			validators: {
				notEmpty: {
					message: "required"
				},
				greaterThan: {
					value: 0,
					message: " must be > 0",
					inclusive: false
				},
				lessThan: {
					value: BaseTripStopEditModal.unitMax(self.type == "trialStop" ? self.$form.find("[name=distanceUnit]").val() : self.obSelectedDistanceUnit()),
				}
			}
		};
		validatorFields.walkoutBuffer = {
			trigger: "blur change",
			validators: {
				notEmpty: {
					message: "required"
				},
				greaterThan: {
					value: 0,
					message: " must be > 0",
					inclusive: false
				},
				lessThan: {
					value: BaseTripStopEditModal.unitMax(self.type == "trialStop" ? self.$form.find("[name=bufferUnit]").val() : self.obSelectedBufferUnit()),
				}
			}
		};

		self.$form.bootstrapValidator({
			excluded: [":disabled", function(field)
			{
				return field.attr("name") == "walkoutBuffer" && !self.walkoutBufferVisible();
			}],
			live: "enabled",
			message: "This value is not valid",
			fields: validatorFields
		}).on("success.field.bv", function(e, data)
		{
			if (!isValidating)
			{
				isValidating = true;
				self.pageLevelViewModel.saveValidate(data.element);
				isValidating = false;
			}
		});
		self.pageLevelViewModel.load(self.$form.data("bootstrapValidator"));
		if (self.$form.data("bootstrapValidator")) self.$form.data("bootstrapValidator").validate();
	};

	BaseTripStopEditModal.prototype.show = function()
	{
		TF.RoutingMap.BaseEditModal.prototype.show.call(this, arguments);
		this.element.find("[name=street]").focus();
		this.element.find("div.body").scrollTop(0);
	};

	BaseTripStopEditModal.prototype.hide = function()
	{
		this.obVisible(false);
		this.obOverlayVisible(false);
		this.removeOverlayToPanels();
		if (this.$form && this.$form.data("bootstrapValidator"))
		{
			this.$form.data("bootstrapValidator").destroy();
		}
		this.onCloseEditModalEvent.notify();
		this.viewModel._viewModal.onStopEditingEvent.notify();
	};

	BaseTripStopEditModal.prototype.getAllHighlight = function()
	{
		return [];
	};

	BaseTripStopEditModal.prototype.showCurrentData = function()
	{
		var self = this;
		var data = this.data[this.obCurrentPage()];
		if (!data)
		{
			return;
		}
		self.isReadOnly(data.OpenType === "View" || !tf.authManager.isAuthorizedFor('routingMap', ['add', 'edit']));
		self.bindCurrentToObDataModel();
		self.obShowPaging(self.data.length > 1);
		if (self.isJunction())
		{
			self.obDataModel.vehicleCurbApproach(0);
		}
		setTimeout(function()
		{
			self.initValidation();
		}, 50);
	};

	BaseTripStopEditModal.prototype.initTitle = function()
	{
	};

	BaseTripStopEditModal.prototype.applyClick = function()
	{
		var self = this;
		var drawTool = self.dataModel.viewModel.drawTool;
		self.save().then(function(result)
		{
			if (result)
			{
				if (drawTool._newTripStopGraphic && self.data.length == 1 && !$.isArray(drawTool._newTripStopGraphic))
				{
					drawTool._newTripStopGraphic.geometry = self.data[0].geometry;
				}
				drawTool.stopTool.clearCandidateGraphics();
				self.hide();
			}
		});
		self.lastStopBoundaryTypeSave();
		//drawTool._previewLayer.removeAll();
	};

	BaseTripStopEditModal.prototype.cancelClick = function(modal, e)
	{
		e.stopPropagation();
		var self = this;
		var data = this.data;
		var confirmPromise = Promise.resolve(true);

		if (this.mode() == "new")
		{
			confirmPromise = tf.promiseBootbox.yesNo("Are you sure you want to cancel?", "Confirmation Message");
		} else
		{
			var dataSame = self._compareArrayObject(this.original, data);
			if (!dataSame)
			{
				confirmPromise = tf.promiseBootbox.yesNo("There are unsaved changes.  Are you sure you want to cancel?", "Unsaved Changes");
			}
		}

		confirmPromise.then(function(result)
		{
			if (result === true)
			{
				self.pageLevelViewModel.clearError();
				self.hide();
				if (self.dataModel.viewModel.drawTool)
				{
					self.dataModel.viewModel.drawTool._previewLayer.removeAll();
					self.dataModel.viewModel.drawTool._clearTempDrawing();
				}
				self.dataModel.viewModel.drawTool.stopTool.clearCandidateGraphics();
				if (self.viewModel._viewModal.mode === 'Routing-Create')
				{
					self.dataModel.viewModel.drawTool.create("point");
				}
				self.resolve();
			}
		});
	};

	BaseTripStopEditModal.prototype.createData = function()
	{
		this.hide();
		this._create();
		if (this.data.length == 1)
		{
			this.lastCreateData = this.data[0];
		}
	};

	BaseTripStopEditModal.prototype.updateData = function()
	{
		var data = this.trimStringSpace(this.data);
		this._update(data);
		this.resolve(data);
	};

	BaseTripStopEditModal.prototype.save = function()
	{
		var self = this;
		self.data.forEach(function(stop)
		{
			if (stop.isFromDTD)
			{
				if (self.obSelectedStopType() != "Door-to-Door")
				{
					delete stop.isFromDTD;
				}
			}
		})
		self.data = self.data.filter(function(trip)
		{
			return trip.OpenType !== "View";
		});
		if (self.data.length == 0)
		{
			return Promise.resolve(true);
		}
		return self.pageLevelViewModel.saveValidate().then(function(result)
		{
			if (result)
			{
				self.bindWalkOutData();
				if (self.mode() == "new")
				{
					self.createData();
				}
				else
				{
					self.updateData();
				}
				self.pageLevelViewModel.clearError();
			}
			return result;
		});
	};

	BaseTripStopEditModal.prototype.bindWalkOutData = function()
	{
		var self = this;
		this.data.forEach(function(d)
		{
			d.walkoutBuffer = self.walkoutBuffer();
			d.walkoutDistance = self.walkoutDistance();
			d.distanceUnit = self.obSelectedDistanceUnit();
			d.bufferUnit = self.obSelectedBufferUnit();
		});
		self.saveWalkoutData(this.data[0]);
	};

	BaseTripStopEditModal.prototype.saveWalkoutData = function(data)
	{

	}

	BaseTripStopEditModal.prototype._bindParamsChange = function(elem, param)
	{
		var self = this;
		self.element.find(elem).bind("change", function()
		{
			if (param == "vehicleCurbApproach")
			{
				tf.storageManager.save(self.data[0].type + "-vehicleCurbApproach", self.data[0].vehicleCurbApproach);
				return;
			}

			if (param == "SmartSequence")
			{
				if (this.mode() !== 'edit')
				{
					self.dataModel.setSmartSequenceSetting(self.obIsSmartSequence());
				}
				return;
			}

			if (param == "IncludeNoStudStop")
			{
				tf.storageManager.save(self.data[0].type + "-IncludeNoStudStop", self.data[0].IncludeNoStudStop);
				return;
			}

			if (param != "stopType" && (self.obIsMultipleCreate() || self.obIsSelectionCreate() || self.obIsSearchCreate())) return;
			self.data = self.data.filter(function(trip)
			{
				return trip.OpenType !== "View";
			});
			var modifyData = self.data;
			for (var key in modifyData)
			{
				if (param == "ShowWalkout")
				{
					if (self.showWalkout())
					{
						self.dataModel.viewModel.drawTool._tempWalkoutLayer.visible = true;
						self.dataModel.viewModel.drawTool._previewLayer.visible = true;
					} else
					{
						self.dataModel.viewModel.drawTool._tempWalkoutLayer.visible = false;
						self.dataModel.viewModel.drawTool._previewLayer.visible = false;
					}
				}
				if (!self.showWalkout() || !self.isNoWalkoutType())
				{
					this.removeWalkoutGuideOnMap();
					return;
				}
				let hasWalkoutGuideOnMap = self.hasWalkoutGuideOnMap();
				if (param == "stopType" && hasWalkoutGuideOnMap)
				{
					return;
				}
				var data = modifyData[key];
				data.Distance = param == "Distance" ? parseFloat($(elem)[0].value) : self.walkoutDistance();
				data.DistanceUnit = self.obSelectedDistanceUnit();

				var exist = Enumerable.From(self.dataModel.all).Any(function(c) { return c.id == data.id; });
				if (!exist)
				{
					self._updateFirstCreate([data], self.showWalkout() && !hasWalkoutGuideOnMap);
				}
			}
		}.bind(self));
	};

	BaseTripStopEditModal.prototype.hasWalkoutGuideOnMap = function()
	{
		return this.dataModel.viewModel.drawTool.stopPreviewTool._previewLayer.graphics.items.filter((graphic) =>
		{
			return graphic.geometry.type != "point";
		}).length > 0;
	};

	BaseTripStopEditModal.prototype.removeWalkoutGuideOnMap = function()
	{
		var previewLayer = this.dataModel.viewModel.drawTool.stopPreviewTool._previewLayer;
		previewLayer.removeAll(previewLayer.graphics.items.filter((graphic) =>
		{
			return graphic.geometry.type != "point";
		}));
	};

	BaseTripStopEditModal.prototype._updateFirstCreate = function(modifyData, isShow)
	{
		var self = this;
		var data = modifyData[0];
		if (self._isWalkoutValid(data.Distance,
			self.obSelectedDistanceUnit(),
			self.walkoutBuffer(),
			self.obSelectedBufferUnit(),
			this.walkoutType()))
		{
			if (isShow)
			{
				return self.dataModel.onTrialStopWalkoutPreviewChange.notify({
					add: modifyData,
					delete: [],
					edit: []
				});
			}
			var walkoutPromise = self.dataModel.viewModel.drawTool.stopTool.generateWalkoutZone(new tf.map.ArcGIS.Graphic(data.geometry),
				data.Distance,
				self.obSelectedDistanceUnit(),
				self.walkoutBuffer(),
				self.obSelectedBufferUnit(),
				this.walkoutType());
			walkoutPromise.then(function(result)
			{
				data.walkoutGuide = { geometry: result.walkoutGuide };
				data.boundary = result.walkoutZone;
				self.dataModel.onTrialStopWalkoutPreviewChange.notify({
					add: [],
					delete: [],
					edit: [data]
				});
			});
		}
	};

	BaseTripStopEditModal.prototype._isWalkoutValid = function(distance, distanceUnit, buffer, bufferUnit, walkoutType)
	{
		if (walkoutType == 1) return true;
		if (distance == 0) return false;
		if (buffer == 0) return false;
		// large distance will take a long time to calculate.
		if ((distance > BaseTripStopEditModal.unitMax(distanceUnit)) || (buffer > BaseTripStopEditModal.unitMax(bufferUnit))) return false;
		return true;
	};

	BaseTripStopEditModal.unitMax = function(unit)
	{
		switch (unit)
		{
			case "meters":
				return 10000;
			case "miles":
				return 6.21;
			case "feet":
				return 32808.4;
			case "kilometers":
				return 10;
			case "yards":
				return 10936.13;
		}
	};

	BaseTripStopEditModal.prototype.lastStopBoundaryTypeSave = function()
	{
		let self = this;
		if (self.userPreferenceDefaultStopBoundaryType)
		{
			const key = self.userPreferenceDefaultStopBoundaryType();
			const value = self.obSelectedStopType();
			tf.userPreferenceManager.save(key, value);
		}
	};

	BaseTripStopEditModal.prototype.setLastStopBoundaryType = function()
	{
		var defaultStopBoundaryType = this.getLastStopBoundaryType();
		if (defaultStopBoundaryType && this.obStopTypes().indexOf(defaultStopBoundaryType) >= 0)
		{
			this.obSelectedStopType(defaultStopBoundaryType);
		}
	};

	BaseTripStopEditModal.prototype.getLastStopBoundaryType = function()
	{
		let self = this;
		//init keys 
		self.initUserPreferenceKey();
		//set obSelectedStopType value if defaultStopBoundaryType is not null
		var userPreferenceData = self.getUserPreferenceData();
		const defaultStopBoundaryType = userPreferenceData.defaultStopBoundaryType;
		return defaultStopBoundaryType;
	};

	BaseTripStopEditModal.prototype.draggable = function()
	{
		TF.RoutingMap.BaseEditModal.prototype.draggable.call(this, ".resizable-doc");
	};
})();