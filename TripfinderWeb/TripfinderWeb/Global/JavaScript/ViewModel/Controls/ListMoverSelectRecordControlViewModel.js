(function()
{
	createNamespace('TF.Control').ListMoverSelectRecordControlViewModel = ListMoverSelectRecordControlViewModel;
	function ListMoverSelectRecordControlViewModel (selectedData, options)
	{
		options.getUrl = function(gridType, options)
		{
			var prefix = tf.api.apiPrefix();
			if (options.dataSource)
			{
				prefix = pathCombine(tf.api.apiPrefixWithoutDatabase(), options.dataSource);
			}
			return pathCombine(prefix, "search", tf.dataTypeHelper.getEndpoint(gridType));
		};
		TF.Control.KendoListMoverWithSearchControlViewModel.call(this, selectedData, options);
		this.pageLevelViewModel = new TF.PageLevel.ListMoverPageLevelViewModel(this);
		ko.computed(function()
		{
			if (this.obSelectedData().length > 0)
			{
				this.pageLevelViewModel.obValidationErrorsSpecifed([]);
			}
		}, this);
	}

	ListMoverSelectRecordControlViewModel.prototype = Object.create(TF.Control.KendoListMoverWithSearchControlViewModel.prototype);
	ListMoverSelectRecordControlViewModel.prototype.constructor = ListMoverSelectRecordControlViewModel;

	ListMoverSelectRecordControlViewModel.prototype.columnSources = {
		student: [
			{
				FieldName: "FullName",
				DisplayName: "Name",
				Width: "120px",
				type: "string",
				isSortItem: true
			}
		],
		school: [
			{
				FieldName: "School",
				DisplayName: "Code",
				Width: "100px",
				type: "string",
				isSortItem: true
			}, {
				FieldName: "Name",
				DisplayName: "Name",
				Width: "260px",
				type: "string"

			}
		],
		altsite: [
			{
				FieldName: "Name",
				DisplayName: "Name",
				Width: "180px",
				type: "string",
				isSortItem: true
			}
		],
		contractor: [
			{
				FieldName: "Name",
				DisplayName: "Name",
				Width: "180px",
				type: "string",
				isSortItem: true
			}
		],
		district: [
			{
				FieldName: "District",
				DisplayName: "Code",
				Width: "180px",
				type: "string",
				isSortItem: true
			}, {
				FieldName: "Name",
				DisplayName: "Name",
				Width: "180px",
				type: "string",
				isSortItem: true
			}
		],
		fieldtrip: [
			{
				FieldName: "Name",
				DisplayName: "Name",
				Width: "180px",
				type: "string",
				isSortItem: true
			}
		],
		staff: [
			{
				FieldName: "FullName",
				DisplayName: "Name",
				Width: "180px",
				type: "string",
				isSortItem: true
			}
		],
		trip: [
			{
				FieldName: "Name",
				DisplayName: "Name",
				Width: "180px",
				type: "string",
				isSortItem: true
			}
		],
		vehicle: [
			{
				FieldName: "BusNum",
				DisplayName: "BusNum",
				Width: "180px",
				type: "string",
				isSortItem: true
			}
		],
		busfinderDriver: [
			{
				FieldName: "DriverName",
				DisplayName: "Driver",
				Width: "180px",
				type: "string",
				isSortItem: true
			}
		],
		busfinderVehicle: [
			{
				FieldName: "ExternalName",
				DisplayName: "Vehicle",
				Width: "180px",
				type: "string",
				isSortItem: true
			}
		]
	};


	ListMoverSelectRecordControlViewModel.prototype.getFields = function()
	{
		return this.columns.map(function(item) { return item.FieldName; }).concat(['Id']);
	};

	ListMoverSelectRecordControlViewModel.prototype.init = function(viewModel, el)
	{
		setTimeout(function()
		{
			this.$form = $(el);
			this.availableColGridContainer = this.$form.find(".availablecolumngrid-container");
			this.selectedColGridContainer = this.$form.find(".selectedcolumngrid-container");
			var stickyColumns = this.getCurrentSelectedColumns(this.options.type);
			if (stickyColumns)
			{
				this.columns = stickyColumns;
			}
			this.columns.map(function(item)
			{
				if (item.FieldName == "RawImage")
				{
					item.template = function(arg)
					{
						var url = "data:image/jpeg;base64," + arg.RawImage;
						return '<img style="width:20px; height:20px;" src="' + url + '" class="img-circle"/>';
					};
				}
			});
			this.originalColumns = this.columns.map(function(item)
			{
				return $.extend(
					{}, item);
			});


			this.getAllRecords().then(function()
			{
				this.initRightGrid();
				this.initLeftGrid();
				this.setDataSource();
				this.afterInit();
			}.bind(this));
			$(el).bootstrapValidator();
			this.pageLevelViewModel.load($(el).data("bootstrapValidator"));

		}.bind(this), 1000);
	}

	ListMoverSelectRecordControlViewModel.prototype.getSelectDataCount = function()
	{
		return this.selectedData.length;
	}

	ListMoverSelectRecordControlViewModel.prototype.apply = function()
	{
		TF.Control.KendoListMoverWithSearchControlViewModel.prototype.apply.call(this);
		return new Promise(function(resolve, reject)
		{
			if (this.options.mustSelect)
			{
				return this.pageLevelViewModel.saveValidate().then(function(result)
				{
					if (result)
					{
						resolve(this.selectedData);
					}
					else
					{
						reject();
					}
				}.bind(this));
			}
			else
			{
				resolve(this.selectedData);
			}
		}.bind(this));
	};

	ListMoverSelectRecordControlViewModel.prototype.cancel = function()
	{
		return new Promise(function(resolve, reject)
		{
			if (!isArraySame(this.oldData, this.selectedData))
			{
				return tf.promiseBootbox.yesNo("You have unsaved changes.  Would you like to save your changes prior to canceling?", "Unsaved Changes").then(function(result)
				{
					if (result)
					{
						resolve(this.selectedData);
					}
					else
					{
						resolve(false);
					}
				}.bind(this));
			} else
			{
				resolve(true);
			}
		}.bind(this));
	};

	ListMoverSelectRecordControlViewModel.prototype.dispose = function()
	{
		TF.Control.KendoListMoverWithSearchControlViewModel.prototype.dispose.call(this);
		this.pageLevelViewModel.dispose();
	}

	function isArraySame (oldData, newData)
	{
		if (newData.length != oldData.length)
		{
			return false;
		}
		var oldIds = oldData.map(function(item)
		{
			return item.Id;
		});
		var newIds = newData.map(function(item)
		{
			return item.Id;
		});
		var diffData1 = Enumerable.From(newIds).Where(function(x)
		{
			return !Array.contain(oldIds, x);
		}).ToArray();
		var diffData2 = Enumerable.From(oldIds).Where(function(x)
		{
			return !Array.contain(newIds, x);
		}).ToArray();
		return diffData1.length == 0 && diffData2.length == 0;
	}
})();
