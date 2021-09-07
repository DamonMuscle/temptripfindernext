(function()
{
	TF.FilterSet = function(logicalOperator, filterItems, filterSets)
	{
		this.LogicalOperator = logicalOperator;
		this.FilterItems = filterItems ? filterItems : [];
		this.FilterSets = filterSets ? filterSets : [];
		this.noRightFetchingData = false;
	}

	createNamespace("TF.Control").FormRecordSelector = FormRecordSelector;

	function FormRecordSelector(elem, options)
	{
		this.elem = elem;
		this.options = options;
		this.val = null;
		this.init();
	}
	FormRecordSelector.prototype = Object.create(TF.Control.FormRecordSelector.prototype);
	FormRecordSelector.prototype.constructor = FormRecordSelector;

	Object.defineProperty(FormRecordSelector.prototype, 'element', {
		get() { return this.elem; },
		enumerable: false,
		configurable: false
	});

	Object.defineProperty(FormRecordSelector.prototype, 'value', {
		get() { return this.val; },
		set(val)
		{
			this.val = val;
			if (this.options.valueChanged)
			{
				this.options.valueChanged(val);
			}
		},
		enumerable: false,
		configurable: false
	});

	FormRecordSelector.prototype.init = function()
	{
		let self = this, autoCompleteElem = this.elem,
			type = this.options.dataType;

		this.autoComplete = autoCompleteElem.kendoAutoComplete({
			dataTextField: 'text',
			enable: this.options.enable,
			select: e =>
			{

				if (e.dataItem)
				{
					let recordValue = e.dataItem.value;
					this.value = recordValue;
				}
				else
				{
					this.value = null;
				}

			},
			change: e =>
			{
				/**
				let dataItem = e.sender && e.sender.dataItem && e.sender.dataItem();
				if (!dataItem)
				{
					this.value = null;
				} */
			},
			noDataTemplate: () => 
			{
				if (this.noRightFetchingData)
				{
					return `The roles of this user doesn't have the right to access ${type} data. Please contact your administrator.`;
				}
				else
				{
					return `Sorry, no results found for ${autoCompleteElem.val()}`;
				}
			},
			dataSource: {
				serverFiltering: true,
				transport: {
					read: options =>
					{
						let value = (this.autoComplete.value() || '').trim(),
							config = TF.Form.formConfig[type],
							sortItems = config.sortItems,
							generatedItems = config.generateFilterItems(config.filterItems, value),
							filterItems = generatedItems.filterItems,
							filterSets = generatedItems.filterSets,
							filterSet;


						if (autoCompleteElem.data("enter_key_press") !== true)
						{
							if (value.length < 2)
							{
								if (this.autoComplete.dataItems().length === 0)
								{
									options.error();
								}
								else
								{
									options.success([]);
								}
								this.autoComplete.popup.close();
								return;
							}
							else
							{
								autoCompleteElem.removeData("enter_key_press");
							}
						}

						if (value.length === 0)
						{
							options.error();
							this.autoComplete.popup.close();
							autoCompleteElem.removeData("enter_key_press");
							return;
						}

						filterSet = new TF.FilterSet(generatedItems.logicOperator, filterItems, filterSets);

						let opts = {
							paramData: {
								take: 10,
								skip: 0,
								getCount: true
							},
							data: {
								fields: config.fields,
								sortItems: sortItems,
								idFilter: null,
								filterSet: filterSet,
								isQuickSearch: false,
								filterClause: ""
							}
						};
						this.fetchData(opts, options);
					}
				}
			}
		}).data("kendoAutoComplete");

		this.autoComplete.list.addClass('form-record-selector-list');
		autoCompleteElem.closest(".k-widget")
			.prepend('<span class="k-icon k-i-search"></span>')

		autoCompleteElem.closest(".k-widget").find(".k-i-search").click(function()
		{
			if (autoCompleteElem.attr("disabled") === "disabled")
			{
				return;
			}
			if (autoCompleteElem.val() != "")
			{
				autoCompleteElem.focus();
				autoCompleteElem.data("enter_key_press", true);
				self.autoComplete.search(autoCompleteElem.val());
			}
		});

		setTimeout(() =>
		{
			this.autoComplete.popup.element.width(autoCompleteElem.outerWidth(true) - 2);
			// todo
			this.autoComplete.noData.css({ minHeight: "initial", display: "initial", textTransform: "initial", wordBreak: "break-all" });
		});

		autoCompleteElem.click((ev) =>
		{
			if (autoCompleteElem.val().length >= 2 || (autoCompleteElem.data("enter_key_press") === true && autoCompleteElem.val().length != 0))
			{
				this.autoComplete.popup.open();
			}
		}).keypress(event =>
		{
			if (event.which == 13 && autoCompleteElem.val() != "")
			{
				autoCompleteElem.data("enter_key_press", true);
				this.autoComplete.search(autoCompleteElem.val());
				event.preventDefault();
			}
		});

		// focus the autocomplete
		setTimeout(() =>
		{
			autoCompleteElem.focus();
		}, 200);
	}

	FormRecordSelector.prototype.fetchData = function(opts, options)
	{
		this.noRightFetchingData = false;
		tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "search", tf.dataTypeHelper.getEndpoint(this.options.dataType)),
			opts,
			{ overlay: false })
			.then(data =>
			{
				this.validateData(data, options);
			}).catch(ex =>
			{
				if (ex.StatusCode === 403 && ex.Message === `The roles of this user doesn't have the right to access this API`)
				{
					this.noRightFetchingData = true;
				}
				let simEmptyData = {
					FilteredRecordCount: 0,
					Items: [],
					TotalRecordCount: 0
				};
				this.validateData(simEmptyData, options);
			});
	}

	FormRecordSelector.prototype.validateData = function(data, options)
	{
		let config = TF.Form.formConfig[this.options.dataType];

		if (data.Items)
		{
			//data.Items.length && data.Items.length > 0
			var entities = data.Items,
				cards = entities.map(item => config.formatItem(item));

			options.success(cards);
		}
		else
		{
			options.error(data);
		}
	}

	FormRecordSelector.prototype.dispose = function()
	{

	}

})();
