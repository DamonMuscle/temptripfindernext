(function()
{
	createNamespace('TF.Control').NewGridWithSelectedRecordsViewModel = NewGridWithSelectedRecordsViewModel;
	function NewGridWithSelectedRecordsViewModel(selectedIds, gridViewModel, kendoGrid, newGridWithSelectedRecordsModalViewModel)
	{
		this.selectedIds = selectedIds;
		this.gridViewModel = gridViewModel;
		this.kendoGrid = kendoGrid;
		this.openSelectedClick = this.openSelectedClick.bind(this);
		this.relatedClickGen = this.relatedClickGen.bind(this);
		this.cancelClick = this.cancelClick.bind(this);
		this.newGridWithSelectedRecordsModalViewModel = newGridWithSelectedRecordsModalViewModel;
		this.initial()
	}

	NewGridWithSelectedRecordsViewModel.prototype.initial = function()
	{
		$("#pageMenu .show-menu-button").css('z-index', '1');
	};

	NewGridWithSelectedRecordsViewModel.prototype.openSelectedClick = function(viewModel, e)
	{
		//the filter will sticky once open a new grid, so save the sticky information in DB
		var storageFilterDataKey = "grid.currentfilter." + this.gridViewModel.type + ".id";
		var filterName = $(e.currentTarget).text().trim() + ' (Selected Records)';
		Promise.all([
			TF.Grid.FilterHelper.clearQuickFilter(this.gridViewModel.type),
			tf.storageManager.save("grid.currentlayout." + this.gridViewModel.type + ".id", ''),
			tf.storageManager.save(storageFilterDataKey,
			{
				"filteredIds": this.selectedIds,
				"filterName": filterName
			},true)
		]).then(function(){
			window.open('#/' + tf.storageManager.get("viewfinder.route"));
			return this.newGridWithSelectedRecordsModalViewModel.negativeClick();
		}.bind(this));
	};

	NewGridWithSelectedRecordsViewModel.prototype.relatedClickGen = function(type, subUrl, e)
	{
		var self = this;
		var fromMenu = e.currentTarget?$(e.currentTarget).find(".menu-label").text().trim():$(e).text().trim();
		var toGridType = tf.applicationTerm.getApplicationTermPluralByName(tf.modalHelper.Mappings[type]);
		var fromGridType = tf.applicationTerm.getApplicationTermPluralByName(tf.modalHelper.Mappings[this.gridViewModel.type]);
		var filterName = toGridType + ' (' + fromMenu + ' for Selected ' + fromGridType + ')';
		sessionStorage.setItem("openRelated", JSON.stringify(
		{
			"type": type,
			"subUrl": subUrl,
			"filterName": filterName,
			"selectedIds": self.selectedIds
		}));
		window.open('#/' + tf.pageManager.getPageId(type));
		return this.newGridWithSelectedRecordsModalViewModel.negativeClick();
	};

	NewGridWithSelectedRecordsViewModel.prototype.cancelClick = function(e, viewmodel)
	{
		return this.newGridWithSelectedRecordsModalViewModel.negativeClick();
	};

	NewGridWithSelectedRecordsViewModel.prototype.showTodoWarningClick = function()
	{
		//window.clipboardData.setData("Text", "test!");
		this.kendoGrid.gridAlert.show(
		{
			message: "Not Implement!"
		});
	};

})();
