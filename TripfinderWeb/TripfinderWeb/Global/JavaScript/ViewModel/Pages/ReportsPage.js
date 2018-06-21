(function()
{
	createNamespace("TF.Page").ReportsPage = ReportsPage;

	function ReportsPage()
	{
		var self = this;
		self.type = "reports";
		self.pageType = "reports";
		TF.Page.BaseGridPage.apply(self, arguments);
		self.cancelButton = false;
		self.detailButton = false;
	}

	ReportsPage.prototype = Object.create(TF.Page.BaseGridPage.prototype);
	ReportsPage.prototype.constructor = ReportsPage;

	ReportsPage.prototype.updateOptions = function()
	{
		var self = this;
		self.options.gridDefinition = tf.reportGridDefinition.gridDefinition();
		self.options.showOmittedCount = false;
		self.options.url = pathCombine(tf.api.apiPrefix(), "search", "reports", "fieldtrip");
		self.options.storageKey = "grid.currentlayout." + self.pageType;
		self.options.loadUserDefined = false;
		self.options.selectable = "row";

		self.options.summaryFilters = [{
			Id: -1,
			Name: "Today",
			IsValid: true
		},
		{
			Id: -2,
			Name: "Vehicle Scheduled",
			IsValid: true
		},
		{
			Id: -3,
			Name: "Pending Approval",
			IsValid: true,
			WhereClause: " FieldTripStageId = 1 or FieldTripStageId = 3 or FieldTripStageId = 5 or FieldTripStageId = 7",
			GridType: self.type
		},
		{
			Id: -4,
			Name: "Declined",
			IsValid: true,
			WhereClause: "FieldTripStageId = 2 or FieldTripStageId = 4 or FieldTripStageId = 6 or FieldTripStageId = 98",
			GridType: self.type
		},
		{
			Id: -5,
			Name: "Total",
			IsValid: true,
			WhereClause: "FieldTripStageId != 100",
			GridType: self.type
		},
		{
			Id: -6,
			Name: "Transportation Approved",
			IsValid: true,
			WhereClause: "FieldTripStageId = 99",
			GridType: self.type
		}
		];
	};

	ReportsPage.prototype.bindButtonEvent = function()
	{
		var self = this;
		TF.Page.BaseGridPage.prototype.bindButtonEvent.call(self);
		self.bindEvent(".iconbutton.mail", function(model, e)
		{
			self.sendReportAsMail();
		});
		self.bindEvent(".iconbutton.file", function(model, e)
		{
			self.saveReportAsFile();
		});
	};

	ReportsPage.prototype._openBulkMenu = function()
	{
		var self = this;
		self.$element.delegate("table.k-selectable tr", "mousedown", function(e)
		{
			if (e.button == 2)
			{
				$(e.currentTarget).trigger('click');
				self.targetID(self.searchGrid.kendoGrid.dataItem(e.currentTarget).Id);
				var $virsualTarget = $("<div></div>").css(
					{
						position: "absolute",
						left: e.clientX,
						top: e.clientY
					});
				$("body").append($virsualTarget);
				tf.contextMenuManager.showMenu($virsualTarget, new TF.ContextMenu.BulkContextMenu(pathCombine("Workspace/Page/grid", self.type, "bulkmenu"), new TF.Grid.GridMenuViewModel(self, self.searchGrid)));
				return false;
			}
			return true;
		}.bind(this));
	};

	ReportsPage.prototype.sendReportAsMail = function()
	{
		this.generateReport(null, "email", { gridViewModel: this });
	};

	ReportsPage.prototype.saveReportAsFile = function()
	{
		this.generateReport(null, "saveas", { gridViewModel: this });
	};

	ReportsPage.prototype.showDetailsClick = function()
	{
		return;
	};

	ReportsPage.prototype.generateReport = function(udReport, type, gridMenuViewModel)
	{
		var self = this;
		if (!udReport)
		{
			self = gridMenuViewModel.gridViewModel;
			var selectedId = self.searchGrid.getSelectedIds()[0];
			udReport = Enumerable.From(self.searchGrid.kendoGrid.dataSource.data()).Where('$.Id==' + selectedId).First();
		}
		tf.modalManager.showModal(new TF.Modal.GenerateReportModalViewModel(udReport, type));
	};

	ReportsPage.prototype.dispose = function()
	{
		var self = this;
		TF.Page.BaseGridPage.prototype.dispose.call(self);
	};
})();