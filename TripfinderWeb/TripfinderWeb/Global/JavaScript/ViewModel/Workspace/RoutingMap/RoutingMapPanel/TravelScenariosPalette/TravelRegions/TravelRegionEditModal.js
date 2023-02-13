(function()
{
	createNamespace("TF.RoutingMap.TravelScenariosPalette").TravelRegionEditModal = TravelRegionEditModal;

	function TravelRegionEditModal(viewModel)
	{
		TF.RoutingMap.BaseEditModal.call(this, {
			routingMapDocumentViewModel: viewModel._viewModal,
			template: "workspace/RoutingMap/RoutingMapPanel/TravelScenariosPalette/EditTravelRegion"
		});
		this.viewModel = viewModel;
		this.obType = ko.observable();
		this.obPreferRatio = ko.observable(0.5);
		this.obRestrictRatio = ko.observable(2);
		this.obChangeTime = ko.observable(false);
		this.obName = ko.observable();
		this.obName.subscribe(this.obNameChange.bind(this));
		this.obMultipleChange = ko.observable(false);
		this.dataModel = viewModel.dataModel;
		this.obType.subscribe(this.obTypeChange.bind(this));
		this.obPreferRatio.subscribe(this.obTypeChange.bind(this));
		this.obRestrictRatio.subscribe(this.obTypeChange.bind(this));
		this.obChangeTime.subscribe(this.obTypeChange.bind(this));
		this.dataModel.highlightChangedEvent.subscribe(this.highlightedSelectedChange.bind(this));
		this.isReadOnly = ko.observable(!tf.authManager.isAuthorizedFor('mapEdit', ['edit', 'add']));
	}

	TravelRegionEditModal.prototype = Object.create(TF.RoutingMap.BaseEditModal.prototype);
	TravelRegionEditModal.prototype.constructor = TravelRegionEditModal;

	TravelRegionEditModal.prototype.init = function()
	{
		var self = this;
		this.obCurrentPage(0);
		this.obRecordsCount(this.data.length);
		this.promise = new Promise(function(resolve, reject) { self.resolve = resolve; self.reject = reject; });
		this.obName("");
		this.obType("leave");
		this._enableKeyEnterApply();
		return Promise.resolve(true);
	}

	TravelRegionEditModal.prototype.initValidation = function()
	{
		function isNumber(n)
		{
			return !isNaN(parseFloat(n)) && isFinite(n) && n > 0;
		}
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

	TravelRegionEditModal.prototype.create = function(boundary)
	{
		var self = this;
		return self.beforeChangeData().then(function()
		{
			self.initing = true;
			self.obOverlayVisible(true);
			self.normalizeData(boundary);
			self.init().then(function()
			{
				self.initTitle(true);
				self.initing = false;
				self.obCollapsed(false);
				self.obType(TF.RoutingMap.MapEditingPalette.Type.Preferred);
				self.obPreferRatio(0.5);
				self.obRestrictRatio(2);
				self.show();

				self.applyLastEnterValue();
				if (boundary.type != null)
				{
					self.obType(boundary.type);
				}
				self.original = $.extend({}, self.data);
				setTimeout(function()
				{
					//rebuild validation to clear the old one ,because this form just hide and show, not close
					self.initValidation();
				}, 50)
			});
			return self.promise;
		})
	}

	/**
	* this is the enter to open edit boundary modal
	*/
	TravelRegionEditModal.prototype.showEditModal = function(editData)
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
				dataPromise = self.getAllHighlightBoundaries();
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

	TravelRegionEditModal.prototype.closeEditModal = function(e)
	{
		var self = this;
		self.hide();
		self.resolve();
	}

	TravelRegionEditModal.prototype.getAllHighlightBoundaries = function()
	{
		return this.dataModel.getEditableHighlightedTravelRegion();
	}

	TravelRegionEditModal.prototype.highlightedSelectedChange = function(e, items)
	{
		var self = this;
		if (this.obVisible() && self.mode() == "edit")
		{
			self.beforeChangeData(false).then(function()
			{
				self.initing = true;
				self.getAllHighlightBoundaries().then(function(selected)
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

	TravelRegionEditModal.prototype.obNameChange = function(value)
	{
		if (this.initing)
		{
			return;
		}
		var data = this.data[this.obCurrentPage()];
		data.name = value;
	}

	TravelRegionEditModal.prototype.obTypeChange = function()
	{
		if (this.initing)
		{
			return;
		}
		var data = this.data[this.obCurrentPage()];
		data.type = this.obType();

		data.weight = data.type == TF.RoutingMap.MapEditingPalette.Type.Preferred ? this.obPreferRatio() : this.obRestrictRatio();
		data.isChangeTime = this.obChangeTime() ? 1 : 0;

	}

	TravelRegionEditModal.prototype.showCurrentData = function()
	{
		var self = this;
		var data = this.data[this.obCurrentPage()];
		self.obName(data.name);
		data.type == TF.RoutingMap.MapEditingPalette.Type.Preferred ? self.obPreferRatio(data.weight) : self.obRestrictRatio(data.weight);
		self.obChangeTime(data.isChangeTime);
		self.obShowPaging(self.data.length > 1);
		self.obType(data.type);
		setTimeout(function()
		{
			//rebuild validation to clear the old one ,because this form just hide and show, not close
			self.initValidation();
		}, 50)
	}

	TravelRegionEditModal.prototype.show = function()
	{
		this.obVisible(true);
	}

	TravelRegionEditModal.prototype.hide = function()
	{
		this.obVisible(false);
		this.obOverlayVisible(false);
		if (this.$form && this.$form.data("bootstrapValidator"))
		{
			this.$form.data("bootstrapValidator").destroy();
		}
		this.onCloseEditModalEvent.notify();
		this.viewModel._viewModal.onStopEditingEvent.notify()
	}

	TravelRegionEditModal.prototype.initTitle = function(isNew)
	{
		var mode = isNew ? "New" : "Edit";
		this.mode(mode.toLowerCase());
		if (this.data.length > 1)
		{
			this.obTitle(mode + " Travel Regions (" + this.data.length + ")");
		} else
		{
			this.obTitle(mode + " Travel Region");

		}
		this.element.find(".travelEditModal .head").css({ "cursor": isNew ? "default" : "pointer" });
	}

	TravelRegionEditModal.prototype.normalizeData = function(data)
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

	TravelRegionEditModal.prototype.applyClick = function()
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

	TravelRegionEditModal.prototype.SaveTravelRegion = function()
	{
		var self = this;
		if (self.mode() == "new")
		{
			var travelRegion = self.dataModel.create(self.data[0]);
			self.setLastEnterValue(travelRegion);
			self.resolve(travelRegion)
		}
		else
		{
			var allDataTemplate = null;
			if (self.obMultipleChange())
			{
				allDataTemplate = self.data[self.obCurrentPage()]
			}
			self.data.forEach(function(item)
			{
				if (allDataTemplate)
				{
					item.type = allDataTemplate.type;
				}
			})
			self.dataModel.update(self.data);
			self.resolve(self.data)
		}
		self.pageLevelViewModel.clearError();
	};

	TravelRegionEditModal.prototype.save = function()
	{
		var self = this;
		return self.pageLevelViewModel.saveValidate()
			.then(function(result)
			{
				if (result)
				{
					var checkPromise = Promise.resolve(false);

					if (self.obType() == 2)
					{
						checkPromise = TF.RoutingMap.TravelScenariosPalette.TravelRegionsViewModel.isTripStopInTravelRegion(self.data[0].geometry, self.viewModel.dataModel.selectedTravelScenarioId);
					}
					return checkPromise.then((isTripStopInTravelRegion) =>
					{
						if (isTripStopInTravelRegion) { return; }
						self.SaveTravelRegion();
						return true;
					});
				}
				return result;
			});
	};

	TravelRegionEditModal.prototype.cancelClick = function(modal, e)
	{
		e.stopPropagation();
		var self = this;
		var data = this.data;
		var confirmPromise = Promise.resolve(true);
		if (!self._compareArrayObject(this.original, data))
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

	TravelRegionEditModal.prototype._compareArrayObject = function(a, b)
	{
		return this._compareArrayObjectInProperty(a, b, ["name", "type"])
	}

	TravelRegionEditModal.prototype.applyLastEnterValue = function()
	{
		var self = this;
		var lastValue = tf.storageManager.get("travelRegion-last-create-value");
		if (lastValue)
		{
			self.obType(lastValue.type == null ? 1 : lastValue.type);
		}
	}

	TravelRegionEditModal.prototype.setLastEnterValue = function(boundary)
	{
		tf.storageManager.save("travelRegion-last-create-value", boundary);
	}

	TravelRegionEditModal.prototype.focusGeometry = function()
	{
		//this.viewModel.drawTravelTool.glowAndVisibleGeometries([this.data[this.obCurrentPage()].geometry]);
	}

})()