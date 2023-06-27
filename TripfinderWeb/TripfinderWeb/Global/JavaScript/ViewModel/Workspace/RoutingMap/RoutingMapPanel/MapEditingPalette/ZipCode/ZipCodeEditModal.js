(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette").ZipCodeEditModal = ZipCodeEditModal;

	function ZipCodeEditModal(viewModel)
	{
		TF.RoutingMap.BaseEditModal.call(this, {
			routingMapDocumentViewModel: viewModel._viewModal,
			template: "workspace/RoutingMap/RoutingMapPanel/MapEditingPalette/EditZipCode"
		});
		this.onCloseEditModalEvent = new TF.Events.Event();
		this.viewModel = viewModel;
		this.obCurrentPage = ko.observable(0);
		this.obRecordsCount = ko.observable(0);
		this.obName = ko.observable();
		this.obName.subscribe(this.obNameChange.bind(this));
		this.obShowPaging = ko.observable(false);
		this.obMultipleChange = ko.observable(false);
		this.dataModel = viewModel.dataModel;
		this.dataModel.highlightChangedEvent.subscribe(this.highlightedSelectedChange.bind(this));
		this.isReadOnly = ko.observable(!tf.authManager.isAuthorizedFor('mapEdit', ['edit', 'add']));
	}

	ZipCodeEditModal.prototype = Object.create(TF.RoutingMap.BaseEditModal.prototype);
	ZipCodeEditModal.prototype.constructor = ZipCodeEditModal;

	ZipCodeEditModal.prototype.init = function()
	{
		var self = this;
		this.obCurrentPage(0);
		this.obRecordsCount(this.data.length);
		this.promise = new Promise(function(resolve, reject) { self.resolve = resolve; self.reject = reject; });
		this.obName("");

		setTimeout(function()
		{
			self.element.find(":text").off("keypress").on("keypress", function(e)
			{
				if (e.keyCode == 13 && (self.obName() + "").length > 0)
				{
					setTimeout(function()
					{
						self.applyClick();
					});
				}
			});
		}, 10);

		return Promise.resolve(true);
	};

	ZipCodeEditModal.prototype.initValidation = function()
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
					},
					callback: {
						message: "must be unique",
						callback: function(value, validator, $field)
						{
							var all = self.dataModel.getZipCodes();
							var data = self.data[self.obCurrentPage()];
							for (var i = 0; i < all.length; i++)
							{
								if (all[i].id != data.id && all[i].zip == data.zip)
								{
									return Promise.resolve(false);
								}
							}
							return Promise.resolve(true);
						}
					}
				}
			};

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

	ZipCodeEditModal.prototype.create = function(zipcode)
	{
		var self = this;
		return self.beforeChangeData().then(function()
		{
			self.initing = true;
			self.obOverlayVisible(true);
			self.normalizeData(zipcode);
			self.init().then(function()
			{
				self.initTitle(true);
				self.obName(zipcode.name);
				self.initing = false;
				self.obCollapsed(false);
				self.show();

				self.applyLastEnterValue();
				self.original = $.extend({}, self.data);
				setTimeout(function()
				{
					// rebuild validation to clear the old one ,because this form just hide and show, not close
					self.initValidation();
				}, 50);
			});
			return self.promise;
		});
	};

	/**
	* this is the enter to open edit boundary modal
	*/
	ZipCodeEditModal.prototype.showEditModal = function(editData)
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
	};

	ZipCodeEditModal.prototype.closeEditModal = function(e)
	{
		var self = this;
		self.hide();
		self.resolve();
	};

	ZipCodeEditModal.prototype.getAllHighlightBoundaries = function()
	{
		return this.dataModel.getEditableHighlightedZipCode();
	};

	ZipCodeEditModal.prototype.highlightedSelectedChange = function(e, items)
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
						var oldItem = currentDataEnumerable.Where(function(x) { return x.id == self.data[i].id; }).FirstOrDefault();
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
			}).catch(function() { });
		}
	};

	ZipCodeEditModal.prototype.obNameChange = function(value)
	{
		if (this.initing)
		{
			return;
		}
		var data = this.data[this.obCurrentPage()];
		data.zip = value;
	};

	ZipCodeEditModal.prototype.showCurrentData = function()
	{
		var self = this;
		var data = this.data[this.obCurrentPage()];
		self.obName(data.zip);
		self.obShowPaging(self.data.length > 1);
		setTimeout(function()
		{
			// rebuild validation to clear the old one ,because this form just hide and show, not close
			self.initValidation();
		}, 50);
	};

	ZipCodeEditModal.prototype.show = function()
	{
		this.obVisible(true);
	};

	ZipCodeEditModal.prototype.hide = function()
	{
		this.obVisible(false);
		this.obOverlayVisible(false);
		if (this.$form && this.$form.data("bootstrapValidator"))
		{
			this.$form.data("bootstrapValidator").destroy();
		}
		this.onCloseEditModalEvent.notify();
		this.viewModel._viewModal.onStopEditingEvent.notify();
	};

	ZipCodeEditModal.prototype.initTitle = function(isNew)
	{
		var mode = isNew ? "New" : "Edit";
		this.mode(mode.toLowerCase());
		if (this.data.length > 1)
		{
			this.obTitle(mode + " Postal Code (" + this.data.length + ")");
		} else
		{
			this.obTitle(mode + " Postal Code");

		}
		this.element.find(".zipEditModal .head").css({ "cursor": isNew ? "default" : "pointer" });
	};

	ZipCodeEditModal.prototype.normalizeData = function(data)
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
		});
		this.original = original;
		this.obRecordsCount(this.data.length);
	};

	ZipCodeEditModal.prototype.applyClick = function()
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

	ZipCodeEditModal.prototype.save = function()
	{
		var self = this;
		return self.pageLevelViewModel.saveValidate()
			.then(function(result)
			{
				if (result)
				{
					if (self.mode() == "new")
					{
						var zipCode = self.dataModel.createZipCode(self.data[0]);
						self.setLastEnterValue(zipCode);
						self.resolve(zipCode);
					}
					else
					{

						var allDataTemplate = null;
						if (self.obMultipleChange())
						{
							allDataTemplate = self.data[self.obCurrentPage()];
						}
						self.dataModel.update(self.data);
						self.resolve(self.data);
					}
					self.pageLevelViewModel.clearError();
				}
				return result;
			});
	};

	ZipCodeEditModal.prototype.cancelClick = function(modal, e)
	{
		e.stopPropagation();
		var self = this;
		var data = this.data;
		var confirmPromise = Promise.resolve(true);
		if (!self._compareArrayObject(this.original, data))
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

	ZipCodeEditModal.prototype._compareArrayObject = function(a, b)
	{
		return this._compareArrayObjectInProperty(a, b, ["name", "zip"]);
	};

	ZipCodeEditModal.prototype.applyLastEnterValue = function()
	{
		var self = this;
		var lastValue = tf.storageManager.get("zipCode-last-create-value");
		if (lastValue)
		{
			// self.obType(lastValue.type == null ? 1 : lastValue.type);
		}
	};

	ZipCodeEditModal.prototype.setLastEnterValue = function(boundary)
	{
		tf.storageManager.save("zipCode-last-create-value", boundary);
	};

	ZipCodeEditModal.prototype.focusGeometry = function()
	{
		this.viewModel.drawTool.glowAndVisibleGeometries([this.data[this.obCurrentPage()].geometry]);
	};

})();
