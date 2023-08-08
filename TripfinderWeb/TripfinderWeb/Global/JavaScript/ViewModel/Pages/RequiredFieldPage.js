(function()
{
	createNamespace("TF.Page").RequiredFieldPage = RequiredFieldPage;

	function RequiredFieldPage()
	{
		var self = this,
			availableTypes = tf.dataTypeHelper.getAvailableDataTypes().filter(x => !["Trip Schedule", "Student Schedule", "Trip Stop Schedule", "GPS Event", "Field Trip Invoice", "Field Trip Location"].includes(x.name)),
			gridColumns = [
				{
					field: "RowID",
					title: "RowID",
					width: "50px",
					hidden: true,
					onlyForFilter: true
				},
				{
					field: "DataTypeID",
					hidden: true,
					width: "50px",
					title: "Data Type ID"
				},
				{
					field: "FieldName",
					hidden: true,
					title: "Field Name",
					template: "<span class='star'>*</span>#: FieldName #",
					width: "300px"
				},
				{
					field: "Label",
					title: "Name",
					template: "<span class='star'>*</span>#: Label #",
					width: "600px"
				},
				{
					field: "Required",
					title: "Is Required",
					hidden: true,
					width: "200px"
				},
				{
					field: "SystemRequired",
					title: "Is System Required",
					hidden: true,
					width: "200px"
				},
				{
					command: [
						{
							name: "delete",
							template: "<a class=\"k-button k-button-icontext k-grid-delete\" title=\"Remove\" ><span class=\" \"></span>delete</a>",
							click: self.onDeleteBtnClick.bind(self)
						}],
					title: "Action",
					width: "40px",
					attributes: {
						"class": "text-center"
					}
				}
			];

		self.type = "requiredfield";
		self.pageType = "requiredfields";

		TF.Page.BaseGridPage.apply(self, arguments);

		self.skipSavePage = true;

		//  Properties
		self.$element = null;
		self.$gridWrapper = null;
		self.kendoGrid = null;

		self.endpoint = tf.dataTypeHelper.getEndpoint(self.type);
		self.gridColumns = gridColumns.filter(item => !item.hidden);

		self.obAvailableTypes = ko.observableArray(availableTypes);
		self.obSelected = ko.observable(availableTypes[0]);

		self.selectedItemChanged = new TF.Events.Event();
		self.dataHelper = tf.requiredFieldDataHelper;
	}

	RequiredFieldPage.prototype = Object.create(TF.Page.BaseGridPage.prototype);

	RequiredFieldPage.prototype.constructor = RequiredFieldPage;

	RequiredFieldPage.prototype.getHash = function()
	{
		return "RequiredFields";
	};

	/**
	 * Initialization.
	 *
	 * @param {DOM} el
	 * @param {object} data
	 */
	RequiredFieldPage.prototype.init = function(viewModel, el)
	{
		var self = this;
		self.$element = $(el);
		self.$gridWrapper = self.$element.find(".grid-wrapper");

		self.initGrid(self.$gridWrapper, self.obSelected().key);

		self.$gridWrapper.find(".selected-label,.bottom-caret").on("click", function(e)
		{
			var contextmenu = new TF.ContextMenu.TemplateContextMenu(
				"workspace/switchgridmenu",
				new TF.SwitchGridMenuViewModel({
					availableTypes: self.obAvailableTypes(),
					selectedItem: self.obSelected(),
					selectedItemChanged: self.selectedItemChanged
				})
			);
			tf.contextMenuManager.showMenu(self.$gridWrapper.find(".bottom-caret"), contextmenu);
		});

		self.selectedItemChanged.subscribe(function(e, value)
		{
			self.obSelected(value);
			self.initGrid(self.$gridWrapper, value.key);
		});
	};

	/**
	 * Initialize a user defined field grid.
	 *
	 * @param {JQuery} $grid
	 * @param {string} type
	 */
	RequiredFieldPage.prototype.initGrid = function($container, type)
	{
		var self = this;
		self.fetchGridData(type).then(function(data)
		{
			var $grid = $container.find(".kendo-grid");

			self.data = data;
			if (self.kendoGrid)
			{
				self.kendoGrid.destroy();
			}

			var gridData = data.filter(function(item)
			{
				return item.Required === true;
			}),
				count = gridData.length;

			self.kendoGrid = $grid.kendoGrid({
				dataSource: {
					data: gridData,
					sort: {
						field: "FieldName",
						dir: "asc",
						compare: function(a, b)
						{
							var val = Number(b.SystemRequired) - Number(a.SystemRequired);
							if (val === 0)
							{
								val = Number(!!a.UdfField) - Number(!!b.UdfField);
							}
							return val;
						}
					}
				},
				scrollable: true,
				sortable: true,
				selectable: "single",
				columns: self.gridColumns,
				dataBound: function()
				{
					var grid = this,
						el = grid.element,
						$footer = el.find(".k-grid-footer"),
						footerLabel = self._getGridFooterLabel(count);

					if ($footer.length === 0)
					{
						$footer = $("<div/>", { class: "k-grid-footer" }).appendTo(el);
						$footer.append("<div class='footer-marker'>The Field Name with <span class='sys-star'>*</span> is System Required Field which cannot be removed.</div>");
						$footer.append("<div class='footer-label'></div>");
					}
					$footer.find('.footer-label').text(footerLabel);
					$footer.removeAttr('tabindex');

					el.find("tbody tr[role='row']").each(function()
					{
						if (grid.element == null)
						{
							return;
						}
						var model = grid.dataItem(this);

						if (model.SystemRequired)
						{
							$(this).addClass("system-required-field");
						} else if (model.UdfField)
						{
							$(this).addClass("udf-required-field");
							$(this).find('.star').html("(User Defined) ");
						} else
						{
							$(this).addClass("general-required-field");
						}
					});
				}
			}).data("kendoGrid");

			self.kendoGrid.element.off("dblclick").on("dblclick", ".k-grid-content table tr", function(e)
			{
				self.onEditBtnClick(e);
			});
		});
	};

	/**
	 * fetch grid related data.
	 *
	 * @param {string} type
	 * @returns
	 */
	RequiredFieldPage.prototype.fetchGridData = function(type)
	{
		var self = this,
			type = self.obSelected().key;

		return self.dataHelper.getAllRequiredRecordsByType(type);
	};

	/**
	 * Edit required field button clicked.
	 *
	 */
	RequiredFieldPage.prototype.onEditBtnClick = function(evt)
	{
		var self = this,
			type = self.obSelected().key;

		tf.modalManager.showModal(
			new TF.Modal.RequiredField.EditRequiredFieldModalViewModel({
				gridType: type,
				data: self.data
			}))
			.then(function(response)
			{
				if (response)
				{
					self.refreshGridByType();
				}
			});
	};

	/**
	 * Delete required field button clicked.
	 *
	 */
	RequiredFieldPage.prototype.onDeleteBtnClick = function(evt)
	{
		var self = this, $tr = $(evt.currentTarget).closest("tr"),
			dataItem = self.kendoGrid.dataItem($tr[0]),
			record = {
				RowID: dataItem.RowID,
				Required: false,
				UdfField: !!dataItem.UdfField
			},
			confirmMessage = "Are you sure you want to delete this Required Field?";

		return tf.promiseBootbox.yesNo({
			message: confirmMessage,
			title: "Confirmation Message",
			closeButton: true
		}).then(function(result)
		{
			if (!result) { return; }

			self.dataHelper.updateRecords(record)
				.then(function(resp)
				{
					if (resp != null)
					{
						if (resp.indexOf("general") > -1)
						{
							PubSub.publish(pb.REQUIRED_FIELDS_CHANGED, self.obSelected().key);
						}

						if (resp.indexOf("udf") > -1)
						{
							PubSub.publish(pb.REQUIRED_UDF_FIELDS_CHANGED, self.obSelected().key);
						}

						var field = self.data.find(function(f)
						{
							return f.RowID === dataItem.RowID && f.UdfField == dataItem.UdfField;
						})
						if (field != null)
						{
							field.Required = false;
						}
						self.refreshGridByType();
					}
				});
		});
	}

	/**
	 * Refresh the data grid.
	 */
	RequiredFieldPage.prototype.refreshGridByType = function()
	{
		var data = this.data.filter(function(item)
		{
			return item.Required === true;
		})
		var count = data.length,
			$footer = this.kendoGrid.element.find(".k-grid-footer .footer-label"),
			footerLabel = this._getGridFooterLabel(count);

		this.kendoGrid.dataSource.data(data);
		$footer.text(footerLabel);
	};

	RequiredFieldPage.prototype._getGridFooterLabel = function(count)
	{
		return count + " Required Field" + ((count === 0 || count > 1) ? "s" : "");
	};

	RequiredFieldPage.prototype.dispose = function()
	{
		this.selectedItemChanged.unsubscribeAll();
		TF.Page.BaseGridPage.prototype.dispose.apply(this);
	};
})();