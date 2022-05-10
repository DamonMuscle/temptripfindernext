const NAMESPACE_TFCONTROLE = "TF.Control";
const CLASS_NAME_KICON_TFFILTER = ".k-icon.tf-filter";

(function ()
{

	createNamespace(NAMESPACE_TFCONTROLE).FormRecordWithFilterSelector = FormRecordWithFilterSelector;

	function FormRecordWithFilterSelector(elem, options)
	{
		this.tooltip = new TF.Helper.TFTooltip();
		this.canClearFilter = options.canClearFilter,
			this.isFilterApplied = false;
		this.isFilterDisabled = false;
		TF.Control.FormRecordSelector.apply(this, arguments);
	}
	FormRecordWithFilterSelector.prototype = Object.create(TF.Control.FormRecordSelector.prototype);
	FormRecordWithFilterSelector.prototype.constructor = FormRecordWithFilterSelector;

	FormRecordWithFilterSelector.prototype.getPlaceHolder = function ()
	{
		return 'My ' + tf.dataTypeHelper.getFormDataType(this.options.dataType) + "s";
	}

	FormRecordWithFilterSelector.prototype.init = function ()
	{
		this.elem.addClass('filter-input');
		TF.Control.FormRecordSelector.prototype.init.apply(this, arguments)

		let ele = this.autoComplete.wrapper,
			pHolder = this.getPlaceHolder();

		ele.prepend(`<span class="k-icon tf-filter" data-toggle="modal"></span>
				<span class="current-filter-label">
					<span class="filter-label" style="display:block;">Current Filter: 
						<span class="filter-type-label">${pHolder}</span>
					</span>
					<span class="k-icon k-clear-value k-i-close filter-close" title="clear" role="button"></span>
				</span>
				<div class="modal" id="myModal" tabindex="-1" role="dialog">
				</div>`);

		let tfFilter = ele.find(CLASS_NAME_KICON_TFFILTER),
			modalEle = ele.find('#myModal'),
			clearFilterEle = ele.find('.current-filter-label .k-clear-value');

		this.tooltip.init(tfFilter, {
			template: '<div class="tooltip tf-tooltip form-record-tooltip" role="tooltip"><div class="tooltip-inner"></div></div>',
			trigger: 'manual',
			animation: false,
			placement: 'bottom',
			title: pHolder
		});
		clearFilterEle.on('click', e =>
		{
			if (!this.isFilterDisabled)
			{
				this.toggleFilterApply(false);
			}
		});
		tfFilter.on('click', e =>
		{
			if (!this.isFilterApplied && !this.isFilterDisabled)
			{
				modalEle.modal('show');
			}
		});
		modalEle.on('show.bs.modal', e =>
		{
			tfFilter.tooltip('show');
			$('.form-record-tooltip .tooltip-inner').on('click', e =>
			{
				this.toggleFilterApply(true);
				this.value = null;
				modalEle.modal('hide');
			});
		}).on('hide.bs.modal', e =>
		{
			$('.form-record-tooltip .tooltip-inner').off('click');
			tfFilter.tooltip('hide');
		});
		this.toggleFilterEnable(this.canClearFilter);
	}

	FormRecordWithFilterSelector.prototype.toggleFilterApply = function (applyFilter)
	{
		let ele = this.autoComplete.wrapper,
			tfFilter = ele.find(CLASS_NAME_KICON_TFFILTER),
			filterLabel = ele.find('.current-filter-label');

		if (applyFilter)
		{
			this.isFilterApplied = true;
			filterLabel.show();
			tfFilter.addClass('filter-applied');
			this.autoComplete.value('');
		}
		else
		{
			this.isFilterApplied = false;
			filterLabel.hide();
			tfFilter.removeClass('filter-applied');
			this.autoComplete.value('');
		}

		if (this.checkOneRecord && this.options.needOneRecordCheck)
		{
			this.checkOneRecord(applyFilter);
		}
	}

	FormRecordWithFilterSelector.prototype.toggleFilterEnable = function (enableFilter)
	{
		let ele = this.autoComplete.wrapper,
			tfFilter = ele.find(CLASS_NAME_KICON_TFFILTER),
			clearFilterEle = ele.find('.current-filter-label .k-clear-value');

		if (enableFilter)
		{
			this.isFilterDisabled = false;
			clearFilterEle.show();
			tfFilter.removeClass('filter-disabled');
		}
		else
		{
			this.isFilterDisabled = true;
			clearFilterEle.hide();
			tfFilter.addClass('filter-disabled');
		}
	}

	FormRecordWithFilterSelector.prototype.fetchMyTripIDs = function ()
	{
		if (this.isFilterApplied)
		{
			let staffInfo = tf.staffInfo,
				filterItem = {
					FieldName: '',
					IsListFilter: true,
					Operator: 'In',
					TypeHint: 'Number',
					Value: staffInfo.staffID.join(','),
					ValueList: JSON.stringify(staffInfo.staffID)
				},
				filterItems = [],
				filterSet = new TF.FilterSet('Or', filterItems);

			let opts = {
				paramData: {
					getCount: true
				},
				data: {
					fields: ["Id", "CurrentVehicle", "CurrentVehicleID"],
					idFilter: null,
					filterSet: filterSet,
					isQuickSearch: false,
					filterClause: ""
				}
			};
			if (staffInfo.isDriver)
			{
				filterItem.FieldName = 'CurrentDriverID';
				filterItems.push(filterItem);
			}
			else if (staffInfo.isAide)
			{
				filterItem.FieldName = 'CurrentBusAideID';
				filterItems.push(filterItem);
			}
			return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "search", "trips?dateTime=" + new Date().toISOString().split("T")[0]),
				opts,
				{ overlay: false })
				.then(data =>
				{
					return data && data.Items;
				});
		}
		else
		{
			return Promise.resolve([]);
		}
	}

	FormRecordWithFilterSelector.prototype.parseFilterSetToQueryStrings = function (options)
	{
		let queryStringArr = [],
			data = options.data,
			sortItems = data.sortItems,
			fields = data.fields,
			filterItems = data.filterSet.FilterItems,
			filterSets = data.filterSet.FilterSets,
			operatorKey = data.filterSet.LogicalOperator === 'And' ? '&' : '|',
			param = options.paramData;

		if (param)
		{
			if (param.take != null)
			{
				queryStringArr.push(`@take=${param.take}`);
			}
			if (param.skip != null)
			{
				queryStringArr.push(`@skip=${param.skip}`);
			}
		}
		if (fields && fields.length > 0)
		{
			let queryString = '@fields=';
			queryString += fields.join(',');
			queryStringArr.push(queryString);
		}
		if (sortItems && sortItems.length > 0)
		{
			let queryString = '@sort=';
			let items = sortItems.map(item =>
			{
				return `${item.Name}|${item.Direction === 'Ascending' ? 'asc' : 'desc'}`;
			});
			queryString += items.join(',');
			queryStringArr.push(queryString);

		}
		if (filterItems && filterItems.length > 0)
		{
			let queryString = '@filter=';
			let items = filterItems.map(item =>
			{
				//Contains => contains. there're issues if operator is eq or others.
				return `${item.Operator.toLowerCase()}(${item.FieldName},${encodeURIComponent(item.Value)})`
			});
			queryString += items.join(operatorKey);
			queryStringArr.push(queryString);
		}
		if (filterSets && filterSets.length > 0)
		{
			let queryString = '@filter= ';
			let items = filterSets.map(set =>
			{
				let setItems = set.FilterItems.map(item =>
				{
					//Contains => contains. there're issues if operator is eq or others.
					return `${item.Operator.toLowerCase()}(${item.FieldName},${item.Value})`;
				})
				let key = set.LogicalOperator === 'And' ? '&' : '|'
				return `(${encodeURIComponent(setItems.join(key))})`;
			});
			queryString += items.join(operatorKey);
			queryStringArr.push(queryString);
		}
		return queryStringArr;
	}

	FormRecordWithFilterSelector.prototype.dispose = function ()
	{
		let ele = this.autoComplete.wrapper,
			tfFilter = ele.find(CLASS_NAME_KICON_TFFILTER),
			modalEle = ele.find('#myModal');

		tfFilter.off('click');
		modalEle.off('.bs.modal');
		this.tooltip.destroy(tfFilter);
		this.tooltip = null;
	}

})();

