(function()
{
	createNamespace('TF.RoutingMap.RoutingMapPanel').RoutingMapContextMenu = (function RoutingMapContextMenu()
	{
		var selectedMenuItemHeader = [];
		var currentTabRouteState;

		PubSub.subscribe("DocumentManagerViewModel_TabChange", getCurrentTabRouteState);

		function getCurrentTabRouteState(event, document)
		{
			currentTabRouteState = document.routeState;
		}

		function setFontToBold(menuItem)
		{
			//set menuItem to bold
			menuItem.html.addClass('selected_operation');
			if (menuItem.parent != null && menuItem.parent.header != 'root')
			{
				setFontToBold(menuItem.parent);
			}
		}

		function getText(data, type, boundaryViewModel)
		{
			if (type == "parcelPoints")
			{
				return data.addressNumber + " " + data.streetName;
			} else if (type == "boundary")
			{
				var school = boundaryViewModel.dataModel.getSchoolByCode(data.School);
				return school != null ? school.Name + " (" + school.School + ")" : "None";
			} else if (type == "populationRegion" || type == "travelRegion")
			{
				return data.name ? data.name : "unnamed";
			} else if (type == "mystreets")
			{
				return data.Street;
			} else if (type == "railroad")
			{
				return $.trim(data.Name) || "unnamed";
			} else if (type == "zipCode")
			{
				return data.zip;
			} else if (type == "municipalBoundary")
			{
				return data.name;
			} else if (type == "water")
			{
				return data.Name || "unnamed";
			} else if (type == "landmark")
			{
				return data.Name || "unnamed";
			} else if (type == "trip")
			{
				return data.Name || "unnamed";
			} else if (type == "student")
			{
				return data.FirstName + " " + data.LastName || "unnamed";
			} else if (type == "stopPoolBoundary")
			{
				return boundaryViewModel.dataModel.findByStopId(data.StopId).Street || "unnamed";
			} else if (type == "trialStopBoundary")
			{
				return data.Street || "unnamed";
			} else if (type == "nonEligibleZone")
			{
				return data.Name;
			}
		}

		function buildContextMenuInternal(container, data, parcelPointsViewModel, boundaryViewModel, mapEditingPaletteViewModel, routingPaletteViewModel, geoSearchPaletteViewModel, routeState, documentViewModel)
		{
			var tempParentMenuItem;
			var contextMenu = new TF.RoutingMap.ContextMenu(container);
			var contextMenuCategories = {
				parcels: [],
				points: [],
				boundaries: [],
				popRegions: [],
				trips: [],
				tripSessions: [],
				tripPaths: [],
				students: [],
				streets: [],
				travelRegions: [],
				railroads: [],
				zipCodes: [],
				municipalBoundaries: [],
				water: [],
				landmarks: [],
				stopPools: [],
				trialStops: [],
				nonEligibleZones: [],
				default: []
			};
			let isAdmin = tf.authManager.authorizationInfo.isAdmin,
				hasAuthForRoutingMapAdd = tf.authManager.isAuthorizedFor("routingMap", "add"),
				hasAuthForRoutingMapEdit = tf.authManager.isAuthorizedFor("routingMap", "edit"),
				hasAuthForRoutingMap = hasAuthForRoutingMapAdd || hasAuthForRoutingMapEdit,
				hasAuthForStudent = tf.authManager.isAuthorizedFor("student", "read"),
				hasAuthForEditMap = tf.authManager.isAuthorizedFor('mapEdit', ['edit', 'add']),
				travelScenariosPaletteViewModel = documentViewModel.travelScenariosPaletteViewModel,
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

				if (type == 'parcel')
				{
					tempParentMenuItem = new TF.RoutingMap.MenuItem({
						header: getText(menuItemData, 'parcelPoints'),
						icon: null,
						type: 'parcelPoints'
					});
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Info',
						icon: 'info',
						data: menuItemData,
						click: parcelPointsViewModel.eventsManager.infoClick.bind(parcelPointsViewModel.eventsManager, menuItemData)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						isDevider: true
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Transform',
						icon: 'transform',
						data: menuItemData,
						id: 'parcelTransform',
						disable: !isAdmin,
						click: parcelPointsViewModel.eventsManager.editParcelClick.bind(parcelPointsViewModel.eventsManager, 'transform', menuItemData)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Move Address Point',
						icon: 'movePoint',
						data: menuItemData,
						id: 'parcelMovePoint',
						disable: !isAdmin,
						click: parcelPointsViewModel.eventsManager.movePointClick.bind(parcelPointsViewModel.eventsManager, 'movePoint', menuItemData)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						isDevider: true
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Add Region (Polygon)',
						icon: 'add',
						data: menuItemData,
						disable: !isAdmin,
						children: [new TF.RoutingMap.MenuItem({
							header: 'Polygon',
							icon: 'polygon',
							isDefault: true,
							data: menuItemData,
							id: 'parcelAddPolygon',
							children: [],
							disable: !isAdmin,
							click: parcelPointsViewModel.eventsManager.addRegionClick.bind(parcelPointsViewModel.eventsManager, 'polygon', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Rectangle',
							icon: 'rectangle',
							data: menuItemData,
							id: 'parcelAddRectangle',
							children: [],
							disable: !isAdmin,
							click: parcelPointsViewModel.eventsManager.addRegionClick.bind(parcelPointsViewModel.eventsManager, 'rectangle', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Draw',
							icon: 'draw',
							data: menuItemData,
							id: 'parcelAddDraw',
							children: [],
							disable: !isAdmin,
							click: parcelPointsViewModel.eventsManager.addRegionClick.bind(parcelPointsViewModel.eventsManager, 'draw', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Circle',
							icon: 'circle',
							data: menuItemData,
							id: 'parcelAddCircle',
							children: [],
							disable: !isAdmin,
							click: parcelPointsViewModel.eventsManager.addRegionClick.bind(parcelPointsViewModel.eventsManager, 'circle', menuItemData)
						})
						],
						click: parcelPointsViewModel.eventsManager.addRegionClick.bind(parcelPointsViewModel.eventsManager, 'polygon', menuItemData)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Remove Region (Polygon)',
						icon: 'remove',
						data: menuItemData,
						disable: !isAdmin,
						children: [new TF.RoutingMap.MenuItem({
							header: 'Polygon',
							icon: 'polygon',
							isDefault: true,
							data: menuItemData,
							id: 'parcelRemovePolygon',
							children: [],
							disable: !isAdmin,
							click: parcelPointsViewModel.eventsManager.removeRegionClick.bind(parcelPointsViewModel.eventsManager, 'polygon', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Rectangle',
							icon: 'rectangle',
							data: menuItemData,
							id: 'parcelRemoveRectangle',
							children: [],
							disable: !isAdmin,
							click: parcelPointsViewModel.eventsManager.removeRegionClick.bind(parcelPointsViewModel.eventsManager, 'rectangle', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Draw',
							icon: 'draw',
							data: menuItemData,
							id: 'parcelRemoveDraw',
							children: [],
							disable: !isAdmin,
							click: parcelPointsViewModel.eventsManager.removeRegionClick.bind(parcelPointsViewModel.eventsManager, 'draw', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Circle',
							icon: 'circle',
							data: menuItemData,
							id: 'parcelRemoveCircle',
							children: [],
							disable: !isAdmin,
							click: parcelPointsViewModel.eventsManager.removeRegionClick.bind(parcelPointsViewModel.eventsManager, 'circle', menuItemData)
						})
						],
						click: parcelPointsViewModel.eventsManager.removeRegionClick.bind(parcelPointsViewModel.eventsManager, 'polygon', menuItemData)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Redraw Region (Polygon)',
						icon: 'redraw',
						data: menuItemData,
						disable: !isAdmin,
						children: [new TF.RoutingMap.MenuItem({
							header: 'Polygon',
							icon: 'polygon',
							isDefault: true,
							data: menuItemData,
							id: 'parcelRedrawPolygon',
							children: [],
							disable: !isAdmin,
							click: parcelPointsViewModel.eventsManager.redrawClick.bind(parcelPointsViewModel.eventsManager, 'polygon', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Rectangle',
							icon: 'rectangle',
							data: menuItemData,
							id: 'parcelRedrawRectangle',
							children: [],
							disable: !isAdmin,
							click: parcelPointsViewModel.eventsManager.redrawClick.bind(parcelPointsViewModel.eventsManager, 'rectangle', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Draw',
							icon: 'draw',
							data: menuItemData,
							id: 'parcelRedrawDraw',
							children: [],
							disable: !isAdmin,
							click: parcelPointsViewModel.eventsManager.redrawClick.bind(parcelPointsViewModel.eventsManager, 'draw', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Circle',
							icon: 'circle',
							data: menuItemData,
							id: 'parcelRedrawCircle',
							children: [],
							disable: !isAdmin,
							click: parcelPointsViewModel.eventsManager.redrawClick.bind(parcelPointsViewModel.eventsManager, 'circle', menuItemData)
						})
						],
						click: parcelPointsViewModel.eventsManager.redrawClick.bind(parcelPointsViewModel.eventsManager, 'polygon', menuItemData)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Reshape',
						icon: 'reshape',
						data: menuItemData,
						id: 'parcelReshape',
						disable: !isAdmin,
						click: parcelPointsViewModel.eventsManager.reshapeClick.bind(parcelPointsViewModel.eventsManager, 'reshape', menuItemData)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						isDevider: true
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Delete',
						icon: 'delete',
						data: menuItemData,
						disable: !isAdmin,
						click: parcelPointsViewModel.eventsManager.deleteOneClick.bind(parcelPointsViewModel.eventsManager, menuItemData)
					}));
					contextMenuCategories.parcels.push(tempParentMenuItem);
				} else if (type == 'point')
				{
					tempParentMenuItem = new TF.RoutingMap.MenuItem({
						header: getText(menuItemData, 'parcelPoints'),
						icon: null,
						type: 'parcelPoints'
					});
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Info',
						icon: 'info',
						data: menuItemData,
						click: parcelPointsViewModel.eventsManager.infoClick.bind(parcelPointsViewModel.eventsManager, menuItemData)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						isDevider: true
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Move Address Point',
						icon: 'movePoint',
						data: menuItemData,
						id: 'movePoint',
						disable: !isAdmin,
						click: parcelPointsViewModel.eventsManager.movePointClick.bind(parcelPointsViewModel.eventsManager, 'movePoint', menuItemData)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Add Parcel Boundary (Polygon)',
						icon: 'add',
						data: menuItemData,
						disable: !isAdmin,
						children: [new TF.RoutingMap.MenuItem({
							header: 'Polygon',
							icon: 'polygon',
							isDefault: true,
							data: menuItemData,
							id: 'pointAddPolygon',
							children: [],
							disable: !isAdmin,
							click: parcelPointsViewModel.eventsManager.addRegionToPointClick.bind(parcelPointsViewModel.eventsManager, 'polygon', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Rectangle',
							icon: 'rectangle',
							data: menuItemData,
							id: 'pointAddRectangle',
							children: [],
							disable: !isAdmin,
							click: parcelPointsViewModel.eventsManager.addRegionToPointClick.bind(parcelPointsViewModel.eventsManager, 'rectangle', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Draw',
							icon: 'draw',
							data: menuItemData,
							id: 'pointAddDraw',
							children: [],
							disable: !isAdmin,
							click: parcelPointsViewModel.eventsManager.addRegionToPointClick.bind(parcelPointsViewModel.eventsManager, 'draw', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Circle',
							icon: 'circle',
							data: menuItemData,
							id: 'pointAddCircle',
							children: [],
							disable: !isAdmin,
							click: parcelPointsViewModel.eventsManager.addRegionToPointClick.bind(parcelPointsViewModel.eventsManager, 'circle', menuItemData)
						})
						],
						click: parcelPointsViewModel.eventsManager.addRegionToPointClick.bind(parcelPointsViewModel.eventsManager, 'polygon', menuItemData)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Delete',
						icon: 'delete',
						data: menuItemData,
						disable: !isAdmin,
						click: parcelPointsViewModel.eventsManager.deleteOneClick.bind(parcelPointsViewModel.eventsManager, menuItemData)
					}));
					contextMenuCategories.points.push(tempParentMenuItem);
				} else if (type == 'schoolboundary')
				{
					tempParentMenuItem = new TF.RoutingMap.MenuItem({
						header: getText(menuItemData, 'boundary', boundaryViewModel),
						icon: null,
						type: 'boundaries'
					});
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Info',
						icon: 'info',
						data: menuItemData,
						click: boundaryViewModel.eventsManager.infoClick.bind(boundaryViewModel.eventsManager, menuItemData)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						isDevider: true
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Copy to Population Region',
						title: 'Copy to Population Region',
						icon: '',
						data: menuItemData,
						id: 'bdyNewPopulationFromSelected',
						disable: !isAdmin || !boundaryViewModel.populationRegionViewModel.isShowMode(),
						click: boundaryViewModel.eventsManager.addPopulationRegionFromSchoolBoundaryClick.bind(boundaryViewModel.eventsManager, menuItemData)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						isDevider: true
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Transform',
						icon: 'transform',
						data: menuItemData,
						id: 'bdyTransform',
						disable: !isAdmin,
						click: boundaryViewModel.eventsManager.editParcelClick.bind(boundaryViewModel.eventsManager, 'transform', menuItemData)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						isDevider: true
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Add Region (Polygon)',
						icon: 'add',
						data: menuItemData,
						disable: !isAdmin,
						children: [new TF.RoutingMap.MenuItem({
							header: 'Polygon',
							icon: 'polygon',
							isDefault: true,
							data: menuItemData,
							id: 'bdyAddPolygon',
							children: [],
							disable: !isAdmin,
							click: boundaryViewModel.eventsManager.addRegionClick.bind(boundaryViewModel.eventsManager, 'polygon', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Rectangle',
							icon: 'rectangle',
							data: menuItemData,
							id: 'bdyAddRectangle',
							children: [],
							disable: !isAdmin,
							click: boundaryViewModel.eventsManager.addRegionClick.bind(boundaryViewModel.eventsManager, 'rectangle', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Draw',
							icon: 'draw',
							data: menuItemData,
							id: 'bdyAddDraw',
							children: [],
							disable: !isAdmin,
							click: boundaryViewModel.eventsManager.addRegionClick.bind(boundaryViewModel.eventsManager, 'draw', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Circle',
							icon: 'circle',
							data: menuItemData,
							id: 'bdyAddCircle',
							children: [],
							disable: !isAdmin,
							click: boundaryViewModel.eventsManager.addRegionClick.bind(boundaryViewModel.eventsManager, 'circle', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Add Region from Selected Population Region',
							title: 'Add Region from Selected Population Region',
							icon: '',
							data: menuItemData,
							id: 'bdyAddFromSelected',
							disable: !isAdmin || !boundaryViewModel.eventsManager.obHighlightedPopulation(),
							children: [],
							click: boundaryViewModel.eventsManager.addRegionFromSelectedClick.bind(boundaryViewModel.eventsManager, menuItemData)
						})
						],
						click: boundaryViewModel.eventsManager.addRegionClick.bind(boundaryViewModel.eventsManager, 'polygon', menuItemData)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Remove Region (Polygon)',
						icon: 'remove',
						data: menuItemData,
						disable: !isAdmin,
						children: [new TF.RoutingMap.MenuItem({
							header: 'Polygon',
							icon: 'polygon',
							isDefault: true,
							data: menuItemData,
							id: 'bdyRemovePolygon',
							children: [],
							disable: !isAdmin,
							click: boundaryViewModel.eventsManager.removeRegionClick.bind(boundaryViewModel.eventsManager, 'polygon', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Rectangle',
							icon: 'rectangle',
							data: menuItemData,
							id: 'bdyRemoveRectangle',
							children: [],
							disable: !isAdmin,
							click: boundaryViewModel.eventsManager.removeRegionClick.bind(boundaryViewModel.eventsManager, 'rectangle', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Draw',
							icon: 'draw',
							data: menuItemData,
							id: 'bdyRemoveDraw',
							children: [],
							disable: !isAdmin,
							click: boundaryViewModel.eventsManager.removeRegionClick.bind(boundaryViewModel.eventsManager, 'draw', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Circle',
							icon: 'circle',
							data: menuItemData,
							id: 'bdyRemoveCircle',
							children: [],
							disable: !isAdmin,
							click: boundaryViewModel.eventsManager.removeRegionClick.bind(boundaryViewModel.eventsManager, 'circle', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Remove Region from Selected Population Region',
							title: 'Remove Region from Selected Population Region',
							icon: '',
							data: menuItemData,
							id: 'bdyRemoveFromSelected',
							disable: !isAdmin || !boundaryViewModel.schoolBoundaryViewModel.isShowMode() || !boundaryViewModel.eventsManager.obHighlightedPopulation() || !boundaryViewModel.eventsManager.isBoundaryIntersectWithSelected.call(boundaryViewModel.eventsManager, menuItemData),
							children: [],
							click: boundaryViewModel.eventsManager.removeRegionFromSelectedClick.bind(boundaryViewModel.eventsManager, menuItemData)
						})
						],
						click: boundaryViewModel.eventsManager.removeRegionClick.bind(boundaryViewModel.eventsManager, 'polygon', menuItemData)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Redraw Region (Polygon)',
						icon: 'redraw',
						data: menuItemData,
						disable: !isAdmin,
						children: [new TF.RoutingMap.MenuItem({
							header: 'Polygon',
							icon: 'polygon',
							isDefault: true,
							data: menuItemData,
							id: 'bdyRedrawPolygon',
							children: [],
							disable: !isAdmin,
							click: boundaryViewModel.eventsManager.redrawClick.bind(boundaryViewModel.eventsManager, 'polygon', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Rectangle',
							icon: 'rectangle',
							data: menuItemData,
							id: 'bdyRedrawRectangle',
							children: [],
							disable: !isAdmin,
							click: boundaryViewModel.eventsManager.redrawClick.bind(boundaryViewModel.eventsManager, 'rectangle', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Draw',
							icon: 'draw',
							data: menuItemData,
							id: 'bdyRedrawDraw',
							children: [],
							disable: !isAdmin,
							click: boundaryViewModel.eventsManager.redrawClick.bind(boundaryViewModel.eventsManager, 'draw', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Circle',
							icon: 'circle',
							data: menuItemData,
							id: 'bdyRedrawCircle',
							children: [],
							disable: !isAdmin,
							click: boundaryViewModel.eventsManager.redrawClick.bind(boundaryViewModel.eventsManager, 'circle', menuItemData)
						})
						],
						click: boundaryViewModel.eventsManager.redrawClick.bind(boundaryViewModel.eventsManager, 'polygon', menuItemData)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Reshape',
						icon: 'reshape',
						data: menuItemData,
						id: 'bdyReshape',
						disable: !isAdmin,
						click: boundaryViewModel.eventsManager.reshapeClick.bind(boundaryViewModel.eventsManager, 'reshape', menuItemData)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						isDevider: true
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Delete',
						icon: 'delete',
						data: menuItemData,
						disable: !isAdmin,
						click: boundaryViewModel.eventsManager.deleteClick.bind(boundaryViewModel.eventsManager, menuItemData)
					}));
					contextMenuCategories.boundaries.push(tempParentMenuItem);
				} else if (type == 'populationregion')
				{
					tempParentMenuItem = new TF.RoutingMap.MenuItem({
						header: getText(menuItemData, 'populationRegion'),
						icon: null,
						type: 'boundaries'
					});
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Info',
						icon: 'info',
						data: menuItemData,
						click: boundaryViewModel.eventsManager.infoClick.bind(boundaryViewModel.eventsManager, menuItemData)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						isDevider: true
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Copy to School Boundary',
						title: 'Copy to School Boundary',
						icon: '',
						data: menuItemData,
						disable: !isAdmin || !boundaryViewModel.schoolBoundaryViewModel.isShowMode() || (boundaryViewModel.dataModel.getSelectedBoundarySet() ? false : true),
						id: 'regNewPopulationFromSelected',
						click: boundaryViewModel.eventsManager.addSchoolBoundaryFromPopulationRegionClick.bind(boundaryViewModel.eventsManager, menuItemData)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						isDevider: true
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Transform',
						icon: 'transform',
						data: menuItemData,
						id: 'regTransform',
						disable: !isAdmin,
						click: boundaryViewModel.eventsManager.editParcelClick.bind(boundaryViewModel.eventsManager, 'transform', menuItemData)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						isDevider: true
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Add Region (Polygon)',
						icon: 'add',
						data: menuItemData,
						disable: !isAdmin,
						children: [new TF.RoutingMap.MenuItem({
							header: 'Polygon',
							icon: 'polygon',
							isDefault: true,
							data: menuItemData,
							id: 'regAddPolygon',
							children: [],
							disable: !isAdmin,
							click: boundaryViewModel.eventsManager.addRegionClick.bind(boundaryViewModel.eventsManager, 'polygon', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Rectangle',
							icon: 'rectangle',
							data: menuItemData,
							id: 'regAddRectangle',
							children: [],
							disable: !isAdmin,
							click: boundaryViewModel.eventsManager.addRegionClick.bind(boundaryViewModel.eventsManager, 'rectangle', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Draw',
							icon: 'draw',
							data: menuItemData,
							id: 'regAddDraw',
							children: [],
							disable: !isAdmin,
							click: boundaryViewModel.eventsManager.addRegionClick.bind(boundaryViewModel.eventsManager, 'draw', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Circle',
							icon: 'circle',
							data: menuItemData,
							id: 'regAddCircle',
							children: [],
							disable: !isAdmin,
							click: boundaryViewModel.eventsManager.addRegionClick.bind(boundaryViewModel.eventsManager, 'circle', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Add Region from Selected School Boundary',
							title: 'Add Region from Selected School Boundary',
							icon: '',
							data: menuItemData,
							id: 'regAddFromSelected',
							children: [],
							disable: !isAdmin || !boundaryViewModel.eventsManager.obHighlightedBoundary() || !boundaryViewModel.eventsManager.isBoundaryIntersectWithSelected.call(boundaryViewModel.eventsManager, menuItemData),
							click: boundaryViewModel.eventsManager.addRegionFromSelectedClick.bind(boundaryViewModel.eventsManager, menuItemData)
						})
						],
						click: boundaryViewModel.eventsManager.addRegionClick.bind(boundaryViewModel.eventsManager, 'polygon', menuItemData)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Remove Region (Polygon)',
						icon: 'remove',
						data: menuItemData,
						disable: !isAdmin,
						children: [new TF.RoutingMap.MenuItem({
							header: 'Polygon',
							icon: 'polygon',
							data: menuItemData,
							id: 'regRemovePolygon',
							isDefault: true,
							children: [],
							disable: !isAdmin,
							click: boundaryViewModel.eventsManager.removeRegionClick.bind(boundaryViewModel.eventsManager, 'polygon', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Rectangle',
							icon: 'rectangle',
							data: menuItemData,
							id: 'regRemoveRectangle',
							children: [],
							disable: !isAdmin,
							click: boundaryViewModel.eventsManager.removeRegionClick.bind(boundaryViewModel.eventsManager, 'rectangle', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Draw',
							icon: 'draw',
							data: menuItemData,
							id: 'regRemoveDraw',
							children: [],
							disable: !isAdmin,
							click: boundaryViewModel.eventsManager.removeRegionClick.bind(boundaryViewModel.eventsManager, 'draw', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Circle',
							icon: 'circle',
							data: menuItemData,
							id: 'regRemoveCircle',
							children: [],
							disable: !isAdmin,
							click: boundaryViewModel.eventsManager.removeRegionClick.bind(boundaryViewModel.eventsManager, 'circle', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Remove Region from Selected School Boundary ',
							title: 'Remove Region from Selected School Boundary ',
							icon: '',
							data: menuItemData,
							id: 'regRemoveFromSelected',
							children: [],
							disable: !boundaryViewModel.eventsManager.obHighlightedBoundary() || !boundaryViewModel.eventsManager.isBoundaryIntersectWithSelected.call(boundaryViewModel.eventsManager, menuItemData),
							click: boundaryViewModel.eventsManager.removeRegionFromSelectedClick.bind(boundaryViewModel.eventsManager, menuItemData)
						})
						],
						click: boundaryViewModel.eventsManager.removeRegionClick.bind(boundaryViewModel.eventsManager, 'polygon', menuItemData)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Redraw Region (Polygon)',
						icon: 'redraw',
						data: menuItemData,
						disable: !isAdmin,
						children: [new TF.RoutingMap.MenuItem({
							header: 'Polygon',
							icon: 'polygon',
							isDefault: true,
							data: menuItemData,
							id: 'regRedrawPolygon',
							children: [],
							disable: !isAdmin,
							click: boundaryViewModel.eventsManager.redrawClick.bind(boundaryViewModel.eventsManager, 'polygon', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Rectangle',
							icon: 'rectangle',
							data: menuItemData,
							id: 'regRedrawRectangle',
							children: [],
							disable: !isAdmin,
							click: boundaryViewModel.eventsManager.redrawClick.bind(boundaryViewModel.eventsManager, 'rectangle', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Draw',
							icon: 'draw',
							data: menuItemData,
							id: 'regRedrawDraw',
							children: [],
							disable: !isAdmin,
							click: boundaryViewModel.eventsManager.redrawClick.bind(boundaryViewModel.eventsManager, 'draw', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Circle',
							icon: 'circle',
							data: menuItemData,
							id: 'regRedrawCircle',
							children: [],
							disable: !isAdmin,
							click: boundaryViewModel.eventsManager.redrawClick.bind(boundaryViewModel.eventsManager, 'circle', menuItemData)
						})
						],
						click: boundaryViewModel.eventsManager.redrawClick.bind(boundaryViewModel.eventsManager, 'polygon', menuItemData)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Reshape',
						icon: 'reshape',
						data: menuItemData,
						id: 'regRedrawReshape',
						disable: !isAdmin,
						click: boundaryViewModel.eventsManager.reshapeClick.bind(boundaryViewModel.eventsManager, 'reshape', menuItemData)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						isDevider: true
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Delete',
						icon: 'delete',
						data: menuItemData,
						disable: !isAdmin,
						click: boundaryViewModel.eventsManager.deleteClick.bind(boundaryViewModel.eventsManager, menuItemData)
					}));
					contextMenuCategories.popRegions.push(tempParentMenuItem);
				} else if (type == 'trip')
				{
					let tripName = getText(menuItemData, 'trip'),
						realTripName = menuItemData.trip.Name;

					if (!tripItems[realTripName])
					{
						let tripItem = new TF.RoutingMap.MenuItem({
							header: "<span class='trip-color-icon' style='background-color:" + menuItemData.color + "'></span>" + realTripName,
							title: realTripName,
							type: 'trip'
						});

						tripItem.addChild(new TF.RoutingMap.MenuItem({
							header: 'Details',
							icon: 'record-details',
							data: menuItemData,
							disable: !menuItemData.trip.Id,
							click: routingPaletteViewModel.tripViewModel.eventsManager.tripDetailsClick.bind(routingPaletteViewModel.tripViewModel.eventsManager, menuItemData.trip)
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
							click: routingPaletteViewModel.tripViewModel.eventsManager.tripPathInfoClick.bind(routingPaletteViewModel.tripViewModel.eventsManager, menuItemData)
						}));
						tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
							header: 'Edit',
							icon: 'reshape',
							data: menuItemData,
							disable: !hasAuthForRoutingMap || menuItemData.trip.OpenType === 'View',
							click: routingPaletteViewModel.tripViewModel.eventsManager.tripPathEditClick.bind(routingPaletteViewModel.tripViewModel.eventsManager, menuItemData)
						}));
						tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
							header: 'Recalculate',
							icon: 'refresh',
							data: menuItemData,
							disable: !hasAuthForRoutingMap || menuItemData.trip.OpenType === 'View',
							click: routingPaletteViewModel.tripViewModel.eventsManager.tripPathRefreshClick.bind(routingPaletteViewModel.tripViewModel.eventsManager, menuItemData)
						}));
						tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
							isDevider: true
						}));
						tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
							header: 'Delete',
							icon: 'delete',
							data: menuItemData,
							disable: !hasAuthForRoutingMap || menuItemData.trip.OpenType === 'View',
							click: routingPaletteViewModel.tripViewModel.eventsManager.tripPathDeleteClick.bind(routingPaletteViewModel.tripViewModel.eventsManager, menuItemData)
						}));
						contextMenuCategories.tripPaths.push(tempParentMenuItem);
					}
				} else if (type == 'tripboundary' || type == 'tripstop')
				{
					let trip = routingPaletteViewModel.tripViewModel.dataModel.getTripById(menuItemData.TripId),
						tripStopId = menuItemData.type === "tripStop" ? menuItemData.id : menuItemData.TripStopId,
						tripStop = routingPaletteViewModel.tripViewModel.dataModel.getFieldTripStop(tripStopId),
						tripName = trip.Name;
					if (!tripItems[tripName])
					{
						let tripItem = new TF.RoutingMap.MenuItem({
							header: "<span class='trip-color-icon' style='background-color:" + tripStop.color + "'></span>" + tripName,
							title: tripName,
							type: 'trip'
						});

						tripItem.addChild(new TF.RoutingMap.MenuItem({
							header: 'Details',
							icon: 'record-details',
							data: menuItemData,
							disable: !trip.Id,
							click: routingPaletteViewModel.tripViewModel.eventsManager.tripDetailsClick.bind(routingPaletteViewModel.tripViewModel.eventsManager, trip)
						}));

						tripItems[tripName] = tripItem;
					}

					var labelColor = TF.isLightness(tripStop.color) ? "#000000" : "#ffffff";
					var tripStopDisable = !hasAuthForRoutingMap || trip.OpenType === 'View' || (tripStop.SchoolCode !== null && tripStop.SchoolCode !== '');
					var tripStopHasBoundaryDisable = tripStopDisable || menuItemData.type === "tripBoundary";
					var isShowStopBoundary = tf.storageManager.get("showStopBoundary") ?? true;
					var tripStopNoBoundaryDisable = tripStopDisable || menuItemData.type === "tripStop" || !isShowStopBoundary;
					tempParentMenuItem = new TF.RoutingMap.MenuItem({
						header: "<span class='trip-stop-color-icon' style='border-color:rgb(0,0,0);color:" + labelColor + ";background-color:" + tripStop.color + "'>" + tripStop.Sequence + "</span>" + tripStop.Street,
						title: tripStop.Street,
						icon: null,
						type: 'tripSession'
					});
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Info',
						icon: 'info',
						data: menuItemData,
						click: routingPaletteViewModel.tripViewModel.eventsManager.infoClick.bind(routingPaletteViewModel.tripViewModel.eventsManager, menuItemData)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						isDevider: true
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Student Assignment',
						icon: 'assign',
						data: menuItemData,
						disable: !hasAuthForRoutingMap || trip.OpenType === 'View',
						// id: 'tripSessionTransform',
						click: routingPaletteViewModel.tripViewModel.eventsManager.assignStudentForStopClick.bind(routingPaletteViewModel.tripViewModel.eventsManager, tripStopId)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Duplicate Stop',
						icon: 'copy',
						data: menuItemData,
						disable: tripStopDisable,
						click: routingPaletteViewModel.tripViewModel.eventsManager.copyTripStopClick.bind(routingPaletteViewModel.tripViewModel.eventsManager, tripStopId)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Copy to ' + (routingPaletteViewModel.stopPoolViewModel.display.obStopPoolName() != '' ? routingPaletteViewModel.stopPoolViewModel.display.obStopPoolName() : 'Stop Pool'),
						icon: 'assign',
						data: menuItemData,
						disable: !hasAuthForRoutingMap || !routingPaletteViewModel.stopPoolViewModel.dataModel.selectedCategory(),
						// id: 'tripSessionTransform',
						click: routingPaletteViewModel.tripViewModel.eventsManager.copytoStopPoolClick.bind(routingPaletteViewModel.tripViewModel.eventsManager, tripStopId)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						isDevider: true
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Transform',
						icon: 'transform',
						data: menuItemData,
						disable: tripStopNoBoundaryDisable,
						id: 'tripSessionTransform',
						click: routingPaletteViewModel.tripViewModel.eventsManager.editTripBoundaryClick.bind(routingPaletteViewModel.tripViewModel.eventsManager, 'transform', menuItemData)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Move Stop Location',
						icon: 'movePoint',
						data: menuItemData,
						disable: tripStopDisable,
						id: 'tripSessionMovePoint',
						click: routingPaletteViewModel.tripViewModel.eventsManager.editTripStopClick.bind(routingPaletteViewModel.tripViewModel.eventsManager, 'movePoint', tripStopId)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						isDevider: true
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Add Boundary (Polygon)',
						icon: 'addBoundary',
						data: menuItemData,
						disable: tripStopHasBoundaryDisable,
						click: routingPaletteViewModel.tripViewModel.eventsManager.addTripStopBoundaryClick.bind(routingPaletteViewModel.tripViewModel.eventsManager, 'polygon', menuItemData),
						children: [new TF.RoutingMap.MenuItem({
							header: 'Polygon',
							icon: 'polygon',
							isDefault: true,
							data: menuItemData,
							disable: tripStopHasBoundaryDisable,
							children: [],
							click: routingPaletteViewModel.tripViewModel.eventsManager.addTripStopBoundaryClick.bind(routingPaletteViewModel.tripViewModel.eventsManager, 'polygon', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Rectangle',
							icon: 'rectangle',
							data: menuItemData,
							disable: tripStopHasBoundaryDisable,
							children: [],
							click: routingPaletteViewModel.tripViewModel.eventsManager.addTripStopBoundaryClick.bind(routingPaletteViewModel.tripViewModel.eventsManager, 'rectangle', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Draw',
							icon: 'draw',
							data: menuItemData,
							disable: tripStopHasBoundaryDisable,
							children: [],
							click: routingPaletteViewModel.tripViewModel.eventsManager.addTripStopBoundaryClick.bind(routingPaletteViewModel.tripViewModel.eventsManager, 'draw', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Circle',
							icon: 'circle',
							data: menuItemData,
							disable: tripStopHasBoundaryDisable,
							children: [],
							click: routingPaletteViewModel.tripViewModel.eventsManager.addTripStopBoundaryClick.bind(routingPaletteViewModel.tripViewModel.eventsManager, 'circle', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							isDevider: true
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Walkout',
							icon: 'Walkout',
							data: menuItemData,
							disable: tripStopHasBoundaryDisable,
							children: [],
							click: routingPaletteViewModel.tripViewModel.eventsManager.addTripStopBoundaryClick.bind(routingPaletteViewModel.tripViewModel.eventsManager, 'walkout', menuItemData)
						})]
					}));

					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Add Region (Polygon)',
						icon: 'add',
						data: menuItemData,
						disable: tripStopNoBoundaryDisable,
						children: [new TF.RoutingMap.MenuItem({
							header: 'Polygon',
							icon: 'polygon',
							isDefault: true,
							data: menuItemData,
							disable: tripStopNoBoundaryDisable,
							id: 'tripSessionAddPolygon',
							children: [],
							click: routingPaletteViewModel.tripViewModel.eventsManager.addRegionClick.bind(routingPaletteViewModel.tripViewModel.eventsManager, 'polygon', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Rectangle',
							icon: 'rectangle',
							data: menuItemData,
							disable: tripStopNoBoundaryDisable,
							id: 'tripSessionAddRectangle',
							children: [],
							click: routingPaletteViewModel.tripViewModel.eventsManager.addRegionClick.bind(routingPaletteViewModel.tripViewModel.eventsManager, 'rectangle', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Draw',
							icon: 'draw',
							data: menuItemData,
							disable: tripStopNoBoundaryDisable,
							id: 'tripSessionAddDraw',
							children: [],
							click: routingPaletteViewModel.tripViewModel.eventsManager.addRegionClick.bind(routingPaletteViewModel.tripViewModel.eventsManager, 'draw', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Circle',
							icon: 'circle',
							data: menuItemData,
							disable: tripStopNoBoundaryDisable,
							id: 'tripSessionAddCircle',
							children: [],
							click: routingPaletteViewModel.tripViewModel.eventsManager.addRegionClick.bind(routingPaletteViewModel.tripViewModel.eventsManager, 'circle', menuItemData)
						})],
						click: routingPaletteViewModel.tripViewModel.eventsManager.addRegionClick.bind(routingPaletteViewModel.tripViewModel.eventsManager, 'polygon', menuItemData)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Remove Region (Polygon)',
						icon: 'remove',
						data: menuItemData,
						disable: tripStopNoBoundaryDisable,
						children: [new TF.RoutingMap.MenuItem({
							header: 'Polygon',
							icon: 'polygon',
							isDefault: true,
							data: menuItemData,
							disable: tripStopNoBoundaryDisable,
							id: 'tripSessionRemovePolygon',
							children: [],
							click: routingPaletteViewModel.tripViewModel.eventsManager.removeRegionClick.bind(routingPaletteViewModel.tripViewModel.eventsManager, 'polygon', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Rectangle',
							icon: 'rectangle',
							data: menuItemData,
							disable: tripStopNoBoundaryDisable,
							id: 'tripSessionRemoveRectangle',
							children: [],
							click: routingPaletteViewModel.tripViewModel.eventsManager.removeRegionClick.bind(routingPaletteViewModel.tripViewModel.eventsManager, 'rectangle', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Draw',
							icon: 'draw',
							data: menuItemData,
							disable: tripStopNoBoundaryDisable,
							id: 'tripSessionRemoveDraw',
							children: [],
							click: routingPaletteViewModel.tripViewModel.eventsManager.removeRegionClick.bind(routingPaletteViewModel.tripViewModel.eventsManager, 'draw', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Circle',
							icon: 'circle',
							data: menuItemData,
							disable: tripStopNoBoundaryDisable,
							id: 'tripSessionRemoveCircle',
							children: [],
							click: routingPaletteViewModel.tripViewModel.eventsManager.removeRegionClick.bind(routingPaletteViewModel.tripViewModel.eventsManager, 'circle', menuItemData)
						})
						],
						click: routingPaletteViewModel.tripViewModel.eventsManager.removeRegionClick.bind(routingPaletteViewModel.tripViewModel.eventsManager, 'polygon', menuItemData)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Redraw Region (Polygon)',
						icon: 'redraw',
						data: menuItemData,
						disable: tripStopNoBoundaryDisable,
						children: [new TF.RoutingMap.MenuItem({
							header: 'Polygon',
							icon: 'polygon',
							isDefault: true,
							data: menuItemData,
							disable: tripStopNoBoundaryDisable,
							id: 'tripSessionRedrawPolygon',
							children: [],
							click: routingPaletteViewModel.tripViewModel.eventsManager.redrawClick.bind(routingPaletteViewModel.tripViewModel.eventsManager, 'polygon', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Rectangle',
							icon: 'rectangle',
							data: menuItemData,
							disable: tripStopNoBoundaryDisable,
							id: 'tripSessionRedrawRectangle',
							children: [],
							click: routingPaletteViewModel.tripViewModel.eventsManager.redrawClick.bind(routingPaletteViewModel.tripViewModel.eventsManager, 'rectangle', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Draw',
							icon: 'draw',
							data: menuItemData,
							disable: tripStopNoBoundaryDisable,
							id: 'tripSessionRedrawDraw',
							children: [],
							click: routingPaletteViewModel.tripViewModel.eventsManager.redrawClick.bind(routingPaletteViewModel.tripViewModel.eventsManager, 'draw', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Circle',
							icon: 'circle',
							data: menuItemData,
							disable: tripStopNoBoundaryDisable,
							id: 'tripSessionRedrawCircle',
							children: [],
							click: routingPaletteViewModel.tripViewModel.eventsManager.redrawClick.bind(routingPaletteViewModel.tripViewModel.eventsManager, 'circle', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							isDevider: true
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Walkout',
							icon: '',
							data: menuItemData,
							disable: tripStopNoBoundaryDisable,
							children: [],
							click: routingPaletteViewModel.tripViewModel.eventsManager.redrawWalkoutClick.bind(routingPaletteViewModel.tripViewModel.eventsManager, menuItemData)
						})
						],
						click: routingPaletteViewModel.tripViewModel.eventsManager.redrawClick.bind(routingPaletteViewModel.tripViewModel.eventsManager, 'polygon', menuItemData)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Reshape',
						icon: 'reshape',
						data: menuItemData,
						id: 'tripSessionReshape',
						disable: tripStopNoBoundaryDisable,
						click: routingPaletteViewModel.tripViewModel.eventsManager.reshapeClick.bind(routingPaletteViewModel.tripViewModel.eventsManager, 'reshape', menuItemData)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Remove Boundary',
						icon: 'removeBoundary',
						data: menuItemData,
						disable: tripStopNoBoundaryDisable,
						click: routingPaletteViewModel.tripViewModel.eventsManager.removeTripStopBoundaryClick.bind(routingPaletteViewModel.tripViewModel.eventsManager, menuItemData)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						isDevider: true
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Delete',
						icon: 'delete',
						data: menuItemData,
						disable: tripStopDisable,
						click: routingPaletteViewModel.tripViewModel.eventsManager.deleteOneClick.bind(routingPaletteViewModel.tripViewModel.eventsManager, tripStopId)
					}));
					contextMenuCategories.tripSessions.push(tempParentMenuItem);
				} else if (type == 'student')
				{
					var tempParentMenuItem = new TF.RoutingMap.MenuItem({
						header: getText(menuItemData, 'student'),
						type: 'student'
					});
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Details',
						icon: 'record-details',
						data: menuItemData,
						disable: !hasAuthForStudent,
						click: routingPaletteViewModel.tripViewModel.eventsManager.studentInfoClick.bind(routingPaletteViewModel.tripViewModel.eventsManager, menuItemData)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Create Door-to-Door Stop',
						icon: 'reshape',
						data: menuItemData,
						disable: !hasAuthForRoutingMap || routingPaletteViewModel.tripViewModel.dataModel.getEditTrips().length == 0 ? true : false,
						click: routingPaletteViewModel.tripViewModel.eventsManager.createDoorToDoorClick.bind(routingPaletteViewModel.tripViewModel.eventsManager, menuItemData)
					}));
					contextMenuCategories.students.push(tempParentMenuItem);
				} else if (type == 'stoppoolboundary')
				{
					var stopPoolItem = routingPaletteViewModel.stopPoolViewModel.dataModel.findByStopId(menuItemData.StopId);
					var tempParentMenuItem = new TF.RoutingMap.MenuItem({
						header: getText(menuItemData, 'stopPoolBoundary', routingPaletteViewModel.stopPoolViewModel),
						icon: null,
						type: 'stopPoolBoundary'
					});
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Info',
						icon: 'info',
						data: menuItemData,
						click: routingPaletteViewModel.stopPoolViewModel.eventsManager.infoClick.bind(routingPaletteViewModel.stopPoolViewModel.eventsManager, stopPoolItem)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						isDevider: true
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Copy to Trip Stop',
						icon: 'assign',
						data: menuItemData,
						disable: !hasAuthForRoutingMap || routingPaletteViewModel.tripViewModel.dataModel.getEditTrips().length == 0 ? true : false,
						// id: 'tripSessionTransform',
						click: routingPaletteViewModel.stopPoolViewModel.eventsManager.copytoTripStopClick.bind(routingPaletteViewModel.stopPoolViewModel.eventsManager, stopPoolItem)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						isDevider: true
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Transform',
						icon: 'transform',
						data: menuItemData,
						id: 'stopPoolTransform',
						disable: !hasAuthForRoutingMap,
						click: routingPaletteViewModel.stopPoolViewModel.eventsManager.transformClick.bind(routingPaletteViewModel.stopPoolViewModel.eventsManager, 'transform', menuItemData)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Move Stop Location',
						icon: 'movePoint',
						data: menuItemData,
						id: 'stopPoolMovePoint',
						disable: !hasAuthForRoutingMap,
						click: routingPaletteViewModel.stopPoolViewModel.eventsManager.editStopClick.bind(routingPaletteViewModel.stopPoolViewModel.eventsManager, 'movePoint', stopPoolItem)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						isDevider: true
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Add Region (Polygon)',
						icon: 'add',
						data: menuItemData,
						disable: !hasAuthForRoutingMap,
						children: [new TF.RoutingMap.MenuItem({
							header: 'Polygon',
							icon: 'polygon',
							isDefault: true,
							data: menuItemData,
							id: 'stopPoolAddPolygon',
							children: [],
							disable: !hasAuthForRoutingMap,
							click: routingPaletteViewModel.stopPoolViewModel.eventsManager.addRegionClick.bind(routingPaletteViewModel.stopPoolViewModel.eventsManager, 'polygon', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Rectangle',
							icon: 'rectangle',
							data: menuItemData,
							id: 'stopPoolAddRectangle',
							children: [],
							disable: !hasAuthForRoutingMap,
							click: routingPaletteViewModel.stopPoolViewModel.eventsManager.addRegionClick.bind(routingPaletteViewModel.stopPoolViewModel.eventsManager, 'rectangle', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Draw',
							icon: 'draw',
							data: menuItemData,
							id: 'stopPoolAddDraw',
							children: [],
							disable: !hasAuthForRoutingMap,
							click: routingPaletteViewModel.stopPoolViewModel.eventsManager.addRegionClick.bind(routingPaletteViewModel.stopPoolViewModel.eventsManager, 'draw', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Circle',
							icon: 'circle',
							data: menuItemData,
							id: 'stopPoolAddCircle',
							children: [],
							disable: !hasAuthForRoutingMap,
							click: routingPaletteViewModel.stopPoolViewModel.eventsManager.addRegionClick.bind(routingPaletteViewModel.stopPoolViewModel.eventsManager, 'circle', menuItemData)
						})
						],
						click: routingPaletteViewModel.stopPoolViewModel.eventsManager.addRegionClick.bind(routingPaletteViewModel.stopPoolViewModel.eventsManager, 'polygon', menuItemData)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Remove Region (Polygon)',
						icon: 'remove',
						data: menuItemData,
						disable: !hasAuthForRoutingMap,
						children: [new TF.RoutingMap.MenuItem({
							header: 'Polygon',
							icon: 'polygon',
							isDefault: true,
							data: menuItemData,
							id: 'stopPoolRemovePolygon',
							children: [],
							disable: !hasAuthForRoutingMap,
							click: routingPaletteViewModel.stopPoolViewModel.eventsManager.removeRegionClick.bind(routingPaletteViewModel.stopPoolViewModel.eventsManager, 'polygon', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Rectangle',
							icon: 'rectangle',
							data: menuItemData,
							id: 'stopPoolRemoveRectangle',
							children: [],
							disable: !hasAuthForRoutingMap,
							click: routingPaletteViewModel.stopPoolViewModel.eventsManager.removeRegionClick.bind(routingPaletteViewModel.stopPoolViewModel.eventsManager, 'rectangle', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Draw',
							icon: 'draw',
							data: menuItemData,
							id: 'stopPoolRemoveDraw',
							children: [],
							disable: !hasAuthForRoutingMap,
							click: routingPaletteViewModel.stopPoolViewModel.eventsManager.removeRegionClick.bind(routingPaletteViewModel.stopPoolViewModel.eventsManager, 'draw', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Circle',
							icon: 'circle',
							data: menuItemData,
							id: 'stopPoolRemoveCircle',
							children: [],
							disable: !hasAuthForRoutingMap,
							click: routingPaletteViewModel.stopPoolViewModel.eventsManager.removeRegionClick.bind(routingPaletteViewModel.stopPoolViewModel.eventsManager, 'circle', menuItemData)
						})
						],
						click: routingPaletteViewModel.stopPoolViewModel.eventsManager.removeRegionClick.bind(routingPaletteViewModel.stopPoolViewModel.eventsManager, 'polygon', menuItemData)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Redraw Region (Polygon)',
						icon: 'redraw',
						data: menuItemData,
						disable: !hasAuthForRoutingMap,
						children: [new TF.RoutingMap.MenuItem({
							header: 'Polygon',
							icon: 'polygon',
							isDefault: true,
							data: menuItemData,
							id: 'stopPoolRedrawPolygon',
							children: [],
							disable: !hasAuthForRoutingMap,
							click: routingPaletteViewModel.stopPoolViewModel.eventsManager.redrawClick.bind(routingPaletteViewModel.stopPoolViewModel.eventsManager, 'polygon', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Rectangle',
							icon: 'rectangle',
							data: menuItemData,
							id: 'stopPoolRedrawRectangle',
							children: [],
							disable: !hasAuthForRoutingMap,
							click: routingPaletteViewModel.stopPoolViewModel.eventsManager.redrawClick.bind(routingPaletteViewModel.stopPoolViewModel.eventsManager, 'rectangle', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Draw',
							icon: 'draw',
							data: menuItemData,
							id: 'stopPoolRedrawDraw',
							children: [],
							disable: !hasAuthForRoutingMap,
							click: routingPaletteViewModel.stopPoolViewModel.eventsManager.redrawClick.bind(routingPaletteViewModel.stopPoolViewModel.eventsManager, 'draw', menuItemData)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Circle',
							icon: 'circle',
							data: menuItemData,
							id: 'stopPoolRedrawCircle',
							children: [],
							disable: !hasAuthForRoutingMap,
							click: routingPaletteViewModel.stopPoolViewModel.eventsManager.redrawClick.bind(routingPaletteViewModel.stopPoolViewModel.eventsManager, 'circle', menuItemData)
						})
						],
						click: routingPaletteViewModel.stopPoolViewModel.eventsManager.redrawClick.bind(routingPaletteViewModel.stopPoolViewModel.eventsManager, 'polygon', menuItemData)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Reshape',
						icon: 'reshape',
						data: menuItemData,
						id: 'stopPoolReshape',
						disable: !hasAuthForRoutingMap,
						click: routingPaletteViewModel.stopPoolViewModel.eventsManager.reshapeClick.bind(routingPaletteViewModel.stopPoolViewModel.eventsManager, 'reshape', menuItemData)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						isDevider: true
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Delete',
						icon: 'delete',
						disable: !hasAuthForRoutingMap,
						data: menuItemData,
						click: routingPaletteViewModel.stopPoolViewModel.eventsManager.deleteClick.bind(routingPaletteViewModel.stopPoolViewModel.eventsManager, stopPoolItem)
					}));
					contextMenuCategories.stopPools.push(tempParentMenuItem);
				} else if (type.indexOf('trialstop') >= 0)
				{
					var trialStopItem = routingPaletteViewModel.trialStopViewModel.dataModel.findById(menuItemData.id);
					var tempParentMenuItem = new TF.RoutingMap.MenuItem({
						header: getText(trialStopItem, 'trialStopBoundary', routingPaletteViewModel.trialStopViewModel),
						icon: null,
						type: 'trialStopBoundary'
					});
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Info',
						icon: 'info',
						data: menuItemData,
						click: routingPaletteViewModel.trialStopViewModel.eventsManager.infoClick.bind(routingPaletteViewModel.trialStopViewModel.eventsManager, menuItemData)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						isDevider: true
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'New Trip Stop',
						icon: null,
						data: menuItemData,

						disable: !hasAuthForRoutingMap || routingPaletteViewModel.tripViewModel.dataModel.trips.filter(function(trip) { return trip.OpenType == "Edit" }).length == 0 ? true : false,
						click: routingPaletteViewModel.trialStopViewModel.eventsManager.createTripStop.bind(routingPaletteViewModel.trialStopViewModel.eventsManager, trialStopItem)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'New ' + (routingPaletteViewModel.stopPoolViewModel.display.obStopPoolName() != '' ? routingPaletteViewModel.stopPoolViewModel.display.obStopPoolName() : 'Pool Stop'),
						icon: null,
						data: menuItemData,
						disable: !hasAuthForRoutingMap,
						click: routingPaletteViewModel.trialStopViewModel.eventsManager.createPoolStop.bind(routingPaletteViewModel.trialStopViewModel.eventsManager, trialStopItem)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						isDevider: true
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Move Stop Location',
						icon: 'movePoint',
						data: menuItemData,
						id: 'rialStopMovePoint',
						disable: !hasAuthForRoutingMap,
						click: routingPaletteViewModel.trialStopViewModel.eventsManager.editTrialStopClick.bind(routingPaletteViewModel.trialStopViewModel.eventsManager, trialStopItem)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						isDevider: true
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Remove',
						icon: 'delete',
						data: menuItemData,
						disable: !hasAuthForRoutingMap,
						click: routingPaletteViewModel.trialStopViewModel.eventsManager.deleteClick.bind(routingPaletteViewModel.trialStopViewModel.eventsManager, trialStopItem)
					}));
					contextMenuCategories.trialStops.push(tempParentMenuItem);
				} else if (type == 'mystreets')
				{
					var tempParentMenuItem = new TF.RoutingMap.MenuItem({
						header: getText(menuItemData, 'mystreets'),
						icon: null,
						type: 'mystreets'
					});
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Info',
						icon: 'info',
						data: menuItemData,
						click: mapEditingPaletteViewModel.myStreetsViewModel.eventsManager.infoClick.bind(mapEditingPaletteViewModel.myStreetsViewModel.eventsManager, menuItemData)
					}));

					// travel scenarios palette only display info menu
					if (mapEditingPaletteViewModel.myStreetsViewModel.showMode().mapEditing)
					{
						tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
							isDevider: true
						}));
						tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
							header: 'Split Street Segment',
							icon: 'street-line',
							data: menuItemData,
							disable: !hasAuthForEditMap,
							click: mapEditingPaletteViewModel.myStreetsViewModel.eventsManager.splitClick.bind(mapEditingPaletteViewModel.myStreetsViewModel.eventsManager, menuItemData)
						}));
						tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
							header: 'Reshape',
							icon: 'street-reshape',
							data: menuItemData,
							id: 'regRedrawReshape',
							disable: !hasAuthForEditMap,
							click: mapEditingPaletteViewModel.myStreetsViewModel.eventsManager.reshapeClick.bind(mapEditingPaletteViewModel.myStreetsViewModel.eventsManager, 'reshape', menuItemData)
						}));
						tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
							isDevider: true
						}));
						tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
							header: 'Delete',
							icon: 'delete',
							data: menuItemData,
							disable: !hasAuthForEditMap,
							click: mapEditingPaletteViewModel.myStreetsViewModel.eventsManager.deleteClick.bind(mapEditingPaletteViewModel.myStreetsViewModel.eventsManager, menuItemData)
						}));
					}
					contextMenuCategories.streets.push(tempParentMenuItem);
				} else if (type == 'travelregion')
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
				} else if (type == 'zipcode')
				{
					var tempParentMenuItem = new TF.RoutingMap.MenuItem({
						header: getText(menuItemData, 'zipCode'),
						icon: null,
						type: 'zipCode'
					});

					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Info',
						icon: 'info',
						data: menuItemData,
						click: mapEditingPaletteViewModel.zipCodeViewModel.eventsManager.infoClick.bind(mapEditingPaletteViewModel.zipCodeViewModel.eventsManager, menuItemData)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						isDevider: true
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Transform',
						icon: 'transform',
						data: menuItemData,
						id: 'zcTransform',
						disable: !hasAuthForEditMap,
						click: mapEditingPaletteViewModel.zipCodeViewModel.eventsManager.transformClick.bind(mapEditingPaletteViewModel.zipCodeViewModel.eventsManager, 'transform', menuItemData)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Reshape',
						icon: 'reshape',
						data: menuItemData,
						id: 'zcRedrawReshape',
						disable: !hasAuthForEditMap,
						click: mapEditingPaletteViewModel.zipCodeViewModel.eventsManager.reshapeClick.bind(mapEditingPaletteViewModel.zipCodeViewModel.eventsManager, 'reshape', menuItemData)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						isDevider: true
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Delete',
						icon: 'delete',
						data: menuItemData,
						disable: !hasAuthForEditMap,
						click: mapEditingPaletteViewModel.zipCodeViewModel.eventsManager.deleteZipCodeClick.bind(mapEditingPaletteViewModel.zipCodeViewModel.eventsManager, menuItemData)
					}));
					contextMenuCategories.zipCodes.push(tempParentMenuItem);
				} else if (type == 'municipalboundary')
				{
					var tempParentMenuItem = new TF.RoutingMap.MenuItem({
						header: getText(menuItemData, 'municipalBoundary'),
						icon: null,
						type: 'municipalBoundary'
					});

					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Info',
						icon: 'info',
						data: menuItemData,
						click: mapEditingPaletteViewModel.municipalBoundaryViewModel.eventsManager.infoClick.bind(mapEditingPaletteViewModel.municipalBoundaryViewModel.eventsManager, menuItemData)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						isDevider: true
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Transform',
						icon: 'transform',
						data: menuItemData,
						id: 'mbTransform',
						disable: !hasAuthForEditMap,
						click: mapEditingPaletteViewModel.municipalBoundaryViewModel.eventsManager.transformClick.bind(mapEditingPaletteViewModel.municipalBoundaryViewModel.eventsManager, 'transform', menuItemData)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Reshape',
						icon: 'reshape',
						data: menuItemData,
						id: 'mbRedrawReshape',
						disable: !hasAuthForEditMap,
						click: mapEditingPaletteViewModel.municipalBoundaryViewModel.eventsManager.reshapeClick.bind(mapEditingPaletteViewModel.municipalBoundaryViewModel.eventsManager, 'reshape', menuItemData)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						isDevider: true
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Delete',
						icon: 'delete',
						data: menuItemData,
						disable: !hasAuthForEditMap,
						click: mapEditingPaletteViewModel.municipalBoundaryViewModel.eventsManager.deleteClick.bind(mapEditingPaletteViewModel.municipalBoundaryViewModel.eventsManager, menuItemData)
					}));
					contextMenuCategories.municipalBoundaries.push(tempParentMenuItem);
				} else if (type == 'railroad')
				{
					var tempParentMenuItem = new TF.RoutingMap.MenuItem({
						header: getText(menuItemData, 'railroad'),
						icon: null,
						type: 'railroad'
					});
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Info',
						icon: 'info',
						data: menuItemData,
						click: mapEditingPaletteViewModel.railroadViewModel.eventsManager.infoClick.bind(mapEditingPaletteViewModel.railroadViewModel.eventsManager, menuItemData)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						isDevider: true
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Reshape',
						icon: 'reshape',
						data: menuItemData,
						id: 'regRedrawReshape',
						disable: !hasAuthForEditMap,
						click: mapEditingPaletteViewModel.railroadViewModel.eventsManager.reshapeClick.bind(mapEditingPaletteViewModel.railroadViewModel.eventsManager, 'reshape', menuItemData)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						isDevider: true
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Delete',
						icon: 'delete',
						data: menuItemData,
						disable: !hasAuthForEditMap,
						click: mapEditingPaletteViewModel.railroadViewModel.eventsManager.deleteClick.bind(mapEditingPaletteViewModel.railroadViewModel.eventsManager, menuItemData)
					}));
					contextMenuCategories.railroads.push(tempParentMenuItem);
				} else if (type == 'water' || type == 'waterpolygon' || type == 'waterpolyline')
				{
					var tempParentMenuItem = new TF.RoutingMap.MenuItem({
						header: getText(menuItemData, 'water'),
						icon: null,
						type: 'water'
					});

					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Info',
						icon: 'info',
						data: menuItemData,
						click: mapEditingPaletteViewModel.waterViewModel.eventsManager.infoClick.bind(mapEditingPaletteViewModel.waterViewModel.eventsManager, menuItemData)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({ isDevider: true }));
					if (menuItemData.geometry.type == "polygon")
					{
						tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
							header: 'Transform',
							icon: 'transform',
							data: menuItemData,
							id: 'wtTransform',
							disable: !hasAuthForEditMap,
							click: mapEditingPaletteViewModel.waterViewModel.eventsManager.editClick.bind(mapEditingPaletteViewModel.waterViewModel.eventsManager, 'transform', menuItemData)
						}));
					}
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Reshape',
						icon: 'reshape',
						data: menuItemData,
						id: 'wtRedrawReshape',
						disable: !hasAuthForEditMap,
						click: mapEditingPaletteViewModel.waterViewModel.eventsManager.reshapeClick.bind(mapEditingPaletteViewModel.waterViewModel.eventsManager, 'reshape', menuItemData)
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						isDevider: true
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Delete',
						icon: 'delete',
						data: menuItemData,
						disable: !hasAuthForEditMap,
						click: mapEditingPaletteViewModel.waterViewModel.eventsManager.deleteClick.bind(mapEditingPaletteViewModel.waterViewModel.eventsManager, menuItemData)
					}));
					contextMenuCategories.water.push(tempParentMenuItem);
				} else if (type.indexOf('landmark') >= 0)
				{
					var tempParentMenuItem = new TF.RoutingMap.MenuItem({
						header: getText(menuItemData, 'landmark'),
						icon: null,
						type: 'landmark'
					});
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Info',
						icon: 'info',
						data: menuItemData,
						click: mapEditingPaletteViewModel.landmarkViewModel.eventsManager.infoClick.bind(mapEditingPaletteViewModel.landmarkViewModel.eventsManager, menuItemData)
					}));
					if (menuItemData.geometry.type == "point")
					{
						tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
							isDevider: true
						}));
						tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
							header: 'Move Point',
							icon: 'movePoint',
							data: menuItemData,
							id: 'movePoint',
							disable: !hasAuthForEditMap,
							click: mapEditingPaletteViewModel.landmarkViewModel.eventsManager.editClick.bind(mapEditingPaletteViewModel.landmarkViewModel.eventsManager, 'movePoint', menuItemData)
						}));
					}
					if (menuItemData.geometry.type == "polygon")
					{
						tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
							isDevider: true
						}));
						tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
							header: 'Transform',
							icon: 'transform',
							data: menuItemData,
							id: 'lmTransform',
							disable: !hasAuthForEditMap,
							click: mapEditingPaletteViewModel.landmarkViewModel.eventsManager.editClick.bind(mapEditingPaletteViewModel.landmarkViewModel.eventsManager, 'transform', menuItemData)
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
								id: 'lmAddPolygon',
								children: [],
								disable: !hasAuthForEditMap,
								click: mapEditingPaletteViewModel.landmarkViewModel.eventsManager.addRegionClick.bind(mapEditingPaletteViewModel.landmarkViewModel.eventsManager, 'polygon', menuItemData)
							}),
							new TF.RoutingMap.MenuItem({
								header: 'Rectangle',
								icon: 'rectangle',
								data: menuItemData,
								id: 'lmAddRectangle',
								children: [],
								disable: !hasAuthForEditMap,
								click: mapEditingPaletteViewModel.landmarkViewModel.eventsManager.addRegionClick.bind(mapEditingPaletteViewModel.landmarkViewModel.eventsManager, 'rectangle', menuItemData)
							}),
							new TF.RoutingMap.MenuItem({
								header: 'Draw',
								icon: 'draw',
								data: menuItemData,
								id: 'lmAddDraw',
								children: [],
								disable: !hasAuthForEditMap,
								click: mapEditingPaletteViewModel.landmarkViewModel.eventsManager.addRegionClick.bind(mapEditingPaletteViewModel.landmarkViewModel.eventsManager, 'draw', menuItemData)
							}),
							new TF.RoutingMap.MenuItem({
								header: 'Circle',
								icon: 'circle',
								data: menuItemData,
								id: 'lmAddCircle',
								children: [],
								disable: !hasAuthForEditMap,
								click: mapEditingPaletteViewModel.landmarkViewModel.eventsManager.addRegionClick.bind(mapEditingPaletteViewModel.landmarkViewModel.eventsManager, 'circle', menuItemData)
							})
							],
							click: mapEditingPaletteViewModel.landmarkViewModel.eventsManager.addRegionClick.bind(mapEditingPaletteViewModel.landmarkViewModel.eventsManager, 'polygon', menuItemData)
						}));
						tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
							header: 'Remove Region (Polygon)',
							icon: 'remove',
							data: menuItemData,
							disable: !hasAuthForEditMap,
							children: [new TF.RoutingMap.MenuItem({
								header: 'Polygon',
								icon: 'polygon',
								isDefault: true,
								data: menuItemData,
								id: 'lmRemovePolygon',
								children: [],
								disable: !hasAuthForEditMap,
								click: mapEditingPaletteViewModel.landmarkViewModel.eventsManager.removeRegionClick.bind(mapEditingPaletteViewModel.landmarkViewModel.eventsManager, 'polygon', menuItemData)
							}),
							new TF.RoutingMap.MenuItem({
								header: 'Rectangle',
								icon: 'rectangle',
								data: menuItemData,
								id: 'lmRemoveRectangle',
								children: [],
								disable: !hasAuthForEditMap,
								click: mapEditingPaletteViewModel.landmarkViewModel.eventsManager.removeRegionClick.bind(mapEditingPaletteViewModel.landmarkViewModel.eventsManager, 'rectangle', menuItemData)
							}),
							new TF.RoutingMap.MenuItem({
								header: 'Draw',
								icon: 'draw',
								data: menuItemData,
								id: 'lmRemoveDraw',
								children: [],
								disable: !hasAuthForEditMap,
								click: mapEditingPaletteViewModel.landmarkViewModel.eventsManager.removeRegionClick.bind(mapEditingPaletteViewModel.landmarkViewModel.eventsManager, 'draw', menuItemData)
							}),
							new TF.RoutingMap.MenuItem({
								header: 'Circle',
								icon: 'circle',
								data: menuItemData,
								id: 'lmRemoveCircle',
								children: [],
								disable: !hasAuthForEditMap,
								click: mapEditingPaletteViewModel.landmarkViewModel.eventsManager.removeRegionClick.bind(mapEditingPaletteViewModel.landmarkViewModel.eventsManager, 'circle', menuItemData)
							})
							],
							click: mapEditingPaletteViewModel.landmarkViewModel.eventsManager.removeRegionClick.bind(mapEditingPaletteViewModel.landmarkViewModel.eventsManager, 'polygon', menuItemData)
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
								id: 'lmRedrawPolygon',
								children: [],
								disable: !hasAuthForEditMap,
								click: mapEditingPaletteViewModel.landmarkViewModel.eventsManager.redrawClick.bind(mapEditingPaletteViewModel.landmarkViewModel.eventsManager, 'polygon', menuItemData)
							}),
							new TF.RoutingMap.MenuItem({
								header: 'Rectangle',
								icon: 'rectangle',
								data: menuItemData,
								id: 'lmRedrawRectangle',
								children: [],
								disable: !hasAuthForEditMap,
								click: mapEditingPaletteViewModel.landmarkViewModel.eventsManager.redrawClick.bind(mapEditingPaletteViewModel.landmarkViewModel.eventsManager, 'rectangle', menuItemData)
							}),
							new TF.RoutingMap.MenuItem({
								header: 'Draw',
								icon: 'draw',
								data: menuItemData,
								id: 'lmRedrawDraw',
								children: [],
								disable: !hasAuthForEditMap,
								click: mapEditingPaletteViewModel.landmarkViewModel.eventsManager.redrawClick.bind(mapEditingPaletteViewModel.landmarkViewModel.eventsManager, 'draw', menuItemData)
							}),
							new TF.RoutingMap.MenuItem({
								header: 'Circle',
								icon: 'circle',
								data: menuItemData,
								id: 'lmRedrawCircle',
								children: [],
								disable: !hasAuthForEditMap,
								click: mapEditingPaletteViewModel.landmarkViewModel.eventsManager.redrawClick.bind(mapEditingPaletteViewModel.landmarkViewModel.eventsManager, 'circle', menuItemData)
							})
							],
							click: mapEditingPaletteViewModel.landmarkViewModel.eventsManager.redrawClick.bind(mapEditingPaletteViewModel.landmarkViewModel.eventsManager, 'polygon', menuItemData)
						}));
					}
					if (menuItemData.geometry.type != "point")
					{
						tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
							isDevider: true
						}));
						tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
							header: 'Reshape',
							icon: 'reshape',
							data: menuItemData,
							id: 'regRedrawReshape',
							disable: !hasAuthForEditMap,
							click: mapEditingPaletteViewModel.landmarkViewModel.eventsManager.reshapeClick.bind(mapEditingPaletteViewModel.landmarkViewModel.eventsManager, 'reshape', menuItemData)
						}));
					}
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						isDevider: true
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Delete',
						icon: 'delete',
						data: menuItemData,
						disable: !hasAuthForEditMap,
						click: mapEditingPaletteViewModel.landmarkViewModel.eventsManager.deleteClick.bind(mapEditingPaletteViewModel.landmarkViewModel.eventsManager, menuItemData)
					}));
					contextMenuCategories.landmarks.push(tempParentMenuItem);
				}
				// else if (type == 'noneligiblezone')
				// {
				// 	var tempParentMenuItem = new TF.RoutingMap.MenuItem({
				// 		header: getText(menuItemData, 'nonEligibleZone'),
				// 		icon: null,
				// 		type: 'nonEligibleZone'
				// 	});
				// 	tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
				// 		header: 'Info',
				// 		icon: 'info',
				// 		data: menuItemData,
				// 		click: routingPaletteViewModel.nonEligibleZoneViewModel.eventsManager.infoClick.bind(routingPaletteViewModel.nonEligibleZoneViewModel.eventsManager, menuItemData)
				// 	}));
				// 	contextMenuCategories.nonEligibleZones.push(tempParentMenuItem);
				// }
			}
			// RCM option only when nothing is returned
			if (data.length == 0)
			{
				tempParentMenuItem = new TF.RoutingMap.MenuItem({
					header: 'Default',
					icon: null,
					type: 'Default'
				});
				tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
					header: 'Geo Search',
					icon: null,
					data: { id: -1000 },
					children: [new TF.RoutingMap.MenuItem({
						header: 'Polygon',
						icon: 'polygon',
						id: 'geoSearchPolygon',
						children: [],
						disable: false,
						data: { id: -1000 },
						click: geoSearchPaletteViewModel.eventsManager.selectAreaOptionClick.bind(geoSearchPaletteViewModel.eventsManager, 'polygon', geoSearchPaletteViewModel.eventsManager, $('.routingmap_panel' + routeState).find('.geosearch-section'))
					}),
					new TF.RoutingMap.MenuItem({
						header: 'Rectangle',
						icon: 'rectangle',
						id: 'geoSearchRectangle',
						children: [],
						disable: false,
						data: { id: -1000 },
						click: geoSearchPaletteViewModel.eventsManager.selectAreaOptionClick.bind(geoSearchPaletteViewModel.eventsManager, 'rectangle', geoSearchPaletteViewModel.eventsManager, $('.routingmap_panel' + routeState).find('.geosearch-section'))
					}),
					new TF.RoutingMap.MenuItem({
						header: 'Draw',
						icon: 'draw',
						id: 'geoSearchDraw',
						children: [],
						disable: false,
						data: { id: -1000 },
						click: geoSearchPaletteViewModel.eventsManager.selectAreaOptionClick.bind(geoSearchPaletteViewModel.eventsManager, 'draw', geoSearchPaletteViewModel.eventsManager, $('.routingmap_panel' + routeState).find('.geosearch-section'))
					}),
					new TF.RoutingMap.MenuItem({
						header: 'Circle',
						icon: 'circle',
						id: 'geoSearchCircle',
						children: [],
						disable: false,
						data: { id: -1000 },
						click: geoSearchPaletteViewModel.eventsManager.selectAreaOptionClick.bind(geoSearchPaletteViewModel.eventsManager, 'circle', geoSearchPaletteViewModel.eventsManager, $('.routingmap_panel' + routeState).find('.geosearch-section'))
					})
					]
				}));
				var schoolBoundaryDisable = !boundaryViewModel.obShow() || !boundaryViewModel.schoolBoundaryViewModel.isShowMode() || !boundaryViewModel.eventsManager.obBoundarySeleted();
				var populationRegionDisable = !boundaryViewModel.obShow() || !boundaryViewModel.populationRegionViewModel.isShowMode();
				if (!schoolBoundaryDisable || !populationRegionDisable)
				{
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						isDevider: true
					}));
				}
				if (!schoolBoundaryDisable)
				{
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'School Boundary',
						icon: null,
						data: { id: -999 },
						disable: schoolBoundaryDisable,
						children: [new TF.RoutingMap.MenuItem({
							header: 'Create Boundary',
							icon: null,
							id: 'schoolBoundaryCreate',
							disable: schoolBoundaryDisable,
							children: [],
							data: { id: -999 },
							click: boundaryViewModel.eventsManager.createBoundaryClick.bind(boundaryViewModel.eventsManager)
						})
						]
					}));
				}
				if (!populationRegionDisable)
				{
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Population Region',
						icon: null,
						data: { id: -998 },
						disable: populationRegionDisable,
						children: [new TF.RoutingMap.MenuItem({
							header: 'Create Boundary',
							icon: null,
							id: 'populationRegionCreate',
							children: [],
							data: { id: -998 },
							disable: populationRegionDisable,
							click: boundaryViewModel.eventsManager.createPopulationClick.bind(boundaryViewModel.eventsManager)
						})
						]
					}));
				}
				var travelRegionDisable = !travelScenariosPaletteViewModel.obShow() || !travelScenariosPaletteViewModel.travelRegionsViewModel.isShowMode();
				var streetDisable = !mapEditingPaletteViewModel.obShow() || !mapEditingPaletteViewModel.myStreetsViewModel.isShowMode();
				var railroadDisable = !mapEditingPaletteViewModel.obShow() || !mapEditingPaletteViewModel.railroadViewModel.isShowMode();
				var landMarkDisable = !mapEditingPaletteViewModel.obShow() || !mapEditingPaletteViewModel.landmarkViewModel.isShowMode();
				var postalcodeDisable = !mapEditingPaletteViewModel.obShow() || !mapEditingPaletteViewModel.zipCodeViewModel.isShowMode();
				var municipalBoundariesDisable = !mapEditingPaletteViewModel.obShow() || !mapEditingPaletteViewModel.municipalBoundaryViewModel.isShowMode();
				var waterDisable = !mapEditingPaletteViewModel.obShow() || !mapEditingPaletteViewModel.waterViewModel.isShowMode();
				if (!travelRegionDisable ||
					!streetDisable ||
					!railroadDisable ||
					!landMarkDisable ||
					!postalcodeDisable ||
					!municipalBoundariesDisable ||
					!waterDisable)
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
				if (!streetDisable)
				{
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'My Streets',
						icon: null,
						data: { id: -996 },
						disable: streetDisable,
						children: [new TF.RoutingMap.MenuItem({
							header: 'Create Street',
							icon: null,
							id: 'createStreet',
							children: [],
							data: { id: -996 },
							disable: streetDisable,
							click: mapEditingPaletteViewModel.myStreetsViewModel.eventsManager.createStreetClick.bind(mapEditingPaletteViewModel.myStreetsViewModel.eventsManager)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Create Street from Selection',
							icon: null,
							children: [],
							data: { id: -996 },
							disable: streetDisable || mapEditingPaletteViewModel._viewModal.obCopyLineObject() == null,
							click: mapEditingPaletteViewModel.myStreetsViewModel.eventsManager.createFromSelectionClick.bind(mapEditingPaletteViewModel.myStreetsViewModel.eventsManager)
						})
						]
					}));
				}
				if (!railroadDisable)
				{
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'My Railroads',
						icon: null,
						data: { id: -995 },
						disable: railroadDisable,
						children: [new TF.RoutingMap.MenuItem({
							header: 'Create Railroad',
							icon: null,
							id: 'createRailroad',
							children: [],
							data: { id: -995 },
							disable: railroadDisable,
							click: mapEditingPaletteViewModel.railroadViewModel.eventsManager.createClick.bind(mapEditingPaletteViewModel.railroadViewModel.eventsManager)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Create Railroad from Selection',
							icon: null,
							children: [],
							data: { id: -995 },
							disable: railroadDisable || mapEditingPaletteViewModel._viewModal.obCopyLineObject() == null,
							click: mapEditingPaletteViewModel.railroadViewModel.eventsManager.createFromSelectionClick.bind(mapEditingPaletteViewModel.railroadViewModel.eventsManager)
						})
						]
					}));
				}
				if (!landMarkDisable)
				{
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'My Landmarks',
						icon: null,
						data: { id: -994 },
						disable: landMarkDisable,
						children: [new TF.RoutingMap.MenuItem({
							header: 'Create Landmark Polygon',
							icon: 'polygon',
							id: 'landmarkCreatePolygon',
							children: [],
							data: { id: -994 },
							disable: landMarkDisable,
							click: mapEditingPaletteViewModel.landmarkViewModel.eventsManager.createClick.bind(mapEditingPaletteViewModel.landmarkViewModel.eventsManager, 'Polygon', mapEditingPaletteViewModel.landmarkViewModel.eventsManager, $('.routingmap_panel' + routeState).find('.landMark-section'))
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Create Landmark Polyline',
							icon: null,
							id: 'landmarkCreatePolyline',
							children: [],
							data: { id: -994 },
							disable: landMarkDisable,
							click: mapEditingPaletteViewModel.landmarkViewModel.eventsManager.createClick.bind(mapEditingPaletteViewModel.landmarkViewModel.eventsManager, 'Polyline', mapEditingPaletteViewModel.landmarkViewModel.eventsManager, $('.routingmap_panel' + routeState).find('.landMark-section'))
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Create Landmark Point',
							icon: null,
							id: 'landmarkCreatePoint',
							children: [],
							data: { id: -994 },
							disable: landMarkDisable,
							click: mapEditingPaletteViewModel.landmarkViewModel.eventsManager.createClick.bind(mapEditingPaletteViewModel.landmarkViewModel.eventsManager, 'Point', mapEditingPaletteViewModel.landmarkViewModel.eventsManager, $('.routingmap_panel' + routeState).find('.landMark-section'))
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Create Landmark from Selection',
							icon: null,
							children: [],
							data: { id: -994 },
							disable: landMarkDisable ||
								(mapEditingPaletteViewModel._viewModal.obCopyPointObject() == null && mapEditingPaletteViewModel._viewModal.obCopyLineObject() == null && mapEditingPaletteViewModel._viewModal.obCopyPolygonObject() == null),
							click: mapEditingPaletteViewModel.landmarkViewModel.eventsManager.createFromSelectionClick.bind(mapEditingPaletteViewModel.landmarkViewModel.eventsManager)
						})
						]
					}));
				}
				if (!postalcodeDisable)
				{
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Postal Code Boundaries',
						icon: null,
						data: { id: -993 },
						disable: postalcodeDisable,
						children: [new TF.RoutingMap.MenuItem({
							header: 'Create Boundary',
							icon: null,
							id: 'postalCreate',
							children: [],
							data: { id: -993 },
							disable: postalcodeDisable,
							click: mapEditingPaletteViewModel.zipCodeViewModel.eventsManager.createZipCodeClick.bind(mapEditingPaletteViewModel.zipCodeViewModel.eventsManager)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Create Boundary from Selection',
							icon: null,
							children: [],
							data: { id: -993 },
							disable: postalcodeDisable || mapEditingPaletteViewModel._viewModal.obCopyPolygonObject() == null,
							click: mapEditingPaletteViewModel.zipCodeViewModel.eventsManager.createFromSelectionClick.bind(mapEditingPaletteViewModel.zipCodeViewModel.eventsManager)
						})
						]
					}));
				}
				if (!municipalBoundariesDisable)
				{
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Municipal Boundaries',
						icon: null,
						data: { id: -992 },
						disable: municipalBoundariesDisable,
						children: [new TF.RoutingMap.MenuItem({
							header: 'Create Boundary',
							icon: null,
							id: 'municipalBoundariesCreate',
							children: [],
							data: { id: -992 },
							disable: municipalBoundariesDisable,
							click: mapEditingPaletteViewModel.municipalBoundaryViewModel.eventsManager.createMunicipalBoundaryClick.bind(mapEditingPaletteViewModel.municipalBoundaryViewModel.eventsManager)
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Create Boundary from Selection',
							icon: null,
							children: [],
							data: { id: -992 },
							disable: municipalBoundariesDisable || mapEditingPaletteViewModel._viewModal.obCopyPolygonObject() == null,
							click: mapEditingPaletteViewModel.municipalBoundaryViewModel.eventsManager.createMunicipalBoundaryFromSelectionClick.bind(mapEditingPaletteViewModel.municipalBoundaryViewModel.eventsManager)
						})
						]
					}));
				}
				if (!waterDisable)
				{
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Water',
						icon: null,
						data: { id: -991 },
						disable: waterDisable,
						children: [new TF.RoutingMap.MenuItem({
							header: 'Create Water Polygon',
							icon: 'polygon',
							id: 'waterCreatePolygon',
							children: [],
							data: { id: -991 },
							disable: waterDisable,
							click: mapEditingPaletteViewModel.waterViewModel.eventsManager.createClick.bind(mapEditingPaletteViewModel.waterViewModel.eventsManager, 'Polygon', mapEditingPaletteViewModel.waterViewModel.eventsManager, $('.routingmap_panel' + routeState).find('.water-section'))
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Create Water Polyline',
							icon: null,
							id: 'waterCreatePolyline',
							children: [],
							data: { id: -991 },
							disable: waterDisable,
							click: mapEditingPaletteViewModel.waterViewModel.eventsManager.createClick.bind(mapEditingPaletteViewModel.waterViewModel.eventsManager, 'Polyline', mapEditingPaletteViewModel.waterViewModel.eventsManager, $('.routingmap_panel' + routeState).find('.water-section'))
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Create Water from Selection',
							icon: null,
							children: [],
							data: { id: -991 },
							disable: waterDisable || (mapEditingPaletteViewModel._viewModal.obCopyLineObject() == null && mapEditingPaletteViewModel._viewModal.obCopyPolygonObject() == null),
							click: mapEditingPaletteViewModel.waterViewModel.eventsManager.createFromSelectionClick.bind(mapEditingPaletteViewModel.waterViewModel.eventsManager)
						})
						]
					}));
				}
				var parcelDisable = !parcelPointsViewModel.obShow() || !parcelPointsViewModel.isShowMode();
				if (!parcelDisable)
				{
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						isDevider: true
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Parcel & Address Points',
						icon: null,
						data: { id: -990 },
						disable: parcelDisable,
						children: [new TF.RoutingMap.MenuItem({
							header: 'Parcel',
							icon: null,
							data: { id: -990 },
							disable: parcelDisable,
							children: [new TF.RoutingMap.MenuItem({
								header: 'Create Parcel',
								icon: null,
								id: 'parcelCreate',
								children: [],
								data: { id: -990 },
								disable: parcelDisable,
								click: parcelPointsViewModel.eventsManager.createParcelClick.bind(parcelPointsViewModel.eventsManager)
							}),
							new TF.RoutingMap.MenuItem({
								header: 'Create Parcel from Selection',
								icon: null,
								children: [],
								data: { id: -990 },
								disable: parcelDisable || parcelPointsViewModel._viewModal.obCopyLineObject() == null,
								click: parcelPointsViewModel.eventsManager.createParcelFromSelectionClick.bind(parcelPointsViewModel.eventsManager)
							})],
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Address Point',
							icon: null,
							data: { id: -990 },
							disable: parcelDisable,
							children: [new TF.RoutingMap.MenuItem({
								header: 'Add Point',
								icon: null,
								id: 'addressAddPoint',
								children: [],
								data: { id: -990 },
								disable: parcelDisable,
								click: parcelPointsViewModel.eventsManager.addPointClick.bind(parcelPointsViewModel.eventsManager)
							})],
						})
						]
					}));
				}
				var stopDisable = !routingPaletteViewModel.obShow() || !routingPaletteViewModel.tripViewModel.isShowMode() || !routingPaletteViewModel.tripViewModel.eventsManager.obEditTripSelected();
				var stopPoolDisable = !routingPaletteViewModel.obShow() || !routingPaletteViewModel.stopPoolViewModel.isShowMode();
				var trialStopDisable = !routingPaletteViewModel.obShow() || !routingPaletteViewModel.trialStopViewModel.isShowMode();
				if (!stopDisable ||
					!stopPoolDisable ||
					!trialStopDisable)
				{
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						isDevider: true
					}));
				}

				if (!stopDisable)
				{
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Stop',
						icon: null,
						data: { id: -989 },
						disable: stopDisable,
						children: [new TF.RoutingMap.MenuItem({
							header: 'Add Stop',
							icon: null,
							id: 'addStop',
							children: [],
							data: { id: -989 },
							disable: stopDisable,
							cancelClick: routingPaletteViewModel.tripViewModel.cancelStopClick.bind(routingPaletteViewModel.tripViewModel),
							click: routingPaletteViewModel.tripViewModel.addStopClick.bind(routingPaletteViewModel.tripViewModel, null, $('.routingmap_panel' + routeState).find('.trip-section'))
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Quick Add Stop(s)',
							icon: null,
							id: 'addStopsFromFile',
							children: [],
							data: { id: -989, notSelectable: true },
							disable: stopDisable,
							click: routingPaletteViewModel.tripViewModel.eventsManager.createFromSearchResultClick.bind(routingPaletteViewModel.tripViewModel.eventsManager, null, $('.routingmap_panel' + routeState).find('.trip-section'))
						}),
						new TF.RoutingMap.MenuItem({
							isDevider: true
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Add Stop from Selection',
							icon: null,
							children: [],
							data: { id: -989 },
							disable: stopDisable,
							click: routingPaletteViewModel.tripViewModel.eventsManager.createStopFromSelectionClick.bind(routingPaletteViewModel.tripViewModel.eventsManager, null, $('.routingmap_panel' + routeState).find('.trip-section'))
						})
						]
					}));
				}
				if (!stopPoolDisable)
				{
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: routingPaletteViewModel.stopPoolViewModel.display.obStopPoolName() != '' ? routingPaletteViewModel.stopPoolViewModel.display.obStopPoolName() : 'Stop Pool',
						icon: null,
						data: { id: -988 },
						disable: stopPoolDisable,
						children: [new TF.RoutingMap.MenuItem({
							header: 'Add Stop',
							icon: null,
							id: 'addStopPool',
							children: [],
							data: { id: -988 },
							disable: stopPoolDisable,
							click: routingPaletteViewModel.stopPoolViewModel.eventsManager.createClick.bind(routingPaletteViewModel.stopPoolViewModel.eventsManager, null, $('.routingmap_panel' + routeState).find('.stop-pool-section'))
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Quick Add Stop(s)',
							icon: null,
							id: 'addStopPoolFromFile',
							children: [],
							data: { id: -988, notSelectable: true },
							disable: stopPoolDisable,
							click: routingPaletteViewModel.stopPoolViewModel.eventsManager.createFromSearchResultClick.bind(routingPaletteViewModel.stopPoolViewModel.eventsManager, null, $('.routingmap_panel' + routeState).find('.stop-pool-section'))
						}),
						new TF.RoutingMap.MenuItem({
							isDevider: true
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Add Stop from Selection',
							icon: null,
							children: [],
							data: { id: -988 },
							disable: stopPoolDisable || routingPaletteViewModel.stopPoolViewModel.eventsManager.copyFromObject() == null,
							click: routingPaletteViewModel.stopPoolViewModel.eventsManager.createFromSelectionClick.bind(routingPaletteViewModel.stopPoolViewModel.eventsManager, null, $('.routingmap_panel' + routeState).find('.stop-pool-section'))
						})
						]
					}));
				}
				if (!trialStopDisable)
				{
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Trial Stop',
						icon: null,
						data: { id: -987 },
						disable: trialStopDisable,
						children: [new TF.RoutingMap.MenuItem({
							header: 'Add Stop',
							icon: null,
							id: 'addTrialStop',
							children: [],
							data: { id: -987 },
							disable: trialStopDisable,
							click: routingPaletteViewModel.trialStopViewModel.eventsManager.createTrialStopClick.bind(routingPaletteViewModel.trialStopViewModel.eventsManager, null, $('.routingmap_panel' + routeState).find('.trial-stop-section'))
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Add Stop from Selection',
							icon: null,
							children: [],
							data: { id: -987 },
							disable: trialStopDisable || routingPaletteViewModel.trialStopViewModel.eventsManager.copyFromObject() == null,
							click: routingPaletteViewModel.trialStopViewModel.eventsManager.createFromSelectionClick.bind(routingPaletteViewModel.trialStopViewModel.eventsManager, null, $('.routingmap_panel' + routeState).find('.trial-stop-section'))
						}),
						new TF.RoutingMap.MenuItem({
							isDevider: true
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Add Stop at Junction Selection',
							icon: null,
							id: 'addStopAtJunctionSelection',
							data: { id: -987 },
							disable: trialStopDisable,
							children: [new TF.RoutingMap.MenuItem({
								header: 'Polygon',
								icon: 'polygon',
								id: 'trialStopPolygon',
								children: [],
								data: { id: -987 },
								disable: trialStopDisable,
								click: routingPaletteViewModel.trialStopViewModel.eventsManager.selectJunctionAreaOptionClick.bind(routingPaletteViewModel.trialStopViewModel.eventsManager, 'polygon', routingPaletteViewModel.trialStopViewModel.eventsManager, $('.routingmap_panel' + routeState).find('.trial-stop-section'))
							}),
							new TF.RoutingMap.MenuItem({
								header: 'Rectangle',
								icon: 'rectangle',
								id: 'trialStopRectangle',
								children: [],
								data: { id: -987 },
								disable: trialStopDisable,
								click: routingPaletteViewModel.trialStopViewModel.eventsManager.selectJunctionAreaOptionClick.bind(routingPaletteViewModel.trialStopViewModel.eventsManager, 'rectangle', routingPaletteViewModel.trialStopViewModel.eventsManager, $('.routingmap_panel' + routeState).find('.trial-stop-section'))
							}),
							new TF.RoutingMap.MenuItem({
								header: 'Draw',
								icon: 'draw',
								id: 'trialStopDraw',
								children: [],
								data: { id: -987 },
								disable: trialStopDisable,
								click: routingPaletteViewModel.trialStopViewModel.eventsManager.selectJunctionAreaOptionClick.bind(routingPaletteViewModel.trialStopViewModel.eventsManager, 'draw', routingPaletteViewModel.trialStopViewModel.eventsManager, $('.routingmap_panel' + routeState).find('.trial-stop-section'))
							}),
							new TF.RoutingMap.MenuItem({
								header: 'Circle',
								icon: 'circle',
								id: 'trialStopCircle',
								children: [],
								data: { id: -987 },
								disable: trialStopDisable,
								click: routingPaletteViewModel.trialStopViewModel.eventsManager.selectJunctionAreaOptionClick.bind(routingPaletteViewModel.trialStopViewModel.eventsManager, 'circle', routingPaletteViewModel.trialStopViewModel.eventsManager, $('.routingmap_panel' + routeState).find('.trial-stop-section'))
							})]
						})
						]
					}));
				}

				var unassignedStudentViewModelDisable = !routingPaletteViewModel.obShow() || !routingPaletteViewModel.unassignedStudentViewModel.isShowMode();
				if (!unassignedStudentViewModelDisable && !stopDisable)
				{
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Unassigned Students',
						icon: null,
						data: { id: -986 },
						disable: unassignedStudentViewModelDisable,
						children: [new TF.RoutingMap.MenuItem({
							header: 'Polygon',
							icon: 'polygon',
							id: 'unassignedSearchPolygon',
							children: [],
							data: { id: -986 },
							disable: unassignedStudentViewModelDisable,
							click: routingPaletteViewModel.unassignedStudentViewModel.eventsManager.selectAreaOptionClick.bind(routingPaletteViewModel.unassignedStudentViewModel.eventsManager, 'polygon')
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Rectangle',
							icon: 'rectangle',
							id: 'unassignedSearchPolygonRectangle',
							children: [],
							data: { id: -986 },
							disable: unassignedStudentViewModelDisable,
							click: routingPaletteViewModel.unassignedStudentViewModel.eventsManager.selectAreaOptionClick.bind(routingPaletteViewModel.unassignedStudentViewModel.eventsManager, 'rectangle')
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Draw',
							icon: 'draw',
							id: 'unassignedSearchPolygonDraw',
							children: [],
							data: { id: -986 },
							disable: unassignedStudentViewModelDisable,
							click: routingPaletteViewModel.unassignedStudentViewModel.eventsManager.selectAreaOptionClick.bind(routingPaletteViewModel.unassignedStudentViewModel.eventsManager, 'draw')
						}),
						new TF.RoutingMap.MenuItem({
							header: 'Circle',
							icon: 'circle',
							id: 'unassignedSearchPolygonCircle',
							children: [],
							data: { id: -986 },
							disable: unassignedStudentViewModelDisable,
							click: routingPaletteViewModel.unassignedStudentViewModel.eventsManager.selectAreaOptionClick.bind(routingPaletteViewModel.unassignedStudentViewModel.eventsManager, 'circle')
						})
						]
					}));
				}
				var clearGeofinderDisbale = documentViewModel.RoutingMapTool.geoFinderTool._drawPolygonLayer.graphics.length == 0;
				if (!clearGeofinderDisbale)
				{
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						isDevider: true
					}));
					tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
						header: 'Clear Geofinder Boundary',
						icon: null,
						data: { id: -985 },
						disable: clearGeofinderDisbale,
						click: documentViewModel.RoutingMapTool.geoFinderTool.clear.bind(documentViewModel.RoutingMapTool.geoFinderTool)
					}));
				}

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
			if (((contextMenuCategories.parcels.length + contextMenuCategories.points.length) > 0 ? 1 : 0) +
				((contextMenuCategories.boundaries.length + contextMenuCategories.popRegions.length) > 0 ? 1 : 0) +
				contextMenuCategories.streets.length + contextMenuCategories.travelRegions.length +
				contextMenuCategories.railroads.length + contextMenuCategories.zipCodes.length +
				contextMenuCategories.municipalBoundaries.length + contextMenuCategories.water.length + contextMenuCategories.landmarks.length +
				contextMenuCategories.tripPaths.length + contextMenuCategories.students.length +
				contextMenuCategories.trips.length +
				contextMenuCategories.tripSessions.length +
				contextMenuCategories.stopPools.length +
				contextMenuCategories.trialStops.length +
				contextMenuCategories.nonEligibleZones.length > 1)
			{
				var children = contextMenu.root.children;
				contextMenu.root.children = [];
				var parcelPointsMenuItem = new TF.RoutingMap.MenuItem({
					header: 'Parcels & Address Point',
					icon: null
				});
				var boundariesMenuItem = new TF.RoutingMap.MenuItem({
					header: 'Boundary Planning',
					icon: null
				});
				var tripsMenuItem = new TF.RoutingMap.MenuItem({
					header: 'Trip',
					icon: null
				});
				var tripSessionsMenuItem = new TF.RoutingMap.MenuItem({
					header: 'Trip Stop',
					icon: null
				});
				var tripPathsMenuItem = new TF.RoutingMap.MenuItem({
					header: 'Trip Path',
					icon: null
				});
				var studentsMenuItem = new TF.RoutingMap.MenuItem({
					header: 'Students',
					icon: null
				});
				var streetsMenuItem = new TF.RoutingMap.MenuItem({
					header: 'Streets',
					icon: null
				});
				var travelRegionsMenuItem = new TF.RoutingMap.MenuItem({
					header: 'Travel Regions',
					icon: null
				});
				var railroadsMenuItem = new TF.RoutingMap.MenuItem({
					header: 'Railroads',
					icon: null
				});
				var zipCodesMenuItem = new TF.RoutingMap.MenuItem({
					header: 'Postal Codes',
					icon: null
				});
				var municipalBoundariesMenuItem = new TF.RoutingMap.MenuItem({
					header: 'Municipal Boundaries',
					icon: null
				});
				var waterMenuItem = new TF.RoutingMap.MenuItem({
					header: 'Water',
					icon: null
				});
				var landmarkMenuItem = new TF.RoutingMap.MenuItem({
					header: 'Landmark',
					icon: null
				});
				var stopPoolMenuItem = new TF.RoutingMap.MenuItem({
					header: routingPaletteViewModel.stopPoolViewModel.display.obStopPoolName() != '' ? routingPaletteViewModel.stopPoolViewModel.display.obStopPoolName() : 'Stop Pool',
					icon: null
				});
				var trialStopMenuItem = new TF.RoutingMap.MenuItem({
					header: 'Trial Stop',
					icon: null
				});
				var nonEligibleZoneMenuItem = new TF.RoutingMap.MenuItem({
					header: 'Non Eligible Zone',
					icon: null
				});
				if ((contextMenuCategories.parcels.length + contextMenuCategories.points.length) > 0)
				{
					contextMenu.addChild(parcelPointsMenuItem);
				}
				if ((contextMenuCategories.boundaries.length + contextMenuCategories.popRegions.length) > 0)
				{
					contextMenu.addChild(boundariesMenuItem);
				}
				if (contextMenuCategories.trips.length > 0)
				{
					contextMenu.addChild(tripsMenuItem);
				}
				if (contextMenuCategories.tripPaths.length > 0)
				{
					contextMenu.addChild(tripPathsMenuItem);
				}
				if (contextMenuCategories.tripSessions.length > 0)
				{
					contextMenu.addChild(tripSessionsMenuItem);
				}
				if (contextMenuCategories.students.length > 0)
				{
					contextMenu.addChild(studentsMenuItem);
				}
				if (contextMenuCategories.streets.length > 0)
				{
					contextMenu.addChild(streetsMenuItem);
				}
				if (contextMenuCategories.travelRegions.length > 0)
				{
					contextMenu.addChild(travelRegionsMenuItem);
				}
				if (contextMenuCategories.railroads.length > 0)
				{
					contextMenu.addChild(railroadsMenuItem);
				}
				if (contextMenuCategories.zipCodes.length > 0)
				{
					contextMenu.addChild(zipCodesMenuItem);
				}
				if (contextMenuCategories.municipalBoundaries.length > 0)
				{
					contextMenu.addChild(municipalBoundariesMenuItem);
				}
				if (contextMenuCategories.water.length > 0)
				{
					contextMenu.addChild(waterMenuItem);
				}
				if (contextMenuCategories.landmarks.length > 0)
				{
					contextMenu.addChild(landmarkMenuItem);
				}
				if (contextMenuCategories.stopPools.length > 0)
				{
					contextMenu.addChild(stopPoolMenuItem);
				}
				if (contextMenuCategories.trialStops.length > 0)
				{
					contextMenu.addChild(trialStopMenuItem);
				}
				if (contextMenuCategories.nonEligibleZones.length > 0)
				{
					contextMenu.addChild(nonEligibleZoneMenuItem);
				}
				for (var i = 0; i < children.length; i++)
				{
					var child = children[i];
					if (child.config.type == 'parcelPoints')
					{
						if (contextMenuCategories.parcels.length + contextMenuCategories.points.length > 1)
							parcelPointsMenuItem.addChild(child);
						else parcelPointsMenuItem.setChildren(child.children);
					}
					else if (child.config.type == 'boundaries' || child.config.type == 'populationRegion')
					{
						if (contextMenuCategories.boundaries.length + contextMenuCategories.popRegions.length > 1)
							boundariesMenuItem.addChild(child);
						else boundariesMenuItem.setChildren(child.children);
					}
					else if (child.config.type == 'trip')
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
					else if (child.config.type == 'tripPath')
					{
						if (contextMenuCategories.tripPaths.length > 1)
							tripPathsMenuItem.addChild(child);
						else tripPathsMenuItem.setChildren(child.children);
					}
					else if (child.config.type == 'student')
					{
						if (contextMenuCategories.students.length > 1)
							studentsMenuItem.addChild(child);
						else studentsMenuItem.setChildren(child.children);
					}
					else if (child.config.type == 'mystreets')
					{
						if (contextMenuCategories.streets.length > 1)
							streetsMenuItem.addChild(child);
						else streetsMenuItem.setChildren(child.children);
					}
					else if (child.config.type == 'travelRegion')
					{
						if (contextMenuCategories.travelRegions.length > 1)
							travelRegionsMenuItem.addChild(child);
						else travelRegionsMenuItem.setChildren(child.children);
					}
					else if (child.config.type == 'railroad')
					{
						if (contextMenuCategories.railroads.length > 1)
							railroadsMenuItem.addChild(child);
						else railroadsMenuItem.setChildren(child.children);
					}
					else if (child.config.type == 'zipCode')
					{
						if (contextMenuCategories.zipCodes.length > 1)
							zipCodesMenuItem.addChild(child);
						else zipCodesMenuItem.setChildren(child.children);
					}
					else if (child.config.type == 'municipalBoundary')
					{
						if (contextMenuCategories.municipalBoundaries.length > 1)
							municipalBoundariesMenuItem.addChild(child);
						else municipalBoundariesMenuItem.setChildren(child.children);
					}
					else if (child.config.type == 'water')
					{
						if (contextMenuCategories.water.length > 1)
							waterMenuItem.addChild(child);
						else waterMenuItem.setChildren(child.children);
					}
					else if (child.config.type == 'landmark')
					{
						if (contextMenuCategories.landmarks.length > 1)
							landmarkMenuItem.addChild(child);
						else landmarkMenuItem.setChildren(child.children);
					}
					else if (child.config.type == "stopPoolBoundary")
					{
						if (contextMenuCategories.stopPools.length > 1)
							stopPoolMenuItem.addChild(child);
						else stopPoolMenuItem.setChildren(child.children);
					}
					else if (child.config.type == "trialStopBoundary")
					{
						if (contextMenuCategories.trialStops.length > 1)
							trialStopMenuItem.addChild(child);
						else trialStopMenuItem.setChildren(child.children);
					}
					else if (child.config.type == "nonEligibleZone")
					{
						if (contextMenuCategories.nonEligibleZones.length > 1)
							nonEligibleZoneMenuItem.addChild(child);
						else nonEligibleZoneMenuItem.setChildren(child.children);
					}
				}
			}

			return contextMenu;
		}

		function onMenuItemClick(menuItem, e, parcelPaletteViewModel, boundaryPaletteViewModel, mapEditingPaletteViewModel, routingPaletteViewModel, routeState)
		{
			var selectedMenuItem = null;
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
				for (var i = 0; i < selectedMenuItemHeader.length; i++)
				{
					if (selectedMenuItemHeader[i].routeState == routeState)
					{
						if (selectedMenuItemHeader[i].id == selectedMenuItem.config.data.id &&
							selectedMenuItemHeader[i].operation == selectedMenuItem.config.id)
						{
							selectedMenuItemHeader[i].id = -1;
							selectedMenuItemHeader[i].operation = "";
							// parcelPaletteViewModel.drawTool.stop();
							// boundaryPaletteViewModel.drawTool.stop();
							// boundaryPaletteViewModel.drawPopulationTool.stop();
							// boundaryPaletteViewModel.editPopulationTool.stop();
							// travelScenariosPaletteViewModel.travelRegionsViewModel.drawTravelTool.stop();
							// travelScenariosPaletteViewModel.travelRegionsViewModel.editTravelTool.stop();
							// mapEditingPaletteViewModel.myStreetsViewModel.drawMyStreetsTool.stop();
							// mapEditingPaletteViewModel.myStreetsViewModel.editMyStreetsTool.stop();
							// mapEditingPaletteViewModel.railroadViewModel.drawTool.stop();
							// mapEditingPaletteViewModel.railroadViewModel.editTool.stop();
							// mapEditingPaletteViewModel.zipCodeViewModel.drawZipCodeTool.stop();
							// mapEditingPaletteViewModel.zipCodeViewModel.editZipCodeTool.stop();
							// mapEditingPaletteViewModel.municipalBoundaryViewModel.drawMunicipalBoundaryTool.stop();
							// mapEditingPaletteViewModel.municipalBoundaryViewModel.editMunicipalBoundaryTool.stop();
							// mapEditingPaletteViewModel.waterViewModel.drawTool.stop();
							// mapEditingPaletteViewModel.waterViewModel.editTool.stop();
							// mapEditingPaletteViewModel.landmarkViewModel.drawTool.stop();
							// mapEditingPaletteViewModel.landmarkViewModel.editTool.stop();
							// routingPaletteViewModel.tripViewModel.drawTool.stop();
							// routingPaletteViewModel.tripViewModel.editTool.stop();
							// routingPaletteViewModel.stopPoolViewModel.drawTool.stop();
							// routingPaletteViewModel.stopPoolViewModel.editTool.stop();
							// routingPaletteViewModel.trialStopViewModel.drawTool.stop();
							// routingPaletteViewModel.trialStopViewModel.editTool.stop();
							return false;
						}
						else 
						{
							if (selectedMenuItem.config.data.notSelectable)
							{
								selectedMenuItemHeader[i].id = -1;
								selectedMenuItemHeader[i].operation = "";
							}
							else
							{
								selectedMenuItemHeader[i].id = selectedMenuItem.config.data.id;
								selectedMenuItemHeader[i].operation = selectedMenuItem.config.id ? selectedMenuItem.config.id : "";
							}

						}
					}
				}
			}
			else if (!selectedMenuItem.config.data.notSelectable)
			{
				selectedMenuItemHeader.push({
					routeState: routeState,
					id: selectedMenuItem.config.data.id,
					operation: selectedMenuItem.config.id ? selectedMenuItem.config.id : ""
				});
			}
			return true;
		}

		function existOperateData(routeState)
		{
			for (var i = 0; i < selectedMenuItemHeader.length; i++)
			{
				if (selectedMenuItemHeader[i].routeState == routeState)
				{
					return true;
				}
			}
			return false;
		}

		function getDataModalByPosition(map, arcgis, e, parcelPointsViewModel, boundaryViewModel, mapEditingPaletteViewModel, routingPaletteViewModel, travelScenariosPaletteViewModel)
		{
			var parcelResult = [],
				boundaryResult = [],
				tripSessionResult = [],
				tripPathResult = [],
				studentResult = [],
				streetResult = [],
				travelRegionResult = [],
				railroadResult = [],
				zipCodeResult = [],
				municipalBoundaryResult = [],
				waterResult = [],
				landmarkResult = [],
				stopPoolResult = [],
				trialStopResult = [],
				nonEligibleZoneResult = [];
			var featureLayerQueryPromises = [];
			var extent = TF.Helper.MapHelper.getPointExtent(map, e.mapPoint);

			// Parcel and Point Palette Graphics
			if (parcelPointsViewModel.obShow())
			{
				if (TF.Helper.MapHelper.layerVisible(map, map.findLayerById("parcelBoundaryFeatureLayer")))
				{
					var allData = Object.values(parcelPointsViewModel.dataModel.all).filter(function(c)
					{
						return c.type != "Point" || !c.isCentroid;
					});

					featureLayerQueryPromises.push(getFeatureLayerIntersects(parcelPointsViewModel, extent, {
						all: allData
					}).then(function(items)
					{
						parcelResult = items;
					}));
				}
			}

			// Boundary Palette Graphics
			if (boundaryViewModel.obShow())
			{
				if ((map.findLayerById("schoolBoundaryLayer").visible == null || map.findLayerById("schoolBoundaryLayer").visible) &&
					boundaryViewModel.schoolBoundaryViewModel.isShowMode())
				{
					map.findLayerById("schoolBoundaryLayer").graphics.items.map(function(graphic)
					{
						if (arcgis.geometryEngine.intersects(e.mapPoint, graphic.geometry) && graphic.visible)
						{
							boundaryResult.push(graphic.attributes.dataModel);

						}
					});
				}
				if ((map.findLayerById("populationRegionLayer").visible == null || map.findLayerById("populationRegionLayer").visible) &&
					boundaryViewModel.populationRegionViewModel.isShowMode())
				{
					map.findLayerById("populationRegionLayer").graphics.items.map(function(graphic)
					{
						if (arcgis.geometryEngine.intersects(e.mapPoint, graphic.geometry) && graphic.visible)
						{
							boundaryResult.push(graphic.attributes.dataModel);
						}
					});
				}
			}

			if (travelScenariosPaletteViewModel.obShow())
			{
				var travelRegionLayer = map.findLayerById("travelRegionLayer");
				if (TF.Helper.MapHelper.layerVisible(map, travelRegionLayer))
				{
					travelRegionResult = getGraphicLayerIntersects(travelRegionLayer, extent);
				}
			}

			if (mapEditingPaletteViewModel.obShow() || travelScenariosPaletteViewModel.obShow())
			{
				if (TF.Helper.MapHelper.layerVisible(map, mapEditingPaletteViewModel.myStreetsViewModel.drawTool._polylineLayer))
				{
					featureLayerQueryPromises.push(getFeatureLayerIntersects(mapEditingPaletteViewModel.myStreetsViewModel, extent).then(function(items)
					{
						streetResult = items;
					}));
				}
			}

			// Map Editing Palette Graphics
			if (mapEditingPaletteViewModel.obShow())
			{
				if (TF.Helper.MapHelper.layerVisible(map, mapEditingPaletteViewModel.railroadViewModel.drawTool._polylineLayer))
				{
					featureLayerQueryPromises.push(getFeatureLayerIntersects(mapEditingPaletteViewModel.railroadViewModel, extent).then(function(items)
					{
						railroadResult = items;
					}));
				}

				var zipCodeLayer = map.findLayerById("zipCodeLayer");
				if (TF.Helper.MapHelper.layerVisible(map, zipCodeLayer))
				{
					zipCodeResult = getGraphicLayerIntersects(zipCodeLayer, extent);
				}

				var municipalBoundaryLayer = map.findLayerById("municipalBoundaryLayer");
				if (TF.Helper.MapHelper.layerVisible(map, municipalBoundaryLayer))
				{
					municipalBoundaryResult = getGraphicLayerIntersects(municipalBoundaryLayer, extent);
				}

				if (TF.Helper.MapHelper.layerVisible(map, mapEditingPaletteViewModel.waterViewModel.drawTool._polylineLayer))
				{
					featureLayerQueryPromises.push(getFeatureLayerIntersects(mapEditingPaletteViewModel.waterViewModel, extent).then(function(items)
					{
						waterResult = items;
					}));
				}

				if (TF.Helper.MapHelper.layerVisible(map, mapEditingPaletteViewModel.landmarkViewModel.drawTool._polygonLayer))
				{
					featureLayerQueryPromises.push(getFeatureLayerIntersects(mapEditingPaletteViewModel.landmarkViewModel, extent).then(function(items)
					{
						landmarkResult = items;
					}));
				}
			}

			// Routing Palette Graphics
			if (routingPaletteViewModel.obShow())
			{
				if (TF.Helper.MapHelper.layerVisible(map, map.findLayerById("routingFeatureLayer")))
				{
					var tripPathIntersectsResult = getGraphicLayerIntersects(map.findLayerById("routingFeatureLayer"), extent);
					tripPathIntersectsResult.forEach(function(trip)
					{
						var matchCount = 0;
						for (var i = 0; i < trip.TripStops.length; i++)
						{
							var pathLineType = tf.storageManager.get("pathLineType") || "Path";
							var path = TF.Helper.TripHelper.getDrawTripPathGeometry(trip.TripStops[i], trip, pathLineType);
							if (path && tf.map.ArcGIS.geometryEngine.intersects(extent, path) && i < trip.TripStops.length - 1)
							{
								matchCount++;
								tripPathResult.push({
									trip: trip,
									tripStop: trip.TripStops[i],
									tripStops: [trip.TripStops[i], trip.TripStops[i + 1]],
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
								result.Name = result.Name + " " + result.tripStop.Sequence;
							}
						}
					});
				}

				if (TF.Helper.MapHelper.layerVisible(map, map.findLayerById("routingTripStopBoundaryLayer")) && routingPaletteViewModel.tripViewModel.isShowMode())
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

				if (TF.Helper.MapHelper.layerVisible(map, routingPaletteViewModel.unassignedStudentViewModel.drawTool._pointLayer))
				{
					featureLayerQueryPromises.push(getFeatureLayerIntersects(routingPaletteViewModel.unassignedStudentViewModel, extent, { getKey: function(obj) { return obj.id + "_" + obj.RequirementID + "_" + obj.PreviousScheduleID; } }).then(function(items)
					{
						studentResult = studentResult.concat(items);
					}));
				}

				if (TF.Helper.MapHelper.layerVisible(map, map.findLayerById("routingTripStudentLayer")))
				{
					studentResult = studentResult.concat(getGraphicLayerIntersects(map.findLayerById("routingTripStudentLayer"), extent));
				}

				if (TF.Helper.MapHelper.layerVisible(map, map.findLayerById("stopPoolFeatureLayer")) && routingPaletteViewModel.stopPoolViewModel.isShowMode())
				{
					stopPoolResult = getGraphicLayerIntersects(map.findLayerById("stopPoolFeatureLayer"), extent);
				}

				if (((map.findLayerById("trialStopFeatureLayer").visible == null || map.findLayerById("trialStopFeatureLayer").visible) ||
					(map.findLayerById("trialStopPointLayer").visible == null || map.findLayerById("trialStopPointLayer").visible)) &&
					routingPaletteViewModel.trialStopViewModel.isShowMode())
				{
					trialStopResult = getGraphicLayerIntersects(map.findLayerById("trialStopFeatureLayer"), extent);
					var trialPoints = getGraphicLayerIntersects(map.findLayerById("trialStopPointLayer"), extent).filter(function(item)
					{
						return !Enumerable.From(trialStopResult).Any(function(c) { return c.id == item.id; });
					});
					trialStopResult = trialStopResult.concat(trialPoints);
				}

				if (map.findLayerById("nonEligibleLayer").visible)
				{
					nonEligibleZoneResult = getGraphicLayerIntersects(map.findLayerById("nonEligibleLayer"), extent);
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
				return getFullInfo(parcelResult).then(function()
				{
					return Promise.all([filterUnLockItems(parcelPointsViewModel.dataModel.parcelLockData, parcelResult),
					filterUnLockItems(boundaryViewModel.dataModel.populationRegionLockData, boundaryResult),
					filterUnLockItems(routingPaletteViewModel.tripViewModel.dataModel.tripLockData, tripSessionResult),
					filterUnLockItems(null, studentResult),
					filterUnLockItems(routingPaletteViewModel.tripViewModel.dataModel.tripLockData, tripPathResult),
					filterUnLockItems(mapEditingPaletteViewModel.myStreetsViewModel.dataModel.streetsLockData, streetResult),
					filterUnLockItems(travelScenariosPaletteViewModel.travelRegionsViewModel.dataModel.travelRegionLockData, travelRegionResult),
					filterUnLockItems(mapEditingPaletteViewModel.railroadViewModel.dataModel.lockData, railroadResult),
					filterUnLockItems(mapEditingPaletteViewModel.zipCodeViewModel.dataModel.zipCodeLockData, zipCodeResult),
					filterUnLockItems(mapEditingPaletteViewModel.municipalBoundaryViewModel.dataModel.municipalBoundaryLockData, municipalBoundaryResult),
					filterUnLockItems(mapEditingPaletteViewModel.waterViewModel.dataModel.lockData, waterResult),
					filterUnLockItems(mapEditingPaletteViewModel.landmarkViewModel.dataModel.lockData, landmarkResult),
					filterUnLockItems(routingPaletteViewModel.stopPoolViewModel.dataModel.lockData, stopPoolResult),
					filterUnLockItems(null, nonEligibleZoneResult)
					])
						.then(function(items)
						{
							items = items.concat(trialStopResult);
							return items.reduce(function(a, b)
							{
								return a.concat(b);
							});
						});
				});
			});
		}

		function getFeatureLayerIntersects(viewModel, extent, options)
		{
			var query = new tf.map.ArcGIS.Query();
			query.outFields = ["id"];
			query.where = "1=1";
			query.geometry = extent;

			var dataModel = viewModel.dataModel;
			var drawTool = viewModel.drawTool;
			var ids = [];
			function queryFeatures(featureLayer)
			{
				return featureLayer.queryFeatures(query).then(function(featureSet)
				{
					ids = ids.concat(featureSet.features.map(function(graphic)
					{
						return graphic.attributes.id;
					}));
				});
			}
			var promises = [];

			drawTool._polygonLayer && promises.push(queryFeatures(drawTool._polygonLayer));
			drawTool._polylineLayer && promises.push(queryFeatures(drawTool._polylineLayer));
			drawTool._pointLayer && promises.push(queryFeatures(drawTool._pointLayer));

			return Promise.all(promises).then(function()
			{
				if (drawTool.isEditing)
				{
					drawTool.sketchTool._drawingLayer.graphics.items.forEach(function(graphic)
					{
						if (graphic && graphic.visible && extent.intersects(graphic.geometry))
						{
							ids.push(graphic.attributes.id);
						}
					});
				}
				if (ids.length == 0)
				{
					return [];
				}
				var all = (options && options.all) || dataModel.all;
				all = TF.toMapping(all, options ? options.getKey : null);
				var result = {};
				for (var i = 0; i < ids.length; i++)
				{
					if (all[ids[i]])
					{
						result[ids[i]] = all[ids[i]];
					}
				}
				return Object.values(result);
			});
		}

		function getGraphicLayerIntersects(layer, extent, tolerance, filter)
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

		return {
			showContextMenu: function(documentViewModel, map, arcgis, e, routeState, lastPreventKey)
			{
				var container = documentViewModel.$mapDiv.closest('#main'),
					parcelPointsViewModel = documentViewModel.parcelPaletteViewModel,
					boundaryViewModel = documentViewModel.boundaryPaletteViewModel,
					mapEditingPaletteViewModel = documentViewModel.mapEditingPaletteViewModel,
					routingPaletteViewModel = documentViewModel.routingPaletteViewModel,
					geoSearchPaletteViewModel = documentViewModel.geoSearchPaletteViewModel,
					travelScenariosPaletteViewModel = documentViewModel.travelScenariosPaletteViewModel;

				getDataModalByPosition(map, arcgis, e, parcelPointsViewModel, boundaryViewModel, mapEditingPaletteViewModel, routingPaletteViewModel, travelScenariosPaletteViewModel).then(function(data)
				{
					if (documentViewModel._lastPreventKey != lastPreventKey)
					{
						return;
					}

					if (data.length == 0 && this.isLockAlert)
					{
						return;
					}

					var contextMenu = buildContextMenuInternal(container, data, parcelPointsViewModel, boundaryViewModel, mapEditingPaletteViewModel, routingPaletteViewModel, geoSearchPaletteViewModel, routeState, documentViewModel);

					contextMenu.onClickEvent = function(menuItem, e)
					{
						return onMenuItemClick(menuItem, e, parcelPointsViewModel, boundaryViewModel, mapEditingPaletteViewModel, routingPaletteViewModel, routeState);
					};

					contextMenu.showMenu(e.native, null, 75, ".map-page");
					for (var i = 0; i < selectedMenuItemHeader.length; i++)
					{
						if (selectedMenuItemHeader[i].routeState == routeState)
						{
							contextMenu.enumAllMenuItems(function(contextMenu, menuItem)
							{
								if (menuItem.config.data &&
									menuItem.config.data.id == selectedMenuItemHeader[i].id &&
									selectedMenuItemHeader[i].operation == menuItem.config.id)
								{
									setFontToBold(menuItem);
								}
							});
						}
					}
				});
			},
			clearOperation: function()
			{
				selectedMenuItemHeader.map(function(item)
				{
					if (item.routeState == currentTabRouteState)
					{
						item.id = -1;
						item.operation = "";
					}
				});
			}
		}
	}());
}());