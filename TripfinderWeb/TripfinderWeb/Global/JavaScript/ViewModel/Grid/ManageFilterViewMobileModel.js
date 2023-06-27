(function()
{
	createNamespace('TF.Grid').ManageFilterViewMobileModel = ManageFilterViewMobileModel;

	ManageFilterViewMobileModel.prototype = Object.create(TF.Control.BaseControl.prototype);
	ManageFilterViewMobileModel.prototype.constructor = ManageFilterViewMobileModel;

	function ManageFilterViewMobileModel(options)
	{
		const { obAllFilters, editFilter, applyFilter, filterName, negativeClick } = options;

		this.fnSaveAndEditGridFilter = editFilter;
		this.fnApplyGridFilter = applyFilter;
		this.obGridFilterDataModels = obAllFilters;
		this.obSelectedGridFilterName = filterName;
		this.obIsSafari = ko.observable(TF.isSafari);
		this.negativeClick = negativeClick;
		this.element = null;

		this.onFilterEdited = new TF.Events.Event();
		this.onFilterDeleted = new TF.Events.Event();

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

		this.filterModelJSONString = filter ? JSON.stringify(filter.toData()) : null;
		const editTask = this.fnSaveAndEditGridFilter("edit", filter);
		Promise.resolve(editTask)
			.then((result) =>
			{
				let resultFilterModelJSONString = typeof result === "object" ? JSON.stringify(result.toData()) : null;

				if (resultFilterModelJSONString && this.filterModelJSONString !== resultFilterModelJSONString)
				{
					this.onFilterEdited.notify(result);
					this.obGridFilterDataModels.sort(this._sortFilterDataModels);
				}
			});
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
											this.onFilterDeleted.notify(filterId);
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
		this.copyAndNewGridFilter(filter.clone());				
	};

	ManageFilterViewMobileModel.prototype.copyAndNewGridFilter = function(gridFilter)
	{
		const copyAndNewTask = this.fnSaveAndEditGridFilter("new", gridFilter, false, false);
		this.saveGridFilter(copyAndNewTask);
	};

	ManageFilterViewMobileModel.prototype.create = function(filter, e)
	{
		e.stopPropagation();

		if (this.isTouching)
		{
			return;
		}

		const newTask = this.fnSaveAndEditGridFilter("new", null, false, false,
			{
				title: "New Filter"
			});
		this.saveGridFilter(newTask);
	};

	ManageFilterViewMobileModel.prototype.saveGridFilter = function(task)
	{
		Promise.resolve(task)
			.then((result) =>
			{
				if (result && typeof result === "object")
				{
					this.obGridFilterDataModels.push(result);
					this.obGridFilterDataModels.sort(this._sortFilterDataModels);
				}
			});
	};

	ManageFilterViewMobileModel.prototype._sortFilterDataModels = function(left, right)
	{
		if (left.id() < 0 && right.id() > 0)
		{
			return 1;
		}
		if (left.id() > 0 && right.id() < 0)
		{
			return -1;
		}
		return left.name().toLowerCase() == right.name().toLowerCase() ? 0 : (left.name().toLowerCase() < right.name().toLowerCase() ? -1 : 1);
	};
})();
