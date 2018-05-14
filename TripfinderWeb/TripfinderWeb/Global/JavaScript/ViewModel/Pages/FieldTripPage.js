(function() {
	createNamespace("TF.Page").FieldTripPage = FieldTripPage;

	function FieldTripPage() {
		var self = this;
		self.type = "fieldtrip";
		self.searchGridInited = ko.observable(false);
		self.options = {};
	}

	FieldTripPage.prototype.constructor = FieldTripPage;

	FieldTripPage.prototype.init = function(model, element) {
		var self = this;
		self.$element = $(element);

		self.options.gridDefinition = tf.fieldTripGridDefinition.gridDefinition();
		self.options.showOmittedCount = false;

		self.updateOptions();
		self.createGrid(self.options);
		self.initSearchGridCompute();
	};

	FieldTripPage.prototype.updateOptions = function() {
		var self = this;
		self.options.url = pathCombine(tf.api.apiPrefix(), "search", "fieldtripforviewfindergrid");
		self.options.gridDefinition = tf.fieldTripGridDefinition.gridDefinition();
		self.options.storageKey = "grid.currentlayout." + self.type;
		self.options.loadUserDefined = false;

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
		self.options.summaryFilterFunction = function(selectGridFilterEntityId) {
			if (selectGridFilterEntityId == -1 || selectGridFilterEntityId == -2) {
				return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "statistics", "fieldtripdepartingtrips")).then(function(response) {
					return response.Items[0];
				});
			}
			if (selectGridFilterEntityId == -3 || selectGridFilterEntityId == -4 ||
				selectGridFilterEntityId == -5 || selectGridFilterEntityId == -6) {
				return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "statistics", "fieldtrip")).then(function(response) {
					switch (selectGridFilterEntityId) {
						case -3:
							return response.AwaitingApprovalList;
						case -4:
							return response.RejectedList;
						case -5:
							return response.TotalList;
						case -6:
							return response.TransportationApprovedList;
						default:
							return null;
					}
				});
			}
			return Promise.resolve(null);
		};
	};

	FieldTripPage.prototype.createGrid = function(option) {
		var self = this,
			baseOptions = {
				storageKey: "grid.currentlayout." + self.type,
				gridType: self.type,
				showBulkMenu: true,
				showLockedColumn: true,
				showOmittedCount: option.showOmittedCount,
				showSelectedCount: option.showSelectedCount,
				gridTypeInPageInfo: option.gridTypeInPageInfo,
				supportMobileMultipleSelect: true,
				reminderOptionHide: true,
				url: pathCombine(tf.api.apiPrefix(), "search", self.type)
			};

		self.searchGrid = new TF.Grid.KendoGrid(self.$element.find('.kendo-grid-container'), $.extend(baseOptions, option), new TF.Grid.GridState({
			gridFilterId: null,
			filteredIds: option.filteredIds
		}));
		self.searchGrid.filterMenuClick = self.searchGrid.filterMenuClick.bind(self);
		self.searchGrid.onRowsChanged.subscribe(function(e, data) {
			self.selectedRecordIds = Enumerable.From(data).Select(function(c) {
				return c.Id;
			}).ToArray();
		}.bind(self));
		self.searchGrid.onDoubleClick.subscribe(function(e, data) {
			if (!self.obShowSplitmap() && self.type !== "busfinderhistorical" && tf.pageManager.pageType() !== "3" && self.searchGrid.getSelectedIds().length > 0) {
				self.showDetailsClick();
			}
		});

		self.searchGridInited(true);
	};

	FieldTripPage.prototype.initSearchGridCompute = function() {
		var self = this;
		self.obSelectedGridLayoutModified = ko.computed(function() {
			return self.searchGridInited() && self.searchGrid.obSelectedGridLayoutModified();
		}, self);

		self.obSelectedGridFilterModifiedMessage = ko.computed(function() {
			return self.searchGridInited() && self.searchGrid.obSelectedGridFilterModifiedMessage();
		}, self);

		self.obSelectedGridFilterName = ko.computed(function() {
			return self.searchGridInited() && self.searchGrid.obSelectedGridFilterName();
		}, self);
		self.obSelectedGridFilterName.subscribe(function(result) {
			setTimeout(function() {
				self.updateResizePanel();
			});
		});
		self.obSelectedGridLayoutName = ko.computed(function() {
			return self.searchGridInited() && self.searchGrid.obSelectedGridLayoutName();
		}, self);
		self.obSelectedGridLayoutName.subscribe(function(result) {
			setTimeout(function() {
				self.updateResizePanel();
			});
		});
		self.obSummaryGridVisible = ko.computed(function() {
			return self.searchGridInited() && self.searchGrid.obSummaryGridVisible();
		}, self);
		self.noApplyFilterNoModified = ko.computed(function() {
			return self.searchGridInited() && self.searchGrid.noApplyFilterNoModified();
		}, self);
	};
})();