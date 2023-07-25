(function()
{
	createNamespace("TF.UserDefinedField").CaseItemViewModel = CaseItemViewModel;

	function CaseItemViewModel(options)
	{
		this.options = options;
		this.obIsDefaultCase = ko.observable(!!options.isDefault);
		this.gridType = options.gridType;
		this.obDescription = ko.observable(`Enter the ${!!options.isDefault ? "value statement" : "case and value statements"} in the area below. You may use the Function, Field, Operator, Value and Logical fields to help you build your statement. To add a Function, Field, Operator, Value or Logical value to your statement, place your cursor in your statement where you would like the value added. Then select or enter a value.  The value will be added where your cursor was placed.`);

		this.operatorSource = ["==", "!=", ">", "<", ">=", "<="];
		this.logicalOperatorSource = ["and", "or"];
		this.functionList = [];
		this.entity = { Case: options.caseItem.Case || "", Value: options.caseItem.Value || "" };
		this.obCase = ko.observable(this.entity.Case);
		this.obValue = ko.observable(this.entity.Value);

		this.obAllFields = ko.computed(this._preHandleColumnsComputer, this);
		this.obSelectedField = ko.observable();
		this.obSelectedFieldText = ko.observable();
		this.obSelectedFieldText.subscribe(this.selectedFieldChanged.bind(this));

		this.caseAreaElement = ko.observable(null);
		this.valueAreaElement = ko.observable(null);
		this.activeElement = ko.observable(!!options.isDefault ? "valueStatement" : "caseStatement");

		this.pageLevelViewModel = new TF.PageLevel.BasePageLevelViewModel();

		this.verifyClick = _.debounce(this.verifyClick.bind(this), 100, { maxWait: 500 });
		this.validationCache = {};
	}

	CaseItemViewModel.prototype.init = function(viewModel, el)
	{
		tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "caseudfs/functions")).then(response =>
		{
			this.functionList = response.Items;
			this.setFunctions();

		});

		this.$form = $(el);
		this.initFunctionDropDown();
		this.initValidation();
	};

	CaseItemViewModel.prototype.setFunctions = function()
	{
		var data = [
			{
				text: "Date",
				items: []
			},
			{
				text: "Logical",
				items: this.logicalOperatorSource.map(x => { return { text: x, value: x }; })
			},
			{
				text: "Math/Numeric",
				items: []
			},
			{
				text: "Operator",
				items: this.operatorSource.map(x => { return { text: x, value: x }; })
			},
			{
				text: "String",
				items: []
			}];
		for (var i = 0; i < data.length; i++)
		{
			var items = this.functionList.filter(x => data[i].text.startsWith(x.FunctionKind)).map(x => { return { text: x.Name, value: x.Name } }).sort((a, b) => { return a.text.toLowerCase() > b.text.toLowerCase() ? 1 : -1; });
			if (items.length > 0)
			{
				data[i].items = items;
			}
		}
		var dataSource = new kendo.data.HierarchicalDataSource({
			data: data
		});
		this.dropdownAvailableTypes.setDataSource(dataSource);
	};

	CaseItemViewModel.prototype.initFunctionDropDown = function()
	{
		this.dropdownAvailableTypes = this.$form.find("input[name=dropdownFunctions]").kendoDropDownTree({
			dataSource: [],
			clearButton: false,
			treeview: {
				select: (e) =>
				{
					const dataItem = e.sender.dataItem(e.node);
					if (dataItem && !dataItem.value)
					{
						const item = e.sender.findByText(dataItem.Name);
						dataItem.expanded ? e.sender.collapse(item) : e.sender.expand(item);
						e.preventDefault();
					}
				},
			},
			change: e =>
			{
				var value = e.sender.value();
				this.selectOperatorClick(value) || this.selectLogicalOperatorClick(value) || this.selectedFunctionChanged(value);
			},
			open: (e) =>
			{
				e.sender.list.addClass("rollup-datatype-dropdowntree");
				var liItems = Array.from(e.sender.list.find(".k-treeview-lines>li"));
				liItems.forEach((li, index) =>
				{
					const className = "form-item";
					$(li).addClass(className);
				});
			}
		}).data('kendoDropDownTree');
	};

	CaseItemViewModel.prototype._preHandleColumnsComputer = function()
	{
		let tmpColumns = TF.Grid.FilterHelper.mergeOnlyForFilterColumns(this.options.gridType, this.options.columns.slice());

		tmpColumns.sort(function(firstCol, secondCol)
		{
			return firstCol.DisplayName.localeCompare(secondCol.DisplayName);
		});

		tmpColumns.unshift({ DisplayName: " " });

		return tmpColumns;
	};

	CaseItemViewModel.prototype.selectOperatorClick = function(value)
	{
		if (this.operatorSource.indexOf(value) >= 0)
		{
			this.insertFragmentToCurrentCursorPosition(value);
			return true;
		}
		return false;
	};

	CaseItemViewModel.prototype.selectLogicalOperatorClick = function(value)
	{
		if (this.logicalOperatorSource.indexOf(value) >= 0)
		{
			this.insertFragmentToCurrentCursorPosition(value);
			return true;
		}
		return false;
	};

	CaseItemViewModel.prototype.selectedFunctionChanged = function(value)
	{
		const self = this;
		var selectedFunction = this.functionList.filter(x => x.Name == value)[0];
		if (!selectedFunction || !selectedFunction.Name)
		{
			return false;
		}
		self.insertFragmentToCurrentCursorPosition(`${selectedFunction.Name}(${Array(selectedFunction.ParameterCount).fill("").join(" , ")})`);
		return true;
	};

	CaseItemViewModel.prototype.selectedFieldChanged = function()
	{
		const self = this;
		var columnDefinition = self.obSelectedField();
		if (!columnDefinition || !columnDefinition.FieldName)
		{
			return;
		}
		self.insertFragmentToCurrentCursorPosition(`[${columnDefinition.FieldName}]`);
	};

	CaseItemViewModel.prototype.focus = function(viewModel, event)
	{
		viewModel.activeElement($(event.currentTarget).attr("name"));
	};

	CaseItemViewModel.prototype.insertFragmentToCurrentCursorPosition = function(fragment)
	{
		const self = this;
		var name = self.activeElement();
		var dom = name === "caseStatement" ? self.caseAreaElement() : self.valueAreaElement();
		var cursorPosition = $(dom).prop("selectionStart");
		var content = name === "caseStatement" ? self.obCase() : self.obValue();
		var firstPart = content.substring(0, cursorPosition);
		var secondPart = content.substring(cursorPosition, content.length);
		var pad = 0;
		if (firstPart[firstPart.length - 1] != " " && firstPart.length != 0)
		{
			firstPart = firstPart + " ";
			pad++;
		}
		if (secondPart[0] != " " && secondPart.length != 0)
		{
			secondPart = " " + secondPart;
			pad++;
		}
		content = firstPart + fragment + secondPart;
		if (name === "caseStatement")
		{
			self.obCase(content);
		}
		else
		{
			self.obValue(content);
		}
		$(dom).focus();
		$(dom).prop("selectionStart", cursorPosition + fragment.length + pad);
		$(dom).prop("selectionEnd", cursorPosition + fragment.length + pad);
	};

	CaseItemViewModel.prototype.verifyClick = function(viewModel, e)
	{
		viewModel.pageLevelViewModel.saveValidate().then(result =>
		{
			if (result)
			{
				viewModel.pageLevelViewModel.obSuccessMessageDivIsShow(true);
				viewModel.pageLevelViewModel.obSuccessMessage("Syntax validation passed.");
			}
		});
	};

	CaseItemViewModel.prototype.verify = function(options)
	{
		const self = this,
			parameters = {
				DatabaseId: tf.datasourceManager.databaseId,
				UdfId: self.options.udfId,
				DataTypeId: tf.dataTypeHelper.getId(self.gridType)
			};

		function keyGen(obj)
		{
			return `${obj.DatabaseId}_***_${obj.UdfId}_&&&_${obj.DataTypeId}___^^^___${obj.ValueExpression}___$$$___${obj.CaseExpression}`;
		}

		if (options.caseOnly)
		{
			let data = {
				...parameters,
				ValueExpression: "",
				CaseExpression: self.obCase(),
			},
				key = keyGen(data);

			if (self.validationCache[key])
			{
				return Promise.resolve(self.validationCache[key]);
			}

			return tf.promiseAjax.post(pathCombine(tf.api.apiPrefixWithoutDatabase(), "caseudfs/verify"), {
				data
			}).then((response) =>
			{
				const result = response.Items.filter(x => x.Type === "case");
				self.validationCache[key] = result;
				return result;
			});
		}

		if (options.valueOnly)
		{
			let data = {
				...parameters,
				ValueExpression: self.obValue(),
				CaseExpression: "",
			},
				key = keyGen(data);

			if (self.validationCache[key])
			{
				return Promise.resolve(self.validationCache[key]);
			}

			return tf.promiseAjax.post(pathCombine(tf.api.apiPrefixWithoutDatabase(), "caseudfs/verify"), {
				data
			}).then(function(response)
			{
				const result = response.Items.filter(x => x.Type === "value");
				self.validationCache[key] = result;
				return result;
			});
		}
	};

	CaseItemViewModel.prototype.save = function()
	{
		const self = this;

		tf.loadingIndicator.show();

		return self.pageLevelViewModel.saveValidate().then(function(valid)
		{
			tf.loadingIndicator.tryHide();
			if (valid)
			{
				return {
					Case: self.obCase(),
					Value: self.obValue(),
				}
			}

			return false;
		});
	};

	CaseItemViewModel.prototype.initValidation = function()
	{
		var self = this;

		setTimeout(function()
		{
			var fields = {
				caseStatement:
				{
					trigger: "",
					validators:
					{
						callback:
						{
							message: "Invalid Syntax",
							callback: function(value)
							{
								if (!$.trim(value))
								{
									return {
										valid: false,
										message: ' required'
									};
								}

								return self.verify({ caseOnly: true }).then(function([result])
								{
									if (result.Valid)
									{
										return true;
									}
									return {
										valid: false,
										message: result.Message
									}
								}).catch(function()
								{
									setTimeout(function()
									{
										self.$form.find('textarea[name=caseStatement]').closest('.form-group').find(".help-block").text("Invalid Syntax");
										self.pageLevelViewModel.obSuccessMessageDivIsShow(false);
									});
									return false;
								});
							}
						}
					}
				},
				valueStatement:
				{
					trigger: "",
					validators:
					{
						callback:
						{
							message: "Invalid Syntax",
							callback: function(value)
							{
								if (!$.trim(value))
								{
									if (self.obIsDefaultCase())
									{
										return true;
									}
									return {
										valid: false,
										message: ' required'
									};
								}

								return self.verify({ valueOnly: true }).then(function([result])
								{
									if (result.Valid)
									{
										return true;
									}
									return {
										valid: false,
										message: result.Message
									}
								}).catch(function()
								{
									setTimeout(function()
									{
										self.$form.find('textarea[name=valueStatement]').closest('.form-group').find(".help-block").text("Invalid Syntax");
										self.pageLevelViewModel.obSuccessMessageDivIsShow(false);
									});
									return false;
								});
							}
						}
					}
				}
			};

			self.$form.bootstrapValidator({
				excluded: [':hidden', ':not(:visible)'],
				live: 'disabled',
				message: 'This value is not valid',
				fields: fields
			});
			self.pageLevelViewModel.load(self.$form.data("bootstrapValidator"));
		}, 0);
	};

	CaseItemViewModel.prototype.cancel = function()
	{
		return new Promise((resolve) =>
		{
			if (this.entity.Case !== this.obCase() || this.entity.Value !== this.obValue())
			{
				resolve(tf.promiseBootbox.yesNo("You have unsaved changes. Would you like to save your changes prior to canceling?", "Unsaved Changes"));
			}
			else
			{
				resolve(false);
			}
		});
	};

	CaseItemViewModel.prototype.dispose = function()
	{
		this.dropdownAvailableTypes && this.dropdownAvailableTypes.close();
		this.pageLevelViewModel.dispose();
	};
})();