(function ()
{

	createNamespace(NAMESPACE_TFCONTROLE).FormStaffRecordSelector = FormStaffRecordSelector;

	function FormStaffRecordSelector(elem, options)
	{
		TF.Control.FormRecordWithFilterSelector.apply(this, arguments);
	}
	FormStaffRecordSelector.prototype = Object.create(TF.Control.FormRecordWithFilterSelector.prototype);
	FormStaffRecordSelector.prototype.constructor = FormStaffRecordSelector;


	FormStaffRecordSelector.prototype.getPlaceHolder = function ()
	{
		return 'My Record';
	}

	FormStaffRecordSelector.prototype.init = function()
	{
		TF.Control.FormRecordWithFilterSelector.prototype.init.apply(this, arguments);
		 this.toggleFilterApply(true);
	}

	FormStaffRecordSelector.prototype.checkOneRecord = function(applyFilter)
	{
		if (applyFilter)
		{
			const staffInfo = tf.staffInfo;
			if (staffInfo.staffID && staffInfo.staffID.length === 1)
			{
				const config = TF.Form.formConfig[this.options.dataType],
					item = config.formatItem(staffInfo.items[0]);

				this.autoComplete.value(item.text);
				this.value = item.value;
				this.checkOnlyOneRecord = true;
				if (this.options.onlyOneRecordCallback)
				{
					this.options.onlyOneRecordCallback(true);
				}
			}
		} else
		{
			var opts = {
				"paramData": {
					"getCount": true,
					"take": 10
				}
			}

			TF.DetailView.UserDefinedGridHelper.fetchFormSearchData(opts, this.options.dbId, this.options.dataType)
				.then((_res) =>
				{
					if (_res.Items && _res.Items.length == 1)
					{
						const config = TF.Form.formConfig[this.options.dataType],
							item = config.formatItem(_res.Items[0]);

						this.autoComplete.value(item.text);
						this.value = item.value;
					}
					if (this.options.onlyOneRecordCallback)
					{
						this.options.onlyOneRecordCallback(_res.Items && _res.Items.length == 1);
					}
				});
		}
	}

	FormStaffRecordSelector.prototype.validateData = function (data, options)
	{
		if (!this.isFilterApplied)
		{
			TF.Control.FormRecordWithFilterSelector.prototype.validateData.apply(this, arguments);
			return;
		}

		let config = TF.Form.formConfig[this.options.dataType],
			staffInfo = tf.staffInfo;

		if (data.Items)
		{
			var entities = data.Items,
				cards;

			entities = entities.filter(entity =>
			{
				if (staffInfo.staffID.indexOf(entity.Id) > -1)
				{
					return true;
				}
				return false;
			})
			cards = entities.map(item => config.formatItem(item));

			options.success(cards);
		}
		else
		{
			options.error(data);
		}
	}

})();



