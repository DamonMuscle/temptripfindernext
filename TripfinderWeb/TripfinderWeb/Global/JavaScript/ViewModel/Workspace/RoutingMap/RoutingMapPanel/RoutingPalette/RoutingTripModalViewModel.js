/***
 * 3 entrances to invoke this module
 * 1.click 'New' in the palette level(subitem of folder icon) to create a new Field Trip(it's removed in Tripfinder Next)
 * 2.click 'Optimize Sequence' in Field Trip level we will get a dialog who has a 'Save as New Field Trip' button
 * 3.click 'Info' in Field Trip level
 */
(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").RoutingTripModalViewModel = RoutingTripModalViewModel;

	function RoutingTripModalViewModel(options)
	{
		TF.Modal.BaseModalViewModel.call(this);

		this.sizeCss = "modal-dialog-lg modal-dialog-xl new-trip-dailog";
		this.contentTemplate("workspace/RoutingMap/RoutingMapPanel/RoutingPalette/RoutingTripModal");
		this.buttonTemplate("modal/PositiveNegativeOther");
		this.obOtherButtonLabel("Regenerate Directions");
		this.obOtherButtonVisible(false);
		this.obOtherButtonDisable(true);
		if (options.trip)
		{
			this.obPositiveButtonLabel("Apply");
			this.title("Edit Field Trip");
			if (options.trip.OpenType == "View")
			{
				this.title("View Field Trip");
				this.buttonTemplate("modal/Negative");
			}
		} else 
		{
			this.obPositiveButtonLabel("Create");
			this.title("New Field Trip");
			this.buttonTemplate("modal/PositiveNegative");
		}
		this.obNegativeButtonLabel("Cancel");
		this.viewModel = new TF.RoutingMap.RoutingPalette.RoutingTripViewModel({ ...options, obOtherButtonVisible: this.obOtherButtonVisible, obOtherButtonDisable: this.obOtherButtonDisable });
		this.data(this.viewModel);
		this.obResizable(false);
		this.isImperialUnit = tf.measurementUnitConverter.isImperial();
	}

	RoutingTripModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	RoutingTripModalViewModel.prototype.constructor = RoutingTripModalViewModel;

	RoutingTripModalViewModel.prototype.positiveClick = function()
	{
		const self = this;

		this.viewModel.apply().then(async function(result)
		{
			if (result)
			{
				var updatedResult = self.viewModel.getUpdatedStops(result);
				const routingDataModel = self.viewModel.dataModel;

				const addedStops = updatedResult[0];
				if (addedStops.length > 0)
				{
					addedStops.forEach(function(tripStop)
					{
						tripStop.FieldTripId = result.id;
						tripStop.DBID = result.DBID;
						tripStop.OpenType = "Edit";
						tripStop.type = "tripStop";
					});

					addedStops.forEach((stop) => {
						routingDataModel.fieldTripStopDataModel.insertTripStopToTrip(stop, stop.Sequence - 1);
					});
				}

				const updatedStops = updatedResult[1];
				if (updatedStops && updatedStops.length > 0)
				{
					updatedStops.forEach(function(tripStop)
					{
						tripStop.FieldTripId = result.id;
						tripStop.DBID = result.DBID;
						tripStop.OpenType = "Edit";
						tripStop.type = "tripStop";
					});

					routingDataModel.fieldTripStopDataModel.removeTripStopsFromTrip(updatedStops);

					updatedStops.forEach(stop => {
						routingDataModel.fieldTripStopDataModel.insertTripStopToTrip(stop, stop.Sequence - 1);
					});
				}

				// update map
				let savedStops = addedStops.concat(updatedStops);
				await routingDataModel.viewModel.routingPaletteVM.fieldTripMapOperation?.applyAddFieldTripStops(savedStops, () => {
					const fieldTripId = savedStops[0].FieldTripId;

					addedStops.forEach(data =>
					{
						data.StopTime = data.ActualStopTime;
						routingDataModel.fieldTripStopDataModel.insertToRevertData(data);
					});
		
					routingDataModel.changeTripVisibility(fieldTripId, true);
					routingDataModel.fieldTripStopDataModel.changeRevertStack(addedStops, false);
				});

				const deletedStops = updatedResult[2];
				if (deletedStops && deletedStops.length > 0)
				{
					deletedStops.forEach(async (stop) => {
						const data = { fieldTripId: stop.FieldTripId, fieldTripStopId: stop.id };
						// await routingDataModel.viewModel.routingPaletteVM.fieldTripMapOperation?.deleteStopLocation(result, stop);
						await routingDataModel.viewModel.routingPaletteVM.fieldTripMapOperation?.deleteStopLocation(stop.FieldTripId, stop.id);
					});
				}

				result = routingDataModel.getFieldTripById(result.FieldTripId);

				this.positiveClose(result);
			}
		}.bind(this));
	};

	RoutingTripModalViewModel.prototype.negativeClick = function()
	{
		var self = this;
		this.viewModel.cancel().then(function(result)
		{
			if (result)
			{
				self.hide();

				PubSub.publish(TF.RoutingPalette.FieldTripMapEventEnum.ClearHighlightFieldTripStop);

				var drawTool = self.viewModel.dataModel.fieldTripPaletteSectionVM.drawTool;

				if (drawTool)
				{
					drawTool._previewLayer.removeAll();
					drawTool._clearTempDrawing();
					drawTool.stopTool.clearCandidateGraphics();
				}
				

				self.resolve();
			}
		});
	};

	RoutingTripModalViewModel.prototype.otherClick = function()
	{
		this.viewModel.other();
	};

})();