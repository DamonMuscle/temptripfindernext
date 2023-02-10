(function()
{
	createNamespace("TF.RoutingMap").DirectionPaletteViewModel_ESRI = DirectionPaletteViewModel;

	function DirectionPaletteViewModel(viewModal, isOpen, routeState)
	{
		var self = this;
		TF.RoutingMap.BasePaletteViewModel.call(self, viewModal, isOpen, routeState);
		self.type = "direction";
		self.title = "Directions";
		self.obTitle = ko.observable("Directions");
		self.isOpen = !!isOpen;
		self.templateName = "Workspace/Page/RoutingMap/RoutingMapPanel/DirectionPalette";
		self.isEyeVisible(true);
		self.isShowMode(true);
		self.isShowMode.subscribe(self._changeShow.bind(self));
		self.eyeTitle("Direction");
		self.element = null;
		self.StopTypeEnum = TF.RoutingMap.Directions.Enum.StopTypeEnum;

		// init
		self.printSettinginit();
		self.uTurnSettinginit();
		self.obDestinationsArray = ko.observableArray();
		self.obTomTomNAChecked = ko.observable(false);
		self.obDestinationDetailsChecked = ko.observable(true);
		self.obDestinationRoundTripChecked = ko.observable();
		self.obChangeRouteChecked = ko.observable(true);
		self.obMapDetailsChecked = ko.observable(true);
		self.obShowArrowsChecked = ko.observable(true);
		self.obHasFilledFirstDestOneTime = ko.observable();
		self.obHasFilledLastDestOneTime = ko.observable();
		self.obIsDropModeOpen = ko.observable(false);
		self.resetPanel();
		self.travelScenarios = ko.observableArray();

		// Tools
		self.openDestinationDropModeClick = self.openDestinationDropModeClick.bind(self);
		self.rerunClick = self.rerunClick.bind(self);
		self.zoomToLayersClick = self.zoomToLayersClick.bind(self);
		self.clearAllClick = self.clearAllClick.bind(self);
		self.printClick = self.printClick.bind(self);
		// self.dropDownClick = self.dropDownClick.bind(self);
		self.dropDownMenuClick = self.dropDownMenuClick.bind(self);
		self.selectPringSettingItemClick = self.selectPringSettingItemClick.bind(self);
		self.selectUturnSettingItemClick = self.selectUturnSettingItemClick.bind(self);
		self.selectSelectTravelScenarioClick = self.selectSelectTravelScenarioClick.bind(self);
		self.togglsStopsDisplay = self.togglsStopsDisplay.bind(self);
		// self.uTurnDropDownClick = self.uTurnDropDownClick.bind(self);

		// Content
		self.addNewDestinationClick = self.addNewDestinationClick.bind(self);
		self.setAsThroughPointClick = self.setAsThroughPointClick.bind(self);
		self.removeDestinationClick = self.removeDestinationClick.bind(self);

		self.setAsDestinationClick = self.setAsDestinationClick.bind(self);
		self.removeThroughPointClick = self.removeThroughPointClick.bind(self);

		// Direction Details
		self.obDirectionDetails = ko.observableArray([]);
		self.obIsDirectionAvailable = ko.computed(function()
		{
			if (self.obDestinationDetailsChecked())
			{
				var validDestinations = self.obDestinationsArray().filter(function(item) { return !!item.address(); });

				if (validDestinations.length > 1)
				{
					return true;
				}
			}

			self.obDirectionDetails([]);
			return false;
		}, self);
		self.obTotalTime = ko.observable(0);
		self.obTotalTimeHourDisplay = ko.computed(function()
		{
			return Math.floor(self.obTotalTime() / 60);
		}, self);
		self.obTotalTimeMinuteDisplay = ko.computed(function()
		{
			return Math.floor(self.obTotalTime() % 60);
		}, self);
		self.obTotalTimeSecondDisplay = ko.computed(function()
		{
			return Math.floor((self.obTotalTime() - Math.floor(self.obTotalTime())) * 60);
		}, self);
		self.obTotalDistance = ko.observable(0);
		self.obTotalDistanceMileDisplay = ko.computed(function()
		{
			var value = self.unitConvert(self.obTotalDistance());
			return value >= 0.01 ? value.toFixed(2) : 0;
		}, self);
		self.obUnitOfMeasure = ko.computed(function()
		{
			return tf.measurementUnitConverter.getShortUnits();
		}, self);

		self.obTotalDistanceFeetDisplay = ko.computed(function()
		{
			var value = self.unitConvert(self.obTotalDistance());
			return Math.floor((value - Math.floor(value)) * tf.measurementUnitConverter.getRatio() / 100);
		}, self);
		self.directionDetailsMouseEnter = self.directionDetailsMouseEnter.bind(self);
		self.directionDetailsMouseLeave = self.directionDetailsMouseLeave.bind(self);

		// Events
		self.onOpenDestinationDropModeClicked = new TF.Events.Event();
		self.onRerunClicked = new TF.Events.Event();
		self.onZoomToLayersClicked = new TF.Events.Event();
		self.onDataChanged = new TF.Events.Event();
		self.onUTurnPolicyChanged = new TF.Events.Event();

		self.onRemovePointClicked = new TF.Events.Event();
		self.onSetAsThroughPointClicked = new TF.Events.Event();
		self.onSetAsDestinationClicked = new TF.Events.Event();

		self.onPrintDirectionClicked = new TF.Events.Event();

		self.onDetailsMouseEntered = new TF.Events.Event();
		self.onDetailsMouseLeaved = new TF.Events.Event();

		// Others
		ko.pureComputed(function()
		{
			return self.obTomTomNAChecked();
		}).subscribe(self.onTomTomNACheckboxClicked.bind(self));

		self._roundTripCheckBoxComputed = ko.pureComputed(function()
		{
			return self.obDestinationRoundTripChecked();
		});
		self._roundTripCheckBoxComputed.subscribe(self.onRoundTripCheckBoxClicked.bind(self));

		ko.pureComputed(function()
		{
			return self.obDestinationDetailsChecked();
		}).subscribe(self.onRequireDetailsCheckboxClicked.bind(self));

		ko.pureComputed(function()
		{
			return self.obChangeRouteChecked();
		}).subscribe(self.onChangeRouteCheckboxClicked.bind(self));

		ko.pureComputed(function()
		{
			return self.obMapDetailsChecked();
		}).subscribe(self.onMapDetailsCheckboxClicked.bind(self));

		ko.pureComputed(function()
		{
			return self.obShowArrowsChecked();
		}).subscribe(self.onShowArrowsCheckboxClicked.bind(self));

		self.travelScenario = null;
		PubSub.subscribe("selected-travel-scenario-change" + self._viewModal.routeState, self.selectedTravelScenarioChanged.bind(self));
		setTimeout(function()
		{
			self.notifyDataChange(true);
		}, 1000);
	}

	DirectionPaletteViewModel.prototype = Object.create(TF.RoutingMap.BasePaletteViewModel.prototype);
	DirectionPaletteViewModel.prototype.constructor = DirectionPaletteViewModel;

	DirectionPaletteViewModel.prototype._changeShow = function(event, data)
	{
		var self = this;
		var isShow = self.isShowMode();
		self._viewModal._directionsTool.getLayers().forEach(function(item)
		{
			item.visible = isShow;
		});
	};

	DirectionPaletteViewModel.prototype.show = function()
	{
		// tf.gaHelper.send('Area', 'Directions');
		if (this.obShow())
		{
			this.initTravelScenarios();
		}
	};

	DirectionPaletteViewModel.prototype.setDropDownMode = function(event, data)
	{
		var isDropDownModeOpen = data;

		this.obIsDropModeOpen(isDropDownModeOpen);
	};

	DirectionPaletteViewModel.prototype.onRoundTripCheckBoxClicked = function(checked)
	{
		var self = this,
			directionTool = self._viewModal._directionsTool;

		self.notifyDataChange(true);
		if (directionTool._stops === undefined)
		{
			directionTool._beginDropMode();
		}
		directionTool.calcRoundTrip();
	};

	/**
	 * The event handler when the "Show Details" checkbox is clicked.
	 * @param {bool} checked Whether the checkbox is checked or not after the action.
	 * @returns {void} 
	 */
	DirectionPaletteViewModel.prototype.onRequireDetailsCheckboxClicked = function(checked)
	{
		var self = this,
			skipReload = !checked,
			prevRouteResult, routeResult = null;

		if (checked)
		{
			prevRouteResult = self._viewModal._directionsTool._prevRouteResult;
			if (prevRouteResult)
			{
				routeResult = prevRouteResult.routeResults[0];
				self._viewModal._directionsTool.notifyDirectionChanged(routeResult);
			}
		} else
		{
			// If it is unchecked, the trip does not need to be re-calculated, but the panel configs need to be updated.
			self.setPanelConfigs();
		}

		if (skipReload)
		{
			self.notifyDataChange(true);
		}
		else
		{
			self.notifyDataChange(false, true);
		}
	};

	DirectionPaletteViewModel.prototype.onTomTomNACheckboxClicked = function(checked)
	{
		var self = this;
		self.notifyDataChange(false, true);
	};

	DirectionPaletteViewModel.prototype.onChangeRouteCheckboxClicked = function(checked)
	{
		var self = this;
		self.notifyDataChange(true);
	};

	DirectionPaletteViewModel.prototype.onMapDetailsCheckboxClicked = function(checked)
	{
		var self = this;
		self.notifyDataChange(true);
	};

	DirectionPaletteViewModel.prototype.onShowArrowsCheckboxClicked = function(checked)
	{
		var self = this;
		self.notifyDataChange(true);
		self._viewModal._directionsTool.addArrow();
	};

	DirectionPaletteViewModel.prototype.buildDestinationSearches = function()
	{
		var self = this;
		self.searches = self.searches || [];
		if (!self.ArcGisSearch ||
			!self.ArcGisExtent ||
			!self.ArcGisRegistry ||
			!self.map
		)
			return;

		self.destroySearches();

		var $parents = self.element.find('.directions-destination-search-wrapper');
		self.obDestinationsArray().forEach(function(destItem, idx)
		{
			var domId = 'directions-destination-search-' + self.routeState + destItem.seq();
			$($parents[idx]).prepend('<div id="' + domId + '"></div>');
		});

		self.obDestinationsArray().forEach(function(destItem, idx)
		{
			var domId = 'directions-destination-search-' + self.routeState + destItem.seq();

			var search = new self.ArcGisSearch({
				'allPlaceholder': 'Enter address or location',
				'autoSelect': false,
				'locationEnabled': false,
				'popupEnabled': false,
				'resultGraphicEnabled': false,
				'searchAllEnabled': false,
				"includeDefaultSources": false,
				"minSuggestCharacters": 3,
				'view': self.map.mapView,
				searchTerm: destItem ? destItem.address() : "",
				sources: [
					{
						locator: new self.ArcGisLocator({ url: arcgisUrls.StreetGeocodeServiceFile }),
						singleLineFieldName: "SingleLine",
						outFields: ["Addr_type"],
						name: "Geocoding Service",
						localSearchOptions: {
							distance: 100
						}
					}
				]
			}, domId);

			// if (destItem && search._inputNode)
			// {
			// 	search._inputNode.value = destItem.address();
			// }

			search.watch('activeSource', function(source)
			{
				// load
				source.searchExtent = self.map.mapView.extent;
				source.placeholder = 'Enter address or location';
				var searchButton = $('.esri-search__submit-button');
				if (searchButton.length > 0)
				{
					searchButton.remove();
				}
			});

			search.on('search-complete', function(event)
			{
				var result = event.results[0],
					seq = $(this.domNode).closest('.directions-destination-search-wrapper').find('.data-destination-seq').data('destination-seq'),
					idx = findDestinationIdx(seq, self.obDestinationsArray()),
					destItem = self.obDestinationsArray()[idx],
					item = null,
					geometry = null;

				if (result.results)
				{
					item = result.results[0];
					geometry = item.feature.geometry;
					destItem.address(item.name);
					destItem.xCoord(geometry.x);
					destItem.yCoord(geometry.y);
				}

				self.removeEmptyDestination();
				self.obDestinationsArray.valueHasMutated();
				setTimeout(function()
				{
					self.reloadDestinationPanel();
				}, 0);
				self.notifyDataChange();
			});

			search.on('search-blur', function(result)
			{
				setTimeout(function()
				{
					var $domNode = $(this.domNode),
						seq = $domNode.closest('.directions-destination-search-wrapper').find('.data-destination-seq').data('destination-seq'),
						idx = findDestinationIdx(seq, self.obDestinationsArray());
					if ($domNode.find('.esri-search__input').length > 0)
					{
						var inputValue = $domNode.find('.esri-search__input')[0].value;

						if (idx >= 0)
						{
							self.obDestinationsArray()[idx].address(inputValue);
						}
						if (!inputValue)
						{
							self.removeDestinationClick(self.obDestinationsArray()[idx]);
						}
					}
				}, 50);
			});

			search.on('search-focus', function()
			{
				var searchBox = this;
				TF.Map.Search.SetSuggestionPositionFixed(searchBox);
			});

			search.on('suggest-complete', function(data)
			{
				var searchBox = this;
				if (data.results.length === 0 && searchBox && searchBox.clear)
				{
					searchBox.clear();
				}
				else
				{
					TF.Map.Search.SetSuggestionPositionFixed(searchBox);
				}
			});

			self.searches.push(search);
		});
	};

	DirectionPaletteViewModel.prototype.removeEmptyDestination = function()
	{
		var self = this,
			destinationList = self.obDestinationsArray();
		for (var idx = destinationList.length - 1; idx >= 0; idx--)
		{
			var address = destinationList[idx].address();
			if (address === undefined ||
				address === null ||
				address === "")
			{
				destinationList.splice(idx, 1);
			}
		}

		destinationList = self.padEmptyDestination(destinationList);
		self.obDestinationsArray(destinationList);
		resetDestinationSeqs(self.obDestinationsArray());
	};

	DirectionPaletteViewModel.prototype.padEmptyDestination = function(list)
	{
		while (list.length < 2)
		{
			list.push(this.buildEmptyDestination());
		}

		return list;
	};

	DirectionPaletteViewModel.prototype.afterRender = function(el, dataModel)
	{
		console.log("ESRI afterRender");
		var self = this;
		self.element = $(el);
		self.ArcGisSearch = self._viewModal._arcgis.Search;
		self.ArcGisRegistry = self._viewModal._arcgis.registry;
		self.ArcGisExtent = self._viewModal._arcgis.Extent;
		self.ArcGisDirections = self._viewModal._arcgis.Directions;
		self.ArcGisLocator = self._viewModal._arcgis.Locator;

		self.map = self._viewModal._map;
		self.setPanelConfigs();
		self.reloadDestinationPanel();
		// https://developers.arcgis.com/javascript/latest/api-reference/esri-widgets-Directions.html
	};

	DirectionPaletteViewModel.prototype.onDockStatusChanged = function(e, status)
	{
		this.dockerStatus = status;
		this.setPanelConfigs();
	};

	DirectionPaletteViewModel.prototype.onPanelSizeChanged = function(e, size)
	{
		if (size && size.width)
		{
			var $directionDetailText = this.element.find(".directions-elementList .instruction"),
				$throughPointText = this.element.find(".through-point-address");
			this.processDirectionTextForDisplay($directionDetailText);
			this.processDirectionTextForDisplay($throughPointText);
		}

		this.setPanelConfigs();
	};

	/**
	 * Reset panel configurations (mainly height restrictions).
	 * @returns {void} 
	 */
	DirectionPaletteViewModel.prototype.setPanelConfigs = function()
	{
		var self = this;

		if (!self.panel)
		{
			return;
		}
		// The max-height value for the panel when it is floating
		var panelMaxHeightOnFloat = 600,
			status = self.panel.obDockStyle() ? self.panel.obDockStyle() : "float",
			panelMaxHeight = (status === "float") ? panelMaxHeightOnFloat : $(self.map.container).outerHeight(), paletteList = self.panel.$panel.find(".list-container"),
			paletteHeader = paletteList.find(".item-header"), paletteToolbar = paletteList.find(".directions-tool"),
			panelPaddingH = parseInt(paletteList.css("paddingTop")) + parseInt(paletteList.css("paddingBottom")),
			$stopsSection = paletteList.find(".directions-stops"),
			// $detailsSection = paletteList.find(".directions-details"),
			remainHeight = (panelMaxHeight - panelPaddingH - paletteToolbar.outerHeight() - paletteHeader.outerHeight());

		if (self.obDestinationDetailsChecked())
		{
			remainHeight -= paletteList.find(".summary").outerHeight();
			// $stopsSection.css("max-height", remainHeight / 2);
			// $detailsSection.css("max-height", remainHeight - $stopsSection.outerHeight());
		}
		else
		{
			// $stopsSection.css("max-height", remainHeight);
		}
	};

	DirectionPaletteViewModel.prototype.makeDestinationDraggable = function()
	{
		var self = this;
		self._startDestItem = null;
		self._endDestItem = null;
		if (!this.element)
		{
			return;
		}
		var directionsItems = this.element.find(".directions-items").find(".directions-item");
		directionsItems.draggable({
			cursor: "move",
			helper: function(event, ui)
			{
				return $(this).clone(true).addClass("clone").css("background-color", "#fff").css("opacity", .7).css("zIndex", 1003).css("pointer-events", "none").width($(this).width());
			},
			// scroll: true,
			handle: ".directions-destination-sort",
			// containment: ".directions-items-wrapper",
			// appendTo: ".directions-items",
			start: function(e)
			{
				self._startDestItem = ko.contextFor($(this).context).$data;
			},
			stop: function(e)
			{
				var $doms = self.element.find('.directions-items').find('.directions-item:not(".clone") .directions-destination-item');
				$doms.removeClass('active');
				var $doms2 = self.element.find('.directions-item-footer');
				$doms2.removeClass('active');
				self.clearScrollInterval();

				var sortConfig = self.getSortConfig();
				var insertState = sortConfig.insertState;
				var startIdx = sortConfig.startIdx;
				var endIdx = sortConfig.endIdx;

				if ((insertState === 'unshiftItem' && startIdx === 0)
					|| (insertState === 'pushItem' && startIdx === self.obDestinationsArray().length - 1)
					|| (startIdx === endIdx))
				{
					return;
				}

				if (insertState === "default")
				{
					var endItemSeq = self.obDestinationsArray()[endIdx].seq();
				}

				var startDestItem = self.obDestinationsArray.splice(startIdx, 1)[0];
				var insertItem = new TF.DataModel.DirectionDestinationDataModel(startDestItem.toData());
				if (startDestItem.throughPoints().length === 0)
					insertItem.throughPoints([]);

				switch (insertState)
				{
					case 'pushItem':
						self.obDestinationsArray.push(insertItem);
						break;
					case 'unshiftItem':
						self.obDestinationsArray.splice(0, 0, insertItem);
						break;
					default:
						var insertIdx = findDestinationIdx(endItemSeq, self.obDestinationsArray());
						self.obDestinationsArray.splice(insertIdx, 0, insertItem);
						break;
				}

				self.reloadDestinationPanel();
				self.notifyDataChange();
			},
			drag: function(e, obj)
			{
				self.dragScroll(obj.helper, self.element.find('.directions-stops'), true);

				var sortConfig = self.getSortConfig();
				var insertState = sortConfig.insertState;
				// var startIdx = sortConfig.startIdx;
				var endIdx = sortConfig.endIdx;

				var $doms = self.element.find('.directions-items').find('.directions-item:not(".clone") .directions-destination-item');
				$doms.map(function(idx, dom)
				{
					$(dom).removeClass('active');
				});

				var $doms2 = self.element.find('.directions-item-footer');
				$doms2.removeClass('active');

				switch (insertState)
				{
					case 'pushItem':
						$doms2.addClass('active');
						break;
					case 'unshiftItem':
						$($doms[0]).addClass('active');
						break;
					default:
						$($doms[endIdx]).addClass('active');
						break;
				}
			},
		});
	};

	DirectionPaletteViewModel.prototype.formatThrougPointDisplayString = function(address)
	{
		if (!address) { return ''; }

		return 'Through ' + address.split(',')[0];
	};

	DirectionPaletteViewModel.prototype.getSortConfig = function()
	{
		var self = this;

		// get insert index
		var cursorTop = self.element.find(".directions-item.clone").offset().top;
		var itemWrapperTop = self.element.find(".directions-items").offset().top;
		// var itemWrapperBottom = itemWrapperTop + self.element.find(".directions-items").height();

		var insertState = 'default';
		var startIdx = findDestinationIdx(self._startDestItem.seq(), self.obDestinationsArray());
		var endIdx = -1;
		if (cursorTop < itemWrapperTop)
		{
			insertState = 'unshiftItem';
		}
		else if ((cursorTop < itemWrapperTop))
		{
			insertState = 'pushItem';
		}
		else
		{
			endIdx = 0;
			self.element.find(".directions-item:not('.clone')").map(function(idx, directionItem)
			{
				var directionMidTop = $(directionItem).offset().top + $(directionItem).height() / 2;
				if (cursorTop > directionMidTop)
				{
					endIdx = idx + 1;
				}
			});

			if (endIdx > self.obDestinationsArray().length - 1)
			{
				endIdx = -1;
				insertState = 'pushItem';
			}
		}

		return {
			insertState: insertState,
			startIdx: startIdx,
			endIdx: endIdx,
		};
	};

	DirectionPaletteViewModel.prototype.clearScrollInterval = function()
	{
		if (this.scrollToTopPanel)
		{
			clearInterval(this.scrollToTopPanel);
		}
		if (this.scrollToBottomPanel)
		{
			clearInterval(this.scrollToBottomPanel);
		}
		if (this.scrollToTop)
		{
			clearInterval(this.scrollToTop);
		}
		if (this.scrollToBottom)
		{
			clearInterval(this.scrollToBottom);
		}
	};

	DirectionPaletteViewModel.prototype.dragScroll = function(dragItem, container, isPanel)
	{
		var itemHeight = dragItem.height(), self = this;
		if (dragItem.offset().top > container.offset().top - itemHeight && dragItem.offset().top < container.offset().top + itemHeight)
		{
			self.clearScrollInterval();
			var scrollTop = setInterval(function()
			{
				container.scrollTop(container.scrollTop() - 5);
			}, 30);

			if (isPanel)
			{
				self.scrollToTopPanel = scrollTop;
			}
			else
			{
				self.scrollToTop = scrollTop;
			}
		}
		else if (dragItem.offset().top + dragItem.height() < container.offset().top + container.height() + itemHeight
			&& dragItem.offset().top + dragItem.height() > container.offset().top + container.height() - itemHeight)
		{
			self.clearScrollInterval();
			var scrollBottom = setInterval(function()
			{
				container.scrollTop(container.scrollTop() + 5);
			}, 30);

			if (isPanel)
			{
				self.scrollToBottomPanel = scrollBottom;
			}
			else
			{
				self.scrollToBottom = scrollBottom;
			}
		}
		else
		{
			if (isPanel)
			{
				if (this.scrollToTopPanel)
				{
					clearInterval(this.scrollToTopPanel);
				}
				if (this.scrollToBottomPanel)
				{
					clearInterval(this.scrollToBottomPanel);
				}
			}
			else
			{
				if (this.scrollToTop)
				{
					clearInterval(this.scrollToTop);
				}
				if (this.scrollToBottom)
				{
					clearInterval(this.scrollToBottom);
				}
			}
		}
	};

	DirectionPaletteViewModel.prototype.printSettinginit = function()
	{
		var self = this;
		self.obPrintSettingMenu = ko.observable(["Overview", "Destination Vicinity", "Turn-By-Turn"]);
		self._printSettingState = {
			"Overview": false,
			"Destination Vicinity": false,
			"Turn-By-Turn": false
		};
		tf.documentEvent.bind("mousedown.closePrintSettingMenu", self.routeState, function(e)
		{
			if ($(e.target).closest(".print-setting-group").length == 0 && self.element)
			{
				self.element.find(".print-setting-group").removeClass("active");
			}
		});
	};

	/**
	 * Initialize for U-Turn policy settings.
	 * @returns {void}
	 */
	DirectionPaletteViewModel.prototype.uTurnSettinginit = function()
	{
		var self = this;
		self.obUturnSettingMenu = ko.observable(["Allowed", "Allowed Only at Dead Ends", "Allowed Only at Intersections and Dead Ends", "Not Allowed"]);
		self._uTurnSettingState = {
			"Allowed": true,  // default
			"Allowed_Only_at_Dead_Ends": false,
			"Allowed_Only_at_Intersections_and_Dead_Ends": false,
			"Not_Allowed": false
		};

		tf.documentEvent.bind("mousedown.closeUturnSettingMenu", this.routeState, function(e)
		{
			if ($(e.target).closest(".uturn-setting-group").length == 0 && self.element)
			{
				self.element.find(".uturn-setting-group").removeClass("active");
			}
		});
	};

	DirectionPaletteViewModel.prototype.setAsThroughPointClick = function(viewModel, e)
	{
		var self = this;
		var flatSeq = findFlatSeq(viewModel.seq(), 0, self.obDestinationsArray());
		var idx = -1;
		idx = findDestinationIdx(viewModel.seq(), self.obDestinationsArray());

		if (idx === -1)
			return;

		var destItem = self.obDestinationsArray.splice(idx, 1)[0];
		var newTpItems = flatDestItem(destItem);
		self.obDestinationsArray()[idx - 1].addThroughPoints(newTpItems);

		self.reloadDestinationPanel();
		self.onSetAsThroughPointClicked.notify(flatSeq);
	};

	DirectionPaletteViewModel.prototype.removeDestinationClick = function(viewModel, e)
	{
		var self = this,
			flatSeq = findFlatSeq(viewModel.seq(), 0, self.obDestinationsArray()),
			destGreatThan2 = self.obDestinationsArray().length > 2,
			roundTripChecked = self.obDestinationRoundTripChecked(),
			idx = -1;
		idx = findDestinationIdx(viewModel.seq(), self.obDestinationsArray());

		if (idx === -1) return;

		var state = 'removeDest';
		if (!destGreatThan2)
		{
			state = roundTripChecked && idx === 0 ? 'setSeondDestAsFirst' : 'clearDest';
		}
		switch (state)
		{
			case 'removeDest':
				self.obDestinationsArray.splice(idx, 1);
				break;
			case 'setSeondDestAsFirst':
				self.obDestinationsArray([
					self.buildEmptyDestination(),
					self.buildEmptyDestination()
				]);
				break;
			case 'clearDest':
				self.obDestinationsArray.splice(idx, 1, self.buildEmptyDestination());
				break;
			default:
				break;
		}

		self.reloadDestinationPanel();
		self.buildDestinationSearches();

		self.onRemovePointClicked.notify(flatSeq);

	};

	function flatDestItem(destItem)
	{
		var newTpItems = [destItem.toData()];

		var tpItems = destItem.throughPoints();
		tpItems.forEach(function(tpItem)
		{
			newTpItems.push(tpItem.toData());
		});

		return newTpItems;
	}

	function resetDestinationSeqs(obItems)
	{
		obItems.forEach(function(destItem, idx)
		{
			var seq = idx + 1;
			destItem.seq(seq);
			var tpItems = destItem.throughPoints();
			tpItems.forEach(function(tpItem, idy)
			{
				tpItem.seq(seq);
				tpItem.throughPointSeq(idy + 1);
			});
		});
	}

	function findDestinationIdx(key, obItems)
	{
		var idy = -1;
		obItems.forEach(function(item, idx)
		{
			if (item.seq() === key)
			{
				idy = idx;
				return false;
			}
		});
		return idy;
	}

	function findThroughPointIdx(key, obItems)
	{
		var idy = -1;
		obItems.forEach(function(item, idx)
		{
			if (item.throughPointSeq() === key)
			{
				idy = idx;
				return false;
			}
		});
		return idy;
	}

	function findFlatSeq(destSeq, throughPointSeq, destItems)
	{
		var flatSeq = -1;
		var tmpSeq = 1;

		destItems.forEach(function(destItem, idx)
		{

			if (destItem.seq() === destSeq && throughPointSeq === 0)
				flatSeq = tmpSeq;

			tmpSeq++;

			destItem.throughPoints().forEach(function(throughPoint, idx)
			{
				if (throughPoint.seq() === destSeq && throughPoint.throughPointSeq() === throughPointSeq)
					flatSeq = tmpSeq;

				tmpSeq++;
			});
		});

		return flatSeq;
	}

	DirectionPaletteViewModel.prototype.setAsDestinationClick = function(viewModel, e)
	{
		var self = this,
			flatSeq = findFlatSeq(viewModel.seq(), viewModel.throughPointSeq(), self.obDestinationsArray()),
			idx = -1;
		idx = findDestinationIdx(viewModel.seq(), self.obDestinationsArray());
		if (idx === -1)
			return;

		var idy = -1;
		idy = findThroughPointIdx(viewModel.throughPointSeq(), self.obDestinationsArray()[idx].throughPoints());
		if (idy === -1)
			return;

		var deleteCount = self.obDestinationsArray()[idx].throughPoints().length - idy,
			tpItems = self.obDestinationsArray()[idx].throughPoints.splice(idy, deleteCount),
			destItem = convertThroughPointToDestination(tpItems[0]);
		self.obDestinationsArray.splice(idx + 1, 0, destItem);

		if (tpItems.length === 1)
		{
			self.reloadDestinationPanel();
			self.onSetAsDestinationClicked.notify(flatSeq);
			return;
		}

		tpItems.splice(0, 1);
		tpItems.forEach(function(tpItem)
		{
			self.obDestinationsArray()[idx + 1].addThroughPoint(tpItem.toData());
		});

		self.reloadDestinationPanel();
		self.onSetAsDestinationClicked.notify(flatSeq);
	};

	function convertThroughPointToDestination(tpItem)
	{
		var destItem = tpItem.toData();
		destItem.ThroughPoints = [];
		destItem.Color = "";
		return new TF.DataModel.DirectionDestinationDataModel(destItem);
	}

	DirectionPaletteViewModel.prototype.removeThroughPointClick = function(viewModel, e)
	{
		var flatSeq = findFlatSeq(viewModel.seq(), viewModel.throughPointSeq(), this.obDestinationsArray());
		var idx = -1;
		idx = findDestinationIdx(viewModel.seq(), this.obDestinationsArray());
		if (idx === -1)
			return;

		var idy = -1;
		idy = findThroughPointIdx(viewModel.throughPointSeq(), this.obDestinationsArray()[idx].throughPoints());
		if (idy === -1)
		{
			// this.reloadDestinationPanel();
			return;
		}

		this.obDestinationsArray()[idx].throughPoints.splice(idy, 1);
		this.reloadDestinationPanel();
		this.onRemovePointClicked.notify(flatSeq);
	};

	DirectionPaletteViewModel.prototype.destinationRoundTripClick = function(viewModel, e)
	{
		if (this.obDestinationsArray().length > 0 && !this.obDestinationRoundTripChecked())
			this.obDestinationsArray()[this.obDestinationsArray().length - 1].throughPoints([]);
	};

	DirectionPaletteViewModel.prototype.buildEmptyDestination = function()
	{
		// var newSeq = this.obDestinationsArray().length + 1;
		return new TF.DataModel.DirectionDestinationDataModel({
			// Seq: newSeq,
			Seq: 0,
			Address: "",
			ThroughPoints: []
		});
	};

	DirectionPaletteViewModel.prototype.addNewDestinationClick = function(viewModel, e)
	{
		this.obHasFilledLastDestOneTime(false);
		this.obDestinationsArray.push(this.buildEmptyDestination());
		this.reloadDestinationPanel();
	};

	DirectionPaletteViewModel.prototype.openDestinationDropModeClick = function(viewModel, e)
	{
		this._viewModal.sketchTool.stop();
		this.onOpenDestinationDropModeClicked.notify();
	};

	DirectionPaletteViewModel.prototype.rerunClick = function(viewModel, e)
	{
		this.onRerunClicked.notify();
	};

	DirectionPaletteViewModel.prototype.zoomToLayersClick = function(viewModel, e)
	{
		this.onZoomToLayersClicked.notify();
	};

	function isEmptyDestinationData(destItems)
	{
		if (destItems.length > 2)
			return false;

		if (
			(destItems[0] && (destItems[0].address() || destItems[0].throughPoints().length > 0)) ||
			(destItems[1] && (destItems[1].address() || destItems[1].throughPoints().length > 0))
		)
			return false;

		return true;
	}

	DirectionPaletteViewModel.prototype.clearAllClick = function(viewModel, e)
	{
		if (isEmptyDestinationData(this.obDestinationsArray()))
			return;

		var self = this;
		tf.promiseBootbox.yesNo(
			'Are you sure you want to clear all the Destinations and Through Points?',
			'Clear All'
		)
			.then(function(result)
			{
				if (!result)
					return;

				self._roundTripCheckBoxComputed.dispose();
				self.resetPanel();
				self.notifyDataChange();
				self._roundTripCheckBoxComputed = ko.pureComputed(function()
				{
					return self.obDestinationRoundTripChecked();
				});
				self._roundTripCheckBoxComputed.subscribe(self.onRoundTripCheckBoxClicked.bind(self));
			});
	};

	DirectionPaletteViewModel.prototype.resetPanel = function()
	{
		this.resetPanelData();
		this.reloadDestinationPanel();
	};

	DirectionPaletteViewModel.prototype.resetPanelData = function()
	{
		this.obDestinationRoundTripChecked(false);
		this.obHasFilledFirstDestOneTime(false);
		this.obHasFilledLastDestOneTime(false);

		this.obDestinationsArray(this.getInitDestinationData());
		resetDestinationSeqs(this.obDestinationsArray());
	};

	DirectionPaletteViewModel.prototype.reloadDestinationPanel = function()
	{
		var self = this;

		resetDestinationSeqs(self.obDestinationsArray());
		if ((!self.obHasFilledFirstDestOneTime() || !self.obHasFilledLastDestOneTime()) &&
			self.obDestinationsArray().length >= 2)
		{
			var address = self.obDestinationsArray()[0].address();
			if (!IsEmptyString(address))
				self.obHasFilledFirstDestOneTime(true);

			var address = self.obDestinationsArray()[self.obDestinationsArray().length - 1].address();
			if (!IsEmptyString(address))
				self.obHasFilledLastDestOneTime(true);
		}

		self.setPanelConfigs();

		self.buildDestinationSearches();
		self.makeDestinationDraggable();
	};

	DirectionPaletteViewModel.prototype.printClick = function(viewModel, e)
	{
		var self = this,
			directionTool = self._viewModal._directionsTool,
			data = this.obDirectionDetails().map(function(item) { return item.toData(); }),
			points = this.obDestinationsArray().map(function(item)
			{
				var data = item.toData();
				data["ThroughPoints"] = data["ThroughPoints"].map(function(item) { return item.toData(); });
				return data;
			}).sort(function(a, b) { return a.seq - b.seq; });

		if (!directionTool)
		{
			return;
		}
		var setting = self._printSettingState,
			totalTime = "",
			totalDistance = self.obTotalDistanceMileDisplay() > 0
				? self.obTotalDistanceMileDisplay() + " " + tf.measurementUnitConverter.getShortUnits()
				: self.obTotalDistanceFeetDisplay() + " " + tf.measurementUnitConverter.getRulerUnits();

		if (self.obTotalTimeHourDisplay() > 0)
		{
			totalTime = self.obTotalTimeHourDisplay() + (self.obTotalTimeHourDisplay() > 1 ? " hrs " : " hr ");
		}
		if (self.obTotalTimeMinuteDisplay() > 0)
		{
			totalTime += self.obTotalTimeMinuteDisplay() + (self.obTotalTimeMinuteDisplay() > 1 ? " mins" : " min");
		}
		if (self.obTotalTimeMinuteDisplay() == 0 && self.obTotalTimeHourDisplay() == 0)
		{
			totalTime = self.obTotalTimeSecondDisplay() + (self.obTotalTimeSecondDisplay() > 1 ? " secs" : " sec");
		}
		totalTime = totalTime.trim(' ');

		if (data && data.length > 0)
		{
			TF.Map.Directions.Print.print({
				directions: data,
				totalTime: totalTime,
				totalDistance: totalDistance
			}, {
				MapDefaultBasemap: self._viewModal._mapView.map.basemap,
				arcgis: tf.map.ArcGIS,
				map: self._viewModal._map,
				showBaseMap: setting ? setting["Overview"] : false,
				showStopMap: setting ? setting["Destination Vicinity"] : false,
				showTurnByTurnMap: setting ? setting["Turn-By-Turn"] : false,
				graphicLayers: [directionTool._tripLayer, directionTool._stopLayer, directionTool._stopSequenceLayer],
				StopPoints: points ? points.map(function(item)
				{
					item.Geometry = new tf.map.ArcGIS.Point(item.XCoord, item.YCoord, directionTool._webMercator);
					item.ThroughPoints = item.ThroughPoints.map(function(item)
					{
						item.Geometry = new tf.map.ArcGIS.Point(item.XCoord, item.YCoord, directionTool._webMercator);
						return item;
					});
					return item;
				}) : []
			});
		}
	};

	DirectionPaletteViewModel.prototype.dropDownMenuClick = function(viewModel, e)
	{
		e.stopPropagation();
	};

	DirectionPaletteViewModel.prototype.selectPringSettingItemClick = function(viewModel, e)
	{
		var $target = $(e.currentTarget),
			isActive = $target.hasClass("select");
		this._printSettingState[viewModel] = !isActive;
		$target.toggleClass("select", !isActive);
	};

	DirectionPaletteViewModel.prototype.selectUturnSettingItemClick = function(viewModel, e)
	{
		var $target = $(e.currentTarget),
			sibling = $target.siblings(),
			isActive = $target.hasClass("select");
		viewModel = viewModel.replace(/\W/g, '_');
		if (isActive) return;
		// option button
		for (var key in this._uTurnSettingState)
		{
			if (key !== viewModel)
			{
				this._uTurnSettingState[key] = false;
			}
		}
		this._uTurnSettingState[viewModel] = !isActive;

		for (var i = sibling.length; i >= 0; --i)
		{
			$(sibling[i]).toggleClass("select", false);
		}
		$target.toggleClass("select", !isActive);

		this.onUTurnPolicyChanged.notify(this._uTurnSettingState);
	};

	/**
	 * Update stop details according to when notified.
	 * @param {event} e The event.
	 * @param {array} results The stops.
	 * @returns {void}
	 */
	DirectionPaletteViewModel.prototype.updateStopDetails = function(e, results)
	{
		if (!results) return;

		var self = this,
			StopTypeEnum = self.StopTypeEnum,
			attributes, geometry, destinationItem, $throughPointText,
			destinationList = [],
			startSeq = 0;
		self._originalStopDetails = results;
		$.each(results, function(index, item)
		{
			attributes = item.attributes;
			geometry = item.geometry;
			var curbApproach = attributes.CurbApproach;

			if (attributes.StopType === StopTypeEnum.GHOST_STOP)
			{
				return;
			}

			if (attributes.StopType !== StopTypeEnum.WAY_STOP)
			{
				destinationItem = new TF.DataModel.DirectionDestinationDataModel({
					Seq: ++startSeq,
					Address: attributes.Name,
					XCoord: geometry.x,
					YCoord: geometry.y,
					ThroughPoints: [],
					CurbApproach: curbApproach
				});

				destinationList.push(destinationItem);
			}
			else
			{
				// Add the through point to the last destination
				destinationItem.addThroughPoint({
					ThroughPointSeq: (destinationItem.throughPoints().length + 1),
					Address: attributes.Name,
					XCoord: geometry.x,
					YCoord: geometry.y,
					curbApproach: curbApproach
				});
			}
		});

		destinationList = self.padEmptyDestination(destinationList);
		self.obDestinationsArray(destinationList);
		self.reloadDestinationPanel();

		$throughPointText = self.element.find(".through-point-address");
		self.processDirectionTextForDisplay($throughPointText);
	};

	/**
	 * Update direction details when the result is acquired.
	 * @param {event} e The event.
	 * @param {array} result The Directions result from routing.
	 * @returns {void}
	 */
	DirectionPaletteViewModel.prototype.updateDirectionDetails = function(e, result)
	{
		var self = this;

		if (!result)
		{
			self.toggleDirectionsWarning(true, "Cannot find a route.");
			return;
		}
		self.toggleDirectionsWarning(false);

		var dIndex, text, maneuverType,
			sIndex = 0, destinationOrder = 0, resultList = [],
			StopTypeEnum = self.StopTypeEnum,
			stopList = self._originalStopDetails.filter(function(stop)
			{
				var stopType = stop.attributes.StopType;
				return stopType !== StopTypeEnum.WAY_STOP &&
					stopType !== StopTypeEnum.GHOST_STOP;
			}),
			directions = result.directions,
			directionFeatures = result.directions.features,
			directionFeaturesCount = directionFeatures.length;

		// Add a duplicated stop as it is a round trip
		if (self.obDestinationRoundTripChecked())
		{
			stopList.push(stopList[0]);
		}

		for (dIndex = 0; dIndex < directionFeaturesCount; dIndex++)
		{
			var sequence = null,
				index = dIndex,
				dItem = directionFeatures[dIndex],
				dAttrs = dItem.attributes,
				text = dAttrs.text,
				maneuverType = dAttrs.maneuverType,
				stopAttrs = null;

			// These two types indicate the direction is a stop
			if (dAttrs.maneuverType === "esriDMTStop" || dAttrs.maneuverType === "esriDMTDepart")
			{
				// Keep only one for stop, if dIndex is used after in the future, this should be modified.
				if (dIndex) { dIndex++; }
				if (stopList[sIndex])
				{
					stopAttrs = stopList[sIndex].attributes;
				}

				// "WAY_STOP" indicates this is a through point, otherwise it is a destination which displays only a short street name.
				if (stopAttrs && stopAttrs.StopType === StopTypeEnum.WAY_STOP)
				{
					text = "Through " + stopAttrs.Name.split(",")[0];
					maneuverType = "throughPoint";
				}
				else if (stopAttrs && stopAttrs.StopType === StopTypeEnum.GHOST_STOP)
				{
					sIndex++;
					continue;
				}
				else
				{
					sequence = (++destinationOrder);
				}

				if (self.obDestinationRoundTripChecked())
				{
					if (dIndex === 0 || dIndex === directionFeaturesCount)
					{
						maneuverType = "directions-roundtrip-detail";
					}
				}
				sIndex++;
			}

			if (dAttrs.maneuverType === "railroadStop")
			{
				resultList.push(new TF.DataModel.DirectionDetailDataModel({
					Instruction: "WARNING CROSS OVER RAILROAD",
					Text: "WARNING CROSS OVER RAILROAD",
					Sequence: sequence,
					Type: maneuverType,
					Distance: "",
					Time: "",
					Geometry: dItem.geometry,
					Index: index++
				}));
			}
			else
			{
				resultList.push(new TF.DataModel.DirectionDetailDataModel({
					Instruction: text,
					Text: text,
					Sequence: sequence,
					Type: maneuverType,
					Distance: self.formatDistanceString(dAttrs.length),
					Time: self.formatTimeString(dAttrs.time),
					Geometry: dItem.geometry,
					Index: index++
				}));
			}
		}

		// Update summary information.
		self.obTotalTime(Number(directions.totalTime));
		self.obTotalDistance(Number(directions.totalLength));
		self.obDirectionDetails(resultList);
	};

	/**
	 * It formats the inputed text element, so they will display only specified lines and end with ellipse if the content is truncated.
	 * @param {jQuery} $textList The list of text elements that need to be formatted. 
	 * @param {number} displayLineNumber The number of lines to be displayed.
	 * @returns {void} 
	 */
	DirectionPaletteViewModel.prototype.processDirectionTextForDisplay = function($textList, displayLineNumber)
	{
		var $el, maxHeight,
			defaultMaxLineNumber = 2,
			displayLineNumber = displayLineNumber || defaultMaxLineNumber;

		$.each($textList, function(textIndex, item)
		{
			$el = $(item),
				$el.text($el.attr("title"));

			if (!maxHeight) { maxHeight = parseInt($el.css("line-height")) * displayLineNumber; }

			while ($el.outerHeight() > maxHeight)
			{
				$el.text(function(index, text)
				{
					return text.replace(/\W*\s(\S)*$/, '...');
				});
			}
		});
	};

	/**
	 * Toggle the warning section of Directions as well as other settings.
	 * @param {bool} visibility Whether the element is going to be visible.
	 * @param {string} message The message to be shown.
	 * @returns {void}
	 */
	DirectionPaletteViewModel.prototype.toggleDirectionsWarning = function(visibility, message)
	{
		var self = this,
			$warning = this.element.find(".directions-details .warning");

		if (visibility)
		{
			$warning.show();
			$warning.text(message);
			self.obTotalTime(0);
			self.obTotalDistance(0);
			self.obDirectionDetails([]);
		} else
		{
			$warning.hide();
		}
	};

	/**
	 * Format the input distance value for displaying.
	 * @param {float} value The distance value in mile.
	 * @returns {string} The formatted distance string.
	 */
	DirectionPaletteViewModel.prototype.formatDistanceString = function(value)
	{
		var self = this;
		// One mile equals to 5280 feet
		var ftInMile = tf.measurementUnitConverter.getRatio();
		value = self.unitConvert(value);

		if (value < 0.1)
		{
			return Math.floor(value * ftInMile) + " " + tf.measurementUnitConverter.getRulerUnits() + ".";
		}
		else
		{
			value = value.toFixed(1);

			if (value < 1)
			{
				value = value.replace("0", "");
			}

			return value + " " + tf.measurementUnitConverter.getShortUnits();
		}
	};

	/**
	 * Format the input time value for displaying.
	 * @param {float} value The time value in millisecond.
	 * @returns {string} The formatted time string.
	 */
	DirectionPaletteViewModel.prototype.formatTimeString = function(value)
	{
		var second = Math.floor(value * 60 % 60),
			minute = Math.floor(value),
			minStr = minute + (minute > 1 ? " mins " : " min "),
			secStr = second + " sec ";
		if (second == 0 && minute == 0)
		{
			return "0 sec";
		}
		return (minute > 0 ? minStr : "") + (second > 0 ? secStr : "");
	};

	DirectionPaletteViewModel.prototype.getInitDestinationData = function()
	{
		// var ret = [];
		// var item1 = new TF.DataModel.DirectionDestinationDataModel({
		// 	Seq: 1,
		// 	Address: "st 1",
		// 	ThroughPoints: []
		// });
		// item1.addThroughPoints([{
		// 	// Seq: 1,
		// 	ThroughPointSeq: 1,
		// 	Address: "st 1.1"
		// }, {
		// 	// Seq: 1,
		// 	ThroughPointSeq: 2,
		// 	Address: "st 1.2"
		// }]);
		// ret.push(item1);

		// var item2 = new TF.DataModel.DirectionDestinationDataModel({
		// 	Seq: 2,
		// 	Address: "st 2",
		// 	ThroughPoints: []
		// });
		// item2.addThroughPoints([{
		// 	// Seq: 2,
		// 	ThroughPointSeq: 1,
		// 	Address: "st 2.1"
		// }, {
		// 	// Seq: 2,
		// 	ThroughPointSeq: 2,
		// 	Address: "st 2.2"
		// }]);
		// ret.push(item2);

		// var item3 = new TF.DataModel.DirectionDestinationDataModel({
		// 	Seq: 3,
		// 	Address: "st 3",
		// 	ThroughPoints: []
		// });
		// ret.push(item3);

		// return ret;
		return [this.buildEmptyDestination(), this.buildEmptyDestination()];
	};

	/**
	 * Expand or collapse the directions-stops element.
	 * @param {object} viewModel The viewmodel that is binding to page.
	 * @param {event} e The mouse click event.
	 * @returns {void} 
	 */
	DirectionPaletteViewModel.prototype.togglsStopsDisplay = function(viewModel, e)
	{
		var $el = $(e.target).closest(".directions-stops");

		$el.toggleClass("minDisplay");

		this.setPanelConfigs();
	};

	/**
	 * Notify the RoutingMapDocumentViewModel that several settings have been changed.
	 * @param {bool} skipReload Whether the route should be calculated and panel should be update.
	 * @returns {void} 
	 */
	DirectionPaletteViewModel.prototype.notifyDataChange = function(skipReload, reloadTrip)
	{
		var self = this;
		self.onDataChanged.notify({
			data: self.obDestinationsArray(),
			tomTomNAChecked: self.obTomTomNAChecked(),
			roundTripChecked: self.obDestinationRoundTripChecked(),
			detailsRequired: self.obDestinationDetailsChecked(),
			changeRouteChecked: self.obChangeRouteChecked(),
			mapDetailsChecked: self.obMapDetailsChecked(),
			showArrowsChecked: self.obShowArrowsChecked(),
			skipReload: skipReload,
			reloadTrip: reloadTrip
		});
	};

	DirectionPaletteViewModel.prototype.directionDetailsMouseEnter = function(viewModel, e)
	{
		var self = this, element = e;
		self.onDetailsMouseEntered.notify(viewModel);
		$(element.currentTarget).css("cursor", "pointer");
		$(element.currentTarget).css("background-color", "lightblue");
	};

	DirectionPaletteViewModel.prototype.directionDetailsMouseLeave = function(viewModel, e)
	{
		var self = this, element = e;
		self.onDetailsMouseLeaved.notify();
		$(element.currentTarget).css("cursor", "default");
		$(element.currentTarget).css("background-color", "transparent");
	};

	DirectionPaletteViewModel.prototype.destroySearches = function()
	{
		if (this.searches && this.searches.length > 0)
		{
			this.searches.forEach(function(search)
			{
				if (search) search.destroy();
			});
			this.searches = [];
		}
	};

	DirectionPaletteViewModel.prototype.selectedTravelScenarioChanged = function(e, travelScenario)
	{
		if (tf.authManager.authorizationInfo.isAdmin)
		{
			return;
		}
		var self = this;
		self.travelScenario = travelScenario;
	};

	var SCENARIO_STORAGE_KEY = "direction-travelScenarios-last-select-value";

	DirectionPaletteViewModel.prototype.initTravelScenarios = function()
	{
		var self = this;

		if (!tf.authManager.authorizationInfo.isAdmin)
		{
			return;
		}

		if (!self.inited)
		{
			this._travelScenariosChange = function(e, updateRecords)
			{
				if (self.obShow() &&
					(
						!updateRecords || updateRecords.UpdatedRecords.filter(function(c) { return c.Type == "TravelScenario"; }).length > 0
					))
				{
					self.loadTravelScenarios();
				}
			};
			self._viewModal.menuDataUpdateEvent.subscribe(this._travelScenariosChange);
			// subscribe travel scenario change event
			PubSub.subscribe("ScenarioApproveStatusChange", this._travelScenariosChange);
			PubSub.subscribe("StreetApproveStatusChange", this._travelScenariosChange);
			self.inited = true;
		}

		self.loadTravelScenarios();
	};

	DirectionPaletteViewModel.prototype.loadTravelScenarios = function()
	{
		let self = this,
			travelScenarioPromise = tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase("v2"), "travelscenarios"));
		travelScenarioPromise.then(function(results)
		{
			if (results.Items.length == 0)
			{
				return;
			}
			const scenarios = Enumerable.From(results.Items).OrderBy(x => x.Name.trim().toUpperCase()).ToArray();
			var checkExist = false;
			var allScenarios = [];
			scenarios.forEach(function(scenario)
			{
				if (scenario.Approve >= 0)
				{
					var pendingScenario = $.extend({}, scenario);
					pendingScenario.title = scenario.Name;
					pendingScenario.isFile = 1;
					pendingScenario.check = ko.observable(isCheck(pendingScenario));
					allScenarios.push(pendingScenario);
					if (pendingScenario.check())
					{
						checkExist = true;
					}
				}
			});
			if (!checkExist)
			{
				allScenarios[0].check(true);
			}
			self.travelScenarios(allScenarios);
			self.selectSelectTravelScenarioClick(allScenarios.filter(function(scenario) { return scenario.check(); })[0]);
		});

		function isCheck(scenario)
		{
			var selected = tf.storageManager.get(SCENARIO_STORAGE_KEY) + "";
			return selected && scenario.Id == selected.split("_")[0] && scenario.isFile == selected.split("_")[1];
		}
	};

	DirectionPaletteViewModel.prototype.selectSelectTravelScenarioClick = function(scenario)
	{
		var self = this;
		// if (self.travelScenario)
		// {
		// 	TF.RoutingMap.TravelScenariosPalette.TravelScenariosDataModel.unUseTravelScenario(self.travelScenario.Id, this.routeState);
		// }
		tf.storageManager.save(SCENARIO_STORAGE_KEY, scenario.Id + "_" + (scenario.isFile ? 1 : 0));
		self.travelScenario = scenario;
		self.obTitle("Directions - " + self.travelScenario.title);
		self.travelScenarios().forEach(function(scenario)
		{
			scenario.check(false);
		});
		scenario.check(true);
		// TF.RoutingMap.TravelScenariosPalette.TravelScenariosDataModel.useTravelScenario(scenario.Id, this.routeState);
	};

	DirectionPaletteViewModel.prototype.unitConvert = function(value)
	{
		return tf.measurementUnitConverter.convert({
			value: value,
			originalUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Metric,
			targetUnit: tf.measurementUnitConverter.getCurrentUnitOfMeasure(),
		});
	}

	DirectionPaletteViewModel.prototype.close = function()
	{
		this._viewModal._directionsTool._clearTooltipHide();
		this._viewModal._directionsTool._onEscMode();
		this.resetPanel();
		this._viewModal._directionsTool.clear();
		// if (this.travelScenario)
		// {
		// 	TF.RoutingMap.TravelScenariosPalette.TravelScenariosDataModel.unUseTravelScenario(this.travelScenario.Id, this.routeState);
		// 	this.travelScenario = null;
		// }
	};

	DirectionPaletteViewModel.prototype.dispose = function()
	{
		this.destroySearches();
		this._viewModal.menuDataUpdateEvent.unsubscribe(this._travelScenariosChange);
		PubSub.unsubscribe(this._travelScenariosChange);
		// if (this.travelScenario)
		// {
		// 	TF.RoutingMap.TravelScenariosPalette.TravelScenariosDataModel.unUseTravelScenario(this.travelScenario.Id, this.routeState);
		// 	this.travelScenario = null;
		// }
	};
})();