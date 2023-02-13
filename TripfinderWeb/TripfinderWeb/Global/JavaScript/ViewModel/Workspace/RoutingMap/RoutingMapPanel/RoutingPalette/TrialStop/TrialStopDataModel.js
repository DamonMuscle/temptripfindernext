(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").TrialStopDataModel = TrialStopDataModel;

	function TrialStopDataModel(viewModel)
	{
		TF.RoutingMap.BaseMapDataModel.call(this, viewModel.parentViewModel._viewModal, viewModel, "TrialStop");
		var self = this;
		self.routeState = viewModel.viewModel._viewModal.routeState;
		self.viewModel = viewModel;
		self.tripDataModel = viewModel.tripDataModel;
		self.tripDataModel.onCandidatesStudentsChangeToMapEvent.subscribe(this.onCandidatesStudentsChangeEvent.bind(this));
		self.settingChangeEvent = new TF.Events.Event();
		self.studentUpdateEvent = new TF.Events.Event();
		self.onTrialStopWalkoutPreviewChange = new TF.Events.Event();
	}

	TrialStopDataModel.prototype = Object.create(TF.RoutingMap.BaseMapDataModel.prototype);
	TrialStopDataModel.prototype.constructor = TrialStopDataModel;

	TrialStopDataModel.prototype.initRevertForModifyData = function()
	{
	};

	TrialStopDataModel.prototype.create = function(newData)
	{
		var self = this;
		self._viewModal.revertMode = "create-TrialStop";
		self._viewModal.revertData = [];
		var data = self.getTrialStopDataModel();
		for (var key in newData)
		{
			data[key] = newData[key];
		}

		if (data.id == 0)
		{
			data.id = TF.createId();
		}

		self.updateStudent(data).then(function()
		{
			data.boundary.id = data.id;
			self.all.push(data);
			self.insertToRevertData(data);
			self.onAllChangeEvent.notify({
				add: [data],
				delete: [],
				edit: []
			});
			// self.continueDrawToCreate();
			return Promise.resolve(data);
		});
		//self.calcSelfChangeCount();
	};

	// TrialStopDataModel.prototype.continueDrawToCreate = function()
	// {
	// 	var self = this;
	// var lastModeIsCreateTrialStop = self._viewModal.mode.indexOf("TrialStop-Create") >= 0;
	// if (lastModeIsCreateTrialStop)
	// {
	// setTimeout(function()
	// {
	// 	self.viewModel.eventsManager.startDrawToCreate();
	// });
	// } else
	// {
	// 	if (self._viewModal.mode.indexOf("TrialStop-Edit") < 0)
	// 	{
	// self.viewModel.drawTool.stop();
	// }
	// }
	// };

	TrialStopDataModel.prototype.update = function(modifyData)
	{
		var self = this;

		var dataArray = $.isArray(modifyData) ? modifyData : [modifyData];
		dataArray.forEach(function(data)
		{
			var trialStop = self.findById(data.id);
			var promise = Promise.resolve();
			var isBoundaryChange = self.isBoundaryChange(data, trialStop);
			$.extend(trialStop, data, { Students: trialStop.Students });

			if (isBoundaryChange)
			{
				promise = self.viewModel.drawTool.stopTool.generateWalkoutZone(new tf.map.ArcGIS.Graphic(data.geometry), data.Distance, data.DistanceUnit, data.Buffer,
					data.BufferUnit, data.WalkoutType, data.Color, true);
				promise.then(function(result)
				{
					trialStop.walkoutGuide = { geometry: result.walkoutGuide };
					trialStop.boundary.geometry = result.walkoutZone.geometry;
				});
			}

			promise.then(function()
			{
				self.updateStudent(trialStop).then(function()
				{
					self.onAllChangeEvent.notify({
						add: [],
						delete: [],
						edit: [trialStop]
					});
					self.highlightChangedEvent.notify(self.highlighted);
				});
			});
		});
		//self.calcSelfChangeCount();
	};

	TrialStopDataModel.prototype.isBoundaryChange = function(data, original)
	{
		return data.WalkoutType != original.WalkoutType ||
			data.ProhibitCrosser != original.ProhibitCrosser ||
			data.Distance != original.Distance ||
			data.DistanceUnit != original.DistanceUnit ||
			data.Buffer != original.Buffer ||
			data.BufferUnit != original.BufferUnit;
	};

	TrialStopDataModel.prototype.updateStudent = function(data)
	{
		var self = this;

		return self.tripDataModel.getUnAssignStudentInBoundaryProhibitCross(data).then(function(students)
		{
			data.Students = students;
			data.studentCount = students.length;
			self.studentUpdateEvent.notify({
				add: [],
				delete: [],
				edit: [data]
			});
		});
	};

	TrialStopDataModel.prototype.delete = function(deleteArray)
	{
		var self = this;
		self._viewModal.revertMode = "delete-TrialStop";
		self._viewModal.revertData = [];
		deleteArray.forEach(function(data)
		{
			self.all = self.all.filter(function(c)
			{
				return c.id != data.id;
			});
			self.insertToRevertData(data);
			self.onAllChangeEvent.notify({
				add: [],
				delete: [data],
				edit: []
			});
		});
		self.refreshSelectAndHighlighted();
		return Promise.resolve(deleteArray);
	};

	TrialStopDataModel.prototype.findTrialStopIncludeStudent = function(student)
	{
		var self = this;
		for (var i = 0; i < self.all.length; i++)
		{
			if (tf.map.ArcGIS.geometryEngine.intersects(student.geometry, self.all[i].boundary.geometry))
			{
				return self.all[i];
			}
		}
	};

	TrialStopDataModel.prototype.onCandidatesStudentsChangeEvent = function()
	{
		var self = this;
		if (self.all && self.all.length > 0)
		{
			var promises = [];
			self.all.forEach(function(stop)
			{
				promises.push(self.updateStudent(stop));
			});
			Promise.all(promises).then(function()
			{
				self.onAllChangeEvent.notify({
					add: [],
					delete: [],
					edit: self.all
				});
			});
		}
	};

	TrialStopDataModel.prototype.close = function()
	{
		var layers = this.viewModel.getLayers();
		this._viewModal.setMode("TrialStop", "Normal");
		this.viewModel.editModal.closeEditModal();
		this.all = [];
		if (this.viewModel.parentViewModel.showCount == 0)
		{
			layers.forEach(function(item)
			{
				item.removeAll();
			});
		}
		this.viewModel.display.clear();
		return Promise.resolve(true);
	};

	TrialStopDataModel.prototype.getTrialStopDataModel = function()
	{
		return {
			id: 0,
			WalkoutType: 0,
			Street: "",
			City: "",
			type: "trialStop",
			Distance: 100,
			DistanceUnit: "meters",
			ProhibitCrosser: 0,
			Buffer: 30,
			BufferUnit: "meters",
			Color: "#0000ff",
			path: {},
			boundary: {},
			studentCount: 0
		};
	};

	TrialStopDataModel.prototype.sortSelected = function(source)
	{
		return source.sort(function(a, b)
		{
			return TF.compareOnProperty(a, b, "Street");
		});
	};

	TrialStopDataModel.prototype.getSetting = function(routeState, noPromise)
	{
		var self = this;
		return TF.RoutingMap.BaseMapDataModel.prototype.getSetting.call(self, routeState, noPromise).then(function(setting)
		{
			var defaultSetting = self.getStorage();
			if (!setting.walkoutDistance || setting.walkoutDistance <= 0)
			{
				setting.walkoutDistance = defaultSetting.walkoutDistance.default;
			}

			if (!setting.walkoutBuffer || setting.walkoutBuffer <= 0)
			{
				setting.walkoutBuffer = defaultSetting.walkoutBuffer.default;
			}

			return setting;
		});
	};

	TrialStopDataModel.prototype.getStorage = function()
	{
		return {
			prohibitCrosser: { key: "prohibitCrosserTrialStop", default: false },
			walkoutType: { key: "walkoutTypeTrialStop", default: 0 },
			walkoutDistance: { key: "walkoutDistanceTrialStop", default: 1000 },
			walkoutDistanceUnit: { key: "walkoutDistanceUnitTrialStop", default: "feet" },
			walkoutBuffer: { key: "walkoutBufferTrialStop", default: 200 },
			walkoutBufferUnit: { key: "walkoutBufferUnitTrialStop", default: "feet" },
		};
	};

	TrialStopDataModel.prototype.dispose = function()
	{
		this.all = [];
	};
})();