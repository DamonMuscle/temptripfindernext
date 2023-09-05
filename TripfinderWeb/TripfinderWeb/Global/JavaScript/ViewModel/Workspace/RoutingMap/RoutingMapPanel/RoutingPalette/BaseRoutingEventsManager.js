(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").BaseRoutingEventsManager = BaseRoutingEventsManager;

	function BaseRoutingEventsManager(fieldTripPaletteSectionVM, mapCanvasPage)
	{
		const self = this;
		self.fieldTripPaletteSectionVM = fieldTripPaletteSectionVM;
		self.mapCanvasPage = mapCanvasPage;
		self.copyFromObject = ko.computed(self.getCopyFrom.bind(self));
		self.fileOpenCompleteEvent = new TF.Events.Event();

		Object.defineProperty(self, "viewModel",
		{
			get()
			{
				console.log("This property is obsoleted, please use fieldTripPaletteSectionVM instead. it should be removed in future.(BaseRoutingEventsManager)")
				return self.fieldTripPaletteSectionVM;
			},
			enumerable: false,
		});

		Object.defineProperty(self, "_viewModal",
		{
			get()
			{
				console.log("This property is obsoleted, please use mapCanvasPage instead. it should be removed in future.(BaseRoutingEventsManager)")
				return self.mapCanvasPage;
			},
			enumerable: false,
		});
	}

	BaseRoutingEventsManager.prototype = Object.create(TF.RoutingMap.EventBase.prototype);
	BaseRoutingEventsManager.prototype.constructor = BaseRoutingEventsManager;

	BaseRoutingEventsManager.prototype.getCopyFrom = function()
	{
		if (this.mapCanvasPage.obCopyPointObject())
		{
			var copyFrom = this.mapCanvasPage.obCopyPointObject().getData();
			if (copyFrom && copyFrom.boundary && copyFrom.boundary.geometry)
			{
				return copyFrom;
			}
		}
		return null;
	};

	BaseRoutingEventsManager.prototype.createFromSearchResult = function(option)
	{
		var self = this;
		var mapInstance = this.mapCanvasPage.mapInstance;
		var options = {
			onChoseFromFileEvent: self.createChangeEvent.bind(self)
		};
		self.routingSearchViewmodel = new TF.RoutingMap.RoutingPalette.RoutingSearchModalViewModel(mapInstance, options);
		return tf.modalManager.showModal(self.routingSearchViewmodel)
			.then(function(data)
			{
				self.routingSearchViewmodel = null;
				self.createFieldTripStopFromSearchResult(data);
			});
	};

	BaseRoutingEventsManager.prototype.createFieldTripStopFromSearchResult = async function(data, option)
	{
		var self = this;
		if (!data || data.length == 0)
		{
			return;
		}

		const isCreateFromStopSearch = data[0].type == "tripstop" || data[0].type == "poolStops";
		let options = {
			student: null,
			isCreateFromStopSearch,
			isCreateFromSearch:true,
			boundary: null,
			insertBehindSpecialStop: null,
			streetName: "",
			isCopied: false,
			selectLastSelectedTrip: true,
			tryUseLastSettings: false
		};

		if (option)
		{
			options = $.extend(options, option);
		}

		await self.fieldTripPaletteSectionVM.routingPaletteVM.onQuickAddStops(data);

		if (options.operate && options.operate == 'CreateNewTrip')
		{
			return self.fieldTripPaletteSectionVM.editFieldTripStopModal.createMultiple(data, options);
		}
		else
		{
			if (data.length == 1)
			{
				self.fieldTripPaletteSectionVM.editFieldTripStopModal.create(data[0], options);
			}
			else
			{
				self.fieldTripPaletteSectionVM.editFieldTripStopModal.createMultiple(data, options);
			}
		}
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

	BaseRoutingEventsManager.prototype.createFromSingle = function(point, isCreateFromStopSearch, isCreateFromSearch)
	{

	};

	BaseRoutingEventsManager.prototype.createFromMultiple = function(pointArray, options)
	{
	};

	/**
	* only address point need to offset and inset on map
	* if other case and within 1 meter to street and 5 meters to junction, force stop to snap onto the junction
	*/
	BaseRoutingEventsManager.prototype.offsetInsetPoint = function(point, geometry, type, streets)
	{
		if (type == "addressPoint")
		{
			return Promise.resolve(geometry); //self.fieldTripPaletteSectionVM.drawTool.stopTool.offsetInsetPoint(point, geometry);
		}
		else
		{
			return self.fieldTripPaletteSectionVM.drawTool.forceStopToJunction(point).then(function(point) { return Promise.resolve(point.geometry) })
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

		return self.fieldTripPaletteSectionVM.drawTool.stopTool.createStopGeometry(stops, param);
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
			tf.modalManager.showModal(new TF.RoutingMap.RoutingPalette.CreateStopsFromFileModalViewModel(stops, self.fieldTripPaletteSectionVM)).then(function(result)
			{
				if (result == undefined || result === false)
				{
					return;
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