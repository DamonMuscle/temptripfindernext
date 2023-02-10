(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette.Events").FileEvent = FileEvent;

	function FileEvent(eventsManager, routeState, dataModel, viewModel)
	{
		FileEvent.superclass.constructor.call(this, eventsManager, dataModel);
		this.viewModel = viewModel;
	}
	TF.extend(FileEvent, TF.RoutingMap.EventBase, {
		settingsClick: function()
		{
			console.trace();
			tf.modalManager.showModal(new TF.RoutingMap.MapEditingPalette.MapEditingSettingsModalViewModel(this.dataModel));
		},
		saveClick: function(e)
		{

		},
		revertClick: function(e)
		{

		},
		// imortDataClick: function()
		// {
		// 	var self = this;
		// 	var serviceDirectory = encodeURIComponent(arcgisUrls.RESTServices.ServiceDirectory + 'RoutefinderPlusDubai/shpToSql2/GPServer/Script/execute?f=pjson&Input_Shapefile=');
		// 	tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), 'mapdata/convertDataFromMapInfo?type=parcels&service=' + serviceDirectory))
		// 		.then(function(result)
		// 		{
		// 			if (result !== '')
		// 			{
		// 				self.viewModel._viewModal.obToastMessages.push(
		// 					{
		// 						type: 'error',
		// 						content: result,
		// 						autoClose: true
		// 					})
		// 				return;
		// 			}
		// 			var intervalID = setInterval(function()
		// 			{
		// 				tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), 'mapdata/checkconvertstatus')).then(function(status)
		// 				{
		// 					if (status == 'Done' || status == 'Failed')
		// 					{
		// 						clearInterval(intervalID);
		// 						self.viewModel._viewModal.obToastMessages.splice(-1, 1);
		// 						self.viewModel._viewModal.obToastMessages.push(
		// 							{
		// 								type: status == 'Done' ? 'success' : 'error',
		// 								content: 'Convert ' + status,
		// 								autoClose: true
		// 							})
		// 						// alert(status);
		// 					}
		// 					else
		// 					{
		// 						self.viewModel._viewModal.obToastMessages.splice(-1, 1);
		// 						self.viewModel._viewModal.obToastMessages.push(
		// 							{
		// 								type: 'success',
		// 								content: 'Converting...'
		// 							})
		// 					}
		// 				})
		// 			}, 1000);
		// 		});
		// }
	});
})();