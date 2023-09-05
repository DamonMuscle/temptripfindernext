(function()
{
	ko.components.register('filter-drop-down-list', {

		template: '<div class="input-group" >' +
			'    <div name="distanceUnit" data-bind="typeahead:{source:obSource,format:format,afterRender:afterRender,drowDownShow:true,notSort:true,selectedValue:obSelectedValue,disable:disable}">' +
			'       <!-- ko customInput:{type:"Select",value:selectedFilterName,attributes:{class:"form-control"},disable:disable} -->' +
			'       <!-- /ko -->' +
			'    </div>' +
			'    <div class="input-group-btn">' +
			'        <button type="button" class="btn btn-default btn-sharp" >' +
			'            <span class="caret"></span>' +
			'        </button>' +
			'    </div>' +
			'</div>',
		viewModel: function(params)
		{
			var self = this;
			this.obFilters = ko.observableArray();
			if (params.needUpdate !== undefined)
			{
				self.needUpdate = params.needUpdate || null;
				self.needUpdate.subscribe(function()
				{
					// If create or delete filter, all filter-drop-down-list need to be updated.
					loadFilter();
				});
			}

			this.disable = ko.observable(params.disable || false);
			this.onlyApply = params.onlyApply;
			this.gridDefinition = {
				Columns: tf.studentGridDefinition.gridDefinition().Columns.map(function(definition)
				{
					return TF.Grid.GridHelper.convertToOldGridDefinition(definition);
				})
			};
			this.obSelectedValue = ko.observable(params.filter() || null);
			this.obSelectedGridFilterDataModel = ko.observable(params.filter() || null);
			this.obSelectedGridFilterId = ko.computed(function()
			{
				if (self.obSelectedGridFilterDataModel())
				{
					return self.obSelectedGridFilterDataModel().id();
				}
				return 0;
			});
			this.selectedFilterName = ko.computed(function()
			{
				if (self.obSelectedGridFilterDataModel())
				{
					return self.obSelectedGridFilterDataModel().name();
				}
				return "";
			});
			var newFilterText = "New Filter";
			var manageFilterText = "Manage Filters";
			var clearFilterText = "Clear";
			this.obSource = ko.computed(function()
			{
				if (self.onlyApply)
				{
					return [{
						name: ko.observable(clearFilterText)
					}, {
						name: ko.observable("[divider]")
					}].concat(self.obFilters());
				}
				else
				{
					return [{
						name: ko.observable(newFilterText)
					}, {
						name: ko.observable(manageFilterText)
					}, {
						name: ko.observable("[divider]")
					}, {
						name: ko.observable(clearFilterText)
					}, {
						name: ko.observable("[divider]")
					}].concat(self.obFilters());
				}
			});

			this.afterRender = function(input)
			{
				var typeahead = input.data("typeahead");
				var $menu = input.data("typeahead").$menu;
				setTimeout(function()
				{
					$menu.find("a").each(function(index, a)
					{
						var text = $(a).text();
						if (index < (!self.onlyApply ? 4 : 2))
						{
							$(a).click(function(e)
							{
								e.stopPropagation();
								e.preventDefault();
								typeahead.hide();
								if (text == newFilterText)
								{
									createNewFilterClick();
								}
								if (text == manageFilterText)
								{
									manageFilterClick();
								}
								if (text == clearFilterText)
								{
									clearGridFilterClick();
								}
							});
						}
					});
				}, 10);
			};

			this.obSelectedValue.subscribe(function(value)
			{
				self.obSelectedGridFilterDataModel(value);
				applyGridFilter(value);
			});

			this.format = function(value)
			{
				return value.name();
			};

			params.filter.subscribe(function()
			{
				setFilter();
			});

			loadFilter();

			function createNewFilterClick()
			{
				tf.modalManager.showModal(
					new TF.Modal.Grid.ModifyFilterModalViewModel(
						params.type,
						"new",
						null,
						null,
						self.gridDefinition,
						null
					)
				).then(function(result)
				{
					if (!result)
					{
						return;
					}
					self.obFilters.push(result.savedGridFilterDataModel);
					sortAllFilters();
					if (result.applyOnSave)
					{
						applyGridFilter(result.savedGridFilterDataModel);
					}
					setNeedUpdate();
				});
			}

			function manageFilterClick()
			{
				let filterDataModels = self.obFilters();
				if (!TF.isPhoneDevice)
				{
					// the ManageFilterViewModel will keep a copy of the filters list
					filterDataModels = filterDataModels.slice();
				}
				const allFiltersData = ko.observableArray(filterDataModels);
				const manageFilterModal = new TF.Modal.Grid.ManageFilterModalViewModel({
					obAllFilters: allFiltersData,
					editFilter: saveAndEditGridFilter,
					applyFilter: applyGridFilter,
					filterName: self.obSelectedGridFilterName
				});

				const manageFilterModalViewModel = manageFilterModal.data();
				manageFilterModalViewModel.onFilterDeleted.subscribe((evt, filterId) =>
				{
					const filter = self.obFilters().find(f => f.id() === filterId);
					if (filter)
					{
						self.obFilters.remove(filter);
					}
				});

				manageFilterModalViewModel.onFilterEdited.subscribe((evt, filterData) =>
				{
					if (typeof filterData === "object")
					{
						sortAllFilters();
					}
				});

				tf.modalManager.showModal(manageFilterModal).then(function()
				{
					checkClearSelectedFilter();
					setNeedUpdate();
				});
			}

			function clearGridFilterClick()
			{
				applyGridFilter(null);
			}

			function loadFilter()
			{
				let dateTypeName = tf.dataTypeHelper.getNameByType(params.type);
				let dataTypeId = tf.dataTypeHelper.getIdByName(dateTypeName);
				let	paramData = {
						"@filter": String.format("(eq(dbid, {0})|isnull(dbid,))&eq(datatypeId,{1})&eq(IsValid,true)&isnotnull(Name,)", tf.datasourceManager.databaseId, dataTypeId),
						"@sort": "Name"
					};
				if (params.withRelationship)
				{
					paramData["@relationships"] = "Reminder,AutoExport";
				}
				tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "gridfilters"), {
					paramData:paramData
				}).then(function(data)
				{
					var gridFilterDataModels = TF.DataModel.BaseDataModel.create(TF.DataModel.GridFilterDataModel, data.Items);
					self.obFilters(gridFilterDataModels);
					checkClearSelectedFilter();
				});
			}

			function setFilter()
			{
				var id = params.filter() ? params.filter().id() : 0;
				var filterName = params.filter() ? params.filter().name() : "";
				var whereClause = params.filter() ? params.filter().whereClause() : "";
				if (filterName && !Enumerable.From(self.obFilters()).Any(function(c) { return c.name() == filterName; }))
				{
					self.obFilters.push(params.filter());
				}
				var filter = Enumerable.From(self.obFilters()).FirstOrDefault(null, function(c) { return c.id() == id || c.name() == filterName || (!id && c.whereClause() == whereClause); });
				if (filter && params.filter())
				{
					if (params.filter() && params.filter().whereClause())
					{
						filter.whereClause(params.filter().whereClause());
					}
					self.obSelectedGridFilterDataModel(filter);
				} else
				{
					self.obSelectedGridFilterDataModel(null);
				}
			}

			function saveAndEditGridFilter(isNew, gridFilterDataModel, getCurrentHeaderFilters, getCurrentOmittedRecords, options)
			{
				return tf.modalManager.showModal(
					new TF.Modal.Grid.ModifyFilterModalViewModel(
						params.type,
						isNew,
						gridFilterDataModel,
						null,
						self.gridDefinition
					)
				).then(function(result)
				{
					if (!result)
					{
						return true;
					}
					if (isNew !== "new")
					{
						gridFilterDataModel.update(result.savedGridFilterDataModel.toData());
					}
					else
					{
						self.obFilters.push(result.savedGridFilterDataModel);
						sortAllFilters();
					}

					if (result.applyOnSave ||
						(self.obSelectedGridFilterDataModel() && result.savedGridFilterDataModel.id() == self.obSelectedGridFilterDataModel().id()))
					{
						applyGridFilter(result.savedGridFilterDataModel);
					}

					// return created/updated filter to let ManageFilterViewModel refresh the grid
					return result.savedGridFilterDataModel;

				});
			}

			function applyGridFilter(filter)
			{
				self.obSelectedGridFilterDataModel(filter);
				params.filter(filter);
			}

			function sortAllFilters()
			{
				self.obFilters(self.obFilters().sort((a, b) => a.name().toLowerCase() > b.name().toLowerCase() ? 1 : -1));
			}

			function setNeedUpdate()
			{
				if (params.needUpdate !== undefined)
				{
					params.needUpdate(self.needUpdate);
				}
			}

			function checkClearSelectedFilter()
			{
				var filterName = self.obSelectedValue() ? self.obSelectedValue().name() : "";
				if (filterName && !Enumerable.From(self.obFilters()).Any(function(c) { return c.name() == filterName; }))
				{
					clearGridFilterClick();
				}
			}
		},
	});
})();

