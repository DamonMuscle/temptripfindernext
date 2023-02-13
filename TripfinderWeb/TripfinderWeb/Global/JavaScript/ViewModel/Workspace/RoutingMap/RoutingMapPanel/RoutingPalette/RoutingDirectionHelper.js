(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").RoutingDirectionHelper = RoutingDirectionHelper;

	function RoutingDirectionHelper()
	{
		this.totalDistance = 0;
		this.totalTime = 0;
	}

	RoutingDirectionHelper.prototype.getDirectionResult = function(tripStops, color)
	{
		let self = this, directionDetailList = [];
		let defaultSpeed = 18;// mi per hour
		if (tripStops == null || tripStops.length == 0)
		{
			return directionDetailList;
		}

		tripStops && tripStops.forEach(function(tripStop, i)
		{
			let isLast = i == tripStops.length - 1;
			let prevText = "";
			let speed = (tripStop.Speed || defaultSpeed) / 60;
			if (i == 0)
			{
				prevText = "Start";
			} else if (isLast)
			{
				prevText = "Finish";
			} else
			{
				prevText = "Arrive";
			}
			// add stop node
			directionDetailList.push(self.createDetail(prevText + " at " + tripStop.Street, undefined, tripStop.Sequence, self.getDirectionSymbol(null, true), 0, color, speed));

			// add direction info
			if (!isLast)
			{
				self.appendTripStopDirectionDetail(tripStop.DrivingDirections, speed, directionDetailList, tripStop.IsCustomDirection);
				self.totalDistance += tripStop.Distance;
			}
		});

		this.totalTime = convertToMoment(tripStops[tripStops.length - 1].StopTime).diff(convertToMoment(tripStops[0].StopTime), "seconds") ||
			convertToMoment(tripStops[tripStops.length - 1].ActualStopTime).diff(convertToMoment(tripStops[0].ActualStopTime), "seconds");

		return directionDetailList;
	};

	RoutingDirectionHelper.prototype.getDirectionSymbol = function(text, isStop)
	{
		if (isStop)
		{
			return directionSymbols.stop;
		}
		var textLowerCase = text && text.toLowerCase();
		var turnLeftIndex = textLowerCase.indexOf("left");
		var turnRightIndex = textLowerCase.indexOf("right");
		if (turnLeftIndex >= 0 && turnRightIndex >= 0)
		{
			if (turnLeftIndex < turnRightIndex)
			{
				return directionSymbols.turnLeftRight;
			} else
			{
				return directionSymbols.turnRightLeft;
			}
		}
		if (turnLeftIndex >= 0)
		{
			return directionSymbols.turnLeft;
		}
		if (turnRightIndex >= 0)
		{
			return directionSymbols.turnRight;
		}
		if (textLowerCase.indexOf("u-turn") >= 0)
		{
			return directionSymbols.uTurn;
		}
		if (textLowerCase.indexOf("ferry") >= 0)
		{
			return directionSymbols.ferry;
		}
		if (textLowerCase.indexOf("railroad") >= 0)
		{
			return directionSymbols.railroadStop;
		}
		return directionSymbols.straight;
	};

	/**
	* append direction detail
	*/
	RoutingDirectionHelper.prototype.appendTripStopDirectionDetail = function(drivingDirections, speed, directionDetailList, isCustomDirection)
	{
		function getSplitIndex(text)
		{
			let minOnIndex = text.indexOf(' on ');
			let minAtIndex = text.indexOf(' at ');
			if (minOnIndex < 0)
			{
				minOnIndex = minAtIndex;
			}
			else if (minAtIndex >= 0 && minOnIndex > minAtIndex)
			{
				minOnIndex = minAtIndex;
			}
			return minOnIndex >= 0 ? minOnIndex + 4 : minOnIndex;
		}

		if (!drivingDirections)
		{
			return;
		}
		const unit = tf.conversion
		let self = this, details = $.trim(drivingDirections).split(/\n|\r|( km. )|(WARNING CROSS OVER RAILROAD)/g);
		if (isCustomDirection)
		{
			directionDetailList.push(self.createDetail(drivingDirections, null, 0, self.getDirectionSymbol(drivingDirections), parseFloat(0), null, speed, isCustomDirection, drivingDirections));
		} else
		{
			details.forEach(function(detail, index, items)
			{
				if (detail === '' || detail === undefined || detail === " km. " || detail === ".")
				{
					return;
				}

				//RW-22377, if the direction detail just has number with 'mi.' (like '2.35 mi.'), it will be considered as invalid. 
				if (/^\d*\.?\d+$/.test($.trim(detail.replace("km.", ""))))
				{
					return;
				}

				if (index + 1 < items.length && items[index + 1] === " km. ")
				{
					detail = detail + " km.";
				}

				let distance = /[\+\-]?\d*\.?\d+(?:[Ee][\+\-]?\d+)? km/.exec(detail);
				if (distance == null)
				{
					distance = 0;
				}

				detail = detail.replace(/(Go)? [\+\-]?\d*\.?\d+(?:[Ee][\+\-]?\d+)? km/g, "").replace(".", "");

				let splitIndex = getSplitIndex(detail.toLowerCase()), readOnlyArea, editArea;
				if (splitIndex >= 0)
				{
					readOnlyArea = detail.slice(0, splitIndex);
					editArea = detail.slice(splitIndex);
				}
				else
				{
					readOnlyArea = detail;
				}
				directionDetailList.push(self.createDetail(readOnlyArea, editArea, 0, self.getDirectionSymbol(detail), parseFloat(distance), null, speed, isCustomDirection, drivingDirections));
			});
		}
	};

	RoutingDirectionHelper.prototype.createDetail = function(readOnlyArea, editArea, sequence, maneuverType, distance, color, speed, isCustomDirection, drivingDirections)
	{
		const self = this;
		var time = distance / speed;
		var directionDetailDataModel = new TF.DataModel.DirectionDetailDataModel({
			Instruction: editArea !== undefined ? readOnlyArea + editArea : readOnlyArea,
			ReadOnlyArea: $.trim(readOnlyArea) == "" ? "Go Straight" : readOnlyArea,
			EditArea: editArea !== undefined ? editArea : '',
			Sequence: sequence ? sequence : "",
			Type: maneuverType,
			Distance: distance != 0 ? this.formatDistanceString(distance) : '',
			Time: time != 0 ? this.formatTimeString(time) : '',
			Active: false,
			Text: editArea !== undefined ? readOnlyArea + editArea : readOnlyArea,
			Editable: editArea !== undefined
		});

		if (isCustomDirection)
		{
			directionDetailDataModel.isCustomDirection(isCustomDirection);
			directionDetailDataModel.editHtml(tf.measurementUnitConverter.unifyDirectionMeasurementUnit(drivingDirections, tf.measurementUnitConverter.isImperial()));
			directionDetailDataModel.editareaHeight(`${drivingDirections.split('\n').length * 30}px`);
			return directionDetailDataModel;
		}

		directionDetailDataModel.distanceNumber = distance;
		directionDetailDataModel.timeNumber = time;

		directionDetailDataModel.backgroundColor = color ? color : '#ccc';
		directionDetailDataModel.textColor = TF.isLightness(directionDetailDataModel.backgroundColor) ? "#000000" : "#ffffff";
		return directionDetailDataModel;
	};

	RoutingDirectionHelper.prototype.getTotalDistance = function()
	{
		return this.totalDistance;
	}

	RoutingDirectionHelper.prototype.getTotalTime = function()
	{
		return this.totalTime;
	}

	/**
	* Format the input time value for displaying.
	* @param {float} value The time value in minutes.
	* @returns {string} The formatted time string.
	*/
	RoutingDirectionHelper.prototype.formatTimeString = function(value)
	{
		if (value === 0) { return "0 sec"; }

		var second = Math.floor(value * 60 % 60),
			minute = Math.floor(value),
			minStr = minute + (minute > 1 ? " mins " : " min "),
			secStr = second + " sec ";

		return (minute > 0 ? minStr : "") + (second > 0 ? secStr : "");
	};

	RoutingDirectionHelper.prototype.formatDistanceString = function(value)
	{
		const feetOrMeter = tf.measurementUnitConverter.isImperial() ? "ft." : "m";
		const mileOrKilometer = tf.measurementUnitConverter.isImperial() ? "mi" : "km";
		let ftInMileOrMeterInKilometer = 1000;
		if(tf.measurementUnitConverter.isImperial()) {
			value = tf.measurementUnitConverter.convert({
				originalUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Metric,
				targetUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Imperial,
				precision: 5,
				value: value
			});
			// One mile equals to 5280 feet
			ftInMileOrMeterInKilometer = 5280;
		}

		if (value < 0.1)
		{
			return `${Math.floor(value * ftInMileOrMeterInKilometer)} ${feetOrMeter}`;
		}
		else
		{
			return `${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${mileOrKilometer}`;
		}
	};

	var directionSymbols = {
		unknown: "esriDMTUnknown",
		stop: "esriDMTDepart",
		straight: "esriDMTStraight",
		bearLeft: "esriDMTBearLeft",
		bearRight: "esriDMTBearRight",
		turnLeft: "esriDMTTurnLeft",
		turnRight: "esriDMTTurnRight",
		sharpLeft: "esriDMTSharpLeft",
		sharpRight: "esriDMTSharpRight",
		rampLeft: "esriDMTRampLeft",
		rampRight: "esriDMTRampRight",
		turnRightLeft: "esriDMTTurnRightLeft",
		turnLeftLeft: "esriDMTTurnLeftLeft",
		turnLeftRight: "esriDMTTurnLeftRight",
		turnRightRight: "esriDMTTurnRightRight",
		uTurn: "esriDMTUTurn",
		ferry: "esriDMTFerry",
		esriDMTHighwayMerge: "esriDMTHighwayMerge",
		esriDMTHighwayExit: "esriDMTHighwayExit",
		esriDMTHighwayChange: "esriDMTHighwayChange",
		esriDMTForkCenter: "esriDMTForkCenter",
		esriDMTForkLeft: "esriDMTForkLeft",
		esriDMTForkRight: "esriDMTForkRight",
		esriDMTTripItem: "esriDMTTripItem",
		EndOfFerry: "esriDMTEndOfFerry",
		railroadStop: "railroadStop",
		throughPoint: "throughPoint",
	};
})();