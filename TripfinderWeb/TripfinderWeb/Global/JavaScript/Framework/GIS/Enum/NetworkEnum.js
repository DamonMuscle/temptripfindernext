(function()
{
	createNamespace("TF.GIS").NetworkEnum =
	{
		CURB_APPROACH: {
			EITHER_SIDE: 0,
			RIGHT_SIDE: 1,
			LEFT_SIDE: 2,
			NO_U_TURN: 3
		},
		LOCATION_TYPE: {
			STOP: 0,
			WAY_POINT: 1,
			BREAK: 2
		},
		U_TURN_POLICY: {
			ALLOWED: 'allow-backtrack',
			INTERSECTION_AND_DEAD_ENDS_ONLY: 'at-dead-ends-and-intersections',
			DEAD_ENDS_ONLY: 'at-dead-ends-only',
			NOT_ALLOWED: 'no-backtrack'
		},
		SUPPORT_TRAVEL_MODE: {
			DRIVING_TIME: "Driving Time",
			DRIVING_DISTANCE: "Driving Distance",
			TRUCKING_TIME: "Trucking Time",
			TRUCKING_DISTANCE: "Trucking Distance",
			WALKING_TIME: "Walking Time",
			WALKING_DISTANCE: "Walking Distance",
			RURAL_DRIVING_TIME: "Rural Driving Time",
			RURAL_DRIVING_DISTANCE: "Rural Driving Distance"
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