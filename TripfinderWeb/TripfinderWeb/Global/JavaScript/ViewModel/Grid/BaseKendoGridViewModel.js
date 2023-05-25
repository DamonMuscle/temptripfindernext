(function()
{
	createNamespace("TF.Grid").BaseKendoGridViewModel = BaseKendoGridViewModel;

	function BaseKendoGridViewModel(obFocusState, container, gridState, gridShowType, showBulkMenu, loadUserDefined, option, view, dataEntryObjects)
	{
		this.invertSelectionClick = this.invertSelectionClick.bind(this);
		this.omitSelectionClick = this.omitSelectionClick.bind(this);
		this.allSelectionClick = this.allSelectionClick.bind(this);
		this.deleteSelectionClick = this.deleteSelectionClick.bind(this);
		this.exportClick = this.exportClick.bind(this);
		this.editClick = this.editClick.bind(this);
		this.viewClick = this.viewClick.bind(this);
		this.addClick = this.addClick.bind(this);
		this.filterMenuClick = this.filterMenuClick.bind(this);
		this.showhideFilterClick = this.showhideFilterClick.bind(this);
		//only used for not implemented function
		this.showTodoWarningClick = this.showTodoWarningClick.bind(this);
		this.saveAsClick = this.saveAsClick.bind(this);
		this.sendEmailClick = this.sendEmailClick.bind(this);
		this.obReportList = ko.observableArray();
		this.viewReportClick = this.viewReportClick.bind(this);
		this.copyToClipboardClick = this.copyToClipboardClick.bind(this);
		this.obReports = ko.observable(tf.authManager.isAuthorizedFor("reports", "read"));
		this.type = null;
		this.baseDeletion = null;
		this.$container = $(container);
		this._gridState = gridState;
		this._gridShowType = gridShowType;
		this._showBulkMenu = showBulkMenu;
		this.obEmail = ko.observable(false);

		if (loadUserDefined === undefined)
		{
			this._loadUserDefined = true;
		}
		else
		{
			this._loadUserDefined = loadUserDefined;
		}

		this.dataModelType = null;
		this.obCurrentDataModel = ko.observable(null);

		this._obFocusState = obFocusState;
		this.onGridStateChange = new TF.Events.Event();
		this.searchGrid = null;
		this.splitmap = null;
		this.options = {
			openBulkMenu: this._openBulkMenu.bind(this),
			openDetailPopover: this._openDetailPopover.bind(this),
			columns: {},
			routeState: view ? view.document.DocumentData.routeState : option.routeState ? option.routeState : ""
		};
		this.obFilterIconCss = ko.observable("iconbutton eye-hide");
		this.options = $.extend(this.options, option);

		this.documentType = TF.Document.DocumentData.Grid;
		this.obCurrentPage = ko.observable();
		this.obPages = ko.observable([]);
		if (view != undefined)
		{
			this.obCurrentPage(view.orderID);
		}
		if (dataEntryObjects != undefined)
		{
			this.obPages(dataEntryObjects);
		}

		//customized:
		this.obNoRecordSelected = ko.observable(false);

		this.$container.find(".bottompart").on("click", function(e)
		{
			tf.shortCutKeys.changeHashKey(this.options.routeState);
			e.stopPropagation();
			e.preventDefault();
		}.bind(this));


		// Enable/Disable icon
		this.obIsSelectRow = ko.observable(false);

		//using right click event
		this.hasRightClickEvent = true;

		//The property of check if this grid is mini grid.
		this.isBigGrid = true;

		tf.exagoBIHelper.reportListUpdated.subscribe(this.loadReportLists.bind(self));
	}

	BaseKendoGridViewModel.prototype = {
		createGrid: function(option)
		{
			this.initExtraSettings();

			var url = option.url ? option.url : (this.type == "documentmini" ? "search/documents" : "search/" + this.type);

			var defaultOption = {
				storageKey: option.storageKey ? option.storageKey : "grid.currentlayout." + this.type,
				gridType: this.type,
				url: pathCombine(tf.api.apiPrefix(), url),
				obDocumentFocusState: this._obFocusState,
				onGridStateChange: this.onGridStateChange,
				showBulkMenu: this._showBulkMenu,
				showLockedColumn: this._showBulkMenu,
				loadUserDefined: this._loadUserDefined,
				containerHeight: option.height,
				onSelectRowChange: function(e)
				{
					if (e && e.length > 0)
					{
						this.obIsSelectRow(true);
					}
					else
					{
						this.obIsSelectRow(false);
					}
				}.bind(this)
			}

			var newOption = $.extend({}, defaultOption, option);
			this.searchGrid = new TF.Grid.KendoGrid(this.$container.find('.kendo-grid-container'), newOption, this._gridState);
			this.obGridNoSelection = ko.computed(function()
			{
				return this.searchGrid.getSelectedIds().length == 0;
			}.bind(this));
			this._openBulkMenu();
			this.searchGrid.filterMenuClick = this.searchGrid.filterMenuClick.bind(this);
			this.searchGrid.onDoubleClick.subscribe(this._viewfromDBClick.bind(this));
			this.searchGrid.onEyeCheckChanged.subscribe(this._onAdditionalSelectionChange.bind(this));
			this.searchGrid.getSelectedIds.subscribe(function()
			{
				if (this.searchGrid.getSelectedIds().length == 0)
				{
					this.obIsSelectRow(false);
				}
				else
				{
					this.obIsSelectRow(true);
				}
			}, this);
			this.obNoRecordSelected = this.obGridNoSelection;
			this.targetID = ko.observable();
			this.obGridNoAction = ko.computed(function()
			{
				var ids = this.searchGrid.getSelectedIds();
				if (this.searchGrid.getSelectedIds().length == 0)
				{
					return true;
				}
				return false;
			}.bind(this));
			this.obMouseOutTarget = ko.computed(function()
			{
				var ids = this.searchGrid.getSelectedIds();
				if (this.searchGrid.getSelectedIds().length == 0)
				{
					return false;
				}
				if (this.targetID() && ids.indexOf(this.targetID()) < 0)
				{
					return true
				}
				return false;
			}.bind(this));

			this.loadReportLists();
		},


		_openBulkMenu: function()
		{
			if (this.hasRightClickEvent)
			{
				this.$container.delegate("table.k-selectable tr", "contextmenu", function(e, parentE)
				{
					var element = e;
					if (parentE)
					{
						element = parentE;
					}
					this.targetID(this.searchGrid.kendoGrid.dataItem(e.currentTarget).Id);
					var $virsualTarget = $("<div></div>").css(
						{
							position: "absolute",
							left: element.clientX,
							top: element.clientY
						});
					$("body").append($virsualTarget);
					var type = this.type;
					if (this.type == "documentmini")
						type = "document";
					tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "clientconfigs"))
						.then(function(data)
						{
							if (!!data.Items[0].EmailAddress)
							{
								this.obEmail = ko.observableArray([]);
								this.obEmail.push(data.Items[0].EmailAddress);
							}
							tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "userprofiles"))
								.then(function(response)
								{
									if (!!response.Items[0].Email)
									{
										if (!this.obEmail())
										{
											this.obEmail = ko.observableArray([]);
										}
										if (this.obEmail().length <= 0 || this.obEmail()[0] !== response.Items[0].Email)
										{
											this.obEmail.push(response.Items[0].Email);
										}
									}
									tf.contextMenuManager.showMenu($virsualTarget, new TF.ContextMenu.BulkContextMenu(pathCombine("workspace/grid", type, "bulkmenu"), new TF.Grid.GridMenuViewModel(this, this.searchGrid)));
								}.bind(this));
						}.bind(this));
				}.bind(this));

				this.$container.delegate(".kendogrid-blank-fullfill .fillItem", "mousedown", function(e)
				{
					var uid = $(e.currentTarget).data("id")
					var items = this.$container.find("table.k-selectable tr").filter(function(a, b)
					{
						return $(b).data("kendoUid") == uid;
					});
					if (items.length > 0)
					{
						$(items[0]).trigger("mousedown", [e]);
					}
				}.bind(this));
			}
		},

		_viewfromDBClick: function(e, record)
		{
			if (record == null)
			{
				return;
			}

			if (this.type == "document" || this.type == "documentmini")
			{
				// Do Nothing
			}
			else
			{
				tf.DataEntryHelper.getTabNamesByIds(this.type, [record.Id]).then(function(tabNames)
				{
					var documentData = new TF.Document.DocumentData(TF.Document.DocumentData.DataView,
						{
							type: this.type,
							ids: [record.Id],
							tabNames: tabNames,
						});
					tf.documentManagerViewModel.openObjectDocument(documentData);
				}.bind(this));
			}
		},

		_openDetailPopover: function(offset, currentDataModel)
		{
			this.obCurrentDataModel(currentDataModel);
			this.loadOtherInfoForPopover()
				.then(function()
				{
					tf.contextMenuManager.showMenu(offset, new TF.ContextMenu.TemplateContextMenu(pathCombine("workspace/grid", this.type, "detailpopover"), new TF.Grid.GridMenuViewModel(this, this.searchGrid)));
				}.bind(this));
		},

		filterMenuClick: function(viewModel, e)
		{
			this.searchGrid.filterMenuClick(e);
		},

		showhideFilterClick: function(viewModel, e)
		{
			var filterRow = this.$container.find(".kendo-grid-container").find(".k-filter-row");
			if (filterRow != undefined && filterRow.length > 0)
			{
				if (filterRow[0].style.display == "none")
				{
					filterRow.css("display", "");
					this.searchGrid._filterHeight = 0;
					this.obFilterIconCss("iconbutton eye-hide");
				}
				else
				{
					filterRow.css("display", "none");
					this.searchGrid._filterHeight = filterRow.height();
					this.obFilterIconCss("iconbutton eye-show");
				}
				this.searchGrid.fitContainer();
			}
		}
	};

	BaseKendoGridViewModel.prototype.initExtraSettings = function()
	{
		if (this._gridState)
		{//used to minigrid layout(default and sticky)
			this.options.kendoGridOption = {
				entityId: this._gridState.entityId,
				entityType: this._gridState.entityType
			};
			if (this.options.kendoGridOption.entityType)
			{
				this.isBigGrid = false;
				this.options.storageKey = tf.storageManager.gridInViewCurrentLayout(this.options.kendoGridOption.entityType + "." + this.type);
				this.mergeMinigridColumns();
			}
		}
	};



	BaseKendoGridViewModel.prototype._refreashPanel = function()
	{
		var currentPanelWidth = this.searchGrid.$container.parent().width(),
			lockedHeaderWidth = this.searchGrid.$container.find('.k-grid-header-locked').width();
		paddingRight = parseInt(this.searchGrid.$container.find(".k-grid-content").css("padding-right"));
		[this.searchGrid.$container, this.searchGrid.$summaryContainer].forEach(function(container)
		{
			container.find(".k-auto-scrollable,.k-grid-content").width(currentPanelWidth - lockedHeaderWidth - paddingRight);
		});
		this._leftPanelMaxWidth = this.$container.width() - 4;
	};

	BaseKendoGridViewModel.prototype.loadOtherInfoForPopover = function()
	{
		return Promise.resolve();
	};

	BaseKendoGridViewModel.prototype.openCurrentModelInPopover = function(e, operateType, dateType, id)
	{
		if (operateType == "view")
		{
			var documentData = new TF.Document.DocumentData(TF.Document.DocumentData.DataView,
				{
					type: dateType,
					ids: [id]
				});
			tf.documentManagerViewModel.add(documentData, false);
			tf.contextMenuManager.dispose();
		}
		if (operateType == "edit")
		{
			var documentData = new TF.Document.DocumentData(TF.Document.DocumentData.DataEntry,
				{
					type: dateType,
					ids: [id]
				});
			tf.documentManagerViewModel.add(documentData, false);
			tf.contextMenuManager.dispose();
		}
	};

	BaseKendoGridViewModel.prototype.showTodoWarningClick = function()
	{
		this.searchGrid.gridAlert.show(
			{
				message: "Not Implement!"
			});
	};

	BaseKendoGridViewModel.prototype.getGridState = function()
	{
		return this.searchGrid.getGridState();
	};

	BaseKendoGridViewModel.prototype.relatedClickGen = function(type, subUrl)
	{
		return function(viewModel, e)
		{
			this._openRelated(type, subUrl, e);
		}.bind(this)
	};

	BaseKendoGridViewModel.prototype._openRelated = function(type, subUrl, e)
	{
		var openNewWindow = TF.DocumentManagerViewModel.isOpenNewWindow(e);
		var selectedIds = this.searchGrid.getSelectedIds();
		if (selectedIds.length > 0)
		{
			var self = this;
			this._getIdsFromRelated(type, subUrl, selectedIds)
				.then(function(ids)
				{//Maybe sooner change the data get from DB of new page loading
					var fromMenu = $(e.currentTarget).find(".menu-label").text().trim();

					var toGridType = tf.applicationTerm.getApplicationTermPluralByName(tf.modalHelper.Mappings[type]);
					var fromGridType = tf.applicationTerm.getApplicationTermPluralByName(tf.modalHelper.Mappings[self.type]);

					var filterName = toGridType + ' (' + fromMenu + ' for Selected ' + fromGridType + ')';
					//the filter will sticky once open a new grid, so save the sticky information in DB
					var storageFilterDataKey = "grid.currentfilter." + type + ".id";
					tf.storageManager.save(storageFilterDataKey, { "filteredIds": ids, "filterName": filterName });

					var documentData = new TF.Document.DocumentData(TF.Document.DocumentData.Grid,
						{
							gridType: type
						});
					documentData.data.tabName = filterName;
					tf.documentManagerViewModel.add(documentData, openNewWindow);
				}.bind(this))
		}
		else
		{
			this.searchGrid.gridAlert.show(
				{
					message: "no data selected!"
				});
		}
	};

	BaseKendoGridViewModel.prototype._getIdsFromRelated = function(type, subUrl, realatedIds)
	{
		return new Promise(function(resolve, reject)
		{
			tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), type, "ids", subUrl),
				{
					data: realatedIds,
				})
				.then(function(result)
				{
					resolve(result.Items[0]);
				}.bind(this))
		}.bind(this));
	};

	BaseKendoGridViewModel.prototype.openSelectedClick = function(viewModel, e)
	{
		this._openSelected(this.type, e);
	};

	BaseKendoGridViewModel.prototype._openSelected = function(gridType, e, ids, title)
	{
		var openNewWindow = TF.DocumentManagerViewModel.isOpenNewWindow(e);
		var selectedIds = ids || this.searchGrid.getSelectedIds();
		if (selectedIds.length > 0)
		{
			var fromMenu = $(e.currentTarget).find(".menu-label").text().trim();
			var filterName = title || fromMenu + ' (Selected Records)';
			//the filter will sticky once open a new grid, so save the sticky information in DB
			var storageFilterDataKey = "grid.currentfilter." + gridType + ".id";
			tf.storageManager.save(storageFilterDataKey, { "filteredIds": selectedIds, "filterName": filterName });

			var documentData = new TF.Document.DocumentData(TF.Document.DocumentData.Grid,
				{
					gridType: gridType
				});
			documentData.data.tabName = filterName;
			tf.documentManagerViewModel.add(documentData, openNewWindow);
		}
		else
		{
			this.searchGrid.gridAlert.show(
				{
					message: "no data selected!"
				});
		}
	};

	BaseKendoGridViewModel.prototype._onAdditionalSelectionChange = function(e, args)
	{
		this.splitmap.setItems(args);
	};

	BaseKendoGridViewModel.prototype._onSelectCountChange = function(e, args)
	{
		this.obGridNoSelection(args == 0);
	};

	BaseKendoGridViewModel.prototype.invertSelectionClick = function(viewModel, e)
	{
		this.searchGrid.invertSelection();
	};

	BaseKendoGridViewModel.prototype.omitSelectionClick = function()
	{
		this.searchGrid.omitSelection();
	};

	BaseKendoGridViewModel.prototype.allSelectionClick = function(viewModel, e)
	{
		this.searchGrid.allSelection();
	};

	BaseKendoGridViewModel.prototype.deleteSelectionClick = function(viewModel, e)
	{
	};

	BaseKendoGridViewModel.prototype.deleteSelectedItems = function(ids)
	{
	};

	BaseKendoGridViewModel.prototype.normalizeRecordType = function()
	{
		switch (this.type)
		{
			case 'tripstop':
				return 'Trip Stop';
			case 'altsite':
				return 'Alternate Site';
			case 'georegion':
				return 'Geo Region';
		}
		return this.type.substring(0, 1).toUpperCase() + this.type.substring(1);
	};

	BaseKendoGridViewModel.prototype.editClick = function(viewModel, e)
	{
	}
	BaseKendoGridViewModel.prototype.copyToClipboardClick = function(viewModel, e)
	{
		var selectedIds = this.searchGrid.getSelectedIds();
		var self = this;
		if (selectedIds.length === 0 && self.searchGrid.kendoGrid.dataSource._total > 0) //When no records are selected, All records in the grid will be included
		{
			ids = [];
			this.searchGrid.kendoGrid.dataSource.data().map(function(item)
			{
				ids.push(item.Id);
			});
			this.searchGrid.getSelectedIds(ids);
			this._copySelectedRecords.bind(self)(e);
			this.searchGrid.getSelectedIds([]);
		}
		else
		{
			this._copySelectedRecords.bind(self)(e);
		}
	};

	BaseKendoGridViewModel.prototype._copySelectedRecords = function(e)
	{
		e.ctrlKey = true;
		this.searchGrid.kendoGrid.copySelection(e);
		//may need check compatibility sooner: t.setSelectionRange(0, t.value.length)
		document.execCommand("copy");
	};

	BaseKendoGridViewModel.prototype.saveAsClick = function(viewModel, e)
	{
		var selectedIds = this.searchGrid.getSelectedIds();
		this.searchGrid.exportCurrentGrid(selectedIds);
	};

	BaseKendoGridViewModel.prototype.exportClick = function(viewModel, e)
	{
		this.searchGrid.exportCurrentGrid();
	};

	BaseKendoGridViewModel.prototype.sendEmailClick = function(viewModel, e)
	{
		//total 2 attachments, but will be added by manual
		//the excel file could use: this.searchGrid.exportCurrentGrid();
		//the kml file should get from google earch: TFExportGoogle SendToGoogle of frm_DataGrid
		var selectedIds = this.searchGrid.getSelectedIds();
		var self = this;
		var subject = tf.applicationTerm.getApplicationTermPluralByName(this.typeToTerm(this.type));
		var filterStr = this.searchGrid.obSelectedGridFilterName() != "None" ? ", Filter: " + this.searchGrid.obSelectedGridFilterName() : "";
		var nowStr = moment().format("MM/DD/YYYY hh:mm A");
		if (selectedIds.length === 0)
		{
			this.searchGrid.getIdsWithCurrentFiltering()
				.then(function(data)
				{
					selectedIds = data;
					subject += " (Records: All" + filterStr + ") " + nowStr;
					self._popupSendEmailOfGridModalViewModel.bind(self)(selectedIds, subject);
				}.bind(this));
		}
		else
		{
			subject += " (Records: Selected" + filterStr + ") " + nowStr;
			self._popupSendEmailOfGridModalViewModel.bind(self)(selectedIds, subject);
		}
	};

	BaseKendoGridViewModel.prototype._popupSendEmailOfGridModalViewModel = function(selectedIds, subject)
	{
		var gridLayoutExtendedEntity = this.searchGrid._obCurrentGridLayoutExtendedDataModel().toData();
		gridLayoutExtendedEntity.LayoutColumns = this.searchGrid._obSelectedColumns();
		tf.modalManager.showModal(
			new TF.Modal.SendEmailOfGridModalViewModel(
				{
					term: this.typeToTerm(this.type),
					subject: subject,
					type: this.type,
					layout: gridLayoutExtendedEntity,
					selectedIds: selectedIds,
					emailAddress: this.obEmail()
				})
		)
			.then(function()
			{

			}.bind(this));
	};

	BaseKendoGridViewModel.prototype.viewClick = function(viewModel, e)
	{
		var selectedIds = this.searchGrid.getSelectedIds();
		if (selectedIds.length == 0)
		{
			return;
		}

		var selectedRecords = this.searchGrid.getSelectedRecords();

		tf.DataEntryHelper.getTabNamesByIds(this.type, selectedIds).then(function(tabNames)
		{
			var documentData = new TF.Document.DocumentData(TF.Document.DocumentData.DataView,
				{
					type: this.type,
					ids: selectedIds,
					tabNames: tabNames,
				});
			tf.documentManagerViewModel.add(documentData, TF.DocumentManagerViewModel.isOpenNewWindow(e));
		}.bind(this));
	};


	BaseKendoGridViewModel.prototype.addClick = function(viewModel, e)
	{
	};

	BaseKendoGridViewModel.prototype.mailTo = function(value, data)
	{
		document.location.href = "mailto:" + value;
	};

	BaseKendoGridViewModel.prototype.viewReportClick = function(viewModel, e)
	{
		var selectedIds = this.searchGrid.getSelectedIds();
		if (selectedIds.length === 0)
		{
			this.searchGrid.getIdsWithCurrentFiltering()
				.then(function(data)
				{
					selectedIds = data;
					this.openReportConfigure(viewModel, selectedIds);
				}.bind(this));
		}
		else
		{
			this.openReportConfigure(viewModel, selectedIds);
		}
	};

	BaseKendoGridViewModel.prototype.openReportConfigure = function(viewModel, ids)
	{
		tf.modalManager.showModal(new TF.Modal.GenerateReportModalViewModel(viewModel, 'saveas',
			{
				selectedRecordId: ids
			}));
	};

	BaseKendoGridViewModel.prototype.mergeMinigridColumns = function()
	{
		columns = this.getMinigridColumns();
		if (columns.length > 0)
		{
			this.options.gridDefinition.Columns.forEach(function(c)
			{
				c.hidden = true;
			});
			columns.reverse().forEach(function(item)
			{
				for (var i = 0, l = this.options.gridDefinition.Columns.length; i < l; i++)
				{
					if (this.options.gridDefinition.Columns[i].FieldName == item)
					{
						this.options.gridDefinition.Columns[i].hidden = false;
						var c = this.options.gridDefinition.Columns.splice(i, 1);
						this.options.gridDefinition.Columns.unshift(c[0]);
						break;
					}
				}
			}.bind(this));
		}
	};

	BaseKendoGridViewModel.prototype.getMinigridColumns = function()
	{
		return [];
	};

	BaseKendoGridViewModel.prototype.typeToTerm = function()
	{ //this function is used by reports menu
		switch (this.type)
		{
			case "student":
				return "Student";
			case "school":
				return "School";
			case "district":
				return "District";
			case "contractor":
				return "Contractor";
			case "vehicle":
				return "Vehicle";
			case "staff":
				return "Staff";
			case "altsite":
				return "Alternate Site";
			case "trip":
				return "Trip";
			case "tripstop":
				return "Trip Stop";
			case "fieldtrip":
				return "Field Trip";
			case "georegion":
				return "Geo Region";
		}
		return "";
	}

	BaseKendoGridViewModel.prototype.dispose = function()
	{
		this.searchGrid.dispose();
		tf.exagoBIHelper.reportListUpdated.unsubscribe(this.loadReportLists);
	};

	// Map View

	BaseKendoGridViewModel.prototype._loadMap = function()
	{
		// 1. create map
		this._createMap();

		// 2. get and parse data
		this._getMapFeatureIds().then(function(featureIds)
		{
			this._getAndPraseMapData(featureIds, function(features)
			{
				if (features && features.length > 0)
				{
					this._layerHelper = new TF.Map.Layer(this._mapHelper.map);

					// 3. create and render layer
					var layer = this._createLayer(features);

					// 4. define events
					this._setMapEvents(layer);

					// 5. add features and layers
					this._mapHelper.addLayer([layer]);

					// release
					layer = null;
				}
				features = null;

			}.bind(this));
			featureIds = null;

		}.bind(this));

	};

	BaseKendoGridViewModel.prototype._createMap = function()
	{
		var mapHelper = this._mapHelper;
		mapHelper.mapDiv = this.$container.find(".splitmap");
		mapHelper.setSliderPosition(mapHelper.sliderPositionStyle.topLeft);

		mapHelper.createMap();
		this._mapHelper = mapHelper;

		mapHelper = null;
	};

	BaseKendoGridViewModel.prototype._getMapFeatureIds = function()
	{
		var selectedIds = this.searchGrid.getSelectedIds();
		var selectedCount = selectedIds.length;

		var filteredIds = this.searchGrid._gridState.filteredIds;  // the filteredIds is null, check
		var filteredCount = filteredIds ? filteredIds.length : 0;

		var featureIds = selectedCount > 0 ? selectedIds : (filteredCount > 0 ? filteredIds : null);

		selectedIds = null;
		filteredIds = null;

		if (featureIds == null)
		{
			return this.searchGrid.getIdsWithCurrentFiltering().then(function(allIds)
			{
				return Promise.resolve(allIds);
			}.bind(this));
		} else
		{
			return Promise.resolve(featureIds);
		}
	};

	BaseKendoGridViewModel.prototype._getAndPraseMapData = function(dataIds, callback)
	{
		var mapData = new TF.Map.MapData(this.type, this._mapHelper);
		mapData.getFeatures(dataIds, callback);

		mapData = null;
		dataIds = null;
	};

	BaseKendoGridViewModel.prototype._createLayer = function(features)
	{
		var layerId = this.type;

		this._layerHelper.init(layerId);

		var layer = this._layerHelper.isClustered ? this._layerHelper.getClusterLayer(layerId, features) : this._layerHelper.getGraphicsLayer(layerId, features);
		return layer;
	};

	BaseKendoGridViewModel.prototype._setMapEvents = function(layer)
	{
		this._mapHelper.onLayersAddResult(function()
		{
			this._layerHelper.zoomToLayer(this.type);
		}.bind(this));

		this._layerHelper.onMouseOver(layer, function()
		{
			this._mapHelper.map.setMapCursor("pointer");
		}.bind(this));

		this._layerHelper.onMouseOut(layer, function()
		{
			this._mapHelper.map.setMapCursor("default");
		}.bind(this));
	};

	BaseKendoGridViewModel.prototype.bindDraggable = function(dragGroup, getName)
	{
		var filter = "tbody > tr";
		if (dragGroup == "staffGroup")
		{
			filter = "tbody > tr.draggable";
		}

		this.searchGrid.$container.kendoDraggable({
			group: dragGroup,
			filter: filter,
			threshold: 100,
			holdToDrag: TF.isMobileDevice,
			container: $("body"),
			cursorOffset: { left: 0, top: 0 },
			hint: function(e)
			{
				if (e.hasClass("k-state-selected") && (dragGroup == "documentGroup" || dragGroup == "studentGroup"))
				{//multiple drag only allowed in document grid and student grid
					var selectedColumns = this.searchGrid.$container.find('.k-grid-content .k-state-selected');
					return this._getHintElements(e, selectedColumns, getName);
				}
				else
				{
					return this._getHintElements(e, null, getName, dragGroup);
				}
			}.bind(this)
		});
	};

	BaseKendoGridViewModel.prototype._getHintElements = function(item, selectedColumns, getName, dragGroup)
	{
		var documentIds = [];
		var documentNames = [];
		var hintElements = $('<div class="k-grid k-widget document-drag-hint" style=""><table><tbody></tbody></table></div>');
		hintElements.css({
			"width": "260px",
			"background-color": "#FFFFCE",
			"opacity": 0.8,
			"cursor": "move"
		});
		if (selectedColumns == undefined)
		{
			var dataItem = this.searchGrid.kendoGrid.dataItem(item[0]);
			var name = getName(dataItem),
				Id = dataItem.Id;
			if (dragGroup == "schoolGroup")
			{
				Id = dataItem.School;
			}

			documentIds.push(Id);
			documentNames.push(name);
			//only display the file name
			hintElements.find('tbody').append('<tr><td role="gridcell">' + name + '</td></tr>');
		}
		else
		{
			var dataItem;
			for (var i = 0; i < selectedColumns.length; i++)
			{
				dataItem = this.searchGrid.kendoGrid.dataItem(selectedColumns[i]);
				var name = getName(dataItem),
					Id = dataItem.Id;
				if (dragGroup == "schoolGroup")
				{
					Id = dataItem.School;
				}
				documentIds.push(dataItem.Id);
				documentNames.push(name);
				//only display the file name
				hintElements.find('tbody').append('<tr><td role="gridcell">' + name + '</td></tr>');
			}
		}
		//the document ids are used to save these documents associate information
		hintElements.data("documentIds", documentIds);
		//the documents names are used to show in the page level and let user know documents are associated successfully or already
		hintElements.data("documentNames", documentNames);
		//used to show the page level
		hintElements.data("documentViewModel", this);
		return hintElements;
	};

	BaseKendoGridViewModel.prototype._getValidReportIds = async function()
	{
		var self = this;
		return tf.promiseAjax.post(pathCombine(tf.api.apiPrefixWithoutDatabase(), "search/exagoreports", "id"),
			{
				paramData: {
					databaseId: tf.datasourceManager.databaseId,
				},
				data: {
					"fields": ["Id"],
					"filterSet": { "FilterItems": [], "FilterSets": [], "LogicalOperator": "and" }
				}
			}
		).then(function(apiResponse)
		{
			self.allIds = apiResponse.Items;
			return self.allIds.slice(0);
		}).catch(function(ex)
		{
			console.log(ex);
			return [];
		});
	}

	BaseKendoGridViewModel.prototype.loadReportLists = async function()
	{
		var self = this;
		const validReportIds = await self._getValidReportIds();
		let getReporsPromise = tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "exagoreports"), {
			paramData: {
				dataTypeId: tf.dataTypeHelper.getId(self.type),
				"@filter": "eq(IsDashboard,false)"
			}
		}),
			getReportFavoritePromise = tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "userreportfavorites"), {
				paramData: {
					"@filter": `eq(UserID,${tf.authManager.authorizationInfo.authorizationTree.userId})`
				}
			});

		Promise.all([getReporsPromise, getReportFavoritePromise]).then(([getReportsResponse, getReportFavoriteResponse]) =>
		{
			let favoriteReportIds = getReportFavoriteResponse.Items.map(item => item.ReportID);
			getReportsResponse.Items.forEach(report =>
			{
				report.IsFavorite = favoriteReportIds.includes(report.Id);
			});

			let reportList = Array.sortBy(getReportsResponse.Items.filter(item => item.IsFavorite), "Name").concat(Array.sortBy(getReportsResponse.Items.filter(item => !item.IsFavorite), "Name"));
			reportList = reportList.filter(r => validReportIds.indexOf(r.Id) > -1);
			self.obReportList(reportList);
		});
	};

})();
