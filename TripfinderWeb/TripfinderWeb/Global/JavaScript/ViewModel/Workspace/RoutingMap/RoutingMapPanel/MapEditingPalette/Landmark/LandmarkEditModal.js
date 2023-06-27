(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette").LandmarkEditModal = LandmarkEditModal;

	function LandmarkEditModal(viewModel)
	{
		TF.RoutingMap.BaseEditModal.call(this, {
			routingMapDocumentViewModel: viewModel.viewModel._viewModal,
			template: "workspace/RoutingMap/RoutingMapPanel/MapEditingPalette/EditLandmark"
		});
		this.viewModel = viewModel;
		this.dataModel = viewModel.dataModel;
		this.obDataModel = this.getDataModel();
		this.dataModel.highlightChangedEvent.subscribe(this.onHighLightChangedEvent.bind(this));
		this.isReadOnly = ko.observable(!tf.authManager.isAuthorizedFor('mapEdit', ['edit', 'add']));
	}

	LandmarkEditModal.prototype = Object.create(TF.RoutingMap.BaseEditModal.prototype);
	LandmarkEditModal.prototype.constructor = LandmarkEditModal;

	LandmarkEditModal.prototype.init = function()
	{
		var self = this;
		this.obCurrentPage(0);
		this.obRecordsCount(this.data.length);
		this.promise = new Promise(function(resolve, reject) { self.resolve = resolve; self.reject = reject; });
		for (var key in this.obDataModel)
		{
			if (ko.isObservable(this.obDataModel[key]))
			{
				this.obDataModel[key]("");
			}
		}
		self._enableKeyEnterApply();
		return Promise.resolve();
	};

	LandmarkEditModal.prototype.initValidation = function()
	{
		var self = this;
		setTimeout(function()
		{
			self.$form = $(self.element);
			var validatorFields = {},
				isValidating = false;

			if (self.$form.data("bootstrapValidator"))
			{
				self.$form.data("bootstrapValidator").destroy();
			}
			self.$form.bootstrapValidator({
				excluded: [],
				live: "enabled",
				message: "This value is not valid",
				fields: validatorFields
			}).on("success.field.bv", function(e, data)
			{
				if (!isValidating)
				{
					isValidating = true;
					self.pageLevelViewModel.saveValidate(data.element);
					isValidating = false;
				}
			});
			self.pageLevelViewModel.load(self.$form.data("bootstrapValidator"));
		});
	};

	LandmarkEditModal.prototype.create = function(data)
	{
		var self = this;
		var createFromData = data;
		if (createFromData.spatialReference)
		{
			createFromData = { geometry: data };
		}
		return self.beforeChangeData().then(function()
		{
			self.initing = true;
			var dataModel = $.extend(self.dataModel.getDataModel(), createFromData);
			dataModel.OBJECTID = 0;
			dataModel.id = TF.createId();
			self.obOverlayVisible(true);
			self.normalizeData(dataModel);
			self.init().then(function()
			{
				self.initTitle(true);
				self.showCurrentData();
				self.initing = false;
				self.show();
				setTimeout(function()
				{
					self.initValidation();
				}, 50);
			});
			return self.promise;
		});
	};

	/**
	* this is the enter to open edit boundary modal
	*/
	LandmarkEditModal.prototype.showEditModal = function(editData)
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

	LandmarkEditModal.prototype.closeEditModal = function()
	{
		var self = this;
		self.hide();
		self.resolve();
	};

	LandmarkEditModal.prototype.getAllHighlight = function()
	{
		return this.dataModel.lockData.filterUnLockItems(this.dataModel.highlighted);
	};

	LandmarkEditModal.prototype.showCurrentData = function()
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

	LandmarkEditModal.prototype.show = function()
	{
		this.obVisible(true);
		this.element.find("[name=name]").focus();
		this.element.find("div.body").scrollTop(0);
	};

	LandmarkEditModal.prototype.hide = function()
	{
		this.obVisible(false);
		this.obOverlayVisible(false);
		if (this.$form.data("bootstrapValidator"))
		{
			this.$form.data("bootstrapValidator").destroy();
		}
		this.onCloseEditModalEvent.notify();
		this.viewModel.viewModel._viewModal.onStopEditingEvent.notify();
	};

	LandmarkEditModal.prototype.initTitle = function(isNew)
	{
		TF.RoutingMap.BaseEditModal.prototype.initTitle.call(this, isNew, "Landmark");
		this.element.find(".boundaryEditModal .head").css({ "cursor": isNew ? "default" : "pointer" });
	};

	LandmarkEditModal.prototype.normalizeData = function(data)
	{
		if (!data)
		{
			data = {};
		}
		this.data = data;
		if (!$.isArray(data))
		{
			this.data = [data];
		}
		var original = [];
		this.data = this.data.map(function(item)
		{
			original.push($.extend({}, item));
			return $.extend({}, item);
		});
		this.original = original;
		this.obRecordsCount(this.data.length);
	};

	LandmarkEditModal.prototype.getDataModel = function()
	{
		var data = {};
		var self = this;
		var dataModel = this.dataModel.getDataModel();
		dataModel.locked = false;
		for (var key in dataModel)
		{
			if (key == "geometry")
			{
				continue;
			}
			data[key] = ko.observable();
			data[key].subscribe(self.subscribeDataChange(key));
		}
		return data;
	};

	LandmarkEditModal.prototype.subscribeDataChange = function(key)
	{
		var self = this;
		return function(value)
		{
			if (self.initing)
			{
				return;
			}
			var data = self.data[self.obCurrentPage()];
			data[key] = value;
		};
	};

	LandmarkEditModal.prototype.applyClick = function()
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

	LandmarkEditModal.prototype.save = function()
	{
		var self = this;
		return self.pageLevelViewModel.saveValidate().then(function(result)
		{
			if (result)
			{
				if (self.mode() == "new")
				{
					self.dataModel.create(self.dataModel.trimStringSpace(self.data[0]));
					self.resolve(null);
				}
				else
				{
					var data = self.dataModel.trimStringSpace(self.data);
					self.dataModel.update(data);
					self.resolve(data);
				}
				self.pageLevelViewModel.clearError();
			}
			return result;
		});
	};

	LandmarkEditModal.prototype.cancelClick = function(modal, e)
	{
		e.stopPropagation();
		var self = this;
		var data = this.data;
		var confirmPromise = Promise.resolve(true);
		var dataSame = self._compareArrayObject(this.original, data);
		if (!dataSame)
		{
			confirmPromise = tf.promiseBootbox.yesNo("There are unsaved changes.  Are you sure you want to cancel?", "Unsaved Changes");
		}
		confirmPromise.then(function(result)
		{
			if (result === true)
			{
				self.pageLevelViewModel.clearError();
				self.hide();
				self.resolve();
			}
		});
	};

	LandmarkEditModal.prototype.focusGeometry = function()
	{
		this.viewModel.drawTool.glowAndVisibleGeometries([this.data[this.obCurrentPage()].geometry]);
	};

})();