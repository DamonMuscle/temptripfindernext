(function()
{
	createNamespace("TF.Grid").FieldTripResourceGroupGridViewModel = FieldTripResourceGroupGridViewModel;

	function FieldTripResourceGroupGridViewModel(obDocumentFocusState, element, kendoGridState, gridShowType, defaultGridLayoutExtendedEntity, showBulkMenu, option, view, dataEntryObjects)
	{
		TF.Grid.BaseKendoGridViewModel.call(this, obDocumentFocusState, element, kendoGridState, gridShowType, true, false, option, view, dataEntryObjects);
		this.init();

		switch (kendoGridState.entityType)
		{
			case "vehicle":
				this.options.gridDefinition = this.gridDefinition.vehicle;
				this.type = "fieldtripresourcegroup_vehicle";
				break;
			case "driver":
				this.options.gridDefinition = this.gridDefinition.driver;
				this.type = "fieldtripresourcegroup_driver";
				break;
			case "aide":
				this.options.gridDefinition = this.gridDefinition.aide;
				this.type = "fieldtripresourcegroup_aide";
				break;
			case "resource":
				this.options.gridDefinition = this.gridDefinition.resource;
				this.type = "fieldtripresourcegroup_resource";
				break;
		}
		this.options.parentType = "fieldtripresourcegroup";
		this.options.kendoGridOption = {
			pageable: false
		};
		this.options.disableQuickFilter = true;
		this.options.layoutAndFilterOperation = false;
		this.options.onDataBound = this.onDataBound.bind(this);
		this.hasRightClickEvent = false;
		this.createGrid(this.options);
	};

	FieldTripResourceGroupGridViewModel.prototype = Object.create(TF.Grid.BaseKendoGridViewModel.prototype);

	FieldTripResourceGroupGridViewModel.prototype.constructor = FieldTripResourceGroupGridViewModel;

	FieldTripResourceGroupGridViewModel.prototype.onDataBound = function()
	{
		this.searchGrid.obFilteredRecordCount(this.searchGrid.kendoGrid.dataSource.data().length);
	}

	FieldTripResourceGroupGridViewModel.prototype._viewfromDBClick = function(event, item)
	{
	};

	FieldTripResourceGroupGridViewModel.prototype.init = function()
	{
		this.gridDefinition = {
			vehicle: {
				Columns: [
					{
						FieldName: "VehicleName",
						DisplayName: "Vehicle",
						type: "string"
					},
					{
						FieldName: "Startingodometer",
						DisplayName: "Odometer Start",
						type: "number",
						Precision: 2,
						format: "{0:0}"
					},
					{
						FieldName: "Endingodometer",
						DisplayName: "Odometer End",
						type: "number",
						Precision: 2,
						format: "{0:0}"
					},
					{
						FieldName: "MileageRate",
						DisplayName: "Mileage Rate",
						type: "number",
						Precision: 2,
						format: "{0:0.00}"
					},
					{
						FieldName: "VehFixedCost",
						DisplayName: "Fixed Cost",
						type: "number",
						Precision: 2,
						format: "{0:0.00}"
					},
					{
						FieldName: "VehTotal",
						DisplayName: "Total",
						type: "number",
						Precision: 2,
						format: "{0:0.00}"
					}
				]
			},

			driver: {
				Columns: [
					{
						FieldName: "DriverName",
						DisplayName: "Driver",
						type: "string"
					},
					{
						FieldName: "DriverHours",
						DisplayName: "Hours",
						type: "number",
						Precision: 2,
						format: "{0:0}"
					},
					{
						FieldName: "DriverOthours",
						DisplayName: "OT Hours",
						type: "number",
						Precision: 2,
						format: "{0:0}"
					},
					{
						FieldName: "DriverOtrate",
						DisplayName: "OT Rate",
						type: "number",
						Precision: 2,
						format: "{0:0.00}"
					},
					{
						FieldName: "DriverFixedCost",
						DisplayName: "Fixed Cost",
						type: "number",
						Precision: 2,
						format: "{0:0.00}"
					},
					{
						FieldName: "driverTotal",
						DisplayName: "Total",
						type: "number",
						Precision: 2,
						format: "{0:0.00}"
					}
				]
			},

			aide: {
				Columns: [
					{
						FieldName: "AideName",
						DisplayName: "Bus Aide",
						type: "string"
					},
					{
						FieldName: "AideHours",
						DisplayName: "Hours",
						type: "number",
						Precision: 2,
						format: "{0:0}"
					},
					{
						FieldName: "AideOthours",
						DisplayName: "OT Hours",
						type: "number",
						Precision: 2,
						format: "{0:0}"
					},
					{
						FieldName: "AideOtrate",
						DisplayName: "OT Rate",
						type: "number",
						Precision: 2,
						format: "{0:0.00}"
					},
					{
						FieldName: "AideFixedCost",
						DisplayName: "Fixed Cost",
						type: "number",
						Precision: 2,
						format: "{0:0.00}"
					},
					{
						FieldName: "aideTotal",
						DisplayName: "Total",
						type: "number",
						Precision: 2,
						format: "{0:0.00}"
					}
				]
			},

			resource: {
				Columns: [
					{
						FieldName: "VehicleName",
						DisplayName: "Vehicle",
						type: "string"
					},
					{
						FieldName: "AideName",
						DisplayName: "Bus Aide",
						type: "string"
					},
					{
						FieldName: "DriverName",
						DisplayName: "Driver",
						type: "string"
					}
				]
			}
		}
	};

})();