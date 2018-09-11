(function()
{
	createNamespace("TF.Modal.Grid").EditKendoColumnModalViewModelForMobile = EditKendoColumnModalViewModelForMobile;

	var firstOpenKey = "edit-column-mobile-first-load";

	function EditKendoColumnModalViewModelForMobile(availableColumns, selectedColumns, defaultLayoutColumns, successCallback)
	{
		var self = this;
		selectedColumns.forEach(function(item, i)
		{
			item.obSelected = ko.observable(true);
			item.orderIndex = i;
		});
		availableColumns.forEach(function(item)
		{
			item.obSelected = ko.observable(false);
			item.orderIndex = 1000;
		});
		self.allColumns = ko.observableArray(selectedColumns.concat(availableColumns));
		self.activeType = ko.observable("Selected");
		self.selectedColumns = ko.observableArray(self._fillDisplayName(selectedColumns).slice());
		self.availableColumns = ko.observableArray(self._fillDisplayName(availableColumns).slice().sort(self._sortByDisplayName));
		self.successCallback = successCallback;
		self.orignalSelectedColumns = selectedColumns.slice();
		self.description = "You can add to, remove, and reorder the columns in this grid. Tap any column to move it into the selected columns group.  Tap any selected column to move it back into the list of available columns.  To adjust the column display order, arrange the columns from top to bottom in the left to right order you would like them to display in the grid.";
		self.obDescription = ko.observable(self.description);
		self.isFirstLoad = tf.storageManager.get(firstOpenKey) || true;
	}

	EditKendoColumnModalViewModelForMobile.prototype = Object.create(TF.ContextMenu.BaseGeneralMenuViewModel.prototype);

	EditKendoColumnModalViewModelForMobile.prototype.constructor = EditKendoColumnModalViewModelForMobile;


	EditKendoColumnModalViewModelForMobile.prototype.setSelectedAndAvailable = function()
	{
		this.selectedColumns(Enumerable.From(this.allColumns()).Where("$.obSelected()").OrderBy("$.orderIndex").ToArray());
		this.availableColumns(Enumerable.From(this.allColumns()).Where("$.obSelected()==false").OrderBy("$.DisplayName.toLowerCase()").ToArray());
	};


	EditKendoColumnModalViewModelForMobile.prototype._fillDisplayName = function(columns)
	{
		return columns.map(function(column)
		{
			if (!column["DisplayName"])
			{
				column["DisplayName"] = column.FieldName;
			}
			return column;
		});
	};

	var _sortByDisplayName = function(a, b)
	{
		var x, y;
		x = a["DisplayName"] ? a["DisplayName"].toLowerCase() : '';
		y = b["DisplayName"] ? b["DisplayName"].toLowerCase() : '';
		return (x == y ? 0 : (x > y ? 1 : -1));
	};
	var prevTarget;
	EditKendoColumnModalViewModelForMobile.prototype.toggleSelectItem = function(model, e)
	{
		if (prevTarget)
		{
			prevTarget.finish();
		}
		model.obSelected(!model.obSelected());
		var durection = 200;
		var target = $(e.currentTarget);
		var toDivId = "editColumnMobileListView";
		var fromDivId = "editColumnMobileNotSelectListView";
		prevTarget = target;
		if (model.obSelected())
		{
			model.orderIndex = this.selectedColumns().length + 1;
		}
		else
		{
			toDivId = "editColumnMobileNotSelectListView";
			fromDivId = "editColumnMobileListView";
			model.orderIndex = this.allColumns().length;
		}
		var $toDiv = $("#" + toDivId),
			$fromDiv = $("#" + fromDivId);
		$toDiv.finish();
		$fromDiv.finish();
		var newHeight = $toDiv.outerHeight() + target.outerHeight() - 1;
		var newFromHeight = $fromDiv.outerHeight() - target.outerHeight() + 1;
		$toDiv.animate(
			{
				height: newHeight
			}, durection, function()
			{
				$toDiv.css('height', 'auto');
			});
		$fromDiv.animate(
			{
				height: newFromHeight
			}, durection, function()
			{
				$fromDiv.css('height', 'auto');
			});
		target.animate(
			{
				height: 0,
				opacity: 0,
				paddingTop: 0,
				paddingBottom: 0
			},
			durection,
			function()
			{
				this.setSelectedAndAvailable();
				this.setSortable();

				var $gridIconWrapper = $('.document-grid.grid-map-container .grid-icons');
				if (this.selectedColumns().length < 1)
				{
					var message = "At least one record must be selected.";
					tf.promiseBootbox.alert(message, "Warning");
					if ($('.document-grid.grid-map-container .hover-touch-disabled').length <= 0)
					{
						var divHover = '<div class="hover-touch-disabled" style="z-index:22001; position:absolute; top:0; width:100%"></div>';

						$gridIconWrapper.append(divHover);
						var bottomBorderHeight = 2;
						$gridIconWrapper.find('.hover-touch-disabled').height($('.grid-icons').outerHeight() + bottomBorderHeight);
					}
				}
				else
				{
					if ($gridIconWrapper.find('.hover-touch-disabled').length > 0)
						$gridIconWrapper.find('.hover-touch-disabled').remove();
				}
			}.bind(this));
	};

	EditKendoColumnModalViewModelForMobile.prototype.initModel = function(model, element)
	{
		this.$element = $(element);
		this.$description = this.$element.find(".mobile-modal-grid-description");
		this.$container = this.$element.find(".scroll-container");
		this.setSelectedAndAvailable();
		if (this.isFirstLoad !== true)
		{
			this.lessDescriptionClick();
		} else
		{
			this.moreDescriptionClick();
		}
		tf.storageManager.save(firstOpenKey, "loaded");
		setTimeout(function()
		{
			this.setDescription();
			this.setSortable();
		}.bind(this));
	};

	EditKendoColumnModalViewModelForMobile.prototype.setDescription = function()
	{
		this.$container.css("height", "calc(100% - " + this.$description.outerHeight() + "px)");

	};

	EditKendoColumnModalViewModelForMobile.prototype.moreDescriptionClick = function()
	{
		this.$description.removeClass('more').addClass('less');
		this.obDescription(this.description);
		this.setDescription();
	};

	EditKendoColumnModalViewModelForMobile.prototype.lessDescriptionClick = function()
	{
		this.$description.removeClass('less').addClass('more');
		var $testWidth = $("<div></div>").css(
			{
				"position": "absolute",
				"left": 10000
			}).width($(document).width() - 30);
		$("body").append($testWidth);
		var description = "";
		for (var i = 0; i <= this.description.length; i++)
		{
			$testWidth.html(this.description.substring(0, i) + "more...");
			if ((/\W/g).test(this.description[i]))
			{
				if ($testWidth.height() > 38) //two line
				{
					break;
				}
				else
				{
					description = this.description.substring(0, i);
				}
			}
		}
		$testWidth.remove();
		this.obDescription(description);
		this.setDescription();
	};

	EditKendoColumnModalViewModelForMobile.prototype.setSortable = function()
	{
		var self = this;
		if ($("#editColumnMobileListView").uiSortable)
		{
			$("#editColumnMobileListView").sortable("destroy");
		}
		$("#editColumnMobileListView").sortable(
			{
				handle: ".drag-handler",
				placeholder: "ui-sortable-placeholder",
				scroll: true,
				stop: function(event, ui)
				{
					var ans = {};
					$("#editColumnMobileListView").find("[fieldName]").each(function(index, item)
					{
						ans[$(item).attr("fieldName")] = index;
					});
					self.allColumns().forEach(function(item)
					{
						if (item.obSelected())
						{
							item.orderIndex = ans[item.FieldName];
						}
					});
				}
			});
	};

	EditKendoColumnModalViewModelForMobile.prototype.dispose = function()
	{
		this.setSelectedAndAvailable();
		if (Enumerable.From(this.orignalSelectedColumns).Select("$.FieldName").ToArray().join(",") != Enumerable.From(this.selectedColumns()).Select("$.FieldName").ToArray().join(","))
		{
			this.successCallback(
				{
					selectedColumns: this.selectedColumns(),
					availableColumns: this.availableColumns()
				});
		}
	};

})();