(function ()
{

	createNamespace(NAMESPACE_TFCONTROLE).FormTripRecordSelector = FormTripRecordSelector;

	function FormTripRecordSelector(elem, options)
	{
		TF.Control.FormRecordWithFilterSelector.apply(this, arguments);
	}
	FormTripRecordSelector.prototype = Object.create(TF.Control.FormRecordWithFilterSelector.prototype);
	FormTripRecordSelector.prototype.constructor = FormTripRecordSelector;

	FormTripRecordSelector.prototype.init = function ()
	{
		TF.Control.FormRecordWithFilterSelector.prototype.init.apply(this, arguments);

		this.toggleFilterApply(true);
	}

	FormTripRecordSelector.prototype.checkOneRecord = function(applyFilter)
	{
		const staffInfo = tf.staffInfo;
		var newOpts = {
			"paramData": {
				"getCount": true,
				"take": 10
			},
			"data": {
				"filterSet": {
					"FilterItems": []
				}
			}
		}
		if (this.isFilterApplied)
		{
			const filterItems = newOpts.data && newOpts.data.filterSet && newOpts.data.filterSet.FilterItems;
			const filterItem = {
				FieldName: '',
				IsListFilter: true,
				Operator: 'In',
				TypeHint: 'Number',
				Value: staffInfo.staffID.join(','),
				ValueList: JSON.stringify(staffInfo.staffID)
			}
			if (staffInfo.isDriver)
			{
				filterItem.FieldName = 'CurrentDriverID';
				filterItems.push(filterItem);
			}
			else if (staffInfo.isAide)
			{
				filterItem.FieldName = 'CurrentBusAideID';
				filterItems.push(filterItem);
			}
		}

		TF.DetailView.UserDefinedGridHelper.fetchFormSearchData(newOpts, this.options.dbId, this.options.dataType)
			.then((_res) =>
			{
				if (_res.Items && _res.Items.length == 1)
				{
					const config = tf.formConfig[this.options.dataType],
						item = config.formatItem(_res.Items[0]);

					this.autoComplete.value(item.text);
					this.value = item.value;
				}
				if (this.options.onlyOneRecordCallback)
				{
					this.options.onlyOneRecordCallback(_res.Items && _res.Items.length == 1);
				}
			});

	}

	FormTripRecordSelector.prototype.fetchData = function (opts, options)
	{
		let newOpts = JSON.parse(JSON.stringify(opts));
		if (this.isFilterApplied)
		{
			let staffInfo = tf.staffInfo,
				filterItems = newOpts.data && newOpts.data.filterSet && newOpts.data.filterSet.FilterItems;

			if (filterItems != null && Array.isArray(filterItems))
			{
				let filterItem = {
					FieldName: '',
					IsListFilter: true,
					Operator: 'In',
					TypeHint: 'Number',
					Value: staffInfo.staffID.join(','),
					ValueList: JSON.stringify(staffInfo.staffID)
				}
				if (staffInfo.isDriver)
				{
					filterItem.FieldName = 'CurrentDriverID';
					filterItems.push(filterItem);
				}
				else if (staffInfo.isAide)
				{
					filterItem.FieldName = 'CurrentBusAideID';
					filterItems.push(filterItem);
				}
			}
		}

		TF.Control.FormRecordWithFilterSelector.prototype.fetchRecordData.apply(this, [newOpts, options]);
	}

})();



