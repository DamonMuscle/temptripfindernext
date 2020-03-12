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
		self.schedulerButton = false;
	}

	ReportsPage.prototype = Object.create(TF.Page.BaseGridPage.prototype);
	ReportsPage.prototype.constructor = ReportsPage;

	ReportsPage.prototype.updateOptions = function()
	{
		var self = this;
		self.options.gridDefinition = tf.reportGridDefinition.gridDefinition();
		self.options.showOmittedCount = true;
		// TODO-V2, need to research
		self.options.url = pathCombine(tf.api.apiPrefix(), "search", "reports", "fieldtrip");
		self.options.loadUserDefined = false;
		self.options.selectable = "row";
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
		self.bindEvent(".iconbutton.vReport", function(model, e)
		{
			self.viewReport();
		});
	};

	ReportsPage.prototype._openBulkMenu = function()
	{
		if (!TF.isPhoneDevice)
		{
			var self = this;
			self.$element.delegate("table.k-selectable tr", "contextmenu", function(e)
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
			}.bind(this));
		}
	};

	ReportsPage.prototype.sendReportAsMail = function()
	{
		this.generateReport(null, "email", { gridViewModel: this });
	};

	ReportsPage.prototype.saveReportAsFile = function()
	{
		this.generateReport(null, "saveas", { gridViewModel: this });
	};
	ReportsPage.prototype.viewReport = function()
	{
		this.generateReport(null, "view", { gridViewModel: this });
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