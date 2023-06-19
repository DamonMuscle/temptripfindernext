(function()
{
	createNamespace("TF.Grid").GridMapPopup = GridMapPopup;

	function GridMapPopup(viewModel, options)
	{
		this.viewModel = viewModel;
		this.dataModels = [];
		this.pageIndex = 0;
		this.selectedTabIndex = 0;
		this.options = $.extend({
			isDetailView: false,
			gridType: "",
			dbId: "",
			canShowDetailView: true,
			enableHyperlink: true,
			enableEdit: true,
			viewDetailEvent: function() { }
		}, options);
		this.map = options.map;
		this.subContentMinHeight = 68;
	}

	GridMapPopup.prototype.enableMouseEvent = function(map, layers)
	{
		var self = this;
		self.map = map;

		if (self.pointerMoveEvent)
		{
			// avoid multiple bind event
			return;
		}
		layers = layers || this.layers;
		if (!layers)
		{
			return;
		}

		this.layers = layers;
		self.pointerMoveEvent = map.mapView.on("pointer-move", function(event)
		{
			if (map.mapView.pining)
			{
				return;
			}
			self._getGraphicByEvent(map, event, layers()).then(function(graphics)
			{
				var cursor = graphics ? "pointer" : "default";
				TF.Helper.MapHelper.setMapCursor(map, cursor);
			});
		});

		// popup
		self.mapClickEvent = map.mapView.on("click", function(event)
		{
			if (self.viewModel.RoutingMapTool && self.viewModel.RoutingMapTool.measurementTool && self.viewModel.RoutingMapTool.measurementTool.isActive)
			{
				return;
			}

			if (self.viewModel.RoutingMapTool && self.viewModel.RoutingMapTool.googleStreetTool && self.viewModel.RoutingMapTool.googleStreetTool.isActive)
			{
				return;
			}

			if (map.mapView.pining)
			{
				return;
			}
			if (event.button != 0 || self.isLoading)
			{
				closePopup();
				return;
			}
			self.isLoading = true;
			self._getGraphicByEvent(map, event, layers()).then(function(graphics)
			{
				if (!graphics || graphics.length == 0)
				{
					closePopup();
					return;
				}

				// Viewfinder cluster layer 
				if (TF.Helper.MapHelper.isClustered(self.options.gridType) && (graphics[0].attributes.isCluster || graphics[0].attributes.isClusterText))
				{
					let extent;
					// if the graphic is label graphic, need get the point cluster graphic from layer by cluster id
					if (graphics[0].attributes.isClusterText)
					{
						let extentGraphic = graphics[0].layer.graphics.items.filter(item => item.attributes.clusterId === graphics[0].attributes.clusterId && item.attributes.isCluster)[0];
						if (extentGraphic)
						{
							extent = extentGraphic.attributes.clusterObject.extent;
						}
					}
					else
					{
						extent = graphics[0].attributes.clusterObject.extent;
					}
					map.mapView.goTo(new tf.map.ArcGIS.Extent({
						xmin: extent.xmin,
						ymin: extent.ymin,
						xmax: extent.xmax,
						ymax: extent.ymax,
						spatialReference: 102100
					}));
				}
				else
				{
					return self._findIntersectRecords(map, graphics, layers(), event).then(function(graphics)
					{
						if (graphics && graphics.length > 0)
						{
							const type = (graphics[0].attributes && graphics[0].attributes.type) || self.options.gridType;
							const dbId = (graphics[0].attributes && graphics[0].attributes.dbId) || self.options.dbId;
							return self.show(graphics, event, type, dbId);
						}
					});
				}
			}).catch(function()
			{
				self.isLoading = false;
			}).then(function()
			{
				self.isLoading = false;
			});
		});

		function closePopup()
		{
			map.mapView.popup.close();
			self._clearOutSideCss();
		}
	};

	GridMapPopup.prototype.disableMouseEvent = function()
	{
		var self = this;
		self.pointerMoveEvent && self.pointerMoveEvent.remove();
		self.mapClickEvent && self.mapClickEvent.remove();
		self.pointerMoveEvent = null;
		self.mapClickEvent = null;
	};

	GridMapPopup.prototype._getGraphicByEvent = function(map, event, layers)
	{
		return map.mapView.hitTest(event).then(function(response)
		{
			var graphics = null;
			if (response.results.length)
			{
				var graphicInLayers = response.results.filter(function(result)
				{
					return result.graphic.layer && result.graphic.layer.visible && layers && layers.indexOf(result.graphic.layer) >= 0;
				});
				if (graphicInLayers.length > 0)
				{
					graphics = graphicInLayers.map(function(feature)
					{
						return feature.graphic;
					});
				}
			}
			return graphics;
		});
	};

	GridMapPopup.prototype._findIntersectRecords = function(map, graphics, layers, event)
	{
		var self = this,
			records = [],
			promises = [];
		var target = graphics[0];
		let targetFeature = null;
		layers = [target.layer].concat(layers.filter(function(c) { return c != target.layer; }));
		layers.filter(layer => layer.visible).forEach(function(layer)
		{
			var extent = TF.Helper.MapHelper.getPointExtent(map, event.mapPoint, 3);

			if (layer.graphics)
			{
				layer.graphics.items.forEach(function(graphic)
				{
					if (intersects(target, graphic, extent))
					{
						records.push(graphic);
					}
				});
			}
			else
			{
				let filter = '1=1';
				let layerView = map.mapView.allLayerViews.items.filter(item => item.layer.id.indexOf(layer.id) >= 0);
				if (layerView != null && layerView.length && layerView.length > 0)
				{
					let where = layerView[0].filter && layerView[0].filter.where;
					if (where != null && where.length > 0)
					{
						filter = where;
					}
				}
				var query = new tf.map.ArcGIS.Query();
				query.outFields = ["*"];
				query.where = filter;
				query.geometry = map.mapView.extent;
				query.returnGeometry = true;
				promises.push(layer.queryFeatures(query).then(function(featureSet)
				{
					// target is from hitTest graphic, the geometry is a little different from original, so replace the geometry by features 
					if (target.layer == layer)
					{
						targetFeature = Enumerable.From(featureSet.features).FirstOrDefault(target, function(c) { return c.attributes.oid == target.attributes.oid; });
						target.geometry = targetFeature.geometry;
					}
					featureSet.features.forEach(function(graphic)
					{
						if (intersects(target, graphic, extent))
						{
							records.push(graphic);
						}
					});
				}));
			}
		});

		function intersects(target, graphic, extent)
		{
			if (target.geometry.type == "point")
			{
				return tf.map.ArcGIS.geometryEngine.intersects(target.geometry, graphic.geometry);
			}
			else
			{
				return extent.intersects(graphic.geometry);
			}
		}

		return Promise.all(promises).then(function()
		{
			if (records.length != 0)
			{
				var type = records[0].attributes.type || self.options.gridType;
				var dbId = records[0].attributes.dbId || self.options.dbId;
				if (targetFeature)
				{
					type = targetFeature.attributes.type;
					dbId = targetFeature.attributes.dbId;
				}
				return Enumerable.From(records).Where(function(c)
				{
					return (c.attributes.type == type || !c.attributes.type) && (c.attributes.dbId == dbId || !c.attributes.dbId)
				}).Distinct(function(c)
				{
					return c.attributes.id;
				}).ToArray();
			}
			else
			{
				return null;
			}
		});
	};

	GridMapPopup.prototype.show = function(graphics, event, type, dbId)
	{
		var self = this,
			mapPopup;
		var mapPopupOptions = Object.assign({}, self.options, { splitMapViewModel: self.viewModel.splitMapViewModel, type, dbId });
		switch (type)
		{
			case "student":
				mapPopup = new TF.Grid.StudentMapPopup(mapPopupOptions);
				break;
			case "school":
				mapPopup = new TF.Grid.SchoolMapPopup(mapPopupOptions);
				break;
			case "altsite":
				mapPopup = new TF.Grid.AltSiteMapPopup(mapPopupOptions);
				break;
			case "tripstop":
				mapPopup = new TF.Grid.TripStopMapPopup(mapPopupOptions);
				break;
			case "trip":
				mapPopup = new TF.Grid.TripMapPopup(mapPopupOptions);
				break;
			case "georegion":
				mapPopup = new TF.Grid.GeoRegionMapPopup(mapPopupOptions);
				break;
			case "gpsevent":
				mapPopup = new TF.Grid.GpsEventMapPopup(mapPopupOptions);
				break;
			case "nez":
				mapPopup = new TF.Grid.NezMapPopup(mapPopupOptions);
				break;
			case "form":
				mapPopup = new TF.Grid.FormMapPopup(mapPopupOptions);
				break;
		}
		if (!mapPopup)
		{
			return Promise.resolve(false);
		}

		return self._getDataForPopup(graphics, mapPopup).then(function(dataModels)
		{
			if (TF.isMobileDevice &&
				!self.options.isDetailView)
			{
				self._showInfoWindow(dataModels, event, mapPopup);
			}
			else
			{
				self._showPopup(dataModels, event, mapPopup);
			}
		});
	};

	GridMapPopup.prototype.close = function()
	{
		this.map && this.map.mapView.popup.close();
		this.resizeWatch && this.resizeWatch.remove();
	};

	GridMapPopup.prototype._showPopup = function(dataModels, event, mapPopup)
	{
		var self = this,
			map = self.map;
		this.dataModels = dataModels;
		this.pageIndex = 0;
		this.selectedTabIndex = 0;

		if (dataModels.length == 0)
		{
			return;
		}

		var location = this._getCenter(dataModels, event);
		self._moveMapWhenArrowCoveredByPhoto(location, mapPopup);
		self._clearOutSideCss();
		map.mapView.popup.open({
			content: this._buildContent(dataModels, this.pageIndex, mapPopup),
			location: location
		});
		this._bindEvent(mapPopup);
		self._addDetailViewStyle();
		setTimeout(function()
		{
			self._updateSubContentHeight();
		}, 100);
		setTimeout(function()
		{
			self._movePopupWhenOutSideView();
		}, 50);

		if (!this.resizeWatch && !this.options.isDetailView)
		{
			this.resizeWatch = map.mapView.watch("size", function()
			{
				self._clearOutSideCss();
				self._movePopupWhenOutSideView();
			});
		}
	};

	GridMapPopup.prototype._showInfoWindow = function(dataModels, event, mapPopup)
	{
		var self = this, map = self.map;
		self.dataModels = dataModels;

		if (!dataModels.length) { return; }

		var title = mapPopup.generatePopupContent(dataModels[0]).title;
		var content = self._buildInfoWindowContent(title);

		var location = self._getCenter(dataModels, event);
		self._clearOutSideCss();
		map.mapView.popup.alignment = "bottom-right";
		map.mapView.popup.open({ content: content, location: location });

		self._bindInfoWindowEvent(dataModels, event, mapPopup);
	};

	GridMapPopup.prototype._bindInfoWindowEvent = function(dataModels, event, mapPopup)
	{
		var self = this,
			map = self.map,
			$popupContainer = $(map.mapView.popup.container);
		$popupContainer.undelegate();
		$popupContainer.delegate(
			".popupPage",
			"click",
			function()
			{
				self._showMobileGridMapPopup(dataModels, event, mapPopup);
			}
		);

	};

	GridMapPopup.prototype._showMobileGridMapPopup = function(dataModels, event, mapPopup)
	{
		self.mobileGridMapPopupModalViewModel = new TF.Modal.MobileGridMapPopupModalViewModel(dataModels, event, mapPopup);
		tf.modalManager.showModal(self.mobileGridMapPopupModalViewModel);
	};

	GridMapPopup.prototype._addDetailViewStyle = function()
	{
		if (this.options.isDetailView)
		{
			$(this.map.mapView.popup.container).addClass("detail-view-popup");
		}
	};

	/**
	* get data to show on popup
	* @param {Array} records [{id:0,geometry:{}}].
	* @returns {Array} dataModels 
	*/
	GridMapPopup.prototype._getDataForPopup = function(graphics, mapPopup)
	{
		var promises = [];
		graphics.forEach(function(graphic)
		{
			var id = graphic.id || graphic.attributes.id;
			var getPromise = mapPopup.getDataByIdForPopup(id, graphic);
			promises.push(getPromise);
		});
		return Promise.all(promises).then(function(response)
		{
			var result = [];
			response.forEach(function(item, index)
			{
				var record = item.Items[0];
				if (record)
				{
					record.geometry = graphics[index].geometry;
					result.push(record);
				}
			});
			return result;
		});
	};

	GridMapPopup.prototype._getCenter = function(dataModels, event)
	{
		var location;
		switch (dataModels[0].geometry.type)
		{
			case "point":
				location = dataModels[0].geometry;
				break;
			case "polygon":
				if (event)
				{
					location = event.mapPoint;
				}
				else if (dataModels.length == 1)
				{
					if (dataModels[0].Xcoord && dataModels[0].Ycoord)
					{
						location = TF.xyToGeometry(dataModels[0].Xcoord, dataModels[0].Ycoord);
					}
					else
					{
						location = dataModels[0].geometry.centroid;
					}
				}
				break;
			case "polyline":
				if (event)
				{
					location = event.mapPoint;
				}
				else
				{
					// this is used for double click grid row 
					var polylinePoints = dataModels[0].geometry.paths[0];
					var helper = TF.RoutingMap.MapEditingPalette.MyStreetsHelper;
					var ans = helper.calculateMiddlePos(polylinePoints, this.map);
					location = new tf.map.ArcGIS.Point({
						x: ans.middlePos.x,
						y: ans.middlePos.y,
						spatialReference: this.map.mapView.spatialReference
					});
				}
				break;
		}
		return location;
	};

	GridMapPopup.prototype._buildContent = function(dataModels, index, mapPopup)
	{
		var self = this,
			pagerString = "",
			photoString = "",
			subTitleString = "",
			contentString = "",
			entityCount = dataModels.length,
			dataModel = dataModels[index],
			content = mapPopup.generatePopupContent(dataModel),
			contentExtend = "",
			coverFloat = "";
		if (entityCount > 1)
		{
			pagerString = "<div class='head-pager'>\
											<div class='page-group'>\
												<div class='page-indicator none-select'>" + (index + 1) + " of " + entityCount + "</div>\
												<div entityIndex='"+ index + "' class='left-caret page-previous " + (index == 0 ? "useable" : "") + "'></div>\
												<div entityIndex='"+ index + "' class='right-caret page-next " + (index == entityCount - 1 ? "useable" : "") + "'></div>\
											</div>\
										</div>";
		}
		if (content.photo)
		{
			photoString = '<div class="photo back"></div>' +
				'	<div class="cover"></div>' +
				'	<div class="photo none-select no-image">' + content.photo + '</div>' + (entityCount == 1 ? '<div class="head-pager"></div>' : "");
		}

		if (content.contentExtend)
		{
			var tabHeaderItems = [];
			var tabSubContentItems = [];
			content.contentExtend.forEach(function(item, index)
			{
				var cssClass = "";
				if (index == 0)
				{
					cssClass += " first ";
				}
				else if (index == content.contentExtend.length - 1)
				{
					cssClass += " last ";
				}
				if (index == self.selectedTabIndex)
				{
					cssClass += " select ";
				}
				var role = item.name.toLowerCase().replace(/\s/g, "");
				tabHeaderItems.push('<li data-role="' + role + '" class="' + cssClass + '">' + item.name + '</li>');
				tabSubContentItems.push('<div class="sub-content ' + cssClass + '" data-role="' + role + '" >' + item.content + '</div>');
			});
			var tabHeader = '<div class="tab-header none-select">' +
				'				<ul>' + tabHeaderItems.join("") +
				'				</ul>' +
				'			</div>';
			var tabContent = '<div class="tab-content">' + tabSubContentItems.join("") + '</div>';
			contentExtend = '<div class="content-extend">' + tabHeader + tabContent + '</div>';
		}

		if (content.subTitle)
		{
			subTitleString = '<div class=" detail-right">' + content.subTitle + '</div>';
		}

		if (content.subTitleBelow)
		{
			subTitleString = '<div>' + content.subTitleBelow + '</div>';
			coverFloat = 'cover-float ';
		}

		if (content.contentMain || contentExtend)
		{
			contentString = '<div class="content">' + content.contentMain + contentExtend + '</div>';
			$(this.map.mapView.popup.container).removeClass("no-content");
		}
		else
		{
			$(this.map.mapView.popup.container).addClass("no-content");
		}

		var canShowDetailView = this.options.canShowDetailView;
		if (this.viewModel.parentDocument)
		{
			canShowDetailView = this.viewModel.parentDocument.gridViewModel.obCanShowDetailView();
		}

		if (this.viewModel.viewie && this.viewModel.viewie.type === "gpsevent")
		{
			canShowDetailView = false;
		}

		if (mapPopup.disableTitleLink)
		{
			canShowDetailView = false;
		}

		var title = '<div class="detail-left ' + coverFloat + (mapPopup.isOneLineTitle ? 'line-clamp-1 ' : '') + (canShowDetailView ? '' : 'disable ') + ' ellipsis" title="' + content.title + '">' + content.title + '</div>';
		let mapPopupType = mapPopup.options ? mapPopup.options.type : mapPopup.type
		if (this.options.enableHyperlink &&
			this.options.gridType != mapPopupType &&
			content.link != false &&
			dataModel.Id)
		{
			title = "<div class='detail-left drill-down-links " + coverFloat + "' data-outname='" + content.title + "' data-outtype='" + this.options.gridType + "' data-type='" + mapPopupType + "' data-entityindex='" + dataModel.Id + "'>" + content.title + "</div>";
		}
		return $('<div class="popupPage">' +
			'	<div class="head">' +
			photoString +
			pagerString +
			'		<div class="head-details clearfix">' +
			title + subTitleString +
			'		</div>' +
			'	</div>' + contentString +
			'</div>')[0];
	};

	GridMapPopup.prototype._buildInfoWindowContent = function(title)
	{
		return $('<div class="popupPage">' +
			'	<div class="head">' +
			'		<div class="title">' +
			title +
			'		</div>' +
			'		<div class="plus-button">+</div>' +
			'	</div>' +
			'</div>')[0];
	};

	GridMapPopup.prototype._updateSubContentHeight = function()
	{
		if (this.options.isDetailView || this.options.gridType == "gpsevent")
		{
			return;
		}

		var self = this,
			map = self.map,
			$popupContainer = $(map.mapView.popup.container),
			$subContents = $popupContainer.find(".sub-content"),
			maxHeight = 0;
		if ($subContents.length == 0)
		{
			return;
		}
		var popupContainerClientRect = $popupContainer[0].getBoundingClientRect(),
			subContentClientRect = $subContents[0].getBoundingClientRect(),
			bodyHeight = $("body").height(),
			subContentMaxHeight;

		if ($popupContainer.attr("class").indexOf("-top-") >= 0)
		{
			// the content can not higher than body top 
			subContentMaxHeight = popupContainerClientRect.bottom - 250;
		}
		else 
		{
			// the content can not lower than body bottom 
			subContentMaxHeight = bodyHeight - subContentClientRect.top - 50;
		}

		// can not higher than max height of content
		// if the max height less than min height means the popup content outsite the window, so the max height is 285,
		subContentMaxHeight = subContentMaxHeight > self.subContentMinHeight ? Math.min(subContentMaxHeight, 285) : 285;

		$subContents.each(function(index, item)
		{
			var height = 0;
			var $subContent = $(item);
			var hasSelected = $subContent.hasClass("select");
			$subContent.addClass("select").css({ "height": "auto" });
			height = $subContent.outerHeight();
			if (!hasSelected)
			{
				$subContent.removeClass("select");
			}
			if (height > subContentMaxHeight)
			{
				$subContent.addClass("auto-width main-part");
			}
			else
			{
				$subContent.removeClass("auto-width main-part");
			}
			height = Math.min(Math.max(height, self.subContentMinHeight), subContentMaxHeight);
			if (height > maxHeight)
			{
				maxHeight = height;
			}
		});
		$subContents.height(maxHeight > subContentMaxHeight ? subContentMaxHeight : maxHeight);
	};

	GridMapPopup.prototype._bindEvent = function(mapPopup)
	{
		var self = this,
			map = self.map,
			$popupContainer = $(map.mapView.popup.container);
		$popupContainer.undelegate();
		this._bindTabEvent($popupContainer);
		$popupContainer.delegate(".drill-down-links", "click", self._openCalloutLink.bind(self));
		$popupContainer.delegate(".page-previous", "click", self._changePageClick.bind(self, $popupContainer, false, mapPopup));
		$popupContainer.delegate(".page-next", "click", self._changePageClick.bind(self, $popupContainer, true, mapPopup));
		this._bindNoteEvent($popupContainer, mapPopup.options ? mapPopup.options.type : mapPopup.type);
		this._bindViewDetailEvent($popupContainer);
	};

	/**
	 * The method of after click in call out content
	 * @param {event} evt - The click event.
	 */
	GridMapPopup.prototype._openCalloutLink = function(evt)
	{
		const self = this;
		if (this.options.openCalloutLink)
		{
			this.options.openCalloutLink(evt);
			return;
		}
		var callOutFilterName,
			$target = $(evt.currentTarget),
			linkType = $target.data("type"),
			ids = $target.data("entityindex"),
			callOutRecordName = $target.data("outname"),
			callOutRecordType = $target.data('outtype');

		ids = (!ids) ? [] : (typeof (ids) == 'number' ? [ids] : ids.split(',').map(function(obj)
		{
			return parseInt(obj);
		}));

		if (linkType == 'driver' || linkType == 'busAide')
		{
			linkType = 'staff';
		}
		callOutFilterName = (ids.length > 1 ? 'Records' : 'Record') + ' associated with ' + callOutRecordType + ' (' + callOutRecordName + ')';
		Promise.all([
			tf.storageManager.save("grid.currentfilter." + linkType + ".id", 0),
			tf.storageManager.save("grid.currentlayout." + linkType + ".id", ''),
			tf.storageManager.save(tf.storageManager.gridCurrentQuickFilter(linkType),
				new TF.SearchParameters(null, null, null, null, null, ids, null, callOutFilterName))
		]).then(function()
		{
			var documentData = new TF.Document.DocumentData(TF.Document.DocumentData.Grid,
				{
					gridType: linkType,
					IsCallout: true,
					filterName: callOutFilterName,
					gridState: {
						gridFilterId: null,
						filteredIds: ids
					}
				});
			documentData.data.tabName = callOutFilterName;
			TF.Helper.MapHelper.openNewGrid(evt, documentData);
		});
	};

	GridMapPopup.prototype._bindViewDetailEvent = function($popupContainer)
	{
		var self = this;
		$popupContainer.delegate(".detail-left:not(.disable,.drill-down-links)", "click", function()
		{
			var id = self.dataModels[self.pageIndex].Id;
			self.options.viewDetailEvent(id);
		});
	};

	GridMapPopup.prototype._bindTabEvent = function($popupContainer)
	{
		var self = this;
		$popupContainer.delegate(".tab-header ul li", "click", function(e)
		{
			if ($(e.currentTarget).hasClass("select"))
			{
				return;
			}
			var $target = $(e.currentTarget),
				role = $target.data("role"),
				$content = $target.closest(".content-extend"),
				$fixedTr = $content.find("tr.fixed"),
				$allSubTitlesAndContents = $content.find("[data-role]"),
				$selectedSubTitleAndContent = $content.find("[data-role=" + role + "]");

			$allSubTitlesAndContents.removeClass("select");
			$selectedSubTitleAndContent.addClass("select");
			$content.find(".sub-content").scrollTop(0);
			self.selectedTabIndex = $popupContainer.find(".tab-header ul li").index($target);
			if ($fixedTr.length > 0)
			{
				$fixedTr.width($content.find(".sub-content.select .module.vertical").width());
			}
		});
	};

	// #region Note

	GridMapPopup.prototype._bindNoteEvent = function($popupContainer, featureType)
	{
		var self = this;
		$popupContainer.delegate("button.addNote,button.saveEdit,button.cancelEdit,textarea", "click", function(e)
		{
			var $notesTab = $popupContainer.find(".notes-tab");
			var $target = $(e.currentTarget);
			if (!$notesTab.find(".center-container").hasClass("no-permission"))
			{
				if ($target.hasClass("addNote"))
				{
					addNewNoteClick();
				}
				else if ($target.hasClass("saveEdit"))
				{
					saveEditNoteClick();
				}
				else if ($target.hasClass("cancelEdit"))
				{
					cancelEditNoteClick();
				}
				else if ($target.is("textarea"))
				{
					openNotesEditMode();
				}
			}
		});

		function addNewNoteClick()
		{
			var $notesTab = $popupContainer.find(".notes-tab");
			self.tempEditNote = null;
			self.switchEditNoteStatus($notesTab);
		}

		function saveEditNoteClick()
		{
			var $notesTab = $popupContainer.find(".notes-tab"),
				note = $notesTab.find("textarea").val(),
				entityId = self.dataModels[self.pageIndex].Id;

			self.saveEntityNotes(featureType, entityId, note)
				.then(function()
				{
					self.dataModels[self.pageIndex].Comments = note;
					self.switchEditNoteStatus($notesTab);
				});
		}

		function cancelEditNoteClick()
		{
			var $notesTab = $popupContainer.find(".notes-tab"),
				$textArea = $notesTab.find("textarea");

			$textArea.val(self.tempEditNote);
			self.switchEditNoteStatus($notesTab);
		}

		function openNotesEditMode()
		{
			var $notesTab = $popupContainer.find(".notes-tab"),
				$textArea = $notesTab.find("textarea"),
				isEditing = $notesTab.hasClass("edit-note");

			self.tempEditNote = $textArea.val();
			if (!isEditing)
			{
				self.switchEditNoteStatus($notesTab);
			}
		}
	};

	/**
	 * Save the entity note to the DB.
	 * @param {string} type The entity type. 
	 * @param {number} id The entity id.
	 * @param {string} comment The comment to be saved.
	 * @return {Promise} The save process.
	 */
	GridMapPopup.prototype.saveEntityNotes = function(type, id, comment)
	{
		var field = "Comments";
		if (type == "tripstop")
		{
			field = "Comment";
		}
		return tf.promiseAjax.patch(pathCombine(tf.api.apiPrefix(),
			tf.dataTypeHelper.getEndpoint(type)) + "?id=" + id, {
			data: [
				{ "op": "replace", "path": "/" + field, "value": comment }
			]
		});
	};

	/**
	 * Switch the activeness status of the notes.
	 * @param {JQuery} $notesTab The notes tab jQuery object.
	 * @param {boolean} status The desired status after switch.
	 * @return {void}
	 */
	GridMapPopup.prototype.switchEditNoteStatus = function($notesTab)
	{
		var self = this,
			$textArea = $notesTab.find("textarea"),
			isEditing = $notesTab.hasClass("edit-note"),
			isEmpty = !$textArea.val();

		if (isEditing)
		{
			$textArea.prop("readonly", true);
			$notesTab.removeClass("edit-note");
			$notesTab.toggleClass("empty-note", isEmpty);
			self._updateSubContentHeight();
		}
		else
		{
			$textArea.prop("readonly", false);
			$notesTab.addClass("edit-note");
			self._updateSubContentHeight();
			$textArea.focus();
		}
	};

	// #endregion

	GridMapPopup.prototype._changePageClick = function(popupContainer, isForward, mapPopup)
	{
		if ((this.pageIndex == 0 && !isForward) || (this.pageIndex == this.dataModels.length - 1 && isForward))
		{
			return;
		}
		this.pageIndex = isForward ? this.pageIndex + 1 : this.pageIndex - 1;
		popupContainer.find(".popupPage").parent().html(this._buildContent(this.dataModels, this.pageIndex, mapPopup));
		this._updateSubContentHeight();
	};

	/**
	* transform popup to the center of map if out of current map view
	*/
	GridMapPopup.prototype._movePopupWhenOutSideView = function()
	{
		if (this.options.isDetailView) { return; }
		var mapContainer = $(this.map.mapView.container),
			mapRect = mapContainer[0].getBoundingClientRect(),
			popup = $(this.map.mapView.popup.container),
			popupRect = popup[0].getBoundingClientRect(),
			direction = popup.find(".esri-popup__pointer"),
			transformX = 0;
		popup.css({ "margin-right": 0, "margin-left": 0 });
		if (this.map.mapView.popup.currentAlignment && this.map.mapView.popup.currentAlignment.indexOf("center") < 0)
		{
			var moveDistance = mapRect.left - popupRect.left + 25;
			if (popupRect.left < mapRect.left)
			{
				transformX = moveDistance;
				direction.css({ "right": transformX - 16, "left": "auto" });
				popup.css("margin-right", parseInt(-transformX));
			}
			else if (popupRect.right > mapRect.right)
			{
				transformX = moveDistance;
				direction.css({ "left": -transformX - 16, "right": "auto" });
				popup.css("margin-left", parseInt(transformX));
			}
			transformX = parseInt(transformX);
			if (transformX != 0)
			{
				direction.addClass("transform-direction");
			}
		}
	};

	GridMapPopup.prototype._clearOutSideCss = function()
	{
		var popup = $(this.map.mapView.popup.container),
			direction = popup.find(".esri-popup__pointer");
		direction.removeClass("transform-direction");
		direction.css({ "right": "", "left": "" });
		popup.css({ "margin-right": 0, "margin-left": 0 });
	};

	GridMapPopup.prototype._moveMapWhenArrowCoveredByPhoto = function(location, mapPopup)
	{
		if (this.options.isDetailView || !mapPopup.hasPhoto)
		{
			return;
		}
		var mapContainer = $(this.map.mapView.container),
			mapRect = mapContainer[0].getBoundingClientRect(),
			point = this.map.mapView.toScreen(location),
			leftDistance = 155,
			popupWidth = 592,
			mapCenterPoint = this.map.mapView.toScreen(this.map.mapView.center),
			isOpenAtBottom = point.y < mapRect.height / 2 + 50,
			isOutSideMap = popupWidth + 20 + point.x > mapRect.width;

		if (point.x < leftDistance && isOpenAtBottom && isOutSideMap)
		{
			this.map.mapView.center = this.map.mapView.toMap(mapCenterPoint.x - (leftDistance - point.x), mapCenterPoint.y);
		}
	};

	GridMapPopup.prototype.dispose = function()
	{
		this.disableMouseEvent();
	};
})();