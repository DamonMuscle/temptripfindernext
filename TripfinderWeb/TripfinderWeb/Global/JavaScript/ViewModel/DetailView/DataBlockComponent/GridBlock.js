(function()
{
	createNamespace("TF.DetailView.DataBlockComponent").GridBlock = GridBlock;

	var FIELD_TRIP_INVOICE_KEY = "fieldtripinvoice";
	var studentRequirementsUrl = "studentrequirements";
	var CONFIRMATION_TITLE = "Confirmation Message";
	var gridConfigsMap = {
		"ContactGrid": {
			checkPermission: function() { return tf.authManager.isAuthorizedForDataType("contact", "add"); },
			btnClass: "add-contact",
			btnLabel: "Associate"
		},
		"ContactAssociationGrid": {
			btnClass: "add-association",
			btnLabel: "Associate"
		},
		"DocumentAssociationGrid": {
			checkPermission: function() { return tf.authManager.isAuthorizedFor("documentTab", "edit"); },
			btnClass: "add-association",
			btnLabel: "Associate"
		},
		"DocumentGrid": {
			checkPermission: function() { 
				return tf.authManager.isAuthorizedForDataType("document", ["add", "edit"]) && 
					tf.authManager.isAuthorizedForDataType("documentTab", ["add", "edit"]);
			 },
			btnClass: "add-document",
			btnLabel: "Associate"
		},
		"StudentRequirementGrid": {
			checkPermission: function() { return tf.authManager.isAuthorizedFor("student", ["add", "edit"]); },
			btnClass: "add-student-requirement",
			btnLabel: "Add"
		},
		"AdditionalRequirementGrid": {
			checkPermission: function() { return tf.authManager.isAuthorizedFor("student", ["add", "edit"]); },
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
				return tf.authManager.authorizationInfo.isFieldTripAdmin;
			},
			btnClass: "add-fieldtrip-resource",
			btnLabel: "Add"
		},
		"FieldTripInvoiceGrid": {
			checkPermission: function() { return tf.authManager.isAuthorizedForDataType("fieldtrip", ["add", "edit"]); },
			btnClass: "add-fieldtrip-invoice",
			btnLabel: "Add"
		}
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
		self.extraGridConfigs = self.getExtraGridConfigurations(options.field, detailView._getLayoutObjInCache().width);
		self.$detailView = detailView.$element;
		self.gridType = detailView.gridType;
		self.isCreateGridNewRecord = detailView.isCreateGridNewRecord;
		self.recordEntity = detailView.recordEntity;
		self.recordId = detailView.recordId;
		self.fieldEditorHelper = detailView.fieldEditorHelper;
		self.obEditing = detailView.obEditing;

		self._initGridActions();
		self._detailviewFieldChange = self._detailviewFieldChange.bind(self);
		detailView.onFieldChange.subscribe(self._detailviewFieldChange);
		self.initElement(options);
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
						// self.fieldEditorHelper.editFieldList.FieldTripResourceGroups =
						// {

						// 	value: FieldTripResourceGroupsWithBC,
						// 	blockName: "FieldTripResourceGroups"
						// };
						// Update grid data
						self._updateResourceGrid(FieldTripResourceGroupsWithBC);
					}
					PubSub.publish("fieldtripresource", {});
				}
				break;
		}
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
			isReadOnly = self.isReadOnly();

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
				},
				delete: function(e)
				{
					if ($(e.currentTarget).hasClass("disable"))
					{
						return;
					}

					self.removeAssociationToDocument(e);
				}
			}
		};

		self.kendoGridActions.documentrelationships = {
			delete: self.removeDocumentAssociation.bind(self)
		};
		self.kendoGridActions.document.delete = self.removeAssociationToDocument.bind(self);

		if (!isReadOnly)
		{
			self.kendoGridActions.contact = {
				edit: self.editMiniGridRecord.bind(self, GridBlock.MINI_GRID_TYPE.CONTACT),
				delete: self.removeAssociationToContact.bind(self)
			};
			self.kendoGridActions.contactrelationships = {
				delete: self.removeContactAssociation.bind(self)
			};
		}

		// set on demand action
		self.onDemandGridActions = {};

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
					name: "Unassign",
					template: '<a class="k-button k-button-icontext unassign-student-icon" title="Unassign"></a>',
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
				click: function(e)
				{
					self.openTrip(this, e.target);
				}
			});

			self.onDemandGridActions["studentschedule"] = studentscheduleActions;
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
	};

	GridBlock.MINI_GRID_TYPE = {
		"CONTACT": "contact",
		"DOCUMENT": "document"
	};

	GridBlock.MINI_GRID_NAME_DICTIONARY = {
		"contact": "ContactGrid",
		"document": "DocumentGrid"
	};

	GridBlock.CONTACT_TYPE = {
		'General': 1,
		'Guardian': 2,
		'Mother': 3,
		'Father': 4,
		'Step_Mother': 5,
		'Step_Father': 6,
		'Field_Trip_Destination': 7,
		'Field_Trip': 8,
		'Contractor': 9,
		'Alternate_Site': 10,
		'Emergency': 11
	};

	GridBlock.MINI_GRID_ASSOCIATION_FIELD_NAME = {
		"contact": "RecordContacts",
		"document": "DocumentRelationships"
	};

	GridBlock.MINI_GRID_RELATIONSHIP_KEY = {
		"contact": "contactAssociation",
		"document": "DocumentRelationship"
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
	};

	GridBlock.prototype.initEvents = function()
	{
		var self = this,
			$btn = self.$el.find(".grid-top-right-button");

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
					break;
				case "FieldTripResourceGrid":
					$btn.on("click.detailView", function()
					{
						self.showFieldTripResourceModal(null);
					});
					break;
				case "FieldTripInvoiceGrid":
					$btn.on("click.detailView", function()
					{
						self.addEditFieldTripInvoice();
					});
					break;
				default:
					break;
			}
		}
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
						DataType: item.Type
					};
				}),
				gridType: self.gridType,
			};

		tf.modalManager.showModal(new TF.DetailView.AssociateRecordsModalViewModel(options)).then(function(result)
		{
			if (!result) return;

			var selected = result.data;
			self.updateAllGridsDataSource(fieldName, selected, result.total);
			if (fieldName === "ContactAssociationGrid")
			{
				self.updateContactAssociationRecordEntity(selected);
			} else if (fieldName === "DocumentAssociationGrid")
			{
				self.updateDocumentAssociationRecordEntity(selected);
			}
		});
	};

	GridBlock.prototype.updateAllGridsDataSource = function(fieldName, dataSource, total)
	{
		var self = this,
			grids = tf.helpers.detailViewHelper.getAllGridsAndColumns(self.$detailView, fieldName)["grids"];

		$.each(grids, function(_, item)
		{
			var $item = $(item);
			$item.data("kendoGrid").dataSource.data(dataSource);
			tf.helpers.kendoGridHelper.updateGridFooter($item, dataSource.length, total);
		});
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

			return;
		}

		return TF.DetailView.StudentRequirementViewModel.checkStudentRequirementLocked(data.Id).then(function()
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
										if (self.gridBlockType == "ContactGrid")
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
			tf.helpers.detailViewHelper.updateRelationships(recordType, recordId, miniGridType, recordIds);
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
				WarningMessage = `Disassociate this ${ gridName } from ${ documentEntity.Name } will also remove associations between document and UDF Groups. Are you sure you want to apply these changes?`
			tf.promiseBootbox.yesNo(WarningMessage, CONFIRMATION_TITLE)
			.then(function(res)
			{
				if (!res) return;

				var tasks = [self.getDocumentGridTotalCount()];

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
			case 'contact':
				requestUrl = pathCombine(tf.api.apiPrefixWithoutDatabase(), typeEndpoint, recordId);
				requestUrl += '?@relationships=all';
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
						tf.helpers.detailViewHelper.removeFromAllGridsDataSourceByIds(self.$detailView, "contactassociation", [recordEntity.Id], totalCount);

						var data = kendoGrid.dataSource.data();
						var associations = data.map(function(item)
						{
							return {
								Id: item.Id,
								Type: item.Type
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
					ContactTypeID: GridBlock.CONTACT_TYPE.General // TODO: assign correct ContactTypeID.
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
					return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "StudentSchedules"), {
						paramData: {
							"dbid": tf.datasourceManager.databaseId,
							"studentid": entity.StudentID,
							"@count": true
						}
					}).then(function(count)
					{
						tf.helpers.detailViewHelper.removeFromAllGridsDataSourceByIds(self.$detailView, "studentschedule", [entity.Id], count);
					});
				}).catch(function(res)
				{
					TF.showErrorMessageBox(res);
				});
			});
	};

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
			gridName = tf.dataTypeHelper.getFormalDataTypeName(self.gridType).toLowerCase();

		tf.promiseBootbox.yesNo("Are you sure you want to disassociate this " + gridName + " from \"" + contactName + "\"?", CONFIRMATION_TITLE)
			.then(function(res)
			{
				if (!res) return;

				var tasks = [self.getContactGridTotalCount()];

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
					var totalCount = response[0];

					tf.helpers.detailViewHelper.removeFromAllGridsDataSourceByIds(self.$detailView, "contact", [contactEntity.Id], totalCount);

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
		var result = {},
			config = gridConfigsMap[gridName];

		if (config)
		{
			var $btn = $("<div/>", { class: "grid-top-right-button " + config.btnClass, text: config.btnLabel }),
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
			case "document":
			case "contactrelationships":
			case "documentrelationships":
				command = [];
				command.push({
					name: "view",
					template: '<a class="k-button k-button-icontext k-grid-view" title="View"></a>',
					click: actions.view
				});
				command.push({
					name: "download",
					template: '<a class="k-button k-button-icontext k-grid-download" title="Download"><span></span>Download</a>',
					click: actions.download
				});
				if (tf.authManager.isAuthorizedForDataType("documentTab", ["delete"]))
				{
					command.push({
						name: "delete",
						template: '<a class="k-button k-button-icontext k-grid-delete delete-relationship" title="Disassociate"></a>',
						click: actions.delete
					});
				}
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
			columns = allColumns.filter(function(c)
			{
				return !c.hidden;
			}).map(function(c)
			{
				return $.extend({}, c);
			});
		}

		return columns;
	};

	GridBlock.prototype.getContactAssociations = function(contactId, includeDataTypes)
	{
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "contacts", contactId, "contactrelationships"), {
			paramData: {
				"databaseID": tf.datasourceManager.databaseId,
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
			case "StudentRequirementGrid":
				// association grids don't need to check permission.
				// Grid will only load records that user has permission to read.
				return true;
			case "FieldTripHistoryGrid":
			case "FieldTripVehicleGrid":
			case "FieldTripDriverGrid":
			case "FieldTripAideGrid":
			case "FieldTripResourceGrid":
			case "FieldTripInvoiceGrid":
				return tf.authManager.isAuthorizedForDataType("fieldtrip", "read");
			case "StudentScheduleGrid":
				return tf.authManager.isAuthorizedFor("student", "read");
			case "CalendarEventsGrid":
				return tf.authManager.isAuthorizedFor("trip", "read");
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

		var columnFields = columns.map(function(column)
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
			case "AltsiteGrid":
				paramData = {
					"@fields": "AltSiteID",
					"StudentId": self.recordId,
					"DBID": tf.datasourceManager.databaseId,
					"@filter": "gt(AltSiteID,0)"
				};
				return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "StudentRequirements"), {
					paramData: paramData
				}).then(function(result)
				{
					if (columnFields.indexOf("Id") === -1)
					{
						columnFields.push("Id");
					}

					var includeIds = (Array.isArray(result.Items) && result.Items.length > 0) ? result.Items.map(function(item)
					{
						return item.AltSiteID;
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
			default:
				paramData = {};
				urlNode = tf.dataTypeHelper.getEndpoint(dataItem.url);

				if (urlNode.indexOf("fieldtrip") > -1)
				{
					paramData["@filter"] = "eq(FieldTripId," + self.recordId + ")";
					switch (dataItem.field)
					{
						case "FieldTripHistoryGrid":
							paramData["@relationships"] = "UserName";
							break;
						case "FieldTripVehicleGrid":
							paramData["@relationships"] = "Vehicle";
							break;
						case "FieldTripDriverGrid":
							paramData["@relationships"] = "Driver";
							break;
						case "FieldTripAideGrid":
							paramData["@relationships"] = "Aide";
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
								Name: "Id",
								isAscending: "asc",
								Direction: "Ascending"
							}]
						}
					});
				});
		}
	};

	GridBlock.prototype.getDocumentGridTotalCount = function()
	{
		var self = this;
		return tf.helpers.detailViewHelper._getDocumentGridRecords([], self.gridType, self.recordId).then(function(response)
		{
			return response.TotalRecordCount;
		});
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
		let self = this;
		let bindDBClickEvent = () => {
			$grid.off("dblclick").on("dblclick", ".k-grid-content table tr", function(e)
			{
				self.editMiniGridRecord(miniGridType, e);
			});
		};

		// This function firing multiple times on kendoGrid dataBound / dataBinding event.
		switch (miniGridType) {
			case GridBlock.MINI_GRID_TYPE.CONTACT:
				bindDBClickEvent();
				break;
			case GridBlock.MINI_GRID_TYPE.DOCUMENT:
				if (tf.authManager.isAuthorizedForDataType("document", ["add", "edit"]) && 
					tf.authManager.isAuthorizedForDataType("documentTab", ["add", "edit"])) {
					bindDBClickEvent();
				}
				break;
			default:
				break;
		}
	};

	GridBlock.prototype._setDefaultStudentRequirementAddable = function()
	{
		if (this.options.url == TF.Helper.KendoGridHelper.studentRequirementItemsUrl)
		{
			var addButton = this.$el.find(".grid-top-right-button");
			var grid = this.$el.find(".kendo-grid").data("kendoGrid");
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
			requirement = requirement || (self.recordEntity ? {
				DBID: self.recordEntity.DBID,
				StudentId: self.recordEntity.Id,
				Type: type
			} : null),
			attendanceSchoolCode = self.detailView.fieldEditorHelper.editFieldList.SchoolCode ? self.detailView.fieldEditorHelper.editFieldList.SchoolCode : null,
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
		}

		// default requirements only can create each type once, so force set the sessionId
		if (options.isNew && (requirement && requirement.Type == TF.StudentRequirementType.default) && self.grid.dataSource.data().length > 0)
		{
			options.sessionId = self.grid.dataSource.data()[0].Session == "To School" ? 1 : 0;
		}

		if (requirement && requirement.Type == TF.StudentRequirementType.default)
		{
			requirement.Sunday = true;
			requirement.Saturday = true;
		}

		tf.modalManager.showModal(new TF.DetailView.StudentRequirementModalViewModel(options)).then(function(result)
		{
			if (result == true)
			{
				PubSub.publish(studentRequirementsUrl, {
					StudentId: self.recordEntity ? self.recordEntity.Id : null
				});
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
			self.showStudentRequirementModal(requirementCache);
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
		if (this.isReadOnly() ||
			!gridConfigsMap["FieldTripResourceGrid"].checkPermission())
		{
			return;
		}
		var self = this,
			tr = $(e.target).closest("tr"),
			data = grid.dataItem(tr);
		self.showFieldTripResourceModal(data);
	};

	GridBlock.prototype.showFieldTripResourceModal = function(fieldtripResource)
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

		tf.modalManager.showModal(new TF.DetailView.FieldTripResourceModalViewModel(options))
			.then(function(result)
			{
				if (!result)
				{
					return;
				}
				var newRes = self.detailView.fieldEditorHelper.getFieldValue("FieldTripResourceGroups") || [];
				var editedRes = newRes.filter(function(r) { return r.Id === result.Id; });
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
				};

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

	GridBlock.prototype.initDetailGrid = function()
	{
		var self = this,
			isReadMode = self.isReadMode(),
			miniGridType = (self.options.url || "").toLowerCase(),
			columns = self.prepareColumnsForDetailGrid(miniGridType, self.options),
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
				var items = self.detailView.newEntityRelationships[miniGridType] || [];
				return Promise.resolve({
					dataItems: items,
					totalCount: items.length,
					pageSize: 50
				});
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
					response.Items = response.Items.map(function(item)
					{
						udfs.forEach(function(udf)
						{
							item[udf.FieldName] = item[udf.OriginalName];
						});

						return item;
					});
				}

				return response;
			}).then(function(result)
			{
				return {
					dataItems: result.Items,
					totalCount: result.TotalRecordCount,
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
				self._bindMiniGridEvent(miniGridType, self.$el.find(".kendo-grid"));

				self._setDefaultStudentRequirementAddable();
				switch (miniGridType)
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
			isFieldTripInvoice: miniGridType === "fieldtripinvoice",
			onDemandActions: this.onDemandGridActions[miniGridType],
			dataSource: getDataSource,
			sort: self.options.sort,
			gridOptions: $.extend(defaultGridOptions, hasPermission ? {} : {
				noRecords: {
					template: "You don't have permission to view data."
				}
			})
		};

		if (miniGridType === "fieldtripinvoice")
		{
			options.afterRenderCallback = function(kendoGrid, dataItems)
			{
				var amount = self.fieldEditorHelper.calculateTotalAmount(dataItems);
				kendoGrid.element.find(".invoice-total-amount").remove();
				kendoGrid.element.append(String.format("<div class=\"invoice-total-amount\">Total Amount: ${0}</div>", amount.toFixed(2)))

			}.bind(self);
		}

		if ([TF.Helper.KendoGridHelper.studentRequirementItemsUrl, TF.Helper.KendoGridHelper.studentAdditionalRequirementUrl, "studentschedule"].indexOf(miniGridType) >= 0)
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

		self.originalGridOptions = options;

		var grid = tf.helpers.kendoGridHelper.createSimpleGrid(self.$el, options);
		self.grid = grid;
		grid.options.totalCountHidden = options.totalCountHidden;
		if ([TF.Helper.KendoGridHelper.studentRequirementItemsUrl, TF.Helper.KendoGridHelper.studentAdditionalRequirementUrl].indexOf(miniGridType) >= 0)
		{
			grid.tbody.on("dblclick", "tr.k-state-selected", function(e)
			{
				self.editStudentRequirement(grid, e);
			});
		}

		if (miniGridType == "fieldtripresource")
		{
			grid.tbody.on("dblclick", "tr.k-state-selected", function(e)
			{
				self.editFieldTripResource(grid, e);
			});

			self.pubSubSubscriptions.push(PubSub.subscribe("fieldtripresource", function(key, result)
			{
				refreshGrid();
			}));
		}

		if (miniGridType == "fieldtripinvoice")
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

		if (miniGridType == "triphistory")
		{
			self.pubSubSubscriptions.push(PubSub.subscribe("tripHistoryChange", function(key, result)
			{
				if (result.tripId == (self.recordEntity ? self.recordEntity.Id : null))
				{
					refreshGrid();
				}
			}));
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

				options.accounts = accounts;
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
			tf.promiseBootbox.yesNo("Are you sure to delete this invoice?", "Confirmation").then(function(r)
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

				self.fieldEditorHelper.checkAndUpdateFieldTripInvoiceGridStatus(null, invoices);

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
})();