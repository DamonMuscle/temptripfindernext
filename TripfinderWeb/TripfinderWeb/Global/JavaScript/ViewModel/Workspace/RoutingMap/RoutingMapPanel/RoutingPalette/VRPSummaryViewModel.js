(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").VRPSummaryViewModel = VRPSummaryViewModel;

	function VRPSummaryViewModel(options)
	{
		var self = this;
		self.options = options;
		self.newTrips = options.newTrips.sort(function(a, b) { return a.name > b.name ? 1 : -1; });
		self.oldTrips = options.oldTrips.sort(function(a, b) { return a.name > b.name ? 1 : -1; });
		self.obData = ko.observableArray([]);
		self.obTotal = ko.observable({});
		self.notSolved = {
			students: ko.observable(0),
			stops: ko.observable(0)
		};
	}

	VRPSummaryViewModel.prototype.init = function(model, element)
	{
		$(element).closest(".modal-dialog").width(720);
		var self = this;
		var array = [];
		var total = this.getEntityModel();
		var newIndex = 1;
		var deleteStops = 0;
		for (var i = 0; i < self.newTrips.length; i++)
		{
			var oldTrip = self.oldTrips[i];
			var newTrip = self.newTrips[i];
			var trip = self.getEntityModel();
			var isDelete = newTrip.stops <= 1;
			trip.isDelete = isDelete;
			trip.isNew = false;
			if (isDelete)
			{
				deleteStops += newTrip.stops;
			}
			if (oldTrip)
			{
				var oldDistance = tf.math.round(oldTrip.distance, 2);
				total.students.old += parseInt(oldTrip.students);
				total.stops.old += parseInt(oldTrip.stops);
				total.time.old += parseInt(oldTrip.time);
				total.distance.old += oldDistance;
				trip.students.old = oldTrip.students;
				trip.stops.old = oldTrip.stops;
				trip.time.old = oldTrip.time;
				trip.distance.old = oldDistance;
				trip.name = oldTrip.name;
			} else
			{
				trip.students.old = "--";
				trip.stops.old = "--";
				trip.time.old = "--";
				trip.distance.old = "--";
				trip.isNew = true;
				trip.name = "New Trip " + newIndex;
				newIndex++;
			}

			var newDistance = tf.math.round(newTrip.distance, 2);
			total.students.new += parseInt(newTrip.students);
			total.stops.new += parseInt(newTrip.stops);
			total.time.new += parseInt(newTrip.time);
			total.distance.new += newDistance;

			trip.students.new = newTrip.students;
			trip.stops.new = newTrip.stops;
			trip.time.new = newTrip.time;
			trip.distance.new = newDistance;
			this.setDisplayInfo(trip, isDelete);

			array.push(trip);
		}
		self.obData(array);
		total.distance.old = tf.math.round(total.distance.old, 2);
		total.distance.new = tf.math.round(total.distance.new, 2);
		this.setDisplayInfo(total);
		self.obTotal(total);
		self.notSolved.students(total.students.old - total.students.new);
		var notSolveStops = (total.stops.old - self.oldTrips.length * 2) - (total.stops.new - self.newTrips.length * 2) - deleteStops; // total.stops.old - 2 - (total.stops.new - array.length * 2);
		self.notSolved.stops(notSolveStops);
		self.options.onUiInit && self.options.onUiInit();
	};

	VRPSummaryViewModel.prototype.getEntityModel = function()
	{
		var obj = {};
		this.allTypes().forEach(function(key)
		{
			obj[key] = {
				message: "",
				style: "",
				color: "",
				old: 0,
				new: 0
			};
		});
		return obj;
	};

	VRPSummaryViewModel.prototype.setDisplayInfo = function(obj, isDelete)
	{
		var self = this;
		self.allTypes().forEach(function(key)
		{
			if (!isDelete)
			{
				var info = self.getDisplayInfo(obj[key].old, obj[key].new, key);
				obj[key].message = info.message;
				obj[key].style = info.style;
				obj[key].color = info.color;
			} else
			{
				obj[key].style = "";
				obj[key].new = obj[key].new || "";
			}
		});
	};

	VRPSummaryViewModel.prototype.allTypes = function()
	{
		return ["students", "stops", "time", "distance"];
	};

	VRPSummaryViewModel.prototype.getDisplayInfo = function(oldValue, newValue, type)
	{
		if (oldValue && newValue)
		{
			oldValue = parseFloat(oldValue);
			newValue = parseFloat(newValue);
		}
		if (oldValue == newValue)
		{
			return { message: "No change", style: "black", color: "black" };
		}

		var isStudentsOrStops = type == "students" || type == "stops";
		var color, text = "";
		var baseValue = oldValue || newValue || 100;
		if (oldValue > newValue)
		{
			color = isStudentsOrStops ? "black" : "green";
			text = isStudentsOrStops ? "change" : "improvement";
			return { message: parseInt(100 * (oldValue - newValue) / baseValue) + "% " + text, style: "down " + color, color: color };
		}
		if (oldValue < newValue)
		{
			color = isStudentsOrStops ? "green" : "black";
			text = isStudentsOrStops ? "improvement" : "change";
			return { message: parseInt(100 * (newValue - oldValue) / baseValue) + "% " + text, style: "up " + color, color: color };
		}
		return { message: "", style: "", color: "" };
	};

	VRPSummaryViewModel.prototype.apply = function()
	{
		return Promise.resolve(true);
	};

	VRPSummaryViewModel.prototype.openInNewClick = function()
	{
		return Promise.resolve("OpenInNewMap");
	};

})();