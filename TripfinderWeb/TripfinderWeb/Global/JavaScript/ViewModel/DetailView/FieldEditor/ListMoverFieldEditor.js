(function()
{
	createNamespace("TF.DetailView.FieldEditor").ListMoverFieldEditor = ListMoverFieldEditor;

	function ListMoverFieldEditor(type)
	{
		const self = this;
		TF.DetailView.FieldEditor.NonInputFieldEditor.call(self, type);

		self.selectedItems = null;

		self.onCloseListMover = new TF.Events.Event();
	};

	ListMoverFieldEditor.prototype = Object.create(TF.DetailView.FieldEditor.NonInputFieldEditor.prototype);

	ListMoverFieldEditor.prototype.constructor = ListMoverFieldEditor;

	ListMoverFieldEditor.prototype._initElement = function(options)
	{
		this._$element = $("<div class='list-mover-editor' tabindex=0></div>");
		this._$element.css({
			"position": "absolute",
			"height": "1px",
			"width": "1px",
			"outline": "none"
		});
		this._$parent.append(this._$element);
		this._$element.focus();

		TF.DetailView.FieldEditor.NonInputFieldEditor.prototype._initElement.call(this, options);
	};

	ListMoverFieldEditor.prototype.getCurrentSelectedValues = function()
	{
		return this.selectedItems ? this.selectedItems.map(o => o.value) : (this.options.defaultValue || []);
	};

	ListMoverFieldEditor.prototype.showModal = function()
	{
		const self = this;
		const { getFixedData, recordEntity } = self.options;
		let options = $.extend({}, self.options, {
			"onCloseListMover": self.onCloseListMover,
			"fixedRightIds": typeof getFixedData === "function" ? getFixedData(recordEntity) : []
		});

		self.isSimpleListMover = !self.options.searchControlParamData;

		let openListMover = !self.isSimpleListMover ?
			self.openListMoverWithSearchControl(options) :
			self.openSimpleListMover(options);

		return Promise.resolve(openListMover)
			.then(result =>
			{
				if (Array.isArray(result))
				{
					self.setValue(result.join(','));
					self.apply(result, self._getRecordValue());
				}
				self._$element.focus();
			})
	};

	/**
	 *
	 *
	 * @returns
	*/
	ListMoverFieldEditor.prototype.openListMoverWithSearchControl = function(options)
	{
		const { title, fixedRightIds, searchControlParamData } = options;
		const { type, getDisplayValue, sortFields, valueFields } = searchControlParamData;
		const selectedEntities = this.getCurrentSelectedValues().map(id => ({ Id: id }));
		const defaultOption = {
			title: `Select ${title}`,
			type: type,
			description: '',
			availableTitle: "Available",
			selectedTitle: "Selected",
			fixedRightIds: fixedRightIds,
			disableDropIndicator: true,
			showRemoveColumnButton: false,
			displayAddButton: false,
			displayCheckbox: false,
			gridOptions: {
				forceFitColumns: true,
				enableColumnReorder: true
			}
		};

		return tf.modalManager.showModal(new TF.DetailView.ListMoverWithSearchControlFieldEditorModalViewModel(selectedEntities, defaultOption))
			.then(selectedIds =>
			{
				if (Array.isArray(selectedIds))
				{
					const datasourceId = tf.datasourceManager.databaseId;

					return tf.dataTypeHelper.getRecordByIdsAndColumns(datasourceId, type, selectedIds, valueFields, sortFields)
						.then(records =>
						{
							this.selectedItems = records.map(o => ({ text: getDisplayValue(o), value: o["Id"] }));
							return selectedIds;
						});
				}
			});
	};

	/**
	 *
	 *
	 * @returns
	 */
	ListMoverFieldEditor.prototype.openSimpleListMover = function(options)
	{
		var self = this,
			isdefault = false,
			selectedValues = self.getCurrentSelectedValues();

		if (!Array.isArray(selectedValues))
		{
			isdefault = true;
			selectedValues = selectedValues.split(',').map(o => o.trim());
		}

		return options.getSource()
			.then((allItems) =>
			{
				allItems = allItems.map((item) =>
				{
					if (!(item instanceof Object))
					{
						return {
							text: item,
							value: item
						};
					}

					return item;
				});

				allItems = self.sortByAlphaOrder(allItems, 'text');

				options.selectedSource = [];
				options.availableSource = [];

				for (let i = 0; i < allItems.length; i++)
				{
					let item = allItems[i];

					(selectedValues.includes(isdefault ? item.text : item.value) ? options.selectedSource : options.availableSource).push(item)

				}

				self.selectedItems = options.selectedSource;

				return tf.modalManager.showModal(new TF.DetailView.ListMoverFieldEditorModalViewModel(options))
					.then(selectedIds =>
					{
						if (Array.isArray(selectedIds))
						{
							this.selectedItems = allItems.filter(o => selectedIds.includes(o.value));
						}
						return selectedIds;
					});
			});
	};

	ListMoverFieldEditor.prototype.editStart = function($parent, options)
	{
		TF.DetailView.FieldEditor.NonInputFieldEditor.prototype.editStart.call(this, $parent, options);

		this.options = options;
		if (options.showWidget)
		{
			this.showModal();
		}
	}

	ListMoverFieldEditor.prototype.bindEvents = function()
	{
		var self = this;
		$(document).on("click" + self._eventNamespace, (e) =>
		{
			const $target = $(e.target);
			// clicking on the modal and loadingIndicator should not be considered as exiting.
			if ($target.closest(".tfmodal").length === 0 && $target.closest("#loadingindicator").length === 0
				&& ((!self.isSimpleListMover && $target.closest("[data-kendo-role='popup']").length === 0) || self.isSimpleListMover))
			{
				self.editStop();
				return;
			}

			if ($target.closest(".tfmodal").length > 0 && $.contains($target.closest(".tfmodal")[0], self._$element[0]))
			{
				//quick add modal.
				self.editStop();
			}
		});

		self._$parent.on("click" + self._eventNamespace, (e) => 
		{
			self.showModal();
			e.stopPropagation();
		});

		self._$element.on("keydown" + self._eventNamespace, (e) =>
		{
			var keyCode = e.keyCode || e.which, handled = true;
			switch (keyCode)
			{
				case $.ui.keyCode.ESCAPE:
					self.cancel();
					break;
				case $.ui.keyCode.ENTER:
					self.showModal();
					break;
				default:
					handled = false;
					break;
			}

			if (handled)
			{
				e.stopPropagation();
				e.preventDefault();
			}
		});

		TF.DetailView.FieldEditor.NonInputFieldEditor.prototype.bindEvents.call(self);
	}

	ListMoverFieldEditor.prototype._updateParentContent = function()
	{
		var self = this;
		if (self.selectedItems instanceof Array)
		{
			var content = self.selectedItems.length === 0 ?
				"None" : self._getRecordValue();

			self._$parent.find(".item-content").text(content);

			//remove default error message which added when create new 
			self.getContainerElement().find("small.help-block").remove();
		}
	};

	ListMoverFieldEditor.prototype.dispose = function()
	{
		$(document).off(this._eventNamespace);
		this._$parent.off(this._eventNamespace);

		TF.DetailView.FieldEditor.NonInputFieldEditor.prototype.dispose.call(this);
	};

	ListMoverFieldEditor.prototype._getRecordValue = function()
	{
		return Array.isArray(this.selectedItems) ? this.selectedItems.map((item) => item.text).join(", ") : "";
	}

	ListMoverFieldEditor.prototype._getAppliedResult = function(data, value, text)
	{
		var recordValue = this._getRecordValue(),
			result = TF.DetailView.FieldEditor.NonInputFieldEditor.prototype._getAppliedResult.call(this, data, value, text);

		$.extend(result, {
			selectPickListOptionIDs: value,
			recordValue: recordValue,
		});

		return result;
	};
})();