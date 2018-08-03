
(function()
{
	createNamespace("TF").EntityHelper = EntityHelper;

	function EntityHelper()
	{
	}
	EntityHelper.prototype.getEntityType = function(type)
	{//get entity type
		switch (type)
		{
			case "altsite":
				return { display: "Alternate Site", field: "AlternateSites" };
			case "contractor":
				return { display: "Contractor", field: "Contractors" };
			case "district":
				return { display: "District", field: "Districts" };
			case "fieldtrip":
				return { display: "Field Trip", field: "FieldTrip" };
			case "georegion":
				return { display: "Geo Region", field: "GeoRegions" };
			case "school":
				return { display: "School", field: "Schools" };
			case "staff":
				return { display: "Staff", field: "Staff" };
			case "student":
				return { display: "Student", field: "Students" };
			case "trip":
				return { display: "Trip", field: "Trips" };
			case "tripstop":
				return { display: "Trip Stop", field: "TripStops" };
			case "vehicle":
				return { display: "Vehicle", field: "Vehicles" };
			case "fieldtriptemplate":
				return { display: "Field Trip Template", field: "FieldTripTemplates" };
			default:
				return { display: "", field: "" };
		}
	}

	EntityHelper.prototype.getEntityName = function(type, entity)
	{//get entity name
		switch (type)
		{
			case "altsite":
			case "contractor":
			case "district":
			case "fieldtrip":
			case "fieldtriptemplate":
			case "georegion":
			case "school":
			case "trip":
				return entity.Name;
			case "staff":
				return entity.FirstName + " " + entity.MiddleName + " " + entity.LastName;
			case "student":
				return entity.FirstName + " " + entity.Mi + " " + entity.LastName;
			case "tripstop":
				return entity.Street;
			case "vehicle":
				return entity.BusNum;
			default:
				return "";
		}
	}

	tf.EntityHelper = new TF.EntityHelper();
})();