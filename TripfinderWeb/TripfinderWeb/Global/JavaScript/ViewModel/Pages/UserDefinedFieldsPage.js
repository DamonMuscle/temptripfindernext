(function()
{
	createNamespace("TF.Page").UserDefinedFieldsPage = UserDefinedFieldsPage;

	var _REPORT_GRID_TYPE = "report",
		_PRIMARY_GRID_COLUMNS = [
			{
				field: "Id",
				title: "UserDefinedFieldId",
				hidden: true,
				onlyForFilter: true
			},
			{
				field: "DisplayName",
				title: "Name",
				width: "600px"
			},
			{
				field: "Type",
				title: "Type",
				width: "200px",
				template: function(item)
				{
					return item.Type;
				},
				onlyForField: true
			},
			{
				field: "IsShow",
				title: "Shown in Current Data Source",
				width: "200px",
				onlyForNonReportType: true
			},
			{
				field: "Value",
				title: "Value",
				width: "300px",
				template: function(item)
				{
					if (item.Type === 'Currency')
					{
						if (item.Value === undefined || item.Value === null || isNaN(item.Value))
						{
							return '';
						}
						if (item.MaxLength)
						{
							return item.Value.toFixed(item.MaxLength);
						}
						return item.Value;
					}

					return item.Value;
				},
				onlyForReportType: true
			},
			{
				field: "Description",
				title: "Description",
				width: "200px"
			},
			{
				field: "ExternalID",
				title: "External ID",
				width: "200px"
			},
			{
				field: "Public",
				width: "100px",
				template: function(item)
				{
					return "";
				},
				onlyForForm: true
			}
		];

	function UserDefinedFieldsPage()
	{
		var self = this,
			availableTypes = tf.dataTypeHelper.getAvailableDataTypesForUDFManagement().filter(t => t.key !== _REPORT_GRID_TYPE);

		self.commandGridColumns = [
			{
				command: [
					{
						name: "export",
						template: "<a class=\"k-button k-button-icontext k-grid-export\" title=\"Export\"><span class=\"k-icon k-edit\"></span>Export</a>",
						click: self.onExportGroupFieldBtnClick.bind(self)
					},
					{
						name: "view",
						template: "<a class=\"k-button k-button-icontext k-grid-view\" title=\"View\"><span class=\"k-icon k-edit\"></span>View</a>",
						click: self.onEditBtnClick.bind(self)
					},
					{
						name: "copyandnew",
						template: "<a class=\"k-button k-button-icontext k-grid-copyandnew\" title=\"Copy\"><span class=\"k-icon k-edit\"></span>Copy</a>",
						click: self.onCopyAndNewBtnClick.bind(self)
					},
					{
						name: "edit",
						template: "<a class=\"k-button k-button-icontext k-grid-edit\" title=\"Edit\"><span class=\"k-icon k-edit\"></span>Edit</a>",
						click: self.onEditBtnClick.bind(self)
					},
					{
						name: "delete",
						template: "<a class=\"k-button k-button-icontext k-grid-delete\" title=\"Delete\"><span class=\" \"></span>delete</a>",
						click: self.onDeleteBtnClick.bind(self)
					}],
				title: "Action",
				width: "120px",
				attributes: {
					"class": "text-center"
				}
			}
		];

		self.type = "userdefinedfield";
		self.pageType = "userdefinedfields";

		TF.Page.BaseGridPage.apply(self, arguments);

		self.skipSavePage = true;

		//  Properties
		self.$element = null;
		self.$gridWrapper = null;
		self.kendoGrid = null;

		self.endpoint = tf.dataTypeHelper.getEndpoint(self.type);

		self.obCurrentUdfCount = ko.observable(0);
		self.obAvailableTypes = ko.observableArray(availableTypes);
		self.obSelected = ko.observable(availableTypes[0]);
		self.onAddBtnClick = self.onAddBtnClick.bind(self);

		self.selectedItemChanged = new TF.Events.Event();
		self.udfChangedEvent = new TF.Events.Event();
		self.detailviewHelper = tf.helpers.detailViewHelper;
		self.udfHelper = new TF.DetailView.UserDefinedFieldHelper();

		self.userMessages = {
			"WRONG_LAYOUT_TYPE": "This udf cannot be used with this data type. Please select a different udf.",
			"FAIL_VALIDATION_MSG": "File is unreadable. For more information, contact support.",
			"NO_PERMISSION_MSG": "You don't have the permission to this udf's grid type.",
			"WRONG_FILE_TYPE_MSG": "Incorrect file type. Please upload a [.tfUDFConfiguration] to import.",
			"DUPLICATED_NAME_AND_NEW_NAME_GREATE_THAN_FORM_NAME_MAX_LENGTH_MSG": "Name must be unique and less than 50 characters.",
			"DUPLICATED_NAME_AND_NEW_NAME_GREATE_THAN_UDF_NAME_MAX_LENGTH_MSG": "Name must be unique and less than 30 characters."
		};
		self.onUDFJsonFileSelected = self.onUDFJsonFileSelected.bind(self);
	}

	UserDefinedFieldsPage.prototype = Object.create(TF.Page.BaseGridPage.prototype);

	UserDefinedFieldsPage.prototype.constructor = UserDefinedFieldsPage;

	UserDefinedFieldsPage.prototype.init = function(viewModel, el)
	{
		var self = this;
		self.authValidation().then(function(response)
		{
			if (response)
			{
				self.$element = $(el);
				self.$gridWrapper = self.$element.find(".grid-wrapper");

				self.initGrid(self.$gridWrapper, self.obSelected().key);

				self.$gridWrapper.find(".selected-label,.bottom-caret").on("click", function(e)
				{
					var contextmenu = new TF.ContextMenu.TemplateContextMenu(
						"workspace/switchgridmenu",
						new TF.SwitchGridMenuViewModel({
							availableTypes: self.obAvailableTypes(),
							selectedItem: self.obSelected(),
							selectedItemChanged: self.selectedItemChanged
						})
					);
					tf.contextMenuManager.showMenu(self.$gridWrapper.find(".bottom-caret"), contextmenu);
				});

				self.selectedItemChanged.subscribe(function(e, value)
				{
					self.obSelected(value);
					self.refreshGridByType(value.key);
				});

				self.udfChangedEvent.subscribe(self.onUdfChangedCallback.bind(self));
				self.$importLayoutInput = self.$element.find("#import-layout");
			}
		}.bind(this));
	};

	UserDefinedFieldsPage.prototype.authValidation = function()
	{
		if (!tf.permissions.obIsAdmin())
		{
			return tf.pageManager.handlePermissionDenied("User Defined Fields").then(function()
			{
				return Promise.resolve(false);
			});
		}
		return Promise.resolve(true);
	};

	UserDefinedFieldsPage.prototype._fullfillGridBlank = function()
	{
		var $canver = this.$container.find(".k-grid-content");
		$canver.children('.kendogrid-blank-fullfill').remove();

		var $blankFiller = $('<table class="kendogrid-blank-fullfill"></table>');
		var $trs = $canver.children('table[role=grid]').children('tbody').children('tr');
		$trs.map(function(idx, tr)
		{
			var $tr = $(tr);
			var uid = $tr.data('kendo-uid');
			var $td = $($tr.find('td')[0]);
			var fillItemColor = $td.css('background-color');
			var fillItemHeight = $td.outerHeight();
			var fillItemClass = (idx % 2 === 0) ? 'l' : 'l-alt';
			$blankFiller.append(
				'<tr data-id="' + uid + '" class="fillItem ' + fillItemClass + '"' +
				' style="height:' + fillItemHeight + 'px;background-color:' + fillItemColor + '">' +
				'</tr>'
			);
		});

		$canver.prepend($blankFiller).children('table').addClass('table-blank-fullfill');
	};


	UserDefinedFieldsPage.prototype.getHash = function()
	{
		return "UserDefinedFields";
	};

	UserDefinedFieldsPage.prototype.getGridColumnsByType = function(type)
	{
		var self = this,
			isForReportUDFs = type === _REPORT_GRID_TYPE,
			gridColumns;

		if (isForReportUDFs)
		{
			gridColumns = _PRIMARY_GRID_COLUMNS.filter(function(item)
			{
				return !item.hidden && item.onlyForNonReportType !== true;
			});
		}
		else
		{
			gridColumns = _PRIMARY_GRID_COLUMNS.filter(function(item)
			{
				return !item.hidden && item.onlyForReportType !== true;
			});
		}

		if (self.pageType === "userdefinedfields")
		{
			gridColumns = gridColumns.filter(function(item)
			{
				return item.onlyForForm !== true;
			});
		}
		else
		{
			gridColumns = gridColumns.filter(function(item)
			{
				return item.onlyForField !== true;
			});
		}


		return gridColumns.concat(self.commandGridColumns.slice());
	};

	/**
	 * Initialize a user defined field grid.
	 *
	 * @param {JQuery} $grid
	 * @param {string} type
	 */
	UserDefinedFieldsPage.prototype.initGrid = function($container, type)
	{
		var self = this,
			gridColumns = self.getGridColumnsByType(type);

		this.$container = $container;
		self.fetchGridData(type).then(function(data)
		{
			var $grid = $container.find(".kendo-grid"),
				count = data.length;

			self.obCurrentUdfCount(count);
			if (self.kendoGrid)
			{
				self.kendoGrid.destroy();
			}

			self.kendoGrid = $grid.kendoGrid({
				dataSource: {
					data: data,
					sort: { field: "DisplayName", dir: "asc" }
				},
				scrollable: true,
				sortable: true,
				selectable: "single",
				resizable: true,
				columns: gridColumns,
				dataBound: function()
				{
					var grid = this,
						el = grid.element,
						$footer = el.find(".k-grid-footer"),
						footerLabel = self._getGridFooterLabel(self.obCurrentUdfCount());

					if (el == null)
					{
						return;
					}

					self._restoreScrollPosition();

					if ($footer.length === 0)
					{
						$footer = $("<div/>", { class: "k-grid-footer" }).appendTo(el);
					}

					el.find("tbody tr[role='row']").each(function()
					{
						var model = grid.dataItem(this);

						if (model.SystemDefined)
						{
							$(this).addClass("system-defined-field");
						}
						else
						{
							$(this).addClass("general-field");
						}
					});

					$footer.text(footerLabel);
					self._fullfillGridBlank();
				}
			}).data("kendoGrid");

			self.kendoGrid.element.off("dblclick").on("dblclick", ".k-grid-content table tr", function(e)
			{
				self.onEditBtnClick(e);
			});
		});
	};

	/**
	 * fetch grid related data.
	 *
	 * @param {string} type
	 * @returns
	 */
	UserDefinedFieldsPage.prototype.fetchGridData = function(type)
	{
		let self = this,
			udfPromise = tf.UDFDefinition.RetrieveByType(type).then(function(response)
			{
				return (response.Items || [])
					.filter(i => !i.AttributeFlag)
					.map(item =>
					{
						if (type === _REPORT_GRID_TYPE)
						{
							item.Value = self.udfHelper.getCurrentDefaultValue(item);
						}
						else
						{
							item.IsShow = item.SystemDefined ? "Always" : (self.udfHelper.isShowInCurrentDataSource(item) ? "Yes" : "No");
						}

						return item;
					});
			});

		return Promise.all([udfPromise]).then(function(values)
		{
			return values[0];
		});
	};

	/**
	 * Add user defined field button clicked.
	 *
	 */
	UserDefinedFieldsPage.prototype.onAddBtnClick = function()
	{
		var self = this,
			type = self.obSelected().key;
		tf.modalManager.showModal(
			new TF.Modal.UserDefinedField.EditUserDefinedFieldModalViewModel({
				gridType: type
			}))
			.then(function(response)
			{
				if (response)
				{
					self.refreshGridByType(type);
				}
			});
	};

	UserDefinedFieldsPage.prototype.onExportGroupFieldBtnClick = function(evt)
	{
		let self = this,
			$tr = $(evt.currentTarget).closest("tr"),
			rowDataItem = self.kendoGrid.dataItem($tr[0]);
		TF.DetailView.UserDefinedFieldHelper.removeIdentityInfo(rowDataItem);
		let dataItem = JSON.parse(JSON.stringify(rowDataItem));

		let formName = dataItem.Name || dataItem.DisplayName;
		let fileName = `${formName}.tfUDFConfiguration`;
		let contentType = 'application/x-udfConfiguration';

		let exprotDataText = JSON.stringify({
			dataType: tf.dataTypeHelper.getKeyById(dataItem.DataTypeId) || _REPORT_GRID_TYPE,
			dataItem: dataItem,
		});

		TF.URLHelper.downloadFileGenerator([exprotDataText], { type: contentType }, fileName);
	}

	UserDefinedFieldsPage.prototype.onImportGroupBtnClick = function()
	{
		var self = this;
		self.$importLayoutInput.click();
	};

	UserDefinedFieldsPage.prototype.onUDFJsonFileSelected = function()
	{
		var self = this,
			fileInput = self.$importLayoutInput[0],
			selectedFile = fileInput.files[0],
			reader = new FileReader();

		reader.onload = function(e)
		{
			try
			{
				let entity = JSON.parse(this.result);

				let dataType = entity.dataType;
				let dataItem = entity.dataItem;

				dataItem["isCopy"] = true;
				delete dataItem.Id;
				delete dataItem.ID;

				var udfGridTypeObj = tf.dataTypeHelper.getUDFAvailableDataTypes().filter(function(item) {
					return item.key === dataType && item.key !== _REPORT_GRID_TYPE;
				})[0];
				if (!udfGridTypeObj)
				{
					throw "NO_PERMISSION_MSG";
				}

				if (!dataItem || !dataItem.TypeId)
				{
					throw "FAIL_VALIDATION_MSG"
				}

				self.obSelected(udfGridTypeObj);
				self.refreshGridByType(dataType);

				tf.modalManager.showModal(
					new TF.Modal.UserDefinedField.EditUserDefinedFieldModalViewModel({
						gridType: dataType,
						dataEntity: dataItem
					})).then(function(response)
					{
						if (response)
						{
							self.refreshGridByType(dataType);
						}
					});
			}
			catch (e)
			{
				var msg = self.userMessages[e] || self.userMessages["FAIL_VALIDATION_MSG"];
				self.pageLevelViewModel.clearError();
				self.pageLevelViewModel.popupErrorMessage(msg);
			}
			finally
			{
				fileInput.value = null;
			}
		};

		// The filename must have correct extension.
		if (!selectedFile)
		{
			return;
		}
		if (selectedFile.name.toLowerCase().endsWith(".tfudfconfiguration"))
		{
			reader.readAsText(selectedFile);
		}
		else
		{
			self.pageLevelViewModel.clearError();
			self.pageLevelViewModel.popupErrorMessage(self.userMessages["WRONG_FILE_TYPE_MSG"]);
		}
	};

	/**
	* Copy and New user defined field button clicked.
	*
	*/
	UserDefinedFieldsPage.prototype.onCopyAndNewBtnClick = function(evt)
	{
		var self = this,
			$tr = $(evt.currentTarget).closest("tr"),
			dataType = self.obSelected().key,
			rowDataItem = self.kendoGrid.dataItem($tr[0]),
			dataItem = JSON.parse(JSON.stringify(rowDataItem));

		var originalName = dataItem.Name || dataItem.DisplayName;
		var existedNames = self.kendoGrid.dataSource.data().map(x => x.DisplayName);
		dataItem.ExistedNames = existedNames;
		dataItem.Name = TF.Helper.NewCopyNameHelper.generateNewCopyName(originalName, existedNames);
		dataItem.DisplayName = dataItem.Name;
		dataItem.isCopy = true;

		TF.DetailView.UserDefinedFieldHelper.removeIdentityInfo(dataItem);
		tf.modalManager.showModal(
			new TF.Modal.UserDefinedField.EditUserDefinedFieldModalViewModel({
				gridType: dataType,
				dataEntity: dataItem
			})).then(function(response)
			{
				if (!!response)
				{
					self.refreshGridByType(dataType);
				}
			});
	};

	/**
	 * Edit user defined field button clicked.
	 *
	 */
	UserDefinedFieldsPage.prototype.onEditBtnClick = function(evt)
	{
		var self = this,
			$tr = $(evt.currentTarget).closest("tr"),
			dataType = self.obSelected().key,
			dataItem = self.kendoGrid.dataItem($tr[0]);

		tf.modalManager.showModal(
			new TF.Modal.UserDefinedField.EditUserDefinedFieldModalViewModel({
				gridType: dataType,
				dataEntity: dataItem
			})).then(function(response)
			{
				if (!!response)
				{
					self._backupScrollPosition();
					self.refreshGridByType(dataType);

					// Since multiple tab is not supported in TripfinderNext yet, comment the following code at this moment.
					// if (dataType !== _REPORT_GRID_TYPE)
					// {
					// 	tf.documentManagerViewModel.modifiedUDFIds.push(dataItem.Id);
					// }
				}
			});
	};

	/**
	 * Delete user defined field button clicked.
	 *
	 */
	UserDefinedFieldsPage.prototype.onDeleteBtnClick = function(evt)
	{
		var self = this, $tr = $(evt.currentTarget).closest("tr"),
			gridType = self.obSelected().key,
			dataItem = self.kendoGrid.dataItem($tr[0]),
			udfId = dataItem.Id,
			udfGuid = dataItem.Guid,
			detailViewTemplates,
			gridLayouts,
			impactedReportIds,
			deleteConfirmPromise;

		if (gridType === _REPORT_GRID_TYPE)
		{
			// For Report UDFs, we will need to check for UDF usage in all existing Reports' LayoutFileContent
			deleteConfirmPromise = () =>
			{
				return self.checkUdfInAllReportLayouts(udfGuid).then(function(reportIds)
				{
					impactedReportIds = Array.isArray(reportIds) ? reportIds : [];
					var numOfReportsInUse = impactedReportIds.length,
						errorMessage = numOfReportsInUse === 0 ?
							"Are you sure you want to delete this User Defined Field?" :
							String.format(
								"The User Defined Field you are about to delete has been used in {0} {1}. " +
								"If deleted, the value of this field will be lost in the {1}. " +
								"Are you sure you want to delete the field?",
								numOfReportsInUse,
								numOfReportsInUse === 1 ? "report" : "reports"
							);

					return tf.promiseBootbox.yesNo({
						message: errorMessage,
						title: "Confirmation Message",
						closeButton: true
					});
				});
			}
		}
		else
		{
			deleteConfirmPromise = () =>
			{
				return Promise.all([
					self.checkUdfInDetailViewTemplate(gridType, dataItem.Id),
					self.checkUdfInGridLayout(gridType, dataItem.Id),
					self.checkUdfInAllReportLayouts(udfGuid),
					tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "roleforms")),
				]).then(function(values)
				{
					detailViewTemplates = Array.isArray(values[0]) ? values[0] : [];
					gridLayouts = Array.isArray(values[1]) ? values[1] : [];
					impactedReportIds = Array.isArray(values[2]) ? values[2] : [];
					var count = detailViewTemplates.length + gridLayouts.length + impactedReportIds.length;
					var partialMessage = [];
					if (detailViewTemplates.length > 0)
					{
						partialMessage.push("detail view layouts");
					}

					if (gridLayouts.length > 0)
					{
						partialMessage.push("grids");
					}

					if (impactedReportIds.length > 0)
					{
						partialMessage.push(" reports");
					}

					partialMessage = partialMessage.map(function(item, index)
					{
						return index > 0 ? " " + item : item;
					}).join(",");

					var lastIndex = partialMessage.lastIndexOf(",");
					if (isNaN(Number(lastIndex)))
					{
						partialMessage.replace(/\,/gi, function(match, index)
						{
							return index == lastIndex ? " and" : match;
						});
					}

					var warningMessage = "Are you sure you want to delete this User Defined Field?";

					if (count === 0)
					{
						errorMessage = warningMessage;
					}
					else
					{
						errorMessage = "The User Defined Field you are about to delete contains data on " + count + (count === 1 ? " record" : " records") + ". " +
							"If deleted, the data in these fields will be lost and the fields will be removed from any " + partialMessage + ". " +
							"Are you sure you want to delete the field?";
					}

					return tf.promiseBootbox.yesNo({
						message: errorMessage,
						title: "Confirmation Message",
						closeButton: true
					});
				});
			}
		}

		this.deleteCheck(gridType, dataItem).then((result) =>
		{
			if (!result) { return; }
			deleteConfirmPromise().then(function(result)
			{
				if (!result) { return; }


				return tf.promiseAjax.delete(pathCombine(tf.api.apiPrefixWithoutDatabase(), self.endpoint, udfId));
			}).then(function(response)
			{
				if (!!response)
				{
					self.refreshGridByType(gridType);

					if (gridType !== _REPORT_GRID_TYPE)	//for Non-Report UDFs, update DetailView and GridView related Udf profile
					{
						tf.documentManagerViewModel.modifiedUDFIds.push(udfId);
						self.removeUdfInDetailViewTemplates(detailViewTemplates, udfId);
					}

					tf.exagoBIHelper.updateReportLayoutsForDeletedUDF(udfGuid);
				}
			}).catch(function(err)
			{
				// Nothing To do
			});
		});
	};

	UserDefinedFieldsPage.prototype.checkUdfInDetailViewTemplate = function(gridType, udfId)
	{
		var dataTypeId = tf.dataTypeHelper.getId(gridType);
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "detailscreens"), { paramData: { dataTypeId: dataTypeId } })
			.then(function(response)
			{
				if (response && response.Items)
				{
					return response.Items.map(function(template)
					{
						template.Layout = JSON.parse(template.Layout);
						return template;
					}).filter(function(template)
					{
						return template.Layout.items.some(function(item) { return item.UDFId === udfId; });
					});
				}
			});
	};

	UserDefinedFieldsPage.prototype.removeUdfInDetailViewTemplates = function(templates, udfId)
	{
		var self = this;

		templates.forEach(function(template)
		{
			template.Layout.items = template.Layout.items.map(function(item)
			{
				return item.UDFId !== udfId ? item : self.detailviewHelper.getCompatibleSpacer(item);
			});
			template.Layout = JSON.stringify(template.Layout);
			var url = pathCombine(tf.api.apiPrefixWithoutDatabase(), "detailscreens", template.Id);
			tf.promiseAjax.put(url, { data: template });
		});
	};

	UserDefinedFieldsPage.prototype.checkUdfInGridLayout = function(gridType, udfId)
	{
		return Promise.all([
			tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "gridlayouts"),
				{ paramData: { DataTypeID: tf.dataTypeHelper.getId(gridType) } }
			),
			tf.userPreferenceManager.getAllKey()
		]).then(function(values)
		{
			var currentAppliedLayouts = tf.userPreferenceManager.get(tf.storageManager.prefix + tf.storageManager.gridCurrentLayout(gridType)) || {};
			currentAppliedLayouts.inUserPreference = true;
			return values[0].Items.concat(currentAppliedLayouts).filter(function(item)
			{
				var layoutColumns = item.LayoutColumns;
				if (!Array.isArray(layoutColumns) && typeof layoutColumns === "string")
				{
					layoutColumns = JSON.parse(layoutColumns);
				}

				return (layoutColumns || []).some(function(c)
				{
					return c.UDFId === udfId;
				});
			});
		});
	}

	UserDefinedFieldsPage.prototype.checkUdfInGridFilter = function(gridType, udfName)
	{
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "gridfilters"), {
			paramData: {
				"@filter": String.format("eq(datatypeId,{0})", tf.dataTypeHelper.getId(gridType)),
			}
		}).then(function(r)
		{
			var checkName = `[${udfName}]`;
			return r.Items.filter(function(filter)
			{
				return (filter.WhereClause || "").indexOf(checkName) > -1;
			});
		});
	};

	UserDefinedFieldsPage.prototype.checkUdfInCaseUDF = function(gridType, udfName)
	{
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "userdefinedfields"), {
			paramData: {
				"@filter": String.format("eq(datatypeId,{0})&eq(TypeId,20)", tf.dataTypeHelper.getId(gridType)),
				"fields": "DefaultCase,CaseDetail"
			}
		}).then(function(r)
		{
			var checkName = `[${udfName}]`;
			return r.Items.filter(function(udf)
			{
				return (udf.DefaultCase || "").indexOf(checkName) > -1 || (udf.CaseDetail || "").indexOf(checkName) > -1;
			});
		});
	};

	/**
	 * Try detecting if the given Udf (by Guid) has been used in any of the existing Exago Reports' layout content
	 * Will return the Ids of reports that have used the given Udf
	 * 
	 */
	UserDefinedFieldsPage.prototype.checkUdfInAllReportLayouts = function(udfGuid)
	{
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "ExagoReportParameters"), {
			paramData: {
				"@fields": "ReportId",
				"@filter": String.format("eq(Name,LayoutFileContent)&contains(Value,.{0})", udfGuid)
			}
		}).then(function(resp)
		{
			if (!!resp && Array.isArray(resp.Items))
			{
				return resp.Items;
			}

			return [];
		}).catch(function()
		{
			return [];
		});
	}

	/**
	 * if filter or case is using this udf, this udf can not be deleted
	 */
	UserDefinedFieldsPage.prototype.deleteCheck = function(gridType, dataItem)
	{
		return Promise.all([
			this.checkUdfInGridFilter(gridType, dataItem.DisplayName),
			this.checkUdfInCaseUDF(gridType, dataItem.DisplayName)]).then((values) =>
			{
				var gridFilterUseCount = values[0].length,
					caseUDFUseCount = values[1].length,
					messages = [];
				if (gridFilterUseCount > 0)
				{
					messages.push("filters");
				}
				if (caseUDFUseCount > 0)
				{
					messages.push("case user defined fields");
				}
				if (messages.length === 0)
				{
					return true;
				}

				return tf.promiseBootbox.alert(
					{
						message: "This User Defined Field can't be deleted because it is being used in " + messages.join(" and "),
						title: "Confirmation Message",
					}).then(function()
					{
						return false;
					});
			});
	};

	/**
	 * Refresh the data grid by data type.
	 *
	 * @param {string} type
	 */
	UserDefinedFieldsPage.prototype.refreshGridByType = function(type)
	{
		var self = this,
			gridColumns = self.getGridColumnsByType(type);

		self.fetchGridData(type)
			.then(function(data)
			{
				if (type !== _REPORT_GRID_TYPE)
				{
					PubSub.publish(pb.REQUIRED_UDF_FIELDS_CHANGED, type);
				}

				self.udfChangedEvent.notify(type);	// Trigger udfChangedEvent for all DataTypes' Udf chagnes

				return data;
			})
			.then(function(data)
			{
				self.obCurrentUdfCount(data.length);
				self.kendoGrid.setOptions({
					dataSource: {
						data: data
					},
					columns: gridColumns
				});
			});

		if (type !== _REPORT_GRID_TYPE)
		{
			// tf.documentManagerViewModel.gridTypesContainModifiedUDF.push(type);
		}

	};

	/**
	 * Whenever there is UDF changes (add/remove/update), we need to notify ExagoReporting
	 * so that the Columns metadata of the changed DataType can be updated accordingly
	 *
	 * @param {string} type
	 */
	UserDefinedFieldsPage.prototype.onUdfChangedCallback = function(e, gridType)
	{
		var self = this,
			dataTypeId = tf.dataTypeHelper.getId(gridType);

		tf.exagoBIHelper.updateColumnMetadataForUDFs([dataTypeId]);
	};

	UserDefinedFieldsPage.prototype._getGridFooterLabel = function(count)
	{
		var self = this;
		return count + " User Defined " + self.pageType.substr(0, self.pageType.length - 1) + (count !== 1 ? "s" : "");
	};

	UserDefinedFieldsPage.prototype._backupScrollPosition = function()
	{
		const $content = this.kendoGrid.content;
		if ($content)
		{
			this._scrollPosition = { scrollTop: $content.scrollTop(), scrollLeft: $content.scrollLeft() };
		}
	}

	UserDefinedFieldsPage.prototype._restoreScrollPosition = function()
	{
		if (this._scrollPosition)
		{
			const $content = this.kendoGrid.content;
			if ($content)
			{
				$content.scrollTop(this._scrollPosition.scrollTop);
			}
			this._scrollPosition = null;
		}
	}

	UserDefinedFieldsPage.prototype.dispose = function()
	{
		this.selectedItemChanged.unsubscribeAll();
		this.udfChangedEvent.unsubscribeAll();
		TF.Page.BaseGridPage.prototype.dispose.apply(this);
	};
})();