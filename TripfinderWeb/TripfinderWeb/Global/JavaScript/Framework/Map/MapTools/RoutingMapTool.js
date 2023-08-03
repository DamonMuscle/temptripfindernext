(function ()
{
	createNamespace("TF.Map").RoutingMapTool = RoutingMapTool;

	function RoutingMapTool(routingMapDocumentViewModel, options)
	{
		var self = this;
		self.options = $.extend({
			buildPalettes: function ()
			{
				return [];
			},
			thematicLayerId: 'candidateStudentFeatureLayer',
			baseMapSaveKey: "rfweb.baseMapId",
			geoSearchAvailable: false,
			thematicAvailable: true,
			geoFinderAvailable: true,
			homeToSchoolPathAvailable: false,
			measurementAvailable: true,
			manuallyPinAvailable: false,
			drawBoundaryAvailable: false,
			baseMapAvailable: true,
			trafficMapAvailable: (tf && tf.isViewfinder) ? false : true,
			zoomAvailable: true,
			playbackAvailable: false,
			printAvailable: false,
			isDetailView: false,
			thematicInfo: null,
			GoogleStreet: true,
			legendStatus: null,
			onThematicChanged: null,
			onLegendStatusChanged: null,
			obTrips: null
		}, options);
		self.options.trafficMapAvailable = self.options.trafficMapAvailable && tf.authManager.hasTraffic();;
		self.routingMapDocumentViewModel = routingMapDocumentViewModel;
		self.$container = routingMapDocumentViewModel.element;
		TF.Map.BaseMapTool.call(
			self,
			routingMapDocumentViewModel.element,
			{
				isReadMode: options.isReadMode,
				isDetailView: options.isDetailView,
				isLandscape: options.isLandscape,
				mapToolOptions: options.mapToolOptions,
			}
		);
		self.highlightChangedEvent = self.highlightChangedEvent.bind(self);
		self.baseMapTools = null;
	}

	RoutingMapTool.prototype = Object.create(TF.Map.BaseMapTool.prototype);
	RoutingMapTool.prototype.constructor = RoutingMapTool;

	RoutingMapTool.prototype.init = function ()
	{
		TF.Map.BaseMapTool.prototype.init.call(this);
	};

	RoutingMapTool.prototype.startSketch = function (toolName)
	{
		var previousToolName = this._currentToolName;
		this._currentToolName = toolName;

		if (this.routingMapDocumentViewModel.gridMapPopup && this.routingMapDocumentViewModel.disableMouseEvent)
		{
			this.routingMapDocumentViewModel.disableMouseEvent();
		}

		if (toolName !== "measurementTool" && previousToolName === "measurementTool")
		{
			this.measurementTool && this.measurementTool.deactivate();
		}
		if (toolName !== "geoSearchTool" && previousToolName === "geoSearchTool")
		{
			this.geoSearchTool && this.geoSearchTool.cancelGeoSearchChanges();
		}
		if (toolName !== "geoFinderTool" && previousToolName === "geoFinderTool")
		{
			this.geoFinderTool && this.geoFinderTool.endGeoFinder();
		}
		if (toolName !== "manuallyPinTool" && previousToolName === "manuallyPinTool")
		{
			this.manuallyPinTool && this.manuallyPinTool.stopPin();
			this._manuallyPinActive = false;
		}
		if (toolName !== "drawGeoregionBoundaryTool" && previousToolName === "drawGeoregionBoundaryTool")
		{
			this.drawGeoregionBoundaryTool && this.drawGeoregionBoundaryTool.stopDraw();
		}
	};

	RoutingMapTool.prototype.inactiveOtherBy = function(toolName)
	{
		var previousToolName = this._currentToolName;
		this._currentToolName = toolName;
		if (this.routingMapDocumentViewModel.gridMapPopup && this.routingMapDocumentViewModel.disableMouseEvent)
		{
			this.routingMapDocumentViewModel.disableMouseEvent();
		}

		if (toolName != "measurementTool" && previousToolName == "measurementTool")
		{
			this.measurementTool && this.measurementTool.deactivate();
		}
		if (toolName != "geoSearchTool" && previousToolName == "geoSearchTool")
		{
			this.geoSearchTool && this.geoSearchTool.cancelGeoSearchChanges();
		}
		if (toolName != "geoFinderTool" && previousToolName == "geoFinderTool")
		{
			this.geoFinderTool && this.geoFinderTool.endGeoFinder();
		}
		if (toolName != "manuallyPinTool" && previousToolName == "manuallyPinTool")
		{
			this.manuallyPinTool && this.manuallyPinTool.stopPin();
		}
		if (toolName != "drawGeoregionBoundaryTool" && previousToolName == "drawGeoregionBoundaryTool")
		{
			this.drawGeoregionBoundaryTool && this.drawGeoregionBoundaryTool.stopDraw();
		}
		if (toolName != "googleStreetTool" && previousToolName == "googleStreetTool")
		{
			this.googleStreetTool && this.googleStreetTool.deactivate();
		}
	};

	RoutingMapTool.prototype.stopSketch = function (toolName)
	{
		if (toolName === this._currentToolName)
		{
			if (this.routingMapDocumentViewModel.gridMapPopup)
			{
				this.routingMapDocumentViewModel.enableMouseEvent();
			}
		}
	};

	RoutingMapTool.prototype.GetLocationMarkerToolbarItems = function ()
	{
		if (!this.options.locationMarkerList)
		{
			return;
		}
		if (this.options.locationMarkerAvailable)
		{
			const toolbarItems = [];

			if (this.options.trashAvailable)
			{
				let trashIcon = 'trash';
				if (this.options.disableTrashBtn)
				{
					trashIcon += ' disable';
				}

				toolbarItems.push(new TF.RoutingMap.MenuItem({
					header: 'Clear',
					icon: trashIcon,
					closable: true,
					click: () => this.trashClick()
				}));
			}

			const locationMarkerToolItems = this.options.locationMarkerList.map(marker => new TF.RoutingMap.MenuItem({
				toggleStatus: ko.observable(false),
				header: marker,
				closable: true,
				type: marker.toLowerCase(),
				click: () => this.locationMarkerClick(marker)
			}));

			this.toolbarItems = toolbarItems.concat(locationMarkerToolItems);
		}
	};

	RoutingMapTool.prototype.GetMenuItems = function ()
	{
		var self = this;
		this.rootMenuItem = new TF.RoutingMap.MenuItem(
			{
				header: 'root',
				icon: null,
				parent: null,
				children: []
			}
		);

		if (this.options.baseMapAvailable)
		{
			this.rootMenuItem.addChild(new TF.RoutingMap.MenuItem({
				header: 'Basemap',
				icon: 'basemap',
				click: self.baseMapBtnClick.bind(self)
			}));
		}

		if (this.options.zoomAvailable)
		{
			this.rootMenuItem.addChild(new TF.RoutingMap.MenuItem({
				header: 'Zoom to Layers',
				icon: 'zoom',
				closable: true,
				click: self.zoomToLayersExtent.bind(self)
			}));
		}

		var children = this.options.buildPalettes().sort(function (a, b)
		{
			if (a.sequence > b.sequence)
			{
				return 1;
			}
			else if (a.sequence === b.sequence)
			{
				return 0;
			}
			else
			{
				return -1;
			}
		});
		if (children.length > 0)
		{
			this.rootMenuItem.addChild(new TF.RoutingMap.MenuItem({
				header: 'Palettes',
				icon: 'palettes',
				click: function ()
				{
					// This is intentional
				},
				children: children
			}));
		}

		if (this.options.manuallyPinAvailable)
		{
			this.rootMenuItem.addChild(new TF.RoutingMap.MenuItem({
				header: 'Manually Pin',
				icon: 'manuallypin',
				closable: true,
				click: self.manuallyPinClick.bind(self)
			}));
		}

		if (this.options.homeLocationPinAvailable)
		{
			this.rootMenuItem.addChild(new TF.RoutingMap.MenuItem({
				header: 'Home Location',
				icon: 'home',
				closable: true,
				click: self.homeLocationPinClick.bind(self)
			}));
		}

		if (this.options.drawBoundaryAvailable)
		{
			var drawBoundaryMenuItem = self.getDrawBoundaryMenuItem();
			this.rootMenuItem.addChild(drawBoundaryMenuItem);
		}

		if (this.options.thematicAvailable && tf.authManager.isAuthorizedFor("thematics", "read"))
		{
			this.rootMenuItem.addChild(new TF.RoutingMap.MenuItem({
				header: 'Thematics',
				icon: 'thematics',
				click: self.thematicsToolClick.bind(self)
			}));
		}
		
		if (this.options.GoogleStreet)
		{
			this.rootMenuItem.addChild(new TF.RoutingMap.MenuItem({
				header: 'Google Street View',
				icon: 'googlestreet',
				closable: true,
				click: self.googleStreetClick.bind(self)
			}));
		}

		if (this.options.geoFinderAvailable)
		{
			this.rootMenuItem.addChild(new TF.RoutingMap.MenuItem({
				header: 'Geofinder',
				icon: 'geofinder',
				click: function ()
				{
					// This is intentional
				},
				children: [
					new TF.RoutingMap.MenuItem({
						toggleStatus: ko.observable(false),
						header: 'Find in Polygon',
						closable: true,
						type: "polygon",
						click: self.geoFindClick
					}),
					new TF.RoutingMap.MenuItem({
						toggleStatus: ko.observable(false),
						header: 'Find in Walkout',
						closable: true,
						type: "walkout",
						click: self.geoFindClick
					}),
					new TF.RoutingMap.MenuItem({
						toggleStatus: ko.observable(false),
						header: 'Find in Drive To',
						closable: true,
						type: "driveto",
						click: self.geoFindClick
					})
				]
			}));
		}

		if (this.options.geoSearchAvailable)
		{
			this.rootMenuItem.addChild(new TF.RoutingMap.MenuItem({
				header: 'Geo Search',
				icon: 'geosearch',
				closable: true,
				click: self.geoSearchToolClick.bind(self)
			}));
		}

		// if (this.options.homeToSchoolPathAvailable)
		// {
		// 	this.rootMenuItem.addChild(new TF.RoutingMap.MenuItem({
		// 		header: 'Home to School Path',
		// 		icon: 'studentWalk',
		// 		closable: true,
		// 		click: self.homeToSchoolPathClick.bind(self)
		// 	}));
		// }

		if (this.options.clearGeoSearchAvailable)
		{
			this.rootMenuItem.addChild(new TF.RoutingMap.MenuItem({
				header: 'Clear Shapes',
				icon: 'clear-geosearch',
				closable: true,
				click: self.clearGeoSearchToolClick.bind(self)
			}));
		}

		if (this.options.measurementAvailable)
		{
			this.rootMenuItem.addChild(new TF.RoutingMap.MenuItem({
				header: 'Measurement',
				icon: 'measurement',
				closable: true,
				click: self.measurementToolClick.bind(self)
			}));
		}

		if (this.options.playbackAvailable)
		{
			this.rootMenuItem.addChild(new TF.RoutingMap.MenuItem({
				header: 'Playback',
				icon: 'playback',
				closable: true,
				click: self.playbackClick.bind(self)
			}));
		}

		if (this.options.printAvailable)
		{
			this.rootMenuItem.addChild(new TF.RoutingMap.MenuItem({
				header: 'Print',
				icon: 'print',
				closable: true,
				click: self.print.bind(self)
			}));
		}

		if (this.options.homeAvailable)
		{
			this.rootMenuItem.addChild(new TF.RoutingMap.MenuItem({
				header: 'Home',
				icon: 'home',
				closable: true,
				click: () => this.homeClick()
			}));
		}

		if (this.options.myLocationAvailable)
		{
			let iconClass = 'location-arrow';
			if (this.options.disableMyLocationBtn)
			{
				iconClass += " disable";
			}
			this.rootMenuItem.addChild(new TF.RoutingMap.MenuItem({
				header: 'My Location',
				icon: iconClass,
				closable: true,
				click: () => this.myLocationClick()
			}));
		}
	};

	var letterSize = { width: 8.5, height: 11 }, minMagin = 0.2;

	RoutingMapTool.prototype.print = function ()
	{
		tf.loadingIndicator.show();
		var endPrint;
		this.routingMapDocumentViewModel._map.mapView.takeScreenshot({
			'format': 'png'
		}).then(screenshot =>
		{
			var src = screenshot.dataUrl,
				width = screenshot.data.width,
				height = screenshot.data.height,
				imgWidthInch = width / 96,
				imgHeightInch = height / 96,
				landscape = imgWidthInch > imgHeightInch,
				pageWidth = landscape ? letterSize.height : letterSize.width,
				pageHeight = landscape ? letterSize.width : letterSize.height,
				scale = Math.min((pageWidth - minMagin * 2) / imgWidthInch, (pageHeight - minMagin * 2) / imgHeightInch);

			imgWidthInch = imgWidthInch * scale;
			imgHeightInch = imgHeightInch * scale;
			width = Math.floor(imgWidthInch * 96);
			height = Math.floor(imgHeightInch * 96);

			var horizontalMargin = Math.max((pageWidth - imgWidthInch) / 2, minMagin),
				verticalMargin = Math.max((pageHeight - imgHeightInch) / 2, minMagin),
				img = `<img width='${width}' height='${height}' src='${src}' class='printable' />)`,
				pageCss = `@media print {@page {margin: ${verticalMargin.toFixed(2)}in ${horizontalMargin.toFixed(2)}in; size: ${pageWidth}in ${pageHeight}in;} html, body {min-height:auto;}}`,
				styleHtml = `<style>${pageCss}</style>`,
				styleEle = $(styleHtml).appendTo($(document).find("head")),
				imgElement = $(img).on('load', () =>
				{
					window.focus();
					window.print();
				});

			var measurementPanelCopy;
			endPrint = () =>
			{
				if (imgElement)
				{
					imgElement.remove();
					imgElement = null;
					styleEle.remove();
					styleEle = null;
					if (measurementPanelCopy)
					{
						measurementPanelCopy.remove();
						measurementPanelCopy = null;
					}
					tf.loadingIndicator.tryHide();
				}
			};

			window.onafterprint = endPrint;

			$(document.body).append(imgElement);
			if (this.measurementTool && this.measurementTool.isActive)
			{
				var measurementPanel = this.measurementTool.$infoPanel.find(".active.measurement-panel"),
					measurementPanelMargin = 5,
					measurementPanelWidth = measurementPanel.width(),
					measurementPanelHeight = measurementPanel.height();
				measurementPanelCopy = $(`<div id='measurementInfoPanel' class='measurement-info-panel active'>` +
					`<div class='measurement-panel-container'>${measurementPanel[0].outerHTML}</div></div>`)
					.addClass("printable")
					.width(measurementPanelWidth)
					.height(measurementPanelHeight)
					.css({
						position: "absolute",
						left: `${(width - measurementPanelWidth - measurementPanelMargin)}px`,
						top: `${(height - measurementPanelHeight - measurementPanelMargin)}px`
					});
				$(document.body).append(measurementPanelCopy);
				measurementPanelCopy.find(".location-track").remove();
			}
		}).catch(() =>
		{
			if (endPrint)
			{
				endPrint();
			}
		});
	};

	RoutingMapTool.buildMenuItem = function (header, icon, viewModel, click, sequence)
	{
		return new TF.RoutingMap.MenuItem({
			header: header,
			icon: icon,
			children: [],
			isToggled: true,
			disable: click ? false : true,
			toggleStatus: viewModel.obShow,
			sequence: sequence,
			click: function ()
			{
				if(!viewModel.type)
				{
					return;
				}
				
				click && click(viewModel);
			}
		});
	};

	RoutingMapTool.prototype.highlightChangedEvent = function (highlightedStudents)
	{
		var self = this;

		if (self.thematicTool && self.thematicTool.grid)
		{
			self.thematicTool.grid.highLightedData = highlightedStudents;
			if (self.thematicTool.thematicMenu.obSelectThematicId() !== null && highlightedStudents.length > 0)
			{
				self.thematicTool.setHighLightedDataSymbol();
			}
		}
	};

	RoutingMapTool.prototype.hasApplyThematic = function ()
	{
		return this.thematicTool.thematicMenu.obAppliedThematic() !== null;
	};

	/**
	* Initialize the thematics tool
	* @return {void}
	*/
	RoutingMapTool.prototype.initThematicsTool = function ()
	{
		var self = this;
		self.thematicsToolTimer = setTimeout(function ()
		{
			var grid = {
				_gridType: self.options.mapToolOptions !== undefined ? self.options.mapToolOptions.gridType : 'student',
				result: { TotalRecordCount: 0 }, allIds: [], allData: [], highLightedData: [], dataType: 'unassignedStudents',
				isMapCanvas: self.options.mapToolOptions === undefined
			};
			var document;
			if (self.routingMapDocumentViewModel.gridMultiDocumentViewModel)
			{
				document = self.routingMapDocumentViewModel.gridMultiDocumentViewModel;
			} else if (self.routingMapDocumentViewModel.routeState && !(tf && tf.isViewfinder))
			{
				document = tf.documentManagerViewModel._findDocument(self.routingMapDocumentViewModel.routeState);
			}
			if (document && document.gridViewModel)
			{
				grid = document.gridViewModel.searchGrid;
			}
			else if (self.routingMapDocumentViewModel && self.routingMapDocumentViewModel._grid)
			{
				grid = self.routingMapDocumentViewModel._grid;
			}

			self.thematicTool = new TF.Map.RoutingThematicTool(
				grid,
				self.routingMapDocumentViewModel,
				self.$mapTool,
				self.$offMapTool,
				self.options.isDetailView,
				self.studentIds,
				self.options.isReadMode,
				self.options.thematicInfo,
				self.options.legendStatus,
				self.options.thematicLayerId,
				self.options.mapToolOptions);

			self.$thematicTool = self.$offMapTool.find('.thematic-menu');
			self.thematicTool.thematicMenu.onMenuOptionClick.subscribe(self.onThematicMenuOptionClick.bind(self));

			if (self.options.onThematicChanged)
			{
				self.thematicTool.thematicMenu.onThematicChanged.subscribe(self.options.onThematicChanged);
			}

			if (self.options.onLegendStatusChanged)
			{
				self.thematicTool.thematicMenu.onLegendStatusChanged.subscribe(self.options.onLegendStatusChanged);
			}
		});
	};

	RoutingMapTool.prototype.onThematicMenuOptionClick = function ()
	{
		this.toolkitBtnClick();
		this.hideSubMenu();
	};

	RoutingMapTool.prototype.thematicsToolClick = function (menuItem)
	{
		var self = this;
		if (self.thematicTool && menuItem.isActive)
		{
			self.thematicTool.thematicMenu.activate().then(function ()
			{
				var $caret = $('<div class="caret"></div>');
				self.$offMapTool.append($caret);
				self.setCaretPosition(menuItem, $caret);
				self.setFirstSubMenuPosition(self.$thematicTool, $caret);
			});
		}
	};

	RoutingMapTool.prototype.getDrawBoundaryMenuItem = function ()
	{
		var self = this;
		return new TF.RoutingMap.MenuItem({
			header: 'Draw GeoRegion Boundary',
			icon: 'geosearch',
			click: function ()
			{
				// This is intentional
			},
			children: [
				new TF.RoutingMap.MenuItem({
					toggleStatus: ko.observable(false),
					header: 'Polygon',
					closable: true,
					type: "polygon",
					click: self.drawBoundaryClick
				}),
				new TF.RoutingMap.MenuItem({
					toggleStatus: ko.observable(false),
					header: 'Rectangle',
					closable: true,
					type: "rectangle",
					click: self.drawBoundaryClick
				}),
				new TF.RoutingMap.MenuItem({
					toggleStatus: ko.observable(false),
					header: 'Draw',
					closable: true,
					type: "draw",
					click: self.drawBoundaryClick
				}),
				new TF.RoutingMap.MenuItem({
					toggleStatus: ko.observable(false),
					header: 'Circle',
					closable: true,
					type: "circle",
					click: self.drawBoundaryClick
				})
			]
		})
	};

	RoutingMapTool.prototype.addDrawBoundaryTool = function ()
	{
		var self = this;
		var menuItem = self.getDrawBoundaryMenuItem();
		self.rootMenuItem.addChild(menuItem);
		menuItem.onclick = menuItem.onclick.createInterceptor(self.openSubMenu.bind(self)).bind(this, menuItem);
		self.insertTool(menuItem.icon, menuItem.header, menuItem.onclick, menuItem, 4);
	};

	RoutingMapTool.prototype.removeDrawBoundaryTool = function ()
	{
		var self = this;
		self.removeTool(4);
	};

	RoutingMapTool.prototype.drawBoundaryClick = function (e, data)
	{
		var self = this;
		if (!self.drawGeoregionBoundaryTool)
		{
			self.drawGeoregionBoundaryTool = new TF.Map.DrawGeoregionBoundaryTool(self);
		}
		if (self.routingMapDocumentViewModel._map.findLayerById("georegionPointLayer").graphics.items.length === 0)
		{
			tf.promiseBootbox.alert("Please manually pin a geo region locaton first!");
			return;
		}
		self.drawGeoregionBoundaryTool.startDraw(e.config.type);
	};

	RoutingMapTool.prototype.geoFindClick = function (e, data)
	{
		var self = this;
		this.routingMapDocumentViewModel.gridMapPopup && this.routingMapDocumentViewModel.gridMapPopup.close();
		self.geoFinderTool.startGeoFinder(e.config.type);
	};

	RoutingMapTool.prototype.googleStreetClick = function(e, data)
	{
		var self = this;
		if (!self.googleStreetTool)
			self.googleStreetTool = new TF.Map.GoogleStreetTool(self.routingMapDocumentViewModel._map, tf.map.ArcGIS, self.getRouteState(), this);

		var isActive = self.googleStreetTool.isMeasurementActive();
		if (isActive) self.googleStreetTool.deactivate();
		else self.googleStreetTool.activate();
	};
	
	RoutingMapTool.prototype.baseMapBtnClick = function (menuItem)
	{
		this.toggleBaseMapGalleryDisplayStatus(menuItem);
	};

	RoutingMapTool.prototype.toggleBaseMapGalleryDisplayStatus = function (menuItem, status)
	{
		var self = this;
		var $basemapGallery = self.initBaseMapTool();
		var $menu = $basemapGallery,
			$icon = self.$mapToolContainer.find(".tool-icon.basemap"),
			currentStatus = (status !== undefined) ? status : !$menu.hasClass("active");

		if (currentStatus)
		{
			if (TF.isPhoneDevice)
			{
				self.$offMapTool.css({
					'display': 'none'
				});

				self.$mapToolContainer.find(".tool-icon").addClass("active");
				self.$toolkitButton.addClass("active");
				TF.Map.ExpandMapTool.moveMobileFullScreenBaseMapBehind(self.$offMapTool);
				if (_.isEmpty(self.baseMapModel))
				{
					self.baseMapModel = new TF.Modal.SelectMapModalViewModel(self);
				}

				tf.modalManager.showModal(self.baseMapModel);
			} else
			{
				var $caret = $('<div class="caret"></div>');
				self.$offMapTool.append($caret);
				self.setCaretPosition(menuItem, $caret);
				self.setFirstSubMenuPosition($basemapGallery, $caret);
			}
		}
		else
		{
			if (TF.isPhoneDevice)
			{
				self.baseMapModel && self.baseMapModel.positiveClick();
				self.$offMapTool.css({
					'display': 'block'
				});
			} else
			{
				$icon.removeClass("active");
				$menu.removeClass("active");
				self.$offMapTool.removeClass("basemap");
			}
		}
	};

	RoutingMapTool.prototype.manuallyPinClick = function ()
	{
		var self = this;
		if (!self.manuallyPinTool)
		{
			self.manuallyPinTool = new TF.Map.ManuallyPinTool(self);
		}
		if (!self._manuallyPinActive)
		{
			self.manuallyPinTool.startPin();
			self._manuallyPinActive = true;
		} else
		{
			self.manuallyPinTool.stopPin();
			self._manuallyPinActive = false;
		}

	};

	RoutingMapTool.prototype.homeLocationPinClick = function ()
	{
		var self = this;
		if (!self.homeLocationPinTool)
		{
			self.homeLocationPinTool = new TF.Map.HomeLocationPinTool(self);
		}
		if (!self._homeLocationPinActive)
		{
			self.homeLocationPinTool.startPin();
			self._homeLocationPinActive = true;
		} else
		{
			self.homeLocationPinTool.stopPin();
			self._homeLocationPinActive = false;
		}

	};

	/**
	* Initialize the arcgis basemap gallery.
	* @return {void}
	*/
	RoutingMapTool.prototype.initBaseMapTool = function (externalId)
	{
		//this.options.mapToolOptions.urlWithoutPrefix = true when viewfinder
		var imageJsonUrlPrefix = this.options && this.options.mapToolOptions && this.options.mapToolOptions.urlWithoutPrefix ? "./" : "../../";
		var self = this;
		var basemapSelectedClass = "esri-basemap-gallery__item--selected";
		var id = externalId || "basemap-menu-" + self.getRouteState();
		var $basemapGallery = $("<div></div>", { id: id });
		$basemapGallery.addClass("esri-basemap-gallery esri-widget esri-widget--panel-height-only tool-menu routing-sub-item");

		var $ul = $('<ul class="esri-basemap-gallery__item-container" role="menu"></ul>');
		TF.Helper.MapHelper.getAllBaseMaps().forEach(function (baseMap)
		{
			if (baseMap.id === "my-maps" && self.options.myMapAvailable === false)
			{
				return;
			}
			var $li = $(`<li class="esri-basemap-gallery__item" role="menuitem" tabindex="0" ><img  alt = "" class= "esri-basemap-gallery__item-thumbnail"` +
				` src="${baseMap.thumbnail}" ><div class="esri-basemap-gallery__item-title">${baseMap.title}</div></li>`);
			if (self.routingMapDocumentViewModel._map.basemap.id === baseMap.id)
			{
				$li.addClass(basemapSelectedClass);
			}
			$ul.append($li);
			$li.on("click", function ()
			{
				if (!self.options.notStickyBaseMap)
				{
					tf.userPreferenceManager.save(self.options.baseMapSaveKey, baseMap.id);
				}
				$(self.routingMapDocumentViewModel._map.mapView.container).css("background-color", "white");
				if (baseMap.id === "my-maps")
				{
					var layersViewModel;
					if (self.routingMapDocumentViewModel.mapLayersPaletteViewModel)
					{
						layersViewModel = self.routingMapDocumentViewModel.mapLayersPaletteViewModel;
						layersViewModel.show();
					} else
					{
						layersViewModel = new TF.RoutingMap.MapLayersPaletteViewModel(self.routingMapDocumentViewModel, false, self.getRouteState());
						self.routingMapDocumentViewModel.onMapLoad.notify();
						setTimeout(() =>
						{
							layersViewModel.show();
						}, 20);
					}
				}
				else
				{
					if (self.routingMapDocumentViewModel._map.basemap.id === "my-maps" && self.routingMapDocumentViewModel.parcelPaletteViewModel)
					{
						//hide parcel point layer if change basemap.
						self.routingMapDocumentViewModel.parcelPaletteViewModel.minusShowCount();
						if (self.routingMapDocumentViewModel.parcelPaletteViewModel.showCount === 0)
						{
							self.routingMapDocumentViewModel.parcelPaletteViewModel.close()
						}
					}

					if (typeof baseMap.getBasemap === "function")
					{
						self.routingMapDocumentViewModel._map.basemap = baseMap.getBasemap(imageJsonUrlPrefix);
					} else
					{
						self.routingMapDocumentViewModel._map.basemap = baseMap.id;
					}
				}

				self.toolkitBtnClick();
				self.hideSubMenu();
				if (TF.isPhoneDevice)
				{
					self.baseMapModel && self.baseMapModel.positiveClick();
					self.$offMapTool.css({
						'display': 'block'
					});
				}
			});
		});
		this.initTrafficMap($ul);
		$basemapGallery.append($ul);
		self.$basemapGallery = $basemapGallery;
		if (!TF.isPhoneDevice)
		{
			self.$offMapTool.append($basemapGallery);
			$basemapGallery.show();
		}
		else
		{
			self.baseMapTools = self.$basemapGallery.detach();
		}
		return $basemapGallery;
	};

	RoutingMapTool.prototype.initTrafficMap = function ($ul)
	{
		if (this.options.trafficMapAvailable)
		{
			if (!this.trafficMapCheckbox)
			{
				this.trafficMapCheckbox = $(`<li>
			<div class="spinner-circle-wrapper" style='margin-top:20px;margin-bottom:10px;'>
				<div class="border"><span class='time'>300</span></div>
				<div class="wrapper">
					<div class="spinner pie"></div>
					<div class="filler pie"></div>
					<div class="mask"></div>
				</div>
			</div>	
			<div class="checkbox" >
				<label>
					<input type="checkbox" style="margin-top:2px;">
					<span>Live Traffic Data</span>
				</label>
			</div></li>`);
			}

			this.trafficMapCheckbox.find("input")
				.off("change").on("change", () =>
				{
					this.trafficMapOn = this.trafficMapCheckbox.find("input").prop("checked");
					if (!this.trafficMap)
					{
						this.trafficMap = new TF.Map.TrafficMap(this.routingMapDocumentViewModel._map, this);
					}
					this.trafficMap.toggleTrafficMap(() =>
					{
						// count down
						if (this.trafficMapOn)
						{
							var trafficMapCheckbox = this.trafficMapCheckbox;
							trafficMapCheckbox.find(".spinner-circle-wrapper").css("visibility", "visible");
							var totalSecond = TF.Map.TrafficMap.RefreshInterval * 60;
							var currentSecond = totalSecond;
							drawCurrentStatus();
							this.trafficTimer = setInterval(() =>
							{
								currentSecond = currentSecond - 1;
								if (currentSecond < 0)
								{
									currentSecond = totalSecond;
								}
								drawCurrentStatus();
							}, 1000);

							function drawCurrentStatus()
							{
								trafficMapCheckbox.find(".time").text(currentSecond);
								var rotate = -360 / totalSecond * currentSecond + 360;
								trafficMapCheckbox.find(".spinner").css("transform", `rotate(${rotate}deg)`);
								if (currentSecond < totalSecond / 2)
								{
									trafficMapCheckbox.find(".mask").hide();
									trafficMapCheckbox.find(".filler").show();
								} else
								{
									trafficMapCheckbox.find(".mask").show();
									trafficMapCheckbox.find(".filler").hide();
								}
							}
						} else
						{
							this.trafficMapCheckbox.find(".spinner-circle-wrapper").css("visibility", "hidden");
							clearInterval(this.trafficTimer);
						}
					});
				});
			this.trafficMapCheckbox.off("click.stopPro").on("click.stopPro", (e) =>
			{
				e.stopPropagation();
			});
			$ul.append(this.trafficMapCheckbox);
		}
	};

	RoutingMapTool.prototype.getRouteState = function ()
	{
		return this.routingMapDocumentViewModel.routeState
			|| (tf.documentManagerViewModel && tf.documentManagerViewModel.obCurrentDocument
				&& tf.documentManagerViewModel.obCurrentDocument().routeState)
			|| "";
	};

	RoutingMapTool.prototype.zoomToLayersExtent = function ()
	{
		const mapInstance = this.routingMapDocumentViewModel.mapInstance;
		if (mapInstance)
		{
			mapInstance.zoomToFullVisibleExtent();
		}

		return;
		
		var map = this.routingMapDocumentViewModel._map;

		if (!!this.routingMapDocumentViewModel._mapPoints)
		{
			TF.RoutingMap.EsriTool.centerMultipleItem(map, this.routingMapDocumentViewModel._mapPoints)
			return;
		}


		// if does not have too much layer, zoom to all graphics
		if (map.allLayers.length < 15)
		{
			var promises = [];
			var query = new tf.map.ArcGIS.Query();
			query.where = "1=1";
			query.returnGeometry = true;
			query.outSpatialReference = map.mapView.spatialReference;
			map.allLayers.forEach(function (layer)
			{
				if (layer.graphics)
				{
					promises.push(Promise.resolve(layer.graphics.items));
				} else if (layer.type === "feature")
				{
					promises.push(layer.queryFeatures(query).then(function (featureSet)
					{
						return featureSet.features;
					}));
				}
			});

			Promise.all(promises).then(function (data)
			{
				var allGraphics = _.flatten(data);
				if (allGraphics.length > 0)
				{
					var finalGraphics = (tf && tf.isViewfinder) ? [] : allGraphics;
					if (tf && tf.isViewfinder)
					{
						allGraphics.forEach(function (item)
						{
							if (item.geometry.longitude && item.geometry.latitude)
							{
								finalGraphics.push({
									geometry: TF.xyToGeometry(item.geometry.longitude, item.geometry.latitude),
									id: item.Id
								});
							}
						});
					}
					TF.RoutingMap.EsriTool.centerMultipleItem(map, finalGraphics);
				}
			});
		} else
		{
			map.mapView.extent = TF.createDefaultMapExtent();
		}
	};

	RoutingMapTool.prototype.measurementToolClick = function ()
	{
		if (!this.measurementTool)
		{
			var routeState = this.getRouteState();
			this.measurementTool = new TF.Map.RoutingMapMeasureTool(this.routingMapDocumentViewModel._map, tf.map.ArcGIS, this.routingMapDocumentViewModel.element, routeState, this);
		}

		var isActive = this.measurementTool.isMeasurementActive();
		if (isActive)
		{
			this.measurementTool.deactivate();
		} else
		{
			this.routingMapDocumentViewModel.gridMapPopup && this.routingMapDocumentViewModel.gridMapPopup.close();
			this.measurementTool.activate();
		}
	};

	// click on geo search
	RoutingMapTool.prototype.geoSearchToolClick = function ()
	{
		var self = this;
		if (!self.geoSearchTool)
		{
			self.geoSearchTool = new TF.Map.GeoSearchTool(self.routingMapDocumentViewModel, self, self.options.searchGrid);
			self.geoSearchTool.drawCompleted.subscribe(function ()
			{
				if (tf.isViewfinder && isMobileDevice())
				{
					self.$appliedGeoSearchIcon.hide();
				}
			});
			self.geoSearchTool.clearGeoSearch.subscribe(function ()
			{
				self.routingMapDocumentViewModel.revertGeoSearch();
			});
		}

		var isActive = self.geoSearchTool.isGeoSearching();

		if (isActive)
		{
			if (tf.isViewfinder && isMobileDevice())
			{
				self.$appliedGeoSearchIcon.show();
				self.geoSearchTool.activateDrawTool();
			}
			else
			{
				self.geoSearchTool.cancelGeoSearchChanges();
			}
		} else
		{
			self.routingMapDocumentViewModel.gridMapPopup && self.routingMapDocumentViewModel.gridMapPopup.close();
			self.routingMapDocumentViewModel.revertGeoSearch();
			self.geoSearchTool.startGeoSearch();
			if (tf.isViewfinder && isMobileDevice())
			{
				self.$appliedGeoSearchIcon.show();
			}
		}
	};

	RoutingMapTool.prototype.clearGeoSearchToolClick = function ()
	{
		var self = this;
		if (self.geoSearchTool)
		{
			self.geoSearchTool.clearAllBtnClick();
		}
	};

	RoutingMapTool.prototype.playbackClick = function ()
	{
		if (!this.playbackTool)
		{
			this.playbackTool = new TF.Map.PlaybackTool(this);
		}
		this.playbackTool.toggleDisplay();
	};

	RoutingMapTool.prototype.homeToSchoolPathClick = function ()
	{
		if (!this.homeToSchoolPathTool)
		{
			this.homeToSchoolPathTool = new TF.Map.HomeToSchoolPathTool(this);
		}
		this.homeToSchoolPathTool.toggleDisplay();
	};

	// only for form, move to sperate file in free time
	RoutingMapTool.prototype.homeClick = function ()
	{
		if (!this.homeTool)
		{
			this.homeTool = new TF.Form.Map.HomeTool(this);
		}
		this.homeTool.jumpToHome();
	};

	// only for form, click to show current location
	RoutingMapTool.prototype.myLocationClick = function ()
	{
		if (!this.myLocationTool)
		{
			this.myLocationTool = new TF.Form.Map.MyLocationTool(this);
		}
		this.myLocationTool.drawMyLocation();
	}

	// only for form, move to sperate file in free time
	RoutingMapTool.prototype.locationMarkerClick = function (locatonMarker)
	{
		if (this.circleRadiusPanel)
		{
			this.circleRadiusPanel.close();
		}
		this.$mapToolBar && this.$mapToolBar.find(".trash").addClass('disable');
		if (!this.locationMarkerTool)
		{
			this.locationMarkerTool = new TF.Form.Map.LocationMarkerTool(this);
		}
		this.locationMarkerTool.drawMarker(locatonMarker);
	}

	// only for form, move to sperate file in free time
	RoutingMapTool.prototype.trashClick = function ()
	{
		if (this.circleRadiusPanel)
		{
			this.circleRadiusPanel.close();
		}
		const $trashButton = this.$mapToolBar.find("li.trash");
		if (($trashButton.length > 0) && $trashButton.hasClass("disable"))
		{
			return;
		}
		if (!this.deleteShapeTool)
		{
			this.deleteShapeTool = new TF.Form.Map.DeleteShapeTool(this);
		}
		this.deleteShapeTool.removeShape();
	}

	RoutingMapTool.prototype.dispose = function ()
	{
		clearTimeout(this.thematicsToolTimer);
		this.thematicTool && this.thematicTool.dispose();
		this.measurementTool && this.measurementTool.dispose();
		this.geoSearchTool && this.geoSearchTool.dispose();
		TF.Map.BaseMapTool.prototype.dispose.call(this);
		this.manuallyPinTool && this.manuallyPinTool.dispose();
		this.drawGeoregionBoundaryTool && this.drawGeoregionBoundaryTool.dispose();
		this.geoFinderTool && this.geoFinderTool.dispose();
		this.playbackTool && this.playbackTool.dispose();
		this.locationMarkerTool && this.locationMarkerTool.dispose();
	};

})();
