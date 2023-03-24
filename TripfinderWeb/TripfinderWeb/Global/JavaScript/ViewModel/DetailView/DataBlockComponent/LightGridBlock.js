(function()
{
	createNamespace("TF.DetailView.DataBlockComponent").LightGridBlock = LightGridBlock;

	let STATUS = {
		EXPAND: 0,
		RESTORE: 1
	};
	const ADD_BUTTON_CLASS_NAME = '.grid-top-right-button.add-event';
	var FIELD_TRIP_INVOICE_KEY = "fieldtripinvoice";
	var studentRequirementsUrl = "studentrequirements";
	var CONFIRMATION_TITLE = "Confirmation Message";
	var gridConfigsMap = {
		"ContactGrid": {
			checkPermission: function() { return tf.authManager.isAuthorizedForDataType("contact", "add") || tf.authManager.isAuthorizedForDataType("contact", "edit"); },
			btnClass: "add-contact",
			btnLabel: "Associate"
		},
		"ContactAssociationGrid": {
			btnClass: "add-association",
			btnLabel: "Associate"
		},
		"DocumentAssociationGrid": {
			checkPermission: function() { return tf.authManager.isAuthorizedFor("DocumentTab", "edit"); },
			btnClass: "add-association",
			btnLabel: "Associate"
		},
		"DocumentGrid": {
			checkPermission: function() { return tf.authManager.isAuthorizedForDataType("document", "add"); },
			btnClass: "add-document",
			btnLabel: "Associate"
		},
		"StudentRequirementGrid": {
			checkPermission: function() { return tf.authManager.isAuthorizedFor("student", ["add", "edit"]) && tf.authManager.isAuthorizedFor("school", ["read"]); },
			btnClass: "add-student-requirement",
			btnLabel: "Add"
		},
		"AdditionalRequirementGrid": {
			checkPermission: function() { return tf.authManager.isAuthorizedFor("student", ["add", "edit"]) && tf.authManager.isAuthorizedFor("school", ["read"]); },
			btnClass: "add-student-requirement",
			btnLabel: "Add"
		},
		"CalendarEventsGrid": {
			checkPermission: function() { return tf.authManager.isAuthorizedFor("trip", ["add", "edit"]); },
			btnClass: "add-calendar-event",
			btnLabel: "Add"
		},
		"FieldTripResourceGrid": {
			checkPermission: function()
			{
				return tf.helpers.fieldTripAuthHelper.canModifyResourceRecord();
			},
			btnClass: "add-fieldtrip-resource",
			btnLabel: "Add"
		},
		"FieldTripInvoiceGrid": {
			checkPermission: function()
			{
				return tf.helpers.fieldTripAuthHelper.canModifyInvoiceRecord();
			},
			btnClass: "add-fieldtrip-invoice",
			btnLabel: "Add"
		},
		"StudentCardGrid": {
			checkPermission: function() { return tf.authManager.isAuthorizedFor("student", ["add", "edit"]); },
			btnClass: "add-card",
			btnLabel: "Add"
		},
		"StudentScheduleGrid": {
			checkPermission: function() { return tf.authManager.isAuthorizedFor("student", ["edit"]) && tf.authManager.isAuthorizedFor("school", ["read"]); },
			btnClass: "add-student-exception",
			btnLabel: "Add Exception"
		},
	};

	TF.StudentRequirementType = {
		default: 0,
		additional: 1
	};

	function LightGridBlock(options, detailView)
	{
		var self = this;
		TF.DetailView.DataBlockComponent.BaseDataBlock.call(self, detailView);

		self.$element = null;
		self.uniqueClassName = null;
		self.lightKendoGrid = null;
		self.pubSubSubscriptions = [];
		self.includeIds = [];

		self.options = options;
		self.gridBlockType = options.field;
		self.miniGridType = (options.url || "").toLowerCase();
		self.gridType = detailView.gridType;
		self.extraGridConfigs = self.getExtraGridConfigurations(options.field, detailView._getLayoutObjInCache().width);
		self.detailView = detailView;
		self.$detailView = detailView.$element;
		self.expandContainer = self.$detailView.find('.right-container');
		self.isCreateGridNewRecord = detailView.isCreateGridNewRecord;
		self.recordEntity = detailView.recordEntity;
		self.recordId = detailView.recordId;
		self.fieldEditorHelper = detailView.fieldEditorHelper;
		self.obEditing = detailView.obEditing;
		self.status = STATUS.RESTORE;

		self.miniGridHelper = tf.helpers.miniGridHelper;
		self._initGridActions();
		self._detailviewFieldChange = self._detailviewFieldChange.bind(self);
		detailView.onFieldChange.subscribe(self._detailviewFieldChange);
		self.initElement(options);
		self.addHotLink = self.addHotLink.bind(this);
		self.pubSubSubscriptions.push(PubSub.subscribe('tripsLoadedOnMap' + detailView.eventNameSpace, this.setTripsLoadedOnMap.bind(this)));
		self.tripLoadedNumber = 0;
		self.tripIsLoaded = false;
		self.gridMaxHeightBeforeExpand = 0;
		self.isBlockReadOnly.subscribe(val =>
		{
			if (val)
			{
				// disable user to edit rows in grid
				self.grid.wrapper.on('mousedown.readonlyBlock', (e) =>
				{
					e.preventDefault();
					e.stopPropagation();
				}).on('mouseover.readonlyBlock', (e) =>
				{
					self.$el.find(".on-demand-container").hide();
				}).on('contextmenu.readonlyBlock', (e) =>
				{
					e.preventDefault();
					e.stopPropagation();
				});
				self.$el.find(ADD_BUTTON_CLASS_NAME).addClass("disabled");
				self.grid.hideColumn("Action");
			} else
			{
				self.grid.wrapper.off('.readonlyBlock');
				self.$el.find(ADD_BUTTON_CLASS_NAME).removeClass("disabled");
				self.grid.showColumn("Action");
			}
		});
	};

	LightGridBlock.prototype = Object.create(TF.DetailView.DataBlockComponent.BaseDataBlock.prototype);

	LightGridBlock.prototype._detailviewFieldChange = function(e, data)
	{
		var self = this;
		switch (self.gridType)
		{
			case "fieldtrip":
				if (data.result.fieldName === "BillingClassificationId")
				{
					if (self.detailView.recordEntity && self.detailView.recordEntity.FieldTripResourceGroups)
					{
						var FieldTripResourceGroupsWithBC = self.fieldEditorHelper.applyBCtoResourceGroups(self.detailView.recordEntity.FieldTripResourceGroups, data.result.selectedItem)
						self._updateResourceGrid(FieldTripResourceGroupsWithBC);
					}
					PubSub.publish("fieldtripresource", {});
				}
				break;
		}
	};

	LightGridBlock.prototype._restore = function()
	{
		this.status = STATUS.RESTORE;
		this.$el.removeAttr('style');
		this.$el.height(this.expandedPrevHeight);
		this.$innerGrid && this.$innerGrid.css('height', this.$innerGridPreHeight);
		if (this.options.inMultipleGridBlock)
		{
			this.$el.find('.item-content.grid .kendo-grid.k-grid').css('height', 'auto');
		}
		if (this.$originalPrevious && this.$originalPrevious.length > 0)
		{
			this.$el.insertAfter(this.$originalPrevious);
			if (this.options.inMultipleGridBlock)
			{
				this.$el.css('padding-top', '15px');
			}
		} else if (this.$originalContainer && this.$originalContainer.length > 0)
		{
			this.$originalContainer.prepend(this.$el);
		}
		this.expandContainer.children().css({ "visibility": "visible" });
		this.expandContainer.css("overflow-y", "auto");
		this.expandedDom && this.expandedDom.remove();
		this._fitExpandGridHeight();
	};

	LightGridBlock.prototype._expand = function()
	{
		this.status = STATUS.EXPAND;
		const headerHeight = 34, footerHeight = 34;
		this.gridMaxHeightBeforeExpand = this.$el.find(".item-content.grid").height() - headerHeight - footerHeight;
		if (this.options.inMultipleGridBlock)
		{
			this.expandedDom = $(`<div class="grid-stack"><div style="height:100%;padding-top:5px;" class="grid-stack-item-content"></div></div>`);
		} else
		{
			this.expandedDom = $(`<div class="grid-stack"></div>`);
		}
		this.expandContainer.children().css({ "visibility": "hidden" });
		this.expandContainer.css("overflow-y", "hidden");
		this.expandContainer.append(this.expandedDom);
		this.expandContainer.css({ position: "relative" });
		this.expandedDom.css({
			position: "absolute",
			top: this.expandContainer.scrollTop(),
			left: 0,
			right: 0,
			bottom: 0,
			"z-index": 500,
			"background-color": "white"
		});
		this.expandedPrevHeight = this.$el[0].style['height'];
		this.expandedPreWidth = this.$el.width();
		this.expandedPreLeft = this.$el.position().left;
		this.$originalPrevious = this.$el.prev();
		this.$originalContainer = this.$el.parent();
		this.$innerGrid = this.$el.find('.kendo-grid .k-grid-content');
		this.$innerGridPreHeight = this.$innerGrid[0].style['height'];
		if (this.options.inMultipleGridBlock)
		{
			this.expandedDom.find('.grid-stack-item-content').append(this.$el);
			let itemGrid = this.expandedDom.find('.item-content.grid');
			itemGrid.parent().css('height', '100%');
			this.$el.find('.item-content.grid .kendo-grid.k-grid').css('height', '100%');
			itemGrid.css('height', 'calc(100% - 40px)');
		} else
		{
			this.expandedDom.append(this.$el);

		}
		this.$el.css({ 'width': '100%', 'height': '100%', 'left': 0 });
		this._fitExpandGridHeight();
	};

	LightGridBlock.prototype.manageLayout = function()
	{
		clearTimeout(this.reSizeExpandGridTimer);
		this.reSizeExpandGridTimer = setTimeout(() =>
		{
			if (this.status == STATUS.EXPAND)
			{
				this._fitExpandGridHeight();
			}
		}, 200)
	};

	LightGridBlock.prototype._fitExpandGridHeight = function()
	{
		this.lightKendoGrid.fitContainer();
	};

	LightGridBlock.prototype._toggleClick = function()
	{
		if (this.status == STATUS.RESTORE)
		{
			this._expand();

		} else
		{
			this._restore();
		}
		this.expandButton.toggleClass('restore');
		this.expandButton.attr('title', this.status == STATUS.RESTORE ? 'Expand' : 'Restore');
	};

	LightGridBlock.prototype._addExpandButton = function()
	{
		let self = this;
		if (!self.expandButton)
		{
			self.expandButton = $("<div title='Expand' style='margin-left:8px;width:30px;height:30px;padding:0;' class='grid-top-right-button expand-button'></div>")
			if (self.options.inMultipleGridBlock)
			{
				self.$el.find('div.item-title').css({ 'margin-bottom': '15px', 'position': 'relative', 'top': '15px' }).prepend(self.expandButton);
			}
			else
			{
				self.$el.find(`.custom-grid div.item-title`).css({ 'margin-bottom': '15px', 'position': 'relative', 'top': '15px' }).prepend(self.expandButton);
			}
		}
		self.expandButton.on('click', self._toggleClick.bind(self));

	};

	LightGridBlock.prototype._updateResourceGrid = function(FieldTripResources)
	{
		var self = this;
		if (FieldTripResources == null) return;
		FieldTripResources.forEach(function(rs)
		{
			var gridRow = self.grid._data.find(function(r) { return r.Id == rs.Id })
			if (gridRow)
			{
				gridRow.TotalCost = rs.TotalCost
			}
		});
	}
	LightGridBlock.prototype._initGridActions = function()
	{
		var self = this,
			isReadOnly = self.isReadOnly() || !self.extraGridConfigs.permission;

		self.kendoGridActions = {
			"document": {
				view: function(e)
				{
					if ($(e.currentTarget).hasClass("disable"))
					{
						return;
					}

					self.previewMiniGridDocumentFile(e);
				},
				download: function(e)
				{
					if ($(e.currentTarget).hasClass("disable"))
					{
						return;
					}

					self.downloadMiniGridDocumentFile(e);
				}
			}
		};
		if (!isReadOnly)
		{
			self.kendoGridActions.contact = {
				edit: self.editMiniGridRecord.bind(self, LightGridBlock.MINI_GRID_TYPE.CONTACT),
				delete: self.removeAssociationToContact.bind(self)
			};
			self.kendoGridActions.contactinformation = {
				edit: self.editMiniGridRecord.bind(self, LightGridBlock.MINI_GRID_TYPE.CONTACT),
				delete: self.removeAssociationToContact.bind(self)
			};
			self.kendoGridActions.document.delete = self.removeAssociationToDocument.bind(self);
		}

		// set on demand action
		self.onDemandGridActions = {};

		if (tf.isViewfinder && self.gridType === "route")
		{
			self.onDemandGridActions["trip"] = [];
			self.addTripVisibilityAction();
		}

		if (self.miniGridType === "communicationhistory" && self.checkLoadDataPermission(self.options))
		{
			self.onDemandGridActions[self.miniGridType] = [{
				name: "view",
				template: '<a class="k-button k-button-icontext k-grid-view" title="View"></a>',
				click: function(e)
				{
					self.viewMiniGridCommunicationHistory(e);
				}
			}];
		}

		if (isReadOnly)
		{
			return;
		}

		if (gridConfigsMap["StudentRequirementGrid"].checkPermission())
		{
			var studentRequirementAction = [{
				name: "edit",
				template: '<a class="k-button k-button-icontext k-grid-edit" title="Edit"></a>',
				click: function(e)
				{
					self.editStudentRequirement(this, e);
				}
			},
			{
				name: "delete",
				template: '<a class="k-button k-button-icontext k-grid-delete" title="Delete"></a>',
				click: function(e)
				{
					self.removeStudentRequirement(this, e, 'StudentRequirementGrid');
				}
			}];
			self.onDemandGridActions[TF.Helper.KendoGridHelper.studentRequirementItemsUrl] = studentRequirementAction;
		}

		if (gridConfigsMap["AdditionalRequirementGrid"].checkPermission())
		{
			var studentRequirementAction = [{
				name: "edit",
				template: '<a class="k-button k-button-icontext k-grid-edit" title="Edit"></a>',
				click: function(e)
				{
					self.editStudentRequirement(this, e);
				}
			},
			{
				name: "delete",
				template: '<a class="k-button k-button-icontext k-grid-delete" title="Delete"></a>',
				click: function(e)
				{
					self.removeStudentRequirement(this, e, 'AdditionalRequirementGrid');
				}
			}];
			self.onDemandGridActions[TF.Helper.KendoGridHelper.studentAdditionalRequirementUrl] = studentRequirementAction;
		}

		if (tf.authManager.isAuthorizedFor("student", ["edit"]))
		{
			self.onDemandGridActions["studentschedule"] = [
				{
					name: "edit",
					template: '<a class="k-button k-button-icontext k-grid-edit" title="Edit Exception"></a>',
					disable: (item) => { return item.IsException == "false" || item.IsException == false },
					click: function(e)
					{
						self.editStudentException(this, e.target);
					}
				},
				{
					name: "Unassign",
					template: '<a class="k-button k-button-icontext unassign-student-icon" title="Unassign"></a>',
					disable: (item) => { return item.Type == "NEZ"; },
					click: function(e)
					{
						self.unassignStudent(this, e.target);
					}
				}];
		}

		if (tf.authManager.isAuthorizedFor("trip", ["edit"]))
		{
			var studentscheduleActions = self.onDemandGridActions["studentschedule"] || [];
			studentscheduleActions.push({
				name: "OpenTrip",
				template: '<a class="k-button k-button-icontext open-trip-icon" title="Open Trip"></a>',
				disable: (item) => { return item.Type == "NEZ"; },
				click: function(e)
				{
					self.openTrip(this, e.target);
				}
			});

			self.onDemandGridActions["studentschedule"] = studentscheduleActions;

			if (self.gridType === "route")
			{
				self.onDemandGridActions["trip"] = [];
				self.addTripVisibilityAction();
				self.onDemandGridActions["trip"].push({
					name: "delete",
					template: '<a class="k-button k-button-icontext k-grid-delete" title="Remove"></a>',
					click: function(e)
					{
						self.unassignTrip(this, e.target);
					}
				});
			}
		}

		if (gridConfigsMap["CalendarEventsGrid"].checkPermission())
		{
			self.onDemandGridActions["triphistory"] = [{
				name: "edit",
				template: '<a class="k-button k-button-icontext k-grid-edit" title="Edit"></a>',
				click: function(e)
				{
					self.editCalendarEventModal(this, e);
				}
			},
			{
				name: "delete",
				template: '<a class="k-button k-button-icontext k-grid-delete" title="Delete"></a>',
				click: function(e)
				{
					self.deleteCalendarEventModal(this, e);
				}
			}];
		}

		if (gridConfigsMap["FieldTripInvoiceGrid"].checkPermission())
		{
			var fieldTripInvoiceAction = [{
				name: "edit",
				template: '<a class="k-button k-button-icontext k-grid-edit" title="Edit"></a>',
				click: function(e)
				{
					self.addEditFieldTripInvoice(e);
				}
			},
			{
				name: "delete",
				template: '<a class="k-button k-button-icontext k-grid-delete" title="Delete"></a>',
				click: function(e)
				{
					self.deleteFieldTripInvoice(e)
				}
			}];
			self.onDemandGridActions[FIELD_TRIP_INVOICE_KEY] = fieldTripInvoiceAction;
		}

		if (gridConfigsMap["FieldTripResourceGrid"].checkPermission())
		{
			var fieldTripResourceAction = [{
				name: "edit",
				template: '<a class="k-button k-button-icontext k-grid-edit" title="Edit"></a>',
				click: function(e)
				{
					self.editFieldTripResource(this, e);
				}
			},
			{
				name: "delete",
				template: '<a class="k-button k-button-icontext k-grid-delete" title="Delete"></a>',
				click: function(e)
				{
					self.removeFieldTripResource(this, e);
				}
			}];
			self.onDemandGridActions["fieldtripresource"] = fieldTripResourceAction;
		}

		if (gridConfigsMap["StudentCardGrid"].checkPermission())
		{
			self.onDemandGridActions["studenttagids"] = [{
				name: "edit",
				template: '<a class="k-button k-button-icontext k-grid-edit" title="Edit"></a>',
				click: function(e)
				{
					self.editStudentCardModal(this, e);
				}
			},
			{
				name: "delete",
				template: '<a class="k-button k-button-icontext k-grid-delete" title="Delete"></a>',
				click: function(e)
				{
					self.deleteStudentCardModal(this, e);
				}
			}];
		}
	};

	LightGridBlock.MINI_GRID_TYPE = {
		"CONTACT": "contact",
		"CONTACTINFORMATION": "contactinformation",
		"DOCUMENT": "document",
		"TRIP": "trip",
	};

	LightGridBlock.MINI_GRID_NAME_DICTIONARY = {
		"contact": "ContactGrid",
		"document": "DocumentGrid",
		"trip": "TripGrid",
	};

	LightGridBlock.MINI_GRID_ASSOCIATION_FIELD_NAME = {
		"contact": "RecordContacts",
		"document": "DocumentRelationships",
		"trip": "TripIds"
	};

	LightGridBlock.MINI_GRID_RELATIONSHIP_KEY = {
		"contact": "contactAssociation",
		"document": "DocumentRelationship",
		"trip": "Trip"
	};

	LightGridBlock.prototype.initElement = function(options)
	{
		var self = this,
			uniqueClassName = options.uniqueClassName || tf.helpers.detailViewHelper.generateUniqueClassName(),
			title = options.title,
			extraGridConfigs = self.extraGridConfigs,
			$element = $("<div>", { class: uniqueClassName }),
			$gridStackItem = $("<div>", { class: "grid-stack-item-content custom-grid", "data-block-field-name": options.field }),
			$itemTitleInput = $("<input>", { class: "item-title", type: "text", value: title }),
			$itemTitleDiv = $("<div>", { class: "item-title", text: title }),
			$itemContent = $("<div>", { class: "item-content grid" }),
			$kendoGrid = $("<div>", { class: "kendo-grid kendo-grid-container" }),
			$summaryContainer = $("<div>", { class: "kendo-grid kendo-summarygrid-container" });

		self.removeAllFilterContainer();

		if (extraGridConfigs)
		{
			if (extraGridConfigs.minWidth)
			{
				options.minWidth = extraGridConfigs.minWidth;
			}

			// If this grid has top right button
			if (extraGridConfigs.topRightButton)
			{
				$itemTitleDiv.append($(extraGridConfigs.topRightButton));
			}

			if (extraGridConfigs.titleStyles)
			{
				$itemTitleDiv.css(extraGridConfigs.titleStyles);
			}
		}

		if (options.field === "ContactGrid")
		{
			$gridStackItem.attr("mini-grid-type", "contact");
		}

		$itemContent.append($kendoGrid, $summaryContainer);
		$gridStackItem.append($itemTitleInput, $itemTitleDiv, $itemContent);
		$element.append($gridStackItem);

		$kendoGrid.data("uniqueClassName", uniqueClassName);

		self.$el = options.inMultipleGridBlock ? $gridStackItem : $element;
		self.uniqueClassName = uniqueClassName;
		if (self.expandContainer && self.expandContainer.length > 0)
		{
			self._addExpandButton();
		}
	};

	LightGridBlock.prototype.initEvents = function()
	{
		var self = this,
			$btn = self.$el.find(ADD_BUTTON_CLASS_NAME);

		// Check if permission check could pass.
		if (!self.extraGridConfigs || self.extraGridConfigs.permission)
		{
			switch (self.gridBlockType)
			{
				case "ContactGrid":
					$btn.on("click.detailView", function()
					{
						self.manageRecordAssociation(LightGridBlock.MINI_GRID_TYPE.CONTACT);
					});
					break;
				case "DocumentGrid":
					$btn.on("click.detailView", function()
					{
						self.manageRecordAssociation(LightGridBlock.MINI_GRID_TYPE.DOCUMENT);
					});
					break;
				case "AdditionalRequirementGrid":
				case "StudentRequirementGrid":
					$btn.on("click.detailView", function()
					{
						self.showStudentRequirementModal(null, self.gridBlockType == "StudentRequirementGrid" ? TF.StudentRequirementType.default : TF.StudentRequirementType.additional);
					});
					break;
				case "CalendarEventsGrid":
					if (self.detailView.recordId > 0)
					{
						$btn.on("click", function()
						{
							self.showCalendarEventModal().then(function(result)
							{
								if (result)
								{
									self._notifyTripHistoryGridRefresh();
								}
							});
						});
					}
					else
					{
						$btn.addClass("disabled");
					}
					break;
				case "FieldTripResourceGrid":
					$btn.on("click.detailView", function()
					{
						self.showFieldTripResourceModal(null, self.recordId, self.grid);
					});
					break;
				case "FieldTripInvoiceGrid":
					$btn.on("click.detailView", function()
					{
						self.addEditFieldTripInvoice();
					});
					break;
				case "StudentCardGrid":
					$btn.on("click.detailView", () =>
					{
						let options = {
							StudentId: self.recordId,
							type: 'add',
						};
						if (!self.recordEntity)
						{
							var cardDataSource = self.getAndCreateNewEntityRelationship("studenttagids");
							options.newEntityDataSource = cardDataSource;
						}
						tf.modalManager.showModal(new TF.DetailView.StudentCardModalViewModel(options)).then(response =>
						{
							if (!response) return;
							if (!self.recordEntity) this.updateStudentTagIdRecord(response);
							this._notifyStudentCardGridRefresh();
						});
					});
					break;
				case "StudentScheduleGrid":
					if (self.detailView.recordId > 0)
					{
						$btn.on("click", () =>
						{
							tf.modalManager.showModal(new TF.DetailView.StudentExceptionModalViewModel(self.recordEntity)).then(response =>
							{
								if (!response) return;
								PubSub.publish("studentscheduleChange", {
									studentId: self.recordEntity ? self.recordEntity.Id : null
								});
								this.autoFindSchedule();
							});
						});
					}
					else
					{
						$btn.addClass("disabled");
					}
					break;
				case "TripGrid":
					if (self.gridType === "route")
					{
						$btn.on("click.detailView", function()
						{
							self.simpleRecordAssociation(LightGridBlock.MINI_GRID_TYPE.TRIP);
						});
					}
					break;
				default:
					break;
			}
		}
	};

	LightGridBlock.prototype.editStudentException = function(e, $target)
	{
		var self = this,
			$target = $target || $(e.currentTarget),
			$tr = $target.closest("tr"),
			entity = $target.closest(".kendo-grid-container").data("kendoGrid").dataItem($tr);

		return tf.modalManager.showModal(new TF.DetailView.StudentExceptionModalViewModel(self.recordEntity, entity)).then(response =>
		{
			if (!response) return;
			PubSub.publish("studentscheduleChange", { studentId: self.recordEntity ? self.recordEntity.Id : null });
			this.autoFindSchedule();
		});
	};

	LightGridBlock.prototype.updateAllGridsDataSource = function(fieldName, dataSource)
	{
		var self = this,
			grids = tf.helpers.detailViewHelper.getAllGridsAndColumns(self.$detailView, fieldName)["grids"];

		$.each(grids, function(_, item)
		{
			var $item = $(item);
			$item.data("kendoGrid").dataSource.data(dataSource);
			tf.helpers.kendoGridHelper.updateGridFooter($item, dataSource.length, dataSource.length);
		});
	};

	LightGridBlock.prototype.updateAllContactGridsDataSource = function(dataType, fieldName)
	{
		var self = this,
			grids = tf.helpers.detailViewHelper.getAllGridsAndColumns(self.$detailView, fieldName)["grids"];

		$.each(grids, function(_, item)
		{
			var $item = $(item);
			$item.data("lightKendoGrid").refresh();
		});
	};

	LightGridBlock.prototype.removeStudentRequirement = function(grid, e, type)
	{
		var self = this,
			tr = $(e.target).closest("tr"),
			data = grid.dataItem(tr),
			id = data.Id,
			studentId = self.recordEntity ? self.recordEntity.Id : null,
			requirementCache = TF.DataModel.StudentRequirementItemModel.getEntity(data);

		if (requirementCache)
		{
			var dataSource = grid.dataSource.data().slice();
			var index = dataSource.indexOf(data) || dataSource.findIndex(function(ele)
			{
				return ele == data;
			});
			if (index > -1)
			{
				dataSource.splice(index, 1);
				if (type === 'AdditionalRequirementGrid')
				{
					self.setEntityRelationship(TF.Helper.KendoGridHelper.studentAdditionalRequirementUrl, dataSource);
				} else
				{
					self.setEntityRelationship(TF.Helper.KendoGridHelper.studentRequirementItemsUrl, dataSource);
				}
				PubSub.publish(studentRequirementsUrl, {
					StudentId: studentId
				});
			}
			self.autoFindSchedule();
			return;
		}

		return TF.DetailView.StudentRequirementViewModel.checkStudentRequirementLocked(data.Id, 'delete').then(function()
		{
			return tf.promiseBootbox.yesNo("Are you sure you want to delete this record?", "Delete Confirmation")
				.then(function(res)
				{
					if (res)
					{
						var item = { Id: id, DBID: tf.datasourceManager.databaseId, StudentId: studentId, Stops: [], UnAssignAll: true };
						return self.getAllAffected(item).then(function(result)
						{
							if (result)
							{
								return tf.promiseAjax.put(pathCombine(tf.api.apiPrefixWithoutDatabase(), "requirementaffectedtrips"),
									{
										paramData: item
									}).then(function()
									{
										return tf.promiseAjax.delete(pathCombine(tf.api.apiPrefixWithoutDatabase(), "studentrequirements", id)).then(function()
										{
											PubSub.publish(studentRequirementsUrl, {
												StudentId: studentId
											});

											var studentScheduleGrid = $(".grid-stack-item-content[data-block-field-name='StudentScheduleGrid']").find(".kendo-grid-container"),
												studentScheduleKendoGrid = studentScheduleGrid.length > 0 && studentScheduleGrid.data("kendoGrid");
											PubSub.publish("studentscheduleChange", {
												studentId: studentId,
												scheduleCount: (studentScheduleKendoGrid && studentScheduleKendoGrid.dataItems().length) || 0
											});
											self.autoFindSchedule();
										}).catch(function(response)
										{
											return tf.promiseBootbox.alert(response.Message);
										});
									});
							}
						});
					}
				});
		}).catch(function() { });
	};

	LightGridBlock.prototype.getAllAffected = function(requirement)
	{
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "requirementaffectedtrips"),
			{
				paramData: requirement
			}).then(function(result)
			{
				var promiseReturn = Promise.resolve(true);
				var affectedTripStops = result.Items;
				if (affectedTripStops && affectedTripStops.length > 0)
				{
					affectedTripStops = affectedTripStops[0].Stops;
					if (affectedTripStops.length > 0)
					{
						promiseReturn = tf.modalManager.showModal(new TF.RoutingMap.RoutingPalette.SaveAllTripModalViewModel(affectedTripStops, 'requirement')).then(function(res)
						{
							return Promise.resolve(!!res);
						});
					}
				}

				return promiseReturn;
			});
	};

	LightGridBlock.prototype.setEntityRelationship = function(name, value)
	{
		this.detailView.newEntityRelationships[name] = value;
	};

	LightGridBlock.prototype.getMiniGridSelectedRecords = function(miniGridType)
	{
		return this.includeIds.filter(c => c > 0).map(c => ({ "Id": c }));
	};

	function isAssociationChanged(selectedData, response)
	{
		return response.isNewRecordCreated || !_.isEqual(selectedData.map(d => d.Id), response.selectedIds);
	}

	LightGridBlock.prototype.manageRecordAssociation = function(associationType)
	{
		var self = this,
			p1 = tf.helpers.detailViewHelper.getQuickAddLayoutByType(associationType),
			p2 = tf.dataTypeHelper.getDefaultColumnsByDataType(associationType);

		Promise.all([p1, p2]).then(function(values)
		{
			var layout = values[0],
				defaultColumns = values[1];

			if (!layout) return;

			var selectedData = self.getMiniGridSelectedRecords(associationType),
				options = {
					baseRecordType: self.gridType,
					baseRecordEntity: self.recordEntity,
					layoutEntity: layout,
					associationType: associationType,
					selectedData: selectedData,
					defaultColumns: defaultColumns,
					pageLevelViewModel: self.detailView.pageLevelViewModel
				};
			tf.modalManager.showModal(new TF.DetailView.ManageRecordAssociationModalViewModel(options))
				.then(function(response)
				{
					if (response && isAssociationChanged(selectedData, response))
					{
						var selectedIds = response.selectedIds;
						var confirmPromise = new Promise(res => res(true));
						if (!Array.isArray(selectedIds))
						{
							return;
						}

						let updatePromises = [];
						if (self.gridBlockType == "DocumentGrid")
						{
							var deletedDocument = _.differenceWith(selectedData.map(d => d.Id), selectedIds);
							if (deletedDocument.length > 0)
							{
								let dataTypeId = tf.dataTypeHelper.getId(self.gridType);
								let getDocumentUDGridCountPromise;
								if (self.isCreateGridNewRecord)
								{
									let affectedDocument = [];
									if (self.fieldEditorHelper.editFieldList.UDGrids != null)
									{
										self.fieldEditorHelper.editFieldList.UDGrids.forEach(udGrid =>
										{
											udGrid.UDGridRecordsValues.forEach(udGridRecord =>
											{
												udGridRecord.DocumentUDGridRecords.forEach(documentUDGridRecord =>
												{
													if (deletedDocument.includes(documentUDGridRecord.DocumentID))
													{
														affectedDocument.push(documentUDGridRecord);
													}
												});
											});
										});
									}
									getDocumentUDGridCountPromise = Promise.resolve(_.groupBy(affectedDocument, "DocumentID"));
								}
								else
								{
									getDocumentUDGridCountPromise = tf.udgHelper.getAffectedDocumentUDGridCount(self.recordId, dataTypeId, deletedDocument.join());
								}

								confirmPromise = getDocumentUDGridCountPromise.then(affceted =>
								{
									if (_.keys(affceted).length == null || _.keys(affceted).length == 0)
									{
										return true;
									}

									return tf.promiseBootbox.yesNo("This operation will also remove the associations between document and UDF Groups. Are you sure you want to apply these changes?", CONFIRMATION_TITLE).then(choice =>
									{
										if (!choice)
										{
											return false;
										}

										if (self.isCreateGridNewRecord)
										{
											self.fieldEditorHelper.editFieldList.UDGrids.forEach(udGrid =>
											{
												udGrid.UDGridRecordsValues.forEach(udGridRecord =>
												{
													_.remove(udGridRecord.DocumentUDGridRecords, documentUDGridRecord => deletedDocument.includes(documentUDGridRecord.DocumentID));
												});
											});

											updatePromises.push(Promise.resolve(true));
										}
										else
										{
											updatePromises.push(tf.udgHelper.updateAssociateDocuments(self.recordId, dataTypeId, deletedDocument));
										}

										return true;
									});
								})
							}
						}
						if (!self.isReadOnly())
						{
							confirmPromise.then(res =>
							{
								if (res)
								{
									updatePromises.push(self.updateAssociationEditList(associationType, selectedIds));
									Promise.all(updatePromises).then(function(res)
									{
										if (self.gridBlockType == "ContactGrid")
										{
											PubSub.publish("contactChange", { ids: selectedIds });
										}
										if (self.gridBlockType == "DocumentGrid")
										{
											PubSub.publish("documentChange", { ids: selectedIds });
										}
										if (res && res[1])
										{
											PubSub.publish("udgrid", {});
										}
										self.detailView.pageLevelViewModel.popupSuccessMessage("The updates have been saved successfully.");
									});
								}
								else return;
							})
						}
					}
				});
		});
	};

	LightGridBlock.prototype.simpleRecordAssociation = function(associationType)
	{
		let self = this, extendOptions = {};

		if (self.gridType === "route" && associationType === "trip")
		{
			extendOptions.vaildate = function(selectedIds)
			{
				if (!selectedIds.length)
				{
					return Promise.resolve(true);
				}

				return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "trips"), {
					paramData: {
						"@filter": "in(Id," + selectedIds.join() + ")&isnotnull(RouteId,)",
						"@relationships": "route",
						"@fields": "Name,RouteName,RouteId",
					}
				}).then((response) =>
				{
					var items = response.Items.filter(r => !self.recordEntity || r.RouteId !== self.recordEntity.Id);
					if (items.length)
					{
						let reassignMessages = items.map(r => `${r.Name} is currently assigned to ${r.RouteName}.`).join('<br/>');
						return tf.promiseBootbox.yesNo(
							{
								message: `The following trips are assigned to another Route. Do you want to reassign them to this Route?<br/>${reassignMessages}`,
								backdrop: true,
								title: "Confirmation Message",
								closeButton: true,
								maxHeight: 200
							});
					};

					return Promise.resolve(true)
				});
			}
		}

		tf.dataTypeHelper.getDefaultColumnsByDataType(associationType).then((defaultColumns) =>
		{
			let selectedData = self.getMiniGridSelectedRecords(associationType),
				options = {
					baseRecordType: self.gridType,
					baseRecordEntity: self.recordEntity,
					layoutEntity: null,
					associationType: associationType,
					selectedData: selectedData,
					defaultColumns: defaultColumns,
					pageLevelViewModel: self.detailView.pageLevelViewModel,
					serverPaging: false,
				};
			options = $.extend(extendOptions, options);
			tf.modalManager.showModal(new TF.DetailView.ManageRecordAssociationModalViewModel(options))
				.then((response) =>
				{
					if (response && isAssociationChanged(selectedData, response))
					{
						let selectedIds = response.selectedIds;
						if (!Array.isArray(selectedIds))
						{
							return;
						}

						if (!self.isReadOnly())
						{
							self.updateAssociationEditList(associationType, selectedIds).then((res) =>
							{
								if (res && res[1])
								{
									PubSub.publish("udgrid", {});
								}
								self.detailView.pageLevelViewModel.popupSuccessMessage("The updates have been saved successfully.");
								if (self.gridType === "route" && associationType === "trip")
								{
									let id = 0;
									if (self.recordEntity)
									{
										id = self.recordEntity.Id;
										if (this.detailView.parentDocument.gridMap.isShowing())
										{
											this._refreshChangedRouteMapData();
										}
									}

									let currentGridExistsTrips = this.detailView.invisibleTrips.filter(trip => selectedIds.includes(trip.tripId));
									this.detailView.invisibleTrips = currentGridExistsTrips;
									PubSub.publish("tripChange", { Id: id, tripIds: selectedIds, invisibleTrips: this.detailView.invisibleTrips, tripsColors: this.tripsColors });
								}
								else
								{
									tf.helpers.detailViewHelper.updateAllGridsDataSourceByIds(associationType, selectedIds, selectedIds.length, self.$detailView);
								}
							});
						}
					}
				});
		});
	};

	LightGridBlock.prototype.updateAssociationEditList = function(miniGridType, recordIds)
	{
		if (this.isReadOnly())
		{
			return;
		}
		var self = this,
			recordType = self.gridType,
			recordId = (!self.isCreateGridNewRecord && self.recordEntity) ? self.recordEntity.Id : 0,
			fieldName = LightGridBlock.MINI_GRID_ASSOCIATION_FIELD_NAME[miniGridType],
			associations = recordIds.map(function(id)
			{
				return tf.dataTypeHelper.createAssociationEntity(recordType, recordId, miniGridType, id);
			});

		if (self.isCreateGridNewRecord)
		{
			var editStash = self.fieldEditorHelper.editFieldList[fieldName];
			if (!Array.isArray(editStash))
			{
				editStash = {
					relationshipKey: LightGridBlock.MINI_GRID_RELATIONSHIP_KEY[miniGridType],
					value: []
				};
			}

			editStash.value = editStash.value.concat(associations);
			self.fieldEditorHelper.editFieldList[fieldName] = editStash;

			self.obEditing(true);

			return Promise.resolve(true);
		}
		else
		{
			return tf.helpers.detailViewHelper.updateRelationships(recordType, recordId, miniGridType, recordIds);
		}
	};

	LightGridBlock.prototype.downloadMiniGridDocumentFile = function(e)
	{
		var self = this,
			$tr = $(e.target).closest("tr"),
			$grid = $tr.closest(".kendo-grid-container"),
			kendoGrid = $grid.data("kendoGrid"),
			dataItem = kendoGrid.dataItem($tr),
			helper = tf.docFilePreviewHelper;

		Promise.all([
			self.getRecordEntity("document", dataItem.Id),
			helper.readFileStream(dataItem.Id)
		]).then(function(values)
		{
			var fileName = values[0].FileName,
				mimeType = values[0].MimeType,
				fileContent = values[1];
			//empty txt file  fileContent == ""
			if (fileContent == null)
			{
				tf.promiseBootbox.alert("The file content is empty!");
				return;
			}

			helper.initDownloadOnBrowser(fileName, mimeType, fileContent);
		});
	};

	/**
	 * Remove a document from record mini-grid.
	 *
	 * @param {Event} e
	 */
	LightGridBlock.prototype.removeAssociationToDocument = function(e)
	{
		var self = this,
			$target = $(e.currentTarget),
			$tr = $target.closest("tr"),
			$grid = $target.closest(".kendo-grid-container"),
			kendoGrid = $grid.data("kendoGrid"),
			documentEntity = kendoGrid.dataItem($tr),
			documentId = documentEntity.Id,
			gridName = tf.dataTypeHelper.getDisplayNameByDataType(self.gridType).toLowerCase();

		var WarningMessage = "Are you sure you want to disassociate this " + gridName + " from \"" + documentEntity.Name + "\"?"
		if (self.gridBlockType = "DocumentGrid")
			WarningMessage = `Disassociate this ${gridName} from ${documentEntity.Name} will also remove associations between document and UDF Groups. Are you sure you want to apply these changes?`
		tf.promiseBootbox.yesNo(WarningMessage, CONFIRMATION_TITLE)
			.then(function(res)
			{
				if (!res) return;

				var tasks = [];

				// delete action is needed only when editing an existing record.
				if (!!self.recordId)
				{
					tasks.push(tf.promiseAjax.delete(pathCombine(tf.api.apiPrefixWithoutDatabase(), "documentRelationships"), {
						paramData: {
							DBID: tf.datasourceManager.databaseId,
							DocumentID: documentId,
							AttachedToID: self.recordId,
							AttachedToType: tf.dataTypeHelper.getId(self.gridType)
						}
					}));
				}

				Promise.all(tasks).then(res =>
				{
					if (self.isCreateGridNewRecord)
					{
						// self.fieldEditorHelper.editFieldList.UDGrids.forEach(udGrid =>
						// {
						// 	udGrid.UDGridRecordsValues.forEach(udGridRecord =>
						// 	{
						// 		_.remove(udGridRecord.DocumentUDGridRecords, documentUDGridRecord => documentId == documentUDGridRecord.DocumentID);
						// 	});
						// });

						return Promise.resolve(true);
					}

					return tf.udgHelper.updateAssociateDocuments(self.recordId, tf.dataTypeHelper.getId(self.gridType), [documentId])
				}).then
					(function(response)
					{
						var documentIds = self.includeIds.filter((id) =>
						{
							return id !== documentId;
						});
						PubSub.publish("documentChange", { ids: documentIds });
						PubSub.publish("udgrid", {});

						// Remove this contact in stack.
						if (self.fieldEditorHelper.editFieldList &&
							self.fieldEditorHelper.editFieldList.DocumentRelationships &&
							Array.isArray(self.fieldEditorHelper.editFieldList.DocumentRelationships.value) &&
							self.fieldEditorHelper.editFieldList.DocumentRelationships.value.length > 0)
						{
							self.fieldEditorHelper.editFieldList.DocumentRelationships.value =
								self.fieldEditorHelper.editFieldList.DocumentRelationships.value.filter(function(item)
								{
									return item.DocumentID !== documentId;
								});
						}

						self.detailView.pageLevelViewModel.clearError();
						self.detailView.pageLevelViewModel.popupSuccessMessage('The association has been removed.');
					});
			});
	};

	/**
	 * Get the record entity by type and id.
	 * @param {String} gridType
	 * @param {Number} recordId
	 */
	LightGridBlock.prototype.getRecordEntity = function(gridType, recordId)
	{
		var requestUrl,
			typeEndpoint = tf.dataTypeHelper.getEndpoint(gridType),
			idParamName = "id";

		switch (gridType)
		{
			case 'trip':
				requestUrl = pathCombine(tf.api.apiPrefix(), typeEndpoint);
				requestUrl += String.format('?@relationships=all&{0}={1}', idParamName, recordId);
				break;
			case 'document':
				requestUrl = pathCombine(tf.api.apiPrefix(), typeEndpoint);
				requestUrl += String.format('?@relationships=all&@excluded=FileContent&{0}={1}', idParamName, recordId);
				break;
			default:
				requestUrl = pathCombine(tf.api.apiPrefix(), typeEndpoint);
				requestUrl += String.format('?@relationships=all&{0}={1}', idParamName, recordId);
				break;
		}

		return tf.promiseAjax.get(requestUrl).then(function(response)
		{
			return response.Items[0];
		});
	};

	/**
	 * View Commuication History.
	 *
	 * @param {Event} e
	 */
	LightGridBlock.prototype.viewMiniGridCommunicationHistory = function(e)
	{
		var self = this,
			$tr = $(e.target).closest("tr"),
			$grid = $tr.closest(".kendo-grid-container"),
			kendoGrid = $grid.data("kendoGrid"),
			dataItem = kendoGrid.dataItem($tr);
		const options = {
			recordId: dataItem.Id,
			dataType: self.gridType,
			pageLevelViewModel: self.detailView.pageLevelViewModel,
			parentDocument: self
		};

		tf.modalManager.showModal(new TF.Modal.CommunicationHistoryModalViewModel(options));
	};

	/**
	 * Preview on document grid action button.
	 *
	 * @param {Event} e
	 */
	LightGridBlock.prototype.previewMiniGridDocumentFile = function(e)
	{
		var self = this,
			$tr = $(e.target).closest("tr"),
			$grid = $tr.closest(".kendo-grid-container"),
			kendoGrid = $grid.data("kendoGrid"),
			dataItem = kendoGrid.dataItem($tr);

		self.getRecordEntity("document", dataItem.Id).then(function(entity)
		{
			if (entity)
			{
				tf.docFilePreviewHelper.show(entity);
			}
		});
	};

	/**
	 * Update document associations.
	 *
	 * @param {Array} associations
	 */
	LightGridBlock.prototype.updateDocumentAssociationRecordEntity = function(associations)
	{
		var self = this;
		self.fieldEditorHelper.editFieldList['DocumentRelationships'] = {
			relationshipKey: 'DocumentRelationship',
			value: associations.map(function(item)
			{
				return {
					DocumentRelationshipID: 0,
					DBID: tf.datasourceManager.databaseId,
					DocumentID: self.recordId || 0,
					AttachedToID: item.Id,
					AttachedToType: tf.dataTypeHelper.getIdByName(item.Type)
				};
			})
		};

		if (!!self.recordEntity)
		{
			self.updateEntity();
		}
	};

	/**
	 * Update the entity.
	 *
	 * @returns
	 */
	LightGridBlock.prototype.updateEntity = function()
	{
		var self = this,
			dataType = self.gridType;

		return tf.helpers.detailViewHelper._getUniqueValues(dataType).then(function(uniqueObjects)
		{
			return self.fieldEditorHelper.saveEntity(uniqueObjects).then(function(result)
			{
				if (result && result.success)
				{
					self.detailView.onEditRecordSuccess.notify(result.entity);
					self.detailView.obEditing(false);
				}

				return result;
			});
		});
	};

	LightGridBlock.prototype.openTrip = function(e, $target)
	{
		var $target = $target || $(e.currentTarget),
			$tr = $target.closest("tr"),
			$grid = $target.closest(".kendo-grid-container"),
			kendoGrid = $grid.data("kendoGrid"),
			entity = kendoGrid.dataItem($tr),
			docData = TF.Document.DocumentData.RoutingMapInfo.create();
		docData.data = docData.data || {};
		tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "search/trips"),
			{
				data: { idFilter: { IncludeOnly: [entity.TripId] } },
				paramData: { "@relationships": "TripStops" }
			}).then(function(responses)
			{
				var trip = responses.Items[0];
				trip.OpenType = "Edit";
				docData.data.trips = [trip];
				docData.data.tryOpenTrip = true;
				TF.NavigationMenu.addDocument(docData, e);
			});
	};

	LightGridBlock.prototype.unassignStudent = function(e, $target)
	{
		var self = this,
			$target = $target || $(e.currentTarget),
			$tr = $target.closest("tr"),
			$grid = $target.closest(".kendo-grid-container"),
			kendoGrid = $grid.data("kendoGrid"),
			entity = kendoGrid.dataItem($tr);

		tf.promiseBootbox.yesNo("Are you sure you want to unassign the student from \"" + entity.TripName + "\" trip?", "Warning")
			.then(function(res)
			{
				if (!res) return;

				tf.promiseAjax.delete(pathCombine(tf.api.apiPrefixWithoutDatabase(), "StudentSchedules", entity.Id), {
					paramData: { "dbid": tf.datasourceManager.databaseId }
				}).then(function()
				{
					PubSub.publish("studentscheduleChange", { studentId: entity.StudentID, scheduleCount: kendoGrid.dataItems().length });
					self.autoFindSchedule();
				}).catch(function(res)
				{
					TF.showErrorMessageBox(res);
				});
			});
	};

	LightGridBlock.prototype.unassignTrip = function(e, $target)
	{
		$target = $target || $(e.currentTarget);
		let $tr = $target.closest("tr"),
			$grid = $target.closest(".kendo-grid-container"),
			kendoGrid = $grid.data("kendoGrid"),
			entity = kendoGrid.dataItem($tr),
			tripIds = kendoGrid.dataSource.data().map(r => r.Id);

		if (!this.recordEntity)
		{
			let fieldName = LightGridBlock.MINI_GRID_ASSOCIATION_FIELD_NAME["trip"];
			let editFieldList = this.fieldEditorHelper.editFieldList[fieldName];
			if (!editFieldList)
			{
				return;
			}

			var index = editFieldList.value.indexOf(entity.Id);
			if (index > -1)
			{
				editFieldList.value.splice(index, 1);
				let tripIndex = this.detailView.invisibleTrips.findIndex(trip => trip.tripId === entity.Id);
				if (tripIndex > -1)
				{
					this.detailView.invisibleTrips.splice(tripIndex, 1);
				}

				PubSub.publish("tripChange", { Id: 0, tripIds: editFieldList.value, invisibleTrips: this.detailView.invisibleTrips, tripsColors: this.tripsColors });
			}

			return;
		}

		tf.promiseBootbox.yesNo("Do you want to unassign the \"" + entity.Name + "\" trip from this Route?", "Confirmation Message")
			.then((res) =>
			{
				if (!res) return;

				tf.promiseAjax.patch(pathCombine(tf.api.apiPrefix(), "trips"), {
					data: [
						{
							Op: "replace",
							Path: "RouteId",
							Value: null
						}
					],
					paramData: {
						id: entity.Id
					}
				}).then(() =>
				{
					let tripIndex = tripIds.findIndex(r => r == entity.Id);
					delete this.tripsColors[entity.Id];
					if (tripIndex > -1)
					{
						tripIds.splice(tripIndex, 1);
						let invisibleTripIndex = this.detailView.invisibleTrips.findIndex(trip => trip.tripId === entity.Id);
						if (invisibleTripIndex > -1)
						{
							this.detailView.invisibleTrips.splice(invisibleTripIndex, 1);
						}

						PubSub.publish("tripChange", { Id: this.recordEntity.Id, tripIds: tripIds, invisibleTrips: this.detailView.invisibleTrips, tripsColors: this.tripsColors });
					}

					if (this.detailView.parentDocument.gridMap.isShowing())
					{
						this._refreshChangedRouteMapData();
					}
				}).catch((res) =>
				{
					TF.showErrorMessageBox(res);
				});
			});

	};

	LightGridBlock.prototype._refreshChangedRouteMapData = function()
	{
		this.detailView.parentDocument.gridMapHelper.getGridFilterIds(true).then((dataIds) =>
		{
			this.detailView.parentDocument.gridMap.setMapDataChanged(true);
			this.detailView.parentDocument.gridMap.refresh(dataIds);
		});
	}

	LightGridBlock.prototype.deactiveContactSubscription = function(contactEntity)
	{
		if (this.recordEntity && this.recordEntity.LocalId && contactEntity.Email)
		{
			tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "contacts/deactiveSubscription"),
				{
					data: {
						LocalId: this.recordEntity.LocalId,
						Email: contactEntity.Email
					}
				}
			).then(() =>
			{
				tf.promiseBootbox.dialog({
					message: "Stopfinder Subscriptions for Contact [ " + contactEntity.Email + " ] and Student [ " + this.recordEntity.Name + " ] have been disabled.",
					title: "Message",
					closeButton: true,
					buttons: {
						ok: {
							label: "OK",
							className: "tf-btn-black"
						}
					}
				});
			});
		}
	}

	LightGridBlock.prototype.removeAssociationToContact = function(e, $target)
	{
		var self = this,
			$target = $target || $(e.currentTarget),
			$tr = $target.closest("tr"),
			$grid = $target.closest(".kendo-grid-container"),
			kendoGrid = $grid.data("kendoGrid"),
			contactEntity = kendoGrid.dataItem($tr),
			contactName = tf.dataTypeHelper.getEntityName("contact", contactEntity),
			contactId = contactEntity.Id,
			gridName = tf.dataTypeHelper.getDisplayNameByDataType(self.gridType).toLowerCase();

		tf.promiseBootbox.yesNo("Are you sure you want to disassociate this " + gridName + " from \"" + contactName + "\"?", CONFIRMATION_TITLE)
			.then(function(res)
			{
				if (!res) return;
				var tasks = [];
				// delete action is needed only when editing an existing record.
				if (!!self.recordId)
				{
					tasks.push(tf.promiseAjax.delete(pathCombine(tf.api.apiPrefixWithoutDatabase(), "recordcontacts", "removeassociation"), {
						paramData: {
							databaseId: tf.datasourceManager.databaseId,
							contactID: contactId,
							recordID: self.recordId,
							recordTypeID: tf.dataTypeHelper.getId(self.gridType)
						}
					}));
				}

				Promise.all(tasks).then(function(response)
				{
					var contactIds = self.includeIds.filter((id) =>
					{
						return id !== contactId;
					});
					PubSub.publish("contactChange", { ids: contactIds });

					//Remove Contact Subscription
					if (!!contactEntity.IsStopfinder)
					{
						self.deactiveContactSubscription(contactEntity);
					}

					// Remove this contact in stack.
					if (self.fieldEditorHelper.editFieldList &&
						self.fieldEditorHelper.editFieldList.RecordContacts &&
						Array.isArray(self.fieldEditorHelper.editFieldList.RecordContacts.value) &&
						self.fieldEditorHelper.editFieldList.RecordContacts.value.length > 0)
					{
						self.fieldEditorHelper.editFieldList.RecordContacts.value =
							self.fieldEditorHelper.editFieldList.RecordContacts.value.filter(function(item)
							{
								return item.ContactID !== contactId;
							});
					}

					self.detailView.pageLevelViewModel.clearError();
					self.detailView.pageLevelViewModel.popupSuccessMessage('The association has been removed.');
				});
			});
	};

	/**
	 * Get special grid configurations.
	 *
	 * @param {string} gridName
	 * @returns
	 */
	LightGridBlock.prototype.getExtraGridConfigurations = function(gridName, layoutColumnCount)
	{
		let self = this;
		if (self.gridType === "route")
		{
			gridConfigsMap["TripGrid"] = {
				checkPermission: function() { return tf.authManager.isAuthorizedFor("trip", ["edit"]); },
				btnClass: "add-trip",
				btnLabel: "Associate"
			}
		}

		var result = {},
			config = gridConfigsMap[gridName];

		if (config)
		{
			var $btn = $("<div/>", { class: "grid-top-right-button add-event " + config.btnClass, text: config.btnLabel }),
				hasPermission = (typeof config.checkPermission === "function" ? config.checkPermission() : true);

			result = {
				"minWidth": Math.min(layoutColumnCount, 2),
				"titleStyles": {
					"margin-bottom": "15px",
					"top": "15px",
					"position": "relative"
				},
				"topRightButton": (hasPermission && !this.isReadOnly()) ? $btn : $btn.addClass("disabled"),
				"permission": hasPermission
			};
		}

		return result;
	};

	LightGridBlock.prototype.getKendoGridActionColumn = function(gridType)
	{
		var actions = this.kendoGridActions[gridType];
		if (!actions)
		{
			return null;
		}

		var command = [];
		switch (gridType)
		{
			case "contact":
			case "contactinformation":
			case "document":
			case "contactrelationships":
			case "documentrelationships":
				command = [{
					name: "view",
					template: '<a class="k-button k-button-icontext k-grid-view" title="View"></a>',
					click: actions.view
				},
				{
					name: "download",
					template: '<a class="k-button k-button-icontext k-grid-download" title="Download"><span></span>Download</a>',
					click: actions.download
				},
				{
					name: "delete",
					template: '<a class="k-button k-button-icontext k-grid-delete delete-relationship" title="Disassociate"></a>',
					click: actions.delete
				}
				];
				break;
			default:
				break;
		}

		command = command.filter(function(item)
		{
			return actions.hasOwnProperty(item.name);
		});

		// add min width to avoid title "Action" being cut.
		var minWidth = 45,
			columnWidth = Math.max(command.length * 30, minWidth) + "px";

		return {
			command: command,
			FieldName: "Action",
			DisplayName: "Action",
			Width: columnWidth,
			type: "nofilter",
			filterable: false,
			disableSummary: true,
			attributes: {
				class: "text-center"
			}
		};
	};

	LightGridBlock.prototype.getGridColumnsByType = function(type)
	{
		var self = this,
			columns = tf.helpers.kendoGridHelper.getGridColumnsFromDefinitionByType(type),
			actionColumn = self.getKendoGridActionColumn(type);

		if (!!actionColumn)
		{
			columns.push(actionColumn);
		}

		if (Array.isArray(self.options.extraColumns))
		{
			Array.prototype.push.apply(columns, self.options.extraColumns);
		}
		return tf.helpers.kendoGridHelper.getDefinitionLayoutColumns(columns);
	};

	LightGridBlock.prototype.renameColumn = function(gridType, dataItem)
	{
		var renameColumns = null;
		var columns = dataItem.columns;
		switch (gridType)
		{
			case "contactinformation":
				renameColumns = {
					"Name": "FullName"
				}
				break;

		}

		if (renameColumns)
		{
			columns && columns.forEach((val, idx) =>
			{
				if (val && renameColumns.hasOwnProperty(val))
				{
					columns[idx] = renameColumns[val];
				}
			});
		}
		return columns;
	};

	LightGridBlock.prototype.prepareColumnsForDetailGrid = function(gridType, dataItem)
	{
		var self = this,
			columns,
			allColumns = self.getGridColumnsByType(gridType);

		if (self.$el.data("columns") && self.$el.data("columns").length > 0)
		{
			// columns cached from edit mode.
			columns = self.$el.data("columns").map(function(savedColumn)
			{
				var columnName = typeof savedColumn === "string" ? savedColumn : savedColumn.FieldName;
				return allColumns.filter(function(column)
				{
					return column.FieldName === columnName;
				})[0];
			});
		} else if (dataItem.columns && dataItem.columns.length > 0)
		{
			columns = dataItem.columns.map(function(savedColumn)
			{
				var columnName = typeof savedColumn === "string" ? savedColumn : savedColumn.FieldName;
				return allColumns.filter(function(column)
				{
					return column.FieldName === columnName;
				})[0];
			});

			columns = columns.filter(function(c)
			{
				return !!c;
			});
		}  else
		{
			columns = self.getGridColumnsFromAllColumnsByType(allColumns, gridType)
				.map(function(c)
				{
					return $.extend({}, c);
				});
		}

		return columns;
	};

	LightGridBlock.prototype.getGridColumnsFromAllColumnsByType = function(allColumns, type)
	{
		let self = this, columns = allColumns;
		switch (type.toLowerCase())
		{
			case "student":
				columns = allColumns.filter(function(c)
				{
					return ["LocalId", "LastName", "FirstName", "Schoolname", "MailStreet1", "MailCity", "MailState", "MailZip"].includes(c.FieldName);
				});
				break;
			case "document":
				columns = allColumns.filter(function(c)
				{
					return ["Name", "FileName", "Description", "Action"].includes(c.FieldName);
				});
				break;
			case "trip":
				columns = self.getTripGridColumnsFromColumnsByType(allColumns, self.gridType);
				break;
			default:
				columns = allColumns.filter(r => !r.hidden);
				break;
		}

		return columns;
	}

	LightGridBlock.prototype.getTripGridColumnsFromColumnsByType = function(allColumns, parentType)
	{
		let columns = allColumns;
		switch (parentType)
		{
			case "route":
				let defaultColumnsByRoute = ["Name", "SessionName", "StartTime", "FinishTime", "AideName", "DriverName", "VehicleName"];
				columns = columns.filter(r => defaultColumnsByRoute.indexOf(r.FieldName) != -1);
				columns = columns.sort((a, b) => defaultColumnsByRoute.indexOf(a.FieldName) - defaultColumnsByRoute.indexOf(b.FieldName));
				break;
			default:
				columns = allColumns.filter(r => !r.hidden);
				break;
		}

		return columns;
	};

	LightGridBlock.prototype.getContactAssociations = function(contactId, includeDataTypes)
	{
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "contacts", contactId, "contactrelationships"), {
			paramData: {
				"@relationships": includeDataTypes.join(",")
			}
		}).then(function(response)
		{
			response.Items.sort(function(a, b)
			{
				return (a.Type && b.Type && a.Type.localeCompare(b.Type)) ||
					(a.Name && b.Name && a.Name.localeCompare(b.Name));
			});
			return response;
		}).then(function(response)
		{
			return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), 'recordcontacts'), {
				paramData: {
					"databaseID": tf.datasourceManager.databaseId,
					"@filter": `eq(ContactID,${contactId})&eq(DataTypeID,${tf.dataTypeHelper.getIdByName('student')})&eq(IsPrimary,true)`,
					"@fields": "RecordID"
				}
			}).then(function(result)
			{
				let primaryContactIds = result.Items.map(i => i.RecordID);
				if (primaryContactIds.length > 0)
				{
					response.Items.filter(i => i.Type === "Student").forEach(i =>
					{
						if (primaryContactIds.indexOf(i.Id) >= 0)
						{
							i['IsPrimary'] = true;
						}
					})
				}
				return response;
			})
		});
	};

	LightGridBlock.prototype.checkLoadDataPermission = function(dataItem)
	{
		switch (dataItem.field)
		{
			case "ContactGrid":
				return tf.authManager.isAuthorizedForDataType("contact", "read");
			case "DocumentGrid":
				return tf.authManager.isAuthorizedForDataType("document", "read");
			case "ContactAssociationGrid":
			case "DocumentAssociationGrid":
			case "FieldTripHistoryGrid":
			case "FieldTripVehicleGrid":
			case "FieldTripDriverGrid":
			case "FieldTripAideGrid":
			case "FieldTripResourceGrid":
			case "FieldTripInvoiceGrid":
				return tf.authManager.isAuthorizedForDataType("fieldtrip", "read");
			case "StudentScheduleGrid":
			case "StudentCardGrid":
			case "StudentRequirementGrid":
			case "AdditionalRequirementGrid":
				return tf.authManager.isAuthorizedFor("student", "read");
			case "AttendanceGrid": // RW-21544, user need 'Trip Calendar/Attendance Records' permission to visit trip calendar and student attendance grid
			case "CalendarEventsGrid":
				return tf.authManager.isAuthorizedFor("tripCalendarAttendanceRecords", "read");
			case "CommunicationHistoryGrid":
				return tf.authManager.hasMergeEmailMessageAccess('read') && tf.authManager.hasScheduledMergeDocumentAccess('read');
			default:
				return tf.authManager.isAuthorizedForDataType(dataItem.url, "read");
		}
	};

	LightGridBlock.prototype.getIncludeIds = function()
	{
		var self = this;
		var hasPermission = self.checkLoadDataPermission(self.options);
		var isDesignMode = !self.isReadMode();

		if (isDesignMode)
		{
			return Promise.resolve([]);
		}

		if (!self.recordId)
		{
			let whetherGetRelatedData = false;
			if (self.includeIds && self.includeIds.length > 0)
			{
				return Promise.resolve(self.includeIds);
			}

			if (self.gridType == "route" && self.miniGridType == "trip")
			{
				let fieldName = GridBlock.MINI_GRID_ASSOCIATION_FIELD_NAME["trip"];
				let editFieldList = self.fieldEditorHelper.editFieldList[fieldName];
				if (editFieldList && editFieldList.value)
				{
					whetherGetRelatedData = true;
				}
			}

			if (!whetherGetRelatedData)
			{
				let items = self.detailView.newEntityRelationships[self.miniGridType] || [];
				let getItemsAsync = Promise.resolve(items);

				if (self.options.field === "ContactGrid"
					&& self.gridType === "student"
					&& self.detailView.newCopyContext
					&& self.detailView.newCopyContext.baseEntity.Contacts
				)
				{
					items = _.cloneDeep(self.detailView.newCopyContext.baseEntity.Contacts);
				}
				else if (self._isAssociateContacts())
				{
					getItemsAsync = self._prepareAssociateContactData(getItemsAsync);
				}

				return getItemsAsync
					.then(items =>
					{
						var includeIds = (Array.isArray(items) && items.length > 0) ? items.map(function(item)
						{
							return item.Id;
						}) : [-1];
						return includeIds;
					});
			}
		}

		if (!hasPermission)
		{
			return Promise.resolve();
		}

		return self.getGridRelatedData().then(function(includeIds)
		{
			return includeIds;
		});
	}

	LightGridBlock.prototype._setRequestURL = function()
	{
		var self = this;
		var apiPrefix = tf.api.apiPrefix();
		var urlNode = tf.dataTypeHelper.getEndpoint(self.options.url);

		switch (urlNode)
		{
			case "contactinformation":
				urlNode = "contacts";
				break;
			case "communicationhistory":
				urlNode = "mergedocumentssents";
				apiPrefix = tf.api.apiPrefixWithoutDatabase();
				break;
		}

		return pathCombine(apiPrefix, "search", urlNode);
	}

	LightGridBlock.prototype.getDefaultSortItem = function()
	{
		var self = this;
		var sortItemsName = "Id";
		var sortItemsDirction = "Ascending";

		if (self.options.field == "CommunicationHistoryGrid")
		{
			sortItemsName = "SentOn";
			sortItemsDirction = "Descending";
		}
		else if (self.options.url == "tripstop" && self.gridType == "trip")
		{
			sortItemsName = "Sequence";
		}
		else if (self.options.url == "trip" && self.gridType == "route")
		{
			sortItemsName = "StartTime";
		}

		return [{
			Name: sortItemsName,
			isAscending: sortItemsDirction == "Ascending" ? "asc" : "desc",
			Direction: sortItemsDirction
		}]
	}

	LightGridBlock.prototype.getGridRelatedData = function()
	{
		var self = this;
		var dataItem = self.options;
		if (dataItem.getDataSource)
		{
			if (dataItem.getDataSource instanceof Function)
			{
				return Promise.resolve(dataItem.getDataSource.call(self, self.detailView));
			} else
			{
				return Promise.resolve(dataItem.getDataSource);
			}
		}

		var paramData = {},
			urlNode = tf.dataTypeHelper.getEndpoint(dataItem.url);

		switch (dataItem.field)
		{
			case "ContactGrid":
				return tf.helpers.detailViewHelper._getContactIds(self.gridType, self.recordId).then((result) =>
				{
					var includeIds = (Array.isArray(result.Items) && result.Items.length > 0) ? result.Items.map(function(item)
					{
						return item.Id;
					}) : [-1];
					return includeIds;
				});
			case "DocumentGrid":
				var columnFields = ["Id"];
				return tf.helpers.detailViewHelper._getDocumentGridRecords(columnFields, self.gridType, self.recordId).then((result) =>
				{
					var includeIds = (Array.isArray(result.Items) && result.Items.length > 0) ? result.Items.map(function(item)
					{
						return item.Id;
					}) : [-1];
					return includeIds;
				});
			case "StudentScheduleGrid":
				return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "search", "StudentSchedules"), {
					paramData: {
						getCount: false
					},
					data: {
						filterSet: { FilterItems: [{ FieldName: "StudentID", Operator: "EqualTo", Value: self.detailView.recordId }] }
					}
				}).then((result) =>
				{
					var includeIds = (Array.isArray(result.Items) && result.Items.length > 0) ? result.Items.map(function(item)
					{
						return item.Id;
					}) : [-1];
					return includeIds;
				});
			case "AltsiteGrid":
				paramData = {
					"@fields": "Id",
					"studentIds": self.recordId,
					"@filter": "gt(Id,0)"
				};
				return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "AlternateSites"), {
					paramData: paramData
				}).then(function(result)
				{
					var includeIds = (Array.isArray(result.Items) && result.Items.length > 0) ? result.Items.map(function(item)
					{
						return item.Id;
					}) : [-1];
					return includeIds;
				});
			case "AMTripGrid":
			case "PMTripGrid":
			case "AMTransferTripGrid":
			case "PMTransferTripGrid":
			case "AllTripGrid":
			case "AMTripStopGrid":
			case "PMTripStopGrid":
			case "AMTransferTripStopGrid":
			case "PMTransferTripStopGrid":
				paramData = {
					"@fields": dataItem.idField,
					"type": dataItem.tripType,
					"studentid": self.recordId,
					"DBID": tf.datasourceManager.databaseId
				};
				return TF.RelatedDataHelper.getIdsFromStudentSchedulesByStudentId(dataItem.idField, dataItem.tripType, self.recordId)
					.then(function(result)
					{
						return result.length > 0 ? result : [-1];
					});
			case "AllTripStopGrid":
				var p1 = TF.RelatedDataHelper.getIdsFromStudentSchedulesByStudentId("PUStopId", "am", self.recordId),
					p2 = TF.RelatedDataHelper.getIdsFromStudentSchedulesByStudentId("DOStopId", "pm", self.recordId),
					p3 = TF.RelatedDataHelper.getIdsFromStudentSchedulesByStudentId("PUStopId", "amtransfer", self.recordId),
					p4 = TF.RelatedDataHelper.getIdsFromStudentSchedulesByStudentId("DOStopId", "pmtransfer", self.recordId),
					p5 = TF.RelatedDataHelper.getIdsFromStudentSchedulesByStudentId("DOStopId", "shuttle", self.recordId);
				return Promise.all([p1, p2, p3, p4, p5]).then(function(response)
				{
					var includeIds = [];
					response.forEach(result =>
					{
						includeIds = includeIds.concat(result);
					});
					return includeIds.length > 0 ? includeIds : [-1];
				});
			case "CommunicationHistoryGrid":
				return tf.promiseAjax.post(pathCombine(tf.api.apiPrefixWithoutDatabase(), "search", "mergedocumentssents"), {
					data: {
						filterSet: {
							FilterItems: [
								{ FieldName: "RecordID", Operator: "EqualTo", Value: self.recordId },
								{ FieldName: "DBID", Operator: "EqualTo", Value: tf.datasourceManager.databaseId },
								{ FieldName: "DataTypeId", Operator: "EqualTo", Value: tf.dataTypeHelper.getId(self.gridType) }
							],
							LogicalOperator: "and",
							FilterSets: []
						},
					}
				}).then(function(result)
				{
					var includeIds = (Array.isArray(result.Items) && result.Items.length > 0) ? result.Items.map(function(item)
					{
						return item.Id;
					}) : [-1];
					return includeIds;
				});;
			default:
				paramData = {};
				urlNode = tf.dataTypeHelper.getEndpoint(dataItem.url);

				if (urlNode && urlNode.indexOf("fieldtrip") > -1)
				{
					paramData["@filter"] = "eq(FieldTripId," + self.recordId + ")";
					switch (dataItem.field)
					{
						case "FieldTripHistoryGrid":
							paramData["@relationships"] = "UserName";
							break;
						case "FieldTripVehicleGrid":
							paramData["@relationships"] = "Vehicle";
							paramData["@filter"] += `&isnotnull(VehicleId,)`;
							break;
						case "FieldTripDriverGrid":
							paramData["@relationships"] = "Driver";
							paramData["@filter"] += `&isnotnull(DriverId,)`;
							break;
						case "FieldTripAideGrid":
							paramData["@relationships"] = "Aide";
							paramData["@filter"] += `&isnotnull(AideId,)`;
							break;
						case "FieldTripResourceGrid":
							paramData["@relationships"] = "Vehicle,Driver,Aide";
							break;
						case "FieldTripInvoiceGrid":
							paramData["@relationships"] = "FieldTripAccount";
							break;
					}

					return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), urlNode), {
						paramData: paramData
					});
				}

				if (dataItem.url == "tripstop" && self.gridType == "trip")
				{
					paramData["@filter"] = `eq(${tf.dataTypeHelper.getIdParamName(self.gridType)},${self.recordId})`;
				}
				else if (dataItem.url == "trip" && self.gridType == "route")
				{
					if (self.isCreateGridNewRecord)
					{
						let fieldName = GridBlock.MINI_GRID_ASSOCIATION_FIELD_NAME["trip"];
						let selectedIds = self.fieldEditorHelper.editFieldList[fieldName].value.join();
						paramData["@filter"] = `in(Id,${selectedIds})`;
					}
					else
					{
						paramData["@filter"] = `eq(${tf.dataTypeHelper.getIdParamName(self.gridType)},${self.recordId})`;
					}
				}
				else if (dataItem.url == "trip" && self.gridType == "vehicle")
				{
					paramData["@fields"] = "Id";
					paramData["vehicleId"] = self.recordId;
				}
				else
				{
					var dataIdentifier = dataItem.subUrl,
						idsParamName = tf.dataTypeHelper.getIdsParamName(self.gridType);

					paramData["@fields"] = "Id";
					paramData[idsParamName] = self.recordId;
					if (dataIdentifier)
					{
						paramData["type"] = dataIdentifier;
					}
				}

				return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), urlNode), {
					paramData: paramData
				}).then(function(result)
				{
					var includeIds = (Array.isArray(result.Items) && result.Items.length > 0) ? result.Items.map(function(item)
					{
						return item.Id;
					}) : [-1];
					return includeIds;
				});
		}
	};

	LightGridBlock.prototype.editMiniGridRecord = function(miniGridType, e, $target)
	{
		if (this.isReadOnly())
		{
			return;
		}
		var self = this,
			$target = $target || $(e.currentTarget),
			$tr = $target.closest("tr"),
			$grid = $tr.closest(".kendo-grid-container"),
			kendoGrid = $grid.data("kendoGrid"),
			recordId = kendoGrid.dataItem($tr).Id;

		tf.helpers.detailViewHelper.addEditRecordInQuickAddModal(self.$detailView, miniGridType, self.gridType, self.recordEntity,
			recordId, self.detailView.pageLevelViewModel, self.isCreateGridNewRecord);
	};

	/**
	 * Update Grid Footer Information
	 *
	 */
	LightGridBlock.prototype._updateGridFooter = function()
	{
		var self = this;
		var item = self.$el.find(".kendo-grid-container");
		var total = 0;
		var result = 0;
		if (self.isReadMode())
		{
			total = self.grid.dataSource.total();
			result = Array.isArray(self.includeIds) ? self.includeIds.filter(x => x > 0).length : [];
		}

		tf.helpers.miniGridHelper.updateGridFooter(item, total, result);
	}

	/**
	 * Bind contact related events to detail mini grid.
	 *
	 * @param {String} miniGridType
	 * @param {Object} kendoGrid
	 * @returns
	 */
	LightGridBlock.prototype._bindMiniGridEvent = function(miniGridType, $grid)
	{
		// This function firing multiple times on kendoGrid dataBound / dataBinding event.
		var self = this;
		switch (miniGridType)
		{
			case LightGridBlock.MINI_GRID_TYPE.CONTACTINFORMATION:
			case LightGridBlock.MINI_GRID_TYPE.CONTACT:
				$grid.off("dblclick").on("dblclick", ".k-grid-content table tr", function(e)
				{
					self.editMiniGridRecord(LightGridBlock.MINI_GRID_TYPE.CONTACT, e);
				});
				break;
			case LightGridBlock.MINI_GRID_TYPE.DOCUMENT:
				$grid.off("dblclick").on("dblclick", ".k-grid-content table tr", function(e)
				{
					self.editMiniGridRecord(LightGridBlock.MINI_GRID_TYPE.DOCUMENT, e);
				});
				break;
			default:
				break;
		}

	};

	LightGridBlock.prototype._setDefaultStudentRequirementAddable = function()
	{
		if (this.options.url == TF.Helper.KendoGridHelper.studentRequirementItemsUrl)
		{
			var addButton = this.$el.find(".grid-top-right-button");
			var grid = this.$el.find(".kendo-grid-container").data("kendoGrid");
			if (this.isBlockReadOnly() || this.isReadOnly())
			{
				addButton.addClass("disabled");
				return;
			}
			if (grid.dataSource.data().length >= 2)
			{
				addButton.addClass("disabled");
			} else
			{
				addButton.removeClass("disabled");
			}
		}
	};

	LightGridBlock.prototype.getAndCreateNewEntityRelationship = function(name)
	{
		var cache = this.detailView.newEntityRelationships[name] || [];
		this.detailView.newEntityRelationships[name] = cache;
		return cache;
	};

	LightGridBlock.prototype.showStudentRequirementModal = function(requirement, type)
	{
		var self = this,
			isNew = !requirement,
			requirement = requirement || {
				DBID: tf.datasourceManager.databaseId,
				StudentId: self.recordEntity ? self.recordEntity.Id : 0,
				Type: type
			},
			attendanceSchoolCode = requirement.SchoolCode || self.detailView.fieldEditorHelper.editFieldList.SchoolCode,
			options = {
				data: requirement,
				isNew: isNew,
				student: self.recordEntity,
				attendanceSchoolCode: attendanceSchoolCode
			};
		if (!self.recordEntity)
		{
			var defaultRequirment = self.getAndCreateNewEntityRelationship(TF.Helper.KendoGridHelper.studentRequirementItemsUrl);
			var additionalRequirement = self.getAndCreateNewEntityRelationship(TF.Helper.KendoGridHelper.studentAdditionalRequirementUrl);
			options.newEntityDataSource = type === 0 ? defaultRequirment : additionalRequirement;
			options.newEntityDataSource['Type'] = type;
			if (!options.attendanceSchoolCode)
			{
				tf.promiseBootbox.alert("Please input school of attendance. ");
				return;
			}
		}

		// default requirements only can create each type once, so force set the sessionId
		if (options.isNew && (requirement && requirement.Type == TF.StudentRequirementType.default) && self.grid.dataSource.data().length > 0)
		{
			options.sessionId = self.grid.dataSource.data()[0].Session == "To School" ? 1 : 0;
		}

		tf.modalManager.showModal(new TF.DetailView.StudentRequirementModalViewModel(options)).then(function(result)
		{
			if (result == true)
			{
				PubSub.publish(studentRequirementsUrl, {
					StudentId: self.recordEntity ? self.recordEntity.Id : null
				});
				self.autoFindSchedule();
			}

			if (!self.recordEntity) self.detailView.obEditing(true);
		});
	};

	LightGridBlock.prototype.editStudentRequirement = function(grid, e)
	{
		if (this.isReadOnly())
		{
			return;
		}
		var self = this,
			tr = $(e.target).closest("tr"),
			data = grid.dataItem(tr),
			id = data.Id,
			requirementCache = TF.DataModel.StudentRequirementItemModel.getEntity(data);

		if (requirementCache)
		{
			self.showStudentRequirementModal(requirementCache, self.gridBlockType == "StudentRequirementGrid" ? TF.StudentRequirementType.default : TF.StudentRequirementType.additional);
			return;
		}

		tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), studentRequirementsUrl, id)).then(function(result)
		{
			var requirement = result.Items[0];
			self.showStudentRequirementModal(requirement);
		});
	};

	LightGridBlock.prototype.editFieldTripResource = function(grid, e)
	{
		if (this.isReadOnly())
		{
			return;
		}
		var self = this,
			tr = $(e.target).closest("tr"),
			data = grid.dataItem(tr);
		self.showFieldTripResourceModal(data, self.recordId, self.grid);
	};

	LightGridBlock.prototype.showFieldTripResourceModal = function(fieldtripResource, fieldtrip, resourceGrid)
	{
		var self = this,
			isNew = !fieldtripResource,
			options = {
				originalData: fieldtripResource,
				isNew: isNew,
				entity: fieldtripResource,
				fieldtrip: self.recordEntity,
				BillingClassification: self.detailView.fieldEditorHelper.getFieldValue("BillingClassification")
			};

		if (!self.recordEntity)
		{
			var fieldtripresourceDataSource = self.getAndCreateNewEntityRelationship("fieldtripresource");
			options.newEntityDataSource = fieldtripresourceDataSource;
		}

		tf.modalManager.showModal(new TF.DetailView.FieldTripResourceModalViewModel(options, fieldtrip, resourceGrid))
			.then(function(result)
			{
				if (!result)
				{
					return;
				}
				var newRes = self.detailView.fieldEditorHelper.getFieldValue("FieldTripResourceGroups") || [];
				var editedRes = newRes.filter(function(r) { return r.Id === result.Id });
				if (editedRes.length == 0)
				{
					newRes.push(result);
				} else
				{
					$.extend(editedRes[0], result);
				}
				self.fieldEditorHelper.editFieldList["FieldTripResourceGroups"] = {
					value: newRes,
					blockName: "FieldTripResourceGroups"
				}

				if (!self.recordEntity) self.detailView.obEditing(true);
				self.fieldEditorHelper.recalculateFieldTripCosts();
				PubSub.publish("fieldtripresource", {});
			});
	};

	LightGridBlock.prototype.removeFieldTripResource = function(grid, e)
	{
		var self = this,
			tr = $(e.target).closest("tr"),
			data = grid.dataItem(tr),
			id = data.Id;

		if (!self.recordEntity)
		{
			var dataSource = grid.dataSource.data().slice(),
				index = dataSource.indexOf(data) || dataSource.findIndex(function(ele)
				{
					return ele == data;
				});

			if (index > -1)
			{
				dataSource.splice(index, 1);
				self.setEntityRelationship("fieldtripresource", dataSource);
				self.fieldEditorHelper.recalculateFieldTripCosts();
				PubSub.publish("fieldtripresource", {});
			}

			return;
		}

		return tf.promiseBootbox.yesNo("Are you sure you want to delete this record?", "Delete Confirmation")
			.then(function(res)
			{
				if (res)
				{
					return tf.promiseAjax.delete(pathCombine(tf.api.apiPrefix(), "FieldTripResourceGroups"), {
						paramData: {
							'@filter': String.format('eq(id,{0})', id)
						}
					}).then(function(result)
					{
						if (result == 0)
						{
							return;
						}
						var curRes = self.detailView.fieldEditorHelper.getFieldValue("FieldTripResourceGroups") || [];
						_.remove(curRes, function(item)
						{
							return item.Id == id;
						})
						self.fieldEditorHelper.editFieldList["FieldTripResourceGroups"] = {
							value: curRes,
							blockName: "FieldTripResourceGroups"
						}
						self.fieldEditorHelper.recalculateFieldTripCosts();
						PubSub.publish("fieldtripresource", {});
					})
				}
			});
	};

	LightGridBlock.prototype.afterDomAttached = function()
	{
		this.initDetailGrid();
	};

	LightGridBlock.prototype._isAssociateContacts = function()
	{
		return this.detailView &&
			this.detailView.$element &&
			this.detailView.$element.closest('.modal-dialog') &&
			this.detailView.$element.closest('.modal-dialog').find('.panel-heading') &&
			this.detailView.$element.closest('.modal-dialog').find('.panel-heading').text() === 'Associate Contacts';
	}

	LightGridBlock.prototype._prepareAssociateContactData = function(getItemsAsync)
	{
		var self = this;
		if (self.options.field === "ContactAssociationGrid" &&
			self.fieldEditorHelper.editFieldList[GridBlock.MINI_GRID_ASSOCIATION_FIELD_NAME.contact] &&
			self.fieldEditorHelper.editFieldList[GridBlock.MINI_GRID_ASSOCIATION_FIELD_NAME.contact].value)
		{
			const selectedItemKeys = _.cloneDeep(self.fieldEditorHelper.editFieldList[GridBlock.MINI_GRID_ASSOCIATION_FIELD_NAME.contact].value || []);
			getItemsAsync = self._getAssociateData(selectedItemKeys);
		}
		else if (self.options.field === "DocumentGrid" &&
			self.fieldEditorHelper.editFieldList[GridBlock.MINI_GRID_ASSOCIATION_FIELD_NAME.document] &&
			self.fieldEditorHelper.editFieldList[GridBlock.MINI_GRID_ASSOCIATION_FIELD_NAME.document].value)
		{
			const selectedItemKeys = _.cloneDeep(self.fieldEditorHelper.editFieldList[GridBlock.MINI_GRID_ASSOCIATION_FIELD_NAME.document].value || []);
			getItemsAsync = self._updateDocumentGrid(selectedItemKeys, self.options.columns || []);
		}

		return getItemsAsync;
	}

	LightGridBlock.prototype.initDetailGrid = function()
	{
		var self = this,
			isReadMode = self.isReadMode(),
			columns = self.options.columns,
			hasPermission = self.checkLoadDataPermission(self.options),
			summaryConfig = self.miniGridHelper.getSummaryBarConfig(self.$el, self.options);


		columns = self.renameColumn(self.miniGridType, self.options);
		columns = self.prepareColumnsForDetailGrid(self.miniGridType, self.options);
		/**
		 * show/hide columns functionality needs the data
		 */
		self.$el.data("columns", columns);

		if (summaryConfig && summaryConfig["ShowSummaryBar"])
		{
			self.$el.find(".kendo-summarygrid-container").css("display", "block");
		}
		else
		{
			self.$el.find(".kendo-summarygrid-container").css("display", "none");
		}

		var options = {
			gridType: self.gridBlockType,
			gridDefinition: self.miniGridHelper.getKendoColumnsExtend(columns),
			isFieldTripInvoice: self.miniGridType === "fieldtripinvoice",
			displayQuickFilterBar: self.miniGridHelper.getFilterableConfig(self.$el, self.options),
			lockColumnTemplate: self.miniGridHelper.getLockedColumnTemplate(self.$el, self.options),
			gridLayout: summaryConfig,
			defaultSort: self.options.sort,
			defaultFilter: self.miniGridHelper.getFilterConfig(self.$el, self.options),
			isMiniGrid: true, // set the grid to mini grid mode
			showOverlay: false,
			totalCountHidden: self.options.totalCountHidden,
			resizable: true, // enable column resize.
			miniGridEditMode: !isReadMode, // set the miniGrid to Edit mode
			setRequestURL: () =>
			{
				return self._setRequestURL();
			},
			setRequestOption: requestOption =>
			{
				requestOption.data.fields = columns.map(x => x.FieldName);

				if (self.options.field == "DocumentGrid")
				{
					ensureRequiredDocumentFields(requestOption.data.fields);
				}
				else if (self.options.field == "StudentScheduleGrid")
				{
					ensureRequiredScheduleFields(requestOption.data.fields);
				}

				if ((requestOption.data.sortItems || []).length == 0)
				{
					requestOption.data.sortItems = self.getDefaultSortItem();
				}
				return requestOption;
			},
			getAsyncRequestOption: requestOption =>
			{
				return self.getIncludeIds().then((includeIds) =>
				{
					includeIds = [...new Set(includeIds)];
					self.includeIds = includeIds;
					requestOption.data.idFilter = {
						IncludeOnly: includeIds,
						ExcludeAny: []
					};

					if (self.options.field == "ContactGrid" && self.recordId)
					{
						requestOption.data.extendParameter = { RecordId: self.recordId }
					}

					return requestOption;
				})
			},
			onDataBound: function()
			{
				self.grid = self.lightKendoGrid.kendoGrid;
				tf.helpers.kendoGridHelper.setGridOnDemandAction(self.grid, self.onDemandGridActions[self.miniGridType]);
				self._updateGridFooter();
				self._bindMiniGridEvent(self.miniGridType, self.$el.find(".kendo-grid-container"));
				self._setDefaultStudentRequirementAddable();
				switch (self.miniGridType)
				{
					case "document":
						var kendoGrid = self.$el.find(".kendo-grid-container").data("kendoGrid");
						kendoGrid.content.find("tr").each(function(index, el)
						{
							var uid = $(el).data('kendo-uid') || "";
							var data = kendoGrid.dataSource.getByUid(uid);
							if (!data)
							{
								return;
							}

							if (!data.FileName)
							{
								$(el).find(".k-grid-view").addClass("disable");
								$(el).find(".k-grid-download").addClass("disable");
							}

							//if (!self.isPreviewableFile(data.FileName))
							if (!tf.docFilePreviewHelper.isFilePreviewable(data.MimeType))
							{
								$(el).find(".k-grid-view").addClass("disable");
							}
						});
						break;
					default:
						break;
				}

				self.noHeightWhenEmpty(this);
			}
		}

		if (self.miniGridType === "fieldtripinvoice")
		{
			options.afterRenderCallback = function(kendoGrid, dataItems)
			{
				var amount = self.fieldEditorHelper.calculateTotalAmount(dataItems);
				kendoGrid.element.find(".invoice-total-amount").remove();
				kendoGrid.element.append(String.format("<div class=\"invoice-total-amount\">Total Amount: ${0}</div>", amount.toFixed(2)))

			}.bind(self);
		}

		if ([TF.Helper.KendoGridHelper.studentRequirementItemsUrl, TF.Helper.KendoGridHelper.studentAdditionalRequirementUrl, "studentschedule"].indexOf(self.miniGridType) >= 0)
		{
			options.totalCountHidden = true;
			self.pubSubSubscriptions.push(PubSub.subscribe(studentRequirementsUrl, function(key, result)
			{
				if (result.StudentId == (self.recordEntity ? self.recordEntity.Id : null))
				{
					refreshGrid();
				}
			}));
		}

		if (self.miniGridType === "attendancegrids" || self.miniGridType === "communicationhistory")
		{
			options.totalCountHidden = true;
		}

		self.originalGridOptions = options;
		self.originalGridOptions.afterRenderCallback = (kendoGrid, dataItems) =>
		{
			self.addHotLink(self.miniGridType, kendoGrid);
		};
		if (self.miniGridType == "trip" && self.gridType == "route")
		{
			options.lockColumnTemplate = [
				{
					field: "bulk_menu",
					title: "<div></div>",
					width: '30px',
					sortable: false,
					filterable: false,
					locked: true,
					hidden: true, // show column after trips on map loaded 
					template: function(data)
					{
						const color = self.getTripColor(data.Id);
						return `<div class='k-hierarchy-cell' style='display: none}' ><a class='k-icon k-i-expand' style='display:none' aria-label='Expand'></a></div><div class='left-color-icon' style='border-radius:50%;display:block} ;background-color:${color}'></div>`;
					}
				}
			];
		}

		self.$el.find(".kendo-grid-container").html('');
		self.lightKendoGrid = new TF.Grid.KendoGrid(self.$el.find(".kendo-grid-container"), options);
		self.$el.find(".kendo-grid-container").data("lightKendoGrid", self.lightKendoGrid);

		if ([TF.Helper.KendoGridHelper.studentRequirementItemsUrl, TF.Helper.KendoGridHelper.studentAdditionalRequirementUrl].indexOf(self.miniGridType) >= 0)
		{
			grid.tbody.on("dblclick", "tr.k-state-selected", function(e)
			{
				self.editStudentRequirement(grid, e);
			});
		}

		if (self.miniGridType == "fieldtripresource")
		{
			grid.tbody.on("dblclick", "tr.k-state-selected", function(e)
			{
				if (gridConfigsMap["FieldTripResourceGrid"].checkPermission())
				{
					self.editFieldTripResource(grid, e);
				}
			});

			self.pubSubSubscriptions.push(PubSub.subscribe("fieldtripresource", function(key, result)
			{
				refreshGrid();
			}));
		}

		if (self.miniGridType == "fieldtripvehicle" || self.miniGridType == "fieldtripdriver" || self.miniGridType == "fieldtripaide")
		{
			self.pubSubSubscriptions.push(PubSub.subscribe("fieldtripresource", function()
			{
				refreshGrid();
			}));
		}

		if (self.miniGridType == "document")
		{
			self.pubSubSubscriptions.push(PubSub.subscribe("documentChange", function(key, result)
			{
				result?.ids && (self.includeIds = result.ids);
				refreshGrid();
			}));
		}

		if (self.miniGridType == "contactinformation")
		{
			self.pubSubSubscriptions.push(PubSub.subscribe("contactChange", function(key, result)
			{
				result?.ids && (self.includeIds = result.ids);
				refreshGrid();
			}));
		}

		if (self.miniGridType == "fieldtripinvoice")
		{
			grid.tbody.on("dblclick", "tr.k-state-selected", function(e)
			{
				self.addEditFieldTripInvoice(e);
			});

			self.pubSubSubscriptions.push(PubSub.subscribe(FIELD_TRIP_INVOICE_KEY, function(key, result)
			{
				refreshGrid();
			}));
		}

		if (self.miniGridType == "triphistory")
		{
			self.pubSubSubscriptions.push(PubSub.subscribe("tripHistoryChange", function(key, result)
			{
				if (result.tripId == (self.recordEntity ? self.recordEntity.Id : null))
				{
					refreshGrid();
				}
			}));
		}
		else if (self.miniGridType == "studentschedule")
		{
			self.pubSubSubscriptions.push(PubSub.subscribe("studentscheduleChange", function(key, result)
			{
				if (result.studentId == (self.recordEntity ? self.recordEntity.Id : null))
				{
					refreshGrid();
				}
			}));
		}

		if (self.miniGridType == "studenttagids")
		{
			self.pubSubSubscriptions.push(PubSub.subscribe("studentCardChange", function(key, result)
			{
				if (result.StudentId == (self.recordEntity ? self.recordEntity.Id : null))
				{
					refreshGrid();
				}
			}));
		}

		if (self.miniGridType == "trip" && self.gridType == "route")
		{
			self.pubSubSubscriptions.push(PubSub.subscribe("tripChange", function(key, result)
			{
				refreshGrid();
			}));
			self.initChangeTripColor();
		}

		function refreshGrid()
		{
			self.lightKendoGrid.refresh();
		}
	};

	//#region Field Trip Invoice

	LightGridBlock.prototype.addEditFieldTripInvoice = function(event)
	{
		if (this.isReadOnly())
		{
			return;
		}
		var self = this, noMatchedAccountErrorMsg, fetchEligibleAccounts,
			fieldTripFieldEditorHelper = self.fieldEditorHelper,
			isStrictAccountCode = tf.fieldTripConfigsDataHelper.fieldTripConfigs['StrictAcctCodes'],
			$tr = event && event.target ? event.target.closest("tr") : null,
			fieldTripEntity = self.detailView.recordEntity || { Id: 0 },
			dataItem = self.grid.dataItem($tr),
			id = dataItem ? dataItem.Id : undefined,
			fetchInvoice = Promise.resolve(dataItem ? { invoice: dataItem } : { isNew: true, invoice: { FieldTripId: fieldTripEntity.Id } });

		if (isStrictAccountCode)
		{
			noMatchedAccountErrorMsg = "Strict account code is on, no account is available for selected school and dept./activity. Please configure in field trip configurations or change school and dept./activity selection.";
			fetchEligibleAccounts = fieldTripFieldEditorHelper.fetchMatchedAccounts();
		}
		else
		{
			noMatchedAccountErrorMsg = "No account is avilable, please add in field trip configurations.";
			fetchEligibleAccounts = tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "fieldtripaccounts?@fields=Id,Code"))
				.then(function(res)
				{
					return res.Items;
				});
		}

		if (id)
		{
			fetchInvoice = tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "fieldtripinvoices"), {
				paramData: {
					Id: id,
					"@relationships": "FieldTripAccount"
				}
			}).then(function(res)
			{
				return { invoice: $.extend({}, res.Items[0]) };
			});
		}

		Promise.all([fetchInvoice, fetchEligibleAccounts])
			.then(function(res)
			{
				var options = res[0],
					accounts = res[1];

				if (accounts.length === 0)
				{
					return tf.promiseBootbox.alert(noMatchedAccountErrorMsg);
				}

				options.accounts = sortArray(accounts, "Code");
				options.originalItem = dataItem;

				if (!self.recordEntity)
				{
					var invoiceDataSource = self.getAndCreateNewEntityRelationship(FIELD_TRIP_INVOICE_KEY);
					options.newEntityDataSource = invoiceDataSource;
				}

				return tf.modalManager.showModal(new TF.DetailView.FieldTripInvoiceModalViewModel(options));
			})
			.then(function(res)
			{
				if (res)
				{
					self.refreshFieldTripInvoice();
				}
			});
	};

	LightGridBlock.prototype.deleteFieldTripInvoice = function(event)
	{
		var self = this,
			item = self.grid.dataItem(event.target);

		if (!self.recordEntity)
		{
			var dataSource = self.grid.dataSource.data().slice(),
				index = dataSource.indexOf(item) || dataSource.findIndex(function(ele)
				{
					return ele == item;
				});

			if (index > -1)
			{
				dataSource.splice(index, 1);
				self.setEntityRelationship(FIELD_TRIP_INVOICE_KEY, dataSource);
				self.refreshFieldTripInvoice();
			}
		}
		else if (item.Id)
		{
			tf.promiseBootbox.yesNo("Are you sure you want to delete this invoice?", "Confirmation").then(function(r)
			{
				if (!r) return;
				tf.promiseAjax.delete(pathCombine(tf.api.apiPrefix(), "fieldtripinvoices"), {
					paramData: {
						Id: item.Id,
						DBID: tf.datasourceManager.databaseId
					}
				}).then(function()
				{
					self.refreshFieldTripInvoice();
				});
			});
		}
	};

	/**
	 * Refresh field trip invoice grid after modification.
	 *
	 */
	LightGridBlock.prototype.refreshFieldTripInvoice = function()
	{
		var self = this, task = null;

		if (!self.recordEntity)
		{
			var invoices = self.getAndCreateNewEntityRelationship(FIELD_TRIP_INVOICE_KEY);

			PubSub.publish(FIELD_TRIP_INVOICE_KEY, {});

			task = Promise.resolve(invoices);
		}
		else
		{
			task = tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "fieldtrips"), {
				paramData: {
					DBID: tf.datasourceManager.databaseId,
					Id: self.recordEntity.Id,
					"@relationships": "FieldTripInvoice,FieldTripAccount"
				}
			}).then(function(response)
			{
				var invoices = response.Items[0].FieldTripInvoices;

				//self.detailView.onEditRecordSuccess.notify(response.Items[0]);

				// update invoice data in cached record entity
				self.recordEntity.FieldTripInvoices = invoices;

				self.fieldEditorHelper.checkAndUpdateFieldTripInvoiceGridStatus(invoices);

				return invoices;
			});
		}

		task.then(function(invoices)
		{
			// update grid footer
			tf.helpers.kendoGridHelper.setGridDataSource(self.grid, { dataItems: invoices, totalCount: invoices.length }, self.originalGridOptions);

			// update related fields
			self.fieldEditorHelper.updateRelatedFields(FIELD_TRIP_INVOICE_KEY, invoices);
		});
	};

	//#endregion

	/**
	* when noHeightWhenEmpty setting is true, change the grid body height to zero when no record to display
	*/
	LightGridBlock.prototype.noHeightWhenEmpty = function(kendoGrid)
	{
		var self = this;
		if (!self.options.noHeightWhenEmpty)
		{
			return;
		}
		var kendoGridElement = kendoGrid.element,
			gridContent = kendoGridElement.find(".k-grid-content"),
			border = "1px solid #eee";
		kendoGridElement.css("border", "none");
		gridContent.css({ "border-left": border, "border-right": border });
		var maxHeight = kendoGridElement.height() - 67;
		if (kendoGrid.dataSource.data().length == 0)
		{
			gridContent.height(0);
		} else
		{
			var height = kendoGrid.dataSource.data().length * 34;
			if (gridContent.find(".k-virtual-scrollable-wrap").width() < gridContent.find("table").width())
			{
				height += 18;
			}
			gridContent.height(Math.min(maxHeight, height));
		}
	};

	LightGridBlock.prototype.editCalendarEventModal = function(grid, e)
	{
		if (this.isReadOnly())
		{
			return;
		}
		var self = this,
			tr = $(e.target).closest("tr"),
			id = grid.dataItem(tr).Id;
		self.showCalendarEventModal(id).then(function(result)
		{
			if (result)
			{
				self._notifyTripHistoryGridRefresh();
			}
		});
	};

	LightGridBlock.prototype.deleteCalendarEventModal = function(grid, e)
	{
		var self = this;
		tf.promiseBootbox.yesNo("Are you sure you want to delete this record?", "Delete Confirmation")
			.then(function(res)
			{
				if (res)
				{
					var tr = $(e.target).closest("tr"),
						id = grid.dataItem(tr).Id;
					tf.promiseAjax.delete(pathCombine(tf.api.apiPrefix(), tf.dataTypeHelper.getEndpoint(self.options.url)), {
						paramData: {
							id: id
						}
					}).then(function()
					{
						self._notifyTripHistoryGridRefresh();
					});
				}
			});

	};

	LightGridBlock.prototype._notifyTripHistoryGridRefresh = function()
	{
		PubSub.publish("tripHistoryChange", {
			tripId: this.recordEntity.Id
		});
	};

	LightGridBlock.prototype.showCalendarEventModal = function(tripHistoryId)
	{
		var trip = this.recordEntity;
		return tf.modalManager.showModal(new TF.Modal.TripHistoryModalViewModel(trip.Id, trip.Name, tripHistoryId));
	};

	LightGridBlock.prototype.editStudentCardModal = function(grid, e)
	{
		if (this.isReadOnly())
		{
			return;
		}
		var self = this,
			item = self.grid.dataItem(e.target);

		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), tf.dataTypeHelper.getEndpoint(self.options.url)), {
			paramData: {
				id: item.Id
			}
		}).then((res) =>
		{
			if (res && res.Items)
			{
				let options = {
					...res.Items[0] || item,
					type: 'edit',
				};
				if (!self.recordEntity)
				{
					var cardDataSource = self.getAndCreateNewEntityRelationship("studenttagids");
					options.newEntityDataSource = cardDataSource;
				}
				return tf.modalManager.showModal(new TF.DetailView.StudentCardModalViewModel(options)).then((response) =>
				{
					if (!response) return;
					if (!self.recordEntity) this.updateStudentTagIdRecord(response);
					this._notifyStudentCardGridRefresh();
				});
			}
		});
	};

	LightGridBlock.prototype.deleteStudentCardModal = function(grid, e)
	{
		var self = this,
			item = self.grid.dataItem(e.target);
		if (!self.recordEntity)
		{
			var dataSource = self.grid.dataSource.data().slice(),
				index = dataSource.indexOf(item) || dataSource.findIndex(function(ele)
				{
					return ele == item;
				});

			if (index > -1)
			{
				dataSource.splice(index, 1);
				self.setEntityRelationship('studenttagids', dataSource);
				self._notifyStudentCardGridRefresh();
			}
		} else
		{
			tf.promiseBootbox.yesNo("Are you sure you want to delete this record?", "Delete Confirmation")
				.then((res) =>
				{
					if (res)
					{
						var tr = $(e.target).closest("tr"),
							id = grid.dataItem(tr).Id;
						tf.promiseAjax.delete(pathCombine(tf.api.apiPrefix(), tf.dataTypeHelper.getEndpoint(self.options.url)), {
							paramData: {
								id: id
							}
						}).then(() =>
						{
							self._notifyStudentCardGridRefresh();
						});
					}
				});
		}

	};

	LightGridBlock.prototype._notifyStudentCardGridRefresh = function()
	{
		PubSub.publish("studentCardChange", {
			StudentId: this.recordEntity ? this.recordEntity.Id : null
		});
	}

	LightGridBlock.prototype.updateStudentTagIdRecord = function(response)
	{
		var newRes = this.detailView.newEntityRelationships["studenttagids"] || [];
		var editedRes = newRes.filter(function(r) { return r.Id === response.Id });
		if (editedRes.length == 0)
		{
			newRes.push(response);
		} else
		{
			$.extend(editedRes[0], response);
		}
		this.fieldEditorHelper.editFieldList["StudentTagIds"] = {
			value: newRes,
			blockName: "StudentCardGrid",
			relationshipKey: "Card"
		}

	}

	LightGridBlock.prototype.autoFindSchedule = async function()
	{
		if (this.detailView.gridType !== "student") return;
		if (this.detailView.pageType !== "detailview") return;
		let automationSettings = await TF.AutomationHelper.getSetting();
		if (automationSettings && automationSettings.findScheduleforStudent)
		{
			this.detailView.parentDocument.gridViewModel.findStudentScheduleTool.find({
				interactive: true,
				hideRecords: true
			});
		}
	}

	LightGridBlock.prototype.setTripsLoadedOnMap = function(e)
	{
		this.tripLoadedNumber++;
		if (this.detailView.getMapNumber() == this.tripLoadedNumber)
		{
			this.grid.showColumn(this.grid.columns[0]);
			this.tripLoadedNumber = 0;
		}
		this.tripIsLoaded = true;
	};

	LightGridBlock.prototype.getTripColor = function(tripId)
	{
		if (!this.tripsColors)
		{
			this.tripsColors = {};
		}
		if (this.tripsColors && this.tripsColors[tripId])
		{
			return this.tripsColors[tripId];
		}
		const index = Object.keys(this.tripsColors).length;
		if (index >= 0)
		{
			this.tripsColors[tripId] = tf.colorSource[index % tf.colorSource.length].toLowerCase();
			return this.tripsColors[tripId];
		}
		this.tripsColors[tripId] = tf.colorSource[0].toLowerCase();
		return this.tripsColors[tripId];
	};

	LightGridBlock.prototype.initChangeTripColor = function()
	{
		let self = this;
		let colorPickerInput = $("<input type='text' />");
		let inputContainer = $("<div style='position:absolute;opacity:0'></div>");
		inputContainer.append(colorPickerInput);
		colorPickerInput.kendoColorPicker({
			buttons: false,
		});

		this.$el.delegate("div.left-color-icon", "click", (event) =>
		{
			event.preventDefault();
			$(event.target).after(inputContainer);
			var row = $(event.target).closest("tr");
			var dataItem = this.grid.dataItem(row);
			var color = $(event.target).css("background-color");
			var colorPicker = $(colorPickerInput).data("kendoColorPicker");
			colorPicker.color(color);
			colorPicker.open();
			colorPicker.unbind("change").bind("change", (e) =>
			{
				this.tripsColors[dataItem.Id] = e.value;
				$(event.target).css("background-color", e.value);
				changeTripColor(dataItem, e.value);
			});
		});

		function changeTripColor(trip, color)
		{
			PubSub.publish('tripColorChange' + self.detailView.eventNameSpace, { tripId: trip.Id, color: color });
		}
	}

	LightGridBlock.prototype.addTripVisibilityAction = function()
	{
		let self = this;
		if (self.detailView.getMapNumber() > 0)
		{
			let tripVisibilityAction = {
				name: "tripVisibility",
				template: '<a class="k-button k-button-icontext k-grid-show-eye" title="Show Trips"></a>',
				click: function(e)
				{
					if (self.tripIsLoaded)
					{
						self.setTripVisibilityData(this, e.target, $(e.clickTarget));
					}
				},
				mouseover: function(demandContainer, dataItem)
				{
					let eyeBtn = demandContainer.children().eq(0);
					let tripId = dataItem.Id;

					let index = self.detailView.invisibleTrips.findIndex(trip => trip.tripId === tripId);
					if (index > -1)
					{
						eyeBtn.removeClass('k-grid-show-eye');
						eyeBtn.addClass('k-grid-hide-eye');
						eyeBtn.prop('title', 'Show Trips');
					} else
					{
						eyeBtn.removeClass('k-grid-hide-eye');
						eyeBtn.addClass('k-grid-show-eye');
						eyeBtn.prop('title', 'Hide Trips');
					}
				}
			};

			self.onDemandGridActions["trip"].push(tripVisibilityAction);
		}
	}

	LightGridBlock.prototype.setTripVisibilityData = function(e, $target, clickTarget)
	{
		$target = $target || $(e.currentTarget);
		let $tr = $target.closest('tr'),
			$grid = $target.closest('.kendo-grid-container'),
			kendoGrid = $grid.data('kendoGrid'),
			entity = kendoGrid.dataItem($tr);

		if (clickTarget.attr('class').includes('show-eye'))
		{
			clickTarget.removeClass('k-grid-show-eye');
			clickTarget.addClass('k-grid-hide-eye');
			clickTarget.prop('title', 'Show Trips');
			this.detailView.invisibleTrips.push({ tripId: entity.Id });
			PubSub.publish('tripVisibilityChange' + this.detailView.eventNameSpace, { visibility: false, trips: this.detailView.invisibleTrips });
		} else
		{
			if (this.detailView.invisibleTrips)
			{
				clickTarget.removeClass('k-grid-hide-eye');
				clickTarget.addClass('k-grid-show-eye');
				clickTarget.prop('title', 'Hide Trips');

				let index = this.detailView.invisibleTrips.findIndex((trip) => trip.tripId === entity.Id);
				if (index > -1)
				{
					let visibleTrip = this.detailView.invisibleTrips.splice(index, 1);
					PubSub.publish('tripVisibilityChange' + this.detailView.eventNameSpace, { visibility: true, trips: visibleTrip, invisibleTrips: this.detailView.invisibleTrips });
				}
			}
		}
	}

	LightGridBlock.prototype.addHotLink = function(miniGridType, grid)
	{
		const hotLinkConfig = {
			studentschedule: [{ targetGrid: "trip", fields: ["TripName"], }]
		}
		const $table = $(grid.table);
		TF.Grid.GridHotLinkHelper && TF.Grid.GridHotLinkHelper.setHotLink(miniGridType, $table, hotLinkConfig, grid)

	};

	LightGridBlock.prototype.dispose = function()
	{
		var self = this;
		self.detailView.onFieldChange.unsubscribe(self._detailviewFieldChange);
		if (self.pubSubSubscriptions)
		{
			self.pubSubSubscriptions.forEach(function(item)
			{
				PubSub.unsubscribe(item);
			});

			self.pubSubSubscriptions = [];
		}

		var kendoGrid = self.$el.find(".kendo-grid-container").data("kendoGrid");
		if (kendoGrid)
		{
			kendoGrid.destroy();
			self.$el.find(".kendo-grid-container").data('ShortcutExtender')?.dispose();
			self.$el.find(".kendo-grid-container").html("");
		}
		self._restore();

		var summaryGrid = self.$el.find(".kendo-summarygrid-container").data("kendoGrid");
		if (summaryGrid)
		{
			summaryGrid.destroy();
			self.$el.find(".kendo-summarygrid-container").data('ShortcutExtender')?.dispose();
			self.$el.find(".kendo-summarygrid-container").css("height", "0px");
			self.$el.find(".kendo-summarygrid-container").html("");
		}

		self.removeAllFilterContainer();
	};

	LightGridBlock.prototype.removeAllFilterContainer = function(dataType)
	{
		// remove all filter k-list-container by uniqueClassName for better performance
		$(".filter-container-" + this.uniqueClassName).remove();
	};

	/**
	 * Ensure all required fields for document entity type is included in the fields collection
	 * @param {Array} fields 
	 */
	function ensureRequiredDocumentFields(fields)
	{
		var requiredDocumentFields = ['Name', 'FileName', 'MimeType'];
		$.each(requiredDocumentFields, function(_, field)
		{
			if (fields.indexOf(field) < 0) fields.push(field);
		});
	}

	/**
	 * Ensure all required fields for Student Schedule entity type is included in the fields collection
	 * @param {Array} fields 
	 */
	function ensureRequiredScheduleFields(fields)
	{
		var requiredDocumentFields = ['TripId', 'StudentID'];
		$.each(requiredDocumentFields, function(_, field)
		{
			if (fields.indexOf(field) < 0) fields.push(field);
		});
	}

	function sortArray(array, sortField)
	{
		return array.sort(function(a, b)
		{
			if (a[sortField].toUpperCase() === b[sortField].toUpperCase())
			{
				return 0;
			}
			return a[sortField].toUpperCase() > b[sortField].toUpperCase() ? 1 : -1;
		});
	}

})();