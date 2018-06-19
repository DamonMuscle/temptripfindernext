(function()
{
	createNamespace("TF.Control").ManageReportsViewModel = ManageReportsViewModel;

	ManageReportsViewModel.prototype = Object.create(TF.Control.BaseControl.prototype);
	ManageReportsViewModel.prototype.constructor = ManageReportsViewModel;

	function ManageReportsViewModel()
	{
		var self = this;
		self.element = null;
		self.originData = null;
		self.isFirstLoad = true;
		self.totalCount = 0;
		self.selectedReports = ko.observableArray([]);
	}

	ManageReportsViewModel.prototype.init = function(viewModel, el)
	{
		var self = this;
		self.element = $(el);
		self.initGrid();
		self.initEvent();
	};

	ManageReportsViewModel.prototype.initGrid = function()
	{
		var self = this, allSelected = true;
		self.searchGrid = new TF.Grid.LightKendoGrid(self.element.find(".kendo-grid"),
			{
				gridDefinition:
				{
					Columns: [
						{
							FieldName: "Id",
							DisplayName: "Id",
							Width: '30px',
							sortable: false,
							filterable: false,
							template: function(data)
							{
								return "<div><input type='checkbox' " + (data.Selected ? "checked" : "") + "/></div>";
							},
							headerTemplate: '<input type="checkbox" class="all"  />'
						},
						{
							FieldName: 'Name',
							DisplayName: "Name",
							Width: '170px',
							type: "string"
						},
						{
							FieldName: 'Comments',
							DisplayName: "Description",
							type: "string"
						},
						{
							FieldName: 'Layout',
							Width: '80px',
							DisplayName: "Layout",
							type: "string"
						},
						{
							FieldName: 'Version',
							DisplayName: "Version",
							Width: '80px',
							type: "string"
						},
						{
							FieldName: "CreatedDate",
							DisplayName: "Created Date",
							Width: '120px',
							type: "date"
						},
						{
							FieldName: "CreatedTime",
							DisplayName: "Created Time",
							Width: '100px',
							type: "time"
						}]
				},
				gridType: "reportsmanage",
				isSmallGrid: true,
				loadUserDefined: false,
				url: pathCombine(tf.api.apiPrefix(), "search", "reportmanage"),
				showBulkMenu: false,
				showLockedColumn: false,
				height: 400,
				selectable: false,
				kendoGridOption:
				{
					scrollable: true,
					dataSource:
					{
						pageSize: 20000
					}
				},
				initFilter: { FieldName: "TypeName", Operator: "EqualTo", Value: "Field Trip", TypeHint: "String" },
				onDataBound: function()
				{
					self.originData = Enumerable.From(self.searchGrid.kendoGrid.dataSource.data()).Where('$.Selected').ToArray();
					if (self.isFirstLoad)
					{
						self.totalCount = self.originData.length;
						self.isFirstLoad = false;
					}
					if (self.originData.length === 0)
					{
						allSelected = false;
					}
					else
					{
						for (var i = 0; i < self.originData.length; i++)
						{
							if (!self.originData[i].Selected)
							{
								allSelected = false;
								break;
							}
						}
					}

					if (allSelected)
					{
						self.element.find(":checkbox.all").prop("checked", true);
					}

					self.formatCreateTime(self.originData);
					self.selectedReports(self.originData);

					self.searchGrid.$container.children(".k-pager-wrap").find(".pageInfo").html(self.originData.length + " of " + self.totalCount);
				}
			});
	};

	ManageReportsViewModel.prototype.formatCreateTime = function(list)
	{
		list.forEach(function(item)
		{
			item.Created = toISOStringWithoutTimeZone(moment(item.Created));
		});
	};

	ManageReportsViewModel.prototype.initEvent = function()
	{
		var self = this;
		this.element.delegate(':checkbox', 'click', function(e)
		{
			self.selectedReports([]);
			var checkbox = $(e.currentTarget);
			if (checkbox.hasClass('all'))
			{
				self.element.find(":checkbox").prop("checked", checkbox.prop("checked"));
			}
			else
			{
				self.element.find(":checkbox.all").prop("checked", self.element.find(":checkbox:checked:not(.all)").length == self.element.find(":checkbox:not(.all)").length)
			}

			self.element.find(":checkbox:checked:not(.all)").each(function(index, item)
			{
				var tr = $(item).closest("tr");
				var dataItem = self.searchGrid.kendoGrid.dataItem(tr);
				self.selectedReports.push(dataItem);
			});
			self.formatCreateTime(self.selectedReports());
		});
	};

	ManageReportsViewModel.prototype.isChange = function()
	{
		var currentData = Enumerable.From(this.selectedReports()).Select('$.RepFileName').OrderBy('$.RepFileName').ToArray();
		var originData = Enumerable.From(this.originData).Select('$.RepFileName').OrderBy('$.RepFileName').ToArray();
		return currentData.toString() != originData.toString();
	};

	ManageReportsViewModel.prototype.reset = function()
	{
		this.searchGrid.refreshClick();
	};

	ManageReportsViewModel.prototype.apply = function()
	{
		var self = this;
		return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), 'report', 'refreshAllEntities'),
			{
				data: self.selectedReports()
			});
	};

})();
