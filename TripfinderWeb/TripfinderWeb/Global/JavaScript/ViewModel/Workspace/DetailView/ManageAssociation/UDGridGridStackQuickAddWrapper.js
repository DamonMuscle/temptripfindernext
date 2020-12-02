(function()
{
	createNamespace("TF.DetailView").UDGridGridStackQuickAddWrapper = UDGridGridStackQuickAddWrapper;

	function UDGridGridStackQuickAddWrapper(options)
	{
		var self = this;
		self.dataType = options.dataType;
		self.recordId = options.recordId;
		self.recordEntity = options.recordEntity;
		self.baseRecordType = options.baseRecordType;
		self.baseRecordEntity = options.baseRecordEntity;
		self.layoutEntity = options.layoutEntity;
		self.pageLevelViewModel = options.pageLevelViewModel;
		self.attachedFile = options.attachedFile;
		self.udGrid = options.udGrid;

		self.template = "Workspace/detailview/ManageAssociation/QuickAddDetailView";

		self.$element = null;
	};

	/**
	 * Initialization
	 * @return {void}
	 */
	UDGridGridStackQuickAddWrapper.prototype.init = function(data, element)
	{
		var self = this;
		self.$element = $(element);
		self.$scrollBody = self.$element.closest('.modal-body');

		self.initCustomDetailView();
	};

	/**
	 * Initialize the custom detail view in the modal.
	 *
	 * @returns {void}
	 */
	UDGridGridStackQuickAddWrapper.prototype.initCustomDetailView = function()
	{
		var self = this;
		self.customDetailView = new TF.DetailView.UDGridDetailViewViewModel(self.udGrid, self.baseRecordEntity, self.recordEntity);
		self.customDetailView.init({
			$element: self.$element,
			$scrollBody: self.$scrollBody,
			gridType: self.dataType,
			pageLevelViewModel: self.pageLevelViewModel,
			udGrid: self.udGrid,
		});

		self.customDetailView.onEditRecordSuccess.subscribe(function(e, entity)
		{
			self.recordEntity = entity;
			self.recordId = entity ? entity.Id : 0;
		});

		self._updateQuickAddDetailView();
	};

	UDGridGridStackQuickAddWrapper.prototype._updateQuickAddDetailView = function()
	{
		var self = this;
		self._getRecordEntity().then(function()
		{
			self.customDetailView.applyLayoutTemplate(self.layoutEntity, self.recordEntity).then(function()
			{
				self.customDetailView.refreshEditStatus();

				self.customDetailView.highlightRequiredFieldByAsterisk();
			});
		});
	};

	/**
	 * Save the object.
	 *
	 * @returns {void}
	 */
	UDGridGridStackQuickAddWrapper.prototype.save = function()
	{
		var self = this;

		return self.customDetailView.saveCurrentEntity()
			.then(function(result)
			{
				if (result == null)
				{
					result = { success: false };
				}

				if (result.success == null)
				{
					result.success = true;
				}

				return result;
			});
	};

	/**
	 * If has recordId but no record entity, request to get the entity.
	 * 
	 */
	UDGridGridStackQuickAddWrapper.prototype._getRecordEntity = function()
	{
		var self = this,
			deferred = (self.recordEntity || !self.recordId) ? Promise.resolve(true) :
				self.customDetailView.getRecordEntity(self.dataType, self.recordId)
					.then(function(entity)
					{
						self.recordEntity = entity;
					});

		return deferred;
	};

	/**
	 * Dispose
	 * 
	 * @return {void}
	 */
	UDGridGridStackQuickAddWrapper.prototype.dispose = function()
	{
		var self = this;

		if (self.customDetailView)
		{
			self.customDetailView.dispose();
		}

		self.$element = null;
		self.$scrollBody = null;
	};
})();