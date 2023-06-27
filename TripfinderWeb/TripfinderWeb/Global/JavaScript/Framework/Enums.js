(function()
{
	var ns = createNamespace("TF.Enums");

	ns.SpecifyRecordsType = TF.createEnum(["All Records", "Filter", "Specific Records"], 1);

	ns.EditStatus = TF.createEnum(["No Changed", "Created", "Updated", "Deleted"]);

	ns.RoutingSpeedType = TF.createEnum(["StreetSpeed", "DefaultSpeed"]);

	ns.BoundaryType = TF.createEnum(["StreetPath", "Radius"]);

	ns.PathType = TF.createEnum(["GPS", "Distance", "Time"]);

	ns.DBLockReason = TF.createEnum(
		["StopPool", "RoutingSession", "CritChange", "StudGlobalReplace", "StudFindSchedule", "ResourceScheduler", "Archive", "CopyFrom", "Rollover", "Restore", "Copy", "AllTypes"],
		[1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 99]
	);
})();
