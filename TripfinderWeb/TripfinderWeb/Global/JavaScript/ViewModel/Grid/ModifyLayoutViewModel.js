(function()
{
	createNamespace("TF.Grid").ModifyLayoutViewModel = ModifyLayoutViewModel;

	ModifyLayoutViewModel.prototype = Object.create(TF.Control.BaseControl.prototype);
	ModifyLayoutViewModel.prototype.constructor = ModifyLayoutViewModel;

	function ModifyLayoutViewModel(gridType, isNew, gridLayoutExtendedDataModel, obGridFilterDataModels, obSelectedGridFilterId)
	{
		this.isNew = isNew;
		gridLayoutExtendedDataModel = gridLayoutExtendedDataModel.clone();
		var displayFilter;
		if (isNew === "new")
		{
			gridLayoutExtendedDataModel.id(0);
			gridLayoutExtendedDataModel.dataTypeId(tf.DataTypeHelper.getId(gridType));
			gridLayoutExtendedDataModel.gridType(gridType);
			gridLayoutExtendedDataModel.apiIsNew(true);
			gridLayoutExtendedDataModel.apiIsDirty(true);
			gridLayoutExtendedDataModel.name("");
			gridLayoutExtendedDataModel.description("");
			displayFilter = obSelectedGridFilterId();
		}
		else
		{
			displayFilter = gridLayoutExtendedDataModel.filterId()
		}
		this.obStatus = ko.observable('layout');
		this.obSearchFilter = ko.observable("");
		this.obSearchFilter.subscribe(this.searchFilter.bind(this));
		this.gridLayoutExtendedDataModel = gridLayoutExtendedDataModel;
		this.obFilterDataList = ko.observableArray([]);
		this.obGridFilterDataModels = ko.observableArray(obGridFilterDataModels().concat());
		this.obGridFilterDataModels().unshift({ id: ko.observable(null), name: ko.observable("Do Not Include"), isValid: ko.observable(true) });
		var selectedGridFilterDataModel = Enumerable.From(this.obGridFilterDataModels()).Where(function(c) { return c.id() == displayFilter }).ToArray()[0];
		this.obSelectedGridFilterDataModel = ko.observable(selectedGridFilterDataModel);
		this.obApplyOnSave = ko.observable(false);
		this.obIsSafari = ko.observable(TF.isSafari);

		this.obErrorMessageDivIsShow = ko.observable(false);
		this.obValidationErrors = ko.observableArray([]);

		this.obErrorMessageTitle = ko.observable("Error Occurred");
		this.obErrorMessageDescription = ko.observable("The following error occurred.");

		//drop down list
		this.obSelectedGridFilterDataModelText = ko.observable(selectedGridFilterDataModel ? selectedGridFilterDataModel.name() : "");
		this.obSelectedGridFilterDataModelText.subscribe(this.selectedGridFilterDataModelChange, this);
		this.validationMessage = null;
		this.pageLevelViewModel = new TF.PageLevel.BasePageLevelViewModel();
	}

	ModifyLayoutViewModel.prototype.save = function()
	{
		var self = this;
		tf.loadingIndicator.showImmediately();
		return this.pageLevelViewModel.saveValidate()
			.then(function(valid)
			{
				tf.loadingIndicator.tryHide();
				if (valid)
				{
					return self._save();
				}
				else
				{
					return Promise.reject();
				}
			}.bind(this))
	};


	ModifyLayoutViewModel.prototype._save = function()
	{
		if (this.gridLayoutExtendedDataModel.apiIsDirty())
		{
			var requestData = {
				DataTypeID: this.gridLayoutExtendedDataModel.dataTypeId(),
				Name: this.gridLayoutExtendedDataModel.name(),
				FilterID: this.gridLayoutExtendedDataModel.filterId() || null,
				FilterName: this.gridLayoutExtendedDataModel.filterName() || "",
				ShowSummaryBar: this.gridLayoutExtendedDataModel.showSummaryBar() || null,
				Description: this.gridLayoutExtendedDataModel.description(),
				LayoutColumns: JSON.stringify(this.gridLayoutExtendedDataModel.layoutColumns())
			};
			if (this.isNew !== "new")
			{
				requestData.ID = this.gridLayoutExtendedDataModel.id()
			}
			return (
				this.isNew === "new" ?
					tf.promiseAjax.post(pathCombine(tf.api.apiPrefixWithoutDatabase(), "gridlayouts"), { data: [requestData] }) :
					tf.promiseAjax.put(pathCombine(tf.api.apiPrefixWithoutDatabase(), "gridlayouts", requestData.ID), { data: requestData })
			)
				.then(function(apiResponse)
				{
					this.gridLayoutExtendedDataModel.dataTypeId(apiResponse.Items[0].DataTypeId);
					this.gridLayoutExtendedDataModel.name(apiResponse.Items[0].Name);
					this.gridLayoutExtendedDataModel.filterId(apiResponse.Items[0].FilterId);
					this.gridLayoutExtendedDataModel.filterName(apiResponse.Items[0].FilterName);
					this.gridLayoutExtendedDataModel.showSummaryBar(apiResponse.Items[0].ShowSummaryBar);
					this.gridLayoutExtendedDataModel.description(apiResponse.Items[0].Description);
					this.gridLayoutExtendedDataModel.layoutColumns(JSON.parse(apiResponse.Items[0].LayoutColumns));
					this.gridLayoutExtendedDataModel.id(apiResponse.Items[0].Id);
					this.gridLayoutExtendedDataModel.apiIsDirty(false);

					return this.gridLayoutExtendedDataModel;
				}.bind(this))
				.catch(function(apiResponse)
				{
					this.obErrorMessageDivIsShow(true);
					this.obValidationErrors([{ message: apiResponse.Message }]);
					throw apiResponse;
				})
		}
		else
		{
			return Promise.resolve(this.gridLayoutExtendedDataModel);
		}
	};

	ModifyLayoutViewModel.prototype.selectedGridFilterDataModelChange = function()
	{
		this.gridLayoutExtendedDataModel.filterId(this.obSelectedGridFilterDataModel() ? this.obSelectedGridFilterDataModel().id() : null);
		this.gridLayoutExtendedDataModel.filterName(this.obSelectedGridFilterDataModel() ? this.obSelectedGridFilterDataModel().name() : null);
	};

	ModifyLayoutViewModel.prototype.gotoSelectFilter = function(viewModel, el)
	{
		this.obSearchFilter("");
		this.obFilterDataList(this.obGridFilterDataModels().slice());
		this.obStatus('selectfilter');
	};

	ModifyLayoutViewModel.prototype.goToLayout = function()
	{
		this.obStatus('layout');
	};

	ModifyLayoutViewModel.prototype.emptySearchFilter = function()
	{
		this.obSearchFilter("");
	};

	ModifyLayoutViewModel.prototype.selectFilter = function(modal, e)
	{
		this.obSelectedGridFilterDataModel(modal);
		this.selectedGridFilterDataModelChange();
		this.obStatus('layout');
	};

	ModifyLayoutViewModel.prototype.searchFilter = function()
	{
		var self = this;
		this.obFilterDataList(Enumerable.From(this.obGridFilterDataModels()).Where(function(item)
		{
			return item.name().toLowerCase().indexOf(self.obSearchFilter().toLowerCase()) >= 0;
		}).ToArray());
	};

	ModifyLayoutViewModel.prototype.initialize = function(viewModel, el)
	{
		this._$form = $(el);
		var self = this;
		if (TF.isPhoneDevice)
		{
			new TF.TapHelper($(el).find(".switch .slider-block")[0], {
				swipingLeft: function(evt)
				{
					$(el).find(".switch input").prop("checked", false);
					self.obApplyOnSave(false);
				},
				swipingRight: function(evt)
				{
					$(el).find(".switch input").prop("checked", true);
					self.obApplyOnSave(true);
				}
			});
		}
		TF.Control.BaseControl.keyboardShowHideToggleHeight($("#saveLayoutContentBody"));

		setTimeout(function()
		{
			if (this._$form.closest(".tfmodal-container").length > 0)
			{
				this.validationMessage = this._$form.closest(".tfmodal-container").find(".page-level-message-container");
				this.validationMessage.css("z-index", this._$form.closest(".tfmodal.modal").css("z-index"));
				$("body").append(this.validationMessage);
			}
		}.bind(this));
		setTimeout(function()
		{
			var isValidating = false, self = this,
				updateErrors = function($field, errorInfo)
				{
					var errors = [];
					$.each(self.pageLevelViewModel.obValidationErrors(), function(index, item)
					{
						if ($field[0] === item.field[0])
						{
							if (item.rightMessage.indexOf(errorInfo) >= 0)
							{
								return true;
							}
						}
						errors.push(item);
					});
					self.pageLevelViewModel.obValidationErrors(errors);
				};
			this._$form
				.bootstrapValidator({
					excluded: [':hidden', ':not(:visible)'],
					live: 'enabled',
					message: 'This value is not valid',
					fields: {
						layoutName: {
							trigger: "blur change",
							validators: {
								notEmpty: {
									message: " required"
								},
								callback: {
									message: " must be unique",
									callback: function(value, validator, $field)
									{
										if (!value)
										{
											updateErrors($field, "unique");
											return true;
										}
										else
										{
											updateErrors($field, "required");
										}
										return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "gridlayouts"), {
											paramData: {
												name: this.gridLayoutExtendedDataModel.name()
											}
										}, { overlay: false }).then(function(apiResponse)
										{
											if (!apiResponse.Items[0] && this.obStatus() === 'selectfilter')
											{
												$field.parent().find("[data-bv-validator=callback]").css("display", "block");
												$field.parent().find("[data-bv-validator=callback]").attr("data-bv-result", "INVALID");
												$field.parent().addClass("has-error");
											}
											if (apiResponse.Items.length === 0) return true;

											if (this.gridLayoutExtendedDataModel.id() === 0 || apiResponse.Items[0].Id !== this.gridLayoutExtendedDataModel.id())
											{
												return false;
											}

											return true;
										}.bind(this))
									}.bind(this)
								}
							}
						}
					}
				}).on('success.field.bv', function(e, data)
				{
					if (!isValidating)
					{
						isValidating = true;
						self.pageLevelViewModel.saveValidate(data.element);
						isValidating = false;
					}
				});
			this.pageLevelViewModel.load(this._$form.data("bootstrapValidator"));
		}.bind(this), 0);
	};
	ModifyLayoutViewModel.prototype.apply = function(viewModel, e)
	{
		if (!this.obSelectedGridFilterDataModel().isValid())
		{
			return tf.promiseBootbox.alert("Filter is invalid. It cannot be saved.", 'Warning', 40000).then(function()
			{
				return false;
			}.bind(this));
		}

		return this.save()
			.then(function(savedGridLayoutExtendedDataModel)
			{
				if (TF.menuHelper)
				{
					TF.menuHelper.hiddenMenu();
				}
				return {
					applyOnSave: this.obApplyOnSave(),
					savedGridLayoutExtendedDataModel: savedGridLayoutExtendedDataModel
				}
				self.positiveClose(result);
			}.bind(this), function()
			{
			});
	};
	ModifyLayoutViewModel.prototype.dispose = function()
	{
		this.validationMessage.remove();
		this._$form.data("bootstrapValidator").destroy();
		this.pageLevelViewModel.dispose();
	};

	ModifyLayoutViewModel.prototype.focusField = function(viewModel, e)
	{
		if (viewModel.field)
		{
			$(viewModel.field).focus();
		}
	}

	ModifyLayoutViewModel.prototype.cancel = function()
	{
		return new Promise(function(resolve, reject)
		{
			if (this.gridLayoutExtendedDataModel.apiIsDirty())
			{
				resolve(tf.promiseBootbox.yesNo("You have unsaved changes.  Would you like to save your changes prior to canceling?", "Unsaved Changes"));
			} else
			{
				resolve(false);
			}
		}.bind(this));
	};
})();
