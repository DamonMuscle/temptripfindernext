(function()
{
	createNamespace("TF.GIS").NetworkEnum =
	{
		CURB_APPROACH: {
			'EITHER_SIDE': 0,
			'RIGHT_SIDE': 1,
			'LEFT_SIDE': 2,
			'NO_U_TURN': 3
		},
		LOCATION_TYPE: {
			'STOP': 0,
			'WAY_POINT': 1,
			'BREAK': 2
		},
		MIN_ROUTING_STOP_COUNT: 2,
		ERROR_MESSAGE: {
			NO_SOLUTION: "No solution found.",
			INVALID_LOCATION: "Invalid locations detected"
		},
		MANEUVER_TYPE: {
			STOP: "esriDMTStop",
			RAILROAD_STOP: "railroadStop",
			DEPART: "esriDMTDepart"
		}
	};
})();