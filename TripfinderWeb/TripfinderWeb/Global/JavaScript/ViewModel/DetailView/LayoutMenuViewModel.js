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

		self.obSelectLayoutID = ko.observable(tf.storageManager.get(self.stickyName));
		self.obSelectLayoutName = ko.observable("");
		self.obLayouts = ko.observableArray([]);
		self.obMoveDistance = ko.observable("-" + options.movingDistance + "px");
		self.obTop = ko.observable(options.top + "px");
		self.obNewWindow = ko.observable(true);

		//Events
		self.newLayoutClick = self.newLayoutClick.bind(self);
		self.editLayoutClick = self.editLayoutClick.bind(self);
		self.manageLayoutClick = self.manageLayoutClick.bind(self);
		self.resetLayoutClick = self.resetLayoutClick.bind(self);
		self.selectLayoutClick = self.selectLayoutClick.bind(self);

		self.loadingFinishEvent = new TF.Events.Event();
		self.modifyItemEvent = new TF.Events.Event();
		self.selectItemEvent = new TF.Events.Event();

		self.load();
	}

	/**
	 * Data loading.
	 * @return {void}
	 */
	LayoutMenuViewModel.prototype.load = function()
	{
		var self = this, paramData = {};
		if (window.opener && window.name === "new-detailWindow")
		{
			self.obNewWindow(false);
		}
		if (self.options.gridType)
		{
			paramData.table = self.options.gridType;
		}
		tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "detailscreen"), {
			paramData: paramData
		},
			{ overlay: false }).then(function(response)
			{
				if (response && response.Items && response.Items[0])
				{
					var layouts = response.Items[0].map(function(item)
					{
						if (self.obSelectLayoutID() === item.Id)
						{
							self.obSelectLayoutName(item.Name);
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
					self.obLayouts(layouts);
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
		self.modifyItemEvent.notify();
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
		self.modifyItemEvent.notify({ id: self.obSelectLayoutID() });
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
			manageModal = new TF.Modal.ManageDetailScreenLayoutModalViewModel(self.options.gridType, self.obSelectLayoutID());
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
					}
					else
					{
						self.apply(result.data);
					}
				}
				else
				{
					if (result.isOpenTemp)
					{
						self.modifyItemEvent.notify(result.data);
					}
					else
					{
						self.resetLayoutClick();
					}
				}
			}
			self.dispose();
			self.delayDispose = false;
		});
	};

	/**
	 * The event of reset layout icon click.
	 * @param {object} viewModel The viewModel of this modal.
	 * @param {event} e The click event.
	 * @returns {void} 
	 */
	LayoutMenuViewModel.prototype.resetLayoutClick = function(viewModel, e)
	{
		var self = this;
		self.clearLayout();
		self.selectItemEvent.notify();
	};

	/**
	 * Clear select layout
	 * @returns {void} 
	 */
	LayoutMenuViewModel.prototype.clearLayout = function()
	{
		var self = this;
		self.obSelectLayoutID(null)
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
		if (selectId === self.obSelectLayoutID())
		{
		}
		else
		{
			self.apply({ selectId: selectId, selectName: selectName });
		}
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
		}
	};
})();