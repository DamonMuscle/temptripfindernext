(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").UnassignedStudentEventsManager = UnassignedStudentEventsManager;

	function UnassignedStudentEventsManager(viewModel)
	{
		var self = this;
		TF.RoutingMap.RoutingPalette.BaseRoutingEventsManager.call(this, viewModel, viewModel.viewModel._viewModal);
		self.dataModel = self.viewModel.dataModel;
		self._viewModal = self.viewModel.viewModel._viewModal;
		self.obHighlighted = ko.observable(false);
		self.dataModel.highlightChangedEvent.subscribe(this.onHighlightChanged.bind(this));
		self.selectionChange = this.selectionChange.bind(this);
		self.createDoorToDoorStopClick = self.createDoorToDoorStopClick.bind(this);
		self.centerMapClick = self.centerMapClick.bind(this);
		self.obMode = ko.observable();
		self.obRefreshDisabled = ko.observable(true);
		self.dataModel.tripDataModel.onTripsChangeEvent.subscribe(self.onTripsChangeEvent.bind(self));
		self.requireDetails = new TF.Events.Event();
	}

	UnassignedStudentEventsManager.prototype = Object.create(TF.RoutingMap.RoutingPalette.BaseRoutingEventsManager.prototype);
	UnassignedStudentEventsManager.prototype.constructor = UnassignedStudentEventsManager;

	UnassignedStudentEventsManager.prototype.onHighlightChanged = function()
	{
		this.obHighlighted(this.dataModel.highlighted.length > 0);
	};

	UnassignedStudentEventsManager.prototype.selectAreaOptionClick = function(type)
	{
		var self = this;
		self.viewModel.drawTool.select(type);
		PubSub.publish("clear_ContextMenu_Operation");
	};

	UnassignedStudentEventsManager.prototype.menuInfoClick = function()
	{
		let studentIds = this.dataModel.highlighted.map(i => i.id);
		this.requireDetails.notify({ dataType: "student", ids: studentIds });
	};

	UnassignedStudentEventsManager.prototype.removeFromMapClick = function()
	{
		var self = this, routingDataModel = self.dataModel.tripDataModel;
		// filter out original assigned, but not saved yet students.
		var originalStudents = [];
		routingDataModel.trips.forEach(function(trip)
		{
			originalStudents = originalStudents.concat(trip.originalStudents || []);
		});
		var removedStudents = self.dataModel.highlighted.filter(function(h) { return originalStudents.filter(function(student) { return student.RequirementID == h.RequirementID; }).length == 0; });
		var removedIds = removedStudents.map(function(item) { return item.RequirementID; });

		routingDataModel.removedCandidateIds = Enumerable.From(self.dataModel.tripDataModel.removedCandidateIds.concat(removedIds)).Distinct().ToArray();

		// refresh candidate students.
		routingDataModel.candidateStudents = routingDataModel.removeRemovedCandidate(routingDataModel.candidateStudents);
		routingDataModel.routingStudentManager.refresh();
		routingDataModel.routingStudentManager.refreshStudentLock();

		routingDataModel.onStopCandidateStudentChangeEvent.notify({ add: [], edit: [], delete: removedStudents });
		if (removedStudents.length < self.dataModel.highlighted.length)
		{
			var unsavedStudentCount = self.dataModel.highlighted.length - removedStudents.length;
			tf.promiseBootbox.alert((unsavedStudentCount == 1 ? "1 student" : unsavedStudentCount + " students") + " can not be removed!");
		}
	};

	UnassignedStudentEventsManager.prototype.refreshClick = function()
	{
		var self = this;
		self.dataModel.tripDataModel.removedCandidateIds = [];
		self.dataModel.tripDataModel.refreshCandidateStudent();
	};

	UnassignedStudentEventsManager.prototype.selectionChange = function(e, selectedIds)
	{
		this.dataModel.setSelected(selectedIds);
		this.dataModel.setHighlighted(selectedIds);
	};

	UnassignedStudentEventsManager.prototype.settingsClick = function()
	{
		tf.modalManager.showModal(new TF.RoutingMap.RoutingPalette.UnassignedStudentSettingsModalViewModel(this.dataModel));
	};

	UnassignedStudentEventsManager.prototype.centerMapClick = function(modal, e)
	{
		e.stopPropagation();
		var self = this;
		var map = this._viewModal._map;
		if (modal && modal.geometry)
		{
			TF.Helper.MapHelper.centerAndZoom(map, modal.geometry, 18);
			return;
		}
		var geometries = this.dataModel.highlighted.map(function(item)
		{
			return item.geometry;
		});
		if (geometries.length == 0)
		{
			TF.RoutingMap.EsriTool.centerMultipleItem(map, self.dataModel.all.filter(function(item) { return item.XCoord; }));
		} else
		{
			TF.RoutingMap.EsriTool.centerMultipleItem(map, geometries);
		}
	};

	UnassignedStudentEventsManager.prototype.selectAllClick = function()
	{
		var data = this.dataModel.selected.map(function(d) { return d.key; });
		this.dataModel.setSelected(data);
		this.dataModel.setHighlighted(data);
	};

	UnassignedStudentEventsManager.prototype.deselectAllClick = function()
	{
		this.dataModel.setHighlighted([]);
	};

	UnassignedStudentEventsManager.prototype.clearAllClick = function()
	{
		var selected = this.dataModel.selected;
		var highlighted = Enumerable.From(this.dataModel.highlighted);
		var selectedButNotHighlightIds = selected.filter(function(c)
		{
			return !highlighted.Any(function(t) { return t.id == c.id; });
		}).map(function(c)
		{
			return c.id;
		});
		this.dataModel.setSelected(selectedButNotHighlightIds);
		this.dataModel.setHighlighted([]);
	};

	UnassignedStudentEventsManager.prototype.createDoorToDoorStopClick = function(modal)
	{
		var self = this;
		var selected = [];
		if (modal && modal.geometry)
		{
			selected = [modal];
		} else
		{
			selected = self.dataModel.highlighted;
		}
		var tripStops = [];

		if (selected.length == 0)
		{
			return;
		}
		tf.loadingIndicator.showImmediately();
		self._viewModal.setMode("UnassignedStudent", "Create");
		selected = Enumerable.From(selected).Distinct(function(c) { return c.XCoord + "," + c.YCoord; }).ToArray();
		if (selected.length == 1)
		{
			self.viewModel.drawTool.createDoorToDoorStop(selected[0]);
		}
		else
		{
			var geocodeAddressPromises = [];
			for (var i = 0; i < selected.length; i++)
			{
				var geometry = new tf.map.ArcGIS.Point(selected[i].XCoord, selected[i].YCoord, new tf.map.ArcGIS.SpatialReference({ "wkid": 4326 }));
				geometry = tf.map.ArcGIS.webMercatorUtils.geographicToWebMercator(geometry);
				var promise = null;
				if (selected[i].Address && selected[i].Address.length > 0) { promise = Promise.resolve(selected[i].Address.split(",")[0]); }
				else
				{
					promise = self.viewModel.drawTool.stopTool.getStopStreetAddress(geometry);
				}
				geocodeAddressPromises.push(promise);
				tripStops.push({ geometry: geometry, address: "unnamed", type: "student", unassignStudent: selected[i] });

			}
			if (tripStops.length > 0)
			{
				Promise.all(geocodeAddressPromises).then(function(addresses)
				{
					tripStops.forEach(function(stop, index)
					{
						stop.address = addresses[index];
					});
					self.createFromMultiple(tripStops, { isCreateFromUnassignStudent: true });
				})

			}
		}
	};

	UnassignedStudentEventsManager.prototype.onTripsChangeEvent = function()
	{
		this.obRefreshDisabled(this.dataModel.tripDataModel.getEditTrips().length == 0);
	};

	UnassignedStudentEventsManager.prototype.assignStudentsClick = function()
	{
		const routingDataModel = this.dataModel.tripDataModel;

		var studentNames = (students) =>
		{
			return students
				.map(s => `${s.FirstName} ${s.LastName}`)
				.sort((n1, n2) =>
				{
					let a = n1.toLowerCase();
					let b = n2.toLowerCase();
					if (a < b) return -1;
					if (a > b) return 1;
					return 0;
				})
				.join(', ');
		};

		return tf.modalManager.showModal(new TF.RoutingMap.RoutingPalette.AssignStudentsModalViewModel(routingDataModel.getEditTrips()))
			.then(selectedTripStop =>
			{
				if (!selectedTripStop)
				{
					return;
				}

				//assign students to this stop
				let trip = Enumerable.From(routingDataModel.trips).FirstOrDefault(null, function(x)
				{
					return x.id === selectedTripStop.TripId
				});
				const tripStop = Enumerable.From(trip.TripStops).FirstOrDefault(null, function(x)
				{
					return x.id === selectedTripStop.id
				});
				tf.loadingIndicator.showImmediately();
				routingDataModel.assignStudent(this.dataModel.highlighted, tripStop).then(result =>
				{
					routingDataModel.changeDataStack.push(tripStop);
					tf.loadingIndicator.tryHide();
					if (result)
					{
						let message = '';
						if (result.prohibitStudents && result.prohibitStudents.length > 0)
						{
							message += `${studentNames(result.prohibitStudents)} ${result.prohibitStudents.length == 1 ? 'is' : 'are'} not allowed to cross the road.`

						}
						if (result.transStudents && result.transStudents.length > 0)
						{
							message += `${message === '' ? '' : '<br />'}${studentNames(result.transStudents)} ${result.transStudents.length == 1 ? 'is a transfer student' : 'are transfer students'}, cannot be assigned to the stop.`
						}
						if (message != '')
						{
							return tf.promiseBootbox.alert(message, 'Message');
						}
					}
				});
			});
	};
})();