(function()
{
	createNamespace("TF.Grid").ManageLayoutViewModel = ManageLayoutViewModel;

	function ManageLayoutViewModel(obGridLayoutExtendedDataModels, obGridFilterDataModels, fnSaveAndEditGridLayout, fnApplyGridLayout, positiveClose)
	{
		this.obGridLayoutExtendedDataModels = obGridLayoutExtendedDataModels;
		this.obGridFilterDataModels = obGridFilterDataModels;
		this.fnSaveAndEditGridLayout = fnSaveAndEditGridLayout;
		this.fnApplyGridLayout = fnApplyGridLayout;
		this.positiveClose = positiveClose;
		this.element = null;
		this.enableGridRefresh = true;
		this.layoutModelJSONString = null
	}

	ManageLayoutViewModel.prototype.init = function(viewModel, el)
	{
		this.element = $(el);
		if (this.enableGridRefresh)
		{
			this.initLayoutGrid();
		}
	};

	ManageLayoutViewModel.prototype.initLayoutGrid = function()
	{
		var self = this;
		var layouts = this.obGridLayoutExtendedDataModels().map(function(layout)
		{
			return layout.toData();
		});

		var grid = this.element.find(".managelayoutgrid-container").data("kendoGrid");
		if (grid)
		{
			grid.destroy();
		}

		this.element.find(".managelayoutgrid-container").kendoGrid(
			{
				dataSource:
				{
					data: layouts
				},
				height: 300,
				scrollable: true,
				selectable: true,
				columns: [
					{
						field: "Name",
						title: "Name"
					},
					{
						field: "Description",
						title: "Description"
					},
					{
						field: "FilterName",
						title: "Filter",
						template: function(data)
						{
							if (data.FilterId)
							{
								return data.FilterName;
							}
							return "";

						}
					},
					{
						field: "DataExportExists",
						title: "Data Export Layout",
						template: '<div class="#: tf.LayoutExtenstion.getDataExportImg(DataExportExists)#"></div>'
					},
					{
						command: [
							{
								name: "edit",
								template: '<a class="k-button k-button-icontext k-grid-edit" title="Edit"><span class="k-icon k-edit"></span>Edit</a>',
								click: function(e)
								{
									e.preventDefault();
									self.editGridLayout(self.getGridLayoutDataModel(e));
								}
							},
							{
								name: "delete",
								template: '<a class="k-button k-button-icontext k-grid-delete" title="Delete"><span class="k-icon k-delete"></span>Delete</a>',
								click: function(e)
								{
									e.preventDefault();
									self.deleteGridLayout(self.getGridLayoutDataModel(e));
								}
							}],
						width: "60px",
						title: "Action",
						attributes:
						{
							"class": "text-center"
						}
					}]
			});
		this.element.find(".managelayoutgrid-container .k-grid-content tr").dblclick(function(e)
		{
			var gridLayoutExtendedDataModel = this.getGridLayoutDataModel(e);
			this.fnApplyGridLayout(gridLayoutExtendedDataModel).then(function(ans)
			{
				if (ans !== false)
				{
					this.positiveClose();
				}
			}.bind(this));
		}.bind(this));

		var $gridContent = this.element.find(".k-grid-content");
		$gridContent.css(
			{
				"overflow-y": "auto"
			});

		if ($gridContent.children('table').height() <= $gridContent.height())
		{
			this.element.find('.k-grid-header').css(
				{
					'padding-right': '0'
				});
		}
	};

	ManageLayoutViewModel.prototype.getGridLayoutDataModel = function(e)
	{
		var data = this.element.find(".managelayoutgrid-container").data("kendoGrid").dataItem($(e.target).closest("tr"));
		return this.obGridLayoutExtendedDataModels().filter(function(item)
		{
			return item.id() === data.Id;
		})[0];
	};

	ManageLayoutViewModel.prototype.editGridLayout = function(gridLayout)
	{
		const editTask = this.fnSaveAndEditGridLayout("edit", gridLayout);
		this.enableGridRefresh = false;
		this.layoutModelJSONString = gridLayout ? JSON.stringify(gridLayout.toData()) : null;

		Promise.resolve(editTask)
			.then((result) =>
			{
				let resultLayoutModelJSONString = typeof result === "object" ? JSON.stringify(result.toData()) : null;
				if (resultLayoutModelJSONString && this.layoutModelJSONString !== resultLayoutModelJSONString)
				{
					this.initLayoutGrid();
				}
			}).finally(() =>
			{
				this.enableGridRefresh = true;
			});
	};

	ManageLayoutViewModel.prototype.deleteGridLayout = function(gridLayoutExtendedDataModel)
	{
		tf.promiseBootbox.yesNo("Are you sure you want to delete this layout?", "Delete Confirmation")
			.then(function(result)
			{
				if (result)
				{
					var self = this;
					tf.promiseAjax.delete(pathCombine(tf.api.apiPrefixWithoutDatabase(), "gridlayouts", gridLayoutExtendedDataModel.id()))
						.then(function(apiResponse)
						{
							if (apiResponse)
							{
								self.obGridLayoutExtendedDataModels.remove(gridLayoutExtendedDataModel);
							}
						});
				}
			}.bind(this));
	};
})();

(function()
{
	createNamespace("TF.Grid.Layout").LayoutExtenstion = LayoutExtenstion;

	function LayoutExtenstion()
	{ }

	LayoutExtenstion.prototype.getDataExportImg = function(value)
	{
		if (value)
		{
			return "dataexport";
		}
	};

	tf.LayoutExtenstion = new TF.Grid.Layout.LayoutExtenstion();

})();
