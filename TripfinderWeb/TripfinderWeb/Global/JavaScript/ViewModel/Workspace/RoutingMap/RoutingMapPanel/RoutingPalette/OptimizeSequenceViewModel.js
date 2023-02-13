(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").OptimizeSequenceViewModel = OptimizeSequenceViewModel;

	function OptimizeSequenceViewModel(modal, oldTrip, newTrip, dataModel)
	{
		this.modal = modal;
		this.oldTrip = oldTrip;
		this.newTrip = newTrip;
		this.dataModel = dataModel;
	}

	OptimizeSequenceViewModel.prototype.init = function(viewModel, element)
	{
		this.$element = $(element);
		var oldDuration = this.getTripDuration(this.oldTrip);
		var newDuration = this.getTripDuration(this.newTrip);
		var durationDiff = ((oldDuration - newDuration) / 60).toFixed(1);
		if (durationDiff == '-0.0')
		{
			durationDiff = '0.0';
		}
		var durationDiffRate = oldDuration == 0 ? 'N/A' : (((Math.abs((oldDuration - newDuration) / oldDuration)) * 100).toFixed(0) + '%' + (durationDiff > 0 ? ' improvement' : ' change'));
		var distanceDiff = (this.oldTrip.Distance - this.newTrip.Distance).toFixed(2);
		if (distanceDiff == '-0.00')
		{
			distanceDiff = '0.00';
		}
		var distanceDiffRate = this.oldTrip.Distance == 0 ? 'N/A' : (((Math.abs(distanceDiff / this.oldTrip.Distance)) * 100).toFixed(0) + '%' + (distanceDiff > 0 ? ' improvement' : ' change'));
		this.initGaugeChart(this.getStudentCountList());
		this.initColumnChart("duration_canvas_column", (oldDuration / 60).toFixed(2), (newDuration / 60).toFixed(2), durationDiff, durationDiff + ' minutes', durationDiffRate, '    Time (min)');
		this.initColumnChart("distance_canvas_column", this.oldTrip.Distance.toFixed(2), this.newTrip.Distance.toFixed(2), distanceDiff, distanceDiff + ` ${tf.measurementUnitConverter.getUnits()}`, distanceDiffRate, `Distance (${tf.measurementUnitConverter.getShortUnits()})`);
	};

	OptimizeSequenceViewModel.prototype.getTripDuration = function(trip)
	{
		return Math.abs(convertToMoment(trip.ActualStartTime).diff(convertToMoment(trip.ActualEndTime), 's'));
	};

	OptimizeSequenceViewModel.prototype.getStudentCountList = function()
	{
		var lessThanFiveMinStudents = [];
		var fiveToTenMinStudents = [];
		var tenToQuarterMinStudents = [];
		var quarterToTwentyMinStudents = [];
		var twentyToHalfHourStudents = [];
		var moreThanHalfHourStudents = [];
		for (var i = 0; i < this.newTrip.TripStops.length; i++)
		{
			var time = Math.abs(moment(this.newTrip.TripStops[i].ActualStopTime, "HH:mm:ss").diff(moment(this.oldTrip.TripStops[i].ActualStopTime, "HH:mm:ss"), 'minutes'));
			if (time < 5)
			{
				lessThanFiveMinStudents = lessThanFiveMinStudents.concat(this.newTrip.TripStops[i].Students);
			}
			else if (time < 10 && time >= 5)
			{
				fiveToTenMinStudents = fiveToTenMinStudents.concat(this.newTrip.TripStops[i].Students);
			}
			else if (time < 15 && time >= 10)
			{
				tenToQuarterMinStudents = tenToQuarterMinStudents.concat(this.newTrip.TripStops[i].Students);
			}
			else if (time < 20 && time >= 15)
			{
				quarterToTwentyMinStudents = quarterToTwentyMinStudents.concat(this.newTrip.TripStops[i].Students);
			}
			else if (time <= 30 && time >= 20)
			{
				twentyToHalfHourStudents = twentyToHalfHourStudents.concat(this.newTrip.TripStops[i].Students);
			}
			else if (time > 30)
			{
				moreThanHalfHourStudents = moreThanHalfHourStudents.concat(this.newTrip.TripStops[i].Students);
			}
		}
		return [lessThanFiveMinStudents, fiveToTenMinStudents, tenToQuarterMinStudents, quarterToTwentyMinStudents, twentyToHalfHourStudents, moreThanHalfHourStudents];
	};

	OptimizeSequenceViewModel.prototype.initColumnChart = function(id, original, optimized, diff, diffText, diffRate, typeDescription)
	{
		var self = this;
		function drawColumn(canvasId, data_arr)
		{
			var c = self.$element.find('#' + canvasId)[0];
			var ctx = c.getContext("2d");

			// title
			ctx.fillStyle = "#333333";
			ctx.font = 'bold 11px Arial';
			ctx.fillText(typeDescription, 10, 23);

			var posX, posY;
			for (var i = 0; i < data_arr.length; i++)
			{
				posX = 90;
				posY = 40 + 31 * i;
				// name
				ctx.fillStyle = "#333333";
				ctx.font = '11px Arial';
				if (data_arr[i].text === 'Optimized')
				{
					ctx.font = 'bold 11px Arial';
				}
				ctx.fillText(data_arr[i].text, posX - 65, posY + 17);
				// rectangle
				ctx.fillStyle = data_arr[i].color;
				ctx.fillRect(posX, posY, 160 * data_arr[i].percent, 27);
				// number
				if (data_arr[i].percent > 0.04)
				{
					ctx.fillStyle = "#FFFFFF";
				}
				ctx.font = '13px Arial';
				ctx.fillText(data_arr[i].number, posX + 10, posY + 17);
			}

			ctx.fillStyle = diff > 0 ? "#399A14" : "#333333";
			ctx.font = '11px Arial';
			ctx.fillText(diffText, posX + 2, posY + 45);
			ctx.fillText(diffRate, posX + 2, posY + 65);

		}

		// params
		var max = Math.max(original, optimized);
		var data_arr = [{ percent: (original / max), color: "#777777", text: "     Original", number: original }, { percent: (optimized / max), color: (diff > 0 ? "#399A14" : "#333333"), text: "Optimized", number: optimized }];

		drawColumn(id, data_arr);
	};

	OptimizeSequenceViewModel.prototype.initGaugeChart = function(array)
	{
		var self = this;
		function drawCommunity(canvasId, data_arr, color_arr, count_arr, text_arr)
		{
			var c = self.$element.find('#' + canvasId)[0];
			var ctx = c.getContext("2d");
			var elements = [];

			// Add event listener for `click` events.
			c.addEventListener('click', function(event)
			{
				var elementPostion = c.getBoundingClientRect();
				var elemLeft = elementPostion.left;
				var elemTop = elementPostion.top;
				var x = event.pageX - elemLeft,
					y = event.pageY - elemTop;

				// Collision detection between clicked offset and element.
				for (var i = 0; i < elements.length; i++)
				{
					if (y > elements[i].top && y < elements[i].top + elements[i].height
						&& x > elements[i].left && x < elements[i].left + elements[i].width)
					{
						if (array[i].length > 0)
						{
							var documentData = new TF.Document.DocumentData(TF.Document.DocumentData.Grid,
								{
									gridType: 'student',
									isTemporaryFilter: !event.shiftKey && !event.ctrlKey,
									gridState: {
										gridFilterId: null,
										filteredIds: array[i].map(function(s) { return s.id || s.Id })
									}
								});
							tf.documentManagerViewModel.add(documentData, event.shiftKey || event.ctrlKey, true, "", true, event.shiftKey);
							if (!event.shiftKey && !event.ctrlKey)
							{
								self.modal.negativeClick();
							}
						}
						break;
					}
				}

			}, false);

			c.addEventListener("mousemove", function(event)
			{
				var elementPostion = c.getBoundingClientRect();
				var elemLeft = elementPostion.left;
				var elemTop = elementPostion.top;
				var x = event.pageX - elemLeft,
					y = event.pageY - elemTop;

				var isInactiveArea = false;
				// Collision detection between clicked offset and element.
				for (var i = 0; i < elements.length; i++)
				{
					if (y > elements[i].top && y < elements[i].top + elements[i].height
						&& x > elements[i].left && x < elements[i].left + elements[i].width)
					{
						if (array[i].length > 0)
						{
							isInactiveArea = true;
						}
						break;
					}
				}

				if (isInactiveArea)
				{
					c.style.cursor = 'pointer';
				}
				else
				{
					c.style.cursor = 'default';
				}

			}, false);

			for (var i = 0; i < data_arr.length; i++)
			{
				var posX = 27 + 41 * i;
				var posY = 27 + (1 - data_arr[i]) * 245;
				ctx.fillStyle = color_arr[i];
				var height = (data_arr[i] == 0) ? 1 : (245 * data_arr[i]);
				ctx.fillRect(posX, posY, 40, height);

				ctx.fillStyle = '#333333';
				ctx.font = '11px Arial';
				ctx.fillText(text_arr[i], posX + 8, 290);

				ctx.font = '13px Arial';
				var textX = count_arr[i] < 10 ? posX + 17 : posX + 12;
				// if (data_arr[i] > 0.07)
				// {
				// 	ctx.fillStyle = '#FFFFFF';
				// 	ctx.fillText(count_arr[i], textX, posY + 15);
				// }
				// else
				// {
				ctx.fillStyle = '#333333';
				ctx.fillText(count_arr[i], textX, posY - 5);
				// }

				// Add element.
				elements.push({
					width: 40,
					height: height + 20,
					top: posY - 20,
					left: posX
				});
			}

		}

		// params
		var lessThanFiveMinStudents = array[0];
		var fiveToTenMinStudents = array[1];
		var tenToQuarterMinStudents = array[2];
		var quarterToTwentyMinStudents = array[3];
		var twentyToHalfHourStudents = array[4];
		var moreThanHalfHourStudents = array[5];
		var max = Math.max(lessThanFiveMinStudents.length, fiveToTenMinStudents.length, tenToQuarterMinStudents.length, quarterToTwentyMinStudents.length, twentyToHalfHourStudents.length, moreThanHalfHourStudents.length);
		var data_arr = max == 0 ? [0, 0, 0, 0, 0, 0] : [lessThanFiveMinStudents.length / max, fiveToTenMinStudents.length / max, tenToQuarterMinStudents.length / max, quarterToTwentyMinStudents.length / max, twentyToHalfHourStudents.length / max, moreThanHalfHourStudents.length / max];
		var color_arr = ["#F9DBA9", "#F8D294", "#F6CA7F", "#F5BD61", "#F3AF44", "#F2A533"];
		var count_arr = [lessThanFiveMinStudents.length, fiveToTenMinStudents.length, tenToQuarterMinStudents.length, quarterToTwentyMinStudents.length, twentyToHalfHourStudents.length, moreThanHalfHourStudents.length];
		var text_arr = [' < 5 ', ' 5-10', '11-15', '16-20', '21-30', ' > 30 '];

		drawCommunity("canvas_community", data_arr, color_arr, count_arr, text_arr);
	};

	OptimizeSequenceViewModel.prototype.apply = function()
	{
		return Promise.resolve(true);
	};

	OptimizeSequenceViewModel.prototype.cancel = function()
	{
		return Promise.resolve(false);
	};

	OptimizeSequenceViewModel.prototype.saveAsNewClick = function(viewModel, e)
	{
		return Promise.resolve('SaveAsNew');
	};

})();