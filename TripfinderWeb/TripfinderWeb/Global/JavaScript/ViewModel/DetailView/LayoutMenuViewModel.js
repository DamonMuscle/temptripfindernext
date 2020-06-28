(function()
{
	createNamespace("TF.DetailView").LayoutMenuViewModel = LayoutMenuViewModel;

	/**
	 * Constructor
	 * @returns {void} 
	 */
	function LayoutMenuViewModel(options, detailView)
	{
		var self = this;
		self.options = options;
		self.detailView = detailView;
		self.stickyName = "grid.detailscreenlayoutid." + options.gridType;

		self.obSelectLayoutID = ko.observable(detailView.entityDataModel.id());
		self.obSelectLayoutName = ko.observable(detailView.entityDataModel.name());
		self.obLayouts = ko.observableArray([]);
		self.obMoveDistance = ko.observable(options.movingDistance != null ? "-" + options.movingDistance + "px" : "auto");
		self.obTop = ko.observable(options.top + "px");
		self.obNewWindow = ko.observable(true);

		self.detailViewHelper = tf.helpers.detailViewHelper;

		//Events
		self.newLayoutClick = self.newLayoutClick.bind(self);
		self.editLayoutClick = self.editLayoutClick.bind(self);
		self.manageLayoutClick = self.manageLayoutClick.bind(self);
		self.resetLayoutClick = self.resetLayoutClick.bind(self);
		self.selectLayoutClick = self.selectLayoutClick.bind(self);

		self.loadingFinishEvent = new TF.Events.Event();
		self.modifyItemEvent = new TF.Events.Event();
		self.selectItemEvent = new TF.Events.Event();
		//RW-11733
		self.syncItemDataEvent = new TF.Events.Event();

		self.load();
	}

	/**
	 * Data loading.
	 * @return {void}
	 */
	LayoutMenuViewModel.prototype.load = function()
	{
		var self = this,
			paramData = {
				"@fields": "Id,Name,Comments,DataTypeId"
			};
		if (window.opener && window.name.indexOf("new-detailWindow") >= 0)
		{
			self.obNewWindow(false);
		}
		if (self.options.gridType)
		{
			paramData.dataTypeId = tf.dataTypeHelper.getId(self.options.gridType);
		}

		tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "detailscreens"), {
			paramData: paramData
		}, { overlay: false })
			.then(function(response)
			{
				if (response && response.Items)
				{
					var layouts = response.Items.map(function(item)
					{
						item.Name = item.Name.trim();
						item = self.detailViewHelper.formatLayoutTemplate(item)
						if (self.obSelectLayoutID() === item.Id)
						{
							self.obSelectLayoutName(item.Name);
							self.syncItemDataEvent.notify(item);
						}
						if (!item.Comments)
						{
							item.Comments = item.Name;
						}
						return new TF.DataModel.DetailScreenLayoutDataModel(item);
					});

					if (!self.obSelectLayoutName())
					{
						self.clearLayout();
					}
					self.obLayouts(layouts.sort(function(a, b)
					{
						return a.name().localeCompare(b.name())
					}));
				}
				self.loadingFinishEvent.notify();
			});
	};

	/**
	 * The event of new layout icon click.
	 * @param {object} viewModel The viewModel of this modal.
	 * @param {event} e The click event.
	 * @returns {void} 
	 */
	LayoutMenuViewModel.prototype.newLayoutClick = function(viewModel, e)
	{
		var self = this;
		self.modifyItemEvent.notify({
			isNew: true
		});
	};

	/**
	 * The event of edit layout icon click.
	 * @param {object} viewModel The viewModel of this modal.
	 * @param {event} e The click event.
	 * @returns {void} 
	 */
	LayoutMenuViewModel.prototype.editLayoutClick = function(viewModel, e)
	{
		var self = this;
		// ga('send', 'event', 'Action', 'Edit Details');
		self.modifyItemEvent.notify({
			id: self.obSelectLayoutID()
		});
	};

	/**
	 * The event of mange modal icon click.
	 * @param {object} viewModel The viewModel of this modal.
	 * @param {event} e The click event.
	 * @returns {void} 
	 */
	LayoutMenuViewModel.prototype.manageLayoutClick = function(viewModel, e)
	{
		var self = this,
			manageModal = new TF.DetailView.ManageDetailScreenLayoutModalViewModel(self.options.gridType, self.obSelectLayoutID());
		self.delayDispose = true;
		tf.modalManager.showModal(manageModal).then(function(result)
		{
			if (result && result.data)
			{
				if (!result.data.isDeleted)
				{
					if (result.isOpenTemp)
					{
						self.modifyItemEvent.notify(result.data);
					} else
					{
						self.apply(result.data);
					}
				} else
				{
					if (result.isOpenTemp)
					{
						self.modifyItemEvent.notify(result.data);
					}
					if (!result.data.selectId)
					{
						self.obLayouts(result.data.layoutTemplates.sort(function(a, b)
						{
							return a.name().localeCompare(b.name())
						}));
					}
					self.resetLayout(result.data.selectId);
				}
			}
			self.dispose();
			self.delayDispose = false;
		});
	};
	/**
	 * Reset layout.
	 * @param {object} viewModel The viewModel of this modal.  
	 * @param {event} e The click event.
	 * @returns {void} 
	 */
	LayoutMenuViewModel.prototype.resetLayout = function(layoutId)
	{
		var self = this, defaultLayoutTemplates = [];

		self.clearLayout();
		if (layoutId)
		{
			self.selectItemEvent.notify(layoutId);
		}
		else
		{
			defaultTemplateName = self.getDefaultTemplateName(self.options.gridType),
				defaultLayoutTemplates = self.obLayouts().filter(function(item)
				{
					return item.name() === defaultTemplateName;
				});
			self.selectItemEvent.notify(defaultLayoutTemplates.length > 0 ? defaultLayoutTemplates[0].id() : self.obLayouts()[0] ? self.obLayouts()[0].id() : undefined);
		}
	};
	/**
	 * The event of reset layout icon click.
	 * @param {object} viewModel The viewModel of this modal.  Removed in RW-12840
	 * @param {event} e The click event.
	 * @returns {void} 
	 */
	LayoutMenuViewModel.prototype.resetLayoutClick = function(viewModel, e)
	{
		var self = this;
		self.clearLayout();
		self.selectItemEvent.notify();
	};

	LayoutMenuViewModel.prototype.getDefaultTemplateName = function(gridType)
	{
		return String.format("{0} default layout", tf.applicationTerm.getApplicationTermPluralByName(tf.dataTypeHelper.getFormalDataTypeName(gridType))).toUpperCase();
	};

	/**
	 * Clear select layout
	 * @returns {void} 
	 */
	LayoutMenuViewModel.prototype.clearLayout = function()
	{
		var self = this;
		self.obSelectLayoutID(null);
		self.obSelectLayoutName("");
		tf.storageManager.save(self.stickyName, null);
	};

	/**
	 * The event of signle layout selected icon click.
	 * @param {object} viewModel The viewModel of this modal.
	 * @param {event} e The click event.
	 * @returns {void} 
	 */
	LayoutMenuViewModel.prototype.selectLayoutClick = function(viewModel, e)
	{
		var self = this,
			selectId = viewModel.id(),
			selectName = viewModel.name();

		//RW-11733 should always get the newest layout
		/* 		if (selectId !== self.obSelectLayoutID())
				{ */
		self.apply({
			selectId: selectId,
			selectName: selectName
		});
		//}
	};

	/**
	 * Apply the layout to panel
	 * @param {object} layout The data include id and name.
	 * @returns {void} 
	 */
	LayoutMenuViewModel.prototype.apply = function(layout)
	{
		var self = this;
		self.obSelectLayoutID(layout.selectId)
		self.obSelectLayoutName(layout.selectName);
		tf.storageManager.save(self.stickyName, layout.selectId);
		self.selectItemEvent.notify(self.obSelectLayoutID());
	};

	/**
	 * The dispose function.
	 * @returns {void} 
	 */
	LayoutMenuViewModel.prototype.dispose = function()
	{
		var self = this;
		if (!self.delayDispose)
		{
			self.loadingFinishEvent.unsubscribeAll();
			self.modifyItemEvent.unsubscribeAll();
			self.selectItemEvent.unsubscribeAll();
			self.syncItemDataEvent.unsubscribeAll();
		}

		if (self.options.dispose)
		{
			self.options.dispose();
		}
	};

	LayoutMenuViewModel.prototype.afterRender = function()
	{
		var self = this;
		if (self.options.afterRender)
		{
			self.options.afterRender();
		}
	};
})();