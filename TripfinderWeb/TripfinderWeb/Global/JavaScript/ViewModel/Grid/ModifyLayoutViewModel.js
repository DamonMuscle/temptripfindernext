(function()
{
	createNamespace("TF.Grid").ModifyLayoutViewModel = ModifyLayoutViewModel;

	const getPlaceholderDataModel = () => ({ id: ko.observable(null), name: ko.observable("Do Not Include") });

	ModifyLayoutViewModel.prototype = Object.create(TF.Control.BaseControl.prototype);
	ModifyLayoutViewModel.prototype.constructor = ModifyLayoutViewModel;

	function ModifyLayoutViewModel(options)
	{
		const {
			gridType, isNew, gridLayout, allFilters,
			selectedFilterId, uDGridId
		} = options;

		this.isNew = isNew;
		this._gridType = gridType;
		const gridLayoutExtendedDataModel = gridLayout.clone();
		if (isNew === "new")
		{
			gridLayoutExtendedDataModel.id(0);
			gridLayoutExtendedDataModel.dataTypeId(tf.dataTypeHelper.getId(gridType));
			gridLayoutExtendedDataModel.apiIsNew(true);
			gridLayoutExtendedDataModel.apiIsDirty(true);
			gridLayoutExtendedDataModel.name("");
			gridLayoutExtendedDataModel.description("");
			gridLayoutExtendedDataModel.uDGridId(uDGridId);
			gridLayoutExtendedDataModel.autoExportExists(false);
			gridLayoutExtendedDataModel.autoExports([]);
			displayFilterId = selectedFilterId;

		}
		else
		{
			displayFilterId = gridLayoutExtendedDataModel.filterId();
		}
		this.obStatus = ko.observable('layout');
		this.obSearchFilter = ko.observable("");
		this.obSearchFilter.subscribe(this.searchFilter.bind(this));
		this.gridLayoutExtendedDataModel = gridLayoutExtendedDataModel;
		this.obFilterDataList = ko.observableArray([]);
		this.obGridFilterDataModels = ko.observableArray([...allFilters]);
		this.obGridFilterDataModels().unshift(getPlaceholderDataModel());
		var selectedGridFilterDataModel = this.obGridFilterDataModels().find((c) => c.id() == displayFilterId) || this.obGridFilterDataModels()[0];
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
					var message = `This layout is associated with ${self.gridLayoutExtendedDataModel.autoExportNames()}.`;
					message += " Changes to this layout will affect the data and format of the data being exported. Are you sure you want to modify this layout?";
					var promise = (self.isNew === "edit" && self.gridLayoutExtendedDataModel.autoExportExists())
						? tf.promiseBootbox.yesNo(message, "Confirmation Message")
						: Promise.resolve(true);
					return promise.then(function(canSave)
					{
						if (canSave)
						{
							return self._save();
						}
						else
						{
							return Promise.resolve(null);
						}
					}.bind(self));
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
			const layoutColumns = this.gridLayoutExtendedDataModel.layoutColumns();
			const layoutAutoExportColumns = tf.dataTypeHelper.checkAutoExportSupport(this._gridType) ? tf.dataTypeHelper.mappingLayoutColumns(layoutColumns, this._gridType) : "";
			var requestData = {
				DataTypeID: this.gridLayoutExtendedDataModel.dataTypeId(),
				Name: this.gridLayoutExtendedDataModel.name(),
				FilterID: this.gridLayoutExtendedDataModel.filterId() || null,
				FilterName: this.gridLayoutExtendedDataModel.filterName() || "",
				ShowSummaryBar: this.gridLayoutExtendedDataModel.showSummaryBar() || null,
				Description: this.gridLayoutExtendedDataModel.description(),
				LayoutColumns: JSON.stringify(layoutColumns),
				LayoutAutoExportColumns: JSON.stringify(layoutAutoExportColumns),
				UDGridId: this.gridLayoutExtendedDataModel.uDGridId(),
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
					const savedLayout = apiResponse.Items[0];
					this.gridLayoutExtendedDataModel.dataTypeId(savedLayout.DataTypeId);
					this.gridLayoutExtendedDataModel.name(savedLayout.Name);
					this.gridLayoutExtendedDataModel.filterId(savedLayout.FilterId);
					this.gridLayoutExtendedDataModel.filterName(savedLayout.FilterName);
					this.gridLayoutExtendedDataModel.showSummaryBar(savedLayout.ShowSummaryBar);
					this.gridLayoutExtendedDataModel.description(savedLayout.Description);
					this.gridLayoutExtendedDataModel.layoutColumns(JSON.parse(savedLayout.LayoutColumns));
					this.gridLayoutExtendedDataModel.id(savedLayout.Id);
					this.gridLayoutExtendedDataModel.uDGridId(savedLayout.UDGridId);
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
