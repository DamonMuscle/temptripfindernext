(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").RoutingStudentEditModal = RoutingStudentEditModal;

	function RoutingStudentEditModal(viewModel)
	{
		var self = this;
		TF.RoutingMap.BaseEditModal.call(this, {
			routingMapDocumentViewModel: viewModel.viewModel._viewModal,
			template: "workspace/Routing Map/RoutingMapPanel/RoutingPalette/EditRoutingStudent"
		});
		this.viewModel = viewModel.viewModel;
		this.dataModel = viewModel.dataModel;
		this.obDataModel = this.createObservableDataModel(this.getDataModel());

		// //modelType
		// this.isSetCreateOption = false;
		// if (modelType && modelType === 'set-Stops-Option')
		// {
		// 	this.isSetCreateOption = true;
		// }

		// // trips selector
		// this.obTrips = ko.observableArray([]);
		// this.obSelectedTrip = ko.observable({});
		// this.tripSelectTemplate = this.tripSelectTemplate.bind(this);
		// this.obSelectedTripText = ko.computed(function()
		// {
		// 	return this.obSelectedTrip().Name || "";
		// }, this);

		// this.isCopied = ko.observable(false);
		// this.isDoorToDoor = ko.observable(false);

		// // stop type selector
		// this.obStopTypes = ko.observableArray(["Polygon", "Rectangle", "Draw", "Circle", "Door-to-Door", "Walkout"]);
		// this.obSelectedStopType = ko.observable(self.obStopTypes()[4]);
		// this.obSelectedStopTypeText = ko.computed(function()
		// {
		// 	return this.obSelectedStopType();
		// }, this);

		// this.createTripBoundary = null;
		// this.showWalkout = ko.observable(true);
		// this.obIsSmartAssignment = ko.observable(false);
		// this.walkoutType = ko.observable(0);
		// this.walkoutDistance = ko.observable(100);
		// this.walkoutBuffer = ko.observable(30);
		// this.obUnits = ko.observableArray(["meters", "feet", "kilometers", "miles", "yards"]);
		// this.obSelectedDistanceUnit = ko.observable(this.obUnits()[0]);
		// this.obSelectedBufferUnit = ko.observable(this.obUnits()[0]);
		// this.obSelectedDistanceUnitText = ko.computed(function()
		// {
		// 	return this.obSelectedDistanceUnit();
		// }, this);
		// this.obSelectedBufferUnitText = ko.computed(function()
		// {
		// 	return this.obSelectedBufferUnit();
		// }, this);
		// this.disabled = ko.computed(function() { return this.showWalkout() == false; }, this);


	}

	RoutingStudentEditModal.prototype = Object.create(TF.RoutingMap.BaseEditModal.prototype);
	RoutingStudentEditModal.prototype.constructor = RoutingStudentEditModal;

	RoutingStudentEditModal.prototype.init = function()
	{
		// var self = this;
		// this.obCurrentPage(0);
		// this.obRecordsCount(this.data.length);
		// this.obTrips(self.dataModel.trips);
		// this.obSelectedTrip(self.dataModel.trips[0]);
		// this.obSelectedStopType(this.obStopTypes()[0]);
		// this.obIsSmartAssignment(false);
		// this.promise = new Promise(function(resolve, reject) { self.resolve = resolve; self.reject = reject; });
		// for (var key in this.obDataModel)
		// {
		// 	if (ko.isObservable(this.obDataModel[key]))
		// 	{
		// 		this.obDataModel[key]("");
		// 	}
		// }
		// this._enableKeyEnterApply();

		// var input = $("#walkoutDistance");
		// input.kendoNumericTextBox({
		// 	min: 0,
		// 	step: 1,
		// 	decimals: 0,
		// 	format: "0."
		// });
		// var input2 = $("#walkoutBuffer");
		// input2.kendoNumericTextBox({
		// 	min: 0,
		// 	step: 1,
		// 	decimals: 0,
		// 	format: "0."
		// });
		// $("#showWalkoutCheckbox").bind("change", function()
		// {
		// 	var numerictextbox = input.data("kendoNumericTextBox");

		// 	numerictextbox.enable(this.showWalkout());
		// 	numerictextbox.value(this.walkoutDistance());
		// }.bind(this));

		return Promise.resolve();
	};


	/**
	* this is the enter to open edit boundary modal
	*/
	RoutingStudentEditModal.prototype.showEditModal = function(editData)
	{
		var self = this;
		return self.beforeChangeData().then(function()
		{
			self.obOverlayVisible(false);
			var dataPromise;
			if (editData)
			{
				dataPromise = Promise.resolve(editData);
			} else
			{
				dataPromise = self.getAllHighlight();
			}
			dataPromise.then(function(data)
			{
				if (!data || data.length === 0)
				{
					return Promise.resolve();
				}
				self.initing = true;
				self.normalizeData(data);
				self.init().then(function()
				{
					self.initTitle(false);
					self.show();
					self.showCurrentData();
					self.initing = false;
				});
			});
		});
	};
	RoutingStudentEditModal.prototype.initTitle = function(isNew)
	{
		TF.RoutingMap.BaseEditModal.prototype.initTitle.call(this, isNew, "Student");
	};
	RoutingStudentEditModal.prototype.show = function()
	{
		this.obVisible(true);
		this.element.find("[name=street]").focus();
		this.element.find("div.body").scrollTop(0);
	};
	RoutingStudentEditModal.prototype.hide = function()
	{
		this.obVisible(false);
		this.obOverlayVisible(false);
		if (this.$form && this.$form.data("bootstrapValidator"))
		{
			this.$form.data("bootstrapValidator").destroy();
		}
		//this.onCloseEditModalEvent.notify();
		//this.viewModel._viewModal.onStopEditingEvent.notify()
	}
	RoutingStudentEditModal.prototype.applyClick = function()
	{
		var self = this;
		self.save().then(function(result)
		{
			if (result)
			{
				self.hide();
			}
		});
	};
	RoutingStudentEditModal.prototype.save = function()
	{
		var self = this;
		return self.pageLevelViewModel.saveValidate().then(function(result)
		{
			if (result)
			{
				if (self.mode() == "new")
				{
					self.hide();
					self._create();
				}
				else
				{
					var data = self.trimStringSpace(self.data);
					self.dataModel.tripStopDataModel.update(data);
					self.resolve(data);
				}
				self.pageLevelViewModel.clearError();
			}
			return result;
		});
	};
	RoutingStudentEditModal.prototype.showCurrentData = function()
	{
		var self = this;
		var data = this.data[this.obCurrentPage()];
		for (var key in self.obDataModel)
		{
			if (ko.isObservable(self.obDataModel[key]))
			{
				self.obDataModel[key](data[key]);
			}
		}
		self.obShowPaging(self.data.length > 1);
		setTimeout(function()
		{
			self.initValidation();
		}, 50);
	};
	RoutingStudentEditModal.prototype.getDataModel = function(editData)
	{
		return {
			id: 0,
			FirstName: "",
			LastName: "",
			School: "",
			SchoolCode: "",
			Grade: "",
			ProhibitCrosser: 0
		};
	}
})();