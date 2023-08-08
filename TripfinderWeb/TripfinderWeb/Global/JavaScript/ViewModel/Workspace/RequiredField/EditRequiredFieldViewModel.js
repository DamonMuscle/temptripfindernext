(function()
{
	createNamespace("TF.RequiredField").EditRequiredFieldViewModel = EditRequiredFieldViewModel;

	var gridCols = [
		{
			field: 'DisplayName',
			template: function(e)
			{
				var str = "";
				if (e.SystemRequired)
				{
					str += "<span title='{0}' class='sys-star'>*</span>";
				}
				else if (e.UdfField)
				{
					str += "<span title='{0}' class='udf-star'>(User Defined) </span>";
				}
				str += "<span title='{0}'>{0}</span>";
				return String.format(str, e.Label);
			},
			title: "Name"
		}
	];

	function EditRequiredFieldViewModel(options)
	{
		var self = this,
			requiredFields = [],
			availableFields = [];

		self.data = options.data;
		self.data.forEach(function(val)
		{
			if (val.SystemRequired)
			{
				return;
			}

			if (val.Required)
			{
				requiredFields.push(val);
			}
			else
			{
				availableFields.push(val);
			}
		});

		self.requiredFields = requiredFields;

		TF.Grid.EditKendoColumnViewModel.call(self, availableFields, requiredFields, null, null, true, false);

		self.gridType = options.gridType;

		self.obRightToLeftAvailable = ko.observable(false);
		self.obRightToLeftAllAvailable = ko.computed(function()
		{
			return self.obselectedColumns().filter(function(item)
			{
				return !item.SystemRequired;
			}).length > 0;
		});
	};

	EditRequiredFieldViewModel.prototype = Object.create(TF.Grid.EditKendoColumnViewModel.prototype);

	EditRequiredFieldViewModel.prototype.constructor = EditRequiredFieldViewModel;

	EditRequiredFieldViewModel.prototype._sortByDisplayName = function(a, b)
	{
		var val = Number(!!a.UdfField) - Number(!!b.UdfField);
		if (val === 0)
		{
			val = a.Label > b.Label ? 1 : (a.Label < b.Label ? -1 : 0);
		}
		return val;
	}

	EditRequiredFieldViewModel.prototype.initLeftGrid = function(gridColumns)
	{
		var grid = TF.Grid.EditKendoColumnViewModel.prototype.initLeftGrid.call(this, gridCols);
		this.leftGrid = grid;
	}

	EditRequiredFieldViewModel.prototype.initRightGrid = function(gridColumns)
	{
		var grid = TF.Grid.EditKendoColumnViewModel.prototype.initRightGrid.call(this, gridCols);
		this.rightGrid = grid;
	}

	EditRequiredFieldViewModel.prototype.onRightGridChange = function(arg)
	{
		var self = this;
		TF.Grid.EditKendoColumnViewModel.prototype.onRightGridChange.call(self, arg);

		if (self.rightGrid)
		{
			var selectedItems = self.rightGrid.select();
			if (selectedItems && selectedItems.length)
			{
				for (var i = 0, len = selectedItems.length; i < len; i++)
				{
					var item = self.rightGrid.dataItem(selectedItems[i]);
					if (item && !item.SystemRequired)
					{
						self.obRightToLeftAvailable(true);
						return;
					}

				}
			}
		}
		self.obRightToLeftAvailable(false);
	};

	EditRequiredFieldViewModel.prototype.toLeftGrid = function(moveItems, sourceData, targetData)
	{
		var items = moveItems.filter(function(uid)
		{
			var item = sourceData.getByUid(uid);
			if (item && item.SystemRequired)
			{
				return false;
			}
			return true;
		});
		TF.Grid.EditKendoColumnViewModel.prototype.toLeftGrid.call(this, items, sourceData, targetData);
	};

	EditRequiredFieldViewModel.prototype.bindRightGridDraggable = function(filter)
	{
		var newFilter = "tbody > tr:not(:has(.sys-star))";
		TF.Grid.EditKendoColumnViewModel.prototype.bindRightGridDraggable.call(this, newFilter);
	}

	EditRequiredFieldViewModel.prototype.rightGridDropTargetHelper = function(evt)
	{
		var requiredFields = this.selectedColGridContainer.find('.k-grid-content table[role=grid] tr'),
			lastSystemField = requiredFields.filter(":has(.sys-star)").last(),
			lastField = requiredFields.last(),
			targetItem;

		if (lastSystemField.length == 0)
		{
			return TF.Grid.EditKendoColumnViewModel.prototype.rightGridDropTargetHelper.call(this, evt);
		}

		if (evt.draggable.hint.offset().top < lastSystemField.offset().top)
		{
			targetItem = lastSystemField;
		}
		else
		{
			targetItem = lastField;
		}
		targetItem.addClass("drag-target-insert-after-cursor");
		return {
			targetItem: targetItem,
			insertBeforeTarget: false
		};
	};
	EditRequiredFieldViewModel.prototype.careteDropTargetHelper = function(evt)
	{
		var targetItem = $(evt.dropTarget[0]);
		if (targetItem.is(":has(.sys-star)"))
		{
			targetItem = targetItem.parent().children("tr:has(.sys-star)").last();
		}
		return targetItem;
	}

	EditRequiredFieldViewModel.prototype._getSelectedGridInsertIdx = function(dest)
	{
		var newDest,
			requiredFields = this.selectedColGridContainer.find('.k-grid-content table[role=grid] tr td'),
			lastSystemField = requiredFields.filter(":has(.sys-star)").last(),
			lastSystemFieldIndex = lastSystemField.index(),
			destIndex;

		if (dest.is("th"))
		{
			if (lastSystemField.length > 0)
			{
				newDest = lastSystemField;
			} else
			{
				newDest = dest;
			}
		} else
		{
			dest = dest.parent("tr");
			destIndex = dest.index();
			if (destIndex <= lastSystemFieldIndex)
			{
				newDest = lastSystemField;
			} else
			{
				newDest = dest.children().eq(0);
			}
		}
		return TF.Grid.EditKendoColumnViewModel.prototype._getSelectedGridInsertIdx.call(this, newDest);
	}

	EditRequiredFieldViewModel.prototype.apply = function()
	{
		var self = this,
			updateVals = [],
			updateFields = [],
			oriRequiredFields = self.requiredFields,
			newRequiredFields = self.obselectedColumns().slice();

		oriRequiredFields.forEach(function(field)
		{
			var idx = newRequiredFields.findIndex(function(f)
			{
				return f.RowID === field.RowID && f.UdfField == field.UdfField;
			});
			if (idx > -1)
			{
				newRequiredFields.splice(idx, 1);
			} else
			{
				updateFields.push(field);
				updateVals.push({
					RowID: field.RowID,
					Required: false,
					UdfField: !!field.UdfField
				});
			}
		});
		newRequiredFields.forEach(function(field)
		{
			var newField = self.data.find(function(f)
			{
				return f.RowID === field.RowID && f.UdfField == field.UdfField;
			})
			if (newField != null)
			{
				updateFields.push(newField);
				updateVals.push({
					RowID: field.RowID,
					Required: true,
					UdfField: !!field.UdfField
				});
			}
		});

		if (updateVals.length > 0)
		{
			return tf.requiredFieldDataHelper.updateRecords(updateVals)
				.then(function(resp)
				{
					if (resp != null)
					{
						//update Required value of original data
						updateFields.forEach(function(field, idx)
						{
							field.Required = updateVals[idx].Required;
						});

						if (resp.indexOf("general") > -1)
						{
							PubSub.publish(pb.REQUIRED_FIELDS_CHANGED, self.gridType);
						}

						if (resp.indexOf("udf") > -1)
						{
							PubSub.publish(pb.REQUIRED_UDF_FIELDS_CHANGED, self.gridType);
						}

						return true;
					} else
					{
						return false;
					}
				})
		} else
		{
			return Promise.resolve(false);
		}
	};

	EditRequiredFieldViewModel.prototype.cancel = function()
	{
		this.dispose();
		return Promise.resolve(false);
	};

})();