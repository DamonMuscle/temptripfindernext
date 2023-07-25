(function ()
{
	createNamespace("TF.Page").ReportsPage = ReportsPage;

	function ReportsPage()
	{
		var self = this;
		self.type = "report";
		self.pageType = "reports";
		TF.Page.BaseGridPage.apply(self, arguments);
		self.supportShortcut = false;
		self.cancelButton = false;
		self.detailButton = false;
		self.disableDoubleClick = true;
		self.schedulerButton = false;
	}

	ReportsPage.prototype = Object.create(TF.Page.BaseGridPage.prototype);
	ReportsPage.prototype.constructor = ReportsPage;

	ReportsPage.prototype.updateOptions = function ()
	{
		var self = this;
		self.options.gridDefinition = tf.reportGridDefinition.gridDefinition();
		self.options.showOmittedCount = true;
		// TODO-V2, need to research
		//self.options.url = pathCombine(tf.api.apiPrefixWithoutDatabase(), "search", "ExagoReports?dataTypeId=7");
		self.options.loadUserDefined = false;
		self.options.selectable = "row";
		var staticFilter = new TF.FilterItem("DataTypeName", "EqualTo", "Field Trip");
		self.options.setRequestOption = function (options)
		{
			if (options.data.filterSet && options.data.filterSet.FilterItems)
			{
				options.data.filterSet.FilterItems.push(staticFilter);
			}
			else
			{
				options.data.filterSet = {
					FilterItems: [staticFilter],
					FilterSets: []
				}
			}
			//options.paramData.filterSet = [staticFilter];
			return options;

		}
		self.options.setRequestURL = function ()
		{
			return tf.api.apiPrefixWithoutDatabase() + "/search/ExagoReports";
		};

	};

	ReportsPage.prototype.bindButtonEvent = function ()
	{
		var self = this;
		TF.Page.BaseGridPage.prototype.bindButtonEvent.call(self);
		self.bindEvent(".iconbutton.mail", function (model, e)
		{
			self.sendReportAsMail();
		});
		// self.bindEvent(".iconbutton.file", function(model, e)
		// {
		// 	self.saveReportAsFile();
		// });
		// self.bindEvent(".iconbutton.vReport", function(model, e)
		// {
		// 	self.viewReport();
		// });
		self.bindEvent(".iconbutton.runreport", function (model, e)
		{
			self.runSelectedReportClick();
		});
	};
	ReportsPage.prototype.runSelectedReportClick = function (vm, e)
	{
		var self = this,
			selectedId = self.searchGrid.getSelectedIds()[0];

		tf.exagoReportDataHelper.fetchReportWithMetadata(selectedId)
			.then(function (entity)
			{
				if (!entity) 
				{
					throw "Failed to load report with Filters and Parameters information."
				}

				return tf.modalManager.showModal(new TF.Modal.Report.ExagoBIRunReportModalViewModel(
					{
						editOnly: false,
						entity: entity
					}
				));
			}).catch(function (err)
			{
				tf.promiseBootbox.alert(err);
			});
	};

	ReportsPage.prototype._openBulkMenu = function ()
	{
		if (!TF.isPhoneDevice)
		{
			var self = this;
			self.$element.delegate("table.k-selectable tr", "contextmenu", function (e)
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

	ReportsPage.prototype.sendReportAsMail = function ()
	{
		this.generateReport(null, "email", { gridViewModel: this });
	};

	ReportsPage.prototype.saveReportAsFile = function ()
	{
		this.generateReport(null, "saveas", { gridViewModel: this });
	};
	ReportsPage.prototype.viewReport = function ()
	{
		this.generateReport(null, "view", { gridViewModel: this });
	};

	ReportsPage.prototype.generateReport = function (udReport, type, gridMenuViewModel)
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

	ReportsPage.prototype.dispose = function ()
	{
		var self = this;
		TF.Page.BaseGridPage.prototype.dispose.call(self);
	};
})();