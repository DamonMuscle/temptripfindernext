(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette").RailroadEditModal = RailroadEditModal;
	var helper = TF.RoutingMap.MapEditingPalette.MyStreetsHelper

	function RailroadEditModal(viewModel)
	{
		var self = this;
		TF.RoutingMap.BaseEditModal.call(this, {
			routingMapDocumentViewModel: viewModel.viewModel._viewModal,
			template: "workspace/RoutingMap/RoutingMapPanel/MapEditingPalette/EditRailroad"
		});
		this.viewModel = viewModel;
		this.dataModel = viewModel.dataModel;
		this.obDataModel = this.getDataModel();
		this.dataModel.highlightChangedEvent.subscribe(this.highlightedSelectedChange.bind(this));
		this.isReadOnly = ko.observable(!tf.authManager.isAuthorizedFor('mapEdit', ['edit', 'add']));
	}

	RailroadEditModal.prototype = Object.create(TF.RoutingMap.BaseEditModal.prototype);
	RailroadEditModal.prototype.constructor = RailroadEditModal;

	RailroadEditModal.prototype.init = function()
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

	RailroadEditModal.prototype.initValidation = function()
	{
		var self = this;
		setTimeout(function()
		{
			self.$form = $(self.element);
			var validatorFields = {},
				isValidating = false;

			validatorFields.name = {
				trigger: "blur change",
				validators: {
					notEmpty: {
						message: "required"
					}
				}
			}
			if (self.$form.data("bootstrapValidator"))
			{
				self.$form.data("bootstrapValidator").destroy();
			}
			self.$form.bootstrapValidator({
				excluded: [],
				live: 'enabled',
				message: 'This value is not valid',
				fields: validatorFields
			}).on('success.field.bv', function(e, data)
			{
				if (!isValidating)
				{
					isValidating = true;
					self.pageLevelViewModel.saveValidate(data.element);
					isValidating = false;
				}
			});
			self.pageLevelViewModel.load(self.$form.data("bootstrapValidator"));
		})
	}

	RailroadEditModal.prototype.create = function(data)
	{
		var self = this;
		var createFromData = data;
		if (createFromData.paths)
		{
			createFromData = { geometry: data }
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
				}, 50)
			});
			return self.promise;
		})
	}

	/**
	* this is the enter to open edit boundary modal
	*/
	RailroadEditModal.prototype.showEditModal = function(editData)
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
	}

	RailroadEditModal.prototype.closeEditModal = function(e)
	{
		var self = this;
		self.hide();
		self.resolve();
	}

	RailroadEditModal.prototype.getAllHighlight = function()
	{
		return this.dataModel.lockData.filterUnLockItems(this.dataModel.highlighted);
	}

	RailroadEditModal.prototype.highlightedSelectedChange = function(e, items)
	{
		var self = this;
		if (this.obVisible() && self.mode() == "edit")
		{
			self.beforeChangeData(false).then(function()
			{
				self.initing = true;
				self.getAllHighlight().then(function(selected)
				{
					var currentId = self.data[self.obCurrentPage()].id;
					var currentData = self.data.slice();
					self.normalizeData(selected);
					var currentDataEnumerable = Enumerable.From(currentData);
					var currentStillExist = false;
					for (var i = 0; i < self.data.length; i++)
					{
						var oldItem = currentDataEnumerable.Where(function(x) { return x.id == self.data[i].id }).FirstOrDefault();
						if (self.data[i].id == currentId)
						{
							currentStillExist = true;
							self.obCurrentPage(i);
							self.showCurrentData();
						}
					}
					if (self.data.length > 0)
					{
						self.initTitle(false);
					}

					if (!currentStillExist)
					{
						if (self.data.length > 0)
						{
							self.obCurrentPage(0);
							self.showCurrentData();
						} else
						{
							self.closeEditModal();
						}
					}
					self.initing = false;
				});
			}).catch(function() { })
		}
	}


	RailroadEditModal.prototype.showCurrentData = function()
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
		//self.showMiddleArrow(data);
		setTimeout(function()
		{
			self.initValidation();
		}, 50);
	};

	RailroadEditModal.prototype.showMiddleArrow = function(data)
	{
		var map = this.viewModel.viewModel._viewModal._map
		var layer = map.findLayerById("railroadControlLayer");
		layer.removeAll();
		var ans = helper.calculateMiddlePos(data.geometry.paths[0], map);
		var graphic = helper.createMiddleArrowGraphic([ans.middlePos.x, ans.middlePos.y], ans.angle, map);
		layer.add(graphic);
		map.reorderLayer(layer, 50)
	}

	RailroadEditModal.prototype.show = function()
	{
		this.obVisible(true);
		this.element.find("[name=name]").focus();
		this.element.find("div.body").scrollTop(0);
	}

	RailroadEditModal.prototype.hide = function()
	{
		this.obVisible(false);
		this.obOverlayVisible(false);
		if (this.$form.data("bootstrapValidator"))
		{
			this.$form.data("bootstrapValidator").destroy();
		}
		this.onCloseEditModalEvent.notify();
		this.viewModel.viewModel._viewModal.onStopEditingEvent.notify()
		//this.viewModel.viewModel._viewModal._map.findLayerById("railroadControlLayer").removeAll();
	}

	RailroadEditModal.prototype.initTitle = function(isNew)
	{
		var mode = isNew ? "New" : "Edit";
		this.mode(mode.toLowerCase());
		if (this.data.length > 1)
		{
			this.obTitle(mode + " Segment (" + this.data.length + ")");
		} else
		{
			this.obTitle(mode + " Segment");

		}
		this.element.find(".boundaryEditModal .head").css({ "cursor": isNew ? "default" : "pointer" });
	}

	RailroadEditModal.prototype.normalizeData = function(data)
	{
		var self = this;
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
		})
		this.original = original;
		this.obRecordsCount(this.data.length);
	}

	RailroadEditModal.prototype.getDataModel = function()
	{
		var data = {};
		var self = this;
		var dataModel = this.dataModel.getDataModel();
		dataModel.locked = false
		for (var key in dataModel)
		{
			if (key == "geometry")
			{
				continue;
			}
			data[key] = ko.observable();
			data[key].subscribe(self.subscribeDataChange(key))
		}
		return data
	}

	RailroadEditModal.prototype.subscribeDataChange = function(key)
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
		}
	}

	RailroadEditModal.prototype.applyClick = function()
	{
		var self = this;
		self.save().then(function(result)
		{
			if (result)
			{
				self.hide();
			}
		})
	}

	RailroadEditModal.prototype.save = function()
	{
		var self = this;
		return self.pageLevelViewModel.saveValidate().then(function(result)
		{
			if (result)
			{
				if (self.mode() == "new")
				{
					var dataModel = self.dataModel.create(self.data[0]);
					self.resolve(null)
				}
				else
				{
					self.dataModel.update(self.data);
					self.resolve(self.data)
				}
				self.pageLevelViewModel.clearError();
			}
			return result;
		});
	}

	RailroadEditModal.prototype.cancelClick = function(modal, e)
	{
		e.stopPropagation();
		var self = this;
		var data = this.data;
		var confirmPromise = Promise.resolve(true);
		var dataSame = self._compareArrayObject(this.original, data)
		if (!dataSame)
		{
			confirmPromise = tf.promiseBootbox.yesNo("There are unsaved changes.  Are you sure you want to cancel?", "Unsaved Changes")
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
	}

	RailroadEditModal.prototype.focusGeometry = function()
	{
		this.viewModel.drawTool.glowAndVisibleGeometries([this.data[this.obCurrentPage()].geometry]);
	}

})()