(function ()
{

	createNamespace(NAMESPACE_TFCONTROLE).FormVehicleRecordSelector = FormVehicleRecordSelector;

	function FormVehicleRecordSelector(elem, options)
	{
		TF.Control.FormRecordWithFilterSelector.apply(this, arguments);
	}
	FormVehicleRecordSelector.prototype = Object.create(TF.Control.FormRecordWithFilterSelector.prototype);
	FormVehicleRecordSelector.prototype.constructor = FormVehicleRecordSelector;

	FormVehicleRecordSelector.prototype.init = function ()
	{
		TF.Control.FormRecordWithFilterSelector.prototype.init.apply(this, arguments);

		this.toggleFilterApply(true);
	}

	FormVehicleRecordSelector.prototype.checkOneRecord = function(isFilterApplied)
	{
		var options = this.options;
		if (isFilterApplied)
		{
			this.fetchMyTripIDs().then(res =>
			{
				if (!res || !res.length)
				{
					return;
				}

				let vehicleData = res.map(r =>
				{
					return { Id: r.CurrentVehicleID, BusNum: r.CurrentVehicle };
				});
				const vehicleIds = [];
				vehicleData = vehicleData.filter(r =>
				{
					const isValidVehicleId = (r && r.Id && vehicleIds.indexOf(r.Id) === -1);
					if (isValidVehicleId)
					{
						vehicleIds.push(r.Id);
					}

					return isValidVehicleId;
				});

				if (vehicleData && vehicleData.length == 1)
				{
					const config = TF.Form.formConfig[this.options.dataType],
						item = config.formatItem(vehicleData[0]);

					this.autoComplete.value(item.text);
					this.value = item.value;
				}
				if (this.options.onlyOneRecordCallback)
				{
					this.options.onlyOneRecordCallback(vehicleData && vehicleData.length == 1);
				}

			});
		}
		else
		{
			var opts = {
				"paramData": {
					"getCount": true,
					"take": 10
				}
			}

			TF.DetailView.UserDefinedGridHelper.fetchFormSearchData(opts, this.options.dbId, this.options.dataType)
				.then((_res) =>
				{
					if (_res.Items && _res.Items.length == 1)
					{
						const config = tf.formConfig[this.options.dataType],
							item = config.formatItem(_res.Items[0]);

						this.autoComplete.value(item.text);
						this.value = item.value;
					}
					if (this.options.onlyOneRecordCallback)
					{
						this.options.onlyOneRecordCallback(_res.Items && _res.Items.length == 1);
					}
				});
		}
	}

	FormVehicleRecordSelector.prototype.fetchData = function (opts, options)
	{
		if (this.isFilterApplied)
		{
			this.fetchMyTripIDs().then(res =>
			{
				if (res && res.length > 0)
				{
					let vehicleData = res.map(r =>
					{
						const checkValue = options.data.filter.filters[0].value || "";
						if (checkValue && r.CurrentVehicle)
						{
							if (r.CurrentVehicle.includes(checkValue))
							{
								return { Id: r.CurrentVehicleID, BusNum: r.CurrentVehicle };
							}
						}

						return { Id: null, BusNum: null };
					});
					const vehicleIds = [];
					vehicleData = vehicleData.filter(r =>
					{
						if (r && r.Id && vehicleIds.indexOf(r.Id) === -1)
						{
							vehicleIds.push(r.Id);
							return true;
						}
						else
						{
							return false;
						}
					});
					this.validateData({ Items: vehicleData }, options);
				}
				else
				{
					this.validateData({ Items: [] }, options);
				}
			}).catch(rej =>
			{
				this.validateData({ Items: [] }, options);
			});
		}
		else
		{
			TF.Control.FormRecordWithFilterSelector.prototype.fetchRecordData.apply(this, [opts, options]);
		}
	}

})();



