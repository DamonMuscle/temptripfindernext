(function()
{
	createNamespace('TF.Grid').ManageFilterViewMobileModel = ManageFilterViewMobileModel;

	ManageFilterViewMobileModel.prototype = Object.create(TF.Control.BaseControl.prototype);
	ManageFilterViewMobileModel.prototype.constructor = ManageFilterViewMobileModel;

	function ManageFilterViewMobileModel (obGridFilterDataModels, fnSaveAndEditGridFilter, fnApplyGridFilter, obSelectedGridFilterName, negativeClick)
	{
		this.fnSaveAndEditGridFilter = fnSaveAndEditGridFilter;
		this.fnApplyGridFilter = fnApplyGridFilter;
		this.obGridFilterDataModels = obGridFilterDataModels;
		this.obSelectedGridFilterName = obSelectedGridFilterName;
		this.obIsSafari = ko.observable(TF.isSafari);
		this.negativeClick = negativeClick;
		this.element = null;
		this.needCheckFormFilterDataTypes = tf.dataTypeHelper.getFormCheckFilterDataTypes().map(a => a.ID);
	}

	ManageFilterViewMobileModel.prototype.loaded = function(items)
	{
		this.operationWith = $(items).find(".operation").eq(0).width();
		var left = '-' + this.operationWith + 'px';
		var right = this.operationWith + 'px';
		setTimeout(function()
		{
			$.each(items, function(index, item)
			{
				if (item instanceof HTMLElement && $(item).hasClass("mobile-modal-grid-select-option") && parseInt($(item).attr('filter-id')) > 0)
				{
					new TF.TapHelper(item,
						{
							swipingLeft: function(evt)
							{
								var $element = $(evt.target).closest(".mobile-modal-grid-select-option"),
									swipedItem;
								$.each($(item).parent().find(".mobile-modal-grid-select-option"), function(index, option)
								{
									if ($(option).css("marginLeft") === left)
									{
										swipedItem = $(option);
										return false;
									}
								});
								if ($element.is(':animated') || $element.css("marginLeft") === left || (swipedItem && swipedItem.is(':animated')))
									return;
								if (swipedItem)
								{
									swipedItem.stop().animate(
										{
											marginLeft: "15px",
											marginRight: "0"
										}, 200);
								}
								$element.stop().animate(
									{
										marginLeft: left,
										marginRight: right
									}, 200);
							},
							swipingRight: function(evt)
							{
								var $element = $(evt.target).closest(".mobile-modal-grid-select-option");
								if ($element.is(':animated') || $element.css("marginLeft") !== left)
									return;
								$element.stop().animate(
									{
										marginLeft: "15px",
										marginRight: "0"
									}, 200);
							},
							touchOver: function(evt)
							{
								if (this.isTouching)
								{
									setTimeout(function()
									{
										this.isTouching = false;
									}.bind(this), 200);
								}
							}.bind(this)
						});
				}
			});
		});
	};

	ManageFilterViewMobileModel.prototype.select = function(filter, e)
	{
		var $element = $(e.target).closest(".mobile-modal-grid-select-option");
		if ($element.length > 0 && $element.css("marginLeft") === ('-' + this.operationWith + 'px') && !$element.is(':animated'))
		{
			$element.stop().animate(
				{
					marginLeft: "15px",
					marginRight: "0"
				}, 200);
		}
		else if (filter.isValid())
		{
			this.negativeClick();
			TF.menuHelper.hiddenMenu();
			this.fnApplyGridFilter(filter);
		}
	};

	ManageFilterViewMobileModel.prototype.edit = function(filter, e)
	{
		e.stopPropagation();

		if (this.isTouching)
		{
			return;
		}
		this.fnSaveAndEditGridFilter("edit", filter);
	};

	ManageFilterViewMobileModel.prototype.delete = function(filter, e)
	{
		e.stopPropagation();
		var self = this,
			filterId = filter.id(),
			gridType = filter.gridType(),
			dataTypeID = filter.dataTypeID(),
			isWithoutDB = filter.dBID() === null,
			needCheckFormFilter = isWithoutDB && self.needCheckFormFilterDataTypes.indexOf(dataTypeID) > -1,
			checkUDGridsWithFilterId = !needCheckFormFilter ?
				Promise.resolve([]) :
				tf.udgHelper.checkUDGridsWithFilterIdInSpecifyRecord(dataTypeID, filterId);
		 		
		return checkUDGridsWithFilterId.then(res =>
		{
			if (res.Items && res.Items[0] && res.Items[0].length > 0)
			{
				// now get firt 3 names show
				let formNames = res.Items[0].length === 1 ? `${res.Items[0]} form` : `${res.Items[0].slice(0, 3).join(", ")} forms`;
				tf.promiseBootbox.alert(`This filter is in use on the ${formNames}. It must remain available for all data sources.`);
				return;
			}

			tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "gridlayouts?filterId=" + filterId))
			.then(function(apiResponse)
				{
					var displayMessage = apiResponse.length ? 'This Filter is associated with one or more Layouts. Deleting it will remove it from those Layouts. Are you sure you want to delete?' : 'Are you sure you want to delete this Filter?';

					return tf.promiseBootbox.yesNo(
						{
							message: displayMessage,
							buttons:
							{
								yes:
								{
									label: "Delete",
									className: "btn-delete-mobile"
								},
								no:
								{
									label: "Cancel",
									className: "btn-cancel-mobile"
								}
							}
						}, "Delete Confirmation").then(function(result)
						{
							if (result)
							{
								tf.promiseAjax.delete(pathCombine(tf.api.apiPrefixWithoutDatabase(), "gridfilters", filterId))
									.then(function(response)
									{
										const filterKey = `grid.currentfilter.${gridType}.id`;
										var currentStickFilterId = tf.storageManager.get(filterKey);
										if (currentStickFilterId === filterId)
										{
											tf.storageManager.save(filterKey, '');
										}

										if (response > 0)
										{
											this.obGridFilterDataModels.remove(filter);
										}
									}.bind(this));
							}
						}.bind(this));
				}.bind(this));
		});
	};

	ManageFilterViewMobileModel.prototype.copy = function(filter, e)
	{
		e.preventDefault();
		if (filter.id() < 0)
		{
			return;
		}
		this.fnSaveAndEditGridFilter("new", filter, false, false);
	};

	ManageFilterViewMobileModel.prototype.create = function(filter, e)
	{
		e.stopPropagation();

		if (this.isTouching)
		{
			return;
		}

		this.fnSaveAndEditGridFilter("new", null, false, false,
			{
				title: "New Filter"
			});
	};
})();
