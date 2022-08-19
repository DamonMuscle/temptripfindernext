(function()
{
	createNamespace('TF.Control').FieldTripViewResourceViewModel = FieldTripViewResourceViewModel;

	function FieldTripViewResourceViewModel(source, obEntity)
	{
		this.obResoucesExpand = ko.observable(true);
		this.obFieldTripResourceGroupData = tf.measurementUnitConverter.convertToDisplay(source, new TF.DataModel.FieldTripResourceDataModel());
		this.obEntityDataModel = obEntity;

		$.extend(this, new TF.Helper.FieldTripResourcesHelper());

		this.obResourcesTotalComputer = ko.computed(this.resourcesTotalComputer, this);
		this.obRespurcesExpendData = ko.computed(this.respurcesExpendDataComputer, this);

		this.resoucesCollapsedClick = this.resoucesCollapsedClick.bind(this);
		this.resoucesExpandedClick = this.resoucesExpandedClick.bind(this);
	}

	FieldTripViewResourceViewModel.prototype.dispose = function()
	{
	};

	FieldTripViewResourceViewModel.prototype.resoucesCollapsedClick = function(viewModel, e)
	{
		this.obResoucesExpand(false);
	}

	FieldTripViewResourceViewModel.prototype.resoucesExpandedClick = function(viewModel, e)
	{
		this.obResoucesExpand(true);
	}


	FieldTripViewResourceViewModel.prototype.respurcesExpendDataComputer = function()
	{
		var resourceGroupExpandData = [];

		if (!this.obFieldTripResourceGroupData())
		{
			return resourceGroupExpandData;
		}

		for (var i = 0; i < this.obFieldTripResourceGroupData().length; i++)
		{
			var resourceData = this.obFieldTripResourceGroupData()[i]

			resourceExpandData = {
				VehicleId: resourceData.VehicleId,
				Vehicle: {
					Id: resourceData.VehicleId,
					Name: resourceData.VehicleName || ''
				},
				Staffs: [
					{
						Driver: {
							Id: resourceData.DriverId,
							Name: resourceData.DriverName || ''
						},
						BusAide: {
							Id: resourceData.AideId,
							Name: resourceData.AideName || ''
						}
					}
				]
			}

			var existResource = false;
			var duplicatedVehicleIndex = 0;

			for (var j = 0; j < resourceGroupExpandData.length; j++)
			{
				if (resourceGroupExpandData[j].VehicleId === resourceExpandData.VehicleId)
				{
					existResource = true;
					duplicatedVehicleIndex = j;
					break;
				}
			}
			if (existResource)
			{
				resourceGroupExpandData[duplicatedVehicleIndex].Staffs.push(resourceExpandData.Staffs[0]);
			}
			else
			{
				resourceGroupExpandData.push(resourceExpandData)
			}
		}

		return resourceGroupExpandData;
	}

	FieldTripViewResourceViewModel.prototype.getVehiclePicture = function(vehicleId, $element)
	{
		return this.getPicture('vehicle', vehicleId, $element);
	}

	FieldTripViewResourceViewModel.prototype.getStaffPicture = function(staffId, $element)
	{
		return this.getPicture('staff', staffId, $element);
	}

	FieldTripViewResourceViewModel.prototype.getPicture = function(imageType, obj, element)
	{
		this.checkPicture(imageType, obj, element);
	}
})();