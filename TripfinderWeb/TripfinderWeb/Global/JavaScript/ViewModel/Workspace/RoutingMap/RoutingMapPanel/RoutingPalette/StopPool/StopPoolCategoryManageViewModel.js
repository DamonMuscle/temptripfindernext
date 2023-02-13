(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").StopPoolCategoryManageViewModel = StopPoolCategoryManageViewModel;
	function StopPoolCategoryManageViewModel(modal, viewModel)
	{
		this.modal = modal;
		this.element = null;
		this.viewModel = viewModel;
		this.kendoGrid = null;
	}

	StopPoolCategoryManageViewModel.prototype.init = function(viewModel, el)
	{
		var self = this;
		this.element = $(el);
		var dataSourceGridContainer = $(el).find(".kendo-grid");
		dataSourceGridContainer.kendoGrid({
			dataSource: new kendo.data.DataSource({
				data: []
			}),
			change: function()
			{
				var selectRow = self.kendoGrid.select();
				if (selectRow.length)
				{
					self.selectRow = self.kendoGrid.dataItem(selectRow);
					self.modal.obDisableControl(false);
				}
			},
			selectable: "row",
			height: 275,
			dataBound: function()
			{
				self.updateSelection();
			},
			columns: [
				{
					title: "Name",
					field: "Name",
				}, {
					title: "Action",
					width: 100,
					attributes: {
						"class": "text-center"
					},
					template: function(dataItem)
					{
						var css = "k-button k-button-icontext";
						if (dataItem.Name == "Default")
						{
							css += " disabled-element";
						}

						var content = '<a class="k-button k-button-icontext k-grid-edit" href="#"><span class="k-icon k-edit"></span>Edit</a><a class="' + css + ' k-grid-delete" href="#"><span class=" "></span>delete</a>';
						return content;
					}
				}
			]
		});

		this.kendoGrid = dataSourceGridContainer.data("kendoGrid");

		this.refreshData();

		var $gridContent = dataSourceGridContainer.find(".k-grid-content");
		$gridContent.css({
			"overflow-y": "auto"
		});

		$gridContent.delegate("tr", "dblclick", function()
		{
			self.apply().then(function()
			{
				self.modal.positiveClose();
			});
		});

		$gridContent.on("click", '.k-button.k-button-icontext.k-grid-edit', function(e)
		{
			self.eventClick(e, "edit");
		});

		$gridContent.on("click", '.k-button.k-button-icontext.k-grid-delete', function(e)
		{
			self.eventClick(e, "delete");
		});
	};

	StopPoolCategoryManageViewModel.prototype.selectDefaultCategory = function()
	{
		var self = this, data = self.kendoGrid.dataSource.data(), defaultItem = data.find(function(i) { return i.Name == "Default" });
		self.viewModel.dataModel.openCategory(defaultItem);
	};

	StopPoolCategoryManageViewModel.prototype.updateSelection = function()
	{
		var self = this;
		if (self.selectRow)
		{
			var items = self.kendoGrid.items();
			var findSelectedRow = false;
			for (var i = 0; i < items.length; i++)
			{
				var row = $(items[i]).closest("tr");
				var dataItem = self.kendoGrid.dataItem(row);
				if (dataItem.id == self.selectRow.Id)
				{
					self.kendoGrid.select(row);
					findSelectedRow = true;
					break;
				}
			}
			if (!findSelectedRow)
			{
				self.modal.obDisableControl(true);
			}
		}
	};

	StopPoolCategoryManageViewModel.prototype.refreshData = function()
	{
		var self = this;
		tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "stoppoolcategories"), {
			paramData: {
				dbid: tf.datasourceManager.databaseId
			}
		}).then(function(apiResponse)
		{
			var data = apiResponse.Items;
			var dataSource = new kendo.data.DataSource({
				data: data
			});
			self.kendoGrid.setDataSource(dataSource);
			self.fitHeight();
			if (data.length === 0)
			{
				self.modal.obDisableControl(true);
			}
		});
	};

	StopPoolCategoryManageViewModel.prototype.fitHeight = function()
	{
		var self = this;
		var $gridContent = self.element.find(".k-grid-content");
		setTimeout(function()
		{
			if ($gridContent[0].clientHeight == $gridContent[0].scrollHeight)
			{
				self.element.find(".k-grid-header").css({
					"padding-right": 0
				});
			}
		}, 10);
	};

	StopPoolCategoryManageViewModel.prototype.newStopPoolCategoryButtonClick = function(viewModel, e)
	{
		this.eventClick(e, "new");
	};

	/**
	* open stop pool category
	*/
	StopPoolCategoryManageViewModel.prototype.apply = function()
	{
		var self = this;
		return new Promise(function(resolve, reject)
		{
			var currentTarget = self.kendoGrid.dataItem(self.kendoGrid.select());
			if (currentTarget == null)
			{
				reject();
				return;
			}
			self.viewModel.dataModel.openCategory(currentTarget);
			resolve(true);
		});
	};

	StopPoolCategoryManageViewModel.prototype.eventClick = function(e, eventType)
	{
		e.preventDefault();
		var data;
		var self = this;
		if (eventType != "new")
		{
			data = this.kendoGrid.dataItem($(e.target).closest("tr"));
		}
		if (eventType == "delete")
		{
			tf.promiseBootbox.yesNo(
				{
					message: "Are you sure you want to delete this stop pool category?",
					closeButton: true
				}, "Confirmation").then(function(ans)
				{
					if (ans)
					{
						if (data.Id == tf.storageManager.get("automation-SelectedStopPoolCategoryId") && tf.storageManager.get("automation-UseStopPool") != 'False')
						{
							return tf.promiseBootbox.alert('This category is used in the automation setting, you need to change the setting before delete.');
						}

						tf.promiseAjax.delete(pathCombine(tf.api.apiPrefixWithoutDatabase(), "stoppoolcategories", data.Id))
							.then(function(apiResponse)
							{
								if (apiResponse == 0)
								{
									tf.promiseBootbox.alert("At least keep one category", "Alert");
								}
								else
								{
									self.updateRecords();
									self.refreshData();
									var selectedCategory = self.viewModel.dataModel.selectedCategory();
									self.viewModel.dataModel.deleteCategory(data.Id);
									if (!selectedCategory || selectedCategory.Id == data.Id)
									{
										self.selectDefaultCategory();
									}
								}
							}).catch(function(exception)
							{
								tf.promiseBootbox.alert(exception.Message, "Alert");
							});
					}
				});
		} else if (eventType == "edit")
		{
			self.showEditModal(data, eventType);
		} else
		{
			self.showEditModal(data, eventType);
		}
	};

	StopPoolCategoryManageViewModel.prototype.showEditModal = function(data, eventType)
	{
		var self = this;
		tf.modalManager.showModal(new TF.RoutingMap.RoutingPalette.StopPoolCategoryModalViewModel(data, eventType)).then(function(ans)
		{
			if (ans)
			{
				self.updateRecords();
				self.refreshData();
				self.viewModel.dataModel.initStopPoolCategory();
				self.viewModel.dataModel.updateSelectedCategory(ans);
			}
		});
	};

	StopPoolCategoryManageViewModel.prototype.updateRecords = function()
	{
		var updatedRecords = [{
			Id: "",
			Type: "StopPoolCategory",
			Operation: ""
		}];
		return TF.RoutingMap.MapUpdatedRecordsHubHelper.prototype.updateRecords(updatedRecords, "MenuDataUpdatedHub");
	};
})();