(function ()
{

	createNamespace(NAMESPACE_TFCONTROLE).FormStudentRecordSelector = FormStudentRecordSelector;

	function FormStudentRecordSelector(elem, options)
	{
		TF.Control.FormRecordWithFilterSelector.apply(this, arguments);
	}
	FormStudentRecordSelector.prototype = Object.create(TF.Control.FormRecordWithFilterSelector.prototype);
	FormStudentRecordSelector.prototype.constructor = FormStudentRecordSelector;

	FormStudentRecordSelector.prototype.init = function ()
	{
		TF.Control.FormRecordWithFilterSelector.prototype.init.apply(this, arguments);

		this.toggleFilterApply(true);
	}

	FormStudentRecordSelector.prototype.checkOneRecord = function(applyFilter)
	{
		const params = [`take=10`, `getCount=true`, `filterType=submitted`];
		if (applyFilter)
		{
			this.fetchMyTripIDs().then(res =>
			{
				if (res && res.length > 0)
				{
					params.push(`tripIds=${res.map(r => r.Id).join(',')}`);
					tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), tf.dataTypeHelper.getEndpoint(this.options.dataType), '?' + params.join('&')))
						.then(_res =>
						{
							if (_res.Items && _res.Items.length == 1)
							{
								const config = TF.Form.formConfig[this.options.dataType],
									item = config.formatItem(_res.Items[0]);

								this.autoComplete.value(item.text);
								this.value = item.value;
							}
							if (this.options.onlyOneRecordCallback)
							{
								this.options.onlyOneRecordCallback(_res.Items && _res.Items.length == 1);
							}
						});
				}
			});
		}
		else
		{
			tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), tf.dataTypeHelper.getEndpoint(this.options.dataType), '?' + params.join('&')))
				.then(_res =>
				{
					if (_res.Items && _res.Items.length == 1)
					{
						const config = TF.Form.formConfig[this.options.dataType],
							item = config.formatItem(_res.Items[0]);

						this.autoComplete.value(item.text);
						this.value = item.value;
					}
					if (this.options.onlyOneRecordCallback)
					{
						this.options.onlyOneRecordCallback(_res.Items && _res.Items.length == 1);
					}
				});
		}

	}

	FormStudentRecordSelector.prototype.fetchData = function (opts, options)
	{
		if (this.isFilterApplied)
		{
			this.fetchMyTripIDs().then(res =>
			{
				if (res && res.length > 0)
				{
					let queryStrings = this.parseFilterSetToQueryStrings(opts);

					queryStrings.push(`tripIds=${res.map(r => r.Id).join(',')}`);

					tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), tf.dataTypeHelper.getEndpoint(this.options.dataType), '?' + queryStrings.join('&')))
						.then(res =>
						{
							this.validateData(res, options);
						});
				}
				else
				{
					this.validateData({ Items: [] }, options);
				}
			}).catch(rej =>
			{
				this.validateData({ Items: [] }, options);
			});
		}
		else
		{
			TF.Control.FormRecordWithFilterSelector.prototype.fetchRecordData.apply(this, [opts, options]);
		}
	}

})();


