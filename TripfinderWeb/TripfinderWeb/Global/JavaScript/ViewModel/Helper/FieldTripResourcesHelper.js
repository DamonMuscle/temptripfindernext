(function()
{
	var namespace = createNamespace("TF.Helper");

	namespace.FieldTripResourcesHelper = FieldTripResourcesHelper;

	function FieldTripResourcesHelper()
	{
		// This is intentional
	}

	FieldTripResourcesHelper.prototype.formatCurrency = function(currency)
	{
		if (typeof currency !== "number")
		{
			currency = Number(currency);
		}
		currency = currency || 0;
		return currency.toFixed(2);
	}

	FieldTripResourcesHelper.prototype.checkPicture = function(typeName, obj, element)
	{
		var imageId = obj || 0;
		this.getImage(typeName, imageId)
			.then(function(result)
			{
				if (result && result.Items && result.Items[0] && result.Items[0].FileContent)
				{
					var src = `url(data:image/jpeg;base64,${result.Items[0].FileContent})`;
					$(element).attr("src", src);
				}
			}.bind(this));
		return "";
	}

	FieldTripResourcesHelper.prototype.getImage = function(typeName, imageId)
	{
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "recordpictures"), {
			paramData: {
				DBID: tf.datasourceManager.databaseId,
				DataTypeID: tf.dataTypeHelper.getIdByName(typeName),
				RecordID: imageId,
				"@fields": "FileContent"
			}
		}).then(function(response)
		{
			return response;
		});
	}

	FieldTripResourcesHelper.prototype.calculatedMileageRateComputer = function(fieldTripResourceDataEntry)
	{
		if (fieldTripResourceDataEntry.FieldTripId == 0)
		{
			return 0 //FT-296 When add a new field trip the EndingOdometer will be disable and the MileageRate will not be calculated.
		}
		return (Number(fieldTripResourceDataEntry.EndingOdometer) - Number(fieldTripResourceDataEntry.StartingOdometer)) * Number(fieldTripResourceDataEntry.MileageRate);
	}

	FieldTripResourcesHelper.prototype.vehicleCostComputer = function(fieldTripResourceDataEntry)
	{
		return this.calculatedMileageRateComputer(fieldTripResourceDataEntry) + Number(fieldTripResourceDataEntry.VehFixedCost);
	}

	FieldTripResourcesHelper.prototype.driverCostComputer = function(fieldTripResourceDataEntry)
	{
		if (!fieldTripResourceDataEntry || !fieldTripResourceDataEntry.DriverHours)
		{
			return 0;
		}
		return Number(fieldTripResourceDataEntry.DriverHours) * Number(fieldTripResourceDataEntry.DriverRate) +
			Number(fieldTripResourceDataEntry.DriverOTHours) * Number(fieldTripResourceDataEntry.DriverOTRate) +
			Number(fieldTripResourceDataEntry.DriverFixedCost);
	}

	FieldTripResourcesHelper.prototype.driverTotalCostComputer = function(fieldTripResourceDataEntry)
	{
		return this.driverCostComputer(fieldTripResourceDataEntry) + this.expensesComputer(fieldTripResourceDataEntry);
	}

	FieldTripResourcesHelper.prototype.busAideCostComputer = function(fieldTripResourceDataEntry)
	{
		return Number(fieldTripResourceDataEntry.AideHours) * Number(fieldTripResourceDataEntry.AideRate) +
			Number(fieldTripResourceDataEntry.AideOTHours) * Number(fieldTripResourceDataEntry.AideOTRate) +
			Number(fieldTripResourceDataEntry.AideFixedCost);
	}

	FieldTripResourcesHelper.prototype.resourceSubTotalComputer = function(fieldTripResourceDataEntry)
	{
		return this.vehicleCostComputer(fieldTripResourceDataEntry) +
			this.driverTotalCostComputer(fieldTripResourceDataEntry) +
			this.busAideCostComputer(fieldTripResourceDataEntry);
	}

	FieldTripResourcesHelper.prototype.expensesComputer = function(fieldTripResourceDataEntry)
	{
		return Number(fieldTripResourceDataEntry.DriverExpMeals) +
			Number(fieldTripResourceDataEntry.DriverExpMisc) + Number(fieldTripResourceDataEntry.DriverExpParking) +
			Number(fieldTripResourceDataEntry.DriverExpTolls);
	}

	FieldTripResourcesHelper.prototype.resourcesTotalComputer = function()
	{
		var resourcesTotal = 0, fixedCost = parseFloat(this.obEntityDataModel().fixedCost() || 0), minimumCost = parseFloat(this.obEntityDataModel().minimumCost() || 0);
		if (this.obFieldTripResourceGroupData())
		{
			for (var i = 0; i < this.obFieldTripResourceGroupData().length; i++)
			{
				resourcesTotal = resourcesTotal + this.resourceSubTotalComputer(this.obFieldTripResourceGroupData()[i]);
			}
		}

		if (resourcesTotal + fixedCost < minimumCost)
		{
			resourcesTotal = minimumCost;
		}
		else
		{
			resourcesTotal += fixedCost;
		}

		return '$' + this.formatCurrency(resourcesTotal);
	}

	FieldTripResourcesHelper.prototype.getUserName = function(staff, type)
	{
		if (staff)
		{
			if (type === 'driver')
			{
				return staff.DriverName;
			}
			else if (type === 'staff')
			{
				return staff.AideName;
			}
			return '';
		}
		else
		{
			return '';
		}
	}

	FieldTripResourcesHelper.prototype.getVehicleName = function(vehicle)
	{
		if (vehicle)
		{
			return vehicle.VehicleName;
		}
		else
		{
			return '';
		}
	}


})()
