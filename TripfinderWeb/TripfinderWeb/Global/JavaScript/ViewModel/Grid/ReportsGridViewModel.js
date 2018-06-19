(function()
{
	createNamespace("TF.Grid").ReportsGridViewModel = ReportsGridViewModel;

	function ReportsGridViewModel(obDocumentFocusState, element, kendoGridState, gridShowType, defaultGridLayoutExtendedEntity, showBulkMenu, option, view, dataEntryObjects)
	{
		TF.Page.BaseGridPage.call(this, obDocumentFocusState, element, kendoGridState, gridShowType, showBulkMenu, false, option, view, dataEntryObjects);
		this.type = "reports";
		this.options.gridDefinition = tf.reportGridDefinition.gridDefinition();
		this.options.showSelectedCount = false;
		this.options.showOmittedCount = false;
		this.options.gridTypeInPageInfo = "Reports";
		this.options.selectable = "row";
		this.createGrid(this.options);
		this.obShowSplitmap.subscribe(this.showListView, this);
		this.obShowSplitmap.subscribe(this.showGridView, this);
		this.obListViewArray = ko.observableArray([]);
		this.obActiveListViewBaseDataType = ko.observable('Alternate Site');
		this.obSearchParam = ko.observable('');
		this.cpReportsList = ko.observableArray([]);
		this.obActiveListViewBaseDataType.subscribe(this.showListViewType, this);
		this.dataTypeList = ReportsGridViewModel.dataTypeList;
		this.cpReportInTypeTotalCount = ko.computed(function()
		{
			return this.getListByType(this.obActiveListViewBaseDataType()).reports.length;
		}, this);



	}

	ReportsGridViewModel.prototype = Object.create(TF.Page.BaseGridPage.prototype);

	ReportsGridViewModel.prototype.constructor = ReportsGridViewModel;

	ReportsGridViewModel.prototype._viewfromDBClick = function() { };

	ReportsGridViewModel.prototype.showListView = function()
	{
		if (this.obShowSplitmap() && this.obListViewArray().length === 0)
		{
			this.favoriteChange = false;
			this.getListViewRecord();
		}
	};

	ReportsGridViewModel.prototype._openBulkMenu = function()
	{
		this.$container.delegate("table.k-selectable tr", "mousedown", function(e)
		{
			if (e.button == 2)
			{
				$(e.currentTarget).trigger('click');
				this.targetID(this.searchGrid.kendoGrid.dataItem(e.currentTarget).Id);
				var $virsualTarget = $("<div></div>").css(
					{
						position: "absolute",
						left: e.clientX,
						top: e.clientY
					});
				$("body").append($virsualTarget);
				tf.contextMenuManager.showMenu($virsualTarget, new TF.ContextMenu.BulkContextMenu(pathCombine("workspace/grid", this.type, "bulkmenu"), new TF.Grid.GridMenuViewModel(this, this.searchGrid)));
				//$virsualTarget.remove();
				return false;
			}
			return true;
		}.bind(this));
	};

	ReportsGridViewModel.prototype.showGridView = function()
	{
		if (!this.obShowSplitmap() && this.favoriteChange)
		{
			this.searchGrid.refreshClick();
		}
	};


	ReportsGridViewModel.prototype.showListViewType = function()
	{
		var dataType = this.obActiveListViewBaseDataType();
		var search = $.trim(this.obSearchParam());
		this.cpReportsList(Enumerable.From(this.getListByType(dataType).reports).Where(function(c)
		{
			return search == "" || c.Name.indexOf(search) > -1 || c.Version.indexOf(search) > -1 || c.Comments.indexOf(search) > -1;
		}).OrderByDescending("$.Favorite").ThenBy("$.Name").ToArray());
	};

	ReportsGridViewModel.prototype.getListViewRecord = function()
	{
		var self = this;
		tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "search", "reports")).then(function(response)
		{
			var datas = response.Items;
			var listViewArrayGrouped = Enumerable.From(datas).GroupBy("$.TypeName").ToArray();
			var listViewArray = [];
			for (var i = 0, l = listViewArrayGrouped.length; i < l; i++)
			{
				listViewArray.push(
					{
						typeName: listViewArrayGrouped[i].Key(),
						reports: listViewArrayGrouped[i].source
					});
			}
			self.obListViewArray(listViewArray);
			self.showListViewType();
		});
	};

	ReportsGridViewModel.prototype.getDataTypeCount = function(dataType)
	{
		return this.getListByType(dataType).reports.length;
	};

	ReportsGridViewModel.prototype.getListByType = function(type)
	{
		return Enumerable.From(this.obListViewArray()).Where("$.typeName=='" + type + "'").FirstOrDefault(
			{
				typeName: type,
				reports: []
			});
	};

	ReportsGridViewModel.prototype.changeDataType = function(typeName)
	{
		this.obActiveListViewBaseDataType(typeName);
	};

	ReportsGridViewModel.prototype.searchList = function(model, e)
	{
		if (e.keyCode && e.keyCode != 13)
		{
			return true;
		}
		this.obSearchParam($(e.target).closest("div").find("input").val());
		this.showListViewType();
	};

	ReportsGridViewModel.prototype.refreshClick = function()
	{
		if (this.obShowSplitmap())
		{
			this.getListViewRecord();
		}
		else
		{
			this.searchGrid.refreshClick();
		}
	};

	ReportsGridViewModel.prototype.openReportUserInformationModel = function()
	{
		tf.modalManager.showModal(new TF.Modal.ReportUserInformationModalViewModel());
	};

	ReportsGridViewModel.prototype.openManageYouReportsModel = function()
	{
		tf.modalManager.showModal(new TF.Modal.ManageReportsModalViewModel()).then(function(ans)
		{
			if (ans)
			{
				this.refreshClick();
				this.favoriteChange = true;
			}
		}.bind(this));
	};

	ReportsGridViewModel.prototype.setFavorite = function(report)
	{
		var array = this.cpReportsList();
		var item = Enumerable.From(array).Where("$.RepFileName=='" + report.RepFileName + "'").First();
		item.Favorite = !item.Favorite;
		this.cpReportsList([]);
		this.cpReportsList(array);
		tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "report", "changefavorite"),
			{
				data: item
			});
		this.favoriteChange = true;
	};


	ReportsGridViewModel.prototype.generateReport = function(udReport, type, gridMenuViewModel)
	{
		var self = this;
		if (!udReport)
		{
			self = gridMenuViewModel.gridViewModel;
			var selectedId = gridMenuViewModel.searchGrid.getSelectedIds()[0];
			udReport = Enumerable.From(gridMenuViewModel.searchGrid.kendoGrid.dataSource.data()).Where('$.Id==' + selectedId).First();
		}
		tf.modalManager.showModal(new TF.Modal.GenerateReportModalViewModel(udReport, type));
	};


	ReportsGridViewModel.dataTypeList = [
		{
			id: 6,
			name: 'Alternate Site',
			gridType: 'altsite',
			displayName: tf.applicationTerm.getApplicationTermPluralByName('Alternate Site')
		},
		{
			id: 13,
			name: 'Busfinder',
			displayName: 'Busfinder'
		},
		{
			id: 3,
			name: 'Contractor',
			gridType: 'contractor',
			displayName: tf.applicationTerm.getApplicationTermPluralByName('Contractor')
		},
		{
			id: 2,
			name: 'District',
			gridType: 'district',
			displayName: tf.applicationTerm.getApplicationTermPluralByName('District')
		},
		{
			id: 10,
			name: 'Field Trip',
			gridType: 'fieldtrip',
			displayName: tf.applicationTerm.getApplicationTermPluralByName('Field Trip')
		},
		{
			id: 9,
			name: 'Other',
			displayName: 'Other'
		},
		{
			id: 1,
			name: 'School',
			gridType: 'school',
			displayName: tf.applicationTerm.getApplicationTermPluralByName('School')
		},
		{
			id: 5,
			name: 'Staff',
			gridType: 'staff',
			displayName: tf.applicationTerm.getApplicationTermPluralByName('Staff')
		},
		{
			id: 0,
			name: 'Student',
			gridType: 'student',
			displayName: tf.applicationTerm.getApplicationTermPluralByName('Student')
		},
		{
			id: 7,
			name: 'Trip',
			gridType: 'trip',
			displayName: tf.applicationTerm.getApplicationTermPluralByName('Trip')
		},
		{
			id: -99,
			name: 'Unknown',
			displayName: 'Unknown'
		},
		{
			id: 4,
			name: 'Vehicle',
			gridType: 'vehicle',
			displayName: tf.applicationTerm.getApplicationTermPluralByName('Vehicle')
		}];

})();
