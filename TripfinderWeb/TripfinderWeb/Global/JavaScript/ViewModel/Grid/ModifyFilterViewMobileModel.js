(function()
{
	createNamespace("TF.Grid").ModifyFilterViewMobileModel = ModifyFilterViewMobileModel;

	var firstOpenKey = "edit-filter-mobile-first-load";

	ModifyFilterViewMobileModel.prototype = Object.create(TF.Grid.ModifyFilterViewModel.prototype);
	ModifyFilterViewMobileModel.prototype.constructor = ModifyFilterViewMobileModel;

	function ModifyFilterViewMobileModel(gridType, isNew, gridFilterDataModel, headerFilters, gridMetadata, omittedRecordIds, options)
	{
		TF.Grid.ModifyFilterViewModel.call(this, gridType, isNew, gridFilterDataModel, headerFilters, gridMetadata, omittedRecordIds);

		this.gridType = gridType;
		this.isNew = isNew;

		var title = 'SAVE FILTER';
		if (options && options.title)
			title = options.title;
		this.title = ko.observable(title);

		var gridFilter;
		if (!gridFilterDataModel)
		{
			gridFilter = new TF.DataModel.GridFilterDataModel();
			gridFilter.gridType(gridType);
			gridFilter.dataTypeID(tf.dataTypeHelper.getId(gridType));
		}
		else
		{
			gridFilter = gridFilterDataModel.clone();
			if (isNew === "new")
			{
				gridFilter.id(0);
				gridFilter.apiIsNew(true);
				gridFilter.apiIsDirty(false);
				gridFilter.name("");
			}
		}

		this.gridFilterDataModel = gridFilter;
		this.operatorList = ["=", "<>", ">", "<", ">=", "<=", "LIKE"];
		this.logicalList = ["AND", "OR"];

		this.obStatus = ko.observable("main");
		this.obSearchFilter = ko.observable("");
		this.obSelectDataList = ko.observableArray([]);
		this.obSelectType = ko.observable("");
		this.obSelectNeedSearch = ko.observable(false);
		this.description = "Enter the field statement in the area below.  You may add Field, Operator, Value, and Logical elements to help you build your statement.  To add a Field, Operator, Value, or Logical element to your statement, place your cursor in your statement where you would like the value added.  Then select or enter a value.  The value will be added where your cursor was placed.";
		this.obDescription = ko.observable(this.description);
		this.obIsSafari = ko.observable(TF.isSafari);
		this.isFirstLoad = tf.storageManager.get(firstOpenKey) || true;

		this.pageLevelViewModel = new TF.PageLevel.BasePageLevelViewModel();
		this.getOmittedRecordsName();

		this.obSelectToBeDisplayList = ko.computed(function()
		{
			return $.grep(this.obSelectDataList(), function(item)
			{
				return item.DisplayName.trim() !== "" && item.DisplayName.toLowerCase().indexOf(this.obSearchFilter().toLowerCase()) > -1;
			}.bind(this));
		}.bind(this), this);
	}

	ModifyFilterViewMobileModel.prototype.initialize = function(viewModel, e)
	{
		TF.Grid.ModifyFilterViewModel.prototype.initialize.call(this, viewModel, e);

		this.$element = $(e);
		this.$description = this.$element.find(".mobile-modal-grid-description");
		this.$container = this.$element.find(".scroll-container");

		if (this.isFirstLoad !== true)
		{
			this.lessDescriptionClick();
		}
		tf.storageManager.save(firstOpenKey, "loaded");

		TF.Control.BaseControl.keyboardShowHideToggleHeight($("#saveFilterMobileContentBody"));
	};

	ModifyFilterViewMobileModel.prototype.goToSelect = function(type)
	{
		var container, setUpSelect = function(type, needSearch, dataLsit)
		{
			this.obSelectType(type);
			this.obSelectNeedSearch(needSearch);
			this.obSelectDataList(dataLsit);

			container = $(".mobile-modal-content-body.filter-select");
			if (needSearch) { container.css("height", ($(window).height() - 115) + "px"); }
			else { container.css("height", ($(window).height() - 50) + "px"); }
		}.bind(this);

		switch (type)
		{
			case "field":
				setUpSelect("field", true, this.obGridDefinitionColumns());
				break;
			case "operator":
				setUpSelect("operator", false, this.operatorList.map(function(item) { return { DisplayName: item } }));
				break;
			case "logical":
				setUpSelect("logical", false, this.logicalList.map(function(item) { return { DisplayName: item } }));
				break;
			default:
				return;
		}

		this.obSearchFilter("");
		this.obStatus("select");
	};

	ModifyFilterViewMobileModel.prototype.goToMain = function()
	{
		this.obStatus("main");
	}

	ModifyFilterViewMobileModel.prototype.emptySearch = function()
	{
		this.obSearchFilter("");
	}

	ModifyFilterViewMobileModel.prototype.selectFilter = function(option, e)
	{
		this.goToMain();
		const self = this;
		var name;

		switch (this.obSelectType())
		{
			case "field":
				if (!option.FieldName)
				{
					this.obValueFieldType("Disabled");
					return;
				}
				if (option.TypeCode === "Select")
				{
					this.obValueFieldValue("");
					self.ListMoverOptions([]);
					if (option.UDFPickListOptions && option.UDFPickListOptions.length > 0)
					{
						setTimeout(function ()
						{
							self.ListMoverOptions(option.UDFPickListOptions);
						});
					}
				}
				this.obValueFieldType(option.TypeCode);
				name = "[" + option.PersistenceName + "]";
				break;
			case "operator":
			case "logical":
				name = option.DisplayName;
				break;
			default:
				return;
		}

		this.insertFragmentToCurrentCursorPostion(name);
	};

	ModifyFilterViewMobileModel.prototype.clearSingleOmittedRecord = function(record, e)
	{
		var dataSource = this.obOmitRecords();
		dataSource.splice(dataSource.indexOf(record), 1);
		this.obOmitRecords(dataSource);

		this.obVisableOmitCnt(this.obVisableOmitCnt() - 1);

		this.gridFilterDataModel.apiIsDirty(true);
	};

	ModifyFilterViewMobileModel.prototype.clearAllOmittedRecords = function()
	{
		this.obOmitRecords([]);
		this.obVisableOmitCnt(0);

		this.gridFilterDataModel.apiIsDirty(true);
	}

	ModifyFilterViewMobileModel.prototype.inputValue = function(viewModel, e)
	{
		this.insertFragmentToCurrentCursorPostion(this.valueToSQL(this.obValueFieldType(), this.obValueFieldValue()));
	};

	ModifyFilterViewMobileModel.prototype.verifyClick = function()
	{
		this.obErrorMessageDivIsShow(false);
		this.obSuccessMessageDivIsShow(false);
		this.obStatementVerify(true);

		tf.loadingIndicator.setSubtitle('Verifying Syntax');
		tf.loadingIndicator.show();
		this.verify(true)
			.then(function(response)
			{
				tf.loadingIndicator.tryHide();

				var message = "";
				if (response.StatusCode !== 200)
				{
					message = "The Filter Statement syntax is invalid.";
					tf.promiseBootbox.alert(message, "Syntax Error");
				}
				else
				{
					message = "The Filter Statement syntax is valid.";
					tf.promiseBootbox.alert(message, "Valid Syntax");
				}

			}.bind(this))
			.catch(function()
			{
				tf.loadingIndicator.tryHide();

				var $field = $("textarea[name='sqlStatement']");
				this.pageLevelViewModel.obErrorMessageDivIsShow(true);
				var validator = $.trim(this.gridFilterDataModel.whereClause()) === '' ? 'notEmpty' : 'callback';
				this._$form.find('[data-bv-validator = "' + validator + '"][data-bv-for="sqlStatement"]').show().closest(".form-group").addClass("has-error");
				$field.focus();
			}.bind(this));
	};

	ModifyFilterViewMobileModel.prototype.moreDescriptionClick = function()
	{
		this.$description.removeClass('more').addClass('less');
		this.obDescription(this.description);
		this.setDescription();
	};

	ModifyFilterViewMobileModel.prototype.lessDescriptionClick = function()
	{
		this.$description.removeClass('less').addClass('more');
		var $testWidth = $("<div></div>").css(
			{
				"position": "absolute",
				"left": 10000
			}).width($(document).width() - 30);
		$("body").append($testWidth);
		var description = "";
		for (var i = 0; i <= this.description.length; i++)
		{
			$testWidth.html(this.description.substring(0, i) + "more...");
			if ((/\W/g).test(this.description[i]))
			{
				if ($testWidth.height() > 38) //two line
				{
					break;
				}
				else
				{
					description = this.description.substring(0, i);
				}
			}
		}
		$testWidth.remove();
		this.obDescription(description);
		this.setDescription();
	};

	ModifyFilterViewMobileModel.prototype.setDescription = function()
	{
		this.$container.css("height", "calc(100% - " + this.$description.outerHeight() + "px)");
	};

	ModifyFilterViewMobileModel.prototype.cancel = function()
	{
		return new Promise(function(resolve, reject)
		{
			if (this.gridFilterDataModel.apiIsDirty())
			{
				resolve(tf.promiseBootbox.yesNo("You have unsaved changes.  Would you like to save your changes prior to canceling?", "Unsaved Changes"));
			} else
			{
				resolve(false);
			}
		}.bind(this));
	};

	ModifyFilterViewMobileModel.prototype.dispose = function() { };
})();