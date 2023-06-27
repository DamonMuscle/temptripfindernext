(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").RoutingStudentEditModal = RoutingStudentEditModal;

	function RoutingStudentEditModal(viewModel)
	{
		TF.RoutingMap.BaseEditModal.call(this, {
			routingMapDocumentViewModel: viewModel.viewModel._viewModal,
			template: "workspace/RoutingMap/RoutingMapPanel/RoutingPalette/EditRoutingStudent"
		});
		this.viewModel = viewModel.viewModel;
		this.dataModel = viewModel.dataModel;
		this.obDataModel = this.createObservableDataModel(this.getDataModel());
	}

	RoutingStudentEditModal.prototype = Object.create(TF.RoutingMap.BaseEditModal.prototype);
	RoutingStudentEditModal.prototype.constructor = RoutingStudentEditModal;

	RoutingStudentEditModal.prototype.init = function()
	{
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