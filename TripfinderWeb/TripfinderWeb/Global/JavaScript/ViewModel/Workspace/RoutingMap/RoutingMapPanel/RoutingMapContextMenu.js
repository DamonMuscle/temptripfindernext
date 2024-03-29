(function()
{
	createNamespace('TF.RoutingMap.RoutingMapPanel').RoutingMapContextMenu = RoutingMapContextMenu;

	function RoutingMapContextMenu(mapCanvas)
	{
		var self = this;

		self.selectedMenuItemHeader = [];
		self.currentTabRouteState;
		self.mapCanvas = mapCanvas;

		PubSub.subscribe("DocumentManagerViewModel_TabChange", self.getCurrentTabRouteState.bind(self));
	};

	RoutingMapContextMenu.prototype.showContextMenu = function(documentViewModel, map, arcgis, e, routeState, lastPreventKey)
	{
		var container = documentViewModel.$mapDiv.closest('#pageContent')
			parcelPointsViewModel = documentViewModel.parcelPaletteViewModel,
			boundaryViewModel = documentViewModel.boundaryPaletteViewModel,
			mapEditingPaletteViewModel = documentViewModel.mapEditingPaletteViewModel,
			routingPaletteViewModel = documentViewModel.routingPaletteViewModel,
			geoSearchPaletteViewModel = documentViewModel.geoSearchPaletteViewModel,
			travelScenariosPaletteViewModel = documentViewModel.travelScenariosPaletteViewModel,
			self = this;

		this.getDataModalByPosition(map, arcgis, e, parcelPointsViewModel, boundaryViewModel, mapEditingPaletteViewModel, routingPaletteViewModel, travelScenariosPaletteViewModel).then(function(data)
		{
			if (documentViewModel._lastPreventKey != lastPreventKey)
			{
				return;
			}

			if (data.length == 0 && this.isLockAlert)
			{
				return;
			}

			var contextMenu = self.buildContextMenuInternal(container, data, parcelPointsViewModel, boundaryViewModel, mapEditingPaletteViewModel, routingPaletteViewModel, geoSearchPaletteViewModel, routeState, documentViewModel);

			if (contextMenu.root.children.length == 0)
			{
				return;
			}

			contextMenu.onClickEvent = function(menuItem, e)
			{
				return onMenuItemClick(menuItem, e, parcelPointsViewModel, boundaryViewModel, mapEditingPaletteViewModel, routingPaletteViewModel, routeState);
			};

			contextMenu.showMenu(e.native, null, 75, ".map-page");
			for (var i = 0; i < self.selectedMenuItemHeader.length; i++)
			{
				if (self.selectedMenuItemHeader[i].routeState == routeState)
				{
					contextMenu.enumAllMenuItems(function(contextMenu, menuItem)
					{
						if (menuItem.config.data &&
							menuItem.config.data.id == self.selectedMenuItemHeader[i].id &&
							self.selectedMenuItemHeader[i].operation == menuItem.config.id)
						{
							setFontToBold(menuItem);
						}
					});
				}
			}
		});
	}
	
	RoutingMapContextMenu.prototype.clearOperation = function()
	{
		var self = this;

		self.selectedMenuItemHeader.map(function(item)
		{
			if (item.routeState == self.currentTabRouteState)
			{
				item.id = -1;
				item.operation = "";
			}
		});
	}

	RoutingMapContextMenu.prototype.getCurrentTabRouteState = function(event, document)
	{
		this.currentTabRouteState = document.routeState;
	}

	RoutingMapContextMenu.prototype.onFieldTripMapClick_InitMapCanvasObject = function(event, mapCanvas)
	{
		this.mapCanvas = mapCanvas;
	}

	RoutingMapContextMenu.prototype.onFieldTripMapClick_FieldTripStop = function(dataWrapper)
	{
		if(this.mapCanvas.editModals().filter((c) => c.obVisible()).length > 0)
		{
			return;
		}

		var container = $(".map").closest('#pageContent');

		var data = dataWrapper.data?.map((item) => {
			return {
				type: "tripstop",
				FieldTripId: item.FieldTripId,
				id: item.id,
				Sequence: item.Sequence,
				DBID: item.DBID
			};
		});

		var contextMenu = this.buildContextMenuInternal(container, data, null, null, null, this.mapCanvas.routingPaletteViewModel, null, null, this.mapCanvas.travelScenariosPaletteViewModel);

		if (contextMenu.root.children.length == 0)
		{
			return;
		}

		contextMenu.showMenu(dataWrapper.event.native, null, 75, ".map-page");

	}

	RoutingMapContextMenu.prototype.setFontToBold = function(menuItem)
	{
		//set menuItem to bold
		menuItem.html.addClass('selected_operation');
		if (menuItem.parent != null && menuItem.parent.header != 'root')
		{
			setFontToBold(menuItem.parent);
		}
	}

	RoutingMapContextMenu.prototype.getText = function(data, type, boundaryViewModel)
	{
		if (type == "trip")
		{
			return data.Name || "unnamed";
		}
	}

	RoutingMapContextMenu.prototype.buildContextMenuInternal = function(container, data, parcelPointsViewModel, boundaryViewModel, mapEditingPaletteViewModel, routingPaletteViewModel, geoSearchPaletteViewModel, routeState, travelScenariosPaletteViewModel)
	{
		var tempParentMenuItem;
		var contextMenu = new TF.RoutingMap.ContextMenu(container);
		var contextMenuCategories = {
			trips: [],
			tripSessions: [],
			tripPaths: [],
			travelRegions: [],
			default: []
		};
		let isAdmin = tf.authManager.authorizationInfo.isAdmin,
			eventsManager = routingPaletteViewModel.fieldTripPaletteSectionVM.eventsManager,
			hasAuthForRoutingMapAdd = tf.authManager.isAuthorizedFor("routingMap", "add"),
			hasAuthForRoutingMapEdit = tf.authManager.isAuthorizedFor("routingMap", "edit"),
			hasAuthForRoutingMap = hasAuthForRoutingMapAdd || hasAuthForRoutingMapEdit,
			hasAuthForEditMap = tf.authManager.isAuthorizedFor('mapEdit', ['edit', 'add']),
			tripItems = {};
		for (var i = 0; i < data.length; i++)
		{
			var menuItemData = data[i];
			if (!menuItemData) continue;

			let type = typeof (menuItemData.type) == "string" ? menuItemData.type.toLowerCase() : "";
			if (!type)
			{
				type = typeof (menuItemData.dataType) == "string" ? menuItemData.dataType.toLowerCase() : type;
			}

			if (type == 'fieldtrip')
			{
				let tripName = getText(menuItemData, 'fieldtrip'),
					realTripName = menuItemData.trip.Name;

				if (!tripItems[realTripName])
				{
					let tripItem = new TF.RoutingMap.MenuItem({
						header: "<span class='trip-color-icon' style='background-color:" + menuItemData.color + "'></span>" + realTripName,
						title: realTripName,
						type: 'fieldtrip'
					});

					tripItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Details',
						icon: 'record-details',
						data: menuItemData,
						disable: !menuItemData.trip.Id,
						click: eventsManager.tripDetailsClick.bind(eventsManager, menuItemData.trip)
					}));

					tripItems[realTripName] = tripItem;
				}

				if (menuItemData.pathLineType === TF.Helper.TripHelper.PathLineTypes.Path)
				{
					tempParentMenuItem = new TF.RoutingMap.MenuItem({
						header: "<span class='trip-color-icon' style='background-color:" + menuItemData.color + "'></span>" + tripName,
						title: tripName,
						type: 'tripPath'
					});

					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Directions',
						icon: 'directions',
						data: menuItemData,
						click: eventsManager.tripPathInfoClick.bind(eventsManager, menuItemData)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Edit',
						icon: 'reshape',
						data: menuItemData,
						disable: !hasAuthForRoutingMap || menuItemData.trip.OpenType === 'View',
						click: eventsManager.tripPathEditClick.bind(eventsManager, menuItemData)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Recalculate',
						icon: 'refresh',
						data: menuItemData,
						disable: !hasAuthForRoutingMap || menuItemData.trip.OpenType === 'View',
						click: eventsManager.tripPathRefreshClick.bind(eventsManager, menuItemData)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						isDevider: true
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Delete',
						icon: 'delete',
						data: menuItemData,
						disable: !hasAuthForRoutingMap || menuItemData.trip.OpenType === 'View',
						click: eventsManager.tripPathDeleteClick.bind(eventsManager, menuItemData)
					}));
					contextMenuCategories.tripPaths.push(tempParentMenuItem);
				}
			} else if (type == 'tripstop')
			{
				let trip = routingPaletteViewModel.dataModel.getFieldTripById(menuItemData.FieldTripId),
					fieldTripStopId = menuItemData.type === "tripStop" ? menuItemData.id : menuItemData.FieldTripStopId,
					fieldTripStop = menuItemData.Sequence ? routingPaletteViewModel.dataModel.getFieldTripStopBySequence(trip, menuItemData.Sequence) : 
															routingPaletteViewModel.dataModel.getFieldTripStop(fieldTripStopId),
					tripName = trip.Name;
				if (!tripItems[tripName])
				{
					let tripItem = new TF.RoutingMap.MenuItem({
						header: "<span class='trip-color-icon' style='background-color:" + trip.color + "'></span>" + tripName,
						title: tripName,
						type: 'trip'
					});

					tripItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Details',
						icon: 'record-details',
						data: menuItemData,
						disable: !trip.Id,
						click: eventsManager.tripDetailsClick.bind(eventsManager, trip)
					}));

					tripItems[tripName] = tripItem;
				}

				var labelColor = TF.isLightness(trip.color) ? "#000000" : "#ffffff";
				var disableDelete = !hasAuthForRoutingMap || trip.OpenType === 'View' || fieldTripStop.PrimaryDestination || fieldTripStop.PrimaryDeparture;
				var disableMove = !hasAuthForRoutingMap || trip.OpenType === 'View';

				tempParentMenuItem = new TF.RoutingMap.MenuItem({
					header: "<span class='trip-stop-color-icon' style='border-color:rgb(0,0,0);color:" + labelColor + ";background-color:" + trip.color + "'>" + fieldTripStop.Sequence + "</span>" + fieldTripStop.Street,
					title: fieldTripStop.Street,
					icon: null,
					type: 'tripSession'
				});
				tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
					header: 'Info',
					icon: 'info',
					data: menuItemData,
					click: eventsManager.infoClick.bind(eventsManager, menuItemData)
				}));
				tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
					isDevider: true
				}));

				tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
					header: 'Duplicate Stop',
					icon: 'copy',
					data: menuItemData,
					disable: true, // FT-3291: Disabled for Future Implementation
					click: eventsManager.copyTripStopClick.bind(eventsManager, fieldTripStop.id)
				}));

				tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
					isDevider: true
				}));

				tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
					header: 'Move Stop Location',
					icon: 'movePoint',
					data: menuItemData,
					disable: disableMove,
					id: 'tripSessionMovePoint',
					click: eventsManager.editTripStopClick.bind(eventsManager, 'movePoint', fieldTripStop.id, trip.id)
				}));
				tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
					isDevider: true
				}));

				tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
					header: 'Delete',
					icon: 'delete',
					data: menuItemData,
					disable: disableDelete,
					click: eventsManager.deleteOneClick.bind(eventsManager, fieldTripStop.id, trip.id)
				}));
				contextMenuCategories.tripSessions.push(tempParentMenuItem);
			}
			else if (type == 'travelregion')
			{
				var tempParentMenuItem = new TF.RoutingMap.MenuItem({
					header: getText(menuItemData, 'travelRegion'),
					icon: null,
					type: 'travelRegion'
				});
				tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
					header: 'Info',
					icon: 'info',
					data: menuItemData,
					click: travelScenariosPaletteViewModel.travelRegionsViewModel.eventsManager.infoClick.bind(travelScenariosPaletteViewModel.travelRegionsViewModel.eventsManager, menuItemData)
				}));
				tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
					isDevider: true
				}));
				tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
					header: 'Transform',
					icon: 'transform',
					data: menuItemData,
					id: 'trTransform',
					disable: !hasAuthForEditMap,
					click: travelScenariosPaletteViewModel.travelRegionsViewModel.eventsManager.editParcelClick.bind(travelScenariosPaletteViewModel.travelRegionsViewModel.eventsManager, 'transform', menuItemData)
				}));
				tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
					isDevider: true
				}));
				tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
					header: 'Add Region (Polygon)',
					icon: 'add',
					data: menuItemData,
					disable: !hasAuthForEditMap,
					children: [new TF.RoutingMap.MenuItem({
						header: 'Polygon',
						icon: 'polygon',
						isDefault: true,
						data: menuItemData,
						id: 'trAddPolygon',
						children: [],
						disable: !hasAuthForEditMap,
						click: travelScenariosPaletteViewModel.travelRegionsViewModel.eventsManager.addRegionClick.bind(travelScenariosPaletteViewModel.travelRegionsViewModel.eventsManager, 'polygon', menuItemData)
					}),
					new TF.RoutingMap.MenuItem({
						header: 'Rectangle',
						icon: 'rectangle',
						data: menuItemData,
						id: 'trAddRectangle',
						children: [],
						disable: !hasAuthForEditMap,
						click: travelScenariosPaletteViewModel.travelRegionsViewModel.eventsManager.addRegionClick.bind(travelScenariosPaletteViewModel.travelRegionsViewModel.eventsManager, 'rectangle', menuItemData)
					}),
					new TF.RoutingMap.MenuItem({
						header: 'Draw',
						icon: 'draw',
						data: menuItemData,
						id: 'trAddDraw',
						children: [],
						disable: !hasAuthForEditMap,
						click: travelScenariosPaletteViewModel.travelRegionsViewModel.eventsManager.addRegionClick.bind(travelScenariosPaletteViewModel.travelRegionsViewModel.eventsManager, 'draw', menuItemData)
					}),
					new TF.RoutingMap.MenuItem({
						header: 'Circle',
						icon: 'circle',
						data: menuItemData,
						id: 'trAddCircle',
						children: [],
						disable: !hasAuthForEditMap,
						click: travelScenariosPaletteViewModel.travelRegionsViewModel.eventsManager.addRegionClick.bind(travelScenariosPaletteViewModel.travelRegionsViewModel.eventsManager, 'circle', menuItemData)
					})
					],
					click: travelScenariosPaletteViewModel.travelRegionsViewModel.eventsManager.addRegionClick.bind(travelScenariosPaletteViewModel.travelRegionsViewModel.eventsManager, 'polygon', menuItemData)
				}));
				tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
					header: 'Remove Region (Polygon)',
					icon: 'remove',
					data: menuItemData,
					disable: !hasAuthForEditMap,
					children: [new TF.RoutingMap.MenuItem({
						header: 'Polygon',
						icon: 'polygon',
						data: menuItemData,
						id: 'trRemovePolygon',
						isDefault: true,
						children: [],
						disable: !hasAuthForEditMap,
						click: travelScenariosPaletteViewModel.travelRegionsViewModel.eventsManager.removeRegionClick.bind(travelScenariosPaletteViewModel.travelRegionsViewModel.eventsManager, 'polygon', menuItemData)
					}),
					new TF.RoutingMap.MenuItem({
						header: 'Rectangle',
						icon: 'rectangle',
						data: menuItemData,
						id: 'trRemoveRectangle',
						children: [],
						disable: !hasAuthForEditMap,
						click: travelScenariosPaletteViewModel.travelRegionsViewModel.eventsManager.removeRegionClick.bind(travelScenariosPaletteViewModel.travelRegionsViewModel.eventsManager, 'rectangle', menuItemData)
					}),
					new TF.RoutingMap.MenuItem({
						header: 'Draw',
						icon: 'draw',
						data: menuItemData,
						id: 'trRemoveDraw',
						children: [],
						disable: !hasAuthForEditMap,
						click: travelScenariosPaletteViewModel.travelRegionsViewModel.eventsManager.removeRegionClick.bind(travelScenariosPaletteViewModel.travelRegionsViewModel.eventsManager, 'draw', menuItemData)
					}),
					new TF.RoutingMap.MenuItem({
						header: 'Circle',
						icon: 'circle',
						data: menuItemData,
						id: 'trRemoveCircle',
						children: [],
						disable: !hasAuthForEditMap,
						click: travelScenariosPaletteViewModel.travelRegionsViewModel.eventsManager.removeRegionClick.bind(travelScenariosPaletteViewModel.travelRegionsViewModel.eventsManager, 'circle', menuItemData)
					})
					],
					click: travelScenariosPaletteViewModel.travelRegionsViewModel.eventsManager.removeRegionClick.bind(travelScenariosPaletteViewModel.travelRegionsViewModel.eventsManager, 'polygon', menuItemData)
				}));
				tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
					header: 'Redraw Region (Polygon)',
					icon: 'redraw',
					data: menuItemData,
					disable: !hasAuthForEditMap,
					children: [new TF.RoutingMap.MenuItem({
						header: 'Polygon',
						icon: 'polygon',
						isDefault: true,
						data: menuItemData,
						id: 'trRedrawPolygon',
						children: [],
						disable: !hasAuthForEditMap,
						click: travelScenariosPaletteViewModel.travelRegionsViewModel.eventsManager.redrawClick.bind(travelScenariosPaletteViewModel.travelRegionsViewModel.eventsManager, 'polygon', menuItemData)
					}),
					new TF.RoutingMap.MenuItem({
						header: 'Rectangle',
						icon: 'rectangle',
						data: menuItemData,
						id: 'trRedrawRectangle',
						children: [],
						disable: !hasAuthForEditMap,
						click: travelScenariosPaletteViewModel.travelRegionsViewModel.eventsManager.redrawClick.bind(travelScenariosPaletteViewModel.travelRegionsViewModel.eventsManager, 'rectangle', menuItemData)
					}),
					new TF.RoutingMap.MenuItem({
						header: 'Draw',
						icon: 'draw',
						data: menuItemData,
						id: 'trRedrawDraw',
						children: [],
						disable: !hasAuthForEditMap,
						click: travelScenariosPaletteViewModel.travelRegionsViewModel.eventsManager.redrawClick.bind(travelScenariosPaletteViewModel.travelRegionsViewModel.eventsManager, 'draw', menuItemData)
					}),
					new TF.RoutingMap.MenuItem({
						header: 'Circle',
						icon: 'circle',
						data: menuItemData,
						id: 'trRedrawCircle',
						children: [],
						disable: !hasAuthForEditMap,
						click: travelScenariosPaletteViewModel.travelRegionsViewModel.eventsManager.redrawClick.bind(travelScenariosPaletteViewModel.travelRegionsViewModel.eventsManager, 'circle', menuItemData)
					})
					],
					click: travelScenariosPaletteViewModel.travelRegionsViewModel.eventsManager.redrawClick.bind(travelScenariosPaletteViewModel.travelRegionsViewModel.eventsManager, 'polygon', menuItemData)
				}));
				tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
					header: 'Reshape',
					icon: 'reshape',
					data: menuItemData,
					id: 'trRedrawReshape',
					disable: !hasAuthForEditMap,
					click: travelScenariosPaletteViewModel.travelRegionsViewModel.eventsManager.reshapeClick.bind(travelScenariosPaletteViewModel.travelRegionsViewModel.eventsManager, 'reshape', menuItemData)
				}));
				tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
					isDevider: true
				}));
				tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
					header: 'Delete',
					icon: 'delete',
					data: menuItemData,
					disable: !hasAuthForEditMap,
					click: travelScenariosPaletteViewModel.travelRegionsViewModel.eventsManager.deleteClick.bind(travelScenariosPaletteViewModel.travelRegionsViewModel.eventsManager, menuItemData)
				}));
				contextMenuCategories.travelRegions.push(tempParentMenuItem);
			}
		}

		// RCM option only when nothing is returned
		if (data.length == 0)
		{
			// tempParentMenuItem = new TF.RoutingMap.MenuItem({
			// 	header: 'Default',
			// 	icon: null,
			// 	type: 'Default'
			// });
			// tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
			// 	header: 'Geo Search',
			// 	icon: null,
			// 	data: { id: -1000 },
			// 	children: [new TF.RoutingMap.MenuItem({
			// 		header: 'Polygon',
			// 		icon: 'polygon',
			// 		id: 'geoSearchPolygon',
			// 		children: [],
			// 		disable: false,
			// 		data: { id: -1000 },
			// 		click: geoSearchPaletteViewModel.eventsManager.selectAreaOptionClick.bind(geoSearchPaletteViewModel.eventsManager, 'polygon', geoSearchPaletteViewModel.eventsManager, $('.routingmap_panel' + routeState).find('.geosearch-section'))
			// 	}),
			// 	new TF.RoutingMap.MenuItem({
			// 		header: 'Rectangle',
			// 		icon: 'rectangle',
			// 		id: 'geoSearchRectangle',
			// 		children: [],
			// 		disable: false,
			// 		data: { id: -1000 },
			// 		click: geoSearchPaletteViewModel.eventsManager.selectAreaOptionClick.bind(geoSearchPaletteViewModel.eventsManager, 'rectangle', geoSearchPaletteViewModel.eventsManager, $('.routingmap_panel' + routeState).find('.geosearch-section'))
			// 	}),
			// 	new TF.RoutingMap.MenuItem({
			// 		header: 'Draw',
			// 		icon: 'draw',
			// 		id: 'geoSearchDraw',
			// 		children: [],
			// 		disable: false,
			// 		data: { id: -1000 },
			// 		click: geoSearchPaletteViewModel.eventsManager.selectAreaOptionClick.bind(geoSearchPaletteViewModel.eventsManager, 'draw', geoSearchPaletteViewModel.eventsManager, $('.routingmap_panel' + routeState).find('.geosearch-section'))
			// 	}),
			// 	new TF.RoutingMap.MenuItem({
			// 		header: 'Circle',
			// 		icon: 'circle',
			// 		id: 'geoSearchCircle',
			// 		children: [],
			// 		disable: false,
			// 		data: { id: -1000 },
			// 		click: geoSearchPaletteViewModel.eventsManager.selectAreaOptionClick.bind(geoSearchPaletteViewModel.eventsManager, 'circle', geoSearchPaletteViewModel.eventsManager, $('.routingmap_panel' + routeState).find('.geosearch-section'))
			// 	})
			// 	]
			// }));

			var travelRegionDisable = !travelScenariosPaletteViewModel.obShow() || !travelScenariosPaletteViewModel.travelRegionsViewModel.isShowMode();

			if (!travelRegionDisable)
			{
				tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
					isDevider: true
				}));
			}
			if (!travelRegionDisable)
			{
				tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
					header: 'Travel Region',
					icon: null,
					data: { id: -997 },
					disable: travelRegionDisable,
					children: [new TF.RoutingMap.MenuItem({
						header: 'Create Travel Region',
						icon: null,
						id: 'createTravelRegion',
						children: [],
						data: { id: -997 },
						disable: travelRegionDisable,
						click: travelScenariosPaletteViewModel.travelRegionsViewModel.eventsManager.createTravelRegionClick.bind(travelScenariosPaletteViewModel.travelRegionsViewModel.eventsManager)
					}),
					new TF.RoutingMap.MenuItem({
						header: 'Create Travel Region from Selection',
						icon: null,
						children: [],
						data: { id: -997 },
						disable: travelRegionDisable || mapEditingPaletteViewModel._viewModal.obCopyPolygonObject() == null,
						click: travelScenariosPaletteViewModel.travelRegionsViewModel.eventsManager.createTravelRegionFromSelectionClick.bind(travelScenariosPaletteViewModel.travelRegionsViewModel.eventsManager)
					})
					]
				}));
			}

			/*
			if (documentViewModel._map.findLayerById("searchPointLayer") && documentViewModel._map.findLayerById("searchPointLayer").graphics.length > 0)
			{
				if (clearGeofinderDisbale)
				{
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						isDevider: true
					}));
				}
				tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
					header: 'Clear Search Point',
					icon: null,
					data: { id: -986 },
					click: function()
					{
						documentViewModel._map.findLayerById("searchPointLayer").removeAll();
					}
				}));
			}
			contextMenuCategories.default.push(tempParentMenuItem);
			*/
		}

		$.each(tripItems, (k, v) => contextMenuCategories.trips.push(v));
		var allLength = 0;
		for (var key in contextMenuCategories)
		{
			allLength += contextMenuCategories[key].length;
		}
		if (allLength > 1)
		{
			function createSecondLevelContextMenu(children)
			{
				for (var i = 0; i < children.length; i++)
				{
					var child = children[i];
					contextMenu.addChild(child);
				}
			}
			for (var key in contextMenuCategories)
			{
				createSecondLevelContextMenu(contextMenuCategories[key]);
			}
		} else
		{
			function addToContextMenu(menuItems)
			{
				if (menuItems.length > 0)
				{
					contextMenu.setChildren(menuItems[0].children);
				}
			}
			for (var key in contextMenuCategories)
			{
				addToContextMenu(contextMenuCategories[key]);
			}
		}
		if (contextMenuCategories.travelRegions.length +
			contextMenuCategories.tripPaths.length +
			contextMenuCategories.trips.length +
			contextMenuCategories.tripSessions.length)
		{
			var children = contextMenu.root.children;
			contextMenu.root.children = [];

			// var tripsMenuItem = new TF.RoutingMap.MenuItem({
			// 	header: 'Trip',
			// 	icon: null
			// });
			var tripSessionsMenuItem = new TF.RoutingMap.MenuItem({
				header: 'Field Trip Stop',
				icon: null
			});
			var tripPathsMenuItem = new TF.RoutingMap.MenuItem({
				header: 'Trip Path',
				icon: null
			});

			var travelRegionsMenuItem = new TF.RoutingMap.MenuItem({
				header: 'Travel Regions',
				icon: null
			});

			// if (contextMenuCategories.trips.length > 0)
			// {
			// 	contextMenu.addChild(tripsMenuItem);
			// }
			if (contextMenuCategories.tripPaths.length > 0)
			{
				contextMenu.addChild(tripPathsMenuItem);
			}
			if (contextMenuCategories.tripSessions.length > 0)
			{
				contextMenu.addChild(tripSessionsMenuItem);
			}
			if (contextMenuCategories.travelRegions.length > 0)
			{
				contextMenu.addChild(travelRegionsMenuItem);
			}

			for (var i = 0; i < children.length; i++)
			{
				var child = children[i];

				if (child.config.type == 'fieldtrip')
				{
					if (contextMenuCategories.trips.length > 1)
						tripsMenuItem.addChild(child);
					else tripsMenuItem.setChildren(child.children);
				}
				else if (child.config.type == 'tripSession')
				{
					if (contextMenuCategories.tripSessions.length > 1)
						tripSessionsMenuItem.addChild(child);
					else tripSessionsMenuItem.setChildren(child.children);
				}
				else if (child.config.type == 'fieldTripPath')
				{
					if (contextMenuCategories.tripPaths.length > 1)
						tripPathsMenuItem.addChild(child);
					else tripPathsMenuItem.setChildren(child.children);
				}

				else if (child.config.type == 'travelRegion')
				{
					if (contextMenuCategories.travelRegions.length > 1)
						travelRegionsMenuItem.addChild(child);
					else travelRegionsMenuItem.setChildren(child.children);
				}

			}
		}

		return contextMenu;
	}

	RoutingMapContextMenu.prototype.onMenuItemClick = function(menuItem, e, parcelPaletteViewModel, boundaryPaletteViewModel, mapEditingPaletteViewModel, routingPaletteViewModel, routeState)
	{
		var selectedMenuItem = null;
		var self = this;

		if (menuItem.children.length > 0)
		{
			menuItem.children.some(function(child)
			{
				if (child.config.isDefault)
				{
					selectedMenuItem = child;
					return true;
				}
				return false;
			})
		} else selectedMenuItem = menuItem;

		if (selectedMenuItem == null)
		{
			return false;
		}
		if (selectedMenuItem.config.data &&
			existOperateData(routeState))
		{
			for (var i = 0; i < self.selectedMenuItemHeader.length; i++)
			{
				if (self.selectedMenuItemHeader[i].routeState == routeState)
				{
					if (self.selectedMenuItemHeader[i].id == selectedMenuItem.config.data.id &&
						self.selectedMenuItemHeader[i].operation == selectedMenuItem.config.id)
					{
						self.selectedMenuItemHeader[i].id = -1;
						self.selectedMenuItemHeader[i].operation = "";

						return false;
					}
					else 
					{
						if (selectedMenuItem.config.data.notSelectable)
						{
							self.selectedMenuItemHeader[i].id = -1;
							self.selectedMenuItemHeader[i].operation = "";
						}
						else
						{
							self.selectedMenuItemHeader[i].id = selectedMenuItem.config.data.id;
							self.selectedMenuItemHeader[i].operation = selectedMenuItem.config.id ? selectedMenuItem.config.id : "";
						}

					}
				}
			}
		}
		else if (!selectedMenuItem.config.data.notSelectable)
		{
			self.selectedMenuItemHeader.push({
				routeState: routeState,
				id: selectedMenuItem.config.data.id,
				operation: selectedMenuItem.config.id ? selectedMenuItem.config.id : ""
			});
		}
		return true;
	}

	RoutingMapContextMenu.prototype.existOperateData = function(routeState)
	{
		for (var i = 0; i < this.selectedMenuItemHeader.length; i++)
		{
			if (this.selectedMenuItemHeader[i].routeState == routeState)
			{
				return true;
			}
		}
		return false;
	}

	RoutingMapContextMenu.prototype.getDataModalByPosition = function(map, arcgis, e, parcelPointsViewModel, boundaryViewModel, mapEditingPaletteViewModel, routingPaletteViewModel, travelScenariosPaletteViewModel)
	{
		var tripSessionResult = [],
			tripPathResult = [],
			travelRegionResult = [];
		var featureLayerQueryPromises = [];
		var extent = TF.Helper.MapHelper.getPointExtent(map, e.mapPoint);

		if (travelScenariosPaletteViewModel.obShow())
		{
			var travelRegionLayer = map.findLayerById("travelRegionLayer");
			if (TF.Helper.MapHelper.layerVisible(map, travelRegionLayer))
			{
				travelRegionResult = getGraphicLayerIntersects(travelRegionLayer, extent);
			}
		}

		// if (mapEditingPaletteViewModel.obShow() || travelScenariosPaletteViewModel.obShow())
		// {
		// }

		// Routing Palette Graphics
		if (routingPaletteViewModel.obShow())
		{
			if (TF.Helper.MapHelper.layerVisible(map, map.findLayerById("routingFeatureLayer")))
			{
				var tripPathIntersectsResult = getGraphicLayerIntersects(map.findLayerById("routingFeatureLayer"), extent);
				tripPathIntersectsResult.forEach(function(trip)
				{
					var matchCount = 0;
					for (var i = 0; i < trip.FieldTripStops.length; i++)
					{
						var pathLineType = tf.storageManager.get("pathLineType") || "Path";
						var path = TF.Helper.TripHelper.getDrawTripPathGeometry(trip.FieldTripStops[i], trip, pathLineType);
						if (path && tf.map.ArcGIS.geometryEngine.intersects(extent, path) && i < trip.FieldTripStops.length - 1)
						{
							matchCount++;
							tripPathResult.push({
								trip: trip,
								fieldTripStop: trip.FieldTripStops[i],
								fieldTripStops: [trip.FieldTripStops[i], trip.FieldTripStops[i + 1]],
								type: trip.type,
								id: trip.id,
								Name: trip.Name,
								color: trip.color,
								pathLineType: pathLineType
							});
						}
					}

					if (matchCount > 0)
					{
						for (i = 0; i < matchCount; i++)
						{
							var result = tripPathResult[tripPathResult.length - 1 - i];
							result.Name = result.Name + " " + result.fieldTripStop.Sequence;
						}
					}
				});
			}

			if (TF.Helper.MapHelper.layerVisible(map, map.findLayerById("routingTripStopBoundaryLayer")) && routingPaletteViewModel.fieldTripPaletteSectionVM.isShowMode())
			{
				tripSessionResult = getGraphicLayerIntersects(map.findLayerById("routingTripStopBoundaryLayer"), extent);
				var tripStopIds = tripSessionResult.map(x => x.TripStopId);
				var stops = getGraphicLayerIntersects(map.findLayerById("routingTripStopLayer"), extent, 6, (x) => { return x.attributes && x.attributes.type === "tripStop"; });
				tripSessionResult = tripSessionResult.concat(stops.filter(x => tripStopIds.indexOf(x.id) < 0).map(tripStop =>
				{
					if (tripStop.boundary && tripStop.boundary.geometry)
					{
						return tripStop.boundary;
					}
					return tripStop;
				}));
			}
		}

		function filterUnLockItems(lockData, result)
		{
			if (result.length > 0 && lockData)
			{
				return lockData.filterUnLockItems(result, false).then(function(data)
				{
					// alert lock info for streets
					if (lockData.options.type() == "myStreets" && result.length > 0 && data.length == 0)
					{
						self.isLockAlert = true;
						tf.promiseBootbox.alert("Street Segment is locked for Editing").then(function()
						{
							self.isLockAlert = false;
						});
					}
					return data;
				});
			}
			return Promise.resolve(result || []);
		}

		function getFullInfo(result)
		{
			if (result.length > 0)
			{
				return parcelPointsViewModel.dataModel.getFullInfo(result);
			}
			return Promise.resolve(result || []);
		}

		return Promise.all(featureLayerQueryPromises).then(function()
		{

			return Promise.all([
				filterUnLockItems(routingPaletteViewModel.fieldTripPaletteSectionVM.dataModel.tripLockData, tripSessionResult),
				filterUnLockItems(routingPaletteViewModel.fieldTripPaletteSectionVM.dataModel.tripLockData, tripPathResult),
				filterUnLockItems(travelScenariosPaletteViewModel.travelRegionsViewModel.dataModel.travelRegionLockData, travelRegionResult),
			])
				.then(function(items)
				{
					// items = items.concat(trialStopResult);
					return items.reduce(function(a, b)
					{
						return a.concat(b);
					});
				});

		});
	}

	RoutingMapContextMenu.prototype.getGraphicLayerIntersects = function(layer, extent, tolerance, filter)
	{
		var items = [];
		layer.graphics.items.map(function(graphic)
		{
			var testGeometry = graphic.geometry;
			if (tolerance)
			{
				if (!graphic.attributes || !graphic.attributes.dataModel || (filter && !filter(graphic)))
				{
					return;
				}
				var mapScaleRate = TF.RoutingMap.MapEditingPalette.MyStreetsHelper.getScaleRate(layer.parent.mapView.map)
				testGeometry = tf.map.ArcGIS.geometryEngine.buffer(graphic.geometry, tolerance * mapScaleRate, "meters")
			}

			if (graphic && graphic.visible && extent.intersects(testGeometry))
			{
				items.push(graphic.attributes.dataModel);
			}
		});
		return items;
	}

	RoutingMapContextMenu.prototype.dispose = function()
	{
		PubSub.unsubscribe("DocumentManagerViewModel_TabChange");
	}
}());