(function()
{
	createNamespace("TF.UserDefinedField").GeofenceEditModal = GeofenceEditModal;

	function GeofenceEditModal(viewModel)
	{
		TF.RoutingMap.BaseEditModal.call(this, {
			routingMapDocumentViewModel: viewModel
		});
		this.obDataModel = this.createObservableDataModel(this.getDataModel());
		this.viewModel = viewModel;
		this.dataModel = null;
		this.defaultColor = "#57a5e8";
		this.defalultFillPattern = TF.RoutingMap.BoundaryPalette.FillPattern.SemiTransparent;
		this.isReadOnly = ko.observable(!tf.authManager.authorizationInfo.isAdmin);
	}

	GeofenceEditModal.prototype = Object.create(TF.RoutingMap.BaseEditModal.prototype);
	GeofenceEditModal.prototype.constructor = GeofenceEditModal;

	GeofenceEditModal.prototype.init = function()
	{
		var self = this;
		this.obCurrentPage(0);
		this.dataModel = this.viewModel.geofencePaletteViewModel.dataModel;
		this.obRecordsCount(this.data.length);
		this.promise = new Promise(function(resolve, reject) { self.resolve = resolve; self.reject = reject; });
		this.obDataModel.name("");
		this.obDataModel.fillPattern("");
		this.obDataModel.color("");
		return Promise.resolve(true);
	};

	GeofenceEditModal.prototype.getDataModel = function()
	{
		return {
			name: "",
			color: "",
			fillPattern: "",
			geometry: null
		};
	};

	GeofenceEditModal.prototype.create = function(boundary)
	{
		var self = this;
		return self.beforeChangeData().then(function()
		{
			self.normalizeData(boundary);
			self.init().then(function()
			{
				self.initTitle(true);
				self.initing = false;
				self.obCollapsed(false);
				self.obDataModel.fillPattern(TF.RoutingMap.BoundaryPalette.FillPattern.SemiTransparent);
				self.obDataModel.color(self.defaultColor);
				self.original = $.extend({}, self.data);
				let geofence = self.dataModel.create(self.data[0]);
				self.viewModel.$element.find(".add-parcel").removeClass("active");
				self.resolve(geofence);
			});
			return self.promise;
		});
	};

	GeofenceEditModal.prototype.getAllHighlight = function()
	{
		return Promise.resolve(this.dataModel.highlighted); //this.dataModel.getEditableHighlightedPopulationRegion();
	};

	GeofenceEditModal.prototype._compareArrayObject = function(a, b)
	{
		return this._compareArrayObjectInProperty(a, b, ["name", "fillPattern", "color"]);
	};

	GeofenceEditModal.prototype.focusGeometry = function()
	{
		this.viewModel.geofencePaletteViewModel.drawTool.glowAndVisibleGeometries([this.data[this.obCurrentPage()].geometry]);
	};

})();