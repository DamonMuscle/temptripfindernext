(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").TrialStopEditModal = TrialStopEditModal;

	function TrialStopEditModal(viewModel)
	{
		TF.RoutingMap.RoutingPalette.BaseFieldTripStopEditModal.call(this, viewModel.parentViewModel, "workspace/RoutingMap/RoutingMapPanel/RoutingPalette/EditTrialStop");
		this.dataModel = viewModel.dataModel;
		this.obDataModel = this.createObservableDataModel(this.getDataModel());
		this.color = ko.observable("#0000ff");
		this.bindTag = false;
		this.dataModel.highlightChangedEvent.subscribe(this.onHighLightChangedEvent.bind(this));
		this.isDoorToDoor = ko.observable(false);
		this.type = "trialStop";
	}

	TrialStopEditModal.prototype = Object.create(TF.RoutingMap.RoutingPalette.BaseFieldTripStopEditModal.prototype);
	TrialStopEditModal.prototype.constructor = TrialStopEditModal;

	TrialStopEditModal.prototype.init = function(options)
	{
		var self = this;
		TF.RoutingMap.RoutingPalette.BaseFieldTripStopEditModal.prototype.init.call(self, options);
		self.isDoorToDoor(false);
		if (!self.bindTag)
		{
			self._bindParamsChange("#WalkoutDistanceBox", "Distance");
			self._bindParamsChange("#WalkoutBufferBox", "Buffer");
			self._bindParamsChange("#WalkoutDistanceUnitBox", "DistanceUnit");
			self._bindParamsChange("#WalkoutBufferUnitBox", "BufferUnit");
			self._bindParamsChange("input[type=radio][name=walkoutType]", "WalkoutType");
			self._bindParamsChange("input[type=checkbox][name=prohibitCrosser]", "ProhibitCrosser", true);
			self.bindTag = true;
		}
		return Promise.resolve();
	};

	TrialStopEditModal.prototype.create = function(data, createTripBoundary)
	{
		var self = this;
		self.createTripBoundary = createTripBoundary;
		if (data && !$.isArray(data))
		{
			data = [data];
		}
		if (data.length == 0)
		{
			return Promise.resolve();
		}
		if (self.isCreateUseLastSetting() && data.length == 1)
		{
			return self.createUseLastSetting(data);
		}
		self.initing = true;
		var dataModel = [];
		data.forEach(function(d)
		{
			dataModel.push($.extend(self.getDataModel(), d));
		});
		self.addOverlayToPanels();
		self.normalizeData(dataModel);
		self.initTitle(true);
		self.init().then(function()
		{
			if (data.length == 1) self.isDoorToDoor(data[0].isDoorToDoor);
			self.showCurrentData();
			self.initing = false;
			self.show();
		});
		return self.promise;
	};

	TrialStopEditModal.prototype._bindParamsChange = function(elem, param)
	{
		var self = this;
		$(elem).bind("change", function(e)
		{
			self.data = self.data.filter(function(trip)
			{
				return trip.OpenType !== "View";
			});
			var modifyData = self.data;
			if (self.mode() == "edit")
			{
				modifyData = [self.data[self.obCurrentPage()]];
			}

			if (["distanceUnit", "bufferUnit"].indexOf($(e.target).attr("name")) >= 0)
			{
				self._setValidation();
			}

			for (var key in modifyData)
			{
				var data = modifyData[key];
				if (data.isDoorToDoor) return;
				if (param != "ProhibitCrosser")
				{
					data[param] = $(elem)[0].value ? parseFloat($(elem)[0].value) : self.obDataModel[param]();
				}
				var exist = Enumerable.From(self.dataModel.all).Any(function(c) { return c.id == data.id; });
				if (exist)
				{
					self._updateForEdit(data);
				} else
				{
					self._updateFirstCreate(data);
				}
			}
		});
	};

	TrialStopEditModal.prototype.getDataModel = function()
	{
		return this.dataModel.getTrialStopDataModel();
	};

	TrialStopEditModal.prototype.initTitle = function(isNew)
	{
		TF.RoutingMap.BaseEditModal.prototype.initTitle.call(this, isNew, "Trial Stop");
	};

	TrialStopEditModal.prototype._create = function()
	{
		var self = this,
			promises = [];
		self.data.forEach(function(stop)
		{
			if (stop.isDoorToDoor)
			{
				// var polygon = new tf.map.ArcGIS.Polygon(tf.map.ArcGIS.SpatialReference(102100));
				// var rings = stop.walkoutZone.rings.toJSON();
				// rings.forEach(function(ring) { polygon.addRing(ring); });
				// promises.push(new Promise(function(resolve) { resolve({ walkoutZone: new tf.map.ArcGIS.Graphic(polygon) }); }).then(function(result)
				// {
				var tripBoundary = stop.walkoutZone;
				if (tripBoundary)
				{
					var data = self.trimStringSpace(stop);
					data.boundary = {
						OBJECTID: 0,
						type: "trialStopBoundary",
						geometry: tripBoundary.geometry || tripBoundary,
						id: TF.createId(),
					};
					data.Color = stop.Color;
					self.dataModel.create(data);
				}
				return tripBoundary;
				// }));
			} else
			{
				stop.Distance = self.data[0].Distance;
				stop.DistanceUnit = self.data[0].DistanceUnit;
				stop.Buffer = self.data[0].Buffer;
				stop.BufferUnit = self.data[0].BufferUnit;
				stop.WalkoutType = self.data[0].WalkoutType;
				stop.Color = self.data[0].Color;
				var currentTravelSCenario = self.dataModel._viewModal.travelScenariosPaletteViewModel.travelScenariosViewModel.obSelectedTravelScenarios();
				promises.push(self.createTripBoundary(
					stop,
					stop.Distance,
					stop.DistanceUnit,
					stop.Buffer,
					stop.BufferUnit,
					stop.WalkoutType,
					stop.Color,
					null,
					null,
					currentTravelSCenario)
					.then(function(result)
					{
						var data = self.trimStringSpace(stop);
						data.Color = stop.Color;
						if (!result)
						{
							self.dataModel.create(data);
						} else
						{
							var tripBoundary = result.walkoutZone;
							var tripBoundaryGuide = result.walkoutGuide;
							if (tripBoundary)
							{
								data.boundary = {
									OBJECTID: 0,
									type: "trialStopBoundary",
									geometry: tripBoundary.geometry,
									id: tripBoundary.attributes.id,
								};
								if (tripBoundaryGuide)
								{
									data.walkoutGuide = {
										geometry: tripBoundaryGuide,
									};
								}
								self.dataModel.create(data);
							}
						}
						return tripBoundary;
					}));
			}

		});

		return Promise.all(promises).then(function(data)
		{
			self.resolve(data);
		}, function()
		{
			self.resolve(false);
		});
	};

	TrialStopEditModal.prototype._update = function(modifyData)
	{
		var self = this;
		self.dataModel.update(modifyData);
	};

	TrialStopEditModal.prototype._updateForEdit = function(data)
	{
		var self = this;
		return self.changeBoundary(data).then(function(result)
		{
			if (result != false)
			{
				self.dataModel.viewModel.drawTool._updateTrialStop(data);
			}
		});
	};

	TrialStopEditModal.prototype._updateFirstCreate = function(data)
	{
		var self = this;
		if (self._isWalkoutValid(data.Distance,
			data.DistanceUnit,
			data.Buffer,
			data.BufferUnit,
			data.WalkoutType))
		{
			return self.changeBoundary(data).then(function(result)
			{
				if (result != false)
				{
					self.dataModel.onTrialStopWalkoutPreviewChange.notify({
						add: [],
						delete: [],
						edit: [data]
					});
				}
			});
		}

	};

	TrialStopEditModal.prototype.changeBoundary = function(data)
	{
		var self = this;
		var valid = data.Distance > 0 && data.Buffer > 0;
		if (valid)
		{
			data.ProhibitCrosser = self.obDataModel.ProhibitCrosser();

			var walkoutPromise = self.dataModel.viewModel.drawTool.stopTool.generateWalkoutZone(new tf.map.ArcGIS.Graphic(data.geometry), data.Distance, data.DistanceUnit, data.Buffer,
				data.BufferUnit, data.WalkoutType, data.Color, true);
			return walkoutPromise.then(function(result)
			{
				data.walkoutGuide = { geometry: result.walkoutGuide };
				data.boundary.geometry = result.walkoutZone.geometry;
				return self.dataModel.tripDataModel.getUnAssignStudentInBoundaryProhibitCross(data).then(function(students)
				{
					data.studentCount = students.length;
				});
			});
		}
		return Promise.resolve(false);
	};

	TrialStopEditModal.prototype.applyClick = function()
	{
		var self = this;
		var drawTool = self.dataModel.viewModel.drawTool;
		self.save().then(function(result)
		{
			if (result)
			{
				self.hide();
				if (drawTool._newTripStopGraphic && self.data.length == 1)
				{
					if (($.isArray(drawTool._newTripStopGraphic) && drawTool._newTripStopGraphic.length > 0) && !$.isArray(drawTool._newTripStopGraphic))
					{
						drawTool._newTripStopGraphic.geometry = self.data[0].geometry;
					}
				}
				drawTool.stopTool.clearCandidateGraphics();
			}
		});
		drawTool._previewLayer.removeAll();
	};

	TrialStopEditModal.prototype.show = function()
	{
		this.obVisible(true);
		this.element.find("[name=street]").focus();
		this.element.find("div.body").scrollTop(0);
		if (this.data.length == 1) this.isDoorToDoor(this.data[0].isDoorToDoor);
	};

	TrialStopEditModal.prototype.showCurrentData = function()
	{
		var self = this;
		var data = this.data[this.obCurrentPage()];
		this.isDoorToDoor(data.isDoorToDoor);
		self.isReadOnly(data.OpenType === "View");
		for (var key in self.obDataModel)
		{
			if (ko.isObservable(self.obDataModel[key]))
			{
				self.obDataModel[key](data[key]);
			}
		}
		self.obShowPaging(self.data.length > 1);
		setTimeout(function()
		{
			self.initValidation();
		}, 50);
	};

	TrialStopEditModal.prototype.cancelClick = function(modal, e)
	{
		var self = this;
		e.stopPropagation();
		var data = this.data;
		var confirmPromise = Promise.resolve(true);
		var dataSame = self._compareArrayObject(this.original, data);
		if (!dataSame)
		{
			confirmPromise = tf.promiseBootbox.yesNo("There are unsaved changes.  Are you sure you want to cancel?", "Unsaved Changes");
		}
		confirmPromise.then(function(result)
		{
			if (result == true)
			{
				self.pageLevelViewModel.clearError();
				self.hide();
				self.resolve();
				if (self.mode() == "edit")
				{
					self.revertChange();
				}
				if (self.dataModel.viewModel.drawTool)
				{
					self.dataModel.viewModel.drawTool._previewLayer.removeAll();
				}
				self.dataModel.viewModel.drawTool.stopTool.clearCandidateGraphics();
			}
		});
	};

	TrialStopEditModal.prototype.revertChange = function()
	{
		var self = this;
		this.data.forEach(function(data)
		{
			var trialStop = self.dataModel.findById(data.id);
			self.dataModel.viewModel.drawTool._updateTrialStop(trialStop);
		});
	};

	TrialStopEditModal.prototype.getAllHighlight = function()
	{
		return Promise.resolve(this.dataModel.highlighted);
	};

})();