(function ()
{

	createNamespace(NAMESPACE_TFCONTROLE).FormFieldtripRecordSelector = FormFieldtripRecordSelector;

	function FormFieldtripRecordSelector(elem, options)
	{
		TF.Control.FormRecordWithFilterSelector.apply(this, arguments);
	}
	FormFieldtripRecordSelector.prototype = Object.create(TF.Control.FormRecordWithFilterSelector.prototype);
	FormFieldtripRecordSelector.prototype.constructor = FormFieldtripRecordSelector;

	FormFieldtripRecordSelector.prototype.init = function ()
	{
		TF.Control.FormRecordWithFilterSelector.prototype.init.apply(this, arguments);

		this.toggleFilterApply(true);
	}

	FormFieldtripRecordSelector.prototype.checkOneRecord = function(applyFilter)
	{
		const params = [`take=10`, `getCount=true`]
		if (applyFilter)
		{
			params.push(`filterType=submitted`);
		}
		const url = pathCombine(tf.api.apiPrefix(), 'search', 'fieldtrips?' + params.join('&'));
		tf.promiseAjax.post(url, null, { overlay: false })
			.then(_res =>
			{
				if (_res.Items && _res.Items.length == 1)
				{
					const config = TF.Form.formConfig[this.options.dataType],
						item = config.formatItem(_res.Items[0]);
					this.autoComplete.value(item.text);
					this.value = item.value;
				}
				if (this.options.onlyOneRecordCallback)
				{
					this.options.onlyOneRecordCallback(_res.Items && _res.Items.length == 1);
				}
			});
	}

	FormFieldtripRecordSelector.prototype.fetchData = function (opts, options)
	{
		if (this.isFilterApplied)
		{
			let take = 10,
				skip = 0;

			if (opts && opts.paramData)
			{
				take = opts.paramData.take || take;
				skip = opts.paramData.skip || skip;
			}

			let params = [`take=${take}`, `skip=${skip}`, `getCount=true`, `filterType=submitted`]
			let url = pathCombine(tf.api.apiPrefix(), 'search', 'fieldtrips?' + params.join('&'));
			tf.promiseAjax.post(url, opts, { overlay: false })
				.then(res =>
				{
					this.validateData(res, options);
				});
		}
		else
		{
			TF.Control.FormRecordWithFilterSelector.prototype.fetchRecordData.apply(this, [opts, options]);
		}
	}

})();