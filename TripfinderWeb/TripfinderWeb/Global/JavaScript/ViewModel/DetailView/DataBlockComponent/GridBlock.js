(function()
{
	createNamespace("TF.DetailView.DataBlockComponent").GridBlock = GridBlock;
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

	function GridBlock(options, detailView)
	{
		var self = this;

		TF.DetailView.DataBlockComponent.BaseDataBlock.call(self, detailView);

		self.$element = null;
		self.uniqueClassName = null;
		self.pubSubSubscriptions = [];

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
	GridBlock.prototype = Object.create(TF.DetailView.DataBlockComponent.BaseDataBlock.prototype);

	GridBlock.prototype._detailviewFieldChange = function(e, data)
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
	GridBlock.prototype._restore = function()
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
	};

	GridBlock.prototype._expand = function()
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

	GridBlock.prototype.manageLayout = function()
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

	GridBlock.prototype._fitExpandGridHeight = function()
	{
		this.$innerGrid && this.$innerGrid.css('height', this.$innerGrid.parent().height() - 68);
	};

	GridBlock.prototype._toggleClick = function()
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

	GridBlock.prototype._addExpandButton = function()
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

	GridBlock.prototype._updateResourceGrid = function(FieldTripResources)
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
	GridBlock.prototype._initGridActions = function()
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
				edit: self.editMiniGridRecord.bind(self, GridBlock.MINI_GRID_TYPE.CONTACT),
				delete: self.removeAssociationToContact.bind(self)
			};
			self.kendoGridActions.contactinformation = {
				edit: self.editMiniGridRecord.bind(self, GridBlock.MINI_GRID_TYPE.CONTACT),
				delete: self.removeAssociationToContact.bind(self)
			};
			self.kendoGridActions.contactrelationships = {
				delete: self.removeContactAssociation.bind(self)
			};
			self.kendoGridActions.documentrelationships = {
				delete: self.removeDocumentAssociation.bind(self)
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

	GridBlock.MINI_GRID_TYPE = {
		"CONTACT": "contact",
		"CONTACTINFORMATION": "contactinformation",
		"DOCUMENT": "document",
		"TRIP": "trip",
	};

	GridBlock.MINI_GRID_NAME_DICTIONARY = {
		"contact": "ContactGrid",
		"document": "DocumentGrid",
		"trip": "TripGrid",
	};

	GridBlock.MINI_GRID_ASSOCIATION_FIELD_NAME = {
		"contact": "RecordContacts",
		"document": "DocumentRelationships",
		"trip": "TripIds"
	};

	GridBlock.MINI_GRID_RELATIONSHIP_KEY = {
		"contact": "contactAssociation",
		"document": "DocumentRelationship",
		"trip": "Trip"
	};

	GridBlock.prototype.initElement = function(options)
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
			$kendoGrid = $("<div>", { class: "kendo-grid" });

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

		$itemContent.append($kendoGrid);
		$gridStackItem.append($itemTitleInput, $itemTitleDiv, $itemContent);
		$element.append($gridStackItem);

		self.$el = options.inMultipleGridBlock ? $gridStackItem : $element;
		self.uniqueClassName = uniqueClassName;
		if (self.expandContainer && self.expandContainer.length > 0)
		{
			self._addExpandButton();
		}
	};

	GridBlock.prototype.initEvents = function()
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
						self.manageRecordAssociation(GridBlock.MINI_GRID_TYPE.CONTACT);
					});
					break;
				case "DocumentGrid":
					$btn.on("click.detailView", function()
					{
						self.manageRecordAssociation(GridBlock.MINI_GRID_TYPE.DOCUMENT);
					});
					break;
				case "ContactAssociationGrid":
				case "DocumentAssociationGrid":
					$btn.on("click.detailView", function(e)
					{
						self.addRecordAssociation(e);
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
							self.simpleRecordAssociation(GridBlock.MINI_GRID_TYPE.TRIP);
						});
					}
					break;
				default:
					break;
			}
		}
	};

	GridBlock.prototype.editStudentException = function(e, $target)
	{
		var self = this,
			$target = $target || $(e.currentTarget),
			$tr = $target.closest("tr"),
			entity = $target.closest(".kendo-grid").data("kendoGrid").dataItem($tr);

		return tf.modalManager.showModal(new TF.DetailView.StudentExceptionModalViewModel(self.recordEntity, entity)).then(response =>
		{
			if (!response) return;
			PubSub.publish("studentscheduleChange", { studentId: self.recordEntity ? self.recordEntity.Id : null });
			this.autoFindSchedule();
		});
	};

	/**
	 * Event handler when add association button is clicked.
	 *
	 * @param {Event} e
	 */
	GridBlock.prototype.addRecordAssociation = function(e)
	{
		var self = this,
			$grid = $(e.currentTarget).closest('.grid-stack-item-content').find(".kendo-grid"),
			kendoGrid = $grid.data().kendoGrid,
			fieldName = $grid.closest(".grid-stack-item").data().field,
			selected = !kendoGrid ? [] : kendoGrid.dataSource.data(),
			options = {
				Id: self.recordId,
				selectedData: selected.map(function(item)
				{
					return {
						Id: item.Id,
						Name: item.Name,
						DataType: item.Type,
						IsPrimary: item.IsPrimary
					};
				}),
				gridType: self.gridType,
			};

		tf.modalManager.showModal(new TF.DetailView.AssociateRecordsModalViewModel(options)).then(function(result)
		{
			if (!result) return;

			var selected = result.data;
			self.updateAllGridsDataSource(fieldName, selected);
			if (fieldName === "ContactAssociationGrid")
			{
				self.updateContactAssociationRecordEntity(selected);
			}
			else if (fieldName === "DocumentAssociationGrid")
			{
				self.updateDocumentAssociationRecordEntity(selected);
			}
		});
	};

	GridBlock.prototype.updateAllGridsDataSource = function(fieldName, dataSource)
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

	GridBlock.prototype.updateAllContactGridsDataSource = function(dataType, fieldName)
	{
		var self = this,
			grids = tf.helpers.detailViewHelper.getAllGridsAndColumns(self.$detailView, fieldName)["grids"];

		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), 'contacts'), {
			paramData: {
				dataType: dataType,
				recordIds: self.recordId
			}
		}).then(function(response)
		{
			if (response && response.Items)
			{
				response.Items.forEach(item =>
				{
					var udfs = item.UserDefinedFields;
					if (udfs && udfs.length)
					{
						udfs.forEach(udf =>
						{
							item[udf.Guid] = udf.RecordValue;
						});
					}
				});
			}

			$.each(grids, function(_, item)
			{
				var $item = $(item);
				$item.data("kendoGrid").dataSource.data(response.Items);
				tf.helpers.kendoGridHelper.updateGridFooter($item, response.FilteredRecordCount, response.FilteredRecordCount);
			});
		})
	};

	GridBlock.prototype.removeStudentRequirement = function(grid, e, type)
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

											var studentScheduleGrid = $(".grid-stack-item-content[data-block-field-name='StudentScheduleGrid']").find(".kendo-grid"),
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

	GridBlock.prototype.getAllAffected = function(requirement)
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

	GridBlock.prototype.setEntityRelationship = function(name, value)
	{
		this.detailView.newEntityRelationships[name] = value;
	};

	GridBlock.prototype.getMiniGridSelectedRecords = function(miniGridType)
	{
		var self = this,
			records = [],
			kendoGrids = self.getMiniGrid(miniGridType);
		kendoGrids.forEach(function(kendoGrid)
		{
			records = kendoGrid.dataSource.data().slice();
		});

		return records;
	};

	GridBlock.prototype.getMiniGrid = function(miniGridType)
	{
		var self = this,
			gridName = GridBlock.MINI_GRID_NAME_DICTIONARY[miniGridType],
			kendoGrids = [],
			fieldData, $item;

		self.$detailView.find(".kendo-grid")
			.each(function(_, item)
			{
				$item = $(item);
				fieldData = $item.closest(".grid-stack-item").data();
				if (fieldData &&
					fieldData.field === gridName)
				{
					var kendoGrid = $item.data("kendoGrid");
					kendoGrids.push(kendoGrid);
				}
			});

		return kendoGrids;
	};

	function isAssociationChanged(selectedData, response)
	{
		return response.isNewRecordCreated || !_.isEqual(selectedData.map(d => d.Id), response.selectedIds);
	}

	GridBlock.prototype.manageRecordAssociation = function(associationType)
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
										if (self.gridBlockType == "ContactGrid" && self.recordId != null)
										{
											self.updateAllContactGridsDataSource(tf.dataTypeHelper.getNameByType(self.gridType), "ContactGrid");
										}
										if (res && res[1])
										{
											PubSub.publish("udgrid", {});
										}
										self.detailView.pageLevelViewModel.popupSuccessMessage("The updates have been saved successfully.");
										tf.helpers.detailViewHelper.updateAllGridsDataSourceByIds(associationType, selectedIds, selectedIds.length, self.$detailView);
									});
								}
								else return;
							})
						}
					}
				});
		});
	};

	GridBlock.prototype.simpleRecordAssociation = function(associationType)
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

	GridBlock.prototype.updateAssociationEditList = function(miniGridType, recordIds)
	{
		if (this.isReadOnly())
		{
			return;
		}
		var self = this,
			recordType = self.gridType,
			recordId = (!self.isCreateGridNewRecord && self.recordEntity) ? self.recordEntity.Id : 0,
			fieldName = GridBlock.MINI_GRID_ASSOCIATION_FIELD_NAME[miniGridType],
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
					relationshipKey: GridBlock.MINI_GRID_RELATIONSHIP_KEY[miniGridType],
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

	GridBlock.prototype.downloadMiniGridDocumentFile = function(e)
	{
		var self = this,
			$tr = $(e.target).closest("tr"),
			$grid = $tr.closest(".kendo-grid"),
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
	GridBlock.prototype.removeAssociationToDocument = function(e)
	{
		var self = this,
			$target = $(e.currentTarget),
			$tr = $target.closest("tr"),
			$grid = $target.closest(".kendo-grid"),
			kendoGrid = $grid.data("kendoGrid"),
			documentEntity = kendoGrid.dataItem($tr),
			documentId = documentEntity.Id,
			gridName = tf.dataTypeHelper.getFormalDataTypeName(self.gridType).toLowerCase();

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
						self.fieldEditorHelper.editFieldList.UDGrids.forEach(udGrid =>
						{
							udGrid.UDGridRecordsValues.forEach(udGridRecord =>
							{
								_.remove(udGridRecord.DocumentUDGridRecords, documentUDGridRecord => documentId == documentUDGridRecord.DocumentID);
							});
						});

						return Promise.resolve(true);
					}

					return tf.udgHelper.updateAssociateDocuments(self.recordId, tf.dataTypeHelper.getId(self.gridType), [documentId])
				}).then
					(function(response)
					{
						tf.helpers.detailViewHelper.removeFromAllGridsDataSourceByIds(self.$detailView, "document", [documentId]);
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
	GridBlock.prototype.getRecordEntity = function(gridType, recordId)
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
	GridBlock.prototype.viewMiniGridCommunicationHistory = function(e)
	{
		var self = this,
			$tr = $(e.target).closest("tr"),
			$grid = $tr.closest(".kendo-grid"),
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
	GridBlock.prototype.previewMiniGridDocumentFile = function(e)
	{
		var self = this,
			$tr = $(e.target).closest("tr"),
			$grid = $tr.closest(".kendo-grid"),
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
	GridBlock.prototype.updateDocumentAssociationRecordEntity = function(associations)
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
	 * Remove document association on document detail view.
	 *
	 * @param {Event} e
	 */
	GridBlock.prototype.removeDocumentAssociation = function(e)
	{
		var self = this,
			$tr = $(e.target).closest("tr"),
			kendoGrid = $tr.closest(".kendo-grid").data("kendoGrid"),
			recordEntity = kendoGrid.dataItem($tr[0]);

		tf.promiseBootbox.yesNo("Are you sure you want to disassociate this document from \"" + recordEntity.Name + "\"?", CONFIRMATION_TITLE)
			.then(function(res)
			{
				if (!res) return;

				tf.dataTypeHelper.getAssociationTotalCount("document")
					.then(function(totalCount)
					{
						tf.helpers.detailViewHelper.removeFromAllGridsDataSourceByIds(self.$detailView, "documentassociation", [recordEntity.Id], totalCount);

						var data = kendoGrid.dataSource.data();
						var associations = data.map(function(item)
						{
							return {
								Id: item.Id,
								Type: item.Type
							}
						});

						self.updateDocumentAssociationRecordEntity(associations);
					});
			});
	};

	/**
	 * Remove a contact association on contact detail view.
	 *
	 * @param {Event} e
	 */
	GridBlock.prototype.removeContactAssociation = function(e)
	{
		var self = this,
			$tr = $(e.target).closest("tr"),
			kendoGrid = $tr.closest(".kendo-grid").data("kendoGrid"),
			recordEntity = kendoGrid.dataItem($tr[0]);

		tf.promiseBootbox.yesNo("Are you sure you want to disassociate this contact from \"" + recordEntity.Name + "\"?", CONFIRMATION_TITLE)
			.then(function(res)
			{
				if (!res) return;

				tf.dataTypeHelper.getAssociationTotalCount("contact")
					.then(function(totalCount)
					{
						if (!!recordEntity.IsStopfinder && recordEntity.Type && recordEntity.Type === "Student")
						{
							self.getRecordEntity("student", recordEntity.Id).then(function(entity)
							{
								if (entity && entity.LocalId)
								{
									self.recordEntity.LocalId = entity.LocalId;
									self.deactiveContactSubscription(self.recordEntity);
								}
							});
						}

						tf.helpers.detailViewHelper.removeFromAllGridsDataSourceByIds(self.$detailView, "contactassociation", [recordEntity.Id], totalCount);

						var data = kendoGrid.dataSource.data();
						var associations = data.map(function(item)
						{
							return {
								Id: item.Id,
								Type: item.Type,
								IsPrimary: item.IsPrimary
							}
						});

						self.updateContactAssociationRecordEntity(associations);
					});
			});
	};

	/**
	 * Update contact associations.
	 *
	 * @param {Array} associations
	 */
	GridBlock.prototype.updateContactAssociationRecordEntity = function(associations)
	{
		var self = this;
		self.fieldEditorHelper.editFieldList['RecordContacts'] = {
			relationshipKey: 'contactAssociation',
			value: associations.map(function(item)
			{
				return {
					DataTypeId: tf.dataTypeHelper.getIdByName(item.Type),
					DBID: tf.datasourceManager.databaseId,
					RecordID: item.Id,
					ContactID: self.recordId || 0,
					IsPrimary: item.IsPrimary
				};
			})
		};

		if (!!self.recordEntity)
		{
			self.detailView.updateEntity();
		}
	};

	/**
	 * Update the entity.
	 *
	 * @returns
	 */
	GridBlock.prototype.updateEntity = function()
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

	GridBlock.prototype.openTrip = function(e, $target)
	{
		var $target = $target || $(e.currentTarget),
			$tr = $target.closest("tr"),
			$grid = $target.closest(".kendo-grid"),
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

	GridBlock.prototype.unassignStudent = function(e, $target)
	{
		var self = this,
			$target = $target || $(e.currentTarget),
			$tr = $target.closest("tr"),
			$grid = $target.closest(".kendo-grid"),
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

	GridBlock.prototype.unassignTrip = function(e, $target)
	{
		$target = $target || $(e.currentTarget);
		let $tr = $target.closest("tr"),
			$grid = $target.closest(".kendo-grid"),
			kendoGrid = $grid.data("kendoGrid"),
			entity = kendoGrid.dataItem($tr),
			tripIds = kendoGrid.dataSource.data().map(r => r.Id);

		if (!this.recordEntity)
		{
			let fieldName = GridBlock.MINI_GRID_ASSOCIATION_FIELD_NAME["trip"];
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

	GridBlock.prototype._refreshChangedRouteMapData = function()
	{
		this.detailView.parentDocument.gridMapHelper.getGridFilterIds(true).then((dataIds) =>
		{
			this.detailView.parentDocument.gridMap.setMapDataChanged(true);
			this.detailView.parentDocument.gridMap.refresh(dataIds);
		});
	}

	GridBlock.prototype.deactiveContactSubscription = function(contactEntity)
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

	GridBlock.prototype.removeAssociationToContact = function(e, $target)
	{
		var self = this,
			$target = $target || $(e.currentTarget),
			$tr = $target.closest("tr"),
			$grid = $target.closest(".kendo-grid"),
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
					tf.helpers.detailViewHelper.removeFromAllGridsDataSourceByIds(self.$detailView, "contact", [contactEntity.Id]);

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
	GridBlock.prototype.getExtraGridConfigurations = function(gridName, layoutColumnCount)
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

	GridBlock.prototype.getKendoGridActionColumn = function(gridType)
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
			attributes: {
				class: "text-center"
			}
		};
	};

	GridBlock.prototype.getGridColumnsByType = function(type)
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

	GridBlock.prototype.prepareColumnsForDetailGrid = function(gridType, dataItem)
	{
		var self = this,
			columns,
			allColumns = self.getGridColumnsByType(gridType);

		if (dataItem.columns && dataItem.columns.length > 0)
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
		} else if (gridType === "document")
		{
			columns = allColumns.filter(function(c)
			{
				return ["Name", "FileName", "Description", "Action"].indexOf(c.FieldName) > -1;
			});
		} else
		{
			columns = self.getGridColumnsFromAllColumnsByType(allColumns, gridType)
				.map(function(c)
				{
					return $.extend({}, c);
				});
		}

		return columns;
	};

	GridBlock.prototype.getGridColumnsFromAllColumnsByType = function(allColumns, type)
	{
		let self = this, columns = allColumns;
		switch (type.toLowerCase())
		{
			case "trip":
				columns = self.getTripGridColumnsFromColumnsByType(allColumns, self.gridType);
				break;
			default:
				allColumns.filter(r => !r.hidden);
				break;
		}

		return columns;
	}

	GridBlock.prototype.getTripGridColumnsFromColumnsByType = function(allColumns, parentType)
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
				allColumns.filter(r => !r.hidden);
				break;
		}

		return columns;
	};

	GridBlock.prototype.getContactAssociations = function(contactId, includeDataTypes)
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

	GridBlock.prototype.getDocumentAssociations = function(documentId, includeDataTypes)
	{
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "DocumentRelationshipRecords"), {
			paramData: {
				"documentId": documentId,
				"dbid": tf.datasourceManager.databaseId,
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
		});
	};

	GridBlock.prototype.checkLoadDataPermission = function(dataItem)
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

	GridBlock.prototype.getGridRelatedData = function(dataItem, columns)
	{
		var self = this;
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

		var columnFields = columns.filter(x => x.FieldName).map(function(column)
		{
			return column.FieldName;
		}),
			paramData = {},
			urlNode = tf.dataTypeHelper.getEndpoint(dataItem.url),
			idParamName = tf.dataTypeHelper.getIdParamName(self.gridType);

		switch (dataItem.field)
		{
			case "ContactGrid":
				return tf.helpers.detailViewHelper._getContactGridRecords(self.gridType, self.recordId);
			case "DocumentGrid":
				ensureRequiredDocumentFields(columnFields);
				return tf.helpers.detailViewHelper._getDocumentGridRecords(columnFields, self.gridType, self.recordId);
			case "ContactAssociationGrid":
				var includeDataTypes = tf.dataTypeHelper.getAvailableContactAssociationGridDataTypes()
					.map(function(item)
					{
						return item.name.replace(/ /g, "");
					});

				return tf.dataTypeHelper.getAssociationTotalCount("contact").then(function(totalCount)
				{
					return self.getContactAssociations(self.recordId, includeDataTypes).then(function(response)
					{
						response.TotalRecordCount = totalCount;
						return response;
					});
				});
			case "DocumentAssociationGrid":
				var includeDataTypes = tf.dataTypeHelper.getAvailableDocumentAssociationGridDataTypes()
					.map(function(item)
					{
						return item.name.replace(/ /g, "");
					});

				return tf.dataTypeHelper.getAssociationTotalCount("document").then(function(totalCount)
				{
					return self.getDocumentAssociations(self.recordId, includeDataTypes).then(function(response)
					{
						response.TotalRecordCount = totalCount;
						return response;
					});
				});
			case "StudentRequirementGrid":
				paramData[idParamName] = self.recordId;
				paramData.DBID = tf.datasourceManager.databaseId;
				paramData.Type = 0;
				return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), urlNode), {
					paramData: paramData
				});
			case "AdditionalRequirementGrid":
				paramData[idParamName] = self.recordId;
				paramData.DBID = tf.datasourceManager.databaseId;
				paramData.Type = 1;
				return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "studentrequirementitems"), {
					paramData: paramData
				});
			case "CalendarEventsGrid":
				return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), urlNode), {
					paramData: {
						tripId: self.recordId
					}
				});
			case "StudentScheduleGrid":
				return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "search", "StudentSchedules"), {
					paramData: {
						getCount: false
					},
					data: {
						filterSet: { FilterItems: [{ FieldName: "StudentID", Operator: "EqualTo", Value: self.detailView.recordId }] }
					}
				});
			case "StudentCardGrid":
				return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), urlNode), {
					paramData: {
						dbid: tf.datasourceManager.databaseId,
						StudentId: self.recordId,
						"@sort": "StartDate|desc"
					}
				});
			case "AttendanceGrid":
				return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), urlNode), {
					paramData: {
						databaseId: tf.datasourceManager.databaseId,
						studentId: self.recordId
					}
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
					if (columnFields.indexOf("Id") === -1)
					{
						columnFields.push("Id");
					}

					var includeIds = (Array.isArray(result.Items) && result.Items.length > 0) ? result.Items.map(function(item)
					{
						return item.Id;
					}) : [-1];
					return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "search", urlNode), {
						data: {
							fields: columnFields,
							filterClause: "",
							filterSet: null,
							idFilter: {
								IncludeOnly: includeIds,
								ExcludeAny: []
							},
							sortItems: [{
								Name: "Id",
								isAscending: "asc",
								Direction: "Ascending"
							}]
						}
					});
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
						if (columnFields.indexOf("Id") === -1)
						{
							columnFields.push("Id");
						}

						return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "search", urlNode), {
							data: {
								fields: columnFields,
								filterClause: "",
								filterSet: null,
								idFilter: {
									IncludeOnly: result.length > 0 ? result : [-1],
									ExcludeAny: []
								},
								sortItems: [{
									Name: "Id",
									isAscending: "asc",
									Direction: "Ascending"
								}]
							}
						});
					});
			case "AllTripStopGrid":
				var p1 = TF.RelatedDataHelper.getIdsFromStudentSchedulesByStudentId("PUStopId", "am", self.recordId),
					p2 = TF.RelatedDataHelper.getIdsFromStudentSchedulesByStudentId("DOStopId", "pm", self.recordId),
					p3 = TF.RelatedDataHelper.getIdsFromStudentSchedulesByStudentId("PUStopId", "amtransfer", self.recordId),
					p4 = TF.RelatedDataHelper.getIdsFromStudentSchedulesByStudentId("DOStopId", "pmtransfer", self.recordId),
					p5 = TF.RelatedDataHelper.getIdsFromStudentSchedulesByStudentId("DOStopId", "shuttle", self.recordId);
				return Promise.all([p1, p2, p3, p4, p5]).then(function(response)
				{
					if (columnFields.indexOf("Id") === -1)
					{
						columnFields.push("Id");
					}

					var includeIds = [];
					response.forEach(result =>
					{
						includeIds = includeIds.concat(result);
					});
					return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "search", urlNode), {
						data: {
							fields: columnFields,
							filterClause: "",
							filterSet: null,
							idFilter: {
								IncludeOnly: includeIds.length > 0 ? includeIds : [-1],
								ExcludeAny: []
							},
							sortItems: [{
								Name: "Id",
								isAscending: "asc",
								Direction: "Ascending"
							}]
						}
					});
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
						sortItems: [{
							Name: "SentOn",
							isAscending: "desc",
							Direction: "Descending"
						}]
					}
				});
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

				var sortItemsName = "Id";
				if (dataItem.url == "tripstop" && self.gridType == "trip")
				{
					paramData["@filter"] = `eq(${tf.dataTypeHelper.getIdParamName(self.gridType)},${self.recordId})`;
					sortItemsName = "Sequence";
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

					sortItemsName = "StartTime";
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
					if (columnFields.indexOf("Id") === -1)
					{
						columnFields.push("Id");
					}

					var includeIds = (Array.isArray(result.Items) && result.Items.length > 0) ? result.Items.map(function(item)
					{
						return item.Id;
					}) : [-1];
					return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "search", urlNode), {
						data: {
							fields: columnFields,
							filterClause: "",
							filterSet: null,
							idFilter: {
								IncludeOnly: includeIds,
								ExcludeAny: []
							},
							sortItems: [{
								Name: sortItemsName,
								isAscending: "asc",
								Direction: "Ascending"
							}]
						}
					});
				});
		}
	};

	GridBlock.prototype.getContactGridTotalCount = function()
	{
		var self = this;
		return tf.helpers.detailViewHelper._getContactGridRecords(self.gridType, self.recordId).then(function(response)
		{
			return response.TotalRecordCount;
		});
	};

	GridBlock.prototype.editMiniGridRecord = function(miniGridType, e, $target)
	{
		if (this.isReadOnly())
		{
			return;
		}
		var self = this,
			$target = $target || $(e.currentTarget),
			$tr = $target.closest("tr"),
			$grid = $tr.closest(".kendo-grid"),
			kendoGrid = $grid.data("kendoGrid"),
			recordId = kendoGrid.dataItem($tr).Id;

		tf.helpers.detailViewHelper.addEditRecordInQuickAddModal(self.$detailView, miniGridType, self.gridType, self.recordEntity,
			recordId, self.detailView.pageLevelViewModel, self.isCreateGridNewRecord);
	};

	/**
	 * Bind contact related events to detail mini grid.
	 *
	 * @param {String} miniGridType
	 * @param {Object} kendoGrid
	 * @returns
	 */
	GridBlock.prototype._bindMiniGridEvent = function(miniGridType, $grid)
	{
		// This function firing multiple times on kendoGrid dataBound / dataBinding event.
		var self = this;
		switch (miniGridType)
		{
			case GridBlock.MINI_GRID_TYPE.CONTACTINFORMATION:
			case GridBlock.MINI_GRID_TYPE.CONTACT:
				$grid.off("dblclick").on("dblclick", ".k-grid-content table tr", function(e)
				{
					self.editMiniGridRecord(GridBlock.MINI_GRID_TYPE.CONTACT, e);
				});
				break;
			case GridBlock.MINI_GRID_TYPE.DOCUMENT:
				$grid.off("dblclick").on("dblclick", ".k-grid-content table tr", function(e)
				{
					self.editMiniGridRecord(GridBlock.MINI_GRID_TYPE.DOCUMENT, e);
				});
				break;
			default:
				break;
		}

	};

	GridBlock.prototype._setDefaultStudentRequirementAddable = function()
	{
		if (this.options.url == TF.Helper.KendoGridHelper.studentRequirementItemsUrl)
		{
			var addButton = this.$el.find(ADD_BUTTON_CLASS_NAME);
			var grid = this.$el.find(".kendo-grid").data("kendoGrid");
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

	GridBlock.prototype.getAndCreateNewEntityRelationship = function(name)
	{
		var cache = this.detailView.newEntityRelationships[name] || [];
		this.detailView.newEntityRelationships[name] = cache;
		return cache;
	};

	GridBlock.prototype.showStudentRequirementModal = function(requirement, type)
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

	GridBlock.prototype.editStudentRequirement = function(grid, e)
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

	GridBlock.prototype.editFieldTripResource = function(grid, e)
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

	GridBlock.prototype.showFieldTripResourceModal = function(fieldtripResource, fieldtrip, resourceGrid)
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

	GridBlock.prototype.removeFieldTripResource = function(grid, e)
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

	GridBlock.prototype.afterDomAttached = function()
	{
		this.initDetailGrid();
	};

	GridBlock.prototype._getAssociateData = function(selectedItemKeys)
	{
		if (!selectedItemKeys || selectedItemKeys.length === 0)
		{
			return Promise.resolve([]);
		}

		const groupByType = (selectedItemKeys) =>
		{
			const groupedItems = {};
			selectedItemKeys.forEach((i) =>
			{
				if (!groupedItems[i.DataTypeId])
				{
					groupedItems[i.DataTypeId] = [];
				}

				groupedItems[i.DataTypeId].push(i.RecordID);
			});

			return groupedItems;
		}
		const convertToEntity = (selectedItemKeys) =>
		{
			let getRelatedContacts = [];
			const groupedItems = groupByType(selectedItemKeys);
			Object.keys(groupedItems).forEach((dataTypeId) =>
			{
				const dataTypeName = tf.dataTypeHelper.getNameById(Number.parseInt(dataTypeId));
				const dataType = tf.dataTypeHelper.getKeyById(Number.parseInt(dataTypeId));
				const url = pathCombine(tf.api.apiPrefix(), "search", tf.dataTypeHelper.getEndpoint(dataType));
				let fields = TF.DetailView.AssociateRecordsViewModel.prototype.getNecessaryFieldsByDataType({ dataType: dataType });
				fields.push("Id");
				const params = {
					"idFilter": {
						"IncludeOnly": groupedItems[dataTypeId],
						"ExcludeAny": [],
					},
					"filterSet": null,
					"fields": fields
				}
				getRelatedContacts.push(
					tf.promiseAjax.post(url, { data: params }).then((ret) =>
					{
						ret.Items.forEach(i =>
						{
							i.Type = dataTypeName;
							i.DataTypeId = dataTypeId;
							i.Name = TF.DetailView.AssociateRecordsViewModel.prototype._getNameByDataType(dataTypeName, i);
							i.RecordID = i.Id;
						})
						return ret.Items;
					})
				);
			});

			return getRelatedContacts;
		}

		return Promise.all(convertToEntity(selectedItemKeys))
			.then(results =>
			{
				let result = [];
				results.forEach(r =>
				{
					if (r && r.length > 0)
					{
						result = result.concat(r);
					}
				});

				return result;
			});
	};

	GridBlock.prototype._updateDocumentGrid = function(selectedItemKeys, fields)
	{
		if (!selectedItemKeys || selectedItemKeys.length === 0)
		{
			return Promise.resolve([]);
		}

		const keys = selectedItemKeys.map(s => s.DocumentID);
		const url = pathCombine(tf.api.apiPrefix(), "search", "documents");
		fields = fields.push['Id'];
		const params = {
			"idFilter": {
				"IncludeOnly": keys,
				"ExcludeAny": [],
			},
			"filterSet": null,
			"fields": fields
		}

		return tf.promiseAjax.post(url, { data: params })
			.then((ret) =>
			{
				return (ret && ret.Items) ? ret.Items : [];
			});
	}

	GridBlock.prototype._isAssociateContacts = function()
	{
		return this.detailView &&
			this.detailView.$element &&
			this.detailView.$element.closest('.modal-dialog') &&
			this.detailView.$element.closest('.modal-dialog').find('.panel-heading') &&
			this.detailView.$element.closest('.modal-dialog').find('.panel-heading').text() === 'Associate Contacts';
	}

	GridBlock.prototype._prepareAssociateContactData = function(getItemsAsync)
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

	GridBlock.prototype.initDetailGrid = function()
	{
		var self = this,
			isReadMode = self.isReadMode(),
			columns = self.prepareColumnsForDetailGrid(self.miniGridType, self.options),
			hasPermission = self.checkLoadDataPermission(self.options);

		/**
		 * show/hide columns functionality needs the data
		 */
		self.$el.data("columns", columns);

		var getDataSource = function()
		{
			if (!isReadMode)
			{
				return Promise.resolve();
			}

			if (!self.recordId)
			{
				let whetherGetRelatedData = false;
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
							return {
								dataItems: items,
								totalCount: items.length,
								pageSize: 50
							};
						});
				}
			}

			if (!hasPermission)
			{
				return Promise.resolve();
			}

			return self.getGridRelatedData(self.options, columns.map(function(c)
			{
				var column = $.extend(true, {}, c);
				column.FieldName = tf.UDFDefinition.getOriginalName(c.FieldName);
				return column;
			})).then(function(response)
			{
				var udfs = columns.filter(function(c)
				{
					return tf.UDFDefinition.isUDF(c.FieldName);
				});

				if (response && response.Items && udfs.length > 0)
				{
					response.Items.forEach(function(item)
					{
						udfs.forEach(function(udf)
						{
							item[udf.FieldName] = item[udf.OriginalName];
						});
					});
				}

				if (self.gridBlockType === 'TripGrid' && (self.grid.dataSource.options && !self.grid.dataSource.options.serverPaging))
				{
					response.Items.forEach(trip =>
					{
						trip.Schools = trip.Schools.replace(/!/g, ", ").trim().tfTrimEnd(',');
					});
				}
				return response;
			}).then(function(result)
			{
				return {
					dataItems: result.Items,
					totalCount: result.Items.length,
					pageSize: 50
				};
			}, function(error)
			{
				self.$el.find(".custom-grid").addClass("no-permission");
				self.$el.find(".k-grid-content").empty().append("<p>You don't have permission to view data.</p>");
			});
		};

		var defaultGridOptions = {
			dataBound: function()
			{
				self._bindMiniGridEvent(self.miniGridType, self.$el.find(".kendo-grid"));

				self._setDefaultStudentRequirementAddable();
				switch (self.miniGridType)
				{
					case "document":
						self.$el.find(".kendo-grid .k-grid-content table tr").each(function(index, el)
						{
							var data = $(el).closest(".kendo-grid").data("kendoGrid").dataItem(el);
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
		};

		var options = {
			columns: columns,
			isFieldTripInvoice: self.miniGridType === "fieldtripinvoice",
			onDemandActions: this.onDemandGridActions[self.miniGridType],
			dataSource: getDataSource,
			sort: self.options.sort,
			gridOptions: $.extend(defaultGridOptions, hasPermission ? {} : {
				noRecords: {
					template: "You don't have permission to view data."
				}
			})
		};

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
			options.gridOptions.showLockedColumn = true;
			options.gridOptions.lockColumnTemplate = [
				{
					field: "bulk_menu",
					title: "<div></div>",
					width: '30px',
					sortable: false,
					filterable: false,
					locked: true,
					template: function(data)
					{
						const color = self.getTripColor(data.Id);
						return `<div class='k-hierarchy-cell' style='display: none}' ><a class='k-icon k-i-expand' style='display:none' aria-label='Expand'></a></div><div class='left-color-icon' style='border-radius:50%;display:block} ;background-color:${color}'></div>`;
					}
				}
			];
		}
		var grid = tf.helpers.kendoGridHelper.createSimpleGrid(self.$el, options);
		self.grid = grid;
		grid.options.totalCountHidden = options.totalCountHidden;
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
			self.grid.hideColumn(self.grid.columns[0]);
		}

		function refreshGrid()
		{
			tf.helpers.kendoGridHelper.setGridDataSource(grid, getDataSource, grid.options);
		}
	};

	//#region Field Trip Invoice

	GridBlock.prototype.addEditFieldTripInvoice = function(event)
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

	GridBlock.prototype.deleteFieldTripInvoice = function(event)
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
	GridBlock.prototype.refreshFieldTripInvoice = function()
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
	GridBlock.prototype.noHeightWhenEmpty = function(kendoGrid)
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
		var maxHeight = Math.max(kendoGridElement.height() - 67, gridContent.height());
		var gridHeight = 0;
		if (kendoGrid.dataSource.data().length != 0)
		{
			var height = kendoGrid.dataSource.data().length * 34;
			if (gridContent.find(".k-virtual-scrollable-wrap").width() < gridContent.find("table").width())
			{
				height += 18;
			}
			gridHeight = Math.min(maxHeight, height);
		}

		this.$innerGridPreHeight = `${Math.min(this.gridMaxHeightBeforeExpand, gridHeight)}px`;
		if (self.status === STATUS.RESTORE)
		{
			gridContent.height(gridHeight);
		}

	};

	GridBlock.prototype.editCalendarEventModal = function(grid, e)
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

	GridBlock.prototype.deleteCalendarEventModal = function(grid, e)
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

	GridBlock.prototype._notifyTripHistoryGridRefresh = function()
	{
		PubSub.publish("tripHistoryChange", {
			tripId: this.recordEntity.Id
		});
	};

	GridBlock.prototype.showCalendarEventModal = function(tripHistoryId)
	{
		var trip = this.recordEntity;
		return tf.modalManager.showModal(new TF.Modal.TripHistoryModalViewModel(trip.Id, trip.Name, tripHistoryId));
	};

	GridBlock.prototype.editStudentCardModal = function(grid, e)
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

	GridBlock.prototype.deleteStudentCardModal = function(grid, e)
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

	GridBlock.prototype._notifyStudentCardGridRefresh = function()
	{
		PubSub.publish("studentCardChange", {
			StudentId: this.recordEntity ? this.recordEntity.Id : null
		});
	}

	GridBlock.prototype.updateStudentTagIdRecord = function(response)
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

	GridBlock.prototype.autoFindSchedule = async function()
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

	GridBlock.prototype.setTripsLoadedOnMap = function(e)
	{
		this.tripLoadedNumber++;
		if (this.detailView.getMapNumber() == this.tripLoadedNumber)
		{
			this.grid.showColumn(this.grid.columns[0]);
			this.tripLoadedNumber = 0;
		}
		this.tripIsLoaded = true;
	};

	GridBlock.prototype.getTripColor = function(tripId)
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

	GridBlock.prototype.initChangeTripColor = function()
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

	GridBlock.prototype.addTripVisibilityAction = function()
	{
		let self = this;
		if (self.detailView.getMapNumber() > 0)
		{
			this.detailView.invisibleTrips = [];
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

	GridBlock.prototype.setTripVisibilityData = function(e, $target, clickTarget)
	{
		$target = $target || $(e.currentTarget);
		let $tr = $target.closest('tr'),
			$grid = $target.closest('.kendo-grid'),
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

	GridBlock.prototype.addHotLink = function(miniGridType, grid)
	{
		const hotLinkConfig = {
			studentschedule: [{ targetGrid: "trip", fields: ["TripName"], }]
		}
		const $table = $(grid.table);
		TF.Grid.GridHotLinkHelper && TF.Grid.GridHotLinkHelper.setHotLink(miniGridType, $table, hotLinkConfig, grid)

	};

	GridBlock.prototype.dispose = function()
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

		var kendoGrid = self.$el.find(".kendo-grid").data("kendoGrid");
		if (kendoGrid)
		{
			kendoGrid.destroy();
		}
		self._restore();
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