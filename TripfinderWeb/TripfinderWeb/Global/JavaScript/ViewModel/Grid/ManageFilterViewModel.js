(function()
{
	createNamespace("TF.Grid").ManageFilterViewModel = ManageFilterViewModel;

	ManageFilterViewModel.prototype = Object.create(TF.Control.BaseControl.prototype);
	ManageFilterViewModel.prototype.constructor = ManageFilterViewModel;
	function ManageFilterViewModel(obGridFilterDataModels, fnSaveAndEditGridFilter, fnApplyGridFilter, positiveClose, reminderHide)
	{
		this.fnSaveAndEditGridFilter = fnSaveAndEditGridFilter;
		this.fnApplyGridFilter = fnApplyGridFilter;
		this.obGridFilterDataModels = obGridFilterDataModels;
		this.positiveClose = positiveClose;
		this.element = null;
		this.reminderHide = reminderHide;
		this.enableGridRefresh = true;
		this.filterModelJSONString = null;

		this.onFilterEdited = new TF.Events.Event();
		this.onFilterDeleted = new TF.Events.Event();
	}

	ManageFilterViewModel.prototype.init = function(viewModel, el)
	{
		this.element = $(el);
		this.needCheckFormFilterDataTypes = tf.DataTypeHelper.getFormCheckFilterDataTypes().map(a => a.ID);
		if (this.enableGridRefresh)
		{
			this.initFilterGrid();
		}
	}

	ManageFilterViewModel.prototype.initFilterGrid = function(viewModel, el)
	{
		var self = this;
		var filters = this.obGridFilterDataModels().map(function(filter)
		{
			return filter.toData();
		}).filter(function(filter)
		{
			return filter.Type !== "relatedFilter";
		});

		var grid = this.element.find(".managefiltergrid-container").data("kendoGrid");
		if (grid)
		{
			grid.destroy();
		}

		var columns = [
			{
				width: '30px',
				type: "image",
				template: '<div title="#: tf.ManageFilterViewModel.getIconTitle_IsValid(IsValid,Id)#" class="#: tf.ManageFilterViewModel.getIconUrl_IsValid(IsValid,Id)#"></div>'
			},
			{ field: "Name", title: "Filter Name", encoded: true },
			{
				field: "DBID",
				title: "Available in all data sources",
				template: (item) =>
				{
					const checked = item.DBID == null ? "checked" : "";
					return `<input type="checkbox" disabled ${checked} />`
				},
				attributes:
				{
					"class": "text-center"
				}
			},
			{
				command: [
					{
						name: "edit",
						template: '<a class="k-button k-button-icontext k-grid-edit" title="Edit"><span class="k-icon k-edit"></span>Edit</a>',
						click: function(e)
						{
							e.preventDefault();
							var currentModel = self.getGridFilterDataModel(e);
							if (currentModel.id() < 0)
							{
								return;
							}
							self.editGridFilter(currentModel);
						}
					},
					{
						name: "view",
						template: '<a class="k-button k-button-icontext k-grid-view" title="View"></a>',
						click: function(e)
						{
							e.preventDefault();
							var currentModel = self.getGridFilterDataModel(e);
							if (currentModel.id() < 0 || currentModel.isSystem())
							{
								return;
							}
							self.fnSaveAndEditGridFilter("view", currentModel, null, false);
						}
					}, {
						name: "copyandnew",
						template: '<a class="k-button k-button-icontext k-grid-copyandnew" title="Copy And New"><span class=" "></span>copyandnew</a>',
						click: function(e)
						{
							e.preventDefault();
							var currentModel = self.getGridFilterDataModel(e);
							if (currentModel.id() < 0)
							{
								return;
							}
							self.fnSaveAndEditGridFilter("new", currentModel, false, false);
						}
					}, {
						name: "delete",
						template: '<a class="k-button k-button-icontext k-grid-delete" title="Delete"><span class=" "></span>delete</a>',
						click: function(e)
						{
							e.preventDefault();
							var currentModel = self.getGridFilterDataModel(e);
							const isCurrentDBFilter = tf.helpers.kendoGridHelper.isCurrentDBFilter(currentModel.dBID());
							if (!isCurrentDBFilter)
							{
								return;
							}
							if (currentModel.id() < 0 || currentModel.isSystem())
							{
								return;
							}
							self.deleteGridFilter(currentModel);
						}
					}],
				title: "Action",
				width: "90px",
				attributes: {
					"class": "text-center"
				}
			}];

		if (!this.reminderHide)
		{
			columns.splice(3, 0, { field: "ReminderName", title: "Reminder" });
		}

		this.element.find(".managefiltergrid-container").kendoGrid({
			dataSource: {
				data: filters
			},
			height: 300,
			scrollable: true,
			selectable: true,
			columns: columns,
			dataBound: (d) =>
			{
				const $gridContainer = this.element.find(".managefiltergrid-container");
				var $footer = $gridContainer.find(".k-grid-footer");
				if ($footer.length === 0)
				{
					$gridContainer.append("<div class='k-grid-footer'>0 Record</div>");
					$footer = $gridContainer.find(".k-grid-footer");
				}

				const lineHeight = 22;
				$gridContainer.height($gridContainer.height() + lineHeight);

				const count = d.sender.dataSource._data.length;
				const footerLabel = `${count} record${(count === 0 || count > 1) ? "s" : ""}`;
				$footer.text(footerLabel);
			}
		});

		this.element.find(".managefiltergrid-container tr").each(function(n, item)
		{
			var data = this.element.find(".managefiltergrid-container").data("kendoGrid").dataItem($(item));
			if (!tf.permissions.filtersEdit)
			{
				$(item).find(".k-grid-edit").css("display", "none");
			}
			if (!tf.permissions.filtersDelete)
			{
				$(item).find(".k-grid-delete").css("display", "none");
			}
			if (data && data.Id < 0)
			{
				$(item).find(".k-grid-edit,.k-grid-copyandnew,.k-grid-delete").addClass("disable");
			}

			const isCurrentDBFilter = tf.helpers.kendoGridHelper.isCurrentDBFilter(data.DBID);
			if (isCurrentDBFilter)
			{
				$(item).find(".k-grid-view").hide();
			}
			else
			{
				$(item).find(".k-grid-delete").addClass("disable");
				$(item).find(".k-grid-edit").hide();
			}
		}.bind(this));

		//double click
		this.element.find(".managefiltergrid-container .k-grid-content tr").dblclick(function(e)
		{
			var gridFilterDataModel = this.getGridFilterDataModel(e);
			if (!tf.helpers.kendoGridHelper.isCurrentDBFilter(gridFilterDataModel.dBID()))
			{
				return;
			}
			this.positiveClose();
			this.fnApplyGridFilter(gridFilterDataModel);
		}.bind(this));

		var $gridContent = this.element.find(".k-grid-content");
		$gridContent.css({
			"overflow-y": "auto"
		});

		if ($gridContent.children('table').height() <= $gridContent.height())
		{
			this.element.find('.k-grid-header').css({
				'padding-right': '0'
			});
		}
	};

	ManageFilterViewModel.prototype.getIconTitle_IsValid = function(value, id)
	{
		if (id < 0)
		{
			return 'Filter is a Dashboard Drill Down. It cannot be modified.';
		}
		if (!value)
		{
			return 'Filter syntax is invalid. It cannot be applied.';
		}
		else
		{
			return '';
		}
	};

	ManageFilterViewModel.prototype.getIconUrl_IsValid = function(value, id)
	{
		if (id < 0)
		{
			return 'grid-icon grid-icon-DrillDownBlack';
		}
		if (!value)
		{
			return 'grid-icon grid-icon-BrokenFilterBlack';
		}
		else
		{
			return '';
		}
	};

	ManageFilterViewModel.prototype.getGridFilterDataModel = function(e)
	{
		var data = this.element.find(".managefiltergrid-container").data("kendoGrid").dataItem($(e.target).closest("tr"));
		return this.obGridFilterDataModels().filter(function(item)
		{
			return item.id() === data.Id;
		})[0];
	};

	ManageFilterViewModel.prototype.deleteGridFilter = function(gridFilterDataModel)
	{
		var self = this,
			isWithoutDB = gridFilterDataModel.dBID() === null,
			dataTypeID = gridFilterDataModel.dataTypeID(),
			needCheckFormFilter = isWithoutDB && self.needCheckFormFilterDataTypes.indexOf(dataTypeID) > -1,
			checkUDGridsWithFilterId = !needCheckFormFilter ?
				Promise.resolve([]) :
				tf.udgHelper.checkUDGridsWithFilterIdInSpecifyRecord(dataTypeID, gridFilterDataModel.id());
		if (gridFilterDataModel.autoExportExists())
		{
			const exportsHolder = (gridFilterDataModel.autoExports() && gridFilterDataModel.autoExports().length > 1) ? "data exports" : "data export";
			tf.promiseBootbox.alert(`This filter is associated with the [${gridFilterDataModel.autoExportNames()}] ${exportsHolder}. It cannot be deleted.`);
			return;
		}

		// only check without datasource and specify data type
		checkUDGridsWithFilterId.then(res =>
		{
			if (res.Items && res.Items[0] && res.Items[0].length > 0)
			{
				// now get firt 3 names show
				let formNames = res.Items[0].length === 1 ? `${res.Items[0]} form` : `${res.Items[0].slice(0, 3).join(", ")} forms`;
				tf.promiseBootbox.alert(`This filter is in use on the ${formNames}. It must remain available for all data sources.`);
				return;
			}

			self._dbConfirmDeleteAction.bind(self)(gridFilterDataModel)
				.then(function(result)
				{
					self._executeDeleteAction.bind(self)(result, gridFilterDataModel);
				});
		});
	};

	ManageFilterViewModel.prototype._dbConfirmDeleteAction = function(gridFilterDataModel)
	{
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "gridlayouts?filterId=" + gridFilterDataModel.id()))
			.then(function(apiResponse)
			{
				var displayMessage = '';
				if (apiResponse.length)
					displayMessage = 'This Filter is associated with one or more Layouts.  Deleting it will remove it from those Layouts.  Are you sure you want to delete?';
				else
					displayMessage = 'Are you sure you want to delete this Filter?';

				return tf.promiseBootbox.yesNo(displayMessage, "Delete Confirmation").then(function(result)
				{
					return result;
				});
			});
	};

	ManageFilterViewModel.prototype._executeDeleteAction = function(result, gridFilterDataModel)
	{
		var self = this;
		if (result)
		{
			var filterId = gridFilterDataModel.id();
			tf.promiseAjax.delete(pathCombine(tf.api.apiPrefixWithoutDatabase(), "gridfilters", filterId))
				.then(function(apiResponse)
				{
					const filterKey = `grid.currentfilter.${gridFilterDataModel.gridType()}.id`;
					var currentStickFilterId = tf.storageManager.get(filterKey);
					if (currentStickFilterId === filterId)
					{
						tf.storageManager.save(filterKey, '');
					}

					if (apiResponse > 0)
					{
						self.obGridFilterDataModels.remove(gridFilterDataModel);
						self.initFilterGrid();
					}

					self.onFilterDeleted.notify(filterId);
				});
		}
	};

	ManageFilterViewModel.prototype.newFilterButtonClick = function(viewModel, e)
	{
		this.fnSaveAndEditGridFilter("new", null, false, false, { title: "New Filter" });
	};

	/**
	 * Edit grid filter.
	 *
	 * @param {*} gridFilter
	 */
	ManageFilterViewModel.prototype.editGridFilter = function(gridFilter)
	{
		const editTask = this.fnSaveAndEditGridFilter("edit", gridFilter, null, false);
		this.enableGridRefresh = false;
		this.filterModelJSONString = gridFilter ? JSON.stringify(gridFilter.toData()) : null;

		Promise.resolve(editTask)
			.then((result) =>
			{
				let resultFilterModelJSONString = typeof result === "object" ? JSON.stringify(result.toData()) : null;
				if (resultFilterModelJSONString && this.filterModelJSONString !== resultFilterModelJSONString)
				{
					this.initFilterGrid();
				}
			}).finally(() =>
			{
				this.enableGridRefresh = true;
			});
	};
	tf.ManageFilterViewModel = new TF.Grid.ManageFilterViewModel();
})();
