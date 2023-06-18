(function()
{
	createNamespace("TF.Page").LocationPage = LocationPage;

	const LocationGridLayerId = "locationGridLayer";

	function LocationPage(gridOptions)
	{
		var self = this;
		self.type = "fieldtriplocation";
		self.pageType = "fieldtriplocations";
		self.gridOptions = gridOptions;
		TF.Page.BaseGridPage.apply(self, arguments);

		self.changeStatusButton = false;
		self.copyButton = true;
		self.detailButton = true;
		self.schedulerButton = false;
		self.mapviewButton = true;
		self.massUpdateButton = true;
		self.deleteButton = true;
		self.geocodeButton = true;

		self.endpoint = tf.DataTypeHelper.getEndpoint(self.type);
		self.pageLevelViewModel = new TF.PageLevel.BasePageLevelViewModel();

		this.geocodeTool = new TF.Grid.GeocodeTool(this);
		this.geocodingSelectionClick = this.geocodeTool.geocodingSelectionClick.bind(this.geocodeTool);
		this.ungeocodeSelectionClick = this.ungeocodeSelectionClick.bind(this);
		this.selectedRowChanged.subscribe(this.onSelectRowChanged.bind(this));
		// this.geocodingClick = this.geocodeTool.geocodingClick.bind(this.geocodeTool);

		self.subscriptions.push(tf.pageManager.resizablePage.obRightContentType.subscribe(function()
		{
			self.obShowSplitmap(tf.pageManager.resizablePage.obRightContentType() === "splitmap");
		}));

		self.locationMapPopup = null;
	}

	LocationPage.prototype = Object.create(TF.Page.BaseGridPage.prototype);
	LocationPage.prototype.constructor = LocationPage;

	LocationPage.prototype.updateOptions = function()
	{
		var self = this;
		if (self.gridOptions)
		{
			self.options.isTemporaryFilter = self.gridOptions.isTemporaryFilter;	// FT-1231 - Transfer the flag for open specific record (on-demand) from startup options to Trip grid view
			self.options.showRecordDetails = self.gridOptions.showRecordDetails;	// FT-1231 - Transfer the flag for show details (on-demand) from startup options to Trip grid view
			self.options.fromSearch = self.gridOptions.fromSearch;
			self.options.searchFilter = self.gridOptions.searchFilter;
			self.options.filteredIds = self.gridOptions.filteredIds;
		}
		self.options.gridDefinition = tf.fieldtripLocationGridDefinition.gridDefinition();
		self.options.showOmittedCount = true;
		self.options.isGridView = true;
		self.options.url = pathCombine(tf.api.apiPrefix(), "search", self.endpoint);
		self.options.loadUserDefined = false;
		self.options.supportMobileMultipleSelect = true;

	};

	LocationPage.prototype.createGrid = function(option)
	{
		var self = this,
			shouldShowDetails = self.options.showRecordDetails;

		TF.Page.BaseGridPage.prototype.createGrid.call(self, option);

		if (shouldShowDetails)
		{
			self.openContactRecordDetailsOnInitialLoad();
		}
	};

	LocationPage.prototype.openContactRecordDetailsOnInitialLoad = function()
	{
		this.showDetailsClick();
	};

	LocationPage.prototype.updateEditable = function()
	{
		var isEditable = false;
		var isDeletable = false;
		var isAddable = false;
		var isBatchable = false;
		
		if (tf.authManager.authorizationInfo.isAdmin)
		{
			isEditable = true;
			isDeletable = true;
			isAddable = true;
			isBatchable = true;
		}
		else
		{
			isEditable = tf.authManager.isAuthorizedForDataType(this.type, "edit");
			isDeletable = tf.authManager.isAuthorizedForDataType(this.type, "delete");
			isAddable = tf.authManager.isAuthorizedForDataType(this.type, "add");
			isBatchable = tf.authManager.isAuthorizedForDataType(this.type, "batch");
		}

		// update Edit observable variables
		this.selectedItemEditable(isEditable);
		this.selectedItemsEditable(isEditable);

		// update Delete observable variable
		this.obCanDeleteRecord(isDeletable);

		// update Add observable variable
		this.obNewRequest(isAddable);

		// update Batch observable variable
		this.obCanMassUpdate(isBatchable);
	};

	LocationPage.prototype.mapIconClick = async function()
	{
		var self = this, selectedId;
		const isReadOnly = !self.selectedItemEditable();
		const gridType = self.type;

		var selectedIds = self.searchGrid.getSelectedIds();
		if (!selectedIds || selectedIds.length <= 0)
		{
			// return;
		}
		selectedId = selectedIds[0];
		selectedIds.length > 1 && self.searchGrid.getSelectedIds([selectedId]);
		
		if (self.obShowSplitmap())
		{
			tf.pageManager.resizablePage.closeRightPage();
		}
		else
		{
			const eventHandlers = {
				onMapViewCreated: self.onMapViewCreated.bind(self),
				onMapViewClick: self.onMapViewClick.bind(self),
			};
			await tf.pageManager.resizablePage.showMapView(eventHandlers);
			self.locationMapViewInstance = tf.pageManager.resizablePage.getRightData();
			self.initMapTools();
			self.initLocationMapGraphics();
		}
	}

	LocationPage.prototype.initMapTools = function()
	{
		const self = this;
		const options = {
			baseMapSaveKey: "tfweb.baseMapId.gridMap",
			isDetailView: false,
			isReadMode: false,
			zoomAvailable: true,
			thematicAvailable: true,
			baseMapAvailable: true,
			measurementAvailable: true,
			manuallyPinAvailable: false,
			drawBoundaryAvailable: false,
			thematicInfo: false,
			legendStatus: false,
			geoFinderAvailable: true,
			geoSearchAvailable: true,
			printAvailable: true,
			expand: {
				enable: false,
			}
		};

		self._map = self.locationMapViewInstance.map;  // self._map is used for RoutingMapTool.
		self.element = tf.pageManager.resizablePage.$rightPage.find(".splitmap");
		self.RoutingMapTool = new TF.Map.RoutingMapTool(self, $.extend({
			thematicLayerId: "",
		}, options));

		self.sketchTool = new TF.RoutingMap.SketchTool(self.locationMapViewInstance.map, self);
	}

	LocationPage.prototype.globalReplaceClick = function(viewModel, e)
	{
		this._openGlobalReplaceModal();
	}

	LocationPage.prototype.geocodingClick = function(viewModel, e)
	{
		tf.contextMenuManager.showMenu(e.target, new TF.ContextMenu.TemplateContextMenu("workspace/grid/GeoCodingMenu", new TF.Grid.GridMenuViewModel(this, this.searchGrid)));
	}

	LocationPage.prototype.geocodeClick = function(gridMenuViewModel)
	{
		gridMenuViewModel.gridViewModel.geocodingSelectionClick();
	}

	LocationPage.prototype.ungeocodeClick = function(gridMenuViewModel)
	{
		const self = gridMenuViewModel.gridViewModel, selectedRecords = gridMenuViewModel.searchGrid.getSelectedRecords();
		var selected = self.searchGrid.getSelectedIds();
		return tf.modalManager.showModal(new TF.Modal.Grid.GridSelectionSettingModalViewModel(selectedRecords.length, "Ungeocode")).then(function(setting)
		{
			if (!setting)
			{
				return;
			}
			var recordIds = setting.specifyRecords == "selected" ? selected : gridMenuViewModel.searchGrid.allIds;
			return self._ungeocodeConfirm(recordIds).then(function(result)
			{
				if (result)
				{
					self._ungeocode(recordIds);
				}
			});
		});
	}

	LocationPage.prototype.newCopyClick = function()
	{
		TF.Page.BaseGridPage.prototype.newCopyClick.call(this, "Name");
	};

	LocationPage.prototype.bindButtonEvent = function()
	{
		var self = this;
		TF.Page.BaseGridPage.prototype.bindButtonEvent.call(self);
		
		self.unBindEvent(".iconbutton.copy"); // unbind the default copy event from BaseGridPage
		self.bindEvent(".iconbutton.copy", self.newCopyClick.bind(self));
	}

	LocationPage.prototype.updateRecords = function(records, successMessage)
	{
		const self = this;
		return tf.promiseAjax.patch(pathCombine(tf.api.apiPrefix(), self.endpoint),
		{
			data: records,
			paramData: { '@relationships': 'udf' }
		})
		.then(() =>
		{
			self.searchGrid.refresh();
			successMessage && tf.promiseBootbox.alert(successMessage);
		}, function(error)
		{
			return tf.promiseBootbox.alert(error.Message, "Ungeocode failed");
		});
	}

	LocationPage.prototype.ungeocodeSelectionClick = function()
	{
		var self = this;
		var recordIds = self.searchGrid.getSelectedIds();
		self._ungeocodeConfirm(recordIds).then(function(confirm)
		{
			if (confirm)
			{
				self._ungeocode(recordIds);
			}
		});
	}

	LocationPage.prototype._ungeocode = function(recordIds)
	{
		var data = [];

		recordIds.forEach(recordId => {
			data.push({ "Id": recordId, "op": "replace", "path": "/XCoord", "value": null });
			data.push({ "Id": recordId, "op": "replace", "path": "/YCoord", "value": null });				
			data.push({ "Id": recordId, "op": "replace", "path": "/GeocodeScore", "value": null });				
		});

		this.updateRecords(data, "Ungeocode success");
	}

	LocationPage.prototype._ungeocodeConfirm = function(recordIds)
	{
		return tf.promiseBootbox.yesNo(String.format('Are you sure you want to ungeocode {0} {1}?', recordIds.length, recordIds.length == 1 ? 'location' : 'locations'), "Confirmation Message");
	};

	LocationPage.prototype.onSelectRowChanged = function()
	{
		this.obGeocoded(this.searchGrid.getSelectedRecords().filter(function(item)
		{
			return item.Geocoded == 'true'
		}).length > 0);
	};

	LocationPage.prototype.initLocationMapGraphics = function()
	{
		const self = this;
		let timer = null;
		const showLocationPoints = () =>
			{
				if (timer != null)
				{
					clearTimeout(timer);
				}

				timer = setTimeout(async () =>
				{
					await self.drawLocationPoints();
					self.zoomToLocationGridLayerExtent();
					timer = null;
				});
			};

		if (!self.locationGridLayerInstance)
		{
			self.locationGridLayerInstance = self.locationMapViewInstance.addLayer({
				id: LocationGridLayerId,
				eventHandlers:{
					onLayerCreated: () => {
						showLocationPoints();
					}
				}
			});
		}
		else
		{
			self.locationGridLayerInstance.clearLayer();
			showLocationPoints();
		}
	}

	LocationPage.prototype.drawLocationPoints = async function()
	{
		const self = this,
			markerSymbol = {
				type: "picture-marker",
				url: "./global/img/map/map-pin.png",
				width: "32px",
				height: "32px",
			},
			records = await self.getLocationRecords();

		for (let i = 0; i < records.length; i++)
		{
			const item = records[i];
			const attributes = {
				...item
			}
			if (item.XCoord && item.YCoord)
			{
				self.locationGridLayerInstance.addPoint(item.XCoord, item.YCoord, markerSymbol, attributes);
			}
		}
	}

	LocationPage.prototype.getLocationRecords = async function()
	{
		const self = this;
		const recordIds = self.searchGrid.obAllIds();
		return tf.promiseAjax.post(self.options.url, {
			data: {
				fields: ["Id", "Name", "Street", "XCoord", "YCoord", "Notes", "City", "State", "Zip"],
				idFilter: {
					IncludeOnly: recordIds,
					ExcludeAny: []
				},
			}
		}).then(function(result)
		{
			return result.Items;
		});
	}

	LocationPage.prototype.zoomToLocationGridLayerExtent = function()
	{
		const graphics = this.locationGridLayerInstance.layer.graphics;
		this.locationMapViewInstance.setExtent(graphics);
	}

	LocationPage.prototype.onMapViewCreated = function()
	{
		console.log("Map View created");
	}

	LocationPage.prototype.onMapViewClick = async function(event)
	{
		const self = this;
		const locationGridLayerSearchFactor = 300; // The experience value, it depends on the point symbol size.
		const locationGraphics = await self.locationMapViewInstance.find(event.mapPoint, [self.locationGridLayerInstance], locationGridLayerSearchFactor);
		console.log(locationGraphics);

		if(!locationGraphics || !locationGraphics.length)
		{
			self.locationMapPopup.close();
			return;
		}

		self.locationMapPopup = self.locationMapPopup || new TF.Grid.LocationMapPopup({map:self.locationMapViewInstance});
		
		self.locationMapPopup.show(locationGraphics);
	}

	LocationPage.prototype.exitCurrentMode = function()
	{
		if (this.sketchTool) this.sketchTool.stop();
		if (this.RoutingMapTool.manuallyPinTool) this.RoutingMapTool.manuallyPinTool.stopPin();
		if (this.RoutingMapTool.measurementTool) this.RoutingMapTool.measurementTool.deactivate();
	}

	LocationPage.prototype.dispose = function()
	{
		const self = this;
		TF.Page.BaseGridPage.prototype.dispose.apply(self);
	};
})();