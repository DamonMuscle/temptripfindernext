(function()
{
	createNamespace("TF.RoutingMap").BaseEditModal = BaseEditModal;

	createNamespace("TF.RoutingMap").BaseDraggableModal = BaseDraggableModal;

	function BaseDraggableModal() { }

	BaseDraggableModal.prototype.makeDraggable = function(cancel)
	{
		this.element.draggable({
			cancel: cancel,
			containment: this.element.closest(".map-page"),
			stop: (e, ui) =>
			{
				this.stickyModalWhenOverflow();
				if (this.onDragStop)
				{
					this.onDragStop(e, ui);
				}
			}
		});
	};

	BaseDraggableModal.prototype.stickyModalWhenOverflow = function()
	{
		var elementWidth = this.element.outerWidth();
		if (this.element.position().left + elementWidth >= this.element.parent().width())
		{
			this.element.css('left', `calc(100% - ${elementWidth}px)`);
		}
	};

	function BaseEditModal(options)
	{
		var self = this;
		TF.RoutingMap.BaseDraggableModal.call(this, arguments);
		var defaults = {
			routingMapDocumentViewModel: null,
			template: ""
		};
		options = $.extend(defaults, options);
		this.options = options;
		this.template = options.template;
		if (options.routingMapDocumentViewModel.editModals) { options.routingMapDocumentViewModel.editModals.push(this); }

		this.onCloseEditModalEvent = new TF.Events.Event();
		this.obVisible = ko.observable(false);
		this.obOverlayVisible = ko.observable(false);
		this.obTitle = ko.observable("");
		this.mode = ko.observable("new");

		this.obCurrentPage = ko.observable(0);
		this.obRecordsCount = ko.observable(0);
		this.obShowPaging = ko.observable(false);

		this.original = null;// the original data 
		this.data = null;// data to be save

		// promise
		this.resolve = null;
		this.reject = null;
		this.promise = new Promise(function(resolve, reject) { self.resolve = resolve; self.reject = reject; });

		this.pageLevelViewModel = new TF.PageLevel.BasePageLevelViewModel();

		this.initing = false;
		this.obCollapsed = ko.observable(false);
		this.obCollapsed.subscribe(this.toggleCollapseEvent.bind(this));
	}

	BaseEditModal.prototype = Object.create(TF.RoutingMap.BaseDraggableModal.prototype);
	BaseEditModal.prototype.constructor = BaseEditModal;

	BaseEditModal.prototype.onInit = function(data, element)
	{
		this.element = $(element);
		this.draggable();
		this.initValidation();
	};

	BaseEditModal.prototype._enableKeyEnterApply = function()
	{
		var self = this;
		setTimeout(function()
		{
			var $input = self.element.find(":text");
			if ($input.length > 0)
			{
				$input = $input.eq(0);
				$input.off("keypress").on("keypress", function(e)
				{
					if (e.keyCode == 13 && $.trim($input.val()).length > 0)
					{
						setTimeout(function()
						{
							self.applyClick();
						}, 25);
					}
				});
			}
		}, 25);
	};

	BaseEditModal.prototype.draggable = function(mapArea, onDragStop)
	{
		let mapPageClass = ".map-page";
		if (mapArea) 
		{
			mapPageClass = mapArea;
		}
		var mapPage = this.element.closest(mapPageClass);
		this.makeDraggable(".document-dataentry");
		this.element.find(".modify-content").resizable({
			containment: mapPage,
			handles: "s",
			minHeight: 50,
			start: function(event, ui)
			{
				$(ui.element).children(".body").css("max-height", "none");
				$(ui.element).resizable("option", "maxHeight", $("body").height() - $(ui.element).offset().top - 50);
			},
			stop: (event, ui) =>
			{
				if (onDragStop)
				{
					onDragStop.bind(self)(event, ui);
				}
			}
		});
	};

	BaseEditModal.prototype.beforeChangeData = function(autoClose)
	{
		var unSaveCheckPromise = Promise.resolve();
		if (this.obVisible())
		{
			unSaveCheckPromise = this.unSaveCheck(autoClose);
		}
		return unSaveCheckPromise;
	};

	BaseEditModal.prototype.onHighLightChangedEvent = function()
	{
		var self = this;
		if (this.obVisible() && self.mode() == "edit")
		{
			self.beforeChangeData(false).then(function()
			{
				self.highlightedSelectedChange();
			}).catch(function() { });
		}
	};

	BaseEditModal.prototype.highlightedSelectedChange = function()
	{
		var self = this;
		if (this.obVisible())
		{
			self.initing = true;
			self.getAllHighlight().then(function(selected)
			{
				var currentId = self.data[self.obCurrentPage()].id;
				self.normalizeData(selected);
				var currentStillExist = false;
				for (var i = 0; i < self.data.length; i++)
				{
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
		}
	};

	BaseEditModal.prototype.closeEditModal = function()
	{
		var self = this;
		self.hide();
		self.resolve();
	};

	BaseEditModal.prototype.normalizeData = function(data)
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

	BaseEditModal.prototype.createObservableDataModel = function(dataEntity)
	{
		var data = {};
		var self = this;
		var dataModel = dataEntity;
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

	BaseEditModal.prototype.subscribeDataChange = function(key)
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

	/**
	* This will force to save the new data
	*/
	BaseEditModal.prototype.overlayClick = function(data, e)
	{
		e.stopPropagation();
	};

	BaseEditModal.prototype.toggleCollapseClick = function()
	{
		if (this.mode() == "new")
		{
			return;
		}
		this.obCollapsed(!this.obCollapsed());
	};

	BaseEditModal.prototype.toggleCollapseEvent = function()
	{
		var content = this.element.find("div.modify-content");
		if (this.obCollapsed())
		{
			content.slideUp();
		} else
		{
			content.slideDown();
		}
	};

	BaseEditModal.prototype._compareArrayObject = function(a, b)
	{
		for (var i = 0; i < a.length; i++)
		{
			var dataA = a[i], dataB = b[i];
			for (var key in dataA)
			{
				if (key != "geometry" && key != "graphic") 
				{
					if (dataA[key] != dataB[key]) return false;
				}
			}
		}
		return true;
	};

	BaseEditModal.prototype._compareArrayObjectInProperty = function(a, b, property)
	{
		for (var i = 0; i < a.length; i++)
		{
			var dataA = a[i], dataB = b[i];
			for (var j = 0; j < property.length; j++)
			{
				if (dataA[property[j]] != dataB[property[j]])
				{
					return false;
				}
			}
		}
		return true;
	};

	BaseEditModal.prototype.unSaveCheck = function(autoClose)
	{
		var self = this;
		var data = this.data;
		var confirmPromise = Promise.resolve(true);
		var dataSame = self._compareArrayObject(this.original, data);
		if (!dataSame)
		{
			confirmPromise = tf.promiseBootbox.threeStateConfirm({
				message: "There are unsaved changes. Do you want to save your changes?",
				title: "Unsaved Changes"
			});
		}

		function close()
		{
			if (autoClose)
			{
				self.hide();
				self.resolve();
			}
		}

		return confirmPromise.then(function(result)
		{
			if (result && !dataSame)
			{
				return self.save().then(function(result)
				{
					if (result == false)
					{
						return Promise.reject();
					}
					close();
					return Promise.resolve(true);
				});
			}
			if (result == null)
			{
				return Promise.reject();
			}
			close();
			return false;
		});
	};

	BaseEditModal.prototype.applyClick = function()
	{
	};

	BaseEditModal.prototype.cancelClick = function(modal, e)
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

	BaseEditModal.prototype.trimStringSpace = function(item)
	{
		for (var key in item)
		{
			if (typeof item[key] === "string" || item[key] instanceof String)
			{
				item[key] = item[key].trim();
			}
		}
		return item;
	};

	// #region page
	BaseEditModal.prototype.previousClick = function()
	{
		this.obCurrentPage(this.obCurrentPage() - 1);
		this.showCurrentData();
		this.focusGeometry();
	};

	BaseEditModal.prototype.nextClick = function()
	{
		this.obCurrentPage(this.obCurrentPage() + 1);
		this.showCurrentData();
		this.focusGeometry();
	};
	// #endregion

	BaseEditModal.prototype.initValidation = function()
	{
	};

	BaseEditModal.prototype.showCurrentData = function()
	{
	};

	BaseEditModal.prototype.bindCurrentToObDataModel = function()
	{
		var data = this.data[this.obCurrentPage()];
		for (var key in this.obDataModel)
		{
			if (ko.isObservable(this.obDataModel[key]))
			{
				this.obDataModel[key](data[key]);
			}
		}
	};

	BaseEditModal.prototype.focusGeometry = function()
	{
	};

	BaseEditModal.prototype.hide = function()
	{
		this.obVisible(false);
		this.obOverlayVisible(false);
	};

	BaseEditModal.prototype.show = function(cssLeft, cssTop)
	{
		if (cssLeft !== undefined && cssLeft !== null)
		{
			this.element.css("left", cssLeft);
			this.element.css("top", cssTop);
		}
		this.obVisible(true);
		this.stickyModalWhenOverflow();
	};

	/**
	* display title on modal
	*/
	BaseEditModal.prototype.initTitle = function(isNew, title, plural, openType)
	{
		var mode = isNew ? "New" : openType === 'View' ? "View" : "Edit";
		this.mode(mode.toLowerCase());
		if (this.data.length > 1)
		{
			this.obTitle(String.format("{0} {1} ({2})", mode, plural || title, this.data.length));
		} else
		{
			this.obTitle(String.format("{0} {1}", mode, title));
		}
	};

})();