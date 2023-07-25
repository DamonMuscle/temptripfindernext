(function()
{
	createNamespace("TF.UserDefinedField").CaseUserDefinedFieldViewModel = CaseUserDefinedFieldViewModel;

	var _obGridSelectedUids = ko.observableArray(),
		_selectedColGrid = null,
		_tmpListTypeGridFields = [],
		_KendoUid = "kendoUid";

	function CaseUserDefinedFieldViewModel(viewModel)
	{
		const self = this;
		this.obIsEnable = ko.observable(true);
		self.parent = viewModel;
		self.obComponentLoaded = ko.observable(false);
		self.initFormFieldPromise = null;
	}

	CaseUserDefinedFieldViewModel.prototype.initGrid = function()
	{
		var self = this;

		self.caseList = self.caseList || [];

		self.kendoGrid = self.$gridContainer
			.kendoGrid({
				dataSource: {
					data: self.caseList.slice(),
					sort: { field: "Name", dir: "asc" }
				},
				scrollable: true,
				sortable: false,
				columns: self.gridColumns()
			}).data("kendoGrid");
		_selectedColGrid = self.kendoGrid;

		setTimeout(() =>
		{
			self.bindGridDragEvent();
		}, 0);
	};

	CaseUserDefinedFieldViewModel.prototype.gridColumns = function()
	{
		return [
			{
				field: "Id",
				title: "UDFPickListItemId",
				width: "50px",
				hidden: true,
				onlyForFilter: true
			},
			{
				title: "",
				width: "45px",
				template: function()
				{
					return "<div class='item-drag-icon'></div>";
				}
			},
			{
				field: "Case",
				title: "Case",
			},
			{
				field: "Value",
				title: "Value",
			},
			{
				command: [
					{
						name: "copyandnew",
						template: '<a class="k-button k-button-icontext k-grid-copyandnew" title="Copy"><span></span>Copy</a>',
						click: this.onCopyBtnClick.bind(this)
					},
					{
						name: "edit",
						template: '<a class="k-button k-button-icontext k-grid-edit" title="Edit"><span class="k-icon k-edit"></span>Edit</a>',
						click: this.onEditBtnClick.bind(this)
					},
					{
						name: "delete",
						template: '<a class="k-button k-button-icontext k-grid-delete" title="Delete"><span></span>delete</a>',
						click: this.onDeleteBtnClick.bind(this)
					}],
				title: "Action",
				width: "100px",
				attributes: {
					"class": "text-center"
				}
			}
		];
	};

	CaseUserDefinedFieldViewModel.prototype.bindGridDragEvent = function()
	{
		this.bindGridDraggable();
		this.bindGridDropTarget();
		this.createKendoDropTargetEvent();
	};

	CaseUserDefinedFieldViewModel.prototype.bindGridDraggable = function()
	{
		var self = this;
		self.$gridContainer.kendoDraggable({
			filter: "tbody > tr",
			threshold: 100,
			holdToDrag: TF.isMobileDevice,
			autoScroll: true,
			hint: function(e)
			{
				return _getHintElements(e, self.$element.find(".kendo-grid"));
			},
			cursorOffset: { top: -10, left: -10 },
		});
	};

	CaseUserDefinedFieldViewModel.prototype.bindGridDropTarget = function()
	{
		var self = this;
		self.$gridContainer.parent().parent().kendoDropTarget({
			dragenter: function(e)
			{
				var helper = self.gridDropTargetHelper(e);
				if (helper.targetItem)
				{
					_removeDropTargetCursorTriangle();
					_appendDropTargetCursorTriangle(helper.targetItem, helper.insertBeforeTarget);
				}
			},
			dragleave: function(e)
			{
				var selectedColItems = self.$gridContainer.find('tr');
				selectedColItems.removeClass("drag-target-insert-before-cursor");
				selectedColItems.removeClass("drag-target-insert-after-cursor"); // modify dropTarget element

				_removeDropTargetCursorTriangle();

			},
			drop: function(e)
			{
				var helper = self.gridDropTargetHelper(e);
				if (helper.targetItem)
				{
					_selectedDrop.call(self, e, helper.targetItem, helper.insertBeforeTarget);
					var selectedColItems = self.$gridContainer.find('tr');
					selectedColItems.removeClass("drag-target-insert-before-cursor");
					selectedColItems.removeClass("drag-target-insert-after-cursor");
					_removeDropTargetCursorTriangle();
				}
			}
		});
	};

	CaseUserDefinedFieldViewModel.prototype.gridDropTargetHelper = function(evt)
	{
		var selectedColItems = this.$gridContainer.find('tr'),
			targetItem = null,
			insertBeforeTarget = false;

		if (selectedColItems.length <= 2)
		{
			return {
				targetItem: null,
				insertBeforeTarget: null
			};
		}

		if (evt.draggable.hint.offset().top - 35 <= this.$gridContainer.find(".k-grid-content").offset().top)
		{
			targetItem = $(selectedColItems[1]);
			targetItem.addClass("drag-target-insert-before-cursor"); // modify dropTarget element
			insertBeforeTarget = true;
		}
		else
		{
			targetItem = $(selectedColItems[selectedColItems.length - 1]);
			targetItem.addClass("drag-target-insert-after-cursor");
		}

		return { targetItem, insertBeforeTarget };
	};

	CaseUserDefinedFieldViewModel.prototype.createKendoDropTargetEvent = function()
	{
		var self = this;

		Array.from(self.$gridContainer.find("tbody tr")).forEach(el =>
		{
			const target = $(el).data("kendoDropTarget");
			if (target && target.destroy)
			{
				target.destroy();
			}
		});

		self.$gridContainer.find("tbody tr").kendoDropTarget({
			dragenter: function(e)
			{
				var selectedColItems = self.$gridContainer.find('tr');
				if (selectedColItems.length > 2)
				{
					var targetItem = $(e.dropTarget[0]);
					targetItem.addClass("drag-target-insert-after-cursor");

					_removeDropTargetCursorTriangle();
					_appendDropTargetCursorTriangle(targetItem);
				}
			},
			dragleave: function(e)
			{
				$(e.dropTarget[0]).removeClass("drag-target-insert-after-cursor");
				_removeDropTargetCursorTriangle();
			},
			drop: function(e)
			{
				var targetItem = $(e.dropTarget[0]);
				_selectedDrop.call(self, e, targetItem, false);
			}
		});
	};

	CaseUserDefinedFieldViewModel.prototype.onAddBtnClick = function()
	{
		var self = this;
		tf.modalManager.showModal(new TF.Modal.UserDefinedField.CaseItemModalViewModel({
			isDefault: false,
			isEdit: false,
			columns: self.getGridDefinition(),
			gridType: self.parent.gridType,
			caseItem: { Case: "", Value: "" },
			udfId: (self.parent.dataEntity || {}).Id || 0
		})).then(function(result)
		{
			if (!result)
			{
				return;
			}
			const list = Array.from(self.kendoGrid.dataSource.data());
			self.kendoGrid.dataSource.data(list.concat(result));
			self.createKendoDropTargetEvent();
		});
	};

	CaseUserDefinedFieldViewModel.prototype.onEditBtnClick = function(evt)
	{
		var self = this,
			index = $(evt.target).closest("tr").index(),
			data = self.kendoGrid.dataSource.getByUid($(evt.target).closest("tr").attr("data-kendo-uid"));

		tf.modalManager.showModal(new TF.Modal.UserDefinedField.CaseItemModalViewModel({
			isDefault: false,
			isEdit: true,
			columns: self.getGridDefinition(),
			gridType: self.parent.gridType,
			caseItem: { Case: data.Case, Value: data.Value },
			udfId: (self.parent.dataEntity || {}).Id || 0
		})).then(function(result)
		{
			if (!result)
			{
				return;
			}

			const list = Array.from(self.kendoGrid.dataSource.data());
			list.splice(index, 1, result);
			self.kendoGrid.dataSource.data(list);
		});
	};

	CaseUserDefinedFieldViewModel.prototype.onCopyBtnClick = function(evt)
	{
		var self = this,
			data = self.kendoGrid.dataSource.getByUid($(evt.target).closest("tr").attr("data-kendo-uid"));

		tf.modalManager.showModal(new TF.Modal.UserDefinedField.CaseItemModalViewModel({
			isDefault: false,
			isEdit: false,
			columns: this.getGridDefinition(),
			gridType: this.parent.gridType,
			caseItem: { Case: data.Case, Value: data.Value },
			udfId: (self.parent.dataEntity || {}).Id || 0
		})).then(function(result)
		{
			if (!result)
			{
				return;
			}
			const list = Array.from(self.kendoGrid.dataSource.data());
			self.kendoGrid.dataSource.data(list.concat(result));
			self.createKendoDropTargetEvent();
		});
	}

	CaseUserDefinedFieldViewModel.prototype.onDeleteBtnClick = function(evt)
	{
		var idx = $(evt.target).closest("tr").index(),
			confirmMessage = "Are you sure you want to delete this case?";

		return tf.promiseBootbox.yesNo({
			message: confirmMessage,
			title: "Confirmation Message",
			closeButton: true
		}).then(result =>
		{
			if (!result) { return; }
			const list = Array.from(this.kendoGrid.dataSource.data());
			list.splice(idx, 1);
			this.kendoGrid.dataSource.data(list);
		});
	};

	CaseUserDefinedFieldViewModel.prototype.getGridDefinition = function()
	{
		let self = this, columns;
		switch (this.parent.gridType)
		{
			case "altsite":
				columns = tf.altsiteGridDefinition.gridDefinition().Columns;
				break;
			case "contact":
				columns = tf.contactGridDefinition.gridDefinition().Columns;
				break;
			case "contractor":
				columns = tf.contractorGridDefinition.gridDefinition().Columns;
				break;
			case "district":
				columns = tf.districtGridDefinition.gridDefinition().Columns;
				break;
			case "document":
				columns = tf.documentGridDefinition.gridDefinition().Columns;
				break;
			case "fieldtrip":
				columns = tf.fieldTripGridDefinition.gridDefinition().Columns;
				break;
			case "georegion":
				columns = tf.georegionGridDefinition.gridDefinition().Columns;
				break;
			case "route":
				columns = tf.routeGridDefinition.gridDefinition().Columns;
				break;
			case "school":
				columns = tf.schoolGridDefinition.gridDefinition().Columns;
				break;
			case "staff":
				columns = tf.staffGridDefinition.gridDefinition().Columns;
				break;
			case "student":
				columns = tf.studentGridDefinition.gridDefinition().Columns;
				break;
			case "trip":
				columns = tf.tripGridDefinition.gridDefinition().Columns;
				break;
			case "tripstop":
				columns = tf.tripStopGridDefinition.gridDefinition().Columns;
				break;
			case "vehicle":
				columns = tf.vehicleGridDefinition.gridDefinition().Columns;
				break;
			case "report":
				columns = tf.reportGridDefinition.gridDefinition().Columns;
				break;
		}

		var result = columns.slice().map(c => ({
			...c,
			...TF.Grid.GridHelper.convertToOldGridDefinition(c),
			FieldName: c.UDFId ? c.DisplayName : (c.field || c.FieldName),
			DisplayName: c.title || c.DisplayName || c.FieldName,
		}));

		if (!self.parent.isEdit) 
		{
			return result;
		}

		var udfGuid = self.parent.dataEntity.Guid;
		return result.filter(x => x.UDFGuid !== udfGuid);
	};

	CaseUserDefinedFieldViewModel.prototype.getDefaultValue = function(entity)
	{
		var defaultCase = entity["DefaultCase"];
		if (defaultCase == null) { return ""; }
		return defaultCase;
	};

	CaseUserDefinedFieldViewModel.prototype.updateDefaultValue = function(entity, defaultValue)
	{
		entity.DefaultCase = defaultValue == null || defaultValue === "" ? "" : defaultValue;
		entity.CaseDetail = JSON.stringify(this.kendoGrid.dataSource.data().toJSON());
	};

	CaseUserDefinedFieldViewModel.prototype._moveItemUpDown = function(targetIdx)
	{
		var selectedRows = _obGridSelectedUids().map(uid => this.kendoGrid.dataSource.getByUid(uid));

		var gridData = this.kendoGrid.dataSource.data();
		var insertBefore = Enumerable.From(gridData.slice(0, targetIdx)).Except(selectedRows).ToArray();
		var insertAfter = Enumerable.From(gridData.slice(targetIdx)).Except(selectedRows).ToArray();
		if (insertBefore.length > 0 && insertBefore[insertBefore.length - 1].locked == false)
		{
			selectedRows.forEach(function(item)
			{
				item.locked = false;
			});
		}
		else if (insertAfter.length > 0 && insertAfter[0].locked == true)
		{
			selectedRows.forEach(function(item)
			{
				item.locked = true;
			});
		}
		_tmpListTypeGridFields = [insertBefore, selectedRows, insertAfter].reduce(function(a, b) { return a.concat(b); }, []);
		this.kendoGrid.dataSource.data(_tmpListTypeGridFields);
		this.pickListOptions = _tmpListTypeGridFields;
		this.createKendoDropTargetEvent();
	};

	CaseUserDefinedFieldViewModel.prototype.init = function(model, el)
	{
		const self = this;
		self.$element = $(el);
		self.$gridContainer = self.$element.find(".kendo-grid");
		self.initData();
		self.initGrid();
		self.listItemInputValidationFields = null;
	};

	CaseUserDefinedFieldViewModel.prototype.initData = function()
	{
		if (this.parent.dataEntity && this.parent.dataEntity.CaseDetail)
		{
			this.caseList = JSON.parse(this.parent.dataEntity.CaseDetail);
		}
	};

	CaseUserDefinedFieldViewModel.prototype.getDefaultValueTemplate = function()
	{
		return `<div class="input-group">
			<div class="form-control" style="height:80px;"">
				<div data-bind="text:obDefaultValue" style="word-break: break-word;"></div>
			</div>
			<div class="input-group-btn" style="vertical-align:top;">
				<button type="button" class="btn btn-default btn-sharp" data-bind="event:{click:showDefaultCase}">
					<span class="glyphicon glyphicon-option-horizontal"></span>
				</button>
			</div>
		</div>`;
	};

	CaseUserDefinedFieldViewModel.prototype.getTemplate = function()
	{
		return "modal/userdefinedfield/CaseUserDefinedField";
	};

	CaseUserDefinedFieldViewModel.prototype.showDefaultCase = function(caseItem)
	{
		const self = this;
		tf.modalManager.showModal(new TF.Modal.UserDefinedField.CaseItemModalViewModel({
			isDefault: true,
			columns: this.getGridDefinition(),
			gridType: this.parent.gridType,
			caseItem,
			udfId: (self.parent.dataEntity || {}).Id || 0
		})).then(function(result)
		{
			if (!result)
			{
				return;
			}
			self.parent.obDefaultValue(result.Value);
		});
	}

	var _getHintElements = function(item, container)
	{
		var hintElements = $('<div class="k-grid k-widget list-mover-drag-hint" style=""><table><tbody></tbody></table></div>'),
			maxWidth = container.width(), tooLong = false;
		hintElements.css({
			"background-color": "#FFFFCE",
			"opacity": 0.8,
			"cursor": "move"
		});

		tooLong = $(item).width() > maxWidth;
		hintElements.width(tooLong ? maxWidth : $(item).width());
		hintElements.find('tbody').append(`<tr><td role="gridcell" style="width:28px"><div class="item-drag-icon"></div></td>${$(item.html())[2].outerHTML}</tr>`);

		return hintElements;
	};

	var _removeDropTargetCursorTriangle = function()
	{
		$('#left-triangle').remove();
		$('#right-triangle').remove();
	};

	var _appendDropTargetCursorTriangle = function(targetItem, insertBeforeTarget)
	{
		var leftTriangle = $('<div id="left-triangle"></div>').addClass('drag-target-cursor-left-triangle');
		var rightTriangle = $('<div id="right-triangle"></div>').addClass('drag-target-cursor-right-triangle');

		leftTriangle.css("left", -1 + "px");
		rightTriangle.css("left", targetItem.width() - 14 + "px");

		if (insertBeforeTarget)
		{
			leftTriangle.css("top", "-6px");
			rightTriangle.css("top", "-6px");
		}

		targetItem.find('td:nth-child(2)').append(leftTriangle);
		targetItem.find('td:nth-child(2)').append(rightTriangle);
	};

	var _selectedDrop = function(e, target, isfirst)
	{
		e.draggable.hint.hide();
		var insertIdx = _getInsertIdx(target, isfirst);
		var selectedUids = [e.draggable.currentTarget.data().kendoUid];
		_obGridSelectedUids(selectedUids);
		this._moveItemUpDown(insertIdx);
	};

	var _getInsertIdx = function(dest, isfirst)
	{
		var insertIdx = 0;

		if (!isfirst)
		{
			var destData = _selectedColGrid.dataSource.getByUid(dest.data(_KendoUid));
			var gridData = _selectedColGrid.dataSource.data();

			insertIdx = gridData.length;
			if (destData && gridData)
			{
				gridData.forEach(function(col, idx)
				{
					if (col === destData)
					{
						insertIdx = Math.min(idx + 1, gridData.length);
					}
				});
			}
		}

		return insertIdx;
	};
})();