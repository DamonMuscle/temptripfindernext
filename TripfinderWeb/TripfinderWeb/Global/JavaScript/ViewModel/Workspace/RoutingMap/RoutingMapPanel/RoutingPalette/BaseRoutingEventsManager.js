(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").BaseRoutingEventsManager = BaseRoutingEventsManager;

	function BaseRoutingEventsManager(viewModel, viewModal)
	{
		this.viewModel = viewModel;
		this._viewModal = viewModal;
		this.copyFromObject = ko.computed(this.getCopyFrom.bind(this));
		this.fileOpenCompleteEvent = new TF.Events.Event();
	}

	BaseRoutingEventsManager.prototype = Object.create(TF.RoutingMap.EventBase.prototype);
	BaseRoutingEventsManager.prototype.constructor = BaseRoutingEventsManager;

	BaseRoutingEventsManager.prototype.getCopyFrom = function()
	{
		if (this._viewModal.obCopyPointObject())
		{
			var copyFrom = this._viewModal.obCopyPointObject().getData();
			if (copyFrom && copyFrom.boundary && copyFrom.boundary.geometry)
			{
				return copyFrom;
			}
		}
		return null;
	};

	BaseRoutingEventsManager.prototype._createFromSearchResult = function(option)
	{
		var self = this;
		var map = this._viewModal._map;
		var options = {
			onChoseFromFileEvent: self.createChangeEvent.bind(self)
		};
		self.routingSearchViewmodel = new TF.RoutingMap.RoutingPalette.RoutingSearchModalViewModel(map, options);
		return tf.modalManager.showModal(self.routingSearchViewmodel)
			.then(function(data)
			{
				self.createTripStopFromSearchResult(data, option);
			});
	};

	BaseRoutingEventsManager.prototype.createTripStopFromSearchResult = function(data, option)
	{
		var self = this;
		if (!data || data.length == 0)
		{
			return;
		}
		var isCreateFromStopSearch = false;

		if (data[0].type == "tripstop" || data[0].type == "poolStops")
		{
			isCreateFromStopSearch = true;
		}

		if (option && option.operate == 'CreateNewTrip')
		{
			option.isCreateFromStopSearch = isCreateFromStopSearch;
			option.isCreateFromSearch = true;
			return self.createFromMultiple(data, option);
		}
		else
		{
			if (data.length == 1)
			{
				self.createFromSingle(data[0], data[0].geometry, isCreateFromStopSearch, true);
			} else
			{
				self.createFromMultiple(data, {
					isCreateFromStopSearch: isCreateFromStopSearch,
					isCreateFromSearch: true
				});
			}
		}
	};

	BaseRoutingEventsManager.prototype.createFromSingle = function(point, geometry, isCreateFromStopSearch, isCreateFromSearch)
	{
		var self = this;
		var map = this._viewModal._map;
		geometry = geometry ? geometry : TF.xyToGeometry(point.x, point.y);

		self.offsetInsetPoint(point, geometry, point.type).then(function(geometry)
		{
			if (geometry)
			{
				var stopTool = self.viewModel.drawTool.stopTool;
				stopTool.reverseGeocodeStop(point.geometry, point.address).then(function(result)
				{
					self.viewModel.drawTool.drawTempTripStopsOnMap([geometry]);
					if (self.isDoorToDoorType(point.type))
					{
						self.viewModel.drawTool.addStopAddressAndBoundary({ geometry: geometry }, {
							isDoorToDoor: true,
							student: point,
							isCreateFromStopSearch: isCreateFromStopSearch,
							isCreateFromSearch: isCreateFromSearch,
							insertBehindSpecialStop: self.insertBehindSpecialStop,
							streetName: result || "",
							addStopGraphic: false
						});
					}
					else
					{
						self.viewModel.drawTool.addStopAddressAndBoundary({ geometry: geometry },
							{
								isDoorToDoor: false,
								boundary: point.boundary,
								isCreateFromStopSearch: isCreateFromStopSearch,
								isCreateFromSearch: isCreateFromSearch,
								insertBehindSpecialStop: self.insertBehindSpecialStop,
								streetName: result || ""
							});
					}
				});
				map.mapView.goTo(geometry);
			} else
			{
				return tf.promiseBootbox.dialog({
					message: "Stop cannot be created here!",
					title: "Warning",
					closeButton: true,
					buttons: {
						yes: {
							label: "OK",
							className: "btn-primary btn-sm btn-primary-black"
						}
					}
				});
			}
		});
	};

	BaseRoutingEventsManager.prototype.createFromMultiple = function(pointArray, option)
	{
		var self = this,
			points = [],
			extents = [],
			promises = [];
		self.viewModel.drawTool._mode = "createPoint";

		option = option || {};
		pointArray.forEach(function(point)
		{
			point.geometry = point.geometry || TF.xyToGeometry(point.x, point.y);
		});
		var streetPromise = Promise.resolve();
		if (Enumerable.From(pointArray).Any(function(c) { return self.isDoorToDoorType(c.type); }))
		{
			streetPromise = TF.StreetHelper.getStreetInExtent(pointArray.map((c) => { return c.geometry; }), "file");
		}
		return streetPromise.then(function(streets)
		{
			pointArray.forEach(function(point)
			{
				var oldGeometry = point.geometry;
				oldGeometry = new tf.map.ArcGIS.Point(oldGeometry.x, oldGeometry.y, self._viewModal._map.mapView.spatialReference);
				promises.push(self.offsetInsetPoint(point, oldGeometry, point.type, streets).then(function(geometry)
				{
					if (geometry)
					{
						if (self.isDoorToDoorType(point.type))
						{
							var p = $.extend(point, { geometry: geometry, unassignStudent: point.unassignStudent });
							if (option.isCreateFromSearch)
							{
								p = $.extend(point, { geometry: geometry, unassignStudent: point.unassignStudent, sourceStudentGeom: oldGeometry });
							}
							if (!p.unassignStudent) { p.unassignStudent = { geometry: oldGeometry.clone() }; }
							points.push(p);
							extents.push({ geometry: geometry });
						} else
						{
							points.push($.extend(point, { geometry: geometry, boundary: point.boundary }));
							extents.push({ geometry: point.boundary ? point.boundary.geometry : geometry });
						}
					}
				}));
			});

			return Promise.all(promises).then(function()
			{
				tf.loadingIndicator.tryHide();
				if (option && option.operate === 'CreateNewTrip')
				{
					return tf.modalManager.showModal(new TF.RoutingMap.RoutingPalette.NewRoutingTripStopModalViewModel(points, option.trip, self.dataModel))
						.then(function(data)
						{
							if (data)
							{
								return self.dataModel.viewModel.drawTool.stopTool.attachClosetStreetToStop(data).then(function()
								{
									return data;
								}).then(function()
								{
									return self.dataModel.fieldTripStopDataModel.addTripStopsToNewTrip(data, option.trip.TripStops, option.trip);
								}).then(function(trip)
								{
									return Promise.resolve(trip);
								});
							}
						});
				}
				else  
				{
					self.viewModel.drawTool.drawTempTripStopsOnMap(points.map(function(c) { return c.geometry; }));
					self.viewModel.drawTool.stopTool.addMultipleStopAddressAndBoundary(points, option);
				}
			});
		});
	};

	BaseRoutingEventsManager.prototype.isDoorToDoorType = function(type)
	{
		return type == "student" ||
			type == "unassignedStudentsRouting" ||
			type == "addressPoint" ||
			type == "school" ||
			type == "altsite" ||
			type == "georegion" ||
			type == "mapAddress";
	};

	/**
	* only address point need to offset and inset on map
	* if other case and within 1 meter to street and 5 meters to junction, force stop to snap onto the junction
	*/
	BaseRoutingEventsManager.prototype.offsetInsetPoint = function(point, geometry, type, streets)
	{
		if (this.isDoorToDoorType(type))
		{
			return this.viewModel.drawTool.stopTool.getDoorToDoorLocationForStudent({ geometry: point.geometry, address: point.address }, streets);
		}
		else if (type == "addressPoint")
		{
			return Promise.resolve(geometry); //this.viewModel.drawTool.stopTool.offsetInsetPoint(point, geometry);
		}
		else
		{
			return this.viewModel.drawTool.forceStopToJunction(point).then(function(point) { return Promise.resolve(point.geometry) })
		}
	};

	BaseRoutingEventsManager.prototype.createChangeEvent = function(file, param)
	{
		var self = this;
		self.openFile(file, param);
	};

	BaseRoutingEventsManager.prototype.openFile = function(file, param)
	{
		var self = this,
			promise;
		if (typeof (FileReader) == "undefined")
		{
			return tf.promiseBootbox.alert("This browser does not support HTML5.");
		}
		if (/^([a-zA-Z0-9\s_\\.\-\(\):])+(.csv|.txt)$/.test(file.name.toLowerCase()))
		{
			promise = TF.csvToObject(file);
		} else if (/^([a-zA-Z0-9\s_\\.\-\(\):])+(.xlsx|.xls)$/.test(file.name.toLowerCase()))
		{
			promise = TF.excelToObject(file);
		} else
		{
			return self.alertCSVInvalidMessage();
		}
		tf.loadingIndicator.showImmediately();
		promise.then(function(stops)
		{
			self.formatColumnName(stops);
			self.convertXYToGeometry(stops, param).then(function(data)
			{
				try
				{
					self.fileOpenComplete(data);
				} catch
				{
					self.alertCSVInvalidMessage();
				}
			});
			tf.loadingIndicator.tryHide();
		}).catch(() =>
		{
			tf.loadingIndicator.tryHide();
		});
	};

	BaseRoutingEventsManager.prototype.alertCSVInvalidMessage = function()
	{
		return tf.promiseBootbox.alert("Please upload a valid CSV ,xlsx or xls file.");
	};

	BaseRoutingEventsManager.prototype.formatColumnName = function(stops)
	{
		stops.map(function(stop)
		{
			for (var prop in stop)
			{
				if (stop.hasOwnProperty(prop))
				{
					var value = stop[prop];
					delete stop[prop];
					stop[prop.replace(/[ ]+/g, "").replace(/[#]+/g, "Number").replace(/[/]|[\\]+/g, "_").trim().toLowerCase()] = value;
				}
			}
		});
	};

	BaseRoutingEventsManager.prototype.convertXYToGeometry = function(stops, param)
	{
		stops.map(function(stop)
		{
			stop.x = stop.x ? stop.x : (stop.lat ? stop.lat : (stop.latitude ? stop.latitude : ""));
			stop.y = stop.y ? stop.y : (stop.long ? stop.long : (stop.longitude ? stop.longitude : ""));
			stop.address = stop.street || stop.address || "";
			stop.zip = stop.zip || "";
			stop.city = stop.city || "";
		});

		return this.viewModel.drawTool.stopTool.createStopGeometry(stops, param);
	};

	BaseRoutingEventsManager.prototype.fileOpenComplete = function(stops)
	{
		var self = this;

		if (this.fileInput)
		{
			this.fileInput.val("");
		}
		if (self.fileOpenOption || stops.length > 1)
		{
			tf.modalManager.showModal(new TF.RoutingMap.RoutingPalette.CreateStopsFromFileModalViewModel(stops, this.viewModel)).then(function(result)
			{
				if (result == undefined || result === false)
				{
					return;
				}
				if (self.routingSearchViewmodel)
				{
					self.routingSearchViewmodel.hide();
				}
				getXYByGeometry(result);
				if (self.fileOpenOption)
				{
					self.createFromMultiple(result, $.extend({ isCreateFromSearch: true }, self.fileOpenOption)).then(function(trip)
					{
						self.fileOpenCompleteEvent.notify(trip);
					});
				}
				else
				{
					if (result.length == 1)
					{
						self.createFromSingle(result[0], result[0].geometry);
					}
					else 
					{
						self.createFromMultiple(result);
					}
				}
			});
		}
		else if (stops.length == 1)
		{
			getXYByGeometry(stops);
			self.createFromSingle(stops[0], stops[0].geometry);
		}
	};

	BaseRoutingEventsManager.prototype._changeCreateModeStyle = function(e)
	{
		PubSub.publish("clear_ContextMenu_Operation");
		var $target = e.currentTarget ? $(e.currentTarget).closest(".print-setting-group") : e.find(".print-setting-group.create-dropdown-list");
		var title = "";
		if ($(e.currentTarget).closest(".menu-item").length > 0)
		{
			title = $(e.currentTarget).closest(".menu-item").find("span").eq(0).text();
		} else
		{
			title = $(e.currentTarget).find("span").eq(0).text();
		}
		$target.children(".icon").attr("title", title);
	};

	function getXYByGeometry(stops)
	{
		stops.map(function(stop)
		{
			if (stop.x == 0 && stop.y == 0 && stop.geometry)
			{
				var geographic = tf.map.ArcGIS.webMercatorUtils.webMercatorToGeographic(stop.geometry);
				stop.x = geographic.x;
				stop.y = geographic.y;
			}
		});
	}
})();