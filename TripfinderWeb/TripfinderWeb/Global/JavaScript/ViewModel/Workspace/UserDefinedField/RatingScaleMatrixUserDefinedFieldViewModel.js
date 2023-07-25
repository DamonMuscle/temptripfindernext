(function()
{
	createNamespace("TF.UserDefinedField").RatingScaleMatrixUserDefinedFieldViewModel = RatingScaleMatrixUserDefinedFieldViewModel;

	var _obGridSelectedUids = ko.observableArray(),
		_selectedColGrid = null,
		_tmpListTypeGridFields = [],
		_KendoUid = "kendoUid";

	function RatingScaleMatrixUserDefinedFieldViewModel(options)
	{
		this.obIsEnable = ko.observable(true);
		var self = this;
		self.isEdit = options.dataEntity != null;
		self.dataEntity = options.dataEntity;

		// Rate Setting
		self.SCALES = [3, 4, 5, 6, 7, 8, 9, 10];
		self.obScaleSource = ko.observableArray(self.SCALES);
		self.obSelectedScale = ko.observable(null);
		//self.obSelectedScale.subscribe(self.onScale)

		this.obLeftSideRatingLabel = ko.observable(null);
		this.obRightSideRatingLabel = ko.observable(null);
		this.obComponentLoaded = ko.observable(false);

		// List Setting
		self.pickListOptions = self.dataEntity ? self.dataEntity.UDFPickListOptions : [];
		self.kendoGrid = null;
		self.gridColumns = [
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
				template: function(item)
				{
					return "<div class='item-drag-icon'></div>";
				}
			},
			{
				field: "PickList",
				title: "Display Name",
			},
			{
				command: [
					{
						name: "edit",
						template: "<a class=\"k-button k-button-icontext k-grid-edit\" title=\"Edit\"><span class=\"k-icon k-edit\"></span>Edit</a>",
						click: self.onEditBtnClick.bind(self)
					},
					{
						name: "delete",
						template: "<a class=\"k-button k-button-icontext k-grid-delete\" title=\"Delete\"><span class=\" \"></span>delete</a>",
						click: self.onDeleteBtnClick.bind(self)
					}],
				title: "Action",
				width: "80px",
				attributes: {
					"class": "text-center"
				}
			}
		];

		self.listItemInputValidationFields = null;
		self.onCloseListMover = new TF.Events.Event();

		self.openListMover = self.openListMover.bind(self);

		self.obDefaultListString = ko.observable();
		self.obAvailableSelectOptions = ko.observableArray([]);
		self.obSelectedOption = ko.observable();
		self.obSelectedOptionLabel = ko.observable();
		self.obComponentLoaded = ko.observable(false);
		self.$gridContainer = null;
	}

	RatingScaleMatrixUserDefinedFieldViewModel.prototype.constructor = RatingScaleMatrixUserDefinedFieldViewModel;

	RatingScaleMatrixUserDefinedFieldViewModel.prototype.init = function(vm, el)
	{
		this.$parent = $(el).closest(".Edit-UDF-Modal");

		var self = this;
		self.$element = $(el);
		self.$gridContainer = self.$element.find(".kendo-grid");
		self.initGrid();

		self.listItemInputValidationFields = {
			Label: {
				trigger: "blur change",
				container: self.$element.find("input[name='Label']").closest("div"),
				validators:
				{
					notEmpty: {
						message: 'Name is required'
					},
					callback:
					{
						message: " must be unique",
						callback: function(value, validator, $field)
						{
							return value = "1";
						}
					}
				}
			}
		}

		// init default value
		self.renderDefaultValueComponent();
		self.updateListItems();
		this.obComponentLoaded(true);
	};

	RatingScaleMatrixUserDefinedFieldViewModel.prototype.getTemplate = function()
	{
		return "modal/userDefinedField/RatingScaleMatrixEditor";
	};

	RatingScaleMatrixUserDefinedFieldViewModel.prototype.getDefaultValueTemplate = function()
	{
		return null;
		//Commended for backup:"<div><!-- ko customInput:{type:'Integer',value:obDefaultValue,attributes:{class:'form-control',maxlength:'2', name:'defaultValue',tabindex:'4'}} --><!-- /ko --></div>";
	};

	RatingScaleMatrixUserDefinedFieldViewModel.prototype.updateDefaultValue = function(entity, defaultValue)
	{
		entity["DefaultRatingScale"] = defaultValue;
	};

	RatingScaleMatrixUserDefinedFieldViewModel.prototype.getDefaultValue = function(entity)
	{
		return entity["DefaultRatingScale"];
	};

	RatingScaleMatrixUserDefinedFieldViewModel.prototype.updateSpecialValue = function(entity)
	{
		if (!entity) return;
		this.obLeftSideRatingLabel(entity.LeftSideRatingLabel);
		this.obRightSideRatingLabel(entity.RightSideRatingLabel);
		this.obSelectedScale(entity.Scale);
	};

	RatingScaleMatrixUserDefinedFieldViewModel.prototype.extendValidatorFields = function(validatorFields, $container)
	{
		if (!validatorFields || !$container)
		{
			return;
		}

		validatorFields.scale = {
			trigger: "blur change",
			container: $container.find("input[name='scale']").closest("div").parents()[1],
			validators: {
				notEmpty: {
					message: 'Scale is required'
				}
			}
		};

		validatorFields.leftSideRatingLabel = {
			trigger: "blur change",
			container: $container.find("input[name='leftSideRatingLabel']").closest("div"),
			validators: {
				notEmpty: {
					message: 'Left Side Rating Label is required'
				}
			}
		};

		validatorFields.rightSideRatingLabel = {
			trigger: "blur change",
			container: $container.find("input[name='rightSideRatingLabel']").closest("div"),
			validators: {
				notEmpty: {
					message: 'Right Side Rating Label is required'
				}
			}
		};
	};

	RatingScaleMatrixUserDefinedFieldViewModel.prototype.onDefaultValueModalUpdateFinished = function()
	{
		var self = this;
		self.updateListItems();
		self.renderDefaultValueComponent();
	};


	/**
	 * Save special Value.
	 *
	 * @param {Object} entity
	 */
	RatingScaleMatrixUserDefinedFieldViewModel.prototype.saveSpecialValue = function(entity)
	{
		entity["LeftSideRatingLabel"] = this.obLeftSideRatingLabel();
		entity["RightSideRatingLabel"] = this.obRightSideRatingLabel();
		entity["Scale"] = this.obSelectedScale();

		var self = this;

		let selected = self.obSelectedOption();
		if (selected.ID == null)
		{
			// new UDF, check based on text.
			self.pickListOptions.map(option =>
			{
				option.IsDefaultItem = selected.PickList === option.PickList;
			});
		}
		else
		{
			self.pickListOptions.map(option =>
			{
				option.IsDefaultItem = selected.ID === option.ID;
			});
		}

		entity["UDFPickListOptions"] = self.pickListOptions;
		entity["PickList"] = true;
	};

	/**
	 * Initialize the grid.
	 *
	 */
	RatingScaleMatrixUserDefinedFieldViewModel.prototype.initGrid = function()
	{
		var self = this;
		if (!self.pickListOptions || !self.pickListOptions.length)
		{
			self.pickListOptions = [];
		}
		self.kendoGrid = self.$gridContainer
			.kendoGrid({
				dataSource: {
					data: self.pickListOptions.slice(),
					sort: { field: "Name", dir: "asc" }
				},
				scrollable: true,
				sortable: true,
				columns: self.gridColumns
			}).data("kendoGrid");
		_selectedColGrid = self.kendoGrid;

		setTimeout(() =>
		{
			self.bindGridDragEvent();
		}, 0);
	};

	RatingScaleMatrixUserDefinedFieldViewModel.prototype.bindGridDragEvent = function()
	{
		this.bindGridDraggable();
		this.bindGridDropTarget();
		this.createKendoDropTargetEvent();
	};

	RatingScaleMatrixUserDefinedFieldViewModel.prototype.bindGridDraggable = function()
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
			}.bind(self),
			dragstart: function(e)
			{
			}.bind(self),
			cursorOffset: { top: -10, left: -10 },
			dragend: function(e)
			{
			}.bind(self)
		});
	};

	RatingScaleMatrixUserDefinedFieldViewModel.prototype.bindGridDropTarget = function()
	{
		var self = this;
		self.$gridContainer.parent().parent().kendoDropTarget({
			dragenter: function(e)
			{
				var helper = this.gridDropTargetHelper(e);
				if (helper.targetItem)
				{
					_removeDropTargetCursorTriangle();
					_appendDropTargetCursorTriangle(helper.targetItem, helper.insertBeforeTarget);
				}
			}.bind(this),
			dragleave: function(e)
			{
				var selectedColItems = this.$gridContainer.find('tr');
				selectedColItems.removeClass("drag-target-insert-before-cursor");
				selectedColItems.removeClass("drag-target-insert-after-cursor"); // modify dropTarget element

				_removeDropTargetCursorTriangle();

			}.bind(this),
			drop: function(e)
			{
				var helper = this.gridDropTargetHelper(e);
				if (helper.targetItem)
				{
					_selectedDrop.bind(this)(e, helper.targetItem, helper.insertBeforeTarget)
					var selectedColItems = this.$gridContainer.find('tr');
					selectedColItems.removeClass("drag-target-insert-before-cursor");
					selectedColItems.removeClass("drag-target-insert-after-cursor");
					_removeDropTargetCursorTriangle();
				}
			}.bind(this)
		});
	};

	RatingScaleMatrixUserDefinedFieldViewModel.prototype.gridDropTargetHelper = function(evt)
	{
		var selectedColItems = this.$gridContainer.find('tr'),
			targetItem = null,
			insertBeforeTarget = false

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

		return {
			targetItem: targetItem,
			insertBeforeTarget: insertBeforeTarget
		};
	};

	RatingScaleMatrixUserDefinedFieldViewModel.prototype._moveItemUpDown = function(targetIdx)
	{
		var selectedRows = _getDataRowsBySelectedUids(_obGridSelectedUids(), this.kendoGrid.dataSource);

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
		_tmpListTypeGridFields = [insertBefore, selectedRows, insertAfter].reduce(function(a, b) { return a.concat(b); }, [])
		this.kendoGrid.dataSource.data(_tmpListTypeGridFields);
		this.pickListOptions = _tmpListTypeGridFields;
		this.createKendoDropTargetEvent();
	};

	RatingScaleMatrixUserDefinedFieldViewModel.prototype.createKendoDropTargetEvent = function()
	{
		var self = this;
		self.$gridContainer.find("tbody tr").kendoDropTarget({
			dragenter: function(e)
			{
				var selectedColItems = self.$gridContainer.find('tr');
				if (selectedColItems.length > 2)
				{
					targetItem = $(e.dropTarget[0]);
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
				targetItem = $(e.dropTarget[0]);
				_selectedDrop.bind(this)(e, targetItem, false);
			}.bind(this)
		});
	};

	/**
	 * Click handler for add button.
	 *
	 * @param {Event} evt
	 */
	RatingScaleMatrixUserDefinedFieldViewModel.prototype.onAddBtnClick = function(evt)
	{
		var self = this;
		tf.modalManager.showModal(new TF.Modal.MultipleInputModalViewModel(
			{
				title: "Add List Item",
				field: "Label",
				validatorFields: self.listItemInputValidationFields,
				existingItems: self.getExistingItems(),
				ignoreCaseWhenDetermineUnique: true,
				autoHeight: true,
				maxTextLines: 20,
				maxLength: 50
			}))
			.then(function(text)
			{
				if (!!text)
				{
					var newItems = text.split("\n").map(t =>
					{
						return { PickList: t, IsDefaultItem: false };
					});
					self.pickListOptions.push(...newItems);
					self.updateListItems(self.pickListOptions);
					self.bindGridDragEvent();
				}
			});
	};

	RatingScaleMatrixUserDefinedFieldViewModel.prototype.getExistingItems = function()
	{
		var self = this;
		return self.kendoGrid.dataItems().map(function(i)
		{
			return i.PickList;
		});
	};

	/**
	 * Click handler for edit button
	 *
	 * @param {Event} evt
	 */
	RatingScaleMatrixUserDefinedFieldViewModel.prototype.onEditBtnClick = function(evt)
	{
		var self = this,
			data = self.kendoGrid.dataSource.getByUid($(evt.target).closest("tr").attr("data-kendo-uid"));

		tf.modalManager.showModal(new TF.Modal["SingleInputWithCounterModalViewModel"](
			{
				title: "Edit List Item",
				field: "Label",
				text: data.PickList,
				validatorFields: self.listItemInputValidationFields,
				existingItems: self.getExistingItems(),
				ignoreCaseWhenDetermineUnique: true,
				autoHeight: true,
				maxLength: 50
			}))
			.then(function(text)
			{
				if (!!text)
				{
					var idx = $(evt.target).closest("tr").index(),
						newItem = self.pickListOptions[idx];

					newItem.PickList = text;
					self.pickListOptions.splice(idx, 1, newItem);
					self.updateListItems(self.pickListOptions);
				}
			});
	};

	/**
	 * Click handler for delete button.
	 *
	 * @param {Event} evt
	 */
	RatingScaleMatrixUserDefinedFieldViewModel.prototype.onDeleteBtnClick = function(evt)
	{
		var self = this,
			idx = $(evt.target).closest("tr").index();

		self.pickListOptions.splice(idx, 1);
		self.updateListItems(self.pickListOptions);
	};

	/**
	 * Open list mover.
	 *
	 */
	RatingScaleMatrixUserDefinedFieldViewModel.prototype.openListMover = function()
	{
		var self = this,
			availableList = [],
			selectedList = [];

		self.pickListOptions
			.forEach(function(item, index)
			{
				(item.IsDefaultItem ? selectedList : availableList).push({
					text: item.PickList,
					value: index,
				});
			});

		tf.modalManager.showModal(new TF.DetailView.ListMoverFieldEditorModalViewModel({
			title: "Item",
			availableSource: availableList,
			selectedSource: selectedList,
			onCloseListMover: self.onCloseListMover,
			allowNullValue: true
		}))
			.then(function(result)
			{
				if (Array.isArray(result))
				{
					self.pickListOptions.forEach(function(item, index)
					{
						item.IsDefaultItem = (result.indexOf(index) > -1);
					});
					self.updateListItems(self.pickListOptions);
				}
			});
	};

	/**
	 * Update default value display.
	 *
	 */
	RatingScaleMatrixUserDefinedFieldViewModel.prototype.updateListItems = function(options)
	{
		var self = this,
			options = (options || self.pickListOptions).slice(),
			defaultOptions = options.filter(function(item) { return item.IsDefaultItem; }),
			text = defaultOptions.map(function(item) { return item.PickList; }).join(", ");

		var selectOptions = options.slice(),
			noneOption = { ID: -1, PickList: '(None)' },
			selected = defaultOptions[0] || noneOption;

		selectOptions.unshift(noneOption);
		self.obAvailableSelectOptions(selectOptions);
		self.obSelectedOption(selected);
		self.obSelectedOptionLabel(selected.PickList);

		if (!self.kendoGrid || !self.kendoGrid.dataSource)
		{
			console.log(1);
		}

		self.kendoGrid.dataSource.data(options);
		self.obDefaultListString(text);
	};

	/**	
	 * Render dropdown/listmover for default value.
	 *
	 * @param {boolean} allowMultiple
	 */
	RatingScaleMatrixUserDefinedFieldViewModel.prototype.renderDefaultValueComponent = function(allowMultiple)
	{
		var self = this, $input,
			$defaultValue = $('.Edit-UDF-Modal').find('.default-value');

		if (!allowMultiple)
		{
			$input = $defaultValue.find('.input-group.dropdown');
			if ($input.length === 0)
			{
				$input = $('<div class="input-group dropdown">\
					 <div data-bind="typeahead:{source:obAvailableSelectOptions,format:function(obj){return obj.PickList;},drowDownShow:true,notSort:true,selectedValue:obSelectedOption,isSelec:true}">\
						 <!-- ko customInput:{type:"Select",value:obSelectedOptionLabel,attributes:{class:"form-control",name:"status"}} -->\
						 <!-- /ko -->\
					 </div>\
					 <div class="input-group-btn">\
						 <button type="button" class="btn btn-default btn-sharp">\
							 <span class="caret"></span>\
						 </button>\
					 </div>\
				 </div>');

				$defaultValue.empty().append($input);
				ko.applyBindings(self, $input[0]);
			}

			$defaultValue.removeClass('allow-multiple');
		}
		else
		{
			$input = $defaultValue.find('.input-group.listmover');
			if ($input.length === 0)
			{
				$input = $('<div class="input-group listmover">\
						 <!-- ko customInput:{type:"String",value:obDefaultListString,attributes:{class:"form-control",maxlength:"50", readonly:"true",tabindex:"4"}} --><!-- /ko -->\
						 <button class="list-default-value-button" data-bind="click:openListMover"></span></button>\
					 </div>').appendTo($defaultValue);

				$defaultValue.empty().append($input);
				ko.applyBindings(self, $input[0]);
			}

			$defaultValue.addClass('allow-multiple');
		}
	};

	/**
	 * The dispose function.
	 *
	 */
	RatingScaleMatrixUserDefinedFieldViewModel.prototype.dispose = function()
	{
		var self = this;
		self.onCloseListMover.unsubscribeAll();
	};

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

		if (isfirst)
		{
			insertIdx = 0;
		}
		else
		{
			destData = _selectedColGrid.dataSource.getByUid(dest.data(_KendoUid));
			var gridData = _selectedColGrid.dataSource.data();

			insertIdx = gridData.length;
			if (destData && gridData)
			{

				gridData.forEach(function(col, idx)
				{
					if (col === destData)
					{
						insertIdx = Math.min(idx + 1, gridData.length);
						return;
					}
				});
			}
		}

		return insertIdx;
	};

	var _getDataRowsBySelectedUids = function(selectedUids, dataSource)
	{
		var dataRows = $.map(selectedUids, function(uid)
		{
			return dataSource.getByUid(uid);
		}.bind(this));
		return dataRows;
	};
})();