(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").CreateStopsFromFileViewModel = CreateStopsFromFileViewModel;

	function CreateStopsFromFileViewModel(tripStops, viewModel)
	{
		this.selectedTripStops = [];
		this.selectedUids = [];
		this.viewModel = viewModel;
		this.dataModel = viewModel.dataModel;
		this.tripStops = tripStops.map(function(stop, i)
		{
			stop.id = i + 1;
			return stop;
		});
		this.obTrips = viewModel.dataModel.getEditTrips();

		this.totalStops = 0;
		this.selectedStopsCount = 0;
	}

	CreateStopsFromFileViewModel.prototype.init = function(viewModel, element)
	{
		this.$element = $(element);
		this.initGrid();
	};

	CreateStopsFromFileViewModel.prototype.initGridColumns = function()
	{
		var columns = [];
		var tripStop = this.tripStops[0];

		function isExtraColumn(prop)
		{
			if (prop === "geometry" || prop === "lat" || prop === "latitute" || prop === "long" || prop === "id"
				|| prop === "longitute" || prop === "street")
			{
				return true;
			}
			return false;
		}
		for (var prop in tripStop)
		{
			let column = {
				title: prop === "address" ? "street" : prop,
				field: prop.replace(/ +/g, "")
			};
			if (prop == "isValid")
			{
				column.title = "Geocoded";
				column.template = item =>
				{
					if (!item.isValid)
					{
						let message = item.x && item.y ? "Cannot be geocoded, outside your map area." : (item.address ? "Cannot be geocoded, please input zip or city in your csv or xls file, can not be converted only by street." : "Cannot be geocoded, please input street or coordinates.");
						return "<div class='invalid-stop-information-file' title='" + message + "'></div>";
					}

					return "<div class='icon-inner icon-geocoded valid-stop'></div>";
				};

				column.width = 75;
				columns = [column, ...columns];
			}
			else if (tripStop.hasOwnProperty(prop) && !isExtraColumn(prop))
			{
				columns.push(column);
			}
		}
		return columns;
	};

	CreateStopsFromFileViewModel.prototype.initGrid = function()
	{
		var self = this;
		this.$element.find(".kendo-grid").kendoGrid({
			dataSource: new kendo.data.DataSource({
				data: this.tripStops,
				schema: {
					model: { id: "id" }
				}
			}),
			columns: self.initGridColumns(),
			height: 400,
			selectable: "multiple",
			sortable: true,
			reorderable: true,
			resizable: true,
			pageable: {
				pageSize: 5000,
				messages: {
					display: ""
				},
			},
			dataBinding: function()
			{
				self.totalStops = self.tripStops.length;
				var $pager = $(this.element).find(".k-grid-pager");
				$pager.css("text-align", "left").html("<span class='total-stops'></span>");
				self.setFootInfo();
			},
			persistSelection: true,
			dataBound: function()
			{
				// disable click on invalid table row
				self.$element.find(".kendo-grid").find("tr").each(function(i, tr)
				{
					if ($(tr).find(".invalid-stop-information-file").length > 0)
					{
						$(tr).on("click", function(e)
						{
							e.preventDefault();
							e.stopPropagation();
						});
					}
				});
			},
			change: function()
			{
				if (self.updatingSelection)
				{
					return;
				}
				var selectedRows = this.select();
				self.selectedTripStops = [];
				self.selectedUids = [];
				var validSelectedRows = [];
				for (var i = selectedRows.length - 1; i >= 0; i--)
				{
					let item = this.dataItem(selectedRows[i]);
					if (!item.isValid)
					{
						continue;
					}
					self.selectedTripStops.push(item);
					self.selectedUids.push(selectedRows[i].dataset["kendoUid"]);
					validSelectedRows.push(selectedRows[i]);
				}
				self.selectedStopsCount = self.selectedTripStops.length;
				if (validSelectedRows.length != selectedRows.length)
				{
					self.updatingSelection = true;
					this.clearSelection();
					this.select(validSelectedRows);
					self.updatingSelection = false;
				}
				self.setFootInfo();
			}
		});
	};

	CreateStopsFromFileViewModel.prototype.setFootInfo = function()
	{
		var stopsInfo = `${this.totalStops} (${this.selectedStopsCount == 0 ? "None" : this.selectedStopsCount} Selected)`;
		$(this.$element).find(".total-stops").text(stopsInfo);
	};

	CreateStopsFromFileViewModel.prototype.apply = function()
	{
		if (this.selectedTripStops.length == 0)
		{
			tf.promiseBootbox.alert("Please select one or more valid stops.");
			return Promise.resolve(false);
		}

		return Promise.resolve(this.selectedTripStops.map(function(c)
		{
			// reset geometry to fix kendo grid change the original geometry which is incorrect
			c.geometry = new tf.map.ArcGIS.Point({
				x: c.geometry.x,
				y: c.geometry.y,
				spatialReference: {
					wkid: 102100
				}
			});
			return c;
		}));
	};

	CreateStopsFromFileViewModel.prototype.cancel = function()
	{
		return Promise.resolve(true);
	};

	CreateStopsFromFileViewModel.prototype.dispose = function()
	{
		tfdispose(this);
	};

})();